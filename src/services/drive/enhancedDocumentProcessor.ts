/**
 * Enhanced Document Processor
 * 
 * Provides comprehensive document processing with full text extraction,
 * OCR capabilities, and AI analysis integration for chat and search.
 */

import * as pdfjs from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import { supabase } from '../../lib/supabase';
import { vectorSearchService } from '../vectordb/vectorSearchService';
import { geminiSimplifiedService } from '../gemini-simplified';

// PDF worker is configured globally in src/lib/pdfWorkerSetup.ts

export interface ProcessedDocument {
  id: string;
  fileName: string;
  fileType: string;
  extractedText: string;
  ocrText?: string;
  fullContent: string; // Combined extracted + OCR text
  summary?: string;
  keywords?: string[];
  metadata: {
    wordCount: number;
    language: string;
    complexity: 'simple' | 'moderate' | 'complex';
    hasImages: boolean;
    ocrProcessed: boolean;
    processingTime: number;
  };
}

export interface ProcessingOptions {
  performOCR?: boolean;
  generateSummary?: boolean;
  extractKeywords?: boolean;
  forceReprocess?: boolean;
  progressCallback?: (progress: number, status: string) => void;
}

export class EnhancedDocumentProcessor {
  private aiService = geminiSimplifiedService;

  /**
   * Process document with comprehensive text extraction and AI analysis
   */
  async processDocument(
    fileId: string, 
    options: ProcessingOptions = {
      performOCR: true,
      generateSummary: true, 
      extractKeywords: true,
      forceReprocess: false
    }
  ): Promise<ProcessedDocument> {
    const startTime = Date.now();
    const { progressCallback } = options;
    
    try {
      progressCallback?.(10, 'Loading document...');
      
      // Get document metadata from database
      const { data: file, error } = await supabase
        .from('ai_drive_files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (error || !file) {
        throw new Error('Document not found');
      }

      progressCallback?.(20, 'Extracting text content...');
      
      // 1. Extract basic text content
      const extractedText = await this.extractTextContent(fileId, file.mime_type || '');
      
      progressCallback?.(40, 'Processing with OCR if applicable...');
      
      // 2. Perform OCR if needed and enabled
      let ocrText = '';
      let hasImages = false;
      
      if (options.performOCR && this.shouldPerformOCR(file.mime_type || '')) {
        ocrText = await this.performAdvancedOCR(fileId, file.mime_type || '');
        hasImages = true;
        progressCallback?.(60, 'OCR processing completed...');
      }

      // 3. Combine all text content
      const fullContent = this.combineTextContent(extractedText, ocrText);
      
      if (!fullContent || fullContent.trim().length === 0) {
        throw new Error('No text content could be extracted from document');
      }

      progressCallback?.(70, 'Analyzing content...');
      
      // 4. Generate AI analysis (simplified for now)
      let summary = '';
      let keywords: string[] = [];
      
      if (options.generateSummary) {
        summary = await this.generateBasicSummary(fullContent);
      }
      
      if (options.extractKeywords) {
        keywords = await this.extractKeywords(fullContent);
      }

      progressCallback?.(85, 'Creating vector embeddings...');
      
      // 5. Create/update vector embeddings for search
      await this.updateVectorEmbeddings(fileId, fullContent, file.name, file.mime_type || '');

      progressCallback?.(95, 'Saving results...');
      
      // 6. Update document record with enhanced metadata
      await this.updateDocumentRecord(fileId, {
        fullContent,
        ocrText: ocrText || null,
        summary: summary || null,
        keywords: keywords || [],
        hasImages,
        processingTime: Date.now() - startTime
      });

      progressCallback?.(100, 'Processing complete!');

      return {
        id: fileId,
        fileName: file.name,
        fileType: file.mime_type || 'unknown',
        extractedText,
        ocrText: ocrText || undefined,
        fullContent,
        summary: summary || undefined,
        keywords: keywords || undefined,
        metadata: {
          wordCount: fullContent.split(/\s+/).length,
          language: await this.detectLanguage(fullContent),
          complexity: await this.analyzeComplexity(fullContent),
          hasImages,
          ocrProcessed: !!ocrText,
          processingTime: Date.now() - startTime
        }
      };

    } catch (error) {
      console.error('Document processing failed:', error);
      throw new Error(`Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get full document content for AI chat interactions
   */
  async getDocumentContentForChat(fileId: string, forceReprocess = false): Promise<string> {
    try {
      // Check if we have processed content with OCR
      const { data: file, error } = await supabase
        .from('ai_drive_files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (error || !file) {
        throw new Error('Document not found');
      }

      // Check if we have full processed content
      const processedData = file;

      // If we have OCR text or force reprocessing, use the enhanced content
      if (forceReprocess || !processedData?.ocr_text) {
        const processed = await this.processDocument(fileId, {
          performOCR: true,
          generateSummary: false,
          extractKeywords: false,
          forceReprocess
        });
        return processed.fullContent;
      }

      // Return existing processed content
      const existingText = processedData.content_preview || '';
      const ocrText = processedData.ocr_text || '';
      
      return this.combineTextContent(existingText, ocrText);
      
    } catch (error) {
      console.error('Failed to get document content for chat:', error);
      
      // Fallback to basic text extraction
      return await this.extractTextContent(fileId, '');
    }
  }

  /**
   * Extract text content based on file type
   */
  private async extractTextContent(fileId: string, mimeType: string): Promise<string> {
    try {
      // Get file from storage
      const { data, error } = await supabase.storage
        .from('ai-drive')
        .download(`${fileId}`);

      if (error || !data) {
        throw new Error('Could not download file for processing');
      }

      // Convert blob to appropriate format for processing
      const fileBuffer = await data.arrayBuffer();

      switch (mimeType) {
        case 'application/pdf':
          return await this.extractTextFromPDF(fileBuffer);
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          return await this.extractTextFromWord(fileBuffer);
        case 'text/plain':
        case 'text/markdown':
          return await this.extractTextFromPlain(fileBuffer);
        case 'image/jpeg':
        case 'image/png':
        case 'image/gif':
          return ''; // Will be handled by OCR
        default:
          console.warn(`Unsupported file type: ${mimeType}`);
          return '';
      }
    } catch (error) {
      console.error('Text extraction failed:', error);
      return '';
    }
  }

  /**
   * Extract text from PDF files
   */
  private async extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
    try {
      const pdf = await pdfjs.getDocument(buffer).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .filter((item): item is any => 'str' in item)
          .map(item => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      return fullText.trim();
    } catch (error) {
      console.error('PDF text extraction failed:', error);
      return '';
    }
  }

  /**
   * Extract text from Word documents
   */
  private async extractTextFromWord(buffer: ArrayBuffer): Promise<string> {
    try {
      // This would typically use a library like mammoth
      // For now, return a placeholder
      console.log('Word document processing not yet implemented');
      return '';
    } catch (error) {
      console.error('Word text extraction failed:', error);
      return '';
    }
  }

  /**
   * Extract text from plain text files
   */
  private async extractTextFromPlain(buffer: ArrayBuffer): Promise<string> {
    try {
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(buffer);
    } catch (error) {
      console.error('Plain text extraction failed:', error);
      return '';
    }
  }

  /**
   * Determine if OCR processing is needed
   */
  private shouldPerformOCR(mimeType: string): boolean {
    const ocrTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'application/pdf' // PDFs might contain scanned images
    ];
    return ocrTypes.includes(mimeType);
  }

  /**
   * Perform advanced OCR processing
   */
  private async performAdvancedOCR(fileId: string, mimeType: string): Promise<string> {
    try {
      // Get file from storage
      const { data, error } = await supabase.storage
        .from('ai-drive')
        .download(`${fileId}`);

      if (error || !data) {
        throw new Error('Could not download file for OCR');
      }

      // Convert to blob URL for Tesseract
      const imageUrl = URL.createObjectURL(data);

      try {
        const { data: { text } } = await Tesseract.recognize(
          imageUrl,
          'eng',
          {
            logger: m => console.log(m) // Optional: log progress
          }
        );

        URL.revokeObjectURL(imageUrl); // Clean up
        return text.trim();
      } catch (ocrError) {
        URL.revokeObjectURL(imageUrl);
        throw ocrError;
      }
    } catch (error) {
      console.error('OCR processing failed:', error);
      return '';
    }
  }

  /**
   * Combine extracted text and OCR text
   */
  private combineTextContent(extractedText: string, ocrText: string): string {
    const combined = [extractedText, ocrText]
      .filter(text => text && text.trim().length > 0)
      .join('\n\n--- OCR Content ---\n\n');
    
    return combined.trim();
  }

  /**
   * Generate basic summary using AI
   */
  private async generateBasicSummary(content: string): Promise<string> {
    if (!content || content.length < 100) {
      return 'Document too short for summary';
    }

    const prompt = `Please provide a concise summary of the following document content in 2-3 sentences:

${content.substring(0, 2000)}...`;

    try {
      const response = await this.aiService.generateText(prompt);
      return response.trim();
    } catch (error) {
      console.error('Summary generation failed:', error);
      return 'Summary could not be generated';
    }
  }

  /**
   * Extract keywords using AI
   */
  private async extractKeywords(content: string): Promise<string[]> {
    if (!content || content.length < 50) {
      return [];
    }

    const prompt = `Extract 5-10 key topics and important terms from this document. Return only a comma-separated list of keywords:

${content.substring(0, 1000)}...`;

    try {
      const response = await this.aiService.generateText(prompt);
      return response
        .split(',')
        .map(keyword => keyword.trim())
        .filter(keyword => keyword.length > 2)
        .slice(0, 10);
    } catch (error) {
      console.error('Keyword extraction failed:', error);
      return [];
    }
  }

  /**
   * Detect document language
   */
  private async detectLanguage(content: string): Promise<string> {
    // Simple language detection - could be enhanced with proper language detection library
    if (!content || content.length < 50) {
      return 'unknown';
    }

    // Basic heuristics for common languages
    const englishWords = ['the', 'and', 'to', 'of', 'a', 'in', 'for', 'is', 'on', 'that'];
    const spanishWords = ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no'];
    const frenchWords = ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir'];

    const words = content.toLowerCase().split(/\s+/).slice(0, 100);
    
    let englishCount = 0;
    let spanishCount = 0;
    let frenchCount = 0;

    words.forEach(word => {
      if (englishWords.includes(word)) englishCount++;
      if (spanishWords.includes(word)) spanishCount++;
      if (frenchWords.includes(word)) frenchCount++;
    });

    if (englishCount > spanishCount && englishCount > frenchCount) return 'en';
    if (spanishCount > englishCount && spanishCount > frenchCount) return 'es';
    if (frenchCount > englishCount && frenchCount > spanishCount) return 'fr';
    
    return 'en'; // Default to English
  }

  /**
   * Analyze document complexity
   */
  private async analyzeComplexity(content: string): Promise<'simple' | 'moderate' | 'complex'> {
    if (!content || content.length < 100) {
      return 'simple';
    }

    const words = content.split(/\s+/);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    // Simple complexity scoring
    let complexityScore = 0;
    
    if (avgWordsPerSentence > 20) complexityScore += 2;
    else if (avgWordsPerSentence > 15) complexityScore += 1;
    
    if (avgWordLength > 6) complexityScore += 2;
    else if (avgWordLength > 5) complexityScore += 1;
    
    // Check for technical terms (words longer than 10 characters)
    const technicalWords = words.filter(word => word.length > 10).length;
    if (technicalWords > words.length * 0.1) complexityScore += 2;
    else if (technicalWords > words.length * 0.05) complexityScore += 1;

    if (complexityScore >= 4) return 'complex';
    if (complexityScore >= 2) return 'moderate';
    return 'simple';
  }

  /**
   * Update vector embeddings for search
   */
  private async updateVectorEmbeddings(
    fileId: string, 
    content: string, 
    fileName: string, 
    fileType: string
  ): Promise<void> {
    try {
      await vectorSearchService.indexDocument(
        content,
        fileName,
        'user-id', // This should be passed from the calling context
        fileId,
        fileName,
        fileType,
        `/files/${fileId}`
      );
    } catch (error) {
      console.error('Vector embedding update failed:', error);
      // Don't throw - this is not critical for basic functionality
    }
  }

  /**
   * Update document record with processing results
   */
  private async updateDocumentRecord(
    fileId: string, 
    results: {
      fullContent: string;
      ocrText: string | null;
      summary: string | null;
      keywords: string[];
      hasImages: boolean;
      processingTime: number;
    }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_drive_files')
        .update({
          ai_summary: results.summary,
          tags: results.keywords,
          ai_last_processed: new Date().toISOString(),
          ai_confidence: 0.8, // Default confidence score
          processing_time_ms: results.processingTime
        })
        .eq('id', fileId);

      if (error) {
        console.error('Failed to update document record:', error);
      }
    } catch (error) {
      console.error('Database update failed:', error);
      // Don't throw - this is not critical for basic functionality
    }
  }
}

export const enhancedDocumentProcessor = new EnhancedDocumentProcessor(); 