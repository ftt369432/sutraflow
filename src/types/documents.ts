/**
 * Document Types
 * 
 * This file defines the types related to documents in the application.
 */

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  content: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  size?: number;
  metadata?: DocumentMetadata;
}

export type DocumentType = 
  | 'document' 
  | 'spreadsheet' 
  | 'presentation' 
  | 'pdf' 
  | 'image' 
  | 'code' 
  | 'notes'
  | 'other';

export interface DocumentMetadata {
  author?: string;
  lastModified?: Date;
  version?: string;
  format?: string;
  permissions?: DocumentPermissions;
}

export interface DocumentPermissions {
  canView: string[];
  canEdit: string[];
  canDelete: string[];
  isPublic?: boolean;
}

export interface DocumentStats {
  wordCount: number;
  characterCount: number;
  pageCount: number;
  readingTime: number; // in minutes
}

export interface DocumentAnalysis {
  summary?: string;
  keyTopics?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  complexity?: 'simple' | 'moderate' | 'complex';
}

export interface DocumentSearchResult {
  document: Document;
  relevanceScore: number;
  matchedTerms: string[];
}

export interface DocumentWithAnalytics extends Document {
  insights: {
    keyPoints: string[];
    topics: string[];
    sentiment: 'positive' | 'negative' | 'neutral';
    entities: string[];
    readingTime: number;
    relevance: number;
  };
  references: Array<{
    documentId: string;
    title: string;
    relevance: number;
  }>;
}

export interface SearchOptions {
  filters?: {
    type?: string[];
    tags?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
  sort?: {
    field: keyof Document;
    order: 'asc' | 'desc';
  };
  limit?: number;
} 