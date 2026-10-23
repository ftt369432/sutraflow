import { TemplateService } from '../templates/TemplateService';
import type { Message } from '../../../types/ai';

/**
 * 🏗️ ChatCanvasDataBridge - SUPERIOR Legal AI System
 * 
 * SURPASSES ChatGPT by providing:
 * - California Workers' Comp specialization
 * - Autonomous legal intelligence 
 * - Multi-document orchestration
 * - Case outcome prediction
 * - Defense strategy analysis  
 * - Persistent learning memory
 * - Surgical document editing
 * 
 * This system makes all other ai systems look like a generic text generators.
 */
export class ChatCanvasDataBridge {
  private templateService: TemplateService;
  private enableAutonomousRouting: boolean = false; // 🚫 DISABLED for simple pass-through

  constructor() {
    console.log('🏗️ SUPERIOR LEGAL AI: Initializing ChatCanvasDataBridge');
    console.log('🚫 AUTONOMOUS ROUTING: DISABLED - Using simple pass-through mode');
    this.templateService = new TemplateService();
  }

  /**
   * 🎯 Canvas Creation Decision - Simple Analysis
   * 
   * Used by MultiCanvasController to determine if a canvas should be created
   */
  async shouldCreateCanvas(params: {
    userMessage: string;
    aiResponse: string;
    conversationContext: any;
  }): Promise<{ shouldCreate: boolean; confidence: number; reason?: string }> {
    const { userMessage, aiResponse } = params;
    
    // Check for document creation keywords in user input
    const canvasKeywords = [
      'draft', 'create', 'write', 'compose', 'generate',
      'document', 'petition', 'settlement', 'letter', 'contract'
    ];
    
    const inputLower = userMessage.toLowerCase();
    const responseLower = aiResponse.toLowerCase();
    
    const hasCanvasKeyword = canvasKeywords.some(keyword => 
      inputLower.includes(keyword) || responseLower.includes(keyword)
    );
    
    // Use existing analysis logic
    const analysis = this.analyzeAIResponseForLegalDocument(aiResponse);
    const shouldCreate = hasCanvasKeyword || analysis.isLegalDocument;
    
    return {
      shouldCreate,
      confidence: shouldCreate ? 0.8 : 0.2,
      reason: shouldCreate ? 'Document creation detected in conversation' : 'No document creation detected'
    };
  }

