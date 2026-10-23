import { Capability, CapabilityContext } from '../types/capabilities';
import { aiCalendarService } from '../services/calendar/AiCalendarService';
import { EmailAnalysis, EmailAnalysisMeetingDetails } from '../services/email/types';
import { GoogleCalendarEvent } from '../services/calendar/googleCalendarService';
import { Task, TaskPriority, TaskStatus } from '../types/task';
import { TaskService } from '../services/TaskService';
import { AIServiceFactory } from '../services/ai/aiServiceFactory';

// TODO: Define a more specific type for GoogleCalendarEvent if available
// For now, using 'any' for the createdEvent output.

export const createCalendarEventFromAnalysisCapability: Capability = {
  id: 'calendar-create-event-from-analysis',
  name: 'Create or Update Calendar Event and Tasks from Email Analysis',
  description: 'Creates or updates a Google Calendar event based on email analysis. If an event for the same case number exists, it is moved and updated, preserving notes. Also creates tasks from action items in the analysis.',
  category: 'Calendar',
  version: '1.1.0',
  inputParameters: [
    { name: 'emailAnalysis', type: 'EmailAnalysis', description: 'Full analysis result from an email, including meeting details and action items.', required: true },
    { name: 'emailSubject', type: 'string', description: 'Subject of the email from which details were extracted.', required: true },
    { name: 'emailMessageId', type: 'string', description: 'Optional: ID of the source email message.', required: false },
    { name: 'emailThreadId', type: 'string', description: 'Optional: ID of the source email thread.', required: false },
  ],
  outputParameters: [
    { name: 'createdEvent', type: 'GoogleCalendarEvent', description: 'Event object returned by the Google Calendar API upon successful creation or update, or null if failed.', required: true },
    { name: 'createdTasks', type: 'Task[]', description: 'Array of tasks created from action items in the email analysis.', required: false },
  ],
  target: {
    type: 'service',
    identifier: 'AiCalendarService.createEventFromAnalysis_and_Tasks',
  },
  execute: async (
    input: unknown,
    _context: CapabilityContext
  ): Promise<{ createdEvent: GoogleCalendarEvent | null; createdTasks: Task[] }> => {
    const typedInput = input as {
      emailAnalysis: EmailAnalysis;
      emailSubject: string;
      emailMessageId?: string;
      emailThreadId?: string;
    };

    if (!typedInput.emailAnalysis || !typedInput.emailAnalysis.meetingDetails || !typedInput.emailAnalysis.meetingDetails.eventDate || !typedInput.emailAnalysis.meetingDetails.eventTime || !typedInput.emailSubject) {
      throw new Error('Missing required input parameters: emailAnalysis (with meetingDetails, eventDate, eventTime) and emailSubject for ' + createCalendarEventFromAnalysisCapability.id);
    }

    const meetingDetails = typedInput.emailAnalysis.meetingDetails;

    let event: GoogleCalendarEvent | null = null;
    const createdTasks: Task[] = [];

    try {
      const caseNumber = meetingDetails.caseNumber;

      if (caseNumber) {
        console.log(`[${createCalendarEventFromAnalysisCapability.id}] Case number found: ${caseNumber}. Attempting to find existing event.`);
        const existingEvent = await aiCalendarService.findEventByCaseNumber(caseNumber);
        if (existingEvent && existingEvent.id) {
          console.log(`[${createCalendarEventFromAnalysisCapability.id}] Existing event found (ID: ${existingEvent.id}). Attempting to update (move & merge).`);
          event = await aiCalendarService.updateEvent(
            existingEvent.id,
            meetingDetails,
            typedInput.emailSubject,
            typedInput.emailMessageId,
            typedInput.emailThreadId
          );
          if (event) {
            console.log(`[${createCalendarEventFromAnalysisCapability.id}] Event ID ${existingEvent.id} 'moved and updated' successfully.`);
          } else {
            console.warn(`[${createCalendarEventFromAnalysisCapability.id}] Failed to 'move and update' event ID ${existingEvent.id}.`);
          }
        } else {
          console.log(`[${createCalendarEventFromAnalysisCapability.id}] No existing event found for case number ${caseNumber}. Proceeding to create a new event.`);
        }
      } else {
        console.log(`[${createCalendarEventFromAnalysisCapability.id}] No case number provided in meetingDetails. Proceeding to create a new event.`);
      }

      if (!event) {
        console.log(`[${createCalendarEventFromAnalysisCapability.id}] Calling aiCalendarService.createEventFromAnalysis to create new event.`);
        event = await aiCalendarService.createEventFromAnalysis(
          meetingDetails,
          typedInput.emailSubject,
          typedInput.emailMessageId,
          typedInput.emailThreadId
        );
        if (event) {
          console.log(`[${createCalendarEventFromAnalysisCapability.id}] New event created successfully.`);
        } else {
           console.error(`[${createCalendarEventFromAnalysisCapability.id}] Failed to create new event.`);
        }
      }

      if (event && typedInput.emailAnalysis.actionItems && typedInput.emailAnalysis.actionItems.length > 0) {
        console.log(`[${createCalendarEventFromAnalysisCapability.id}] Event ${event.id ? 'processed' : 'creation failed'}. Proceeding to task creation from action items...`);
        
        let taskServiceInstance: TaskService;
        try {
            const aiService = AIServiceFactory.getInstance();
            taskServiceInstance = new TaskService(aiService);
        } catch (factoryError) {
            console.error(`[${createCalendarEventFromAnalysisCapability.id}] Failed to instantiate AIService or TaskService:`, factoryError);
            return { createdEvent: event, createdTasks: [] };
        }

        for (const actionItem of typedInput.emailAnalysis.actionItems) {
          // Handle both string and object formats for action items
          const actionItemTitle = typeof actionItem === 'string' ? actionItem : actionItem.text;
          if (!actionItemTitle || actionItemTitle.trim() === '') {
            console.warn(`[${createCalendarEventFromAnalysisCapability.id}] Empty action item title found, skipping task creation for this item.`);
            continue;
          }

          const taskInput: Omit<Task, 'id'> = {
            title: actionItemTitle,
            description: `Task derived from email analysis. Related to calendar event: '${event.summary || 'N/A'}' (ID: ${event.id || 'N/A'}). Case: ${meetingDetails.caseNumber || 'N/A'}. Source Email Subject: '${typedInput.emailSubject}'.`,
            priority: TaskPriority.MEDIUM,
            status: TaskStatus.TODO,
            estimatedDuration: 30,
            tags: ['email-action', 'calendar-related', 'genieflow-task'],
            created: new Date(),
            lastModified: new Date(),
            metadata: {
              calendarEventId: event.id || null,
              calendarEventSummary: event.summary || null,
              sourceEmailId: typedInput.emailMessageId || null,
              sourceEmailSubject: typedInput.emailSubject || null,
              genieflowCaseNumber: meetingDetails.caseNumber || null,
              genieflowEventType: meetingDetails.eventType || null,
              originCapability: createCalendarEventFromAnalysisCapability.id,
              processedTimestamp: new Date().toISOString(),
            }
          };

          try {
            console.log(`[${createCalendarEventFromAnalysisCapability.id}] Creating task: "${taskInput.title}"`);
            const createdTask = await taskServiceInstance.createTask(taskInput);
            if (createdTask) {
              createdTasks.push(createdTask);
              console.log(`[${createCalendarEventFromAnalysisCapability.id}] Task created: ${createdTask.id} - ${createdTask.title}`);
            } else {
              console.warn(`[${createCalendarEventFromAnalysisCapability.id}] TaskService.createTask returned null for action item "${actionItemTitle}".`);
            }
          } catch (taskError) {
            console.error(`[${createCalendarEventFromAnalysisCapability.id}] Error creating task for action item "${actionItemTitle}":`, taskError);
          }
        }
      } else if (event) {
        if (!typedInput.emailAnalysis.actionItems || typedInput.emailAnalysis.actionItems.length === 0) {
            console.log(`[${createCalendarEventFromAnalysisCapability.id}] No action items found in emailAnalysis for event ${event.id}. Skipping task creation.`);
        }
      }
      
      return { createdEvent: event, createdTasks };
    } catch (error: unknown) {
      console.error(`Error executing ${createCalendarEventFromAnalysisCapability.id}:`, error);
      // Re-throwing allows the caller (e.g., an orchestrator) to handle it.
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to process calendar event via ${createCalendarEventFromAnalysisCapability.id}: ${errorMessage}`);
    }
  },
  exampleUsage: {
    meetingDetails: {
      eventTitle: 'Case Review Hearing',
      caseNumber: 'CV-2024-12345',
      eventType: 'Hearing',
      eventDate: '2024-09-15',
      eventTime: '10:00 AM',
      endTime: '11:00 AM',
      location: 'Courtroom 5B',
      attendees: ['client@example.com', 'opposing_counsel@example.com'],
      description: 'Initial hearing for case CV-2024-12345.',
      personInvolved: 'John Doe',
      judgeName: 'Judge Smith',
    },
    emailSubject: 'Fwd: Hearing Schedule for CV-2024-12345',
    emailMessageId: 'msg-f:1234567890',
    emailThreadId: 'thread-f:0987654321',
  },
  tags: [
    'calendar',
    'google-calendar',
    'email-integration',
    'scheduling',
    'event-creation',
    'event-update',
    'deduplication',
    'modern-ui',
    'system-style',
    'robust',
  ],
  permissionsRequired: ['google_calendar:write'],
};

export const updateCalendarEventCapability: Capability = {
  id: 'calendar-update-event',
  name: 'Update Calendar Event from Email Analysis',
  description: 'Updates an existing Google Calendar event based on details extracted from an email analysis.',
  category: 'Calendar',
  version: '1.0.0',
  inputParameters: [
    { name: 'eventId', type: 'string', description: 'The ID of the calendar event to update.', required: true },
    { name: 'meetingDetails', type: 'EmailAnalysisMeetingDetails', description: 'Object containing updated details for the event.', required: true },
    { name: 'emailSubject', type: 'string', description: 'The subject of the email that triggered the update.', required: true },
    { name: 'emailMessageId', type: 'string', description: 'Optional ID of the source email message for the update.', required: false },
    { name: 'emailThreadId', type: 'string', description: 'Optional ID of the source email thread for the update.', required: false },
  ],
  outputParameters: [
    { name: 'updatedEvent', type: 'GoogleCalendarEvent', description: 'The updated event object from Google Calendar API, or null if failed.', required: true },
  ],
  target: {
    type: 'service',
    identifier: 'AiCalendarService.updateEvent',
  },
  execute: async (
    input: unknown,
    _context: CapabilityContext
  ): Promise<{ updatedEvent: GoogleCalendarEvent | null }> => {
    const typedInput = input as {
      eventId: string;
      meetingDetails: EmailAnalysisMeetingDetails;
      emailSubject: string;
      emailMessageId?: string;
      emailThreadId?: string;
    };
    if (!typedInput.eventId || !typedInput.meetingDetails || !typedInput.emailSubject) {
      throw new Error('Missing required input parameters: eventId, meetingDetails, and emailSubject for calendar-update-event.');
    }
    try {
      const event = await aiCalendarService.updateEvent(
        typedInput.eventId,
        typedInput.meetingDetails,
        typedInput.emailSubject,
        typedInput.emailMessageId,
        typedInput.emailThreadId
      );
      return { updatedEvent: event };
    } catch (error: unknown) {
      console.error(`Error executing ${updateCalendarEventCapability.id}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to update calendar event ${typedInput.eventId}: ${errorMessage}`);
    }
  },
  exampleUsage: {
    eventId: "existing_event_abcdef123456",
    meetingDetails: {
      eventTitle: "UPDATED Case Review Hearing",
      caseNumber: "CV-2024-12345",
      eventType: "Hearing",
      eventDate: "2024-09-16", // Date changed
      eventTime: "02:30 PM",   // Time changed
      location: "Courtroom 5B - Virtual Link Added",
      attendees: ["client@example.com", "opposing_counsel@example.com", "paralegal@example.com"],
      description: "Updated hearing details for case CV-2024-12345. Now includes virtual attendance option.",
      personInvolved: "John Doe",
      judgeName: "Judge Smith"
    },
    emailSubject: "URGENT UPDATE: Hearing Schedule for CV-2024-12345 Changed",
    emailMessageId: "msg-f:1234567899",
    emailThreadId: "thread-f:0987654321"
  }
};

export const findCalendarEventByCaseNumberCapability: Capability = {
  id: 'calendar-find-event-by-casenumber',
  name: 'Find Calendar Event by Case Number',
  description: 'Finds a Google Calendar event based on a specific case number stored in its extended properties.',
  category: 'Calendar',
  version: '1.0.0',
  inputParameters: [
    { name: 'caseNumber', type: 'string', description: 'The case number to search for.', required: true },
  ],
  outputParameters: [
    { name: 'foundEvent', type: 'GoogleCalendarEvent', description: 'The event object from Google Calendar API if found, or null.', required: true },
  ],
  target: {
    type: 'service',
    identifier: 'AiCalendarService.findEventByCaseNumber',
  },
  execute: async (
    input: unknown,
    _context: CapabilityContext
  ): Promise<{ foundEvent: GoogleCalendarEvent | null }> => {
    const typedInput = input as { caseNumber: string };
    if (!typedInput.caseNumber) {
      throw new Error('Missing required input parameter: caseNumber for calendar-find-event-by-casenumber.');
    }
    try {
      const event = await aiCalendarService.findEventByCaseNumber(typedInput.caseNumber);
      return { foundEvent: event };
    } catch (error: unknown) {
      console.error(`Error executing ${findCalendarEventByCaseNumberCapability.id}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to find calendar event by case number ${typedInput.caseNumber}: ${errorMessage}`);
    }
  },
  tags: ['calendar', 'google-calendar', 'search', 'event-retrieval', 'case-management'],
  permissionsRequired: ['google_calendar:read'], // Assuming read permission is sufficient
  exampleUsage: {
    caseNumber: "CV-2024-12345"
  }
};

// To register this capability, import and call:
// import { useCapabilityRegistryStore } from '../stores/capabilityRegistryStore';
// import { createCalendarEventFromAnalysisCapability } from './calendarCapabilities';
// useCapabilityRegistryStore.getState().registerCapability(createCalendarEventFromAnalysisCapability);
// This should be done once during app initialization (e.g., in App.tsx or a setup file).

// Add other calendar-related capabilities here, e.g., for updating or finding events.