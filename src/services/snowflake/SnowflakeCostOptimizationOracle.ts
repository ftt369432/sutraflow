import { AIService } from '../ai/aiService';

// Types for cost analysis
export interface QueryAnalysis {
  id: string;
  query: string;
  estimatedCost: number;
  executionTime: number;
  complexity: 'low' | 'medium' | 'high' | 'extreme';
  warehouseSize: string;
  timestamp: Date;
  optimizations: OptimizationRecommendation[];
  performanceMetrics: PerformanceMetrics;
}

export interface OptimizationRecommendation {
  type: 'indexing' | 'partitioning' | 'warehouse-sizing' | 'query-rewrite' | 'caching' | 'clustering';
  title: string;
  description: string;
  potentialSavings: number;
  implementationEffort: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high' | 'critical';
  sqlSuggestion?: string;
  impact: {
    costReduction: number; // percentage
    performanceGain: number; // percentage
    complexityChange: number; // -1 to 1 scale
  };
}

export interface PerformanceMetrics {
  scanEfficiency: number; // 0-100%
  joinOptimization: number; // 0-100%
  memoryUsage: number; // MB
  ioOperations: number;
  warehouseUtilization: number; // 0-100%
}

export interface CostOptimizationConfig {
  targetCostReduction: number; // percentage
  maxWarehouseSize: string;
  budgetLimit: number; // dollars per month
  optimizationFocus: 'cost' | 'performance' | 'balanced';
}

/**
 * AI-Powered Snowflake Cost Optimization Oracle
 * Analyzes queries and provides intelligent cost reduction recommendations
 */
export class SnowflakeCostOptimizationOracle {
  private aiService: AIService;
  private analysisHistory: QueryAnalysis[] = [];

  constructor() {
    this.aiService = AIService.getInstance();
  }

  /**
   * Analyze a Snowflake query for cost optimization opportunities
   */
  async analyzeQuery(
    query: string,
    warehouseSize: string = 'MEDIUM',
    config?: CostOptimizationConfig
  ): Promise<QueryAnalysis> {
    try {
      // Estimate initial cost and complexity
      const estimatedCost = this.estimateQueryCost(query, warehouseSize);
      const complexity = this.assessQueryComplexity(query);
      const performanceMetrics = await this.analyzePerformanceMetrics(query);

      // Get AI-powered optimization recommendations
      const optimizations = await this.generateOptimizationRecommendations(
        query,
        warehouseSize,
        estimatedCost,
        complexity,
        performanceMetrics,
        config
      );

      const analysis: QueryAnalysis = {
        id: `analysis_${Date.now()}`,
        query,
        estimatedCost,
        executionTime: this.estimateExecutionTime(query, warehouseSize),
        complexity,
        warehouseSize,
        timestamp: new Date(),
        optimizations,
        performanceMetrics
      };

      this.analysisHistory.push(analysis);
      return analysis;

    } catch (error) {
      console.error('Error analyzing query:', error);
      throw new Error('Failed to analyze query for cost optimization');
    }
  }

  /**
   * Generate AI-powered optimization recommendations
   */
  private async generateOptimizationRecommendations(
    query: string,
    warehouseSize: string,
    estimatedCost: number,
    complexity: string,
    metrics: PerformanceMetrics,
    config?: CostOptimizationConfig
  ): Promise<OptimizationRecommendation[]> {
    const prompt = `
As a Snowflake cost optimization expert, analyze this SQL query and provide specific recommendations:

QUERY:
${query}

CURRENT METRICS:
- Warehouse Size: ${warehouseSize}
- Estimated Cost: $${estimatedCost}
- Complexity: ${complexity}
- Scan Efficiency: ${metrics.scanEfficiency}%
- Join Optimization: ${metrics.joinOptimization}%
- Memory Usage: ${metrics.memoryUsage}MB
- I/O Operations: ${metrics.ioOperations}
- Warehouse Utilization: ${metrics.warehouseUtilization}%

CONFIG:
- Target Cost Reduction: ${config?.targetCostReduction || 20}%
- Max Warehouse Size: ${config?.maxWarehouseSize || 'LARGE'}
- Budget Limit: $${config?.budgetLimit || 1000}/month
- Optimization Focus: ${config?.optimizationFocus || 'balanced'}

Provide detailed optimization recommendations focusing on:
1. Query rewriting for better performance
2. Warehouse sizing optimization
3. Clustering and partitioning strategies
4. Caching opportunities
5. Indexing recommendations

For each recommendation, include:
- Specific implementation steps
- Estimated cost savings percentage
- Expected performance impact
- Implementation complexity
- Priority level

Format as JSON array of recommendations.
    `;

    try {
      const response = await this.aiService.generateResponse(prompt, {
        temperature: 0.3,
        maxTokens: 2000
      });

      // Parse AI response and create structured recommendations
      return this.parseAIRecommendations(response, estimatedCost);
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      return this.getFallbackRecommendations(query, estimatedCost, complexity);
    }
  }

