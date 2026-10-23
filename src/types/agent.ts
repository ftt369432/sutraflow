import type { WorkflowPattern as _WorkflowPattern } from './workflow';

// Consolidate agent-related types from multiple files into one
export enum AgentType {
  ASSISTANT = 'assistant',
  RESEARCH = 'research',
  DEVELOPMENT = 'development',
  ANALYSIS = 'analysis',
  EMAIL = 'email',
  DOCUMENT = 'document',
  CALENDAR = 'calendar',
  APPOINTMENT = 'appointment',
  LEGAL = 'legal',
  MEDICAL = 'medical',
  ORCHESTRATOR = 'orchestrator',
  UNIVERSAL = 'universal',
  TASK = 'task',
  PLANNER = 'planner',
  TRADING = 'trading',
  INVESTIGATION = 'investigation',
  ONTOLOGY = 'ontology',
  CUSTOM = 'custom'
}
// For backward compatibility while we transition
export type LegacyAgentType = AgentType | string;

export enum AgentStatus {
  ACTIVE = 'active',
  IDLE = 'idle',
  ERROR = 'error',
  INACTIVE = 'inactive',
  TRAINING = 'training',
  PAUSED = 'paused'
}

export type AutonomyLevel = 'supervised' | 'semi-autonomous' | 'autonomous';

// Enhanced Autonomy Levels for Universal System
export enum UniversalAutonomyLevel {
  SUGGESTION_ONLY = "suggestion",
  LOW_RISK_AUTO = "low_risk",
  MEDIUM_RISK_AUTO = "medium_risk",
  HIGH_AUTONOMY = "high",
  FULL_AUTONOMY = "full"
}

export enum ProfessionType {
  LEGAL = "legal",
  MEDICAL = "medical",
  BUSINESS = "business",
  TECHNICAL = "technical",
  CREATIVE = "creative",
  EDUCATION = "education",
  FINANCE = "finance",
  TRADING = "trading",
  CONSULTING = "consulting",
  UNIVERSAL = "universal"
}

export type AgentCapability =
  | 'email-processing'
  | 'document-analysis'
  | 'scheduling'
  | 'task-management'
  | 'natural-language'
  | 'calendar-management'
  | 'drafting'
  | 'web-search'
  | 'data-analysis'
  | 'report-generation'
  | 'code-generation'
  | 'code-review'
  | 'debugging'
  | 'autonomous-decision-making'
  | 'pattern-recognition'
  | 'predictive-analytics'
  | 'cross-agent-learning'
  | 'risk-assessment'
  | 'legal-research'
  | 'case-management'
  | 'deadline-tracking'
  | 'client-communication';

// Autonomous Action Types
export interface AutonomousAction {
  id: string;
  type: string;
  description: string;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  expectedOutcome: string;
  requiredApprovals: string[];
  dependencies: string[];
  timeEstimate: number; // in minutes
  rollbackPossible: boolean;
  metadata: Record<string, any>;
}

// User Behavior Pattern Types
export interface UserBehaviorPattern {
  id: string;
  pattern: string;
  frequency: number;
  context: string[];
  predictedNextAction: AutonomousAction;
  confidence: number;
  triggers: string[];
  profession: ProfessionType;
  userId: string;
  learningData: PatternLearningData;
}

export interface PatternLearningData {
  successRate: number;
  totalOccurrences: number;
  lastOccurrence: Date;
  adaptationHistory: AdaptationEvent[];
  crossUserValidation: number;
}

export interface AdaptationEvent {
  timestamp: Date;
  change: string;
  reason: string;
  impact: number;
}

// Professional Context Types
export interface ProfessionalContext {
  profession: ProfessionType;
  specialization?: string;
  currentCase?: string;
  activeProjects: string[];
  urgentItems: string[];
  clientContext?: ClientContext;
  deadlines: Deadline[];
  regulations: Regulation[];
  templates: Template[];
}

export interface ClientContext {
  clientId: string;
  clientName: string;
  caseType: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  preferences: ClientPreference[];
  history: ClientInteraction[];
}

