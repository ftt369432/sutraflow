import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardHeader, CardContent } from '../ui/Card';
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
  ArrowRight
} from 'lucide-react';

// Import existing agent infrastructure 
import { AgentType, TaskStatus, TaskPriority, AIAgentTask } from '../../services/agents/types';
import { AIAgentOrchestrator } from '../../services/agents/AIAgentOrchestrator';


// 🎯 Task Registry - Unified and restored
import { useMasterTaskRegistry } from '../../hooks/useMasterTaskRegistry';
import { MasterTaskStatus, MasterTaskPriority, OrchestratorSource } from '../../services/MasterTaskRegistry';

// Import real stores for task and calendar integration
import { useTaskStore } from '../../store/taskStore';
import { useCalendarStore } from '../../store/calendarStore';
import { cn } from '../../lib/utils';

// 🎯 Canvas Action Integration - Connect tasks to canvas system
interface CanvasAction {
  type: 'create' | 'surgical_edit' | 'append' | 'advanced_surgical_edit';
  content: string;
  title: string;
  targetDocument?: string;
  targetCanvasId?: string;
  editInstruction?: {
    targetDescription: string;
    action: 'append' | 'prepend' | 'replace' | 'insert';
    preserveFormatting?: boolean;
    semanticTarget?: string;
  };
  metadata?: {
    taskId?: string;
    agent?: AgentType;
    timestamp?: Date;
    source?: string;
  };
}

// 🕐 INTELLIGENT TIME PARSING SYSTEM
const parseTimeReference = (text: string, baseDate: Date = new Date()): { date: Date, confidence: number } => {
  const normalizedText = text.toLowerCase().trim();
  const result = new Date(baseDate);
  let confidence = 0.5; // Default confidence

  // Specific dates (high confidence)
  const specificDateMatch = normalizedText.match(/(\w+day),?\s+(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})?/);
  if (specificDateMatch) {
    const [, dayName, month, day, year] = specificDateMatch;
    // Parse specific date (would need full implementation)
    confidence = 0.95;
  }

  // Time patterns (medium to high confidence)
  const timeMatch = normalizedText.match(/(\d{1,2}):(\d{2})\s*(am|pm)/);
  if (timeMatch) {
    const [, hours, minutes, ampm] = timeMatch;
    let hour = parseInt(hours);
    if (ampm === 'pm' && hour !== 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
    result.setHours(hour, parseInt(minutes), 0, 0);
    confidence += 0.3;
  }

  // Relative day patterns
  if (normalizedText.includes('tomorrow')) {
    result.setDate(result.getDate() + 1);
    confidence = 0.9;
  } else if (normalizedText.includes('today')) {
    // Keep current date
    confidence = 0.9;
  } else if (normalizedText.includes('next friday')) {
    const daysUntilFriday = (5 - result.getDay() + 7) % 7 || 7; // 5 = Friday
    result.setDate(result.getDate() + daysUntilFriday);
    confidence = 0.85;
  } else if (normalizedText.includes('next week')) {
    result.setDate(result.getDate() + 7);
    confidence = 0.8;
  }

  // Relative week patterns
  const weeksMatch = normalizedText.match(/(\d+)\s+weeks?\s+from\s+(today|now)/);
  if (weeksMatch) {
    const weeks = parseInt(weeksMatch[1]);
    result.setDate(result.getDate() + (weeks * 7));
    confidence = 0.9;
  }

  // Relative month patterns  
  const monthsMatch = normalizedText.match(/(\d+)\s+months?\s+from\s+(today|now)/);
  if (monthsMatch) {
    const months = parseInt(monthsMatch[1]);
    result.setMonth(result.getMonth() + months);
    confidence = 0.85;
  }

  // Relative day patterns
  const daysMatch = normalizedText.match(/(\d+)\s+days?\s+from\s+(today|now)/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    result.setDate(result.getDate() + days);
    confidence = 0.9;
  }

  // Exact day references
  if (normalizedText.includes('october 18')) {
    result.setMonth(9); // October is month 9
    result.setDate(18);
    confidence = 0.95;
  }

  // Within timeframe patterns
  const withinMatch = normalizedText.match(/within\s+(\d+)\s+days/);
  if (withinMatch) {
    const days = parseInt(withinMatch[1]);
    result.setDate(result.getDate() + Math.floor(days / 2)); // Schedule in middle of timeframe
    confidence = 0.7;
  }

  // Default fallback times if no time specified
  if (!timeMatch) {
    if (normalizedText.includes('deposition') || normalizedText.includes('meeting')) {
      result.setHours(14, 30, 0, 0); // 2:30 PM default for legal meetings
    } else if (normalizedText.includes('client')) {
      result.setHours(11, 0, 0, 0); // 11:00 AM default for client meetings
    } else {
      result.setHours(10, 0, 0, 0); // 10:00 AM default
    }
  }

  return { date: result, confidence };
};

