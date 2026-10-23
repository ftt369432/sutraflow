import { TaskDefinition } from '../calendar/EmailEventAnalyzer';
import { supabase } from '../../lib/supabaseClient';
import { addDays } from 'date-fns';

const PRIORITY_MAP: Record<string, number> = {
  'low': 2,
  'medium': 3,
  'high': 4,
  'urgent': 5
};

const REVERSE_PRIORITY_MAP: Record<number, 'low' | 'medium' | 'high' | 'urgent'> = {
  1: 'low',
  2: 'low',
  3: 'medium',
  4: 'high',
  5: 'urgent'
};

export class CalendarTaskServiceAdapter {
  
  private async getUserId(): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || '00000000-0000-0000-0000-000000000000';
    } catch {
      return '00000000-0000-0000-0000-000000000000';
    }
  }

  /**
   * Create a task linked to a calendar event in the master_tasks table.
   */
  async createTask(taskDef: TaskDefinition, eventId: string): Promise<string> {
    const userId = await this.getUserId();
    const priorityVal = PRIORITY_MAP[taskDef.priority] || 3;

    const { data, error } = await supabase
      .from('master_tasks')
      .insert({
        title: taskDef.title,
        description: taskDef.description,
        priority: priorityVal,
        status: 'queued',
        source: 'ai_agent_orchestrator',
        user_id: userId,
        estimated_duration: taskDef.estimatedDuration,
        tags: ['calendar-event', `event:${eventId}`, ...(taskDef.category ? [taskDef.category] : [])],
        context: {
          offsetDays: taskDef.offsetDays,
          reminders: taskDef.reminders || [],
          relatedCalendarEventId: eventId
        }
      })
      .select('id')
      .single();

    if (error) {
      console.error('❌ CalendarTaskServiceAdapter: Failed to create task in Supabase:', error);
      throw error;
    }

    console.log(`✅ CalendarTaskServiceAdapter: Task created in master_tasks: ${data.id}`);
    return data.id;
  }

  /**
   * Update a task in the master_tasks table.
   */
  async updateTask(taskId: string, updates: Partial<TaskDefinition>): Promise<void> {
    const dbUpdates: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.priority !== undefined) dbUpdates.priority = PRIORITY_MAP[updates.priority] || 3;
    if (updates.estimatedDuration !== undefined) dbUpdates.estimated_duration = updates.estimatedDuration;
    
    // Merge context updates
    if (updates.offsetDays !== undefined || updates.category !== undefined) {
      const { data: current } = await supabase.from('master_tasks').select('context').eq('id', taskId).single();
      dbUpdates.context = {
        ...(current?.context || {}),
        ...(updates.offsetDays !== undefined ? { offsetDays: updates.offsetDays } : {}),
        ...(updates.category !== undefined ? { category: updates.category } : {})
      };
    }

    const { error } = await supabase
      .from('master_tasks')
      .update(dbUpdates)
      .eq('id', taskId);

    if (error) {
      console.error(`❌ CalendarTaskServiceAdapter: Failed to update task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a task from the master_tasks table.
   */
  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('master_tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error(`❌ CalendarTaskServiceAdapter: Failed to delete task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch all tasks associated with a calendar event.
   */
  async getTasksForEvent(eventId: string): Promise<TaskDefinition[]> {
    const { data, error } = await supabase
      .from('master_tasks')
      .select('*')
      .contains('tags', [`event:${eventId}`]);

    if (error) {
      console.error(`❌ CalendarTaskServiceAdapter: Failed to fetch tasks for event ${eventId}:`, error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      title: row.title,
      description: row.description || '',
      offsetDays: row.context?.offsetDays || 0,
      priority: REVERSE_PRIORITY_MAP[row.priority] || 'medium',
      estimatedDuration: row.estimated_duration || 30,
      reminders: row.context?.reminders || [],
      category: row.tags?.find((t: string) => t !== 'calendar-event' && !t.startsWith('event:'))
    }));
  }

  /**
   * Subscribe to real-time changes for tasks associated with a specific event.
   * Enables zero-latency bidirectional synchronization updates.
   */
  public subscribeToTaskChanges(
    eventId: string,
    callback: (payload: { event: 'INSERT' | 'UPDATE' | 'DELETE'; task: TaskDefinition }) => void
  ): () => void {
    const channel = supabase
      .channel(`event-tasks-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'master_tasks',
          filter: `user_id=eq.${supabase.auth.getUser()}` // Listen for current user
        },
        async (payload) => {
          // Check if payload contains our event tag
          const tags = (payload.new as any)?.tags || (payload.old as any)?.tags || [];
          if (tags.includes(`event:${eventId}`)) {
            const row = (payload.new || payload.old) as any;
            const task: TaskDefinition = {
              id: row.id,
              title: row.title,
              description: row.description || '',
              offsetDays: row.context?.offsetDays || 0,
              priority: REVERSE_PRIORITY_MAP[row.priority] || 'medium',
              estimatedDuration: row.estimated_duration || 30,
              reminders: row.context?.reminders || [],
              category: row.tags?.find((t: string) => t !== 'calendar-event' && !t.startsWith('event:'))
            };
            callback({
              event: payload.eventType,
              task
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}
