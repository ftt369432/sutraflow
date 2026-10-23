import { useState, useCallback, useEffect, useRef } from 'react';
import { EmailMessage } from '../../services/email/types';
import { CalendarEventService } from '../../services/calendar/CalendarEventService';
import { GoogleCalendarAdapter } from '../../services/calendar/GoogleCalendarAdapter';
import { GoogleCalendarService } from '../../services/calendar/GoogleCalendarService';
import { GoogleAPIClient } from '../../services/google/GoogleAPIClient';
import { SimpleTaskService, SimpleReminderService } from '../../services/calendar/SimpleTaskAndReminderServices';
import { EmailEventAnalyzer, EmailEventAnalyzerFactory } from '../../services/calendar/EmailEventAnalyzer';
import { debugCalendar } from '../../utils/calendarDebugger';
import { toast } from 'sonner';

/**
 * Hook for managing calendar integration with email processing
 * Follows React best practices: single responsibility, composable, testable
 */
export const useEmailCalendarIntegration = () => {
  // Calendar service initialization
  const [calendarEventService] = useState(() => {
    try {
      console.log('📅 Initializing CalendarEventService with Google Calendar integration');
      
      // Create Google API client instance
      const googleApiClient = GoogleAPIClient.getInstance();
      
      // Create Google Calendar service with token getter
      const googleCalendarService = new GoogleCalendarService(async () => {
        const token = googleApiClient.getAccessToken();
        if (!token) {
          console.warn('⚠️ No Google access token available for calendar operations');
        }
        return token;
      });
      
      // Create adapter and services
      const calendarAdapter = new GoogleCalendarAdapter(googleCalendarService);
      const reminderService = new SimpleReminderService();
      
      console.log('✅ CalendarEventService initialized with Google Calendar integration');
      return new CalendarEventService(calendarAdapter, reminderService);
    } catch (error) {
      console.error('❌ Failed to initialize Google Calendar integration:', error);
      console.log('📅 Falling back to mock services');
      
      // Fallback to mock services if Google Calendar setup fails
      return new CalendarEventService(
        {
          createEvent: async (event: any) => {
            console.log('📅 Mock: Creating event:', event.title);
            return `event-${Date.now()}`;
          },
          updateEvent: async (id: string, updates: any) => {
            console.log('📅 Mock: Updating event:', id, updates);
          },
          deleteEvent: async (id: string) => {
            console.log('📅 Mock: Deleting event:', id);
          },
          getEvents: async (start: Date, end: Date) => {
            console.log('📅 Mock: Getting events from', start, 'to', end);
            return [];
          }
        },
        {
          scheduleReminder: async (reminder: any, eventId?: string) => {
            console.log('⏰ Mock: Scheduling reminder:', reminder.message);
            return `reminder-${Date.now()}`;
          },
          cancelReminder: async (id: string) => {
            console.log('⏰ Mock: Cancelling reminder:', id);
          },
          updateReminder: async (id: string, updates: any) => {
            console.log('⏰ Mock: Updating reminder:', id, updates);
          },
          getActiveReminders: async () => {
            console.log('⏰ Mock: Getting active reminders');
            return [];
          }
        }
      );
    }
  });

  // Event analyzer initialization - WCAB-optimized for legal email detection
  const [eventAnalyzer] = useState(() => EmailEventAnalyzerFactory.createWCABAnalyzer());

  // Helper function to check if an email is legal-related using the analyzer
  const isLegalEmail = useCallback((email: EmailMessage): boolean => {
    const eventTypes = eventAnalyzer.detectEventTypes(email);
    
    // Check if any event types were detected (non-custom types indicate legal content)
    const hasLegalEvents = eventTypes.length > 0 && !eventTypes.every(type => type === 'custom');
    
    // Fallback to basic keyword detection for broader coverage
    if (!hasLegalEvents) {
      const subject = email.subject?.toLowerCase() || '';
      const body = email.body?.toLowerCase() || email.snippet?.toLowerCase() || '';
      const content = `${subject} ${body}`;
      
      const legalKeywords = [
        'notice of hearing', 'hearing', 'wcab', 'deposition', 'mediation', 'court', 
        'case', 'legal', 'attorney', 'law', 'settlement', 'adjudication',
        'medical examination', 'ime', 'workers comp', 'compensation', 'adj'
      ];
      
      return legalKeywords.some(keyword => content.includes(keyword));
    }
    
    return hasLegalEvents;
  }, [eventAnalyzer]);

  // Process emails for calendar events
  const processEmailsForCalendar = useCallback(async (
    emails: EmailMessage[],
    onEventCreated?: (count: number) => void,
    onError?: (error: Error) => void
  ) => {
    let eventsCreated = 0;
    
    try {
      console.log('🔄 Processing emails for calendar events:', emails.length);
      
      for (const email of emails) {
        try {
          if (isLegalEmail(email)) {
            console.log('📧 Processing legal email:', email.subject);
            
            const eventDetails = eventAnalyzer.extractEventDetails(email);
            
            // Check if event has essential calendar information
            const hasEssentialInfo = eventDetails && 
              eventDetails.title && 
              eventDetails.dateTime && 
              eventDetails.dateTime instanceof Date && 
              !isNaN(eventDetails.dateTime.getTime());
            
            const validConfidence = !isNaN(eventDetails.confidence) && eventDetails.confidence > 0.5;
            
            if (eventDetails && (hasEssentialInfo || validConfidence)) {
              console.log('📅 Creating calendar event for:', eventDetails.title);
              
              // Get task definitions for this event type
              const taskDefinitions = calendarEventService.getTaskTemplateForEventType(eventDetails.eventType);
              
              // Use processCalendarEvent to handle duplicate checking and merging
              const result = await calendarEventService.processCalendarEvent(
                eventDetails,
                email,
                taskDefinitions || []
              );
              
              eventsCreated++;
              console.log('✅ Calendar event created successfully');
            } else {
              console.log('❌ Event details not suitable for calendaring:', eventDetails?.confidence);
            }
          }
        } catch (error) {
          console.error('❌ Error processing individual email:', email.id, error);
          if (onError) onError(error as Error);
        }
      }
      
      if (onEventCreated) onEventCreated(eventsCreated);
      
      return { eventsCreated, processedEmails: emails.length };
    } catch (error) {
      console.error('❌ Error in batch email processing:', error);
      if (onError) onError(error as Error);
      throw error;
    }
  }, [calendarEventService, eventAnalyzer, isLegalEmail]);

  // Create a single calendar event from email
  const createCalendarEventFromEmail = useCallback(async (
    email: EmailMessage,
    forceCreate: boolean = false
  ) => {
    try {
      console.log('📅 Creating calendar event for email:', email.subject, 'Force:', forceCreate);
      
      // Try to extract event details
      let eventDetails = null;
      try {
        eventDetails = eventAnalyzer.extractEventDetails(email);
        console.log('📊 Event extraction result:', eventDetails ? 'Found details' : 'No details found');
      } catch (extractError) {
        console.warn('⚠️ Event extraction failed, but continuing with manual creation:', extractError);
      }
      
      return { eventDetails, email };
    } catch (error) {
      console.error('❌ Error creating calendar event:', error);
      throw error;
    }
  }, [eventAnalyzer]);

  // Save calendar event with tasks
  const saveCalendarEvent = useCallback(async (eventDetails: any) => {
    try {
      console.log('💾 Saving calendar event:', eventDetails.title);
      
      // Create the main calendar event
      const result = await calendarEventService.createEventWithTasks({
        id: '',
        title: eventDetails.title,
        description: eventDetails.description,
        startDate: eventDetails.dateTime,
        endDate: eventDetails.endDateTime || eventDetails.dateTime,
        location: eventDetails.location,
        attendees: eventDetails.attendees,
        eventType: eventDetails.eventType,
        sourceEmail: eventDetails.sourceEmailId || '',
        relatedTasks: [],
        reminders: [],
        metadata: eventDetails.customFields || {}
      }, eventDetails.customTasks || []);
      
      console.log('✅ Calendar event created with ID:', result.eventId);
      console.log('✅ Tasks created:', result.taskIds.length);
      console.log('✅ Reminders scheduled:', result.reminderIds.length);
      
      return result;
    } catch (error) {
      console.error('❌ Error saving calendar event:', error);
      throw error;
    }
  }, [calendarEventService]);

  return {
    // Services
    calendarEventService,
    eventAnalyzer,
    
    // Helper functions
    isLegalEmail,
    
    // Main operations
    processEmailsForCalendar,
    createCalendarEventFromEmail,
    saveCalendarEvent
  };
};
