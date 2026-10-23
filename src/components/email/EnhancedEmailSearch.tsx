import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Clock, 
  TrendingUp, 
  Filter, 
  X, 
  User, 
  Calendar,
  FileText,
  Building,
  Star,
  Archive,
  Trash,
  Tag
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Card, CardContent } from '../ui/Card';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'frequent' | 'smart';
  count?: number;
  icon?: React.ReactNode;
}

interface QuickFilter {
  id: string;
  label: string;
  icon: React.ReactNode;
  query: string;
  color: string;
}

interface EnhancedEmailSearchProps {
  onSearch: (query: string) => void;
  onQuickFilter: (filter: QuickFilter) => void;
  placeholder?: string;
  className?: string;
}

export function EnhancedEmailSearch({ 
  onSearch, 
  onQuickFilter, 
  placeholder = "Search emails...",
  className = ""
}: EnhancedEmailSearchProps) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [frequentSearches, setFrequentSearches] = useState<SearchSuggestion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Quick filter presets — uses theme-consistent steel metallic styling
  const quickFilters: QuickFilter[] = [
    {
      id: 'court',
      label: 'Court Docs',
      icon: <Building className="h-3 w-3" />,
      query: 'hearing OR court OR wcab OR notice',
      color: 'btn-dark-gray-glean border-l-2 border-l-rose-400/70'
    },
    {
      id: 'calendar',
      label: 'Has Dates',
      icon: <Calendar className="h-3 w-3" />,
      query: 'meeting OR appointment OR schedule',
      color: 'btn-dark-gray-glean border-l-2 border-l-emerald-400/70'
    },
    {
      id: 'unread',
      label: 'Unread',
      icon: <Star className="h-3 w-3" />,
      query: 'is:unread',
      color: 'btn-dark-gray-glean border-l-2 border-l-amber-400/70'
    },
    {
      id: 'attachments',
      label: 'Has Files',
      icon: <FileText className="h-3 w-3" />,
      query: 'has:attachment',
      color: 'btn-dark-gray-glean border-l-2 border-l-violet-400/70'
    },
    {
      id: 'today',
      label: 'Today',
      icon: <Clock className="h-3 w-3" />,
      query: 'newer_than:1d',
      color: 'btn-dark-gray-glean border-l-2 border-l-sky-400/70'
    }
  ];

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('email_search_history');
    if (saved) {
      try {
        const history = JSON.parse(saved);
        setRecentSearches(history.recent || []);
        setFrequentSearches(history.frequent || []);
      } catch (e) {
        console.warn('Failed to load search history:', e);
      }
    }
  }, []);

  // Save search to history
  const saveSearchToHistory = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Update recent searches
    const newRecent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(newRecent);

    // Update frequent searches
    const existingFrequent = frequentSearches.find(s => s.text === searchQuery);
    let newFrequent;
    
    if (existingFrequent) {
      newFrequent = frequentSearches.map(s => 
        s.text === searchQuery ? { ...s, count: (s.count || 1) + 1 } : s
      );
    } else {
      newFrequent = [...frequentSearches, {
        id: Date.now().toString(),
        text: searchQuery,
        type: 'frequent' as const,
        count: 1
      }];
    }

    // Sort by count and keep top 10
    newFrequent = newFrequent
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, 10);
    
    setFrequentSearches(newFrequent);

    // Save to localStorage
    try {
      localStorage.setItem('email_search_history', JSON.stringify({
        recent: newRecent,
        frequent: newFrequent
      }));
    } catch (e) {
      console.warn('Failed to save search history:', e);
    }
  };

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    saveSearchToHistory(searchQuery);
    onSearch(searchQuery);
    setShowSuggestions(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    onSearch('');
    inputRef.current?.focus();
  };

  // Generate smart suggestions based on patterns
  const smartSuggestions: SearchSuggestion[] = [
    {
      id: 'search_allen',
      text: 'Allen',
      type: 'smart',
      icon: <User className="h-3 w-3" />
    },
    {
      id: 'court_hearings',
      text: 'court hearings',
      type: 'smart',
      icon: <Building className="h-3 w-3" />
    },
    {
      id: 'medical_records',
      text: 'medical records',
      type: 'smart',
      icon: <FileText className="h-3 w-3" />
    },
    {
      id: 'urgent_emails',
      text: 'urgent',
      type: 'smart',
      icon: <TrendingUp className="h-3 w-3" />
    }
  ];

  const allSuggestions = [
    ...recentSearches.map(search => ({
      id: `recent_${search}`,
      text: search,
      type: 'recent' as const,
      icon: <Clock className="h-3 w-3" />
    })),
    ...frequentSearches.filter(s => (s.count || 0) > 1),
    ...smartSuggestions
  ];

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyPress}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="pl-10 pr-10 bg-blue-dark-metallic-800 border-blue-dark-metallic-600 text-white placeholder-gray-400"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2 mt-3">
        {quickFilters.map((filter) => (
          <Button
            key={filter.id}
            size="sm"
            variant="outline"
            onClick={() => onQuickFilter(filter)}
            className={`${filter.color} border-none text-white hover:opacity-80 text-xs`}
          >
            {filter.icon}
            <span className="ml-1">{filter.label}</span>
          </Button>
        ))}
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && allSuggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 card-metallic border-blue-dark-metallic-600">
          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="p-3 border-b border-blue-dark-metallic-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs font-medium text-gray-400">Recent</span>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.slice(0, 3).map((search, index) => (
                      <button
                        key={`recent_${index}`}
                        onClick={() => handleSearch(search)}
                        className="w-full text-left px-2 py-1 text-sm text-gray-300 hover:bg-blue-dark-metallic-700 rounded"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Frequent Searches */}
              {frequentSearches.filter(s => (s.count || 0) > 1).length > 0 && (
                <div className="p-3 border-b border-blue-dark-metallic-700">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-3 w-3 text-blue-400" />
                    <span className="text-xs font-medium text-blue-400">Frequent</span>
                  </div>
                  <div className="space-y-1">
                    {frequentSearches
                      .filter(s => (s.count || 0) > 1)
                      .slice(0, 3)
                      .map((search) => (
                        <button
                          key={search.id}
                          onClick={() => handleSearch(search.text)}
                          className="w-full text-left px-2 py-1 text-sm text-gray-300 hover:bg-blue-dark-metallic-700 rounded flex items-center justify-between"
                        >
                          <span>{search.text}</span>
                          <Badge className="bg-blue-600 text-xs">
                            {search.count}x
                          </Badge>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Smart Suggestions */}
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-3 w-3 text-green-400" />
                  <span className="text-xs font-medium text-green-400">Suggested</span>
                </div>
                <div className="space-y-1">
                  {smartSuggestions.slice(0, 3).map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSearch(suggestion.text)}
                      className="w-full text-left px-2 py-1 text-sm text-gray-300 hover:bg-blue-dark-metallic-700 rounded flex items-center gap-2"
                    >
                      {suggestion.icon}
                      <span>{suggestion.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Click outside to close suggestions */}
      {showSuggestions && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
} 