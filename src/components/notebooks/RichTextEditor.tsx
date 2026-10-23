import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Code, 
  List, 
  ListOrdered, 
  Link, 
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  RotateCw,
  Check
} from 'lucide-react';
import { Button } from '../ui/Button';

interface RichTextEditorProps {
  initialValue?: string;
  placeholder?: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  isEditing?: boolean;
  autoFocus?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialValue = '',
  placeholder = 'Start typing...',
  onChange,
  onSave,
  isEditing = true,
  autoFocus = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialValue;
      if (autoFocus) {
        editorRef.current.focus();
      }
    }
  }, [initialValue, autoFocus]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const formatText = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  }, [handleInput]);

  const handleSave = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey && onSave) {
      e.preventDefault();
      handleSave();
    }
  };

  const formatButton = (icon: React.ReactNode, command: string, value?: string, tooltip?: string) => (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={() => formatText(command, value)}
      className="h-8 w-8 p-0"
      title={tooltip}
    >
      {icon}
    </Button>
  );

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      formatText('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      formatText('insertImage', url);
    }
  };

  return (
    <div className="border rounded-md overflow-hidden">
      {isEditing && (
        <div className="flex flex-wrap items-center gap-1 p-1 border-b bg-muted/30">
          <div className="flex items-center border-r pr-1">
            {formatButton(<Heading1 size={15} />, 'formatBlock', '<h1>', 'Heading 1')}
            {formatButton(<Heading2 size={15} />, 'formatBlock', '<h2>', 'Heading 2')}
            {formatButton(<Heading3 size={15} />, 'formatBlock', '<h3>', 'Heading 3')}
          </div>
          
          <div className="flex items-center border-r pr-1">
            {formatButton(<Bold size={15} />, 'bold', undefined, 'Bold')}
            {formatButton(<Italic size={15} />, 'italic', undefined, 'Italic')}
            {formatButton(<Underline size={15} />, 'underline', undefined, 'Underline')}
          </div>
          
          <div className="flex items-center border-r pr-1">
            {formatButton(<AlignLeft size={15} />, 'justifyLeft', undefined, 'Align Left')}
            {formatButton(<AlignCenter size={15} />, 'justifyCenter', undefined, 'Align Center')}
            {formatButton(<AlignRight size={15} />, 'justifyRight', undefined, 'Align Right')}
          </div>
          
          <div className="flex items-center border-r pr-1">
            {formatButton(<List size={15} />, 'insertUnorderedList', undefined, 'Bullet List')}
            {formatButton(<ListOrdered size={15} />, 'insertOrderedList', undefined, 'Numbered List')}
            {formatButton(<Quote size={15} />, 'formatBlock', '<blockquote>', 'Quote')}
          </div>
          
          <div className="flex items-center border-r pr-1">
            {formatButton(<Link size={15} />, 'createLink', undefined, 'Insert Link')}
            {formatButton(<ImageIcon size={15} />, 'insertImage', undefined, 'Insert Image')}
            {formatButton(<Code size={15} />, 'formatBlock', '<pre>', 'Code Block')}
          </div>
          
          {onSave && (
            <Button
              size="sm"
              onClick={handleSave}
              className="ml-auto"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <RotateCw size={14} className="mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={14} className="mr-1" />
                  Save
                </>
              )}
            </Button>
          )}
        </div>
      )}
      
      <div
        ref={editorRef}
        contentEditable={isEditing}
        className={`p-3 min-h-[100px] focus:outline-none prose prose-sm max-w-none ${!isEditing ? 'cursor-default' : 'cursor-text'}`}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        style={{
          position: 'relative',
        }}
      />
      
      <style dangerouslySetInnerHTML={{
        __html: `
          [contenteditable=true]:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            cursor: text;
          }
          
          .prose img {
            max-width: 100%;
            height: auto;
          }
          
          .prose blockquote {
            border-left: 3px solid #d1d5db;
            padding-left: 1rem;
            font-style: italic;
            color: #6b7280;
          }
          
          .prose pre {
            background-color: #f3f4f6;
            padding: 0.75rem;
            border-radius: 0.25rem;
            overflow-x: auto;
            font-family: monospace;
          }
        `
      }} />
    </div>
  );
}; 