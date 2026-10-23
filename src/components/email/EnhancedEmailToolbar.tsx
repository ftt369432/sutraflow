import React, { useState } from 'react';
import { 
  Archive, 
  Trash2, 
  FolderPlus, 
  CheckSquare, 
  Tag,
  Star,
  StarOff,
  MoreHorizontal,
  Calendar,
  Clock,
  Flag,
  Copy,
  Forward,
  Reply,
  Download,
  Folder
} from 'lucide-react';
import { Button } from '../ui/Button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '../ui/DropdownMenu';
import { Badge } from '../ui/Badge';
import { EmailMessage, EmailFolder } from '../../services/email/types';

interface EnhancedEmailToolbarProps {
  selectedEmails: EmailMessage[];
  folders: EmailFolder[];
  onArchive: () => void;
  onDelete: () => void;
  onMove: (folderId: string) => void;
  onCreateTasks: () => void;
  onAddTags: (tags: string[]) => void;
  onRemoveTags: (tags: string[]) => void;
  onMarkAsRead: () => void;
  onMarkAsUnread: () => void;
  onStar: () => void;
  onUnstar: () => void;
  onMarkImportant: () => void;
  onMarkUnimportant: () => void;
  onCreateCalendarEvents: () => void;
  onSnooze: (duration: string) => void;
  onExport: () => void;
  availableTags?: string[];
}

export function EnhancedEmailToolbar({ 
  selectedEmails,
  folders,
  onArchive,
  onDelete,
  onMove,
  onCreateTasks,
  onAddTags,
  onRemoveTags,
  onMarkAsRead,
  onMarkAsUnread,
  onStar,
  onUnstar,
  onMarkImportant,
  onMarkUnimportant,
  onCreateCalendarEvents,
  onSnooze,
  onExport,
  availableTags = []
}: EnhancedEmailToolbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  if (selectedEmails.length === 0) return null;

  const hasUnread = selectedEmails.some(email => !email.read);
  const hasRead = selectedEmails.some(email => email.read);
  const hasStarred = selectedEmails.some(email => email.starred);
  const hasUnstarred = selectedEmails.some(email => !email.starred);

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-2 z-50 max-w-4xl">
      <div className="flex items-center gap-2 mr-4">
        <Badge variant="secondary" className="text-sm">
          {selectedEmails.length} selected
        </Badge>
      </div>

      {/* Primary Actions */}
      <div className="flex items-center gap-1">
        <Button
          onClick={onArchive}
          variant="ghost"
          size="sm"
          className="gap-2"
          title="Archive emails"
        >
          <Archive className="h-4 w-4" />
          Archive
        </Button>

        <Button
          onClick={onDelete}
          variant="ghost"
          size="sm"
          className="gap-2 text-red-600 hover:text-red-700"
          title="Delete emails"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>

        {/* Move to Folder */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <FolderPlus className="h-4 w-4" />
              Move
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-56">
            {folders.map(folder => (
              <DropdownMenuItem
                key={folder.id}
                onClick={() => onMove(folder.id)}
                className="gap-2"
              >
                <Folder className="h-4 w-4" />
                {folder.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick Actions */}
        {hasUnstarred && (
          <Button
            onClick={onStar}
            variant="ghost"
            size="sm"
            className="gap-2"
            title="Star emails"
          >
            <Star className="h-4 w-4" />
          </Button>
        )}
        
        {hasStarred && (
          <Button
            onClick={onUnstar}
            variant="ghost"
            size="sm"
            className="gap-2"
            title="Remove star"
          >
            <StarOff className="h-4 w-4" />
          </Button>
        )}

        <Button
          onClick={onCreateCalendarEvents}
          variant="ghost"
          size="sm"
          className="gap-2"
          title="Create calendar events"
        >
          <Calendar className="h-4 w-4" />
          Calendar
        </Button>
      </div>

      {/* More Actions Menu */}
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <MoreHorizontal className="h-4 w-4" />
            More
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {/* Read/Unread Actions */}
          {hasUnread && (
            <DropdownMenuItem onClick={onMarkAsRead} className="gap-2">
              <CheckSquare className="h-4 w-4" />
              Mark as read
            </DropdownMenuItem>
          )}
          {hasRead && (
            <DropdownMenuItem onClick={onMarkAsUnread} className="gap-2">
              <CheckSquare className="h-4 w-4" />
              Mark as unread
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />

          {/* Importance Actions */}
          <DropdownMenuItem onClick={onMarkImportant} className="gap-2">
            <Flag className="h-4 w-4" />
            Mark as important
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onMarkUnimportant} className="gap-2">
            <Flag className="h-4 w-4" />
            Mark as not important
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Tagging */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <Tag className="h-4 w-4" />
              Add tags
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {availableTags.map(tag => (
                <DropdownMenuItem
                  key={tag}
                  onClick={() => onAddTags([tag])}
                  className="gap-2"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Snooze */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <Clock className="h-4 w-4" />
              Snooze
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => onSnooze('1hour')} className="gap-2">
                <Clock className="h-3 w-3" />
                1 hour
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSnooze('tomorrow')} className="gap-2">
                <Clock className="h-3 w-3" />
                Tomorrow 8 AM
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSnooze('next-week')} className="gap-2">
                <Clock className="h-3 w-3" />
                Next week
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          {/* Tasks and Calendar */}
          <DropdownMenuItem onClick={onCreateTasks} className="gap-2">
            <CheckSquare className="h-4 w-4" />
            Create tasks
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Export */}
          <DropdownMenuItem onClick={onExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export selected
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
