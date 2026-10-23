import { Event, EventType } from '../types/calendar';
import { TaskService } from './TaskService';
import { AIService } from './ai/baseAIService';
import { supabase } from '../lib/supabaseClient';

export class CalendarService {
  constructor(
    private taskService: TaskService,
    private aiService: AIService
  ) {}

  async createEvent(event: Omit<Event, 'id'>): Promise<Event> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        title: event.title,
        description: event.description || '',
        start_time: event.startTime.toISOString(),
        end_time: event.endTime.toISOString(),
        type: event.type,
        user_id: user.id,
        attendees: event.attendees || [],
        metadata: event.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapSupabaseEvent(data);
  }

  async convertTaskToEvent(taskId: string): Promise<Event> {
    const task = await this.taskService.getTask(taskId);
    const startTime = task.dueDate || new Date();
    const duration = task.estimatedDuration || 60;
    
    return this.createEvent({
      title: task.title,
      description: task.description,
      startTime,
      endTime: new Date(startTime.getTime() + (duration * 60 * 1000)),
      type: EventType.TASK,
      metadata: { taskId },
      created: new Date(),
      lastModified: new Date()
    });
  }

  async bulkConvertTasks(taskIds: string[]): Promise<Event[]> {
    return Promise.all(taskIds.map(id => this.convertTaskToEvent(id)));
  }

  async getEventsForRange(start: Date, end: Date): Promise<Event[]> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .gte('start_time', start.toISOString())
      .lte('end_time', end.toISOString());

    if (error) throw error;
    return (data || []).map(this.mapSupabaseEvent);
  }

  async suggestEventTimes(event: Partial<Event>): Promise<Date[]> {
    const result = await this.aiService.suggestEventTimes(event);
    if (!result || typeof result.data === 'undefined') {
        throw new Error('Failed to suggest event times: AI service returned invalid data');
    }
    return result.data;
  }

  async getAvailability(participant: string): Promise<Array<{ start: Date; end: Date }>> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('start_time, end_time')
      .contains('attendees', [participant]);

    if (error) return [];
    
    return (data || []).map(e => ({
      start: new Date(e.start_time),
      end: new Date(e.end_time)
    }));
  }

  async updateEvent(eventId: string, updates: Partial<Omit<Event, 'id'>>): Promise<Event> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.startTime) updateData.start_time = updates.startTime.toISOString();
    if (updates.endTime) updateData.end_time = updates.endTime.toISOString();
    if (updates.type) updateData.type = updates.type;
    if (updates.attendees) updateData.attendees = updates.attendees;

    const { data, error } = await supabase
      .from('calendar_events')
      .update(updateData)
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;
    return this.mapSupabaseEvent(data);
  }

  async getTodaysEvents(): Promise<Event[]> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    return this.getEventsForRange(todayStart, todayEnd);
  }

  private mapSupabaseEvent(dbEvent: any): Event {
    return {
      id: dbEvent.id,
      title: dbEvent.title,
      description: dbEvent.description,
      startTime: new Date(dbEvent.start_time),
      endTime: new Date(dbEvent.end_time),
      type: dbEvent.type as EventType,
      attendees: dbEvent.attendees || [],
      metadata: dbEvent.metadata || {},
      created: new Date(dbEvent.created_at),
      lastModified: new Date(dbEvent.updated_at)
    };
  }
} 