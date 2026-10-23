import React, { useState } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Tabs, TabsList, TabsTrigger } from '../ui/Tabs';
import { 
  Plus, 
  LayoutList, 
  KanbanSquare, 
  Filter, 
  SortDesc, 
  Calendar, 
  MoreHorizontal,
  CheckSquare, 
  Trash, 
  Edit,
  Tag,
  Clock,
  AlignLeft
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '../ui/DropdownMenu';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Checkbox } from '../ui/Checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { format } from 'date-fns';

export function TasksPage() {
  const { tasks, addTask, updateTask, deleteTask } = useTaskStore();
  const [viewMode, setViewMode] = useState<'list' | 'board'>('board');
  
  // 🔧 DEBUG: Log tasks to see if store is updating
  console.log('🔧 TasksPage: Current tasks in store:', tasks.length, tasks.map(t => ({ id: t.id, title: t.title })));
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'completed' | 'active'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'title'>('dueDate');
  
  // Get board-specific data
  const statuses = ['To Do', 'In Progress', 'Blocked', 'Done'];
  const priorities = ['Low', 'Medium', 'High', 'Urgent'];
  
  // Filter and sort tasks
  const filteredTasks = tasks
    .filter(task => {
      // Filter by completion status
      if (filter === 'completed') return task.completed;
      if (filter === 'active') return !task.completed;
      
      // Filter by search term
      if (searchTerm) {
        return task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
               (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by selected criteria
      if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      
      if (sortBy === 'priority') {
        const priorityOrder = { 'Urgent': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
        return priorityOrder[a.priority as keyof typeof priorityOrder] - 
               priorityOrder[b.priority as keyof typeof priorityOrder];
      }
      
      // Sort by title
      return a.title.localeCompare(b.title);
    });
  
  // Group tasks by status for board view
  const tasksByStatus = statuses.reduce((acc, status) => {
    acc[status] = filteredTasks.filter(task => task.status === status);
    return acc;
  }, {} as Record<string, typeof tasks>);
  
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    
    addTask({
      id: Date.now().toString(),
      title: newTaskTitle,
      status: 'To Do',
      priority: 'Medium',
      completed: false,
      createdAt: new Date().toISOString(),
    });
    
    setNewTaskTitle('');
    setIsAddingTask(false);
  };
  
  const handleToggleComplete = (taskId: string, completed: boolean) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      updateTask({ 
        ...task, 
        completed,
        status: completed ? 'Done' : task.status === 'Done' ? 'To Do' : task.status
      });
    }
  };
  
  const renderTaskInput = () => (
    <div className="mb-4 space-y-2">
      <Input
        value={newTaskTitle}
        onChange={(e) => setNewTaskTitle(e.target.value)}
        placeholder="Enter task title..."
        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
      />
      <div className="flex justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={() => setIsAddingTask(false)}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleAddTask}>
          Add Task
        </Button>
      </div>
    </div>
  );
  
  const renderListView = () => (
    <div className="space-y-2">
      {filteredTasks.map(task => (
        <div 
          key={task.id} 
          className={`p-3 border rounded-md flex items-start gap-2 transition-colors ${
            task.completed ? 'bg-muted/30 text-muted-foreground' : 'bg-card hover:bg-muted/10'
          }`}
        >
          <Checkbox 
            checked={task.completed} 
            onCheckedChange={(checked) => handleToggleComplete(task.id, checked === true)}
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </p>
              
              {/* Priority indicator */}
              <span 
                className={`text-xs px-2 py-0.5 rounded-full ${
                  task.priority === 'Urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                  task.priority === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                  task.priority === 'Medium' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                }`}
              >
                {task.priority}
              </span>
            </div>
            
            {task.description && (
              <p className="text-sm text-muted-foreground truncate">{task.description}</p>
            )}
            
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <AlignLeft className="h-3 w-3" />
                {task.status}
              </span>
              
              {task.dueDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(task.dueDate), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditingTaskId(task.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleComplete(task.id, !task.completed)}>
                <CheckSquare className="mr-2 h-4 w-4" />
                {task.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => deleteTask(task.id)}
                className="text-red-500 focus:text-red-500"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  );
  
  const renderBoardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statuses.map(status => (
        <div key={status} className="flex flex-col">
          <div className="pb-2 mb-3 border-b flex items-center justify-between">
            <h3 className="font-medium text-sm">{status}</h3>
            <span className="text-xs text-muted-foreground">
              {tasksByStatus[status]?.length || 0}
            </span>
          </div>
          
          <div className="space-y-2 flex-1">
            {tasksByStatus[status]?.map(task => (
              <div 
                key={task.id}
                className="p-3 border rounded-md bg-card hover:bg-accent/5 transition-colors shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{task.title}</p>
                    
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span 
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          task.priority === 'Urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                          task.priority === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                          task.priority === 'Medium' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        }`}
                      >
                        {task.priority}
                      </span>
                      
                      {task.dueDate && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(task.dueDate), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <Checkbox 
                    checked={task.completed} 
                    onCheckedChange={(checked) => handleToggleComplete(task.id, checked === true)}
                  />
                </div>
              </div>
            ))}
            
            {tasksByStatus[status]?.length === 0 && (
              <div className="h-20 border border-dashed rounded-md flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No tasks</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
  
  return (
    <div className="container mx-auto p-4 max-w-[1400px]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'board')}>
            <TabsList>
              <TabsTrigger value="list" className="flex items-center gap-1">
                <LayoutList className="h-4 w-4" />
                List
              </TabsTrigger>
              <TabsTrigger value="board" className="flex items-center gap-1">
                <KanbanSquare className="h-4 w-4" />
                Board
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button onClick={() => setIsAddingTask(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>
      
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search" className="sr-only">Search</Label>
          <Input
            id="search"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="flex gap-2">
          <div className="w-40">
            <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-40">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <SortDesc className="h-4 w-4" />
                  <span>Sort</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dueDate">Due Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {isAddingTask && renderTaskInput()}
      
      <Card>
        <CardContent className="p-4">
          {viewMode === 'list' ? renderListView() : renderBoardView()}
        </CardContent>
      </Card>
    </div>
  );
} 