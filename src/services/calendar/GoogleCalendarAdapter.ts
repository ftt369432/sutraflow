import { CalendarService } from './CalendarEventService';
import { CalendarEvent } from './EmailEventAnalyzer';
import { GoogleCalendarService, GoogleCalendarEvent } from './googleCalendarService';
import { ParsedHearingNotice } from '../legal/hearingParsingService';

/**
 * Adapter that wraps GoogleCalendarService to implement the CalendarService interface
 * used by CalendarEventService
 */
export class GoogleCalendarAdapter implements CalendarService {
  private googleCalendarService: GoogleCalendarService;
  private calendarId: string;
  private timeZone: string;

  constructor(
    googleCalendarService: GoogleCalendarService, 
    calendarId: string = 'primary',
    timeZone: string = 'America/Los_Angeles'
  ) {
    this.googleCalendarService = googleCalendarService;
    this.calendarId = calendarId;
    this.timeZone = timeZone;
  }

  async createEvent(event: CalendarEvent): Promise<string> {
    console.log('📅 GoogleCalendarAdapter: Creating Google Calendar event:', event.title);
    console.log('📅 GoogleCalendarAdapter: Event details:', JSON.stringify(event, null, 2));
    
    // Validate required fields
    if (!event.startDate || !(event.startDate instanceof Date) || isNaN(event.startDate.getTime())) {
      throw new Error('Invalid start date provided to GoogleCalendarAdapter');
    }
    
    if (!event.endDate || !(event.endDate instanceof Date) || isNaN(event.endDate.getTime())) {
      // Set default end date to 1 hour after start if not provided
      event.endDate = new Date(event.startDate.getTime() + 60 * 60 * 1000);
      console.log('📅 GoogleCalendarAdapter: Auto-set end date to 1 hour after start');
    }
    
    // Convert CalendarEvent to the format expected by GoogleCalendarService
    const parsedHearingNotice = {
      applicantName: event.title, // Use the formatted title from EmailEventAnalyzer
      caseNumbers: event.metadata?.caseNumber ? [event.metadata.caseNumber] : [],
      hearingDate: event.startDate,
      typeOfHearing: event.metadata?.eventType || event.eventType,
      judge: event.metadata?.judge || undefined,
      locationDetails: event.location,
      notes: event.description,
      rawText: event.description,
      lengthOfHearingHours: this.calculateDurationHours(event.startDate, event.endDate).toString()
    };

    console.log('📅 GoogleCalendarAdapter: Converted to ParsedHearingNotice:', JSON.stringify(parsedHearingNotice, null, 2));

    try {
      console.log('📅 GoogleCalendarAdapter: Calling googleCalendarService.createEvent...');
      console.log('📅 GoogleCalendarAdapter: Calendar ID:', this.calendarId);
      console.log('📅 GoogleCalendarAdapter: Time Zone:', this.timeZone);
      
      const result = await this.googleCalendarService.createEvent(
        parsedHearingNotice,
        this.calendarId,
        this.timeZone
      );

      console.log('📅 GoogleCalendarAdapter: Raw result from googleCalendarService:', result);

      if (result && result.id) {
        console.log('✅ GoogleCalendarAdapter: Successfully created event with ID:', result.id);
        return result.id;
      } else {
        console.error('❌ GoogleCalendarAdapter: No event ID in result:', result);
        throw new Error('Google Calendar API returned no event ID');
      }
    } catch (error) {
      console.error('❌ GoogleCalendarAdapter: Failed to create event:', error);
      console.error('❌ GoogleCalendarAdapter: Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      
      // Check if this is a permissions error
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = String(error.message).toLowerCase();
        if (errorMessage.includes('insufficient authentication scopes') || 
            errorMessage.includes('forbidden') ||
            errorMessage.includes('access denied')) {
          throw new Error(
            'Calendar permissions required: Please re-authenticate to grant calendar access. ' +
            'Current session does not have Google Calendar write permissions.'
          );
        }
      }
      
      throw error;
    }
  }

