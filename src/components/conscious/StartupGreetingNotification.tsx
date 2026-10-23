import React, { useState, useEffect } from 'react';
import { X, Bot, Bell, MessageCircle, Lightbulb } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { startupGreetingService } from '../../services/startupGreetingService';

interface StartupGreetingNotificationProps {
  onDismiss: () => void;
  onOpenAssistant: () => void;
}

export function StartupGreetingNotification({ 
  onDismiss, 
  onOpenAssistant 
}: StartupGreetingNotificationProps) {
  const [greetingData, setGreetingData] = useState<{
    greetingMessage?: string;
    aspirations?: any[];
    dailyGoals?: any[];
  } | null>(null);
  const [dailyTip, setDailyTip] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeGreeting = async () => {
      try {
        // Get startup greeting
        const greetingResult = await startupGreetingService.initializeStartupGreeting();
        
        if (greetingResult.shouldShowGreeting) {
          setGreetingData(greetingResult);
          
          // Check for daily tips
          const tipResult = await startupGreetingService.shouldShowDailyTips();
          if (tipResult.shouldShow) {
            setDailyTip(tipResult.tip || null);
          }
          
          setIsVisible(true);
          
          // Log the interaction
          await startupGreetingService.logStartupInteraction();
        }
      } catch (error) {
        console.error('Error initializing startup greeting:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeGreeting();
  }, []);

  const handleChatWithAssistant = () => {
    onOpenAssistant();
    handleDismiss();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Allow animation to complete
  };

  if (isLoading || !isVisible || !greetingData?.greetingMessage) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <Card className={cn(
        "w-full max-w-2xl bg-white/95 backdrop-blur-sm shadow-2xl transform transition-all duration-500 ease-out",
        isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
      )}>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Bot className="h-8 w-8 text-blue-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Conscious Assistant Activated
                </h2>
                <p className="text-sm text-gray-600">
                  Your intelligent companion is ready to help
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Main Greeting */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                {greetingData.greetingMessage}
              </div>
            </div>
          </div>

          {/* Daily Tip (if available) */}
          {dailyTip && (
            <div className="mb-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-amber-800 text-sm leading-relaxed">
                    {dailyTip.split('**').map((part, index) => 
                      index % 2 === 1 ? <strong key={index}>{part}</strong> : part
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats (if data available) */}
          {(greetingData.aspirations?.length || greetingData.dailyGoals?.length) && (
            <div className="mb-6 grid grid-cols-2 gap-4">
              {greetingData.aspirations?.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-green-700">
                    {greetingData.aspirations.length}
                  </div>
                  <div className="text-sm text-green-600">
                    Active Aspirations
                  </div>
                </div>
              )}
              
              {greetingData.dailyGoals?.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-blue-700">
                    {greetingData.dailyGoals.length}
                  </div>
                  <div className="text-sm text-blue-600">
                    Today's Goals
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleChatWithAssistant}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat with Assistant
            </Button>
            
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="flex-1"
            >
              Continue to App
            </Button>
          </div>

          {/* Access Instructions */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 text-center">
              <strong>Quick Access:</strong> Click the notification bell 🔔 or assistant button 🤖 anytime for help
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}