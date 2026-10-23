import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Switch } from '../ui/Switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Alert, AlertDescription } from '../ui/Alert';
import { Progress } from '../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import {
  Calendar,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  BarChart3,
  Bot,
  FileText,
  Users,
  Mail,
  RefreshCw,
  Archive,
  Filter,
  Zap,
  MessageSquare,
  Phone,
  Activity,
  Target,
  TrendingUp,
  Sparkles,
  Brain,
  Globe
} from 'lucide-react';
import { useAuditStore } from '../../store/auditStore';
import { useEmailStore } from '../../store/emailStore';
import { formatDistanceToNow, format } from 'date-fns';

interface UniversalAutomationStats {
  totalProcessed: number;
  emailsProcessed: number;
  eventsCreated: number;
  tasksAutomated: number;
  timesSaved: number; // in minutes
  lastProcessed: Date | null;
  activeAgents: number;
  successRate: number;
}

interface AutomationEvent {
  id: string;
  type: 'email' | 'calendar' | 'task' | 'document' | 'communication';
  action: string;
  subject: string;
  status: 'completed' | 'pending' | 'failed' | 'scheduled';
  profession?: string;
  details: string;
  timestamp: Date;
  timesSaved: number; // minutes
  agentUsed: string;
  metadata?: {
    attachments?: number;
    recipients?: number;
    duplicatesPrevented?: boolean;
    confidenceScore?: number;
  };
}

interface ConversationalCommand {
  command: string;
  description: string;
  examples: string[];
  category: 'communication' | 'calendar' | 'tasks' | 'documents' | 'general';
}

