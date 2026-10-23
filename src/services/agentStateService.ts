import { Agent, AgentAction } from '../types/agents';

interface AgentState {
  agent: Agent;
  actions: AgentAction[];
  memory: Record<string, any>;
  lastUpdated: Date;
}

class AgentStateService {
  private readonly STORAGE_KEY = 'agent_states';

  async saveState(agentId: string, state: Partial<AgentState>) {
    const states = await this.getAllStates();
    states[agentId] = {
      ...states[agentId],
      ...state,
      lastUpdated: new Date()
    };
    
    await localStorage.setItem(this.STORAGE_KEY, JSON.stringify(states));
  }

  async loadState(agentId: string): Promise<AgentState | null> {
    const states = await this.getAllStates();
    return states[agentId] || null;
  }

  async getAllStates(): Promise<Record<string, AgentState>> {
    const statesJson = localStorage.getItem(this.STORAGE_KEY);
    return statesJson ? JSON.parse(statesJson) : {};
  }

  async clearState(agentId: string) {
    const states = await this.getAllStates();
    delete states[agentId];
    await localStorage.setItem(this.STORAGE_KEY, JSON.stringify(states));
  }
}

export const agentStateService = new AgentStateService(); 