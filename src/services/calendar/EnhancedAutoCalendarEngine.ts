import { EmailMessage } from '../email/types';
import { EmailEventExtractionResult, AutoCalendarWorkflow, IndustryAutoCalendarConfig } from '../../types/autoCalendar.types';

export class EnhancedAutoCalendarEngine {
  private workflow: AutoCalendarWorkflow;
  private debugMode: boolean = false;

  constructor(workflow: AutoCalendarWorkflow, options?: { debugMode?: boolean }) {
    this.workflow = workflow;
    this.debugMode = options?.debugMode || false;
    
    if (this.debugMode) {
      console.log(`🔧 Enhanced Auto Calendar Engine initialized for ${workflow.industryType} industry`);
    }
  }

  /**
   * Process email content using the configurable workflow
   */
  async processEmailContent(email: EmailMessage): Promise<EmailEventExtractionResult | null> {
    try {
      if (this.debugMode) {
        console.log(`🔧 Processing email: ${email.subject} with ${this.workflow.industryType} workflow`);
      }

      const content = this.extractEmailContent(email);
      const searchResults = this.analyzeEmailWithSearchTerms(content, this.workflow.searchTerms);
      
      if (!searchResults.hasMatches) {
        if (this.debugMode) {
          console.log(`🔧 No search term matches found in email: ${email.subject}`);
        }
        return null;
      }

      const eventDetails = this.extractEventDetails(content, searchResults);
      
      if (!eventDetails || eventDetails.confidence < this.workflow.confidenceThreshold) {
        if (this.debugMode) {
          console.log(`🔧 Event confidence ${eventDetails?.confidence || 0} below threshold ${this.workflow.confidenceThreshold}`);
        }
        return null;
      }

      const enhancedDetails = this.buildEventFromTemplate(eventDetails, email);
      
      if (this.debugMode) {
        console.log(`🔧 Successfully extracted event: ${enhancedDetails.title} (confidence: ${enhancedDetails.confidence})`);
      }

      return enhancedDetails;

    } catch (error) {
      console.error('🔧 Enhanced Auto Calendar Engine error:', error);
      return null;
    }
  }