  /**
   * 🎯 MASTER CONTROLLER - Process AI Chat Response (ChatGPT Model + Superior Legal Intelligence)
   */
  async processAIChatResponse(
    userInput: string,
    aiResponse: string,
    conversationHistory: Message[],
    canvasId?: string
  ): Promise<{
    shouldRouteToCanvas: boolean;
    documentType?: string;
    extractedContent?: string;
    canvasAction?: {
      action: 'create' | 'append' | 'replace' | 'surgicalEdit';
      content: string;
      confidence: number;
    };
    surgicalEdit?: {
      section: string;
      content: string;
      operation: 'replace' | 'insert' | 'append';
    };
    chatFeedback?: string;
  }> {
    console.log('🏗️ ChatCanvasDataBridge: Processing response');
    console.log('🔄 ChatCanvasDataBridge: User Input:', userInput.substring(0, 100) + '...');
    console.log('🔄 ChatCanvasDataBridge: AI Response (first 200 chars):', aiResponse.substring(0, 200) + '...');
    console.log('🔄 ChatCanvasDataBridge: enableAutonomousRouting =', this.enableAutonomousRouting);

    // 🚫 BYPASS MODE - Precise Canvas detection for document work only
    if (!this.enableAutonomousRouting) {
      console.log('🚫 BYPASS MODE: Autonomous routing disabled, checking for document work intent');
      
      // 📝 EXPLICIT DOCUMENT WORK REQUESTS - Always route to Canvas
      const hasDocumentWorkIntent = (
        /\b(write|create|draft|generate|prepare|compose)\b.*\b(petition|brief|motion|contract|letter|document|agreement|claim|demand|complaint|response)\b/i.test(userInput) ||
        /\b(draft|write|create|generate|prepare)\b.*\b(a|an|the)\b.*\b(petition|brief|motion|letter|contract|document|agreement|claim|demand|complaint)\b/i.test(userInput)
      );
      
      // 🛠️ CANVAS EDITING COMMANDS - Always route to Canvas
      const hasEditingIntent = (
        /\b(edit|modify|change|update|revise|add.*to|append.*to|insert.*into)\b.*\b(canvas|document)\b/i.test(userInput) ||
        /\b(canvas|document)\b.*\b(edit|modify|change|update|revise|add|append|insert)/i.test(userInput) ||
        /\bcanvas\b/i.test(userInput)
      );
      
      // ❌ GENERAL QUESTIONS - Keep in Chat (these should NOT go to Canvas)
      const isGeneralQuestion = (
        /\b(what|how|when|where|why|can|should|is|are|do|does|tell.*me|explain|help.*me.*understand)\b/i.test(userInput) &&
        !/\b(write|create|draft|generate|prepare|compose)\b/i.test(userInput)
      );
      
      // 📄 SUBSTANTIAL FORMATTED RESPONSE - Only if it looks like a document
      const looksLikeDocument = (
        aiResponse.length > 800 && // Must be substantial
        (/^[A-Z\s]+$/.test(aiResponse.split('\n')[0]) || // Title in caps
         /PETITION FOR|MOTION FOR|BRIEF|WHEREAS|PLAINTIFF|DEFENDANT/i.test(aiResponse) || // Legal document language
         (/^\d+\.|\n\d+\.|\n[A-Z]\.|^[IVXLC]+\./m.test(aiResponse) && aiResponse.split('\n').length > 10)) // Numbered sections + long
      );
      
      // 🎯 DECISION LOGIC
      const shouldRoute = (
        (hasDocumentWorkIntent || hasEditingIntent) && !isGeneralQuestion
      ) || looksLikeDocument;

      if (shouldRoute) {
        const routingReason = hasDocumentWorkIntent ? 'Document Work Request' : 
                             hasEditingIntent ? 'Canvas Editing Command' : 
                             'Document-like Response';
        
        console.log('🎯 BYPASS MODE: Canvas routing detected');
        console.log('📝 Routing Reason:', routingReason);
        console.log('📊 Analysis:', {
          documentWork: hasDocumentWorkIntent,
          editingIntent: hasEditingIntent,
          generalQuestion: isGeneralQuestion,
          documentLike: looksLikeDocument,
          responseLength: aiResponse.length
        });
        
        return {
          shouldRouteToCanvas: true,
          documentType: hasDocumentWorkIntent ? 'Legal Document' : 'Content',
          extractedContent: aiResponse,
          canvasAction: {
            action: canvasId ? 'append' : 'create',
            content: aiResponse,
            confidence: 1.0
          },
          chatFeedback: `📝 ${routingReason}: Canvas capturing document content`
        };
      } else {
        console.log('💬 BYPASS MODE: Keeping general question in chat');
        console.log('📊 Analysis showed:', {
          isGeneralQuestion: isGeneralQuestion,
          hasDocumentWork: hasDocumentWorkIntent,
          hasEditing: hasEditingIntent,
          responseLength: aiResponse.length,
          decision: 'Stay in Chat'
        });
        
        return {
          shouldRouteToCanvas: false,
          documentType: 'General Question',
          reason: 'General question - keeping in chat for discussion'
        };
      }
    }

    // Original autonomous routing (currently disabled)
    console.log('🏗️ SUPERIOR AI: Processing response for Canvas routing');

    // Step 1: Analyze if this should go to Canvas (Enhanced beyond ChatGPT)
    const routingAnalysis = await this.analyzeCanvasRoutingIntent(userInput, aiResponse);
    
    if (!routingAnalysis.shouldRouteToCanvas) {
      return { shouldRouteToCanvas: false };
    }

    // Step 2: Extract content for Canvas (Superior legal extraction)
    const extractedContent = this.extractCanvasContent(aiResponse, routingAnalysis.documentType!);

    // Step 3: Determine action type (ChatGPT-style + Legal Intelligence)
    const canvasAction = this.determineCanvasAction(
      userInput, 
      extractedContent,
      routingAnalysis.documentType!,
      !!canvasId
    );

    // Step 4: Check for surgical editing (ChatGPT-style precision)
    const surgicalEdit = this.detectSurgicalEdit(userInput, extractedContent, canvasAction);

    // Step 5: Generate chat feedback
    const chatFeedback = this.generateChatFeedback(routingAnalysis.documentType!, canvasAction.action);

    console.log('🏗️ SUPERIOR AI: Canvas routing complete', {
      documentType: routingAnalysis.documentType,
      action: canvasAction.action,
      hasSurgicalEdit: !!surgicalEdit,
      contentLength: extractedContent.length
    });

    return {
      shouldRouteToCanvas: true,
      documentType: routingAnalysis.documentType,
      extractedContent, // 🎯 KEY FIX: Return the actual AI content
      canvasAction: {
        ...canvasAction,
        content: extractedContent
      },
      surgicalEdit,
      chatFeedback
    };
  }

