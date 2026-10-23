import { LegalDocumentService, LegalDocument, WritingStyle } from './legalDocumentService';
import { LegalCaseService, CaseLawSearchParams } from './caseService';
import { StyleAnalysisService } from './styleAnalysisService';
import { Message } from '../../types/ai';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Service to handle Professional Elite Mode functionality
 * This integrates document management, case law search, and style mimicking
 */
export class ProfessionalModeService {
  private documentService: LegalDocumentService;
  private caseService: LegalCaseService;
  private styleService: StyleAnalysisService;
  
  constructor(_supabaseClient: SupabaseClient) {
    this.documentService = new LegalDocumentService();
    this.caseService = new LegalCaseService();
    this.styleService = new StyleAnalysisService();
  }
  
  /**
   * Get relevant context for a legal question
   * Combines documents and case law
   */
  async getContextForQuery(
    _userId: string,
    query: string,
    options?: {
      maxDocuments?: number;
      maxCases?: number;
      documentTypes?: string[];
      jurisdictions?: string[];
      courts?: string[];
      dateRange?: { start?: string; end?: string };
    }
  ): Promise<string> {
    const maxDocs = options?.maxDocuments || 3;
    const maxCases = options?.maxCases || 3;
    
    // Search user's documents
    const relevantDocs = await this.documentService.searchDocumentsByContent(
      query,
      0.6, // similarity threshold
      maxDocs
    );
    
    // Search case law
    const caseParams: CaseLawSearchParams = {
      query,
      jurisdiction: options?.jurisdictions?.[0],
      court: options?.courts?.[0],
      dateRange: options?.dateRange,
      limit: maxCases
    };
    
    const relevantCases = await this.caseService.searchCaseLaw(caseParams);
    
    // Combine into context
    let context = "";
    
    // Add document context
    if (relevantDocs.length > 0) {
      context += "### RELEVANT DOCUMENTS\n\n";
      
      relevantDocs.forEach((doc, i) => {
        context += `DOCUMENT ${i+1}: ${doc.title}\n`;
        
        // Get excerpt of the content (first 300 chars or so)
        const excerpt = doc.content.substring(0, 300) + 
          (doc.content.length > 300 ? "..." : "");
        
        context += `${excerpt}\n\n`;
      });
    }
    
    // Add case law context
    if (relevantCases.length > 0) {
      context += "### RELEVANT CASE LAW\n\n";
      
      relevantCases.forEach((caseItem, i) => {
        context += `CASE ${i+1}: ${caseItem.name} (${caseItem.citation})\n`;
        context += `Court: ${caseItem.court}\n`;
        context += `Date: ${caseItem.date}\n`;
        context += `Summary: ${caseItem.summary}\n\n`;
      });
    }
    
    return context;
  }
  
  /**
   * Extracting legal citations from a document or text
   */
  async extractCitations(text: string): Promise<string[]> {
    const citations = await this.caseService.extractCitations(text);
    return citations.map(c => c.citation_text);
  }
  
  /**
   * Generate a document based on a template and user input
   */
  async generateDocument(
    userId: string,
    templateId: string | null,
    documentType: string,
    title: string,
    instructions: string,
    styleId?: string
  ): Promise<LegalDocument> {
    let template = null;
    let styleProfile = null;
    
    // Get template if provided
    if (templateId) {
      const templates = await this.documentService.getTemplates(userId);
      template = templates.find(t => t.id === templateId);
    }
    
    // Get style profile if provided
    if (styleId) {
      const styles = await this.styleService.getWritingStyles(userId);
      styleProfile = styles.find((s: WritingStyle) => s.id === styleId) as WritingStyle | null;
    }
    
    // Build prompt for AI
    let _prompt = `Please create a ${documentType} titled "${title}".\n\n`;
    
    if (instructions) {
      _prompt += `Instructions: ${instructions}\n\n`;
    }
    
    if (template) {
      _prompt += `Use the following template as a guide:\n${template.content}\n\n`;
    }
    
    if (styleProfile) {
      const styleGuidelines = await this.styleService.generateStyleGuidelines(styleId!);
      _prompt += styleGuidelines;
    }
    
    // Here we would typically call the AI service to generate content
    // For now we'll return a placeholder document
    const document: LegalDocument = {
      title,
      content: `# ${title}\n\n[This is where the AI-generated content would go based on the template, style, and instructions provided.]`,
      document_type: documentType,
      status: 'draft',
      metadata: {
        generated: true,
        template_id: templateId,
        style_id: styleId,
        instructions
      },
      tags: ['generated']
    };
    
    // Save the document
    return await this.documentService.createDocument(document, userId);
  }
  
