import React from 'react';
import { 
  Star, 
  StarOff, 
  Trash2, 
  FolderOpen, 
  Brain, 
  X, 
  Download,
  Share,
  Copy,
  MoreHorizontal 
} from 'lucide-react';
import { Button } from '../ui/Button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import { AIDriveFile } from '../../services/drive/aiDriveService';

interface GenieDriveBulkActionsToolbarProps {
  selectedCount: number;
  selectedItems: AIDriveFile[];
  onBulkDelete: () => void;
  onBulkStar: (starred: boolean) => void;
  onBulkMove?: () => void;
  onBulkDuplicate?: () => void;
  onBulkAnalyze?: () => void;
  onBulkDownload?: () => void;
  onBulkShare?: () => void;
  onClearSelection: () => void;
  isProcessing?: boolean;
}

export function GenieDriveBulkActionsToolbar({
  selectedCount,
  selectedItems,
  onBulkDelete,
  onBulkStar,
  onBulkMove,
  onBulkDuplicate,
  onBulkAnalyze,
  onBulkDownload,
  onBulkShare,
  onClearSelection,
  isProcessing = false
}: GenieDriveBulkActionsToolbarProps) {
  if (selectedCount === 0) return null;

  const totalSize = selectedItems.reduce((sum, item) => sum + (item.size || 0), 0);
  const sizeText = totalSize > 0 ? `${(totalSize / 1024 / 1024).toFixed(1)} MB` : '';
  const hasStarredItems = selectedItems.some(item => item.is_starred);
  const hasUnstarredItems = selectedItems.some(item => !item.is_starred);
  const fileCount = selectedItems.filter(item => !item.is_folder).length;

  return (
    <>
      {/* Desktop/Tablet Toolbar */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 hidden sm:block">
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-6 py-3 flex items-center gap-4 max-w-4xl">
          {/* Selection Info */}
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md font-medium text-sm min-w-[3rem] text-center">
              {selectedCount}
            </div>
            <div className="text-sm">
              <span className="font-medium">
                {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
              </span>
              {sizeText && (
                <span className="text-gray-500 ml-2">({sizeText})</span>
              )}
            </div>
          </div>

          {/* Primary Actions */}
          <div className="flex items-center gap-1">
            {/* Star/Unstar */}
            {hasUnstarredItems && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => onBulkStar(true)}
                disabled={isProcessing}
                title="Star selected items"
              >
                <Star className="h-4 w-4" />
              </Button>
            )}
            {hasStarredItems && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => onBulkStar(false)}
                disabled={isProcessing}
                title="Unstar selected items"
              >
                <StarOff className="h-4 w-4" />
              </Button>
            )}

            {/* Move */}
            {onBulkMove && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={onBulkMove}
                disabled={isProcessing}
                title="Move selected items"
              >
                <FolderOpen className="h-4 w-4" />
              </Button>
            )}

            {/* AI Analyze */}
            {onBulkAnalyze && fileCount > 0 && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={onBulkAnalyze}
                disabled={isProcessing}
                title="Analyze with AI"
              >
                <Brain className="h-4 w-4" />
              </Button>
            )}

            {/* More Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="sm" 
                  variant="ghost"
                  disabled={isProcessing}
                  title="More actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                {onBulkDownload && fileCount > 0 && (
                  <DropdownMenuItem onClick={onBulkDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download ({fileCount} file{fileCount !== 1 ? 's' : ''})
                  </DropdownMenuItem>
                )}
                {onBulkShare && (
                  <DropdownMenuItem onClick={onBulkShare}>
                    <Share className="mr-2 h-4 w-4" />
                    Share selected items
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                
                {/* Addition of Move and Copy to dropdown for easier discovery */}
                <DropdownMenuItem onClick={onBulkMove}>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Move to folder...
                </DropdownMenuItem>
                
                {onBulkDuplicate && (
                  <DropdownMenuItem onClick={onBulkDuplicate}>
                    <Copy className="mr-2 h-4 w-4" />
                    Make a copy
                  </DropdownMenuItem>
                )}
                
                {(onBulkDownload || onBulkShare || onBulkMove || onBulkDuplicate) && <DropdownMenuSeparator />}
                <DropdownMenuItem 
                  onClick={onBulkDelete}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50/90"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete {selectedCount} item{selectedCount !== 1 ? 's' : ''}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Delete */}
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={onBulkDelete}
              disabled={isProcessing}
              title="Delete selected items"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Clear Selection */}
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onClearSelection}
            disabled={isProcessing}
            title="Clear selection"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50 sm:hidden">
        <div className="flex justify-between items-center mb-3">
          <div>
            <span className="font-medium text-sm">
              {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
            </span>
            {sizeText && (
              <span className="text-gray-500 text-xs ml-2">({sizeText})</span>
            )}
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onClearSelection}
            disabled={isProcessing}
          >
            Clear
          </Button>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {/* Star */}
          {(hasUnstarredItems || hasStarredItems) && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onBulkStar(!hasStarredItems)}
              disabled={isProcessing}
              className="flex flex-col items-center py-3 h-auto"
            >
              {hasStarredItems ? (
                <StarOff className="h-4 w-4 mb-1" />
              ) : (
                <Star className="h-4 w-4 mb-1" />
              )}
              <span className="text-xs">
                {hasStarredItems ? 'Unstar' : 'Star'}
              </span>
            </Button>
          )}

          {/* Move */}
          {onBulkMove && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onBulkMove}
              disabled={isProcessing}
              className="flex flex-col items-center py-3 h-auto"
            >
              <FolderOpen className="h-4 w-4 mb-1" />
              <span className="text-xs">Move</span>
            </Button>
          )}

          {/* AI Analyze */}
          {onBulkAnalyze && fileCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onBulkAnalyze}
              disabled={isProcessing}
              className="flex flex-col items-center py-3 h-auto"
            >
              <Brain className="h-4 w-4 mb-1" />
              <span className="text-xs">Analyze</span>
            </Button>
          )}

          {/* Delete */}
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={onBulkDelete}
            disabled={isProcessing}
            className="flex flex-col items-center py-3 h-auto"
          >
            <Trash2 className="h-4 w-4 mb-1" />
            <span className="text-xs">Delete</span>
          </Button>
        </div>
      </div>
    </>
  );
}
