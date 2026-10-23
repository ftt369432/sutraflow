/**
 * Vector Search Interface Component
 * 
 * Provides Google-level search capabilities with:
 * - Semantic search with natural language queries
 * - AI-powered insights and suggestions
 * - Knowledge graph visualizations
 * - Automated learning and personalization
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Brain,
  Sparkles,
  Filter,
  ArrowRight,
  BookOpen,
  Lightbulb,
  Network,
  Zap,
  Clock,
  Tag,
  File,
  Eye,
  Download,
  Share,
  MessageSquare,
  TrendingUp,
  Target,
  Layers,
  Globe,
  Cpu,
  ChevronDown,
  ChevronUp,
  X,
  AlertCircle,
  CheckCircle,
  Star,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Spinner } from '../ui/Spinner';
import { vectorSearchService, SearchOptions, SearchResult, SuggestedAction } from '../../services/vectordb/vectorSearchService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface VectorSearchInterfaceProps {
  onResultSelect?: (result: SearchResult) => void;
  onSuggestionAccept?: (suggestion: SuggestedAction) => void;
  className?: string;
}

export const VectorSearchInterface: React.FC<VectorSearchInterfaceProps> = ({
  onResultSelect,
  onSuggestionAccept,
  className = '',
}) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedAction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'insights' | 'suggestions'>('search');
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    query: '',
    limit: 10,
    threshold: 0.7,
    boost_recent: true,
    include_similar: true,
    semantic_expansion: true,
    multi_modal: false,
  });
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const [userContext, setUserContext] = useState<any>({});

  // Load user context and suggestions on mount
  useEffect(() => {
    if (user?.id) {
      loadUserSuggestions();
    }
  }, [user?.id]);

  const loadUserSuggestions = useCallback(async () => {
    if (!user?.id) return;

    try {
      const contextualSuggestions = await vectorSearchService.generateSuggestions(
        user.id,
        userContext
      );
      setSuggestions(contextualSuggestions);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  }, [user?.id, userContext]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !user?.id) return;

    setIsSearching(true);
    try {
      const searchResults = await vectorSearchService.search({
        ...searchOptions,
        query: searchQuery,
      });

      setResults(searchResults);
      
      // Track search for learning
      await trackSearch(searchQuery, searchResults.length);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [searchOptions, user?.id]);

  const trackSearch = useCallback(async (searchQuery: string, resultCount: number) => {
    // Track search patterns for AI learning
    try {
      // This would typically call an analytics service
      console.log('Tracking search:', { query: searchQuery, results: resultCount });
    } catch (error) {
      console.error('Failed to track search:', error);
    }
  }, []);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  }, [query, performSearch]);

  const handleResultClick = useCallback((result: SearchResult) => {
    setExpandedResult(expandedResult === result.document.id ? null : result.document.id);
    onResultSelect?.(result);
  }, [expandedResult, onResultSelect]);

  const handleSuggestionAction = useCallback(async (suggestion: SuggestedAction) => {
    try {
      onSuggestionAccept?.(suggestion);
      toast.success(`${suggestion.title} action initiated`);
      
      // Remove accepted suggestion
      setSuggestions(prev => prev.filter(s => s !== suggestion));
    } catch (error) {
      toast.error('Failed to execute suggestion');
    }
  }, [onSuggestionAccept]);

  const handleSuggestionDismiss = useCallback((suggestion: SuggestedAction) => {
    setSuggestions(prev => prev.filter(s => s !== suggestion));
    toast.info('Suggestion dismissed');
  }, []);

  const getFileTypeIcon = useCallback((fileType: string) => {
    switch (fileType?.toLowerCase()) {
      case 'pdf': return <File className="h-4 w-4 text-red-500" />;
      case 'doc':
      case 'docx': return <File className="h-4 w-4 text-blue-500" />;
      case 'txt': return <File className="h-4 w-4 text-gray-500" />;
      case 'jpg':
      case 'png':
      case 'gif': return <File className="h-4 w-4 text-green-500" />;
      default: return <File className="h-4 w-4 text-gray-400" />;
    }
  }, []);

  const getActionIcon = useCallback((actionType: string) => {
    switch (actionType) {
      case 'create_task': return <Target className="h-4 w-4" />;
      case 'schedule_meeting': return <Clock className="h-4 w-4" />;
      case 'send_email': return <MessageSquare className="h-4 w-4" />;
      case 'bookmark': return <Star className="h-4 w-4" />;
      case 'summarize': return <BookOpen className="h-4 w-4" />;
      case 'translate': return <Globe className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  }, []);

  const searchInsights = useMemo(() => {
    if (results.length === 0) return null;

    const totalDocs = results.length;
    const avgSimilarity = results.reduce((sum, r) => sum + r.similarity_score, 0) / totalDocs;
    const fileTypes = [...new Set(results.map(r => r.document.file_type).filter(Boolean))];
    const recentDocs = results.filter(r => {
      const daysDiff = (new Date().getTime() - new Date(r.document.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    }).length;

    return {
      totalDocs,
      avgSimilarity,
      fileTypes,
      recentDocs,
    };
  }, [results]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Header */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">AI-Powered Knowledge Search</CardTitle>
            <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
          </div>
          
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex space-x-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything about your documents... (e.g., 'Show me contracts from last month' or 'Find documents about AI research')"
                className="pl-10 pr-4 py-3 text-base"
                disabled={isSearching}
              />
            </div>
            <Button 
              type="submit" 
              disabled={!query.trim() || isSearching}
              className="px-6"
            >
              {isSearching ? <Spinner className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </form>

          {/* Search Options */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              variant={searchOptions.semantic_expansion ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchOptions(prev => ({ ...prev, semantic_expansion: !prev.semantic_expansion }))}
            >
              <Cpu className="h-3 w-3 mr-1" />
              Semantic Expansion
            </Button>
            <Button
              variant={searchOptions.boost_recent ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchOptions(prev => ({ ...prev, boost_recent: !prev.boost_recent }))}
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Boost Recent
            </Button>
            <Button
              variant={searchOptions.include_similar ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchOptions(prev => ({ ...prev, include_similar: !prev.include_similar }))}
            >
              <Network className="h-3 w-3 mr-1" />
              Include Similar
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Results Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search" className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <span>Search Results</span>
            {results.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {results.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>AI Insights</span>
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center space-x-2">
            <Lightbulb className="h-4 w-4" />
            <span>Suggestions</span>
            {suggestions.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {suggestions.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Search Results Tab */}
        <TabsContent value="search" className="space-y-4">
          <AnimatePresence>
            {results.map((result, index) => (
              <motion.div
                key={result.document.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20 hover:border-l-primary"
                  onClick={() => handleResultClick(result)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getFileTypeIcon(result.document.file_type || '')}
                          <h3 className="font-semibold text-lg line-clamp-1">
                            {result.document.title}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {(result.similarity_score * 100).toFixed(1)}% match
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {result.explanation}
                        </p>

                        <div className="flex flex-wrap gap-1 mb-2">
                          {result.document.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {result.document.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{result.document.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-2">
                        <div className="text-xs text-muted-foreground">
                          {new Date(result.document.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  {expandedResult === result.document.id && (
                    <CardContent className="border-t pt-4">
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                        {/* Highlighted Snippets */}
                        {result.highlighted_snippets.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2 flex items-center">
                              <Layers className="h-4 w-4 mr-1" />
                              Relevant Excerpts
                            </h4>
                            <div className="space-y-2">
                              {result.highlighted_snippets.slice(0, 2).map((snippet, idx) => (
                                <div key={idx} className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border-l-2 border-yellow-400">
                                  <p className="text-sm">
                                    ...{snippet.context}...
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Suggested Actions */}
                        {result.suggested_actions.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2 flex items-center">
                              <Zap className="h-4 w-4 mr-1" />
                              Quick Actions
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {result.suggested_actions.slice(0, 3).map((action, idx) => (
                                <Button
                                  key={idx}
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSuggestionAction(action);
                                  }}
                                  className="text-xs"
                                >
                                  {getActionIcon(action.type)}
                                  <span className="ml-1">{action.title}</span>
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Related Documents */}
                        {result.related_documents.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2 flex items-center">
                              <Network className="h-4 w-4 mr-1" />
                              Related Documents
                            </h4>
                            <div className="space-y-1">
                              {result.related_documents.slice(0, 2).map((related, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                  <span className="text-sm flex-1">{related.document.title}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {related.relationship_type}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {results.length === 0 && !isSearching && query && (
            <Card className="text-center py-12">
              <CardContent>
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or using different keywords.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          {searchInsights && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <File className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{searchInsights.totalDocs}</p>
                      <p className="text-sm text-muted-foreground">Documents Found</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">{(searchInsights.avgSimilarity * 100).toFixed(1)}%</p>
                      <p className="text-sm text-muted-foreground">Avg Relevance</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Layers className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold">{searchInsights.fileTypes.length}</p>
                      <p className="text-sm text-muted-foreground">File Types</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold">{searchInsights.recentDocs}</p>
                      <p className="text-sm text-muted-foreground">Recent (7d)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>Search Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                AI insights and analysis will appear here based on your search patterns and document interactions.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-4">
          <AnimatePresence>
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={`${suggestion.type}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-l-4 border-l-green-500/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getActionIcon(suggestion.type)}
                          <h3 className="font-medium">{suggestion.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {(suggestion.confidence * 100).toFixed(0)}% confidence
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {suggestion.description}
                        </p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleSuggestionAction(suggestion)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuggestionDismiss(suggestion)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {suggestions.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No suggestions available</h3>
                <p className="text-muted-foreground">
                  AI suggestions will appear here based on your document usage patterns.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}; 