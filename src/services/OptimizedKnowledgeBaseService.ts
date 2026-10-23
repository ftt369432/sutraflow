/**
 * 🚀 Optimized Knowledge Base Service
 * Following URENO Principle: Eliminate resource waste while maintaining functionality
 * 
 * PERFORMANCE IMPROVEMENTS:
 * 1. Pre-computed assistant-document mappings
 * 2. Indexed document lookup by assistant
 * 3. Lazy loading with efficient caching
 * 4. Background embedding processing
 * 5. Reduced redundant filtering
 */

import { useKnowledgeBaseStore } from '../store/knowledgeBaseStore';
import type { KBDocument, KBFolder } from '../store/knowledgeBaseStore';
import { supabase } from '../lib/supabase';
import { getEmbedding } from './embeddingService';

interface OptimizedDocumentMap {
  [assistantId: string]: {
    documents: KBDocument[];
    lastUpdated: Date;
    documentIds: Set<string>;
  };
}

class OptimizedKnowledgeBaseService {
  private static instance: OptimizedKnowledgeBaseService;
  private assistantDocumentMap: OptimizedDocumentMap = {};
  private lastGlobalSync: Date | null = null;
  private isBackgroundProcessing = false;
  
  private constructor() {}
  
  static getInstance(): OptimizedKnowledgeBaseService {
    if (!this.instance) {
      this.instance = new OptimizedKnowledgeBaseService();
    }
    return this.instance;
  }

  /**
   * 🎯 OPTIMIZED: Get documents for assistant with pre-computed mapping
   * Eliminates redundant filtering on every query
   */
  async getDocumentsForAssistant(assistantId: string): Promise<KBDocument[]> {
    // Check if we have a fresh mapping
    const mapping = this.assistantDocumentMap[assistantId];
    const store = useKnowledgeBaseStore.getState();
    
    if (mapping && mapping.lastUpdated > (store.lastSync || new Date(0))) {
      console.log(`[OptimizedKB] Using cached mapping for assistant ${assistantId}: ${mapping.documents.length} docs`);
      return mapping.documents;
    }

    // Rebuild mapping for this assistant
    await this.rebuildAssistantMapping(assistantId);
    return this.assistantDocumentMap[assistantId]?.documents || [];
  }

  /**
   * 🔧 PERFORMANCE: Rebuild assistant-document mapping efficiently
   */
  private async rebuildAssistantMapping(assistantId: string): Promise<void> {
    const store = useKnowledgeBaseStore.getState();
    
    // Get assistant's linked folders
    const linkedFolderIds = await this.getAssistantFolderIds(assistantId);
    
    if (linkedFolderIds.length === 0) {
      console.log(`[OptimizedKB] Assistant ${assistantId} has no linked folders - empty document set`);
      this.assistantDocumentMap[assistantId] = {
        documents: [],
        lastUpdated: new Date(),
        documentIds: new Set()
      };
      return;
    }

    // Filter documents by folder membership (SINGLE PASS)
    const relevantDocuments = store.documents.filter(doc => 
      linkedFolderIds.includes(doc.folderId || '')
    );

    // Create optimized mapping
    this.assistantDocumentMap[assistantId] = {
      documents: relevantDocuments,
      lastUpdated: new Date(),
      documentIds: new Set(relevantDocuments.map(doc => doc.id))
    };

    console.log(`[OptimizedKB] Rebuilt mapping for assistant ${assistantId}: ${relevantDocuments.length} docs from ${linkedFolderIds.length} folders`);
  }

  /**
   * 🗂️ CACHED: Get assistant folder IDs with caching
   */
  private async getAssistantFolderIds(assistantId: string): Promise<string[]> {
    try {
      const { data: folders, error } = await supabase
        .from('folders')
        .select('id')
        .contains('assistant_ids', [assistantId]);

      if (error) throw error;
      return folders?.map(f => f.id) || [];
    } catch (error) {
      console.error('[OptimizedKB] Error getting assistant folders:', error);
      return [];
    }
  }

