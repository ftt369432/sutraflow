/**
 * AI Drive File Browser
 * 
 * Allows users to browse and open AI Drive files for editing in Canvas.
 * Integrates with conversation-document linking for seamless experience.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Folder, Search, Calendar, User, ExternalLink, Edit3, Download, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useConversationDocumentStore } from '../../stores/conversationDocumentStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Badge } from '../ui/Badge';
import { format } from 'date-fns';

// Mock AI Drive file structure (replace with actual AI Drive integration)
interface AIDriveFile {
  id: string;
  name: string;
  type: 'document' | 'folder';
  size: number;
  lastModified: Date;
  createdBy: string;
  content?: string;
  documentType: string;
  tags: string[];
  isShared: boolean;
  path: string;
}

interface AIDriveFileBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onFileOpen: (file: AIDriveFile) => void;
  currentConversationId?: string;
  className?: string;
}

export const AIDriveFileBrowser: React.FC<AIDriveFileBrowserProps> = ({
  isOpen,
  onClose,
  onFileOpen,
  currentConversationId,
  className
}) => {
  const [files, setFiles] = useState<AIDriveFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<AIDriveFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState('/');

  const { linkDocumentToConversation } = useConversationDocumentStore();

  // Mock data - replace with actual AI Drive service
  useEffect(() => {
    if (isOpen) {
      loadFiles();
    }
  }, [isOpen, currentPath]);

  const loadFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      // Mock file data - replace with actual AI Drive API call
      const mockFiles: AIDriveFile[] = [
        {
          id: 'file-1',
          name: 'Legal Petition - Workers Comp.docx',
          type: 'document',
          size: 15420,
          lastModified: new Date('2025-09-10'),
          createdBy: 'Legal Assistant',
          documentType: 'legal',
          tags: ['workers-comp', 'petition', 'legal'],
          isShared: false,
          path: '/legal-documents/',
          content: 'Mock legal petition content...'
        },
        {
          id: 'file-2',
          name: 'Business Plan Draft.docx',
          type: 'document',
          size: 28900,
          lastModified: new Date('2025-09-09'),
          createdBy: 'AI Assistant',
          documentType: 'business',
          tags: ['business-plan', 'draft'],
          isShared: true,
          path: '/business-documents/',
          content: 'Mock business plan content...'
        },
        {
          id: 'file-3',
          name: 'Demand Letter Template.docx',
          type: 'document',
          size: 8750,
          lastModified: new Date('2025-09-08'),
          createdBy: 'Legal Team',
          documentType: 'template',
          tags: ['template', 'demand-letter', 'legal'],
          isShared: true,
          path: '/templates/',
          content: 'Mock demand letter template...'
        }
      ];

      setFiles(mockFiles);
      setFilteredFiles(mockFiles);
    } catch (error) {
      console.error('Failed to load AI Drive files:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPath]);

  // Filter files based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredFiles(files);
    } else {
      const filtered = files.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        file.documentType.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFiles(filtered);
    }
  }, [searchQuery, files]);

  const handleFileOpen = useCallback(async (file: AIDriveFile) => {
    try {
      setIsLoading(true);
      
      // Open file in canvas
      onFileOpen(file);

      // Link to current conversation if available
      if (currentConversationId) {
        linkDocumentToConversation(
          currentConversationId,
          file.id,
          file.name,
          file.documentType,
          'ai-drive'
        );
        console.log('🔗 AI Drive file linked to conversation:', {
          conversationId: currentConversationId,
          fileName: file.name
        });
      }

      onClose();
    } catch (error) {
      console.error('Failed to open AI Drive file:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onFileOpen, currentConversationId, linkDocumentToConversation, onClose]);

  const getFileIcon = (file: AIDriveFile) => {
    if (file.type === 'folder') {
      return <Folder className="w-5 h-5 text-blue-500" />;
    }
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocumentTypeBadge = (documentType: string) => {
    const colors = {
      legal: 'bg-blue-100 text-blue-800',
      business: 'bg-green-100 text-green-800',
      template: 'bg-purple-100 text-purple-800',
      personal: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={cn("text-xs", colors[documentType as keyof typeof colors] || colors.personal)}>
        {documentType}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>AI Drive File Browser</DialogTitle>
          <DialogDescription>
            Select a file to open for editing in Canvas
          </DialogDescription>
        </DialogHeader>

        {/* Search and Controls */}
        <div className="flex items-center space-x-4 p-4 border-b">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search files by name, type, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm" onClick={loadFiles} disabled={isLoading}>
            Refresh
          </Button>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500">Loading files...</div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No files found</p>
                {searchQuery && (
                  <p className="text-sm">Try adjusting your search terms</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className={cn(
                    "flex items-center p-3 hover:bg-gray-50 cursor-pointer border-l-4 border-transparent hover:border-blue-500 transition-colors",
                    selectedFile === file.id && "bg-blue-50 border-blue-500"
                  )}
                  onClick={() => setSelectedFile(file.id)}
                  onDoubleClick={() => handleFileOpen(file)}
                >
                  {/* File Icon */}
                  <div className="flex-shrink-0 mr-3">
                    {getFileIcon(file)}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium text-gray-900 truncate">{file.name}</p>
                      {getDocumentTypeBadge(file.documentType)}
                      {file.isShared && (
                        <Badge variant="outline" className="text-xs">
                          Shared
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {format(file.lastModified, 'MMM dd, yyyy')}
                      </span>
                      <span className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        {file.createdBy}
                      </span>
                      <span>{formatFileSize(file.size)}</span>
                    </div>

                    {/* Tags */}
                    {file.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {file.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileOpen(file);
                      }}
                      title="Open in Canvas"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''} found
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {selectedFile && (
              <Button
                onClick={() => {
                  const file = files.find(f => f.id === selectedFile);
                  if (file) handleFileOpen(file);
                }}
                disabled={isLoading}
              >
                Open Selected
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIDriveFileBrowser;