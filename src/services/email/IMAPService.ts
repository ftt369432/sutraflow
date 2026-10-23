import type { IMAPConfig, EmailMessage, EmailFolder } from './types';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || ''}/api/email`;

export class IMAPService {
  private config: IMAPConfig | null = null;
  private accountId: string | null = null;

  constructor(accountId?: string | null, config?: IMAPConfig | null) {
    if (accountId) this.accountId = accountId;
    if (config) this.config = config;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.config) {
      // Safe unicode base64 encoding
      const jsonStr = JSON.stringify(this.config);
      const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
      headers['x-imap-config'] = encoded;
    }
    return headers;
  }

  async connect(config: IMAPConfig): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      let errorMsg = 'Failed to connect to email server';
      try {
        const errorData = await response.json();
        if (errorData?.error) errorMsg = errorData.error;
      } catch (_) {}
      throw new Error(errorMsg);
    }

    const { accountId } = await response.json();
    this.config = config;
    this.accountId = accountId;
  }

  async disconnect(): Promise<void> {
    this.config = null;
    this.accountId = null;
  }

  async getFolders(): Promise<EmailFolder[]> {
    if (!this.accountId) {
      throw new Error('Not connected to email server');
    }

    const response = await fetch(`${API_BASE_URL}/${this.accountId}/folders`, {
      headers: this.getHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to fetch folders');
    }

    const data = await response.json();
    return data.folders || [];
  }

  async getMessages(options: {
    folder?: string;
    query?: string;
    pageToken?: string;
    maxResults?: number;
  } = {}): Promise<{
    messages: EmailMessage[];
    nextPageToken?: string;
  }> {
    if (!this.accountId) {
      throw new Error('Not connected to email server');
    }

    const params = new URLSearchParams({
      folderId: options.folder || 'INBOX',
      limit: (options.maxResults || 20).toString(),
      ...(options.query && { query: options.query }),
      ...(options.pageToken && { pageToken: options.pageToken }),
    });

    const response = await fetch(`${API_BASE_URL}/${this.accountId}/messages?${params}`, {
      headers: this.getHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    return response.json();
  }

  async getMessage(messageId: string): Promise<EmailMessage | null> {
    if (!this.accountId) {
      throw new Error('Not connected to email server');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${this.accountId}/messages/${encodeURIComponent(messageId)}`, {
        headers: this.getHeaders()
      });
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data.message || data || null;
    } catch {
      return null;
    }
  }

  async sendMessage(message: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    attachments?: Array<{
      filename: string;
      content: any;
      contentType: string;
    }>;
  }): Promise<void> {
    if (!this.accountId || !this.config) {
      throw new Error('Not connected to email server');
    }

    const response = await fetch(`${API_BASE_URL}/${this.accountId}/send`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        ...message,
        from: this.config.email,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }
  }
} 