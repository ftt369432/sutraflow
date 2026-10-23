import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AIDriveFile } from '../../services/drive/aiDriveService';

interface GenieDriveRenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: (newName: string) => void;
  item: AIDriveFile;
}

export function GenieDriveRenameModal({ isOpen, onClose, onRename, item }: GenieDriveRenameModalProps) {
  const [newName, setNewName] = useState(item.name);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Get file extension if it's a file
  const getNameWithoutExtension = (filename: string) => {
    if (item.is_folder) return filename;
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex === -1 ? filename : filename.substring(0, lastDotIndex);
  };

  const getExtension = (filename: string) => {
    if (item.is_folder) return '';
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex === -1 ? '' : filename.substring(lastDotIndex);
  };

  const extension = getExtension(item.name);
  const nameWithoutExtension = getNameWithoutExtension(item.name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate new name
    if (!newName.trim()) {
      setError('Name cannot be empty');
      return;
    }

    // Add extension back for files
    const finalName = item.is_folder ? newName.trim() : newName.trim() + extension;
    
    onRename(finalName);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium">Rename {item.is_folder ? 'Folder' : 'File'}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-4">
            <div className="mb-4">
              <label htmlFor="new-name" className="block text-sm font-medium text-gray-700 mb-1">
                New name
              </label>
              <div className="flex">
                <Input
                  id="new-name"
                  value={item.is_folder ? newName : newName.split('.')[0]}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full"
                  placeholder="Enter new name"
                  autoFocus
                />
                {!item.is_folder && extension && (
                  <span className="flex items-center bg-gray-100 px-3 rounded-r-md border border-l-0 text-gray-500">
                    {extension}
                  </span>
                )}
              </div>
              {error && (
                <p className="text-sm text-red-500 mt-1">{error}</p>
              )}
            </div>
          </div>
          
          <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Rename
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
