/**
 * Drive Vector Processor
 * 
 * Automated pipeline for processing uploaded files and integrating them
 * with the vector search system for intelligent document analysis
 */

import { vectorSearchService } from '../vectordb/vectorSearchService';
import { FreeAIService } from '../ai/freeAiService';
import { supabase } from '../../lib/supabase';
import { pythonBridgeService } from '../../services/bridge/PythonBridgeService';

export interface ProcessingJob {
  id: string;
  fileId: string;
  fileName: string;
  fileType: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface ProcessingResult {
  success: boolean;
  documentId?: string;
  summary?: string;
  keywords?: string[];
  insights?: string[];
  suggestions?: Array<{
    type: string;
    title: string;
    description: string;
    confidence: number;
  }>;
  error?: string;
}

export class DriveVectorProcessor {
  private aiService: FreeAIService;
  private processingQueue: Map<string, ProcessingJob> = new Map();
  private maxConcurrentJobs = 3;
  private activeJobs = 0;

  constructor() {
    this.aiService = new FreeAIService(supabase);
    this.startProcessingLoop();
  }

  /**
   * Queue a file for processing
   */
  async queueFileForProcessing(
    fileId: string,
    fileName: string,
    fileType: string,
    userId: string,
    priority: number = 5
  ): Promise<string> {
    try {
      // Create processing job record in database
      const { data, error } = await supabase
        .from('document_processing_queue')
        .insert({
          file_id: fileId,
          user_id: userId,
          processing_type: 'vector_indexing',
          priority,
          metadata: {
            file_name: fileName,
            file_type: fileType,
          },
        })
        .select()
        .single();

      if (error) throw error;

      // Create local processing job
      const job: ProcessingJob = {
        id: data.id,
        fileId,
        fileName,
        fileType,
        userId,
        status: 'pending',
        progress: 0,
      };

      this.processingQueue.set(job.id, job);

      // Start processing if we have capacity
      this.processNextJob();

      return job.id;
    } catch (error) {
      console.error('Failed to queue file for processing:', error);
      throw error;
    }
  }

  /**
   * Get processing status for a job
   */
  getProcessingStatus(jobId: string): ProcessingJob | null {
    return this.processingQueue.get(jobId) || null;
  }

  /**
   * Get all active processing jobs for a user
   */
  getUserProcessingJobs(userId: string): ProcessingJob[] {
    return Array.from(this.processingQueue.values())
      .filter(job => job.userId === userId);
  }

  /**
   * Main processing loop
   */
  private async startProcessingLoop() {
    setInterval(() => {
      this.processNextJob();
    }, 5000); // Check every 5 seconds

    // Process any pending jobs from database on startup
    this.loadPendingJobs();
  }

  /**
   * Load pending jobs from database
   */
  private async loadPendingJobs() {
    try {
      const { data: pendingJobs, error } = await supabase
        .from('document_processing_queue')
        .select('*')
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;

      pendingJobs?.forEach(job => {
        const processingJob: ProcessingJob = {
          id: job.id,
          fileId: job.file_id,
          fileName: job.metadata?.file_name || 'Unknown',
          fileType: job.metadata?.file_type || 'unknown',
          userId: job.user_id,
          status: 'pending',
          progress: 0,
        };

        this.processingQueue.set(job.id, processingJob);
      });

      console.log(`Loaded ${pendingJobs?.length || 0} pending processing jobs`);
    } catch (error) {
      console.error('Failed to load pending jobs:', error);
    }
  }

