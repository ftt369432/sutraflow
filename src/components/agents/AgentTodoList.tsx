import React from 'react';
import { CheckCircle, Clock, AlertCircle, User, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubTask {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  agent?: string;
}

interface AgentTask {
  id: string;
  title: string;
  agent: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  priority: 'high' | 'medium' | 'low';
  progress?: number;
  subtasks?: SubTask[];
  expanded?: boolean;
}

interface AgentTodoListProps {
  tasks: AgentTask[];
  onTaskClick?: (taskId: string) => void;
  onToggleExpand?: (taskId: string) => void;
  className?: string;
}

export const AgentTodoList: React.FC<AgentTodoListProps> = ({ 
  tasks, 
  onTaskClick, 
  onToggleExpand,
  className 
}) => {
  if (tasks.length === 0) return null;

  const getStatusIcon = (status: AgentTask['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getAgentIcon = (agent: string) => {
    switch (agent) {
      case 'LEGAL_AGENT': return '🏛️';
      case 'MEDICAL_AGENT': return '🏥';
      case 'BUSINESS_AGENT': return '💼';
      case 'RESEARCH_AGENT': return '🔬';
      case 'WRITING_AGENT': return '✍️';
      default: return '🤖';
    }
  };

  const getAgentName = (agent: string) => {
    return agent.replace('_AGENT', '').replace('_', ' ');
  };

  const getStatusColor = (status: AgentTask['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-50 border-green-200';
      case 'in-progress': return 'bg-blue-50 border-blue-200';
      case 'error': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: AgentTask['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={cn("mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm", className)}>
      <div className="flex items-center mb-3">
        <User className="w-5 h-5 text-blue-600 mr-2" />
        <h3 className="text-sm font-semibold text-gray-800">Active Agent Tasks</h3>
        <span className="ml-auto text-xs text-gray-500">{tasks.length} tasks</span>
      </div>
      
      <div className="space-y-2">
        {tasks.map((task) => (
          <div key={task.id} className="space-y-1">
            {/* Main Task */}
            <div 
              className={cn(
                "flex items-center justify-between p-3 border rounded-md hover:shadow-sm transition-all cursor-pointer",
                getStatusColor(task.status)
              )}
              onClick={() => onTaskClick?.(task.id)}
            >
              <div className="flex items-center space-x-3 flex-1">
                {/* Expand/Collapse Button */}
                {task.subtasks && task.subtasks.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleExpand?.(task.id);
                    }}
                    className="p-0.5 hover:bg-gray-200 rounded"
                  >
                    {task.expanded ? 
                      <ChevronDown className="w-4 h-4 text-gray-500" /> : 
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    }
                  </button>
                )}
                
                {/* Agent Icon */}
                <span className="text-lg">{getAgentIcon(task.agent)}</span>
                
                {/* Task Details */}
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{task.title}</div>
                  <div className="text-xs text-gray-500">{getAgentName(task.agent)}</div>
                  
                  {/* Progress Bar */}
                  {task.progress !== undefined && (
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={cn(
                          "bg-blue-500 h-1.5 rounded-full transition-all duration-300",
                          task.progress >= 100 ? "w-full" :
                          task.progress >= 90 ? "w-11/12" :
                          task.progress >= 75 ? "w-3/4" :
                          task.progress >= 50 ? "w-1/2" :
                          task.progress >= 25 ? "w-1/4" : "w-1/12"
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Status and Priority */}
              <div className="flex items-center space-x-2">
                {task.priority !== 'medium' && (
                  <span className={cn("px-2 py-1 text-xs rounded-full font-medium", getPriorityColor(task.priority))}>
                    {task.priority}
                  </span>
                )}
                {getStatusIcon(task.status)}
              </div>
            </div>

            {/* Subtasks */}
            {task.expanded && task.subtasks && task.subtasks.length > 0 && (
              <div className="ml-8 space-y-1">
                {task.subtasks.map((subtask) => (
                  <div 
                    key={subtask.id}
                    className="flex items-center justify-between p-2 bg-gray-50 border border-gray-100 rounded-md text-sm hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      {subtask.agent && (
                        <span className="text-sm">{getAgentIcon(subtask.agent)}</span>
                      )}
                      <span className="text-gray-700">{subtask.title}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(subtask.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentTodoList;