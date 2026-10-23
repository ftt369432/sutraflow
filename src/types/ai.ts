/**
 * TODO: LINTER_CLEANUP - A significant number of type definitions in this file have been flagged
 * by the linter as potentially unused. These require careful manual review and cleanup.
 * Consider commenting out or deleting them if they are confirmed to be unused across the project.
 */

/**
 * AI Types
 * 
 * This file defines the types related to AI functionality in the application.
 */

export interface AIDocument {
  id: string;
  content: string;
  metadata: {
    source: string;
    title?: string;
    author?: string;
    date?: Date;
    category?: string;
    tags?: string[];
    size?: number;
    created_by?: string; // Added created_by
    ai_summary?: string; // Added for Supabase persistence
    ai_topics?: string[]; // Added for Supabase persistence
    ai_entities?: string[]; // Added for entity extraction
    ai_complexity?: 'simple' | 'moderate' | 'complex'; // Document complexity
    ai_sentiment?: 'positive' | 'negative' | 'neutral'; // Document sentiment
    ai_auto_tags?: string[]; // Auto-generated tags
    ai_processed_at?: string; // Timestamp when AI processed the document
    has_embedding?: boolean; // Flag if document has embeddings
    vectorized?: boolean; // Alias for has_embedding
    starred?: boolean; // If document is starred
    ai_metadata?: Record<string, unknown>; // Added for additional AI metadata
  };
  embedding?: number[];
  relevanceScore?: number;
  folderId?: string;
  title?: string;
  type?: string;
  userId?: string; // Added for Supabase persistence
  // AI processing status fields (top-level database columns)
  ai_enabled?: boolean; // Whether AI processing is enabled for this document
  ai_last_processed?: string; // When the document was last processed by AI
  ai_confidence?: number; // AI processing confidence score (0.0 to 1.0)
}

export interface Folder {
  id: string;
  name: string;
  parent_folder_id: string | null; // Changed from parentId
  createdAt: Date;
  updatedAt: Date;
}

// Keep existing AIFolder for backward compatibility
export interface AIFolder {
  id: string;
  name: string;
  parent_folder_id?: string | null; // Changed from parentId
  documents: AIDocument[];
  createdAt: Date;
  updatedAt: Date;
  linkedAssistants?: string[]; // IDs of assistants linked to this folder
  userId?: string; // Added for Supabase persistence
  ai_summary?: string; // Added: From Supabase 'folders' table
  ai_topics?: string[]; // Added: From Supabase 'folders' table (jsonb)
}

export interface AIPrompt {
  id: string;
  name: string;
  content: string;
  category: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  capabilities: string[];
  contextSize: number;
}

export interface AIModelSettings {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
}

export type AICapability =
  | 'text-generation'
  | 'chat'
  | 'embeddings'
  | 'image-generation'
  | 'text-to-speech'
  | 'speech-to-text'
  | 'code-generation'
  | 'summarization'
  | 'translation';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: Date;
  metadata?: MessageMetadata;
  isStreaming?: boolean;         // Indicates if this message is currently streaming
  streamProgress?: number;       // Optional streaming progress indicator (0-100)
  streamingStartTime?: Date;     // When the streaming started
  streamingCompleteTime?: Date;  // When the streaming completed
  chunks?: string[];             // Optional array of content chunks received during streaming
  edited?: boolean;              // Indicates if this message has been edited
  regenerated?: boolean;         // Indicates if this message has been regenerated
}

export type AgentType = 'research' | 'work' | 'learning' | 'building' | 'general' | 'tasks' | 'email' | 'calendar' | 'drive' | 'coaching' | 'data';

export interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
}

export interface AIAssistant {
  id: string;
  name: string;
  type: AgentType;
  category?: string;             // Added category property
  capabilities: string[];
  avatar?: string;
  description?: string;
  isActive: boolean;
  linkedFolders?: string[]; // IDs of folders linked to this assistant
  createdAt: Date;
  updatedAt: Date;
  system_prompt?: string;
  knowledgeBase?: AIFolder[];
  model?: AIModel; // Added model
  settings?: AIModelSettings; // Added settings
  created_by?: string; // User ID of the creator
  metadata?: Record<string, unknown>; // Added metadata for extensions
  quickActions?: QuickAction[]; // Dynamic dashboard buttons based on active assistant
  // Team & Org Sharing
  team_id?: string;
  org_id?: string;
  visibility?: 'personal' | 'team' | 'org' | 'public';
}


export interface AssistantResponse {
  message: Message;
  suggestions?: string[];
  actions?: {
    type: string;
    payload: unknown;
  }[];
}

