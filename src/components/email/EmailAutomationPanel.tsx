import React, { useState } from 'react';
import { getStatusClass } from '../../styles/semanticColors';
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
  Eye,
  Play,
  Pause,
  Mic,
  Briefcase,
  ChevronRight,
  Target,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Switch } from '../ui/Switch';
import { Label } from '../ui/Label';
import { Progress } from '../ui/progress';
import { toast } from 'sonner';

interface AutomationStats {
  calendarEventsCreated: number;
  tasksAutomated: number;
  duplicatesPrevented: number;
  legalCasesProcessed: number;
  voiceCommandsUsed: number;
  wcabHearingsScheduled: number;
  totalTimesSaved: number; // in minutes
  successRate: number; // percentage
}

interface AgentStatus {
  name: string;
  type: 'calendar' | 'legal' | 'wcab' | 'task' | 'voice';
  status: 'active' | 'paused' | 'error';
  lastActivity: Date;
  tasksCompleted: number;
  icon: React.ReactNode;
}

interface EmailAutomationPanelProps {
  selectedEmails: string[];
  onAnalyzeEmails: () => void;
  onVoiceCommand: (command: string) => void;
  automationStats: AutomationStats;
  isAutoCalendarEnabled: boolean;
  onToggleAutoCalendar: (enabled: boolean) => void;
  isAutoTaskingEnabled: boolean;
  onToggleAutoTasking: (enabled: boolean) => void;
}

/**
 * 🤖 Enhanced Email Automation Panel
 * 
 * Universal agent orchestration panel for email workflows:
 * - Real-time automation statistics
 * - Agent status monitoring
 * - Legal workflow management
 * - Voice command interface
 * - Quick access to automation tools
 */
