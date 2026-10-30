import { supabase } from './supabase';
import type { AIDocument, AIFolder } from '../types/ai';
import type { Document } from '../types/documents';

// Try importing the real supabase client, if it fails, use the mock
let supabaseClient;
try {
  supabaseClient = supabase;
} catch (error) {
  console.warn('Using mock Supabase client');
  // Import the mock client
  const { supabaseMock } = require('./supabaseMock');
  supabaseClient = supabaseMock;
}

// Document operations
export const documentService = {
  /**
   * Get all documents for the current user
   */
  async getDocuments(): Promise<Document[]> {
    const { data, error } = await supabaseClient
      .from('documents')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
    
    return data.map(mapDocumentFromDB);
  },

  /**
   * Create a new document
   */
  async createDocument(document: Omit<Document, 'id'>): Promise<Document | null> {
    const { data, error } = await supabaseClient
      .from('documents')
      .insert(mapDocumentToDB(document))
      .select()
      .single();
    
    if (error) {
      console.error('Error creating document:', error);
      return null;
    }
    
    return mapDocumentFromDB(data);
  },

  /**
   * Update an existing document
   */
  async updateDocument(id: string, updates: Partial<Document>): Promise<Document | null> {
    const { data, error } = await supabaseClient
      .from('documents')
      .update(mapDocumentToDB(updates as Document))
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating document:', error);
      return null;
    }
    
    return mapDocumentFromDB(data);
  },

  /**
   * Delete a document
   */
  async deleteDocument(id: string): Promise<boolean> {
    const { error } = await supabaseClient
      .from('documents')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting document:', error);
      return false;
    }
    
    return true;
  },
  
  /**
   * Search documents
   */
  async searchDocuments(query: string): Promise<Document[]> {
    // Utilizing Postgres text search
    const { data, error } = await supabaseClient
      .from('documents')
      .select('*')
      .textSearch('content', query)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error searching documents:', error);
      return [];
    }
    
    return data.map(mapDocumentFromDB);
  }
};

// Helper functions for mapping
function mapDocumentFromDB(dbDoc: any): Document {
  return {
    id: dbDoc.id,
    name: dbDoc.name,
    type: dbDoc.type,
    content: dbDoc.content,
    tags: dbDoc.tags || [],
    createdAt: new Date(dbDoc.created_at),
    updatedAt: new Date(dbDoc.updated_at),
    size: dbDoc.size || 0,
    metadata: {
      author: dbDoc.metadata?.author,
      lastModified: new Date(dbDoc.updated_at),
      version: dbDoc.metadata?.version
    }
  };
}

function mapDocumentToDB(doc: Partial<Document>): any {
  const dbDoc: any = {
    name: doc.name,
    type: doc.type,
    content: doc.content,
    tags: doc.tags,
    size: doc.size,
    metadata: doc.metadata
  };
  
  // Convert dates to ISO string format
  if (doc.createdAt) dbDoc.created_at = doc.createdAt.toISOString();
  if (doc.updatedAt) dbDoc.updated_at = doc.updatedAt.toISOString();
  
  return dbDoc;
} 