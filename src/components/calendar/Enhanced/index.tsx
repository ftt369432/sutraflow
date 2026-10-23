// Enhanced Calendar Components
export { default as EnhancedCalendarComponent } from './EnhancedCalendarComponent';
export { default as CalendarEventModal } from './CalendarEventModal';
export { default as CalendarFilters } from './CalendarFilters';
export { default as CalendarStats } from './CalendarStats';
export { default as CalendarQuickActions } from './CalendarQuickActions';

// Re-export types for convenience
export type {
  CalendarEvent,
  IndustryConfig,
  EventType,
  CalendarFilters as ICalendarFilters
} from '../../../types/calendar.types';
