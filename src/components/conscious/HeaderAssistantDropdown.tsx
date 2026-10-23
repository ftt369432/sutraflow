import React, { useState, useEffect, useRef } from 'react';
import { Bell, Bot, MessageCircle, X, Sparkles, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardContent } from '../ui/Card';
import { cn } from '../../lib/utils';
import { AssistantChatInterface } from './AssistantChatInterface';
import { StartupGreetingNotification } from './StartupGreetingNotification';
import { startupGreetingService } from '../../services/startupGreetingService';

interface HeaderAssistantDropdownProps {
  className?: string;
}

export function HeaderAssistantDropdown({ className }: HeaderAssistantDropdownProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [hasNewMessage, setHasNewMessage] = useState(true); // Start with true to show it's active
  const [showStartupGreeting, setShowStartupGreeting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    const timer = setTimeout(initializeStartup, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Simulate periodic notifications to show activity
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance of new activity
        setNotificationCount(prev => prev + 1);
        setHasNewMessage(true);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
    if (!isDropdownOpen) {
      setHasNewMessage(false);
      setNotificationCount(0);
    }
  };

  const handleOpenChat = () => {
    setIsChatOpen(true);
    setIsChatMinimized(false);
    setIsDropdownOpen(false);
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

      {/* Header Notification Bell with Dropdown */}
      <div className={cn("relative", className)} ref={dropdownRef}>
        {/* Notification Bell Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDropdownToggle}
          className={cn(
            "p-2 rounded-lg hover:bg-background/20 transition-all duration-200 relative",
            (hasNewMessage || notificationCount > 0) && "animate-pulse",
            isDropdownOpen && "bg-blue-50 text-blue-600"
          )}
          title="Conscious Assistant & Notifications"
        >
          <Bell className="h-5 w-5" />
          
          {/* Notification Badge */}
          {notificationCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs animate-bounce"
            >
              {notificationCount > 9 ? '9+' : notificationCount}
            </Badge>
          )}
          
          {/* Activity Pulse */}
          {hasNewMessage && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
          )}
        </Button>

        {/* Beautiful Dropdown in Main Viewport */}
        {isDropdownOpen && (
          <Card className="absolute top-full right-0 mt-2 w-80 z-[100] shadow-2xl border-2 bg-white/95 backdrop-blur-sm animate-in slide-in-from-top-2 duration-200">
            <CardContent className="p-0">
              {/* Header */}
              <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Bot className="h-6 w-6 text-blue-600" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Conscious Assistant</h3>
                      <p className="text-xs text-gray-600">Ready to help you navigate and build</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsDropdownOpen(false)}
                    className="h-6 w-6"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-4 space-y-3">
                <Button
                  onClick={handleOpenChat}
                  className="w-full justify-start bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat with Assistant
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleOpenChat();
                      // Pre-fill with navigation help
                      setTimeout(() => {
                        const event = new CustomEvent('preloadAssistantMessage', {
                          detail: { message: "How do I navigate the system?" }
                        });
                        window.dispatchEvent(event);
                      }, 500);
                    }}
                    className="text-xs"
                  >
                    🧭 Navigation Help
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleOpenChat();
                      setTimeout(() => {
                        const event = new CustomEvent('preloadAssistantMessage', {
                          detail: { message: "How do I build an AI agent?" }
                        });
                        window.dispatchEvent(event);
                      }, 500);
                    }}
                    className="text-xs"
                  >
                    🤖 Build Agent
                  </Button>
                </div>

                {/* Status Indicators */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>Assistant Active</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Sparkles className="h-3 w-3 text-purple-500" />
                      <span>Ready to Help</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Floating Assistant Button (Backup) */}
      {!isChatOpen && !isDropdownOpen && (
        <Button
          onClick={handleOpenChat}
          className={cn(
            "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-[90]",
            "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700",
            "flex items-center justify-center group transition-all duration-300",
            "hover:scale-110 hover:shadow-xl border-0"
          )}
          title="Open Conscious Assistant"
        >
          <Bot className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
          
          {/* Pulse animation */}
          <div className="absolute inset-0 rounded-full bg-blue-400 opacity-20 animate-ping" />
          
          {/* New message indicator on floating button */}
          {hasNewMessage && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
          )}
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