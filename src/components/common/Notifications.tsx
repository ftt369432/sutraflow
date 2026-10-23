import React from 'react';
import { useGlobalStore } from '../../store';
import { X } from 'lucide-react';

export function Notifications() {
  const { notifications, removeNotification } = useGlobalStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg flex items-center justify-between ${
            notification.type === 'error' ? 'bg-red-500 text-white' : 
            notification.type === 'success' ? 'bg-green-500 text-white' : 
            'bg-blue-500 text-white'
          }`}
        >
          <p>{notification.message}</p>
          <button
            onClick={() => removeNotification(notification.id)}
            className="ml-4 hover:opacity-75"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
} 