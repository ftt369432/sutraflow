import { v4 as uuidv4 } from 'uuid';
import { getEnv } from '../../config/env';
import { EmailAnalysis } from '../email';
import { GoogleAPIClient } from '../google/GoogleAPIClient';
import googleAuthService from '../auth/googleAuth';

// Enhanced Task types with Google Tasks integration
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  tags: string[];
  sourceEmail?: {
    messageId: string;
    accountId: string;
    subject: string;
    sender: string;
    receivedAt: Date;
  };
  recurrence?: {
    pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number; // e.g., every 2 weeks
    endDate?: Date;
  };
  relatedCalendarEventId?: string;

  // Google Tasks integration
  source: 'google' | 'custom' | 'hybrid';
  googleTaskId?: string;
  relatedEventId?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;

  // Legal-specific metadata
  metadata?: {
    caseNumber?: string;
    hearingType?: string;
    clientName?: string;
    urgencyLevel?: 'routine' | 'urgent' | 'critical';
    source?: 'auto' | 'manual' | 'email';
  };
}

// Google Tasks API interface
export interface GoogleTaskItem {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string; // RFC 3339 timestamp
  updated: string;
  parent?: string;
  position?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date;
  estimatedMinutes?: number;
  relatedEventId?: string;
  metadata?: Task['metadata'];
  tags?: string[];
}

export interface TaskFilter {
  status?: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date | null;
  dueDateCompare?: 'before' | 'after' | 'on' | 'today' | 'tomorrow' | 'this_week' | 'next_week';
  tags?: string[];
  title?: string;
  sourceEmailId?: string;
}

/**
 * Service for managing tasks
 */
export class TaskService {
  private tasks: Task[] = [];
  private storageKey = 'genieflow_tasks';
  private googleClient: GoogleAPIClient;

  constructor() {
    this.googleClient = GoogleAPIClient.getInstance();
    this.loadTasksFromStorage();
    console.log(`TaskService initialized with ${this.tasks.length} tasks`);
  }

