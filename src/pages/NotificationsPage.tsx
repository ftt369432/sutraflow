import React from 'react';
import { Check, X, Info, AlertCircle, CheckCircle, AlertTriangle, Bell } from 'lucide-react';
import { useNotifications, Notification, NotificationType } from '../contexts/NotificationContext';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';

export function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications();

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Bell className="h-6 w-6 mr-3 text-blue-500" />
            <h1 className="text-2xl font-bold">Notifications</h1>
          </div>
          <div className="flex items-center space-x-2">
            {notifications.some(n => !n.read) && (
              <Button variant="outline" onClick={markAllAsRead} className="text-sm">
                <Check className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            )}
            <Button variant="outline" onClick={clearAll} className="text-sm">
              <X className="h-4 w-4 mr-2" />
              Clear all
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {notifications.length === 0 ? (
            <div className="p-10 text-center text-gray-500 dark:text-gray-400">
              <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>No notifications</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notification) => (
                <li 
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group",
                    !notification.read && "bg-blue-50 dark:bg-blue-900/20"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <p className={cn(
                          "text-base font-medium",
                          !notification.read ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300"
                        )}>
                          {notification.title}
                        </p>
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400 mr-3">
                            {format(notification.timestamp, 'MMM d, h:mm a')}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {notification.message}
                      </p>
                      {notification.actionLabel && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                            {notification.actionLabel}
                          </span>
                        </div>
                      )}
                      {!notification.read && (
                        <div className="mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Mark as read
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
} 