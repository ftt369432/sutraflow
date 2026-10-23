/**
 * Embedding Monitor Service
 * 
 * Provides tools for monitoring, validating, and repairing document embeddings.
 * This service helps ensure that all documents have valid embeddings for optimal semantic search.
 */

import { getEmbedding } from './embeddingService';
import { DocumentService } from './documentService';

export enum EmbeddingStatus {
  VALID = 'valid',
  MISSING = 'missing',
  INVALID = 'invalid'
}

export interface EmbeddingCheckResult {
  documentId: string;
  status: EmbeddingStatus;
  error?: string;
}

export class EmbeddingMonitorService {
  constructor(
    private documentService: DocumentService
  ) {}

  async checkDocumentEmbeddings(docIds: string[]): Promise<string[]> {
    const needsRepair: string[] = [];
    
    for (const docId of docIds) {
      const doc = await this.documentService.getDocument(docId);
      if (!doc?.embedding) {
        needsRepair.push(docId);
      }
    }
    
    return needsRepair;
  }

  async repairDocumentEmbedding(docId: string): Promise<boolean> {
    console.log(`[EmbeddingMonitor] Starting repair for document ${docId}`);
    
    try {
      // Get document content
      const doc = await this.documentService.getDocument(docId);
      if (!doc?.content) {
        console.error(`[EmbeddingMonitor] No content found for document ${docId}`);
        return false;
      }

      // Generate embedding with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      let embedding = null;

      while (retryCount < maxRetries && !embedding) {
        try {
          embedding = await getEmbedding(doc.content);
          break;
        } catch (error) {
          console.error(`[EmbeddingMonitor] Embedding generation failed attempt ${retryCount + 1}/${maxRetries}:`, error);
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
          }
        }
      }

      if (!embedding) {
        console.error(`[EmbeddingMonitor] Failed to generate embedding after ${maxRetries} attempts`);
        return false;
      }

      // Update document with new embedding
      await this.documentService.updateDocument(docId, { embedding });
      console.log(`[EmbeddingMonitor] Successfully repaired embedding for document ${docId}`);
      return true;
    } catch (error) {
      console.error(`[EmbeddingMonitor] Failed to repair document ${docId}:`, error);
      return false;
    }
  }

  // Batch repair documents with rate limiting
  async repairDocuments(docIds: string[]): Promise<string[]> {
    console.log(`[EmbeddingMonitor] Repairing ${docIds.length} documents`);
    
    const batchSize = 5; // Process 5 documents at a time
    const results = { success: 0, failed: 0 };
    const successfulIds: string[] = [];
    
    for (let i = 0; i < docIds.length; i += batchSize) {
      const batch = docIds.slice(i, i + batchSize);
      const batchPromises = batch.map(async id => {
        const success = await this.repairDocumentEmbedding(id);
        if (success) successfulIds.push(id);
        return success;
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.success += batchResults.filter(Boolean).length;
      results.failed += batchResults.filter(r => !r).length;
      
      if (i + batchSize < docIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit between batches
      }
    }
    
    console.log(`[EmbeddingMonitor] Repair complete. Successfully repaired ${results.success}/${docIds.length} documents`);
    return successfulIds;
  }

  // Monitor and repair embeddings periodically
  async startMonitoring(checkIntervalMs: number = 5 * 60 * 1000): Promise<void> {
    console.log(`[EmbeddingMonitor] Starting monitoring with ${checkIntervalMs}ms interval`);
    
    setInterval(async () => {
      try {
        const allDocuments = await this.documentService.getAllDocuments();
        const docIds = allDocuments.map(doc => doc.id);
        const needsRepair = await this.checkDocumentEmbeddings(docIds);
        
        if (needsRepair.length > 0) {
          console.log(`[EmbeddingMonitor] Found ${needsRepair.length} documents needing repair`);
          await this.repairDocuments(needsRepair);
        }
      } catch (error) {
        console.error('[EmbeddingMonitor] Error during monitoring:', error);
      }
    }, checkIntervalMs);
  }
}

// Helper function to repair multiple documents
export async function repairDocumentEmbeddings(
  documentIds: string[], 
  progressCallback?: (current: number, total: number) => void
): Promise<string[]> {
  const documentService = new DocumentService();
  const monitor = new EmbeddingMonitorService(documentService);
  
  // If progress callback is provided, we'll track progress
  if (progressCallback) {
    let completed = 0;
    const total = documentIds.length;
    
    // Create a custom repair function that calls the progress callback
    const repairWithProgress = async (docIds: string[]): Promise<string[]> => {
      const successfulIds: string[] = [];
      
      for (const docId of docIds) {
        try {
          const success = await monitor.repairDocumentEmbedding(docId);
          if (success) successfulIds.push(docId);
          completed++;
          progressCallback(completed, total);
        } catch (error) {
          console.error(`Failed to repair document ${docId}:`, error);
          completed++;
          progressCallback(completed, total);
        }
      }
      
      return successfulIds;
    };
    
    return await repairWithProgress(documentIds);
  } else {
    return await monitor.repairDocuments(documentIds);
  }
}

// Helper function to scan all documents and return their embedding status
export async function scanAllDocumentEmbeddings(): Promise<EmbeddingCheckResult[]> {
  const documentService = new DocumentService();
  
  try {
    const allDocuments = await documentService.getAllDocuments();
    const results: EmbeddingCheckResult[] = [];
    
    for (const doc of allDocuments) {
      let status: EmbeddingStatus;
      let error: string | undefined;
      
      try {
        if (!doc.embedding || doc.embedding.length === 0) {
          status = EmbeddingStatus.MISSING;
        } else if (doc.embedding.some(val => isNaN(val) || !isFinite(val))) {
          status = EmbeddingStatus.INVALID;
          error = 'Contains invalid numerical values';
        } else {
          status = EmbeddingStatus.VALID;
        }
      } catch (err) {
        status = EmbeddingStatus.INVALID;
        error = err instanceof Error ? err.message : 'Unknown error';
      }
      
      results.push({
        documentId: doc.id,
        status,
        error
      });
    }
    
    console.log(`[EmbeddingMonitor] Scanned ${results.length} documents`);
    return results;
  } catch (error) {
    console.error('[EmbeddingMonitor] Error scanning documents:', error);
    throw error;
  }
}
