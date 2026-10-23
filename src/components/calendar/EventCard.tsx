import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  CheckSquare, 
  Plus, 
  Clock,
  MapPin,
  Users,
  Bell,
  MoreHorizontal,
  ListTodo,
  Target
} from 'lucide-react';
import { format, isSameDay, startOfDay, endOfDay } from 'date-fns';
import { Button } from '../ui/Button';
import { CalendarEvent } from '../../services/calendar/calendarService';
import { Task } from '../../services/tasks/taskService';
import { toast } from 'sonner';

interface EventCardProps {
  event: CalendarEvent;
  onAddTask: (event: CalendarEvent) => void;
  tasks: Task[];
}

export const EventCard: React.FC<EventCardProps> = ({ event, onAddTask, tasks }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Find tasks related to this event
  const relatedTasks = tasks.filter(task => 
    task.relatedEventId === event.id || 
    (task.metadata?.caseNumber && event.description?.includes(task.metadata.caseNumber))
  );

  const completedTasks = relatedTasks.filter(task => task.status === 'completed');
  const pendingTasks = relatedTasks.filter(task => task.status !== 'completed');

  const handleAddTask = () => {
    onAddTask(event);
  };

  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  const getEventSource = () => {
    switch (event.source) {
      case 'google':
        return '🗓️ Google Calendar';
      case 'outlook':
        return '📅 Outlook';
      default:
        return '📝 Custom';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
      {/* Event Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: event.color }}
            />
            <h3 className="font-semibold text-gray-900 line-clamp-2">
              {event.title}
            </h3>
          </div>
          
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>
                {event.allDay 
                  ? 'All Day' 
                  : `${formatTime(event.start)} - ${formatTime(event.end)}`
                }
              </span>
            </div>
            
            {event.location && (
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span className="truncate max-w-32">{event.location}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">{getEventSource()}</span>
            <span className="text-xs text-gray-500">{event.calendarName}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Task Summary */}
          {relatedTasks.length > 0 && (
            <div className="flex items-center space-x-1 text-sm">
              <CheckSquare className="h-4 w-4 text-green-600" />
              <span className="text-green-600">{completedTasks.length}</span>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">{relatedTasks.length}</span>
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleAddTask}
          >
            <Plus className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t pt-3 space-y-3">
          {/* Event Details */}
          {event.description && (
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Description</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {/* Attendees */}
          {event.attendees && event.attendees.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-1 flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Attendees ({event.attendees.length})
              </h4>
              <div className="space-y-1">
                {event.attendees.slice(0, 3).map((attendee, index) => (
                  <div key={index} className="text-sm text-gray-700 flex items-center space-x-2">
                    <span>{attendee.name || attendee.email}</span>
                    {attendee.organizer && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        Organizer
                      </span>
                    )}
                  </div>
                ))}
                {event.attendees.length > 3 && (
                  <div className="text-sm text-gray-500">
                    +{event.attendees.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Related Tasks */}
          {relatedTasks.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <ListTodo className="h-4 w-4 mr-1" />
                Related Tasks
              </h4>
              <div className="space-y-2">
                {relatedTasks.slice(0, 3).map((task) => (
                  <div 
                    key={task.id} 
                    className="flex items-center space-x-2 text-sm"
                  >
                    <CheckSquare 
                      className={`h-4 w-4 ${
                        task.status === 'completed' 
                          ? 'text-green-600' 
                          : 'text-gray-400'
                      }`} 
                    />
                    <span className={`flex-1 ${
                      task.status === 'completed' 
                        ? 'line-through text-gray-500' 
                        : 'text-gray-700'
                    }`}>
                      {task.title}
                    </span>
                    {task.priority === 'high' && (
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                    )}
                  </div>
                ))}
                {relatedTasks.length > 3 && (
                  <div className="text-sm text-gray-500 ml-6">
                    +{relatedTasks.length - 3} more tasks
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add Task CTA */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-gray-600">
              {pendingTasks.length === 0 
                ? 'No pending tasks' 
                : `${pendingTasks.length} pending task${pendingTasks.length !== 1 ? 's' : ''}`
              }
            </span>
            <Button
              size="sm"
              onClick={handleAddTask}
              className="flex items-center space-x-1"
            >
              <Target className="h-4 w-4" />
              <span>Add Task</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
