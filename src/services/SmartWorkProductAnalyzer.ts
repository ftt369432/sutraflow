/**
 * 🧠 Smart Work Product & Surgical Edit Analyzer
 * 
 * URENO Principle: Intelligent content analysis for Canvas integration
 * - Detects actual work products vs. conversational responses
 * - Identifies surgical edit opportunities (name changes, additions, etc.)
 * - Global patterns for legal, business, medical, creative domains
 * 
 * Window Analogy: Only show what needs to be amended, not everything
 */

import { UserIntentAnalyzer } from './canvas/UserIntentAnalyzer';

export interface WorkProductAnalysis {
  isWorkProduct: boolean;
  productType: 'document' | 'template' | 'outline' | 'list' | 'analysis' | 'draft' | 'visualizer' | 'none';
  confidence: number;
  domain: 'legal' | 'business' | 'medical' | 'creative' | 'technical' | 'general';
  shouldShowCanvasButtons: boolean;
  surgicalEditOpportunity?: SurgicalEditType;
  reasoning: string[];
}

export interface SurgicalEditType {
  type: 'name_change' | 'date_update' | 'case_number' | 'paragraph_addition' | 'section_replacement' | 'list_item' | 'title_change';
  targetElement: string; // What specifically to edit
  operation: 'replace' | 'append' | 'prepend' | 'insert_after' | 'insert_before';
  confidence: number;
  preview: string; // What the edit would look like
}

export class SmartWorkProductAnalyzer {

  /**
   * 🔍 Main Analysis Function
   * Determines if AI response contains actual work product
   */
  static analyzeContent(content: string, userInput: string, _context?: any): WorkProductAnalysis {
    const analysis: WorkProductAnalysis = {
      isWorkProduct: false,
      productType: 'none',
      confidence: 0,
      domain: 'general',
      shouldShowCanvasButtons: false,
      reasoning: []
    };

    // 1. Check for conversational vs. work product patterns
    const workProductIndicators = this.detectWorkProductPatterns(content);
    const surgicalEditOpportunity = this.detectSurgicalEditOpportunity(content, userInput);
    const domainAnalysis = this.analyzeDomain(content);

    // 2. Combine analysis
    analysis.confidence = workProductIndicators.confidence;
    analysis.productType = workProductIndicators.type;
    analysis.domain = domainAnalysis.domain as 'legal' | 'business' | 'medical' | 'creative' | 'technical' | 'general';
    analysis.reasoning = workProductIndicators.reasoning;
    analysis.surgicalEditOpportunity = surgicalEditOpportunity;

    // 3. Decision logic
    // 🚀 URENO PRINCIPLE: Visualizers are ALWAYS work products!
    analysis.isWorkProduct = (analysis.confidence > 0.6) || (analysis.productType === 'visualizer');
    analysis.shouldShowCanvasButtons = analysis.isWorkProduct || !!surgicalEditOpportunity;

    return analysis;
  }

