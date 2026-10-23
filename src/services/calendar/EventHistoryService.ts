import { EmailMessage } from '../email/types';

// Industry-agnostic interfaces for customizable event tracking
export interface EventHistoryEntry {
  id: string;
  timestamp: Date;
  eventType: 'created' | 'updated' | 'rescheduled' | 'cancelled' | 'completed' | 'followup' | 'custom';
  description: string;
  sourceEmail?: string;
  sourceData: {
    emailId?: string;
    emailSubject?: string;
    emailFrom?: string;
    extractedData?: any;
  };
  userAction?: boolean; // True if manually created/updated by user
  automatedReason?: string; // Reason for automated changes
  metadata: Record<string, any>;
}

export interface EventFollowUp {
  id: string;
  parentEventId: string;
  followUpType: string; // Industry-specific: 'continuance', 'appointment-followup', 'treatment-plan', etc.
  scheduledDate?: Date;
  status: 'pending' | 'completed' | 'cancelled' | 'overdue';
  title: string;
  description: string;
  sourceEmail?: string;
  relatedDocuments: string[];
  customFields: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IndustryTemplate {
  id: string;
  name: string;
  industry: 'legal' | 'medical' | 'mortgage' | 'insurance' | 'consulting' | 'custom';
  eventTypes: {
    [key: string]: {
      displayName: string;
      followUpTypes: string[];
      defaultDuration: number; // minutes
      reminderOffsets: number[]; // minutes before event
      requiredFields: string[];
      customFields: {
        [fieldName: string]: {
          type: 'text' | 'date' | 'number' | 'select' | 'boolean';
          options?: string[];
          required: boolean;
          displayName: string;
        };
      };
    };
  };
  followUpTypes: {
    [key: string]: {
      displayName: string;
      defaultOffsetDays: number;
      autoCreate: boolean;
      requiredFields: string[];
      customFields: Record<string, any>;
    };
  };
  historyLabels: {
    [eventType: string]: string;
  };
}

// Pre-built industry templates
export const INDUSTRY_TEMPLATES: Record<string, IndustryTemplate> = {
  legal: {
    id: 'legal',
    name: 'Legal Practice',
    industry: 'legal',
    eventTypes: {
      'wcab-hearing': {
        displayName: 'WCAB Hearing',
        followUpTypes: ['continuance', 'decision-followup', 'settlement-conference'],
        defaultDuration: 60,
        reminderOffsets: [1440, 180, 30], // 1 day, 3 hours, 30 minutes
        requiredFields: ['caseNumber', 'judge', 'clientName'],
        customFields: {
          caseNumber: { type: 'text', required: true, displayName: 'Case Number' },
          judge: { type: 'text', required: true, displayName: 'Judge' },
          clientName: { type: 'text', required: true, displayName: 'Client Name' },
          hearingType: { 
            type: 'select', 
            options: ['Lien Conference', 'Trial', 'MSC', 'Status Conference'],
            required: false,
            displayName: 'Hearing Type'
          }
        }
      },
      'deposition': {
        displayName: 'Deposition',
        followUpTypes: ['transcript-review', 'follow-up-discovery'],
        defaultDuration: 240,
        reminderOffsets: [2880, 1440, 60], // 2 days, 1 day, 1 hour
        requiredFields: ['caseNumber', 'deponent'],
        customFields: {
          caseNumber: { type: 'text', required: true, displayName: 'Case Number' },
          deponent: { type: 'text', required: true, displayName: 'Deponent' },
          courtReporter: { type: 'text', required: false, displayName: 'Court Reporter' }
        }
      }
    },
    followUpTypes: {
      'continuance': {
        displayName: 'Hearing Continuance',
        defaultOffsetDays: 30,
        autoCreate: false,
        requiredFields: ['newDate', 'reason'],
        customFields: {}
      },
      'decision-followup': {
        displayName: 'Decision Follow-up',
        defaultOffsetDays: 14,
        autoCreate: true,
        requiredFields: [],
        customFields: {}
      }
    },
    historyLabels: {
      'created': 'Hearing Scheduled',
      'rescheduled': 'Hearing Rescheduled',
      'cancelled': 'Hearing Cancelled',
      'completed': 'Hearing Completed'
    }
  },

  medical: {
    id: 'medical',
    name: 'Medical Practice',
    industry: 'medical',
    eventTypes: {
      'patient-appointment': {
        displayName: 'Patient Appointment',
        followUpTypes: ['treatment-plan', 'follow-up-visit', 'lab-results'],
        defaultDuration: 30,
        reminderOffsets: [1440, 120, 15], // 1 day, 2 hours, 15 minutes
        requiredFields: ['patientId', 'appointmentType'],
        customFields: {
          patientId: { type: 'text', required: true, displayName: 'Patient ID' },
          appointmentType: {
            type: 'select',
            options: ['Consultation', 'Follow-up', 'Procedure', 'Emergency'],
            required: true,
            displayName: 'Appointment Type'
          },
          chiefComplaint: { type: 'text', required: false, displayName: 'Chief Complaint' }
        }
      },
      'surgery': {
        displayName: 'Surgery',
        followUpTypes: ['post-op-visit', 'discharge-planning'],
        defaultDuration: 120,
        reminderOffsets: [2880, 1440, 60],
        requiredFields: ['patientId', 'procedure'],
        customFields: {
          patientId: { type: 'text', required: true, displayName: 'Patient ID' },
          procedure: { type: 'text', required: true, displayName: 'Procedure' },
          surgeon: { type: 'text', required: true, displayName: 'Surgeon' }
        }
      }
    },
    followUpTypes: {
      'treatment-plan': {
        displayName: 'Treatment Plan Review',
        defaultOffsetDays: 7,
        autoCreate: true,
        requiredFields: [],
        customFields: {}
      },
      'follow-up-visit': {
        displayName: 'Follow-up Visit',
        defaultOffsetDays: 14,
        autoCreate: false,
        requiredFields: ['followUpReason'],
        customFields: {}
      }
    },
    historyLabels: {
      'created': 'Appointment Scheduled',
      'rescheduled': 'Appointment Rescheduled',
      'cancelled': 'Appointment Cancelled',
      'completed': 'Appointment Completed'
    }
  },

  mortgage: {
    id: 'mortgage',
    name: 'Mortgage Industry',
    industry: 'mortgage',
    eventTypes: {
      'loan-closing': {
        displayName: 'Loan Closing',
        followUpTypes: ['post-closing-review', 'funding-confirmation'],
        defaultDuration: 60,
        reminderOffsets: [1440, 180, 30],
        requiredFields: ['loanNumber', 'borrower'],
        customFields: {
          loanNumber: { type: 'text', required: true, displayName: 'Loan Number' },
          borrower: { type: 'text', required: true, displayName: 'Borrower' },
          loanAmount: { type: 'number', required: true, displayName: 'Loan Amount' },
          propertyAddress: { type: 'text', required: false, displayName: 'Property Address' }
        }
      },
      'appraisal': {
        displayName: 'Property Appraisal',
        followUpTypes: ['appraisal-review', 'value-dispute'],
        defaultDuration: 90,
        reminderOffsets: [1440, 60],
        requiredFields: ['loanNumber', 'appraiser'],
        customFields: {
          loanNumber: { type: 'text', required: true, displayName: 'Loan Number' },
          appraiser: { type: 'text', required: true, displayName: 'Appraiser' },
          propertyType: {
            type: 'select',
            options: ['Single Family', 'Condo', 'Townhouse', 'Multi-Family'],
            required: false,
            displayName: 'Property Type'
          }
        }
      }
    },
    followUpTypes: {
      'post-closing-review': {
        displayName: 'Post-Closing Review',
        defaultOffsetDays: 3,
        autoCreate: true,
        requiredFields: [],
        customFields: {}
      },
      'funding-confirmation': {
        displayName: 'Funding Confirmation',
        defaultOffsetDays: 1,
        autoCreate: true,
        requiredFields: [],
        customFields: {}
      }
    },
    historyLabels: {
      'created': 'Event Scheduled',
      'rescheduled': 'Event Rescheduled',
      'cancelled': 'Event Cancelled',
      'completed': 'Event Completed'
    }
  }
};

export class EventHistoryService {
  private template: IndustryTemplate;
  
