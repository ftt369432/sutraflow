import React from 'react';
import {
  Brain,
  Target,
  TrendingUp,
  Lightbulb,
  Download,
  RefreshCcw,
  BarChart3
} from 'lucide-react';
import { Button } from '../ui/Button';
import { type AIAssistant } from '../../types/ai';

interface AssistantAnalyticsTabProps {
  selectedAssistant: AIAssistant;
}

export const AssistantAnalyticsTab: React.FC<AssistantAnalyticsTabProps> = ({
  selectedAssistant
}) => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time performance metrics and insights for {selectedAssistant.name}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Response Quality</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">94%</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">+3.2% this week</p>
            </div>
            <Target className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 dark:text-green-400 text-sm font-medium">Learning Rate</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">+2.4%</p>
              <p className="text-xs text-green-600 dark:text-green-400">per session</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Knowledge Utilization</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">89%</p>
              <p className="text-xs text-purple-600 dark:text-purple-400">of knowledge base</p>
            </div>
            <Brain className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">User Satisfaction</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">98%</p>
              <p className="text-xs text-orange-600 dark:text-orange-400">based on feedback</p>
            </div>
            <Lightbulb className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Learning Insights & Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Learning Insights</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <Brain className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Pattern Detection</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Explanation requests +35%</p>
                </div>
              </div>
              <span className="text-sm font-medium text-blue-600">92% confidence</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <Target className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Response Optimization</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Preferred detail level learned</p>
                </div>
              </div>
              <span className="text-sm font-medium text-green-600">96% accuracy</span>
            </div>
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Learning pattern detected</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">User prefers detailed explanations - 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Knowledge base updated</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">8 new documents processed - 4 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Training session completed</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">+4% accuracy improvement - 6 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
