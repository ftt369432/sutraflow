import React, { useState, useEffect } from 'react';
import { FileText, Clock, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../ui/DropdownMenu';
import { useCanvasAIDrive, CanvasDocument } from '../../hooks/canvas/useCanvasAIDrive';
import { canvasAIDriveService } from '../../services/canvas/CanvasAIDriveService';
import { useAuth } from '../../contexts/AuthContext';

interface QuickAccessDocumentsProps {
  onDocumentSelect: (document: CanvasDocument) => void;
  className?: string;
}

export function QuickAccessDocuments({ onDocumentSelect, className }: QuickAccessDocumentsProps) {
  const [recentDocuments, setRecentDocuments] = useState<CanvasDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Load recent documents
  const loadRecentDocuments = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Get recent canvas documents from AI Drive
      const files = await canvasAIDriveService.listCanvasDocuments(user.id);
      
      // Sort by last modified and take the 5 most recent
      const sortedFiles = files
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5);
      
      // Convert to CanvasDocument format
      const recentDocs = await Promise.all(
        sortedFiles.map(async (file) => {
          try {
            return await canvasAIDriveService.loadCanvasFromAIDrive(user.id, file.id);
          } catch (error) {
            console.error(`Failed to load document ${file.id}:`, error);
            return null;
          }
        })
      );
      
      setRecentDocuments(recentDocs.filter(Boolean) as CanvasDocument[]);
    } catch (error) {
      console.error('Failed to load recent documents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load on mount
  useEffect(() => {
    loadRecentDocuments();
  }, [user?.id]);

  // Format last modified time
  const formatLastModified = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Get document type color
  const getTypeColor = (type: string) => {
    const colors = {
      'legal': 'text-blue-600',
      'business': 'text-green-600', 
      'creative': 'text-purple-600',
      'medical': 'text-red-600',
      'blank': 'text-gray-600'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600';
  };

  if (recentDocuments.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`flex items-center gap-2 ${className}`}
          disabled={loading}
        >
          <Clock className="h-4 w-4" />
          Recent
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recent Documents
          </div>
          {recentDocuments.map((doc) => (
            <DropdownMenuItem
              key={doc.id}
              className="flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
              onClick={() => onDocumentSelect(doc)}
            >
              <FileText className={`h-4 w-4 mt-0.5 ${getTypeColor(doc.type)}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {doc.title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <span className="capitalize">{doc.type}</span>
                  <span>•</span>
                  <span>{formatLastModified(new Date(doc.modified))}</span>
                </div>
                {doc.metadata?.wordCount && (
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {doc.metadata.wordCount} words
                  </div>
                )}
              </div>
            </DropdownMenuItem>
          ))}
          {recentDocuments.length === 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No recent documents
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}