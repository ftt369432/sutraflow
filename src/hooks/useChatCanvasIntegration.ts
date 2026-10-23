/**
 * 🔗 useChatCanvasIntegration Hook
 * 
 * Clean integration between chat system and multi-canvas system.
 * Replaces the complex legacy canvas logic in AIAssistantPage with a
 * clean, organized hook f  const createManualCanvas = useCallback((
    title: string,
    contentType: string = 'document',
    initialContent?: string
  ) => {
    try {
      console.log('🎨 Creating manual canvas:', title, contentType);
      
      // Create canvas using the existing canvas hooks
      const canvasContent = initialContent || `# ${title}\n\n[Content will be added here]`;
      const canvasId = createDocument(canvasContent);

      console.log('✅ Manual canvas created:', canvasId);
      
    } catch (error) {
      console.error('❌ Error creating manual canvas:', error);
    }
  }, [createDocument]);ompt guidelines.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { getCanvasOrchestrator } from '../services/canvas/orchestration';
import { useCanvas } from './canvas/useCanvas';

// 🔧 Helper interface for surgical edit sections
interface SurgicalEditSection {
  sectionName: string;
  newContent: string;
}

// 🔧 Helper function to parse surgical edit sections from AI response
function parseSurgicalEditSections(aiResponse: string): SurgicalEditSection[] {
  const sections: SurgicalEditSection[] = [];
  
  // Look for SECTION: patterns
  const sectionRegex = /SECTION:\s*([^\n]+)\s*REPLACE WITH:\s*([\s\S]*?)(?=SECTION:|$)/gi;
  let match;
  
  while ((match = sectionRegex.exec(aiResponse)) !== null) {
    const sectionName = match[1].trim();
    const newContent = match[2].trim();
    
    if (sectionName && newContent) {
      sections.push({ sectionName, newContent });
    }
  }
  
  console.log('📝 Parsed surgical edit sections:', sections);
  return sections;
}

// 🔧 Helper function to apply surgical edit to document content
function applySurgicalEdit(documentContent: string, section: SurgicalEditSection): string {
  console.log('✂️ Applying surgical edit to section:', section.sectionName);
  
  // For now, append the new content with clear section markers
  // In a more sophisticated implementation, we could locate and replace specific sections
  const editMarker = `\n\n<!-- SURGICAL EDIT: ${section.sectionName} -->\n${section.newContent}\n<!-- END EDIT -->\n`;
  
  return documentContent + editMarker;
}

export interface CanvasDocument {
  id: string;
  title: string;
  content: string;
  contentType: string;
  isActive: boolean;
  lastModified: Date;
  metadata?: any;
}

export interface ChatCanvasState {
  showCanvas: boolean;
  sideBySideMode: boolean;
  canvases: CanvasDocument[];
  activeCanvasId: string | null;
  isProcessing: boolean;
}

export interface ChatCanvasActions {
  handleChatCanvasRequest: (userInput: string, aiResponse: string, conversationContext?: any) => Promise<void>;
  createManualCanvas: (title: string, contentType: string, initialContent?: string) => Promise<void>;
  toggleCanvas: () => void;
  setSideBySideMode: (enabled: boolean) => void;
  switchToCanvas: (canvasId: string) => void;
  closeCanvas: (canvasId: string) => void;
  updateCanvasContent: (canvasId: string, content: string) => void;
}

/**
 * 🎯 Main Chat-Canvas Integration Hook
 * 
 * This hook provides a clean interface for:
 * - Processing chat messages for canvas creation
 * - Managing multi-canvas state
 * - Coordinating between chat and canvas UI
 * - Replacing legacy canvas logic with organized, maintainable code
 */
