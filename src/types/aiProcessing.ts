import { AIDocument, AIFolder } from './ai';

export interface AIProcessingOptions {
  includeEmbeddings: boolean;
  includeAIAnalysis: boolean;
  includeAiTags: boolean;
  forceReprocess: boolean;
  concurrency: number;
  selectedFolderId?: string;
  createFolder: boolean;
  folderName: string;
}

export interface AIProcessingStats {
  total: number;
  processed: number;
  failed: number;
  skipped: number;
  embeddings: number;
  analysis: number;
  tags: number;
}

export interface AIProcessingResult {
  stats: AIProcessingStats;
  processedDocuments: AIDocument[];
  processedFolders: AIFolder[];
  errors: Error[];
}

export interface BatchProcessingResult extends AIProcessingResult {
  totalProcessed: number;
  completedAt: Date;
}

export interface ProcessingStats extends AIProcessingStats {
  startTime: Date;
  endTime?: Date;
  currentDocument?: string;
}

export interface ProcessingOptions extends AIProcessingOptions {
  batchSize?: number;
  timeout?: number;
}

export type ProcessingStatus = 'idle' | 'running' | 'paused' | 'complete' | 'error';
export type ProcessingStep = 'analyze' | 'configure' | 'processing' | 'complete';
