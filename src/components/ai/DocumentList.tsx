import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Search, 
  Plus, 
  ArrowUpDown, 
  Trash2, 
  X, 
  Download,
  SlidersHorizontal
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ScrollArea } from '../ui/ScrollArea';
import { AIDocument, Message, /*Folder*/ } from '../../types/ai'; // Removed Folder type
import { Select, SelectContent, SelectItem, SelectTrigger as SelectUiTrigger, SelectValue } from '../ui/Select';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { DocumentViewer } from './DocumentViewer';
import { DocumentCard, adaptAIDocumentToUnified } from '../common/DocumentCard';
import { FilterPanel, type FilterPreset, type SortOption, type FilterStats } from './document_list/FilterPanel'; // Removed PanelFilters, PanelDocumentType

interface Conversation { // Local Conversation type, might need to sync with global one
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  attachments: AIDocument[];
}

// Use the type from AIDocument metadata
type DocumentType = string; // Corrected: Was AIDocument['type']

interface Filters {
  types: DocumentType[];
  tags: string[];
  dateFrom: Date | null;
  dateTo: Date | null;
}

interface SearchHistoryItem {
  query: string;
  filters: Filters;
  sortBy: string;
  timestamp: Date;
}

interface DocumentListProps {
  documents: AIDocument[];
  // folders: Folder[]; // Removed unused prop
  conversations: Conversation[]; // Prop version
  activeConversationId: string | null; // Prop version
  onUpload: (file: File) => void;
  onDelete: (docId: string) => void;
  // Removed unused props: onAddTag, onRemoveTag, onSearch
  onSendMessage?: (message: string, attachments: AIDocument[]) => Promise<void>;
  searchHistory: SearchHistoryItem[];
  setSearchHistory: React.Dispatch<React.SetStateAction<SearchHistoryItem[]>>;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  sortBy: string; // Should be SortOption
  setSortBy: React.Dispatch<React.SetStateAction<string>>; // Should be SortOption
  // availableTags: string[]; // Removed unused prop
  onSavePreset: (name: string) => void; // Added preset prop
  applyFilterPreset: (preset: FilterPreset) => void; // Added preset prop
  onDeletePreset: (id: string) => void; // Added preset prop
  presets: FilterPreset[]; // Added preset prop
  clearSelection: () => void;
  selectedDocuments: Set<string>; // Added selectedDocuments prop
  setSelectedDocuments: React.Dispatch<React.SetStateAction<Set<string>>>; // Added setSelectedDocuments prop
}

