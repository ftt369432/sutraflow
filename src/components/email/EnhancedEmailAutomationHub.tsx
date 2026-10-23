import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, 
  Calendar, 
  Zap, 
  BarChart3, 
  Settings, 
  Scale, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Eye,
  Play,
  Pause,
  Mic,
  FileText,
  Briefcase,
  ChevronRight,
  Target,
  TrendingUp,
  Mail,
  Archive,
  Send,
  Filter,
  Search,
  MessageSquare,
  Phone,
  Calendar as CalendarIcon,
  User,
  Building,
  Gavel,
  Heart,
  DollarSign,
  Shield,
  Database,
  Workflow,
  Puzzle,
  Plus,
  Minus,
  Settings2,
  Activity,
  Cpu,
  Network,
  Layers
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Switch } from '../ui/Switch';
import { Label } from '../ui/Label';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { toast } from 'sonner';
import { useEmail } from '../../contexts/EmailContext';
import { useAuth } from '../../contexts/AuthContext';

interface AutomationStats {
  calendarEventsCreated: number;
  tasksAutomated: number;
  duplicatesPrevented: number;
  legalCasesProcessed: number;
  voiceCommandsUsed: number;
  wcabHearingsScheduled: number;
  totalTimesSaved: number;
  successRate: number;
  emailsProcessed: number;
  responsesGenerated: number;
  meetingsScheduled: number;
  followUpsCreated: number;
}

interface AgentCapability {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'communication' | 'scheduling' | 'legal' | 'analysis' | 'automation';
  isActive: boolean;
  isAttached: boolean;
  dependencies?: string[];
  metrics: {
    tasksCompleted: number;
    successRate: number;
    lastActivity: Date;
  };
}

interface ModularAgent {
  id: string;
  name: string;
  type: 'email' | 'calendar' | 'legal' | 'wcab' | 'task' | 'voice' | 'universal';
  status: 'active' | 'paused' | 'training' | 'error';
  capabilities: AgentCapability[];
  icon: React.ReactNode;
  metrics: {
    totalTasks: number;
    successRate: number;
    avgResponseTime: number;
    lastActivity: Date;
  };
}

interface EnhancedEmailAutomationHubProps {
  selectedEmails: string[];
  onAnalyzeEmails: () => void;
  onVoiceCommand: (command: string) => void;
  className?: string;
}

