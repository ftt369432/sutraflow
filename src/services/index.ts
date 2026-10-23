/**
 * Services Index
 * 
 * Central export point for all service modules.
 * This provides a clean API for importing services throughout the application.
 */

// Core AI Services
export * from './ai/aiService';

// Drive Services  
export { AIDriveService } from './drive/aiDriveService';
export type { AIDriveFile, FileSearchOptions } from './drive/aiDriveService';

// Unified Services
export { 
  UnifiedDocumentService, 
  createUnifiedDocumentService, 
  getUnifiedDocumentService 
} from './unified/documentService';
export type { DocumentSource, DocumentServiceConfig } from './unified/documentService';

// Knowledge Base Services
export { genieDriveKnowledgeBaseService } from './genieDriveKnowledgeBaseService';

// Search Services
export { searchDocuments } from './searchService';
export type { KnowledgeSearchResult } from './searchService';

// Agent Services
export * from './agentService';
export * from './agentCapabilityService';
export * from './agentContextService';
export * from './agentErrorHandler';
export * from './agentEventService';
export * from './agentLoggingService';
export * from './agentMetricsService';
export * from './agentQueueService';
export * from './agentRateLimiter';
export * from './agentStateService';
export * from './agentTimeoutService';
export * from './agentTrainingService';
export * from './agentValidationService';
export * from './AgentCreationService';

// Document Services
export * from './documentChatService';

// Embedding Services
export * from './embeddingService';

// AI Assistant Services
export * from './GenieAssistant';
export * from './GenieMagicService';
export * from './AIAssistantService';
export * from './assistantConversationService';

// Learning Services
export * from './LearningService';
export * from './MindfulnessService';
export * from './MorningRoutineService';

// Voice Services
export * from './VoiceControl';

// Task Services
export * from './TaskService';

// Calendar Services
export * from './CalendarService';

// User Services
export * from './userService';

// Workflow Services
export * from './WorkflowLearner';
export * from './WorkflowOrchestrator'; 

// Other Services
export * from './feedbackService';
export * from './trainingService';
export * from './aiChatService';
export * from './aiConfig';

// Auth Services
export * from './auth/authService';

// AI Services - Additional exports
export { AIProcessor } from './ai/AIProcessor';
export * from './aiChatService';
export * from './aiConfig';

// Email Services
export * from './email';

// Additional Task Services (using tasks/ folder instead of root TaskService)

// Integration Services
export * from './integration'; 