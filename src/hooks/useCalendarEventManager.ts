import React, { useState, useCallback, useEffect } from 'react';
import { CalendarEvent, TaskDefinition } from '../services/calendar/EmailEventAnalyzer';
import { CalendarEventService, CalendarService, ReminderService } from '../services/calendar/CalendarEventService';
import { Task } from '../services/tasks/taskService';

export interface CalendarEventManager {
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  
  // CRUD Operations
  createEvent: (event: Omit<CalendarEvent, 'id'>, tasks?: TaskDefinition[]) => Promise<string>;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  getEvents: (startDate?: Date, endDate?: Date) => Promise<CalendarEvent[]>;
  
  // Task Integration
  linkTaskToEvent: (taskId: string, eventId: string) => Promise<void>;
  unlinkTaskFromEvent: (taskId: string, eventId: string) => Promise<void>;
  getEventTasks: (eventId: string) => Promise<Task[]>;
  
  // Utility Methods
  findEventByCaseNumber: (caseNumber: string) => Promise<CalendarEvent | null>;
  findRelatedEvent: (task: Task) => CalendarEvent | null;
  refreshEvents: () => Promise<void>;
}

// Mock Calendar Service for development
class MockCalendarService implements CalendarService {
  private events: Map<string, CalendarEvent> = new Map();

  async createEvent(event: CalendarEvent): Promise<string> {
    const id = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newEvent: CalendarEvent = {
      ...event,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      date: event.startDate || new Date()
    };
    this.events.set(id, newEvent);
    console.log('📅 MockCalendarService: Created event:', newEvent);
    return id;
  }

  async updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<void> {
    const event = this.events.get(eventId);
    if (!event) throw new Error(`Event ${eventId} not found`);
    
    const updatedEvent = { 
      ...event, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.events.set(eventId, updatedEvent);
    console.log('📅 MockCalendarService: Updated event:', updatedEvent);
  }

  async deleteEvent(eventId: string): Promise<void> {
    if (!this.events.has(eventId)) {
      throw new Error(`Event ${eventId} not found`);
    }
    this.events.delete(eventId);
    console.log('📅 MockCalendarService: Deleted event:', eventId);
  }

  async getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    const events = Array.from(this.events.values()).filter(event => {
      if (!event.startDate) return false;
      return event.startDate >= startDate && event.startDate <= endDate;
    });
    console.log('📅 MockCalendarService: Retrieved events:', events.length);
    return events;
  }

  async findEventByCaseNumber(caseNumber: string): Promise<CalendarEvent | null> {
    const event = Array.from(this.events.values()).find(e => 
      e.metadata?.caseNumber === caseNumber
    );
    return event || null;
  }

  // Helper method to get all events (for development)
  async getAllEvents(): Promise<CalendarEvent[]> {
    return Array.from(this.events.values());
  }

  // Helper method to add mock events
  addMockEvents() {
    const mockEvents: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        title: 'Client Meeting - Contract Review',
        description: 'Review contract terms with ABC Corp',
        startDate: new Date('2025-08-15T10:00:00'),
        endDate: new Date('2025-08-15T11:00:00'),
        location: 'Conference Room A',
        eventType: 'meeting',
        attendees: ['john@example.com', 'client@abccorp.com'],
        sourceEmail: null,
        relatedTasks: [],
        reminders: [],
        metadata: { caseNumber: 'CASE-001', clientName: 'ABC Corp' },
        date: new Date('2025-08-15T10:00:00')
      },
      {
        title: 'Court Hearing - Smith vs. Jones',
        description: 'Motion hearing for preliminary injunction',
        startDate: new Date('2025-08-16T14:00:00'),
        endDate: new Date('2025-08-16T16:00:00'),
        location: 'Courthouse Room 302',
        eventType: 'court',
        attendees: [],
        sourceEmail: null,
        relatedTasks: [],
        reminders: [],
        metadata: { caseNumber: 'CASE-002', clientName: 'Smith Family' },
        date: new Date('2025-08-16T14:00:00')
      },
      {
        title: 'Deposition - Johnson Case',
        description: 'Witness deposition for Johnson vs. State',
        startDate: new Date('2025-08-17T09:00:00'),
        endDate: new Date('2025-08-17T12:00:00'),
        location: 'Law Office Conference Room',
        eventType: 'deposition',
        attendees: ['witness@email.com', 'opposing@counsel.com'],
        sourceEmail: null,
        relatedTasks: [],
        reminders: [],
        metadata: { caseNumber: 'CASE-003', clientName: 'Johnson Family' },
        date: new Date('2025-08-17T09:00:00')
      }
    ];

    mockEvents.forEach(async (event) => {
      await this.createEvent(event as CalendarEvent);
    });
  }
}

