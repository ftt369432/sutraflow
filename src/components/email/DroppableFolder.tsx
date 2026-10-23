import React from 'react';
import { useDrop } from 'react-dnd';
import { Folder, FolderOpen, Mail } from 'lucide-react';
import { cn } from '../../lib/utils';
import { EmailFolder } from '../../services/email/types';
import { Badge } from '../ui/Badge';

interface DroppableFolderProps {
  folder: EmailFolder;
  isSelected?: boolean;
  isExpanded?: boolean;
  onSelect: (folder: EmailFolder) => void;
  onDrop: (emailIds: string[], targetFolderId: string) => void;
  onToggleExpanded?: () => void;
  className?: string;
  level?: number;
}

interface DragItem {
  type: 'EMAIL';
  emailIds: string[];
}

export function DroppableFolder({
  folder,
  isSelected = false,
  isExpanded = false,
  onSelect,
  onDrop,
  onToggleExpanded,
  className,
  level = 0
}: DroppableFolderProps) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'EMAIL',
    drop: (item: DragItem) => {
      onDrop(item.emailIds, folder.id);
    },
    canDrop: (item: DragItem) => {
      // Don't allow dropping into certain system folders
      const restrictedFolders = ['SENT', 'DRAFT', 'OUTBOX'];
      return !restrictedFolders.includes(folder.name.toUpperCase());
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const handleClick = () => {
    onSelect(folder);
  };

  const handleToggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpanded?.();
  };

  const hasSubfolders = folder.subfolders && folder.subfolders.length > 0;
  const paddingLeft = level * 16 + 12;

  return (
    <div
      ref={drop}
      className={cn(
        'group cursor-pointer transition-all duration-200',
        className
      )}
    >
      <div
        onClick={handleClick}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
          isSelected && 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
          !isSelected && 'hover:bg-gray-100 dark:hover:bg-gray-800',
          isOver && canDrop && 'bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-600',
          isOver && !canDrop && 'bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-600'
        )}
        style={{ paddingLeft }}
      >
        {/* Expand/Collapse Button */}
        {hasSubfolders && (
          <button
            onClick={handleToggleExpanded}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <div className={cn(
              'w-0 h-0 border-l-4 border-l-gray-600 border-t-2 border-t-transparent border-b-2 border-b-transparent transition-transform',
              isExpanded && 'rotate-90'
            )} />
          </button>
        )}

        {/* Folder Icon */}
        <div className="flex-shrink-0">
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-blue-500" />
          ) : (
            <Folder className="h-4 w-4 text-gray-500" />
          )}
        </div>

        {/* Folder Name */}
        <span className={cn(
          'flex-1 text-sm truncate',
          isSelected ? 'font-medium' : 'font-normal'
        )}>
          {folder.displayName || folder.name}
        </span>

        {/* Unread Count */}
        {folder.unreadCount > 0 && (
          <Badge 
            variant="secondary" 
            className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
          >
            {folder.unreadCount}
          </Badge>
        )}

        {/* Total Count */}
        {folder.totalCount > 0 && folder.unreadCount === 0 && (
          <span className="text-xs text-gray-400">
            {folder.totalCount}
          </span>
        )}

        {/* Drop Indicator */}
        {isOver && canDrop && (
          <div className="flex-shrink-0">
            <Mail className="h-3 w-3 text-green-600" />
          </div>
        )}
      </div>

      {/* Subfolders */}
      {hasSubfolders && isExpanded && (
        <div className="mt-1">
          {folder.subfolders?.map((subfolder) => (
            <DroppableFolder
              key={subfolder.id}
              folder={subfolder}
              isSelected={isSelected}
              onSelect={onSelect}
              onDrop={onDrop}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
