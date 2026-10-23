import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { useTaskStore } from './taskStore';
import { useAutomationStore } from './automationStore';

export type CalendarSource = {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  type: 'primary' | 'secondary' | 'tasks' | 'automation' | 'timeblock' | 'external';
  icon?: string;
  description?: string;
  url?: string;
  lastSynced?: Date;
};

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  startDate?: Date; // Alias for compatibility
  endDate?: Date;   // Alias for compatibility
  date?: any;        // For Dayjs compatibility in some components
  allDay: boolean;
  sourceId: string;
  location?: string;
  url?: string;
  attendees?: string[];
  taskId?: string; // Reference to a task if this is a task event
  automationId?: string; // Reference to automation if this is related to an automation
  timeBlockId?: string; // Reference to a time block if this is a time block
  color?: string; // Override color
  completed?: boolean; // For task events
  eventType?: string;
  metadata?: Record<string, any>;
  sourceEmail?: string;
  sourceEmails?: string[];
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
    endCount?: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
  };
  tags: string[];
  createdAt?: Date | any;
  updatedAt?: Date | any;
};

export type TimeBlock = {
  id: string;
  name: string;
  description?: string;
  start: Date;
  end: Date;
  color: string;
  priority: 'high' | 'medium' | 'low';
  focusMode: boolean; // Whether to enable focus mode during this time block
  recurring: boolean;
  tags: string[];
  tasks?: string[]; // Task IDs associated with this time block
};

export type Tag = {
  id: string;
  name: string;
  color: string;
};

export type CalendarView = 'month' | 'week' | 'day' | 'agenda' | 'timeblock';

export type OverlaySettings = {
  showCompleted: boolean;
  showTasks: boolean;
  showAutomations: boolean;
  showTimeBlocks: boolean;
  fadeCompleted: boolean;
};

export interface CalendarState {
  events: CalendarEvent[];
  sources: CalendarSource[];
  timeBlocks: TimeBlock[];
  tags: Tag[];
  selectedDate: Date;
  view: CalendarView;
  overlaySettings: OverlaySettings;

  // Events
  addEvent: (event: Omit<CalendarEvent, 'id'>) => string;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  deleteMultipleEvents: (ids: string[]) => void;
  deduplicateEvents: () => number;
  completeEvent: (id: string) => void;
  getEventsByDateRange: (start: Date, end: Date) => CalendarEvent[];
  getEventsBySource: (sourceId: string) => CalendarEvent[];
  getEventsByTag: (tagId: string) => CalendarEvent[];

  // Sources (Calendars)
  addSource: (source: Omit<CalendarSource, 'id'>) => string;
  updateSource: (id: string, updates: Partial<CalendarSource>) => void;
  deleteSource: (id: string) => void;
  toggleSourceVisibility: (id: string) => void;

  // Time Blocks
  addTimeBlock: (timeBlock: Omit<TimeBlock, 'id'>) => string;
  updateTimeBlock: (id: string, updates: Partial<TimeBlock>) => void;
  deleteTimeBlock: (id: string) => void;
  generateTimeBlocks: (params: {
    taskIds?: string[];
    date?: Date;
    preferences?: {
      startTime?: string;
      endTime?: string;
      breakDuration?: number;
      focusBlockDuration?: number;
    };
  }) => string[];

  // Tags
  addTag: (tag: Omit<Tag, 'id'>) => string;
  updateTag: (id: string, updates: Partial<Tag>) => void;
  deleteTag: (id: string) => void;

  // View settings
  setView: (view: CalendarView) => void;
  setSelectedDate: (date: Date) => void;
  updateOverlaySettings: (settings: Partial<OverlaySettings>) => void;

  // Integrations
  syncTasksToCalendar: () => void;
  syncAutomationsToCalendar: () => void;
}

// Sample data
const primaryCalendar: CalendarSource = {
  id: 'primary',
  name: 'My Calendar',
  color: '#4285F4',
  visible: true,
  type: 'primary',
  description: 'Primary calendar'
};

const taskCalendar: CalendarSource = {
  id: 'tasks',
  name: 'Tasks',
  color: '#0F9D58',
  visible: true,
  type: 'tasks',
  description: 'Tasks calendar overlay'
};

