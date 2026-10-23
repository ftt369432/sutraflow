import { Card } from '../ui/Card';
import { useAgentStore } from '../../store/agentStore';
import { 
  Activity, 
  Brain, 
  CheckCircle, 
  AlertCircle,
  Clock,
  BarChart
} from 'lucide-react';
import { agentMetrics } from '../../services/agentMetricsService';

export function AgentOverview() {
  const { agents, actions } = useAgentStore();
  
  const systemMetrics = agentMetrics.getSystemMetrics();
  
  const stats = {
    totalAgents: agents.length,
    activeAgents: agents.filter(a => a.status === 'active').length,
    totalActions: actions.length,
    successRate: systemMetrics?.systemSuccessRate || 0,
    avgResponseTime: systemMetrics?.averageResponseTime || 0,
    capabilities: new Set(agents.flatMap(a => a.capabilities)).size
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Agent System Overview</h2>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Agent Stats */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Agent Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-500" />
                <span>Total Agents</span>
              </div>
              <span className="font-bold">{stats.totalAgents}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" />
                <span>Active Agents</span>
              </div>
              <span className="font-bold">{stats.activeAgents}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BarChart className="h-5 w-5 text-purple-500" />
                <span>Capabilities</span>
              </div>
              <span className="font-bold">{stats.capabilities}</span>
            </div>
          </div>
        </Card>

        {/* Performance Metrics */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Success Rate</span>
              </div>
              <span className="font-bold">
                {(stats.successRate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span>Avg Response Time</span>
              </div>
              <span className="font-bold">
                {stats.avgResponseTime.toFixed(2)}ms
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <span>Total Actions</span>
              </div>
              <span className="font-bold">{stats.totalActions}</span>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-2">
            {actions.slice(-5).reverse().map(action => (
              <div 
                key={action.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div className="text-sm">
                  <div className="font-medium">{action.type}</div>
                  <div className="text-gray-500">
                    {agents.find(a => a.id === action.agentId)?.name}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs ${
                  action.status === 'completed' ? 'bg-green-100 text-green-800' :
                  action.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {action.status}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Agent Type Distribution */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Agent Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(
            agents.reduce((acc, agent) => {
              acc[agent.type] = (acc[agent.type] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          ).map(([type, count]) => (
            <div key={type} className="text-center p-4 bg-gray-50 rounded">
              <div className="text-lg font-bold">{count}</div>
              <div className="text-sm text-gray-500">{type}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
} 