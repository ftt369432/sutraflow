import { AIService } from '../ai/aiService';

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  content: string;
  source: 'extracted' | 'ai_generated' | 'imported' | 'manual';
  documentType: string;
  industry?: string;
  userId: string;
  assistantId: string;
  createdAt: string;
  lastUsed: string | null;
  usageCount: number;
  tags: string[];
  variables: string[];
  sections: string[];
  confidenceScore: number;
}

export interface TemplateMatch {
  template: TemplateMetadata;
  relevanceScore: number;
  source: string;
}

export interface ContentAnalysis {
  detectedDocumentType: string;
  detectedIndustry: string;
  sections: string[];
  variables: string[];
  legalCitations: string[];
  keyPhrases: string[];
  confidence: number;
}

export class TemplateStorageService {
  private aiService: AIService | null = null;

  private async getAIService(): Promise<AIService> {
    if (!this.aiService) {
      this.aiService = await AIService.getInstance();
    }
    return this.aiService;
  }

  /**
   * 📁 Save Template to AI Drive with Smart Organization
   * Integrates with your existing AI Drive structure
   */
  async saveTemplateToAIDrive(
    templateData: {
      name: string;
      description: string;
      content: string;
      source: 'extracted' | 'ai_generated' | 'imported' | 'manual';
      documentType: string;
      industry?: string;
    },
    userId: string,
    assistantId: string
  ): Promise<string> {
    
    console.log('📁 SAVING TEMPLATE to AI Drive:', templateData.name);
    
    // Create organized path structure following your AI Drive conventions
    const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Analyze content for enhanced metadata
    const analysis = await this.analyzeContentForTemplate(templateData.content);
    
    const templateMetadata: TemplateMetadata = {
      id: templateId,
      name: templateData.name,
      description: templateData.description,
      content: templateData.content,
      source: templateData.source,
      documentType: templateData.documentType || analysis.detectedDocumentType,
      industry: templateData.industry || analysis.detectedIndustry,
      userId,
      assistantId,
      createdAt: new Date().toISOString(),
      lastUsed: null,
      usageCount: 0,
      tags: this.extractTags(templateData.content),
      variables: analysis.variables,
      sections: analysis.sections,
      confidenceScore: analysis.confidence
    };
    
    try {
      // Save template to localStorage (simulating AI Drive for now)
      const storageKey = `template_${userId}_${assistantId}_${templateId}`;
      localStorage.setItem(storageKey, JSON.stringify(templateMetadata));
      
      // Update template index
      await this.updateTemplateIndex(templateMetadata);
      
      console.log(`✅ TEMPLATE SAVED: ${storageKey}`);
      return templateId;
      
    } catch (error) {
      console.error('❌ ERROR saving template to AI Drive:', error);
      throw new Error(`Failed to save template: ${error.message}`);
    }
  }

  /**
   * 🧠 Analyze Content for Template Creation
   * Uses AI to understand document structure and extract metadata
   */
  async analyzeContentForTemplate(content: string): Promise<ContentAnalysis> {
    console.log('🧠 ANALYZING CONTENT for template creation');
    
    try {
      const aiService = await this.getAIService();
      
      const analysisPrompt = `
Analyze this document content and extract template-relevant information:

CONTENT:
${content.substring(0, 2000)}...

ANALYSIS TASKS:
1. Identify document type (petition, contract, letter, report, etc.)
2. Detect industry (legal, medical, business, technical, etc.)
3. Extract document sections and their purposes
4. Identify variables that should be templated (names, dates, amounts, etc.)
5. Find legal citations or references
6. Extract key phrases that indicate document purpose

Return analysis in this JSON format:
{
  "detectedDocumentType": "string",
  "detectedIndustry": "string", 
  "sections": ["section1", "section2"],
  "variables": ["variable1", "variable2"],
  "legalCitations": ["citation1", "citation2"],
  "keyPhrases": ["phrase1", "phrase2"],
  "confidence": 0.95
}`;

      const analysisResult = await aiService.generateText(analysisPrompt);
      
      try {
        const parsed = JSON.parse(analysisResult);
        console.log('✅ CONTENT ANALYSIS complete:', parsed.detectedDocumentType);
        return parsed;
      } catch (parseError) {
        console.warn('⚠️ Failed to parse AI analysis, using fallback');
        return this.createFallbackAnalysis(content);
      }
      
    } catch (error) {
      console.error('❌ ERROR analyzing content:', error);
      return this.createFallbackAnalysis(content);
    }
  }

