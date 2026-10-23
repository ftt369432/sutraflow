/**
 * Auto Embedding Repair Service
 * Browser-compatible service for automated embedding repair
 */

import { useKnowledgeBaseStore } from '../store/knowledgeBaseStore';
import { embeddingMonitorService } from './embeddingMonitorService';
import { batchAIProcessingService } from './batchAIProcessingService';
import { supabase } from '../lib/supabase';
import type { AIDocument } from '../types/ai';

interface AutoRepairConfig {
  forceReprocessAll: boolean;
  validateEmbeddings: boolean;
  repairInvalidEmbeddings: boolean;
  updateFolderAssignments: boolean;
  fixAIProcessingValidation: boolean;
  batchSize: number;
  maxRetries: number;
}

interface AutoRepairResult {
  totalDocuments: number;
  documentsWithIssues: number;
  embeddingsRepaired: number;
  folderAssignmentsFixed: number;
  validationLogicFixed: boolean;
  errors: string[];
  summary: string;
}

class AutoEmbeddingRepairService {
  private config: AutoRepairConfig;
  private progressCallback?: (progress: number, message: string) => void;

  constructor(config: Partial<AutoRepairConfig> = {}) {
    this.config = {
      forceReprocessAll: false,
      validateEmbeddings: true,
      repairInvalidEmbeddings: true,
      updateFolderAssignments: true,
      fixAIProcessingValidation: true,
      batchSize: 10,
      maxRetries: 3,
      ...config
    };
  }

  setProgressCallback(callback: (progress: number, message: string) => void) {
    this.progressCallback = callback;
  }

  private logProgress(progress: number, message: string) {
    console.log(`[AutoRepair] ${progress}% - ${message}`);
    if (this.progressCallback) {
      this.progressCallback(progress, message);
    }
  }

  /**
   * Enhanced embedding validation
   */
  private validateEmbedding(embedding: any): boolean {
    return embedding && 
           Array.isArray(embedding) && 
           embedding.length === 768 &&
           embedding.some((val: number) => val !== 0 && !isNaN(val));
  }

  /**
   * Enhanced AI analysis validation
   */
  private validateAIAnalysis(doc: AIDocument): boolean {
    const metadata = doc.metadata as any;
    return metadata?.ai_summary && 
           metadata.ai_summary.length > 10 &&
           metadata?.ai_topics?.length > 0 &&
           (doc as any).ai_enabled && 
           (doc as any).ai_last_processed;
  }

