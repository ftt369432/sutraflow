import React, { useState, useEffect } from 'react';
import { format, addDays, subDays, startOfMonth, endOfMonth, isSameMonth, isSameDay, isBefore, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { CalendarEvent, Calendar as CalendarType, calendarService } from '../../services/calendar/calendarService';
import googleAuthService from '../../services/auth/googleAuth';
import { cn } from '../../lib/utils';
import CalendarErrorBoundary from './CalendarErrorBoundary';
import { useCalendarRefresh } from '../../contexts/CalendarRefreshContext';
import { ViewSelector } from './ViewSelector';
// import { CalendarIntegrationStatus } from './CalendarIntegrationStatus';
import { EventCard } from './EventCard';
import { TaskManager } from './TaskManager';
import { TaskService } from '../../services/tasks/taskService';

interface CalendarProps {
  className?: string;
}

export function Calendar({ className }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<CalendarType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showTaskManager, setShowTaskManager] = useState(false);
  const [sidePanelOpen, setSidePanelOpen] = useState(true);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  
  // Add calendar refresh context
  const { refreshTrigger, triggerRefresh, isRefreshing } = useCalendarRefresh();
  
  // Task service instance
  const taskService = new TaskService();
  
  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);
  
  useEffect(() => {
    const fetchCalendarData = async () => {
      setIsLoading(true);
      try {
        // Initialize Google Auth with error handling (using isSignedIn check instead)
        try {
          if (!googleAuthService.isSignedIn()) {
            console.warn('⚠️ Google Auth not signed in, using offline mode');
          }
        } catch (authError) {
          console.warn('⚠️ Google Auth check failed, using offline mode:', authError);
        }

        // Fetch calendars with fallback
        let fetchedCalendars: CalendarType[] = [];
        try {
          fetchedCalendars = await calendarService.fetchCalendars();
        } catch (calendarError) {
          console.warn('⚠️ Failed to fetch calendars, using empty list:', calendarError);
        }
        setCalendars(fetchedCalendars);
        
        // Fetch events for the current month view with fallback
        let fetchedEvents: CalendarEvent[] = [];
        try {
          fetchedEvents = await calendarService.fetchEvents(startDate, endDate);
          console.log(`📅 Calendar fetched ${fetchedEvents.length} events for ${format(startDate, 'MMM yyyy')}`);
        } catch (eventsError) {
          console.warn('⚠️ Failed to fetch events, using empty list:', eventsError);
        }
        setEvents(fetchedEvents);
      } catch (error) {
        console.error('❌ Error fetching calendar data:', error);
        // Set empty arrays as fallback to prevent component crashes
        setCalendars([]);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCalendarData();
  }, [currentDate, refreshTrigger]); // Added refreshTrigger to dependencies

  const previousMonth = () => {
    setCurrentDate(prevDate => subDays(prevDate, 30));
  };

  const nextMonth = () => {
    setCurrentDate(prevDate => addDays(prevDate, 30));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleAddTaskToEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowTaskManager(true);
  };

  const handleTaskManagerClose = () => {
    setSelectedEvent(null);
    setShowTaskManager(false);
    // Trigger calendar refresh after task management
    triggerRefresh();
  };

  // Handle event drag and drop
  const handleEventDragStart = (event: CalendarEvent) => {
    setDraggedEvent(event);
  };

  const handleEventDragEnd = () => {
    setDraggedEvent(null);
  };

  const handleDayDrop = async (targetDate: Date) => {
    if (!draggedEvent) return;

    try {
      // Calculate the difference in days
      const originalDate = draggedEvent.start;
      const daysDiff = Math.round((targetDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Create new start and end dates
      const newStart = new Date(originalDate);
      newStart.setDate(originalDate.getDate() + daysDiff);
      
      const newEnd = new Date(draggedEvent.end);
      newEnd.setDate(draggedEvent.end.getDate() + daysDiff);

      // Update the event via calendar service
      const updates = {
        start: newStart,
        end: newEnd
      };

      await calendarService.updateEvent(draggedEvent.id, updates);
      
      // Refresh the calendar to show the updated event
      triggerRefresh();
      
      console.log(`📅 Event "${draggedEvent.title}" moved to ${format(newStart, 'MMM dd, yyyy')}`);
    } catch (error) {
      console.error('❌ Failed to move event:', error);
      // You could add a toast notification here
    }
    
    setDraggedEvent(null);
  };

  const handleDayDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Allow drop
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    // You could open a modal or side panel here
    console.log('Event clicked:', event.title);
  };

  // Generate dates for the current month view
  const daysInMonth = () => {
    const days = [];
    const firstDayOfMonth = startOfMonth(currentDate);
    const dayOfWeek = firstDayOfMonth.getDay();
    
    // Add days from previous month to fill the first week
    const prevMonthDays = dayOfWeek;
    const firstVisibleDate = subDays(firstDayOfMonth, prevMonthDays);
    
    // Generate 42 days (6 weeks) to ensure we have enough days for any month
    for (let i = 0; i < 42; i++) {
      const date = addDays(firstVisibleDate, i);
      days.push(date);
    }
    
    return days;
  };

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter(event => 
      isSameDay(date, event.start) || 
      (isBefore(event.start, date) && isSameDay(date, event.end)) ||
      (isBefore(event.start, date) && isBefore(date, event.end))
    );
  };
  
  // Render the day cell with its events
  const renderDay = (date: Date) => {
    const dayEvents = getEventsForDay(date);
    const isCurrentMonth = isSameMonth(date, currentDate);
    const isToday = isSameDay(date, new Date());
    
    return (
      <div 
        key={date.toString()} 
        className={cn(
          "border border-border h-32 p-1 overflow-hidden",
          !isCurrentMonth && "opacity-40 bg-muted/20",
          isToday && "bg-primary/5 border-primary/20",
          draggedEvent && "hover:bg-blue-50 transition-colors"
        )}
        onDragOver={handleDayDragOver}
        onDrop={() => handleDayDrop(date)}
      >
        <div className="flex justify-between items-start">
          <span 
            className={cn(
              "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
              isToday && "bg-primary text-primary-foreground"
            )}
          >
            {format(date, 'd')}
          </span>
        </div>
        <div className="mt-1 space-y-1 max-h-[calc(100%-2rem)] overflow-hidden">
          {dayEvents.slice(0, 3).map((event, index) => (
            <div 
              key={event.id + index}
              className="text-xs truncate rounded px-1 py-0.5 cursor-move hover:opacity-80"
              style={{ backgroundColor: event.color + '33' }} // Add transparency
              draggable={true}
              onDragStart={() => handleEventDragStart(event)}
              onDragEnd={handleEventDragEnd}
              title={`Drag to move: ${event.title}`}
            >
              {event.title}
            </div>
          ))}
          {dayEvents.length > 3 && (
            <div className="text-xs text-muted-foreground pl-1">
              +{dayEvents.length - 3} more
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <CalendarErrorBoundary>
      <div className={cn("bg-background flex flex-col h-full", className)}>
        {/* Calendar Header */}
        <div className="flex justify-between items-center p-4 border-b border-border">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <ViewSelector 
              currentView={viewMode} 
              onViewChange={setViewMode} 
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToToday}
              className="text-xs"
            >
              Today
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={triggerRefresh}
              disabled={isRefreshing}
              className="text-xs"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowTaskManager(!showTaskManager)}
              className="text-xs"
            >
              <Plus className="h-4 w-4 mr-1" />
              Tasks
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Integration Status Bar - Spread across full width */}
        {/* Temporarily disabled due to import issues */}
        {/*
        <div className="w-full border-b border-border">
          <CalendarIntegrationStatus />
        </div>
        */}

        {/* Debug Panel Toggle & Content - Spread across full width */}
        <div className="w-full border-b border-border">
        </div>
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full" />
          </div>
        ) : (
          <div className="flex-1 flex">
            {/* Calendar Grid */}
            <div className={cn("flex-1 p-4", sidePanelOpen && !showTaskManager ? "pr-2" : "")}>
              {showTaskManager ? (
                <TaskManager 
                  event={selectedEvent || undefined}
                  onClose={handleTaskManagerClose}
                />
              ) : (
                <>
                  {viewMode === 'month' && (
                    <>
                      {/* Calendar Days Headers */}
                      <div className="grid grid-cols-7 gap-px mb-px bg-border">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                          <div key={day} className="bg-background p-2 text-center text-sm font-medium text-muted-foreground">
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-px bg-border rounded-b-lg overflow-hidden flex-1">
                        {daysInMonth().map((date) => renderDay(date))}
                      </div>
                    </>
                  )}
                  
                  {viewMode === 'week' && (
                    <div className="text-center py-8">
                      <p className="text-lg font-medium">Week View</p>
                      <p className="text-sm text-muted-foreground">Coming soon...</p>
                    </div>
                  )}
                  
                  {viewMode === 'day' && (
                    <div className="text-center py-8">
                      <p className="text-lg font-medium">Day View</p>
                      <p className="text-sm text-muted-foreground">Coming soon...</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Collapsible Side Panel for Event Details */}
            {!showTaskManager && (
              <>
                {/* Side Panel Toggle Button */}
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidePanelOpen(!sidePanelOpen)}
                    className="p-1 h-auto border-l border-border"
                  >
                    {sidePanelOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Side Panel Content */}
                {sidePanelOpen && (
                  <div className="w-80 border-l border-border p-4 overflow-y-auto bg-muted/5">
                    <h3 className="font-semibold mb-4">Today's Events</h3>
                    <div className="space-y-3">
                      {events
                        .filter(event => isSameDay(event.start, new Date()))
                        .map(event => (
                          <EventCard
                            key={event.id}
                            event={event}
                            onAddTask={handleAddTaskToEvent}
                            tasks={[]} // Will be populated from TaskService
                          />
                        ))}
                      {events.filter(event => isSameDay(event.start, new Date())).length === 0 && (
                        <div className="text-sm text-gray-500 text-center py-8">
                          <p>No events today</p>
                          <p className="text-xs mt-2">Google Calendar events will appear here once authenticated</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Calendar List */}
                    {calendars.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium mb-2">My Calendars</h4>
                        <div className="space-y-1">
                          {calendars.map(calendar => (
                            <div key={calendar.id} className="flex items-center text-sm">
                              <div 
                                className="w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: calendar.color || '#4285f4' }}
                              />
                              <span className="truncate">{calendar.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </CalendarErrorBoundary>
  );
}
