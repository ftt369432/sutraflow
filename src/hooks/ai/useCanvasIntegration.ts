import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

/**
 * 🎨 Canvas Integration Hook - Master/Slave Architecture
 * 
 * Canvas operates as a "slave" to the AI Chat (master):
 * - AI Chat generates all content
 * - Canvas displays and allows editing of AI-generated content
 * - No autonomous Canvas generation
 * - Content flows: AI Chat → Canvas
 */

export interface CanvasState {
  // Canvas display state
  showCanvas: boolean;
  sideBySideMode: boolean;
  canvasContent: string;
  selectedContentType: string;
  canvasUpdating: boolean;
  
  // Canvas management
  canvases: CanvasDocument[];
  activeCanvasId: string | null;
  
  // Actions
  routeToCanvas: (content: string, contentType?: string) => void;
  updateCanvasContent: (content: string) => void;
  toggleCanvas: () => void;
  toggleSideBySideMode: () => void;
  createNewCanvas: (title: string, content: string, type: string) => void;
  selectCanvas: (id: string) => void;
  deleteCanvas: (id: string) => void;
  exportCanvas: (id: string) => void;
  setCanvasTitle: (id: string, title: string) => void;

  // Compatibility aliases
  sendToCanvas: (content: string, options?: any) => void;
  appendToCanvas: (content: string, options?: any) => void;
  createCanvasDocument: (content: string, title: string, userRequest?: string, taskId?: string, type?: string) => void;
  handleCanvasChange: (content: string) => void;
}

export interface CanvasDocument {
  id: string;
  title: string;
  content: string;
  contentType: string;
  createdAt: string;
  updatedAt: string;
  aiGenerated: boolean;
  metadata?: {
    originalPrompt?: string;
    assistantUsed?: string;
    complexity?: 'simple' | 'medium' | 'complex';
    estimatedReadTime?: number;
  };
}

export interface CanvasIntegrationOptions {
  user?: any;
  selectedAssistant?: any;
  currentPromptTier?: any;
  showCanvasPanel?: boolean;
  setShowCanvasPanel?: (show: boolean) => void;
  currentCanvases?: any[];
  setCurrentCanvases?: (canvases: any[]) => void;
  activeCanvasId?: string | null;
  setActiveCanvasId?: (id: string | null) => void;
  pendingCanvasAction?: any;
  setPendingCanvasAction?: (action: any) => void;
}

