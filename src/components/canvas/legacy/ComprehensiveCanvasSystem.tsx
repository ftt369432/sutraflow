import React, { useState, useCallback, useEffect } from 'react';
import { 
  Palette, 
  FileText, 
  Plus, 
  Settings, 
  Maximize2, 
  Grid3X3, 
  Layout,
  Save,
  Download,
  Share2,
  Users,
  Cloud,
  Undo2,
  Redo2,
  History,
  X,
  Badge,
  Brain,
  Sparkles
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge as UIBadge } from '../ui/Badge';
import { useCanvasStore } from '../../stores/canvasStore';
import { useCanvasTemplates } from '../../hooks/canvas/useCanvasTemplates';
import { CanvasDemo } from './CanvasDemo';
import { CanvasDocumentBrowser } from './CanvasDocumentBrowser';
import DocumentEditorLayout from './DocumentEditorLayout';
import { TemplateManager } from '../template/TemplateManager';
import { MultiWindowCanvasControl } from './MultiWindowCanvasControl';
import EnhancedTabSystem from './EnhancedTabSystem';
import { AdvancedCanvasEditor } from './AdvancedCanvasEditor';
import { DocumentHistoryPanel } from './DocumentHistoryPanel';
import { TaskProgressPanel } from './TaskProgressPanel';
import { useCanvasTasks } from '../../hooks/canvas/useCanvasTasks';

interface ComprehensiveCanvasSystemProps {
  isEmbedded?: boolean;
  initialCanvases?: any[];
  onCanvasChange?: (canvases: any[]) => void;
  selectedAssistant?: any;
  neuralSettings?: any;
}

interface Canvas {
  id: string;
  title: string;
  content: string;
  type: 'blank' | 'legal' | 'business' | 'medical' | 'creative' | string;
  created: Date;
  modified: Date;
  aiDriveFileId?: string;
  metadata?: any;
}

