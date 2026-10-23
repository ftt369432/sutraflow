import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/Button';
import {
  Bot,
  User,
  Send,
  Paperclip,
  Mic,
  RefreshCcw,
  Download,
  Settings,
  MoreHorizontal,
  Copy,
  Trash2,
  MessageSquare,
  Clock,
  Zap,
  Target,
  Activity
} from 'lucide-react';
import { AIAssistant } from '../../types/ai';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  responseTime?: number;
  status?: 'sending' | 'sent' | 'error';
}

interface ChatStats {
  totalMessages: number;
  avgResponseTime: number;
  successRate: number;
  currentStreak: number;
}

interface Props {
  assistant: AIAssistant;
  onUpdate?: (updates: Partial<AIAssistant>) => void;
}

export const EnhancedAssistantChat: React.FC<Props> = ({ assistant, onUpdate }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatStats, setChatStats] = useState<ChatStats>({
    totalMessages: 0,
    avgResponseTime: 786,
    successRate: 98.5,
    currentStreak: 12
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sample conversation data
  useEffect(() => {
    const sampleMessages: Message[] = [
      {
        id: '1',
        role: 'assistant',
        content: `Hello! I'm ${assistant.name}, your ${assistant.category} assistant. ${assistant.description} How can I help you today?`,
        timestamp: new Date(Date.now() - 3600000),
        responseTime: 234
      },
      {
        id: '2',
        role: 'user',
        content: 'Can you help me understand the key legal principles I should know about?',
        timestamp: new Date(Date.now() - 3500000)
      },
      {
        id: '3',
        role: 'assistant',
        content: `I'd be happy to help you understand key legal principles. Here are some fundamental concepts:

• **Due Process** - Fair treatment through the judicial system
• **Burden of Proof** - Responsibility to prove allegations  
• **Statute of Limitations** - Time limits for filing legal claims
• **Contract Formation** - Essential elements for valid agreements
• **Precedent** - Legal decisions that guide future cases

Would you like me to elaborate on any of these concepts or discuss specific areas of law?`,
        timestamp: new Date(Date.now() - 3400000),
        responseTime: 892
      }
    ];
    setMessages(sampleMessages);
    setChatStats({
      totalMessages: sampleMessages.length,
      avgResponseTime: 786,
      successRate: 98.5,
      currentStreak: 12
    });
  }, [assistant]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
      status: 'sent'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateSampleResponse(inputValue),
        timestamp: new Date(),
        responseTime: Math.floor(Math.random() * 1000) + 500,
        status: 'sent'
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
      
      // Update stats
      setChatStats(prev => ({
        totalMessages: prev.totalMessages + 2,
        avgResponseTime: (prev.avgResponseTime + assistantMessage.responseTime!) / 2,
        successRate: Math.min(99.9, prev.successRate + 0.1),
        currentStreak: prev.currentStreak + 1
      }));
    }, Math.random() * 2000 + 500);
  };

  const generateSampleResponse = (input: string): string => {
    const responses = [
      `Based on your question about "${input.slice(0, 50)}...", I can provide detailed legal analysis. This involves several key considerations that I'll break down for you.`,
      `That's an excellent question regarding "${input.slice(0, 50)}...". Let me explain the relevant legal frameworks and precedents.`,
      `I understand you're asking about "${input.slice(0, 50)}...". This area of law has several important aspects worth discussing.`,
      `Thank you for that question about "${input.slice(0, 50)}...". Based on my legal knowledge base, here's what you need to know.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setChatStats({
      totalMessages: 0,
      avgResponseTime: 0,
      successRate: 100,
      currentStreak: 0
    });
  };

  const handleExportChat = () => {
    const exportData = {
      assistant: assistant.name,
      timestamp: new Date().toISOString(),
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
        responseTime: m.responseTime
      })),
      stats: chatStats
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${assistant.name.toLowerCase().replace(/\s+/g, '_')}_chat_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Chat Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">
                {assistant.name.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Chat with {assistant.name}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>Active</span>
                </div>
                <span>Avg Response: {chatStats.avgResponseTime}ms</span>
                <span>Success: {chatStats.successRate}%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleClearChat}>
              <RefreshCcw className="w-4 h-4 mr-2" />
              Clear
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportChat}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Chat Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 dark:text-blue-400 text-xs font-medium">Messages</p>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{chatStats.totalMessages}</p>
              </div>
              <MessageSquare className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 dark:text-green-400 text-xs font-medium">Response Time</p>
                <p className="text-lg font-bold text-green-900 dark:text-green-100">{chatStats.avgResponseTime}ms</p>
              </div>
              <Clock className="w-5 h-5 text-green-500" />
            </div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 dark:text-purple-400 text-xs font-medium">Success Rate</p>
                <p className="text-lg font-bold text-purple-900 dark:text-purple-100">{chatStats.successRate}%</p>
              </div>
              <Target className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 dark:text-orange-400 text-xs font-medium">Streak</p>
                <p className="text-lg font-bold text-orange-900 dark:text-orange-100">{chatStats.currentStreak}</p>
              </div>
              <Zap className="w-5 h-5 text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] group relative ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white rounded-t-2xl rounded-bl-2xl rounded-br-md'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-t-2xl rounded-br-2xl rounded-bl-md shadow-sm border border-gray-200 dark:border-gray-700'
              } p-4`}>
                <div className="flex items-center space-x-2 mb-2">
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4 text-blue-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    message.role === 'user' ? 'text-white/90' : 'text-gray-900 dark:text-white'
                  }`}>
                    {message.role === 'user' ? 'You' : assistant.name}
                  </span>
                  <span className={`text-xs ${
                    message.role === 'user' ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                  {message.responseTime && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {message.responseTime}ms
                    </span>
                  )}
                </div>
                
                <div className={`text-sm whitespace-pre-wrap ${
                  message.role === 'user' ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {message.content}
                </div>

                {/* Message Actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyMessage(message.content)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] bg-white dark:bg-gray-800 rounded-t-2xl rounded-br-2xl rounded-bl-md shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Bot className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {assistant.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">typing...</span>
                </div>
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
      </div>

      {/* Chat Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-20 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                rows={1}
                placeholder={`Ask ${assistant.name} anything...`}
                disabled={isLoading}
              />
              <div className="absolute right-2 bottom-2 flex space-x-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Mic className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button 
              onClick={handleSendMessage} 
              disabled={!inputValue.trim() || isLoading}
              className="px-6 py-3"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span>Press Enter to send, Shift+Enter for new line</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Activity className="w-3 h-3" />
              <span>Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 