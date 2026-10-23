import { AutoCalendarEngineConfig, AutoCalendarWorkflow, IndustryAutoCalendarConfig, AutoCalendarSearchTerms, ReminderTemplate, EventProcessingRule } from '../../types/autoCalendar.types';
import { getAutoCalendarConfig } from './autoCalendarConfigs';

/**
 * Enhanced Auto Calendar Engine
 * Provides configurable automation for calendar event processing based on email content
 * Replaces hardcoded logic with industry-specific workflows and templates
 */
export class EnhancedAutoCalendarEngine {
  private config: AutoCalendarEngineConfig;
  private currentIndustryConfig: IndustryAutoCalendarConfig;
  private activeWorkflow: AutoCalendarWorkflow;

  constructor(config: AutoCalendarEngineConfig) {
    this.config = config;
    this.currentIndustryConfig = getAutoCalendarConfig(config.defaultIndustry);
    this.activeWorkflow = this.getWorkflow(config.defaultWorkflowId);
  }

  /**
   * Process email content to extract calendar events using configurable workflows
   */
  async processEmailContent(emailContent: string, emailSubject: string, emailDate: Date): Promise<{
    events: any[];
    confidence: number;
    matchedTerms: string[];
    appliedRules: string[];
  }> {
    try {
      const events: any[] = [];
      const matchedTerms: string[] = [];
      const appliedRules: string[] = [];
      let totalConfidence = 0;

      // Apply search terms to identify relevant content
      const searchResults = this.analyzeEmailWithSearchTerms(emailContent, emailSubject);
      matchedTerms.push(...searchResults.matchedTerms);

      if (searchResults.confidence < this.config.globalSettings.minimumConfidence) {
        return { events, confidence: searchResults.confidence, matchedTerms, appliedRules };
      }

      // Apply processing rules in priority order
      const applicableRules = this.getApplicableRules(searchResults);
      
      for (const rule of applicableRules) {
        if (rule.enabled && this.evaluateRuleConditions(rule, searchResults)) {
          const processedEvent = await this.processWithRule(rule, emailContent, emailSubject, emailDate, searchResults);
          if (processedEvent) {
            events.push(processedEvent);
            appliedRules.push(rule.id);
            totalConfidence = Math.max(totalConfidence, searchResults.confidence);
          }
        }
      }

      return {
        events,
        confidence: totalConfidence,
        matchedTerms,
        appliedRules
      };

    } catch (error) {
      console.error('Error processing email content:', error);
      throw error;
    }
  }

  /**
   * Analyze email content using configurable search terms
   */
  private analyzeEmailWithSearchTerms(emailContent: string, emailSubject: string): {
    confidence: number;
    matchedTerms: string[];
    eventType: string | null;
    extractedInfo: any;
  } {
    const content = `${emailSubject} ${emailContent}`.toLowerCase();
    const searchTerms = this.activeWorkflow.searchTerms;
    const matchedTerms: string[] = [];
    let confidence = 0;
    let eventType: string | null = null;

    // Check primary terms (higher weight)
    for (const term of searchTerms.primary) {
      if (content.includes(term.toLowerCase())) {
        matchedTerms.push(term);
        confidence += 0.3;
      }
    }

    // Check secondary terms (lower weight)
    for (const term of searchTerms.secondary) {
      if (content.includes(term.toLowerCase())) {
        matchedTerms.push(term);
        confidence += 0.15;
      }
    }

    // Determine event type
    for (const [type, terms] of Object.entries(searchTerms.eventTypes)) {
      for (const term of terms) {
        if (content.includes(term.toLowerCase())) {
          eventType = type;
          confidence += 0.2;
          matchedTerms.push(term);
          break;
        }
      }
      if (eventType) break;
    }

    // Check exclusions (reduce confidence)
    for (const exclusion of searchTerms.exclusions) {
      if (content.includes(exclusion.toLowerCase())) {
        confidence -= 0.5;
        matchedTerms.push(`EXCLUDED: ${exclusion}`);
      }
    }

    // Extract additional info (dates, times, case numbers, etc.)
    const extractedInfo = this.extractEventInformation(emailContent, emailSubject);

    return {
      confidence: Math.max(0, Math.min(1, confidence)),
      matchedTerms,
      eventType,
      extractedInfo
    };
  }

  /**
   * Extract structured information from email content
   */
  private extractEventInformation(emailContent: string, emailSubject: string): any {
    const info: any = {};

    // Extract dates
    const dateRegex = /\b(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4})\b/gi;
    const dates = emailContent.match(dateRegex);
    if (dates) {
      info.dates = dates;
    }

