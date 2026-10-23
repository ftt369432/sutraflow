import { supabase } from '../../lib/supabase';
import { getEmbedding } from '../embeddingService';

export interface LegalDocument {
  id?: string;
  user_id?: string;
  title: string;
  content: string;
  document_type: string;
  status?: string;
  embedding?: number[];
  metadata?: Record<string, any>;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Citation {
  id?: string;
  document_id: string;
  citation_text: string;
  source?: string;
  url?: string;
  relevance_score?: number;
}

export interface DocumentTemplate {
  id?: string;
  user_id?: string;
  title: string;
  content: string;
  document_type: string;
  is_public?: boolean;
}

export interface WritingStyle {
  id?: string;
  user_id?: string;
  name: string;
  characteristics: Record<string, any>;
  sample_text?: string;
}

export class LegalDocumentService {
  private supabase;

  constructor() {
    this.supabase = supabase;
  }

  // Document operations
  async createDocument(document: LegalDocument, userId: string): Promise<LegalDocument> {
    try {
      // Generate embedding for vector search
      const embedding = await getEmbedding(document.content);
      
      const { data, error } = await this.supabase
        .from('legal_documents')
        .insert({
          ...document,
          user_id: userId,
          embedding,
          status: document.status || 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) throw new Error(error.message);
      return data[0];
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  async getDocument(id: string): Promise<LegalDocument> {
    const { data, error } = await this.supabase
      .from('legal_documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateDocument(id: string, updates: Partial<LegalDocument>): Promise<LegalDocument> {
    // If content is updated, regenerate the embedding
    let embedding = undefined;
    if (updates.content) {
      embedding = await getEmbedding(updates.content);
    }

    const { data, error } = await this.supabase
      .from('legal_documents')
      .update({
        ...updates,
        ...(embedding && { embedding }),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) throw new Error(error.message);
    return data[0];
  }

  async deleteDocument(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('legal_documents')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async listDocuments(userId: string, filters?: { 
    document_type?: string, 
    status?: string,
    tags?: string[]
  }): Promise<LegalDocument[]> {
    let query = this.supabase
      .from('legal_documents')
      .select('*')
      .eq('user_id', userId);

    if (filters?.document_type) {
      query = query.eq('document_type', filters.document_type);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  // Semantic search for documents
  async searchDocumentsByContent(query: string, threshold: number = 0.7, limit: number = 10): Promise<LegalDocument[]> {
    try {
      const embedding = await getEmbedding(query);
      
      const { data, error } = await this.supabase.rpc(
        'match_documents',
        {
          query_embedding: embedding,
          match_threshold: threshold,
          match_count: limit
        }
      );

      if (error) throw new Error(error.message);
      return data || [];
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }

  // Citation operations
  async addCitation(citation: Citation): Promise<Citation> {
    const { data, error } = await this.supabase
      .from('citations')
      .insert(citation)
      .select();

    if (error) throw new Error(error.message);
    return data[0];
  }

  async getCitationsForDocument(documentId: string): Promise<Citation[]> {
    const { data, error } = await this.supabase
      .from('citations')
      .select('*')
      .eq('document_id', documentId);

    if (error) throw new Error(error.message);
    return data || [];
  }

  // Template operations
  async createTemplate(template: DocumentTemplate, userId: string): Promise<DocumentTemplate> {
    const { data, error } = await this.supabase
      .from('document_templates')
      .insert({
        ...template,
        user_id: userId,
        is_public: template.is_public || false
      })
      .select();

    if (error) throw new Error(error.message);
    return data[0];
  }

  async getTemplates(userId: string, includePublic: boolean = true): Promise<DocumentTemplate[]> {
    let query = this.supabase
      .from('document_templates')
      .select('*');
    
    if (includePublic) {
      query = query.or(`user_id.eq.${userId},is_public.eq.true`);
    } else {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data || [];
  }

  // Writing style operations
  async saveWritingStyle(style: WritingStyle, userId: string): Promise<WritingStyle> {
    const { data, error } = await this.supabase
      .from('writing_styles')
      .insert({
        ...style,
        user_id: userId
      })
      .select();

    if (error) throw new Error(error.message);
    return data[0];
  }

  async getWritingStyles(userId: string): Promise<WritingStyle[]> {
    const { data, error } = await this.supabase
      .from('writing_styles')
      .select('*')
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return data || [];
  }
} 