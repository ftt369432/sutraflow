import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Badge } from '../ui/Badge';
import { 
  Calendar, 
  Mail, 
  Bot, 
  CheckCircle, 
  Clock, 
  FileText,
  Settings,
  PlayCircle,
  Activity
} from 'lucide-react';
import CalendarIntegrationManager from '../calendar/CalendarIntegrationManager';
import ReminderWorkflowManager from '../calendar/ReminderWorkflowManager';
import AIWorkflowChat from '../ai/AIWorkflowChat';

// Sample data for testing
const sampleEmailContent = `
Subject: URGENT: Deposition Notice - Johnson v. Smith Case

Dear Attorney,

This email serves as formal notice that the deposition of John Johnson is scheduled for:

Date: September 23, 2025
Time: 1:30 PM Pacific Time
Location: 123 Legal Plaza, Conference Room B, Los Angeles, CA

The deposition is expected to last approximately 4-6 hours. Please bring all relevant documents including:
- Medical records from 2023-2024
- Expert witness reports
- Correspondence with opposing counsel

Court reporter: Sarah Williams
Video technician: Mike Chen

Please confirm your attendance and let us know if you need any special accommodations.

This is a critical deposition for our case. Please ensure all preparation is completed prior to the date.

Best regards,
Jordan Vance
Senior Partner
Pacific Law & Advisory Group
`;

const sampleEventData = {
  id: 'test-event-1',
  title: 'Deposition - Johnson v. Smith',
  description: 'Critical deposition for personal injury case',
  startDate: new Date('2025-09-23T13:30:00'),
  endDate: new Date('2025-09-23T19:30:00'),
  eventType: 'deposition',
  location: '123 Legal Plaza, Conference Room B',
  attendees: ['john.johnson@email.com', 'opposing.counsel@lawfirm.com']
};

interface TestResult {
  component: string;
  test: string;
  status: 'pass' | 'fail' | 'pending';
  details: string;
}

