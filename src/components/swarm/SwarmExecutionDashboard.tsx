import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Play, 
  Pause, 
  Square, 
  Users, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Zap,
  MessageSquare,
  Target,
  Brain,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { ScrollArea } from '../ui/ScrollArea';
import { useSwarmStore, Swarm } from '../../stores/swarmStore';
import { 
  swarmOrchestrator, 
  SwarmExecutionContext, 
  SwarmTask, 
  AgentMessage 
} from '../../services/swarm/SwarmOrchestrator';

interface SwarmExecutionDashboardProps {
  swarmId?: string;
}

export const SwarmExecutionDashboard: React.FC<SwarmExecutionDashboardProps> = ({ swarmId }) => {
  const navigate = useNavigate();
  const { swarms, fetchSwarms } = useSwarmStore();
  
  const [selectedSwarmId, setSelectedSwarmId] = useState<string>(swarmId || '');
  const [executionContext, setExecutionContext] = useState<SwarmExecutionContext | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [realtimeMessages, setRealtimeMessages] = useState<AgentMessage[]>([]);
  const [taskProgress, setTaskProgress] = useState<Record<string, number>>({});

  // Get current swarm
  const currentSwarm = swarms.find(s => s.id === selectedSwarmId);

  // Initialize swarm orchestration
  const initializeSwarm = useCallback(async (swarmId: string) => {
    if (!swarmId) return;
    
    setIsInitializing(true);
    try {
      const context = await swarmOrchestrator.initializeSwarm(swarmId);
      setExecutionContext(context);
      
      // Set up real-time listeners
      swarmOrchestrator.on('task_distributed', handleTaskDistributed);
      swarmOrchestrator.on('task_progress_updated', handleTaskProgress);
      swarmOrchestrator.on('task_completed', handleTaskCompleted);
      swarmOrchestrator.on('message_sent', handleMessage);
      
    } catch (error) {
      console.error('Failed to initialize swarm:', error);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Event handlers
  const handleTaskDistributed = useCallback((data: any) => {
    setExecutionContext(prev => prev ? { 
      ...prev, 
      currentTasks: [...prev.currentTasks, data.task] 
    } : null);
  }, []);

  const handleTaskProgress = useCallback((data: any) => {
    setTaskProgress(prev => ({ ...prev, [data.taskId]: data.progress }));
  }, []);

  const handleTaskCompleted = useCallback((data: any) => {
    setTaskProgress(prev => ({ ...prev, [data.taskId]: 100 }));
  }, []);

  const handleMessage = useCallback((data: any) => {
    setRealtimeMessages(prev => [data.message, ...prev].slice(0, 50));
  }, []);

  // Load swarms on mount
  useEffect(() => {
    fetchSwarms();
  }, [fetchSwarms]);

  // Initialize selected swarm
  useEffect(() => {
    if (selectedSwarmId && !executionContext) {
      initializeSwarm(selectedSwarmId);
    }
  }, [selectedSwarmId, executionContext, initializeSwarm]);

  // Swarm control actions
  const handleStartTask = async () => {
    if (!selectedSwarmId) return;
    
    // Demo task for testing
    const demoTask = {
      title: 'Complex Document Analysis',
      description: 'Analyze uploaded documents for key insights and generate summary report',
      priority: 'high' as const,
      complexity: 7,
      requiredCapabilities: ['document_analysis', 'research', 'communication'],
      assignedAgents: [],
      deadline: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
    };
    
    try {
      await swarmOrchestrator.distributeTask(selectedSwarmId, demoTask);
    } catch (error) {
      console.error('Failed to distribute task:', error);
    }
  };

  const handlePauseSwarm = async () => {
    if (!selectedSwarmId) return;
    await swarmOrchestrator.pauseSwarm(selectedSwarmId);
  };

  const handleResumeSwarm = async () => {
    if (!selectedSwarmId) return;
    await swarmOrchestrator.resumeSwarm(selectedSwarmId);
  };

  const handleShutdownSwarm = async () => {
    if (!selectedSwarmId) return;
    await swarmOrchestrator.shutdownSwarm(selectedSwarmId);
    setExecutionContext(null);
  };

  // Get status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'creating': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'assigned': return 'text-purple-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (!swarms.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Swarms Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create a swarm to start real-time execution monitoring
          </p>
          <Button onClick={() => navigate('/configure-swarm')}>
            Create Swarm
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Swarm Execution Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and control real-time swarm coordination
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedSwarmId}
            onChange={(e) => setSelectedSwarmId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">Select Swarm</option>
            {swarms.map(swarm => (
              <option key={swarm.id} value={swarm.id}>
                {swarm.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {currentSwarm && (
        <>
          {/* Swarm Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(currentSwarm.status)}`} />
                  <CardTitle>{currentSwarm.name}</CardTitle>
                  <Badge variant="outline">{currentSwarm.status}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStartTask}
                    disabled={isInitializing}
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Start Task
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={currentSwarm.status === 'active' ? handlePauseSwarm : handleResumeSwarm}
                    disabled={isInitializing}
                  >
                    {currentSwarm.status === 'active' ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Resume
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleShutdownSwarm}
                    disabled={isInitializing}
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Shutdown
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {currentSwarm.description}
              </p>
              
              {/* Performance Metrics */}
              {executionContext && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-blue-600 dark:text-blue-400">Tasks Completed</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {executionContext.performance.tasksCompleted}
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-purple-600" />
                      <span className="text-sm text-purple-600 dark:text-purple-400">Avg. Time</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      {Math.round(executionContext.performance.averageCompletionTime)}m
                    </p>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-600 dark:text-green-400">Success Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {Math.round(executionContext.performance.successRate)}%
                    </p>
                  </div>
                  
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-orange-600" />
                      <span className="text-sm text-orange-600 dark:text-orange-400">Efficiency</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                      {Math.round(executionContext.performance.efficiency)}%
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs for different views */}
          <Tabs defaultValue="agents" className="space-y-4">
            <TabsList>
              <TabsTrigger value="agents">Agent Status</TabsTrigger>
              <TabsTrigger value="tasks">Active Tasks</TabsTrigger>
              <TabsTrigger value="messages">Live Messages</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Agent Status Tab */}
            <TabsContent value="agents">
              <Card>
                <CardHeader>
                  <CardTitle>Agent Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentSwarm.members.map(member => (
                      <div
                        key={member.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {member.name}
                          </h4>
                          <Badge 
                            variant={member.status === 'active' ? 'default' : 'secondary'}
                          >
                            {member.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {member.role}
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Performance</span>
                            <span>{member.performance || 0}/100</span>
                          </div>
                          <Progress value={member.performance || 0} className="h-2" />
                        </div>
                        {member.capabilities && member.capabilities.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-1">Capabilities:</p>
                            <div className="flex flex-wrap gap-1">
                              {member.capabilities.slice(0, 3).map((cap, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-xs rounded"
                                >
                                  {cap}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Active Tasks Tab */}
            <TabsContent value="tasks">
              <Card>
                <CardHeader>
                  <CardTitle>Active Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  {executionContext?.currentTasks.length ? (
                    <div className="space-y-4">
                      {executionContext.currentTasks.map(task => (
                        <div
                          key={task.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {task.title}
                            </h4>
                            <div className="flex items-center space-x-2">
                              <Badge className={getTaskStatusColor(task.status)}>
                                {task.status}
                              </Badge>
                              <Badge variant="outline">
                                Priority: {task.priority}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {task.description}
                          </p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{taskProgress[task.id] || task.progress || 0}%</span>
                            </div>
                            <Progress value={taskProgress[task.id] || task.progress || 0} className="h-2" />
                          </div>
                          <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                            <span>Assigned to {task.assignedAgents.length} agents</span>
                            <span>Complexity: {task.complexity}/10</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">No active tasks</p>
                      <Button onClick={handleStartTask} className="mt-4">
                        Start a Task
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Live Messages Tab */}
            <TabsContent value="messages">
              <Card>
                <CardHeader>
                  <CardTitle>Live Agent Communication</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    {realtimeMessages.length ? (
                      <div className="space-y-2">
                        {realtimeMessages.map(message => (
                          <div
                            key={message.id}
                            className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 dark:bg-gray-800 rounded"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">
                                {message.fromAgentId} → {message.toAgentId || 'All'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {message.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {message.type}: {JSON.stringify(message.content).substring(0, 100)}...
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">No recent messages</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Swarm Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Advanced analytics coming soon
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default SwarmExecutionDashboard; 