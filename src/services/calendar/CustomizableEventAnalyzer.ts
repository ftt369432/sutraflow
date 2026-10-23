import { EmailMessage } from '../../types/email';

export interface ReminderSettings {
  beforeEvent: number[]; // minutes before event
  notificationTypes: ('popup' | 'email' | 'sms')[];
}

export interface UserEventPattern {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  eventType: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  defaultTitle: string;
  defaultLocation: string;
  taskTemplates: string[];
  datePatterns: string[];
  reminderSettings: ReminderSettings;
  color: string;
  enabled: boolean;
}

export interface CustomTask {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDuration: number; // minutes
  completed: boolean;
}

export interface FollowUpAction {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  actionType: 'call' | 'email' | 'meeting' | 'document' | 'reminder' | 'task';
  targetPerson: string;
  status: 'pending' | 'completed' | 'cancelled';
}

export interface CustomEventDetails {
  title: string;
  dateTime: Date;
  endDateTime?: Date;
  location: string;
  attendees: string[];
  description: string;
  eventType: string;
  customTasks: CustomTask[];
  followUpActions: FollowUpAction[];
  customFields: Record<string, any>;
  tags: string[];
  confidence: number;
}

export class CustomizableEventAnalyzer {
  private storageKey = 'calendar_user_patterns';

  constructor() {
    this.initializeDefaultPatterns();
  }

  private initializeDefaultPatterns() {
    const existing = this.getUserPatterns();
    if (existing.length === 0) {
      this.resetToDefaults();
    }
  }

