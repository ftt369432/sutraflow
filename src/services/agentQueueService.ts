import { Agent, AgentAction } from '../types/agents';
import { agentService } from './agentService';

interface QueuedAction {
  action: AgentAction;
  agent: Agent;
  priority: number;
  retryCount: number;
}

class AgentQueueService {
  private queue: QueuedAction[] = [];
  private isProcessing = false;
  private maxRetries = 3;

  async addToQueue(agent: Agent, action: AgentAction, priority = 1) {
    this.queue.push({
      action,
      agent,
      priority,
      retryCount: 0
    });

    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    
    // Sort by priority
    this.queue.sort((a, b) => b.priority - a.priority);
    
    const item = this.queue[0];
    
    try {
      await agentService.performAction(item.agent, item.action);
      this.queue.shift(); // Remove completed action
    } catch (error) {
      if (item.retryCount < this.maxRetries) {
        item.retryCount++;
        item.priority--; // Lower priority after failure
      } else {
        this.queue.shift(); // Remove failed action after max retries
      }
    }

    // Process next item
    setTimeout(() => this.processQueue(), 100);
  }
}

export const agentQueue = new AgentQueueService(); 