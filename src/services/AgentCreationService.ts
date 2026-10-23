import type { AgentConfig, WorkflowPattern } from '../types/workflow';
import { v4 as uuidv4 } from 'uuid';
import { getEnv } from '../config/env';

export class AgentCreationService {
  private readonly DEFAULT_CONFIGS = {
    email: {
      modelName: getEnv().models.chat, // Configurable via VITE_MODEL_CHAT
      maxTokens: 2000,
      temperature: 0.7,
      basePrompt: 'You are an email management assistant...'
    },
    document: {
      modelName: getEnv().models.chat, // Configurable via VITE_MODEL_CHAT
      maxTokens: 4000,
      temperature: 0.5,
      basePrompt: 'You are a document analysis assistant...'
    },
    calendar: {
      modelName: getEnv().models.chatFast || getEnv().models.chat, // Fast model for calendar
      maxTokens: 1000,
      temperature: 0.3,
      basePrompt: 'You are a calendar management assistant...'
    },
    task: {
      modelName: getEnv().models.chatFast || getEnv().models.chat, // Fast model for tasks
      maxTokens: 1500,
      temperature: 0.4,
      basePrompt: 'You are a task management assistant...'
    }
  };

  public createAgentFromPattern(pattern: WorkflowPattern): AgentConfig {
    const agentType = this.determineAgentType(pattern);
    const baseConfig = this.DEFAULT_CONFIGS[agentType] || this.DEFAULT_CONFIGS.task;

    return {
      id: uuidv4(),
      name: `${pattern.category} Assistant`,
      type: agentType,
      capabilities: pattern.requiredCapabilities,
      autonomyLevel: this.determineAutonomyLevel(pattern),
      triggers: pattern.triggers,
      config: {
        ...baseConfig,
        customPrompt: this.generateCustomPrompt(pattern),
        workingHours: this.determineWorkingHours(pattern),
        notificationPreferences: this.determineNotificationPreferences(pattern)
      }
    };
  }

  private determineAgentType(pattern: WorkflowPattern): string {
    const actionTypes = pattern.actions.map(a => a.type);
    const typeFrequency = actionTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeFrequency)
      .sort(([, a], [, b]) => b - a)[0][0];
  }

  private determineAutonomyLevel(pattern: WorkflowPattern): 'supervised' | 'semi-autonomous' | 'autonomous' {
    const complexity = pattern.complexity;
    const frequency = pattern.frequency;

    if (complexity > 0.8 || frequency < 0.5) return 'supervised';
    if (complexity > 0.5 || frequency < 0.7) return 'semi-autonomous';
    return 'autonomous';
  }

  private generateCustomPrompt(pattern: WorkflowPattern): string {
    const basePrompt = this.DEFAULT_CONFIGS[this.determineAgentType(pattern)].basePrompt;
    const customization = `
      You specialize in ${pattern.category} tasks.
      Common triggers: ${pattern.triggers.join(', ')}
      Required capabilities: ${pattern.requiredCapabilities.join(', ')}
      Typical workflow: ${this.describeWorkflow(pattern)}
    `;

    return `${basePrompt}\n${customization}`;
  }

  private describeWorkflow(pattern: WorkflowPattern): string {
    return pattern.actions
      .map((action, index) => `${index + 1}. ${action.type}`)
      .join('\n');
  }

  private determineWorkingHours(pattern: WorkflowPattern): { start: number; end: number } {
    const timestamps = pattern.actions.map(a => a.timestamp.getHours());
    const avgStart = Math.min(...timestamps);
    const avgEnd = Math.max(...timestamps);

    return {
      start: avgStart,
      end: avgEnd
    };
  }

  private determineNotificationPreferences(pattern: WorkflowPattern): {
    frequency: 'high' | 'medium' | 'low';
    urgencyThreshold: number;
  } {
    return {
      frequency: pattern.complexity > 0.7 ? 'high' : 'medium',
      urgencyThreshold: pattern.complexity > 0.8 ? 0.7 : 0.5
    };
  }
} 