import React, { useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import type { AIFolder } from '../../types/ai';

interface FolderActionsProps {
  folder: AIFolder;
  position: { x: number; y: number };
  onClose: () => void;
  onRename: (folderId: string, newName: string) => void;
  onDelete: (folderId: string) => void;
}

export function FolderActions({
  folder,
  position,
  onClose,
  onRename,
  onDelete,
}: FolderActionsProps) {
  const handleRename = () => {
    const newName = window.prompt('Enter new folder name:', folder.name);
    if (newName && newName.trim() !== '') {
      onRename(folder.id, newName.trim());
    }
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${folder.name}"?`)) {
      onDelete(folder.id);
    }
    onClose();
  };

  return (
    <div
      style={{ top: position.y, left: position.x }}
      className="absolute z-50 bg-white rounded-md shadow-lg border text-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <ul className="py-1">
        <li
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
          onClick={handleRename}
        >
          <Edit className="w-4 h-4 mr-2" />
          Rename
        </li>
        <li
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center text-red-600"
          onClick={handleDelete}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </li>
      </ul>
    </div>
  );
} 