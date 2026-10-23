import { EmailMessage } from '../email/types';

export interface EmailEventDetails {
  title: string;
  dateTime: Date;
  endDateTime?: Date;
  location: string;
  attendees: string[];
  description: string;
  eventType: 'deposition' | 'appointment' | 'meeting' | 'deadline' | 'court-date' | 'qme' | 'custom';
  requiredActions: string[];
  documents: string[];
  confidence: number;
  extractedData: {
    caseNumber?: string;
    clientName?: string;
    opposing?: string;
    judge?: string;
    courtRoom?: string;
    doctorName?: string;
    specialty?: string;
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  attendees: string[];
  eventType: string;
  sourceEmail: string;
  sourceEmails?: string[]; // Track multiple source emails for merged events
  relatedTasks: string[];
  reminders: EventReminder[];
  attachments?: any[]; // Email attachments and related documents
  metadata: any;
}

export interface EventReminder {
  id: string;
  type: 'email' | 'popup' | 'sms' | 'desktop';
  timing: 'before' | 'at' | 'after';
  offset: number; // minutes
  message: string;
  recurring?: boolean;
  eventId?: string;
  taskId?: string;
  targetDate?: Date;
  urgency?: 'info' | 'warning' | 'urgent' | 'critical';
}

export interface TaskDefinition {
  id?: string;
  title: string;
  description: string;
  offsetDays: number; // negative for before, positive for after
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDuration: number; // minutes
  requiredDocuments?: string[];
  assignee?: string;
  reminders: TaskReminder[];
  category?: string; // Added to support task categorization
}

export interface TaskReminder {
  type: 'email' | 'popup' | 'sms' | 'desktop';
  offsetHours: number; // before task due date
  message: string;
}

export interface EventPatternConfig {
  keywords: string[];
  patterns: RegExp[];
  priority: number; // Higher priority patterns are checked first
}

export interface AnalyzerConfig {
  eventPatterns: Record<string, EventPatternConfig>;
  legalIndicators: string[];
  dateFormats: string[];
  customExtractors?: {
    caseNumber?: RegExp[];
    clientName?: RegExp[];
    judge?: RegExp[];
    location?: RegExp[];
  };
}

export class EmailEventAnalyzer {
  private config: AnalyzerConfig;

  constructor(config?: Partial<AnalyzerConfig>) {
    this.config = this.mergeWithDefaults(config || {});
  }