  /**
   * Process the next job in queue
   */
  private async processNextJob() {
    if (this.activeJobs >= this.maxConcurrentJobs) {
      return; // At capacity
    }

    // Find next pending job with highest priority
    const pendingJobs = Array.from(this.processingQueue.values())
      .filter(job => job.status === 'pending')
      .sort((a, b) => {
        // Sort by priority (higher first), then by queue time
        return (b.progress || 0) - (a.progress || 0);
      });

    if (pendingJobs.length === 0) {
      return; // No jobs to process
    }

    const job = pendingJobs[0];
    this.activeJobs++;

    try {
      await this.processFile(job);
    } catch (error) {
      console.error(`Failed to process job ${job.id}:`, error);
      await this.updateJobStatus(job.id, 'failed', 100, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.activeJobs--;
    }
  }

  /**
   * Process a single file
   */
  private async processFile(job: ProcessingJob): Promise<ProcessingResult> {
    try {
      console.log(`Starting processing for file: ${job.fileName}`);

      // Update job status
      await this.updateJobStatus(job.id, 'processing', 10);

      // 1. Get file from AI Drive
      const fileContent = await this.getFileContent(job.fileId);
      await this.updateJobStatus(job.id, 'processing', 20);

      // 2. Extract text based on file type
      const extractedText = await this.extractTextFromFile(fileContent, job.fileType);
      await this.updateJobStatus(job.id, 'processing', 40);

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text content could be extracted from the file');
      }

      // 3. Process with vector search service
      const vectorDocument = await vectorSearchService.indexDocument(
        extractedText,
        job.fileName,
        job.userId,
        job.fileId,
        job.fileName,
        job.fileType,
        `/files/${job.fileId}`
      );
      await this.updateJobStatus(job.id, 'processing', 80);

      // 4. Generate intelligent insights and suggestions
      const insights = await this.generateFileInsights(extractedText, job.fileType);
      const suggestions = await this.generateSmartSuggestions(vectorDocument, extractedText);
      await this.updateJobStatus(job.id, 'processing', 95);

      // 5. Update AI Drive file with processing results
      await this.updateFileWithResults(job.fileId, {
        summary: vectorDocument.summary,
        keywords: vectorDocument.keywords,
        insights,
        language: vectorDocument.language,
        complexity_score: vectorDocument.complexity_score,
        vector_document_id: vectorDocument.id,
      });

      // 6. Complete job
      await this.updateJobStatus(job.id, 'completed', 100);

      const result: ProcessingResult = {
        success: true,
        documentId: vectorDocument.id,
        summary: vectorDocument.summary,
        keywords: vectorDocument.keywords,
        insights,
        suggestions,
      };

      console.log(`Successfully processed file: ${job.fileName}`);
      return result;

    } catch (error) {
      console.error(`Failed to process file ${job.fileName}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.updateJobStatus(job.id, 'failed', 100, errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get file content from AI Drive
   */
  private async getFileContent(fileId: string): Promise<ArrayBuffer> {
    const { data, error } = await supabase.storage
      .from('ai-drive')
      .download(`${fileId}`);

    if (error) throw error;
    return await data.arrayBuffer();
  }




  /**
   * Extract text from file based on type, using Python bridge for complex types
   */
  private async extractTextFromFile(content: ArrayBuffer, fileType: string): Promise<string> {
    const file = new File([content], 'temp', { type: this.getMimeType(fileType) });
    const normalizedType = fileType.toLowerCase();

    // Check for Multimedia (Audio/Video)
    if (['mp3', 'wav', 'mp4', 'mpeg', 'm4a', 'avi', 'mov'].includes(normalizedType)) {
      return await this.transcribeWithPython(content);
    }

    // Check for Database Files
    if (['db', 'sqlite', 'sqlite3'].includes(normalizedType)) {
      return await this.ingestDatabaseWithPython(content);
    }

    switch (normalizedType) {
      case 'pdf':
        return await this.aiService.extractTextFromPDF(file);

      case 'doc':
      case 'docx':
        return await this.aiService.extractTextFromWord(file);

      case 'txt':
      case 'md':
        return await file.text();

      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return await this.aiService.extractTextFromImage(file);

      default:
        // Try to read as plain text
        try {
          return await file.text();
        } catch {
          throw new Error(`Unsupported file type: ${fileType}`);
        }
    }
  }



  /**
   * Generate intelligent insights about the file
   */
  private async generateFileInsights(content: string, fileType: string): Promise<string[]> {
    const insights: string[] = [];

    try {
      // Analyze content characteristics
      const wordCount = content.split(/\s+/).length;
      const sentences = content.split(/[.!?]+/).length;
      const avgWordsPerSentence = Math.round(wordCount / sentences);

      insights.push(`Document contains ${wordCount} words in ${sentences} sentences`);
      insights.push(`Average sentence length: ${avgWordsPerSentence} words`);

      // Detect language
      const languages = await this.aiService.detectLanguages(content);
      if (languages.length > 0) {
        insights.push(`Primary language: ${languages[0]}`);
      }

      // Extract key topics/themes
      const keywords = await this.aiService.extractKeywords(content, 10);
      if (keywords.length > 0) {
        insights.push(`Key topics: ${keywords.slice(0, 5).join(', ')}`);
      }

      // Content complexity analysis
      const avgWordLength = content.split(/\s+/)
        .reduce((sum, word) => sum + word.length, 0) / wordCount;

      if (avgWordLength > 6) {
        insights.push('Document contains complex terminology');
      } else if (avgWordLength < 4) {
        insights.push('Document uses simple, accessible language');
      }

      // File type specific insights
      switch (fileType.toLowerCase()) {
        case 'pdf':
          insights.push('PDF document - optimized for sharing and archival');
          break;
        case 'doc':
        case 'docx':
          insights.push('Word document - suitable for collaborative editing');
          break;
        case 'txt':
        case 'md':
          insights.push('Plain text format - highly compatible and searchable');
          break;
      }

    } catch (error) {
      console.warn('Failed to generate some insights:', error);
      insights.push('AI analysis completed with partial results');
    }

    return insights;
  }

  /**
   * Generate smart suggestions based on document content
   */
  private async generateSmartSuggestions(
    vectorDocument: any,
    content: string
  ): Promise<Array<{ type: string; title: string; description: string; confidence: number }>> {
    const suggestions: Array<{ type: string; title: string; description: string; confidence: number }> = [];

    try {
      // Analyze content for suggestion opportunities
      const wordCount = content.split(/\s+/).length;
      const keywords = vectorDocument.keywords || [];

      // Reading time suggestion
      const readingTimeMinutes = Math.ceil(wordCount / 200); // Average reading speed
      suggestions.push({
        type: 'bookmark',
        title: 'Add Reading Time Estimate',
        description: `This document requires approximately ${readingTimeMinutes} minutes to read`,
        confidence: 0.9,
      });

      // Content-based suggestions
      if (keywords.some((kw: string) => ['meeting', 'schedule', 'appointment'].includes(kw.toLowerCase()))) {
        suggestions.push({
          type: 'schedule_meeting',
          title: 'Schedule Related Meeting',
          description: 'This document mentions scheduling - create a calendar event?',
          confidence: 0.7,
        });
      }

      if (keywords.some((kw: string) => ['task', 'todo', 'action', 'deadline'].includes(kw.toLowerCase()))) {
        suggestions.push({
          type: 'create_task',
          title: 'Extract Action Items',
          description: 'Create tasks from action items mentioned in this document',
          confidence: 0.8,
        });
      }

      if (keywords.some((kw: string) => ['contract', 'agreement', 'legal', 'terms'].includes(kw.toLowerCase()))) {
        suggestions.push({
          type: 'bookmark',
          title: 'Mark as Legal Document',
          description: 'This appears to be a legal document - tag it appropriately?',
          confidence: 0.75,
        });
      }

      // Summary suggestion for long documents
      if (wordCount > 1000) {
        suggestions.push({
          type: 'summarize',
          title: 'Create Executive Summary',
          description: 'Generate a concise summary for this lengthy document',
          confidence: 0.85,
        });
      }

      // Translation suggestion if non-English
      if (vectorDocument.language && vectorDocument.language !== 'en' && vectorDocument.language !== 'eng') {
        suggestions.push({
          type: 'translate',
          title: 'Translate to English',
          description: `Translate this ${vectorDocument.language} document to English`,
          confidence: 0.8,
        });
      }

    } catch (error) {
      console.warn('Failed to generate suggestions:', error);
    }

    return suggestions;
  }

  /**
   * Update AI Drive file with processing results
   */
  private async updateFileWithResults(fileId: string, results: any) {
    const { error } = await supabase
      .from('ai_drive_files')
      .update({
        ai_metadata: {
          ...results,
          processed_at: new Date().toISOString(),
          processing_version: '1.0.0',
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', fileId);

    if (error) {
      console.error('Failed to update file with results:', error);
      throw error;
    }
  }

  /**
   * Update job status in database and local queue
   */
  private async updateJobStatus(
    jobId: string,
    status: ProcessingJob['status'],
    progress: number,
    error?: string
  ) {
    // Update local job
    const job = this.processingQueue.get(jobId);
    if (job) {
      job.status = status;
      job.progress = progress;
      job.error = error;

      if (status === 'processing' && !job.startedAt) {
        job.startedAt = new Date();
      }

      if (status === 'completed' || status === 'failed') {
        job.completedAt = new Date();
        // Remove from queue after a delay to allow status checking
        setTimeout(() => {
          this.processingQueue.delete(jobId);
        }, 30000); // 30 seconds
      }
    }

    // Update database
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (error) {
      updateData.error_message = error;
    }

    if (status === 'completed' || status === 'failed') {
      updateData.attempts = (job?.progress || 0) + 1;
    }

    const { error: dbError } = await supabase
      .from('document_processing_queue')
      .update(updateData)
      .eq('id', jobId);

    if (dbError) {
      console.error('Failed to update job status in database:', dbError);
    }
  }

  /**
   * Get MIME type for file extension
   */
  private getMimeType(fileType: string): string {
    const mimeTypes: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'md': 'text/markdown',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
    };

    return mimeTypes[fileType.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Cancel a processing job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.processingQueue.get(jobId);
    if (!job || job.status === 'completed') {
      return false;
    }

    await this.updateJobStatus(jobId, 'failed', job.progress, 'Cancelled by user');
    this.processingQueue.delete(jobId);
    return true;
  }

  /**
   * Get processing statistics
   */
  getProcessingStats() {
    const jobs = Array.from(this.processingQueue.values());
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      activeJobs: this.activeJobs,
      maxConcurrent: this.maxConcurrentJobs,
    };
  }


  /**
   * Transcribe Audio/Video using Python/Groq
   */
  private async transcribeWithPython(content: ArrayBuffer): Promise<string> {
    try {
      const base64Content = this.arrayBufferToBase64(content);

      const result = await pythonBridgeService.executeTool('transcribe_media', {
        base64_content: base64Content,
        prompt: "Transcribe this legal/medical audio file accurately."
      });

      if (result.status === 'success' && result.result.success) {
        return `[TRANSCRIPTION]\n${result.result.text}`;
      } else {
        throw new Error(result.result?.error || "Unknown transcription error");
      }
    } catch (error) {
      console.error('Transcription failed:', error);
      throw new Error(`Transcription failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Ingest Database Schema/Data using Python
   */
  private async ingestDatabaseWithPython(content: ArrayBuffer): Promise<string> {
    try {
      const base64Content = this.arrayBufferToBase64(content);

      // First, get the schema
      const result = await pythonBridgeService.executeTool('query_database', {
        base64_content: base64Content
      });

      if (result.status === 'success' && result.result.success) {
        const schema = result.result.schema;
        let textOutput = `[DATABASE SCHEMA]\n`;

        // Format Schema
        for (const [table, columns] of Object.entries(schema)) {
          textOutput += `TABLE: ${table}\nCOLUMNS: ${(columns as string[]).join(', ')}\n\n`;
        }

        return textOutput;
      } else {
        throw new Error(result.result?.error || "Unknown database ingestion error");
      }
    } catch (error) {
      console.error('Database ingestion failed:', error);
      throw new Error(`Database ingestion failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Helper: Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

// Singleton instance
export const driveVectorProcessor = new DriveVectorProcessor(); 