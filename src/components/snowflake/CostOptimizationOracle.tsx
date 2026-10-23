import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';
import { 
  DollarSign, TrendingDown, Zap, AlertCircle, CheckCircle, 
  BarChart3, Clock, Database, Lightbulb, Target, Download,
  TrendingUp, ArrowRight, Gauge, Settings
} from 'lucide-react';
import { 
  SnowflakeCostOptimizationOracle, 
  QueryAnalysis, 
  OptimizationRecommendation,
  CostOptimizationConfig 
} from '../../services/snowflake/SnowflakeCostOptimizationOracle';

interface CostOptimizationOracleProps {
  onAnalysisComplete?: (analysis: QueryAnalysis) => void;
}

export function CostOptimizationOracle({ onAnalysisComplete }: CostOptimizationOracleProps) {
  const [oracle] = useState(() => new SnowflakeCostOptimizationOracle());
  const [sqlQuery, setSqlQuery] = useState('');
  const [warehouseSize, setWarehouseSize] = useState('MEDIUM');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<QueryAnalysis | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<QueryAnalysis[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<CostOptimizationConfig>({
    targetCostReduction: 25,
    maxWarehouseSize: 'X-LARGE',
    budgetLimit: 1000,
    optimizationFocus: 'balanced'
  });

  const warehouseSizes = [
    'X-SMALL', 'SMALL', 'MEDIUM', 'LARGE', 'X-LARGE', 
    '2X-LARGE', '3X-LARGE', '4X-LARGE'
  ];

  const sampleQueries = [
    {
      name: 'Customer Analytics',
      query: `SELECT * FROM customers c 
JOIN orders o ON c.customer_id = o.customer_id 
JOIN order_items oi ON o.order_id = oi.order_id 
WHERE c.created_date >= '2024-01-01' 
GROUP BY c.customer_id, c.customer_name 
ORDER BY SUM(oi.price * oi.quantity) DESC;`
    },
    {
      name: 'Sales Report',
      query: `SELECT 
  DATE_TRUNC('month', order_date) as month,
  SUM(total_amount) as monthly_sales,
  COUNT(*) as order_count,
  AVG(total_amount) as avg_order_value
FROM sales_data 
WHERE order_date >= DATEADD('year', -1, CURRENT_DATE())
GROUP BY DATE_TRUNC('month', order_date)
ORDER BY month DESC;`
    },
    {
      name: 'Complex Window Functions',
      query: `SELECT 
  customer_id,
  order_date,
  total_amount,
  ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC) as recent_order,
  LAG(total_amount) OVER (PARTITION BY customer_id ORDER BY order_date) as prev_amount,
  SUM(total_amount) OVER (PARTITION BY customer_id) as customer_lifetime_value
FROM orders 
WHERE order_date >= '2024-01-01';`
    }
  ];

  useEffect(() => {
    // Load analysis history
    const history = oracle.getAnalysisHistory();
    setAnalysisHistory(history);
  }, [oracle]);

  const handleAnalyzeQuery = async () => {
    if (!sqlQuery.trim()) return;

    setIsAnalyzing(true);
    try {
      const analysis = await oracle.analyzeQuery(sqlQuery, warehouseSize, config);
      setCurrentAnalysis(analysis);
      setAnalysisHistory(oracle.getAnalysisHistory());
      onAnalysisComplete?.(analysis);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLoadSample = (query: string) => {
    setSqlQuery(query);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'extreme': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const totalSavings = currentAnalysis?.optimizations.reduce((sum, opt) => sum + opt.potentialSavings, 0) || 0;
  const avgCostReduction = currentAnalysis?.optimizations.reduce((sum, opt) => sum + opt.impact.costReduction, 0) / Math.max(currentAnalysis?.optimizations.length || 1, 1) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-metallic-900 to-blue-metallic-800 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
            Snowflake Cost Optimization Oracle
          </CardTitle>
          <p className="text-blue-metallic-100">
            AI-powered query analysis and cost optimization recommendations
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Query Input Section */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Query Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sample Queries */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Sample Queries
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {sampleQueries.map((sample, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoadSample(sample.query)}
                      className="text-left justify-start"
                    >
                      <Lightbulb className="w-4 h-4 mr-2" />
                      {sample.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* SQL Query Input */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  SQL Query
                </label>
                <Textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  placeholder="Enter your Snowflake SQL query here..."
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>

              {/* Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Warehouse Size
                  </label>
                  <select
                    value={warehouseSize}
                    onChange={(e) => setWarehouseSize(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    title="Select Snowflake warehouse size"
                  >
                    {warehouseSizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfig(!showConfig)}
                    className="mr-2"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Config
                  </Button>
                  <Button
                    onClick={handleAnalyzeQuery}
                    disabled={!sqlQuery.trim() || isAnalyzing}
                    className="bg-blue-metallic-600 hover:bg-blue-metallic-700"
                  >
                    {isAnalyzing ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Analyze Query
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Advanced Configuration */}
              {showConfig && (
                <Card className="bg-gray-50">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Target Cost Reduction (%)
                        </label>
                        <Input
                          type="number"
                          value={config.targetCostReduction}
                          onChange={(e) => setConfig({...config, targetCostReduction: parseInt(e.target.value) || 0})}
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Budget Limit ($/month)
                        </label>
                        <Input
                          type="number"
                          value={config.budgetLimit}
                          onChange={(e) => setConfig({...config, budgetLimit: parseInt(e.target.value) || 0})}
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Max Warehouse Size
                        </label>
                        <select
                          value={config.maxWarehouseSize}
                          onChange={(e) => setConfig({...config, maxWarehouseSize: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          title="Select maximum warehouse size"
                        >
                          {warehouseSizes.map(size => (
                            <option key={size} value={size}>{size}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Optimization Focus
                        </label>
                        <select
                          value={config.optimizationFocus}
                          onChange={(e) => setConfig({...config, optimizationFocus: e.target.value as any})}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          title="Select optimization focus strategy"
                        >
                          <option value="cost">Cost Optimization</option>
                          <option value="performance">Performance</option>
                          <option value="balanced">Balanced</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Summary */}
        <div className="space-y-4">
          {currentAnalysis && (
            <>
              {/* Cost Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Analysis Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <DollarSign className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                      <div className="text-lg font-bold text-blue-600">
                        ${currentAnalysis.estimatedCost}
                      </div>
                      <div className="text-xs text-gray-600">Current Cost</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <TrendingDown className="w-5 h-5 mx-auto mb-1 text-green-600" />
                      <div className="text-lg font-bold text-green-600">
                        ${totalSavings.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-600">Potential Savings</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <Clock className="w-5 h-5 mx-auto mb-1 text-yellow-600" />
                      <div className="text-lg font-bold text-yellow-600">
                        {currentAnalysis.executionTime}s
                      </div>
                      <div className="text-xs text-gray-600">Execution Time</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <Gauge className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                      <div className="text-lg font-bold text-purple-600">
                        {avgCostReduction.toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-600">Avg Reduction</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-gray-600">Query Complexity</span>
                    <Badge className={getComplexityColor(currentAnalysis.complexity)}>
                      {currentAnalysis.complexity.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="text-sm text-gray-600 mb-2">Performance Metrics</div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs">Scan Efficiency</span>
                        <span className="text-xs font-medium">
                          {currentAnalysis.performanceMetrics.scanEfficiency}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs">Join Optimization</span>
                        <span className="text-xs font-medium">
                          {currentAnalysis.performanceMetrics.joinOptimization}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs">Warehouse Utilization</span>
                        <span className="text-xs font-medium">
                          {currentAnalysis.performanceMetrics.warehouseUtilization}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      // Generate and download report
                      console.log('Generating optimization report...');
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      // Apply all high-priority optimizations
                      console.log('Applying high-priority optimizations...');
                    }}
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Apply Top Recommendations
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {/* Analysis History Summary */}
          {analysisHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Analysis History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-4">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 text-blue-metallic-600" />
                  <div className="text-lg font-bold">
                    {analysisHistory.length}
                  </div>
                  <div className="text-sm text-gray-600">Queries Analyzed</div>
                  <div className="text-xs text-green-600 mt-1">
                    ${oracle.calculateTotalSavingsPotential().totalSavings.toFixed(2)} total savings identified
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Optimization Recommendations */}
      {currentAnalysis?.optimizations && currentAnalysis.optimizations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Optimization Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentAnalysis.optimizations.map((recommendation, index) => (
                <Card key={index} className="border-l-4 border-blue-metallic-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-1">
                          {recommendation.title}
                        </h4>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            className={`text-xs ${getPriorityColor(recommendation.priority)} text-white`}
                          >
                            {recommendation.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {recommendation.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-3">
                      {recommendation.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                      <div>
                        <span className="text-gray-500">Savings:</span>
                        <div className="font-medium text-green-600">
                          ${recommendation.potentialSavings.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Effort:</span>
                        <div className="font-medium capitalize">
                          {recommendation.implementationEffort}
                        </div>
                      </div>
                    </div>

                    {recommendation.sqlSuggestion && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-500 mb-1">SQL Suggestion:</div>
                        <code className="text-xs bg-gray-100 p-2 rounded block overflow-x-auto">
                          {recommendation.sqlSuggestion}
                        </code>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-3 pt-2 border-t">
                      <TrendingDown className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-600">
                        {recommendation.impact.costReduction}% cost reduction
                      </span>
                      <TrendingUp className="w-3 h-3 text-blue-600" />
                      <span className="text-xs text-blue-600">
                        {recommendation.impact.performanceGain}% performance gain
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}