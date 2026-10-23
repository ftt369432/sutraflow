import { useEffect } from 'react';
import { agentEvents, AgentEvent } from '../services/agentEventService';

export function useAgentEvents(
  agentId: string,
  onEvent: (event: AgentEvent) => void
) {
  useEffect(() => {
    const unsubscribe = agentEvents.subscribeToAgent(agentId, onEvent);
    return () => unsubscribe();
  }, [agentId, onEvent]);
} 