  /**
   * 📋 Work Product Pattern Detection
   * Identifies structured content vs. conversational responses
   */
  private static detectWorkProductPatterns(content: string) {
    const patterns = {
      // Document structures
      formal_document: {
        patterns: [
          /^#\s+.+$/m, // Headers
          /\d+\.\s+.+$/m, // Numbered lists
          /^\*\s+.+$/m, // Bullet points
          /WHEREAS|THEREFORE|HEREBY|IN WITNESS/i, // Legal language
          /TO:\s+.+FROM:\s+.+/i, // Memo format
          /Subject:|Re:|Date:|From:|To:/i, // Formal headers
        ],
        weight: 0.8
      },

      template_content: {
        patterns: [
          /\[.*?\]/g, // Placeholder brackets
          /_{2,}/g, // Underscores for filling
          /\(fill\s+in|insert|replace|add\s+here\)/i,
          /template|draft|sample/i
        ],
        weight: 0.9
      },

      structured_analysis: {
        patterns: [
          /Analysis:|Conclusion:|Recommendation:/i,
          /Pros?\s+and\s+Cons?|Advantages?\s+and\s+Disadvantages?/i,
          /Summary:|Overview:|Background:/i,
          /Key\s+(points?|findings?|issues?)/i
        ],
        weight: 0.7
      },

      visualizer_content: {
        patterns: [
          /```mermaid/i, // Mermaid diagrams
          /graph\s+(?:TD|LR|BT|RL)/i, // Flowcharts
          /sequenceDiagram/i, // Sequence diagrams
          /classDiagram/i, // Class diagrams
          /pie\s+title/i, // Pie charts
          /gantt/i, // Gantt charts
          /erDiagram/i, // ER diagrams
          /stateDiagram/i, // State diagrams
          /journey/i, // User journeys
          /\[\s*\{[\s\S]*\}\s*\]/g, // JSON array of objects (Data Grid)
          /\|\s*.+?\s*\|\s*.+?\s*\|/m, // Markdown tables
          /spreadsheet|ledger|table|chart|graph/i
        ],
        weight: 1.2 // 🚀 URENO PRINCIPLE: High priority for visualizer content
      },

      conversational_response: {
        patterns: [
          /^(Sure|Of course|I can help|Let me|I'd be happy)/i,
          /Here('s| is) (what|how|why)/i,
          /I think|I believe|In my opinion/i,
          /Does this help|Let me know|Feel free/i,
          /Under California law/i,
          /According to the Labor Code/i,
          /Section \d+ defines/i,
          /You should consult/i,
          /In your situation/i,
          /To provide a comprehensive response/i,
          /I will assume that/i
        ],
        weight: -1.5 // 🛡️ URENO PRINCIPLE: Heavy penalty for conversation/advice
      }
    };

    let totalScore = 0;
    let reasoning = [];
    let detectedType = 'none';

    for (const [type, config] of Object.entries(patterns)) {
      const matches = config.patterns.filter(pattern => pattern.test(content)).length;
      if (matches > 0) {
        const score = (matches * config.weight) / config.patterns.length;
        totalScore += score;
        reasoning.push(`${type}: ${matches} matches (score: ${score.toFixed(2)})`);

        if (score > 0 && config.weight > 0.6) {
          // 🎯 EXACT TYPE MAPPING
          if (type === 'visualizer_content') detectedType = 'visualizer' as any;
          else if (type === 'structured_analysis') detectedType = 'analysis' as any;
          else if (type === 'formal_document') detectedType = 'document' as any;
          else detectedType = type.replace('_', ' ') as any;
        }
      }
    }

    return {
      confidence: Math.max(0, Math.min(1, totalScore)),
      type: detectedType as any,
      reasoning
    };
  }

  /**
   * 🎯 Surgical Edit Detection
   * "Window Analogy" - Find specific elements that need precise amendments
   */
  private static detectSurgicalEditOpportunity(content: string, userInput: string): SurgicalEditType | undefined {
    const surgicalPatterns = [
      {
        type: 'name_change',
        triggers: [/change.*name|replace.*name|update.*name/i, /called|named|entitled/i],
        targets: [/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g], // Person names
        operation: 'replace'
      },
      {
        type: 'date_update',
        triggers: [/change.*date|update.*date|correct.*date/i],
        targets: [/\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4}|January|February|March|April|May|June|July|August|September|October|November|December/gi],
        operation: 'replace'
      },
      {
        type: 'case_number',
        triggers: [/case.{0,10}number|docket|file.{0,10}number/i],
        targets: [/case\s*#?\s*\d+|no\.\s*\d+|\d{2,}-\d+/gi],
        operation: 'replace'
      },
      {
        type: 'paragraph_addition',
        triggers: [/add.*paragraph|insert.*section|include.*clause/i],
        targets: [/\n\n/g], // Paragraph breaks
        operation: 'insert_after'
      },
      {
        type: 'title_change',
        triggers: [/change.*title|update.*heading|rename/i],
        targets: [/^#.+$/gm, /^.+:$/gm], // Headers and titles
        operation: 'replace'
      },
      {
        type: 'list_item',
        triggers: [/add.*item|add.*bullet|include.*point/i],
        targets: [/^\s*[-*+•]\s+.+$/gm, /^\s*\d+\.\s+.+$/gm], // List items
        operation: 'append'
      }
    ];

    for (const pattern of surgicalPatterns) {
      const triggerMatch = pattern.triggers.some(trigger => trigger.test(userInput));
      if (triggerMatch) {
        // Find targets in the content
        const targets = pattern.targets.flatMap(regex => Array.from(content.matchAll(regex)));
        if (targets.length > 0) {
          const firstTarget = targets[0][0];
          return {
            type: pattern.type as any,
            targetElement: firstTarget,
            operation: pattern.operation as any,
            confidence: 0.8,
            preview: `${pattern.operation}: "${firstTarget}"`
          };
        }
      }
    }

    return undefined;
  }

  /**
   * 🌐 Domain Analysis
   * Detect content domain for appropriate handling
   */
  private static analyzeDomain(content: string) {
    const domainKeywords = {
      legal: ['plaintiff', 'defendant', 'court', 'lawsuit', 'statute', 'liability', 'contract', 'agreement', 'violation', 'penalty'],
      business: ['revenue', 'profit', 'strategy', 'market', 'customer', 'stakeholder', 'ROI', 'business plan', 'proposal'],
      medical: ['patient', 'diagnosis', 'treatment', 'medication', 'symptoms', 'therapy', 'medical', 'health', 'clinical'],
      technical: ['algorithm', 'database', 'API', 'software', 'code', 'system', 'architecture', 'implementation'],
      creative: ['story', 'character', 'plot', 'creative', 'design', 'artistic', 'narrative', 'theme']
    };

    let maxScore = 0;
    let detectedDomain = 'general';

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      const matches = keywords.filter(keyword =>
        new RegExp(keyword, 'i').test(content)
      ).length;
      const score = matches / keywords.length;

      if (score > maxScore) {
        maxScore = score;
        detectedDomain = domain;
      }
    }

    return { domain: detectedDomain, confidence: maxScore };
  }

  /**
   * 🔍 Smart Button Visibility Logic
   * Only show Canvas buttons for actual work products
   */
  static shouldShowCanvasButtons(analysis: WorkProductAnalysis): boolean {
    // 🛡️ URENO PRINCIPLE: Be strict. If it's a conversational answer, don't show the big buttons.
    return analysis.isWorkProduct && analysis.confidence > 0.7;
  }

  /**
   * 🎯 Generate Smart Button Labels
   * Context-aware button text based on content analysis
   */
  static getSmartButtonLabels(analysis: WorkProductAnalysis): { create: string; append: string } {
    // 🛡️ Safety check for undefined analysis
    if (!analysis) {
      return { create: '📄 Create Document', append: '➕ Add to Document' };
    }

    if (analysis.surgicalEditOpportunity) {
      return {
        create: `🎯 Apply ${analysis.surgicalEditOpportunity.type.replace('_', ' ')}`,
        append: `➕ Add ${analysis.surgicalEditOpportunity.type.replace('_', ' ')}`
      };
    }

    const domainLabels = {
      legal: { create: '📄 Create Legal Document', append: '➕ Add to Case File' },
      business: { create: '📊 Create Business Doc', append: '➕ Add to Proposal' },
      medical: { create: '🏥 Create Medical Record', append: '➕ Add to Patient File' },
      technical: { create: '⚙️ Create Tech Document', append: '➕ Add to Specs' },
      creative: { create: '🎨 Create Creative Work', append: '➕ Add to Project' }
    };

    return domainLabels[analysis.domain] || {
      create: '📄 Create Document',
      append: '➕ Add to Document'
    };
  }

  /**
   * 🎯 EXTRACT WORK PRODUCT ONLY
   * Strips conversational intro/outro from AI responses
   * Returns ONLY the actual work product content
   */
  static extractWorkProductOnly(content: string, _userInput?: string): string {
    if (!content) return '';

    // Common intro patterns to strip
    const introPatterns = [
      /^(Sure|Of course|Certainly|Absolutely|I'd be happy to|Let me|I can help)[,!.]?\s*(here|with that|help)?[^.]*\.\s*/i,
      /^Here('s| is| are) (the|a|an|what|your|some)[^:]*:\s*/i,
      /^I('ve| have) (created|drafted|prepared|written|generated|made)[^.]*\.\s*/i,
      /^Based on your request[^.]*\.\s*/i,
      /^As requested[^.]*[,.:]\s*/i,
      /^(Great|Perfect|Good) (question|point)[^.]*\.\s*/i,
      /^Let me (create|draft|prepare|write|generate)[^.]*\.\s*/i,
      // 🎯 NEW: Legal/professional document intro patterns
      /^The entire document will be replaced[^.]*\.\s*/i,
      /^The following (document|content|text|template)[^:]*:\s*/i,
      /^(Below|Here|Following) (is|are) the[^:]*:\s*/i,
      /^Under California law[^.]*\.\s*/i,
      /^Given the case name[^.]*[,:.]\s*/i,
      /^A petition for[^.]*would typically[^.]*\.\s*/i,
      /^This section provides[^.]*\.\s*/i,
    ];

    // Common outro patterns to strip
    const outroPatterns = [
      /\s*(Let me know|Feel free|I hope|Please let|If you (need|have|want)|Would you like|Is there anything)[^.]*[.!?]?\s*$/i,
      /\s*Does this (help|work|look|meet)[^.]*[.!?]?\s*$/i,
      /\s*I can (make|do|help|adjust|modify)[^.]*[.!?]?\s*$/i,
      // 🎯 NEW: Legal/professional document outro patterns
      /\s*Please note that this[^.]*\.\s*$/i,
      /\s*This information is for (legal )?research purposes only[^.]*\.\s*$/i,
      /\s*Consult with a qualified attorney[^.]*\.\s*$/i,
      /\s*It is essential to tailor this[^.]*\.\s*$/i,
      /\s*This (template|document) (includes|contains|is)[^.]*\.\s*$/i,
      /\s*The (steps|information) outlined above[^.]*\.\s*$/i,
      /\s*Once you provide this information[^.]*\.\s*$/i,
    ];

    // 🎯 MANDATORY: Strip thinking and final tags FIRST
    // This content should NEVER reach the canvas, regardless of "over-stripping" checks
    let sanitized = content
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/<final>[\s\S]*?<\/final>/gi, '')
      .trim();

    // If there's nothing left after sanitization, return empty
    if (!sanitized) return '';

    let cleaned = sanitized;

    // Strip intro patterns from the sanitized content
    for (const pattern of introPatterns) {
      cleaned = cleaned.replace(pattern, '');
    }

    // Strip outro patterns from the sanitized content
    for (const pattern of outroPatterns) {
      cleaned = cleaned.replace(pattern, '');
    }

    // Trim whitespace and normalize line breaks
    cleaned = cleaned.trim();

    // If after stripping intros/outros we have substantially less content, 
    // return the sanitized content (tags removed) instead of original content with tags.
    if (cleaned.length < sanitized.length * 0.3) {
      console.log('⚠️ [WorkProduct] Over-stripped intro/outro, returning sanitized work product');
      return sanitized;
    }

    console.log('🎯 [WorkProduct] Cleaned work product only:', {
      originalLength: content.length,
      sanitizedLength: sanitized.length,
      cleanedLength: cleaned.length
    });

    return cleaned;

  }

  /**
   * 🎯 MULTI-DOCUMENT RESPONSE SPLITTER
   * Intelligently detects and splits AI responses using UserIntentAnalyzer
   * Understands: petitions with sections (1 canvas) vs multiple documents (multiple canvases)
   * 
   * CRITICAL FIX: Prioritizes user's EXPLICIT document count over pattern detection
   * "two separate canvases" = 2 documents, NOT 15 numbered sections from AI explanation
   */
  static splitMultiDocumentResponse(content: string, userRequest: string): {
    isMultiDocument: boolean;
    documents: Array<{
      title: string;
      content: string;
      type: string;
      canvasNumber: number;
    }>;
    originalContent: string;
  } {
    const result = {
      isMultiDocument: false,
      documents: [] as Array<{ title: string; content: string; type: string; canvasNumber: number }>,
      originalContent: content
    };

    // 🎯 PRIORITY 1: Extract EXPLICIT document count from user request
    // "two canvases" = 2, "three documents" = 3, etc.
    const explicitCountResult = this.extractExplicitDocumentCount(userRequest);

    console.log('🎯 [MultiDoc] Explicit count check:', {
      hasExplicitCount: explicitCountResult.hasExplicitCount,
      count: explicitCountResult.count,
      documentNames: explicitCountResult.documentNames
    });

    // 🧠 INTELLIGENT INTENT ANALYSIS: Understand what user is really asking for
    const intentAnalysis = UserIntentAnalyzer.analyzeUserIntent(userRequest, content);

    // Override intent analysis with explicit count if available
    const expectedCount = explicitCountResult.hasExplicitCount
      ? explicitCountResult.count
      : intentAnalysis.expectedCanvasCount;

    console.log('🧠 [Intent] User wants:', intentAnalysis.type, {
      canvasCount: expectedCount,
      explicitOverride: explicitCountResult.hasExplicitCount,
      structure: intentAnalysis.documentStructure,
      confidence: intentAnalysis.confidence,
      reasoning: intentAnalysis.reasoning
    });

    // If intent is single document (like petition with I, II, III sections), return as single canvas
    if (intentAnalysis.type === 'single_document' && !explicitCountResult.hasExplicitCount) {
      console.log('📄 [Intent] Single document detected - keeping as one canvas');
      return result;
    }

    // If user explicitly requested multiple documents OR intent detects multiple
    if (explicitCountResult.hasExplicitCount && explicitCountResult.count > 1) {
      console.log('🎨 [Intent] EXPLICIT multi-doc request - splitting into', explicitCountResult.count, 'canvases');
      console.log('🎨 [Intent] Expected documents:', explicitCountResult.documentNames);
      result.isMultiDocument = true;

      // Try to split by explicit document names FIRST
      if (explicitCountResult.documentNames.length > 0) {
        const splitResult = this.splitByExplicitDocumentNames(content, explicitCountResult.documentNames);
        if (splitResult.success && splitResult.documents.length === explicitCountResult.count) {
          console.log('✅ [MultiDoc] Split by explicit document names:', splitResult.documents.map(d => d.title));
          result.documents = splitResult.documents;
          return result;
        }
      }
    } else if (intentAnalysis.type === 'multiple_documents' && expectedCount > 1) {
      console.log('🎨 [Intent] Multiple documents detected - splitting into', expectedCount, 'canvases');
      result.isMultiDocument = true;
    } else if (intentAnalysis.type === 'package_request') {
      if (intentAnalysis.confidence > 0.7 && expectedCount > 1) {
        console.log('📦 [Intent] Package request - splitting into', expectedCount, 'canvases');
        result.isMultiDocument = true;
      } else {
        console.log('📦 [Intent] Package request - keeping as single document with sections');
        return result;
      }
    }

    if (!result.isMultiDocument) {
      return result;
    }

    console.log('🔬 [MultiDoc] Proceeding with document splitting...');

    // Pattern 1: **Canvas N:** or Canvas N: headers
    const canvasPattern = /\*?\*?Canvas\s*(\d+)[:\*]*\s*\*?\*?\s*([^\n*]+)\*?\*?/gi;

    // Pattern 2: STRICT numbered document headers (must start after double newline or start of string)
    // This prevents matching numbered lists within explanatory text
    // Only matches if preceded by blank line or start of content: "\n\n1." or "^1."
    const numberedSectionPattern = /(?:^|\n\n)\s*\*?\*?(\d+)\.\s*\*?\*?\s*([^:\n]+)(?::|\*?\*?)/gim;

    // Pattern 3: --- or === dividers with titles
    // const dividerPattern = /(?:^|\n)[-=]{3,}\n*([^\n*]+)\n/gi;

    // Pattern 4: NEW - Explicit section markers like "BUSINESS PLANNING:" (all caps with colon)
    const sectionMarkerPattern = /(?:^|\n)\s*\*?\*?([A-Z][A-Z\s&]+):\*?\*?\s*$/gim;

    // Try Canvas pattern first
    let matches = Array.from(content.matchAll(canvasPattern));

    if (matches.length >= 2) {
      console.log('🔬 [MultiDoc] Found Canvas pattern:', matches.length, 'documents');
      result.isMultiDocument = true;

      // Split content by Canvas headers
      const sections = content.split(/\*?\*?Canvas\s*\d+[:\*]*\s*\*?\*?\s*[^\n]+\*?\*?\n/i);

      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const canvasNum = parseInt(match[1]);
        const title = match[2].trim().replace(/\*+/g, '');
        const sectionContent = sections[i + 1] || ''; // +1 because first split is before first match

        result.documents.push({
          title: title || `Document ${canvasNum}`,
          content: sectionContent.trim(),
          type: this.detectDocumentType(title, sectionContent),
          canvasNumber: canvasNum
        });
      }
    }
    // Try numbered section pattern if Canvas pattern didn't work
    else {
      matches = Array.from(content.matchAll(numberedSectionPattern));

      // STRICT filtering: Only count as separate documents if:
      // 1. Numbers start from 1 (not subsections)
      // 2. Sequential (1, 2, 3...)
      // 3. Substantial content between each (>800 chars = full document, not just sections)
      // 4. Title is substantial (>15 chars to avoid "Introduction" type headers)
      const validMatches = matches.filter((match, idx) => {
        const num = parseInt(match[1]);
        const title = match[2].trim();

        // Must be sequential starting from 1
        const isSequential = (idx === 0 && num === 1) || (idx > 0 && num === parseInt(matches[idx - 1][1]) + 1);

        // Title must be substantial (longer than typical section headers)
        const hasSubstantialTitle = title.length > 15;

        // Check content size between this match and next (full documents have >800 chars)
        if (idx < matches.length - 1) {
          const nextMatch = matches[idx + 1];
          const contentBetween = content.slice(match.index!, nextMatch.index!);
          const hasSubstantialContent = contentBetween.length > 800;

          return isSequential && hasSubstantialTitle && hasSubstantialContent;
        }

        return isSequential && hasSubstantialTitle;
      });

      // CRITICAL: Only split if we have EXACTLY the expected canvas count from intent analysis
      // This prevents splitting explanatory numbered lists into separate canvases
      // const matchesExpectedCount = validMatches.length === intentAnalysis.expectedCanvasCount;

      // 🚫 DEPRECATED: Document splitting now handled by MultiDocumentDetector
      // This prevents duplicate detection and ensures consistent canvas count.
      // The filtering logic above (validMatches) is preserved for reference.
      // See: src/services/canvas/MultiDocumentDetector.ts

      // Log that we found potential patterns but are deferring to MultiDocumentDetector
      if (validMatches.length >= 2) {
        console.log('🔄 [SmartWorkProduct] Found potential numbered pattern:', validMatches.length,
          '- Deferring to MultiDocumentDetector for splitting');
      }

      // Note: Keep result.isMultiDocument = false here
      // Let MultiDocumentDetector handle actual document splitting to avoid conflicts
    }

    // Log result and validate
    if (result.isMultiDocument && result.documents.length > 0) {
      // Final validation: If intent wanted N documents but we found M (and M != N), treat as mismatch
      if (intentAnalysis.type === 'multiple_documents' &&
        result.documents.length !== intentAnalysis.expectedCanvasCount) {
        console.warn('⚠️ [MultiDoc] Canvas count mismatch! Expected:', intentAnalysis.expectedCanvasCount,
          'Found:', result.documents.length);
        console.warn('⚠️ [MultiDoc] AI may have generated explanatory content instead of actual documents');
        console.warn('⚠️ [MultiDoc] Treating as single document to avoid fragmentation');

        // Reset to single document with helpful error message
        result.isMultiDocument = false;
        result.documents = [];
      } else {
        console.log('✅ [MultiDoc] Split into', result.documents.length, 'documents:',
          result.documents.map(d => d.title));
      }
    } else if (intentAnalysis.type === 'multiple_documents') {
      console.log('⚠️ [MultiDoc] Could not detect multiple documents in response (expected',
        intentAnalysis.expectedCanvasCount, 'documents)');
    }

    return result;
  }

  /**
   * 🏷️ Detect document type from title and content
   */
  private static detectDocumentType(title: string, content: string): string {
    const lowerTitle = title.toLowerCase();
    const lowerContent = content.toLowerCase();

    if (/contract|agreement|terms/i.test(lowerTitle + lowerContent)) return 'legal_contract';
    if (/checklist|todo|tasks?|steps/i.test(lowerTitle + lowerContent)) return 'checklist';
    if (/email|letter|message|correspondence/i.test(lowerTitle + lowerContent)) return 'email_template';
    if (/onboarding|training|orientation/i.test(lowerTitle + lowerContent)) return 'onboarding_doc';
    if (/petition|motion|brief|filing/i.test(lowerTitle + lowerContent)) return 'legal_petition';
    if (/plan|strategy|proposal/i.test(lowerTitle + lowerContent)) return 'business_plan';

    return 'general_document';
  }

  /**
   * 🔬 SURGICAL EDIT CONTENT DETECTION
   * Determines if AI response is a surgical edit (specific change) vs full doc
   */
  static isSurgicalEditResponse(response: string, originalContent: string, userRequest: string): {
    isSurgical: boolean;
    editType: 'replace' | 'insert' | 'append' | 'full_replace';
    confidence: number;
    reason: string;
  } {
    const responseLength = response.length;
    const originalLength = originalContent?.length || 0;
    const lengthRatio = originalLength > 0 ? responseLength / originalLength : 1;

    // Check user request patterns
    const isAddRequest = /\b(add|insert|include|append)\b/i.test(userRequest);
    const isChangeRequest = /\b(change|modify|update|replace|fix|correct)\b/i.test(userRequest);
    const isSpecificChange = /\bchange\s+.+\s+to\s+/i.test(userRequest) ||
      /\bupdate\s+the\s+\w+/i.test(userRequest);

    // Small patch detection (< 30% of original size = likely surgical)
    if (lengthRatio < 0.3 && originalLength > 500) {
      return {
        isSurgical: true,
        editType: isAddRequest ? 'insert' : 'replace',
        confidence: 0.9,
        reason: `Response is ${(lengthRatio * 100).toFixed(0)}% of original - treating as surgical edit`
      };
    }

    // Medium patch with explicit add request
    if (lengthRatio < 0.6 && isAddRequest) {
      return {
        isSurgical: true,
        editType: 'insert',
        confidence: 0.8,
        reason: `Add request with ${(lengthRatio * 100).toFixed(0)}% size response`
      };
    }

    // Specific change pattern with reasonable size
    if (isSpecificChange && lengthRatio < 0.8) {
      return {
        isSurgical: true,
        editType: 'replace',
        confidence: 0.85,
        reason: 'Specific change pattern detected'
      };
    }

    // Full doc regeneration
    if (lengthRatio > 0.8 && originalLength > 500) {
      return {
        isSurgical: false,
        editType: 'full_replace',
        confidence: 0.7,
        reason: `Response is ${(lengthRatio * 100).toFixed(0)}% of original - full doc replacement`
      };
    }

    // Default: append for safety
    return {
      isSurgical: false,
      editType: 'append',
      confidence: 0.5,
      reason: 'Defaulting to append for safety'
    };
  }

  /**
   * 🎯 EXTRACT EXPLICIT DOCUMENT COUNT
   * Parses user request for explicit document/canvas counts
   * "two separate canvases" → 2, "three documents" → 3
   * Also extracts document names: "demand letter and settlement agreement" → ["demand letter", "settlement agreement"]
   */
  private static extractExplicitDocumentCount(userRequest: string): {
    hasExplicitCount: boolean;
    count: number;
    documentNames: string[];
  } {
    const result = {
      hasExplicitCount: false,
      count: 1,
      documentNames: [] as string[]
    };

    const lowerRequest = userRequest.toLowerCase();

    // Pattern 1: Number words + "canvas/document/file"
    const numberWords: Record<string, number> = {
      one: 1, two: 2, three: 3, four: 4, five: 5,
      six: 6, seven: 7, eight: 8, nine: 9, ten: 10
    };

    for (const [word, num] of Object.entries(numberWords)) {
      if (new RegExp(`${word}\\s+(separate\\s+)?(canvas|document|file|letter|petition)`, 'i').test(lowerRequest)) {
        result.hasExplicitCount = true;
        result.count = num;
        break;
      }
    }

    // Pattern 2: Digit + "canvas/document"
    const digitMatch = lowerRequest.match(/(\d+)\s+(separate\s+)?(canvases?|documents?|files?)/i);
    if (digitMatch) {
      result.hasExplicitCount = true;
      result.count = parseInt(digitMatch[1]);
    }

    // Pattern 3: "X and Y" document names (e.g., "demand letter and settlement agreement")
    const docNamePatterns = [
      // "demand letter and settlement agreement"
      /(demand\s+letter|letter)\s+(?:and|,)\s+(settlement\s+agreement|agreement)/i,
      // "petition and letter"
      /(petition[^,]*?)\s+(?:and|,)\s+(letter[^,]*)/i,
      // "plan of action and letter to X"
      /(plan\s+of\s+action|action\s+plan)\s*(?:,|and)\s*(letter[^,]*)/i,
      // "letter to X and petition for Y"  
      /(letter\s+to\s+\w+)\s*(?:,|and)\s*(petition[^,]*)/i,
      // Generic "X, Y, and Z" pattern with document keywords
      /((?:plan|letter|petition|motion|brief|contract|agreement)[^,]*),\s*((?:plan|letter|petition|motion|brief|contract|agreement)[^,]*?)(?:\s*(?:,|and)\s*((?:plan|letter|petition|motion|brief|contract|agreement)[^,]*))?/i
    ];

    for (const pattern of docNamePatterns) {
      const match = userRequest.match(pattern);
      if (match) {
        // Extract all captured groups (document names)
        const names = match.slice(1).filter(Boolean).map(n => n.trim());
        if (names.length > 0) {
          result.documentNames = names;
          if (!result.hasExplicitCount) {
            result.hasExplicitCount = true;
            result.count = names.length;
          }
        }
        break;
      }
    }

    // Pattern 4: "separate" keyword with "and" suggests multiple
    if (!result.hasExplicitCount && /separate/i.test(lowerRequest)) {
      // Count "and" conjunctions between document-type keywords
      const andMatches = lowerRequest.match(/(?:and|,)\s+(?=\w)/g);
      if (andMatches && andMatches.length >= 1) {
        // Check if there are document keywords around the "and"
        if (/(letter|petition|motion|plan|agreement|contract|document|canvas)/i.test(lowerRequest)) {
          result.hasExplicitCount = true;
          result.count = andMatches.length + 1; // "A and B" = 2, "A, B, and C" = 3
        }
      }
    }

    // 🆕 Pattern 5: Numbered lists (1. A demand letter, 2. A petition, 3. A settlement)
    // This is common when users request multiple documents with numbered items
    if (!result.hasExplicitCount) {
      // Match patterns like "1. A demand letter" "2. A petition for" "3. A settlement"
      const numberedItemPattern = /^\s*(\d+)[\.\)]\s+(?:a\s+)?([a-z]+(?:\s+[a-z]+)?)/gim;
      const numberedMatches = [...userRequest.matchAll(numberedItemPattern)];

      if (numberedMatches.length >= 2) {
        // Check if these are document-type items (letter, petition, demand, etc.)
        const documentKeywords = ['letter', 'petition', 'demand', 'motion', 'brief', 'document', 'contract', 'agreement', 'settlement', 'complaint', 'response'];
        const matchedDocTypes = numberedMatches.filter(match => {
          const itemText = match[2].toLowerCase();
          return documentKeywords.some(kw => itemText.includes(kw));
        });

        if (matchedDocTypes.length >= 2) {
          result.hasExplicitCount = true;
          result.count = matchedDocTypes.length;
          result.documentNames = matchedDocTypes.map(m => {
            // Try to extract the full document name from the match
            const fullLine = userRequest.slice(m.index || 0).split('\n')[0];
            // Clean up: remove number prefix and extract just the document type phrase
            return fullLine.replace(/^\s*\d+[\.\)]\s*/i, '').split(/(?:citing|requesting|with|including|for the)/i)[0].trim();
          });
          console.log('🔢 [ExplicitCount] Detected numbered list with documents:', {
            count: result.count,
            names: result.documentNames
          });
        }
      }
    }

    // 🆕 Pattern 6: "following legal documents" or "following documents" with numbered list after
    if (!result.hasExplicitCount && /(?:following|these)\s+(?:legal\s+)?documents/i.test(lowerRequest)) {
      // Count how many numbered items follow
      const numberedItems = userRequest.match(/(?:^|\n)\s*\d+[\.\)]/g);
      if (numberedItems && numberedItems.length >= 2) {
        result.hasExplicitCount = true;
        result.count = numberedItems.length;
        console.log('🔢 [ExplicitCount] Detected "following documents" pattern:', result.count);
      }
    }

    console.log('🔢 [ExplicitCount] Parsed:', result);
    return result;
  }

  /**
   * 🎯 SPLIT BY EXPLICIT DOCUMENT NAMES
   * Splits AI response content based on explicit document names from user request
   * Looks for markers like "Demand Letter", "Settlement Agreement" in the content
   */
  private static splitByExplicitDocumentNames(
    content: string,
    documentNames: string[]
  ): { success: boolean; documents: Array<{ title: string; content: string; type: string; canvasNumber: number }> } {
    const result: Array<{ title: string; content: string; type: string; canvasNumber: number }> = [];

    console.log('🔍 [SplitByNames] Attempting to split by document names:', documentNames);

    // Build regex patterns for each document name
    const patterns = documentNames.map((name, idx) => ({
      name: name,
      index: idx,
      // Match the document name as a header (with optional formatting)
      pattern: new RegExp(`(?:^|\\n)\\s*(?:\\*\\*|##?)?\\s*${name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\s*(?:\\*\\*)?[:\\n]`, 'gi')
    }));

    // Find all document boundaries
    const boundaries: Array<{ name: string; startIndex: number; matchEnd: number }> = [];

    for (const p of patterns) {
      let match;
      while ((match = p.pattern.exec(content)) !== null) {
        boundaries.push({
          name: p.name,
          startIndex: match.index,
          matchEnd: match.index + match[0].length
        });
      }
    }

    // Sort by position in content
    boundaries.sort((a, b) => a.startIndex - b.startIndex);

    // If we found fewer boundaries than expected, try looser matching
    if (boundaries.length < documentNames.length) {
      console.log('⚠️ [SplitByNames] Found fewer boundaries than expected, trying looser match');

      // Try with contains logic (find rough sections)
      for (const name of documentNames) {
        const simplePattern = new RegExp(`${name.split(' ')[0]}`, 'gi');
        let match;
        let found = false;
        while ((match = simplePattern.exec(content)) !== null) {
          // Check if this is a header (preceded by newline or at start, followed by colon or newline)
          const before = content.slice(Math.max(0, match.index - 5), match.index);
          const after = content.slice(match.index + match[0].length, match.index + match[0].length + 30);

          if ((before.includes('\n') || match.index < 10) && (after.includes(':') || after.includes('\n'))) {
            if (!boundaries.find(b => Math.abs(b.startIndex - match.index) < 50)) {
              boundaries.push({
                name: name,
                startIndex: match.index,
                matchEnd: match.index + match[0].length
              });
              found = true;
              break;
            }
          }
        }
      }

      boundaries.sort((a, b) => a.startIndex - b.startIndex);
    }

    // Extract sections between boundaries
    if (boundaries.length === documentNames.length) {
      for (let i = 0; i < boundaries.length; i++) {
        const current = boundaries[i];
        const nextStart = boundaries[i + 1]?.startIndex || content.length;
        const sectionContent = content.slice(current.matchEnd, nextStart).trim();

        if (sectionContent.length > 50) {
          result.push({
            title: this.capitalizeTitle(current.name),
            content: sectionContent,
            type: this.detectDocumentType(current.name, sectionContent),
            canvasNumber: i + 1
          });
        }
      }
    }

    const success = result.length === documentNames.length;
    console.log('🔍 [SplitByNames] Result:', { success, documentCount: result.length, expected: documentNames.length });

    return { success, documents: result };
  }

  /**
   * 🔠 Helper to capitalize title properly
   */
  private static capitalizeTitle(title: string): string {
    return title
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
