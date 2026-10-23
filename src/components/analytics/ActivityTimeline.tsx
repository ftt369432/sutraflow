import React from 'react';
import { Card } from '../ui/Card';
import { Mail, CheckSquare, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import type { Email, Task, CalendarEvent, Document } from '../../types';

interface ActivityTimelineProps {
  emails: Email[];
  tasks: Task[];
  events: CalendarEvent[];
  documents: Document[];
}

export function ActivityTimeline({ emails, tasks, events, documents }: ActivityTimelineProps) {
  const activities = [
    ...(emails?.map(email => ({
      type: 'email',
      title: email.subject,
      timestamp: email.date,
      icon: Mail
    })) || []),
    ...(tasks?.map(task => ({
      type: 'task',
      title: task.title,
      timestamp: new Date(),
      icon: CheckSquare
    })) || []),
    ...(events?.map(event => ({
      type: 'event',
      title: event.title,
      timestamp: event.startDate,
      icon: Calendar
    })) || []),
    ...(documents?.map(doc => ({
      type: 'document',
      title: doc.name,
      timestamp: doc.createdAt,
      icon: FileText
    })) || [])
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.slice(0, 5).map((activity, index) => (
          <div key={index} className="flex items-start gap-3">
            <activity.icon className="h-5 w-5 mt-1 text-gray-500" />
            <div>
              <p className="font-medium">{activity.title}</p>
              <p className="text-sm text-gray-500">
                {format(activity.timestamp, 'MMM d, h:mm a')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}