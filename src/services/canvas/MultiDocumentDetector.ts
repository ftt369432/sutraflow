/**
 * 🔍 Multi-Document Detector - Single Source for Document Detection
 * 
 * ELITE ENGINEERING: Google-level code quality
 * - Detects multiple documents from BOTH user request AND AI response
 * - Persists conversation context across messages
 * - Clean, testable, single-responsibility
 * 
 * KEY FIX: Previous system only checked user request. Now we also
 * check AI response for document boundaries (Canvas 1, Canvas 2, etc.)
 * 
 * @author GenieFlow AI
 * @version 2.0.0
 */

import { DocumentContent } from './CanvasCreationService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Result of multi-document detection
 */
export interface MultiDocumentDetectionResult {
    isMultiDocument: boolean;
    documentCount: number;
    documents: DetectedDocument[];
    detectionSource: 'user_request' | 'ai_response' | 'conversation_context' | 'combined';
    confidence: number;
    reasoning: string[];
}

/**
 * Individual detected document
 */
export interface DetectedDocument {
    title: string;
    content: string;
    type: string;
    canvasNumber: number;
    startIndex?: number;
    endIndex?: number;
}

/**
 * Conversation context for multi-message support
 */
export interface ConversationIntent {
    conversationId: string;
    requestedDocumentCount: number;
    documentTypes: string[];
    caseDetails?: string;
    timestamp: Date;
    fulfilled: boolean;
}

// ============================================================================
// MULTI-DOCUMENT DETECTOR - Clean, comprehensive implementation
// ============================================================================

/**
 * Centralized service for detecting and extracting multiple documents
 * from user requests and AI responses
 * 
 * @example
 * ```typescript
 * const detector = MultiDocumentDetector.getInstance();
 * 
 * // Check user request first
 * const userResult = detector.detectFromUserRequest("I need 3 canvases: petition, letter, demand");
 * 
 * // Then check AI response for actual documents
 * const aiResult = detector.detectFromAIResponse(aiResponse, "conv-123");
 * 
 * // Get final documents to create
 * const documents = aiResult.documents;
 * ```
 */
export class MultiDocumentDetector {
    private static instance: MultiDocumentDetector | null = null;

    // Conversation context storage (persists intent across messages)
    private conversationIntents: Map<string, ConversationIntent> = new Map();

    private constructor() {
        console.log('🔍 [MultiDocumentDetector] Initialized - Single source of truth for document detection');
    }

    /**
     * Get singleton instance
     */
    static getInstance(): MultiDocumentDetector {
        if (!MultiDocumentDetector.instance) {
            MultiDocumentDetector.instance = new MultiDocumentDetector();
        }
        return MultiDocumentDetector.instance;
    }

    // ==========================================================================
    // PUBLIC API
    // ==========================================================================

    /**
     * Detect multi-document intent from user request
     * Stores intent for later retrieval if follow-up messages come
     */
    detectFromUserRequest(
        userRequest: string,
        conversationId?: string
    ): MultiDocumentDetectionResult {
        console.log('🔍 [MultiDocumentDetector] Analyzing user request:', {
            length: userRequest.length,
            preview: userRequest.substring(0, 100),
            conversationId
        });

        const reasoning: string[] = [];
        let documentCount = 1;
        const documentTypes: string[] = [];

        // Strategy 1: Explicit count ("3 canvases", "three documents")
        const explicitCount = this.detectExplicitCount(userRequest);
        if (explicitCount.found) {
            documentCount = Math.max(documentCount, explicitCount.count);
            reasoning.push(`Explicit count detected: ${explicitCount.count} (${explicitCount.phrase})`);
        }

        // Strategy 2: Numbered list (1. Petition, 2. Letter, 3. Demand)
        const numberedDocs = this.detectNumberedList(userRequest);
        if (numberedDocs.length > 1) {
            documentCount = Math.max(documentCount, numberedDocs.length);
            documentTypes.push(...numberedDocs.map(d => d.type));
            reasoning.push(`Numbered list detected: ${numberedDocs.length} items`);
        }

        // Strategy 3: Comma/and separated ("petition, letter, and demand")
        const separatedDocs = this.detectSeparatedList(userRequest);
        if (separatedDocs.length > 1) {
            documentCount = Math.max(documentCount, separatedDocs.length);
            documentTypes.push(...separatedDocs.map(d => d.type));
            reasoning.push(`Separated list detected: ${separatedDocs.length} items`);
        }

        const isMultiDocument = documentCount > 1;

        // Store intent for later if conversation ID provided
        if (conversationId && isMultiDocument) {
            this.storeConversationIntent(conversationId, documentCount, documentTypes, userRequest);
        }

        console.log('🎯 [MultiDocumentDetector] User request analysis:', {
            isMultiDocument,
            documentCount,
            documentTypes,
            reasoning
        });

        return {
            isMultiDocument,
            documentCount,
            documents: [], // User request doesn't have actual content yet
            detectionSource: 'user_request',
            confidence: isMultiDocument ? 0.9 : 0.5,
            reasoning
        };
    }

