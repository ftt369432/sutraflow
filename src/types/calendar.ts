export interface Event {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  type: EventType;
  metadata?: Record<string, unknown>;
  attendees?: string[];
  created: Date;
  lastModified: Date;
  recurrence?: RecurrenceRule;
}

export enum EventType {
  TASK = 'task',
  MEETING = 'meeting',
  REMINDER = 'reminder',
  DEADLINE = 'deadline'
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: number;
  endDate?: Date;
  count?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  type: 'meeting' | 'task' | 'reminder';
  status?: 'scheduled' | 'completed' | 'cancelled';
  location?: string;
  attendees?: string[];
  metadata?: Record<string, unknown>;
}