  /**
   * 🔍 Smart Template Search
   * Searches across all template sources with relevance scoring
   */
  async findBestTemplate(criteria: {
    documentType: string;
    industry?: string;
    keywords?: string[];
    userId: string;
    assistantId: string;
  }): Promise<TemplateMatch[]> {
    
    console.log('🔍 SEARCHING for best template match:', criteria.documentType);
    
    const matches: TemplateMatch[] = [];
    
    try {
      // Search localStorage for templates
      const userTemplatePrefix = `template_${criteria.userId}_${criteria.assistantId}_`;
      const globalTemplatePrefix = 'template_global_';
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(userTemplatePrefix) || key.startsWith(globalTemplatePrefix))) {
          try {
            const templateData = localStorage.getItem(key);
            if (templateData) {
              const template: TemplateMetadata = JSON.parse(templateData);
              
              const relevanceScore = this.calculateRelevanceScore(template, criteria);
              if (relevanceScore > 0.3) { // Minimum relevance threshold
                matches.push({
                  template,
                  relevanceScore,
                  source: this.getTemplateSource(key)
                });
              }
            }
          } catch (parseError) {
            console.warn('⚠️ Failed to parse template:', key);
          }
        }
      }
      
      // Sort by relevance score (highest first)
      const sortedMatches = matches.sort((a, b) => b.relevanceScore - a.relevanceScore);
      console.log(`✅ FOUND ${sortedMatches.length} template matches`);
      
      return sortedMatches;
      
    } catch (error) {
      console.error('❌ ERROR searching templates:', error);
      return [];
    }
  }

  /**
   * 📋 Extract Template from Current Canvas Content
   * Enhances your existing "Create Template" functionality
   */
  async extractTemplateFromCanvas(
    canvasContent: string,
    templateName: string,
    description: string,
    userId: string,
    assistantId: string
  ): Promise<string> {
    
    console.log('📋 EXTRACTING TEMPLATE from Canvas content');
    
    try {
      // 1. Analyze content for template patterns
      const analysis = await this.analyzeContentForTemplate(canvasContent);
      
      // 2. Create template with smart placeholders
      const templateContent = await this.generateSmartTemplate(canvasContent, analysis);
      
      // 3. Save to AI Drive
      const templateId = await this.saveTemplateToAIDrive({
        name: templateName,
        description,
        content: templateContent,
        source: 'extracted',
        documentType: analysis.detectedDocumentType,
        industry: analysis.detectedIndustry
      }, userId, assistantId);
      
      console.log('✅ TEMPLATE EXTRACTED and saved:', templateId);
      return templateId;
      
    } catch (error) {
      console.error('❌ ERROR extracting template from Canvas:', error);
      throw new Error(`Failed to extract template: ${error.message}`);
    }
  }

  /**
   * 🧠 Generate Smart Template with AI Enhancement
   * Uses Gemini AI to create intelligent placeholders
   */
  private async generateSmartTemplate(content: string, analysis: ContentAnalysis): Promise<string> {
    console.log('🧠 GENERATING smart template with AI placeholders');
    
    try {
      const aiService = await this.getAIService();
      
      const templatePrompt = `
Convert this document into a reusable template by identifying variable content and creating smart placeholders:

DOCUMENT:
${content}

DOCUMENT ANALYSIS:
Type: ${analysis.detectedDocumentType}
Industry: ${analysis.detectedIndustry}
Key Sections: ${analysis.sections.join(', ')}
Identified Variables: ${analysis.variables.join(', ')}

TEMPLATE CREATION RULES:
1. Replace specific names, dates, amounts with meaningful placeholders like {{applicant_name}}, {{injury_date}}, {{claim_amount}}
2. Use descriptive placeholder names that are self-explanatory
3. Identify repeatable sections and mark them as {{section_name}}
4. Keep professional language and structure intact
5. Maintain legal formatting and citations exactly as written
6. Create placeholders that match the industry standards
7. Preserve document structure and hierarchy

PLACEHOLDER FORMAT: Use {{variable_name}} format consistently

Generate the complete template:`;

      const smartTemplate = await aiService.generateText(templatePrompt);
      console.log('✅ SMART TEMPLATE generated with AI placeholders');
      
      return smartTemplate;
      
    } catch (error) {
      console.error('❌ ERROR generating smart template:', error);
      // Fallback: basic placeholder replacement
      return this.createBasicTemplate(content);
    }
  }

  /**
   * 📊 Calculate Template Relevance Score
   * Determines how well a template matches search criteria
   */
  private calculateRelevanceScore(template: TemplateMetadata, criteria: {
    documentType: string;
    industry?: string;
    keywords?: string[];
  }): number {
    
    let score = 0;
    
    // Document type match (highest weight)
    if (template.documentType.toLowerCase() === criteria.documentType.toLowerCase()) {
      score += 0.5;
    } else if (template.documentType.toLowerCase().includes(criteria.documentType.toLowerCase()) ||
               criteria.documentType.toLowerCase().includes(template.documentType.toLowerCase())) {
      score += 0.3;
    }
    
    // Industry match
    if (criteria.industry && template.industry) {
      if (template.industry.toLowerCase() === criteria.industry.toLowerCase()) {
        score += 0.3;
      } else if (template.industry.toLowerCase().includes(criteria.industry.toLowerCase())) {
        score += 0.2;
      }
    }
    
    // Keywords match
    if (criteria.keywords && criteria.keywords.length > 0) {
      const templateText = `${template.name} ${template.description} ${template.tags.join(' ')}`.toLowerCase();
      const matchedKeywords = criteria.keywords.filter(keyword => 
        templateText.includes(keyword.toLowerCase())
      );
      score += (matchedKeywords.length / criteria.keywords.length) * 0.2;
    }
    
    // Usage and confidence boost
    score += Math.min(template.usageCount * 0.01, 0.1); // Usage boost (max 0.1)
    score += template.confidenceScore * 0.1; // Confidence boost
    
    return Math.min(score, 1.0); // Cap at 1.0
  }

  // Helper methods
  private extractTags(content: string): string[] {
    const tags = [];
    
    // Extract common legal terms
    if (content.includes('petition')) tags.push('petition');
    if (content.includes('motion')) tags.push('motion');
    if (content.includes('contract')) tags.push('contract');
    if (content.includes('Labor Code')) tags.push('labor-code');
    if (content.includes('Section 5814')) tags.push('section-5814');
    if (content.includes('sanctions')) tags.push('sanctions');
    if (content.includes('penalty')) tags.push('penalty');
    
    return [...new Set(tags)]; // Remove duplicates
  }

  private createFallbackAnalysis(content: string): ContentAnalysis {
    return {
      detectedDocumentType: content.includes('petition') ? 'petition' : 'document',
      detectedIndustry: content.includes('Labor Code') || content.includes('petition') ? 'legal' : 'general',
      sections: ['header', 'body', 'conclusion'],
      variables: ['name', 'date', 'amount'],
      legalCitations: [],
      keyPhrases: [],
      confidence: 0.5
    };
  }

  private createBasicTemplate(content: string): string {
    // Basic find/replace for common patterns
    return content
      .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '{{person_name}}')
      .replace(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, '{{date}}')
      .replace(/\$[\d,]+\.?\d*/g, '{{amount}}')
      .replace(/Case No\.: [A-Z0-9]+/g, 'Case No.: {{case_number}}')
      .replace(/ADJ\d+/g, '{{adjuster_case_number}}');
  }

  private getTemplateSource(storageKey: string): string {
    if (storageKey.includes('_global_')) return 'Global Template';
    if (storageKey.includes('_extracted_')) return 'Extracted from Canvas';
    if (storageKey.includes('_ai_generated_')) return 'AI Generated';
    if (storageKey.includes('_imported_')) return 'Imported';
    return 'User Template';
  }

  private async updateTemplateIndex(template: TemplateMetadata): Promise<void> {
    // Update search index for faster future searches
    const indexKey = `template_index_${template.userId}_${template.assistantId}`;
    
    try {
      let index = [];
      try {
        const indexData = localStorage.getItem(indexKey);
        if (indexData) {
          index = JSON.parse(indexData);
        }
      } catch {
        // Index doesn't exist yet, start fresh
      }
      
      // Add or update template in index
      const existingIndex = index.findIndex((item: any) => item.id === template.id);
      const indexEntry = {
        id: template.id,
        name: template.name,
        documentType: template.documentType,
        industry: template.industry,
        tags: template.tags,
        lastUsed: template.lastUsed,
        usageCount: template.usageCount
      };
      
      if (existingIndex >= 0) {
        index[existingIndex] = indexEntry;
      } else {
        index.push(indexEntry);
      }
      
      localStorage.setItem(indexKey, JSON.stringify(index));
      console.log('✅ TEMPLATE INDEX updated');
      
    } catch (error) {
      console.warn('⚠️ Failed to update template index:', error);
      // Non-critical error, continue
    }
  }

  /**
   * 📈 Update Template Usage Statistics
   */
  async updateTemplateUsage(templateId: string, userId: string, assistantId: string): Promise<void> {
    try {
      const storageKey = `template_${userId}_${assistantId}_${templateId}`;
      const templateData = localStorage.getItem(storageKey);
      
      if (templateData) {
        const template: TemplateMetadata = JSON.parse(templateData);
        template.usageCount += 1;
        template.lastUsed = new Date().toISOString();
        
        localStorage.setItem(storageKey, JSON.stringify(template));
        await this.updateTemplateIndex(template);
        
        console.log(`📈 UPDATED template usage: ${template.name} (${template.usageCount} uses)`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to update template usage:', error);
    }
  }
}

// Export singleton instance
export const templateStorageService = new TemplateStorageService();
