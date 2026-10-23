import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Save, 
  Download, 
  Copy, 
  Sparkles, 
  Bot,
  RefreshCw,
  Eye,
  EyeOff,
  Settings2,
  Zap,
  Bold,
  Italic,
  Underline,
  List,
  Quote,
  Link,
  Type,
  Hash
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { cn } from '../../lib/utils';
import { MarkdownMessage } from '../ai/MarkdownMessage';
import { DocumentStructureService, DocumentStructure } from '../../services/DocumentStructureService';
import { StructureValidator } from './StructureValidator';
import { DocumentHistory } from './DocumentHistory';
import { EditableDocumentTitle } from './EditableDocumentTitle';
import { useDocumentHistory } from '../../hooks/useDocumentHistory';
import { canvasAIDriveService, CanvasDocument } from '../../services/canvas/CanvasAIDriveService';
import { useAuth } from '../../contexts/AuthContext';

// Import enhanced canvas styles
import '../../styles/components/canvas-enhanced.css';

interface CanvasOutputProps {
  content: string;
  title: string;
  contentType: string;
  isUpdating?: boolean;
  documentId?: string; // For tracking saved documents
  aiDriveFileId?: string; // For AI Drive integration
  onContentChange: (content: string) => void;
  onTitleChange?: (title: string) => void;
  onSave?: () => void;
  onAIDriveSave?: (aiDriveFileId: string) => void; // Callback when saved to AI Drive
  onExport?: (format: 'pdf' | 'docx' | 'txt') => void;
  onToast?: (message: string) => void;
  className?: string;
}

