import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Switch } from '../ui/Switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/Dialog';
import { 
  Calendar, 
  Clock, 
  Bell, 
  MessageCircle, 
  Mic, 
  MicOff,
  Paperclip, 
  Plus, 
  Trash2, 
  Settings, 
  FileText,
  Mail,
  Bot,
  Upload,
  Eye,
  Edit3,
  Save
} from 'lucide-react';
import { CalendarEventService } from '../../services/calendar/CalendarEventService';
import { EmailTaggingService } from '../../services/email/EmailTaggingService';
import { EventReminder, TaskDefinition } from '../../services/calendar/EmailEventAnalyzer';
import ReminderWorkflowManager from './ReminderWorkflowManager';

interface CalendarEvent {
  id?: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  eventType: string;
  location?: string;
  attendees?: string[];
  attachments?: FileAttachment[];
  reminders?: EventReminder[];
  tasks?: TaskDefinition[];
  aiSuggestions?: string[];
  voiceNotes?: VoiceNote[];
}

interface FileAttachment {
  id: string;
  name: string;
  type: 'google_drive' | 'outlook' | 'email' | 'local';
  url: string;
  size?: number;
  mimeType?: string;
  source?: string; // email ID or drive folder
}

interface VoiceNote {
  id: string;
  transcript: string;
  audioUrl?: string;
  timestamp: Date;
  processed: boolean;
}

interface AutomationRule {
  id: string;
  name: string;
  keywords: string[];
  emailPattern: string;
  eventType: string;
  defaultReminders: string[];
  autoCreateTasks: boolean;
  reminderTemplate: string;
  active: boolean;
}

