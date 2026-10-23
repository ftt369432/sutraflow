/**
 * 🎪 CONSOLIDATED AUTOMATION HUB
 * 
 * Central command center that brings together ALL agent systems:
 * ✅ Existing Automation Page (/automation) - Voice orchestration & workflows  
 * ✅ Existing Workflow Demo (/workflow-demo) - System demonstrations
 * ✅ Creator Dashboard (/creator/dashboard) - Professional marketplace
 * ✅ Agent Creation Wizard (/creator/create-agent) - Agent builder
 * 
 * URENO: Don't disrupt, organize and enhance
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Progress } from '../ui/progress';
import { 
  Zap, Bot, Settings, BarChart3, Users, Crown, Workflow, 
  Play, Pause, ArrowRight, Eye, Cog, Activity, Brain,
  FileText, Calendar, Mail, Database, Mic, Target,
  ShoppingCart, DollarSign, Star, TrendingUp, Briefcase
} from 'lucide-react';

// Import our new Master Agent Registry (with error handling)
// import { 
//   masterAgentRegistry, 
//   getAllAgents, 
//   getAgentsBySystem, 
//   getSystemHealth,
//   AgentSystemType,
//   type MasterAgent 
// } from '../../services/MasterAgentRegistry';

// Temporary types while we fix the registry
export enum AgentSystemType {
  CANVAS = 'canvas',
  WORKFLOW = 'workflow', 
  UNIFIED = 'unified',
  EMAIL = 'email',
  CREATOR = 'creator',
  STORE = 'store'
}

interface MasterAgent {
  id: string;
  name: string;
  type: string;
  systemType: AgentSystemType;
  capabilities: string[];
  status: 'active' | 'inactive' | 'busy' | 'error';
  metadata?: {
    successRate: number;
  };
}

interface SystemCard {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: React.ComponentType<any>;
  color: string;
  status: 'active' | 'demo' | 'beta';
  agentCount?: number;
  features: string[];
}

export default function ConsolidatedAutomationHub() {
  const navigate = useNavigate();
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [allAgents, setAllAgents] = useState<MasterAgent[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<AgentSystemType | 'all'>('all');

  // Load agent registry data (mock data for now)
  useEffect(() => {
    const loadSystemData = () => {
      try {
        // Mock system health data
        const health = {
          totalSystems: 3,
          totalAgents: 22,
          systemStats: {
            canvas: { totalAgents: 10, activeAgents: 9, averageSuccessRate: 0.95 },
            workflow: { totalAgents: 4, activeAgents: 4, averageSuccessRate: 0.92 },
            email: { totalAgents: 8, activeAgents: 7, averageSuccessRate: 0.96 }
          }
        };
        
        // Mock agents data
        const agents: MasterAgent[] = [
          {
            id: 'canvas_legal_agent',
            name: 'Legal Agent',
            type: 'legal_agent',
            systemType: AgentSystemType.CANVAS,
            capabilities: ['legal_research', 'case_analysis', 'document_drafting'],
            status: 'active',
            metadata: { successRate: 0.95 }
          },
          {
            id: 'workflow_email',
            name: 'Email Agent',
            type: 'email',
            systemType: AgentSystemType.WORKFLOW,
            capabilities: ['email_processing', 'auto_reply', 'categorization'],
            status: 'active',
            metadata: { successRate: 0.92 }
          },
          {
            id: 'canvas_medical_agent',
            name: 'Medical Agent',
            type: 'medical_agent',
            systemType: AgentSystemType.CANVAS,
            capabilities: ['medical_research', 'patient_communication', 'diagnosis_support'],
            status: 'active',
            metadata: { successRate: 0.97 }
          }
        ];
        
        setSystemHealth(health);
        setAllAgents(agents);
        
        console.log('🎪 CONSOLIDATED HUB: Loaded', agents.length, 'agents across', health.totalSystems, 'systems');
      } catch (error) {
        console.error('Error loading agent data:', error);
      }
    };

    loadSystemData();
  }, []);

  // System cards configuration
  const systemCards: SystemCard[] = [
    {
      id: 'automation',
      title: 'Voice Automation Hub',
      description: 'Voice orchestration, workflow automation, and agent coordination',
      route: '/automation',
      icon: Mic,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      status: 'active',
      agentCount: systemHealth?.systemStats?.workflow?.totalAgents || 4,
      features: ['Voice Commands', 'Workflow Automation', 'Agent Swarms', 'Real-time Processing']
    },
    {
      id: 'workflow-demo',
      title: 'Workflow System Demo',
      description: 'Interactive demonstrations of all system capabilities',
      route: '/workflow-demo',
      icon: Play,
      color: 'bg-green-100 text-green-800 border-green-200', 
      status: 'demo',
      features: ['Live Demonstrations', 'System Testing', 'Performance Metrics', 'Industry Examples']
    },
    {
      id: 'creator-dashboard',
      title: 'Creator Marketplace',
      description: 'Professional dashboard for building and monetizing AI assistants',
      route: '/creator/dashboard',
      icon: Crown,
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      status: 'active',
      agentCount: systemHealth?.systemStats?.creator?.totalAgents || 0,
      features: ['Revenue Tracking', 'Agent Management', 'Professional Templates', 'Marketplace Analytics']
    },
    {
      id: 'agent-wizard',
      title: 'Agent Creation Wizard',
      description: '5-step stackable agent builder for professionals',
      route: '/creator/create-agent',
      icon: Bot,
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      status: 'active',
      features: ['Stackable Modules', 'Professional Templates', 'Revenue Models', 'California Work Comp Attorney']
    },
    {
      id: 'canvas-system',
      title: 'Canvas Collaboration',
      description: 'Multi-agent document collaboration and creation system',
      route: '/canvas',
      icon: FileText,
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      status: 'active',
      agentCount: systemHealth?.systemStats?.canvas?.totalAgents || 10,
      features: ['Document Collaboration', 'Professional Agents', 'Quality Assurance', 'Template System']
    },
    {
      id: 'email-automation',
      title: 'Email Automation',
      description: 'Advanced email processing with industry-specific agents',
      route: '/email',
      icon: Mail,
      color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      status: 'active',
      agentCount: systemHealth?.systemStats?.email?.totalAgents || 8,
      features: ['Smart Processing', 'Auto-categorization', 'Industry Specialists', 'Task Extraction']
    }
  ];

  const navigateToSystem = (route: string) => {
    navigate(route);
  };

  const getAgentCountBySystem = (systemId: string): number => {
    if (!systemHealth?.systemStats) return 0;
    
    const systemMapping: Record<string, string> = {
      'automation': 'workflow',
      'canvas-system': 'canvas', 
      'email-automation': 'email',
      'creator-dashboard': 'creator'
    };

    const systemType = systemMapping[systemId];
    return systemHealth.systemStats[systemType]?.totalAgents || 0;
  };

  const filteredAgents = selectedSystem === 'all' 
    ? allAgents 
    : allAgents.filter(agent => agent.systemType === selectedSystem);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
          <Zap className="h-10 w-10 text-blue-600" />
          Consolidated Agent Hub
        </h1>
        <p className="text-xl text-gray-600 max-w-4xl mx-auto">
          Central command center for all AI agent systems. Access automation, workflows, 
          creator tools, and demonstrations from one unified interface.
        </p>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              System Health Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{systemHealth.totalSystems}</div>
                <div className="text-sm text-gray-600">Active Systems</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{systemHealth.totalAgents}</div>
                <div className="text-sm text-gray-600">Total Agents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {String(Object.values(systemHealth.systemStats as any).reduce((sum: number, stat: any) => sum + (stat?.activeAgents || 0), 0))}
                </div>
                <div className="text-sm text-gray-600">Active Agents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {(() => {
                    const stats = Object.values(systemHealth.systemStats as any);
                    const totalSuccess = stats.reduce((sum: number, stat: any) => sum + (stat?.averageSuccessRate || 0), 0) as number;
                    const avgSuccess = totalSuccess / stats.length;
                    return (avgSuccess * 100).toFixed(1);
                  })()}%
                </div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {systemCards.map((system) => {
          const IconComponent = system.icon;
          const agentCount = getAgentCountBySystem(system.id);
          
          return (
            <Card 
              key={system.id} 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-blue-300"
              onClick={() => navigateToSystem(system.route)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${system.color.split(' ')[0]} ${system.color.split(' ')[1]}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{system.title}</CardTitle>
                      <Badge variant={system.status === 'active' ? 'default' : 'secondary'} className="mt-1">
                        {system.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <CardDescription className="text-sm text-gray-600 mb-4 leading-relaxed">
                  {system.description}
                </CardDescription>

                {/* Agent Count */}
                {system.agentCount !== undefined && (
                  <div className="flex items-center gap-2 mb-3">
                    <Bot className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">{agentCount} Active Agents</span>
                  </div>
                )}

                {/* Features */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Key Features</div>
                  <div className="flex flex-wrap gap-1">
                    {system.features.slice(0, 3).map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {system.features.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{system.features.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Agent Registry View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            Master Agent Registry
          </CardTitle>
          <CardDescription>
            Unified view of all agents across all systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedSystem} onValueChange={(value) => setSelectedSystem(value as any)} className="space-y-4">
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="all">All ({allAgents.length})</TabsTrigger>
              <TabsTrigger value={AgentSystemType.CANVAS}>Canvas</TabsTrigger>
              <TabsTrigger value={AgentSystemType.WORKFLOW}>Workflow</TabsTrigger>
              <TabsTrigger value={AgentSystemType.EMAIL}>Email</TabsTrigger>
              <TabsTrigger value={AgentSystemType.UNIFIED}>Unified</TabsTrigger>
              <TabsTrigger value={AgentSystemType.CREATOR}>Creator</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedSystem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAgents.map((agent) => (
                  <Card key={agent.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm font-medium">{agent.name}</CardTitle>
                          <p className="text-xs text-gray-500 mt-1">{agent.type}</p>
                        </div>
                        <Badge 
                          variant={agent.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {agent.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Cog className="h-3 w-3" />
                          System: {agent.systemType}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <TrendingUp className="h-3 w-3" />
                          Success: {((agent.metadata?.successRate || 0) * 100).toFixed(0)}%
                        </div>
                        
                        {/* Capabilities */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {agent.capabilities.slice(0, 2).map((capability, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {capability.replace('_', ' ')}
                            </Badge>
                          ))}
                          {agent.capabilities.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{agent.capabilities.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredAgents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No agents found for this system type</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={() => navigate('/creator/create-agent')}
              className="flex items-center gap-2 h-12"
            >
              <Bot className="h-4 w-4" />
              Create New Agent
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/automation')}
              className="flex items-center gap-2 h-12"
            >
              <Mic className="h-4 w-4" />
              Voice Automation
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/workflow-demo')}
              className="flex items-center gap-2 h-12"
            >
              <Play className="h-4 w-4" />
              View Demo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}