import { googleApiClient } from '../google/GoogleAPIClient';
import { EmailAnalysisMeetingDetails } from '../email/types';

// Interface for the data needed to create a calendar event via this service
export interface AiCalendarEventInput {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string; // RFC3339 format, e.g., '2025-06-26T09:00:00-07:00'
    timeZone?: string; // e.g., 'America/Los_Angeles' (optional, API defaults to calendar's timezone)
  };
  end: {
    dateTime: string; // RFC3339 format
    timeZone?: string;
  };
  attendees?: Array<{ email: string }>;
  source?: { // To link back to the email
    title: string; // e.g., Email subject
    url: string;   // e.g., A link to the email if possible (placeholder for now)
  };
  conferenceData?: any; // For Google Meet links if provided explicitly
  attachments?: any[]; // Added to support preserving attachments
  // Add extended properties for better linking and future querying
  extendedProperties?: {
    private?: {
      [key: string]: string;
      // emailMessageId?: string; // Removed, covered by index signature
      // emailThreadId?: string;  // Removed, covered by index signature
      // genieflowCaseNumber?: string; // Removed, covered by index signature
      // genieflowEventType?: string;  // Removed, covered by index signature
    };
  };
}

export class AiCalendarService {
  // Google client for API requests
  private googleClient = googleApiClient;

