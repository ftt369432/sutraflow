/**
 * 🎤 Voice-to-SQL Engine - Contest Feature
 * 
 * Revolutionary natural language to Snowflake SQL translation engine
 * with AI optimization, cost analysis, and voice-driven data exploration.
 * 
 * Core contest differentiator for GenieFlow AI platform.
 */

import { AIService } from '../AIService';
import { SnowflakeService } from '../integrations/SnowflakeService';

// Voice-to-SQL Core Types
export interface VoiceCommand {
  id: string;
  originalVoice: string;
  transcript: string;
  intent: QueryIntent;
  confidence: number;
  timestamp: Date;
  userId?: string;
}

export interface QueryIntent {
  type: 'select' | 'aggregate' | 'filter' | 'join' | 'analyze' | 'explore';
  entities: string[];
  timeframe?: string;
  metrics?: string[];
  dimensions?: string[];
  filters?: Record<string, any>;
}

export interface SQLTranslation {
  sql: string;
  confidence: number;
  explanation: string;
  optimization: {
    original: string;
    optimized: string;
    improvementReason: string;
    costSavings: number;
    performanceGain: number;
  };
  executionPlan: {
    estimatedCost: number;
    estimatedTime: number;
    complexity: 'low' | 'medium' | 'high';
    warnings?: string[];
  };
}

export interface VoiceToSQLResult {
  voiceCommand: VoiceCommand;
  translation: SQLTranslation;
  executionResult?: {
    data: any[];
    metadata: {
      rowCount: number;
      executionTime: number;
      actualCost: number;
      cacheHit: boolean;
    };
  };
  suggestions: string[];
}

// Database Schema Intelligence
export interface DatabaseSchema {
  tables: TableInfo[];
  relationships: Relationship[];
  commonPatterns: QueryPattern[];
}

export interface TableInfo {
  name: string;
  schema: string;
  columns: ColumnInfo[];
  sampleData?: any[];
  description?: string;
  usage: {
    frequency: number;
    commonQueries: string[];
  };
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  description?: string;
  sampleValues?: any[];
  statistics?: {
    distinctCount: number;
    nullPercentage: number;
    minValue?: any;
    maxValue?: any;
  };
}

export interface Relationship {
  fromTable: string;
  toTable: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many' | 'many-to-one';
  joinCondition: string;
}

export interface QueryPattern {
  pattern: string;
  description: string;
  example: string;
  frequency: number;
  performance: 'fast' | 'medium' | 'slow';
}

/**
 * Voice-to-SQL Engine - Revolutionary Contest Feature
 */
export class VoiceToSQLEngine {
  private aiService: AIService;
  private snowflakeService: SnowflakeService;
  private schemaIntelligence: DatabaseSchema | null = null;
  private queryCache: Map<string, SQLTranslation> = new Map();
  private voiceHistory: VoiceCommand[] = [];

  constructor(aiService: AIService, snowflakeService: SnowflakeService) {
    this.aiService = aiService;
    this.snowflakeService = snowflakeService;
  }

  /**
   * Initialize Voice-to-SQL Engine with schema intelligence
   */
  async initialize(): Promise<void> {
    console.log('🎤 Initializing Voice-to-SQL Engine...');
    
    try {
      // Load database schema and build intelligence
      await this.buildSchemaIntelligence();
      
      // Initialize AI models for SQL translation
      await this.initializeAIModels();
      
      console.log('✅ Voice-to-SQL Engine ready for contest!');
    } catch (error) {
      console.error('❌ Voice-to-SQL initialization failed:', error);
      throw error;
    }
  }

  /**
   * Main Voice-to-SQL Translation Method - Contest Entry Point
   */
  async translateVoiceToSQL(
    voiceInput: string,
    context?: {
      userId?: string;
      sessionId?: string;
      previousQueries?: string[];
    }
  ): Promise<VoiceToSQLResult> {
    const startTime = Date.now();
    
    try {
      console.log('🎯 Processing voice command:', voiceInput);

      // Step 1: Parse voice input and extract intent
      const voiceCommand = await this.parseVoiceCommand(voiceInput, context?.userId);
      
      // Step 2: Generate SQL with AI optimization
      const translation = await this.generateOptimizedSQL(voiceCommand);
      
      // Step 3: Execute query if confidence is high
      let executionResult;
      if (translation.confidence > 0.8) {
        executionResult = await this.executeQuery(translation.sql);
      }
      
      // Step 4: Generate intelligent suggestions
      const suggestions = await this.generateSuggestions(voiceCommand, translation);
      
      const result: VoiceToSQLResult = {
        voiceCommand,
        translation,
        executionResult,
        suggestions
      };

      // Cache successful translations
      if (translation.confidence > 0.7) {
        this.queryCache.set(voiceInput.toLowerCase(), translation);
      }

      // Store in voice history
      this.voiceHistory.push(voiceCommand);

      console.log(`✅ Voice-to-SQL completed in ${Date.now() - startTime}ms`);
      return result;

    } catch (error) {
      console.error('❌ Voice-to-SQL translation failed:', error);
      throw error;
    }
  }