  /**
   * Enhance the AI assistant with professional mode context
   */
  async enhancePrompt(
    userId: string,
    message: string,
    _conversation: Message[],
    isProfessionalMode: boolean
  ): Promise<string> {
    if (!isProfessionalMode) {
      return message;
    }
    
    // Get user's writing style if they have one
    const styles = await this.styleService.getWritingStyles(userId);
    const defaultStyle = styles.length > 0 ? styles[0] : null;
    
    // Get relevant context for this message
    const context = await this.getContextForQuery(userId, message);
    
    // Build enhanced prompt
    let enhancedPrompt = "You are operating in Professional Elite Mode, which provides specialized legal assistance.\n\n";
    
    // Add relevant knowledge context
    if (context) {
      enhancedPrompt += `RELEVANT KNOWLEDGE CONTEXT:\n${context}\n\n`;
    }
    
    // Add style guidance if available
    if (defaultStyle) {
      const styleGuidelines = await this.styleService.generateStyleGuidelines(defaultStyle.id!);
      enhancedPrompt += `WRITING STYLE GUIDANCE:\n${styleGuidelines}\n\n`;
    } else {
      enhancedPrompt += "WRITING STYLE GUIDANCE:\nUse a formal, professional legal writing style.\n\n";
    }
    
    // Add capabilities description
    enhancedPrompt += `CAPABILITIES IN PROFESSIONAL MODE:
1. You can search case law and legal databases for relevant information.
2. You can draft legal documents based on templates and writing styles.
3. You can extract and validate legal citations.
4. You can summarize legal documents and provide analysis.
5. You can adapt your writing to match the user's preferred style.\n\n`;
    
    // Add original message
    enhancedPrompt += `USER QUERY:\n${message}`;
    
    return enhancedPrompt;
  }
  
  /**
   * Analyze a document to extract key information
   */
  async analyzeDocument(
    documentId: string,
    analysisType: 'summary' | 'key_points' | 'citations' | 'style' | 'all' = 'all'
  ): Promise<Record<string, any>> {
    // Get the document
    const document = await this.documentService.getDocument(documentId);
    
    // Prepare result
    const result: Record<string, any> = {
      document_id: documentId,
      title: document.title,
      type: document.document_type
    };
    
    // Extract citations
    if (analysisType === 'citations' || analysisType === 'all') {
      const citations = await this.caseService.extractCitations(document.content);
      result.citations = citations;
    }
    
    // Analyze style
    if (analysisType === 'style' || analysisType === 'all') {
      try {
        const styleAnalysis = await this.styleService.analyzeStyle(document.content);
        result.style_characteristics = styleAnalysis;
      } catch (error) {
        console.error('Error analyzing document style:', error);
        result.style_characteristics = null;
      }
    }
    
    // For summary and key points, we would use AI
    // Here we'll just return placeholders
    if (analysisType === 'summary' || analysisType === 'all') {
      result.summary = "This is a placeholder for the AI-generated summary.";
    }
    
    if (analysisType === 'key_points' || analysisType === 'all') {
      result.key_points = [
        "Placeholder for key point 1",
        "Placeholder for key point 2",
        "Placeholder for key point 3"
      ];
    }
    
    return result;
  }
  
  /**
   * Check if professional mode features should be available for this user
   */
  async isProfessionalModeAvailable(_userId: string): Promise<boolean> {
    // Here you would check if the user has the necessary
    // subscription or permissions for professional mode
    // For now, we'll assume it's available for all users
    return true;
  }
} 