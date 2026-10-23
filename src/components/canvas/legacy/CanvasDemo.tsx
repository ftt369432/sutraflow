import React, { useState } from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  FileText, 
  Bot, 
  Zap,
  Send,
  Plus,
  Layout,
  Grid3X3,
  Settings,
  Maximize2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { IntelligentCanvas } from './IntelligentCanvas';
import { MultiWindowCanvasControl } from './MultiWindowCanvasControl';
import { useCanvasChatIntegration } from '../../hooks/useCanvasChatIntegration';
import { useCanvasStore } from '../../stores/canvasStore';
import { ContentType, CanvasWindow } from '../../types/canvas';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  canvasSuggestion?: any;
}

const DEMO_TRIGGERS = [
  'I need to write a contract for my new client',
  'Help me create a business plan for my startup',
  'I need to draft a legal petition for court',
  'Can you help me write a formal letter to the mayor?',
  'I need to create a presentation for my meeting',
  'Help me write a research paper on AI ethics'
];

const CONTENT_TYPE_EXAMPLES = [
  { type: 'legal_contract' as ContentType, label: 'Legal Contract', description: 'Service agreements, NDAs, employment contracts' },
  { type: 'business_plan' as ContentType, label: 'Business Plan', description: 'Startup plans, market analysis, financial projections' },
  { type: 'academic_paper' as ContentType, label: 'Academic Paper', description: 'Research papers, essays, dissertations' },
  { type: 'legal_brief' as ContentType, label: 'Legal Brief', description: 'Court briefs, legal arguments, case analysis' },
  { type: 'petition' as ContentType, label: 'Legal Petition', description: 'Court petitions, motions, legal requests' },
  { type: 'formal_letter' as ContentType, label: 'Formal Letter', description: 'Business letters, official correspondence' }
];

