import React, { useState } from 'react';
import { useCalendarStore } from '../../store/calendarStore';
import { useTaskStore } from '../../store/taskStore';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import { Calendar } from '../ui/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { Brain, Calendar as CalendarIcon, Clock, Loader2, Sparkles, X } from 'lucide-react';
import { Task } from '../../store/taskStore';

interface TimeBlockGeneratorProps {
  onClose: () => void;
}

export default function TimeBlockGenerator({ onClose }: TimeBlockGeneratorProps) {
  const { generateTimeBlocks } = useCalendarStore();
  const { tasks, getTasksForTimeBlock } = useTaskStore();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [preferences, setPreferences] = useState({
    startTime: '09:00',
    endTime: '17:00',
    breakDuration: 15,
    focusBlockDuration: 90
  });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  
  const availableTasks = getTasksForTimeBlock()
    .filter(task => 
      filter === '' || 
      task.title.toLowerCase().includes(filter.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(filter.toLowerCase()))
    )
    .sort((a, b) => {
      // First sort by priority
      if (a.priority !== b.priority) {
        return a.priority === 'high' ? -1 : b.priority === 'high' ? 1 : a.priority === 'medium' ? -1 : 1;
      }
      
      // Then by due date
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      
      return 0;
    });
  
  const handleTaskToggle = (taskId: string) => {
    if (selectedTasks.includes(taskId)) {
      setSelectedTasks(selectedTasks.filter(id => id !== taskId));
    } else {
      setSelectedTasks([...selectedTasks, taskId]);
    }
  };
  
  const handleSelectAll = () => {
    if (selectedTasks.length === availableTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(availableTasks.map(task => task.id));
    }
  };
  
  const handleGenerate = async () => {
    setLoading(true);
    
    try {
      // Generate time blocks
      await generateTimeBlocks({
        taskIds: selectedTasks,
        date: selectedDate,
        preferences
      });
      
      onClose();
    } catch (error) {
      console.error('Error generating time blocks:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };
  
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Time Block Generator
          </DialogTitle>
          <DialogDescription>
            Automatically create focused time blocks for your tasks
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label>Date for Time Blocks</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startTime">Day Start</Label>
              <Input
                id="startTime"
                type="time"
                value={preferences.startTime}
                onChange={(e) => setPreferences({ ...preferences, startTime: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="endTime">Day End</Label>
              <Input
                id="endTime"
                type="time"
                value={preferences.endTime}
                onChange={(e) => setPreferences({ ...preferences, endTime: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="focusBlockDuration">Focus Block Duration (min)</Label>
              <Input
                id="focusBlockDuration"
                type="number"
                min={15}
                max={180}
                step={15}
                value={preferences.focusBlockDuration}
                onChange={(e) => setPreferences({ ...preferences, focusBlockDuration: parseInt(e.target.value) })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="breakDuration">Break Duration (min)</Label>
              <Input
                id="breakDuration"
                type="number"
                min={5}
                max={60}
                step={5}
                value={preferences.breakDuration}
                onChange={(e) => setPreferences({ ...preferences, breakDuration: parseInt(e.target.value) })}
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <Label>Select Tasks to Schedule</Label>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedTasks.length === availableTasks.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Input 
                  placeholder="Filter tasks..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-[180px] h-8"
                />
              </div>
            </div>
            
            <div className="border rounded-md max-h-[200px] overflow-y-auto">
              {availableTasks.length > 0 ? (
                <div className="divide-y">
                  {availableTasks.map(task => (
                    <div 
                      key={task.id}
                      className={`flex items-center gap-3 p-3 hover:bg-muted cursor-pointer ${
                        selectedTasks.includes(task.id) ? 'bg-muted/50' : ''
                      }`}
                      onClick={() => handleTaskToggle(task.id)}
                    >
                      <Checkbox 
                        checked={selectedTasks.includes(task.id)}
                        onCheckedChange={() => handleTaskToggle(task.id)}
                        id={`task-${task.id}`}
                      />
                      <div className="flex-grow">
                        <div className="font-medium">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-full">
                            {task.description}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          {task.dueDate && (
                            <Badge variant="outline" className="text-xs">
                              Due: {format(new Date(task.dueDate), 'MMM d')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No tasks available for scheduling
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''} selected
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            
            <Button
              onClick={handleGenerate}
              disabled={loading || selectedTasks.length === 0}
              className="gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              {loading ? 'Generating...' : 'Generate Time Blocks'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 