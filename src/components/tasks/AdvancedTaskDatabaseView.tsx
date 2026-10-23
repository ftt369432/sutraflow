import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  Calendar,
  CheckSquare,
  Clock,
  Mail,
  User,
  Filter,
  Grid3X3,
  List,
  Search,
  Plus,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Copy,
  Link,
  Tag,
  Users,
  MapPin,
  ExternalLink,
  ArrowUpDown,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Target,
  CalendarX,
  CalendarCheck,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task } from '../../services/tasks/taskService';
import { CalendarEvent } from '../../services/calendar/EmailEventAnalyzer';
import { useCalendarEventManager } from '../../hooks/useCalendarEventManager';

type ViewMode = 'list' | 'board' | 'calendar' | 'gallery';
type SortOption = 'priority' | 'dueDate' | 'title' | 'status' | 'created';
type GroupByOption = 'none' | 'status' | 'priority' | 'assignee' | 'dueDate';

interface AdvancedTaskDatabaseViewProps {
  tasks: Task[];
  calendarEvents: CalendarEvent[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskCreate: () => void;
  onEventView: (event: CalendarEvent) => void;
}

export function AdvancedTaskDatabaseView({
  tasks,
  calendarEvents: propCalendarEvents,
  onTaskUpdate,
  onTaskDelete,
  onTaskCreate,
  onEventView
}: AdvancedTaskDatabaseViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [groupBy, setGroupBy] = useState<GroupByOption>('status');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<{
    status: string[];
    priority: string[];
    assignee: string[];
  }>({
    status: [],
    priority: [],
    assignee: []
  });

  // Use the calendar event manager for full CRUD operations
  const {
    events: managedEvents,
    isLoading: eventsLoading,
    error: eventsError,
    createEvent,
    updateEvent,
    deleteEvent,
    findRelatedEvent: findEventForTask,
    linkTaskToEvent,
    unlinkTaskFromEvent
  } = useCalendarEventManager();

  // Use managed events if available, fallback to props
  const calendarEvents = managedEvents.length > 0 ? managedEvents : propCalendarEvents;

  // Enhanced filtering and sorting
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      const searchMatch = !searchQuery || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const statusMatch = selectedFilters.status.length === 0 || 
        selectedFilters.status.includes(task.status || 'todo');
      
      const priorityMatch = selectedFilters.priority.length === 0 || 
        selectedFilters.priority.includes(task.priority || 'medium');

      return searchMatch && statusMatch && priorityMatch;
    });

    // Sort tasks
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority as keyof typeof priorityOrder] || 2) - 
                 (priorityOrder[a.priority as keyof typeof priorityOrder] || 2);
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'status':
          return (a.status || 'todo').localeCompare(b.status || 'todo');
        case 'created':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [tasks, searchQuery, selectedFilters, sortBy]);

  // Group tasks by selected option
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Tasks': filteredAndSortedTasks };
    }

    const groups: Record<string, Task[]> = {};
    
    filteredAndSortedTasks.forEach(task => {
      let groupKey = '';
      switch (groupBy) {
        case 'status':
          groupKey = task.status || 'No Status';
          break;
        case 'priority':
          groupKey = task.priority || 'No Priority';
          break;
        case 'assignee':
          groupKey = (task.metadata as any)?.assignee || 'Unassigned';
          break;
        case 'dueDate':
          if (!task.dueDate) {
            groupKey = 'No Due Date';
          } else {
            const today = new Date();
            const dueDate = new Date(task.dueDate);
            const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) groupKey = 'Overdue';
            else if (diffDays === 0) groupKey = 'Due Today';
            else if (diffDays <= 7) groupKey = 'Due This Week';
            else groupKey = 'Due Later';
          }
          break;
        default:
          groupKey = 'All Tasks';
      }

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(task);
    });

    return groups;
  }, [filteredAndSortedTasks, groupBy]);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium': return <Target className="h-4 w-4 text-amber-500" />;
      case 'low': return <Circle className="h-4 w-4 text-green-500" />;
      default: return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-50 text-green-700 border-green-200';
      case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'todo': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const findRelatedEvent = (task: Task) => {
    return calendarEvents.find(event => 
      event.id === task.relatedCalendarEventId || 
      event.id === task.relatedEventId ||
      event.metadata?.caseNumber === task.metadata?.caseNumber
    );
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const relatedEvent = findRelatedEvent(task);
    
    return (
      <div className="group relative bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all duration-200">
        {/* Task Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 flex-1">
            <button 
              onClick={() => onTaskUpdate(task.id, { 
                status: task.status === 'done' ? 'todo' : 'done' 
              })}
              className="mt-0.5"
            >
              {getStatusIcon(task.status || 'todo')}
            </button>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                {task.title}
              </h3>
              {task.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <Eye className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
              onClick={() => onTaskDelete(task.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Task Properties */}
        <div className="flex flex-wrap gap-2 mb-3">
          {task.priority && (
            <Badge className={cn("text-xs border", getPriorityColor(task.priority))}>
              {getPriorityIcon(task.priority)}
              <span className="ml-1 capitalize">{task.priority}</span>
            </Badge>
          )}
          
          {task.status && (
            <Badge className={cn("text-xs border", getStatusColor(task.status))}>
              <span className="capitalize">{task.status}</span>
            </Badge>
          )}

          {task.dueDate && (
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {new Date(task.dueDate).toLocaleDateString()}
            </Badge>
          )}

          {(task.metadata as any)?.assignee && (
            <Badge variant="outline" className="text-xs">
              <User className="h-3 w-3 mr-1" />
              {(task.metadata as any).assignee}
            </Badge>
          )}
        </div>

        {/* Related Event */}
        {relatedEvent && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">{relatedEvent.title}</span>
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 w-6 p-0 text-blue-600"
                onClick={() => onEventView(relatedEvent)}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
            {relatedEvent.startDate && (
              <div className="flex items-center space-x-2 mt-1">
                <Clock className="h-3 w-3 text-blue-600" />
                <span className="text-xs text-blue-700">
                  {relatedEvent.startDate.toLocaleDateString()} at {relatedEvent.startDate.toLocaleTimeString()}
                </span>
                {relatedEvent.location && (
                  <>
                    <MapPin className="h-3 w-3 text-blue-600 ml-2" />
                    <span className="text-xs text-blue-700">{relatedEvent.location}</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Task Metadata */}
        {(task.metadata?.caseNumber || task.metadata?.clientName) && (
          <div className="text-xs text-gray-500 space-y-1">
            {task.metadata.caseNumber && (
              <div className="flex items-center">
                <Tag className="h-3 w-3 mr-1" />
                Case: {task.metadata.caseNumber}
              </div>
            )}
            {task.metadata.clientName && (
              <div className="flex items-center">
                <Users className="h-3 w-3 mr-1" />
                Client: {task.metadata.clientName}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Notion-Style Toolbar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Task Database</h2>
          <Button onClick={onTaskCreate} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>

        {/* View Controls */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              onClick={() => setViewMode('list')}
              className="h-8 px-3"
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'board' ? 'default' : 'ghost'}
              onClick={() => setViewMode('board')}
              className="h-8 px-3"
            >
              <Grid3X3 className="h-4 w-4 mr-1" />
              Board
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              onClick={() => setViewMode('calendar')}
              className="h-8 px-3"
            >
              <Calendar className="h-4 w-4 mr-1" />
              Calendar
            </Button>
          </div>

          <div className="h-6 w-px bg-gray-300" />

          {/* Sort Controls */}
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white"
          >
            <option value="priority">Sort by Priority</option>
            <option value="dueDate">Sort by Due Date</option>
            <option value="title">Sort by Title</option>
            <option value="status">Sort by Status</option>
            <option value="created">Sort by Created</option>
          </select>

          {/* Group Controls */}
          <select 
            value={groupBy} 
            onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white"
          >
            <option value="none">No Grouping</option>
            <option value="status">Group by Status</option>
            <option value="priority">Group by Priority</option>
            <option value="assignee">Group by Assignee</option>
            <option value="dueDate">Group by Due Date</option>
          </select>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Task Views */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
            <div key={groupName} className="space-y-3">
              {groupBy !== 'none' && (
                <div className="flex items-center space-x-2 mb-4">
                  <h3 className="font-medium text-gray-900 capitalize">{groupName}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {groupTasks.length}
                  </Badge>
                </div>
              )}
              
              <div className="grid gap-3">
                {groupTasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
            <Card key={groupName} className="bg-gray-50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">{groupName}</h3>
                  <Badge variant="secondary">{groupTasks.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupTasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {Object.keys(groupedTasks).length === 0 && (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-600 mb-4">Create your first task or adjust your filters</p>
          <Button onClick={onTaskCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>
      )}
    </div>
  );
}
