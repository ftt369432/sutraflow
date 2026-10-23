/**
 * 📅 Task Integration Metadata System
 * 
 * Extensible metadata framework for Canvas documents to support task/appointment functionality
 * Designed for future expansion while maintaining clean architecture
 */

export interface TaskMetadata {
  // Task identifiers
  taskId?: string;
  parentTaskId?: string;
  taskType: 'appointment' | 'deadline' | 'reminder' | 'follow-up' | 'milestone' | 'action-item';
  
  // Scheduling information
  dueDate?: Date;
  scheduledTime?: Date;
  duration?: number; // in minutes
  timeZone?: string;
  
  // Priority and status
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'overdue';
  
  // Participants and assignments
  assignedTo?: string[];
  participants?: string[];
  createdBy: string;
  
  // Notifications and reminders
  reminders?: TaskReminder[];
  notifications?: TaskNotification[];
  
  // Integration fields
  calendarEventId?: string;
  meetingLink?: string;
  location?: string;
  
  // Dependencies
  dependencies?: string[]; // Task IDs this task depends on
  blockedBy?: string[]; // Task IDs blocking this task
  
  // Progress tracking
  completionPercentage?: number;
  checklistItems?: ChecklistItem[];
  
  // Metadata
  tags?: string[];
  category?: string;
  estimatedHours?: number;
  actualHours?: number;
}

export interface TaskReminder {
  id: string;
  type: 'email' | 'push' | 'sms' | 'in-app';
  triggerBefore: number; // minutes before due date
  message?: string;
  isActive: boolean;
}

export interface TaskNotification {
  id: string;
  type: 'created' | 'updated' | 'completed' | 'overdue' | 'reminder';
  message: string;
  timestamp: Date;
  read: boolean;
  userId: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: Date;
}

/**
 * Enhanced Canvas Document with Task Integration
 */
export interface TaskEnabledCanvasDocument {
  // Standard Canvas fields
  id: string;
  title: string;
  content: string;
  type: 'legal' | 'business' | 'creative' | 'medical' | 'blank';
  created: Date;
  modified: Date;
  aiDriveFileId?: string;
  
  // Enhanced metadata with task support
  metadata?: {
    assistant?: string;
    wordCount?: number;
    lastSaved?: Date;
    version?: number;
    
    // Task integration
    taskMetadata?: TaskMetadata;
    
    // Conversation linking
    conversationId?: string;
    conversationContext?: string;
    
    // Document relationships
    relatedDocuments?: string[];
    parentDocument?: string;
    documentSeries?: string;
    
    // Collaboration
    collaborators?: string[];
    sharePermissions?: DocumentPermission[];
    
    // Analytics
    viewCount?: number;
    editSessions?: EditSession[];
    timeSpent?: number; // total minutes spent editing
  };
}

export interface DocumentPermission {
  userId: string;
  permission: 'view' | 'edit' | 'admin';
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
}

export interface EditSession {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  changesCount: number;
  ipAddress?: string;
}

/**
 * Task Action Hooks for Canvas Integration
 */
export interface TaskActions {
  // Task creation
  createTask: (documentId: string, taskData: Partial<TaskMetadata>) => Promise<string>;
  updateTask: (taskId: string, updates: Partial<TaskMetadata>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  
  // Task scheduling
  scheduleTask: (taskId: string, scheduledTime: Date, duration?: number) => Promise<void>;
  rescheduleTask: (taskId: string, newTime: Date) => Promise<void>;
  
  // Task completion
  completeTask: (taskId: string, completionNote?: string) => Promise<void>;
  markTaskOverdue: (taskId: string) => Promise<void>;
  
  // Reminders and notifications
  addReminder: (taskId: string, reminder: Omit<TaskReminder, 'id'>) => Promise<string>;
  removeReminder: (taskId: string, reminderId: string) => Promise<void>;
  sendNotification: (taskId: string, notification: Omit<TaskNotification, 'id' | 'timestamp'>) => Promise<void>;
  
  // Calendar integration
  syncWithCalendar: (taskId: string, calendarProvider: 'google' | 'outlook' | 'apple') => Promise<string>;
  createMeetingLink: (taskId: string, platform: 'zoom' | 'teams' | 'meet') => Promise<string>;
  
  // Task queries
  getTasksForDocument: (documentId: string) => Promise<TaskMetadata[]>;
  getTasksForUser: (userId: string, status?: TaskMetadata['status']) => Promise<TaskMetadata[]>;
  getOverdueTasks: (userId: string) => Promise<TaskMetadata[]>;
  getUpcomingTasks: (userId: string, daysAhead?: number) => Promise<TaskMetadata[]>;
}

/**
 * Document-Task Integration Events
 */
export interface TaskEvent {
  eventType: 'task-created' | 'task-updated' | 'task-completed' | 'task-overdue' | 'reminder-triggered';
  taskId: string;
  documentId: string;
  userId: string;
  timestamp: Date;
  data: any;
}

/**
 * Future Integration Points
 */
export interface TaskIntegrationConfig {
  // Calendar providers
  calendarIntegrations: {
    google?: { enabled: boolean; clientId: string; };
    outlook?: { enabled: boolean; tenantId: string; };
    apple?: { enabled: boolean; };
  };
  
  // Meeting platforms
  meetingPlatforms: {
    zoom?: { enabled: boolean; apiKey: string; };
    teams?: { enabled: boolean; tenantId: string; };
    googleMeet?: { enabled: boolean; };
  };
  
  // Notification channels
  notificationChannels: {
    email?: { enabled: boolean; provider: 'sendgrid' | 'ses' | 'smtp'; };
    sms?: { enabled: boolean; provider: 'twilio' | 'aws-sns'; };
    push?: { enabled: boolean; provider: 'fcm' | 'apns'; };
    slack?: { enabled: boolean; webhookUrl: string; };
  };
  
  // AI assistance
  aiFeatures: {
    smartScheduling?: boolean; // AI suggests optimal times
    contentAnalysis?: boolean; // Extract tasks from document content
    deadlineDetection?: boolean; // Auto-detect deadlines in text
    priorityAssignment?: boolean; // AI suggests priority levels
  };
}