  /**
   * Extract and normalize email content for processing
   */
  private extractEmailContent(email: EmailMessage): string {
    const subject = email.subject || '';
    const body = email.body || email.snippet || '';
    
    // Combine and normalize content
    const content = `${subject} ${body}`.toLowerCase();
    
    // Remove HTML tags and extra whitespace
    return content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Analyze email content against configured search terms
   */
  private analyzeEmailWithSearchTerms(content: string, searchTerms: any): any {
    const results = {
      hasMatches: false,
      primaryMatches: [] as string[],
      secondaryMatches: [] as string[],
      eventTypeMatches: {} as Record<string, string[]>,
      excludedTerms: [] as string[],
      confidence: 0
    };

    // Check primary terms
    if (searchTerms.primary) {
      for (const term of searchTerms.primary) {
        if (content.includes(term.toLowerCase())) {
          results.primaryMatches.push(term);
          results.hasMatches = true;
          results.confidence += 0.3;
        }
      }
    }

    // Check secondary terms
    if (searchTerms.secondary) {
      for (const term of searchTerms.secondary) {
        if (content.includes(term.toLowerCase())) {
          results.secondaryMatches.push(term);
          results.hasMatches = true;
          results.confidence += 0.1;
        }
      }
    }

    // Check event type specific terms
    if (searchTerms.eventTypes) {
      for (const [eventType, terms] of Object.entries(searchTerms.eventTypes)) {
        for (const term of terms as string[]) {
          if (content.includes(term.toLowerCase())) {
            if (!results.eventTypeMatches[eventType]) {
              results.eventTypeMatches[eventType] = [];
            }
            results.eventTypeMatches[eventType].push(term);
            results.confidence += 0.2;
          }
        }
      }
    }

    // Check exclusion terms (reduce confidence)
    if (searchTerms.exclusions) {
      for (const term of searchTerms.exclusions) {
        if (content.includes(term.toLowerCase())) {
          results.excludedTerms.push(term);
          results.confidence -= 0.5;
        }
      }
    }

    // Normalize confidence to 0-1 range
    results.confidence = Math.max(0, Math.min(1, results.confidence));

    return results;
  }

  /**
   * Extract basic event details from content
   */
  private extractEventDetails(content: string, searchResults: any): any {
    // Basic date/time extraction (this would be more sophisticated in production)
    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/\d{4})/g,
      /(\d{1,2}-\d{1,2}-\d{4})/g,
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/gi,
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}/gi
    ];

    const timePatterns = [
      /(\d{1,2}:\d{2}\s*(am|pm))/gi,
      /(\d{1,2}\s*(am|pm))/gi
    ];

    let extractedDate: Date | null = null;
    let dateText = '';

    // Try to find date
    for (const pattern of datePatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        dateText = matches[0];
        try {
          extractedDate = new Date(dateText);
          if (!isNaN(extractedDate.getTime())) {
            break;
          }
        } catch (e) {
          // Continue to next pattern
        }
      }
    }

    // Try to find time
    let timeText = '';
    for (const pattern of timePatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        timeText = matches[0];
        break;
      }
    }

    // Determine event type based on matches
    let eventType = this.workflow.defaultEventType;
    if (Object.keys(searchResults.eventTypeMatches).length > 0) {
      eventType = Object.keys(searchResults.eventTypeMatches)[0];
    }

    // Generate title
    const title = this.generateEventTitle(searchResults, eventType);

    return {
      title,
      dateTime: extractedDate,
      eventType,
      confidence: searchResults.confidence,
      dateText,
      timeText,
      extractedTerms: searchResults
    };
  }

  /**
   * Generate event title based on matched terms and type
   */
  private generateEventTitle(searchResults: any, eventType: string): string {
    const primaryMatch = searchResults.primaryMatches[0];
    
    if (primaryMatch) {
      return primaryMatch.charAt(0).toUpperCase() + primaryMatch.slice(1);
    }

    // Fallback based on event type
    const typeMap: Record<string, string> = {
      'wcab_hearing': 'WCAB Hearing',
      'deposition': 'Deposition',
      'mediation': 'Mediation',
      'appointment': 'Appointment',
      'closing': 'Closing',
      'inspection': 'Inspection'
    };

    return typeMap[eventType] || 'Calendar Event';
  }

  /**
   * Build final event details using templates and rules
   */
  private buildEventFromTemplate(eventDetails: any, email: EmailMessage): EmailEventExtractionResult {
    const startTime = Date.now();
    
    // Apply processing rules for this event type
    const applicableRules = this.workflow.processingRules.filter(rule => 
      rule.enabled && 
      (!rule.conditions.searchTerms || 
       rule.conditions.searchTerms.some(term => 
         eventDetails.extractedTerms.primaryMatches.includes(term) ||
         eventDetails.extractedTerms.secondaryMatches.includes(term)
       ))
    );

    // Enhance details based on rules
    let enhancedDetails = { ...eventDetails };

    for (const rule of applicableRules) {
      if (rule.conditions.minimumConfidence && 
          eventDetails.confidence < rule.conditions.minimumConfidence) {
        continue;
      }

      // Apply rule enhancements
      if (rule.actions.createEvent) {
        enhancedDetails.shouldCreateEvent = true;
      }
      if (rule.actions.createTasks) {
        enhancedDetails.shouldCreateTasks = true;
      }
      if (rule.actions.scheduleReminders) {
        enhancedDetails.shouldScheduleReminders = true;
      }
    }

    // Build final result
    return {
      title: enhancedDetails.title,
      dateTime: enhancedDetails.dateTime || new Date(),
      endDateTime: enhancedDetails.endDateTime,
      location: this.extractLocation(email),
      description: this.buildDescription(email, enhancedDetails),
      attendees: this.extractAttendees(email),
      eventType: enhancedDetails.eventType,
      confidence: enhancedDetails.confidence,
      matchedTerms: enhancedDetails.extractedTerms || [],
      appliedRules: applicableRules.map(r => r.id),
      processingTime: Date.now() - startTime,
      extractedData: {
        workflow: this.workflow.industryType,
        rules: applicableRules.map(r => r.id),
        originalEmail: {
          id: email.id,
          subject: email.subject,
          from: email.from
        },
        extractedTerms: enhancedDetails.extractedTerms
      }
    };
  }

  /**
   * Extract location from email content
   */
  private extractLocation(email: EmailMessage): string | undefined {
    // Simple location extraction - would be more sophisticated in production
    const content = (email.body || email.snippet || '').toLowerCase();
    
    const locationPatterns = [
      /location:\s*(.+)/i,
      /address:\s*(.+)/i,
      /at\s+(.+\s+(street|ave|avenue|blvd|boulevard|rd|road|dr|drive|way|court|ct))/i
    ];

    for (const pattern of locationPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract attendees from email
   */
  private extractAttendees(email: EmailMessage): string[] | undefined {
    const attendees = [];
    
    if (email.from) {
      attendees.push(email.from);
    }
    
    if (email.to && Array.isArray(email.to)) {
      attendees.push(...email.to);
    } else if (email.to && typeof email.to === 'string') {
      attendees.push(email.to);
    }

    return attendees.length > 0 ? attendees : undefined;
  }

  /**
   * Build event description
   */
  private buildDescription(email: EmailMessage, eventDetails: any): string | undefined {
    const parts = [];
    
    if (email.snippet) {
      parts.push(email.snippet);
    }
    
    if (eventDetails.dateText) {
      parts.push(`Original date reference: ${eventDetails.dateText}`);
    }
    
    if (eventDetails.timeText) {
      parts.push(`Original time reference: ${eventDetails.timeText}`);
    }

    parts.push(`Processed by: ${this.workflow.industryType} workflow`);
    parts.push(`Confidence: ${Math.round(eventDetails.confidence * 100)}%`);

    return parts.join('\n\n');
  }

  /**
   * Update workflow configuration
   */
  updateWorkflow(workflow: AutoCalendarWorkflow): void {
    this.workflow = workflow;
    if (this.debugMode) {
      console.log(`🔧 Updated workflow to ${workflow.industryType}`);
    }
  }

  /**
   * Get current workflow
   */
  getCurrentWorkflow(): AutoCalendarWorkflow {
    return this.workflow;
  }
}
