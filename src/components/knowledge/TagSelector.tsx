import React from 'react';
import { Tag as TagIcon } from 'lucide-react';

interface TagSelectorProps {
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  showFilters?: boolean;
}

export function TagSelector({ selectedTags, onToggleTag, showFilters }: TagSelectorProps) {
  // Only show the filter button when showFilters is true
  if (!showFilters) {
    return null;
  }

  // Fixed set of legal-focused predefined tags
  const predefinedTags = [
    // Case types
    'litigation', 'contract', 'corporate', 'immigration', 'family', 'criminal', 'civil',
    'employment', 'intellectual-property', 'tax', 'real-estate', 'bankruptcy',
    
    // Document types
    'agreement', 'brief', 'memo', 'pleading', 'motion', 'discovery', 'transcript',
    'evidence', 'exhibit', 'filing', 'correspondence', 'report',
    
    // Status tags
    'urgent', 'important', 'pending', 'reviewed', 'archived', 'draft', 'final',
    
    // General categories
    'client', 'court', 'research', 'billing', 'meeting', 'note', 'template'
  ];
  
  return (
    <div className="flex flex-wrap gap-2">
      {predefinedTags.map((tag) => (
        <button
          key={tag}
          onClick={() => onToggleTag(tag)}
          className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 transition-colors border ${
            selectedTags.includes(tag)
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
          }`}
        >
          <TagIcon className="h-3 w-3" />
          {tag}
        </button>
      ))}
    </div>
  );
} 