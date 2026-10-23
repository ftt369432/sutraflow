/**
 * Email Types
 * 
 * This file defines the types related to email functionality in the application.
 */

export type EmailCategory = 'inbox' | 'sent' | 'archive' | 'trash' | 'follow-up' | 'important' | 'work' | 'personal';

export interface EmailCategoryRule {
  id: string;
  name: string;
  conditions: {
    field: 'from' | 'subject' | 'content';
    operator: 'contains' | 'equals' | 'startsWith' | 'endsWith';
    value: string;
  }[];
  category: EmailCategory;
  color?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category?: string;
  variables?: string[];
  lastUsed?: Date;
  usageCount?: number;
}

export interface EmailAnalytics {
  totalSent: number;
  totalReceived: number;
  responseRate: number;
  averageResponseTime: number;
  topSenders: {
    email: string;
    count: number;
  }[];
  topRecipients: {
    email: string;
    count: number;
  }[];
  busyHours: {
    hour: number;
    count: number;
  }[];
  emailsByDay: {
    date: string;
    sent: number;
    received: number;
  }[];
}

export interface Credentials {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  scopes?: string[];
}

export interface EmailAccount {
  id: string;
  email: string;
  name: string;
  provider: 'gmail' | 'outlook' | 'yahoo' | 'custom';
  isDefault?: boolean;
  credentials?: Credentials;
  settings?: EmailPreferences;
}

export interface EmailFolder {
  id: string;
  name: string;
  type: 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'starred' | 'important' | 'custom';
  unreadCount?: number;
  totalCount?: number;
  color?: string;
  nested?: boolean;
  parent?: string;
}

export interface EmailAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  content?: Blob;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  body: string;
  date: Date;
  labels: string[];
  read: boolean;
  starred: boolean;
  attachments?: EmailAttachment[];
  snippet?: string;
}

export interface EmailDraft {
  id: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  attachments?: EmailAttachment[];
  savedAt: Date;
  lastEditedAt: Date;
}

export interface EmailLabel {
  id: string;
  name: string;
  type: 'system' | 'user';
  color?: string;
  unreadCount?: number;
  totalCount?: number;
  nested?: boolean;
  parent?: string;
}

export interface EmailFilter {
  id: string;
  name: string;
  conditions: {
    field: 'from' | 'to' | 'subject' | 'body' | 'has-attachment';
    operator: 'contains' | 'equals' | 'not-contains' | 'not-equals' | 'exists';
    value: string;
  }[];
  actions: {
    type: 'move' | 'mark-read' | 'star' | 'label' | 'delete' | 'archive';
    value?: string;
  }[];
  isActive: boolean;
}

export interface EmailSignature {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
}

export interface EmailPreferences {
  signature?: EmailSignature;
  sendingName?: string;
  replyTo?: string;
  defaultFolder?: string;
  autoReply?: {
    enabled: boolean;
    message: string;
    startDate?: Date;
    endDate?: Date;
  };
  notifications?: {
    desktop: boolean;
    mobile: boolean;
    digests: boolean;
  };
}

export interface EmailAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: 'low' | 'medium' | 'high';
  category?: string;
  actionItems?: string[];
  summary?: string;
  keyPhrases?: string[];
  suggestedReply?: string;
}

// Email type alias for backward compatibility
export type Email = EmailMessage; 