export function UniversalAutomationPanel() {
  const [isAutoEnabled, setIsAutoEnabled] = useState(true);
  const [selectedProfession, setSelectedProfession] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [stats, setStats] = useState<UniversalAutomationStats>({
    totalProcessed: 0,
    emailsProcessed: 0,
    eventsCreated: 0,
    tasksAutomated: 0,
    timesSaved: 0,
    lastProcessed: null,
    activeAgents: 0,
    successRate: 0
  });
  const [recentEvents, setRecentEvents] = useState<AutomationEvent[]>([]);
  const [conversationalCommands] = useState<ConversationalCommand[]>([
    {
      command: "Process my emails and schedule follow-ups",
      description: "Analyzes incoming emails and creates appropriate calendar events or tasks",
      examples: ["Process unread emails", "Handle client inquiries", "Schedule meetings from email requests"],
      category: 'communication'
    },
    {
      command: "Create a client meeting for tomorrow at 2 PM",
      description: "Automatically creates calendar events with appropriate details and invitations",
      examples: ["Schedule team standup", "Book conference room", "Set up client presentation"],
      category: 'calendar'
    },
    {
      command: "Build an agent that tracks project deadlines",
      description: "Creates specialized agents for specific workflow automation",
      examples: ["Create billing reminder agent", "Build document review workflow", "Set up client onboarding process"],
      category: 'general'
    }
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConversationalBuilder, setShowConversationalBuilder] = useState(false);

  const { auditLogs, pendingActions } = useAuditStore();
  const { messages } = useEmailStore();

  // Mock data representing universal automation across professions
  useEffect(() => {
    const mockStats: UniversalAutomationStats = {
      totalProcessed: 156,
      emailsProcessed: 89,
      eventsCreated: 34,
      tasksAutomated: 23,
      timesSaved: 1247, // minutes saved
      lastProcessed: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      activeAgents: 7,
      successRate: 94
    };

    const mockEvents: AutomationEvent[] = [
      {
        id: '1',
        type: 'email',
        action: 'Auto-Response Generated',
        subject: 'Client inquiry about project timeline',
        status: 'completed',
        profession: 'Business Consulting',
        details: 'Analyzed client inquiry, generated personalized response, scheduled follow-up meeting',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        timesSaved: 12,
        agentUsed: 'Communication Agent',
        metadata: {
          recipients: 1,
          attachments: 2,
          confidenceScore: 96
        }
      },
      {
        id: '2',
        type: 'calendar',
        action: 'Meeting Scheduled',
        subject: 'Quarterly review with development team',
        status: 'completed',
        profession: 'Software Development',
        details: 'Created recurring calendar event, invited team members, booked conference room',
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
        timesSaved: 8,
        agentUsed: 'Calendar Agent',
        metadata: {
          recipients: 5,
          duplicatesPrevented: true
        }
      },
      {
        id: '3',
        type: 'document',
        action: 'Contract Review Initiated',
        subject: 'Vendor agreement analysis',
        status: 'pending',
        profession: 'Legal',
        details: 'Analyzing contract terms, identifying key clauses, preparing review summary',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        timesSaved: 45,
        agentUsed: 'Document Agent',
        metadata: {
          attachments: 3,
          confidenceScore: 89
        }
      },
      {
        id: '4',
        type: 'task',
        action: 'Follow-up Tasks Created',
        subject: 'Patient appointment reminders',
        status: 'scheduled',
        profession: 'Healthcare',
        details: 'Generated reminder calls for upcoming appointments, updated patient records',
        timestamp: new Date(Date.now() - 1000 * 60 * 90),
        timesSaved: 25,
        agentUsed: 'Task Agent',
        metadata: {
          recipients: 12
        }
      }
    ];

    setStats(mockStats);
    setRecentEvents(mockEvents);
  }, [pendingActions.length]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'calendar': return <Calendar className="h-4 w-4" />;
      case 'task': return <CheckCircle className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'communication': return <MessageSquare className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const formatTimesSaved = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bot className="h-6 w-6 text-purple-600" />
            Universal Automation Platform
          </h2>
          <p className="text-gray-600 mt-1">
            Cross-profession AI automation for any workflow - build agents by conversation
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={isAutoEnabled}
              onCheckedChange={setIsAutoEnabled}
              id="auto-enabled"
            />
            <label htmlFor="auto-enabled" className="text-sm font-medium">
              Universal Automation {isAutoEnabled ? 'Enabled' : 'Disabled'}
            </label>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConversationalBuilder(!showConversationalBuilder)}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Build Agent
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Conversational Builder */}
      {showConversationalBuilder && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Conversational Agent Builder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-purple-700 mb-4">
              Describe what you want to automate, and I'll build the perfect agent swarm for you:
            </p>
            <div className="space-y-3">
              {conversationalCommands.map((cmd, index) => (
                <div key={index} className="bg-white p-3 rounded-lg border border-purple-200">
                  <div className="font-medium text-purple-900 mb-1">"{cmd.command}"</div>
                  <div className="text-sm text-purple-700 mb-2">{cmd.description}</div>
                  <div className="flex flex-wrap gap-1">
                    {cmd.examples.map((example, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {example}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Start Conversation
              </Button>
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                Voice Commands
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalProcessed}</div>
                <div className="text-sm text-gray-600">Total Automated</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bot className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.activeAgents}</div>
                <div className="text-sm text-gray-600">Active Agents</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{formatTimesSaved(stats.timesSaved)}</div>
                <div className="text-sm text-gray-600">Time Saved</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Target className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.successRate}%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automation Activity */}
      <Tabs defaultValue="recent" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="recent">Recent Activity</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="agents">Active Agents</TabsTrigger>
            <TabsTrigger value="voice">Voice Commands</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Select value={selectedProfession} onValueChange={setSelectedProfession}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Professions</SelectItem>
                <SelectItem value="legal">Legal</SelectItem>
                <SelectItem value="medical">Healthcare</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="consulting">Consulting</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="recent" className="space-y-4">
          {recentEvents
            .filter(event => selectedProfession === 'all' || event.profession?.toLowerCase().includes(selectedProfession))
            .map((event) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getTypeIcon(event.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{event.action}</span>
                        <Badge className={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                        {event.profession && (
                          <Badge variant="outline" className="text-xs">
                            {event.profession}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{event.subject}</div>
                      <div className="text-xs text-gray-500 mb-2">{event.details}</div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {formatTimesSaved(event.timesSaved)} saved
                        </span>
                        <span className="flex items-center gap-1">
                          <Bot className="h-3 w-3" />
                          {event.agentUsed}
                        </span>
                        {event.metadata?.confidenceScore && (
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {event.metadata.confidenceScore}% confidence
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Automation by Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Email Processing</span>
                    <div className="flex items-center gap-2">
                      <Progress value={75} className="w-20" />
                      <span className="text-sm font-medium">75%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Calendar Management</span>
                    <div className="flex items-center gap-2">
                      <Progress value={60} className="w-20" />
                      <span className="text-sm font-medium">60%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Task Automation</span>
                    <div className="flex items-center gap-2">
                      <Progress value={45} className="w-20" />
                      <span className="text-sm font-medium">45%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Document Processing</span>
                    <div className="flex items-center gap-2">
                      <Progress value={30} className="w-20" />
                      <span className="text-sm font-medium">30%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Cross-Profession Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Legal</span>
                    <div className="flex items-center gap-2">
                      <Progress value={85} className="w-20" />
                      <span className="text-sm font-medium">85%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Business</span>
                    <div className="flex items-center gap-2">
                      <Progress value={70} className="w-20" />
                      <span className="text-sm font-medium">70%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Healthcare</span>
                    <div className="flex items-center gap-2">
                      <Progress value={55} className="w-20" />
                      <span className="text-sm font-medium">55%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Consulting</span>
                    <div className="flex items-center gap-2">
                      <Progress value={40} className="w-20" />
                      <span className="text-sm font-medium">40%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Communication Agent', status: 'active', tasks: 34, efficiency: 96 },
              { name: 'Calendar Agent', status: 'active', tasks: 28, efficiency: 94 },
              { name: 'Document Agent', status: 'active', tasks: 19, efficiency: 91 },
              { name: 'Task Agent', status: 'active', tasks: 15, efficiency: 89 },
              { name: 'Research Agent', status: 'idle', tasks: 8, efficiency: 87 },
              { name: 'Monitoring Agent', status: 'active', tasks: 12, efficiency: 93 }
            ].map((agent, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-purple-500" />
                      <span className="font-medium">{agent.name}</span>
                    </div>
                    <Badge className={agent.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {agent.status}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Tasks Completed:</span>
                      <span className="font-medium">{agent.tasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Efficiency:</span>
                      <span className="font-medium">{agent.efficiency}%</span>
                    </div>
                  </div>
                  <Progress value={agent.efficiency} className="mt-3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="voice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Natural Language Commands
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Use these natural language commands to build and control your automation:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Building Agents</h4>
                    <div className="space-y-1 text-sm">
                      <div className="bg-blue-50 p-2 rounded">"Create an agent that handles my email scheduling"</div>
                      <div className="bg-blue-50 p-2 rounded">"Build a workflow for document review and approval"</div>
                      <div className="bg-blue-50 p-2 rounded">"Set up automation for client onboarding process"</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Executing Tasks</h4>
                    <div className="space-y-1 text-sm">
                      <div className="bg-green-50 p-2 rounded">"Process my unread emails and schedule follow-ups"</div>
                      <div className="bg-green-50 p-2 rounded">"Create a meeting for tomorrow at 2 PM with the team"</div>
                      <div className="bg-green-50 p-2 rounded">"Show me today's tasks and update their status"</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Alert */}
      {stats.lastProcessed && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Universal automation is active. Last processed {formatDistanceToNow(stats.lastProcessed, { addSuffix: true })}.
            {stats.activeAgents} agents are currently running across all professions.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 