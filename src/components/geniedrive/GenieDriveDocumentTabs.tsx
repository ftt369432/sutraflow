import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { 
  FileText, 
  X, 
  Save, 
  Download, 
  Share, 
  MoreVertical,
  Edit3,
  Eye,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { AIDriveFile, AIDriveService } from '../../services/drive/aiDriveService';
import { useToast } from '../../hooks/useToast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import { GenieDriveDocumentPreview } from './GenieDriveDocumentPreview';

export interface OpenDocument {
  id: string;
  file: AIDriveFile;
  content: string;
  isDirty: boolean;
  isLoading: boolean;
  lastSaved?: Date;
}

interface GenieDriveDocumentTabsProps {
  aiDriveService: AIDriveService;
  userId: string;
  openDocuments: OpenDocument[];
  activeDocumentId: string | null;
  onDocumentOpen: (file: AIDriveFile) => void;
  onDocumentClose: (documentId: string) => void;
  onDocumentSave: (documentId: string, content: string) => void;
  onContentChange: (documentId: string, content: string) => void;
  onActiveDocumentChange: (documentId: string | null) => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

export const GenieDriveDocumentTabs: React.FC<GenieDriveDocumentTabsProps> = ({
  aiDriveService: _aiDriveService,
  userId: _userId,
  openDocuments,
  activeDocumentId,
  onDocumentOpen: _onDocumentOpen,
  onDocumentClose,
  onDocumentSave,
  onContentChange,
  onActiveDocumentChange,
  isMaximized = false,
  onToggleMaximize
}) => {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});

  const activeDocument = openDocuments.find(doc => doc.id === activeDocumentId);

  const handleTabChange = useCallback((documentId: string) => {
    onActiveDocumentChange(documentId);
  }, [onActiveDocumentChange]);

  const handleCloseTab = useCallback((documentId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    const document = openDocuments.find(doc => doc.id === documentId);
    if (document?.isDirty) {
      // Show confirmation dialog for unsaved changes
      const shouldClose = window.confirm(
        `"${document.file.name}" has unsaved changes. Close without saving?`
      );
      if (!shouldClose) return;
    }
    
    onDocumentClose(documentId);
  }, [openDocuments, onDocumentClose]);

  const handleSave = useCallback(async (documentId: string) => {
    const document = openDocuments.find(doc => doc.id === documentId);
    if (!document) return;

    try {
      await onDocumentSave(documentId, document.content);
      toast({
        title: "Document Saved",
        description: `"${document.file.name}" has been saved successfully.`,
      });
    } catch (_error) {
      toast({
        title: "Save Failed",
        description: `Failed to save "${document.file.name}". Please try again.`,
        variant: "destructive"
      });
    }
  }, [openDocuments, onDocumentSave, toast]);

  const handleDownload = useCallback(async (document: OpenDocument) => {
    try {
      const blob = new Blob([document.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.file.name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: `Downloading "${document.file.name}"`,
      });
    } catch (_error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the document.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const toggleEditMode = useCallback((documentId: string) => {
    setEditMode(prev => ({
      ...prev,
      [documentId]: !prev[documentId]
    }));
  }, []);

  const getFileTypeIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'txt':
        return '📄';
      case 'md':
        return '📋';
      default:
        return '📄';
    }
  };

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      openDocuments.forEach(doc => {
        if (doc.isDirty && !doc.isLoading) {
          handleSave(doc.id);
        }
      });
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [openDocuments, handleSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey)) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            if (activeDocumentId) {
              handleSave(activeDocumentId);
            }
            break;
          case 'w':
            e.preventDefault();
            if (activeDocumentId) {
              handleCloseTab(activeDocumentId);
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDocumentId, handleSave, handleCloseTab]);

  if (openDocuments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <FileText className="w-12 h-12 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Documents Open</h3>
        <p className="text-sm text-center">
          Select a document from the file list to start editing
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tab Bar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50">
        <Tabs 
          value={activeDocumentId || ''} 
          onValueChange={handleTabChange}
          className="flex-1"
        >
          <div className="flex items-center">
            <TabsList className="flex-1 bg-transparent p-0 h-auto">
              {openDocuments.map((document) => (
                <TabsTrigger
                  key={document.id}
                  value={document.id}
                  className="relative flex items-center gap-2 px-4 py-2 text-sm border-r border-gray-200 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 hover:bg-gray-100"
                >
                  <span className="text-lg">
                    {getFileTypeIcon(document.file.name)}
                  </span>
                  <span className="truncate max-w-32">
                    {document.file.name}
                  </span>
                  {document.isDirty && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                  <div
                    role="button"
                    tabIndex={0}
                    className="w-5 h-5 ml-1 flex items-center justify-center rounded hover:bg-gray-200 text-gray-500 hover:text-gray-900 cursor-pointer transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      handleCloseTab(document.id, e);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>

        {/* Tab Actions */}
        <div className="flex items-center gap-2 px-4">
          {activeDocument && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSave(activeDocument.id)}
                disabled={!activeDocument.isDirty || activeDocument.isLoading}
                className="flex items-center gap-1"
              >
                <Save className="w-4 h-4" />
                Save
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toggleEditMode(activeDocument.id)}>
                    {editMode[activeDocument.id] ? (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        View Mode
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Mode
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload(activeDocument)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share className="w-4 h-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleCloseTab(activeDocument.id)}>
                    <X className="w-4 h-4 mr-2" />
                    Close
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {onToggleMaximize && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleMaximize}
                  className="ml-2"
                >
                  {isMaximized ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeDocumentId || ''} className="h-full">
          {openDocuments.map((document) => (
            <TabsContent
              key={document.id}
              value={document.id}
              className="h-full m-0 focus-visible:outline-none"
            >
              <div className="h-full flex flex-col">
                {document.isLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Loading document...</p>
                    </div>
                  </div>
                ) : document.file.name.toLowerCase().endsWith('.pdf') || document.file.mime_type === 'application/pdf' ? (
                  <div className="flex-1 w-full h-full relative overflow-hidden bg-slate-50 dark:bg-slate-900 border-b border-gray-200 dark:border-gray-800">
                    <GenieDriveDocumentPreview file={document.file} aiDriveService={_aiDriveService} />
                  </div>
                ) : editMode[document.id] ? (
                  <textarea
                    value={document.content}
                    onChange={(e) => onContentChange(document.id, e.target.value)}
                    className="flex-1 w-full p-4 border-none resize-none focus:outline-none font-mono text-sm"
                    placeholder="Start typing your document content..."
                  />
                ) : (
                  <div className="flex-1 p-4 overflow-auto">
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {document.content || 'This document is empty. Click Edit Mode to start writing.'}
                      </pre>
                    </div>
                  </div>
                )}
                
                {/* Status Bar */}
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span>
                      {document.content.length} characters
                    </span>
                    <span>
                      {document.content.split('\n').length} lines
                    </span>
                    {document.isDirty && (
                      <span className="text-blue-600">Unsaved changes</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {document.lastSaved && (
                      <span>
                        Last saved: {document.lastSaved.toLocaleTimeString()}
                      </span>
                    )}
                    <span>
                      {editMode[document.id] ? 'Edit Mode' : 'View Mode'}
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};