  /**
   * Parse voice command and extract intent using AI
   */
  private async parseVoiceCommand(
    voiceInput: string,
    userId?: string
  ): Promise<VoiceCommand> {
    const prompt = this.buildIntentExtractionPrompt(voiceInput);
    
    const aiResponse = await this.aiService.getCompletion(prompt, {
      temperature: 0.1,
      maxTokens: 500
    });

    const intentData = JSON.parse(aiResponse);
    
    return {
      id: `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalVoice: voiceInput,
      transcript: voiceInput, // In production, use speech-to-text
      intent: intentData.intent,
      confidence: intentData.confidence,
      timestamp: new Date(),
      userId
    };
  }

  /**
   * Generate optimized SQL with AI assistance
   */
  private async generateOptimizedSQL(voiceCommand: VoiceCommand): Promise<SQLTranslation> {
    // Check cache first
    const cacheKey = voiceCommand.transcript.toLowerCase();
    if (this.queryCache.has(cacheKey)) {
      console.log('🚀 Using cached SQL translation');
      return this.queryCache.get(cacheKey)!;
    }

    const prompt = this.buildSQLGenerationPrompt(voiceCommand);
    
    const aiResponse = await this.aiService.getCompletion(prompt, {
      temperature: 0.2,
      maxTokens: 1000
    });

    const sqlData = JSON.parse(aiResponse);

    // Apply AI optimization
    const optimizedSQL = await this.optimizeSQL(sqlData.sql);

    return {
      sql: optimizedSQL.optimized,
      confidence: sqlData.confidence,
      explanation: sqlData.explanation,
      optimization: {
        original: sqlData.sql,
        optimized: optimizedSQL.optimized,
        improvementReason: optimizedSQL.reason,
        costSavings: optimizedSQL.costSavings,
        performanceGain: optimizedSQL.performanceGain
      },
      executionPlan: await this.analyzeExecutionPlan(optimizedSQL.optimized)
    };
  }

  /**
   * AI-powered SQL optimization
   */
  private async optimizeSQL(originalSQL: string): Promise<{
    optimized: string;
    reason: string;
    costSavings: number;
    performanceGain: number;
  }> {
    const optimizationPrompt = `
You are a Snowflake SQL optimization expert. Optimize this query for cost and performance:

Original SQL:
${originalSQL}

Schema context:
${JSON.stringify(this.schemaIntelligence?.tables.slice(0, 5) || [], null, 2)}

Return JSON with:
{
  "optimized": "optimized SQL query",
  "reason": "explanation of optimizations applied",
  "costSavings": number (percentage),
  "performanceGain": number (percentage)
}

Apply these optimizations:
1. Use clustering keys and partitioning
2. Optimize JOIN order
3. Use appropriate warehouse size hints
4. Apply predicate pushdown
5. Use LIMIT when appropriate
6. Optimize data types
7. Use result caching strategies
`;

    const response = await this.aiService.getCompletion(optimizationPrompt, {
      temperature: 0.1,
      maxTokens: 800
    });

    return JSON.parse(response);
  }

  /**
   * Build schema intelligence from Snowflake metadata
   */
  private async buildSchemaIntelligence(): Promise<void> {
    console.log('🧠 Building database schema intelligence...');
    
    try {
      // In production, query INFORMATION_SCHEMA
      // For now, use sample schema
      this.schemaIntelligence = {
        tables: [
          {
            name: 'customers',
            schema: 'public',
            columns: [
              { name: 'customer_id', type: 'NUMBER', nullable: false },
              { name: 'customer_name', type: 'VARCHAR', nullable: false },
              { name: 'email', type: 'VARCHAR', nullable: true },
              { name: 'registration_date', type: 'DATE', nullable: false },
              { name: 'total_orders', type: 'NUMBER', nullable: true }
            ],
            usage: {
              frequency: 85,
              commonQueries: [
                'SELECT COUNT(*) FROM customers',
                'SELECT * FROM customers WHERE customer_name LIKE',
                'SELECT AVG(total_orders) FROM customers'
              ]
            }
          },
          {
            name: 'orders',
            schema: 'public',
            columns: [
              { name: 'order_id', type: 'NUMBER', nullable: false },
              { name: 'customer_id', type: 'NUMBER', nullable: false },
              { name: 'order_date', type: 'TIMESTAMP', nullable: false },
              { name: 'total_amount', type: 'DECIMAL', nullable: false },
              { name: 'status', type: 'VARCHAR', nullable: false }
            ],
            usage: {
              frequency: 92,
              commonQueries: [
                'SELECT SUM(total_amount) FROM orders',
                'SELECT * FROM orders WHERE order_date >=',
                'SELECT customer_id, COUNT(*) FROM orders GROUP BY customer_id'
              ]
            }
          },
          {
            name: 'products',
            schema: 'public',
            columns: [
              { name: 'product_id', type: 'NUMBER', nullable: false },
              { name: 'product_name', type: 'VARCHAR', nullable: false },
              { name: 'category', type: 'VARCHAR', nullable: false },
              { name: 'price', type: 'DECIMAL', nullable: false },
              { name: 'inventory_count', type: 'NUMBER', nullable: true }
            ],
            usage: {
              frequency: 78,
              commonQueries: [
                'SELECT * FROM products WHERE category =',
                'SELECT AVG(price) FROM products',
                'SELECT product_name, price FROM products ORDER BY price DESC'
              ]
            }
          }
        ],
        relationships: [
          {
            fromTable: 'orders',
            toTable: 'customers',
            type: 'many-to-one',
            joinCondition: 'orders.customer_id = customers.customer_id'
          }
        ],
        commonPatterns: [
          {
            pattern: 'revenue_analysis',
            description: 'Monthly revenue analysis',
            example: 'SELECT DATE_TRUNC(\'month\', order_date) as month, SUM(total_amount) FROM orders GROUP BY 1',
            frequency: 45,
            performance: 'fast'
          },
          {
            pattern: 'customer_segmentation',
            description: 'Customer value segmentation',
            example: 'SELECT customer_id, SUM(total_amount) as lifetime_value FROM orders GROUP BY customer_id',
            frequency: 32,
            performance: 'medium'
          }
        ]
      };
      
      console.log('✅ Schema intelligence built successfully');
    } catch (error) {
      console.error('❌ Schema intelligence build failed:', error);
      throw error;
    }
  }

  /**
   * Initialize AI models for SQL translation
   */
  private async initializeAIModels(): Promise<void> {
    console.log('🤖 Initializing AI models for SQL translation...');
    // In production, load specialized SQL models
    // For now, use existing AI service
    console.log('✅ AI models ready');
  }

  /**
   * Build intent extraction prompt
   */
  private buildIntentExtractionPrompt(voiceInput: string): string {
    return `
You are an expert at understanding natural language data queries. Extract the intent from this voice command:

Voice Input: "${voiceInput}"

Available tables and columns:
${JSON.stringify(this.schemaIntelligence?.tables || [], null, 2)}

Return JSON with:
{
  "intent": {
    "type": "select|aggregate|filter|join|analyze|explore",
    "entities": ["table names, column names mentioned"],
    "timeframe": "any time period mentioned",
    "metrics": ["measures to calculate"],
    "dimensions": ["grouping dimensions"],
    "filters": {"column": "value conditions"}
  },
  "confidence": number (0-1)
}

Examples:
- "Show me total sales last month" -> {"type": "aggregate", "entities": ["orders", "total_amount"], "timeframe": "last month", "metrics": ["SUM(total_amount)"]}
- "List all customers from California" -> {"type": "filter", "entities": ["customers"], "filters": {"state": "California"}}
- "What's the average order value by customer segment" -> {"type": "aggregate", "entities": ["orders", "customers"], "metrics": ["AVG(total_amount)"], "dimensions": ["customer_segment"]}
`;
  }

  /**
   * Build SQL generation prompt
   */
  private buildSQLGenerationPrompt(voiceCommand: VoiceCommand): string {
    return `
You are a Snowflake SQL expert. Generate optimized SQL for this voice command:

Voice Command: "${voiceCommand.transcript}"
Intent: ${JSON.stringify(voiceCommand.intent, null, 2)}

Database Schema:
${JSON.stringify(this.schemaIntelligence, null, 2)}

Return JSON with:
{
  "sql": "SELECT statement with proper Snowflake syntax",
  "confidence": number (0-1),
  "explanation": "human-readable explanation of what the query does"
}

Guidelines:
1. Use proper Snowflake syntax and functions
2. Include appropriate JOINs based on relationships
3. Use date functions for time-based queries
4. Apply proper aggregations and GROUP BY
5. Include reasonable LIMIT for large result sets
6. Use warehouse optimization hints when beneficial
7. Ensure query is safe and won't cause excessive costs
`;
  }

  /**
   * Analyze execution plan for cost and performance
   */
  private async analyzeExecutionPlan(sql: string): Promise<{
    estimatedCost: number;
    estimatedTime: number;
    complexity: 'low' | 'medium' | 'high';
    warnings?: string[];
  }> {
    // Analyze SQL complexity
    const complexity = this.calculateQueryComplexity(sql);
    const warnings: string[] = [];

    // Check for cost-intensive operations
    if (sql.includes('CROSS JOIN')) {
      warnings.push('Cross join detected - may be expensive');
    }
    if (!sql.includes('LIMIT') && !sql.includes('WHERE')) {
      warnings.push('Full table scan without LIMIT - consider adding filters');
    }

    return {
      estimatedCost: complexity === 'low' ? 0.01 : complexity === 'medium' ? 0.05 : 0.20,
      estimatedTime: complexity === 'low' ? 1.2 : complexity === 'medium' ? 3.5 : 8.1,
      complexity,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Calculate query complexity score
   */
  private calculateQueryComplexity(sql: string): 'low' | 'medium' | 'high' {
    const lowerSQL = sql.toLowerCase();
    let score = 0;

    // Basic operations
    if (lowerSQL.includes('select')) score += 1;
    if (lowerSQL.includes('join')) score += 2;
    if (lowerSQL.includes('group by')) score += 2;
    if (lowerSQL.includes('order by')) score += 1;
    if (lowerSQL.includes('having')) score += 2;
    if (lowerSQL.includes('subquery') || lowerSQL.includes('with')) score += 3;
    if (lowerSQL.includes('window')) score += 3;

    if (score <= 3) return 'low';
    if (score <= 7) return 'medium';
    return 'high';
  }

  /**
   * Execute SQL query through Snowflake service
   */
  private async executeQuery(sql: string): Promise<{
    data: any[];
    metadata: {
      rowCount: number;
      executionTime: number;
      actualCost: number;
      cacheHit: boolean;
    };
  }> {
    try {
      const result = await this.snowflakeService.executeQuery({
        id: `voice_query_${Date.now()}`,
        sql,
        timeout: 30000
      });

      return {
        data: result.rows,
        metadata: {
          rowCount: result.rowCount,
          executionTime: result.executionTime,
          actualCost: result.cost?.estimatedUSD || 0,
          cacheHit: false // TODO: Implement cache detection
        }
      };
    } catch (error) {
      console.error('❌ Query execution failed:', error);
      throw error;
    }
  }

  /**
   * Generate intelligent suggestions for follow-up queries
   */
  private async generateSuggestions(
    voiceCommand: VoiceCommand,
    translation: SQLTranslation
  ): Promise<string[]> {
    const suggestionPrompt = `
Based on this voice command and SQL query, suggest 3-5 related follow-up questions that would provide additional insights:

Voice Command: "${voiceCommand.transcript}"
Generated SQL: ${translation.sql}

Database Schema Context:
${JSON.stringify(this.schemaIntelligence?.tables.slice(0, 3) || [], null, 2)}

Return an array of natural language follow-up questions that would be valuable for data exploration.
Make them conversational and business-focused.

Example format:
["What was the trend over the last 6 months?", "How does this compare to last year?", "Which customer segment contributed most?"]
`;

    try {
      const response = await this.aiService.getCompletion(suggestionPrompt, {
        temperature: 0.7,
        maxTokens: 300
      });

      return JSON.parse(response);
    } catch (error) {
      console.error('❌ Suggestion generation failed:', error);
      return [
        "Show me the trend over time",
        "Break this down by category", 
        "Compare with previous period"
      ];
    }
  }

  /**
   * Get voice command history for context
   */
  getVoiceHistory(userId?: string, limit: number = 10): VoiceCommand[] {
    let history = this.voiceHistory;
    
    if (userId) {
      history = history.filter(cmd => cmd.userId === userId);
    }
    
    return history
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get query performance analytics
   */
  getAnalytics(): {
    totalQueries: number;
    averageConfidence: number;
    successRate: number;
    averageCostSavings: number;
    topIntents: Array<{ type: string; count: number }>;
  } {
    const totalQueries = this.voiceHistory.length;
    const averageConfidence = totalQueries > 0 
      ? this.voiceHistory.reduce((sum, cmd) => sum + cmd.confidence, 0) / totalQueries 
      : 0;

    const intentCounts = new Map<string, number>();
    this.voiceHistory.forEach(cmd => {
      const count = intentCounts.get(cmd.intent.type) || 0;
      intentCounts.set(cmd.intent.type, count + 1);
    });

    const topIntents = Array.from(intentCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalQueries,
      averageConfidence,
      successRate: 0.92, // TODO: Calculate from actual executions
      averageCostSavings: 0.45, // TODO: Calculate from optimizations
      topIntents
    };
  }
}

// Export singleton instance factory
export const createVoiceToSQLEngine = (
  aiService: AIService,
  snowflakeService: SnowflakeService
): VoiceToSQLEngine => {
  return new VoiceToSQLEngine(aiService, snowflakeService);
};