export interface AIConversation {
  id: string;
  title: string;
  messages: Message[];
  assistant: AIAssistant;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    totalTokens?: number;
    tags?: string[];
    summary?: string;
  };
}

export interface AIAnalysis {
  summary: string;
  entities?: string[];
  keyPhrases?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  topics?: string[];
  language?: string;
  classification?: Record<string, number>;
  complexity?: 'simple' | 'moderate' | 'complex';
}

export interface AIConfig {
  provider: string;
  defaultModel: AIModel;
  apiKey?: string;
  apiEndpoint?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  debug?: boolean;
}

export interface MessageMetadata {
  mode?: 'flash' | 'flash-lite' | 'pro';
  model?: string;
  provider?: string;
  tokens?: number;
  processingTime?: number;
  context?: Array<{
    title: string;
    content: string;
    similarity?: number;
    metadata?: Record<string, unknown>;
  }>;
  // File attachment metadata
  hasAttachments?: boolean;
  attachmentCount?: number;
  attachmentTypes?: string[];
  files?: Array<{
    name: string;
    size: number;
    type: string;
    content?: string;
  }>;
  error?: string;
  edited?: boolean;
  threadId?: string;
  parent_message_id?: string; // Changed from parentId
  reactions?: { [key: string]: string[] };
  formatting?: {
    isBold?: boolean;
    isItalic?: boolean;
    isCode?: boolean;
    language?: string;
  };
  isTyping?: boolean;
  // Proactive assistance properties
  taskDetected?: boolean;
  detectedTask?: Task;
  isProactiveAssistance?: boolean;
  assistanceType?: 'task_detection' | 'struggle_detection' | 'progress_support';
  taskId?: string;
  // Task breakdown properties
  isTaskBreakdown?: boolean;
  originalTaskId?: string;
  subtasks?: Task[];
  // Information synthesis properties
  isSynthesisQuery?: boolean;
  isSynthesisResult?: boolean;
  isSynthesis?: boolean;
  synthesisResult?: {
    summary: string;
    keyPoints: string[];
    sources: string[];
    confidence: number;
  };
  confidence?: number;
  sourcesCount?: number;
  isActionableItems?: boolean;
  actionableItems?: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: Date;
    category?: string;
  }>;
  isRelatedQueries?: boolean;
  relatedQueries?: string[];
  query?: string;
  errorType?: string;
  // AI Agent workflow properties
  aiAgentWorkflow?: boolean;
  workflowId?: string;
  involvedAgents?: string[];
  toolsUsed?: string[];
}

export interface DocumentReference {
  id: string;
  title: string;
  type: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  url?: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface EmbeddingResponse {
  embedding: number[];
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  model: string;
  provider: string;
  systemPrompt?: string;
  assistantId?: string;
  assistantName?: string;
  category?: 'work' | 'learning' | 'productivity' | 'personal';
  tags?: string[];
  pinned?: boolean;
  documents?: AIDocument[];
  clientId?: string;
  caseType?: string;
  caseStatus?: 'active' | 'pending' | 'closed';
  lastAccessed?: Date;
}

export interface AIState extends AIConfig {
  isLoading: boolean;
  error: string | null;
}

export interface SearchFilters {
  timeRange?: string;
  sourceType?: string;
  sortBy?: string;
  language?: string;
  region?: string;
}

export interface DocumentProcessingOptions {
  extractText: boolean;
  generateSummary: boolean;
  detectLanguage: boolean;
  extractMetadata: boolean;
  performOCR: boolean;
  splitIntoChunks: boolean;
  chunkSize: number;
}

export interface Feedback {
  messageId: string;
  type: 'good' | 'bad';
  text?: string; // Optional feedback text
}

// AI Service Options and Results
export interface AIGenerateTextOptions {
  model?: string;
  provider?: 'google' | 'anthropic' | 'groq';
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  systemPrompt?: string; // 👻 Cortex Soul Injection
}

export interface AIAnalysisOptions {
  includeSummary?: boolean;
  includeTopics?: boolean;
  includeEntities?: boolean;
  includeSentiment?: boolean;
  includeKeyPhrases?: boolean;
  maxSummaryLength?: number;
  topicCount?: number;
}

export interface AIAnalysisResult {
  summary?: string;
  topics?: string[];
  entities?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  keyPhrases?: string[];
  language?: string;
  complexity?: 'simple' | 'moderate' | 'complex';
  confidence?: number;
}

export type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'completed';

export interface Task {
  id: string;
  description: string;
  status: TaskStatus;
  createdAt: Date;
  updatedAt?: Date;
  completedAt?: Date;
  assignee?: string;
  priority?: 'low' | 'medium' | 'high';
}