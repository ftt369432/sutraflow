import { useState, useCallback, useMemo } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { EmailMessage } from '../../services/email/types';
import {
  CalendarEvent,
  IndustryConfig,
  CalendarFilters,
  UseEnhancedCalendarProps,
  UseEnhancedCalendarReturn
} from '../../types/calendar.types';
import { useEmailCalendarIntegration } from './useEmailCalendarIntegration';
import { useAutoCalendarProcessing } from './useAutoCalendarProcessing';
import { useCalendarModal } from './useCalendarModal';

// Extend dayjs with isBetween plugin
dayjs.extend(isBetween);

interface CalendarAutomationStats {
  calendarEventsCreated: number;
  tasksAutomated: number;
  duplicatesPrevented: number;
  legalCasesProcessed: number;
  voiceCommandsUsed: number;
  wcabHearingsScheduled: number;
}

/**
 * Enhanced calendar hook for industry-agnostic calendar management
 * Provides comprehensive calendar functionality with industry-specific configurations
 */
export const useEnhancedCalendarCore = ({
  events,
  industryConfig,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  onDateSelect
}: UseEnhancedCalendarProps): UseEnhancedCalendarReturn => {
  // State management
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [filters, setFilters] = useState<CalendarFilters>({
    eventTypes: [],
    priorities: [],
    participants: [],
    searchText: '',
    tags: [],
    showCompleted: true,
    customFilters: {}
  });

  // Filtered events based on current filters
  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    // Apply date range filter
    if (filters.dateRange && filters.dateRange.length === 2) {
      const [startDate, endDate] = filters.dateRange;
      filtered = filtered.filter(event =>
        event.date.isBetween(startDate, endDate, 'day', '[]')
      );
    }

    // Apply event type filter
    if (filters.eventTypes && filters.eventTypes.length > 0) {
      filtered = filtered.filter(event =>
        filters.eventTypes!.includes(event.eventType)
      );
    }

    // Apply priority filter
    if (filters.priorities && filters.priorities.length > 0) {
      filtered = filtered.filter(event =>
        filters.priorities!.includes(event.priority || 'normal')
      );
    }

    // Apply participants filter
    if (filters.participants && filters.participants.length > 0) {
      filtered = filtered.filter(event =>
        event.participants?.some(participant =>
          filters.participants!.some(filterParticipant =>
            participant.toLowerCase().includes(filterParticipant.toLowerCase())
          )
        )
      );
    }

    // Apply search text filter
    if (filters.searchText && filters.searchText.trim()) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchLower) ||
        event.description?.toLowerCase().includes(searchLower) ||
        event.location?.toLowerCase().includes(searchLower) ||
        event.caseNumber?.toLowerCase().includes(searchLower) ||
        event.clientName?.toLowerCase().includes(searchLower)
      );
    }

    // Apply tags filter
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(event =>
        event.tags?.some(tag =>
          filters.tags!.some(filterTag =>
            tag.toLowerCase().includes(filterTag.toLowerCase())
          )
        )
      );
    }

    // Apply completed filter
    if (filters.showCompleted === false) {
      filtered = filtered.filter(event =>
        event.customFields?.completed !== true
      );
    }

    // Apply custom filters
    if (filters.customFilters) {
      Object.entries(filters.customFilters).forEach(([key, value]) => {
        if (value && value !== '') {
          filtered = filtered.filter(event => {
            const eventValue = event.customFields?.[key] ||
                             (key === 'caseNumber' ? event.caseNumber : null) ||
                             (key === 'clientName' ? event.clientName : null);
            
            if (typeof value === 'string') {
              return eventValue?.toString().toLowerCase().includes(value.toLowerCase());
            }
            return eventValue === value;
          });
        }
      });
    }

    return filtered.sort((a, b) => a.date.valueOf() - b.date.valueOf());
  }, [events, filters]);

  // Event handlers
  const handleDateSelect = useCallback((date: Dayjs) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  }, [onDateSelect]);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  }, []);

  const handleEventCreate = useCallback((event: CalendarEvent) => {
    onEventCreate?.(event);
    setIsModalOpen(false);
    setSelectedEvent(null);
  }, [onEventCreate]);

  const handleEventUpdate = useCallback((event: CalendarEvent) => {
    onEventUpdate?.(event);
    setIsModalOpen(false);
    setSelectedEvent(null);
  }, [onEventUpdate]);

  const handleEventDelete = useCallback((eventId: string) => {
    onEventDelete?.(eventId);
    setIsModalOpen(false);
    setSelectedEvent(null);
  }, [onEventDelete]);

  const handleFilterChange = useCallback((newFilters: Partial<CalendarFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  }, []);

  const openCreateModal = useCallback((eventType?: string) => {
    const newEvent: Partial<CalendarEvent> = {
      eventType: eventType || industryConfig.eventTypes[0]?.id || 'meeting',
      date: selectedDate,
      priority: 'normal',
      isRecurring: false,
      reminderMinutes: industryConfig.notifications?.defaultReminderMinutes || 15,
      tags: [],
      participants: [],
      customFields: {}
    };

    setSelectedEvent(newEvent as CalendarEvent);
    setIsModalOpen(true);
  }, [selectedDate, industryConfig]);

  return {
    selectedDate,
    filteredEvents,
    isModalOpen,
    selectedEvent,
    filters,
    handleDateSelect,
    handleEventClick,
    handleEventCreate,
    handleEventUpdate,
    handleEventDelete,
    handleFilterChange,
    closeModal,
    openCreateModal
  };
};

