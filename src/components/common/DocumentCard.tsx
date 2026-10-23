import React from 'react';
import { FileText, Eye, MessageSquare, Star, Download, Brain, Link2, Tag, Zap, CheckCircle2, Clock, AlertCircle, Trash2, MoreHorizontal, Move, CheckSquare, Square, Copy, Edit2, Bot, Maximize } from 'lucide-react';
import { useDrag } from 'react-dnd';
import { Button } from '../ui/Button';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import type { AIDocument } from '../../types/ai';
import type { AIDriveFile } from '../../services/drive/aiDriveService';
import { cleanDocumentTitle } from '../../utils/documentUtils';
import { useSelection } from '../knowledge/EnhancedSelectionContext'; // Updated import
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator
} from '../ui/DropdownMenu';

// Unified document interface for both Knowledge Base and Drive
export interface UnifiedDocument {
  id: string;
  title: string;
  content?: string;
  preview?: string;
  size?: number;
  type: string;
  tags?: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  starred?: boolean;
  folderId?: string | null;
  // Drive-specific fields
  is_folder?: boolean;
  parent_id?: string | null;
  path?: string;
  // Knowledge base specific fields
  vectorized?: boolean; 
  aiSummary?: string; 
  embedding?: any; 
}

export interface DocumentCardProps {
  document: UnifiedDocument;
  variant?: 'knowledge' | 'drive' | 'enhanced';
  viewMode?: 'grid' | 'list';
  showPreview?: boolean;
  showActions?: boolean;
  isSelected?: boolean;
  onClick?: (document: UnifiedDocument) => void;
  onPreview?: (document: UnifiedDocument) => void;
  onChat?: (document: UnifiedDocument) => void;
  onToggleStar?: (document: UnifiedDocument) => void;
  onDelete?: (document: UnifiedDocument) => void;
  onDownload?: (document: UnifiedDocument) => void;
  onLinkToKnowledgeBase?: (document: UnifiedDocument) => void;
  onRename?: (document: UnifiedDocument, newName: string) => void;
  onMove?: (document: UnifiedDocument, folderId: string) => void;
  onDuplicate?: (document: UnifiedDocument) => void;
  onAssignToAssistant?: (document: UnifiedDocument, assistantId: string) => void;
  onReprocess?: (document: UnifiedDocument) => void;
  onViewDetails?: (document: UnifiedDocument) => void;
  onOpenFullView?: (document: UnifiedDocument) => void;
  className?: string;
}

