// Re-export all agent-related services and types
export { EmailAgent } from './EmailAgent';
export { TaskAgent } from './TaskAgent';
export { BaseAgent } from './BaseAgent';
export type { AgentAction, AgentActionResult, AgentConfig } from './BaseAgent';

// 🤖 NEW AI AGENT SYSTEM - Hierarchical Task Management
export {
  initializeAIAgentSystem,
  getAIAgentOrchestrator,
  processUserRequestWithAgents,
  handleComplexRequestWithAgents,
  resetAIAgentSystem
} from './AIAgentIntegration';

export { AIAgentOrchestrator } from './AIAgentOrchestrator';
export {
  DocumentAgent,
  DocumentAgent as AIDocumentAgent,
  LegalAgent,
  MedicalAgent,
  CalendarAgent,
  CalendarAgent as AICalendarAgent,
  createAgentInstances
} from './SpecializedAgents';
// 🤖 NEW AI AGENT SYSTEM - Task Manager UI Component  
export { AIAgentTaskManager } from '../../components/ai/AIAgentTaskManager';

// AI Agent Types
export {
  AgentType
} from './types';

export { BridgeConnector, bridgeConnector } from './BridgeConnector';
export { TradingAgent } from './TradingAgent';

export type {
  AIAgent,
  AIAgentTask,
  TaskStatus,
  AgentMessage
} from './types';



// Re-export from the parent directory
export { AgentCreationService } from '../AgentCreationService';

// Export types more selectively to avoid ambiguity
// Agent types
export type {
  AgentType as LegacyAgentType,
  AgentStatus,
  Agent
} from '../../types/agent';

// Workflow types
export type {
  WorkflowPattern,
  WorkflowPatternType,
  WorkflowAction,
  WorkflowMetrics,
  WorkflowSuggestion,
  ActionMetrics
} from '../../types/workflow'; 