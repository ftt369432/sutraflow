import React, { useState } from 'react';
import { AIAssistant } from '../components/ai/AIAssistant';
import { AIAgents } from '../components/ai/AIAgents';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, Settings, Activity, Zap, Brain, Sparkles, BookOpen, MessageSquare, Book, Bot, Wand2 } from 'lucide-react';
import { useAgentStore } from '../store/agentStore';
import { useNavigate } from 'react-router-dom';
import { AgentType, AutonomyLevel, AgentCapability } from '../types/agent';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Separator } from '../components/ui/Separator';
import { cn } from '../lib/utils';

export function AIPage() {
  const [activeTab, setActiveTab] = useState('assistant');
  const { agents, createAgent } = useAgentStore();
  const navigate = useNavigate();

  const metrics = {
    totalAgents: agents.length,
    activeAgents: agents.filter(a => a.status === 'active').length,
    averagePerformance: agents.length ? Math.round(
      agents.reduce((acc, curr) => acc + curr.performance, 0) / agents.length
    ) : 0,
    totalTasks: agents.reduce((acc, curr) => acc + curr.tasks.total, 0)
  };

  const handleCreateAgent = () => {
    createAgent({
      name: "New Custom Agent",
      type: "assistant" as AgentType,
      description: "A customizable AI assistant",
      status: "inactive",
      autonomyLevel: "supervised" as AutonomyLevel,
      capabilities: ["natural-language", "task-management"] as AgentCapability[],
      config: {
        id: crypto.randomUUID(),
        name: "New Custom Agent",
        type: "assistant" as AgentType,
        model: "gpt-4",
        temperature: 0.7,
        maxTokens: 2000,
        systemPrompt: "You are a helpful AI assistant.",
        capabilities: ["natural-language", "task-management"] as AgentCapability[],
        autonomyLevel: "supervised" as AutonomyLevel
      }
    });
  };

  const navigateToWizard = () => {
    navigate('/agent-wizard');
  };

  const recentQueries = [
    "How can I optimize my marketing strategy?",
    "Analyze this customer feedback data",
    "Create a social media content plan for next week",
    "Summarize the latest quarterly report"
  ];

  const suggestedCapabilities = [
    { name: "Content Writing", icon: BookOpen, color: "text-blue-500" },
    { name: "Data Analysis", icon: Activity, color: "text-green-500" },
    { name: "Code Generation", icon: Brain, color: "text-purple-500" },
    { name: "Image Recognition", icon: Sparkles, color: "text-amber-500" }
  ];

  return (
    <div className="container p-6 max-w-7xl mx-auto space-y-8 ai-assistant-container">
      <div className="flex justify-between items-center ai-header">
        <div>
          <h1 className="text-3xl font-bold">AI Hub</h1>
          <p className="text-muted-foreground">Your central platform for AI assistance and agents</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={navigateToWizard}>
            <Wand2 className="h-4 w-4 mr-2 interactive-icon" />
            Workflow Wizard
          </Button>
          <Button onClick={() => navigate('/agents')}>
            <Bot className="h-4 w-4 mr-2 interactive-icon" />
            View All Agents
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium card-title">Total Agents</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground interactive-icon" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalAgents}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeAgents} active right now
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium card-title">Active Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground interactive-icon" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeAgents}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((metrics.activeAgents / Math.max(metrics.totalAgents, 1)) * 100)}% of total fleet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium card-title">Performance</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground interactive-icon" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averagePerformance}%</div>
            <p className="text-xs text-muted-foreground">
              Avg. effectiveness score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium card-title">Total Tasks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground interactive-icon" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              Completed in the last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
          <TabsTrigger value="agents">AI Agents</TabsTrigger>
        </TabsList>

        <TabsContent value="assistant" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="border-2 border-primary/10">
                <CardHeader>
                  <CardTitle className="card-title">AI Assistant</CardTitle>
                  <CardDescription className="card-description">
                    Your comprehensive AI assistant powered by multiple models
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AIAssistant mode="chat" />
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base card-title">Recent Queries</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {recentQueries.map((query, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm hover:bg-accent/50 p-2 rounded cursor-pointer recent-query">
                        <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0 interactive-icon" />
                        <span className="line-clamp-2">{query}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base card-title">Suggested Capabilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {suggestedCapabilities.map((capability, i) => (
                      <Badge 
                        key={i} 
                        variant="outline" 
                        className="flex items-center justify-start gap-1.5 px-3 py-1.5 cursor-pointer hover:bg-primary/5"
                      >
                        <capability.icon className={`h-3.5 w-3.5 ${capability.color} interactive-icon`} />
                        <span className="text-xs">{capability.name}</span>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base card-title">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start secondary" size="sm">
                    <Sparkles className="h-4 w-4 mr-2 text-purple-500 interactive-icon" />
                    Create content with AI
                  </Button>
                  <Button variant="outline" className="w-full justify-start secondary" size="sm">
                    <Activity className="h-4 w-4 mr-2 text-green-500 interactive-icon" />
                    Analyze data with AI
                  </Button>
                  <Button variant="outline" className="w-full justify-start secondary" size="sm">
                    <Book className="h-4 w-4 mr-2 text-blue-500 interactive-icon" />
                    Start learning session
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <AIAgents />
        </TabsContent>
      </Tabs>
    </div>
  );
} 