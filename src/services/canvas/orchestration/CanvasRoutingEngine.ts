/**
 * Canvas Routing Engine
 * 
 * Intelligent routing decisions for Canvas operations.
 * Determines when and how to route content to Canvas.
 */

import { DocumentContext } from './CanvasOrchestrator';
import { getConversationState } from './ConversationState';

export interface EditingInstruction {
  type: 'add_section' | 'modify_section' | 'replace_content' | 'add_argument' | 'change_name';
  target: string;
  content: string;
  searchPattern?: string;
  replacement?: string;
}

export interface RoutingDecision {
  shouldRoute: boolean;
  action: 'create' | 'edit' | 'none';
  confidence: number;
  reason: string;
  editInstruction?: EditingInstruction;
}

export interface DocumentAnalysis {
  type: string;
  title: string;
  profession: string;
  isDocument: boolean;
  confidence: number;
  indicators: string[];
}

export class CanvasRoutingEngine {
  
  /**
   * Main routing decision logic
   */
  shouldRouteToCanvas(
    userInput: string,
    aiResponse: string,
    documentAnalysis: DocumentAnalysis,
    activeContext: DocumentContext | null,
    conversationId?: string
  ): RoutingDecision {
    
    console.log('🎯 CanvasRoutingEngine: Analyzing routing decision', {
      userInputLength: userInput.length,
      responseLength: aiResponse.length,
      hasActiveContext: !!activeContext,
      conversationId,
      documentAnalysis
    });

    // Priority 0.5: Check conversation state for continued editing
    if (conversationId) {
      const conversationState = getConversationState();
      const shouldContinueEditing = conversationState.shouldContinueEditing(conversationId);
      const isContinuationRequest = conversationState.isContinuationRequest(userInput);
      
      if (shouldContinueEditing && isContinuationRequest) {
        const activeDocumentId = conversationState.getActiveDocument(conversationId);
        console.log('🔒 PRIORITY 0.5: Conversation state indicates continued editing', {
          activeDocumentId,
          userInput: userInput.substring(0, 100),
          isContinuationRequest
        });

        // Determine surgical edit instruction for the continuation
        const surgicalEdit = this.determineSurgicalEditInstruction(userInput, aiResponse, documentAnalysis);
        
        return {
          shouldRoute: true,
          action: 'edit',
          confidence: 0.95,
          reason: `Conversation locked to document ${activeDocumentId} - continuing surgical edits`,
          editInstruction: surgicalEdit
        };
      }
    }

    // Priority 1: Check if user is explicitly requesting document editing
    const editingIntent = this.detectEditingIntent(userInput, activeContext, conversationId);
    if (editingIntent.isEditing) {
      console.log('✅ ROUTING TO EDIT:', editingIntent.intent);
      return {
        shouldRoute: true,
        action: 'edit',
        confidence: editingIntent.confidence,
        reason: `Detected editing intent: ${editingIntent.intent}`,
        editInstruction: editingIntent.instruction
      };
    }

    // Priority 1.5: CRITICAL FIX - Check for existing documents in conversation
    // If we have existing documents and this is a similar document type, prefer editing
    const conversationContext = this.checkConversationContext(userInput, documentAnalysis, conversationId);
    if (conversationContext.hasExistingDocuments && conversationContext.shouldEdit) {
      console.log('🔄 ROUTING TO EDIT EXISTING DOCUMENT IN CONVERSATION');
      
      // Determine the most surgical edit instruction based on the content
      const surgicalEdit = this.determineSurgicalEditInstruction(userInput, aiResponse, documentAnalysis);
      
      return {
        shouldRoute: true,
        action: 'edit',
        confidence: 0.85,
        reason: `Found existing ${conversationContext.documentType} in conversation - applying surgical edit: ${surgicalEdit.type}`,
        editInstruction: surgicalEdit
      };
    }

    // Priority 2: Check if AI response contains a complete document
    const documentCreationIntent = this.detectDocumentCreation(aiResponse, documentAnalysis);
    if (documentCreationIntent.isDocument) {
      return {
        shouldRoute: true,
        action: 'create',
        confidence: documentCreationIntent.confidence,
        reason: `Detected document creation: ${documentCreationIntent.type}`
      };
    }

    // Priority 3: Check if user is asking for document creation
    const creationIntent = this.detectCreationIntent(userInput);
    if (creationIntent.isCreating && documentAnalysis.isDocument) {
      return {
        shouldRoute: true,
        action: 'create',
        confidence: creationIntent.confidence,
        reason: `User requested document creation: ${creationIntent.documentType}`
      };
    }

    return {
      shouldRoute: false,
      action: 'none',
      confidence: 0,
      reason: 'No Canvas routing conditions met'
    };
  }

