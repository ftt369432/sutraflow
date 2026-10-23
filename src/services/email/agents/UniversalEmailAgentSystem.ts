/**
 * 🌍 Ultimate Cross-Industry Email Agent System
 * 
 * Universal agent system that works across ALL industries:
 * Legal, Medical, Business, Real Estate, Finance, Technology, Education, etc.
 * 
 * Built with URENO principle: Learn → Build → Test → Iterate
 */

import { EmailMessage } from '../types';

// Placeholder for missing types
interface AgentType {
  id: string;
  name: string;
}

export interface IndustryProfile {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string; // Lucide React icon name
  color: string;
  keywords: string[];
  documentTypes: string[];
  urgencyIndicators: string[];
  complianceRequirements?: string[];
}

export interface EmailAgentRule {
  id: string;
  name: string;
  description: string;
  industryId: string;
  priority: number;
  
  // Smart Triggers
  triggers: {
    keywords: string[];
    senderPatterns: string[];
    subjectPatterns: string[];
    contentPatterns: string[];
    attachmentTypes?: string[];
    urgencyLevels: ('high' | 'medium' | 'low')[];
    timeRanges?: TimeRange[];
  };
  
  // Conditional Logic (AND/OR)
  conditions: {
    logic: 'AND' | 'OR';
    rules: ConditionRule[];
  };
  
  // Multi-Agent Actions
  actions: {
    // Core Email Actions
    organize?: {
      createFolder?: string;
      moveToFolder?: string;
      applyTags?: string[];
      setPriority?: 'high' | 'medium' | 'low';
      markAs?: 'read' | 'unread' | 'starred' | 'archived';
    };
    
    // Agent Orchestration
    agents?: {
      sequence: AgentExecutionStep[];
      parallel?: AgentExecutionStep[];
      conditional?: ConditionalAgentStep[];
    };
    
    // Content Generation
    generate?: {
      summary?: boolean;
      response?: ResponseTemplate;
      followUp?: FollowUpConfig;
      translation?: string; // target language
    };
    
    // External Integrations
    integrate?: {
      calendar?: CalendarIntegration;
      tasks?: TaskIntegration;
      documents?: DocumentIntegration;
      crm?: CRMIntegration;
      notifications?: NotificationConfig[];
    };
    
    // Workflow Automation
    workflow?: {
      triggerWorkflow?: string;
      createCanvas?: CanvasConfig;
      scheduleFollowUp?: FollowUpSchedule;
      escalate?: EscalationRule;
    };
  };
  
  // Performance & Monitoring
  enabled: boolean;
  performance: {
    executionCount: number;
    successRate: number;
    averageExecutionTime: number;
    lastExecuted?: Date;
    errorHistory: ErrorLog[];
  };
}

export interface AgentExecutionStep {
  agentType: UniversalAgentType;
  instruction: string;
  timeout: number;
  retryCount: number;
  dependencies?: string[];
  outputMapping?: string;
}

export interface ConditionalAgentStep {
  condition: ConditionExpression;
  thenAgents: AgentExecutionStep[];
  elseAgents?: AgentExecutionStep[];
}

