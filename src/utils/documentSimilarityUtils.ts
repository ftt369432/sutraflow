/**
 * Document Similarity Detection Utilities
 * 
 * This module provides functions for detecting and comparing similarity between documents
 * both by content pattern analysis and by semantic embedding comparison.
 */

import { AIDocument } from '../types/ai';
import { calculateCosineSimilarity, normalizeEmbedding } from './embeddingUtils';
import { containsHighPctNonPrintable } from './wordDocumentUtils';

/**
 * Interface for document similarity detection results
 */
interface SimilarityResult {
  similarity: number;
  reason: string;
  binaryContentRisk: boolean;
}

/**
 * Detects content pattern similarities between documents
 * Uses multiple detection methods to identify problematic patterns
 * 
 * @param sourceContent - The source document content to compare from
 * @param targetContent - The target document content to compare against
 * @returns A similarity score between 0 and 1, where 1 is most similar
 */
export function detectContentPatternSimilarity(sourceContent: string, targetContent: string): SimilarityResult {
  // Guard against empty content
  if (!sourceContent || !targetContent) {
    return { similarity: 0, reason: 'Empty content', binaryContentRisk: false };
  }
  
  // 1. Check for binary content in both documents
  const sourceBinary = containsHighPctNonPrintable(sourceContent);
  const targetBinary = containsHighPctNonPrintable(targetContent);
  
  // If both have binary content, they may be similar problematic documents
  if (sourceBinary && targetBinary) {
    // Compare binary patterns - frequency of specific byte patterns
    const sourceNonPrintableChars = sourceContent.replace(/[\x20-\x7E\n\r\t\u00A0-\u00FF]/g, '');
    const targetNonPrintableChars = targetContent.replace(/[\x20-\x7E\n\r\t\u00A0-\u00FF]/g, '');
    
    // Calculate pattern frequencies (only if there are enough non-printable chars)
    if (sourceNonPrintableChars.length > 10 && targetNonPrintableChars.length > 10) {
      const sourcePatterns = getBytePatternFrequency(sourceNonPrintableChars);
      const targetPatterns = getBytePatternFrequency(targetNonPrintableChars);
      
      // Calculate Jaccard similarity between patterns
      const patternSimilarity = calculateJaccardSimilarity(sourcePatterns, targetPatterns);
      
      if (patternSimilarity > 0.7) {
        return { 
          similarity: patternSimilarity, 
          reason: 'Binary content pattern match', 
          binaryContentRisk: true 
        };
      }
    }
    
    // If we can't calculate pattern similarity, return a moderate score
    return { similarity: 0.5, reason: 'Both binary content', binaryContentRisk: true };
  }
  
  // 2. Check for text structure similarity if not binary
  // This helps identify documents with similar layouts but different content
  if (!sourceBinary && !targetBinary) {
    // Compare paragraph structure
    const sourceParas = sourceContent.split('\n\n').length;
    const targetParas = targetContent.split('\n\n').length;
    
    const paraRatio = Math.min(sourceParas, targetParas) / Math.max(sourceParas, targetParas);
    
    // Compare formatting patterns (headings, lists, etc)
    const sourceHeadings = (sourceContent.match(/^#+\s+.+$/gm) || []).length;
    const targetHeadings = (targetContent.match(/^#+\s+.+$/gm) || []).length;
    
    const headingRatio = sourceHeadings === 0 && targetHeadings === 0 ? 
      1 : Math.min(sourceHeadings, targetHeadings) / Math.max(sourceHeadings, targetHeadings);
    
    // Calculate structure similarity
    const structureSimilarity = (paraRatio + headingRatio) / 2;
    
    if (structureSimilarity > 0.8) {
      return { 
        similarity: structureSimilarity, 
        reason: 'Similar document structure', 
        binaryContentRisk: false 
      };
    }
  }
  
  // 3. Check for content fragment similarities
  // This helps detect partial overlaps in content
  const sourceFragments = getContentFragments(sourceContent);
  const targetFragments = getContentFragments(targetContent);
  
  const fragmentSimilarity = calculateFragmentOverlap(sourceFragments, targetFragments);
  
  if (fragmentSimilarity > 0.3) {
    return { 
      similarity: fragmentSimilarity, 
      reason: 'Content fragment overlap', 
      binaryContentRisk: false 
    };
  }
  
  // If no significant similarity found
  return { 
    similarity: 0, 
    reason: 'No significant similarity', 
    binaryContentRisk: sourceBinary || targetBinary 
  };
}

/**
 * Calculate semantic similarity between two documents using their embeddings
 */
export function calculateDocumentEmbeddingSimilarity(
  doc1: AIDocument, 
  doc2: AIDocument
): number {
  if (!doc1.embedding || !doc2.embedding) {
    return 0;
  }
  
  const embedding1 = normalizeEmbedding(doc1.embedding);
  const embedding2 = normalizeEmbedding(doc2.embedding);
  
  return calculateCosineSimilarity(embedding1, embedding2);
}

/**
 * Finds similar problematic documents based on both content patterns and embeddings
 */
export function findSimilarProblematicDocuments(
  sourceDoc: AIDocument,
  allDocuments: AIDocument[],
  threshold: number = 0.7
): Array<{ document: AIDocument, similarityScore: number, reason: string }> {
  const results: Array<{ document: AIDocument, similarityScore: number, reason: string }> = [];
  
  // Only compare against other documents (not self)
  const otherDocs = allDocuments.filter(doc => doc.id !== sourceDoc.id);
  
  for (const doc of otherDocs) {
    // Skip documents without content
    if (!doc.content || !sourceDoc.content) continue;
    
    // 1. Check content pattern similarity first (faster)
    const patternResult = detectContentPatternSimilarity(sourceDoc.content, doc.content);
    
    if (patternResult.similarity >= threshold) {
      results.push({
        document: doc,
        similarityScore: patternResult.similarity,
        reason: patternResult.reason
      });
      continue; // Skip embedding check if we already found high similarity
    }
    
    // 2. Check embedding similarity if both have embeddings
    if (sourceDoc.embedding && doc.embedding) {
      const embeddingSimilarity = calculateDocumentEmbeddingSimilarity(sourceDoc, doc);
      
      if (embeddingSimilarity >= threshold) {
        results.push({
          document: doc,
          similarityScore: embeddingSimilarity,
          reason: 'Embedding similarity'
        });
      }
    }
  }
  
  // Sort by similarity score (highest first)
  return results.sort((a, b) => b.similarityScore - a.similarityScore);
}

/**
 * Helper function to calculate frequency of byte patterns
 */
function getBytePatternFrequency(binaryContent: string, patternLength = 2): Record<string, number> {
  const patterns: Record<string, number> = {};
  
  for (let i = 0; i < binaryContent.length - patternLength + 1; i++) {
    const pattern = binaryContent.substring(i, i + patternLength);
    patterns[pattern] = (patterns[pattern] || 0) + 1;
  }
  
  return patterns;
}

/**
 * Calculate Jaccard similarity between two pattern frequency objects
 */
function calculateJaccardSimilarity(patterns1: Record<string, number>, patterns2: Record<string, number>): number {
  const keys1 = Object.keys(patterns1);
  const keys2 = Object.keys(patterns2);
  
  // Find intersection and union of keys
  const intersection = keys1.filter(key => keys2.includes(key));
  const union = [...new Set([...keys1, ...keys2])];
  
  // Calculate weighted intersection
  let weightedIntersection = 0;
  for (const key of intersection) {
    weightedIntersection += Math.min(patterns1[key], patterns2[key]) / Math.max(patterns1[key], patterns2[key]);
  }
  
  return union.length === 0 ? 0 : weightedIntersection / union.length;
}

/**
 * Get content fragments for overlap comparison
 */
function getContentFragments(content: string): string[] {
  // Split content into meaningful fragments
  const fragments = [];
  
  // Use paragraphs or reasonable chunks
  const paras = content.split(/\n\n+/);
  
  for (const para of paras) {
    // Skip very short fragments
    if (para.trim().length < 10) continue;
    
    // For longer paragraphs, split into smaller chunks
    if (para.length > 100) {
      const sentences = para.split(/[.!?]+\s+/);
      for (const sentence of sentences) {
        if (sentence.trim().length >= 10) {
          fragments.push(sentence.trim());
        }
      }
    } else {
      fragments.push(para.trim());
    }
  }
  
  return fragments;
}

/**
 * Calculate overlap between content fragments
 */
function calculateFragmentOverlap(fragments1: string[], fragments2: string[]): number {
  if (fragments1.length === 0 || fragments2.length === 0) {
    return 0;
  }
  
  let matchCount = 0;
  
  // For each fragment in first set
  for (const frag1 of fragments1) {
    // Try to find a similar fragment in the second set
    for (const frag2 of fragments2) {
      const similarity = calculateStringSimilarity(frag1, frag2);
      if (similarity > 0.7) {
        matchCount++;
        break; // Count each fragment only once
      }
    }
  }
  
  // Calculate overlap ratio
  return matchCount / Math.min(fragments1.length, fragments2.length);
}

/**
 * Calculate similarity between two strings
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  // For very different length strings, similarity is low
  if (Math.max(str1.length, str2.length) > 3 * Math.min(str1.length, str2.length)) {
    return 0;
  }
  
  // Calculate edit distance
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  
  // Convert distance to similarity score (0-1)
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  // Create a matrix of dimensions str1.length+1 x str2.length+1
  const matrix: number[][] = [];
  
  // Initialize first row
  for (let i = 0; i <= str2.length; i++) {
    matrix[0] = matrix[0] || [];
    matrix[0][i] = i;
  }
  
  // Initialize first column
  for (let i = 1; i <= str1.length; i++) {
    matrix[i] = matrix[i] || [];
    matrix[i][0] = i;
  }
  
  // Fill in the rest of the matrix
  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      const cost = str1[i-1] === str2[j-1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i-1][j] + 1,        // deletion
        matrix[i][j-1] + 1,        // insertion
        matrix[i-1][j-1] + cost    // substitution
      );
    }
  }
  
  return matrix[str1.length][str2.length];
}

export default {
  detectContentPatternSimilarity,
  calculateDocumentEmbeddingSimilarity,
  findSimilarProblematicDocuments
};
