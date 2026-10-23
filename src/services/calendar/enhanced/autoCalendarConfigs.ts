import { AutoCalendarWorkflow, IndustryAutoCalendarConfig } from '../../types/autoCalendar.types';

// Legal Industry Auto Calendar Configuration
export const legalAutoCalendarWorkflow: AutoCalendarWorkflow = {
  id: 'legal-wcab-workflow',
  name: 'WCAB Legal Workflow',
  description: 'Automated calendar processing for Workers Compensation and legal matters',
  industryType: 'legal',
  enabled: true,
  searchTerms: {
    primary: [
      'notice of hearing',
      'hearing scheduled',
      'court hearing',
      'wcab hearing',
      'deposition notice',
      'mediation scheduled'
    ],
    secondary: [
      'workers compensation',
      'workers comp',
      'adjudication',
      'settlement conference',
      'medical examination',
      'ime scheduled',
      'priority conference'
    ],
    eventTypes: {
      'hearing': [
        'hearing', 'trial', 'adjudication', 'wcab', 'court appearance'
      ],
      'deposition': [
        'deposition', 'depo', 'examination under oath', 'euo'
      ],
      'mediation': [
        'mediation', 'settlement conference', 'settlement meeting'
      ],
      'client-meeting': [
        'client meeting', 'consultation', 'client conference'
      ],
      'deadline': [
        'filing deadline', 'due date', 'response due', 'must file by'
      ],
      'medical-exam': [
        'medical examination', 'ime', 'independent medical exam', 'qme'
      ]
    },
    exclusions: [
      'cancelled',
      'postponed',
      'rescheduled to tbd',
      'unconfirmed',
      'tentative'
    ]
  },
  processingRules: [
    {
      id: 'wcab-hearing-rule',
      name: 'WCAB Hearing Processing',
      enabled: true,
      priority: 1,
      conditions: {
        searchTerms: ['wcab', 'hearing', 'adjudication'],
        minimumConfidence: 0.7
      },
      actions: {
        createEvent: true,
        createTasks: true,
        scheduleReminders: true,
        notifyUsers: true,
        requireApproval: false
      },
      eventTemplate: {
        defaultDuration: 120, // 2 hours
        defaultLocation: 'WCAB Office',
        defaultPriority: 'high',
        customFields: {
          eventType: 'hearing',
          requiresPreparation: true,
          documentDeadline: true
        }
      },
      reminderTemplates: ['hearing-prep-week', 'hearing-prep-day', 'hearing-1hour'],
      taskTemplates: ['hearing-prep-tasks', 'document-review-tasks']
    },
    {
      id: 'deposition-rule',
      name: 'Deposition Processing',
      enabled: true,
      priority: 2,
      conditions: {
        searchTerms: ['deposition', 'depo'],
        minimumConfidence: 0.6
      },
      actions: {
        createEvent: true,
        createTasks: true,
        scheduleReminders: true,
        notifyUsers: true
      },
      eventTemplate: {
        defaultDuration: 180, // 3 hours
        defaultPriority: 'normal',
        customFields: {
          eventType: 'deposition',
          requiresCourtReporter: true
        }
      },
      reminderTemplates: ['depo-prep-3days', 'depo-prep-day'],
      taskTemplates: ['depo-prep-tasks']
    },
    {
      id: 'deadline-rule',
      name: 'Filing Deadline Processing',
      enabled: true,
      priority: 3,
      conditions: {
        searchTerms: ['deadline', 'due', 'filing', 'response'],
        minimumConfidence: 0.5
      },
      actions: {
        createEvent: true,
        createTasks: true,
        scheduleReminders: true,
        notifyUsers: true,
        requireApproval: false
      },
      eventTemplate: {
        defaultDuration: 0, // All-day event
        defaultPriority: 'urgent',
        customFields: {
          eventType: 'deadline',
          allDay: true
        }
      },
      reminderTemplates: ['deadline-week', 'deadline-3days', 'deadline-day'],
      taskTemplates: ['deadline-prep-tasks']
    }
  ],
  reminderTemplates: [
    {
      id: 'hearing-prep-week',
      name: 'Hearing Preparation - 1 Week',
      type: 'email',
      timing: {
        offset: 10080 // 7 days * 24 hours * 60 minutes
      },
      message: {
        subject: 'Upcoming Hearing - 1 Week Preparation Reminder',
        body: `
Dear {attendeeName},

This is a reminder that you have a {eventType} scheduled for {eventDate} at {eventTime}.

Event: {eventTitle}
Date: {eventDate}
Time: {eventTime}
Location: {eventLocation}
Case: {caseNumber}

Preparation Items:
• Review case file
• Prepare witness list
• Gather exhibits
• Coordinate with client

Please confirm your attendance and preparation status.

Best regards,
Calendar Automation System
        `,
        variables: ['attendeeName', 'eventType', 'eventDate', 'eventTime', 'eventTitle', 'eventLocation', 'caseNumber']
      },
      conditions: {
        eventTypes: ['hearing', 'trial']
      }
    },
    {
      id: 'hearing-prep-day',
      name: 'Hearing Preparation - Day Of',
      type: 'email',
      timing: {
        offset: 480 // 8 hours
      },
      message: {
        subject: 'Today\'s Hearing Reminder - {eventTitle}',
        body: `
HEARING TODAY REMINDER

Event: {eventTitle}
Time: {eventTime}
Location: {eventLocation}
Case: {caseNumber}

Final Checklist:
☐ Case file reviewed
☐ Exhibits prepared
☐ Client contacted
☐ Travel arrangements confirmed
☐ Court reporter confirmed (if needed)

Good luck!
        `,
        variables: ['eventTitle', 'eventTime', 'eventLocation', 'caseNumber']
      }
    },
    {
      id: 'hearing-1hour',
      name: 'Hearing - 1 Hour Warning',
      type: 'push',
      timing: {
        offset: 60 // 1 hour
      },
      message: {
        body: '🏛️ Hearing in 1 hour: {eventTitle} at {eventLocation}'
      }
    },
    {
      id: 'depo-prep-3days',
      name: 'Deposition Preparation - 3 Days',
      type: 'email',
      timing: {
        offset: 4320 // 3 days
      },
      message: {
        subject: 'Deposition in 3 Days - Preparation Reminder',
        body: `
Deposition Preparation Reminder

Event: {eventTitle}
Date: {eventDate}
Time: {eventTime}
Location: {eventLocation}

Preparation Tasks:
• Review discovery materials
• Prepare outline of questioning
• Coordinate with court reporter
• Confirm location and logistics
• Review relevant case law

Case: {caseNumber}
        `
      }
    },
    {
      id: 'depo-prep-day',
      name: 'Deposition - Day Of',
      type: 'email',
      timing: {
        offset: 120 // 2 hours
      },
      message: {
        subject: 'Deposition Today - {eventTitle}',
        body: `
DEPOSITION TODAY

Time: {eventTime}
Location: {eventLocation}
Case: {caseNumber}

Final preparations complete?
☐ Questions outlined
☐ Court reporter confirmed
☐ Recording equipment ready
☐ Documents organized
        `
      }
    },
    {
      id: 'deadline-week',
      name: 'Filing Deadline - 1 Week',
      type: 'email',
      timing: {
        offset: 10080 // 7 days
      },
      message: {
        subject: '📅 Filing Deadline in 1 Week - {eventTitle}',
        body: `
IMPORTANT FILING DEADLINE APPROACHING

Deadline: {eventDate}
Matter: {eventTitle}
Case: {caseNumber}

Actions Required:
• Draft filing document
• Review requirements
• Gather supporting materials
• Schedule review time
• Prepare for filing

Please prioritize this deadline.
        `
      }
    },
    {
      id: 'deadline-3days',
      name: 'Filing Deadline - 3 Days',
      type: 'email',
      timing: {
        offset: 4320 // 3 days
      },
      message: {
        subject: '⚠️ URGENT: Filing Deadline in 3 Days - {eventTitle}',
        body: `
URGENT FILING DEADLINE

Deadline: {eventDate} 
Matter: {eventTitle}
Case: {caseNumber}

Status Check:
☐ Document drafted
☐ Review completed
☐ Supporting materials ready
☐ Filing method confirmed
☐ Backup plan in place

Only 3 days remaining!
        `
      }
    },
    {
      id: 'deadline-day',
      name: 'Filing Deadline - Today',
      type: 'push',
      timing: {
        offset: 240 // 4 hours
      },
      message: {
        body: '🚨 FILING DEADLINE TODAY: {eventTitle} - Case: {caseNumber}'
      }
    }
  ],
  taskTemplates: [], // Will be populated separately
  notificationSettings: {
    onEventCreated: true,
    onDuplicateFound: true,
    onProcessingError: true,
    recipients: ['admin@lawfirm.com']
  }
};

