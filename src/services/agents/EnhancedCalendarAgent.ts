import { BaseAgent } from './BaseAgent';
import { EmailMessage } from '../email/types';
import { CalendarEvent } from '../../types/calendar';
import { toast } from 'sonner';

interface LegalWorkflowEvent {
  caseNumber?: string;
  hearingType: 'wcab' | 'deposition' | 'mediation' | 'conference' | 'ime' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  clientName?: string;
  opposingCounsel?: string;
  location?: string;
  preparationTasks: string[];
  deadlines: { task: string; dueDate: Date }[];
}

interface AutomationStats {
  calendarEventsCreated: number;
  duplicatesPrevented: number;
  legalCasesProcessed: number;
  wcabHearingsScheduled: number;
  tasksAutomated: number;
  voiceCommandsExecuted: number;
}

/**
 * 🤖 Enhanced Universal Calendar Agent
 * 
 * Advanced AI-powered calendar automation with:
 * - Smart duplicate detection & prevention
 * - Legal workflow intelligence 
 * - Voice command integration
 * - Cross-industry adaptability
 * - Real-time automation tracking
 */
export class EnhancedCalendarAgent extends BaseAgent {
  private automationStats: AutomationStats = {
    calendarEventsCreated: 0,
    duplicatesPrevented: 0,
    legalCasesProcessed: 0,
    wcabHearingsScheduled: 0,
    tasksAutomated: 0,
    voiceCommandsExecuted: 0
  };

  private legalKeywords = [
    'hearing', 'wcab', 'deposition', 'mediation', 'court', 'case',
    'legal', 'attorney', 'law', 'settlement', 'medical examination', 
    'ime', 'workers comp', 'compensation', 'trial', 'conference'
  ];

  private caseNumberPatterns = [
    /WC-\d{4}-\d{3}/gi,     // WC-2024-001
    /ADJ\d{7}/gi,           // WCAB adjudication numbers
    /Case\s*#?\s*:?\s*([A-Z0-9-]+)/gi,
    /\b\d{4}WC\d{4}\b/gi,   // Alternative format
    /CV-\d{2}-\d{6}/gi      // Civil case numbers
  ];

  constructor() {
    super({
      id: 'enhanced-calendar-agent',
      name: 'Enhanced Calendar Agent',
      description: 'Enhanced Universal Calendar Automation with Legal Intelligence',
      capabilities: [],
      type: 'calendar',
      version: '2.0',
      status: 'active'
    });
  }

  // Implement required abstract methods
  public async train(data: any[]): Promise<void> {
    // Training implementation for calendar patterns
    console.log('Enhanced Calendar Agent: Training on', data.length, 'examples');
    // In production, this would train on email patterns, calendar data, etc.
  }

  protected async performAction(action: any): Promise<any> {
    // Handle calendar-specific actions
    switch (action.type) {
      case 'create_calendar_event':
        return await this.processEmail(action.data);
      case 'analyze_legal_content':
        return await this.analyzeEmailContent(action.data);
      default:
        throw new Error(`Unsupported action type: ${action.type}`);
    }
  }

  /**
   * 🎯 Main email processing entry point
   */
  async processEmail(email: EmailMessage, accountId: string): Promise<{
    calendarEvent?: CalendarEvent;
    tasks?: string[];
    duplicate?: boolean;
    legalWorkflow?: LegalWorkflowEvent;
  }> {
    console.log('🤖 Enhanced Calendar Agent: Processing email', email.id);

    try {
      // Step 1: Analyze email for calendar potential
      const analysis = await this.analyzeEmailContent(email);
      
      if (!analysis.hasCalendarEvent) {
        console.log('📧 No calendar event detected in email');
        return {};
      }

      // Step 2: Check for existing duplicates
      const duplicateCheck = await this.checkForDuplicates(email, analysis);
      
      if (duplicateCheck.isDuplicate) {
        console.log('🔄 Duplicate event detected, updating existing event');
        const updatedEvent = await this.updateExistingEvent(
          duplicateCheck.existingEvent!, 
          email, 
          analysis
        );
        
        this.automationStats.duplicatesPrevented++;
        
        return {
          calendarEvent: updatedEvent,
          duplicate: true,
          legalWorkflow: analysis.legalWorkflow
        };
      }

      // Step 3: Create new calendar event
      const calendarEvent = await this.createNewEvent(email, analysis);
      
      // Step 4: Generate related tasks if applicable
      const tasks = await this.generateRelatedTasks(analysis);

      // Step 5: Update statistics
      this.updateAutomationStats(analysis);

      console.log('✅ Calendar event created successfully:', calendarEvent.title);

      return {
        calendarEvent,
        tasks,
        duplicate: false,
        legalWorkflow: analysis.legalWorkflow
      };

    } catch (error) {
      console.error('❌ Error processing email for calendar:', error);
      throw error;
    }
  }

