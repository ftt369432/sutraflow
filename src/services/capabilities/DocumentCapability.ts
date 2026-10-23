/**
 * Universal Document Generation Capability
 * This capability can be used by ANY AI assistant, chat, or user interaction
 * It's not tied to specific assistants or UI components
 */

import { AICapability, CapabilityResult } from './types';

export interface DocumentIntent {
  isDocument: boolean;
  contentType: string;
  profession?: string;
  confidence: number;
  suggestedTemplate?: string;
}

export interface DocumentGenerationRequest {
  userInput: string;
  context?: any;
  userPreferences?: {
    profession?: string;
    documentStyle?: 'formal' | 'casual' | 'technical';
    includeAINotes?: boolean;
  };
}

export interface DocumentGenerationResult {
  success: boolean;
  message?: string;
  documentContent?: string;
  templateUsed?: string;
  suggestedNextSteps?: string[];
  variablesDetected?: Record<string, string>;
}

/**
 * Universal Document Generation Capability
 * Can be hooked into any AI system, assistant, or chat interface
 */
export class DocumentCapability implements AICapability {
  name = 'document-generation';
  description = 'Universal document creation across all professions';
  version = '1.0.0';

  /**
   * Detect if user input contains document creation intent
   */
  async detectIntent(input: string): Promise<DocumentIntent> {
    const lower = input.toLowerCase();
    
    // Universal document creation keywords
    const documentKeywords = [
      'create', 'write', 'draft', 'document', 'generate', 'make', 'compose', 
      'prepare', 'build', 'design', 'help me write', 'help me create', 'help me draft'
    ];
    
    // Universal document types across ALL professions
    const documentTypes = {
      // Legal
      'petition': {
        keywords: ['petition', 'legal petition', 'workers comp petition'],
        profession: 'legal'
      },
      'legal-brief': {
        keywords: ['brief', 'legal brief', 'trial brief'],
        profession: 'legal'
      },
      'contract': {
        keywords: ['contract', 'agreement', 'legal agreement'],
        profession: 'legal'
      },
      
      // Medical
      'medical-record': {
        keywords: ['medical record', 'patient record', 'health record'],
        profession: 'medical'
      },
      'prescription': {
        keywords: ['prescription', 'medical prescription'],
        profession: 'medical'
      },
      
      // Business
      'business-plan': {
        keywords: ['business plan', 'strategic plan'],
        profession: 'business'
      },
      'proposal': {
        keywords: ['proposal', 'business proposal'],
        profession: 'business'
      },
      
      // Real Estate
      'listing': {
        keywords: ['listing', 'property listing', 'real estate listing'],
        profession: 'real-estate'
      },
      
      // Creative
      'manuscript': {
        keywords: ['manuscript', 'book', 'novel'],
        profession: 'creative'
      },
      'article': {
        keywords: ['article', 'blog post', 'news article'],
        profession: 'creative'
      },
      
      // Academic
      'research-paper': {
        keywords: ['research paper', 'academic paper', 'thesis'],
        profession: 'academic'
      },
      
      // Technical
      'manual': {
        keywords: ['manual', 'user manual', 'technical manual'],
        profession: 'technical'
      },
      
      // Financial
      'budget': {
        keywords: ['budget', 'financial plan'],
        profession: 'financial'
      }
    };
    
    // Check if input contains document creation intent
    const hasDocumentRequest = documentKeywords.some(keyword => lower.includes(keyword));
    
    if (!hasDocumentRequest) {
      return { 
        isDocument: false, 
        contentType: '', 
        confidence: 0 
      };
    }
    
    // Find the specific document type
    for (const [type, config] of Object.entries(documentTypes)) {
      if (config.keywords.some(keyword => lower.includes(keyword))) {
        return { 
          isDocument: true, 
          contentType: type,
          profession: config.profession,
          confidence: 0.9,
          suggestedTemplate: `${type}-template`
        };
      }
    }
    
    // Default fallback
    return { 
      isDocument: hasDocumentRequest, 
      contentType: 'document',
      confidence: 0.5
    };
  }

  /**
   * Process capability request (implements AICapability interface)
   */
  async process(request: DocumentGenerationRequest, context?: any): Promise<CapabilityResult> {
    const result = await this.generateDocument(request);
    
    // Convert DocumentGenerationResult to CapabilityResult format
    return {
      success: result.success,
      message: result.message,
      data: result.success ? {
        documentContent: result.documentContent,
        templateUsed: result.templateUsed,
        suggestedNextSteps: result.suggestedNextSteps,
        variablesDetected: result.variablesDetected
      } : undefined
    };
  }

  /**
   * Generate document content based on user request
   */
  async generateDocument(request: DocumentGenerationRequest): Promise<DocumentGenerationResult> {
    try {
      const intent = await this.detectIntent(request.userInput);
      
      if (!intent.isDocument) {
        return {
          success: false,
          message: 'No document creation intent detected'
        };
      }

      const documentContent = await this.createDocumentTemplate(
        request.userInput, 
        intent.contentType,
        intent.profession,
        request.userPreferences
      );

      return {
        success: true,
        documentContent,
        templateUsed: intent.contentType,
        suggestedNextSteps: this.getSuggestedNextSteps(intent.contentType),
        variablesDetected: this.extractVariables(documentContent)
      };

    } catch (error) {
      return {
        success: false,
        message: `Document generation failed: ${error.message}`
      };
    }
  }

