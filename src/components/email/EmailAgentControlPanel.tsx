/**
 * 🎯 Unified Email Agent Interface - Clean & Comprehensive
 * 
 * Replaces 9+ scattered buttons with organized sections
 * Works across all industries following URENO principle
 */

import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Settings, 
  Play, 
  Pause, 
  BarChart3, 
  FolderOpen, 
  Tag, 
  Calendar, 
  CheckSquare, 
  FileText, 
  Users, 
  Bell,
  Zap,
  Brain,
  Shield,
  Workflow,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Activity,
  Clock,
  Target,
  Lightbulb
} from 'lucide-react';
import { EmailAgentWatcher, EmailAgentWatcherConfig, AgentExecutionResult } from '../../services/email/agents/EmailAgentWatcher';
import { 
  EmailAgentRule, 
  IndustryProfile, 
  INDUSTRY_PROFILES,
  UniversalAgentType 
} from '../../services/email/agents/UniversalEmailAgentSystem';
import { EmailMessage } from '../../services/email/types';

interface EmailAgentControlPanelProps {
  emailWatcher: EmailAgentWatcher;
  currentEmail?: EmailMessage;
  onRuleUpdate?: (rule: EmailAgentRule) => void;
  className?: string;
}

interface ActiveAgent {
  type: UniversalAgentType;
  status: 'idle' | 'processing' | 'completed' | 'error';
  progress: number;
  lastResult?: any;
}

