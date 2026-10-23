import React, { useState, useEffect } from 'react';
import { X, Folder, HardDrive } from 'lucide-react';
import { Button } from '../ui/Button';
import { AIDriveFile, AIDriveService } from '../../services/drive/aiDriveService';
import { cn } from '../../lib/utils';

interface GenieDriveMoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (targetFolderId: string | null) => void;
  items: AIDriveFile[];
  aiDriveService: AIDriveService;
  userId: string;
}

export function GenieDriveMoveModal({ 
  isOpen, 
  onClose, 
  onMove, 
  items, 
  aiDriveService, 
  userId 
}: GenieDriveMoveModalProps) {
  const [folders, setFolders] = useState<AIDriveFile[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadFolders();
    }
  }, [isOpen, items]);

  const loadFolders = async () => {
    setIsLoading(true);
    try {
      const allItems = await aiDriveService.listFiles(null, { include_trashed: false });
      // Exclude items that are currently selected for move to prevent circular moves
      const excludedIds = new Set(items.map(i => i.id));
      const topLevelFolders = allItems.filter(f => f.is_folder && !excludedIds.has(f.id));
      setFolders(topLevelFolders);
    } catch (error) {
      console.error('Failed to load folders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-medium dark:text-white">
            {items.length === 1 ? `Move "${items[0].name}"` : `Move ${items.length} items`}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-grow">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Select a destination folder:
          </p>
          
          <div className="space-y-1">
            <button
              onClick={() => setSelectedFolderId(null)}
              className={cn(
                "flex items-center w-full px-3 py-2 rounded-md text-left text-sm transition-colors",
                selectedFolderId === null 
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100 font-medium" 
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
              )}
            >
              <HardDrive className="h-4 w-4 mr-3 text-gray-500" />
              <span>My Drive (Root)</span>
            </button>

            {isLoading ? (
              <div className="py-4 text-center text-sm text-gray-500">Loading folders...</div>
            ) : folders.length === 0 ? (
              <div className="py-4 text-center text-sm text-gray-500 italic">No other folders found.</div>
            ) : (
              folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={cn(
                    "flex items-center w-full px-3 py-2 rounded-md text-left text-sm transition-colors",
                    selectedFolderId === folder.id 
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100 font-medium" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
                  )}
                >
                  <Folder className="h-4 w-4 mr-3 text-blue-500" />
                  <span className="flex-grow truncate">{folder.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
        
        <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="dark:bg-gray-800 dark:text-gray-200">
            Cancel
          </Button>
          <Button onClick={() => onMove(selectedFolderId)} disabled={isLoading}>
            Move Here
          </Button>
        </div>
      </div>
    </div>
  );
}
