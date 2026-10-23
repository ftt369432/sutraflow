import { useState, useCallback } from 'react';
import { AgentExecutor } from '../lib/agents/AgentExecutor';
import { useAgentStore } from '../store/agentStore';
import type { AgentConfig } from '../types/agents';

export function useAgentExecution(agentConfig: AgentConfig) {
  const store = useAgentStore();
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (input: any, metadata?: Record<string, any>) => {
    setIsExecuting(true);
    setError(null);

    try {
      const executor = new AgentExecutor(agentConfig, store);
      const result = await executor.execute({
        agentId: agentConfig.id,
        input,
        sessionId: crypto.randomUUID(),
        metadata
      });

      if (result.error) {
        setError(result.error);
        return null;
      }

      return result.output;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsExecuting(false);
    }
  }, [agentConfig, store]);

  return {
    execute,
    isExecuting,
    error
  };
} 