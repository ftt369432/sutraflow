import React from 'react';
import { Search, Tag } from 'lucide-react';

interface ContactFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTags: string[];
  onTagSelect: (tag: string) => void;
  availableTags: string[];
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export function ContactFilters({
  searchQuery,
  onSearchChange,
  selectedTags,
  onTagSelect,
  availableTags,
  viewMode,
  onViewModeChange,
}: ContactFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search contacts..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded-lg ${
              viewMode === 'grid'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded-lg ${
              viewMode === 'list'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {availableTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagSelect(tag)}
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                selectedTags.includes(tag)
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Tag size={14} className="mr-1" />
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}