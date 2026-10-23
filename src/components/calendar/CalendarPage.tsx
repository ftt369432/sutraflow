import React from 'react';
import { Calendar } from './Calendar';

// Main Calendar Page Component - Uses our consolidated Calendar component
export function CalendarPage() {
  return (
    <div className="h-full">
      <Calendar />
    </div>
  );
}

// Default export for lazy loading
export default CalendarPage;
