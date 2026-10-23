import React, { useState } from 'react';
import { Calendar, Clock, Bell, Edit, Trash2, Plus, Check, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

interface MultiReminderEvent {
  id: string;
  title: string;
  eventDate: Date;
  reminders: {
    id: string;
    type: 'email' | 'popup' | 'desktop' | 'sms';
    timing: 'before' | 'after';
    offset: number; // minutes
    message: string;
    urgency: 'info' | 'warning' | 'urgent' | 'critical';
    isActive: boolean;
    isTriggered: boolean;
  }[];
  isAutoCalendared: boolean;
  editMode: boolean;
}

export function MultiReminderEventEditor() {
  const [events, setEvents] = useState<MultiReminderEvent[]>([
    {
      id: 'event-1',
      title: 'WCAB Hearing - Johnson v. Smith Case #ADJ1234567',
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      isAutoCalendared: true,
      editMode: false,
      reminders: [
        {
          id: 'r1',
          type: 'email',
          timing: 'before',
          offset: 20160, // 2 weeks
          message: 'WCAB Hearing in 2 weeks - Begin case preparation and witness interviews',
          urgency: 'info',
          isActive: true,
          isTriggered: false
        },
        {
          id: 'r2',
          type: 'email',
          timing: 'before',
          offset: 10080, // 1 week
          message: 'WCAB Hearing in 1 week - Finalize witness preparation and review exhibits',
          urgency: 'warning',
          isActive: true,
          isTriggered: false
        },
        {
          id: 'r3',
          type: 'popup',
          timing: 'before',
          offset: 4320, // 3 days
          message: 'WCAB Hearing in 3 days - Review case files and prepare opening statements',
          urgency: 'warning',
          isActive: true,
          isTriggered: false
        },
        {
          id: 'r4',
          type: 'popup',
          timing: 'before',
          offset: 1440, // 1 day
          message: 'WCAB Hearing tomorrow - Confirm logistics and prepare final materials',
          urgency: 'urgent',
          isActive: true,
          isTriggered: false
        },
        {
          id: 'r5',
          type: 'desktop',
          timing: 'before',
          offset: 120, // 2 hours
          message: 'WCAB Hearing in 2 hours - Final preparation and departure time',
          urgency: 'critical',
          isActive: true,
          isTriggered: false
        },
        {
          id: 'r6',
          type: 'email',
          timing: 'after',
          offset: 240, // 4 hours after
          message: 'Follow-up: Document hearing outcome and next steps',
          urgency: 'info',
          isActive: true,
          isTriggered: false
        },
        {
          id: 'r7',
          type: 'popup',
          timing: 'after',
          offset: 1440, // 1 day after
          message: 'Follow-up: Schedule client meeting to discuss hearing results',
          urgency: 'warning',
          isActive: true,
          isTriggered: false
        }
      ]
    }
  ]);

  const toggleEditMode = (eventId: string) => {
    setEvents(events.map(event => 
      event.id === eventId 
        ? { ...event, editMode: !event.editMode }
        : event
    ));
  };

  const addReminder = (eventId: string) => {
    const newReminder = {
      id: `r${Date.now()}`,
      type: 'popup' as const,
      timing: 'before' as const,
      offset: 60, // 1 hour default
      message: 'Custom reminder message',
      urgency: 'info' as const,
      isActive: true,
      isTriggered: false
    };

    setEvents(events.map(event => 
      event.id === eventId 
        ? { ...event, reminders: [...event.reminders, newReminder] }
        : event
    ));
  };

  const updateReminder = (eventId: string, reminderId: string, updates: Partial<typeof events[0]['reminders'][0]>) => {
    setEvents(events.map(event => 
      event.id === eventId 
        ? {
            ...event,
            reminders: event.reminders.map(reminder =>
              reminder.id === reminderId 
                ? { ...reminder, ...updates }
                : reminder
            )
          }
        : event
    ));
  };

  const deleteReminder = (eventId: string, reminderId: string) => {
    setEvents(events.map(event => 
      event.id === eventId 
        ? { ...event, reminders: event.reminders.filter(r => r.id !== reminderId) }
        : event
    ));
  };

  const formatOffset = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
    return `${Math.floor(minutes / 1440)}d`;
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return '📧';
      case 'popup': return '💬';
      case 'desktop': return '🖥️';
      case 'sms': return '📱';
      default: return '🔔';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Multi-Reminder Event Management</h2>
        <Badge className="bg-green-100 text-green-800">
          Auto-Calendared Events: {events.filter(e => e.isAutoCalendared).length}
        </Badge>
      </div>

      {events.map((event) => (
        <Card key={event.id} className="border-2">
          <CardHeader className="bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  <p className="text-sm text-gray-600">
                    {event.eventDate.toLocaleDateString()} at {event.eventDate.toLocaleTimeString()}
                  </p>
                </div>
                {event.isAutoCalendared && (
                  <Badge className="bg-blue-100 text-blue-800">Auto-Created</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {event.reminders.length} Reminders
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleEditMode(event.id)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  {event.editMode ? 'Save' : 'Edit'}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Reminder Timeline
                </h4>
                {event.editMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addReminder(event.id)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Reminder
                  </Button>
                )}
              </div>

              {/* Before Event Reminders */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Before Event ({event.reminders.filter(r => r.timing === 'before').length} reminders)
                </h5>
                {event.reminders
                  .filter(r => r.timing === 'before')
                  .sort((a, b) => b.offset - a.offset)
                  .map((reminder) => (
                    <div
                      key={reminder.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white"
                    >
                      <span className="text-lg">{getTypeIcon(reminder.type)}</span>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className={getUrgencyColor(reminder.urgency)}>
                            {reminder.urgency}
                          </Badge>
                          <span className="text-sm font-medium">
                            {formatOffset(reminder.offset)} before
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {reminder.type}
                          </Badge>
                        </div>
                        
                        {event.editMode ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={reminder.message}
                              onChange={(e) => updateReminder(event.id, reminder.id, { message: e.target.value })}
                              className="w-full p-2 border rounded text-sm"
                            />
                            <div className="flex items-center gap-2">
                              <select
                                value={reminder.type}
                                onChange={(e) => updateReminder(event.id, reminder.id, { type: e.target.value as any })}
                                className="px-2 py-1 border rounded text-xs"
                              >
                                <option value="email">Email</option>
                                <option value="popup">Popup</option>
                                <option value="desktop">Desktop</option>
                                <option value="sms">SMS</option>
                              </select>
                              <input
                                type="number"
                                value={reminder.offset}
                                onChange={(e) => updateReminder(event.id, reminder.id, { offset: parseInt(e.target.value) })}
                                className="w-20 px-2 py-1 border rounded text-xs"
                                placeholder="Minutes"
                              />
                              <select
                                value={reminder.urgency}
                                onChange={(e) => updateReminder(event.id, reminder.id, { urgency: e.target.value as any })}
                                className="px-2 py-1 border rounded text-xs"
                              >
                                <option value="info">Info</option>
                                <option value="warning">Warning</option>
                                <option value="urgent">Urgent</option>
                                <option value="critical">Critical</option>
                              </select>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-700">{reminder.message}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {reminder.isTriggered ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                        
                        {event.editMode && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteReminder(event.id, reminder.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              {/* After Event Reminders */}
              {event.reminders.filter(r => r.timing === 'after').length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3" />
                    After Event Follow-ups ({event.reminders.filter(r => r.timing === 'after').length} reminders)
                  </h5>
                  {event.reminders
                    .filter(r => r.timing === 'after')
                    .sort((a, b) => a.offset - b.offset)
                    .map((reminder) => (
                      <div
                        key={reminder.id}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-green-50"
                      >
                        <span className="text-lg">{getTypeIcon(reminder.type)}</span>
                        
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className={getUrgencyColor(reminder.urgency)}>
                              {reminder.urgency}
                            </Badge>
                            <span className="text-sm font-medium">
                              {formatOffset(reminder.offset)} after
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {reminder.type}
                            </Badge>
                          </div>
                          
                          {event.editMode ? (
                            <input
                              type="text"
                              value={reminder.message}
                              onChange={(e) => updateReminder(event.id, reminder.id, { message: e.target.value })}
                              className="w-full p-2 border rounded text-sm"
                            />
                          ) : (
                            <p className="text-sm text-gray-700">{reminder.message}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {reminder.isTriggered ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-gray-400" />
                          )}
                          
                          {event.editMode && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteReminder(event.id, reminder.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Summary Stats */}
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg text-sm">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Total: {event.reminders.length} reminders
                </span>
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-600" />
                  Triggered: {event.reminders.filter(r => r.isTriggered).length}
                </span>
                <span className="flex items-center gap-1">
                  <Bell className="h-3 w-3 text-blue-600" />
                  Pending: {event.reminders.filter(r => !r.isTriggered && r.isActive).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
