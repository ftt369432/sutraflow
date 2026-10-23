export interface DailyActivity {
  date: string;
  total: number;
  completed: number;
  failed: number;
}

export interface PerformanceMetric {
  type: string;
  successRate: number;
  total: number;
}

export interface AgentFeedback {
  id: string;
  agentId: string;
  feedback: string;
  timestamp: Date;
  rating: number;
}

export interface AgentStats {
  completed: number;
  total: number;
}

export interface AgentMetrics {
  dailyActivity: Array<{
    date: string;
    count: number;
  }>;
  performanceByType: Record<string, AgentStats>;
  recentFeedback: AgentFeedback[];
} 