/**
 * 🔔 Neural Assistant Notification System
 * 
 * Real-time notifications that make the header bell icon actually work!
 * Connects to your neural assistant for proactive intelligence
 */

import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Clock, AlertCircle, MessageCircle, Calendar, Mail, Zap } from 'lucide-react';
import { NeuralPersonalAssistant, AssistantNotification, PremiumTier } from '../../services/neural/NeuralPersonalAssistant';
import { supabase } from '../../lib/supabase';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function NotificationDropdown({ isOpen, onClose, userId }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<AssistantNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [neuralAssistant, setNeuralAssistant] = useState<NeuralPersonalAssistant | null>(null);

  useEffect(() => {
    if (userId) {
      const assistant = NeuralPersonalAssistant.getInstance(userId);
      setNeuralAssistant(assistant);
      loadNotifications(assistant);
    }
  }, [userId]);

  const loadNotifications = async (assistant: NeuralPersonalAssistant) => {
    try {
      setLoading(true);
      
      // Get notifications from neural assistant
      const neuralNotifications = assistant.getNotifications();
      
      // Get notifications from database
      const { data: dbNotifications, error } = await supabase
        .from('neural_notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading notifications:', error);
        setNotifications(neuralNotifications);
      } else {
        // Combine neural and db notifications
        const combinedNotifications = [
          ...neuralNotifications,
          ...dbNotifications.map(n => ({
            id: n.id,
            type: n.type as any,
            priority: n.priority as any,
            title: n.title,
            message: n.message,
            actionable: n.actionable,
            actions: n.actions || [],
            context: n.context || {},
            createdAt: new Date(n.created_at),
            expiresAt: n.expires_at ? new Date(n.expires_at) : undefined
          }))
        ];
        
        // Sort by priority and recency
        combinedNotifications.sort((a, b) => {
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
          const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
          
          if (aPriority !== bPriority) return bPriority - aPriority;
          return b.createdAt.getTime() - a.createdAt.getTime();
        });
        
        setNotifications(combinedNotifications);
      }
    } catch (error) {
      console.error('Error in loadNotifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Mark as read in database
      await supabase
        .from('neural_notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const executeAction = async (action: any, notificationId: string) => {
    if (!neuralAssistant) return;

    try {
      if (action.voice_command) {
        // Execute voice command
        await neuralAssistant.processVoiceCommand(action.voice_command);
      }
      
      // Mark notification as handled
      await markAsRead(notificationId);
      
      // Close dropdown
      onClose();
    } catch (error) {
      console.error('Error executing action:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'morning_briefing': return <Calendar className="w-4 h-4" />;
      case 'task_reminder': return <CheckCircle className="w-4 h-4" />;
      case 'calendar_alert': return <Clock className="w-4 h-4" />;
      case 'email_summary': return <Mail className="w-4 h-4" />;
      case 'pattern_suggestion': return <Zap className="w-4 h-4" />;
      case 'proactive_help': return <MessageCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Neural Assistant</h3>
          </div>
          <div className="flex items-center space-x-1">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {notifications.length} new
            </span>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center">
            <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No new notifications</p>
            <p className="text-xs text-gray-400 mt-1">Your neural assistant will notify you of important updates</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${getPriorityColor(notification.priority)}`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 p-2 rounded-full ${getPriorityColor(notification.priority)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {notification.title}
                      </h4>
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                        title="Mark as read"
                        aria-label="Mark notification as read"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <p className="mt-1 text-sm text-gray-600">
                      {notification.message}
                    </p>
                    
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {getTimeAgo(notification.createdAt)}
                      </span>
                      
                      {notification.actionable && notification.actions && notification.actions.length > 0 && (
                        <div className="flex space-x-2">
                          {notification.actions.slice(0, 2).map((action, index) => (
                            <button
                              key={index}
                              onClick={() => executeAction(action, notification.id)}
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <button
            onClick={async () => {
              // Mark all as read
              const notificationIds = notifications.map(n => n.id);
              await supabase
                .from('neural_notifications')
                .update({ read: true })
                .in('id', notificationIds);
              setNotifications([]);
            }}
            className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Mark all as read
          </button>
        </div>
      )}
    </div>
  );
}

// 🔔 Notification Bell Icon Component for Header
export function NotificationBell({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [neuralAssistant, setNeuralAssistant] = useState<NeuralPersonalAssistant | null>(null);

  useEffect(() => {
    if (userId) {
      const assistant = NeuralPersonalAssistant.getInstance(userId);
      setNeuralAssistant(assistant);
      
      // Load initial unread count
      loadUnreadCount();
      
      // Set up real-time updates
      const interval = setInterval(loadUnreadCount, 30000); // Check every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [userId]);

  const loadUnreadCount = async () => {
    try {
      if (!neuralAssistant) return;
      
      // Get unread count from neural assistant
      const neuralNotifications = neuralAssistant.getNotifications();
      
      // Get unread count from database
      const { count, error } = await supabase
        .from('neural_notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('read', false);
      
      if (error) {
        console.error('Error loading unread count:', error);
        setUnreadCount(neuralNotifications.length);
      } else {
        setUnreadCount((count || 0) + neuralNotifications.length);
      }
    } catch (error) {
      console.error('Error in loadUnreadCount:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.notification-dropdown')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative notification-dropdown">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationDropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        userId={userId}
      />
    </div>
  );
}