  /**
   * Detects if user is requesting document editing
   */
  private detectEditingIntent(
    userInput: string, 
    activeContext: DocumentContext | null,
    conversationId?: string
  ): {
    isEditing: boolean;
    confidence: number;
    intent: string;
    instruction?: any;
  } {
    const input = userInput.toLowerCase();

    // Strong editing indicators - these clearly indicate surgical edits
    const strongEditingKeywords = [
      'add that detail', 'add that to the petition', 'add that argument',
      'change the name to', 'chang the name to', 'modify the petition', 'edit the document',
      'update the petition', 'amend the petition', 'revise the document',
      'add that', 'include that', 'put that in', 'insert that',
      'change name to', 'chang name to', 'update name to', 'modify name to'
    ];

    // Medium editing indicators with contextual phrases
    const mediumEditingKeywords = [
      'add to the', 'change in the', 'modify the', 'edit the', 'update the',
      'amend the', 'revise the', 'insert into', 'include in', 'append to'
    ];

    // Surgical editing phrases (highest priority - these always mean edit existing)
    const surgicalEditKeywords = [
      'add that detail', 'add that to the', 'add that argument to',
      'include that in the', 'put that in the document', 'insert that into',
      'append that to', 'change that to', 'modify that section',
      'add applicant name', 'add employer name', 'add the name', 'add name',
      'the applicant is', 'the employer is', 'applicant name is', 'employer name is',
      'change applicant to', 'change employer to', 'update applicant', 'update employer',
      'add that information', 'put that information', 'include that information',
      'chang the name to', 'change the name to', 'update the name to', 'modify the name to',
      'change name to', 'chang name to', 'update name to', 'modify name to'
    ];

    console.log('🔍 Editing Intent Analysis:', {
      userInput: input.substring(0, 100),
      hasActiveContext: !!activeContext,
      activeContextId: activeContext?.id
    });

    // Surgical editing intent (99% confidence) - ONLY when there's an active document to edit
    for (const keyword of surgicalEditKeywords) {
      if (input.includes(keyword)) {
        console.log('🎯 SURGICAL EDIT DETECTED:', keyword);
        
        // 🔒 CRITICAL FIX: Only treat as surgical edit if there's an active document context
        if (activeContext && activeContext.content && activeContext.content.length > 50) {
          console.log('✅ SURGICAL EDIT CONFIRMED: Active document exists, proceeding with edit');
          return {
            isEditing: true,
            confidence: 0.99,
            intent: `surgical_edit: ${keyword}`,
            instruction: this.parseEditingInstruction(userInput, keyword)
          };
        } else {
          console.log('🚫 SURGICAL EDIT REJECTED: No active document context, treating as new document creation');
          // Fall through to document creation logic
        }
      }
    }

    // Strong editing intent (95% confidence) - Only when context suggests editing
    for (const keyword of strongEditingKeywords) {
      if (input.includes(keyword)) {
        console.log('🎯 STRONG EDIT DETECTED:', keyword, 'Active context:', !!activeContext);
        
        // 🔒 IMPROVED: Require active context for strong edit keywords too
        if (activeContext && activeContext.content) {
          console.log('✅ STRONG EDIT CONFIRMED: Active document exists');
          return {
            isEditing: true,
            confidence: 0.95,
            intent: keyword,
            instruction: this.parseEditingInstruction(userInput, keyword)
          };
        } else {
          console.log('🚫 STRONG EDIT REJECTED: No active document, treating as new creation');
          // Fall through to document creation
        }
      }
    }

    // Medium editing intent (70% confidence) - require context for ambiguous cases
    for (const keyword of mediumEditingKeywords) {
      if (input.includes(keyword)) {
        console.log('🎯 MEDIUM EDIT DETECTED:', keyword, 'Active context:', !!activeContext);
        return {
          isEditing: activeContext !== null,
          confidence: 0.70,
          intent: keyword,
          instruction: this.parseEditingInstruction(userInput, keyword)
        };
      }
    }

    return {
      isEditing: false,
      confidence: 0,
      intent: 'none'
    };
  }

