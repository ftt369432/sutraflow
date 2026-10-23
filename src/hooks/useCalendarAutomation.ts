import { useState, useEffect, useCallback } from 'react';
import { useCalendarStore } from '../store/calendarStore';
import { useTaskStore } from '../store/taskStore';
import { useAutomationStore } from '../store/automationStore';
import { useWorkflowStore } from '../store/workflowStore';
import { v4 as uuidv4 } from 'uuid';
import { addMinutes, parseISO, format, startOfDay, addHours, isBefore } from 'date-fns';

/**
 * Hook that provides functionality for integrating calendar with automations
 */
export function useCalendarAutomation() {
  const { 
    events, 
    addTimeBlock, 
    syncTasksToCalendar, 
    syncAutomationsToCalendar,
    timeBlocks
  } = useCalendarStore();
  
  const { 
    tasks, 
    getTasksForTimeBlock, 
    getTaskStats,
    getTaskById,
    updateTask
  } = useTaskStore();
  
  const { 
    triggers, 
    schedules, 
    calculateNextRun
  } = useAutomationStore();
  
  const { 
    workflows
  } = useWorkflowStore();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  interface SchedulingPreferences {
    startTime: string;
    endTime: string;
    breakDuration: number;
    focusBlockDuration: number;
    lunchBreak: boolean;
    lunchTime: string;
    lunchDuration: number;
    prioritizeMornings: boolean;
    bufferBetweenMeetings: number;
    energyLevel: number;
  }

  interface TimeBlock {
    id: string;
    title: string;
    start: string;
    end: string;
    type: string;
    description?: string;
    taskIds?: string[];
  }
  
  /**
   * Generate AI-powered time blocks for specified date range
   */
  const generateTimeBlocksForRange = useCallback(async (startDate: Date, endDate: Date, preferences = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get all tasks that need time blocks in this date range
      const relevantTasks = tasks.filter(task => 
        !task.completed && 
        task.status !== 'cancelled' &&
        task.dueDate && 
        new Date(task.dueDate) >= startDate &&
        new Date(task.dueDate) <= endDate
      );
      
      if (relevantTasks.length === 0) {
        return [];
      }
      
      // Generate time blocks for each day in the range
      const timeBlockIds: string[] = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const tasksForDay = relevantTasks.filter(task => {
          const dueDate = new Date(task.dueDate as Date);
          return dueDate.toDateString() === currentDate.toDateString();
        });
        
        if (tasksForDay.length > 0) {
          const ids = await generateTimeBlocksForDay(currentDate, tasksForDay.map(t => t.id), preferences);
          timeBlockIds.push(...ids);
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return timeBlockIds;
    } catch (error) {
      console.error('Error generating time blocks for range:', error);
      setError('Failed to generate time blocks');
      return [];
    } finally {
      setLoading(false);
    }
  }, [tasks]);
  
  /**
   * Generate time blocks for a specific day
   */
  const generateTimeBlocksForDay = useCallback(async (
    date: Date, 
    preferences: SchedulingPreferences
  ): Promise<TimeBlock[]> => {
    const dayStart = startOfDay(date);
    const workStart = new Date(dayStart);
    const [startHours, startMinutes] = preferences.startTime.split(':').map(Number);
    workStart.setHours(startHours, startMinutes, 0, 0);
    
    const workEnd = new Date(dayStart);
    const [endHours, endMinutes] = preferences.endTime.split(':').map(Number);
    workEnd.setHours(endHours, endMinutes, 0, 0);
    
    // Get existing events for this day to avoid conflicts
    const existingEvents = events.filter(event => {
      const eventDate = parseISO(event.start);
      return eventDate.getDate() === date.getDate() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear();
    });
    
    // Find available time slots
    const busySlots = existingEvents.map(event => ({
      start: parseISO(event.start),
      end: parseISO(event.end)
    }));
    
    // Add lunch break if enabled
    if (preferences.lunchBreak) {
      const lunchStart = new Date(dayStart);
      const [lunchHours, lunchMinutes] = preferences.lunchTime.split(':').map(Number);
      lunchStart.setHours(lunchHours, lunchMinutes, 0, 0);
      
      const lunchEnd = addMinutes(lunchStart, preferences.lunchDuration);
      
      busySlots.push({
        start: lunchStart,
        end: lunchEnd
      });
    }
    
    // Sort busy slots by start time
    busySlots.sort((a, b) => a.start.getTime() - b.start.getTime());
    
    // Find free slots
    const freeSlots: { start: Date; end: Date }[] = [];
    let currentTime = new Date(workStart);
    
    for (const busySlot of busySlots) {
      if (isBefore(currentTime, busySlot.start)) {
        // If we have at least 30 minutes before the busy slot, add a free slot
        if (busySlot.start.getTime() - currentTime.getTime() >= 30 * 60 * 1000) {
          freeSlots.push({
            start: new Date(currentTime),
            end: new Date(busySlot.start)
          });
        }
      }
      // Move current time to the end of the busy slot
      currentTime = new Date(Math.max(currentTime.getTime(), busySlot.end.getTime()));
    }
    
    // Add a final free slot if there's time after the last busy slot
    if (isBefore(currentTime, workEnd)) {
      freeSlots.push({
        start: new Date(currentTime),
        end: new Date(workEnd)
      });
    }
    
    // Create focus blocks in the free slots
    const focusBlocks: TimeBlock[] = [];
    
    // Sort tasks by priority and deadline
    const incompleteTasks = tasks.filter(task => 
      !task.completed && 
      (!task.dueDate || isBefore(parseISO(task.dueDate), addHours(new Date(), 48)))
    ).sort((a, b) => {
      // First sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = (priorityOrder as any)[a.priority || 'medium'] - 
                           (priorityOrder as any)[b.priority || 'medium'];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then sort by due date
      if (a.dueDate && b.dueDate) {
        return parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime();
      }
      
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      
      return 0;
    });
    
    // If prioritize mornings is enabled, sort free slots to put morning slots first
    if (preferences.prioritizeMornings) {
      freeSlots.sort((a, b) => {
        const aHour = a.start.getHours();
        const bHour = b.start.getHours();
        
        if (aHour < 12 && bHour >= 12) return -1;
        if (aHour >= 12 && bHour < 12) return 1;
        
        return a.start.getTime() - b.start.getTime();
      });
    }
    
    // Create time blocks
    for (const slot of freeSlots) {
      let currentSlotTime = new Date(slot.start);
      let taskIndex = 0;
      
      while (isBefore(addMinutes(currentSlotTime, preferences.focusBlockDuration), slot.end) && 
             taskIndex < incompleteTasks.length) {
        const blockEnd = addMinutes(currentSlotTime, preferences.focusBlockDuration);
        
        // Assign tasks to the block
        const assignedTaskIds: string[] = [];
        const tasksForBlock = [];
        
        // Add the highest priority task
        const primaryTask = incompleteTasks[taskIndex];
        assignedTaskIds.push(primaryTask.id);
        tasksForBlock.push(primaryTask.title);
        taskIndex++;
        
        // Create the time block
        const block: TimeBlock = {
          id: uuidv4(),
          title: `Deep Work: ${tasksForBlock.join(', ')}`,
          start: currentSlotTime.toISOString(),
          end: blockEnd.toISOString(),
          type: 'deep-work',
          description: `Focus time for: ${tasksForBlock.join(', ')}`,
          taskIds: assignedTaskIds
        };
        
        focusBlocks.push(block);
        
        // Add break time if not the last block
        if (isBefore(addMinutes(blockEnd, preferences.breakDuration), slot.end)) {
          currentSlotTime = addMinutes(blockEnd, preferences.breakDuration);
        } else {
          break;
        }
      }
    }
    
    // Save the generated blocks to the store
    for (const block of focusBlocks) {
      addTimeBlock(block);
    }
    
    return focusBlocks;
  }, [addTimeBlock, events, tasks]);
  
  /**
   * Check for scheduling conflicts
   */
  const checkSchedulingConflicts = useCallback((date: Date) => {
    const { getEventsByDateRange } = useCalendarStore.getState();
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const eventsOnDay = getEventsByDateRange(startOfDay, endOfDay);
    
    // Group events by time to find overlaps
    const timeSlots: Record<string, { count: number, events: any[] }> = {};
    
    eventsOnDay.forEach(event => {
      const startTime = new Date(event.start).getTime();
      const endTime = new Date(event.end).getTime();
      
      // Create a slot for every 15 minute increment in the event's time range
      for (let time = startTime; time < endTime; time += 15 * 60 * 1000) {
        const slotKey = Math.floor(time / (15 * 60 * 1000)).toString();
        
        if (!timeSlots[slotKey]) {
          timeSlots[slotKey] = { count: 0, events: [] };
        }
        
        timeSlots[slotKey].count++;
        timeSlots[slotKey].events.push(event);
      }
    });
    
    // Find slots with conflicts (more than one event)
    const conflicts = Object.entries(timeSlots)
      .filter(([_, { count }]) => count > 1)
      .map(([time, { events }]) => ({
        time: new Date(parseInt(time) * 15 * 60 * 1000),
        events
      }));
    
    return conflicts;
  }, []);
  
  /**
   * Create a recurring schedule for time blocking
   */
  const scheduleRecurringTimeBlocks = useCallback((params: {
    frequency: 'daily' | 'weekly' | 'monthly',
    interval: number,
    preferences?: object,
    startDate?: Date,
    daysOfWeek?: number[]
  }) => {
    const { addSchedule } = useAutomationStore.getState();
    const now = new Date();
    
    const scheduleId = addSchedule({
      workflowId: 'time-blocking',
      name: 'Regular Time Blocking',
      description: 'Automatically create time blocks for tasks',
      type: 'recurring',
      startDate: params.startDate || now,
      enabled: true,
      recurrence: {
        frequency: params.frequency,
        interval: params.interval,
        daysOfWeek: params.daysOfWeek
      }
    });
    
    return scheduleId;
  }, []);
  
  /**
   * Sync all calendar data
   */
  const syncAll = useCallback(async () => {
    setLoading(true);
    
    try {
      await syncTasksToCalendar();
      await syncAutomationsToCalendar();
    } catch (error) {
      console.error('Error syncing calendar data:', error);
      setError('Failed to sync calendar data');
    } finally {
      setLoading(false);
    }
  }, [syncTasksToCalendar, syncAutomationsToCalendar]);
  
  // Generate a customized schedule based on energy levels and task types
  const generateOptimalSchedule = useCallback(async (
    date: Date,
    energyLevel: number, // 0-100
    preferences: SchedulingPreferences
  ): Promise<TimeBlock[]> => {
    // Clone the preferences to modify based on energy level
    const modifiedPreferences = { ...preferences };
    
    // Adjust focus time based on energy level
    if (energyLevel < 30) {
      // Low energy: shorter focus blocks, more frequent breaks
      modifiedPreferences.focusBlockDuration = Math.min(preferences.focusBlockDuration, 25);
      modifiedPreferences.breakDuration = Math.max(preferences.breakDuration, 15);
    } else if (energyLevel < 70) {
      // Medium energy: moderate adjustments
      modifiedPreferences.focusBlockDuration = Math.min(preferences.focusBlockDuration, 50);
    } else {
      // High energy: longer focus blocks if desired
      if (preferences.focusBlockDuration < 90) {
        modifiedPreferences.focusBlockDuration = 90;
      }
    }
    
    return generateTimeBlocksForDay(date, modifiedPreferences);
  }, [generateTimeBlocksForDay]);
  
  return {
    generateTimeBlocksForRange,
    generateTimeBlocksForDay,
    checkSchedulingConflicts,
    scheduleRecurringTimeBlocks,
    syncAll,
    generateOptimalSchedule,
    loading,
    error
  };
} 