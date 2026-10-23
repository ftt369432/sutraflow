/**
 * Processing Status Widget
 * 
 * Displays real-time AI document processing status and insights
 * with beautiful animations and smart suggestions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Lightbulb,
  TrendingUp,
  Eye,
  Tag,
  Globe,
  Target,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Activity,
  Download,
  Share,
  BookOpen,
  MessageSquare,
  Calendar,
  Star,
  Cpu,
  BarChart3
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Spinner } from '../ui/Spinner';
import { driveVectorProcessor, ProcessingJob, ProcessingResult } from '../../services/drive/driveVectorProcessor';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface ProcessingStatusWidgetProps {
  className?: string;
  onActionClick?: (action: any) => void;
}

export const ProcessingStatusWidget: React.FC<ProcessingStatusWidgetProps> = ({
  className = '',
  onActionClick,
}) => {
  const { user } = useAuth();
  const [processingJobs, setProcessingJobs] = useState<ProcessingJob[]>([]);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [processingStats, setProcessingStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'insights'>('active');
  const [isMinimized, setIsMinimized] = useState(false);

  // Refresh processing status every 2 seconds
  useEffect(() => {
    if (!user?.id) return;

    const refreshStatus = () => {
      const userJobs = driveVectorProcessor.getUserProcessingJobs(user.id);
      setProcessingJobs(userJobs);
      setProcessingStats(driveVectorProcessor.getProcessingStats());
    };

    refreshStatus();
    const interval = setInterval(refreshStatus, 2000);

    return () => clearInterval(interval);
  }, [user?.id]);

  const handleCancelJob = useCallback(async (jobId: string) => {
    try {
      const success = await driveVectorProcessor.cancelJob(jobId);
      if (success) {
        toast.success('Processing job cancelled');
      } else {
        toast.error('Failed to cancel job');
      }
    } catch (error) {
      console.error('Failed to cancel job:', error);
      toast.error('Failed to cancel job');
    }
  }, []);

  const getStatusIcon = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Spinner className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'processing': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const activeJobs = processingJobs.filter(job => 
    job.status === 'pending' || job.status === 'processing'
  );
  const completedJobs = processingJobs.filter(job => 
    job.status === 'completed' || job.status === 'failed'
  );

  if (processingJobs.length === 0 && !processingStats) {
    return null; // Don't show widget if no processing activity
  }

  return (
    <Card className={`border-2 border-primary/20 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">AI Processing</CardTitle>
            <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
            {processingStats && (
              <Badge variant="outline" className="text-xs">
                {processingStats.activeJobs}/{processingStats.maxConcurrent} active
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {processingStats && (
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Activity className="h-3 w-3" />
                <span>{processingStats.processing} processing</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-0">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="active" className="text-xs">
                    Active ({activeJobs.length})
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="text-xs">
                    Recent ({completedJobs.length})
                  </TabsTrigger>
                  <TabsTrigger value="insights" className="text-xs">
                    Insights
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-3 mt-3">
                  <AnimatePresence>
                    {activeJobs.map((job) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="border rounded-lg p-3 bg-gradient-to-r from-primary/5 to-secondary/5"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              {getStatusIcon(job.status)}
                              <span className="font-medium text-sm truncate">
                                {job.fileName}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {job.fileType.toUpperCase()}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center space-x-2 mb-2">
                              <Progress 
                                value={job.progress} 
                                className="flex-1 h-2"
                              />
                              <span className="text-xs font-mono text-muted-foreground">
                                {job.progress}%
                              </span>
                            </div>

                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              <span className="capitalize">{job.status}</span>
                              {job.startedAt && (
                                <>
                                  <span>•</span>
                                  <span>
                                    Started {new Date(job.startedAt).toLocaleTimeString()}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex space-x-1 ml-2">
                            {job.status === 'processing' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelJob(job.id)}
                                className="text-xs"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {job.error && (
                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-300">
                            <AlertCircle className="h-3 w-3 inline mr-1" />
                            {job.error}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {activeJobs.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <Cpu className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No active processing jobs</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="completed" className="space-y-2 mt-3">
                  <AnimatePresence>
                    {completedJobs.slice(0, 5).map((job) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-sm ${
                          expandedJob === job.id ? 'bg-muted/50' : ''
                        }`}
                        onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1">
                            {getStatusIcon(job.status)}
                            <span className="font-medium text-sm truncate">
                              {job.fileName}
                            </span>
                            <Badge 
                              variant={job.status === 'completed' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {job.status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {job.completedAt && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(job.completedAt).toLocaleTimeString()}
                              </span>
                            )}
                            {expandedJob === job.id ? 
                              <ChevronUp className="h-4 w-4" /> : 
                              <ChevronDown className="h-4 w-4" />
                            }
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedJob === job.id && job.status === 'completed' && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3 pt-3 border-t space-y-2"
                            >
                              <div className="text-xs text-muted-foreground">
                                AI Processing Results:
                              </div>
                              
                              <div className="flex flex-wrap gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onActionClick?.({ type: 'view_insights', jobId: job.id });
                                  }}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View Insights
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onActionClick?.({ type: 'vector_search', fileName: job.fileName });
                                  }}
                                >
                                  <Brain className="h-3 w-3 mr-1" />
                                  Search
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onActionClick?.({ type: 'create_summary', jobId: job.id });
                                  }}
                                >
                                  <BookOpen className="h-3 w-3 mr-1" />
                                  Summary
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </TabsContent>

                <TabsContent value="insights" className="space-y-3 mt-3">
                  {processingStats && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {processingStats.completed}
                        </div>
                        <div className="text-xs text-blue-700 dark:text-blue-300">
                          Documents Processed
                        </div>
                      </div>
                      
                      <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {processingStats.processing}
                        </div>
                        <div className="text-xs text-green-700 dark:text-green-300">
                          Currently Processing
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center">
                      <Lightbulb className="h-4 w-4 mr-1" />
                      Smart Suggestions
                    </h4>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                        <span>Enable auto-tagging for uploaded documents</span>
                        <Button variant="outline" size="sm" className="text-xs">
                          Enable
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                        <span>Create knowledge graph from processed files</span>
                        <Button variant="outline" size="sm" className="text-xs">
                          Create
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                        <span>Generate document summaries automatically</span>
                        <Button variant="outline" size="sm" className="text-xs">
                          Setup
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <Button 
                      variant="outline" 
                      className="w-full text-xs"
                      onClick={() => onActionClick?.({ type: 'view_analytics' })}
                    >
                      <BarChart3 className="h-3 w-3 mr-1" />
                      View Full Analytics
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}; 