import React, { useState, useEffect } from 'react';
import { Bell, MessageCircle, Bot, X, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { AssistantChatInterface } from '../conscious/AssistantChatInterface';
import { StartupGreetingNotification } from '../conscious/StartupGreetingNotification';
import { startupGreetingService } from '../../services/startupGreetingService';

interface AssistantControlsProps {
  className?: string;
}

export function AssistantControls({ className }: AssistantControlsProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [showStartupGreeting, setShowStartupGreeting] = useState(false);

  // Initialize startup greeting
  useEffect(() => {
    const initializeStartup = async () => {
      try {
        const result = await startupGreetingService.initializeStartupGreeting();
        if (result.shouldShowGreeting) {
          setShowStartupGreeting(true);
        }
      } catch (error) {
        console.error('Error initializing startup greeting:', error);
      }
    };

    // Small delay to let the app fully load
    const timer = setTimeout(initializeStartup, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Listen for sidebar conscious assistant trigger
  useEffect(() => {
    const handleOpenAssistant = () => {
      setIsChatOpen(true);
      setIsChatMinimized(false);
    };

    window.addEventListener('openConsciousAssistant', handleOpenAssistant);
    return () => window.removeEventListener('openConsciousAssistant', handleOpenAssistant);
  }, []);

  // Simulate notification system (you can replace with real implementation)
  useEffect(() => {
    // Check for notifications on startup
    const checkNotifications = () => {
      // This would connect to your real notification system
      setNotificationCount(Math.floor(Math.random() * 5));
    };

    checkNotifications();
    
    // Simulate periodic notification checks
    const interval = setInterval(() => {
      if (Math.random() > 0.8) { // 20% chance of new notification
        setNotificationCount(prev => prev + 1);
        setHasNewMessage(true);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = () => {
    // For now, open the assistant chat when notification bell is clicked
    setIsChatOpen(true);
    setIsChatMinimized(false);
    setNotificationCount(0);
    setHasNewMessage(false);
  };

  const handleAssistantToggle = () => {
    setIsChatOpen(prev => !prev);
    setIsChatMinimized(false);
    setHasNewMessage(false);
  };

  const handleChatClose = () => {
    setIsChatOpen(false);
    setIsChatMinimized(false);
  };

  const handleChatToggleSize = () => {
    setIsChatMinimized(prev => !prev);
  };

  const handleStartupGreetingDismiss = () => {
    setShowStartupGreeting(false);
  };

  const handleStartupOpenAssistant = () => {
    setIsChatOpen(true);
    setIsChatMinimized(false);
    setShowStartupGreeting(false);
  };

  return (
    <>
      {/* Startup Greeting Notification */}
      {showStartupGreeting && (
        <StartupGreetingNotification
          onDismiss={handleStartupGreetingDismiss}
          onOpenAssistant={handleStartupOpenAssistant}
        />
      )}
      {/* Notification Bell & Assistant Controls - Sidebar Layout */}
      <div className={cn("flex items-center justify-center space-x-2", className)}>
        {/* Notification Bell */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNotificationClick}
            className={cn(
              "p-2 rounded-lg hover:bg-background/20 transition-all duration-200",
              (notificationCount > 0 || hasNewMessage) && "animate-pulse"
            )}
            title="Notifications & Assistant"
          >
            <Bell className="h-5 w-5 text-slate-600" />
          </Button>
          
          {/* Notification Badge */}
          {notificationCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs"
            >
              {notificationCount > 9 ? '9+' : notificationCount}
            </Badge>
          )}
          
          {/* New Message Indicator */}
          {hasNewMessage && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
          )}
        </div>

        {/* Dedicated Assistant Button */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleAssistantToggle}
            className={cn(
              "p-2 rounded-lg hover:bg-background/20 transition-all duration-200",
              isChatOpen && "bg-blue-100 text-blue-600"
            )}
            title="Open Conscious Assistant"
          >
            <Bot className="h-5 w-5 text-slate-600" />
          </Button>
          
          {/* Active Indicator */}
          {isChatOpen && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-400 rounded-full" />
          )}
        </div>
      </div>

      {/* Floating Assistant Button (Alternative Entry Point) */}
      {!isChatOpen && (
        <Button
          onClick={handleAssistantToggle}
          className={cn(
            "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-[60]",
            "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700",
            "flex items-center justify-center group transition-all duration-300",
            "hover:scale-110 hover:shadow-xl border-0"
          )}
          title="Open Conscious Assistant"
        >
          <Bot className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
          
          {/* Pulse animation */}
          <div className="absolute inset-0 rounded-full bg-blue-400 opacity-20 animate-ping" />
        </Button>
      )}

      {/* Assistant Chat Interface */}
      <AssistantChatInterface
        isOpen={isChatOpen}
        onClose={handleChatClose}
        onToggleSize={handleChatToggleSize}
        isMinimized={isChatMinimized}
      />
    </>
  );
}

// Hook for using notifications across the app
export function useAssistantNotifications() {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: Date;
  }>>([]);

  const addNotification = (notification: Omit<typeof notifications[0], 'id' | 'timestamp'>) => {
    const newNotification = {
      ...notification,
      id: `notification-${Date.now()}`,
      timestamp: new Date()
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Auto-remove after 5 seconds for non-error notifications
    if (notification.type !== 'error') {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, 5000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications
  };
}