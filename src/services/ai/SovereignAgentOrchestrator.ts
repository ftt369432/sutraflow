/**
 * Sovereign Agent Orchestrator
 * ============================================================================
 * Full-Parity Autonomous ReAct Cognitive Loop Engine for GenieFlow AI
 * 
 * Drives multi-turn reasoning, tool execution, self-correction, and final
 * deliverable synthesis using:
 * - NVIDIA Nemotron-3-Ultra-550b-a55b via Nebius AI Studio
 * - In-Browser & In-Electron Sovereign Tool Dispatcher (23 Tools)
 * - Real-Time Step-by-Step UI Progress Streaming
 * ============================================================================
 */

import { SOVEREIGN_TOOL_DEFINITIONS, executeSovereignTool } from '../mcp/McpToolRegistry';
import { nebiusTokenFactory } from './NebiusTokenFactoryService';
import { getEnv } from '../../config/env';
import { unwrapModelDeliverable, sanitizeTokenDegeneration } from '../../utils/deliverableUnwrapper';

export interface AgentStepProgress {
  turn: number;
  maxTurns: number;
  stage: 'thinking' | 'tool_call' | 'tool_result' | 'complete' | 'error';
  toolName?: string;
  toolArgs?: any;
  toolOutput?: string;
  thought?: string;
  content?: string;
}

export interface SovereignAgentOptions {
  model?: string;
  maxTurns?: number;
  temperature?: number;
  onProgress?: (step: AgentStepProgress) => void;
}

/**
 * Robustly parses text-formatted tool calls emitted by reasoning models
 * (e.g. DeepSeek-R1, Qwen-2.5, Nemotron) when they output pseudo-tool markdown
 * instead of native OpenAI function calling JSON.
 */
function extractTextToolCalls(text: string): any[] {
  if (!text) return [];
  const calls: any[] = [];
  let callId = 1;

  // 1. Check for XML format: <tool_call> ... </tool_call>
  const tagMatches = text.matchAll(/<tool_call>([\s\S]*?)<\/tool_call>/gi);
  for (const tm of tagMatches) {
    try {
      const parsed = JSON.parse(tm[1].trim());
      if (parsed.name) {
        calls.push({
          id: `call_txt_${Date.now()}_${callId++}`,
          type: 'function',
          function: {
            name: parsed.name,
            arguments: typeof parsed.arguments === 'string' ? parsed.arguments : JSON.stringify(parsed.arguments || {})
          }
        });
      }
    } catch (_) {}
  }
  if (calls.length > 0) return calls;

  // 2. Check for [Tool: <name>] or tool: <name>
  const toolPattern = /(?:\[Tool:\s*([a-zA-Z0-9_]+)\]|tool:\s*([a-zA-Z0-9_]+))/gi;
  const matches: Array<{ name: string; index: number; end: number }> = [];
  let m: RegExpExecArray | null;

  while ((m = toolPattern.exec(text)) !== null) {
    matches.push({
      name: m[1] || m[2],
      index: m.index,
      end: m.index + m[0].length
    });
  }

  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const nextStart = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const block = text.slice(cur.end, nextStart).trim();

    const args: Record<string, any> = {};

    // Check for JSON inside block
    const jsonM = block.match(/\{[\s\S]*?\}/);
    if (jsonM) {
      try {
        const parsed = JSON.parse(jsonM[0]);
        calls.push({
          id: `call_txt_${Date.now()}_${callId++}`,
          type: 'function',
          function: { name: cur.name, arguments: JSON.stringify(parsed) }
        });
        continue;
      } catch (_) {}
    }

    // Extract cmd / command
    const cmdM = block.match(/(?:cmd|command):\s*(?:"""([\s\S]*?)"""|'''([\s\S]*?)'''|"([\s\S]*?)"|'([\s\S]*?)'|([^\n\r]+(?:\n(?!\s*(?:\[?tool|path|file|query|start_line):)[^\n\r]+)*))/i);
    if (cmdM) {
      args.command = (cmdM[1] ?? cmdM[2] ?? cmdM[3] ?? cmdM[4] ?? cmdM[5] ?? '').trim();
    }

    // Extract path / file
    const pathM = block.match(/(?:path|targetFile|filePath|file):\s*(?:"""([\s\S]*?)"""|'''([\s\S]*?)'''|"([\s\S]*?)"|'([\s\S]*?)'|([^\s\n\r]+))/i);
    if (pathM) {
      args.path = (pathM[1] ?? pathM[2] ?? pathM[3] ?? pathM[4] ?? pathM[5] ?? '').trim();
    }

    // Extract query
    const queryM = block.match(/(?:query|q):\s*(?:"""([\s\S]*?)"""|'''([\s\S]*?)'''|"([\s\S]*?)"|'([\s\S]*?)'|([^\n\r]+))/i);
    if (queryM) {
      args.query = (queryM[1] ?? queryM[2] ?? queryM[3] ?? queryM[4] ?? '').trim();
    }

    // Extract content
    const contentM = block.match(/(?:content|body):\s*(?:"""([\s\S]*?)"""|'''([\s\S]*?)'''|"([\s\S]*?)"|'([\s\S]*?)'|([\s\S]+))/i);
    if (contentM) {
      args.content = (contentM[1] ?? contentM[2] ?? contentM[3] ?? contentM[4] ?? '').trim();
    }

    if (Object.keys(args).length > 0 || cur.name) {
      calls.push({
        id: `call_txt_${Date.now()}_${callId++}`,
        type: 'function',
        function: {
          name: cur.name,
          arguments: JSON.stringify(args)
        }
      });
    }
  }

  return calls;
}

