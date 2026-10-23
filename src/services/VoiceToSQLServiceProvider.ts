/**
 * 🎯 Voice-to-SQL Service Provider
 * 
 * Provides initialized Voice-to-SQL Engine instances for the application.
 * Handles dependency injection and service configuration.
 */

import { VoiceToSQLEngine, createVoiceToSQLEngine } from './voice/VoiceToSQLEngine';
import { AIService } from './AIService';
import { SnowflakeService } from './integrations/SnowflakeService';
import { getEnv } from '../config/env';

// Mock AI Service for demo purposes
class MockAIService implements AIService {
  async enhanceTask(task: any): Promise<any> {
    return { data: task, sources: [] };
  }

  async estimateTaskDuration(description: string): Promise<any> {
    return { data: 30, sources: [] };
  }

  async optimizeTaskSchedule(tasks: any[]): Promise<any> {
    return { data: tasks, sources: [] };
  }

  async suggestEventTimes(event: any): Promise<any> {
    return { data: [new Date()], sources: [] };
  }

  async analyzeScheduleConflicts(events: any[]): Promise<any> {
    return { data: { conflicts: [], followUpQuestions: [] }, sources: [] };
  }

  async getCompletion(prompt: string, options?: any): Promise<string> {
    console.log('🤖 AI Processing prompt:', prompt.substring(0, 100) + '...');

    // Mock AI responses based on prompt content
    if (prompt.includes('intent extraction')) {
      return JSON.stringify({
        intent: {
          type: 'aggregate',
          entities: ['orders', 'total_amount'],
          timeframe: 'last month',
          metrics: ['SUM(total_amount)'],
          dimensions: [],
          filters: {}
        },
        confidence: 0.92
      });
    }

    if (prompt.includes('Generate optimized SQL')) {
      const voiceInput = prompt.match(/Voice Command: "(.+?)"/)?.[1] || 'show data';

      // Generate appropriate SQL based on voice input
      let sql = 'SELECT COUNT(*) FROM customers;';
      let explanation = 'This query counts the total number of customers.';

      if (voiceInput.toLowerCase().includes('revenue') || voiceInput.toLowerCase().includes('sales')) {
        sql = `SELECT 
  DATE_TRUNC('month', order_date) as month,
  SUM(total_amount) as monthly_revenue
FROM orders 
WHERE order_date >= DATEADD(month, -12, CURRENT_DATE())
GROUP BY DATE_TRUNC('month', order_date)
ORDER BY month DESC;`;
        explanation = 'This query calculates monthly revenue over the last 12 months, grouped by month.';
      } else if (voiceInput.toLowerCase().includes('customers')) {
        sql = `SELECT 
  customer_name,
  email,
  total_orders,
  registration_date
FROM customers 
ORDER BY total_orders DESC
LIMIT 10;`;
        explanation = 'This query retrieves the top 10 customers ordered by their total number of orders.';
      } else if (voiceInput.toLowerCase().includes('average') || voiceInput.toLowerCase().includes('avg')) {
        sql = `SELECT 
  category,
  AVG(total_amount) as avg_order_value,
  COUNT(*) as order_count
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
GROUP BY category
ORDER BY avg_order_value DESC;`;
        explanation = 'This query calculates the average order value by product category.';
      }

      return JSON.stringify({
        sql: sql,
        confidence: 0.89,
        explanation: explanation
      });
    }

    if (prompt.includes('optimize this query')) {
      return JSON.stringify({
        optimized: prompt.includes('SELECT') ?
          prompt.match(/Original SQL:\s*([\s\S]*?)\s*Schema context:/)?.[1]?.replace('SELECT *', 'SELECT customer_id, customer_name, total_orders') + '\n-- Added LIMIT for performance\nLIMIT 1000;' :
          'SELECT customer_id, customer_name FROM customers LIMIT 1000;',
        reason: 'Applied column selection optimization and added LIMIT clause to prevent full table scans. Used clustering key optimization for better performance.',
        costSavings: 65,
        performanceGain: 40
      });
    }

    if (prompt.includes('follow-up questions')) {
      return JSON.stringify([
        "What's the trend over the last 6 months?",
        "How does this compare to the previous year?",
        "Which customer segment contributes the most?",
        "What are the top performing product categories?",
        "Show me the seasonal patterns in this data"
      ]);
    }

    return JSON.stringify({
      response: 'Mock AI response',
      confidence: 0.85
    });
  }

