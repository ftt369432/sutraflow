import { addDays, subDays, addHours, subHours } from 'date-fns';

// Test data for Contacts
export const testContacts = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    company: 'Tech Corp',
    tags: ['client', 'tech'],
    lastInteraction: subDays(new Date(), 2),
  },
  {
    id: '2',
    name: 'Alice Smith',
    email: 'alice@example.com',
    company: 'Legal Solutions',
    tags: ['lawyer', 'partner'],
    lastInteraction: subDays(new Date(), 5),
  },
  {
    id: '3',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    company: 'Marketing Pro',
    tags: ['marketing', 'consultant'],
    lastInteraction: new Date(),
  },
];

// Test data for Calendar Events
export const testEvents = [
  {
    id: '1',
    title: 'Client Meeting',
    description: 'Quarterly review with Tech Corp',
    start: addHours(new Date(), 2),
    end: addHours(new Date(), 3),
    type: 'meeting' as const,
    attendees: ['john@example.com'],
  },
  {
    id: '2',
    title: 'Project Review',
    description: 'Internal review of Q1 deliverables',
    start: addDays(new Date(), 1),
    end: addDays(addHours(new Date(), 1), 1),
    type: 'task' as const,
    attendees: ['alice@example.com', 'bob@example.com'],
  },
  {
    id: '3',
    title: 'Lunch Break',
    start: addHours(new Date(), 4),
    end: addHours(new Date(), 5),
    type: 'break' as const,
    attendees: [],
  },
];

// Test data for Tasks
export const testTasks = [
  {
    id: '1',
    title: 'Complete Project Proposal',
    description: 'Draft and review Q2 project proposal',
    priority: 'high' as const,
    completed: false,
    dueDate: addDays(new Date(), 2),
    tags: ['urgent', 'client'],
    duration: 120,
  },
  {
    id: '2',
    title: 'Weekly Team Meeting',
    description: 'Regular sync-up with the development team',
    priority: 'medium' as const,
    completed: false,
    dueDate: addDays(new Date(), 1),
    tags: ['recurring', 'internal'],
    duration: 60,
    recurrence: {
      frequency: 'weekly' as const,
      interval: 1,
    },
  },
  {
    id: '3',
    title: 'Review Documentation',
    description: 'Update API documentation',
    priority: 'low' as const,
    completed: true,
    dueDate: subDays(new Date(), 1),
    tags: ['documentation'],
    duration: 90,
  },
];

// Test data for Documents
export const testDocuments = [
  {
    id: '1',
    name: 'Project Proposal.pdf',
    type: 'pdf',
    size: 1024576, // 1MB
    uploadDate: subDays(new Date(), 1),
    tags: ['proposal', 'client'],
    summary: 'Q2 project proposal for Tech Corp including timeline and budget',
    metadata: {
      pageCount: 12,
      author: 'John Doe',
      createdAt: subDays(new Date(), 2),
    },
  },
  {
    id: '2',
    name: 'Legal Contract.docx',
    type: 'docx',
    size: 2048576, // 2MB
    uploadDate: new Date(),
    tags: ['legal', 'contract'],
    summary: 'Service agreement template for new clients',
    metadata: {
      pageCount: 8,
      author: 'Alice Smith',
      createdAt: subDays(new Date(), 1),
    },
  },
  {
    id: '3',
    name: 'Meeting Notes.md',
    type: 'markdown',
    size: 5120, // 5KB
    uploadDate: subHours(new Date(), 2),
    tags: ['notes', 'internal'],
    summary: 'Notes from weekly team sync-up meeting',
    metadata: {
      author: 'Bob Wilson',
      createdAt: subHours(new Date(), 3),
    },
  },
];

// Test data for Email
export const testEmails = [
  {
    id: '1',
    subject: 'Project Update',
    from: 'john@example.com',
    to: ['team@company.com'],
    body: 'Here are the latest updates on the Tech Corp project...',
    date: subHours(new Date(), 1),
    read: false,
    attachments: ['Project-Update.pdf'],
    tags: ['project', 'important'],
  },
  {
    id: '2',
    subject: 'Meeting Invitation',
    from: 'alice@example.com',
    to: ['bob@example.com', 'john@example.com'],
    body: 'Please join us for the quarterly review meeting...',
    date: subDays(new Date(), 1),
    read: true,
    attachments: [],
    tags: ['meeting'],
  },
  {
    id: '3',
    subject: 'Contract Review',
    from: 'legal@company.com',
    to: ['alice@example.com'],
    body: 'Please review the attached contract draft...',
    date: subHours(new Date(), 4),
    read: false,
    attachments: ['Contract-Draft-v2.docx'],
    tags: ['legal', 'urgent'],
  },
];

// Analytics test data
export const testAnalytics = {
  emailMetrics: {
    totalEmails: 150,
    unreadEmails: 23,
    responseRate: 85,
    averageResponseTime: 2.5, // hours
  },
  taskMetrics: {
    totalTasks: 45,
    completedTasks: 32,
    overdueTasks: 5,
    upcomingTasks: 8,
  },
  calendarMetrics: {
    totalMeetings: 12,
    totalMeetingHours: 18,
    upcomingMeetings: 5,
    conflictingMeetings: 0,
  },
  productivityScore: 82,
}; 