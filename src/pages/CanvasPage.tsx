import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CanvasDemo } from '../components/canvas/CanvasDemo';
import UnifiedCanvasSystem from '../components/canvas/UnifiedCanvasSystem';
import { useCanvasStore } from '../stores/canvasStore';
import '../utils/multiWindowCanvasTest';

export function CanvasPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { windows, documents, isCanvasEnabled } = useCanvasStore();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  // Get conversation ID from URL if provided
  const conversationId = searchParams.get('conversation') || undefined;
  const documentId = searchParams.get('document') || undefined;

  // Auto-navigation event listeners for Canvas Orchestrator
  useEffect(() => {
    const handleCanvasAutoNavigation = (event: CustomEvent) => {
      console.log('🎨 Canvas: Received auto-navigation event:', event.detail);
      
      // Canvas is already open, just log the event
      console.log(`🎨 Canvas: Auto-opened for ${event.detail.documentType}: ${event.detail.title}`);
      
      // Optional: Show a brief notification or highlight effect
      // This could trigger UI feedback to show the document was auto-loaded
    };

    const handleCanvasContentLoad = (event: CustomEvent) => {
      console.log('🎨 Canvas: Received content load event:', {
        contentLength: event.detail.content?.length,
        documentId: event.detail.documentId,
        metadata: event.detail.metadata
      });
      
      // The CanvasEnhancedDemo component should handle the actual content loading
      // This is just for logging and potential UI state management
    };

    const handleCanvasContentUpdate = (event: CustomEvent) => {
      console.log('🎨 Canvas: Received content update event:', {
        contentLength: event.detail.content?.length,
        documentId: event.detail.documentId,
        updateType: event.detail.updateType
      });
      
      // Handle real-time content updates from AI chat
    };

    // Register event listeners
    window.addEventListener('canvasAutoNavigation', handleCanvasAutoNavigation as EventListener);
    window.addEventListener('canvasContentLoad', handleCanvasContentLoad as EventListener);
    window.addEventListener('canvasContentUpdate', handleCanvasContentUpdate as EventListener);
    
    return () => {
      // Cleanup event listeners
      window.removeEventListener('canvasAutoNavigation', handleCanvasAutoNavigation as EventListener);
      window.removeEventListener('canvasContentLoad', handleCanvasContentLoad as EventListener);
      window.removeEventListener('canvasContentUpdate', handleCanvasContentUpdate as EventListener);
    };
  }, [navigate]);

  // Handle document loading timeout
  useEffect(() => {
    if (documentId && !documents[documentId]) {
      // Set a timeout to show error if document doesn't load
      const timeout = setTimeout(() => {
        setLoadingTimeout(true);
      }, 3000); // 3 second timeout

      return () => clearTimeout(timeout);
    } else if (documentId && documents[documentId]) {
      // Document found, clear timeout state
      setLoadingTimeout(false);
    }
  }, [documentId, documents]);

  // If specific document is requested, show the enhanced editor
  if (documentId) {
    const document = documents[documentId];
    
    if (!document) {
      // Document not found in store - could be loading or doesn't exist
      console.log('🔍 Canvas: Document not found in store:', documentId);
      console.log('🔍 Canvas: Available documents:', Object.keys(documents));
      
      if (loadingTimeout) {
        return (
          <div className="h-screen w-full bg-background flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Document not found</p>
              <p className="text-xs text-muted-foreground mb-4">Document ID: {documentId}</p>
              <button 
                onClick={() => navigate('/canvas')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded"
              >
                Go to Canvas Home
              </button>
            </div>
          </div>
        );
      }
      
      return (
        <div className="h-screen w-full bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading document...</p>
            <p className="text-xs text-muted-foreground mt-2">Document ID: {documentId}</p>
          </div>
        </div>
      );
    }
    
    const window = windows.find(w => w.document?.id === documentId);
    const windowId = window?.id || 'main-window';
    
    return (
      <div className="h-screen w-full bg-background">
        <UnifiedCanvasSystem />
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                AI Canvas Workspace
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Intelligent document creation with AI agent swarms
              </p>
            </div>
          </div>
        </div>
        
        {/* Main Canvas Area - Single panel for better display */}
        <div className="flex-1 overflow-hidden">
          <CanvasDemo />
        </div>
      </div>
    </div>
  );
}

export default CanvasPage;
