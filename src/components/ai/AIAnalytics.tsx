import { BarChart, PieChart, Activity, Clock, MessageSquare, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Message, AIDocument } from '../../types/ai';

interface UsageStats {
  totalMessages: number;
  averageResponseTime: number;
  documentsProcessed: number;
  modelUsage: Record<string, number>;
  tokenUsage: {
    total: number;
    byModel: Record<string, number>;
  };
  activeHours: Record<number, number>;
}

interface AIAnalyticsProps {
  messages: Message[];
  documents: AIDocument[];
  onExport: () => void;
  onGenerateReport: () => void;
  timeRange: 'day' | 'week' | 'month' | 'year';
  onTimeRangeChange: (range: 'day' | 'week' | 'month' | 'year') => void;
}

export function AIAnalytics({
  messages,
  documents,
  onExport,
  onGenerateReport,
  timeRange,
  onTimeRangeChange
}: AIAnalyticsProps) {
  const calculateStats = (): UsageStats => {
    const stats: UsageStats = {
      totalMessages: messages.length,
      averageResponseTime: 0,
      documentsProcessed: documents.length,
      modelUsage: {},
      tokenUsage: {
        total: 0,
        byModel: {}
      },
      activeHours: {}
    };

    let totalResponseTime = 0;
    let responsesWithTime = 0;

    messages.forEach(message => {
      // Track model usage
      if (message.metadata?.model) {
        stats.modelUsage[message.metadata.model] = (stats.modelUsage[message.metadata.model] || 0) + 1;
      }

      // Track token usage
      if (message.metadata?.tokens) {
        stats.tokenUsage.total += message.metadata.tokens;
        if (message.metadata.model) {
          stats.tokenUsage.byModel[message.metadata.model] = 
            (stats.tokenUsage.byModel[message.metadata.model] || 0) + message.metadata.tokens;
        }
      }

      // Track response time
      if (message.metadata?.processingTime) {
        totalResponseTime += message.metadata.processingTime;
        responsesWithTime++;
      }

      // Track active hours
      const hour = message.timestamp.getHours();
      stats.activeHours[hour] = (stats.activeHours[hour] || 0) + 1;
    });

    stats.averageResponseTime = responsesWithTime > 0 ? totalResponseTime / responsesWithTime : 0;

    return stats;
  };

  const stats = calculateStats();

  const timeRangeOptions: Array<'day' | 'week' | 'month' | 'year'> = ['day', 'week', 'month', 'year'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Analytics & Insights</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border">
            {timeRangeOptions.map(option => (
              <button
                key={option}
                className={`px-3 py-1 text-sm ${
                  timeRange === option
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
                onClick={() => onTimeRangeChange(option)}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
          <Button variant="outline" onClick={onExport}>
            Export Data
          </Button>
          <Button onClick={onGenerateReport}>
            Generate Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h3 className="font-medium">Total Messages</h3>
          </div>
          <p className="text-2xl font-semibold">{stats.totalMessages}</p>
        </div>

        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="font-medium">Avg. Response Time</h3>
          </div>
          <p className="text-2xl font-semibold">
            {Math.round(stats.averageResponseTime)}ms
          </p>
        </div>

        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-primary" />
            <h3 className="font-medium">Documents Processed</h3>
          </div>
          <p className="text-2xl font-semibold">{stats.documentsProcessed}</p>
        </div>

        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="font-medium">Token Usage</h3>
          </div>
          <p className="text-2xl font-semibold">{stats.tokenUsage.total}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border border-border bg-card">
          <h3 className="font-medium mb-4">Model Usage</h3>
          <div className="flex items-center gap-4">
            <PieChart className="w-4 h-4 text-primary" />
            <div className="flex-1 space-y-2">
              {Object.entries(stats.modelUsage).map(([model, count]) => (
                <div key={model} className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-primary/20">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${(count / stats.totalMessages) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {model}: {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-border bg-card">
          <h3 className="font-medium mb-4">Active Hours</h3>
          <div className="flex items-center gap-4">
            <BarChart className="w-4 h-4 text-primary" />
            <div className="flex-1 h-40 flex items-end gap-1">
              {Array.from({ length: 24 }).map((_, hour) => {
                const count = stats.activeHours[hour] || 0;
                const maxCount = Math.max(...Object.values(stats.activeHours));
                const height = maxCount > 0 ? (count / maxCount) * 100 : 0;

                return (
                  <div
                    key={hour}
                    className="flex-1 bg-primary/20 rounded-t"
                    style={{ height: `${height}%` }}
                  >
                    <div
                      className="w-full bg-primary rounded-t"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 