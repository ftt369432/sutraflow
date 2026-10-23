/**
 * 🏷️ Task Title Generator - Intelligent Title Generation
 * 
 * ELITE ENGINEERING: Google-level code quality
 * - Generates meaningful titles from user requests (not raw prompts)
 * - Context-aware based on document types and case details
 * - Clean, testable implementation
 * 
 * @author GenieFlow AI
 * @version 2.0.0
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Result of title generation
 */
export interface TitleGenerationResult {
    title: string;
    subtitle?: string;
    tags: string[];
    confidence: number;
}

/**
 * Context for title generation
 */
export interface TitleContext {
    documentTypes?: string[];
    clientName?: string;
    caseType?: string;
    industry?: string;
    documentCount?: number;
}

// ============================================================================
// TASK TITLE GENERATOR - Clean implementation
// ============================================================================

/**
 * Generates intelligent task titles from user requests
 * 
 * @example
 * ```typescript
 * const generator = TaskTitleGenerator.getInstance();
 * const result = generator.generateTitle(
 *   "ok i need 3 canvases for sample work comp case...",
 *   { documentCount: 3 }
 * );
 * // Returns: { title: "Sample Applicant - Work Comp (3 Documents)", ... }
 * ```
 */
export class TaskTitleGenerator {
    private static instance: TaskTitleGenerator | null = null;

    private constructor() {
        console.log('🏷️ [TaskTitleGenerator] Initialized');
    }

    /**
     * Get singleton instance
     */
    static getInstance(): TaskTitleGenerator {
        if (!TaskTitleGenerator.instance) {
            TaskTitleGenerator.instance = new TaskTitleGenerator();
        }
        return TaskTitleGenerator.instance;
    }

    /**
     * Generate intelligent title from user request
     */
    generateTitle(
        userRequest: string,
        context?: TitleContext
    ): TitleGenerationResult {
        console.log('🏷️ [TaskTitleGenerator] Generating title from:', {
            requestLength: userRequest.length,
            context
        });

        // Extract components
        const clientName = this.extractClientName(userRequest) || context?.clientName;
        const caseType = this.extractCaseType(userRequest) || context?.caseType;
        const documentTypes = context?.documentTypes || this.extractDocumentTypes(userRequest);
        const documentCount = context?.documentCount || documentTypes.length;

        // Build title
        let title = '';
        const tags: string[] = [];

        // Add client name if found
        if (clientName) {
            title = clientName;
            tags.push('client');
        }

        // Add case type
        if (caseType) {
            title += title ? ` - ${caseType}` : caseType;
            tags.push(caseType.toLowerCase().replace(/\s+/g, '_'));
        }

        // Add document count if multiple
        if (documentCount > 1) {
            title += title ? ` (${documentCount} Documents)` : `${documentCount} Documents`;
            tags.push('multi_doc');
        } else if (documentTypes.length === 1) {
            // Single document - use type as title
            const docType = this.capitalizeDocType(documentTypes[0]);
            title = title ? `${title} - ${docType}` : docType;
        }

        // Fallback if no title generated
        if (!title) {
            title = this.generateFallbackTitle(userRequest);
        }

        // Generate subtitle from document types
        const subtitle = documentTypes.length > 0
            ? documentTypes.map(d => this.capitalizeDocType(d)).join(', ')
            : undefined;

        console.log('✅ [TaskTitleGenerator] Generated:', { title, subtitle, tags });

        return {
            title,
            subtitle,
            tags,
            confidence: this.calculateConfidence(clientName, caseType, documentTypes)
        };
    }

    /**
     * Generate title specifically for a canvas/document
     */
    generateCanvasTitle(
        documentType: string,
        canvasNumber: number,
        totalCanvases: number,
        context?: TitleContext
    ): string {
        const docType = this.capitalizeDocType(documentType);

        if (totalCanvases > 1 && context?.clientName) {
            return `${context.clientName} - ${docType}`;
        }

        return docType;
    }

