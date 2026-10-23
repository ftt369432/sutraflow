/**
 * Smart Query Analyzer
 * 
 * Intelligently determines if a knowledge base should be used for a query
 * to optimize response times and resource usage.
 */

export interface QueryAnalysis {
  needsKnowledgeBase: boolean;
  confidence: number;
  reasoning: string;
  queryType: QueryType;
  complexity: QueryComplexity;
  suggestedModel: 'fast' | 'balanced' | 'comprehensive';
  fastPathEligible: boolean;
  correctedQuery?: string;
  correctionApplied: boolean;
}

export type QueryType = 
  | 'simple_chat'           // "Hello", "How are you?"
  | 'general_question'      // "What is X?", "How does Y work?"
  | 'document_creation'     // "Create a petition", "Draft a contract"
  | 'document_editing'      // "Change the name", "Add a section"
  | 'legal_advice'          // "What are my rights?", "Legal precedent"
  | 'technical_help'        // "How to code X", "Debug this error"
  | 'research_query'        // "Find information about", "Research topic"
  | 'task_assistance'       // "Help me with", specific work tasks
  | 'data_lookup'           // Looking for specific facts/documents
  | 'creative_writing';     // Stories, creative content

export type QueryComplexity = 'simple' | 'moderate' | 'complex';

export class QueryAnalyzer {
  
  /**
   * Main analysis function - determines if KB is needed
   */
  public analyzeQuery(query: string, context?: {
    hasActiveDocument?: boolean;
    conversationHistory?: any[];
    selectedAssistant?: any;
    userPreferences?: any;
  }): QueryAnalysis {
    
    // First, intelligently correct the query for better analysis
    const queryCorrection = this.correctQuery(query);
    const analyzedQuery = queryCorrection.correctedQuery;
    const normalizedQuery = analyzedQuery.toLowerCase().trim();
    
    // Fast-path patterns that never need KB
    if (this.isFastPathQuery(normalizedQuery)) {
      return {
        needsKnowledgeBase: false,
        confidence: 0.95,
        reasoning: 'Simple conversational query - fast path eligible',
        queryType: 'simple_chat',
        complexity: 'simple',
        suggestedModel: 'fast',
        fastPathEligible: true,
        correctedQuery: queryCorrection.correctionApplied ? analyzedQuery : undefined,
        correctionApplied: queryCorrection.correctionApplied
      };
    }
    
    // Analyze query characteristics
    const queryType = this.determineQueryType(normalizedQuery);
    const complexity = this.assessComplexity(normalizedQuery, queryType);
    const contextualFactors = this.analyzeContext(normalizedQuery, context);
    
    // Decision logic based on query type and context
    const kbDecision = this.makeKnowledgeBaseDecision(
      queryType, 
      complexity, 
      contextualFactors,
      normalizedQuery
    );
    
    return {
      needsKnowledgeBase: kbDecision.needed,
      confidence: kbDecision.confidence,
      reasoning: kbDecision.reasoning,
      queryType,
      complexity,
      suggestedModel: this.suggestModel(queryType, complexity, kbDecision.needed),
      fastPathEligible: !kbDecision.needed && complexity === 'simple',
      correctedQuery: queryCorrection.correctionApplied ? analyzedQuery : undefined,
      correctionApplied: queryCorrection.correctionApplied
    };
  }
  
  /**
   * Fast-path queries that never need knowledge base
   */
  private isFastPathQuery(query: string): boolean {
    const fastPathPatterns = [
      // Greetings and pleasantries
      /^(hi|hello|hey|good morning|good afternoon|good evening)$/,
      /^(how are you|how's it going|what's up)[\?]?$/,
      /^(thanks?|thank you|thx)$/,
      /^(bye|goodbye|see you|talk to you later)$/,
      
      // Simple confirmations and responses
      /^(yes|no|ok|okay|sure|alright)$/,
      /^(i see|got it|understood|makes sense)$/,
      
      // Very short questions
      /^(what|who|when|where|why|how)[\?]?$/,
      
      // Simple status checks
      /^(are you (there|ready|working))[\?]?$/,
      /^(can you (help|assist))[\?]?$/,
      
      // Basic math or definitions (general knowledge)
      /^(what is \d+[\+\-\*\/]\d+)[\?]?$/,
      /^(define \w+)$/,
    ];
    
    return fastPathPatterns.some(pattern => pattern.test(query));
  }
  
