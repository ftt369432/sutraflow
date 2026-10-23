/**
 * 🧠 Learning Analytics Dashboard Component
 * 
 * Beautiful, production-ready display of adaptive learning progress and insights
 * Following prompt guidelines: Modern design, Tailwind CSS, Lucide React icons
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  Brain, 
  TrendingUp, 
  FileText, 
  MessageSquare, 
  Target,
  BarChart3,
  Lightbulb,
  Download,
  RefreshCw,
  Settings,
  Zap,
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { adaptiveLearningService } from '../../services/learning/AdaptiveLearningService';

interface LearningAnalyticsProps {
  userId: string;
  learningProgress: {
    documentsProcessed: number;
    interactionsLearned: number;
    preferencesAdapted: number;
    lastUpdate: Date;
  };
  onExportData?: () => void;
  onRefreshData?: () => void;
  className?: string;
}

export const LearningAnalytics: React.FC<LearningAnalyticsProps> = ({
  userId,
  learningProgress,
  onExportData,
  onRefreshData,
  className
}) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'patterns' | 'insights'>('overview');

  useEffect(() => {
    loadAnalytics();
  }, [userId]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = adaptiveLearningService.getLearningAnalytics(userId);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load learning analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAnalytics();
    onRefreshData?.();
  };

  const handleExport = () => {
    const data = adaptiveLearningService.exportLearningData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learning-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onExportData?.();
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="flex items-center space-x-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading learning analytics...</span>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'patterns', label: 'Patterns', icon: Activity },
    { id: 'insights', label: 'Insights', icon: Lightbulb }
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Adaptive Learning Analytics</h3>
            <p className="text-sm text-muted-foreground">
              AI is learning from your interactions to provide better responses
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center space-x-1"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center space-x-1"
          >
            <Download className="h-3 w-3" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors",
                "border-b-2 -mb-px",
                selectedTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Progress Cards */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Documents Learned</p>
                <p className="text-2xl font-bold">{learningProgress.documentsProcessed}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <Badge variant="secondary" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{analytics?.profile?.learningMetrics?.documentsProcessed || 0} this session
              </Badge>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Interactions Analyzed</p>
                <p className="text-2xl font-bold">{learningProgress.interactionsLearned}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <Badge variant="secondary" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />
                {analytics?.profile?.learningMetrics?.averageSessionTime || 0}s avg session
              </Badge>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Preferences Adapted</p>
                <p className="text-2xl font-bold">{learningProgress.preferencesAdapted}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Last updated {new Date(learningProgress.lastUpdate).toLocaleTimeString()}
              </Badge>
            </div>
          </Card>

          {/* User Profile Overview */}
          <Card className="md:col-span-3 p-6">
            <h4 className="text-sm font-semibold mb-4 flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Current Learning Profile
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Response Style</p>
                <Badge variant="outline">
                  {analytics?.profile?.preferences?.responseStyle || 'detailed'}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Technical Level</p>
                <Badge variant="outline">
                  {analytics?.profile?.preferences?.technicalLevel || 'intermediate'}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Preferred Length</p>
                <Badge variant="outline">
                  {analytics?.profile?.preferences?.preferredLength || 'medium'}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Domain Expertise</p>
                <div className="flex flex-wrap gap-1">
                  {analytics?.profile?.preferences?.domainExpertise?.length > 0 ? (
                    analytics.profile.preferences.domainExpertise.slice(0, 2).map((domain: string) => (
                      <Badge key={domain} variant="secondary" className="text-xs">
                        {domain}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="text-xs">General</Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {selectedTab === 'patterns' && (
        <div className="space-y-6">
          {/* Pattern Distribution */}
          <Card className="p-6">
            <h4 className="text-sm font-semibold mb-4 flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Learning Pattern Distribution
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {analytics?.patterns?.byType && Object.entries(analytics.patterns.byType).map(([type, count]) => (
                <div key={type} className="text-center">
                  <div className="text-lg font-bold">{count as number}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {type.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Patterns */}
          <Card className="p-6">
            <h4 className="text-sm font-semibold mb-4 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Most Frequent Patterns
            </h4>
            <div className="space-y-3">
              {analytics?.patterns?.topPatterns?.slice(0, 5).map((pattern: any, index: number) => (
                <div key={pattern.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{pattern.pattern}</p>
                      <p className="text-xs text-muted-foreground">
                        {pattern.type} • {(pattern.confidence * 100).toFixed(0)}% confidence
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{pattern.frequency}x</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {selectedTab === 'insights' && (
        <div className="space-y-6">
          {/* Learning Insights */}
          <Card className="p-6">
            <h4 className="text-sm font-semibold mb-4 flex items-center">
              <Lightbulb className="h-4 w-4 mr-2" />
              AI Learning Insights
            </h4>
            <div className="space-y-3">
              {analytics?.insights?.length > 0 ? (
                analytics.insights.map((insight: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <p className="text-sm">{insight}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Continue using the AI to generate more insights</p>
                </div>
              )}
            </div>
          </Card>

          {/* Recommendations */}
          <Card className="p-6">
            <h4 className="text-sm font-semibold mb-4 flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Optimization Recommendations
            </h4>
            <div className="space-y-3">
              {analytics?.recommendations?.length > 0 ? (
                analytics.recommendations.map((recommendation: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
                    <Zap className="h-4 w-4 text-amber-600 mt-0.5" />
                    <p className="text-sm">{recommendation}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recommendations available yet</p>
                </div>
              )}
            </div>
          </Card>

          {/* Adaptation History */}
          {analytics?.profile?.adaptationHistory?.length > 0 && (
            <Card className="p-6">
              <h4 className="text-sm font-semibold mb-4 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Recent Adaptations
              </h4>
              <div className="space-y-3">
                {analytics.profile.adaptationHistory.slice(0, 3).map((adaptation: any, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-3 border-l-2 border-green-500 bg-green-50 dark:bg-green-900/10">
                    <div className="text-xs text-muted-foreground">
                      {new Date(adaptation.date).toLocaleDateString()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{adaptation.change}</p>
                      <p className="text-xs text-muted-foreground">{adaptation.reason}</p>
                    </div>
                    <Badge 
                      variant={adaptation.impact === 'positive' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {adaptation.impact}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
