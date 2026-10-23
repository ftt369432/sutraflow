import { CalendarEvent, TaskDefinition, EventReminder, EmailEventDetails } from './EmailEventAnalyzer';
import { EmailMessage } from '../email/types';
import { CalendarTaskServiceAdapter } from '../tasks/CalendarTaskServiceAdapter';
import { addDays, addHours, addMinutes, format } from 'date-fns';

export interface CalendarService {
  createEvent(event: CalendarEvent): Promise<string>;
  updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<void>;
  deleteEvent(eventId: string): Promise<void>;
  getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]>;
  findEventByCaseNumber?(caseNumber: string): Promise<CalendarEvent | null>;
}

export interface TaskService {
  createTask(task: TaskDefinition, eventId: string): Promise<string>;
  updateTask(taskId: string, updates: Partial<TaskDefinition>): Promise<void>;
  deleteTask(taskId: string): Promise<void>;
  getTasksForEvent(eventId: string): Promise<TaskDefinition[]>;
}

export interface ReminderService {
  scheduleReminder(reminder: EventReminder, eventId: string): Promise<string>;
  cancelReminder(reminderId: string): Promise<void>;
  updateReminder(reminderId: string, updates: Partial<EventReminder>): Promise<void>;
  getActiveReminders(): Promise<EventReminder[]>;
}

export class CalendarEventService {
  private calendarService: CalendarService;
  private taskService: CalendarTaskServiceAdapter;
  private reminderService: ReminderService;

  constructor(
    calendarService: CalendarService,
    reminderService: ReminderService
  ) {
    this.calendarService = calendarService;
    this.taskService = new CalendarTaskServiceAdapter();
    this.reminderService = reminderService;
  }

  async createEventWithTasks(
    event: CalendarEvent,
    taskDefinitions: TaskDefinition[] = []
  ): Promise<{ eventId: string; taskIds: string[]; reminderIds: string[] }> {
    try {
      console.log('📅 CalendarEventService: createEventWithTasks called for:', event.title);
      console.log('📅 CalendarEventService: Event data:', {
        title: event.title,
        startDate: event.startDate?.toISOString(),
        endDate: event.endDate?.toISOString(),
        location: event.location,
        eventType: event.eventType
      });
      
      // Validate event data before processing
      const validation = this.validateEventData(event);
      if (!validation.isValid) {
        console.warn('⚠️ Event validation issues:', validation.errors);
        // Continue with warnings but don't fail completely
      }

      console.log('📅 CalendarEventService: Calling calendarService.createEvent...');
      // Create the main calendar event
      const eventId = await this.calendarService.createEvent(event);
      console.log('✅ CalendarEventService: Event created with ID:', eventId);

      // Create comprehensive reminder workflows for the event
      const eventReminderIds = await this.createEventReminderWorkflow(event, eventId);

      // Create associated tasks with their own reminder workflows
      const taskIds: string[] = [];
      const taskReminderIds: string[] = [];
      
      for (const taskDef of taskDefinitions) {
        const taskId = await this.taskService.createTask(taskDef, eventId);
        taskIds.push(taskId);

        // Create multi-stage reminder workflow for each task
        const taskReminders = await this.createTaskReminderWorkflow(taskDef, taskId, eventId);
        taskReminderIds.push(...taskReminders);
      }

      // Create follow-up reminders after the event
      const followUpReminderIds = await this.createFollowUpReminderWorkflow(event, eventId, taskDefinitions);

      const allReminderIds = [...eventReminderIds, ...taskReminderIds, ...followUpReminderIds];

      return { eventId, taskIds, reminderIds: allReminderIds };
    } catch (error) {
      console.error('Failed to create event with tasks:', error);
      throw error;
    }
  }

