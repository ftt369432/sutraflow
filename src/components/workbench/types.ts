import { DomainType, DomainProfile } from '../../services/ai/UniversalDomainOperator';
import { AnalystAuditReport } from '../../services/ai/ForensicAnalystLinter';

export interface ThoughtTraceStep {
  id: string;
  icon?: string;
  title: string;
  detail?: string;
  status: 'running' | 'completed' | 'warning';
  timeSeconds?: number;
}

export interface ArtifactBadge {
  id: string;
  name: string;
  path: string;
  size?: string;
  type?: string;
}

export interface StudioMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  auditScore?: number;
  isStreaming?: boolean;
  thoughtDuration?: string;
  thoughtSteps?: ThoughtTraceStep[];
  artifacts?: ArtifactBadge[];
}

export type LayoutMode = 'split' | 'chatOnly' | 'deliverableOnly';
export type RightTab = 'deliverable' | 'source' | 'notepad' | 'tools' | 'tavily' | 'split' | 'graph';
