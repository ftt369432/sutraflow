import React from 'react';
import { format } from 'date-fns';
import { Circle } from 'lucide-react';
import type { Email } from '../../types';

interface EmailListItemProps {
  email: Email;
  selected: boolean;
  onSelect: (id: string) => void;
  onClick: (email: Email) => void;
}

export function EmailListItem({ email, selected, onSelect, onClick }: EmailListItemProps) {
  return (
    <div 
      className={`
        p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 
        cursor-pointer flex items-center gap-4 ${selected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
      `}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => {
          e.stopPropagation();
          onSelect(email.id);
        }}
        className="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
      />
      
      <div className="flex-1" onClick={() => onClick(email)}>
        <div className="flex items-center gap-2">
          {!email.read && (
            <Circle className="h-2 w-2 fill-current text-blue-600 dark:text-blue-400" />
          )}
          <span className={`font-medium ${email.read ? 'text-gray-600 dark:text-gray-400' : ''}`}>
            {email.from}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {format(new Date(email.date), 'MMM d, yyyy')}
          </span>
        </div>
        <h3 className={`text-lg ${email.read ? 'text-gray-600 dark:text-gray-400' : ''}`}>
          {email.subject}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
          {email.content}
        </p>
      </div>
    </div>
  );
}