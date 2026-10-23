import {
    AgentType as UnifiedAgentType,
    AgentTaskStatus as UnifiedTaskStatus,
    AgentTaskPriority as UnifiedTaskPriority,
    AgentMessage as UnifiedAgentMessage,
    AIAgentTask as UnifiedAIAgentTask,
    Agent as UnifiedAgent
} from '../../types/agent';

// Re-export unified types with local names for backward compatibility
export const AgentType = {
    DOCUMENT_AGENT: UnifiedAgentType.DOCUMENT,
    CALENDAR_AGENT: UnifiedAgentType.CALENDAR,
    APPOINTMENT_AGENT: UnifiedAgentType.APPOINTMENT,
    EMAIL_AGENT: UnifiedAgentType.EMAIL,
    LEGAL_AGENT: UnifiedAgentType.LEGAL,
    MEDICAL_AGENT: UnifiedAgentType.MEDICAL,
    ORCHESTRATOR_AGENT: UnifiedAgentType.ORCHESTRATOR,
    UNIVERSAL_AGENT: UnifiedAgentType.UNIVERSAL,
    TASK_AGENT: UnifiedAgentType.TASK,
    ASSISTANT_AGENT: UnifiedAgentType.ASSISTANT,
    PLANNER_AGENT: UnifiedAgentType.PLANNER,
    TRADING_AGENT: UnifiedAgentType.TRADING,
    ...UnifiedAgentType // Include new ones
} as const;

// Ensure type compatibility
export type AgentType = UnifiedAgentType;

export {
    UnifiedTaskStatus as TaskStatus,
    UnifiedTaskPriority as TaskPriority
};

export type AgentMessage = UnifiedAgentMessage;
export type AIAgentTask = UnifiedAIAgentTask;
export type AIAgent = {
    type: AgentType;
    name: string;
    capabilities: string[];
    isAvailable: boolean;
    canHandle(task: AIAgentTask): boolean;
    executeTask(task: AIAgentTask): Promise<AIAgentTask>;
    sendMessage(message: AgentMessage): Promise<void>;
    receiveMessage(message: AgentMessage): Promise<void>;
    analyzeComplexity(instruction: string): Promise<AIAgentTask[]>;
    breakdownTask(task: AIAgentTask): Promise<AIAgentTask[]>;
};