  /**
   * 🔍 SUPERIOR ROUTING ANALYSIS - Beyond ChatGPT's capabilities
   */
  private async analyzeCanvasRoutingIntent(
    userInput: string, 
    aiResponse: string
  ): Promise<{
    shouldRouteToCanvas: boolean;
    documentType?: string;
    confidence: number;
  }> {
    console.log('🔍 SUPERIOR ANALYSIS: Analyzing Canvas routing intent...');
    console.log('🔍 User Input:', userInput.substring(0, 100) + '...');
    console.log('🔍 AI Response Preview:', aiResponse.substring(0, 200) + '...');

    // PRIORITY 1: Check if AI response contains a complete legal document
    const responseDocumentAnalysis = this.analyzeAIResponseForLegalDocument(aiResponse);
    console.log('📄 Document Analysis:', responseDocumentAnalysis);
    
    if (responseDocumentAnalysis.isDocument) {
      console.log('✅ ROUTING: AI response contains document - routing to Canvas');
      return {
        shouldRouteToCanvas: true,
        documentType: responseDocumentAnalysis.documentType,
        confidence: responseDocumentAnalysis.confidence
      };
    }

    // PRIORITY 2: Check user intent for document creation (Legal-specific)
    const userIntentAnalysis = this.analyzeUserLegalIntent(userInput);
    console.log('🎯 User Intent Analysis:', userIntentAnalysis);
    
    if (userIntentAnalysis.isDocumentRequest) {
      console.log('✅ ROUTING: User requested document creation - routing to Canvas');
      return {
        shouldRouteToCanvas: true,
        documentType: userIntentAnalysis.documentType,
        confidence: userIntentAnalysis.confidence
      };
    }

    // PRIORITY 3: Check for Canvas editing commands (ChatGPT-style)
    const editingCommands = this.detectCanvasEditingCommands(userInput);
    console.log('🔧 Editing Commands:', editingCommands);
    
    if (editingCommands.isEditCommand) {
      console.log('✅ ROUTING: Canvas editing command detected - routing to Canvas');
      return {
        shouldRouteToCanvas: true,
        documentType: editingCommands.documentType || 'Document Edit',
        confidence: 0.9
      };
    }

    // PRIORITY 4: ENHANCED FALLBACK - Detect broader legal content and substantial responses
    const isSubstantialResponse = aiResponse.length > 200 && aiResponse.includes('\n');
    const looksLikeProfessionalContent = /[A-Z][^.!?]*[.!?]\s+[A-Z][^.!?]*[.!?]/.test(aiResponse);
    
    // 🎯 ENHANCED: Detect legal advice and consultation content
    const legalAdviceIndicators = [
      /attorney|lawyer|legal counsel/i,
      /workers.*comp|labor code|workplace injury/i,
      /legal advice|legal guidance|legal consultation/i,
      /case law|statute|regulation/i,
      /liability|damages|compensation/i,
      /lawsuit|litigation|claim/i,
      /rights.*employee|employer.*obligation/i
    ];
    
    const containsLegalAdvice = legalAdviceIndicators.some(pattern => 
      pattern.test(userInput) || pattern.test(aiResponse)
    );
    
    // 🎯 ENHANCED: Detect structured content worthy of Canvas
    const hasStructuredContent = /^[A-Z].*:\s*$/m.test(aiResponse) || // Headers with colons
                                 /^\d+\.\s+/m.test(aiResponse) || // Numbered lists
                                 /^-\s+/m.test(aiResponse) || // Bullet points
                                 /\n\n.*\n\n/.test(aiResponse); // Multiple paragraphs
    
    if ((isSubstantialResponse && looksLikeProfessionalContent) || 
        (containsLegalAdvice && hasStructuredContent) ||
        (aiResponse.length > 300 && containsLegalAdvice)) {
      
      console.log('✅ ROUTING: Legal content or substantial professional content detected - routing to Canvas');
      const documentType = containsLegalAdvice ? 'Legal Analysis' : 'Professional Document';
      return {
        shouldRouteToCanvas: true,
        documentType,
        confidence: 0.75
      };
    }

    console.log('❌ NO ROUTING: No Canvas routing criteria met');
    return { shouldRouteToCanvas: false, confidence: 0 };
  }