  /**
   * Detects if AI response contains a complete document
   */
  private detectDocumentCreation(aiResponse: string, documentAnalysis: DocumentAnalysis): {
    isDocument: boolean;
    confidence: number;
    type: string;
  } {
    // Strong document indicators
    const strongIndicators = [
      'PETITION FOR',
      'MOTION TO',
      'BRIEF IN SUPPORT',
      'BEFORE THE WORKERS\' COMPENSATION APPEALS BOARD',
      'STATE OF CALIFORNIA',
      'COMES NOW',
      'WHEREFORE',
      'Respectfully submitted',
      'Case Number:',
      'Case Name:',
      'FINDINGS OF FACT',
      'ORDER TO',
      'NOTICE OF'
    ];

    // Business document indicators
    const businessIndicators = [
      'BUSINESS PROPOSAL',
      'PROJECT PROPOSAL',
      'STATEMENT OF WORK',
      'CONTRACT AGREEMENT',
      'MEMORANDUM OF UNDERSTANDING',
      'EXECUTIVE SUMMARY'
    ];

    // Medical document indicators
    const medicalIndicators = [
      'MEDICAL REPORT',
      'TREATMENT PLAN',
      'PATIENT SUMMARY',
      'CLINICAL NOTES',
      'DISCHARGE SUMMARY'
    ];

    const allIndicators = [...strongIndicators, ...businessIndicators, ...medicalIndicators];
    const foundIndicators = allIndicators.filter(indicator => 
      aiResponse.toUpperCase().includes(indicator.toUpperCase())
    );

    // Check document structure
    const hasDocumentStructure = this.hasDocumentStructure(aiResponse);
    const isSubstantialLength = aiResponse.length > 800;

    // High confidence if multiple indicators + structure + length
    if (foundIndicators.length >= 2 && hasDocumentStructure && isSubstantialLength) {
      return {
        isDocument: true,
        confidence: 0.95,
        type: this.determineDocumentType(foundIndicators)
      };
    }

    // Medium confidence if indicators + length OR structure + length
    if ((foundIndicators.length >= 1 && isSubstantialLength) || 
        (hasDocumentStructure && isSubstantialLength)) {
      return {
        isDocument: true,
        confidence: 0.75,
        type: this.determineDocumentType(foundIndicators)
      };
    }

    // Use document analysis as fallback
    if (documentAnalysis.isDocument && documentAnalysis.confidence > 0.7) {
      return {
        isDocument: true,
        confidence: documentAnalysis.confidence,
        type: documentAnalysis.type
      };
    }

    return {
      isDocument: false,
      confidence: 0,
      type: 'none'
    };
  }

  /**
   * Detects if user is requesting document creation
   */
  private detectCreationIntent(userInput: string): {
    isCreating: boolean;
    confidence: number;
    documentType: string;
  } {
    const input = userInput.toLowerCase();

    // Strong creation indicators
    const strongCreationKeywords = [
      'draft a', 'create a', 'generate a', 'write a', 'prepare a',
      'draft the', 'create the', 'generate the', 'write the', 'prepare the'
    ];

    // Document type indicators
    const documentTypes = [
      'petition', 'motion', 'brief', 'contract', 'agreement',
      'proposal', 'report', 'letter', 'memo', 'document',
      'pleading', 'filing', 'application', 'form'
    ];

    // Check for strong creation intent
    for (const keyword of strongCreationKeywords) {
      if (input.includes(keyword)) {
        // Find document type
        const documentType = documentTypes.find(type => input.includes(type));
        return {
          isCreating: true,
          confidence: 0.90,
          documentType: documentType || 'document'
        };
      }
    }

    // Check for implicit creation (document type without explicit creation verb)
    const documentType = documentTypes.find(type => input.includes(type));
    if (documentType && input.includes('for')) {
      return {
        isCreating: true,
        confidence: 0.70,
        documentType
      };
    }

    return {
      isCreating: false,
      confidence: 0,
      documentType: 'none'
    };
  }

