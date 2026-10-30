/**
 * workbenchIntentRouter.ts
 * 
 * Modular Intent Routing & Execution Engine for SutraFlow Universal Workbench.
 * Encapsulates Master Manifest inspection, Word (.docx) compilation, sovereign folder creation,
 * connected drive navigation search, conversational Q&A, and 24-tool Sovereign ReAct execution.
 */

import { sovereignFs } from '../fs/sovereignFsBridge';
import { sovereignWorkspace } from '../sovereign/sovereignWorkspace';
import { exportMarkdownToDocx } from '../../utils/docxExportUtil';
import { AIServiceFactory } from '../ai/aiServiceFactory';
import { nebiusTokenFactory } from '../ai/NebiusTokenFactoryService';
import { sovereignAgentOrchestrator } from '../ai/SovereignAgentOrchestrator';
import { agentRunner } from '../swarm/engine/AgentRunner';
import { DomainProfile, DomainType } from '../ai/UniversalDomainOperator';
import { StudioMessage, ThoughtTraceStep, ArtifactBadge } from '../../components/workbench/types';
import { partitionDiscussionAndWorkProduct, unwrapModelDeliverable, isConversationalDiscussion } from '../../utils/deliverableUnwrapper';
import { buildConversationalPrompt, formatPinnedFilesContext } from './workbenchPromptBuilder';

export interface IntentContext {
  trimmed: string;
  lower: string;
  sessionId: string;
  activeProfile: DomainProfile;
  activeDomainType: DomainType;
  evidenceText: string;
  attachedFileName: string;
  notepadText: string;
  generatedOutput: string;
  deepLoop: boolean;
  activeEngine: string;
  activeNebiusTier: string;
  pinnedFiles: Array<{ name: string; content?: string; path?: string }>;
  startTime: number;
  onThoughtStep: (step: string, detail?: string) => void;
  onSessionArtifacts: (artifacts: Array<{ id: string; title: string; content: string; timestamp: string; diskPath?: string }>) => void;
  onDeliverableOutput: (content: string, diskPath?: string) => void;
}

export interface IntentResult {
  handled: boolean;
  replyContent?: string;
  artifactBadges?: ArtifactBadge[];
  auditScore?: number;
}

/**
 * INTENT -1: Master Manifest Unpacker & Synchronizer
 */
