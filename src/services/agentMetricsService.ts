import { Agent, AgentAction } from '../types/agents';

class AgentMetricsService {
  private metrics: Map<string, {
    successCount: number;
    failureCount: number;
    totalResponseTime: number;
    actionCount: number;
  }> = new Map();

  trackAction(agent: Agent, action: AgentAction, duration: number, success: boolean) {
    const agentMetrics = this.metrics.get(agent.id) || {
      successCount: 0,
      failureCount: 0,
      totalResponseTime: 0,
      actionCount: 0
    };

    agentMetrics.actionCount++;
    agentMetrics.totalResponseTime += duration;
    
    if (success) {
      agentMetrics.successCount++;
    } else {
      agentMetrics.failureCount++;
    }

    this.metrics.set(agent.id, agentMetrics);
  }

  getAgentMetrics(agentId: string) {
    const metrics = this.metrics.get(agentId);
    if (!metrics) return null;

    return {
      successRate: metrics.successCount / metrics.actionCount,
      averageResponseTime: metrics.totalResponseTime / metrics.actionCount,
      totalActions: metrics.actionCount,
      failureRate: metrics.failureCount / metrics.actionCount
    };
  }

  getSystemMetrics() {
    let totalSuccess = 0;
    let totalActions = 0;
    let totalResponseTime = 0;

    this.metrics.forEach(metrics => {
      totalSuccess += metrics.successCount;
      totalActions += metrics.actionCount;
      totalResponseTime += metrics.totalResponseTime;
    });

    return {
      systemSuccessRate: totalSuccess / totalActions,
      averageResponseTime: totalResponseTime / totalActions,
      totalActionsProcessed: totalActions
    };
  }
}

export const agentMetrics = new AgentMetricsService(); 