    /**
     * Detect and extract documents from AI response content
     * This is the KEY FIX - previous system didn't check response headers
     */
    detectFromAIResponse(
        aiResponse: string,
        conversationId?: string
    ): MultiDocumentDetectionResult {
        console.log('🔍 [MultiDocumentDetector] Analyzing AI response:', {
            length: aiResponse.length,
            conversationId
        });

        const reasoning: string[] = [];
        const documents: DetectedDocument[] = [];

        // Strategy 1: Canvas N headers (Canvas 1:, Canvas 2:, etc.)
        const canvasHeaders = this.extractCanvasHeaders(aiResponse);
        if (canvasHeaders.length > 1) {
            documents.push(...canvasHeaders);
            reasoning.push(`Found ${canvasHeaders.length} Canvas headers`);
        }

        // Strategy 2: Document section headers (### Canvas 1:, ## Document 2:, #### Task 1:)
        const sectionHeaders = this.extractSectionHeaders(aiResponse);
        if (sectionHeaders.length > 1 && documents.length === 0) {
            documents.push(...sectionHeaders);
            reasoning.push(`Found ${sectionHeaders.length} section headers`);
        }

        // Strategy 2b: Task headers specifically (#### Task 1: Title)
        // AI commonly outputs this format - use simple focused detection
        if (documents.length === 0) {
            const taskHeaders = this.extractTaskHeaders(aiResponse);
            if (taskHeaders.length > 1) {
                documents.push(...taskHeaders);
                reasoning.push(`Found ${taskHeaders.length} Task headers (#### Task N:)`);
            }
        }

        // Strategy 2c: Numbered markdown headers (### 1. Title, ### 2. Title)
        // AI commonly outputs this format for multi-document responses
        if (documents.length === 0) {
            const numberedMarkdownHeaders = this.extractNumberedMarkdownHeaders(aiResponse);
            if (numberedMarkdownHeaders.length > 1) {
                documents.push(...numberedMarkdownHeaders);
                reasoning.push(`Found ${numberedMarkdownHeaders.length} numbered markdown headers (### N. Title)`);
            }
        }

        // Strategy 3: Numbered document sections (1. Demand Letter, 2. Petition)
        const numberedSections = this.extractNumberedSections(aiResponse);
        if (numberedSections.length > 1 && documents.length === 0) {
            documents.push(...numberedSections);
            reasoning.push(`Found ${numberedSections.length} numbered sections`);
        }

        // Strategy 4: Check conversation context (for follow-up messages)
        if (documents.length === 0 && conversationId) {
            const intent = this.getConversationIntent(conversationId);
            if (intent && !intent.fulfilled && intent.requestedDocumentCount > 1) {
                reasoning.push(`Using conversation context: ${intent.requestedDocumentCount} documents expected`);
                // Try to split by the expected document types
                const splitDocs = this.splitByExpectedTypes(aiResponse, intent.documentTypes);
                if (splitDocs.length > 0) {
                    documents.push(...splitDocs);
                    reasoning.push(`Split into ${splitDocs.length} documents using context`);
                }
            }
        }

        const isMultiDocument = documents.length > 1;

        console.log('🎯 [MultiDocumentDetector] AI response analysis:', {
            isMultiDocument,
            documentCount: documents.length,
            titles: documents.map(d => d.title),
            reasoning
        });

        return {
            isMultiDocument,
            documentCount: documents.length,
            documents,
            detectionSource: 'ai_response',
            confidence: isMultiDocument ? 0.95 : 0.5,
            reasoning
        };
    }

