import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  Tag, 
  MoreHorizontal, 
  User, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { Badge } from '../ui/Badge';
import { NotebookBlock } from '../../types/notebook';
import { Task, TaskPriority, TaskStatus } from '../../types/tasks';
import { DatePicker } from '../ui/DatePicker';

interface TaskBlockProps {
  block: NotebookBlock;
  onUpdate: (updates: Partial<NotebookBlock>) => void;
  onConvertToTask: (task: Task) => Promise<string>;
  onViewTask: (taskId: string) => void;
}

export const TaskBlock: React.FC<TaskBlockProps> = ({
  block,
  onUpdate,
  onConvertToTask,
  onViewTask,
}) => {
  const taskData = block.metadata?.task as Task | undefined;
  const [isExpanded, setIsExpanded] = useState(true);
  const [isConverting, setIsConverting] = useState(false);
  
  // Make sure content is always a string to prevent rendering objects directly
  const blockContent = typeof block.content === 'object' 
    ? JSON.stringify(block.content) 
    : block.content;
  
  const [taskTitle, setTaskTitle] = useState(taskData?.title || blockContent || '');
  const [taskDescription, setTaskDescription] = useState(taskData?.description || '');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>(taskData?.priority || 'medium');
  const [dueDate, setDueDate] = useState<Date | undefined>(taskData?.dueDate);
  const [assignee, setAssignee] = useState<string | undefined>(taskData?.assignee);
  const [status, setStatus] = useState<TaskStatus>(taskData?.status || 'todo');

  const handleConvertToTask = async () => {
    if (!taskTitle.trim()) return;
    
    setIsConverting(true);
    
    try {
      const task: Task = {
        id: taskData?.id || '',
        title: taskTitle,
        description: taskDescription,
        status,
        priority: taskPriority,
        createdAt: new Date(),
        updatedAt: new Date(),
        dueDate,
        assignee,
        tags: taskData?.tags || [],
        source: {
          type: 'notebook',
          id: block.metadata?.notebookId || '',
          blockId: block.id
        }
      };
      
      // Create task in external system
      const taskId = await onConvertToTask(task);
      
      // Update block metadata with task reference
      onUpdate({
        metadata: {
          ...block.metadata,
          task: {
            ...task,
            id: taskId
          },
          taskId
        }
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    setStatus(newStatus);
    
    if (taskData?.id) {
      // If this is already a task, update it in the block
      onUpdate({
        metadata: {
          ...block.metadata,
          task: {
            ...taskData,
            status: newStatus,
            updatedAt: new Date()
          }
        }
      });
    }
  };

  const handlePriorityChange = (newPriority: TaskPriority) => {
    setTaskPriority(newPriority);
    
    if (taskData?.id) {
      // If this is already a task, update it in the block
      onUpdate({
        metadata: {
          ...block.metadata,
          task: {
            ...taskData,
            priority: newPriority,
            updatedAt: new Date()
          }
        }
      });
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="text-green-500" size={16} />;
      case 'in-progress': return <Circle className="text-blue-500" size={16} />;
      case 'blocked': return <AlertCircle className="text-red-500" size={16} />;
      default: return <Circle className="text-gray-400" size={16} />;
    }
  };

  const handleDueDateChange = (date: Date | undefined) => {
    setDueDate(date);
    
    if (taskData?.id) {
      // If this is already a task, update it in the block
      onUpdate({
        metadata: {
          ...block.metadata,
          task: {
            ...taskData,
            dueDate: date,
            updatedAt: new Date()
          }
        }
      });
    }
  };

  return (
    <Card className="border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="p-3 border-b bg-muted/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleStatusChange(status === 'completed' ? 'todo' : 'completed')}
            className="flex-shrink-0"
          >
            {getStatusIcon(status)}
          </button>
          
          {!taskData?.id ? (
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Task title"
              className="bg-transparent border-none focus:outline-none w-full font-medium"
            />
          ) : (
            <span className="font-medium">{taskTitle}</span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {taskData?.id && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0"
              onClick={() => onViewTask(taskData.id)}
            >
              <ArrowUpRight size={14} />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </Button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-3 space-y-3">
          {!taskData?.id ? (
            <textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Description"
              className="w-full bg-transparent border rounded-md p-2 min-h-[80px] text-sm"
            />
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-300">{taskDescription}</p>
          )}
          
          <div className="flex flex-wrap gap-2 mt-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                  {getStatusIcon(status)}
                  <span>
                    {status === 'todo' ? 'To Do' : 
                     status === 'in-progress' ? 'In Progress' : 
                     status === 'blocked' ? 'Blocked' : 
                     'Completed'}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <div className="space-y-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start gap-2 text-xs"
                    onClick={() => handleStatusChange('todo')}
                  >
                    <Circle className="text-gray-400" size={14} />
                    <span>To Do</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start gap-2 text-xs"
                    onClick={() => handleStatusChange('in-progress')}
                  >
                    <Circle className="text-blue-500" size={14} />
                    <span>In Progress</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start gap-2 text-xs"
                    onClick={() => handleStatusChange('blocked')}
                  >
                    <AlertCircle className="text-red-500" size={14} />
                    <span>Blocked</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start gap-2 text-xs"
                    onClick={() => handleStatusChange('completed')}
                  >
                    <CheckCircle2 className="text-green-500" size={14} />
                    <span>Completed</span>
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                  <Tag size={14} />
                  <span>
                    {taskPriority.charAt(0).toUpperCase() + taskPriority.slice(1)}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <div className="space-y-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start gap-2 text-xs"
                    onClick={() => handlePriorityChange('high')}
                  >
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-200">High</Badge>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start gap-2 text-xs"
                    onClick={() => handlePriorityChange('medium')}
                  >
                    <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200">Medium</Badge>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start gap-2 text-xs"
                    onClick={() => handlePriorityChange('low')}
                  >
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Low</Badge>
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            
            <DatePicker
              date={dueDate}
              onSelect={handleDueDateChange}
            >
              <Button variant="outline" size="sm" className="gap-2 text-xs">
                <Calendar size={14} />
                <span>{dueDate ? format(dueDate, 'MMM d, yyyy') : 'Due Date'}</span>
              </Button>
            </DatePicker>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                  <User size={14} />
                  <span>{assignee || 'Assign'}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <div className="space-y-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start text-xs"
                    onClick={() => setAssignee('Me')}
                  >
                    Me
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start text-xs"
                    onClick={() => setAssignee('Team')}
                  >
                    Team
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {!taskData?.id && (
            <div className="flex justify-end mt-3">
              <Button 
                onClick={handleConvertToTask}
                disabled={isConverting || !taskTitle.trim()}
                size="sm"
                className="gap-2"
              >
                {isConverting ? (
                  <>
                    <Clock className="animate-spin" size={14} />
                    <span>Converting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Convert to Task</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}; 