  private mergeWithDefaults(userConfig: Partial<AnalyzerConfig>): AnalyzerConfig {
    const defaultConfig: AnalyzerConfig = {
      eventPatterns: {
        'court-date': {
          keywords: ['hearing', 'court', 'trial', 'motion', 'adjudication', 'wcab', 'conference', 'calendar'],
          patterns: [
            // Very broad patterns to catch many legal events
            /hearing/i,
            /court/i,
            /trial/i,
            /motion/i,
            /adjudication/i,
            /wcab/i,
            /conference/i,
            /calendar/i,
            /scheduled/i,
            /appointment/i,
            /notice/i,
            /date.*time/i,
            /when.*where/i,
            /\d{1,2}\/\d{1,2}\/\d{4}/i, // Any date pattern
            /\d{1,2}:\d{2}\s*(am|pm|a\.m\.|p\.m\.)/i, // Any time pattern
            /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
            /(january|february|march|april|may|june|july|august|september|october|november|december)/i,
            /case\s*(number|nbr|#)/i,
            /judge/i,
            /attorney/i,
            /counsel/i,
            /legal/i,
            /law/i
          ],
          priority: 1
        },
        deposition: {
          keywords: ['deposition', 'depo', 'testimony', 'examination'],
          patterns: [
            /deposition/i,
            /depo/i,
            /testimony/i,
            /examination/i,
            /witness/i,
            /questioning/i
          ],
          priority: 2
        },
        qme: {
          keywords: ['medical', 'doctor', 'examination', 'qme', 'physician'],
          patterns: [
            /medical/i,
            /doctor/i,
            /examination/i,
            /qme/i,
            /physician/i,
            /dr\./i,
            /clinic/i,
            /appointment/i
          ],
          priority: 3
        },
        appointment: {
          keywords: ['meeting', 'appointment', 'consultation', 'conference'],
          patterns: [
            /meeting/i,
            /appointment/i,
            /consultation/i,
            /conference/i,
            /discussion/i,
            /call/i,
            /zoom/i,
            /teams/i
          ],
          priority: 4
        }
      },
      legalIndicators: [
        // Broad legal terms
        'hearing', 'court', 'deposition', 'wcab', 'workers compensation', 'workers comp',
        'case number', 'case nbr', 'judge', 'adjudication', 'conference', 'examination',
        'legal', 'law', 'attorney', 'counsel', 'esq', 'plaintiff', 'defendant',
        'motion', 'trial', 'settlement', 'mediation', 'arbitration',
        'subpoena', 'summons', 'complaint', 'answer', 'discovery',
        'testimony', 'witness', 'evidence', 'exhibit',
        'insurance', 'claim', 'injury', 'accident', 'liability',
        'medical', 'doctor', 'physician', 'clinic', 'hospital',
        'appointment', 'meeting', 'conference', 'consultation',
        // Time/date indicators
        'scheduled', 'calendar', 'date', 'time', 'when', 'where',
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december',
        'am', 'pm', 'a.m.', 'p.m.'
      ],
      dateFormats: [
        // Broad date/time indicators
        'DATE OF HEARING', 'TIME OF HEARING', 'scheduled for', 'scheduled on', 'on',
        'date:', 'time:', 'when:', 'meeting date', 'appointment date',
        'hearing date', 'trial date', 'conference date',
        'at', 'from', 'to', 'between', 'starting', 'beginning',
        'calendar', 'agenda', 'schedule'
      ],
      customExtractors: {
        caseNumber: [
          /(ADJ[0-9]{8,}[-A-Z0-9]*)/i,
          /(case\s*#?\s*:?\s*([A-Z0-9-]{5,}))/i,
          /(case\s*number\s*:?\s*([A-Z0-9-]{5,}))/i,
          /(case\s*nbr\s*:?\s*([A-Z0-9-]{5,}))/i,
          /([A-Z]{2,}\d{6,})/i, // General case number pattern
          /(file\s*#?\s*:?\s*([A-Z0-9-]{5,}))/i
        ],
        clientName: [
          /EMPLOYEE:\s*([A-Za-z\s\.]+?)(?:\s*\n|\s*\r|\s*$)/i,
          /INJURED WORKER:\s*([A-Za-z\s\.]+?)(?:\s*\n|\s*\r|\s*$)/i,
          /APPLICANT:\s*([A-Za-z\s\.]+?)(?:\s*\n|\s*\r|\s*$)/i,
          /Employee:\s*([A-Za-z\s\.]+?)(?:\s*\n|\s*\r|\s*$)/i,
          /Injured Worker:\s*([A-Za-z\s\.]+?)(?:\s*\n|\s*\r|\s*$)/i,
          /Applicant:\s*([^\n\r]{1,100}?)(?:\s|$)/i,
          /Client:\s*([^\n\r]{1,100}?)(?:\s|$)/i,
          /Plaintiff:\s*([^\n\r]{1,100}?)(?:\s|$)/i,
          /Claimant:\s*([^\n\r]{1,100}?)(?:\s|$)/i,
          /Patient:\s*([^\n\r]{1,100}?)(?:\s|$)/i,
          /Re:\s*([A-Za-z][a-z]+\s+[A-Za-z][a-z]+)/i, // "Re: John Smith" format
          /([A-Za-z][a-z]+\s+[A-Za-z][a-z]+)\s+(?:case|matter|file)/i
        ],
        judge: [
          /Judge:\s*([A-Za-z\s\.]+?)(?:\n|\r|$)/i,
          /Hon\.\s*([A-Za-z\s\.]{3,50}?)(?:\s|$|\n)/i,
          /Honorable\s*([A-Za-z\s\.]{3,50}?)(?:\s|$|\n)/i,
          /before\s+Judge\s*([A-Za-z\s\.]{3,50}?)(?:\s|$|\n)/i,
          /assigned\s+to\s+Judge\s*([A-Za-z\s\.]{3,50}?)(?:\s|$|\n)/i,
          /JUDGE:\s*([A-Za-z\s\.]+?)(?:\n|\r|$)/i,
          /WCAB\s*JUDGE:\s*([A-Za-z\s\.]+?)(?:\n|\r|$)/i,
          /Administrative\s*Law\s*Judge:\s*([A-Za-z\s\.]+?)(?:\n|\r|$)/i,
          /ALJ:\s*([A-Za-z\s\.]+?)(?:\n|\r|$)/i
        ],
        location: [
          /Video:\s*(https:\/\/[^\s]+)/i,
          /Zoom:\s*(https:\/\/[^\s]+)/i,
          /Teams:\s*(https:\/\/[^\s]+)/i,
          /Location:\s*([^\n\r]{1,100}?)(?:\s|$)/i,
          /Address:\s*([^\n\r]{1,100}?)(?:\s|$)/i,
          /Venue:\s*([^\n\r]{1,100}?)(?:\s|$)/i,
          /Court:\s*([^\n\r]{1,100}?)(?:\s|$)/i,
          /Office:\s*([^\n\r]{1,100}?)(?:\s|$)/i
        ]
      }
    };

    return {
      eventPatterns: { ...defaultConfig.eventPatterns, ...userConfig.eventPatterns },
      legalIndicators: userConfig.legalIndicators || defaultConfig.legalIndicators,
      dateFormats: userConfig.dateFormats || defaultConfig.dateFormats,
      customExtractors: { ...defaultConfig.customExtractors, ...userConfig.customExtractors }
    };
  }

  // Method to update configuration at runtime
  updateConfig(newConfig: Partial<AnalyzerConfig>): void {
    this.config = this.mergeWithDefaults(newConfig);
  }

  // Method to add new event type patterns
  addEventType(eventType: string, config: EventPatternConfig): void {
    this.config.eventPatterns[eventType] = config;
  }

  private datePatterns = [
    // WCAB specific patterns - these need to be first priority
    /DATE OF HEARING:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s+\w+\s+TIME OF HEARING:\s*(\d{1,2}):(\d{2})\s*(A\.M\.|P\.M\.|AM|PM)/i,
    /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+\w+\s+(\d{1,2}):(\d{2})\s*(A\.M\.|P\.M\.|AM|PM)/i,
    
    // Enhanced month name patterns - these often work better
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})\s+at\s+(\d{1,2}):(\d{2})\s*(AM|PM|am|pm|A\.M\.|P\.M\.)/i,
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})/i,
    
