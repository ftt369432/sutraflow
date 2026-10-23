/**
 * 🔗 GenieFlow AI Integration Hub
 * 
 * Central export for all integration services including Snowflake and Notion.
 * Extends existing N8N infrastructure with powerful new data and productivity integrations.
 */

// Core Integration Infrastructure
export { BaseIntegrationService, integrationRegistry } from './BaseIntegrationService';
export { IntegrationHubManager, createIntegrationHub, integrationHub } from './IntegrationHubManager';

// Snowflake Integration
export { SnowflakeService, createSnowflakeService } from './SnowflakeService';
export type {
  SnowflakeConfig,
  SnowflakeQuery,
  SnowflakeQueryResult,
  VoiceToSQLRequest,
  VoiceToSQLResponse
} from './SnowflakeService';

// Notion Integration
export { NotionService, createNotionService } from './NotionService';
export type {
  NotionConfig,
  NotionPage,
  NotionDatabase,
  NotionProperty,
  NotionBlock,
  NotionWorkflowRequest
} from './NotionService';

// Integration Hub Types
export type {
  IntegrationHubConfig,
  IntegrationStatus,
  HubStatus
} from './IntegrationHubManager';

export type {
  IntegrationCapabilities,
  IntegrationMetadata
} from './BaseIntegrationService';

/**
 * Quick setup function for common integration scenarios
 */
export function setupIntegrationHub(config: {
  snowflake?: {
    account: string;
    username: string;
    password: string;
    warehouse: string;
    database: string;
    schema: string;
  };
  notion?: {
    apiKey: string;
  };
}) {
  return createIntegrationHub(config);
}

/**
 * Demo configuration for testing
 */
export function createDemoIntegrationHub() {
  return createIntegrationHub({
    snowflake: {
      account: 'demo_account',
      username: 'demo_user',
      password: 'demo_password',
      warehouse: 'COMPUTE_WH',
      database: 'DEMO_DB',
      schema: 'PUBLIC'
    },
    notion: {
      apiKey: 'demo_notion_key'
    },
    enableAutoInit: true,
    enableHealthChecks: true,
    healthCheckInterval: 10 // 10 minutes for demo
  });
}