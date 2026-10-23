// Core Agent Types and Interfaces
export interface SpecializedAgent {
  id: string;
  name: string;
  type: AgentType;
  capabilities: string[];
  status: AgentStatus;
  
  processTemplate(template: Template, requirements: Requirements): Promise<ProcessedSection>;
  collaborate(otherAgents: SpecializedAgent[], workspace: CollaborativeWorkspace): Promise<CollaborationResult>;
  validateWork(content: string, context: ValidationContext): Promise<ValidationResult>;
}

export type AgentType = 
  | 'legal_agent'
  | 'medical_agent' 
  | 'architecture_agent'
  | 'business_agent'
  | 'technical_agent'
  | 'research_agent'
  | 'qa_agent'
  | 'template_agent'
  | 'coordination_agent'
  | 'creative_agent';

export type AgentStatus = 'idle' | 'working' | 'collaborating' | 'validating' | 'completed' | 'error';

export interface DocumentRequest {
  id: string;
  canvasId: string;
  documentType: string;
  userInput: string;
  chatHistory: any[];
  userContext: UserContext;
  qualityRequirements: QualityRequirements;
  createdAt: Date;
}

export interface UserContext {
  profession?: string;
  preferences?: UserPreferences;
  knowledgeBase?: string;
  selectedAssistant?: any;
}

export interface QualityRequirements {
  accuracy_level: 'basic' | 'standard' | 'high' | 'critical';
  professional_standards: boolean;
  fact_checking: boolean;
  compliance_review: boolean;
  industry_specific: boolean;
}

export interface Template {
  id: string;
  name: string;
  type: string;
  profession: string;
  content: string;
  variables: TemplateVariable[];
  sections: TemplateSection[];
  metadata: TemplateMetadata;
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'selection' | 'boolean';
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: ValidationRule;
}

export interface TemplateSection {
  id: string;
  name: string;
  type: string;
  required: boolean;
  agentRequirements: string[];
  dependencies: string[];
}

export interface TemplateMetadata {
  version: string;
  author: string;
  profession: string;
  jurisdiction?: string;
  compliance_standards: string[];
  last_updated: Date;
  accuracy_rating: number;
  ai_generated?: boolean;
  source_patterns?: number;
  user_requirements?: string[];
  assistant_id?: string;
}

export interface Requirements {
  userInput: string;
  documentType: string;
  profession: string;
  context: any;
  qualityTargets: QualityTargets;
  chatHistory?: any[];
}

export interface QualityTargets {
  accuracy_threshold: number;
  completeness_threshold: number;
  professional_standard_compliance: boolean;
  fact_verification_required: boolean;
}

export interface ProcessedSection {
  content: string;
  accuracy_score: number;
  confidence_level: number;
  citations?: string[];
  compliance_notes?: string[];
  recommended_reviews?: string[];
  metadata: SectionMetadata;
}

export interface SectionMetadata {
  agent_id: string;
  processing_time: number;
  validation_status: 'pending' | 'validated' | 'needs_review';
  quality_metrics: QualityMetrics;
}

export interface QualityMetrics {
  accuracy: number;
  completeness: number;
  professional_standard: number;
  readability: number;
  compliance: number;
}

export interface CollaborativeWorkspace {
  id: string;
  document: WorkingDocument;
  agents: Map<string, SpecializedAgent>;
  template: Template;
  requirements: Requirements;
  status: WorkspaceStatus;
  
  addAgent(agent: SpecializedAgent): void;
  updateSection(sectionId: string, content: ProcessedSection): void;
  getSection(sectionId: string): ProcessedSection | null;
  getFinalDocument(): DocumentResult;
}

export type WorkspaceStatus = 'initializing' | 'template_processing' | 'content_development' | 'cross_validation' | 'final_integration' | 'completed' | 'error';

export interface WorkingDocument {
  sections: Map<string, ProcessedSection>;
  metadata: DocumentMetadata;
  quality_checkpoints: QualityCheckpoint[];
}

export interface DocumentMetadata {
  title: string;
  type: string;
  profession: string;
  created_at: Date;
  last_modified: Date;
  version: string;
  collaborating_agents: string[];
}