  /**
   * Core calendar event processing method implementing the comprehensive flow:
   * 1. Search for existing event by case number
   * 2. If found: merge/update with full context preservation
   * 3. If not found: create new event with all attachments and tasks
   */
  async processCalendarEvent(
    eventDetails: EmailEventDetails | CalendarEvent, 
    sourceEmail: EmailMessage,
    taskDefinitions: TaskDefinition[] = []
  ): Promise<{ eventId: string; taskIds: string[]; reminderIds: string[]; isUpdate: boolean }> {
    try {
      // Handle both EmailEventDetails and CalendarEvent formats
      let caseNumber: string | undefined;
      let normalizedEventDetails: EmailEventDetails;
      
      if ('extractedData' in eventDetails) {
        // This is EmailEventDetails format
        normalizedEventDetails = eventDetails;
        caseNumber = eventDetails.extractedData.caseNumber;
      } else {
        // This is CalendarEvent format - convert to EmailEventDetails
        normalizedEventDetails = {
          title: eventDetails.title,
          dateTime: eventDetails.startDate,
          endDateTime: eventDetails.endDate,
          location: eventDetails.location,
          attendees: eventDetails.attendees,
          description: eventDetails.description,
          eventType: eventDetails.eventType as any,
          requiredActions: [],
          documents: [],
          confidence: 1.0, // High confidence since it passed validation
          extractedData: eventDetails.metadata || {}
        };
        caseNumber = eventDetails.metadata?.caseNumber;
      }
      
      console.log('📅 Processing calendar event with case number:', caseNumber);
      
      let existingEvent: CalendarEvent | null = null;
      
      // Step 1: Search for existing event by case number
      if (caseNumber && this.calendarService.findEventByCaseNumber) {
        console.log('🔍 Searching for existing event with case number:', caseNumber);
        existingEvent = await this.calendarService.findEventByCaseNumber(caseNumber);
        console.log(existingEvent ? '✅ Existing event found - will merge/update' : '📝 No existing event - will create new');
      } else {
        console.log('⚠️ No case number provided, skipping duplicate check');
      }
      
      if (existingEvent && existingEvent.id) {
        // Step 2: Merge and update existing event
        return await this.mergeAndUpdateEvent(existingEvent, normalizedEventDetails, sourceEmail, taskDefinitions);
      } else {
        // Step 3: Create new event
        return await this.createNewCalendarEvent(normalizedEventDetails, sourceEmail, taskDefinitions);
      }
    } catch (error) {
      console.error('❌ Failed to process calendar event:', error);
      throw error;
    }
  }

  /**
   * Merge new event details with existing event, preserving all historical context
   */
  private async mergeAndUpdateEvent(
    existingEvent: CalendarEvent,
    newEventDetails: EmailEventDetails,
    sourceEmail: EmailMessage,
    taskDefinitions: TaskDefinition[] = []
  ): Promise<{ eventId: string; taskIds: string[]; reminderIds: string[]; isUpdate: boolean }> {
    console.log('🔄 Merging and updating existing event:', existingEvent.id);
    
    // Calculate end time based on event type
    const endDateTime = this.calculateEndTime(newEventDetails.dateTime, newEventDetails.eventType);
    
    // Merge descriptions preserving all historical information
    const mergedDescription = this.mergeDescriptions(
      existingEvent.description || '',
      newEventDetails.description,
      sourceEmail
    );
    
    // Preserve and merge attachments
    const mergedAttachments = this.mergeAttachments(
      existingEvent.attachments || [],
      this.extractEmailAttachments(sourceEmail)
    );
    
    // Build updated event with preserved context
    const updatedEvent: Partial<CalendarEvent> = {
      // Update core event details
      title: newEventDetails.title,
      startDate: newEventDetails.dateTime,
      endDate: endDateTime,
      location: newEventDetails.location,
      attendees: [...new Set([...(existingEvent.attendees || []), ...newEventDetails.attendees])],
      
      // Preserve and enhance descriptions
      description: mergedDescription,
      
      // Preserve and merge attachments
      attachments: mergedAttachments,
      
      // Track source emails
      sourceEmails: [...(existingEvent.sourceEmails || []), sourceEmail.id],
      
      // Update metadata with new information while preserving existing
      metadata: {
        ...existingEvent.metadata,
        ...newEventDetails.extractedData,
        lastUpdated: new Date(),
        updateSource: 'email-analysis',
        originalCreatedAt: existingEvent.metadata?.originalCreatedAt || existingEvent.metadata?.createdAt,
        updateHistory: [
          ...(existingEvent.metadata?.updateHistory || []),
          {
            timestamp: new Date(),
            source: 'email-analysis',
            emailId: sourceEmail.id,
            changes: this.detectChanges(existingEvent, newEventDetails)
          }
        ]
      }
    };
    
    // Update the calendar event
    await this.calendarService.updateEvent(existingEvent.id, updatedEvent);
    
    // Handle tasks - merge with existing tasks or create new ones
    const existingTaskIds = existingEvent.relatedTasks || [];
    const newTaskIds = await this.createOrUpdateTasks(existingEvent.id, taskDefinitions, existingTaskIds);
    
    // Create update reminders
    const reminderIds = await this.createEventReminderWorkflow(
      { ...existingEvent, ...updatedEvent } as CalendarEvent, 
      existingEvent.id
    );
    
    console.log('✅ Event successfully merged and updated');
    return { 
      eventId: existingEvent.id, 
      taskIds: newTaskIds, 
      reminderIds, 
      isUpdate: true 
    };
  }

