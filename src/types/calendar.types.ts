import type { Dayjs } from 'dayjs';

// Core Calendar Types
export interface CalendarEvent {
  id: string;
  title: string;
  eventType: string;
  date: Dayjs;
  time?: string;
  duration?: number; // in minutes
  description?: string;
  location?: string;
  participants?: string[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  isRecurring?: boolean;
  reminderMinutes?: number;
  tags?: string[];
  
  // Email integration fields
  sourceEmail?: string;
  sourceEmails?: string[];
  attendees?: string[];
  startDate?: Date;
  endDate?: Date;
  relatedTasks?: string[];
  reminders?: EventReminder[];
  attachments?: any[];
  metadata?: Record<string, any>;
  
  // Industry-specific fields
  caseNumber?: string;
  clientName?: string;
  
  // Custom fields for extensibility
  customFields?: Record<string, any>;
  
  // Metadata
  createdAt: Dayjs;
  updatedAt: Dayjs;
}

export interface EventReminder {
  id: string;
  type: 'email' | 'popup' | 'sms' | 'desktop';
  timing: 'before' | 'at' | 'after';
  offset: number; // minutes
  message: string;
  recurring?: boolean;
  eventId?: string;
  taskId?: string;
}

export interface CalendarFilters {
  eventTypes?: string[];
  priorities?: string[];
  participants?: string[];
  dateRange?: [Dayjs, Dayjs];
  searchText?: string;
  tags?: string[];
  showCompleted?: boolean;
  customFilters?: Record<string, any>;
}

// Industry Configuration Types
export interface EventType {
  id: string;
  name: string;
  description: string;
  color?: string;
  defaultDuration?: number;
  requiresLocation?: boolean;
  requiresParticipants?: boolean;
  customFields?: string[];
}

export interface CustomField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'time' | 'number' | 'switch';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

export interface QuickAction {
  id: string;
  label: string;
  eventType?: string;
  icon?: string;
  primary?: boolean;
  shortcut?: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  eventType: string;
  duration?: number;
  required?: boolean;
  dependencies?: string[];
  autoTrigger?: boolean;
  reminderDays?: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  triggers?: string[];
  conditions?: Record<string, any>;
}

export interface IndustryConfig {
  id: string;
  name: string;
  description: string;
  eventTypes: EventType[];
  customFields?: CustomField[];
  quickActions?: QuickAction[];
  workflows?: Workflow[];
  integrations?: {
    googleCalendar?: boolean;
    outlook?: boolean;
    emailProcessing?: boolean;
    documentManagement?: boolean;
  };
  notifications?: {
    emailReminders?: boolean;
    smsReminders?: boolean;
    pushNotifications?: boolean;
    defaultReminderMinutes?: number;
  };
  themes?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
  };
  businessRules?: {
    allowOverlapping?: boolean;
    requireApproval?: boolean;
    maxDuration?: number;
    workingHours?: {
      start: string;
      end: string;
      days: number[];
    };
  };
}

// Enhanced Calendar Hook Types
export interface UseEnhancedCalendarProps {
  events: CalendarEvent[];
  industryConfig: IndustryConfig;
  onEventCreate?: (event: CalendarEvent) => void;
  onEventUpdate?: (event: CalendarEvent) => void;
  onEventDelete?: (eventId: string) => void;
  onDateSelect?: (date: Dayjs) => void;
}

export interface UseEnhancedCalendarReturn {
  selectedDate: Dayjs;
  filteredEvents: CalendarEvent[];
  isModalOpen: boolean;
  selectedEvent: CalendarEvent | null;
  filters: CalendarFilters;
  handleDateSelect: (date: Dayjs) => void;
  handleEventClick: (event: CalendarEvent) => void;
  handleEventCreate: (event: CalendarEvent) => void;
  handleEventUpdate: (event: CalendarEvent) => void;
  handleEventDelete: (eventId: string) => void;
  handleFilterChange: (filters: Partial<CalendarFilters>) => void;
  closeModal: () => void;
  openCreateModal: (eventType?: string) => void;
}

// Email Integration Types
export interface EmailCalendarIntegrationProps {
  industryConfig: IndustryConfig;
  onEventsProcessed?: (events: CalendarEvent[]) => void;
  onError?: (error: Error) => void;
}

