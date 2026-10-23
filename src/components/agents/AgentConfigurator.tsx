import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { AgentConfigPanel } from './AgentConfigPanel';
import { AgentTraining } from './AgentTraining';
import { AgentMetricsDashboard } from './AgentMetricsDashboard';
import { useAgentStore } from '../../store/agentStore';
import { AgentMonitor } from './AgentMonitor';

export function AgentConfigurator() {
  const [activeTab, setActiveTab] = useState('config');
  const { agents, updateAgent } = useAgentStore();
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id);

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  if (!selectedAgent) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Agent Configuration</h2>
        <select
          value={selectedAgentId}
          onChange={(e) => setSelectedAgentId(e.target.value)}
          className="p-2 border rounded-lg"
        >
          {agents.map(agent => (
            <option key={agent.id} value={agent.id}>{agent.name}</option>
          ))}
        </select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="monitor">Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <AgentConfigPanel
            agent={selectedAgent}
            onUpdate={(updates) => updateAgent(selectedAgent.id, updates)}
          />
        </TabsContent>

        <TabsContent value="training">
          <AgentTraining agentId={selectedAgent.id} />
        </TabsContent>

        <TabsContent value="metrics">
          <AgentMetricsDashboard agents={agents} />
        </TabsContent>

        <TabsContent value="monitor">
          <AgentMonitor agentId={selectedAgent.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 