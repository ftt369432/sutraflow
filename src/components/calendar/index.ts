// Calendar Components - Organized exports for clean imports
export { Calendar } from './Calendar';
export { ViewSelector } from './ViewSelector';
export { ProductivityInsights } from './ProductivityInsights';
export { TaskManager } from './TaskManager';
// CalendarMetrics component (renamed from CalendarAnalytics)
export { default as CalendarMetrics } from './CalendarMetrics';
export { EventCard } from './EventCard';
export { CalendarEvent } from './CalendarEvent';
export { CalendarEventModal } from './CalendarEventModal';

// Calendar views
export { MonthView } from './MonthView';
export { DayView } from './DayView';

// Calendar utilities
export { CalendarErrorBoundary } from './CalendarErrorBoundary';

// Re-export types
export type { CalendarEvent as CalendarEventType } from '../../services/calendar/calendarService';
