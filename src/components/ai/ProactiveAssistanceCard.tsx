import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  Brain, 
  CheckCircle, 
  Clock, 
  Target, 
  Lightbulb,
  AlertCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Task } from '../../types/ai';

interface ProactiveAssistanceCardProps {
  content: string;
  assistanceType: 'task_detection' | 'struggle_detection' | 'progress_support';
  task?: Task;
  onAcceptTask?: (task: Task) => void;
  onDeclineTask?: () => void;
  onBreakdownTask?: (task: Task) => void;
}

export function ProactiveAssistanceCard({
  content,
  assistanceType,
  task,
  onAcceptTask,
  onDeclineTask,
  onBreakdownTask
}: ProactiveAssistanceCardProps) {
  const getIcon = () => {
    switch (assistanceType) {
      case 'task_detection':
        return <Target className="h-5 w-5 text-blue-500" />;
      case 'struggle_detection':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'progress_support':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Brain className="h-5 w-5 text-purple-500" />;
    }
  };

  const getTitle = () => {
    switch (assistanceType) {
      case 'task_detection':
        return 'Task Detected';
      case 'struggle_detection':
        return 'Need Help?';
      case 'progress_support':
        return 'Progress Update';
      default:
        return 'AI Assistant';
    }
  };

  const getBadgeColor = () => {
    switch (assistanceType) {
      case 'task_detection':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700';
      case 'struggle_detection':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700';
      case 'progress_support':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const taskMetadata = task ? (task as any).metadata : null;

  return (
    <Card className="border-l-4 border-l-blue-600 bg-gradient-to-r from-slate-50/50 to-transparent dark:from-slate-900/20 dark:to-transparent shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon()}
            <CardTitle className="text-sm font-medium text-slate-800 dark:text-slate-200">{getTitle()}</CardTitle>
            <Sparkles className="h-4 w-4 text-blue-500" />
          </div>
          <Badge className={`text-xs ${getBadgeColor()}`}>
            Proactive
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Task Information */}
        {task && assistanceType === 'task_detection' && (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 space-y-2 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm text-slate-800 dark:text-slate-200">Detected Task</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {task.description}
            </p>
            
            {taskMetadata && (
              <div className="flex flex-wrap gap-2 mt-2">
                {taskMetadata.priority && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {taskMetadata.priority} priority
                  </Badge>
                )}
                {taskMetadata.complexity && (
                  <Badge variant="outline" className="text-xs">
                    <Brain className="h-3 w-3 mr-1" />
                    {taskMetadata.complexity}
                  </Badge>
                )}
                {taskMetadata.estimatedDuration && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {taskMetadata.estimatedDuration}
                  </Badge>
                )}
                {taskMetadata.category && (
                  <Badge variant="outline" className="text-xs">
                    {taskMetadata.category}
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        {/* AI Response */}
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
            {content}
          </div>
        </div>

        {/* Action Buttons */}
        {task && assistanceType === 'task_detection' && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            {onAcceptTask && (
              <Button
                size="sm"
                onClick={() => onAcceptTask(task)}
                className="gleaming-silver-button bg-blue-600 hover:bg-blue-700 text-white border-0"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept Task
              </Button>
            )}
            
            {onBreakdownTask && taskMetadata?.complexity !== 'simple' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBreakdownTask(task)}
                className="slate-silver-gleam border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Break Down Task
              </Button>
            )}
            
            {onDeclineTask && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDeclineTask}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Continue Chat
              </Button>
            )}
          </div>
        )}

        {/* Suggested Actions for Struggle Detection */}
        {assistanceType === 'struggle_detection' && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-amber-200 dark:border-amber-700">
            <Button size="sm" variant="outline" className="slate-silver-gleam text-amber-700 border-amber-300 dark:text-amber-300 dark:border-amber-600">
              <Lightbulb className="h-4 w-4 mr-2" />
              Get Suggestions
            </Button>
            <Button size="sm" variant="outline" className="slate-silver-gleam text-amber-700 border-amber-300 dark:text-amber-300 dark:border-amber-600">
              <Brain className="h-4 w-4 mr-2" />
              Explain Concept
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 