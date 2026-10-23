/**
 * Email Service
 * 
 * Handles fetching and processing of emails from Gmail API
 */

import { getEnv } from '../../config/env';
import { GoogleAPIClient } from '../google/GoogleAPIClient';
import googleAuthService from '../auth/googleAuth';
import { EmailAccount, EmailMessage, EmailQuery, EmailAnalysis } from './types';
import { supabase } from '@/lib/supabase';
import { AIServiceFactory } from '../ai/aiServiceFactory';
import { AIService } from '../ai/baseAIService';
import { aiCalendarService } from '../calendar/AiCalendarService';
import { useCalendarStore } from '../../store/calendarStore';
import { GmailMessage, GmailListResponse, GoogleAPIResponse } from '../google/types';

// Email fetch options
export interface EmailOptions {
  maxResults?: number;
  labelIds?: string[];
  q?: string;
  pageToken?: string;
}

// Email service response
export interface EmailResponse {
  messages: EmailMessage[];
  nextPageToken?: string | null;
  resultSizeEstimate: number;
}

export class EmailService {
  private static instance: EmailService;
  private googleClient: any = null;
  private maxResults = 20;
  private initialized = false;
  private aiService: AIService;
  private loggedPayloadWarning = false; // Track if we've already logged the payload warning
  private isGeminiOnlyMode = false; // Enable live Google services

  private constructor() {
    // Enable live Google services
    this.googleClient = GoogleAPIClient.getInstance();
    this.aiService = AIServiceFactory.getInstance();
    console.log('EmailService: Initialized with live Google services');
  }

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
    if (this.initialized) return;

    const { useMock } = getEnv();

    // Initialize Google client for live services
    if (!useMock) {
      console.log('EmailService: Initializing Google client for live services');
      await this.googleClient.initialize();
    }

    this.initialized = true;
    console.log('EmailService: Initialized successfully with live Google services');
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Check if user is signed in
   */
  async isSignedIn(): Promise<boolean> {
    return await googleAuthService.isSignedIn();
  }

  private messageCache = new Map<string, {
    data: GmailMessage | GmailListResponse | EmailMessage;
    timestamp: number;
  }>();

  private pendingRequests = new Map<string, Promise<any>>();

  private async dedupRequest<T>(key: string, makeRequest: () => Promise<GoogleAPIResponse<T>>, cacheDuration = 5 * 60 * 1000): Promise<T> {
    // Check cache first
    const cached = this.messageCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < cacheDuration) {
      return cached.data as T;
    }

    // Check if request is already pending
    let pending = this.pendingRequests.get(key);
    if (pending) {
      return pending;
    }

    // Make new request
    pending = makeRequest().then(result => {
      // Cache the result
      this.messageCache.set(key, {
        data: result.data as any, // Use 'any' to avoid type issues with the union
        timestamp: Date.now()
      });
      // Clear pending request
      this.pendingRequests.delete(key);
      return result.data;
    });

