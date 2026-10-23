import React, { useState } from 'react';
import { useCalendarStore } from '../../store/calendarStore';
import { useTaskStore } from '../../store/taskStore';
import { useCalendarAutomation } from '../../hooks/useCalendarAutomation';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Separator } from '../ui/Separator';
import { RadioGroup, RadioGroupItem } from '../ui/RadioGroup';
import { Label } from '../ui/Label';
import { Switch } from '../ui/Switch';
import { Checkbox } from '../ui/Checkbox';
import { Slider } from '../ui/Slider';
import { Input } from '../ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Calendar } from '../ui/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { 
  Brain, 
  Calendar as CalendarIcon, 
  ChevronDown, 
  Clock, 
  Loader2, 
  Sparkles, 
  Zap 
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { cn } from '../../lib/utils';

interface SmartSchedulerProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule?: (schedule: any) => void;
}

export function SmartScheduler({ isOpen, onClose }: SmartSchedulerProps) {
  const { generateTimeBlocksForRange } = useCalendarAutomation();
  // const { tasks, getTasksForTimeBlock } = useTaskStore();
  // const { timeBlocks } = useCalendarStore();
  
  const [loading, setLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'daily' | 'weekly' | 'focus'>('daily');
  const [status, setStatus] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Smart scheduling preferences
  const [preferences, setPreferences] = useState({
    // General preferences
    startTime: '09:00',
    endTime: '17:00',
    breakDuration: 15,
    lunchBreak: true,
    lunchTime: '12:00',
    lunchDuration: 60,
    
    // Focus mode preferences
    focusBlockDuration: 90,
    prioritizeMornings: true,
    respectEnergyLevels: true,
    bufferBetweenMeetings: 15,
    
    // Learning preferences
    adaptToPatterns: true,
    respectPreviousCompletions: true,
    energyLevel: 70, // 0-100 scale for energy level today
    
    // Task selection
    includeLowPriority: false,
    includeMeetings: true,
    
    // Apply to
    applyToExistingTasks: true,
    applyToUpcomingDeadlines: true,
  });
  
  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const updateStatus = (message: string) => {
    setStatus(message);
    // Clear status after 3 seconds
    setTimeout(() => setStatus(null), 3000);
  };
  
  const getDateRange = () => {
    if (selectedMode === 'daily') {
      return {
        start: selectedDate,
        end: selectedDate
      };
    } else if (selectedMode === 'weekly') {
      return {
        start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
        end: endOfWeek(selectedDate, { weekStartsOn: 1 })
      };
    } else {
      // Focus mode - just today and tomorrow
      return {
        start: selectedDate,
        end: addDays(selectedDate, 1)
      };
    }
  };
  
  const getTaskSelectionCriteria = () => {
    const criteria: any = {};
    
    if (!preferences.includeLowPriority) {
      criteria.minPriority = 'medium';
    }
    
    return criteria;
  };
  
  const handleSchedule = async () => {
    setLoading(true);
    
    try {
      const dateRange = getDateRange();
      const taskCriteria = getTaskSelectionCriteria();
      
      const schedulingPreferences = {
        startTime: preferences.startTime,
        endTime: preferences.endTime,
        breakDuration: preferences.breakDuration,
        focusBlockDuration: preferences.focusBlockDuration,
        lunchBreak: preferences.lunchBreak,
        lunchTime: preferences.lunchTime,
        lunchDuration: preferences.lunchDuration,
        prioritizeMornings: preferences.prioritizeMornings,
        bufferBetweenMeetings: preferences.bufferBetweenMeetings,
        energyLevel: preferences.energyLevel,
      };
      
      const timeBlocks = await generateTimeBlocksForRange(
        dateRange.start,
        dateRange.end,
        schedulingPreferences
      );
      
      const count = timeBlocks.length;
      updateStatus(`Successfully created ${count} time blocks!`);
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error scheduling:', error);
      updateStatus('Error creating schedule');
    } finally {
      setLoading(false);
    }
  };
  
  const renderModeSpecificOptions = () => {
    switch (selectedMode) {
      case 'daily':
        return (
          <div className="space-y-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="date">Date to Schedule</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
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
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label htmlFor="energyLevel">Energy Level Today</Label>
                <span className="text-sm text-muted-foreground">{preferences.energyLevel}%</span>
              </div>
              <Slider
                id="energyLevel"
                min={0}
                max={100}
                step={5}
                value={[preferences.energyLevel]}
                onValueChange={([value]) => handlePreferenceChange('energyLevel', value)}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low Energy</span>
                <span>High Energy</span>
              </div>
            </div>
          </div>
        );
        
      case 'weekly':
        return (
          <div className="space-y-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="week">Week to Schedule</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate 
                      ? `Week of ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "MMM d")}`
                      : "Pick a week"}
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
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="respectPatterns" className="text-sm">
                  Honor regular meeting times
                </Label>
                <Switch
                  checked={preferences.respectPreviousCompletions}
                  onCheckedChange={(checked) => 
                    handlePreferenceChange('respectPreviousCompletions', checked)
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="adaptToPatterns" className="text-sm">
                  Learn from past performance patterns
                </Label>
                <Switch
                  checked={preferences.adaptToPatterns}
                  onCheckedChange={(checked) => 
                    handlePreferenceChange('adaptToPatterns', checked)
                  }
                />
              </div>
            </div>
          </div>
        );
        
      case 'focus':
        return (
          <div className="space-y-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="date">Starting Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
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
            
            <div className="grid gap-2">
              <Label htmlFor="focusBlockDuration">Focus Block Duration (min)</Label>
              <Select
                value={preferences.focusBlockDuration.toString()}
                onValueChange={(value) => 
                  handlePreferenceChange('focusBlockDuration', parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 minutes (Pomodoro)</SelectItem>
                  <SelectItem value="50">50 minutes</SelectItem>
                  <SelectItem value="90">90 minutes (Optimal)</SelectItem>
                  <SelectItem value="120">2 hours (Extended)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="prioritizeMornings" className="text-sm">
                Prioritize morning for high energy tasks
              </Label>
              <Switch
                checked={preferences.prioritizeMornings}
                onCheckedChange={(checked) => 
                  handlePreferenceChange('prioritizeMornings', checked)
                }
              />
            </div>
          </div>
        );
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Smart Scheduler
          </DialogTitle>
          <DialogDescription>
            Optimize your calendar with AI by analyzing your work patterns, tasks, and energy levels
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label>Scheduling Mode</Label>
            <RadioGroup
              value={selectedMode}
              onValueChange={(value) => setSelectedMode(value as any)}
              className="grid grid-cols-3 gap-4 pt-2"
            >
              <div>
                <RadioGroupItem
                  value="daily"
                  id="daily"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="daily"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-muted hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <CalendarIcon className="mb-3 h-6 w-6" />
                  <span className="text-sm font-medium">Daily Plan</span>
                </Label>
              </div>
              
              <div>
                <RadioGroupItem
                  value="weekly"
                  id="weekly"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="weekly"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-muted hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <Calendar className="mb-3 h-6 w-6" />
                  <span className="text-sm font-medium">Weekly Plan</span>
                </Label>
              </div>
              
              <div>
                <RadioGroupItem
                  value="focus"
                  id="focus"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="focus"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-muted hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <Zap className="mb-3 h-6 w-6" />
                  <span className="text-sm font-medium">Focus Mode</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <Separator />
          
          {/* Time Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Work Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={preferences.startTime}
                onChange={(e) => handlePreferenceChange('startTime', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endTime">Work End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={preferences.endTime}
                onChange={(e) => handlePreferenceChange('endTime', e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="lunchBreak"
              checked={preferences.lunchBreak}
              onCheckedChange={(checked) => 
                handlePreferenceChange('lunchBreak', checked === true)
              }
            />
            <label
              htmlFor="lunchBreak"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Schedule lunch break
            </label>
            
            {preferences.lunchBreak && (
              <div className="flex items-center ml-4 space-x-2">
                <Input
                  type="time"
                  value={preferences.lunchTime}
                  onChange={(e) => handlePreferenceChange('lunchTime', e.target.value)}
                  className="w-24 h-8"
                />
                <span className="text-sm">for</span>
                <Select
                  value={preferences.lunchDuration.toString()}
                  onValueChange={(value) => 
                    handlePreferenceChange('lunchDuration', parseInt(value))
                  }
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue placeholder="Duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30m</SelectItem>
                    <SelectItem value="45">45m</SelectItem>
                    <SelectItem value="60">1h</SelectItem>
                    <SelectItem value="90">1.5h</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Mode-specific options */}
          {renderModeSpecificOptions()}
          
          <Separator />
          
          {/* Smart Features */}
          <div>
            <h3 className="text-sm font-medium mb-3">Smart Features</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <Label htmlFor="buffer" className="text-sm">
                    Add buffer between meetings
                  </Label>
                </div>
                <Switch
                  checked={preferences.bufferBetweenMeetings > 0}
                  onCheckedChange={(checked) => 
                    handlePreferenceChange('bufferBetweenMeetings', checked ? 15 : 0)
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <Label htmlFor="respectEnergyLevels" className="text-sm">
                    Respect energy level patterns
                  </Label>
                </div>
                <Switch
                  checked={preferences.respectEnergyLevels}
                  onCheckedChange={(checked) => 
                    handlePreferenceChange('respectEnergyLevels', checked)
                  }
                />
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex items-center justify-between">
          {status && (
            <p className="text-sm text-green-500">{status}</p>
          )}
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSchedule} 
              disabled={loading}
              className="min-w-[140px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Optimize Schedule
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 