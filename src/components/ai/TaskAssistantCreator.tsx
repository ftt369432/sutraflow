import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { ScrollArea } from '../ui/ScrollArea';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { useAI } from '../../contexts/AIContext';
import { useAIStore } from '../../store/aiStore';
import { AssistantLearningService } from '../../services/AssistantLearningService';
import { Bot, Settings, Save, Brain, Target, CheckCircle, TrendingUp } from 'lucide-react';

interface TaskAssistant {
  id: string;
  name: string;
  purpose: string;
  capabilities: string[];
  learned_tasks: string[];
  created_at: string;
  updated_at: string;
}

interface TaskAssistantCreatorProps {
  onAssistantCreated?: (assistant: TaskAssistant) => void;
}

export function TaskAssistantCreator({ onAssistantCreated }: TaskAssistantCreatorProps) {
  const { messages } = useAIStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAssistant, setCurrentAssistant] = useState<TaskAssistant | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [assistantName, setAssistantName] = useState('');
  const [assistantPurpose, setAssistantPurpose] = useState('');
  const [learningStats, setLearningStats] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage } = useAI();
  const learningService = AssistantLearningService.getInstance();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (currentAssistant) {
      updateLearningStats(currentAssistant.id);
    }
  }, [currentAssistant]);

  const createNewAssistant = () => {
    const newAssistant: TaskAssistant = {
      id: `assistant_${Date.now()}`,
      name: assistantName || 'Personal AI Assistant',
      purpose: assistantPurpose || 'Personalized assistance, coaching, and task automation',
      capabilities: [
        'Personalized coaching',
        'Learning from conversation',
        'Task automation', 
        'Knowledge retention',
        'Adaptive responses'
      ],
      learned_tasks: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setCurrentAssistant(newAssistant);
    setIsConfiguring(false);
    
    // Initialize learning knowledge for this assistant
    learningService.initializeAssistantKnowledge(newAssistant.id, assistantPurpose || 'general');
    updateLearningStats(newAssistant.id);
    
    // Save to localStorage for persistence
    const savedAssistants = JSON.parse(localStorage.getItem('task_assistants') || '[]');
    savedAssistants.push(newAssistant);
    localStorage.setItem('task_assistants', JSON.stringify(savedAssistants));
    
    if (onAssistantCreated) {
      onAssistantCreated(newAssistant);
    }
  };

  const updateLearningStats = (assistantId: string) => {
    const stats = learningService.getAssistantStats(assistantId);
    setLearningStats(stats);
  };

  const updateAssistantFromChat = async (instruction: string) => {
    if (!currentAssistant) return;

    // Use the learning service to learn from this interaction
    const updatedAssistant = {
      ...currentAssistant,
      learned_tasks: [...currentAssistant.learned_tasks, instruction],
      updated_at: new Date().toISOString()
    };
    
    setCurrentAssistant(updatedAssistant);
    updateLearningStats(currentAssistant.id);
    
    // Update localStorage
    const savedAssistants = JSON.parse(localStorage.getItem('task_assistants') || '[]');
    const index = savedAssistants.findIndex((a: TaskAssistant) => a.id === currentAssistant.id);
    if (index !== -1) {
      savedAssistants[index] = updatedAssistant;
      localStorage.setItem('task_assistants', JSON.stringify(savedAssistants));
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const messageToSend = input;
    setInput('');
    setIsLoading(true);

    try {
      if (currentAssistant) {
        // First, try to get a contextual response from the learning service
        const contextualResponse = await learningService.generateContextualResponse(
          currentAssistant.id,
          messageToSend,
          `Assistant: ${currentAssistant.name}, Purpose: ${currentAssistant.purpose}`
        );

        let finalResponse: string;
        
        if (contextualResponse) {
          finalResponse = contextualResponse;
        } else {
          // Fallback to regular AI response with assistant context
          const enhancedMessage = `
Assistant Context:
- Name: ${currentAssistant.name}
- Purpose: ${currentAssistant.purpose}
- Learned Tasks: ${currentAssistant.learned_tasks.join(', ')}

User Request: ${messageToSend}

Please respond as this specialized assistant and adapt to the user's communication style.
`;
          
          finalResponse = await sendMessage([{ text: enhancedMessage }], 'task');
        }

        // Learn from this interaction
        await learningService.learnFromInteraction(
          currentAssistant.id,
          messageToSend,
          finalResponse,
          `Assistant: ${currentAssistant.name}, Purpose: ${currentAssistant.purpose}`
        );

        // Update assistant with the new interaction
        await updateAssistantFromChat(messageToSend);

      } else {
        // General conversation to help create an assistant
        const creationPrompt = `
Help the user create a specialized AI assistant. They can create ANY type of assistant they want:

- Business Coach: Strategy, leadership, entrepreneurship guidance
- Life Coach: Personal development, goal setting, motivation
- Teacher/Tutor: Explain concepts, provide lessons, answer questions
- Task Specialist: Automate specific work tasks and processes
- Advisor: Expert knowledge in specific domains
- Mentor: Long-term guidance and development

User message: ${messageToSend}

Guide them on:
1. What type of assistant they want (coach, teacher, advisor, specialist, etc.)
2. What the assistant should help them with
3. How it should communicate and behave
4. What knowledge/skills it needs

Be encouraging and suggest a name and purpose based on their needs.
`;
        
        await sendMessage([{ text: creationPrompt }], 'chat');
      }
    } catch (error) {
      console.error('Error sending message:', error);
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

  return (
    <div className="flex flex-col h-full bg-background_color text-text_color">
      {/* Header */}
      <div className="p-4 border-b border-border_color">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary_color" />
            <h2 className="text-xl font-semibold">Task Assistant Creator</h2>
          </div>
          
          {!currentAssistant && (
            <Button 
              onClick={() => setIsConfiguring(true)}
              className="flex items-center gap-1"
              size="sm"
            >
              <Settings className="w-4 h-4" />
              Create Assistant
            </Button>
          )}
        </div>

        {currentAssistant ? (
          <Card className="p-3 bg-primary_color/5 border-primary_color/20">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-primary_color">{currentAssistant.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{currentAssistant.purpose}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {currentAssistant.capabilities.slice(0, 3).map((cap, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {cap}
                    </Badge>
                  ))}
                  {currentAssistant.capabilities.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{currentAssistant.capabilities.length - 3} more
                    </Badge>
                  )}
                </div>
                {currentAssistant.learned_tasks.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    📚 Learned {currentAssistant.learned_tasks.length} tasks
                  </p>
                )}
                {learningStats && (
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {learningStats.total_patterns} patterns
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {(learningStats.average_success_rate * 100).toFixed(0)}% success
                    </Badge>
                  </div>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsConfiguring(true)}
                className="ml-2"
              >
                <Settings className="w-3 h-3" />
              </Button>
            </div>
          </Card>
        ) : (
          <p className="text-sm text-muted-foreground">
            Chat with me to create a specialized task assistant that learns from your instructions
          </p>
        )}
      </div>

      {/* Assistant Configuration Modal */}
      {isConfiguring && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 m-4">
            <h3 className="text-lg font-semibold mb-4">
              {currentAssistant ? 'Update Assistant' : 'Create New Assistant'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Assistant Name</label>
                <Input
                  value={assistantName}
                  onChange={(e) => setAssistantName(e.target.value)}
                  placeholder="e.g., Business Coach, Life Mentor, Code Teacher, Sales Expert"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-1">Purpose</label>
                <Textarea
                  value={assistantPurpose}
                  onChange={(e) => setAssistantPurpose(e.target.value)}
                  placeholder="What should this assistant do? Examples: 'Help me develop business strategies', 'Coach me on personal growth', 'Teach me programming', 'Automate my email responses'"
                  className="min-h-[80px]"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button onClick={() => setIsConfiguring(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={createNewAssistant} className="flex-1 flex items-center gap-1">
                <Save className="w-4 h-4" />
                {currentAssistant ? 'Update' : 'Create'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                {currentAssistant ? `Training ${currentAssistant.name}` : 'Create Your AI Assistant'}
              </h3>
              <p className="text-sm max-w-md mx-auto mb-4">
                {currentAssistant 
                  ? 'Give instructions, ask questions, or assign tasks. Your assistant will learn and improve with each interaction.'
                  : 'Create any type of assistant you need - coach, teacher, advisor, business expert, or specialist. Just tell me what you want!'
                }
              </p>
              
              {!currentAssistant && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 max-w-2xl mx-auto text-xs">
                  <div className="p-2 bg-primary_color/10 rounded border">
                    <strong>Business Coach:</strong> "I need a business strategy advisor"
                  </div>
                  <div className="p-2 bg-primary_color/10 rounded border">
                    <strong>Life Coach:</strong> "Create a personal development mentor"
                  </div>
                  <div className="p-2 bg-primary_color/10 rounded border">
                    <strong>Teacher:</strong> "I want a coding instructor"
                  </div>
                  <div className="p-2 bg-primary_color/10 rounded border">
                    <strong>Specialist:</strong> "Make an email automation expert"
                  </div>
                </div>
              )}
            </div>
          )}
          
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary_color text-white'
                    : 'bg-muted border'
                }`}
              >
                {message.role === 'assistant' && currentAssistant && (
                  <div className="flex items-center gap-2 mb-2 text-sm opacity-75">
                    <Bot className="w-4 h-4" />
                    <span>{currentAssistant.name}:</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted border rounded-lg p-3 max-w-[80%]">
                <div className="flex items-center gap-2">
                  {currentAssistant && (
                    <>
                      <Bot className="w-4 h-4" />
                      <span className="text-sm opacity-75">{currentAssistant.name} is learning...</span>
                    </>
                  )}
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary_color rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary_color rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary_color rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Learning Indicators */}
      {currentAssistant && currentAssistant.learned_tasks.length > 0 && (
        <div className="p-3 border-t border-border_color bg-accent/20">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary_color" />
            <span className="text-sm font-medium">Recently Learned:</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {currentAssistant.learned_tasks.slice(-3).map((task, index) => (
              <div key={index} className="flex items-center gap-1 mb-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span className="truncate">{task}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border_color">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              currentAssistant 
                ? `Chat with ${currentAssistant.name} - ask questions, get advice, or teach new skills...`
                : 'What kind of assistant do you want? (coach, teacher, advisor, specialist...)'
            }
            className="flex-1 min-h-[40px] max-h-[120px]"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="px-6"
          >
            {currentAssistant ? 'Chat' : 'Create'}
          </Button>
        </div>
        
        {currentAssistant && (
          <p className="text-xs text-muted-foreground mt-2">
            💡 Your assistant learns from every conversation and adapts to your style automatically
          </p>
        )}
      </div>
    </div>
  );
}