  /**
   * Main automated repair function
   */
  async performCompleteSystemRepair(userId: string): Promise<AutoRepairResult> {
    const result: AutoRepairResult = {
      totalDocuments: 0,
      documentsWithIssues: 0,
      embeddingsRepaired: 0,
      folderAssignmentsFixed: 0,
      validationLogicFixed: false,
      errors: [],
      summary: ''
    };

    try {
      this.logProgress(0, 'Starting automated system repair...');

      // Step 1: Initialize knowledge base
      this.logProgress(5, 'Initializing knowledge base...');
      const { documents, folders, initializeFromSupabase } = useKnowledgeBaseStore.getState();
      await initializeFromSupabase(userId);
      
      const freshDocuments = useKnowledgeBaseStore.getState().documents;
      result.totalDocuments = freshDocuments.length;

      this.logProgress(10, `Found ${result.totalDocuments} documents to analyze`);

      // Step 2: Fix AI Processing validation logic
      if (this.config.fixAIProcessingValidation) {
        this.logProgress(15, 'Fixing AI Processing validation logic...');
        this.patchAIProcessingValidation();
        result.validationLogicFixed = true;
      }

      // Step 3: Comprehensive document validation
      this.logProgress(20, 'Analyzing document health...');
      const documentIssues = this.analyzeDocumentHealth(freshDocuments);
      result.documentsWithIssues = documentIssues.length;

      this.logProgress(30, `Found ${result.documentsWithIssues} documents with issues`);

      // Step 4: Repair embeddings
      if (this.config.repairInvalidEmbeddings && documentIssues.length > 0) {
        this.logProgress(40, 'Repairing embeddings...');
        const embeddingRepairs = await this.repairDocumentEmbeddings(documentIssues, userId);
        result.embeddingsRepaired = embeddingRepairs.repaired;
        result.errors.push(...embeddingRepairs.errors);
      }

      // Step 5: Fix folder assignments
      if (this.config.updateFolderAssignments) {
        this.logProgress(70, 'Fixing folder assignments...');
        const folderFixes = await this.fixFolderAssignments(freshDocuments, userId);
        result.folderAssignmentsFixed = folderFixes.fixed;
        result.errors.push(...folderFixes.errors);
      }

      // Step 6: Force reprocess if requested
      if (this.config.forceReprocessAll) {
        this.logProgress(80, 'Force reprocessing all documents...');
        await this.forceReprocessAllDocuments(userId);
      }

      // Step 7: Final validation
      this.logProgress(90, 'Performing final validation...');
      await this.validateSystemHealth(userId);

      this.logProgress(100, 'Automated repair complete!');
      result.summary = this.generateRepairSummary(result);

      return result;

    } catch (error) {
      const errorMsg = `Automated repair failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMsg);
      console.error('[AutoRepair]', errorMsg);
      return result;
    }
  }

  /**
   * Patch AI Processing validation logic in the current session
   */
  private patchAIProcessingValidation(): void {
    try {
      // Patch the batchAIProcessingService if available
      if ((window as any).batchAIProcessingService) {
        const service = (window as any).batchAIProcessingService;
        
        // Store original method
        if (!service._originalAnalyzeProcessingNeeds) {
          service._originalAnalyzeProcessingNeeds = service.analyzeProcessingNeeds.bind(service);
        }

        // Replace with enhanced version
        service.analyzeProcessingNeeds = async (userId: string, documentIds?: string[]) => {
          const { documents } = useKnowledgeBaseStore.getState();
          
          const docsToProcess = documentIds && documentIds.length > 0
            ? documents.filter(doc => documentIds.includes(doc.id))
            : documents;
          
          let needsEmbedding = 0;
          let needsAIAnalysis = 0;

          docsToProcess.forEach(doc => {
            // ENHANCED: Proper embedding validation
            if (!this.validateEmbedding(doc.embedding)) {
              needsEmbedding++;
            }

            // ENHANCED: Comprehensive AI analysis validation
            if (!this.validateAIAnalysis(doc)) {
              needsAIAnalysis++;
            }
          });

          console.log(`[AutoRepair] Enhanced validation - Docs needing embedding: ${needsEmbedding}, AI analysis: ${needsAIAnalysis}`);

          return {
            total: docsToProcess.length,
            needsEmbedding,
            needsAIAnalysis,
            processed: 0,
            failed: 0,
            skipped: 0
          };
        };
      }

      // Also expose the validation functions globally for browser console use
      (window as any).AutoEmbeddingRepair = {
        validateEmbedding: this.validateEmbedding.bind(this),
        validateAIAnalysis: this.validateAIAnalysis.bind(this)
      };

      console.log('[AutoRepair] ✅ AI Processing validation logic enhanced');
    } catch (error) {
      console.error('[AutoRepair] Failed to patch validation logic:', error);
    }
  }

  /**
   * Analyze document health with comprehensive checks
   */
  private analyzeDocumentHealth(documents: AIDocument[]): AIDocument[] {
    const documentsWithIssues: AIDocument[] = [];

    for (const doc of documents) {
      let hasIssues = false;

      // Check embedding validity
      if (!this.validateEmbedding(doc.embedding)) {
        hasIssues = true;
        console.log(`[AutoRepair] Document ${doc.id} has invalid embedding (length: ${doc.embedding?.length || 0})`);
      }

      // Check AI analysis completeness
      if (!this.validateAIAnalysis(doc)) {
        hasIssues = true;
        console.log(`[AutoRepair] Document ${doc.id} missing complete AI analysis`);
      }

      // Check folder assignment (optional but helps with accessibility)
      if (!doc.folderId || doc.folderId.trim() === '') {
        console.log(`[AutoRepair] Document ${doc.id} has no folder assignment (may limit assistant access)`);
      }

      if (hasIssues) {
        documentsWithIssues.push(doc);
      }
    }

    return documentsWithIssues;
  }

  /**
   * Repair document embeddings
   */
  private async repairDocumentEmbeddings(documentsWithIssues: AIDocument[], userId: string): Promise<{repaired: number, errors: string[]}> {
    let repaired = 0;
    const errors: string[] = [];

    try {
      console.log(`[AutoRepair] Starting embedding repair for ${documentsWithIssues.length} documents`);
      
      const documentIds = documentsWithIssues.map(doc => doc.id);
      const repairResult = await embeddingMonitorService.repairDocumentEmbeddings(documentIds);
      
      repaired = repairResult.repairedCount;
      
      if (repairResult.errors.length > 0) {
        errors.push(...repairResult.errors.map(err => `Embedding repair: ${err}`));
      }

      console.log(`[AutoRepair] ✅ Repaired embeddings for ${repaired} documents`);
    } catch (error) {
      const errorMsg = `Embedding repair failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.error('[AutoRepair]', errorMsg);
    }

    return { repaired, errors };
  }

