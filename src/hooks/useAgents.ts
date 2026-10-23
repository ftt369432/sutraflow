import { useCallback } from 'react';
import { useAgentStore } from '../store/agentStore';
import type { AgentConfig } from '../types/agents';

export function useAgents() {
  const { 
    agents,
    activeAgents,
    actions,
    createAgent,
    updateAgent,
    deleteAgent,
    activateAgent,
    deactivateAgent,
    startAction,
    completeAction,
    failAction
  } = useAgentStore();

  const getAgentMetrics = useCallback((agentId: string) => {
    const agentActions = actions.filter(action => action.agentId === agentId);
    const completedActions = agentActions.filter(action => action.status === 'completed');
    const failedActions = agentActions.filter(action => action.status === 'failed');
    
    return {
      totalActions: agentActions.length,
      successRate: agentActions.length > 0
        ? (completedActions.length / agentActions.length) * 100
        : 0,
      failureRate: agentActions.length > 0
        ? (failedActions.length / agentActions.length) * 100
        : 0,
      lastAction: agentActions[0],
      isActive: activeAgents.includes(agentId)
    };
  }, [actions, activeAgents]);

  const handleCreateAgent = useCallback(async (config: Partial<AgentConfig>) => {
    const agentId = await createAgent({
      ...config,
      type: config.type || 'general',
      industry: config.industry || 'general',
      capabilities: config.capabilities || [],
      modelConfig: config.modelConfig || {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000
      }
    });
    return agentId;
  }, [createAgent]);

  return {
    agents,
    activeAgents,
    actions,
    metrics: {
      totalAgents: agents.length,
      activeCount: activeAgents.length,
      totalActions: actions.length,
      getAgentMetrics
    },
    createAgent: handleCreateAgent,
    updateAgent,
    deleteAgent,
    activateAgent,
    deactivateAgent,
    startAction,
    completeAction,
    failAction
  };
} 