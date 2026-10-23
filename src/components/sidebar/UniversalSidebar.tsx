import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  MessageSquare, 
  Zap, 
  Layers,
  Settings,
  Minimize2,
  Maximize2,
  X,
  Pin,
  Chrome,
  Smartphone,
  Monitor,
  Cloud,
  Lightbulb,
  Users,
  Bot,
  Workflow,
  Mic,
  Eye,
  Palette,
  Code,
  FileText,
  Search,
  Calendar,
  Mail,
  Globe
} from 'lucide-react';
import { Button } from '../ui/Button';
import { BRAND_CONFIG } from '../../config/brand';

interface UniversalSidebarProps {
  isMinimized?: boolean;
  platform?: 'web' | 'extension' | 'mobile' | 'google-workspace';
  integrationContext?: {
    currentApp?: string;
    selectedText?: string;
    pageContent?: string;
    userEmail?: string;
  };
}

interface AIModelProvider {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'active' | 'inactive' | 'loading';
  capabilities: string[];
  color: string;
}

const AI_PROVIDERS: AIModelProvider[] = [
  {
    id: 'gpt4',
    name: 'GPT-4',
    icon: Brain,
    status: 'active',
    capabilities: ['conversation', 'coding', 'analysis', 'creative'],
    color: 'green'
  },
  {
    id: 'claude',
    name: 'Claude 3',
    icon: Lightbulb,
    status: 'active',
    capabilities: ['reasoning', 'safety', 'research', 'writing'],
    color: 'orange'
  },
  {
    id: 'gemini',
    name: 'Gemini Pro',
    icon: Chrome,
    status: 'active',
    capabilities: ['multimodal', 'integration', 'search', 'workspace'],
    color: 'blue'
  },
  {
    id: 'custom',
    name: 'Your Agents',
    icon: Users,
    status: 'active',
    capabilities: ['personalized', 'trained', 'domain-expert', 'swarm'],
    color: 'purple'
  }
];

const GOOGLE_INTEGRATIONS = [
  { name: 'Gmail', icon: Mail, context: 'email' },
  { name: 'Calendar', icon: Calendar, context: 'scheduling' },
  { name: 'Docs', icon: FileText, context: 'document' },
  { name: 'Sheets', icon: Code, context: 'data' },
  { name: 'Drive', icon: Cloud, context: 'storage' },
  { name: 'Search', icon: Search, context: 'web' }
];

