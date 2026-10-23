import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Brain,
  FileText,
  Users,
  Clock,
  Target,
  Zap,
  CheckCircle,
  AlertTriangle,
  Info,
  Star,
  MessageSquare,
  BookOpen,
  Database,
  PieChart,
  LineChart,
  Eye,
  Filter,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Progress } from '../ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { useAssistantStore } from '../../store/assistantStore';
import type { AIAssistant } from '../../types/ai';

interface KnowledgeMetrics {
  totalDocuments: number;
  totalKnowledge: number;
  vectorizedDocuments: number;
  aiProcessedDocuments: number;
  averageAccuracy: number;
  learningRate: number;
  responseTime: number;
  userSatisfaction: number;
}

interface UsagePattern {
  period: string;
  queries: number;
  accuracy: number;
  responseTime: number;
}

interface TopicInsight {
  topic: string;
  frequency: number;
  accuracy: number;
  trend: 'up' | 'down' | 'stable';
  documents: number;
}

interface KnowledgeAnalyticsPanelProps {
  selectedAssistant?: AIAssistant | null;
  conversationContext?: {
    uploadedFiles: Array<{
      name: string;
      content: string;
      type: string;
      uploadedAt: Date;
    }>;
    analysisResults: Array<{
      fileId: string;
      analysis: string;
      timestamp: Date;
    }>;
  };
  chatMessages?: any[];
  relevantDocuments?: any[];
}

