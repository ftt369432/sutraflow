import { useEffect, useState } from 'react';
import { 
  Activity, 
  CheckCircle, 
  Clock, 
  XCircle
} from 'lucide-react';
import { Card } from '../ui/Card';
import { useAgentStore } from '../../store/agentStore';
import { useAgentLogs } from '../../hooks/useAgentLogs';
import { ScrollArea } from '../ui/ScrollArea';
import { Agent } from '../../types/agent';

interface AgentMonitorProps {
  agentId: string;
}

export function AgentMonitor({ agentId }: AgentMonitorProps) {
  const { agents, actions } = useAgentStore();
  const [activeAgents, setActiveAgents] = useState<Agent[]>([]);
  const recentActions = actions.slice(-5).reverse();
  const logs = useAgentLogs(agentId);
  const agent = agents.find(a => a.id === agentId);

  const stats = {
    total: agents.length,
    active: activeAgents.length,
    completed: actions.filter(a => a.status === 'completed').length,
    failed: actions.filter(a => a.status === 'failed').length
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveAgents(agents.filter(agent => agent.status === 'active'));
    }, 5000);

    return () => clearInterval(interval);
  }, [agents]);

  if (!agent) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Agents</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Activity className="h-8 w-8 text-blue-600 dark:text-blue-300" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Active Agents</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <Clock className="h-8 w-8 text-green-600 dark:text-green-300" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Tasks Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-full">
              <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-300" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Failed Tasks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.failed}</p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-300" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4 bg-white dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Actions</h3>
        <div className="space-y-4">
          {recentActions.map(action => (
            <div
              key={action.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{action.type}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Agent: {agents.find(a => a.id === action.agentId)?.name}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                action.status === 'completed' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                action.status === 'failed' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' :
                'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
              }`}>
                {action.status}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 bg-white dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Agent Monitor</h3>
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {logs.map((log, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    log.level === 'error' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' :
                    log.level === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                    'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  }`}>
                    {log.level}
                  </span>
                </div>
                <p className="mt-2 text-gray-800 dark:text-gray-200">{log.message}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
} 