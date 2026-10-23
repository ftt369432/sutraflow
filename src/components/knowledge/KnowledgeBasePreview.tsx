import React, { useState, useEffect, useMemo } from 'react';
import { AIDocument } from '../../types/ai';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Brain, FileText, X, Star, Tag, User, Calendar, BarChart3, Zap, CheckCircle2, ChevronDown, ChevronUp, Copy, Edit, Maximize, ExternalLink } from 'lucide-react';
import { Button } from '../ui/Button';
import { cleanDocumentTitle } from '../../utils/documentUtils';
import { DocumentViewer } from './DocumentViewer';
import { MarkdownMessage } from '../ai/MarkdownMessage';
import { popOutDocument } from '../../utils/windowUtils';

interface KnowledgeBasePreviewProps {
  document: AIDocument;
  onClose?: () => void;
  onStarToggle?: (documentId: string) => void;
  onEdit?: (document: AIDocument) => void;
  onOpenFullView?: (document: AIDocument) => void;
  onCopy?: (document: AIDocument) => void;
}

export const KnowledgeBasePreview: React.FC<KnowledgeBasePreviewProps> = ({ 
  document,
  onClose,
  onStarToggle,
  onEdit,
  onOpenFullView,
  onCopy
}) => {
  const [activeTab, setActiveTab] = useState('insights');
  const [aiInsights, setAiInsights] = useState<string>('');
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(false);

  const isStarred = document.metadata?.tags?.includes('starred') || false;

  // Calculate processing score
  const processingScore = useMemo(() => {
    let score = 0;
    if (document.metadata?.date) score += 10;
    if (document.metadata?.author) score += 10;
    if (document.metadata?.source) score += 10;
    if (document.metadata?.tags?.length) score += 20;
    if (document.metadata?.ai_auto_tags?.length) score += 20;
    if (document.metadata?.ai_processed_at) score += 30;
    return Math.min(score, 100);
  }, [document]);

  const getFileSize = () => {
    const size = document.metadata?.size || 0;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${Math.round(size / (1024 * 1024))} MB`;
  };

  // Generate AI insights when document changes
  useEffect(() => {
    if (activeTab === 'insights' && !aiInsights) {
      generateAIInsights();
    }
  }, [activeTab, document.id]);

  const generateAIInsights = async () => {
    setIsGeneratingInsights(true);
    try {
      // Mock AI insights generation - replace with actual AI service call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use actual document metadata for insights
      const isVectorized = 
        (document.embedding && Array.isArray(document.embedding) && document.embedding.length > 0) || 
        document.metadata?.vectorized === true || 
        document.metadata?.has_embedding === true || 
        document.metadata?.ai_processed_at !== undefined ||
        document.metadata?.ai_summary;

      setAiInsights(`
## Document Analysis

**Document Type**: ${document.type || 'Unknown'}
**Processing Status**: ${isVectorized ? '✅ Vectorized' : '⚠️ Not vectorized'}

### Key Information
- **Title**: ${document.metadata?.title || (document.title ? cleanDocumentTitle(document.title) : 'Untitled')}
- **Source**: ${document.metadata?.source || 'Unknown'}
- **Content Length**: ${document.content?.length || 'Unknown'} characters
- **Last Updated**: ${document.metadata?.date ? new Date(document.metadata.date).toLocaleDateString() : 'Unknown'}
${document.metadata?.ai_processed_at ? `- **AI Processed**: ${new Date(document.metadata.ai_processed_at).toLocaleDateString()}` : ''}
      `);
    } catch (error) {
      console.error('Error generating AI insights:', error);
      setAiInsights('Failed to generate AI insights. Please try again.');
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const handleStarToggle = () => {
    if (onStarToggle && document.id) {
      onStarToggle(document.id);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex-none p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-start space-x-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold truncate text-gray-900 dark:text-white mb-1">
                  {document.title ? cleanDocumentTitle(document.title) : 'Untitled'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {document.type || 'Unknown file type'} • {getFileSize()}
                </p>
                
                {/* Quick Stats */}
                <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Zap className="h-3 w-3" />
                    <span>{
                      (document.embedding && Array.isArray(document.embedding) && document.embedding.length > 0) || 
                      document.metadata?.vectorized === true || 
                      document.metadata?.has_embedding === true || 
                      document.metadata?.ai_processed_at !== undefined ||
                      document.metadata?.ai_summary
                      ? 'Vectorized' : 'Not vectorized'
                    }</span>
                  </div>
                  {((document.metadata?.tags?.length || 0) + (document.metadata?.ai_auto_tags?.length || 0)) > 0 && (
                    <div className="flex items-center space-x-1">
                      <Tag className="h-3 w-3" />
                      <span>{(document.metadata?.tags?.length || 0) + (document.metadata?.ai_auto_tags?.length || 0)} tags</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <BarChart3 className="h-3 w-3" />
                    <span>{processingScore}% processed</span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}              <div className="flex items-center space-x-2">
                {onCopy && (
                  <Button
                    variant="assistant"
                    size="sm"
                    onClick={() => onCopy(document)}
                    title="Copy document"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
                
                {onEdit && (
                  <Button
                    variant="assistant"
                    size="sm"
                    onClick={() => onEdit(document)}
                    title="Edit document"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                
                {onOpenFullView && (
                  <Button
                    variant="assistant"
                    size="sm"
                    onClick={() => onOpenFullView(document)}
                    title="Open full view"
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => popOutDocument(document.title || 'Untitled Document', document.content || '', document.type || 'Document')}
                  className="flex items-center gap-1.5 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  title="Pop out into new window"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold">Open in New Window</span>
                </Button>
                
                <Button
                  variant="assistant"
                  size="sm"
                  onClick={handleStarToggle}
                  className={isStarred ? 'text-yellow-500' : ''}
                  title={isStarred ? "Unstar document" : "Star document"}
                >
                  <Star className={`h-4 w-4 ${isStarred ? 'fill-current' : ''}`} />
                </Button>
                
                {onClose && (
                  <Button
                    variant="assistant"
                    size="sm"
                    onClick={onClose}
                    title="Close preview"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Processing Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>AI Processing Status</span>
            <span>{processingScore}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                processingScore > 80 ? 'bg-green-500' : 
                processingScore > 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${processingScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Metadata Panel */}
      <div className="flex-none bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <button 
          onClick={() => setIsMetadataExpanded(!isMetadataExpanded)}
          className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Document Metadata</span>
          {isMetadataExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {isMetadataExpanded && (
          <div className="p-4 pt-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Added: {document.metadata?.date ? new Date(document.metadata.date).toLocaleDateString() : 'Unknown'}</span>
                </div>
                {document.metadata?.author && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <User className="h-4 w-4 mr-2" />
                    <span>Author: {document.metadata.author}</span>
                  </div>
                )}
                {document.metadata?.ai_processed_at && (
                  <div className="flex items-center text-emerald-600 dark:text-emerald-400">
                    <Brain className="h-4 w-4 mr-2" />
                    <span>AI Processed: {new Date(document.metadata.ai_processed_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  <span>Source: {document.metadata?.source || 'User Upload'}</span>
                </div>
                {document.metadata?.category && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Tag className="h-4 w-4 mr-2" />
                    <span>Category: {document.metadata.category}</span>
                  </div>
                )}
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  <span>Size: {getFileSize()}</span>
                </div>
              </div>
            </div>
            
            {/* Legal Classification */}
            {document.metadata?.ai_auto_tags?.some(tag => 
              ['labor_code', 'case_law', 'ttd', 'penalties', 'compensation', 'insurance', 'medical', 'litigation'].includes(tag)
            ) && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Legal Document Classification</h4>
                <div className="grid grid-cols-2 gap-2">
                  {document.metadata.ai_auto_tags.includes('labor_code') && (
                    <div className="flex items-center text-blue-700 dark:text-blue-400">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                      <span>Labor Code</span>
                    </div>
                  )}
                  {document.metadata.ai_auto_tags.includes('case_law') && (
                    <div className="flex items-center text-indigo-700 dark:text-indigo-400">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></div>
                      <span>Case Law</span>
                    </div>
                  )}
                  {document.metadata.ai_auto_tags.includes('ttd') && (
                    <div className="flex items-center text-purple-700 dark:text-purple-400">
                      <div className="w-2 h-2 bg-purple-600 rounded-full mr-2"></div>
                      <span>TTD</span>
                    </div>
                  )}
                  {document.metadata.ai_auto_tags.includes('penalties') && (
                    <div className="flex items-center text-red-700 dark:text-red-400">
                      <div className="w-2 h-2 bg-red-600 rounded-full mr-2"></div>
                      <span>Penalties</span>
                    </div>
                  )}
                  {document.metadata.ai_auto_tags.includes('compensation') && (
                    <div className="flex items-center text-emerald-700 dark:text-emerald-400">
                      <div className="w-2 h-2 bg-emerald-600 rounded-full mr-2"></div>
                      <span>Compensation</span>
                    </div>
                  )}
                  {document.metadata.ai_auto_tags.includes('insurance') && (
                    <div className="flex items-center text-cyan-700 dark:text-cyan-400">
                      <div className="w-2 h-2 bg-cyan-600 rounded-full mr-2"></div>
                      <span>Insurance</span>
                    </div>
                  )}
                  {document.metadata.ai_auto_tags.includes('medical') && (
                    <div className="flex items-center text-teal-700 dark:text-teal-400">
                      <div className="w-2 h-2 bg-teal-600 rounded-full mr-2"></div>
                      <span>Medical</span>
                    </div>
                  )}
                  {document.metadata.ai_auto_tags.includes('litigation') && (
                    <div className="flex items-center text-amber-700 dark:text-amber-400">
                      <div className="w-2 h-2 bg-amber-600 rounded-full mr-2"></div>
                      <span>Litigation</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Tags */}
            {((document.metadata?.tags?.length || 0) + (document.metadata?.ai_auto_tags?.length || 0)) > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Document Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {/* Manual Tags */}
                  {(document.metadata?.tags || []).map(tag => (
                    <span 
                      key={`manual-${tag}`}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                    >
                      {tag}
                    </span>
                  ))}
                  {/* AI Auto Tags */}
                  {(document.metadata?.ai_auto_tags || []).map(tag => (
                    <span 
                      key={`ai-${tag}`}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                      title="AI-generated tag"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="flex-none grid w-full grid-cols-2 m-4 mb-0 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">

            <TabsTrigger value="insights" className="flex items-center gap-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-300">
              <Brain className="h-4 w-4" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="document" className="flex items-center gap-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-300">
              <FileText className="h-4 w-4" />
              Document View
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="insights" className="flex-1 overflow-hidden m-0">
            <div className="h-full overflow-y-auto p-4">
              {isGeneratingInsights ? (
                <div className="flex items-center justify-center h-32">
                  <div className="flex items-center space-x-2 text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span>Generating AI insights...</span>
                  </div>
                </div>
              ) : (
                <div className="prose dark:prose-invert max-w-none">
                  <MarkdownMessage content={aiInsights} />
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="document" className="flex-1 overflow-hidden m-0">
            <div className="h-full">
              <DocumentViewer 
                document={document}
                onClose={() => {/* No-op for embedded view */}}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};