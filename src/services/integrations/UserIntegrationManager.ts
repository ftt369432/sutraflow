/**
 * USER INTEGRATION MANAGEMENT SYSTEM
 * Handles per-user API keys, routing, and multi-tenant integration access
 */

export interface UserIntegrationCredentials {
  userId: string;
  integrationId: string;
  apiKey: string;
  additionalConfig?: Record<string, any>;
  createdAt: Date;
  lastUsed?: Date;
  isActive: boolean;
}

export interface IntegrationRoute {
  userId: string;
  integrationId: string;
  workspaceId?: string;
  databaseIds?: string[];
  customEndpoints?: Record<string, string>;
}

export class UserIntegrationManager {
  private userCredentials: Map<string, UserIntegrationCredentials[]> = new Map();
  private integrationRoutes: Map<string, IntegrationRoute[]> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  /**
   * USER CREDENTIAL MANAGEMENT
   */
  async addUserIntegration(
    userId: string,
    integrationId: string,
    apiKey: string,
    additionalConfig?: Record<string, any>
  ): Promise<boolean> {
    try {
      // Validate the API key first
      const isValid = await this.validateApiKey(integrationId, apiKey);
      if (!isValid) {
        throw new Error('Invalid API key provided');
      }

      const credentials: UserIntegrationCredentials = {
        userId,
        integrationId,
        apiKey: this.encryptApiKey(apiKey), // Encrypt for storage
        additionalConfig,
        createdAt: new Date(),
        isActive: true
      };

      const userCreds = this.userCredentials.get(userId) || [];
      
      // Remove existing integration for this service
      const filteredCreds = userCreds.filter(c => c.integrationId !== integrationId);
      filteredCreds.push(credentials);
      
      this.userCredentials.set(userId, filteredCreds);
      this.saveToStorage();
      
      return true;
    } catch (error) {
      console.error('Failed to add user integration:', error);
      return false;
    }
  }

  /**
   * GET USER'S API KEY FOR SPECIFIC INTEGRATION
   */
  getUserApiKey(userId: string, integrationId: string): string | null {
    const userCreds = this.userCredentials.get(userId) || [];
    const integration = userCreds.find(c => 
      c.integrationId === integrationId && c.isActive
    );
    
    return integration ? this.decryptApiKey(integration.apiKey) : null;
  }

  /**
   * DATA ROUTING SYSTEM
   */
  addIntegrationRoute(
    userId: string,
    integrationId: string,
    config: {
      workspaceId?: string;
      databaseIds?: string[];
      customEndpoints?: Record<string, string>;
    }
  ): void {
    const route: IntegrationRoute = {
      userId,
      integrationId,
      ...config
    };

    const userRoutes = this.integrationRoutes.get(userId) || [];
    const filteredRoutes = userRoutes.filter(r => r.integrationId !== integrationId);
    filteredRoutes.push(route);
    
    this.integrationRoutes.set(userId, filteredRoutes);
    this.saveToStorage();
  }

  /**
   * GET ROUTING CONFIG FOR USER'S INTEGRATION
   */
  getIntegrationRoute(userId: string, integrationId: string): IntegrationRoute | null {
    const userRoutes = this.integrationRoutes.get(userId) || [];
    return userRoutes.find(r => r.integrationId === integrationId) || null;
  }

  /**
   * CREATE USER-SPECIFIC INTEGRATION INSTANCE
   */
  async createUserIntegrationInstance(
    userId: string,
    integrationId: string
  ): Promise<any> {
    const apiKey = this.getUserApiKey(userId, integrationId);
    const route = this.getIntegrationRoute(userId, integrationId);

    if (!apiKey) {
      throw new Error(`No API key found for user ${userId} and integration ${integrationId}`);
    }

    // Create integration-specific instance
    switch (integrationId) {
      case 'notion':
        const { NotionService } = await import('./NotionService');
        return new NotionService(apiKey, route?.workspaceId);

      case 'snowflake':
        const { SnowflakeService } = await import('./SnowflakeService');
        return new SnowflakeService({
          account: route?.customEndpoints?.account || '',
          username: route?.customEndpoints?.username || '',
          password: apiKey,
          warehouse: route?.customEndpoints?.warehouse || 'COMPUTE_WH'
        });

      case 'slack':
        return { apiKey, webhookUrl: route?.customEndpoints?.webhook };

      case 'google-workspace':
        return { apiKey, workspaceId: route?.workspaceId };

      default:
        throw new Error(`Unknown integration: ${integrationId}`);
    }
  }

  /**
   * USER INTEGRATION STATUS
   */
  getUserIntegrations(userId: string): UserIntegrationCredentials[] {
    const userCreds = this.userCredentials.get(userId) || [];
    return userCreds.map(cred => ({
      ...cred,
      apiKey: '***hidden***' // Don't expose actual keys
    }));
  }

  /**
   * REMOVE USER INTEGRATION
   */
  removeUserIntegration(userId: string, integrationId: string): boolean {
    const userCreds = this.userCredentials.get(userId) || [];
    const filteredCreds = userCreds.filter(c => c.integrationId !== integrationId);
    
    this.userCredentials.set(userId, filteredCreds);
    this.saveToStorage();
    
    return true;
  }

  /**
   * API KEY VALIDATION
   */
  private async validateApiKey(integrationId: string, apiKey: string): Promise<boolean> {
    try {
      switch (integrationId) {
        case 'notion':
          // Test Notion API
          const response = await fetch('https://api.notion.com/v1/users/me', {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Notion-Version': '2022-06-28'
            }
          });
          return response.ok;

        case 'slack':
          // Test Slack API
          const slackResponse = await fetch('https://slack.com/api/auth.test', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
          });
          return slackResponse.ok;

        default:
          return true; // For other integrations, assume valid for now
      }
    } catch {
      return false;
    }
  }

  /**
   * ENCRYPTION/DECRYPTION (Basic implementation)
   */
  private encryptApiKey(apiKey: string): string {
    // In production, use proper encryption (crypto-js, etc.)
    return btoa(apiKey);
  }

  private decryptApiKey(encryptedKey: string): string {
    // In production, use proper decryption
    return atob(encryptedKey);
  }

  /**
   * PERSISTENCE
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('userIntegrations');
      if (stored) {
        const data = JSON.parse(stored);
        this.userCredentials = new Map(data.credentials || []);
        this.integrationRoutes = new Map(data.routes || []);
      }
    } catch (error) {
      console.error('Failed to load user integrations from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        credentials: Array.from(this.userCredentials.entries()),
        routes: Array.from(this.integrationRoutes.entries())
      };
      localStorage.setItem('userIntegrations', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save user integrations to storage:', error);
    }
  }
}

// Global instance
export const userIntegrationManager = new UserIntegrationManager();