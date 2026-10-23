import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { ScrollArea } from '../ui/ScrollArea';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { useAI } from '../../contexts/AIContext';
import { useAIStore } from '../../store/aiStore';
import { Bot, Brain, Target, Lightbulb, Mic, MicOff } from 'lucide-react';

interface SuccessEmbodimentAssistantProps {
  mode?: 'chat' | 'business' | 'life' | 'manifestation';
}

interface Legend {
  id: string;
  name: string;
  avatar: string;
  expertise: string;
  description: string;
  color: string;
}

const businessLegends: Legend[] = [
  {
    id: 'warren_buffett',
    name: 'Warren Buffett',
    avatar: '💰',
    expertise: 'Investment & Value Creation',
    description: 'Value investing wisdom and long-term thinking',
    color: 'bg-green-100 text-green-800'
  },
  {
    id: 'steve_jobs',
    name: 'Steve Jobs',
    avatar: '🍎',
    expertise: 'Innovation & Design',
    description: 'Revolutionary product thinking and user experience',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'elon_musk',
    name: 'Elon Musk',
    avatar: '🚀',
    expertise: 'First Principles & Bold Vision',
    description: 'Breakthrough thinking and impossible goals',
    color: 'bg-purple-100 text-purple-800'
  },
  {
    id: 'jeff_bezos',
    name: 'Jeff Bezos',
    avatar: '📦',
    expertise: 'Scale & Customer Obsession',
    description: 'Building unstoppable business empires',
    color: 'bg-orange-100 text-orange-800'
  }
];

const lifeLegends: Legend[] = [
  {
    id: 'tony_robbins',
    name: 'Tony Robbins',
    avatar: '⚡',
    expertise: 'Peak Performance & Breakthrough',
    description: 'Massive action and state management',
    color: 'bg-red-100 text-red-800'
  },
  {
    id: 'oprah_winfrey',
    name: 'Oprah Winfrey',
    avatar: '✨',
    expertise: 'Authentic Living & Purpose',
    description: 'Heart-centered wisdom and authentic expression',
    color: 'bg-pink-100 text-pink-800'
  },
  {
    id: 'robin_sharma',
    name: 'Robin Sharma',
    avatar: '🏆',
    expertise: 'Leadership Excellence',
    description: 'Daily mastery and legendary performance',
    color: 'bg-yellow-100 text-yellow-800'
  },
  {
    id: 'napoleon_hill',
    name: 'Napoleon Hill',
    avatar: '🧠',
    expertise: 'Success Principles',
    description: 'Think and Grow Rich mindset mastery',
    color: 'bg-indigo-100 text-indigo-800'
  }
];

