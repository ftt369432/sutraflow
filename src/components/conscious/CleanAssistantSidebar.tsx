import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Brain, 
  MessageSquare, 
  Zap, 
  Settings,
  Minimize2,
  Maximize2,
  X,
  Pin,
  Bot,
  Mic,
  Send,
  User,
  HelpCircle,
  Navigation,
  Wrench,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Textarea } from '../ui/Textarea';
import { cn } from '../../lib/utils';
import { enhancedConsciousAssistantService } from '../../services/enhancedConsciousAssistantService';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CleanSidebarProps {
  className?: string;
}

export function CleanAssistantSidebar({ className }: CleanSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'navigation' | 'agents' | 'help'>('chat');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    setMessages([{
      id: 'welcome',
      type: 'assistant',
      content: "Hi! I'm your conscious assistant. I can help you navigate the system, build agents, or answer any questions. What would you like help with today?",
      timestamp: new Date()
    }]);
  }, []);

  // Listen for sidebar trigger from other parts of the app
  useEffect(() => {
    const handleOpenAssistant = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };

    window.addEventListener('openConsciousAssistant', handleOpenAssistant);
    return () => window.removeEventListener('openConsciousAssistant', handleOpenAssistant);
  }, []);

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      const response = await enhancedConsciousAssistantService.processUserRequest(
        currentMessage,
        { 
          currentTopic: activeTab,
          helpType: activeTab === 'help' ? 'general' : activeTab as any
        }
      );

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: response.responseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: "I'm having trouble connecting right now. Let me help you with some quick suggestions instead!",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = {
    navigation: [
      { label: "Navigate the system", action: () => setCurrentMessage("How do I navigate the system?") },
      { label: "Find features", action: () => setCurrentMessage("What features are available?") },
      { label: "Access manuals", action: () => setCurrentMessage("Where can I find documentation?") }
    ],
    agents: [
      { label: "Build agents", action: () => setCurrentMessage("How do I create a new agent?") },
      { label: "Manage agents", action: () => setCurrentMessage("How do I manage my existing agents?") },
      { label: "Agent training", action: () => setCurrentMessage("How do I train my agents?") }
    ],
    help: [
      { label: "General assistance", action: () => setCurrentMessage("I need general help with the platform") },
      { label: "Troubleshooting", action: () => setCurrentMessage("I'm having technical issues") },
      { label: "Feature requests", action: () => setCurrentMessage("I'd like to suggest a new feature") }
    ]
  };

  const location = useLocation();

  if (!isOpen) {
    if (
      location.pathname.startsWith('/workbench') ||
      location.pathname.startsWith('/ai-assistant') ||
      location.pathname.startsWith('/knowledge')
    ) {
      return null;
    }

    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50",
          "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700",
          "flex items-center justify-center transition-all duration-300",
          "hover:scale-110 hover:shadow-xl border-0",
          className
        )}
        title="Open Assistant"
      >
        <Bot className="h-6 w-6 text-white" />
        <div className="absolute inset-0 rounded-full bg-blue-400 opacity-20 animate-ping" />
      </Button>
    );
  }

  return (
    <Card className={cn(
      "fixed right-4 top-4 z-50 transition-all duration-300 shadow-xl",
      isMinimized ? "w-80 h-16" : "w-96 h-[600px]",
      "bg-white/95 backdrop-blur-lg border border-gray-200",
      className
    )}>
      <CardContent className="p-0 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            {!isMinimized && (
              <div>
                <div className="font-semibold text-sm text-gray-900">Conscious Assistant</div>
                <div className="text-xs text-gray-500">Ready to help</div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            {!isMinimized && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPinned(!isPinned)}
                className="w-8 h-8 p-0"
                title={isPinned ? "Unpin" : "Pin"}
              >
                <Pin className={cn("w-4 h-4", isPinned ? "text-blue-600" : "text-gray-400")} />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="w-8 h-8 p-0"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 p-0"
              title="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Tab Navigation */}
            <div className="flex border-b bg-gray-50">
              {[
                { id: 'chat', label: 'Chat', icon: MessageSquare },
                { id: 'navigation', label: 'Navigate', icon: Navigation },
                { id: 'agents', label: 'Agents', icon: Wrench },
                { id: 'help', label: 'Help', icon: HelpCircle }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex-1 flex items-center justify-center space-x-1 px-2 py-2 text-xs font-medium transition-colors",
                      activeTab === tab.id 
                        ? "bg-white text-blue-600 border-b-2 border-blue-600" 
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Actions */}
            {activeTab !== 'chat' && (
              <div className="p-3 border-b bg-blue-50">
                <div className="text-xs font-medium text-gray-700 mb-2">Quick Actions</div>
                <div className="space-y-1">
                  {quickActions[activeTab]?.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={action.action}
                      className="w-full text-left px-2 py-1 text-xs bg-white rounded border hover:bg-gray-50 transition-colors"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start space-x-2",
                    message.type === 'user' && "justify-end"
                  )}
                >
                  {message.type === 'assistant' && (
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3 h-3 text-blue-600" />
                    </div>
                  )}
                  
                  <div className={cn(
                    "max-w-[80%] p-2 rounded-lg text-sm",
                    message.type === 'user' 
                      ? "bg-blue-600 text-white" 
                      : "bg-white border shadow-sm"
                  )}>
                    {message.content}
                  </div>
                  
                  {message.type === 'user' && (
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-3 h-3 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <Bot className="w-3 h-3 text-blue-600" />
                  </div>
                  <div className="bg-white border rounded-lg p-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t bg-white">
              <div className="flex items-end space-x-2">
                <Textarea
                  ref={textareaRef}
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Ask about ${activeTab}...`}
                  className="flex-1 min-h-[40px] max-h-[100px] text-sm resize-none"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || isLoading}
                  size="sm"
                  className="w-10 h-10 p-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}