  /**
   * Determine the primary type of query
   */
  private determineQueryType(query: string): QueryType {
    // Document creation indicators
    if (this.hasPatterns(query, [
      /create?\w*\s+(a\s+)?(petition|contract|letter|document|report|proposal|memo|brief)/,
      /draft\w*\s+(a\s+)?(petition|contract|letter|document|report|proposal|memo|brief)/,
      /write\w*\s+(a\s+)?(petition|contract|letter|document|report|proposal|memo|brief)/,
      /prepare\w*\s+(a\s+)?(petition|contract|letter|document|report|proposal|memo|brief)/,
      /generate\w*\s+(a\s+)?(petition|contract|letter|document|report|proposal|memo|brief)/
    ])) {
      return 'document_creation';
    }
    
    // Document editing indicators
    if (this.hasPatterns(query, [
      /change\s+the\s+(name|date|address|title)/,
      /update\s+the\s+(name|date|address|title)/,
      /modify\s+the\s+(name|date|address|title)/,
      /edit\s+the\s+(name|date|address|title)/,
      /add\s+(a\s+)?(section|paragraph|clause|argument)/,
      /remove\s+the\s+(section|paragraph|clause|argument)/,
      /replace\s+.*\s+with/
    ])) {
      return 'document_editing';
    }
    
    // Legal advice indicators  
    if (this.hasPatterns(query, [
      /what are my (rights|options|legal)/,
      /(legal|law|statute|regulation|precedent|case law)/,
      /(sue|lawsuit|litigation|court|judge|attorney)/,
      /(contract|agreement|liability|damages|settlement)/,
      /(workers.{0,5}comp|disability|injury|medical)/
    ])) {
      return 'legal_advice';
    }
    
    // Research queries
    if (this.hasPatterns(query, [
      /research\w*\s+(about|on|regarding)/,
      /find\s+(information|data|details|facts)\s+(about|on|regarding)/,
      /what\s+(do\s+you\s+know|information|data)\s+(about|on|regarding)/,
      /tell me (about|regarding|concerning)/,
      /explain\s+(the|how|what|why)/
    ])) {
      return 'research_query';
    }
    
    // Technical help
    if (this.hasPatterns(query, [
      /(code|coding|programming|debug|error|bug|fix)/,
      /(javascript|typescript|react|node|python|sql)/,
      /(api|database|server|deployment|git)/,
      /how\s+to\s+(code|program|implement|setup|configure)/
    ])) {
      return 'technical_help';
    }
    
    // Task assistance
    if (this.hasPatterns(query, [
      /help\s+me\s+(with|to)/,
      /assist\s+me\s+(with|in)/,
      /guide\s+me\s+(through|on)/,
      /walk\s+me\s+through/,
      /show\s+me\s+how\s+to/
    ])) {
      return 'task_assistance';
    }
    
    // Data lookup
    if (this.hasPatterns(query, [
      /what\s+is\s+the\s+(status|value|amount|date|time)/,
      /show\s+me\s+(the|my)\s+(documents|files|data|records)/,
      /find\s+(the|my)\s+(document|file|record|email)/,
      /lookup\s+(the|my)/,
      /search\s+for\s+(the|my)/
    ])) {
      return 'data_lookup';
    }
    
    // Creative writing
    if (this.hasPatterns(query, [
      /write\s+(a\s+)?(story|poem|creative|fiction)/,
      /create\s+(a\s+)?(story|poem|creative|fiction)/,
      /tell\s+me\s+(a\s+)?(story|joke|tale)/,
      /(creative|fiction|narrative|plot|character)/
    ])) {
      return 'creative_writing';
    }
    
    // Default to general question
    return 'general_question';
  }
  