export function PolishedCanvasOutput({ 
  content, 
  title, 
  contentType, 
  isUpdating = false,
  documentId,
  aiDriveFileId,
  onContentChange,
  onTitleChange,
  onSave,
  onAIDriveSave,
  onExport,
  onToast,
  className 
}: CanvasOutputProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingToAIDrive, setIsSavingToAIDrive] = useState(false);
  const [documentStructure, setDocumentStructure] = useState<DocumentStructure | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  
  // Document history management
  const {
    history,
    currentIndex,
    addToHistory,
    undo,
    redo,
    reset,
    canUndo,
    canRedo
  } = useDocumentHistory(content);

  // Auto-resize textarea to fit content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // Force textarea value update when content prop changes (fixes Canvas update issue)
  useEffect(() => {
    if (textareaRef.current && textareaRef.current.value !== content) {
      console.log('🎨 PolishedCanvasOutput: Forcing textarea value update', {
        textareaLength: textareaRef.current.value.length,
        propContentLength: content.length,
        contentPreview: content.substring(0, 100) + '...'
      });
      textareaRef.current.value = content;
      // Trigger resize
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // Track external content changes (from AI updates) and add to history
  useEffect(() => {
    // Only add to history if this is a significant change from outside the component
    // and we have a current history entry to compare against
    if (history.length > 0) {
      const currentHistoryContent = history[currentIndex]?.content || '';
      const contentChanged = content !== currentHistoryContent;
      const significantChange = Math.abs(content.length - currentHistoryContent.length) > 50;
      
      if (contentChanged && significantChange) {
        addToHistory(content, 'AI update');
      }
    }
  }, [content, history, currentIndex, addToHistory]);

  // Handle content changes with history tracking
  const handleContentChange = (newContent: string) => {
    onContentChange(newContent);
    
    // Add to history if content changed significantly
    if (Math.abs(newContent.length - content.length) > 10 || 
        newContent.trim() !== content.trim()) {
      addToHistory(newContent, 'Content edit');
    }
  };

  // History navigation handlers
  const handleUndo = () => {
    const previousContent = undo();
    onContentChange(previousContent);
    onToast?.('Undid last change');
  };

  const handleRedo = () => {
    const nextContent = redo();
    onContentChange(nextContent);
    onToast?.('Redid change');
  };

  const handleReset = () => {
    const originalContent = reset();
    onContentChange(originalContent);
    onToast?.('Reset to original version');
  };

  // Text formatting functions
  const insertTextAtCursor = (beforeText: string, afterText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newText = content.substring(0, start) + 
                   beforeText + selectedText + afterText + 
                   content.substring(end);
    
    handleContentChange(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + beforeText.length,
        start + beforeText.length + selectedText.length
      );
    }, 0);
  };

  const formatBold = () => insertTextAtCursor('**', '**');
  const formatItalic = () => insertTextAtCursor('*', '*');
  const formatUnderline = () => insertTextAtCursor('<u>', '</u>');
  const formatHeader = () => insertTextAtCursor('# ');
  const formatQuote = () => insertTextAtCursor('> ');
  const formatList = () => insertTextAtCursor('- ');
  const formatLink = () => insertTextAtCursor('[', '](https://)');
  
  const formatCode = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    if (selectedText.includes('\n')) {
      // Multi-line code block
      insertTextAtCursor('```\n', '\n```');
    } else {
      // Inline code
      insertTextAtCursor('`', '`');
    }
  };

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          formatBold();
          break;
        case 'i':
          e.preventDefault();
          formatItalic();
          break;
        case 'u':
          e.preventDefault();
          formatUnderline();
          break;
        case 'k':
          e.preventDefault();
          formatLink();
          break;
        case '`':
          e.preventDefault();
          formatCode();
          break;
      }
    }
  };

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(content);
      onToast?.('Content copied to clipboard');
    } catch (error) {
      onToast?.('Failed to copy content');
    }
  };

  const handleEnhanceContent = async () => {
    setIsGenerating(true);
    // Simulate AI enhancement - replace with actual AI service call
    setTimeout(() => {
      setIsGenerating(false);
      onToast?.('Content enhanced with AI');
    }, 2000);
  };

  // AI Drive save handler
  const handleSaveToAIDrive = async () => {
    if (!user?.id) {
      onToast?.('Please sign in to save to AI Drive');
      return;
    }

    if (!content.trim()) {
      onToast?.('Cannot save empty document');
      return;
    }

    setIsSavingToAIDrive(true);
    
    try {
      const canvasDoc: CanvasDocument = {
        id: documentId || `canvas-${Date.now()}`,
        title: title || 'Untitled Document',
        content,
        contentType,
        lastModified: new Date(),
        isActive: true,
        aiDriveFileId,
        savedToAIDrive: false
      };

      let savedFile;
      
      if (aiDriveFileId) {
        // Update existing file
        savedFile = await canvasAIDriveService.updateCanvasInAIDrive(
          user.id,
          aiDriveFileId,
          canvasDoc
        );
        onToast?.('Document updated in AI Drive');
      } else {
        // Create new file in Canvas Documents folder
        const folderId = await canvasAIDriveService.ensureCanvasFolder(user.id);
        savedFile = await canvasAIDriveService.saveCanvasToAIDrive(
          user.id,
          canvasDoc,
          folderId
        );
        onToast?.('Document saved to AI Drive');
        
        // Notify parent component of the new AI Drive file ID
        onAIDriveSave?.(savedFile.id);
      }

      // Add to history
      addToHistory(content, `Saved to AI Drive: ${savedFile.name}`);
      
    } catch (error) {
      console.error('Failed to save to AI Drive:', error);
      onToast?.('Failed to save to AI Drive');
    } finally {
      setIsSavingToAIDrive(false);
    }
  };

  const getContentTypeColor = (type: string) => {
    const colors = {
      'legal': 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200',
      'business': 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200',
      'personal': 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200',
      'technical': 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200',
      'creative': 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 border-pink-200',
      'document': 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300 border-gray-200'
    };
    return colors[type as keyof typeof colors] || colors.document;
  };

  return (
    <div className={cn("flex flex-col h-full bg-background canvas-container", className)}>
      {/* Canvas Header - Enhanced with editable title and history */}
      <div className="canvas-header p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <EditableDocumentTitle
                title={title}
                onTitleChange={onTitleChange || (() => {})}
              />
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={cn("text-xs", getContentTypeColor(contentType))}>
                  {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
                </Badge>
                {isUpdating && (
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 animate-pulse">
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Updating...
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons and history controls */}
          <div className="flex items-center gap-3">
            {/* Document History Controls */}
            <DocumentHistory
              history={history}
              currentIndex={currentIndex}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onReset={handleReset}
            />
            
            <div className="w-px h-6 bg-border" />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="text-xs"
            >
              {isPreviewMode ? (
                <>
                  <EyeOff className="h-3 w-3 mr-1" />
                  Edit
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyContent}
              className="text-xs"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveToAIDrive}
              disabled={isSavingToAIDrive || !user?.id}
              className="text-xs"
            >
              {isSavingToAIDrive ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3 w-3 mr-1" />
                  {aiDriveFileId ? 'Update' : 'Save to AI Drive'}
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleEnhanceContent}
              disabled={isGenerating}
              className="text-xs"
            >
              {isGenerating ? (
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3 mr-1" />
              )}
              Enhance
            </Button>

            {onSave && (
              <Button
                variant="default"
                size="sm"
                onClick={onSave}
                className="text-xs"
              >
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>
            )}
          </div>
        </div>

        {/* Document stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{content.length} characters</span>
          <span>{content.split(/\s+/).length} words</span>
          <span>{content.split('\n').length} lines</span>
        </div>
      </div>

      {/* Canvas Content - Enhanced layout and scrolling */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Document Structure Validator - Now collapsible */}
        <div className="flex-shrink-0 p-4 pb-0">
          <StructureValidator
            content={content}
            onStructureChange={setDocumentStructure}
          />
        </div>
        
        {/* Main content area with proper scrolling */}
        <div className="flex-1 p-4 overflow-hidden">
          {isPreviewMode ? (
            /* Preview Mode - styled like chat messages with proper scrolling */
            <Card className="h-full shadow-sm border-border/50 canvas-preview-card overflow-hidden">
              <CardContent className="p-0 h-full">
                <div className="h-full overflow-y-auto">
                  <div className="p-6">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <MarkdownMessage 
                        content={content || "Start writing your document here...\n\nYou can use **markdown** formatting for better presentation."}
                        streaming={false}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Edit Mode - enhanced textarea with formatting toolbar */
            <div className="h-full bg-white dark:bg-gray-950 rounded-lg border overflow-hidden flex flex-col">
              {/* Formatting Toolbar */}
              <div className="flex items-center gap-1 p-2 border-b bg-gray-50 dark:bg-gray-900/50 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={formatBold}
                  className="h-8 w-8 p-0"
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={formatItalic}
                  className="h-8 w-8 p-0"
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={formatUnderline}
                  className="h-8 w-8 p-0"
                  title="Underline"
                >
                  <Underline className="h-4 w-4" />
                </Button>
                
                <div className="w-px h-6 bg-border mx-1" />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={formatHeader}
                  className="h-8 w-8 p-0"
                  title="Header"
                >
                  <Hash className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={formatQuote}
                  className="h-8 w-8 p-0"
                  title="Quote"
                >
                  <Quote className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={formatList}
                  className="h-8 w-8 p-0"
                  title="Bullet List"
                >
                  <List className="h-4 w-4" />
                </Button>
                
                <div className="w-px h-6 bg-border mx-1" />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={formatLink}
                  className="h-8 w-8 p-0"
                  title="Link"
                >
                  <Link className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={formatCode}
                  className="h-8 w-8 p-0"
                  title="Code"
                >
                  <Type className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="relative flex-1">
                <textarea
                  ref={textareaRef}
                  className={cn(
                    "w-full h-full p-6 border-0 bg-transparent resize-none",
                    "focus:outline-none focus:ring-0",
                    "font-mono text-sm leading-relaxed",
                    "placeholder:text-muted-foreground/60",
                    "transition-all duration-200",
                    "overflow-y-auto"
                  )}
                  placeholder={`Start writing your ${contentType} here...\n\n✨ Pro tip: Use markdown formatting:\n• **bold text**\n• *italic text*\n• # Headers\n• - Bullet points\n• [links](https://example.com)\n\nType naturally - AI will enhance your content!`}
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                
                {/* AI Enhancement Overlay */}
                {isGenerating && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary animate-pulse" />
                        </div>
                        <div>
                          <p className="font-medium">AI is enhancing your content...</p>
                          <p className="text-sm text-muted-foreground">Adding professional polish and clarity</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Canvas Footer - quick actions */}
      <div className="canvas-footer p-3 border-t flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onExport?.('pdf')}
              className="text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              Export PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onExport?.('docx')}
              className="text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              Export Word
            </Button>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="h-3 w-3" />
            <span>Press Ctrl+Enter for AI assist</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PolishedCanvasOutput;
