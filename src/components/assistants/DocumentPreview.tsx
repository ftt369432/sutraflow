import React from 'react';
import { Card } from '../ui/Card';
import { FileText, FolderOpen, Clock, ExternalLink } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface DocumentPreviewProps {
  document: any;
  similarity: number;
  onView?: () => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ document, similarity, onView }) => {
  // Helper function to get color based on similarity score
  const getSimilarityColor = (similarity: number): string => {
    if (similarity >= 0.8) return '#10B981'; // Green for high similarity
    if (similarity >= 0.6) return '#2563EB'; // Blue for good similarity
    if (similarity >= 0.4) return '#F59E0B'; // Orange for moderate similarity
    return '#EF4444'; // Red for low similarity
  };
  
  // Helper function to get file type from extension
  const getFileType = (fileName: string | undefined): string => {
    if (!fileName) return 'Document';
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch(extension) {
      case 'pdf': return 'PDF';
      case 'doc':
      case 'docx': return 'Word';
      case 'xls':
      case 'xlsx': return 'Excel';
      case 'ppt':
      case 'pptx': return 'PowerPoint';
      case 'txt': return 'Text';
      case 'html': return 'HTML';
      case 'md': return 'Markdown';
      default: return 'Document';
    }
  };
  
  const fileType = getFileType(document.metadata?.fileName || document.title);
  
  return (
    <Card className="p-3 border-l-4" style={{ borderLeftColor: getSimilarityColor(similarity) }}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-start gap-1.5">
          <FileText className="h-3.5 w-3.5 mt-0.5" />
          <div>
            <h4 className="font-medium text-sm">
              {document.metadata?.title || document.title || 'Untitled'}
            </h4>
            <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 mt-1 font-normal">
              {fileType}
            </Badge>
          </div>
        </div>
        {onView && (
          <button 
            onClick={onView}
            className="text-xs text-blue-500 hover:text-blue-700 flex items-center"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View
          </button>
        )}
      </div>
      
      <div className="mb-3 bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs border border-gray-100 dark:border-gray-700">
        <p className="line-clamp-3">
          {document.content.substring(0, 200)}...
        </p>
      </div>
      
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Relevance:</span>
          <div className="flex items-center gap-1">
            <span className="font-medium" style={{ color: getSimilarityColor(similarity) }}>
              {Math.round(similarity * 100)}%
            </span>
            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full" 
                style={{ 
                  width: `${Math.round(similarity * 100)}%`,
                  backgroundColor: getSimilarityColor(similarity)
                }}
              />
            </div>
          </div>
        </div>
        
        {document.metadata?.folder && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Folder:</span>
            <span className="font-medium flex items-center gap-1">
              <FolderOpen className="h-3 w-3" />
              {document.metadata.folder}
            </span>
          </div>
        )}
        
        {document.metadata?.date && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Date:</span>
            <span className="font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(document.metadata.date).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};
