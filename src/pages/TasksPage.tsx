import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  CheckSquare, 
  Clock, 
  Mail, 
  Zap, 
  Target, 
  AlertTriangle, 
  FileText, 
  User, 
  CalendarPlus, 
  LayoutGrid, 
  Database 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskService, Task } from '../services/tasks/taskService';
import { CalendarEvent } from '../services/calendar/EmailEventAnalyzer';
import { EnhancedCalendarEventModal } from '../components/calendar/EnhancedCalendarEventModal';
import { AdvancedTaskDatabaseView } from '../components/tasks/AdvancedTaskDatabaseView';
import { useCalendarEventManager } from '../hooks/useCalendarEventManager';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

// Task categories
const taskCategories = {
  all: { title: 'All', icon: <CheckSquare className="h-4 w-4" /> },
  'auto-created': { title: 'Auto-Created', icon: <Zap className="h-4 w-4" /> },
  'from-emails': { title: 'From Emails', icon: <Mail className="h-4 w-4" /> },
  'calendar-events': { title: 'Calendar Events', icon: <Calendar className="h-4 w-4" /> },
  'high-priority': { title: 'High Priority', icon: <AlertTriangle className="h-4 w-4" /> },
  'due-soon': { title: 'Due Soon', icon: <Clock className="h-4 w-4" /> }
};

