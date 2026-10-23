import React, { useState, useEffect } from 'react';
import {
  FileText, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Undo, Redo, Download, Share, Settings, MoreHorizontal,
  Eye, EyeOff, PanelRightOpen, PanelRightClose
} from 'lucide-react';

interface DocumentEditorLayoutProps {
  documentTitle: string;
  onTitleChange: (title: string) => void;
  documentContent: string;
  onContentChange: (content: string) => void;
  documentType: string;
  lastModified: Date;
  rightPanelContent?: React.ReactNode;
  // Undo/Redo functionality
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const DocumentEditorLayout: React.FC<DocumentEditorLayoutProps> = ({
  documentTitle,
  onTitleChange,
  documentContent,
  onContentChange,
  documentType,
  lastModified,
  rightPanelContent,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false
}) => {
  // UI State Management
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(documentTitle);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [showToolbarOnHover, setShowToolbarOnHover] = useState(false);
  const [autoHideToolbar, setAutoHideToolbar] = useState(false);
  const [isEntireTopCollapsed, setIsEntireTopCollapsed] = useState(false);

  // Auto-hide functionality
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (autoHideToolbar && !showToolbarOnHover) {
      timeout = setTimeout(() => setIsToolbarCollapsed(true), 2000);
    }
    return () => clearTimeout(timeout);
  }, [autoHideToolbar, showToolbarOnHover]);

  const handleTitleSubmit = () => {
    if (tempTitle.trim() !== documentTitle.trim()) {
      onTitleChange(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setTempTitle(documentTitle);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Main Content Area - Clean full-width editor */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full bg-white mx-4 my-4 rounded-lg shadow-sm border border-gray-200 relative">
          {/* Document Stats Bar */}
          <div className="absolute top-2 right-2 bg-gray-50 text-xs text-gray-500 px-2 py-1 rounded">
            {(documentContent || '').split(' ').length} words • {(documentContent || '').length} chars
          </div>

          {/* Content Area */}
          <div className="h-full p-8 pt-12">
            <textarea
              value={documentContent}
              onChange={(e) => onContentChange(e.target.value)}
              className="w-full h-full resize-none focus:outline-none text-gray-900 leading-relaxed font-sans text-sm border-2 border-transparent hover:border-blue-200 focus:border-blue-400 transition-colors bg-transparent"
              placeholder="Start writing your document..."
              title="Document editor"
              spellCheck={true}
              autoComplete="off"
              tabIndex={0}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditorLayout;
