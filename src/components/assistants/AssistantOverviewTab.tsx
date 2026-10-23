import React from 'react';
import {
  Brain,
  MessageSquare,
  Target,
  TrendingUp,
  FolderOpen,
  Zap,
  Sparkles,
  Settings,
  BookOpen,
  Users,
  Activity,
  Bot
} from 'lucide-react';
import { Button } from '../ui/Button';
import { type AIAssistant } from '../../types/ai';

export interface AssistantStats {
  totalConversations: number;
  avgResponseTime: number;
  accuracyScore: number;
  learningProgress: number;
  knowledgeSources: number;
  activeTrainingSessions: number;
}

interface AssistantOverviewTabProps {
  selectedAssistant: AIAssistant;
  stats?: AssistantStats;
  onSetView: (view: any) => void;
  onPromoteToCreator: (assistant: AIAssistant) => void;
}

export const AssistantOverviewTab: React.FC<AssistantOverviewTabProps> = ({
  selectedAssistant,
  stats,
  onSetView,
  onPromoteToCreator
}) => {
  return (
    <div className="p-6 space-y-6">
      {/* Assistant Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 rounded-full flex items-center justify-center shadow-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {selectedAssistant.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {selectedAssistant.description}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              selectedAssistant.isActive
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}
          >
            {selectedAssistant.isActive ? 'Active' : 'Inactive'}
          </div>
          <div className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm font-medium capitalize">
            {selectedAssistant.type}
          </div>
        </div>
      </div>

      {/* Creator Space Promotion Banner */}
      <div className="bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-blue-950/40 rounded-xl border border-purple-500/40 p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Promote to Creator Space</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Move "{selectedAssistant.name}" to the Creator Dashboard to package, monetize, and distribute as a sovereign .gpack!
            </p>
          </div>
        </div>
        <Button
          onClick={() => onPromoteToCreator(selectedAssistant)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md transition-all duration-300 hover:scale-105 flex items-center"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Monetize Assistant
        </Button>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Conversations</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {stats.totalConversations || '0'}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 dark:text-green-400 text-sm font-medium">Accuracy</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {stats.accuracyScore > 0 ? `${stats.accuracyScore.toFixed(1)}%` : '—'}
                </p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Learning</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {stats.learningProgress > 0 ? `${stats.learningProgress.toFixed(0)}%` : '—'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">Sources</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {stats.knowledgeSources || '0'}
                </p>
              </div>
              <FolderOpen className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-800 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-600 dark:text-teal-400 text-sm font-medium">Response Time</p>
                <p className="text-2xl font-bold text-teal-900 dark:text-teal-100">
                  {stats.avgResponseTime > 0 ? `${stats.avgResponseTime.toFixed(0)}ms` : '—'}
                </p>
              </div>
              <Zap className="w-8 h-8 text-teal-500" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900 dark:to-indigo-800 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-600 dark:text-indigo-400 text-sm font-medium">Training</p>
                <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                  {stats.activeTrainingSessions}
                </p>
              </div>
              <Brain className="w-8 h-8 text-indigo-500" />
            </div>
          </div>
        </div>
      )}

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Autonomous Learning */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Autonomous Learning</h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 dark:text-green-400">Active & Learning</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Insights Discovered</span>
              <span className="font-medium text-gray-900 dark:text-white">42</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Patterns Detected</span>
              <span className="font-medium text-gray-900 dark:text-white">16</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Auto-Adaptations</span>
              <span className="font-medium text-green-600 dark:text-green-400">28</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3"
              onClick={() => onSetView('training')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Configure Learning
            </Button>
          </div>
        </div>

        {/* Enhanced Knowledge Base */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Enhanced Knowledge Base</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stats?.knowledgeSources || 0} AI-processed sources
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Smart Documents</span>
              <span className="font-medium text-gray-900 dark:text-white">128</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">AI Processing</span>
              <span className="font-medium text-green-600 dark:text-green-400">94% Complete</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Vector Search Ready</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">✓ Enabled</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3"
              onClick={() => onSetView('knowledge')}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Manage Knowledge
            </Button>
          </div>
        </div>

        {/* Swarm Creation */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">AI Swarm Creation</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Convert to agent swarm</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Transform into coordinated swarm of specialized agents for parallel processing.
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Potential Agents</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {(selectedAssistant.capabilities?.length || 0) + 1}
              </span>
            </div>
            <Button
              variant="default"
              size="sm"
              className="w-full mt-3 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 hover:from-slate-700 hover:via-slate-800 hover:to-slate-900"
              onClick={() => onSetView('swarm')}
            >
              <Bot className="w-4 h-4 mr-2" />
              Create Swarm
            </Button>
          </div>
        </div>

        {/* Advanced Training */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Advanced Training</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stats?.activeTrainingSessions || 0} sessions running
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Training Entries</span>
              <span className="font-medium text-gray-900 dark:text-white">64</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Context Awareness</span>
              <span className="font-medium text-purple-600 dark:text-purple-400">92.4%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Learning Rate</span>
              <span className="font-medium text-green-600 dark:text-green-400">+0.6%/day</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3"
              onClick={() => onSetView('training')}
            >
              <Activity className="w-4 h-4 mr-2" />
              Start Training Session
            </Button>
          </div>
        </div>

        {/* Performance & Analytics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Performance Analytics</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Real-time metrics</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Response Quality</span>
              <span className="font-medium text-gray-900 dark:text-white">96%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">User Satisfaction</span>
              <span className="font-medium text-green-600 dark:text-green-400">98%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Knowledge Utilization</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">88%</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3"
              onClick={() => onSetView('analytics')}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
          </div>
        </div>

        {/* Quick Chat Access */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Start Conversation</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Chat with {selectedAssistant.name}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Enhanced with autonomous learning, context awareness, and your knowledge base.
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Learning Mode</span>
              <span className="font-medium text-purple-600 dark:text-purple-400">✓ Active</span>
            </div>
            <Button
              variant="default"
              size="sm"
              className="w-full mt-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              onClick={() => onSetView('chat')}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Start Chat
            </Button>
          </div>
        </div>
      </div>

      {/* Capabilities & AI Features */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Capabilities & AI Features</h3>
          <Button variant="outline" size="sm" onClick={() => onSetView('config')}>
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Core Capabilities</h4>
            <div className="flex flex-wrap gap-2">
              {selectedAssistant.capabilities?.map((capability, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm font-medium"
                >
                  {capability.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">AI Features</h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full text-sm font-medium">
                Autonomous Learning
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm font-medium">
                Pattern Recognition
              </span>
              <span className="px-3 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-full text-sm font-medium">
                Swarm Ready
              </span>
              <span className="px-3 py-1 bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200 rounded-full text-sm font-medium">
                Context Aware
              </span>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 rounded-full text-sm font-medium">
                Vector Search
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Dashboard */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 h-12 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            onClick={() => onSetView('chat')}
          >
            <MessageSquare className="w-4 h-4" />
            Start Conversation
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 h-12 hover:bg-green-50 dark:hover:bg-green-900/20"
            onClick={() => onSetView('knowledge')}
          >
            <BookOpen className="w-4 h-4" />
            Manage Knowledge
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 h-12 hover:bg-purple-50 dark:hover:bg-purple-900/20"
            onClick={() => onSetView('training')}
          >
            <Brain className="w-4 h-4" />
            Advanced Training
          </Button>
        </div>
      </div>
    </div>
  );
};