  /**
   * Checks if content has document structure
   */
  private hasDocumentStructure(content: string): boolean {
    const structureIndicators = [
      /\*\*[IVX]+\./,  // Roman numeral sections
      /\*\*\d+\./,     // Numbered sections
      /\n[A-Z]\./,     // Letter subsections
      /\n\d+\./,       // Numbered subsections
      /Dated:/,        // Signature line
      /Signature:/,    // Signature line
      /\n\n.*:\n/      // Section headers with colons
    ];

    return structureIndicators.some(pattern => pattern.test(content));
  }

  /**
   * Determines document type from indicators
   */
  private determineDocumentType(indicators: string[]): string {
    const typeMap: { [key: string]: string[] } = {
      'petition': ['PETITION FOR', 'WCAB', 'WORKERS\' COMPENSATION'],
      'motion': ['MOTION TO', 'BRIEF IN SUPPORT'],
      'proposal': ['PROPOSAL', 'STATEMENT OF WORK'],
      'contract': ['CONTRACT', 'AGREEMENT'],
      'report': ['REPORT', 'SUMMARY', 'FINDINGS'],
      'notice': ['NOTICE OF', 'ORDER TO']
    };

    for (const [type, keywords] of Object.entries(typeMap)) {
      if (keywords.some(keyword => 
        indicators.some(indicator => indicator.includes(keyword))
      )) {
        return type;
      }
    }

    return 'document';
  }

  /**
   * Parses editing instruction from user input
   */
  private parseEditingInstruction(userInput: string, intent: string): any {
    const input = userInput.toLowerCase();

    // Enhanced surgical editing patterns for specific field updates
    if (input.includes('add applicant name') || input.includes('applicant name is') || input.includes('the applicant is')) {
      // Extract the name from the input
      const nameMatch = userInput.match(/(?:add applicant name|applicant name is|the applicant is)\s+([A-Za-z\s]+)/i);
      const extractedName = nameMatch ? nameMatch[1].trim() : userInput;
      
      return {
        type: 'change_name',
        target: 'applicant_name',
        content: extractedName,
        searchPattern: '**Applicant:**',
        replacement: `**Applicant:** ${extractedName}`
      };
    }

    if (input.includes('add employer name') || input.includes('employer name is') || input.includes('the employer is')) {
      // Extract the employer name from the input
      const nameMatch = userInput.match(/(?:add employer name|employer name is|the employer is)\s+([A-Za-z\s]+)/i);
      const extractedName = nameMatch ? nameMatch[1].trim() : userInput;
      
      return {
        type: 'change_name',
        target: 'employer_name',
        content: extractedName,
        searchPattern: '**Employer:**',
        replacement: `**Employer:** ${extractedName}`
      };
    }

    // General name changes (including "change the name to" and "chang the name to")
    if (intent.includes('name') || input.includes('chang the name to') || input.includes('change the name to')) {
      // Extract the new name from various patterns
      let extractedName = '';
      
      if (input.includes('chang the name to') || input.includes('change the name to')) {
        const nameMatch = userInput.match(/chang?e?\s+the\s+name\s+to\s+([A-Za-z\s,]+?)(?:,|\s*$)/i);
        extractedName = nameMatch ? nameMatch[1].trim() : userInput;
      } else {
        extractedName = userInput.replace(/.*name.*?is\s+/i, '').trim();
      }
      
      // Check if this is about employer vs applicant
      if (input.includes('employer')) {
        return {
          type: 'change_name',
          target: 'employer_name', 
          content: extractedName,
          searchPattern: '**Employer:**',
          replacement: `**Employer:** ${extractedName}`
        };
      } else {
        return {
          type: 'change_name',
          target: 'applicant_name',
          content: extractedName,
          searchPattern: '**Applicant:**',
          replacement: `**Applicant:** ${extractedName}`
        };
      }
    }

    if (intent.includes('add') && (input.includes('argument') || input.includes('detail'))) {
      return {
        type: 'add_argument',
        target: 'arguments_section',
        content: userInput
      };
    }

    if (intent.includes('modify') || intent.includes('change')) {
      return {
        type: 'modify_section',
        target: 'content',
        content: userInput
      };
    }

    // Default editing instruction
    return {
      type: 'add_section',
      target: 'end',
      content: userInput
    };
  }