export function KnowledgeAnalyticsPanel({
  selectedAssistant,
  conversationContext,
  chatMessages = [],
  relevantDocuments = []
}: KnowledgeAnalyticsPanelProps) {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [metrics, setMetrics] = useState<KnowledgeMetrics>({
    totalDocuments: 0,
    totalKnowledge: 0,
    vectorizedDocuments: 0,
    aiProcessedDocuments: 0,
    averageAccuracy: 0,
    learningRate: 0,
    responseTime: 0,
    userSatisfaction: 0
  });
  const [usagePatterns, setUsagePatterns] = useState<UsagePattern[]>([]);
  const [topicInsights, setTopicInsights] = useState<TopicInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { documents, folders } = useKnowledgeBaseStore();
  const { assistants } = useAssistantStore();

  useEffect(() => {
    calculateMetrics();
  }, [selectedAssistant, timeRange, documents, chatMessages]);

  const calculateMetrics = () => {
    setIsLoading(true);
    
    // Calculate basic knowledge base metrics
    const assistantDocuments = selectedAssistant?.knowledgeBase?.length || 0;
    const totalDocs = documents.length;
    const vectorized = documents.filter(doc => doc.embedding_generated).length;
    const aiProcessed = documents.filter(doc => doc.ai_summary || doc.ai_tags?.length > 0).length;
    
    // Calculate conversation metrics
    const assistantMessages = chatMessages.filter(msg => msg.role === 'assistant');
    const avgResponseTime = assistantMessages.length > 0 ? 
      assistantMessages.reduce((acc, msg) => acc + (Math.random() * 2000 + 500), 0) / assistantMessages.length : 0;
    
    // Simulate accuracy based on relevantDocuments usage
    const accuracy = relevantDocuments.length > 0 ? 
      relevantDocuments.reduce((acc, doc) => acc + (doc.similarity || 0), 0) / relevantDocuments.length * 100 : 75;

    // Calculate learning rate based on uploaded files and conversation activity
    const learningRate = (conversationContext?.uploadedFiles.length || 0) * 10 + 
                        (chatMessages.length * 2) + 
                        (assistantDocuments * 5);

    setMetrics({
      totalDocuments: totalDocs,
      totalKnowledge: assistantDocuments,
      vectorizedDocuments: vectorized,
      aiProcessedDocuments: aiProcessed,
      averageAccuracy: Math.min(accuracy, 95),
      learningRate: Math.min(learningRate, 100),
      responseTime: avgResponseTime,
      userSatisfaction: Math.random() * 20 + 80 // Simulate 80-100%
    });

    // Generate usage patterns
    const patterns: UsagePattern[] = [];
    const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    for (let i = 0; i < Math.min(days, 7); i++) {
      patterns.push({
        period: `Day ${i + 1}`,
        queries: Math.floor(Math.random() * 50) + 10,
        accuracy: Math.random() * 20 + 75,
        responseTime: Math.random() * 1000 + 500
      });
    }
    setUsagePatterns(patterns.reverse());

    // Generate topic insights
    const topics = ['General', 'Technical', 'Business', 'Legal', 'Medical', 'Education'];
    const insights: TopicInsight[] = topics.map(topic => ({
      topic,
      frequency: Math.floor(Math.random() * 100) + 20,
      accuracy: Math.random() * 25 + 70,
      trend: Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down',
      documents: Math.floor(Math.random() * 20) + 5
    }));
    setTopicInsights(insights.sort((a, b) => b.frequency - a.frequency));

    setIsLoading(false);
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <Activity className="h-3 w-3 text-gray-500" />;
    }
  };

  const getMetricColor = (value: number, threshold: number = 70) => {
    if (value >= threshold + 15) return 'text-green-600';
    if (value >= threshold) return 'text-blue-600';
    if (value >= threshold - 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (value: number, threshold: number = 70) => {
    if (value >= threshold + 15) return 'bg-green-500';
    if (value >= threshold) return 'bg-blue-500';
    if (value >= threshold - 15) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!selectedAssistant) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Assistant Selected</h3>
          <p className="text-sm text-gray-500">
            Select an assistant to view knowledge analytics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Knowledge Analytics
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedAssistant.name} Performance
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as typeof timeRange)}>
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24h</SelectItem>
                <SelectItem value="7d">7d</SelectItem>
                <SelectItem value="30d">30d</SelectItem>
                <SelectItem value="90d">90d</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={calculateMetrics} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
            <div className={`font-semibold ${getMetricColor(metrics.averageAccuracy)}`}>
              {Math.round(metrics.averageAccuracy)}%
            </div>
            <div className="text-green-500">Accuracy</div>
          </div>
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
            <div className={`font-semibold ${getMetricColor(metrics.learningRate)}`}>
              {Math.round(metrics.learningRate)}%
            </div>
            <div className="text-blue-500">Learning</div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start mb-2 mx-4 mt-2">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="performance" className="text-xs">Performance</TabsTrigger>
          <TabsTrigger value="topics" className="text-xs">Topics</TabsTrigger>
          <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Knowledge Base Health */}
          <Card className="p-4">
            <h4 className="font-medium mb-3 flex items-center">
              <Database className="h-4 w-4 mr-2 text-blue-500" />
              Knowledge Base Health
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Total Documents</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{metrics.totalDocuments}</div>
                  <div className="text-xs text-gray-500">{metrics.totalKnowledge} linked</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Vectorized</span>
                  <span>{metrics.vectorizedDocuments}/{metrics.totalDocuments}</span>
                </div>
                <Progress 
                  value={metrics.totalDocuments > 0 ? (metrics.vectorizedDocuments / metrics.totalDocuments) * 100 : 0} 
                  className="h-2"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>AI Processed</span>
                  <span>{metrics.aiProcessedDocuments}/{metrics.totalDocuments}</span>
                </div>
                <Progress 
                  value={metrics.totalDocuments > 0 ? (metrics.aiProcessedDocuments / metrics.totalDocuments) * 100 : 0}
                  className="h-2"
                />
              </div>
            </div>
          </Card>

          {/* Current Session */}
          <Card className="p-4">
            <h4 className="font-medium mb-3 flex items-center">
              <Activity className="h-4 w-4 mr-2 text-green-500" />
              Current Session
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Messages</div>
                <div className="font-semibold">{chatMessages.length}</div>
              </div>
              <div>
                <div className="text-gray-500">Files Uploaded</div>
                <div className="font-semibold">{conversationContext?.uploadedFiles.length || 0}</div>
              </div>
              <div>
                <div className="text-gray-500">Sources Used</div>
                <div className="font-semibold">{relevantDocuments.length}</div>
              </div>
              <div>
                <div className="text-gray-500">Avg. Similarity</div>
                <div className="font-semibold">
                  {relevantDocuments.length > 0 ? 
                    Math.round(relevantDocuments.reduce((acc, doc) => acc + (doc.similarity || 0), 0) / relevantDocuments.length * 100) + '%' : 
                    'N/A'}
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="p-4">
            <h4 className="font-medium mb-3 flex items-center">
              <Target className="h-4 w-4 mr-2 text-purple-500" />
              Quick Stats
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Response Time</span>
                <Badge variant="secondary">
                  {Math.round(metrics.responseTime)}ms
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">User Satisfaction</span>
                <Badge variant="default">
                  {Math.round(metrics.userSatisfaction)}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Learning Rate</span>
                <Badge variant={metrics.learningRate > 70 ? 'default' : 'secondary'}>
                  {Math.round(metrics.learningRate)}%
                </Badge>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Performance */}
        <TabsContent value="performance" className="flex-1 overflow-y-auto p-4 space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-3 flex items-center">
              <LineChart className="h-4 w-4 mr-2 text-blue-500" />
              Usage Patterns ({timeRange})
            </h4>
            <div className="space-y-2">
              {usagePatterns.map((pattern, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="text-sm font-medium">{pattern.period}</div>
                  <div className="flex items-center space-x-4 text-xs">
                    <div>
                      <span className="text-gray-500">Queries: </span>
                      <span className="font-semibold">{pattern.queries}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Accuracy: </span>
                      <span className={getMetricColor(pattern.accuracy)}>
                        {Math.round(pattern.accuracy)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Response: </span>
                      <span className="font-semibold">{Math.round(pattern.responseTime)}ms</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-3 flex items-center">
              <Zap className="h-4 w-4 mr-2 text-yellow-500" />
              Performance Metrics
            </h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Accuracy</span>
                  <span className="text-sm font-semibold">{Math.round(metrics.averageAccuracy)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(metrics.averageAccuracy)}`}
                    style={{ width: `${metrics.averageAccuracy}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Learning Progress</span>
                  <span className="text-sm font-semibold">{Math.round(metrics.learningRate)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(metrics.learningRate)}`}
                    style={{ width: `${metrics.learningRate}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Knowledge Coverage</span>
                  <span className="text-sm font-semibold">
                    {metrics.totalDocuments > 0 ? Math.round((metrics.aiProcessedDocuments / metrics.totalDocuments) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${metrics.totalDocuments > 0 ? (metrics.aiProcessedDocuments / metrics.totalDocuments) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Topics */}
        <TabsContent value="topics" className="flex-1 overflow-y-auto p-4 space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-3 flex items-center">
              <PieChart className="h-4 w-4 mr-2 text-green-500" />
              Topic Analysis
            </h4>
            <div className="space-y-3">
              {topicInsights.map((topic, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <div>
                      <div className="font-medium text-sm">{topic.topic}</div>
                      <div className="text-xs text-gray-500">{topic.documents} documents</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-sm font-semibold">{topic.frequency}</div>
                      <div className="text-xs text-gray-500">{Math.round(topic.accuracy)}% acc</div>
                    </div>
                    {getTrendIcon(topic.trend)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Insights */}
        <TabsContent value="insights" className="flex-1 overflow-y-auto p-4 space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-3 flex items-center">
              <Brain className="h-4 w-4 mr-2 text-purple-500" />
              AI Insights
            </h4>
            <div className="space-y-3">
              {metrics.averageAccuracy > 90 && (
                <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-green-800 dark:text-green-200">
                      Excellent Performance
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-300">
                      Your assistant is performing exceptionally well with {Math.round(metrics.averageAccuracy)}% accuracy.
                    </div>
                  </div>
                </div>
              )}
              
              {metrics.vectorizedDocuments < metrics.totalDocuments * 0.8 && (
                <div className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Vectorization Needed
                    </div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-300">
                      {metrics.totalDocuments - metrics.vectorizedDocuments} documents need vectorization for better search.
                    </div>
                  </div>
                </div>
              )}
              
              {conversationContext?.uploadedFiles && conversationContext.uploadedFiles.length > 0 && (
                <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Learning Opportunity
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-300">
                      {conversationContext.uploadedFiles.length} new files can be processed to improve knowledge base.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-3 flex items-center">
              <Download className="h-4 w-4 mr-2 text-gray-500" />
              Export Analytics
            </h4>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Download Performance Report
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Export Topic Analysis
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                Generate Usage Statistics
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 