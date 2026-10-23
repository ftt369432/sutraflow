import React, { useState } from 'react';
import { Search, ChevronRight, ChevronLeft, Filter, Clock, Star, Link2, FileText, Globe, SortAsc, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';
import type { SearchResult, SearchFilters } from '../../services/searchService';

interface SearchPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  searchResults: SearchResult[];
  onSearch: (query: string, filters: SearchFilters) => Promise<void>;
}

interface FilterOption {
  id: string;
  label: string;
  value: string;
}

const timeFilters: FilterOption[] = [
  { id: 'any', label: 'Any time', value: 'any' },
  { id: 'day', label: 'Past 24 hours', value: 'day' },
  { id: 'week', label: 'Past week', value: 'week' },
  { id: 'month', label: 'Past month', value: 'month' },
  { id: 'year', label: 'Past year', value: 'year' }
];

const typeFilters: FilterOption[] = [
  { id: 'all', label: 'All results', value: 'all' },
  { id: 'articles', label: 'Articles', value: 'articles' },
  { id: 'news', label: 'News', value: 'news' },
  { id: 'blogs', label: 'Blogs', value: 'blogs' },
  { id: 'academic', label: 'Academic', value: 'academic' }
];

const languageFilters: FilterOption[] = [
  { id: 'en', label: 'English', value: 'en' },
  { id: 'es', label: 'Spanish', value: 'es' },
  { id: 'fr', label: 'French', value: 'fr' },
  { id: 'de', label: 'German', value: 'de' },
  { id: 'zh', label: 'Chinese', value: 'zh' }
];

const regionFilters: FilterOption[] = [
  { id: 'us', label: 'United States', value: 'us' },
  { id: 'uk', label: 'United Kingdom', value: 'uk' },
  { id: 'eu', label: 'European Union', value: 'eu' },
  { id: 'asia', label: 'Asia', value: 'asia' },
  { id: 'global', label: 'Global', value: 'global' }
];

const sortOptions: FilterOption[] = [
  { id: 'relevance', label: 'Most Relevant', value: 'relevance' },
  { id: 'date', label: 'Most Recent', value: 'date' },
  { id: 'citations', label: 'Most Cited', value: 'citations' }
];

