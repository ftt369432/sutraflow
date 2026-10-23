import { BehaviorSubject } from 'rxjs';
import type { AgentCapability } from '../../types/agent';
import {
  EmailAgent,
  CalendarAgent,
  TaskAgent,
  DocumentAgent,
  AgentConfig,
  AgentType
} from '../agents';
import { v4 as uuidv4 } from 'uuid';
import { getEnv } from '../../config/env';

// Singleton pattern for agent service
export class UnifiedAgentService {
  private static _instance: UnifiedAgentService | null = null;
  private agents = new Map<string, EmailAgent | CalendarAgent | TaskAgent | DocumentAgent>();
  private activeAgents$ = new BehaviorSubject<string[]>([]);

  private constructor() {
    // Initialize from local storage if available
    this.loadAgentsFromStorage();
  }

  public static get instance(): UnifiedAgentService {
    if (!UnifiedAgentService._instance) {
      UnifiedAgentService._instance = new UnifiedAgentService();
    }
    return UnifiedAgentService._instance;
  }

  private loadAgentsFromStorage(): void {
    try {
      const storedAgents = localStorage.getItem('unified_agents');
      if (storedAgents) {
        const agentConfigs = JSON.parse(storedAgents) as AgentConfig[];
        agentConfigs.forEach(config => {
          this.createAgentFromConfig(config);
        });
      }
    } catch (error) {
      console.error('Failed to load agents from storage:', error);
    }
  }

  private saveAgentsToStorage(): void {
    try {
      const agentConfigs = Array.from(this.agents.values()).map(agent => agent.getConfig());
      localStorage.setItem('unified_agents', JSON.stringify(agentConfigs));
    } catch (error) {
      console.error('Failed to save agents to storage:', error);
    }
  }

  public getAgent(id: string): EmailAgent | CalendarAgent | TaskAgent | DocumentAgent | undefined {
    return this.agents.get(id);
  }

  public getAllAgents(): Array<EmailAgent | CalendarAgent | TaskAgent | DocumentAgent> {
    return Array.from(this.agents.values());
  }

  public createEmailAgent(name: string, capabilities: AgentCapability[]): EmailAgent {
    const config: AgentConfig = {
      id: uuidv4(),
      name,
      type: AgentType.EMAIL_AGENT,
      model: getEnv().models.chat,
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt: 'You are an intelligent email assistant that helps process and manage emails.',
      capabilities: capabilities as any[],
      autonomyLevel: 'supervised',
      description: 'AI email assistant',
      version: '1.0',
      created: new Date(),
      lastModified: new Date(),
      status: 'active',
      preferences: {}
    };

    const agent = new EmailAgent(config);
    this.agents.set(config.id, agent);
    this.saveAgentsToStorage();
    return agent;
  }

  public createCalendarAgent(name: string, capabilities: AgentCapability[]): CalendarAgent {
    const config: AgentConfig = {
      id: uuidv4(),
      name,
      type: AgentType.CALENDAR_AGENT,
      model: getEnv().models.chatFast || getEnv().models.chat,
      temperature: 0.5,
      maxTokens: 1500,
      systemPrompt: 'You are a calendar management assistant that helps schedule and organize events.',
      capabilities: capabilities as any[],
      autonomyLevel: 'supervised',
      description: 'AI calendar assistant',
      version: '1.0',
      created: new Date(),
      lastModified: new Date(),
      status: 'active',
      preferences: {}
    };

    const agent = new CalendarAgent(config);
    this.agents.set(config.id, agent);
    this.saveAgentsToStorage();
    return agent;
  }

  public createTaskAgent(name: string, capabilities: AgentCapability[]): TaskAgent {
    const config: AgentConfig = {
      id: uuidv4(),
      name,
      type: AgentType.TASK_AGENT,
      model: getEnv().models.chatFast || getEnv().models.chat,
      temperature: 0.6,
      maxTokens: 1500,
      systemPrompt: 'You are a task management assistant that helps organize and prioritize tasks.',
      capabilities: capabilities as any[],
      autonomyLevel: 'supervised',
      description: 'AI task assistant',
      version: '1.0',
      created: new Date(),
      lastModified: new Date(),
      status: 'active',
      preferences: {}
    };

    const agent = new TaskAgent(config);
    this.agents.set(config.id, agent);
    this.saveAgentsToStorage();
    return agent;
  }

  public createDocumentAgent(name: string, capabilities: AgentCapability[]): DocumentAgent {
    const config: AgentConfig = {
      id: uuidv4(),
      name,
      type: AgentType.DOCUMENT_AGENT,
      model: getEnv().models.chat,
      temperature: 0.4,
      maxTokens: 4000,
      systemPrompt: 'You are a document analysis assistant that helps process and analyze documents.',
      capabilities: capabilities as any[],
      autonomyLevel: 'supervised',
      description: 'AI document assistant',
      version: '1.0',
      created: new Date(),
      lastModified: new Date(),
      status: 'active',
      preferences: {}
    };

    const agent = new DocumentAgent(config);
    this.agents.set(config.id, agent);
    this.saveAgentsToStorage();
    return agent;
  }

  private createAgentFromConfig(config: AgentConfig): void {
    let agent;
    switch (config.type) {
      case AgentType.EMAIL_AGENT:
      case AgentType.CALENDAR_AGENT:
      case AgentType.TASK_AGENT:
      case AgentType.DOCUMENT_AGENT:
      case AgentType.ORCHESTRATOR_AGENT:
      case AgentType.UNIVERSAL_AGENT:
      case AgentType.ASSISTANT_AGENT:
        // Determine the agent type based on capabilities
        if (config.capabilities.includes('email-processing')) {
          agent = new EmailAgent(config as any);
        } else if (config.capabilities.includes('calendar-management')) {
          agent = new CalendarAgent(config as any);
        } else if (config.capabilities.includes('task-management')) {
          agent = new TaskAgent(config as any);
        } else if (config.capabilities.includes('document-analysis')) {
          agent = new DocumentAgent(config as any);
        }
        break;
      default:
        console.warn(`Unknown agent type: ${config.type}`);
        return;
    }

    if (agent) {
      this.agents.set(config.id, agent);
    }
  }

  public removeAgent(id: string): boolean {
    const result = this.agents.delete(id);
    if (result) {
      this.saveAgentsToStorage();
      // Update active agents
      const activeAgents = this.activeAgents$.value.filter(agentId => agentId !== id);
      this.activeAgents$.next(activeAgents);
    }
    return result;
  }

  public getActiveAgents(): string[] {
    return this.activeAgents$.value;
  }

  public activateAgent(id: string): void {
    if (this.agents.has(id) && !this.activeAgents$.value.includes(id)) {
      const activeAgents = [...this.activeAgents$.value, id];
      this.activeAgents$.next(activeAgents);
    }
  }

  public deactivateAgent(id: string): void {
    const activeAgents = this.activeAgents$.value.filter(agentId => agentId !== id);
    this.activeAgents$.next(activeAgents);
  }

  public getAgentMetrics(id: string): any {
    const agent = this.agents.get(id);
    if (!agent) return null;
    return agent.getMetrics();
  }
}

// Export the singleton instance
export const unifiedAgentService = UnifiedAgentService.instance; 