/**
 * Master calendar hook that orchestrates all calendar functionality
 * Follows composition pattern - combines multiple focused hooks
 */
export const useEnhancedCalendar = (
  messages: EmailMessage[],
  routeAccountId?: string,
  selectedAccountId?: string
) => {
  // State for calendar features
  const [isAutoCalendarEnabled, setIsAutoCalendarEnabled] = useState(false);
  const [automationStats, setAutomationStats] = useState<CalendarAutomationStats>({
    calendarEventsCreated: 23,
    tasksAutomated: 47,
    duplicatesPrevented: 8,
    legalCasesProcessed: 12,
    voiceCommandsUsed: 15,
    wcabHearingsScheduled: 6
  });

  // Composed hooks
  const calendarIntegration = useEmailCalendarIntegration();
  const autoProcessing = useAutoCalendarProcessing(
    messages,
    isAutoCalendarEnabled,
    routeAccountId,
    selectedAccountId
  );
  const calendarModal = useCalendarModal();

  // Load automation stats
  const loadAutomationStats = useCallback(async () => {
    // In production, this would load from your automation service
    setAutomationStats({
      calendarEventsCreated: 23,
      tasksAutomated: 47,
      duplicatesPrevented: 8,
      legalCasesProcessed: 12,
      voiceCommandsUsed: 15,
      wcabHearingsScheduled: 6
    });
  }, []);

  // Update automation stats
  const updateAutomationStats = useCallback((updates: Partial<CalendarAutomationStats>) => {
    setAutomationStats(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Handle creating calendar event from email
  const handleCreateCalendarEvent = useCallback(async (email: EmailMessage, forceCreate: boolean = false) => {
    try {
      const { eventDetails } = await calendarIntegration.createCalendarEventFromEmail(email, forceCreate);
      calendarModal.openModal(email, eventDetails);
      console.log('🎯 Calendar modal opened for email:', email.subject);
    } catch (error) {
      console.error('❌ Error opening calendar modal:', error);
      throw error;
    }
  }, [calendarIntegration, calendarModal]);

  // Handle saving calendar event (called from modal)
  const handleSaveCalendarEvent = useCallback(async (eventDetails: any) => {
    try {
      const result = await calendarIntegration.saveCalendarEvent({
        ...eventDetails,
        sourceEmailId: calendarModal.selectedEmail?.id
      });
      
      // Update automation stats
      updateAutomationStats({
        calendarEventsCreated: automationStats.calendarEventsCreated + 1,
        tasksAutomated: automationStats.tasksAutomated + (eventDetails.customTasks?.length || 0)
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error saving calendar event:', error);
      
      // Check if this is a calendar permissions error
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = String(error.message);
        if (errorMessage.includes('Calendar permissions required') || 
            errorMessage.includes('insufficient authentication scopes') ||
            errorMessage.includes('Google Calendar API returned no event ID')) {
          calendarModal.setNeedsReauth(true);
          throw new Error('Calendar permissions required. Please re-authenticate to grant calendar access.');
        }
      }
      
      throw error;
    }
  }, [calendarIntegration, calendarModal, automationStats, updateAutomationStats]);

  // Handle batch calendar processing
  const handleBatchCalendarAnalysis = useCallback(async (emailIds: string[]) => {
    try {
      const result = await autoProcessing.processBatchCalendarAnalysis(emailIds);
      
      // Update automation stats
      updateAutomationStats({
        calendarEventsCreated: automationStats.calendarEventsCreated + result.eventsCreated,
        tasksAutomated: automationStats.tasksAutomated + result.tasksCreated
      });
      
      return result;
    } catch (error) {
      console.error('❌ Batch calendar analysis failed:', error);
      throw error;
    }
  }, [autoProcessing, automationStats, updateAutomationStats]);

  return {
    // State
    isAutoCalendarEnabled,
    setIsAutoCalendarEnabled,
    automationStats,
    
    // Auto processing state
    isAutoProcessing: autoProcessing.isAutoProcessing,
    autoProcessedIds: autoProcessing.autoProcessedIds,
    
    // Modal state
    calendarModal: {
      isOpen: calendarModal.isOpen,
      selectedEmail: calendarModal.selectedEmail,
      eventDetails: calendarModal.eventDetails,
      needsReauth: calendarModal.needsReauth,
      openModal: calendarModal.openModal,
      closeModal: calendarModal.closeModal,
      setNeedsReauth: calendarModal.setNeedsReauth
    },
    
    // Services (for advanced usage)
    calendarEventService: calendarIntegration.calendarEventService,
    eventAnalyzer: calendarIntegration.eventAnalyzer,
    
    // Helper functions
    isLegalEmail: calendarIntegration.isLegalEmail,
    
    // Main operations
    handleCreateCalendarEvent,
    handleSaveCalendarEvent,
    handleBatchCalendarAnalysis,
    
    // Utility
    loadAutomationStats,
    updateAutomationStats
  };
};
