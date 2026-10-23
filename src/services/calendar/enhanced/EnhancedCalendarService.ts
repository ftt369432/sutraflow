import { IndustryConfig, CalendarEvent, CalendarFilters } from '../../../types/calendar.types';
import { EventProcessingResult } from '../../../types/email.types';
import dayjs, { Dayjs } from 'dayjs';

export interface EnhancedCalendarServiceConfig {
  industryConfig: IndustryConfig;
  enableGoogleCalendar?: boolean;
  enableOutlook?: boolean;
  enableEmailProcessing?: boolean;
  enableNotifications?: boolean;
}

export class EnhancedCalendarService {
  private config: EnhancedCalendarServiceConfig;
  private events: CalendarEvent[] = [];
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(config: EnhancedCalendarServiceConfig) {
    this.config = config;
    this.initializeEventListeners();
  }

  private initializeEventListeners() {
    // Initialize event listener categories
    const eventTypes = ['create', 'update', 'delete', 'filter', 'sync'];
    eventTypes.forEach(type => {
      this.eventListeners.set(type, []);
    });
  }

  // Event Management
  async createEvent(event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<CalendarEvent> {
    const newEvent: CalendarEvent = {
      ...event,
      id: this.generateEventId(),
      createdAt: dayjs(),
      updatedAt: dayjs()
    };

    // Validate event based on industry config
    this.validateEvent(newEvent);

    // Add to local events
    this.events.push(newEvent);

    // Sync with external calendars
    if (this.config.enableGoogleCalendar) {
      await this.syncWithGoogleCalendar('create', newEvent);
    }

    if (this.config.enableOutlook) {
      await this.syncWithOutlook('create', newEvent);
    }

    // Send notifications
    if (this.config.enableNotifications) {
      await this.sendEventNotification('created', newEvent);
    }

    // Emit event
    this.emit('create', newEvent);

    return newEvent;
  }

  async updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const eventIndex = this.events.findIndex(e => e.id === eventId);
    if (eventIndex === -1) {
      throw new Error(`Event with ID ${eventId} not found`);
    }

    const updatedEvent: CalendarEvent = {
      ...this.events[eventIndex],
      ...updates,
      updatedAt: dayjs()
    };

    // Validate updated event
    this.validateEvent(updatedEvent);

    // Update local events
    this.events[eventIndex] = updatedEvent;

    // Sync with external calendars
    if (this.config.enableGoogleCalendar) {
      await this.syncWithGoogleCalendar('update', updatedEvent);
    }

    if (this.config.enableOutlook) {
      await this.syncWithOutlook('update', updatedEvent);
    }

    // Send notifications
    if (this.config.enableNotifications) {
      await this.sendEventNotification('updated', updatedEvent);
    }

    // Emit event
    this.emit('update', updatedEvent);

    return updatedEvent;
  }

  async deleteEvent(eventId: string): Promise<void> {
    const eventIndex = this.events.findIndex(e => e.id === eventId);
    if (eventIndex === -1) {
      throw new Error(`Event with ID ${eventId} not found`);
    }

    const event = this.events[eventIndex];

    // Remove from local events
    this.events.splice(eventIndex, 1);

    // Sync with external calendars
    if (this.config.enableGoogleCalendar) {
      await this.syncWithGoogleCalendar('delete', event);
    }

    if (this.config.enableOutlook) {
      await this.syncWithOutlook('delete', event);
    }

    // Send notifications
    if (this.config.enableNotifications) {
      await this.sendEventNotification('deleted', event);
    }

    // Emit event
    this.emit('delete', event);
  }

  // Event Retrieval and Filtering
  getEvents(filters?: CalendarFilters): CalendarEvent[] {
    let filteredEvents = [...this.events];

    if (!filters) {
      return filteredEvents;
    }

    // Apply date range filter
    if (filters.dateRange && filters.dateRange.length === 2) {
      const [startDate, endDate] = filters.dateRange;
      filteredEvents = filteredEvents.filter(event =>
        event.date.isBetween(startDate, endDate, 'day', '[]')
      );
    }

    // Apply event type filter
    if (filters.eventTypes && filters.eventTypes.length > 0) {
      filteredEvents = filteredEvents.filter(event =>
        filters.eventTypes!.includes(event.eventType)
      );
    }

    // Apply priority filter
    if (filters.priorities && filters.priorities.length > 0) {
      filteredEvents = filteredEvents.filter(event =>
        filters.priorities!.includes(event.priority || 'normal')
      );
    }

    // Apply participants filter
    if (filters.participants && filters.participants.length > 0) {
      filteredEvents = filteredEvents.filter(event =>
        event.participants?.some(participant =>
          filters.participants!.includes(participant)
        )
      );
    }

    // Apply search text filter
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filteredEvents = filteredEvents.filter(event =>
        event.title.toLowerCase().includes(searchLower) ||
        event.description?.toLowerCase().includes(searchLower) ||
        event.location?.toLowerCase().includes(searchLower)
      );
    }