  getUserPatterns(): UserEventPattern[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading user patterns:', error);
      return [];
    }
  }

  addUserPattern(pattern: Omit<UserEventPattern, 'id'>) {
    const patterns = this.getUserPatterns();
    const newPattern: UserEventPattern = {
      ...pattern,
      id: `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    patterns.push(newPattern);
    this.savePatterns(patterns);
  }

  updateUserPattern(id: string, updates: Partial<UserEventPattern>) {
    const patterns = this.getUserPatterns();
    const index = patterns.findIndex(p => p.id === id);
    if (index >= 0) {
      patterns[index] = { ...patterns[index], ...updates };
      this.savePatterns(patterns);
    }
  }

  deleteUserPattern(id: string) {
    const patterns = this.getUserPatterns();
    const filtered = patterns.filter(p => p.id !== id);
    this.savePatterns(filtered);
  }

  resetToDefaults() {
    const defaultPatterns: UserEventPattern[] = [
      {
        id: 'wcab-hearing',
        name: 'WCAB Hearing',
        description: 'Workers Compensation Appeals Board hearings',
        keywords: ['wcab', 'hearing', 'workers comp', 'compensation', 'appeals board'],
        eventType: 'court-date',
        priority: 'high',
        defaultTitle: 'WCAB Hearing',
        defaultLocation: 'WCAB Office',
        taskTemplates: [
          'Review case file 2 days before',
          'Prepare opening statement 1 day before',
          'Gather supporting documents 3 days before',
          'Contact client for final review 1 day before'
        ],
        datePatterns: [
          '(\\w+),\\s+(\\w+)\\s+(\\d{1,2})\\s+[·•]\\s+(\\d{1,2}):(\\d{2})\\s*(?:-\\s*\\d{1,2}:\\d{2})?\\s*(am|pm)',
          '(\\d{1,2})/(\\d{1,2})/(\\d{4})\\s+(\\d{1,2}):(\\d{2})\\s*(am|pm)',
          '(\\w+),\\s+(\\w+)\\s+(\\d{1,2}),?\\s+(\\d{4})\\s+at\\s+(\\d{1,2}):(\\d{2})\\s*(AM|PM)'
        ],
        reminderSettings: {
          beforeEvent: [30, 1440, 4320], // 30 min, 1 day, 3 days
          notificationTypes: ['popup', 'email']
        },
        color: '#ef4444',
        enabled: true
      },
      {
        id: 'deposition',
        name: 'Deposition',
        description: 'Legal depositions and examinations',
        keywords: ['deposition', 'examination', 'testimony', 'discovery'],
        eventType: 'deposition',
        priority: 'high',
        defaultTitle: 'Deposition',
        defaultLocation: 'Law Office',
        taskTemplates: [
          'Prepare deposition outline 2 days before',
          'Review relevant documents 1 day before',
          'Brief client on process 3 days before'
        ],
        datePatterns: [
          '(\\d{1,2})/(\\d{1,2})/(\\d{4})\\s+(\\d{1,2}):(\\d{2})\\s*(am|pm)',
          '(\\w+),\\s+(\\w+)\\s+(\\d{1,2}),?\\s+(\\d{4})\\s+at\\s+(\\d{1,2}):(\\d{2})\\s*(AM|PM)'
        ],
        reminderSettings: {
          beforeEvent: [60, 1440], // 1 hour, 1 day
          notificationTypes: ['popup', 'email']
        },
        color: '#f59e0b',
        enabled: true
      },
      {
        id: 'qme-appointment',
        name: 'QME Appointment',
        description: 'Qualified Medical Examiner appointments',
        keywords: ['qme', 'medical exam', 'qualified medical examiner', 'medical evaluation'],
        eventType: 'qme',
        priority: 'medium',
        defaultTitle: 'QME Appointment',
        defaultLocation: 'Medical Office',
        taskTemplates: [
          'Inform client of appointment 3 days before',
          'Send medical records to QME 5 days before',
          'Confirm appointment 1 day before'
        ],
        datePatterns: [
          '(\\d{1,2})/(\\d{1,2})/(\\d{4})\\s+(\\d{1,2}):(\\d{2})\\s*(am|pm)',
          '(\\w+),\\s+(\\w+)\\s+(\\d{1,2}),?\\s+(\\d{4})\\s+at\\s+(\\d{1,2}):(\\d{2})\\s*(AM|PM)'
        ],
        reminderSettings: {
          beforeEvent: [60, 1440, 4320], // 1 hour, 1 day, 3 days
          notificationTypes: ['popup', 'email']
        },
        color: '#10b981',
        enabled: true
      },
      {
        id: 'general-appointment',
        name: 'General Appointment',
        description: 'General meetings and appointments',
        keywords: ['appointment', 'meeting', 'consultation', 'visit'],
        eventType: 'appointment',
        priority: 'medium',
        defaultTitle: 'Appointment',
        defaultLocation: 'Office',
        taskTemplates: [
          'Prepare agenda 1 day before',
          'Confirm attendance 1 day before'
        ],
        datePatterns: [
          '(\\d{1,2})/(\\d{1,2})/(\\d{4})\\s+(\\d{1,2}):(\\d{2})\\s*(am|pm)',
          '(\\w+),\\s+(\\w+)\\s+(\\d{1,2}),?\\s+(\\d{4})\\s+at\\s+(\\d{1,2}):(\\d{2})\\s*(AM|PM)',
          'at\\s+(\\d{1,2}):(\\d{2})\\s*(am|pm)',
          '(\\d{1,2}):(\\d{2})\\s*(am|pm)'
        ],
        reminderSettings: {
          beforeEvent: [15, 60], // 15 min, 1 hour
          notificationTypes: ['popup']
        },
        color: '#6366f1',
        enabled: true
      }
    ];

    this.savePatterns(defaultPatterns);
  }

  private savePatterns(patterns: UserEventPattern[]) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(patterns));
    } catch (error) {
      console.error('Error saving user patterns:', error);
    }
  }

  extractEventFromEmail(email: EmailMessage, forceCreate: boolean = false): CustomEventDetails | null {
    console.log('🔍 Extracting event from email:', email.subject, 'Force:', forceCreate);
    
    const patterns = this.getUserPatterns().filter(p => p.enabled);
    let bestMatch: { pattern: UserEventPattern; confidence: number } | null = null;

    // Try to match against user patterns
    for (const pattern of patterns) {
      const confidence = this.calculateMatchConfidence(email, pattern);
      console.log(`📊 Pattern "${pattern.name}" confidence: ${confidence}`);
      
      if (confidence > 0.3 && (!bestMatch || confidence > bestMatch.confidence)) {
        bestMatch = { pattern, confidence };
      }
    }

    // If force create is enabled and no good match found, create a generic event
    if (!bestMatch && forceCreate) {
      console.log('🎯 Force creating event for any email');
      bestMatch = {
        pattern: this.createGenericPattern(),
        confidence: 0.8 // High confidence for force-created events
      };
    }

    if (!bestMatch || bestMatch.confidence < 0.3) {
      console.log('❌ No suitable pattern match found');
      return null;
    }

    return this.createEventDetails(email, bestMatch.pattern, bestMatch.confidence);
  }

  private createGenericPattern(): UserEventPattern {
    return {
      id: 'generic-event',
      name: 'Generic Event',
      description: 'Manually created event from any email',
      keywords: [],
      eventType: 'custom',
      priority: 'medium',
      defaultTitle: 'Calendar Event',
      defaultLocation: 'TBD',
      taskTemplates: [
        'Review email details',
        'Prepare for event'
      ],
      datePatterns: [],
      reminderSettings: {
        beforeEvent: [15, 60],
        notificationTypes: ['popup']
      },
      color: '#6b7280',
      enabled: true
    };
  }

  private calculateMatchConfidence(email: EmailMessage, pattern: UserEventPattern): number {
    let confidence = 0;
    const content = `${email.subject} ${email.body || ''}`.toLowerCase();

    // Keyword matching (40% weight)
    const keywordMatches = pattern.keywords.filter(keyword => 
      content.includes(keyword.toLowerCase())
    );
    const keywordScore = keywordMatches.length / Math.max(pattern.keywords.length, 1);
    confidence += keywordScore * 0.4;

    // Date pattern matching (30% weight)
    const dateFound = this.findDateInContent(content, pattern.datePatterns);
    if (dateFound) {
      confidence += 0.3;
    }

    // Subject relevance (20% weight)
    const subjectRelevance = this.calculateSubjectRelevance(email.subject, pattern);
    confidence += subjectRelevance * 0.2;

    // Sender relevance (10% weight)
    const senderRelevance = this.calculateSenderRelevance(email.from, pattern);
    confidence += senderRelevance * 0.1;

    return Math.min(confidence, 1.0);
  }

  private findDateInContent(content: string, datePatterns: string[]): Date | null {
    for (const patternStr of datePatterns) {
      try {
        const pattern = new RegExp(patternStr, 'gi');
        const match = pattern.exec(content);
        if (match) {
          const dateStr = match[0];
          const parsedDate = this.parseDate(dateStr);
          if (parsedDate && parsedDate > new Date()) {
            return parsedDate;
          }
        }
      } catch (error) {
        console.warn('Invalid regex pattern:', patternStr, error);
      }
    }
    return null;
  }

  private parseDate(dateStr: string): Date | null {
    try {
      // Basic date parsing - can be enhanced
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      return null;
    }
  }

  private calculateSubjectRelevance(subject: string, pattern: UserEventPattern): number {
    const subjectLower = subject.toLowerCase();
    const relevantTerms = pattern.keywords.filter(keyword => 
      subjectLower.includes(keyword.toLowerCase())
    );
    return relevantTerms.length > 0 ? 0.8 : 0.2;
  }

  private calculateSenderRelevance(sender: string, pattern: UserEventPattern): number {
    // Simple sender relevance - can be enhanced with known legal entities
    const legalDomains = ['wcab.ca.gov', 'court.', 'legal', 'law'];
    const senderLower = sender.toLowerCase();
    
    if (pattern.eventType === 'court-date' || pattern.eventType === 'deposition') {
      return legalDomains.some(domain => senderLower.includes(domain)) ? 1.0 : 0.3;
    }
    
    return 0.5; // Default relevance
  }

  private createEventDetails(email: EmailMessage, pattern: UserEventPattern, confidence: number): CustomEventDetails {
    const foundDate = this.findDateInContent(
      `${email.subject} ${email.body || ''}`.toLowerCase(), 
      pattern.datePatterns
    );

    const eventDate = foundDate || this.suggestDefaultDate();
    const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000); // 1 hour later

    // Create custom tasks from templates
    const customTasks: CustomTask[] = pattern.taskTemplates.map((template, index) => ({
      id: `task-${Date.now()}-${index}`,
      title: template,
      description: `Auto-generated task: ${template}`,
      dueDate: new Date(eventDate.getTime() - (index + 1) * 24 * 60 * 60 * 1000), // Days before event
      priority: pattern.priority,
      estimatedDuration: 30,
      completed: false
    }));

    // Create default follow-up actions
    const followUpActions: FollowUpAction[] = [
      {
        id: `followup-${Date.now()}-1`,
        title: 'Post-event follow-up',
        description: 'Follow up on event outcomes and next steps',
        dueDate: new Date(eventDate.getTime() + 24 * 60 * 60 * 1000), // Day after event
        actionType: 'email',
        targetPerson: email.from,
        status: 'pending'
      }
    ];

    return {
      title: pattern.defaultTitle || email.subject,
      dateTime: eventDate,
      endDateTime: endDate,
      location: pattern.defaultLocation || 'TBD',
      attendees: [email.from].filter(Boolean),
      description: `Event created from email: ${email.subject}\n\nOriginal email from: ${email.from}\n\n${email.body || ''}`,
      eventType: pattern.eventType,
      customTasks,
      followUpActions,
      customFields: {
        sourceEmailId: email.id,
        sourceEmailSubject: email.subject,
        sourceEmailFrom: email.from,
        patternUsed: pattern.name,
        autoGenerated: true
      },
      tags: ['email-generated', pattern.eventType, `priority-${pattern.priority}`],
      confidence
    };
  }

  private suggestDefaultDate(): Date {
    // Suggest next business day at 9 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    // If it's weekend, move to Monday
    if (tomorrow.getDay() === 0) { // Sunday
      tomorrow.setDate(tomorrow.getDate() + 1);
    } else if (tomorrow.getDay() === 6) { // Saturday
      tomorrow.setDate(tomorrow.getDate() + 2);
    }
    
    return tomorrow;
  }
}