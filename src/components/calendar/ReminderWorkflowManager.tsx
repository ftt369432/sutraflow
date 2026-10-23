import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Switch } from '../ui/Switch';
import { Clock, Bell, Calendar, Plus, Trash2, Settings } from 'lucide-react';
import { CalendarEventService } from '../../services/calendar/CalendarEventService';
import { EventReminder } from '../../services/calendar/EmailEventAnalyzer';

interface ReminderTemplate {
  id: string;
  name: string;
  eventType: string;
  reminders: Array<{
    type: 'email' | 'popup' | 'desktop' | 'sms';
    timing: 'before' | 'after';
    offset: number; // minutes
    message: string;
    urgency: 'info' | 'warning' | 'urgent' | 'critical';
  }>;
}

interface ReminderWorkflowManagerProps {
  eventId?: string;
  eventType?: string;
  eventTitle?: string;
  onRemindersUpdated?: (reminders: EventReminder[]) => void;
}

export const ReminderWorkflowManager: React.FC<ReminderWorkflowManagerProps> = ({
  eventId,
  eventType = 'client_meeting',
  eventTitle = '',
  onRemindersUpdated
}) => {
  const [templates, setTemplates] = useState<ReminderTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customReminders, setCustomReminders] = useState<EventReminder[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeWorkflows, setActiveWorkflows] = useState<any[]>([]);

  // Predefined workflow templates
  const defaultTemplates: ReminderTemplate[] = [
    {
      id: 'deposition_intensive',
      name: 'Deposition - Intensive Preparation',
      eventType: 'deposition',
      reminders: [
        { type: 'email', timing: 'before', offset: 20160, message: 'Deposition in 2 weeks - Begin case preparation', urgency: 'info' },
        { type: 'email', timing: 'before', offset: 10080, message: 'Deposition in 1 week - Finalize witness prep', urgency: 'warning' },
        { type: 'popup', timing: 'before', offset: 4320, message: 'Deposition in 3 days - Review exhibits', urgency: 'warning' },
        { type: 'popup', timing: 'before', offset: 1440, message: 'Deposition tomorrow - Confirm logistics', urgency: 'urgent' },
        { type: 'desktop', timing: 'before', offset: 120, message: 'Deposition in 2 hours - Final preparation', urgency: 'critical' },
        { type: 'email', timing: 'after', offset: 1440, message: 'Follow-up: Review deposition transcript', urgency: 'info' }
      ]
    },
    {
      id: 'court_hearing_standard',
      name: 'Court Hearing - Standard Protocol',
      eventType: 'court_hearing',
      reminders: [
        { type: 'email', timing: 'before', offset: 10080, message: 'Court hearing in 1 week - Prepare briefs', urgency: 'warning' },
        { type: 'popup', timing: 'before', offset: 2880, message: 'Court hearing in 2 days - Review strategy', urgency: 'urgent' },
        { type: 'popup', timing: 'before', offset: 1440, message: 'Court hearing tomorrow - Confirm appearance', urgency: 'urgent' },
        { type: 'desktop', timing: 'before', offset: 120, message: 'Court hearing in 2 hours - Final review', urgency: 'critical' },
        { type: 'popup', timing: 'after', offset: 240, message: 'Follow-up: Document hearing outcome', urgency: 'warning' }
      ]
    },
    {
      id: 'qme_exam_comprehensive',
      name: 'QME Examination - Comprehensive',
      eventType: 'qme_exam',
      reminders: [
        { type: 'email', timing: 'before', offset: 10080, message: 'QME exam in 1 week - Prepare medical records', urgency: 'info' },
        { type: 'popup', timing: 'before', offset: 2880, message: 'QME exam in 2 days - Review medical history', urgency: 'warning' },
        { type: 'popup', timing: 'before', offset: 1440, message: 'QME exam tomorrow - Confirm appointment', urgency: 'urgent' },
        { type: 'desktop', timing: 'before', offset: 60, message: 'QME exam in 1 hour - Time to leave', urgency: 'critical' },
        { type: 'email', timing: 'after', offset: 1440, message: 'Follow-up: Request QME medical report', urgency: 'warning' }
      ]
    },
    {
      id: 'deadline_escalating',
      name: 'Legal Deadline - Escalating Alerts',
      eventType: 'deadline',
      reminders: [
        { type: 'email', timing: 'before', offset: 10080, message: 'Deadline in 1 week - Begin preparation', urgency: 'info' },
        { type: 'popup', timing: 'before', offset: 4320, message: 'Deadline in 3 days - Progress check', urgency: 'warning' },
        { type: 'popup', timing: 'before', offset: 1440, message: 'Deadline tomorrow - Final review', urgency: 'urgent' },
        { type: 'desktop', timing: 'before', offset: 240, message: 'Deadline in 4 hours - Complete immediately', urgency: 'critical' },
        { type: 'desktop', timing: 'before', offset: 60, message: 'FINAL WARNING: Deadline in 1 hour', urgency: 'critical' }
      ]
    },
    {
      id: 'client_meeting_basic',
      name: 'Client Meeting - Basic',
      eventType: 'client_meeting',
      reminders: [
        { type: 'email', timing: 'before', offset: 2880, message: 'Client meeting in 2 days - Prepare agenda', urgency: 'info' },
        { type: 'popup', timing: 'before', offset: 1440, message: 'Client meeting tomorrow - Review case file', urgency: 'warning' },
        { type: 'desktop', timing: 'before', offset: 60, message: 'Client meeting in 1 hour - Gather materials', urgency: 'urgent' },
        { type: 'email', timing: 'after', offset: 240, message: 'Follow-up: Send meeting summary to client', urgency: 'warning' }
      ]
    }
  ];

  useEffect(() => {
    setTemplates(defaultTemplates);
    loadActiveWorkflows();
  }, [eventId]);

  const loadActiveWorkflows = async () => {
    if (!eventId) return;
    
    try {
      // Load active reminder workflows for this event
      // This would integrate with your reminder service
      setActiveWorkflows([]);
    } catch (error) {
      console.error('Failed to load active workflows:', error);
    }
  };

  const applyTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template || !eventId) return;

    setIsLoading(true);
    try {
      const calendarService = new CalendarEventService(
        {
          createEvent: async (event: any) => `event-${Date.now()}`,
          updateEvent: async (id: string, updates: any) => {},
          deleteEvent: async (id: string) => {},
          getEvents: async (start: Date, end: Date) => []
        },
        {
          scheduleReminder: async (reminder: any, eventId?: string) => `reminder-${Date.now()}`,
          cancelReminder: async (id: string) => {},
          updateReminder: async (id: string, updates: any) => {},
          getActiveReminders: async () => []
        }
      );
      const reminders: EventReminder[] = template.reminders.map((r, index) => ({
        id: `${eventId}-${r.type}-${r.offset}-${index}`,
        type: r.type,
        timing: r.timing,
        offset: r.offset,
        message: r.message.replace('{eventTitle}', eventTitle),
        eventId,
        urgency: r.urgency
      }));

      // Apply the reminder workflow
      for (const reminder of reminders) {
        // Schedule each reminder
        console.log('Scheduling reminder:', reminder);
      }

      setCustomReminders(reminders);
      onRemindersUpdated?.(reminders);
      
      // Show success notification
      console.log(`Applied ${template.name} workflow with ${reminders.length} reminders`);
    } catch (error) {
      console.error('Failed to apply template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addCustomReminder = () => {
    const newReminder: EventReminder = {
      id: `custom-${Date.now()}`,
      type: 'popup',
      timing: 'before',
      offset: 1440, // 1 day default
      message: '',
      eventId: eventId || '',
      urgency: 'info'
    };
    setCustomReminders([...customReminders, newReminder]);
  };

  const updateCustomReminder = (index: number, field: string, value: any) => {
    const updated = [...customReminders];
    updated[index] = { ...updated[index], [field]: value };
    setCustomReminders(updated);
  };

  const removeCustomReminder = (index: number) => {
    setCustomReminders(customReminders.filter((_, i) => i !== index));
  };

  const formatOffset = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days} days`;
    }
    return hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Reminder Workflow Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Quick Setup - Choose a Template</Label>
            <div className="flex gap-2">
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a reminder workflow template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.reminders.length} reminders)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={() => selectedTemplate && applyTemplate(selectedTemplate)}
                disabled={!selectedTemplate || isLoading}
              >
                Apply Template
              </Button>
            </div>
          </div>

          {/* Template Preview */}
          {selectedTemplate && (
            <Card className="bg-gray-50">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Template Preview:</Label>
                  {templates.find(t => t.id === selectedTemplate)?.reminders.map((reminder, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getUrgencyColor(reminder.urgency)}>
                          {reminder.urgency}
                        </Badge>
                        <span className="text-sm">
                          {reminder.type} {reminder.timing} event ({formatOffset(reminder.offset)})
                        </span>
                      </div>
                      <span className="text-xs text-gray-600 truncate max-w-xs">
                        {reminder.message}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Custom Reminders */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Custom Reminders</Label>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowCustomForm(!showCustomForm)}
              >
                <Settings className="w-4 h-4 mr-1" />
                {showCustomForm ? 'Hide' : 'Show'} Custom Setup
              </Button>
            </div>

            {showCustomForm && (
              <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                <Button 
                  variant="outline" 
                  onClick={addCustomReminder}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Custom Reminder
                </Button>

                {customReminders.map((reminder, index) => (
                  <Card key={index} className="bg-white">
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Reminder #{index + 1}</Label>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeCustomReminder(index)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Type</Label>
                          <Select 
                            value={reminder.type} 
                            onValueChange={(value) => updateCustomReminder(index, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="popup">Pop-up</SelectItem>
                              <SelectItem value="desktop">Desktop</SelectItem>
                              <SelectItem value="sms">SMS</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs">Timing</Label>
                          <Select 
                            value={reminder.timing} 
                            onValueChange={(value) => updateCustomReminder(index, 'timing', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="before">Before Event</SelectItem>
                              <SelectItem value="after">After Event</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs">Offset (minutes)</Label>
                          <Input 
                            type="number"
                            value={reminder.offset}
                            onChange={(e) => updateCustomReminder(index, 'offset', parseInt(e.target.value))}
                            placeholder="1440"
                          />
                        </div>

                        <div>
                          <Label className="text-xs">Urgency</Label>
                          <Select 
                            value={reminder.urgency || 'info'} 
                            onValueChange={(value) => updateCustomReminder(index, 'urgency', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="info">Info</SelectItem>
                              <SelectItem value="warning">Warning</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Message</Label>
                        <Input 
                          value={reminder.message}
                          onChange={(e) => updateCustomReminder(index, 'message', e.target.value)}
                          placeholder="Reminder message..."
                        />
                      </div>

                      <div className="text-xs text-gray-600">
                        Preview: {reminder.type} reminder {formatOffset(reminder.offset)} {reminder.timing} the event
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Active Workflows Summary */}
          {customReminders.length > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                  <Label className="text-green-800">Active Reminder Workflow</Label>
                </div>
                <div className="text-sm text-green-700">
                  {customReminders.length} reminders configured for this event.
                  Next reminder: {customReminders.length > 0 ? formatOffset(Math.min(...customReminders.map(r => r.offset))) + ' before event' : 'None'}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReminderWorkflowManager;
