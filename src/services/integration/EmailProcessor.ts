import { EmailService } from '../email/EmailServiceAdapter';
import { EmailAnalysis } from '../email/types';
import { TaskService } from '../tasks/taskService';
import { CalendarService } from '../calendar/calendarService';
import { useAuditStore } from '../../store/auditStore';

/**
 * Settings for automatic email processing
 */
export interface EmailProcessorSettings {
  autoAnalyzeEmails: boolean;
  autoCreateTasks: boolean;
  autoCreateEvents: boolean;
  autoReplyToEmails: boolean;
  processOnlyUnread: boolean;
  processOnlyInbox: boolean;
  autoLabelsEnabled: boolean;
  taskExtractionSensitivity: 'low' | 'medium' | 'high';
  requireConfirmation: boolean;
}

/**
 * Result of an automated email processing operation
 */
export interface EmailProcessingResult {
  messageId: string;
  subject: string;
  analyzed: boolean;
  analysis?: EmailAnalysis;
  tasksCreated: number;
  eventsCreated: number;
  autoReplied: boolean;
  labelsApplied: string[];
  error?: string;
  pendingActions?: string[];
}

/**
 * Service for automatically processing emails to extract tasks, events, and more
 */
export class EmailProcessor {
  private emailService: EmailService;
  private taskService: TaskService;
  private calendarService: CalendarService;
  private settings: EmailProcessorSettings;
  private settingsStorageKey = 'genieflow_email_processor_settings';
  private processedEmailsKey = 'genieflow_processed_emails';
  private processedEmailIds: Set<string> = new Set();

  constructor(
    emailService: EmailService,
    taskService: TaskService, 
    calendarService: CalendarService
  ) {
    this.emailService = emailService;
    this.taskService = taskService;
    this.calendarService = calendarService;
    
    this.settings = this.loadSettings();
    this.loadProcessedEmails();
    
    console.log('EmailProcessor initialized', 
      `Auto-analyze: ${this.settings.autoAnalyzeEmails}`,
      `Auto-tasks: ${this.settings.autoCreateTasks}`,
      `Auto-events: ${this.settings.autoCreateEvents}`
    );
  }

  /**
   * Load processor settings from storage
   */
  private loadSettings(): EmailProcessorSettings {
    const defaultSettings: EmailProcessorSettings = {
      autoAnalyzeEmails: true,
      autoCreateTasks: true,
      autoCreateEvents: true,
      autoReplyToEmails: false,
      processOnlyUnread: true,
      processOnlyInbox: true,
      autoLabelsEnabled: true,
      taskExtractionSensitivity: 'medium',
      requireConfirmation: true
    };
    
    try {
      const settingsJson = localStorage.getItem(this.settingsStorageKey);
      if (settingsJson) {
        return { ...defaultSettings, ...JSON.parse(settingsJson) };
      }
    } catch (error) {
      console.error('Failed to load email processor settings:', error);
    }
    
    return defaultSettings;
  }

