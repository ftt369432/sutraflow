import { supabase } from '../../lib/supabase';
import type { Document, DocumentType } from '../../types/documents';
import { getEnv } from '../../config/env';

// Extended Document type for our Supabase implementation
interface SupabaseDocument extends Omit<Document, 'createdAt' | 'updatedAt'> {
  url?: string;
  userId?: string;
  uploadDate?: Date;
  lastModified?: Date;
  similarity?: number;
}

/**
 * Generates embeddings using Gemini API
 * Note: Gemini currently doesn't support embeddings directly, so we're using
 * a simple mock approach that will be updated when Gemini adds embedding support
 */
async function getGeminiEmbedding(text: string): Promise<number[]> {
  // This is a placeholder until Gemini adds proper embedding support
  // console.log('Generating mock embedding for text:', text.substring(0, 50) + '...');

  // Generate a deterministic embedding based on the text content
  // This is NOT production ready and should be replaced with actual
  // Gemini embedding API when it becomes available
  const buffer = new TextEncoder().encode(text);
  const hashValues = [];

  // Get embedding dimension from environment config
  const embeddingDimension = getEnv().embeddingDimension;

  // Create a simple hash-based embedding matching configured dimensions
  // This is just for testing purposes
  for (let i = 0; i < embeddingDimension; i++) {
    let value = 0;
    for (let j = 0; j < buffer.length; j++) {
      value += buffer[j] * Math.sin(i * j / 100);
    }
    hashValues.push(Math.tanh(value / 1000));
  }

  // Normalize the vector
  const magnitude = Math.sqrt(hashValues.reduce((sum, val) => sum + val * val, 0));
  const normalized = hashValues.map(val => val / magnitude);

  return normalized;
}

/**
 * Add a document to Supabase with vector embedding
 */
export async function addDocument(document: Omit<SupabaseDocument, 'id'>): Promise<SupabaseDocument | null> {
  try {
    // Generate embedding for document content if available
    let embedding = null;
    if (document.content) {
      embedding = await getGeminiEmbedding(document.content);
    }

    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    const userId = document.userId || session?.user?.id;

    if (!userId) {
      console.error('No user ID available for document');
      return null;
    }

    // Insert document into Supabase
    const { data, error } = await supabase
      .from('documents')
      .insert({
        title: document.name,
        content: document.content || '',
        embedding: embedding,
        type: document.type,
        size: document.size || 0,
        file_url: document.url,
        tags: document.tags || [],
        metadata: document.metadata || {},
        user_id: userId,
        created_at: document.uploadDate || new Date(),
        updated_at: document.lastModified || new Date()
      })
      .select();

    if (error) {
      console.error('Error adding document:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.error('No data returned from insert');
      return null;
    }

    const insertedDoc = data[0];
    return {
      id: insertedDoc.id,
      name: insertedDoc.title,
      content: insertedDoc.content,
      type: insertedDoc.type as DocumentType,
      size: insertedDoc.size,
      url: insertedDoc.file_url,
      tags: insertedDoc.tags,
      metadata: insertedDoc.metadata,
      userId: insertedDoc.user_id,
      uploadDate: new Date(insertedDoc.created_at),
      lastModified: new Date(insertedDoc.updated_at)
    };
  } catch (error) {
    console.error('Error in addDocument:', error);
    return null;
  }
}

/**
 * Fetch documents for the current user
 */
export async function fetchDocuments(): Promise<SupabaseDocument[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.error('No authenticated user found');
      return [];
    }

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return [];
    }

    return data.map((doc: any) => ({
      id: doc.id,
      name: doc.title,
      content: doc.content,
      type: doc.type as DocumentType,
      size: doc.size,
      url: doc.file_url,
      tags: doc.tags,
      metadata: doc.metadata,
      userId: doc.user_id,
      uploadDate: new Date(doc.created_at),
      lastModified: new Date(doc.updated_at)
    }));
  } catch (error) {
    console.error('Error in fetchDocuments:', error);
    return [];
  }
}

/**
 * Search documents by similarity using vector embeddings
 */
export async function searchDocumentsBySimilarity(query: string, limit: number = 5): Promise<SupabaseDocument[]> {
  try {
    // Generate embedding for query
    const embedding = await getGeminiEmbedding(query);

    // Use the match_documents function we created
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: 0.7, // Adjust similarity threshold as needed
      match_count: limit
    });

    if (error) {
      console.error('Error searching documents:', error);
      return [];
    }

    return data.map((doc: any) => ({
      id: doc.id,
      name: doc.title,
      content: doc.content,
      type: 'pdf' as DocumentType, // Default type since RPC might not return it
      size: 0,
      metadata: doc.metadata,
      similarity: doc.similarity,
      uploadDate: new Date(),
      lastModified: new Date()
    }));
  } catch (error) {
    console.error('Error in searchDocumentsBySimilarity:', error);
    return [];
  }
}

/**
 * Search documents by text using full-text search
 */
export async function searchDocumentsByText(query: string): Promise<SupabaseDocument[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.error('No authenticated user found');
      return [];
    }

    // Use Postgres full-text search
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', session.user.id)
      .textSearch('content', query, {
        config: 'english',
        type: 'plain'
      });

    if (error) {
      console.error('Error searching documents by text:', error);
      return [];
    }

    return data.map((doc: any) => ({
      id: doc.id,
      name: doc.title,
      content: doc.content,
      type: doc.type as DocumentType,
      size: doc.size,
      url: doc.file_url,
      tags: doc.tags,
      metadata: doc.metadata,
      userId: doc.user_id,
      uploadDate: new Date(doc.created_at),
      lastModified: new Date(doc.updated_at)
    }));
  } catch (error) {
    console.error('Error in searchDocumentsByText:', error);
    return [];
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(documentId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (error) {
      console.error('Error deleting document:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteDocument:', error);
    return false;
  }
} 