export const CalendarIntegrationManager: React.FC = () => {
  const [currentEvent, setCurrentEvent] = useState<CalendarEvent>({
    title: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(),
    eventType: 'client_meeting',
    attachments: [],
    reminders: [],
    tasks: [],
    voiceNotes: []
  });

  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [attachmentDialog, setAttachmentDialog] = useState(false);
  const [automationDialog, setAutomationDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailIntegration, setEmailIntegration] = useState({
    outlook: false,
    gmail: false,
    autoProcess: true
  });

  // Voice Recognition Setup
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        
        handleVoiceInput(transcript);
      };
      
      setRecognition(recognitionInstance);
    }

    loadAutomationRules();
  }, []);

  const loadAutomationRules = async () => {
    // Load saved automation rules
    const defaultRules: AutomationRule[] = [
      {
        id: 'deposition-auto',
        name: 'Deposition Auto-Setup',
        keywords: ['deposition', 'depo', 'examination under oath'],
        emailPattern: 'deposition|depo|examination',
        eventType: 'deposition',
        defaultReminders: ['2 weeks', '1 week', '3 days', '1 day', '2 hours'],
        autoCreateTasks: true,
        reminderTemplate: 'deposition_intensive',
        active: true
      },
      {
        id: 'court-auto',
        name: 'Court Hearing Auto-Setup',
        keywords: ['court', 'hearing', 'trial', 'motion'],
        emailPattern: 'court|hearing|trial|motion',
        eventType: 'court_hearing',
        defaultReminders: ['1 week', '2 days', '1 day', '2 hours'],
        autoCreateTasks: true,
        reminderTemplate: 'court_hearing_standard',
        active: true
      },
      {
        id: 'qme-auto',
        name: 'QME Examination Auto-Setup',
        keywords: ['QME', 'qualified medical evaluator', 'medical examination'],
        emailPattern: 'QME|qualified medical|medical exam',
        eventType: 'qme_exam',
        defaultReminders: ['1 week', '2 days', '1 day', '1 hour'],
        autoCreateTasks: true,
        reminderTemplate: 'qme_exam_comprehensive',
        active: true
      }
    ];
    
    setAutomationRules(defaultRules);
  };

  const handleVoiceInput = (transcript: string) => {
    const voiceNote: VoiceNote = {
      id: Date.now().toString(),
      transcript,
      timestamp: new Date(),
      processed: false
    };

    setCurrentEvent(prev => ({
      ...prev,
      voiceNotes: [...(prev.voiceNotes || []), voiceNote]
    }));

    // Process voice commands
    processVoiceCommand(transcript);
  };

  const processVoiceCommand = async (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('create reminder')) {
      // Extract reminder details from voice
      const timeMatch = lowerCommand.match(/(\d+)\s+(minute|hour|day|week)s?\s+(before|after)/);
      if (timeMatch) {
        const [, amount, unit, timing] = timeMatch;
        const offset = convertToMinutes(parseInt(amount), unit);
        
        // Add reminder
        console.log(`Creating reminder: ${amount} ${unit}s ${timing} event`);
      }
    }
    
    if (lowerCommand.includes('add task')) {
      // Extract task from voice
      const taskMatch = lowerCommand.match(/add task (.+)/);
      if (taskMatch) {
        const taskTitle = taskMatch[1];
        console.log(`Creating task: ${taskTitle}`);
      }
    }

    if (lowerCommand.includes('schedule for')) {
      // Extract date/time from voice
      console.log('Processing schedule command...');
    }
  };

  const convertToMinutes = (amount: number, unit: string): number => {
    switch (unit) {
      case 'minute': return amount;
      case 'hour': return amount * 60;
      case 'day': return amount * 1440;
      case 'week': return amount * 10080;
      default: return amount;
    }
  };

  const startVoiceRecording = () => {
    if (recognition) {
      setIsRecording(true);
      recognition.start();
    }
  };

  const stopVoiceRecording = () => {
    if (recognition) {
      setIsRecording(false);
      recognition.stop();
    }
  };

  const handleFileAttachment = async (type: 'google_drive' | 'outlook' | 'email' | 'local') => {
    setAttachmentDialog(true);
    // Implementation for different attachment types
  };

  const processEmailForCalendar = async (emailContent: string, emailId: string) => {
    setIsLoading(true);
    try {
      const emailTagService = new EmailTaggingService();
      const analysis = await emailTagService.analyzeAndTagEmail({
        id: emailId,
        content: emailContent,
        subject: '',
        sender: '',
        timestamp: new Date(),
        tags: []
      });

      // Check if email matches automation rules
      for (const rule of automationRules.filter(r => r.active)) {
        const regex = new RegExp(rule.emailPattern, 'i');
        if (regex.test(emailContent)) {
          // Auto-create calendar event
          await createEventFromEmail(emailContent, rule);
          break;
        }
      }
    } catch (error) {
      console.error('Failed to process email:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createEventFromEmail = async (emailContent: string, rule: AutomationRule) => {
    // Extract event details from email using AI/pattern matching
    const eventData = extractEventDetailsFromEmail(emailContent);
    
    const newEvent: CalendarEvent = {
      ...eventData,
      eventType: rule.eventType,
      reminders: rule.defaultReminders.map(r => ({
        id: `auto-${Date.now()}`,
        type: 'popup' as const,
        timing: 'before' as const,
        offset: convertToMinutes(parseInt(r.split(' ')[0]), r.split(' ')[1]),
        message: `${rule.name}: ${eventData.title}`
      }))
    };

    setCurrentEvent(newEvent);
    
    // Show AI suggestions
    setShowAIChat(true);
  };

  const extractEventDetailsFromEmail = (content: string) => {
    // AI-powered extraction (simplified for demo)
    const titleMatch = content.match(/RE: (.+)/i) || content.match(/Subject: (.+)/i);
    const dateMatch = content.match(/(\w+day),?\s+(\w+)\s+(\d+),?\s+(\d{4})/i);
    const timeMatch = content.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);

    return {
      title: titleMatch ? titleMatch[1].trim() : 'New Event from Email',
      description: content.substring(0, 500) + '...',
      startDate: dateMatch ? new Date(`${dateMatch[2]} ${dateMatch[3]}, ${dateMatch[4]}`) : new Date(),
      endDate: new Date(Date.now() + 3600000), // 1 hour default
      location: '',
      attendees: []
    };
  };

  const addAutomationRule = () => {
    const newRule: AutomationRule = {
      id: Date.now().toString(),
      name: 'New Rule',
      keywords: [],
      emailPattern: '',
      eventType: 'client_meeting',
      defaultReminders: ['1 day'],
      autoCreateTasks: false,
      reminderTemplate: 'client_meeting_basic',
      active: true
    };
    
    setAutomationRules([...automationRules, newRule]);
  };

  const updateAutomationRule = (id: string, updates: Partial<AutomationRule>) => {
    setAutomationRules(rules => 
      rules.map(rule => rule.id === id ? { ...rule, ...updates } : rule)
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-6">
      {/* Header with Quick Actions */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              Calendar Integration Manager
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={isRecording ? "destructive" : "outline"}
                size="sm"
                onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isRecording ? 'Stop' : 'Voice'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAIChat(true)}
              >
                <Bot className="w-4 h-4 mr-1" />
                AI Assistant
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutomationDialog(true)}
              >
                <Settings className="w-4 h-4 mr-1" />
                Automation
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Main Event Creation Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Event Title</Label>
                <Input
                  value={currentEvent.title}
                  onChange={(e) => setCurrentEvent(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter event title..."
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={currentEvent.description}
                  onChange={(e) => setCurrentEvent(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Event description..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={currentEvent.startDate.toISOString().slice(0, 16)}
                    onChange={(e) => setCurrentEvent(prev => ({ 
                      ...prev, 
                      startDate: new Date(e.target.value) 
                    }))}
                  />
                </div>
                <div>
                  <Label>End Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={currentEvent.endDate.toISOString().slice(0, 16)}
                    onChange={(e) => setCurrentEvent(prev => ({ 
                      ...prev, 
                      endDate: new Date(e.target.value) 
                    }))}
                  />
                </div>
              </div>

              <div>
                <Label>Event Type</Label>
                <Select 
                  value={currentEvent.eventType} 
                  onValueChange={(value) => setCurrentEvent(prev => ({ ...prev, eventType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposition">Deposition</SelectItem>
                    <SelectItem value="court_hearing">Court Hearing</SelectItem>
                    <SelectItem value="qme_exam">QME Examination</SelectItem>
                    <SelectItem value="client_meeting">Client Meeting</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Attachments Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Attachments</Label>
                  <Dialog open={attachmentDialog} onOpenChange={setAttachmentDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Paperclip className="w-4 h-4 mr-1" />
                        Add Attachment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Attachment</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4 p-4">
                        <Button 
                          variant="outline" 
                          onClick={() => handleFileAttachment('google_drive')}
                          className="h-20 flex-col"
                        >
                          <FileText className="w-6 h-6 mb-2" />
                          Google Drive
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => handleFileAttachment('outlook')}
                          className="h-20 flex-col"
                        >
                          <Mail className="w-6 h-6 mb-2" />
                          Outlook
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => handleFileAttachment('email')}
                          className="h-20 flex-col"
                        >
                          <Mail className="w-6 h-6 mb-2" />
                          Email Attachment
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => handleFileAttachment('local')}
                          className="h-20 flex-col"
                        >
                          <Upload className="w-6 h-6 mb-2" />
                          Upload File
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {currentEvent.attachments && currentEvent.attachments.length > 0 && (
                  <div className="space-y-2">
                    {currentEvent.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">{attachment.name}</span>
                          <Badge variant="outline">{attachment.type}</Badge>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Voice Notes */}
              {currentEvent.voiceNotes && currentEvent.voiceNotes.length > 0 && (
                <div className="space-y-2">
                  <Label>Voice Notes</Label>
                  <div className="space-y-2">
                    {currentEvent.voiceNotes.map((note, index) => (
                      <div key={index} className="p-3 bg-blue-50 rounded border">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">
                            <Mic className="w-3 h-3 mr-1" />
                            Voice Note
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {note.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm">{note.transcript}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Reminders and AI */}
        <div className="space-y-6">
          <ReminderWorkflowManager
            eventId={currentEvent.id}
            eventType={currentEvent.eventType}
            eventTitle={currentEvent.title}
            onRemindersUpdated={(reminders) => setCurrentEvent(prev => ({ ...prev, reminders }))}
          />

          {/* AI Chat Integration */}
          {showAIChat && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-green-600" />
                  AI Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-green-700">
                  I can help you optimize this event workflow based on the content and type.
                </div>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Suggest optimal reminders
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Create preparation tasks
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Bell className="w-4 h-4 mr-2" />
                    Setup follow-up workflow
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Email Integration Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Email Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Outlook Integration</Label>
                <Switch 
                  checked={emailIntegration.outlook}
                  onCheckedChange={(checked) => setEmailIntegration(prev => ({ ...prev, outlook: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Gmail Integration</Label>
                <Switch 
                  checked={emailIntegration.gmail}
                  onCheckedChange={(checked) => setEmailIntegration(prev => ({ ...prev, gmail: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Auto-Process Emails</Label>
                <Switch 
                  checked={emailIntegration.autoProcess}
                  onCheckedChange={(checked) => setEmailIntegration(prev => ({ ...prev, autoProcess: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Automation Rules Dialog */}
      <Dialog open={automationDialog} onOpenChange={setAutomationDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Email Automation Rules</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {automationRules.map((rule, index) => (
              <Card key={rule.id} className="border">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Input
                        value={rule.name}
                        onChange={(e) => updateAutomationRule(rule.id, { name: e.target.value })}
                        className="font-medium"
                      />
                      <Switch
                        checked={rule.active}
                        onCheckedChange={(checked) => updateAutomationRule(rule.id, { active: checked })}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Keywords (comma-separated)</Label>
                        <Input
                          value={rule.keywords.join(', ')}
                          onChange={(e) => updateAutomationRule(rule.id, { 
                            keywords: e.target.value.split(',').map(k => k.trim()) 
                          })}
                          placeholder="deposition, depo, hearing"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Email Pattern (regex)</Label>
                        <Input
                          value={rule.emailPattern}
                          onChange={(e) => updateAutomationRule(rule.id, { emailPattern: e.target.value })}
                          placeholder="deposition|hearing|court"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Event Type</Label>
                        <Select 
                          value={rule.eventType} 
                          onValueChange={(value) => updateAutomationRule(rule.id, { eventType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="deposition">Deposition</SelectItem>
                            <SelectItem value="court_hearing">Court Hearing</SelectItem>
                            <SelectItem value="qme_exam">QME Exam</SelectItem>
                            <SelectItem value="client_meeting">Client Meeting</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Reminder Template</Label>
                        <Select 
                          value={rule.reminderTemplate} 
                          onValueChange={(value) => updateAutomationRule(rule.id, { reminderTemplate: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="deposition_intensive">Deposition - Intensive</SelectItem>
                            <SelectItem value="court_hearing_standard">Court - Standard</SelectItem>
                            <SelectItem value="qme_exam_comprehensive">QME - Comprehensive</SelectItem>
                            <SelectItem value="client_meeting_basic">Client - Basic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <Switch
                          checked={rule.autoCreateTasks}
                          onCheckedChange={(checked) => updateAutomationRule(rule.id, { autoCreateTasks: checked })}
                        />
                        <Label className="text-xs">Auto-create tasks</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Button onClick={addAutomationRule} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add New Rule
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline">
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            Cancel
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Calendar className="w-4 h-4 mr-2" />
            Create Event & Workflow
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CalendarIntegrationManager;
