import { googleTokenManager } from './GoogleTokenManager';
import { supabase } from '../lib/supabase';

export interface ConnectorInfo {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected';
  iconName: 'Mail' | 'Calendar' | 'Cloud' | 'MessageSquare' | 'Code';
}

type Listener = (connectors: ConnectorInfo[]) => void;

class ConnectorService {
  private static instance: ConnectorService;
  private listeners: Set<Listener> = new Set();
  private connectors: ConnectorInfo[] = [];

  private constructor() {
    this.updateStatus();
    // Periodically poll connection statuses
    setInterval(() => this.updateStatus(), 10000);
  }

  public static getInstance(): ConnectorService {
    if (!ConnectorService.instance) {
      ConnectorService.instance = new ConnectorService();
    }
    return ConnectorService.instance;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener([...this.connectors]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const list = [...this.connectors];
    this.listeners.forEach(l => l(list));
  }

  public async updateStatus(): Promise<ConnectorInfo[]> {
    const googleTokenInfo = googleTokenManager.getTokenInfo();
    const hasGoogleAuth = googleTokenInfo.hasToken && googleTokenInfo.isValid;

    // Check custom Slack connection status in localStorage
    const slackConnected = localStorage.getItem('genieflow_connector_slack_connected') === 'true';
    
    // Check custom GitHub connection status in localStorage
    const githubConnected = localStorage.getItem('genieflow_connector_github_connected') === 'true';

    // Google Drive shares Google OAuth flow
    const driveConnected = hasGoogleAuth && localStorage.getItem('genieflow_connector_drive_enabled') !== 'false';

    this.connectors = [
      {
        id: 'gmail',
        name: 'Gmail',
        description: 'Read, reply, and index emails.',
        status: hasGoogleAuth ? 'connected' : 'disconnected',
        iconName: 'Mail',
      },
      {
        id: 'calendar',
        name: 'Google Calendar',
        description: 'Schedule events & track availability.',
        status: hasGoogleAuth ? 'connected' : 'disconnected',
        iconName: 'Calendar',
      },
      {
        id: 'drive',
        name: 'Google Drive',
        description: 'Index documents and search files.',
        status: driveConnected ? 'connected' : 'disconnected',
        iconName: 'Cloud',
      },
      {
        id: 'slack',
        name: 'Slack Workspace',
        description: 'Receive workspace reports.',
        status: slackConnected ? 'connected' : 'disconnected',
        iconName: 'MessageSquare',
      },
      {
        id: 'github',
        name: 'GitHub Repo',
        description: 'Audit and track codebase updates.',
        status: githubConnected ? 'connected' : 'disconnected',
        iconName: 'Code',
      },
    ];

    this.notify();
    return this.connectors;
  }

  public async connect(id: string): Promise<boolean> {
    try {
      if (id === 'gmail' || id === 'calendar') {
        await googleTokenManager.initiateReAuthentication();
        return true;
      }

      if (id === 'drive') {
        localStorage.setItem('genieflow_connector_drive_enabled', 'true');
        if (!googleTokenManager.getTokenInfo().hasToken) {
          await googleTokenManager.initiateReAuthentication();
        } else {
          await this.updateStatus();
        }
        return true;
      }

      if (id === 'slack') {
        localStorage.setItem('genieflow_connector_slack_connected', 'true');
        await this.updateStatus();
        return true;
      }

      if (id === 'github') {
        localStorage.setItem('genieflow_connector_github_connected', 'true');
        await this.updateStatus();
        return true;
      }

      return false;
    } catch (e) {
      console.error(`Failed to connect ${id}`, e);
      return false;
    }
  }

  public async disconnect(id: string): Promise<boolean> {
    try {
      if (id === 'gmail' || id === 'calendar') {
        googleTokenManager.clearToken();
        // also clear drive connection if Google Token is wiped
        localStorage.setItem('genieflow_connector_drive_enabled', 'false');
        await this.updateStatus();
        return true;
      }

      if (id === 'drive') {
        localStorage.setItem('genieflow_connector_drive_enabled', 'false');
        await this.updateStatus();
        return true;
      }

      if (id === 'slack') {
        localStorage.removeItem('genieflow_connector_slack_connected');
        await this.updateStatus();
        return true;
      }

      if (id === 'github') {
        localStorage.removeItem('genieflow_connector_github_connected');
        await this.updateStatus();
        return true;
      }

      return false;
    } catch (e) {
      console.error(`Failed to disconnect ${id}`, e);
      return false;
    }
  }
}

export const connectorService = ConnectorService.getInstance();
