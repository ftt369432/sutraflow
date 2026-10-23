/**
 * Calendar Capability - Auto-navigation and calendar management from AI chat
 * Enables seamless calendar operations from any AI chat interaction
 */

import { AICapability, CapabilityResult } from './types';

export class CalendarCapability implements AICapability {
  name = 'calendar';
  version = '1.0.0';
  description = 'Manage calendar events and auto-navigate to calendar pages';

  /**
   * Detect calendar-related intents in user input
   */
  async detectIntent(input: string, context?: any): Promise<boolean | object> {
    const calendarKeywords = [
      // Direct calendar commands
      'calendar', 'schedule', 'appointment', 'meeting', 'event',
      'book', 'reserve', 'plan', 'when', 'date', 'time',
      
      // Calendar actions
      'create event', 'add event', 'schedule meeting', 'book appointment',
      'check calendar', 'view calendar', 'calendar view', 'my schedule',
      'free time', 'available', 'busy', 'conflicts',
      
      // Time-related
      'tomorrow', 'today', 'next week', 'this week', 'monday', 'tuesday',
      'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
      'morning', 'afternoon', 'evening', 'pm', 'am',
      
      // Calendar navigation
      'open calendar', 'go to calendar', 'show calendar', 'calendar page',
      'navigate to calendar', 'calendar app', 'my calendar'
    ];

    const input_lower = input.toLowerCase();
    
    // Check for direct calendar keywords
    const hasCalendarKeyword = calendarKeywords.some(keyword => 
      input_lower.includes(keyword)
    );

    // Check for calendar patterns
    const calendarPatterns = [
      /schedule.*(?:meeting|appointment|call|event)/i,
      /(?:when|what time).*(?:is|are|do|can)/i,
      /(?:book|reserve|plan).*(?:for|on|at)/i,
      /(?:check|view|see|show).*(?:calendar|schedule|availability)/i,
      /(?:free|available|busy).*(?:on|at|during)/i,
      /(?:calendar|schedule).*(?:for|on|this|next)/i,
      /(?:go to|open|show|navigate).*calendar/i
    ];

    const hasCalendarPattern = calendarPatterns.some(pattern => 
      pattern.test(input)
    );

    // Detect email-to-calendar scenarios
    const emailCalendarPatterns = [
      /create.*event.*from.*email/i,
      /add.*calendar.*event/i,
      /schedule.*based.*email/i,
      /calendar.*from.*message/i
    ];

    const hasEmailCalendarPattern = emailCalendarPatterns.some(pattern => 
      pattern.test(input)
    );

    const confidence = hasCalendarKeyword ? 0.8 : 
                      hasCalendarPattern ? 0.7 : 
                      hasEmailCalendarPattern ? 0.9 : 0;

    if (confidence > 0.6) {
      return {
        confidence,
        intent: hasEmailCalendarPattern ? 'email_to_calendar' : 
                hasCalendarPattern ? 'calendar_action' : 'calendar_navigation',
        keywords: calendarKeywords.filter(keyword => input_lower.includes(keyword))
      };
    }

    return false;
  }

