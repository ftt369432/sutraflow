import React from 'react';
import { useCalendarStore } from '../../store/calendarStore';
import { Badge } from '../ui/Badge';
import { Switch } from '../ui/Switch';
import { Button } from '../ui/Button';
import { 
  CalendarDays, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  PlusCircle, 
  Settings,
  Trash2, 
  Zap, 
  BookOpen
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../ui/DropdownMenu';

export default function CalendarSourcesPanel() {
  const { sources, toggleSourceVisibility, updateSource, deleteSource, addSource } = useCalendarStore();

  // Group sources by type
  const groupedSources = {
    main: sources.filter(source => source.type === 'primary' || source.type === 'secondary'),
    overlays: sources.filter(source => ['tasks', 'automation', 'timeblock'].includes(source.type)),
    external: sources.filter(source => source.type === 'external')
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'primary':
      case 'secondary':
        return <CalendarDays className="h-4 w-4" />;
      case 'tasks':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'automation':
        return <Zap className="h-4 w-4" />;
      case 'timeblock':
        return <Clock className="h-4 w-4" />;
      case 'external':
        return <ExternalLink className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const handleAddExternalCalendar = () => {
    const name = prompt('Enter calendar name');
    if (!name) return;

    const color = `#${Math.floor(Math.random()*16777215).toString(16)}`;

    addSource({
      name,
      color,
      visible: true,
      type: 'external',
      description: 'External calendar'
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-2">My Calendars</h3>
        <div className="space-y-2">
          {groupedSources.main.map(source => (
            <div 
              key={source.id}
              className="flex items-center justify-between rounded-md p-2 hover:bg-muted"
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                <div className="flex items-center gap-1">
                  {getSourceIcon(source.type)}
                  <span className="text-sm">{source.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Switch 
                  checked={source.visible}
                  onCheckedChange={() => toggleSourceVisibility(source.id)}
                  size="sm"
                />
                
                {source.type !== 'primary' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        const newColor = prompt('Enter new color (hex)', source.color);
                        if (newColor) {
                          updateSource(source.id, { color: newColor });
                        }
                      }}>
                        Change Color
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        const newName = prompt('Enter new name', source.name);
                        if (newName) {
                          updateSource(source.id, { name: newName });
                        }
                      }}>
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          if (confirm(`Remove "${source.name}" calendar?`)) {
                            deleteSource(source.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="font-medium mb-2">Overlays</h3>
        <div className="space-y-2">
          {groupedSources.overlays.map(source => (
            <div 
              key={source.id}
              className="flex items-center justify-between rounded-md p-2 hover:bg-muted"
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                <div className="flex items-center gap-1">
                  {getSourceIcon(source.type)}
                  <span className="text-sm">{source.name}</span>
                </div>
              </div>
              <Switch 
                checked={source.visible}
                onCheckedChange={() => toggleSourceVisibility(source.id)}
                size="sm"
              />
            </div>
          ))}
        </div>
      </div>
      
      {groupedSources.external.length > 0 && (
        <div>
          <h3 className="font-medium mb-2">External Calendars</h3>
          <div className="space-y-2">
            {groupedSources.external.map(source => (
              <div 
                key={source.id}
                className="flex items-center justify-between rounded-md p-2 hover:bg-muted"
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                  <div className="flex items-center gap-1">
                    {getSourceIcon(source.type)}
                    <span className="text-sm">{source.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Switch 
                    checked={source.visible}
                    onCheckedChange={() => toggleSourceVisibility(source.id)}
                    size="sm"
                  />
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        const newColor = prompt('Enter new color (hex)', source.color);
                        if (newColor) {
                          updateSource(source.id, { color: newColor });
                        }
                      }}>
                        Change Color
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        const newName = prompt('Enter new name', source.name);
                        if (newName) {
                          updateSource(source.id, { name: newName });
                        }
                      }}>
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          if (confirm(`Remove "${source.name}" calendar?`)) {
                            deleteSource(source.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full mt-4"
        onClick={handleAddExternalCalendar}
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        Add Calendar
      </Button>
    </div>
  );
} 