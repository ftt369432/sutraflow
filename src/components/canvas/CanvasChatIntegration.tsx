import React, { useState, useCallback, useEffect } from 'react';
import { 
  ChevronDown, ChevronRight, Brain, Sparkles, FileText, 
  ToggleLeft, ToggleRight, Settings, Bot, Clock, Zap
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Switch } from '../ui/Switch';
import { Slider } from '../ui/Slider';
import { useCanvasStore } from '../../stores/canvasStore';
import { useCanvasChatIntegration } from '../../hooks/useCanvasChatIntegration';
import { ContentAnalysis, ChatContext } from '../../types/canvas';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  metadata?: {
    thinkingProcess?: ThinkingProcess;
    canvasAnalysis?: ContentAnalysis;
    processingTime?: number;
  };
}

interface ThinkingProcess {
  context: string;
  objectives: string[];
  constraints: string[];
  reasoning: string[];
  alternatives: string[];
  confidence: number;
  nextSteps: string[];
  timestamp: Date;
}

interface CanvasChatIntegrationProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isProcessing?: boolean;
  className?: string;
}

export function CanvasChatIntegration({
  messages,
  onSendMessage,
  isProcessing = false,
  className = ''
}: CanvasChatIntegrationProps) {
  const [input, setInput] = useState('');
  const [showThinkingProcess, setShowThinkingProcess] = useState(false);
  const [canvasConfidence, setCanvasConfidence] = useState(0.8);
  const [autoLaunchCanvas, setAutoLaunchCanvas] = useState(true);
  
  const { 
    isCanvasEnabled, 
    processMessage, 
    manualLaunch,
    lastAnalysis 
  } = useCanvasChatIntegration({
    autoLaunch: autoLaunchCanvas,
    minConfidence: canvasConfidence,
    showNotifications: true
  });

  const { toggleCanvasEnabled } = useCanvasStore();

  const [expandedThinking, setExpandedThinking] = useState<Set<string>>(new Set());

  // Toggle thinking process expansion for a specific message
  const toggleThinkingExpansion = useCallback((messageId: string) => {
    setExpandedThinking(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  }, []);

  // Handle message sending with canvas integration
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message to chat
    onSendMessage(userMessage);

    // Process message for canvas integration
    if (isCanvasEnabled) {
      try {
        const result = await processMessage(userMessage, messages);
        
        if (result.analysis && result.analysis.shouldOpenCanvas) {
          // Show thinking process if canvas is triggered
          setShowThinkingProcess(true);
        }
      } catch (error) {
        console.error('Canvas integration error:', error);
      }
    }
  }, [input, isProcessing, onSendMessage, isCanvasEnabled, processMessage, messages]);

  // Render thinking process for a message
  const renderThinkingProcess = useCallback((message: Message) => {
    const thinking = message.metadata?.thinkingProcess;
    if (!thinking) return null;

    const isExpanded = expandedThinking.has(message.id);

    return (
      <div className="mt-2 border-l-2 border-blue-200 pl-4">
        <button
          onClick={() => toggleThinkingExpansion(message.id)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <Brain className="h-4 w-4" />
          <span>AI Thinking Process</span>
          <Badge variant="secondary" className="text-xs">
            {Math.round(thinking.confidence * 100)}% confidence
          </Badge>
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-3 text-sm">
            {/* Context */}
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Context</h4>
              <p className="text-gray-600 dark:text-gray-400">{thinking.context}</p>
            </div>

            {/* Objectives */}
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Objectives</h4>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                {thinking.objectives.map((objective, index) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
            </div>

            {/* Reasoning */}
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Reasoning</h4>
              <div className="space-y-2">
                {thinking.reasoning.map((step, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400">
                      {index + 1}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 flex-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Next Steps</h4>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                {thinking.nextSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>

            {/* Canvas Analysis */}
            {message.metadata?.canvasAnalysis && (
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Canvas Analysis</h4>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">
                      {message.metadata.canvasAnalysis.contentType.replace('_', ' ')}
                    </span>
                    <Badge variant="outline">
                      {Math.round(message.metadata.canvasAnalysis.confidence * 100)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {message.metadata.canvasAnalysis.extractedRequirements.join(', ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }, [expandedThinking, toggleThinkingExpansion]);

  // Render canvas suggestion
  const renderCanvasSuggestion = useCallback((analysis: ContentAnalysis) => {
    return (
      <Card className="mt-3 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Canvas Suggestion</span>
            <Badge variant="outline">
              {Math.round(analysis.confidence * 100)}% match
            </Badge>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            I can help you create a {analysis.contentType.replace('_', ' ')} document with AI assistance.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => manualLaunch(input, messages)}
              className="flex items-center gap-1"
            >
              <FileText className="h-3 w-3" />
              Create Document
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowThinkingProcess(false)}
            >
              Dismiss
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }, [manualLaunch, input, messages]);

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}>
      {/* Messages Area with better spacing */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg p-4 shadow-sm ${
                message.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                
                {/* Processing time indicator */}
                {message.metadata?.processingTime && (
                  <div className="flex items-center gap-1 mt-2 text-xs opacity-70">
                    <Clock className="h-3 w-3" />
                    <span>{Math.round(message.metadata.processingTime / 1000)}s</span>
                  </div>
                )}
              </div>
            </div>

            {/* AI Thinking Process */}
            {message.role === 'assistant' && renderThinkingProcess(message)}

            {/* Canvas Suggestion */}
            {message.role === 'assistant' && 
             message.metadata?.canvasAnalysis && 
             showThinkingProcess && 
             renderCanvasSuggestion(message.metadata.canvasAnalysis)}
          </div>
        ))}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center gap-2 shadow-sm">
              <Bot className="h-4 w-4 animate-pulse text-blue-600" />
              <span className="text-gray-700 dark:text-gray-300">AI is thinking...</span>
              {isCanvasEnabled && (
                <Badge variant="outline" className="text-xs">
                  Canvas Active
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input Area with Canvas Controls */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3 bg-gray-50 dark:bg-gray-800">
        {/* Canvas Toggle Controls */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="text-gray-700 dark:text-gray-300">Intelligent Canvas</span>
            <Switch
              checked={isCanvasEnabled}
              onCheckedChange={() => {
                toggleCanvasEnabled();
                toast.info(isCanvasEnabled ? 'Canvas disabled' : 'Canvas enabled');
              }}
            />
          </div>
          
          {isCanvasEnabled && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Auto-launch:</span>
              <Switch
                checked={autoLaunchCanvas}
                onCheckedChange={setAutoLaunchCanvas}
                size="sm"
              />
            </div>
          )}
        </div>

        {/* Canvas Confidence Slider */}
        {isCanvasEnabled && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 min-w-0">Confidence:</span>
            <Slider
              value={[canvasConfidence]}
              onValueChange={([value]) => setCanvasConfidence(value)}
              max={1}
              min={0.5}
              step={0.1}
              className="flex-1"
            />
            <span className="text-xs text-gray-500 min-w-0">
              {Math.round(canvasConfidence * 100)}%
            </span>
          </div>
        )}

        {/* Message Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            disabled={isProcessing}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isProcessing}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Zap className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 