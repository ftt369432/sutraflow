import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Brain, 
  FileText, 
  Search, 
  PenTool,
  Shield,
  BarChart3,
  Users,
  Plus,
  X,
  Settings,
  Activity
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { useCanvasStore } from '../../stores/canvasStore';
import { CanvasAgent, AgentSpecialization, AITask, TaskStatus } from '../../types/canvas';
import { toast } from 'sonner';

interface AgentCoordinatorProps {
  documentId: string;
  onAddAgent?: (specialization: AgentSpecialization) => void;
  onRemoveAgent?: (agentId: string) => void;
  className?: string;
}

const AGENT_ICONS: Record<AgentSpecialization, React.ComponentType<any>> = {
  research: Search,
  writing: PenTool,
  formatting: FileText,
  legal_review: Shield,
  fact_check: CheckCircle,
  citation: FileText,
  compliance: Shield,
  financial_analysis: BarChart3
};

const AGENT_COLORS: Record<AgentSpecialization, string> = {
  research: 'bg-blue-100 text-blue-800',
  writing: 'bg-green-100 text-green-800', 
  formatting: 'bg-purple-100 text-purple-800',
  legal_review: 'bg-red-100 text-red-800',
  fact_check: 'bg-yellow-100 text-yellow-800',
  citation: 'bg-indigo-100 text-indigo-800',
  compliance: 'bg-orange-100 text-orange-800',
  financial_analysis: 'bg-cyan-100 text-cyan-800'
};

const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800'
};