export function SearchPanel({ isOpen, onToggle, searchResults, onSearch }: SearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<SearchFilters['timeRange']>('any');
  const [typeFilter, setTypeFilter] = useState<SearchFilters['type']>('all');
  const [languageFilter, setLanguageFilter] = useState<SearchFilters['language']>('en');
  const [regionFilter, setRegionFilter] = useState<SearchFilters['region']>('us');
  const [sortBy, setSortBy] = useState<SearchFilters['sortBy']>('relevance');
  const [savedSearches, setSavedSearches] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    // Add to history
    setSearchHistory(prev => [searchQuery, ...prev.slice(0, 9)]);
    
    // Call onSearch with all filters
    await onSearch(searchQuery, {
      timeRange: timeFilter,
      type: typeFilter,
      language: languageFilter,
      region: regionFilter,
      sortBy: sortBy
    });
  };

  const handleSaveSearch = () => {
    if (searchQuery && !savedSearches.includes(searchQuery)) {
      setSavedSearches(prev => [...prev, searchQuery]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={cn(
      'fixed right-0 top-0 h-full bg-card border-l transform transition-all duration-300 ease-in-out z-20',
      isOpen ? 'translate-x-0 w-96' : 'translate-x-full w-0'
    )}>
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-0 top-1/2 transform -translate-x-full -translate-y-1/2 rounded-l-lg rounded-r-none h-24 bg-card border-l border-t border-b"
        onClick={onToggle}
      >
        {isOpen ? <ChevronRight /> : <ChevronLeft />}
      </Button>

      {/* Search Panel Content */}
      <div className="h-full flex flex-col p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search..."
              className="pr-10"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          </div>
          <Button variant="outline" size="icon" onClick={handleSaveSearch}>
            <Star className="w-4 h-4" />
          </Button>
        </div>

        {/* Enhanced Filters Section */}
        <div className="space-y-4 mb-6">
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time Range
            </h3>
            <div className="space-y-1">
              {timeFilters.map(filter => (
                <label
                  key={filter.id}
                  className="flex items-center space-x-2 text-sm cursor-pointer"
                >
                  <input
                    type="radio"
                    name="timeFilter"
                    value={filter.value}
                    checked={timeFilter === filter.value}
                    onChange={(e) => setTimeFilter(e.target.value as SearchFilters['timeRange'])}
                    className="form-radio"
                  />
                  <span>{filter.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Content Type
            </h3>
            <div className="space-y-1">
              {typeFilters.map(filter => (
                <label
                  key={filter.id}
                  className="flex items-center space-x-2 text-sm cursor-pointer"
                >
                  <input
                    type="radio"
                    name="typeFilter"
                    value={filter.value}
                    checked={typeFilter === filter.value}
                    onChange={(e) => setTypeFilter(e.target.value as SearchFilters['type'])}
                    className="form-radio"
                  />
                  <span>{filter.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Language
            </h3>
            <div className="space-y-1">
              {languageFilters.map(filter => (
                <label
                  key={filter.id}
                  className="flex items-center space-x-2 text-sm cursor-pointer"
                >
                  <input
                    type="radio"
                    name="languageFilter"
                    value={filter.value}
                    checked={languageFilter === filter.value}
                    onChange={(e) => setLanguageFilter(e.target.value as SearchFilters['language'])}
                    className="form-radio"
                  />
                  <span>{filter.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Region
            </h3>
            <div className="space-y-1">
              {regionFilters.map(filter => (
                <label
                  key={filter.id}
                  className="flex items-center space-x-2 text-sm cursor-pointer"
                >
                  <input
                    type="radio"
                    name="regionFilter"
                    value={filter.value}
                    checked={regionFilter === filter.value}
                    onChange={(e) => setRegionFilter(e.target.value as SearchFilters['region'])}
                    className="form-radio"
                  />
                  <span>{filter.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <SortAsc className="w-4 h-4" />
              Sort By
            </h3>
            <div className="space-y-1">
              {sortOptions.map(filter => (
                <label
                  key={filter.id}
                  className="flex items-center space-x-2 text-sm cursor-pointer"
                >
                  <input
                    type="radio"
                    name="sortBy"
                    value={filter.value}
                    checked={sortBy === filter.value}
                    onChange={(e) => setSortBy(e.target.value as SearchFilters['sortBy'])}
                    className="form-radio"
                  />
                  <span>{filter.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto">
          <h3 className="text-sm font-medium mb-2">Results</h3>
          <div className="space-y-4">
            {searchResults.map((result, index) => (
              <div key={index} className="p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <a
                    href={result.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-2"
                  >
                    <Link2 className="w-4 h-4" />
                    {result.title}
                  </a>
                  <div className="flex items-center gap-2">
                    {result.type && (
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        result.type === 'news' && "bg-blue-100 text-blue-800",
                        result.type === 'blog' && "bg-green-100 text-green-800",
                        result.type === 'academic' && "bg-purple-100 text-purple-800",
                        result.type === 'article' && "bg-orange-100 text-orange-800"
                      )}>
                        {result.type}
                      </span>
                    )}
                    {result.language && (
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full uppercase">
                        {result.language}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{result.snippet}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  {result.date && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(result.date).toLocaleDateString()}
                    </span>
                  )}
                  {result.region && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {result.region.toUpperCase()}
                    </span>
                  )}
                  {typeof result.citations !== 'undefined' && result.citations > 0 && (
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {result.citations} citations
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent & Saved Searches */}
        <div className="mt-4 pt-4 border-t space-y-4">
          {searchHistory.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Searches
              </h3>
              <div className="space-y-1">
                {searchHistory.map((query, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start text-sm"
                    onClick={() => {
                      setSearchQuery(query);
                      onSearch(query, {
                        timeRange: timeFilter,
                        type: typeFilter,
                        language: languageFilter,
                        region: regionFilter,
                        sortBy: sortBy
                      });
                    }}
                  >
                    {query}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {savedSearches.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Saved Searches
              </h3>
              <div className="space-y-1">
                {savedSearches.map((query, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start text-sm"
                    onClick={() => {
                      setSearchQuery(query);
                      onSearch(query, {
                        timeRange: timeFilter,
                        type: typeFilter,
                        language: languageFilter,
                        region: regionFilter,
                        sortBy: sortBy
                      });
                    }}
                  >
                    {query}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 