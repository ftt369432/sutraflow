import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { AIDriveFile } from '../../services/drive/aiDriveService';

interface GenieDriveDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
  item: AIDriveFile;
}

export function GenieDriveDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirmDelete,
  item
}: GenieDriveDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium text-red-600">Delete {item.is_folder ? 'Folder' : 'File'}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">
                Are you sure you want to delete {item.is_folder ? 'this folder' : 'this file'}?
              </h3>
              <p className="text-gray-600">
                {item.is_folder 
                  ? "This will permanently delete the folder and all its contents. This action cannot be undone."
                  : "This will permanently delete this file. This action cannot be undone."}
              </p>
            </div>
          </div>
          
          <div className="bg-red-50 p-3 rounded-md text-sm text-red-700 mb-4">
            <p className="font-medium">Item to delete: {item.name}</p>
            {item.is_folder && <p>All contents within this folder will also be deleted.</p>}
          </div>
        </div>
        
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirmDelete}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