interface TaskOrchestrationPanelProps {
  isVisible: boolean;
  onToggle: () => void;
  currentConversation?: string;
  lastMessage?: string;
  onTaskCreated?: (task: AIAgentTask) => void;
  autoMode?: boolean;
  onAutoModeChange?: (enabled: boolean) => void;
  // 🎯 Canvas Integration
  onCanvasAction?: (action: CanvasAction) => void;
}

interface TaskSuggestion {
  id: string;
  title: string;
  description: string;
  suggestedAgents: AgentType[];
  priority: TaskPriority;
  estimatedDuration: number;
  confidence: number;
}

const AGENT_CONFIGS = {
  [AgentType.DOCUMENT_AGENT]: {
    name: 'Document Agent',
    icon: FileText,
    color: 'blue',
    description: 'Creates and edits documents, canvases, and written content'
  },
  [AgentType.LEGAL_AGENT]: {
    name: 'Legal Agent',
    icon: Scale,
    color: 'purple',
    description: 'Handles legal documents, petitions, and legal research'
  },
  [AgentType.MEDICAL_AGENT]: {
    name: 'Medical Agent',
    icon: Heart,
    color: 'red',
    description: 'Medical correspondence and healthcare communications'
  },
  [AgentType.CALENDAR_AGENT]: {
    name: 'Calendar Agent',
    icon: Calendar,
    color: 'green',
    description: 'Schedules appointments and manages calendar events'
  },
  [AgentType.EMAIL_AGENT]: {
    name: 'Email Agent',
    icon: Mail,
    color: 'yellow',
    description: 'Composes and manages email communications'
  }
};

