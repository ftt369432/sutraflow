/**
 * Iterative (multi-pass) Brief Engine
 *
 * Why: a single prompt to a local 14B–32B model collapses a 20-page brief into an outline
 * (output-token ceiling + context dilution). This engine instead runs one focused pass per
 * section, carrying a rolling memory, then MEASURES each pass and retries thin ones.
 *
 * Guardrails (AGENTS.md): no invented facts ([FACT NEEDED] markers), verbatim-quotes-only
 * (Quote Guard against the verified authority bank), zero-PHI is the caller's responsibility
 * for cloud providers (local provider never leaves the machine).
 */

import { AUTHORITY_BANK, RHETORICAL_PERSONA, type AuthorityEntry } from './briefKnowledge';

export type LoopProvider = 'local' | 'gemini';

export interface SectionMetric {
  id: string;
  title: string;
  words: number;
  targetWords: number;
  ms: number;
  attempts: number;
  source: 'model' | 'pending';
  quotesStripped: number;
}

export interface LoopResult {
  markdown: string;
  metrics: SectionMetric[];
  provider: LoopProvider;
  model: string;
  totalMs: number;
  factGaps: string[];
}

interface SectionSpec {
  id: string;
  title: string;
  goal: string;
  minWords: number;
  authorities: string[];
}

const FACT_KEYS = [
  'APPLICANT', 'CASE_NOS', 'DEFENDANTS', 'JUDGE', 'TRIAL_DATE', 'SUBMISSION_DATE',
  'FILING_PARTY', 'FILING_PARTY_ADDRESS', 'DOC_TITLE', 'SIGNER'
] as const;

const SECTIONS: SectionSpec[] = [
  {
    id: 'intro', title: 'Introduction & Issues Presented', minWords: 180,
    authorities: ['lc5502d3', 'ccr10670', 'tuckerman'],
    goal: 'Open with "COMES NOW" for the filing party, cite the WCJ order/minutes that authorize the brief, then list the numbered issues this brief resolves (exclusion of defense exhibits under Labor Code § 5502(d)(3) and 8 CCR § 10670; admissibility of filing party\'s exhibits under Labor Code § 4620 and Chavarria; entitlement and amounts under Labor Code § 4622/§ 4600). State each issue as a thesis, not a topic.'
  },
  {
    id: 'facts', title: 'I. Procedural History & Stipulated Facts', minWords: 250, authorities: [],
    goal: 'Recite procedural posture, consolidation, admitted facts, stipulated values and the evidentiary reservation, using ONLY the record. Block-quote minutes language only if it appears verbatim in the record text.'
  },
  {
    id: 'point1ab', title: 'Point I.A–B: Discovery Closed; No Due Diligence', minWords: 450,
    authorities: ['lc5502d3', 'ccr10670', 'tuckerman'],
    goal: 'Argue that discovery closed at the MSC/PTCS, defendant listed only certain exhibits, made no showing of good cause, and every unlisted document was in defendant\'s possession long before closure (compute the elapsed time from record dates). Apply Tuckerman.'
  },
  {
    id: 'point1cd', title: 'Point I.C–D: Due Process & Exhibit-by-Exhibit Objections', minWords: 400,
    authorities: ['mcclanahan', 'ccr10670'],
    goal: 'Argue untimely service violates due process under McClanahan, then give a Markdown table of objections (Marked Exhibit | Description/Date | Specific Legal Objections) covering EVERY unlisted exhibit in the record, with possession-duration facts where the record gives dates.'
  },
  {
    id: 'point2', title: 'Point II: Admissibility of Filing Party\'s Exhibits', minWords: 550,
    authorities: ['chavarria', 'brower', 'youngLee', 'ccr10786e1', 'colamonico'],
    goal: 'Argue the defendant\'s own delay letter created a contested claim, apply Chavarria, Brower and Young Lee, show EOR waiver under 10786(e)(1) with service dates from the record, and defend each of the filing party\'s disputed exhibits in its own sub-heading.'
  },
  {
    id: 'point3', title: 'Point III: Entitlement to Reimbursement', minWords: 450,
    authorities: ['mccoy', 'knight', 'dubon2'],
    goal: 'Argue loss of medical control/neglect (McCoy, Knight), failure of timely Utilization Review (Dubon II), and reasonableness/necessity on the record medical evidence. Include the itemized accounting ONLY from stipulated/record figures and compute penalties/interest exactly as the record states; if a figure is not in the record write [FACT NEEDED: <figure>].'
  },
  {
    id: 'point4', title: 'Point IV: Costs & Sanctions; Prayer for Relief', minWords: 380,
    authorities: ['ccr10786i1'],
    goal: 'Argue bad-faith tactics tied to concrete record facts under Lab. Code § 5813 and 8 CCR § 10786(i)(1), request fees/costs/sanctions only in amounts present in the record, then end with a numbered WHEREFORE prayer mirroring every ruling requested above.'
  }
];

