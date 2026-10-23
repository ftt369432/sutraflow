import React, { useState } from 'react';
import { 
  Brain, 
  Bot, 
  Settings, 
  Zap,
  TrendingUp,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SmartAutomationSuggestions } from './SmartAutomationSuggestions';
import { EnhancedEmailAutomationHub } from './EnhancedEmailAutomationHub';
import { EmailMessage } from '../../services/email/types';

type TabType = 'suggestions' | 'automation' | 'analytics';

interface OrganizedAutomationPanelProps {
  emails: EmailMessage[];
  selectedEmails: string[];
  onCreateRule: (rule: any) => void;
  onPreviewRule: (rule: any) => void;
  onAnalyzeEmails: () => void;
  onVoiceCommand: (command: string) => void;
}

export function OrganizedAutomationPanel({
  emails,
  selectedEmails,
  onCreateRule,
  onPreviewRule,
  onAnalyzeEmails,
  onVoiceCommand
}: OrganizedAutomationPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('suggestions');

  const tabs = [
    {
      id: 'suggestions' as TabType,
      label: 'Smart Rules',
      icon: <Brain className="h-4 w-4" />,
      badge: emails?.length > 5 ? '!' : undefined
    },
    {
      id: 'automation' as TabType,
      label: 'Actions',
      icon: <Zap className="h-4 w-4" />,
      badge: selectedEmails.length > 0 ? selectedEmails.length.toString() : undefined
    },
    {
      id: 'analytics' as TabType,
      label: 'Insights',
      icon: <TrendingUp className="h-4 w-4" />,
      badge: undefined
    }
  ];

  return (
    <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-gradient-to-br from-blue-dark-metallic-900 to-blue-dark-metallic-800 flex flex-col">
      {/* Tab Navigation */}
      <div className="p-4 border-b border-blue-dark-metallic-700">
        <div className="flex items-center gap-1 bg-blue-dark-metallic-800/50 rounded-lg p-1">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              size="sm"
              variant={activeTab === tab.id ? "default" : "ghost"}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 relative ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-blue-dark-metallic-700'
              }`}
            >
              {tab.icon}
              <span className="ml-1 text-xs">{tab.label}</span>
              {tab.badge && (
                <Badge className="ml-1 bg-red-500 text-white text-xs min-w-[16px] h-4 flex items-center justify-center">
                  {tab.badge}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'suggestions' && (
          <div className="p-4">
            <SmartAutomationSuggestions
              emails={emails}
              onCreateRule={onCreateRule}
              onPreviewRule={onPreviewRule}
            />
          </div>
        )}

        {activeTab === 'automation' && (
          <div className="p-4">
            <EnhancedEmailAutomationHub
              selectedEmails={selectedEmails}
              onAnalyzeEmails={onAnalyzeEmails}
              onVoiceCommand={onVoiceCommand}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="p-4">
            <Card className="card-metallic">
              <CardHeader>
                <CardTitle className="text-sm flex items-center text-blue-400">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Email Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-dark-metallic-800/50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-white">{emails?.length || 0}</div>
                    <div className="text-xs text-gray-400">Total Emails</div>
                  </div>
                  <div className="bg-green-600/20 p-3 rounded-lg">
                    <div className="text-lg font-bold text-green-400">
                      {emails?.filter(e => 
                        e.subject?.toLowerCase().includes('court') || 
                        e.subject?.toLowerCase().includes('hearing')
                      ).length || 0}
                    </div>
                    <div className="text-xs text-gray-400">Legal Emails</div>
                  </div>
                  <div className="bg-yellow-600/20 p-3 rounded-lg">
                    <div className="text-lg font-bold text-yellow-400">
                      {emails?.filter(e => 
                        e.subject?.toLowerCase().includes('allen') ||
                        e.from?.toLowerCase().includes('allen')
                      ).length || 0}
                    </div>
                    <div className="text-xs text-gray-400">Allen Emails</div>
                  </div>
                  <div className="bg-purple-600/20 p-3 rounded-lg">
                    <div className="text-lg font-bold text-purple-400">
                      {emails?.filter(e => !e.read).length || 0}
                    </div>
                    <div className="text-xs text-gray-400">Unread</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-white">Quick Insights</h4>
                  <div className="space-y-1 text-xs text-gray-300">
                    <div className="flex items-center justify-between">
                      <span>Most Active Sender</span>
                      <span className="text-blue-400">
                        {emails?.length > 0 ? 'Allen' : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Peak Email Time</span>
                      <span className="text-blue-400">10:00 AM</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Automation Potential</span>
                      <span className="text-green-400">High</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Quick Action Footer */}
      <div className="p-4 border-t border-blue-dark-metallic-700">
        <div className="text-xs text-gray-500 text-center">
          💡 <strong>Tip:</strong> Create automation rules from patterns to save time
        </div>
      </div>
    </div>
  );
} 