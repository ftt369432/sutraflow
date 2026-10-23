import React from 'react';
import { Bell, Plus, X, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useNotifications, Notification, NotificationType } from '../../contexts/NotificationContext';
import { format, parseISO } from 'date-fns';
import { cn } from '../../lib/utils';

export function NotificationWidget() {
  const { notifications, markAsRead, removeNotification } = useNotifications();
  
  // Get only the most recent 5 notifications
  const recentNotifications = notifications.slice(0, 5);
  
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
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
    <Card className="p-4 bg-white dark:bg-gray-800 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Bell className="h-5 w-5 mr-2 text-blue-500" />
          <h3 className="text-lg font-semibold">Notifications & Improvements</h3>
        </div>
        <Button variant="outline" size="sm" className="h-8">
          <Plus className="h-4 w-4 mr-2" />
          <span>Add Task</span>
        </Button>
      </div>
      
      <div className="space-y-3">
        {recentNotifications.length === 0 ? (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            No recent notifications
          </div>
        ) : (
          recentNotifications.map((notification) => (
            <div 
              key={notification.id}
              className={cn(
                "p-3 rounded-lg flex items-start group cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                !notification.read && "bg-blue-50 dark:bg-blue-900/20"
              )}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex-shrink-0 pt-0.5">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <p className={cn(
                    "text-sm font-medium",
                    !notification.read ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300"
                  )}>
                    {notification.title}
                  </p>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-400 dark:text-gray-500 mr-2">
                      {format(typeof notification.timestamp === 'string' ? parseISO(notification.timestamp) : notification.timestamp, 'MMM d')}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400" />
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {notification.message}
                </p>
                {notification.actionLabel && (
                  <div className="mt-1">
                    <span className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400">
                      {notification.actionLabel}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-4 text-center">
        <a 
          href="/notifications" 
          className="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View all notifications
        </a>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="font-medium mb-2">Quick Add</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="justify-start">
            <Plus className="h-3 w-3 mr-2" />
            New Task
          </Button>
          <Button variant="outline" size="sm" className="justify-start">
            <Plus className="h-3 w-3 mr-2" />
            New Email
          </Button>
          <Button variant="outline" size="sm" className="justify-start">
            <Plus className="h-3 w-3 mr-2" />
            New Event
          </Button>
          <Button variant="outline" size="sm" className="justify-start">
            <Plus className="h-3 w-3 mr-2" />
            New Note
          </Button>
        </div>
      </div>
    </Card>
  );
} 