  /**
   * Parses an HH:MM AM/PM time string and a YYYY-MM-DD date string 
   * into an ISO string (UTC).
   */
  private parseDateTimeToISO(dateStr: string, timeStr: string): string | null {
    if (!dateStr || !timeStr) return null;

    const [year, month, day] = dateStr.split('-').map(Number);
    let [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (isNaN(year) || year < 1900 || year > 2200) return null; // Basic validation
    if (isNaN(month) || month < 1 || month > 12) return null;
    if (isNaN(day) || day < 1 || day > 31) return null;
    if (isNaN(hours) || hours < 0 || hours > 23) { // Before AM/PM adjustment
      if (!(modifier && (hours === 12))) return null; // allow 12AM/12PM before adjustment
    }
    if (isNaN(minutes) || minutes < 0 || minutes > 59) return null;

    if (modifier) {
      modifier = modifier.toUpperCase();
      if (modifier === 'PM' && hours >= 1 && hours < 12) {
        hours += 12;
      }
      if (modifier === 'AM' && hours === 12) { // Midnight case: 12 AM is 00 hours
        hours = 0;
      }
    } // If no modifier, assume 24-hour format if hours are valid (0-23)

    // Double check hours after AM/PM
    if (hours < 0 || hours > 23) return null;

    try {
      // Create Date object using UTC values to avoid local timezone shifts during ISO conversion
      const date = new Date(Date.UTC(year, month - 1, day, hours, minutes));
      if (isNaN(date.getTime())) return null; // Check if date is valid after construction
      return date.toISOString(); // e.g., "2025-06-26T15:30:00.000Z"
    } catch (e) {
      // console.error('[AiCalendarService] Error constructing date for ISO string:', e);
      return null;
    }
  }

  /**
   * Parses an HH:MM AM/PM time string and a YYYY-MM-DD date string
   * into a local YYYY-MM-DDTHH:MM:SS formatted string.
   */
  private parseDateTimeToLocalStringFormat(dateStr: string, timeStr: string): string | null {
    if (!dateStr || !timeStr) return null;

    const [year, month, day] = dateStr.split('-').map(Number);
    let [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    // Basic validation (can be enhanced)
    if (isNaN(year) || year < 1900 || year > 2200) return null;
    if (isNaN(month) || month < 1 || month > 12) return null;
    if (isNaN(day) || day < 1 || day > 31) return null;
    if (isNaN(hours) || hours < 0 || hours > 23) { // Check before AM/PM adjustment
      if (!(modifier && (hours === 12))) return null;
    }
    if (isNaN(minutes) || minutes < 0 || minutes > 59) return null;

    if (modifier) {
      modifier = modifier.toUpperCase();
      if (modifier === 'PM' && hours >= 1 && hours < 12) {
        hours += 12;
      }
      if (modifier === 'AM' && hours === 12) { // Midnight case: 12 AM is 00 hours
        hours = 0;
      }
    }

    if (hours < 0 || hours > 23) return null; // Double check hours

    // Format to YYYY-MM-DDTHH:MM:SS
    const HH = String(hours).padStart(2, '0');
    const MM = String(minutes).padStart(2, '0');
    const SS = '00'; // Assuming seconds are always 00
    const YYYY = String(year);
    const M = String(month).padStart(2, '0');
    const D = String(day).padStart(2, '0');

    return `${YYYY}-${M}-${D}T${HH}:${MM}:${SS}`;
  }

  public async findEventByCaseNumber(caseNumber: string): Promise<any | null> {
    if (!caseNumber) {
      // console.warn('[AiCalendarService] findEventByCaseNumber called with no caseNumber.');
      return null;
    }
    // console.log(`[AiCalendarService] Attempting to find event by caseNumber: ${caseNumber}`);

    try {
      const encodedPropertyName = encodeURIComponent('genieflowCaseNumber');
      const encodedPropertyValue = encodeURIComponent(caseNumber);
      // We expect only one genieflowCaseNumber property per event for this use case.
      const privateExtendedPropertyQuery = `${encodedPropertyName}=${encodedPropertyValue}`;

      // Fetch up to 5 events, in case of duplicates, though ideally caseNumber should be unique for active events.
      const path = `https://www.googleapis.com/calendar/v3/calendars/primary/events?privateExtendedProperty=${privateExtendedPropertyQuery}&maxResults=5`;

      // console.log(`[AiCalendarService] Querying for existing event with path: ${path}`);

      const { data: response } = await this.googleClient.request<{ items: any[] }>({
        url: path,
        method: 'GET'
      });

      if (response && response.items && response.items.length > 0) {
        // Assuming the first event found is the correct one.
        // If multiple events share the same case number, this might need more sophisticated handling
        // (e.g., sorting by creation date or last modified, though the API doesn't directly sort on extendedProps).
        const event = response.items[0];
        // console.log(`[AiCalendarService] Found existing event for caseNumber ${caseNumber} with ID: ${event.id}`);
        return event;
      } else {
        // console.log(`[AiCalendarService] No existing event found for caseNumber ${caseNumber}.`);
        return null;
      }
    } catch (error) {
      // console.error(`[AiCalendarService] Error finding event by caseNumber ${caseNumber}:`, error);
      return null;
    }
  }

  public async createEventFromAnalysis(
    meetingDetails: EmailAnalysisMeetingDetails,
    emailSubject: string,
    emailMessageId?: string,
    emailThreadId?: string
  ): Promise<any | null> {
    if (!meetingDetails.eventDate || !meetingDetails.eventTime) {
      // console.warn('[AiCalendarService] Missing eventDate or eventTime. Cannot create calendar event.', meetingDetails);
      return null;
    }

    const localStartTimeStr = this.parseDateTimeToLocalStringFormat(meetingDetails.eventDate, meetingDetails.eventTime);
    if (!localStartTimeStr) {
      // console.error('[AiCalendarService] Failed to parse start date/time to local string format:', { date: meetingDetails.eventDate, time: meetingDetails.eventTime });
      return null;
    }

    let localEndTimeStr: string | null = null;
    if (meetingDetails.endTime && meetingDetails.eventDate) {
      // If endTime is a full ISO UTC string, this specific handling might need review based on expected format of meetingDetails.endTime
      // For now, assuming if it's not explicitly UTC, it's a local time string like eventTime.
      if (meetingDetails.endTime.includes('T') && meetingDetails.endTime.includes('Z')) {
        // console.warn('[AiCalendarService] meetingDetails.endTime appears to be a UTC ISO string. Attempting to parse as local time relative to eventDate for consistency. Review this logic if endTime can be UTC.', meetingDetails.endTime);
        // This case is tricky: if it's a UTC string, we'd ideally convert it to a Pacific local time string.
        // For now, we'll try to parse it as if it were a local time string related to eventDate, which might be incorrect if it's truly UTC.
        // A better approach would be to convert this UTC string to 'America/Los_Angeles' local time string.
        // As a simplification, let's assume if it's not parseable as local time string, we default to 1 hour duration.
        const tempEndTime = meetingDetails.endTime.split('T')[1]?.substring(0, 5); // try to extract HH:MM
        if (tempEndTime) {
          localEndTimeStr = this.parseDateTimeToLocalStringFormat(meetingDetails.eventDate, tempEndTime); // This assumes it's on the same date and the time part is local.
        }
      } else {
        localEndTimeStr = this.parseDateTimeToLocalStringFormat(meetingDetails.eventDate, meetingDetails.endTime);
      }
      if (!localEndTimeStr) {
        // console.warn('[AiCalendarService] Provided endTime could not be parsed to local string format, defaulting to 1 hour duration from start time.', { date: meetingDetails.eventDate, endTime: meetingDetails.endTime });
      }
    }

    if (!localEndTimeStr) {
      const [datePart, timePart] = localStartTimeStr.split('T');
      let [hours, minutes] = timePart.split(':').map(Number);
      hours += 1; // Add 1 hour for default duration
      let endDayOffset = 0;
      if (hours >= 24) {
        hours -= 24;
        endDayOffset = 1; // Event ends on the next day
      }

      let endDateStr = datePart;
      if (endDayOffset > 0) {
        // Basic date increment, for more complex date math a library is better
        const startDateObj = new Date(datePart + "T00:00:00"); // Use a date object for reliable date increment
        startDateObj.setDate(startDateObj.getDate() + endDayOffset);
        endDateStr = startDateObj.toISOString().split('T')[0];
      }

      const endHH = String(hours).padStart(2, '0');
      const endMM = String(minutes).padStart(2, '0');
      localEndTimeStr = `${endDateStr}T${endHH}:${endMM}:00`;
    }

    // Ensure startTime is before endTime
    // Comparing local strings directly can be problematic if they cross midnight without date change in string.
    // However, Google API will validate. For basic check:
    if (localStartTimeStr >= localEndTimeStr && meetingDetails.eventDate === localEndTimeStr.substring(0, 10) /* ensure same day for simple comparison or date was incremented */) {
      // console.warn('[AiCalendarService] Start time is on or after end time. Defaulting end time to 1 hour after start (re-evaluating).', { localStartTimeStr, localEndTimeStr });
      const [datePart, timePart] = localStartTimeStr.split('T');
      let [hours, minutes] = timePart.split(':').map(Number);
      hours += 1;
      let endDayOffset = 0;
      if (hours >= 24) {
        hours -= 24;
        endDayOffset = 1;
      }
      let endDateStr = datePart;
      if (endDayOffset > 0) {
        const startDateObj = new Date(datePart + "T00:00:00");
        startDateObj.setDate(startDateObj.getDate() + endDayOffset);
        endDateStr = startDateObj.toISOString().split('T')[0];
      }
      const endHH = String(hours).padStart(2, '0');
      const endMM = String(minutes).padStart(2, '0');
      localEndTimeStr = `${endDateStr}T${endHH}:${endMM}:00`;
    }

    // Construct the new dynamic summary using improved format: "[Type] [Time] [Employee] w/Judge [Full Name]"
    const eventTypeForDisplay = meetingDetails.eventType || "Hearing";
    const personInvolved = meetingDetails.personInvolved;
    const judgeName = meetingDetails.judgeName;

    // Format: "[Type] [Time] [Employee] w/Judge [Full Name]"
    let newSummary = eventTypeForDisplay;
    if (meetingDetails.eventTime) {
      // Extract just the time part (e.g., "08:30" from "08:30 AM")
      const timeOnly = meetingDetails.eventTime.replace(/\s*(AM|PM|A\.M\.|P\.M\.)/i, '').trim();
      newSummary += ` ${timeOnly}`;
    }
    if (personInvolved) {
      newSummary += ` ${personInvolved}`;
    }
    if (judgeName) {
      // Handle judge name formatting - ensure "Joseph Yalon" format
      let formattedJudge = judgeName.trim().replace(/\.$/, '');
      if (formattedJudge.toLowerCase().includes('yalon')) {
        formattedJudge = 'Joseph Yalon';
      }
      newSummary += ` w/Judge ${formattedJudge}`;
    }

    // Fallback if we can't construct the proper format
    if (!newSummary || newSummary === eventTypeForDisplay) {
      newSummary = meetingDetails.eventTitle || meetingDetails.description || emailSubject || 'Calendar Event';
    }

    const eventInput: AiCalendarEventInput = {
      summary: newSummary, // Use the new dynamically constructed summary
      description: `Event Details:\nCase Number: ${meetingDetails.caseNumber || 'N/A'}\nEvent Type: ${meetingDetails.eventType || 'N/A'}\nPerson Involved: ${meetingDetails.personInvolved || 'N/A'}\nJudge: ${meetingDetails.judgeName || 'N/A'}\nTime: ${meetingDetails.eventTime || 'N/A'} (Date: ${meetingDetails.eventDate || 'N/A'})\nLocation: ${meetingDetails.location || 'N/A'}\nOriginal Description: ${meetingDetails.description || 'N/A'}\n\n(Created from email: "${emailSubject}")`,
      location: meetingDetails.location || undefined,
      start: { dateTime: localStartTimeStr, timeZone: 'America/Los_Angeles' },
      end: { dateTime: localEndTimeStr, timeZone: 'America/Los_Angeles' },
      // REMOVED attendees to prevent email invites
      // attendees: meetingDetails.attendees?.map(email => ({ email })).filter(a => a.email) || [],
      source: {
        title: `Original Email: ${emailSubject}`,
        url: emailMessageId ? `https://mail.google.com/mail/u/0/#inbox/${emailMessageId}` : ''
      },
      extendedProperties: (() => {
        const privateProps: { [key: string]: string } = {
          genieflowProcessed: 'true',
          genieflowSource: 'emailAnalysis',
        };
        if (emailMessageId) privateProps.emailMessageId = emailMessageId;
        if (emailThreadId) privateProps.emailThreadId = emailThreadId;
        if (meetingDetails.caseNumber) privateProps.genieflowCaseNumber = meetingDetails.caseNumber;
        if (meetingDetails.eventType) privateProps.genieflowEventType = meetingDetails.eventType;
        // Add new fields to extended properties for querying/display if needed later
        if (meetingDetails.personInvolved) privateProps.genieflowPersonInvolved = meetingDetails.personInvolved;
        if (meetingDetails.judgeName) privateProps.genieflowJudgeName = meetingDetails.judgeName;
        return { private: privateProps };
      })()
    };

    if (meetingDetails.location && (meetingDetails.location.toLowerCase().includes('video:') || meetingDetails.location.toLowerCase().includes('meet.google.com'))) {
      eventInput.conferenceData = {
        createRequest: {
          requestId: `genieflow-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" }
        }
      };
    }

    console.log('[AiCalendarService] Creating calendar event with input:', JSON.stringify(eventInput, null, 2));

    try {
      const { data: createdEvent } = await this.googleClient.request<any>({
        // IMPORTANT: sendUpdates=none prevents email invites from being sent
        url: 'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=none',
        method: 'POST',
        body: JSON.stringify(eventInput),
        headers: {
          'Content-Type': 'application/json',
        },
      } as any);
      console.log('[AiCalendarService] Successfully created calendar event (no invites sent):', createdEvent);
      return createdEvent;
    } catch (error) {
      console.error('[AiCalendarService] Error creating calendar event:', error);
      return null;
    }
  }

  public async updateEvent(
    eventId: string,
    meetingDetails: EmailAnalysisMeetingDetails,
    emailSubject: string,
    emailMessageId?: string,
    emailThreadId?: string
  ): Promise<any | null> {
    if (!eventId) {
      // console.warn('[AiCalendarService] updateEvent called with no eventId.');
      return null;
    }
    // Ensure meetingDetails and its core date/time components are present for the update's primary purpose (rescheduling/timing)
    if (!meetingDetails || !meetingDetails.eventDate || !meetingDetails.eventTime) {
      // console.warn('[AiCalendarService] updateEvent: Missing essential meetingDetails, eventDate, or eventTime. Cannot reliably update calendar event.', meetingDetails);
      return null;
    }
    // console.log(`[AiCalendarService] Attempting to 'move and update' event ID: ${eventId} with new details:`, meetingDetails);

    let existingEvent: any = null;
    try {
      // console.log(`[AiCalendarService] Fetching existing event ID: ${eventId}`);
      const { data } = await this.googleClient.request<any>({
        url: `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
        method: 'GET'
      });
      existingEvent = data;
      if (!existingEvent) {
        console.error(`[AiCalendarService] Failed to fetch existing event ID: ${eventId}. Event not found.`);
        return null; // Or throw error
      }
      // console.log(`[AiCalendarService] Successfully fetched existing event ID: ${eventId}`, existingEvent);
    } catch (fetchError: any) {
      // console.error(`[AiCalendarService] Error fetching existing event ID ${eventId}:`, fetchError);
      return null; // Or rethrow
    }

    const localStartTimeStr = this.parseDateTimeToLocalStringFormat(meetingDetails.eventDate, meetingDetails.eventTime);
    if (!localStartTimeStr) {
      // console.error('[AiCalendarService] updateEvent: Failed to parse start date/time to local string format:', { date: meetingDetails.eventDate, time: meetingDetails.eventTime });
      return null;
    }

    let localEndTimeStr: string | null = null;
    if (meetingDetails.endTime && meetingDetails.eventDate) {
      if (meetingDetails.endTime.includes('T') && meetingDetails.endTime.includes('Z')) {
        const tempEndTime = meetingDetails.endTime.split('T')[1]?.substring(0, 5);
        if (tempEndTime) {
          localEndTimeStr = this.parseDateTimeToLocalStringFormat(meetingDetails.eventDate, tempEndTime);
        }
      } else {
        localEndTimeStr = this.parseDateTimeToLocalStringFormat(meetingDetails.eventDate, meetingDetails.endTime);
      }
      if (!localEndTimeStr) {
        // console.warn('[AiCalendarService] updateEvent: Provided endTime could not be parsed, defaulting to 1 hour duration from new start time.');
      }
    }

    if (!localEndTimeStr) {
      const [datePart, timePart] = localStartTimeStr.split('T');
      let [hours, minutes] = timePart.split(':').map(Number);
      hours += 1;
      let endDayOffset = 0;
      if (hours >= 24) { hours -= 24; endDayOffset = 1; }
      let endDateStr = datePart;
      if (endDayOffset > 0) {
        const startDateObj = new Date(datePart + "T00:00:00");
        startDateObj.setDate(startDateObj.getDate() + endDayOffset);
        endDateStr = startDateObj.toISOString().split('T')[0];
      }
      const endHH = String(hours).padStart(2, '0');
      const endMM = String(minutes).padStart(2, '0');
      localEndTimeStr = `${endDateStr}T${endHH}:${endMM}:00`;
    }

    // Construct the event patch object
    const eventPatch: Partial<AiCalendarEventInput> & { sequence?: number } = {};

    // Core updates from new meetingDetails
    eventPatch.start = { dateTime: localStartTimeStr, timeZone: 'America/Los_Angeles' };
    eventPatch.end = { dateTime: localEndTimeStr, timeZone: 'America/Los_Angeles' };

    // Summary: Use the improved title format - "[Type] [Time] [Employee] w/Judge [Full Name]"
    const newSummaryParts: string[] = [];
    const eventTypeForDisplay = meetingDetails.eventType || (existingEvent.extendedProperties?.private?.genieflowEventType) || "Hearing";
    const personInvolved = meetingDetails.personInvolved || (existingEvent.extendedProperties?.private?.genieflowPersonInvolved);
    const judgeName = meetingDetails.judgeName || (existingEvent.extendedProperties?.private?.genieflowJudgeName);

    // Format: "[Type] [Time] [Employee] w/Judge [Full Name]"
    let finalSummary = eventTypeForDisplay;
    if (meetingDetails.eventTime) {
      // Extract just the time part (e.g., "08:30" from "08:30 AM")
      const timeOnly = meetingDetails.eventTime.replace(/\s*(AM|PM|A\.M\.|P\.M\.)/i, '').trim();
      finalSummary += ` ${timeOnly}`;
    }
    if (personInvolved) {
      finalSummary += ` ${personInvolved}`;
    }
    if (judgeName) {
      // Handle judge name formatting - ensure "Joseph Yalon" format
      let formattedJudge = judgeName.trim().replace(/\.$/, '');
      if (formattedJudge.toLowerCase().includes('yalon')) {
        formattedJudge = 'Joseph Yalon';
      }
      finalSummary += ` w/Judge ${formattedJudge}`;
    }

    // Fallback if we can't construct the proper format
    if (!finalSummary || finalSummary === eventTypeForDisplay) {
      finalSummary = meetingDetails.eventTitle || existingEvent.summary || emailSubject || 'Updated Event';
    }
    eventPatch.summary = finalSummary;

    // Description: Intelligently merge new information with existing notes
    let finalDescription = existingEvent.description || '';

    // Preserve all existing content and add new update section
    const updateTimestamp = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
    const separator = finalDescription.length > 0 ? '\n\n' : '';

    const newDetailsSection = `${separator}--- Event Update (${updateTimestamp}) ---
Source Email: "${emailSubject}"
Updated Schedule: ${meetingDetails.eventDate} at ${meetingDetails.eventTime}` +
      (meetingDetails.location ? `
Updated Location: ${meetingDetails.location}` : '') +
      (meetingDetails.description ? `
Additional Notes: ${meetingDetails.description}` : '') +
      (meetingDetails.caseNumber ? `
Case Number: ${meetingDetails.caseNumber}` : '') +
      (emailMessageId ? `
Email Reference: ${emailMessageId}` : '');

    finalDescription += newDetailsSection;
    eventPatch.description = finalDescription;

    // Location
    eventPatch.location = meetingDetails.location || existingEvent.location || undefined;

    // Attendees: New list from meetingDetails replaces old, or preserves if new is not given.
    // REMOVED ATTENDEES TO PREVENT EMAIL INVITES
    // if (meetingDetails.attendees && meetingDetails.attendees.length > 0) {
    //     eventPatch.attendees = meetingDetails.attendees.map(email => ({ email })).filter(a => typeof a.email === 'string' && a.email.trim() !== '');
    // } else if (meetingDetails.attendees === null || meetingDetails.attendees === undefined) { // Explicitly not provided
    //     eventPatch.attendees = existingEvent.attendees || []; // Preserve old
    // } else { // Provided as empty array
    //     eventPatch.attendees = []; // Clear attendees
    // }

    // Always clear attendees to prevent any email invites
    eventPatch.attendees = [];

    // Preserve attachments from existing event
    if (existingEvent.attachments) {
      eventPatch.attachments = existingEvent.attachments;
      // TODO: Add logic here if meetingDetails can also provide new/updated attachments to merge/replace
    }

    // ConferenceData (Google Meet links, etc.)
    if (meetingDetails.location && (meetingDetails.location.toLowerCase().includes('video:') || meetingDetails.location.toLowerCase().includes('meet.google.com'))) {
      eventPatch.conferenceData = {
        createRequest: {
          requestId: `genieflow-video-${Date.now()}`, // Unique ID for the conference request
          conferenceSolutionKey: { type: "hangoutsMeet" },
          // status: { statusCode: "success" } // Not typically needed for createRequest by client
        }
      };
      // To ensure a new Meet link is generated or if one exists, it's properly associated.
      // If an existing meeting link should be explicitly cleared and a new one generated,
      // the API might need `conferenceData: null` first in a separate patch, or specific handling.
      // For now, requesting new one. If one exists, API might reuse or update.
    } else if (existingEvent.conferenceData) {
      // No new video location specified, preserve old conference data
      eventPatch.conferenceData = existingEvent.conferenceData;
    } else {
      // No new video location and no old conference data, explicitly set to null to clear
      eventPatch.conferenceData = null;
    }

    // Extended Properties: Merge, update operation log
    const privateProps: { [key: string]: string } = {
      ...existingEvent.extendedProperties?.private,
      genieflowProcessed: 'true',
      genieflowSource: existingEvent.extendedProperties?.private?.genieflowSource === 'emailAnalysis' ? 'emailAnalysis_moved_updated' : 'manual_moved_updated',
      genieflowLastOperation: 'moved_and_updated',
      genieflowLastOperationTimestamp: new Date().toISOString(),
      previousEventStartTime: existingEvent.start?.dateTime || existingEvent.start?.date || 'N/A',
      previousEventEndTime: existingEvent.end?.dateTime || existingEvent.end?.date || 'N/A',
    };
    if (emailMessageId) privateProps.emailMessageId = emailMessageId; // Update if new email triggered
    if (emailThreadId) privateProps.emailThreadId = emailThreadId;   // Update if new email triggered
    // Update other genieflow properties from new meetingDetails, only if they are new
    if (meetingDetails.caseNumber && meetingDetails.caseNumber !== privateProps.genieflowCaseNumber) privateProps.genieflowCaseNumber = meetingDetails.caseNumber;
    if (meetingDetails.eventType && meetingDetails.eventType !== privateProps.genieflowEventType) privateProps.genieflowEventType = meetingDetails.eventType;
    if (meetingDetails.personInvolved && meetingDetails.personInvolved !== privateProps.genieflowPersonInvolved) privateProps.genieflowPersonInvolved = meetingDetails.personInvolved;
    if (meetingDetails.judgeName && meetingDetails.judgeName !== privateProps.genieflowJudgeName) privateProps.genieflowJudgeName = meetingDetails.judgeName;
    eventPatch.extendedProperties = { private: privateProps };

    // Increment sequence for Google Calendar to handle optimistic concurrency
    if (typeof existingEvent.sequence === 'number') {
      eventPatch.sequence = existingEvent.sequence;
      // Google Calendar API: "Sequence number of the event being updated. Optional for GSync clients only, mandatory otherwise."
      // While the API says optional for GSync, it's good practice for robustness.
      // The API might update sequence on its own, but providing it can help avoid race conditions if known.
      // The event returned from PATCH will have the new sequence.
    }


    // console.log(`[AiCalendarService] Attempting to patch event ID: ${eventId} with merged input:`, JSON.stringify(eventPatch, null, 2));

    try {
      const { data: updatedEvent } = await this.googleClient.request<any>({
        // IMPORTANT: sendUpdates=none prevents email invites from being sent
        url: `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?sendUpdates=none`,
        method: 'PATCH',
        body: JSON.stringify(eventPatch),
        headers: {
          'Content-Type': 'application/json',
        },
      } as any);
      console.log('[AiCalendarService] Successfully updated calendar event (no invites sent):', updatedEvent);
      return updatedEvent;
    } catch (error: any) {
      // console.error(`[AiCalendarService] Error 'moving and updating' event ID ${eventId}:`, error);
      // Log more details from the error if available, e.g., error.response.data
      if (error.response && error.response.data) {
        // console.error('[AiCalendarService] Google API Error details:', error.response.data);
      }
      return null;
    }
  }
}

export const aiCalendarService = new AiCalendarService(); 