export interface ClientPreference {
  type: string;
  value: string;
  confidence: number;
}

export interface ClientInteraction {
  timestamp: Date;
  type: string;
  content: string;
  outcome: string;
  satisfaction: number;
}

export interface Deadline {
  id: string;
  title: string;
  dueDate: Date;
  type: string;
  criticality: number;
  dependencies: string[];
  bufferTime: number;
}

export interface Regulation {
  id: string;
  type: string;
  description: string;
  applicability: string[];
  requirements: string[];
  penalties: string[];
}

export interface Template {
  id: string;
  name: string;
  type: string;
  content: string;
  variables: TemplateVariable[];
  professionSpecific: boolean;
}

export interface TemplateVariable {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  validation?: string;
}

/**
 * Definitive Agent Configuration
 * Used across Store, Executor, and Plugin systems.
 */
export interface AgentConfig {
  id: string;
  name: string;
  description?: string;
  type: AgentType | string;
  version?: string;
  status?: AgentStatus | string;
  autonomyLevel?: AutonomyLevel;
  universalAutonomyLevel?: UniversalAutonomyLevel;
  profession?: ProfessionType;

  // Capability & Behavior
  capabilities: AgentCapability[] | string[];
  triggers?: {
    events: string[];
    schedule?: string;
  };
  behaviorPatterns?: UserBehaviorPattern[];
  professionalContext?: ProfessionalContext;

  // AI/Model Settings (Used by BaseAgent & Brain)
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  customInstructions?: string; // Used by AgentExecutor

  // Model Config Object (Legacy/Executor compatibility)
  modelConfig?: {
    model: string;
    temperature?: number;
    maxTokens?: number;
  };

  // Metadata & Preferences
  preferences?: Record<string, any>;
  metadata?: Record<string, any>;
  created?: Date | any;
  lastModified?: Date | any;
  createdAt?: Date | any;
  updatedAt?: Date | any;
}

export interface AgentMetrics {
  performance: number;
  tasks: {
    completed: number;
    total: number;
  };
  responseTime: number;
  successRate: number;
  lastUpdated: Date;
  accuracy: number;
  uptime: number;
  autonomousActions: {
    executed: number;
    successful: number;
    failed: number;
  };
  learningProgress: number;
  predictionAccuracy: number;
}