export function DocumentCard({
  document,
  variant = 'knowledge',
  viewMode = 'grid',
  showPreview = true,
  showActions = true,
  isSelected = false,
  onClick,
  onPreview,
  onChat,
  onToggleStar,
  onDelete,
  onDownload,
  onLinkToKnowledgeBase,
  onRename,
  onMove,
  onDuplicate,
  onAssignToAssistant,
  onReprocess,
  onViewDetails,
  onOpenFullView,
  className
}: DocumentCardProps) {
  // All hooks at the top level
  const { selectedDocuments, toggleSelectDocument, isDocumentSelected } = useSelection();
  const { folders } = useKnowledgeBaseStore();
  // We'll use the built-in state management of the dropdown instead of separate state

  // Derived state
  const isBulkSelected = isDocumentSelected(document.id);

  // Drag and drop hook with visual feedback
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: 'DOCUMENT',
    item: {
      id: document.id,
      type: 'DOCUMENT',
      selected: isBulkSelected,
      document: document
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [document.id, document, isBulkSelected]);
  // Check if there are selected documents using safe type checking
  const hasSelection = selectedDocuments && 
    (Array.isArray(selectedDocuments) 
      ? selectedDocuments.length > 0 
      : (selectedDocuments as unknown as Set<string>).size > 0);
  const isStarred = document.starred || document.metadata?.tags?.includes('starred') || document.tags?.includes('starred') || false;

  // Function to toggle document selection
  const handleToggleSelection = () => {
    toggleSelectDocument(document.id);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Handle bulk selection with Ctrl/Cmd or Shift
    if (e.ctrlKey || e.metaKey) {
      handleToggleSelection();
      return;
    }
    
    // If there is any bulk selection active, clicking a card toggles its selection
    if (hasSelection) {
      handleToggleSelection();
      return;
    }
    
    // Regular click behavior
    onClick?.(document);
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPreview?.(document);
  };

  const handleChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChat?.(document);
  };

  const handleToggleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleStar?.(document);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(document);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload?.(document);
  };

  const handleLinkToKnowledgeBase = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLinkToKnowledgeBase?.(document);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Use the dropdown menu instead of context menu
    // Show menu via normal right-click
  };

  // All event handlers are now handled directly in the dropdown menu onSelect callbacks

  // Render a consolidated dropdown menu for actions
  const renderActionMenu = () => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
          {/* Core Document Actions - Top Priority */}
          {onViewDetails && (
            <DropdownMenuItem onSelect={() => onViewDetails(document)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
          )}

          {onPreview && (
            <DropdownMenuItem onSelect={() => onPreview(document)}>
              <FileText className="h-4 w-4 mr-2" />
              Preview
            </DropdownMenuItem>
          )}
          
          {onOpenFullView && (
            <DropdownMenuItem onSelect={() => onOpenFullView(document)}>
              <Maximize className="h-4 w-4 mr-2" />
              Open Full View
            </DropdownMenuItem>
          )}
          
          {/* AI Features */}
          {(onReprocess || onChat || onAssignToAssistant) && <DropdownMenuSeparator />}
          
          {onReprocess && variant === 'knowledge' && (
            <DropdownMenuItem onSelect={() => onReprocess(document)}>
              <Brain className="h-4 w-4 mr-2" />
              Process with AI
            </DropdownMenuItem>
          )}
          
          {onChat && (
            <DropdownMenuItem onSelect={() => onChat(document)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat about Document
            </DropdownMenuItem>
          )}
          
          {onAssignToAssistant && (
            <DropdownMenuItem onSelect={() => {
              // If implementation requires assistant selection, use a more sophisticated approach
              const assistantId = prompt('Enter assistant ID:');
              if (assistantId) onAssignToAssistant(document, assistantId);
            }}>
              <Bot className="h-4 w-4 mr-2" />
              Assign to Assistant
            </DropdownMenuItem>
          )}

          {/* File Management */}
          {(onRename || onMove || onDownload || onDuplicate || onToggleStar) && <DropdownMenuSeparator />}
          
          {onToggleStar && (
            <DropdownMenuItem onSelect={() => onToggleStar(document)}>
              <Star className={`h-4 w-4 mr-2 ${isStarred ? 'text-yellow-500 fill-current' : ''}`} />
              {isStarred ? 'Remove Star' : 'Add Star'}
            </DropdownMenuItem>
          )}
          
          {onRename && (
            <DropdownMenuItem onSelect={() => {
              const newName = prompt('Enter new name', document.title);
              if (newName && newName.trim()) onRename(document, newName);
            }}>
              <Edit2 className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
          )}
          
          {onMove && folders.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Move className="h-4 w-4 mr-2" />
                Move to Folder
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onSelect={() => onMove(document, '')}>
                  📁 Root Folder
                </DropdownMenuItem>
                {folders.map((folder) => (
                  <DropdownMenuItem 
                    key={folder.id} 
                    onSelect={() => onMove(document, folder.id)}
                  >
                    📁 {folder.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
          
          {onDownload && (
            <DropdownMenuItem onSelect={() => onDownload(document)}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
          )}
          
          {onDuplicate && (
            <DropdownMenuItem onSelect={() => onDuplicate(document)}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
          )}
          
          {onLinkToKnowledgeBase && (
            <DropdownMenuItem onSelect={() => onLinkToKnowledgeBase(document)}>
              <Link2 className="h-4 w-4 mr-2" />
              Link to Knowledge Base
            </DropdownMenuItem>
          )}
          
          {/* Danger Zone */}
          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => {
                if (window.confirm(`Are you sure you want to delete "${document.title}"?`)) {
                  onDelete(document);
                }
              }} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // AI Processing status functions (from EnhancedDocumentCard)
  const getProcessingScore = () => {
    let score = 0;
    
    // Vectorization/Embedding (40 points)
    if (isVectorized) score += 40;
    
    // AI Summary/Processing (30 points)
    if (document.aiSummary || document.metadata?.ai_summary || document.metadata?.summary) score += 30;
    
    // Tags/Categorization (20 points)
    if (document.tags?.length || document.metadata?.tags?.length || document.metadata?.auto_tags?.length || document.metadata?.ai_auto_tags?.length) score += 20;
    
    // Content Analysis (10 points)
    if ((document.content?.length || 0) > 100 || document.metadata?.content_analyzed || document.metadata?.ai_processed_at) score += 10;
    
    return Math.min(score, 100);
  };

  const getStatusIcon = () => {
    const score = getProcessingScore();
    if (score >= 80) return <CheckCircle2 className="h-3 w-3 text-green-500" />;
    if (score >= 50) return <Clock className="h-3 w-3 text-yellow-500" />;
    return <AlertCircle className="h-3 w-3 text-red-500" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileSize = () => {
    return formatFileSize(document.size || document.metadata?.size || document.content?.length);
  };
  
  // Better vectorization detection
  const isVectorized = document.vectorized || 
    (document.embedding && 
     typeof document.embedding === 'object' && 
     Object.keys(document.embedding).length > 0 && 
     document.embedding !== null) ||
    (document.metadata?.vectorized === true) ||
    (document.metadata?.embedding_status === 'completed') ||
    (document.metadata?.has_embedding === true) ||
    (document.metadata?.ai_processed_at !== undefined);
    
  const processingScore = getProcessingScore();

  // LIST VIEW - Enhanced from EnhancedDocumentCard
  if (viewMode === 'list') {
    return (
      <div
        ref={dragRef}
        className={cn(
          "group flex items-center p-3 rounded-lg border transition-all duration-200 cursor-pointer relative",
          isSelected 
            ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20" 
            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900",
          isBulkSelected && "ring-2 ring-blue-500 ring-offset-2 bg-blue-50 dark:bg-blue-900/30",
          isDragging && "opacity-50 scale-95",
          className
        )}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {/* Selection Checkbox */}
        {(hasSelection || isBulkSelected) && (
          <div className="absolute top-2 left-2 z-10">
            <input
              type="checkbox"
              checked={isBulkSelected}
              onChange={(e) => {
                e.stopPropagation();
                toggleSelectDocument(document.id);
              }}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        )}
        {/* File Type Icon */}
        <div className="flex-shrink-0 mr-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        {/* Document Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {cleanDocumentTitle(document.title)}
              </h3>
              <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                <span>{document.type || 'Unknown'}</span>
                <span>•</span>
                <span>{getFileSize()}</span>
                <span>•</span>
                <span>{format(new Date(document.updated_at), 'MMM d, yyyy')}</span>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center space-x-2 ml-3">
              {/* Processing Status */}
              {variant === 'knowledge' && (
                <div className="flex items-center space-x-1">
                  {getStatusIcon()}
                  <span className="text-xs text-gray-500">{processingScore}%</span>
                </div>
              )}

              {/* Vectorized Badge */}
              {variant === 'knowledge' && isVectorized && (
                <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full text-xs">
                  <Zap className="h-3 w-3" />
                  <span>AI Ready</span>
                </div>
              )}

              {/* Star */}
              {isStarred && (
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
              )}
            </div>
          </div>

          {/* Tags */}
          {document.tags && document.tags.length > 0 && (
            <div className="flex items-center space-x-1 mt-2">
              <Tag className="h-3 w-3 text-gray-400" />
              <div className="flex flex-wrap gap-1">
                {document.tags.filter(tag => tag !== 'starred').slice(0, 3).map(tag => (
                  <span 
                    key={tag}
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
                {document.tags.filter(tag => tag !== 'starred').length > 3 && (
                  <span className="text-xs text-gray-500">+{document.tags.filter(tag => tag !== 'starred').length - 3}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center space-x-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
            {onToggleStar && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleStar}
                className="h-8 w-8 p-0"
              >
                <Star className={cn("h-4 w-4", isStarred ? "text-yellow-500 fill-current" : "text-gray-400")} />
              </Button>
            )}
            
            {onChat && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleChat}
                className="h-8 w-8 p-0"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            )}
            
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Check if this document is linked to any assistants (via its folder)
  const isLinkedToAssistants = document.metadata?.linkedAssistants && 
    document.metadata.linkedAssistants.length > 0;
  
  // GRID VIEW - Enhanced from EnhancedDocumentCard
  return (
    <div
      ref={dragRef}
      className={cn(
        "group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer",
        isSelected 
          ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 shadow-md" 
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900 hover:shadow-lg",
        isBulkSelected && "ring-2 ring-blue-500 ring-offset-2 bg-blue-50 dark:bg-blue-900/30",
        isDragging && "opacity-50 scale-95",
        isLinkedToAssistants && "border-green-300 dark:border-green-700 bg-green-50/20 dark:bg-green-900/10",
        className
      )}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {/* Selection Checkbox */}
      <div 
        className={cn(
          "absolute top-2 left-2 z-10 transition-opacity duration-200",
          (hasSelection || isBulkSelected) 
            ? "opacity-100" 
            : "opacity-0 group-hover:opacity-100"
        )}
        onClick={(e) => {
          e.stopPropagation();
          handleToggleSelection();
        }}
      >
        {isBulkSelected ? (
          <CheckSquare className="h-5 w-5 text-blue-500" />
        ) : (
          <Square className="h-5 w-5 text-gray-400" />
        )}
      </div>
      
      {/* Linked to Assistant Indicator */}
      {document.metadata?.linkedAssistants && document.metadata.linkedAssistants.length > 0 && (
        <div className="absolute top-2 left-10 z-10">
          <div className="flex items-center bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded-full px-2 py-0.5 shadow-sm">
            <Bot className="h-3 w-3 mr-1" />
            <span className="font-medium">{document.metadata.linkedAssistants.length > 1 ? `${document.metadata.linkedAssistants.length} Assistants` : '1 Assistant'}</span>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        
        {showActions && (
          <div className="flex items-center space-x-1">
            {/* Star */}
            {onToggleStar && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleStar}
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Star className={cn("h-4 w-4", isStarred ? "text-yellow-500 fill-current" : "text-gray-400")} />
              </Button>
            )}
            
            {/* Actions Menu */}
            {renderActionMenu()}
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
        {cleanDocumentTitle(document.title)}
      </h3>

      {/* Preview Content */}
      {showPreview && document.preview && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {document.preview}
        </p>
      )}

      {/* AI Summary for Knowledge Base */}
      {variant === 'knowledge' && document.aiSummary && (
        <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-1 mb-1">
            <Brain className="h-3 w-3 text-blue-600" />
            <span className="text-xs font-medium text-blue-600">AI Summary</span>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-300 line-clamp-2">
            {document.aiSummary}
          </p>
        </div>
      )}

      {/* Metadata */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{document.type || 'Unknown'}</span>
          <span>{getFileSize()}</span>
        </div>
        
        {/* Processing Status */}
        {variant === 'knowledge' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              {getStatusIcon()}
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {processingScore}% processed
              </span>
            </div>
            
            {/* AI Ready Badge */}
            {isVectorized && (
              <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full text-xs">
                <Zap className="h-3 w-3" />
                <span>AI Ready</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tags */}
      {document.tags && document.tags.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {document.tags.filter(tag => tag !== 'starred').slice(0, 2).map(tag => (
              <span 
                key={tag}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                {tag}
              </span>
            ))}
            {document.tags.filter(tag => tag !== 'starred').length > 2 && (
              <span className="text-xs text-gray-500 px-2 py-1">+{document.tags.filter(tag => tag !== 'starred').length - 2}</span>
            )}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {format(new Date(document.updated_at), 'MMM d, yyyy')}
        </span>
        
        {showActions && (
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onPreview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePreview}
                className="h-7 w-7 p-0"
              >
                <Eye className="h-3 w-3" />
              </Button>
            )}

            {onChat && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleChat}
                className="h-7 w-7 p-0"
              >
                <MessageSquare className="h-3 w-3" />
              </Button>
            )}
            
            {onDownload && variant === 'drive' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="h-7 w-7 p-0"
              >
                <Download className="h-3 w-3" />
              </Button>
            )}
            
            {onLinkToKnowledgeBase && variant === 'drive' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLinkToKnowledgeBase}
                className="h-7 w-7 p-0"
              >
                <Link2 className="h-3 w-3" />
              </Button>
            )}
            
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Context menu replaced by dropdown menu */}
    </div>
  );
}

// Helper function to adapt different document types to a unified format
export function adaptAIDocumentToUnified(doc: AIDocument): UnifiedDocument {
  const getISOString = (date: any): string => {
    if (!date) return new Date().toISOString();
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return new Date().toISOString();
      return d.toISOString();
    } catch (e) {
      return new Date().toISOString();
    }
  };

  const isVectorized = doc.metadata?.vectorized || 
                    doc.metadata?.has_embedding || 
                    !!doc.embedding || 
                    (doc as any).ai_enabled || 
                    ((doc.metadata as any)?.ai_enabled) ||
                    doc.metadata?.ai_processed_at ||
                    doc.metadata?.ai_summary;

  return {
    id: doc.id,
    title: cleanDocumentTitle(doc.title || doc.metadata?.title || 'Untitled Document'),
    content: doc.content,
    preview: doc.content?.substring(0, 200),
    size: doc.metadata?.size || doc.content?.length || 0,
    type: doc.type || 'document',
    tags: doc.metadata?.tags || doc.metadata?.ai_auto_tags,
    metadata: {
      ...doc.metadata,
      // Ensure AI processing data is properly exposed
      ai_processed_at: doc.metadata?.ai_processed_at,
      ai_enabled: (doc.metadata as any)?.ai_enabled || (doc as any).ai_enabled,
      ai_last_processed: (doc.metadata as any)?.ai_last_processed || (doc as any).ai_last_processed,
      ai_confidence: (doc.metadata as any)?.ai_confidence || (doc as any).ai_confidence,
      has_embedding: isVectorized
    },
    created_at: getISOString(doc.metadata?.date),
    updated_at: getISOString(doc.metadata?.ai_processed_at || doc.metadata?.date),
    starred: doc.metadata?.starred || false,
    folderId: doc.folderId,
    vectorized: isVectorized,
    aiSummary: doc.metadata?.ai_summary,
    embedding: doc.embedding,
  };
}

export function adaptAIDriveFileToUnified(file: AIDriveFile): UnifiedDocument {
  const getISOString = (date: any): string => {
    if (!date) return new Date().toISOString();
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return new Date().toISOString();
      return d.toISOString();
    } catch (e) {
      return new Date().toISOString();
    }
  };

  return {
    id: file.id,
    title: cleanDocumentTitle(file.name || 'Untitled Document'),
    content: undefined, // Content not stored in AIDriveFile
    preview: file.ai_summary?.substring(0, 200), // Use AI summary as preview
    size: file.size || 0,
    type: file.mime_type || 'unknown',
    tags: file.ai_metadata?.auto_tags,
    metadata: file.ai_metadata,
    created_at: getISOString(file.created_at),
    updated_at: getISOString(file.updated_at),
    starred: file.is_starred,
    folderId: file.parent_id,
    is_folder: file.is_folder,
    parent_id: file.parent_id,
    path: file.path
  };
}