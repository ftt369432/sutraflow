import { v4 as uuidv4 } from 'uuid';
import { BaseAgent, AgentAction, AgentActionResult } from './BaseAgent';
import { AgentConfig, AgentType } from '../../types/agent';
import { getAIService } from '../ai/aiService';
import { agenticToolRegistry } from './ToolRegistry';
import { WorkProductShield } from './WorkProductShield';



/**
 * DocumentAgent provides AI capabilities for working with documents
 * - Analyzing document content
 * - Summarizing documents
 * - Extracting information
 * - Generating content
 */
export class DocumentAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super({
      id: config?.id || `document-agent-${uuidv4()}`,
      name: config?.name || 'Document Assistant',
      description: config?.description || 'Helps manage and process documents',
      capabilities: config?.capabilities || [
        'document-analysis',
        'drafting',
        'natural-language',
        'report-generation'
      ],
      type: AgentType.DOCUMENT,

      version: config?.version || '1.0',
      created: config?.created || new Date(),
      lastModified: config?.lastModified || new Date(),
      status: (config?.status as any) || 'active',
      preferences: config?.preferences || {}
    });
  }

  /**
   * Train the document agent on sample data
   */
  async train(data: any[]): Promise<void> {
    console.log('Training document agent with', data.length, 'samples');
  }

  /**
   * Internal implementation of action logic
   */
  protected async performAction(action: AgentAction): Promise<any> {
    const { type, params } = action;

    switch (type) {
      case 'analyze_document':
        return this.analyzeDocument(params);
      case 'summarize_document':
        return this.summarizeDocument(params);
      case 'extract_information':
        return this.extractInformation(params);
      case 'validate_document':
        // Use Agentic Tool Registry for validation
        const valResult = await agenticToolRegistry.executeTool('validate_document', params);
        if (valResult.success) return valResult.data;
        throw new Error(valResult.error);
      case 'classify_document':
        return this.classifyDocument(params);
      case 'compare_documents':
        return this.compareDocuments(params);
      case 'translate_document':
        return this.translateDocument(params);
      default:
        throw new Error(`Unknown action type: ${type} `);
    }
  }

  /**
   * Analyze a document for key insights
   */
  /**
   * Analyze a document uses AI Service to extract insights
   */
  private async analyzeDocument(params: any): Promise<any> {
    console.log('🔍 DocumentAgent: Analyzing document with AI...', params);

    const content = params.content || params.text;
    if (!content) throw new Error('No content provided for analysis');

    const aiService = await getAIService();

    // REAL EXECUTION: Call AI Service
    const prompt = `
      Analyze the following document content and provide:
1. Key themes and keywords
2. Sentiment score(0 - 1)
3. Topic distribution
4. Complexity assessment

Content:
      ${content.substring(0, 5000)}...
`;

    const analysisText = await aiService.generateText(prompt);

    // Parse result (simplified for robustness)
    return {
      rawAnalysis: analysisText,
      timestamp: new Date(),
      sourceLength: content.length
    };
  }

  /**
   * Summarize a document to extract key points
   */
  /**
   * Summarize a document using AI
   */
  private async summarizeDocument(params: any): Promise<any> {
    console.log('📝 DocumentAgent: Summarizing document...', params);

    const content = params.content || params.text;
    if (!content) throw new Error('No content provided for summarization');

    const aiService = await getAIService();

    const prompt = `
      Summarize the following document.
      Focus on: ${params.focus || 'general overview'}
Length: ${params.length || 'medium'}

Content:
      ${content.substring(0, 8000)}
`;

    const summary = await aiService.generateText(prompt);

    return {
      summary,
      length: summary.length,
      originalLength: content.length
    };
  }

  /**
   * Extract specific information from a document
   */
  private async extractInformation(params: any): Promise<any> {
    // Mock implementation
    console.log('Extracting information with params:', params);
    return {
      entities: [
        { type: 'person', name: 'John Smith', mentions: 3 },
        { type: 'organization', name: 'Acme Corp', mentions: 5 },
        { type: 'location', name: 'New York', mentions: 2 }
      ],
      dates: [
        { value: '2023-10-15', context: 'project deadline' },
        { value: '2023-09-01', context: 'contract start date' }
      ],
      metrics: [
        { value: '15%', context: 'market share increase' },
        { value: '$2.5M', context: 'projected revenue' }
      ]
    };
  }

  /**
   * Generate content based on parameters
   */
  /**
   * Generate content using AI Service or ToolRegistry
   */
  private async generateContent(params: any): Promise<any> {
    console.log('✨ DocumentAgent: Generating content...', params);

    // Check if we should use a template first (ToolRegistry)
    if (params.templateId) {
      const toolResult = await agenticToolRegistry.executeTool('generate_from_template', {
        templateId: params.templateId,
        variables: params.variables || {}
      });
      if (toolResult.success) return toolResult.data;
    }

    // Fallback to direct AI generation
    const systemPrompt = WorkProductShield.wrapPrompt(
      `Generate content for a ${params.type || 'document'} topic: ${params.topic}.
      Key points to include: ${JSON.stringify(params.keyPoints || [])}
Style: ${params.style || 'professional'} `,
      'document'
    );

    const aiService = await getAIService();
    const rawContent = await aiService.generateText(systemPrompt);
    const content = WorkProductShield.cleanse(rawContent);


    // If requested, create a real canvas
    if (params.createCanvas) {
      await agenticToolRegistry.executeTool('create_canvas_document', {
        title: params.title || 'Generated Document',
        content: content,
        metadata: { generatedBy: 'DocumentAgent', ...params }
      });
    }

    return {
      content,
      generatedAt: new Date(),
      provider: 'ai-service'
    };
  }

  /**
   * Classify a document into categories
   */
  private async classifyDocument(params: any): Promise<any> {
    // Mock implementation
    console.log('Classifying document with params:', params);
    return {
      primaryCategory: 'business',
      confidence: 0.85,
      allCategories: [
        { name: 'business', confidence: 0.85 },
        { name: 'technology', confidence: 0.72 },
        { name: 'finance', confidence: 0.45 }
      ],
      suggestedTags: ['strategy', 'planning', 'technology', 'implementation']
    };
  }

  /**
   * Compare two documents for similarities and differences
   */
  private async compareDocuments(params: any): Promise<any> {
    // Mock implementation
    console.log('Comparing documents with params:', params);
    return {
      similarityScore: 0.72,
      commonKeywords: ['strategy', 'implementation', 'analysis'],
      uniqueAspects: {
        'document1': ['budget considerations', 'timeline analysis'],
        'document2': ['risk assessment', 'stakeholder analysis']
      },
      changeHighlights: [
        { section: 'Executive Summary', changes: 'minor' },
        { section: 'Implementation Plan', changes: 'significant' }
      ]
    };
  }

  /**
   * Translate a document to another language
   */
  private async translateDocument(params: any): Promise<any> {
    // Mock implementation
    console.log('Translating document with params:', params);
    return {
      originalLanguage: params.sourceLanguage || 'English',
      targetLanguage: params.targetLanguage || 'Spanish',
      translatedContent: 'El contenido traducido aparecería aquí. Este es un marcador de posición para la traducción real.',
      confidenceScore: 0.92,
      processingTime: '3.1 seconds'
    };
  }

  /**
   * Public method to handle actions, which delegates via BaseAgent's executeAction
   */
  public async handleAction(action: AgentAction): Promise<AgentActionResult> {
    return this.executeAction(action);
  }
} 