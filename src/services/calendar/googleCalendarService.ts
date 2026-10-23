// Placeholder for Google API client library if you use one (e.g., gapi)
// import { gapi } from 'gapi-script'; // Or your specific Google API client
// For now, we'll use fetch and assume an accessToken is available.

import { ParsedHearingNotice } from "../legal/hearingParsingService"; // Adjust path

// Simplified Google Calendar Event structure (add more fields as needed)
export interface GoogleCalendarEvent {
  id?: string;
  summary?: string; // Title
  description?: string;
  start?: { dateTime: string; timeZone: string; }; // ISO string e.g., "2024-06-26T08:30:00-07:00"
  end?: { dateTime: string; timeZone: string; };
  location?: string;
  attendees?: { email: string; }[];
  [key: string]: any; // For other properties
}

const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

export class GoogleCalendarService {
  private accessToken: string | null = null;
  private getAccessToken: () => Promise<string | null>;

  constructor(getAccessToken: () => Promise<string | null>) {
    this.getAccessToken = getAccessToken;
    // Initialize accessToken, perhaps by calling a function from your auth service
    // This is a simplified example; in a real app, token management is more complex.
    getAccessToken().then(token => this.accessToken = token);
  }

  // Helper to ensure token is available
  private async ensureAuth(): Promise<void> {
    if (!this.accessToken) {
      // Try to get a fresh token
      const freshToken = await this.getAccessToken();
      if (!freshToken) {
        throw new Error("Google Calendar API: Access token not available. Please sign in to Google and ensure Calendar permissions are granted.");
      }
      this.accessToken = freshToken;
    }
  }

