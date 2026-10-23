import { IndustryConfig, EventType, CustomField, QuickAction } from '../types/calendar.types';

// Legal Industry Configuration
export const legalIndustryConfig: IndustryConfig = {
  id: 'legal',
  name: 'Legal Practice',
  description: 'Legal practice calendar with court hearings, deadlines, and client meetings',
  eventTypes: [
    {
      id: 'hearing',
      name: 'Court Hearing',
      description: 'Scheduled court appearance',
      color: '#ff4d4f',
      defaultDuration: 120,
      requiresLocation: true,
      requiresParticipants: true
    },
    {
      id: 'deadline',
      name: 'Filing Deadline',
      description: 'Document filing or submission deadline',
      color: '#faad14',
      defaultDuration: 0,
      requiresLocation: false,
      requiresParticipants: false
    },
    {
      id: 'client-meeting',
      name: 'Client Meeting',
      description: 'Meeting with client',
      color: '#52c41a',
      defaultDuration: 60,
      requiresLocation: true,
      requiresParticipants: true
    },
    {
      id: 'deposition',
      name: 'Deposition',
      description: 'Witness deposition session',
      color: '#1890ff',
      defaultDuration: 180,
      requiresLocation: true,
      requiresParticipants: true
    },
    {
      id: 'mediation',
      name: 'Mediation',
      description: 'Mediation session',
      color: '#722ed1',
      defaultDuration: 240,
      requiresLocation: true,
      requiresParticipants: true
    }
  ],
  customFields: [
    {
      name: 'caseNumber',
      label: 'Case Number',
      type: 'text',
      required: false,
      placeholder: 'Enter case number'
    },
    {
      name: 'court',
      label: 'Court',
      type: 'select',
      required: false,
      placeholder: 'Select court',
      options: [
        { label: 'District Court', value: 'district' },
        { label: 'Circuit Court', value: 'circuit' },
        { label: 'Supreme Court', value: 'supreme' },
        { label: 'Federal Court', value: 'federal' }
      ]
    },
    {
      name: 'judge',
      label: 'Judge',
      type: 'text',
      required: false,
      placeholder: 'Enter judge name'
    },
    {
      name: 'clientName',
      label: 'Client Name',
      type: 'text',
      required: false,
      placeholder: 'Enter client name'
    },
    {
      name: 'caseType',
      label: 'Case Type',
      type: 'select',
      required: false,
      placeholder: 'Select case type',
      options: [
        { label: 'Civil', value: 'civil' },
        { label: 'Criminal', value: 'criminal' },
        { label: 'Family', value: 'family' },
        { label: 'Corporate', value: 'corporate' },
        { label: 'Personal Injury', value: 'personal-injury' }
      ]
    }
  ],
  quickActions: [
    {
      id: 'quick-hearing',
      label: 'Court Hearing',
      eventType: 'hearing',
      icon: 'CalendarOutlined',
      primary: true
    },
    {
      id: 'quick-deadline',
      label: 'Filing Deadline',
      eventType: 'deadline',
      icon: 'ClockCircleOutlined',
      primary: false
    },
    {
      id: 'quick-client',
      label: 'Client Meeting',
      eventType: 'client-meeting',
      icon: 'TeamOutlined',
      primary: false
    }
  ],
  workflows: [
    {
      id: 'case-lifecycle',
      name: 'Case Lifecycle',
      description: 'Complete case management workflow',
      steps: [
        {
          id: 'initial-consultation',
          name: 'Initial Consultation',
          eventType: 'client-meeting',
          duration: 60,
          required: true
        },
        {
          id: 'filing-deadline',
          name: 'Filing Deadline',
          eventType: 'deadline',
          duration: 0,
          required: true
        },
        {
          id: 'discovery-phase',
          name: 'Discovery Phase',
          eventType: 'deposition',
          duration: 180,
          required: false
        },
        {
          id: 'mediation',
          name: 'Mediation Attempt',
          eventType: 'mediation',
          duration: 240,
          required: false
        },
        {
          id: 'trial',
          name: 'Trial Hearing',
          eventType: 'hearing',
          duration: 480,
          required: true
        }
      ]
    }
  ],
  integrations: {
    googleCalendar: true,
    outlook: true,
    emailProcessing: true,
    documentManagement: true
  },
  notifications: {
    emailReminders: true,
    smsReminders: false,
    pushNotifications: true,
    defaultReminderMinutes: 60
  }
};