    // Apply tags filter
    if (filters.tags && filters.tags.length > 0) {
      filteredEvents = filteredEvents.filter(event =>
        event.tags?.some(tag => filters.tags!.includes(tag))
      );
    }

    // Apply completed filter
    if (filters.showCompleted === false) {
      filteredEvents = filteredEvents.filter(event =>
        event.customFields?.completed !== true
      );
    }

    // Apply custom filters
    if (filters.customFilters) {
      Object.entries(filters.customFilters).forEach(([key, value]) => {
        if (value) {
          filteredEvents = filteredEvents.filter(event =>
            event.customFields?.[key] === value ||
            (key === 'caseNumber' && event.caseNumber === value) ||
            (key === 'clientName' && event.clientName === value)
          );
        }
      });
    }

    return filteredEvents;
  }

  getEventById(eventId: string): CalendarEvent | undefined {
    return this.events.find(e => e.id === eventId);
  }

  getEventsForDate(date: Dayjs): CalendarEvent[] {
    return this.events.filter(event =>
      event.date.format('YYYY-MM-DD') === date.format('YYYY-MM-DD')
    );
  }

  getUpcomingEvents(days: number = 7): CalendarEvent[] {
    const today = dayjs();
    const endDate = today.add(days, 'days');
    
    return this.events
      .filter(event => event.date.isBetween(today, endDate, 'day', '[)'))
      .sort((a, b) => a.date.valueOf() - b.date.valueOf());
  }

  // Email Processing Integration
  async processEmailEvents(processingResults: EventProcessingResult[]): Promise<CalendarEvent[]> {
    if (!this.config.enableEmailProcessing) {
      throw new Error('Email processing is not enabled for this calendar service');
    }

    const createdEvents: CalendarEvent[] = [];

    for (const result of processingResults) {
      try {
        // Check for duplicates using enhanced duplicate detection
        const isDuplicate = await this.checkForDuplicate(result);
        
        if (!isDuplicate) {
          const event = await this.createEventFromEmail(result);
          createdEvents.push(event);
        }
      } catch (error) {
        console.error('Error processing email event:', error);
      }
    }

    return createdEvents;
  }

  private async createEventFromEmail(result: EventProcessingResult): Promise<CalendarEvent> {
    const eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'> = {
      title: result.title,
      eventType: this.mapEmailEventType(result.type),
      date: result.date,
      time: result.time,
      duration: this.getDefaultDuration(result.type),
      description: result.description,
      location: result.location,
      participants: result.participants || [],
      priority: this.determineEventPriority(result),
      tags: ['email-generated'],
      caseNumber: result.caseNumber,
      clientName: result.clientName,
      customFields: {
        sourceEmail: result.emailId,
        autoGenerated: true
      }
    };

    return await this.createEvent(eventData);
  }

  private mapEmailEventType(emailType: string): string {
    // Map email event types to industry-specific event types
    const typeMapping: { [key: string]: string } = {
      'HEARING': 'hearing',
      'MEETING': 'client-meeting',
      'DEADLINE': 'deadline',
      'APPOINTMENT': 'appointment',
      'CONSULTATION': 'consultation',
      'CLOSING': 'closing',
      'INSPECTION': 'inspection'
    };

    return typeMapping[emailType] || 'meeting';
  }

  private getDefaultDuration(eventType: string): number {
    const eventTypeConfig = this.config.industryConfig.eventTypes.find(
      type => type.id === this.mapEmailEventType(eventType)
    );
    return eventTypeConfig?.defaultDuration || 60;
  }

  private determineEventPriority(result: EventProcessingResult): string {
    // Determine priority based on event type and content
    if (result.type === 'DEADLINE' || result.title.toLowerCase().includes('urgent')) {
      return 'urgent';
    }
    if (result.type === 'HEARING') {
      return 'high';
    }
    return 'normal';
  }

  // Duplicate Detection
  private async checkForDuplicate(result: EventProcessingResult): Promise<boolean> {
    const potentialDuplicates = this.events.filter(event => {
      // Check for events on the same date
      if (!event.date.isSame(result.date, 'day')) {
        return false;
      }

      // Check for similar titles
      const titleSimilarity = this.calculateStringSimilarity(
        event.title.toLowerCase(),
        result.title.toLowerCase()
      );
      
      if (titleSimilarity > 0.8) {
        return true;
      }

      // Check for matching case numbers
      if (result.caseNumber && event.caseNumber === result.caseNumber) {
        return true;
      }

      // Check for matching participants
      if (result.participants && event.participants) {
        const participantOverlap = result.participants.filter(p =>
          event.participants!.some(ep => ep.toLowerCase().includes(p.toLowerCase()))
        );
        if (participantOverlap.length > 0 && titleSimilarity > 0.6) {
          return true;
        }
      }

      return false;
    });

    return potentialDuplicates.length > 0;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simple string similarity calculation
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // External Calendar Sync
  private async syncWithGoogleCalendar(action: string, event: CalendarEvent): Promise<void> {
    // Integration with Google Calendar API
    // This would use the existing GoogleCalendarService
    console.log(`Syncing ${action} with Google Calendar:`, event.title);
  }

  private async syncWithOutlook(action: string, event: CalendarEvent): Promise<void> {
    // Integration with Outlook/Exchange API
    console.log(`Syncing ${action} with Outlook:`, event.title);
  }

  // Notifications
  private async sendEventNotification(action: string, event: CalendarEvent): Promise<void> {
    const config = this.config.industryConfig.notifications;
    
    if (config.emailReminders) {
      await this.sendEmailNotification(action, event);
    }
    
    if (config.smsReminders) {
      await this.sendSMSNotification(action, event);
    }
    
    if (config.pushNotifications) {
      await this.sendPushNotification(action, event);
    }
  }

  private async sendEmailNotification(action: string, event: CalendarEvent): Promise<void> {
    console.log(`Sending email notification for ${action}:`, event.title);
  }

  private async sendSMSNotification(action: string, event: CalendarEvent): Promise<void> {
    console.log(`Sending SMS notification for ${action}:`, event.title);
  }

  private async sendPushNotification(action: string, event: CalendarEvent): Promise<void> {
    console.log(`Sending push notification for ${action}:`, event.title);
  }

  // Event Validation
  private validateEvent(event: CalendarEvent): void {
    const eventType = this.config.industryConfig.eventTypes.find(
      type => type.id === event.eventType
    );

    if (!eventType) {
      throw new Error(`Invalid event type: ${event.eventType}`);
    }

    if (eventType.requiresLocation && !event.location) {
      throw new Error(`Location is required for event type: ${eventType.name}`);
    }

    if (eventType.requiresParticipants && (!event.participants || event.participants.length === 0)) {
      throw new Error(`Participants are required for event type: ${eventType.name}`);
    }

    // Validate custom fields
    this.config.industryConfig.customFields?.forEach(field => {
      if (field.required) {
        const value = field.name === 'caseNumber' ? event.caseNumber :
                     field.name === 'clientName' ? event.clientName :
                     event.customFields?.[field.name];
        
        if (!value) {
          throw new Error(`${field.label} is required`);
        }
      }
    });
  }

  // Utility Methods
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Event Listeners
  on(eventType: string, callback: Function): void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.push(callback);
    this.eventListeners.set(eventType, listeners);
  }

  off(eventType: string, callback: Function): void {
    const listeners = this.eventListeners.get(eventType) || [];
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  private emit(eventType: string, data: any): void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.forEach(callback => callback(data));
  }

  // Configuration Management
  updateConfig(newConfig: Partial<EnhancedCalendarServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): EnhancedCalendarServiceConfig {
    return { ...this.config };
  }

  // Bulk Operations
  async bulkCreateEvents(events: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<CalendarEvent[]> {
    const createdEvents: CalendarEvent[] = [];
    
    for (const eventData of events) {
      try {
        const event = await this.createEvent(eventData);
        createdEvents.push(event);
      } catch (error) {
        console.error('Error creating bulk event:', error);
      }
    }
    
    return createdEvents;
  }

  async bulkUpdateEvents(updates: Array<{ id: string; updates: Partial<CalendarEvent> }>): Promise<CalendarEvent[]> {
    const updatedEvents: CalendarEvent[] = [];
    
    for (const { id, updates: eventUpdates } of updates) {
      try {
        const event = await this.updateEvent(id, eventUpdates);
        updatedEvents.push(event);
      } catch (error) {
        console.error('Error updating bulk event:', error);
      }
    }
    
    return updatedEvents;
  }

  async bulkDeleteEvents(eventIds: string[]): Promise<void> {
    for (const eventId of eventIds) {
      try {
        await this.deleteEvent(eventId);
      } catch (error) {
        console.error('Error deleting bulk event:', error);
      }
    }
  }
}
