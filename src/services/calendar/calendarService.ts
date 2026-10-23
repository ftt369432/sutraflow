import { v4 as uuidv4 } from 'uuid';
import { getEnv } from '../../config/env';
import { EmailAnalysis } from '../email';
import googleAuthService from '../auth/googleAuth';
import { googleApiClient } from '../google/GoogleAPIClient';
import { EmailAnalysisMeetingDetails } from '../email/types';
import { GoogleCalendarService } from './googleCalendarService';
import { ParsedHearingNotice } from '../legal/hearingParsingService';

// Define Attendee type locally or import if available elsewhere
type Attendee = { email: string; name?: string; organizer?: boolean; response?: string; };

// Calendar types
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  description?: string;
  location?: string;
  videoConferenceLink?: string;
  calendarId: string;
  calendarName: string;
  color: string;
  source: 'google' | 'outlook' | 'custom';
  attendees?: Array<{ email: string; name?: string; organizer?: boolean; response?: string; }>;
  status?: 'confirmed' | 'tentative' | 'cancelled' | string;
  reminders?: Array<{ method: string; minutes: number; }>;
  recurrence?: { pattern: string; interval: number; endDate?: Date; };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Calendar {
  id: string;
  name: string;
  color: string;
  source: 'google' | 'outlook' | 'custom';
  primary: boolean;
  enabled: boolean;
}

export interface CalendarFilter {
  calendarIds?: string[];
  fromDate?: Date;
  toDate?: Date;
  title?: string;
  attendees?: string[]; // Email addresses
  status?: 'confirmed' | 'tentative' | 'cancelled';
}

// Interface for the data needed to create a calendar event
// This might evolve as we add more features
export interface CalendarEventInput {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string; // RFC3339 format, e.g., '2025-06-26T09:00:00-07:00'
    timeZone?: string; // e.g., 'America/Los_Angeles'
  };
  end: {
    dateTime: string; // RFC3339 format
    timeZone?: string;
  };
  attendees?: Array<{ email: string }>;
  // We can add more fields like recurrence, reminders, etc. later
  source?: { // To link back to the email
    title: string; // e.g., Email subject
    url: string;   // e.g., A link to the email if possible (placeholder for now)
  };
  conferenceData?: any; // For Google Meet links if provided explicitly
  caseNumber?: string; // For legal context
  eventType?: string;  // For legal context
}

/**
 * Service for managing calendars and events
 */
export class CalendarService {
  private events: CalendarEvent[] = [];
  private calendars: Calendar[] = [];
  private eventsStorageKey = 'genieflow_calendar_events';
  private calendarsStorageKey = 'genieflow_calendars';
  // Google services - only available in non-mock mode
  private googleClient?: typeof googleApiClient;
  private googleCalendarServiceInstance?: GoogleCalendarService;

  constructor() {
    console.log('📅 CalendarService constructor called');
    this.loadFromStorage();
    console.log(`📅 CalendarService initialized with ${this.calendars.length} calendars and ${this.events.length} events`);
    
    const { useMock } = getEnv();
    console.log('📅 CalendarService useMock mode:', useMock);
    
    // Only instantiate GoogleCalendarService in non-mock mode
    if (!useMock) {
      // Initialize Google client
      this.googleClient = googleApiClient;
      
      // Instantiate GoogleCalendarService with proper error handling
      this.googleCalendarServiceInstance = new GoogleCalendarService(
        async () => {
          if (!this.googleClient) {
            throw new Error('Google client not initialized');
          }
          return this.googleClient.getAccessToken();
        }
      );

      // Try to initialize Google Auth
      this.initializeGoogleAuth();
    } else {
      console.log('📅 CalendarService: Skipping Google Calendar integration in mock mode');
    }
  }
  
  /**
   * Initialize Google Auth
   */
  private async initializeGoogleAuth(): Promise<void> {
    try {
      // console.log('Google Auth service instance obtained for calendar');
    } catch (error) {
      // console.error('Failed to initialize Google Auth for calendar:', error);
    }
  }

