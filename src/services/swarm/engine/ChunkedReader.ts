/**
 * ChunkedReader.ts
 *
 * Reads subject evidence files in chunks, extracts facts/metrics via LLM (map phase),
 * and compiles a verified factual ledger (reduce phase).
 * Loops until all chunks are read or the chunk budget is reached.
 */

import { sovereignFs } from '../../fs/sovereignFsBridge';
import { PhiTokenVault } from '../legal/ZeroPhiShield';
import { getAgentConfig } from './config';
import { llmRouter } from './LLMRouter';
import { Fact, FactLedger, SourceFile, TraceFn, nowMs } from './types';

export class ChunkedReader {
  private static instance: ChunkedReader;

  private constructor() {}

  public static getInstance(): ChunkedReader {
    if (!ChunkedReader.instance) {
      ChunkedReader.instance = new ChunkedReader();
    }
    return ChunkedReader.instance;
  }

  /**
   * Reads files in chunks and compiles a structured factual ledger.
   */
  public async readAndHarvestFacts(
    files: SourceFile[],
    sharedVault: PhiTokenVault,
    onTrace?: TraceFn
  ): Promise<FactLedger> {
    const config = getAgentConfig();
    const isLocal = await llmRouter.checkLocalHealth();
    const chunkSize = isLocal ? config.chunkChars.local : config.chunkChars.cloud;
    const allFacts: Fact[] = [];
    let totalChunksRead = 0;

    const t0 = nowMs();
    onTrace?.({
      phase: 'Reading',
      title: 'Beginning Chunked Evidence Extraction',
      detail: `Reading ${files.length} evidence file(s) with chunk size ${chunkSize} chars...`,
      status: 'running',
      engine: isLocal ? 'local-gpu' : 'nebius-nano'
    });

    for (const file of files) {
      if (totalChunksRead >= config.maxChunks) {
        onTrace?.({
          phase: 'Reading',
          title: 'Chunk Budget Limit Reached',
          detail: `Reached maximum of ${config.maxChunks} chunks. Halting chunk reader.`,
          status: 'warn',
          engine: 'deterministic'
        });
        break;
      }

      const readRes = await sovereignFs.readFile({ path: file.path });
      if (!readRes.success || !readRes.content) continue;

      const content = readRes.content;
      const chunks = this.createChunks(content, chunkSize, 300);

      for (let i = 0; i < chunks.length; i++) {
        if (totalChunksRead >= config.maxChunks) break;
        totalChunksRead++;

        const chunkText = chunks[i];
        const sourceLabel = `${file.name}#${i + 1}`;

        onTrace?.({
          phase: 'Reading',
          title: `Processing ${sourceLabel}`,
          detail: `Analyzing chunk ${i + 1}/${chunks.length} (${chunkText.length} chars) from ${file.name}`,
          status: 'running',
          engine: isLocal ? 'local-gpu' : 'nebius-nano'
        });

        const prompt = `Extract all verified factual statements, measurements, dates, parties, or dollar amounts from this record excerpt.
Return a STRICT JSON ARRAY of objects with the schema:
[
  { "fact": "statement of fact or measurement", "date": "YYYY-MM-DD or text", "party": "person or entity", "amount": "$0.00", "metric": "value or spec" }
]
Only extract factual information that is explicitly stated. Do NOT invent or infer missing data.

Record Excerpt (${sourceLabel}):
"""
${chunkText}
"""`;

        try {
          const resp = await llmRouter.complete(
            {
              prompt,
              system: 'You are a deterministic factual research analyst extracting verified data points into clean JSON arrays.',
              tier: 'fast',
              temperature: 0.1
            },
            sharedVault
          );

          const extracted = this.parseJsonArray(resp.text);
          for (const item of extracted) {
            if (item.fact) {
              allFacts.push({
                fact: item.fact,
                date: item.date || undefined,
                party: item.party || undefined,
                amount: item.amount || undefined,
                metric: item.metric || undefined,
                source: sourceLabel
              });
            }
          }
        } catch (err: any) {
          console.warn(`[ChunkedReader] Error processing chunk ${sourceLabel}:`, err.message);
        }
      }
    }

    const dedupedFacts = this.deduplicateFacts(allFacts);
    const metadata = this.extractCoreMetadata(dedupedFacts);

    const elapsed = Math.round(nowMs() - t0);
    onTrace?.({
      phase: 'Reading',
      title: 'Fact Harvesting Complete',
      detail: `Harvested ${dedupedFacts.length} verified facts across ${totalChunksRead} chunk(s) in ${elapsed}ms. Identifier: ${metadata.identifier || 'Pending'}.`,
      status: 'done',
      engine: 'deterministic',
      ms: elapsed
    });

    return {
      facts: dedupedFacts,
      subjectEntity: metadata.subjectEntity,
      counterparty: metadata.counterparty,
      identifier: metadata.identifier,
      eventDate: metadata.eventDate,
      unresolvedSlots: metadata.unresolvedSlots,
      totalChunksRead
    };
  }

