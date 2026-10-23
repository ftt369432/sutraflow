import { useState, useEffect } from 'react';
import { EmailMessage } from '../types/email';
import { Task } from '../types/task';
import { CalendarEvent } from '../types/calendar';
import { emailService } from '../services/email';
import { taskService } from '../services/tasks';
import { calendarService } from '../services/calendar';

interface AnalyticsData {
  emails: {
    total: number;
    unread: number;
    byCategory: Record<string, number>;
    byHour: Array<{ hour: number; count: number }>;
    byDay: Array<{ day: string; count: number }>;
  };
  tasks: {
    total: number;
    completed: number;
    byPriority: Record<string, number>;
    byStatus: Record<string, number>;
  };
  calendar: {
    total: number;
    upcoming: number;
    byType: Record<string, number>;
    byMonth: Array<{ month: string; count: number }>;
  };
}

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get all accounts
        const accounts = JSON.parse(localStorage.getItem('email_accounts') || '[]');
        
        // Fetch emails from all accounts
        const emailPromises = accounts.map(async (account: any) => {
          const response = await emailService.getMessages(account.id);
          return response.messages;
        });
        
        const allEmails = (await Promise.all(emailPromises)).flat();

        // Process email data
        const emailStats = {
          total: allEmails.length,
          unread: allEmails.filter(email => !email.read).length,
          byCategory: {} as Record<string, number>,
          byHour: Array.from({ length: 24 }, (_, hour) => ({
            hour,
            count: allEmails.filter(email => new Date(email.date).getHours() === hour).length
          })),
          byDay: [] as Array<{ day: string; count: number }>
        };

        // Fetch tasks
        const tasks = await taskService.getTasks();
        const taskStats = {
          total: tasks.length,
          completed: tasks.filter(task => task.status === 'done').length,
          byPriority: {} as Record<string, number>,
          byStatus: {} as Record<string, number>
        };

        // Fetch calendar events
        const events = await calendarService.getEvents();
        const calendarStats = {
          total: events.length,
          upcoming: events.filter(event => new Date(event.startTime) > new Date()).length,
          byType: {} as Record<string, number>,
          byMonth: [] as Array<{ month: string; count: number }>
        };

        setData({
          emails: emailStats,
          tasks: taskStats,
          calendar: calendarStats
        });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to fetch analytics data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
}