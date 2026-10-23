import { Task } from '../types/task';
import { Event } from '../types/calendar';

export interface FollowUpQuestion {
  question: string;
  context: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface ScheduleAnalysisResult {
  conflicts: string[];
  followUpQuestions: FollowUpQuestion[];
}

export interface Source {
  id: string;
  type: string;
  content: string;
  reference: string;
  relevance: number;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface ResponseWithSources<T> {
  data: T;
  sources: Source[];
}

export interface AIService {
  enhanceTask(task: Task): Promise<ResponseWithSources<Task>>;
  estimateTaskDuration(description: string): Promise<ResponseWithSources<number>>;
  optimizeTaskSchedule(tasks: Task[]): Promise<ResponseWithSources<Task[]>>;
  suggestEventTimes(event: Partial<Event>): Promise<ResponseWithSources<Date[]>>;
  analyzeScheduleConflicts(events: Event[]): Promise<ResponseWithSources<ScheduleAnalysisResult>>;
  getCompletion(prompt: string, options?: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
  }): Promise<string>;
  getEmbedding(text: string): Promise<number[]>;
  getRelevantSources(context: string, minRelevance?: number): Source[];
  getSourcesByType(type: string): Source[];
  getSourcesByConfidence(minConfidence?: number): Source[];
} 