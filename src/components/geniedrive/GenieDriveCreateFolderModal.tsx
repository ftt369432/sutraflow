import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface GenieDriveCreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (folderName: string) => void;
  currentFolderName?: string;
}

export function GenieDriveCreateFolderModal({ 
  isOpen, 
  onClose, 
  onCreateFolder,
  currentFolderName 
}: GenieDriveCreateFolderModalProps) {
  const [folderName, setFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    
    setIsCreating(true);
    try {
      await onCreateFolder(folderName.trim());
      setFolderName('');
      onClose();
    } catch (error) {
      console.error('Error creating folder:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setFolderName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FolderPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Folder</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentFolderName ? `in ${currentFolderName}` : 'in My Drive'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="folder-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Folder Name
              </label>
              <Input
                id="folder-name"
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Untitled folder"
                className="w-full"
                autoFocus
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!folderName.trim() || isCreating}
              className="flex items-center space-x-2"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <FolderPlus className="h-4 w-4" />
                  <span>Create</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 