  /**
   * Save processor settings to storage
   */
  public saveSettings(settings: Partial<EmailProcessorSettings>): void {
    try {
      this.settings = { ...this.settings, ...settings };
      localStorage.setItem(this.settingsStorageKey, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save email processor settings:', error);
    }
  }

  /**
   * Load IDs of already processed emails
   */
  private loadProcessedEmails(): void {
    try {
      const processedJson = localStorage.getItem(this.processedEmailsKey);
      if (processedJson) {
        const processed = JSON.parse(processedJson);
        this.processedEmailIds = new Set(processed);
      }
    } catch (error) {
      console.error('Failed to load processed emails:', error);
    }
  }

  /**
   * Save processed email IDs to storage
   */
  private saveProcessedEmails(): void {
    try {
      localStorage.setItem(
        this.processedEmailsKey, 
        JSON.stringify([...this.processedEmailIds])
      );
    } catch (error) {
      console.error('Failed to save processed emails:', error);
    }
  }

  /**
   * Process all new emails from a specified account
   */
  public async processNewEmails(accountId: string): Promise<EmailProcessingResult[]> {
    console.log(`Processing new emails for account ${accountId}`);
    
    const query: any = {};
    
    // Apply settings
    if (this.settings.processOnlyUnread) {
      query.unread = true;
    }
    
    if (this.settings.processOnlyInbox) {
      query.folderId = 'INBOX';
    }
    
    // Get messages
    const { messages } = await this.emailService.getMessages(accountId, query);
    console.log(`Found ${messages.length} emails to process`);
    
    // Filter out already processed emails
    const unprocessedMessages = messages.filter(msg => !this.processedEmailIds.has(msg.id));
    console.log(`${unprocessedMessages.length} emails are new and will be processed`);
    
    // Process each message
    const results: EmailProcessingResult[] = [];
    
    for (const message of unprocessedMessages) {
      const result = await this.processEmail(accountId, message.id);
      results.push(result);
      
      // Mark as processed
      this.processedEmailIds.add(message.id);
    }
    
    // Save the updated processed emails list
    this.saveProcessedEmails();
    
    return results;
  }

  /**
   * Process a single email
   */
  public async processEmail(
    accountId: string, 
    messageId: string, 
    forceProcess: boolean = false
  ): Promise<EmailProcessingResult> {
    try {
      // Skip already processed emails unless forced
      if (this.processedEmailIds.has(messageId) && !forceProcess) {
        return {
          messageId,
          subject: 'Unknown',
          analyzed: false,
          tasksCreated: 0,
          eventsCreated: 0,
          autoReplied: false,
          labelsApplied: [],
          error: 'Email was already processed'
        };
      }
      
      // Get the message
      const { message } = await this.emailService.getMessage(accountId, messageId);

      if (!message) {
        console.error(`EmailProcessor: Message ${messageId} not found for account ${accountId}. Cannot process.`);
        return {
          messageId,
          subject: 'Unknown - Message not found',
          analyzed: false,
          tasksCreated: 0,
          eventsCreated: 0,
          autoReplied: false,
          labelsApplied: [],
          error: 'Message not found'
        };
      }
      
      const result: EmailProcessingResult = {
        messageId,
        subject: message.subject || 'No Subject',
        analyzed: false,
        tasksCreated: 0,
        eventsCreated: 0,
        autoReplied: false,
        labelsApplied: [],
        pendingActions: []
      };
      
      // Skip if settings don't allow processing
      if (this.settings.processOnlyUnread && message.read && !forceProcess) {
        result.error = 'Email is already read and settings only process unread emails';
        return result;
      }
      
      console.log(`Processing email: ${message.subject}`);
      
      // Analyze the email if enabled
      if (this.settings.autoAnalyzeEmails || forceProcess) {
        const analysis = await this.emailService.analyzeEmail(accountId, messageId);
        result.analyzed = true;
        result.analysis = analysis ?? undefined; // Ensure it's undefined if null for the type
        
        console.log(`Email analyzed:`, {
          priority: analysis?.priority,
          category: analysis?.category,
          actionItems: analysis?.actionItems?.length || 0,
          meetingDetails: analysis?.meetingDetails ? 'Present' : 'None'
        });
        
        // Extract tasks if enabled
        if ((this.settings.autoCreateTasks || forceProcess) && analysis && analysis.actionItems && analysis.actionItems.length > 0) {
          const emailInfo = {
            messageId,
            accountId,
            subject: message.subject || 'No Subject',
            sender: message.from || 'unknown@example.com',
            receivedAt: new Date(message.date || Date.now())
          };
          
          // Check if confirmation is required
          if (this.settings.requireConfirmation && !forceProcess) {
            // Add to pending actions instead of creating tasks directly
            const auditStore = useAuditStore.getState();
            const pendingActionId = auditStore.addAuditLog({
              actionType: 'create_tasks',
              sourceType: 'email',
              sourceId: messageId,
              timestamp: new Date(),
              description: `Create ${analysis.actionItems.length} tasks from email: ${message.subject}`,
              status: 'pending',
              details: {
                analysis,
                emailInfo,
                actionItems: analysis.actionItems
              }
            });
            
            // Track the pending action
            result.pendingActions = result.pendingActions || [];
            result.pendingActions.push(pendingActionId);
            
            console.log(`Created pending task creation action: ${pendingActionId}`);
          } else {
            // Auto-create tasks (no approval needed)
            const tasks = await this.taskService.extractTasksFromEmail(analysis, emailInfo);
            result.tasksCreated = tasks.length;
            
            // Log the auto-approved action
            const auditStore = useAuditStore.getState();
            auditStore.addAuditLog({
              actionType: 'create_tasks',
              sourceType: 'email',
              sourceId: messageId,
              timestamp: new Date(),
              description: `Created ${tasks.length} tasks from email: ${message.subject}`,
              status: 'auto_approved',
              details: {
                analysis,
                emailInfo,
                tasks
              }
            });
            
            console.log(`Created ${tasks.length} tasks from email`);
          }
        }
        
        // Extract calendar events if enabled
        if ((this.settings.autoCreateEvents || forceProcess) && analysis && analysis.meetingDetails) {
          const emailInfo = {
            messageId,
            accountId,
            subject: message.subject || 'No Subject',
            sender: message.from || 'unknown@example.com',
            receivedAt: new Date(message.date || Date.now())
          };
          
          // Check if confirmation is required
          if (this.settings.requireConfirmation && !forceProcess) {
            // Add to pending actions instead of creating events directly
            const auditStore = useAuditStore.getState();
            const pendingActionId = auditStore.addAuditLog({
              actionType: 'create_event',
              sourceType: 'email',
              sourceId: messageId,
              timestamp: new Date(),
              description: `Create calendar event from email: ${message.subject}`,
              status: 'pending',
              details: {
                analysis,
                emailInfo,
                meetingDetails: analysis.meetingDetails
              }
            });
            
            // Track the pending action
            result.pendingActions = result.pendingActions || [];
            result.pendingActions.push(pendingActionId);
            
            console.log(`Created pending event creation action: ${pendingActionId}`);
          } else {
            // Auto-create event (no approval needed)
            const event = await this.calendarService.createEventFromEmail(analysis, emailInfo);
            result.eventsCreated = event ? 1 : 0;
            
            // Log the auto-approved action
            const auditStore = useAuditStore.getState();
            auditStore.addAuditLog({
              actionType: 'create_event',
              sourceType: 'email',
              sourceId: messageId,
              timestamp: new Date(),
              description: `Created calendar event from email: ${message.subject}`,
              status: 'auto_approved',
              details: {
                analysis,
                emailInfo,
                event
              }
            });
            
            console.log(`Created ${result.eventsCreated} events from email`);
          }
        }
        
        // Apply automatic labels based on analysis
        if (this.settings.autoLabelsEnabled || forceProcess) {
          if (analysis) {
            const labelsApplied = await this.applyAutoLabels(accountId, messageId, analysis);
            result.labelsApplied = labelsApplied;
            console.log(`Applied ${labelsApplied.length} labels to email`);
          } else {
            result.labelsApplied = [];
            console.log('Skipping auto-labels as email analysis is null.');
          }
        }
        
        // Auto-reply if enabled and needed
        if ((this.settings.autoReplyToEmails || forceProcess) && analysis && analysis.isReplyRequired && analysis.suggestedReply) {
          // Check if confirmation is required
          if (this.settings.requireConfirmation && !forceProcess) {
            // Add to pending actions instead of auto-replying directly
            const auditStore = useAuditStore.getState();
            const pendingActionId = auditStore.addAuditLog({
              actionType: 'auto_reply',
              sourceType: 'email',
              sourceId: messageId,
              timestamp: new Date(),
              description: `Send auto-reply to email: ${message.subject}`,
              status: 'pending',
              details: {
                analysis,
                subject: message.subject,
                suggestedReply: analysis.suggestedReply
              }
            });
            
            // Track the pending action
            result.pendingActions = result.pendingActions || [];
            result.pendingActions.push(pendingActionId);
            
            console.log(`Created pending auto-reply action: ${pendingActionId}`);
          } else {
            // This would be implemented with real email sending in production
            // For mock implementation, just log it
            console.log(`Would auto-reply to email with: ${analysis.suggestedReply.substring(0, 50)}...`);
            result.autoReplied = true;
            
            // Log the auto-approved action
            const auditStore = useAuditStore.getState();
            auditStore.addAuditLog({
              actionType: 'auto_reply',
              sourceType: 'email',
              sourceId: messageId,
              timestamp: new Date(),
              description: `Sent auto-reply to email: ${message.subject}`,
              status: 'auto_approved',
              details: {
                analysis,
                subject: message.subject,
                reply: analysis.suggestedReply
              }
            });
          }
        }
      }
      
      // Mark the email as processed
      if (!this.processedEmailIds.has(messageId)) {
        this.processedEmailIds.add(messageId);
        this.saveProcessedEmails();
      }
      
      return result;
    } catch (error) {
      console.error(`Error processing email ${messageId}:`, error);
      return {
        messageId,
        subject: 'Error',
        analyzed: false,
        tasksCreated: 0,
        eventsCreated: 0,
        autoReplied: false,
        labelsApplied: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Apply automatic labels based on email analysis
   */
  private async applyAutoLabels(
    accountId: string, 
    messageId: string,
    analysis: EmailAnalysis
  ): Promise<string[]> {
    const appliedLabels: string[] = [];
    
    // Get existing labels
    const { labels } = await this.emailService.getLabels(accountId);
    
    // Find or create labels for each category
    const getCategoryLabelId = async (category: string): Promise<string | null> => {
      const labelName = category.charAt(0).toUpperCase() + category.slice(1);
      const existingLabel = labels.find(l => l.name.toLowerCase() === labelName.toLowerCase());
      
      if (existingLabel) {
        return existingLabel.id;
      }
      
      // In a real implementation, we would create the label
      console.log(`Would create new label: ${labelName}`);
      return null;
    };
    
    // Apply category label
    const categoryLabelId = await getCategoryLabelId(analysis.category);
    if (categoryLabelId) {
      await this.emailService.applyLabel(messageId, categoryLabelId);
      appliedLabels.push(categoryLabelId);
    }
    
    // Apply priority label for high-priority emails
    if (analysis.priority === 'high') {
      const priorityLabelId = await getCategoryLabelId('important');
      if (priorityLabelId) {
        await this.emailService.applyLabel(messageId, priorityLabelId);
        appliedLabels.push(priorityLabelId);
      }
    }
    
    // Apply action-needed label if tasks were found
    if (analysis.actionItems.length > 0) {
      const actionLabelId = await getCategoryLabelId('action-needed');
      if (actionLabelId) {
        await this.emailService.applyLabel(messageId, actionLabelId);
        appliedLabels.push(actionLabelId);
      }
    }
    
    // Apply meeting label if meeting details were found
    if (analysis.meetingDetails) {
      const meetingLabelId = await getCategoryLabelId('meeting');
      if (meetingLabelId) {
        await this.emailService.applyLabel(messageId, meetingLabelId);
        appliedLabels.push(meetingLabelId);
      }
    }
    
    return appliedLabels;
  }

  /**
   * Schedule processing of new emails on a regular interval
   */
  public scheduleRegularProcessing(
    accountId: string, 
    intervalMinutes: number = 15
  ): NodeJS.Timeout {
    console.log(`Scheduling email processing every ${intervalMinutes} minutes`);
    
    // Less aggressive polling with better logging
    const intervalId = setInterval(async () => {
      try {
        const now = new Date().toLocaleTimeString();
        console.log(`[${now}] Running scheduled email processing silently`);
        await this.processNewEmails(accountId);
      } catch (error) {
        console.error('Error in scheduled email processing:', error);
      }
    }, intervalMinutes * 60 * 1000);
    
    return intervalId;
  }

  /**
   * Stop scheduled processing
   */
  public stopScheduledProcessing(intervalId: NodeJS.Timeout): void {
    clearInterval(intervalId);
    console.log('Stopped scheduled email processing');
  }

  /**
   * Get processing settings
   */
  public getSettings(): EmailProcessorSettings {
    return { ...this.settings };
  }
}

// Export a factory function to create the processor
export function createEmailProcessor(
  emailService: EmailService,
  taskService: TaskService,
  calendarService: CalendarService
): EmailProcessor {
  return new EmailProcessor(emailService, taskService, calendarService);
}