  async updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<void> {
    console.log('📅 GoogleCalendarAdapter: Updating Google Calendar event:', eventId);
    console.log('📝 Updates to apply:', {
      title: updates.title,
      startDate: updates.startDate?.toISOString(),
      location: updates.location
    });
    
    try {
      // Extract case number from metadata to find the existing event
      const caseNumber = updates.metadata?.caseNumber;
      if (!caseNumber) {
        throw new Error('Cannot update event without case number for identification');
      }

      // Search for the existing event to get its current data
      const existingEvents = await this.googleCalendarService.findEvents(
        this.calendarId,
        undefined, // applicantName
        [caseNumber], // caseNumbers
        undefined // lookAroundDate
      );

      if (!existingEvents || existingEvents.length === 0) {
        throw new Error(`No existing event found with case number: ${caseNumber}`);
      }

      const existingEvent = existingEvents[0];
      console.log('📅 Found existing event to update:', existingEvent.summary);

      // Parse and extract clean original notes from potentially messy description
      const currentDescription = existingEvent.description || '';
      
      // Extract the clean original notes by finding the cleanest version
      let cleanOriginalNotes = '';
      let documentLinks = '';
      let reschedulingHistory = '';
      
      if (currentDescription.includes('📜 **ORIGINAL EVENT DETAILS (PRESERVED):**')) {
        // Already has rescheduling data - extract the preserved original
        const originalSection = currentDescription.split('📜 **ORIGINAL EVENT DETAILS (PRESERVED):**')[1];
        if (originalSection) {
          cleanOriginalNotes = originalSection.split('---')[0].trim();
        }
      } else if (currentDescription.includes('--- Notes from Prior Event ---')) {
        // Extract from prior event section
        const priorSection = currentDescription.split('--- Notes from Prior Event ---')[1];
        if (priorSection) {
          cleanOriginalNotes = priorSection.split('Original Notice Text')[0].trim();
        }
      } else {
        // This appears to be clean original notes
        cleanOriginalNotes = currentDescription;
      }

      // Extract document links and email references if they exist
      const emailLinkMatch = currentDescription.match(/Source Email: "[^"]*"/);
      const emailFromMatch = currentDescription.match(/From: [^\n]*/);
      const emailIdMatch = currentDescription.match(/Email ID: [^\n]*/);
      
      if (emailLinkMatch || emailFromMatch || emailIdMatch) {
        documentLinks = [emailLinkMatch?.[0], emailFromMatch?.[0], emailIdMatch?.[0]]
          .filter(Boolean)
          .join('\n');
      }

      // Extract existing rescheduling history to avoid duplication
      if (currentDescription.includes('🔄 **RESCHEDULING HISTORY:**')) {
        const historySection = currentDescription.split('🔄 **RESCHEDULING HISTORY:**')[1];
        if (historySection) {
          reschedulingHistory = historySection.split('📜 **ORIGINAL EVENT DETAILS')[0].trim();
        }
      }

      const newDate = updates.startDate ? updates.startDate.toLocaleDateString() : 'Unknown Date';
      const originalDate = existingEvent.start?.dateTime ? 
        new Date(existingEvent.start.dateTime).toLocaleDateString() : 'Unknown Date';

      // Only add new rescheduling entry if the date actually changed
      let updatedReschedulingHistory = reschedulingHistory;
      if (newDate !== originalDate) {
        const newReschedulingEntry = `📅 ${originalDate} → ${newDate} (${new Date().toLocaleDateString()})`;
        updatedReschedulingHistory = reschedulingHistory 
          ? `${reschedulingHistory}\n${newReschedulingEntry}`
          : newReschedulingEntry;
      }

      // Create clean, structured description
      const structuredDescription = [
        // New event details from incoming email
        updates.description ? `Type: ${updates.metadata?.eventType || 'Hearing'}` : '',
        updates.metadata?.judge ? `Judge: ${updates.metadata.judge}` : '',
        updates.location ? `Location: ${updates.location}` : '',
        '',
        // Rescheduling history (only if there were changes)
        updatedReschedulingHistory ? '� **RESCHEDULING HISTORY:**' : '',
        updatedReschedulingHistory || '',
        updatedReschedulingHistory ? '' : '',
        // Document links
        documentLinks ? '📎 **LINKED DOCUMENTS:**' : '',
        documentLinks || '',
        documentLinks ? '' : '',
        // Clean preserved original notes
        '📜 **ORIGINAL NOTES:**',
        cleanOriginalNotes || '',
        '',
        `Last Updated: ${new Date().toLocaleString()}`
      ].filter(line => line !== null).join('\n').trim();

      // Convert to ParsedHearingNotice format expected by updateEvent
      const updatedHearingNotice: ParsedHearingNotice = {
        applicantName: updates.title || existingEvent.summary || '',
        caseNumbers: [caseNumber],
        hearingDate: updates.startDate || new Date(),
        typeOfHearing: updates.metadata?.eventType || 'Hearing',
        judge: updates.metadata?.judge || '',
        locationDetails: updates.location || existingEvent.location || '',
        notes: structuredDescription,
        rawText: structuredDescription,
        lengthOfHearingHours: this.calculateDurationHours(
          updates.startDate || new Date(), 
          updates.endDate || new Date(Date.now() + 60 * 60 * 1000)
        ).toString()
      };

      console.log('📝 Updating with clean structured notes...');
      console.log('🧹 Preserved original notes length:', cleanOriginalNotes.length);
      console.log('📎 Document links preserved:', !!documentLinks);

      // Call the existing updateEvent method
      const result = await this.googleCalendarService.updateEvent(
        existingEvent.id!,
        updatedHearingNotice,
        cleanOriginalNotes, // Pass clean original notes
        this.calendarId,
        this.timeZone
      );

      if (result) {
        console.log('✅ GoogleCalendarAdapter: Successfully updated event with clean structure');
        console.log('📅 Event updated from', originalDate, 'to', newDate);
        console.log('📝 Clean notes and document links preserved');
      } else {
        throw new Error('Google Calendar API update returned no result');
      }

    } catch (error) {
      console.error('❌ GoogleCalendarAdapter: Failed to update event:', error);
      
      // Provide helpful error context
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = String(error.message);
        if (errorMessage.includes('No existing event found')) {
          throw new Error(
            `Event with case number ${updates.metadata?.caseNumber} not found. ` +
            'The event may have been deleted or the case number might be different.'
          );
        }
        if (errorMessage.includes('insufficient authentication scopes')) {
          throw new Error('Calendar update permissions required - please re-authenticate with Google');
        }
      }
      
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    console.log('📅 GoogleCalendarAdapter: Deleting Google Calendar event:', eventId);
    
    // The GoogleCalendarService doesn't have a delete method, but we can add one
    // For now, throw an error to indicate it's not implemented
    throw new Error('Delete event not implemented in GoogleCalendarService yet');
  }

