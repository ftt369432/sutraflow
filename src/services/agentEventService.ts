import { Agent, AgentAction } from '../types/agents';

export type AgentEvent = 
  | { type: 'agent:created'; agent: Agent }
  | { type: 'agent:updated'; agent: Agent }
  | { type: 'agent:deleted'; agentId: string }
  | { type: 'action:started'; action: AgentAction }
  | { type: 'action:completed'; action: AgentAction; result: any }
  | { type: 'action:failed'; action: AgentAction; error: Error }
  | { type: 'status:changed'; agentId: string; status: string }
  | { type: 'memory:updated'; agentId: string; key: string; value: any };

class AgentEventService {
  private listeners: Map<string, Set<(event: AgentEvent) => void>> = new Map();

  subscribe(eventType: AgentEvent['type'], listener: (event: AgentEvent) => void) {
    const listeners = this.listeners.get(eventType) || new Set();
    listeners.add(listener);
    this.listeners.set(eventType, listeners);

    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        listeners.delete(listener);
      }
    };
  }

  emit(event: AgentEvent) {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  subscribeToAgent(agentId: string, listener: (event: AgentEvent) => void) {
    const unsubscribers = [
      this.subscribe('action:started', event => {
        if ('action' in event && event.action.agentId === agentId) {
          listener(event);
        }
      }),
      this.subscribe('action:completed', event => {
        if ('action' in event && event.action.agentId === agentId) {
          listener(event);
        }
      }),
      this.subscribe('status:changed', event => {
        if (event.agentId === agentId) {
          listener(event);
        }
      })
    ];

    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }
}

export const agentEvents = new AgentEventService(); 