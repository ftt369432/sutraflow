/**
 * 🔄 Re-export barrel for types/agents (plural)
 * Many services/hooks import from 'types/agents' while the actual definitions
 * live in 'types/agent' (singular). This barrel bridges that gap.
 */
export {
    type Agent,
    type AgentAction,
    type AgentConfig,
    type AgentMetrics,
    type AgentFeedback,
    type AgentSuggestion,
    type AgentType,
    type AgentStatus,
    type AutonomyLevel,
    type AgentCapability,
    type AutonomousAction,
    type AutonomousDecision,
    type UserBehaviorPattern,
} from './agent';

// AgentEvent — referenced by useAgent.ts but not defined in agent.ts
export interface AgentEvent {
    id: string;
    agentId: string;
    type: 'started' | 'completed' | 'failed' | 'paused' | 'resumed' | 'feedback';
    timestamp: Date;
    data?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}