  /**
   * Assess query complexity
   */
  private assessComplexity(query: string, queryType: QueryType): QueryComplexity {
    const wordCount = query.split(/\s+/).length;
    const hasMultipleClauses = query.includes(' and ') || query.includes(' or ') || query.includes(',');
    const hasSpecificDetails = /\b(specific|detailed|comprehensive|thorough|complete)\b/.test(query);
    
    // Simple complexity
    if (wordCount <= 5 && !hasMultipleClauses && queryType === 'simple_chat') {
      return 'simple';
    }
    
    // Complex indicators
    if (wordCount > 20 || hasSpecificDetails || hasMultipleClauses) {
      return 'complex';
    }
    
    // Query type-based complexity
    if (['document_creation', 'legal_advice', 'research_query'].includes(queryType)) {
      return wordCount > 10 ? 'complex' : 'moderate';
    }
    
    if (['document_editing', 'data_lookup'].includes(queryType)) {
      return 'moderate';
    }
    
    return 'simple';
  }
  
  /**
   * Analyze contextual factors
   */
  private analyzeContext(query: string, context?: any): {
    hasRelevantDocs: boolean;
    isFollowUp: boolean;
    needsSpecialization: boolean;
    hasActiveWorkflow: boolean;
  } {
    return {
      hasRelevantDocs: context?.selectedAssistant?.knowledgeBase?.length > 0 || false,
      isFollowUp: context?.conversationHistory?.length > 2 || false,
      needsSpecialization: /\b(legal|medical|technical|financial|academic)\b/.test(query),
      hasActiveWorkflow: context?.hasActiveDocument || false
    };
  }
  
  /**
   * Make the final knowledge base decision
   */
  private makeKnowledgeBaseDecision(
    queryType: QueryType,
    complexity: QueryComplexity,
    context: any,
    query: string
  ): { needed: boolean; confidence: number; reasoning: string } {
    
    // Always use KB for these query types
    if (['document_creation', 'legal_advice', 'data_lookup'].includes(queryType)) {
      return {
        needed: true,
        confidence: 0.9,
        reasoning: `${queryType} requires specialized knowledge and templates`
      };
    }
    
    // Use KB for research if we have relevant documents
    if (queryType === 'research_query' && context.hasRelevantDocs) {
      return {
        needed: true,
        confidence: 0.85,
        reasoning: 'Research query with available knowledge base documents'
      };
    }
    
    // Use KB for complex queries with specialization needs
    if (complexity === 'complex' && context.needsSpecialization) {
      return {
        needed: true,
        confidence: 0.8,
        reasoning: 'Complex specialized query requiring domain knowledge'
      };
    }
    
    // Use KB for follow-up questions in active workflows
    if (context.hasActiveWorkflow && context.isFollowUp) {
      return {
        needed: true,
        confidence: 0.75,
        reasoning: 'Follow-up question in active document workflow'
      };
    }
    
    // Skip KB for simple general questions
    if (queryType === 'general_question' && complexity === 'simple') {
      return {
        needed: false,
        confidence: 0.85,
        reasoning: 'Simple general question can be answered without specialized knowledge'
      };
    }
    
    // Skip KB for creative writing
    if (queryType === 'creative_writing') {
      return {
        needed: false,
        confidence: 0.9,
        reasoning: 'Creative writing relies on general AI capabilities'
      };
    }
    
    // Skip KB for basic technical help without domain context
    if (queryType === 'technical_help' && !context.hasRelevantDocs) {
      return {
        needed: false,
        confidence: 0.7,
        reasoning: 'Technical question without domain-specific documentation'
      };
    }
    
    // Default moderate approach - use KB if available and query is moderate+
    if (context.hasRelevantDocs && complexity !== 'simple') {
      return {
        needed: true,
        confidence: 0.6,
        reasoning: 'Moderate query with available knowledge base'
      };
    }
    
    // Default: skip KB for efficiency
    return {
      needed: false,
      confidence: 0.7,
      reasoning: 'General query can be handled efficiently without knowledge base'
    };
  }
  
