import React, { useState } from 'react';
import { Calendar, Flag, Grid, Mail } from 'lucide-react';
import { EnhancedCalendarEventModal } from '../calendar/EnhancedCalendarEventModal';
import { EmailFollowUpFlag, FollowUpFlag } from '../email/EmailFollowUpFlag';
import { KanbanTaskView } from '../tasks/KanbanTaskView';
import { EmailTagList, getTagPresets } from '../email/EmailTagComponents';
import { TaskDefinition } from '../../services/calendar/EmailEventAnalyzer';
import { CalendarEvent } from '../../types/calendar.types';
import dayjs from 'dayjs';

// Demo component showcasing all the new enhancements
export const EnhancementShowcase: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [emailFlags, setEmailFlags] = useState<Map<string, FollowUpFlag>>(new Map());
  const [activeTab, setActiveTab] = useState<'emails' | 'calendar' | 'tasks'>('emails');

  // Sample data
  const sampleEvent: CalendarEvent = {
    id: 'event-1',
    title: 'Client Consultation - ABC Corp',
    description: 'Discuss contract terms and next steps',
    eventType: 'meeting',
    date: dayjs('2025-01-15T10:00:00'),
    startDate: new Date('2025-01-15T10:00:00'),
    endDate: new Date('2025-01-15T11:00:00'),
    sourceEmail: 'client@abccorp.com',
    sourceEmails: ['client@abccorp.com', 'lawyer@firm.com'],
    relatedTasks: ['task-1', 'task-2'],
    metadata: {
      caseNumber: 'CASE-2025-001',
      clientName: 'ABC Corporation',
      urgencyLevel: 'high'
    },
    createdAt: dayjs(),
    updatedAt: dayjs()
  };

  const sampleTasks: TaskDefinition[] = [
    {
      id: 'task-1',
      title: 'Prepare contract review checklist',
      description: 'Create comprehensive checklist for contract terms review',
      offsetDays: 1,
      priority: 'high',
      estimatedDuration: 120,
      assignee: 'Legal Team',
      reminders: [],
      category: 'preparation'
    },
    {
      id: 'task-2',
      title: 'Research regulatory compliance',
      description: 'Verify current regulations for client industry',
      offsetDays: 0,
      priority: 'medium',
      estimatedDuration: 90,
      assignee: 'Compliance Officer',
      reminders: [],
      category: 'research'
    },
    {
      id: 'task-3',
      title: 'Draft initial proposal',
      description: 'Create first draft of legal proposal based on consultation',
      offsetDays: 2,
      priority: 'urgent',
      estimatedDuration: 180,
      assignee: 'Senior Attorney',
      reminders: [],
      category: 'drafting'
    }
  ];

  const sampleEmails = [
    {
      id: 'email-1',
      subject: 'Urgent: Contract Review Required',
      sender: 'client@abccorp.com',
      preview: 'Please review the attached contract as soon as possible...',
      hasFlag: true
    },
    {
      id: 'email-2',
      subject: 'Meeting Follow-up - Action Items',
      sender: 'partner@firm.com',
      preview: 'Following our meeting yesterday, here are the action items...',
      hasFlag: false
    }
  ];

  const sampleTags = getTagPresets().slice(0, 6);

  const handleSetFlag = (flag: FollowUpFlag) => {
    setEmailFlags(new Map(emailFlags.set(flag.emailId, flag)));
  };

  const handleRemoveFlag = (flagId: string) => {
    const newFlags = new Map(emailFlags);
    for (const [emailId, flag] of newFlags.entries()) {
      if (flag.id === flagId) {
        newFlags.delete(emailId);
        break;
      }
    }
    setEmailFlags(newFlags);
  };

  const handleCompleteFlag = (flagId: string) => {
    const newFlags = new Map(emailFlags);
    for (const [emailId, flag] of newFlags.entries()) {
      if (flag.id === flagId) {
        newFlags.set(emailId, { ...flag, completed: true });
        break;
      }
    }
    setEmailFlags(newFlags);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ✨ GenieFlow AI - Enhanced Email & Calendar System
          </h1>
          <p className="text-gray-600">
            Experience Google-like functionality with Notion-style views and improved follow-up management
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6">
          {[
            { id: 'emails', label: 'Enhanced Emails', icon: Mail },
            { id: 'calendar', label: 'Smart Calendar', icon: Calendar },
            { id: 'tasks', label: 'Notion-Style Tasks', icon: Grid }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Content Areas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {activeTab === 'emails' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">📧 Enhanced Email Features</h2>
              
              {/* Email Tags Demo */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">🏷️ Improved Email Tags</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-3">
                    Clean, light colors with better readability. Default is uncolored for clarity.
                  </p>
                  <EmailTagList
                    tags={sampleTags}
                    onTagClick={(tag) => console.log('Tag clicked:', tag)}
                    size="md"
                  />
                </div>
              </div>

              {/* Follow-up Flags Demo */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">🚩 Follow-up Flag System</h3>
                <div className="space-y-4">
                  {sampleEmails.map((email) => (
                    <div key={email.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{email.subject}</h4>
                          <p className="text-sm text-gray-600">From: {email.sender}</p>
                          <p className="text-sm text-gray-500 mt-1">{email.preview}</p>
                        </div>
                        <div className="ml-4">
                          <EmailFollowUpFlag
                            emailId={email.id}
                            currentFlag={emailFlags.get(email.id)}
                            onSetFlag={handleSetFlag}
                            onRemoveFlag={handleRemoveFlag}
                            onCompleteFlag={handleCompleteFlag}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">📅 Enhanced Calendar Events</h2>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-gray-900">{sampleEvent.title}</h3>
                    <p className="text-sm text-gray-600">
                      {sampleEvent.startDate.toLocaleString()} - Client Meeting
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedEvent(sampleEvent);
                      setIsEventModalOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Open Event
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  🎯 Click "Open Event" to see the enhanced calendar modal with integrated task management!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">✅ Task Management</h2>
              <KanbanTaskView
                tasks={sampleTasks}
                onTaskClick={(task) => console.log('Task clicked:', task)}
                onCreateTask={() => console.log('Create new task')}
              />
            </div>
          )}
        </div>

        {/* Enhanced Calendar Event Modal */}
        <EnhancedCalendarEventModal
          event={selectedEvent}
          isOpen={isEventModalOpen}
          onClose={() => {
            setIsEventModalOpen(false);
            setSelectedEvent(null);
          }}
          onSave={async (event, tasks) => {
            console.log('Saving event:', event, 'with tasks:', tasks);
            setIsEventModalOpen(false);
          }}
          existingTasks={sampleTasks}
        />

        {/* Feature Highlights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <Flag className="h-6 w-6 text-blue-600" />
              <h3 className="font-semibold">Follow-up Flags</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Outlook-style follow-up system with quick options and custom dates
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <Calendar className="h-6 w-6 text-green-600" />
              <h3 className="font-semibold">Enhanced Events</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Open calendar events to manage tasks, keeping everything organized
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <Grid className="h-6 w-6 text-purple-600" />
              <h3 className="font-semibold">Tile Views</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Beautiful Notion-style tile views with advanced filtering and search
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancementShowcase;
