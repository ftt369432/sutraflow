import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { 
  Save, 
  Download, 
  Share, 
  Edit3, 
  Type, 
  Bold, 
  Italic, 
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link,
  Image,
  FileText,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Undo,
  Redo,
  Copy,
  Scissors,
  RotateCcw,
  Palette,
  Cloud
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedDocumentEditorProps {
  content: string;
  title: string;
  onContentChange: (content: string) => void;
  onTitleChange: (title: string) => void;
  onSave?: (title: string, content: string) => void;
  onClose?: () => void;
  className?: string;
}

export const EnhancedDocumentEditor: React.FC<EnhancedDocumentEditorProps> = ({
  content: initialContent,
  title: initialTitle,
  onContentChange,
  onTitleChange,
  onSave,
  onClose,
  className
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAIDrive, setShowAIDrive] = useState(false);
  
  // 🔄 Visual feedback for surgical edits
  const [isUpdatingFromSurgicalEdit, setIsUpdatingFromSurgicalEdit] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Auto-save functionality
  const [lastSaved, setLastSaved] = useState(new Date());
  const [isSaving, setIsSaving] = useState(false);

  // 🔄 CANVAS SYNC FIX: Update local state when props change (surgical edits)
  const [prevInitialContent, setPrevInitialContent] = useState(initialContent);
  const [prevInitialTitle, setPrevInitialTitle] = useState(initialTitle);
  
  useEffect(() => {
    // Only run if props actually changed from previous values
    if (prevInitialContent !== initialContent || prevInitialTitle !== initialTitle) {
      console.log('🔄 EnhancedDocumentEditor: Props changed, syncing state');
      console.log('🔄 Props content length:', initialContent?.length || 0);
      console.log('🔄 Current state content length:', content?.length || 0);
      
      // Update content if it changed and is not empty
      if (prevInitialContent !== initialContent && initialContent !== '' && initialContent !== undefined) {
        console.log('✅ Updating editor content from props (surgical edit detected)');
        setIsUpdatingFromSurgicalEdit(true);
        setContent(initialContent);
        setHasUnsavedChanges(false); // Don't mark as unsaved since this is an external update
        
        // Show visual feedback for 2 seconds
        setTimeout(() => {
          setIsUpdatingFromSurgicalEdit(false);
        }, 2000);
      }
      
      // Update title if it changed and is not empty
      if (prevInitialTitle !== initialTitle && initialTitle !== '' && initialTitle !== undefined) {
        console.log('✅ Updating editor title from props');
        setTitle(initialTitle);
      }
      
      // Update previous values
      setPrevInitialContent(initialContent);
      setPrevInitialTitle(initialTitle);
    }
  }, [initialContent, initialTitle, prevInitialContent, prevInitialTitle, content]);

  // Calculate word and character counts
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0).length;
    const characters = content.length;
    setWordCount(words);
    setCharacterCount(characters);
  }, [content]);

  // 🔄 FIXED: Separate effect for parent updates to prevent circular calls
  useEffect(() => {
    // Only update parent if the content was changed by user interaction (not external updates)
    if (!isUpdatingFromSurgicalEdit && (content !== initialContent || title !== initialTitle)) {
      console.log('📝 User changed content/title, notifying parent');
      onContentChange(content);
      onTitleChange(title);
      setHasUnsavedChanges(true);
    }
  }, [content, title, isUpdatingFromSurgicalEdit, onContentChange, onTitleChange]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    
    const autoSaveTimer = setTimeout(() => {
      handleSave();
    }, 30000);

    return () => clearTimeout(autoSaveTimer);
  }, [hasUnsavedChanges, content, title]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(title, content);
      }
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save document:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setHasUnsavedChanges(true);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
  };

  // Text formatting functions
  const insertFormatting = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const beforeText = content.substring(0, start);
    const afterText = content.substring(end);

    const newContent = beforeText + before + selectedText + after + afterText;
    setContent(newContent);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        end + before.length
      );
    }, 0);
  };

  const formatBold = () => insertFormatting('**', '**');
  const formatItalic = () => insertFormatting('*', '*');
  const formatUnderline = () => insertFormatting('<u>', '</u>');
  const formatHeader = (level: number) => insertFormatting(`${'#'.repeat(level)} `);
  const formatList = () => insertFormatting('- ');
  const formatOrderedList = () => insertFormatting('1. ');

  const downloadDocument = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareDocument = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: content.substring(0, 200) + '...',
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      alert('Document link copied to clipboard!');
    }
  };

  const handleTemplatesClick = () => {
    console.log('🎨 Templates button clicked - Opening template selector');
    setShowTemplates(!showTemplates);
    if (!showTemplates) {
      // Show visual feedback that templates are loading
      alert('🎨 Template Selector\n\nFeatures:\n• Legal document templates\n• Business templates\n• Medical templates\n• Custom templates\n\n[Template selector will open here]');
    }
  };

  const handleAIDriveClick = () => {
    console.log('☁️ AI Drive button clicked - Opening file browser');
    setShowAIDrive(!showAIDrive);
    if (!showAIDrive) {
      // Show visual feedback that AI Drive is loading
      alert('☁️ AI Drive Browser\n\nFeatures:\n• Browse saved documents\n• Search by type/date\n• Load previous work\n• Link to conversations\n\n[AI Drive browser will open here]');
    }
  };

  return (
    <div 
      ref={editorRef}
      className={cn(
        "flex flex-col h-full bg-white dark:bg-gray-900 transition-all duration-300",
        isFullscreen && "fixed inset-0 z-50",
        className
      )}
    >
      {/* Enhanced Toolbar */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {/* Title Bar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center flex-1 gap-3">
            <FileText className="h-5 w-5 text-blue-600" />
            {isEditing ? (
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={() => setIsEditing(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditing(false);
                  }
                }}
                className="text-lg font-semibold bg-transparent border-0 focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            ) : (
              <h1 
                className="text-lg font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
                onClick={() => setIsEditing(true)}
                title="Click to edit title"
              >
                {title}
              </h1>
            )}
            
            {hasUnsavedChanges && (
              <span className="text-xs text-orange-600 dark:text-orange-400">
                • Unsaved changes
              </span>
            )}
            
            {isUpdatingFromSurgicalEdit && (
              <span className="text-xs text-green-600 dark:text-green-400 animate-pulse">
                ✓ Updated via AI
              </span>
            )}
            
            {isSaving && (
              <span className="text-xs text-blue-600 dark:text-blue-400">
                Saving...
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={cn(
                "transition-colors",
                isPreviewMode && "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
              )}
            >
              {isPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {isPreviewMode ? 'Edit' : 'Preview'}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                ×
              </Button>
            )}
          </div>
        </div>

        {/* Formatting Toolbar */}
        {!isPreviewMode && (
          <div className="flex items-center gap-1 p-2 flex-wrap">
            <div className="flex items-center gap-1 mr-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isSaving}
                className="text-green-600 hover:text-green-700"
              >
                <Save className="h-4 w-4" />
                Save
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadDocument}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={shareDocument}
              >
                <Share className="h-4 w-4" />
                Share
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTemplatesClick}
              >
                <Palette className="h-4 w-4" />
                Templates
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAIDriveClick}
              >
                <Cloud className="h-4 w-4" />
                AI Drive
              </Button>
            </div>

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2" />

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={formatBold}
                title="Bold (Ctrl+B)"
              >
                <Bold className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={formatItalic}
                title="Italic (Ctrl+I)"
              >
                <Italic className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={formatUnderline}
                title="Underline (Ctrl+U)"
              >
                <Underline className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2" />

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatHeader(1)}
                title="Heading 1"
              >
                H1
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatHeader(2)}
                title="Heading 2"
              >
                H2
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatHeader(3)}
                title="Heading 3"
              >
                H3
              </Button>
            </div>

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2" />

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={formatList}
                title="Bullet List"
              >
                <List className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={formatOrderedList}
                title="Numbered List"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Document Stats */}
        <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <span>{wordCount} words</span>
            <span>{characterCount} characters</span>
            <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span>Auto-save: On</span>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {isPreviewMode ? (
          /* Preview Mode */
          <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-900">
            <div className="max-w-4xl mx-auto prose prose-lg dark:prose-invert">
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: content
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
                    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                    .replace(/^\- (.*$)/gim, '<li>$1</li>')
                    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
                    .replace(/\n/g, '<br>')
                }}
              />
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <div className="flex-1 flex overflow-hidden">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="flex-1 resize-none border-0 focus:ring-0 p-6 font-mono text-sm leading-relaxed bg-white dark:bg-gray-900"
              placeholder="Start typing your document content here..."
              style={{ minHeight: '100%' }}
            />
          </div>
        )}
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">📝 Document Templates</h2>
              <Button variant="ghost" onClick={() => setShowTemplates(false)}>✕</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: "Legal Petition", type: "legal", desc: "Standard legal petition format" },
                { name: "Business Proposal", type: "business", desc: "Professional business proposal" },
                { name: "Contract Agreement", type: "legal", desc: "Basic contract template" },
                { name: "Medical Report", type: "medical", desc: "Medical consultation report" },
                { name: "Project Brief", type: "business", desc: "Project overview document" },
                { name: "Meeting Notes", type: "business", desc: "Professional meeting minutes" }
              ].map((template, idx) => (
                <div key={idx} className="border rounded-lg p-4 hover:shadow-md cursor-pointer"
                     onClick={() => {
                       setContent(`# ${template.name}\n\n[Template content will be loaded here]\n\nThis is a ${template.type} document template.\n\n${template.desc}`);
                       setTitle(template.name);
                       setShowTemplates(false);
                     }}>
                  <h3 className="font-semibold">{template.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{template.desc}</p>
                  <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {template.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Drive Modal */}
      {showAIDrive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">☁️ AI Drive Browser</h2>
              <Button variant="ghost" onClick={() => setShowAIDrive(false)}>✕</Button>
            </div>
            <div className="space-y-3">
              {[
                { name: "Legal Petition Draft", type: "petition", date: "2025-09-20", size: "2.3 KB" },
                { name: "Business Contract", type: "contract", date: "2025-09-18", size: "4.1 KB" },
                { name: "Meeting Notes Sept", type: "notes", date: "2025-09-15", size: "1.8 KB" },
                { name: "Project Proposal", type: "proposal", date: "2025-09-12", size: "3.5 KB" },
                { name: "Client Letter", type: "letter", date: "2025-09-10", size: "1.2 KB" }
              ].map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                     onClick={() => {
                       setContent(`# ${file.name}\n\n[Loaded from AI Drive]\n\nDocument Type: ${file.type}\nLast Modified: ${file.date}\nSize: ${file.size}\n\n[Previous content will be loaded here...]`);
                       setTitle(file.name);
                       setShowAIDrive(false);
                     }}>
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-medium">{file.name}</div>
                      <div className="text-sm text-gray-500">{file.type} • {file.size}</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">{file.date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