    /**
     * Combined detection from both user request and AI response
     * Use this as the primary method
     * 
     * KEY FEATURE: Respects user-requested count - if user says "3 canvases",
     * we limit to 3 even if AI generates more sections
     */
    detectMultiDocument(
        userRequest: string,
        aiResponse: string,
        conversationId?: string
    ): MultiDocumentDetectionResult {
        // First check user request for intent
        const userResult = this.detectFromUserRequest(userRequest, conversationId);

        // Get user-requested count (e.g., "3" from "I need 3 canvases")
        const requestedCount = userResult.documentCount;

        // Then check AI response for actual documents
        const aiResult = this.detectFromAIResponse(aiResponse, conversationId);

        // Combine results - prefer AI response if it has documents
        if (aiResult.isMultiDocument && aiResult.documents.length > 0) {
            let documents = aiResult.documents;
            const reasoning = [...userResult.reasoning, ...aiResult.reasoning];

            // 🎯 KEY FIX: Limit to user-requested count
            // If user said "3 canvases" but AI generated 15 sections, limit to 3
            if (requestedCount > 1 && documents.length > requestedCount) {
                console.log(`🎯 [MultiDocumentDetector] Limiting: User requested ${requestedCount}, AI generated ${documents.length}`);
                documents = documents.slice(0, requestedCount);
                reasoning.push(`Limited from ${aiResult.documents.length} to ${requestedCount} (user requested)`);
            }

            return {
                ...aiResult,
                documentCount: documents.length,
                documents,
                detectionSource: 'combined',
                reasoning
            };
        }

        // Fall back to treating as single document (entire response)
        if (userResult.isMultiDocument && aiResult.documents.length === 0) {
            // User wanted multiple but AI didn't structure them
            return {
                isMultiDocument: false,
                documentCount: 1,
                documents: [{
                    title: this.generateTitleFromRequest(userRequest),
                    content: aiResponse,
                    type: 'general',
                    canvasNumber: 1
                }],
                detectionSource: 'combined',
                confidence: 0.6,
                reasoning: [
                    ...userResult.reasoning,
                    'AI response not structured as multiple documents, treating as single'
                ]
            };
        }

        return aiResult;
    }

    /**
     * Get stored conversation intent
     */
    getConversationIntent(conversationId: string): ConversationIntent | undefined {
        return this.conversationIntents.get(conversationId);
    }

    /**
     * Mark conversation intent as fulfilled
     */
    markIntentFulfilled(conversationId: string): void {
        const intent = this.conversationIntents.get(conversationId);
        if (intent) {
            intent.fulfilled = true;
            console.log('✅ [MultiDocumentDetector] Intent fulfilled:', conversationId);
        }
    }

    // ==========================================================================
    // PRIVATE DETECTION STRATEGIES
    // ==========================================================================

    /**
     * Detect explicit count phrases ("3 canvases", "three documents")
     */
    private detectExplicitCount(text: string): { found: boolean; count: number; phrase: string } {
        const lowerText = text.toLowerCase();

        const numberWords: Record<string, number> = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
        };

        // Pattern: number word + canvas/document
        for (const [word, num] of Object.entries(numberWords)) {
            const pattern = new RegExp(`${word}\\s+(separate\\s+)?(canvases?|documents?|files?)`, 'i');
            if (pattern.test(lowerText)) {
                return { found: true, count: num, phrase: `${word} canvases/documents` };
            }
        }

