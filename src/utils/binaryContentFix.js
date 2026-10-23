/**
 * Enhanced Word Document Processing Fix
 * 
 * This script improves the handling of Word documents to prevent scrambled text display.
 * It addresses both the text extraction process and the binary content detection.
 * Added cross-document similarity detection to find and group similar problematic documents.
 * Added urgent fix function for corrupted documents.
 */

// Import required libraries
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Import Supabase client for database operations
let supabase;

// Initialize Supabase client
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
 * Function to identify problematic Word documents in the database
 */
async function identifyProblematicDocuments() {
  console.log('Scanning for problematic Word documents...');
  
  try {
    // Look for documents that are likely Word docs with binary content
    const { data: documents, error } = await supabase
      .from('documents')
      .select('id, title, content, metadata, embedding')
      .or('title.ilike.%.docx,title.ilike.%.doc,metadata->>category.ilike.%docx%,metadata->>category.ilike.%doc%');
    
    if (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
    
    console.log(`Found ${documents.length} Word documents in the database`);
    
    // Identify documents with binary content
    const problematicDocs = documents.filter(doc => {
      if (!doc.content) return false;
      
      // Count non-printable characters
      const nonPrintableChars = doc.content.replace(/[\x20-\x7E\n\r\t\u00A0-\u00FF]/g, '').length;
      const nonPrintablePct = doc.content.length > 0 ? nonPrintableChars / doc.content.length : 0;
      
      // Using the new threshold (20%)
      return nonPrintablePct > 0.2;
    });
    
    console.log(`Found ${problematicDocs.length} documents with binary content`);
    
    // Print the list of problematic documents
    if (problematicDocs.length > 0) {
      console.log('\nProblematic documents:');
      problematicDocs.forEach(doc => {
        console.log(`- ${doc.id}: ${doc.title}`);
      });
    }
    
    return problematicDocs;
  } catch (error) {
    console.error('Error identifying problematic documents:', error);
    return [];
  }
}

/**
 * Function to fix binary content issues in the database
 */
async function fixBinaryContentIssues() {
  // First identify problematic documents
  const problematicDocs = await identifyProblematicDocuments();
  
  if (problematicDocs.length === 0) {
    console.log('No problematic documents found. Nothing to fix!');
    return;
  }
  
  console.log('\nStarting fix process for problematic documents...');
  console.log('This will flag documents with binary content for special processing.');
  
  let fixedCount = 0;
  
  // Update each document with metadata flags
  for (const doc of problematicDocs) {
    try {
      // Update document metadata to mark it for special processing
      const { error } = await supabase
        .from('documents')
        .update({
          metadata: {
            ...(doc.metadata || {}),
            binary_content_detected: true,
            needs_special_processing: true,
            last_checked: new Date().toISOString()
          }
        })
        .eq('id', doc.id);
      
      if (error) {
        console.error(`Error updating document ${doc.id}:`, error);
      } else {
        fixedCount++;
        console.log(`Updated document ${doc.id}: ${doc.title}`);
      }
    } catch (updateError) {
      console.error(`Error processing document ${doc.id}:`, updateError);
    }
  }
  
  console.log(`\nSuccessfully updated ${fixedCount} out of ${problematicDocs.length} problematic documents`);
  console.log('Documents have been flagged for special processing.');
  console.log('\nNext steps:');
  console.log('1. The UI will now show error messages for these documents');
  console.log('2. Users can click "Process with AI" to extract better content');
  console.log('3. You can run batch AI processing to fix all flagged documents at once');
}

/**
 * Test the binary content detection on a sample text
 */
function testBinaryContentDetection(sampleText) {
  if (!sampleText) {
    console.log('No sample text provided. Using test cases...');
    
    const testCases = [
      { 
        name: 'Clean text', 
        content: 'This is a clean text document with normal content. It should not be detected as binary.' 
      },
      { 
        content: '%PDF-1.3\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj'
      },
      {
        name: 'Binary Word content',
        content: 'PK\u0003\u0004\u0014\u0000\u0006\u0000\b\u0000\u0000\u0000!\u0000\u0011[Content_Types].xml ¢Ë\u0000\u0004\u0000\b\u0000\u0000\u0000!\u0000ÔÎÏnÃ0\u0010…ûBÈ"\u0000òÄ®ÒNv['
      }
    ];
    
    console.log('\nTesting binary content detection:');
    for (const test of testCases) {
      const nonPrintableChars = test.content.replace(/[\x20-\x7E\n\r\t\u00A0-\u00FF]/g, '').length;
      const nonPrintablePct = test.content.length > 0 ? nonPrintableChars / test.content.length : 0;
      
      const isBinary = nonPrintablePct > 0.2;
      
      console.log(`- ${test.name}: ${isBinary ? 'BINARY' : 'TEXT'} (${Math.round(nonPrintablePct * 100)}% non-printable)`);
    }
    
    return;
  }
  
  // Calculate the percentage of non-printable characters
  const nonPrintableChars = sampleText.replace(/[\x20-\x7E\n\r\t\u00A0-\u00FF]/g, '').length;
  const nonPrintablePct = nonPrintableChars / sampleText.length;
  
  console.log(`\nAnalysis of provided text (${sampleText.length} characters):`);
  console.log(`Non-printable characters: ${nonPrintableChars} (${Math.round(nonPrintablePct * 100)}%)`);
  console.log(`Detection result: ${nonPrintablePct > 0.2 ? 'BINARY CONTENT' : 'NORMAL TEXT'}`);
  
  // Additional advice
  if (nonPrintablePct > 0.2) {
    console.log('\nThis text would be detected as binary content and would show an error message in the UI.');
    console.log('Recommend using AI processing to extract readable content.');
  } else {
    console.log('\nThis text would be displayed normally in the UI.');
  }
}

/**
 * Function to detect and group similar problematic documents
 * This helps identify patterns across multiple documents with binary content
 */
async function detectSimilarProblematicDocuments() {
  // First identify all problematic documents
  const problematicDocs = await identifyProblematicDocuments();
  
  if (problematicDocs.length < 2) {
    console.log('Not enough problematic documents to detect similarities.');
    return [];
  }
  
  console.log('\nAnalyzing similarities between problematic documents...');
  
  // Store document clusters
  const documentClusters = [];
  const processedDocs = new Set();
  
  // Detect similarities between documents using multiple methods
  for (let i = 0; i < problematicDocs.length; i++) {
    const doc = problematicDocs[i];
    
    // Skip if already processed in a cluster
    if (processedDocs.has(doc.id)) continue;
    
    // Start a new potential cluster with this document
    const cluster = {
      primaryDoc: doc,
      similarDocs: [],
      similarityMethod: '',
      averageSimilarity: 0
    };
    
    // Compare to all other documents
    for (let j = 0; j < problematicDocs.length; j++) {
      // Skip self-comparison or already processed docs
      if (i === j || processedDocs.has(problematicDocs[j].id)) continue;
      
      const compareDoc = problematicDocs[j];
      
      // Method 1: Basic binary pattern similarity
      // Count non-printable characters
      const nonPrintableRegex = /[^\x20-\x7E\n\r\t\u00A0-\u00FF]/g;
      
      // Extract non-printable characters
      const docBinaryChars = (doc.content || '').match(nonPrintableRegex) || [];
      const compareBinaryChars = (compareDoc.content || '').match(nonPrintableRegex) || [];
      
      // If both have enough binary characters, calculate similarity
      if (docBinaryChars.length > 10 && compareBinaryChars.length > 10) {
        // Get pattern frequencies
        const docPatterns = getBinaryPatterns(docBinaryChars.join(''));
        const comparePatterns = getBinaryPatterns(compareBinaryChars.join(''));
        
        // Calculate Jaccard similarity
        const patternSimilarity = calculatePatternSimilarity(docPatterns, comparePatterns);
        
        if (patternSimilarity > 0.7) {
          cluster.similarDocs.push({
            doc: compareDoc,
            similarity: patternSimilarity,
            method: 'binary-pattern'
          });
          continue;
        }
      }
      
      // Method 2: Content structure comparison
      // Compare length and paragraph structure
      if (doc.content && compareDoc.content) {
        const lengthRatio = Math.min(doc.content.length, compareDoc.content.length) / 
                           Math.max(doc.content.length, compareDoc.content.length);
                          
        const docParas = (doc.content || '').split('\n\n').length;
        const compareParas = (compareDoc.content || '').split('\n\n').length;
        const paraRatio = Math.min(docParas, compareParas) / Math.max(docParas, compareParas);
        
        const structureSimilarity = (lengthRatio + paraRatio) / 2;
        
        if (structureSimilarity > 0.8) {
          cluster.similarDocs.push({
            doc: compareDoc,
            similarity: structureSimilarity,
            method: 'structure'
          });
          continue;
        }
      }
      
      // Method 3: File metadata similarity
      if (doc.metadata && compareDoc.metadata) {
        // Compare metadata like size, upload date, source
        let metadataMatchCount = 0;
        let metadataFields = 0;
        
        // Check category
        if (doc.metadata.category && compareDoc.metadata.category) {
          metadataFields++;
          if (doc.metadata.category === compareDoc.metadata.category) {
            metadataMatchCount++;
          }
        }
        
        // Check file size if available
        if (doc.metadata.size && compareDoc.metadata.size) {
          metadataFields++;
          const sizeRatio = Math.min(doc.metadata.size, compareDoc.metadata.size) / 
                           Math.max(doc.metadata.size, compareDoc.metadata.size);
          if (sizeRatio > 0.9) {
            metadataMatchCount++;
          }
        }
        
        // Check source if available
        if (doc.metadata.source && compareDoc.metadata.source) {
          metadataFields++;
          if (doc.metadata.source === compareDoc.metadata.source) {
            metadataMatchCount++;
          }
        }
        
        if (metadataFields > 0) {
          const metadataSimilarity = metadataMatchCount / metadataFields;
          
          if (metadataSimilarity > 0.7) {
            cluster.similarDocs.push({
              doc: compareDoc,
              similarity: metadataSimilarity,
              method: 'metadata'
            });
          }
        }
      }
    }
    
    // If we found similar documents, finalize the cluster
    if (cluster.similarDocs.length > 0) {
      // Calculate average similarity
      cluster.averageSimilarity = cluster.similarDocs.reduce(
        (sum, item) => sum + item.similarity, 0
      ) / cluster.similarDocs.length;
      
      // Determine primary similarity method
      const methods = cluster.similarDocs.map(item => item.method);
      cluster.similarityMethod = getMostFrequentValue(methods);
      
      // Add all docs in this cluster to processed set
      processedDocs.add(doc.id);
      cluster.similarDocs.forEach(item => processedDocs.add(item.doc.id));
      
      // Add cluster to results
      documentClusters.push(cluster);
    } else {
      // Mark this doc as processed even if no cluster found
      processedDocs.add(doc.id);
    }
  }
  
  // Output results
  console.log(`\nFound ${documentClusters.length} document similarity clusters`);
  
  documentClusters.forEach((cluster, index) => {
    console.log(`\nCluster #${index + 1} (${cluster.similarityMethod} similarity: ${cluster.averageSimilarity.toFixed(2)})`);
    console.log(`Primary document: ${cluster.primaryDoc.id} - ${cluster.primaryDoc.title}`);
    console.log(`Similar documents (${cluster.similarDocs.length}):`);
    cluster.similarDocs.forEach(item => {
      console.log(`- ${item.doc.id}: ${item.doc.title} (${item.similarity.toFixed(2)} ${item.method})`);
    });
  });
  
  return documentClusters;
}

/**
 * Helper function to extract binary patterns from content
 */
function getBinaryPatterns(binaryContent, patternLength = 3) {
  const patterns = {};
  
  // Extract patterns of specified length
  for (let i = 0; i < binaryContent.length - patternLength + 1; i++) {
    const pattern = binaryContent.substring(i, i + patternLength);
    patterns[pattern] = (patterns[pattern] || 0) + 1;
  }
  
  return patterns;
}

/**
 * Helper function to calculate pattern similarity
 */
function calculatePatternSimilarity(patterns1, patterns2) {
  const keys1 = Object.keys(patterns1);
  const keys2 = Object.keys(patterns2);
  
  // Find intersection and union of keys
  const intersection = keys1.filter(key => keys2.includes(key));
  const union = Array.from(new Set([...keys1, ...keys2]));
  
  // Calculate weighted intersection score
  let weightedIntersection = 0;
  for (const key of intersection) {
    weightedIntersection += Math.min(patterns1[key], patterns2[key]) / Math.max(patterns1[key], patterns2[key]);
  }
  
  return union.length === 0 ? 0 : weightedIntersection / union.length;
}

/**
 * Helper function to get most frequent value in an array
 */
function getMostFrequentValue(arr) {
  const counts = {};
  let maxCount = 0;
  let maxValue = arr[0];
  
  for (const value of arr) {
    counts[value] = (counts[value] || 0) + 1;
    if (counts[value] > maxCount) {
      maxCount = counts[value];
      maxValue = value;
    }
  }
  
  return maxValue;
}

/**
 * Batch fix similar problematic documents together
 */
async function batchFixSimilarDocuments() {
  // Get document clusters
  const clusters = await detectSimilarProblematicDocuments();
  
  if (clusters.length === 0) {
    console.log('No document similarity clusters found. Nothing to batch fix.');
    return;
  }
  
  console.log('\nStarting batch fix for document clusters...');
  let fixedCount = 0;
  
  for (const cluster of clusters) {
    console.log(`\nProcessing cluster with primary document: ${cluster.primaryDoc.title}`);
    
    // Update all documents in this cluster with the same metadata flags
    const docsToFix = [cluster.primaryDoc, ...cluster.similarDocs.map(item => item.doc)];
    
    for (const doc of docsToFix) {
      try {
        // Update document metadata to mark it for special processing
        const { error } = await supabase
          .from('documents')
          .update({
            metadata: {
              ...(doc.metadata || {}),
              binary_content_detected: true,
              needs_special_processing: true,
              similarity_cluster: cluster.similarityMethod,
              last_checked: new Date().toISOString()
            }
          })
          .eq('id', doc.id);
        
        if (error) {
          console.error(`Error updating document ${doc.id}:`, error);
        } else {
          fixedCount++;
          console.log(`Updated document ${doc.id}: ${doc.title}`);
        }
      } catch (updateError) {
        console.error(`Error processing document ${doc.id}:`, updateError);
      }
    }
  }
  
  console.log(`\nSuccessfully updated ${fixedCount} documents in ${clusters.length} clusters`);
}

/**
 * Main function to run all operations
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  // Initialize Supabase for commands that need it
  if (['scan', 'fix', 'similar', 'batch-fix'].includes(command)) {
    await initializeSupabase();
  }
  
  switch (command) {
    case 'scan':
      // Just scan for problematic documents
      await identifyProblematicDocuments();
      break;
      
    case 'fix':
      // Scan and fix problematic documents
      await fixBinaryContentIssues();
      break;
      
    case 'similar':
      // Detect similar problematic documents
      await detectSimilarProblematicDocuments();
      break;
      
    case 'batch-fix':
      // Batch fix similar documents
      await batchFixSimilarDocuments();
      break;
      
    case 'test':
      // Test the binary content detection
      const sampleText = args[1] || '';
      testBinaryContentDetection(sampleText);
      break;
      
    default:
      console.log('Word Document Binary Content Fix Tool');
      console.log('\nUsage:');
      console.log('  node binaryContentFix.js scan        - Scan for problematic Word documents');
      console.log('  node binaryContentFix.js fix         - Fix documents with binary content');
      console.log('  node binaryContentFix.js similar     - Detect similar problematic documents');
      console.log('  node binaryContentFix.js batch-fix   - Fix similar documents in batches');
      console.log('  node binaryContentFix.js test        - Test binary content detection on sample data');
      console.log('\nFor more details, see WORD_DOCUMENT_FIX_DETAIL.md');
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// Export functions for importing in other modules
export { 
  identifyProblematicDocuments,
  fixBinaryContentIssues,
  testBinaryContentDetection,
  detectSimilarProblematicDocuments,
  batchFixSimilarDocuments
};
