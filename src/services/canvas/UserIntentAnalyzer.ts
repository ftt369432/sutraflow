/**
 * 🧠 User Intent Analyzer for Multi-Canvas Detection
 * 
 * Understands WHAT the user is asking for:
 * - Single document with sections (petition with I, II, III) → 1 canvas
 * - Multiple separate documents (petition + case plan + motion) → multiple canvases
 * - Package/comprehensive requests → analyze structure to decide
 */

export interface IntentAnalysis {
  type: 'single_document' | 'multiple_documents' | 'package_request';
  confidence: number;
  expectedCanvasCount: number;
  documentStructure: 'sectioned' | 'separate' | 'mixed';
  reasoning: string[];
  documents: Array<{
    title: string;
    type: string;
    hasSections: boolean;
    sectionMarkers?: string[]; // Roman numerals, letters, numbers
  }>;
}

export class UserIntentAnalyzer {

  /**
   * 🎯 Main Analysis: Understand what user is really asking for
   */
  static analyzeUserIntent(userInput: string, aiResponse: string): IntentAnalysis {
    console.log('🧠 [Intent] Analyzing user request for canvas structure...');

    const analysis: IntentAnalysis = {
      type: 'single_document',
      confidence: 0.5,
      expectedCanvasCount: 1,
      documentStructure: 'sectioned',
      reasoning: [],
      documents: []
    };

    // 1. Detect explicit multi-document requests
    const explicitMulti = this.detectExplicitMultiRequest(userInput);
    if (explicitMulti.isMulti) {
      analysis.type = 'multiple_documents';
      analysis.confidence = 0.95;
      analysis.expectedCanvasCount = explicitMulti.count;
      analysis.reasoning.push(`Explicit request for ${explicitMulti.count} separate documents`);
      return analysis;
    }

    // 2. Detect package/comprehensive requests
    const isPackage = this.detectPackageRequest(userInput);
    if (isPackage) {
      analysis.type = 'package_request';
      analysis.reasoning.push('Comprehensive/package request detected');

      // Analyze AI response to understand structure
      const structure = this.analyzeResponseStructure(aiResponse, userInput);
      analysis.documents = structure.documents;
      analysis.documentStructure = structure.type;
      analysis.expectedCanvasCount = structure.shouldSplit ? structure.documents.length : 1;
      analysis.confidence = structure.confidence;

      if (structure.shouldSplit) {
        analysis.type = 'multiple_documents';
        analysis.reasoning.push(`Response contains ${structure.documents.length} distinct documents`);
      } else {
        analysis.type = 'single_document';
        analysis.reasoning.push('Response is single document with internal sections');
      }

      return analysis;
    }

    // 3. Detect single document with sections (petition structure)
    const singleDoc = this.detectSingleDocumentWithSections(userInput, aiResponse);
    if (singleDoc.isSingle) {
      analysis.type = 'single_document';
      analysis.confidence = 0.9;
      analysis.expectedCanvasCount = 1;
      analysis.documentStructure = 'sectioned';
      analysis.reasoning.push(`Single document with ${singleDoc.sectionType} sections`);
      analysis.documents = [{
        title: singleDoc.title || 'Document',
        type: singleDoc.docType,
        hasSections: true,
        sectionMarkers: singleDoc.markers
      }];
      return analysis;
    }

    console.log('🧠 [Intent] Analysis complete:', analysis);
    return analysis;
  }