export default function TasksPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof taskCategories>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'database'>('overview');
  const [taskService] = useState(() => new TaskService());

  const { deleteEvent } = useCalendarEventManager();

  // Load tasks from TaskService
  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const allTasks = await taskService.getTasks();
      setTasks(allTasks);
    } catch (error) {
      console.error('❌ TasksPage: Failed to load tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, [taskService]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Filter tasks based on category and search
  const filteredTasks = tasks.filter(task => {
    let categoryMatch = true;
    switch (selectedCategory) {
      case 'auto-created':
        categoryMatch = task.metadata?.source === 'auto' || task.source === 'google' || !!task.relatedCalendarEventId || !!task.sourceEmail;
        break;
      case 'from-emails':
        categoryMatch = !!task.sourceEmail || task.metadata?.source === 'email';
        break;
      case 'calendar-events':
        categoryMatch = !!task.relatedCalendarEventId || !!task.relatedEventId;
        break;
      case 'high-priority':
        categoryMatch = task.priority === 'high';
        break;
      case 'due-soon': {
        const threeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        categoryMatch = task.dueDate ? new Date(task.dueDate) <= threeDays : false;
        break;
      }
    }

    const searchMatch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.metadata?.caseNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.metadata?.clientName?.toLowerCase().includes(searchQuery.toLowerCase());

    return categoryMatch && searchMatch;
  });

  const categoryCounts: Record<string, number> = {
    all: tasks.length,
    'auto-created': tasks.filter(t => t.metadata?.source === 'auto' || t.source === 'google' || !!t.relatedCalendarEventId || !!t.sourceEmail).length,
    'from-emails': tasks.filter(t => !!t.sourceEmail || t.metadata?.source === 'email').length,
    'calendar-events': tasks.filter(t => !!t.relatedCalendarEventId || !!t.relatedEventId).length,
    'high-priority': tasks.filter(t => t.priority === 'high').length,
    'due-soon': tasks.filter(t => t.dueDate ? new Date(t.dueDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : false).length
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleTaskCreate = async () => {
    try {
      const newTask = await taskService.createTask({
        title: 'New Case Task',
        description: 'Case preparation and action item.',
        priority: 'medium',
        status: 'todo',
        source: 'custom',
        tags: ['legal'],
        metadata: { source: 'manual' }
      });
      setTasks([newTask, ...tasks]);
      toast.success('Task created successfully');
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'low': return 'bg-green-100 text-green-700 border border-green-200';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'in-progress': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'todo': return 'bg-slate-100 text-slate-700 border border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-4 text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 bg-clip-text text-transparent">
              Smart Tasks
            </h1>
            <Badge variant="secondary" className="bg-slate-100 text-slate-700 border border-slate-300">
              <Target className="h-3 w-3 mr-1" />
              {tasks.length} Total
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === 'overview' ? 'default' : 'ghost'}
                onClick={() => setViewMode('overview')}
                className="h-8 px-3"
              >
                <LayoutGrid className="h-4 w-4 mr-1" />
                Overview
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'database' ? 'default' : 'ghost'}
                onClick={() => setViewMode('database')}
                className="h-8 px-3"
              >
                <Database className="h-4 w-4 mr-1" />
                Database
              </Button>
            </div>

            <Button onClick={handleTaskCreate} className="font-semibold bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="h-4 w-4 mr-1.5" />
              New Task
            </Button>
            
            <Button onClick={() => setShowCalendarModal(true)} variant="outline" className="font-semibold">
              <CalendarPlus className="h-4 w-4 mr-1.5" />
              New Event
            </Button>
          </div>
        </div>

        {/* Automation Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="text-xs text-slate-500">Calendar Events</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">{categoryCounts['calendar-events']}</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs">
            <div className="flex items-center space-x-3">
              <Zap className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xs text-slate-500">Tasks Automated</p>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{categoryCounts['auto-created']}</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-slate-500">Email Tasks</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">{categoryCounts['from-emails']}</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-xs text-slate-500">High Priority</p>
                <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{categoryCounts['high-priority']}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'database' ? (
        <AdvancedTaskDatabaseView tasks={filteredTasks} onTaskUpdate={loadTasks} />
      ) : (
        <>
          {/* Category Tabs */}
          <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-850 rounded-lg overflow-x-auto border border-slate-200 dark:border-slate-700">
            {Object.entries(taskCategories).map(([key, category]) => (
              <Button
                key={key}
                variant={selectedCategory === key ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(key as keyof typeof taskCategories)}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap font-medium text-xs",
                  selectedCategory === key 
                    ? "bg-slate-800 text-white shadow-xs" 
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                )}
              >
                {category.icon}
                <span>{category.title}</span>
                <Badge variant="secondary" className="text-[10px] font-semibold px-1.5 py-0">
                  {categoryCounts[key]}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-slate-300 text-slate-600"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Tasks List */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-10 text-slate-500">
                    <CheckSquare className="h-10 w-10 mx-auto mb-3 opacity-40 text-slate-400" />
                    <p className="text-slate-700 dark:text-slate-200 font-semibold">No tasks found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {tasks.length === 0 
                        ? "No tasks have been created yet. Click 'New Task' to get started."
                        : "Try adjusting your filters or search query"
                      }
                    </p>
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition-all shadow-xs"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2.5">
                          <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{task.title}</h3>
                          {task.priority && (
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                          )}
                          {task.status && (
                            <Badge className={getStatusColor(task.status)}>
                              {task.status}
                            </Badge>
                          )}
                          {(task.sourceEmail || task.metadata?.source === 'email' || task.relatedCalendarEventId || task.source === 'google') && (
                            <Badge variant="outline" className="text-xs">
                              {task.sourceEmail || task.metadata?.source === 'email' ? (
                                <><Mail className="h-3 w-3 mr-1" />email</>
                              ) : (
                                <><Calendar className="h-3 w-3 mr-1" />calendar</>
                              )}
                            </Badge>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                          {task.dueDate && (
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          )}
                          {task.metadata?.caseNumber && (
                            <div className="flex items-center">
                              <FileText className="h-3 w-3 mr-1" />
                              Case: {task.metadata.caseNumber}
                            </div>
                          )}
                          {task.metadata?.clientName && (
                            <div className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {task.metadata.clientName}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm"
                          onClick={() => {
                            const prompt = `Please execute autonomous casework and legal document preparation for task: "${task.title}".\nDetails: ${task.description || 'N/A'}\nCase Number: ${task.metadata?.caseNumber || 'N/A'}\nClient: ${task.metadata?.clientName || 'N/A'}\nDue Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}\nTask Status: ${task.status || 'todo'}\n\nDeliverable requirements: Generate formal California 28-line legal document (pleading, DOR, objection, or petition) and calculate all relevant statutory timelines under the California Labor Code.`;
                            window.dispatchEvent(new CustomEvent('genieflow:set-prompt', { detail: { prompt } }));
                            navigate('/workbench');
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 gap-1.5 font-semibold shadow-xs"
                        >
                          <Zap className="h-3 w-3" />
                          Execute with Agent
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleTaskDelete(task.id)}
                          className="text-red-600 hover:bg-red-50 text-xs h-8"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Enhanced Calendar Event Modal */}
      {showCalendarModal && (
        <EnhancedCalendarEventModal
          isOpen={true}
          event={selectedEvent ? {
            ...selectedEvent,
            date: dayjs(selectedEvent.startDate || new Date()),
            createdAt: dayjs(),
            updatedAt: dayjs()
          } : undefined}
          onClose={() => {
            setShowCalendarModal(false);
            setSelectedEvent(null);
          }}
          onSave={async () => {
            setShowCalendarModal(false);
            setSelectedEvent(null);
            toast.success('Calendar event saved successfully');
          }}
          onDelete={selectedEvent ? async () => {
            await deleteEvent(selectedEvent.id);
            setShowCalendarModal(false);
            setSelectedEvent(null);
            toast.success('Calendar event deleted successfully');
          } : undefined}
        />
      )}
    </div>
  );
}
