import React from 'react';
import { X, Folder } from 'lucide-react';
import type { EmailFolder } from '../../types';

interface MoveToFolderDialogProps {
  folders: EmailFolder[];
  onMove: (folderId: string) => void;
  onClose: () => void;
}

export function MoveToFolderDialog({ folders, onMove, onClose }: MoveToFolderDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Move to Folder</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="space-y-2">
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => onMove(folder.id)}
                className="w-full p-3 flex items-center gap-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Folder className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span>{folder.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 