    // Store pending request
    this.pendingRequests.set(key, pending);
    return pending;
  }

  async getMessageMetadata(messageId: string): Promise<GmailMessage> {
    // GEMINI-ONLY MODE or MOCK MODE: Return mock metadata
    const { useMock } = getEnv();
    if (this.isGeminiOnlyMode || useMock) {
      const mockEmail = this.getMockEmailDetails(messageId);
      // Convert EmailMessage back to GmailMessage format
      return {
        id: mockEmail.id,
        threadId: mockEmail.threadId || mockEmail.id,
        labelIds: ['INBOX'],
        snippet: mockEmail.snippet || mockEmail.body.substring(0, 100),
        payload: {
          headers: [
            { name: 'From', value: mockEmail.from },
            { name: 'To', value: mockEmail.to },
            { name: 'Subject', value: mockEmail.subject },
            { name: 'Date', value: mockEmail.date }
          ],
          body: { data: btoa(mockEmail.body) }
        }
      } as GmailMessage;
    }

    const cacheKey = `metadata:${messageId}`;
    const response: any = await this.dedupRequest(cacheKey, () =>
      this.googleClient.request({
        method: 'GET',
        url: `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
        params: { format: 'metadata' }
      })
    );
    // ✅ Handle both wrapped and unwrapped responses
    return response.data || response;
  }

  // Batch message fetching
  async getMessages(maxResults = 25, query?: string): Promise<EmailMessage[]> {
    console.log('🔍 emailService.getMessages called with:', { maxResults, query });

    // GEMINI-ONLY MODE or MOCK MODE: Return mock messages
    const { useMock } = getEnv();
    if (this.isGeminiOnlyMode || useMock) {
      console.log('📧 Using Gemini-only/Mock mode - returning mock messages');
      return this.getMockEmails().messages.slice(0, maxResults);
    }

    const cacheKey = `messages:${maxResults}:${query || 'inbox'}`;
    const response: any = await this.dedupRequest(cacheKey, () => {
      const params: any = {
        maxResults,
        q: query || 'in:inbox' // ✅ Use 'q' parameter with search query instead of labelIds
      };

      console.log('📧 Gmail API request params:', params);

      return this.googleClient.request({
        method: 'GET',
        url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages',
        params
      });
    });

    // ✅ Handle both wrapped and unwrapped responses
    const listResponse = response.data || response;

    console.log('📨 Gmail API response:', {
      messageCount: listResponse.messages?.length || 0,
      resultSizeEstimate: listResponse.resultSizeEstimate
    });

    // Batch metadata requests in groups of 5
    const messages = listResponse.messages || [];
    const batchedMessages = [];

    for (let i = 0; i < messages.length; i += 5) {
      const batch = messages.slice(i, i + 5);
      const metadataPromises = batch.map((msg: any) => this.getMessageMetadata(msg.id));
      const gmailMessages = await Promise.all(metadataPromises);

      // ✅ Map GmailMessage to EmailMessage
      const emailMessages = gmailMessages.map(gmailMsg => this.mapGmailMessageToEmailMessage(gmailMsg));
      batchedMessages.push(...emailMessages);
    }

    console.log('✅ emailService.getMessages returning:', batchedMessages.length, 'mapped EmailMessages');
    return batchedMessages;
  }

  /**
   * Get a single email by ID
   */
  async getEmail(id: string): Promise<EmailMessage | null> {
    // console.log('EmailService: getEmail called with ID:', id);

    // GEMINI-ONLY MODE or MOCK MODE: Always use mock data
    const { useMock } = getEnv();
    if (this.isGeminiOnlyMode || useMock) {
      return this.getMockEmailDetails(id);
    }

    // Legacy code (disabled in Gemini-only mode)
    // if (this.googleClient.isUsingMockData()) {
    //   return this.getMockEmailDetails(id);
    // }

    if (!this.initialized || !await this.isSignedIn()) {
      throw new Error('Service not initialized or user not signed in');
    }
    return this.getEmailDetails(id);
  }

  private async getBasicMessageInfo(messageId: string): Promise<EmailMessage | null> {
    // GEMINI-ONLY MODE: Return mock email details
    if (this.isGeminiOnlyMode) {
      return this.getMockEmailDetails(messageId);
    }

    // Check cache first
    const cached = this.messageCache.get(messageId);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minute cache
      return cached.data as EmailMessage;
    }

    try {
      const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata`;
      const response = await this.googleClient.request<GmailMessage>({
        url,
        method: 'GET'
      });

      // ✅ Handle both wrapped and unwrapped responses
      const gmailMessage = response.data;

      const message = this.mapGmailMessageToEmailMessage(gmailMessage);

      // Cache the result
      this.messageCache.set(messageId, {
        data: message,
        timestamp: Date.now()
      });

      return message;
    } catch (error) {
      console.error(`Failed to fetch message ${messageId}:`, error);
      return null;
    }
  }

  /**
   * Get full email details (for detail view only)
   */
  private async getEmailDetails(id: string): Promise<EmailMessage | null> {
    // console.log('EmailService: getEmailDetails called with ID:', id);
    try {
      const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`;
      const response = await this.googleClient.request<any>({
        url,
        method: 'GET'
      });

      // ✅ Handle both wrapped and unwrapped responses
      const message = response.data;

      if (!message || !message.payload) {
        console.error(`EmailService: No message payload for ID ${id}`);
        return null;
      }

      // Log the raw payload for debugging, especially for attachment issues
      // console.log(`EmailService: Raw message payload for ${id}:`, JSON.stringify(message.payload, null, 2));

      const headers = message.payload.headers || [];
      const subject = this.findHeader(headers, 'Subject') || '(No Subject)';
      const from = this.findHeader(headers, 'From') || '';
      const to = this.findHeader(headers, 'To') || '';
      const date = this.findHeader(headers, 'Date') || '';
      const labels = message.labelIds || [];
      let body = '';
      let bodyMimeType = 'text/plain'; // Default MIME type

      if (message.payload.parts) {
        const htmlPart = message.payload.parts.find((part: any) => part.mimeType === 'text/html');
        const textPart = message.payload.parts.find((part: any) => part.mimeType === 'text/plain');

        if (htmlPart?.body?.data) {
          body = this.decodeBase64(htmlPart.body.data);
          bodyMimeType = 'text/html';
        } else if (textPart?.body?.data) {
          body = this.decodeBase64(textPart.body.data);
          bodyMimeType = 'text/plain';
        }
      } else if (message.payload.body?.data) {
        // This case is usually for non-multipart messages or simple text emails
        body = this.decodeBase64(message.payload.body.data);
        bodyMimeType = message.payload.mimeType || 'text/plain';
      }

      const attachmentsList = this.extractAttachments(message.payload);

      // Always fetch HTML attachment content for legal emails (hearing notices, etc.)
      const isLegalEmail = subject.toLowerCase().includes('hearing') ||
        subject.toLowerCase().includes('wcab') ||
        subject.toLowerCase().includes('notice') ||
        subject.toLowerCase().includes('deposition') ||
        subject.toLowerCase().includes('court');

      // If body is empty OR if this is a legal email with HTML attachments, fetch attachment content
      if ((!body || isLegalEmail) && attachmentsList) {
        const htmlAttachments = attachmentsList.filter(att =>
          att.mimeType === 'text/html' && att.attachmentId
        );

        for (const htmlAttachment of htmlAttachments) {
          console.log(`📄 Fetching HTML attachment content for ${isLegalEmail ? 'legal' : 'empty body'} email ${id}: ${htmlAttachment.filename}`);
          try {
            // Fetch the attachment content
            const attachmentPath = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/attachments/${htmlAttachment.attachmentId}`;
            const attachmentResponse = await this.googleClient.request<{ data: string }>({
              url: attachmentPath,
              method: 'GET'
            });

            if (attachmentResponse && attachmentResponse.data) {
              const attachmentContent = this.decodeBase64(attachmentResponse.data.data);

              // If body was empty, use attachment content as body
              if (!body) {
                body = attachmentContent;
                bodyMimeType = 'text/html';
                console.log(`✅ Using HTML attachment as body for ${id}. Body length: ${body.length}`);
              } else {
                // For legal emails, append attachment content to body for comprehensive analysis
                body += `\n\n<!-- ATTACHMENT: ${htmlAttachment.filename} -->\n${attachmentContent}`;
                console.log(`✅ Appended HTML attachment content to body for legal email ${id}. Total body length: ${body.length}`);
              }
            } else {
              console.warn(`EmailService: Failed to fetch content for HTML attachment ${htmlAttachment.attachmentId} for email ${id}.`);
            }
          } catch (attFetchError) {
            console.error(`EmailService: Error fetching HTML attachment ${htmlAttachment.attachmentId} for email ${id}:`, attFetchError);
          }
        }
      }

      const emailMessage: EmailMessage = {
        id: message.id,
        threadId: message.threadId,
        subject,
        from,
        to,
        date,
        body,
        snippet: message.snippet || '',
        labels,
        attachments: attachmentsList,
        read: !labels.includes('UNREAD'),
        starred: labels.includes('STARRED'),
        important: labels.includes('IMPORTANT'),
        bodyMimeType
      };

      // REMOVED the immediate call to this.analyzeEmail(emailMessage) from here.
      // Analysis should be triggered by the caller of getEmailDetails if desired.

      return emailMessage;
    } catch (error) {
      console.error(`Failed to fetch email details for ${id}:`, error);
      return null;
    }
  }

  /**
   * Find a header in the headers array
   */
  private findHeader(headers: any[], name: string): string | null {
    const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return header ? header.value : null;
  }

  /**
   * Decode base64 encoded string
   */
  private decodeBase64(data: string): string {
    try {
      // MODIFIED: Use atob for browser environments
      // Replace URL-safe characters just in case, then decode
      const safeData = data.replace(/-/g, '+').replace(/_/g, '/');
      return decodeURIComponent(Array.from(atob(safeData)).map(char => '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2)).join(''));
    } catch (error) {
      console.error('Error decoding base64 string:', error, 'Input data:', data.substring(0, 100) + '...'); // Log part of the problematic data
      return '[Error: Could not decode email content]';
    }
  }

  /**
   * Modify message labels (add/remove)
   */
  async modifyMessageLabels(messageId: string, addLabelIds: string[] = [], removeLabelIds: string[] = []): Promise<void> {
    // GEMINI-ONLY MODE: Mock label modifications
    if (this.isGeminiOnlyMode) {
      console.log(`Mock: Modifying labels for ${messageId}, Add: ${addLabelIds.join(',')}, Remove: ${removeLabelIds.join(',')}`);
      return;
    }
    if (!this.initialized || !await this.isSignedIn()) {
      throw new Error('Service not initialized or user not signed in');
    }
    try {
      const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`;
      const data = {
        addLabelIds: addLabelIds,
        removeLabelIds: removeLabelIds,
      };
      await this.googleClient.request({
        url,
        method: 'POST',
        data
      });
      // console.log(`EmailService: Labels modified for message ${messageId}`);
    } catch (error) {
      console.error(`EmailService: Failed to modify labels for message ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Mark a message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    // console.log('EmailService: Marking message as read:', messageId);
    await this.modifyMessageLabels(messageId, [], ['UNREAD']);
  }

  /**
   * Mark a message as unread
   */
  async markAsUnread(messageId: string): Promise<void> {
    // console.log('EmailService: Marking message as unread:', messageId);
    await this.modifyMessageLabels(messageId, ['UNREAD'], []);
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    // GEMINI-ONLY MODE: Mock message deletion
    if (this.isGeminiOnlyMode) {
      console.log(`Mock: Deleting message ${messageId}`);
      return;
    }
    if (!this.initialized || !await this.isSignedIn()) {
      throw new Error('Service not initialized or user not signed in');
    }
    try {
      const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`; // Moves to trash
      // To permanently delete: `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}` with DELETE method
      await this.googleClient.request({
        url,
        method: 'POST'
      }); // Trashing is a POST
      // console.log(`EmailService: Message ${messageId} moved to trash`);
    } catch (error) {
      console.error(`EmailService: Failed to delete message ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Delete multiple messages in bulk (moves to trash)
   */
  async deleteMessages(messageIds: string[]): Promise<{ success: string[], failed: string[] }> {
    // GEMINI-ONLY MODE: Mock bulk message deletion
    if (this.isGeminiOnlyMode) {
      console.log(`Mock: Bulk deleting ${messageIds.length} messages`);
      return { success: messageIds, failed: [] };
    }
    if (!this.initialized || !await this.isSignedIn()) {
      throw new Error('Service not initialized or user not signed in');
    }

    const results = { success: [] as string[], failed: [] as string[] };
    const batchSize = 100; // Gmail API batch limit

    try {
      // Process in batches for better performance
      for (let i = 0; i < messageIds.length; i += batchSize) {
        const batch = messageIds.slice(i, i + batchSize);

        // Use Gmail's batch modify API for efficient bulk operations
        const url = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/batchModify';
        const requestBody = {
          ids: batch,
          addLabelIds: ['TRASH']
        };

        try {
          await this.googleClient.request({
            url,
            method: 'POST',
            data: requestBody,
            headers: {
              'Content-Type': 'application/json'
            }
          });
          results.success.push(...batch);
          console.log(`EmailService: Successfully moved ${batch.length} messages to trash`);
        } catch (error) {
          console.error(`EmailService: Failed to delete batch:`, error);
          results.failed.push(...batch);
        }
      }
    } catch (error) {
      console.error(`EmailService: Bulk delete failed:`, error);
      results.failed.push(...messageIds);
    }

    return results;
  }

  /**
   * Get all labels (folders) from Gmail
   */
  async getLabels(): Promise<{ id: string; name: string; type?: string }[]> {
    // GEMINI-ONLY MODE: Return mock labels
    if (this.isGeminiOnlyMode) {
      return [
        { id: 'INBOX', name: 'INBOX', type: 'system' },
        { id: 'SENT', name: 'SENT', type: 'system' },
        { id: 'ARCHIVE', name: 'ARCHIVE', type: 'system' },
        { id: 'TRASH', name: 'TRASH', type: 'system' }
      ];
    }

    if (!this.initialized || !await this.isSignedIn()) {
      throw new Error('Service not initialized or user not signed in');
    }

    try {
      const response = await this.googleClient.request<{
        labels: { id: string; name: string; type?: string }[]
      }>({
        url: 'https://gmail.googleapis.com/gmail/v1/users/me/labels',
        method: 'GET'
      });

      return response.data.labels || [];
    } catch (error) {
      console.error('EmailService: Failed to get labels:', error);
      throw error;
    }
  }

  /**
   * Create a label (folder) in Gmail
   */
  async createLabel(labelName: string): Promise<{ id: string; name: string }> {
    // GEMINI-ONLY MODE: Return mock label creation
    if (this.isGeminiOnlyMode) {
      return { id: `mock-label-${Date.now()}`, name: labelName };
    }

    if (!this.initialized || !await this.isSignedIn()) {
      throw new Error('Service not initialized or user not signed in');
    }

    try {
      console.log(`[EmailService] Creating label: ${labelName}`);

      // First check if label already exists
      try {
        const existingLabels = await this.getLabels();
        const existingLabel = existingLabels.find(label =>
          label.name === labelName ||
          label.name.toLowerCase() === labelName.toLowerCase()
        );

        if (existingLabel) {
          console.log(`[EmailService] Label "${labelName}" already exists, returning existing label`);
          return {
            id: existingLabel.id,
            name: existingLabel.name
          };
        }
      } catch (error) {
        console.warn('[EmailService] Error checking existing labels:', error);
        // Continue with creation if we can't check existing labels
      }

      const response = await this.googleClient.request<{
        id: string;
        name: string;
        messageListVisibility: string;
        labelListVisibility: string;
      }>({
        url: 'https://gmail.googleapis.com/gmail/v1/users/me/labels',
        method: 'POST',
        data: {
          name: labelName,
          messageListVisibility: 'show',
          labelListVisibility: 'labelShow'
        }
      });

      console.log(`[EmailService] Successfully created label: ${response.data.name}`);
      return {
        id: response.data.id,
        name: response.data.name
      };
    } catch (error) {
      console.error(`EmailService: Failed to create label ${labelName}:`, error);

      // Handle 409 Conflict specifically
      if (error instanceof Error && error.message.includes('409')) {
        console.log(`[EmailService] Label "${labelName}" already exists (409 conflict), attempting to retrieve it`);
        try {
          const labels = await this.getLabels();
          const existingLabel = labels.find(label =>
            label.name === labelName ||
            label.name.toLowerCase() === labelName.toLowerCase()
          );

          if (existingLabel) {
            return {
              id: existingLabel.id,
              name: existingLabel.name
            };
          }
        } catch (fetchError) {
          console.error('[EmailService] Error fetching existing labels after 409:', fetchError);
        }
      }

      throw error;
    }
  }

  /**
   * Archive a message (typically by removing INBOX label in Gmail)
   */
  async archiveMessage(messageId: string): Promise<void> {
    // console.log('EmailService: Archiving message:', messageId);
    await this.modifyMessageLabels(messageId, [], ['INBOX']);
  }

  /**
   * Get mock emails for development
   */
  private getMockEmails(options: EmailQuery = {}): EmailResponse {
    const { pageSize = this.maxResults, folderId, search, labelId } = options;
    const currentFolder = folderId || labelId || 'INBOX'; // Determine current folder for prefixing

    // Rich mock data for demo
    const mockMessages: EmailMessage[] = [
      {
        id: `mock_hearing_notice_${Date.now()}`,
        threadId: `thread_hearing_${Date.now()}`,
        subject: 'Notice of Hearing - Case ADJ1234567 - Smith vs. TechCorp',
        from: 'eams-notifications@dir.ca.gov',
        to: 'attorney@genieflow.ai',
        date: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
        body: `
          <html>
            <body>
              <h2>NOTICE OF HEARING</h2>
              <p>State of California<br>Department of Industrial Relations<br>Workers' Compensation Appeals Board</p>
              <p><strong>Case Number:</strong> ADJ1234567</p>
              <p><strong>Applicant:</strong> John Smith</p>
              <p><strong>Defendant:</strong> TechCorp, Adjusting Agency</p>
              
              <p>A Mandatory Settlement Conference (MSC) has been scheduled.</p>
              
              <ul>
                <li><strong>Date:</strong> ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}</li>
                <li><strong>Time:</strong> 08:30 AM</li>
                <li><strong>Location:</strong> Los Angeles District Office</li>
                <li><strong>Judge:</strong> Hon. Jane Doe</li>
              </ul>
              
              <p>Please review the attached Notice of Hearing for full details.</p>
            </body>
          </html>
        `,
        snippet: 'Notice of Hearing - Case ADJ1234567 - A Mandatory Settlement Conference has been scheduled.',
        labels: ['INBOX', 'UNREAD', 'IMPORTANT', 'COURT'],
        attachments: [{
          id: 'att_hearing_notice',
          filename: 'Notice_of_Hearing_ADJ1234567.pdf',
          contentType: 'application/pdf',
          size: 154000
        }],
        read: false,
        starred: true,
        important: true,
        bodyMimeType: 'text/html'
      },
      {
        id: `mock_settlement_offer_${Date.now()}`,
        threadId: `thread_settlement_${Date.now()}`,
        subject: 'Settlement Offer - Garcia Case',
        from: 'opposing.counsel@biglawfirm.com',
        to: 'attorney@genieflow.ai',
        date: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
        body: `
          Dear Counsel,
          
          Our client has authorized a settlement offer of $45,000 to resolve all issues in the Garcia matter (ADJ9876543).
          
          This offer includes:
          - $35,000 for PD (22%)
          - $10,000 for future medical buyout
          
          Please discuss with your client and let us know by next Friday.
          
          Best regards,
          Robert Opposing
        `,
        snippet: 'Our client has authorized a settlement offer of $45,000 to resolve all issues in the Garcia matter.',
        labels: ['INBOX', 'IMPORTANT', 'NEGOTIATION'],
        read: false,
        starred: false,
        important: true,
        bodyMimeType: 'text/plain'
      },
      {
        id: `mock_qme_report_${Date.now()}`,
        threadId: `thread_qme_${Date.now()}`,
        subject: 'QME Report Served - Dr. Expert - ADJ4567890',
        from: 'reports@medlegalservices.com',
        to: 'attorney@genieflow.ai',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        body: `
          Attached please find the PQME Report from Dr. Expert dated ${new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString()}.
          
          Summary of findings:
          - MMI status: Reached
          - WPI: 15% (Lumbar Spine)
          - Apportionment: 100% industrial
          - Future Medical: Supportive care recommmended
        `,
        snippet: 'Attached please find the PQME Report from Dr. Expert. Summary: MMI Reached, WPI 15%.',
        labels: ['INBOX', 'MEDICAL'],
        attachments: [{
          id: 'att_mme_report',
          filename: 'QME_Report_Dr_Expert.pdf',
          contentType: 'application/pdf',
          size: 2450000
        }],
        read: true,
        starred: false,
        important: false,
        bodyMimeType: 'text/plain'
      },
      {
        id: `mock_client_update_${Date.now()}`,
        threadId: `thread_client_${Date.now()}`,
        subject: 'Update on my treatment',
        from: 'maria.rodriguez@email.com',
        to: 'attorney@genieflow.ai',
        date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
        body: `
          Hi,
          
          I just wanted to let you know I saw Dr. Treat yesterday. He says I need an MRI for my shoulder because the pain is getting worse.
          
          Has the insurance approved it yet?
          
          Thanks,
          Maria
        `,
        snippet: 'I just wanted to let you know I saw Dr. Treat yesterday. He says I need an MRI.',
        labels: ['INBOX', 'CLIENT'],
        read: true,
        starred: false,
        important: false,
        bodyMimeType: 'text/plain'
      }
    ];

    // Filter by folder if needed (naive implementation for demo)
    const effectiveFolderId = options.folderId || options.labelId || 'INBOX';
    const filtered = effectiveFolderId === 'INBOX' ? mockMessages : [];

    return {
      messages: filtered.length > 0 ? filtered : mockMessages, // Fallback to return all if filter empty for demo
      nextPageToken: null,
      resultSizeEstimate: mockMessages.length
    };
  }

  /**
   * Get mock email details for development
   */
  private getMockEmailDetails(id: string): EmailMessage {
    const parts = id.split('_');
    const currentFolder = parts.length > 3 ? parts[1] : 'INBOX'; // Extract folder name, default to INBOX
    const i = parseInt(parts.length > 3 ? parts[2] : (parts[1] || '0')); // Extract index

    const mockAnalysis: EmailAnalysis = {
      messageId: id,
      priority: 'medium',
      category: 'work', // Changed from classification
      sentiment: 'neutral',
      actionItems: [
        { id: 'action1', text: 'Follow up on report' },
        { id: 'action2', text: 'Schedule follow-up call' }
      ],
      summary: `This is a mock summary for email ${id}. It mentions a meeting next Tuesday.`,
      keywords: ['mock', 'test', 'email'],
      isCourtDocument: i % 3 === 0,
      isReplyRequired: i % 4 === 0,
      suggestedReply: i % 2 === 0 ? 'Sounds good, let\'s proceed with the mock meeting.' : 'Thanks for the mock info.', // Changed from suggestedReplies array
      followUpDate: new Date(Date.now() + (i + 1) * 24 * 3600000).toISOString(), // Example follow-up date
      meetingDetails: i % 2 === 0 ? {
        eventTitle: 'Suggested Mock Meeting from Email',
        eventDate: new Date(Date.now() + 24 * 3600000).toISOString().split('T')[0],
        eventTime: new Date(Date.now() + 24 * 3600000).toISOString().split('T')[1].substring(0, 5),
        description: `Generated from mock email ${id}`,
        attendees: ['user@example.com', 'mock@example.com'],
        location: 'Virtual',
      } : undefined,
      rawAiResponse: `Mock raw AI response for email ${id}`,
      calendarEventId: undefined,
      calendarEventStatus: i % 2 === 0 ? 'pending_creation' : 'no_actionable_meeting',
      calendarEventError: undefined,
      error: undefined,
      calendarEventDetails: undefined,
      isMeeting: i % 2 === 0, // Derived from old isMeetingInvitation
    };

    return {
      id: id,
      threadId: `thread_mock_${currentFolder}_${i}`,
      subject: `[${currentFolder}] Mock Subject ${i + 1} - Detailed View`,
      from: `${currentFolder.toLowerCase()}_sender${i}@example.com`,
      to: 'user@example.com',
      cc: ['cc_user@example.com'],
      bcc: ['bcc_user@example.com'],
      date: new Date(Date.now() - i * 3600000).toISOString(),
      body: `This is the <b>detailed mock HTML body</b> for email ${i + 1} in folder ${currentFolder}. It might contain <ul><li>Lists</li><li>And other formatting</li></ul>`,
      bodyMimeType: 'text/html',
      snippet: `Detailed mock snippet ${i + 1} from folder ${currentFolder}`,
      labels: [currentFolder, 'READ', 'IMPORTANT'].filter(Boolean),
      attachments: i % 2 === 0 ? [
        {
          id: `mock_detail_att1_${i}`,
          filename: `detailed_attachment1_${i}.docx`,
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 20480,
          url: '#'
        },
        {
          id: `mock_detail_att2_${i}`,
          filename: `detailed_image_${i}.png`,
          contentType: 'image/png',
          size: 51200,
          url: '#'
        }
      ] : undefined,
      read: true,
      starred: true,
      important: true,
      analysis: mockAnalysis
    };
  }

  async getAccounts(): Promise<EmailAccount[]> {
    const { useMock } = getEnv();

    // Mock mode - return dummy accounts
    if (useMock || this.isGeminiOnlyMode) {
      console.log('[emailService.getAccounts] Mock mode enabled, returning mock accounts');
      return [
        {
          id: 'mock-gmail-1',
          provider: 'gmail',
          email: 'demo@genieflowai.com', // Updated to match demo user
          name: 'Demo User',
          connected: true,
          lastSynced: new Date(),
        }
      ];
    }

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('[emailService.getAccounts] Session error:', sessionError);
      throw new Error('Failed to get user session.');
    }

    const user = session?.user;
    if (!user) {
      console.log('[emailService.getAccounts] No user found in session');
      return [];
    }

    console.log('[emailService.getAccounts] User found:', user.id);

    // Fetch all linked accounts from the database
    console.log('[emailService.getAccounts] Fetching linked accounts from database');
    const { data: linkedAccounts, error: dbError } = await supabase
      .from('linked_accounts')
      .select('*')
      .eq('user_id', user.id);

    if (dbError) {
      console.error('[emailService.getAccounts] Error fetching linked accounts:', dbError);
      throw new Error('Failed to fetch linked accounts.');
    }

    if (!linkedAccounts || linkedAccounts.length === 0) {
      return [];
    }

    // Map the database records to the EmailAccount type
    const emailAccounts: EmailAccount[] = linkedAccounts.map(acc => ({
      id: acc.id, // The UUID from our table
      provider: acc.provider as 'gmail', // We only support gmail for now
      email: acc.email,
      name: acc.email, // Use email as the name
      connected: true, // Assume connected if it's in the DB
      lastSynced: new Date(acc.created_at),
    }));

    console.log('[emailService.getAccounts] Mapped email accounts:', emailAccounts);
    return emailAccounts;
  }

  /**
   * Send an email message.
   * 
   * @param messageData Object containing to, cc, bcc, subject, body
   */
  async sendMessage(messageData: {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    body: string; // Assuming body is HTML for now
    // TODO: Add attachment handling
  }): Promise<void> {
    const { useMock } = getEnv();

    if (useMock) {
      console.log('EmailService (Mock): Sending email:', messageData);
      return;
    }

    if (!this.initialized || !await this.isSignedIn()) {
      throw new Error('Not initialized or signed in');
    }

    // Attempt to get user email from auth service
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session || !session.user?.email) {
      console.error('EmailService: Could not determine sender email address. Session error or missing email.', sessionError);
      throw new Error('Could not determine sender email address.');
    }
    const currentUserEmail = session.user.email;

    // Helper to format addresses
    const formatAddresses = (addresses: string | string[] | undefined): string => {
      if (!addresses) return '';
      return Array.isArray(addresses) ? addresses.join(', ') : addresses;
    };

    // Construct the raw email message (RFC 2822 format)
    const mail = [
      `Content-Type: text/html; charset="UTF-8"`,
      `MIME-Version: 1.0`,
      `Content-Transfer-Encoding: 7bit`, // Or base64 if body needs it
      `to: ${formatAddresses(messageData.to)}`,
      messageData.cc ? `cc: ${formatAddresses(messageData.cc)}` : null,
      messageData.bcc ? `bcc: ${formatAddresses(messageData.bcc)}` : null,
      `from: ${currentUserEmail}`,
      `subject: =?utf-8?B?${Buffer.from(messageData.subject).toString('base64')}?=`,
      '',
      messageData.body
    ].filter(Boolean).join('\r\n'); // Use CRLF line endings

    // Base64Url encode the raw message
    const base64EncodedEmail = Buffer.from(mail)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      console.log('EmailService: Sending email via Gmail API...');
      await this.googleClient.request<any>({
        url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        data: { raw: base64EncodedEmail }
      });
      console.log('EmailService: Email sent successfully.');
    } catch (error) {
      console.error('EmailService: Failed to send email:', error);
      throw error;
    }
  }

  // Updated attachment check to return a list (basic structure)
  private extractAttachments(payload: any): any[] | undefined {
    let attachments: any[] = [];
    const parts = payload.parts || [];

    for (const part of parts) {
      if (part.filename && part.filename.length > 0 && part.body?.attachmentId) {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType,
          size: part.body.size,
          attachmentId: part.body.attachmentId
          // We would need another API call to fetch the actual attachment data using attachmentId
        });
      }
      // Recursively check nested parts for multipart messages
      if (part.parts) {
        const nestedAttachments = this.extractAttachments(part);
        if (nestedAttachments) {
          attachments = attachments.concat(nestedAttachments);
        }
      }
    }

    // Also check top-level body if not multipart
    if (!payload.parts && payload.filename && payload.filename.length > 0 && payload.body?.attachmentId) {
      attachments.push({
        filename: payload.filename,
        mimeType: payload.mimeType,
        size: payload.body.size,
        attachmentId: payload.body.attachmentId
      });
    }

    return attachments.length > 0 ? attachments : undefined;
  }

  /**
   * Analyze an email using the AI service to extract insights.
   * @param email The email message to analyze.
   * @returns A promise that resolves to an EmailAnalysis object or null if analysis fails.
   */
  public async analyzeEmail(email: EmailMessage): Promise<EmailAnalysis | null> {
    if (!email || !email.id) {
      console.error('[EmailService] analyzeEmail: Cannot analyze email, missing id.');
      // Return a structured error in EmailAnalysis format
      return {
        messageId: email?.id || 'unknown',
        error: 'Cannot analyze email, missing id.',
        priority: 'low',
        category: 'error',
        sentiment: 'neutral',
        actionItems: [],
        summary: 'Analysis failed due to missing email content.',
        keywords: [],
        calendarEventStatus: 'analysis_error',
        isMeeting: false,
        isCourtDocument: undefined,
        isReplyRequired: undefined,
        suggestedReply: undefined,
        followUpDate: undefined,
        meetingDetails: undefined,
        rawAiResponse: undefined,
        calendarEventId: undefined,
        calendarEventError: undefined,
        calendarEventDetails: undefined,
      };
    }

    console.log(`[EmailService] Analyzing email ID ${email.id} with subject "${email.subject}"`);

    // Check if this email has attachments that might contain hearing information
    let enhancedBody = email.body || '';
    let attachmentContent = '';

    // Get raw message to access attachment data if needed
    if (email.body && (email.body.includes('NOH') || email.body.toLowerCase().includes('hearing') || email.body.toLowerCase().includes('notice'))) {
      try {
        console.log(`[EmailService] Email appears to be a hearing notice, fetching raw message to check attachments...`);
        const rawMessage = await this.googleClient.request<any>({
          url: `https://gmail.googleapis.com/gmail/v1/users/me/messages/${email.id}?format=full`,
          method: 'GET'
        });

        if (rawMessage && rawMessage.data.payload) {
          const rawAttachments = this.extractAttachments(rawMessage.data.payload);

          if (rawAttachments && rawAttachments.length > 0) {
            console.log(`[EmailService] Found ${rawAttachments.length} attachments in raw message`);

            // Look for HTML attachments that might contain hearing notices
            const hearingAttachments = rawAttachments.filter((att: any) =>
              att.mimeType === 'text/html' ||
              (att.filename && (
                att.filename.toLowerCase().includes('hearing') ||
                att.filename.toLowerCase().includes('notice')
              ))
            );

            if (hearingAttachments.length > 0) {
              console.log(`[EmailService] Found ${hearingAttachments.length} potential hearing attachments`);

              for (const attachment of hearingAttachments) {
                try {
                  if (attachment.attachmentId && attachment.mimeType === 'text/html') {
                    // Fetch HTML attachment content
                    const attachmentPath = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${email.id}/attachments/${attachment.attachmentId}`;
                    const attachmentResponse = await this.googleClient.request<{ data: string }>({
                      url: attachmentPath,
                      method: 'GET'
                    });

                    if (attachmentResponse && attachmentResponse.data) {
                      const decodedContent = this.decodeBase64(attachmentResponse.data.data);
                      // Strip HTML tags and clean up the content
                      const cleanContent = decodedContent
                        .replace(/<[^>]*>/g, ' ')  // Remove HTML tags
                        .replace(/&[^;]+;/g, ' ')  // Remove HTML entities
                        .replace(/\s+/g, ' ')      // Normalize whitespace
                        .trim();

                      if (cleanContent.length > 100) { // Only include substantial content
                        attachmentContent += `\n\n=== HEARING NOTICE ATTACHMENT: ${attachment.filename} ===\n${cleanContent}\n`;
                        console.log(`[EmailService] Successfully extracted ${cleanContent.length} characters from hearing attachment: ${attachment.filename}`);
                      }
                    }
                  }
                } catch (attachmentError) {
                  console.error(`[EmailService] Error fetching attachment ${attachment.filename}:`, attachmentError);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(`[EmailService] Error fetching raw message for attachment analysis:`, error);
      }
    }

    // Combine email body with attachment content for analysis
    const fullContentForAnalysis = enhancedBody + attachmentContent;

    if (!fullContentForAnalysis.trim()) {
      console.warn('[EmailService] No content available for analysis (empty body and no attachment content).');
      return {
        messageId: email.id,
        error: 'No content available for analysis.',
        priority: 'low',
        category: 'empty',
        sentiment: 'neutral',
        actionItems: [],
        summary: 'Email has no analyzable content.',
        keywords: [],
        calendarEventStatus: 'analysis_error',
        isMeeting: false,
        isCourtDocument: undefined,
        isReplyRequired: undefined,
        suggestedReply: undefined,
        followUpDate: undefined,
        meetingDetails: undefined,
        rawAiResponse: undefined,
        calendarEventId: undefined,
        calendarEventError: undefined,
        calendarEventDetails: undefined,
      };
    }

    // Create enhanced email object with combined content for analysis
    const enhancedEmailForAnalysis = {
      ...email,
      body: fullContentForAnalysis
    };

    console.log(`[EmailService] Analyzing email with ${fullContentForAnalysis.length} characters (body: ${enhancedBody.length}, attachments: ${attachmentContent.length})`);

    let analysisResult: EmailAnalysis;

    try {
      // Perform AI analysis using the enhanced content
      analysisResult = await this.aiService.analyzeEmailForCalendarEvent(enhancedEmailForAnalysis);

      console.log(`[EmailService] Successfully performed AI analysis for email ID ${email.id}.`);
      analysisResult.calendarEventStatus = 'ai_analysis_complete';

      const meetingDetails = analysisResult.meetingDetails; // Should be populated from aiCalendarAnalysis

      // Calendar operations logic (remains largely the same, but uses populated analysisResult)
      if (meetingDetails && meetingDetails.eventDate && meetingDetails.eventTime) {
        console.log(`[EmailService] Found meeting details for email ID ${email.id}. Proceeding with calendar logic.`);
        const caseNumber = meetingDetails.caseNumber;
        let existingEvent = null;

        if (caseNumber) {
          console.log(`[EmailService] Email ID ${email.id} has case number ${caseNumber}. Checking for existing event.`);
          existingEvent = await aiCalendarService.findEventByCaseNumber(caseNumber);
        }

        if (existingEvent) {
          console.log(`[EmailService] Found existing event ID ${existingEvent.id} for case ${caseNumber}. Attempting to update.`);
          analysisResult.calendarEventStatus = 'pending_update';
          try {
            const updatedEvent = await aiCalendarService.updateEvent(
              existingEvent.id,
              meetingDetails,
              email.subject,
              email.id,
              email.threadId
            );
            if (updatedEvent) {
              console.log(`[EmailService] Successfully updated calendar event for email ID ${email.id}. Event ID: ${updatedEvent.id}`);
              analysisResult.calendarEventId = updatedEvent.id;
              analysisResult.calendarEventDetails = updatedEvent;
              analysisResult.calendarEventStatus = 'updated';

              // Also update the event in the local calendar store
              try {
                const calendarStore = useCalendarStore.getState();
                // Find existing event in local store by Google event ID
                const existingLocalEvent = calendarStore.events.find(e =>
                  (e as any).googleEventId === updatedEvent.id ||
                  (e as any).caseNumber === meetingDetails.caseNumber
                );

                if (existingLocalEvent) {
                  const updatedLocalEvent = {
                    title: updatedEvent.summary || `${meetingDetails.eventType || 'Hearing'} for ${meetingDetails.personInvolved || 'Case'} ${meetingDetails.caseNumber || ''}`.trim(),
                    description: updatedEvent.description || `Event Details:\nCase Number: ${meetingDetails.caseNumber || 'N/A'}\nEvent Type: ${meetingDetails.eventType || 'N/A'}\nPerson Involved: ${meetingDetails.personInvolved || 'N/A'}\nJudge: ${meetingDetails.judgeName || 'N/A'}\n\n(Updated from email: "${email.subject}")`,
                    start: new Date(updatedEvent.start?.dateTime || updatedEvent.start?.date || Date.now()),
                    end: new Date(updatedEvent.end?.dateTime || updatedEvent.end?.date || Date.now() + 60 * 60 * 1000),
                    allDay: !updatedEvent.start?.dateTime,
                    location: updatedEvent.location || meetingDetails.location,
                    url: updatedEvent.htmlLink,
                    attendees: meetingDetails.attendees || [],
                    tags: ['hearing', 'legal', meetingDetails.eventType?.toLowerCase() || 'event'].filter(Boolean),
                    caseNumber: meetingDetails.caseNumber,
                    hearingType: meetingDetails.eventType,
                    judge: meetingDetails.judgeName,
                  };

                  calendarStore.updateEvent(existingLocalEvent.id, updatedLocalEvent);
                  console.log(`[EmailService] Updated event in local calendar store with ID: ${existingLocalEvent.id}`);
                } else {
                  console.log(`[EmailService] No existing local event found to update for case ${meetingDetails.caseNumber}`);
                }
              } catch (localStoreError) {
                console.error(`[EmailService] Error updating event in local calendar store:`, localStoreError);
                // Don't fail the whole operation if local store fails
              }
            } else {
              console.warn(`[EmailService] Failed to update calendar event for email ID ${email.id}. aiCalendarService.updateEvent returned null.`);
              analysisResult.calendarEventError = 'Failed to update event in calendar (service returned null).';
              analysisResult.calendarEventStatus = 'update_failed';
            }
          } catch (calendarUpdateError: any) {
            console.error(`[EmailService] Error updating calendar event for email ID ${email.id}:`, calendarUpdateError);
            analysisResult.calendarEventError = calendarUpdateError.message || 'Unknown error updating calendar event.';
            analysisResult.calendarEventStatus = 'update_failed';
          }
        } else {
          if (caseNumber) {
            console.log(`[EmailService] No existing event found for case ${caseNumber}. Creating new event for email ID ${email.id}.`);
          } else {
            console.log(`[EmailService] No case number found. Attempting to create new event for email ID ${email.id}.`);
          }
          analysisResult.calendarEventStatus = 'pending_creation';
          try {
            const newEvent = await aiCalendarService.createEventFromAnalysis(
              meetingDetails,
              email.subject,
              email.id,
              email.threadId
            );
            if (newEvent) {
              console.log(`[EmailService] Successfully created new calendar event for email ID ${email.id}. Event ID: ${newEvent.id}`);
              analysisResult.calendarEventId = newEvent.id;
              analysisResult.calendarEventDetails = newEvent;
              analysisResult.calendarEventStatus = 'created';

              // Also add the event to the local calendar store so it appears in the UI
              try {
                const calendarStore = useCalendarStore.getState();
                const localEvent = {
                  title: newEvent.summary || `${meetingDetails.eventType || 'Hearing'} for ${meetingDetails.personInvolved || 'Case'} ${meetingDetails.caseNumber || ''}`.trim(),
                  description: newEvent.description || `Event Details:\nCase Number: ${meetingDetails.caseNumber || 'N/A'}\nEvent Type: ${meetingDetails.eventType || 'N/A'}\nPerson Involved: ${meetingDetails.personInvolved || 'N/A'}\nJudge: ${meetingDetails.judgeName || 'N/A'}\n\n(Created from email: "${email.subject}")`,
                  start: new Date(newEvent.start?.dateTime || newEvent.start?.date || Date.now()),
                  end: new Date(newEvent.end?.dateTime || newEvent.end?.date || Date.now() + 60 * 60 * 1000),
                  allDay: !newEvent.start?.dateTime, // If no time specified, it's all day
                  sourceId: 'automation',
                  location: newEvent.location || meetingDetails.location,
                  url: newEvent.htmlLink,
                  attendees: meetingDetails.attendees || [],
                  tags: ['hearing', 'legal', meetingDetails.eventType?.toLowerCase() || 'event'].filter(Boolean),
                  googleEventId: newEvent.id, // Link to Google Calendar event
                  category: 'legal',
                  caseNumber: meetingDetails.caseNumber,
                  hearingType: meetingDetails.eventType,
                  judge: meetingDetails.judgeName,
                  emailSource: email.id
                };

                const localEventId = calendarStore.addEvent(localEvent);
                console.log(`[EmailService] Added event to local calendar store with ID: ${localEventId}`);
              } catch (localStoreError) {
                console.error(`[EmailService] Error adding event to local calendar store:`, localStoreError);
                // Don't fail the whole operation if local store fails
              }
            } else {
              console.warn(`[EmailService] Could not create calendar event for email ID ${email.id}. aiCalendarService.createEventFromAnalysis returned null.`);
              analysisResult.calendarEventError = 'Failed to create event in calendar (service returned null).';
              analysisResult.calendarEventStatus = 'creation_failed';
            }
          } catch (calendarCreateError: any) {
            console.error(`[EmailService] Error creating calendar event for email ID ${email.id}:`, calendarCreateError);
            analysisResult.calendarEventError = calendarCreateError.message || 'Unknown error creating calendar event.';
            analysisResult.calendarEventStatus = 'creation_failed';
          }
        }
      } else {
        console.log(`[EmailService] No actionable meeting details (eventDate, eventTime) found for email ID ${email.id}.`);
        analysisResult.calendarEventStatus = 'no_actionable_meeting_details';
        // This was already correctly setting isMeeting to false if details were missing, so this path is fine.
      }
    } catch (aiInterfaceError: any) {
      // This catch block is for errors from the call to this.aiService.analyzeEmailForCalendarEvent itself (e.g., if the method throws)
      console.error(`[EmailService] Error calling AI service analyzeEmailForCalendarEvent for email ID ${email.id}:`, aiInterfaceError);
      return {
        messageId: email.id,
        error: aiInterfaceError.message || 'Error in AI service call.',
        priority: 'low',
        category: 'error',
        sentiment: 'neutral',
        actionItems: [],
        summary: 'AI analysis service call failed.',
        keywords: [],
        calendarEventStatus: 'analysis_error',
        isMeeting: false,
        isCourtDocument: undefined,
        isReplyRequired: undefined,
        suggestedReply: undefined,
        followUpDate: undefined,
        meetingDetails: undefined,
        rawAiResponse: undefined,
        calendarEventId: undefined,
        calendarEventError: undefined,
        calendarEventDetails: undefined,
      };
    }

    return analysisResult;
  }

  async sendEmail(to: string, subject: string, htmlBody: string): Promise<any> {
    console.log(`[EmailService] Attempting to send email to: ${to} with subject: ${subject}`);

    // Ensure GoogleAPIClient is initialized. Initialize is idempotent.
    // Provide a default onAuthChange or use one from your app\'s context if available.
    await this.googleClient.initialize(() => { });
    // Ensure user is signed in and has consented to necessary scopes (including gmail.send)
    // signIn() will request token and trigger consent if needed, and is also idempotent if already signed in.
    await this.googleClient.signIn();

    // Check again after attempting sign-in, as signIn itself doesn\'t throw an error on failure to get token,
    // but updates isAuthenticated state which isSignedIn() reflects.
    if (!this.googleClient.isSignedIn()) {
      console.error('[EmailService] Google Sign-In failed or user not authenticated. Cannot send email.');
      throw new Error('Google Sign-In/Authentication required to send email.');
    }

    let fromEmail = '';
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session || !session.user?.email) {
        console.error('[EmailService] Could not determine sender email address. Session error or missing email.', sessionError);
        throw new Error('Could not determine sender email address for From header.');
      }
      fromEmail = session.user.email;
    } catch (error) {
      console.warn('[EmailService] Error fetching user email for From header from Supabase session:', error);
      throw new Error('Failed to retrieve sender email address.');
    }

    // Construct the raw email message (RFC 2822 format)
    const emailLines = [];
    // The From header should ideally be the authenticated user's email address.
    // Using the variable `fromEmail` which defaults to 'me' if userInfo.email isn't fetched.
    // For the Gmail API `users/me/messages/send` endpoint, the authenticated user is implied.
    // Some strict RFC interpretations might want a full email here, but Gmail is often flexible.
    emailLines.push(`From: <${fromEmail}>`);
    emailLines.push(`To: <${to}>`);
    emailLines.push(`Subject: ${subject}`);
    emailLines.push('Content-Type: text/html; charset=utf-8');
    emailLines.push('MIME-Version: 1.0');
    emailLines.push(''); // Blank line separates headers from body
    emailLines.push(htmlBody);

    const rawEmail = emailLines.join('\r\n');

    const base64EncodedEmail = btoa(rawEmail)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      console.log('[EmailService] Sending raw email via Gmail API.');
      const response = await this.googleClient.request<any>({
        url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        method: 'POST',
        data: { raw: base64EncodedEmail }
      });
      console.log('[EmailService] Email sent successfully. Response:', response);
      return response;
    } catch (error) {
      console.error('[EmailService] Error sending email via Gmail API:', error);
      throw error;
    }
  }

  /**
   * Get emails with pagination (main method used by EmailContext)
   */
  async getEmails(options: EmailQuery = {}): Promise<EmailResponse> {
    if (!this.initialized) {
      await this.initialize();
    }

    // GEMINI-ONLY MODE: Return mock data
    if (this.isGeminiOnlyMode) {
      console.log('EmailService: getEmails - returning mock data in Gemini-only mode');
      return this.getMockEmails(options);
    }

    if (!await this.isSignedIn()) {
      console.log('EmailService: User not signed in to Google OAuth - returning rich mock legal emails');
      return this.getMockEmails(options);
    }

    try {
      const { pageSize = this.maxResults, labelId, folderId, search, pageToken } = options;
      const labelIdsParam = labelId ? [labelId] : (folderId ? [folderId] : ['INBOX']);

      // Build query params
      const queryParams = new URLSearchParams({
        maxResults: pageSize.toString(),
        ...(pageToken && { pageToken }),
        ...(search && { q: search })
      });
      labelIdsParam.forEach(lId => queryParams.append('labelIds', lId));

      const path = `https://gmail.googleapis.com/gmail/v1/users/me/messages?${queryParams.toString()}`;

      const response = await this.googleClient.request<{
        messages: { id: string; threadId: string }[];
        nextPageToken?: string;
        resultSizeEstimate: number;
      }>({ method: 'GET', url: path });

      if (!response.data.messages?.length) {
        return {
          messages: [],
          nextPageToken: null,
          resultSizeEstimate: 0
        };
      }

      // Batch message fetching in groups of 10
      const messages: EmailMessage[] = [];
      for (let i = 0; i < response.data.messages.length; i += 10) {
        const batch = response.data.messages.slice(i, i + 10);
        const batchPromises = batch.map(msg => this.getBasicMessageInfo(msg.id));
        const batchResults = await Promise.all(batchPromises);
        messages.push(...batchResults.filter(Boolean) as EmailMessage[]);
      }

      return {
        messages,
        nextPageToken: response.data.nextPageToken || null,
        resultSizeEstimate: response.data.resultSizeEstimate
      };
    } catch (error) {
      console.error('EmailService: Failed to fetch emails:', error);

      // Handle specific errors gracefully
      if (error instanceof Error) {
        // If no token (dev mode or service down), return empty list instead of crashing app
        if (error.message.includes('No access token available')) {
          console.warn('[EmailService] No access token - returning empty email list');
          return {
            messages: [],
            nextPageToken: null,
            resultSizeEstimate: 0
          };
        }

        if (error.message.includes('401') || error.message.includes('authentication failed')) {
          throw new Error('Gmail authentication expired. Please reconnect your account in Email Settings.');
        }
        if (error.message.includes('403')) {
          throw new Error('Gmail access denied. Please check your account permissions.');
        }
      }

      throw error;
    }
  }

  // Helper to map GmailMessage to EmailMessage
  private mapGmailMessageToEmailMessage(message: GmailMessage): EmailMessage {
    // Add null checking for payload
    if (!message.payload) {
      // Only log once per session to avoid spam
      if (!this.loggedPayloadWarning) {
        console.warn(`[EmailService] Some messages missing payload data - using defaults`);
        this.loggedPayloadWarning = true;
      }
      return {
        id: message.id,
        threadId: message.threadId || '',
        subject: '(No Subject)',
        from: '',
        to: '',
        date: '',
        body: '',
        snippet: message.snippet || '',
        attachments: [],
        labels: message.labelIds || [],
        read: true, // Default to read if we can't determine
        bodyMimeType: 'text/plain'
      };
    }

    const headers = message.payload.headers || [];
    const subject = this.findHeader(headers, 'Subject') || '(No Subject)';
    const from = this.findHeader(headers, 'From') || '';
    const to = this.findHeader(headers, 'To') || '';
    const date = this.findHeader(headers, 'Date') || '';
    const labels = message.labelIds || [];
    let body = '';
    let bodyMimeType = 'text/plain'; // Default MIME type

    if (message.payload.parts) {
      const htmlPart = message.payload.parts.find((part: any) => part.mimeType === 'text/html');
      const textPart = message.payload.parts.find((part: any) => part.mimeType === 'text/plain');

      if (htmlPart?.body?.data) {
        body = this.decodeBase64(htmlPart.body.data);
        bodyMimeType = 'text/html';
      } else if (textPart?.body?.data) {
        body = this.decodeBase64(textPart.body.data);
        bodyMimeType = 'text/plain';
      }
    } else if (message.payload.body?.data) {
      body = this.decodeBase64(message.payload.body.data);
      bodyMimeType = message.payload.mimeType || 'text/plain';
    }

    // Safely extract attachments
    const attachments = [];
    if (message.payload.parts) {
      for (const part of message.payload.parts) {
        if (part.filename && part.body?.attachmentId) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType || 'application/octet-stream',
            attachmentId: part.body.attachmentId,
            size: part.body.size || 0
          });
        }
      }
    }

    return {
      id: message.id,
      threadId: message.threadId || '',
      subject,
      from,
      to,
      date,
      body,
      snippet: message.snippet || '',
      attachments,
      labels,
      read: !labels.includes('UNREAD'),
      bodyMimeType
    };
  }
}

// Export singleton instance
const emailService = EmailService.getInstance();
export default emailService;