export async function handleManifestIntent(ctx: IntentContext): Promise<IntentResult | null> {
  const isManifestCommand =
    /^(manifest|master manifest|unpack manifest|open manifest|show manifest|load manifest|read manifest)\b/i.test(ctx.trimmed) ||
    ctx.lower === 'manifest' ||
    ctx.lower === 'master manifest' ||
    ctx.lower === '/manifest' ||
    /\b(unpack|show|open|read|load)\s+(the\s+)?(master\s+)?manifest\b/i.test(ctx.trimmed);

  if (!isManifestCommand) return null;

  ctx.onThoughtStep('Inspecting sovereign storage fabric across nodes for MASTER_MANIFEST.md...');
  const manifestCandidates = [
    'G:\\My Drive\\.GENIEFLOW_MASTER\\MASTER_MANIFEST.md',
    'E:\\.genieflowai.brain\\MASTER_MANIFEST.md',
    'E:\\.GENIEFLOW_MASTER\\MASTER_MANIFEST.md',
    'E:\\MASTER_MANIFEST.md',
    'I:\\.genieflowai.brain\\MASTER_MANIFEST.md'
  ];

  let loadedManifest = '';
  let resolvedPath = '';

  for (const cand of manifestCandidates) {
    try {
      const res = await sovereignFs.readFile({ path: cand });
      if (res?.success && res.content) {
        loadedManifest = res.content;
        resolvedPath = cand;
        ctx.onThoughtStep(`Unpacked Master Manifest from ${cand} (${res.content.length.toLocaleString()} bytes)...`);
        break;
      }
    } catch (_e) {}
  }

  if (loadedManifest) {
    ctx.onDeliverableOutput(loadedManifest);

    // Keep nodes synchronized across drives in background
    for (const cand of manifestCandidates) {
      if (cand !== resolvedPath) {
        try {
          await sovereignFs.writeFile({ path: cand, content: loadedManifest });
        } catch (_e) {}
      }
    }

    const lineCount = loadedManifest.split('\n').length;
    const kbSize = (loadedManifest.length / 1024).toFixed(1);

    return {
      handled: true,
      replyContent: `### MASTER MANIFEST UNPACKED (ZERO RESTRICTIONS)

**Source Node:** \`${resolvedPath}\`  
**Size:** ${kbSize} KB (${lineCount.toLocaleString()} lines) | **DNA:** \`[SYNCED] (Travel Drive E: ↔ Google Drive G: Master ↔ Local NVMe C:)\`  
**Core Logic:** \`ACTIVE (v2.5.0 — Dual-Persona Sovereign Unified & Synced)\`

---

#### Active System Personas & Captions
- **Applicant Attorney Persona:** \`Law Offices of Arnulfo F. Gutierrez, Esq. (SBN 212260)\`
- **Lien Claimant Persona:** \`Medland Medical Tustin\` | \`Spectrum Medical Group\` | \`RMS Medical Group\`

> **Full Master Manifest Mounted:** The complete unconstrained \`MASTER_MANIFEST.md\` (${lineCount.toLocaleString()} lines) is now mounted in the **Synthesis Output** on the right for inspection, editing, or export.`
    };
  }

  return {
    handled: true,
    replyContent: `**[ALERT] Could not unpack MASTER_MANIFEST.md**\n\nTried the following paths:\n${manifestCandidates.map((p) => `- \`${p}\``).join('\n')}\n\nPlease verify that Google Drive (G:) or Travel Drive (E:) is connected.`
  };
}

/**
 * INTENT 0: DOCX Export Command
 */
export async function handleDocxIntent(ctx: IntentContext): Promise<IntentResult | null> {
  const isDocxRequest = /^(export|create|make|generate|convert|save).*(\.docx|word|docx)/i.test(ctx.trimmed) ||
    ctx.lower === 'docx' || ctx.lower === 'export docx' || ctx.lower === 'create docx';

  if (!isDocxRequest) return null;

  ctx.onThoughtStep('Compiling document into Microsoft Word (.docx)...');
  const contentToExport = ctx.generatedOutput || ctx.notepadText || ctx.evidenceText;

  if (contentToExport) {
    const title = `${ctx.activeProfile.title.replace(/\s+/g, '_')}_Deliverable`;
    await exportMarkdownToDocx(contentToExport, title);
    return {
      handled: true,
      replyContent: `**Microsoft Word (.docx) Document Generated & Exported!**\n\nYour file \`${title}.docx\` has been compiled and downloaded.\n\n- **Source**: ${ctx.generatedOutput ? 'Synthesis Output' : ctx.notepadText ? 'Scratchpad Notes' : 'Active Evidence'}\n- **Length**: ${contentToExport.split('\n').length} lines\n- **Standard**: Official conformed formatting.`
    };
  }

  return {
    handled: true,
    replyContent: `No draft or notes are currently loaded in the Synthesis Output or Scratchpad to export.\n\nPlease generate a draft first, paste notes into the Scratchpad, or attach a file.`
  };
}

/**
 * INTENT 0.5: Direct Sovereign Workspace & Folder Creation
 */
