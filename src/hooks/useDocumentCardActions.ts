import { useCallback } from 'react';
import type { UnifiedDocument } from '../components/common/DocumentCard';

interface UseDocumentCardActionsProps {
  onPreview?: (document: UnifiedDocument) => void;
  onChat?: (document: UnifiedDocument) => void;
  onToggleStar?: (document: UnifiedDocument) => void;
  onDelete?: (document: UnifiedDocument) => void;
  onDownload?: (document: UnifiedDocument) => void;
  onLinkToKnowledgeBase?: (document: UnifiedDocument) => void;
  onRename?: (document: UnifiedDocument, newName: string) => void;
  onMove?: (document: UnifiedDocument, folderId: string) => void;
  onDuplicate?: (document: UnifiedDocument) => void;
  onAssignToAssistant?: (document: UnifiedDocument) => void;
  onReprocess?: (document: UnifiedDocument) => void;
  onViewDetails?: (document: UnifiedDocument) => void;
}

/**
 * Custom hook for document card actions
 * Centralizes action handler logic for better maintainability
 */
export function useDocumentCardActions(props: UseDocumentCardActionsProps) {
  const {
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
    onViewDetails
  } = props;

  // Event handlers with stopPropagation built-in
  const handleToggleStar = useCallback((e: React.MouseEvent, document: UnifiedDocument) => {
    e.stopPropagation();
    onToggleStar?.(document);
  }, [onToggleStar]);

  const handleDelete = useCallback((e: React.MouseEvent, document: UnifiedDocument) => {
    e.stopPropagation();
    onDelete?.(document);
  }, [onDelete]);

  const handleDownload = useCallback((e: React.MouseEvent, document: UnifiedDocument) => {
    e.stopPropagation();
    onDownload?.(document);
  }, [onDownload]);

  const handlePreview = useCallback((e: React.MouseEvent, document: UnifiedDocument) => {
    e.stopPropagation();
    onPreview?.(document);
  }, [onPreview]);

  const handleChat = useCallback((e: React.MouseEvent, document: UnifiedDocument) => {
    e.stopPropagation();
    onChat?.(document);
  }, [onChat]);

  const handleLinkToKnowledgeBase = useCallback((e: React.MouseEvent, document: UnifiedDocument) => {
    e.stopPropagation();
    onLinkToKnowledgeBase?.(document);
  }, [onLinkToKnowledgeBase]);

  // Menu action handlers (no event needed since they're in dropdown)
  const menuHandlers = {
    onViewDetails: (document: UnifiedDocument) => onViewDetails?.(document),
    onPreview: (document: UnifiedDocument) => onPreview?.(document),
    onReprocess: (document: UnifiedDocument) => onReprocess?.(document),
    onChat: (document: UnifiedDocument) => onChat?.(document),
    onAssignToAssistant: (document: UnifiedDocument) => onAssignToAssistant?.(document),
    onRename: (document: UnifiedDocument, newName: string) => onRename?.(document, newName),
    onMove: (document: UnifiedDocument, folderId: string) => onMove?.(document, folderId),
    onDownload: (document: UnifiedDocument) => onDownload?.(document),
    onDuplicate: (document: UnifiedDocument) => onDuplicate?.(document),
    onLinkToKnowledgeBase: (document: UnifiedDocument) => onLinkToKnowledgeBase?.(document),
    onDelete: (document: UnifiedDocument) => onDelete?.(document)
  };

  return {
    // Direct event handlers
    handleToggleStar,
    handleDelete,
    handleDownload,
    handlePreview,
    handleChat,
    handleLinkToKnowledgeBase,
    // Menu handlers
    ...menuHandlers
  };
}