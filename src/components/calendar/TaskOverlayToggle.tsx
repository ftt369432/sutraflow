import React from 'react';
import { useCalendarStore } from '../../store/calendarStore';
import { Switch } from '../ui/Switch';
import { Label } from '../ui/Label';
import { Calendar, Clock, Zap, CheckSquare2 } from 'lucide-react';

interface TaskOverlayToggleProps {
  className?: string;
}

export function TaskOverlayToggle({ className }: TaskOverlayToggleProps) {
  const { overlaySettings, updateOverlaySettings } = useCalendarStore();

  return (
    <div className={`space-y-3 rounded-md border p-4 ${className}`}>
      <div className="space-y-1">
        <h4 className="text-sm font-medium">Show Overlays</h4>
        <p className="text-xs text-muted-foreground">
          Choose what to display on your calendar
        </p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Switch 
            checked={overlaySettings?.showTasks} 
            onCheckedChange={(checked) => 
              updateOverlaySettings({ ...overlaySettings, showTasks: checked })
            }
          />
          <Label htmlFor="show-tasks" className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            Show Tasks
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch 
            checked={overlaySettings?.showTimeBlocks} 
            onCheckedChange={(checked) => 
              updateOverlaySettings({ ...overlaySettings, showTimeBlocks: checked })
            }
          />
          <Label htmlFor="show-timeblocks" className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-500" />
            Show Time Blocks
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch 
            checked={overlaySettings?.showAutomations} 
            onCheckedChange={(checked) => 
              updateOverlaySettings({ ...overlaySettings, showAutomations: checked })
            }
          />
          <Label htmlFor="show-automations" className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Show Automations
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch 
            checked={overlaySettings?.showCompleted} 
            onCheckedChange={(checked) => 
              updateOverlaySettings({ ...overlaySettings, showCompleted: checked })
            }
          />
          <Label htmlFor="show-completed" className="flex items-center gap-2">
            <CheckSquare2 className="h-4 w-4 text-green-500" />
            Show Completed
          </Label>
        </div>
      </div>
    </div>
  );
} 