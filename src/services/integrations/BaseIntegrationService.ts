/**
 * 🔗 Base Integration Service
 * 
 * Abstract base class for all GenieFlow AI integrations.
 * Provides common interface and functionality for integration services.
 */

export interface IntegrationCapabilities {
  canRead: boolean;
  canWrite: boolean;
  canSearch: boolean;
  canWebhook: boolean;
  canRealtime: boolean;
  canBulkOperations: boolean;
}

export interface IntegrationMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  category: 'data' | 'productivity' | 'communication' | 'storage' | 'analytics' | 'other';
  capabilities: IntegrationCapabilities;
  requiredCredentials: string[];
  optionalCredentials?: string[];
}

/**
 * Abstract base class for all integration services
 */
export abstract class BaseIntegrationService {
  protected id: string;
  protected name: string;
  protected isInitialized: boolean = false;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  // Abstract methods that must be implemented by each integration
  abstract initialize(): Promise<boolean>;
  abstract testConnection(): Promise<boolean>;
  abstract getStatus(): Promise<any>;

  // Common interface methods
  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  // Optional methods with default implementations
  async disconnect(): Promise<void> {
    console.log(`🔌 Disconnecting ${this.name}...`);
    this.isInitialized = false;
  }

  async getMetadata(): Promise<IntegrationMetadata> {
    return {
      id: this.id,
      name: this.name,
      description: `${this.name} integration service`,
      version: '1.0.0',
      category: 'other',
      capabilities: {
        canRead: true,
        canWrite: true,
        canSearch: true,
        canWebhook: false,
        canRealtime: false,
        canBulkOperations: true
      },
      requiredCredentials: ['apiKey']
    };
  }

  // Helper methods for common operations
  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected handleError(error: any, context: string): Error {
    const message = `${this.name} ${context}: ${error.message || error}`;
    console.error(`❌ ${message}`);
    return new Error(message);
  }

  protected logOperation(operation: string, data?: any): void {
    console.log(`🔄 ${this.name} - ${operation}`, data ? `(${JSON.stringify(data).slice(0, 100)}...)` : '');
  }

  protected logSuccess(operation: string, result?: any): void {
    console.log(`✅ ${this.name} - ${operation} completed`, result ? `(${JSON.stringify(result).slice(0, 100)}...)` : '');
  }
}

/**
 * Integration Registry for managing all active integrations
 */
export class IntegrationRegistry {
  private integrations = new Map<string, BaseIntegrationService>();
  private listeners = new Map<string, Function[]>();

  /**
   * Register a new integration service
   */
  register(integration: BaseIntegrationService): void {
    this.integrations.set(integration.getId(), integration);
    this.emit('integration:registered', integration);
    console.log(`📝 Registered integration: ${integration.getName()}`);
  }

  /**
   * Get integration by ID
   */
  get(id: string): BaseIntegrationService | undefined {
    return this.integrations.get(id);
  }

  /**
   * Get all registered integrations
   */
  getAll(): BaseIntegrationService[] {
    return Array.from(this.integrations.values());
  }

  /**
   * Get all active (initialized) integrations
   */
  getActive(): BaseIntegrationService[] {
    return this.getAll().filter(integration => integration.isReady());
  }

  /**
   * Initialize all registered integrations
   */
  async initializeAll(): Promise<{
    successful: string[];
    failed: string[];
  }> {
    const successful: string[] = [];
    const failed: string[] = [];

    console.log(`🚀 Initializing ${this.integrations.size} integrations...`);

    for (const [id, integration] of this.integrations) {
      try {
        const initialized = await integration.initialize();
        if (initialized) {
          successful.push(id);
          this.emit('integration:initialized', integration);
        } else {
          failed.push(id);
          this.emit('integration:failed', integration);
        }
      } catch (error) {
        failed.push(id);
        this.emit('integration:error', { integration, error });
        console.error(`❌ Failed to initialize ${integration.getName()}:`, error);
      }
    }

    console.log(`✅ Integration initialization complete: ${successful.length} successful, ${failed.length} failed`);
    return { successful, failed };
  }

  /**
   * Test all active integrations
   */
  async testAllConnections(): Promise<{
    working: string[];
    broken: string[];
  }> {
    const working: string[] = [];
    const broken: string[] = [];

    for (const integration of this.getActive()) {
      try {
        const isWorking = await integration.testConnection();
        if (isWorking) {
          working.push(integration.getId());
        } else {
          broken.push(integration.getId());
        }
      } catch (error) {
        broken.push(integration.getId());
        console.error(`❌ Connection test failed for ${integration.getName()}:`, error);
      }
    }

    return { working, broken };
  }

  /**
   * Get status of all integrations
   */
  async getAllStatuses(): Promise<Record<string, any>> {
    const statuses: Record<string, any> = {};

    for (const integration of this.getAll()) {
      try {
        statuses[integration.getId()] = await integration.getStatus();
      } catch (error) {
        statuses[integration.getId()] = { error: error.message };
      }
    }

    return statuses;
  }

  // Event system
  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`❌ Event listener error for ${event}:`, error);
        }
      });
    }
  }
}

// Singleton registry instance
export const integrationRegistry = new IntegrationRegistry();