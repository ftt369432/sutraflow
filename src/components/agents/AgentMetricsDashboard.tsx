import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Agent } from '../../types/agent';
import { Activity, Zap, CheckCircle, AlertCircle } from 'lucide-react';

interface AgentMetricsDashboardProps {
  agents: Agent[];
}

export function AgentMetricsDashboard({ agents = [] }: AgentMetricsDashboardProps) {
  // Add null checks and default values for metrics
  const totalTasks = agents.reduce((acc, agent) => 
    acc + (agent?.metrics?.tasks?.completed || 0), 0);
    
  const averageAccuracy = agents.length ? agents.reduce((acc, agent) =>
    acc + (agent?.metrics?.accuracy || 0), 0) / agents.length : 0;

  const averageResponseTime = agents.length ? agents.reduce((acc, agent) =>
    acc + (agent?.metrics?.responseTime || 0), 0) / agents.length : 0;

  const totalUptime = agents.reduce((acc, agent) =>
    acc + (agent?.metrics?.uptime || 0), 0);

  // Mock data for the chart - replace with real data
  const performanceData = Array.from({ length: 7 }).map((_, i) => ({
    name: `Day ${i + 1}`,
    accuracy: 75 + Math.random() * 20,
    tasks: 10 + Math.random() * 30,
    responseTime: 100 + Math.random() * 200,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Total Tasks Completed"
          value={totalTasks}
          icon={CheckCircle}
          trend={+12}
        />
        <MetricCard
          title="Average Accuracy"
          value={`${(averageAccuracy * 100).toFixed(1)}%`}
          icon={Activity}
          trend={+5}
        />
        <MetricCard
          title="Avg Response"
          value={`${Math.round(averageResponseTime)}ms`}
          icon={Zap}
          trend={-15}
        />
        <MetricCard
          title="Total Uptime"
          value={`${Math.round(totalUptime)}h`}
          icon={AlertCircle}
          trend={+8}
        />
      </div>

      {/* Performance Chart */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
        <h3 className="text-lg font-medium mb-4">Performance Trends</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="name" stroke="#ffffff60" />
              <YAxis stroke="#ffffff60" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff10',
                  border: '1px solid #ffffff20',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#10B981"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="tasks"
                stroke="#3B82F6"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="responseTime"
                stroke="#F59E0B"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Agent Performance Table */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
        <h3 className="text-lg font-medium mb-4">Agent Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-white/60">
                <th className="p-2">Agent</th>
                <th className="p-2">Status</th>
                <th className="p-2">Tasks</th>
                <th className="p-2">Accuracy</th>
                <th className="p-2">Response Time</th>
              </tr>
            </thead>
            <tbody>
              {agents.map(agent => (
                <tr key={agent.id} className="border-t border-white/10">
                  <td className="p-2">{agent.name}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      agent.status === 'active' 
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {agent.status}
                    </span>
                  </td>
                  <td className="p-2">{agent.metrics?.tasks?.completed || 0}</td>
                  <td className="p-2">{Math.round(agent.metrics?.accuracy || 0)}%</td>
                  <td className="p-2">{agent.metrics?.responseTime || 0}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend: number;
}

function MetricCard({ title, value, icon: Icon, trend }: MetricCardProps) {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/10 rounded-lg">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-white/60">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1">
        <span className={trend > 0 ? 'text-green-400' : 'text-red-400'}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
        <span className="text-white/40 text-sm">vs last week</span>
      </div>
    </div>
  );
} 