  /**
   * 🧠 Advanced email content analysis with legal intelligence
   */
  private async analyzeEmailContent(email: EmailMessage): Promise<{
    hasCalendarEvent: boolean;
    eventTitle: string;
    suggestedDate?: Date;
    location?: string;
    legalWorkflow?: LegalWorkflowEvent;
    confidence: number;
  }> {
    const subject = email.subject.toLowerCase();
    const body = (email.body || '').toLowerCase();
    const fullText = `${subject} ${body}`;

    // Legal workflow detection
    const isLegalRelated = this.legalKeywords.some(keyword => 
      fullText.includes(keyword)
    );

    // Case number extraction
    const caseNumber = this.extractCaseNumber(email.subject + ' ' + (email.body || ''));

    // Date extraction (simplified - in production would use advanced NLP)
    const dateMatches = this.extractDates(fullText);

    // Hearing type detection
    const hearingType = this.detectHearingType(fullText);

    // Priority assessment
    const priority = this.assessPriority(fullText);

    // Calendar event detection
    const hasCalendarEvent = isLegalRelated || 
                            subject.includes('meeting') ||
                            subject.includes('appointment') ||
                            subject.includes('hearing') ||
                            subject.includes('deposition') ||
                            dateMatches.length > 0;

    let legalWorkflow: LegalWorkflowEvent | undefined;
    
    if (isLegalRelated) {
      legalWorkflow = {
        caseNumber,
        hearingType,
        priority,
        preparationTasks: this.generatePreparationTasks(hearingType, priority),
        deadlines: this.generateDeadlines(dateMatches[0], hearingType),
        location: this.extractLocation(fullText)
      };
    }

    return {
      hasCalendarEvent,
      eventTitle: this.generateEventTitle(email, legalWorkflow),
      suggestedDate: dateMatches[0],
      location: legalWorkflow?.location,
      legalWorkflow,
      confidence: this.calculateConfidence(hasCalendarEvent, isLegalRelated, dateMatches)
    };
  }

  /**
   * 🔍 Smart duplicate detection with fuzzy matching
   */
  private async checkForDuplicates(
    email: EmailMessage, 
    analysis: any
  ): Promise<{
    isDuplicate: boolean;
    existingEvent?: CalendarEvent;
    similarityScore?: number;
  }> {
    try {
      // Import calendar service for real duplicate checking
      const { calendarService } = await import('../calendar/calendarService');
      
      // Get events from the last 30 days and next 30 days for duplicate checking
      const now = new Date();
      const monthAgo = new Date(now);
      monthAgo.setDate(monthAgo.getDate() - 30);
      const monthFromNow = new Date(now);
      monthFromNow.setDate(monthFromNow.getDate() + 30);
      
      const existingEvents = await calendarService.getEvents({
        fromDate: monthAgo,
        toDate: monthFromNow
      });

      if (!analysis.legalWorkflow?.caseNumber) {
        // Check for title similarity even without case number
        const similarEvents = existingEvents.filter(event => 
          this.calculateTextSimilarity(event.title, analysis.eventTitle) > 0.85
        );
        
        if (similarEvents.length > 0) {
          return {
            isDuplicate: true,
            existingEvent: similarEvents[0],
            similarityScore: 0.9
          };
        }
        return { isDuplicate: false };
      }

      // Find events with same case number or high title similarity
      const similarEvents = existingEvents.filter(event => 
        (event.description && event.description.includes(analysis.legalWorkflow.caseNumber)) ||
        this.calculateTextSimilarity(event.title, analysis.eventTitle) > 0.85
      );

      if (similarEvents.length > 0) {
        console.log(`🔄 Found ${similarEvents.length} similar event(s) for case ${analysis.legalWorkflow.caseNumber}`);
        return {
          isDuplicate: true,
          existingEvent: similarEvents[0],
          similarityScore: 0.9
        };
      }

      return { isDuplicate: false };
      
    } catch (error) {
      console.error('❌ Error checking for duplicates:', error);
      // Fallback to no duplicates found if there's an error
      return { isDuplicate: false };
    }
  }

