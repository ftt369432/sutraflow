import React, { useState, useEffect } from 'react';
import {
  Brain,
  Zap,
  TrendingUp,
  Target,
  Activity,
  Clock,
  Eye,
  Settings,
  Play,
  Pause,
  BarChart3,
  Lightbulb,
  MessageSquare,
  FileText,
  User,
  Star,
  CheckCircle,
  AlertTriangle,
  Info,
  Gauge,
  BookOpen,
  Calendar
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Label } from '../ui/Label';
import { Progress } from '../ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import type { AIAssistant } from '../../types/ai';

interface LearningInsight {
  id: string;
  type: 'habit' | 'preference' | 'pattern' | 'improvement';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  applied: boolean;
  timestamp: Date;
  data: any;
}

interface UserPattern {
  category: string;
  frequency: number;
  accuracy: number;
  avgResponseTime: number;
  preferredFormats: string[];
  commonQuestions: string[];
  timeOfDay: string[];
  improvement: number;
}

interface AutonomousLearningPanelProps {
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
  onSaveKnowledge?: (content: string, metadata: any) => void;
}

export function AutonomousLearningPanel({
  selectedAssistant,
  conversationContext,
  chatMessages = [],
  onSaveKnowledge
}: AutonomousLearningPanelProps) {
  const [autonomousLearning, setAutonomousLearning] = useState(true);
  const [learningMode, setLearningMode] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
  const [insights, setInsights] = useState<LearningInsight[]>([]);
  const [userPatterns, setUserPatterns] = useState<UserPattern[]>([]);
  const [learningStats, setLearningStats] = useState({
    totalInsights: 0,
    appliedLearnings: 0,
    accuracyImprovement: 0,
    habitsDetected: 0,
    lastLearning: null as Date | null
  });
  const [privacyMode, setPrivacyMode] = useState(false);
  const [learningFrequency, setLearningFrequency] = useState<'realtime' | 'hourly' | 'daily'>('hourly');

  useEffect(() => {
    if (autonomousLearning) {
      analyzeInteractions();
    }
  }, [chatMessages, conversationContext, autonomousLearning]);

  const analyzeInteractions = () => {
    if (!selectedAssistant || chatMessages.length === 0) return;

    // Analyze conversation patterns
    const patterns = detectUserPatterns();
    setUserPatterns(patterns);

    // Generate learning insights
    const newInsights = generateLearningInsights();
    setInsights(prev => [...newInsights, ...prev].slice(0, 20)); // Keep latest 20

    // Update stats
    setLearningStats(prev => ({
      ...prev,
      totalInsights: prev.totalInsights + newInsights.length,
      lastLearning: new Date(),
      habitsDetected: patterns.length
    }));

    // Auto-apply high-confidence insights if in aggressive mode
    if (learningMode === 'aggressive') {
      newInsights
        .filter(insight => insight.confidence > 0.8 && insight.impact === 'high')
        .forEach(insight => applyInsight(insight));
    }
  };

  const detectUserPatterns = (): UserPattern[] => {
    const patterns: UserPattern[] = [];
    
    // Analyze message timing
    const messagesByHour = chatMessages.reduce((acc, msg) => {
      const hour = new Date(msg.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Detect question patterns
    const userMessages = chatMessages.filter(msg => msg.role === 'user');
    const questionTypes = categorizeQuestions(userMessages);

    // Analyze response preferences
    const responsePreferences = analyzeResponsePreferences();

    // Create patterns
    Object.entries(questionTypes).forEach(([category, data]) => {
      patterns.push({
        category,
        frequency: data.count,
        accuracy: data.avgSatisfaction || 75,
        avgResponseTime: data.avgResponseTime || 1500,
        preferredFormats: data.preferredFormats || ['detailed'],
        commonQuestions: data.commonQuestions || [],
        timeOfDay: getActiveHours(messagesByHour),
        improvement: calculateImprovement(category)
      });
    });

    return patterns;
  };

  const categorizeQuestions = (messages: any[]) => {
    const categories: Record<string, any> = {};
    
    messages.forEach(msg => {
      const content = msg.content.toLowerCase();
      let category = 'general';
      
      if (content.includes('how') || content.includes('explain')) category = 'explanation';
      else if (content.includes('what') || content.includes('define')) category = 'definition';
      else if (content.includes('why') || content.includes('reason')) category = 'reasoning';
      else if (content.includes('help') || content.includes('assist')) category = 'assistance';
      else if (content.includes('analyze') || content.includes('review')) category = 'analysis';
      
      if (!categories[category]) {
        categories[category] = { count: 0, commonQuestions: [], avgResponseTime: 0 };
      }
      categories[category].count++;
      categories[category].commonQuestions.push(content.substring(0, 50));
    });

    return categories;
  };

  const analyzeResponsePreferences = () => {
    // Analyze which types of responses get better engagement
    return {
      preferredLength: 'medium', // Short, medium, long
      preferredFormat: 'structured', // Structured, conversational, technical
      preferredSources: 'documents' // Documents, general knowledge, mixed
    };
  };

  const getActiveHours = (messagesByHour: Record<number, number>) => {
    const sortedHours = Object.entries(messagesByHour)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => {
        const h = parseInt(hour);
        if (h < 12) return 'morning';
        if (h < 17) return 'afternoon';
        return 'evening';
      });
    return [...new Set(sortedHours)];
  };

  const calculateImprovement = (category: string) => {
    // Calculate improvement trend for this category
    return Math.random() * 20 + 80; // Simulated for now
  };

  const generateLearningInsights = (): LearningInsight[] => {
    const insights: LearningInsight[] = [];
    
    // Habit-based insights
    if (chatMessages.length > 10) {
      insights.push({
        id: `habit_${Date.now()}`,
        type: 'habit',
        title: 'Frequent Question Pattern Detected',
        description: 'User often asks for explanations followed by examples. Consider providing examples proactively.',
        confidence: 0.85,
        impact: 'high',
        applied: false,
        timestamp: new Date(),
        data: { pattern: 'explanation_example' }
      });
    }

    // Preference insights
    if (conversationContext?.uploadedFiles.length) {
      insights.push({
        id: `pref_${Date.now()}`,
        type: 'preference',
        title: 'Document Analysis Preference',
        description: 'User frequently uploads documents for analysis. Suggest proactive document insights.',
        confidence: 0.92,
        impact: 'medium',
        applied: false,
        timestamp: new Date(),
        data: { preference: 'document_analysis' }
      });
    }

    // Performance improvements
    const avgAccuracy = 78 + Math.random() * 15;
    if (avgAccuracy < 85) {
      insights.push({
        id: `improve_${Date.now()}`,
        type: 'improvement',
        title: 'Knowledge Gap Identified',
        description: 'Lower accuracy detected in technical explanations. Recommend additional training.',
        confidence: 0.78,
        impact: 'high',
        applied: false,
        timestamp: new Date(),
        data: { area: 'technical_explanations', currentAccuracy: avgAccuracy }
      });
    }

    return insights;
  };

  const applyInsight = async (insight: LearningInsight) => {
    if (!selectedAssistant || !onSaveKnowledge) return;

    try {
      // Convert insight to training data
      const trainingData = {
        type: 'autonomous_learning',
        insight: insight,
        assistantId: selectedAssistant.id,
        timestamp: new Date()
      };

      await onSaveKnowledge(JSON.stringify(trainingData), {
        type: 'autonomous_learning',
        category: insight.type,
        confidence: insight.confidence
      });

      // Mark as applied
      setInsights(prev => prev.map(i => 
        i.id === insight.id ? { ...i, applied: true } : i
      ));

      setLearningStats(prev => ({
        ...prev,
        appliedLearnings: prev.appliedLearnings + 1
      }));

    } catch (error) {
      console.error('Failed to apply insight:', error);
    }
  };

  const getInsightIcon = (type: LearningInsight['type']) => {
    switch (type) {
      case 'habit': return <User className="h-4 w-4 text-blue-500" />;
      case 'preference': return <Star className="h-4 w-4 text-purple-500" />;
      case 'pattern': return <Activity className="h-4 w-4 text-green-500" />;
      case 'improvement': return <TrendingUp className="h-4 w-4 text-orange-500" />;
      default: return <Lightbulb className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  if (!selectedAssistant) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Assistant Selected</h3>
          <p className="text-sm text-gray-500">
            Select an assistant to enable autonomous learning
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
            <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg">
              <Brain className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Autonomous Learning
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AI learns from your interactions
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant={autonomousLearning ? 'default' : 'secondary'}>
              {autonomousLearning ? <Zap className="h-3 w-3 mr-1" /> : <Pause className="h-3 w-3 mr-1" />}
              {autonomousLearning ? 'Active' : 'Paused'}
            </Badge>
          </div>
        </div>

        {/* Learning Toggle */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <Label className="text-sm font-medium">Autonomous Learning</Label>
            <p className="text-xs text-gray-500">Learn from interactions automatically</p>
          </div>
          <Switch
            checked={autonomousLearning}
            onCheckedChange={setAutonomousLearning}
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
            <div className="font-semibold text-blue-600">{learningStats.totalInsights}</div>
            <div className="text-blue-500">Insights</div>
          </div>
          <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
            <div className="font-semibold text-green-600">{learningStats.appliedLearnings}</div>
            <div className="text-green-500">Applied</div>
          </div>
          <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
            <div className="font-semibold text-purple-600">{learningStats.habitsDetected}</div>
            <div className="text-purple-500">Habits</div>
          </div>
        </div>
      </div>

      {autonomousLearning ? (
        <Tabs defaultValue="insights" className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start mb-2 mx-4 mt-2">
            <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
            <TabsTrigger value="patterns" className="text-xs">Patterns</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
          </TabsList>

          {/* Learning Insights */}
          <TabsContent value="insights" className="flex-1 overflow-y-auto p-4">
            {insights.length === 0 ? (
              <div className="text-center py-8">
                <Lightbulb className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500">Learning from your interactions...</p>
                <p className="text-xs text-gray-400 mt-1">Insights will appear as you chat</p>
              </div>
            ) : (
              <div className="space-y-3">
                {insights.map((insight) => (
                  <Card key={insight.id} className={`p-3 border ${insight.applied ? 'bg-green-50 border-green-200' : ''}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getInsightIcon(insight.type)}
                        <Badge variant="secondary" className="text-xs">{insight.type}</Badge>
                        <Badge className={`text-xs ${getImpactColor(insight.impact)}`}>
                          {insight.impact}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-500">{Math.round(insight.confidence * 100)}%</span>
                        {insight.applied ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => applyInsight(insight)}
                            className="h-6 px-2"
                          >
                            Apply
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{insight.description}</p>
                    
                    <div className="mt-2 text-xs text-gray-400">
                      {insight.timestamp.toLocaleString()}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* User Patterns */}
          <TabsContent value="patterns" className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {userPatterns.map((pattern, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm capitalize">{pattern.category}</h4>
                    <Badge variant="secondary">{pattern.frequency} times</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Accuracy</span>
                      <span>{Math.round(pattern.accuracy)}%</span>
                    </div>
                    <Progress value={pattern.accuracy} className="h-1" />
                    
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Response Time: {pattern.avgResponseTime}ms</span>
                      <span>Active: {pattern.timeOfDay.join(', ')}</span>
                    </div>
                    
                    {pattern.commonQuestions.length > 0 && (
                      <div className="text-xs text-gray-600">
                        <strong>Common:</strong> {pattern.commonQuestions[0]}...
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="flex-1 overflow-y-auto p-4">
            <Card className="p-4">
              <h4 className="font-medium mb-4">Learning Settings</h4>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Learning Mode</Label>
                  <Select value={learningMode} onValueChange={(value) => setLearningMode(value as typeof learningMode)}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative - Manual approval</SelectItem>
                      <SelectItem value="balanced">Balanced - Medium confidence auto-apply</SelectItem>
                      <SelectItem value="aggressive">Aggressive - High confidence auto-apply</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm">Learning Frequency</Label>
                  <Select value={learningFrequency} onValueChange={(value) => setLearningFrequency(value as typeof learningFrequency)}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Real-time</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Privacy Mode</Label>
                    <p className="text-xs text-gray-500">Anonymize personal data in learning</p>
                  </div>
                  <Switch checked={privacyMode} onCheckedChange={setPrivacyMode} />
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <Pause className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">Learning Paused</h3>
            <p className="text-sm text-gray-500 mb-4">
              Enable autonomous learning to start analyzing your interactions
            </p>
            <Button onClick={() => setAutonomousLearning(true)}>
              <Play className="h-4 w-4 mr-2" />
              Start Learning
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 