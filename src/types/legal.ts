export interface LegalCase {
  id: string;
  title: string;
  caseNumber: string;
  court: string;
  status: 'active' | 'closed' | 'pending';
  type: string;
  filingDate: Date;
  parties: {
    plaintiff: string;
    defendant: string;
  };
  description: string;
  documents: LegalCaseDocument[];
  events: CaseEvent[];
  tags: string[];
}

export interface LegalCaseDocument {
  id: string;
  title: string;
  type: string;
  filingDate: Date;
  status: string;
  content: string;
}

export interface CaseEvent {
  id: string;
  title: string;
  date: Date;
  type: string;
  description: string;
  documents: string[];
}

export interface ResearchQuery {
  keywords: string[];
  courts?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  jurisdiction?: string;
}

export interface ResearchResult {
  id: string;
  title: string;
  citation: string;
  summary: string;
  relevance: number;
  date: Date;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: string[];
  metadata?: {
    domain: 'legal';
    [key: string]: unknown;
  };
}

// New interfaces for Legal Swarm features

export type LegalAgentCapability = 
  | 'legal-research' 
  | 'case-management' 
  | 'medical-record-analysis' 
  | 'hearing-preparation' 
  | 'document-filing' 
  | 'client-communication'
  | 'settlement-negotiation'
  | 'court-appearance-preparation';

export type LegalAgentRole = 
  | 'Case Coordinator' 
  | 'Legal Researcher' 
  | 'Medical Evidence Analyst'
  | 'Hearing Preparation Specialist'
  | 'Document Filing Manager'
  | 'Client Communication Manager'
  | 'Settlement Negotiator'
  | 'Court Appearance Coach';

export interface LegalAgentRoleDefinition {
  role: LegalAgentRole;
  requiredCapabilities: LegalAgentCapability[];
  description: string;
  responsibilities: string[];
}

export interface LegalSwarmTemplate {
  id: string;
  name: string;
  description: string;
  caseType: string;
  roles: LegalAgentRoleDefinition[];
  defaultInstructions: string;
}

export interface LegalHearingInfo {
  applicantName?: string;
  hearingDate?: Date;
  hearingStatus?: 'scheduled' | 'completed' | 'continued' | 'canceled';
  judge?: string;
  opposingCounsel?: string;
  medicalEvaluators?: string[];
  witnesses?: string[];
  actionItems?: string[];
  notes?: string;
}

export interface LegalSwarmProcessorResult {
  extractedInfo: LegalHearingInfo;
  confidence: number;
  suggestedTemplate: LegalSwarmTemplate;
  suggestedAgents: {
    role: LegalAgentRole;
    suggestedAgentId?: string;
  }[];
}

export interface LegalCaseInputResult {
  detectedLegalContent: boolean;
  extractedInfo?: LegalHearingInfo;
  contentType?: 'hearing-notes' | 'case-summary' | 'medical-report' | 'unknown';
  confidence?: number;
}