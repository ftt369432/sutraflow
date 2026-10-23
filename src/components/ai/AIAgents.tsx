import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Zap, Search, ArrowUpRight, Power, Wand2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Separator } from '../ui/Separator';
import { useAgentStore } from '../../store/agentStore';
import { Agent, AgentCapability } from '../../types/agent';

export function AIAgents() {
  const navigate = useNavigate();
  const { 
    agents, 
    activateAgent, 
    deactivateAgent, 
    trainAgent,
  } = useAgentStore();
  
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleAgent = (agent: Agent) => {
    if (agent.status === 'active') {
      deactivateAgent(agent.id);
    } else {
      activateAgent(agent.id);
    }
  };

  const handleTrainAgent = async (agentId: string) => {
    try {
      await trainAgent(agentId);
    } catch (error) {
      console.error('Error training agent:', error);
    }
  };

  const handleViewDetails = (agentId: string) => {
    navigate(`/agents/${agentId}`);
  };

  const navigateToWizard = () => {
    navigate('/agent-wizard');
  };

  const getCapabilityColor = (capability: AgentCapability) => {
    const colors: Record<AgentCapability, string> = {
      'email-processing': 'bg-blue-100 text-blue-800',
      'document-analysis': 'bg-purple-100 text-purple-800',
      'scheduling': 'bg-green-100 text-green-800',
      'task-management': 'bg-yellow-100 text-yellow-800',
      'natural-language': 'bg-pink-100 text-pink-800',
      'calendar-management': 'bg-indigo-100 text-indigo-800',
      'drafting': 'bg-gray-100 text-gray-800',
      'web-search': 'bg-orange-100 text-orange-800',
      'data-analysis': 'bg-cyan-100 text-cyan-800',
      'report-generation': 'bg-amber-100 text-amber-800',
      'code-generation': 'bg-lime-100 text-lime-800',
      'code-review': 'bg-emerald-100 text-emerald-800',
      'debugging': 'bg-red-100 text-red-800'
    };
    return colors[capability] || 'bg-gray-100 text-gray-800';
  };

  const getAgentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'active': 'bg-green-100 text-green-800',
      'idle': 'bg-gray-100 text-gray-800',
      'error': 'bg-red-100 text-red-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'training': 'bg-purple-100 text-purple-800',
      'paused': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Your AI Agents</h2>
          <p className="text-muted-foreground">
            Manage and monitor your AI workforce. Currently {agents.length} agents, {agents.filter(a => a.status === 'active').length} active.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search agents..."
              className="w-[200px] sm:w-[300px] pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={navigateToWizard} className="ml-2">
            <Wand2 className="h-4 w-4 mr-2" />
            Workflow Wizard
          </Button>
        </div>
      </div>

      <Separator />

      {filteredAgents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Bot className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No agents found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'Try a different search term' : 'Get started by creating your first AI agent'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => (
            <Card key={agent.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                  <Badge className={getAgentStatusColor(agent.status)}>
                    {agent.status}
                  </Badge>
                </div>
                <CardDescription>{agent.description}</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1.5">Capabilities</p>
                    <div className="flex flex-wrap gap-1">
                      {agent.capabilities.slice(0, 4).map((capability, index) => (
                        <Badge key={index} variant="secondary" className={getCapabilityColor(capability)}>
                          {capability}
                        </Badge>
                      ))}
                      {agent.capabilities.length > 4 && (
                        <Badge variant="outline">+{agent.capabilities.length - 4} more</Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1.5">Performance</p>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full" 
                          style={{ width: `${agent.performance}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{agent.performance}%</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1.5">Tasks</p>
                    <div className="flex items-center gap-4 text-sm">
                      <div>Completed: {agent.tasks.completed}</div>
                      <div>Total: {agent.tasks.total}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleViewDetails(agent.id)}
                >
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  Details
                </Button>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTrainAgent(agent.id)}
                    disabled={agent.status === 'training'}
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    Train
                  </Button>
                  <Button
                    size="sm"
                    variant={agent.status === 'active' ? 'destructive' : 'default'}
                    onClick={() => handleToggleAgent(agent)}
                  >
                    <Power className="h-4 w-4 mr-1" />
                    {agent.status === 'active' ? 'Stop' : 'Start'}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 