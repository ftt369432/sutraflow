import React from 'react';
import { Archive, Trash2, FolderPlus, CheckSquare } from 'lucide-react';

interface EmailToolbarProps {
  selectedCount: number;
  onArchive: () => void;
  onDelete: () => void;
  onMove: () => void;
  onCreateTasks: () => void;
}

export function EmailToolbar({ selectedCount, onArchive, onDelete, onMove, onCreateTasks }: EmailToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 flex gap-2">
      <button
        onClick={onArchive}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2"
      >
        <Archive className="h-5 w-5" />
        <span>Archive</span>
      </button>
      <button
        onClick={onDelete}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400"
      >
        <Trash2 className="h-5 w-5" />
        <span>Delete</span>
      </button>
      <button
        onClick={onMove}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2"
      >
        <FolderPlus className="h-5 w-5" />
        <span>Move</span>
      </button>
      <button
        onClick={onCreateTasks}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2"
      >
        <CheckSquare className="h-5 w-5" />
        <span>Create Tasks</span>
      </button>
    </div>
  );
}