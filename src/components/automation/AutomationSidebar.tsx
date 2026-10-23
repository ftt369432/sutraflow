import React from 'react';
import { BarChart2, Workflow, Brain, Users, Activity, Target, Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface AutomationSidebarProps {
  isSidebarCollapsed: boolean;
  workflows: any[];
  agentMetrics: {
    totalAgents: number;
    activeAgents: number;
    averagePerformance: number;
    totalTasks: number;
  };
  swarms: any[];
  activeOrchestrations: any[];
  recentCommands: any[];
  getStatusColor: (status: string) => string;
}

export const AutomationSidebar: React.FC<AutomationSidebarProps> = ({
  isSidebarCollapsed,
  workflows,
  agentMetrics,
  swarms,
  activeOrchestrations,
  recentCommands,
  getStatusColor,
}) => {
  return (
    <div
      className={`transition-all duration-300 ${
        isSidebarCollapsed ? 'w-0 overflow-hidden' : 'w-80'
      }`}
    >
      <div className="space-y-6">
        {/* Statistics Cards */}
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <BarChart2 className="h-5 w-5" />
              System Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Active Workflows */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-600 text-white">
                  <Workflow className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Active Workflows
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {Math.round(
                      (workflows.filter((w) => w.status === 'active').length /
                        Math.max(workflows.length, 1)) *
                        100
                    )}
                    % of total
                  </div>
                </div>
              </div>
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {workflows.filter((w) => w.status === 'active').length}
              </div>
            </div>

            {/* Active Agents */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-600 text-white">
                  <Brain className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Active Agents
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {Math.round(
                      (agentMetrics.activeAgents / Math.max(agentMetrics.totalAgents, 1)) * 100
                    )}
                    % of total
                  </div>
                </div>
              </div>
              <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {agentMetrics.activeAgents}
              </div>
            </div>

            {/* Total Swarms */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50/50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-600 text-white">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Total Swarms
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Currently active</div>
                </div>
              </div>
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {swarms.length}
              </div>
            </div>

            {/* Tasks Processed */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-600 text-white">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Tasks Processed
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Across all agents</div>
                </div>
              </div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {agentMetrics.totalTasks}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Target className="h-5 w-5" />
              Orchestration Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {agentMetrics.totalTasks}
                </div>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Total Tasks
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                  {agentMetrics.averagePerformance}%
                </div>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Success Rate
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-purple-50/50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  1.7s
                </div>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Avg Response
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-orange-50/50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                  {agentMetrics.activeAgents}
                </div>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Active Agents
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Orchestrations */}
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Active Orchestrations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeOrchestrations.length === 0 ? (
              <div className="text-center py-6">
                <Bot className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No active orchestrations
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Start a voice command to see activity
                </p>
              </div>
            ) : (
              activeOrchestrations.map((orchestration) => (
                <div
                  key={orchestration.id}
                  className="bg-slate-50/50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-slate-800 dark:text-white">
                      {orchestration.name}
                    </h4>
                    <Badge className={`text-xs ${getStatusColor(orchestration.status)}`}>
                      {orchestration.status}
                    </Badge>
                  </div>

                  {orchestration.status === 'running' && (
                    <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5 mb-2">
                      <div
                        className={`bg-gradient-to-r from-blue-600 to-indigo-600 h-1.5 rounded-full transition-all duration-500 ${
                          orchestration.progress === 100
                            ? 'w-full'
                            : orchestration.progress >= 80
                            ? 'w-4/5'
                            : orchestration.progress >= 60
                            ? 'w-3/5'
                            : orchestration.progress >= 40
                            ? 'w-2/5'
                            : orchestration.progress >= 20
                            ? 'w-1/5'
                            : 'w-0'
                        }`}
                      />
                    </div>
                  )}

                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Started: {orchestration.startTime.toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Commands */}
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Recent Commands
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentCommands.map((cmd) => (
              <div
                key={cmd.id}
                className="bg-slate-50/50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 rounded-lg p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-white mb-1 line-clamp-2">
                      {cmd.command}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{cmd.time}</p>
                  </div>
                  <Badge className={`text-xs ml-2 ${getStatusColor(cmd.status)}`}>
                    {cmd.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
