export enum AgentErrorType {
  INITIALIZATION = 'INITIALIZATION',
  CAPABILITY = 'CAPABILITY',
  RATE_LIMIT = 'RATE_LIMIT',
  API = 'API',
  VALIDATION = 'VALIDATION',
  TIMEOUT = 'TIMEOUT',
  MEMORY = 'MEMORY'
}

export class AgentError extends Error {
  constructor(
    public type: AgentErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

class AgentErrorHandler {
  private errorListeners: ((error: AgentError) => void)[] = [];

  handleError(error: AgentError) {
    // Log error
    console.error(`Agent Error [${error.type}]:`, error.message, error.details);

    // Notify listeners
    this.errorListeners.forEach(listener => listener(error));

    // Handle specific error types
    switch (error.type) {
      case AgentErrorType.RATE_LIMIT:
        // Wait and retry
        return new Promise(resolve => setTimeout(resolve, 1000));
      
      case AgentErrorType.API:
        // Retry with exponential backoff
        return this.handleAPIError(error);
      
      case AgentErrorType.MEMORY:
        // Cleanup memory
        return this.handleMemoryError(error);
      
      default:
        throw error;
    }
  }

  private async handleAPIError(error: AgentError) {
    // Implement exponential backoff
  }

  private async handleMemoryError(error: AgentError) {
    // Implement memory cleanup
  }

  addErrorListener(listener: (error: AgentError) => void) {
    this.errorListeners.push(listener);
  }

  removeErrorListener(listener: (error: AgentError) => void) {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }
}

export const agentErrorHandler = new AgentErrorHandler(); 