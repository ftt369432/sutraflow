// New file to define assistant-related types
import { PersonalityProfile } from './personality';
import { WorkflowPattern } from './workflow';

export interface UserPreferences {
  name: string;
  timezone: string;
  language: string;
  notificationPreferences: {
    email: boolean;
    push: boolean;
    voice: boolean;
  };
  workingHours: {
    start: string;
    end: string;
  };
}

export interface AssistantContext {
  recentInteractions: string[];
  userState: string;
  timeOfDay: string;
  activeWorkflow: string | null;
  pendingSuggestions?: Array<{
    text: string;
    pattern: WorkflowPattern;
  }>;
}

export interface AssistantResponse {
  text: string;
  actions: AssistantAction[];
  suggestions: string[];
  personality: PersonalityProfile;
}

export interface AssistantAction {
  type: string;
  parameters: Record<string, unknown>;
}

export interface Intent {
  type: IntentType;
  confidence: number;
  entities: Array<{
    type: string;
    value: unknown;
  }>;
}

export type IntentType = 'task' | 'query' | 'emotion' | 'workflow' | 'system' | 'unknown';