import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { AlertCircle, CheckCircle, Key, Settings, Trash2, Eye, EyeOff } from 'lucide-react';
import { userIntegrationManager, UserIntegrationCredentials } from '@/services/integrations/UserIntegrationManager';

interface IntegrationSetupProps {
  userId: string;
  onIntegrationUpdate?: () => void;
}

const AVAILABLE_INTEGRATIONS = [
  {
    id: 'notion',
    name: 'Notion',
    description: 'Connect your Notion workspace for page creation and database sync',
    fields: [
      { key: 'apiKey', label: 'Integration Token', type: 'password', placeholder: 'secret_...' },
      { key: 'workspaceId', label: 'Workspace ID (Optional)', type: 'text', placeholder: 'Your workspace ID' }
    ],
    setupInstructions: [
      'Go to https://www.notion.so/my-integrations',
      'Click "Create new integration"',
      'Name it "GenieFlow AI" and select your workspace',
      'Copy the "Internal Integration Token"',
      'Share pages with your integration in Notion'
    ]
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send automated messages and notifications to Slack channels',
    fields: [
      { key: 'apiKey', label: 'Bot Token', type: 'password', placeholder: 'xoxb-...' },
      { key: 'webhook', label: 'Webhook URL (Optional)', type: 'text', placeholder: 'https://hooks.slack.com/...' }
    ],
    setupInstructions: [
      'Go to https://api.slack.com/apps',
      'Click "Create New App" → "From scratch"',
      'Name it "GenieFlow AI" and select your workspace',
      'Go to "OAuth & Permissions" → Add scopes: chat:write, channels:read',
      'Install app to workspace and copy "Bot User OAuth Token"'
    ]
  },
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    description: 'Automate Google Drive, Docs, Sheets, and Calendar',
    fields: [
      { key: 'apiKey', label: 'Service Account Key', type: 'password', placeholder: 'JSON key content' },
      { key: 'workspaceId', label: 'Domain', type: 'text', placeholder: 'yourcompany.com' }
    ],
    setupInstructions: [
      'Go to Google Cloud Console',
      'Enable APIs: Drive, Docs, Sheets, Calendar',
      'Create Service Account',
      'Download JSON key file',
      'Share folders/docs with service account email'
    ]
  },
  {
    id: 'snowflake',
    name: 'Snowflake',
    description: 'Connect to Snowflake data warehouse for AI-powered analytics',
    fields: [
      { key: 'account', label: 'Account', type: 'text', placeholder: 'abc12345.snowflakecomputing.com' },
      { key: 'username', label: 'Username', type: 'text', placeholder: 'your-username' },
      { key: 'password', label: 'Password', type: 'password', placeholder: 'your-password' },
      { key: 'warehouse', label: 'Warehouse', type: 'text', placeholder: 'COMPUTE_WH' }
    ],
    setupInstructions: [
      'Get your Snowflake account URL',
      'Use your Snowflake credentials',
      'Ensure your user has necessary permissions',
      'Test connection with a simple query'
    ]
  }
];

