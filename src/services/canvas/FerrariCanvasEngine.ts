/**
 * 🏎️ Ferrari Canvas Engine
 * 
 * HIGH-PERFORMANCE, ZERO-COMPLEXITY CANVAS INTEGRATION
 * 
 * Design Principles:
 * - ONE simple flow: AI Chat → Canvas
 * - NO competing systems
 * - FAST execution (< 100ms)
 * - UNIVERSAL industry support
 * - ELEGANT code architecture
 */

export interface CanvasRequest {
  userInput: string;
  aiResponse: string;
  selectedAssistant: any;
  conversationId: string;
  forceRoute?: boolean;
}

export interface CanvasResult {
  success: boolean;
  action: 'created' | 'updated' | 'no_action';
  documentId?: string;
  content?: string;
  navigationTriggered: boolean;
  error?: string;
}

export class FerrariCanvasEngine {
  
  /**
   * 🚀 MAIN ENTRY POINT
   * Simple, fast, reliable Canvas routing
   */
  async processCanvasRequest(request: CanvasRequest): Promise<CanvasResult> {
    const startTime = Date.now();
    
    try {
      console.log('🏎️ Ferrari Canvas Engine: PROCESSING REQUEST');
      console.log('📊 Request Analysis:', {
        inputLength: request.userInput.length,
        responseLength: request.aiResponse.length,
        assistantName: request.selectedAssistant?.name,
        forceRoute: request.forceRoute
      });
      
      // STEP 1: Should we route to Canvas?
      const shouldRoute = this.shouldRouteToCanvas(request);
      
      if (!shouldRoute) {
        console.log('🏎️ Ferrari: Staying in chat - no Canvas routing needed');
        return {
          success: true,
          action: 'no_action',
          navigationTriggered: false
        };
      }
      
      // STEP 2: Create Canvas document
      const document = this.createCanvasDocument(request);
      
      // STEP 3: Success
      const executionTime = Date.now() - startTime;
      console.log(`🏎️ Ferrari Canvas Engine: SUCCESS in ${executionTime}ms`);
      
      return {
        success: true,
        action: 'created',
        documentId: document.id,
        content: document.content,
        navigationTriggered: true
      };
      
    } catch (error) {
      console.error('🏎️ Ferrari Canvas Engine: ERROR', error);
      return {
        success: false,
        action: 'no_action',
        navigationTriggered: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 🎯 ROUTING LOGIC
   * Universal document detection across all industries
   */
  private shouldRouteToCanvas(request: CanvasRequest): boolean {
    const { userInput, aiResponse, forceRoute } = request;
    
    // Force routing (legal documents, user explicit request)
    if (forceRoute) {
      console.log('🏎️ Force routing enabled');
      return true;
    }
    
    // User explicitly asks for Canvas
    const userWantsCanvas = /put.{0,10}(it|this|that).{0,10}canvas|canvas|document|template/i.test(userInput);
    if (userWantsCanvas) {
      console.log('🏎️ User explicitly requested Canvas');
      return true;
    }
    
    // Document structure detection (universal)
    const hasDocumentStructure = this.hasDocumentStructure(aiResponse);
    if (hasDocumentStructure) {
      console.log('🏎️ Document structure detected');
      return true;
    }
    
    // Industry-specific document indicators
    if (this.hasIndustryIndicators(aiResponse)) {
      console.log('🏎️ Industry-specific document detected');
      return true;
    }
    
    return false;
  }
  
  /**
   * 📋 DOCUMENT CREATION
   * Clean, fast document generation
   */
  private createCanvasDocument(request: CanvasRequest) {
    const timestamp = new Date().toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    // Determine document type and title
    const documentType = this.detectDocumentType(request.aiResponse);
    const title = this.generateTitle(documentType, request.selectedAssistant?.name, timestamp);
    
    return {
      id: `canvas-${Date.now()}`,
      title,
      content: request.aiResponse, // USE THE BEAUTIFUL AI RESPONSE DIRECTLY
      contentType: 'document',
      isActive: true,
      lastModified: new Date()
    };
  }
  
  /**
   * 🔍 UNIVERSAL DOCUMENT DETECTION
   * Works for legal, medical, engineering, any industry
   */
  private hasDocumentStructure(content: string): boolean {
    const structureIndicators = [
      // Headers and sections
      /^#{1,3}\s+/m,
      /^\*\*[A-Z][^*]+\*\*\s*$/m,
      
      // Professional document patterns
      /BEFORE THE|STATE OF|PETITION FOR|MOTION TO|BRIEF IN|TREATMENT PLAN|SPECIFICATION FOR/i,
      
      // Numbered sections
      /^\s*(I+|[0-9]+)\.\s+[A-Z]/m,
      
      // Legal/medical/technical formatting
      /WHEREFORE|COMES NOW|FINDINGS|DIAGNOSIS|TREATMENT|SPECIFICATIONS|REQUIREMENTS/i,
      
      // Document length (substantial content)
      content.length > 500
    ];
    
    return structureIndicators.some(pattern => pattern.test(content));
  }
  
  /**
   * 🏭 INDUSTRY INDICATORS
   * Detects documents across all professional industries
   */
  private hasIndustryIndicators(content: string): boolean {
    const industryPatterns = {
      legal: /PETITION|MOTION|BRIEF|LABOR CODE|WORKERS.{0,20}COMPENSATION|APPEALS BOARD/i,
      medical: /TREATMENT PLAN|DIAGNOSIS|PATIENT|CLINICAL|MEDICAL HISTORY|PRESCRIPTION/i,
      engineering: /SPECIFICATION|TECHNICAL|DESIGN|REQUIREMENTS|BLUEPRINT|CONSTRUCTION/i,
      business: /PROPOSAL|CONTRACT|AGREEMENT|STATEMENT OF WORK|PROJECT PLAN/i
    };
    
    return Object.values(industryPatterns).some(pattern => pattern.test(content));
  }
  
  /**
   * 📝 DOCUMENT TYPE DETECTION
   */
  private detectDocumentType(content: string): string {
    if (/PETITION/i.test(content)) return 'Petition';
    if (/MOTION/i.test(content)) return 'Motion';
    if (/BRIEF/i.test(content)) return 'Brief';
    if (/TREATMENT PLAN/i.test(content)) return 'Treatment Plan';
    if (/SPECIFICATION/i.test(content)) return 'Specification';
    if (/PROPOSAL/i.test(content)) return 'Proposal';
    return 'Document';
  }
  
  /**
   * 🏷️ TITLE GENERATION
   */
  private generateTitle(documentType: string, assistantName?: string, timestamp?: string): string {
    const assistant = assistantName || 'AI Assistant';
    return `${documentType} - ${assistant} - ${timestamp}`;
  }
}

// Export singleton instance
export const ferrariCanvasEngine = new FerrariCanvasEngine();
