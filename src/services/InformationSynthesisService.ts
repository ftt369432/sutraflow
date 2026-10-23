import { supabase } from '../lib/supabase';
import { AIService } from './ai/aiService';
import { DocumentService } from './documents/documentService';
import { EmailService } from './email/emailService';
import { CalendarService } from './calendar/calendarService';
import { ContactService } from './contacts/contactService';

export interface SynthesisRequest {
  query: string;
  sources: SynthesisSource[];
  context?: Record<string, any>;
  userId: string;
  maxResults?: number;
  includeMetadata?: boolean;
}

export interface SynthesisSource {
  type: 'documents' | 'emails' | 'calendar' | 'contacts' | 'knowledge_base' | 'web' | 'custom';
  filters?: Record<string, any>;
  weight?: number; // 0-1, importance of this source
  timeRange?: {
    start?: Date;
    end?: Date;
  };
}

export interface SynthesisResult {
  synthesizedInsight: string;
  confidence: number;
  sources: SourceResult[];
  metadata: {
    totalSources: number;
    processingTime: number;
    queryComplexity: 'low' | 'medium' | 'high';
    synthesisMethod: string;
  };
  relatedQueries?: string[];
  actionableItems?: ActionableItem[];
}

export interface SourceResult {
  type: string;
  data: any;
  relevance: number;
  metadata: Record<string, any>;
  snippet?: string;
}

export interface ActionableItem {
  type: 'task' | 'reminder' | 'follow_up' | 'research' | 'decision';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  suggestedDueDate?: Date;
  relatedData?: any;
}

export class InformationSynthesisService {
  private aiService: AIService;
  private documentService: DocumentService;
  private emailService: EmailService;
  private calendarService: CalendarService;
  private contactService: ContactService;

  constructor() {
    // @ts-ignore - temporary fix for getInstance async
    this.aiService = AIService.getInstance();
    this.documentService = new DocumentService();
    // @ts-ignore - temporary fix for getInstance
    this.emailService = EmailService.getInstance();
    this.calendarService = new CalendarService();
    this.contactService = new ContactService();
  }

  /**
   * Main synthesis method that combines data from multiple sources
   */
  async synthesizeInformation(request: SynthesisRequest): Promise<SynthesisResult> {
    const startTime = Date.now();
    
    try {
      console.log('Starting information synthesis for query:', request.query);
      
      // Step 1: Analyze query complexity and intent
      const queryAnalysis = await this.analyzeQuery(request.query);
      
      // Step 2: Gather data from all specified sources
      const sourceResults = await this.gatherFromSources(request);
      
      // Step 3: Rank and filter results by relevance
      const rankedResults = await this.rankResults(sourceResults, request.query);
      
      // Step 4: Synthesize information using AI
      const synthesizedInsight = await this.synthesizeWithAI(
        request.query,
        rankedResults,
        queryAnalysis,
        request.context
      );
      
      // Step 5: Extract actionable items
        const actionableItems = await this.extractActionableItems(
          synthesizedInsight.insight,
          rankedResults
        );
      
      // Step 6: Generate related queries
      const relatedQueries = await this.generateRelatedQueries(
        request.query,
        // @ts-ignore - temporary fix
        synthesizedInsight
      );
      
      const processingTime = Date.now() - startTime;
      
      return {
        synthesizedInsight: synthesizedInsight.insight,
        confidence: synthesizedInsight.confidence,
        sources: rankedResults,
        metadata: {
          totalSources: sourceResults.length,
          processingTime,
          queryComplexity: queryAnalysis.complexity,
          synthesisMethod: 'ai_enhanced_multi_source'
        },
        relatedQueries,
        actionableItems
      };
      
    } catch (error) {
      console.error('Error in information synthesis:', error);
        if (error instanceof Error) {
          throw new Error(`Information synthesis failed: ${error.message}`);
        } else {
          throw new Error('Information synthesis failed: Unknown error');
        }
    }
  }

  /**
   * Analyze query to understand intent and complexity
   */
  private async analyzeQuery(query: string): Promise<{
    intent: string;
    complexity: 'low' | 'medium' | 'high';
    keywords: string[];
    entities: string[];
    timeContext?: string;
  }> {
    const analysisPrompt = `
Analyze this query and provide structured information:
Query: "${query}"

Provide analysis in JSON format:
{
  "intent": "research|summary|comparison|planning|decision|status|analysis",
  "complexity": "low|medium|high",
  "keywords": ["key", "terms", "extracted"],
  "entities": ["people", "places", "organizations", "dates"],
  "timeContext": "past|present|future|specific_date"
}

Consider:
- Intent: What is the user trying to accomplish?
- Complexity: How many sources/steps needed?
- Keywords: Most important terms for search
- Entities: Named entities that might be relevant
- Time context: When is this query focused?
`;

    try {
      const response = await this.aiService.generateText(analysisPrompt);
      return JSON.parse(response);
    } catch (error) {
      console.warn('Query analysis failed, using fallback:', error);
      return {
        intent: 'research',
        complexity: 'medium',
        keywords: query.split(' ').filter(word => word.length > 3),
        entities: [],
        timeContext: 'present'
      };
    }
  }