  /**
   * Create a new calendar event with full context
   */
  private async createNewCalendarEvent(
    eventDetails: EmailEventDetails,
    sourceEmail: EmailMessage,
    taskDefinitions: TaskDefinition[] = []
  ): Promise<{ eventId: string; taskIds: string[]; reminderIds: string[]; isUpdate: boolean }> {
    console.log('📝 Creating new calendar event');
    
    // Calculate end time based on event type
    const endDateTime = this.calculateEndTime(eventDetails.dateTime, eventDetails.eventType);
    
    // Extract attachments from source email
    const attachments = this.extractEmailAttachments(sourceEmail);
    
    // Build comprehensive event description
    const description = this.generateEventDescription(eventDetails, sourceEmail);
    
    const newEvent: CalendarEvent = {
      id: '', // Will be set by calendar service
      title: eventDetails.title,
      description,
      startDate: eventDetails.dateTime,
      endDate: endDateTime,
      location: eventDetails.location,
      attendees: eventDetails.attendees,
      eventType: eventDetails.eventType,
      
      // Source tracking
      sourceEmail: sourceEmail.id,
      sourceEmails: [sourceEmail.id],
      attachments,
      
      // Related tasks and reminders
      relatedTasks: [],
      reminders: [],
      
      // Comprehensive metadata
      metadata: {
        ...eventDetails.extractedData,
        confidence: eventDetails.confidence,
        createdFrom: 'email-analysis',
        createdAt: new Date(),
        originalCreatedAt: new Date(),
        sourceEmailSubject: sourceEmail.subject,
        processingVersion: '2.0'
      }
    };
    
    const result = await this.createEventWithTasks(newEvent, taskDefinitions);
    return { ...result, isUpdate: false };
  }

  /**
   * Calculate appropriate end time based on event type
   */
  private calculateEndTime(startDate: Date, eventType: string): Date {
    const durationMap: Record<string, number> = {
      'deposition': 240, // 4 hours
      'qme': 90,         // 1.5 hours
      'court-date': 60,  // 1 hour
      'appointment': 60, // 1 hour
      'meeting': 60,     // 1 hour
      'conference': 30,  // 30 minutes
      'custom': 60       // 1 hour default
    };
    
    const durationMinutes = durationMap[eventType] || 60;
    return addMinutes(startDate, durationMinutes);
  }

  /**
   * Merge event descriptions preserving historical context
   */
  private mergeDescriptions(
    existingDescription: string,
    newDescription: string,
    sourceEmail: EmailMessage
  ): string {
    const timestamp = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
    const separator = existingDescription.length > 0 ? '\n\n' : '';
    
    const updateSection = `${separator}--- Event Update (${timestamp}) ---
Source Email: "${sourceEmail.subject}"
From: ${sourceEmail.from}
${newDescription ? `Additional Notes: ${newDescription}` : ''}
Email ID: ${sourceEmail.id}`;
    
    return existingDescription + updateSection;
  }