export function CanvasDemo() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I can help you create documents with AI assistance. Try saying something like "I need to write a contract" or "Help me create a business plan".',
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<'windows' | 'tabs'>('windows');
  const [windowZIndex, setWindowZIndex] = useState<Record<string, number>>({});
  const [nextZIndex, setNextZIndex] = useState(1000);

  const { windows, isCanvasEnabled } = useCanvasStore();
  const { processMessage, manualLaunch, shouldTriggerCanvas } = useCanvasChatIntegration({
    autoLaunch: true,
    minConfidence: 0.7,
    showNotifications: true
  });

  // Enhanced window management functions
  const bringWindowToFront = (windowId: string) => {
    setWindowZIndex(prev => ({
      ...prev,
      [windowId]: nextZIndex
    }));
    setNextZIndex(prev => prev + 1);
    toast.success('Brought window to front');
  };

  const getWindowZIndex = (windowId: string) => {
    return windowZIndex[windowId] || 100;
  };

  const switchViewMode = (mode: 'windows' | 'tabs') => {
    setViewMode(mode);
    toast.success(`Switched to ${mode} view`);
  };

  const getActiveWindow = (): CanvasWindow | null => {
    if (!windows.length) return null;
    
    const sortedWindows = windows
      .map(window => ({
        ...window,
        zIndex: getWindowZIndex(window.id)
      }))
      .sort((a, b) => b.zIndex - a.zIndex);
    
    return sortedWindows[0] || null;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // Process message for canvas detection
      const result = await processMessage(input, messages);
      
      let assistantResponse = '';
      let canvasSuggestion = null;

      if (result.windowId) {
        assistantResponse = `I've opened a canvas for your ${result.analysis?.contentType?.replace('_', ' ')} document and created ${result.analysis?.suggestedAgents.length || 0} AI agents to help you. You can see the canvas window that just appeared!`;
        
        // Bring new window to front
        setTimeout(() => bringWindowToFront(result.windowId), 100);
      } else if (result.shouldShowSuggestion && result.analysis) {
        assistantResponse = `I can help you create a ${result.analysis.contentType.replace('_', ' ')} document. Would you like me to open a canvas with AI agents to assist you?`;
        canvasSuggestion = {
          type: 'canvas_suggestion',
          analysis: result.analysis,
          userMessage: input
        };
      } else if (shouldTriggerCanvas(input)) {
        assistantResponse = `I detected you might want to create a document, but I need a bit more information. Could you be more specific about what type of document you'd like to create?`;
      } else {
        assistantResponse = getContextualResponse(input);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: assistantResponse,
        role: 'assistant',
        timestamp: new Date(),
        canvasSuggestion
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      toast.error('Error processing your message');
    } finally {
      setIsProcessing(false);
      setInput('');
    }
  };

  const getContextualResponse = (userInput: string) => {
    const responses = [
      "I'm here to help you create documents with AI assistance! Try telling me about a document you need to create.",
      "I can help you with various types of documents like contracts, business plans, letters, and more. What do you need to work on?",
      "Feel free to ask me about document creation - I can detect when you need help and open an intelligent canvas with AI agents to assist you.",
      "I'm ready to help you create professional documents. Just tell me what you need and I'll set up the right tools for you."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSuggestionAccept = async (suggestion: any) => {
    const windowId = await manualLaunch(suggestion.userMessage, messages);
    if (windowId) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: `Perfect! I've opened a canvas for your ${suggestion.analysis.contentType.replace('_', ' ')} document with AI agents ready to help.`,
        role: 'assistant',
        timestamp: new Date()
      }]);
      
      // Bring new window to front
      setTimeout(() => bringWindowToFront(windowId), 100);
    }
  };

  const handleQuickLaunch = (contentType: ContentType) => {
    const { createWindow } = useCanvasStore.getState();
    const windowId = createWindow(contentType);
    toast.success(`Canvas opened for ${contentType.replace('_', ' ')} document`);
  };

  const handleDemoTrigger = (trigger: string) => {
    setInput(trigger);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Intelligent Canvas Demo</h1>
                <p className="text-sm text-gray-600">AI-powered document creation with swarm agents</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {windows.length} Canvas{windows.length !== 1 ? 'es' : ''}
              </Badge>
              <Badge variant={isCanvasEnabled ? 'default' : 'secondary'}>
                {isCanvasEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>
          
          {/* View Mode Toggle */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">View Mode:</span>
              <div className="flex gap-1">
                <Button
                  onClick={() => switchViewMode('windows')}
                  variant={viewMode === 'windows' ? 'default' : 'outline'}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Layout className="h-3 w-3" />
                  Windows
                </Button>
                <Button
                  onClick={() => switchViewMode('tabs')}
                  variant={viewMode === 'tabs' ? 'default' : 'outline'}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Grid3X3 className="h-3 w-3" />
                  Tabs
                </Button>
              </div>
            </div>
            
            {/* Window Management Info */}
            {windows.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Active Windows:</span>
                {windows.slice(0, 3).map((window, index) => (
                  <Button
                    key={window.id}
                    onClick={() => bringWindowToFront(window.id)}
                    variant="ghost"
                    size="sm"
                    className="text-xs px-2 py-1 h-auto"
                  >
                    <Maximize2 className="h-3 w-3 mr-1" />
                    {window.document?.title || `Window ${index + 1}`}
                  </Button>
                ))}
                {windows.length > 3 && (
                  <span className="text-xs text-gray-500">+{windows.length - 3} more</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 max-w-4xl mx-auto w-full">
        {/* Chat Interface */}
        <div className="flex-1 flex flex-col p-4">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat with AI Assistant
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map(message => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md p-3 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <div className="text-sm">{message.content}</div>
                      
                      {/* Canvas Suggestion */}
                      {message.canvasSuggestion && (
                        <div className="mt-3 p-3 bg-white rounded border">
                          <div className="flex items-center gap-2 mb-2">
                            <Bot className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-900">
                              Canvas Suggestion
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 mb-2">
                            Create {message.canvasSuggestion.analysis.contentType.replace('_', ' ')} document
                            with {message.canvasSuggestion.analysis.suggestedAgents.length} AI agents
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleSuggestionAccept(message.canvasSuggestion)}
                              className="text-xs"
                            >
                              Create Document
                            </Button>
                            <Button variant="ghost" size="sm" className="text-xs">
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        <span className="text-sm">Analyzing your request...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me to help you create a document..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!input.trim() || isProcessing}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demo Controls */}
        <div className="w-80 p-4 space-y-4">
          {/* Demo Triggers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Try These Examples</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {DEMO_TRIGGERS.map((trigger, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoTrigger(trigger)}
                  className="w-full text-left text-xs h-auto p-2 whitespace-normal"
                >
                  "{trigger}"
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Quick Launch */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Launch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {CONTENT_TYPE_EXAMPLES.map((example) => (
                <div key={example.type} className="space-y-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickLaunch(example.type)}
                    className="w-full justify-start"
                  >
                    <FileText className="h-3 w-3 mr-2" />
                    {example.label}
                  </Button>
                  <p className="text-xs text-gray-600 px-2">{example.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Canvas Status */}
          {windows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Active Canvases</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {windows.map(window => (
                  <div key={window.id} className="p-2 border rounded text-xs">
                    <div className="font-medium">{window.document.title}</div>
                    <div className="text-gray-600">
                      {window.contentType.replace('_', ' ')} • {window.agents.length} agents
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Enhanced Canvas System */}
      <div className="fixed inset-0 pointer-events-none z-50">
        <div className="absolute inset-0 pointer-events-auto">
          {viewMode === 'windows' ? (
            // Multi-window mode - IntelligentCanvas handles its own windows
            <>
              <IntelligentCanvas />
              <MultiWindowCanvasControl />
            </>
          ) : (
            // Tab mode
            windows.length > 0 && (
              <div className="absolute bottom-4 left-4 right-4 top-4 bg-white rounded-lg shadow-xl border border-gray-200 pointer-events-auto">
                <div className="h-full flex flex-col">
                  {/* Tab bar */}
                  <div className="flex border-b border-gray-200 bg-gray-50 rounded-t-lg">
                    {windows.map((window, index) => (
                      <button
                        key={window.id}
                        className={`px-4 py-2 text-sm border-b-2 transition-colors ${
                          index === 0 
                            ? 'border-blue-500 text-blue-600 bg-white' 
                            : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                        onClick={() => bringWindowToFront(window.id)}
                      >
                        {window.document?.title || `Canvas ${index + 1}`}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 h-4 w-4 p-0 hover:bg-red-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Add close functionality if needed
                          }}
                        >
                          ×
                        </Button>
                      </button>
                    ))}
                  </div>
                  {/* Tab content */}
                  <div className="flex-1 overflow-hidden">
                    <IntelligentCanvas />
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
} 