    // Extract times
    const timeRegex = /\b(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)|\d{1,2}\s*(?:AM|PM|am|pm))\b/gi;
    const times = emailContent.match(timeRegex);
    if (times) {
      info.times = times;
    }

    // Extract case numbers (flexible patterns)
    const caseRegex = /(?:case|matter|file)(?:\s*#|\s*no\.?\s*|\s+)([A-Z0-9-]+)/gi;
    const caseMatches = emailContent.match(caseRegex);
    if (caseMatches) {
      info.caseNumbers = caseMatches;
    }

    // Extract locations
    const locationRegex = /(?:at|location:|venue:|address:)\s*([^,\n\.]+)/gi;
    const locations = emailContent.match(locationRegex);
    if (locations) {
      info.locations = locations.map(loc => loc.replace(/^(at|location:|venue:|address:)\s*/i, ''));
    }

    // Extract contact information
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phoneRegex = /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g;
    
    const emails = emailContent.match(emailRegex);
    const phones = emailContent.match(phoneRegex);
    
    if (emails) info.emails = emails;
    if (phones) info.phones = phones;

    return info;
  }

  /**
   * Get applicable processing rules based on search results
   */
  private getApplicableRules(searchResults: any): EventProcessingRule[] {
    return this.activeWorkflow.processingRules
      .filter(rule => rule.enabled)
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Evaluate if a rule's conditions are met
   */
  private evaluateRuleConditions(rule: EventProcessingRule, searchResults: any): boolean {
    const { conditions } = rule;
    
    // Check minimum confidence
    if (searchResults.confidence < conditions.minimumConfidence) {
      return false;
    }

    // Check if any of the rule's search terms are matched
    const hasMatchingTerms = conditions.searchTerms.some(term => 
      searchResults.matchedTerms.some(matched => 
        matched.toLowerCase().includes(term.toLowerCase())
      )
    );

    return hasMatchingTerms;
  }

  /**
   * Process event using a specific rule
   */
  private async processWithRule(
    rule: EventProcessingRule,
    emailContent: string,
    emailSubject: string,
    emailDate: Date,
    searchResults: any
  ): Promise<any | null> {
    if (!rule.actions.createEvent) {
      return null;
    }

    try {
      // Build event from template and extracted information
      const event = this.buildEventFromTemplate(rule, searchResults, emailSubject, emailDate);
      
      // Schedule reminders if configured
      if (rule.actions.scheduleReminders && rule.reminderTemplates) {
        event.reminders = await this.buildRemindersFromTemplates(rule.reminderTemplates, event);
      }

      // Create tasks if configured
      if (rule.actions.createTasks && rule.taskTemplates) {
        event.tasks = await this.buildTasksFromTemplates(rule.taskTemplates, event);
      }

      return event;

    } catch (error) {
      console.error(`Error processing with rule ${rule.id}:`, error);
      return null;
    }
  }

  /**
   * Build calendar event from rule template and extracted information
   */
  private buildEventFromTemplate(rule: EventProcessingRule, searchResults: any, emailSubject: string, emailDate: Date): any {
    const template = rule.eventTemplate;
    const extractedInfo = searchResults.extractedInfo;

    // Determine event date - prefer extracted dates, fallback to email date
    let eventDate = emailDate;
    if (extractedInfo.dates && extractedInfo.dates.length > 0) {
      try {
        eventDate = new Date(extractedInfo.dates[0]);
      } catch {
        eventDate = emailDate;
      }
    }

    // Determine event time
    let eventTime = '09:00'; // Default
    if (extractedInfo.times && extractedInfo.times.length > 0) {
      eventTime = extractedInfo.times[0];
    }

    // Build event object
    const event: any = {
      id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: this.generateEventTitle(emailSubject, extractedInfo, searchResults.eventType),
      description: `Auto-generated from email: ${emailSubject}`,
      startDate: eventDate,
      startTime: eventTime,
      duration: template.defaultDuration || 60,
      location: extractedInfo.locations?.[0] || template.defaultLocation || '',
      priority: template.defaultPriority || 'normal',
      eventType: searchResults.eventType || 'general',
      source: 'auto-calendar-engine',
      ruleId: rule.id,
      extractedData: extractedInfo,
      customFields: template.customFields || {}
    };

    // Add case number if available
    if (extractedInfo.caseNumbers) {
      event.caseNumber = extractedInfo.caseNumbers[0];
      event.customFields.caseNumber = extractedInfo.caseNumbers[0];
    }

    return event;
  }

  /**
   * Generate event title from email subject and extracted information
   */
  private generateEventTitle(emailSubject: string, extractedInfo: any, eventType: string | null): string {
    let title = emailSubject;

    // Clean up common email prefixes
    title = title.replace(/^(re:|fwd?:|fw:)\s*/i, '');

    // Add case number if available
    if (extractedInfo.caseNumbers && extractedInfo.caseNumbers.length > 0) {
      const caseNumber = extractedInfo.caseNumbers[0];
      if (!title.includes(caseNumber)) {
        title = `${title} - ${caseNumber}`;
      }
    }

    // Add event type prefix if determined
    if (eventType) {
      const typeLabel = eventType.charAt(0).toUpperCase() + eventType.slice(1);
      if (!title.toLowerCase().includes(eventType)) {
        title = `${typeLabel}: ${title}`;
      }
    }

    return title;
  }

  /**
   * Build reminders from templates
   */
  private async buildRemindersFromTemplates(templateIds: string[], event: any): Promise<any[]> {
    const reminders: any[] = [];
    
    for (const templateId of templateIds) {
      const template = this.getReminderTemplate(templateId);
      if (template && this.shouldApplyTemplate(template, event)) {
        const reminder = this.buildReminderFromTemplate(template, event);
        reminders.push(reminder);
      }
    }

    return reminders;
  }

  /**
   * Get reminder template by ID
   */
  private getReminderTemplate(templateId: string): ReminderTemplate | null {
    return this.activeWorkflow.reminderTemplates.find(t => t.id === templateId) || null;
  }

  /**
   * Check if reminder template should be applied to event
   */
  private shouldApplyTemplate(template: ReminderTemplate, event: any): boolean {
    if (!template.conditions) {
      return true;
    }

    // Check event type conditions
    if (template.conditions.eventTypes) {
      return template.conditions.eventTypes.includes(event.eventType);
    }

    return true;
  }

  /**
   * Build individual reminder from template
   */
  private buildReminderFromTemplate(template: ReminderTemplate, event: any): any {
    const reminderTime = new Date(event.startDate);
    reminderTime.setMinutes(reminderTime.getMinutes() - template.timing.offset);

    return {
      id: `reminder_${template.id}_${event.id}`,
      eventId: event.id,
      type: template.type,
      scheduledTime: reminderTime,
      message: this.interpolateTemplateMessage(template.message, event),
      templateId: template.id,
      status: 'scheduled'
    };
  }

  /**
   * Interpolate template message with event data
   */
  private interpolateTemplateMessage(messageTemplate: any, event: any): any {
    const message = { ...messageTemplate };
    
    // Replace variables in message content
    if (message.body) {
      message.body = this.replaceVariables(message.body, event);
    }
    if (message.subject) {
      message.subject = this.replaceVariables(message.subject, event);
    }

    return message;
  }

  /**
   * Replace template variables with actual event data
   */
  private replaceVariables(template: string, event: any): string {
    const variables: { [key: string]: string } = {
      eventTitle: event.title || '',
      eventDate: event.startDate?.toLocaleDateString() || '',
      eventTime: event.startTime || '',
      eventLocation: event.location || '',
      caseNumber: event.caseNumber || '',
      eventType: event.eventType || '',
      attendeeName: 'User' // Default, could be extracted from email
    };

    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, value);
    }

    return result;
  }

  /**
   * Build tasks from templates (placeholder implementation)
   */
  private async buildTasksFromTemplates(templateIds: string[], event: any): Promise<any[]> {
    // This would be implemented based on task template structure
    // For now, return empty array
    return [];
  }

  /**
   * Switch to different workflow
   */
  public switchWorkflow(workflowId: string): boolean {
    const workflow = this.getWorkflow(workflowId);
    if (workflow) {
      this.activeWorkflow = workflow;
      return true;
    }
    return false;
  }

  /**
   * Switch industry configuration
   */
  public switchIndustry(industryId: string): boolean {
    try {
      this.currentIndustryConfig = getAutoCalendarConfig(industryId);
      // Switch to default workflow for new industry
      this.activeWorkflow = this.getWorkflow(this.currentIndustryConfig.defaultWorkflowId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get workflow by ID from current industry config
   */
  private getWorkflow(workflowId: string): AutoCalendarWorkflow {
    return this.currentIndustryConfig.workflows.find(w => w.id === workflowId) 
      || this.currentIndustryConfig.workflows[0]; // Fallback to first workflow
  }

  /**
   * Get current configuration summary
   */
  public getConfigurationSummary(): any {
    return {
      engineConfig: this.config,
      currentIndustry: this.currentIndustryConfig.id,
      activeWorkflow: this.activeWorkflow.id,
      searchTermsCount: {
        primary: this.activeWorkflow.searchTerms.primary.length,
        secondary: this.activeWorkflow.searchTerms.secondary.length,
        eventTypes: Object.keys(this.activeWorkflow.searchTerms.eventTypes).length
      },
      rulesCount: this.activeWorkflow.processingRules.length,
      reminderTemplatesCount: this.activeWorkflow.reminderTemplates.length
    };
  }
}
