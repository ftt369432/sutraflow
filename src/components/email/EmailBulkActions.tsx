import React from 'react';
import { CheckSquare, Archive, Star, Trash2, Folder } from 'lucide-react';

interface EmailBulkActionsProps {
  selectedCount: number;
  onCreateTasks: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onMove: () => void;
  onStar: () => void;
}

export function EmailBulkActions({
  selectedCount,
  onCreateTasks,
  onArchive,
  onDelete,
  onMove,
  onStar
}: EmailBulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-2 flex items-center space-x-2">
      <span className="text-sm text-gray-600 mr-2">
        {selectedCount} selected
      </span>
      <button
        onClick={onCreateTasks}
        className="flex items-center px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
      >
        <CheckSquare size={16} className="mr-2" />
        Create Tasks
      </button>
      <button
        onClick={onStar}
        className="p-2 hover:bg-gray-100 rounded-lg"
        title="Star"
      >
        <Star size={16} />
      </button>
      <button
        onClick={onArchive}
        className="p-2 hover:bg-gray-100 rounded-lg"
        title="Archive"
      >
        <Archive size={16} />
      </button>
      <button
        onClick={onMove}
        className="p-2 hover:bg-gray-100 rounded-lg"
        title="Move to folder"
      >
        <Folder size={16} />
      </button>
      <button
        onClick={onDelete}
        className="p-2 hover:bg-gray-100 rounded-lg text-red-600"
        title="Delete"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}