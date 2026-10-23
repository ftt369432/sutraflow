/**
 * 📅 Canvas Task Integration Hook
 * 
 * Provides task management capabilities for Canvas documents
 * Designed for future expansion with calendar, reminders, and AI assistance
 */

import { useState, useCallback, useEffect } from 'react';
import { TaskMetadata, TaskActions, TaskEvent, TaskEnabledCanvasDocument } from '../../types/taskIntegration';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../useToast';

interface UseCanvasTasksReturn {
  // State
  tasks: TaskMetadata[];
  loading: boolean;
  error: string | null;
  
  // Actions
  createTask: (documentId: string, taskData: Partial<TaskMetadata>) => Promise<string | null>;
  updateTask: (taskId: string, updates: Partial<TaskMetadata>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string, completionNote?: string) => Promise<void>;
  
  // Scheduling
  scheduleTask: (taskId: string, scheduledTime: Date, duration?: number) => Promise<void>;
  addReminder: (taskId: string, reminder: { type: 'email' | 'push' | 'sms' | 'in-app'; triggerBefore: number; message?: string }) => Promise<void>;
  
  // Queries
  getTasksForDocument: (documentId: string) => TaskMetadata[];
  getUpcomingTasks: (daysAhead?: number) => TaskMetadata[];
  getOverdueTasks: () => TaskMetadata[];
  
  // Utilities
  extractTasksFromContent: (content: string) => Partial<TaskMetadata>[];
  isTaskEnabled: (document: TaskEnabledCanvasDocument) => boolean;
}

/**
 * Canvas Task Integration Hook
 */
export function useCanvasTasks(): UseCanvasTasksReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [tasks, setTasks] = useState<TaskMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a new task linked to a document
  const createTask = useCallback(async (
    documentId: string, 
    taskData: Partial<TaskMetadata>
  ): Promise<string | null> => {
    if (!user?.id) {
      toast({ title: 'Authentication required', variant: 'destructive' });
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const newTask: TaskMetadata = {
        taskId: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        taskType: taskData.taskType || 'action-item',
        priority: taskData.priority || 'medium',
        status: 'draft',
        createdBy: user.id,
        ...taskData,
        // Ensure required fields
        dueDate: taskData.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week
      };

      // TODO: Implement actual storage (Supabase, local storage, or AI Drive)
      setTasks(prev => [...prev, newTask]);
      
      toast({ 
        title: 'Task created', 
        description: `Task "${taskData.taskType}" has been created` 
      });

      // TODO: Trigger task-created event for integrations
      console.log('📅 Task created:', newTask);

      return newTask.taskId!;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task';
      setError(errorMessage);
      toast({ title: 'Error creating task', description: errorMessage, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Update an existing task
  const updateTask = useCallback(async (taskId: string, updates: Partial<TaskMetadata>) => {
    setLoading(true);
    try {
      setTasks(prev => prev.map(task => 
        task.taskId === taskId ? { ...task, ...updates } : task
      ));
      
      toast({ title: 'Task updated' });
      console.log('📅 Task updated:', taskId, updates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task';
      setError(errorMessage);
      toast({ title: 'Error updating task', description: errorMessage, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Delete a task
  const deleteTask = useCallback(async (taskId: string) => {
    setLoading(true);
    try {
      setTasks(prev => prev.filter(task => task.taskId !== taskId));
      toast({ title: 'Task deleted' });
      console.log('📅 Task deleted:', taskId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete task';
      setError(errorMessage);
      toast({ title: 'Error deleting task', description: errorMessage, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Complete a task
  const completeTask = useCallback(async (taskId: string, completionNote?: string) => {
    await updateTask(taskId, { 
      status: 'completed',
      completionPercentage: 100,
      // TODO: Add completion timestamp and note
    });
  }, [updateTask]);

  // Schedule a task
  const scheduleTask = useCallback(async (taskId: string, scheduledTime: Date, duration?: number) => {
    await updateTask(taskId, { 
      scheduledTime,
      duration,
      status: 'scheduled'
    });
  }, [updateTask]);

  // Add reminder to task
  const addReminder = useCallback(async (
    taskId: string, 
    reminder: { type: 'email' | 'push' | 'sms' | 'in-app'; triggerBefore: number; message?: string }
  ) => {
    const task = tasks.find(t => t.taskId === taskId);
    if (!task) return;

    const newReminder = {
      id: `reminder_${Date.now()}`,
      ...reminder,
      isActive: true
    };

    await updateTask(taskId, {
      reminders: [...(task.reminders || []), newReminder]
    });
  }, [tasks, updateTask]);

  // Get tasks for a specific document
  const getTasksForDocument = useCallback((documentId: string) => {
    // TODO: Implement proper document-task linking
    return tasks.filter(task => {
      // For now, match by document reference in metadata
      return task.taskId?.includes(documentId) || false;
    });
  }, [tasks]);

  // Get upcoming tasks
  const getUpcomingTasks = useCallback((daysAhead: number = 7) => {
    const cutoffDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
    return tasks.filter(task => 
      task.dueDate && 
      task.dueDate <= cutoffDate && 
      task.status !== 'completed'
    ).sort((a, b) => (a.dueDate!.getTime() - b.dueDate!.getTime()));
  }, [tasks]);

  // Get overdue tasks
  const getOverdueTasks = useCallback(() => {
    const now = new Date();
    return tasks.filter(task => 
      task.dueDate && 
      task.dueDate < now && 
      task.status !== 'completed'
    );
  }, [tasks]);

  // Extract potential tasks from document content using AI/patterns
  const extractTasksFromContent = useCallback((content: string): Partial<TaskMetadata>[] => {
    const extractedTasks: Partial<TaskMetadata>[] = [];
    
    // Pattern matching for common task indicators
    const taskPatterns = [
      /(?:TODO|To do|Action item|Task):\s*(.+)/gi,
      /(?:Due|Deadline|By):\s*(.+)/gi,
      /(?:Schedule|Meet|Appointment):\s*(.+)/gi,
      /(?:Follow up|Follow-up):\s*(.+)/gi,
      /(?:Reminder|Remember to):\s*(.+)/gi,
    ];

    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/\d{4})/g,
      /(\d{4}-\d{2}-\d{2})/g,
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/gi,
    ];

    taskPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Extract date if present
          let dueDate: Date | undefined;
          datePatterns.forEach(datePattern => {
            const dateMatch = match.match(datePattern);
            if (dateMatch) {
              dueDate = new Date(dateMatch[0]);
            }
          });

          extractedTasks.push({
            taskType: 'action-item',
            priority: 'medium',
            dueDate,
            // TODO: Use AI to better classify task type and priority
          });
        });
      }
    });

    return extractedTasks;
  }, []);

  // Check if task features are enabled for a document
  const isTaskEnabled = useCallback((document: TaskEnabledCanvasDocument) => {
    return document.metadata?.taskMetadata !== undefined;
  }, []);

  // TODO: Load tasks from persistent storage on mount
  useEffect(() => {
    if (user?.id) {
      // Load user's tasks from storage
      console.log('📅 Loading tasks for user:', user.id);
    }
  }, [user?.id]);

  return {
    // State
    tasks,
    loading,
    error,
    
    // Actions
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    
    // Scheduling
    scheduleTask,
    addReminder,
    
    // Queries
    getTasksForDocument,
    getUpcomingTasks,
    getOverdueTasks,
    
    // Utilities
    extractTasksFromContent,
    isTaskEnabled,
  };
}