// Email Event Extraction Result
export interface EmailEventExtractionResult {
  title: string;
  startDate?: Date;
  endDate?: Date;
  startTime?: string;
  endTime?: string;
  dateTime?: Date;
  endDateTime?: Date;
  location?: string;
  description?: string;
  eventType: string;
  confidence: number;
  caseNumber?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  reminders?: any[];
  tasks?: any[];
  attendees?: string[];
  matchedTerms: string[];
  appliedRules: string[];
  processingTime: number;
  errors?: string[];
  workflow?: string;
  extractedData?: any;
}

// Auto Calendar Configuration Types
export interface AutoCalendarSearchTerms {
  primary: string[];
  secondary: string[];
  eventTypes: Record<string, string[]>;
  exclusions: string[];
}

export interface ReminderTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'webhook';
  timing: {
    offset: number; // minutes before event
    repeat?: boolean;
    repeatInterval?: number;
  };
  message: {
    subject?: string;
    body: string;
    variables?: string[]; // Available variables like {eventTitle}, {eventDate}, etc.
  };
  conditions?: {
    eventTypes?: string[];
    priority?: string[];
    attendeeCount?: { min?: number; max?: number };
  };
}

export interface EventProcessingRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  conditions: {
    searchTerms?: string[];
    senderDomains?: string[];
    subjectPatterns?: RegExp[];
    bodyPatterns?: RegExp[];
    minimumConfidence?: number;
  };
  actions: {
    createEvent: boolean;
    createTasks: boolean;
    scheduleReminders: boolean;
    notifyUsers: boolean;
    requireApproval?: boolean;
  };
  eventTemplate: {
    defaultDuration: number;
    defaultLocation?: string;
    defaultPriority: 'low' | 'normal' | 'high' | 'urgent';
    customFields?: Record<string, any>;
  };
  reminderTemplates: string[]; // IDs of reminder templates to use
  taskTemplates: string[]; // IDs of task templates to use
}

export interface AutoCalendarWorkflow {
  id: string;
  name: string;
  description: string;
  industryType: string;
  enabled: boolean;
  confidenceThreshold: number;
  defaultEventType: string;
  searchTerms: AutoCalendarSearchTerms;
  processingRules: EventProcessingRule[];
  reminderTemplates: ReminderTemplate[];
  taskTemplates: any[]; // Will reference existing task templates
  notificationSettings: {
    onEventCreated: boolean;
    onDuplicateFound: boolean;
    onProcessingError: boolean;
    recipients: string[];
  };
}

// Industry-specific workflow configurations
export interface IndustryAutoCalendarConfig {
  id: string;
  name: string;
  description: string;
  workflows: AutoCalendarWorkflow[];
  defaultWorkflowId: string;
}

// Auto Calendar Engine Configuration
export interface AutoCalendarEngineConfig {
  enabled: boolean;
  processingInterval: number; // minutes
  batchSize: number;
  confidenceThreshold: number;
  duplicateDetectionEnabled: boolean;
  industryConfig: IndustryAutoCalendarConfig;
  fallbackWorkflow?: AutoCalendarWorkflow;
}
