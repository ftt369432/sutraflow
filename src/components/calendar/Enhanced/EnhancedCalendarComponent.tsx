import React, { useState, useEffect } from 'react';
import { Calendar, DatePicker } from 'antd';
import type { Dayjs } from 'dayjs';
import { CalendarEvent, IndustryConfig } from '../../../types/calendar.types';
import { useEnhancedCalendar } from '../../../hooks/calendar/useEnhancedCalendar';
import { CalendarEventModal } from './CalendarEventModal';
import { CalendarFilters } from './CalendarFilters';
import { CalendarStats } from './CalendarStats';
import { CalendarQuickActions } from './CalendarQuickActions';

interface EnhancedCalendarComponentProps {
  industryConfig: IndustryConfig;
  events: CalendarEvent[];
  onEventCreate?: (event: CalendarEvent) => void;
  onEventUpdate?: (event: CalendarEvent) => void;
  onEventDelete?: (eventId: string) => void;
  onDateSelect?: (date: Dayjs) => void;
  className?: string;
  allowManualEntry?: boolean;
  showStats?: boolean;
  showFilters?: boolean;
  showQuickActions?: boolean;
}

export const EnhancedCalendarComponent: React.FC<EnhancedCalendarComponentProps> = ({
  industryConfig,
  events,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  onDateSelect,
  className = '',
  allowManualEntry = true,
  showStats = true,
  showFilters = true,
  showQuickActions = true
}) => {
  const {
    selectedDate,
    filteredEvents,
    isModalOpen,
    selectedEvent,
    filters,
    handleDateSelect,
    handleEventClick,
    handleEventCreate,
    handleEventUpdate,
    handleEventDelete,
    handleFilterChange,
    closeModal,
    openCreateModal
  } = useEnhancedCalendar({
    events,
    industryConfig,
    onEventCreate,
    onEventUpdate,
    onEventDelete,
    onDateSelect
  });

  const [currentView, setCurrentView] = useState<'month' | 'week' | 'agenda'>('month');

  // Get events for a specific date to display on calendar
  const getEventsForDate = (date: Dayjs) => {
    return filteredEvents.filter(event => 
      event.date.format('YYYY-MM-DD') === date.format('YYYY-MM-DD')
    );
  };

  // Custom date cell renderer to show events
  const dateCellRender = (value: Dayjs) => {
    const dayEvents = getEventsForDate(value);
    
    if (dayEvents.length === 0) return null;

    return (
      <div className="calendar-events">
        {dayEvents.slice(0, 3).map(event => (
          <div
            key={event.id}
            className={`calendar-event ${event.eventType}-event ${event.priority || 'normal'}`}
            onClick={(e) => {
              e.stopPropagation();
              handleEventClick(event);
            }}
            title={event.title}
          >
            <span className="event-time">
              {event.time || 'All Day'}
            </span>
            <span className="event-title">
              {event.title}
            </span>
            {event.priority === 'urgent' && (
              <span className="priority-indicator">!</span>
            )}
          </div>
        ))}
        {dayEvents.length > 3 && (
          <div className="more-events">
            +{dayEvents.length - 3} more
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`enhanced-calendar-component ${className}`}>
      {/* Calendar Header */}
      <div className="calendar-header">
        <div className="calendar-title">
          <h2>{industryConfig.name} Calendar</h2>
          <div className="view-selector">
            <button
              className={currentView === 'month' ? 'active' : ''}
              onClick={() => setCurrentView('month')}
            >
              Month
            </button>
            <button
              className={currentView === 'week' ? 'active' : ''}
              onClick={() => setCurrentView('week')}
            >
              Week
            </button>
            <button
              className={currentView === 'agenda' ? 'active' : ''}
              onClick={() => setCurrentView('agenda')}
            >
              Agenda
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        {showQuickActions && allowManualEntry && (
          <CalendarQuickActions
            industryConfig={industryConfig}
            onQuickCreate={openCreateModal}
          />
        )}
      </div>

      {/* Calendar Stats */}
      {showStats && (
        <CalendarStats
          events={filteredEvents}
          industryConfig={industryConfig}
        />
      )}

      {/* Calendar Filters */}
      {showFilters && (
        <CalendarFilters
          filters={filters}
          industryConfig={industryConfig}
          onFilterChange={handleFilterChange}
        />
      )}

      {/* Main Calendar */}
      <div className="calendar-content">
        {currentView === 'month' && (
          <Calendar
            dateCellRender={dateCellRender}
            onSelect={handleDateSelect}
            value={selectedDate}
            className="enhanced-calendar"
          />
        )}

        {currentView === 'week' && (
          <div className="week-view">
            {/* Week view implementation */}
            <div className="week-header">
              <DatePicker
                picker="week"
                value={selectedDate}
                onChange={handleDateSelect}
              />
            </div>
            <div className="week-events">
              {/* Week events grid */}
              {filteredEvents
                .filter(event => 
                  event.date.week() === selectedDate.week() &&
                  event.date.year() === selectedDate.year()
                )
                .map(event => (
                  <div
                    key={event.id}
                    className={`week-event ${event.eventType}-event`}
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="event-day">
                      {event.date.format('ddd DD')}
                    </div>
                    <div className="event-details">
                      <div className="event-time">{event.time}</div>
                      <div className="event-title">{event.title}</div>
                      <div className="event-participants">
                        {event.participants?.slice(0, 2).join(', ')}
                        {event.participants && event.participants.length > 2 && ' +more'}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {currentView === 'agenda' && (
          <div className="agenda-view">
            <div className="agenda-header">
              <DatePicker
                value={selectedDate}
                onChange={handleDateSelect}
              />
            </div>
            <div className="agenda-events">
              {filteredEvents
                .sort((a, b) => a.date.valueOf() - b.date.valueOf())
                .map(event => (
                  <div
                    key={event.id}
                    className={`agenda-event ${event.eventType}-event`}
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="event-date">
                      {event.date.format('MMM DD, YYYY')}
                    </div>
                    <div className="event-time">
                      {event.time || 'All Day'}
                    </div>
                    <div className="event-content">
                      <div className="event-title">{event.title}</div>
                      <div className="event-description">{event.description}</div>
                      {event.participants && (
                        <div className="event-participants">
                          Participants: {event.participants.join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="event-actions">
                      {event.priority === 'urgent' && (
                        <span className="priority-badge">Urgent</span>
                      )}
                      {event.isRecurring && (
                        <span className="recurring-badge">Recurring</span>
                      )}
                    </div>
                  </div>
                ))}
              {filteredEvents.length === 0 && (
                <div className="no-events">
                  No events found for the selected criteria.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Event Modal */}
      <CalendarEventModal
        isOpen={isModalOpen}
        event={selectedEvent}
        industryConfig={industryConfig}
        onSave={selectedEvent?.id ? handleEventUpdate : handleEventCreate}
        onDelete={selectedEvent?.id ? handleEventDelete : undefined}
        onClose={closeModal}
      />
    </div>
  );
};

export default EnhancedCalendarComponent;
