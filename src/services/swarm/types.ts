/**
 * Universal Agent Swarm Types
 * 
 * Industry-agnostic definitions for multi-agent swarm coordination,
 * real-time telemetry, and dynamic markdown playbook execution.
 */

export type UniversalAgentRole = 
  | 'coordinator'  // Plans, decomposes tasks, orchestrates delegation
  | 'researcher'   // Gathers data, extracts evidence, inspects records, searches knowledge
  | 'drafter'      // Synthesizes work-product, drafts formal deliverables, formats artifacts
  | 'auditor'      // Quality assurance, checks compliance, verifies math/citations/rules
  | 'executor';    // Dispatches tools, executes APIs, handles file I/O

export type SwarmStatus = 
  | 'idle' 
  | 'planning' 
  | 'researching' 
  | 'drafting' 
  | 'auditing' 
  | 'complete' 
  | 'failed';

export interface SwarmTaskStep {
  id: string;
  role: UniversalAgentRole;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input?: Record<string, any>;
  output?: any;
  thoughts: string[];
  findings?: Array<{ source: string; content: string; confidence?: number }>;
  auditScore?: number;
  durationMs?: number;
}

export interface SwarmExecutionPlan {
  id: string;
  goal: string;
  domain: string;
  playbookName?: string;
  steps: SwarmTaskStep[];
  status: SwarmStatus;
  startedAt?: Date;
  completedAt?: Date;
  finalDeliverable?: string;
}

export type SwarmEventType =
  | 'step_start'
  | 'thought'
  | 'tool_call'
  | 'tool_result'
  | 'step_complete'
  | 'audit_feedback'
  | 'stream_chunk'
  | 'swarm_complete'
  | 'swarm_error';

export interface SwarmExecutionEvent {
  type: SwarmEventType;
  stepId?: string;
  role: UniversalAgentRole;
  message: string;
  payload?: any;
  timestamp: number;
}

export interface PlaybookPersona {
  name: string;
  title: string;
  organization?: string;
  credentials?: string;
  signatureBlock?: string;
}

export interface PlaybookDefinition {
  id: string;
  name: string;
  domain: string; // e.g. 'general', 'legal', 'medical', 'finance', 'engineering', 'custom'
  description: string;
  persona: PlaybookPersona;
  governingStandards: string[];
  rules: string[];
  formattingGuidelines: string;
  systemPrompt: string;
  rawMarkdown: string;
  sourcePath?: string;
}
