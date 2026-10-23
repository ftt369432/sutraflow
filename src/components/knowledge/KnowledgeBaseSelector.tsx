import React, { useState, useRef, useCallback } from 'react';
import { 
  FolderOpen, 
  X, 
  Plus, 
  Upload, 
  Brain, 
  Target, 
  Database,
  Lightbulb,
  Loader,
  Star,
  CheckCircle,
  RefreshCw,
  Clock,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { cn } from '@/lib/utils';
import type { AIFolder } from '@/types/ai';

interface KnowledgeBaseSelectorProps {
  folders: AIFolder[];
  selectedFolders: string[];
  onSelect: (folderId: string) => void;
  onUnselect: (folderId: string) => void;
  className?: string;
  assistantName?: string;
  assistantType?: string;
  isLoading?: boolean;
}

interface KnowledgeStats {
  totalDocuments: number;
  totalSize: string;
  avgRelevanceScore: number;
  lastUpdated: string;
  processingStatus: 'completed' | 'processing' | 'pending' | 'error';
  knowledgeGaps: string[];
  recommendations: string[];
}

export const KnowledgeBaseSelector: React.FC<KnowledgeBaseSelectorProps> = ({
  folders,
  selectedFolders,
  onSelect,
  onUnselect,
  className = '',
  assistantName = 'Assistant',
  assistantType = 'general',
  isLoading = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Mock data - in real app, this would come from props or API
  const knowledgeStats = {
    totalDocuments: Math.floor(Math.random() * 200) + 50,
    totalSize: `${(Math.random() * 5 + 1).toFixed(1)} GB`,
    avgRelevanceScore: Math.floor(Math.random() * 30) + 70,
    lastUpdated: '2 hours ago',
    processingStatus: folders.length > 0 ? 'completed' : 'pending',
    knowledgeGaps: [
      'Recent case law updates',
      'State-specific regulations',
      'Legal precedent analysis'
    ],
    recommendations: [
      'Upload more recent legal documents',
      'Add court case summaries',
      'Include regulatory compliance guides'
    ]
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(Array.from(e.target.files));
      setShowUploadDialog(false);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    setIsProcessing(true);
    // Simulate file processing
    setTimeout(() => {
      setIsProcessing(false);
      // Show success notification
      alert(`✅ Successfully uploaded ${files.length} file(s) to ${assistantName}'s knowledge base!`);
    }, 3000);
  };

  const handleCreateFolder = () => {
    // Implement folder creation logic
    setShowCreateDialog(false);
    alert(`✅ New knowledge folder created for ${assistantName}!`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'indexed':
        return 'text-green-600 bg-green-50';
      case 'processing':
        return 'text-blue-600 bg-blue-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'indexed':
        return <CheckCircle className="w-4 h-4" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Database className="w-4 h-4" />;
    }
  };

  const getRecommendations = () => {
    const recommendations = [];
    
    if (assistantType === 'legal') {
      recommendations.push(
        'Upload legal case studies and precedents',
        'Add regulatory compliance documents',
        'Include contract templates and examples'
      );
    } else if (assistantType === 'research') {
      recommendations.push(
        'Add academic papers and research studies',
        'Include data analysis methodologies',
        'Upload industry reports and whitepapers'
      );
    } else {
      recommendations.push(
        'Upload relevant industry documents',
        'Add training materials and guides',
        'Include best practices documentation'
      );
    }
    
    return recommendations;
  };

  if (folders.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {assistantName} Knowledge Base
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Build your AI's expertise with targeted knowledge
              </p>
            </div>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Get Started
          </Button>
        </div>

        {/* Empty State with Smart Onboarding */}
        <div 
          ref={dropZoneRef}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            isDragging 
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
              : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {isDragging ? (
              <Upload className="w-8 h-8 text-blue-600 animate-bounce" />
            ) : (
              <Database className="w-8 h-8 text-gray-400" />
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {isDragging ? 'Drop files here!' : 'No Knowledge Base Yet'}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {isDragging 
              ? 'Release to upload documents and start building your knowledge base'
              : `${assistantName} needs knowledge to become truly powerful. Upload documents, create folders, or import from templates.`
            }
          </p>

          {!isDragging && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Documents
                </Button>
                <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Create Folder
                </Button>
              </div>

              {/* Smart Recommendations */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-gray-900 dark:text-white">Smart Recommendations</span>
                </div>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {getRecommendations().map((rec, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Star className="w-3 h-3 text-yellow-500" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowUploadDialog(true)}>
            <CardContent className="p-4 text-center">
              <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <h4 className="font-medium mb-1">Upload Files</h4>
              <p className="text-xs text-gray-600">Add PDFs, docs, or text files</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowCreateDialog(true)}>
            <CardContent className="p-4 text-center">
              <FolderOpen className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h4 className="font-medium mb-1">Create Folder</h4>
              <p className="text-xs text-gray-600">Organize by topic or type</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Sparkles className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <h4 className="font-medium mb-1">Use Template</h4>
              <p className="text-xs text-gray-600">Start with pre-built knowledge</p>
            </CardContent>
          </Card>
        </div>

        {/* Create Folder Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Knowledge Folder</DialogTitle>
              <DialogDescription>
                Organize your knowledge base with focused folders for different topics or document types.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="folder-name">Folder Name</Label>
                <Input id="folder-name" placeholder="e.g., Legal Precedents, Case Studies..." />
              </div>
              <div>
                <Label htmlFor="folder-description">Description</Label>
                <Textarea id="folder-description" placeholder="Describe what type of knowledge this folder will contain..." />
              </div>
              <div>
                <Label htmlFor="folder-category">Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="legal">Legal Documents</SelectItem>
                    <SelectItem value="research">Research Materials</SelectItem>
                    <SelectItem value="cases">Case Studies</SelectItem>
                    <SelectItem value="procedures">Procedures & Guides</SelectItem>
                    <SelectItem value="reference">Reference Materials</SelectItem>
                    <SelectItem value="templates">Templates</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFolder}>
                <FolderOpen className="w-4 h-4 mr-2" />
                Create Folder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Upload Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Documents</DialogTitle>
              <DialogDescription>
                Add documents to build {assistantName}'s knowledge base. Supported formats: PDF, DOC, DOCX, TXT, MD.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="font-medium mb-1">Click to upload or drag files here</p>
                <p className="text-sm text-gray-600">Max file size: 10MB per file</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.md"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleFileUpload(Array.from(e.target.files));
                      setShowUploadDialog(false);
                    }
                  }}
                />
              </div>
              
              {isProcessing && (
                <div className="flex items-center justify-center space-x-2 text-blue-600">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing documents...</span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Existing knowledge base view
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Enhanced Header with Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {assistantName} Knowledge Base
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>{knowledgeStats.totalDocuments} documents</span>
              <span>{knowledgeStats.totalSize}</span>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(knowledgeStats.processingStatus).replace('text-', 'bg-').replace('bg-', 'bg-')}`}></div>
                {knowledgeStats.processingStatus}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={isLoading}>
            {isLoading ? (
              <Loader className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Sync
          </Button>
          <Button size="sm" onClick={() => setShowCreateDialog(true)} disabled={isLoading}>
            {isLoading ? (
              <Loader className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Add More
          </Button>
        </div>
      </div>

      {/* Clean Single View - No Tabs */}
      <div className="space-y-6">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Relevance Score</p>
                  <p className="text-2xl font-bold text-green-600">{knowledgeStats.avgRelevanceScore}%</p>
                </div>
                <Target className="w-8 h-8 text-green-500" />
              </div>
              <Progress value={knowledgeStats.avgRelevanceScore} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Processing Status</p>
                  <div className={`flex items-center gap-2 mt-1 px-2 py-1 rounded-full text-sm ${getStatusColor(knowledgeStats.processingStatus)}`}>
                    {getStatusIcon(knowledgeStats.processingStatus)}
                    <span className="capitalize">{knowledgeStats.processingStatus}</span>
                  </div>
                </div>
                <Brain className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Last Updated</p>
                  <p className="text-lg font-semibold text-gray-900">{knowledgeStats.lastUpdated}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Folders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Connected Knowledge</h4>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowCreateDialog(true)} 
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Connect More
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg">
              <div className="flex flex-col items-center">
                <Loader className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-gray-600 mt-2">Updating knowledge connections...</p>
              </div>
            </div>
          ) : selectedFolders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedFolders.map(folderId => {
                const folder = folders.find(f => f.id === folderId);
                if (!folder) return null;
                return (
                  <Card key={folder.id} className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <div>
                            <p className="font-medium">{folder.name}</p>
                            <p className="text-xs text-gray-600">{Math.floor(Math.random() * 50) + 10} documents</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onUnselect(folder.id)}
                          disabled={isLoading}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No knowledge sources connected yet</p>
              <Button size="sm" onClick={() => setShowCreateDialog(true)} className="mt-2">
                Connect Your First Source
              </Button>
            </div>
          )}
        </div>

        {/* Available Folders to Connect */}
        {folders.filter(folder => !selectedFolders.includes(folder.id)).length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Available to Connect</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
              {folders
                .filter(folder => !selectedFolders.includes(folder.id))
                .map(folder => (
                  <Card key={folder.id} className="cursor-pointer hover:shadow-md transition-shadow border-dashed border-gray-300" onClick={() => onSelect(folder.id)}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <FolderOpen className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{folder.name}</p>
                          <p className="text-xs text-gray-600">{Math.floor(Math.random() * 50) + 10} documents</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="w-5 h-5 text-blue-500" />
              Smart Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {knowledgeStats.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                  <Star className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{rec}</p>
                    <Button size="sm" variant="ghost" className="text-xs text-blue-600 p-0 h-auto">
                      Take Action →
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Keep the create dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Knowledge Source</DialogTitle>
            <DialogDescription>
              Add folders and documents to enhance your assistant's knowledge
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowUploadDialog(true)}>
                <CardContent className="p-4 text-center">
                  <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <h4 className="font-medium mb-1">Upload Files</h4>
                  <p className="text-xs text-gray-600">Add PDFs, docs, or text files</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <FolderOpen className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <h4 className="font-medium mb-1">Browse Folders</h4>
                  <p className="text-xs text-gray-600">Connect existing knowledge</p>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keep the upload dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Knowledge Files</DialogTitle>
            <DialogDescription>
              Upload documents to enhance your assistant's knowledge base
            </DialogDescription>
          </DialogHeader>
          
          <div 
            ref={dropZoneRef}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Drag and drop files here, or</p>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              Browse Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.md"
              className="hidden"
              onChange={handleFileSelect}
            />
            <p className="text-xs text-gray-500 mt-2">
              Supports PDF, DOC, DOCX, TXT, and MD files
            </p>
          </div>
          
          {isProcessing && (
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Processing files...</span>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
