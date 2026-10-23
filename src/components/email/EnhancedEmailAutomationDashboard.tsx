import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Switch } from '../ui/Switch';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { ScrollArea } from '../ui/ScrollArea';
import { 
  Bot, 
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Filter,
  Folder,
  Mail,
  MessageSquare,
  Plus,
  RefreshCw,
  Settings,
  Star,
  Tag,
  Target,
  Users,
  Zap,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Shield,
  Search,
  ChevronRight,
  ChevronDown,
  Activity
} from 'lucide-react';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: 'calendar' | 'task' | 'filing' | 'response' | 'tagging';
  triggers: string[];
  actions: string[];
  lastExecuted?: Date;
  executionCount: number;
}

interface AgentStats {
  emailsProcessed: number;
  eventsCreated: number;
  tasksAutomated: number;
  foldersOrganized: number;
  tagsApplied: number;
  duplicatesPrevented: number;
  responsesSuggested: number;
  legalCasesProcessed: number;
}

interface EnhancedEmailAutomationDashboardProps {
  className?: string;
  selectedEmails?: string[];
  onRuleCreate?: (rule: AutomationRule) => void;
  onRuleUpdate?: (id: string, updates: Partial<AutomationRule>) => void;
  onBatchProcess?: (emailIds: string[], ruleIds: string[]) => void;
}

