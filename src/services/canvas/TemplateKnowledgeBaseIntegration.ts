/**
 * Template-Knowledge Base Integration Service
 * Links Canvas templates with AI Drive and Knowledge Base for intelligent template management
 */

import { TemplateService, DocumentTemplate } from './TemplateService';
import { useKnowledgeBaseStore, KBDocument, KBFolder } from '../../store/knowledgeBaseStore';
import { AIDriveService, AIDriveFile } from '../drive/aiDriveService';
import { genieDriveKnowledgeBaseService } from '../genieDriveKnowledgeBaseService';
import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

export interface TemplateKnowledgeBaseLink {
  templateId: string;
  kbDocumentId?: string;
  aiDriveFileId?: string;
  folderId?: string;
  linkType: 'source' | 'generated' | 'reference';
  createdAt: Date;
  metadata?: {
    originalFileName?: string;
    extractedFrom?: string;
    usageContext?: string;
    profession?: string;
    industry?: string;
  };
}

export interface TemplateSmartSuggestion {
  template: DocumentTemplate;
  relevanceScore: number;
  sourceDocuments: KBDocument[];
  suggestedVariables: Record<string, string>;
  confidenceLevel: number;
  reasoning: string;
}

export class TemplateKnowledgeBaseIntegration {
  private static instance: TemplateKnowledgeBaseIntegration | null = null;
  private templateService: TemplateService;
  private aiDriveService: AIDriveService;
  private templateLinks: Map<string, TemplateKnowledgeBaseLink[]> = new Map();
  private supabase: SupabaseClient;

