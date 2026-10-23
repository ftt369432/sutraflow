import { Agent, AgentAction } from '../types/agents';
import { agentMetrics } from './agentMetricsService';

interface AgentContext {
  agent: Agent;
  memory: Map<string, any>;
  lastAction?: AgentAction;
  startTime: Date;
}

class AgentContextService {
  private contexts: Map<string, AgentContext> = new Map();

  initializeContext(agent: Agent) {
    this.contexts.set(agent.id, {
      agent,
      memory: new Map(),
      startTime: new Date()
    });
  }

  getContext(agentId: string): AgentContext | undefined {
    return this.contexts.get(agentId);
  }

  updateMemory(agentId: string, key: string, value: any) {
    const context = this.contexts.get(agentId);
    if (context) {
      context.memory.set(key, value);
    }
  }

  recordAction(agentId: string, action: AgentAction) {
    const context = this.contexts.get(agentId);
    if (context) {
      context.lastAction = action;
      const duration = Date.now() - context.startTime.getTime();
      agentMetrics.trackAction(context.agent, action, duration, action.status === 'completed');
    }
  }

  cleanupContext(agentId: string) {
    const context = this.contexts.get(agentId);
    if (context) {
      // Clean up any resources
      context.memory.clear();
      this.contexts.delete(agentId);
    }
  }

  getMemoryUsage(agentId: string): number {
    const context = this.contexts.get(agentId);
    return context ? context.memory.size : 0;
  }
}

export const agentContext = new AgentContextService(); 