// Medical Industry Auto Calendar Configuration
export const medicalAutoCalendarWorkflow: AutoCalendarWorkflow = {
  id: 'medical-appointment-workflow',
  name: 'Medical Appointment Workflow',
  description: 'Automated calendar processing for medical appointments and procedures',
  industryType: 'medical',
  enabled: true,
  searchTerms: {
    primary: [
      'appointment scheduled',
      'surgery scheduled',
      'procedure scheduled',
      'consultation booked'
    ],
    secondary: [
      'follow-up',
      'check-up',
      'examination',
      'test results',
      'lab work'
    ],
    eventTypes: {
      'appointment': ['appointment', 'visit', 'consultation'],
      'surgery': ['surgery', 'operation', 'procedure'],
      'followup': ['follow-up', 'follow up', 'check-up'],
      'emergency': ['emergency', 'urgent', 'stat'],
      'consultation': ['consultation', 'referral', 'specialist']
    },
    exclusions: [
      'cancelled',
      'postponed',
      'rescheduled',
      'tentative'
    ]
  },
  processingRules: [
    {
      id: 'surgery-rule',
      name: 'Surgery Processing',
      enabled: true,
      priority: 1,
      conditions: {
        searchTerms: ['surgery', 'operation', 'procedure'],
        minimumConfidence: 0.8
      },
      actions: {
        createEvent: true,
        createTasks: true,
        scheduleReminders: true,
        notifyUsers: true
      },
      eventTemplate: {
        defaultDuration: 240, // 4 hours
        defaultLocation: 'Operating Room',
        defaultPriority: 'urgent'
      },
      reminderTemplates: ['surgery-prep-week', 'surgery-prep-day'],
      taskTemplates: ['surgery-prep-tasks']
    },
    {
      id: 'appointment-rule',
      name: 'Appointment Processing',
      enabled: true,
      priority: 2,
      conditions: {
        searchTerms: ['appointment', 'visit'],
        minimumConfidence: 0.6
      },
      actions: {
        createEvent: true,
        createTasks: false,
        scheduleReminders: true,
        notifyUsers: true
      },
      eventTemplate: {
        defaultDuration: 30,
        defaultPriority: 'normal'
      },
      reminderTemplates: ['appointment-day', 'appointment-1hour'],
      taskTemplates: []
    }
  ],
  reminderTemplates: [
    {
      id: 'surgery-prep-week',
      name: 'Surgery Preparation - 1 Week',
      type: 'email',
      timing: { offset: 10080 },
      message: {
        subject: 'Surgery Preparation - {eventTitle}',
        body: 'Pre-surgery preparations needed for {eventDate}...'
      }
    },
    {
      id: 'surgery-prep-day',
      name: 'Surgery - Day Of',
      type: 'sms',
      timing: { offset: 120 },
      message: {
        body: 'Surgery today at {eventTime}. Pre-op instructions: Fast after midnight, arrive 2 hours early.'
      }
    },
    {
      id: 'appointment-day',
      name: 'Appointment Tomorrow',
      type: 'email',
      timing: { offset: 1440 },
      message: {
        subject: 'Appointment Reminder - {eventTitle}',
        body: 'Appointment tomorrow at {eventTime} with {doctor}.'
      }
    },
    {
      id: 'appointment-1hour',
      name: 'Appointment - 1 Hour',
      type: 'push',
      timing: { offset: 60 },
      message: {
        body: '🏥 Appointment in 1 hour: {eventTitle}'
      }
    }
  ],
  taskTemplates: [],
  notificationSettings: {
    onEventCreated: true,
    onDuplicateFound: false,
    onProcessingError: true,
    recipients: ['admin@medical.com']
  }
};