export function EmailAutomationPanel({
  selectedEmails,
  onAnalyzeEmails,
  onVoiceCommand,
  automationStats,
  isAutoCalendarEnabled,
  onToggleAutoCalendar,
  isAutoTaskingEnabled,
  onToggleAutoTasking
}: EmailAutomationPanelProps) {
  const navigate = useNavigate();
  
  const [agents, setAgents] = useState<AgentStatus[]>([
    {
      name: 'Universal Calendar Agent',
      type: 'calendar',
      status: 'active',
      lastActivity: new Date(),
      tasksCompleted: 23,
      icon: <Calendar className="h-4 w-4" />
    },
    {
      name: 'Legal Assistant Agent',
      type: 'legal',
      status: 'active',
      lastActivity: new Date(Date.now() - 300000), // 5 minutes ago
      tasksCompleted: 12,
      icon: <Scale className="h-4 w-4" />
    },
    {
      name: 'WCAB Auto Calendar',
      type: 'wcab',
      status: 'active',
      lastActivity: new Date(Date.now() - 600000), // 10 minutes ago
      tasksCompleted: 8,
      icon: <Briefcase className="h-4 w-4" />
    },
    {
      name: 'Task Automation Agent',
      type: 'task',
      status: 'active',
      lastActivity: new Date(Date.now() - 900000), // 15 minutes ago
      tasksCompleted: 47,
      icon: <CheckCircle className="h-4 w-4" />
    },
    {
      name: 'Voice Command Agent',
      type: 'voice',
      status: 'active',
      lastActivity: new Date(Date.now() - 1800000), // 30 minutes ago
      tasksCompleted: 15,
      icon: <Mic className="h-4 w-4" />
    }
  ]);

  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceCommands] = useState([
    'Analyze selected emails for calendar events',
    'Create WCAB hearing preparation tasks',
    'Schedule follow-up reminders',
    'Generate case timeline',
    'Process legal documents',
    'Check for duplicate calendar events'
  ]);

  const getStatusColor = (status: string) => getStatusClass(status);

  const handleVoiceToggle = () => {
    setIsVoiceListening(!isVoiceListening);
    if (!isVoiceListening) {
      toast.info('🎤 Voice commands activated. Try saying "Analyze emails" or "Create calendar events"');
      // In production, start voice recognition
      setTimeout(() => setIsVoiceListening(false), 30000); // Auto-stop after 30 seconds
    } else {
      toast.info('🎤 Voice commands deactivated');
    }
  };

  const handleQuickVoiceCommand = (command: string) => {
    onVoiceCommand(command);
    toast.success(`🎤 Voice command executed: "${command}"`);
  };

  const efficiencyScore = Math.round((automationStats.successRate || 0));
  const timesSavedHours = Math.round((automationStats.totalTimesSaved || 0) / 60 * 10) / 10;

  return (
    <div className="space-y-4">
      {/* Automation Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Automation Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{automationStats.calendarEventsCreated}</div>
              <div className="text-sm text-muted-foreground">Calendar Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{automationStats.tasksAutomated}</div>
              <div className="text-sm text-muted-foreground">Tasks Automated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{automationStats.legalCasesProcessed}</div>
              <div className="text-sm text-muted-foreground">Legal Cases</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{automationStats.wcabHearingsScheduled}</div>
              <div className="text-sm text-muted-foreground">WCAB Hearings</div>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Efficiency Score</span>
              <span className="font-semibold">{efficiencyScore}%</span>
            </div>
            <Progress value={efficiencyScore} className="h-2" />
            
            <div className="flex justify-between text-sm mt-2">
              <span>Time Saved Today</span>
              <span className="font-semibold text-green-600">{timesSavedHours}h</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-600" />
            Active Agents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {agents.map((agent, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {agent.icon}
                    <span className="font-medium">{agent.name}</span>
                  </div>
                  <Badge className={getStatusColor(agent.status)}>
                    {agent.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{agent.tasksCompleted} tasks</span>
                  <span>{Math.round((Date.now() - agent.lastActivity.getTime()) / 60000)}m ago</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Automation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            Automation Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <Label htmlFor="auto-calendar">Auto-Calendar Processing</Label>
            </div>
            <Switch
              id="auto-calendar"
              checked={isAutoCalendarEnabled}
              onCheckedChange={onToggleAutoCalendar}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <Label htmlFor="auto-tasking">Auto-Task Creation</Label>
            </div>
            <Switch
              id="auto-tasking"
              checked={isAutoTaskingEnabled}
              onCheckedChange={onToggleAutoTasking}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              <Label htmlFor="legal-workflow">Legal Workflow Mode</Label>
            </div>
            <Switch
              id="legal-workflow"
              checked={true}
              onCheckedChange={() => toast.info('Legal workflow mode is always active for work comp attorneys')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Voice Commands */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-green-600" />
            Voice Commands
            {isVoiceListening && (
              <Badge className="bg-green-100 text-green-800 animate-pulse">
                🎤 Listening...
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            onClick={handleVoiceToggle}
            className={`w-full ${isVoiceListening ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
          >
            {isVoiceListening ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Stop Listening
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Voice Commands
              </>
            )}
          </Button>
          
          <div className="space-y-2">
            <div className="text-sm font-medium">Quick Commands:</div>
            {voiceCommands.slice(0, 3).map((command, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickVoiceCommand(command)}
                className="w-full justify-start text-left"
              >
                <Mic className="h-3 w-3 mr-2" />
                {command}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            onClick={onAnalyzeEmails}
            disabled={selectedEmails.length === 0}
            className="w-full btn-genie-primary"
          >
            <Target className="h-4 w-4 mr-2" />
            Analyze Selected Emails ({selectedEmails.length})
          </Button>
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={() => navigate('/automation-dashboard')}
              variant="outline"
              size="sm"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Dashboard
            </Button>
            <Button 
              onClick={() => navigate('/calendar/bulk-manage')}
              variant="outline"
              size="sm"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Bulk Calendar
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={() => navigate('/legal/cases')}
              variant="outline"
              size="sm"
            >
              <Scale className="h-4 w-4 mr-2" />
              Legal Cases
            </Button>
            <Button 
              onClick={() => navigate('/agents/swarm')}
              variant="outline"
              size="sm"
            >
              <Users className="h-4 w-4 mr-2" />
              Agent Swarms
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Automations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600" />
            Recent Automations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 border-l-4 border-l-green-500 bg-green-50 rounded">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <span className="text-sm">WCAB hearing scheduled</span>
              </div>
              <span className="text-xs text-muted-foreground">2 min ago</span>
            </div>
            
            <div className="flex items-center justify-between p-2 border-l-4 border-l-blue-500 bg-blue-50 rounded">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm">3 tasks auto-created</span>
              </div>
              <span className="text-xs text-muted-foreground">5 min ago</span>
            </div>
            
            <div className="flex items-center justify-between p-2 border-l-4 border-l-purple-500 bg-purple-50 rounded">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Legal deadline extracted</span>
              </div>
              <span className="text-xs text-muted-foreground">8 min ago</span>
            </div>
          </div>
          
          <Button 
            onClick={() => navigate('/automation-dashboard')}
            variant="outline"
            size="sm"
            className="w-full mt-3"
          >
            View All Automations
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 