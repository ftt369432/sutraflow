import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  BookOpen,
  Settings,
  HelpCircle,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { cn } from '../../lib/utils';
import { enhancedConsciousAssistantService } from '../../services/enhancedConsciousAssistantService';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    mood?: number;
    topic?: string;
    helpType?: 'navigation' | 'feature' | 'agent-building' | 'general';
  };
}

interface AssistantChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleSize: () => void;
  isMinimized: boolean;
  className?: string;
}

export function AssistantChatInterface({ 
  isOpen, 
  onClose, 
  onToggleSize, 
  isMinimized,
  className 
}: AssistantChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<string>('general');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: `welcome-${Date.now()}`,
        type: 'assistant',
        content: `Hello! I'm your conscious assistant. I can help you:\n\n🧭 **Navigate the system** - Find features and understand how to use them\n🤖 **Build agents** - Guide you through creating and managing agents\n📚 **Access manuals** - Reference any part of our documentation\n💬 **General assistance** - Answer questions and provide support\n\nWhat would you like help with today?`,
        timestamp: new Date(),
        metadata: { topic: 'welcome' }
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  // Listen for preloaded messages from header dropdown
  useEffect(() => {
    const handlePreloadMessage = (event: CustomEvent) => {
      if (event.detail?.message && isOpen) {
        setInputValue(event.detail.message);
        // Optional: Auto-send the message
        setTimeout(() => {
          const messageToSend = event.detail.message;
          setInputValue('');
          handleSendMessageWithContent(messageToSend);
        }, 100);
      }
    };

    window.addEventListener('preloadAssistantMessage', handlePreloadMessage as EventListener);
    return () => {
      window.removeEventListener('preloadAssistantMessage', handlePreloadMessage as EventListener);
    };
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Determine help type based on user input
      const helpType = detectHelpType(userMessage.content);
      
      // Get assistant response using our enhanced conscious assistant service
      const response = await enhancedConsciousAssistantService.processUserRequest(
        userMessage.content,
        {
          previousInteraction: messages[messages.length - 1],
          currentTopic,
          helpType
        }
      );

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: response.responseText,
        timestamp: new Date(),
        metadata: {
          topic: response.detectedTopic,
          helpType
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
      setCurrentTopic(response.detectedTopic || 'general');

      // Text-to-speech if enabled
      if (soundEnabled && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(response.responseText);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        speechSynthesis.speak(utterance);
      }

    } catch (error) {
      console.error('Error getting assistant response:', error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: "I apologize, but I'm having trouble processing your request right now. Could you please try again or rephrase your question?",
        timestamp: new Date(),
        metadata: { topic: 'error' }
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Separate function to handle sending with specific content (for preloaded messages)
  const handleSendMessageWithContent = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Determine help type based on user input
      const helpType = detectHelpType(userMessage.content);
      
      // Get assistant response using our enhanced conscious assistant service
      const response = await enhancedConsciousAssistantService.processUserRequest(
        userMessage.content,
        {
          previousInteraction: messages[messages.length - 1],
          currentTopic,
          helpType
        }
      );

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: response.responseText,
        timestamp: new Date(),
        metadata: {
          topic: response.detectedTopic,
          helpType
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
      setCurrentTopic(response.detectedTopic || 'general');

      // Text-to-speech if enabled
      if (soundEnabled && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(response.responseText);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        speechSynthesis.speak(utterance);
      }

    } catch (error) {
      console.error('Error getting assistant response:', error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: "I apologize, but I'm having trouble processing your request right now. Could you please try again or rephrase your question?",
        timestamp: new Date(),
        metadata: { topic: 'error' }
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const detectHelpType = (input: string): 'navigation' | 'feature' | 'agent-building' | 'general' => {
    const lower = input.toLowerCase();
    
    if (lower.includes('agent') || lower.includes('build') || lower.includes('create') || lower.includes('workflow')) {
      return 'agent-building';
    }
    
    if (lower.includes('navigate') || lower.includes('find') || lower.includes('where') || lower.includes('how to use')) {
      return 'navigation';
    }
    
    if (lower.includes('feature') || lower.includes('function') || lower.includes('capability') || lower.includes('what does')) {
      return 'feature';
    }
    
    return 'general';
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <Card className={cn(
      "fixed bottom-4 right-4 flex flex-col bg-white/95 backdrop-blur-sm border shadow-xl",
      isMinimized ? "w-80 h-16" : "w-96 h-[600px]",
      "transition-all duration-300 ease-in-out z-[70]",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Bot className="h-5 w-5 text-blue-600" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>
          <span className="font-medium text-sm">Conscious Assistant</span>
        </div>
        
        <div className="flex items-center space-x-1">
          {/* Voice Controls */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="h-7 w-7"
            title={soundEnabled ? "Disable voice responses" : "Enable voice responses"}
          >
            {soundEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
          </Button>
          
          {/* Minimize/Maximize */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSize}
            className="h-7 w-7"
            title={isMinimized ? "Expand chat" : "Minimize chat"}
          >
            {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
          </Button>
          
          {/* Close */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7"
            title="Close assistant"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start space-x-2",
                  message.type === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {message.type === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                )}
                
                <div
                  className={cn(
                    "max-w-[75%] rounded-lg p-3 text-sm",
                    message.type === 'user'
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  )}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className={cn(
                    "text-xs mt-1 opacity-70",
                    message.type === 'user' ? "text-blue-100" : "text-gray-500"
                  )}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                
                {message.type === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-2 border-t bg-gray-50">
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInputValue("How do I navigate to different features?")}
                className="text-xs h-7"
              >
                <BookOpen className="h-3 w-3 mr-1" />
                Navigation
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInputValue("How do I build an agent?")}
                className="text-xs h-7"
              >
                <Settings className="h-3 w-3 mr-1" />
                Build Agent
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInputValue("Show me the manual")}
                className="text-xs h-7"
              >
                <HelpCircle className="h-3 w-3 mr-1" />
                Help
              </Button>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t">
            <div className="flex items-end space-x-2">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about the system..."
                  className="resize-none min-h-[60px] max-h-[120px] pr-10"
                  disabled={isLoading}
                />
                
                {/* Voice Input Button */}
                {recognitionRef.current && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "absolute bottom-2 right-2 h-6 w-6",
                      isListening && "bg-red-100 text-red-600"
                    )}
                    onClick={isListening ? stopListening : startListening}
                    disabled={isLoading}
                    title={isListening ? "Stop listening" : "Voice input"}
                  >
                    {isListening ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                  </Button>
                )}
              </div>
              
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="h-[60px]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

// Extended speech recognition types
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}