export interface QualityCheckpoint {
  checkpoint_id: string;
  phase: string;
  status: 'pending' | 'passed' | 'failed';
  score: number;
  issues: QualityIssue[];
  recommendations: string[];
}

export interface QualityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  location: string;
  suggested_fix: string;
}

export interface DocumentResult {
  finalDocument: string;
  metadata: DocumentMetadata;
  qualityReport: QualityReport;
  primaryAgent: string;
  supportingAgents: string[];
  templateUsed: string;
  qualityScore: number;
  accuracyScore: number;
  agentsUsed: AgentUsageReport[];
}

export interface QualityReport {
  overall_score: number;
  accuracy_score: number;
  completeness_score: number;
  professional_standard_score: number;
  critical_issues: QualityIssue[];
  recommendations: string[];
  validation_summary: ValidationSummary;
}

export interface ValidationSummary {
  fact_checks_performed: number;
  fact_checks_passed: number;
  compliance_checks_performed: number;
  compliance_checks_passed: number;
  citations_verified: number;
  citations_valid: number;
}

export interface AgentUsageReport {
  agent_id: string;
  agent_type: AgentType;
  time_spent: number;
  sections_processed: string[];
  quality_contribution: number;
  issues_identified: number;
  improvements_made: number;
}

export interface CollaborationResult {
  success: boolean;
  contributions: AgentContribution[];
  conflicts_resolved: ConflictResolution[];
  quality_improvements: QualityImprovement[];
}

export interface AgentContribution {
  agent_id: string;
  section_id: string;
  contribution_type: 'content' | 'validation' | 'improvement' | 'fact_check';
  impact_score: number;
  description: string;
}

export interface ConflictResolution {
  conflict_type: string;
  agents_involved: string[];
  resolution_method: string;
  final_decision: string;
  rationale: string;
}

export interface QualityImprovement {
  improvement_type: string;
  before_score: number;
  after_score: number;
  improvement_description: string;
  contributing_agents: string[];
}

export interface ValidationContext {
  document_type: string;
  profession: string;
  jurisdiction?: string;
  compliance_standards: string[];
  accuracy_requirements: QualityRequirements;
}

export interface ValidationResult {
  is_valid: boolean;
  confidence_score: number;
  issues_found: QualityIssue[];
  improvements_suggested: string[];
  compliance_status: ComplianceStatus;
}

export interface ComplianceStatus {
  overall_compliant: boolean;
  standards_checked: string[];
  standards_passed: string[];
  standards_failed: string[];
  critical_violations: string[];
}

export interface UserPreferences {
  responseStyle: 'concise' | 'detailed' | 'comprehensive';
  qualityLevel: 'basic' | 'professional' | 'expert';
  industryFocus: string[];
  complianceLevel: 'standard' | 'strict' | 'minimal';
}

export interface ValidationRule {
  type: 'regex' | 'range' | 'required' | 'custom';
  rule: string | number | ((value: any) => boolean);
  error_message: string;
}

// Event types for agent communication
export interface AgentEvent {
  type: AgentEventType;
  source_agent: string;
  target_agent?: string;
  workspace_id: string;
  data: any;
  timestamp: Date;
}

export type AgentEventType = 
  | 'task_assigned'
  | 'task_completed'
  | 'collaboration_requested'
  | 'validation_requested'
  | 'quality_issue_found'
  | 'improvement_suggested'
  | 'conflict_detected'
  | 'resolution_proposed';

// Error types
export class AgentError extends Error {
  constructor(
    message: string,
    public agentId: string,
    public agentType: AgentType,
    public errorCode: string,
    public context?: any
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export class CollaborationError extends Error {
  constructor(
    message: string,
    public workspaceId: string,
    public agentsInvolved: string[],
    public conflictType: string,
    public context?: any
  ) {
    super(message);
    this.name = 'CollaborationError';
  }
}

export class QualityError extends Error {
  constructor(
    message: string,
    public documentId: string,
    public qualityIssues: QualityIssue[],
    public minimumRequiredScore: number,
    public actualScore: number
  ) {
    super(message);
    this.name = 'QualityError';
  }
}