export function EnhancedEmailAutomationHub({
  selectedEmails,
  onAnalyzeEmails,
  onVoiceCommand,
  className
}: EnhancedEmailAutomationHubProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { accounts, messages, loading } = useEmail();
  
  const [automationStats, setAutomationStats] = useState<AutomationStats>({
    calendarEventsCreated: 24,
    tasksAutomated: 51,
    duplicatesPrevented: 7,
    legalCasesProcessed: 13,
    voiceCommandsUsed: 8,
    wcabHearingsScheduled: 6,
    totalTimesSaved: 180,
    successRate: 94,
    emailsProcessed: 142,
    responsesGenerated: 38,
    meetingsScheduled: 15,
    followUpsCreated: 22
  });

  const [agents, setAgents] = useState<ModularAgent[]>([
    {
      id: 'universal-email-agent',
      name: 'Universal Email Agent',
      type: 'email',
      status: 'active',
      icon: <Mail className="h-4 w-4" />,
      capabilities: [
        {
          id: 'auto-response',
          name: 'Auto Response',
          description: 'Automatically generate contextual email responses',
          icon: <Send className="h-3 w-3" />,
          category: 'communication',
          isActive: true,
          isAttached: true,
          metrics: { tasksCompleted: 28, successRate: 96, lastActivity: new Date() }
        },
        {
          id: 'email-categorization',
          name: 'Email Categorization',
          description: 'Automatically categorize incoming emails',
          icon: <Filter className="h-3 w-3" />,
          category: 'analysis',
          isActive: true,
          isAttached: true,
          metrics: { tasksCompleted: 142, successRate: 98, lastActivity: new Date() }
        },
        {
          id: 'priority-detection',
          name: 'Priority Detection',
          description: 'Identify urgent emails and set priorities',
          icon: <AlertTriangle className="h-3 w-3" />,
          category: 'analysis',
          isActive: true,
          isAttached: true,
          metrics: { tasksCompleted: 67, successRate: 93, lastActivity: new Date() }
        }
      ],
      metrics: {
        totalTasks: 237,
        successRate: 96,
        avgResponseTime: 2.3,
        lastActivity: new Date()
      }
    },
    {
      id: 'universal-calendar-agent',
      name: 'Universal Calendar Agent',
      type: 'calendar',
      status: 'active',
      icon: <Calendar className="h-4 w-4" />,
      capabilities: [
        {
          id: 'meeting-detection',
          name: 'Meeting Detection',
          description: 'Detect meeting requests in emails',
          icon: <Search className="h-3 w-3" />,
          category: 'scheduling',
          isActive: true,
          isAttached: true,
          metrics: { tasksCompleted: 24, successRate: 100, lastActivity: new Date() }
        },
        {
          id: 'auto-scheduling',
          name: 'Auto Scheduling',
          description: 'Automatically schedule meetings based on availability',
          icon: <Calendar className="h-3 w-3" />,
          category: 'scheduling',
          isActive: true,
          isAttached: true,
          metrics: { tasksCompleted: 15, successRate: 95, lastActivity: new Date() }
        },
        {
          id: 'conflict-detection',
          name: 'Conflict Detection',
          description: 'Detect and resolve scheduling conflicts',
          icon: <AlertTriangle className="h-3 w-3" />,
          category: 'scheduling',
          isActive: true,
          isAttached: true,
          metrics: { tasksCompleted: 8, successRate: 100, lastActivity: new Date() }
        }
      ],
      metrics: {
        totalTasks: 47,
        successRate: 98,
        avgResponseTime: 1.8,
        lastActivity: new Date()
      }
    },
    {
      id: 'legal-assistant-agent',
      name: 'Legal Assistant Agent',
      type: 'legal',
      status: 'active',
      icon: <Scale className="h-4 w-4" />,
      capabilities: [
        {
          id: 'case-analysis',
          name: 'Case Analysis',
          description: 'Analyze legal documents and case information',
          icon: <FileText className="h-3 w-3" />,
          category: 'legal',
          isActive: true,
          isAttached: true,
          metrics: { tasksCompleted: 13, successRate: 100, lastActivity: new Date() }
        },
        {
          id: 'deadline-tracking',
          name: 'Deadline Tracking',
          description: 'Track legal deadlines and court dates',
          icon: <Clock className="h-3 w-3" />,
          category: 'legal',
          isActive: true,
          isAttached: true,
          metrics: { tasksCompleted: 18, successRate: 100, lastActivity: new Date() }
        },
        {
          id: 'document-generation',
          name: 'Document Generation',
          description: 'Generate legal documents and forms',
          icon: <FileText className="h-3 w-3" />,
          category: 'legal',
          isActive: false,
          isAttached: true,
          metrics: { tasksCompleted: 6, successRate: 92, lastActivity: new Date() }
        }
      ],
      metrics: {
        totalTasks: 37,
        successRate: 97,
        avgResponseTime: 3.2,
        lastActivity: new Date()
      }
    },
    {
      id: 'wcab-automation-agent',
      name: 'WCAB Automation Agent',
      type: 'wcab',
      status: 'active',
      icon: <Briefcase className="h-4 w-4" />,
      capabilities: [
        {
          id: 'hearing-scheduling',
          name: 'Hearing Scheduling',
          description: 'Automatically schedule WCAB hearings',
          icon: <Calendar className="h-3 w-3" />,
          category: 'scheduling',
          isActive: true,
          isAttached: true,
          metrics: { tasksCompleted: 6, successRate: 100, lastActivity: new Date() }
        },
        {
          id: 'case-preparation',
          name: 'Case Preparation',
          description: 'Prepare case documents for hearings',
          icon: <FileText className="h-3 w-3" />,
          category: 'legal',
          isActive: true,
          isAttached: true,
          metrics: { tasksCompleted: 8, successRate: 100, lastActivity: new Date() }
        }
      ],
      metrics: {
        totalTasks: 14,
        successRate: 100,
        avgResponseTime: 2.1,
        lastActivity: new Date()
      }
    }
  ]);

  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<ModularAgent | null>(null);
  const [showCapabilityManager, setShowCapabilityManager] = useState(false);

  // Available capabilities that can be attached to agents
  const availableCapabilities: AgentCapability[] = [
    {
      id: 'sentiment-analysis',
      name: 'Sentiment Analysis',
      description: 'Analyze emotional tone of emails',
      icon: <Heart className="h-3 w-3" />,
      category: 'analysis',
      isActive: false,
      isAttached: false,
      metrics: { tasksCompleted: 0, successRate: 0, lastActivity: new Date() }
    },
    {
      id: 'translation',
      name: 'Translation',
      description: 'Translate emails between languages',
      icon: <MessageSquare className="h-3 w-3" />,
      category: 'communication',
      isActive: false,
      isAttached: false,
      metrics: { tasksCompleted: 0, successRate: 0, lastActivity: new Date() }
    },
    {
      id: 'expense-tracking',
      name: 'Expense Tracking',
      description: 'Track billable hours and expenses',
      icon: <DollarSign className="h-3 w-3" />,
      category: 'legal',
      isActive: false,
      isAttached: false,
      metrics: { tasksCompleted: 0, successRate: 0, lastActivity: new Date() }
    },
    {
      id: 'compliance-check',
      name: 'Compliance Check',
      description: 'Ensure emails meet regulatory requirements',
      icon: <Shield className="h-3 w-3" />,
      category: 'legal',
      isActive: false,
      isAttached: false,
      metrics: { tasksCompleted: 0, successRate: 0, lastActivity: new Date() }
    }
  ];

  // Update automation stats with live data
  useEffect(() => {
    const updateStats = () => {
      if (messages.length > 0) {
        setAutomationStats(prev => ({
          ...prev,
          emailsProcessed: messages.length,
          lastUpdate: new Date()
        }));
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [messages]);

  const handleVoiceToggle = useCallback(() => {
    setIsVoiceListening(!isVoiceListening);
    if (!isVoiceListening) {
      toast.info('🎤 Voice commands activated');
      setTimeout(() => setIsVoiceListening(false), 30000);
    } else {
      toast.info('🎤 Voice commands deactivated');
    }
  }, [isVoiceListening]);

  const handleAttachCapability = useCallback((agentId: string, capability: AgentCapability) => {
    setAgents(prev => prev.map(agent => {
      if (agent.id === agentId) {
        return {
          ...agent,
          capabilities: [...agent.capabilities, { ...capability, isAttached: true }]
        };
      }
      return agent;
    }));
    
    toast.success(`✅ Attached ${capability.name} to ${agents.find(a => a.id === agentId)?.name}`);
  }, [agents]);

  const handleDetachCapability = useCallback((agentId: string, capabilityId: string) => {
    setAgents(prev => prev.map(agent => {
      if (agent.id === agentId) {
        return {
          ...agent,
          capabilities: agent.capabilities.filter(cap => cap.id !== capabilityId)
        };
      }
      return agent;
    }));
    
    toast.success(`➖ Detached capability from agent`);
  }, []);

  const handleToggleCapability = useCallback((agentId: string, capabilityId: string) => {
    setAgents(prev => prev.map(agent => {
      if (agent.id === agentId) {
        return {
          ...agent,
          capabilities: agent.capabilities.map(cap => 
            cap.id === capabilityId ? { ...cap, isActive: !cap.isActive } : cap
          )
        };
      }
      return agent;
    }));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'training': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'communication': return 'bg-blue-100 text-blue-800';
      case 'scheduling': return 'bg-green-100 text-green-800';
      case 'legal': return 'bg-purple-100 text-purple-800';
      case 'analysis': return 'bg-orange-100 text-orange-800';
      case 'automation': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const efficiencyScore = Math.round(automationStats.successRate);
  const timesSavedHours = Math.round(automationStats.totalTimesSaved / 60 * 10) / 10;

  return (
    <div className={`w-80 automation-hub border-l overflow-y-auto ${className}`}>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xl flex items-center gap-2 text-gray-900">
            <Bot className="h-6 w-6 text-blue-600" />
            Automation Hub
          </h3>
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate('/automation-dashboard')}
              variant="outline" 
              size="sm"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button 
              onClick={() => setShowCapabilityManager(!showCapabilityManager)}
              variant="outline" 
              size="sm"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Live Stats */}
        <Card className="card-metallic">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
              <Activity className="h-5 w-5 text-blue-600" />
              Live Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{automationStats.emailsProcessed}</div>
                <div className="text-sm font-medium text-gray-700">Emails Processed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{automationStats.tasksAutomated}</div>
                <div className="text-sm font-medium text-gray-700">Tasks Automated</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{automationStats.meetingsScheduled}</div>
                <div className="text-sm font-medium text-gray-700">Meetings Scheduled</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{automationStats.responsesGenerated}</div>
                <div className="text-sm font-medium text-gray-700">Responses Generated</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-base font-medium text-gray-700">
                <span>Efficiency Score</span>
                <span className="font-bold text-blue-600">{efficiencyScore}%</span>
              </div>
              <Progress value={efficiencyScore} className="h-3 progress-metallic" />
              
              <div className="flex justify-between text-base font-medium text-gray-700">
                <span>Time Saved Today</span>
                <span className="font-bold text-green-600">{timesSavedHours}h</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Tabs defaultValue="agents" className="w-full tabs-metallic">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1">
            <TabsTrigger value="agents" className="tab-trigger text-sm font-medium">Agents</TabsTrigger>
            <TabsTrigger value="capabilities" className="tab-trigger text-sm font-medium">Capabilities</TabsTrigger>
            <TabsTrigger value="controls" className="tab-trigger text-sm font-medium">Controls</TabsTrigger>
          </TabsList>
          
          <TabsContent value="agents" className="space-y-4">
            {/* Modular Agents */}
            <Card className="card-metallic">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
                  <Network className="h-5 w-5 text-blue-600" />
                  Modular Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agents.map((agent) => (
                    <div key={agent.id} className="agent-card p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-blue-600">{agent.icon}</span>
                          <span className="font-semibold text-base text-gray-900">{agent.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getStatusColor(agent.status)} font-medium`}>
                            {agent.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedAgent(selectedAgent?.id === agent.id ? null : agent)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm font-medium text-gray-700 mb-3">
                        <span>{agent.metrics.totalTasks} tasks</span>
                        <span className="text-green-600">{agent.metrics.successRate}% success</span>
                        <span>{agent.metrics.avgResponseTime}s avg</span>
                      </div>
                      
                      {/* Capabilities */}
                      <div className="flex flex-wrap gap-2">
                        {agent.capabilities.map((capability) => (
                          <div key={capability.id} className="flex items-center gap-2">
                            <Badge 
                              className={`text-sm font-medium px-3 py-1 ${getCategoryColor(capability.category)} ${
                                capability.isActive ? 'opacity-100' : 'opacity-60'
                              }`}
                            >
                              {capability.icon}
                              <span className="ml-1">{capability.name}</span>
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 hover:bg-gray-200"
                              onClick={() => handleToggleCapability(agent.id, capability.id)}
                            >
                              {capability.isActive ? (
                                <Pause className="h-3 w-3" />
                              ) : (
                                <Play className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                      
                      {/* Agent Configuration Panel */}
                      {selectedAgent?.id === agent.id && (
                        <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                          <h4 className="font-semibold text-base text-gray-800 mb-3">Agent Configuration</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Auto-execute actions</span>
                              <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Learning mode</span>
                              <Switch />
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="font-medium">
                                <Plus className="h-4 w-4 mr-1" />
                                Add Capability
                              </Button>
                              <Button size="sm" variant="outline" className="font-medium">
                                <Cpu className="h-4 w-4 mr-1" />
                                Train
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="capabilities" className="space-y-3">
            {/* Capability Manager */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Layers className="h-4 w-4 text-orange-600" />
                  Capability Library
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {availableCapabilities.map((capability) => (
                    <div key={capability.id} className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex items-center gap-2">
                        {capability.icon}
                        <div>
                          <span className="font-medium text-sm">{capability.name}</span>
                          <p className="text-xs text-muted-foreground">{capability.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getCategoryColor(capability.category)}>
                          {capability.category}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Show agent selection modal
                            toast.info('Select an agent to attach this capability');
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="controls" className="space-y-3">
            {/* Voice Commands */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Mic className="h-4 w-4 text-green-600" />
                  Voice Commands
                  {isVoiceListening && (
                    <Badge className="bg-green-100 text-green-800 animate-pulse text-xs">
                      Listening...
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                            <Button 
              onClick={handleVoiceToggle}
              size="sm"
              className={`w-full btn-gray-metallic ${isVoiceListening ? 'bg-red-600 hover:bg-red-700' : ''}`}
            >
              {isVoiceListening ? <Pause className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {isVoiceListening ? 'Stop Listening' : 'Start Voice Commands'}
            </Button>
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>"Analyze selected emails"</div>
                  <div>"Create calendar events"</div>
                  <div>"Show WCAB hearings"</div>
                  <div>"Generate auto-responses"</div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={onAnalyzeEmails}
                  disabled={selectedEmails.length === 0}
                  size="sm"
                  className="w-full btn-blue-metallic"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Analyze ({selectedEmails.length})
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={() => navigate('/calendar')}
                    variant="outline"
                    size="sm"
                    className="btn-gray-metallic"
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={() => navigate('/tasks')}
                    variant="outline"
                    size="sm"
                    className="btn-gray-metallic"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 