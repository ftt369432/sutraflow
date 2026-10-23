import React, { useState } from 'react';
import { Bell, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface FollowUpReminderProps {
  onSetReminder: (date: Date) => void;
}

export function FollowUpReminder({ onSetReminder }: FollowUpReminderProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const quickDates = [
    { label: 'Tomorrow', days: 1 },
    { label: 'Next Week', days: 7 },
    { label: '2 Weeks', days: 14 },
    { label: 'Month', days: 30 },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setShowDatePicker(!showDatePicker)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2"
      >
        <Bell className="h-5 w-5" />
        <span>Follow Up</span>
      </button>

      {showDatePicker && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="space-y-2">
            {quickDates.map(({ label, days }) => (
              <button
                key={days}
                onClick={() => {
                  const date = new Date();
                  date.setDate(date.getDate() + days);
                  onSetReminder(date);
                  setShowDatePicker(false);
                }}
                className="w-full p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                {label}
              </button>
            ))}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <input
                type="datetime-local"
                value={format(selectedDate, "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent"
              />
              <button
                onClick={() => {
                  onSetReminder(selectedDate);
                  setShowDatePicker(false);
                }}
                className="mt-2 w-full p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Set Custom Reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 