import React, { useState, useCallback, useEffect } from 'react';
import { getPriorityClass } from '../../styles/semanticColors';
import { Calendar, Clock, MapPin, Users, FileText, Bell, Plus, Check, X, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import { Label } from '../ui/Label';
import { EmailEventDetails, CalendarEvent, TaskDefinition, EventReminder } from '../../services/calendar/EmailEventAnalyzer';
import { EmailMessage } from '../../services/email/types';
import { format, addDays, addHours } from 'date-fns';
import { cn } from '../../lib/utils';

interface SmartCalendarIntegrationProps {
  email: EmailMessage;
  eventDetails: EmailEventDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onCreateEvent: (event: CalendarEvent, tasks: TaskDefinition[]) => Promise<void>;
  onUpdateEventDetails: (details: EmailEventDetails) => void;
}

export function SmartCalendarIntegration({
  email,
  eventDetails,
  isOpen,
  onClose,
  onCreateEvent,
  onUpdateEventDetails
}: SmartCalendarIntegrationProps) {
  const [editedDetails, setEditedDetails] = useState<EmailEventDetails | null>(eventDetails);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [customTasks, setCustomTasks] = useState<TaskDefinition[]>([]);
  const [reminders, setReminders] = useState<EventReminder[]>([
    { id: '1', type: 'popup', timing: 'before', offset: 15, message: 'Event starting in 15 minutes' },
    { id: '2', type: 'email', timing: 'before', offset: 1440, message: 'Event tomorrow' }
  ]);
  const [isCreating, setIsCreating] = useState(false);

  const taskTemplates: Record<string, TaskDefinition[]> = {
    deposition: [
      {
        title: 'Review case files',
        description: 'Review all relevant case files and documents',
        offsetDays: -7,
        priority: 'high',
        estimatedDuration: 120,
        reminders: [{ type: 'popup', offsetHours: 24, message: 'Review case files for deposition' }]
      },
      {
        title: 'Prepare exhibit list',
        description: 'Compile and organize exhibits for deposition',
        offsetDays: -5,
        priority: 'high',
        estimatedDuration: 90,
        reminders: [{ type: 'email', offsetHours: 12, message: 'Prepare exhibit list' }]
      },
      {
        title: 'Send exhibits to court reporter',
        description: 'Email exhibits to court reporter before deposition',
        offsetDays: -3,
        priority: 'medium',
        estimatedDuration: 30,
        reminders: [{ type: 'popup', offsetHours: 6, message: 'Send exhibits to court reporter' }]
      },
      {
        title: 'Confirm attendance',
        description: 'Confirm attendance with all parties',
        offsetDays: -1,
        priority: 'high',
        estimatedDuration: 15,
        reminders: [{ type: 'popup', offsetHours: 2, message: 'Confirm deposition attendance' }]
      },
      {
        title: 'Post-deposition summary',
        description: 'Prepare summary of deposition proceedings',
        offsetDays: 0,
        priority: 'medium',
        estimatedDuration: 60,
        reminders: [{ type: 'popup', offsetHours: 4, message: 'Complete deposition summary' }]
      }
    ],
    qme: [
      {
        title: 'Gather medical records',
        description: 'Collect all relevant medical records for QME',
        offsetDays: -10,
        priority: 'high',
        estimatedDuration: 180,
        reminders: [{ type: 'email', offsetHours: 24, message: 'Gather medical records for QME' }]
      },
      {
        title: 'Send records to QME',
        description: 'Forward medical records to QME doctor',
        offsetDays: -7,
        priority: 'high',
        estimatedDuration: 30,
        reminders: [{ type: 'popup', offsetHours: 12, message: 'Send records to QME' }]
      },
      {
        title: 'Prepare client',
        description: 'Brief client on QME process and expectations',
        offsetDays: -2,
        priority: 'medium',
        estimatedDuration: 45,
        reminders: [{ type: 'popup', offsetHours: 6, message: 'Prepare client for QME' }]
      },
      {
        title: 'Confirm appointment',
        description: 'Confirm QME appointment details',
        offsetDays: -1,
        priority: 'high',
        estimatedDuration: 15,
        reminders: [{ type: 'popup', offsetHours: 2, message: 'Confirm QME appointment' }]
      },
      {
        title: 'Follow up on report',
        description: 'Follow up on QME report completion',
        offsetDays: 3,
        priority: 'medium',
        estimatedDuration: 30,
        reminders: [{ type: 'email', offsetHours: 0, message: 'Follow up on QME report' }]
      }
    ],
    courtDate: [
      {
        title: 'Prepare legal briefs',
        description: 'Draft and review legal briefs for court appearance',
        offsetDays: -14,
        priority: 'high',
        estimatedDuration: 240,
        reminders: [{ type: 'email', offsetHours: 48, message: 'Prepare legal briefs' }]
      },
      {
        title: 'Review case law',
        description: 'Research and review relevant case law',
        offsetDays: -7,
        priority: 'high',
        estimatedDuration: 180,
        reminders: [{ type: 'popup', offsetHours: 24, message: 'Review case law' }]
      },
      {
        title: 'Organize exhibits',
        description: 'Prepare and organize all court exhibits',
        offsetDays: -3,
        priority: 'medium',
        estimatedDuration: 90,
        reminders: [{ type: 'popup', offsetHours: 12, message: 'Organize court exhibits' }]
      },
      {
        title: 'Confirm court appearance',
        description: 'Confirm court appearance and logistics',
        offsetDays: -1,
        priority: 'high',
        estimatedDuration: 15,
        reminders: [{ type: 'popup', offsetHours: 2, message: 'Confirm court appearance' }]
      }
    ]
  };

  const handleCreateEvent = useCallback(async () => {
    if (!editedDetails) return;

    setIsCreating(true);
    try {
      const calendarEvent: CalendarEvent = {
        id: `event-${Date.now()}`,
        title: editedDetails.title,
        description: editedDetails.description,
        startDate: editedDetails.dateTime,
        endDate: editedDetails.endDateTime || addHours(editedDetails.dateTime, 1),
        location: editedDetails.location,
        attendees: editedDetails.attendees,
        eventType: editedDetails.eventType,
        sourceEmail: email.id,
        relatedTasks: [],
        reminders,
        metadata: editedDetails.extractedData
      };

      const selectedTaskDefinitions = taskTemplates[editedDetails.eventType]
        ?.filter((_, index) => selectedTasks.has(index)) || [];
      
      const allTasks = [...selectedTaskDefinitions, ...customTasks];

      await onCreateEvent(calendarEvent, allTasks);
      onClose();
    } catch (error) {
      console.error('Failed to create calendar event:', error);
    } finally {
      setIsCreating(false);
    }
  }, [editedDetails, email.id, selectedTasks, customTasks, reminders, onCreateEvent, onClose]);

  const addCustomTask = () => {
    const newTask: TaskDefinition = {
      title: '',
      description: '',
      offsetDays: -1,
      priority: 'medium',
      estimatedDuration: 60,
      reminders: [{ type: 'popup', offsetHours: 24, message: 'Custom task reminder' }]
    };
    setCustomTasks(prev => [...prev, newTask]);
  };

  const updateCustomTask = (index: number, updates: Partial<TaskDefinition>) => {
    setCustomTasks(prev => prev.map((task, i) => 
      i === index ? { ...task, ...updates } : task
    ));
  };

  const removeCustomTask = (index: number) => {
    setCustomTasks(prev => prev.filter((_, i) => i !== index));
  };

  const toggleTaskSelection = (index: number) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const addReminder = () => {
    const newReminder: EventReminder = {
      id: `reminder-${Date.now()}`,
      type: 'popup',
      timing: 'before',
      offset: 60,
      message: 'Event reminder'
    };
    setReminders(prev => [...prev, newReminder]);
  };

  if (!isOpen || !editedDetails) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Smart Calendar Integration
              </h2>
              <Badge className={cn(
                "text-xs",
                editedDetails.confidence > 0.8 ? "bg-green-100 text-green-800" :
                editedDetails.confidence > 0.6 ? "bg-yellow-100 text-yellow-800" :
                "bg-red-100 text-red-800"
              )}>
                {Math.round(editedDetails.confidence * 100)}% confidence
              </Badge>
            </div>
            <Button variant="ghost" onClick={onClose} className="p-2">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Event Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={editedDetails.title}
                    onChange={(e) => setEditedDetails({ ...editedDetails, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select 
                    value={editedDetails.eventType} 
                    onValueChange={(value) => setEditedDetails({ ...editedDetails, eventType: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deposition">Deposition</SelectItem>
                      <SelectItem value="qme">QME Appointment</SelectItem>
                      <SelectItem value="courtDate">Court Date</SelectItem>
                      <SelectItem value="appointment">Appointment</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateTime">Date & Time</Label>
                  <Input
                    id="dateTime"
                    type="datetime-local"
                    value={format(editedDetails.dateTime, "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => setEditedDetails({ 
                      ...editedDetails, 
                      dateTime: new Date(e.target.value) 
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={editedDetails.location}
                    onChange={(e) => setEditedDetails({ ...editedDetails, location: e.target.value })}
                    placeholder="Event location"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editedDetails.description}
                  onChange={(e) => setEditedDetails({ ...editedDetails, description: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Task Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Automated Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {taskTemplates[editedDetails.eventType]?.map((task, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <Checkbox
                      checked={selectedTasks.has(index)}
                      onCheckedChange={() => toggleTaskSelection(index)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{task.title}</h4>
                        <Badge className={cn(
                          "text-xs",
                          getPriorityClass(task.priority)
                        )}>
                          {task.priority}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {task.offsetDays > 0 ? '+' : ''}{task.offsetDays} days
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{task.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Estimated: {task.estimatedDuration} minutes
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <Button onClick={addCustomTask} variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Task
                </Button>
              </div>

              {/* Custom Tasks */}
              {customTasks.map((task, index) => (
                <div key={index} className="mt-4 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <Input
                      placeholder="Task title"
                      value={task.title}
                      onChange={(e) => updateCustomTask(index, { title: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Days"
                        value={task.offsetDays}
                        onChange={(e) => updateCustomTask(index, { offsetDays: parseInt(e.target.value) })}
                        className="w-20"
                      />
                      <Select 
                        value={task.priority} 
                        onValueChange={(value) => updateCustomTask(index, { priority: value as any })}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeCustomTask(index)}
                        className="text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    placeholder="Task description"
                    value={task.description}
                    onChange={(e) => updateCustomTask(index, { description: e.target.value })}
                    rows={2}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Reminders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Event Reminders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reminders.map((reminder, index) => (
                  <div key={reminder.id} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <Select 
                      value={reminder.type} 
                      onValueChange={(value) => {
                        const updated = [...reminders];
                        updated[index] = { ...reminder, type: value as any };
                        setReminders(updated);
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="popup">Pop-up</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="desktop">Desktop</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Input
                      type="number"
                      placeholder="Minutes"
                      value={reminder.offset}
                      onChange={(e) => {
                        const updated = [...reminders];
                        updated[index] = { ...reminder, offset: parseInt(e.target.value) };
                        setReminders(updated);
                      }}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-500">before</span>
                    
                    <Input
                      placeholder="Reminder message"
                      value={reminder.message}
                      onChange={(e) => {
                        const updated = [...reminders];
                        updated[index] = { ...reminder, message: e.target.value };
                        setReminders(updated);
                      }}
                      className="flex-1"
                    />
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setReminders(prev => prev.filter(r => r.id !== reminder.id))}
                      className="text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <Button onClick={addReminder} variant="outline" className="w-full mt-3">
                <Plus className="h-4 w-4 mr-2" />
                Add Reminder
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertTriangle className="h-4 w-4" />
              <span>
                {selectedTasks.size + customTasks.length} tasks will be created
              </span>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateEvent} 
                disabled={isCreating || !editedDetails.title}
                className="min-w-32"
              >
                {isCreating ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Create Event
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
