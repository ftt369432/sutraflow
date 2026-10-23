/**
 * 🤖 AI Agent Task Manager - Visual Interface
 * 
 * Based on existing task system design but specialized for AI Agent orchestration
 * Hierarchical task visualization with agent-to-agent communication
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/progress';
import {
  Bot,
  Brain,
  FileText,
  Calendar,
  Mail,
  Users,
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Zap,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  MessageSquare,
  Target,
  Layers,
  GitBranch,
  Activity,
  Eye,
  Settings,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AIAgentTask,
  TaskStatus,
  TaskPriority,
  AgentType
} from '../../services/agents/types';
import { AIAgentOrchestrator } from '../../services/agents/AIAgentOrchestrator';


interface IntelligenceDisplay {
  visible: boolean;
  taskId: string;
  intent: string;
  complexity: any;
  assignedAgent: string;
  reasoning: string;
  estimatedDuration: number;
  confidence: number;
}

interface AIAgentTaskManagerProps {
  workflowId?: string;
  tasks?: AIAgentTask[]; // Allow direct task injection
  intelligenceDisplay?: IntelligenceDisplay; // NEW: Display AI thinking process
  manifestSummary?: string; // NEW: Show audit trail
  onTaskUpdate?: (task: AIAgentTask) => void;
  onWorkflowComplete?: (workflowId: string) => void;
  onHumanEscalation?: (taskId: string) => void; // NEW: Human help button
  className?: string;
}

export function AIAgentTaskManager({
  workflowId,
  tasks: externalTasks,
  intelligenceDisplay,
  manifestSummary,
  onTaskUpdate,
  onWorkflowComplete,
  onHumanEscalation,
  className
}: AIAgentTaskManagerProps) {
  // State Management
  const [tasks, setTasks] = useState<AIAgentTask[]>([]);
  const [workflowStatus, setWorkflowStatus] = useState<any>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'hierarchy' | 'timeline' | 'agents'>('hierarchy');
  const [filterAgent, setFilterAgent] = useState<AgentType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');

  // AI Agent Orchestrator Instance
  const orchestrator = AIAgentOrchestrator.getInstance();

  // Load external tasks if provided
  useEffect(() => {
    if (externalTasks && externalTasks.length > 0) {
      console.log('🤖 TASK MANAGER: Loading external tasks:', externalTasks);
      setTasks(externalTasks);
    } else if (workflowId && orchestrator) {
      // Fallback to orchestrator loading if no external tasks
      console.log('🤖 TASK MANAGER: Loading tasks from orchestrator for workflow:', workflowId);
      // Add orchestrator task loading logic here if needed
    }
  }, [externalTasks, workflowId, orchestrator]);

  // Status Colors & Icons
  const statusConfig = {
    [TaskStatus.PENDING]: {
      color: 'bg-gray-100 text-gray-800',
      icon: <Circle className="h-4 w-4" />,
      label: 'Pending'
    },
    [TaskStatus.ANALYZING]: {
      color: 'bg-blue-100 text-blue-800',
      icon: <Brain className="h-4 w-4" />,
      label: 'Analyzing'
    },
    [TaskStatus.IN_PROGRESS]: {
      color: 'bg-yellow-100 text-yellow-800',
      icon: <Activity className="h-4 w-4 animate-pulse" />,
      label: 'In Progress'
    },
    [TaskStatus.WAITING_DEPENDENCY]: {
      color: 'bg-orange-100 text-orange-800',
      icon: <Clock className="h-4 w-4" />,
      label: 'Waiting'
    },
    [TaskStatus.AGENT_HANDOFF]: {
      color: 'bg-indigo-100 text-indigo-800',
      icon: <ArrowRight className="h-4 w-4" />,
      label: 'Handoff'
    },
    [TaskStatus.PLAN_REVIEW]: {
      color: 'bg-purple-100 text-purple-800 border border-purple-200',
      icon: <Target className="h-4 w-4 animate-pulse" />,
      label: 'Review Strategy'
    },
    [TaskStatus.COMPLETED]: {
      color: 'bg-green-100 text-green-800',
      icon: <CheckCircle2 className="h-4 w-4" />,
      label: 'Completed'
    },
    [TaskStatus.FAILED]: {
      color: 'bg-red-100 text-red-800',
      icon: <AlertTriangle className="h-4 w-4" />,
      label: 'Failed'
    },
    [TaskStatus.CANCELLED]: {
      color: 'bg-gray-100 text-gray-600',
      icon: <Circle className="h-4 w-4" />,
      label: 'Cancelled'
    }
  };

  // Agent Icons & Colors
  const agentConfig = {
    [AgentType.ORCHESTRATOR_AGENT]: {
      icon: <Bot className="h-4 w-4" />,
      color: 'bg-indigo-500',
      name: 'Orchestrator'
    },
    [AgentType.DOCUMENT_AGENT]: {
      icon: <FileText className="h-4 w-4" />,
      color: 'bg-blue-500',
      name: 'Document'
    },
    [AgentType.LEGAL_AGENT]: {
      icon: <Target className="h-4 w-4" />,
      color: 'bg-purple-500',
      name: 'Legal'
    },
    [AgentType.MEDICAL_AGENT]: {
      icon: <Activity className="h-4 w-4" />,
      color: 'bg-red-500',
      name: 'Medical'
    },
    [AgentType.CALENDAR_AGENT]: {
      icon: <Calendar className="h-4 w-4" />,
      color: 'bg-green-500',
      name: 'Calendar'
    },
    [AgentType.APPOINTMENT_AGENT]: {
      icon: <Users className="h-4 w-4" />,
      color: 'bg-orange-500',
      name: 'Appointment'
    },
    [AgentType.EMAIL_AGENT]: {
      icon: <Mail className="h-4 w-4" />,
      color: 'bg-yellow-500',
      name: 'Email'
    }
  };

  // Priority Colors
  const priorityConfig = {
    [TaskPriority.LOW]: 'bg-gray-100 text-gray-700',
    [TaskPriority.MEDIUM]: 'bg-blue-100 text-blue-700',
    [TaskPriority.HIGH]: 'bg-orange-100 text-orange-700',
    [TaskPriority.URGENT]: 'bg-red-100 text-red-700',
    [TaskPriority.CRITICAL]: 'bg-red-500 text-white'
  };

  // Toggle Task Expansion
  const toggleTaskExpansion = useCallback((taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }, []);

  // Render Task Tree Node
  const renderTaskNode = (task: AIAgentTask, depth: number = 0) => {
    const hasSubTasks = task.subTasks && task.subTasks.length > 0;
    const isExpanded = expandedTasks.has(task.id);
    const isSelected = selectedTask === task.id;
    const status = statusConfig[task.status];
    const agent = agentConfig[task.assignedAgent];

    const indentClass = depth > 0 ? `ml-${depth * 6}` : '';

    return (
      <div key={task.id} className={cn("border-l-2 border-gray-100", depth > 0 && "ml-4")}>
        {/* Task Card */}
        <Card className={cn(
          "mb-2 transition-all hover:shadow-md",
          isSelected && "ring-2 ring-blue-500",
          depth > 0 && "bg-gray-50"
        )}>
          <CardContent className="p-4">
            {/* Task Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {/* Expansion Toggle */}
                {hasSubTasks && (
                  <button
                    onClick={() => toggleTaskExpansion(task.id)}
                    className="mt-1 p-1 hover:bg-gray-100 rounded"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                )}

                {/* Task Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {/* Status Icon */}
                    <div className={cn("p-1 rounded", status.color)}>
                      {status.icon}
                    </div>

                    {/* Agent Badge */}
                    <div className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white",
                      agent.color
                    )}>
                      {agent.icon}
                      <span>{agent.name}</span>
                    </div>

                    {/* Priority Badge */}
                    <Badge className={cn("text-xs", priorityConfig[task.priority])}>
                      {task.priority}
                    </Badge>
                  </div>

                  {/* Task Title & Description */}
                  <h3 className="font-medium text-gray-900 mb-1">{task.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{task.description}</p>

                  {/* Progress Bar */}
                  {task.progress > 0 && (
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{task.progress}%</span>
                      </div>
                      <Progress value={task.progress} className="h-2" />
                    </div>
                  )}

                  {/* Dependencies */}
                  {task.dependsOn && task.dependsOn.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <GitBranch className="h-3 w-3" />
                      <span>Depends on {task.dependsOn.length} task(s)</span>
                    </div>
                  )}

                  {/* Target Canvas */}
                  {task.targetCanvasId && (
                    <div className="flex items-center gap-2 text-xs text-blue-600 mt-1">
                      <Target className="h-3 w-3" />
                      <span>Canvas: {task.targetCanvasId.substring(0, 12)}...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTask(task.id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Agent Messages */}
            {task.agentMessages && task.agentMessages.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <MessageSquare className="h-3 w-3" />
                  <span>{task.agentMessages.length} agent message(s)</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sub-Tasks */}
        {hasSubTasks && isExpanded && (
          <div className="ml-4 border-l border-gray-200 pl-4">
            {task.subTasks.map(subTask => renderTaskNode(subTask, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Render Workflow Overview
  const renderWorkflowOverview = () => {
    if (!workflowStatus) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Bot className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">AI Agent Workflow</h2>
                <p className="text-sm text-gray-600">
                  {workflowStatus.completedTasks} of {workflowStatus.totalTasks} tasks completed
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {workflowStatus.overallProgress}%
              </div>
              <p className="text-xs text-gray-500">
                {workflowStatus.estimatedTimeRemaining}min remaining
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={workflowStatus.overallProgress} className="h-3 mb-4" />

          {/* Status Breakdown */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {workflowStatus.completedTasks}
              </div>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-yellow-600">
                {workflowStatus.inProgressTasks}
              </div>
              <p className="text-xs text-gray-500">In Progress</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-600">
                {workflowStatus.pendingTasks}
              </div>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {workflowStatus.totalTasks}
              </div>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Workflow Overview */}
      {renderWorkflowOverview()}

      {/* 🧠 INTELLIGENCE DISPLAY: Show AI thinking process */}
      {intelligenceDisplay?.visible && (
        <Card className="border-indigo-200 dark:border-indigo-800 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm text-indigo-900 dark:text-indigo-100">
                    🧠 AI Analysis & Reasoning
                  </h4>
                  <Badge className="bg-indigo-600 text-white text-xs">
                    {intelligenceDisplay.confidence}% confidence
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-3">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Task ID:</span>
                    <span className="ml-2 font-mono text-indigo-700 dark:text-indigo-300">{intelligenceDisplay.taskId}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Intent:</span>
                    <span className="ml-2 font-medium">{intelligenceDisplay.intent}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Complexity:</span>
                    <span className="ml-2 font-medium">{intelligenceDisplay.complexity}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Agent:</span>
                    <span className="ml-2 font-medium text-blue-600 dark:text-blue-400">🤖 {intelligenceDisplay.assignedAgent}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Estimated:</span>
                    <span className="ml-2 font-medium">{intelligenceDisplay.estimatedDuration} min</span>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded border border-indigo-100 dark:border-indigo-900">
                  <p className="text-xs text-gray-700 dark:text-gray-300 italic leading-relaxed">
                    💭 {intelligenceDisplay.reasoning}
                  </p>
                </div>

                {/* Human Escalation Button */}
                {onHumanEscalation && intelligenceDisplay.confidence < 80 && (
                  <div className="mt-3 pt-3 border-t border-indigo-200 dark:border-indigo-800">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onHumanEscalation(intelligenceDisplay.taskId)}
                      className="w-full"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      🚨 Request Human Help (Low Confidence)
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 📋 AUDIT TRAIL: Manifest summary */}
      {manifestSummary && (
        <details className="group">
          <summary className="cursor-pointer list-none">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">📋 Audit Trail & Manifest State</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400 group-open:rotate-180 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </summary>
          <Card className="mt-2 border-t-0">
            <CardContent className="p-4">
              <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded overflow-auto max-h-[200px] font-mono whitespace-pre-wrap">
                {manifestSummary}
              </pre>
            </CardContent>
          </Card>
        </details>
      )}

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'hierarchy' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('hierarchy')}
              >
                <Layers className="h-4 w-4 mr-2" />
                Hierarchy
              </Button>
              <Button
                variant={viewMode === 'timeline' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('timeline')}
              >
                <Clock className="h-4 w-4 mr-2" />
                Timeline
              </Button>
              <Button
                variant={viewMode === 'agents' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('agents')}
              >
                <Users className="h-4 w-4 mr-2" />
                Agents
              </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <select
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value as AgentType | 'all')}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white"
                title="Filter by agent"
                aria-label="Filter by agent"
              >
                <option value="all">All Agents</option>
                {Object.entries(agentConfig).map(([type, config]) => (
                  <option key={type} value={type}>{config.name}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white"
                title="Filter by status"
                aria-label="Filter by status"
              >
                <option value="all">All Status</option>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <option key={status} value={status}>{config.label}</option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <div className="space-y-2">
        {tasks.map(task => renderTaskNode(task))}

        {tasks.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Active AI Agent Tasks
              </h3>
              <p className="text-gray-600">
                AI Agent tasks will appear here when workflows are running.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}