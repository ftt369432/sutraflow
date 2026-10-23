import React from 'react';
import { Card } from '../ui/Card';
import { Mail, CheckSquare, Calendar, Users, FileText } from 'lucide-react';
import type { Email, Task, CalendarEvent, Contact, Document } from '../../types';

interface MetricsGridProps {
  emails: Email[];
  tasks: Task[];
  events: CalendarEvent[];
  contacts: Contact[];
  documents: Document[];
}

export function MetricsGrid({ emails, tasks, events, contacts, documents }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-500" />
          <span>Emails</span>
        </div>
        <p className="text-2xl font-bold mt-2">{emails?.length || 0}</p>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-green-500" />
          <span>Tasks</span>
        </div>
        <p className="text-2xl font-bold mt-2">{tasks?.length || 0}</p>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-500" />
          <span>Events</span>
        </div>
        <p className="text-2xl font-bold mt-2">{events?.length || 0}</p>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-yellow-500" />
          <span>Contacts</span>
        </div>
        <p className="text-2xl font-bold mt-2">{contacts?.length || 0}</p>
      </Card>

      <Card className="p-4 col-span-2">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-orange-500" />
          <span>Documents</span>
        </div>
        <p className="text-2xl font-bold mt-2">{documents?.length || 0}</p>
      </Card>
    </div>
  );
}