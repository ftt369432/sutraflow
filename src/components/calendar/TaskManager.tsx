import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  Target,
  Users,
  FileText,
  Settings
} from 'lucide-react';
import { Button } from '../ui/Button';
import { CalendarEvent } from '../../services/calendar/calendarService';
import { Task, taskService } from '../../services/tasks/taskService';
import { toast } from 'sonner';

interface TaskFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  estimatedMinutes?: number;
  taskType: 'google' | 'custom' | 'hybrid';
  relatedEventId?: string;
  caseNumber?: string;
}

interface TaskManagerProps {
  event?: CalendarEvent;
  onClose?: () => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({ event, onClose }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [taskStrategy, setTaskStrategy] = useState<'google' | 'custom' | 'hybrid'>('hybrid');
  
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    taskType: 'hybrid',
    relatedEventId: event?.id
  });

  useEffect(() => {
    loadTasks();
  }, [event]);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      let allTasks: Task[] = [];
      
      if (event) {
        // Load tasks related to this specific event
        allTasks = await taskService.getTasksForEvent(event.id);
      } else {
        // Load all tasks
        allTasks = await taskService.getTasks();
      }
      
      setTasks(allTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!formData.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      let newTask: Task;

      switch (formData.taskType) {
        case 'google':
          // Create task in Google Tasks only
          newTask = await taskService.createGoogleTask({
            title: formData.title,
            description: formData.description,
            dueDate: formData.dueDate
          });
          break;
          
        case 'custom':
          // Create task in our custom system only
          newTask = await taskService.createCustomTask({
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
            dueDate: formData.dueDate,
            estimatedMinutes: formData.estimatedMinutes,
            relatedEventId: formData.relatedEventId,
            metadata: {
              caseNumber: formData.caseNumber,
              source: 'manual'
            }
          });
          break;
          
        case 'hybrid':
        default:
          // Create task in both systems with sync
          newTask = await taskService.createHybridTask({
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
            dueDate: formData.dueDate,
            estimatedMinutes: formData.estimatedMinutes,
            relatedEventId: formData.relatedEventId,
            metadata: {
              caseNumber: formData.caseNumber,
              source: 'manual'
            }
          });
          break;
      }

      setTasks(prev => [newTask, ...prev]);
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        taskType: 'hybrid',
        relatedEventId: event?.id
      });
      setShowForm(false);
      
      toast.success(`Task created successfully`, {
        description: formData.taskType === 'hybrid' 
          ? 'Synced to Google Tasks and internal system'
          : formData.taskType === 'google'
          ? 'Added to Google Tasks'
          : 'Added to internal task system'
      });
      
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task');
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      const updatedTask = await taskService.toggleTaskStatus(task.id);
      setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
      
      toast.success(`Task ${updatedTask.status === 'done' ? 'completed' : 'reopened'}`);
    } catch (error) {
      console.error('Failed to toggle task:', error);
      toast.error('Failed to update task');
    }
  };

  const getTaskIcon = (task: Task) => {
    if (task.source === 'google') return '🗓️';
    if (task.source === 'hybrid') return '🔄';
    return '📝';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {event ? `Tasks for ${event.title}` : 'Task Manager'}
          </h2>
          {event && (
            <p className="text-sm text-gray-600">
              {event.start.toLocaleDateString()} at {event.start.toLocaleTimeString()}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Task Strategy Selection */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2 flex items-center">
          <Settings className="h-4 w-4 mr-1" />
          Task Management Strategy
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => setTaskStrategy('google')}
            className={`p-3 rounded border text-left ${
              taskStrategy === 'google' 
                ? 'border-blue-500 bg-blue-100' 
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="font-medium">🗓️ Google Tasks Only</div>
            <div className="text-sm text-gray-600">
              Simple tasks sync with Google Tasks mobile app
            </div>
          </button>
          
          <button
            onClick={() => setTaskStrategy('custom')}
            className={`p-3 rounded border text-left ${
              taskStrategy === 'custom' 
                ? 'border-blue-500 bg-blue-100' 
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="font-medium">📝 Custom Tasks Only</div>
            <div className="text-sm text-gray-600">
              Advanced legal features, case linking, time tracking
            </div>
          </button>
          
          <button
            onClick={() => setTaskStrategy('hybrid')}
            className={`p-3 rounded border text-left ${
              taskStrategy === 'hybrid' 
                ? 'border-blue-500 bg-blue-100' 
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="font-medium">🔄 Hybrid System</div>
            <div className="text-sm text-gray-600">
              Best of both: Google sync + legal features
            </div>
          </button>
        </div>
      </div>

      {/* Task Creation Form */}
      {showForm && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <h3 className="font-medium text-gray-900">Create New Task</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter task title..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter task description..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="datetime-local"
                value={formData.dueDate?.toISOString().slice(0, 16) || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  dueDate: e.target.value ? new Date(e.target.value) : undefined 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Time (minutes)
              </label>
              <input
                type="number"
                value={formData.estimatedMinutes || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  estimatedMinutes: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Case Number
              </label>
              <input
                type="text"
                value={formData.caseNumber || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, caseNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="CASE-2025-001"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateTask}>
              Create Task
            </Button>
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No tasks found</p>
            <p className="text-sm">Create a task to get started</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`border rounded-lg p-4 transition-all ${
                task.status === 'done' 
                  ? 'bg-gray-50 border-gray-200' 
                  : 'bg-white border-gray-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-start space-x-3">
                <button
                  onClick={() => handleToggleTask(task)}
                  className={`mt-1 ${
                    task.status === 'done' 
                      ? 'text-green-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <CheckSquare className="h-5 w-5" />
                </button>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <h4 className={`font-medium ${
                      task.status === 'done' 
                        ? 'line-through text-gray-500' 
                        : 'text-gray-900'
                    }`}>
                      {getTaskIcon(task)} {task.title}
                    </h4>
                    
                    <div className="flex items-center space-x-2">
                      {task.priority && (
                        <span className={`px-2 py-1 text-xs rounded border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {task.dueDate.toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {task.description && (
                    <p className={`text-sm ${
                      task.status === 'done' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {task.description}
                    </p>
                  )}
                  
                  {task.metadata?.caseNumber && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <FileText className="h-3 w-3" />
                      <span>Case: {task.metadata.caseNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
