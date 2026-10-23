/**
 * 🎨 CleanCanvasPanel - Unified Multi-Canvas UI Component
 * 
 * This component replaces the complex legacy canvas UI in AIAssistantPage
 * with a clean, organized panel that integrates UnifiedCanvasSystem
 * and follows constant prompt guidelines for maintainable code.
 */

import React from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { FileText, Plus, X, Settings, Save, Download } from 'lucide-react';
import { cn } from '../../lib/utils';
import UnifiedCanvasSystem from './UnifiedCanvasSystem';
import { TemplateManager } from './TemplateManager';
// Using Canvas type from hooks instead of missing controller
import { CanvasDocument } from '../../hooks/canvas/useCanvasAIDrive';

export interface CleanCanvasPanelProps {
  isVisible: boolean;
  canvases: CanvasDocument[];
  activeCanvasId: string | null;
  isProcessing: boolean;
  onClose: () => void;
  onCreateNew: (title: string, contentType: string) => void;
  onSwitchCanvas: (canvasId: string) => void;
  onCloseCanvas: (canvasId: string) => void;
  onUpdateContent: (canvasId: string, content: string) => void;
  className?: string;
}

/**
 * 🎯 Clean Canvas Panel Component
 * 
 * Features:
 * - Clean integration with UnifiedCanvasSystem
 * - Multi-tab document management
 * - Template system integration
 * - Professional UI following design system
 * - Easy to maintain and extend
 */
export function CleanCanvasPanel({
  isVisible,
  canvases,
  activeCanvasId,
  isProcessing,
  onClose,
  onCreateNew,
  onSwitchCanvas,
  onCloseCanvas,
  onUpdateContent,
  className
}: CleanCanvasPanelProps) {
  const [showTemplates, setShowTemplates] = React.useState<boolean>(false);
  const [selectedContentType, setSelectedContentType] = React.useState<string>('document');

  const activeCanvas = canvases.find(c => c.id === activeCanvasId);

  /**
   * 📝 Template Creation Handler
   */
  const handleCreateFromTemplate = React.useCallback((template: any) => {
    const timestamp = new Date().toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const title = template.title || `New ${template.type} - ${timestamp}`;
    const content = template.content || `# ${title}\n\nStart writing here...`;
    
    onCreateNew(title, template.type || selectedContentType);
    setShowTemplates(false);
  }, [onCreateNew, selectedContentType]);

  /**
   * 🎨 Quick Document Creation
   */
  const handleQuickCreate = React.useCallback((type: string) => {
    const timestamp = new Date().toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const typeNames: Record<string, string> = {
      'document': 'Document',
      'petition': 'Petition',
      'settlement': 'Settlement',
      'memo': 'Memo',
      'letter': 'Letter',
      'motion': 'Motion'
    };
    
    const title = `New ${typeNames[type] || 'Document'} - ${timestamp}`;
    onCreateNew(title, type);
  }, [onCreateNew]);

  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "flex-[2] flex-shrink-0 flex flex-col bg-gray-50 dark:bg-gray-900 min-w-0 overflow-hidden",
        className
      )}
    >
      {/* 📋 Canvas Header */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Document Canvas</h3>
            {canvases.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {canvases.length} document{canvases.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {isProcessing && (
              <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 animate-pulse">
                Processing...
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Quick Create Dropdown */}
            <div className="relative group">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                onClick={() => setShowTemplates(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                New
              </Button>
              
              {/* Quick Actions Dropdown */}
              <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 min-w-48">
                <div className="p-2 space-y-1">
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-2"
                    onClick={() => handleQuickCreate('document')}
                  >
                    <FileText className="h-4 w-4" />
                    Document
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-2"
                    onClick={() => handleQuickCreate('petition')}
                  >
                    <FileText className="h-4 w-4" />
                    Petition
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-2"
                    onClick={() => handleQuickCreate('settlement')}
                  >
                    <FileText className="h-4 w-4" />
                    Settlement
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-2"
                    onClick={() => handleQuickCreate('letter')}
                  >
                    <FileText className="h-4 w-4" />
                    Letter
                  </button>
                  <hr className="my-1" />
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-2"
                    onClick={() => setShowTemplates(true)}
                  >
                    <Settings className="h-4 w-4" />
                    Templates...
                  </button>
                </div>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              title="Close Canvas"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* 📑 Canvas Tabs */}
        {canvases.length > 0 && (
          <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto border-t">
            {canvases.map((canvas) => (
              <div
                key={canvas.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-t-lg border-b-2 cursor-pointer min-w-0 max-w-48 transition-colors",
                  canvas.isActive 
                    ? "bg-white dark:bg-gray-700 border-primary text-primary" 
                    : "bg-gray-100 dark:bg-gray-800 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
                onClick={() => onSwitchCanvas(canvas.id)}
              >
                <FileText className="h-3 w-3 flex-shrink-0" />
                <span className="text-sm truncate" title={canvas.title}>
                  {canvas.title}
                </span>
                {canvas.metadata?.aiAssisted && (
                  <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                    AI
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-red-100 dark:hover:bg-red-900/20 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseCanvas(canvas.id);
                  }}
                  title={`Close ${canvas.title}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {/* 📊 Active Canvas Info */}
        {activeCanvas && (
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                  {activeCanvas.contentType.charAt(0).toUpperCase() + activeCanvas.contentType.slice(1)}
                </Badge>
                {activeCanvas.metadata?.processedThrough && (
                  <Badge variant="outline" className="text-xs">
                    {activeCanvas.metadata.processedThrough}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{activeCanvas.content.length} chars</span>
                <span>•</span>
                <span>Modified {activeCanvas.lastModified.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 🎨 Canvas Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {showTemplates ? (
          /* 📋 Template Selection */
          <div className="flex-1 p-4 overflow-auto">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-semibold">Choose Template</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplates(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <TemplateManager
              contentType={selectedContentType}
              onCreateFromTemplate={handleCreateFromTemplate}
              currentContent=""
              userId="user-id" // This should come from user context
            />
          </div>
        ) : canvases.length === 0 ? (
          /* 🎯 Empty State */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h4 className="text-lg font-semibold mb-2">No Documents Open</h4>
              <p className="text-muted-foreground mb-6">
                Create a new document or template to get started.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setShowTemplates(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Browse Templates
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleQuickCreate('document')}
                >
                  Quick Document
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* 🎨 UnifiedCanvasSystem Integration */
          <div className="flex-1">
            <UnifiedCanvasSystem
              // Pass the active canvas data to UnifiedCanvasSystem
              initialDocuments={canvases}
              onDocumentChange={(documentId, content) => {
                onUpdateContent(documentId, content);
              }}
              onDocumentClose={(documentId) => {
                onCloseCanvas(documentId);
              }}
              className="h-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default CleanCanvasPanel;
