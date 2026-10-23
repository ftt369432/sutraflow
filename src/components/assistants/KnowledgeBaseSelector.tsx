import { useState } from 'react';
import { Folder, Plus, FileText, Check, AlertCircle } from 'lucide-react';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { useAssistantStore } from '../../store/assistantStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { DocumentUploader } from '../knowledge/DocumentUploader';
import type { AIFolder } from '../../types/ai';

interface KnowledgeBaseSelectorProps {
  selectedFolderIds: string[];
  onSelectFolder: (folderIds: string[]) => void;
  assistantId?: string;
}

/**
 * Component for selecting knowledge base folders for assistants
 */
export function KnowledgeBaseSelector({ 
  selectedFolderIds,
  onSelectFolder,
  assistantId
}: KnowledgeBaseSelectorProps) {
  const { folders, addFolder } = useKnowledgeBaseStore();
  const { linkFolderToAssistant, unlinkFolderFromAssistant } = useAssistantStore();
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);

  // Handle folder selection
  const handleFolderSelect = async (folderId: string) => {
    try {
      setLoading(prev => ({ ...prev, [folderId]: true }));
      setError(null);

      if (selectedFolderIds.includes(folderId)) {
        onSelectFolder(selectedFolderIds.filter(id => id !== folderId));
        if (assistantId) {
          await unlinkFolderFromAssistant(assistantId, folderId);
        }
      } else {
        onSelectFolder([...selectedFolderIds, folderId]);
        if (assistantId) {
          await linkFolderToAssistant(assistantId, folderId);
        }
      }
    } catch (err) {
      console.error('Error toggling folder:', err);
      setError(err instanceof Error ? err.message : 'Failed to update folder selection');
    } finally {
      setLoading(prev => ({ ...prev, [folderId]: false }));
    }
  };

  // Create a new folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      setLoading(prev => ({ ...prev, 'new': true }));
      setError(null);
      
      const newFolder: AIFolder = {
        id: `folder-${Date.now()}`,
        name: newFolderName.trim(),
        documents: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      addFolder(newFolder);
      
      // If we have an assistantId, assign this folder to it
      if (assistantId) {
        await linkFolderToAssistant(assistantId, newFolder.id);
        onSelectFolder([...selectedFolderIds, newFolder.id]);
      }
      
      setNewFolderName('');
      setShowNewFolderDialog(false);
    } catch (err) {
      console.error('Error creating folder:', err);
      setError(err instanceof Error ? err.message : 'Failed to create folder');
    } finally {
      setLoading(prev => ({ ...prev, 'new': false }));
    }
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Knowledge Base Folders</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNewFolderDialog(true)}
          disabled={loading['new']}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Folder
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-2 mb-4 text-red-600 bg-red-50 rounded">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="space-y-2">
        {folders.map((folder) => (
          <div key={folder.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
            <div className="flex items-center gap-2">
              <Checkbox
                id={folder.id}
                checked={selectedFolderIds.includes(folder.id)}
                onCheckedChange={() => handleFolderSelect(folder.id)}
                disabled={loading[folder.id]}
              />
              <label htmlFor={folder.id} className="flex items-center gap-2 cursor-pointer">
                <Folder className="h-4 w-4 text-blue-500" />
                {folder.name}
              </label>
            </div>
            {loading[folder.id] && <span className="text-blue-500">...</span>}
          </div>
        ))}

        {folders.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            No folders available. Create a new folder to get started.
          </p>
        )}
      </div>

      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Knowledge Base Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                disabled={loading['new']}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowNewFolderDialog(false)}
                disabled={loading['new']}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || loading['new']}
              >
                {loading['new'] ? (
                  <span className="flex items-center gap-2">
                    Creating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Folder
                  </span>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}