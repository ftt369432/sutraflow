// import { GoogleGenerativeAI } from '@google/generative-ai'; // Unused
// import { supabase } from '../lib/supabase'; // supabase was unused
import { AIService } from './ai/aiService'; 
// import type { AIDocument } from '../types/ai'; // AIDocument import is not used in this file.

// Initialize Gemini client if needed directly, though AIService handles it
// const apiKey = import.meta.env.VITE_GEMINI_API_KEY; // Unused
// const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null; // genAI was unused, AIService is the primary way

/**
 * Generate embedding for a given text
 */
export async function getEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim() === '') {
    console.warn('[EmbeddingService] getEmbedding: Received empty text, returning empty embedding.');
    return [];
  }
  console.log(`[EmbeddingService] getEmbedding: Requesting embedding for text (length: ${text.length}). First 100 chars: "${text.substring(0, 100)}..."`);
  try {
    // Correctly get the singleton instance
    const aiServiceInstance = await AIService.getInstance(); // Assuming getInstance is the correct static method
    if (!aiServiceInstance) {
      console.error('[EmbeddingService] getEmbedding: AIService is not available.');
      throw new Error('AIService not available for embedding.');
    }
    if (!aiServiceInstance.isServiceInitialized()) {
      console.warn('[EmbeddingService] getEmbedding: AIService instance is not initialized.');
      throw new Error('AIService not initialized. Please initialize AIService before using embeddings.');
    }
    const embedding = await aiServiceInstance.embedText(text);
    console.log(`[EmbeddingService] getEmbedding: Embedding received (length: ${embedding?.length}).`);
    if (!embedding || embedding.length === 0) {
      console.warn('[EmbeddingService] getEmbedding: embedText returned empty or null embedding.');
      return []; 
    }
    return embedding;
  } catch (error) {
    console.error('[EmbeddingService] getEmbedding: Error generating embedding:', error);
    throw error; 
  }
}

// Fallback embedding function (if needed, ensure it's used or remove)
// function generateFallbackEmbedding(text: string): number[] {
//   console.warn(`[EmbeddingService] generateFallbackEmbedding: Using fallback for text "${text.substring(0,50)}..."`);
//   // Simple character code sum as a placeholder - NOT a real embedding
//   return Array.from(text).map(char => char.charCodeAt(0) / 255.0).slice(0, 100); // Keep it short
// }

// Unused function, commented out
// function cleanText(text: string): string {
//   // Basic cleaning: remove extra whitespace, convert to lowercase
//   return text.trim().replace(/\s+/g, ' ').toLowerCase();
// }

// Unused function, commented out
// function simpleHash(str: string): number {
//   let hash = 0;
//   for (let i = 0; i < str.length; i++) {
//     const char = str.charCodeAt(i);
//     hash = (hash << 5) - hash + char;
//     hash |= 0; // Convert to 32bit integer
//   }
//   return hash;
// }

// Example usage (if this file were to be run directly, or for testing)
// async function main() {
//   try {
//     await AIService.initializeAIService(); // Ensure AIService is initialized if you plan to use it directly here

//     const testText = "This is a test document for embedding.";
//     const embedding = await getEmbedding(testText);
//     console.log('Generated embedding:', embedding.slice(0, 10)); // Log first 10 values

//     // Example of using with documents (assuming AIDocument is defined and available)
//     const documents: AIDocument[] = [
//       { id: '1', content: 'First test document about apples.', metadata: {source: 'test'} },
//       { id: '2', content: 'Second test document about oranges.', metadata: {source: 'test'} },
//     ];

//     for (const doc of documents) {
//       if (doc.content) {
//         doc.embedding = await getEmbedding(doc.content);
//         console.log(`Embedding for doc ${doc.id}:`, doc.embedding?.slice(0,5));
//       }
//     }

//   } catch (error) {
//     console.error('Error in main execution:', error);
//   }
// }

// main(); // Uncomment to run main for testing