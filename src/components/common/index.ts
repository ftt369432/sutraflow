// Common Components - Unified components that can be used across Knowledge Base and Drive
export { 
  DocumentCard, 
  type DocumentCardProps, 
  type UnifiedDocument,
  adaptAIDocumentToUnified,
  adaptAIDriveFileToUnified 
} from './DocumentCard';

// Re-export other common components as they are created
// export { LoadingSpinner } from './LoadingSpinner';
// export { EmptyState } from './EmptyState';
// export { ErrorBoundary } from './ErrorBoundary'; 