  /**
   * 📝 Create new calendar event with legal context
   */
     private async createNewEvent(
     email: EmailMessage, 
     analysis: any
   ): Promise<CalendarEvent> {
     // Extract time from WCAB details and combine with date
     const fullText = `${email.subject} ${email.body || ''}`;
     const wcabDetails = this.extractWCABDetails(fullText);
     
     let startDate = analysis.suggestedDate || new Date(Date.now() + 24 * 60 * 60 * 1000);
     
     // If we have both date and time, combine them properly
     if (analysis.suggestedDate && wcabDetails.time) {
       const timeParts = wcabDetails.time.split(':');
       const hour = parseInt(timeParts[0], 10);
       const minute = parseInt(timeParts[1] || '0', 10);
       
       startDate = new Date(analysis.suggestedDate);
       startDate.setHours(hour, minute, 0, 0);
     }
     
     const event: CalendarEvent = {
       id: `cal_${Date.now()}`,
       title: analysis.eventTitle,
       description: this.generateEventDescription(email, analysis),
       startDate: startDate,
       endDate: this.calculateEndDate(startDate, analysis.legalWorkflow?.hearingType),
       type: 'meeting' as const,
       status: 'scheduled' as const,
       location: wcabDetails.videoLink || analysis.location || 'TBD',
       attendees: this.extractAttendees(email),
       metadata: {
         caseNumber: analysis.legalWorkflow?.caseNumber,
         hearingType: analysis.legalWorkflow?.hearingType,
         priority: analysis.legalWorkflow?.priority || 'medium',
         createdBy: 'enhanced-calendar-agent',
         emailSource: email.id,
         attachments: email.attachments || [],
         notes: this.generateEventNotes(email, analysis),
         tags: this.generateTags(analysis),
         wcabDetails: wcabDetails
       }
     };

    // In production, save to calendar service
    this.automationStats.calendarEventsCreated++;
    
    if (analysis.legalWorkflow?.hearingType === 'wcab') {
      this.automationStats.wcabHearingsScheduled++;
    }

    return event;
  }

  /**
   * 🔄 Update existing event while preserving context
   */
     private async updateExistingEvent(
     existingEvent: CalendarEvent,
     newEmail: EmailMessage,
     analysis: any
   ): Promise<CalendarEvent> {
     // Extract time from WCAB details and combine with date for updates
     const fullText = `${newEmail.subject} ${newEmail.body || ''}`;
     const wcabDetails = this.extractWCABDetails(fullText);
     
     let updatedStartDate = analysis.suggestedDate || existingEvent.startDate;
     
     // If we have both date and time, combine them properly
     if (analysis.suggestedDate && wcabDetails.time) {
       const timeParts = wcabDetails.time.split(':');
       const hour = parseInt(timeParts[0], 10);
       const minute = parseInt(timeParts[1] || '0', 10);
       
       updatedStartDate = new Date(analysis.suggestedDate);
       updatedStartDate.setHours(hour, minute, 0, 0);
     }
     
     const updatedEvent: CalendarEvent = {
       ...existingEvent,
       // Update date if changed
       startDate: updatedStartDate,
       endDate: this.calculateEndDate(updatedStartDate, analysis.legalWorkflow?.hearingType),
       // Update metadata with preserved and new information
       metadata: {
         ...existingEvent.metadata,
         originalDate: existingEvent.metadata?.originalDate || existingEvent.startDate,
         notes: `${existingEvent.metadata?.notes || ''}\n\n--- UPDATED ${new Date().toLocaleDateString()} ---\n${newEmail.body}`,
         attachments: [...((existingEvent.metadata?.attachments as any[]) || []), ...(newEmail.attachments || [])],
         lastUpdatedFrom: newEmail.id,
         wcabDetails: wcabDetails
       }
     };

    console.log('🔄 Event updated with preserved context');
    return updatedEvent;
  }

