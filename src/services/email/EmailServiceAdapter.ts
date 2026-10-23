/**
 * Email Service Adapter
 * 
 * This adapter bridges the gap between the legacy EmailService interface
 * and the new implementation. It implements the same interface as the
 * original EmailService class but forwards calls to our new singleton.
 */

import { 
  EmailAccount, 
  EmailFolder, 
  EmailLabel, 
  EmailQuery, 
  IMAPConfig,
  EmailMessage,
  EmailAnalysis
} from './types';

// Import emailService instance and its specific EmailResponse type, aliased
import emailService, { EmailResponse as EmailServiceApiEmailResponse } from './emailService';
import { getEnv } from '../../config/env';
import { supabase } from '../../lib/supabase';
import { supabaseEmailService } from './supabaseEmailService';
import { IMAPService } from './IMAPService';
import { v4 as uuidv4 } from 'uuid';

export class EmailService {
  private static instance: EmailService;
  
  private constructor() {}
  
  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }
  
  /**
   * Initialize the email service
   */
  async initialize(): Promise<void> {
    return emailService.initialize();
  }
  
  private getLocalAccounts(): EmailAccount[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('genieflow_connected_email_accounts');
      if (!stored) return [];
      const list = JSON.parse(stored);
      return list.map((acc: any) => ({
        id: acc.id,
        email: acc.email,
        name: acc.name || acc.email,
        provider: acc.provider === 'google' ? 'gmail' : (acc.provider || 'imap'),
        connected: true,
        lastSynced: acc.lastSynced ? new Date(acc.lastSynced) : new Date(),
        imapConfig: acc.imapHost ? {
          host: acc.imapHost,
          port: Number(acc.imapPort) || 993,
          useSSL: acc.useSSL !== false
        } : undefined,
        smtpConfig: acc.smtpHost ? {
          host: acc.smtpHost,
          port: Number(acc.smtpPort) || 587,
          useSSL: acc.useSSL !== false
        } : undefined,
        credentials: {
          password: acc.password
        }
      }));
    } catch (e) {
      console.warn('EmailServiceAdapter: Failed to load local accounts:', e);
      return [];
    }
  }

  // Account methods
  async getAccounts(): Promise<EmailAccount[]> {
    const { useMock } = getEnv();
    
    if (useMock) {
      return emailService.getAccounts();
    }

    const localAccounts = this.getLocalAccounts();
    let dbAccounts: EmailAccount[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const rawDbAccounts = await supabaseEmailService.getEmailAccounts(user.id);
        
        // If no accounts found but user is authenticated, try to auto-link
        if (rawDbAccounts.length === 0 && user.email) {
          console.log('EmailServiceAdapter: No email accounts found. Auto-linking Google account...');
          try {
            await this.autoLinkGoogleAccount(user);
            const updatedDbAccounts = await supabaseEmailService.getEmailAccounts(user.id);
            dbAccounts = this.mapDbAccountsToEmailAccounts(updatedDbAccounts);
          } catch (linkError) {
            console.error('EmailServiceAdapter: Failed to auto-link account:', linkError);
          }
        } else {
          dbAccounts = this.mapDbAccountsToEmailAccounts(rawDbAccounts);
        }
      }
    } catch (error) {
      console.warn('EmailServiceAdapter: Supabase account fetch skipped/failed:', error);
    }

    // Merge accounts, avoiding duplicate email addresses
    const emailMap = new Map<string, EmailAccount>();
    // First load local accounts
    localAccounts.forEach(acc => emailMap.set(acc.email.toLowerCase(), acc));
    // Overlay database accounts
    dbAccounts.forEach(acc => {
      const existing = emailMap.get(acc.email.toLowerCase());
      if (existing) {
        emailMap.set(acc.email.toLowerCase(), {
          ...acc,
          credentials: existing.credentials?.password ? existing.credentials : acc.credentials,
          imapConfig: existing.imapConfig || acc.imapConfig,
          smtpConfig: existing.smtpConfig || acc.smtpConfig
        });
      } else {
        emailMap.set(acc.email.toLowerCase(), acc);
      }
    });

    const accounts = Array.from(emailMap.values());
    if (accounts.length === 0) {
      return [
        {
          id: 'sovereign-mailbox-demo',
          provider: 'gmail',
          email: 'operator@sutraflow.local',
          name: 'SutraFlow Sovereign Mailbox',
          connected: true,
          lastSynced: new Date(),
        }
      ];
    }
    return accounts;
  }

  private mapDbAccountsToEmailAccounts(dbAccounts: any[]): EmailAccount[] {
    return dbAccounts.map(acc => ({
      id: acc.id,
      email: acc.email,
      name: acc.name || acc.email,
      provider: acc.provider === 'google' ? 'gmail' : acc.provider,
      connected: true,
      lastSynced: acc.updatedAt || new Date(),
      imapConfig: acc.imapHost ? {
        host: acc.imapHost,
        port: acc.imapPort || 993,
        useSSL: acc.useSSL !== false
      } : undefined,
      smtpConfig: acc.smtpHost ? {
        host: acc.smtpHost,
        port: acc.smtpPort || 587,
        useSSL: acc.useSSL !== false
      } : undefined,
      credentials: {
        password: acc.password
      }
    }));
  }

  private async getIMAPClient(accountId: string): Promise<IMAPService> {
    // 1. Check local accounts first
    const localAccounts = this.getLocalAccounts();
    const localMatch = localAccounts.find(a => a.id === accountId || a.email.toLowerCase() === accountId.toLowerCase());
    if (localMatch && localMatch.imapConfig && localMatch.credentials?.password) {
      const config: IMAPConfig = {
        email: localMatch.email,
        password: localMatch.credentials.password,
        imapHost: localMatch.imapConfig.host,
        imapPort: localMatch.imapConfig.port,
        smtpHost: localMatch.smtpConfig?.host || '',
        smtpPort: localMatch.smtpConfig?.port || 587,
        useSSL: localMatch.imapConfig.useSSL
      };
      return new IMAPService(localMatch.id, config);
    }

    // 2. Check Supabase accounts if authenticated
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const accounts = await supabaseEmailService.getEmailAccounts(user.id);
        const acc = accounts.find(a => a.id === accountId || a.email.toLowerCase() === accountId.toLowerCase());
        if (acc && acc.provider === 'imap') {
          const config: IMAPConfig = {
            email: acc.email,
            password: acc.password || '',
            imapHost: acc.imapHost || '',
            imapPort: acc.imapPort || 993,
            smtpHost: acc.smtpHost || '',
            smtpPort: acc.smtpPort || 587,
            useSSL: acc.useSSL !== false
          };
          return new IMAPService(accountId, config);
        }
      }
    } catch (e) {
      console.warn('EmailServiceAdapter: Supabase getIMAPClient error:', e);
    }

    if (localMatch) {
      throw new Error(`Account ${localMatch.email} is missing stored password. Please reconnect.`);
    }

    throw new Error(`Account ${accountId} not found or not an IMAP account`);
  }
  
  private async autoLinkGoogleAccount(user: any): Promise<void> {
    console.log('EmailServiceAdapter: Auto-linking Google account for user:', user.id);
    
    // Insert into email_accounts table
    await supabaseEmailService.saveEmailAccount({
      userId: user.id,
      name: user.user_metadata?.full_name || user.email,
      email: user.email,
      provider: 'google',
      accessToken: user.user_metadata?.provider_token || undefined,
      refreshToken: user.user_metadata?.provider_refresh_token || undefined,
    });
    
    console.log('EmailServiceAdapter: Successfully auto-linked Google account');
  }
  
  async addGoogleAccount(_code?: string): Promise<EmailAccount> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      throw new Error('User not authenticated');
    }
    
    await this.autoLinkGoogleAccount(user);
    const accounts = await this.getAccounts();
    const found = accounts.find(acc => acc.provider === 'gmail' && acc.email === user.email);
    if (found) return found;
    
    throw new Error('Failed to add Google account');
  }
  
  async addIMAPAccount(config: IMAPConfig): Promise<EmailAccount> {
    console.log('EmailServiceAdapter: Adding IMAP account:', config.email);

    // 1. Test IMAP connection through backend
    const imapService = new IMAPService();
    await imapService.connect(config);

    const accountId = uuidv4();
    const emailAccount: EmailAccount = {
      id: accountId,
      provider: 'imap',
      email: config.email,
      name: config.email,
      connected: true,
      lastSynced: new Date(),
      imapConfig: {
        host: config.imapHost,
        port: config.imapPort,
        useSSL: config.useSSL
      },
      smtpConfig: {
        host: config.smtpHost,
        port: config.smtpPort,
        useSSL: config.useSSL
      },
      credentials: {
        password: config.password
      }
    };

    // 2. Persist locally to localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('genieflow_connected_email_accounts');
        const list = stored ? JSON.parse(stored) : [];
        const filtered = list.filter((a: any) => a.email.toLowerCase() !== config.email.toLowerCase());
        filtered.push({
          id: accountId,
          email: config.email,
          name: config.email,
          provider: 'imap',
          connected: true,
          lastSynced: new Date(),
          imapHost: config.imapHost,
          imapPort: config.imapPort,
          smtpHost: config.smtpHost,
          smtpPort: config.smtpPort,
          useSSL: config.useSSL,
          password: config.password
        });
        localStorage.setItem('genieflow_connected_email_accounts', JSON.stringify(filtered));
      } catch (storageErr) {
        console.warn('localStorage save failed:', storageErr);
      }
    }

    // 3. Save to Supabase if authenticated
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabaseEmailService.saveEmailAccount({
          userId: user.id,
          name: config.email,
          email: config.email,
          provider: 'imap',
          password: config.password,
          imapHost: config.imapHost,
          imapPort: config.imapPort,
          smtpHost: config.smtpHost,
          smtpPort: config.smtpPort,
          useSSL: config.useSSL
        });
      }
    } catch (dbErr) {
      console.warn('Supabase save skipped/failed:', dbErr);
    }

    return emailAccount;
  }
  
  async removeAccount(accountId: string): Promise<void> {
    console.log(`EmailServiceAdapter: Removing account ${accountId}`);
    
    // 1. Remove from localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('genieflow_connected_email_accounts');
        if (stored) {
          const list = JSON.parse(stored);
          const filtered = list.filter((a: any) => a.id !== accountId && a.email.toLowerCase() !== accountId.toLowerCase());
          localStorage.setItem('genieflow_connected_email_accounts', JSON.stringify(filtered));
        }
      } catch (e) {
        console.warn('localStorage account removal failed:', e);
      }
    }

    // 2. Remove from Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabaseEmailService.deleteEmailAccount(accountId);
      }
    } catch (e) {
      console.warn('Supabase account deletion skipped/failed:', e);
    }
  }
  
  // Folder and label methods
  async getFolders(accountId: string): Promise<{ folders: EmailFolder[] }> {
    try {
      const imapClient = await this.getIMAPClient(accountId);
      const folders = await imapClient.getFolders();
      const mappedFolders: EmailFolder[] = folders.map(f => ({
        id: f.id,
        name: f.name,
        type: f.type || 'system',
        unreadCount: f.unreadCount || 0,
        totalCount: f.totalCount || 0
      }));
      return { folders: mappedFolders };
    } catch (error) {
      console.log('EmailServiceAdapter: Folder fetch fell back to Gmail/Mock:', error);
      return {
        folders: [
          { id: 'inbox', name: 'Inbox', gmailLabel: 'INBOX', unreadCount: 10, type: 'system', totalCount: 100 },
          { id: 'sent', name: 'Sent', gmailLabel: 'SENT', unreadCount: 0, type: 'system', totalCount: 50 },
          { id: 'drafts', name: 'Drafts', gmailLabel: 'DRAFT', unreadCount: 0, type: 'system', totalCount: 5 },
          { id: 'trash', name: 'Trash', gmailLabel: 'TRASH', unreadCount: 0, type: 'system', totalCount: 20 },
          { id: 'spam', name: 'Spam', gmailLabel: 'SPAM', unreadCount: 5, type: 'system', totalCount: 5 },
          { id: 'archive', name: 'Archive', gmailLabel: 'ALL_MAIL', unreadCount: 0, type: 'system', totalCount: 0 },
        ]
      };
    }
  }
  
  async getLabels(_accountId: string): Promise<{ labels: EmailLabel[] }> {
    return {
      labels: [
        { id: 'important', name: 'Important', type: 'user', color: { backgroundColor: 'red' } },
        { id: 'work', name: 'Work', type: 'user', color: { backgroundColor: 'blue' } },
        { id: 'personal', name: 'Personal', type: 'user', color: { backgroundColor: 'green' } }
      ]
    };
  }
  
  // Message methods
  async getMessages(accountId: string, query: EmailQuery = {}): Promise<EmailServiceApiEmailResponse> {
    console.log('📧 EmailServiceAdapter.getMessages called:', { accountId, query });
    
    try {
      const imapClient = await this.getIMAPClient(accountId);
      console.log('📧 Fetching messages via stateless IMAP connection');
      const response = await imapClient.getMessages({
        folder: query.folderId || 'INBOX',
        query: query.search,
        maxResults: query.pageSize || 25,
        pageToken: query.pageToken || undefined
      });
      return {
        messages: response.messages,
        nextPageToken: response.nextPageToken || null,
        resultSizeEstimate: response.messages.length
      };
    } catch (error) {
      console.log('EmailServiceAdapter: Message fetch falling back to Gmail/Mock:', error);
      
      try {
        const emailServiceQuery: any = {
          pageSize: query.pageSize || 25,
          pageToken: query.pageToken || undefined
        };

        if (query.folderId) {
          if (query.folderId === 'INBOX' || query.folderId === 'inbox') {
            emailServiceQuery.folderId = 'INBOX';
          } else if (query.folderId === 'SENT' || query.folderId === 'sent') {
            emailServiceQuery.folderId = 'SENT';
          } else if (query.folderId === 'DRAFT' || query.folderId === 'drafts') {
            emailServiceQuery.folderId = 'DRAFT';
          } else if (query.folderId === 'TRASH' || query.folderId === 'trash') {
            emailServiceQuery.folderId = 'TRASH';
          } else if (query.folderId === 'SPAM' || query.folderId === 'spam') {
            emailServiceQuery.folderId = 'SPAM';
          } else if (query.folderId === 'ALL_MAIL' || query.folderId === 'archive') {
            emailServiceQuery.search = '';
          } else {
            emailServiceQuery.folderId = query.folderId.toUpperCase();
          }
        } else {
          emailServiceQuery.folderId = 'INBOX';
        }
        
        if (query.search) {
          emailServiceQuery.search = query.search;
        }
        
        const response = await emailService.getEmails(emailServiceQuery);
        return response;
      } catch (innerError) {
        console.error(`❌ Error getting fallback messages for account ${accountId}:`, innerError);
        return { messages: [], nextPageToken: null, resultSizeEstimate: 0 };
      }
    }
  }
  
  async getMessage(accountId: string, messageId: string): Promise<{ message: EmailMessage | null }> {
    try {
      // 1. Check if account is IMAP and retrieve directly
      try {
        const imapClient = await this.getIMAPClient(accountId);
        if (imapClient) {
          const msg = await imapClient.getMessage(messageId);
          if (msg) return { message: msg };
        }
      } catch {
        // Not an IMAP account or IMAP direct fetch failed, continue to fallback
      }

      // 2. Fall back to Google service if signed in
      if (emailService.isInitialized() && await emailService.isSignedIn()) {
        const message = await emailService.getEmail(messageId);
        return { message };
      }

      return { message: null };
    } catch (error) {
      console.warn(`[EmailServiceAdapter] getMessage failed for ${messageId}:`, error);
      return { message: null };
    }
  }
  
  async analyzeEmail(accountId: string, messageId: string): Promise<EmailAnalysis | null> {
    // console.log(`[EmailServiceAdapter] analyzeEmail called for account ${accountId}, message ${messageId}`);
    try {
      const { message } = await this.getMessage(accountId, messageId); // accountId is passed here
      if (!message) {
        console.error(`[EmailServiceAdapter] analyzeEmail: Message ${messageId} not found for account ${accountId}.`);
        return null;
      }
      return await emailService.analyzeEmail(message);
    } catch (error) {
      console.error(`[EmailServiceAdapter] Error in analyzeEmail for message ${messageId} on account ${accountId}:`, error);
      return null;
    }
  }
  
  // Message actions
  async markAsRead(accountId: string, messageId: string): Promise<void> {
    console.log(`📧 Marking message ${messageId} as read in account ${accountId}`);
    await emailService.markAsRead(messageId);
  }
  
  async markAsUnread(accountId: string, messageId: string): Promise<void> {
    console.log(`📧 Marking message ${messageId} as unread in account ${accountId}`);
    await emailService.markAsUnread(messageId);
  }
  
  async moveToFolder(accountId: string, messageId: string, folderId: string): Promise<void> {
    console.log(`📧 Moving message ${messageId} to folder ${folderId} in account ${accountId}`);
    // This is a simplified move for Gmail: add new label, remove INBOX if present.
    // A more robust solution would need to know the current labels of the message.
    await emailService.modifyMessageLabels(messageId, [folderId], ['INBOX']); 
  }
  
  async applyLabel(accountId: string, messageId: string, labelId: string): Promise<void> {
    console.log(`📧 Applying label ${labelId} to message ${messageId} in account ${accountId}`);
    await emailService.modifyMessageLabels(messageId, [labelId], []);
  }
  
  async removeLabel(accountId: string, messageId: string, labelId: string): Promise<void> {
    console.log(`📧 Removing label ${labelId} from message ${messageId} in account ${accountId}`);
    await emailService.modifyMessageLabels(messageId, [], [labelId]);
  }
  
  async deleteMessage(accountId: string, messageId: string): Promise<void> {
    console.log(`📧 Deleting message ${messageId} in account ${accountId}`);
    await emailService.deleteMessage(messageId);
  }

  /**
   * Delete multiple messages in bulk
   */
  async deleteMessages(messageIds: string[]): Promise<{ success: string[], failed: string[] }> {
    console.log(`Bulk deleting ${messageIds.length} messages`);
    return await emailService.deleteMessages(messageIds);
  }
  
  async archiveMessage(messageId: string): Promise<void> {
    // console.log(`Archiving message ${messageId}`);
    await emailService.archiveMessage(messageId);
  }
  
  async sendMessage(accountId: string, message: Partial<EmailMessage>): Promise<void> {
    console.log(`📧 [EmailServiceAdapter] sendMessage called for account ${accountId}:`, JSON.stringify(message));

    const toRecipients = message.to;
    const subject = message.subject;
    const body = message.body;

    let primaryTo: string;
    let toArray: string[] = [];
    if (Array.isArray(toRecipients)) {
      primaryTo = toRecipients.join(', '); 
      toArray = toRecipients;
    } else if (typeof toRecipients === 'string') {
      primaryTo = toRecipients;
      toArray = toRecipients.split(',').map(s => s.trim());
    } else {
      console.error('[EmailServiceAdapter] To field is missing or invalid in message object.');
      throw new Error("Recipient (To) field is required to send an email.");
    }

    if (typeof subject !== 'string' || subject.trim() === '') {
      console.error('[EmailServiceAdapter] Subject field is missing or empty in message object.');
      throw new Error('Subject field is required to send an email.');
    }

    if (typeof body !== 'string') { // Body can be empty, but must be a string
      console.error('[EmailServiceAdapter] Body field is missing or not a string in message object.');
      throw new Error('Body field is required and must be a string to send an email.');
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const dbAccounts = await supabaseEmailService.getEmailAccounts(user.id);
        const acc = dbAccounts.find(a => a.id === accountId);
        if (acc && acc.provider === 'imap') {
          const config: IMAPConfig = {
            email: acc.email,
            password: acc.password || '',
            imapHost: acc.imapHost || '',
            imapPort: acc.imapPort || 993,
            smtpHost: acc.smtpHost || '',
            smtpPort: acc.smtpPort || 587,
            useSSL: acc.useSSL !== false
          };
          const imapClient = new IMAPService(accountId, config);
          await imapClient.sendMessage({
            to: toArray,
            cc: message.cc,
            bcc: message.bcc,
            subject,
            body
          });
          console.log(`✅ [EmailServiceAdapter] Email to ${primaryTo} sent successfully via IMAP/SMTP.`);
          return;
        }
      }
    } catch (dbError) {
      console.error('[EmailServiceAdapter] DB lookup or IMAP send failed, trying fallback:', dbError);
    }

    try {
      await emailService.sendEmail(primaryTo, subject, body);
      console.log(`✅ [EmailServiceAdapter] Email to ${primaryTo} sent successfully via emailService.`);
    } catch (error) {
      console.error(`❌ [EmailServiceAdapter] Error calling emailService.sendEmail:`, error);
      throw error;
    }
  }
  
  async saveDraft(_accountId: string, draft: Partial<EmailMessage>): Promise<{ message: EmailMessage }> {
    // console.log(`Saving draft in account ${accountId}:`, draft);
    
    // Return a mock message
    return {
      message: {
        id: `draft-${Date.now()}`,
        threadId: `thread-${Date.now()}`,
        subject: draft.subject || '(No Subject)',
        from: 'user@example.com',
        to: draft.to || '',
        date: new Date().toISOString(),
        body: draft.body || '',
        snippet: draft.snippet || '',
        labels: ['DRAFT'],
        attachments: undefined,
        read: true,
        starred: false,
        important: false
      }
    };
  }
  
  async createFolder(accountId: string, folderName: string): Promise<{ id: string; name: string }> {
    try {
      const response = await emailService.createLabel(folderName);
      
      // Refresh folders after creation to ensure they appear in the UI
      setTimeout(() => {
        console.log('🔄 Refreshing email context after folder creation');
        // Trigger a folder refresh - this will be handled by the EmailContext
        window.dispatchEvent(new CustomEvent('refresh-email-folders'));
      }, 1000);
      
      return {
        id: response.id,
        name: response.name
      };
    } catch (error) {
      console.error('Error creating folder:', error);
      
      // Handle 409 Conflict (folder already exists)
      if (error instanceof Error && error.message.includes('409')) {
        console.log(`📁 Folder "${folderName}" already exists, fetching existing folder`);
        
        try {
          // Try to find the existing folder
          const labels = await emailService.getLabels();
          const existingLabel = labels.find(label => 
            label.name === folderName || 
            label.name.toLowerCase() === folderName.toLowerCase()
          );
          
          if (existingLabel) {
            console.log(`✅ Found existing folder: ${existingLabel.name}`);
            
            // Still trigger refresh to ensure UI updates
            setTimeout(() => {
              console.log('🔄 Refreshing email context after finding existing folder');
              window.dispatchEvent(new CustomEvent('refresh-email-folders'));
            }, 1000);
            
            return {
              id: existingLabel.id,
              name: existingLabel.name
            };
          }
        } catch (fetchError) {
          console.error('Error fetching existing labels:', fetchError);
        }
        
        throw new Error(`Folder "${folderName}" already exists but could not be retrieved`);
      }
      
      throw new Error(`Failed to create folder "${folderName}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async refreshAccount(_accountId: string): Promise<void> {
    // console.log(`Refreshing account ${accountId}`);
  }
}

// Export singleton instance
const emailServiceAdapter = EmailService.getInstance();
export default emailServiceAdapter;