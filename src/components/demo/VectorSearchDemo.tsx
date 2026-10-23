/**
 * Vector Search Demo Component
 * 
 * Interactive demonstration of the AI-powered knowledge base
 * and vector search capabilities with sample data
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Search,
  FileText,
  Zap,
  Sparkles,
  Database,
  Network,
  TrendingUp,
  BookOpen,
  Globe,
  Cpu,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Star,
  Tag,
  MessageSquare,
  Download
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Alert, AlertDescription } from '../ui/Alert';
import { cleanDocumentTitle } from '../../utils/documentUtils';

interface SampleDocument {
  id: string;
  title: string;
  content: string;
  type: string;
  keywords: string[];
  summary: string;
  similarity?: number;
  created_at: string;
  complexity_score: number;
  language: string;
}

interface DemoSearchResult {
  document: SampleDocument;
  similarity_score: number;
  explanation: string;
  highlighted_snippets: string[];
  suggested_actions: string[];
}

const sampleDocuments: SampleDocument[] = [
  {
    id: '1',
    title: 'AI Research Proposal - Machine Learning in Healthcare',
    content: 'This proposal outlines a comprehensive research initiative to develop advanced machine learning algorithms for medical diagnosis and treatment optimization. The project aims to leverage deep learning techniques to analyze medical imaging data and predict patient outcomes with high accuracy.',
    type: 'pdf',
    keywords: ['AI', 'machine learning', 'healthcare', 'deep learning', 'medical diagnosis'],
    summary: 'Research proposal for AI applications in medical diagnosis and treatment',
    created_at: '2024-01-15T10:00:00Z',
    complexity_score: 0.8,
    language: 'en'
  },
  {
    id: '2',
    title: 'Software Development Contract - GenieFlow Integration',
    content: 'This contract establishes the terms and conditions for the development of advanced AI integration features for the GenieFlow platform. The scope includes natural language processing, automated workflow management, and intelligent task prioritization systems.',
    type: 'docx',
    keywords: ['contract', 'software development', 'AI integration', 'workflow', 'automation'],
    summary: 'Development contract for AI features in GenieFlow platform',
    created_at: '2024-01-20T14:30:00Z',
    complexity_score: 0.6,
    language: 'en'
  },
  {
    id: '3',
    title: 'Meeting Notes - Product Strategy Q1 2024',
    content: 'Discussed the roadmap for AI-powered productivity tools. Key decisions include implementing vector search, automated document processing, and intelligent suggestions. Timeline: MVP by March, full release by June. Budget allocation: 40% engineering, 30% AI research, 30% user experience.',
    type: 'txt',
    keywords: ['meeting', 'product strategy', 'roadmap', 'AI tools', 'vector search'],
    summary: 'Strategic planning meeting for AI productivity features',
    created_at: '2024-01-25T09:15:00Z',
    complexity_score: 0.4,
    language: 'en'
  },
  {
    id: '4',
    title: 'Technical Documentation - Vector Database Implementation',
    content: 'Comprehensive guide for implementing vector databases using PostgreSQL with pgvector extension. Covers indexing strategies, performance optimization, and security considerations. Includes examples of semantic search queries and embedding generation techniques.',
    type: 'md',
    keywords: ['technical', 'vector database', 'PostgreSQL', 'indexing', 'semantic search'],
    summary: 'Technical guide for vector database implementation',
    created_at: '2024-01-30T16:45:00Z',
    complexity_score: 0.9,
    language: 'en'
  },
  {
    id: '5',
    title: 'User Feedback Analysis - AI Assistant Features',
    content: 'Analysis of user feedback regarding AI assistant capabilities. Users appreciate the natural language interface and automated task creation. Requests for improvement include better context understanding, multi-language support, and integration with calendar systems.',
    type: 'xlsx',
    keywords: ['user feedback', 'AI assistant', 'natural language', 'automation', 'improvements'],
    summary: 'User feedback analysis for AI assistant enhancements',
    created_at: '2024-02-01T11:20:00Z',
    complexity_score: 0.5,
    language: 'en'
  }
];

const searchQueries = [
  { query: 'AI research and machine learning', category: 'Technical' },
  { query: 'Contract terms and agreements', category: 'Legal' },
  { query: 'Product roadmap and strategy', category: 'Business' },
  { query: 'Database implementation guide', category: 'Technical' },
  { query: 'User feedback and improvements', category: 'Research' }
];

const features = [
  {
    icon: <Search className="h-6 w-6" />,
    title: 'Semantic Search',
    description: 'Find documents by meaning, not just keywords',
    color: 'text-blue-500'
  },
  {
    icon: <Brain className="h-6 w-6" />,
    title: 'AI Analysis',
    description: 'Automatic summarization and insight generation',
    color: 'text-purple-500'
  },
  {
    icon: <Network className="h-6 w-6" />,
    title: 'Knowledge Graph',
    description: 'Discover relationships between documents',
    color: 'text-green-500'
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: 'Smart Suggestions',
    description: 'Automated actions based on content analysis',
    color: 'text-yellow-500'
  }
];

export const VectorSearchDemo: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DemoSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<SampleDocument | null>(null);
  const [demoStep, setDemoStep] = useState(0);
  const [stats, setStats] = useState({
    totalDocuments: sampleDocuments.length,
    avgComplexity: 0.64,
    languages: 1,
    processedToday: 23
  });

  useEffect(() => {
    // Simulate real-time stats
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        processedToday: prev.processedToday + Math.floor(Math.random() * 3)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchQuery(query);

    // Simulate search processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock search results with similarity scoring
    const results = sampleDocuments
      .map(doc => {
        // Simple similarity calculation based on keyword matching
        const queryWords = query.toLowerCase().split(' ');
        const matchScore = queryWords.reduce((score, word) => {
          const titleMatch = doc.title.toLowerCase().includes(word) ? 0.3 : 0;
          const keywordMatch = doc.keywords.some(k => k.toLowerCase().includes(word)) ? 0.4 : 0;
          const contentMatch = doc.content.toLowerCase().includes(word) ? 0.2 : 0;
          return score + titleMatch + keywordMatch + contentMatch;
        }, 0);

        return {
          document: doc,
          similarity_score: Math.min(0.95, matchScore + Math.random() * 0.2),
          explanation: `This document matches your query with ${Math.round(matchScore * 100)}% semantic similarity`,
          highlighted_snippets: [
            doc.content.substring(0, 150) + '...',
            doc.summary
          ],
          suggested_actions: [
            'Create task',
            'Schedule meeting',
            'Bookmark',
            'Summary'
          ]
        };
      })
      .filter(result => result.similarity_score > 0.1)
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, 3);

    setSearchResults(results);
    setIsSearching(false);
  };

  const handleQuickSearch = (query: string) => {
    performSearch(query);
  };

  const nextDemoStep = () => {
    setDemoStep((prev) => (prev + 1) % 4);
  };

  const getDemoContent = () => {
    switch (demoStep) {
      case 0:
        return {
          title: 'Welcome to AI Knowledge Base',
          description: 'Experience Google-level search for your documents with semantic understanding and intelligent insights.',
          action: 'Start Demo'
        };
      case 1:
        return {
          title: 'Semantic Search in Action',
          description: 'Search by meaning, not just keywords. Our AI understands context and relationships between concepts.',
          action: 'Try Search'
        };
      case 2:
        return {
          title: 'AI-Powered Analysis',
          description: 'Automatic document analysis provides summaries, extracts keywords, and suggests relevant actions.',
          action: 'View Analysis'
        };
      case 3:
        return {
          title: 'Knowledge Discovery',
          description: 'Discover hidden connections between documents and unlock insights from your knowledge base.',
          action: 'Explore Graph'
        };
      default:
        return { title: '', description: '', action: '' };
    }
  };

  const demoContent = getDemoContent();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center space-x-3"
        >
          <Brain className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold">AI Knowledge Base Demo</h1>
          <Sparkles className="h-8 w-8 text-yellow-500 animate-pulse" />
        </motion.div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Experience the future of document management with AI-powered semantic search, 
          automated analysis, and intelligent knowledge discovery.
        </p>
      </div>

      {/* Demo Progress */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold">{demoContent.title}</h3>
              <p className="text-muted-foreground">{demoContent.description}</p>
            </div>
            <Button onClick={nextDemoStep} className="ml-4">
              {demoContent.action}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          
          <div className="flex space-x-2">
            {[0, 1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-2 flex-1 rounded ${
                  step <= demoStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalDocuments}</p>
                <p className="text-sm text-muted-foreground">Total Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{(stats.avgComplexity * 100).toFixed(0)}%</p>
                <p className="text-sm text-muted-foreground">Avg Complexity</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.languages}</p>
                <p className="text-sm text-muted-foreground">Languages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.processedToday}</p>
                <p className="text-sm text-muted-foreground">Processed Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Demo Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Interface */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>Semantic Search</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ask anything about your documents... (e.g., 'AI research projects' or 'contract agreements')"
                  onKeyPress={(e) => e.key === 'Enter' && performSearch(searchQuery)}
                  className="flex-1"
                />
                <Button 
                  onClick={() => performSearch(searchQuery)}
                  disabled={isSearching}
                >
                  {isSearching ? <Cpu className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {searchQueries.map((item, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickSearch(item.query)}
                    className="text-xs"
                  >
                    {item.query}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  Search Results ({searchResults.length})
                </h3>
                
                {searchResults.map((result, index) => (
                  <motion.div
                    key={result.document.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-primary/20 hover:border-l-primary"
                      onClick={() => setSelectedDocument(result.document)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <h4 className="font-semibold line-clamp-1">{cleanDocumentTitle(result.document.title)}</h4>
                              <Badge variant="outline" className="text-xs">
                                {(result.similarity_score * 100).toFixed(1)}% match
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {result.explanation}
                            </p>

                            <div className="flex flex-wrap gap-1 mb-2">
                              {result.document.keywords.slice(0, 3).map((keyword) => (
                                <Badge key={keyword} variant="secondary" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {result.suggested_actions.slice(0, 2).map((action, idx) => (
                            <Button key={idx} variant="outline" size="sm" className="text-xs">
                              <Lightbulb className="h-3 w-3 mr-1" />
                              {action}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Features Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5" />
                <span>Key Features</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className={feature.color}>
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-medium">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Sample Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Sample Documents</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sampleDocuments.slice(0, 3).map((doc) => (
                <div
                  key={doc.id}
                  className="p-2 rounded cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedDocument(doc)}
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium line-clamp-1">{cleanDocumentTitle(doc.title)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {doc.summary}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Document Detail Modal */}
      <AnimatePresence>
        {selectedDocument && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedDocument(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-background rounded-lg max-w-4xl w-full max-h-[80vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="border-0">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="h-6 w-6" />
                        <span>{cleanDocumentTitle(selectedDocument.title)}</span>
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline">{selectedDocument.type.toUpperCase()}</Badge>
                        <Badge variant="secondary">
                          Complexity: {(selectedDocument.complexity_score * 100).toFixed(0)}%
                        </Badge>
                        <Badge variant="outline">{selectedDocument.language}</Badge>
                      </div>
                    </div>
                    <Button variant="ghost" onClick={() => setSelectedDocument(null)}>
                      ×
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Summary</h4>
                    <p className="text-muted-foreground">{selectedDocument.summary}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Content Preview</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedDocument.content}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedDocument.keywords.map((keyword) => (
                        <Badge key={keyword} variant="secondary">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-4 border-t">
                    <Button size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm">
                      <Star className="h-4 w-4 mr-2" />
                      Bookmark
                    </Button>
                    <Button variant="outline" size="sm">
                      <Tag className="h-4 w-4 mr-2" />
                      Add Tags
                    </Button>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Ask AI
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo Instructions */}
      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertDescription>
          This is a demonstration of the AI-powered knowledge base system. 
          Try searching with natural language queries to see semantic search in action. 
          Click on documents to explore AI-generated insights and suggestions.
        </AlertDescription>
      </Alert>
    </div>
  );
}; 