// Mortgage Industry Auto Calendar Configuration
export const mortgageAutoCalendarWorkflow: AutoCalendarWorkflow = {
  id: 'mortgage-closing-workflow',
  name: 'Mortgage Closing Workflow',
  description: 'Automated calendar processing for mortgage closings and related activities',
  industryType: 'mortgage',
  enabled: true,
  searchTerms: {
    primary: [
      'closing scheduled',
      'settlement scheduled',
      'appraisal scheduled',
      'inspection scheduled'
    ],
    secondary: [
      'loan approval',
      'underwriting',
      'final walkthrough',
      'title search'
    ],
    eventTypes: {
      'closing': ['closing', 'settlement', 'final signing'],
      'appraisal': ['appraisal', 'property valuation'],
      'inspection': ['inspection', 'home inspection'],
      'walkthrough': ['walkthrough', 'final walkthrough']
    },
    exclusions: ['cancelled', 'postponed', 'pending']
  },
  processingRules: [
    {
      id: 'closing-rule',
      name: 'Closing Processing',
      enabled: true,
      priority: 1,
      conditions: {
        searchTerms: ['closing', 'settlement'],
        minimumConfidence: 0.7
      },
      actions: {
        createEvent: true,
        createTasks: true,
        scheduleReminders: true,
        notifyUsers: true
      },
      eventTemplate: {
        defaultDuration: 120,
        defaultLocation: 'Title Company',
        defaultPriority: 'high'
      },
      reminderTemplates: ['closing-week', 'closing-day'],
      taskTemplates: ['closing-prep-tasks']
    }
  ],
  reminderTemplates: [
    {
      id: 'closing-week',
      name: 'Closing - 1 Week',
      type: 'email',
      timing: { offset: 10080 },
      message: {
        subject: 'Closing in 1 Week - {eventTitle}',
        body: 'Prepare documents for closing on {eventDate}...'
      }
    },
    {
      id: 'closing-day',
      name: 'Closing Today',
      type: 'push',
      timing: { offset: 120 },
      message: {
        body: '🏠 Closing today at {eventTime}: {eventTitle}'
      }
    }
  ],
  taskTemplates: [],
  notificationSettings: {
    onEventCreated: true,
    onDuplicateFound: true,
    onProcessingError: true,
    recipients: ['admin@mortgage.com']
  }
};