// Universal Industry Definitions
export const INDUSTRY_PROFILES: IndustryProfile[] = [
  {
    id: 'legal',
    name: 'legal',
    displayName: 'Legal Practice',
    description: 'Law firms, attorneys, legal departments',
    icon: 'Scale',
    color: 'blue-600',
    keywords: ['petition', 'motion', 'brief', 'court', 'hearing', 'deposition', 'wcab', 'lawsuit', 'contract'],
    documentTypes: ['petition', 'motion', 'brief', 'contract', 'joinder', 'discovery'],
    urgencyIndicators: ['urgent', 'deadline', 'hearing', 'court date', 'filing'],
    complianceRequirements: ['attorney-client privilege', 'court rules', 'bar requirements']
  },
  {
    id: 'medical',
    name: 'medical', 
    displayName: 'Healthcare',
    description: 'Hospitals, clinics, medical practices',
    icon: 'Heart',
    color: 'red-600',
    keywords: ['patient', 'diagnosis', 'treatment', 'medical', 'doctor', 'appointment', 'prescription', 'hipaa'],
    documentTypes: ['medical letter', 'prescription', 'referral', 'treatment plan', 'medical report'],
    urgencyIndicators: ['urgent', 'stat', 'emergency', 'critical', 'immediate'],
    complianceRequirements: ['HIPAA', 'medical privacy', 'patient consent']
  },
  {
    id: 'business',
    name: 'business',
    displayName: 'Business & Corporate', 
    description: 'Corporations, consulting, professional services',
    icon: 'Building2',
    color: 'green-600',
    keywords: ['proposal', 'contract', 'meeting', 'project', 'client', 'invoice', 'quarterly', 'revenue'],
    documentTypes: ['proposal', 'contract', 'business plan', 'invoice', 'report', 'presentation'],
    urgencyIndicators: ['urgent', 'deadline', 'asap', 'priority', 'time-sensitive']
  },
  {
    id: 'realestate',
    name: 'realestate',
    displayName: 'Real Estate',
    description: 'Real estate agencies, property management',
    icon: 'Home',
    color: 'orange-600', 
    keywords: ['property', 'listing', 'closing', 'mortgage', 'appraisal', 'inspection', 'offer', 'lease'],
    documentTypes: ['listing agreement', 'purchase contract', 'lease', 'disclosure', 'appraisal'],
    urgencyIndicators: ['closing', 'deadline', 'offer deadline', 'inspection']
  },
  {
    id: 'finance',
    name: 'finance',
    displayName: 'Financial Services',
    description: 'Banks, investment firms, accounting',
    icon: 'DollarSign',
    color: 'emerald-600',
    keywords: ['investment', 'portfolio', 'loan', 'credit', 'audit', 'compliance', 'trading', 'financial'],
    documentTypes: ['loan application', 'investment proposal', 'audit report', 'financial statement'],
    urgencyIndicators: ['market close', 'audit deadline', 'compliance', 'regulatory']
  },
  {
    id: 'technology',
    name: 'technology',
    displayName: 'Technology & IT',
    description: 'Software companies, IT departments',
    icon: 'Code',
    color: 'purple-600',
    keywords: ['software', 'development', 'bug', 'feature', 'deployment', 'server', 'database', 'api'],
    documentTypes: ['technical spec', 'bug report', 'deployment guide', 'api documentation'],
    urgencyIndicators: ['critical bug', 'security', 'outage', 'production']
  },
  {
    id: 'education',
    name: 'education',
    displayName: 'Education',
    description: 'Schools, universities, training organizations', 
    icon: 'GraduationCap',
    color: 'indigo-600',
    keywords: ['student', 'course', 'grade', 'assignment', 'enrollment', 'transcript', 'education'],
    documentTypes: ['syllabus', 'assignment', 'grade report', 'transcript', 'enrollment form'],
    urgencyIndicators: ['deadline', 'registration', 'exam', 'grade due']
  },
  {
    id: 'manufacturing',
    name: 'manufacturing', 
    displayName: 'Manufacturing',
    description: 'Manufacturing companies, supply chain',
    icon: 'Factory',
    color: 'gray-600',
    keywords: ['production', 'inventory', 'supplier', 'quality', 'safety', 'manufacturing', 'supply'],
    documentTypes: ['work order', 'quality report', 'safety inspection', 'supplier agreement'],
    urgencyIndicators: ['production halt', 'safety issue', 'quality alert', 'supply shortage']
  },
  {
    id: 'nonprofit',
    name: 'nonprofit',
    displayName: 'Non-Profit',
    description: 'Charitable organizations, foundations',
    icon: 'Heart',
    color: 'pink-600',
    keywords: ['donation', 'grant', 'volunteer', 'fundraising', 'program', 'impact', 'charity'],
    documentTypes: ['grant application', 'donation receipt', 'program report', 'volunteer agreement'],
    urgencyIndicators: ['grant deadline', 'fundraising goal', 'program deadline']
  },
  {
    id: 'government',
    name: 'government',
    displayName: 'Government',
    description: 'Government agencies, public sector',
    icon: 'Building',
    color: 'slate-600',
    keywords: ['regulation', 'compliance', 'public', 'policy', 'government', 'civic', 'municipal'],
    documentTypes: ['policy document', 'regulation', 'public notice', 'compliance report'],
    urgencyIndicators: ['regulatory deadline', 'public notice', 'compliance']
  }
];

// Agent Type Registry for Cross-Industry Use
export enum UniversalAgentType {
  // Core Processing Agents
  EMAIL_PROCESSOR = 'email_processor',
  CONTENT_ANALYZER = 'content_analyzer', 
  PRIORITY_CLASSIFIER = 'priority_classifier',
  
  // Organization Agents
  FOLDER_ORGANIZER = 'folder_organizer',
  TAG_MANAGER = 'tag_manager',
  ARCHIVE_MANAGER = 'archive_manager',
  
  // Communication Agents
  RESPONSE_GENERATOR = 'response_generator',
  TRANSLATION_AGENT = 'translation_agent',
  SUMMARY_AGENT = 'summary_agent',
  
  // Integration Agents  
  CALENDAR_AGENT = 'calendar_agent',
  TASK_AGENT = 'task_agent',
  DOCUMENT_AGENT = 'document_agent',
  CRM_AGENT = 'crm_agent',
  
  // Industry Specialists
  LEGAL_AGENT = 'legal_agent',
  MEDICAL_AGENT = 'medical_agent',
  BUSINESS_AGENT = 'business_agent',
  FINANCE_AGENT = 'finance_agent',
  TECHNICAL_AGENT = 'technical_agent',
  