  /**
   * Checks conversation context for existing documents that should be edited instead of creating new ones
   */
  private checkConversationContext(
    userInput: string, 
    documentAnalysis: DocumentAnalysis, 
    conversationId?: string
  ): { hasExistingDocuments: boolean; shouldEdit: boolean; documentType: string } {
    if (!conversationId) {
      return { hasExistingDocuments: false, shouldEdit: false, documentType: 'unknown' };
    }

    // Import conversation document store
    let conversationDocuments: any[] = [];
    try {
      // Access the conversation document store
      if (typeof window !== 'undefined' && (window as any).conversationDocumentStore) {
        const documentStore = (window as any).conversationDocumentStore;
        conversationDocuments = documentStore.getDocuments(conversationId) || [];
        console.log('🔍 Conversation Context Check:', {
          conversationId,
          existingDocuments: conversationDocuments.length,
          documents: conversationDocuments.map(doc => ({ 
            id: doc.id, 
            title: doc.title?.substring(0, 50) + '...', 
            type: doc.type 
          }))
        });
      }
    } catch (error) {
      console.warn('Could not access conversation document store:', error);
    }

    const hasExistingDocuments = conversationDocuments.length > 0;
    
    if (!hasExistingDocuments) {
      return { hasExistingDocuments: false, shouldEdit: false, documentType: 'none' };
    }

    // Determine if we should edit existing documents based on context
    const documentType = documentAnalysis.type || 'document';
    
    // CRITICAL FIX: More aggressive editing detection for natural language
    const shouldEdit = (
      // Document types match
      conversationDocuments.some(doc => doc.type === documentType) ||
      // User is continuing a conversation about the same topic
      userInput.toLowerCase().includes('update') ||
      userInput.toLowerCase().includes('revise') ||
      userInput.toLowerCase().includes('change') ||
      userInput.toLowerCase().includes('modify') ||
      userInput.toLowerCase().includes('fix') ||
      userInput.toLowerCase().includes('correct') ||
      userInput.toLowerCase().includes('add') ||
      userInput.toLowerCase().includes('include') ||
      // NEW: Natural conversation continuation indicators
      userInput.toLowerCase().includes('assist') ||
      userInput.toLowerCase().includes('help') ||
      userInput.toLowerCase().includes('information') ||
      userInput.toLowerCase().includes('regarding') ||
      userInput.toLowerCase().includes('about') ||
      // NEW: Similar document content being discussed (default to editing if docs exist)
      (documentAnalysis.isDocument && conversationDocuments.length > 0) ||
      // NEW: Same document type - strongly prefer editing over creating
      conversationDocuments.some(doc => 
        doc.type === documentType || 
        (documentType.includes('petition') && doc.type?.includes('petition')) ||
        (documentType.includes('motion') && doc.type?.includes('motion'))
      )
    );

    console.log('📋 Conversation Context Analysis:', {
      hasExistingDocuments,
      shouldEdit,
      documentType,
      userInput: userInput.substring(0, 100) + '...',
      reasoning: shouldEdit ? 'Edit existing document' : 'Create new document'
    });

    return { hasExistingDocuments, shouldEdit, documentType };
  }

