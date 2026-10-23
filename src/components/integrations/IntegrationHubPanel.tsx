/**
 * 🔗 Integration Hub Panel Component
 * 
 * Multi-tenant integration management with user-specific API keys and routing.
 * Each user can add their own integrations without accessing source code.
 */

import React, { useState, useEffect } from 'react';
import { Database, FileText, Mic, Zap, Users, TrendingUp, Settings, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import UserIntegrationSetup from './UserIntegrationSetup';
import { userIntegrationManager } from '@/services/integrations/UserIntegrationManager';

// Integration status types
interface IntegrationStatus {
  id: string;
  name: string;
  connected: boolean;
  capabilities: string[];
  icon: React.ElementType;
  color: string;
  description: string;
}

interface IntegrationHubPanelProps {
  userId?: string;
}

/**
 * Integration Hub Panel Component with Multi-Tenant Support
 */
export const IntegrationHubPanel: React.FC<IntegrationHubPanelProps> = ({ 
  userId = 'default-user' // In production, get from auth context
}) => {
  const [activeView, setActiveView] = useState<'dashboard' | 'setup'>('dashboard');
  const [userIntegrations, setUserIntegrations] = useState<any[]>([]);

  const AVAILABLE_INTEGRATIONS: IntegrationStatus[] = [
    {
      id: 'snowflake',
      name: 'Snowflake',
      capabilities: ['Voice-to-SQL', 'Cost Optimization', 'Query Execution'],
      icon: Database,
      color: 'bg-blue-500',
      description: 'AI-powered data warehouse automation',
      connected: false
    },
    {
      id: 'notion',
      name: 'Notion',
      capabilities: ['Page Creation', 'AI Content', 'Database Operations'],
      icon: FileText,
      color: 'bg-gray-800',
      description: 'Intelligent workspace automation',
      connected: false
    },
    {
      id: 'slack',
      name: 'Slack',
      capabilities: ['Notifications', 'Workflow Triggers', 'Team Updates'],
      icon: Zap,
      color: 'bg-green-500',
      description: 'Team communication automation',
      connected: false
    },
    {
      id: 'google-workspace',
      name: 'Google Workspace',
      capabilities: ['Document Creation', 'Calendar Management', 'Drive Sync'],
      icon: Users,
      color: 'bg-red-500',
      description: 'Complete Google suite integration',
      connected: false
    }
  ];

  useEffect(() => {
    loadUserIntegrations();
  }, [userId]);

  const loadUserIntegrations = () => {
    const integrations = userIntegrationManager.getUserIntegrations(userId);
    setUserIntegrations(integrations);
  };

  const getConnectedIntegrations = (): IntegrationStatus[] => {
    return AVAILABLE_INTEGRATIONS.map(integration => ({
      ...integration,
      connected: userIntegrations.some(
        ui => ui.integrationId === integration.id && ui.isActive
      )
    }));
  };

  const getIntegrationStats = () => {
    const connected = getConnectedIntegrations();
    return {
      total: AVAILABLE_INTEGRATIONS.length,
      connected: connected.filter(i => i.connected).length,
      pending: connected.filter(i => !i.connected).length,
      activeIntegrations: connected.filter(i => i.connected).length
    };
  };

  const handleQuickAction = async (integrationId: string, action: string) => {
    try {
      const integrationInstance = await userIntegrationManager.createUserIntegrationInstance(userId, integrationId);
      
      switch (integrationId) {
        case 'notion':
          if (action === 'create-page') {
            await integrationInstance.createPage('Quick Test Page', 'This is a test page created from GenieFlow AI!');
            alert('✅ Test page created in Notion!');
          }
          break;
        case 'snowflake':
          if (action === 'test-query') {
            const result = await integrationInstance.executeQuery('SELECT CURRENT_TIMESTAMP();');
            alert(`✅ Snowflake connection successful! Time: ${result}`);
          }
          break;
        case 'slack':
          if (action === 'send-message') {
            alert('✅ Slack message sent! (Demo mode)');
          }
          break;
      }
    } catch (error) {
      alert(`❌ Error: ${error}`);
    }
  };

  if (activeView === 'setup') {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setActiveView('dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
        
        <UserIntegrationSetup 
          userId={userId} 
          onIntegrationUpdate={loadUserIntegrations}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Integration Hub Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">🚀 Integration Hub</h2>
            <p className="text-blue-100">
              Connect your tools and unlock AI-powered automation workflows
            </p>
          </div>
          <button
            onClick={() => setActiveView('setup')}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Integration
          </button>
        </div>
        
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="bg-white/20 px-3 py-1 rounded-full">
            📊 {getIntegrationStats().connected} Connected
          </div>
          <div className="bg-white/20 px-3 py-1 rounded-full">
            ⚡ {getIntegrationStats().pending} Available
          </div>
          <div className="bg-white/20 px-3 py-1 rounded-full">
            🏆 Contest Ready
          </div>
        </div>
      </div>

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {getConnectedIntegrations().map((integration) => {
          const IconComponent = integration.icon;
          
          return (
            <div
              key={integration.id}
              className={`bg-white rounded-xl border-2 p-6 transition-all duration-300 hover:shadow-lg ${
                integration.connected ? 'border-green-200 bg-green-50' : 'border-gray-200'
              }`}
            >
              {/* Integration Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${integration.color} text-white`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{integration.name}</h3>
                    <p className="text-sm text-gray-600">{integration.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {integration.connected ? (
                    <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Connected
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-gray-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      Not Connected
                    </div>
                  )}
                </div>
              </div>

              {/* Capabilities */}
              <div className="mb-4">
                <h4 className="font-medium text-sm text-gray-700 mb-2">Capabilities:</h4>
                <div className="flex flex-wrap gap-2">
                  {integration.capabilities.map((capability, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                    >
                      {capability}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                {integration.connected ? (
                  <div className="grid grid-cols-2 gap-2">
                    {integration.id === 'notion' && (
                      <button
                        onClick={() => handleQuickAction('notion', 'create-page')}
                        className="px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
                      >
                        Create Page
                      </button>
                    )}
                    {integration.id === 'snowflake' && (
                      <button
                        onClick={() => handleQuickAction('snowflake', 'test-query')}
                        className="px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
                      >
                        Test Query
                      </button>
                    )}
                    {integration.id === 'slack' && (
                      <button
                        onClick={() => handleQuickAction('slack', 'send-message')}
                        className="px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
                      >
                        Send Message
                      </button>
                    )}
                    <button
                      onClick={() => setActiveView('setup')}
                      className="px-3 py-2 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 transition-colors"
                    >
                      <Settings className="w-3 h-3 inline mr-1" />
                      Manage
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveView('setup')}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Connect Integration
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Contest Features Section */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
          🏆 Contest-Ready Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Mic className="w-5 h-5 text-purple-600" />
              <h4 className="font-bold">Voice-to-SQL Engine</h4>
            </div>
            <p className="text-sm text-gray-600">
              Natural language to Snowflake queries with AI optimization
            </p>
            <div className="mt-2">
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                ✅ Contest Ready
              </span>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-teal-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h4 className="font-bold">Cost Optimization</h4>
            </div>
            <p className="text-sm text-gray-600">
              AI-powered query cost analysis and recommendations
            </p>
            <div className="mt-2">
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                🚧 In Development
              </span>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h4 className="font-bold">Collaborative Analytics</h4>
            </div>
            <p className="text-sm text-gray-600">
              Multi-user workspace with voice-driven exploration
            </p>
            <div className="mt-2">
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                ✅ Contest Ready
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-lg mb-3 text-blue-800">🎯 Getting Started</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">For New Users:</h4>
            <ul className="space-y-1 text-blue-700">
              <li>• Click "Add Integration" to connect your accounts</li>
              <li>• Each integration stores YOUR credentials securely</li>
              <li>• No code access needed - pure UI setup</li>
              <li>• Test connections with quick actions</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Voice Commands:</h4>
            <ul className="space-y-1 text-blue-700">
              <li>• "Create new page in Notion"</li>
              <li>• "Run analytics query on Snowflake"</li>
              <li>• "Send team update to Slack"</li>
              <li>• "Generate monthly report"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationHubPanel;