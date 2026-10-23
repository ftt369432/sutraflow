import type { Task as _Task } from './task';

export interface ExecutionResult {
  output: unknown;
  priority?: 'high' | 'medium' | 'low';
  metadata?: Record<string, unknown>;
  error?: string;
}

export interface ExecutionPlan {
  steps: ExecutionStep[];
  resources: Resource[];
  timeline: Timeline;
  risks: Risk[];
  qualityChecks: QualityCheck[];
}

export interface ExecutionStep {
  id: string;
  title: string;
  description: string;
  dependencies: string[];
  estimatedEffort: number;
  assignee?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
}

export interface Resource {
  id: string;
  type: 'human' | 'tool' | 'system';
  name: string;
  availability: number; // percentage
  skills?: string[];
  currentLoad?: number;
}

export interface Timeline {
  startDate: Date;
  endDate: Date;
  milestones: Milestone[];
  criticalPath: string[]; // step IDs
}

export interface Risk {
  id: string;
  description: string;
  probability: number;
  impact: number;
  mitigation: string;
  contingency: string;
}

export interface QualityCheck {
  id: string;
  criteria: string;
  method: string;
  frequency: 'once' | 'daily' | 'weekly' | 'milestone';
  owner: string;
}

export interface Milestone {
  id: string;
  title: string;
  date: Date;
  deliverables: string[];
  dependencies: string[];
}