const TaskOrchestrationPanel: React.FC<TaskOrchestrationPanelProps> = ({
  isVisible,
  onToggle,
  currentConversation,
  lastMessage,
  onTaskCreated,
  autoMode = true,
  onAutoModeChange,
  onCanvasAction // 🎯 Canvas action callback
}) => {
  // Real store integration with error checking
  const taskStore = useTaskStore();
  const calendarStore = useCalendarStore();

  // Extract functions with null checks
  const addTask = taskStore?.addTask;
  const addEvent = calendarStore?.addEvent;

  // Debug store connections
  useEffect(() => {
    console.log('🔧 STORE CONNECTION DEBUG:', {
      taskStore: !!taskStore,
      addTask: typeof addTask,
      calendarStore: !!calendarStore,
      addEvent: typeof addEvent
    });
  }, [taskStore, addTask, calendarStore, addEvent]);

  // 🎯 Master Task Registry integration
  const {
    tasks: masterTasks,
    stats: masterStats,
    loading: masterLoading,
    createTask: createMasterTask,
    updateTask: updateMasterTask,
    startTask,
    completeTask,
    failTask,
    updateProgress,
    page,
    totalPages,
    setPage,
    refreshTasks
  } = useMasterTaskRegistry({
    autoFetch: true,
    pageSize: 50,
    realTimeUpdates: true
  });

  const [tasks, setTasks] = useState<AIAgentTask[]>([]);
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [orchestrator] = useState(() => new AIAgentOrchestrator());

  // 🔢 Display stats from Task Registry
  const [showMasterLog, setShowMasterLog] = useState(false);

  // AI-powered conversation analysis for task suggestions
  const analyzeConversationForTasks = useCallback(async (message: string) => {
    if (!message || message.length < 10) return;

    setIsAnalyzing(true);

    // 🤖 ENHANCED AI ANALYSIS with TIME-AWARE PROCESSING
    setTimeout(() => {
      const mockSuggestions: TaskSuggestion[] = [];
      const lowerMessage = message.toLowerCase();

      // 📋 LEGAL DOCUMENT TASKS (with urgency detection)
      if (lowerMessage.includes('petition') || lowerMessage.includes('legal') || lowerMessage.includes('motion')) {
        const isUrgent = lowerMessage.includes('urgent') || lowerMessage.includes('emergency') || lowerMessage.includes('immediate');
        const { date: deadline } = parseTimeReference(message);

        mockSuggestions.push({
          id: `suggestion-${Date.now()}-1`,
          title: isUrgent ? 'URGENT: Create Legal Document' : 'Create Legal Petition',
          description: `Draft legal document with deadline: ${deadline.toLocaleDateString()}`,
          suggestedAgents: [AgentType.LEGAL_AGENT, AgentType.DOCUMENT_AGENT],
          priority: isUrgent ? TaskPriority.CRITICAL : TaskPriority.HIGH,
          estimatedDuration: isUrgent ? 30 : 45,
          confidence: 0.92
        });
      }

      // 📅 SCHEDULING TASKS (with intelligent time parsing)
      if (lowerMessage.includes('appointment') || lowerMessage.includes('schedule') || lowerMessage.includes('deposition')) {
        const { date: scheduledDate, confidence } = parseTimeReference(message);

        mockSuggestions.push({
          id: `suggestion-${Date.now()}-2`,
          title: `Schedule for ${scheduledDate.toLocaleDateString()}`,
          description: `Appointment scheduled: ${scheduledDate.toLocaleString()} (Confidence: ${Math.round(confidence * 100)}%)`,
          suggestedAgents: [AgentType.CALENDAR_AGENT],
          priority: TaskPriority.MEDIUM,
          estimatedDuration: 15,
          confidence: confidence
        });
      }

      if (message.toLowerCase().includes('letter') || message.toLowerCase().includes('email')) {
        mockSuggestions.push({
          id: `suggestion-${Date.now()}-3`,
          title: 'Compose Correspondence',
          description: 'Draft professional correspondence from conversation',
          suggestedAgents: [AgentType.EMAIL_AGENT, AgentType.DOCUMENT_AGENT],
          priority: TaskPriority.MEDIUM,
          estimatedDuration: 20,
          confidence: 0.85
        });
      }

      if (message.toLowerCase().includes('document') || message.toLowerCase().includes('canvas')) {
        mockSuggestions.push({
          id: `suggestion-${Date.now()}-4`,
          title: 'Create Document Canvas',
          description: 'Generate structured document from conversation content',
          suggestedAgents: [AgentType.DOCUMENT_AGENT],
          priority: TaskPriority.MEDIUM,
          estimatedDuration: 30,
          confidence: 0.78
        });
      }

      setSuggestions(mockSuggestions);
      setIsAnalyzing(false);
    }, 1500);
  }, []);

  // 🎯 Canvas Action Helper Functions
  const shouldTriggerCanvasAction = useCallback((suggestion: TaskSuggestion, result: any): boolean => {
    const documentAgents = [AgentType.DOCUMENT_AGENT, AgentType.LEGAL_AGENT, AgentType.MEDICAL_AGENT];
    return suggestion.suggestedAgents.some(agent => documentAgents.includes(agent)) &&
      result?.output && result.output.trim().length > 50;
  }, []);

  const extractDocumentTarget = useCallback((message: string): string | null => {
    const patterns = [
      /update\s+(?:the\s+)?(\w+)/i,
      /modify\s+(?:the\s+)?(\w+)/i,
      /edit\s+(?:the\s+)?(\w+)/i,
      /add\s+to\s+(?:the\s+)?(\w+)/i,
      /revise\s+(?:the\s+)?(\w+)/i
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].toLowerCase();
      }
    }
    return null;
  }, []);

  const generateCanvasAction = useCallback((
    suggestion: TaskSuggestion,
    result: any,
    message: string
  ): CanvasAction => {
    const documentTarget = extractDocumentTarget(message);

    if (documentTarget) {
      // Surgical edit for existing document
      return {
        type: 'surgical_edit',
        content: result.output,
        title: suggestion.title,
        targetDocument: documentTarget,
        editInstruction: {
          targetDescription: 'end',
          action: 'append',
          preserveFormatting: true
        },
        metadata: {
          taskId: result.taskId || `task_${Date.now()}`,
          agent: suggestion.suggestedAgents[0],
          timestamp: new Date(),
          source: 'task_orchestration'
        }
      };
    } else {
      // Create new document
      return {
        type: 'create',
        content: result.output,
        title: suggestion.title,
        metadata: {
          taskId: result.taskId || `task_${Date.now()}`,
          agent: suggestion.suggestedAgents[0],
          timestamp: new Date(),
          source: 'task_orchestration'
        }
      };
    }
  }, [extractDocumentTarget]);

  // Analyze last message when it changes
  useEffect(() => {
    if (lastMessage && isVisible) {
      analyzeConversationForTasks(lastMessage);
    }
  }, [lastMessage, isVisible, analyzeConversationForTasks]);

  // Create task from suggestion
  const createTaskFromSuggestion = useCallback(async (suggestion: TaskSuggestion) => {
    console.log('🚀 CREATE TASK BUTTON CLICKED:', suggestion.title);
    console.log('🔧 Store functions available:', {
      addTask: typeof addTask,
      addEvent: typeof addEvent,
      orchestrator: typeof orchestrator
    });

    try {
      // 1. CREATE TASK IN ORCHESTRATOR (for AI agent execution)
      const result = await orchestrator.processUserRequest(
        suggestion.description,
        'user', // In production, use actual user ID
        {
          conversationId: currentConversation,
          originMessage: lastMessage,
          suggestedAgents: suggestion.suggestedAgents,
          priority: suggestion.priority
        }
      );

      const aiTask: AIAgentTask = result.rootTask;

      // 🎯 1.5. CREATE IN TASK REGISTRY (scales to 10,000+ tasks)
      await createMasterTask({
        id: aiTask.id,
        title: suggestion.title,
        description: suggestion.description,
        instruction: suggestion.description,
        status: MasterTaskStatus.QUEUED,
        priority: suggestion.priority === TaskPriority.CRITICAL ? MasterTaskPriority.CRITICAL :
          suggestion.priority === TaskPriority.HIGH ? MasterTaskPriority.HIGH :
            suggestion.priority === TaskPriority.MEDIUM ? MasterTaskPriority.MEDIUM :
              MasterTaskPriority.LOW,
        source: OrchestratorSource.AI_AGENT,
        assigned_agent: suggestion.suggestedAgents[0],
        tags: suggestion.suggestedAgents.map(agent => AGENT_CONFIGS[agent]?.name || agent),
        estimated_duration: suggestion.estimatedDuration,
        context: {
          conversation_id: currentConversation,
          origin_message: lastMessage,
          suggested_agents: suggestion.suggestedAgents
        },
        user_id: 'user' // TODO: Replace with actual user ID
      });

      // 2. CREATE REAL TASK IN TASK STORE (visible in Tasks page)
      // 🕐 PARSE DUE DATE from conversation context
      const taskContext = `${suggestion.title} ${suggestion.description} ${lastMessage}`;
      const { date: dueDate, confidence: dueDateConfidence } = parseTimeReference(taskContext);

      console.log('🔧 DEBUG: About to create task in TaskStore:', {
        title: suggestion.title,
        description: suggestion.description,
        dueDate: dueDate.toLocaleDateString(),
        confidence: dueDateConfidence,
        addTask: typeof addTask,
        addTaskExists: !!addTask
      });

      // Check if addTask function exists
      if (!addTask) {
        console.error('❌ CRITICAL: addTask function is not available from TaskStore');
        throw new Error('TaskStore addTask function not available');
      }

      const realTaskId = await addTask({
        title: suggestion.title,
        description: suggestion.description,
        status: 'To Do' as const,
        priority: suggestion.priority === TaskPriority.CRITICAL ? 'Urgent' as const :
          suggestion.priority === TaskPriority.HIGH ? 'High' as const :
            suggestion.priority === TaskPriority.MEDIUM ? 'Medium' as const :
              suggestion.priority === TaskPriority.LOW ? 'Low' as const : 'Medium' as const,
        dueDate: dueDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
        tags: suggestion.suggestedAgents.map(agent => AGENT_CONFIGS[agent]?.name || agent),
        assignedAssistants: suggestion.suggestedAgents,
        estimatedTime: suggestion.estimatedDuration
      });

      console.log('🎯 DEBUG: Task created with ID:', realTaskId);

      // 3. CREATE CALENDAR EVENT IF SCHEDULING-RELATED
      if (suggestion.suggestedAgents.includes(AgentType.CALENDAR_AGENT) ||
        suggestion.title.toLowerCase().includes('schedule') ||
        suggestion.title.toLowerCase().includes('meeting')) {

        // 🕐 INTELLIGENT TIME PARSING - Extract time from conversation
        const conversationText = `${suggestion.title} ${suggestion.description} ${lastMessage}`;
        const { date: eventStart, confidence } = parseTimeReference(conversationText);

        // Calculate end time (1 hour default, or 2 hours for depositions)
        const eventEnd = new Date(eventStart);
        const duration = suggestion.title.toLowerCase().includes('deposition') ? 2 : 1;
        eventEnd.setHours(eventEnd.getHours() + duration);

        console.log('🕐 TIME PARSING RESULT:', {
          originalText: conversationText.substring(0, 100) + '...',
          parsedDate: eventStart.toLocaleString(),
          confidence: confidence,
          duration: `${duration} hour(s)`
        });

        console.log('🔧 DEBUG: About to create calendar event:', {
          title: suggestion.title,
          eventStart,
          addEvent: typeof addEvent,
          addEventExists: !!addEvent
        });

        // Check if addEvent function exists
        if (!addEvent) {
          console.error('❌ CRITICAL: addEvent function is not available from CalendarStore');
          throw new Error('CalendarStore addEvent function not available');
        }

        const eventId = addEvent({
          title: suggestion.title,
          description: suggestion.description,
          start: eventStart,
          end: eventEnd,
          allDay: false,
          sourceId: 'tasks',
          taskId: realTaskId,
          tags: ['ai-generated', 'task-orchestration']
        });

        console.log('📅 DEBUG: Created calendar event with ID:', eventId);
      }

      // 4. Update local state for orchestration panel
      setTasks(prev => [...prev, aiTask]);

      // 5. Remove from suggestions
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));

      // 6. Notify parent
      onTaskCreated?.(aiTask);

      console.log('✅ Task created in all systems:', {
        orchestrator: aiTask.title,
        taskStore: realTaskId,
        suggestion: suggestion.title
      });

      // 6. CANVAS INTEGRATION - Trigger canvas action for document tasks
      if (onCanvasAction && shouldTriggerCanvasAction(suggestion, result)) {
        const canvasAction = generateCanvasAction(suggestion, result, lastMessage || '');

        console.log('🎯 [Task→Canvas] Triggering canvas action:', canvasAction.type, canvasAction.targetDocument);
        onCanvasAction(canvasAction);
      }

    } catch (error) {
      console.error('❌ CRITICAL ERROR in task creation:', {
        error: error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        suggestion: suggestion.title,
        addTaskAvailable: !!addTask,
        addEventAvailable: !!addEvent,
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });

      // Show user-friendly error
      alert(`Failed to create task: ${suggestion.title}\nError: ${error instanceof Error ? error.message : 'Unknown error'}\nCheck console for details.`);
    }
  }, [orchestrator, currentConversation, lastMessage, onTaskCreated, addTask, addEvent]);

  // Start/pause task execution
  const toggleTaskExecution = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      if (task.status === TaskStatus.PENDING) {
        // For now, just update status - in production would integrate with orchestrator execution
        setTasks(prev => prev.map(t =>
          t.id === taskId
            ? { ...t, status: TaskStatus.IN_PROGRESS, startedAt: new Date() }
            : t
        ));
        console.log(`🚀 Started task: ${task.title}`);
      } else if (task.status === TaskStatus.IN_PROGRESS) {
        // Pause task
        setTasks(prev => prev.map(t =>
          t.id === taskId
            ? { ...t, status: TaskStatus.PENDING }
            : t
        ));
        console.log(`⏸️ Paused task: ${task.title}`);
      }
    } catch (error) {
      console.error('❌ Failed to toggle task execution:', error);
    }
  }, [tasks]);

  // Toggle task expansion
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

  // Get agent display info
  const getAgentInfo = useCallback((agentType: AgentType) => {
    return AGENT_CONFIGS[agentType] || {
      name: agentType,
      icon: Bot,
      color: 'gray',
      description: 'Specialized AI agent'
    };
  }, []);

  // Get status color
  const getStatusColor = useCallback((status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED: return 'bg-green-100 text-green-800';
      case TaskStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-800';
      case TaskStatus.FAILED: return 'bg-red-100 text-red-800';
      case TaskStatus.WAITING_DEPENDENCY: return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // Calculate summary stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const pending = tasks.filter(t => t.status === TaskStatus.PENDING).length;

    return { total, completed, inProgress, pending };
  }, [tasks]);

  if (!isVisible) {
    return (
      <div className="flex-shrink-0 border-b border-gray-200">
        <button
          onClick={onToggle}
          className="w-full px-6 py-2 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-all duration-200 flex items-center justify-between text-sm font-medium text-gray-700"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>AI Task Orchestrator</span>
            {stats.total > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {stats.total}
              </Badge>
            )}
          </div>
          <ChevronDown className="w-4 h-4 rotate-180 transition-transform duration-200" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 border-b border-gray-200 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
      {/* Header */}
      <div className="px-6 py-3 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">AI Task Orchestrator</h3>
            </div>
            {stats.total > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {stats.total} tasks
                </Badge>
                {stats.inProgress > 0 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {stats.inProgress} active
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Auto-Detection Toggle */}
            <Button
              variant={autoMode ? "default" : "outline"}
              size="sm"
              className={cn("gap-2", autoMode && "bg-blue-600 hover:bg-blue-700 text-white")}
              onClick={() => onAutoModeChange?.(!autoMode)}
              title="Auto-detect complex tasks and show orchestration panel"
            >
              <Zap className="h-4 w-4" />
              {autoMode ? "Auto ON" : "Auto OFF"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              title="Collapse Task Orchestrator"
              className="hover:bg-gray-100 transition-colors"
            >
              <ChevronDown className="w-4 h-4 transition-transform duration-200" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {/* 📊 Task Registry Stats Banner */}
        {masterStats && (
          <div className="px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-gray-900">Total Tasks:</span>
                  <span className="text-purple-700 font-bold">{masterStats.total.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-gray-900">Active:</span>
                  <span className="text-blue-700 font-bold">{masterStats.active_tasks}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-gray-900">Queue:</span>
                  <span className="text-yellow-700 font-bold">{masterStats.queue_size}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-gray-900">Completion Rate:</span>
                  <span className="text-green-700 font-bold">{(masterStats.completion_rate * 100).toFixed(1)}%</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMasterLog(!showMasterLog)}
                className="text-xs h-6 px-2"
              >
                {showMasterLog ? 'Hide' : 'Show'} Master Log
              </Button>
            </div>
          </div>
        )}

        {/* AI Suggestions */}
        {suggestions.length > 0 && (
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-gray-900">AI Suggestions</span>
              {isAnalyzing && <div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />}
            </div>
            <div className="space-y-2">
              {suggestions.map(suggestion => (
                <div key={suggestion.id} className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900">{suggestion.title}</h4>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                          {Math.round(suggestion.confidence * 100)}% confidence
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{suggestion.description}</p>
                      <div className="flex items-center gap-2">
                        {suggestion.suggestedAgents.map(agentType => {
                          const agent = getAgentInfo(agentType);
                          const Icon = agent.icon;
                          return (
                            <div key={agentType} className="flex items-center gap-1">
                              <Icon className="w-3 h-3 text-gray-500" />
                              <span className="text-xs text-gray-500">{agent.name}</span>
                            </div>
                          );
                        })}
                        <span className="text-xs text-gray-400">• {suggestion.estimatedDuration}min</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => createTaskFromSuggestion(suggestion)}
                      className="ml-2 text-xs hover:bg-blue-50"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Create
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Tasks */}
        {tasks.length > 0 && (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">Active Tasks</span>
            </div>
            <div className="space-y-2">
              {tasks.map(task => {
                const isExpanded = expandedTasks.has(task.id);
                const agent = getAgentInfo(task.assignedAgent);
                const AgentIcon = agent.icon;

                return (
                  <div key={task.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <button
                            onClick={() => toggleTaskExpansion(task.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                          </button>
                          <AgentIcon className={`w-4 h-4 text-${agent.color}-600`} />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className={getStatusColor(task.status)}>
                                {task.status.replace('_', ' ')}
                              </Badge>
                              <span className="text-xs text-gray-500">{agent.name}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {task.status === TaskStatus.IN_PROGRESS && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleTaskExecution(task.id)}
                            disabled={task.status === TaskStatus.COMPLETED}
                          >
                            {task.status === TaskStatus.IN_PROGRESS ? (
                              <Pause className="w-3 h-3" />
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {task.progress > 0 && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div
                              className={`bg-blue-600 h-1 rounded-full transition-all duration-300`}
                              style={{ width: `${task.progress}%` } as React.CSSProperties}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 p-3 bg-gray-50/50">
                        <p className="text-sm text-gray-700 mb-2">{task.description}</p>
                        {task.context?.originMessage && (
                          <div className="flex items-start gap-2 text-xs text-gray-600 bg-white rounded p-2">
                            <MessageSquare className="w-3 h-3 mt-0.5 text-gray-400" />
                            <div>
                              <span className="font-medium">From conversation:</span>
                              <p className="mt-1 italic">"{task.context.originMessage.slice(0, 100)}..."</p>
                            </div>
                          </div>
                        )}
                        {/* Canvas Link Display */}
                        {task.context?.canvasId && (
                          <div className="flex items-start gap-2 text-xs text-gray-600 bg-white rounded p-2 mt-2">
                            <FileText className="w-3 h-3 mt-0.5 text-blue-400" />
                            <div className="flex-1">
                              <span className="font-medium">Linked Canvas:</span>
                              <p className="mt-1">
                                <span className="font-mono text-blue-600 text-xs">{task.context.canvasId}</span>
                                {task.context.canvasTitle && (
                                  <span className="text-gray-500 ml-1">- {task.context.canvasTitle}</span>
                                )}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {tasks.length === 0 && suggestions.length === 0 && !isAnalyzing && (
          <div className="p-8 text-center">
            <Bot className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">Ready for Task Orchestration</h3>
            <p className="text-xs text-gray-500">
              Continue your conversation and I'll suggest relevant tasks that can be automated with AI agents.
            </p>
          </div>
        )}

        {/* 📊 MASTER TASK LOG - DISABLED */}
        {/* {showMasterLog && (
          <div className="border-t border-gray-200 bg-white">
            <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <h4 className="font-semibold text-gray-900 text-sm">Master Task Registry</h4>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                    {masterTasks.length.toLocaleString()} / {masterStats?.total.toLocaleString() || 0} tasks
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1 || masterLoading}
                    className="h-6 w-6 p-0"
                  >
                    &lt;
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages || masterLoading}
                    className="h-6 w-6 p-0"
                  >
                    &gt;
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refreshTasks}
                    disabled={masterLoading}
                    className="h-6 px-2 text-xs"
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {masterLoading ? (
                <div className="p-4 text-center text-sm text-gray-500">Loading tasks...</div>
              ) : masterTasks.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">No tasks found</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {masterTasks.map((task) => (
                    <div key={task.id} className="px-4 py-2 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h5 className="text-sm font-medium text-gray-900 truncate">{task.title}</h5>
                            <Badge variant="secondary" className={
                              task.status === MasterTaskStatus.COMPLETED ? 'bg-green-100 text-green-800' :
                              task.status === MasterTaskStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
                              task.status === MasterTaskStatus.FAILED ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {task.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span>Priority: {task.priority}/5</span>
                            <span>Source: {task.source}</span>
                            {task.assigned_agent && <span>Agent: {task.assigned_agent}</span>}
                            {task.progress > 0 && <span>Progress: {task.progress}%</span>}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 ml-4">
                          {new Date(task.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default TaskOrchestrationPanel;