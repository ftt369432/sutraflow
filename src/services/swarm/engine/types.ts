/**
 * types.ts
 *
 * Core types for AgentRunner.
 * Domain-agnostic by default: accommodates legal, medical, architecture, engineering, real estate, etc.
 */

export type EngineLabel = 'local-gpu' | 'nebius-nano' | 'nebius-ultra' | 'gemini' | 'deterministic' | 'tavily' | 'vault' | 'filesystem';

export interface TraceEvent {
  phase: string;
  title: string;
  detail: string;
  status: 'running' | 'done' | 'warn' | 'error';
  engine?: EngineLabel | string;
  ms?: number;
}

export type TraceFn = (e: TraceEvent) => void;

export interface DomainContext {
  id?: string;
  type?: string;
  title: string;
  subtitle?: string;
  practitionerTitle: string;
  organization: string;
  governingStandards: string[];
  systemPrompt: string;
}

export interface IntakeResult {
  subjectEntity: string;      // Client, Patient, Project, Property, Account
  deliverableType: string;    // Pleading, Clinical Report, Plan-Check Response, CMA Audit, Brief
  keywords: string[];         // File search tokens
  templateHints: string[];    // e.g. ["v5", "aia", "soap"]
  instructions: string;
  domainContext: DomainContext;
}

export interface SourceFile {
  name: string;
  path: string;
  lastModified?: string;
  size?: number;
  role: 'subject' | 'template' | 'sample';
  score?: number;
}

export interface SourceManifest {
  subjectFolder?: string;
  subjectFiles: SourceFile[];
  template?: SourceFile;
  samples: SourceFile[];
  notes: string[];
}

export interface Fact {
  fact: string;
  date?: string;
  party?: string;
  amount?: string;
  metric?: string;
  source: string; // file#chunk
}

export interface FactLedger {
  facts: Fact[];
  subjectEntity: string;
  counterparty?: string;
  identifier?: string;        // ADJ number, Medical MRN, Parcel APN, Account #
  eventDate?: string;         // DOI, Date of Service, Permit date
  unresolvedSlots: string[];
  totalChunksRead: number;
}

export interface AuthorityItem {
  id: string;
  cite: string;
  text: string;               // Verbatim text from vault or primary extract
  source: string;             // File path or URL
  tier: 'vault' | 'primary' | 'secondary';
  verified: boolean;
}

export interface OutlineSection {
  heading: string;
  purpose: string;
  styleExcerpt?: string;
  kind: 'caption' | 'overview' | 'facts' | 'analysis' | 'conclusion' | 'verification' | 'order' | 'proof' | 'other';
}

export interface OpenItem {
  item: string;
  why: string;
}

export interface AgentExecutionParams {
  objective: string;
  evidenceText?: string;
  domainProfile?: DomainContext;
  onProgress?: (step: string, detail?: string) => void;
  onPartial?: (partialText: string) => void;
  onThoughtEvent?: (event: any) => void;
}

export interface AgentExecutionResult {
  deliverable: string;
  auditReport: {
    score: number;
    status: 'PASS' | 'WARN' | 'FAIL';
    summary: string;
    findings: Array<{ id: string; category: string; title: string; status: 'PASS' | 'WARN' | 'FAIL'; detail: string }>;
    verifiedAuthorities: string[];
    lineCount: number;
  };
  findings: {
    subjectEntity: string;
    identifier?: string;
    deliverableType: string;
    applicableAuthorities: any[];
    evidentiaryIssues: string[];
    resolvedSource?: string;
    rawFindings?: string;
  };
  executionTimeMs: number;
  domainUsed: string;
}

export function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}
