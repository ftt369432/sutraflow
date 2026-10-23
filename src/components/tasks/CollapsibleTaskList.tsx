import React, { useState } from 'react';
import { ChevronRight, ChevronDown, CheckCircle, Circle, Clock, AlertCircle, Calendar, Zap, Bot, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TaskStep {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  type: 'calendar' | 'agent' | 'email' | 'document' | 'automation';
  duration?: string;
  timestamp?: Date;
  details?: string;
  subTasks?: TaskStep[];
}

interface CollapsibleTaskListProps {
  title: string;
  tasks: TaskStep[];
  defaultExpanded?: boolean;
  onTaskClick?: (task: TaskStep) => void;
  className?: string;
  showProgress?: boolean;
}

export function CollapsibleTaskList({
  title,
  tasks,
  defaultExpanded = false,
  onTaskClick,
  className,
  showProgress = true
}: CollapsibleTaskListProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [expandedSubTasks, setExpandedSubTasks] = useState<Set<string>>(new Set());

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleSubTask = (taskId: string) => {
    const newExpanded = new Set(expandedSubTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedSubTasks(newExpanded);
  };

  const getStatusIcon = (status: TaskStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTypeIcon = (type: TaskStep['type']) => {
    switch (type) {
      case 'calendar':
        return <Calendar className="h-3 w-3 text-blue-600" />;
      case 'agent':
        return <Bot className="h-3 w-3 text-purple-600" />;
      case 'email':
        return <FileText className="h-3 w-3 text-orange-600" />;
      case 'automation':
        return <Zap className="h-3 w-3 text-yellow-600" />;
      default:
        return <FileText className="h-3 w-3 text-gray-600" />;
    }
  };

  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const TaskItem = ({ task, isSubTask = false }: { task: TaskStep; isSubTask?: boolean }) => {
    const hasSubTasks = task.subTasks && task.subTasks.length > 0;
    const isSubTaskExpanded = expandedSubTasks.has(task.id);

    return (
      <div className={cn(
        "border border-gray-200 rounded-md",
        isSubTask && "ml-6 border-l-2 border-l-blue-200"
      )}>
        <div
          className={cn(
            "flex items-center gap-2 p-3 hover:bg-gray-50 cursor-pointer transition-colors",
            task.status === 'completed' && "bg-green-50",
            task.status === 'failed' && "bg-red-50"
          )}
          onClick={() => {
            if (hasSubTasks) {
              toggleSubTask(task.id);
            }
            onTaskClick?.(task);
          }}
        >
          {hasSubTasks && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSubTask(task.id);
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isSubTaskExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
          
          {getStatusIcon(task.status)}
          
          <div className="flex items-center gap-1">
            {getTypeIcon(task.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-sm font-medium truncate",
                task.status === 'completed' && "line-through text-gray-500"
              )}>
                {task.title}
              </span>
              {task.duration && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {task.duration}
                </span>
              )}
            </div>
            
            {task.description && (
              <p className="text-xs text-gray-600 mt-1 truncate">
                {task.description}
              </p>
            )}
            
            {task.timestamp && (
              <p className="text-xs text-gray-400 mt-1">
                {task.timestamp.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {hasSubTasks && isSubTaskExpanded && (
          <div className="border-t border-gray-100 bg-gray-25">
            <div className="space-y-1 p-2">
              {task.subTasks!.map((subTask) => (
                <TaskItem key={subTask.id} task={subTask} isSubTask />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("bg-white border border-gray-200 rounded-lg shadow-sm", className)}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-600" />
          )}
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <span className="text-sm text-gray-500">({tasks.length})</span>
        </div>
        
        {showProgress && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {completedTasks}/{totalTasks}
            </span>
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Task List */}
      {isExpanded && (
        <div className="p-4 space-y-2">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No tasks yet</p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Example usage for calendar events
export function CalendarEventTaskList({ eventId, onTaskUpdate }: { 
  eventId: string; 
  onTaskUpdate?: (taskId: string, status: TaskStep['status']) => void;
}) {
  // Mock data - in production this would come from your calendar service
  const calendarTasks: TaskStep[] = [
    {
      id: 'prep-1',
      title: 'Review case files',
      description: 'Gather all relevant documents for WCAB hearing',
      status: 'completed',
      type: 'document',
      duration: '30 min',
      timestamp: new Date(),
    },
    {
      id: 'prep-2',
      title: 'Prepare client questions',
      description: 'Draft questions for testimony',
      status: 'in-progress',
      type: 'document',
      duration: '45 min',
    },
    {
      id: 'prep-3',
      title: 'Schedule pre-hearing conference',
      description: 'Coordinate with opposing counsel',
      status: 'pending',
      type: 'calendar',
      duration: '15 min',
      subTasks: [
        {
          id: 'prep-3-1',
          title: 'Send calendar invite',
          status: 'pending',
          type: 'email',
        },
        {
          id: 'prep-3-2',
          title: 'Confirm availability',
          status: 'pending',
          type: 'calendar',
        }
      ]
    }
  ];

  return (
    <CollapsibleTaskList
      title="WCAB Hearing Preparation"
      tasks={calendarTasks}
      defaultExpanded={true}
      onTaskClick={(task) => {
        console.log('Task clicked:', task);
        // Handle task interaction
      }}
      showProgress={true}
    />
  );
}

// Example usage for agent workflows
export function AgentWorkflowTaskList({ workflowId }: { workflowId: string }) {
  const agentTasks: TaskStep[] = [
    {
      id: 'agent-1',
      title: 'Email analysis complete',
      description: 'Processed 15 emails for calendar events',
      status: 'completed',
      type: 'agent',
      duration: '2 min',
      timestamp: new Date(Date.now() - 120000),
    },
    {
      id: 'agent-2',
      title: 'Creating calendar events',
      description: 'Found 3 potential calendar events',
      status: 'in-progress',
      type: 'calendar',
      duration: '1 min',
      timestamp: new Date(),
      subTasks: [
        {
          id: 'agent-2-1',
          title: 'WCAB Hearing - Case #12345',
          status: 'completed',
          type: 'calendar',
        },
        {
          id: 'agent-2-2',
          title: 'Client Meeting - John Doe',
          status: 'in-progress',
          type: 'calendar',
        },
        {
          id: 'agent-2-3',
          title: 'Deposition - Medical Exam',
          status: 'pending',
          type: 'calendar',
        }
      ]
    },
    {
      id: 'agent-3',
      title: 'Generate follow-up tasks',
      description: 'Creating preparation workflows',
      status: 'pending',
      type: 'automation',
      duration: '30 sec',
    }
  ];

  return (
    <CollapsibleTaskList
      title="AI Agent Workflow"
      tasks={agentTasks}
      defaultExpanded={true}
      showProgress={true}
      className="border-blue-200 bg-blue-50"
    />
  );
}