  constructor(industryOrTemplate: string | IndustryTemplate) {
    if (typeof industryOrTemplate === 'string') {
      this.template = INDUSTRY_TEMPLATES[industryOrTemplate] || INDUSTRY_TEMPLATES.legal;
    } else {
      this.template = industryOrTemplate;
    }
  }

  /**
   * Create initial event history entry when event is first created
   */
  createInitialHistory(eventId: string, sourceEmail: EmailMessage, extractedData: any): EventHistoryEntry {
    return {
      id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      eventType: 'created',
      description: this.template.historyLabels.created || 'Event Created',
      sourceEmail: sourceEmail.id,
      sourceData: {
        emailId: sourceEmail.id,
        emailSubject: sourceEmail.subject,
        emailFrom: sourceEmail.from,
        extractedData
      },
      userAction: false,
      automatedReason: 'Automatically created from email analysis',
      metadata: {
        confidence: extractedData.confidence || 0,
        industry: this.template.industry,
        template: this.template.id
      }
    };
  }

  /**
   * Add history entry for event updates/reschedules
   */
  addHistoryEntry(
    eventId: string, 
    eventType: EventHistoryEntry['eventType'],
    description: string,
    sourceEmail?: EmailMessage,
    userAction: boolean = false,
    metadata: Record<string, any> = {}
  ): EventHistoryEntry {
    return {
      id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      eventType,
      description,
      sourceEmail: sourceEmail?.id,
      sourceData: sourceEmail ? {
        emailId: sourceEmail.id,
        emailSubject: sourceEmail.subject,
        emailFrom: sourceEmail.from
      } : {},
      userAction,
      automatedReason: userAction ? undefined : 'Automatically updated from email analysis',
      metadata: {
        ...metadata,
        industry: this.template.industry,
        template: this.template.id
      }
    };
  }

