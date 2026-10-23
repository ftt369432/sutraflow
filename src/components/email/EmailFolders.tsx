import React, { useState } from 'react';
import { 
  Inbox, 
  Send, 
  Archive, 
  Trash2, 
  Plus,
  Folder
} from 'lucide-react';
import type { EmailFolder } from '../../types';

interface EmailFoldersProps {
  folders: EmailFolder[];
  selectedFolder: string;
  onSelectFolder: (folderId: string) => void;
  onCreateFolder: () => void;
  unreadCounts: Record<string, number>;
  onDropEmails?: (folderId: string, emailIds: string[]) => void;
}

const systemFolders = [
  { id: 'inbox', name: 'Inbox', icon: Inbox },
  { id: 'sent', name: 'Sent', icon: Send },
  { id: 'archive', name: 'Archive', icon: Archive },
  { id: 'trash', name: 'Trash', icon: Trash2 },
];

export function EmailFolders({ 
  folders, 
  selectedFolder, 
  onSelectFolder, 
  onCreateFolder,
  unreadCounts,
  onDropEmails
}: EmailFoldersProps) {
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolder(folderId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverFolder(null);
  };

  const handleDrop = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    setDragOverFolder(null);
    
    try {
      const emailIds = JSON.parse(e.dataTransfer.getData('application/json'));
      if (onDropEmails && Array.isArray(emailIds)) {
        onDropEmails(folderId, emailIds);
      }
    } catch (error) {
      console.error('Failed to parse dropped email data:', error);
    }
  };

  const FolderButton = ({ 
    id, 
    name, 
    icon: Icon, 
    count, 
    isSystem = false 
  }: { 
    id: string; 
    name: string; 
    icon: any; 
    count?: number; 
    isSystem?: boolean;
  }) => (
    <button
      onClick={() => onSelectFolder(id)}
      onDragOver={(e) => handleDragOver(e, id)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, id)}
      className={`
        w-full px-2 py-1.5 rounded-md flex items-center justify-between text-sm
        folder-drop-target transition-colors
        ${selectedFolder === id 
          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
        }
        ${dragOverFolder === id ? 'bg-blue-100 dark:bg-blue-900/30' : ''}
      `}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span className="truncate">{name}</span>
      </div>
      {count && count > 0 && (
        <span className={`px-1.5 py-0.5 rounded-full text-xs ${
          selectedFolder === id 
            ? 'bg-blue-100 text-blue-700' 
            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
  return (
    <div className="space-y-2">
      {/* System Folders */}
      <div className="space-y-1">
        {systemFolders.map(({ id, name, icon }) => (
          <FolderButton
            key={id}
            id={id}
            name={name}
            icon={icon}
            count={unreadCounts[id]}
            isSystem={true}
          />
        ))}
      </div>

      {/* Custom Folders */}
      {folders.length > 0 && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Custom</h3>
            <button
              onClick={onCreateFolder}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400 hover:text-gray-600"
              title="Create folder"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-1">
            {folders.map(folder => (
              <FolderButton
                key={folder.id}
                id={folder.id}
                name={folder.name}
                icon={Folder}
                count={unreadCounts[folder.id] || 0}
                isSystem={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}