  /**
   * Create profession-appropriate template
   */
  private async createDocumentTemplate(
    userRequest: string, 
    contentType: string, 
    profession?: string,
    preferences?: any
  ): Promise<string> {
    const currentDate = new Date().toLocaleDateString();
    
    // This would integrate with your existing template generation logic
    // but now it's modular and reusable across any AI system
    
    switch (contentType) {
      case 'petition':
        return this.generatePetitionTemplate(userRequest, currentDate, preferences);
      
      case 'medical-record':
        return this.generateMedicalRecordTemplate(userRequest, currentDate, preferences);
      
      case 'business-plan':
        return this.generateBusinessPlanTemplate(userRequest, currentDate, preferences);
      
      // Add all other document types...
      
      default:
        return this.generateUniversalTemplate(userRequest, contentType, currentDate, preferences);
    }
  }

  private generatePetitionTemplate(userRequest: string, currentDate: string, preferences?: any): string {
    // Your existing petition logic, but now modular
    return `BEFORE THE WORKERS' COMPENSATION APPEALS BOARD
STATE OF CALIFORNIA

Case No. [CASE_NUMBER]

[APPLICANT_NAME],                    )
                                     )    PETITION FOR PENALTIES
    Applicant,                       )    PURSUANT TO LABOR CODE
                                     )    SECTION 5814
vs.                                  )
                                     )
[EMPLOYER_NAME],                     )
                                     )
    Defendant.                       )
____________________________________)

TO THE HONORABLE WORKERS' COMPENSATION APPEALS BOARD:

NOW COMES [APPLICANT_NAME], by and through undersigned counsel, and respectfully petitions this Board for penalties pursuant to Labor Code Section 5814...

[AI NOTE: This template will be customized based on your specific case facts. Please provide case details for accurate completion.]

Drafted on: ${currentDate}
`;
  }

  private generateMedicalRecordTemplate(userRequest: string, currentDate: string, preferences?: any): string {
    return `PATIENT MEDICAL RECORD

Patient: [PATIENT_NAME]
Date of Birth: [DOB]
Medical Record Number: [MRN]
Date: ${currentDate}
Provider: [PROVIDER_NAME]

CHIEF COMPLAINT:
[CHIEF_COMPLAINT]

HISTORY OF PRESENT ILLNESS:
[HPI_DETAILS]

ASSESSMENT AND PLAN:
[ASSESSMENT]

[AI NOTE: This template follows standard medical documentation practices and can be customized for your specific medical practice.]

Provider Signature: [PROVIDER_SIGNATURE]
`;
  }

  private generateBusinessPlanTemplate(userRequest: string, currentDate: string, preferences?: any): string {
    return `BUSINESS PLAN

Company: [COMPANY_NAME]
Date: ${currentDate}
Prepared by: [AUTHOR_NAME]

EXECUTIVE SUMMARY
[EXECUTIVE_SUMMARY]

BUSINESS DESCRIPTION
[BUSINESS_DESCRIPTION]

[AI NOTE: This template provides a comprehensive business plan structure. Customize each section with your specific business details.]
`;
  }

  private generateUniversalTemplate(userRequest: string, contentType: string, currentDate: string, preferences?: any): string {
    return `PROFESSIONAL DOCUMENT

Title: [DOCUMENT_TITLE]
Author: [AUTHOR_NAME]
Date: ${currentDate}
Organization: [ORGANIZATION]

PURPOSE
${userRequest.includes('for') ? 'This document is prepared for ' + userRequest.split('for')[1].trim() : '[DOCUMENT_PURPOSE]'}

CONTENT
[MAIN_CONTENT]

[AI NOTE: This universal template can be adapted for any professional document type. Customize the sections based on your specific needs.]

Prepared by: [AUTHOR_NAME]
Title: [AUTHOR_TITLE]
Contact: [CONTACT_INFO]
`;
  }

  private getSuggestedNextSteps(contentType: string): string[] {
    const steps: Record<string, string[]> = {
      'petition': [
        'Review case facts and evidence',
        'Gather supporting documentation',
        'Schedule filing with the board',
        'Prepare for potential hearing'
      ],
      'medical-record': [
        'Review patient information for accuracy',
        'Obtain patient consent if needed',
        'File in medical records system',
        'Schedule follow-up if required'
      ],
      'business-plan': [
        'Conduct market research',
        'Develop financial projections',
        'Review with stakeholders',
        'Prepare presentation materials'
      ]
    };

    return steps[contentType] || [
      'Review document for accuracy',
      'Customize placeholder content',
      'Share with relevant parties',
      'File or distribute as needed'
    ];
  }

  private extractVariables(content: string): Record<string, string> {
    const variables: Record<string, string> = {};
    const matches = content.match(/\[([^\]]+)\]/g);
    
    if (matches) {
      matches.forEach(match => {
        const variable = match.replace(/[\[\]]/g, '');
        variables[variable] = '';
      });
    }
    
    return variables;
  }
}