  /**
   * Gather data from all specified sources
   */
  private async gatherFromSources(request: SynthesisRequest): Promise<SourceResult[]> {
    const gatherPromises = request.sources.map(source => 
      this.gatherFromSource(source, request.query, request.userId)
    );
    
    const results = await Promise.allSettled(gatherPromises);
    
    return results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<SourceResult[]>).value)
      .flat();
  }

  /**
   * Gather data from a single source
   */
  private async gatherFromSource(
    source: SynthesisSource,
    query: string,
    userId: string
  ): Promise<SourceResult[]> {
    const maxResults = 10;
    
    try {
      switch (source.type) {
        case 'documents':
          return await this.gatherFromDocuments(query, userId, source, maxResults);
        
        case 'emails':
          return await this.gatherFromEmails(query, userId, source, maxResults);
        
        case 'calendar':
          return await this.gatherFromCalendar(query, userId, source, maxResults);
        
        case 'contacts':
          return await this.gatherFromContacts(query, userId, source, maxResults);
        
        case 'knowledge_base':
          return await this.gatherFromKnowledgeBase(query, userId, source, maxResults);
        
        default:
          console.warn(`Unknown source type: ${source.type}`);
          return [];
      }
    } catch (error) {
      console.error(`Error gathering from ${source.type}:`, error);
      return [];
    }
  }

  /**
   * Gather from documents
   */
  private async gatherFromDocuments(
    query: string,
    userId: string,
    source: SynthesisSource,
    maxResults: number
  ): Promise<SourceResult[]> {
    try {
      // @ts-ignore - temporary fix
      const searchResults = await this.documentService.searchDocuments(
        query,
        userId,
        maxResults
      );
      
      return searchResults.map((doc: any) => ({
        type: 'document',
        data: doc,
        relevance: doc.relevance || 0.5,
        metadata: {
          title: doc.name,
          type: doc.type,
          createdAt: doc.createdAt,
          size: doc.size
        },
        snippet: doc.content?.substring(0, 200) + '...'
      }));
    } catch (error) {
      console.error('Error gathering from documents:', error);
      return [];
    }
  }

  /**
   * Gather from emails
   */
  private async gatherFromEmails(
    query: string,
    userId: string,
    source: SynthesisSource,
    maxResults: number
  ): Promise<SourceResult[]> {
    try {
      // @ts-ignore - temporary fix
      const searchResults = await this.emailService.getEmails({ query, maxResults });
      return searchResults.messages.map((email: any) => ({
        type: 'email',
        data: email,
        relevance: email.relevance || 0.5,
        metadata: {
          subject: email.subject,
          from: email.from,
          date: email.date,
          folder: email.folder
        },
        snippet: email.snippet || email.body?.substring(0, 200) + '...'
      }));
    } catch (error) {
      console.error('Error gathering from emails:', error);
      return [];
    }
  }

  /**
   * Gather from calendar
   */
  private async gatherFromCalendar(
    query: string,
    userId: string,
    source: SynthesisSource,
    maxResults: number
  ): Promise<SourceResult[]> {
    try {
      const timeRange = source.timeRange || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)    // 30 days ahead
      };
      
      // @ts-ignore - temporary fix
      const events = await this.calendarService.searchEvents(
        query,
        userId,
        timeRange.start,
        timeRange.end,
        maxResults
      );
      return events.map((event: any) => ({
        type: 'calendar',
        data: event,
        relevance: event.relevance || 0.5,
        metadata: {
          title: event.title,
          start: event.start,
          end: event.end,
          location: event.location
        },
        snippet: event.description?.substring(0, 200) + '...'
      }));
    } catch (error) {
      console.error('Error gathering from calendar:', error);
      return [];
    }
  }

  /**
   * Gather from contacts
   */
  private async gatherFromContacts(
    query: string,
    userId: string,
    source: SynthesisSource,
    maxResults: number
  ): Promise<SourceResult[]> {
    try {
      // @ts-ignore - temporary fix
      const contacts = await this.contactService.fetchContacts();
      return contacts.map((contact: any) => ({
        type: 'contact',
        data: contact,
        relevance: 0.7, // Contacts are usually highly relevant when matched
        metadata: {
          name: contact.name,
          company: contact.company,
          title: contact.title,
          lastContact: contact.lastContact
        },
        snippet: `${contact.name} - ${contact.company || ''} ${contact.title || ''}`
      }));
    } catch (error) {
      console.error('Error gathering from contacts:', error);
      return [];
    }
  }

  /**
   * Gather from knowledge base
   */
  private async gatherFromKnowledgeBase(
    query: string,
    userId: string,
    source: SynthesisSource,
    maxResults: number
  ): Promise<SourceResult[]> {
    try {
      const { data: results, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('user_id', userId)
        .textSearch('content', query)
        .limit(maxResults);
      
      if (error) throw error;
      
      return (results || []).map(item => ({
        type: 'knowledge_base',
        data: item,
        relevance: 0.8, // Knowledge base items are usually highly relevant
        metadata: {
          title: item.title,
          category: item.category,
          tags: item.tags,
          createdAt: item.created_at
        },
        snippet: item.content?.substring(0, 200) + '...'
      }));
    } catch (error) {
      console.error('Error gathering from knowledge base:', error);
      return [];
    }
  }

  /**
   * Rank results by relevance
   */
  private async rankResults(
    results: SourceResult[],
    query: string
  ): Promise<SourceResult[]> {
    // Sort by relevance score, then by recency
    return results
      .sort((a, b) => {
        // Primary sort: relevance
        if (b.relevance !== a.relevance) {
          return b.relevance - a.relevance;
        }
        
        // Secondary sort: recency (if available)
        const aDate = new Date(a.metadata.createdAt || a.metadata.date || 0);
        const bDate = new Date(b.metadata.createdAt || b.metadata.date || 0);
        return bDate.getTime() - aDate.getTime();
      })
      .slice(0, 20); // Limit to top 20 results
  }

  /**
   * Synthesize information using AI
   */
  private async synthesizeWithAI(
    query: string,
    results: SourceResult[],
    queryAnalysis: any,
    context?: Record<string, any>
  ): Promise<{ insight: string; confidence: number }> {
    const synthesisPrompt = `
You are an intelligent information synthesis assistant. Your task is to analyze multiple data sources and provide a comprehensive, actionable insight.

Original Query: "${query}"
Query Intent: ${queryAnalysis.intent}
Query Complexity: ${queryAnalysis.complexity}

Available Data Sources (${results.length} items):
${results.map((result, index) => `
${index + 1}. [${result.type.toUpperCase()}] (Relevance: ${result.relevance})
   ${result.metadata.title || result.metadata.subject || 'Untitled'}
   ${result.snippet || ''}
`).join('\n')}

Context: ${context ? JSON.stringify(context, null, 2) : 'None provided'}

Please provide a comprehensive synthesis that:
1. Directly answers the original query
2. Integrates insights from multiple sources
3. Identifies patterns and connections
4. Provides actionable recommendations
5. Acknowledges any limitations or gaps

Format your response as JSON:
{
  "insight": "Your comprehensive synthesis here...",
  "confidence": 0.85,
  "keyFindings": ["finding1", "finding2", "finding3"],
  "limitations": ["limitation1", "limitation2"],
  "recommendations": ["rec1", "rec2", "rec3"]
}

Confidence should be 0.0-1.0 based on:
- Quality and quantity of sources
- Consistency of information
- Completeness of the answer
`;

    try {
      const response = await this.aiService.generateText(synthesisPrompt);
      const parsed = JSON.parse(response);
      
      return {
        insight: parsed.insight,
        confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1)
      };
    } catch (error) {
      console.error('AI synthesis failed:', error);
      
      // Fallback: simple concatenation
      const fallbackInsight = `Based on ${results.length} sources, here's what I found regarding "${query}":\n\n` +
        results.slice(0, 5).map(r => `• ${r.snippet}`).join('\n');
      
      return {
        insight: fallbackInsight,
        confidence: 0.3
      };
    }
  }

  /**
   * Extract actionable items from synthesis
   */
  private async extractActionableItems(
    synthesizedInsight: string,
    results: SourceResult[]
  ): Promise<ActionableItem[]> {
    const extractionPrompt = `
Analyze this synthesized insight and extract actionable items:

Insight: "${synthesizedInsight}"

Extract actionable items in JSON format:
[
  {
    "type": "task|reminder|follow_up|research|decision",
    "title": "Brief title",
    "description": "Detailed description",
    "priority": "low|medium|high",
    "suggestedDueDate": "2024-01-15T10:00:00Z" // if applicable
  }
]

Focus on:
- Concrete actions the user can take
- Follow-up items mentioned
- Decisions that need to be made
- Research gaps to fill
- Time-sensitive items
`;

    try {
      const response = await this.aiService.generateText(extractionPrompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Actionable item extraction failed:', error);
      return [];
    }
  }

  /**
   * Generate related queries
   */
  private async generateRelatedQueries(
    originalQuery: string,
    synthesizedInsight: string
  ): Promise<string[]> {
    const relatedPrompt = `
Based on the original query and synthesized insight, suggest 3-5 related queries that the user might find helpful:

Original Query: "${originalQuery}"
Synthesized Insight: "${synthesizedInsight}"

Provide related queries as a JSON array:
["Related query 1", "Related query 2", "Related query 3"]

Focus on:
- Deeper exploration of topics mentioned
- Adjacent areas of interest
- Follow-up questions
- Different perspectives on the same topic
`;

    try {
      const response = await this.aiService.generateText(relatedPrompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Related query generation failed:', error);
      return [];
    }
  }

  /**
   * Quick synthesis for simple queries
   */
  async quickSynthesize(
    query: string,
    userId: string,
    sourceTypes: string[] = ['documents', 'emails', 'knowledge_base']
  ): Promise<SynthesisResult> {
    const sources: SynthesisSource[] = sourceTypes.map(type => ({
      type: type as any,
      weight: 1.0
    }));

    return this.synthesizeInformation({
      query,
      sources,
      userId,
      maxResults: 5
    });
  }
} 