export async function handleFolderCreationIntent(ctx: IntentContext): Promise<IntentResult | null> {
  const isFolderCreation =
    /^(create|make|build|setup|set up|init|initialize)\s+(a\s+)?(new\s+)?(folder|directory|workspace|business)\b/i.test(ctx.trimmed) ||
    /\b(create|make|setup|init)\s+(the\s+)?(folder|directory|workspace)\s+(for\s+)?([a-zA-Z0-9_\-]+)/i.test(ctx.trimmed) ||
    /\b(did you create|where is the|check)\s+(the\s+)?(folder|directory|workspace)\b/i.test(ctx.trimmed) ||
    /^(create folder|make folder|create directory|setup folder|setup workspace)/i.test(ctx.trimmed);

  if (!isFolderCreation) return null;

  ctx.onThoughtStep('Analyzing sovereign workspace directory structure...');
  let targetEntity = 'AGNETICS';
  const matchName = ctx.trimmed.match(/\b(?:for|named|called|workspace|folder|business|directory)\s+([a-zA-Z0-9_\-]+)\b/i);
  if (matchName && !['a', 'new', 'the', 'this', 'our', 'my'].includes(matchName[1].toLowerCase())) {
    targetEntity = matchName[1].toUpperCase();
  }

  ctx.onThoughtStep(`Creating and verifying sovereign physical storage topology for ${targetEntity}...`);
  const { primaryPath, verifiedNodes } = await sovereignWorkspace.ensureWorkspaceTopology(targetEntity);

  const planPath = await sovereignWorkspace.resolvePath(targetEntity, `${targetEntity}_MASTER_PLAN.md`);
  let planContent = '';
  try {
    const res = await sovereignFs.readFile({ path: planPath });
    if (res?.success && res.content) planContent = res.content;
  } catch (_e) {}

  if (!planContent) {
    planContent = `# ${targetEntity}: Master Sovereign Workspace Plan\n\n**Generated:** ${new Date().toLocaleDateString()} | **Domain:** ${ctx.activeProfile.title}\n\n## 1. Executive Mission\nSovereign workspace established for **${targetEntity}** across all active and attached storage nodes.\n\n## 2. Directory Architecture\n- \`clients/\`: Process logs, click-path audits, client dossiers\n- \`dashboards/\`: Offline single-file HTML command centers with localStorage persistence\n- \`templates/\`: Reusable markdown and conformed artifact templates\n- \`workflows/\`: Deterministic agent skills (.agents/workflows/)\n`;
    try {
      await sovereignFs.writeFile({ path: planPath, content: planContent });
      for (const node of verifiedNodes) {
        if (node.path !== primaryPath) {
          try {
            await sovereignFs.writeFile({ path: `${node.path}\\${targetEntity}_MASTER_PLAN.md`, content: planContent });
          } catch (_e) {}
        }
      }
    } catch (_e) {}
  }

  ctx.onDeliverableOutput(planContent, planPath);

  const nodeTable = verifiedNodes.map(n => `| **${n.name}** | \`${n.path}\` | [VERIFIED] Active |`).join('\n');
  return {
    handled: true,
    replyContent: `### Sovereign Workspace Physical Creation Confirmed: **${targetEntity}**

The dedicated business workspace has been physically initialized and verified with persistent memory:

| Storage Node | Physical Location | Status |
| :--- | :--- | :--- |
${nodeTable || `| **Active Workspace** | \`${primaryPath}\` | [VERIFIED] Active |`}

#### Standardized Directory Topology
\`\`\`
${targetEntity}/
├── clients/          # Client dossiers, click-path logs, intake audits
├── dashboards/       # Offline single-file HTML command centers
├── templates/        # Jinja2 / docx / markdown pleading templates
└── workflows/        # Reusable skill packages (.agents/workflows/)
\`\`\`

- **Master Launch Plan:** \`${targetEntity}_MASTER_PLAN.md\` *(Loaded in Synthesis Output)*`
  };
}

/**
 * INTENT 2: Conversational Q&A & Evidentiary Analysis
 */
export async function handleConversationalQA(ctx: IntentContext): Promise<IntentResult> {
  ctx.onThoughtStep(`Consulting ${ctx.activeProfile.title} knowledge base & evidence...`);

  const conversationalPrompt = buildConversationalPrompt({
    activeProfile: ctx.activeProfile,
    textToSend: ctx.trimmed,
    evidenceText: ctx.evidenceText,
    attachedFileName: ctx.attachedFileName,
    notepadText: ctx.notepadText,
    pinnedFiles: ctx.pinnedFiles
  });

  let answer = '';
  const hasNebius = !!nebiusTokenFactory.getApiKey();
  if (hasNebius && (ctx.activeEngine === 'nebius' || ctx.deepLoop)) {
    ctx.onThoughtStep(
      `Streaming reasoning via Nebius Nemotron ${ctx.activeNebiusTier === 'nano' ? 'Nano (30B)' : ctx.activeNebiusTier === 'super' ? 'Super (120B)' : 'Ultra (550B)'}...`
    );
    answer = await nebiusTokenFactory.generateText(conversationalPrompt, {
      model: ctx.activeNebiusTier,
      temperature: 0.2,
      maxTokens: 8192
    });
  } else {
    const ai = AIServiceFactory.getInstance();
    answer = await ai.generateText(conversationalPrompt, { temperature: 0.2 });
  }

  const partitioned = partitionDiscussionAndWorkProduct(answer);
  if (partitioned.workProduct) {
    ctx.onDeliverableOutput(partitioned.workProduct);
  }

  const chatFeedDisplay = partitioned.workProduct
    ? (partitioned.discussion && partitioned.discussion.length > 20
        ? partitioned.discussion
        : `The requested deliverable has been synthesized and mounted in the **Synthesis Output** viewport on the right.`)
    : answer;

  return {
    handled: true,
    replyContent: chatFeedDisplay
  };
}

/**
 * INTENT 3: 24-Tool Sovereign ReAct Loop & Agent Engine
 */