export function useChatCanvasIntegration(userId?: string): {
  state: ChatCanvasState;
  actions: ChatCanvasActions;
} {
  // Canvas UI State
  const [showCanvas, setShowCanvas] = useState<boolean>(false);
  const [sideBySideMode, setSideBySideMode] = useState<boolean>(false);
  const [canvases, setCanvases] = useState<CanvasDocument[]>([]);
  const [activeCanvasId, setActiveCanvasId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Create Canvas Orchestrator instance (singleton - prevents initialization loop)
  const canvasOrchestrator = useMemo(() => getCanvasOrchestrator(), []);

  // Integration with existing canvas system
  const { createDocument, switchToDocument, closeDocument } = useCanvas();

  /**
   * 🤝 Setup Integration with MultiCanvasController and CanvasService
   * 
   * Register event handlers so the controller can update our UI state
   */
  useEffect(() => {
    // Handler for when new canvases are created
    const handleCanvasCreate = (newCanvases: CanvasDocument[]) => {
      console.log('🎨 useChatCanvasIntegration: Received new canvases', newCanvases.length);
      
      setCanvases(prevCanvases => {
        // Merge new canvases with existing ones, avoiding duplicates
        const existingIds = new Set(prevCanvases.map(c => c.id));
        const uniqueNewCanvases = newCanvases.filter(c => !existingIds.has(c.id));
        
        const updatedCanvases = [...prevCanvases, ...uniqueNewCanvases];
        
        // Set first canvas as active if none is currently active
        setActiveCanvasId(prevActiveId => {
          if (!prevActiveId && updatedCanvases.length > 0) {
            return updatedCanvases[0].id;
          }
          return prevActiveId;
        });
        
        return updatedCanvases;
      });

      // Show canvas UI when canvases are created
      setShowCanvas(true);
      setSideBySideMode(true);

      // ✅ DUPLICATE CREATION FIX: Removed createDocument calls
      // The main canvas system already creates these via other pathways
      console.log('🎯 Canvas creation delegated to main canvas system');
    };

    // Handler for canvas content updates
    const handleCanvasUpdate = (canvasId: string, content: string) => {
      console.log('📝 useChatCanvasIntegration: Canvas content updated', canvasId);
      
      setCanvases(prevCanvases => 
        prevCanvases.map(canvas => 
          canvas.id === canvasId 
            ? { ...canvas, content, lastModified: new Date() }
            : canvas
        )
      );
    };

    // 🎯 SURGICAL EDIT FIX: Listen for CanvasService content updates
    const handleCanvasServiceUpdate = (event: CustomEvent) => {
      console.log('🔧 CanvasService content update received:', event.detail);
      
      const { content, documentId, updateType } = event.detail;
      
      // Check if we have a canvas with this document ID
      setCanvases(prevCanvases => {
        const existingCanvas = prevCanvases.find(c => c.id === documentId);
        
        if (existingCanvas) {
          console.log('✅ Updating existing canvas with surgical edit:', documentId);
          console.log('🔄 Content length change:', existingCanvas.content.length, '→', content.length);
          
          // Force re-render by creating new array
          return prevCanvases.map(canvas => 
            canvas.id === documentId 
              ? { 
                  ...canvas, 
                  content, 
                  lastModified: new Date(),
                  // Add a timestamp to force component re-render
                  updateTimestamp: Date.now()
                }
              : canvas
          );
        } else {
          console.log('⚠️ Canvas not found for surgical edit:', documentId);
          return prevCanvases;
        }
      });
    };

    // 🎯 CANVAS LOAD FIX: Listen for CanvasService content loads (new documents)
    const handleCanvasServiceLoad = (event: CustomEvent) => {
      console.log('🎨 CanvasService content load received:', event.detail);
      
      const { content, documentId, metadata } = event.detail;
      
      // Check if canvas already exists
      setCanvases(prevCanvases => {
        const existingCanvas = prevCanvases.find(c => c.id === documentId);
        
        if (existingCanvas) {
          console.log('⚠️ Canvas already exists, updating:', documentId);
          // Update existing canvas
          return prevCanvases.map(canvas => 
            canvas.id === documentId 
              ? { 
                  ...canvas, 
                  content, 
                  lastModified: new Date(),
                  updateTimestamp: Date.now()
                }
              : canvas
          );
        } else {
          console.log('✅ Creating new canvas from load event:', documentId);
          // Create new canvas - use descriptive title with better fallbacks
          const documentTitle = metadata?.title || 
                                metadata?.documentTitle || 
                                metadata?.name ||
                                (content && content.slice(0, 50).replace(/[#*\n]/g, '').trim()) ||
                                `Professional Document`;
          console.log('🎯 Using enhanced document title for canvas:', documentTitle);
          
          const newCanvas: CanvasDocument = {
            id: documentId,
            title: documentTitle,
            content,
            contentType: metadata?.type || metadata?.contentType || 'document',
            isActive: true, // New canvas should be active
            lastModified: new Date(),
            metadata: {
              profession: metadata?.profession || 'general',
              updateTimestamp: Date.now(),
              originalTitle: documentTitle
            }
          };
          
          return [...prevCanvases, newCanvas];
        }
      });
      
      // Always set new canvas as active when created from load event
      setActiveCanvasId(documentId);
      console.log('🎯 Set new canvas as active:', documentId);
    };

    // Handler for canvas closing
    const handleCanvasClose = (canvasId: string) => {
      console.log('❌ useChatCanvasIntegration: Canvas closed', canvasId);
      
      setCanvases(prevCanvases => {
        const updatedCanvases = prevCanvases.filter(c => c.id !== canvasId);
        
        // If the closed canvas was active, switch to another one
        setActiveCanvasId(prevActiveId => {
          if (prevActiveId === canvasId) {
            return updatedCanvases.length > 0 ? updatedCanvases[0].id : null;
          }
          return prevActiveId;
        });
        
        // Hide canvas if no canvases remain
        if (updatedCanvases.length === 0) {
          setShowCanvas(false);
          setSideBySideMode(false);
        }
        
        return updatedCanvases;
      });

      // Also close in existing canvas system
      closeDocument(canvasId);
    };

    // 🎯 CRITICAL FIX: Register CanvasService event listeners
    window.addEventListener('canvasContentUpdate', handleCanvasServiceUpdate as EventListener);
    window.addEventListener('canvasContentLoad', handleCanvasServiceLoad as EventListener);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('canvasContentUpdate', handleCanvasServiceUpdate as EventListener);
      window.removeEventListener('canvasContentLoad', handleCanvasServiceLoad as EventListener);
    };

    // Note: MultiCanvasController handles its own internal logic
    // No need to register handlers - it returns results directly
  }, [createDocument, closeDocument, activeCanvasId]); // Added activeCanvasId back for CanvasService updates

  /**
   * 🎯 Main Chat-Canvas Request Handler
   * 
   * This replaces the complex legacy logic with a clean, single entry point
   * for processing chat messages and creating canvases
   */
  const handleChatCanvasRequest = useCallback(async (
    userInput: string, 
    aiResponse: string, 
    conversationContext?: any
  ) => {
    console.log('🎯 handleChatCanvasRequest CALLED!', {
      inputLength: userInput.length,
      responseLength: aiResponse.length,
      userInput: userInput.substring(0, 100),
      aiResponse: aiResponse.substring(0, 200)
    });

    if (isProcessing) {
      console.log('⏳ Canvas request already processing, skipping');
      return null;
    }

    let result = null;

    try {
      setIsProcessing(true);
      
      console.log('🎯 Processing chat canvas request', {
        inputLength: userInput.length,
        responseLength: aiResponse.length,
        userId
      });

      // 🔧 SURGICAL EDIT DETECTION: Check if AI response is a surgical edit
      const isSurgicalEdit = aiResponse.includes('SURGICAL EDIT MODE:');
      const isFullReplacement = aiResponse.includes('FULL DOCUMENT REPLACEMENT:');
      
      console.log('🔍 Edit mode detection:', {
        isSurgicalEdit,
        isFullReplacement,
        responseStart: aiResponse.substring(0, 100)
      });

      // If this is a surgical edit, handle it differently
      if (isSurgicalEdit && activeCanvasId) {
        console.log('✂️ Processing surgical edit for canvas:', activeCanvasId);
        
        // Parse surgical edit sections
        const sections = parseSurgicalEditSections(aiResponse);
        console.log('📝 Parsed sections:', sections.length);
        
        // Apply surgical edits to existing canvas
        setCanvases(prevCanvases => {
          return prevCanvases.map(canvas => {
            if (canvas.id === activeCanvasId) {
              let updatedContent = canvas.content;
              
              // Apply each section edit
              sections.forEach(section => {
                updatedContent = applySurgicalEdit(updatedContent, section);
              });
              
              console.log('✅ Applied surgical edits. Content length:', canvas.content.length, '→', updatedContent.length);
              
              return {
                ...canvas,
                content: updatedContent,
                lastModified: new Date(),
                updateTimestamp: Date.now()
              };
            }
            return canvas;
          });
        });
        
        setIsProcessing(false);
        return { success: true, action: 'surgically_edited', documentId: activeCanvasId };
      }

      // Use Canvas Orchestrator to handle the request
      console.log('🔍 CANVAS FLOW DEBUG: About to call processAIResponse', {
        userInput: userInput.substring(0, 100) + '...',
        aiResponse: aiResponse.substring(0, 100) + '...',
        conversationId: conversationContext?.conversationId || 'default'
      });
      
      result = await canvasOrchestrator.processAIResponse(
        userInput,
        aiResponse,
        conversationContext?.conversationId || 'default',
        conversationContext
      );

      console.log('✅ CANVAS FLOW DEBUG: Canvas request processed', {
        success: result.success,
        action: result.action,
        documentId: result.documentId,
        navigationTriggered: result.navigationTriggered,
        errors: result.errors
      });

      // If canvas was created or updated, show canvas UI
      if (result.success && (result.action === 'created' || result.action === 'updated')) {
        console.log('🎨 Canvas operation successful, updating UI:', {
          action: result.action,
          documentId: result.documentId
        });
        
        // If document was created, make sure we have a Canvas UI document with the right ID
        if (result.action === 'created' && result.documentId) {
          const existingCanvas = canvases.find(c => c.id === result.documentId);
          if (!existingCanvas) {
            console.log('📄 Creating Canvas UI document for new CanvasOrchestrator document:', result.documentId);
            // Create a Canvas UI document that matches the CanvasOrchestrator document
            const newCanvas: CanvasDocument = {
              id: result.documentId,
              title: 'New Document',
              content: aiResponse, // Use the AI response as initial content
              contentType: 'document',
              isActive: true,
              lastModified: new Date()
            };
            
            setCanvases(prevCanvases => [
              ...prevCanvases.map(c => ({ ...c, isActive: false })),
              newCanvas
            ]);
            
            setActiveCanvasId(result.documentId);
          }
        }
        
        setShowCanvas(true);
        setSideBySideMode(true);
        console.log('🎨 Canvas UI activated from orchestrator');
      }

    } catch (error) {
      console.error('❌ Error processing chat canvas request:', error);
      
      // Fallback: Create simple canvas from AI response
      if (userInput.toLowerCase().includes('create') || 
          userInput.toLowerCase().includes('draft') ||
          aiResponse.toLowerCase().includes('document')) {
        
        await createManualCanvas(
          'Document from Chat',
          'document',
          `# Document from Chat\n\n**User Request:**\n${userInput}\n\n**AI Response:**\n${aiResponse}`
        );
      }
    } finally {
      setIsProcessing(false);
    }
    
    // Return the result for the calling code to use
    return result;
  }, [isProcessing, userId]);

  /**
   * 📝 Manual Canvas Creation
   * 
   * For direct canvas creation from UI interactions
   */
  const createManualCanvas = useCallback(async (
    title: string, 
    contentType: string, 
    initialContent?: string
  ) => {
    try {
      console.log('🎨 Creating manual canvas:', title, contentType);
      
      // Create canvas using the existing canvas hooks
      const canvasContent = initialContent || `# ${title}\n\n[Content will be added here]`;
      const canvasId = createDocument(contentType, title, canvasContent);

      console.log('✅ Manual canvas created:', canvasId);
      
    } catch (error) {
      console.error('❌ Error creating manual canvas:', error);
    }
  }, []);

  /**
   * 🔄 Canvas Management Actions
   */
  const toggleCanvas = useCallback(() => {
    const newShowCanvas = !showCanvas;
    setShowCanvas(newShowCanvas);
    
    if (!newShowCanvas) {
      setSideBySideMode(false);
    }
    
    console.log('🔄 Canvas toggled:', newShowCanvas);
  }, [showCanvas]);

  const handleSetSideBySideMode = useCallback((enabled: boolean) => {
    setSideBySideMode(enabled);
    
    if (enabled && canvases.length > 0) {
      setShowCanvas(true);
    }
    
    console.log('🔄 Side-by-side mode:', enabled);
  }, [canvases.length]);

  const switchToCanvas = useCallback((canvasId: string) => {
    console.log('🔄 Switching to canvas:', canvasId);
    
    setCanvases(prevCanvases => 
      prevCanvases.map(canvas => ({
        ...canvas,
        isActive: canvas.id === canvasId
      }))
    );
    
    setActiveCanvasId(canvasId);
    
    // Also switch in existing canvas system
    switchToDocument(canvasId);
  }, [switchToDocument]);

  const closeCanvas = useCallback((canvasId: string) => {
    console.log('❌ Closing canvas:', canvasId);
    
    // Close using the existing canvas hooks
    closeDocument(canvasId);
  }, [closeDocument]);

  const updateCanvasContent = useCallback((canvasId: string, content: string) => {
    console.log('📝 Updating canvas content:', canvasId);
    
    // Update local state
    setCanvases(prevCanvases => 
      prevCanvases.map(canvas => 
        canvas.id === canvasId 
          ? { ...canvas, content, lastModified: new Date() }
          : canvas
      )
    );
    
    // Note: Content updates are handled by the canvas store internally
  }, []);

  // Return clean state and actions interface
  return {
    state: {
      showCanvas,
      sideBySideMode,
      canvases,
      activeCanvasId,
      isProcessing
    },
    actions: {
      handleChatCanvasRequest,
      createManualCanvas,
      toggleCanvas,
      setSideBySideMode: handleSetSideBySideMode,
      switchToCanvas,
      closeCanvas,
      updateCanvasContent
    }
  };
}

export default useChatCanvasIntegration;
