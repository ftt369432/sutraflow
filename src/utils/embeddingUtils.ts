/**
 * Utility functions for working with embeddings and document vectors
 * Enhanced with improved validation, normalization, and vector similarity calculations
 */

import { AIDocument } from '../types/ai';

/**
 * Ensures that an embedding is always in array format regardless of how it was stored
 * This helps with embeddings that might be stored as objects with a values property
 * or as stringified JSON
 */
export function ensureEmbeddingIsArray(embedding: any): number[] {
  if (!embedding) return [];
  
  // If already an array, return as is
  if (Array.isArray(embedding)) return embedding;
  
  // If it's an object with values property (common with some AI APIs)
  if (typeof embedding === 'object' && embedding.values && Array.isArray(embedding.values)) {
    return embedding.values;
  }
  
  // Try to convert string representation of array to actual array
  if (typeof embedding === 'string' && embedding.startsWith('[') && embedding.endsWith(']')) {
    try {
      const parsed = JSON.parse(embedding);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.error('[ensureEmbeddingIsArray] Failed to parse string embedding:', e);
    }
  }
  
  console.error('[ensureEmbeddingIsArray] Unrecognized embedding format:', typeof embedding);
  return [];
}

/**
 * Validates if an embedding is properly formatted and usable
 * @param embedding - The embedding to validate
 * @returns Boolean indicating if the embedding is valid and usable
 */
export function isValidEmbedding(embedding: unknown): boolean {
  // Handle null/undefined case
  if (!embedding) {
    return false;
  }
  
  // Array case - most common
  if (Array.isArray(embedding)) {
    // Empty array is not valid
    if (embedding.length === 0) {
      return false;
    }
    
    // Check that all values are numbers
    return embedding.every(val => typeof val === 'number' && !isNaN(val));
  }
  
  // Object case - could be from various AI services
  if (typeof embedding === 'object') {
    // Check for .values property (common in some AI services)
    if ('values' in (embedding as any) && Array.isArray((embedding as any).values)) {
      return (embedding as any).values.length > 0 && 
        (embedding as any).values.every((val: any) => typeof val === 'number' && !isNaN(val));
    }
    
    // Check if it's an object with numeric keys (array-like)
    const keys = Object.keys(embedding as object);
    if (keys.length > 0 && keys.every(key => !isNaN(Number(key)))) {
      return Object.values(embedding as object).every(
        val => typeof val === 'number' && !isNaN(val)
      );
    }
  }
  
  return false;
}

/**
 * Extracts numeric values from various embedding formats
 * @param embedding - The embedding to normalize (can be array, object with .values, or object with numeric keys)
 * @returns A clean array of numeric values, or null if the embedding is invalid
 */
export function normalizeEmbedding(embedding: unknown): number[] | null {
  // Handle null/undefined case
  if (!embedding) {
    return null;
  }
  
  // Try to parse stringified arrays (e.g., from databases)
  if (typeof embedding === 'string') {
    if (embedding.startsWith('[') && embedding.endsWith(']')) {
      try {
        const parsed = JSON.parse(embedding);
        if (Array.isArray(parsed)) {
          return normalizeEmbedding(parsed); // Recursively process the parsed array
        }
      } catch (e) {
        console.warn('[normalizeEmbedding] Failed to parse string embedding:', e);
      }
    }
    // If it's a string but not JSON array format, it's invalid
    return null;
  }

  // Already an array case
  if (Array.isArray(embedding)) {
    // Validate all values are numbers
    if (embedding.every(val => typeof val === 'number' && !isNaN(val))) {
      return embedding;
    } else {
      // Try to convert non-numeric values to numbers where possible
      const numericArray = embedding.map(val => {
        if (typeof val === 'number' && !isNaN(val)) return val;
        if (typeof val === 'string') {
          const num = parseFloat(val);
          return !isNaN(num) ? num : 0;
        }
        return 0;
      });
      console.warn('[normalizeEmbedding] Had to convert non-numeric values in array embedding');
      return numericArray;
    }
  }
  
  // Object with .values property
  if (typeof embedding === 'object' && embedding !== null && 'values' in (embedding as any)) {
    const values = (embedding as any).values;
    if (Array.isArray(values)) {
      return normalizeEmbedding(values); // Recursively process the values array
    }
  }
  
  // Object with numeric keys (array-like)
  if (typeof embedding === 'object' && embedding !== null) {
    const keys = Object.keys(embedding as object);
    if (keys.length > 0 && keys.every(key => !isNaN(Number(key)))) {
      const values = Object.values(embedding as object);
      return normalizeEmbedding(values); // Recursively process the values array
    }
  }
  
  return null;
}

/**
 * Ensures all documents have valid, normalized embeddings
 * @param documents - The documents to validate and normalize embeddings for
 * @returns The documents with validated embeddings (invalid embeddings are set to undefined)
 */
export function validateDocumentEmbeddings(documents: AIDocument[]): AIDocument[] {
  return documents.map(doc => {
    // Skip documents without embeddings
    if (!doc.embedding) {
      return doc;
    }
    
    // Try to normalize the embedding
    const normalizedEmbedding = normalizeEmbedding(doc.embedding);
    
    // Return the document with normalized embedding (using undefined instead of null to match AIDocument type)
    return {
      ...doc,
      embedding: normalizedEmbedding || undefined
    };
  });
}

/**
 * Calculate cosine similarity between two embedding arrays
 * @param vecA - First embedding vector
 * @param vecB - Second embedding vector
 * @returns A similarity score between -1 and 1, where 1 is most similar
 */
export function calculateCosineSimilarity(vecA: number[] | null, vecB: number[] | null): number {
  // Handle null/invalid cases
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) {
    return 0;
  }
  
  // Handle vector length mismatch
  const minLength = Math.min(vecA.length, vecB.length);
  if (vecA.length !== vecB.length) {
    vecA = vecA.slice(0, minLength);
    vecB = vecB.slice(0, minLength);
  }
  
  // Calculate dot product
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  
  // Calculate magnitudes
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  
  // Handle zero magnitude case
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  
  // Calculate and return similarity
  const similarity = dotProduct / (magnitudeA * magnitudeB);
  
  // Handle NaN or out of bounds results
  if (isNaN(similarity) || similarity < -1 || similarity > 1) {
    return 0;
  }
  
  return similarity;
}

/**
 * Finds the most similar documents to a query embedding
 * @param queryEmbedding - The embedding of the query
 * @param documents - The documents to search through
 * @param threshold - The minimum similarity threshold (default: 0.3)
 * @param topK - The maximum number of results to return (default: 5)
 * @returns An array of documents with similarity scores
 */
export function findSimilarDocuments(
  queryEmbedding: number[],
  documents: AIDocument[],
  threshold: number = 0.3,
  topK: number = 5
): Array<{ document: AIDocument, similarity: number }> {
  // Validate query embedding
  if (!isValidEmbedding(queryEmbedding)) {
    console.error('[findSimilarDocuments] Invalid query embedding');
    return [];
  }
  
  // Validate and normalize document embeddings
  const validatedDocuments = validateDocumentEmbeddings(documents);
  
  // Calculate similarities
  const documentsWithScores = validatedDocuments
    .filter(doc => doc.embedding) // Only use documents with embeddings
    .map(document => {
      const normalizedQueryEmbedding = normalizeEmbedding(queryEmbedding);
      const normalizedDocEmbedding = normalizeEmbedding(document.embedding);
      const similarity = calculateCosineSimilarity(
        normalizedQueryEmbedding || [], 
        normalizedDocEmbedding || []
      );
      return { document, similarity };
    })
    .filter(item => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
  
  return documentsWithScores;
}
