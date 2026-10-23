import React, { useState } from 'react';
import { Edit, Trash2, FolderPlus, FolderOpen, Move, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { AIFolder } from '../../types/ai';

interface FolderContextMenuProps {
  folder: AIFolder;
  isOpen: boolean;
  onClose: () => void;
  onRename?: (folderId: string, newName: string) => void;
  onDelete?: (folderId: string) => void;
  onCreateSubfolder?: (parentId: string, name: string) => void;
  onMove?: (folderId: string, newParentId: string | null) => void;
  onAssignToAssistant?: (folderId: string, assistantId: string) => void;
  position?: { x: number; y: number };
}

export function FolderContextMenu({
  folder,
  isOpen,
  onClose,
  onRename,
  onDelete,
  onCreateSubfolder,
  onMove,
  onAssignToAssistant,
  position = { x: 0, y: 0 }
}: FolderContextMenuProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(folder.name);
  const [isCreatingSubfolder, setIsCreatingSubfolder] = useState(false);
  const [subfolderName, setSubfolderName] = useState('');

  if (!isOpen) return null;

  const handleRename = () => {
    const newName = window.prompt('Enter new folder name:', folder.name);
    if (newName && newName.trim() !== '') {
      onRename?.(folder.id, newName.trim());
    }
    setIsRenaming(false);
    onClose();
  };

  const handleCreateSubfolder = () => {
    if (subfolderName.trim()) {
      onCreateSubfolder?.(folder.id, subfolderName.trim());
    }
    setIsCreatingSubfolder(false);
    setSubfolderName('');
    onClose();
  };

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${folder.name}"?`)) {
      onDelete?.(folder.id);
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Context Menu */}
      <div
        className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 min-w-[200px]"
        style={{
          left: position.x,
          top: position.y,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Quick Actions */}
        <button
          onClick={() => setIsRenaming(true)}
          className="w-full flex items-center space-x-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Edit className="h-4 w-4" />
          <span>Rename Folder</span>
        </button>

        <button
          onClick={() => setIsCreatingSubfolder(true)}
          className="w-full flex items-center space-x-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <FolderPlus className="h-4 w-4" />
          <span>Create Subfolder</span>
        </button>

        {onMove && (
          <button
            onClick={() => {
              // This would open a folder picker modal
              console.log('Move folder:', folder.id);
              onClose();
            }}
            className="w-full flex items-center space-x-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Move className="h-4 w-4" />
            <span>Move Folder</span>
          </button>
        )}

        {onAssignToAssistant && (
          <button
            onClick={() => {
              // This would open assistant picker
              console.log('Assign folder to assistant:', folder.id);
              onClose();
            }}
            className="w-full flex items-center space-x-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Users className="h-4 w-4" />
            <span>Assign to Assistant</span>
          </button>
        )}

        <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

        <button
          onClick={handleDelete}
          className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete Folder</span>
        </button>

        {/* Rename Modal */}
        {isRenaming && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleRename()}
                className="text-sm"
                placeholder="Enter folder name"
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsRenaming(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleRename}
                  disabled={!newName.trim()}
                >
                  Rename
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Create Subfolder Modal */}
        {isCreatingSubfolder && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              <Input
                value={subfolderName}
                onChange={(e) => setSubfolderName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateSubfolder()}
                className="text-sm"
                placeholder="Enter subfolder name"
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsCreatingSubfolder(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateSubfolder}
                  disabled={!subfolderName.trim()}
                >
                  Create
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 