export const UserIntegrationSetup: React.FC<IntegrationSetupProps> = ({
  userId,
  onIntegrationUpdate
}) => {
  const [userIntegrations, setUserIntegrations] = useState<UserIntegrationCredentials[]>([]);
  const [activeTab, setActiveTab] = useState('available');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [setupForm, setSetupForm] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadUserIntegrations();
  }, [userId]);

  const loadUserIntegrations = () => {
    const integrations = userIntegrationManager.getUserIntegrations(userId);
    setUserIntegrations(integrations);
  };

  const handleAddIntegration = async (integrationId: string) => {
    setLoading(prev => ({ ...prev, [integrationId]: true }));
    
    try {
      const formData = setupForm[integrationId] || {};
      const { apiKey, ...additionalConfig } = formData;

      if (!apiKey) {
        alert('API Key is required');
        return;
      }

      const success = await userIntegrationManager.addUserIntegration(
        userId,
        integrationId,
        apiKey,
        additionalConfig
      );

      if (success) {
        // Add routing configuration
        userIntegrationManager.addIntegrationRoute(userId, integrationId, {
          workspaceId: additionalConfig.workspaceId,
          customEndpoints: additionalConfig
        });

        loadUserIntegrations();
        setSetupForm(prev => ({ ...prev, [integrationId]: {} }));
        setActiveTab('connected');
        onIntegrationUpdate?.();
        alert('Integration added successfully!');
      } else {
        alert('Failed to add integration. Please check your credentials.');
      }
    } catch (error) {
      console.error('Integration setup error:', error);
      alert('Error setting up integration. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, [integrationId]: false }));
    }
  };

  const handleRemoveIntegration = (integrationId: string) => {
    if (confirm(`Remove ${integrationId} integration?`)) {
      userIntegrationManager.removeUserIntegration(userId, integrationId);
      loadUserIntegrations();
      onIntegrationUpdate?.();
    }
  };

  const updateFormField = (integrationId: string, field: string, value: string) => {
    setSetupForm(prev => ({
      ...prev,
      [integrationId]: {
        ...prev[integrationId],
        [field]: value
      }
    }));
  };

  const isIntegrationConnected = (integrationId: string) => {
    return userIntegrations.some(int => int.integrationId === integrationId && int.isActive);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">🔗 Integration Management</h2>
        <p className="text-gray-600">Connect your favorite tools and services to GenieFlow AI</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available">Available Integrations</TabsTrigger>
          <TabsTrigger value="connected">
            My Integrations ({userIntegrations.filter(i => i.isActive).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {AVAILABLE_INTEGRATIONS.map((integration) => {
              const isConnected = isIntegrationConnected(integration.id);
              const isLoading = loading[integration.id];

              return (
                <Card key={integration.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {integration.name}
                        {isConnected && <Badge variant="secondary">Connected</Badge>}
                      </CardTitle>
                      <Settings className="w-5 h-5 text-gray-400" />
                    </div>
                    <CardDescription>{integration.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Setup Instructions */}
                    <div className="bg-blue-50 p-3 rounded-md">
                      <h4 className="font-medium text-sm mb-2">Setup Steps:</h4>
                      <ol className="text-xs space-y-1">
                        {integration.setupInstructions.map((step, idx) => (
                          <li key={idx} className="flex">
                            <span className="mr-2">{idx + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Configuration Form */}
                    <div className="space-y-3">
                      {integration.fields.map((field) => (
                        <div key={field.key}>
                          <Label htmlFor={`${integration.id}-${field.key}`}>
                            {field.label}
                          </Label>
                          <div className="relative">
                            <Input
                              id={`${integration.id}-${field.key}`}
                              type={field.type === 'password' && !showKeys[`${integration.id}-${field.key}`] ? 'password' : 'text'}
                              placeholder={field.placeholder}
                              value={setupForm[integration.id]?.[field.key] || ''}
                              onChange={(e) => updateFormField(integration.id, field.key, e.target.value)}
                            />
                            {field.type === 'password' && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowKeys(prev => ({
                                  ...prev,
                                  [`${integration.id}-${field.key}`]: !prev[`${integration.id}-${field.key}`]
                                }))}
                              >
                                {showKeys[`${integration.id}-${field.key}`] ? 
                                  <EyeOff className="w-4 h-4" /> : 
                                  <Eye className="w-4 h-4" />
                                }
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={() => handleAddIntegration(integration.id)}
                      disabled={isLoading || isConnected}
                      className="w-full"
                    >
                      {isLoading ? 'Connecting...' : isConnected ? 'Already Connected' : 'Connect Integration'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="connected" className="space-y-4">
          {userIntegrations.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Integrations Connected</h3>
                <p className="text-gray-600 mb-4">Connect your first integration to get started</p>
                <Button onClick={() => setActiveTab('available')}>
                  Browse Available Integrations
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userIntegrations.map((integration) => (
                <Card key={integration.integrationId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {integration.integrationId}
                        {integration.isActive ? 
                          <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge> :
                          <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Inactive</Badge>
                        }
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveIntegration(integration.integrationId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>Connected: {new Date(integration.createdAt).toLocaleDateString()}</div>
                      {integration.lastUsed && (
                        <div>Last used: {new Date(integration.lastUsed).toLocaleDateString()}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserIntegrationSetup;