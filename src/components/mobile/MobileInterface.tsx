/**
 * 📱 Mobile Optimized Interface
 * 
 * Touch-friendly AI assistant interface for mobile devices
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, Plus, Menu, ArrowLeft, MoreVertical, FileText, MessageSquare } from 'lucide-react';
import { Button } from '../ui/Button';
import { useMobileBridge } from '../../services/MobileBridgeService';
import { cn } from '../../lib/utils';

interface MobileInterfaceProps {
  onBack?: () => void;
  className?: string;
}

interface MobileMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  hasMore?: boolean;
}

export const MobileInterface: React.FC<MobileInterfaceProps> = ({
  onBack,
  className = ''
}) => {
  const { deviceStatus, isConnected, registerDevice, syncData } = useMobileBridge();
  
  const [messages, setMessages] = useState<MobileMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Register mobile device on mount
  useEffect(() => {
    const initMobile = async () => {
      try {
        const deviceId = localStorage.getItem('mobile-device-id') || `mobile-${Date.now()}`;
        localStorage.setItem('mobile-device-id', deviceId);
        
        await registerDevice(deviceId, 'mobile', {
          userAgent: navigator.userAgent,
          screen: `${screen.width}x${screen.height}`,
          timestamp: new Date().toISOString()
        });
        
        // Initial data sync
        const syncedData = await syncData(deviceId);
        setConversations(syncedData.conversations);
        
        console.log('📱 Mobile interface initialized');
      } catch (error) {
        console.error('📱 Mobile initialization error:', error);
      }
    };

    initMobile();
  }, [registerDevice, syncData]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle message send
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: MobileMessage = {
      id: `msg-${Date.now()}`,
      content: input.trim(),
      role: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Simulate AI response for now
      setTimeout(() => {
        const aiMessage: MobileMessage = {
          id: `msg-${Date.now()}-ai`,
          content: `I received your message: "${userMessage.content}". How can I help you further?`,
          role: 'assistant',
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      console.error('📱 Send message error:', error);
      setIsLoading(false);
    }
  };

  // Handle textarea auto-resize
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  // Handle enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn('mobile-interface h-screen flex flex-col bg-background', className)}>
      {/* Mobile Header */}
      <div className="flex-shrink-0 bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-primary-foreground hover:bg-primary-foreground/20 p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="font-semibold text-lg">AI Assistant</h1>
            <div className="flex items-center gap-2 text-xs opacity-80">
              <div className={cn(
                'w-2 h-2 rounded-full',
                isConnected ? 'bg-green-400' : 'bg-red-400'
              )} />
              {isConnected ? 'Connected' : 'Connecting...'}
              {deviceStatus.active > 1 && (
                <span>• {deviceStatus.active} devices</span>
              )}
            </div>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowMenu(!showMenu)}
          className="text-primary-foreground hover:bg-primary-foreground/20 p-2"
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground mt-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Welcome to GenieFlow Mobile</p>
            <p className="text-sm">Start a conversation with your AI assistant</p>
            
            {/* Quick Actions */}
            <div className="mt-6 space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start text-left"
                onClick={() => setInput("Create a document for me")}
              >
                <FileText className="h-4 w-4 mr-3" />
                Create Document
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left"
                onClick={() => setInput("Help me with a task")}
              >
                <Plus className="h-4 w-4 mr-3" />
                Start Task
              </Button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-3 text-sm',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-4'
                      : 'bg-muted text-foreground mr-4'
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.hasMore && (
                    <p className="text-xs opacity-70 mt-1">Tap to view full message</p>
                  )}
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground rounded-2xl px-4 py-3 mr-4">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Mobile Input Area */}
      <div className="flex-shrink-0 border-t bg-background/95 backdrop-blur p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={1}
              disabled={isLoading}
            />
            
            {/* Voice button in textarea */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 h-8 w-8 p-0 hover:bg-muted"
              disabled={isLoading}
            >
              <Mic className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="h-12 w-12 rounded-full p-0 flex-shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMenu && (
        <div className="absolute inset-0 bg-black/50 z-50 flex justify-end">
          <div className="bg-background w-80 h-full p-4 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMenu(false)}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-3" />
                New Conversation
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-3" />
                Recent Documents
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Menu className="h-4 w-4 mr-3" />
                Settings
              </Button>
            </div>
            
            {/* Device Status */}
            <div className="mt-8 p-3 bg-muted rounded-lg">
              <h3 className="text-sm font-medium mb-2">Device Status</h3>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Active Devices: {deviceStatus.active}</p>
                <p>Total Sessions: {deviceStatus.total}</p>
                <p>Sync Status: {isConnected ? 'Connected' : 'Offline'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileInterface;