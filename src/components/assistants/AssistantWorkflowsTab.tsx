import React from 'react';
import {
  Zap,
  Settings,
  Mic,
  Plus,
  Wrench,
  FileText,
  Target,
  CheckCircle,
  Activity,
  Workflow,
  Users,
  BarChart3,
  RefreshCcw,
  Database
} from 'lucide-react';
import { Button } from '../ui/Button';
import { type AIAssistant } from '../../types/ai';

interface AssistantWorkflowsTabProps {
  selectedAssistant: AIAssistant;
}

export const AssistantWorkflowsTab: React.FC<AssistantWorkflowsTabProps> = ({
  selectedAssistant
}) => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Workflow className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Workflow Integration
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Connect your assistant to powerful automation workflows. Create, manage, and trigger workflows directly from your assistant.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Quick Workflows</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ready-to-use automations</p>
            </div>
          </div>
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Plus className="w-4 h-4 mr-2" />
              Email Processing
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Plus className="w-4 h-4 mr-2" />
              Document Generation
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Plus className="w-4 h-4 mr-2" />
              Calendar Sync
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Custom Workflows</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Build your own automations</p>
            </div>
          </div>
          <div className="space-y-2">
            <Button
              onClick={() => {
                window.location.href = '/workflow-editor';
              }}
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              <Wrench className="w-4 h-4 mr-2" />
              Workflow Studio
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <FileText className="w-4 h-4 mr-2" />
              Template Library
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Mic className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Voice Triggers</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Voice-activated workflows</p>
            </div>
          </div>
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Mic className="w-4 h-4 mr-2" />
              Voice Commands
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Target className="w-4 h-4 mr-2" />
              Smart Triggers
            </Button>
          </div>
        </div>
      </div>

      {/* Active Workflows */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Active Workflows for {selectedAssistant?.name}
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Email Auto-Response</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Automatically respond to common inquiries
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-sm">
                Active
              </span>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Document Generation</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Create documents from conversation context
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded text-sm">
                Pending
              </span>
              <Button variant="outline" size="sm">
                Setup
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Performance Monitoring</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Track assistant performance and usage
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-sm">
                Active
              </span>
              <Button variant="outline" size="sm">
                View
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Templates */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Workflow Templates
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              name: 'Client Onboarding',
              description: 'Automated client welcome and setup process',
              icon: Users,
              color: 'text-blue-500 bg-blue-100 dark:bg-blue-900'
            },
            {
              name: 'Task Management',
              description: 'Organize and track tasks automatically',
              icon: CheckCircle,
              color: 'text-green-500 bg-green-100 dark:bg-green-900'
            },
            {
              name: 'Report Generation',
              description: 'Create reports from conversation data',
              icon: BarChart3,
              color: 'text-purple-500 bg-purple-100 dark:bg-purple-900'
            },
            {
              name: 'Follow-up Automation',
              description: 'Schedule and send follow-up communications',
              icon: RefreshCcw,
              color: 'text-orange-500 bg-orange-100 dark:bg-orange-900'
            },
            {
              name: 'Data Processing',
              description: 'Process and analyze incoming data',
              icon: Database,
              color: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900'
            },
            {
              name: 'Integration Sync',
              description: 'Sync data across multiple platforms',
              icon: Zap,
              color: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900'
            }
          ].map((template, index) => {
            const Icon = template.icon;
            return (
              <div
                key={index}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 ${template.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{template.name}</h4>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {template.description}
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Workflow
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
