import { useState, useCallback } from 'react';
import { useAgentStore } from '../store/agentStore';
import { AgentExecutor } from '../lib/agents/AgentExecutor';
import { agentEvents } from '../services/agentEventService';
import type { Agent, AgentAction, AgentConfig, AgentEvent } from '../types/agents';

export function useAgent(agentId?: string) {
  const { 
    agents, 
    executeAction, 
    trainAgent, 
    updateAgent, 
    removeAgent,
    activeAgents,
    actions,
    createAgent,
    activateAgent,
    deactivateAgent
  } = useAgentStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agent = agentId ? agents.find(a => a.id === agentId) : undefined;
  const isActive = agent?.status === 'active';

  // Core agent execution
  const execute = async (actionType: string, input: any, priority?: number) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!agent) throw new Error('No agent selected');
      
      const executor = new AgentExecutor(agent, {
        priority,
        context: input?.context
      });

      const result = await executor.execute({
        agentId: agent.id,
        type: actionType,
        input,
        sessionId: crypto.randomUUID()
      });

      if (result.error) {
        throw new Error(result.error);
      }

      return result.output;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to execute action';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Training functionality
  const train = async (examples?: any[]) => {
    setIsLoading(true);
    setError(null);
    try {
      await trainAgent(agentId, examples);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to train agent';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Event subscription
  const subscribeToEvents = useCallback((onEvent: (event: AgentEvent) => void) => {
    if (!agentId) return () => {};
    return agentEvents.subscribeToAgent(agentId, onEvent);
  }, [agentId]);

  // Metrics calculation
  const getMetrics = useCallback(() => {
    if (!agentId) return null;
    
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
  }, [agentId, actions, activeAgents]);

  // State management
  const activate = useCallback(() => {
    if (agentId) activateAgent(agentId);
  }, [agentId, activateAgent]);

  const deactivate = useCallback(() => {
    if (agentId) deactivateAgent(agentId);
  }, [agentId, deactivateAgent]);

  const remove = useCallback(() => {
    if (agentId) removeAgent(agentId);
  }, [agentId, removeAgent]);

  return {
    agent,
    execute,
    train,
    subscribeToEvents,
    getMetrics,
    isLoading,
    error,
    isActive,
    activate,
    deactivate,
    remove,
    updateAgent: (updates: Partial<Agent>) => updateAgent(agentId, updates)
  };
} 