// 🤖 AI Agent Messaging & Task System
export enum AgentTaskStatus {
  PENDING = 'pending',
  ANALYZING = 'analyzing',
  IN_PROGRESS = 'in-progress',
  WAITING_DEPENDENCY = 'waiting-dependency',
  AGENT_HANDOFF = 'agent-handoff',
  PLAN_REVIEW = 'plan-review',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum AgentTaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

export interface AgentMessage {
  id: string;
  fromAgent: AgentType | string;
  toAgent: AgentType | string;
  messageType: 'request' | 'response' | 'notification' | 'error';
  payload: any;
  timestamp: Date;
  correlationId?: string;
}

export interface AIAgentTask {
  id: string;
  title: string;
  description: string;
  instruction: string;
  parentTaskId?: string;
  subTasks: AIAgentTask[];
  depth: number;
  status: AgentTaskStatus;
  priority: AgentTaskPriority;
  assignedAgent: AgentType | string;
  targetCanvasId?: string;
  targetDocumentId?: string;
  dependsOn: string[];
  triggers: string[];
  canExecuteInParallel: boolean;
  executionGroup?: string;
  agentMessages: AgentMessage[];
  thoughts: {
    step: 'think' | 'research' | 'act' | 'reflect';
    content: string;
    timestamp: Date;
  }[];
  handoffInstructions?: string;
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  estimatedDuration?: number;
  result?: any;
  errorMessage?: string;
  context: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Agent {
  id: string;
  name: string;
  type: AgentType | string;
  description: string;
  status: AgentStatus | string;
  autonomyLevel: AutonomyLevel;
  universalAutonomyLevel?: UniversalAutonomyLevel;
  profession?: ProfessionType;
  capabilities: AgentCapability[];
  config: AgentConfig;
  metrics: AgentMetrics;
  lastActive: Date;
  performance: number;
  tasks: {
    completed: number;
    total: number;
  };
  triggers?: {
    events: string[];
    schedule?: string;
  };
  behaviorPatterns?: UserBehaviorPattern[];
  professionalContext?: ProfessionalContext;
  autonomousActions: AutonomousAction[];
  learningData: PatternLearningData[];
}

export interface AgentSuggestion {
  type: string;
  description: string;
  confidence: number;
  suggestedAgent: {
    name: string;
    capabilities: AgentCapability[];
    autonomyLevel: AutonomyLevel;
    triggers: string[];
  };
}

export interface AgentAction {
  id: string;
  agentId: string;
  type: string;
  input: unknown;
  output?: unknown;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'completed' | 'failed';
}

export interface AgentFeedback {
  id: string;
  agentId: string;
  type: 'success' | 'failure' | 'improvement';
  feedback: string;
  timestamp: Date;
  context: Record<string, unknown>;
}

// Autonomous Decision Making Types
export interface AutonomousDecision {
  id: string;
  context: ProfessionalContext;
  userPatterns: UserBehaviorPattern[];
  availableActions: AutonomousAction[];
  selectedAction: AutonomousAction;
  confidence: number;
  reasoning: string;
  expectedOutcome: string;
  riskAssessment: RiskAssessment;
  timestamp: Date;
  executionPlan: AgentExecutionStep[];
}

export interface RiskAssessment {
  overall: number;
  categories: RiskCategory[];
  mitigations: RiskMitigation[];
  acceptableThreshold: number;
}

export interface RiskCategory {
  type: string;
  level: number;
  description: string;
  impact: string;
}

export interface RiskMitigation {
  risk: string;
  mitigation: string;
  effectiveness: number;
}

export interface AgentExecutionStep {
  id: string;
  action: string;
  parameters: Record<string, any>;
  expectedDuration: number;
  checkpoints: string[];
  rollbackActions: string[];
}

// Legal Profession Specific Types
export enum LegalCaseType {
  PERSONAL_INJURY = "personal_injury",
  WORKERS_COMP = "workers_comp",
  CRIMINAL_DEFENSE = "criminal_defense",
  CIVIL_LITIGATION = "civil_litigation",
  FAMILY_LAW = "family_law",
  CORPORATE = "corporate",
  IMMIGRATION = "immigration",
  BANKRUPTCY = "bankruptcy"
}

export interface LegalProfessionContext extends ProfessionalContext {
  profession: ProfessionType.LEGAL;
  caseType: LegalCaseType;
  courtJurisdiction: string;
  clients: LegalClient[];
  opponents: LegalOpponent[];
  deadlines: LegalDeadline[];
  hearings: Hearing[];
  documents: LegalDocument[];
  precedents: LegalPrecedent[];
}

export interface LegalClient extends ClientContext {
  caseNumber: string;
  caseType: LegalCaseType;
  retainerStatus: string;
  billingRate: number;
  conflictChecked: boolean;
  intakeComplete: boolean;
}

export interface LegalOpponent {
  name: string;
  attorney: string;
  firm: string;
  contact: string;
  strategy: string;
}

export interface LegalDeadline extends Deadline {
  legalBasis: string;
  courtRule: string;
  statutory: boolean;
  extensionPossible: boolean;
  opposingCounselNotified: boolean;
}

export interface Hearing {
  id: string;
  type: string;
  date: Date;
  location: string;
  judge: string;
  purpose: string;
  preparation: PreparationTask[];
  documents: string[];
}

export interface PreparationTask {
  task: string;
  deadline: Date;
  responsible: string;
  status: string;
  dependencies: string[];
}

export interface LegalDocument {
  id: string;
  type: string;
  title: string;
  status: string;
  dueDate?: Date;
  filedDate?: Date;
  servedDate?: Date;
  responses: LegalDocument[];
}

export interface LegalPrecedent {
  citation: string;
  court: string;
  date: Date;
  facts: string;
  holding: string;
  reasoning: string;
  relevance: number;
  jurisdiction: string;
}