import { useKnowledgeBaseStore } from '../store/knowledgeBaseStore';
import { getEmbedding } from './embeddingService';
import { AIDriveService } from './drive/aiDriveService';
import { supabase } from '../lib/supabase';
import type { AIDocument } from '../types/ai';
import { extractLegalReferences } from '../utils/legalUtils';
import { sanitizeTextForSupabase, processDocumentContent, cleanDocumentTitle } from '../utils/documentUtils';
import { sanitizeForAI, generateCleanSummary, validateSummaryQuality } from '../utils/aiTextSanitizer';

export interface ProcessingStats {
  total: number;
  needsEmbedding: number;
  needsAIAnalysis: number;
  processed: number;
  failed: number;
  skipped: number;
}

export interface BatchProcessingResult {
  stats: ProcessingStats;
  processedDocuments: AIDocument[];
  errors: string[];
  summary: string;
}

export interface ProcessingOptions {
  forceReprocess?: boolean;
  includeEmbeddings?: boolean;
  includeAIAnalysis?: boolean;
  includeAiTags?: boolean;
  concurrency?: number;
  progressCallback?: (progress: number, currentDoc?: string) => void;
}

export class BatchAIProcessingService {
  private aiDriveService: AIDriveService;

  constructor() {
    this.aiDriveService = new AIDriveService(supabase);
  }

  /**
   * Analyze what documents need processing
   */
  async analyzeProcessingNeeds(userId: string, documentIds?: string[]): Promise<ProcessingStats> {
    const { documents } = useKnowledgeBaseStore.getState();
    
    // Filter documents if documentIds is provided
    const docsToProcess = documentIds && documentIds.length > 0
      ? documents.filter(doc => documentIds.includes(doc.id))
      : documents;
    
    let needsEmbedding = 0;
    let needsAIAnalysis = 0;

    docsToProcess.forEach(doc => {
      // Check if document needs embedding
      if (!doc.embedding || doc.embedding.length === 0) {
        needsEmbedding++;
      }

      // Check if document needs AI analysis (check both metadata and top-level AI status fields)
      const hasAIAnalysis = (doc.metadata as any)?.ai_summary || 
                           (doc.metadata as any)?.ai_topics?.length > 0 ||
                           ((doc as any).ai_enabled && (doc as any).ai_last_processed);
      if (!hasAIAnalysis) {
        needsAIAnalysis++;
      }
    });

    return {
      total: documents.length,
      needsEmbedding,
      needsAIAnalysis,
      processed: 0,
      failed: 0,
      skipped: 0
    };
  }