// Medical Industry Configuration
export const medicalIndustryConfig: IndustryConfig = {
  id: 'medical',
  name: 'Medical Practice',
  description: 'Medical practice calendar with appointments, surgeries, and consultations',
  eventTypes: [
    {
      id: 'appointment',
      name: 'Patient Appointment',
      description: 'Regular patient appointment',
      color: '#52c41a',
      defaultDuration: 30,
      requiresLocation: true,
      requiresParticipants: true
    },
    {
      id: 'surgery',
      name: 'Surgery',
      description: 'Surgical procedure',
      color: '#ff4d4f',
      defaultDuration: 180,
      requiresLocation: true,
      requiresParticipants: true
    },
    {
      id: 'consultation',
      name: 'Consultation',
      description: 'Medical consultation',
      color: '#1890ff',
      defaultDuration: 45,
      requiresLocation: true,
      requiresParticipants: true
    },
    {
      id: 'followup',
      name: 'Follow-up',
      description: 'Follow-up appointment',
      color: '#722ed1',
      defaultDuration: 20,
      requiresLocation: true,
      requiresParticipants: true
    },
    {
      id: 'emergency',
      name: 'Emergency',
      description: 'Emergency appointment',
      color: '#faad14',
      defaultDuration: 60,
      requiresLocation: true,
      requiresParticipants: true
    }
  ],
  customFields: [
    {
      name: 'patientId',
      label: 'Patient ID',
      type: 'text',
      required: false,
      placeholder: 'Enter patient ID'
    },
    {
      name: 'department',
      label: 'Department',
      type: 'select',
      required: false,
      placeholder: 'Select department',
      options: [
        { label: 'Cardiology', value: 'cardiology' },
        { label: 'Orthopedics', value: 'orthopedics' },
        { label: 'Neurology', value: 'neurology' },
        { label: 'Pediatrics', value: 'pediatrics' },
        { label: 'Emergency', value: 'emergency' }
      ]
    },
    {
      name: 'physician',
      label: 'Physician',
      type: 'text',
      required: false,
      placeholder: 'Enter physician name'
    },
    {
      name: 'roomNumber',
      label: 'Room Number',
      type: 'text',
      required: false,
      placeholder: 'Enter room number'
    },
    {
      name: 'diagnosis',
      label: 'Diagnosis',
      type: 'textarea',
      required: false,
      placeholder: 'Enter diagnosis or reason for visit'
    }
  ],
  quickActions: [
    {
      id: 'quick-appointment',
      label: 'Book Appointment',
      eventType: 'appointment',
      icon: 'CalendarOutlined',
      primary: true
    },
    {
      id: 'quick-emergency',
      label: 'Emergency',
      eventType: 'emergency',
      icon: 'AlertOutlined',
      primary: false
    }
  ],
  workflows: [
    {
      id: 'patient-care',
      name: 'Patient Care Workflow',
      description: 'Standard patient care process',
      steps: [
        {
          id: 'initial-appointment',
          name: 'Initial Appointment',
          eventType: 'appointment',
          duration: 45,
          required: true
        },
        {
          id: 'follow-up',
          name: 'Follow-up Visit',
          eventType: 'followup',
          duration: 20,
          required: false
        }
      ]
    }
  ],
  integrations: {
    googleCalendar: true,
    outlook: true,
    emailProcessing: false,
    documentManagement: true
  },
  notifications: {
    emailReminders: true,
    smsReminders: true,
    pushNotifications: true,
    defaultReminderMinutes: 30
  }
};

