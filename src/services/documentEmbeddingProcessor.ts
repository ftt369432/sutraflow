/**
 * DocumentEmbeddingProcessor Service
 * 
 * This service handles automatic background processing of documents to ensure
 * all documents have proper embeddings. It's used for bulk operations and to ensure
 * the system maintains high quality embeddings for all documents.
 */

import { AIDocument } from '../types/ai';
import { useKnowledgeBaseStore } from '../store/knowledgeBaseStore';
import { isValidEmbedding } from '../utils/embeddingUtils';
import { repairDocumentEmbeddings } from './embeddingMonitorService';

interface ProcessingOptions {
  batchSize?: number;
  delayBetweenBatches?: number; // ms
  maxDocumentsToProcess?: number;
  onProgress?: (processed: number, total: number) => void;
  onComplete?: (results: ProcessingResult) => void;
  priorityDocumentIds?: string[]; // Process these documents first
  // New flexible filtering options:
  folderIds?: string[]; // Only process docs in these folders
  documentIds?: string[]; // Only process these docs
  onlyAssignedToFolder?: boolean; // Only docs with a folderId
}

interface ProcessingResult {
  totalDocuments: number;
  processedDocuments: number;
  succeededDocuments: number;
  failedDocuments: number;
  skippedDocuments: number;
}

/**
 * Default processing options
 */
const defaultOptions: ProcessingOptions = {
  batchSize: 5,
  delayBetweenBatches: 1000,
  maxDocumentsToProcess: 100
};

/**
 * Process all documents in the knowledge base to ensure they have valid embeddings
 * 
 * This handles batching to avoid overloading the system and provides progress updates
 */
export async function processAllDocumentsForEmbeddings(
  options: ProcessingOptions = {}
): Promise<ProcessingResult> {
  const mergedOptions = { ...defaultOptions, ...options };
  const {
    batchSize = 5,
    delayBetweenBatches = 1000,
    maxDocumentsToProcess = 100,
    onProgress,
    priorityDocumentIds = [],
    folderIds,
    documentIds,
    onlyAssignedToFolder
  } = mergedOptions;

  // Get store state
  const store = useKnowledgeBaseStore.getState();
  let allDocuments = store.documents;

  // Flexible filtering
  if (documentIds && documentIds.length > 0) {
    allDocuments = allDocuments.filter(doc => documentIds.includes(doc.id));
  } else if (folderIds && folderIds.length > 0) {
    allDocuments = allDocuments.filter(doc => doc.folderId && folderIds.includes(doc.folderId));
  } else if (onlyAssignedToFolder) {
    allDocuments = allDocuments.filter(doc => !!doc.folderId);
  }

  // Get documents that need processing (no embedding or invalid embedding)
  let documentsToProcess = allDocuments.filter(doc => 
    !doc.embedding || !isValidEmbedding(doc.embedding)
  );

  // Apply limit
  if (documentsToProcess.length > maxDocumentsToProcess) {
    documentsToProcess = documentsToProcess.slice(0, maxDocumentsToProcess);
  }

  // Prioritize specific documents if requested
  if (priorityDocumentIds.length > 0) {
    // Sort documents so priority documents come first
    documentsToProcess.sort((a, b) => {
      const aIsPriority = priorityDocumentIds.includes(a.id);
      const bIsPriority = priorityDocumentIds.includes(b.id);
      
      if (aIsPriority && !bIsPriority) return -1;
      if (!aIsPriority && bIsPriority) return 1;
      return 0;
    });
  }

  const totalToProcess = documentsToProcess.length;
  console.log(`[DocumentEmbeddingProcessor] Processing ${totalToProcess} documents for embeddings`);

  // Initialize result tracker
  const result: ProcessingResult = {
    totalDocuments: allDocuments.length,
    processedDocuments: 0,
    succeededDocuments: 0,
    failedDocuments: 0,
    skippedDocuments: allDocuments.length - totalToProcess
  };

  // Process in batches
  for (let i = 0; i < totalToProcess; i += batchSize) {
    const batch = documentsToProcess.slice(i, i + batchSize);
    const batchIds = batch.map(doc => doc.id);
    
    try {
      console.log(`[DocumentEmbeddingProcessor] Processing batch ${i/batchSize + 1}/${Math.ceil(totalToProcess/batchSize)}`);
      
      // Use the repair function which handles content loading, embedding generation and storage
      const repairedIds = await repairDocumentEmbeddings(batchIds);
      
      // Update progress
      result.processedDocuments += batch.length;
      result.succeededDocuments += repairedIds.length;
      result.failedDocuments += batch.length - repairedIds.length;
      
      // Call progress callback if provided
      if (onProgress) {
        onProgress(result.processedDocuments, totalToProcess);
      }
      
      // Add delay between batches to avoid overwhelming the system
      if (i + batchSize < totalToProcess && delayBetweenBatches > 0) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    } catch (error) {
      console.error(`[DocumentEmbeddingProcessor] Error processing batch:`, error);
      result.failedDocuments += batch.length;
    }
  }

  console.log(`[DocumentEmbeddingProcessor] Processing complete:`, result);
  
  // Call complete callback if provided
  if (mergedOptions.onComplete) {
    mergedOptions.onComplete(result);
  }
  
  return result;
}

/**
 * Start automated background processing of documents
 * 
 * This sets up a recurring task to ensure all documents have valid embeddings
 */
export function startBackgroundEmbeddingProcessing(
  intervalMinutes: number = 30,
  options: ProcessingOptions = {}
): () => void {
  console.log(`[DocumentEmbeddingProcessor] Starting background processing (interval: ${intervalMinutes} minutes)`);
  
  // Initial processing
  processAllDocumentsForEmbeddings(options).catch(err => {
    console.error('[DocumentEmbeddingProcessor] Error in initial processing:', err);
  });
  
  // Set up interval for ongoing processing
  const intervalId = setInterval(() => {
    processAllDocumentsForEmbeddings(options).catch(err => {
      console.error('[DocumentEmbeddingProcessor] Error in scheduled processing:', err);
    });
  }, intervalMinutes * 60 * 1000);
  
  // Return function to stop processing
  return () => {
    clearInterval(intervalId);
    console.log('[DocumentEmbeddingProcessor] Background processing stopped');
  };
}
