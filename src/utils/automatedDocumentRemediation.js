/**
 * Automated Document Remediation
 * 
 * This script provides automated remediation for documents with binary content
 * by identifying them and processing them with the AI pipeline.
 * 
 * Usage:
 * - As a standalone script: node automatedDocumentRemediation.js
 * - As a scheduled job: Can be triggered by cron or scheduled functions
 * - As an imported module: Can be used in other parts of the application
 */

// Import required libraries
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { containsHighPctNonPrintable } from './wordDocumentUtils.js';

// Initialize Supabase client
let supabase;

async function initializeSupabase() {
  try {
    // Try to dynamically import from the client library
    const supabaseModule = await import('../lib/supabaseClient.js');
    supabase = supabaseModule.default || supabaseModule.supabaseClient;
  } catch (error) {
    // Fallback to direct initialization if the client library is not available
    console.warn('Could not load supabaseClient, using direct initialization instead');
    
    // Get Supabase credentials from environment variables
    const url = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
    const key = process.env.SUPABASE_KEY || 'your-anon-key';
    
    supabase = createClient(url, key);
  }
  
  return supabase;
}

/**
 * Find documents that need remediation based on flags or binary content detection
 */
async function findDocumentsNeedingRemediation() {
  console.log('Finding documents that need remediation...');
  
  try {
    // First look for documents already flagged with binary_content_detected
    const { data: flaggedDocs, error: flaggedError } = await supabase
      .from('documents')
      .select('id, title, content, metadata')
      .eq('metadata->>binary_content_detected', 'true')
      .is('metadata->>ai_processed', null);  // Only get documents not already processed by AI
    
    if (flaggedError) {
      console.error('Error fetching flagged documents:', flaggedError);
      return [];
    }
    
    console.log(`Found ${flaggedDocs?.length || 0} flagged documents that need remediation`);
    
    // Then look for Word documents that might not be flagged yet
    const { data: wordDocs, error: wordError } = await supabase
      .from('documents')
      .select('id, title, content, metadata')
      .or('title.ilike.%.docx,title.ilike.%.doc,metadata->>category.ilike.%docx%,metadata->>category.ilike.%doc%')
      .is('metadata->>binary_content_detected', null);  // Only get documents not already flagged
    
    if (wordError) {
      console.error('Error fetching Word documents:', wordError);
      return flaggedDocs || [];
    }
    
    console.log(`Found ${wordDocs?.length || 0} unflagged Word documents to check`);
    
    // Check unflagged Word documents for binary content
    const binaryWordDocs = wordDocs?.filter(doc => {
      if (!doc.content) return false;
      return containsHighPctNonPrintable(doc.content);
    }) || [];
    
    console.log(`Found ${binaryWordDocs.length} unflagged Word documents with binary content`);
    
    // Combine and deduplicate results
    const allDocsNeedingRemediation = [...(flaggedDocs || [])];
    
    // Add unflagged binary Word docs, avoiding duplicates
    const existingIds = new Set(allDocsNeedingRemediation.map(doc => doc.id));
    
    binaryWordDocs.forEach(doc => {
      if (!existingIds.has(doc.id)) {
        allDocsNeedingRemediation.push(doc);
        existingIds.add(doc.id);
      }
    });
    
    console.log(`Total documents needing remediation: ${allDocsNeedingRemediation.length}`);
    
    return allDocsNeedingRemediation;
  } catch (error) {
    console.error('Error finding documents for remediation:', error);
    return [];
  }
}

/**
 * Process a single document using AI
 */
async function processDocumentWithAI(documentId) {
  console.log(`Processing document ${documentId} with AI...`);
  
  try {
    // First flag the document as being processed
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        metadata: {
          ai_processing_started: new Date().toISOString()
        }
      })
      .eq('id', documentId);
    
    if (updateError) {
      console.error(`Error updating document ${documentId} status:`, updateError);
      return false;
    }
    
    // Import AI processing service dynamically
    try {
      const { processDocumentWithAI } = await import('../services/ai/documentProcessingService.js');
      
      // Process the document with AI
      await processDocumentWithAI(documentId, {
        priority: 'high',
        processingOptions: {
          extract_text: true,
          fix_binary_content: true,
          summarize: true,
          generate_topics: true
        }
      });
      
      console.log(`Successfully processed document ${documentId} with AI`);
      return true;
    } catch (importError) {
      console.error('Error importing AI processing service:', importError);
      console.warn('Falling back to store aiProcessDocument function...');
      
      // If import fails, try to use the store's aiProcessDocument function
      const { getKnowledgeBaseStore } = await import('../../store/knowledgeBaseStore.js');
      const { aiProcessDocument } = getKnowledgeBaseStore.getState();
      
      if (!aiProcessDocument) {
        console.error('Could not find aiProcessDocument function');
        return false;
      }
      
      await aiProcessDocument(documentId);
      console.log(`Successfully processed document ${documentId} with AI (via store)`);
      return true;
    }
  } catch (error) {
    console.error(`Error processing document ${documentId} with AI:`, error);
    return false;
  }
}

