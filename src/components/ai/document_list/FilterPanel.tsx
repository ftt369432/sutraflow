import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../ui/Sheet'; // Removed SheetTrigger as it will be in parent
import { DocumentIcon } from '../../ui/DocumentIcon';
import { Tag, Calendar, X, Check } from 'lucide-react';

// Assuming these types are defined in or imported into DocumentList.tsx or a shared types file
// Re-define or import them if necessary
export type SortOption = 'dateDesc' | 'dateAsc' | 'nameAsc' | 'nameDesc' | 'typeAsc' | 'typeDesc';
export type DocumentType = string; // Matches corrected type in DocumentList

export interface Filters {
  types: DocumentType[];
  tags: string[];
  dateFrom: Date | null;
  dateTo: Date | null;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: Filters;
  sortBy: SortOption; // Assuming presets can also store sort option
}

export interface FilterStats {
  types: Record<string, number>;
  tags: Record<string, number>;
}

interface FilterPanelProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  uniqueDocumentTypes: string[];
  uniqueTags: string[];
  filterStats: FilterStats;
  clearFilters: () => void;
  filterPresets: FilterPreset[];
  saveFilterPreset: (name: string) => void; // Simplified: receives name, uses current filters/sortBy from parent state
  applyFilterPreset: (preset: FilterPreset) => void;
  deleteFilterPreset: (id: string) => void;
  // sortBy: SortOption; // If preset saving directly uses sortBy from parent
  // setSortBy: React.Dispatch<React.SetStateAction<SortOption>>; // If sort is also managed here
}

const DEFAULT_DOC_TYPE = 'text' as const; // From DocumentList

