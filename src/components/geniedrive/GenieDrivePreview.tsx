import React, { useState } from 'react';
import { AIDriveFile } from '../../services/drive/aiDriveService';
import { GenieDriveAIPreview } from './GenieDriveAIPreview';
import { GenieDriveDocumentPreview } from './GenieDriveDocumentPreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Brain, FileText, X, ExternalLink } from 'lucide-react';
import { Button } from '../ui/Button';
import { cleanDocumentTitle } from '../../utils/documentUtils';
import { popOutDocument } from '../../utils/windowUtils';

interface GenieDrivePreviewProps {
  item: AIDriveFile;
  aiDriveService: any;
  onClose?: () => void;
}

export const GenieDrivePreview: React.FC<GenieDrivePreviewProps> = ({ 
  item,
  aiDriveService,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('ai');

  if (!item) return null;

  // Handle close button click with confirmation if needed
  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If there are unsaved changes or we want to add confirmation, we could do it here
    // For now, just call onClose directly
    if (onClose) {
      onClose();
    }
  };

  const [isPoppingOut, setIsPoppingOut] = useState(false);

  const handlePopOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!item) return;
    setIsPoppingOut(true);
    try {
      const url = await aiDriveService.downloadFile(item.id);
      if (item.mime_type?.includes('pdf') || item.mime_type?.startsWith('image/')) {
        window.open(url, '_blank');
      } else {
        const response = await fetch(url);
        const text = await response.text();
        popOutDocument(item.name, text, item.mime_type || 'Document');
      }
    } catch (err) {
      console.error('Failed to pop out:', err);
    } finally {
      setIsPoppingOut(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex-none p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold truncate text-gray-900 dark:text-white">
              {cleanDocumentTitle(item.name)}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {item.mime_type || 'Unknown file type'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePopOut}
            disabled={isPoppingOut}
            className="ml-2 flex items-center gap-1.5 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            title="Pop out into new window"
          >
            <ExternalLink className={`h-3.5 w-3.5 ${isPoppingOut ? 'animate-spin' : ''}`} />
            <span className="text-xs font-semibold">Open in New Window</span>
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
    <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="flex-none grid w-full grid-cols-2 m-4 mb-0">
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Summary
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Document
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="ai" className="flex-1 overflow-auto m-0">
            <GenieDriveAIPreview 
              file={item} 
              aiDriveService={aiDriveService} 
            />
          </TabsContent>
          
          <TabsContent value="preview" className="flex-1 overflow-auto m-0">
            <GenieDriveDocumentPreview 
              file={item} 
              aiDriveService={aiDriveService} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};