  async getEmbedding(text: string): Promise<number[]> {
    return Array.from({ length: getEnv().embeddingDimension }, () => Math.random());
  }

  getRelevantSources(context: string, minRelevance?: number): any[] {
    return [];
  }

  getSourcesByType(type: string): any[] {
    return [];
  }

  getSourcesByConfidence(minConfidence?: number): any[] {
    return [];
  }
}

// Mock Snowflake Service
class MockSnowflakeService extends SnowflakeService {
  constructor() {
    super({
      account: 'demo-account',
      username: 'demo-user',
      warehouse: 'DEMO_WH',
      database: 'DEMO_DB',
      schema: 'PUBLIC'
    });
  }

  async executeQuery(query: any): Promise<any> {
    console.log('❄️ Executing Snowflake query:', query.sql);

    // Generate mock data based on query
    const mockData = this.generateMockData(query.sql);

    return {
      queryId: query.id,
      rows: mockData,
      columns: this.extractColumns(query.sql),
      executionTime: Math.random() * 2000 + 500, // 0.5-2.5 seconds
      rowCount: mockData.length,
      cost: {
        credits: Math.random() * 0.1 + 0.01,
        estimatedUSD: Math.random() * 0.05 + 0.005
      }
    };
  }

  private generateMockData(sql: string): any[] {
    const lowerSQL = sql.toLowerCase();

    if (lowerSQL.includes('revenue') || lowerSQL.includes('sales')) {
      return [
        { month: '2025-01', monthly_revenue: 145230.50 },
        { month: '2024-12', monthly_revenue: 132456.75 },
        { month: '2024-11', monthly_revenue: 128934.25 },
        { month: '2024-10', monthly_revenue: 139876.00 },
        { month: '2024-09', monthly_revenue: 125432.80 }
      ];
    }

    if (lowerSQL.includes('customers')) {
      return [
        { customer_name: 'Acme Corp', email: 'contact@acme.com', total_orders: 45, registration_date: '2023-01-15' },
        { customer_name: 'TechStart Inc', email: 'info@techstart.com', total_orders: 38, registration_date: '2023-02-20' },
        { customer_name: 'Global Solutions', email: 'hello@global.com', total_orders: 32, registration_date: '2023-01-08' },
        { customer_name: 'Innovation Labs', email: 'team@innovation.com', total_orders: 29, registration_date: '2023-03-12' },
        { customer_name: 'Future Systems', email: 'contact@future.com', total_orders: 25, registration_date: '2023-02-28' }
      ];
    }

    if (lowerSQL.includes('average') || lowerSQL.includes('category')) {
      return [
        { category: 'Electronics', avg_order_value: 245.67, order_count: 1250 },
        { category: 'Software', avg_order_value: 189.34, order_count: 890 },
        { category: 'Services', avg_order_value: 567.89, order_count: 456 },
        { category: 'Hardware', avg_order_value: 134.56, order_count: 678 },
        { category: 'Consulting', avg_order_value: 890.12, order_count: 234 }
      ];
    }

    return [
      { count: 1523 },
      { total: 245678.90 },
      { average: 156.78 }
    ];
  }

  private extractColumns(sql: string): string[] {
    // Simple column extraction - in production use proper SQL parser
    const lowerSQL = sql.toLowerCase();

    if (lowerSQL.includes('revenue')) return ['month', 'monthly_revenue'];
    if (lowerSQL.includes('customers')) return ['customer_name', 'email', 'total_orders', 'registration_date'];
    if (lowerSQL.includes('category')) return ['category', 'avg_order_value', 'order_count'];

    return ['result'];
  }
}

// Service Provider Class
class VoiceToSQLServiceProvider {
  private static instance: VoiceToSQLEngine | null = null;
  private static aiService: AIService | null = null;
  private static snowflakeService: SnowflakeService | null = null;

  static async getVoiceToSQLEngine(): Promise<VoiceToSQLEngine> {
    if (!this.instance) {
      // Initialize services
      this.aiService = new MockAIService();
      this.snowflakeService = new MockSnowflakeService();

      // Create Voice-to-SQL Engine
      this.instance = createVoiceToSQLEngine(this.aiService, this.snowflakeService);

      // Initialize the engine
      await this.instance.initialize();

      console.log('🎯 Voice-to-SQL Engine initialized and ready!');
    }

    return this.instance;
  }

  static getAIService(): AIService | null {
    return this.aiService;
  }

  static getSnowflakeService(): SnowflakeService | null {
    return this.snowflakeService;
  }
}

export default VoiceToSQLServiceProvider;