// Mortgage Industry Configuration
export const mortgageIndustryConfig: IndustryConfig = {
  id: 'mortgage',
  name: 'Mortgage Services',
  description: 'Mortgage industry calendar with closings, appraisals, and inspections',
  eventTypes: [
    {
      id: 'closing',
      name: 'Closing',
      description: 'Loan closing appointment',
      color: '#52c41a',
      defaultDuration: 120,
      requiresLocation: true,
      requiresParticipants: true
    },
    {
      id: 'appraisal',
      name: 'Appraisal',
      description: 'Property appraisal',
      color: '#1890ff',
      defaultDuration: 90,
      requiresLocation: true,
      requiresParticipants: true
    },
    {
      id: 'inspection',
      name: 'Inspection',
      description: 'Property inspection',
      color: '#722ed1',
      defaultDuration: 120,
      requiresLocation: true,
      requiresParticipants: true
    },
    {
      id: 'application-meeting',
      name: 'Application Meeting',
      description: 'Loan application meeting',
      color: '#faad14',
      defaultDuration: 60,
      requiresLocation: true,
      requiresParticipants: true
    },
    {
      id: 'rate-lock',
      name: 'Rate Lock Expiry',
      description: 'Interest rate lock expiration',
      color: '#ff4d4f',
      defaultDuration: 0,
      requiresLocation: false,
      requiresParticipants: false
    }
  ],
  customFields: [
    {
      name: 'loanNumber',
      label: 'Loan Number',
      type: 'text',
      required: false,
      placeholder: 'Enter loan number'
    },
    {
      name: 'propertyAddress',
      label: 'Property Address',
      type: 'text',
      required: false,
      placeholder: 'Enter property address'
    },
    {
      name: 'loanOfficer',
      label: 'Loan Officer',
      type: 'text',
      required: false,
      placeholder: 'Enter loan officer name'
    },
    {
      name: 'loanAmount',
      label: 'Loan Amount',
      type: 'text',
      required: false,
      placeholder: 'Enter loan amount'
    },
    {
      name: 'loanStage',
      label: 'Loan Stage',
      type: 'select',
      required: false,
      placeholder: 'Select loan stage',
      options: [
        { label: 'Application', value: 'application' },
        { label: 'Processing', value: 'processing' },
        { label: 'Underwriting', value: 'underwriting' },
        { label: 'Closing', value: 'closing' },
        { label: 'Funded', value: 'funded' }
      ]
    }
  ],
  quickActions: [
    {
      id: 'quick-closing',
      label: 'Schedule Closing',
      eventType: 'closing',
      icon: 'HomeOutlined',
      primary: true
    },
    {
      id: 'quick-appraisal',
      label: 'Book Appraisal',
      eventType: 'appraisal',
      icon: 'DollarOutlined',
      primary: false
    }
  ],
  workflows: [
    {
      id: 'loan-process',
      name: 'Loan Processing Workflow',
      description: 'Complete loan processing timeline',
      steps: [
        {
          id: 'application',
          name: 'Loan Application',
          eventType: 'application-meeting',
          duration: 60,
          required: true
        },
        {
          id: 'appraisal',
          name: 'Property Appraisal',
          eventType: 'appraisal',
          duration: 90,
          required: true
        },
        {
          id: 'inspection',
          name: 'Property Inspection',
          eventType: 'inspection',
          duration: 120,
          required: true
        },
        {
          id: 'closing',
          name: 'Loan Closing',
          eventType: 'closing',
          duration: 120,
          required: true
        }
      ]
    }
  ],
  integrations: {
    googleCalendar: true,
    outlook: true,
    emailProcessing: false,
    documentManagement: true
  },
  notifications: {
    emailReminders: true,
    smsReminders: false,
    pushNotifications: true,
    defaultReminderMinutes: 120
  }
};

// Default/Generic Industry Configuration
export const genericIndustryConfig: IndustryConfig = {
  id: 'generic',
  name: 'General Business',
  description: 'Generic business calendar for any industry',
  eventTypes: [
    {
      id: 'meeting',
      name: 'Meeting',
      description: 'General business meeting',
      color: '#1890ff',
      defaultDuration: 60,
      requiresLocation: false,
      requiresParticipants: true
    },
    {
      id: 'appointment',
      name: 'Appointment',
      description: 'Business appointment',
      color: '#52c41a',
      defaultDuration: 30,
      requiresLocation: false,
      requiresParticipants: true
    },
    {
      id: 'deadline',
      name: 'Deadline',
      description: 'Project or task deadline',
      color: '#ff4d4f',
      defaultDuration: 0,
      requiresLocation: false,
      requiresParticipants: false
    },
    {
      id: 'event',
      name: 'Event',
      description: 'General business event',
      color: '#722ed1',
      defaultDuration: 120,
      requiresLocation: true,
      requiresParticipants: true
    }
  ],
  customFields: [
    {
      name: 'project',
      label: 'Project',
      type: 'text',
      required: false,
      placeholder: 'Enter project name'
    },
    {
      name: 'priority',
      label: 'Priority',
      type: 'select',
      required: false,
      placeholder: 'Select priority',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Normal', value: 'normal' },
        { label: 'High', value: 'high' },
        { label: 'Urgent', value: 'urgent' }
      ]
    }
  ],
  quickActions: [
    {
      id: 'quick-meeting',
      label: 'Schedule Meeting',
      eventType: 'meeting',
      icon: 'TeamOutlined',
      primary: true
    }
  ],
  workflows: [],
  integrations: {
    googleCalendar: true,
    outlook: true,
    emailProcessing: false,
    documentManagement: false
  },
  notifications: {
    emailReminders: true,
    smsReminders: false,
    pushNotifications: true,
    defaultReminderMinutes: 15
  }
};

// Industry configuration registry
export const industryConfigs = {
  legal: legalIndustryConfig,
  medical: medicalIndustryConfig,
  mortgage: mortgageIndustryConfig,
  generic: genericIndustryConfig
};

// Helper function to get industry config by ID
export const getIndustryConfig = (industryId: string): IndustryConfig => {
  return industryConfigs[industryId as keyof typeof industryConfigs] || genericIndustryConfig;
};

// Helper function to get all available industries
export const getAvailableIndustries = () => {
  return Object.values(industryConfigs).map(config => ({
    id: config.id,
    name: config.name,
    description: config.description
  }));
};
