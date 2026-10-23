import React from 'react';
import { AlertTriangle, X, FileIcon, FolderIcon, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Progress } from '../ui/progress';
import { AIDriveFile } from '../../services/drive/aiDriveService';

interface GenieDriveBulkDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
  items: AIDriveFile[];
  isDeleting?: boolean;
  progress?: { completed: number; total: number };
}

export function GenieDriveBulkDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirmDelete,
  items,
  isDeleting = false,
  progress
}: GenieDriveBulkDeleteModalProps) {
  if (!isOpen) return null;

  const fileCount = items.filter(item => !item.is_folder).length;
  const folderCount = items.filter(item => item.is_folder).length;
  const totalSize = items.reduce((sum, item) => sum + (item.size || 0), 0);
  const sizeText = totalSize > 0 ? `${(totalSize / 1024 / 1024).toFixed(1)} MB` : '';

  // Show first few items, then "and X more"
  const displayItems = items.slice(0, 3);
  const remainingCount = Math.max(0, items.length - 3);

  const progressPercentage = progress ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium text-red-600">
            Delete {items.length} Item{items.length !== 1 ? 's' : ''}
          </h2>
          {!isDeleting && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close dialog"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-2">
                Are you sure you want to delete these items?
              </h3>
              
              {/* Item summary */}
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    {fileCount > 0 && (
                      <div className="flex items-center gap-1">
                        <FileIcon className="h-4 w-4 text-gray-500" />
                        <span>{fileCount} file{fileCount !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {folderCount > 0 && (
                      <div className="flex items-center gap-1">
                        <FolderIcon className="h-4 w-4 text-blue-500" />
                        <span>{folderCount} folder{folderCount !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                  {sizeText && (
                    <span className="text-gray-600 font-medium">{sizeText}</span>
                  )}
                </div>
              </div>

              {/* Preview of items being deleted */}
              <div className="space-y-2 mb-3">
                {displayItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    {item.is_folder ? (
                      <FolderIcon className="h-4 w-4 text-blue-500" />
                    ) : (
                      <FileIcon className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="truncate flex-1" title={item.name}>
                      {item.name}
                    </span>
                  </div>
                ))}
                {remainingCount > 0 && (
                  <div className="text-sm text-gray-600 font-medium">
                    and {remainingCount} more item{remainingCount !== 1 ? 's' : ''}...
                  </div>
                )}
              </div>
              
              <p className="text-gray-600 text-sm">
                {folderCount > 0 
                  ? "This will permanently delete all selected items and their contents. This action cannot be undone."
                  : "This will permanently delete all selected items. This action cannot be undone."}
              </p>

              {/* Progress indicator */}
              {isDeleting && progress && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Deleting items...</span>
                    <span>{progress.completed} of {progress.total}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirmDelete}
            disabled={isDeleting}
            className="min-w-[100px]"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              `Delete ${items.length} Item${items.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