  /**
   * Merge attachment arrays, avoiding duplicates
   */
  private mergeAttachments(existingAttachments: any[], newAttachments: any[]): any[] {
    const merged = [...existingAttachments];
    
    for (const newAttachment of newAttachments) {
      const isDuplicate = existingAttachments.some(existing => 
        existing.filename === newAttachment.filename && 
        existing.size === newAttachment.size
      );
      
      if (!isDuplicate) {
        merged.push(newAttachment);
      }
    }
    
    return merged;
  }

  /**
   * Extract attachments from email
   */
  private extractEmailAttachments(email: EmailMessage): any[] {
    // This would typically extract actual attachment data
    // For now, return metadata about attachments
    return email.attachments || [];
  }

  /**
   * Generate comprehensive event description
   */
  private generateEventDescription(eventDetails: EmailEventDetails, sourceEmail: EmailMessage): string {
    const sections = [
      'Event Details:',
      eventDetails.extractedData.caseNumber ? `Case Number: ${eventDetails.extractedData.caseNumber}` : '',
      eventDetails.extractedData.clientName ? `Client: ${eventDetails.extractedData.clientName}` : '',
      eventDetails.extractedData.judge ? `Judge: ${eventDetails.extractedData.judge}` : '',
      eventDetails.location ? `Location: ${eventDetails.location}` : '',
      eventDetails.description ? `Notes: ${eventDetails.description}` : '',
      '',
      `Source Email: "${sourceEmail.subject}"`,
      `From: ${sourceEmail.from}`,
      `Date Created: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      sourceEmail.id ? `Email ID: ${sourceEmail.id}` : ''
    ].filter(section => section.length > 0);
    
    return sections.join('\n');
  }

  /**
   * Detect changes between existing event and new details
   */
  private detectChanges(existingEvent: CalendarEvent, newEventDetails: EmailEventDetails): string[] {
    const changes: string[] = [];
    
    if (existingEvent.title !== newEventDetails.title) {
      changes.push(`Title: "${existingEvent.title}" → "${newEventDetails.title}"`);
    }
    
    if (existingEvent.startDate.getTime() !== newEventDetails.dateTime.getTime()) {
      changes.push(`Date/Time: ${existingEvent.startDate.toLocaleString()} → ${newEventDetails.dateTime.toLocaleString()}`);
    }
    
    if (existingEvent.location !== newEventDetails.location) {
      changes.push(`Location: "${existingEvent.location}" → "${newEventDetails.location}"`);
    }
    
    return changes;
  }

  /**
   * Create or update tasks for an event
   */
  private async createOrUpdateTasks(
    eventId: string, 
    taskDefinitions: TaskDefinition[], 
    existingTaskIds: string[]
  ): Promise<string[]> {
    const taskIds: string[] = [...existingTaskIds];
    
    // Create new tasks that don't already exist
    for (const taskDef of taskDefinitions) {
      const taskWithEventInfo = {
        ...taskDef,
        eventId,
        relatedEvent: `Event ${eventId}`
      };
      
      const taskId = await this.taskService.createTask(taskWithEventInfo, eventId);
      taskIds.push(taskId);
    }
    
    return taskIds;
  }

  private async createEventReminderWorkflow(event: CalendarEvent, eventId: string): Promise<string[]> {
    const reminderIds: string[] = [];
    
    // Get event-specific reminder templates based on event type
    const reminderTemplates = this.getEventReminderTemplates(event.eventType);
    
    for (const template of reminderTemplates) {
      const reminder: EventReminder = {
        id: `event-${eventId}-${template.type}-${template.offset}`,
        type: template.type as 'email' | 'popup' | 'desktop' | 'sms',
        timing: 'before',
        offset: template.offset,
        message: template.message.replace('{eventTitle}', event.title),
        eventId,
        targetDate: addMinutes(event.startDate, -template.offset)
      };
      
      const reminderId = await this.reminderService.scheduleReminder(reminder, eventId);
      reminderIds.push(reminderId);
    }

    return reminderIds;
  }

  private async createTaskReminderWorkflow(task: any, taskId: string, eventId: string): Promise<string[]> {
    const reminderIds: string[] = [];
    
    // Create multi-stage reminders for each task
    const reminderStages = [
      { offsetHours: 72, type: 'email', urgency: 'info' }, // 3 days before
      { offsetHours: 24, type: 'popup', urgency: 'warning' }, // 1 day before
      { offsetHours: 4, type: 'popup', urgency: 'urgent' }, // 4 hours before
      { offsetHours: 1, type: 'desktop', urgency: 'critical' } // 1 hour before
    ];

    for (const stage of reminderStages) {
      // Only create reminder if the task is far enough in advance
      const hoursUntilTask = (task.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60);
      
      if (hoursUntilTask > stage.offsetHours) {
        const reminder: EventReminder = {
          id: `task-${taskId}-${stage.type}-${stage.offsetHours}h`,
          type: stage.type as any,
          timing: 'before',
          offset: stage.offsetHours * 60, // convert to minutes
          message: this.generateTaskReminderMessage(task, stage),
          eventId,
          taskId,
          targetDate: addHours(task.dueDate, -stage.offsetHours)
        };
        
        const reminderId = await this.reminderService.scheduleReminder(reminder, eventId);
        reminderIds.push(reminderId);
      }
    }

    return reminderIds;
  }

  private async createFollowUpReminderWorkflow(event: CalendarEvent, eventId: string, tasks: TaskDefinition[]): Promise<string[]> {
    const reminderIds: string[] = [];
    
    // Create post-event follow-up reminders
    const followUpTemplates = this.getFollowUpTemplates(event.eventType);
    
    for (const template of followUpTemplates) {
      const reminder: EventReminder = {
        id: `followup-${eventId}-${template.type}-${template.offsetHours}h`,
        type: template.type as any,
        timing: 'after',
        offset: template.offsetHours * 60,
        message: template.message.replace('{eventTitle}', event.title),
        eventId,
        targetDate: addHours(event.startDate, template.offsetHours)
      };
      
      const reminderId = await this.reminderService.scheduleReminder(reminder, eventId);
      reminderIds.push(reminderId);
    }

    return reminderIds;
  }

  private getEventReminderTemplates(eventType: string) {
    const templates = {
      'deposition': [
        { type: 'email', offset: 20160, message: 'Reminder: {eventTitle} in 2 weeks. Begin case preparation.' }, // 2 weeks
        { type: 'email', offset: 10080, message: 'Reminder: {eventTitle} in 1 week. Finalize witness preparation.' }, // 1 week
        { type: 'popup', offset: 4320, message: 'Reminder: {eventTitle} in 3 days. Review exhibits and documents.' }, // 3 days
        { type: 'popup', offset: 1440, message: 'Reminder: {eventTitle} tomorrow. Confirm logistics and prepare materials.' }, // 1 day
        { type: 'desktop', offset: 120, message: 'Reminder: {eventTitle} in 2 hours. Final preparation time.' } // 2 hours
      ],
      'court_hearing': [
        { type: 'email', offset: 10080, message: 'Court hearing {eventTitle} in 1 week. Prepare briefs and evidence.' }, // 1 week
        { type: 'popup', offset: 2880, message: 'Court hearing {eventTitle} in 2 days. Review case strategy.' }, // 2 days
        { type: 'popup', offset: 1440, message: 'Court hearing {eventTitle} tomorrow. Confirm appearance and documents.' }, // 1 day
        { type: 'desktop', offset: 120, message: 'Court hearing {eventTitle} in 2 hours. Final review.' } // 2 hours
      ],
      'qme_exam': [
        { type: 'email', offset: 10080, message: 'QME examination {eventTitle} in 1 week. Prepare medical records.' }, // 1 week
        { type: 'popup', offset: 2880, message: 'QME examination {eventTitle} in 2 days. Review medical history.' }, // 2 days
        { type: 'popup', offset: 1440, message: 'QME examination {eventTitle} tomorrow. Confirm appointment.' }, // 1 day
        { type: 'desktop', offset: 60, message: 'QME examination {eventTitle} in 1 hour. Time to leave.' } // 1 hour
      ],
      'client_meeting': [
        { type: 'email', offset: 2880, message: 'Client meeting {eventTitle} in 2 days. Prepare agenda.' }, // 2 days
        { type: 'popup', offset: 1440, message: 'Client meeting {eventTitle} tomorrow. Review case file.' }, // 1 day
        { type: 'desktop', offset: 60, message: 'Client meeting {eventTitle} in 1 hour. Gather materials.' } // 1 hour
      ],
      'deadline': [
        { type: 'email', offset: 10080, message: 'Deadline approaching: {eventTitle} in 1 week.' }, // 1 week
        { type: 'popup', offset: 4320, message: 'Deadline approaching: {eventTitle} in 3 days.' }, // 3 days
        { type: 'popup', offset: 1440, message: 'Deadline tomorrow: {eventTitle}. Final review needed.' }, // 1 day
        { type: 'desktop', offset: 240, message: 'Deadline in 4 hours: {eventTitle}. Complete immediately.' } // 4 hours
      ]
    };

    return templates[eventType as keyof typeof templates] || templates['client_meeting'];
  }

  private generateTaskReminderMessage(task: any, stage: any): string {
    const urgencyMessages = {
      'info': `Task reminder: ${task.title} due in ${stage.offsetHours} hours. Plan your approach.`,
      'warning': `Important: ${task.title} due in ${stage.offsetHours} hours. Begin work soon.`,
      'urgent': `Urgent: ${task.title} due in ${stage.offsetHours} hours. Start immediately.`,
      'critical': `Critical: ${task.title} due in ${stage.offsetHours} hours. Complete now!`
    };

    return urgencyMessages[stage.urgency as keyof typeof urgencyMessages] || 
           `Reminder: ${task.title} due in ${stage.offsetHours} hours.`;
  }

  private getFollowUpTemplates(eventType: string) {
    const templates = {
      'deposition': [
        { type: 'email', offsetHours: 24, message: 'Follow-up: Review {eventTitle} transcript and notes.' },
        { type: 'popup', offsetHours: 72, message: 'Follow-up: Prepare post-{eventTitle} strategy memo.' }
      ],
      'court_hearing': [
        { type: 'email', offsetHours: 4, message: 'Follow-up: Document {eventTitle} outcome and next steps.' },
        { type: 'popup', offsetHours: 24, message: 'Follow-up: Update client on {eventTitle} results.' }
      ],
      'qme_exam': [
        { type: 'email', offsetHours: 24, message: 'Follow-up: Request {eventTitle} medical report.' },
        { type: 'popup', offsetHours: 168, message: 'Follow-up: Review {eventTitle} findings and plan strategy.' } // 1 week
      ],
      'client_meeting': [
        { type: 'email', offsetHours: 4, message: 'Follow-up: Send {eventTitle} summary and action items to client.' },
        { type: 'popup', offsetHours: 48, message: 'Follow-up: Check on action items from {eventTitle}.' }
      ]
    };

    return templates[eventType as keyof typeof templates] || [];
  }

  async updateEventWithTasks(
    eventId: string,
    eventUpdates: Partial<CalendarEvent>,
    newTaskDefinitions?: TaskDefinition[]
  ): Promise<void> {
    try {
      // Update the calendar event
      await this.calendarService.updateEvent(eventId, eventUpdates);

      // If new task definitions provided, recreate tasks
      if (newTaskDefinitions) {
        // Get existing tasks and remove them
        const existingTasks = await this.taskService.getTasksForEvent(eventId);
        for (const task of existingTasks) {
          if (task.id) {
            await this.taskService.deleteTask(task.id);
          }
        }

        // Create new tasks
        const updatedEvent = { ...eventUpdates, id: eventId } as CalendarEvent;
        for (const taskDef of newTaskDefinitions) {
          const taskWithEventInfo = {
            ...taskDef,
            eventId,
            dueDate: addDays(updatedEvent.startDate || new Date(), taskDef.offsetDays),
            relatedEvent: updatedEvent.title || 'Updated Event'
          };
          
          await this.taskService.createTask(taskWithEventInfo, eventId);
        }
      }
    } catch (error) {
      console.error('Failed to update event with tasks:', error);
      throw error;
    }
  }

  async deleteEventWithTasks(eventId: string): Promise<void> {
    try {
      // Get and delete all associated tasks
      const tasks = await this.taskService.getTasksForEvent(eventId);
      for (const task of tasks) {
        if (task.id) {
          await this.taskService.deleteTask(task.id);
        }
      }

      // Cancel all associated reminders
      const activeReminders = await this.reminderService.getActiveReminders();
      const eventReminders = activeReminders.filter(r => 
        r.id.includes(`event-${eventId}`) || 
        r.id.includes(`task-`) && r.id.includes(eventId) ||
        r.id.includes(`followup-${eventId}`)
      );
      for (const reminder of eventReminders) {
        await this.reminderService.cancelReminder(reminder.id);
      }

      // Delete the calendar event
      await this.calendarService.deleteEvent(eventId);
    } catch (error) {
      console.error('Failed to delete event with tasks:', error);
      throw error;
    }
  }

  generateTaskWorkflowSummary(
    event: CalendarEvent,
    taskDefinitions: TaskDefinition[]
  ): string {
    const timeline = taskDefinitions
      .sort((a, b) => a.offsetDays - b.offsetDays)
      .map(task => {
        const dueDate = addDays(event.startDate, task.offsetDays);
        const dueDateStr = format(dueDate, 'MMM dd, yyyy');
        return `• ${task.title} (${dueDateStr}) - ${task.priority} priority`;
      })
      .join('\n');

    return `Event: ${event.title}
Date: ${format(event.startDate, 'MMM dd, yyyy \'at\' h:mm a')}
Location: ${event.location || 'TBD'}

Automated Task Timeline:
${timeline}

Total Tasks: ${taskDefinitions.length}
High Priority: ${taskDefinitions.filter(t => t.priority === 'high').length}
Estimated Time: ${taskDefinitions.reduce((sum, t) => sum + (t.estimatedDuration || 0), 0)} minutes`;
  }

  getTaskTemplateForEventType(eventType: string): TaskDefinition[] {
    if (!eventType) {
      console.warn('⚠️ No event type provided, using default task template');
      return this.getDefaultTaskTemplate();
    }

    const templates: Record<string, TaskDefinition[]> = {
      deposition: [
        {
          title: 'Review case files',
          description: 'Review all relevant case files and documents',
          offsetDays: -7,
          priority: 'high',
          estimatedDuration: 120,
          reminders: [{ type: 'popup', offsetHours: 24, message: 'Review case files for deposition' }]
        },
        {
          title: 'Prepare exhibit list',
          description: 'Compile and organize exhibits for deposition',
          offsetDays: -5,
          priority: 'high',
          estimatedDuration: 90,
          reminders: [{ type: 'email', offsetHours: 12, message: 'Prepare exhibit list' }]
        },
        {
          title: 'Send exhibits to court reporter',
          description: 'Email exhibits to court reporter before deposition',
          offsetDays: -3,
          priority: 'medium',
          estimatedDuration: 30,
          reminders: [{ type: 'popup', offsetHours: 6, message: 'Send exhibits to court reporter' }]
        },
        {
          title: 'Confirm attendance',
          description: 'Confirm attendance with all parties',
          offsetDays: -1,
          priority: 'high',
          estimatedDuration: 15,
          reminders: [{ type: 'popup', offsetHours: 2, message: 'Confirm deposition attendance' }]
        }
      ],
      qme: [
        {
          title: 'Gather medical records',
          description: 'Collect all relevant medical records for QME',
          offsetDays: -10,
          priority: 'high',
          estimatedDuration: 180,
          reminders: [{ type: 'email', offsetHours: 24, message: 'Gather medical records for QME' }]
        },
        {
          title: 'Send records to QME',
          description: 'Forward medical records to QME doctor',
          offsetDays: -7,
          priority: 'high',
          estimatedDuration: 30,
          reminders: [{ type: 'popup', offsetHours: 12, message: 'Send records to QME' }]
        },
        {
          title: 'Prepare client',
          description: 'Brief client on QME process and expectations',
          offsetDays: -2,
          priority: 'medium',
          estimatedDuration: 45,
          reminders: [{ type: 'popup', offsetHours: 6, message: 'Prepare client for QME' }]
        }
      ],
      courtDate: [
        {
          title: 'Prepare legal briefs',
          description: 'Draft and review legal briefs for court appearance',
          offsetDays: -14,
          priority: 'high',
          estimatedDuration: 240,
          reminders: [{ type: 'email', offsetHours: 48, message: 'Prepare legal briefs' }]
        },
        {
          title: 'Review case law',
          description: 'Research and review relevant case law',
          offsetDays: -7,
          priority: 'high',
          estimatedDuration: 180,
          reminders: [{ type: 'popup', offsetHours: 24, message: 'Review case law' }]
        },
        {
          title: 'Organize exhibits',
          description: 'Prepare and organize all court exhibits',
          offsetDays: -3,
          priority: 'medium',
          estimatedDuration: 90,
          reminders: [{ type: 'popup', offsetHours: 12, message: 'Organize court exhibits' }]
        }
      ],
      meeting: [
        {
          title: 'Prepare agenda',
          description: 'Create and distribute meeting agenda',
          offsetDays: -2,
          priority: 'medium',
          estimatedDuration: 30,
          reminders: [{ type: 'email', offsetHours: 24, message: 'Prepare meeting agenda' }]
        },
        {
          title: 'Review materials',
          description: 'Review relevant documents and materials',
          offsetDays: -1,
          priority: 'medium',
          estimatedDuration: 60,
          reminders: [{ type: 'popup', offsetHours: 12, message: 'Review meeting materials' }]
        }
      ]
    };

    return templates[eventType] || this.getDefaultTaskTemplate();
  }

  private getDefaultTaskTemplate(): TaskDefinition[] {
    return [
      {
        title: 'Event preparation',
        description: 'Prepare for the upcoming event',
        offsetDays: -1,
        priority: 'medium',
        estimatedDuration: 60,
        reminders: [{ type: 'popup', offsetHours: 24, message: 'Prepare for upcoming event' }]
      }
    ];
  }

  validateEventData(event: CalendarEvent): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!event.title || event.title.trim().length === 0) {
      errors.push('Event title is required');
    }

    if (!event.startDate || isNaN(event.startDate.getTime())) {
      errors.push('Valid start date is required');
    }

    if (event.endDate && event.startDate && event.endDate < event.startDate) {
      errors.push('End date cannot be before start date');
    }

    if (!event.eventType) {
      errors.push('Event type is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  calculateEventMetrics(event: CalendarEvent, tasks: TaskDefinition[]): {
    totalPreparationTime: number;
    criticalPathDays: number;
    highPriorityTasks: number;
    reminderCount: number;
  } {
    const totalPreparationTime = tasks.reduce((sum, task) => sum + (task.estimatedDuration || 0), 0);
    
    const criticalPathDays = Math.abs(Math.min(...tasks.map(t => t.offsetDays), 0));
    
    const highPriorityTasks = tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length;
    
    const taskReminders = tasks.reduce((sum, task) => sum + (task.reminders?.length || 0), 0);
    const eventReminders = event.reminders?.length || 0;
    const reminderCount = taskReminders + eventReminders;

    return {
      totalPreparationTime,
      criticalPathDays,
      highPriorityTasks,
      reminderCount
    };
  }
}
