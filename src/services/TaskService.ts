import { Task, TaskPriority, TaskStatus } from '../types/task';
import { AIService } from './ai/baseAIService';
import { supabase } from '../lib/supabaseClient';

export class TaskService {
  private aiService: AIService;

  constructor(aiService: AIService) {
    this.aiService = aiService;
  }

  async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // AI-enhanced task creation
    const enhancedTask = await this.aiService.enhanceTask({
      id: crypto.randomUUID(),
      ...task,
      created: new Date(),
      lastModified: new Date()
    });

    if (!enhancedTask || typeof enhancedTask.data === 'undefined') {
      throw new Error('Failed to create task: AI service returned invalid data');
    }

    const { data, error } = await supabase
      .from('master_tasks')
      .insert({
        title: enhancedTask.data.title,
        description: enhancedTask.data.description || '',
        priority: enhancedTask.data.priority,
        status: enhancedTask.data.status === TaskStatus.TODO ? 'todo' : enhancedTask.data.status,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        context: {
          dueDate: enhancedTask.data.dueDate,
          tags: enhancedTask.data.tags,
          estimatedDuration: enhancedTask.data.estimatedDuration,
          ...enhancedTask.data.metadata
        }
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapSupabaseTask(data);
  }

  async estimateDuration(taskDescription: string): Promise<number> {
    const tempTask: Task = {
      id: crypto.randomUUID(),
      title: taskDescription,
      description: 'Task description for estimation',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.TODO,
      created: new Date(),
      lastModified: new Date(),
      dueDate: undefined,
      tags: [],
      estimatedDuration: 0
    };
    const result = await this.aiService.estimateTaskDuration(tempTask);

    if (!result || typeof result.data === 'undefined') {
      throw new Error('Failed to estimate duration: AI service returned invalid data');
    }
    return result.data;
  }

  async suggestSchedule(tasks: Task[]): Promise<Task[]> {
    const result = await this.aiService.optimizeTaskSchedule(tasks);

    if (!result || typeof result.data === 'undefined') {
      throw new Error('Failed to suggest schedule: AI service returned invalid data');
    }
    return result.data;
  }

  async getTask(id: string): Promise<Task> {
    const { data, error } = await supabase
      .from('master_tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new Error(`Task not found: ${id}`);
    return this.mapSupabaseTask(data);
  }

  async getTasks(filter?: Partial<Task>): Promise<Task[]> {
    let query = supabase.from('master_tasks').select('*');
    
    if (filter?.status) {
      query = query.eq('status', filter.status);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return (data || []).map(this.mapSupabaseTask);
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.status) updateData.status = updates.status;
    if (updates.priority) updateData.priority = updates.priority;

    const { data, error } = await supabase
      .from('master_tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapSupabaseTask(data);
  }

  private mapSupabaseTask(dbTask: any): Task {
    return {
      id: dbTask.id,
      title: dbTask.title,
      description: dbTask.description,
      priority: dbTask.priority as TaskPriority,
      status: dbTask.status as TaskStatus,
      created: new Date(dbTask.created_at),
      lastModified: new Date(dbTask.updated_at),
      dueDate: dbTask.context?.dueDate ? new Date(dbTask.context.dueDate) : undefined,
      tags: dbTask.context?.tags || [],
      estimatedDuration: dbTask.context?.estimatedDuration || 0,
      metadata: dbTask.context || {}
    };
  }

  async getPrioritizedTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('master_tasks')
      .select('*')
      .neq('status', TaskStatus.COMPLETED)
      .neq('status', TaskStatus.BLOCKED);

    if (error) throw error;
    
    return (data || [])
      .map(this.mapSupabaseTask)
      .sort((a, b) => {
        const priorityOrder: Record<TaskPriority, number> = {
          [TaskPriority.URGENT]: 1,
          [TaskPriority.HIGH]: 2,
          [TaskPriority.MEDIUM]: 3,
          [TaskPriority.LOW]: 4,
        };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        if (a.dueDate && b.dueDate) {
          return a.dueDate.getTime() - b.dueDate.getTime();
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      });
  }
} 