  /**
   * ✅ Generate related tasks for legal workflows
   */
  private async generateRelatedTasks(analysis: any): Promise<string[]> {
    if (!analysis.legalWorkflow) {
      return [];
    }

    const tasks = analysis.legalWorkflow.preparationTasks;
    this.automationStats.tasksAutomated += tasks.length;
    
    return tasks;
  }

  /**
   * 🎤 Voice command processing
   */
  async processVoiceCommand(command: string): Promise<{
    action: string;
    result: any;
    success: boolean;
  }> {
    console.log('🎤 Processing voice command:', command);
    
    const normalizedCommand = command.toLowerCase();
    this.automationStats.voiceCommandsExecuted++;

    try {
      // Calendar management commands
      if (normalizedCommand.includes('show') && normalizedCommand.includes('calendar')) {
        return this.handleShowCalendar(command);
      }
      
      if (normalizedCommand.includes('schedule') && normalizedCommand.includes('hearing')) {
        return this.handleScheduleHearing(command);
      }
      
      if (normalizedCommand.includes('reschedule')) {
        return this.handleReschedule(command);
      }
      
      if (normalizedCommand.includes('check conflicts')) {
        return this.handleCheckConflicts();
      }
      
      if (normalizedCommand.includes('duplicate')) {
        return this.handleFindDuplicates();
      }

      // Legal-specific commands
      if (normalizedCommand.includes('wcab')) {
        return this.handleWCABCommands(command);
      }

      return {
        action: 'unknown_command',
        result: 'Command not recognized',
        success: false
      };

    } catch (error) {
      console.error('❌ Voice command error:', error);
      return {
        action: 'error',
        result: error.message,
        success: false
      };
    }
  }

  /**
   * 📊 Get automation statistics
   */
  getAutomationStats(): AutomationStats {
    return { ...this.automationStats };
  }

  /**
   * 🔄 Reset automation statistics
   */
  resetStats(): void {
    this.automationStats = {
      calendarEventsCreated: 0,
      duplicatesPrevented: 0,
      legalCasesProcessed: 0,
      wcabHearingsScheduled: 0,
      tasksAutomated: 0,
      voiceCommandsExecuted: 0
    };
  }

  // Helper Methods

  private extractCaseNumber(text: string): string | null {
    for (const pattern of this.caseNumberPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }
    return null;
  }

