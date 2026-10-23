/**
 * 🎯 UNIFIED TASK ORCHESTRATOR
 * Consolidates AI Suggestions + Active Tasks + Agent Hierarchy
 * 
 * Features:
 * - Tab 1: AI Suggestions (from chat analysis)
 * - Tab 2: Active Tasks (hierarchical chevron view)
 * - Task/Document ID tracking for multi-file management
 * - Agent color coding and progress bars
 * - Expandable/collapsible hierarchies
 * - Canvas tracking integration
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/progress';
import {
  CheckCircle2,
  Clock,
  Play,
  Pause,
  Plus,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Zap,
  Bot,
  FileText,
  Calendar,
  Mail,
  Scale,
  Heart,
  X,
  MessageSquare,
  ArrowRight,
  Layers,
  Target,
  Brain,
  AlertTriangle,
  Circle,
  GitBranch,
  File,
  Layout,
  List,
  ArrowRightCircle,
  Flag,
  Trello,
  RefreshCw,
  Send
} from 'lucide-react';

// Import existing infrastructure
import { AgentType, TaskStatus, TaskPriority, AIAgentTask } from '../../services/agents/types';
import { AIAgentOrchestrator } from '../../services/agents/AIAgentOrchestrator';
import { getOrchestrationManifest } from '../../services/agents/OrchestrationManifest';

import { useTaskStore } from '../../store/taskStore';
import { cn } from '../../lib/utils';

// Agent Metadata
const AGENT_CONFIGS = {
  [AgentType.DOCUMENT_AGENT]: {
    name: 'Document Agent',
    icon: FileText,
    color: 'blue',
    bgClass: 'bg-blue-50 border-blue-200',
    badgeClass: 'bg-blue-100 text-blue-800'
  },
  [AgentType.LEGAL_AGENT]: {
    name: 'Legal Agent',
    icon: Scale,
    color: 'purple',
    bgClass: 'bg-purple-50 border-purple-200',
    badgeClass: 'bg-purple-100 text-purple-800'
  },
  [AgentType.MEDICAL_AGENT]: {
    name: 'Medical Agent',
    icon: Heart,
    color: 'red',
    bgClass: 'bg-red-50 border-red-200',
    badgeClass: 'bg-red-100 text-red-800'
  },
  [AgentType.CALENDAR_AGENT]: {
    name: 'Calendar Agent',
    icon: Calendar,
    color: 'green',
    bgClass: 'bg-green-50 border-green-200',
    badgeClass: 'bg-green-100 text-green-800'
  },
  [AgentType.EMAIL_AGENT]: {
    name: 'Email Agent',
    icon: Mail,
    color: 'yellow',
    bgClass: 'bg-yellow-50 border-yellow-200',
    badgeClass: 'bg-yellow-100 text-yellow-800'
  }
};

// Status Configuration
const STATUS_CONFIG = {
  [TaskStatus.PENDING]: {
    color: 'bg-gray-100 text-gray-800',
    icon: Circle,
    label: 'Pending'
  },
  [TaskStatus.ANALYZING]: {
    color: 'bg-blue-100 text-blue-800',
    icon: Brain,
    label: 'Analyzing'
  },
  [TaskStatus.IN_PROGRESS]: {
    color: 'bg-indigo-100 text-indigo-800',
    icon: Zap,
    label: 'In Progress'
  },
  [TaskStatus.COMPLETED]: {
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle2,
    label: 'Completed'
  },
  [TaskStatus.FAILED]: {
    color: 'bg-red-100 text-red-800',
    icon: AlertTriangle,
    label: 'Failed'
  },
  [TaskStatus.PLAN_REVIEW]: {
    color: 'bg-purple-100 text-purple-800 border border-purple-200',
    icon: Target,
    label: 'Review Strategy'
  }
};

interface TaskSuggestion {
  id: string;
  title: string;
  description: string;
  agent: AgentType;
  priority: TaskPriority;
  confidence: number;
}

interface UnifiedTaskOrchestratorProps {
  isVisible: boolean;
  onToggle: () => void;
  currentConversation?: string;
  lastMessage?: string;
  tasks?: AIAgentTask[];
  workflowId?: string;
  intelligenceDisplay?: any;
  manifestSummary?: any;
  onTaskUpdate?: (task: AIAgentTask) => void;
  onWorkflowComplete?: (workflowId: string) => void;
  autoMode?: boolean;
  onAutoModeChange?: (enabled: boolean) => void;
  onCanvasAction?: (action: any) => void;
  userId?: string; // 🎯 Added userId prop for robust manifest resolution
}

export function UnifiedTaskOrchestrator({
  isVisible,
  onToggle,
  currentConversation,
  lastMessage,
  tasks: externalTasks,
  workflowId,
  intelligenceDisplay,
  manifestSummary,
  onTaskUpdate,
  onWorkflowComplete,
  autoMode = false,
  onAutoModeChange,
  onCanvasAction,
  userId
}: UnifiedTaskOrchestratorProps) {
  // State Management
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [activeTasks, setActiveTasks] = useState<AIAgentTask[]>([]);
  const [isExpanded, setIsExpanded] = useState(false); // Controls panel expansion - starts minimized
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'suggestions' | 'strategy'>('strategy');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list'); // Default to list view
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);

  // 💬 Feedback State for Plan Review
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Load preference from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem('orchestrator_view_mode');
    if (savedView === 'list' || savedView === 'kanban') {
      setViewMode(savedView);
    }
  }, []);

  // Save preference to localStorage
  useEffect(() => {
    localStorage.setItem('orchestrator_view_mode', viewMode);
  }, [viewMode]);

  // Stores
  const { addTask } = useTaskStore();
  const orchestrator = AIAgentOrchestrator.getInstance();

  // Load tasks from external source or orchestrator
  useEffect(() => {
    if (externalTasks && externalTasks.length > 0) {
      console.log('🎯 UNIFIED ORCHESTRATOR: Loading external tasks:', externalTasks.length);
      setActiveTasks(externalTasks);

      // Auto-expand when tasks are created
      if (externalTasks.length > 0) {
        setIsExpanded(true);
      }
    }
  }, [externalTasks]);

  // 🎨 AUTO-CREATE CANVASES: When tasks with content are generated, create their canvases
  useEffect(() => {
    if (!onCanvasAction || !externalTasks || externalTasks.length === 0) return;

    // Check for tasks that have results/content but no canvas yet created
    const tasksNeedingCanvases = externalTasks.filter(task =>
      task.result &&
      task.status !== TaskStatus.FAILED &&
      !task.context?.canvasCreated // Mark when we've created it
    );

    if (tasksNeedingCanvases.length === 0) return;

    console.log('🎨 AUTO-CREATE CANVASES: Found tasks needing canvases:', tasksNeedingCanvases.length);

    // Create canvas for each task
    tasksNeedingCanvases.forEach(task => {
      // 🔗 GENERATE CANVAS ID: Create if not exists
      const canvasId = task.targetCanvasId || `canvas-${task.id.substring(0, 8)}-${Date.now().toString(36)}`;

      console.log('🎨 Creating canvas for task:', {
        taskId: task.id,
        canvasId,
        title: task.title,
        hasContent: !!task.result,
        hadExistingCanvasId: !!task.targetCanvasId
      });

      // 🔗 UPDATE TASK WITH CANVAS ID: Link task to canvas BEFORE creating
      if (!task.targetCanvasId && onTaskUpdate) {
        task.targetCanvasId = canvasId;
        onTaskUpdate({
          ...task,
          targetCanvasId: canvasId
        });
        console.log('🔗 LINKED: Task', task.id.substring(0, 8), '→ Canvas', canvasId.substring(0, 12));
      }

      // Trigger canvas creation via callback
      onCanvasAction({
        type: 'create',
        content: task.result || task.description,
        title: task.title || `Task: ${task.description.slice(0, 50)}...`,
        targetCanvasId: canvasId,
        metadata: {
          source: 'task_orchestration',
          taskId: task.id,
          agentType: task.assignedAgent,
          createdAt: new Date().toISOString()
        }
      });

      // Mark as canvas created to prevent duplicate creation
      if (onTaskUpdate) {
        onTaskUpdate({
          ...task,
          context: {
            ...task.context,
            canvasCreated: true
          }
        });
      }
    });
  }, [externalTasks, onCanvasAction, onTaskUpdate]);

  // 🎯 MANUAL TASK COMPLETION
  const handleTaskComplete = useCallback((taskId: string) => {
    // 1. Get manifest
    const manifest = getOrchestrationManifest(userId);

    // 2. Update status in manifest (triggers auto-cleanup in 5 min)
    manifest.updateTaskStatus(taskId, 'completed', undefined, 100);

    // 3. Update local state immediately for snappy UI
    setActiveTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: TaskStatus.COMPLETED, progress: 100 } : t
    ));

    // 4. Notify parent if needed
    if (onTaskUpdate) {
      onTaskUpdate({ id: taskId, status: TaskStatus.COMPLETED } as any);
    }
  }, [onTaskUpdate, userId]);

  // Toggle task expansion (chevron functionality)
  const toggleTaskExpansion = useCallback((taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  // Create task from suggestion
  const handleCreateTask = useCallback(async (suggestion: TaskSuggestion) => {
    console.log('🚀 CREATE TASK FROM SUGGESTION:', suggestion);

    try {
      // Create task via orchestrator
      const result = await orchestrator.processUserRequest(
        suggestion.description,
        'current-user',
        {
          suggestedAgent: suggestion.agent,
          priority: suggestion.priority
        }
      );

      if (result.rootTask) {
        setActiveTasks(prev => [result.rootTask, ...prev]);
        setActiveTab('active'); // Switch to Active Tasks
        setIsExpanded(true); // Ensure panel is expanded
      }

      // Remove from suggestions
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));

    } catch (error) {
      console.error('Failed to create task:', error);
    }
  }, [orchestrator]);

  // 🎯 Extract clean summary from task context
  const getTaskSummary = useCallback((task: AIAgentTask): string => {
    const ctx = task.context || {};
    const client = ctx.clientName || ctx.client;
    const caseNum = ctx.caseNumber || ctx.claimNumber;

    // Build clean summary: "Draft Petition - Maria Rodriguez (ADJ15789234)"
    let summary = task.title;
    if (client) {
      summary = `${task.title} - ${client}`;
      if (caseNum) {
        summary += ` (${caseNum})`;
      }
    }
    return summary;
  }, []);

  // 🎯 Extract parsed manifest data from task
  const getManifestData = useCallback((task: AIAgentTask) => {
    const ctx = task.context || {};
    return {
      taskId: task.id,
      canvasId: task.targetCanvasId,
      documentId: task.targetDocumentId,
      client: ctx.clientName || ctx.client || null,
      caseNumber: ctx.caseNumber || ctx.claimNumber || null,
      injuryDate: ctx.injuryDate || null,
      amount: ctx.amount || ctx.benefits || null,
      deadline: ctx.deadline || ctx.dueDate || null,
      assignedAgents: [task.assignedAgent, ...(task.subTasks?.map(st => st.assignedAgent) || [])].filter((v, i, a) => a.indexOf(v) === i),
      subTaskCount: task.subTasks?.length || 0,
      dependencies: task.dependsOn || [],
      progress: task.progress,
      status: task.status,
      startedAt: task.startedAt,
      completedAt: task.completedAt
    };
  }, []);

  // Render individual task with chevron (recursive for hierarchy)
  const renderTask = useCallback((task: AIAgentTask, depth: number = 0) => {
    const isExpanded = expandedTasks.has(task.id);
    const hasSubTasks = task.subTasks && task.subTasks.length > 0;
    const agentConfig = AGENT_CONFIGS[task.assignedAgent] || AGENT_CONFIGS[AgentType.DOCUMENT_AGENT];
    const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG[TaskStatus.PENDING];
    const AgentIcon = agentConfig.icon;
    const manifest = getManifestData(task);
    const summary = getTaskSummary(task);

    return (
      <div key={task.id} className={cn("mb-1.5", depth > 0 && "ml-4")}>
        {/* 🎯 CLEAN ONE-LINE TASK DISPLAY */}
        <div className={cn(
          "rounded-lg border transition-all",
          depth === 0 ? "bg-white border-gray-200 shadow-sm" : "bg-gray-50 border-gray-100",
          task.status === TaskStatus.IN_PROGRESS && "ring-1 ring-indigo-400",
          task.status === TaskStatus.COMPLETED && "opacity-75"
        )}>
          {/* One-Line Header - Always Visible */}
          <div
            className="px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-gray-50/50"
            onClick={() => toggleTaskExpansion(task.id)}
          >
            {/* Chevron */}
            <button className="p-0.5 hover:bg-gray-200 rounded transition-colors">
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
              )}
            </button>

            {/* Completion Checkbox */}
            <button
              className={cn(
                "h-4 w-4 rounded border-2 flex items-center justify-center transition-colors",
                task.status === TaskStatus.COMPLETED
                  ? "bg-green-500 border-green-500"
                  : "border-gray-300 hover:border-gray-400"
              )}
              onClick={(e) => {
                e.stopPropagation();
                // 🎯 MANUAL TASK COMPLETION
                handleTaskComplete(task.id);
              }}
            >
              {task.status === TaskStatus.COMPLETED && (
                <CheckCircle2 className="h-3 w-3 text-white" />
              )}
            </button>

            {/* Agent Icon (small) */}
            <div className={cn("p-1 rounded", agentConfig.badgeClass)}>
              <AgentIcon className="h-3 w-3" />
            </div>

            {/* Clean Summary Title */}
            <span className={cn(
              "flex-1 text-sm font-medium truncate",
              task.status === TaskStatus.COMPLETED ? "text-gray-500 line-through" : "text-gray-900"
            )}>
              {summary}
            </span>

            {/* Status Pill */}
            <span className={cn(
              "px-2 py-0.5 text-xs font-medium rounded-full",
              statusConfig.color
            )}>
              {statusConfig.label}
            </span>

            {/* Sub-task indicator */}
            {hasSubTasks && (
              <span className="text-xs text-gray-400">
                {task.subTasks.length} sub
              </span>
            )}
          </div>

          {/* 🎯 EXPANDED MANIFEST DETAILS */}
          {isExpanded && (
            <div className="px-3 pb-3 pt-1 border-t border-gray-100">
              {/* Parsed Manifest Data */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                {/* Task ID */}
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400 font-medium">Task ID:</span>
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-mono">
                    {manifest.taskId.slice(0, 16)}...
                  </code>
                </div>

                {/* Canvas ID */}
                {manifest.canvasId && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400 font-medium">Canvas:</span>
                    <code className="bg-blue-50 px-1.5 py-0.5 rounded text-blue-700 font-mono">
                      {manifest.canvasId.slice(0, 12)}...
                    </code>
                  </div>
                )}

                {/* Client Name */}
                {manifest.client && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400 font-medium">Client:</span>
                    <span className="text-gray-800 font-medium">{manifest.client}</span>
                  </div>
                )}

                {/* Case Number */}
                {manifest.caseNumber && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400 font-medium">Case #:</span>
                    <code className="bg-purple-50 px-1.5 py-0.5 rounded text-purple-700 font-mono">
                      {manifest.caseNumber}
                    </code>
                  </div>
                )}
              </div>

              {/* Agents Used */}
              {manifest.assignedAgents.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-400 font-medium">Agents:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {manifest.assignedAgents.map((agentType, i) => {
                      const cfg = AGENT_CONFIGS[agentType] || AGENT_CONFIGS[AgentType.DOCUMENT_AGENT];
                      const Icon = cfg.icon;
                      return (
                        <span key={i} className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs", cfg.badgeClass)}>
                          <Icon className="h-2.5 w-2.5" />
                          {cfg.name.replace(' Agent', '')}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sub-Tasks */}
              {hasSubTasks && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-400 font-medium mb-1 block">
                    Sub-tasks ({task.subTasks.length}):
                  </span>
                  <div className="space-y-1">
                    {task.subTasks.map(subTask => renderTask(subTask, depth + 1))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }, [expandedTasks, toggleTaskExpansion, getManifestData, getTaskSummary, onTaskUpdate]);

  // 📊 KANBAN VIEW RENDERER
  const renderKanbanView = () => {
    const columns = [
      { id: 'todo', title: 'To Do', status: ['not-started', 'pending'] },
      { id: 'progress', title: 'In Progress', status: ['in-progress', 'analyzing'] },
      { id: 'attention', title: 'Attention', status: ['blocked', 'paused', 'failed'] },
      { id: 'done', title: 'Completed', status: ['completed'] }
    ];

    // Flatten all tasks (including subtasks) for the board
    const allFlattenedTasks: AIAgentTask[] = [];
    const flatten = (t: AIAgentTask) => {
      allFlattenedTasks.push(t);
      if (t.subTasks) t.subTasks.forEach(flatten);
    };
    activeTasks.filter(t => !t.parentTaskId).forEach(flatten);

    return (
      <div className="flex gap-4 min-w-max pb-2">
        {columns.map(col => {
          const colTasks = allFlattenedTasks.filter(t => col.status.includes(t.status.toLowerCase()));
          return (
            <div key={col.id} className="w-64 flex-none bg-slate-50/50 rounded-xl border border-slate-200/50 flex flex-col max-h-[350px]">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{col.title}</span>
                <Badge variant="secondary" className="bg-white text-slate-500 border-slate-200">{colTasks.length}</Badge>
              </div>
              <div className="p-2 space-y-2 overflow-y-auto flex-1">
                {colTasks.length === 0 ? (
                  <div className="py-8 text-center text-[10px] text-slate-400 italic">No tasks</div>
                ) : (
                  colTasks.map(task => {
                    const cfg = AGENT_CONFIGS[task.assignedAgent] || AGENT_CONFIGS[AgentType.DOCUMENT_AGENT];
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={task.id}
                        className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm hover:border-indigo-300 transition-all cursor-pointer group"
                        onClick={() => toggleTaskExpansion(task.id)}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <div className={cn("p-1 rounded bg-slate-100", cfg.badgeClass)}>
                            <Icon className="h-3 w-3" />
                          </div>
                          <span className="text-xs font-semibold text-slate-700 truncate flex-1">{task.title}</span>
                        </div>
                        {task.progress !== undefined && (
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-[9px] text-slate-400">
                              <span>Progress</span>
                              <span>{task.progress}%</span>
                            </div>
                            <Progress value={task.progress} className="h-1" />
                          </div>
                        )}
                        {task.targetCanvasId && (
                          <div className="mt-2 flex items-center gap-1 text-[9px] font-mono text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-md w-fit">
                            <Layers className="h-2.5 w-2.5" />
                            {task.targetCanvasId.slice(0, 8)}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 🗺️ PLAN VIEW RENDERER (Implementation Strategy)
  const renderPlanView = () => {
    const manifest = getOrchestrationManifest(userId);
    const state = manifest.getState();
    const plan = state.plan;

    if (!plan) {
      return (
        <div className="text-center py-12 text-slate-500">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
            <Flag className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-sm font-medium">No Strategic Plan Generated</p>
          <p className="text-xs mt-1 text-slate-400">The Planner Agent will generate a roadmap here for complex requests</p>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-6">
        <div className="bg-gradient-to-br from-indigo-50/50 to-white p-5 rounded-2xl border border-indigo-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <Target className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Current Goal</span>
              <h2 className="text-lg font-bold text-slate-800 leading-tight">{plan.goal}</h2>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end mb-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-tight">Plan Progress</span>
              <span className="text-sm font-bold text-indigo-600">{plan.progress}%</span>
            </div>
            <Progress value={plan.progress} className="h-2 bg-slate-100" />
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Phase Breakdown</span>
          {plan.steps.map((step, idx) => (
            <div
              key={idx}
              className={cn(
                "p-4 rounded-xl border transition-all flex gap-4 items-start",
                step.status === 'completed' ? "bg-slate-50 border-slate-200 opacity-80" :
                  step.status === 'in-progress' ? "bg-white border-indigo-200 shadow-md ring-1 ring-indigo-100" :
                    "bg-white border-slate-100"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 border-2",
                step.status === 'completed' ? "bg-emerald-500 border-emerald-500" :
                  step.status === 'in-progress' ? "bg-indigo-600 border-indigo-600 animate-pulse" :
                    "bg-white border-slate-200 text-slate-300 font-bold text-[10px]"
              )}>
                {step.status === 'completed' ? <CheckCircle2 className="h-3.5 w-3.5 text-white" /> :
                  step.status === 'in-progress' ? <Zap className="h-3 w-3 text-white" /> :
                    idx + 1}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className={cn(
                    "font-bold text-sm",
                    step.status === 'completed' ? "text-slate-500 line-through" : "text-slate-800"
                  )}>
                    {step.title}
                  </h4>
                  {step.assignedAgent && (
                    <Badge variant="outline" className="text-[9px] h-4 bg-slate-50 border-slate-200">
                      {step.assignedAgent}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {plan.risks.length > 0 && (
          <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100">
            <div className="flex items-center gap-2 mb-2 text-orange-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Potential Risks</span>
            </div>
            <ul className="space-y-1">
              {plan.risks.map((risk, i) => (
                <li key={i} className="text-[11px] text-orange-700 font-medium flex gap-2">
                  <span className="text-orange-300">•</span> {risk}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 🎯 APPROVAL GATE */}
        {!plan.approved && (
          <div className="p-6 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-200 animate-in zoom-in-95 duration-300">
            <div className="flex items-start gap-4 text-white mb-6">
              <div className="p-3 bg-white/20 rounded-xl">
                <Brain className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold">Approve Implementation Strategy</h3>
                <p className="text-sm text-indigo-100 font-medium leading-relaxed">
                  The AI has analyzed your request and proposed the steps above. Please review them and click approve to begin execution.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1 h-12 bg-white text-indigo-600 hover:bg-slate-50 font-bold rounded-xl shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                onClick={async () => {
                  console.log('✅ STRATEGY APPROVED: Resuming workflow...');
                  const orchestrator = AIAgentOrchestrator.getInstance();
                  // For workflow approval, we need the active workflowId
                  if (workflowId) {
                    await orchestrator.approveStrategy(workflowId, 'current-user');
                  }
                }}
              >
                <Zap className="h-4 w-4 fill-current" />
                Approve & Execute
              </Button>
              <Button
                variant="outline"
                className="h-12 border-white/30 bg-white/10 text-white hover:bg-white/20 font-bold rounded-xl"
                onClick={() => setShowFeedback(!showFeedback)}
              >
                {showFeedback ? 'Cancel' : 'Provide Feedback'}
              </Button>
            </div>

            {/* 💬 FEEDBACK INPUT */}
            {showFeedback && (
              <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Describe how you'd like to modify the plan... (e.g., 'skip the doctor meeting, just do the petition')"
                  className="w-full h-24 p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <Button
                  className="mt-3 w-full h-10 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl transition-all"
                  disabled={!feedbackText.trim() || isSubmittingFeedback}
                  onClick={async () => {
                    if (!feedbackText.trim() || !workflowId) return;
                    setIsSubmittingFeedback(true);
                    try {
                      console.log('💬 Submitting feedback:', feedbackText);
                      await orchestrator.providePlanFeedback(workflowId, feedbackText.trim(), 'current-user');
                      setFeedbackText('');
                      setShowFeedback(false);
                    } catch (error) {
                      console.error('❌ Feedback submission failed:', error);
                    } finally {
                      setIsSubmittingFeedback(false);
                    }
                  }}
                >
                  {isSubmittingFeedback ? (
                    <><RefreshCw className="h-4 w-4 animate-spin mr-2" /> Revising Plan...</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" /> Submit Feedback</>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // 🏁 TIMELINE VIEW RENDERER (Implementation Plan Stages)
  const renderTimelineView = () => {
    const rootTasks = activeTasks.filter(t => !t.parentTaskId);
    if (rootTasks.length === 0) return null;

    return (
      <div className="mb-6 px-4">
        <div className="flex items-center w-full relative">
          {/* Connector Line */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0" />

          <div className="flex justify-between w-full relative z-10">
            {rootTasks.map((task, idx) => {
              const cfg = AGENT_CONFIGS[task.assignedAgent] || AGENT_CONFIGS[AgentType.DOCUMENT_AGENT];
              const Icon = cfg.icon;
              const isActive = task.status === 'in-progress' || task.status === 'analyzing';
              const isDone = task.status === 'completed';

              return (
                <div key={task.id} className="flex flex-col items-center gap-2 max-w-[120px]">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                      isActive ? "bg-indigo-600 border-indigo-200 shadow-lg shadow-indigo-200 animate-pulse" :
                        isDone ? "bg-emerald-500 border-emerald-100" : "bg-white border-slate-200"
                    )}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    ) : (
                      <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-400")} />
                    )}
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-tight truncate w-full px-1",
                      isActive ? "text-indigo-600" : isDone ? "text-emerald-600" : "text-slate-400"
                    )}>
                      {task.title.includes(':')
                        ? task.title.split(':')[0]
                        : task.title.split(' ').slice(0, 2).join(' ')}
                    </span>
                    {isActive && (
                      <span className="text-[8px] text-indigo-400 font-medium animate-bounce">Active</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Count active tasks
  const activeCount = activeTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
  const totalCount = activeTasks.length;

  // Don't render anything if not visible
  if (!isVisible) return null;

  // Collapsed Bar View (Sleek Gemini Style - Always Visible)
  if (!isExpanded) {
    return (
      <div className="w-full bg-white border-t border-border/30 shadow-sm">
        <div className="px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-2 hover:bg-slate-50 px-2 py-1 rounded-lg transition-colors duration-150"
              aria-label="Expand orchestrator"
            >
              <Bot className={cn("h-4 w-4", isVisible ? "text-indigo-600" : "text-slate-400")} />
              <span className={cn("text-sm font-medium", isVisible ? "text-slate-700" : "text-slate-500")}>
                AI Task Orchestrator
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {/* Status Indicators */}
            <div className="flex items-center gap-2">
              {activeCount > 0 ? (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-md">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-medium text-emerald-700">{activeCount} active</span>
                </div>
              ) : totalCount > 0 ? (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-md">
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span className="text-xs font-medium text-slate-500">{totalCount} tasks</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-md">
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span className="text-xs font-medium text-slate-500">idle</span>
                </div>
              )}
            </div>
          </div>

          {/* Simple On/Off Toggle */}
          <button
            onClick={onToggle}
            className="flex items-center gap-2 px-2.5 py-1 hover:bg-slate-50 rounded-lg transition-colors duration-150"
            aria-label="Toggle orchestrator active state"
            title={isVisible ? "Orchestrator is ON - Processing tasks" : "Orchestrator is OFF - Click to activate"}
          >
            <div className={`w-8 h-4.5 rounded-full transition-colors duration-200 relative ${isVisible ? 'bg-emerald-500' : 'bg-slate-300'
              }`}>
              <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${isVisible ? 'translate-x-3.5' : 'translate-x-0.5'
                }`} />
            </div>
            <span className={cn("text-xs font-semibold", isVisible ? "text-emerald-600" : "text-slate-400")}>
              {isVisible ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>
    );
  }

  // Expanded Panel View (Sleek Gemini Style)
  return (
    <div className="w-full bg-white border-t border-border/30 shadow-md">
      <div className="px-4 py-3 border-b border-slate-100/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors duration-150"
              aria-label="Collapse orchestrator"
              title="Collapse orchestrator"
            >
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </button>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50">
              <Bot className="h-4.5 w-4.5 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-base text-slate-800">AI Command Center</h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab Toggle */}
            <div className="flex items-center p-1 bg-slate-100 rounded-lg mr-2">
              <button
                onClick={() => setActiveTab('strategy')}
                className={cn(
                  "px-3 py-1.5 rounded-md transition-all text-[10px] font-bold uppercase tracking-tight",
                  activeTab === 'strategy' ? "bg-white shadow-sm text-indigo-600" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Strategy
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={cn(
                  "px-3 py-1.5 rounded-md transition-all text-[10px] font-bold uppercase tracking-tight",
                  activeTab === 'active' ? "bg-white shadow-sm text-indigo-600" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Tasks
              </button>
            </div>

            {/* View Mode Toggle (Only for Tasks Tab) */}
            {activeTab === 'active' && (
              <div className="flex items-center p-1 bg-slate-100 rounded-lg mr-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-1.5 rounded-md transition-all flex items-center gap-1.5",
                    viewMode === 'list' ? "bg-white shadow-sm text-indigo-600" : "text-slate-400 hover:text-slate-600"
                  )}
                  title="List View"
                >
                  <List className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-tight">List</span>
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={cn(
                    "p-1.5 rounded-md transition-all flex items-center gap-1.5",
                    viewMode === 'kanban' ? "bg-white shadow-sm text-indigo-600" : "text-slate-400 hover:text-slate-600"
                  )}
                  title="Board View"
                >
                  <Trello className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-tight">Board</span>
                </button>
              </div>
            )}


            <button
              onClick={onToggle}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors duration-150"
            >
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* 🎬 TIMELINE VIEW (IMPLEMENTATION PLAN STAGES) */}
        {renderTimelineView()}

        {/* Workflow Info Banner */}
        {(workflowId || intelligenceDisplay || manifestSummary) && (
          <div className="flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-lg border border-indigo-200/50">
            <Brain className="h-4 w-4 text-indigo-600" />
            <div className="flex-1 text-xs space-y-1">
              {workflowId && (
                <div className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <span className="font-semibold">Plan ID:</span>
                  <span className="bg-white/50 px-1.5 py-0.5 rounded font-mono border border-indigo-100/50">
                    {workflowId.includes('-') && workflowId.length > 20 ? workflowId.substring(0, 8) + '...' : workflowId}
                  </span>
                </div>
              )}
              {intelligenceDisplay && (
                <div className="text-slate-600 dark:text-slate-400">
                  <span className="font-semibold">Confidence:</span> {((intelligenceDisplay.accuracy || 0.95) * 100).toFixed(1)}% •
                  <span className="ml-1">Manifest: {manifestSummary?.totalTasks || 0} active nodes</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-4 max-h-[450px] overflow-auto">
        {/* Dynamic View Content */}
        {activeTab === 'strategy' ? (
          renderPlanView()
        ) : activeTasks.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
              <Target className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium">No active orchestration nodes</p>
            <p className="text-xs mt-1 text-slate-400">Commands will appear here during plan execution</p>
          </div>
        ) : viewMode === 'kanban' ? (
          renderKanbanView()
        ) : (
          <div className="space-y-2 max-w-2xl mx-auto">
            {/* Render top-level tasks (they will recursively render sub-tasks) */}
            {activeTasks
              .filter(task => !task.parentTaskId) // Only render root tasks
              .map(task => renderTask(task, 0))
            }
          </div>
        )}
      </div>
    </div>
  );
}

export default UnifiedTaskOrchestrator;