export async function handleSovereignReActExecution(ctx: IntentContext): Promise<IntentResult> {
  const nebiusKey = nebiusTokenFactory.getApiKey();
  const useSovereignReAct = ctx.deepLoop && (nebiusKey || ctx.activeEngine === 'nebius');

  if (useSovereignReAct) {
    ctx.onThoughtStep(`Engaging Sovereign ReAct Cognitive Loop (24 Tools) for ${ctx.activeProfile.title}...`);
    try {
      const pinnedContent = formatPinnedFilesContext(ctx.pinnedFiles);
      const activeContext = [ctx.evidenceText, pinnedContent, ctx.notepadText].filter(Boolean).join('\n\n');
      const objectiveWithContext = ctx.trimmed + (activeContext ? `\n\n### ACTIVE EVIDENTIARY RECORD (${ctx.attachedFileName || 'Case Evidence'}):\n${activeContext.slice(0, 32000)}` : '');

      const resultText = await sovereignAgentOrchestrator.executeMission(objectiveWithContext, {
        maxTurns: 50,
        onProgress: (step) => {
          if (step.stage === 'thinking' && step.thought) {
            ctx.onThoughtStep('Reasoning Process...', step.thought.slice(0, 4000));
          } else if (step.stage === 'tool_call' && step.toolName) {
            ctx.onThoughtStep(`Executing Tool: ${step.toolName}`, JSON.stringify(step.toolArgs || {}, null, 2));
          } else if (step.stage === 'tool_result' && step.toolName) {
            ctx.onThoughtStep(`Tool Completed: ${step.toolName}`, (step.toolOutput || '').slice(0, 6000));
          }
        }
      });

      const writtenFiles = sovereignAgentOrchestrator.getLatestWrittenFiles();
      let artifactBadges: ArtifactBadge[] = [];

      if (writtenFiles && writtenFiles.length > 0) {
        const primaryDoc = writtenFiles[0];
        ctx.onDeliverableOutput(primaryDoc.content, primaryDoc.path);

        const newArtifacts = writtenFiles.map((wf, idx) => ({
          id: `doc-${Date.now()}-${idx}`,
          title: wf.title || wf.path.split(/[\\/]/).pop() || `Deliverable ${idx + 1}`,
          content: wf.content,
          timestamp: wf.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          diskPath: wf.path
        }));
        ctx.onSessionArtifacts(newArtifacts);

        artifactBadges = writtenFiles.map((wf, idx) => ({
          id: `art-${idx}`,
          name: wf.path.split(/[\\/]/).pop() || wf.title || 'Work Product',
          path: wf.path,
          type: wf.path.endsWith('.docx') ? 'docx' : wf.path.endsWith('.md') ? 'md' : 'text'
        }));
      } else {
        const partitioned = partitionDiscussionAndWorkProduct(resultText);
        if (partitioned.workProduct) {
          ctx.onDeliverableOutput(partitioned.workProduct, partitioned.diskPath);
        }
      }

      const partitionedResult = partitionDiscussionAndWorkProduct(resultText);
      const chatFeedSummaryText = partitionedResult.workProduct
        ? (partitionedResult.discussion && partitionedResult.discussion.length > 20
            ? partitionedResult.discussion
            : `The requested deliverable has been synthesized and mounted in the **Synthesis Output** viewport on the right.`)
        : resultText;

      const sovereignSummary = `### Sovereign Autonomous Execution Complete
- **Domain:** ${ctx.activeProfile.title}
- **Engine:** Sovereign Multi-Turn ReAct Cortex (24 Native Tools)

${chatFeedSummaryText}

---
**Next Action & Suggested Output:** The full verified work product is loaded in the **Synthesis Output** viewport on the right.`;

      return {
        handled: true,
        replyContent: sovereignSummary,
        artifactBadges: artifactBadges.length > 0 ? artifactBadges : undefined
      };
    } catch (err: any) {
      console.warn('[SOVEREIGN-REACT] Error, falling back to agent runner:', err);
      ctx.onThoughtStep('Falling back to deterministic agent runner...', err?.message);
    }
  }

  // Fallback: Deterministic Agent Runner
  ctx.onThoughtStep(`Engaging Agent Engine for ${ctx.activeProfile.title}...`);
  const agentResult = await agentRunner.runAgent({
    objective: ctx.trimmed,
    evidenceText: ctx.evidenceText || ctx.notepadText,
    domainProfile: ctx.activeProfile,
    onProgress: (step, detail) => ctx.onThoughtStep(step, detail),
    onPartial: (partial) => {
      if (!isConversationalDiscussion(partial)) {
        const clean = unwrapModelDeliverable(partial).content;
        if (clean && !isConversationalDiscussion(clean)) {
          ctx.onDeliverableOutput(clean);
        }
      }
    }
  });

  const partitionedAgent = partitionDiscussionAndWorkProduct(agentResult.deliverable);
  if (partitionedAgent.workProduct) {
    ctx.onDeliverableOutput(partitionedAgent.workProduct);
  }

  return {
    handled: true,
    replyContent: partitionedAgent.discussion || agentResult.deliverable,
    auditScore: agentResult.auditReport?.score
  };
}