export const EnhancedEmailAutomationDashboard: React.FC<EnhancedEmailAutomationDashboardProps> = ({
  className = '',
  selectedEmails = [],
  onRuleCreate,
  onRuleUpdate,
  onBatchProcess
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'analytics' | 'settings'>('overview');
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([
    {
      id: 'legal-calendar',
      name: 'Legal Case Calendar Integration',
      description: 'Automatically create calendar events from legal hearing notices and deadlines',
      enabled: true,
      type: 'calendar',
      triggers: ['hearing', 'deposition', 'wcab', 'court date', 'deadline'],
      actions: ['create_calendar_event', 'set_reminder', 'notify_team'],
      lastExecuted: new Date(Date.now() - 3600000),
      executionCount: 47
    },
    {
      id: 'client-filing',
      name: 'Smart Client Filing',
      description: 'Organize emails by client name and case number into appropriate folders',
      enabled: true,
      type: 'filing',
      triggers: ['client:', 'case #', 'matter:'],
      actions: ['move_to_folder', 'add_tags', 'update_case_file'],
      lastExecuted: new Date(Date.now() - 1800000),
      executionCount: 123
    },
    {
      id: 'urgent-tagging',
      name: 'Urgent Email Detection',
      description: 'Tag and prioritize urgent communications requiring immediate attention',
      enabled: true,
      type: 'tagging',
      triggers: ['urgent', 'asap', 'emergency', 'critical', 'deadline today'],
      actions: ['add_urgent_tag', 'send_notification', 'move_to_priority_folder'],
      lastExecuted: new Date(Date.now() - 900000),
      executionCount: 31
    },
    {
      id: 'auto-response',
      name: 'Intelligent Response Suggestions',
      description: 'Generate context-aware response suggestions for common inquiries',
      enabled: false,
      type: 'response',
      triggers: ['status update', 'document request', 'meeting request'],
      actions: ['suggest_response', 'draft_reply', 'schedule_follow_up'],
      lastExecuted: new Date(Date.now() - 86400000),
      executionCount: 18
    }
  ]);

  const [agentStats, setAgentStats] = useState<AgentStats>({
    emailsProcessed: 1247,
    eventsCreated: 47,
    tasksAutomated: 156,
    foldersOrganized: 89,
    tagsApplied: 234,
    duplicatesPrevented: 12,
    responsesSuggested: 18,
    legalCasesProcessed: 23
  });

  const [showCreateRule, setShowCreateRule] = useState(false);
  const [newRule, setNewRule] = useState<Partial<AutomationRule>>({
    name: '',
    description: '',
    type: 'calendar',
    enabled: true,
    triggers: [],
    actions: []
  });

  const handleCreateRule = () => {
    if (newRule.name && newRule.description) {
      const rule: AutomationRule = {
        id: `rule-${Date.now()}`,
        name: newRule.name,
        description: newRule.description,
        enabled: newRule.enabled || true,
        type: newRule.type || 'calendar',
        triggers: newRule.triggers || [],
        actions: newRule.actions || [],
        executionCount: 0
      };
      
      setAutomationRules(prev => [...prev, rule]);
      onRuleCreate?.(rule);
      setNewRule({ name: '', description: '', type: 'calendar', enabled: true, triggers: [], actions: [] });
      setShowCreateRule(false);
    }
  };

  const handleToggleRule = (ruleId: string) => {
    setAutomationRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const handleBatchProcess = () => {
    if (selectedEmails.length > 0) {
      const enabledRuleIds = automationRules.filter(r => r.enabled).map(r => r.id);
      onBatchProcess?.(selectedEmails, enabledRuleIds);
    }
  };

  const TabButton = ({ id, label, icon: Icon }: { id: string; label: string; icon: any }) => (
    <Button
      variant={activeTab === id ? "default" : "ghost"}
      onClick={() => setActiveTab(id as any)}
      className="flex items-center gap-2"
      size="sm"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  );

  return (
    <div className={`bg-background border-l border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">AI Email Assistant</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            <Activity className="h-3 w-3 mr-1" />
            Active
          </Badge>
        </div>

        {/* Quick Actions */}
        {selectedEmails.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{selectedEmails.length} emails selected</span>
                </div>
                <Button onClick={handleBatchProcess} size="sm" className="btn-genie-primary">
                  <Zap className="h-4 w-4 mr-1" />
                  Process All
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <TabButton id="overview" label="Overview" icon={BarChart3} />
          <TabButton id="rules" label="Rules" icon={Settings} />
          <TabButton id="analytics" label="Analytics" icon={TrendingUp} />
        </div>

        {/* Tab Content */}
        <ScrollArea className="flex-1 max-h-[600px]">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2">
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-green-600">{agentStats.eventsCreated}</div>
                    <div className="text-xs text-muted-foreground">Events Created</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600">{agentStats.tasksAutomated}</div>
                    <div className="text-xs text-muted-foreground">Tasks Automated</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-purple-600">{agentStats.foldersOrganized}</div>
                    <div className="text-xs text-muted-foreground">Folders Organized</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-orange-600">{agentStats.legalCasesProcessed}</div>
                    <div className="text-xs text-muted-foreground">Legal Cases</div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {automationRules.filter(r => r.enabled && r.lastExecuted).map(rule => (
                      <div key={rule.id} className="flex items-center gap-2 text-xs">
                        <Badge variant="secondary" className="text-xs px-1">
                          {rule.type}
                        </Badge>
                        <span className="flex-1 truncate">{rule.name}</span>
                        <span className="text-muted-foreground">
                          {rule.lastExecuted ? new Date(rule.lastExecuted).toLocaleTimeString() : 'Never'}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Setup */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Quick Setup</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => setShowCreateRule(true)}
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      Create New Rule
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs"
                    >
                      <Calendar className="h-3 w-3 mr-2" />
                      Calendar Integration
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs"
                    >
                      <Folder className="h-3 w-3 mr-2" />
                      Folder Auto-Filing
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Rules Tab */}
          {activeTab === 'rules' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Automation Rules</h4>
                <Button size="sm" onClick={() => setShowCreateRule(true)}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Rule
                </Button>
              </div>

              {automationRules.map(rule => (
                <Card key={rule.id} className={rule.enabled ? 'border-green-200' : 'border-gray-200'}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="text-sm font-medium">{rule.name}</h5>
                          <Badge variant="outline" className="text-xs">
                            {rule.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{rule.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Executed: {rule.executionCount} times</span>
                          {rule.lastExecuted && (
                            <span>• Last: {new Date(rule.lastExecuted).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => handleToggleRule(rule.id)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Email Processing Rate</span>
                        <span>94%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '94%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Automation Accuracy</span>
                        <span>87%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '87%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Response Time</span>
                        <span>1.2s avg</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Processing Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>Calendar Events</span>
                      <span className="font-medium">{agentStats.eventsCreated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Task Automations</span>
                      <span className="font-medium">{agentStats.tasksAutomated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Folder Organizations</span>
                      <span className="font-medium">{agentStats.foldersOrganized}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tags Applied</span>
                      <span className="font-medium">{agentStats.tagsApplied}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Legal Cases Processed</span>
                      <span className="font-medium">{agentStats.legalCasesProcessed}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </ScrollArea>

        {/* Create Rule Modal */}
        {showCreateRule && (
          <Card className="fixed inset-4 z-50 max-w-md mx-auto mt-20 bg-background border shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Create Automation Rule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="rule-name">Rule Name</Label>
                <Input
                  id="rule-name"
                  value={newRule.name || ''}
                  onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter rule name"
                />
              </div>
              <div>
                <Label htmlFor="rule-description">Description</Label>
                <Textarea
                  id="rule-description"
                  value={newRule.description || ''}
                  onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this rule does"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="rule-type">Rule Type</Label>
                <select
                  id="rule-type"
                  value={newRule.type || 'calendar'}
                  onChange={(e) => setNewRule(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="calendar">Calendar Integration</option>
                  <option value="task">Task Automation</option>
                  <option value="filing">Email Filing</option>
                  <option value="response">Response Generation</option>
                  <option value="tagging">Email Tagging</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateRule(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRule}>
                  Create Rule
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EnhancedEmailAutomationDashboard;
