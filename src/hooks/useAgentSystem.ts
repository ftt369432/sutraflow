import { useState, useCallback } from 'react';
import { useAgentStore } from '../store/agentStore';
import { agentService } from '../services/agentService';
import { agentTraining } from '../services/agentTrainingService';
import type { Agent, AgentAction } from '../types/agents';

export function useAgentSystem(agentId: string) {
  const { agents, updateAgent } = useAgentStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agent = agents.find(a => a.id === agentId);

  const executeAction = useCallback(async (actionType: string, input: any, priority?: number) => {
    if (!agent) throw new Error('Agent not found');
    setIsLoading(true);
    setError(null);

    try {
      const action: AgentAction = {
        id: crypto.randomUUID(),
        agentId,
        type: actionType,
        status: 'pending',
        input,
        startedAt: new Date()
      };

      if (priority) {
        return await agentService.queueAction(agent, action, priority);
      } else {
        return await agentService.executeAction(agent, action);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [agent, agentId]);

  const train = useCallback(async (examples) => {
    if (!agent) throw new Error('Agent not found');
    setIsLoading(true);
    setError(null);

    try {
      const result = await agentTraining.trainAgent(agent, examples);
      updateAgent(agentId, {
        metrics: {
          ...agent.metrics,
          accuracy: result.accuracy
        }
      });
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [agent, agentId, updateAgent]);

  const getMetrics = useCallback(() => {
    if (!agent) return null;
    return agentService.getAgentMetrics(agentId);
  }, [agent, agentId]);

  return {
    agent,
    executeAction,
    train,
    getMetrics,
    isLoading,
    error
  };
} 