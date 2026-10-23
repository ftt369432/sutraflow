// Calendar hooks - organized and exported for clean imports
export { useEmailCalendarIntegration } from './useEmailCalendarIntegration';
export { useAutoCalendarProcessing } from './useAutoCalendarProcessing';
export { useCalendarModal } from './useCalendarModal';
export { useEnhancedCalendar } from './useEnhancedCalendar';

// Re-export types that might be needed by components
export type { EmailEventDetails } from '../../services/calendar/EmailEventAnalyzer';