  /**
   * Suggest optimal model based on analysis
   */
  private suggestModel(queryType: QueryType, complexity: QueryComplexity, needsKB: boolean): 'fast' | 'balanced' | 'comprehensive' {
    if (!needsKB && complexity === 'simple') {
      return 'fast'; // Gemini Flash for speed
    }
    
    if (['document_creation', 'legal_advice'].includes(queryType) || complexity === 'complex') {
      return 'comprehensive'; // Gemini Pro for complex work
    }
    
    return 'balanced'; // Gemini 1.5 Pro for most cases
  }
  
  /**
   * Intelligently correct common spelling and grammar errors in queries
   */
  private correctQuery(query: string): { correctedQuery: string; correctionApplied: boolean } {
    let corrected = query;
    let correctionApplied = false;
    
    // Common spelling corrections for legal/business terms
    const spellingCorrections: Record<string, string> = {
      // Document types
      'cnavas': 'canvas',
      'canvases': 'canvases',
      'seperate': 'separate',
      'doucments': 'documents',
      'doucment': 'document',
      'documnet': 'document',
      'docuemnt': 'document',
      'owrkign': 'working',
      'wrokign': 'working',
      'workign': 'working',
      'wnated': 'wanted',
      'neeeed': 'needed',
      'recieve': 'receive',
      'recieved': 'received',
      
      // Legal terms
      'pettition': 'petition',
      'petittion': 'petition',
      'contrack': 'contract',
      'contrct': 'contract',
      'agrement': 'agreement',
      'agreeement': 'agreement',
      'bussiness': 'business',
      'buisness': 'business',
      'proffessional': 'professional',
      'profesional': 'professional',
      
      // Common words
      'definately': 'definitely',
      'definatly': 'definitely',
      'occured': 'occurred',
      'occurence': 'occurrence',
      'thier': 'their',
      'reccomend': 'recommend',
      'necesary': 'necessary',
      'neccessary': 'necessary',
      'sucessful': 'successful',
      'sucess': 'success',
      'seperately': 'separately',
      
      // Technical terms
      'javscript': 'javascript',
      'javascipt': 'javascript',
      'databse': 'database',
      'databae': 'database',
      'fucntion': 'function',
      'funciton': 'function',
      'varaible': 'variable',
      'variale': 'variable'
    };
    
    // Apply spelling corrections
    for (const [incorrect, correct] of Object.entries(spellingCorrections)) {
      const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
      if (regex.test(corrected)) {
        corrected = corrected.replace(regex, correct);
        correctionApplied = true;
      }
    }
    
    // Grammar corrections
    const grammarCorrections = [
      // Missing articles
      { pattern: /\bcreate\s+(petition|contract|letter|document|report)/gi, replacement: 'create a $1' },
      { pattern: /\bdraft\s+(petition|contract|letter|document|report)/gi, replacement: 'draft a $1' },
      { pattern: /\bwrite\s+(petition|contract|letter|document|report)/gi, replacement: 'write a $1' },
      
      // Capitalization fixes
      { pattern: /\bi\b/g, replacement: 'I' },
      
      // Multiple spaces/punctuation cleanup
      { pattern: /\s+/g, replacement: ' ' },
      { pattern: /\s+([.!?])/g, replacement: '$1' },
      { pattern: /([.!?])\s*([.!?])+/g, replacement: '$1' },
      
      // Question marks
      { pattern: /(\w)\?+/g, replacement: '$1?' },
      
      // Common phrase corrections
      { pattern: /\bhow to\s+/gi, replacement: 'how to ' },
      { pattern: /\bwhat is\s+/gi, replacement: 'what is ' },
      { pattern: /\bcan you\s+/gi, replacement: 'can you ' },
    ];
    
    for (const correction of grammarCorrections) {
      const beforeCorrection = corrected;
      corrected = corrected.replace(correction.pattern, correction.replacement);
      if (corrected !== beforeCorrection) {
        correctionApplied = true;
      }
    }
    
    // Trim and clean final result
    corrected = corrected.trim();
    
    // If no corrections were applied, return original
    if (!correctionApplied) {
      return { correctedQuery: query, correctionApplied: false };
    }
    
    console.log(`🔤 Query corrected: "${query}" → "${corrected}"`);
    
    return { correctedQuery: corrected, correctionApplied: true };
  }

