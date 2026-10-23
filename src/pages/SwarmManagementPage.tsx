import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Settings, 
  Activity, 
  Users, 
  PlayCircle, 
  PauseCircle, 
  StopCircle,
  BarChart3,
  Zap,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Alert, AlertDescription } from '../components/ui/Alert';
import { useSwarmStore } from '../stores/swarmStore';
import { useSwarmExecution } from '../hooks/useSwarmExecution';
import { SwarmExecutionDashboard } from '../components/swarm/SwarmExecutionDashboard';
import { SwarmPanel } from '../components/swarm/SwarmPanel';

const SwarmManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { swarms, fetchSwarms, isLoading } = useSwarmStore();
  
  const [selectedSwarmId, setSelectedSwarmId] = useState<string>(
    searchParams.get('swarmId') || ''
  );
  const [activeTab, setActiveTab] = useState<string>(
    searchParams.get('tab') || 'overview'
  );

  // Use swarm execution hook for selected swarm
  const {
    currentSwarm,
    executionContext,
    isInitializing,
    isExecuting,
    error,
    initializeSwarm,
    distributeTask,
    pauseSwarm,
    resumeSwarm,
    shutdownSwarm,
    clearError,
    createDemoTask,
    canExecute
  } = useSwarmExecution(selectedSwarmId);

  // Load swarms on mount
  useEffect(() => {
    fetchSwarms();
  }, [fetchSwarms]);

  // Update URL when selections change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedSwarmId) params.set('swarmId', selectedSwarmId);
    if (activeTab !== 'overview') params.set('tab', activeTab);
    setSearchParams(params);
  }, [selectedSwarmId, activeTab, setSearchParams]);

  // Quick actions
  const handleQuickStart = async () => {
    if (!selectedSwarmId) return;
    
    try {
      if (!executionContext) {
        await initializeSwarm(selectedSwarmId);
      }
      
      // Create and distribute a demo task
      const demoTask = createDemoTask('Document Analysis Demo', 6);
      await distributeTask(selectedSwarmId, demoTask);
    } catch (error) {
      console.error('Quick start failed:', error);
    }
  };

  const handleEmergencyStop = async () => {
    if (!selectedSwarmId) return;
    await shutdownSwarm(selectedSwarmId);
  };

  // Get swarm status color
  const getSwarmStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white';
      case 'paused': return 'bg-yellow-500 text-white';
      case 'creating': return 'bg-blue-500 text-white';
      case 'error': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getSwarmStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <PlayCircle className="w-4 h-4" />;
      case 'paused': return <PauseCircle className="w-4 h-4" />;
      case 'creating': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <StopCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Swarm Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create, monitor, and control your AI agent swarms
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => navigate('/configure-swarm')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Swarm
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/assistants')}
          >
            <Users className="w-4 h-4 mr-2" />
            Convert Assistant
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="ml-2"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Swarms</p>
                <p className="text-2xl font-bold">{swarms.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Swarms</p>
                <p className="text-2xl font-bold">
                  {swarms.filter(s => s.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Agents</p>
                <p className="text-2xl font-bold">
                  {swarms.reduce((acc, swarm) => acc + swarm.members.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tasks Completed</p>
                <p className="text-2xl font-bold">
                  {executionContext?.performance.tasksCompleted || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Swarm Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Swarm</CardTitle>
        </CardHeader>
        <CardContent>
          {swarms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {swarms.map(swarm => (
                <div
                  key={swarm.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedSwarmId === swarm.id 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedSwarmId(swarm.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {swarm.name}
                    </h3>
                    <Badge className={getSwarmStatusColor(swarm.status)}>
                      {getSwarmStatusIcon(swarm.status)}
                      <span className="ml-1">{swarm.status}</span>
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {swarm.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{swarm.members.length} agents</span>
                    <span>{swarm.type}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Swarms Created
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create your first swarm to start coordinating AI agents
              </p>
              <div className="flex justify-center space-x-3">
                <Button onClick={() => navigate('/configure-swarm')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Swarm
                </Button>
                <Button variant="outline" onClick={() => navigate('/assistants')}>
                  <Users className="w-4 h-4 mr-2" />
                  Convert Assistant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Swarm Management */}
      {selectedSwarmId && currentSwarm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CardTitle>{currentSwarm.name}</CardTitle>
                <Badge className={getSwarmStatusColor(currentSwarm.status)}>
                  {getSwarmStatusIcon(currentSwarm.status)}
                  <span className="ml-1">{currentSwarm.status}</span>
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                {!executionContext && (
                  <Button
                    onClick={() => initializeSwarm(selectedSwarmId)}
                    disabled={isInitializing}
                    size="sm"
                  >
                    {isInitializing ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <PlayCircle className="w-4 h-4 mr-2" />
                    )}
                    Initialize
                  </Button>
                )}
                
                {canExecute && (
                  <>
                    <Button
                      onClick={handleQuickStart}
                      size="sm"
                      variant="default"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Quick Start
                    </Button>
                    
                    <Button
                      onClick={isExecuting ? () => pauseSwarm(selectedSwarmId) : () => resumeSwarm(selectedSwarmId)}
                      size="sm"
                      variant="outline"
                    >
                      {isExecuting ? (
                        <>
                          <PauseCircle className="w-4 h-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Resume
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={handleEmergencyStop}
                      size="sm"
                      variant="destructive"
                    >
                      <StopCircle className="w-4 h-4 mr-2" />
                      Stop
                    </Button>
                  </>
                )}
                
                <Button
                  onClick={() => navigate(`/configure-swarm?edit=${selectedSwarmId}`)}
                  size="sm"
                  variant="ghost"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configure
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Main Content Tabs */}
      {selectedSwarmId && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="execution">Live Execution</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <SwarmPanel />
          </TabsContent>

          <TabsContent value="execution" className="space-y-4">
            <SwarmExecutionDashboard swarmId={selectedSwarmId} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Swarm Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Advanced Analytics
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Detailed performance metrics and insights coming soon
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">Efficiency Score</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        {executionContext?.performance.efficiency || 0}%
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-green-900 dark:text-green-100">Success Rate</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {executionContext?.performance.successRate || 0}%
                      </p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-900 dark:text-purple-100">Avg. Completion</h4>
                      <p className="text-2xl font-bold text-purple-600">
                        {Math.round(executionContext?.performance.averageCompletionTime || 0)}m
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Swarm Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Advanced swarm configuration and tuning options
                  </p>
                  <Button onClick={() => navigate(`/configure-swarm?edit=${selectedSwarmId}`)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Swarm
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default SwarmManagementPage; 