export const WorkflowSystemDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [workflowStats, setWorkflowStats] = useState({
    eventsCreated: 0,
    remindersScheduled: 0,
    tasksGenerated: 0,
    emailsProcessed: 0,
    automationRulesActive: 3
  });

  const runSystemTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);

    const tests: TestResult[] = [
      {
        component: 'Calendar Integration',
        test: 'Event Creation with Multiple Reminders',
        status: 'pending',
        details: 'Testing calendar event creation with multi-stage reminder workflow'
      },
      {
        component: 'Email Analysis',
        test: 'Extract Event Details from Email',
        status: 'pending',
        details: 'Testing AI extraction of dates, times, and participants from email content'
      },
      {
        component: 'Reminder System',
        test: 'Multi-Stage Reminder Templates',
        status: 'pending',
        details: 'Testing deposition, court hearing, and QME reminder templates'
      },
      {
        component: 'AI Assistant',
        test: 'Workflow Suggestions and Automation',
        status: 'pending',
        details: 'Testing AI-powered workflow optimization and automation recommendations'
      },
      {
        component: 'Voice Controls',
        test: 'Speech Recognition and Voice Commands',
        status: 'pending',
        details: 'Testing voice input for creating reminders and scheduling events'
      },
      {
        component: 'File Attachments',
        test: 'Multi-Source Attachment Integration',
        status: 'pending',
        details: 'Testing Google Drive, Outlook, and email attachment integration'
      }
    ];

    // Simulate test execution
    for (let i = 0; i < tests.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      tests[i].status = Math.random() > 0.2 ? 'pass' : 'fail';
      tests[i].details += tests[i].status === 'pass' 
        ? ' - ✅ Test completed successfully'
        : ' - ❌ Test failed - see console for details';
      
      setTestResults([...tests]);
    }

    // Update stats
    setWorkflowStats(prev => ({
      ...prev,
      eventsCreated: prev.eventsCreated + 1,
      remindersScheduled: prev.remindersScheduled + 5,
      tasksGenerated: prev.tasksGenerated + 7,
      emailsProcessed: prev.emailsProcessed + 1
    }));

    setIsRunningTests(false);
  };

  const handleWorkflowAction = (action: any) => {
    console.log('Workflow action executed:', action);
    
    // Update stats based on action
    setWorkflowStats(prev => ({
      ...prev,
      remindersScheduled: action.type === 'create_reminder' ? prev.remindersScheduled + 1 : prev.remindersScheduled,
      tasksGenerated: action.type === 'create_task' ? prev.tasksGenerated + 1 : prev.tasksGenerated,
      eventsCreated: action.type === 'schedule_event' ? prev.eventsCreated + 1 : prev.eventsCreated
    }));
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold">Comprehensive Workflow System Demo</h1>
                <p className="text-gray-600 text-sm">
                  Multi-reminder calendar integration with AI automation, voice controls, and email processing
                </p>
              </div>
            </div>
            <Button onClick={runSystemTests} disabled={isRunningTests}>
              <PlayCircle className="w-4 h-4 mr-2" />
              {isRunningTests ? 'Running Tests...' : 'Run System Tests'}
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Calendar className="w-8 h-8 mx-auto text-blue-600 mb-2" />
            <div className="text-2xl font-bold">{workflowStats.eventsCreated}</div>
            <div className="text-sm text-gray-600">Events Created</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="w-8 h-8 mx-auto text-green-600 mb-2" />
            <div className="text-2xl font-bold">{workflowStats.remindersScheduled}</div>
            <div className="text-sm text-gray-600">Reminders Scheduled</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-8 h-8 mx-auto text-purple-600 mb-2" />
            <div className="text-2xl font-bold">{workflowStats.tasksGenerated}</div>
            <div className="text-sm text-gray-600">Tasks Generated</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Mail className="w-8 h-8 mx-auto text-orange-600 mb-2" />
            <div className="text-2xl font-bold">{workflowStats.emailsProcessed}</div>
            <div className="text-sm text-gray-600">Emails Processed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Settings className="w-8 h-8 mx-auto text-red-600 mb-2" />
            <div className="text-2xl font-bold">{workflowStats.automationRulesActive}</div>
            <div className="text-sm text-gray-600">Automation Rules</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calendar">Calendar Integration</TabsTrigger>
          <TabsTrigger value="reminders">Reminder Workflows</TabsTrigger>
          <TabsTrigger value="ai-assistant">AI Assistant</TabsTrigger>
          <TabsTrigger value="test-results">Test Results</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Architecture Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Calendar Integration
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Multi-source calendar event creation with Google Drive, Outlook, and email attachment support
                  </p>
                  <div className="mt-3 space-y-1">
                    <Badge variant="outline">Event Creation</Badge>
                    <Badge variant="outline">Multi-Attachments</Badge>
                    <Badge variant="outline">Voice Input</Badge>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-green-600" />
                    Multi-Stage Reminders
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Intelligent reminder workflows with escalating urgency levels and multiple communication channels
                  </p>
                  <div className="mt-3 space-y-1">
                    <Badge variant="outline">Email Reminders</Badge>
                    <Badge variant="outline">Pop-up Alerts</Badge>
                    <Badge variant="outline">Desktop Notifications</Badge>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Bot className="w-5 h-5 text-purple-600" />
                    AI Automation
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Smart email analysis, workflow optimization, and automated task generation
                  </p>
                  <div className="mt-3 space-y-1">
                    <Badge variant="outline">Email Analysis</Badge>
                    <Badge variant="outline">Workflow Suggestions</Badge>
                    <Badge variant="outline">Task Automation</Badge>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Sample Email Processing Demo</h4>
                <div className="bg-white p-3 rounded border text-sm">
                  <div className="font-medium mb-2">Input: Legal Email</div>
                  <div className="text-gray-600 max-h-32 overflow-y-auto">
                    {sampleEmailContent.substring(0, 300)}...
                  </div>
                </div>
                <div className="mt-3 text-sm text-blue-700">
                  ✅ Automatically detected: Deposition event, extracted date/time, identified participants, 
                  suggested 5-stage reminder workflow, created 7 preparation tasks
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Integration Tab */}
        <TabsContent value="calendar">
          <CalendarIntegrationManager />
        </TabsContent>

        {/* Reminder Workflows Tab */}
        <TabsContent value="reminders">
          <ReminderWorkflowManager
            eventId={sampleEventData.id}
            eventType={sampleEventData.eventType}
            eventTitle={sampleEventData.title}
            onRemindersUpdated={(reminders) => {
              console.log('Reminders updated:', reminders);
              setWorkflowStats(prev => ({ ...prev, remindersScheduled: reminders.length }));
            }}
          />
        </TabsContent>

        {/* AI Assistant Tab */}
        <TabsContent value="ai-assistant">
          <AIWorkflowChat
            eventData={sampleEventData}
            emailContext={sampleEmailContent}
            onActionExecuted={handleWorkflowAction}
            onWorkflowSuggested={(workflow) => {
              console.log('Workflow suggested:', workflow);
            }}
          />
        </TabsContent>

        {/* Test Results Tab */}
        <TabsContent value="test-results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No tests run yet. Click "Run System Tests" to begin.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="mt-1">
                        {result.status === 'pass' && <CheckCircle className="w-5 h-5 text-green-600" />}
                        {result.status === 'fail' && <Clock className="w-5 h-5 text-red-600" />}
                        {result.status === 'pending' && <Clock className="w-5 h-5 text-yellow-600 animate-spin" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{result.component} - {result.test}</div>
                        <div className="text-sm text-gray-600 mt-1">{result.details}</div>
                      </div>
                      <Badge 
                        variant={result.status === 'pass' ? 'default' : result.status === 'fail' ? 'destructive' : 'secondary'}
                      >
                        {result.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkflowSystemDemo;
