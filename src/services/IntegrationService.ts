// 🔥 Integration Service - OAuth Authentication & API Orchestration
// Handles connections to Google, Notion, Slack, Salesforce, Microsoft 365, and more

import { supabase } from '../../lib/supabase';

// Enhanced types for enterprise integration management
export interface OAuthToken {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  token_type: string;
  scope?: string;
}

export interface IntegrationConfig {
  id: string;
  platform: string;
  user_id: string;
  oauth_tokens: OAuthToken;
  webhook_url?: string;
  settings: Record<string, any>;
  status: 'active' | 'inactive' | 'error';
  created_at: string;
  updated_at: string;
  last_sync: string;
  sync_frequency: 'real-time' | 'hourly' | 'daily' | 'manual';
  usage_count: number;
  error_count: number;
}

export interface WebhookPayload {
  platform: string;
  event_type: string;
  data: Record<string, any>;
  timestamp: string;
  signature?: string;
}

export interface WorkflowAutomation {
  id: string;
  name: string;
  trigger_platform: string;
  trigger_event: string;
  action_platform: string;
  action_type: string;
  conditions: Record<string, any>;
  mapping: Record<string, any>;
  is_active: boolean;
}

// Platform-specific OAuth configurations
const OAUTH_CONFIGS = {
  google: {
    clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.modify',
    redirectUri: `${window.location.origin}/auth/google/callback`
  },
  notion: {
    clientId: process.env.REACT_APP_NOTION_CLIENT_ID,
    scope: '',
    redirectUri: `${window.location.origin}/auth/notion/callback`
  },
  microsoft: {
    clientId: process.env.REACT_APP_MICROSOFT_CLIENT_ID,
    scope: 'https://graph.microsoft.com/Files.ReadWrite https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/Mail.ReadWrite',
    redirectUri: `${window.location.origin}/auth/microsoft/callback`
  },
  salesforce: {
    clientId: process.env.REACT_APP_SALESFORCE_CLIENT_ID,
    scope: 'api refresh_token',
    redirectUri: `${window.location.origin}/auth/salesforce/callback`
  },
  slack: {
    clientId: process.env.REACT_APP_SLACK_CLIENT_ID,
    scope: 'chat:write,channels:read,files:write,commands',
    redirectUri: `${window.location.origin}/auth/slack/callback`
  },
  hubspot: {
    clientId: process.env.REACT_APP_HUBSPOT_CLIENT_ID,
    scope: 'contacts crm.objects.contacts.read crm.objects.contacts.write',
    redirectUri: `${window.location.origin}/auth/hubspot/callback`
  }
};

class IntegrationService {
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  // OAuth Authentication Flow Initiation
  async initiateOAuth(platform: string): Promise<string> {
    const config = OAUTH_CONFIGS[platform as keyof typeof OAUTH_CONFIGS];
    if (!config) {
      throw new Error(`OAuth configuration not found for platform: ${platform}`);
    }

    const state = this.generateStateToken();
    await this.storeOAuthState(state, platform);

    const params = new URLSearchParams({
      client_id: config.clientId!,
      redirect_uri: config.redirectUri,
      scope: config.scope,
      response_type: 'code',
      state,
      access_type: 'offline', // For refresh tokens
      prompt: 'consent'
    });

    // Platform-specific authorization URLs
    const authUrls = {
      google: 'https://accounts.google.com/o/oauth2/v2/auth',
      notion: 'https://api.notion.com/v1/oauth/authorize',
      microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      salesforce: 'https://login.salesforce.com/services/oauth2/authorize',
      slack: 'https://slack.com/oauth/v2/authorize',
      hubspot: 'https://app.hubspot.com/oauth/authorize'
    };

    const authUrl = `${authUrls[platform as keyof typeof authUrls]}?${params.toString()}`;
    return authUrl;
  }

