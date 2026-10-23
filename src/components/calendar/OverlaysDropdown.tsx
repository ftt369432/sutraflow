import React from 'react';
import { useCalendarStore } from '../../store/calendarStore';
import { Switch } from '../ui/Switch';
import { Label } from '../ui/Label';
import { Button } from '../ui/Button';
import { Calendar, Clock, Zap, CheckSquare2, Layers } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';

interface OverlaysDropdownProps {
  className?: string;
}

export function OverlaysDropdown({ className }: OverlaysDropdownProps) {
  const { overlaySettings, updateOverlaySettings } = useCalendarStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Layers className="h-4 w-4 mr-2" />
          Overlays
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Show Overlays</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="space-y-1 p-1">
          <DropdownMenuItem className="p-0 focus:bg-transparent" onSelect={(e) => e.preventDefault()}>
            <div className="flex items-center justify-between px-2 py-1.5 w-full">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <Label>Show Tasks</Label>
              </div>
              <Switch 
                checked={overlaySettings?.showTasks} 
                onCheckedChange={(checked) => 
                  updateOverlaySettings({ ...overlaySettings, showTasks: checked })
                }
              />
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem className="p-0 focus:bg-transparent" onSelect={(e) => e.preventDefault()}>
            <div className="flex items-center justify-between px-2 py-1.5 w-full">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-500" />
                <Label>Show Time Blocks</Label>
              </div>
              <Switch 
                checked={overlaySettings?.showTimeBlocks} 
                onCheckedChange={(checked) => 
                  updateOverlaySettings({ ...overlaySettings, showTimeBlocks: checked })
                }
              />
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem className="p-0 focus:bg-transparent" onSelect={(e) => e.preventDefault()}>
            <div className="flex items-center justify-between px-2 py-1.5 w-full">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <Label>Show Automations</Label>
              </div>
              <Switch 
                checked={overlaySettings?.showAutomations} 
                onCheckedChange={(checked) => 
                  updateOverlaySettings({ ...overlaySettings, showAutomations: checked })
                }
              />
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem className="p-0 focus:bg-transparent" onSelect={(e) => e.preventDefault()}>
            <div className="flex items-center justify-between px-2 py-1.5 w-full">
              <div className="flex items-center gap-2">
                <CheckSquare2 className="h-4 w-4 text-green-500" />
                <Label>Show Completed</Label>
              </div>
              <Switch 
                checked={overlaySettings?.showCompleted} 
                onCheckedChange={(checked) => 
                  updateOverlaySettings({ ...overlaySettings, showCompleted: checked })
                }
              />
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 