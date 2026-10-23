import { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  Clock, 
  Database, 
  AlertTriangle, 
  Edit,
  Trash,
  Brain,
  Zap,
  Link2,
  Info,
  Star,
  Bot,
  ArrowUpRightSquare,
  RotateCw,
  Copy,
  Calendar,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/ScrollArea';
import { Separator } from '../ui/Separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { MarkdownMessage } from '../ai/MarkdownMessage';
import { AIDocument } from '../../types/ai';

interface DocumentDetailSidebarProps {
  documentId: string;
  onClose: () => void;
  onReprocess?: (documentId: string) => void;
}

export function DocumentDetailSidebar({ 
  documentId, 
  onClose,
  onReprocess
}: DocumentDetailSidebarProps) {
  const navigate = useNavigate();
  // Get current user ID from the store
  const userId = useKnowledgeBaseStore(state => state.documents[0]?.userId || 'unknown-user');
  const user = { id: userId };
  
  // Get document from store
  const document = useKnowledgeBaseStore(
    state => state.documents.find(doc => doc.id === documentId)
  );
  
  // State for the sidebar
  const [activeTab, setActiveTab] = useState('details');
  const [relatedDocuments, setRelatedDocuments] = useState<AIDocument[]>([]);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  
  // Get additional documents and store methods
  const allDocuments = useKnowledgeBaseStore(state => state.documents);
  const updateDocument = useKnowledgeBaseStore(state => state.updateDocument);
  
  // Check if document is starred
  const isStarred = document?.metadata?.tags?.includes('starred') || false;
  
  // Document not found case
  if (!document) {
    return (
      <div className="w-full h-full flex flex-col p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">Document Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center text-slate-500">
          Document not found or has been deleted.
        </div>
      </div>
    );
  }
  
  // Helper functions
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not available';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // Get document status
  const getDocumentStatus = (doc: AIDocument) => {
    const hasError = doc.metadata?.ai_summary === 'Error processing document';
    if (hasError) return 'error';
    if (doc.embedding && doc.metadata?.ai_summary) return 'processed';
    if (doc.embedding || doc.metadata?.ai_summary) return 'partial';
    return 'unprocessed';
  };

  // Document metadata
  const status = getDocumentStatus(document);
  const tags = document.metadata?.tags || [];
  const autoTags = document.metadata?.ai_auto_tags || [];
  const topics = document.metadata?.ai_topics || [];
  const fileSize = document.metadata?.size ? formatFileSize(document.metadata.size) : 'Unknown';
  const created = document.metadata?.date ? formatDate(document.metadata.date.toString()) : 'Unknown';
  const lastModified = document.metadata?.date ? formatDate(document.metadata.date.toString()) : created;
  const processedAt = document.metadata?.ai_processed_at ? formatDate(document.metadata.ai_processed_at) : 'Never';
  const aiSummary = document.metadata?.ai_summary || 'No AI summary available.';
  
  // Handle document reprocessing
  const handleReprocess = () => {
    onReprocess?.(documentId);
  };

  // Toggle star status
  const handleToggleStar = () => {
    if (!document || !user?.id) return;
    
    const currentTags = document.metadata?.tags || [];
    const hasStarred = currentTags.includes('starred');
    
    const updatedTags = hasStarred
      ? currentTags.filter(t => t !== 'starred')
      : [...currentTags, 'starred'];
    
    updateDocument(document.id, {
      metadata: {
        ...document.metadata,
        tags: updatedTags
      }
    }, user.id);
  };
  
  // Handle document deletion
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      if (user?.id) {
        useKnowledgeBaseStore.getState().removeDocument(document.id, user.id);
        onClose();
      }
    }
  };
  
  // Generate AI insights
  useEffect(() => {
    if (activeTab === 'ai-insights' && !aiInsights) {
      generateAiInsights();
    }
  }, [activeTab, documentId]);
  
  // Get related documents
  useEffect(() => {
    const fetchRelatedDocuments = async () => {
      // In the future, this would call a semantic search endpoint
      // For now, we'll use a basic algorithm to find potentially related documents
      
      // Extract key terms from document title
      const docTitle = document.title || '';
      
      // Find related documents by matching tags, topics or title keywords
      const related = allDocuments
        .filter(doc => doc.id !== documentId) // Exclude current document
        .map(doc => {
          let score = 0;
          
          // Score based on shared tags
          const docTags = doc.metadata?.tags || [];
          const sharedTags = tags.filter(tag => docTags.includes(tag)).length;
          score += sharedTags * 10;
          
          // Score based on shared auto-tags
          const docAutoTags = doc.metadata?.ai_auto_tags || [];
          const sharedAutoTags = autoTags.filter(tag => docAutoTags.includes(tag)).length;
          score += sharedAutoTags * 5;
          
          // Score based on shared topics
          const docTopics = doc.metadata?.ai_topics || [];
          const sharedTopics = topics.filter(topic => docTopics.includes(topic)).length;
          score += sharedTopics * 15;
          
          // Score based on title similarity (simple check for now)
          const otherTitle = doc.title || '';
          if (docTitle && otherTitle) {
            const docWords = docTitle.toLowerCase().split(/\W+/);
            const otherWords = otherTitle.toLowerCase().split(/\W+/);
            const sharedWords = docWords.filter(word => word.length > 3 && otherWords.includes(word)).length;
            score += sharedWords * 8;
          }
          
          return { doc, score };
        })
        .filter(item => item.score > 0) // Only include docs with some relation
        .sort((a, b) => b.score - a.score) // Sort by relevance score
        .slice(0, 5) // Take top 5
        .map(item => item.doc); // Extract just the docs
      
      setRelatedDocuments(related);
    };
    
    fetchRelatedDocuments();
  }, [documentId, tags, topics, autoTags, allDocuments]);
  
  // Generate AI insights
  const generateAiInsights = async () => {
    setIsGeneratingInsights(true);
    try {
      // In a real implementation, this would call an AI service
      // For now, generate a simple markdown analysis
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Get the document status components
      const hasEmbedding = !!document.embedding;
      const hasSummary = !!document.metadata?.ai_summary;
      const hasTopics = topics.length > 0;
      
      setAiInsights(`
## Document Analysis

### Processing Status
${status === 'processed' ? '✅ **Fully Processed**' : status === 'partial' ? '⚠️ **Partially Processed**' : '❌ **Not Processed**'}

${hasEmbedding ? '- ✓ Document has been vectorized for semantic search' : '- ✗ Document has not been vectorized'}
${hasSummary ? '- ✓ AI summary generated' : '- ✗ No AI summary available'}
${hasTopics ? `- ✓ ${topics.length} key topics identified` : '- ✗ No topics extracted'}

### Key Information
- **Document Type**: ${document.type || 'Unknown'}
- **Title**: ${document.title || 'Untitled'}
- **Source**: ${document.metadata?.source || 'Unknown'}
- **Content Length**: ${document.content?.length.toLocaleString() || 'Unknown'} characters
- **Last Updated**: ${document.metadata?.date ? new Date(document.metadata.date).toLocaleDateString() : 'Unknown'}
${document.metadata?.ai_processed_at ? `- **AI Processed**: ${new Date(document.metadata.ai_processed_at).toLocaleDateString()}` : ''}

${topics.length > 0 ? `
### Key Topics
${topics.map((topic: string) => `- ${topic}`).join('\n')}
` : ''}

${document.metadata?.ai_summary ? `
### AI Summary
${document.metadata.ai_summary}
` : ''}

${status !== 'processed' ? `
> To get the full AI analysis of this document, click the **Reprocess Document** button below.
` : ''}
      `);
    } catch (error) {
      console.error('Error generating insights:', error);
      setAiInsights('Failed to generate AI insights for this document.');
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  // Component to render a related document item
  const RelatedDocumentItem = ({ doc }: { doc: AIDocument }) => (
    <div className="flex items-start p-2 mb-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
      <div className="flex-shrink-0 mt-1">
        <FileText className="h-5 w-5 text-gray-400" />
      </div>
      <div className="ml-3 flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h4 className="text-sm font-medium truncate">{doc.title || 'Untitled'}</h4>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => {
              // This would ideally update the current document view
              // without closing the sidebar
              useKnowledgeBaseStore.getState().setSelectedDocumentId(doc.id);
            }}
          >
            <ArrowUpRightSquare className="h-3 w-3" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 truncate">
          {doc.type || 'Unknown'} • {formatFileSize(doc.metadata?.size)}
        </p>
        {(doc.metadata?.ai_topics?.length || 0) > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {doc.metadata?.ai_topics?.slice(0, 2).map((topic, idx) => (
              <span key={idx} className="inline-flex text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5">
                {topic}
              </span>
            ))}
            {(doc.metadata?.ai_topics?.length || 0) > 2 && (
              <span className="inline-flex text-xs bg-gray-100 text-gray-800 rounded-full px-2 py-0.5">
                +{(doc.metadata?.ai_topics?.length || 0) - 2} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {document.title || 'Untitled Document'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {document.type || 'Unknown type'} • {fileSize}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 ${isStarred ? 'text-yellow-500' : ''}`}
            onClick={handleToggleStar}
          >
            <Star className={`h-4 w-4 ${isStarred ? 'fill-current' : ''}`} />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex border-b-0">
            <TabsTrigger value="details" className="flex gap-1.5 items-center">
              <Info className="h-4 w-4" />
              <span>Details</span>
            </TabsTrigger>
            <TabsTrigger value="ai-insights" className="flex gap-1.5 items-center">
              <Brain className="h-4 w-4" />
              <span>AI Insights</span>
            </TabsTrigger>
            <TabsTrigger value="related" className="flex gap-1.5 items-center">
              <Link2 className="h-4 w-4" />
              <span>Related</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Content */}
      <ScrollArea className="flex-1">
        <Tabs value={activeTab} className="h-full">
          {/* Details Tab */}
          <TabsContent value="details" className="p-4 m-0 space-y-6 h-full">
            {/* Status Card */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {status === 'processed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {status === 'partial' && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                  {status === 'error' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                  {status === 'unprocessed' && <Clock className="h-5 w-5 text-slate-400" />}
                  
                  <span className="font-medium">
                    {status === 'processed' && 'Fully Processed'}
                    {status === 'partial' && 'Partially Processed'}
                    {status === 'error' && 'Processing Error'}
                    {status === 'unprocessed' && 'Not Processed'}
                  </span>
                </div>
                
                <Badge 
                  className={
                    status === 'processed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 
                    status === 'partial' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400' : 
                    status === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' : 
                    'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                  }
                >
                  {status}
                </Badge>
              </div>
              
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>Processing Status</span>
                  <span>
                    {document.embedding ? 'Has embedding' : 'No embedding'} • 
                    {document.metadata?.ai_summary ? ' Has summary' : ' No summary'}
                  </span>
                </div>
                <Progress 
                  value={
                    status === 'processed' ? 100 : 
                    status === 'partial' ? 50 : 
                    status === 'error' ? 100 : 
                    0
                  } 
                  className="h-2"
                  indicatorColor={
                    status === 'processed' ? 'bg-green-500' :
                    status === 'partial' ? 'bg-amber-500' :
                    status === 'error' ? 'bg-red-500' :
                    undefined
                  }
                />
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="space-y-2">
              <Button
                onClick={() => {
                  const prompt = `Please review, analyze, and cite document: "${document.title}".\nContent excerpt:\n${(document.content || '').slice(0, 3000)}\n\nTask: Extract all key medical-legal facts, prepare a cross-examination outline or 28-line legal pleading incorporating these authorities under California Workers' Compensation law.`;
                  window.dispatchEvent(new CustomEvent('genieflow:set-prompt', { detail: { prompt } }));
                  navigate('/workbench');
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 gap-1.5 shadow-xs"
              >
                <Sparkles className="h-4 w-4" />
                Analyze in Workbench
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={handleReprocess} 
                  className="flex items-center justify-center gap-2"
                  variant={status === 'error' ? "destructive" : "outline"}
                  size="sm"
                >
                  <RotateCw className="h-4 w-4" />
                  {status === 'error' ? 'Retry Processing' : 'Reprocess'}
                </Button>
                
                <Button 
                  variant="outline"
                  size="sm"
                  className="flex items-center justify-center gap-2"
                  onClick={() => {
                    // Copy document link or content
                    navigator.clipboard.writeText(document.content || '');
                    alert('Document content copied to clipboard!');
                  }}
                >
                  <Copy className="h-4 w-4" />
                  Copy Content
                </Button>
              </div>
            </div>

            {/* Document Information */}
            <div>
              <h3 className="text-sm font-medium mb-3">Document Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start">
                  <FileText className="h-4 w-4 text-slate-400 mr-2 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-slate-500 dark:text-slate-400">Type</div>
                    <div>{document.type || 'Unknown'}</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Database className="h-4 w-4 text-slate-400 mr-2 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-slate-500 dark:text-slate-400">Size</div>
                    <div>{fileSize}</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Calendar className="h-4 w-4 text-slate-400 mr-2 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-slate-500 dark:text-slate-400">Created</div>
                    <div>{created}</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Clock className="h-4 w-4 text-slate-400 mr-2 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-slate-500 dark:text-slate-400">Last Modified</div>
                    <div>{lastModified}</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Brain className="h-4 w-4 text-slate-400 mr-2 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-slate-500 dark:text-slate-400">Last Processed</div>
                    <div>{processedAt}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />

            {/* AI Summary */}
            {document.metadata?.ai_summary && (
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <Zap className="h-4 w-4 mr-2 text-blue-500" />
                  AI Summary
                </h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md text-sm text-slate-700 dark:text-slate-300">
                  {showFullText || aiSummary.length <= 200 ? (
                    aiSummary
                  ) : (
                    <>
                      {aiSummary.substring(0, 200)}...{' '}
                      <button 
                        onClick={() => setShowFullText(true)}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Show more
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Topics */}
            {topics.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Detected Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {topics.map((topic, index) => (
                    <Badge key={index} variant="secondary">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Tags */}
            <div>
              <h3 className="text-sm font-medium mb-2">Tags</h3>
              <div className="space-y-2">
                {tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">No tags added to this document.</div>
                )}
                
                {autoTags.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-slate-500 mb-1">AI Generated Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {autoTags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Linked Assistants */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Linked Assistants</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    // This would open the assistant linking modal
                    // For now, just show an alert
                    alert('Assistant linking functionality would open here');
                  }}
                >
                  <Link2 className="h-3.5 w-3.5 mr-1" />
                  Manage Links
                </Button>
              </div>
              
              <div className="space-y-2">
                {document.metadata?.linkedAssistants && document.metadata.linkedAssistants.length > 0 ? (
                  <div className="space-y-2">
                    {document.metadata.linkedAssistants.map((assistant, index) => (
                      <div key={index} className="flex items-center justify-between bg-green-50 dark:bg-green-900/10 p-2 rounded-md">
                        <div className="flex items-center">
                          <Bot className="h-4 w-4 text-green-600 dark:text-green-500 mr-2" />
                          <span className="text-sm">{assistant.name || `Assistant ${assistant.id}`}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            // Navigate to the assistant
                            alert(`Navigate to assistant ${assistant.id}`);
                          }}
                        >
                          <ArrowUpRightSquare className="h-3.5 w-3.5 text-slate-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 bg-slate-100 dark:bg-slate-800 p-3 rounded-md flex items-center justify-center">
                    No assistants linked to this document.
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="ai-insights" className="p-4 m-0 h-full">
            {isGeneratingInsights ? (
              <div className="flex items-center justify-center h-32">
                <div className="flex items-center space-x-2 text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                  <span>Analyzing document...</span>
                </div>
              </div>
            ) : (
              <div className="prose dark:prose-invert max-w-none">
                <MarkdownMessage content={aiInsights} />
                
                {/* Show reprocess button if not fully processed */}
                {status !== 'processed' && (
                  <div className="mt-6">
                    <Button 
                      onClick={handleReprocess} 
                      className="w-full flex items-center justify-center gap-2"
                      variant="default"
                    >
                      <Brain className="h-4 w-4" />
                      Process Document with AI
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          {/* Related Tab */}
          <TabsContent value="related" className="p-4 m-0 h-full">
            <h3 className="text-sm font-medium mb-3 flex items-center">
              <Link2 className="h-4 w-4 mr-2 text-blue-500" />
              Related Documents
            </h3>
            
            {relatedDocuments.length > 0 ? (
              <div className="space-y-1">
                {relatedDocuments.map((doc) => (
                  <RelatedDocumentItem key={doc.id} doc={doc} />
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500 dark:text-slate-400 p-4 text-center border border-dashed rounded-md">
                No related documents found.
              </div>
            )}
            
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-3">Why these documents?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Related documents are identified based on shared tags, topics, and content similarity.
                Process documents with AI to improve relationship detection.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="border-t p-4 flex justify-between">
        <div>
          <Button variant="outline" size="sm" className="flex items-center">
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center">
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" className="flex items-center" onClick={handleDelete}>
            <Trash className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
