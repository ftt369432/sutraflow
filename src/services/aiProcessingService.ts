import { AIDocument, AIFolder } from '../types/ai';
import { AIProcessingOptions, AIProcessingResult, AIProcessingStats } from '../types/aiProcessing';
import { getEmbedding } from './embeddingService';
import { analyzeDocument, generateTags } from './aiService';
import { supabase } from '../lib/supabaseClient';

// Process a batch of documents with AI capabilities
export async function processDocuments(
  documents: AIDocument[],
  options: AIProcessingOptions,
  onProgress?: (stats: AIProcessingStats) => void
): Promise<AIProcessingResult> {
  const stats: AIProcessingStats = {
    total: documents.length,
    processed: 0,
    failed: 0,
    skipped: 0,
    embeddings: 0,
    analysis: 0,
    tags: 0
  };

  const errors: Error[] = [];
  const processedDocuments: AIDocument[] = [];
  const processedFolders: AIFolder[] = [];

  // Process documents in chunks based on concurrency
  const chunkSize = options.concurrency || 3;
  for (let i = 0; i < documents.length; i += chunkSize) {
    const chunk = documents.slice(i, i + chunkSize);
    
    // Process chunk in parallel
    const results = await Promise.allSettled(
      chunk.map(async (doc) => {
        try {
          let updatedDoc = { ...doc };

          // Generate embeddings if needed
          if (options.includeEmbeddings && (!doc.embedding || options.forceReprocess)) {
            const embedding = await getEmbedding(doc.content);
            updatedDoc.embedding = embedding;
            stats.embeddings++;
          }

          // Run AI analysis if needed
          if (options.includeAIAnalysis && (!doc.ai_summary || options.forceReprocess)) {
            const analysis = await analyzeDocument(doc.content);
            updatedDoc = {
              ...updatedDoc,
              ai_summary: analysis.summary,
              ai_topics: analysis.topics,
              ai_confidence: analysis.confidence
            };
            stats.analysis++;
          }

          // Generate AI tags if needed
          if (options.includeAiTags && (!doc.ai_tags || options.forceReprocess)) {
            const tags = await generateTags(doc.content);
            updatedDoc.ai_tags = tags;
            stats.tags++;
          }

          // Update document in database
          const { data, error } = await supabase
            .from('documents')
            .update(updatedDoc)
            .eq('id', doc.id)
            .single();

          if (error) throw error;

          stats.processed++;
          processedDocuments.push(updatedDoc);

          // Report progress
          onProgress?.(stats);

          return updatedDoc;
        } catch (error) {
          stats.failed++;
          errors.push(error as Error);
          onProgress?.(stats);
          throw error;
        }
      })
    );

    // Handle results
    results.forEach((result) => {
      if (result.status === 'rejected') {
        console.error('Processing error:', result.reason);
      }
    });
  }

  // Create new folder if requested
  if (options.createFolder && options.folderName) {
    try {
      const { data: folder, error } = await supabase
        .from('folders')
        .insert({
          name: options.folderName,
          parent_id: options.selectedFolderId || null
        })
        .single();

      if (error) throw error;
      if (folder) processedFolders.push(folder);
    } catch (error) {
      errors.push(error as Error);
    }
  }

  return {
    stats,
    processedDocuments,
    processedFolders,
    errors
  };
}
