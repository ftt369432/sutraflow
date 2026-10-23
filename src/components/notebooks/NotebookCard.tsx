import React from 'react';
import { Book, Star, MoreVertical, Bot } from 'lucide-react';
import type { Notebook } from '../../types/notebook';
import { Button } from '../ui/Button';

interface NotebookCardProps {
  notebook: Notebook;
  onSelect: (id: string) => void;
  onStar?: (id: string) => void;
  onArchive?: (id: string) => void;
}

export function NotebookCard({ notebook, onSelect, onStar, onArchive }: NotebookCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div
      className="group relative bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors cursor-pointer"
      onClick={() => onSelect(notebook.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-700 rounded-lg">
            <Book className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-white font-medium line-clamp-1">{notebook.title}</h3>
            <p className="text-sm text-gray-400">
              Updated {formatDate(notebook.updatedAt)}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Description */}
      {notebook.metadata?.description && (
        <p className="mt-3 text-sm text-gray-400 line-clamp-2">
          {notebook.metadata.description}
        </p>
      )}

      {/* Tags */}
      {notebook.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {notebook.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs rounded-full bg-gray-700 text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* AI Assistants */}
      {notebook.aiAssistants && notebook.aiAssistants.length > 0 && (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
          <Bot className="h-4 w-4" />
          <span className="line-clamp-1">
            {notebook.aiAssistants.map(a => a.name).join(', ')}
          </span>
        </div>
      )}

      {/* Priority Indicator */}
      {notebook.metadata?.priority === 'high' && (
        <div className="absolute top-2 right-2">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            notebook.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
          }`} />
          <span className="capitalize">{notebook.status}</span>
        </div>
        {notebook.collaborators && notebook.collaborators.length > 0 && (
          <div className="flex -space-x-2">
            {notebook.collaborators.slice(0, 3).map((_, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full bg-gray-600 border-2 border-gray-800 flex items-center justify-center text-xs text-white"
              >
                {i === 2 && notebook.collaborators!.length > 3 ? '+' : ''}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 