  /**
   * Load tasks from local storage
   */
  private loadTasksFromStorage(): void {
    const { useMock } = getEnv();

    try {
      const tasksJson = localStorage.getItem(this.storageKey);
      if (tasksJson) {
        const parsedTasks = JSON.parse(tasksJson);

        // Convert date strings back to Date objects
        this.tasks = parsedTasks.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          sourceEmail: task.sourceEmail ? {
            ...task.sourceEmail,
            receivedAt: new Date(task.sourceEmail.receivedAt)
          } : undefined,
          recurrence: task.recurrence ? {
            ...task.recurrence,
            endDate: task.recurrence.endDate ? new Date(task.recurrence.endDate) : undefined
          } : undefined
        }));
      } else if (useMock) {
        this.initializeMockTasks();
      }
    } catch (error) {
      console.error('Failed to load tasks from storage:', error);
      if (useMock) {
        this.initializeMockTasks();
      }
    }
  }

  /**
   * Save tasks to local storage
   */
  private saveTasksToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
    } catch (error) {
      console.error('Failed to save tasks to storage:', error);
    }
  }

  /**
   * Initialize with mock tasks
   */
  private initializeMockTasks(): void {
    const now = new Date();

    this.tasks = [
      {
        id: uuidv4(),
        title: 'File DOR - Garcia vs. RetailCo',
        description: 'File Declaration of Readiness to Proceed for MSC. Issues: PD, Future Medical.',
        status: 'todo',
        priority: 'high',
        dueDate: new Date(now.getTime() + 86400000 * 2), // 2 days
        createdAt: now,
        updatedAt: now,
        tags: ['legal', 'filing', 'urgent'],
        source: 'custom',
        metadata: {
          caseNumber: 'ADJ9876543',
          clientName: 'Juan Garcia',
          urgencyLevel: 'urgent'
        }
      },
      {
        id: uuidv4(),
        title: 'Draft Defense Letter to Dr. Smith',
        description: 'Draft letter clarifying job duties and requesting supplemental report regarding apportionment.',
        status: 'in_progress',
        priority: 'medium',
        dueDate: new Date(now.getTime() + 86400000 * 5), // 5 days
        createdAt: new Date(now.getTime() - 86400000), // Yesterday
        updatedAt: now,
        tags: ['legal', 'correspondence'],
        source: 'custom',
        metadata: {
          caseNumber: 'ADJ1234567',
          clientName: 'TechCorp'
        }
      },
      {
        id: uuidv4(),
        title: 'Schedule Deposition - Applicant',
        description: 'Coordinate with opposing counsel to schedule applicant deposition. Prefer dates in next 30 days.',
        status: 'todo',
        priority: 'medium',
        dueDate: new Date(now.getTime() + 86400000 * 7), // 1 week
        createdAt: new Date(now.getTime() - 86400000 * 2), // 2 days ago
        updatedAt: now,
        tags: ['legal', 'scheduling', 'deposition'],
        source: 'custom'
      },
      {
        id: uuidv4(),
        title: 'Review QME Report - Dr. Jones',
        description: 'Review QME report for rating instructions. Check for substantial medical evidence.',
        status: 'done',
        priority: 'high',
        createdAt: new Date(now.getTime() - 86400000 * 5), // 5 days ago
        updatedAt: new Date(now.getTime() - 86400000), // Yesterday
        completedAt: new Date(now.getTime() - 86400000), // Yesterday
        tags: ['legal', 'review', 'medical'],
        source: 'custom'
      }
    ];

    this.saveTasksToStorage();
  }

  /**
   * Get all tasks, optionally filtered
   */
  public async getTasks(filter?: TaskFilter): Promise<Task[]> {
    await this.simulateNetworkDelay();

    let filteredTasks = [...this.tasks];

    if (filter) {
      if (filter.status) {
        filteredTasks = filteredTasks.filter(task => task.status === filter.status);
      }

      if (filter.priority) {
        filteredTasks = filteredTasks.filter(task => task.priority === filter.priority);
      }

      if (filter.title) {
        const titleLower = filter.title.toLowerCase();
        filteredTasks = filteredTasks.filter(
          task => task.title.toLowerCase().includes(titleLower)
        );
      }

      if (filter.tags && filter.tags.length > 0) {
        filteredTasks = filteredTasks.filter(
          task => filter.tags!.some(tag => task.tags.includes(tag))
        );
      }

      if (filter.sourceEmailId) {
        filteredTasks = filteredTasks.filter(
          task => task.sourceEmail?.messageId === filter.sourceEmailId
        );
      }

      if (filter.dueDate || filter.dueDateCompare) {
        filteredTasks = this.filterByDueDate(filteredTasks, filter);
      }
    }

    // Sort by priority first, then by due date if present
    return filteredTasks.sort((a, b) => {
      // Sort by priority (high -> medium -> low)
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];

      if (priorityDiff !== 0) return priorityDiff;

      // Then sort by due date (if present)
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      } else if (a.dueDate) {
        return -1; // a comes first (has due date)
      } else if (b.dueDate) {
        return 1; // b comes first (has due date)
      }

      // Finally sort by creation date (newest first)
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  /**
   * Helper method to filter tasks by due date
   */
  private filterByDueDate(tasks: Task[], filter: TaskFilter): Task[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Start of this week (assuming Sunday as the first day)
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());

    // End of next week
    const nextWeekEnd = new Date(thisWeekStart);
    nextWeekEnd.setDate(thisWeekStart.getDate() + 14);

    return tasks.filter(task => {
      if (!task.dueDate) {
        return filter.dueDate === null; // Only if explicitly filtering for null dates
      }

      const taskDueDate = new Date(task.dueDate);

      if (filter.dueDate) {
        const filterDate = new Date(filter.dueDate);

        switch (filter.dueDateCompare) {
          case 'before': {
            return taskDueDate < filterDate;
          }
          case 'after': {
            return taskDueDate > filterDate;
          }
          case 'on': {
            return taskDueDate.getFullYear() === filterDate.getFullYear() &&
              taskDueDate.getMonth() === filterDate.getMonth() &&
              taskDueDate.getDate() === filterDate.getDate();
          }
          default: {
            return true;
          }
        }
      } else if (filter.dueDateCompare) {
        switch (filter.dueDateCompare) {
          case 'today': {
            return taskDueDate >= today && taskDueDate < tomorrow;
          }
          case 'tomorrow': {
            const dayAfter = new Date(tomorrow);
            dayAfter.setDate(dayAfter.getDate() + 1);
            return taskDueDate >= tomorrow && taskDueDate < dayAfter;
          }
          case 'this_week': {
            const thisWeekEnd = new Date(thisWeekStart);
            thisWeekEnd.setDate(thisWeekStart.getDate() + 7);
            return taskDueDate >= thisWeekStart && taskDueDate < thisWeekEnd;
          }
          case 'next_week': {
            return taskDueDate >= nextWeekEnd && taskDueDate < new Date(nextWeekEnd.getTime() + 7 * 24 * 60 * 60 * 1000);
          }
          default: {
            return true;
          }
        }
      }
      return true;
    });
  }

  /**
   * Get a single task by ID
   */
  public async getTask(id: string): Promise<Task | null> {
    await this.simulateNetworkDelay();
    return this.tasks.find(task => task.id === id) || null;
  }

  /**
   * Create a new task
   */
  public async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    await this.simulateNetworkDelay();

    const newTask: Task = {
      id: uuidv4(),
      source: 'custom', // Default to custom
      ...taskData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.tasks.push(newTask);
    this.saveTasksToStorage();

    return newTask;
  }

  /**
   * Update an existing task
   */
  public async updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Task | null> {
    await this.simulateNetworkDelay();

    const taskIndex = this.tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) {
      return null;
    }

    const updatedTask = {
      ...this.tasks[taskIndex],
      ...updates,
      updatedAt: new Date()
    };

    this.tasks[taskIndex] = updatedTask;
    this.saveTasksToStorage();

    return updatedTask;
  }

  /**
   * Delete a task
   */
  public async deleteTask(id: string): Promise<boolean> {
    await this.simulateNetworkDelay();

    const initialLength = this.tasks.length;
    this.tasks = this.tasks.filter(task => task.id !== id);
    const wasDeleted = initialLength > this.tasks.length;

    if (wasDeleted) {
      this.saveTasksToStorage();
    }

    return wasDeleted;
  }

  /**
   * Extract tasks from email analysis
   */
  public async extractTasksFromEmail(emailAnalysis: EmailAnalysis, emailInfo: {
    messageId: string;
    accountId: string;
    subject: string;
    sender: string;
    receivedAt: Date;
  }): Promise<Task[]> {
    await this.simulateNetworkDelay();

    const extractedTasks: Task[] = [];
    const now = new Date();

    // Process action items from the analysis
    if (emailAnalysis.actionItems && emailAnalysis.actionItems.length > 0) {
      for (const actionItem of emailAnalysis.actionItems) {
        const newTask: Task = {
          id: uuidv4(),
          title: typeof actionItem === 'string' ? actionItem : actionItem.text || 'Task from email',
          description: `Task extracted from email: "${emailInfo.subject}"`,
          status: 'todo',
          priority: this.mapPriorityFromEmailAnalysis(emailAnalysis.priority),
          createdAt: now,
          updatedAt: now,
          tags: [emailAnalysis.category === 'personal' ? 'personal' : 'work'],
          source: 'custom', // Email-extracted tasks are custom by default
          sourceEmail: {
            messageId: emailInfo.messageId,
            accountId: emailInfo.accountId,
            subject: emailInfo.subject,
            sender: emailInfo.sender,
            receivedAt: emailInfo.receivedAt
          }
        };

        // Attempt to extract a due date
        const dueDate = this.extractDueDateFromText(typeof actionItem === 'string' ? actionItem : actionItem.text || '');
        if (dueDate) {
          newTask.dueDate = dueDate;
        }

        extractedTasks.push(newTask);
        this.tasks.push(newTask);
      }

      this.saveTasksToStorage();
    }

    // If there's a meeting in the email, create a task for meeting preparation
    if (emailAnalysis.meetingDetails) {
      const { eventDate, eventTime } = emailAnalysis.meetingDetails;

      let taskDueDate: Date | undefined = undefined;
      if (eventDate) {
        taskDueDate = this.extractDueDateFromText(`${eventDate} ${eventTime || ''}`);
      }

      let meetingTitle = `Prepare for meeting`;
      if (emailInfo.subject.toLowerCase().includes('meeting')) {
        meetingTitle = `Prepare for: ${emailInfo.subject}`;
      }

      const meetingTask: Task = {
        id: uuidv4(),
        title: meetingTitle,
        description: `Prepare for meeting ${eventDate ? `on ${eventDate}` : ''} ${eventTime ? `at ${eventTime}` : ''}`,
        status: 'todo',
        priority: 'medium',
        createdAt: now,
        updatedAt: now,
        tags: ['meeting', emailAnalysis.category === 'personal' ? 'personal' : 'work'],
        source: 'custom', // Meeting tasks are custom by default
        sourceEmail: {
          messageId: emailInfo.messageId,
          accountId: emailInfo.accountId,
          subject: emailInfo.subject,
          sender: emailInfo.sender,
          receivedAt: emailInfo.receivedAt
        }
      };

      // Set due date to 1 hour before meeting if date is available
      if (taskDueDate && !isNaN(taskDueDate.getTime())) {
        // Set due date to 1 hour before meeting
        taskDueDate.setHours(taskDueDate.getHours() - 1);
        meetingTask.dueDate = taskDueDate;
      }

      extractedTasks.push(meetingTask);
      this.tasks.push(meetingTask);
      this.saveTasksToStorage();
    }

    return extractedTasks;
  }

  /**
   * Extract a due date from text
   */
  private extractDueDateFromText(text: string): Date | undefined {
    const lowerText = text.toLowerCase();
    const now = new Date();

    // Check for common time phrases
    if (lowerText.includes('today')) {
      return new Date(now.setHours(17, 0, 0, 0)); // 5 PM today
    }

    if (lowerText.includes('tomorrow')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(17, 0, 0, 0); // 5 PM tomorrow
      return tomorrow;
    }

    if (lowerText.includes('this week') || lowerText.includes('by the end of the week')) {
      const endOfWeek = new Date(now);
      endOfWeek.setDate(endOfWeek.getDate() + (5 - endOfWeek.getDay())); // Friday
      endOfWeek.setHours(17, 0, 0, 0); // 5 PM
      return endOfWeek;
    }

    if (lowerText.includes('next week')) {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7); // 7 days later
      return nextWeek;
    }

    if (lowerText.includes('this month') || lowerText.includes('by the end of the month')) {
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endOfMonth.setHours(17, 0, 0, 0); // 5 PM
      return endOfMonth;
    }

    // Try to extract specific date patterns
    // Format: MM/DD/YYYY or MM-DD-YYYY
    const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
    const dateMatch = lowerText.match(datePattern);

    if (dateMatch) {
      const [_, month, day, year] = dateMatch;
      const fullYear = year.length === 2 ? 2000 + parseInt(year) : parseInt(year);
      return new Date(fullYear, parseInt(month) - 1, parseInt(day), 17, 0, 0, 0);
    }

    // Format: Month Day, Year or Month Day
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'];
    const monthPattern = new RegExp(`(${monthNames.join('|')})[\\s,]+(\\d{1,2})(?:[\\s,]+(\\d{4}))?`, 'i');
    const monthMatch = lowerText.match(monthPattern);

    if (monthMatch) {
      const [_, month, day, year] = monthMatch;
      const monthIndex = monthNames.findIndex(m => m.toLowerCase() === month.toLowerCase());
      if (monthIndex !== -1) {
        const fullYear = year ? parseInt(year) : now.getFullYear();
        return new Date(fullYear, monthIndex, parseInt(day), 17, 0, 0, 0);
      }
    }

    // Check for "in X days/weeks/months"
    const inTimePattern = /in\s+(\d+)\s+(day|days|week|weeks|month|months)/i;
    const inTimeMatch = lowerText.match(inTimePattern);

    if (inTimeMatch) {
      const [_, amount, unit] = inTimeMatch;
      const futureDate = new Date(now);

      if (unit.toLowerCase().includes('day')) {
        futureDate.setDate(futureDate.getDate() + parseInt(amount));
      } else if (unit.toLowerCase().includes('week')) {
        futureDate.setDate(futureDate.getDate() + (parseInt(amount) * 7));
      } else if (unit.toLowerCase().includes('month')) {
        futureDate.setMonth(futureDate.getMonth() + parseInt(amount));
      }

      futureDate.setHours(17, 0, 0, 0); // 5 PM
      return futureDate;
    }

    return undefined;
  }

  /**
   * Map email priority to task priority
   */
  private mapPriorityFromEmailAnalysis(emailPriority: string): 'low' | 'medium' | 'high' {
    switch (emailPriority) {
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return 'medium';
    }
  }

  /**
   * Add tags to a task
   */
  public async addTagsToTask(taskId: string, tags: string[]): Promise<Task | null> {
    const task = await this.getTask(taskId);
    if (!task) return null;

    // Filter out duplicates and add new tags
    const uniqueTags = [...new Set([...task.tags, ...tags])];

    return this.updateTask(taskId, { tags: uniqueTags });
  }

  /**
   * Create recurring copies of a task
   */
  public async createRecurringTask(taskId: string, recurrence: Task['recurrence']): Promise<Task | null> {
    const originalTask = await this.getTask(taskId);
    if (!originalTask) return null;

    // Add recurrence to the original task
    const updatedTask = await this.updateTask(taskId, { recurrence });
    return updatedTask;
  }

  /**
   * Helper to simulate network delay
   */
  private async simulateNetworkDelay(min: number = 100, max: number = 300): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Google Tasks Integration Methods

  /**
   * Create a task in Google Tasks only
   */
  public async createGoogleTask(request: CreateTaskRequest): Promise<Task> {
    try {
      if (!googleAuthService.isSignedIn()) {
        throw new Error('Google authentication required for Google Tasks');
      }

      const googleTask: Partial<GoogleTaskItem> = {
        title: request.title,
        notes: request.description,
        due: request.dueDate?.toISOString(),
      };

      // GEMINI-ONLY MODE: Google Tasks API disabled
      console.log('TaskService: Google Tasks API disabled in Gemini-only mode');
      const createdGoogleTask = null; // Disabled Google Tasks creation
      // const createdGoogleTask = await this.googleClient.request<GoogleTaskItem>(
      //   'https://www.googleapis.com/tasks/v1/lists/@default/tasks',
      //   {
      //     method: 'POST',
      //     body: JSON.stringify(googleTask),
      //   }
      // );

      // Create corresponding local task
      const task: Task = {
        id: uuidv4(),
        title: request.title,
        description: request.description,
        status: 'todo',
        priority: request.priority || 'medium',
        dueDate: request.dueDate,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: request.tags || [],
        relatedEventId: request.relatedEventId,
        estimatedMinutes: request.estimatedMinutes,
        source: 'google',
        googleTaskId: createdGoogleTask.id,
        metadata: request.metadata,
      };

      this.tasks.push(task);
      this.saveTasksToStorage();

      return task;
    } catch (error) {
      console.error('Failed to create Google task:', error);
      throw new Error('Failed to create Google task');
    }
  }

  /**
   * Create a task in our custom system only
   */
  public async createCustomTask(request: CreateTaskRequest): Promise<Task> {
    const task: Task = {
      id: uuidv4(),
      title: request.title,
      description: request.description,
      status: 'todo',
      priority: request.priority || 'medium',
      dueDate: request.dueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: request.tags || [],
      relatedEventId: request.relatedEventId,
      estimatedMinutes: request.estimatedMinutes,
      source: 'custom',
      metadata: request.metadata,
    };

    this.tasks.push(task);
    this.saveTasksToStorage();

    return task;
  }

  /**
   * Create a task in both Google Tasks and our custom system (hybrid)
   */
  public async createHybridTask(request: CreateTaskRequest): Promise<Task> {
    try {
      // First create the custom task
      const customTask = await this.createCustomTask({
        ...request,
        metadata: { ...request.metadata, source: 'hybrid' }
      });

      // Then try to sync to Google Tasks
      if (googleAuthService.isSignedIn()) {
        try {
          const googleTask: Partial<GoogleTaskItem> = {
            title: request.title,
            notes: request.description || `Case: ${request.metadata?.caseNumber || 'N/A'}`,
            due: request.dueDate?.toISOString(),
          };

          // GEMINI-ONLY MODE: Google Tasks API disabled
          console.log('TaskService: Google Tasks API disabled in Gemini-only mode');
          const createdGoogleTask = null; // Disabled Google Tasks creation
          // const createdGoogleTask = await this.googleClient.request<GoogleTaskItem>(
          //   'https://www.googleapis.com/tasks/v1/lists/@default/tasks',
          //   {
          //     method: 'POST',
          //     body: JSON.stringify(googleTask),
          //   }
          // );

          // Update the custom task with Google Task ID
          const taskIndex = this.tasks.findIndex(t => t.id === customTask.id);
          if (taskIndex !== -1) {
            this.tasks[taskIndex].googleTaskId = createdGoogleTask.id;
            this.tasks[taskIndex].source = 'hybrid';
            this.saveTasksToStorage();
          }

        } catch (googleError) {
          console.warn('Failed to sync to Google Tasks, keeping as custom task:', googleError);
          // Task is still created locally even if Google sync fails
        }
      }

      return customTask;
    } catch (error) {
      console.error('Failed to create hybrid task:', error);
      throw new Error('Failed to create task');
    }
  }

  /**
   * Get tasks for a specific event
   */
  public async getTasksForEvent(eventId: string): Promise<Task[]> {
    await this.simulateNetworkDelay();
    return this.tasks.filter(task => task.relatedEventId === eventId);
  }

  /**
   * Toggle task status between todo and done
   */
  public async toggleTaskStatus(taskId: string): Promise<Task> {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const newStatus = task.status === 'done' ? 'todo' : 'done';
    const now = new Date();

    task.status = newStatus;
    task.updatedAt = now;

    if (newStatus === 'done') {
      task.completedAt = now;
    } else {
      task.completedAt = undefined;
    }

    // Sync status to Google Tasks if it's a hybrid or Google task
    if (task.googleTaskId && googleAuthService.isSignedIn()) {
      try {
        // GEMINI-ONLY MODE: Google Tasks API disabled
        console.log('TaskService: Google Tasks sync disabled in Gemini-only mode');
        // await this.googleClient.request(
        //   `https://www.googleapis.com/tasks/v1/lists/@default/tasks/${task.googleTaskId}`,
        //   {
        //     method: 'PATCH',
        //     body: JSON.stringify({
        //       status: newStatus === 'done' ? 'completed' : 'needsAction',
        //     }),
        //   }
        // );
      } catch (error) {
        console.warn('Google Tasks sync disabled in Gemini-only mode:', error);
      }
    }

    this.saveTasksToStorage();
    return task;
  }

  /**
   * Auto-generate tasks for a hearing/event
   */
  public async generateTasksForHearing(
    eventId: string,
    caseNumber: string,
    hearingType: string,
    hearingDate: Date,
    clientName?: string
  ): Promise<Task[]> {
    const tasks: Task[] = [];
    const baseMetadata = {
      caseNumber,
      hearingType,
      clientName,
      source: 'auto' as const,
    };

    // Pre-hearing tasks
    const preHearingTasks = [
      {
        title: 'Review case file and documents',
        description: `Review all documents and case materials for ${caseNumber}`,
        priority: 'high' as const,
        dueDate: new Date(hearingDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days before
        estimatedMinutes: 120,
        metadata: { ...baseMetadata },
        tags: ['preparation', 'review'],
      },
      {
        title: 'Prepare hearing arguments and strategy',
        description: `Prepare legal arguments and strategy for ${hearingType}`,
        priority: 'high' as const,
        dueDate: new Date(hearingDate.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days before
        estimatedMinutes: 180,
        metadata: { ...baseMetadata },
        tags: ['preparation', 'strategy'],
      },
      {
        title: 'Contact client to confirm attendance',
        description: `Confirm attendance and brief client on hearing proceedings`,
        priority: 'medium' as const,
        dueDate: new Date(hearingDate.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days before
        estimatedMinutes: 30,
        metadata: { ...baseMetadata },
        tags: ['client_contact', 'confirmation'],
      },
    ];

    // Post-hearing tasks
    const postHearingTasks = [
      {
        title: 'Document hearing outcome and next steps',
        description: `Record hearing results and determine follow-up actions for ${caseNumber}`,
        priority: 'high' as const,
        dueDate: new Date(hearingDate.getTime() + 24 * 60 * 60 * 1000), // 1 day after
        estimatedMinutes: 60,
        metadata: { ...baseMetadata },
        tags: ['documentation', 'follow_up'],
      },
      {
        title: 'Update client on hearing outcome',
        description: `Contact client to update on hearing results and next steps`,
        priority: 'medium' as const,
        dueDate: new Date(hearingDate.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days after
        estimatedMinutes: 30,
        metadata: { ...baseMetadata },
        tags: ['client_contact', 'update'],
      },
    ];

    // Create all tasks
    for (const taskData of [...preHearingTasks, ...postHearingTasks]) {
      try {
        const task = await this.createHybridTask({
          ...taskData,
          relatedEventId: eventId,
        });
        tasks.push(task);
      } catch (error) {
        console.error('Failed to create auto-generated task:', error);
      }
    }

    return tasks;
  }
}

// Export singleton instance
export const taskService = new TaskService();