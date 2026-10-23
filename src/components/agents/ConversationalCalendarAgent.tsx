import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Mic, MicOff, Send, Calendar, Bot, Sparkles, Clock, Users, MapPin } from 'lucide-react';
import { CalendarAgent } from '../../services/agents/CalendarAgent';
import { toast } from 'sonner';

interface ConversationMessage {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  data?: any;
}

interface ConversationalCalendarAgentProps {
  onEventCreated?: (event: any) => void;
  onWorkflowBuilt?: (workflow: any) => void;
  emailContext?: any[];
}

/**
 * 🤖 Conversational Calendar Agent Interface
 * 
 * Universal conversational interface following the "Just Talk to Build" philosophy.
 * Users can interact naturally to build calendar workflows, schedule events, and automate processes.
 */
export function ConversationalCalendarAgent({ 
  onEventCreated, 
  onWorkflowBuilt, 
  emailContext = [] 
}: ConversationalCalendarAgentProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([
    {
      id: '1',
      type: 'agent',
      content: '👋 Hi! I\'m your Universal Calendar Agent. I can help you with scheduling, email analysis, workflow building, and more. Just tell me what you need!',
      timestamp: new Date(),
      data: {
        suggestions: [
          'Schedule a client meeting for tomorrow at 2 PM',
          'Process my emails and create calendar events',
          'Show me calendar conflicts for this week',
          'Build me a workflow for court date management'
        ]
      }
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [agent] = useState(() => new CalendarAgent());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleSendMessage(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Speech recognition failed. Please try typing instead.');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    // Add user message
    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    try {
      // Process with the Universal Calendar Agent
      const response = await agent.processConversationalInput(messageText, {
        emails: emailContext,
        currentTime: new Date(),
        context: 'chat_interface'
      });

      // Add agent response
      const agentMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: response.message || 'I processed your request.',
        timestamp: new Date(),
        data: response
      };

      setMessages(prev => [...prev, agentMessage]);

      // Handle specific actions
      if (response.action === 'schedule_event' && response.success && onEventCreated) {
        onEventCreated(response.details);
      } else if (response.action === 'build_workflow' && response.success && onWorkflowBuilt) {
        onWorkflowBuilt(response.workflow);
      }

      // Show success toast for completed actions
      if (response.success && response.action) {
        const actionEmojis = {
          schedule_event: '📅',
          analyze_emails: '📧',
          build_workflow: '🏗️',
          create_automation: '🤖'
        };
        const emoji = actionEmojis[response.action as keyof typeof actionEmojis] || '✅';
        toast.success(`${emoji} ${response.message}`);
      }

    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: ConversationMessage = {
        id: (Date.now() + 2).toString(),
        type: 'agent',
        content: '❌ Sorry, I encountered an error processing your request. Please try again or rephrase your question.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to process your request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      toast.info('🎤 Listening... Speak now!');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion);
    handleSendMessage(suggestion);
  };

  const renderMessage = (message: ConversationMessage) => {
    const isUser = message.type === 'user';
    
    return (
      <div key={message.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && (
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <Bot size={16} className="text-white" />
          </div>
        )}
        
        <div className={`max-w-[70%] ${isUser ? 'order-2' : ''}`}>
          <Card className={`p-4 ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-50'}`}>
            <div className="whitespace-pre-wrap">{message.content}</div>
            
            {/* Render suggestions */}
            {message.data?.suggestions && (
              <div className="mt-3 flex flex-wrap gap-2">
                {message.data.suggestions.map((suggestion: string, index: number) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-xs"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            )}
            
            {/* Render workflow details */}
            {message.data?.workflow && (
              <div className="mt-3 space-y-2">
                <Badge variant="secondary">🏗️ Workflow: {message.data.workflow.type}</Badge>
                <div className="text-sm">
                  <strong>Steps:</strong>
                  <ul className="list-disc list-inside ml-2 mt-1">
                    {message.data.workflow.steps.map((step: string, index: number) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {/* Render schedule details */}
            {message.data?.details && message.data.action === 'schedule_event' && (
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    <Clock size={12} className="mr-1" />
                    {message.data.details.when}
                  </Badge>
                  {message.data.details.location !== 'TBD' && (
                    <Badge variant="secondary">
                      <MapPin size={12} className="mr-1" />
                      {message.data.details.location}
                    </Badge>
                  )}
                  {message.data.details.attendees?.length > 0 && (
                    <Badge variant="secondary">
                      <Users size={12} className="mr-1" />
                      {message.data.details.attendees.length} attendees
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </Card>
          
          <div className="text-xs text-gray-500 mt-1">
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
        
        {isUser && (
          <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center order-1">
            <span className="text-white text-sm font-medium">U</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <Calendar size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">🤖 Universal Calendar Agent</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              I&apos;m your calendar assistant. I can help you schedule meetings, check availability, and manage your calendar. Try saying &quot;Schedule a meeting&quot; or &quot;What&apos;s on my calendar today?&quot;
            </p>
          </div>
          <Sparkles size={16} className="text-purple-500 ml-auto" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map(renderMessage)}
        {isProcessing && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <Card className="p-4 bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="text-gray-600">Processing your request...</span>
              </div>
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your request or click the mic to speak..."
              onKeyPress={(e) => e.key === 'Enter' && !isProcessing && handleSendMessage()}
              disabled={isProcessing}
            />
          </div>
          
          <Button
            onClick={handleVoiceInput}
            variant={isListening ? "destructive" : "outline"}
            size="sm"
            disabled={isProcessing}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </Button>
          
          <Button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isProcessing}
            size="sm"
          >
            <Send size={16} />
          </Button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <Sparkles size={12} />
          Try: "Schedule a meeting", "Analyze my emails", "Build a workflow", or just ask!
        </div>
      </div>
    </Card>
  );
} 