/**
 * 🎯 Cursor AI-Style Task Progress Panel
 * 
 * Shows detected tasks with auto-check-off functionality
 * and progress tracking for multi-canvas sessions
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Clock, FileText, AlertTriangle, Calendar, ChevronDown, ChevronUp, Play, Pause, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { cn } from '../../lib/utils';
import { DetectedTask, MultiCanvasSession, TaskCanvas, multiCanvasOrchestrator } from '../../services/canvas/MultiCanvasTaskOrchestrator';

interface TaskProgressPanelProps {
  session: MultiCanvasSession | null;
  onTaskClick: (task: DetectedTask) => void;
  onCanvasSwitch: (canvasId: string) => void;
  className?: string;
}

export function TaskProgressPanel({ 
  session, 
  onTaskClick, 
  onCanvasSwitch,
  className = '' 
}: TaskProgressPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  // Auto-check completed tasks
  useEffect(() => {
    if (!session) return;

    // Check for tasks that should be marked as completed
    const interval = setInterval(() => {
      session.tasks.forEach(task => {
        if (task.status !== 'completed' && task.canvasId) {
          const canvas = session.canvases.find(c => c.id === task.canvasId);
          if (canvas && canvas.progress >= 90) {
            handleTaskComplete(task.id);
          }
        }
      });
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [session]);

  const handleTaskComplete = (taskId: string) => {
    if (!session) return;

    setCompletedTasks(prev => new Set(prev).add(taskId));
    multiCanvasOrchestrator.markTaskCompleted(session.id, taskId);
    
    // Update task status
    const task = session.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'completed';
      console.log('✅ Task completed:', task.title);
    }
  };

  const handleTaskToggle = (taskId: string) => {
    if (completedTasks.has(taskId)) {
      // Uncheck task
      setCompletedTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
      
      if (session) {
        const task = session.tasks.find(t => t.id === taskId);
        if (task) task.status = 'in_progress';
      }
    } else {
      // Check task
      handleTaskComplete(taskId);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 dark:text-red-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'medium': return 'text-blue-600 dark:text-blue-400';
      case 'low': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-blue-600 dark:text-blue-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'legal': return '⚖️';
      case 'business': return '💼';
      case 'email': return '📧';
      case 'research': return '🔍';
      case 'planning': return '📋';
      default: return '📄';
    }
  };

  if (!session) {
    return (
      <Card className={cn("task-progress-panel border-l-4 border-l-gray-300", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Task Progress
            </h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500 text-sm">
            No active multi-canvas session
          </div>
        </CardContent>
      </Card>
    );
  }

  const progress = multiCanvasOrchestrator.getSessionProgress(session.id);
  const isCompleted = progress.percentage === 100;

  return (
    <Card className={cn(
      "task-progress-panel border-l-4 transition-all duration-200",
      isCompleted ? "border-l-green-500" : "border-l-blue-500",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">
              {session.title}
            </h3>
            <Badge 
              variant={isCompleted ? "default" : "secondary"}
              className={cn("text-xs", isCompleted && "bg-green-500 text-white")}
            >
              {progress.completed}/{progress.total}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
          <div 
            className={cn(
              "h-2 rounded-full transition-all duration-500",
              isCompleted ? "bg-green-500" : "bg-blue-500"
            )}
            data-progress={progress.percentage}
            style={{
              ['--progress-width' as any]: `${progress.percentage}%`,
              width: `${progress.percentage}%`
            }}
          />
        </div>
        
        {/* Session Info */}
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mt-2">
          <span>{progress.percentage}% complete</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Est. {Math.ceil(session.tasks.reduce((sum, task) => sum + task.estimatedTime, 0) / 60)}h
          </span>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            {session.tasks.map((task) => {
              const isTaskCompleted = completedTasks.has(task.id) || task.status === 'completed';
              const canvas = session.canvases.find(c => c.id === task.canvasId);
              
              return (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-sm",
                    isTaskCompleted 
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
                      : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                  onClick={() => onTaskClick(task)}
                >
                  {/* Checkbox */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 hover:bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaskToggle(task.id);
                    }}
                  >
                    {isTaskCompleted ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Circle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </Button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{getTypeIcon(task.type)}</span>
                      <h4 className={cn(
                        "text-sm font-medium truncate",
                        isTaskCompleted ? "line-through text-gray-500" : "text-gray-900 dark:text-gray-100"
                      )}>
                        {task.title}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs px-1 py-0", getPriorityTextColor(task.priority))}
                      >
                        {task.priority}
                      </Badge>
                    </div>
                    
                    <p className={cn(
                      "text-xs text-gray-600 dark:text-gray-400 line-clamp-2",
                      isTaskCompleted && "line-through"
                    )}>
                      {task.description}
                    </p>

                    {/* Task Meta */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{task.estimatedTime}m</span>
                        {task.suggestedDeadline && (
                          <>
                            <Calendar className="h-3 w-3 ml-1" />
                            <span>{task.suggestedDeadline.toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                      
                      {canvas && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCanvasSwitch(canvas.id);
                          }}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Open Canvas
                        </Button>
                      )}
                    </div>

                    {/* Canvas Progress */}
                    {canvas && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                          <div 
                            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                            data-canvas-progress={canvas.progress}
                            style={{
                              ['--canvas-progress' as any]: `${canvas.progress}%`,
                              width: `${canvas.progress}%`
                            }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Canvas: {canvas.progress}% complete
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Session Actions */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Created: {session.createdAt.toLocaleTimeString()}
            </div>
            
            <div className="flex items-center gap-2">
              {isCompleted ? (
                <Badge variant="default" className="text-xs bg-green-500 text-white">
                  ✅ All Complete
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  🚀 In Progress
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

/**
 * 🎛️ Hook for managing task progress panel state
 */
export function useTaskProgressPanel() {
  const [currentSession, setCurrentSession] = useState<MultiCanvasSession | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showTaskProgress = (session: MultiCanvasSession) => {
    setCurrentSession(session);
    setIsVisible(true);
  };

  const hideTaskProgress = () => {
    setIsVisible(false);
    setCurrentSession(null);
  };

  const updateSessionProgress = (sessionId: string, taskId: string, progress: number) => {
    if (currentSession && currentSession.id === sessionId) {
      const canvas = currentSession.canvases.find(c => c.taskId === taskId);
      if (canvas) {
        canvas.progress = progress;
      }
    }
  };

  return {
    currentSession,
    isVisible,
    showTaskProgress,
    hideTaskProgress,
    updateSessionProgress
  };
}