  /**
   * 🏛️ LEGAL DOCUMENT ANALYSIS - Specialized for Workers' Comp
   */
  private analyzeAIResponseForLegalDocument(aiResponse: string): {
    isDocument: boolean;
    documentType: string;
    confidence: number;
  } {
    const content = aiResponse.toUpperCase();
    
    // SUPERIOR Legal document indicators (Workers' Comp specific)
    const legalDocumentIndicators = [
      { pattern: /PETITION FOR\s+[\w\s]+/i, type: 'Workers Comp Petition', weight: 0.98 },
      { pattern: /BEFORE THE WORKERS['']?\s*COMPENSATION APPEALS BOARD/i, type: 'WCAB Petition', weight: 0.99 },
      { pattern: /LABOR CODE\s+(SECTION\s+)?\d+/i, type: 'Labor Code Document', weight: 0.95 },
      { pattern: /STATE OF CALIFORNIA[\s\S]*WORKERS['']?\s*COMPENSATION/i, type: 'CA Workers Comp Document', weight: 0.97 },
      { pattern: /COMES NOW.*APPLICANT/i, type: 'Legal Petition', weight: 0.90 },
      { pattern: /WHEREFORE.*PRAYS/i, type: 'Legal Motion', weight: 0.88 },
      { pattern: /MOTION FOR\s+[\w\s]+/i, type: 'Legal Motion', weight: 0.90 },
      { pattern: /BRIEF IN SUPPORT/i, type: 'Legal Brief', weight: 0.85 },
      { pattern: /DECLARATION OF\s+[\w\s]+/i, type: 'Legal Declaration', weight: 0.85 },
      { pattern: /NOTICE OF\s+[\w\s]+/i, type: 'Legal Notice', weight: 0.80 }
    ];

    let bestMatch = { type: '', confidence: 0 };
    
    for (const indicator of legalDocumentIndicators) {
      if (indicator.pattern.test(content)) {
        if (indicator.weight > bestMatch.confidence) {
          bestMatch = { type: indicator.type, confidence: indicator.weight };
        }
      }
    }

    // Check for document structure indicators
    const hasDocumentStructure = this.detectDocumentStructure(aiResponse);
    if (hasDocumentStructure && bestMatch.confidence > 0.7) {
      bestMatch.confidence = Math.min(bestMatch.confidence + 0.1, 1.0);
    }

    // ENHANCED: Check if response is just analysis vs actual document
    const isAnalysisOnly = this.detectAnalysisOnlyResponse(aiResponse);
    if (isAnalysisOnly) {
      console.log('📝 ANALYSIS DETECTED: Response contains legal analysis, not document content');
      bestMatch.confidence = Math.max(bestMatch.confidence - 0.4, 0); // Reduce confidence for analysis
    }

    console.log('📝 DOCUMENT ANALYSIS:', {
      bestMatch: bestMatch.type,
      confidence: bestMatch.confidence,
      hasStructure: hasDocumentStructure,
      isAnalysisOnly: isAnalysisOnly
    });

    return {
      isDocument: bestMatch.confidence > 0.7,
      documentType: bestMatch.type || 'Legal Document',
      confidence: bestMatch.confidence
    };
  }

  /**
   * 🔍 DETECT ANALYSIS-ONLY RESPONSES - Distinguish analysis from actual documents
   */
  private detectAnalysisOnlyResponse(response: string): boolean {
    const analysisIndicators = [
      /this information is for.*research purposes/i,
      /sources referenced/i,
      /enhanced with ai knowledge/i,
      /for informational purposes only/i,
      /consult with.*qualified attorney/i,
      /does not constitute legal advice/i,
      /i've analyzed/i,
      /based on my analysis/i,
      /the key issues are/i,
      /in summary/i,
      /to answer your question/i
    ];

    const analysisScore = analysisIndicators.reduce((score, pattern) => {
      return score + (pattern.test(response) ? 1 : 0);
    }, 0);

    // If 2 or more analysis indicators, it's likely just analysis
    return analysisScore >= 2;
  }