  /**
   * Load calendars and events from local storage
   */
  private loadFromStorage(): void {
    const { useMock } = getEnv();
    
    try {
      // Load calendars
      const calendarsJson = localStorage.getItem(this.calendarsStorageKey);
      if (calendarsJson) {
        this.calendars = JSON.parse(calendarsJson);
      } else if (useMock) {
        this.initializeMockCalendars();
      }
      
      // Load events
      const eventsJson = localStorage.getItem(this.eventsStorageKey);
      if (eventsJson) {
        const parsedEvents = JSON.parse(eventsJson);
        
        // Convert date strings back to Date objects
        this.events = parsedEvents.map((event: any) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
          createdAt: new Date(event.createdAt),
          updatedAt: new Date(event.updatedAt),
          recurrence: event.recurrence ? {
            ...event.recurrence,
            endDate: event.recurrence.endDate ? new Date(event.recurrence.endDate) : undefined
          } : undefined,
          sourceEmail: event.sourceEmail ? {
            ...event.sourceEmail,
            receivedAt: new Date(event.sourceEmail.receivedAt)
          } : undefined
        }));
      } else if (useMock) {
        this.initializeMockEvents();
      }
    } catch (_error) {
      // console.error('Failed to load calendar data from storage:', _error);
      if (useMock) {
        this.initializeMockCalendars();
        this.initializeMockEvents();
      }
    }
  }

  /**
   * Save calendars and events to local storage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.calendarsStorageKey, JSON.stringify(this.calendars));
      localStorage.setItem(this.eventsStorageKey, JSON.stringify(this.events));
    } catch (_error) {
      // console.error('Failed to save calendar data to storage:', _error);
    }
  }

  /**
   * Initialize with mock calendars
   */
  private initializeMockCalendars(): void {
    this.calendars = [
      {
        id: 'calendar-1',
        name: 'Personal',
        color: '#4285F4', // Blue
        source: 'custom',
        primary: true,
        enabled: true
      },
      {
        id: 'calendar-2',
        name: 'Work',
        color: '#0F9D58', // Green
        source: 'custom',
        primary: false,
        enabled: true
      },
      {
        id: 'calendar-3',
        name: 'Holidays',
        color: '#DB4437', // Red
        source: 'custom',
        primary: false,
        enabled: true
      }
    ];
    
    this.saveToStorage();
  }

  /**
   * Initialize with mock events
   */
  private initializeMockEvents(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const workCalendar = this.calendars.find(c => c.id === 'calendar-2') || this.calendars[0];
    const personalCalendar = this.calendars.find(c => c.id === 'calendar-1') || this.calendars[0];
    
    this.events = [
      {
        id: uuidv4(),
        title: 'Team Meeting',
        description: 'Weekly team sync-up meeting',
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0),
        allDay: false,
        location: 'Conference Room A',
        videoConferenceLink: 'https://meet.google.com/abc-defg-hij',
        attendees: [
          { email: 'user@example.com', name: 'Current User', organizer: true, response: 'accepted' },
          { email: 'teammate1@example.com', name: 'Teammate 1', response: 'accepted' },
          { email: 'teammate2@example.com', name: 'Teammate 2', response: 'tentative' }
        ],
        recurrence: {
          pattern: 'weekly',
          interval: 1
        },
        reminders: [
          { method: 'notification', minutes: 10 },
          { method: 'email', minutes: 60 }
        ],
        status: 'confirmed',
        createdAt: new Date(now.getTime() - 86400000 * 7),
        updatedAt: new Date(now.getTime() - 86400000 * 2),
        calendarId: workCalendar.id,
        calendarName: workCalendar.name,
        color: workCalendar.color,
        source: workCalendar.source as 'custom', // Assuming mock calendars are 'custom' source
      },
      {
        id: uuidv4(),
        title: 'Lunch with Sarah',
        description: 'Catch-up lunch at the Italian restaurant',
        start: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 12, 30),
        end: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 13, 30),
        allDay: false,
        location: 'La Trattoria, 123 Main St',
        status: 'confirmed',
        createdAt: new Date(now.getTime() - 86400000 * 3),
        updatedAt: new Date(now.getTime() - 86400000 * 3),
        calendarId: personalCalendar.id,
        calendarName: personalCalendar.name,
        color: personalCalendar.color,
        source: personalCalendar.source as 'custom',
      },
      {
        id: uuidv4(),
        title: 'Project Deadline',
        description: 'Submit final deliverables for the Q3 project',
        start: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 17, 0),
        end: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 17, 0),
        allDay: false,
        location: 'Project HQ',
        reminders: [
          { method: 'notification', minutes: 1440 }, // 1 day before
          { method: 'email', minutes: 60 * 24 * 2 } // 2 days before
        ],
        status: 'confirmed',
        createdAt: new Date(now.getTime() - 86400000 * 10),
        updatedAt: new Date(now.getTime() - 86400000 * 1),
        calendarId: workCalendar.id,
        calendarName: workCalendar.name,
        color: workCalendar.color,
        source: workCalendar.source as 'custom',
      }
    ];
    
    this.saveToStorage();
  }

  /**
   * Get all calendars
   */
  public async getCalendars(): Promise<Calendar[]> {
    await this.simulateNetworkDelay();
    return [...this.calendars];
  }

  /**
   * Get default calendar
   */
  public async getDefaultCalendar(): Promise<Calendar> {
    await this.simulateNetworkDelay();
    const defaultCalendar = this.calendars.find(cal => cal.primary);
    if (!defaultCalendar) {
      throw new Error('No default calendar found');
    }
    return defaultCalendar;
  }

  /**
   * Add a new calendar
   */
  public async addCalendar(calendar: Omit<Calendar, 'id'>): Promise<Calendar> {
    await this.simulateNetworkDelay();
    
    const newCalendar: Calendar = {
      id: uuidv4(),
      ...calendar
    };
    
    // If this is marked as default, update other calendars
    if (newCalendar.primary) {
      this.calendars.forEach(cal => {
        cal.primary = false;
      });
    }
    
    this.calendars.push(newCalendar);
    this.saveToStorage();
    
    return newCalendar;
  }

  /**
   * Update a calendar
   */
  public async updateCalendar(id: string, updates: Partial<Omit<Calendar, 'id'>>): Promise<Calendar | null> {
    await this.simulateNetworkDelay();
    
    const index = this.calendars.findIndex(cal => cal.id === id);
    if (index === -1) return null;
    
    const updatedCalendar = {
      ...this.calendars[index],
      ...updates
    };
    
    // If this is marked as default, update other calendars
    if (updates.primary) {
      this.calendars.forEach(cal => {
        if (cal.id !== id) {
          cal.primary = false;
        }
      });
    }
    
    this.calendars[index] = updatedCalendar;
    this.saveToStorage();
    
    return updatedCalendar;
  }

  /**
   * Delete a calendar and all its events
   */
  public async deleteCalendar(id: string): Promise<boolean> {
    await this.simulateNetworkDelay();
    
    // Don't delete the default calendar
    const calendarToDelete = this.calendars.find(cal => cal.id === id);
    if (!calendarToDelete || calendarToDelete.primary) {
      return false;
    }
    
    // Delete all events in this calendar
    this.events = this.events.filter(event => event.calendarId !== id);
    
    // Delete the calendar
    this.calendars = this.calendars.filter(cal => cal.id !== id);
    
    this.saveToStorage();
    return true;
  }

  /**
   * Get events, optionally filtered
   */
  public async getEvents(filter?: CalendarFilter): Promise<CalendarEvent[]> {
    const { useMock } = getEnv();
    const now = new Date(); 
    const effectiveStart = filter?.fromDate || new Date(now.getFullYear(), now.getMonth(), 1);
    const effectiveEnd = filter?.toDate || new Date(now.getFullYear(), now.getMonth() + 1, 0);

    if (useMock) {
      await this.simulateNetworkDelay();
      const filteredMockEvents = this.events.filter(event => {
        if (filter?.calendarIds && filter.calendarIds.length > 0 && !filter.calendarIds.includes(event.calendarId)) return false;
        if (event.start >= effectiveEnd || event.end <= effectiveStart) { // Check if event is outside the date range
             // This logic might need adjustment based on how inclusivity of start/end is handled.
             // Assuming events partially within the range should be included.
             // A common check for overlap is: (StartA <= EndB) and (EndA >= StartB)
             if (!(event.start < effectiveEnd && event.end > effectiveStart)) {
                 return false;
             }
        }
        if (filter?.title && !event.title.toLowerCase().includes(filter.title.toLowerCase())) return false;
        // Add filtering for attendees if necessary
        // if (filter?.attendees && filter.attendees.length > 0) {
        //   const eventAttendees = event.attendees?.map(a => a.email.toLowerCase()) || [];
        //   if (!filter.attendees.some(fa => eventAttendees.includes(fa.toLowerCase()))) return false;
        // }
        if (filter?.status && event.status && event.status !== filter.status) return false; // Assuming event has status
        return true;
      });
      return filteredMockEvents;
    } else {
      const activeCalendars = await this.getCalendars(); 
      const googleCalendars = activeCalendars.filter(c => c.enabled && c.source === 'google');

      if (!googleCalendars.length) {
        // console.log("No enabled Google calendars to fetch events from.");
        // Return local/custom events matching the filter if any, or empty array
        return this.events.filter(event => {
            if (event.source === 'google') return false; // Exclude google events if not fetched
            if (filter?.calendarIds && filter.calendarIds.length > 0 && !filter.calendarIds.includes(event.calendarId)) return false;
            if (event.start >= effectiveEnd || event.end <= effectiveStart) {
                 if (!(event.start < effectiveEnd && event.end > effectiveStart)) {
                     return false;
                 }
            }
            if (filter?.title && !event.title.toLowerCase().includes(filter.title.toLowerCase())) return false;
            if (filter?.status && event.status && event.status !== filter.status) return false;
            return true;
        });
      }
      
      try {
        const googleEvents = await this.fetchGoogleEvents(googleCalendars, effectiveStart, effectiveEnd);
        
        const otherSourceEvents = this.events.filter(e => {
            if (e.source === 'google') return false; // Remove all old google events
            // Apply filter to non-Google events
            if (filter?.calendarIds && filter.calendarIds.length > 0 && !filter.calendarIds.includes(e.calendarId)) return false;
            if (e.start >= effectiveEnd || e.end <= effectiveStart) {
                 if (!(e.start < effectiveEnd && e.end > effectiveStart)) {
                     return false;
                 }
            }
            if (filter?.title && !e.title.toLowerCase().includes(filter.title.toLowerCase())) return false;
            if (filter?.status && e.status && e.status !== filter.status) return false;
            return true;
        });

        const allFilteredEvents = [...otherSourceEvents, ...googleEvents]; // Combine and re-filter googleEvents if necessary
        
        // Update main events list with fetched Google events and existing others
        // This strategy replaces all previous google events with newly fetched ones
        const nonGoogleEventsFromStorage = this.events.filter(e => e.source !== 'google');
        this.events = [...nonGoogleEventsFromStorage, ...googleEvents];
        this.saveToStorage();

        // Final filter on the combined list (googleEvents should already be filtered by date by fetchGoogleEvents)
        return allFilteredEvents.filter(event => {
            if (filter?.calendarIds && filter.calendarIds.length > 0 && !filter.calendarIds.includes(event.calendarId)) return false;
            // Date filter already applied to googleEvents by fetchGoogleEvents and to others above
            if (filter?.title && !event.title.toLowerCase().includes(filter.title.toLowerCase())) return false;
            if (filter?.status && event.status && event.status !== filter.status) return false;
            return true;
        });

      } catch (_error) {
        // console.error('Error fetching Google events in CalendarService.fetchEvents:', _error);
        // Fallback to only local/custom events matching filter
        return this.events.filter(event => {
            if (event.source === 'google') return false;
            if (filter?.calendarIds && filter.calendarIds.length > 0 && !filter.calendarIds.includes(event.calendarId)) return false;
            if (event.start >= effectiveEnd || event.end <= effectiveStart) {
                 if (!(event.start < effectiveEnd && event.end > effectiveStart)) {
                     return false;
                 }
            }
            if (filter?.title && !event.title.toLowerCase().includes(filter.title.toLowerCase())) return false;
            if (filter?.status && event.status && event.status !== filter.status) return false;
            return true;
        });
      }
    }
  }

  /**
   * Get a specific event by ID
   */
  public async getEvent(id: string): Promise<CalendarEvent | null> {
    await this.simulateNetworkDelay();
    return this.events.find(event => event.id === id) || null;
  }

  /**
   * Create a new event
   */
  public async createEvent(eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<CalendarEvent> {
    console.log('📅 CalendarService: createEvent called with title:', eventData.title);
    await this.simulateNetworkDelay();
    
    const now = new Date();
    const newEvent: CalendarEvent = {
      id: uuidv4(),
      ...eventData,
      createdAt: now,
      updatedAt: now
    };
    
    console.log('📅 CalendarService: Local event created with ID:', newEvent.id);
    
    // Store in local storage first
    this.events.push(newEvent);
    this.saveToStorage();
    
    // Also create in Google Calendar if not in mock mode
    const { useMock } = getEnv();
    console.log('📅 CalendarService: Checking if should call Google Calendar API - useMock:', useMock);
    
    if (!useMock && this.googleCalendarServiceInstance) {
      try {
        console.log('📅 CalendarService: Creating event in Google Calendar...', newEvent.title);
        console.log('📅 CalendarService: GoogleCalendarService instance available:', !!this.googleCalendarServiceInstance);
        
        // Create the event in Google Calendar using ParsedHearingNotice format
        const parsedHearingData = {
          applicantName: newEvent.title,
          hearingDate: newEvent.start,
          typeOfHearing: 'Calendar Event',
          judge: '',
          locationDetails: newEvent.location || '',
          notes: newEvent.description || '',
          rawText: newEvent.description || '',
          lengthOfHearingHours: Math.ceil((newEvent.end.getTime() - newEvent.start.getTime()) / (1000 * 60 * 60)).toString(),
          caseNumbers: []
        };
        
        console.log('📅 CalendarService: Calling googleCalendarServiceInstance.createEvent with data:', JSON.stringify(parsedHearingData, null, 2));
        
        const googleCalendarId = 'primary'; // Use primary calendar
        const googleEventResult = await this.googleCalendarServiceInstance.createEvent(
          parsedHearingData,
          googleCalendarId,
          'America/Los_Angeles'
        );
        
        console.log('📅 CalendarService: Google Calendar API response:', googleEventResult);
        console.log('📅 CalendarService: Successfully created Google Calendar event:', googleEventResult?.id);
        
        // Update the local event with Google Calendar ID if available
        if (googleEventResult?.id) {
          newEvent.id = googleEventResult.id;
          // Update in local storage
          const index = this.events.findIndex(e => e.id === newEvent.id);
          if (index !== -1) {
            this.events[index] = newEvent;
            this.saveToStorage();
          }
        }
        
      } catch (error) {
        console.error('📅 CalendarService: Failed to create Google Calendar event:', error);
        console.error('📅 CalendarService: Error details:', error);
        // Continue with local event creation even if Google Calendar fails
      }
    } else {
      console.log('📅 CalendarService: Skipping Google Calendar creation - useMock:', useMock, 'googleCalendarServiceInstance:', !!this.googleCalendarServiceInstance);
    }
    
    return newEvent;
  }

  /**
   * Update an event
   */
  public async updateEvent(id: string, updates: Partial<Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CalendarEvent | null> {
    await this.simulateNetworkDelay();
    
    const index = this.events.findIndex(event => event.id === id);
    if (index === -1) return null;
    
    const updatedEvent = {
      ...this.events[index],
      ...updates,
      updatedAt: new Date()
    };
    
    this.events[index] = updatedEvent;
    this.saveToStorage();
    
    return updatedEvent;
  }

  /**
   * Delete an event
   */
  public async deleteEvent(id: string): Promise<boolean> {
    await this.simulateNetworkDelay();
    
    const initialLength = this.events.length;
    this.events = this.events.filter(event => event.id !== id);
    const wasDeleted = initialLength > this.events.length;
    
    if (wasDeleted) {
      this.saveToStorage();
    }
    
    return wasDeleted;
  }

  /**
   * Create event from email analysis
   */
  public async createEventFromEmail(emailAnalysis: EmailAnalysis, emailInfo: {
    messageId: string;
    accountId: string;
    subject: string;
    sender: string;
    receivedAt: Date;
  }): Promise<CalendarEvent | null> {
    await this.simulateNetworkDelay();
    
    if (!emailAnalysis.meetingDetails) {
      return null;
    }
    
    const defaultDurationMinutes = 60;
    
    let startTime: Date | null = null;
    let endTime: Date | null = null;
    
    try {
      if (emailAnalysis.meetingDetails.eventDate) { // Changed .date to .eventDate
        const baseDate = new Date(emailAnalysis.meetingDetails.eventDate); // Changed .date to .eventDate
        
        if (emailAnalysis.meetingDetails.eventTime) { // Changed .time to .eventTime
          const timeMatch = emailAnalysis.meetingDetails.eventTime.match(/(\\d{1,2}):(\\d{2})\\s*([ap]m)?/i); // Changed .time to .eventTime
          
          if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            const isPM = timeMatch[3] && timeMatch[3].toLowerCase() === 'pm';
            
            if (isPM && hours < 12) hours += 12;
            else if (!isPM && hours === 12) hours = 0; // 12 AM
            
            baseDate.setHours(hours, minutes, 0, 0);
          }
        } else {
          baseDate.setHours(9, 0, 0, 0); // Default to 9 AM
        }
        startTime = new Date(baseDate);
        
        // Calculate end time
        if (emailAnalysis.meetingDetails.endTime && typeof emailAnalysis.meetingDetails.endTime === 'string') {
          const endTimeStr = emailAnalysis.meetingDetails.endTime;
          const endTimeMatch = endTimeStr.match(/(\\d{1,2}):(\\d{2})\\s*([ap]m)?/i);
          if (endTimeMatch) {
            let endHours = parseInt(endTimeMatch[1]);
            const endMinutes = parseInt(endTimeMatch[2]);
            const endIsPM = endTimeMatch[3] && endTimeMatch[3].toLowerCase() === 'pm';
            if (endIsPM && endHours < 12) endHours += 12;
            else if (!endIsPM && endHours === 12) endHours = 0;

            endTime = new Date(startTime); // Start with startTime's date
            endTime.setHours(endHours, endMinutes, 0, 0);

            if (endTime <= startTime) { // Handle overnight events
              endTime.setDate(endTime.getDate() + 1);
            }
          } else {
            // Fallback if endTime string is unparseable
            endTime = new Date(startTime);
            endTime.setMinutes(startTime.getMinutes() + defaultDurationMinutes);
          }
        } else {
          // No endTime string, use default duration
          endTime = new Date(startTime);
          endTime.setMinutes(startTime.getMinutes() + defaultDurationMinutes);
        }
        // Removed the block that parsed emailAnalysis.meetingDetails.duration
      }
    } catch (error) {
      // console.error('Failed to parse meeting date/time from emailAnalysis:', error);
    }
    
    if (!startTime) {
      startTime = new Date(); // Fallback startTime
      startTime.setDate(startTime.getDate() + 1); // Tomorrow
      startTime.setHours(9, 0, 0, 0); // 9 AM
      
      endTime = new Date(startTime); // Fallback endTime
      endTime.setMinutes(startTime.getMinutes() + defaultDurationMinutes);
    }
    
    const attendees: Attendee[] = []; // Used local Attendee type
    
    const senderName = emailInfo.sender.split('<')[0].trim();
    const senderEmailMatch = emailInfo.sender.match(/<([^>]+)>/);
    const senderEmail = senderEmailMatch ? senderEmailMatch[1] : emailInfo.sender;
    
    attendees.push({
      email: senderEmail,
      name: senderName,
      organizer: true,
      response: 'accepted'
    });
    
    // Placeholder for actual user email
    const currentUserEmail = 'user@example.com'; // TODO: Replace with actual logged-in user's email
    attendees.push({
      email: currentUserEmail,
      name: 'Current User',
      response: 'needsAction'
    });
    
    if (emailAnalysis.meetingDetails.attendees) {
      emailAnalysis.meetingDetails.attendees.forEach(attendeeText => {
        if (attendeeText.includes(senderEmail) || attendeeText.includes(currentUserEmail)) {
          return;
        }
        const attendeeName = attendeeText.split('<')[0].trim();
        const attendeeEmailMatch = attendeeText.match(/<([^>]+)>/);
        const attendeeEmail = attendeeEmailMatch ? attendeeEmailMatch[1] : attendeeText.trim();
        
        if (attendeeEmail && !attendees.some(a => a.email === attendeeEmail)) {
          attendees.push({
            email: attendeeEmail,
            name: (attendeeName && attendeeName !== attendeeEmail) ? attendeeName : undefined,
            response: 'needsAction'
          });
        }
      });
    }
    
    const defaultCalendar = await this.getDefaultCalendar();
    
    const eventTitle = /* ... existing title logic ... */ emailInfo.subject; // Simplified for brevity
        
    const newEvent: CalendarEvent = {
      id: uuidv4(),
      title: eventTitle,
      description: `Meeting extracted from email: "${emailInfo.subject}"`,
      start: startTime!, // Added non-null assertion
      end: endTime!,   // Added non-null assertion
      location: emailAnalysis.meetingDetails.location,
      videoConferenceLink: emailAnalysis.meetingDetails?.videoConferenceLink, // Changed .videoLink to .videoConferenceLink
      attendees,
      allDay: false,
      reminders: [{ method: 'notification', minutes: 10 }],
      status: 'tentative',
      createdAt: new Date(),
      updatedAt: new Date(),
      calendarId: defaultCalendar.id, // Changed from calendar.id
      calendarName: defaultCalendar.name, // Changed from calendar.name
      color: defaultCalendar.color, // Added color from default calendar
      source: defaultCalendar.source as 'custom' | 'google' | 'outlook', // Ensure source type matches
      // Removed 'calendar: { id: ..., name: ... }'
      // Removed 'sourceEmail: { ... }' to simplify, ensure CalendarEvent doesn't require it or add if needed
    };
    
    this.events.push(newEvent);
    this.saveToStorage();
    
    return newEvent;
  }

  /**
   * Helper to simulate network delay
   */
  private async simulateNetworkDelay(min: number = 100, max: number = 300): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  async fetchCalendars(): Promise<Calendar[]> {
    console.log('📅 fetchCalendars called');
    const googleCalendars = await this.fetchGoogleCalendars();
    console.log('📅 Got Google calendars:', googleCalendars.length);
    this.calendars = [...googleCalendars];
    console.log('📅 Total calendars set:', this.calendars.length);
    return this.calendars;
  }

  private async fetchGoogleCalendars(): Promise<Calendar[]> {
    console.log('📅 fetchGoogleCalendars called');
    
    if (!this.googleClient) {
      console.log('📅 fetchGoogleCalendars: Google client not available in mock mode');
      return [];
    }
    
    try {
      console.log('📅 Making Google Calendar API request...');
      const response = await this.googleClient!.request<any>({
        url: 'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        method: 'GET'
      });
      console.log('📅 Google Calendar API response:', response);
      
      if (response && response.data && (response.data as any).items) {
        const calendars = (response.data as any).items.map((calendar: any) => ({
          id: calendar.id,
          name: calendar.summary || calendar.summaryOverride || 'Unnamed Calendar',
          color: calendar.backgroundColor || '#039BE5', // Default Google Blue
          source: 'google',
          primary: calendar.primary || false,
          enabled: !calendar.hidden, // A calendar is enabled if not hidden
        }));
        console.log('📅 Mapped Google calendars:', calendars.length, calendars.map(c => c.name));
        return calendars;
      }
      console.log('📅 No calendar items in response');
      return [];
    } catch (error) {
      console.error('📅 Error fetching Google calendars via GoogleAPIClient:', error);
      return [];
    }
  }

  async fetchEvents(start: Date, end: Date): Promise<CalendarEvent[]> {
    console.log('📅 CalendarService.fetchEvents called:', { start: start.toISOString(), end: end.toISOString() });
    
    // Make sure we have the latest calendars
    if (this.calendars.length === 0) {
      console.log('📅 No calendars cached, fetching calendars first...');
      await this.fetchCalendars(); // This should populate this.calendars with Google calendars too
    }

    const { useMock } = getEnv(); // Assuming getEnv is available
    console.log('📅 Environment useMock:', useMock);

    if (useMock) {
      await this.simulateNetworkDelay();
      // Filter mock events based on start and end dates
      const mockEvents = this.events.filter(event => {
        return event.start < end && event.end > start && event.source !== 'google'; // Basic overlap for mocks
      });
      console.log('📅 Returning mock events:', mockEvents.length);
      return mockEvents;
    }

    // Non-mock: Fetch from Google
    const googleCalendarsToFetch = this.calendars.filter(
      (c) => c.source === 'google' && c.enabled
    );
    console.log('📅 Google calendars to fetch from:', googleCalendarsToFetch.length, googleCalendarsToFetch.map(c => c.name));

    if (googleCalendarsToFetch.length === 0) {
      console.log('📅 No enabled Google calendars to fetch events from.');
      const nonGoogleEvents = this.events.filter(event => event.source !== 'google' && event.start < end && event.end > start);
      console.log('📅 Returning non-Google events:', nonGoogleEvents.length);
      return nonGoogleEvents;
    }

    try {
      console.log(`📅 Fetching Google events for ${googleCalendarsToFetch.length} calendars between ${start.toISOString()} and ${end.toISOString()}`);
      // Corrected: Call this.fetchGoogleEvents, which internally handles API calls for multiple calendars
      const fetchedGoogleEvents = await this.fetchGoogleEvents(
        googleCalendarsToFetch,
        start,
        end
      );
      console.log('📅 Fetched Google events:', fetchedGoogleEvents.length);
      
      // Update the main events list: remove old Google events, add newly fetched ones
      const nonGoogleEvents = this.events.filter(e => e.source !== 'google');
      this.events = [...nonGoogleEvents, ...fetchedGoogleEvents];
      this.saveToStorage();
      
      // Return all events (local + newly fetched Google) that match the date range
      // fetchGoogleEvents should already return events within the date range.
      const allEvents = this.events.filter(event => event.start < end && event.end > start);
      console.log('📅 Total events to return:', allEvents.length);
      return allEvents;

    } catch (error) {
      console.error('📅 Error in fetchEvents while fetching/processing Google events:', error);
      // Fallback: return existing non-Google events that match the date range
      const fallbackEvents = this.events.filter(event => event.source !== 'google' && event.start < end && event.end > start);
      console.log('📅 Returning fallback events:', fallbackEvents.length);
      return fallbackEvents;
    }
  }

  private async fetchGoogleEvents(
    calendars: Calendar[], 
    start: Date, 
    end: Date
  ): Promise<CalendarEvent[]> {
    if (calendars.length === 0) {
      // console.log("No Google calendars provided to fetchGoogleEvents.");
      return [];
    }
    
    if (!this.googleClient || !this.googleClient.isSignedIn()) { // Check using googleClient
        // console.warn("CalendarService: Google client not available or not signed in. Cannot fetch Google events.");
        return [];
    }

    try {
      // Convert dates to ISO strings for Google API
      const timeMin = start.toISOString();
      const timeMax = end.toISOString();
      
      // Fetch events for each enabled Google calendar
      const allEventsPromises = calendars.map(async (calendar) => {
        // const events = await googleAuthService.fetchEvents(calendar.id, timeMin, timeMax); // OLD
        // Use GoogleCalendarService instance and its findEvents method
        // The findEvents method in googleCalendarService.ts expects different params
        // It takes calendarId, applicantName, caseNumbers, lookAroundDate
        // For this context, we are iterating through calendars and have timeMin/timeMax
        // We need to adapt the call or the googleCalendarService.findEvents method
        // For now, let's assume findEvents can be called per calendar with just time range for a basic sync
        // This might require an adjustment in googleCalendarService.findEvents to accept timeMin/timeMax directly
        // Or, findEvents internally constructs its query. Let's see its signature.
        // findEvents(calendarId: string = 'primary', applicantName?: string, caseNumbers?: string[], lookAroundDate?: Date)
        // The current call in calendarService was: googleAuthService.fetchEvents(calendar.id, timeMin, timeMax);
        // This suggests a direct event listing by time range for a specific calendar.
        // googleCalendarService.findEvents is more query-based.
        // Let's use a direct API call via googleClient.request for now, similar to how fetchGoogleCalendars does it.

        const queryParams = `?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&showDeleted=false&singleEvents=true&orderBy=startTime`;
        const endpoint = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events${queryParams}`;

        const response = await this.googleClient!.request<any>({
          url: endpoint,
          method: 'GET'
        });

        const events = (response.data as any).items || [];
        
        return events.map((event: any) => {
          // Handle all-day events
          const isAllDay = !event.start.dateTime;
          
          // Parse start and end times
          const startDate = isAllDay
            ? new Date(event.start.date)
            : new Date(event.start.dateTime);
          
          const endDate = isAllDay
            ? new Date(event.end.date)
            : new Date(event.end.dateTime);
          
          // For all-day events, Google's end date is exclusive, so subtract one day
          if (isAllDay) {
            endDate.setDate(endDate.getDate() - 1);
          }
          
          return {
            id: event.id,
            title: event.summary || 'Untitled Event',
            start: startDate,
            end: endDate,
            allDay: isAllDay,
            description: event.description,
            location: event.location,
            calendarId: calendar.id,
            calendarName: calendar.name,
            color: calendar.color,
            source: 'google' as const
          };
        });
      });
      
      // Flatten the array of arrays into a single array of events
      const results = await Promise.all(allEventsPromises);
      return results.flat();
    } catch (_error) {
      // console.error('Error fetching Google events:', _error);
      return [];
    }
  }
  
  updateCalendarEnabled(calendarId: string, enabled: boolean): void {
    this.calendars = this.calendars.map(calendar => {
      if (calendar.id === calendarId) {
        return { ...calendar, enabled };
      }
      return calendar;
    });
  }

  /**
   * Parses an HH:MM AM/PM time string and a YYYY-MM-DD date string 
   * into an ISO string.
   * Note: This is a simplified parser and assumes valid inputs.
   * It doesn't robustly handle timezones beyond assuming local if not specified.
   * Google Calendar API is best with explicit timezones or UTC.
   */
  private parseDateTime(dateStr: string, timeStr: string): string | null {
    if (!dateStr || !timeStr) return null;

    const [year, month, day] = dateStr.split('-').map(Number);
    const timeParts = timeStr.split(' ');
    const timeString = timeParts[0];
    let modifier = timeParts[1];
    
    const timeNumParts = timeString.split(':').map(Number);
    let hours = timeNumParts[0];
    const minutes = timeNumParts[1];

    if (modifier) { // Handles AM/PM
        modifier = modifier.toUpperCase();
        if (modifier === 'PM' && hours < 12) {
            hours += 12;
        }
        if (modifier === 'AM' && hours === 12) { // Midnight case
            hours = 0;
        }
    } // If no modifier, assume 24-hour format (though our AI prompt specifies AM/PM)

    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) {
        // console.error('CalendarService: Invalid date or time components for parsing', { dateStr, timeStr });
        return null;
    }
    
    // Creates a date object in the local timezone of the server/browser running this.
    // For Google Calendar, it's often better to send UTC or ensure the timeZone field is correctly set.
    const date = new Date(year, month - 1, day, hours, minutes);
    return date.toISOString(); // Converts to UTC ISO string e.g., "2025-06-26T15:30:00.000Z"
  }

  public async createEventFromAnalysis(meetingDetails: EmailAnalysisMeetingDetails, emailSubject: string): Promise<any | null> {
    if (!meetingDetails.eventDate || !meetingDetails.eventTime) {
      // console.warn('[CalendarService] Missing eventDate or eventTime in meetingDetails. Cannot create calendar event.', meetingDetails);
      return null;
    }

    const startTimeISO = this.parseDateTime(meetingDetails.eventDate, meetingDetails.eventTime);
    if (!startTimeISO) {
        // console.error('[CalendarService] Failed to parse start date/time. Cannot create event.');
        return null;
    }

    // For 'end' time, if AI provided 'endTime', use it. Otherwise, default to 1 hour duration.
    // The AI's 'endTime' field in EmailAnalysisMeetingDetails is currently a string. 
    // We'd need a similar parsing logic if it's not already an ISO string.
    // For simplicity now, let's assume if endTime is provided by AI, it's also in a format that needs parsing or is an ISO string.
    // Let's assume it's like eventTime for now if it exists.
    
    let endTimeISO: string | null = null;
    if (meetingDetails.endTime && meetingDetails.eventDate) { // Assuming endTime is just a time like eventTime
        // If AI gives endTime as "HH:MM AM/PM", we need to parse it with the eventDate.
        // If AI gives endTime as a full ISO string, then parseDateTime logic would need adjustment or bypass.
        // For now, let's test this path.
        // This is a placeholder - if AI gives 'endTime' it might be a full timestamp or just a time.
        // Current `EmailAnalysisMeetingDetails` just has `endTime?: string`.
        // Let's assume for now it's also a time string relative to eventDate.
        const parsedEndTime = this.parseDateTime(meetingDetails.eventDate, meetingDetails.endTime);
        if(parsedEndTime) {
            endTimeISO = parsedEndTime;
        } else {
            // console.warn('[CalendarService] Provided endTime could not be parsed, defaulting to 1 hour duration from start time.');
        }
    }
    
    if (!endTimeISO) { // Default to 1 hour duration if endTime parsing failed or not provided
        const startDate = new Date(startTimeISO);
        startDate.setHours(startDate.getHours() + 1);
        endTimeISO = startDate.toISOString();
    }
    
    // Ensure startTime is before endTime
    if (new Date(startTimeISO) >= new Date(endTimeISO)) {
        // console.warn('[CalendarService] Calculated start time is on or after end time. Defaulting end time to 1 hour after start.', {startTimeISO, endTimeISO});
        const startDate = new Date(startTimeISO);
        startDate.setHours(startDate.getHours() + 1);
        endTimeISO = startDate.toISOString();
    }


    const eventInput: CalendarEventInput = {
      summary: meetingDetails.eventType || emailSubject, // Use eventType if available, else email subject
      description: meetingDetails.description || `Event based on email: "${emailSubject}"\nCase Number: ${meetingDetails.caseNumber || 'N/A'}`,
      location: meetingDetails.location || undefined,
      start: {
        dateTime: startTimeISO,
        // timeZone: 'America/Los_Angeles', // Example: Consider making this configurable or detecting user's timezone
      },
      end: {
        dateTime: endTimeISO,
        // timeZone: 'America/Los_Angeles',
      },
      // REMOVED attendees to prevent email invites
      // attendees: meetingDetails.attendees?.map(email => ({ email })) || [],
      source: {
        title: `Original Email: ${emailSubject}`,
        url: '' // Placeholder, ideally link to the email
      },
      caseNumber: meetingDetails.caseNumber,
      eventType: meetingDetails.eventType,
    };
    
    // Add Google Meet conference data if location hints at a video call
    // This is a simple heuristic and might need to be more robust
    if (meetingDetails.location && (meetingDetails.location.toLowerCase().includes('video:') || meetingDetails.location.toLowerCase().includes('meet.google.com'))) {
        eventInput.conferenceData = {
            createRequest: {
                requestId: `genieflow-${Date.now()}`, // Unique ID for the request
                conferenceSolutionKey: { type: "hangoutsMeet" } 
            }
        };
    }


    // console.log('[CalendarService] Attempting to create calendar event with input:', JSON.stringify(eventInput, null, 2));

    if (!this.googleClient) {
      throw new Error('Google client not initialized - cannot create calendar event');
    }

    try {
      const createdEvent = await this.googleClient.request<any>({
        url: 'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=none',
        method: 'POST',
        data: eventInput,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('[CalendarService] Successfully created calendar event (no invites sent):', createdEvent);
      return createdEvent;
    } catch (_error) {
      console.error('[CalendarService] Error creating calendar event:', _error);
      // Log the specific error from Google if available
      if (_error instanceof Error && (_error as any).body) {
        console.error('[CalendarService] Google API Error Body:', (_error as any).body);
      }
      return null;
    }
  }
}

// Create a singleton instance
export const calendarService = new CalendarService();
