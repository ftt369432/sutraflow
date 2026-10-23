import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Undo2, 
  Redo2, 
  Save, 
  Download,
  Upload,
  FileText,
  Settings,
  X,
  Maximize2,
  Minimize2,
  PinIcon,
  PinOffIcon
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Textarea } from '../ui/Textarea';
import { EditableDocumentTitle } from './EditableDocumentTitle';
import { useCanvasStore } from '../../stores/canvasStore';
import { ContentType } from '../../types/canvas';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

interface EnhancedCanvasEditorProps {
  windowId: string;
  documentId: string;
  conversationId?: string;
  className?: string;
}

export function EnhancedCanvasEditor({ 
  windowId, 
  documentId, 
  conversationId,
  className 
}: EnhancedCanvasEditorProps) {
  const {
    documents,
    windows,
    updateDocumentContent,
    updateDocumentTitle,
    saveEditState,
    undo,
    redo,
    canUndo,
    canRedo,
    closeWindow,
    minimizeWindow,
    dockWindow,
    linkDocumentToConversation,
    getConversationForDocument
  } = useCanvasStore();

  const document = documents[documentId];
  const window = windows.find(w => w.id === windowId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [content, setContent] = useState(document?.content || '');
  const [title, setTitle] = useState(document?.title || '');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Link document to conversation on mount if provided
  useEffect(() => {
    if (conversationId && documentId && !getConversationForDocument(documentId)) {
      linkDocumentToConversation(documentId, conversationId);
      console.log(`🔗 Canvas: Linked document ${documentId} to conversation ${conversationId}`);
    }
  }, [conversationId, documentId, linkDocumentToConversation, getConversationForDocument]);

  // Sync content with store
  useEffect(() => {
    if (document) {
      setContent(document.content);
      setTitle(document.title);
      setHasUnsavedChanges(false);
    }
  }, [document]);

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!hasUnsavedChanges || !document) return;

    setIsSaving(true);
    try {
      // Save edit state for undo/redo before updating
      saveEditState(documentId, document.content, document.title);
      
      // Update content
      if (content !== document.content) {
        updateDocumentContent(documentId, content);
      }
      
      // Update title
      if (title !== document.title) {
        updateDocumentTitle(documentId, title);
      }

      setHasUnsavedChanges(false);
      toast.success('Document saved automatically');
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast.error('Failed to save document');
    } finally {
      setIsSaving(false);
    }
  }, [hasUnsavedChanges, document, content, title, documentId, saveEditState, updateDocumentContent, updateDocumentTitle]);

  // Auto-save every 3 seconds when there are changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const autoSaveTimer = setTimeout(autoSave, 3000);
    return () => clearTimeout(autoSaveTimer);
  }, [hasUnsavedChanges, autoSave]);

  // Handle content changes
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
  }, []);

  // Handle title changes
  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    setHasUnsavedChanges(true);
    
    // Update the document title in the canvas store immediately
    updateDocumentTitle(documentId, newTitle);
    console.log('🏷️ Document title updated:', newTitle);
  }, [documentId, updateDocumentTitle]);

  // Manual save
  const handleSave = useCallback(async () => {
    if (!document) return;

    setIsSaving(true);
    try {
      saveEditState(documentId, document.content, document.title);
      
      if (content !== document.content) {
        updateDocumentContent(documentId, content);
      }
      
      if (title !== document.title) {
        updateDocumentTitle(documentId, title);
      }

      setHasUnsavedChanges(false);
      toast.success('Document saved');
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save document');
    } finally {
      setIsSaving(false);
    }
  }, [document, content, title, documentId, saveEditState, updateDocumentContent, updateDocumentTitle]);

  // Undo functionality
  const handleUndo = useCallback(() => {
    if (undo(documentId)) {
      setHasUnsavedChanges(false);
      toast.success('Undo successful');
    }
  }, [documentId, undo]);

  // Redo functionality
  const handleRedo = useCallback(() => {
    if (redo(documentId)) {
      setHasUnsavedChanges(false);
      toast.success('Redo successful');
    }
  }, [documentId, redo]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'z':
            if (e.shiftKey) {
              e.preventDefault();
              handleRedo();
            } else {
              e.preventDefault();
              handleUndo();
            }
            break;
          case 'y':
            e.preventDefault();
            handleRedo();
            break;
        }
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleUndo, handleRedo]);

  // Export document
  const handleExport = useCallback(() => {
    if (!document) return;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = globalThis.document.createElement('a');
    a.href = url;
    a.download = `${title || 'document'}.txt`;
    globalThis.document.body.appendChild(a);
    a.click();
    globalThis.document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Document exported');
  }, [document, content, title]);

  if (!document || !window) {
    return (
      <Card className={cn('w-full h-full', className)}>
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Document not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full h-full flex flex-col', className)}>
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <FileText className="h-5 w-5 text-blue-600" />
            <EditableDocumentTitle
              title={title}
              onTitleChange={handleTitleChange}
              className="flex-1"
            />
            {hasUnsavedChanges && (
              <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse" title="Unsaved changes" />
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {/* Undo/Redo Controls */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={!canUndo(documentId)}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={!canRedo(documentId)}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Save Controls */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              title="Save (Ctrl+S)"
            >
              <Save className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleExport}
              title="Export document"
            >
              <Download className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Window Controls */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dockWindow(windowId, !window.isDocked)}
              title={window.isDocked ? "Undock window" : "Dock window"}
            >
              {window.isDocked ? <PinOffIcon className="h-4 w-4" /> : <PinIcon className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => minimizeWindow(windowId, !window.isMinimized)}
              title={window.isMinimized ? "Restore window" : "Minimize window"}
            >
              {window.isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => closeWindow(windowId)}
              title="Close window"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Document Info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{document.metadata.wordCount} words</span>
          <span>{document.metadata.readingTime} min read</span>
          <span>Last modified: {document.lastModified.toLocaleDateString()}</span>
          {conversationId && (
            <span className="text-blue-600">📎 Linked to conversation</span>
          )}
          {isSaving && (
            <span className="text-orange-600">💾 Saving...</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Start writing your document..."
          className="flex-1 resize-none border-0 rounded-none focus:ring-0 p-6"
          style={{ minHeight: '400px' }}
        />
      </CardContent>
    </Card>
  );
}

export default EnhancedCanvasEditor;