import React, { useState, useEffect } from 'react';
import { X, Download, Copy, Edit, Star, StarOff, ZoomIn, ZoomOut, RotateCcw, ExternalLink } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Dialog, DialogContent } from '../ui/Dialog';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '../../hooks/useToast';
import type { UnifiedDocument } from '../common/DocumentCard';
import { processDocumentContent } from '../../utils/documentUtils';
import { popOutDocument } from '../../utils/windowUtils';

interface FullDocumentViewerProps {
  document: UnifiedDocument;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (document: UnifiedDocument) => void;
  onToggleStar?: (document: UnifiedDocument) => void;
  onDownload?: (document: UnifiedDocument) => void;
}

export function FullDocumentViewer({ 
  document, 
  isOpen, 
  onClose, 
  onEdit,
  onToggleStar,
  onDownload 
}: FullDocumentViewerProps) {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [processedContent, setProcessedContent] = useState<string>('');
  const { toast } = useToast();

  const isStarred = document.starred || document.metadata?.tags?.includes('starred') || document.tags?.includes('starred') || false;

  // Process document content when component mounts or document changes
  useEffect(() => {
    if (document.content) {
      const { readable } = processDocumentContent(document.content);
      setProcessedContent(readable);
    }
  }, [document.content]);

  const handleCopyContent = async () => {
    if (processedContent) {
      try {
        await navigator.clipboard.writeText(processedContent);
        toast({
          title: "Content copied",
          description: "Document content has been copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Copy failed",
          description: "Could not copy content to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Unknown';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-900">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate pr-4">
              {document.title || 'Untitled Document'}
            </h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <span>{formatFileSize(document.size || 0)}</span>
              <span>•</span>
              <span>{formatDate(document.createdAt)}</span>
              {document.tags && document.tags.length > 0 && (
                <>
                  <span>•</span>
                  <div className="flex gap-1 max-w-xs overflow-hidden">
                    {document.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {document.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{document.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleZoomOut}
                disabled={zoomLevel <= 50}
                className="h-6 px-2"
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <span className="text-xs px-2 min-w-12 text-center">{zoomLevel}%</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleZoomIn}
                disabled={zoomLevel >= 200}
                className="h-6 px-2"
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleResetZoom}
                className="h-6 px-2"
                title="Reset zoom"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
            
            {onToggleStar && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleStar(document)}
                className="text-yellow-500 hover:text-yellow-600"
                title={isStarred ? "Unstar document" : "Star document"}
              >
                {isStarred ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyContent}
              title="Copy content"
            >
              <Copy className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => popOutDocument(document.title || 'Untitled Document', processedContent, document.type || 'Document')}
              title="Pop out into new window"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(document)}
                title="Edit document"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            
            {onDownload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDownload(document)}
                title="Download document"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              title="Close viewer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-6">
            <div 
              className={`prose prose-sm dark:prose-invert max-w-none leading-relaxed transition-all`}
            >
              {processedContent ? (
                <div 
                  className="whitespace-pre-wrap font-mono text-sm"
                  style={{ 
                    fontSize: `${zoomLevel}%`,
                    lineHeight: '1.6'
                  }}
                >
                  {processedContent}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <div className="text-lg mb-2">📄</div>
                    <div>No content available for preview</div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer with document info */}
        <div className="border-t bg-gray-50 dark:bg-gray-800 px-4 py-2 text-xs text-gray-500">
          <div className="flex justify-between items-center">
            <div>
              {document.content ? 
                `${document.content.length.toLocaleString()} characters` : 
                'No content'
              }
            </div>
            <div>
              Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Esc</kbd> to close
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}