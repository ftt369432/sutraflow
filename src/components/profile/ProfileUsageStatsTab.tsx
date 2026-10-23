import React from 'react';
import {
  Activity,
  TrendingUp,
  CheckCircle,
  Clock,
  Bot,
  Globe,
  Zap,
  Mail,
  Calendar,
  Database,
  MessageSquare,
  Phone,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Progress } from '../ui/progress';

interface ProfileUsageStatsTabProps {
  subscription: any;
  onNavigateAgents: () => void;
}

export const ProfileUsageStatsTab: React.FC<ProfileUsageStatsTabProps> = ({
  subscription,
  onNavigateAgents,
}) => {
  return (
    <div className="grid gap-6">
      {/* Automation Performance Overview */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-green-600" />
            Universal Automation Performance
          </CardTitle>
          <CardDescription>Real-time insights into your automation platform usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-700 dark:text-green-300">2,847</div>
              <p className="text-sm text-green-600 dark:text-green-400">Tasks Automated This Month</p>
              <div className="mt-2">
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +23% vs last month
                </Badge>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">94.7%</div>
              <p className="text-sm text-blue-600 dark:text-blue-400">Automation Success Rate</p>
              <div className="mt-2">
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Excellent Performance
                </Badge>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">16.2h</div>
              <p className="text-sm text-purple-600 dark:text-purple-400">Time Saved Daily</p>
              <div className="mt-2">
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  <Clock className="h-3 w-3 mr-1" />
                  Peak Efficiency
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Activity Dashboard */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-500" />
              Active Agents Performance
            </CardTitle>
            <CardDescription>Real-time status of your automation agents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Legal Document Processor', status: 'Active', tasks: 247, efficiency: 96 },
                { name: 'Email Communication Agent', status: 'Active', tasks: 189, efficiency: 94 },
                { name: 'Calendar Automation Bot', status: 'Active', tasks: 156, efficiency: 98 },
                { name: 'Research Assistant Agent', status: 'Idle', tasks: 89, efficiency: 92 },
              ].map((agent, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        agent.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    ></div>
                    <div>
                      <p className="font-medium text-sm">{agent.name}</p>
                      <p className="text-xs text-gray-500">{agent.tasks} tasks completed</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={agent.status === 'Active' ? 'default' : 'secondary'}>
                      {agent.status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">{agent.efficiency}% efficiency</p>
                  </div>
                </div>
              ))}
            </div>
            <Button className="w-full mt-4" variant="outline" onClick={onNavigateAgents}>
              <Bot className="h-4 w-4 mr-2" />
              Manage All Agents
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-500" />
              Cross-Profession Insights
            </CardTitle>
            <CardDescription>Automation usage across different professional areas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { profession: 'Legal Practice', percentage: 45, tasks: 1278, color: 'bg-blue-500' },
                {
                  profession: 'Business Operations',
                  percentage: 30,
                  tasks: 854,
                  color: 'bg-green-500',
                },
                { profession: 'Client Relations', percentage: 15, tasks: 427, color: 'bg-purple-500' },
                {
                  profession: 'Research & Analysis',
                  percentage: 10,
                  tasks: 288,
                  color: 'bg-orange-500',
                },
              ].map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">{item.profession}</span>
                    <span className="text-gray-600 dark:text-gray-400">{item.tasks} tasks</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
                    <div
                      className={`${item.color} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">{item.percentage}% of total usage</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automation Categories & Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Automation Categories Performance
          </CardTitle>
          <CardDescription>Detailed breakdown of automation tasks by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: <Mail className="h-6 w-6 text-blue-500" />,
                category: 'Email Automation',
                count: 1247,
                growth: '+18%',
                description: 'Auto-responses, scheduling, filtering',
              },
              {
                icon: <Calendar className="h-6 w-6 text-green-500" />,
                category: 'Calendar Management',
                count: 689,
                growth: '+31%',
                description: 'Meeting scheduling, time blocking',
              },
              {
                icon: <Database className="h-6 w-6 text-purple-500" />,
                category: 'Document Processing',
                count: 543,
                growth: '+12%',
                description: 'Analysis, generation, organization',
              },
              {
                icon: <MessageSquare className="h-6 w-6 text-orange-500" />,
                category: 'Communication',
                count: 368,
                growth: '+25%',
                description: 'Client updates, follow-ups',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  {item.icon}
                  <div>
                    <h4 className="font-medium text-sm">{item.category}</h4>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">{item.count}</span>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                      {item.growth}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">tasks completed</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Voice & Conversational Stats (Enterprise only) */}
      {(subscription?.plan === 'enterprise' ||
        subscription?.plan === 'enterprise-business') && (
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-6 w-6 text-purple-600" />
              Advanced Automation Features
            </CardTitle>
            <CardDescription>
              Voice commands and conversational building analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">348</div>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  Voice Commands This Month
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">12</div>
                <p className="text-sm text-indigo-600 dark:text-indigo-400">
                  Agents Built by Conversation
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-700 dark:text-teal-300">89%</div>
                <p className="text-sm text-teal-600 dark:text-teal-400">
                  Voice Recognition Accuracy
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resource Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Resource Usage & Limits
          </CardTitle>
          <CardDescription>Monitor your platform resource consumption</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>API Requests (Monthly)</span>
                  <span>
                    2,847 /{' '}
                    {subscription?.plan === 'free'
                      ? '1,000'
                      : subscription?.plan === 'pro'
                      ? '10,000'
                      : 'Unlimited'}
                  </span>
                </div>
                <Progress value={subscription?.plan === 'free' ? 100 : 28.47} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Processing Time (Hours)</span>
                  <span>
                    67.2 /{' '}
                    {subscription?.plan === 'free'
                      ? '10'
                      : subscription?.plan === 'pro'
                      ? '100'
                      : 'Unlimited'}
                  </span>
                </div>
                <Progress
                  value={
                    subscription?.plan === 'free'
                      ? 100
                      : subscription?.plan === 'pro'
                      ? 67.2
                      : 33.6
                  }
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Document Analysis</span>
                  <span>
                    543 /{' '}
                    {subscription?.plan === 'free'
                      ? '50'
                      : subscription?.plan === 'pro'
                      ? '500'
                      : 'Unlimited'}
                  </span>
                </div>
                <Progress
                  value={
                    subscription?.plan === 'free'
                      ? 100
                      : subscription?.plan === 'pro'
                      ? 100
                      : 27.15
                  }
                  className="h-2"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Concurrent Agents</span>
                  <span>
                    7 /{' '}
                    {subscription?.plan === 'free'
                      ? '1'
                      : subscription?.plan === 'pro'
                      ? '5'
                      : '25'}
                  </span>
                </div>
                <Progress
                  value={
                    subscription?.plan === 'free'
                      ? 100
                      : subscription?.plan === 'pro'
                      ? 100
                      : 28
                  }
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Knowledge Base Queries</span>
                  <span>
                    1,289 /{' '}
                    {subscription?.plan === 'free'
                      ? '100'
                      : subscription?.plan === 'pro'
                      ? '1,000'
                      : 'Unlimited'}
                  </span>
                </div>
                <Progress
                  value={
                    subscription?.plan === 'free'
                      ? 100
                      : subscription?.plan === 'pro'
                      ? 100
                      : 32.23
                  }
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Workflow Executions</span>
                  <span>
                    456 /{' '}
                    {subscription?.plan === 'free'
                      ? '25'
                      : subscription?.plan === 'pro'
                      ? '250'
                      : 'Unlimited'}
                  </span>
                </div>
                <Progress
                  value={
                    subscription?.plan === 'free'
                      ? 100
                      : subscription?.plan === 'pro'
                      ? 100
                      : 22.8
                  }
                  className="h-2"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
