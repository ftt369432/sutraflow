import React from 'react';
import { EnhancedCalendarView } from '../components/calendar/EnhancedCalendarView';

export function CalendarPage() {
  return (
    <div className="h-screen" style={{ background: 'linear-gradient(135deg, #0a0b1a 0%, #111228 60%, #0d0e20 100%)' }}>
      <EnhancedCalendarView className="h-full" />
    </div>
  );
}

export default CalendarPage;