    // Very flexible date/time patterns - Updated to better handle "Thu, Jul 10, 2025 at 12:08 AM"
    /(\w+),?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2}),?\s+(\d{4})\s+at\s+(\d{1,2}):(\d{2})\s*(AM|PM|am|pm|A\.M\.|P\.M\.)/i,
    /(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2}),?\s+(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM|am|pm|A\.M\.|P\.M\.)/i,
    /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM|am|pm|A\.M\.|P\.M\.)/i,
    /(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM|am|pm|A\.M\.|P\.M\.)/i,
    /(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{2})/i,
    
    // Broad date patterns without strict time requirements
    /(\w+),?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2}),?\s+(\d{4})/i,
    /(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2}),?\s+(\d{4})/i,
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/i,
    /(\d{1,2})-(\d{1,2})-(\d{4})/i,
    /(\d{4})-(\d{1,2})-(\d{1,2})/i,
    
    // Time only patterns that can be combined with dates
    /(\d{1,2}):(\d{2})\s*(AM|PM|am|pm|A\.M\.|P\.M\.)/i,
    /(\d{1,2}):(\d{2})/i,
    
    // WCAB special formats
    /(\w+),\s+(\w+)\s+(\d{1,2})\s+[·•]\s+(\d{1,2}):(\d{2})\s*(?:-\s*\d{1,2}:\d{2})?\s*(am|pm)/i,
    
    // Natural language patterns
    /(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+at\s+(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)/i,
    /(next|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+at\s+(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)/i,
    
    // Scheduled patterns
    /scheduled\s+for\s+(\w+),?\s+(\w+)\s+(\d{1,2}),?\s+(\d{4})\s+at\s+(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)/i,
    /scheduled\s+on\s+(\d{1,2})\/(\d{1,2})\/(\d{4})\s+at\s+(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)/i,
    
    // Google-style date patterns (for emails from Google)
    /on\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})/i,
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})\b/i,
    
    // Fallback - any date-like pattern (broader matching)
    /(\d{1,2})\/(\d{1,2})\/\d{2,4}/,
    /(\d{1,2})-(\d{1,2})-\d{2,4}/,
    /\d{4}-(\d{1,2})-(\d{1,2})/
  ];

  private locationPatterns = [
    /(?:location|address|venue):\s*([^\n]+)/i,
    /(?:at|@)\s+([^,\n]+(?:court|office|building|center|plaza|avenue|street|blvd|drive))/i,
    /(\d+\s+[^,\n]+(?:street|avenue|blvd|drive|court|plaza)[^,\n]*)/i
  ];

  detectEventTypes(email: EmailMessage): string[] {
    const content = `${email.subject} ${email.body || email.snippet || ''}`.toLowerCase();
    const detectedTypes: string[] = [];

    // Sort event types by priority (lower numbers = higher priority)
    const sortedEventTypes = Object.entries(this.config.eventPatterns)
      .sort(([, a], [, b]) => a.priority - b.priority);

    for (const [type, config] of sortedEventTypes) {
      if (config.patterns.some(pattern => pattern.test(content))) {
        detectedTypes.push(type);
      }
    }

    return detectedTypes.length > 0 ? detectedTypes : ['custom'];
  }

  extractEventDetails(email: EmailMessage): EmailEventDetails | null {
    // Use the full content available - prioritize bodyHtml, then bodyText, then body
    const fullContent = email.bodyHtml || email.bodyText || email.body || email.snippet || '';
    const content = `${email.subject} ${fullContent}`;
    const cleanedContent = this.cleanHtml(content);

    console.log('📋 Using email content - Subject + Full Body. Total length:', content.length);

    const eventTypes = this.detectEventTypes(email);
    const primaryType = eventTypes[0] as EmailEventDetails['eventType'];

    // Extract date and time
    const dateTime = this.extractDateTime(cleanedContent, content);
    if (!dateTime) {
      console.log('❌ Could not extract date/time, aborting event creation.');
      return null; // Can't create event without date
    }

    // Extract metadata from the cleaned content
    const extractedData = this.extractMetadata(cleanedContent, primaryType);
    
    // Store the extracted dateTime in metadata for title generation
    extractedData.dateTime = dateTime;

    // Extract location - search for URLs in raw content first, as cleaning can break them.
    let location = 'Details in description';
    const urlMatch = fullContent.match(/https?:\/\/[^\s<>"']+/i);
    let videoLocation = '';
    let phoneLocation = '';
    
    if (urlMatch) {
      videoLocation = `Video: ${urlMatch[0]}`;
    }
    
    // Extract phone details - look for pattern like "Also by PH: (xxx) xxx-xxxx Access Code: xx*xxxxxxxx"
    const phoneMatch = fullContent.match(/Also by PH:\s*(\([0-9]{3}\)\s*[0-9]{3}-[0-9]{4})\s*Access Code:\s*([0-9*]+)/i);
    if (phoneMatch) {
      phoneLocation = ` Also by PH: ${phoneMatch[1]} Access Code: ${phoneMatch[2]}`;
    }
    
    if (videoLocation || phoneLocation) {
      location = videoLocation + phoneLocation;
    } else {
      // Fallback to pattern matching on cleaned content for physical addresses
      location = this.extractLocation(cleanedContent) || 'Details in description';
    }

    // Extract attendees
    const attendees = this.extractAttendees(email, cleanedContent);

    // Generate title based on type and extracted data
    const title = this.generateTitle(primaryType, email.subject, extractedData);

    // Generate a clean description
    const description = this.generateDescription(extractedData, email);

    const result: EmailEventDetails = {
      title,
      dateTime,
      location,
      attendees,
      description,
      eventType: primaryType,
      requiredActions: this.getRequiredActions(primaryType),
      documents: [],
      confidence: this.calculateConfidence(cleanedContent, primaryType),
      extractedData,
    };

    // Debug the final result before validation
    console.log('🔍 Final result object before validation:', {
      title: result.title,
      dateTime: result.dateTime,
      dateTimeType: typeof result.dateTime,
      dateTimeValid: result.dateTime instanceof Date,
      dateTimeValue: result.dateTime?.getTime(),
      location: result.location,
      attendeesLength: result.attendees?.length
    });

    // Final check for suitability
    if (!result.title || !result.dateTime || isNaN(result.dateTime.getTime())) {
      console.log('❌ Event details not suitable for calendaring - validation failed:');
      console.log('  - Title:', !!result.title, result.title);
      console.log('  - DateTime:', !!result.dateTime, result.dateTime);
      console.log('  - DateTime valid:', result.dateTime instanceof Date);
      console.log('  - DateTime time value:', result.dateTime?.getTime());
      return null;
    }

    console.log('✅ Successfully extracted event details:', result);
    return result;
  }

  private cleanHtml(content: string): string {
    if (content.includes('<') && content.includes('>')) {
      console.log('📄 HTML content detected, cleaning...');
      let cleaned = content;
      // Preserve line breaks for structure
      cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');
      cleaned = cleaned.replace(/<\/(p|div|h[1-6]|tr)>/gi, '\n');
      
      // Strip all other tags
      cleaned = cleaned
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ');
        
      // Decode entities and normalize whitespace
      cleaned = cleaned
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/[ \t]+/g, ' ') // Collapse spaces, but not newlines
        .replace(/ \n/g, '\n') // Clean up spaces before newlines
        .replace(/\n /g, '\n') // Clean up spaces after newlines
        .replace(/\n{2,}/g, '\n') // Collapse multiple newlines
        .trim();
      return cleaned;
    }
    return content;
  }

  private extractDateTime(cleanedContent: string, originalContent: string): Date | null {
    console.log('� Extracting date/time from content length:', cleanedContent.length);
    
    // Try both original and cleaned content
    const contentsToCheck = [cleanedContent, originalContent];
    
    // Look for WCAB-specific indicators
    console.log('🔍 Looking for WCAB indicators...');
    const wcabIndicators = ['hearing', 'adjudication', 'workers compensation', 'wcab', 'notice of hearing'];
    for (const indicator of wcabIndicators) {
      if (cleanedContent.toLowerCase().includes(indicator)) {
        console.log(`   ✅ Found indicator: "${indicator}"`);
      }
    }
    
    // Look for common date patterns in the content
    console.log('🔍 Looking for date-like content...');
    const dateWords = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december', 'am', 'pm'];
    for (const word of dateWords) {
      if (cleanedContent.toLowerCase().includes(word)) {
        console.log(`   ✅ Found date word: "${word}"`);
        // Show context around the word
        const index = cleanedContent.toLowerCase().indexOf(word);
        const start = Math.max(0, index - 50);
        const end = Math.min(cleanedContent.length, index + 100);
        console.log(`   Context: "${cleanedContent.substring(start, end)}"`);
        break; // Just show first one for now
      }
    }
    
    console.log('🔍 Testing patterns...');
    for (let i = 0; i < contentsToCheck.length; i++) {
      const contentToCheck = contentsToCheck[i];
      console.log(`📝 Testing content ${i + 1} (${i === 0 ? 'cleaned' : 'original'}), length: ${contentToCheck.length}`);
      
      for (let j = 0; j < this.datePatterns.length; j++) {
        const pattern = this.datePatterns[j];
        console.log(`   Pattern ${j + 1}: ${pattern.source}`);
        const match = contentToCheck.match(pattern);
        if (match) {
          console.log('📅 Date pattern matched:', match[0]);
          console.log('📅 Full match array:', match);
          try {
            // Handle WCAB format: "DATE OF HEARING: 09/16/2025 TUESDAY TIME OF HEARING: 08:30 A.M."
            if (j === 0 && match[1] && match[2] && match[3] && match[4] && match[5] && match[6]) {
              const month = parseInt(match[1]) - 1; // JS months are 0-indexed
              const day = parseInt(match[2]);
              const year = parseInt(match[3]);
              const hour = this.parseHour(parseInt(match[4]), match[6]);
              const minute = parseInt(match[5]);
              const eventDate = new Date(year, month, day, hour, minute);
              console.log('✅ WCAB DATE OF HEARING format parsed successfully:', eventDate);
              return eventDate;
            }
            // Handle WCAB simplified format: "09/16/2025 TUESDAY 08:30 A.M."
            else if (j === 1 && match[1] && match[2] && match[3] && match[4] && match[5] && match[6]) {
              const month = parseInt(match[1]) - 1; // JS months are 0-indexed
              const day = parseInt(match[2]);
              const year = parseInt(match[3]);
              const hour = this.parseHour(parseInt(match[4]), match[6]);
              const minute = parseInt(match[5]);
              const eventDate = new Date(year, month, day, hour, minute);
              console.log('✅ WCAB simplified format parsed successfully:', eventDate);
              return eventDate;
            }
            // Handle WCAB format: "Thursday, August 7 · 1:30 - 2:30pm"
            else if (match[1] && match[2] && match[3] && match[4] && match[5] && match[6] && !match[7]) {
              const month = this.parseMonth(match[2]);
              const day = parseInt(match[3]);
              const hour = this.parseHour(parseInt(match[4]), match[6]);
              const minute = parseInt(match[5]);
              const currentYear = new Date().getFullYear();
              
              const eventDate = new Date(currentYear, month, day, hour, minute);
              const now = new Date();
              if (eventDate < now) {
                eventDate.setFullYear(currentYear + 1);
              }
              
              console.log('✅ WCAB format parsed successfully:', eventDate);
              return eventDate;
            }
            // Handle month day, year format (like "June 19, 2025")
            else if (match[1] && match[2] && match[3]) {
              const month = this.parseMonth(match[1]);
              const day = parseInt(match[2]);
              const year = parseInt(match[3]);
              
              if (month !== -1 && day > 0 && day <= 31 && year > 1900) {
                // Use a default time (9 AM) if no time specified
                const eventDate = new Date(year, month, day, 9, 0);
                
                // Validate the created date is actually valid
                if (!isNaN(eventDate.getTime())) {
                  console.log('✅ Month day year format (no time) parsed successfully:', eventDate);
                  return eventDate;
                } else {
                  console.log('❌ Generated invalid date object:', eventDate);
                }
              } else {
                console.log('❌ Invalid date components:', { month, day, year });
              }
            }
            // Handle full format with day name and year (like "Thu, Jul 10, 2025 at 12:08 AM")
            else if (match[1] && match[2] && match[3] && match[4] && match[5] && match[6] && match[7]) {
              console.log('🔍 Parsing full format with day name:', match);
              // For pattern 5: (\w+),?\s+(month)\s+(\d{1,2}),?\s+(\d{4})\s+at\s+(\d{1,2}):(\d{2})\s*(AM|PM)
              const dayName = match[1]; // "Thu"
              const monthStr = match[2]; // "Jul"
              const day = parseInt(match[3]); // 10
              const year = parseInt(match[4]); // 2025
              const hour = parseInt(match[5]); // 12
              const minute = parseInt(match[6]); // 8
              const ampm = match[7]; // "AM"
              
              const month = this.parseMonth(monthStr);
              console.log('🔍 Parsed components:', { dayName, monthStr, month, day, year, hour, minute, ampm });
              
              if (month !== -1 && day > 0 && day <= 31 && year > 1900) {
                const parsedHour = this.parseHour(hour, ampm);
                const eventDate = new Date(year, month, day, parsedHour, minute);
                
                // Validate the created date is actually valid
                if (!isNaN(eventDate.getTime())) {
                  console.log('✅ Full date format parsed successfully:', eventDate);
                  return eventDate;
                } else {
                  console.log('❌ Generated invalid date object:', eventDate);
                }
              } else {
                console.log('❌ Invalid date components in full format:', { month, day, year });
              }
            }
            // Handle month day, year format with time
            else if (match[1] && match[2] && match[3] && match[4] && match[5] && match[6]) {
              const month = this.parseMonth(match[1]);
              const day = parseInt(match[2]);
              const year = parseInt(match[3]);
              const hour = this.parseHour(parseInt(match[4]), match[6]);
              const minute = parseInt(match[5]);
              
              if (month !== -1 && day > 0 && day <= 31 && year > 1900) {
                const eventDate = new Date(year, month, day, hour, minute);
                
                // Validate the created date is actually valid
                if (!isNaN(eventDate.getTime())) {
                  console.log('✅ Month day year format with time parsed successfully:', eventDate);
                  return eventDate;
                } else {
                  console.log('❌ Generated invalid date object:', eventDate);
                }
              } else {
                console.log('❌ Invalid date components with time:', { month, day, year });
              }
            }
          } catch (error) {
            console.error('❌ Date parsing error:', error);
            continue; // Continue to next pattern instead of failing completely
          }
        } else {
          console.log(`   ❌ Pattern ${j + 1} no match`);
        }
      }
    }
    
    // Fallback: Try to extract date and time separately from WCAB-style content
    console.log('🔍 Trying fallback parsing for separated date/time...');
    const dateMatch = cleanedContent.match(/(\w+),\s+(\w+)\s+(\d{1,2})/i);
    const timeMatch = cleanedContent.match(/(\d{1,2}):(\d{2})\s*(?:-\s*\d{1,2}:\d{2})?\s*(am|pm)/i);
    
    if (dateMatch && timeMatch) {
      try {
        const month = this.parseMonth(dateMatch[2]);
        const day = parseInt(dateMatch[3]);
        const hour = this.parseHour(parseInt(timeMatch[1]), timeMatch[3]);
        const minute = parseInt(timeMatch[2]);
        const currentYear = new Date().getFullYear();
        
        const eventDate = new Date(currentYear, month, day, hour, minute);
        const now = new Date();
        if (eventDate < now) {
          eventDate.setFullYear(currentYear + 1);
        }
        
        console.log('✅ Fallback separated date/time parsing successful:', eventDate);
        return eventDate;
      } catch (error) {
        console.error('❌ Fallback parsing error:', error);
        return null; // Return null instead of undefined
      }
    }
    
    console.log('❌ No date pattern matched in content');
    return null;
  }

  private extractLocation(content: string): string | null {
    // Prioritize video conference links
    const videoLinkMatch = content.match(/Video:\s*(https:\/\/[^\s]+)/i);
    if (videoLinkMatch) {
      return videoLinkMatch[1];
    }

    for (const pattern of this.locationPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    return null;
  }

  private extractAttendees(email: EmailMessage, content: string): string[] {
    const attendees: string[] = [];
    
    // Add email participants
    if (email.from) attendees.push(email.from);
    if (email.to) {
      if (Array.isArray(email.to)) {
        attendees.push(...email.to);
      } else {
        attendees.push(email.to);
      }
    }
    if (email.cc && Array.isArray(email.cc)) {
      attendees.push(...email.cc);
    }

    // Extract additional attendees from content
    const attendeePatterns = [
      /attendees?:\s*([^\n]+)/i,
      /participants?:\s*([^\n]+)/i,
      /with\s+([^,\n]+(?:esq|attorney|counsel))/i
    ];

    attendeePatterns.forEach(pattern => {
      const match = content.match(pattern);
      if (match) {
        const extracted = match[1].split(/[,;]/).map(a => a.trim());
        attendees.push(...extracted);
      }
    });

    return [...new Set(attendees)]; // Remove duplicates
  }

  private extractMetadata(content: string, eventType: string): any {
    const metadata: any = {};

    console.log('🔍 Extracting metadata from content preview:', content.substring(0, 500));

    // Use configurable extractors
    const extractors = this.config.customExtractors;

    // Case number extraction
    if (extractors?.caseNumber) {
      for (const pattern of extractors.caseNumber) {
        const match = content.match(pattern);
        if (match) {
          metadata.caseNumber = match[1].toUpperCase();
          break;
        }
      }
    }

    // Try to extract from subject line if not found in body
    if (!metadata.caseNumber && extractors?.caseNumber) {
      for (const pattern of extractors.caseNumber) {
        const subjectPattern = new RegExp(`(?:subject|fwd).*?(${pattern.source.slice(1, -1)})`, 'i');
        const subjectMatch = content.match(subjectPattern);
        if (subjectMatch) {
          metadata.caseNumber = subjectMatch[1].toUpperCase();
          break;
        }
      }
    }

    // Client name extraction
    if (extractors?.clientName) {
      console.log('🔍 Testing client name patterns...');
      console.log('🔍 Content sample for client name:', content.substring(0, 1000));
      for (const pattern of extractors.clientName) {
        console.log(`   Testing pattern: ${pattern}`);
        const match = content.match(pattern);
        if (match) {
          metadata.clientName = match[1].trim();
          console.log(`   ✅ Client name matched: "${metadata.clientName}"`);
          break;
        } else {
          console.log('   ❌ No match');
        }
      }
      if (!metadata.clientName) {
        console.log('⚠️ No client name extracted from any pattern');
        // Let's try a more aggressive pattern as fallback
        const fallbackMatch = content.match(/EMPLOYEE:\s*([^\n\r]+)/i);
        if (fallbackMatch) {
          metadata.clientName = fallbackMatch[1].trim();
          console.log(`   🔧 Fallback pattern matched: "${metadata.clientName}"`);
        }
      }
    }

    // Judge extraction
    if (extractors?.judge) {
      for (const pattern of extractors.judge) {
        const match = content.match(pattern);
        if (match) {
          metadata.judge = match[1].trim();
          break;
        }
      }
    }

    // Handle specific judge name cleanup for common formats
    if (metadata.judge) {
      // Remove trailing periods and extra whitespace
      metadata.judge = metadata.judge.replace(/\.$/, '').trim();
      
      // Handle "Joseph Yalon" format - ensure proper capitalization
      if (metadata.judge.toLowerCase().includes('yalon')) {
        metadata.judge = 'Joseph Yalon';
      }
    }
    
    // Look for hearing type before "DATE OF HEARING"
    const hearingTypeMatch = content.match(/HEARING:\s*([A-Za-z\s]{3,30}?)\s*DATE OF HEARING/i);
    if (hearingTypeMatch) {
        metadata.eventType = hearingTypeMatch[1].trim();
    }

    // Extract specific time mentions for title formatting
    const timeMatches = [
      /TIME.*?(\d{1,2}:\d{2})/i,
      /at\s+(\d{1,2}:\d{2})/i,
      /(\d{1,2}:\d{2})\s*(?:am|pm)/i,
      /scheduled.*?(\d{1,2}:\d{2})/i
    ];
    
    for (const pattern of timeMatches) {
      const match = content.match(pattern);
      if (match) {
        metadata.time = match[1];
        break;
      }
    }

    // QME specific
    if (eventType === 'qme') {
      const doctorMatch = content.match(/(?:dr\.?|doctor)\s+([A-Za-z\s\.]{3,50}?)(?:\s|$|\n)/i);
      if (doctorMatch) {
        metadata.doctorName = doctorMatch[1].trim();
      }
    }

    console.log('🔍 Extracted Metadata:', metadata);
    return metadata;
  }

  private generateTitle(eventType: string, subject: string, metadata: any): string {
    console.log('🏷️ Generating title with:', { eventType, subject: subject?.substring(0, 50), metadata });
    
    // Extract time for title if available (use just the time, no "at")
    const timeStr = metadata.time || (metadata.dateTime && metadata.dateTime instanceof Date 
      ? metadata.dateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      : '');
    
    // Always include case number for duplicate detection
    const caseNumber = metadata.caseNumber || 'Unknown';
    
    // Force the correct title format: [Type] [Time] [Employee] w/Judge [Full Name] - [Case]
    if (metadata.eventType && metadata.clientName) {
        const judgeStr = metadata.judge ? ` w/Judge ${metadata.judge}` : '';
        const title = timeStr 
          ? `${metadata.eventType} ${timeStr} ${metadata.clientName}${judgeStr} - ${caseNumber}`
          : `${metadata.eventType} ${metadata.clientName}${judgeStr} - ${caseNumber}`;
        console.log('🏷️ Generated structured title:', title);
        return title;
    }
    
    // Fallback for when we have basic info
    if (metadata.clientName) {
        const typeStr = metadata.eventType || 'Hearing';
        const judgeStr = metadata.judge ? ` w/Judge ${metadata.judge}` : '';
        const title = timeStr 
          ? `${typeStr} ${timeStr} ${metadata.clientName}${judgeStr} - ${caseNumber}`
          : `${typeStr} ${metadata.clientName}${judgeStr} - ${caseNumber}`;
        console.log('🏷️ Generated fallback title with client:', title);
        return title;
    }
    
    // Last resort fallback
    const typeStr = metadata.eventType || 'Court Hearing';
    const title = `${typeStr} - ${caseNumber}`;
    console.log('🏷️ Generated minimal fallback title:', title);
    return title;
  }

  private generateDescription(metadata: any, email: EmailMessage): string {
    let description = '';

    // Only include essential information
    if (metadata.eventType) {
      description += `Type: ${metadata.eventType}\n`;
    }
    if (metadata.judge) {
      description += `Judge: ${metadata.judge}\n`;
    }
    if (metadata.location) {
      description += `Location: ${metadata.location}\n`;
    }
    if (metadata.caseNumber) {
      description += `Case: ${metadata.caseNumber}\n`;
    }

    return description.trim();
  }

  private getRequiredActions(eventType: string): string[] {
    const actions: Record<string, string[]> = {
      deposition: [
        'Review case files',
        'Prepare exhibit list',
        'Send exhibits to court reporter',
        'Confirm attendance',
        'Prepare deposition outline'
      ],
      qme: [
        'Gather medical records',
        'Send records to QME',
        'Prepare client',
        'Confirm appointment',
        'Arrange transportation'
      ],
      'court-date': [ // Changed from courtDate to match interface
        'Prepare legal briefs',
        'Review case law',
        'Organize exhibits',
        'Confirm court appearance',
        'Notify client'
      ],
      appointment: [
        'Prepare meeting agenda',
        'Gather relevant documents',
        'Confirm attendance',
        'Set up materials'
      ]
    };

    return actions[eventType] || ['Review details', 'Prepare materials', 'Confirm attendance'];
  }

  private calculateConfidence(content: string, eventType: string): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on specific patterns found
    const eventConfig = this.config.eventPatterns[eventType];
    if (eventConfig && eventConfig.patterns.length > 0) {
      const matchingPatterns = eventConfig.patterns.filter(pattern => pattern.test(content));
      confidence += (matchingPatterns.length / eventConfig.patterns.length) * 0.3;
    } else {
      // For custom or unrecognized event types, check for general legal indicators
      const legalIndicatorPatterns = this.config.legalIndicators.map(indicator => 
        new RegExp(indicator.replace(/\s+/g, '\\.?\\s*'), 'i')
      );
      const matchingIndicators = legalIndicatorPatterns.filter(pattern => pattern.test(content));
      confidence += (matchingIndicators.length / legalIndicatorPatterns.length) * 0.3;
    }

    // Check for date presence
    if (this.datePatterns.some(pattern => pattern.test(content))) {
      confidence += 0.2;
    }

    // Check for location presence (including video links)
    if (this.locationPatterns.some(pattern => pattern.test(content)) || 
        content.includes('https://') || content.includes('video') || content.includes('phone')) {
      confidence += 0.1;
    }

    // Additional confidence boosts for strong indicators from config
    for (const format of this.config.dateFormats) {
      if (content.includes(format)) {
        confidence += 0.1;
      }
    }

    if (content.includes('CASE NBR') || content.includes('ADJ')) {
      confidence += 0.1; // Case number present
    }

    return Math.min(confidence, 1.0);
  }

  private parseMonth(monthStr: string): number {
    const months = {
      'january': 0, 'jan': 0, 'february': 1, 'feb': 1, 'march': 2, 'mar': 2,
      'april': 3, 'apr': 3, 'may': 4, 'june': 5, 'jun': 5, 'july': 6, 'jul': 6,
      'august': 7, 'aug': 7, 'september': 8, 'sep': 8, 'october': 9, 'oct': 9,
      'november': 10, 'nov': 10, 'december': 11, 'dec': 11
    };
    const result = months[monthStr.toLowerCase() as keyof typeof months];
    if (result === undefined) {
      console.log(`⚠️ parseMonth: Unknown month "${monthStr}", returning -1`);
      return -1; // Return -1 for unknown months instead of 0
    }
    console.log(`✅ parseMonth: "${monthStr}" -> ${result}`);
    return result;
  }

  private parseHour(hour: number, ampm: string): number {
    ampm = ampm.replace(/\./g, '').toLowerCase(); // Sanitize ampm
    if (ampm === 'pm' && hour !== 12) {
      return hour + 12;
    }
    if (ampm === 'am' && hour === 12) {
      return 0; // Midnight case
    }
    return hour;
  }
}