  /**
   * Helper method to check multiple patterns
   */
  private hasPatterns(text: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(text));
  }
  
  /**
   * Performance metrics for optimization
   */
  public recordQueryPerformance(query: string, analysis: QueryAnalysis, responseTime: number, userSatisfaction?: number): void {
    // Store metrics for future optimization
    const metrics = {
      query: query.substring(0, 100), // First 100 chars for privacy
      analysis,
      responseTime,
      userSatisfaction,
      timestamp: new Date().toISOString()
    };
    
    // Store in localStorage for now (could be sent to analytics service)
    try {
      const existing = JSON.parse(localStorage.getItem('queryAnalytics') || '[]');
      existing.push(metrics);
      
      // Keep only last 1000 entries
      if (existing.length > 1000) {
        existing.splice(0, existing.length - 1000);
      }
      
      localStorage.setItem('queryAnalytics', JSON.stringify(existing));
    } catch (error) {
      console.warn('Failed to store query analytics:', error);
    }
  }
  
  /**
   * Get optimization insights from stored metrics
   */
  public getOptimizationInsights(): {
    fastPathAccuracy: number;
    kbPrecision: number;
    averageResponseTime: { withKB: number; withoutKB: number };
    recommendations: string[];
  } {
    try {
      const metrics = JSON.parse(localStorage.getItem('queryAnalytics') || '[]');
      
      if (metrics.length < 10) {
        return {
          fastPathAccuracy: 0,
          kbPrecision: 0,
          averageResponseTime: { withKB: 0, withoutKB: 0 },
          recommendations: ['Need more data for optimization insights']
        };
      }
      
      // Calculate metrics...
      const withKB = metrics.filter((m: any) => m.analysis.needsKnowledgeBase);
      const withoutKB = metrics.filter((m: any) => !m.analysis.needsKnowledgeBase);
      
      return {
        fastPathAccuracy: withoutKB.filter((m: any) => (m.userSatisfaction || 0) > 3).length / withoutKB.length,
        kbPrecision: withKB.filter((m: any) => (m.userSatisfaction || 0) > 3).length / withKB.length,
        averageResponseTime: {
          withKB: withKB.reduce((sum: number, m: any) => sum + m.responseTime, 0) / withKB.length,
          withoutKB: withoutKB.reduce((sum: number, m: any) => sum + m.responseTime, 0) / withoutKB.length
        },
        recommendations: this.generateRecommendations(metrics)
      };
    } catch (error) {
      console.error('Failed to analyze query metrics:', error);
      return {
        fastPathAccuracy: 0,
        kbPrecision: 0,
        averageResponseTime: { withKB: 0, withoutKB: 0 },
        recommendations: ['Error analyzing metrics']
      };
    }
  }
  
  private generateRecommendations(metrics: any[]): string[] {
    const recommendations: string[] = [];
    
    // Analyze patterns and suggest improvements
    const lowSatisfactionWithKB = metrics.filter(m => m.analysis.needsKnowledgeBase && (m.userSatisfaction || 0) < 3);
    const highSatisfactionWithoutKB = metrics.filter(m => !m.analysis.needsKnowledgeBase && (m.userSatisfaction || 0) > 4);
    
    if (lowSatisfactionWithKB.length > metrics.length * 0.2) {
      recommendations.push('Consider improving knowledge base relevance or reduce KB usage for certain query types');
    }
    
    if (highSatisfactionWithoutKB.length > metrics.length * 0.6) {
      recommendations.push('Fast-path routing is working well - consider expanding fast-path patterns');
    }
    
    return recommendations;
  }
}

// Singleton instance for global use
export const queryAnalyzer = new QueryAnalyzer();