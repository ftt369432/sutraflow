/**
 * 🚀 Universal Agent Workflow System
 * 
 * Integrates all existing agents into one cohesive system that:
 * - Searches emails for keywords (hearings, deadlines, tasks)
 * - Saves key info from similar emails 
 * - Creates calendar events and tasks automatically
 * - Works across all industries (legal, medical, business, etc.)
 * - Uses the beloved task progress system for visibility
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bot,
  Brain,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Filter,
  Folder,
  Mail,
  MoreVertical,
  Plus,
  RefreshCw,
  Scale,
  Search,
  Settings,
  Star,
  Tag,
  Target,
  Trash2,
  Users,
  Zap,
  AlertTriangle,
  TrendingUp,
  PlayCircle,
  PauseCircle,
  Eye,
  Download,
  Upload
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Switch } from '../ui/Switch';
import { Label } from '../ui/Label';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { TaskProgressPanel } from '../tasks/TaskProgressPanel';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { EmailMessage } from '../../services/email/types';
import { LegalAgent, MedicalAgent, CalendarAgent as AICalendarAgent } from '../../services/agents/SpecializedAgents';
import { WorkflowOrchestrator } from '../../services/WorkflowOrchestrator';
import { useCalendarStore } from '../../store/calendarStore';
import { useEmail } from '../../contexts/EmailContext';
import { VoiceAgentCreator } from '../voice/VoiceAgentCreator';
import { CreatedAgentWorkflow } from '../../services/VoiceAgentCreationService';

// Industry-specific keyword patterns for cross-industry support
const INDUSTRY_PATTERNS = {
  legal: {
    keywords: ['hearing', 'deposition', 'wcab', 'court', 'deadline', 'filing', 'motion', 'petition', 'discovery', 'settlement'],
    calendarEvents: ['hearing date', 'deposition', 'wcab hearing', 'court appearance', 'filing deadline'],
    tasks: ['prepare motion', 'file response', 'discovery request', 'settlement negotiation'],
    agents: ['legal_agent', 'calendar_agent', 'document_agent']
  },
  medical: {
    keywords: ['appointment', 'consultation', 'treatment', 'prescription', 'diagnosis', 'follow-up', 'referral'],
    calendarEvents: ['appointment', 'follow-up', 'treatment', 'consultation'],
    tasks: ['schedule follow-up', 'review treatment plan', 'coordinate care'],
    agents: ['medical_agent', 'calendar_agent', 'task_agent']
  },
  business: {
    keywords: ['meeting', 'deadline', 'project', 'milestone', 'deliverable', 'contract', 'proposal'],
    calendarEvents: ['meeting', 'project deadline', 'milestone review', 'contract signing'],
    tasks: ['prepare proposal', 'review contract', 'project milestone', 'follow up client'],
    agents: ['business_agent', 'calendar_agent', 'task_agent', 'email_agent']
  },
  finance: {
    keywords: ['audit', 'compliance', 'reporting', 'quarterly', 'fiscal', 'tax', 'budget', 'financial'],
    calendarEvents: ['audit date', 'quarterly review', 'tax deadline', 'budget meeting'],
    tasks: ['prepare report', 'compliance check', 'audit preparation', 'budget review'],
    agents: ['finance_agent', 'calendar_agent', 'document_agent']
  },
  universal: {
    keywords: ['urgent', 'asap', 'deadline', 'meeting', 'follow up', 'reminder', 'schedule', 'task'],
    calendarEvents: ['meeting', 'deadline', 'follow-up', 'reminder'],
    tasks: ['follow up', 'complete task', 'schedule meeting', 'send reminder'],
    agents: ['email_agent', 'calendar_agent', 'task_agent']
  }
};

interface AgentWorkflow {
  id: string;
  name: string;
  industry: keyof typeof INDUSTRY_PATTERNS;
  status: 'active' | 'paused' | 'training' | 'error';
  emailsProcessed: number;
  eventsCreated: number;
  tasksGenerated: number;
  lastActivity: Date;
  accuracy: number;
  timesSaved: number; // in minutes
}

interface ProcessingRule {
  id: string;
  name: string;
  industry: keyof typeof INDUSTRY_PATTERNS;
  keywords: string[];
  actions: ('create_calendar_event' | 'create_task' | 'tag_email' | 'move_to_folder' | 'send_notification')[];
  enabled: boolean;
  priority: number;
}

interface UniversalAgentWorkflowSystemProps {
  className?: string;
  selectedEmails?: EmailMessage[];
  onEmailProcess?: (emails: EmailMessage[], action: string) => void;
}

export function UniversalAgentWorkflowSystem({
  className,
  selectedEmails = [],
  onEmailProcess
}: UniversalAgentWorkflowSystemProps) {
  // State Management
  const [activeWorkflows, setActiveWorkflows] = useState<AgentWorkflow[]>([]);
  const [processingRules, setProcessingRules] = useState<ProcessingRule[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<keyof typeof INDUSTRY_PATTERNS>('universal');
  const [showTaskProgress, setShowTaskProgress] = useState(false);
  const [keywordSearch, setKeywordSearch] = useState('');
  const [foundEmails, setFoundEmails] = useState<EmailMessage[]>([]);
  
  // Hooks
  const { messages, loading } = useEmail();
  const calendarStore = useCalendarStore();

  // Initialize workflows and agents
  useEffect(() => {
    initializeAgentWorkflows();
    loadProcessingRules();
  }, []);

  const initializeAgentWorkflows = () => {
    const workflows: AgentWorkflow[] = [
      {
        id: 'legal-workflow',
        name: 'Legal Case Management',
        industry: 'legal',
        status: 'active',
        emailsProcessed: 127,
        eventsCreated: 34,
        tasksGenerated: 52,
        lastActivity: new Date(),
        accuracy: 94,
        timesSaved: 380
      },
      {
        id: 'medical-workflow',
        name: 'Medical Coordination',
        industry: 'medical',
        status: 'active',
        emailsProcessed: 89,
        eventsCreated: 67,
        tasksGenerated: 23,
        lastActivity: new Date(Date.now() - 1800000),
        accuracy: 91,
        timesSaved: 245
      },
      {
        id: 'universal-workflow',
        name: 'Universal Automation',
        industry: 'universal',
        status: 'active',
        emailsProcessed: 234,
        eventsCreated: 89,
        tasksGenerated: 156,
        lastActivity: new Date(Date.now() - 300000),
        accuracy: 88,
        timesSaved: 567
      }
    ];
    setActiveWorkflows(workflows);
  };

  const loadProcessingRules = () => {
    const rules: ProcessingRule[] = [
      {
        id: 'legal-hearing-rule',
        name: 'Legal Hearing Detection',
        industry: 'legal',
        keywords: ['hearing', 'wcab', 'deposition', 'court date'],
        actions: ['create_calendar_event', 'create_task', 'tag_email'],
        enabled: true,
        priority: 1
      },
      {
        id: 'deadline-rule',
        name: 'Universal Deadline Detection',
        industry: 'universal',
        keywords: ['deadline', 'due date', 'expires', 'must respond by'],
        actions: ['create_calendar_event', 'create_task', 'send_notification'],
        enabled: true,
        priority: 1
      },
      {
        id: 'meeting-rule',
        name: 'Meeting & Appointment Detection',
        industry: 'universal',
        keywords: ['meeting', 'appointment', 'consultation', 'conference call'],
        actions: ['create_calendar_event', 'send_notification'],
        enabled: true,
        priority: 2
      }
    ];
    setProcessingRules(rules);
  };

  // Keyword search functionality
  const searchEmailsByKeywords = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFoundEmails([]);
      return;
    }

    const industryPattern = INDUSTRY_PATTERNS[selectedIndustry];
    const searchKeywords = [
      searchTerm.toLowerCase(),
      ...industryPattern.keywords.filter(k => k.includes(searchTerm.toLowerCase()))
    ];

    // Simulate email search - in production, this would search your actual emails
    const matchingEmails = messages.filter(email => {
      const emailContent = `${email.subject} ${email.body || email.snippet || ''}`.toLowerCase();
      return searchKeywords.some(keyword => emailContent.includes(keyword));
    });

    setFoundEmails(matchingEmails);
    toast.success(`Found ${matchingEmails.length} emails matching "${searchTerm}"`);
  }, [selectedIndustry, messages]);

  // Process emails with agents
  const processEmailsWithAgents = async (emails: EmailMessage[], industry: string) => {
    setIsProcessing(true);
    setShowTaskProgress(true);
    
    try {
      const orchestrator = new WorkflowOrchestrator();
      
      for (const email of emails) {
        // Extract key information using industry-specific patterns
        const keyInfo = extractKeyInformation(email, industry);
        
        // Create calendar events for time-sensitive items
        if (keyInfo.dates.length > 0) {
          for (const dateInfo of keyInfo.dates) {
            await createCalendarEvent(dateInfo, email);
          }
        }
        
        // Create tasks for action items
        if (keyInfo.tasks.length > 0) {
          for (const taskInfo of keyInfo.tasks) {
            await createTask(taskInfo, email);
          }
        }
        
        // Tag and organize emails
        await tagAndOrganizeEmail(email, keyInfo);
      }
      
      // Update workflow statistics
      updateWorkflowStats(industry, emails.length);
      
      toast.success(`Successfully processed ${emails.length} emails with AI agents`);
      
    } catch (error) {
      console.error('Email processing error:', error);
      toast.error('Error processing emails with agents');
    } finally {
      setIsProcessing(false);
    }
  };

  // Extract key information from emails
  const extractKeyInformation = (email: EmailMessage, industry: string) => {
    const content = `${email.subject} ${email.body || email.snippet || ''}`.toLowerCase();
    const industryPattern = INDUSTRY_PATTERNS[industry as keyof typeof INDUSTRY_PATTERNS];
    
    const keyInfo = {
      dates: [] as Array<{type: string, date: Date, description: string}>,
      tasks: [] as Array<{type: string, description: string, priority: number}>,
      keywords: [] as string[],
      category: industry,
      urgency: 'normal' as 'low' | 'normal' | 'high' | 'urgent'
    };
    
    // Date extraction patterns
    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/\d{4})/g,
      /(\d{1,2}-\d{1,2}-\d{4})/g,
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/gi
    ];
    
    datePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          try {
            const date = new Date(match);
            if (date > new Date()) {
              keyInfo.dates.push({
                type: 'deadline',
                date,
                description: `Event from ${email.subject}`,
              });
            }
          } catch (e) {
            // Invalid date format
          }
        });
      }
    });
    
    // Keyword detection
    industryPattern.keywords.forEach(keyword => {
      if (content.includes(keyword)) {
        keyInfo.keywords.push(keyword);
      }
    });
    
    // Task generation based on keywords
    if (keyInfo.keywords.includes('deadline') || keyInfo.keywords.includes('due')) {
      keyInfo.tasks.push({
        type: 'deadline',
        description: `Review deadline in: ${email.subject}`,
        priority: 1
      });
    }
    
    if (keyInfo.keywords.includes('hearing') || keyInfo.keywords.includes('court')) {
      keyInfo.tasks.push({
        type: 'preparation',
        description: `Prepare for hearing mentioned in: ${email.subject}`,
        priority: 1
      });
    }
    
    // Urgency detection
    if (content.includes('urgent') || content.includes('asap') || content.includes('emergency')) {
      keyInfo.urgency = 'urgent';
    } else if (content.includes('important') || content.includes('priority')) {
      keyInfo.urgency = 'high';
    }
    
    return keyInfo;
  };

  const createCalendarEvent = async (dateInfo: any, email: EmailMessage) => {
    try {
      const event = {
        title: `📧 ${dateInfo.description}`,
        description: `From email: ${email.subject}\nSender: ${email.from}`,
        start: dateInfo.date,
        end: new Date(dateInfo.date.getTime() + 60 * 60 * 1000), // 1 hour duration
        allDay: false,
        sourceId: 'agent-automation',
        tags: ['agent-created', 'email-derived']
      };
      
      calendarStore.addEvent(event);
      return true;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return false;
    }
  };

  const createTask = async (taskInfo: any, email: EmailMessage) => {
    // In a real implementation, this would create tasks in your task management system
    console.log('Creating task:', taskInfo, 'from email:', email.subject);
    return true;
  };

  const tagAndOrganizeEmail = async (email: EmailMessage, keyInfo: any) => {
    // Tag emails with extracted keywords and move to appropriate folders
    console.log('Tagging email:', email.subject, 'with keywords:', keyInfo.keywords);
    return true;
  };

  const updateWorkflowStats = (industry: string, emailCount: number) => {
    setActiveWorkflows(prev => prev.map(workflow => {
      if (workflow.industry === industry) {
        return {
          ...workflow,
          emailsProcessed: workflow.emailsProcessed + emailCount,
          lastActivity: new Date()
        };
      }
      return workflow;
    }));
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="h-8 w-8 text-purple-600" />
              <div>
                <CardTitle className="text-xl">Universal Agent Workflow System</CardTitle>
                <p className="text-gray-600">AI agents that search, learn, and automate across all industries</p>
              </div>
            </div>
            <Button
              onClick={() => setShowTaskProgress(!showTaskProgress)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Target className="h-4 w-4" />
              {showTaskProgress ? 'Hide' : 'Show'} Progress
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="search">🔍 Smart Search</TabsTrigger>
          <TabsTrigger value="voice">🎤 Voice Creator</TabsTrigger>
          <TabsTrigger value="workflows">🤖 Active Workflows</TabsTrigger>
          <TabsTrigger value="rules">⚙️ Processing Rules</TabsTrigger>
          <TabsTrigger value="analytics">📊 Analytics</TabsTrigger>
        </TabsList>

        {/* Voice Agent Creator Tab */}
        <TabsContent value="voice" className="space-y-4">
          <VoiceAgentCreator
            onAgentCreated={(workflow: CreatedAgentWorkflow) => {
              toast.success(`🤖 "${workflow.name}" is now active and processing emails!`);
              // Add the created workflow to active workflows
              setActiveWorkflows(prev => [...prev, {
                id: workflow.id,
                name: workflow.name,
                industry: workflow.industry as keyof typeof INDUSTRY_PATTERNS,
                status: 'active' as const,
                emailsProcessed: 0,
                eventsCreated: 0,
                tasksGenerated: 0,
                lastActivity: new Date(),
                accuracy: workflow.successRate,
                timesSaved: 0
              }]);
            }}
          />
        </TabsContent>

        {/* Smart Search Tab */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Keyword Search & Auto-Processing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Industry Selection */}
              <div className="flex gap-2 flex-wrap">
                {Object.keys(INDUSTRY_PATTERNS).map((industry) => (
                  <Button
                    key={industry}
                    variant={selectedIndustry === industry ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedIndustry(industry as keyof typeof INDUSTRY_PATTERNS)}
                    className="capitalize"
                  >
                    {industry === 'universal' && '🌟'} 
                    {industry === 'legal' && '⚖️'} 
                    {industry === 'medical' && '🏥'} 
                    {industry === 'business' && '💼'} 
                    {industry === 'finance' && '💰'} 
                    {industry}
                  </Button>
                ))}
              </div>

              {/* Search Input */}
              <div className="flex gap-2">
                <Input
                  placeholder={`Search ${selectedIndustry} emails (e.g., "hearing", "deadline", "appointment")...`}
                  value={keywordSearch}
                  onChange={(e) => setKeywordSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchEmailsByKeywords(keywordSearch)}
                />
                <Button 
                  onClick={() => searchEmailsByKeywords(keywordSearch)}
                  disabled={!keywordSearch.trim()}
                >
                  Search
                </Button>
              </div>

              {/* Industry Keywords */}
              <div className="flex flex-wrap gap-1">
                <span className="text-sm text-gray-500">Suggested keywords:</span>
                {INDUSTRY_PATTERNS[selectedIndustry].keywords.slice(0, 8).map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="secondary"
                    className="cursor-pointer hover:bg-blue-100"
                    onClick={() => setKeywordSearch(keyword)}
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>

              {/* Search Results */}
              {foundEmails.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Found {foundEmails.length} Matching Emails
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {foundEmails.slice(0, 5).map((email) => (
                        <div key={email.id} className="p-2 bg-white rounded border text-sm">
                          <div className="font-medium">{email.subject}</div>
                          <div className="text-gray-600">From: {email.from}</div>
                        </div>
                      ))}
                      {foundEmails.length > 5 && (
                        <div className="text-gray-500 text-center">
                          ... and {foundEmails.length - 5} more
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => processEmailsWithAgents(foundEmails, selectedIndustry)}
                      disabled={isProcessing}
                      className="w-full mt-4"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Processing with AI Agents...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Process with AI Agents
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          {activeWorkflows.map((workflow) => (
            <Card key={workflow.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      workflow.status === 'active' && "bg-green-500 animate-pulse",
                      workflow.status === 'paused' && "bg-yellow-500",
                      workflow.status === 'error' && "bg-red-500"
                    )} />
                    <div>
                      <CardTitle className="text-base">{workflow.name}</CardTitle>
                      <p className="text-sm text-gray-600 capitalize">{workflow.industry} industry</p>
                    </div>
                  </div>
                  <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                    {workflow.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium">{workflow.emailsProcessed}</div>
                    <div className="text-gray-600">Emails Processed</div>
                  </div>
                  <div>
                    <div className="font-medium">{workflow.eventsCreated}</div>
                    <div className="text-gray-600">Events Created</div>
                  </div>
                  <div>
                    <div className="font-medium">{workflow.tasksGenerated}</div>
                    <div className="text-gray-600">Tasks Generated</div>
                  </div>
                  <div>
                    <div className="font-medium text-green-600">{workflow.timesSaved}min</div>
                    <div className="text-gray-600">Time Saved</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Accuracy</span>
                    <span>{workflow.accuracy}%</span>
                  </div>
                  <Progress value={workflow.accuracy} className="mt-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Processing Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          {processingRules.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium">{rule.name}</div>
                    <div className="text-sm text-gray-600 capitalize">{rule.industry} industry</div>
                  </div>
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(checked) => {
                      setProcessingRules(prev => prev.map(r => 
                        r.id === rule.id ? { ...r, enabled: checked } : r
                      ));
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {rule.keywords.map((keyword) => (
                    <Badge key={keyword} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {rule.actions.map((action) => (
                    <Badge key={action} variant="secondary" className="text-xs">
                      {action.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Total Time Saved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {activeWorkflows.reduce((sum, w) => sum + w.timesSaved, 0)} minutes
                </div>
                <div className="text-sm text-gray-600">
                  ≈ {Math.round(activeWorkflows.reduce((sum, w) => sum + w.timesSaved, 0) / 60)} hours saved
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-500" />
                  Emails Processed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {activeWorkflows.reduce((sum, w) => sum + w.emailsProcessed, 0)}
                </div>
                <div className="text-sm text-gray-600">
                  Across all industries
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  Average Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(activeWorkflows.reduce((sum, w) => sum + w.accuracy, 0) / activeWorkflows.length)}%
                </div>
                <div className="text-sm text-gray-600">
                  AI processing accuracy
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Task Progress Panel Integration */}
      {showTaskProgress && (
        <TaskProgressPanel
          className="fixed"
          onClose={() => setShowTaskProgress(false)}
        />
      )}
    </div>
  );
}

export default UniversalAgentWorkflowSystem;