export function AgentCoordinator({ 
  documentId, 
  onAddAgent, 
  onRemoveAgent, 
  className = '' 
}: AgentCoordinatorProps) {
  const {
    agents,
    tasks,
    createAgent,
    removeAgent,
    updateAgent,
    createTask,
    startTask,
    completeTask,
    failTask,
    getDocumentProgress,
    getActiveAgents,
    getAgentTasks
  } = useCanvasStore();

  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [newAgentType, setNewAgentType] = useState<AgentSpecialization>('writing');

  const documentAgents = Object.values(agents).filter(agent => agent.documentId === documentId);
  const activeAgents = getActiveAgents(documentId);
  const progress = getDocumentProgress(documentId);

  const handleAddAgent = () => {
    const agentId = createAgent(documentId, newAgentType);
    onAddAgent?.(newAgentType);
    setShowAddAgent(false);
    
    // Create initial tasks for the agent
    createInitialTasks(agentId, newAgentType);
    
    toast.success(`${newAgentType} agent added successfully`);
  };

  const handleRemoveAgent = (agentId: string) => {
    const agent = agents[agentId];
    if (agent) {
      removeAgent(agentId);
      onRemoveAgent?.(agentId);
      toast.success(`${agent.specialization} agent removed`);
    }
  };

  const createInitialTasks = (agentId: string, specialization: AgentSpecialization) => {
    const taskTemplates = getTaskTemplates(specialization);
    
    taskTemplates.forEach(template => {
      createTask(agentId, template.type, template.description);
    });
  };

  const getTaskTemplates = (specialization: AgentSpecialization) => {
    const templates: Record<AgentSpecialization, Array<{type: string, description: string}>> = {
      research: [
        { type: 'information_gathering', description: 'Gather background information and relevant sources' },
        { type: 'fact_verification', description: 'Verify key facts and statistics' },
        { type: 'source_analysis', description: 'Analyze and evaluate source credibility' }
      ],
      writing: [
        { type: 'content_creation', description: 'Create initial draft content' },
        { type: 'structure_optimization', description: 'Optimize document structure and flow' },
        { type: 'style_improvement', description: 'Enhance writing style and clarity' }
      ],
      formatting: [
        { type: 'document_formatting', description: 'Apply consistent formatting throughout document' },
        { type: 'style_compliance', description: 'Ensure compliance with style guidelines' },
        { type: 'layout_optimization', description: 'Optimize document layout and presentation' }
      ],
      legal_review: [
        { type: 'legal_analysis', description: 'Review content for legal accuracy' },
        { type: 'compliance_check', description: 'Check compliance with legal requirements' },
        { type: 'risk_assessment', description: 'Assess potential legal risks' }
      ],
      fact_check: [
        { type: 'accuracy_verification', description: 'Verify factual accuracy of claims' },
        { type: 'source_validation', description: 'Validate information sources' },
        { type: 'consistency_check', description: 'Check for internal consistency' }
      ],
      citation: [
        { type: 'citation_formatting', description: 'Format citations according to style guide' },
        { type: 'reference_verification', description: 'Verify reference accuracy and completeness' },
        { type: 'bibliography_creation', description: 'Create comprehensive bibliography' }
      ],
      compliance: [
        { type: 'regulatory_review', description: 'Review for regulatory compliance' },
        { type: 'standards_verification', description: 'Verify adherence to industry standards' },
        { type: 'audit_preparation', description: 'Prepare documentation for audit requirements' }
      ],
      financial_analysis: [
        { type: 'data_analysis', description: 'Analyze financial data and projections' },
        { type: 'model_validation', description: 'Validate financial models and assumptions' },
        { type: 'report_generation', description: 'Generate financial analysis reports' }
      ]
    };

    return templates[specialization] || [];
  };

  const handleStartTask = (taskId: string) => {
    startTask(taskId);
    const task = tasks[taskId];
    if (task) {
      updateAgent(task.agentId, { status: 'working' });
      toast.success('Task started');
    }
  };

  const handleCompleteTask = (taskId: string) => {
    completeTask(taskId);
    const task = tasks[taskId];
    if (task) {
      // Check if agent has more tasks
      const agentTasks = getAgentTasks(task.agentId);
      const remainingTasks = agentTasks.filter(t => t.status !== 'completed' && t.status !== 'failed');
      
      if (remainingTasks.length === 0) {
        updateAgent(task.agentId, { status: 'completed', progress: 100 });
      } else {
        // Update progress
        const completedTasks = agentTasks.filter(t => t.status === 'completed').length;
        const progress = (completedTasks / agentTasks.length) * 100;
        updateAgent(task.agentId, { progress });
      }
      
      toast.success('Task completed');
    }
  };

  const renderAgentCard = (agent: CanvasAgent) => {
    const Icon = AGENT_ICONS[agent.specialization];
    const agentTasks = getAgentTasks(agent.id);
    const completedTasks = agentTasks.filter(t => t.status === 'completed').length;
    const activeTasks = agentTasks.filter(t => t.status === 'in_progress').length;

    return (
      <Card 
        key={agent.id} 
        className={`cursor-pointer transition-all ${selectedAgent === agent.id ? 'ring-2 ring-blue-500' : ''}`}
        onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${AGENT_COLORS[agent.specialization]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm capitalize">
                  {agent.specialization.replace('_', ' ')}
                </CardTitle>
                <Badge variant="outline" className="text-xs mt-1">
                  {agent.status}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveAgent(agent.id);
              }}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Progress</span>
              <span>{Math.round(agent.progress)}%</span>
            </div>
            <Progress value={agent.progress} className="h-2" />
            
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Tasks:</span>
              <div className="flex gap-2">
                <span className="text-blue-600">{activeTasks} active</span>
                <span className="text-green-600">{completedTasks} done</span>
              </div>
            </div>

            {agent.currentSection && (
              <div className="text-xs text-gray-600">
                Working on: {agent.currentSection}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderTaskList = (agent: CanvasAgent) => {
    const agentTasks = getAgentTasks(agent.id);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Tasks</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              createTask(agent.id, 'custom', 'New custom task');
              toast.success('New task created');
            }}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Task
          </Button>
        </div>
        
        {agentTasks.length === 0 ? (
          <p className="text-sm text-gray-500">No tasks assigned</p>
        ) : (
          <div className="space-y-2">
            {agentTasks.map(task => (
              <div key={task.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{task.description}</span>
                      <Badge className={`text-xs ${TASK_STATUS_COLORS[task.status]}`}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600">
                      Est. {task.estimatedTime}min • Priority: {task.priority}
                    </div>
                    {task.startedAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        Started: {task.startedAt.toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {task.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartTask(task.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    )}
                    {task.status === 'in_progress' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCompleteTask(task.id)}
                        className="h-6 w-6 p-0"
                      >
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <h3 className="font-semibold">AI Agents</h3>
          <Badge variant="outline">{documentAgents.length}</Badge>
        </div>
        
        <Dialog open={showAddAgent} onOpenChange={setShowAddAgent}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add AI Agent</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Agent Specialization</label>
                <Select value={newAgentType} onValueChange={(value) => setNewAgentType(value as AgentSpecialization)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="research">Research Agent</SelectItem>
                    <SelectItem value="writing">Writing Agent</SelectItem>
                    <SelectItem value="formatting">Formatting Agent</SelectItem>
                    <SelectItem value="legal_review">Legal Review Agent</SelectItem>
                    <SelectItem value="fact_check">Fact Check Agent</SelectItem>
                    <SelectItem value="citation">Citation Agent</SelectItem>
                    <SelectItem value="compliance">Compliance Agent</SelectItem>
                    <SelectItem value="financial_analysis">Financial Analysis Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddAgent} className="w-full">
                Add Agent
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Progress Overview */}
      <div className="p-4 border-b">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{Math.round(progress.overallProgress)}%</span>
          </div>
          <Progress value={progress.overallProgress} className="h-2" />
          
          <div className="flex justify-between text-xs text-gray-600">
            <span>{activeAgents.length} active agents</span>
            <span>{progress.estimatedTimeRemaining}min remaining</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="agents" className="h-full">
          <TabsList className="w-full px-4 pt-2">
            <TabsTrigger value="agents" className="flex-1">Agents</TabsTrigger>
            <TabsTrigger value="tasks" className="flex-1">Tasks</TabsTrigger>
            <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="flex-1 overflow-y-auto p-4 space-y-3">
            {documentAgents.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 mb-3">No AI agents assigned</p>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddAgent(true)}
                >
                  Add First Agent
                </Button>
              </div>
            ) : (
              documentAgents.map(renderAgentCard)
            )}
          </TabsContent>

          <TabsContent value="tasks" className="flex-1 overflow-y-auto p-4">
            {selectedAgent ? (
              renderTaskList(agents[selectedAgent])
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600">Select an agent to view tasks</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              <h4 className="font-medium">Recent Activity</h4>
              <div className="space-y-2">
                {Object.values(tasks)
                  .filter(task => {
                    const agent = agents[task.agentId];
                    return agent && agent.documentId === documentId;
                  })
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 10)
                  .map(task => {
                    const agent = agents[task.agentId];
                    return (
                      <div key={task.id} className="flex items-center gap-3 p-2 border rounded">
                        <Activity className="h-4 w-4 text-gray-400" />
                        <div className="flex-1">
                          <div className="text-sm">
                            <span className="font-medium capitalize">{agent.specialization}</span>
                            {' '}{task.status === 'completed' ? 'completed' : 'started'}{' '}
                            <span className="text-gray-600">{task.description}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {task.completedAt?.toLocaleTimeString() || task.startedAt?.toLocaleTimeString() || task.createdAt.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 