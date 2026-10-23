import React, { useState, useRef, useEffect } from 'react';
import { getStatusClass } from '../../styles/semanticColors';
import { Flag, Calendar, Clock, X, Check } from 'lucide-react';
import { addDays, addWeeks, addMonths, format } from 'date-fns';

export interface FollowUpFlag {
  id: string;
  emailId: string;
  type: 'today' | 'tomorrow' | 'this_week' | 'next_week' | 'this_month' | 'custom';
  dueDate: Date;
  completed: boolean;
  reminder?: boolean;
  note?: string;
}

interface EmailFollowUpFlagProps {
  emailId: string;
  currentFlag?: FollowUpFlag;
  onSetFlag: (flag: FollowUpFlag) => void;
  onRemoveFlag: (flagId: string) => void;
  onCompleteFlag: (flagId: string) => void;
}

export const EmailFollowUpFlag: React.FC<EmailFollowUpFlagProps> = ({
  emailId,
  currentFlag,
  onSetFlag,
  onRemoveFlag,
  onCompleteFlag
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customDate, setCustomDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [note, setNote] = useState('');

  const followUpOptions = [
    { 
      id: 'today', 
      label: 'Today', 
      date: new Date(),
      color: 'text-red-600'
    },
    { 
      id: 'tomorrow', 
      label: 'Tomorrow', 
      date: addDays(new Date(), 1),
      color: 'text-orange-600'
    },
    { 
      id: 'this_week', 
      label: 'This Week', 
      date: addDays(new Date(), 3),
      color: 'text-yellow-600'
    },
    { 
      id: 'next_week', 
      label: 'Next Week', 
      date: addWeeks(new Date(), 1),
      color: 'text-blue-600'
    },
    { 
      id: 'this_month', 
      label: 'This Month', 
      date: addWeeks(new Date(), 2),
      color: 'text-green-600'
    }
  ];

  const handleSetFlag = (type: FollowUpFlag['type'], dueDate: Date) => {
    const flag: FollowUpFlag = {
      id: `flag-${emailId}-${Date.now()}`,
      emailId,
      type,
      dueDate,
      completed: false,
      reminder: true,
      note: note || undefined
    };

    onSetFlag(flag);
    setIsOpen(false);
    setNote('');
  };

  const handleCustomFlag = () => {
    const dueDate = new Date(customDate);
    handleSetFlag('custom', dueDate);
  };

  if (currentFlag && !currentFlag.completed) {
    return (
      <div className="relative">
        <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${
          currentFlag.type === 'today'     ? 'badge-critical' :
          currentFlag.type === 'tomorrow'  ? 'badge-warning'  :
          currentFlag.type === 'this_week' ? 'badge-warning'  :
          currentFlag.type === 'next_week' ? 'badge-info'     :
          'badge-active'
        }`}>
          <Flag className="h-3 w-3" />
          <span>
            {currentFlag.type === 'custom' 
              ? format(currentFlag.dueDate, 'MMM d')
              : followUpOptions.find(opt => opt.id === currentFlag.type)?.label
            }
          </span>
          <button
            onClick={() => onCompleteFlag(currentFlag.id)}
            className="ml-1 hover:bg-white hover:bg-opacity-20 rounded-full p-0.5"
          >
            <Check className="h-3 w-3" />
          </button>
          <button
            onClick={() => onRemoveFlag(currentFlag.id)}
            className="ml-1 hover:bg-white hover:bg-opacity-20 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
        title="Add follow-up flag"
      >
        <Flag className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48">
          <div className="p-3">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Follow up</h4>
            
            {/* Quick Options */}
            <div className="space-y-1 mb-3">
              {followUpOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSetFlag(option.id as FollowUpFlag['type'], option.date)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-50 rounded"
                >
                  <span className={option.color}>{option.label}</span>
                  <span className="text-xs text-gray-500">
                    {format(option.date, 'MMM d')}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Date */}
            <div className="border-t pt-3">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Custom date & time
              </label>
              <input
                type="datetime-local"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <textarea
                placeholder="Add a note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full mt-2 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="flex items-center space-x-2 mt-2">
                <button
                  onClick={handleCustomFlag}
                  className="flex-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  Set Flag
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