export const EmailAgentControlPanel: React.FC<EmailAgentControlPanelProps> = ({
  emailWatcher,
  currentEmail,
  onRuleUpdate,
  className = ''
}) => {
  // State Management
  const [activeSection, setActiveSection] = useState<'agents' | 'rules' | 'performance'>('agents');
  const [isWatcherEnabled, setIsWatcherEnabled] = useState(true);
  const [activeAgents, setActiveAgents] = useState<Map<UniversalAgentType, ActiveAgent>>(new Map());
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryProfile>(INDUSTRY_PROFILES[0]);
  const [recentResults, setRecentResults] = useState<AgentExecutionResult[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['quick-actions']));

  // Event Handlers
  useEffect(() => {
    const handleEmailProcessed = (data: any) => {
      setRecentResults(prev => [data, ...prev.slice(0, 4)]);
    };

    const handleProcessingError = (data: any) => {
      console.error('Email processing error:', data);
    };

    emailWatcher.on('emailProcessed', handleEmailProcessed);
    emailWatcher.on('processingError', handleProcessingError);

    return () => {
      emailWatcher.off('emailProcessed', handleEmailProcessed);
      emailWatcher.off('processingError', handleProcessingError);
    };
  }, [emailWatcher]);

  // Quick Actions
  const handleProcessCurrentEmail = async () => {
    if (!currentEmail) return;
    
    console.log('🚀 Processing current email with agent system');
    try {
      const results = await emailWatcher.processEmail(currentEmail);
      console.log('✅ Email processed successfully:', results);
    } catch (error) {
      console.error('❌ Email processing failed:', error);
    }
  };

  const handleToggleWatcher = () => {
    setIsWatcherEnabled(!isWatcherEnabled);
    console.log(`📡 Email watcher ${!isWatcherEnabled ? 'enabled' : 'disabled'}`);
  };

  const handleIndustryChange = (industry: IndustryProfile) => {
    setSelectedIndustry(industry);
    console.log(`🏢 Industry changed to: ${industry.displayName}`);
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Render Section Helpers
  const renderSectionHeader = (id: string, title: string, icon: React.ReactNode, description?: string) => (
    <div 
      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      onClick={() => toggleSection(id)}
    >
      <div className="flex items-center space-x-3">
        <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-400">
          {icon}
        </div>
        <div>
          <h3 className="font-medium text-gray-900 dark:text-gray-100">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
      </div>
      {expandedSections.has(id) ? 
        <ChevronUp className="w-4 h-4 text-gray-400" /> : 
        <ChevronDown className="w-4 h-4 text-gray-400" />
      }
    </div>
  );

  const renderQuickActions = () => (
    <div className="space-y-3">
      {renderSectionHeader(
        'quick-actions',
        'Quick Actions',
        <Zap className="w-4 h-4" />,
        'Instant email processing & control'
      )}
      
      {expandedSections.has('quick-actions') && (
        <div className="p-4 space-y-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          {/* Main Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleProcessCurrentEmail}
              disabled={!currentEmail}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors font-medium"
            >
              <Bot className="w-4 h-4" />
              <span>Process Email</span>
            </button>
            
            <button
              onClick={handleToggleWatcher}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors font-medium ${
                isWatcherEnabled 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              {isWatcherEnabled ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              <span>{isWatcherEnabled ? 'Active' : 'Paused'}</span>
            </button>
          </div>

          {/* Industry Selector */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Industry Profile
            </label>
            <select
              value={selectedIndustry.id}
              onChange={(e) => {
                const industry = INDUSTRY_PROFILES.find(i => i.id === e.target.value);
                if (industry) handleIndustryChange(industry);
              }}
              aria-label="Select industry profile"
              title="Select industry profile"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {INDUSTRY_PROFILES.map(industry => (
                <option key={industry.id} value={industry.id}>
                  {industry.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Activity className="w-3 h-3 text-green-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Watcher: {isWatcherEnabled ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="w-3 h-3 text-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {selectedIndustry.displayName}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAgentOrchestration = () => (
    <div className="space-y-3">
      {renderSectionHeader(
        'agent-orchestration',
        'Agent Orchestration',
        <Workflow className="w-4 h-4" />,
        'Multi-agent workflow management'
      )}
      
      {expandedSections.has('agent-orchestration') && (
        <div className="p-4 space-y-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          {/* Available Agents */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Available Agents</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {Object.values(UniversalAgentType).slice(0, 12).map((agentType, index) => {
                const agent = activeAgents.get(agentType as UniversalAgentType);
                const isActive = agent?.status === 'processing';
                const agentTypeName = String(agentType);
                
                return (
                  <div
                    key={`${agentTypeName}-${index}`}
                    className={`p-2 rounded-lg border text-center cursor-pointer transition-all ${
                      isActive 
                        ? 'border-green-300 bg-green-50 dark:bg-green-900/20' 
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
                    }`}
                  >
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {agentTypeName.replace(/_/g, ' ')}
                    </div>
                    {isActive && (
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1">
                        <div className="bg-green-500 h-1 rounded-full transition-all duration-300 w-full" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Agent Workflows */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center space-x-2 px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-lg transition-colors">
              <Workflow className="w-4 h-4" />
              <span>Sequential</span>
            </button>
            <button className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-lg transition-colors">
              <Zap className="w-4 h-4" />
              <span>Parallel</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderSmartActions = () => (
    <div className="space-y-3">
      {renderSectionHeader(
        'smart-actions',
        'Smart Actions',
        <Brain className="w-4 h-4" />,
        'AI-powered email automation'
      )}
      
      {expandedSections.has('smart-actions') && (
        <div className="p-4 space-y-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          {/* Organization Actions */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Organization</h4>
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center space-x-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg transition-colors text-sm">
                <FolderOpen className="w-3 h-3" />
                <span>Auto Folder</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg transition-colors text-sm">
                <Tag className="w-3 h-3" />
                <span>Smart Tags</span>
              </button>
            </div>
          </div>

          {/* Integration Actions */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Integrations</h4>
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center space-x-2 px-3 py-2 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-lg transition-colors text-sm">
                <Calendar className="w-3 h-3" />
                <span>Calendar</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg transition-colors text-sm">
                <CheckSquare className="w-3 h-3" />
                <span>Tasks</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg transition-colors text-sm">
                <FileText className="w-3 h-3" />
                <span>Documents</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 bg-pink-50 hover:bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 rounded-lg transition-colors text-sm">
                <Users className="w-3 h-3" />
                <span>CRM</span>
              </button>
            </div>
          </div>

          {/* Notification Actions */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Notifications</h4>
            <div className="flex space-x-2">
              <button className="flex items-center space-x-2 px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg transition-colors text-sm">
                <Bell className="w-3 h-3" />
                <span>Smart Alerts</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm">
                <Shield className="w-3 h-3" />
                <span>Priority Filter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPerformanceInsights = () => (
    <div className="space-y-3">
      {renderSectionHeader(
        'performance-insights',
        'Performance Insights',
        <BarChart3 className="w-4 h-4" />,
        'Agent analytics & optimization'
      )}
      
      {expandedSections.has('performance-insights') && (
        <div className="p-4 space-y-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          {/* Recent Activity */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Recent Activity</h4>
            {recentResults.length > 0 ? (
              <div className="space-y-2">
                {recentResults.slice(0, 3).map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${result.success ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {result.agentResults.size} agents
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{result.executionTime}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {recentResults.filter(r => r.success).length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {Math.round(recentResults.reduce((avg, r) => avg + r.executionTime, 0) / Math.max(1, recentResults.length))}ms
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Avg Time</div>
            </div>
          </div>

          {/* Optimization Tips */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Optimization Tip</span>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Enable parallel agent execution to reduce processing time by up to 60%.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Navigation */}
      <div className="flex items-center space-x-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {[
          { id: 'agents', label: 'Agents', icon: Bot },
          { id: 'rules', label: 'Rules', icon: Settings },
          { id: 'performance', label: 'Insights', icon: BarChart3 }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id as any)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSection === id
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Section Content */}
      <div className="space-y-4">
        {activeSection === 'agents' && (
          <>
            {renderQuickActions()}
            {renderAgentOrchestration()}
            {renderSmartActions()}
          </>
        )}
        
        {activeSection === 'rules' && (
          <div className="p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <Settings className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Rule Configuration</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Advanced rule management interface coming soon
              </p>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                Create New Rule
              </button>
            </div>
          </div>
        )}
        
        {activeSection === 'performance' && (
          <>
            {renderPerformanceInsights()}
          </>
        )}
      </div>
    </div>
  );
};

export default EmailAgentControlPanel;