  static getInstance(supabase?: SupabaseClient): TemplateKnowledgeBaseIntegration {
    if (!TemplateKnowledgeBaseIntegration.instance && supabase) {
      TemplateKnowledgeBaseIntegration.instance = new TemplateKnowledgeBaseIntegration(supabase);
    }
    if (!TemplateKnowledgeBaseIntegration.instance) {
      throw new Error('TemplateKnowledgeBaseIntegration requires Supabase client for initialization');
    }
    return TemplateKnowledgeBaseIntegration.instance;
  }

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.templateService = TemplateService.getInstance();
    this.aiDriveService = new AIDriveService(supabase);
    this.loadTemplateLinkings();
  }

  /**
   * 🎯 APPROACH 1: Save Generated Documents to Knowledge Base
   * When user creates document from template, save it to KB for future reference
   */
  async saveGeneratedDocumentToKnowledgeBase(
    templateId: string,
    generatedContent: string,
    variables: Record<string, string>,
    userId: string,
    assistantId?: string
  ): Promise<{ success: boolean; kbDocumentId?: string; error?: string }> {
    try {
      const template = this.templateService.getTemplate(templateId);
      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      // Create KB document
      const kbDocument: Omit<KBDocument, 'id' | 'lastUpdated'> = {
        title: `${template.name} - ${new Date().toLocaleDateString()}`,
        content: generatedContent,
        folderId: await this.getOrCreateTemplateFolder(template.category, assistantId),
        metadata: {
          source: 'canvas_template',
          templateId: templateId,
          templateName: template.name,
          templateCategory: template.category,
          variables: variables,
          profession: template.profession,
          industry: template.industry,
          createdBy: userId,
          generatedAt: new Date().toISOString(),
          contentType: template.contentType,
          templateVersion: '1.0' // Default version since DocumentTemplate doesn't have version property
        }
      };

      // Save to Knowledge Base
      await useKnowledgeBaseStore.getState().addDocument(kbDocument);
      
      // Get the created document ID
      const documents = useKnowledgeBaseStore.getState().documents;
      const createdDoc = documents.find(doc => 
        doc.metadata?.templateId === templateId && 
        doc.metadata?.generatedAt === kbDocument.metadata.generatedAt
      );

      if (createdDoc) {
        // Link template to KB document
        await this.linkTemplateToKnowledgeBase(templateId, createdDoc.id, 'generated');
        
        return { success: true, kbDocumentId: createdDoc.id };
      }

      return { success: false, error: 'Failed to retrieve created document' };
    } catch (error) {
      console.error('Error saving generated document to KB:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 🎯 APPROACH 2: Extract Templates from AI Drive Documents
   * Analyze existing documents in AI Drive to create new templates
   */
  async extractTemplateFromAIDriveFile(
    fileId: string,
    userId: string,
    templateMetadata?: {
      name?: string;
      category?: string;
      profession?: string;
      description?: string;
    }
  ): Promise<{ success: boolean; templateId?: string; error?: string }> {
    try {
      // Get file from AI Drive
      const file = await this.aiDriveService.getFile(fileId);
      if (!file || !file.content_preview) {
        return { success: false, error: 'File not found or has no content' };
      }

      // AI-powered template extraction
      const extractedTemplate = await this.aiExtractTemplateFromContent(
        file.content_preview,
        file.name,
        templateMetadata
      );

      // Create template
      const template = await this.templateService.createTemplateFromContent(
        extractedTemplate.content,
        {
          description: templateMetadata?.description || extractedTemplate.description,
          tags: [...(extractedTemplate.tags || []), 'ai-extracted', file.ai_metadata?.document_type || 'document'],
          difficulty: extractedTemplate.difficulty || 'intermediate',
          estimatedTime: extractedTemplate.estimatedTime || 30
        },
        extractedTemplate.contentType,
        userId
      );

      // Link template to original AI Drive file
      await this.linkTemplateToAIDriveFile(template.id, fileId, 'source');

      // Also save to Knowledge Base for context
      await this.saveGeneratedDocumentToKnowledgeBase(
        template.id,
        file.content_preview,
        {},
        userId
      );

      return { success: true, templateId: template.id };
    } catch (error) {
      console.error('Error extracting template from AI Drive file:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 🎯 APPROACH 3: Smart Template Suggestions from Knowledge Base
   * Analyze KB documents to suggest relevant templates for current context
   */
  async getSmartTemplateSuggestions(
    userInput: string,
    contentType?: string,
    assistantId?: string,
    profession?: string
  ): Promise<TemplateSmartSuggestion[]> {
    try {
      const { documents, folders } = useKnowledgeBaseStore.getState();
      
      // Filter relevant documents
      let relevantDocs = documents;
      
      if (assistantId) {
        const assistantFolders = folders.filter(f => f.assistantIds.includes(assistantId));
        const folderIds = assistantFolders.map(f => f.id);
        relevantDocs = documents.filter(doc => 
          doc.folderId && folderIds.includes(doc.folderId)
        );
      }

      if (profession) {
        relevantDocs = relevantDocs.filter(doc => 
          doc.metadata?.profession === profession ||
          doc.metadata?.templateCategory === profession
        );
      }

      // Get all templates
      const templates = this.templateService.getTemplates(undefined, contentType);
      
      // AI-powered relevance scoring
      const suggestions: TemplateSmartSuggestion[] = [];
      
      for (const template of templates) {
        const relevanceScore = await this.calculateTemplateRelevance(
          template,
          userInput,
          relevantDocs,
          contentType,
          profession
        );
        
        if (relevanceScore > 0.3) { // Threshold for relevance
          const sourceDocuments = relevantDocs.filter(doc => 
            doc.metadata?.templateId === template.id ||
            this.isDocumentRelatedToTemplate(doc, template)
          );
          
          const suggestedVariables = await this.extractVariablesFromContext(
            userInput,
            template,
            sourceDocuments
          );
          
          suggestions.push({
            template,
            relevanceScore,
            sourceDocuments,
            suggestedVariables,
            confidenceLevel: relevanceScore,
            reasoning: this.generateReasoningForSuggestion(template, relevanceScore, sourceDocuments)
          });
        }
      }

      // Sort by relevance score
      return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 5);
    } catch (error) {
      console.error('Error getting smart template suggestions:', error);
      return [];
    }
  }

  /**
   * 🎯 APPROACH 4: Pull Related Documents from Knowledge Base Folders
   * When using a template, suggest related documents from KB folders
   */
  async getRelatedDocumentsForTemplate(
    templateId: string,
    assistantId?: string,
    limit: number = 10
  ): Promise<KBDocument[]> {
    try {
      const template = this.templateService.getTemplate(templateId);
      if (!template) return [];

      const { documents, folders } = useKnowledgeBaseStore.getState();
      
      // Get relevant folders
      let relevantFolders = folders;
      if (assistantId) {
        relevantFolders = folders.filter(f => f.assistantIds.includes(assistantId));
      }

      // Find documents that match template context
      const relatedDocs = documents.filter(doc => {
        // Same category or profession
        if (doc.metadata?.templateCategory === template.category ||
            doc.metadata?.profession === template.profession) {
          return true;
        }

        // Same content type
        if (doc.metadata?.contentType === template.contentType) {
          return true;
        }

        // In relevant folders
        if (doc.folderId && relevantFolders.some(f => f.id === doc.folderId)) {
          return true;
        }

        // Similar tags
        const docTags = doc.metadata?.tags || [];
        const templateTags = template.metadata?.tags || [];
        const commonTags = docTags.filter(tag => templateTags.includes(tag));
        if (commonTags.length > 0) {
          return true;
        }

        return false;
      });

      // Sort by relevance (most recent, highest AI metadata scores)
      return relatedDocs
        .sort((a, b) => {
          const scoreA = this.calculateDocumentRelevanceScore(a, template);
          const scoreB = this.calculateDocumentRelevanceScore(b, template);
          return scoreB - scoreA;
        })
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting related documents for template:', error);
      return [];
    }
  }

  /**
   * Link template to Knowledge Base document
   */
  private async linkTemplateToKnowledgeBase(
    templateId: string,
    kbDocumentId: string,
    linkType: TemplateKnowledgeBaseLink['linkType']
  ): Promise<void> {
    const link: TemplateKnowledgeBaseLink = {
      templateId,
      kbDocumentId,
      linkType,
      createdAt: new Date()
    };

    const existingLinks = this.templateLinks.get(templateId) || [];
    existingLinks.push(link);
    this.templateLinks.set(templateId, existingLinks);
    
    this.saveTemplateLinkings();
  }

  /**
   * Link template to AI Drive file
   */
  private async linkTemplateToAIDriveFile(
    templateId: string,
    aiDriveFileId: string,
    linkType: TemplateKnowledgeBaseLink['linkType']
  ): Promise<void> {
    const link: TemplateKnowledgeBaseLink = {
      templateId,
      aiDriveFileId,
      linkType,
      createdAt: new Date()
    };

    const existingLinks = this.templateLinks.get(templateId) || [];
    existingLinks.push(link);
    this.templateLinks.set(templateId, existingLinks);
    
    this.saveTemplateLinkings();
  }

  /**
   * Get or create folder for template category
   */
  private async getOrCreateTemplateFolder(
    category: string,
    assistantId?: string
  ): Promise<string> {
    const { folders, addFolder } = useKnowledgeBaseStore.getState();
    
    const folderName = `Templates: ${category.charAt(0).toUpperCase() + category.slice(1)}`;
    let folder = folders.find(f => f.name === folderName);
    
    if (!folder) {
      await addFolder({
        name: folderName,
        assistantIds: assistantId ? [assistantId] : []
      });
      
      // Get the newly created folder
      const updatedFolders = useKnowledgeBaseStore.getState().folders;
      folder = updatedFolders.find(f => f.name === folderName);
    }
    
    return folder?.id || '';
  }

  /**
   * AI-powered template extraction from content
   */
  private async aiExtractTemplateFromContent(
    content: string,
    fileName: string,
    metadata?: any
  ): Promise<{
    content: string;
    description: string;
    tags: string[];
    contentType: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime: number;
  }> {
    // This would use AI to analyze the document and extract template structure
    // For now, return a basic extraction
    return {
      content: content,
      description: `Template extracted from ${fileName}`,
      tags: ['extracted', 'ai-generated'],
      contentType: metadata?.category || 'document',
      difficulty: 'intermediate',
      estimatedTime: 30
    };
  }

  /**
   * Calculate template relevance to user input and context
   */
  private async calculateTemplateRelevance(
    template: DocumentTemplate,
    userInput: string,
    documents: KBDocument[],
    contentType?: string,
    profession?: string
  ): Promise<number> {
    let score = 0;
    
    // Content type match
    if (contentType && template.contentType === contentType) {
      score += 0.4;
    }
    
    // Profession match
    if (profession && template.profession === profession) {
      score += 0.3;
    }
    
    // Keyword matching in user input
    const userWords = userInput.toLowerCase().split(/\s+/);
    const templateText = `${template.name} ${template.description || ''} ${template.metadata?.description || ''}`.toLowerCase();
    
    const matchingWords = userWords.filter(word => templateText.includes(word));
    score += (matchingWords.length / userWords.length) * 0.2;
    
    // Usage history boost
    if (template.usageCount > 0) {
      score += Math.min(template.usageCount / 10, 0.1);
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Check if document is related to template
   */
  private isDocumentRelatedToTemplate(doc: KBDocument, template: DocumentTemplate): boolean {
    return (
      doc.metadata?.templateCategory === template.category ||
      doc.metadata?.profession === template.profession ||
      doc.metadata?.contentType === template.contentType ||
      (doc.metadata?.tags && template.metadata?.tags && 
       doc.metadata.tags.some(tag => template.metadata!.tags!.includes(tag)))
    );
  }

  /**
   * Extract variables from context documents
   */
  private async extractVariablesFromContext(
    userInput: string,
    template: DocumentTemplate,
    documents: KBDocument[]
  ): Promise<Record<string, string>> {
    const variables: Record<string, string> = {};
    
    // Extract common patterns from similar documents
    // This would use AI to analyze documents and suggest variable values
    
    return variables;
  }

  /**
   * Generate reasoning for template suggestion
   */
  private generateReasoningForSuggestion(
    template: DocumentTemplate,
    score: number,
    sourceDocuments: KBDocument[]
  ): string {
    const reasons = [];
    
    if (sourceDocuments.length > 0) {
      reasons.push(`${sourceDocuments.length} related documents found in knowledge base`);
    }
    
    if (template.usageCount > 0) {
      reasons.push(`Used ${template.usageCount} times previously`);
    }
    
    if (template.aiMetadata?.qualityScore && template.aiMetadata.qualityScore > 80) {
      reasons.push('High quality template with proven results');
    }
    
    return reasons.join(', ') || 'Matches your request criteria';
  }

  /**
   * Calculate document relevance score for template
   */
  private calculateDocumentRelevanceScore(doc: KBDocument, template: DocumentTemplate): number {
    let score = 0;
    
    // Same template ID
    if (doc.metadata?.templateId === template.id) {
      score += 100;
    }
    
    // Same category
    if (doc.metadata?.templateCategory === template.category) {
      score += 50;
    }
    
    // Recent documents get higher scores
    const daysSinceUpdate = (Date.now() - doc.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 30 - daysSinceUpdate);
    
    return score;
  }

  /**
   * Save template linkings to storage
   */
  private saveTemplateLinkings(): void {
    try {
      const linkingsArray = Array.from(this.templateLinks.entries()).map(([templateId, links]) => ({
        templateId,
        links
      }));
      localStorage.setItem('template-kb-linkings', JSON.stringify(linkingsArray));
    } catch (error) {
      console.error('Failed to save template linkings:', error);
    }
  }

  /**
   * Load template linkings from storage
   */
  private loadTemplateLinkings(): void {
    try {
      const saved = localStorage.getItem('template-kb-linkings');
      if (saved) {
        const linkingsArray = JSON.parse(saved);
        linkingsArray.forEach(({ templateId, links }: any) => {
          this.templateLinks.set(templateId, links);
        });
      }
    } catch (error) {
      console.error('Failed to load template linkings:', error);
    }
  }
}
