import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatContext, ContentAnalysis, ContentType, AgentSpecialization, LaunchTrigger } from '../../types/canvas';
import { getAIService } from '../ai/aiService';

export class ContentDetectionService {
  private gemini: GoogleGenerativeAI;
  private launchTriggers: LaunchTrigger[];

  constructor() {
    this.gemini = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    this.launchTriggers = this.initializeLaunchTriggers();
  }

  private initializeLaunchTriggers(): LaunchTrigger[] {
    return [
      {
        patterns: [
          'write a contract', 'draft a contract', 'create a contract', 'need a contract',
          'draft agreement', 'create agreement', 'write agreement'
        ],
        contentTypes: ['legal_contract'],
        minConfidence: 0.8
      },
      {
        patterns: [
          'business plan', 'create business plan', 'write business plan', 'draft business plan',
          'startup plan', 'business proposal', 'business strategy'
        ],
        contentTypes: ['business_plan'],
        minConfidence: 0.8
      },
      {
        patterns: [
          'write a paper', 'research paper', 'academic paper', 'write essay', 'dissertation',
          'thesis', 'academic writing', 'research document'
        ],
        contentTypes: ['academic_paper'],
        minConfidence: 0.8
      },
      {
        patterns: [
          'formal letter', 'business letter', 'write letter', 'draft letter',
          'professional letter', 'official letter'
        ],
        contentTypes: ['formal_letter'],
        minConfidence: 0.8
      },
      {
        patterns: [
          'petition', 'legal petition', 'file petition', 'draft petition',
          'court petition', 'motion', 'legal motion'
        ],
        contentTypes: ['petition'],
        minConfidence: 0.8
      },
      {
        patterns: [
          'legal brief', 'brief', 'court brief', 'legal argument',
          'case brief', 'appellate brief'
        ],
        contentTypes: ['legal_brief'],
        minConfidence: 0.8
      },
      {
        patterns: [
          'technical report', 'technical document', 'report', 'analysis report',
          'technical analysis', 'engineering report'
        ],
        contentTypes: ['technical_report'],
        minConfidence: 0.8
      },
      {
        patterns: [
          'presentation', 'slide deck', 'powerpoint', 'slides',
          'pitch deck', 'presentation slides'
        ],
        contentTypes: ['presentation'],
        minConfidence: 0.8
      },
      {
        patterns: [
          'email template', 'email draft', 'compose email', 'email campaign',
          'marketing email', 'newsletter'
        ],
        contentTypes: ['email_template'],
        minConfidence: 0.8
      },
      {
        patterns: [
          'research project', 'research', 'case study', 'investigation',
          'research plan', 'study'
        ],
        contentTypes: ['research'],
        minConfidence: 0.7
      }
    ];
  }

  async analyzeUserInput(text: string, context: ChatContext): Promise<ContentAnalysis> {
    try {
      // First, check for pattern matches
      const patternMatch = this.checkPatterns(text);
      if (patternMatch) {
        return await this.enhanceWithAI(text, context, patternMatch);
      }

      // If no pattern match, use AI analysis
      return await this.performAIAnalysis(text, context);
    } catch (error) {
      console.error('Error in content detection:', error);
      return this.createDefaultAnalysis();
    }
  }

  private checkPatterns(text: string): Partial<ContentAnalysis> | null {
    const lowerText = text.toLowerCase();
    
    for (const trigger of this.launchTriggers) {
      for (const pattern of trigger.patterns) {
        if (lowerText.includes(pattern.toLowerCase())) {
          return {
            shouldOpenCanvas: true,
            contentType: trigger.contentTypes[0],
            confidence: trigger.minConfidence,
            suggestedTemplate: this.getDefaultTemplate(trigger.contentTypes[0])
          };
        }
      }
    }
    
    return null;
  }

  private async performAIAnalysis(text: string, context: ChatContext): Promise<ContentAnalysis> {
    const prompt = this.buildAnalysisPrompt(text, context);
    
    try {
      const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const fullPrompt = `You are an expert at detecting document creation intent from user messages. 
            Analyze the user's input and determine if they want to create a document and what type.
            Always respond with valid JSON only.
            
            ${prompt}`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const analysis = JSON.parse(response.text() || '{}');
      return this.validateAndEnhanceAnalysis(analysis);
    } catch (error) {
      console.error('AI analysis failed:', error);
      return this.createDefaultAnalysis();
    }
  }

  private async enhanceWithAI(
    text: string, 
    context: ChatContext, 
    baseAnalysis: Partial<ContentAnalysis>
  ): Promise<ContentAnalysis> {
    const prompt = `
      The user wants to create a ${baseAnalysis.contentType} document.
      User input: "${text}"
      Context: ${this.buildContextString(context)}
      
      Provide additional analysis including:
      1. Specific requirements extracted from the input
      2. Estimated complexity (simple/moderate/complex)
      3. Suggested AI agents that would be helpful
      4. Any specific template recommendations
      
      Return JSON with: {
        "extractedRequirements": string[],
        "estimatedComplexity": "simple" | "moderate" | "complex",
        "suggestedAgents": string[],
        "suggestedTemplate": string
      }
    `;

    try {
      const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const enhancement = JSON.parse(response.text() || '{}');
      
      return {
        shouldOpenCanvas: true,
        contentType: baseAnalysis.contentType!,
        confidence: baseAnalysis.confidence || 0.8,
        suggestedTemplate: enhancement.suggestedTemplate || baseAnalysis.suggestedTemplate!,
        extractedRequirements: enhancement.extractedRequirements || [],
        estimatedComplexity: enhancement.estimatedComplexity || 'moderate',
        suggestedAgents: this.mapStringArrayToSpecializations(enhancement.suggestedAgents || [])
      };
    } catch (error) {
      console.error('AI enhancement failed:', error);
      return {
        shouldOpenCanvas: true,
        contentType: baseAnalysis.contentType!,
        confidence: baseAnalysis.confidence || 0.8,
        suggestedTemplate: baseAnalysis.suggestedTemplate!,
        extractedRequirements: [],
        estimatedComplexity: 'moderate',
        suggestedAgents: this.getDefaultAgents(baseAnalysis.contentType!)
      };
    }
  }

