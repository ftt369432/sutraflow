import { AgentAction, AgentActionResult } from '../services/agents/BaseAgent';
import type { AgentCapability } from '../types/agent';

export type AutonomyLevel = 'supervised' | 'semi-autonomous' | 'autonomous';

export type WorkflowPatternType =
  | 'sequence'
  | 'parallel'
  | 'conditional'
  | 'repetitive'
  | 'learning'
  | 'process'
  | 'automation';

export interface WorkflowAction {
  id: string;
  type: string;
  input: unknown;
  output?: unknown;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
  duration: number;
}

export interface UserAction {
  type: string;
  payload?: unknown;
  timestamp: Date;
  userId?: string;
  context?: any;
  metadata?: any;
}

export interface WorkflowPattern {
  id: string;
  name: string;
  description: string;
  type: 'learning' | 'fixed';
  actions: UserAction[];
  frequency: number;
  confidence: number;
  category: string;
  requiredCapabilities: AgentCapability[];
  triggers: string[];
  complexity: number;
}

export interface WorkflowMetrics {
  successRate: number;
  averageDuration: number;
  completionRate: number;
  errorRate: number;
  patternMatches: number;
}

export interface WorkflowSuggestion {
  type: 'automation' | 'learning' | 'optimization';
  description: string;
  confidence: number;
  suggestedAgent: {
    name: string;
    capabilities: string[];
    autonomyLevel: AutonomyLevel;
    triggers: string[];
  };
}

export interface AgentSuggestion {
  id: string;
  patternId: string;
  description: string;
  confidence: number;
  potentialBenefits: string[];
  estimatedTimesSaved: number;
}

export interface AgentExecutionResult {
  action: string;
  result: unknown;
  timestamp: Date;
  error: string | null;
}

/**
 * Metrics for agent actions
 */
export interface ActionMetrics {
  action: string;
  duration: number;
  success: boolean;
  timestamp: Date;
  agentId: string;
  error?: string;
}

export interface AgentMetrics {
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  lastExecution: Date | null;
}

/**
 * Step in a workflow
 */
export interface WorkflowStep {
  id: string;
  type: string;
  action: AgentAction;
  dependencies?: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: AgentActionResult;
}

/**
 * Configuration for a workflow
 */
export interface WorkflowConfig {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  created: Date;
  lastRun?: Date;
  status: 'active' | 'inactive' | 'running';
}

/**
 * Result of executing a workflow
 */
export interface WorkflowResult {
  workflowId: string;
  success: boolean;
  startTime: Date;
  endTime: Date;
  stepResults: Record<string, AgentActionResult>;
  error?: string;
}

export type { AgentConfig } from './agent';