        // Pattern: digit + canvas/document
        const digitMatch = lowerText.match(/(\d+)\s+(separate\s+)?(canvases?|documents?|files?)/i);
        if (digitMatch) {
            return { found: true, count: parseInt(digitMatch[1]), phrase: digitMatch[0] };
        }

        return { found: false, count: 1, phrase: '' };
    }

    /**
     * Detect numbered list (1. Petition, 2. Letter)
     */
    private detectNumberedList(text: string): Array<{ type: string; title: string }> {
        const results: Array<{ type: string; title: string }> = [];

        const pattern = /^\s*(\d+)[\.\)]\s*(?:a\s+)?([^,\n]{3,60})/gim;
        const matches = [...text.matchAll(pattern)];

        const documentKeywords = [
            'letter', 'petition', 'demand', 'motion', 'brief',
            'document', 'contract', 'agreement', 'settlement', 'complaint',
            'canvas', 'plan', 'response', 'memo', 'report'
        ];

        for (const match of matches) {
            const itemText = match[2].toLowerCase();
            if (documentKeywords.some(kw => itemText.includes(kw))) {
                results.push({
                    type: this.inferDocumentType(itemText),
                    title: match[2].trim()
                });
            }
        }

        return results;
    }

    /**
     * Detect comma/and separated list - ENHANCED
     * Now detects patterns like:
     * - "a petition for penalties and a plan of action"
     * - "petition, letter, and demand"
     * - "create a demand letter, also a settlement"
     */
    private detectSeparatedList(text: string): Array<{ type: string; title: string }> {
        const results: Array<{ type: string; title: string }> = [];
        const lowerText = text.toLowerCase();

        // Document keywords to look for
        const documentTypes = [
            'letter', 'petition', 'motion', 'brief', 'document',
            'agreement', 'contract', 'settlement', 'complaint',
            'plan', 'action', 'response', 'memo', 'report',
            'demand', 'canvas', 'template', 'follow.?up', 'schedule'
        ];

        // Strategy 1: Split by "and a", "also a", "plus a", "as well as a"
        const andAPattern = /(?:and\s+a|also\s+a|plus\s+a|as\s+well\s+as\s+a)\s+/gi;
        const andAParts = text.split(andAPattern).filter(p => p.trim().length > 5);

        if (andAParts.length > 1) {
            for (const part of andAParts) {
                const docType = documentTypes.find(dt => new RegExp(dt, 'i').test(part));
                if (docType) {
                    // Extract a clean title from the part
                    const title = this.extractDocumentTitle(part);
                    results.push({
                        type: this.inferDocumentType(part),
                        title
                    });
                }
            }

            if (results.length > 1) {
                console.log('🔍 [MultiDocumentDetector] detectSeparatedList: Found via "and a" split:', results.length);
                return results;
            }
        }

        // Strategy 2: Comma-separated with document keywords
        const commaParts = text.split(/,\s*/);
        if (commaParts.length > 1) {
            for (const part of commaParts) {
                const docType = documentTypes.find(dt => new RegExp(dt, 'i').test(part));
                if (docType) {
                    const title = this.extractDocumentTitle(part);
                    results.push({
                        type: this.inferDocumentType(part),
                        title
                    });
                }
            }

            if (results.length > 1) {
                console.log('🔍 [MultiDocumentDetector] detectSeparatedList: Found via comma split:', results.length);
                return results;
            }
        }

        // Strategy 3: Original regex pattern as fallback
        const pattern = /((?:demand\s+)?(?:letter|petition|motion|brief|document|agreement|contract|settlement)[^,]*)/gi;
        const matches = [...text.matchAll(pattern)];

        if (matches.length > 1) {
            for (const match of matches) {
                const title = match[1].trim();
                results.push({
                    type: this.inferDocumentType(title),
                    title
                });
            }
        }

        return results;
    }

    /**
     * Extract a clean document title from a phrase
     * E.g., "petition for penalties on unpaid ttd" -> "Petition for Penalties"
     */
    private extractDocumentTitle(phrase: string): string {
        // Clean up the phrase
        let clean = phrase
            .replace(/^(i\s+need|create|make|draft|write|prepare)\s+(to\s+|a\s+)?/i, '')
            .replace(/^(a|an|the)\s+/i, '')
            .replace(/\s+(for\s+me|please|asap|urgently)$/i, '')
            .trim();

        // Capitalize first letter of each word for title
        clean = clean.split(' ').slice(0, 5).join(' '); // Limit to 5 words
        return clean.charAt(0).toUpperCase() + clean.slice(1);
    }

    /**
     * Extract Canvas N: headers from AI response
     */
    private extractCanvasHeaders(response: string): DetectedDocument[] {
        const documents: DetectedDocument[] = [];

        // Pattern: Canvas 1: Title, Canvas 2: Title, etc.
        const pattern = /(?:^|\n)(###?\s*)?Canvas\s+(\d+)[:\s]*([^\n]+)?(?:\n([\s\S]*?)(?=(?:^|\n)(?:###?\s*)?Canvas\s+\d+|$))/gim;
        const matches = [...response.matchAll(pattern)];

        for (const match of matches) {
            const canvasNumber = parseInt(match[2]);
            const title = match[3]?.trim() || `Canvas ${canvasNumber}`;
            const content = match[4]?.trim() || '';

            documents.push({
                title: this.cleanTitle(title),
                content,
                type: this.inferDocumentType(title + ' ' + content),
                canvasNumber,
                startIndex: match.index,
                endIndex: match.index ? match.index + match[0].length : undefined
            });
        }

        return documents;
    }

    /**
     * Extract section headers (### Document 1, ## Section 2, #### Task 1)
     * KEY FIX: Added 'Task' pattern to detect AI output like '#### Task 1:'
     */
    private extractSectionHeaders(response: string): DetectedDocument[] {
        const documents: DetectedDocument[] = [];

        // Pattern handles markdown headers with document indicators
        // FIXED: Added 'Task' to the pattern to match '#### Task 1:', '#### Task 2:', etc.
        const pattern = /(?:^|\n)(#{1,4})\s*(?:Document|Section|Part|Canvas|Task)\s*(\d+)[:\s]*([^\n]*)?(?:\n([\s\S]*?)(?=(?:^|\n)#{1,4}\s*(?:Document|Section|Part|Canvas|Task)\s*\d+|$))/gim;
        const matches = [...response.matchAll(pattern)];

        console.log('🔍 [MultiDocumentDetector] Section header matches:', {
            patternUsed: 'Document|Section|Part|Canvas|Task',
            matchCount: matches.length,
            previewMatches: matches.slice(0, 3).map(m => ({
                full: m[0].substring(0, 50),
                number: m[2],
                title: m[3]?.substring(0, 30)
            }))
        });

        for (const match of matches) {
            const canvasNumber = parseInt(match[2]);
            const title = match[3]?.trim() || `Document ${canvasNumber}`;
            const content = match[4]?.trim() || '';

            documents.push({
                title: this.cleanTitle(title),
                content,
                type: this.inferDocumentType(title + ' ' + content),
                canvasNumber,
                startIndex: match.index,
                endIndex: match.index ? match.index + match[0].length : undefined
            });
        }

        return documents;
    }

    /**
     * Extract Task N: headers specifically (#### Task 1:, #### Task 2:)
     * AI commonly outputs this exact format - use simple focused detection
     * 
     * @example AI output:
     * ```
     * #### Task 1: Drafting a Demand Letter
     * Content for task 1...
     * 
     * #### Task 2: Preparing a Settlement
     * Content for task 2...
     * ```
     */
    private extractTaskHeaders(response: string): DetectedDocument[] {
        const documents: DetectedDocument[] = [];

        // Simple focused pattern: #### Task N: Title
        // Captures: task number, title, and content until next Task header
        const pattern = /(?:^|\n)(#{1,4})\s*Task\s*(\d+)\s*:\s*([^\n]+)(?:\n([\s\S]*?)(?=(?:^|\n)#{1,4}\s*Task\s*\d+|### Conclusion|$))/gim;
        const matches = [...response.matchAll(pattern)];

        console.log('🎯 [MultiDocumentDetector] Task header extraction:', {
            patternMatches: matches.length,
            preview: matches.slice(0, 3).map(m => ({
                number: m[2],
                title: m[3]?.substring(0, 40)
            }))
        });

        for (const match of matches) {
            const canvasNumber = parseInt(match[2]);
            const title = match[3]?.trim() || `Task ${canvasNumber}`;
            const content = match[4]?.trim() || '';

            // Only add if content has substance
            if (content.length > 50) {
                documents.push({
                    title: this.cleanTitle(title),
                    content,
                    type: this.inferDocumentType(title + ' ' + content),
                    canvasNumber,
                    startIndex: match.index,
                    endIndex: match.index ? match.index + match[0].length : undefined
                });
            }
        }

        return documents;
    }

    /**
     * Extract numbered markdown headers (### 1. Demand Letter, ### 2. Settlement)
     * This is the EXACT format AI commonly outputs for multi-document responses
     * 
     * @example AI output:
     * ```
     * ### 1. Demand Letter
     * Content for demand letter...
     * 
     * ### 2. Settlement Demand
     * Content for settlement...
     * 
     * ### 3. Letter to Dr. Daldalyan
     * Content for letter...
     * ```
     */
    private extractNumberedMarkdownHeaders(response: string): DetectedDocument[] {
        const documents: DetectedDocument[] = [];

        // Pattern: ### N. Title (with 1-4 hash marks, followed by a number and title)
        // Captures: number, title, and content until next numbered header or footer sections
        // FIX: Removed 'm' flag so '$' matches end of string, NOT end of line. Added [\r\n]+ for newline safety.
        const pattern = /(?:^|[\r\n]+)(#{1,4})\s*(\d+)\.\s+([^\r\n]+)(?:[\r\n]+([\s\S]*?)(?=(?:^|[\r\n]+)#{1,4}\s*\d+\.\s+|### Conclusion|This information is|$))/gi;
        const matches = [...response.matchAll(pattern)];

        console.log('🔢 [MultiDocumentDetector] Numbered markdown header extraction:', {
            patternMatches: matches.length,
            preview: matches.slice(0, 3).map(m => ({
                number: m[2],
                title: m[3]?.substring(0, 40)
            }))
        });

        // Only count if we have actual document-type sections
        const docKeywords = ['letter', 'petition', 'demand', 'motion', 'canvas', 'document', 'settlement', 'evaluation', 'report'];

        for (const match of matches) {
            const canvasNumber = parseInt(match[2]);
            const title = match[3]?.trim() || `Document ${canvasNumber}`;
            const content = match[4]?.trim() || '';

            // Check if this looks like a document section (has doc-related keywords)
            const hasDocKeyword = docKeywords.some(kw => title.toLowerCase().includes(kw));

            // Only add if content has substance AND looks like a document
            if (content.length > 100 || hasDocKeyword) {
                documents.push({
                    title: this.cleanTitle(title),
                    content,
                    type: this.inferDocumentType(title + ' ' + content),
                    canvasNumber,
                    startIndex: match.index,
                    endIndex: match.index ? match.index + match[0].length : undefined
                });
            }
        }

        console.log('🔢 [MultiDocumentDetector] Numbered markdown headers found:', documents.length);
        return documents;
    }

    /**
     * Extract numbered sections (1. Demand Letter \n content...)
     */
    private extractNumberedSections(response: string): DetectedDocument[] {
        const documents: DetectedDocument[] = [];

        // Pattern: 1. Title followed by content until next number
        const pattern = /(?:^|\n)(\d+)\.\s*([^\n]+)(?:\n([\s\S]*?)(?=(?:^|\n)\d+\.\s*[A-Z]|$))/gim;
        const matches = [...response.matchAll(pattern)];

        // Only count if we have actual document-type sections
        const docKeywords = ['letter', 'petition', 'demand', 'motion', 'canvas', 'document'];
        const validMatches = matches.filter(m =>
            docKeywords.some(kw => m[2].toLowerCase().includes(kw))
        );

        if (validMatches.length < 2) {
            return []; // Not enough document sections
        }

        for (const match of validMatches) {
            const canvasNumber = parseInt(match[1]);
            const title = match[2].trim();
            const content = match[3]?.trim() || '';

            documents.push({
                title: this.cleanTitle(title),
                content,
                type: this.inferDocumentType(title),
                canvasNumber,
                startIndex: match.index,
                endIndex: match.index ? match.index + match[0].length : undefined
            });
        }

        return documents;
    }

    /**
     * Split response by expected document types from conversation context
     */
    private splitByExpectedTypes(response: string, expectedTypes: string[]): DetectedDocument[] {
        const documents: DetectedDocument[] = [];

        for (let i = 0; i < expectedTypes.length; i++) {
            const type = expectedTypes[i];

            // Look for type keyword in response
            const regex = new RegExp(`(${type}[^\\n]*)(\\n[\\s\\S]*?)(?=${expectedTypes[i + 1] || '$'})`, 'i');
            const match = response.match(regex);

            if (match) {
                documents.push({
                    title: this.cleanTitle(match[1]),
                    content: match[2]?.trim() || '',
                    type: this.inferDocumentType(type),
                    canvasNumber: i + 1
                });
            }
        }

        return documents;
    }

    // ==========================================================================
    // UTILITY METHODS
    // ==========================================================================

    /**
     * Store conversation intent for multi-message support
     */
    private storeConversationIntent(
        conversationId: string,
        count: number,
        types: string[],
        originalRequest: string
    ): void {
        this.conversationIntents.set(conversationId, {
            conversationId,
            requestedDocumentCount: count,
            documentTypes: types,
            caseDetails: originalRequest,
            timestamp: new Date(),
            fulfilled: false
        });

        console.log('💾 [MultiDocumentDetector] Stored conversation intent:', {
            conversationId,
            count,
            types
        });
    }

    /**
     * Infer document type from text
     */
    private inferDocumentType(text: string): string {
        const lower = text.toLowerCase();

        if (lower.includes('petition')) return 'legal_petition';
        if (lower.includes('demand') && lower.includes('letter')) return 'demand_letter';
        if (lower.includes('settlement')) return 'settlement_demand';
        if (lower.includes('motion')) return 'legal_motion';
        if (lower.includes('letter')) return 'letter';
        if (lower.includes('plan')) return 'plan_of_action';
        if (lower.includes('contract')) return 'contract';
        if (lower.includes('agreement')) return 'agreement';

        return 'document';
    }

    /**
     * Clean title string
     */
    private cleanTitle(title: string): string {
        return title
            .replace(/^#+\s*/, '')
            .replace(/\*\*/g, '')
            .replace(/^\d+\.\s*/, '')
            .replace(/^Canvas\s*\d+[:\s]*/i, '')
            .trim() || 'Untitled Document';
    }

    /**
     * Generate title from user request
     */
    private generateTitleFromRequest(request: string): string {
        // Extract key document types
        const types = ['petition', 'letter', 'demand', 'motion', 'plan', 'agreement'];
        for (const type of types) {
            if (request.toLowerCase().includes(type)) {
                return `${type.charAt(0).toUpperCase() + type.slice(1)} Document`;
            }
        }
        return 'Work Product';
    }
}

// Export singleton getter
export const getMultiDocumentDetector = (): MultiDocumentDetector => {
    return MultiDocumentDetector.getInstance();
};
