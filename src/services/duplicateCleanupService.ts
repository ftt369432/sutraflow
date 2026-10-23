import { useKnowledgeBaseStore, type KBDocument } from '../store/knowledgeBaseStore';

export interface DuplicateGroup {
  key: string;
  documents: KBDocument[];
  keepDocument?: KBDocument;
}

export interface DuplicateCleanupResult {
  totalDuplicates: number;
  duplicateGroups: DuplicateGroup[];
  removedCount: number;
  keptCount: number;
}

export class DuplicateCleanupService {
  
  /**
   * Find all duplicate documents in the Knowledge Base
   */
  findDuplicates(): DuplicateCleanupResult {
    const { documents } = useKnowledgeBaseStore.getState();
    
    // Group documents by similarity key (name + source)
    const documentGroups = new Map<string, KBDocument[]>();
    
    documents.forEach(doc => {
      const key = this.generateDuplicateKey(doc);
      if (!documentGroups.has(key)) {
        documentGroups.set(key, []);
      }
      documentGroups.get(key)!.push(doc);
    });
    
    // Find groups with multiple documents (duplicates)
    const duplicateGroups: DuplicateGroup[] = [];
    let totalDuplicates = 0;
    
    documentGroups.forEach((docs, key) => {
      if (docs.length > 1) {
        duplicateGroups.push({
          key,
          documents: docs,
          keepDocument: this.selectBestDocument(docs)
        });
        totalDuplicates += docs.length - 1; // Count extras as duplicates
      }
    });
    
    return {
      totalDuplicates,
      duplicateGroups,
      removedCount: 0,
      keptCount: 0
    };
  }
  
  /**
   * Remove duplicate documents, keeping the best version of each
   */
  removeDuplicates(duplicateGroups: DuplicateGroup[]): DuplicateCleanupResult {
    const { removeDocument } = useKnowledgeBaseStore.getState();
    
    let removedCount = 0;
    let keptCount = 0;
    
    duplicateGroups.forEach(group => {
      // Remove all documents except the one to keep
      group.documents.forEach(doc => {
        if (doc.id !== group.keepDocument?.id) {
          removeDocument(doc.id);
          removedCount++;
          console.log(`🗑️ Removed duplicate: ${doc.title || doc.metadata?.title}`);
        } else {
          keptCount++;
          console.log(`✅ Kept best version: ${doc.title || doc.metadata?.title}`);
        }
      });
    });
    
    return {
      totalDuplicates: removedCount,
      duplicateGroups,
      removedCount,
      keptCount
    };
  }
  
  /**
   * Generate a key for identifying potential duplicates
   */
  private generateDuplicateKey(doc: KBDocument): string {
    const title = (doc.title || doc.metadata?.title || '').toLowerCase().trim();
    const source = (doc.metadata?.source || '').toLowerCase().trim();
    
    // Remove common file extensions for better matching
    const cleanTitle = title.replace(/\.(pdf|doc|docx|txt|md)$/i, '');
    
    return `${cleanTitle}::${source}`;
  }
  
  /**
   * Select the best document from a group of duplicates
   * Criteria: Most content, newest date, has embedding, etc.
   */
  private selectBestDocument(documents: KBDocument[]): KBDocument {
    return documents.reduce((best, current) => {
      // Prefer documents with more content
      if ((current.content?.length || 0) > (best.content?.length || 0)) {
        return current;
      }
      
      // Prefer documents with embeddings
      if (current.embedding && !best.embedding) {
        return current;
      }
      
      // Prefer newer documents (using lastUpdated or metadata.date)
      const currentDate = current.metadata?.date || current.lastUpdated || new Date(0);
      const bestDate = best.metadata?.date || best.lastUpdated || new Date(0);
      if (currentDate > bestDate) {
        return current;
      }
      
      // Prefer documents with more metadata
      const currentMetadataCount = Object.keys(current.metadata || {}).length;
      const bestMetadataCount = Object.keys(best.metadata || {}).length;
      if (currentMetadataCount > bestMetadataCount) {
        return current;
      }
      
      return best;
    });
  }
  
  /**
   * Generate a summary report of duplicates
   */
  generateReport(result: DuplicateCleanupResult): string {
    if (result.totalDuplicates === 0) {
      return "🎉 No duplicate documents found! Your Knowledge Base is clean.";
    }
    
    let report = `📊 Duplicate Analysis Report\n\n`;
    report += `Total duplicate documents: ${result.totalDuplicates}\n`;
    report += `Duplicate groups: ${result.duplicateGroups.length}\n\n`;
    
    result.duplicateGroups.forEach((group, index) => {
      report += `Group ${index + 1}: "${group.key}"\n`;
      report += `  Documents: ${group.documents.length}\n`;
      group.documents.forEach((doc, i) => {
        const marker = doc.id === group.keepDocument?.id ? '✅' : '❌';
        report += `  ${marker} ${doc.title || doc.metadata?.title}\n`;
      });
      report += '\n';
    });
    
    if (result.removedCount > 0) {
      report += `\n🗑️ Removed: ${result.removedCount} duplicates\n`;
      report += `✅ Kept: ${result.keptCount} best versions\n`;
    }
    
    return report;
  }
}

// Export singleton instance
export const duplicateCleanupService = new DuplicateCleanupService(); 