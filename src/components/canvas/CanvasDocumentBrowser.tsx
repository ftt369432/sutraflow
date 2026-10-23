import React, { useState } from 'react';
import {
  FileText,
  Folder,
  Plus,
  Loader2,
  X
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { cn } from '../../lib/utils';
import { canvasAIDriveService, CanvasDocument } from '../../services/canvas/CanvasAIDriveService';
import { AIDriveFile } from '../../services/drive/aiDriveService';
import { useAuth } from '../../contexts/AuthContext';
import { GenieDriveTree } from '../geniedrive/GenieDriveTree';

interface CanvasDocumentBrowserProps {
  onDocumentSelect: (document: CanvasDocument) => void;
  onCreateNew: () => void;
  className?: string;
  assistantInfo?: { name?: string; description?: string; type?: string };
}

export function CanvasDocumentBrowser({
  onDocumentSelect,
  onCreateNew,
  className,
  assistantInfo
}: CanvasDocumentBrowserProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string>();

  // Initialize AI Drive workspace with templates and folders
  const initializeWorkspace = async () => {
    if (!user?.id) return;

    console.log('📁 AI DRIVE INIT: Starting workspace initialization for user:', user.id);
    setLoading(true);
    try {
      await canvasAIDriveService.initializeAIDriveWorkspace(user.id, assistantInfo);
      console.log('🎉 AI DRIVE INIT: Workspace initialized successfully');
      // Force reload by remounting or triggering update in tree (not implemented yet but ideally tree auto-updates)
      // For now, simple delay to let DB settle
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('❌ AI DRIVE INIT ERROR: Failed to initialize workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (file: AIDriveFile) => {
    if (!user?.id) return;

    setSelectedFileId(file.id);
    console.log('📁 DOCUMENT SELECT:', file.name);

    try {
      const canvasDoc = await canvasAIDriveService.loadCanvasFromAIDrive(user.id, file.id);
      onDocumentSelect(canvasDoc);
    } catch (error) {
      console.error('❌ DOCUMENT SELECT ERROR:', error);
      alert(`Failed to load document: ${error.message || 'Unknown error'}`);
    }
  };

  if (!user) {
    return (
      <Card className={cn("h-full", className)}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Please sign in to access your documents</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("h-full flex flex-col border-0 shadow-none bg-transparent", className)}>
      <div className="pb-2 px-1">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Storage</h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={initializeWorkspace}
              title="Initialize Workspace"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Folder className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onCreateNew}
              title="New Document"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="flex-1 overflow-hidden p-0 min-h-0">
        <GenieDriveTree
          onFileSelect={handleFileSelect}
          selectedFileId={selectedFileId}
          className="pr-2"
        />
      </CardContent>
    </Card>
  );
}

export default CanvasDocumentBrowser;
