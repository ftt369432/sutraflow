/**
 * Enhanced AI Document Processing System
 * 
 * Provides robust, fast, and user-friendly document processing with:
 * - Parallel processing for multiple documents
 * - Smart batch processing with progress tracking
 * - Document type detection and specialized processing
 * - Quality validation and error recovery
 * - Processing queue management
 * - Real-time status updates
 */

import { AIService } from './baseAIService';
import { AIServiceFactory } from './aiServiceFactory';
import { supabase } from '@/lib/supabase';
import { useKnowledgeBaseStore } from '@/store/knowledgeBaseStore';

export interface DocumentProcessingRequest {
  id: string;
  title: string;
  content: string;
  folderId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type?: 'legal' | 'contract' | 'research' | 'medical' | 'general';
  metadata?: Record<string, any>;
}

export interface ProcessingResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  progress: number;
  embedding?: number[];
  summary?: string;
  keyPoints?: string[];
  documentType?: string;
  confidence?: number;
  processingTime?: number;
  error?: string;
  retryCount?: number;
}

export interface ProcessingStats {
  totalDocuments: number;
  completed: number;
  failed: number;
  inProgress: number;
  averageProcessingTime: number;
  successRate: number;
  estimatedTimeRemaining: number;
}

export interface ProcessingOptions {
  batchSize?: number;
  maxRetries?: number;
  enableParallelProcessing?: boolean;
  enableProgressTracking?: boolean;
  generateSummary?: boolean;
  generateEmbedding?: boolean;
  enableQualityValidation?: boolean;
  skipDuplicates?: boolean;
}

export class EnhancedDocumentProcessor {
  private static instance: EnhancedDocumentProcessor;
  private aiService: AIService;
  private processingQueue: Map<string, DocumentProcessingRequest> = new Map();
  private results: Map<string, ProcessingResult> = new Map();
  private isProcessing = false;
  private eventListeners: Map<string, Function[]> = new Map();
  private stats: ProcessingStats = {
    totalDocuments: 0,
    completed: 0,
    failed: 0,
    inProgress: 0,
    averageProcessingTime: 0,
    successRate: 100,
    estimatedTimeRemaining: 0
  };

  private constructor() {
    this.aiService = AIServiceFactory.getInstance();
  }

  static getInstance(): EnhancedDocumentProcessor {
    if (!EnhancedDocumentProcessor.instance) {
      EnhancedDocumentProcessor.instance = new EnhancedDocumentProcessor();
    }
    return EnhancedDocumentProcessor.instance;
  }

  /**
   * Add document to processing queue
   */
  async queueDocument(
    document: DocumentProcessingRequest,
    options: ProcessingOptions = {}
  ): Promise<string> {
    console.log(`📄 Queuing document: ${document.title} (Priority: ${document.priority})`);
    
    // Skip duplicates if enabled
    if (options.skipDuplicates && this.processingQueue.has(document.id)) {
      console.log(`⏭️ Skipping duplicate document: ${document.title}`);
      return document.id;
    }

    // Add to queue with priority ordering
    this.processingQueue.set(document.id, document);
    
    // Initialize result tracking
    this.results.set(document.id, {
      id: document.id,
      status: 'pending',
      progress: 0,
      retryCount: 0
    });

    this.updateStats();
    this.emit('document_queued', { documentId: document.id, document });

    // Auto-start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing(options);
    }