  // Complete OAuth Flow - Exchange Code for Tokens
  async completeOAuth(platform: string, code: string, state: string): Promise<IntegrationConfig> {
    // Verify state token
    const isValidState = await this.verifyOAuthState(state, platform);
    if (!isValidState) {
      throw new Error('Invalid OAuth state token');
    }

    const config = OAUTH_CONFIGS[platform as keyof typeof OAUTH_CONFIGS];
    const tokenUrls = {
      google: 'https://oauth2.googleapis.com/token',
      notion: 'https://api.notion.com/v1/oauth/token',
      microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      salesforce: 'https://login.salesforce.com/services/oauth2/token',
      slack: 'https://slack.com/api/oauth.v2.access',
      hubspot: 'https://api.hubapi.com/oauth/v1/token'
    };

    const tokenResponse = await fetch(tokenUrls[platform as keyof typeof tokenUrls], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId!,
        client_secret: process.env[`REACT_APP_${platform.toUpperCase()}_CLIENT_SECRET`]!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to exchange OAuth code for tokens: ${tokenResponse.statusText}`);
    }

    const tokens = await tokenResponse.json();
    
    // Store integration configuration
    const integrationConfig: Partial<IntegrationConfig> = {
      platform,
      oauth_tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: Date.now() + (tokens.expires_in * 1000),
        token_type: tokens.token_type || 'Bearer',
        scope: tokens.scope
      },
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_sync: new Date().toISOString(),
      sync_frequency: 'real-time',
      usage_count: 0,
      error_count: 0,
      settings: {}
    };

    // Save to database
    const { data, error } = await supabase
      .from('integration_configs')
      .insert([integrationConfig])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save integration config: ${error.message}`);
    }