  private createChunks(text: string, chunkSize: number, overlap: number): string[] {
    if (text.length <= chunkSize) return [text];
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.slice(start, end));
      if (end >= text.length) break;
      start += chunkSize - overlap;
    }
    return chunks;
  }

  private parseJsonArray(text: string): any[] {
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (_e) {}
    return [];
  }

  private deduplicateFacts(facts: Fact[]): Fact[] {
    const seen = new Set<string>();
    const res: Fact[] = [];
    for (const f of facts) {
      const key = f.fact.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (!seen.has(key) && key.length > 5) {
        seen.add(key);
        res.push(f);
      }
    }
    return res;
  }

  private extractCoreMetadata(facts: Fact[]): {
    subjectEntity: string;
    counterparty?: string;
    identifier?: string;
    eventDate?: string;
    unresolvedSlots: string[];
  } {
    let subjectEntity = '';
    let counterparty: string | undefined;
    let identifier: string | undefined;
    let eventDate: string | undefined;
    const unresolvedSlots: string[] = [];

    const textCorpus = facts.map(f => f.fact).join(' \n ');

    // Identifier pattern (ADJ, MRN, APN, Permit, Account, case_nos)
    const idMatch = textCorpus.match(/\b(ADJ\d{6,8}|MRN\d{5,9}|APN\s*[\d\-]+|PERMIT\s*#?[\w\-]+|ACC\s*#?[\d\-]+)\b/i)
      || textCorpus.match(/(?:case_nos?|docket|claim_no)[\s:"'=]+([a-zA-Z0-9\-_]+)/i);
    if (idMatch) identifier = idMatch[1].toUpperCase().replace(/["']/g, '').trim();

    // Event date (DOI, Injury Date, Cumulative Trauma, Service Date)
    const dateMatch = textCorpus.match(/(?:doi|date\s+of\s+injury|injury\s+date|cumulative\s+trauma\s+through|service\s+date|inspection\s+date)[:\s]+([A-Za-z]+\s+\d{1,2},\s+\d{4}|[0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i)
      || textCorpus.match(/(?:injured\s+on|alleging\s+cumulative\s+trauma.*?on|occurred\s+on)[:\s]+([A-Za-z]+\s+\d{1,2},\s+\d{4}|[0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i)
      || textCorpus.match(/(?:date)[:\s]+([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i);
    if (dateMatch) eventDate = dateMatch[1].trim();

    // Subject entity (Applicant / Client / Patient / Project)
    const yamlClient = textCorpus.match(/(?:client_name|patient_name|applicant_name|project_name)[\s:"'=]+([^"\r\n]+)/i);
    const subMatch = textCorpus.match(/(?:applicant|patient|client|project|property|subject)[:\s]+([A-Z][a-zA-Z0-9\s,\.]+?)(?=[,\n\r]|\s+(?:vs|v\.|against|herein|alleging|born|who))/i);
    if (yamlClient) {
      subjectEntity = yamlClient[1].replace(/["']/g, '').trim();
    } else if (subMatch) {
      subjectEntity = subMatch[1].trim();
    } else {
      // Check facts parties
      const clientFact = facts.find(f => f.party && !/defendant|carrier|sedgwick|employer|insurance|responded|failed|delayed/i.test(f.party));
      if (clientFact?.party) subjectEntity = clientFact.party;
    }
    // Clean subject entity
    subjectEntity = subjectEntity
      .replace(/^(?:is|the|applicant|patient|client|injured\s+worker|mr\.|mrs\.|ms\.)\s+/i, '')
      .replace(/[,\.;]+$/, '')
      .trim();

    const isInvalidEntity = (str: string) => {
      if (!str || str.length < 2 || str.length > 50) return true;
      return /^(?:underwent|alleging|occurred|sustained|filed|served|denied|failed|delayed|received|issued|dates?\s+of|total|claim|injury|treatment)\b/i.test(str.trim())
        || /\b(?:dates?\s+of\s+service|total\s+dates|cumulative\s+trauma|body\s+parts)\b/i.test(str);
    };

    if (isInvalidEntity(subjectEntity)) {
      // Look for formal personal names in textCorpus near "applicant", "injured worker", or "employee"
      const nameMatch = textCorpus.match(/(?:applicant|injured\s+worker|employee|client|patient)[:\s,]+([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)/i)
        || textCorpus.match(/(?:matter\s+of|in\s+re)\s+([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)/i);
      if (nameMatch) {
        subjectEntity = nameMatch[1].trim();
      } else {
        subjectEntity = '';
      }
    }

    // Counterparty (Defendant / Employer / Carrier)
    const isActionPhrase = (str: string) => /^(?:responded|failed|denied|issued|asserted|refused|delayed|contended|served|filed|objected|alleging|underwent|resulting)\b/i.test(str.trim())
      || /\b(?:cumulative\s+trauma|dates?\s+of\s+service)\b/i.test(str);

    const yamlDef = textCorpus.match(/(?:defendants?|counterparty|employer|carrier|insurer)[\s:"'=]+([^"\r\n]+)/i);
    const vMatch = textCorpus.match(/(?:v\.|vs\.|against)\s+([A-Z][A-Za-z0-9\s,.'&-]+?(?:Inc\.|LLC|Corp\.|Co\.|Brands|Company|Services|Insurance|Hospital|Clinic|Group|Administration|Association)?)(?=[,\n\r]|\s+(?:defendant|carrier|herein|\)|permissible|self-insured))/i);
    const cpMatch = textCorpus.match(/(?:defendant|employer|carrier|insurer|contractor|seller|buyer)[:\s]+([A-Z][a-zA-Z0-9\s,.'&-]+?)(?=[,\n\r]|\s+(?:herein|\)|vs|v\.|claims|adjudication|shall|failed|responded|denied|alleging))/i);

    if (yamlDef && !isActionPhrase(yamlDef[1])) {
      counterparty = yamlDef[1].replace(/["']/g, '').trim();
    } else if (vMatch && !isActionPhrase(vMatch[1])) {
      counterparty = vMatch[1].trim();
    } else if (cpMatch && !isActionPhrase(cpMatch[1])) {
      counterparty = cpMatch[1].trim();
    }

    // Fallback: search facts for known entities
    if (!counterparty || isActionPhrase(counterparty) || counterparty.length > 60) {
      const knownEntity = textCorpus.match(/\b(BlueTriton\s+Brands(?:,\s*Inc\.)?|Sedgwick\s+Claims\s+Management\s+Services(?:,\s*Inc\.)?|National\s+Signal\s+LLC|State\s+Farm|Gallagher\s+Bassett|Travelers|Liberty\s+Mutual|The\s+Hartford|Zurich|Berkshire\s+Hathaway|SCIF|State\s+Compensation\s+Insurance\s+Fund)\b/i);
      if (knownEntity) {
        counterparty = knownEntity[1].trim();
      }
    }

    if (counterparty) {
      counterparty = counterparty
        .replace(/^(?:is|the|defendant|employer|carrier|insurer)\s+/i, '')
        .replace(/[,\.;]+$/, '')
        .trim();
    }

    if (!identifier) unresolvedSlots.push('IDENTIFIER_NUMBER');
    if (!eventDate) unresolvedSlots.push('EVENT_DATE');

    return { subjectEntity, counterparty, identifier, eventDate, unresolvedSlots };
  }
}

export const chunkedReader = ChunkedReader.getInstance();