  /**
   * Finds existing Google Calendar events.
   * Query could be applicantName. Case numbers can be in the description.
   * existingEventDate is helpful if we are trying to find a specific event that got rescheduled.
   */
  async findEvents(
    calendarId: string = 'primary',
    applicantName?: string,
    caseNumbers?: string[],
    lookAroundDate?: Date // To narrow down search if an old date is known
  ): Promise<GoogleCalendarEvent[]> {
    await this.ensureAuth();
    const queryParts: string[] = [];
    if (applicantName) queryParts.push(applicantName);
    // Google Calendar search for exact case numbers in description/summary might be tricky.
    // Often, searching by name and then filtering client-side is more reliable if case numbers aren't in titles.
    // Or, if case numbers are consistently in event titles, they can be part of 'q'.

    const query = queryParts.join(' ');
    
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (lookAroundDate) {
        // Search a window around the date, e.g., +/- 7 days
        const timeMin = new Date(lookAroundDate);
        timeMin.setDate(lookAroundDate.getDate() - 7);
        params.append('timeMin', timeMin.toISOString());

        const timeMax = new Date(lookAroundDate);
        timeMax.setDate(lookAroundDate.getDate() + 7);
        params.append('timeMax', timeMax.toISOString());
    } else if (caseNumbers && caseNumbers.length > 0) {
        // When searching for duplicates by case number, search broadly:
        // 30 days in the past to 2 years in the future
        const timeMin = new Date();
        timeMin.setDate(timeMin.getDate() - 30);
        params.append('timeMin', timeMin.toISOString());
        
        const timeMax = new Date();
        timeMax.setFullYear(timeMax.getFullYear() + 2);
        params.append('timeMax', timeMax.toISOString());
        
        console.log('🔍 Searching for case numbers in broad date range:', timeMin.toISOString(), 'to', timeMax.toISOString());
    }
    params.append('showDeleted', 'false'); // Don't show deleted events

    try {
      const response = await fetch(
        `${GOOGLE_CALENDAR_API_BASE}/calendars/${calendarId}/events?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        // console.error('Google Calendar API Error (findEvents):', errorData);
        throw new Error(`Google API error: ${errorData.error?.message || response.statusText}`);
      }
      const data = await response.json();
      
      // Further filter by case numbers if present in description or extended properties
      if (caseNumbers && caseNumbers.length > 0 && data.items) {
        console.log('🔍 Found', data.items.length, 'total events, filtering for case numbers:', caseNumbers);
        
        const matchedEvents = data.items.filter((event: GoogleCalendarEvent) => {
          const eventText = `${event.summary || ''} ${event.description || ''}`.toLowerCase();
          
          // Debug: Log each event's text for inspection
          if (data.items.length <= 5) { // Only debug if not too many events
            console.log('🔍 Checking event:', event.summary);
            console.log('   Event text sample:', eventText.substring(0, 100) + '...');
          }
          
          const hasMatch = caseNumbers.some(cn => {
            const caseNumberLower = cn.toLowerCase();
            const isMatch = eventText.includes(caseNumberLower);
            
            if (isMatch) {
              console.log('✅ Found matching event:', event.summary, 'for case:', cn);
              console.log('   Match found in text:', eventText.substring(eventText.indexOf(caseNumberLower) - 20, eventText.indexOf(caseNumberLower) + cn.length + 20));
            }
            
            return isMatch;
          });
          
          return hasMatch;
        });
        
        console.log('🔍 Filtered to', matchedEvents.length, 'events matching case numbers');
        return matchedEvents;
      }
      return data.items || [];
    } catch (_error) {
      // console.error('Failed to find Google Calendar events:', _error);
      return []; // Return empty on error to allow "best effort" calendaring
    }
  }

  async createEvent(
    eventData: ParsedHearingNotice,
    calendarId: string = 'primary',
    timeZone: string = 'America/Los_Angeles' // Default, should ideally get from user settings
  ): Promise<GoogleCalendarEvent | null> {
    await this.ensureAuth();
    if (!eventData.hearingDate) {
        // console.warn('Cannot create calendar event without a hearing date.');
        return null;
    }

    // Estimate end time (e.g., 1 hour duration if not specified)
    const lengthOfHearingHours = parseInt(eventData.lengthOfHearingHours || '1') || 1; // Added from your thoughts
    const startTime = eventData.hearingDate;
    const endTime = new Date(startTime.getTime() + (lengthOfHearingHours * 60 * 60 * 1000));


    const googleEvent: GoogleCalendarEvent = {
      summary: eventData.applicantName, // Use the full formatted title directly
      description: `Type: ${eventData.typeOfHearing || 'N/A'}\nJudge: ${eventData.judge || 'N/A'}\nLocation: ${eventData.locationDetails || 'N/A'}`,
      start: { dateTime: startTime.toISOString(), timeZone: timeZone },
      end: { dateTime: endTime.toISOString(), timeZone: timeZone },
      location: eventData.locationDetails?.split('\n')[0], // Take the first line of location if multi-line
      // REMOVED attendees to prevent email invites
      // attendees: [] // No attendees to prevent email invites
    };

    try {
      console.log('[GoogleCalendarService] Creating event:', JSON.stringify(googleEvent, null, 2));
      
      const response = await fetch(
        // IMPORTANT: sendUpdates=none prevents email invites from being sent
        `${GOOGLE_CALENDAR_API_BASE}/calendars/${calendarId}/events?sendUpdates=none`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(googleEvent),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Google Calendar API Error (createEvent):', errorData);
        throw new Error(`Google API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[GoogleCalendarService] Successfully created calendar event (no invites sent):', result);
      return result;
    } catch (error) {
      console.error('[GoogleCalendarService] Error creating calendar event:', error);
      return null;
    }
  }

  async updateEvent(
    eventId: string,
    eventData: ParsedHearingNotice,
    originalEventNotes: string = '',
    calendarId: string = 'primary',
    timeZone: string = 'America/Los_Angeles'
  ): Promise<GoogleCalendarEvent | null> {
    await this.ensureAuth();
     if (!eventData.hearingDate) {
        // console.warn('Cannot update calendar event without a hearing date.');
        return null;
    }
    const lengthOfHearingHours = parseInt(eventData.lengthOfHearingHours || '1') || 1; // Added from your thoughts
    const startTime = eventData.hearingDate;
    const endTime = new Date(startTime.getTime() + (lengthOfHearingHours * 60 * 60 * 1000));

    const updatedGoogleEvent: Partial<GoogleCalendarEvent> = {
      summary: `Hearing: ${eventData.applicantName}${eventData.caseNumbers ? ` - Case(s): ${eventData.caseNumbers.join(', ')}` : ''} (Rescheduled)`,
      description: `MOVED FROM PREVIOUS DATE.\nType: ${eventData.typeOfHearing || 'N/A'}\nJudge: ${eventData.judge || 'N/A'}\nLocation: ${eventData.locationDetails || 'N/A'}\n\n--- Current Notes ---\n${eventData.notes || ''}\n\n--- Notes from Prior Event ---\n${originalEventNotes || 'N/A'}\n\nOriginal Notice Text (first 500 chars):\n${(eventData.rawText || '').substring(0,500)}`,
      start: { dateTime: startTime.toISOString(), timeZone: timeZone },
      end: { dateTime: endTime.toISOString(), timeZone: timeZone },
      location: eventData.locationDetails?.split('\n')[0],
    };
    
    try {
      const response = await fetch(
        `${GOOGLE_CALENDAR_API_BASE}/calendars/${calendarId}/events/${eventId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedGoogleEvent),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        // console.error('Google Calendar API Error (updateEvent):', errorData);
        throw new Error(`Google API error: ${errorData.error?.message || response.statusText}`);
      }
      return await response.json();
    } catch (_error) {
      // console.error('Failed to update Google Calendar event:', _error);
      return null;
    }
  }

  async deleteEvent(eventId: string, calendarId: string = 'primary'): Promise<boolean> {
    await this.ensureAuth();
    try {
      const response = await fetch(
        `${GOOGLE_CALENDAR_API_BASE}/calendars/${calendarId}/events/${eventId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${this.accessToken}` },
        }
      );
      if (response.status === 204) return true; // Success, no content
      if (!response.ok) {
        const errorData = await response.json();
        // console.error('Google Calendar API Error (deleteEvent):', errorData);
        throw new Error(`Google API error: ${errorData.error?.message || response.statusText}`);
      }
      return true;
    } catch (_error) {
      // console.error('Failed to delete Google Calendar event:', _error);
      return false;
    }
  }
}

// To use this service, you would instantiate it by passing a function 
// that can retrieve the current user's Google access token.
// Example (assuming you have an authService that provides getGoogleAccessToken):
// const getAuthToken = () => authService.getGoogleAccessToken(); 
// const calendarService = new GoogleCalendarService(getAuthToken); 