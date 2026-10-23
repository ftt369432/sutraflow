import React from 'react';
import { X, Folder } from 'lucide-react';
import type { EmailFolder } from '../../services/email/folderService';

interface EmailMoveDialogProps {
  folders: EmailFolder[];
  onClose: () => void;
  onMove: (folderId: string) => void;
}

export function EmailMoveDialog({ folders, onClose, onMove }: EmailMoveDialogProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium">Move to Folder</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-2">
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => {
                  onMove(folder.id);
                  onClose();
                }}
                className="w-full flex items-center px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                <Folder size={18} className="mr-3 text-gray-400" />
                <span className="text-sm">{folder.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}