  /**
   * Fix folder assignments for better assistant access
   */
  private async fixFolderAssignments(documents: AIDocument[], userId: string): Promise<{fixed: number, errors: string[]}> {
    let fixed = 0;
    const errors: string[] = [];

    try {
      const { folders, updateDocument } = useKnowledgeBaseStore.getState();
      
      // Find documents without folder assignments
      const unassignedDocs = documents.filter(doc => !doc.folderId || doc.folderId.trim() === '');
      
      if (unassignedDocs.length === 0) {
        console.log('[AutoRepair] All documents already have folder assignments');
        return { fixed, errors };
      }

      // Create or find a "General" folder for unassigned documents
      let generalFolder = folders.find(f => f.name.toLowerCase() === 'general');
      
      if (!generalFolder) {
        // Create general folder in Supabase
        const { data: newFolder, error } = await supabase
          .from('knowledge_folders')
          .insert({
            name: 'General',
            description: 'Auto-assigned folder for general documents',
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        generalFolder = newFolder;
        console.log('[AutoRepair] Created "General" folder for unassigned documents');
      }

      // Assign unassigned documents to the general folder
      for (const doc of unassignedDocs) {
        try {
          updateDocument(doc.id, { folderId: generalFolder.id }, userId);
          fixed++;
          console.log(`[AutoRepair] Assigned document ${doc.id} to General folder`);
        } catch (error) {
          const errorMsg = `Failed to assign folder for document ${doc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
        }
      }

      console.log(`[AutoRepair] ✅ Fixed folder assignments for ${fixed} documents`);
    } catch (error) {
      const errorMsg = `Folder assignment repair failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.error('[AutoRepair]', errorMsg);
    }

    return { fixed, errors };
  }

  /**
   * Force reprocess all documents
   */
  private async forceReprocessAllDocuments(userId: string): Promise<void> {
    try {
      console.log('[AutoRepair] Starting force reprocessing of all documents...');
      
      const options = {
        forceReprocess: true,
        includeEmbeddings: true,
        includeAIAnalysis: true,
        includeAiTags: true,
        concurrency: this.config.batchSize,
        progressCallback: (progress: number, docName?: string) => {
          this.logProgress(80 + (progress * 0.1), `Reprocessing: ${docName || 'documents'}`);
        }
      };

      const result = await batchAIProcessingService.batchProcessDocuments(userId, options);
      
      console.log('[AutoRepair] ✅ Force reprocessing complete:', result.summary);
    } catch (error) {
      console.error('[AutoRepair] Force reprocessing failed:', error);
      throw error;
    }
  }

  /**
   * Validate system health after repairs
   */
  private async validateSystemHealth(userId: string): Promise<void> {
    try {
      console.log('[AutoRepair] Performing final system health check...');
      
      // Refresh data
      const { initializeFromSupabase } = useKnowledgeBaseStore.getState();
      await initializeFromSupabase(userId);
      
      const { documents } = useKnowledgeBaseStore.getState();
      
      // Count health metrics
      let validEmbeddings = 0;
      let validAIAnalysis = 0;
      let assignedToFolders = 0;

      documents.forEach(doc => {
        // Check embedding
        if (this.validateEmbedding(doc.embedding)) {
          validEmbeddings++;
        }

        // Check AI analysis
        if (this.validateAIAnalysis(doc)) {
          validAIAnalysis++;
        }

        // Check folder assignment
        if (doc.folderId && doc.folderId.trim() !== '') {
          assignedToFolders++;
        }
      });

      console.log('[AutoRepair] Final Health Report:');
      console.log(`  📄 Total documents: ${documents.length}`);
      console.log(`  🧠 Valid embeddings: ${validEmbeddings}/${documents.length} (${Math.round((validEmbeddings/documents.length)*100)}%)`);
      console.log(`  🤖 AI analysis complete: ${validAIAnalysis}/${documents.length} (${Math.round((validAIAnalysis/documents.length)*100)}%)`);
      console.log(`  📁 Folder assigned: ${assignedToFolders}/${documents.length} (${Math.round((assignedToFolders/documents.length)*100)}%)`);
    } catch (error) {
      console.error('[AutoRepair] Health check failed:', error);
    }
  }

  /**
   * Generate repair summary
   */
  private generateRepairSummary(result: AutoRepairResult): string {
    let summary = `🔧 Automated Repair Complete!\n\n`;
    summary += `📊 Summary:\n`;
    summary += `• Total documents analyzed: ${result.totalDocuments}\n`;
    summary += `• Documents with issues found: ${result.documentsWithIssues}\n`;
    summary += `• Embeddings repaired: ${result.embeddingsRepaired}\n`;
    summary += `• Folder assignments fixed: ${result.folderAssignmentsFixed}\n`;
    summary += `• AI Processing validation logic fixed: ${result.validationLogicFixed ? 'Yes' : 'No'}\n`;

    if (result.errors.length > 0) {
      summary += `\n⚠️ Errors encountered: ${result.errors.length}\n`;
      result.errors.forEach((error, i) => {
        summary += `  ${i + 1}. ${error}\n`;
      });
    }

    const successRate = result.documentsWithIssues > 0 
      ? Math.round((result.embeddingsRepaired / result.documentsWithIssues) * 100)
      : 100;
    
    summary += `\n🎯 Repair success rate: ${successRate}%`;
    summary += `\n\n✨ Your AI Processing modal should now show accurate status!`;

    return summary;
  }
}

export { AutoEmbeddingRepairService };
export type { AutoRepairConfig, AutoRepairResult };
