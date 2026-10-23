declare module '@/store/agentStore' {
    import { Agent, AgentAction, AgentFeedback, AgentStatus, AutonomyLevel } from '@/types/agent';

    interface AgentState {
        agents: Agent[];
        actions: AgentAction[];
        feedback: AgentFeedback[];
        activeAgents: string[];
        isLoading: boolean;
        error: string | null;
        
        // Basic CRUD
        setAgents: (agents: Agent[]) => void;
        addAgent: (agent: Agent) => void;
        updateAgent: (id: string, updates: Partial<Agent>) => void;
        removeAgent: (id: string) => void;
        
        // Agent Management
        createAgent: (agent: Omit<Agent, 'metrics' | 'id' | 'lastActive' | 'performance' | 'tasks'>) => void;
        deleteAgent: (id: string) => void;
        
        // Agent Actions
        startAction: (agentId: string, type: string, input: any) => Promise<string>;
        completeAction: (actionId: string, output?: any) => Promise<void>;
        failAction: (actionId: string, error: string) => Promise<void>;
        
        // Feedback
        submitFeedback: (feedback: Omit<AgentFeedback, 'id' | 'timestamp'>) => Promise<void>;
        
        // Agent Status
        activateAgent: (id: string) => void;
        deactivateAgent: (id: string) => void;
        updateAgentStatus: (id: string, status: AgentStatus) => void;
        updateAutonomyLevel: (id: string, level: AutonomyLevel) => void;

        // Agent Operations
        executeAction: (agentId: string, actionType: string, input: any) => Promise<any>;
        trainAgent: (agentId: string) => Promise<void>;
    }

    export const useAgentStore: () => AgentState;
} 