  // Workflow Agents
  WORKFLOW_ORCHESTRATOR = 'workflow_orchestrator',
  ESCALATION_AGENT = 'escalation_agent',
  NOTIFICATION_AGENT = 'notification_agent',
  COMPLIANCE_AGENT = 'compliance_agent'
}

// Smart Agent Selection Algorithm
export function selectOptimalAgents(
  email: EmailMessage | {}, 
  industry: IndustryProfile,
  availableAgents: UniversalAgentType[]
): AgentExecutionStep[] {
  const agents: AgentExecutionStep[] = [];
  
  // Always start with content analysis
  agents.push({
    agentType: UniversalAgentType.CONTENT_ANALYZER,
    instruction: `Analyze email content for ${industry.displayName} context`,
    timeout: 30000,
    retryCount: 2,
    outputMapping: 'analysis'
  });
  
  // Add industry-specific agent
  const industryAgent = getIndustryAgent(industry.id);
  if (industryAgent && availableAgents.includes(industryAgent)) {
    agents.push({
      agentType: industryAgent,
      instruction: `Process ${industry.displayName} specific content and requirements`,
      timeout: 60000,
      retryCount: 2,
      dependencies: ['analysis'],
      outputMapping: 'industryProcessing'
    });
  }
  
  // Add integration agents based on content
  const emailContent = email as EmailMessage;
  const contentText = ((emailContent.body || '') + ' ' + (emailContent.subject || '')).toLowerCase();
  
  if (hasCalendarKeywords(contentText)) {
    agents.push({
      agentType: UniversalAgentType.CALENDAR_AGENT,
      instruction: 'Extract and create calendar events',
      timeout: 45000,
      retryCount: 2,
      dependencies: ['analysis'],
      outputMapping: 'calendar'
    });
  }
  
  if (hasTaskKeywords(contentText)) {
    agents.push({
      agentType: UniversalAgentType.TASK_AGENT,
      instruction: 'Extract and create action items',
      timeout: 30000,
      retryCount: 2,
      dependencies: ['analysis'],
      outputMapping: 'tasks'
    });
  }
  
  // Add organization agent
  agents.push({
    agentType: UniversalAgentType.FOLDER_ORGANIZER,
    instruction: `Organize email according to ${industry.displayName} standards`,
    timeout: 15000,
    retryCount: 1,
    dependencies: ['analysis', 'industryProcessing'],
    outputMapping: 'organization'
  });
  
  return agents;
}

function getIndustryAgent(industryId: string): UniversalAgentType | null {
  const mapping: Record<string, UniversalAgentType> = {
    legal: UniversalAgentType.LEGAL_AGENT,
    medical: UniversalAgentType.MEDICAL_AGENT,
    business: UniversalAgentType.BUSINESS_AGENT,
    finance: UniversalAgentType.FINANCE_AGENT,
    technology: UniversalAgentType.TECHNICAL_AGENT
  };
  
  return mapping[industryId] || null;
}

function hasCalendarKeywords(text: string): boolean {
  return /meeting|appointment|schedule|deadline|due|calendar|event|reminder/.test(text);
}

function hasTaskKeywords(text: string): boolean {
  return /task|todo|action|follow.up|complete|finish|prepare|review|send/.test(text);
}

// Supporting Types
export interface TimeRange {
  start: string; // HH:MM
  end: string;   // HH:MM
  days?: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
}

export interface ConditionRule {
  field: 'sender' | 'subject' | 'body' | 'attachment' | 'priority' | 'time';
  operator: 'contains' | 'equals' | 'regex' | 'not_contains' | 'starts_with' | 'ends_with';
  value: string;
}

export interface ConditionExpression {
  logic: 'AND' | 'OR';
  conditions: ConditionRule[];
}

export interface ResponseTemplate {
  templateId: string;
  customization?: Record<string, string>;
}

export interface FollowUpConfig {
  delay: number; // minutes
  template: string;
  conditions?: ConditionExpression;
}

export interface CalendarIntegration {
  extractEvents: boolean;
  autoCreate: boolean;
  defaultDuration: number; // minutes
  reminderMinutes: number[];
}

export interface TaskIntegration {
  extractTasks: boolean;
  autoCreate: boolean;
  defaultPriority: 'high' | 'medium' | 'low';
  assignTo?: string;
}

export interface DocumentIntegration {
  createFromTemplate?: string;
  extractAttachments: boolean;
  ocrImages: boolean;
}

export interface CRMIntegration {
  updateContact: boolean;
  createLead: boolean;
  addActivity: boolean;
}

export interface NotificationConfig {
  type: 'email' | 'sms' | 'slack' | 'teams';
  recipients: string[];
  template: string;
}

export interface CanvasConfig {
  templateType: string;
  title: string;
  content?: string;
}

export interface FollowUpSchedule {
  delay: number; // minutes
  action: string;
  conditions?: ConditionExpression;
}

export interface EscalationRule {
  delay: number; // minutes
  escalateTo: string[];
  action: string;
}

export interface ErrorLog {
  timestamp: Date;
  error: string;
  context: Record<string, any>;
}