export function FilterPanel({
  isOpen,
  onOpenChange,
  filters,
  setFilters,
  uniqueDocumentTypes,
  uniqueTags,
  filterStats,
  clearFilters,
  filterPresets,
  saveFilterPreset,
  applyFilterPreset,
  deleteFilterPreset,
}: FilterPanelProps) {
  const [newPresetName, setNewPresetName] = useState('');

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[400px] flex flex-col p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Filter Documents</SheetTitle>
        </SheetHeader>
        <div className="flex-grow overflow-y-auto p-4 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-lg">Filters</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 text-muted-foreground hover:text-foreground"
            >
              Clear all filters
            </Button>
          </div>

          {/* Document Types */}
          <motion.div initial={false} animate={{ height: 'auto' }} transition={{ duration: 0.2 }}>
            <h4 className="font-medium mb-2 flex items-center justify-between text-base">
              <div className="flex items-center">
                <DocumentIcon type={DEFAULT_DOC_TYPE} className="h-5 w-5 mr-2" />
                <span>Document Types</span>
              </div>
              {filters.types.length > 0 && (
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  {filters.types.length} selected
                </span>
              )}
            </h4>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {uniqueDocumentTypes.map(type => (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center justify-between p-1.5 rounded hover:bg-accent/50"
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`type-${type}`}
                      checked={filters.types.includes(type as DocumentType)}
                      onChange={e => {
                        setFilters(prev => ({
                          ...prev,
                          types: e.target.checked
                            ? [...prev.types, type as DocumentType]
                            : prev.types.filter(t => t !== type)
                        }));
                      }}
                      className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor={`type-${type}`} className="text-sm capitalize select-none cursor-pointer">
                      {type}
                    </label>
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                    {filterStats.types[type] || 0}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Tags */}
          <motion.div initial={false} animate={{ height: 'auto' }} transition={{ duration: 0.2 }}>
            <h4 className="font-medium mb-2 flex items-center justify-between text-base">
              <div className="flex items-center">
                <Tag className="h-5 w-5 mr-2" />
                <span>Tags</span>
              </div>
              {filters.tags.length > 0 && (
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  {filters.tags.length} selected
                </span>
              )}
            </h4>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {uniqueTags.map(tag => (
                <motion.div
                  key={tag}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center justify-between p-1.5 rounded hover:bg-accent/50"
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`tag-${tag}`}
                      checked={filters.tags.includes(tag)}
                      onChange={e => {
                        setFilters(prev => ({
                          ...prev,
                          tags: e.target.checked
                            ? [...prev.tags, tag]
                            : prev.tags.filter(t => t !== tag)
                        }));
                      }}
                      className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor={`tag-${tag}`} className="text-sm select-none cursor-pointer">
                      {tag}
                    </label>
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                    {filterStats.tags[tag] || 0}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Date Range */}
          <motion.div initial={false} animate={{ height: 'auto' }} transition={{ duration: 0.2 }}>
            <h4 className="font-medium mb-2 flex items-center text-base">
              <Calendar className="h-5 w-5 mr-2" />
              Date Range
            </h4>
            <div className="space-y-2">
              <div>
                <label htmlFor="dateFrom" className="text-sm text-muted-foreground">From</label>
                <Input
                  type="date"
                  id="dateFrom"
                  className="w-full mt-1 text-sm"
                  value={filters.dateFrom?.toISOString().split('T')[0] || ''}
                  onChange={e => {
                    setFilters(prev => ({
                      ...prev,
                      dateFrom: e.target.value ? new Date(e.target.value) : null
                    }));
                  }}
                />
              </div>
              <div>
                <label htmlFor="dateTo" className="text-sm text-muted-foreground">To</label>
                <Input
                  type="date"
                  id="dateTo"
                  className="w-full mt-1 text-sm"
                  value={filters.dateTo?.toISOString().split('T')[0] || ''}
                  onChange={e => {
                    setFilters(prev => ({
                      ...prev,
                      dateTo: e.target.value ? new Date(e.target.value) : null
                    }));
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* Filter Presets */}
          <div className="border-t pt-6 mt-6">
            <h4 className="font-medium mb-3 text-base">Filter Presets</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="New preset name..."
                  value={newPresetName}
                  onChange={e => setNewPresetName(e.target.value)}
                  className="text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (newPresetName.trim()) {
                      saveFilterPreset(newPresetName.trim());
                      setNewPresetName('');
                    }
                  }}
                  disabled={!newPresetName.trim()}
                >
                  Save
                </Button>
              </div>
              {filterPresets.length === 0 && <p className='text-xs text-muted-foreground text-center py-2'>No presets saved yet.</p>}
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {filterPresets.map(preset => (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between p-2 hover:bg-accent/50 rounded-md text-sm"
                  >
                    <span className="select-none cursor-pointer hover:text-primary" onClick={() => applyFilterPreset(preset)}>{preset.name}</span>
                    <div className="flex items-center gap-1">
                       <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-primary"
                        onClick={() => applyFilterPreset(preset)}
                        title="Apply preset"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteFilterPreset(preset.id)}
                        title="Delete preset"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Active Filters Summary - Footer */}
        {(filters.types.length > 0 || filters.tags.length > 0 || filters.dateFrom || filters.dateTo) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border-t p-3 bg-background mt-auto flex-shrink-0"
          >
            <h4 className="font-medium mb-2 text-xs uppercase text-muted-foreground">Active Filters</h4>
            <div className="flex flex-wrap gap-1.5">
              {filters.types.map(type => (
                <motion.span
                  key={type}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="inline-flex items-center pl-1.5 pr-0.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
                >
                  <DocumentIcon type={type} className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className='mr-0.5'>{type}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 rounded-full hover:bg-destructive/20 hover:text-destructive-foreground"
                    onClick={() => {
                      setFilters(prev => ({
                        ...prev,
                        types: prev.types.filter(t => t !== type)
                      }));
                    }}
                  >
                    <X className="h-2.5 w-2.5" />
                  </Button>
                </motion.span>
              ))}
              {filters.tags.map(tag => (
                <motion.span
                  key={tag}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="inline-flex items-center pl-1.5 pr-0.5 py-0.5 rounded-full bg-secondary/20 text-secondary-foreground text-xs font-medium"
                >
                  <Tag className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className='mr-0.5'>{tag}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 rounded-full hover:bg-destructive/20 hover:text-destructive-foreground"
                    onClick={() => {
                      setFilters(prev => ({
                        ...prev,
                        tags: prev.tags.filter(t => t !== tag)
                      }));
                    }}
                  >
                    <X className="h-2.5 w-2.5" />
                  </Button>
                </motion.span>
              ))}
              {(filters.dateFrom || filters.dateTo) && (
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="inline-flex items-center pl-1.5 pr-0.5 py-0.5 rounded-full bg-accent/20 text-accent-foreground text-xs font-medium"
                >
                  <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className='mr-0.5'>
                    {filters.dateFrom?.toLocaleDateString(undefined, { day: 'numeric', month: 'short'})} - 
                    {filters.dateTo?.toLocaleDateString(undefined, { day: 'numeric', month: 'short'})}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 rounded-full hover:bg-destructive/20 hover:text-destructive-foreground"
                    onClick={() => {
                      setFilters(prev => ({
                        ...prev,
                        dateFrom: null,
                        dateTo: null
                      }));
                    }}
                  >
                    <X className="h-2.5 w-2.5" />
                  </Button>
                </motion.span>
              )}
            </div>
          </motion.div>
        )}
      </SheetContent>
    </Sheet>
  );
} 