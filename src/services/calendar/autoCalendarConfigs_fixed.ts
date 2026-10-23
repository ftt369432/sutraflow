import { IndustryAutoCalendarConfig, AutoCalendarWorkflow } from '../../types/autoCalendar.types';

// Legal Industry Auto Calendar Configuration
export const legalAutoCalendarWorkflow: AutoCalendarWorkflow = {
  id: 'legal-wcab-2024',
  name: 'Legal WCAB Workflow',
  description: 'Optimized for Workers Compensation hearings, depositions, and legal proceedings',
  industryType: 'legal',
  enabled: true,
  confidenceThreshold: 0.7,
  defaultEventType: 'hearing',
  searchTerms: {
    primary: [
      'notice of hearing', 'hearing notice', 'wcab hearing', 'workers compensation hearing',
      'deposition notice', 'depo notice', 'examination under oath', 'euo notice'
    ],
    secondary: [
      'court date', 'trial date', 'mediation', 'settlement conference',
      'case management conference', 'status conference'
    ],
    eventTypes: {
      'wcab_hearing': ['wcab', 'workers comp', 'hearing', 'adjudication'],
      'deposition': ['deposition', 'depo', 'examination under oath', 'euo'],
      'mediation': ['mediation', 'settlement conference', 'adr'],
      'court_appearance': ['court', 'trial', 'appearance', 'motion']
    },
    exclusions: ['cancelled', 'postponed', 'rescheduled', 'vacated']
  },
  reminderTemplates: [
    {
      id: 'wcab-prep-7d',
      name: 'WCAB Hearing Preparation - 7 Days',
      type: 'email',
      timing: { offset: 10080 }, // 7 days
      message: {
        subject: 'WCAB Hearing in 7 Days: {eventTitle}',
        body: 'WCAB hearing scheduled for {eventDate} at {eventTime}. Location: {eventLocation}. Please prepare case files and witness statements.',
        variables: ['eventTitle', 'eventDate', 'eventTime', 'eventLocation']
      }
    }
  ],
  processingRules: [
    {
      id: 'wcab-high-priority',
      name: 'WCAB Hearing High Priority',
      enabled: true,
      priority: 1,
      conditions: {
        searchTerms: ['wcab', 'workers compensation hearing'],
        minimumConfidence: 0.8
      },
      actions: {
        createEvent: true,
        createTasks: true,
        scheduleReminders: true,
        notifyUsers: true
      },
      eventTemplate: {
        defaultDuration: 120,
        defaultLocation: 'WCAB Office',
        defaultPriority: 'high'
      },
      reminderTemplates: ['wcab-prep-7d'],
      taskTemplates: []
    }
  ],
  taskTemplates: [],
  notificationSettings: {
    onEventCreated: true,
    onDuplicateFound: true,
    onProcessingError: true,
    recipients: []
  }
};

// Medical Industry Auto Calendar Configuration
export const medicalAutoCalendarWorkflow: AutoCalendarWorkflow = {
  id: 'medical-appointments-2024',
  name: 'Medical Appointments Workflow',
  description: 'Optimized for medical appointments, procedures, and consultations',
  industryType: 'medical',
  enabled: true,
  confidenceThreshold: 0.6,
  defaultEventType: 'appointment',
  searchTerms: {
    primary: [
      'appointment', 'consultation', 'follow-up', 'check-up',
      'surgery', 'procedure', 'treatment', 'visit'
    ],
    secondary: [
      'doctor appointment', 'medical appointment', 'clinic visit',
      'hospital visit', 'specialist appointment'
    ],
    eventTypes: {
      'appointment': ['appointment', 'visit', 'consultation'],
      'surgery': ['surgery', 'operation', 'procedure'],
      'treatment': ['treatment', 'therapy', 'session'],
      'checkup': ['check-up', 'follow-up', 'routine']
    },
    exclusions: ['cancelled', 'postponed', 'rescheduled']
  },
  reminderTemplates: [
    {
      id: 'medical-reminder-1d',
      name: 'Medical Appointment Reminder - 1 Day',
      type: 'email',
      timing: { offset: 1440 }, // 1 day
      message: {
        subject: 'Medical Appointment Tomorrow: {eventTitle}',
        body: 'You have a medical appointment tomorrow at {eventTime}. Location: {eventLocation}. Please bring your insurance card and photo ID.',
        variables: ['eventTitle', 'eventTime', 'eventLocation']
      }
    }
  ],
  processingRules: [
    {
      id: 'medical-standard',
      name: 'Medical Appointment Standard Processing',
      enabled: true,
      priority: 1,
      conditions: {
        searchTerms: ['appointment', 'consultation'],
        minimumConfidence: 0.6
      },
      actions: {
        createEvent: true,
        createTasks: false,
        scheduleReminders: true,
        notifyUsers: true
      },
      eventTemplate: {
        defaultDuration: 60,
        defaultLocation: 'Medical Office',
        defaultPriority: 'normal'
      },
      reminderTemplates: ['medical-reminder-1d'],
      taskTemplates: []
    }
  ],
  taskTemplates: [],
  notificationSettings: {
    onEventCreated: true,
    onDuplicateFound: true,
    onProcessingError: true,
    recipients: []
  }
};

// Mortgage Industry Auto Calendar Configuration
export const mortgageAutoCalendarWorkflow: AutoCalendarWorkflow = {
  id: 'mortgage-closings-2024',
  name: 'Mortgage Closings Workflow',
  description: 'Optimized for mortgage closings, inspections, and related appointments',
  industryType: 'mortgage',
  enabled: true,
  confidenceThreshold: 0.7,
  defaultEventType: 'closing',
  searchTerms: {
    primary: [
      'closing', 'settlement', 'final walkthrough', 'inspection',
      'appraisal', 'loan signing', 'notary appointment'
    ],
    secondary: [
      'mortgage closing', 'home closing', 'property closing',
      'real estate closing', 'escrow closing'
    ],
    eventTypes: {
      'closing': ['closing', 'settlement', 'final'],
      'inspection': ['inspection', 'walkthrough', 'survey'],
      'appraisal': ['appraisal', 'valuation', 'assessment'],
      'signing': ['signing', 'notary', 'documents']
    },
    exclusions: ['cancelled', 'postponed', 'rescheduled', 'delayed']
  },
  reminderTemplates: [
    {
      id: 'closing-reminder-3d',
      name: 'Closing Reminder - 3 Days',
      type: 'email',
      timing: { offset: 4320 }, // 3 days
      message: {
        subject: 'Closing in 3 Days: {eventTitle}',
        body: 'Your closing is scheduled for {eventDate} at {eventTime}. Location: {eventLocation}. Please ensure all documents are ready.',
        variables: ['eventTitle', 'eventDate', 'eventTime', 'eventLocation']
      }
    }
  ],
  processingRules: [
    {
      id: 'closing-high-priority',
      name: 'Closing High Priority',
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
      reminderTemplates: ['closing-reminder-3d'],
      taskTemplates: []
    }
  ],
  taskTemplates: [],
  notificationSettings: {
    onEventCreated: true,
    onDuplicateFound: true,
    onProcessingError: true,
    recipients: []
  }
};

// Industry Workflow Map
export const industryWorkflows = {
  legal: legalAutoCalendarWorkflow,
  medical: medicalAutoCalendarWorkflow,
  mortgage: mortgageAutoCalendarWorkflow
} as const;

export type IndustryType = keyof typeof industryWorkflows;