export function useCanvasIntegration(options?: CanvasIntegrationOptions): CanvasState {
  // Local state fallbacks if options are not passed
  const [localShowCanvas, localSetShowCanvas] = useState(false);
  const [sideBySideMode, setSideBySideMode] = useState(false);
  const [canvasContent, setCanvasContent] = useState<string>('');
  const [selectedContentType, setSelectedContentType] = useState<string>('document');
  const [canvasUpdating, setCanvasUpdating] = useState(false);
  const [localCanvases, localSetCanvases] = useState<CanvasDocument[]>([]);
  const [localActiveCanvasId, localSetActiveCanvasId] = useState<string | null>(null);

  // Determine state getters and setters (options vs local state)
  const showCanvas = options?.showCanvasPanel !== undefined ? options.showCanvasPanel : localShowCanvas;
  const setShowCanvas = options?.setShowCanvasPanel || localSetShowCanvas;
  
  const canvases = options?.currentCanvases !== undefined ? options.currentCanvases : localCanvases;
  const setCanvases = options?.setCurrentCanvases || localSetCanvases;
  
  const activeCanvasId = options?.activeCanvasId !== undefined ? options.activeCanvasId : localActiveCanvasId;
  const setActiveCanvasId = options?.setActiveCanvasId || localSetActiveCanvasId;

  // Load canvases from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ai-canvases');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCanvases(parsed);
      } catch (error) {
        console.error('Error loading canvases:', error);
      }
    }
  }, [setCanvases]);
  
  // Save canvases when they change
  useEffect(() => {
    if (canvases.length > 0) {
      localStorage.setItem('ai-canvases', JSON.stringify(canvases));
    }
  }, [canvases]);
  
  // Enhanced canvas routing - AI Chat Master → Canvas Slave
  const routeToCanvas = useCallback((content: string, contentType: string = 'document') => {
    console.log('🎨 Routing content to Canvas (Slave Mode)');
    
    // Analyze content type if not specified
    const analyzedType = contentType === 'document' ? analyzeContentType(content) : contentType;
    
    // Set canvas content
    setCanvasContent(content);
    setSelectedContentType(analyzedType);
    setShowCanvas(true);
    setSideBySideMode(true);
    
    // Create new canvas document
    const newCanvas: CanvasDocument = {
      id: uuidv4(),
      title: generateCanvasTitle(content, analyzedType),
      content,
      contentType: analyzedType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      aiGenerated: true,
      metadata: {
        originalPrompt: 'Generated from AI Chat',
        complexity: analyzeComplexity(content),
        estimatedReadTime: estimateReadTime(content)
      }
    };
    
    setCanvases(prev => [newCanvas, ...(prev || [])]);
    setActiveCanvasId(newCanvas.id);
    
    console.log('📄 Created new canvas:', newCanvas.title);
  }, [setShowCanvas, setCanvases, setActiveCanvasId]);
  
  // Update canvas content (slave responds to user edits)
  const updateCanvasContent = useCallback((content: string) => {
    setCanvasContent(content);
    setCanvasUpdating(true);
    
    // Update the active canvas
    if (activeCanvasId) {
      setCanvases(prev => (prev || []).map(canvas => 
        canvas.id === activeCanvasId 
          ? { 
              ...canvas, 
              content, 
              updatedAt: new Date().toISOString(),
              metadata: {
                ...canvas.metadata,
                estimatedReadTime: estimateReadTime(content)
              }
            }
          : canvas
      ));
    }
    
    // Clear updating indicator after brief delay
    setTimeout(() => setCanvasUpdating(false), 500);
  }, [activeCanvasId, setCanvases]);
  
  // Canvas management actions
  const toggleCanvas = useCallback(() => {
    setShowCanvas(!showCanvas);
  }, [showCanvas, setShowCanvas]);
  
  const toggleSideBySideMode = useCallback(() => {
    setSideBySideMode(prev => !prev);
  }, []);
  
  const createNewCanvas = useCallback((title: string, content: string, type: string) => {
    const newCanvas: CanvasDocument = {
      id: uuidv4(),
      title,
      content,
      contentType: type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      aiGenerated: false,
      metadata: {
        complexity: analyzeComplexity(content),
        estimatedReadTime: estimateReadTime(content)
      }
    };
    
    setCanvases(prev => [newCanvas, ...(prev || [])]);
    setActiveCanvasId(newCanvas.id);
    setCanvasContent(content);
    setSelectedContentType(type);
    setShowCanvas(true);
    console.log('📄 Created new canvas manually:', title);
  }, [setShowCanvas, setCanvases, setActiveCanvasId]);
  
  const selectCanvas = useCallback((id: string) => {
    const canvas = canvases.find(c => c.id === id);
    if (canvas) {
      setActiveCanvasId(id);
      setCanvasContent(canvas.content);
      setSelectedContentType(canvas.contentType);
      setShowCanvas(true);
      console.log('📄 Selected canvas:', canvas.title);
    }
  }, [canvases, setShowCanvas, setActiveCanvasId]);
  
  const deleteCanvas = useCallback((id: string) => {
    setCanvases(prev => (prev || []).filter(canvas => canvas.id !== id));
    
    if (activeCanvasId === id) {
      setActiveCanvasId(null);
      setCanvasContent('');
      setShowCanvas(false);
    }
    
    console.log('🗑️ Deleted canvas:', id);
  }, [activeCanvasId, setCanvases, setActiveCanvasId, setShowCanvas]);
  
  const exportCanvas = useCallback((id: string) => {
    const canvas = canvases.find(c => c.id === id);
    if (canvas) {
      // Create downloadable file
      const blob = new Blob([canvas.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${canvas.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('💾 Exported canvas:', canvas.title);
    }
  }, [canvases]);
  
  const setCanvasTitle = useCallback((id: string, title: string) => {
    setCanvases(prev => (prev || []).map(canvas => 
      canvas.id === id 
        ? { ...canvas, title, updatedAt: new Date().toISOString() }
        : canvas
    ));
  }, [setCanvases]);

  // Implement legacy compatibility actions that proxy/adapt to the core actions
  const sendToCanvas = useCallback((content: string, compatOptions?: any) => {
    console.log('🔗 sendToCanvas compatibility wrapper called');
    const type = compatOptions?.type || 'document';
    const title = compatOptions?.title || generateCanvasTitle(content, type);
    
    if (compatOptions?.type === 'edit' || compatOptions?.type === 'surgical_edit') {
      updateCanvasContent(content);
    } else {
      createNewCanvas(title, content, type);
    }
    
    if (compatOptions?.autoOpen !== false) {
      setShowCanvas(true);
    }
  }, [createNewCanvas, updateCanvasContent, setShowCanvas]);

  const appendToCanvas = useCallback((content: string, compatOptions?: any) => {
    console.log('🔗 appendToCanvas compatibility wrapper called');
    // For appending, we can grab the active document content and add it
    if (activeCanvasId) {
      const activeDoc = canvases.find(c => c.id === activeCanvasId);
      const currentText = activeDoc ? activeDoc.content : '';
      updateCanvasContent(currentText + '\n\n' + content);
    } else {
      sendToCanvas(content, compatOptions);
    }
  }, [activeCanvasId, canvases, updateCanvasContent, sendToCanvas]);

  const createCanvasDocument = useCallback((content: string, title: string, userRequest?: string, taskId?: string, type?: string) => {
    console.log('🔗 createCanvasDocument compatibility wrapper called');
    createNewCanvas(title, content, type || 'document');
  }, [createNewCanvas]);

  const handleCanvasChange = useCallback((content: string) => {
    updateCanvasContent(content);
  }, [updateCanvasContent]);
  
  return {
    // Display state
    showCanvas,
    sideBySideMode,
    canvasContent,
    selectedContentType,
    canvasUpdating,
    
    // Management state
    canvases,
    activeCanvasId,
    
    // Actions
    routeToCanvas,
    updateCanvasContent,
    toggleCanvas,
    toggleSideBySideMode,
    createNewCanvas,
    selectCanvas,
    deleteCanvas,
    exportCanvas,
    setCanvasTitle,

    // Compat methods
    sendToCanvas,
    appendToCanvas,
    createCanvasDocument,
    handleCanvasChange
  };
}


// Helper functions
function analyzeContentType(content: any): string {
  if (!content || typeof content !== 'string') return 'document';
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('petition') || lowerContent.includes('motion')) return 'legal-petition';
  if (lowerContent.includes('contract') || lowerContent.includes('agreement')) return 'legal-contract';
  if (lowerContent.includes('brief') || lowerContent.includes('memorandum')) return 'legal-brief';
  if (lowerContent.includes('letter') || lowerContent.includes('correspondence')) return 'letter';
  if (lowerContent.includes('report') || lowerContent.includes('analysis')) return 'report';
  if (lowerContent.includes('plan') || lowerContent.includes('strategy')) return 'business-plan';
  
  return 'document';
}

function generateCanvasTitle(content: any, type: string): string {
  const timestamp = new Date().toLocaleTimeString();
  const typeDisplayMap: Record<string, string> = {
    'legal-petition': 'Legal Petition',
    'legal-contract': 'Contract',
    'legal-brief': 'Legal Brief',
    'letter': 'Letter',
    'report': 'Report',
    'business-plan': 'Business Plan',
    'document': 'Document'
  };
  
  const typeDisplay = typeDisplayMap[type] || 'Document';
  
  if (!content || typeof content !== 'string') {
    return `${typeDisplay} - ${timestamp}`;
  }
  
  // Try to extract a meaningful title from the first line
  const firstLine = content.split('\n')[0]?.trim();
  if (firstLine && firstLine.length > 0 && firstLine.length < 100) {
    return `${typeDisplay}: ${firstLine}`;
  }
  
  return `${typeDisplay} - ${timestamp}`;
}

function analyzeComplexity(content: any): 'simple' | 'medium' | 'complex' {
  if (!content || typeof content !== 'string') return 'simple';
  const wordCount = content.split(/\s+/).length;
  const hasLegalTerms = /whereas|heretofore|plaintiff|defendant|jurisdiction|statute/i.test(content);
  const hasTechnicalTerms = /pursuant|notwithstanding|aforementioned|undersigned/i.test(content);
  
  if (wordCount > 1000 || (hasLegalTerms && hasTechnicalTerms)) return 'complex';
  if (wordCount > 300 || hasLegalTerms || hasTechnicalTerms) return 'medium';
  return 'simple';
}

function estimateReadTime(content: any): number {
  if (!content || typeof content !== 'string') return 0;
  const wordCount = content.split(/\s+/).length;
  const wordsPerMinute = 200; // Average reading speed
  return Math.ceil(wordCount / wordsPerMinute);
}
