import React from 'react';
import { Card } from '../ui/Card';
import { Activity, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export function AgentMonitoringDashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Agent Monitoring</h2>
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            <span>Active Agents</span>
          </div>
          <p className="text-2xl font-bold mt-2">5</p>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Tasks Completed</span>
          </div>
          <p className="text-2xl font-bold mt-2">24</p>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <span>Pending Tasks</span>
          </div>
          <p className="text-2xl font-bold mt-2">8</p>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-500" />
            <span>Avg Response Time</span>
          </div>
          <p className="text-2xl font-bold mt-2">1.2s</p>
        </Card>
      </div>
    </div>
  );
} 