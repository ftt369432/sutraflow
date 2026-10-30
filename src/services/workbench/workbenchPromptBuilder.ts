/**
 * workbenchPromptBuilder.ts
 * 
 * Modular prompt construction and context budgeting engine for SutraFlow Universal Workbench.
 * Formulates system instructions, dynamic context windows, and evidentiary blocks
 * strictly adhering to domain standards and clean token constraints.
 */

import { DomainProfile } from '../ai/UniversalDomainOperator';
import { StudioMessage } from '../../components/workbench/types';

export interface PromptContextOptions {
  activeProfile: DomainProfile;
  textToSend: string;
  evidenceText?: string;
  attachedFileName?: string;
  notepadText?: string;
  pinnedFiles?: Array<{ name: string; content?: string; path?: string }>;
  autoDiscoveredName?: string;
  autoDiscoveredContent?: string;
}

export function isBinaryFile(name: string, content?: string): boolean {
  if (/\.(xlsx|xls|pdf|zip|exe|heic|db|png|jpg|jpeg|docx|doc)$/i.test(name)) return true;
  if (content && (content.startsWith('PK\x03\x04') || content.startsWith('%PDF') || /[\x00-\x08\x0E-\x1F]/.test(content.slice(0, 200)))) return true;
  return false;
}

/**
 * Budgets and formats pinned files into concise prompt sections without token bloat.
 */
export function formatPinnedFilesContext(pinnedFiles: Array<{ name: string; content?: string; path?: string }> = []): string {
  if (!pinnedFiles || pinnedFiles.length === 0) return '';

  // Smart context budgeting: if more than 15 files are attached, summarize inventory
  if (pinnedFiles.length > 15) {
    const extCounts: Record<string, number> = {};
    const sampleNames: string[] = [];
    pinnedFiles.forEach((p, idx) => {
      const ext = p.name.split('.').pop()?.toUpperCase() || 'FILE';
      extCounts[ext] = (extCounts[ext] || 0) + 1;
      if (idx < 10) sampleNames.push(p.name);
    });
    const breakdown = Object.entries(extCounts).map(([ext, count]) => `${count} ${ext}s`).join(', ');
    return `### PINNED CASE REPOSITORY (${pinnedFiles.length} Files Attached: ${breakdown})\n` +
      `*Sample files in repository:* \n${sampleNames.map(n => `- ${n}`).join('\n')}\n` +
      `*(Note: ${pinnedFiles.length} total case files are available on disk. Use 'list_dir' or 'grep_search' to locate specific exhibits without prompt overflow).*`;
  }

  return pinnedFiles.map((p) => {
    if (isBinaryFile(p.name, p.content)) {
      return `### ATTACHED SPREADSHEET/DOCUMENT: ${p.name} (Source: ${p.path || 'SutraDrive'})\n[Binary document loaded on disk. Path: ${p.path || p.name}. Use run_command with python or view_file to query it directly.]`;
    }
    return `### PINNED RECORD: ${p.name} (Source: ${p.path || 'SutraDrive'})\n${(p.content || '').slice(0, 8000)}`;
  }).join('\n\n');
}

/**
 * Assembles composite evidentiary context from active attachments, pinned files, and auto-discovered records.
 */
export function assembleEvidentiaryBlocks(options: PromptContextOptions): string {
  const blocks: string[] = [];

  if (options.evidenceText) {
    blocks.push(`### ACTIVE ATTACHED EVIDENCE (${options.attachedFileName || 'Attached File'}):\n${options.evidenceText.slice(0, 32000)}`);
  }

  const pinnedContext = formatPinnedFilesContext(options.pinnedFiles);
  if (pinnedContext) {
    blocks.push(pinnedContext);
  }

  if (options.autoDiscoveredContent) {
    blocks.push(`### AUTO-DISCOVERED SOVEREIGN RECORD (${options.autoDiscoveredName || 'Record'}):\n${options.autoDiscoveredContent.slice(0, 32000)}`);
  }

  if (options.notepadText && !options.evidenceText) {
    blocks.push(`### SCRATCHPAD NOTES:\n${options.notepadText.slice(0, 8000)}`);
  }

  return blocks.join('\n\n');
}

/**
 * Builds the full conversational prompt incorporating system guidelines, environment visibility, and domain rules.
 */
