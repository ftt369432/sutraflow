import { DocumentType } from '../../types/documents';
import { SubscriptionTier } from '../../stores/userStore';

export interface AIAnalysisOptions {
  forceFull?: boolean;
  includeOcr?: boolean;
  progressCallback?: (progress: number) => void;
}

export interface AIAnalysisResult {
  summary: string;
  topics: string[];
  entities: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  complexity?: 'simple' | 'moderate' | 'complex';
  keyInsights: string[];
  containsSensitiveInfo?: boolean;
  languages: string[];
  wordCount: number;  
  readingTime: number;
  confidence: number;
  processedFeatures: string[];
  ocrText?: string;
}

/**
 * Interface for AI Processing Service
 * Defines the contract for any AI processing implementation
 */
export interface IAIProcessor {
  /**
   * Process text content with AI analysis based on subscription tier
   */
  processContent(
    content: string,
    fileType: DocumentType,
    tier: SubscriptionTier,
    options?: AIAnalysisOptions
  ): Promise<AIAnalysisResult>;

  /**
   * Generate text embeddings for vector search
   */
  generateEmbedding(text: string): Promise<number[]>;
  
  /**
   * Extract text content from various file types
   */
  extractContent(file: File): Promise<{ text: string; preview: string }>;
  
  /**
   * Perform OCR on image or PDF file
   */
  performOcr(file: File): Promise<string | null>;

  /**
   * Answer questions about document content
   */
  answerQuestion(content: string, question: string): Promise<string>;
}