  async getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    console.log('📅 GoogleCalendarAdapter: Getting Google Calendar events from', startDate, 'to', endDate);
    
    // The GoogleCalendarService doesn't have a generic getEvents method,
    // only findEvents with specific parameters. This would need to be implemented.
    console.warn('⚠️ getEvents not fully implemented yet');
    return [];
  }

  async findEventByCaseNumber(caseNumber: string): Promise<CalendarEvent | null> {
    console.log('🔍 GoogleCalendarAdapter: Searching for existing event with case number:', caseNumber);
    
    try {
      // First attempt: immediate search
      let searchResults = await this.googleCalendarService.findEvents(
        'primary', // calendarId
        undefined, // applicantName - not searching by name for case number searches  
        [caseNumber], // caseNumbers array
        undefined // lookAroundDate - don't limit by date, search broadly for duplicates
      );

      console.log('🔍 Search results for case number', caseNumber, ':', searchResults.length, 'events found');

      // If no results found, wait a moment and try again (Google Calendar indexing delay)
      if (searchResults.length === 0) {
        console.log('⏳ No immediate results found, waiting 2 seconds for Google Calendar indexing...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('🔍 Retrying search after delay...');
        searchResults = await this.googleCalendarService.findEvents(
          'primary',
          undefined,
          [caseNumber],
          undefined
        );
        console.log('🔍 Retry search results:', searchResults.length, 'events found');
      }

      if (searchResults && searchResults.length > 0) {
        const googleEvent = searchResults[0];
        console.log('✅ Found existing event:', googleEvent.summary, 'ID:', googleEvent.id);
        
        // Convert GoogleCalendarEvent back to CalendarEvent format
        return {
          id: googleEvent.id || '',
          title: googleEvent.summary || '',
          description: googleEvent.description || '',
          startDate: googleEvent.start?.dateTime ? new Date(googleEvent.start.dateTime) : new Date(),
          endDate: googleEvent.end?.dateTime ? new Date(googleEvent.end.dateTime) : new Date(),
          location: googleEvent.location || '',
          attendees: [],
          eventType: 'court-hearing',
          sourceEmail: '',
          relatedTasks: [],
          reminders: [],
          metadata: {
            caseNumber: caseNumber,
            judge: '',
            clientName: '',
            eventType: ''
          }
        };
      }

      console.log('📭 No existing event found for case number:', caseNumber);
      return null;
    } catch (error) {
      console.error('❌ Error searching for existing event:', error);
      return null; // Return null on error to allow new event creation
    }
  }

  private calculateDurationHours(startDate: Date, endDate: Date): number {
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationHours = Math.max(1, Math.round(durationMs / (1000 * 60 * 60))); // At least 1 hour
    return durationHours;
  }
}
