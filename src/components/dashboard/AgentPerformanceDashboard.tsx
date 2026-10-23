import React from 'react';
import { useAgentStore } from '../../store/agentStore';
import { Card } from '../ui/Card';

export function AgentPerformanceDashboard() {
  const { agents } = useAgentStore();

  if (!agents || agents.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Agent Performance</h2>
        <Card className="p-4">
          <p className="text-gray-500">No agents available</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Agent Performance</h2>
      {agents.map(agent => (
        <Card key={agent.id} className="p-4">
          <h3 className="font-medium">{agent.name || 'Unnamed Agent'}</h3>
          <p>Task Completion Rate: {agent.performanceMetrics?.taskCompletionRate || 0}%</p>
          <p>Average Response Time: {agent.performanceMetrics?.responseTime || 0}ms</p>
          <p>Feedback: {agent.performanceMetrics?.feedback?.join(', ') || 'No feedback'}</p>
        </Card>
      ))}
    </div>
  );
} 