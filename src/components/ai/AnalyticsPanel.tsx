import React from 'react';
import { Button } from '../ui/Button';
import { 
  BarChart, 
  TrendingUp, 
  Clock, 
  Zap,
  Brain,
  Target,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface PerformanceMetric {
  label: string;
  value: number;
  unit: string;
  trend: number;
  icon: React.ReactNode;
}

export function AnalyticsPanel() {
  const metrics: PerformanceMetric[] = [
    {
      label: 'Response Time',
      value: 1.2,
      unit: 's',
      trend: -15,
      icon: <Clock className="h-4 w-4 text-blue-400" />
    },
    {
      label: 'Success Rate',
      value: 98.5,
      unit: '%',
      trend: 5,
      icon: <Target className="h-4 w-4 text-green-400" />
    },
    {
      label: 'Token Usage',
      value: 12.5,
      unit: 'K',
      trend: 8,
      icon: <Zap className="h-4 w-4 text-yellow-400" />
    },
    {
      label: 'Model Performance',
      value: 92,
      unit: '%',
      trend: 3,
      icon: <Brain className="h-4 w-4 text-purple-400" />
    }
  ];

  const timeRanges = ['1H', '24H', '7D', '30D'];
  const [selectedRange, setSelectedRange] = React.useState('24H');

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center gap-2">
        {timeRanges.map(range => (
          <Button
            key={range}
            variant="ghost"
            size="sm"
            className={range === selectedRange ? 'bg-cyberpunk-neon/20 text-cyberpunk-neon' : ''}
            onClick={() => setSelectedRange(range)}
          >
            {range}
          </Button>
        ))}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {metrics.map(metric => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      {/* Performance Chart */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-cyberpunk-neon">Performance Trend</h4>
          <Button variant="ghost" size="sm">
            <BarChart className="h-4 w-4 mr-1" />
            Details
          </Button>
        </div>
        <div className="h-32 bg-cyberpunk-dark/30 rounded-lg border border-cyberpunk-neon/20 p-4">
          <div className="h-full flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-cyberpunk-neon" />
          </div>
        </div>
      </div>

      {/* Insights */}
      <div>
        <h4 className="text-sm font-medium text-cyberpunk-neon mb-3">Key Insights</h4>
        <div className="space-y-2">
          <InsightCard
            title="Response Time Improved"
            description="15% faster responses in the last 24 hours"
            trend="positive"
          />
          <InsightCard
            title="Token Usage Increased"
            description="8% increase in token consumption"
            trend="negative"
          />
          <InsightCard
            title="High Success Rate"
            description="Maintaining 98.5% success rate"
            trend="neutral"
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ metric }: { metric: PerformanceMetric }) {
  return (
    <div className="p-3 rounded-lg bg-cyberpunk-dark/30 border border-cyberpunk-neon/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {metric.icon}
          <span className="text-xs text-gray-400">{metric.label}</span>
        </div>
        <TrendIndicator value={metric.trend} />
      </div>
      <div className="text-xl font-bold text-white">
        {metric.value}
        <span className="text-sm text-gray-400 ml-1">{metric.unit}</span>
      </div>
    </div>
  );
}

function TrendIndicator({ value }: { value: number }) {
  if (value === 0) return null;

  const isPositive = value > 0;
  const color = isPositive ? 'text-green-400' : 'text-red-400';

  return (
    <div className={`flex items-center gap-1 text-xs ${color}`}>
      {isPositive ? (
        <ChevronUp className="h-3 w-3" />
      ) : (
        <ChevronDown className="h-3 w-3" />
      )}
      {Math.abs(value)}%
    </div>
  );
}

function InsightCard({ 
  title, 
  description, 
  trend 
}: { 
  title: string;
  description: string;
  trend: 'positive' | 'negative' | 'neutral';
}) {
  const colors = {
    positive: 'border-green-400/20 bg-green-400/5',
    negative: 'border-red-400/20 bg-red-400/5',
    neutral: 'border-blue-400/20 bg-blue-400/5'
  };

  return (
    <div className={`p-3 rounded-lg border ${colors[trend]}`}>
      <div className="font-medium text-white text-sm">{title}</div>
      <div className="text-xs text-gray-400 mt-1">{description}</div>
    </div>
  );
} 