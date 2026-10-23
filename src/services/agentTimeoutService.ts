import { AgentError, AgentErrorType } from './agentErrorHandler';

interface TimeoutConfig {
  timeout: number;
  retries: number;
  backoffFactor: number;
}

class AgentTimeoutService {
  private defaultConfig: TimeoutConfig = {
    timeout: 30000, // 30 seconds
    retries: 3,
    backoffFactor: 1.5
  };

  async withTimeout<T>(
    operation: () => Promise<T>,
    config: Partial<TimeoutConfig> = {}
  ): Promise<T> {
    const { timeout, retries, backoffFactor } = { ...this.defaultConfig, ...config };
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await Promise.race([
          operation(),
          new Promise((_, reject) => {
            setTimeout(() => {
              reject(new AgentError(
                AgentErrorType.TIMEOUT,
                `Operation timed out after ${timeout}ms`
              ));
            }, timeout * Math.pow(backoffFactor, attempt));
          })
        ]);

        return result;
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          await new Promise(resolve => 
            setTimeout(resolve, timeout * Math.pow(backoffFactor, attempt))
          );
        }
      }
    }

    throw lastError;
  }
}

export const agentTimeout = new AgentTimeoutService(); 