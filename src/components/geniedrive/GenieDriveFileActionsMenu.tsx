import React from 'react';
import { MoreHorizontal, Pencil, Trash2, Copy, Download, Share, Brain, Star as StarIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import { AIDriveFile } from '../../services/drive/aiDriveService';

export interface GenieDriveFileActionsMenuProps {
  item: AIDriveFile;
  onRenameRequest: () => void;
  onDeleteRequest: () => void;
  onMoveRequest: () => void;
  onDownloadRequest?: () => void;
  onCopyRequest?: () => void;
  onShareRequest?: () => void;
  onLinkToKnowledgeBaseRequest?: () => void;
  isLinkedToKnowledgeBase?: boolean;
  onToggleStarRequest: () => void;
  isStarred: boolean;
}

export function GenieDriveFileActionsMenu({
  item,
  onRenameRequest,
  onDeleteRequest,
  onMoveRequest,
  onDownloadRequest,
  onCopyRequest,
  onShareRequest,
  onLinkToKnowledgeBaseRequest,
  isLinkedToKnowledgeBase,
  onToggleStarRequest,
  isStarred,
}: GenieDriveFileActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className="p-1 rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          onClick={(e) => {
            e.stopPropagation();
          }}
          aria-label={`Actions for ${item.name}`}
        >
          <MoreHorizontal className="h-5 w-5 text-muted-foreground hover:text-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel className="truncate" title={item.name}>{item.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleStarRequest(); }}>
          <StarIcon className={`mr-2 h-4 w-4 ${isStarred ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
          <span>{isStarred ? 'Unstar' : 'Star'}</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRenameRequest(); }}>
          <Pencil className="mr-2 h-4 w-4" />
          <span>Rename</span>
        </DropdownMenuItem>
        
        {!item.is_folder && onDownloadRequest && (
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDownloadRequest(); }}>
            <Download className="mr-2 h-4 w-4" />
            <span>Download</span>
          </DropdownMenuItem>
        )}
        
        {onCopyRequest && (
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCopyRequest(); }}>
            <Copy className="mr-2 h-4 w-4" />
            <span>Make a copy</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMoveRequest(); }}>
          <Copy className="mr-2 h-4 w-4 rotate-90" />
          <span>Move to folder...</span>
        </DropdownMenuItem>
        
        {onShareRequest && (
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShareRequest(); }}>
            <Share className="mr-2 h-4 w-4" />
            <span>Share</span>
          </DropdownMenuItem>
        )}
        
        {!item.is_folder && onLinkToKnowledgeBaseRequest && (
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onLinkToKnowledgeBaseRequest(); }}>
            <Brain className="mr-2 h-4 w-4" />
            <span>{isLinkedToKnowledgeBase ? 'Unlink from KB' : 'Link to KB'}</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="text-red-600 focus:text-red-600 focus:bg-red-50/90 data-[highlighted]:bg-red-50/90 data-[highlighted]:text-red-700"
          onClick={(e) => { e.stopPropagation(); onDeleteRequest(); }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
