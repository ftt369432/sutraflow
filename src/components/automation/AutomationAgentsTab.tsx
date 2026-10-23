import React from 'react';
import { Brain, Activity, Zap, Search } from 'lucide-react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { ActiveAgentsPanel } from '../ai/ActiveAgentsPanel';

interface AutomationAgentsTabProps {
  agentMetrics: {
    totalAgents: number;
    activeAgents: number;
    averagePerformance: number;
    totalTasks: number;
  };
  agentSearchQuery: string;
  setAgentSearchQuery: (val: string) => void;
  filteredAgents: any[];
  onSelectAgent: (id: string) => void;
}

export const AutomationAgentsTab: React.FC<AutomationAgentsTabProps> = ({
  agentMetrics,
  agentSearchQuery,
  setAgentSearchQuery,
  filteredAgents,
  onSelectAgent,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{agentMetrics.totalAgents}</div>
              <div className="text-sm text-muted-foreground">Total Agents</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Activity className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{agentMetrics.activeAgents}</div>
              <div className="text-sm text-muted-foreground">Active Agents</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Zap className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{agentMetrics.averagePerformance}%</div>
              <div className="text-sm text-muted-foreground">Avg. Performance</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{agentMetrics.totalTasks}</div>
              <div className="text-sm text-muted-foreground">Total Tasks</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search agents..."
            className="w-full pl-10 dark:bg-gray-700 dark:border-gray-600"
            value={agentSearchQuery}
            onChange={(e) => setAgentSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <ActiveAgentsPanel onSelectAgent={onSelectAgent} agents={filteredAgents} />
    </div>
  );
};
