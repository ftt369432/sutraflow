import { EmailAccount, EmailFolder, EmailLabel, EmailMessage } from './types';
import { v4 as uuidv4 } from 'uuid';

// Mock email accounts
export const mockAccounts: EmailAccount[] = [
  {
    id: 'account1',
    email: 'demo@example.com',
    name: 'Demo User',
    provider: 'gmail',
    connected: true,
    lastSynced: new Date(),
    createdAt: new Date().toISOString()
  }
];

// Mock folders
export const mockFolders: EmailFolder[] = [
  {
    id: 'inbox',
    name: 'Inbox',
    type: 'system',
    unreadCount: 3,
    totalCount: 10
  },
  {
    id: 'sent',
    name: 'Sent',
    type: 'system',
    unreadCount: 0,
    totalCount: 5
  },
  {
    id: 'drafts',
    name: 'Drafts',
    type: 'system',
    unreadCount: 0,
    totalCount: 2
  },
  {
    id: 'trash',
    name: 'Trash',
    type: 'system',
    unreadCount: 0,
    totalCount: 3
  },
  {
    id: 'work',
    name: 'Work',
    type: 'user',
    unreadCount: 1,
    totalCount: 15
  },
  {
    id: 'personal',
    name: 'Personal',
    type: 'user',
    unreadCount: 2,
    totalCount: 8
  }
];

// Mock labels (for Gmail)
export const mockLabels: EmailLabel[] = [
  {
    id: 'important',
    name: 'Important',
    type: 'system',
    color: { backgroundColor: '#FF0000' }
  },
  {
    id: 'work',
    name: 'Work',
    type: 'user',
    color: { backgroundColor: '#4285F4' }
  },
  {
    id: 'personal',
    name: 'Personal',
    type: 'user',
    color: { backgroundColor: '#34A853' }
  },
  {
    id: 'bills',
    name: 'Bills',
    type: 'user',
    color: { backgroundColor: '#FBBC05' }
  }
];

// Generate mock emails
export const mockEmails: EmailMessage[] = [
  // Inbox emails
  {
    id: uuidv4(),
    threadId: 'thread1',
    from: 'John Smith <john.smith@example.com>',
    to: ['demo@example.com'],
    cc: [],
    bcc: [],
    subject: 'Project Status Update',
    body: '<p>Hi there,</p><p>Just wanted to provide a quick update on the project. We\'re on track to meet our deadline next week.</p><p>Can we schedule a call tomorrow to discuss the final details?</p><p>Best regards,<br>John</p>',
    date: new Date(Date.now() - 3600000).toISOString(),
    read: false,
    labels: ['work', 'important'],
    attachments: []
  },
  {
    id: uuidv4(),
    threadId: 'thread2',
    from: 'Sarah Johnson <sarah@example.com>',
    to: ['demo@example.com'],
    cc: [],
    bcc: [],
    subject: 'Lunch next week?',
    body: '<p>Hey!</p><p>It\'s been a while since we caught up. Are you free for lunch next week? Maybe Tuesday or Wednesday?</p><p>Let me know what works for you.</p><p>Cheers,<br>Sarah</p>',
    date: new Date(Date.now() - 7200000).toISOString(),
    read: false,
    labels: ['personal'],
    attachments: []
  },
  {
    id: uuidv4(),
    threadId: 'thread3',
    from: 'Amazon <no-reply@amazon.com>',
    to: ['demo@example.com'],
    cc: [],
    bcc: [],
    subject: 'Your Amazon order has shipped',
    body: '<p>Hello,</p><p>Your recent Amazon order #12345 has shipped and is on its way to you!</p><p>Expected delivery date: Thursday, May 12</p><p>Track your package: <a href="#">Click here</a></p>',
    date: new Date(Date.now() - 10800000).toISOString(),
    read: true,
    labels: [],
    attachments: []
  },
  
  // Sent emails
  {
    id: uuidv4(),
    threadId: 'thread4',
    from: 'demo@example.com',
    to: ['client@example.com'],
    cc: ['manager@example.com'],
    bcc: [],
    subject: 'Proposal for Project X',
    body: '<p>Dear Client,</p><p>Please find attached our proposal for Project X as discussed in our meeting last week.</p><p>I\'m available to discuss any questions you might have.</p><p>Best regards,<br>Demo User</p>',
    date: new Date(Date.now() - 86400000).toISOString(),
    read: true,
    labels: ['work'],
    attachments: [
      {
        id: uuidv4(),
        filename: 'proposal.pdf',
        contentType: 'application/pdf',
        size: 2500000,
        url: '#'
      }
    ]
  },
  
  // Draft emails
  {
    id: uuidv4(),
    threadId: 'thread5',
    from: 'demo@example.com',
    to: ['team@example.com'],
    cc: [],
    bcc: [],
    subject: 'Weekly Team Update',
    body: '<p>Hi team,</p><p>Here\'s our weekly update:</p><p>- Project A: 80% complete</p><p>- Project B: Starting next week</p><p>- Project C: On hold</p><p>Let me know if you have any questions.</p>',
    date: new Date(Date.now() - 43200000).toISOString(),
    read: true,
    labels: ['work'],
    attachments: []
  }
]; 