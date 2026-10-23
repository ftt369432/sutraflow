/**
 * Calendar Service Module - Mock Implementation
 */

import { CalendarService, type CalendarEvent, type Calendar } from './calendarService';

// Create and export the service instance
export const calendarService = new CalendarService();

// Re-export types
export type { CalendarEvent, Calendar }; 