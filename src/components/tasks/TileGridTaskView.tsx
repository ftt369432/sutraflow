import React, { useState, useMemo } from 'react';
import { getPriorityDotClass } from '../../styles/semanticColors';
import { Calendar, Clock, User, Tag, Flag, Filter, Grid, List, Search, Plus, MoreHorizontal } from 'lucide-react';
import { TaskDefinition } from '../../services/calendar/EmailEventAnalyzer';
import { format } from 'date-fns';

interface KanbanTaskViewProps {
  tasks: TaskDefinition[];
  onTaskClick?: (task: TaskDefinition) => void;
  onCreateTask?: () => void;
  onUpdateTask?: (taskId: string, updates: Partial<TaskDefinition>) => void;
  onDeleteTask?: (taskId: string) => void;
}

type ViewMode = 'tiles' | 'list' | 'calendar';
type FilterType = 'all' | 'high' | 'medium' | 'low' | 'urgent';
type SortType = 'priority' | 'dueDate' | 'title' | 'category';

export const KanbanTaskView: React.FC<KanbanTaskViewProps> = ({
  tasks,
  onTaskClick,
  onCreateTask,
  onUpdateTask,
  onDeleteTask
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('tiles');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('priority');
  const [searchQuery, setSearchQuery] = useState('');

  const priorityColors = {
    low: 'bg-green-50 border-green-200 text-green-800',
    medium: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    high: 'bg-orange-50 border-orange-200 text-orange-800',
    urgent: 'bg-red-50 border-red-200 text-red-800'
  };

  const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      const matchesFilter = filter === 'all' || task.priority === filter;
      const matchesSearch = searchQuery === '' || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'title':
          return a.title.localeCompare(b.title);
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        case 'dueDate':
          // For now, we'll use offsetDays as a proxy for due date
          return (a.offsetDays || 0) - (b.offsetDays || 0);
        default:
          return 0;
      }
    });
  }, [tasks, filter, sortBy, searchQuery]);

  const TaskTile: React.FC<{ task: TaskDefinition }> = ({ task }) => (
    <div 
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${priorityColors[task.priority]}`}
      onClick={() => onTaskClick?.(task)}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 line-clamp-2">{task.title}</h3>
        <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white hover:bg-opacity-20 rounded">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
      
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-3">{task.description}</p>
      )}
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className={`px-2 py-1 rounded-full font-medium ${priorityColors[task.priority]}`}>
            {task.priority.toUpperCase()}
          </span>
          {task.estimatedDuration && (
            <span className="flex items-center space-x-1 text-gray-500">
              <Clock className="h-3 w-3" />
              <span>{task.estimatedDuration}m</span>
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          {task.assignee && (
            <span className="flex items-center space-x-1">
              <User className="h-3 w-3" />
              <span>{task.assignee}</span>
            </span>
          )}
          {task.category && (
            <span className="flex items-center space-x-1">
              <Tag className="h-3 w-3" />
              <span>{task.category}</span>
            </span>
          )}
        </div>
        
        {task.offsetDays !== undefined && task.offsetDays > 0 && (
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>Due in {task.offsetDays} days</span>
          </div>
        )}
      </div>
    </div>
  );

  const TaskListItem: React.FC<{ task: TaskDefinition }> = ({ task }) => (
    <div 
      className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-200"
      onClick={() => onTaskClick?.(task)}
    >
      <div className={`w-3 h-3 rounded-full ${getPriorityDotClass(task.priority)}`} />
      
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{task.title}</h3>
        {task.description && (
          <p className="text-sm text-gray-500 truncate">{task.description}</p>
        )}
      </div>
      
      <div className="flex items-center space-x-4 text-sm text-gray-500">
        {task.category && (
          <span className="flex items-center space-x-1">
            <Tag className="h-3 w-3" />
            <span>{task.category}</span>
          </span>
        )}
        {task.estimatedDuration && (
          <span className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{task.estimatedDuration}m</span>
          </span>
        )}
        {task.assignee && (
          <span className="flex items-center space-x-1">
            <User className="h-3 w-3" />
            <span>{task.assignee}</span>
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
            {filteredAndSortedTasks.length}
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="priority">Priority</option>
            <option value="title">Title</option>
            <option value="category">Category</option>
            <option value="dueDate">Due Date</option>
          </select>
          
          {/* View Mode */}
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('tiles')}
              className={`p-2 ${viewMode === 'tiles' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          
          {/* Create Task */}
          {onCreateTask && (
            <button
              onClick={onCreateTask}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Tasks Display */}
      {filteredAndSortedTasks.length === 0 ? (
        <div className="text-center py-12">
          <Flag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || filter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Create your first task to get started'
            }
          </p>
          {onCreateTask && (
            <button
              onClick={onCreateTask}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Create Task</span>
            </button>
          )}
        </div>
      ) : (
        <div className={
          viewMode === 'tiles' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
            : 'space-y-2'
        }>
          {filteredAndSortedTasks.map((task) => (
            <div key={task.id} className="group">
              {viewMode === 'tiles' ? (
                <TaskTile task={task} />
              ) : (
                <TaskListItem task={task} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
