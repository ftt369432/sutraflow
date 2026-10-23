import { createWorker } from 'tesseract.js';
import { SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from '../../config/env';

export class FreeAIService {
  private tokenizer: any;
  private tfidf: any;
  private naturalLoaded: boolean = false;

  constructor(_supabaseClient: SupabaseClient) {
    this.initializeNatural();
  }

  private async initializeNatural() {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        this.naturalLoaded = false;
        return;
      }

      // Natural.js has browser compatibility issues, use fallback methods
      console.info('Using fallback text processing methods instead of Natural.js for better browser compatibility');
      this.naturalLoaded = false;
    } catch (error) {
      console.warn('Natural library failed to load, using fallback methods:', error);
      this.naturalLoaded = false;
    }
  }

  async detectLanguages(text: string): Promise<string[]> {
    try {
      // Using franc-min for basic language detection
      const francModule = await import('franc-min');
      const languageCode = francModule.franc(text);
      return [languageCode];
    } catch (error) {
      console.warn('Language detection failed, defaulting to English:', error);
      return ['eng'];
    }
  }

  async extractTextFromPDF(file: File): Promise<string> {
    try {
      const pdfjsLib = await import('pdfjs-dist');

      // PDF worker is configured globally in src/lib/pdfWorkerSetup.ts

      const fileBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;

      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      return fullText.trim();
    } catch (error) {
      console.error('PDF extraction failed:', error);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async extractTextFromImage(file: File): Promise<string> {
    try {
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      return text;
    } catch (error) {
      console.error('OCR failed:', error);
      throw new Error(`Failed to extract text from image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async extractTextFromWord(file: File): Promise<string> {
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      console.error('Word document extraction failed:', error);
      throw new Error(`Failed to extract text from Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async tokenizeText(text: string): Promise<string[]> {
    if (this.naturalLoaded && this.tokenizer) {
      return this.tokenizer.tokenize(text) || [];
    }

    // Fallback tokenization
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  async generateEmbeddings(text: string): Promise<number[]> {
    try {
      if (!this.naturalLoaded) {
        await this.initializeNatural();
      }

      // Simple TF-IDF based embeddings as fallback - use env dimension
      const tokens = await this.tokenizeText(text);
      const dim = getEnv().embeddingDimension;
      const embedding = new Array(dim).fill(0);

      // Simple hash-based embedding generation
      tokens.forEach((token, _index) => {
        const hash = this.simpleHash(token);
        embedding[hash % dim] += 1;
        // Add secondary hash for better distribution
        const hash2 = this.simpleHash(token + '_variant');
        embedding[(hash2 % dim)] += 0.5;
      });

      // Normalize to unit vector
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
    } catch (error) {
      console.error('Embedding generation failed:', error);
      // Return zero vector as fallback - use env dimension
      return new Array(getEnv().embeddingDimension).fill(0);
    }
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  async summarizeText(text: string, maxLength: number = 500): Promise<string> {
    try {
      // Simple extractive summarization
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

      if (sentences.length <= 3) {
        return text;
      }

      // Score sentences by word frequency and position
      const words = await this.tokenizeText(text);
      const wordFreq: { [key: string]: number } = {};

      words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      });

      const sentenceScores = sentences.map((sentence, index) => {
        const sentenceWords = sentence.toLowerCase().split(/\s+/);
        const score = sentenceWords.reduce((sum, word) => sum + (wordFreq[word] || 0), 0);
        const positionBonus = sentences.length - index; // Favor earlier sentences
        return { sentence: sentence.trim(), score: score + positionBonus, index };
      });

      // Select top sentences
      sentenceScores.sort((a, b) => b.score - a.score);
      const selectedSentences = sentenceScores
        .slice(0, Math.min(3, sentences.length))
        .sort((a, b) => a.index - b.index)
        .map(item => item.sentence);

      const summary = selectedSentences.join('. ') + '.';
      return summary.length > maxLength ? summary.substring(0, maxLength) + '...' : summary;
    } catch (error) {
      console.error('Text summarization failed:', error);
      return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
    }
  }

  async extractKeywords(text: string, limit: number = 10): Promise<string[]> {
    try {
      const tokens = await this.tokenizeText(text);
      const wordFreq: { [key: string]: number } = {};

      // Count word frequencies, filtering out common words
      const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those']);

      tokens.forEach(token => {
        if (token.length > 2 && !stopWords.has(token)) {
          wordFreq[token] = (wordFreq[token] || 0) + 1;
        }
      });

      // Sort by frequency and return top keywords
      return Object.entries(wordFreq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([word]) => word);
    } catch (error) {
      console.error('Keyword extraction failed:', error);
      return [];
    }
  }

  // New methods needed by GenieDriveAIPreview
  async generateBasicSummary(text: string): Promise<string> {
    return this.summarizeText(text, 300);
  }

  async generateAutoTags(text: string, limit: number = 5): Promise<string[]> {
    return this.extractKeywords(text, limit);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return this.generateEmbeddings(text);
  }

  async performOCR(blob: Blob): Promise<string> {
    try {
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(blob);
      await worker.terminate();
      return text;
    } catch (error) {
      console.error('OCR failed:', error);
      throw new Error(`Failed to perform OCR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