  /**
   * Determines the most surgical edit instruction based on content analysis
   */
  private determineSurgicalEditInstruction(
    userInput: string, 
    aiResponse: string, 
    documentAnalysis: DocumentAnalysis
  ): EditingInstruction {
    const input = userInput.toLowerCase();
    const response = aiResponse.toLowerCase();

    console.log('🔍 Determining surgical edit for:', {
      userInput: userInput.substring(0, 200),
      responseLength: aiResponse.length,
      documentType: documentAnalysis.type,
      hasHelpKeywords: /assist|help|information|regarding|about/.test(userInput.toLowerCase())
    });

    // NEW: Check for natural conversation continuation (most common pattern)
    if (input.includes('assist') || input.includes('help') || input.includes('information') || 
        input.includes('regarding') || input.includes('about')) {
      console.log('🔄 Detected natural conversation continuation - adding content');
      return {
        type: 'add_section',
        target: 'content',
        content: this.extractMainContent(aiResponse)
      };
    }

    // Check if user is asking to add/update specific information
    if (input.includes('add') || input.includes('include') || input.includes('insert')) {
      // Look for specific sections being added
      if (input.includes('name') || input.includes('applicant') || input.includes('client')) {
        return {
          type: 'change_name',
          target: 'applicant_field',
          content: this.extractSpecificField(aiResponse, 'applicant')
        };
      }
      
      // Adding new sections or content
      return {
        type: 'add_section',
        target: 'end',
        content: this.extractNewContent(aiResponse)
      };
    }

    // Check for field updates (name, date, case number)
    if (input.includes('change') || input.includes('update') || input.includes('correct')) {
      if (input.includes('name') || input.includes('applicant') || response.includes('applicant:')) {
        return {
          type: 'change_name',
          target: 'applicant_field',
          content: this.extractSpecificField(aiResponse, 'applicant'),
          searchPattern: '**Applicant:**',
          replacement: this.extractApplicantReplacement(aiResponse)
        };
      }
      
      if (input.includes('case') || input.includes('number') || response.includes('case number:')) {
        return {
          type: 'modify_section',
          target: 'case_info',
          content: this.extractSpecificField(aiResponse, 'case')
        };
      }
    }

    // If response contains mostly field updates rather than full document
    if (this.isFieldUpdateResponse(aiResponse)) {
      return {
        type: 'modify_section',
        target: 'fields',
        content: this.extractFieldUpdates(aiResponse)
      };
    }

    // Default: treat as content addition rather than replacement
    return {
      type: 'add_section',
      target: 'content',
      content: this.extractMainContent(aiResponse)
    };
  }

  /**
   * Extracts specific field value from AI response
   */
  private extractSpecificField(response: string, fieldType: 'applicant' | 'case' | 'defendant'): string {
    const lines = response.split('\n');
    
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (fieldType === 'applicant' && (lower.includes('applicant:') || lower.includes('**applicant:**'))) {
        return line.split(':')[1]?.trim() || '';
      }
      if (fieldType === 'case' && (lower.includes('case number:') || lower.includes('**case number:**'))) {
        return line.split(':')[1]?.trim() || '';
      }
      if (fieldType === 'defendant' && (lower.includes('defendant:') || lower.includes('**defendant:**'))) {
        return line.split(':')[1]?.trim() || '';
      }
    }
    
    return '';
  }

  /**
   * Extracts applicant replacement pattern
   */
  private extractApplicantReplacement(response: string): string {
    const applicantValue = this.extractSpecificField(response, 'applicant');
    return applicantValue ? `**Applicant:** ${applicantValue}` : '';
  }

  /**
   * Checks if response is primarily field updates
   */
  private isFieldUpdateResponse(response: string): boolean {
    const fieldMarkers = ['**applicant:**', '**defendant:**', '**case number:**', '**date:**'];
    const markerCount = fieldMarkers.filter(marker => 
      response.toLowerCase().includes(marker)
    ).length;
    
    const lineCount = response.split('\n').length;
    return markerCount > 0 && lineCount < 20; // Short response with field markers
  }

  /**
   * Extracts field updates from response
   */
  private extractFieldUpdates(response: string): string {
    const lines = response.split('\n');
    const fieldUpdates = lines.filter(line => {
      const lower = line.toLowerCase();
      return lower.includes('**') && (
        lower.includes('applicant:') ||
        lower.includes('defendant:') ||
        lower.includes('case number:') ||
        lower.includes('date:')
      );
    });
    
    return fieldUpdates.join('\n');
  }

  /**
   * Extracts new content to be added
   */
  private extractNewContent(response: string): string {
    // Remove any template headers and extract the meaningful new content
    const lines = response.split('\n');
    let contentStart = 0;
    
    // Skip past common headers
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('petition') || line.includes('before the') || line.includes('case information')) {
        contentStart = i + 1;
        continue;
      }
      if (line.includes('introduction') || line.includes('factual background')) {
        contentStart = i;
        break;
      }
    }
    
    return lines.slice(contentStart).join('\n').trim();
  }

  /**
   * Extracts main content, removing template structure
   */
  private extractMainContent(response: string): string {
    // For now, return the response but this could be enhanced to extract specific sections
    return response;
  }
}