export class SovereignAgentOrchestrator {
  private static instance: SovereignAgentOrchestrator;
  private latestWrittenFiles: Array<{ path: string; title: string; content: string }> = [];

  public static getInstance(): SovereignAgentOrchestrator {
    if (!SovereignAgentOrchestrator.instance) {
      SovereignAgentOrchestrator.instance = new SovereignAgentOrchestrator();
    }
    return SovereignAgentOrchestrator.instance;
  }

  public getLatestWrittenFiles(): Array<{ path: string; title: string; content: string }> {
    return this.latestWrittenFiles;
  }

  /**
   * Run an autonomous multi-turn ReAct mission with full tool parity.
   */
  public async executeMission(
    userObjective: string,
    options: SovereignAgentOptions = {}
  ): Promise<string> {
    const requestedMaxTurns = options.maxTurns || 50;
    const model = options.model || 'nvidia/Nemotron-3-Ultra-550b-a55b';
    const temperature = options.temperature ?? 0.15;
    const onProgress = options.onProgress;

    const apiKey = nebiusTokenFactory.getApiKey();
    
    if (!apiKey) {
      console.warn('Nebius API Key missing, attempting fallback or prompt generation.');
    }

    const systemPrompt = `You are the Sovereign Multi-Industry Autonomous Legal & Engineering Cortex. You think, act, and verify like a senior engineer and legal research clerk working in a terminal: you decide which tool fits the job, use it, read the result, and adapt.

YOUR TOOLS:
- list_dir: map a folder before assuming what is in it. Start here when a path or case folder is unfamiliar.
- view_file: read a file's exact contents. Use before quoting, editing, or summarizing any document. Never describe a file you have not opened.
- grep_search: find exact text/patterns across files. Use to locate a case number, section cite, or function across a folder fast.
- write_to_file: create a NEW working document (drafts, briefs, exhibits, scripts) in AI_GENERATED_DOCS/, CLIENTS/, brain/, or 02_OUTPUT/ only. Always provide full content.
- compile_pleading_docx: compile a California 28-line legal pleading markdown document into a conformed .docx Word document with Gutierrez Law Firm or Medland/Spectrum captions.
- run_command: execute Python/PowerShell for verified calculations, mathematical ratings, and statutory penalty audits.
- lookup_california_labor_code / crosswalk_8ccr_rule / lookup_med_legal_case: verified statutory and regulatory text.

YOUR ENVIRONMENT & WORKING DIRECTORIES (WINDOWS):
- Workspace root: 'C:\\Users\\Ftt\\genieflowai'
- Client records & exhibits: 'CLIENTS/', 'brain/', '02_OUTPUT/', or mounted Google Drive 'G:\\My Drive\\.GENIEFLOW_MASTER'.
- When exploring folders, use absolute Windows paths (e.g. 'C:\\Users\\Ftt\\genieflowai' or relative 'CLIENTS/') — NEVER use Linux '/home/user' or '~'.
- If a path is not found, immediately inspect the current working directory or query 'CLIENTS/'.

MULTI-DOCUMENT CREATION & WORKBENCH ARTIFACT PROTOCOL:
- You are empowered to create ONE OR MULTIPLE deliverables per mission. When a matter requires companion documents (e.g. Primary Petition + Verification / Declaration + Exhibit Packet Chronology + Fee Schedule Audit), call 'write_to_file' for EACH file with its dedicated path in 'AI_GENERATED_DOCS/' or 'CLIENTS/'.
- Every file you write is automatically mounted as an independent artifact tab in the user's Workbench Deliverable Viewport.
- After drafting a 28-line pleading in markdown, call 'compile_pleading_docx' to compile it directly into a court-ready .docx document.

PERSISTENT CASE MEMORY & CLIENT FACT FILE STANDARD:
- For every workers' compensation case or client file analyzed, you MUST maintain and prioritize the dedicated, persistent Markdown fact file ('CASE_ANALYSIS_AND_LIST_OF_FACTS_<NAME>.md' or 'CASE_FACTS.md') directly in that client's directory (e.g. 'G:\\My Drive\\00 ALLEN\\<CLIENT_NAME>\\' or 'AI_GENERATED_DOCS/<CLIENT_NAME>/').
- FORENSIC SCOPE: 1) Party directory, 2) Industrial injury profile, 3) PTP designations & revocations, 4) Medical chronology, 5) Itemized billing ledger, 6) Electronic billing audit trail (daisyBill/Jopari), 7) UR chronology (LC § 4610 / Sandhagen), 8) MPN compliance & notices, 9) Settlement non-binding status (Beverly Hills Multispecialty Group), and 10) Judicial orders & statutory deadlines.
- ZERO CROSS-CONTAMINATION: The client fact file serves as an immutable persistent memory anchor, preventing any bleed-over between different clients in active multi-turn conversations.

STRATEGIC EXECUTION & TOKEN BUDGETING (50 TURNS):
- You have up to 50 turns. Pace your execution strategically: spend 2–5 turns gathering evidence, verifying statutes, or running calculations, then transition directly into drafting.
- Do NOT burn tokens by repeatedly listing directories or querying web search when facts are already discovered.
- When reading large files, use view_file with start_line and end_line targeting relevant sections.
- ZERO TOKEN DEGENERATION: Output crisp, professional prose and valid legal citations. NEVER output repetitive filler punctuation, shorthand stutters, or incomplete sections.
- Deliver the complete, court-ready deliverable directly in your final synthesis.`;

    // 🧠 Phase 1: Pre-Flight Persistent Memory Retrieval
    let memoryGrounding = '';
    try {
      const memoryRaw = await executeSovereignTool('read_graph', {});
      const graph = typeof memoryRaw === 'string' ? JSON.parse(memoryRaw) : memoryRaw;
      const entities = graph?.entities || [];
      if (entities.length > 0) {
        const topEntities = entities.slice(0, 10);
        memoryGrounding = `\n\n[PERSISTENT MEMORY CONTEXT FROM PRIOR SESSIONS]:\n` +
          topEntities.map((e: any) => `- ${e.name} (${e.entityType || 'entity'}): ${(e.observations || []).slice(0, 2).join('; ')}`).join('\n');
        
        onProgress?.({
          turn: 0,
          maxTurns: requestedMaxTurns,
          stage: 'tool_call',
          toolName: 'read_graph',
          toolArgs: { query: 'Prior session memory context' }
        });
        onProgress?.({
          turn: 0,
          maxTurns: requestedMaxTurns,
          stage: 'tool_result',
          toolName: 'read_graph',
          toolOutput: `Loaded ${topEntities.length} persistent memory entities into active cortex context.`
        });
      }
    } catch (_memErr) {
      console.warn('Memory retrieval bypassed:', _memErr);
    }

    const messages: any[] = [
      { role: 'system', content: systemPrompt + (memoryGrounding ? memoryGrounding : '') },
      { role: 'user', content: userObjective }
    ];

    let maxTurns = requestedMaxTurns;
    console.log(`🚀 SovereignAgentOrchestrator: Initiating ReAct loop on ${model} (Max turns: ${maxTurns})`);

    let finalContent = '';
    let consecutiveListDirCount = 0;
    let consecutiveWebSearchCount = 0;
    let createdFilesCount = 0;
    const writtenFiles: Array<{ path: string; content: string; title: string }> = [];

    for (let turn = 1; turn <= maxTurns; turn++) {
      try {
        const payload: any = {
          model,
          messages,
          tools: SOVEREIGN_TOOL_DEFINITIONS,
          temperature,
          frequency_penalty: 0.35,
          presence_penalty: 0.15,
          max_tokens: 8192
        };

        const res = await fetch('https://api.studio.nebius.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Nebius API error (${res.status}): ${errText}`);
        }

        const data = await res.json();
        const choice = data.choices?.[0];
        const msg = choice?.message;

        if (!msg) {
          throw new Error('No message returned from model.');
        }

        // 🧠 Reasoning Tokens Extraction (reasoning_content or <think> tags)
        let thoughtText: string = (msg as any).reasoning_content || (msg as any).reasoning || '';
        let cleanText: string = msg.content || '';

        if (!thoughtText && cleanText.includes('<think>')) {
          const m = cleanText.match(/<think>([\s\S]*?)<\/think>/i);
          if (m) {
            thoughtText = m[1].trim();
            cleanText = cleanText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
          }
        }

        // Sanitize any token degeneration / stutter loops immediately
        cleanText = sanitizeTokenDegeneration(cleanText);
        msg.content = cleanText;

        // If reasoning tokens were provided, stream them to the live trace
        if (thoughtText) {
          onProgress?.({
            turn,
            maxTurns,
            stage: 'thinking',
            thought: thoughtText
          });
        } else if (cleanText && msg.tool_calls && msg.tool_calls.length > 0) {
          // Model narration preceding a tool call
          onProgress?.({
            turn,
            maxTurns,
            stage: 'thinking',
            thought: cleanText
          });
        }

        messages.push(msg);

        let toolCalls = msg.tool_calls;
        if (!toolCalls || toolCalls.length === 0) {
          const extracted = extractTextToolCalls(cleanText);
          if (extracted && extracted.length > 0) {
            console.log(`🔧 SovereignAgentOrchestrator: Extracted ${extracted.length} text-formatted tool calls from model output:`, extracted.map(e => e.function.name));
            toolCalls = extracted;
            msg.tool_calls = extracted;
          }
        }

        if (!toolCalls || toolCalls.length === 0) {
          const unwrapped = unwrapModelDeliverable(cleanText);
          const candidateContent = unwrapped.content || cleanText;

          // Check if this is an actual substantial deliverable or just an acknowledgment / plan preamble
          const isSubstantialDeliverable = 
            candidateContent.length > 350 ||
            /###|\b(pleading|petition|brief|memorandum|wcab|applicant|defendant|wcj|labor code|section|prayer for relief|penalty|awarded)\b/i.test(candidateContent);

          const isPreamble = 
            candidateContent.length < 300 &&
            /^(i will|let me|i am going to|i'll|searching|checking|analyzing|understood|under stood|ok, let me|sure, i will|to assist you|i need to)/i.test(candidateContent.trim());

          if (isPreamble && turn < maxTurns) {
            console.log(`⚠️ Model provided preamble instead of tool execution on turn ${turn}. Prompting model to execute tools and complete mission.`);
            messages.push({
              role: 'user',
              content: 'Do NOT just state your plan or acknowledge the prompt. Execute the necessary tools (list_dir, view_file, grep_search, write_to_file, run_command) and produce the complete, finished work product now.'
            });
            continue;
          }

          if (isSubstantialDeliverable || candidateContent.length > 200) {
            console.log(`✅ SovereignAgentOrchestrator: Completed autonomously in ${turn} turns with deliverable.`);
            finalContent = candidateContent;
            break;
          }
          
          if (turn < maxTurns) {
            messages.push({
              role: 'user',
              content: 'Continue and execute all necessary tools to complete the mission. Do not stop until the full deliverable is drafted.'
            });
            continue;
          }
        }

        // Execute tool calls in parallel for optimal throughput
        const toolPromises = toolCalls.map(async (tc: any) => {
          const fnName = tc.function.name;
          let args = {};
          try {
            args = typeof tc.function.arguments === 'string'
              ? JSON.parse(tc.function.arguments)
              : tc.function.arguments;
          } catch {
            args = {};
          }

          if (fnName === 'list_dir') {
            consecutiveListDirCount++;
          } else {
            consecutiveListDirCount = 0;
          }

          if (['search_web', 'search_courtlistener'].includes(fnName)) {
            consecutiveWebSearchCount++;
          } else {
            consecutiveWebSearchCount = 0;
          }

          if (['write_to_file', 'write_file', 'create_file', 'writeFile'].includes(fnName)) {
            createdFilesCount++;
            const filePath = (args as any).path || (args as any).filePath || (args as any).targetFile || (args as any).target_file || (args as any).file || 'document.md';
            const fileContent = (args as any).content ?? (args as any).fileContent ?? (args as any).data ?? (args as any).code ?? (args as any).text ?? (args as any).body ?? (args as any).markdown ?? '';
            const title = filePath.split(/[/\\]/).pop() || 'Deliverable Document';
            if (fileContent && typeof fileContent === 'string' && fileContent.trim().length > 0) {
              const existingIdx = writtenFiles.findIndex(f => f.path === filePath);
              if (existingIdx !== -1) {
                writtenFiles[existingIdx] = { path: filePath, content: fileContent, title };
              } else {
                writtenFiles.push({ path: filePath, content: fileContent, title });
              }
            }
          } else if (fnName === 'compile_pleading_docx') {
            createdFilesCount++;
            const outPath = (args as any).output_docx_path || (args as any).output || '';
            if (outPath) {
              const title = outPath.split(/[/\\]/).pop() || 'Compiled Pleading (.docx)';
              const existingIdx = writtenFiles.findIndex(f => f.path === outPath);
              if (existingIdx === -1) {
                writtenFiles.push({ path: outPath, content: `[Compiled Conformed Word Legal Pleading: ${outPath}]`, title });
              }
            }
          }

          onProgress?.({
            turn,
            maxTurns,
            stage: 'tool_call',
            toolName: fnName,
            toolArgs: args
          });

          console.log(`⚙️ Tool Action: ${fnName}`, args);
          const toolResult = await executeSovereignTool(fnName, args);
          let toolStr = typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult);

          // If the model has called list_dir 3+ times consecutively, inject strict navigation guidance
          if (consecutiveListDirCount >= 3) {
            toolStr += '\n\n[SYSTEM DIRECTIVE]: You have mapped sufficient directories. Stop listing folders. Open the target case document immediately using view_file or grep_search, or begin drafting the final legal deliverable using write_to_file.';
          }

          // If the model has called external web search / courtlistener 3+ times consecutively, inject strict drafting guidance
          if (consecutiveWebSearchCount >= 3) {
            toolStr += '\n\n[SYSTEM DIRECTIVE]: You have queried multiple external search endpoints. Sufficient legal authorities have been gathered. Stop issuing web searches and proceed immediately to draft the complete pleading or petition using write_to_file or outputting your final deliverable.';
          }

          onProgress?.({
            turn,
            maxTurns,
            stage: 'tool_result',
            toolName: fnName,
            toolOutput: toolStr
          });

          return {
            role: 'tool',
            tool_call_id: tc.id,
            content: toolStr
          };
        });

        const toolResponses = await Promise.all(toolPromises);
        messages.push(...toolResponses);

        // Strategic Context Budgeting: Prune/compact historical tool outputs older than 10 turns to avoid token burn
        if (messages.length > 18) {
          const preserveWindow = 10; // Keep last 10 messages (approx 5 active turns) at 100% full fidelity
          for (let mIdx = 2; mIdx < messages.length - preserveWindow; mIdx++) {
            const m = messages[mIdx];
            if (m.role === 'tool' && typeof m.content === 'string' && m.content.length > 500) {
              m.content = m.content.slice(0, 350) + `\n... [Earlier turn output compacted to protect context token budget; verified in session]`;
            }
          }
        }

        // Dynamic budget extension: allow extending up to 60 turns when actively creating deliverables
        if (turn === maxTurns && maxTurns < 60 && (createdFilesCount > 0 || toolCalls.some((tc: any) => ['view_file', 'run_command', 'write_to_file', 'compile_pleading_docx'].includes(tc.function.name)))) {
          console.log(`⚡ SovereignAgentOrchestrator: Extending ReAct loop dynamically to ${Math.min(60, maxTurns + 10)} turns to ensure total completion.`);
          maxTurns = Math.min(60, maxTurns + 10);
        }

      } catch (err: any) {
        console.error(`❌ SovereignAgentOrchestrator Turn ${turn} failed:`, err);
        onProgress?.({
          turn,
          maxTurns,
          stage: 'error',
          thought: `Error encountered: ${err.message}`
        });
        break;
      }
    }

    if (!finalContent || finalContent.trim() === 'Completed sovereign execution cycle.' || finalContent.length < 200) {
      // If the model exhausted turns exploring tools, prompt it for the final synthesis deliverable
      try {
        console.log('⚡ SovereignAgentOrchestrator: Forcing final deliverable synthesis pass...');
        const finalPromptMessages = [
          ...messages,
          {
            role: 'user',
            content: 'Synthesize and draft the COMPLETE, court-ready 28-line legal pleading / work product now based on all verified findings. You MUST output the entire document with complete caption, body, authorities, and prayer. Do NOT call any more tools or return placeholders.'
          }
        ];
        const synthRes = await fetch('https://api.studio.nebius.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            messages: finalPromptMessages,
            temperature: 0.2,
            frequency_penalty: 0.35,
            presence_penalty: 0.15,
            max_tokens: 8192
          })
        });
        if (synthRes.ok) {
          const synthData = await synthRes.json();
          const synthText = synthData.choices?.[0]?.message?.content || '';
          const unwrapped = unwrapModelDeliverable(synthText);
          if (unwrapped.content && unwrapped.content.length > 50) {
            finalContent = unwrapped.content;
          }
        }
      } catch (synthErr) {
        console.warn('Synthesis pass fallback failed:', synthErr);
      }
    }

    if (!finalContent) {
      const lastMsg = messages.filter(m => m.role === 'assistant').pop();
      const rawFallback = lastMsg?.content || 'Completed sovereign execution cycle.';
      const unwrapped = unwrapModelDeliverable(rawFallback);
      finalContent = unwrapped.content;
    }

    this.latestWrittenFiles = [...writtenFiles];

    // Auto-dispatch live canvas mounting event across workspaces for all written files and synthesis
    if (typeof window !== 'undefined') {
      try {
        // 1. Broadcast each distinct file written by the agent
        for (let fIdx = 0; fIdx < writtenFiles.length; fIdx++) {
          const f = writtenFiles[fIdx];
          window.dispatchEvent(new CustomEvent('genieflow:create-canvas', {
            detail: {
              id: `canvas_${Date.now()}_${fIdx}`,
              title: f.title || f.path.split(/[\\/]/).pop() || `Deliverable ${fIdx + 1}`,
              content: f.content,
              path: f.path,
              type: 'document',
              mimeType: f.path.endsWith('.md') ? 'text/markdown' : 'text/plain'
            }
          }));
        }

        // 2. ONLY broadcast finalContent as a canvas deliverable if NO files were written to disk.
        // When writtenFiles exist, finalContent is the conversational summary and discussion for the chat feed!
        if (writtenFiles.length === 0 && finalContent && finalContent.length > 250) {
          const unwrapped = unwrapModelDeliverable(finalContent);
          const cleanFinal = (unwrapped.content || finalContent).trim();
          const title = unwrapped.suggestedFileName || 'Master Synthesis & Strategy';
          window.dispatchEvent(new CustomEvent('genieflow:create-canvas', {
            detail: {
              id: `deliverable_${Date.now()}`,
              title,
              content: cleanFinal,
              type: 'document'
            }
          }));
        }
      } catch (canvasErr) {
        console.warn('Canvas auto-broadcast failed:', canvasErr);
      }
    }

    // 🧠 Phase 3: Autonomous Post-Mission Reflection & Memory Ingestion
    try {
      const entityMatches = finalContent.match(/(?:ADJ\d+|[A-Z][a-z]+ v\. [A-Z][a-z]+|Labor Code § \d+|8 CCR § \d+|penalty of \$[\d,]+|\b(?:AGNETICS|GenieFlow|SutraFlow|Spectrum|Medland|[A-Z][A-Z0-9_\-]{2,}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b)/g);
      if (entityMatches && entityMatches.length > 0) {
        const blacklist = new Set([
          'This', 'That', 'With', 'From', 'Have', 'When', 'What', 'Your', 'Their', 'These', 'Those',
          'United States', 'California', 'Executive Summary', 'Takeaway', 'Next Steps', 'Action Items',
          'Table', 'Figure', 'Section', 'Standard', 'Status', 'Option', 'Options', 'Tier', 'Tiers'
        ]);
        const unique = Array.from(new Set(entityMatches))
          .filter(u => u.length > 2 && !blacklist.has(u))
          .slice(0, 6);

        const newEntities = unique.map((u: string) => {
          let entityType = 'Domain_Concept';
          if (u.startsWith('ADJ')) entityType = 'WCAB_Claim';
          else if (u.includes('§')) entityType = 'Statutory_Authority';
          else if (u.includes(' v. ')) entityType = 'Legal_Precedent';
          else if (['AGNETICS', 'GENIEFLOW', 'SUTRAFLOW', 'SPECTRUM', 'MEDLAND'].some(b => u.toUpperCase().includes(b))) entityType = 'Enterprise_System';
          else if (u.includes(' ')) entityType = 'Project_Or_Workflow';
          else if (/^[A-Z0-9_\-]+$/.test(u)) entityType = 'Architecture_Module';

          return {
            name: u,
            entityType,
            observations: [`Synthesized from mission: "${userObjective.slice(0, 80)}..." on ${new Date().toLocaleDateString()}`]
          };
        });

        await executeSovereignTool('create_entities', { entities: newEntities });
        onProgress?.({
          turn: maxTurns,
          maxTurns,
          stage: 'tool_call',
          toolName: 'create_entities',
          toolArgs: { entities: newEntities.map(e => e.name) }
        });
        onProgress?.({
          turn: maxTurns,
          maxTurns,
          stage: 'tool_result',
          toolName: 'create_entities',
          toolOutput: `Saved ${newEntities.length} verified entities (${newEntities.map(e => e.name).join(', ')}) to Persistent Memory Graph.`
        });
      }
    } catch (_refErr) {
      console.warn('Memory reflection bypassed:', _refErr);
    }

    onProgress?.({
      turn: maxTurns,
      maxTurns,
      stage: 'complete',
      content: finalContent
    });

    return finalContent;

  }
}

export const sovereignAgentOrchestrator = SovereignAgentOrchestrator.getInstance();
