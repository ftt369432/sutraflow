// BulkActionsMenu component
import { CheckSquare, Trash2, Edit2, Move, Download, Bot, Brain, Eye, Star } from 'lucide-react';
import { useState } from 'react';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { Button } from '../ui/Button';
import { useSelection } from './EnhancedSelectionContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '../ui/DropdownMenu';
import { useToast } from '../ui/useToast';

interface BulkActionsMenuProps {
  currentFolderId?: string | null;
  allFolderIds: string[];
  allDocumentIds: string[];
  onBulkMove?: (targetFolderId: string) => void;
  onBulkDelete?: () => void;
  onBulkDownload?: () => void;
  onBulkStar?: () => void;
  onBulkAssignToAssistant?: () => void;
  onBulkAssignToTask?: () => void;
}

export function BulkActionsMenu({ 
  allFolderIds, 
  allDocumentIds,
  onBulkMove,
  onBulkDelete,
  onBulkDownload,
  onBulkStar,
  onBulkAssignToAssistant,
  onBulkAssignToTask
}: BulkActionsMenuProps) {
  const { 
    selectedFolders, 
    selectedDocuments, 
    selectAll, 
    deselectAll, 
    hasSelection 
  } = useSelection();
  
  const { folders } = useKnowledgeBaseStore();
  const { toast } = useToast();

  const handleSelectAll = () => {
    selectAll(allFolderIds, allDocumentIds);
  };

  const handleDeselectAll = () => {
    deselectAll();
  };

  const handleDeleteSelected = () => {
    if (!hasSelection) return;
    
    // Confirm before deleting
    if (!window.confirm(`Are you sure you want to delete ${selectedFolders.length} folders and ${selectedDocuments.length} documents?`)) {
      return;
    }
    
    if (onBulkDelete) {
      onBulkDelete();
      
      toast({
        title: "Items deleted",
        description: `Successfully deleted ${selectedFolders.length} folders and ${selectedDocuments.length} documents`,
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      {hasSelection ? (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeselectAll}
            className="text-xs"
          >
            Clear Selection ({selectedFolders.length + selectedDocuments.length})
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                Bulk Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Core Features */}
              <DropdownMenuItem
                onClick={() => {
                  toast({
                    title: "View Details",
                    description: "Please select a single item to view details",
                  });
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* AI Features */}
              <DropdownMenuItem
                onClick={() => {
                  if (onBulkAssignToAssistant) {
                    onBulkAssignToAssistant();
                  }
                }}
              >
                <Brain className="mr-2 h-4 w-4" />
                Process with AI
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={() => {
                  if (onBulkAssignToTask) {
                    onBulkAssignToTask();
                  }
                }}
              >
                <Bot className="mr-2 h-4 w-4" />
                Assign to Assistant
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* File Management */}
              <DropdownMenuItem 
                onClick={() => {
                  // Check if exactly one document is selected
                  if (Array.isArray(selectedDocuments) 
                      ? selectedDocuments.length === 1 
                      : (selectedDocuments as unknown as Set<string>).size === 1) {
                    // Logic for renaming a single file
                    toast({
                      title: "Rename",
                      description: "Opening rename dialog...",
                    });
                  } else {
                    toast({
                      title: "Rename",
                      description: "Please select a single item to rename it",
                    });
                  }
                }}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Rename Selected
              </DropdownMenuItem>
              
              {/* Move to folder */}
              {onBulkMove && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center">
                    <Move className="mr-2 h-4 w-4" />
                    Move to Folder
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-48">
                    <DropdownMenuItem
                      onClick={() => onBulkMove('')}
                      className="flex items-center"
                    >
                      📁 Root Folder
                    </DropdownMenuItem>
                    {folders.map((folder) => (
                      <DropdownMenuItem
                        key={folder.id}
                        onClick={() => onBulkMove(folder.id)}
                        className="flex items-center"
                      >
                        📂 {folder.name}
                      </DropdownMenuItem>
                    ))}
                    {folders.length === 0 && (
                      <DropdownMenuItem disabled className="text-gray-500">
                        No folders available
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              
              {/* Star */}
              <DropdownMenuItem
                onClick={() => {
                  if (onBulkStar) {
                    onBulkStar();
                  }
                }}
              >
                <Star className="mr-2 h-4 w-4" />
                Star Selected
              </DropdownMenuItem>
              
              {/* Download */}
              <DropdownMenuItem
                onClick={() => {
                  if (onBulkDownload) {
                    onBulkDownload();
                  } else {
                    toast({
                      title: "Download",
                      description: "Preparing documents for download...",
                    });
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Selected
              </DropdownMenuItem>
              
              {/* Assign to Task */}
              <DropdownMenuItem
                onClick={() => {
                  if (onBulkAssignToTask) {
                    onBulkAssignToTask();
                  }
                }}
              >
                <CheckSquare className="mr-2 h-4 w-4" />
                Assign to Task
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Danger Zone */}
              <DropdownMenuItem onClick={handleDeleteSelected} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="text-xs"
          >
            <CheckSquare className="mr-2 h-3 w-3" />
            Select All
          </Button>
          <span className="text-xs text-muted-foreground">
            Click checkboxes or use dropdown menus to select items
          </span>
        </div>
      )}
    </div>
  );
}
