class AgentRateLimiter {
  private requestCounts: Map<string, number> = new Map();
  private readonly maxRequestsPerMinute = 60;

  canProcess(agentId: string): boolean {
    const count = this.requestCounts.get(agentId) || 0;
    return count < this.maxRequestsPerMinute;
  }

  recordRequest(agentId: string) {
    const count = this.requestCounts.get(agentId) || 0;
    this.requestCounts.set(agentId, count + 1);

    // Reset count after 1 minute
    setTimeout(() => {
      const currentCount = this.requestCounts.get(agentId) || 0;
      this.requestCounts.set(agentId, currentCount - 1);
    }, 60000);
  }
}

export const agentRateLimiter = new AgentRateLimiter(); 