/**
 * Run automated remediation for all documents needing it
 */
async function runAutomatedRemediation(options = {}) {
  const { 
    batchSize = 10,
    dryRun = false,
    maxDocuments = 100,
    logToFile = false,
    logFilePath = './remediation-log.json'
  } = options;
  
  console.log('Starting automated remediation for documents with binary content...');
  console.log(`Options: batchSize=${batchSize}, dryRun=${dryRun}, maxDocuments=${maxDocuments}`);
  
  // Initialize Supabase
  await initializeSupabase();
  
  // Find documents needing remediation
  const documentsToProcess = await findDocumentsNeedingRemediation();
  
  if (documentsToProcess.length === 0) {
    console.log('No documents found that need remediation');
    return { processed: 0, success: 0, failed: 0 };
  }
  
  // Limit the number of documents to process
  const limitedDocuments = documentsToProcess.slice(0, maxDocuments);
  console.log(`Will process ${limitedDocuments.length} documents (limited to ${maxDocuments})`);
  
  // Process documents
  let successCount = 0;
  let failedCount = 0;
  const results = [];
  
  // Process in batches
  for (let i = 0; i < limitedDocuments.length; i += batchSize) {
    const batch = limitedDocuments.slice(i, i + batchSize);
    console.log(`Processing batch ${i / batchSize + 1} (${batch.length} documents)...`);
    
    // Process batch in parallel
    const batchResults = await Promise.all(batch.map(async (doc) => {
      try {
        if (!dryRun) {
          const success = await processDocumentWithAI(doc.id);
          
          if (success) {
            successCount++;
            return { id: doc.id, title: doc.title, success: true };
          } else {
            failedCount++;
            return { id: doc.id, title: doc.title, success: false };
          }
        } else {
          console.log(`[DRY RUN] Would process document ${doc.id}: ${doc.title}`);
          return { id: doc.id, title: doc.title, success: true, dryRun: true };
        }
      } catch (error) {
        console.error(`Error processing document ${doc.id}:`, error);
        failedCount++;
        return { id: doc.id, title: doc.title, success: false, error: error.message };
      }
    }));
    
    results.push(...batchResults);
    
    // Log progress
    console.log(`Batch ${i / batchSize + 1} complete. Success: ${successCount}, Failed: ${failedCount}`);
  }
  
  // Write log file if requested
  if (logToFile) {
    try {
      const logData = {
        timestamp: new Date().toISOString(),
        options,
        summary: {
          total: limitedDocuments.length,
          success: successCount,
          failed: failedCount
        },
        results
      };
      
      fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2));
      console.log(`Remediation log written to ${logFilePath}`);
    } catch (logError) {
      console.error('Error writing log file:', logError);
    }
  }
  
  console.log('\nAutomated remediation complete!');
  console.log(`Processed ${limitedDocuments.length} documents`);
  console.log(`Success: ${successCount}, Failed: ${failedCount}`);
  
  return {
    processed: limitedDocuments.length,
    success: successCount,
    failed: failedCount,
    results: results
  };
}

/**
 * Main function to run the script
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line options
  const options = {
    dryRun: args.includes('--dry-run'),
    logToFile: args.includes('--log'),
    batchSize: 10,
    maxDocuments: 100
  };
  
  // Get batch size and max documents from arguments
  const batchSizeArg = args.find(arg => arg.startsWith('--batch='));
  if (batchSizeArg) {
    options.batchSize = parseInt(batchSizeArg.split('=')[1]) || 10;
  }
  
  const maxDocumentsArg = args.find(arg => arg.startsWith('--max='));
  if (maxDocumentsArg) {
    options.maxDocuments = parseInt(maxDocumentsArg.split('=')[1]) || 100;
  }
  
  // Run remediation
  await runAutomatedRemediation(options);
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// Export functions for importing in other modules
export { 
  findDocumentsNeedingRemediation,
  processDocumentWithAI,
  runAutomatedRemediation
};