export function buildConversationalPrompt(options: PromptContextOptions): string {
  const compositeEvidence = assembleEvidentiaryBlocks(options);
  const storePinned = options.pinnedFiles || [];

  return `${options.activeProfile.systemPrompt}

### SOVEREIGN STORAGE & ATTACHED ENVIRONMENT:
- You operate with full visibility into the user's sovereign storage fabric and active workspace.
- Pinned Records in Active Context: ${storePinned.length > 0 ? storePinned.map((p) => `"${p.name}"`).join(', ') : 'None explicitly pinned (Auto-discovery active)'}
- Auto-Discovered Records: ${options.autoDiscoveredName || 'None'}
- Direct Directive: NEVER claim you cannot access Google Drive or local directories. If records are provided below, audit and cite them directly.

${compositeEvidence ? `${compositeEvidence}\n` : ''}

User Prompt: ${options.textToSend}

Instructions:
Provide an authoritative, in-depth, intuitive, and beautifully structured executive response.
- Lead with an Executive Summary or Strategic Takeaway (2-3 concise sentences).
${options.activeProfile.type === 'legal'
  ? '- PETITIONS & PLEADINGS: For California legal petitions, trial briefs, and motions, NEVER use markdown table grids or spreadsheet cells. Write in straight-through, continuous legal prose with numbered paragraphs (1, 2, 3...), formal IRAC arguments, verbatim statutory quotes, and standard 28-line legal pleading structure.'
  : '- Use clean Markdown with distinct section headings (##), bullet points with concise bold leads, and cleanly formatted tables where metrics, architectures, or comparisons are relevant.'}
- ZERO HESITATION / NO INTERVIEW STALLING: NEVER halt execution by asking passive "5-question surveys" or "mandatory calibration interviews". Deliver the complete, actionable blueprint, code, dashboard, or strategy immediately.
- TERMINOLOGY: "MCP" refers to Model Context Protocol (AI agent servers, tools, JSON-RPC connectors) — NEVER confuse it with California medical billing codes (ML-101/OMFS) unless the user is explicitly in the California Workers' Comp legal domain.
${options.activeProfile.type === 'legal' ? '- When referencing statutes or legal authorities, quote verbatim with exact Labor Code sections and case names.' : '- Ground all standards and regulatory frameworks in the governing authorities of the active professional domain.'}
- PROACTIVE MANIFESTATION: Proactively outline next implementation steps, concrete technical and business choices, and suggest superior alternatives to help the user manifest and accelerate their vision.
- Keep the presentation clean, executive, and readable (avoid wall-of-text all-caps bolding).`;
}

/**
 * Generates the Socratic brain onboarding message for newly initialized custom brains.
 */
export function buildSocraticOnboardingMessage(timestamp?: string): StudioMessage {
  return {
    id: `socratic-${Date.now()}`,
    role: 'assistant',
    content: `### 🧠 Sovereign Brain Genesis: Interactive Customization Walkthrough

Welcome to your new Sovereign Brain! Let's tailor this cortex specifically to your professional practice in 3 quick questions:

1. **Industry & Vertical:** What domain or industry does your practice operate in? (e.g., Medical Practice, Real Estate Agency, Software Engineering Lab, Accounting Firm)
2. **Primary Work Product:** What core deliverables do you want this brain to generate? (e.g., Clinical evaluations, Purchase agreements, RFCs & code, Tax models)
3. **Governing Authorities:** What statutes, standards, or guidelines should ground your outputs? (e.g., HIPAA / MTUS, California DRE, OWASP, GAAP / IRS)

*Click one of the fast-start domain archetypes below to auto-configure, or reply directly with your specific practice details!*`,
    suggestions: [
      { id: 'soc-1', label: '🏥 Medical / Clinical Practice', prompt: 'Configure my brain for a Clinical & Forensic Medical Practice with HIPAA, MTUS/ACOEM guidelines, and QME/IME impairment reporting.', icon: 'brain' },
      { id: 'soc-2', label: '🏢 Real Estate & Development', prompt: 'Configure my brain for Real Estate Brokerage and Property Management with California DRE, CAR purchase agreements, and municipal zoning compliance.', icon: 'target' },
      { id: 'soc-3', label: '💻 Software Engineering Lab', prompt: 'Configure my brain for Principal Software Engineering with Clean Architecture, TypeScript/React/Node, OWASP Top 10, and RFC specs.', icon: 'zap' },
      { id: 'soc-4', label: '📊 Accounting & Tax Practice', prompt: 'Configure my brain for Forensic Accounting and Enterprise Tax with California OMFS, GAAP, and IRS regulations.', icon: 'folder' }
    ],
    timestamp: timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}

