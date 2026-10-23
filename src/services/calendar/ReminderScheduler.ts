import { EventReminder } from './EmailEventAnalyzer';
import { addMinutes, differenceInMinutes, format } from 'date-fns';

export interface ScheduledReminder extends EventReminder {
  scheduledTime: Date;
  isActive: boolean;
  isTriggered: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReminderNotification {
  id: string;
  title: string;
  message: string;
  type: 'popup' | 'email' | 'sms' | 'desktop';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  actionLabel?: string;
  eventId?: string;
  taskId?: string;
  reminderData: EventReminder;
}

export type ReminderHandler = (notification: ReminderNotification) => Promise<void>;

export class ReminderScheduler {
  private reminders: Map<string, ScheduledReminder> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private handlers: Map<string, ReminderHandler> = new Map();
  private isRunning = false;
  private checkInterval = 60000; // Check every minute

  constructor() {
    this.loadReminders();
    this.startScheduler();
  }

  async scheduleReminder(reminder: EventReminder, eventId?: string, taskId?: string): Promise<string> {
    const scheduledReminder: ScheduledReminder = {
      ...reminder,
      eventId,
      taskId,
      scheduledTime: reminder.targetDate || new Date(),
      isActive: true,
      isTriggered: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.reminders.set(reminder.id, scheduledReminder);
    this.scheduleTimer(scheduledReminder);
    await this.saveReminders();

    console.log(`Scheduled ${reminder.type} reminder for ${format(scheduledReminder.scheduledTime, 'MMM dd, yyyy \'at\' h:mm a')}`);
    
    return reminder.id;
  }

  async cancelReminder(reminderId: string): Promise<void> {
    const reminder = this.reminders.get(reminderId);
    if (reminder) {
      reminder.isActive = false;
      reminder.updatedAt = new Date();
    }

    // Clear any existing timer
    const timer = this.timers.get(reminderId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(reminderId);
    }

    this.reminders.delete(reminderId);
    await this.saveReminders();
  }

  async updateReminder(reminderId: string, updates: Partial<EventReminder>): Promise<void> {
    const reminder = this.reminders.get(reminderId);
    if (!reminder) {
      throw new Error(`Reminder ${reminderId} not found`);
    }

    // Update the reminder
    Object.assign(reminder, updates);
    reminder.updatedAt = new Date();

    // Reschedule if timing changed
    if (updates.targetDate || updates.offset || updates.timing) {
      this.clearTimer(reminderId);
      this.scheduleTimer(reminder);
    }

    await this.saveReminders();
  }

  registerHandler(type: string, handler: ReminderHandler): void {
    this.handlers.set(type, handler);
  }

  getActiveReminders(): ScheduledReminder[] {
    return Array.from(this.reminders.values()).filter(r => r.isActive && !r.isTriggered);
  }

  getUpcomingReminders(hours: number = 24): ScheduledReminder[] {
    const cutoff = addMinutes(new Date(), hours * 60);
    return this.getActiveReminders().filter(r => r.scheduledTime <= cutoff);
  }

  private scheduleTimer(reminder: ScheduledReminder): void {
    const now = new Date();
    const delay = Math.max(0, differenceInMinutes(reminder.scheduledTime, now) * 60 * 1000);

    if (delay === 0) {
      // Trigger immediately if past due
      this.triggerReminder(reminder);
    } else {
      const timer = setTimeout(() => {
        this.triggerReminder(reminder);
      }, delay);

      this.timers.set(reminder.id, timer);
    }
  }

  private clearTimer(reminderId: string): void {
    const timer = this.timers.get(reminderId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(reminderId);
    }
  }

  private async triggerReminder(reminder: ScheduledReminder): Promise<void> {
    if (!reminder.isActive || reminder.isTriggered) {
      return;
    }

    try {
      // Mark as triggered
      reminder.isTriggered = true;
      reminder.updatedAt = new Date();

      // Create notification
      const notification: ReminderNotification = {
        id: `notification-${reminder.id}`,
        title: this.generateReminderTitle(reminder),
        message: reminder.message,
        type: reminder.type,
        priority: this.determinePriority(reminder),
        eventId: reminder.eventId,
        taskId: reminder.taskId,
        reminderData: reminder,
        actionUrl: reminder.actionUrl,
        actionLabel: reminder.actionLabel || 'View Details'
      };

      // Get handler for reminder type
      const handler = this.handlers.get(reminder.type);
      if (handler) {
        await handler(notification);
      } else {
        console.warn(`No handler registered for reminder type: ${reminder.type}`);
        // Fallback to popup if no specific handler
        const popupHandler = this.handlers.get('popup');
        if (popupHandler) {
          await popupHandler({ ...notification, type: 'popup' });
        }
      }

      // Clean up timer
      this.timers.delete(reminder.id);
      
      // Save state
      await this.saveReminders();

      console.log(`Triggered ${reminder.type} reminder: ${reminder.message}`);
    } catch (error) {
      console.error('Failed to trigger reminder:', error);
      // Reset triggered state to retry later
      reminder.isTriggered = false;
    }
  }

  private generateReminderTitle(reminder: ScheduledReminder): string {
    const baseTitle = reminder.taskId ? 'Task Reminder' : 'Event Reminder';
    
    if (reminder.timing === 'before') {
      const minutes = reminder.offset;
      if (minutes < 60) {
        return `${baseTitle} (${minutes} minutes)`;
      } else if (minutes < 1440) {
        const hours = Math.floor(minutes / 60);
        return `${baseTitle} (${hours} hour${hours > 1 ? 's' : ''})`;
      } else {
        const days = Math.floor(minutes / 1440);
        return `${baseTitle} (${days} day${days > 1 ? 's' : ''})`;
      }
    }
    
    return baseTitle;
  }

  private determinePriority(reminder: ScheduledReminder): 'low' | 'medium' | 'high' | 'urgent' {
    // Determine priority based on timing and type
    if (reminder.offset <= 15) return 'urgent';
    if (reminder.offset <= 60) return 'high';
    if (reminder.offset <= 1440) return 'medium';
    return 'low';
  }

  private startScheduler(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    
    const checkReminders = () => {
      const now = new Date();
      
      for (const [id, reminder] of this.reminders.entries()) {
        if (!reminder.isActive || reminder.isTriggered) continue;
        
        // Check if reminder should be triggered
        if (reminder.scheduledTime <= now && !this.timers.has(id)) {
          this.triggerReminder(reminder);
        }
      }
    };

    // Initial check
    checkReminders();
    
    // Set up interval
    setInterval(checkReminders, this.checkInterval);
  }

  private async loadReminders(): Promise<void> {
    try {
      const stored = localStorage.getItem('scheduledReminders');
      if (stored) {
        const data = JSON.parse(stored);
        for (const [id, reminderData] of Object.entries(data)) {
          const reminder = reminderData as any;
          // Convert date strings back to Date objects
          reminder.scheduledTime = new Date(reminder.scheduledTime);
          reminder.createdAt = new Date(reminder.createdAt);
          reminder.updatedAt = new Date(reminder.updatedAt);
          if (reminder.targetDate) {
            reminder.targetDate = new Date(reminder.targetDate);
          }
          
          this.reminders.set(id, reminder);
          
          // Reschedule active reminders
          if (reminder.isActive && !reminder.isTriggered) {
            this.scheduleTimer(reminder);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load reminders:', error);
    }
  }

  private async saveReminders(): Promise<void> {
    try {
      const data = Object.fromEntries(this.reminders.entries());
      localStorage.setItem('scheduledReminders', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save reminders:', error);
    }
  }

  // Public methods for testing and debugging
  getSchedulerStatus(): {
    isRunning: boolean;
    activeReminders: number;
    scheduledTimers: number;
    upcomingCount: number;
  } {
    return {
      isRunning: this.isRunning,
      activeReminders: this.getActiveReminders().length,
      scheduledTimers: this.timers.size,
      upcomingCount: this.getUpcomingReminders().length
    };
  }

  clearAllReminders(): void {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    
    // Clear data
    this.timers.clear();
    this.reminders.clear();
    
    // Clear storage
    localStorage.removeItem('scheduledReminders');
  }

  // Utility method to create common reminder patterns
  createReminderPattern(
    baseReminder: Omit<EventReminder, 'id'>,
    patterns: Array<{ offset: number; type?: string; message?: string }>
  ): EventReminder[] {
    return patterns.map((pattern, index) => ({
      ...baseReminder,
      id: `${baseReminder.eventId || 'reminder'}-${index}`,
      offset: pattern.offset,
      type: pattern.type || baseReminder.type,
      message: pattern.message || baseReminder.message
    }));
  }
}