// Mock Reminder Service
class MockReminderService implements ReminderService {
  async scheduleReminder(): Promise<string> { return 'reminder-' + Date.now(); }
  async cancelReminder(): Promise<void> { }
  async updateReminder(): Promise<void> { }
  async getActiveReminders(): Promise<any[]> { return []; }
}

export function useCalendarEventManager(): CalendarEventManager {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize services
  const [calendarService] = useState(() => {
    const service = new MockCalendarService();
    // Add mock events for development
    service.addMockEvents();
    return service;
  });
  
  const [reminderService] = useState(() => new MockReminderService());
  const [eventService] = useState(() => new CalendarEventService(calendarService, reminderService));

  const handleError = useCallback((error: any, operation: string) => {
    console.error(`Calendar operation failed (${operation}):`, error);
    setError(error.message || `Failed to ${operation}`);
    setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
  }, []);

  const createEvent = useCallback(async (
    eventData: Omit<CalendarEvent, 'id'>, 
    tasks: TaskDefinition[] = []
  ): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);

      const event: CalendarEvent = {
        ...eventData,
        id: `temp-${Date.now()}`, // Temporary ID
        createdAt: new Date(),
        updatedAt: new Date(),
        date: eventData.startDate || new Date()
      };

      const result = await eventService.createEventWithTasks(event, tasks);
      
      // Refresh events list
      await refreshEvents();
      
      console.log('✅ Event created successfully:', result.eventId);
      return result.eventId;
    } catch (error) {
      handleError(error, 'create event');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [eventService, handleError]);

  const updateEvent = useCallback(async (
    eventId: string, 
    updates: Partial<CalendarEvent>
  ): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      await calendarService.updateEvent(eventId, updates);
      
      // Update local state
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { ...event, ...updates, updatedAt: new Date() }
            : event
        )
      );

      console.log('✅ Event updated successfully:', eventId);
    } catch (error) {
      handleError(error, 'update event');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [calendarService, handleError]);

  const deleteEvent = useCallback(async (eventId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      await calendarService.deleteEvent(eventId);
      
      // Update local state
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));

      console.log('✅ Event deleted successfully:', eventId);
    } catch (error) {
      handleError(error, 'delete event');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [calendarService, handleError]);

  const getEvents = useCallback(async (
    startDate?: Date, 
    endDate?: Date
  ): Promise<CalendarEvent[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const start = startDate || new Date();
      const end = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      const fetchedEvents = await calendarService.getEvents(start, end);
      setEvents(fetchedEvents);

      console.log('✅ Events retrieved successfully:', fetchedEvents.length);
      return fetchedEvents;
    } catch (error) {
      handleError(error, 'retrieve events');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [calendarService, handleError]);

  const refreshEvents = useCallback(async (): Promise<void> => {
    try {
      // Get all events for development
      const allEvents = await (calendarService as MockCalendarService).getAllEvents();
      setEvents(allEvents);
      console.log('🔄 Events refreshed:', allEvents.length);
    } catch (error) {
      handleError(error, 'refresh events');
    }
  }, [calendarService, handleError]);

  const linkTaskToEvent = useCallback(async (
    taskId: string, 
    eventId: string
  ): Promise<void> => {
    try {
      console.log('🔗 Linking task to event:', { taskId, eventId });
      // Implementation would update both task and event records
      // For now, just log the operation
    } catch (error) {
      handleError(error, 'link task to event');
    }
  }, [handleError]);

  const unlinkTaskFromEvent = useCallback(async (
    taskId: string, 
    eventId: string
  ): Promise<void> => {
    try {
      console.log('🔗 Unlinking task from event:', { taskId, eventId });
      // Implementation would update both task and event records
    } catch (error) {
      handleError(error, 'unlink task from event');
    }
  }, [handleError]);

  const getEventTasks = useCallback(async (eventId: string): Promise<Task[]> => {
    try {
      // Mock implementation - return empty array for now
      console.log('📋 Getting tasks for event:', eventId);
      return [];
    } catch (error) {
      handleError(error, 'get event tasks');
      return [];
    }
  }, [handleError]);

  const findEventByCaseNumber = useCallback(async (
    caseNumber: string
  ): Promise<CalendarEvent | null> => {
    try {
      return await calendarService.findEventByCaseNumber?.(caseNumber) || null;
    } catch (error) {
      handleError(error, 'find event by case number');
      return null;
    }
  }, [calendarService, handleError]);

  const findRelatedEvent = useCallback((task: Task): CalendarEvent | null => {
    return events.find(event => 
      event.id === task.relatedCalendarEventId || 
      event.id === task.relatedEventId ||
      event.metadata?.caseNumber === task.metadata?.caseNumber
    ) || null;
  }, [events]);

  // Initialize events on first load
  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  return {
    events,
    isLoading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    getEvents,
    linkTaskToEvent,
    unlinkTaskFromEvent,
    getEventTasks,
    findEventByCaseNumber,
    findRelatedEvent,
    refreshEvents
  };
}
