import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Link,
  Unlink,
  Plus,
  Search,
  Filter,
  FolderOpen,
  FileText,
  Star,
  Eye,
  EyeOff,
  MoreVertical,
  Upload,
  Download,
  Trash2,
  Edit,
  Tag,
  Clock,
  User,
  Database,
  Zap,
  CheckCircle,
  AlertCircle,
  Info,
  Settings,
  RefreshCw,
  ArrowUpRight,
  Folder,
  File
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/DropdownMenu';
import { Switch } from '../ui/Switch';
import { Label } from '../ui/Label';
import { Progress } from '../ui/progress';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { useAssistantStore } from '../../store/assistantStore';
import type { AIAssistant, AIDocument, AIFolder } from '../../types/ai';

interface SourceItem {
  id: string;
  type: 'document' | 'folder';
  name: string;
  description?: string;
  tags: string[];
  linked: boolean;
  lastUpdated: Date;
  size: number;
  documentCount?: number;
  aiProcessed: boolean;
  similarity?: number;
  status: 'active' | 'processing' | 'error' | 'pending';
}

interface KnowledgeSourcesPanelProps {
  selectedAssistant?: AIAssistant | null;
  conversationContext?: {
    uploadedFiles: Array<{
      name: string;
      content: string;
      type: string;
      uploadedAt: Date;
    }>;
    analysisResults: Array<{
      fileId: string;
      analysis: string;
      timestamp: Date;
    }>;
  };
  onDocumentClick?: (documentId: string) => void;
}