  /**
   * Batch process documents for AI analysis and vectorization
   */
  async batchProcessDocuments(
    userId: string, 
    options: ProcessingOptions = {},
    documentIds?: string[]
  ): Promise<BatchProcessingResult> {
    const {
      forceReprocess = false,
      includeEmbeddings = true,
      includeAIAnalysis = true,
      includeAiTags = true,
      concurrency = 3,
      progressCallback
    } = options;

    const { documents, updateDocument } = useKnowledgeBaseStore.getState();
    
    // Filter documents if documentIds is provided
    const docsToProcess = documentIds && documentIds.length > 0
      ? documents.filter(doc => documentIds.includes(doc.id))
      : documents;
    const result: BatchProcessingResult = {
      stats: {
        total: docsToProcess.length,
        needsEmbedding: 0,
        needsAIAnalysis: 0,
        processed: 0,
        failed: 0,
        skipped: 0
      },
      processedDocuments: [],
      errors: [],
      summary: ''
    };

    try {
      console.log('🔄 Starting batch AI processing for', documents.length, 'documents');

      // Filter documents that need processing
      const documentsToProcess = documents.filter(doc => {
        const needsEmbedding = includeEmbeddings && (!doc.embedding || doc.embedding.length === 0 || forceReprocess);
        const needsAIAnalysis = includeAIAnalysis && (
          forceReprocess || 
          !(doc.metadata as any)?.ai_summary ||
          !(doc.metadata as any)?.ai_topics?.length ||
          !((doc as any).ai_enabled && (doc as any).ai_last_processed)
        );

        if (needsEmbedding) result.stats.needsEmbedding++;
        if (needsAIAnalysis) result.stats.needsAIAnalysis++;

        return needsEmbedding || needsAIAnalysis;
      });

      if (documentsToProcess.length === 0) {
        result.summary = '✅ All documents are already processed!';
        return result;
      }

      console.log(`📊 Found ${documentsToProcess.length} documents that need processing`);

      // Process documents in batches with controlled concurrency
      const batches = this.chunkArray(documentsToProcess, concurrency);
      let currentIndex = 0;

      for (const batch of batches) {
        const batchPromises = batch.map(doc => 
          this.processDocument(doc, {
            includeEmbeddings,
            includeAIAnalysis,
            forceReprocess,
            progressCallback: (docName) => {
              const overallProgress = Math.round((currentIndex / documentsToProcess.length) * 100);
              if (progressCallback) {
                progressCallback(overallProgress, docName);
              }
            }
          })
        );

        const batchResults = await Promise.allSettled(batchPromises);

        // Process results
        batchResults.forEach((batchResult, index) => {
          const originalDoc = batch[index]; // Get the original document
          currentIndex++;

          if (batchResult.status === 'fulfilled') {
            const processedDocUpdates = batchResult.value; // These are the updates from processDocument
            
            if (processedDocUpdates) {
              // Merge updates with the original document to preserve fields like folderId
              // The processedDocUpdates contains only what processDocument changed (e.g., embedding, metadata.ai_summary)
              // We must ensure other fields from originalDoc, especially folderId, are kept.
              const finalUpdates: Partial<AIDocument> = {
                ...originalDoc, // Start with all fields from the original document
                ...processedDocUpdates, // Override with actual updates from processing
                metadata: { // Deep merge metadata specifically
                  ...(originalDoc.metadata || {}),
                  ...(processedDocUpdates.metadata || {}),
                }
              };

              // Remove id from finalUpdates if it exists, as updateDocument takes id as a separate param
              // and having it in the updates object might cause issues or is redundant.
              // However, current AIDocument structure in updateDocument in store expects Partial<Omit<AIDocument, 'id' | 'embedding'>>
              // and processDocument returns Partial<AIDocument>.
              // For safety, let's ensure the updates object doesn't try to change the ID.
              // The current structure of processDocument doesn't return 'id' in its updates, so this is fine.

              // delete finalUpdates.id; // Not strictly necessary if updateDocument ignores it in the payload

              // Ensure userId is present in the updates if it's part of AIDocument and handled by updateDocument
              // However, updateDocument takes userId as a separate parameter.

              console.log(`[BatchAIProcessingService] Updating document ${originalDoc.id} in store. Original FolderID: ${originalDoc.folderId}, Updates coming from processDocument: ${JSON.stringify(processedDocUpdates).substring(0,100)}...`);
              
              // Pass the userId from the batchProcessDocuments parameters
              updateDocument(originalDoc.id, finalUpdates, userId); 

              result.stats.processed++;
              result.processedDocuments.push({ ...originalDoc, ...finalUpdates } as AIDocument); // Store the fully updated doc
              console.log(`✅ Processed and updated in store: ${originalDoc.title || originalDoc.metadata?.title}. Retained FolderID: ${originalDoc.folderId}`);
            } else {
              result.stats.skipped++;
              console.log(`⏭️ Skipped: ${originalDoc.title || originalDoc.metadata?.title}`);
            }
          } else {
            result.stats.failed++;
            const errorMsg = `Failed to process ${originalDoc.title || originalDoc.metadata.title}: ${batchResult.reason}`;
            result.errors.push(errorMsg);
            console.error(`❌ ${errorMsg}`);
          }
        });

        // Brief pause between batches to avoid overwhelming the API
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Generate summary
      result.summary = this.generateProcessingSummary(result.stats);
      
      if (progressCallback) {
        progressCallback(100, 'Processing complete!');
      }

      return result;

    } catch (error) {
      const errorMsg = `Batch processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMsg);
      console.error('💥', errorMsg);
      return result;
    }
  }

  /**
   * Process a single document
   */
  private async processDocument(
    doc: AIDocument,
    options: {
      includeEmbeddings: boolean;
      includeAIAnalysis: boolean;
      forceReprocess: boolean;
      progressCallback?: (docName: string) => void;
    }
  ): Promise<Partial<AIDocument> | null> {
    const { includeEmbeddings, includeAIAnalysis, forceReprocess, progressCallback } = options;
    
    if (progressCallback) {
      progressCallback(doc.title || doc.metadata?.title || 'Unknown document');
    }

    const updates: Partial<AIDocument> = {};
    let hasUpdates = false;

    // CRITICAL: Initialize updates with the original folderId to ensure it's not lost
    // if processDocument doesn't explicitly return it.
    // However, processDocument is designed to return only what changed.
    // The preservation of folderId should happen in the caller (batchProcessDocuments)

    try {
      // Ensure we have content to work with and sanitize it
      let content = doc.content;
      if (!content || content.trim().length === 0) {
        // Try to get content from metadata or other sources
        content = (doc.metadata as any)?.description || (doc.metadata as any)?.summary || '';
        
        // If still no content, generate a basic summary from title and metadata
        if (!content && doc.title) {
          content = `Document: ${doc.title}. Type: ${doc.type || 'Unknown'}. Created: ${doc.metadata?.date || 'Unknown'}.`;
          console.log(`📝 Generated basic content for: ${doc.title}`);
        }
      }
      
      // Process content with centralized utilities
      if (content && content.trim().length > 0) {
        content = sanitizeTextForSupabase(content);
        // Clean up document title if needed
        if (doc.title) {
          updates.title = cleanDocumentTitle(doc.title);
        }
      }

      // Log processing attempt
      console.log(`🔍 Processing: ${doc.title} (Content: ${content?.length || 0} chars, Embedding: ${!!doc.embedding}, AI Summary: ${!!(doc.metadata as any)?.ai_summary})`);

      // Generate embedding if needed or forced
      const needsEmbedding = !doc.embedding || doc.embedding.length === 0 || forceReprocess;
      if (includeEmbeddings && needsEmbedding && content && content.length > 10) {
          console.log(`🧠 Generating embedding for: ${doc.title}`);
        try {
          const embedding = await getEmbedding(content);
          if (embedding && embedding.length > 0) {
          updates.embedding = embedding;
          hasUpdates = true;
            console.log(`✅ Generated embedding (${embedding.length} dimensions) for: ${doc.title}`);
          }
        } catch (error) {
          console.error(`❌ Failed to generate embedding for ${doc.title}:`, error);
        }
      }      // Perform AI analysis if needed or forced
      const needsAIAnalysis = !(doc.metadata as any)?.ai_summary || forceReprocess;
      if (includeAIAnalysis && (forceReprocess || !doc.metadata?.ai_summary)) {
        try {
          const contentToAnalyze = doc.content || '';
          if (contentToAnalyze.length > 20) {
            const analysis = await this.performAIAnalysis(contentToAnalyze);
            
            const newMetadata = {
              ...doc.metadata,
              ai_summary: analysis.summary,
              ai_topics: analysis.topics,
              ai_entities: analysis.entities,
              ai_complexity: analysis.complexity,
              ai_sentiment: analysis.sentiment,
              ai_auto_tags: analysis.autoTags,
              ai_processed_at: new Date().toISOString(),
              tags: [...new Set([...(doc.metadata?.tags || []), ...analysis.autoTags])],
              source: doc.metadata?.source || 'unknown' // Ensure source is present
            };

            updates.metadata = newMetadata;
            // Set AI processing status fields
            (updates as any).ai_enabled = true;
            (updates as any).ai_last_processed = new Date().toISOString();
            (updates as any).ai_confidence = 0.8; // Default confidence score
            hasUpdates = true;
            console.log(`🤖 AI analysis complete for ${doc.title || doc.id}`);
          }
        } catch (error) {
          console.error(`AI analysis failed for ${doc.id}:`, error);
        }
      }

      // Update content if we generated it
      if (content && (!doc.content || doc.content.trim().length === 0)) {
        updates.content = content;
        hasUpdates = true;
      }

      // Always return updates if we have them, or at least mark as processed
      if (hasUpdates) {
        console.log(`✅ Updates generated by processDocument for: ${doc.title}`);
        return updates; // 'updates' will only contain changed fields like 'embedding', 'metadata', 'content'
      } else {
        console.log(`ℹ️ No updates needed by processDocument for: ${doc.title} (already processed or no content)`);
        // Return null if no actual processing occurred that requires a store update
        // This helps distinguish from a successful processing with no changes vs. skipped.
        // The caller (batchProcessDocuments) can then decide to skip the store update.
        // Previously returned {}, now returning null for clarity.
        return null; 
      }

    } catch (error) {
      console.error(`❌ Error processing document ${doc.title}:`, error);
      throw error;
    }
  }
  /**
   * Perform AI analysis on document content
   */
  private async performAIAnalysis(content: string): Promise<{
    summary: string;
    topics: string[];
    entities: string[];
    complexity: 'simple' | 'moderate' | 'complex';
    sentiment: 'positive' | 'negative' | 'neutral';
    autoTags: string[];
  }> {
    try {
      // Process content to get better results
      // Use the processed content for better results
      const { formatted } = processDocumentContent(content);
      
      // Use the formatted content for reference extraction
      const { 
        laborCodes, 
        ccrCitations, 
        caseCitations,
        civilCodeCitations,
        ccpCitations,
        evidenceCodeCitations
      } = extractLegalReferences(formatted);
      
      // Create initial set of legal tags
      const legalTags = new Set<string>();
      
      // Add tags for each type of legal reference
      if (laborCodes.length > 0) {
        legalTags.add('labor_code');
        laborCodes.forEach(code => legalTags.add(`LC_${code.replace(/[^\d]/g, '')}`));
      }
      
      if (ccrCitations.length > 0) {
        legalTags.add('ccr');
        ccrCitations.forEach(cite => legalTags.add(`CCR_${cite.replace(/[^\d]/g, '')}`));
      }
      
      if (caseCitations.length > 0) {
        legalTags.add('case_law');
        caseCitations.forEach(() => legalTags.add('case_citation'));
      }

      if (civilCodeCitations.length > 0) {
        legalTags.add('civil_code');
        civilCodeCitations.forEach(code => legalTags.add(`CC_${code.replace(/[^\d]/g, '')}`));
      }

      if (ccpCitations.length > 0) {
        legalTags.add('ccp');
        ccpCitations.forEach(code => legalTags.add(`CCP_${code.replace(/[^\d]/g, '')}`));
      }

      if (evidenceCodeCitations.length > 0) {
        legalTags.add('evidence_code');
        evidenceCodeCitations.forEach(code => legalTags.add(`EC_${code.replace(/[^\d]/g, '')}`));
      }

      // Generate summary using content and detected tags
      const summary = await this.generateSummary(content, Array.from(legalTags));

      return {
        summary,
        topics: Array.from(legalTags).slice(0, 5),
        entities: [...laborCodes, ...ccrCitations, ...caseCitations, ...civilCodeCitations, ...ccpCitations, ...evidenceCodeCitations],
        complexity: this.determineComplexity(content),
        sentiment: this.determineSentiment(content),
        autoTags: Array.from(legalTags)
      };
    } catch (error) {
      console.error('Error in performAIAnalysis:', error);
      throw error;
    }
  }

  private determineComplexity(content: string): 'simple' | 'moderate' | 'complex' {
    const wordCount = content.split(/\s+/).length;
    const legalTermCount = (content.match(/pursuant|whereas|hereinafter|aforementioned|statutory|jurisdiction/gi) || []).length;
    
    if (wordCount > 2000 || legalTermCount > 10) return 'complex';
    if (wordCount > 1000 || legalTermCount > 5) return 'moderate';
    return 'simple';
  }

  private determineSentiment(content: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['granted', 'approved', 'favorable', 'benefit', 'entitled', 'awarded'];
    const negativeWords = ['denied', 'rejected', 'violated', 'failed', 'overruled', 'reversed'];
    
    const positiveCount = positiveWords.reduce((count, word) => 
      count + (content.toLowerCase().match(new RegExp(word, 'g'))?.length || 0), 0);
    const negativeCount = negativeWords.reduce((count, word) => 
      count + (content.toLowerCase().match(new RegExp(word, 'g'))?.length || 0), 0);
    
    return positiveCount > negativeCount ? 'positive' : 
           negativeCount > positiveCount ? 'negative' : 'neutral';
  }

  private async generateSummary(content: string, tags: string[]): Promise<string> {
    try {
      // First, sanitize content for AI processing
      const sanitizedContent = sanitizeForAI(content);
      
      if (!sanitizedContent) {
        console.warn('[BatchAI] Content too corrupted for AI processing, generating fallback summary');
        return generateCleanSummary(content);
      }

      // Use our centralized document processing utility to extract a well-formatted summary
      const { summary } = processDocumentContent(sanitizedContent);
      
      // Validate the generated summary
      if (!summary || summary === 'Document content requires manual review' || !validateSummaryQuality(summary)) {
        // Use our enhanced clean summary generator
        return generateCleanSummary(sanitizedContent);
      }
      
      // Include tags in the summary if valid
      if (tags && tags.length > 0) {
        const finalSummary = `${summary} Topics: ${tags.join(', ')}.`;
        return validateSummaryQuality(finalSummary) ? finalSummary : summary;
      }
      
      return summary;
    } catch (error) {
      console.error('Error generating summary:', error);
      // Enhanced fallback using our sanitizer
      return generateCleanSummary(content);
    }
  }

  /**
   * Generate a human-readable summary of processing results
   */
  private generateProcessingSummary(stats: ProcessingStats): string {
    const { total, processed, failed, skipped } = stats;
    
    if (total === 0) {
      return '📄 No documents found to process.';
    }

    if (processed === 0 && failed === 0 && skipped === total) {
      return '✅ All documents are already fully processed!';
    }

    let summary = `📊 Processing Summary:\n\n`;
    summary += `• Total documents: ${total}\n`;
    summary += `• Successfully processed: ${processed}\n`;
    
    if (skipped > 0) {
      summary += `• Skipped (already processed): ${skipped}\n`;
    }
    
    if (failed > 0) {
      summary += `• Failed: ${failed}\n`;
    }

    const successRate = Math.round((processed / (processed + failed)) * 100);
    summary += `\n🎯 Success rate: ${successRate}%`;

    if (processed > 0) {
      summary += `\n\n✨ Your documents now have:\n`;
      summary += `• AI-generated embeddings for better search\n`;
      summary += `• Automatic summaries and topic extraction\n`;
      summary += `• Entity recognition and sentiment analysis\n`;
      summary += `• Smart auto-tagging for organization`;
    }

    return summary;
  }

  /**
   * Utility function to chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

// Export singleton instance
export const batchAIProcessingService = new BatchAIProcessingService();