  /**
   * Parse AI response into structured recommendations
   */
  private parseAIRecommendations(aiResponse: string, baseCost: number): OptimizationRecommendation[] {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const recommendations = JSON.parse(jsonMatch[0]);
        return recommendations.map((rec: any) => ({
          type: rec.type || 'query-rewrite',
          title: rec.title || 'Optimization Opportunity',
          description: rec.description || 'AI-generated optimization',
          potentialSavings: rec.potentialSavings || baseCost * 0.15,
          implementationEffort: rec.implementationEffort || 'medium',
          priority: rec.priority || 'medium',
          sqlSuggestion: rec.sqlSuggestion || '',
          impact: {
            costReduction: rec.impact?.costReduction || 15,
            performanceGain: rec.impact?.performanceGain || 10,
            complexityChange: rec.impact?.complexityChange || 0
          }
        }));
      }
    } catch (error) {
      console.error('Error parsing AI recommendations:', error);
    }

    return this.getFallbackRecommendations('', baseCost, 'medium');
  }

  /**
   * Provide fallback recommendations when AI fails
   */
  private getFallbackRecommendations(
    query: string,
    baseCost: number,
    complexity: string
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Query optimization based on common patterns
    if (query.toLowerCase().includes('select *')) {
      recommendations.push({
        type: 'query-rewrite',
        title: 'Avoid SELECT * Statements',
        description: 'Replace SELECT * with specific column names to reduce data transfer and processing costs',
        potentialSavings: baseCost * 0.20,
        implementationEffort: 'low',
        priority: 'high',
        sqlSuggestion: 'SELECT column1, column2, column3 FROM table_name',
        impact: {
          costReduction: 20,
          performanceGain: 25,
          complexityChange: -0.1
        }
      });
    }

    if (query.toLowerCase().includes('join') && complexity === 'high') {
      recommendations.push({
        type: 'query-rewrite',
        title: 'Optimize JOIN Operations',
        description: 'Consider using EXISTS or IN clauses for better performance on large datasets',
        potentialSavings: baseCost * 0.30,
        implementationEffort: 'medium',
        priority: 'high',
        impact: {
          costReduction: 30,
          performanceGain: 40,
          complexityChange: 0.1
        }
      });
    }

    // Warehouse sizing recommendations
    if (baseCost > 100) {
      recommendations.push({
        type: 'warehouse-sizing',
        title: 'Consider Smaller Warehouse',
        description: 'Query may perform adequately with a smaller warehouse size, reducing compute costs',
        potentialSavings: baseCost * 0.25,
        implementationEffort: 'low',
        priority: 'medium',
        impact: {
          costReduction: 25,
          performanceGain: -5,
          complexityChange: 0
        }
      });
    }

    // Clustering recommendations
    recommendations.push({
      type: 'clustering',
      title: 'Implement Clustering Keys',
      description: 'Add clustering keys to frequently queried columns to improve scan efficiency',
      potentialSavings: baseCost * 0.15,
      implementationEffort: 'medium',
      priority: 'medium',
      sqlSuggestion: 'ALTER TABLE table_name CLUSTER BY (column_name)',
      impact: {
        costReduction: 15,
        performanceGain: 35,
        complexityChange: 0.2
      }
    });

    return recommendations;
  }

  /**
   * Estimate query cost based on complexity and warehouse size
   */
  private estimateQueryCost(query: string, warehouseSize: string): number {
    const warehouseCostPerHour: { [key: string]: number } = {
      'X-SMALL': 1,
      'SMALL': 2,
      'MEDIUM': 4,
      'LARGE': 8,
      'X-LARGE': 16,
      '2X-LARGE': 32,
      '3X-LARGE': 64,
      '4X-LARGE': 128
    };

    const baseCost = warehouseCostPerHour[warehouseSize] || 4;
    const complexity = this.assessQueryComplexity(query);
    
    let multiplier = 1;
    switch (complexity) {
      case 'low': multiplier = 0.5; break;
      case 'medium': multiplier = 1; break;
      case 'high': multiplier = 2; break;
      case 'extreme': multiplier = 4; break;
    }

    // Factor in query characteristics
    const queryLower = query.toLowerCase();
    if (queryLower.includes('join')) multiplier *= 1.5;
    if (queryLower.includes('group by')) multiplier *= 1.3;
    if (queryLower.includes('order by')) multiplier *= 1.2;
    if (queryLower.includes('window')) multiplier *= 2;
    if (queryLower.includes('recursive')) multiplier *= 3;

    return Math.round(baseCost * multiplier * 100) / 100;
  }

  /**
   * Assess query complexity based on SQL constructs
   */
  private assessQueryComplexity(query: string): 'low' | 'medium' | 'high' | 'extreme' {
    const queryLower = query.toLowerCase();
    let complexity = 0;

    // Count complexity factors
    if (queryLower.includes('join')) complexity += 1;
    if (queryLower.includes('subquery') || queryLower.includes('(select')) complexity += 2;
    if (queryLower.includes('window')) complexity += 2;
    if (queryLower.includes('recursive')) complexity += 3;
    if (queryLower.includes('union')) complexity += 1;
    if (queryLower.includes('group by')) complexity += 1;
    if (queryLower.includes('having')) complexity += 1;
    if ((queryLower.match(/join/g) || []).length > 3) complexity += 2;

    if (complexity <= 1) return 'low';
    if (complexity <= 3) return 'medium';
    if (complexity <= 6) return 'high';
    return 'extreme';
  }

  /**
   * Estimate query execution time
   */
  private estimateExecutionTime(query: string, warehouseSize: string): number {
    const baseTime = 5; // seconds
    const complexity = this.assessQueryComplexity(query);
    
    let timeMultiplier = 1;
    switch (complexity) {
      case 'low': timeMultiplier = 0.5; break;
      case 'medium': timeMultiplier = 1; break;
      case 'high': timeMultiplier = 3; break;
      case 'extreme': timeMultiplier = 10; break;
    }

    const warehouseSpeedMultiplier: { [key: string]: number } = {
      'X-SMALL': 2,
      'SMALL': 1.5,
      'MEDIUM': 1,
      'LARGE': 0.7,
      'X-LARGE': 0.5,
      '2X-LARGE': 0.3,
      '3X-LARGE': 0.2,
      '4X-LARGE': 0.1
    };

    return Math.round(baseTime * timeMultiplier * (warehouseSpeedMultiplier[warehouseSize] || 1));
  }

  /**
   * Analyze performance metrics
   */
  private async analyzePerformanceMetrics(query: string): Promise<PerformanceMetrics> {
    const queryLower = query.toLowerCase();
    
    // Simulate performance analysis based on query patterns
    let scanEfficiency = 80;
    let joinOptimization = 85;
    let memoryUsage = 512;
    let ioOperations = 1000;
    let warehouseUtilization = 70;

    // Adjust metrics based on query characteristics
    if (queryLower.includes('select *')) {
      scanEfficiency -= 30;
      ioOperations *= 2;
    }

    if (queryLower.includes('join')) {
      joinOptimization -= 20;
      memoryUsage *= 1.5;
    }

    if (queryLower.includes('group by')) {
      memoryUsage *= 1.3;
      warehouseUtilization += 10;
    }

    return {
      scanEfficiency: Math.max(0, Math.min(100, scanEfficiency)),
      joinOptimization: Math.max(0, Math.min(100, joinOptimization)),
      memoryUsage: Math.round(memoryUsage),
      ioOperations: Math.round(ioOperations),
      warehouseUtilization: Math.max(0, Math.min(100, warehouseUtilization))
    };
  }

  /**
   * Get analysis history
   */
  getAnalysisHistory(): QueryAnalysis[] {
    return this.analysisHistory;
  }

  /**
   * Calculate total cost savings potential
   */
  calculateTotalSavingsPotential(): { totalSavings: number; monthlyReduction: number } {
    const totalSavings = this.analysisHistory.reduce((sum, analysis) => {
      const analysisSavings = analysis.optimizations.reduce((optSum, opt) => 
        optSum + opt.potentialSavings, 0
      );
      return sum + analysisSavings;
    }, 0);

    // Estimate monthly reduction based on query frequency
    const monthlyReduction = totalSavings * 30; // Assuming daily query execution

    return { totalSavings, monthlyReduction };
  }

  /**
   * Generate cost optimization report
   */
  async generateOptimizationReport(): Promise<string> {
    const history = this.getAnalysisHistory();
    const { totalSavings, monthlyReduction } = this.calculateTotalSavingsPotential();

    const reportPrompt = `
Generate a comprehensive Snowflake cost optimization report based on the following analysis data:

ANALYSIS SUMMARY:
- Total queries analyzed: ${history.length}
- Total potential savings: $${totalSavings}
- Estimated monthly cost reduction: $${monthlyReduction}

QUERY BREAKDOWN:
${history.map(analysis => `
Query ID: ${analysis.id}
Cost: $${analysis.estimatedCost}
Complexity: ${analysis.complexity}
Optimizations: ${analysis.optimizations.length}
Top Recommendation: ${analysis.optimizations[0]?.title || 'None'}
`).join('\n')}

Please provide:
1. Executive summary of cost optimization opportunities
2. Priority recommendations for immediate implementation
3. Long-term optimization strategy
4. ROI analysis for proposed changes
5. Implementation roadmap with timelines

Make it professional and actionable for Snowflake administrators.
    `;

    try {
      return await this.aiService.generateResponse(reportPrompt);
    } catch (error) {
      console.error('Error generating optimization report:', error);
      return this.generateFallbackReport(history, totalSavings, monthlyReduction);
    }
  }

  /**
   * Generate fallback report if AI fails
   */
  private generateFallbackReport(
    history: QueryAnalysis[],
    totalSavings: number,
    monthlyReduction: number
  ): string {
    return `
# Snowflake Cost Optimization Report

## Executive Summary
Our AI-powered analysis identified significant cost optimization opportunities across ${history.length} queries, with potential savings of $${totalSavings} per execution cycle and estimated monthly reduction of $${monthlyReduction}.

## Key Findings
- **High-Impact Optimizations**: ${history.filter(h => h.optimizations.some(o => o.priority === 'high')).length} queries with critical optimization opportunities
- **Average Cost Reduction**: ${Math.round((totalSavings / Math.max(history.length, 1)) * 100) / 100}% per query
- **Performance Improvement**: Estimated 20-40% performance gains through optimization implementation

## Priority Recommendations
1. **Query Rewriting**: Focus on eliminating SELECT * statements and optimizing JOIN operations
2. **Warehouse Sizing**: Right-size warehouses based on actual workload requirements  
3. **Clustering Strategy**: Implement clustering keys on frequently queried columns
4. **Caching Optimization**: Leverage result caching for repeated query patterns

## Implementation Roadmap
- **Week 1-2**: Implement low-effort, high-impact query rewrites
- **Week 3-4**: Optimize warehouse sizing and auto-scaling policies
- **Month 2**: Deploy clustering keys and partitioning strategies
- **Month 3**: Implement advanced caching and monitoring solutions

## ROI Analysis
- **Investment**: Estimated 40 hours of optimization work
- **Annual Savings**: $${monthlyReduction * 12}
- **Payback Period**: Immediate (optimization efforts pay for themselves within first month)
- **Ongoing Benefits**: Compound savings through improved query patterns and resource utilization

Generated by GenieFlow AI Snowflake Cost Optimization Oracle
    `;
  }
}