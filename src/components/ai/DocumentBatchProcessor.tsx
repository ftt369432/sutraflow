import { useState } from 'react';
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  Trash, 
  RefreshCw, 
  Download, 
  ChevronDown,
  Filter,
  Zap,
  AlertTriangle,
  Eye,
  X
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/Table';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/DropdownMenu';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '../ui/Card';
import { useKnowledgeBaseStore, type KBDocument } from '../../store/knowledgeBaseStore';

interface DocumentBatchProcessorProps {
  onProcessDocuments?: (documentIds: string[]) => void;
  onViewDocumentDetails?: (documentId: string) => void;
}

export function DocumentBatchProcessor({ 
  onProcessDocuments,
  onViewDocumentDetails 
}: DocumentBatchProcessorProps) {
  const allDocuments = useKnowledgeBaseStore(state => state.documents);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate document status
  const documentStatuses = allDocuments.map(doc => ({
    id: doc.id,
    title: doc.title || 'Untitled Document',
    hasEmbedding: !!doc.embedding,
    hasSummary: !!doc.metadata?.ai_summary,
    hasAnalysis: !!doc.metadata?.ai_entities || !!doc.metadata?.ai_complexity,
    hasTopics: !!doc.metadata?.ai_topics && doc.metadata.ai_topics.length > 0,
    status: getDocumentStatus(doc),
    type: doc.metadata?.type || 'unknown',
    uploadedAt: doc.metadata?.ai_processed_at || doc.lastUpdated.toISOString(),
    size: doc.metadata?.size ? formatFileSize(doc.metadata.size) : 'Unknown'
  }));

  function getDocumentStatus(doc: KBDocument): 'processed' | 'partial' | 'unprocessed' | 'error' {
    // Check for errors based on status
    if (doc.status === 'error') return 'error';
    // Consider it processed if it has embeddings and a summary
    if (doc.embedding && doc.metadata?.ai_summary) return 'processed';
    // Consider it partial if it has either embeddings or a summary
    if (doc.embedding || doc.metadata?.ai_summary) return 'partial';
    return 'unprocessed';
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // Filter documents based on status
  const filteredDocuments = filterStatus 
    ? documentStatuses.filter(doc => doc.status === filterStatus) 
    : documentStatuses;

  // Handle document selection
  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  // Handle select all checkbox
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(filteredDocuments.map(doc => doc.id));
    }
    setSelectAll(!selectAll);
  };

  // Handle batch processing
  const handleProcessSelectedDocuments = () => {
    if (selectedDocuments.length === 0) return;
    
    setIsProcessing(true);
    setProcessingIds(selectedDocuments);
    
    // Call parent handler if provided
    if (onProcessDocuments) {
      onProcessDocuments(selectedDocuments);
    }

    // In a real implementation, you would update progress as documents are processed
    // This is just a simulation
    setTimeout(() => {
      setIsProcessing(false);
      setProcessingIds([]);
      // Optionally clear selection after processing
      // setSelectedDocuments([]);
      // setSelectAll(false);
    }, 3000);
  };

  // Get status badge style
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'processed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Processed
          </Badge>
        );
      case 'partial':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Partial
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-slate-500">
            Unprocessed
          </Badge>
        );
    }
  };

  // Calculate stats
  const stats = {
    total: documentStatuses.length,
    processed: documentStatuses.filter(doc => doc.status === 'processed').length,
    partial: documentStatuses.filter(doc => doc.status === 'partial').length,
    unprocessed: documentStatuses.filter(doc => doc.status === 'unprocessed').length,
    error: documentStatuses.filter(doc => doc.status === 'error').length,
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Badge className="bg-blue-100 text-blue-800 px-2 py-1">
              Documents
            </Badge>
          </CardContent>
        </Card>
        
        <Card onClick={() => setFilterStatus('processed')} 
              className={filterStatus === 'processed' ? 'ring-2 ring-green-500 ring-offset-2' : 'hover:bg-green-50 cursor-pointer'}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Processed</p>
              <p className="text-2xl font-bold text-green-600">{stats.processed}</p>
            </div>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardContent>
        </Card>
        
        <Card onClick={() => setFilterStatus('partial')} 
              className={filterStatus === 'partial' ? 'ring-2 ring-amber-500 ring-offset-2' : 'hover:bg-amber-50 cursor-pointer'}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Partial</p>
              <p className="text-2xl font-bold text-amber-600">{stats.partial}</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </CardContent>
        </Card>
        
        <Card onClick={() => setFilterStatus('unprocessed')} 
              className={filterStatus === 'unprocessed' ? 'ring-2 ring-slate-500 ring-offset-2' : 'hover:bg-slate-50 cursor-pointer'}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Unprocessed</p>
              <p className="text-2xl font-bold text-slate-600">{stats.unprocessed}</p>
            </div>
            <Badge variant="outline">Pending</Badge>
          </CardContent>
        </Card>
        
        <Card onClick={() => setFilterStatus('error')} 
              className={filterStatus === 'error' ? 'ring-2 ring-red-500 ring-offset-2' : 'hover:bg-red-50 cursor-pointer'}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Errors</p>
              <p className="text-2xl font-bold text-red-600">{stats.error}</p>
            </div>
            <XCircle className="h-5 w-5 text-red-500" />
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {filterStatus && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setFilterStatus(null)}
              className="text-xs h-8"
            >
              <X className="h-3 w-3 mr-1" />
              Clear Filter
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs h-8">
                <Filter className="h-3 w-3 mr-1" />
                Filters
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterStatus('processed')}>
                <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                Show Processed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('unprocessed')}>
                Show Unprocessed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('partial')}>
                <AlertTriangle className="h-3 w-3 mr-2 text-amber-500" />
                Show Partial
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('error')}>
                <XCircle className="h-3 w-3 mr-2 text-red-500" />
                Show Errors
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterStatus(null)}>
                Show All
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {selectedDocuments.length} selected
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={selectedDocuments.length === 0}>
              <Button variant="outline" size="sm" disabled={selectedDocuments.length === 0}>
                Actions
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleProcessSelectedDocuments}>
                <Brain className="h-4 w-4 mr-2 text-blue-500" />
                Process Selected
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Download Selected
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash className="h-4 w-4 mr-2 text-red-500" />
                Delete Selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant="default" 
            onClick={handleProcessSelectedDocuments}
            disabled={selectedDocuments.length === 0 || isProcessing}
            className="flex items-center gap-1"
          >
            {isProcessing ? (
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Brain className="h-4 w-4 mr-1" />
            )}
            Process Selected
          </Button>
        </div>
      </div>

      {/* Document Table */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">Documents</CardTitle>
          <CardDescription>
            Select documents to process with AI or manage individually.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox 
                    checked={selectAll} 
                    onCheckedChange={toggleSelectAll} 
                    aria-label="Select all documents" 
                  />
                </TableHead>
                <TableHead className="w-[300px]">Document</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id} className={selectedDocuments.includes(doc.id) ? "bg-blue-50" : ""}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedDocuments.includes(doc.id)} 
                      onCheckedChange={() => toggleDocumentSelection(doc.id)}
                      aria-label={`Select ${doc.title}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="truncate max-w-[300px]" title={doc.title}>
                      {doc.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(doc.status)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {doc.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{doc.size}</TableCell>
                  <TableCell>
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onViewDocumentDetails?.(doc.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedDocuments([doc.id]);
                            handleProcessSelectedDocuments();
                          }}>
                            <Brain className="h-4 w-4 mr-2 text-blue-500" />
                            Process
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash className="h-4 w-4 mr-2 text-red-500" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filteredDocuments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    No documents found matching the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="border-t bg-slate-50 p-2 flex justify-between">
          <div className="text-xs text-slate-500">
            {selectedDocuments.length} of {filteredDocuments.length} documents selected
          </div>
          <div className="text-xs text-slate-500">
            {stats.total} total documents in knowledge base
          </div>
        </CardFooter>
      </Card>

      {/* Processing Status */}
      {isProcessing && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-md flex items-center">
              <Zap className="h-4 w-4 text-blue-500 mr-2 animate-pulse" />
              Processing Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={30} className="mb-2" />
            <p className="text-sm text-slate-600">
              Processing {processingIds.length} documents... This may take a few minutes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
