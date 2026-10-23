import { v4 as uuidv4 } from 'uuid';
import type { EmailMessage as Email } from './types';

// Initial demo data
const demoEmails: Email[] = [
  {
    id: uuidv4(),
    threadId: uuidv4(),
    subject: 'Welcome to GenieflowAI',
    from: 'support@genieflow.ai',
    to: ['user@example.com'],
    body: 'Thank you for trying GenieflowAI. Get started by exploring our features...',
    date: new Date().toISOString(),
    read: false,
  },
  {
    id: uuidv4(),
    threadId: uuidv4(),
    subject: 'Project Update: Q4 Goals',
    from: 'manager@company.com',
    to: ['user@example.com'],
    body: 'Here are our key objectives for Q4...',
    date: new Date(Date.now() - 86400000).toISOString(),
    read: true,
  },
  {
    id: uuidv4(),
    threadId: uuidv4(),
    subject: 'Meeting Notes: Product Review',
    from: 'team@company.com',
    to: ['user@example.com'],
    body: 'Summary of today\'s product review meeting...',
    date: new Date(Date.now() - 172800000).toISOString(),
    read: false,
  }
];

let emails: Email[] = [...demoEmails];

export async function fetchEmails(): Promise<Email[]> {
  return emails;
}

export async function sendEmail(email: Partial<Email>): Promise<boolean> {
  const newEmail: Email = {
    id: uuidv4(),
    threadId: email.threadId || uuidv4(),
    subject: email.subject || '',
    from: 'user@example.com',
    to: email.to || [],
    body: email.body || '',
    date: new Date().toISOString(),
    read: true,
  };

  emails = [newEmail, ...emails];
  return true;
}

export async function markEmailAsRead(emailId: string): Promise<void> {
  emails = emails.map(email =>
    email.id === emailId ? { ...email, read: true } : email
  );
}

export async function archiveEmail(_emailId: string): Promise<void> {
  console.warn('archiveEmail needs to be adapted to use labels instead of categories.');
}

export async function deleteEmail(_emailId: string): Promise<void> {
  console.warn('deleteEmail needs to be adapted to use labels/folders instead of categories.');
}

export async function moveEmail(_emailId: string, _category: string): Promise<void> {
  console.warn('moveEmail needs to be adapted to use labels/folders instead of categories.');
}

export async function getEmailsByCategory(_category: string): Promise<Email[]> {
  console.warn('getEmailsByCategory needs to be adapted to use labels/folders instead of categories.');
  return [];
}