import { Agent, AgentAction } from '../types/agents';
import { AgentEvent } from './agentEventService';

interface LogEntry {
  timestamp: Date;
  type: string;
  agentId: string;
  data: any;
  level: 'info' | 'warning' | 'error';
}

class AgentLoggingService {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  log(level: LogEntry['level'], type: string, agentId: string, data: any) {
    const entry: LogEntry = {
      timestamp: new Date(),
      type,
      agentId,
      data,
      level
    };

    this.logs.unshift(entry);
    
    // Trim logs if they exceed max size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log(`[Agent ${agentId}] ${type}:`, data);
    }
  }

  getAgentLogs(agentId: string): LogEntry[] {
    return this.logs.filter(log => log.agentId === agentId);
  }

  handleAgentEvent(event: AgentEvent) {
    switch (event.type) {
      case 'action:started':
        this.log('info', 'Action Started', event.action.agentId, event.action);
        break;
      case 'action:completed':
        this.log('info', 'Action Completed', event.action.agentId, {
          action: event.action,
          result: event.result
        });
        break;
      case 'action:failed':
        this.log('error', 'Action Failed', event.action.agentId, {
          action: event.action,
          error: event.error
        });
        break;
    }
  }

  clearLogs(agentId?: string) {
    if (agentId) {
      this.logs = this.logs.filter(log => log.agentId !== agentId);
    } else {
      this.logs = [];
    }
  }
}

export const agentLogger = new AgentLoggingService(); 