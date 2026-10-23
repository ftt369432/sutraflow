// Core types
export * from './actions'; // Exports ActionMetrics
export {
  // Explicitly list exports from ai.ts, excluding AgentType and AssistantResponse
  type AIDocument,
  type AIFolder,
  type AIPrompt,
  type AIModel,
  type AICapability,
  type MessageRole,
  type Message,
  // type AgentType as AIAgentType, // Not re-exporting ai.ts's AgentType from index.ts
  type AIAssistant,
  // type AssistantResponse, // Not re-exporting ai.ts's AssistantResponse from index.ts
  type AIConversation,
  type AIAnalysis,
  type AIConfig,
  type MessageMetadata,
  type DocumentReference,
  type SearchResult,
  type EmbeddingResponse,
  type Conversation, // This might still conflict
  type AIState,
  type SearchFilters,
  type DocumentProcessingOptions
} from './ai';
export * from './agent'; // Exports AgentType, AgentFeedback, AgentMetrics, AgentConfig, AgentSuggestion, AutonomyLevel, LegalDocument
// export * from './agents'; // File does not exist
export * from './assistant'; // Exports its UserPreferences and AssistantResponse
export * from './execution';
export * from './genie';
export {
  // Explicitly list exports from metrics.ts, aliasing conflicting names
  type DailyActivity,
  type PerformanceMetric,
  type AgentFeedback as MetricsAgentFeedback,
  type AgentStats,
  type AgentMetrics as MetricsAgentMetrics
} from './metrics';

// Email types
export * from './email';

// Documents and drive types
export * from './documents';
// GenieDrive types removed - consolidated to AI Drive system

// Calendar and tasks types
export * from './calendar';
// export * from './task'; // Commented out to prioritize ./tasks.ts for Task, TaskPriority, TaskStatus
export * from './tasks'; // Exports general Task, TaskPriority, TaskStatus
export * from './contacts';

// Workflow types
export {
  // Explicitly list exports from workflow.ts, aliasing/excluding conflicting names
  type WorkflowPatternType,
  type WorkflowAction,
  type UserAction,
  type WorkflowPattern,
  type WorkflowMetrics, // This is unique to workflow.ts
  type WorkflowSuggestion, // This is unique to workflow.ts (different from AgentSuggestion)
  type AgentSuggestion as WorkflowAgentSuggestion, // Aliased, different from agent.ts's AgentSuggestion
  type AgentExecutionResult,
  type ActionMetrics as WorkflowActionMetrics, // Aliased, different from actions.ts's ActionMetrics
  type AgentMetrics as WorkflowContextAgentMetrics, // Aliased, different from agent.ts's & metrics.ts's AgentMetrics
  type WorkflowStep,
  type WorkflowConfig as WorkflowFileConfig, // Aliased, AgentConfig is more general in agent.ts
  type WorkflowResult
  // AutonomyLevel is identical to agent.ts, so not re-exported here
} from './workflow';
export * from './capabilities';

// Legal types
export {
  type LegalCase,
  type LegalCaseDocument,
  type CaseEvent,
  type ResearchQuery,
  type ResearchResult,
  type AIMessage as LegalAIMessage,
  type LegalAgentCapability,
  type LegalAgentRole,
  type LegalAgentRoleDefinition,
  type LegalSwarmTemplate,
  type LegalHearingInfo,
  type LegalSwarmProcessorResult,
  type LegalCaseInputResult
} from './legal';

// Training and learning types
export * from './learning'; // Exports its UserBehavior
export * from './trainingData';

// Personality types
export * from './geniePersonalities';
export {
  type UserBehavior as InteractionUserBehavior, // Aliased
  type PersonalityProfile, // Default PersonalityProfile
  type UserPreferences as PersonalityUserPreferences, // Aliased
  type PersonalityType,
  type PersonalityTraits,
  type CommunicationPreferences,
  type EmotionalIntelligence,
  type PersonalityArchetype
  // type PersonalityService, // Decided not to re-export service interfaces from index
} from './personality';

// Voice types
export {
  type VoiceCommand,
  type UserPreferences as VoiceUserPreferences, // Aliased
  type PersonalityProfile as VoicePersonalityProfile // Aliased
} from './voice';

// Utility types
export * from './utils';
// export * from './global'; // global.d.ts is for global declarations, not module export

// Service types
// export * from './google'; // google.d.ts is for global declarations, not module export