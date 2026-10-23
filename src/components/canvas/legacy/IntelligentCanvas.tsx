import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bot, 
  Sparkles, 
  FileText, 
  X, 
  Maximize2, 
  Minimize2,
  PinIcon,
  PinOffIcon,
  Settings
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { ProjectCanvas } from './ProjectCanvas';
import { AgentCoordinator } from './AgentCoordinator';
import { useCanvasStore } from '../../stores/canvasStore';
import { contentDetectionService } from '../../services/canvas/contentDetection';
import { 
  ContentType, 
  ContentAnalysis, 
  ChatContext, 
  CanvasWindow, 
  AgentSpecialization 
} from '../../types/canvas';
import { toast } from 'sonner';

interface IntelligentCanvasProps {
  className?: string;
}

interface CanvasLaunchResult {
  windowId: string;
  analysis: ContentAnalysis;
}

export function IntelligentCanvas({ className = '' }: IntelligentCanvasProps) {
  const {
    windows,
    activeWindowId,
    createWindow,
    closeWindow,
    setActiveWindow,
    updateWindowPosition,
    updateWindowSize,
    dockWindow,
    minimizeWindow,
    createAgent,
    isCanvasEnabled
  } = useCanvasStore();

  const [isLaunching, setIsLaunching] = useState(false);

  // Auto-create agents based on content analysis
  const createSuggestedAgents = useCallback((windowId: string, analysis: ContentAnalysis) => {
    const canvasWindow = windows.find(w => w.id === windowId);
    if (!canvasWindow) return;

    // Create agents based on suggestions
    analysis.suggestedAgents.forEach(specialization => {
      createAgent(canvasWindow.document.id, specialization);
    });

    toast.success(`Created ${analysis.suggestedAgents.length} AI agents for your ${analysis.contentType} document`);
  }, [windows, createAgent]);

  // Launch canvas from chat input analysis
  const launchCanvasFromAnalysis = useCallback(async (
    userInput: string, 
    context: ChatContext
  ): Promise<CanvasLaunchResult | null> => {
    if (!isCanvasEnabled) return null;

    setIsLaunching(true);
    
    try {
      const analysis = await contentDetectionService.analyzeUserInput(userInput, context);
      
      if (!analysis.shouldOpenCanvas || analysis.confidence < 0.7) {
        setIsLaunching(false);
        return null;
      }

      // Create canvas window with initial content
      const windowId = createWindow(analysis.contentType, userInput);
      
      // Create suggested AI agents after a brief delay
      setTimeout(() => {
        createSuggestedAgents(windowId, analysis);
      }, 1000);

      toast.success(`Canvas opened for ${analysis.contentType} document`);
      
      setIsLaunching(false);
      return { windowId, analysis };
    } catch (error) {
      console.error('Failed to launch canvas:', error);
      toast.error('Failed to launch canvas');
      setIsLaunching(false);
      return null;
    }
  }, [isCanvasEnabled, createWindow, createSuggestedAgents]);

  // Manual canvas launch with content type selection
  const launchCanvas = useCallback((contentType: ContentType, title?: string) => {
    const windowId = createWindow(contentType, title);
    setActiveWindow(windowId);
    
    // Get default agents for content type
    const defaultAgents = getDefaultAgentsForContentType(contentType);
    const canvasWindow = windows.find(w => w.id === windowId);
    
    if (canvasWindow) {
      setTimeout(() => {
        defaultAgents.forEach(specialization => {
          createAgent(canvasWindow.document.id, specialization);
        });
      }, 500);
    }

    return windowId;
  }, [createWindow, setActiveWindow, windows, createAgent]);

  const getDefaultAgentsForContentType = (contentType: ContentType): AgentSpecialization[] => {
    const agentMap: Record<ContentType, AgentSpecialization[]> = {
      'legal_contract': ['legal_review', 'writing', 'compliance'],
      'business_plan': ['research', 'writing', 'financial_analysis'],
      'academic_paper': ['research', 'writing', 'citation'],
      'formal_letter': ['writing', 'formatting'],
      'technical_report': ['research', 'writing', 'fact_check'],
      'presentation': ['writing', 'formatting'],
      'email_template': ['writing'],
      'petition': ['legal_review', 'writing', 'citation'],
      'legal_brief': ['legal_review', 'writing', 'citation'],
      'research': ['research', 'fact_check', 'citation'],
      'contract_review': ['legal_review', 'compliance'],
      'case_timeline': ['research', 'fact_check'],
      'custom_document': ['writing']
    };
    
    return agentMap[contentType] || ['writing'];
  };

  const handleWindowClose = (windowId: string) => {
    closeWindow(windowId);
    toast.info('Canvas window closed');
  };

  const handleWindowDock = (windowId: string, isDocked: boolean) => {
    dockWindow(windowId, isDocked);
    toast.info(isDocked ? 'Window docked' : 'Window undocked');
  };

  const handleWindowMinimize = (windowId: string, isMinimized: boolean) => {
    minimizeWindow(windowId, isMinimized);
  };

  const renderWindow = (canvasWindow: CanvasWindow) => {
    const isActive = activeWindowId === canvasWindow.id;
    const { position, size, isDocked, isMinimized } = canvasWindow;

    if (isMinimized) {
      return (
        <div
          key={`${canvasWindow.id}-minimized`}
          className="fixed bottom-4 left-4 z-50"
        >
          <Card className="w-64 shadow-lg border-2 border-blue-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <CardTitle className="text-sm">{canvasWindow.document.title}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleWindowMinimize(canvasWindow.id, false)}
                    className="h-6 w-6 p-0"
                  >
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleWindowClose(canvasWindow.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-600">
                {canvasWindow.agents.length} AI agents • {canvasWindow.document.metadata.wordCount} words
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div
        key={canvasWindow.id}
        className={`fixed bg-white border rounded-lg shadow-xl ${
          isActive ? 'ring-2 ring-blue-500 z-50' : 'z-40'
        } ${isDocked ? 'right-0 top-0 h-full' : ''}`}
        style={{
          left: isDocked ? 'auto' : position.x,
          top: isDocked ? 0 : position.y,
          width: isDocked ? '50vw' : size.width,
          height: isDocked ? '100vh' : size.height,
          zIndex: canvasWindow.zIndex
        }}
        onClick={() => setActiveWindow(canvasWindow.id)}
      >
        {/* Window Header */}
        <div className="flex items-center justify-between p-3 border-b bg-gray-50 rounded-t-lg">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-sm">{canvasWindow.document.title}</span>
            <Badge variant="outline" className="text-xs">
              {canvasWindow.contentType.replace('_', ' ')}
            </Badge>
            {canvasWindow.agents.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                {canvasWindow.agents.length} agents
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleWindowDock(canvasWindow.id, !isDocked)}
              className="h-6 w-6 p-0"
            >
              {isDocked ? <PinOffIcon className="h-3 w-3" /> : <PinIcon className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleWindowMinimize(canvasWindow.id, true)}
              className="h-6 w-6 p-0"
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleWindowClose(canvasWindow.id)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Window Content */}
        <div className="flex h-full">
          {/* Main Canvas Area */}
          <div className="flex-1 flex flex-col">
            <ProjectCanvas 
              projectId={canvasWindow.document.id}
              isReadOnly={false}
            />
          </div>

          {/* AI Agents Sidebar */}
          <div className="w-80 border-l bg-gray-50">
            <AgentCoordinator 
              documentId={canvasWindow.document.id}
              className="h-full"
            />
          </div>
        </div>
      </div>
    );
  };

  // Expose launch function globally for chat integration
  useEffect(() => {
    // Attach to global window object for chat integration
    (window as any).launchIntelligentCanvas = launchCanvasFromAnalysis;
    (window as any).launchCanvas = launchCanvas;
    
    return () => {
      delete (window as any).launchIntelligentCanvas;
      delete (window as any).launchCanvas;
    };
  }, [launchCanvasFromAnalysis, launchCanvas]);

  if (!isCanvasEnabled) {
    return (
      <div className={`fixed top-4 left-4 z-50 pointer-events-auto ${className}`}>
        <Card className="shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">Canvas Disabled</span>
              <Badge variant="secondary" className="text-xs">
                Enable in chat controls
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (windows.length === 0) {
    return (
      <div className={`fixed top-4 left-4 z-50 pointer-events-auto ${className}`}>
        <Card className="shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-gray-700">Canvas Ready</span>
              <Badge variant="outline" className="text-xs">
                Try "Create a legal contract"
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 pointer-events-none ${className}`}>
      {/* Render all canvas windows */}
      <div className="pointer-events-auto">
        {windows.map(renderWindow)}
      </div>

      {/* Canvas Status Indicator */}
      {windows.length > 0 && (
        <div className="fixed top-4 right-4 z-50 pointer-events-auto">
          <Card className="shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">{windows.length} Canvas Window{windows.length > 1 ? 's' : ''}</span>
                <Badge variant="secondary" className="text-xs">
                  {windows.reduce((total, w) => total + w.agents.length, 0)} AI Agents
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading Indicator */}
      {isLaunching && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 pointer-events-auto">
          <Card className="w-96">
            <CardContent className="p-6 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="font-medium mb-2">Launching Intelligent Canvas</h3>
              <p className="text-sm text-gray-600">Analyzing your request and setting up AI agents...</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Export helper functions for external use
export { IntelligentCanvas as default };

// Helper function to check if text should trigger canvas
export const shouldLaunchCanvas = (text: string): boolean => {
  return contentDetectionService.shouldLaunchCanvas(text);
};

// Helper function for manual content analysis
export const analyzeForCanvas = async (text: string, context: ChatContext): Promise<ContentAnalysis> => {
  return contentDetectionService.analyzeUserInput(text, context);
}; 