const automationCalendar: CalendarSource = {
  id: 'automation',
  name: 'Automations',
  color: '#DB4437',
  visible: true,
  type: 'automation',
  description: 'Scheduled automations'
};

const timeBlockCalendar: CalendarSource = {
  id: 'timeblock',
  name: 'Focus Blocks',
  color: '#9C27B0',
  visible: true,
  type: 'timeblock',
  description: 'Focus time blocks'
};

const defaultTags: Tag[] = [
  { id: 'work', name: 'Work', color: '#4285F4' },
  { id: 'personal', name: 'Personal', color: '#0F9D58' },
  { id: 'urgent', name: 'Urgent', color: '#DB4437' },
  { id: 'focus', name: 'Focus', color: '#F4B400' }
];

// Helper function to generate sample events
const generateSampleEvents = (): CalendarEvent[] => {
  const now = new Date();

  return [
    {
      id: uuidv4(),
      title: 'Team Meeting',
      description: 'Weekly team sync',
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0),
      end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0),
      allDay: false,
      sourceId: 'primary',
      tags: ['work']
    },
    {
      id: uuidv4(),
      title: 'Complete Project Proposal',
      description: 'Finish the draft and send for review',
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 14, 0),
      end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 16, 0),
      allDay: false,
      sourceId: 'tasks',
      completed: false,
      taskId: 'task-1',
      tags: ['work', 'urgent']
    }
  ];
};

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      events: generateSampleEvents(),
      sources: [primaryCalendar, taskCalendar, automationCalendar, timeBlockCalendar],
      timeBlocks: [],
      tags: defaultTags,
      selectedDate: new Date(),
      view: 'week',
      overlaySettings: {
        showCompleted: true,
        showTasks: true,
        showAutomations: true,
        showTimeBlocks: true,
        fadeCompleted: true
      },

      addEvent: (event) => {
        const state = get();
        const eventStart = event.start || (event as any).startDate;
        const timeKey = eventStart
          ? (typeof eventStart === 'string' ? new Date(eventStart).toISOString().slice(0, 16) : eventStart.toISOString().slice(0, 16))
          : '';
        const titleKey = (event.title || '').trim().toLowerCase();

        // Prevent duplicate insertion if an event with the same title and timeKey already exists
        const existing = state.events.find((e) => {
          const s = e.start || e.startDate;
          const existingTimeKey = s
            ? (typeof s === 'string' ? new Date(s).toISOString().slice(0, 16) : s.toISOString().slice(0, 16))
            : '';
          return (e.title || '').trim().toLowerCase() === titleKey && existingTimeKey === timeKey;
        });

        if (existing) {
          console.log('📅 CalendarStore: Prevented duplicate event:', event.title);
          return existing.id;
        }

        const id = uuidv4();
        const newEvent = { ...event, id };
        console.log('📅 CalendarStore: Adding event:', { id, title: event.title, start: event.start });
        set((state) => ({
          events: [...state.events, newEvent]
        }));
        return id;
      },

      updateEvent: (id, updates) => {
        set((state) => ({
          events: state.events.map(event =>
            event.id === id ? { ...event, ...updates } : event
          )
        }));
      },

      deleteEvent: (id) => {
        set((state) => ({
          events: state.events.filter(event => event.id !== id)
        }));
      },

      deleteMultipleEvents: (ids) => {
        const setIds = new Set(ids);
        set((state) => ({
          events: state.events.filter((event) => !setIds.has(event.id))
        }));
      },

      deduplicateEvents: () => {
        let removed = 0;
        set((state) => {
          const seen = new Set<string>();
          const unique: CalendarEvent[] = [];

          for (const ev of state.events) {
            const s = ev.start || ev.startDate;
            const timeKey = s
              ? (typeof s === 'string' ? new Date(s).toISOString().slice(0, 16) : s.toISOString().slice(0, 16))
              : 'no-time';
            const key = `${(ev.title || '').trim().toLowerCase()}_${timeKey}`;
            if (seen.has(key)) {
              removed++;
            } else {
              seen.add(key);
              unique.push(ev);
            }
          }
          return { events: unique };
        });
        console.log(`📅 CalendarStore: Deduplicated ${removed} redundant events.`);
        return removed;
      },

      completeEvent: (id) => {
        set((state) => ({
          events: state.events.map(event =>
            event.id === id ? { ...event, completed: true } : event
          )
        }));

        // If this is a task event, also mark the task as completed
        const event = get().events.find(e => e.id === id);
        if (event?.taskId) {
          try {
            const taskStore = useTaskStore.getState();
            taskStore.completeTask(event.taskId);
          } catch (error) {
            console.error("Could not mark task as completed:", error);
          }
        }
      },

      getEventsByDateRange: (start, end) => {
        const state = get();
        const visibleSourceIds = state.sources
          .filter(source => source.visible)
          .map(source => source.id);

        return state.events.filter(event => {
          // Filter by visible sources
          if (!visibleSourceIds.includes(event.sourceId)) {
            return false;
          }

          // Filter by overlay settings
          if (event.taskId && !state.overlaySettings.showTasks) {
            return false;
          }

          if (event.automationId && !state.overlaySettings.showAutomations) {
            return false;
          }

          if (event.timeBlockId && !state.overlaySettings.showTimeBlocks) {
            return false;
          }

          if (event.completed && !state.overlaySettings.showCompleted) {
            return false;
          }

          // Filter by date range
          const eventStart = new Date(event.start);
          const eventEnd = new Date(event.end);

          return (
            (eventStart >= start && eventStart <= end) ||
            (eventEnd >= start && eventEnd <= end) ||
            (eventStart <= start && eventEnd >= end)
          );
        });
      },

      getEventsBySource: (sourceId) => {
        return get().events.filter(event => event.sourceId === sourceId);
      },

      getEventsByTag: (tagId) => {
        return get().events.filter(event => event.tags.includes(tagId));
      },

      addSource: (source) => {
        const id = uuidv4();
        set((state) => ({
          sources: [...state.sources, { ...source, id }]
        }));
        return id;
      },

      updateSource: (id, updates) => {
        set((state) => ({
          sources: state.sources.map(source =>
            source.id === id ? { ...source, ...updates } : source
          )
        }));
      },

      deleteSource: (id) => {
        // Don't allow deleting the primary calendar
        if (id === 'primary') {
          console.warn("Cannot delete primary calendar");
          return;
        }

        set((state) => ({
          sources: state.sources.filter(source => source.id !== id),
          events: state.events.filter(event => event.sourceId !== id)
        }));
      },

      toggleSourceVisibility: (id) => {
        set((state) => ({
          sources: state.sources.map(source =>
            source.id === id ? { ...source, visible: !source.visible } : source
          )
        }));
      },

      addTimeBlock: (timeBlock) => {
        const id = uuidv4();
        const newTimeBlock = { ...timeBlock, id };

        set((state) => ({
          timeBlocks: [...state.timeBlocks, newTimeBlock]
        }));

        // Also add a calendar event for this time block
        const calendarEvent: Omit<CalendarEvent, 'id'> = {
          title: `🔍 ${timeBlock.name}`,
          description: timeBlock.description,
          start: timeBlock.start,
          end: timeBlock.end,
          allDay: false,
          sourceId: 'timeblock',
          timeBlockId: id,
          color: timeBlock.color,
          tags: timeBlock.tags
        };

        get().addEvent(calendarEvent);

        return id;
      },

      updateTimeBlock: (id, updates) => {
        set((state) => ({
          timeBlocks: state.timeBlocks.map(timeBlock =>
            timeBlock.id === id ? { ...timeBlock, ...updates } : timeBlock
          )
        }));

        // Also update the associated calendar event
        const timeBlock = get().timeBlocks.find(tb => tb.id === id);
        if (timeBlock) {
          const events = get().events.filter(event => event.timeBlockId === id);

          for (const event of events) {
            const eventUpdates: Partial<CalendarEvent> = {};

            if (updates.name) {
              eventUpdates.title = `🔍 ${updates.name}`;
            }

            if (updates.description) {
              eventUpdates.description = updates.description;
            }

            if (updates.start) {
              eventUpdates.start = updates.start;
            }

            if (updates.end) {
              eventUpdates.end = updates.end;
            }

            if (updates.color) {
              eventUpdates.color = updates.color;
            }

            if (updates.tags) {
              eventUpdates.tags = updates.tags;
            }

            if (Object.keys(eventUpdates).length > 0) {
              get().updateEvent(event.id, eventUpdates);
            }
          }
        }
      },

      deleteTimeBlock: (id) => {
        set((state) => ({
          timeBlocks: state.timeBlocks.filter(timeBlock => timeBlock.id !== id),
          events: state.events.filter(event => event.timeBlockId !== id)
        }));
      },

      generateTimeBlocks: (params) => {
        const {
          taskIds = [],
          date = new Date(),
          preferences = {}
        } = params;

        const {
          startTime = '09:00',
          endTime = '17:00',
          breakDuration = 15,
          focusBlockDuration = 90
        } = preferences;

        const timeBlockIds: string[] = [];
        const taskStore = useTaskStore.getState();

        // Get the tasks to schedule
        const tasks = taskIds.length > 0
          ? taskIds.map(id => taskStore.tasks.find(t => t.id === id)).filter(Boolean)
          : taskStore.tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) >= date);

        // Sort tasks by priority and due date
        tasks.sort((a, b) => {
          if (!a || !b) return 0; // Add null check

          if (a.priority !== b.priority) {
            const aPriority = a.priority?.toLowerCase();
            const bPriority = b.priority?.toLowerCase();
            return aPriority === 'high' || aPriority === 'urgent' ? -1 :
              bPriority === 'high' || bPriority === 'urgent' ? 1 :
                aPriority === 'medium' ? -1 : 1;
          }

          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          }

          return 0;
        });

        // Parse start and end times
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        const dayStart = new Date(date);
        dayStart.setHours(startHour, startMinute, 0, 0);

        const dayEnd = new Date(date);
        dayEnd.setHours(endHour, endMinute, 0, 0);

        // Create time blocks
        let currentTime = new Date(dayStart);

        for (const task of tasks) {
          if (!task) continue; // Add null check

          // Check if we've reached the end of the day
          if (currentTime.getTime() + (focusBlockDuration * 60 * 1000) > dayEnd.getTime()) {
            break;
          }

          // Calculate end time for this block
          const blockEnd = new Date(currentTime.getTime() + (focusBlockDuration * 60 * 1000));

          // Create the time block
          const timeBlock: Omit<TimeBlock, 'id'> = {
            name: `Focus: ${task.title}`,
            description: `Work on: ${task.description || task.title}`,
            start: new Date(currentTime),
            end: new Date(blockEnd),
            color: '#673AB7', // Deep purple
            priority: (task.priority?.toLowerCase() as 'high' | 'medium' | 'low') || 'medium',
            focusMode: true,
            recurring: false,
            tags: ['focus', 'work'],
            tasks: [task.id]
          };

          const timeBlockId = get().addTimeBlock(timeBlock);
          timeBlockIds.push(timeBlockId);

          // Add break after the focus block
          currentTime = new Date(blockEnd.getTime() + (breakDuration * 60 * 1000));
        }

        return timeBlockIds;
      },

      addTag: (tag) => {
        const id = uuidv4();
        set((state) => ({
          tags: [...state.tags, { ...tag, id }]
        }));
        return id;
      },

      updateTag: (id, updates) => {
        set((state) => ({
          tags: state.tags.map(tag =>
            tag.id === id ? { ...tag, ...updates } : tag
          )
        }));
      },

      deleteTag: (id) => {
        set((state) => ({
          tags: state.tags.filter(tag => tag.id !== id)
        }));
      },

      setView: (view) => {
        set({ view });
      },

      setSelectedDate: (selectedDate) => {
        set({ selectedDate });
      },

      updateOverlaySettings: (settings) => {
        set((state) => ({
          overlaySettings: {
            ...state.overlaySettings,
            ...settings
          }
        }));
      },

      syncTasksToCalendar: () => {
        const taskStore = useTaskStore.getState();
        const calendarStore = get();

        // Get all tasks with due dates
        const tasksWithDueDates = taskStore.tasks.filter(task => task.dueDate);

        // Get existing task events
        const existingTaskEvents = calendarStore.events.filter(event => event.taskId);
        const existingTaskIds = new Set(existingTaskEvents.map(event => event.taskId));

        // Add events for new tasks
        for (const task of tasksWithDueDates) {
          if (!task?.dueDate) continue; // Add null check

          if (!existingTaskIds.has(task.id)) {
            const dueDate = new Date(task.dueDate);

            const taskPriorityTag = task.priority?.toLowerCase() === 'high' || task.priority?.toLowerCase() === 'urgent' ? 'urgent' : task.priority?.toLowerCase() || 'medium';

            const taskEvent: Omit<CalendarEvent, 'id'> = {
              title: task.title,
              description: task.description,
              start: dueDate,
              end: new Date(dueDate.getTime() + (60 * 60 * 1000)), // 1 hour duration
              allDay: false,
              sourceId: 'tasks',
              taskId: task.id,
              completed: task.completed,
              tags: [...(task.tags || []), taskPriorityTag]
            };

            calendarStore.addEvent(taskEvent);
          }
        }

        // Update existing task events
        for (const event of existingTaskEvents) {
          const task = taskStore.tasks.find(t => t.id === event.taskId);

          // If task exists, update the event
          if (task && task.dueDate) {
            const dueDate = new Date(task.dueDate);
            const taskPriorityTag = task.priority?.toLowerCase() === 'high' || task.priority?.toLowerCase() === 'urgent' ? 'urgent' : task.priority?.toLowerCase() || 'medium';

            calendarStore.updateEvent(event.id, {
              title: task.title,
              description: task.description,
              start: dueDate,
              end: new Date(dueDate.getTime() + (60 * 60 * 1000)),
              completed: task.completed,
              tags: [...(task.tags || []), taskPriorityTag]
            });
          } else {
            // If task doesn't exist anymore, delete the event
            calendarStore.deleteEvent(event.id);
          }
        }
      },

      syncAutomationsToCalendar: () => {
        try {
          const automationStore = useAutomationStore.getState();
          const calendarStore = get();

          // Get all scheduled automations
          const scheduledAutomations = automationStore.schedules;

          // Get existing automation events
          const existingAutomationEvents = calendarStore.events.filter(event => event.automationId);
          const existingAutomationIds = new Set(existingAutomationEvents.map(event => event.automationId));

          // Add events for new scheduled automations
          for (const schedule of scheduledAutomations) {
            if (!existingAutomationIds.has(schedule.id) && schedule.nextRun) {
              const workflow = (automationStore as any).workflows?.find((w: any) => w.id === schedule.workflowId);
              const title = workflow ? workflow.name : schedule.name;

              const automationEvent: Omit<CalendarEvent, 'id'> = {
                title: `⚙️ ${title}`,
                description: schedule.description,
                start: new Date(schedule.nextRun),
                end: new Date(new Date(schedule.nextRun).getTime() + (30 * 60 * 1000)), // 30 min duration
                allDay: false,
                sourceId: 'automation',
                automationId: schedule.id,
                tags: ['automation']
              };

              calendarStore.addEvent(automationEvent);
            }
          }

          // Update existing automation events
          for (const event of existingAutomationEvents) {
            const schedule = scheduledAutomations.find(s => s.id === event.automationId);

            // If schedule exists and has a next run date, update the event
            if (schedule && schedule.nextRun) {
              const workflow = (automationStore as any).workflows?.find((w: any) => w.id === schedule.workflowId);
              const title = workflow ? workflow.name : schedule.name;

              calendarStore.updateEvent(event.id, {
                title: `⚙️ ${title}`,
                description: schedule.description,
                start: new Date(schedule.nextRun),
                end: new Date(new Date(schedule.nextRun).getTime() + (30 * 60 * 1000))
              });
            } else {
              // If schedule doesn't exist anymore or doesn't have a next run, delete the event
              calendarStore.deleteEvent(event.id);
            }
          }
        } catch (error) {
          console.error("Error syncing automations to calendar:", error);
        }
      }
    }),
    {
      name: 'calendar-storage'
    }
  )
);