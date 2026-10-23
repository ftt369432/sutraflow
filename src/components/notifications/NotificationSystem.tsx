import React, { useState, useEffect, useCallback } from 'react';
import { X, Bell, Calendar, Clock, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

export interface Notification {
  id: string;
  type: 'reminder' | 'task' | 'calendar' | 'info' | 'warning' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actions?: NotificationAction[];
  data?: any;
  autoClose?: boolean;
  duration?: number;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

interface NotificationSystemProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onAction: (notificationId: string, actionIndex: number) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxVisible?: number;
}

export function NotificationSystem({
  notifications,
  onDismiss,
  onAction,
  position = 'top-right',
  maxVisible = 5
}: NotificationSystemProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Sort by priority and timestamp, show only maxVisible
    const sorted = [...notifications]
      .sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.timestamp.getTime() - a.timestamp.getTime();
      })
      .slice(0, maxVisible);
    
    setVisibleNotifications(sorted);
  }, [notifications, maxVisible]);

  useEffect(() => {
    // Auto-close notifications with autoClose enabled
    const timers = visibleNotifications
      .filter(n => n.autoClose)
      .map(notification => {
        const duration = notification.duration || 5000;
        return setTimeout(() => {
          onDismiss(notification.id);
        }, duration);
      });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [visibleNotifications, onDismiss]);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'reminder':
        return <Bell className="h-5 w-5" />;
      case 'calendar':
        return <Calendar className="h-5 w-5" />;
      case 'task':
        return <Clock className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getNotificationStyles = (notification: Notification) => {
    const baseStyles = "border-l-4 shadow-lg backdrop-blur-sm";
    
    switch (notification.type) {
      case 'reminder':
        return cn(baseStyles, "border-blue-500 bg-blue-50/90 dark:bg-blue-900/20");
      case 'calendar':
        return cn(baseStyles, "border-purple-500 bg-purple-50/90 dark:bg-purple-900/20");
      case 'task':
        return cn(baseStyles, "border-orange-500 bg-orange-50/90 dark:bg-orange-900/20");
      case 'warning':
        return cn(baseStyles, "border-yellow-500 bg-yellow-50/90 dark:bg-yellow-900/20");
      case 'success':
        return cn(baseStyles, "border-green-500 bg-green-50/90 dark:bg-green-900/20");
      default:
        return cn(baseStyles, "border-gray-500 bg-gray-50/90 dark:bg-gray-900/20");
    }
  };

  const getPriorityBadge = (priority: Notification['priority']) => {
    const styles = {
      urgent: "bg-red-600 text-white",
      high: "bg-orange-600 text-white",
      medium: "bg-blue-600 text-white",
      low: "bg-gray-600 text-white"
    };

    return (
      <Badge className={cn("text-xs", styles[priority])}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  if (visibleNotifications.length === 0) return null;

  return (
    <div className={cn("fixed z-50 space-y-2 max-w-md", getPositionStyles())}>
      {visibleNotifications.map((notification, index) => (
        <Card
          key={notification.id}
          className={cn(
            "transform transition-all duration-300 ease-in-out",
            "hover:scale-105 hover:shadow-xl",
            getNotificationStyles(notification),
            index > 0 && "opacity-90"
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className={cn(
                  "flex-shrink-0 p-2 rounded-full",
                  notification.type === 'warning' && "text-yellow-600",
                  notification.type === 'success' && "text-green-600",
                  notification.type === 'reminder' && "text-blue-600",
                  notification.type === 'calendar' && "text-purple-600",
                  notification.type === 'task' && "text-orange-600",
                  notification.type === 'info' && "text-gray-600"
                )}>
                  {getIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                      {notification.title}
                    </h4>
                    {getPriorityBadge(notification.priority)}
                  </div>
                  
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {notification.message}
                  </p>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {notification.timestamp.toLocaleTimeString()}
                  </div>
                  
                  {notification.actions && notification.actions.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {notification.actions.map((action, actionIndex) => (
                        <Button
                          key={actionIndex}
                          size="sm"
                          variant={action.variant === 'danger' ? 'destructive' : 
                                  action.variant === 'primary' ? 'default' : 'secondary'}
                          onClick={() => onAction(notification.id, actionIndex)}
                          className="text-xs py-1 px-2"
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismiss(notification.id)}
                className="flex-shrink-0 h-6 w-6 p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {notifications.length > maxVisible && (
        <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600">
          <CardContent className="p-2 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              +{notifications.length - maxVisible} more notifications
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Hook for managing notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    return newNotification.id;
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const handleAction = useCallback((notificationId: string, actionIndex: number) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && notification.actions && notification.actions[actionIndex]) {
      notification.actions[actionIndex].action();
      // Optionally dismiss notification after action
      dismissNotification(notificationId);
    }
  }, [notifications, dismissNotification]);

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAllNotifications,
    handleAction
  };
}