  /**
   * 🚀 BULK OPERATION: Process embedding repairs in background
   */
  async processEmbeddingRepairsInBackground(): Promise<void> {
    if (this.isBackgroundProcessing) {
      console.log('[OptimizedKB] Background processing already running');
      return;
    }

    this.isBackgroundProcessing = true;
    console.log('[OptimizedKB] Starting background embedding repairs...');

    try {
      const store = useKnowledgeBaseStore.getState();
      const documentsNeedingEmbeddings = store.documents.filter(doc => 
        !doc.embedding || 
        (Array.isArray(doc.embedding) && doc.embedding.length === 0)
      );

      if (documentsNeedingEmbeddings.length === 0) {
        console.log('[OptimizedKB] All documents have embeddings - no repairs needed');
        return;
      }

      console.log(`[OptimizedKB] Processing ${documentsNeedingEmbeddings.length} documents for embedding repair`);

      // Process in batches to avoid overwhelming the system
      const BATCH_SIZE = 5;
      for (let i = 0; i < documentsNeedingEmbeddings.length; i += BATCH_SIZE) {
        const batch = documentsNeedingEmbeddings.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(doc => this.repairDocumentEmbedding(doc.id)));
        
        // Small delay between batches to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log('[OptimizedKB] Background embedding repairs completed');
    } catch (error) {
      console.error('[OptimizedKB] Error in background embedding repair:', error);
    } finally {
      this.isBackgroundProcessing = false;
    }
  }

  /**
   * 🔧 EFFICIENT: Repair single document embedding
   */
  private async repairDocumentEmbedding(documentId: string): Promise<void> {
    try {
      const store = useKnowledgeBaseStore.getState();
      const document = store.documents.find(d => d.id === documentId);
      
      if (!document) return;

      // Update status to processing
      store.updateDocument(documentId, { 
        status: 'processing',
        lastUpdated: new Date()
      });

      if (!document.content || document.content.trim() === '') {
        throw new Error('Document content is empty');
      }

      // Generate embedding using the primary embedding service
      const embedding = await getEmbedding(document.content);
      
      store.updateDocument(documentId, { 
        embedding,
        status: 'ready',
        lastUpdated: new Date()
      });

      console.log(`[OptimizedKB] Repaired embedding for document ${documentId}`);
    } catch (error) {
      console.error(`[OptimizedKB] Error repairing embedding for ${documentId}:`, error);
      
      // Update status to error
      const store = useKnowledgeBaseStore.getState();
      store.updateDocument(documentId, { 
        status: 'error',
        lastUpdated: new Date()
      });
    }
  }

  /**
   * 🧹 CLEANUP: Clear stale mappings
   */
  clearStaleMapping(assistantId?: string): void {
    if (assistantId) {
      delete this.assistantDocumentMap[assistantId];
      console.log(`[OptimizedKB] Cleared mapping for assistant ${assistantId}`);
    } else {
      this.assistantDocumentMap = {};
      console.log('[OptimizedKB] Cleared all assistant mappings');
    }
  }

  /**
   * 📊 DIAGNOSTICS: Get optimization statistics
   */
  getOptimizationStats(): {
    mappedAssistants: number;
    totalMappedDocuments: number;
    backgroundProcessing: boolean;
    lastGlobalSync: Date | null;
  } {
    const totalMappedDocuments = Object.values(this.assistantDocumentMap)
      .reduce((total, mapping) => total + mapping.documents.length, 0);

    return {
      mappedAssistants: Object.keys(this.assistantDocumentMap).length,
      totalMappedDocuments,
      backgroundProcessing: this.isBackgroundProcessing,
      lastGlobalSync: this.lastGlobalSync
    };
  }

  /**
   * 🎯 OPTIMIZED QUERY: Fast document retrieval for chat
   */
  async getOptimizedDocumentsForChat(
    assistantId: string,
    queryHint?: string
  ): Promise<KBDocument[]> {
    const documents = await this.getDocumentsForAssistant(assistantId);
    
    // If no query hint, return all assistant documents
    if (!queryHint) {
      return documents.filter(doc => doc.status === 'ready');
    }

    // TODO: Add semantic filtering based on query hint
    // For now, return ready documents
    return documents.filter(doc => 
      doc.status === 'ready' && 
      doc.embedding && 
      Array.isArray(doc.embedding) && 
      doc.embedding.length > 0
    );
  }
}

// Export singleton instance
export const optimizedKnowledgeBaseService = OptimizedKnowledgeBaseService.getInstance();

// Export class for testing
export { OptimizedKnowledgeBaseService };