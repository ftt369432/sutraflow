import React, { useEffect, useState } from 'react';
import { WorkflowVisualizer } from './WorkflowVisualizer';
import { WorkflowOrchestrator } from '../../services/WorkflowOrchestrator';
import { Button } from '../ui/Button';
import { Mic, MicOff, Brain, Play, Pause } from 'lucide-react';
import type { WorkflowPattern, AgentConfig } from '../../types/workflow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Card } from '../ui/Card';
import { AgentMetrics } from './AgentMetrics';
import { AgentTraining } from './AgentTraining';
import { WorkflowAnalytics } from './WorkflowAnalytics';
import { AgentConfigurationModal } from './AgentConfigurationModal';

export function WorkflowDashboard() {
  const [patterns, setPatterns] = useState<WorkflowPattern[]>([]);
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<WorkflowPattern | null>(null);
  const [activeTab, setActiveTab] = useState('patterns');
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null);
  const [agentMetrics, setAgentMetrics] = useState<Record<string, any>>({});

  const orchestrator = new WorkflowOrchestrator();

  useEffect(() => {
    const patternsSubscription = orchestrator.getPatterns().subscribe(setPatterns);
    const agentsSubscription = orchestrator.getActiveAgents().subscribe(setAgents);

    return () => {
      patternsSubscription.unsubscribe();
      agentsSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      const metrics = orchestrator.getAgentMetrics(selectedAgent.id);
      setAgentMetrics(prev => ({
        ...prev,
        [selectedAgent.id]: metrics
      }));
    }
  }, [selectedAgent]);

  const toggleVoiceControl = () => {
    if (isListening) {
      orchestrator.stopVoiceControl();
    } else {
      orchestrator.startVoiceControl();
    }
    setIsListening(!isListening);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Workflow Intelligence</h1>
        <div className="flex gap-4">
          <Button
            onClick={toggleVoiceControl}
            variant={isListening ? 'default' : 'outline'}
            className="flex items-center gap-2"
          >
            {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            {isListening ? 'Listening' : 'Start Voice Control'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="patterns">Workflow Patterns</TabsTrigger>
          <TabsTrigger value="agents">Active Agents</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="training">Agent Training</TabsTrigger>
        </TabsList>

        <TabsContent value="patterns">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {patterns.map(pattern => (
              <WorkflowVisualizer
                key={pattern.id}
                pattern={pattern}
                onSelectAction={() => setSelectedPattern(pattern)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="agents">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {agents.map(agent => (
              <Card key={agent.id} className="p-4">
                <div>
                  <h3 className="font-medium">{agent.name}</h3>
                  <p className="text-sm text-gray-500">{agent.type}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {agent.capabilities.map(capability => (
                      <span
                        key={capability}
                        className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full"
                      >
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Recent Activity</h4>
                  <AgentMetrics metrics={agentMetrics[agent.id]} />
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setSelectedAgent(agent)}
                  >
                    Configure
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => orchestrator.trainAgent(agent.id, [])}
                  >
                    Train
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <WorkflowAnalytics
            patterns={patterns}
            agents={agents}
            metrics={agentMetrics}
          />
        </TabsContent>

        <TabsContent value="training">
          {selectedAgent ? (
            <AgentTraining
              agent={selectedAgent}
              onTrain={(data) => orchestrator.trainAgent(selectedAgent.id, data)}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              Select an agent to start training
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Agent Configuration Modal */}
      {selectedAgent && (
        <AgentConfigurationModal
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onUpdate={(updates) => {
            // Handle agent updates
          }}
        />
      )}
    </div>
  );
} 