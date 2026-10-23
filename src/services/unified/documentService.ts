import { AIDocument } from '../../types/ai';
import { UnifiedDocument, adaptAIDocumentToUnified, adaptAIDriveFileToUnified } from '../../components/common/DocumentCard';

export interface DocumentSource {
  type: 'knowledge' | 'drive';
  id: string;
  name: string;
}

export interface DocumentServiceConfig {
  knowledgeBaseStore?: any;
  driveService?: any;
}

/**
 * Unified Document Service
 * Provides a clean abstraction layer over Knowledge Base and Drive functionality
 * Following separation of concerns and single responsibility principle
 */
export class UnifiedDocumentService {
  private knowledgeBaseStore: any;
  private driveService: any;

  constructor(config: DocumentServiceConfig) {
    this.knowledgeBaseStore = config.knowledgeBaseStore;
    this.driveService = config.driveService;
  }

  /**
   * Get all documents from all sources
   */
  async getAllDocuments(): Promise<UnifiedDocument[]> {
    const documents: UnifiedDocument[] = [];

    // Get Knowledge Base documents
    if (this.knowledgeBaseStore) {
      const kbDocuments = this.knowledgeBaseStore.getState().documents;
      documents.push(...kbDocuments.map(adaptAIDocumentToUnified));
    }

    // Get Drive files (if drive service is available)
    if (this.driveService) {
      // Implementation depends on how drive service is integrated
      // For now, we'll handle this separately
    }

    return documents;
  }

  /**
   * Get documents by source
   */
  async getDocumentsBySource(source: DocumentSource): Promise<UnifiedDocument[]> {
    switch (source.type) {
      case 'knowledge':
        if (this.knowledgeBaseStore) {
          const kbDocuments = this.knowledgeBaseStore.getState().documents;
          return kbDocuments.map(adaptAIDocumentToUnified);
        }
        return [];

      case 'drive':
        if (this.driveService) {
          // Implementation for drive documents
          // This would need to be connected to the actual drive service
          return [];
        }
        return [];

      default:
        return [];
    }
  }

  /**
   * Search across all document sources
   */
  async searchDocuments(query: string, sources?: DocumentSource[]): Promise<UnifiedDocument[]> {
    const results: UnifiedDocument[] = [];

    // If no sources specified, search all
    const searchSources = sources || [
      { type: 'knowledge', id: 'all', name: 'Knowledge Base' },
      { type: 'drive', id: 'all', name: 'Drive' }
    ];

    for (const source of searchSources) {
      const sourceDocuments = await this.getDocumentsBySource(source);
      const filtered = sourceDocuments.filter(doc => 
        doc.title.toLowerCase().includes(query.toLowerCase()) ||
        doc.content?.toLowerCase().includes(query.toLowerCase()) ||
        doc.preview?.toLowerCase().includes(query.toLowerCase()) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
      results.push(...filtered);
    }

    return results;
  }

  /**
   * Get document by ID from any source
   */
  async getDocumentById(id: string): Promise<UnifiedDocument | null> {
    // Try Knowledge Base first
    if (this.knowledgeBaseStore) {
      const kbDocuments = this.knowledgeBaseStore.getState().documents;
      const kbDoc = kbDocuments.find((doc: AIDocument) => doc.id === id);
      if (kbDoc) {
        return adaptAIDocumentToUnified(kbDoc);
      }
    }

    // Try Drive
    if (this.driveService) {
      try {
        const driveFile = await this.driveService.getFile(id);
        if (driveFile) {
          return adaptAIDriveFileToUnified(driveFile);
        }
      } catch (error) {
        // File not found in drive, continue
      }
    }

    return null;
  }

  /**
   * Link Drive file to Knowledge Base
   */
  async linkDriveFileToKnowledgeBase(
    driveFileId: string, 
    assistantId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.driveService || !this.knowledgeBaseStore) {
        return { success: false, error: 'Services not available' };
      }

      // Get the drive file
      const driveFile = await this.driveService.getFile(driveFileId);
      if (!driveFile) {
        return { success: false, error: 'Drive file not found' };
      }

      // Convert to knowledge base document format
      const kbDocument: AIDocument = {
        id: `drive_${driveFile.id}`,
        content: driveFile.ai_summary || driveFile.name,
        metadata: {
          source: 'geniedrive',
          title: driveFile.name,
          size: driveFile.size_bytes || 0,
          tags: driveFile.ai_metadata?.auto_tags || [],
          genie_drive_file_id: driveFile.id,
          mime_type: driveFile.mime_type,
          ...(driveFile.ai_metadata || {})
        },
        folderId: assistantId, // Link to assistant if specified
        title: driveFile.name,
        type: driveFile.mime_type || 'document'
      };

      // Add to knowledge base
      this.knowledgeBaseStore.getState().addDocument(kbDocument);

      return { success: true };
    } catch (error) {
      console.error('Error linking drive file to knowledge base:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get available document sources
   */
  getAvailableSources(): DocumentSource[] {
    const sources: DocumentSource[] = [];

    if (this.knowledgeBaseStore) {
      sources.push({
        type: 'knowledge',
        id: 'knowledge_base',
        name: 'Knowledge Base'
      });
    }

    if (this.driveService) {
      sources.push({
        type: 'drive',
        id: 'genie_drive',
        name: 'GenieDrive'
      });
    }

    return sources;
  }

  /**
   * Get folder structure for a source
   */
  async getFolderStructure(source: DocumentSource): Promise<any[]> {
    switch (source.type) {
      case 'knowledge':
        if (this.knowledgeBaseStore) {
          return this.knowledgeBaseStore.getState().folders || [];
        }
        return [];

      case 'drive':
        if (this.driveService) {
          // Implementation for drive folder structure
          // This would need to be connected to the actual drive service
          return [];
        }
        return [];

      default:
        return [];
    }
  }
}

// Singleton instance factory
let unifiedDocumentServiceInstance: UnifiedDocumentService | null = null;

export function createUnifiedDocumentService(config: DocumentServiceConfig): UnifiedDocumentService {
  if (!unifiedDocumentServiceInstance) {
    unifiedDocumentServiceInstance = new UnifiedDocumentService(config);
  }
  return unifiedDocumentServiceInstance;
}

export function getUnifiedDocumentService(): UnifiedDocumentService | null {
  return unifiedDocumentServiceInstance;
} 