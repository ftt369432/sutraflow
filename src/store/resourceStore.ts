import { create } from 'zustand';

export interface AgentLatency {
  agentName: string;
  latencyMs: number;
  lastPing: string;
}

export interface ResourceState {
  bridgeStatus: 'connected' | 'disconnected' | 'degraded';
  apiTokenUsage: {
    used: number;
    limit: number;
    provider: string;
  };
  agentLatency: AgentLatency[];
  lastUpdated: string;

  // Actions
  setBridgeStatus: (status: 'connected' | 'disconnected' | 'degraded') => void;
  updateTokenUsage: (used: number, limit: number, provider: string) => void;
  recordLatency: (agentName: string, latencyMs: number) => void;
}

export const useResourceStore = create<ResourceState>((set) => ({
  bridgeStatus: 'connected', // Default to connected for seamless demo experience
  apiTokenUsage: {
    used: 12450,
    limit: 100000,
    provider: 'OpenAI/Anthropic'
  },
  agentLatency: [
    { agentName: 'Sovereign Core', latencyMs: 120, lastPing: new Date().toISOString() },
    { agentName: 'Legal Eagle', latencyMs: 340, lastPing: new Date().toISOString() },
    { agentName: 'Vision Layer', latencyMs: 850, lastPing: new Date().toISOString() }
  ],
  lastUpdated: new Date().toISOString(),

  setBridgeStatus: (status) => set({ bridgeStatus: status, lastUpdated: new Date().toISOString() }),

  updateTokenUsage: (used, limit, provider) =>
    set({
      apiTokenUsage: { used, limit, provider },
      lastUpdated: new Date().toISOString()
    }),

  recordLatency: (agentName, latencyMs) =>
    set((state) => {
      const existing = state.agentLatency.find(a => a.agentName === agentName);
      let newLatencies;
      
      if (existing) {
        newLatencies = state.agentLatency.map(a =>
          a.agentName === agentName
            ? { ...a, latencyMs, lastPing: new Date().toISOString() }
            : a
        );
      } else {
        newLatencies = [
          ...state.agentLatency,
          { agentName, latencyMs, lastPing: new Date().toISOString() }
        ];
      }
      
      return {
        agentLatency: newLatencies,
        lastUpdated: new Date().toISOString()
      };
    }),
}));