  private buildAnalysisPrompt(text: string, context: ChatContext): string {
    return `
      Analyze this user input to determine if they want to create a document:
      
      User input: "${text}"
      
      Previous context: ${this.buildContextString(context)}
      
      Return JSON with:
      {
        "shouldOpenCanvas": boolean,
        "contentType": "legal_contract" | "business_plan" | "academic_paper" | "formal_letter" | "technical_report" | "presentation" | "email_template" | "custom_document" | "petition" | "legal_brief" | "research" | "contract_review" | "case_timeline",
        "confidence": number (0-1),
        "suggestedTemplate": string,
        "extractedRequirements": string[],
        "estimatedComplexity": "simple" | "moderate" | "complex",
        "suggestedAgents": string[]
      }
      
      Rules:
      - Set shouldOpenCanvas to true only if the user clearly wants to CREATE or WRITE a document
      - Confidence should be high (>0.8) for clear document creation intent
      - For ambiguous input, set shouldOpenCanvas to false
      - Extract specific requirements mentioned by the user
      - Suggest relevant AI agents (research, writing, formatting, legal_review, fact_check, citation, compliance, financial_analysis)
    `;
  }

  private buildContextString(context: ChatContext): string {
    const recentMessages = context.previousMessages
      .slice(-3)
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    return recentMessages || 'No previous context';
  }

  private validateAndEnhanceAnalysis(analysis: any): ContentAnalysis {
    return {
      shouldOpenCanvas: Boolean(analysis.shouldOpenCanvas),
      contentType: this.validateContentType(analysis.contentType),
      confidence: Math.min(Math.max(Number(analysis.confidence) || 0, 0), 1),
      suggestedTemplate: analysis.suggestedTemplate || 'basic',
      extractedRequirements: Array.isArray(analysis.extractedRequirements) 
        ? analysis.extractedRequirements 
        : [],
      estimatedComplexity: ['simple', 'moderate', 'complex'].includes(analysis.estimatedComplexity)
        ? analysis.estimatedComplexity
        : 'moderate',
      suggestedAgents: this.mapStringArrayToSpecializations(analysis.suggestedAgents || [])
    };
  }

  private validateContentType(type: any): ContentType {
    const validTypes: ContentType[] = [
      'legal_contract', 'business_plan', 'academic_paper', 'formal_letter',
      'technical_report', 'presentation', 'email_template', 'custom_document',
      'petition', 'legal_brief', 'research', 'contract_review', 'case_timeline'
    ];
    
    return validTypes.includes(type) ? type : 'custom_document';
  }

  private mapStringArrayToSpecializations(agents: string[]): AgentSpecialization[] {
    const validSpecializations: AgentSpecialization[] = [
      'research', 'writing', 'formatting', 'legal_review', 'fact_check',
      'citation', 'compliance', 'financial_analysis'
    ];
    
    return agents
      .filter(agent => validSpecializations.includes(agent as AgentSpecialization))
      .map(agent => agent as AgentSpecialization);
  }

  private getDefaultTemplate(contentType: ContentType): string {
    const templates: Record<ContentType, string> = {
      'legal_contract': 'standard_contract',
      'business_plan': 'startup_business_plan',
      'academic_paper': 'research_paper',
      'formal_letter': 'business_letter',
      'technical_report': 'technical_analysis',
      'presentation': 'business_presentation',
      'email_template': 'professional_email',
      'petition': 'legal_petition',
      'legal_brief': 'court_brief',
      'research': 'research_project',
      'contract_review': 'contract_analysis',
      'case_timeline': 'legal_timeline',
      'custom_document': 'blank_document'
    };
    
    return templates[contentType] || 'basic';
  }

  private getDefaultAgents(contentType: ContentType): AgentSpecialization[] {
    const agentMap: Record<ContentType, AgentSpecialization[]> = {
      'legal_contract': ['legal_review', 'writing', 'compliance'],
      'business_plan': ['research', 'writing', 'financial_analysis'],
      'academic_paper': ['research', 'writing', 'citation'],
      'formal_letter': ['writing', 'formatting'],
      'technical_report': ['research', 'writing', 'fact_check'],
      'presentation': ['writing', 'formatting'],
      'email_template': ['writing'],
      'petition': ['legal_review', 'writing', 'citation'],
      'legal_brief': ['legal_review', 'writing', 'citation'],
      'research': ['research', 'fact_check', 'citation'],
      'contract_review': ['legal_review', 'compliance'],
      'case_timeline': ['research', 'fact_check'],
      'custom_document': ['writing']
    };
    
    return agentMap[contentType] || ['writing'];
  }

  private createDefaultAnalysis(): ContentAnalysis {
    return {
      shouldOpenCanvas: false,
      contentType: 'custom_document',
      confidence: 0,
      suggestedTemplate: 'basic',
      extractedRequirements: [],
      estimatedComplexity: 'moderate',
      suggestedAgents: []
    };
  }

  // Public method to get launch triggers for debugging
  getLaunchTriggers(): LaunchTrigger[] {
    return this.launchTriggers;
  }

  // Method to check if a message should trigger canvas launch
  shouldLaunchCanvas(text: string): boolean {
    return this.checkPatterns(text) !== null;
  }
}

// Export singleton instance
export const contentDetectionService = new ContentDetectionService(); 