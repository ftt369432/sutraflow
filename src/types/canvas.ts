// Canvas Types for Intelligent Canvas System
export type ContentType =
  | 'legal_contract'
  | 'business_plan'
  | 'academic_paper'
  | 'formal_letter'
  | 'technical_report'
  | 'presentation'
  | 'email_template'
  | 'custom_document'
  | 'petition'
  | 'legal_brief'
  | 'research'
  | 'contract_review'
  | 'visualizer'
  | 'case_timeline';

export interface CanvasDocument {
  id: string;
  title: string;
  content: string;
  type: string;
  created: Date;
  modified: Date;
  aiDriveFileId?: string;
  url?: string; // S3/Storage URL for previewing
  metadata?: Record<string, any>;
}

export interface Canvas extends CanvasDocument {
  // Any UI-only properties for the active canvas tabs
  isModified?: boolean;
}

export type CanvasItemType =
  | 'text'
  | 'note'
  | 'image'
  | 'document'
  | 'link'
  | 'audio'
  | 'video'
  | 'task'
  | 'comment'
  | 'drawing'
  | 'table'
  | 'code';

export type AgentSpecialization =
  | 'research'
  | 'writing'
  | 'formatting'
  | 'legal_review'
  | 'fact_check'
  | 'citation'
  | 'compliance'
  | 'financial_analysis';

export type AgentStatus = 'idle' | 'working' | 'completed' | 'error';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface ChatContext {
  previousMessages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  currentInput?: string;
  userPreferences?: {
    responseStyle?: 'concise' | 'detailed';
    documentTypes?: ContentType[];
  };
}

export interface ContentAnalysis {
  shouldOpenCanvas: boolean;
  contentType: ContentType;
  confidence: number;
  suggestedTemplate: string;
  extractedRequirements: string[];
  estimatedComplexity: 'simple' | 'moderate' | 'complex';
  suggestedAgents: AgentSpecialization[];
}

export interface CanvasAgent {
  id: string;
  specialization: AgentSpecialization;
  documentId: string;
  status: AgentStatus;
  currentSection: string | null;
  taskList: AITask[];
  lastActivity: Date;
  progress: number;
}

export interface AITask {
  id: string;
  agentId: string;
  type: string;
  description: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  estimatedTime: number; // in minutes
  dependencies: string[]; // other task IDs
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

export interface DocumentContent {
  id: string;
  title: string;
  content: string;
  contentType: ContentType;
  structure: DocumentSection[];
  metadata: DocumentMetadata;
  version: number;
  lastModified: Date;
  collaborators: string[];
}

export interface DocumentSection {
  id: string;
  title: string;
  content: string;
  order: number;
  agentId?: string; // which agent is working on this section
  status: 'draft' | 'review' | 'completed';
  wordCount: number;
}

export interface DocumentMetadata {
  wordCount: number;
  readingTime: number; // in minutes
  language: string;
  tags: string[];
  citations: Citation[];
  complexity: 'simple' | 'moderate' | 'complex';
  completionProgress: number; // 0-100
}

export interface Citation {
  id: string;
  text: string;
  source: string;
  url?: string;
  type: 'case' | 'statute' | 'regulation' | 'article' | 'book' | 'website';
  verified: boolean;
}

export interface CanvasWindow {
  id: string;
  contentType: ContentType;
  document: DocumentContent;
  agents: CanvasAgent[];
  position: WindowPosition;
  size: WindowSize;
  isDocked: boolean;
  isMinimized: boolean;
  zIndex: number;
}

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface TemplateLibrary {
  id: string;
  name: string;
  contentType: ContentType;
  description: string;
  sections: TemplateSection[];
  suggestedAgents: AgentSpecialization[];
  estimatedTime: number; // in minutes
  complexity: 'simple' | 'moderate' | 'complex';
}

export interface TemplateSection {
  id: string;
  title: string;
  description: string;
  content: string;
  isRequired: boolean;
  order: number;
  wordCountTarget?: number;
}

export interface DocumentChange {
  id: string;
  documentId: string;
  agentId: string;
  sectionId: string;
  type: 'insert' | 'delete' | 'modify';
  content: string;
  position: number;
  timestamp: Date;
  conflictsWith?: string[]; // other change IDs
}

export interface ConflictResolution {
  changeId: string;
  resolution: 'accept' | 'reject' | 'merge';
  mergedContent?: string;
  reason: string;
}

export interface AgentResult {
  agentId: string;
  taskId: string;
  content: string;
  confidence: number;
  timestamp: Date;
  suggestions?: string[];
  citations?: Citation[];
}

export interface ProgressReport {
  documentId: string;
  overallProgress: number; // 0-100
  sectionsCompleted: number;
  sectionsTotal: number;
  agentProgress: Array<{
    agentId: string;
    specialization: AgentSpecialization;
    progress: number;
    currentTask?: string;
  }>;
  estimatedTimeRemaining: number; // in minutes
  qualityScore: number; // 0-100
}

export interface ExportOptions {
  format: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'html' | 'json';
  includeComments: boolean;
  includeTrackChanges: boolean;
  template?: string;
  watermark?: string;
  password?: string;
}

export interface LaunchTrigger {
  patterns: string[];
  contentTypes: ContentType[];
  minConfidence: number;
  requiredContext?: string[];
} 