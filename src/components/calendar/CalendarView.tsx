import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useCalendarStore } from '../../store/calendarStore';
import { useTaskStore } from '../../store/taskStore';
import { MonthView } from './MonthView';
import { MonthNavigator } from './MonthNavigator';
import { Button } from '../ui/Button';
import { TaskConversionModal } from './TaskConversionModal';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarEvent } from '../../types/calendar';
import { calendarService } from '../services/CalendarService';

export function CalendarView() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showTaskConversion, setShowTaskConversion] = useState(false);
  const { addEvent, updateEvent, deleteEvent } = useCalendarStore();
  const { tasks } = useTaskStore();
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    async function loadEvents() {
      const now = new Date();
      const events = await calendarService.fetchEvents(now, new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()));
      setEvents(events);
    }
    loadEvents();
  }, []);

  const handleEventClick = (event: CalendarEvent) => {
    // Handle event click
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <MonthNavigator 
          selectedDate={selectedDate} 
          onChange={setSelectedDate} 
        />
        <Button 
          onClick={() => setShowTaskConversion(true)}
          variant="outline"
        >
          Convert Tasks to Events
        </Button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={format(selectedDate, 'MM-yyyy')}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <MonthView 
            currentDate={selectedDate}
            events={events}
            selectedDate={selectedDate}
            onEventClick={handleEventClick}
            onDayClick={handleDayClick}
          />
        </motion.div>
      </AnimatePresence>

      <TaskConversionModal
        isOpen={showTaskConversion}
        onClose={() => setShowTaskConversion(false)}
        tasks={tasks}
        onConvert={(taskId, date) => {
          // Handle task conversion
        }}
      />
    </motion.div>
  );
}