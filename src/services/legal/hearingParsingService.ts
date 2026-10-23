import { LegalHearingInfo } from '../../types/legal'; // Adjust path as necessary

/**
 * Extends LegalHearingInfo to include other details extracted from the notice
 * that might be useful for case creation or context, even if not directly part of
 * the core LegalHearingInfo calendaring fields.
 */
export interface ParsedHearingNotice extends LegalHearingInfo {
  rawText: string; // Store the original text for reference
  caseNumbers?: string[];
  employers?: string[];
  insurer?: string;
  typeOfHearing?: string;
  timeOfHearing?: string; // Store time as string initially
  locationDetails?: string;
  lengthOfHearingHours?: string; // Added to store parsed hearing length
  // The 'notes' field from LegalHearingInfo can store 'SPECIAL COMMENTS/INSTRUCTIONS'
}

export class HearingParsingService {
  public parseNoticeText(text: string): ParsedHearingNotice | null {
    const cleanedText = text.replace(/�/g, ''); // Remove Unicode replacement characters if any

    const employee = this.extractValue(cleanedText, /EMPLOYEE:\s*(.*)/);
    const dateOfHearingStr = this.extractValue(cleanedText, /DATE OF HEARING:\s*(\d{2}\/\d{2}\/\d{4})/);
    const timeOfHearingStr = this.extractValue(cleanedText, /TIME OF HEARING:\s*(.*)/);
    const judge = this.extractValue(cleanedText, /JUDGE:\s*(.*)/);
    const caseNbrsStr = this.extractValue(cleanedText, /CASE NBR\(s\):\s*(.*)/);
    const employersStr = this.extractValue(cleanedText, /EMPLOYER:\s*(.*)/);
    const insurer = this.extractValue(cleanedText, /INSURER:\s*(.*)/);
    const typeOfHearing = this.extractValue(cleanedText, /TYPE OF HEARING:\s*(.*)/);
    
    // For multi-line location and comments, we need more careful regex
    const locationMatch = cleanedText.match(/LOCATION:\s*([\s\S]*?)(?=JUDGE:|SPECIAL COMMENTS\/INSTRUCTIONS:|WC01 Rev\.)/);
    const locationDetails = locationMatch && locationMatch[1] ? locationMatch[1].trim().replace(/\s*VIDEOCONFERENCE\s*$/, '').trim() : undefined;

    const commentsMatch = cleanedText.match(/SPECIAL COMMENTS\/INSTRUCTIONS:\s*([\s\S]*?)(?=NOTICE TO INJURED WORKERS:|You are hereby notified|WC01 Rev\.)/);
    const specialComments = commentsMatch && commentsMatch[1] ? commentsMatch[1].trim() : undefined;

    if (!dateOfHearingStr || !timeOfHearingStr || !employee) {
      // Essential information missing, cannot parse effectively
      console.warn('HearingParsingService: Essential info missing (date, time, or employee).');
      return null;
    }

    let hearingDateTime: Date | undefined = undefined;
    try {
      // Attempt to combine date and time. AM/PM parsing can be tricky.
      // Example: "06/26/2025" and "08:30 A.M."
      const [month, day, year] = dateOfHearingStr.split('/');
      const [time, period] = timeOfHearingStr.toUpperCase().split(/\s+/);
      let [hours, minutes] = time.split(':').map(Number);

      if (period === 'P.M.' && hours !== 12) {
        hours += 12;
      } else if (period === 'A.M.' && hours === 12) { // Midnight case
        hours = 0;
      }
      // Ensure month is 0-indexed for Date constructor
      hearingDateTime = new Date(Number(year), Number(month) - 1, Number(day), hours, minutes);
      if (isNaN(hearingDateTime.getTime())) {
          throw new Error('Invalid date constructed');
      }
    } catch (e) {
      console.error('HearingParsingService: Error parsing date/time:', dateOfHearingStr, timeOfHearingStr, e);
      // If parsing fails, we might still return the notice with string dates/times
      // or return null depending on strictness. For now, we'll proceed but hearingDate will be undefined.
    }

    return {
      rawText: text,
      applicantName: employee,
      hearingDate: hearingDateTime,
      hearingStatus: 'scheduled', // Default for a new notice
      judge: judge,
      notes: specialComments,
      caseNumbers: caseNbrsStr ? caseNbrsStr.split(',').map(s => s.trim()) : undefined,
      employers: employersStr ? employersStr.split(',').map(s => s.trim()) : undefined,
      insurer: insurer,
      typeOfHearing: typeOfHearing,
      timeOfHearing: timeOfHearingStr, // Keep original string time for reference
      locationDetails: locationDetails,
    };
  }

  private extractValue(text: string, regex: RegExp): string | undefined {
    const match = text.match(regex);
    return match && match[1] ? match[1].trim() : undefined;
  }
} 