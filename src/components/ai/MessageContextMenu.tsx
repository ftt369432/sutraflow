import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '../ui/ContextMenu';
import { Message } from '../../types/ai';
import { 
  Copy, 
  Share, 
  Bookmark, 
  ThumbsUp, 
  ThumbsDown, 
  Code, 
  Download,
  Trash2,
  MessageSquare,
  Reply,
  Edit,
  Pin
} from 'lucide-react';

interface MessageContextMenuProps {
  children: React.ReactNode;
  message: Message;
  onCopy: () => void;
  onShare: () => void;
  onBookmark: () => void;
  onLike: () => void;
  onDislike: () => void;
  onToggleCode: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onReply: () => void;
  onEdit: () => void;
  onPin: () => void;
  isBookmarked: boolean;
  isLiked: boolean | null;
  showingCode: boolean;
  isPinned: boolean;
}

export function MessageContextMenu({
  children,
  message,
  onCopy,
  onShare,
  onBookmark,
  onLike,
  onDislike,
  onToggleCode,
  onDelete,
  onDownload,
  onReply,
  onEdit,
  onPin,
  isBookmarked,
  isLiked,
  showingCode,
  isPinned
}: MessageContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem onClick={onCopy}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Message
          <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={onShare}>
          <Share className="mr-2 h-4 w-4" />
          Share Message
          <ContextMenuShortcut>⌘S</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={onDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download
          <ContextMenuShortcut>⌘D</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onBookmark}>
          <Bookmark className={`mr-2 h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
          {isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
        </ContextMenuItem>
        <ContextMenuItem onClick={onPin}>
          <Pin className={`mr-2 h-4 w-4 ${isPinned ? 'fill-current' : ''}`} />
          {isPinned ? 'Unpin Message' : 'Pin Message'}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onLike}>
          <ThumbsUp className={`mr-2 h-4 w-4 ${isLiked === true ? 'fill-current' : ''}`} />
          Like
        </ContextMenuItem>
        <ContextMenuItem onClick={onDislike}>
          <ThumbsDown className={`mr-2 h-4 w-4 ${isLiked === false ? 'fill-current' : ''}`} />
          Dislike
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onToggleCode}>
          <Code className="mr-2 h-4 w-4" />
          {showingCode ? 'Hide Code View' : 'Show Code View'}
        </ContextMenuItem>
        <ContextMenuItem onClick={onReply}>
          <Reply className="mr-2 h-4 w-4" />
          Reply
        </ContextMenuItem>
        <ContextMenuItem onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Message
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDelete} className="text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
          <ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
} 