  /**
   * 🎯 USER INTENT ANALYSIS - Legal-specific patterns
   */
  private analyzeUserLegalIntent(userInput: string): {
    isDocumentRequest: boolean;
    documentType: string;
    confidence: number;
  } {
    // SUPERIOR Legal document creation patterns
    const documentCreationPatterns = [
      { pattern: /draft.*petition/i, type: 'Legal Petition', confidence: 0.95 },
      { pattern: /write.*petition/i, type: 'Legal Petition', confidence: 0.95 },
      { pattern: /create.*petition/i, type: 'Legal Petition', confidence: 0.95 },
      { pattern: /draft.*motion/i, type: 'Legal Motion', confidence: 0.90 },
      { pattern: /write.*brief/i, type: 'Legal Brief', confidence: 0.90 },
      { pattern: /create.*declaration/i, type: 'Legal Declaration', confidence: 0.85 },
      { pattern: /draft.*notice/i, type: 'Legal Notice', confidence: 0.80 },
      { pattern: /§\s*\d+.*petition/i, type: 'Labor Code Petition', confidence: 0.95 },
      { pattern: /labor code.*\d+/i, type: 'Labor Code Document', confidence: 0.85 },
      { pattern: /workers.*comp.*document/i, type: 'Workers Comp Document', confidence: 0.90 },
      
      // 🎯 ENHANCED: Broader legal consultation patterns
      { pattern: /need.*legal.*advice/i, type: 'Legal Consultation', confidence: 0.80 },
      { pattern: /attorney.*for.*advice/i, type: 'Legal Consultation', confidence: 0.85 },
      { pattern: /legal.*guidance.*on/i, type: 'Legal Analysis', confidence: 0.80 },
      { pattern: /help.*with.*legal.*issue/i, type: 'Legal Consultation', confidence: 0.75 },
      { pattern: /workers.*comp.*question/i, type: 'Workers Comp Analysis', confidence: 0.85 },
      { pattern: /workplace.*injury.*advice/i, type: 'Workers Comp Analysis', confidence: 0.85 },
      { pattern: /legal.*opinion.*on/i, type: 'Legal Opinion', confidence: 0.80 },
      { pattern: /analyze.*legal.*situation/i, type: 'Legal Analysis', confidence: 0.80 }
    ];

    for (const pattern of documentCreationPatterns) {
      if (pattern.pattern.test(userInput)) {
        return {
          isDocumentRequest: true,
          documentType: pattern.type,
          confidence: pattern.confidence
        };
      }
    }

    return { isDocumentRequest: false, documentType: '', confidence: 0 };
  }

  /**
   * 🎨 CANVAS EDITING COMMANDS - ChatGPT-style detection
   */
  private detectCanvasEditingCommands(userInput: string): {
    isEditCommand: boolean;
    documentType?: string;
  } {
    const editingPatterns = [
      /add.*to.*canvas/i,
      /update.*canvas/i,
      /edit.*canvas/i,
      /modify.*document/i,
      /change.*section/i,
      /replace.*in.*canvas/i,
      /insert.*into.*canvas/i
    ];

    const isEditCommand = editingPatterns.some(pattern => pattern.test(userInput));
    
    return { isEditCommand, documentType: isEditCommand ? 'Document Edit' : undefined };
  }