  /**
   * Create follow-up events based on industry template
   */
  createFollowUps(
    parentEventId: string, 
    eventType: string, 
    parentDate: Date,
    customData: Record<string, any> = {}
  ): EventFollowUp[] {
    const eventConfig = this.template.eventTypes[eventType];
    if (!eventConfig) return [];

    const followUps: EventFollowUp[] = [];

    for (const followUpTypeKey of eventConfig.followUpTypes) {
      const followUpConfig = this.template.followUpTypes[followUpTypeKey];
      if (!followUpConfig || !followUpConfig.autoCreate) continue;

      const scheduledDate = new Date(parentDate);
      scheduledDate.setDate(scheduledDate.getDate() + followUpConfig.defaultOffsetDays);

      followUps.push({
        id: `followup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        parentEventId,
        followUpType: followUpTypeKey,
        scheduledDate,
        status: 'pending',
        title: followUpConfig.displayName,
        description: `Automated follow-up for ${eventConfig.displayName}`,
        relatedDocuments: [],
        customFields: {
          ...customData,
          autoCreated: true,
          parentEventType: eventType
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return followUps;
  }

  /**
   * Generate event description with history and follow-up links
   */
  generateEventDescription(
    eventDetails: any,
    history: EventHistoryEntry[],
    followUps: EventFollowUp[],
    appBaseUrl: string = 'https://app.genieflow.ai'
  ): string {
    let description = '';

    // Basic event information
    const eventConfig = this.template.eventTypes[eventDetails.eventType];
    if (eventConfig) {
      description += `Type: ${eventConfig.displayName}\n`;
    }

    // Add custom fields based on template
    if (eventConfig?.customFields) {
      for (const [fieldKey, fieldConfig] of Object.entries(eventConfig.customFields)) {
        const value = eventDetails.extractedData?.[fieldKey] || eventDetails[fieldKey];
        if (value) {
          description += `${fieldConfig.displayName}: ${value}\n`;
        }
      }
    }

    // Add history section
    if (history.length > 0) {
      description += `\n📋 Event History:\n`;
      const sortedHistory = [...history].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      for (const entry of sortedHistory.slice(0, 5)) { // Show last 5 entries
        const date = entry.timestamp.toLocaleDateString();
        const time = entry.timestamp.toLocaleTimeString();
        description += `• ${date} ${time}: ${entry.description}`;
        if (entry.sourceEmail) {
          description += ` (Email: ${entry.sourceData.emailSubject?.substring(0, 30)}...)`;
        }
        description += '\n';
      }
      
      if (sortedHistory.length > 5) {
        description += `... and ${sortedHistory.length - 5} more entries\n`;
      }

      // Add link to full history
      description += `\n🔗 View Full History: ${appBaseUrl}/events/${eventDetails.id}/history\n`;
    }

    // Add follow-up section
    if (followUps.length > 0) {
      description += `\n📅 Related Follow-ups:\n`;
      const activeFollowUps = followUps.filter(f => f.status !== 'cancelled');
      
      for (const followUp of activeFollowUps) {
        const status = followUp.status === 'pending' ? '⏳' : 
                     followUp.status === 'completed' ? '✅' : 
                     followUp.status === 'overdue' ? '🔴' : '❓';
        
        const date = followUp.scheduledDate?.toLocaleDateString() || 'TBD';
        description += `${status} ${followUp.title} (${date})\n`;
      }

      // Add link to manage follow-ups
      description += `\n🔗 Manage Follow-ups: ${appBaseUrl}/events/${eventDetails.id}/followups\n`;
    }

    // Add app-specific metadata
    description += `\n📱 Managed by GenieFlow AI - Industry: ${this.template.name}\n`;
    description += `🔗 Event Details: ${appBaseUrl}/events/${eventDetails.id}\n`;

    return description.trim();
  }

  /**
   * Get template configuration for current industry
   */
  getTemplate(): IndustryTemplate {
    return this.template;
  }

  /**
   * Switch to different industry template
   */
  switchTemplate(industryOrTemplate: string | IndustryTemplate): void {
    if (typeof industryOrTemplate === 'string') {
      this.template = INDUSTRY_TEMPLATES[industryOrTemplate] || INDUSTRY_TEMPLATES.legal;
    } else {
      this.template = industryOrTemplate;
    }
  }

  /**
   * Create custom industry template
   */
  static createCustomTemplate(config: Partial<IndustryTemplate>): IndustryTemplate {
    return {
      id: config.id || 'custom',
      name: config.name || 'Custom Industry',
      industry: config.industry || 'custom',
      eventTypes: config.eventTypes || {},
      followUpTypes: config.followUpTypes || {},
      historyLabels: config.historyLabels || {
        'created': 'Event Created',
        'updated': 'Event Updated',
        'rescheduled': 'Event Rescheduled',
        'cancelled': 'Event Cancelled',
        'completed': 'Event Completed'
      }
    };
  }
}