    return data as IntegrationConfig;
  }

  // Token Management - Refresh expired tokens
  async refreshToken(configId: string): Promise<IntegrationConfig> {
    const { data: config, error } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('id', configId)
      .single();

    if (error || !config) {
      throw new Error('Integration configuration not found');
    }

    const { platform, oauth_tokens } = config;
    
    if (!oauth_tokens.refresh_token) {
      throw new Error('No refresh token available');
    }

    const refreshUrls = {
      google: 'https://oauth2.googleapis.com/token',
      microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      salesforce: 'https://login.salesforce.com/services/oauth2/token'
    };

    const refreshUrl = refreshUrls[platform as keyof typeof refreshUrls];
    if (!refreshUrl) {
      throw new Error(`Token refresh not supported for platform: ${platform}`);
    }

    const oauthConfig = OAUTH_CONFIGS[platform as keyof typeof OAUTH_CONFIGS];
    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: oauthConfig.clientId!,
        client_secret: process.env[`REACT_APP_${platform.toUpperCase()}_CLIENT_SECRET`]!,
        refresh_token: oauth_tokens.refresh_token,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    const newTokens = await response.json();
    const updatedTokens = {
      ...oauth_tokens,
      access_token: newTokens.access_token,
      expires_at: Date.now() + (newTokens.expires_in * 1000),
      refresh_token: newTokens.refresh_token || oauth_tokens.refresh_token
    };

    // Update database
    const { data: updatedConfig, error: updateError } = await supabase
      .from('integration_configs')
      .update({ 
        oauth_tokens: updatedTokens,
        updated_at: new Date().toISOString()
      })
      .eq('id', configId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update tokens: ${updateError.message}`);
    }

    return updatedConfig as IntegrationConfig;
  }

  // Google Workspace Integration Methods
  async saveToGoogleDrive(configId: string, content: string, filename: string, folderId?: string): Promise<any> {
    const config = await this.getValidConfig(configId);
    
    const metadata = {
      name: filename,
      parents: folderId ? [folderId] : undefined
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.oauth_tokens.access_token}`
      },
      body: form
    });

    if (!response.ok) {
      throw new Error(`Failed to save to Google Drive: ${response.statusText}`);
    }

    await this.updateUsageCount(configId);
    return response.json();
  }

  async scheduleGoogleCalendarEvent(configId: string, eventData: any): Promise<any> {
    const config = await this.getValidConfig(configId);
    
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.oauth_tokens.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create calendar event: ${response.statusText}`);
    }

    await this.updateUsageCount(configId);
    return response.json();
  }

  async sendGmailEmail(configId: string, emailData: any): Promise<any> {
    const config = await this.getValidConfig(configId);
    
    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.oauth_tokens.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`);
    }

    await this.updateUsageCount(configId);
    return response.json();
  }

  // Notion Integration Methods
  async createNotionPage(configId: string, pageData: any): Promise<any> {
    const config = await this.getValidConfig(configId);
    
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.oauth_tokens.access_token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify(pageData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create Notion page: ${response.statusText}`);
    }

    await this.updateUsageCount(configId);
    return response.json();
  }

  async updateNotionDatabase(configId: string, databaseId: string, properties: any): Promise<any> {
    const config = await this.getValidConfig(configId);
    
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${config.oauth_tokens.access_token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({ properties })
    });

    if (!response.ok) {
      throw new Error(`Failed to update Notion database: ${response.statusText}`);
    }

    await this.updateUsageCount(configId);
    return response.json();
  }

  // Slack Integration Methods
  async sendSlackMessage(configId: string, channel: string, message: string, attachments?: any[]): Promise<any> {
    const config = await this.getValidConfig(configId);
    
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.oauth_tokens.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel,
        text: message,
        attachments
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to send Slack message: ${response.statusText}`);
    }

    await this.updateUsageCount(configId);
    return response.json();
  }

  async uploadSlackFile(configId: string, file: File, channels: string[], title?: string): Promise<any> {
    const config = await this.getValidConfig(configId);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('channels', channels.join(','));
    if (title) formData.append('title', title);

    const response = await fetch('https://slack.com/api/files.upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.oauth_tokens.access_token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file to Slack: ${response.statusText}`);
    }

    await this.updateUsageCount(configId);
    return response.json();
  }

  // Salesforce Integration Methods
  async createSalesforceRecord(configId: string, sobjectType: string, recordData: any): Promise<any> {
    const config = await this.getValidConfig(configId);
    
    const response = await fetch(`${config.settings.instance_url}/services/data/v57.0/sobjects/${sobjectType}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.oauth_tokens.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(recordData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create Salesforce record: ${response.statusText}`);
    }

    await this.updateUsageCount(configId);
    return response.json();
  }

  async updateSalesforceRecord(configId: string, sobjectType: string, recordId: string, updateData: any): Promise<any> {
    const config = await this.getValidConfig(configId);
    
    const response = await fetch(`${config.settings.instance_url}/services/data/v57.0/sobjects/${sobjectType}/${recordId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${config.oauth_tokens.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`Failed to update Salesforce record: ${response.statusText}`);
    }

    await this.updateUsageCount(configId);
    return response.json();
  }

  // Webhook Processing System
  async processWebhook(payload: WebhookPayload): Promise<void> {
    try {
      // Verify webhook signature if required
      if (payload.signature) {
        const isValid = await this.verifyWebhookSignature(payload);
        if (!isValid) {
          throw new Error('Invalid webhook signature');
        }
      }

      // Log webhook event
      await supabase.from('webhook_logs').insert([{
        platform: payload.platform,
        event_type: payload.event_type,
        timestamp: payload.timestamp,
        data: payload.data,
        status: 'processing'
      }]);

      // Find and execute applicable workflows
      const { data: workflows } = await supabase
        .from('workflow_automations')
        .select('*')
        .eq('trigger_platform', payload.platform)
        .eq('trigger_event', payload.event_type)
        .eq('is_active', true);

      if (workflows && workflows.length > 0) {
        await Promise.all(workflows.map(workflow => this.executeWorkflow(workflow, payload)));
      }

    } catch (error) {
      console.error('Webhook processing error:', error);
      
      await supabase.from('webhook_logs').insert([{
        platform: payload.platform,
        event_type: payload.event_type,
        timestamp: payload.timestamp,
        data: payload.data,
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      }]);
    }
  }

  // Workflow Automation Execution
  async executeWorkflow(workflow: WorkflowAutomation, triggerData: WebhookPayload): Promise<void> {
    try {
      // Check workflow conditions
      const conditionsMet = this.evaluateWorkflowConditions(workflow.conditions, triggerData.data);
      if (!conditionsMet) {
        return;
      }

      // Map trigger data to action parameters
      const actionData = this.mapWorkflowData(workflow.mapping, triggerData.data);

      // Execute action based on target platform
      switch (workflow.action_platform) {
        case 'google':
          await this.executeGoogleWorkflowAction(workflow, actionData);
          break;
        case 'notion':
          await this.executeNotionWorkflowAction(workflow, actionData);
          break;
        case 'slack':
          await this.executeSlackWorkflowAction(workflow, actionData);
          break;
        case 'salesforce':
          await this.executeSalesforceWorkflowAction(workflow, actionData);
          break;
        default:
          throw new Error(`Unsupported action platform: ${workflow.action_platform}`);
      }

      // Log successful execution
      await supabase.from('workflow_executions').insert([{
        workflow_id: workflow.id,
        trigger_data: triggerData.data,
        action_data: actionData,
        status: 'success',
        executed_at: new Date().toISOString()
      }]);

    } catch (error) {
      console.error('Workflow execution error:', error);
      
      await supabase.from('workflow_executions').insert([{
        workflow_id: workflow.id,
        trigger_data: triggerData.data,
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        executed_at: new Date().toISOString()
      }]);
    }
  }

  // Cross-Platform Data Synchronization
  async syncPlatforms(sourceConfigId: string, targetConfigId: string, syncRules: any): Promise<void> {
    const sourceConfig = await this.getValidConfig(sourceConfigId);
    const targetConfig = await this.getValidConfig(targetConfigId);

    // Implementation depends on specific platforms and sync requirements
    // This would include data mapping, transformation, and bidirectional sync logic
    
    console.log(`Syncing data from ${sourceConfig.platform} to ${targetConfig.platform}`);
    
    // Update last sync timestamps
    await Promise.all([
      this.updateLastSync(sourceConfigId),
      this.updateLastSync(targetConfigId)
    ]);
  }

  // Utility Methods
  private generateStateToken(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async storeOAuthState(state: string, platform: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await supabase.from('oauth_states').insert([{
      state_token: state,
      platform,
      expires_at: expiresAt.toISOString()
    }]);
  }

  private async verifyOAuthState(state: string, platform: string): Promise<boolean> {
    const { data } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state_token', state)
      .eq('platform', platform)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (data) {
      // Clean up used state token
      await supabase.from('oauth_states').delete().eq('state_token', state);
      return true;
    }

    return false;
  }

  private async getValidConfig(configId: string): Promise<IntegrationConfig> {
    const { data: config, error } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('id', configId)
      .single();

    if (error || !config) {
      throw new Error('Integration configuration not found');
    }

    // Check if token needs refresh
    if (config.oauth_tokens.expires_at < Date.now()) {
      return await this.refreshToken(configId);
    }

    return config as IntegrationConfig;
  }

  private async updateUsageCount(configId: string): Promise<void> {
    await supabase
      .from('integration_configs')
      .update({ 
        usage_count: supabase.raw('usage_count + 1'),
        last_sync: new Date().toISOString()
      })
      .eq('id', configId);
  }

  private async updateLastSync(configId: string): Promise<void> {
    await supabase
      .from('integration_configs')
      .update({ last_sync: new Date().toISOString() })
      .eq('id', configId);
  }

  private async verifyWebhookSignature(payload: WebhookPayload): Promise<boolean> {
    // Platform-specific signature verification logic
    // This would implement HMAC-SHA256 verification for each platform
    return true; // Simplified for now
  }

  private evaluateWorkflowConditions(conditions: Record<string, any>, data: Record<string, any>): boolean {
    // Implement condition evaluation logic
    // Support for field comparisons, logical operators, etc.
    return true; // Simplified for now
  }

  private mapWorkflowData(mapping: Record<string, any>, sourceData: Record<string, any>): Record<string, any> {
    // Implement data mapping and transformation logic
    // Support for field mapping, data transformation functions, etc.
    return sourceData; // Simplified for now
  }

  private async executeGoogleWorkflowAction(workflow: WorkflowAutomation, actionData: any): Promise<void> {
    // Implementation for Google-specific workflow actions
    console.log('Executing Google workflow action:', workflow.action_type);
  }

  private async executeNotionWorkflowAction(workflow: WorkflowAutomation, actionData: any): Promise<void> {
    // Implementation for Notion-specific workflow actions
    console.log('Executing Notion workflow action:', workflow.action_type);
  }

  private async executeSlackWorkflowAction(workflow: WorkflowAutomation, actionData: any): Promise<void> {
    // Implementation for Slack-specific workflow actions
    console.log('Executing Slack workflow action:', workflow.action_type);
  }

  private async executeSalesforceWorkflowAction(workflow: WorkflowAutomation, actionData: any): Promise<void> {
    // Implementation for Salesforce-specific workflow actions
    console.log('Executing Salesforce workflow action:', workflow.action_type);
  }

  // Public methods for external access
  async getIntegrations(userId: string): Promise<IntegrationConfig[]> {
    const { data, error } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch integrations: ${error.message}`);
    }

    return data as IntegrationConfig[];
  }

  async deleteIntegration(configId: string): Promise<void> {
    const { error } = await supabase
      .from('integration_configs')
      .delete()
      .eq('id', configId);

    if (error) {
      throw new Error(`Failed to delete integration: ${error.message}`);
    }
  }

  async testConnection(configId: string): Promise<boolean> {
    try {
      const config = await this.getValidConfig(configId);
      
      // Platform-specific connection tests
      const testUrls = {
        google: 'https://www.googleapis.com/oauth2/v1/userinfo',
        notion: 'https://api.notion.com/v1/users/me',
        microsoft: 'https://graph.microsoft.com/v1.0/me',
        salesforce: '/services/data/v57.0/limits',
        slack: 'https://slack.com/api/auth.test',
        hubspot: 'https://api.hubapi.com/oauth/v1/access-tokens'
      };

      const testUrl = testUrls[config.platform as keyof typeof testUrls];
      if (!testUrl) {
        return false;
      }

      const response = await fetch(testUrl, {
        headers: {
          'Authorization': `Bearer ${config.oauth_tokens.access_token}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const integrationService = new IntegrationService();
export default IntegrationService;