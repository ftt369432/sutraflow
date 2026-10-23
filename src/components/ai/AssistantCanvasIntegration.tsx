import React, { useState, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import {
  Palette,
  PanelRightOpen,
  PanelRightClose,
  Bot,
  Sparkles,
  FileText,
  Save,
  FolderOpen,
  Share,
  Download,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  X
} from 'lucide-react';
import { TaskAssistantCreator } from './TaskAssistantCreator';
import { IntelligentCanvas } from '../canvas/IntelligentCanvas';
import { useCanvasStore } from '../../stores/canvasStore';
import { AssistantLearningService } from '../../services/AssistantLearningService';
import { toast } from 'sonner';
import { CanvasSaveDialog } from './CanvasSaveDialog';
import { CanvasOpenDialog } from './CanvasOpenDialog';
import { canvasAIDriveService } from '../../services/canvas/CanvasAIDriveService';
// Mock user ID for now - in real app this comes from auth context
const MOCK_USER_ID = 'user-123';

interface TaskAssistant {
  id: string;
  name: string;
  purpose: string;
  capabilities: string[];
  learned_tasks: string[];
  created_at: string;
  updated_at: string;
}

interface AssistantCanvasIntegrationProps {
  className?: string;
}

export function AssistantCanvasIntegration({ className }: AssistantCanvasIntegrationProps) {
  const [activeAssistant, setActiveAssistant] = useState<TaskAssistant | null>(null);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [canvasPosition, setCanvasPosition] = useState<'right' | 'bottom' | 'fullscreen'>('right');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false);



  const {
    windows,
    activeWindowId,
    createWindow,
    isCanvasEnabled,
    toggleCanvasEnabled,
    updateDocument,
    updateDocumentTitle
  } = useCanvasStore();

  const learningService = AssistantLearningService.getInstance();

  // Listen for external open requests
  React.useEffect(() => {
    const handleOpenRequest = (e: CustomEvent<{ content: string, title: string }>) => {
      // 1. Enable Canvas
      if (!useCanvasStore.getState().isCanvasEnabled) {
        toggleCanvasEnabled();
      }

      // 2. Open Panel
      setIsCanvasOpen(true);

      // 3. Create Window with Content
      const windowId = createWindow('custom_document', e.detail.title);

      // 4. Update Window Content immediately
      setTimeout(() => {
        // We need to find the document ID associated with this window
        const store = useCanvasStore.getState();
        const win = store.getWindow(windowId);
        if (win && win.document) {
          store.updateDocument(win.document.id, {
            title: e.detail.title,
            content: e.detail.content,
          });
        }
      }, 100);

      toast.success(`Opened "${e.detail.title}" in Canvas`);
    };

    window.addEventListener('open-canvas-with-content' as any, handleOpenRequest as any);
    return () => window.removeEventListener('open-canvas-with-content' as any, handleOpenRequest as any);
  }, []);

  const handleAssistantCreated = useCallback((assistant: any) => {
    setActiveAssistant(assistant);
    toast.success(`${assistant.name} is ready to help!`);
  }, []);

  const openCanvasForProject = useCallback(async (projectType: string, projectDescription: string) => {
    if (!activeAssistant) {
      toast.error('Please create an assistant first');
      return;
    }

    // Enable canvas if not already enabled
    if (!isCanvasEnabled) {
      toggleCanvasEnabled();
    }

    // Create a new canvas window with context
    const windowId = createWindow('custom_document', `${projectType} - ${activeAssistant.name}`);
    setIsCanvasOpen(true);

    // Learn from this canvas interaction
    await learningService.learnFromInteraction(
      activeAssistant.id,
      `Open canvas for ${projectType}`,
      `Created canvas workspace for ${projectType}: ${projectDescription}`,
      `Canvas collaboration, Project: ${projectType}`
    );

    toast.success(`Canvas opened for ${projectType} with ${activeAssistant.name}`);
  }, [activeAssistant, isCanvasEnabled, toggleCanvasEnabled, createWindow, learningService]);

  const handleSaveToDrive = async (folderId: string | null, filename: string) => {
    if (!activeWindowId) return;
    const activeWindow = windows.find(w => w.id === activeWindowId);
    if (!activeWindow) return;

    try {
      // Update local title first
      if (activeWindow.document) {
        updateDocumentTitle(activeWindow.document.id, filename);
      }

      // Save to backend
      await canvasAIDriveService.saveCanvasToAIDrive(
        MOCK_USER_ID,
        {
          ...activeWindow.document,
          title: filename,
          isActive: true
        },
        folderId || undefined // undefined means root relative to logic usually, or null
      );

      toast.success(`Saved "${filename}" to AI Drive`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to save to AI Drive');
    }
  };

  const handleOpenFromDrive = async (fileId: string, filename: string, content: string) => {
    // 1. Enable Canvas if needed
    if (!useCanvasStore.getState().isCanvasEnabled) {
      useCanvasStore.getState().toggleCanvasEnabled();
    }

    // 2. Open Panel
    setIsCanvasOpen(true);

    // 3. Create Window
    const windowId = createWindow('custom_document', filename);

    // 4. Update Window Content
    setTimeout(() => {
      const store = useCanvasStore.getState();
      const win = store.getWindow(windowId);
      if (win && win.document) {
        store.updateDocument(win.document.id, {
          title: filename,
          content: content
        });
      }
    }, 100);

    toast.success(`Opened "${filename}"`);
  };

  const toggleVoiceMode = useCallback(() => {
    if (!activeAssistant) {
      toast.error('Create an assistant first to enable voice mode');
      return;
    }

    setIsVoiceEnabled(!isVoiceEnabled);

    if (!isVoiceEnabled) {
      toast.success(`Voice mode enabled for ${activeAssistant.name}`);
    } else {
      toast.info('Voice mode disabled');
      setIsListening(false);
    }
  }, [isVoiceEnabled, activeAssistant]);

  const toggleListening = useCallback(async () => {
    if (!isVoiceEnabled || !activeAssistant) return;

    setIsListening(!isListening);

    if (!isListening) {
      toast.info('Listening... Speak your command');
      // Here would integrate with Web Speech API or voice service

      // Simulate voice command processing
      setTimeout(async () => {
        const simulatedVoiceCommand = "Open canvas for business plan";
        await learningService.learnFromInteraction(
          activeAssistant.id,
          simulatedVoiceCommand,
          'Voice command processed successfully',
          'Voice interaction, Canvas control'
        );
        setIsListening(false);
        toast.success('Voice command processed');
      }, 2000);
    } else {
      toast.info('Stopped listening');
    }
  }, [isListening, isVoiceEnabled, activeAssistant, learningService]);

  const getCanvasLayoutClass = () => {
    switch (canvasPosition) {
      case 'right':
        return 'flex-row';
      case 'bottom':
        return 'flex-col';
      case 'fullscreen':
        return 'fixed inset-0 z-50';
      default:
        return 'flex-row';
    }
  };

  const getAssistantLayoutClass = () => {
    if (canvasPosition === 'fullscreen') return 'hidden';

    switch (canvasPosition) {
      case 'right':
        return 'w-1/2';
      case 'bottom':
        return 'h-1/2';
      default:
        return 'w-1/2';
    }
  };

  const getCanvasLayoutClass2 = () => {
    if (canvasPosition === 'fullscreen') return 'w-full h-full';

    switch (canvasPosition) {
      case 'right':
        return 'w-1/2';
      case 'bottom':
        return 'h-1/2';
      default:
        return 'w-1/2';
    }
  };

  return (
    <div className={`h-full bg-background_color flex flex-col ${className}`}>
      {/* Header Controls */}
      <div className="p-4 border-b border-border_color bg-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary_color" />
            <h2 className="text-lg font-semibold">AI Assistant + Canvas Workspace</h2>
            {activeAssistant && (
              <Badge variant="default" className="ml-2">
                {activeAssistant.name}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Voice Controls */}
            <Button
              variant={isVoiceEnabled ? "default" : "outline"}
              size="sm"
              onClick={toggleVoiceMode}
              className="flex items-center gap-1"
            >
              {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              Voice
            </Button>

            {isVoiceEnabled && (
              <Button
                variant={isListening ? "destructive" : "outline"}
                size="sm"
                onClick={toggleListening}
                className="flex items-center gap-1"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isListening ? 'Stop' : 'Listen'}
              </Button>
            )}

            {/* Canvas Controls */}
            {activeAssistant && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openCanvasForProject('Business Plan', 'Strategic planning document')}
                  className="flex items-center gap-1"
                >
                  <FileText className="w-4 h-4" />
                  New Project
                </Button>

                <Button
                  variant={isCanvasOpen ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsCanvasOpen(!isCanvasOpen)}
                  className="flex items-center gap-1"
                >
                  {isCanvasOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                  Canvas
                </Button>
              </>
            )}

            {/* Save to AI Drive */}
            {isCanvasOpen && activeWindowId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSaveDialogOpen(true)}
                className="flex items-center gap-1"
              >
                <Save className="w-4 h-4" />
                Save
              </Button>
            )}

            {/* Open from AI Drive */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpenDialogOpen(true)}
              className="flex items-center gap-1"
            >
              <FolderOpen className="w-4 h-4" />
              Open
            </Button>

            {/* Canvas Position Controls */}
            {isCanvasOpen && (
              <div className="flex gap-2">
                <Button
                  variant={canvasPosition === 'right' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCanvasPosition('right')}
                >
                  Side Panel
                </Button>
                <Button
                  variant={canvasPosition === 'bottom' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCanvasPosition('bottom')}
                >
                  Bottom Panel
                </Button>
                <Button
                  variant={canvasPosition === 'fullscreen' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCanvasPosition('fullscreen')}
                >
                  Fullscreen
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex overflow-hidden ${getCanvasLayoutClass()}`}>
        {/* Assistant Creator */}
        <div className={`${getAssistantLayoutClass()} overflow-y-auto`}>
          <TaskAssistantCreator onAssistantCreated={handleAssistantCreated} />
        </div>

        {/* Canvas Panel */}
        {isCanvasOpen && (
          <div className={`border-l border-border_color ${getCanvasLayoutClass2()}`}>
            <div className="h-full flex flex-col">
              {/* Canvas Header */}
              <div className="p-3 border-b border-border_color bg-accent/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary_color" />
                    <span className="text-sm font-medium">AI Canvas</span>
                    {activeAssistant && (
                      <Badge variant="outline" className="text-xs">
                        Collaborating with {activeAssistant.name}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCanvasOpen(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Canvas Content */}
              <div className="flex-1 overflow-hidden">
                <IntelligentCanvas className="h-full" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Project Info Footer */}
      {activeAssistant && windows.length > 0 && (
        <div className="p-3 border-t border-border_color bg-muted/30">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary_color" />
              <span>
                {windows.length} active project{windows.length !== 1 ? 's' : ''} • {activeAssistant.name} learning from collaboration
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                💾 Auto-saves to AI Drive
              </span>
              {isVoiceEnabled && (
                <span className="text-primary_color">
                  🎤 Voice commands active
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save Dialog */}
      <CanvasSaveDialog
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        onSave={handleSaveToDrive}
        initialFilename={activeWindowId && windows.find(w => w.id === activeWindowId)?.document?.title || "Untitled"}
        userId={MOCK_USER_ID}
      />

      {/* Open Dialog */}
      <CanvasOpenDialog
        isOpen={isOpenDialogOpen}
        onClose={() => setIsOpenDialogOpen(false)}
        onOpen={handleOpenFromDrive}
        userId={MOCK_USER_ID}
      />
    </div>
  );
}

