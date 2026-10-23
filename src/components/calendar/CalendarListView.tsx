import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Trash2, 
  CheckSquare, 
  Square,
  Users,
  FileText,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { calendarService } from '../../services/calendar/calendarService';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees?: string[];
  status: 'confirmed' | 'tentative' | 'cancelled';
  source?: 'email' | 'manual' | 'wcab';
  caseNumber?: string;
  hearingType?: string;
  judge?: string;
}

interface CalendarListViewProps {
  className?: string;
}

export function CalendarListView({ className = '' }: CalendarListViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load calendar events
  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Get events from the last 30 days to future 90 days
      const now = new Date();
      const pastDate = new Date(now);
      pastDate.setDate(pastDate.getDate() - 30);
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + 90);

      const result = await calendarService.getEvents({
        fromDate: pastDate,
        toDate: futureDate
      });

      // Transform to our interface format
      const transformedEvents: CalendarEvent[] = result.map(event => ({
        id: event.id,
        title: event.title || event.summary || 'Untitled Event',
        description: event.description,
        startTime: event.startTime || event.start?.dateTime || event.start?.date || '',
        endTime: event.endTime || event.end?.dateTime || event.end?.date || '',
        location: event.location,
        attendees: event.attendees?.map(a => a.email || a.displayName || a) || [],
        status: event.status === 'confirmed' ? 'confirmed' : 
                event.status === 'tentative' ? 'tentative' : 'cancelled',
        source: event.description?.includes('WCAB') || event.description?.includes('hearing') ? 'wcab' : 
                event.description?.includes('Enhanced Calendar Agent') ? 'email' : 'manual',
        caseNumber: extractCaseNumber(event.description || ''),
        hearingType: extractHearingType(event.title || ''),
        judge: extractJudge(event.description || '')
      }));

      setEvents(transformedEvents.sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      ));
    } catch (err) {
      console.error('Failed to load calendar events:', err);
      setError('Failed to load calendar events');
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Helper functions to extract data from descriptions
  const extractCaseNumber = (description: string): string | undefined => {
    const match = description.match(/Case\s*(?:Number|#):\s*([A-Z]{3}\d+)/i);
    return match?.[1];
  };

  const extractHearingType = (title: string): string | undefined => {
    const types = ['MSC', 'Trial', 'Hearing', 'Deposition', 'Conference'];
    return types.find(type => title.toUpperCase().includes(type.toUpperCase()));
  };

  const extractJudge = (description: string): string | undefined => {
    const match = description.match(/Judge:\s*([^\\n]+)/i);
    return match?.[1]?.trim();
  };

  // Selection handlers
  const toggleEventSelection = (eventId: string) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedEvents.size === events.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(events.map(e => e.id)));
    }
  };

  // Delete handlers
  const deleteSelectedEvents = async () => {
    if (selectedEvents.size === 0) return;

    const confirmDelete = confirm(
      `Are you sure you want to delete ${selectedEvents.size} calendar event(s)? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setDeleting(true);
    try {
      const deletePromises = Array.from(selectedEvents).map(eventId =>
        calendarService.deleteEvent(eventId)
      );

      await Promise.all(deletePromises);
      
      // Remove deleted events from state
      setEvents(prev => prev.filter(event => !selectedEvents.has(event.id)));
      setSelectedEvents(new Set());
      
      toast.success(`Successfully deleted ${selectedEvents.size} calendar event(s)`);
    } catch (err) {
      console.error('Failed to delete events:', err);
      toast.error('Failed to delete some calendar events');
    } finally {
      setDeleting(false);
    }
  };

  // Format date/time display
  const formatDateTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return {
        date: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        }),
        time: date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })
      };
    } catch {
      return { date: 'Invalid Date', time: '' };
    }
  };

  const getEventTypeColor = (source?: string, hearingType?: string) => {
    if (source === 'wcab') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (source === 'email') return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Calendar Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading calendar events...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            Error Loading Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadEvents} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Calendar Events ({events.length})
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {selectedEvents.size > 0 && (
              <>
                <Badge variant="secondary">
                  {selectedEvents.size} selected
                </Badge>
                <Button
                  onClick={deleteSelectedEvents}
                  disabled={deleting}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {deleting ? 'Deleting...' : 'Delete Selected'}
                </Button>
              </>
            )}
            
            <Button
              onClick={toggleSelectAll}
              variant="outline"
              size="sm"
            >
              {selectedEvents.size === events.length ? (
                <CheckSquare className="h-4 w-4 mr-1" />
              ) : (
                <Square className="h-4 w-4 mr-1" />
              )}
              {selectedEvents.size === events.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No calendar events found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              const { date, time } = formatDateTime(event.startTime);
              const isSelected = selectedEvents.has(event.id);
              
              return (
                <div
                  key={event.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Checkbox */}
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleEventSelection(event.id)}
                      className="mt-1"
                    />
                    
                    {/* Event Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {event.title}
                          </h3>
                          
                          <div className="flex items-center mt-1 space-x-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {date}
                            </div>
                            {time && (
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {time}
                              </div>
                            )}
                            {event.location && (
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Event Details */}
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge 
                              variant="secondary" 
                              className={getEventTypeColor(event.source, event.hearingType)}
                            >
                              {event.source === 'wcab' ? 'WCAB' : 
                               event.source === 'email' ? 'Auto-Created' : 'Manual'}
                            </Badge>
                            
                            {event.hearingType && (
                              <Badge variant="outline">
                                {event.hearingType}
                              </Badge>
                            )}
                            
                            {event.caseNumber && (
                              <Badge variant="outline" className="font-mono text-xs">
                                {event.caseNumber}
                              </Badge>
                            )}
                            
                            {event.judge && (
                              <Badge variant="outline">
                                Judge {event.judge}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Description Preview */}
                          {event.description && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {event.description.length > 100 
                                  ? `${event.description.substring(0, 100)}...`
                                  : event.description
                                }
                              </p>
                            </div>
                          )}
                          
                          {/* Attendees */}
                          {event.attendees && event.attendees.length > 0 && (
                            <div className="mt-2 flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Users className="h-4 w-4 mr-1" />
                              <span>{event.attendees.length} attendee(s)</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Status */}
                        <div className="ml-2">
                          <Badge 
                            variant={event.status === 'confirmed' ? 'default' : 
                                   event.status === 'tentative' ? 'secondary' : 'destructive'}
                          >
                            {event.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 