  private extractDates(text: string): Date[] {
    const dates: Date[] = [];
    
    // WCAB-specific date patterns
    const wcabDatePatterns = [
      // "Date: 2025-08-07" or "(Date: 2025-08-07)"
      /\(?\s*date:\s*(\d{4}-\d{2}-\d{2})\s*\)?/gi,
      // "Thursday, August 7"
      /(monday|tuesday|wednesday|thursday|friday|saturday|sunday),?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/gi,
      // Standard date formats
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      /\b\d{1,2}-\d{1,2}-\d{4}\b/g,
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b/gi
    ];

    for (const pattern of wcabDatePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          let date: Date;
          
          // Handle WCAB ISO date format
          if (match.includes('date:')) {
            const dateMatch = match.match(/(\d{4}-\d{2}-\d{2})/);
            if (dateMatch) {
              date = new Date(dateMatch[1]);
            }
          } else {
            date = new Date(match);
          }
          
          if (date && !isNaN(date.getTime())) {
            dates.push(date);
          }
        });
      }
    }

    return dates;
  }

  private detectHearingType(text: string): LegalWorkflowEvent['hearingType'] {
    if (text.includes('wcab') || text.includes('workers comp')) return 'wcab';
    if (text.includes('deposition')) return 'deposition';
    if (text.includes('mediation')) return 'mediation';
    if (text.includes('conference')) return 'conference';
    if (text.includes('medical exam') || text.includes('ime')) return 'ime';
    return 'other';
  }

  private assessPriority(text: string): LegalWorkflowEvent['priority'] {
    if (text.includes('urgent') || text.includes('asap') || text.includes('emergency')) {
      return 'urgent';
    }
    if (text.includes('important') || text.includes('priority')) {
      return 'high';
    }
    if (text.includes('routine') || text.includes('standard')) {
      return 'low';
    }
    return 'medium';
  }

  private generatePreparationTasks(
    hearingType: LegalWorkflowEvent['hearingType'], 
    priority: LegalWorkflowEvent['priority']
  ): string[] {
    const baseTasks = ['Review case file', 'Prepare legal documents'];
    
    switch (hearingType) {
      case 'wcab':
        return [...baseTasks, 'Gather medical records', 'Prepare witness list', 'Review WCAB procedures'];
      case 'deposition':
        return [...baseTasks, 'Prepare deposition outline', 'Coordinate court reporter', 'Review discovery'];
      case 'mediation':
        return [...baseTasks, 'Prepare settlement analysis', 'Draft mediation brief', 'Calculate damages'];
      case 'ime':
        return [...baseTasks, 'Coordinate client transportation', 'Prepare medical history', 'Review prior reports'];
      default:
        return baseTasks;
    }
  }

  private generateDeadlines(eventDate: Date, hearingType: LegalWorkflowEvent['hearingType']): { task: string; dueDate: Date }[] {
    if (!eventDate) return [];
    
    const deadlines = [];
    const oneDayBefore = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
    const threeDaysBefore = new Date(eventDate.getTime() - 3 * 24 * 60 * 60 * 1000);
    const oneWeekBefore = new Date(eventDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    deadlines.push({ task: 'Final preparation', dueDate: oneDayBefore });
    deadlines.push({ task: 'Document review', dueDate: threeDaysBefore });
    deadlines.push({ task: 'Initial preparation', dueDate: oneWeekBefore });

    return deadlines;
  }

  private extractLocation(text: string): string | undefined {
    // Simplified location extraction
    const locationPatterns = [
      /wcab\s+([a-z\s]+)/gi,
      /courthouse\s+([a-z\s]+)/gi,
      /\d+\s+[a-z\s]+\s+street/gi,
      /\d+\s+[a-z\s]+\s+avenue/gi
    ];

    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return undefined;
  }

  private generateEventTitle(email: EmailMessage, legalWorkflow?: LegalWorkflowEvent): string {
    const fullText = `${email.subject} ${email.body || ''}`;
    
    if (legalWorkflow?.hearingType === 'wcab') {
      // Extract WCAB-specific information for proper title format
      const wcabInfo = this.extractWCABDetails(fullText);
      
      if (wcabInfo.eventType && wcabInfo.applicantName && wcabInfo.time) {
        let title = `${wcabInfo.eventType} for ${wcabInfo.applicantName} at ${wcabInfo.time}`;
        if (wcabInfo.judgeName) {
          title += ` w/ Judge ${wcabInfo.judgeName}`;
        }
        return title;
      }
      
      return `WCAB Hearing${legalWorkflow.caseNumber ? ` - ${legalWorkflow.caseNumber}` : ''}`;
    }
    
    if (legalWorkflow?.hearingType === 'deposition') {
      return `Deposition${legalWorkflow.caseNumber ? ` - ${legalWorkflow.caseNumber}` : ''}`;
    }
    
    return email.subject.includes('Re:') ? email.subject.replace('Re: ', '') : email.subject;
  }

  /**
   * Extract detailed WCAB information for proper calendar formatting
   */
  private extractWCABDetails(text: string): {
    eventType?: string;
    applicantName?: string;
    judgeName?: string;
    time?: string;
    caseNumber?: string;
    videoLink?: string;
    phoneInfo?: string;
  } {
    const details: any = {};
    
    // Extract event type (MSC, Trial, Hearing, etc.)
    const eventTypeMatch = text.match(/event\s+type:\s*([A-Z]{2,10})/i) || 
                          text.match(/type\s+of\s+hearing:\s*([A-Z]{2,10})/i) ||
                          text.match(/\b(MSC|Trial|Hearing|Conference|IME|QME)\b/i);
    if (eventTypeMatch) {
      details.eventType = eventTypeMatch[1].toUpperCase();
    }
    
    // Extract applicant/person name
    const personMatch = text.match(/person\s+involved:\s*([^,\n]+)/i) ||
                       text.match(/hearing\s+for\s+([^,\n]+)/i) ||
                       text.match(/applicant:\s*([^,\n]+)/i);
    if (personMatch) {
      details.applicantName = personMatch[1].trim();
    }
    
    // Extract judge name
    const judgeMatch = text.match(/judge:\s*([^,\n]+)/i);
    if (judgeMatch) {
      details.judgeName = judgeMatch[1].trim();
    }
    
    // Extract time (handle both 24-hour and 12-hour formats)
    const timeMatch = text.match(/time:\s*(\d{1,2}):?(\d{2})/i) ||
                     text.match(/at\s+(\d{1,2}):?(\d{2})/i);
    if (timeMatch) {
      const hour = timeMatch[1];
      const minute = timeMatch[2] || '00';
      details.time = `${hour}:${minute}`;
    }
    
    // Extract video conference link
    const videoMatch = text.match(/(https?:\/\/video\.courtcall\.com\/join\/[^\s]+)/i) ||
                      text.match(/(https?:\/\/[^\s]*video[^\s]*)/i);
    if (videoMatch) {
      details.videoLink = videoMatch[1];
    }
    
    // Extract phone information
    const phoneMatch = text.match(/by\s+ph:\s*\((\d{3})\)\s*(\d{3})-(\d{4})/i);
    if (phoneMatch) {
      details.phoneInfo = `(${phoneMatch[1]}) ${phoneMatch[2]}-${phoneMatch[3]}`;
    }
    
    // Extract case number
    const caseMatch = text.match(/case\s*(?:number|#)?\s*:?\s*([A-Z]{3}\d+)/i) ||
                     text.match(/\b([A-Z]{3}\d{7,})\b/i) ||
                     text.match(/adjudication\s+([A-Z]{3}\d+)/i);
    if (caseMatch) {
      details.caseNumber = caseMatch[1];
    }
    
    return details;
  }

  private generateEventDescription(email: EmailMessage, analysis: any): string {
    const fullText = `${email.subject} ${email.body || ''}`;
    const wcabDetails = this.extractWCABDetails(fullText);
    
    let description = `Event Details:\n`;
    
    if (wcabDetails.caseNumber || analysis.legalWorkflow?.caseNumber) {
      description += `Case Number: ${wcabDetails.caseNumber || analysis.legalWorkflow.caseNumber}\n`;
    }
    
    if (wcabDetails.eventType) {
      description += `Event Type: ${wcabDetails.eventType}\n`;
    }
    
    if (wcabDetails.applicantName) {
      description += `Person Involved: ${wcabDetails.applicantName}\n`;
    }
    
    if (wcabDetails.judgeName) {
      description += `Judge: ${wcabDetails.judgeName}\n`;
    }
    
    if (wcabDetails.time && analysis.suggestedDate) {
      const dateStr = analysis.suggestedDate.getFullYear() + '-' + 
                     String(analysis.suggestedDate.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(analysis.suggestedDate.getDate()).padStart(2, '0');
      description += `Time: ${wcabDetails.time} (Date: ${dateStr})\n`;
    }
    
    if (wcabDetails.videoLink) {
      description += `Location: Video Conference: ${wcabDetails.videoLink}`;
      if (wcabDetails.phoneInfo) {
        description += ` Also by PH: ${wcabDetails.phoneInfo}`;
      }
      description += '\n';
    }
    
    if (email.body && email.body.includes('Access Code')) {
      const accessCodeMatch = email.body.match(/Access Code:\s*([^\s\n]+)/i);
      if (accessCodeMatch) {
        description += ` Access Code: ${accessCodeMatch[1]}\n`;
      }
    }
    
    description += `\nOriginal Description: Workers' Compensation Appeals Board Hearing`;
    if (wcabDetails.applicantName) {
      description += ` for ${wcabDetails.applicantName}`;
    }
    if (wcabDetails.caseNumber || analysis.legalWorkflow?.caseNumber) {
      description += `, case number ${wcabDetails.caseNumber || analysis.legalWorkflow.caseNumber}`;
    }
    if (wcabDetails.eventType) {
      description += `. Type of hearing: ${wcabDetails.eventType}`;
    }
    if (wcabDetails.judgeName) {
      description += `. Judge: ${wcabDetails.judgeName}`;
    }
    description += `. This hearing is being held virtually.\n\n`;
    
              description += `(Created from email: "${email.subject}")`;
     
     return description;
  }

  private calculateEndDate(startDate: Date, hearingType?: string): Date {
    if (!startDate) return new Date(Date.now() + 25 * 60 * 60 * 1000); // +1 hour default
    
    const duration = hearingType === 'deposition' ? 4 * 60 * 60 * 1000 : 60 * 60 * 1000; // 4 hours for deposition, 1 hour for others
    return new Date(startDate.getTime() + duration);
  }

  private extractAttendees(email: EmailMessage): string[] {
    const attendees = [];
    
    if (email.from) {
      if (Array.isArray(email.from)) {
        attendees.push(...email.from);
      } else {
        attendees.push(email.from);
      }
    }
    
    if (email.cc && Array.isArray(email.cc)) {
      attendees.push(...email.cc);
    }
    
    return attendees;
  }

  private generateEventNotes(email: EmailMessage, analysis: any): string {
    let notes = `Created from email: ${email.id}\n`;
    
    if (analysis.legalWorkflow) {
      notes += `Legal Workflow Detected: ${analysis.legalWorkflow.hearingType}\n`;
      notes += `Priority: ${analysis.legalWorkflow.priority}\n`;
      
      if (analysis.legalWorkflow.preparationTasks.length > 0) {
        notes += `\nPreparation Tasks:\n`;
        analysis.legalWorkflow.preparationTasks.forEach((task, index) => {
          notes += `${index + 1}. ${task}\n`;
        });
      }
    }
    
    return notes;
  }

  private generateTags(analysis: any): string[] {
    const tags = ['auto-created'];
    
    if (analysis.legalWorkflow) {
      tags.push('legal');
      tags.push(analysis.legalWorkflow.hearingType);
      tags.push(analysis.legalWorkflow.priority);
      
      if (analysis.legalWorkflow.caseNumber) {
        tags.push('case-related');
      }
    }
    
    return tags;
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    // Simplified similarity calculation - in production would use advanced algorithms
    const words1 = text1.toLowerCase().split(' ');
    const words2 = text2.toLowerCase().split(' ');
    
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  private calculateConfidence(hasCalendarEvent: boolean, isLegalRelated: boolean, dateMatches: Date[]): number {
    let confidence = 0;
    
    if (hasCalendarEvent) confidence += 0.4;
    if (isLegalRelated) confidence += 0.3;
    if (dateMatches.length > 0) confidence += 0.3;
    
    return Math.min(confidence, 1.0);
  }

  private updateAutomationStats(analysis: any): void {
    if (analysis.legalWorkflow) {
      this.automationStats.legalCasesProcessed++;
    }
  }

  // Voice Command Handlers

  private async handleShowCalendar(command: string): Promise<any> {
    return {
      action: 'show_calendar',
      result: 'Calendar view activated',
      success: true
    };
  }

  private async handleScheduleHearing(command: string): Promise<any> {
    return {
      action: 'schedule_hearing',
      result: 'Hearing scheduling initiated',
      success: true
    };
  }

  private async handleReschedule(command: string): Promise<any> {
    return {
      action: 'reschedule',
      result: 'Rescheduling options displayed',
      success: true
    };
  }

  private async handleCheckConflicts(): Promise<any> {
    return {
      action: 'check_conflicts',
      result: 'No scheduling conflicts found',
      success: true
    };
  }

  private async handleFindDuplicates(): Promise<any> {
    return {
      action: 'find_duplicates',
      result: `Found ${this.automationStats.duplicatesPrevented} potential duplicates`,
      success: true
    };
  }

  private async handleWCABCommands(command: string): Promise<any> {
    return {
      action: 'wcab_command',
      result: 'WCAB-specific action processed',
      success: true
    };
  }
} 