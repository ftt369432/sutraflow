import { useState, useEffect } from 'react';
import { unifiedAgentService } from '../services/unified';
import type { AgentConfig } from '../types/agent';

export function useUnifiedAgents() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load agents on mount
    try {
      const allAgents = unifiedAgentService.getAllAgents();
      setAgents(allAgents);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load agents:', err);
      setError('Failed to load agents');
      setLoading(false);
    }
  }, []);

  const createEmailAgent = (name: string, capabilities: string[]) => {
    try {
      const agent = unifiedAgentService.createEmailAgent(name, capabilities);
      setAgents([...agents, agent]);
      return agent;
    } catch (err) {
      console.error('Failed to create email agent:', err);
      setError('Failed to create email agent');
      throw err;
    }
  };

  const createCalendarAgent = (name: string, capabilities: string[]) => {
    try {
      const agent = unifiedAgentService.createCalendarAgent(name, capabilities);
      setAgents([...agents, agent]);
      return agent;
    } catch (err) {
      console.error('Failed to create calendar agent:', err);
      setError('Failed to create calendar agent');
      throw err;
    }
  };

  const createTaskAgent = (name: string, capabilities: string[]) => {
    try {
      const agent = unifiedAgentService.createTaskAgent(name, capabilities);
      setAgents([...agents, agent]);
      return agent;
    } catch (err) {
      console.error('Failed to create task agent:', err);
      setError('Failed to create task agent');
      throw err;
    }
  };

  const createDocumentAgent = (name: string, capabilities: string[]) => {
    try {
      const agent = unifiedAgentService.createDocumentAgent(name, capabilities);
      setAgents([...agents, agent]);
      return agent;
    } catch (err) {
      console.error('Failed to create document agent:', err);
      setError('Failed to create document agent');
      throw err;
    }
  };

  const removeAgent = (id: string) => {
    try {
      const success = unifiedAgentService.removeAgent(id);
      if (success) {
        setAgents(agents.filter(agent => agent.getConfig().id !== id));
      }
      return success;
    } catch (err) {
      console.error('Failed to remove agent:', err);
      setError('Failed to remove agent');
      throw err;
    }
  };

  const getAgentMetrics = (id: string) => {
    return unifiedAgentService.getAgentMetrics(id);
  };

  return {
    agents,
    loading,
    error,
    createEmailAgent,
    createCalendarAgent,
    createTaskAgent,
    createDocumentAgent,
    removeAgent,
    getAgentMetrics
  };
} 