import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Activity, Clock, CheckCircle, Zap } from 'lucide-react';
import { Agent } from '../../types/agent';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AgentMetricsProps {
  agent: Agent;
}

export function AgentMetrics({ agent }: AgentMetricsProps) {
  // Generate random data for charts (in a real app, this would be actual metrics data)
  const performanceData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Performance',
        data: [65, 70, 68, 72, 80, 78, agent.performance],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.2,
      },
    ],
  };

  const tasksData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Completed Tasks',
        data: [12, 19, 14, 15, 25, 18, agent.tasks.completed],
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Performance"
          value={`${agent.performance}%`}
          icon={<Activity className="w-5 h-5 text-blue-500" />}
          description="Overall agent effectiveness"
        />
        <MetricCard
          title="Response Time"
          value={`${agent.metrics.responseTime.toFixed(2)}ms`}
          icon={<Clock className="w-5 h-5 text-yellow-500" />}
          description="Average execution time"
        />
        <MetricCard
          title="Success Rate"
          value={`${(agent.metrics.successRate * 100).toFixed(0)}%`}
          icon={<CheckCircle className="w-5 h-5 text-green-500" />}
          description="Task completion success rate"
        />
        <MetricCard
          title="Accuracy"
          value={`${(agent.metrics.accuracy * 100).toFixed(0)}%`}
          icon={<Zap className="w-5 h-5 text-purple-500" />}
          description="Overall task accuracy"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance History</CardTitle>
          </CardHeader>
          <CardContent>
            <Line options={chartOptions} data={performanceData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <Bar options={barChartOptions} data={tasksData} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricItem label="Total Tasks" value={agent.tasks.total.toString()} />
              <MetricItem label="Completed Tasks" value={agent.tasks.completed.toString()} />
              <MetricItem label="Uptime" value={`${agent.metrics.uptime.toFixed(1)}h`} />
              <MetricItem label="Last Active" value={agent.lastActive.toLocaleDateString()} />
            </div>
            <hr className="my-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricItem label="Type" value={agent.type} />
              <MetricItem label="Status" value={agent.status} />
              <MetricItem label="Autonomy" value={agent.autonomyLevel} />
              <MetricItem label="Model" value={agent.config.model} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, icon, description }: { title: string; value: string; icon: React.ReactNode; description: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          {icon}
        </div>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
} 