export const UniversalSidebar: React.FC<UniversalSidebarProps> = ({ 
  isMinimized = false, 
  platform = 'web',
  integrationContext = {}
}) => {
  const [sidebarMinimized, setSidebarMinimized] = useState(isMinimized);
  const [isPinned, setIsPinned] = useState(false);
  const [activeModel, setActiveModel] = useState('gpt4');
  const [currentMode, setCurrentMode] = useState<'chat' | 'build' | 'swarm' | 'workflow'>('chat');
  const [contextAware, setContextAware] = useState(true);
  const [floatingMode, setFloatingMode] = useState(platform === 'extension');
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Context detection for Google Workspace
  const detectGoogleContext = () => {
    if (platform === 'google-workspace' || platform === 'extension') {
      const hostname = window.location?.hostname || '';
      if (hostname.includes('calendar.google.com')) return 'calendar';
      if (hostname.includes('mail.google.com')) return 'gmail';
      if (hostname.includes('docs.google.com')) return 'docs';
      if (hostname.includes('sheets.google.com')) return 'sheets';
      if (hostname.includes('drive.google.com')) return 'drive';
    }
    return null;
  };

  const googleContext = detectGoogleContext();

  // Adaptive styling based on platform
  const sidebarClasses = `
    ${floatingMode 
      ? 'fixed top-4 right-4 z-50 shadow-2xl rounded-2xl' 
      : 'fixed right-0 top-0 h-full z-40'
    }
    ${sidebarMinimized ? 'w-16' : 'w-96'}
    bg-white dark:bg-gray-900 
    border-l border-gray-200 dark:border-gray-700
    transition-all duration-300 ease-in-out
    ${platform === 'extension' ? 'max-h-[600px]' : 'h-full'}
    ${platform === 'mobile' ? 'w-full h-full' : ''}
    backdrop-blur-lg bg-opacity-95 dark:bg-opacity-95
  `;

  return (
    <div ref={sidebarRef} className={sidebarClasses}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!sidebarMinimized && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-semibold text-sm text-gray-900 dark:text-white font-mono">
                {BRAND_CONFIG.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {platform} {googleContext && `• ${googleContext}`}
              </div>
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-1">
          {!sidebarMinimized && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPinned(!isPinned)}
                className="w-8 h-8 p-0"
              >
                <Pin className={`w-4 h-4 ${isPinned ? 'text-blue-600' : 'text-gray-400'}`} />
              </Button>
              
              {platform === 'extension' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFloatingMode(!floatingMode)}
                  className="w-8 h-8 p-0"
                >
                  {floatingMode ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </Button>
              )}
            </>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarMinimized(!sidebarMinimized)}
            className="w-8 h-8 p-0"
          >
            {sidebarMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {!sidebarMinimized && (
        <>
          {/* Google Workspace Context Banner */}
          {googleContext && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <div className="text-sm">
                  <div className="font-medium text-blue-900 dark:text-blue-100 capitalize">
                    {googleContext} Integration
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-300">
                    AI enhanced • Context aware
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Context Awareness Toggle */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Context Aware</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setContextAware(!contextAware)}
                className={`w-10 h-6 rounded-full p-0 ${
                  contextAware ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div 
                  className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    contextAware ? 'translate-x-4' : 'translate-x-0'
                  }`} 
                />
              </Button>
            </div>
            {contextAware && integrationContext.selectedText && (
              <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
                <div className="font-medium text-yellow-800 dark:text-yellow-200">
                  Selected: "{integrationContext.selectedText.substring(0, 50)}..."
                </div>
              </div>
            )}
          </div>

          {/* Mode Selector */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-1">
              <Button
                variant={currentMode === 'chat' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentMode('chat')}
                className="flex items-center justify-center space-x-1"
              >
                <MessageSquare className="w-3 h-3" />
                <span className="text-xs">Chat</span>
              </Button>
              <Button
                variant={currentMode === 'build' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentMode('build')}
                className="flex items-center justify-center space-x-1"
              >
                <Layers className="w-3 h-3" />
                <span className="text-xs">Build</span>
              </Button>
              <Button
                variant={currentMode === 'swarm' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentMode('swarm')}
                className="flex items-center justify-center space-x-1"
              >
                <Users className="w-3 h-3" />
                <span className="text-xs">Swarm</span>
              </Button>
              <Button
                variant={currentMode === 'workflow' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentMode('workflow')}
                className="flex items-center justify-center space-x-1"
              >
                <Workflow className="w-3 h-3" />
                <span className="text-xs">Flow</span>
              </Button>
            </div>
          </div>

          {/* AI Model Selector */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              AI Models
            </div>
            <div className="space-y-1">
              {AI_PROVIDERS.map((provider) => {
                const Icon = provider.icon;
                const isActive = activeModel === provider.id;
                
                return (
                  <button
                    key={provider.id}
                    onClick={() => setActiveModel(provider.id)}
                    className={`w-full flex items-center space-x-3 p-2 rounded-lg text-left transition-colors ${
                      isActive 
                        ? `bg-${provider.color}-100 dark:bg-${provider.color}-900/30 text-${provider.color}-900 dark:text-${provider.color}-100`
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className={`w-6 h-6 bg-${provider.color}-100 dark:bg-${provider.color}-900 rounded flex items-center justify-center`}>
                      <Icon className={`w-3 h-3 text-${provider.color}-600 dark:text-${provider.color}-400`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{provider.name}</div>
                      <div className="text-xs opacity-75">
                        {provider.capabilities.slice(0, 2).join(', ')}
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      provider.status === 'active' ? 'bg-green-500' :
                      provider.status === 'loading' ? 'bg-yellow-500 animate-pulse' :
                      'bg-gray-400'
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Interface */}
          {currentMode === 'chat' && (
            <div className="flex-1 flex flex-col">
              {/* Messages Area */}
              <div className="flex-1 p-3 space-y-3 max-h-80 overflow-y-auto">
                {/* Welcome Message */}
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                    <Brain className="w-3 h-3 text-purple-600" />
                  </div>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
                    <div className="text-sm">
                      Hi! I'm your AI assistant with access to {AI_PROVIDERS.find(p => p.id === activeModel)?.name}.
                      {googleContext && ` I can help with your ${googleContext} tasks.`}
                      {integrationContext.selectedText && ' I see you have text selected - how can I help?'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder={
                      googleContext 
                        ? `Ask about your ${googleContext}...`
                        : "Ask anything..."
                    }
                    className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm border-0 focus:ring-2 focus:ring-purple-500"
                  />
                  <Button size="sm" variant="default" className="w-8 h-8 p-0">
                    <Bot className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="w-8 h-8 p-0">
                    <Mic className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions for Google Workspace */}
          {googleContext && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quick Actions
              </div>
              <div className="grid grid-cols-2 gap-1">
                {googleContext === 'gmail' && (
                  <>
                    <Button variant="outline" size="sm" className="text-xs">
                      📧 Smart Reply
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      📝 Compose
                    </Button>
                  </>
                )}
                {googleContext === 'calendar' && (
                  <>
                    <Button variant="outline" size="sm" className="text-xs">
                      📅 Schedule
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      🤝 Find Time
                    </Button>
                  </>
                )}
                {googleContext === 'docs' && (
                  <>
                    <Button variant="outline" size="sm" className="text-xs">
                      ✍️ Continue
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      📊 Summarize
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Platform Indicator */}
          <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                {platform === 'extension' && <Chrome className="w-3 h-3" />}
                {platform === 'mobile' && <Smartphone className="w-3 h-3" />}
                {platform === 'web' && <Monitor className="w-3 h-3" />}
                <span>{BRAND_CONFIG.shortName} • {platform}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Connected</span>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Minimized State */}
      {sidebarMinimized && (
        <div className="p-2 space-y-2">
          {AI_PROVIDERS.slice(0, 4).map((provider) => {
            const Icon = provider.icon;
            const isActive = activeModel === provider.id;
            
            return (
              <button
                key={provider.id}
                onClick={() => setActiveModel(provider.id)}
                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                  isActive 
                    ? `bg-${provider.color}-100 dark:bg-${provider.color}-900/30`
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={provider.name}
              >
                <Icon className={`w-5 h-5 text-${provider.color}-600 dark:text-${provider.color}-400`} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UniversalSidebar;