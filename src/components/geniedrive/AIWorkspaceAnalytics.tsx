import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Clock, 
  Users, 
  FileText, 
  Brain,
  Target,
  Zap,
  Calendar,
  Activity,
  Eye,
  Download,
  Share2,
  Star,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { AIDriveFile } from '../../services/drive/aiDriveService';

interface AnalyticsMetric {
  id: string;
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  color: string;
}

interface ProductivityInsight {
  id: string;
  type: 'warning' | 'success' | 'info' | 'tip';
  title: string;
  description: string;
  action?: string;
  priority: number;
}

interface FileActivity {
  id: string;
  fileName: string;
  action: string;
  timestamp: Date;
  user: string;
  type: 'created' | 'modified' | 'accessed' | 'shared' | 'analyzed';
}

interface AIWorkspaceAnalyticsProps {
  files: AIDriveFile[];
  currentFolder: AIDriveFile | null;
  className?: string;
}

export const AIWorkspaceAnalytics: React.FC<AIWorkspaceAnalyticsProps> = ({
  files,
  currentFolder,
  className = ''
}) => {
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [insights, setInsights] = useState<ProductivityInsight[]>([]);
  const [recentActivity, setRecentActivity] = useState<FileActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  useEffect(() => {
    generateAnalytics();
  }, [files, currentFolder, selectedTimeRange]);

  const generateAnalytics = async () => {
    setIsLoading(true);
    
    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const totalFiles = files.length;
    const aiProcessedFiles = files.filter(f => f.ai_summary || f.vector_document_id).length;
    const recentFiles = files.filter(f => {
      const fileDate = new Date(f.created_at);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - parseInt(selectedTimeRange));
      return fileDate > cutoff;
    }).length;

    const organizationScore = calculateOrganizationScore();
    const aiUtilization = totalFiles > 0 ? Math.round((aiProcessedFiles / totalFiles) * 100) : 0;
    const productivityScore = calculateProductivityScore();

    const newMetrics: AnalyticsMetric[] = [
      {
        id: 'total-files',
        title: 'Total Files',
        value: totalFiles,
        change: recentFiles > 0 ? +12 : 0,
        trend: recentFiles > 0 ? 'up' : 'stable',
        icon: <FileText className="h-5 w-5" />,
        color: 'text-blue-600'
      },
      {
        id: 'ai-processed',
        title: 'AI Processed',
        value: `${aiUtilization}%`,
        change: +8,
        trend: 'up',
        icon: <Brain className="h-5 w-5" />,
        color: 'text-purple-600'
      },
      {
        id: 'organization',
        title: 'Organization Score',
        value: `${organizationScore}%`,
        change: organizationScore > 75 ? +5 : -2,
        trend: organizationScore > 75 ? 'up' : 'down',
        icon: <Target className="h-5 w-5" />,
        color: 'text-green-600'
      },
      {
        id: 'productivity',
        title: 'Productivity Index',
        value: productivityScore,
        change: +15,
        trend: 'up',
        icon: <Zap className="h-5 w-5" />,
        color: 'text-yellow-600'
      },
      {
        id: 'storage-efficiency',
        title: 'Storage Efficiency',
        value: '87%',
        change: +3,
        trend: 'up',
        icon: <BarChart3 className="h-5 w-5" />,
        color: 'text-indigo-600'
      },
      {
        id: 'collaboration',
        title: 'Collaboration Score',
        value: '92%',
        change: +7,
        trend: 'up',
        icon: <Users className="h-5 w-5" />,
        color: 'text-pink-600'
      }
    ];

    setMetrics(newMetrics);
    generateInsights(newMetrics);
    generateRecentActivity();
    setIsLoading(false);
  };

  const calculateOrganizationScore = (): number => {
    const foldersCount = files.filter(f => f.is_folder).length;
    const filesInFolders = files.filter(f => !f.is_folder && f.parent_id).length;
    const totalFiles = files.filter(f => !f.is_folder).length;
    
    if (totalFiles === 0) return 100;
    
    const organizationRatio = totalFiles > 0 ? (filesInFolders / totalFiles) : 0;
    const folderUtilization = foldersCount > 0 ? Math.min(filesInFolders / foldersCount, 10) / 10 : 0;
    
    return Math.round((organizationRatio * 0.7 + folderUtilization * 0.3) * 100);
  };

  const calculateProductivityScore = (): number => {
    const aiProcessedFiles = files.filter(f => f.ai_summary).length;
    const searchableFiles = files.filter(f => f.vector_document_id).length;
    const taggedFiles = files.filter(f => f.tags && f.tags.length > 0).length;
    const recentActivity = files.filter(f => {
      const fileDate = new Date(f.updated_at || f.created_at);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      return fileDate > cutoff;
    }).length;

    const baseScore = files.length > 0 ? 
      ((aiProcessedFiles + searchableFiles + taggedFiles) / (files.length * 3)) * 70 : 0;
    const activityBonus = Math.min(recentActivity * 2, 30);
    
    return Math.round(baseScore + activityBonus);
  };

  const generateInsights = (metrics: AnalyticsMetric[]) => {
    const newInsights: ProductivityInsight[] = [];

    // AI Utilization Insights
    const aiMetric = metrics.find(m => m.id === 'ai-processed');
    const aiValue = parseInt(aiMetric?.value.toString().replace('%', '') || '0');
    
    if (aiValue < 50) {
      newInsights.push({
        id: 'low-ai-usage',
        type: 'warning',
        title: 'Low AI Utilization',
        description: `Only ${aiValue}% of your files are AI-processed. Enable AI analysis to unlock powerful search and insights.`,
        action: 'Process All Files',
        priority: 8
      });
    } else if (aiValue > 80) {
      newInsights.push({
        id: 'high-ai-usage',
        type: 'success',
        title: 'Excellent AI Integration',
        description: `${aiValue}% of files are AI-enhanced. Your workspace is optimized for intelligent search and automation.`,
        priority: 6
      });
    }

    // Organization Insights
    const orgMetric = metrics.find(m => m.id === 'organization');
    const orgValue = parseInt(orgMetric?.value.toString().replace('%', '') || '0');
    
    if (orgValue < 60) {
      newInsights.push({
        id: 'poor-organization',
        type: 'warning',
        title: 'Workspace Needs Organization',
        description: 'Many files are not organized in folders. Let AI auto-organize your workspace for better productivity.',
        action: 'Auto-Organize',
        priority: 7
      });
    }

    // Storage Efficiency
    if (files.length > 100) {
      newInsights.push({
        id: 'large-workspace',
        type: 'info',
        title: 'Large Workspace Detected',
        description: `You have ${files.length} files. Consider archiving older files or using AI-powered organization.`,
        action: 'Archive Old Files',
        priority: 5
      });
    }

    // Productivity Tips
    const untaggedFiles = files.filter(f => !f.tags || f.tags.length === 0).length;
    if (untaggedFiles > files.length * 0.5) {
      newInsights.push({
        id: 'missing-tags',
        type: 'tip',
        title: 'Improve File Discoverability',
        description: `${untaggedFiles} files lack tags. AI can auto-tag files to improve search and organization.`,
        action: 'Auto-Tag Files',
        priority: 4
      });
    }

    // Collaboration Insights
    const sharedFiles = files.filter(f => f.is_shared).length;
    if (sharedFiles > 0) {
      newInsights.push({
        id: 'active-collaboration',
        type: 'success',
        title: 'Active Collaboration',
        description: `${sharedFiles} files are shared with team members. Great teamwork!`,
        priority: 3
      });
    }

    // Security Insights
    const sensitiveFiles = files.filter(f => 
      f.name.toLowerCase().includes('confidential') || 
      f.name.toLowerCase().includes('private') ||
      f.ai_summary?.toLowerCase().includes('sensitive')
    ).length;
    
    if (sensitiveFiles > 0) {
      newInsights.push({
        id: 'sensitive-files',
        type: 'warning',
        title: 'Sensitive Files Detected',
        description: `${sensitiveFiles} files may contain sensitive information. Review sharing settings and access controls.`,
        action: 'Review Security',
        priority: 9
      });
    }

    setInsights(newInsights.sort((a, b) => b.priority - a.priority));
  };

  const generateRecentActivity = () => {
    const activities: FileActivity[] = [];
    
    // Generate mock recent activity based on files
    files.slice(0, 10).forEach((file, index) => {
      const actions: FileActivity['type'][] = ['created', 'modified', 'accessed', 'analyzed'];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      const randomDate = new Date();
      randomDate.setHours(randomDate.getHours() - (index * 2));

      activities.push({
        id: `activity-${index}`,
        fileName: file.name,
        action: getActionText(randomAction),
        timestamp: randomDate,
        user: 'You',
        type: randomAction
      });
    });

    setRecentActivity(activities);
  };

  const getActionText = (type: FileActivity['type']): string => {
    switch (type) {
      case 'created': return 'Created';
      case 'modified': return 'Modified';
      case 'accessed': return 'Accessed';
      case 'shared': return 'Shared';
      case 'analyzed': return 'AI Analyzed';
      default: return 'Updated';
    }
  };

  const getActivityIcon = (type: FileActivity['type']) => {
    switch (type) {
      case 'created': return <FileText className="h-4 w-4 text-green-600" />;
      case 'modified': return <Edit className="h-4 w-4 text-blue-600" />;
      case 'accessed': return <Eye className="h-4 w-4 text-gray-600" />;
      case 'shared': return <Share2 className="h-4 w-4 text-purple-600" />;
      case 'analyzed': return <Brain className="h-4 w-4 text-indigo-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getInsightIcon = (type: ProductivityInsight['type']) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'info': return <Eye className="h-4 w-4 text-blue-600" />;
      case 'tip': return <Star className="h-4 w-4 text-purple-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Analyzing workspace with AI...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Workspace Analytics</h2>
        <div className="flex space-x-2">
          {['1d', '7d', '30d', '90d'].map((range) => (
            <Button
              key={range}
              variant={selectedTimeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.id} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={metric.color}>
                {metric.icon}
              </div>
              <div className={`flex items-center text-xs ${
                metric.trend === 'up' ? 'text-green-600' : 
                metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {metric.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : metric.trend === 'down' ? (
                  <TrendingDown className="h-3 w-3 mr-1" />
                ) : null}
                {metric.change > 0 ? '+' : ''}{metric.change}%
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">{metric.value}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">{metric.title}</div>
          </Card>
        ))}
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center">
              <Brain className="h-5 w-5 mr-2" />
              AI-Powered Productivity Insights
            </h3>
            <div className="space-y-3">
              {insights.map((insight) => (
                <div key={insight.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className="mt-0.5">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <Badge variant={insight.type === 'warning' ? 'destructive' : 'secondary'}>
                        {insight.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {insight.description}
                    </p>
                    {insight.action && (
                      <Button size="sm" variant="outline">
                        {insight.action}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <div className="text-sm">
                      <span className="font-medium">{activity.action}</span>
                      <span className="text-gray-600 dark:text-gray-400 ml-2">
                        {activity.fileName}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {activity.user} • {formatRelativeTime(activity.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">AI Processing Status</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Text Extraction</span>
                    <span>95%</span>
                  </div>
                  <Progress value={95} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>AI Analysis</span>
                    <span>78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Vector Indexing</span>
                    <span>82%</span>
                  </div>
                  <Progress value={82} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>OCR Processing</span>
                    <span>65%</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-4">Storage Insights</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">2.4 GB</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Storage Used</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Documents</span>
                    <span>1.8 GB (75%)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Images</span>
                    <span>0.4 GB (17%)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Other</span>
                    <span>0.2 GB (8%)</span>
                  </div>
                </div>
                <Progress value={48} className="h-2" />
                <div className="text-xs text-gray-500 text-center">
                  48% of 5 GB plan used
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 