export interface EmailCalendarIntegrationReturn {
  isProcessing: boolean;
  processedEvents: CalendarEvent[];
  processEmails: (emailIds: string[]) => Promise<void>;
  enableAutoProcessing: () => void;
  disableAutoProcessing: () => void;
  isAutoProcessingEnabled: boolean;
}

// Auto Calendar Processing Types
export interface AutoCalendarProcessingProps {
  industryConfig: IndustryConfig;
  enabled?: boolean;
  interval?: number; // in milliseconds
  onEventsCreated?: (events: CalendarEvent[]) => void;
  onError?: (error: Error) => void;
}

export interface AutoCalendarProcessingReturn {
  isRunning: boolean;
  lastRunTime: Dayjs | null;
  processedCount: number;
  errorCount: number;
  start: () => void;
  stop: () => void;
  runOnce: () => Promise<void>;
  reset: () => void;
}

// Calendar Modal Types
export interface CalendarModalProps {
  industryConfig: IndustryConfig;
  defaultEventType?: string;
  onEventSave?: (event: CalendarEvent) => void;
  onEventDelete?: (eventId: string) => void;
}

export interface CalendarModalReturn {
  isOpen: boolean;
  currentEvent: CalendarEvent | null;
  openModal: (event?: CalendarEvent) => void;
  closeModal: () => void;
  openCreateModal: (eventType?: string, date?: Dayjs) => void;
  openEditModal: (event: CalendarEvent) => void;
}

// Task Management Types
export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  dueDate?: Dayjs;
  assignee?: string;
  tags?: string[];
  linkedEventId?: string;
  linkedCaseNumber?: string;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: Dayjs;
  updatedAt: Dayjs;
}

export interface TaskFilters {
  status?: string[];
  priority?: string[];
  assignee?: string[];
  tags?: string[];
  dueDateRange?: [Dayjs, Dayjs];
  searchText?: string;
  linkedCaseNumber?: string;
}

// Auto TODO Generation Types
export interface AutoTodoRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    eventType: string;
    conditions?: Record<string, any>;
  };
  tasks: Array<{
    title: string;
    description?: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    dueOffsetDays: number; // Days relative to trigger event
    assigneeField?: string; // Field to determine assignee
    tags?: string[];
  }>;
  enabled: boolean;
}

// Statistics and Analytics Types
export interface CalendarStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByPriority: Record<string, number>;
  upcomingEvents: number;
  overdueEvents: number;
  completionRate: number;
  averageEventsPerDay: number;
  busyDays: number;
  workloadDistribution: Record<string, number>;
}

export interface CalendarAnalyticsData {
  dateRange: [Dayjs, Dayjs];
  stats: CalendarStats;
  trends: {
    eventGrowth: number;
    popularEventTypes: string[];
    peakHours: number[];
    busyDays: number[];
  };
  predictions?: {
    nextWeekEventCount: number;
    suggestedOptimizations: string[];
  };
}

// Export/Import Types
export interface CalendarExportOptions {
  format: 'ics' | 'csv' | 'json' | 'pdf';
  dateRange?: [Dayjs, Dayjs];
  eventTypes?: string[];
  includeDetails?: boolean;
  timezone?: string;
}

export interface CalendarImportResult {
  successCount: number;
  errorCount: number;
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
  createdEvents: CalendarEvent[];
}

// Notification Types
export interface NotificationRule {
  id: string;
  name: string;
  eventTypes: string[];
  channels: ('email' | 'sms' | 'push' | 'webhook')[];
  timing: {
    offset: number; // minutes before event
    repeat?: boolean;
    repeatInterval?: number;
  };
  conditions?: Record<string, any>;
  template?: {
    subject?: string;
    body?: string;
  };
  enabled: boolean;
}

// Integration Types
export interface CalendarIntegration {
  id: string;
  name: string;
  type: 'google' | 'outlook' | 'apple' | 'custom';
  enabled: boolean;
  config: Record<string, any>;
  syncOptions: {
    bidirectional: boolean;
    conflictResolution: 'local' | 'remote' | 'manual';
    syncFrequency: number; // minutes
  };
}

// Search and Query Types
export interface CalendarSearchOptions {
  query: string;
  fields?: ('title' | 'description' | 'location' | 'participants')[];
  eventTypes?: string[];
  dateRange?: [Dayjs, Dayjs];
  fuzzy?: boolean;
  limit?: number;
}

export interface CalendarSearchResult {
  event: CalendarEvent;
  relevance: number;
  matchedFields: string[];
  highlights: Record<string, string>;
}