export function KnowledgeSourcesPanel({
  selectedAssistant,
  conversationContext,
  onDocumentClick
}: KnowledgeSourcesPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showLinkedOnly, setShowLinkedOnly] = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoSync, setAutoSync] = useState(true);

  const { documents, folders, linkDocumentToAssistant, unlinkDocumentFromAssistant } = useKnowledgeBaseStore();
  const { updateAssistant } = useAssistantStore();

  useEffect(() => {
    loadSources();
  }, [selectedAssistant, documents, folders]);

  const loadSources = () => {
    if (!selectedAssistant) return;

    const linkedFolderIds = selectedAssistant.knowledgeBase?.map(f => f.id) || [];
    const linkedDocumentIds = selectedAssistant.knowledgeBase?.flatMap(f => f.documents?.map(d => d.id) || []) || [];

    // Convert documents to source items
    const documentSources: SourceItem[] = documents.map(doc => ({
      id: doc.id,
      type: 'document',
      name: doc.title || doc.filename || 'Untitled',
      description: doc.ai_summary || doc.description,
      tags: doc.ai_tags || [],
      linked: linkedDocumentIds.includes(doc.id),
      lastUpdated: new Date(doc.updated_at || doc.created_at),
      size: doc.size || 0,
      aiProcessed: !!(doc.ai_summary || doc.ai_tags?.length),
      status: doc.processing_status || 'active'
    }));

    // Convert folders to source items
    const folderSources: SourceItem[] = folders.map(folder => ({
      id: folder.id,
      type: 'folder',
      name: folder.name,
      description: folder.description,
      tags: [],
      linked: linkedFolderIds.includes(folder.id),
      lastUpdated: new Date(folder.updated_at || folder.created_at),
      size: 0,
      documentCount: folder.documents?.length || 0,
      aiProcessed: true,
      status: 'active'
    }));

    // Add conversation files as potential sources
    const conversationSources: SourceItem[] = conversationContext?.uploadedFiles.map(file => ({
      id: `conv_${file.name}`,
      type: 'document',
      name: file.name,
      description: 'Uploaded in current conversation',
      tags: ['conversation', file.type],
      linked: false,
      lastUpdated: file.uploadedAt,
      size: file.content.length,
      aiProcessed: false,
      status: 'pending'
    })) || [];

    setSources([...folderSources, ...documentSources, ...conversationSources]);
  };

  const filteredSources = sources.filter(source => {
    const matchesSearch = source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         source.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         source.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = !showLinkedOnly || source.linked;
    
    return matchesSearch && matchesFilter;
  });

  const handleToggleLink = async (sourceId: string, currentlyLinked: boolean) => {
    if (!selectedAssistant) return;

    setIsLoading(true);
    try {
      const source = sources.find(s => s.id === sourceId);
      if (!source) return;

      if (source.type === 'document') {
        if (currentlyLinked) {
          await unlinkDocumentFromAssistant(sourceId, selectedAssistant.id);
        } else {
          await linkDocumentToAssistant(sourceId, selectedAssistant.id);
        }
      } else if (source.type === 'folder') {
        // Handle folder linking
        const currentFolders = selectedAssistant.knowledgeBase?.map(f => f.id) || [];
        const updatedFolders = currentlyLinked 
          ? currentFolders.filter(id => id !== sourceId)
          : [...currentFolders, sourceId];
        
        // Update assistant with new folder links
        // This would need to be implemented in the assistant store
        console.log('Folder linking:', sourceId, currentlyLinked ? 'unlink' : 'link');
      }

      // Update local state
      setSources(prev => prev.map(s => 
        s.id === sourceId ? { ...s, linked: !currentlyLinked } : s
      ));

    } catch (error) {
      console.error('Failed to toggle link:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkLink = async (link: boolean) => {
    if (selectedSources.length === 0) return;

    setIsLoading(true);
    try {
      for (const sourceId of selectedSources) {
        await handleToggleLink(sourceId, !link);
      }
      setSelectedSources([]);
    } catch (error) {
      console.error('Bulk link operation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessFile = async (sourceId: string) => {
    // Trigger AI processing for the file
    setIsLoading(true);
    try {
      // This would integrate with your AI processing service
      console.log('Processing file:', sourceId);
      
      // Update source status
      setSources(prev => prev.map(s => 
        s.id === sourceId ? { ...s, status: 'processing' } : s
      ));

      // Simulate processing
      setTimeout(() => {
        setSources(prev => prev.map(s => 
          s.id === sourceId ? { ...s, status: 'active', aiProcessed: true } : s
        ));
        setIsLoading(false);
      }, 2000);

    } catch (error) {
      console.error('Processing failed:', error);
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: SourceItem['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'processing':
        return <RefreshCw className="h-3 w-3 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      case 'pending':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      default:
        return <Info className="h-3 w-3 text-gray-500" />;
    }
  };

  const getStatusColor = (status: SourceItem['status']) => {
    switch (status) {
      case 'active':
        return 'border-green-200 bg-green-50 dark:bg-green-900/20';
      case 'processing':
        return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20';
      case 'error':
        return 'border-red-200 bg-red-50 dark:bg-red-900/20';
      case 'pending':
        return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'border-gray-200 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  if (!selectedAssistant) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Assistant Selected</h3>
          <p className="text-sm text-gray-500">
            Select an assistant to manage knowledge sources
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
              <Database className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Knowledge Sources
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage {selectedAssistant.name} sources
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {filteredSources.filter(s => s.linked).length} linked
            </Badge>
            <Button variant="ghost" size="sm" onClick={loadSources} disabled={isLoading}>
                              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sources..."
              className="pl-10 h-8"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="linked-only"
                checked={showLinkedOnly}
                onCheckedChange={setShowLinkedOnly}
                className="scale-75"
              />
              <Label htmlFor="linked-only" className="text-xs">Linked only</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-sync"
                checked={autoSync}
                onCheckedChange={setAutoSync}
                className="scale-75"
              />
              <Label htmlFor="auto-sync" className="text-xs">Auto-sync</Label>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start mb-2 mx-4 mt-2">
          <TabsTrigger value="all" className="text-xs">All Sources</TabsTrigger>
          <TabsTrigger value="linked" className="text-xs">Linked</TabsTrigger>
          <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
          <TabsTrigger value="bulk" className="text-xs">Bulk Actions</TabsTrigger>
        </TabsList>

        {/* All Sources */}
        <TabsContent value="all" className="flex-1 overflow-y-auto p-4">
          {filteredSources.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-gray-500">No sources found</p>
              {searchQuery && (
                <p className="text-xs text-gray-400 mt-1">Try adjusting your search</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSources.map((source) => (
                <Card key={source.id} className={`p-3 border transition-all duration-200 ${getStatusColor(source.status)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex items-center space-x-2">
                        {source.type === 'folder' ? 
                          <Folder className="h-4 w-4 text-blue-500" /> : 
                          <File className="h-4 w-4 text-gray-500" />
                        }
                        {getStatusIcon(source.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-sm truncate">{source.name}</h4>
                          {source.linked && <Badge variant="default" className="text-xs">Linked</Badge>}
                          {source.aiProcessed && <Zap className="h-3 w-3 text-yellow-500" />}
                        </div>
                        
                        {source.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                            {source.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{source.lastUpdated.toLocaleDateString()}</span>
                            {source.type === 'folder' && source.documentCount !== undefined && (
                              <>
                                <span>•</span>
                                <span>{source.documentCount} docs</span>
                              </>
                            )}
                          </div>
                          
                          {source.tags.length > 0 && (
                            <div className="flex items-center space-x-1">
                              {source.tags.slice(0, 2).map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {source.tags.length > 2 && (
                                <span className="text-xs text-gray-400">+{source.tags.length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 ml-2">
                      <Button
                        variant={source.linked ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggleLink(source.id, source.linked)}
                        disabled={isLoading}
                        className="h-7 px-2"
                      >
                        {source.linked ? <Unlink className="h-3 w-3" /> : <Link className="h-3 w-3" />}
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onDocumentClick && source.type === 'document' && (
                            <DropdownMenuItem onClick={() => onDocumentClick(source.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                          )}
                          {!source.aiProcessed && (
                            <DropdownMenuItem onClick={() => handleProcessFile(source.id)}>
                              <Zap className="h-4 w-4 mr-2" />
                              Process with AI
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <Tag className="h-4 w-4 mr-2" />
                            Add Tags
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Linked Sources */}
        <TabsContent value="linked" className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {filteredSources.filter(s => s.linked).map((source) => (
              <Card key={source.id} className="p-3 border-green-200 bg-green-50 dark:bg-green-900/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {source.type === 'folder' ? 
                      <FolderOpen className="h-4 w-4 text-green-600" /> : 
                      <FileText className="h-4 w-4 text-green-600" />
                    }
                    <div>
                      <h4 className="font-medium text-sm text-green-800 dark:text-green-200">
                        {source.name}
                      </h4>
                      <p className="text-xs text-green-600 dark:text-green-300">
                        {source.type === 'folder' ? `${source.documentCount} documents` : 'Document'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleLink(source.id, true)}
                    className="h-7 px-2 border-green-300 text-green-700"
                  >
                    <Unlink className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Pending Sources */}
        <TabsContent value="pending" className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {filteredSources.filter(s => s.status === 'pending' || !s.aiProcessed).map((source) => (
              <Card key={source.id} className="p-3 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <div>
                      <h4 className="font-medium text-sm text-yellow-800 dark:text-yellow-200">
                        {source.name}
                      </h4>
                      <p className="text-xs text-yellow-600 dark:text-yellow-300">
                        {source.status === 'pending' ? 'Needs processing' : 'AI processing available'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleProcessFile(source.id)}
                    className="h-7 px-2 border-yellow-300 text-yellow-700"
                  >
                    <Zap className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Bulk Actions */}
        <TabsContent value="bulk" className="flex-1 overflow-y-auto p-4">
          <Card className="p-4">
            <h4 className="font-medium mb-3">Bulk Operations</h4>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Selected: {selectedSources.length} sources
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkLink(true)}
                    disabled={selectedSources.length === 0 || isLoading}
                  >
                    <Link className="h-4 w-4 mr-2" />
                    Link Selected
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkLink(false)}
                    disabled={selectedSources.length === 0 || isLoading}
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    Unlink Selected
                  </Button>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <h5 className="text-sm font-medium mb-2">Quick Actions</h5>
                <div className="grid grid-cols-1 gap-2">
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Source
                  </Button>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Sources
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export Configuration
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 