import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, Info, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNotifications, Notification, NotificationType } from '../../contexts/NotificationContext';
import { Button } from './Button';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications();
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

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
    <div className="relative" ref={popoverRef}>
      <Button
        variant="ghost"
        size="icon"
        className="text-text-secondary hover:text-text-primary relative"
        onClick={toggleOpen}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 rounded-full bg-red-500 text-white text-xs px-1.5 min-w-[1.2rem] h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-2 px-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                No notifications
              </div>
            ) : (
              <ul className="py-1">
                {notifications.map((notification) => (
                  <li 
                    key={notification.id}
                    className={cn(
                      "px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group",
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
                            "text-sm font-medium",
                            !notification.read ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300"
                          )}>
                            {notification.title}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            className="ml-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {notification.message}
                        </p>
                        {notification.actionLabel && (
                          <div className="mt-2">
                            <span className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400">
                              {notification.actionLabel}
                            </span>
                          </div>
                        )}
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                          {format(notification.timestamp, 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="py-2 px-3 border-t border-gray-200 dark:border-gray-700">
            <a
              href="/notifications"
              className="block text-center text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View all notifications
            </a>
          </div>
        </div>
      )}
    </div>
  );
} 