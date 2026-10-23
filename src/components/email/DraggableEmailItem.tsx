import React, { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { 
  Star, 
  StarOff, 
  Paperclip, 
  Calendar, 
  Tag,
  Clock,
  Flag,
  Archive,
  Trash2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { EmailMessage, EmailFolder } from '../../services/email/types';
import { Badge } from '../ui/Badge';
import { formatDistanceToNow } from 'date-fns';

interface DraggableEmailItemProps {
  email: EmailMessage;
  isSelected: boolean;
  onSelect: (emailId: string, isSelected: boolean) => void;
  onClick: (email: EmailMessage) => void;
  onStar: (emailId: string) => void;
  onArchive: (emailId: string) => void;
  onDelete: (emailId: string) => void;
  onDrop?: (emailIds: string[], targetFolderId: string) => void;
  showTags?: boolean;
  className?: string;
}

interface DragItem {
  type: 'EMAIL';
  emailIds: string[];
}

export function DraggableEmailItem({
  email,
  isSelected,
  onSelect,
  onClick,
  onStar,
  onArchive,
  onDelete,
  onDrop,
  showTags = true,
  className
}: DraggableEmailItemProps) {
  const [isDragging, setIsDragging] = useState(false);

  // Drag functionality
  const [{ opacity }, drag] = useDrag({
    type: 'EMAIL',
    item: (): DragItem => {
      setIsDragging(true);
      return {
        type: 'EMAIL',
        emailIds: isSelected ? [email.id] : [email.id] // For now, just drag the single email
      };
    },
    end: () => {
      setIsDragging(false);
    },
    collect: (monitor) => ({
      opacity: monitor.isDragging() ? 0.5 : 1,
    }),
  });

  // Drop functionality (for dropping onto this email to group/batch)
  const [{ isOver }, drop] = useDrop({
    accept: 'EMAIL',
    drop: (item: DragItem) => {
      // Handle drop logic if needed (e.g., for grouping emails)
      console.log('Dropped emails:', item.emailIds, 'onto email:', email.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect(email.id, e.target.checked);
  };

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStar(email.id);
  };

  const handleArchiveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onArchive(email.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(email.id);
  };

  // Traditional drag and drop support for EmailFolders compatibility
  const handleDragStart = (e: React.DragEvent) => {
    const emailIds = isSelected ? [email.id] : [email.id]; // Include all selected emails if this one is selected
    e.dataTransfer.setData('application/json', JSON.stringify(emailIds));
    e.dataTransfer.effectAllowed = 'move';
  };

  const emailDate = new Date(email.date);
  const isToday = new Date().toDateString() === emailDate.toDateString();

  return (
    <div
      ref={(node) => drag(drop(node))}
      style={{ opacity }}
      draggable={true}
      onDragStart={handleDragStart}
      className={cn(
        'flex items-center gap-3 p-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-all duration-200',
        isSelected && 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
        isDragging && 'cursor-grabbing',
        isOver && 'bg-green-50 dark:bg-green-950/20',
        !email.read && 'font-medium bg-white dark:bg-gray-900',
        className
      )}
      onClick={() => onClick(email)}
    >
      {/* Selection Checkbox */}
      <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleCheckboxChange}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
        />
      </div>

      {/* Star */}
      <div className="flex-shrink-0">
        <button
          onClick={handleStarClick}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          title={email.starred ? 'Remove star' : 'Star email'}
        >
          {email.starred ? (
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
          ) : (
            <StarOff className="h-4 w-4 text-gray-400" />
          )}
        </button>
      </div>

      {/* Important Flag */}
      {email.important && (
        <div className="flex-shrink-0">
          <Flag className="h-4 w-4 text-yellow-600" />
        </div>
      )}

      {/* From */}
      <div className="flex-shrink-0 w-48 min-w-0">
        <div className="truncate text-sm text-gray-900 dark:text-gray-100">
          {typeof email.from === 'string' ? email.from : (email.from?.name || email.from?.email || 'Unknown')}
        </div>
      </div>

      {/* Subject and Preview */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-sm truncate',
            !email.read ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
          )}>
            {email.subject}
          </span>
          
          {/* Attachments indicator */}
          {email.attachments && email.attachments.length > 0 && (
            <Paperclip className="h-3 w-3 text-gray-400 flex-shrink-0" />
          )}
          
          {/* Calendar event indicator */}
          {(email as any).hasCalendarEvent && (
            <Calendar className="h-3 w-3 text-blue-500 flex-shrink-0" />
          )}
        </div>
        
        {/* Preview text */}
        {(email.snippet || email.preview) && (
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
            {email.snippet || email.preview}
          </div>
        )}
      </div>

      {/* Tags */}
      {showTags && email.labels && email.labels.length > 0 && (
        <div className="flex-shrink-0 flex gap-1 max-w-32">
          {email.labels.slice(0, 2).map((label, index) => (
            <Badge
              key={typeof label === 'string' ? label : label.id || index}
              variant="secondary"
              className="text-xs px-1.5 py-0.5 truncate"
              style={{ backgroundColor: typeof label === 'string' ? '#666666' : label.color }}
            >
              {typeof label === 'string' ? label : label.name}
            </Badge>
          ))}
          {email.labels.length > 2 && (
            <span className="text-xs text-gray-500">+{email.labels.length - 2}</span>
          )}
        </div>
      )}

      {/* Date */}
      <div className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400 w-16 text-right">
        {isToday 
          ? emailDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : formatDistanceToNow(emailDate, { addSuffix: true })
        }
      </div>

      {/* Quick Actions */}
      <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleArchiveClick}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          title="Archive"
        >
          <Archive className="h-3 w-3 text-gray-400" />
        </button>
        <button
          onClick={handleDeleteClick}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          title="Delete"
        >
          <Trash2 className="h-3 w-3 text-red-400" />
        </button>
      </div>
    </div>
  );
}