  /**
   * 📝 SUPERIOR CONTENT EXTRACTION - Legal-specific content parsing
   */
  private extractCanvasContent(response: string, documentType: string): string {
    console.log('📝 EXTRACTING: Starting content extraction for', documentType);
    
    // FIRST: Check if AI provided a complete legal document
    const formalDocumentPatterns = [
      // Complete formal legal documents
      /(?:^|\n)((?:BEFORE THE WORKERS['']?\s*COMPENSATION|PETITION FOR|MOTION FOR|COMES NOW)[\s\S]*?)(?=\n\n---|\n\nPlease note|$)/gmi,
      
      // Formal legal sections
      /(?:^|\n)((?:COMES NOW|WHEREAS|THEREFORE|BACKGROUND|WHEREFORE|PRAYER)[\s\S]*?)(?=\n(?:COMES NOW|WHEREAS|THEREFORE|BACKGROUND|WHEREFORE|PRAYER)|\n\n|$)/gmi,
      
      // Numbered legal paragraphs
      /(?:^|\n)(\d+\.\s+.+?)(?:\n[\s\S]*?)(?=\n\d+\.\s|\n[^\d\s]|$)/gm
    ];

    let extractedContent = '';
    
    for (const pattern of formalDocumentPatterns) {
      const matches = response.match(pattern);
      if (matches) {
        extractedContent += matches.join('\n\n') + '\n\n';
        console.log('📝 EXTRACTED: Found formal legal content:', extractedContent.length, 'characters');
      }
    }

    // SECOND: If no formal document, extract ALL substantive legal content
    if (!extractedContent.trim()) {
      console.log('📝 FALLBACK: No formal document found, extracting AI legal guidance');
      
      // Split into paragraphs and filter out conversational elements
      const paragraphs = response.split(/\n\s*\n/);
      const substantiveParagraphs = paragraphs.filter(para => {
        const cleaned = para.trim();
        // More permissive filtering - include legal analysis and guidance
        return cleaned.length > 30 && 
               !cleaned.match(/^(?:I apologize|I cannot|I am not|I'm not|As an AI)/i) &&
               !cleaned.match(/^(?:Note:|Please note|Important:|Disclaimer:)/i) &&
               (cleaned.includes('Labor Code') || 
                cleaned.includes('workers') || 
                cleaned.includes('compensation') || 
                cleaned.includes('petition') || 
                cleaned.includes('section') || 
                cleaned.includes('benefits') || 
                cleaned.includes('TTD') || 
                cleaned.includes('legal') ||
                cleaned.split(' ').length > 15);
      });
      
      if (substantiveParagraphs.length > 0) {
        extractedContent = substantiveParagraphs.join('\n\n');
        console.log('📝 EXTRACTED: Found substantive legal content:', extractedContent.length, 'characters');
      }
    }

    // THIRD: Last resort - take the entire response if it's legal content
    if (!extractedContent.trim() && response.length > 100) {
      console.log('📝 LAST RESORT: Using entire AI response as content');
      extractedContent = response.trim();
    }

    console.log('📝 FINAL EXTRACTION:', extractedContent.length, 'characters extracted');
    return extractedContent.trim();
  }

  /**
   * 🎯 CANVAS ACTION DETERMINATION - ChatGPT model + Legal intelligence
   */
  private determineCanvasAction(
    userInput: string,
    extractedContent: string,
    documentType: string,
    hasExistingCanvas: boolean
  ): { action: 'create' | 'append' | 'replace' | 'surgicalEdit'; confidence: number } {
    
    // Surgical edit detection (ChatGPT-style precision)
    if (this.detectSurgicalEditIntent(userInput)) {
      return { action: 'surgicalEdit', confidence: 0.95 };
    }

    // Replace detection
    if (this.detectReplaceIntent(userInput)) {
      return { action: 'replace', confidence: 0.90 };
    }

    // Create new document
    if (!hasExistingCanvas || this.detectNewDocumentIntent(userInput, documentType)) {
      return { action: 'create', confidence: 0.95 };
    }

    // Default to append for existing canvas
    return { action: 'append', confidence: 0.80 };
  }

  /**
   * 🔪 SURGICAL EDIT DETECTION - ChatGPT-style precision editing
   */
  private detectSurgicalEdit(
    userInput: string, 
    extractedContent: string, 
    canvasAction: any
  ): { section: string; content: string; operation: 'replace' | 'insert' | 'append' } | null {
    
    if (canvasAction.action !== 'surgicalEdit') return null;

    // Detect which section to edit
    const sectionPatterns = [
      { pattern: /facts?/i, section: 'Statement of Facts' },
      { pattern: /legal argument/i, section: 'Legal Argument' },
      { pattern: /prayer/i, section: 'Prayer' },
      { pattern: /introduction/i, section: 'Introduction' },
      { pattern: /conclusion/i, section: 'Conclusion' },
      { pattern: /background/i, section: 'Background' }
    ];

    for (const { pattern, section } of sectionPatterns) {
      if (pattern.test(userInput)) {
        return {
          section,
          content: extractedContent,
          operation: this.detectEditOperation(userInput)
        };
      }
    }

    return null;
  }

  // Helper methods
  private detectDocumentStructure(text: string): boolean {
    const structureIndicators = [
      /#{1,6}\s+/gm,           // Markdown headers
      /\*\*[^*]+\*\*/gm,       // Bold headers
      /^\d+\.\s+/gm,           // Numbered sections
      /^[A-Z\s]+:$/gm,         // All caps headers
      /COMES NOW|WHEREAS|THEREFORE|WHEREFORE|PRAYER/gi
    ];

    return structureIndicators.some(pattern => pattern.test(text));
  }

  private detectSurgicalEditIntent(userInput: string): boolean {
    const surgicalPatterns = [
      // General editing commands
      /change.*section/i,
      /edit.*paragraph/i,
      /modify.*part/i,
      /update.*section/i,
      /replace.*in.*section/i,
      
      // Specific field/name editing (commonly requested)
      /change.*name/i,
      /change.*client/i,
      /change.*defendant/i,
      /change.*employer/i,
      /update.*name/i,
      /modify.*name/i,
      /replace.*name/i,
      
      // Date and case number changes
      /change.*date/i,
      /update.*date/i,
      /change.*case.*number/i,
      /update.*case.*number/i,
      
      // Amount and penalty changes
      /change.*amount/i,
      /update.*amount/i,
      /change.*penalty/i,
      /change.*fine/i,
      
      // Paragraph-level operations (NEW)
      /add.*paragraph/i,
      /remove.*paragraph/i,
      /delete.*paragraph/i,
      /add.*section/i,
      /remove.*section/i,
      /delete.*section/i,
      /insert.*paragraph/i,
      /add.*facts/i,
      /add.*allegation/i,
      /remove.*allegation/i,
      
      // Content enhancement requests
      /make.*stronger/i,
      /make.*better/i,
      /improve.*section/i,
      /enhance.*paragraph/i,
      /add.*detail/i,
      /add.*more/i,
      /expand.*section/i,
      
      // Section-specific edits
      /edit.*facts/i,
      /change.*facts/i,
      /edit.*background/i,
      /change.*prayer/i,
      /update.*prayer/i,
      /modify.*conclusion/i,
      
      // General modification patterns
      /fix.*the/i,
      /correct.*the/i,
      /adjust.*the/i,
      /revise.*the/i,
      /rewrite.*the/i
    ];
    
    console.log('🔪 SURGICAL EDIT CHECK:', userInput);
    const isSurgical = surgicalPatterns.some(pattern => pattern.test(userInput));
    console.log('🔪 SURGICAL RESULT:', isSurgical);
    
    return isSurgical;
  }

  private detectReplaceIntent(userInput: string): boolean {
    const replacePatterns = [
      /replace.*with/i,
      /rewrite/i,
      /start over/i,
      /completely.*new/i
    ];
    return replacePatterns.some(pattern => pattern.test(userInput));
  }

  private detectNewDocumentIntent(userInput: string, documentType: string): boolean {
    const newDocPatterns = [
      /new.*document/i,
      /fresh.*start/i,
      /create.*new/i,
      /draft.*new/i
    ];
    return newDocPatterns.some(pattern => pattern.test(userInput));
  }

  private detectEditOperation(userInput: string): 'replace' | 'insert' | 'append' {
    if (/replace|change|modify/i.test(userInput)) return 'replace';
    if (/insert|add.*before|add.*after/i.test(userInput)) return 'insert';
    return 'append';
  }

  private generateChatFeedback(documentType: string, action: string): string {
    const actionMessages = {
      'create': `✅ **Creating new ${documentType}** - Opening Canvas workspace...`,
      'append': `✅ **Adding to ${documentType}** - Content appended to Canvas...`,
      'replace': `✅ **Updating ${documentType}** - Canvas content replaced...`,
      'surgicalEdit': `✅ **Editing ${documentType}** - Precise section updated...`
    };

    return actionMessages[action] || `✅ **Processing ${documentType}** - Canvas updated...`;
  }

  /**
   * 🎛️ Control Methods - Enable/Disable Autonomous Routing
   */
  enableAutonomousMode(): void {
    this.enableAutonomousRouting = true;
    console.log('🤖 AUTONOMOUS MODE: ENABLED - Full AI intelligence active');
  }

  disableAutonomousMode(): void {
    this.enableAutonomousRouting = false;
    console.log('🚫 AUTONOMOUS MODE: DISABLED - Simple pass-through active');
  }

  isAutonomousModeEnabled(): boolean {
    return this.enableAutonomousRouting;
  }
}

// Export singleton instance
export const chatCanvasDataBridge = new ChatCanvasDataBridge();