  /**
   * 🎯 Detect explicit multi-document requests
   * "create 3 separate canvases", "petition and case plan as different documents"
   */
  private static detectExplicitMultiRequest(userInput: string): { isMulti: boolean; count: number } {
    const lowerInput = userInput.toLowerCase();

    // Pattern 0: EXPLICIT number + canvas/document ("two canvas", "2 documents", "three canvases")
    const explicitNumberPattern = /\b(two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(canvas(?:es)?|document(?:s)?)/i;
    const explicitMatch = userInput.match(explicitNumberPattern);
    if (explicitMatch) {
      const numWord = explicitMatch[1].toLowerCase();
      const wordToNum: Record<string, number> = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
      const count = wordToNum[numWord] || parseInt(numWord);
      console.log('🎯 [Explicit] Detected numeric canvas request:', count, 'canvases');
      return { isMulti: true, count };
    }

    // Pattern 0.5: "one X...one Y" construction ("one petition...one letter")
    const oneOnePattern = /\bone\s+(\w+)[^.]*\bone\s+(\w+)/i;
    const oneOneMatch = userInput.match(oneOnePattern);
    if (oneOneMatch) {
      console.log('🎯 [Explicit] Detected "one...one" pattern:', oneOneMatch[1], '+', oneOneMatch[2]);
      return { isMulti: true, count: 2 };
    }

    // Pattern 1: Numbers + "separate/different" + "canvas/document"
    const numberPattern = /(\d+)\s+(separate|different|individual|distinct)\s+(canvas(?:es)?|document(?:s)?)/i;
    const numberMatch = userInput.match(numberPattern);
    if (numberMatch) {
      return { isMulti: true, count: parseInt(numberMatch[1]) };
    }

    // Pattern 2: "separate canvases/documents" without number
    if (/\b(separate|different|individual|distinct)\s+(canvas(?:es)?|document(?:s)?)\b/i.test(lowerInput)) {
      // Count document types mentioned
      const docTypes = ['petition', 'motion', 'brief', 'plan', 'memo', 'letter', 'contract', 'agreement'];
      const mentionedTypes = docTypes.filter(type => lowerInput.includes(type));
      return { isMulti: true, count: Math.max(2, mentionedTypes.length) };
    }

    // Pattern 3: Multiple document types with "and" or "+" or ","
    // "petition and case plan", "motion + brief", "contract, amendment, exhibit"
    const andPattern = /\b(petition|motion|brief|plan|memo|contract|agreement)\b\s*(?:and|\+|,)\s*\b(petition|motion|brief|plan|memo|contract|agreement)\b/gi;
    const andMatches = Array.from(userInput.matchAll(andPattern));
    if (andMatches.length > 0) {
      const uniqueDocs = new Set<string>();
      andMatches.forEach(match => {
        uniqueDocs.add(match[1].toLowerCase());
        uniqueDocs.add(match[2].toLowerCase());
      });
      return { isMulti: true, count: uniqueDocs.size };
    }

    return { isMulti: false, count: 1 };
  }

  /**
   * 📦 Detect package/comprehensive requests
   */
  private static detectPackageRequest(userInput: string): boolean {
    const packageKeywords = /\b(comprehensive|package|complete|full|entire|all)\b/i;
    return packageKeywords.test(userInput);
  }

  /**
   * 🔍 Analyze AI response structure to determine if it's multiple docs or one doc with sections
   */
  private static analyzeResponseStructure(aiResponse: string, userInput: string): {
    type: 'separate' | 'sectioned' | 'mixed';
    shouldSplit: boolean;
    confidence: number;
    documents: Array<{
      title: string;
      type: string;
      hasSections: boolean;
      sectionMarkers?: string[];
    }>;
  } {
    const result = {
      type: 'sectioned' as 'separate' | 'sectioned' | 'mixed',
      shouldSplit: false,
      confidence: 0.5,
      documents: [] as Array<any>
    };

    // Check for document separators (strong signal for separate documents)
    const strongSeparators = [
      /\n\s*[-=]{10,}\s*\n/g, // Long divider lines
      /\*{3,}\s*DOCUMENT\s+\d+/gi, // *** DOCUMENT 1 ***
      /#{2,}\s*DOCUMENT\s+\d+:/gi, // ## DOCUMENT 1:
      /\n\s*CANVAS\s+\d+:/gi // CANVAS 1:
    ];

    let separatorCount = 0;
    strongSeparators.forEach(pattern => {
      const matches = aiResponse.match(pattern);
      if (matches) separatorCount += matches.length;
    });

    if (separatorCount >= 2) {
      result.type = 'separate';
      result.shouldSplit = true;
      result.confidence = 0.95;
      return result;
    }

    // Check for numbered top-level sections (1. Title, 2. Title) vs internal sections (I. II. III.)
    const numberedSections = Array.from(aiResponse.matchAll(/(?:^|\n)\s*(\d+)\.\s+\*?\*?([A-Z][^\n:]+)(?::|\*\*)/gim));
    const romanNumerals = Array.from(aiResponse.matchAll(/(?:^|\n)\s*([IVX]+)\.\s+([A-Z][^\n]+)/gim));
    const letterSections = Array.from(aiResponse.matchAll(/(?:^|\n)\s*([A-Z])\.\s+([A-Z][^\n]+)/gim));

    console.log('🔍 [Structure] Found sections:', {
      numbered: numberedSections.length,
      roman: romanNumerals.length,
      letters: letterSections.length
    });

    // If has many numbered sections (5+) with substantial titles, likely separate documents
    if (numberedSections.length >= 5) {
      const hasSubstantialTitles = numberedSections.filter(m => m[2].trim().length > 10).length >= 5;

      if (hasSubstantialTitles) {
        result.type = 'separate';
        result.shouldSplit = true;
        result.confidence = 0.85;

        // Extract document info
        numberedSections.forEach(match => {
          result.documents.push({
            title: match[2].trim().replace(/\*+/g, '').replace(/:\s*$/, ''),
            type: this.detectDocumentType(match[2]),
            hasSections: false
          });
        });

        return result;
      }
    }

    // If has Roman numerals or letters, likely internal sections of single document
    if (romanNumerals.length >= 2 || letterSections.length >= 3) {
      result.type = 'sectioned';
      result.shouldSplit = false;
      result.confidence = 0.9;

      result.documents.push({
        title: this.extractDocumentTitle(aiResponse, userInput),
        type: this.detectDocumentType(userInput),
        hasSections: true,
        sectionMarkers: romanNumerals.length >= 2 ? ['roman'] : ['letter']
      });

      return result;
    }

    // Default: treat as single document if unsure
    result.type = 'sectioned';
    result.shouldSplit = false;
    result.confidence = 0.6;

    return result;
  }

  /**
   * 📄 Detect single document with internal sections
   */
  private static detectSingleDocumentWithSections(userInput: string, aiResponse: string): {
    isSingle: boolean;
    title?: string;
    docType: string;
    sectionType?: 'roman' | 'letter' | 'numbered';
    markers?: string[];
  } {
    const lowerInput = userInput.toLowerCase();

    // Keywords that indicate single document
    const singleDocKeywords = /\b(petition|motion|brief|contract|agreement|memo)\b/i;
    const match = userInput.match(singleDocKeywords);

    if (!match) {
      return { isSingle: false, docType: 'general_document' };
    }

    const docType = match[1].toLowerCase();

    // Check for Roman numerals in response
    const romanPattern = /(?:^|\n)\s*([IVX]+)\.\s+/gim;
    const romanMatches = Array.from(aiResponse.matchAll(romanPattern));

    if (romanMatches.length >= 2) {
      return {
        isSingle: true,
        title: this.extractDocumentTitle(aiResponse, userInput),
        docType: `legal_${docType}`,
        sectionType: 'roman',
        markers: romanMatches.map(m => m[1])
      };
    }

    // Check for letter sections (A. B. C.)
    const letterPattern = /(?:^|\n)\s*([A-E])\.\s+/gim;
    const letterMatches = Array.from(aiResponse.matchAll(letterPattern));

    if (letterMatches.length >= 3) {
      return {
        isSingle: true,
        title: this.extractDocumentTitle(aiResponse, userInput),
        docType: `legal_${docType}`,
        sectionType: 'letter',
        markers: letterMatches.map(m => m[1])
      };
    }

    return { isSingle: false, docType: 'general_document' };
  }

  /**
   * 🏷️ Extract document title from response or input
   */
  private static extractDocumentTitle(aiResponse: string, userInput: string): string {
    // Look for title in first few lines
    const lines = aiResponse.split('\n').slice(0, 10);

    for (const line of lines) {
      // Check for markdown headers
      const headerMatch = line.match(/^#{1,3}\s+(.+)$/);
      if (headerMatch && headerMatch[1].length > 5) {
        return headerMatch[1].trim();
      }

      // Check for bold titles
      const boldMatch = line.match(/\*\*(.+)\*\*/);
      if (boldMatch && boldMatch[1].length > 5 && !line.includes(':')) {
        return boldMatch[1].trim();
      }
    }

    // Fallback: extract from user input
    const titleMatch = userInput.match(/\b(petition|motion|brief|contract|agreement|memo)\s+(?:for|to|regarding)\s+(.+?)(?:\.|,|$)/i);
    if (titleMatch) {
      return `${titleMatch[1]} ${titleMatch[2]}`.trim();
    }

    return 'Document';
  }

  /**
   * 🔍 Detect document type from title/content
   */
  private static detectDocumentType(text: string): string {
    const lowerText = text.toLowerCase();

    if (/petition/i.test(lowerText)) return 'legal_petition';
    if (/motion/i.test(lowerText)) return 'legal_motion';
    if (/brief/i.test(lowerText)) return 'legal_brief';
    if (/contract|agreement/i.test(lowerText)) return 'legal_contract';
    if (/memo|memorandum/i.test(lowerText)) return 'legal_memo';
    if (/plan/i.test(lowerText)) return 'business_plan';
    if (/proposal/i.test(lowerText)) return 'business_proposal';
    if (/report/i.test(lowerText)) return 'business_report';

    return 'general_document';
  }

  /**
   * 🎯 Extract discrete task items from user request
   * Parses natural language to identify specific, named tasks
   * "I need three canvases: plan of action, letter to X, petition for Y"
   * → [{title: "Plan of Action", type: "planning"}, {title: "Letter to X", ...}, ...]
   */
  static extractDiscreteTaskItems(userInput: string): Array<{
    title: string;
    type: 'planning' | 'letter' | 'petition' | 'motion' | 'document' | 'case_setup' | 'other';
    context?: string;
    priority: 'high' | 'medium' | 'low';
  }> {
    const tasks: Array<{
      title: string;
      type: 'planning' | 'letter' | 'petition' | 'motion' | 'document' | 'case_setup' | 'other';
      context?: string;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    const lowerInput = userInput.toLowerCase();

    console.log('🎯 [DiscreteTask] Extracting tasks from:', userInput.substring(0, 100));

    // Pattern 1: "plan of action" / "action plan" with context
    const planPatterns = [
      /(?:plan\s+of\s+action|action\s+plan)(?:\s+(?:for|regarding|on|about)\s+)?([^,\.;]+)?/gi,
      /(?:case\s+setup|new\s+case)(?:\s+(?:for|regarding|on|about)\s+)?([^,\.;]+)?/gi,
    ];

    planPatterns.forEach(pattern => {
      const matches = userInput.matchAll(pattern);
      for (const match of matches) {
        const context = match[1]?.trim();
        const title = context
          ? `Plan of Action - ${this.capitalizeWords(context)}`
          : 'Plan of Action';

        if (!tasks.find(t => t.title.toLowerCase() === title.toLowerCase())) {
          tasks.push({
            title,
            type: 'planning',
            context,
            priority: 'high'
          });
        }
      }
    });

    // Pattern 2: "letter to [name]" / "letter for [purpose]" / "[name] letter"
    const letterPatterns = [
      /letter\s+(?:to|for)\s+([^,\.;]+?)(?:\s+(?:regarding|about|for|on))?/gi,
      /(?:daldalyan|consultation|internal)\s+letter/gi,
      /letter\s+(?:regarding|about)\s+([^,\.;]+)/gi,
    ];

    letterPatterns.forEach(pattern => {
      const matches = userInput.matchAll(pattern);
      for (const match of matches) {
        const context = match[1]?.trim() || match[0]?.trim();
        let title = '';

        if (/daldalyan/i.test(match[0])) {
          title = 'Letter to Daldalyan';
        } else if (/consultation|internal/i.test(match[0])) {
          title = 'Internal Consultation Letter';
        } else if (context) {
          title = `Letter to ${this.capitalizeWords(context)}`;
        } else {
          title = 'Letter';
        }

        if (!tasks.find(t => t.title.toLowerCase() === title.toLowerCase())) {
          tasks.push({
            title,
            type: 'letter',
            context,
            priority: 'medium'
          });
        }
      }
    });

    // Pattern 3: "petition for [X]" / "[X] petition"
    const petitionPatterns = [
      /petition\s+(?:for|regarding|on)\s+([^,\.;]+)/gi,
      /([^,\.;]+?)\s+petition(?!\s+(?:for|regarding|on))/gi,
      /penalties?\s+(?:on|for)\s+(?:unpaid\s+)?([^,\.;]+)/gi, // "penalties on unpaid TTD"
    ];

    petitionPatterns.forEach(pattern => {
      const matches = userInput.matchAll(pattern);
      for (const match of matches) {
        const context = match[1]?.trim();
        let title = '';

        if (/penalties/i.test(match[0]) || /ttd|temporary\s+total\s+disability/i.test(context || '')) {
          title = 'Petition for Penalties on Unpaid TTD';
        } else if (context) {
          title = `Petition for ${this.capitalizeWords(context)}`;
        } else {
          title = 'Petition';
        }

        if (!tasks.find(t => t.title.toLowerCase().includes('petition')) &&
          !tasks.find(t => t.title.toLowerCase() === title.toLowerCase())) {
          tasks.push({
            title,
            type: 'petition',
            context,
            priority: 'high'
          });
        }
      }
    });

    // Pattern 4: Motion patterns
    const motionPatterns = [
      /motion\s+(?:for|to|regarding)\s+([^,\.;]+)/gi,
    ];

    motionPatterns.forEach(pattern => {
      const matches = userInput.matchAll(pattern);
      for (const match of matches) {
        const context = match[1]?.trim();
        const title = context
          ? `Motion for ${this.capitalizeWords(context)}`
          : 'Motion';

        if (!tasks.find(t => t.title.toLowerCase() === title.toLowerCase())) {
          tasks.push({
            title,
            type: 'motion',
            context,
            priority: 'high'
          });
        }
      }
    });

    // Pattern 5: Numbered/listed items (fallback for generic lists)
    // "1. X, 2. Y, 3. Z" or "first X, second Y, third Z"
    if (tasks.length === 0) {
      const numberedPattern = /(?:^|[,;])\s*(?:\d+\.|first|second|third|lastly?|finally)\s*([^,;\.]+)/gi;
      const matches = userInput.matchAll(numberedPattern);
      for (const match of matches) {
        const itemText = match[1]?.trim();
        if (itemText && itemText.length > 3) {
          const type = this.inferTaskType(itemText);
          tasks.push({
            title: this.capitalizeWords(itemText),
            type,
            priority: 'medium'
          });
        }
      }
    }

    // Pattern 6: Items separated by "and" at document level
    if (tasks.length === 0 && /\band\b/i.test(userInput)) {
      const andParts = userInput.split(/\band\b/i);
      andParts.forEach(part => {
        const cleanPart = part.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '').trim();
        if (cleanPart.length > 5) {
          const type = this.inferTaskType(cleanPart);
          if (type !== 'other') {
            tasks.push({
              title: this.capitalizeWords(cleanPart),
              type,
              priority: 'medium'
            });
          }
        }
      });
    }

    console.log('🎯 [DiscreteTask] Extracted tasks:', tasks.length, tasks.map(t => t.title));
    return tasks;
  }

  /**
   * 🔧 Helper: Capitalize words in a string
   */
  private static capitalizeWords(str: string): string {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .substring(0, 80); // Limit length
  }

  /**
   * 🔧 Helper: Infer task type from text
   */
  private static inferTaskType(text: string): 'planning' | 'letter' | 'petition' | 'motion' | 'document' | 'case_setup' | 'other' {
    const lower = text.toLowerCase();
    if (/plan|setup|action/i.test(lower)) return 'planning';
    if (/letter|correspondence|memo/i.test(lower)) return 'letter';
    if (/petition|penalties|ttd/i.test(lower)) return 'petition';
    if (/motion/i.test(lower)) return 'motion';
    if (/case\s+setup|new\s+case/i.test(lower)) return 'case_setup';
    if (/document|draft|write/i.test(lower)) return 'document';
    return 'other';
  }
}