// Factory functions for common configurations
export class EmailEventAnalyzerFactory {
  // WCAB/Workers Compensation configuration
  static createWCABAnalyzer(): EmailEventAnalyzer {
    return new EmailEventAnalyzer({
      eventPatterns: {
        'court-date': {
          keywords: ['notice of hearing', 'wcab', 'adjudication', 'workers compensation'],
          patterns: [
            /notice\s+of\s+hearing/i,
            /wcab/i,
            /adjudication/i,
            /workers.?compensation/i,
            /hearing\s+scheduled/i
          ],
          priority: 1
        }
      },
      customExtractors: {
        caseNumber: [/(ADJ[0-9]{8,}[-A-Z0-9]*)/i],
        clientName: [/Applicant:\s*([^\n\r]{1,100}?)(?:\s|$)/i],
        judge: [/Judge:\s*([A-Za-z\s\.]+?)(?:\n|\r|$)/i]
      }
    });
  }

  // General legal practice configuration
  static createGeneralLegalAnalyzer(): EmailEventAnalyzer {
    return new EmailEventAnalyzer({
      eventPatterns: {
        'court-date': {
          keywords: ['court hearing', 'motion hearing', 'trial setting'],
          patterns: [
            /court\s+hearing/i,
            /motion\s+hearing/i,
            /trial\s+setting/i,
            /status\s+conference/i
          ],
          priority: 1
        },
        deposition: {
          keywords: ['deposition', 'notice of deposition'],
          patterns: [
            /notice\s+of\s+deposition/i,
            /deposition\s+of/i,
            /depo\s+scheduled/i
          ],
          priority: 2
        }
      }
    });
  }

  // Custom configuration
  static createCustomAnalyzer(config: Partial<AnalyzerConfig>): EmailEventAnalyzer {
    return new EmailEventAnalyzer(config);
  }
}