// Industry Configurations
export const legalIndustryAutoConfig: IndustryAutoCalendarConfig = {
  id: 'legal',
  name: 'Legal Practice Auto Calendar',
  description: 'Automated calendar processing for legal practices with WCAB specialization',
  workflows: [legalAutoCalendarWorkflow],
  defaultWorkflowId: 'legal-wcab-workflow'
};

export const medicalIndustryAutoConfig: IndustryAutoCalendarConfig = {
  id: 'medical',
  name: 'Medical Practice Auto Calendar',
  description: 'Automated calendar processing for medical practices',
  workflows: [medicalAutoCalendarWorkflow],
  defaultWorkflowId: 'medical-appointment-workflow'
};

export const mortgageIndustryAutoConfig: IndustryAutoCalendarConfig = {
  id: 'mortgage',
  name: 'Mortgage Services Auto Calendar',
  description: 'Automated calendar processing for mortgage and real estate services',
  workflows: [mortgageAutoCalendarWorkflow],
  defaultWorkflowId: 'mortgage-closing-workflow'
};

// Registry of all industry auto calendar configurations
export const industryAutoCalendarConfigs = {
  legal: legalIndustryAutoConfig,
  medical: medicalIndustryAutoConfig,
  mortgage: mortgageIndustryAutoConfig
};

// Helper function to get auto calendar config by industry
export const getAutoCalendarConfig = (industryId: string): IndustryAutoCalendarConfig => {
  return industryAutoCalendarConfigs[industryId as keyof typeof industryAutoCalendarConfigs] || legalIndustryAutoConfig;
};
