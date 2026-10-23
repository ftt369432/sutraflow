/**
 * Universal Autonomous Agent System
 * Core framework for creating fully autonomous AI assistants across any profession
 */

// ============================================================================
// Core Types and Interfaces
// ============================================================================

export enum AutonomyLevel {
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
  CONSULTING = "consulting",
  UNIVERSAL = "universal"
}

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
  executionPlan: ExecutionStep[];
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

export interface ExecutionStep {
  id: string;
  action: string;
  parameters: Record<string, any>;
  expectedDuration: number;
  checkpoints: string[];
  rollbackActions: string[];
}

export interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  capabilities: string[];
  authentication: AuthenticationConfig;
  rateLimits: RateLimit[];
  endpoints: APIEndpoint[];
}

export interface AuthenticationConfig {
  type: 'oauth' | 'apikey' | 'basic' | 'custom';
  credentials: Record<string, string>;
  refreshable: boolean;
  expiresAt?: Date;
}

export interface RateLimit {
  resource: string;
  limit: number;
  window: number;
  current: number;
}

export interface APIEndpoint {
  path: string;
  method: string;
  purpose: string;
  parameters: Parameter[];
}

export interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

// ============================================================================
// Universal Capability Interface
// ============================================================================

export interface UniversalCapability {
  id: string;
  name: string;
  description: string;
  version: string;
  profession: ProfessionType | 'universal';
  autonomyLevel: AutonomyLevel;
  
  // Core capability methods
  detectIntent(input: string, context: ProfessionalContext): Promise<number>;
  execute(action: AutonomousAction, context: ProfessionalContext): Promise<CapabilityResult>;
  learn(outcome: CapabilityResult, context: ProfessionalContext): Promise<void>;
  
  // Autonomous behavior
  predictNextAction(context: ProfessionalContext): Promise<AutonomousAction[]>;
  assessRisk(action: AutonomousAction, context: ProfessionalContext): Promise<RiskAssessment>;
  
  // Integration capabilities
  getRequiredIntegrations(): string[];
  configureIntegration(integration: Integration): Promise<boolean>;
  
  // Learning and adaptation
  adaptToUser(patterns: UserBehaviorPattern[]): Promise<void>;
  shareKnowledge(otherCapabilities: UniversalCapability[]): Promise<void>;
}

export interface CapabilityResult {
  success: boolean;
  action: string;
  outcome: string;
  data?: any;
  confidence: number;
  executionTime: number;
  nextSuggestedActions: AutonomousAction[];
  learningData: LearningData;
  integrationResults: IntegrationResult[];
}

export interface LearningData {
  patternMatches: string[];
  newPatterns: UserBehaviorPattern[];
  adaptations: AdaptationEvent[];
  crossCapabilityLearnings: string[];
}

export interface IntegrationResult {
  integrationId: string;
  action: string;
  success: boolean;
  data?: any;
  error?: string;
}

// ============================================================================
// Universal Agent Interface
// ============================================================================

export interface UniversalAgent {
  id: string;
  name: string;
  profession: ProfessionType;
  specialization?: string;
  autonomyLevel: AutonomyLevel;
  capabilities: UniversalCapability[];
  
  // Core agent methods
  initialize(userContext: UserContext, professionalContext: ProfessionalContext): Promise<void>;
  processInput(input: string): Promise<AgentResponse>;
  executeAutonomously(context: ProfessionalContext): Promise<AutonomousExecution>;
  
  // Learning and adaptation
  learn(interactions: UserInteraction[]): Promise<void>;
  adapt(feedback: UserFeedback[]): Promise<void>;
  
  // Coordination with other agents
  coordinate(otherAgents: UniversalAgent[], task: CollaborativeTask): Promise<CoordinationResult>;
  shareKnowledge(knowledge: Knowledge): Promise<void>;
  receiveKnowledge(knowledge: Knowledge): Promise<void>;
}

export interface UserContext {
  userId: string;
  preferences: UserPreference[];
  behaviorPatterns: UserBehaviorPattern[];
  professionalProfile: ProfessionalProfile;
  integrations: Integration[];
  autonomySettings: AutonomySettings;
}

export interface UserPreference {
  category: string;
  key: string;
  value: any;
  confidence: number;
  lastUpdated: Date;
}

export interface ProfessionalProfile {
  profession: ProfessionType;
  specializations: string[];
  experience: number;
  certifications: string[];
  workPatterns: WorkPattern[];
  clientTypes: string[];
}

export interface WorkPattern {
  type: string;
  frequency: number;
  duration: number;
  context: string[];
  outcomes: string[];
}

export interface AutonomySettings {
  globalLevel: AutonomyLevel;
  capabilityOverrides: CapabilityAutonomyOverride[];
  confirmationRequired: string[];
  blockedActions: string[];
  timeRestrictions: TimeRestriction[];
}

export interface CapabilityAutonomyOverride {
  capabilityId: string;
  autonomyLevel: AutonomyLevel;
  reason: string;
}

export interface TimeRestriction {
  actions: string[];
  allowedHours: number[];
  allowedDays: number[];
  timezone: string;
}

export interface AgentResponse {
  agent: string;
  response: string;
  actions: AutonomousAction[];
  confidence: number;
  reasoning: string;
  nextSteps: string[];
  requiresApproval: boolean;
  autonomousExecutions: AutonomousExecution[];
}

export interface AutonomousExecution {
  id: string;
  action: AutonomousAction;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  result?: CapabilityResult;
  error?: string;
  rollbackData?: any;
}

export interface UserInteraction {
  timestamp: Date;
  input: string;
  response: AgentResponse;
  userFeedback?: UserFeedback;
  context: ProfessionalContext;
}

export interface UserFeedback {
  interactionId: string;
  rating: number;
  category: string;
  comment?: string;
  suggestions: string[];
  timestamp: Date;
}

export interface CollaborativeTask {
  id: string;
  description: string;
  requirements: TaskRequirement[];
  deadline: Date;
  priority: number;
  participants: string[];
  dependencies: string[];
}

export interface TaskRequirement {
  capability: string;
  professionSpecific: boolean;
  required: boolean;
  alternatives: string[];
}

export interface CoordinationResult {
  taskId: string;
  success: boolean;
  participants: ParticipantResult[];
  outcome: string;
  executionTime: number;
  conflicts: Conflict[];
  resolutions: Resolution[];
}

export interface ParticipantResult {
  agentId: string;
  contribution: string;
  success: boolean;
  executionTime: number;
  resources: ResourceUsage[];
}

export interface ResourceUsage {
  resource: string;
  amount: number;
  unit: string;
  cost: number;
}

export interface Conflict {
  type: string;
  description: string;
  participants: string[];
  severity: number;
}

export interface Resolution {
  conflictId: string;
  method: string;
  outcome: string;
  satisfaction: number;
}

export interface Knowledge {
  id: string;
  type: string;
  content: any;
  source: string;
  reliability: number;
  applicability: string[];
  profession: ProfessionType;
  timestamp: Date;
  validatedBy: string[];
}

// ============================================================================
// Profession-Specific Interfaces
// ============================================================================

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

// ============================================================================
// Export all types for use throughout the system
// ============================================================================

export default {
  AutonomyLevel,
  ProfessionType,
  LegalCaseType
};