import { AIService } from './aiService';
import { DocumentType } from '../../types/documents';
import { SubscriptionTier } from '../../stores/userStore';
import { IAIProcessor, AIAnalysisOptions, AIAnalysisResult } from './IAIProcessor';
import * as pdfjs from 'pdfjs-dist';

export class AIProcessor implements IAIProcessor {
  private aiService: AIService;

  constructor(aiService: AIService) {
    this.aiService = aiService;
  }

  async processContent(
    content: string,
    fileType: DocumentType,
    tier: SubscriptionTier = 'free',
    options: AIAnalysisOptions = {}
  ): Promise<AIAnalysisResult> {
    const { progressCallback } = options;
    const processedFeatures: string[] = [];
    
    try {
      if (progressCallback) progressCallback(20);

      // Basic analysis for all tiers
      const wordCount = content.split(/\s+/).length;
      const languages = await this.detectLanguages(content);
      const readingTime = Math.ceil(wordCount / 200);
      await this.generateEmbedding(content);
      processedFeatures.push('embedding');

      if (progressCallback) progressCallback(40);

      // Initialize results
      let summary = '';
      let topics: string[] = [];
      let entities: string[] = [];
      let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
      let keyInsights: string[] = [];
      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      let containsSensitiveInfo = false;

      // Process based on tier
      switch (tier) {
        case 'enterprise':
          // Full processing with all features
          [summary, topics, entities] = await Promise.all([
            this.aiService.generateSummary(content, { detailed: true }),
            this.extractTopics(content, 15),
            this.extractEntities(content)
          ]);
          complexity = await this.analyzeComplexity(content);
          sentiment = await this.analyzeSentiment(content);
          keyInsights = await this.aiService.extractKeyInsights(content);
          containsSensitiveInfo = await this.aiService.detectSensitiveInfo(content);
          processedFeatures.push(
            'detailed_summary',
            'extended_topics',
            'entities',
            'complexity',
            'sentiment',
            'key_insights',
            'sensitive_info'
          );
          break;

        case 'pro':
          // Professional processing
          [summary, topics, entities] = await Promise.all([
            this.aiService.generateSummary(content, { detailed: true }),
            this.extractTopics(content, 10),
            this.extractEntities(content)
          ]);
          complexity = await this.analyzeComplexity(content);
          keyInsights = await this.aiService.extractKeyInsights(content);
          processedFeatures.push(
            'detailed_summary',
            'topics',
            'entities',
            'complexity',
            'key_insights'
          );
          break;

        case 'free-business':
          // Standard processing
          [summary, topics] = await Promise.all([
            this.aiService.generateSummary(content),
            this.extractTopics(content, 5)
          ]);
          complexity = await this.analyzeComplexity(content);
          const autoTags = await this.generateAutoTags(content, fileType);
          processedFeatures.push('summary', 'topics', 'complexity', 'auto_tags');
          break;

        case 'free':
        default:
          // Basic processing with limitations
          summary = await this.aiService.generateSummary(content.substring(0, 5000));
          topics = await this.extractTopics(content.substring(0, 5000), 3);
          const autoTagsFree = await this.generateAutoTags(content.substring(0, 5000), fileType);
          processedFeatures.push('basic_summary', 'limited_topics', 'basic_auto_tags');
          break;
      }

      if (progressCallback) progressCallback(80);

      // Calculate confidence score
      const confidence = this.calculateConfidenceScore(content, processedFeatures);

      if (progressCallback) progressCallback(100);

      return {
        summary,
        topics,
        entities,
        sentiment,
        complexity,
        keyInsights,
        containsSensitiveInfo,
        languages,
        wordCount,
        readingTime,
        confidence,
        processedFeatures
      };

    } catch (error) {
      console.error('Error in processContent:', error);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return this.aiService.generateEmbeddings(text);
  }

  async extractContent(file: File): Promise<{ text: string; preview: string }> {
    console.log('Extracting content from:', file.name, file.type);
    let text = '';
    let preview = '';

    try {
      if (file.type.startsWith('text/') || file.type === 'application/json' || file.name.endsWith('.md')) {
        text = await file.text();
        preview = text.substring(0, 500);
      } else if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map(item => (item as any).str).join(' ');
        }
        text = fullText;
        preview = text.substring(0, 500);
      } else {
        preview = `Preview for ${file.type} is not yet supported.`;
        text = `Content extraction for ${file.type} is not yet supported.`;
      }
    } catch (e) {
      console.error('Error in extractContent:', e);
      text = `Error extracting content from ${file.name}.`;
      preview = `Error generating preview for ${file.name}.`;
    }
    return { text, preview };
  }

  async performOcr(file: File): Promise<string | null> {
    // Convert file to base64 for OCR
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    return this.aiService.performOCR(base64, file.type);
  }

  async answerQuestion(content: string, question: string): Promise<string> {
    return this.aiService.answerQuestion(question, content);
  }

  private async detectLanguages(text: string): Promise<string[]> {
    return this.aiService.detectLanguages(text);
  }

  private async extractTopics(text: string, count: number): Promise<string[]> {
    return this.aiService.extractTopics(text, count);
  }

  private async extractEntities(text: string): Promise<string[]> {
    return this.aiService.extractEntities(text);
  }

  private async analyzeComplexity(text: string): Promise<'simple' | 'moderate' | 'complex'> {
    const score = await this.aiService.analyzeComplexity(text);
    if (score < 0.33) return 'simple';
    if (score < 0.66) return 'moderate';
    return 'complex';
  }

  private async analyzeSentiment(text: string): Promise<'positive' | 'negative' | 'neutral'> {
    return this.aiService.analyzeSentiment(text);
  }

  private async generateAutoTags(content: string, fileType: DocumentType): Promise<string[]> {
    return this.aiService.generateTags(content);
  }

  private calculateConfidenceScore(text: string, features: string[]): number {
    // Calculate confidence based on:
    // 1. Text length and quality
    // 2. Number of processed features
    // 3. Success of feature processing
    const textScore = Math.min(text.length / 1000, 1) * 0.4;
    const featureScore = (features.length / 10) * 0.6;
    return Math.round((textScore + featureScore) * 100) / 100;
  }
}