export const ComprehensiveCanvasSystem: React.FC<ComprehensiveCanvasSystemProps> = ({
  isEmbedded = false,
  initialCanvases = [],
  onCanvasChange,
  selectedAssistant,
  neuralSettings
}) => {
  // Canvas Store Integration
  const { 
    windows: canvasWindows,
    createWindow,
    updateDocumentContent,
    isCanvasEnabled,
    toggleCanvasEnabled
  } = useCanvasStore();

  // Local Canvas State
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [activeCanvasId, setActiveCanvasId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'single' | 'multi' | 'grid'>('single');
  const [showTemplateSelector, setShowTemplateSelector] = useState(true);
  const [showAIDriveBrowser, setShowAIDriveBrowser] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);

  // Sync with external canvas updates (for AI surgical edits)
  useEffect(() => {
    if (initialCanvases && initialCanvases.length > 0) {
      const transformedCanvases = initialCanvases.map(canvas => ({
        id: canvas.id,
        title: canvas.title,
        content: canvas.content,
        type: canvas.contentType || 'document',
        created: new Date(canvas.lastModified || Date.now()),
        modified: new Date(canvas.lastModified || Date.now()),
        aiDriveFileId: canvas.aiDriveFileId,
        metadata: {
          assistant: selectedAssistant?.name,
          wordCount: canvas.content?.split(' ').filter(w => w.trim()).length || 0,
          version: 1
        }
      }));
      
      setCanvases(transformedCanvases);
      if (transformedCanvases.length > 0 && !activeCanvasId) {
        setActiveCanvasId(transformedCanvases[0].id);
        setShowTemplateSelector(false);
      } else if (transformedCanvases.length === 0) {
        setShowTemplateSelector(true);
      }
      
      console.log('🔄 Canvas sync: Updated with', transformedCanvases.length, 'external canvases');
    }
  }, [initialCanvases, selectedAssistant, activeCanvasId]);

  // Template System Integration
  const {
    templates,
    createFromTemplate,
    getTemplatesByCategory,
    isLoading: templatesLoading
  } = useCanvasTemplates();

  // Task System Integration
  const {
    tasks,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    getTasksForDocument,
    extractTasksFromContent,
    loading: tasksLoading,
    error: tasksError
  } = useCanvasTasks();

  // Task Panel State
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [documentTasks, setDocumentTasks] = useState<any[]>([]);

  // Update document tasks when active canvas changes
  useEffect(() => {
    if (activeCanvasId) {
      const canvasTasks = getTasksForDocument(activeCanvasId);
      setDocumentTasks(canvasTasks);
    }
  }, [activeCanvasId, tasks, getTasksForDocument]);

  // Extract tasks from canvas content when content changes
  useEffect(() => {
    if (activeCanvas?.content) {
      const extractedTasks = extractTasksFromContent(activeCanvas.content);
      if (extractedTasks.length > 0) {
        console.log('📋 TASKS DETECTED:', extractedTasks.length, 'tasks in', activeCanvas.title);
      }
    }
  }, [activeCanvas?.content, extractTasksFromContent]);

  // History State
  const [historyState, setHistoryState] = useState({
    hasUndo: false,
    hasRedo: false,
    versionCount: 0
  });
  
  // Canvas History Management
  const [canvasHistory, setCanvasHistory] = useState<Map<string, {
    past: Array<{title: string, content: string, timestamp: Date}>;
    present?: {title: string, content: string, timestamp: Date};
    future: Array<{title: string, content: string, timestamp: Date}>;
  }>>(new Map());

  // Active Canvas Helper
  const activeCanvas = canvases.find(c => c.id === activeCanvasId);

  // Create New Canvas
  const handleCreateCanvas = useCallback((type: string = 'blank') => {
    const timestamp = new Date();
    const canvasId = `canvas-${Date.now()}`;
    
    const typeNames: Record<string, string> = {
      'blank': 'Blank Document',
      'legal': 'Legal Document',
      'business': 'Business Document',
      'creative': 'Creative Document',
      'medical': 'Medical Document',
      'technical': 'Technical Document'
    };

    const newCanvas: Canvas = {
      id: canvasId,
      title: `${typeNames[type] || 'Document'} ${canvases.length + 1}`,
      content: '',
      type,
      created: timestamp,
      modified: timestamp,
      metadata: {
        assistant: selectedAssistant?.name,
        wordCount: 0,
        version: 1,
        neuralSettings: neuralSettings?.preset
      }
    };

    setCanvases(prev => [...prev, newCanvas]);
    setActiveCanvasId(canvasId);
    setShowTemplateSelector(false);

    // Create corresponding window in canvas store
    createWindow(type as any, '');

    if (onCanvasChange) {
      onCanvasChange([...canvases, newCanvas]);
    }

    console.log(`🎨 Created new canvas: ${newCanvas.title}`);
    return canvasId;
  }, [canvases, selectedAssistant, neuralSettings, createWindow, onCanvasChange]);

  // Create Canvas from Template
  const handleCreateFromTemplate = useCallback((templateId: string) => {
    const windowId = createFromTemplate(templateId);
    if (windowId) {
      setShowTemplateSelector(false);
      console.log(`📋 Created canvas from template: ${templateId}`);
    }
  }, [createFromTemplate]);

  // Close Canvas
  const handleCloseCanvas = useCallback((canvasId: string) => {
    setCanvases(prev => prev.filter(c => c.id !== canvasId));
    
    if (activeCanvasId === canvasId) {
      const remaining = canvases.filter(c => c.id !== canvasId);
      setActiveCanvasId(remaining.length > 0 ? remaining[0].id : null);
      if (remaining.length === 0) {
        setShowTemplateSelector(true);
      }
    }

    if (onCanvasChange) {
      const updatedCanvases = canvases.filter(c => c.id !== canvasId);
      onCanvasChange(updatedCanvases);
    }
  }, [canvases, activeCanvasId, onCanvasChange]);

  // Update Canvas Content
  const handleContentChange = useCallback((canvasId: string, content: string) => {
    // Create the updated canvases first
    const updatedCanvases = canvases.map(canvas => 
      canvas.id === canvasId 
        ? { 
            ...canvas, 
            content, 
            modified: new Date(),
            metadata: {
              ...canvas.metadata,
              wordCount: content.split(' ').filter(w => w.trim()).length
            }
          }
        : canvas
    );

    // Update local state
    setCanvases(updatedCanvases);

    // Update store
    updateDocumentContent(canvasId, content);

    // 🔧 FIX: Use the updated canvases for parent synchronization
    if (onCanvasChange) {
      onCanvasChange(updatedCanvases);
    }
  }, [canvases, updateDocumentContent, onCanvasChange]);

  // Save canvas state to history
  const saveCanvasToHistory = useCallback((canvasId: string, title: string, content: string) => {
    setCanvasHistory(prev => {
      const current = prev.get(canvasId) || { past: [], future: [] };
      
      // If there's a present state, move it to past
      const newPast = current.present 
        ? [...current.past, current.present]
        : current.past;
      
      // Limit history to last 20 states to prevent memory issues
      const limitedPast = newPast.slice(-20);
      
      const newHistory = {
        past: limitedPast,
        present: { title, content, timestamp: new Date() },
        future: [] // Clear future when new change is made
      };
      
      const newMap = new Map(prev);
      newMap.set(canvasId, newHistory);
      return newMap;
    });
    
    // Update history state for active canvas
    if (canvasId === activeCanvasId) {
      const currentHistory = canvasHistory.get(canvasId);
      setHistoryState({
        hasUndo: currentHistory ? currentHistory.past.length > 0 : false,
        hasRedo: false, // Future is cleared when new change is made
        versionCount: (currentHistory?.past.length || 0) + 1
      });
    }
  }, [activeCanvasId, canvasHistory]);

  // Update Canvas Title
  const handleTitleChange = useCallback((canvasId: string, title: string) => {
    const canvas = canvases.find(c => c.id === canvasId);
    if (canvas) {
      // Save current state to history before changing
      saveCanvasToHistory(canvasId, canvas.title, canvas.content);
      
      const updatedCanvases = canvases.map(canvas => 
        canvas.id === canvasId 
          ? { ...canvas, title, modified: new Date() }
          : canvas
      );
      
      setCanvases(updatedCanvases);
      
      // 🔧 FIX: Sync title changes with parent component (AIAssistantPage)
      if (onCanvasChange) {
        onCanvasChange(updatedCanvases);
      }
      
      console.log('📝 TITLE UPDATED:', { canvasId, title, updated: true });
    }
  }, [canvases, saveCanvasToHistory, onCanvasChange]);

  // Switch View Mode
  const handleViewModeChange = useCallback((mode: 'single' | 'multi' | 'grid') => {
    setViewMode(mode);
    console.log(`🎛️ Switched to ${mode} view mode`);
  }, []);

  // AI Drive Integration
  const handleAIDriveFileSelect = useCallback((document: any) => {
    const canvasId = handleCreateCanvas(document.type || 'blank');
    handleContentChange(canvasId, document.content || '');
    handleTitleChange(canvasId, document.title || 'AI Drive Document');
    setShowAIDriveBrowser(false);
  }, [handleCreateCanvas, handleContentChange, handleTitleChange]);

  // Save to AI Drive
  const handleSaveToAIDrive = useCallback(async () => {
    if (!activeCanvas) return;
    
    try {
      // Simulate AI Drive save
      const aiDriveFileId = `ai-drive-${Date.now()}`;
      
      setCanvases(prev => prev.map(canvas => 
        canvas.id === activeCanvas.id 
          ? { ...canvas, aiDriveFileId, modified: new Date() }
          : canvas
      ));

      console.log(`💾 Saved ${activeCanvas.title} to AI Drive`);
    } catch (error) {
      console.error('Failed to save to AI Drive:', error);
    }
  }, [activeCanvas]);

  // Undo/Redo Handlers
  const handleUndo = useCallback(() => {
    if (!activeCanvasId) return;
    
    setCanvasHistory(prev => {
      const current = prev.get(activeCanvasId);
      if (!current || current.past.length === 0) return prev;
      
      const previousState = current.past[current.past.length - 1];
      const newPast = current.past.slice(0, -1);
      const newFuture = current.present 
        ? [current.present, ...current.future]
        : current.future;
      
      const newHistory = {
        past: newPast,
        present: previousState,
        future: newFuture
      };
      
      // Update canvas with previous state
      const updatedCanvases = canvases.map(canvas => 
        canvas.id === activeCanvasId 
          ? { ...canvas, title: previousState.title, content: previousState.content, modified: new Date() }
          : canvas
      );
      setCanvases(updatedCanvases);
      onCanvasChange?.(updatedCanvases);
      
      // Update history state
      setHistoryState({
        hasUndo: newPast.length > 0,
        hasRedo: newFuture.length > 0,
        versionCount: newPast.length + 1
      });
      
      const newMap = new Map(prev);
      newMap.set(activeCanvasId, newHistory);
      return newMap;
    });
    
    console.log('↶ Undo triggered');
  }, [activeCanvasId, canvases, setCanvases, onCanvasChange]);

  const handleRedo = useCallback(() => {
    if (!activeCanvasId) return;
    
    setCanvasHistory(prev => {
      const current = prev.get(activeCanvasId);
      if (!current || current.future.length === 0) return prev;
      
      const nextState = current.future[0];
      const newPast = current.present 
        ? [...current.past, current.present]
        : current.past;
      const newFuture = current.future.slice(1);
      
      const newHistory = {
        past: newPast,
        present: nextState,
        future: newFuture
      };
      
      // Update canvas with next state
      const updatedCanvases = canvases.map(canvas => 
        canvas.id === activeCanvasId 
          ? { ...canvas, title: nextState.title, content: nextState.content, modified: new Date() }
          : canvas
      );
      setCanvases(updatedCanvases);
      onCanvasChange?.(updatedCanvases);
      
      // Update history state
      setHistoryState({
        hasUndo: newPast.length > 0,
        hasRedo: newFuture.length > 0,
        versionCount: newPast.length + 1
      });
      
      const newMap = new Map(prev);
      newMap.set(activeCanvasId, newHistory);
      return newMap;
    });
    
    console.log('↷ Redo triggered');
  }, [activeCanvasId, canvases, setCanvases, onCanvasChange]);

  // History Restore
  const handleHistoryRestore = useCallback((content: string) => {
    if (activeCanvas) {
      handleContentChange(activeCanvas.id, content);
      setShowHistoryPanel(false);
    }
  }, [activeCanvas, handleContentChange]);

  // Show templates when no canvases exist
  useEffect(() => {
    if (canvases.length === 0) {
      setShowTemplateSelector(true);
    }
  }, [canvases.length]);

  // Template Categories
  const templateCategories = [
    { id: 'legal', name: 'Legal Documents', icon: '⚖️', count: templates.filter(t => t.category === 'Legal').length },
    { id: 'business', name: 'Business Documents', icon: '💼', count: templates.filter(t => t.category === 'Business').length },
    { id: 'medical', name: 'Medical Documents', icon: '🏥', count: templates.filter(t => t.category === 'Medical').length },
    { id: 'creative', name: 'Creative Documents', icon: '🎨', count: templates.filter(t => t.category === 'Creative').length },
    { id: 'technical', name: 'Technical Documents', icon: '🔧', count: templates.filter(t => t.category === 'Technical').length }
  ];

  // Render Template Selector
  const renderTemplateSelector = () => (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Choose Your Document</h2>
          </div>
          <div className="flex items-center space-x-2">
            <UIBadge variant="secondary" className="bg-blue-100 text-blue-800">
              {templates.length} Templates Available
            </UIBadge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAIDriveBrowser(true)}
              className="flex items-center space-x-1"
            >
              <Cloud className="w-4 h-4" />
              <span>AI Drive</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Template Grid */}
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Quick Start - Blank Document */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Start</h3>
            <Button
              onClick={() => handleCreateCanvas('blank')}
              className="w-full max-w-md bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-3"
            >
              <Plus className="w-5 h-5" />
              <span className="text-lg">Start with Blank Document</span>
            </Button>
          </div>

          {/* Template Categories */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Professional Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templateCategories.map((category) => (
                <Card 
                  key={category.id}
                  className="hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
                  onClick={() => handleCreateCanvas(category.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">{category.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {category.name}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {category.count} template{category.count !== 1 ? 's' : ''} available
                        </p>
                      </div>
                      <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Templates */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recently Used</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.slice(0, 4).map((template) => (
                <Card 
                  key={template.id}
                  className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  onClick={() => handleCreateFromTemplate(template.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900">{template.name}</h5>
                        <p className="text-sm text-gray-500 mt-1">{template.category}</p>
                      </div>
                      <FileText className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Multi-Canvas Grid
  const renderMultiCanvasGrid = () => (
    <div className="flex-1 grid grid-cols-2 gap-4 p-4">
      {canvases.map((canvas) => (
        <Card key={canvas.id} className={`h-96 ${canvas.id === activeCanvasId ? 'ring-2 ring-blue-500' : ''}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium truncate">{canvas.title}</CardTitle>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveCanvasId(canvas.id)}
                  className="h-6 w-6 p-0"
                >
                  <Maximize2 className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCloseCanvas(canvas.id)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-72 bg-gray-50 rounded border overflow-hidden">
              <div className="p-3 text-sm text-gray-600 h-full overflow-auto">
                {canvas.content || 'Start typing...'}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Main Render
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Always Visible Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        {/* Left - Document Controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={!historyState.hasUndo}
            className="flex items-center space-x-1 hover:bg-blue-100"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
            <span className="hidden sm:inline">Undo</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRedo}
            disabled={!historyState.hasRedo}
            className="flex items-center space-x-1 hover:bg-blue-100"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
            <span className="hidden sm:inline">Redo</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistoryPanel(!showHistoryPanel)}
            className="flex items-center space-x-1 hover:bg-blue-100"
            title="Version History"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTaskPanel(!showTaskPanel)}
            className={`flex items-center space-x-1 hover:bg-blue-100 ${showTaskPanel ? 'bg-blue-100 text-blue-700' : ''}`}
            title="Task Panel"
          >
            <Badge className="w-4 h-4" />
            <span className="hidden sm:inline">Tasks</span>
            {documentTasks.length > 0 && (
              <UIBadge variant="secondary" className="ml-1 bg-green-100 text-green-800 text-xs px-1 py-0 min-w-[16px] h-4">
                {documentTasks.length}
              </UIBadge>
            )}
          </Button>
        </div>

        {/* Center - Canvas Info */}
        <div className="flex items-center space-x-3">
          <UIBadge variant="secondary" className="bg-blue-100 text-blue-800">
            {canvases.length} Document{canvases.length !== 1 ? 's' : ''}
          </UIBadge>
          {activeCanvas && (
            <div className="text-sm text-gray-600 hidden md:block">
              {activeCanvas.title} • {activeCanvas.metadata?.wordCount || 0} words
            </div>
          )}
          {selectedAssistant && (
            <UIBadge variant="outline" className="flex items-center space-x-1">
              <Brain className="w-3 h-3" />
              <span className="text-xs">{selectedAssistant.name}</span>
            </UIBadge>
          )}
        </div>

        {/* Right - View Controls */}
        <div className="flex items-center space-x-2">
          {/* View Mode Selector */}
          <div className="flex items-center space-x-1 bg-white rounded-lg border p-1">
            <Button
              variant={viewMode === 'single' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('single')}
              className="h-7 px-2"
            >
              <FileText className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'multi' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('multi')}
              className="h-7 px-2"
            >
              <Layout className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('grid')}
              className="h-7 px-2"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
          </div>

          {/* Action Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTemplateSelector(!showTemplateSelector)}
            className={`flex items-center space-x-1 ${showTemplateSelector ? 'bg-purple-100' : 'hover:bg-purple-100'}`}
            title="Browse Templates"
          >
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Templates</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAIDriveBrowser(!showAIDriveBrowser)}
            className={`flex items-center space-x-1 ${showAIDriveBrowser ? 'bg-blue-100' : 'hover:bg-blue-100'}`}
          >
            <Cloud className="w-4 h-4" />
            <span className="hidden sm:inline">AI Drive</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveToAIDrive}
            disabled={!activeCanvas}
            className="flex items-center space-x-1 hover:bg-green-100"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCollaboration(!showCollaboration)}
            className="flex items-center space-x-1 hover:bg-purple-100"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Collaborate</span>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 min-h-0">
        {/* AI Drive Browser Sidebar */}
        {showAIDriveBrowser && (
          <div className="w-80 border-r border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="p-3 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">AI Drive</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAIDriveBrowser(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="p-3">
              <CanvasDocumentBrowser
                onDocumentSelect={handleAIDriveFileSelect}
                onCreateNew={() => handleCreateCanvas('blank')}
                className="h-full"
                assistantInfo={selectedAssistant}
              />
            </div>
          </div>
        )}

        {/* Canvas Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {showTemplateSelector ? (
            renderTemplateSelector()
          ) : (
            <>
              {/* Tab System */}
              {canvases.length > 0 && (
                <EnhancedTabSystem
                  canvases={canvases as any}
                  activeCanvasId={activeCanvasId}
                  onCanvasSelect={setActiveCanvasId}
                  onCanvasClose={handleCloseCanvas}
                  onCanvasCreate={handleCreateCanvas}
                  showTemplateSelector={false}
                />
              )}

              {/* Canvas Content */}
              <div className="flex-1 min-h-0">
                {viewMode === 'grid' ? (
                  renderMultiCanvasGrid()
                ) : activeCanvas ? (
                  <DocumentEditorLayout
                    documentTitle={activeCanvas.title}
                    onTitleChange={(title) => handleTitleChange(activeCanvas.id, title)}
                    documentContent={activeCanvas.content}
                    onContentChange={(content) => handleContentChange(activeCanvas.id, content)}
                    documentType={activeCanvas.type}
                    lastModified={activeCanvas.modified}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    canUndo={historyState.hasUndo}
                    canRedo={historyState.hasRedo}
                    rightPanelContent={
                      showTaskPanel ? (
                        <div className="p-4 h-full">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Tasks & TODOs</h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowTaskPanel(false)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          {/* Task Summary */}
                          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                            <div className="text-sm text-blue-800">
                              Document Tasks: {documentTasks.length}
                            </div>
                            <div className="text-xs text-blue-600">
                              Total Tasks: {tasks.length}
                            </div>
                          </div>

                          {/* Document Tasks */}
                          <div className="space-y-3 mb-4">
                            <h4 className="text-sm font-medium text-gray-700">Current Document</h4>
                            {documentTasks.length > 0 ? (
                              documentTasks.map((task) => (
                                <div key={task.taskId} className="p-2 border rounded bg-white">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="text-sm font-medium">{task.title}</div>
                                      <div className="text-xs text-gray-500">{task.taskType}</div>
                                      {task.dueDate && (
                                        <div className="text-xs text-orange-600">
                                          Due: {task.dueDate.toLocaleDateString()}
                                        </div>
                                      )}
                                    </div>
                                    <UIBadge 
                                      variant={task.status === 'completed' ? 'default' : 'secondary'}
                                      className={task.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                                    >
                                      {task.status}
                                    </UIBadge>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-gray-500 italic">
                                No tasks detected in this document
                              </div>
                            )}
                          </div>

                          {/* Quick Actions */}
                          <div className="border-t pt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs"
                              onClick={() => {
                                if (activeCanvas?.content) {
                                  const extracted = extractTasksFromContent(activeCanvas.content);
                                  console.log('📋 EXTRACTED TASKS:', extracted);
                                }
                              }}
                            >
                              Scan for Tasks
                            </Button>
                          </div>
                        </div>
                      ) : showCollaboration ? (
                        <div className="p-4">
                          <h3 className="font-semibold mb-4">Collaboration</h3>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                                {selectedAssistant?.name?.charAt(0) || 'A'}
                              </div>
                              <div>
                                <div className="text-sm font-medium">{selectedAssistant?.name || 'AI Assistant'}</div>
                                <div className="text-xs text-gray-500">Active collaborator</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null
                    }
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Document Selected</h3>
                      <p className="text-gray-500 mb-4">Create a new document or select an existing one</p>
                      <Button onClick={() => setShowTemplateSelector(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Document
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Collaboration Sidebar */}
        {showCollaboration && !showTemplateSelector && (
          <div className="w-64 border-l border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="p-3 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Team</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCollaboration(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="p-3">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Active Collaborators</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 p-2 bg-white rounded border">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                        {selectedAssistant?.name?.charAt(0) || 'A'}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{selectedAssistant?.name || 'AI Assistant'}</div>
                        <div className="text-xs text-green-600">Active</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Share Document</h4>
                  <Button size="sm" className="w-full">
                    <Share2 className="w-4 h-4 mr-2" />
                    Invite Collaborators
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* History Panel */}
      {showHistoryPanel && activeCanvas && (
        <div className="fixed top-16 right-4 z-50 w-80 max-h-[calc(100vh-5rem)] overflow-hidden">
          <DocumentHistoryPanel
            content={activeCanvas.content}
            title={activeCanvas.title}
            onContentRestore={handleHistoryRestore}
            onSnapshotCreate={(description) => {
              console.log('Creating snapshot:', description);
            }}
            showInSidebar={true}
            className="border border-gray-200 rounded-lg shadow-lg bg-white"
          />
        </div>
      )}
    </div>
  );
};