export function DocumentList({
  documents,
  // folders, // Removed
  // Removed unused props: conversations, activeConversationId
  onUpload,
  onDelete,
  // Removed unused props: onAddTag, onRemoveTag, onSearch, onSendMessage, searchHistory
  // Removed unused prop: setSearchHistory
  filters,
  setFilters,
  sortBy,
  setSortBy,
  onSavePreset, // Consuming prop
  applyFilterPreset, // Consuming prop
  onDeletePreset, // Consuming prop
  presets, // Consuming prop
  clearSelection,
  selectedDocuments, // Consuming prop
  setSelectedDocuments // Consuming prop
}: DocumentListProps) {
  const [viewingDocument, setViewingDocument] = useState<AIDocument | null>(null);
  // Using renamed prop names for initial state or direct use if state isn't meant to diverge significantly
  // Removed unused state: internalConversations, setInternalConversations, internalActiveConversationId, setInternalActiveConversationId, message, setMessage, attachedDocs, setAttachedDocs
  // const [_showFilters, _setShowFilters] = useState(false); // Commented out as potentially unused, FilterPanel uses showFiltersPanel
  const [searchQuery, setSearchQuery] = useState('');
  const [_isDragging, _setIsDragging] = useState(false); // Prefixed
  // Removed unused dragItem
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [_filterPresets, _setFilterPresets] = useState<FilterPreset[]>(presets); // Prefixed setFilterPresets as filterPresets (prop) is used

  // Removed unused _activeConversation

  // Removed unused useEffect for deleted state

  // Removed unused handleSendMessageInternal

  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = documents;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        (doc.title || doc.metadata.title || '').toLowerCase().includes(query) ||
        (doc.metadata.tags && doc.metadata.tags.some(tag => tag.toLowerCase().includes(query))) || 
        doc.content.toLowerCase().includes(query)
      );
    }
    if (filters.types.length > 0) {
      filtered = filtered.filter(doc => doc.metadata.category && filters.types.includes(doc.metadata.category));
    }
    if (filters.tags.length > 0) {
      filtered = filtered.filter(doc => 
        filters.tags.every(tag => doc.metadata.tags?.includes(tag))
      );
    }
    // Corrected date filtering logic based on new Filters type
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter(doc => {
        const docDate = new Date(doc.metadata.date || 0).getTime();
        const from = filters.dateFrom ? filters.dateFrom.getTime() : 0;
        // Removed unused variable 'to'
        // Ensure 'to' includes the whole day if only a date is provided
        const toEndOfDay = filters.dateTo ? new Date(filters.dateTo).setHours(23, 59, 59, 999) : Date.now();
        return docDate >= from && docDate <= toEndOfDay;
      });
    }
    return filtered.sort((a, b) => {
      switch (sortBy as SortOption) { // Cast sortBy to SortOption
        case 'dateDesc': return new Date(b.metadata.date || 0).getTime() - new Date(a.metadata.date || 0).getTime();
        case 'dateAsc': return new Date(a.metadata.date || 0).getTime() - new Date(b.metadata.date || 0).getTime();
        case 'nameAsc': return (a.title || a.metadata.title || '').localeCompare(b.title || b.metadata.title || '');
        case 'nameDesc': return (b.title || b.metadata.title || '').localeCompare(a.title || a.metadata.title || '');
        case 'typeAsc': return (a.metadata.category || '').localeCompare(b.metadata.category || '');
        case 'typeDesc': return (b.metadata.category || '').localeCompare(a.metadata.category || '');
        default: return 0;
      }
    });
  }, [documents, searchQuery, filters, sortBy]);

  // Removed unused _handleFileDrop

  // Removed unused _handleFileSelect

  const handleDownload = (doc: AIDocument) => {
    const a = window.document.createElement('a');
    const blob = new Blob([doc.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = doc.metadata.title || doc.title || 'document.txt';
    window.document.body.appendChild(a);
    a.click();
  };

  // Removed unused _applySearchHistory

  // Removed unused _clearSearchHistory

  // Removed unused toggleDocumentSelection

  const selectAllDocuments = () => {
    setSelectedDocuments(new Set(filteredAndSortedDocuments.map(doc => doc.id)));
  };

  const batchDownload = () => {
    selectedDocuments.forEach(docId => {
      const doc = documents.find(d => d.id === docId);
      if (doc) handleDownload(doc);
    });
  };

  const batchRemove = () => {
    selectedDocuments.forEach(docId => onDelete(docId));
    clearSelection();
  };

  // Removed unused handleMotionDragStart

  // Removed unused handleMotionDragEnd

  const autocompleteSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const words = new Set<string>();
    documents.forEach(doc => {
      (doc.metadata.title || doc.title || '').toLowerCase().split(/\s+/).forEach(word => words.add(word));
      
      if (doc.content) {
        doc.content.toLowerCase().slice(0, 500).split(/\s+/).forEach(word => words.add(word));
      }
      if (doc.metadata.tags) {
        doc.metadata.tags.forEach(tag => words.add(tag.toLowerCase()));
      }
    });
    return Array.from(words).filter(word => word.includes(searchQuery.toLowerCase()) && word !== searchQuery.toLowerCase()).slice(0, 5);
  }, [documents, searchQuery]);

  const uniqueTypes = useMemo(() => 
    Array.from(new Set(documents.map(doc => doc.metadata.category || 'unknown'))),
    [documents]
  );

  const uniqueTags = useMemo(() => Array.from(new Set(documents.flatMap(doc => doc.metadata.tags || []))), [documents]);

  const filterStats = useMemo(() => {
    const stats: FilterStats = { // Used imported FilterStats
      types: {},
      tags: {}
    };
    documents.forEach(doc => {
      const type = doc.metadata.category || 'unknown';
      stats.types[type] = (stats.types[type] || 0) + 1;
      doc.metadata.tags?.forEach(tag => {
        stats.tags[tag] = (stats.tags[tag] || 0) + 1;
      });
    });
    return stats;
  }, [documents]);

  const handleCardSelection = (_documentId: string, _ctrlOrMetaPressed: boolean) => { // Prefixed params
    // if (_ctrlOrMetaPressed) {
    //   toggleDocumentSelection(_documentId);
    // }
  };

  // Removed unused handleCardContextMenuSelect

  const handleChatAboutDocument = (_document: AIDocument) => { // Prefixed param
    // Example: Start a new conversation or add to existing one with this document as context
    // This could involve setting this document as an attachment for the next message
  };

  // Removed unused handleDeleteDocument

  return (
    <div className={cn("flex flex-col h-full bg-background", "p-1 md:p-2 lg:p-3")}>
      {/* Top Bar: Search, Filters Trigger, Sort Select, Upload Button */}
      <div className="p-2 md:p-3 mb-2 md:mb-3 rounded-lg shadow bg-card">
        <div className="flex flex-col sm:flex-row items-center gap-2 mb-2">
          {/* Search Input with Autocomplete */}
          <div className="relative flex-grow w-full sm:w-auto">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                  placeholder="Search documents..."
                            value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-full"
                    />
                    {searchQuery && autocompleteSuggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute z-20 w-full bg-popover border rounded-md shadow-lg mt-1 py-1"
                      >
                        {autocompleteSuggestions.map(suggestion => (
                          <div 
                            key={suggestion}
                            className="px-3 py-1.5 hover:bg-accent cursor-pointer text-sm"
                            onClick={() => { setSearchQuery(suggestion); /* Consider closing suggestions */ }}
                          >
                            {suggestion}
                            </div>
                        ))}
                      </motion.div>
                    )}
                  </div>

          {/* Action Buttons: Filter Trigger, Sort, Upload */}
          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-between sm:justify-start">
            <Button variant="outline" onClick={() => setShowFiltersPanel(true)} className="w-full sm:w-auto">
              <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
              {(filters.types.length > 0 || filters.tags.length > 0 || filters.dateFrom || filters.dateTo) && 
                <Badge variant="secondary" className="ml-2">Active</Badge>}
                      </Button>
            
            {/* Corrected Select Component Usage for Sorting */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectUiTrigger className="w-full sm:w-[170px]"> {/* Corrected: SelectTrigger to SelectUiTrigger */}
                            <div className="flex items-center">
                    <ArrowUpDown className="h-4 w-4 mr-2 flex-shrink-0" />
                    <SelectValue placeholder="Sort by..." />
                            </div>
              </SelectUiTrigger> {/* Corrected: SelectTrigger to SelectUiTrigger */}
              <SelectContent>
                <SelectItem value="dateDesc">Date (Newest)</SelectItem>
                <SelectItem value="dateAsc">Date (Oldest)</SelectItem>
                <SelectItem value="nameAsc">Name (A-Z)</SelectItem>
                <SelectItem value="nameDesc">Name (Z-A)</SelectItem>
                <SelectItem value="typeAsc">Type (A-Z)</SelectItem>
                <SelectItem value="typeDesc">Type (Z-A)</SelectItem>
                {/* <SelectItem value="relevance">Relevance</SelectItem> // If implementing relevance sort */}
              </SelectContent>
            </Select>

            {onUpload && (
              <label htmlFor="document-upload-button" className="hidden sm:inline-block">
                <Button variant="default" asChild>
                  <span><Plus className="h-4 w-4 mr-0 sm:mr-2" /> <span className="hidden sm:inline">Upload</span></span>
                </Button>
                <input id="document-upload-button" type="file" multiple className="hidden" onChange={(e) => e.target.files && Array.from(e.target.files).forEach(onUpload)} />
                                  </label>
            )}
                                </div>
                          </div>
                            </div>

      {/* Selected Documents Actions Bar */}
      <AnimatePresence>
        {selectedDocuments.size > 0 && (
                          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="p-2 mb-2 rounded-lg bg-primary/10 flex flex-col sm:flex-row items-center justify-between gap-2 shadow"
          >
            <div className="text-sm font-medium text-primary">
              {selectedDocuments.size} document{selectedDocuments.size > 1 ? 's' : ''} selected
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
              <Button variant="ghost" size="sm" onClick={selectAllDocuments} className="text-primary hover:text-primary/80">
                  Select All ({filteredAndSortedDocuments.length})
                                  </Button>
              <Button variant="ghost" size="sm" onClick={clearSelection} className="text-primary hover:text-primary/80">
                  <X className="h-4 w-4 mr-1" /> Clear
                                  </Button>
              <Button variant="outline" size="sm" onClick={batchDownload} className="border-primary/50 text-primary hover:bg-primary/10">
                  <Download className="h-4 w-4 mr-1" /> Download
                                  </Button>
              <Button variant="destructive" size="sm" onClick={batchRemove} className="border-primary/50 text-primary hover:bg-primary/10">
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Grid / List Area */}
      <ScrollArea className="flex-grow">
        {filteredAndSortedDocuments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-16 w-16 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No Documents Found</p>
            <p className="text-sm">Try adjusting your search or filters, or upload new documents.</p>
            {/* Optional: Central upload button for empty state */}
                    </div>
        ) : (
          <div className={cn(
              "grid gap-3 p-0.5",
              "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
              // Consider making grid columns responsive to sidebar states if sidebars are re-introduced
          )}>
              <AnimatePresence>
                  {filteredAndSortedDocuments.map(document => (                <DocumentCard
                      key={document.id}
                  document={adaptAIDocumentToUnified(document)}
                  variant="knowledge"
                  viewMode="grid"
                  showActions={true}
                  isSelected={selectedDocuments.has(document.id)}
                  onClick={() => handleCardSelection(document.id, false)}
                  onPreview={() => setViewingDocument(document)}
                  onDelete={() => onDelete(document.id)}
                  onChat={() => handleChatAboutDocument(document)}
                />
              ))}
              </AnimatePresence>
            </div>
          )}
      </ScrollArea>

      {/* FilterPanel Component (Sheet) */}
      <FilterPanel
        isOpen={showFiltersPanel}
        onOpenChange={setShowFiltersPanel}
        filters={filters}
        setFilters={setFilters}
        uniqueDocumentTypes={uniqueTypes}
        uniqueTags={uniqueTags}
        filterStats={filterStats}
        clearFilters={clearSelection} // Potentially should be a dedicated clearFilters function
        filterPresets={_filterPresets} // Pass down state
        saveFilterPreset={onSavePreset} // Pass down prop
        applyFilterPreset={applyFilterPreset} // Pass down prop
        deleteFilterPreset={onDeletePreset} // Pass down prop
      />

      {/* Document Viewer Dialog */}
        <DocumentViewer
          document={viewingDocument}
          onClose={() => setViewingDocument(null)}
          onDownload={handleDownload}
          renderCodePreview={(content, lang) => 
              <SyntaxHighlighter language={lang || 'text'} style={oneLight} PreTag="div" customStyle={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  {content}
              </SyntaxHighlighter>
          }
        />
      </div>
  );
} 