  /**
   * Execute calendar-related capabilities
   */
  async execute(input: string, context?: any): Promise<CapabilityResult> {
    try {
      const intent = await this.detectIntent(input, context);
      
      if (!intent || typeof intent === 'boolean') {
        return {
          success: false,
          message: 'No calendar intent detected',
          data: null
        };
      }

      const intentData = intent as any;
      const action = this.determineCalendarAction(input, intentData);

      console.log('📅 Calendar Capability executing:', action);

      switch (action.type) {
        case 'navigate_calendar':
          return await this.handleCalendarNavigation(action, context);
          
        case 'create_event':
          return await this.handleEventCreation(action, input, context);
          
        case 'view_calendar':
          return await this.handleCalendarView(action, context);
          
        case 'check_availability':
          return await this.handleAvailabilityCheck(action, context);
          
        case 'email_to_calendar':
          return await this.handleEmailToCalendar(action, input, context);
          
        default:
          return await this.handleGenericCalendarAction(action, input, context);
      }
    } catch (error) {
      console.error('❌ Calendar Capability error:', error);
      return {
        success: false,
        message: `Calendar operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: null
      };
    }
  }

  /**
   * Determine the specific calendar action to take
   */
  private determineCalendarAction(input: string, intent: any) {
    const input_lower = input.toLowerCase();

    // Navigation patterns
    if (input_lower.includes('open calendar') || 
        input_lower.includes('go to calendar') ||
        input_lower.includes('calendar page') ||
        input_lower.includes('show calendar')) {
      return { type: 'navigate_calendar', reason: 'Direct navigation request' };
    }

    // Event creation patterns
    if (input_lower.includes('create event') ||
        input_lower.includes('schedule meeting') ||
        input_lower.includes('book appointment') ||
        input_lower.includes('add event')) {
      return { type: 'create_event', reason: 'Event creation request' };
    }

    // Calendar viewing patterns
    if (input_lower.includes('view calendar') ||
        input_lower.includes('check calendar') ||
        input_lower.includes('my schedule')) {
      return { type: 'view_calendar', reason: 'Calendar viewing request' };
    }

    // Availability checking patterns
    if (input_lower.includes('free time') ||
        input_lower.includes('available') ||
        input_lower.includes('busy') ||
        input_lower.includes('conflicts')) {
      return { type: 'check_availability', reason: 'Availability check request' };
    }

    // Email to calendar patterns
    if (intent.intent === 'email_to_calendar') {
      return { type: 'email_to_calendar', reason: 'Email-based calendar operation' };
    }

    // Default calendar action
    return { type: 'navigate_calendar', reason: 'Generic calendar request' };
  }

  /**
   * Handle calendar navigation
   */
  private async handleCalendarNavigation(action: any, context?: any): Promise<CapabilityResult> {
    console.log('📅 Navigating to calendar page...');

    // Trigger auto-navigation to calendar
    const navigationEvent = new CustomEvent('autonomousNavigation', {
      detail: {
        type: 'calendar',
        route: '/calendar',
        reason: 'AI-triggered calendar navigation',
        timestamp: new Date().toISOString(),
        context: {
          source: 'ai_chat',
          action: action.reason
        }
      }
    });

    // Dispatch the navigation event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(navigationEvent);
    }

    return {
      success: true,
      message: '📅 **Opening Calendar**\n\nNavigating to your calendar view where you can:\n- View upcoming events\n- Create new appointments\n- Manage your schedule\n- Check availability',
      data: {
        action: 'navigate',
        route: '/calendar',
        navigationTriggered: true
      },
      navigationTriggered: true
    };
  }

  /**
   * Handle event creation
   */
  private async handleEventCreation(action: any, input: string, context?: any): Promise<CapabilityResult> {
    console.log('📅 Handling event creation...');

    // Extract event details from input
    const eventDetails = this.extractEventDetails(input);

    // Navigate to calendar with event creation context
    const navigationEvent = new CustomEvent('autonomousNavigation', {
      detail: {
        type: 'calendar',
        route: '/calendar',
        reason: 'AI-triggered event creation',
        timestamp: new Date().toISOString(),
        context: {
          source: 'ai_chat',
          action: 'create_event',
          eventDetails
        }
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(navigationEvent);
    }

    return {
      success: true,
      message: `📅 **Creating Calendar Event**\n\nOpening calendar to create your event:\n${eventDetails.title ? `- **Title**: ${eventDetails.title}` : ''}\n${eventDetails.date ? `- **Date**: ${eventDetails.date}` : ''}\n${eventDetails.time ? `- **Time**: ${eventDetails.time}` : ''}\n\nYou can modify the details once the calendar opens.`,
      data: {
        action: 'create_event',
        route: '/calendar',
        navigationTriggered: true,
        eventDetails
      },
      navigationTriggered: true
    };
  }

  /**
   * Handle calendar view requests
   */
  private async handleCalendarView(action: any, context?: any): Promise<CapabilityResult> {
    return await this.handleCalendarNavigation(action, context);
  }

  /**
   * Handle availability checks
   */
  private async handleAvailabilityCheck(action: any, context?: any): Promise<CapabilityResult> {
    console.log('📅 Checking availability...');

    const navigationEvent = new CustomEvent('autonomousNavigation', {
      detail: {
        type: 'calendar',
        route: '/calendar',
        reason: 'AI-triggered availability check',
        timestamp: new Date().toISOString(),
        context: {
          source: 'ai_chat',
          action: 'check_availability'
        }
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(navigationEvent);
    }

    return {
      success: true,
      message: '📅 **Checking Availability**\n\nOpening calendar to check your availability. You can:\n- View your current schedule\n- Find free time slots\n- Check for conflicts\n- Plan new meetings',
      data: {
        action: 'check_availability',
        route: '/calendar',
        navigationTriggered: true
      },
      navigationTriggered: true
    };
  }

  /**
   * Handle email-to-calendar operations
   */
  private async handleEmailToCalendar(action: any, input: string, context?: any): Promise<CapabilityResult> {
    console.log('📅 Creating calendar event from email context...');

    const navigationEvent = new CustomEvent('autonomousNavigation', {
      detail: {
        type: 'calendar',
        route: '/calendar',
        reason: 'AI-triggered email-to-calendar conversion',
        timestamp: new Date().toISOString(),
        context: {
          source: 'ai_chat',
          action: 'email_to_calendar',
          emailContext: context?.selectedEmail || null
        }
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(navigationEvent);
    }

    return {
      success: true,
      message: '📅 **Creating Event from Email**\n\nOpening calendar to create an event based on the email context. The system will:\n- Extract relevant details from the email\n- Pre-fill event information\n- Allow you to confirm and customize',
      data: {
        action: 'email_to_calendar',
        route: '/calendar',
        navigationTriggered: true,
        emailContext: context?.selectedEmail
      },
      navigationTriggered: true
    };
  }

  /**
   * Handle generic calendar actions
   */
  private async handleGenericCalendarAction(action: any, input: string, context?: any): Promise<CapabilityResult> {
    return await this.handleCalendarNavigation(action, context);
  }

  /**
   * Extract event details from user input
   */
  private extractEventDetails(input: string) {
    const details: any = {};

    // Extract potential title
    const titleMatch = input.match(/(?:schedule|create|book)(?:\s+(?:a|an))?\s+([^,]+?)(?:\s+(?:for|on|at)|$)/i);
    if (titleMatch) {
      details.title = titleMatch[1].trim();
    }

    // Extract potential date
    const datePatterns = [
      /(?:on|for)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
      /(?:on|for)\s+(tomorrow|today|next week|this week)/i,
      /(?:on|for)\s+(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/,
      /(?:on|for)\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i
    ];

    for (const pattern of datePatterns) {
      const match = input.match(pattern);
      if (match) {
        details.date = match[1];
        break;
      }
    }

    // Extract potential time
    const timeMatch = input.match(/(?:at|from)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
    if (timeMatch) {
      details.time = timeMatch[1];
    }

    return details;
  }
}