    return document.id;
  }

  /**
   * Process multiple documents in parallel batches
   */
  async processBatch(
    documents: DocumentProcessingRequest[],
    options: ProcessingOptions = {}
  ): Promise<Map<string, ProcessingResult>> {
    console.log(`🚀 Starting batch processing: ${documents.length} documents`);
    
    const {
      batchSize = 3,
      enableParallelProcessing = true
    } = options;

    // Queue all documents
    for (const doc of documents) {
      await this.queueDocument(doc, options);
    }

    // Process in batches
    if (enableParallelProcessing) {
      return this.processParallelBatches(batchSize, options);
    } else {
      return this.processSequentialBatch(options);
    }
  }

  /**
   * Process documents in parallel batches
   */
  private async processParallelBatches(
    batchSize: number,
    options: ProcessingOptions
  ): Promise<Map<string, ProcessingResult>> {
    const results = new Map<string, ProcessingResult>();
    const queuedDocs = Array.from(this.processingQueue.values());
    
    // Sort by priority
    queuedDocs.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Process in batches
    for (let i = 0; i < queuedDocs.length; i += batchSize) {
      const batch = queuedDocs.slice(i, i + batchSize);
      console.log(`⚡ Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(queuedDocs.length / batchSize)}`);
      
      const batchPromises = batch.map(doc => this.processDocument(doc, options));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        const doc = batch[index];
        if (result.status === 'fulfilled') {
          results.set(doc.id, result.value);
        } else {
          results.set(doc.id, {
            id: doc.id,
            status: 'failed',
            progress: 0,
            error: result.reason?.message || 'Unknown error'
          });
        }
      });

      // Update progress
      this.updateStats();
      this.emit('batch_completed', { batchNumber: Math.floor(i / batchSize) + 1, results: batchResults });
    }

    return results;
  }

  /**
   * Process a single document with full AI enhancement
   */
  private async processDocument(
    document: DocumentProcessingRequest,
    options: ProcessingOptions
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const result = this.results.get(document.id)!;
    
    try {
      console.log(`🔍 Processing: ${document.title} (${document.content.length} chars)`);
      
      // Update status
      result.status = 'processing';
      result.progress = 10;
      this.emit('document_progress', { documentId: document.id, progress: 10 });

      // Detect document type
      const documentType = await this.detectDocumentType(document.content);
      result.documentType = documentType;
      result.progress = 20;
      this.emit('document_progress', { documentId: document.id, progress: 20 });

      // Generate embedding if enabled
      if (options.generateEmbedding !== false) {
        console.log(`🧠 Generating embedding for: ${document.title}`);
        result.embedding = await this.aiService.embedText(document.content);
        result.progress = 50;
        this.emit('document_progress', { documentId: document.id, progress: 50 });
      }

      // Generate summary if enabled
      if (options.generateSummary !== false) {
        console.log(`📝 Generating summary for: ${document.title}`);
        const summary = await this.generateDocumentSummary(document.content, documentType);
        result.summary = summary.summary;
        result.keyPoints = summary.keyPoints;
        result.confidence = summary.confidence;
        result.progress = 80;
        this.emit('document_progress', { documentId: document.id, progress: 80 });
      }

      // Quality validation if enabled
      if (options.enableQualityValidation) {
        const isValid = await this.validateProcessingQuality(result);
        if (!isValid && result.retryCount! < (options.maxRetries || 2)) {
          result.retryCount!++;
          result.status = 'retrying';
          console.log(`🔄 Retrying document processing: ${document.title} (Attempt ${result.retryCount})`);
          return this.processDocument(document, options);
        }
      }

      // Save to knowledge base
      await this.saveToKnowledgeBase(document, result);

      // Complete processing
      result.status = 'completed';
      result.progress = 100;
      result.processingTime = Date.now() - startTime;
      
      console.log(`✅ Completed: ${document.title} (${result.processingTime}ms)`);
      this.emit('document_completed', { documentId: document.id, result });

      return result;

    } catch (error) {
      console.error(`❌ Failed to process: ${document.title}`, error);
      
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.processingTime = Date.now() - startTime;
      
      this.emit('document_failed', { documentId: document.id, error: result.error });
      
      return result;
    }
  }

  /**
   * Detect document type using AI
   */
  private async detectDocumentType(content: string): Promise<string> {
    const prompt = `Analyze this document and identify its type. Return one of: legal, contract, research, medical, financial, general.

Document content preview:
${content.substring(0, 1000)}...

Document type:`;

    try {
      const response = await this.aiService.generateText(prompt);
      return response.toLowerCase().trim();
    } catch (error) {
      console.error('Document type detection failed:', error);
      return 'general';
    }
  }

  /**
   * Generate comprehensive document summary
   */
  private async generateDocumentSummary(
    content: string,
    documentType: string
  ): Promise<{ summary: string; keyPoints: string[]; confidence: number }> {
    const prompt = `Create a comprehensive summary of this ${documentType} document.

Document content:
${content}

Please provide:
1. A concise summary (2-3 sentences)
2. Key points (5-7 bullet points)
3. Confidence level (1-100)

Format your response as JSON:
{
  "summary": "...",
  "keyPoints": ["...", "...", "..."],
  "confidence": 85
}`;

    try {
      const response = await this.aiService.generateText(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Summary generation failed:', error);
      return {
        summary: 'Summary generation failed',
        keyPoints: [],
        confidence: 0
      };
    }
  }

  /**
   * Validate processing quality
   */
  private async validateProcessingQuality(result: ProcessingResult): Promise<boolean> {
    // Check if embedding is valid
    if (result.embedding && result.embedding.length !== 768) {
      console.warn('Invalid embedding length:', result.embedding.length);
      return false;
    }

    // Check if summary is meaningful
    if (result.summary && result.summary.length < 50) {
      console.warn('Summary too short:', result.summary.length);
      return false;
    }

    // Check confidence level
    if (result.confidence !== undefined && result.confidence < 60) {
      console.warn('Low confidence score:', result.confidence);
      return false;
    }

    return true;
  }

  /**
   * Save processed document to knowledge base
   */
  private async saveToKnowledgeBase(
    document: DocumentProcessingRequest,
    result: ProcessingResult
  ): Promise<void> {
    const { updateDocument } = useKnowledgeBaseStore.getState();
    
    const documentData = {
      id: document.id,
      title: document.title,
      content: document.content,
      embedding: result.embedding,
      summary: result.summary,
      keyPoints: result.keyPoints,
      documentType: result.documentType,
      confidence: result.confidence,
      folderId: document.folderId,
      metadata: {
        ...document.metadata,
        processingTime: result.processingTime,
        processedAt: new Date().toISOString()
      }
    };

    await updateDocument(document.id, documentData);
  }

  /**
   * Start processing queue
   */
  private async startProcessing(options: ProcessingOptions = {}): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    console.log('🚀 Starting document processing engine...');
    
    try {
      await this.processParallelBatches(options.batchSize || 3, options);
    } finally {
      this.isProcessing = false;
      this.processingQueue.clear();
      console.log('✅ Document processing engine stopped');
    }
  }

  /**
   * Get processing statistics
   */
  getStats(): ProcessingStats {
    return { ...this.stats };
  }

  /**
   * Get processing result
   */
  getResult(documentId: string): ProcessingResult | undefined {
    return this.results.get(documentId);
  }

  /**
   * Update statistics
   */
  private updateStats(): void {
    const results = Array.from(this.results.values());
    
    this.stats.totalDocuments = results.length;
    this.stats.completed = results.filter(r => r.status === 'completed').length;
    this.stats.failed = results.filter(r => r.status === 'failed').length;
    this.stats.inProgress = results.filter(r => r.status === 'processing').length;
    
    const completedResults = results.filter(r => r.status === 'completed' && r.processingTime);
    this.stats.averageProcessingTime = completedResults.length > 0
      ? completedResults.reduce((sum, r) => sum + (r.processingTime || 0), 0) / completedResults.length
      : 0;
    
    this.stats.successRate = this.stats.totalDocuments > 0
      ? (this.stats.completed / this.stats.totalDocuments) * 100
      : 100;
  }

  /**
   * Event system for real-time updates
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) listeners.splice(index, 1);
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Process sequential batch (fallback)
   */
  private async processSequentialBatch(options: ProcessingOptions): Promise<Map<string, ProcessingResult>> {
    const results = new Map<string, ProcessingResult>();
    
    for (const document of this.processingQueue.values()) {
      const result = await this.processDocument(document, options);
      results.set(document.id, result);
    }
    
    return results;
  }
}

// Export singleton instance
export const enhancedDocumentProcessor = EnhancedDocumentProcessor.getInstance(); 