// ---------------------------------------------------------------- model callers

interface Caller { model: string; call: (system: string, user: string, maxTokens: number) => Promise<string>; }

function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^\s*<think>[\s\S]*$/i, '').trim();
}

async function resolveLocalModel(root: string): Promise<string> {
  const pinned = localStorage.getItem('genieflow_local_model');
  const res = await fetch(`${root}/api/tags`, { signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error(`Ollama /api/tags returned ${res.status}`);
  const names: string[] = ((await res.json()).models || []).map((m: any) => m.name);
  if (pinned && names.includes(pinned)) return pinned;
  const prefer = ['genieflow-expert:14b', 'qwen2.5:14b', 'qwen3.8:27b', 'deepseek-r1:14b', 'deepseek-r1:32b'];
  const hit = prefer.find((p) => names.includes(p));
  if (hit) return hit;
  const usable = names.find((n) => !/embed|llava|vision/i.test(n));
  if (!usable) throw new Error('No chat-capable model installed in Ollama');
  return usable;
}

async function makeLocalCaller(): Promise<Caller> {
  const base = (localStorage.getItem('genieflow_local_gpu_url') || 'http://localhost:11434/v1');
  const root = base.replace(/\/v1\/?$/, '').replace(/\/+$/, '');
  const model = await resolveLocalModel(root);
  return {
    model,
    call: async (system, user, maxTokens) => {
      const res = await fetch(`${root}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(240000),
        body: JSON.stringify({
          model,
          stream: false,
          keep_alive: '30m',
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
          // num_ctx is the fix for silent truncation: Ollama defaults to a small window.
          options: { temperature: 0.35, num_ctx: 16384, num_predict: maxTokens }
        })
      });
      if (!res.ok) throw new Error(`Local model HTTP ${res.status}`);
      const data = await res.json();
      return stripThinking(data.message?.content || '');
    }
  };
}

function makeGeminiCaller(): Caller {
  const model = localStorage.getItem('genieflow_gemini_model') || 'gemini-2.0-flash';
  return {
    model,
    call: async (system, user, maxTokens) => {
      const { geminiSimplifiedService } = await import('../gemini-simplified');
      const out = await geminiSimplifiedService.generateText(`${system}\n\n${user}`, {
        model, temperature: 0.35, maxTokens
      });
      return stripThinking(out || '');
    }
  };
}

// ---------------------------------------------------------------- guards

const norm = (s: string) =>
  s.toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\*\*/g, '')
    .replace(/\s+/g, ' ').trim();

const BANK_TEXT = norm(
  Object.values(AUTHORITY_BANK).map((a) => a.quote || '').join(' || ')
);

/** Replace any block quote with verified verbatim text from authority bank, or restore closest match */
export function applyQuoteGuard(markdown: string): { text: string; stripped: number; restored: number } {
  const lines = markdown.split('\n');
  const out: string[] = [];
  let stripped = 0;
  let restored = 0;

  const bankEntries = Object.values(AUTHORITY_BANK).filter(a => !!a.quote);

  for (let i = 0; i < lines.length; ) {
    if (!/^\s*>/.test(lines[i])) { out.push(lines[i]); i++; continue; }
    const run: string[] = [];
    while (i < lines.length && /^\s*>/.test(lines[i])) { run.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
    const body = norm(run.join(' ').replace(/^"|"$/g, ''));
    const fragments = body.split(/\.{3}|…/).map((f) => f.replace(/^["\s.]+|["\s.]+$/g, '')).filter((f) => f.length > 15);
    const exactMatch = fragments.length > 0 && fragments.every((f) => BANK_TEXT.includes(f));

    if (exactMatch) {
      run.forEach((r) => out.push(`> ${r}`));
    } else {
      // Find best match in verified bank (e.g. Tuckerman, McClanahan, LC § 5502)
      const matched = bankEntries.find(entry => {
        const entryNorm = norm(entry.quote || '');
        const citeKey = norm(entry.cite);
        return body.includes(citeKey.slice(0, 15)) || 
               fragments.some(frag => entryNorm.includes(frag.slice(0, 25))) ||
               entryNorm.includes(body.slice(0, 30));
      });

      if (matched && matched.quote) {
        restored++;
        out.push(`> "${matched.quote}"`);
      } else {
        stripped++;
        out.push('> [VERIFY QUOTE — removed: text not in verified authority bank. Pull verbatim from official source.]');
      }
    }
  }
  return { text: out.join('\n'), stripped, restored };
}

const wordCount = (s: string) => (s.match(/\S+/g) || []).length;

function authorityBlock(ids: string[]): string {
  if (!ids.length) return 'No block quotes are authorized for this section. Do not use any lines beginning with ">".';
  const parts = ids.map((id) => AUTHORITY_BANK[id]).filter(Boolean).map((a: AuthorityEntry) =>
    a.quote
      ? `- ${a.cite}\n  VERBATIM (the only text you may block-quote): "${a.quote}"\n  Holding: ${a.holding}`
      : `- ${a.cite}\n  NO verbatim text available — cite and describe the holding in your own words, NO block quote.\n  Holding: ${a.holding}`
  );
  return `AUTHORITY BANK for this section (cite exactly as written; block-quote ONLY the verbatim text shown):\n${parts.join('\n')}`;
}

// ---------------------------------------------------------------- engine

function parseFacts(raw: string): Record<string, string> {
  const facts: Record<string, string> = {};
  for (const k of FACT_KEYS) {
    const m = raw.match(new RegExp(`^\\s*${k}\\s*:\\s*(.+)$`, 'mi'));
    const v = m?.[1]?.trim();
    if (v && !/^(unknown|n\/a|not (stated|provided)|none)$/i.test(v)) facts[k] = v;
  }
  return facts;
}

export async function runIterativeBrief(params: {
  objective: string;
  evidenceText: string;
  provider: LoopProvider;
  practitionerBlock: string;
  onProgress?: (step: string) => void;
  onSection?: (partialMarkdown: string) => void;
}): Promise<LoopResult> {
  const t0 = Date.now();
  const { objective, provider, practitionerBlock, onProgress, onSection } = params;
  const evidence = params.evidenceText.slice(0, 14000);

  onProgress?.(provider === 'local' ? 'Connecting to local GPU model server...' : 'Connecting to Gemini...');
  const caller = provider === 'local' ? await makeLocalCaller() : makeGeminiCaller();
  onProgress?.(`Model online: ${caller.model}`);

  const baseSystem = `You are a California workers' compensation drafting clerk producing court-filing prose for a practitioner. ${practitionerBlock}

${RHETORICAL_PERSONA}

HARD RULES:
- Use ONLY facts present in the RECORD. If a needed fact is missing write [FACT NEEDED: <what>]. Never invent dates, amounts, names, exhibit letters or case numbers.
- Never fabricate or paraphrase inside a block quote. No greetings, no commentary, no chain-of-thought in output.
- Output Markdown for this section only. Do not repeat earlier sections.`;

  // Pass 0 — fact matrix
  onProgress?.('Pass 0 — extracting verified fact matrix from the record...');
  const factRaw = await caller.call(
    'You extract facts from legal records. Output ONLY lines of the form KEY: value. Use "unknown" if the record does not state it.',
    `Keys: ${FACT_KEYS.join(', ')}\n\nRECORD:\n${evidence}`,
    600
  );
  const facts = parseFacts(factRaw);
  const factGaps = FACT_KEYS.filter((k) => !facts[k]);
  const F = (k: string) => facts[k] || `[FACT NEEDED: ${k}]`;

  const caption = `# WORKERS' COMPENSATION APPEALS BOARD\n# STATE OF CALIFORNIA\n\n**${F('FILING_PARTY')}**  \n${F('FILING_PARTY_ADDRESS')}\n\n---\n\n\`\`\`\n${F('APPLICANT')}, Applicant,\n  v.\n${F('DEFENDANTS')}, Defendants.\n\nCASE NOS.: ${F('CASE_NOS')}\n${F('DOC_TITLE')}\nTRIAL: ${F('TRIAL_DATE')}   SUBMISSION: ${F('SUBMISSION_DATE')}\nJUDGE: ${F('JUDGE')}\n\`\`\`\n\n---\n\n### TO THE WORKERS' COMPENSATION APPEALS BOARD AND TO ALL INTERESTED PARTIES:\n`;

  const metrics: SectionMetric[] = [];
  const done: string[] = [];
  const memory: string[] = [];

  for (let i = 0; i < SECTIONS.length; i++) {
    const s = SECTIONS[i];
    onProgress?.(`Pass ${i + 1}/${SECTIONS.length} — ${s.title}`);
    const st = Date.now();
    const userPrompt = `OBJECTIVE: ${objective}

FACT MATRIX:\n${Object.entries(facts).map(([k, v]) => `${k}: ${v}`).join('\n') || '(none extracted)'}

SECTIONS ALREADY WRITTEN (do not repeat; stay consistent): ${memory.join(' | ') || 'none'}

${authorityBlock(s.authorities)}

RECORD:\n${evidence}

NOW WRITE ONLY: "${s.title}" (target at least ${s.minWords} words).
TASK: ${s.goal}`;

    let text = '';
    let attempts = 0;
    let source: SectionMetric['source'] = 'model';
    try {
      attempts++;
      text = await caller.call(baseSystem, userPrompt, 3072);
      // Measure → retry thin sections once with the draft in hand.
      if (wordCount(text) < s.minWords * 0.7) {
        attempts++;
        onProgress?.(`Pass ${i + 1} thin (${wordCount(text)}w) — expanding...`);
        text = await caller.call(
          baseSystem,
          `${userPrompt}\n\nYOUR PRIOR DRAFT WAS TOO THIN (${wordCount(text)} words; need ${s.minWords}+). Rewrite it fuller: apply each authority to specific record facts, add sub-points and consequences. PRIOR DRAFT:\n${text}`,
          3072
        );
      }
    } catch (e) {
      console.warn(`[IterativeBrief] section ${s.id} failed`, e);
    }

    let stripped = 0;
    if (!text || wordCount(text) < 40) {
      source = 'pending';
      text = `## ${s.title}\n\n[SECTION PENDING — model produced no usable text for this section. Re-run this pass.]`;
    } else {
      const g = applyQuoteGuard(text);
      text = g.text;
      stripped = g.stripped;
    }

    done.push(text);
    memory.push(s.title);
    metrics.push({
      id: s.id, title: s.title, words: wordCount(text), targetWords: s.minWords,
      ms: Date.now() - st, attempts, source, quotesStripped: stripped
    });
    onSection?.([caption, ...done].join('\n\n'));
  }

  const signature = `\n\n---\n\nDated: ${F('SUBMISSION_DATE')}  \nRespectfully submitted,\n\n_____________________________________________  \n**${F('FILING_PARTY')}**  \n${F('SIGNER')}\n`;
  const markdown = [caption, ...done].join('\n\n') + signature;

  return { markdown, metrics, provider, model: caller.model, totalMs: Date.now() - t0, factGaps };
}