    // ==========================================================================
    // PRIVATE EXTRACTION METHODS
    // ==========================================================================

    /**
     * Extract client/person name from request
     */
    private extractClientName(text: string): string | null {
        // Pattern: "for [Name]", "[Name] case", "[Name]'s case"
        const patterns = [
            /for\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
            /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*(?:'s\s+)?case/i,
            /client\s*(?:is\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
            /(?:john|jane|mr\.|mrs\.|ms\.)\s+([a-z]+)/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                const name = match[1].trim();
                // Validate it's not a common word
                if (!this.isCommonWord(name)) {
                    return this.capitalizeName(name);
                }
            }
        }

        return null;
    }

    /**
     * Extract case type from request
     */
    private extractCaseType(text: string): string | null {
        const lowerText = text.toLowerCase();

        const caseTypes: Record<string, string> = {
            'work comp': 'Work Comp',
            'workers comp': 'Work Comp',
            'worker\'s comp': 'Work Comp',
            'wrongful termination': 'Wrongful Termination',
            'personal injury': 'Personal Injury',
            'employment': 'Employment',
            'discrimination': 'Discrimination',
            'harassment': 'Harassment',
            'contract': 'Contract',
            'civil': 'Civil',
            'medical': 'Medical',
            'product defect': 'Product Liability'
        };

        for (const [keyword, displayName] of Object.entries(caseTypes)) {
            if (lowerText.includes(keyword)) {
                return displayName;
            }
        }

        return null;
    }

    /**
     * Extract document types from request
     */
    private extractDocumentTypes(text: string): string[] {
        const lowerText = text.toLowerCase();
        const types: string[] = [];

        const documentKeywords: Record<string, string> = {
            'demand letter': 'demand_letter',
            'letter': 'letter',
            'petition': 'petition',
            'settlement': 'settlement_demand',
            'plan of action': 'plan_of_action',
            'motion': 'motion',
            'brief': 'brief',
            'contract': 'contract',
            'agreement': 'agreement',
            'complaint': 'complaint',
            'response': 'response',
            'memo': 'memo'
        };

        for (const [keyword, type] of Object.entries(documentKeywords)) {
            if (lowerText.includes(keyword) && !types.includes(type)) {
                types.push(type);
            }
        }

        return types;
    }

    /**
     * Generate fallback title when nothing else works
     */
    private generateFallbackTitle(request: string): string {
        // Take first meaningful segment
        const cleaned = request
            .replace(/^(?:ok|please|can you|i need|create|make|draft)\s*/i, '')
            .replace(/\s*(?:please|thanks|thank you)$/i, '')
            .trim();

        if (cleaned.length > 50) {
            return cleaned.substring(0, 47) + '...';
        }

        return cleaned || 'New Task';
    }

    // ==========================================================================
    // UTILITY METHODS
    // ==========================================================================

    /**
     * Capitalize document type for display
     */
    private capitalizeDocType(type: string): string {
        return type
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Capitalize name properly
     */
    private capitalizeName(name: string): string {
        return name
            .split(' ')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(' ');
    }

    /**
     * Check if word is common (not a name)
     */
    private isCommonWord(word: string): boolean {
        const commonWords = [
            'the', 'for', 'and', 'but', 'with', 'that', 'this',
            'case', 'document', 'create', 'make', 'need', 'want',
            'petition', 'letter', 'demand', 'motion', 'brief'
        ];
        return commonWords.includes(word.toLowerCase());
    }

    /**
     * Calculate confidence score
     */
    private calculateConfidence(
        clientName: string | null,
        caseType: string | null,
        documentTypes: string[]
    ): number {
        let score = 0.3;

        if (clientName) score += 0.3;
        if (caseType) score += 0.2;
        if (documentTypes.length > 0) score += 0.2;

        return Math.min(score, 1.0);
    }
}

// Export singleton getter
export const getTaskTitleGenerator = (): TaskTitleGenerator => {
    return TaskTitleGenerator.getInstance();
};
