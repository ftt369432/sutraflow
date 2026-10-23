import { AIDocument } from '../types/ai';
import { getEmbedding } from './embeddingService';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';

/**
 * Document Processing Utility
 * 
 * This service handles document processing, embedding generation, and deduplication
 * to ensure efficient and non-redundant document processing for AI assistants.
 */
export class DocumentProcessingUtility {
  // Store document content hashes for deduplication
  private static contentHashes: Record<string, string> = {};
  
  // Store last processing timestamps by assistant
  private static lastProcessed: Record<string, Date> = {};
  
  /**
   * Generate a simple content hash for deduplication
   */
  static async generateContentHash(content: string): Promise<string> {
    if (!content) return '';
    
    // Simple hash function for text content
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }
  
  /**
   * Check if a document needs reprocessing
   */
  static needsReprocessing(
    document: AIDocument, 
    options: { 
      forceReprocess?: boolean,
      checkContent?: boolean
    } = {}
  ): boolean {
    if (options.forceReprocess) return true;
    
    // Check if document has existing embedding
    if (!document.embedding || document.embedding.length === 0) {
      return true;
    }
    
    // Check content hash if requested
    if (options.checkContent && document.content) {
      const storedHash = this.contentHashes[document.id];
      if (storedHash) {
        // Generate current hash synchronously for quick comparison
        let hash = 0;
        for (let i = 0; i < document.content.length; i++) {
          const char = document.content.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        const currentHash = hash.toString(16);
        
        // If content has changed, reprocessing is needed
        if (currentHash !== storedHash) {
          return true;
        }
      } else {
        // No stored hash, assume reprocessing is needed
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Process a document to generate embedding and update hash
   */
  static async processDocument(document: AIDocument): Promise<AIDocument> {
    if (!document.content) {
      throw new Error(`Document ${document.id} has no content`);
    }
    
    // Generate embedding with performance monitoring
    PerformanceMonitor.start(`embedding-${document.id}`);
    const embedding = await getEmbedding(document.content);
    const embeddingTime = PerformanceMonitor.end(`embedding-${document.id}`, 'embedding-generation');
    
    if (!embedding || embedding.length === 0) {
      throw new Error(`Failed to generate embedding for document ${document.id}`);
    }
    
    // Generate and store content hash for future deduplication
    const contentHash = await this.generateContentHash(document.content);
    this.contentHashes[document.id] = contentHash;
    
    // Log performance information for large documents
    if (document.content.length > 10000 && embeddingTime > 500) {
      console.log(`Large document processing: ${document.id} (${document.content.length} chars) took ${embeddingTime.toFixed(2)}ms`);
    }
    
    // Update document with embedding and processing metadata
    const processedDoc = {
      ...document,
      embedding,
      metadata: {
        ...document.metadata,
        // Use properties that actually exist on the metadata type
        ai_processing_time: embeddingTime,
        ai_content_hash: contentHash,
        // Store processing time in a type-safe way
        ai_metadata: {
          ...(document.metadata?.ai_metadata || {}),
          last_processed: new Date().toISOString(),
          processing_time_ms: embeddingTime
        }
      }
    };
    
    return processedDoc;
  }
  
  /**
   * Process multiple documents with deduplication
   */
  static async processDocuments(
    documents: AIDocument[], 
    options: { 
      deduplicateContent?: boolean,
      forceReprocess?: boolean,
      assistantId?: string
    } = {}
  ): Promise<{
    processedDocuments: AIDocument[];
    skippedDocuments: AIDocument[];
    errors: Array<{ documentId: string; error: string }>;
  }> {
    // Start performance monitoring
    PerformanceMonitor.start('batch-document-processing');
    
    const processedDocuments: AIDocument[] = [];
    const skippedDocuments: AIDocument[] = [];
    const errors: Array<{ documentId: string; error: string }> = [];
    const contentHashMap: Record<string, boolean> = {};
    
    // Check if we need to use chunked processing (for large document sets)
    const shouldUseChunkedProcessing = documents.length > 10;
    
    if (shouldUseChunkedProcessing) {
      console.log(`Using chunked processing for ${documents.length} documents`);
      
      // Process in chunks to avoid UI blocking
      const results = await PerformanceMonitor.processInChunks(
        documents,
        async (chunk) => {
          // Process this chunk of documents
          const chunkResults = await Promise.all(
            chunk.map(async (doc) => {
              try {
                if (!doc.content) {
                  return { 
                    type: 'error', 
                    doc, 
                    error: 'Document has no content' 
                  };
                }
                
                // Check for deduplication if enabled
                if (options.deduplicateContent) {
                  const contentHash = await this.generateContentHash(doc.content);
                  if (contentHashMap[contentHash]) {
                    return { type: 'skipped', doc };
                  }
                  contentHashMap[contentHash] = true;
                }
                
                // Process the document
                const processedDoc = await this.processDocument(doc);
                return { type: 'processed', doc: processedDoc };
              } catch (error) {
                return { 
                  type: 'error', 
                  doc, 
                  error: error instanceof Error ? error.message : String(error) 
                };
              }
            })
          );
          
          return chunkResults;
        },
        {
          chunkSize: 5,
          yieldEvery: 1,
          yieldTimeMs: 5,
          onProgress: (processed, total) => {
            console.log(`Processed ${processed}/${total} documents`);
          }
        }
      );
      
      // Process results
      results.forEach(result => {
        if (result.type === 'processed') {
          processedDocuments.push(result.doc);
        } else if (result.type === 'skipped') {
          skippedDocuments.push(result.doc);
        } else if (result.type === 'error') {
          errors.push({ 
            documentId: result.doc.id, 
            error: result.error || 'Unknown error' 
          });
        }
      });
    } else {
      // For smaller document sets, process normally
      for (const doc of documents) {
        try {
          if (!doc.content) {
            errors.push({ documentId: doc.id, error: 'Document has no content' });
            continue;
          }
          
          // Check for deduplication if enabled
          if (options.deduplicateContent) {
            const contentHash = await this.generateContentHash(doc.content);
            if (contentHashMap[contentHash]) {
              console.log(`Skipping duplicate content in document ${doc.id}`);
              skippedDocuments.push(doc);
              continue;
            }
            contentHashMap[contentHash] = true;
          }
          
          // Process the document (with performance monitoring)
          const processedDoc = await PerformanceMonitor.measure(
            () => this.processDocument(doc),
            `process-document-${doc.id}`,
            'document-processing'
          );
          processedDocuments.push(processedDoc);
          
        } catch (error) {
          console.error(`Error processing document ${doc.id}:`, error);
          errors.push({ 
            documentId: doc.id, 
            error: error instanceof Error ? error.message : String(error) 
          });
        }
      }
    }
    
    // Update last processed timestamp if an assistant ID is provided
    if (options.assistantId) {
      this.lastProcessed[options.assistantId] = new Date();
      localStorage.setItem(
        `doc_last_processed_${options.assistantId}`, 
        new Date().toISOString()
      );
    }
    
    // End performance monitoring
    const elapsed = PerformanceMonitor.end('batch-document-processing', 'document-processing');
    console.log(`Batch document processing completed in ${elapsed.toFixed(2)}ms`);
    
    return {
      processedDocuments,
      skippedDocuments,
      errors
    };
  }
  
  /**
   * Check if reprocessing is needed for an assistant
   */
  static isReprocessingNeeded(
    assistantId: string, 
    thresholdMs: number = 24 * 60 * 60 * 1000
  ): boolean {
    const now = new Date();
    
    // Check localStorage first
    const lastProcessedStr = localStorage.getItem(`doc_last_processed_${assistantId}`);
    if (lastProcessedStr) {
      const lastProcessed = new Date(lastProcessedStr);
      return now.getTime() - lastProcessed.getTime() > thresholdMs;
    }
    
    // Fall back to in-memory cache
    const lastProcessed = this.lastProcessed[assistantId];
    if (lastProcessed) {
      return now.getTime() - lastProcessed.getTime() > thresholdMs;
    }
    
    // No record found, reprocessing is needed
    return true;
  }
  
  /**
   * Get the last processing time for an assistant
   */
  static getLastProcessedTime(assistantId: string): Date | null {
    const lastProcessedStr = localStorage.getItem(`doc_last_processed_${assistantId}`);
    if (lastProcessedStr) {
      return new Date(lastProcessedStr);
    }
    
    return this.lastProcessed[assistantId] || null;
  }
}