export function SuccessEmbodimentAssistant({ mode = 'chat' }: SuccessEmbodimentAssistantProps) {
  const { messages } = useAIStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLegend, setSelectedLegend] = useState<Legend | null>(null);
  const [currentMode, setCurrentMode] = useState<'chat' | 'business' | 'life' | 'manifestation'>(mode);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage } = useAI();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const messageToSend = input;
    setInput('');
    setIsLoading(true);

    try {
      // Enhance message with legend embodiment
      const enhancedMessage = selectedLegend
        ? `[Embody ${selectedLegend.name}'s mindset and wisdom] ${messageToSend}`
        : messageToSend;

      // Map current mode to valid sendMessage mode
      const sendMode = currentMode === 'chat' ? 'chat' : 'task';
      await sendMessage([{ text: enhancedMessage }], sendMode);
    } catch (error) {
      console.error(`Error sending message in ${currentMode} mode:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceManifestationStart = () => {
    setIsListening(true);
    // Voice recognition implementation would go here
    console.log('Starting voice manifestation...');
  };

  const handleVoiceManifestationStop = () => {
    setIsListening(false);
    // Stop voice recognition
    console.log('Stopping voice manifestation...');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getCurrentLegends = () => {
    switch (currentMode) {
      case 'business':
        return businessLegends;
      case 'life':
        return lifeLegends;
      case 'manifestation':
        return [...businessLegends, ...lifeLegends];
      default:
        return [];
    }
  };

  const getModeDescription = () => {
    switch (currentMode) {
      case 'business':
        return 'Channel the world\'s greatest business minds for strategic guidance';
      case 'life':
        return 'Embody transformation masters for personal breakthrough';
      case 'manifestation':
        return 'Speak your specifications into existence with legendary wisdom';
      default:
        return 'General AI assistance';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background_color text-text_color">
      {/* Header */}
      <div className="p-4 border-b border-border_color">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-6 h-6 text-primary_color" />
          <h2 className="text-xl font-semibold">Success Embodiment Assistant</h2>
        </div>
        
        {/* Mode Selection */}
        <div className="flex gap-2 mb-3">
          <Button 
            variant={currentMode === 'chat' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setCurrentMode('chat')}
            className="flex items-center gap-1"
          >
            <Bot className="w-4 h-4" />
            Chat
          </Button>
          <Button 
            variant={currentMode === 'business' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setCurrentMode('business')}
            className="flex items-center gap-1"
          >
            <Target className="w-4 h-4" />
            Business
          </Button>
          <Button 
            variant={currentMode === 'life' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setCurrentMode('life')}
            className="flex items-center gap-1"
          >
            <Lightbulb className="w-4 h-4" />
            Life
          </Button>
          <Button 
            variant={currentMode === 'manifestation' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setCurrentMode('manifestation')}
            className="flex items-center gap-1"
          >
            <Mic className="w-4 h-4" />
            Manifestation
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">{getModeDescription()}</p>
      </div>

      {/* Legend Selection */}
      {currentMode !== 'chat' && (
        <div className="p-4 border-b border-border_color">
          <h3 className="text-sm font-medium mb-2">Choose Your Embodied Legend:</h3>
          <div className="grid grid-cols-2 gap-2">
            {getCurrentLegends().map((legend) => (
              <Card 
                key={legend.id}
                className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                  selectedLegend?.id === legend.id 
                    ? 'ring-2 ring-primary_color bg-primary_color/5' 
                    : ''
                }`}
                onClick={() => setSelectedLegend(legend)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{legend.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{legend.name}</h4>
                    <p className="text-xs text-muted-foreground truncate">{legend.expertise}</p>
                  </div>
                  <Badge className={`text-xs ${legend.color}`}>
                    {selectedLegend?.id === legend.id ? 'Active' : 'Select'}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
          
          {selectedLegend && (
            <div className="mt-3 p-3 bg-accent/20 rounded-lg">
              <p className="text-sm">
                <strong>Embodying {selectedLegend.name}:</strong> {selectedLegend.description}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Ready to Channel Success</h3>
              <p className="text-sm">
                {currentMode === 'chat' 
                  ? 'Start a conversation with your AI assistant'
                  : `Select a legend above and ask for guidance in ${currentMode} matters`
                }
              </p>
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
                {message.role === 'assistant' && selectedLegend && (
                  <div className="flex items-center gap-2 mb-2 text-sm opacity-75">
                    <span>{selectedLegend.avatar}</span>
                    <span>As {selectedLegend.name}:</span>
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
                  {selectedLegend && (
                    <>
                      <span>{selectedLegend.avatar}</span>
                      <span className="text-sm opacity-75">{selectedLegend.name} is thinking...</span>
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

      {/* Voice Manifestation Bar */}
      {currentMode === 'manifestation' && (
        <div className="p-3 border-t border-border_color bg-accent/20">
          <div className="flex items-center gap-3">
            <Button
              variant={isListening ? "destructive" : "default"}
              size="sm"
              onClick={isListening ? handleVoiceManifestationStop : handleVoiceManifestationStart}
              className="flex items-center gap-1"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isListening ? 'Stop Manifestation' : 'Speak Into Existence'}
            </Button>
            <p className="text-sm text-muted-foreground">
              {isListening 
                ? 'Listening... Speak your vision clearly' 
                : 'Click to voice-activate manifestation with legendary wisdom'
              }
            </p>
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
              selectedLegend 
                ? `Ask ${selectedLegend.name} for guidance...`
                : currentMode === 'manifestation'
                  ? 'Describe what you want to manifest, or use voice activation...'
                  : 'Type your message...'
            }
            className="flex-1 min-h-[40px] max-h-[120px]"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="px-6"
          >
            Send
          </Button>
        </div>
        
        {selectedLegend && (
          <p className="text-xs text-muted-foreground mt-2">
            💡 Channeling {selectedLegend.name}'s wisdom - {selectedLegend.expertise}
          </p>
        )}
      </div>
    </div>
  );
}
