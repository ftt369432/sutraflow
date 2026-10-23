import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ScrollArea } from '../ui/ScrollArea';
import { Textarea } from '../ui/Textarea';
import { Card } from '../ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Send, Sparkles, Brain, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAssistantStore } from '../../store/assistantStore';
import { useAgentStore } from '../../store/agentStore';
import { AIAssistant, Message, AgentType } from '../../types/ai';
import { useNavigate } from 'react-router-dom';

interface RightSidebarProps {
  className?: string;
}

const contextSuggestions: Record<string, string[]> = {
  tasks: ['Create a new task', 'Show my tasks'],
  calendar: ['Schedule meeting', 'Show calendar'],
  email: ['Compose email', 'Check inbox'],
  drive: ['Upload file', 'Search files'],
  general: ['How can I help?', 'Tell me more'],
  research: ['Research this topic', 'Find information'],
  work: ['Help with work task', 'Analyze document'],
  learning: ['Teach me about', 'Explain concept'],
  building: ['Create project', 'Build solution'],
  coaching: ['Provide guidance', 'Give advice']
};

export function RightSidebar({ className }: RightSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const location = useLocation();
  const { assistants } = useAssistantStore();
  const { createAgent } = useAgentStore();
  const navigate = useNavigate();
  const [currentAgent, setCurrentAgent] = useState<AIAssistant>({
    id: '1',
    name: 'AI Assistant',
    type: 'general' as AgentType,
    capabilities: ['chat', 'help'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const getContextFromPath = (path: string): AgentType => {
    if (path.includes('/tasks')) return 'tasks';
    if (path.includes('/email')) return 'email';
    if (path.includes('/calendar')) return 'calendar';
    if (path.includes('/drive')) return 'drive';
    return 'general';
  };

  useEffect(() => {
    const path = location.pathname || '/';
    const contextType = getContextFromPath(path);
    setCurrentAgent(prev => ({
      ...prev,
      type: contextType
    }));
  }, [location.pathname]);

  // Generate context-aware suggestions
  useEffect(() => {
    const context = getContextFromPath(location.pathname);
    setSuggestions(contextSuggestions[context] || contextSuggestions.general);
  }, [location]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `I'm your ${currentAgent.type} assistant. How can I help you?`,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsThinking(false);
    }, 1000);
  };

  const handleCreateAgent = (type: string) => {
    // TODO: Fix type compatibility between agent and ai AgentType definitions
    console.log('Creating agent of type:', type);
    // createAgent(
    //   `${type} Assistant`,
    //   type as AgentType,
    //   ['natural-language', type]
    // );
  };

  return (
    <div className={`w-64 border-l border-border bg-background ${className || ''}`}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Avatar />
          <div>
            <h3 className="font-medium">{currentAgent.name}</h3>
            <p className="text-sm text-muted-foreground capitalize">{currentAgent.type} Assistant</p>
          </div>
        </div>
      </div>
      
      <ScrollArea className="h-[calc(100vh-8rem)] p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${
              message.role === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <div
              className={`inline-block p-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={contextSuggestions[currentAgent.type][0]}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button onClick={handleSendMessage}>Send</Button>
        </div>
      </div>
    </div>
  );
}

export default RightSidebar; 