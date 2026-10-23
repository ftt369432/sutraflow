import React from 'react';
import {
  Crown,
  Bot,
  ArrowUpRight,
  Users,
  Zap,
  CheckCircle,
  X,
  Target,
  AlertCircle,
  Globe,
  Mail,
  Calendar,
  Database,
  Activity,
  MessageSquare,
  Phone,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Progress } from '../ui/progress';

interface ProfileSubscriptionTabProps {
  subscription: any;
  planName: string;
  billingPeriod: string;
  formatDate: (dateStr: string) => string;
  onNavigateSubscription: () => void;
  onNavigateAutomation: () => void;
  onNavigateAgents: () => void;
}

export const ProfileSubscriptionTab: React.FC<ProfileSubscriptionTabProps> = ({
  subscription,
  planName,
  billingPeriod,
  formatDate,
  onNavigateSubscription,
  onNavigateAutomation,
  onNavigateAgents,
}) => {
  return (
    <div className="grid gap-6">
      {/* Current Plan Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-purple-600" />
            Universal Automation Platform
          </CardTitle>
          <CardDescription>
            Your current plan and universal automation capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                  <Bot className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-purple-900 dark:text-purple-100">{planName}</h3>
                  <p className="text-purple-700 dark:text-purple-300">{billingPeriod}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Plan Status:</span>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {subscription?.status || 'Active'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Billing Cycle:</span>
                  <span className="font-medium">{billingPeriod || 'Free'}</span>
                </div>
                {subscription?.currentPeriodEnd && (
                  <div className="flex justify-between">
                    <span>Next Billing:</span>
                    <span className="font-medium">
                      {formatDate(subscription.currentPeriodEnd)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Quick Actions</h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={onNavigateSubscription}
                >
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={onNavigateAutomation}
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Automation Dashboard
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={onNavigateAgents}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Agents
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Universal Automation Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Universal Automation Features
          </CardTitle>
          <CardDescription>
            Cross-profession automation capabilities available in your plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: <Mail className="h-5 w-5 text-blue-500" />,
                title: 'Email Automation',
                description: 'Process emails, auto-responses, scheduling',
                available: subscription?.plan !== 'free',
              },
              {
                icon: <Calendar className="h-5 w-5 text-green-500" />,
                title: 'Calendar Management',
                description: 'Auto-scheduling, meeting prep, time blocking',
                available: subscription?.plan !== 'free',
              },
              {
                icon: <Database className="h-5 w-5 text-purple-500" />,
                title: 'Document Processing',
                description: 'Analysis, generation, smart organization',
                available: subscription?.plan !== 'free',
              },
              {
                icon: <Activity className="h-5 w-5 text-orange-500" />,
                title: 'Task Automation',
                description: 'Workflow management, progress tracking',
                available: subscription?.plan !== 'free',
              },
              {
                icon: <MessageSquare className="h-5 w-5 text-indigo-500" />,
                title: 'Conversational Building',
                description: 'Build agents by talking to the system',
                available:
                  subscription?.plan === 'enterprise' ||
                  subscription?.plan === 'enterprise-business',
              },
              {
                icon: <Phone className="h-5 w-5 text-teal-500" />,
                title: 'Voice Commands',
                description: 'Hands-free voice control and interaction',
                available: subscription?.plan === 'enterprise-business',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  feature.available
                    ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  {feature.icon}
                  <h5 className="font-medium">{feature.title}</h5>
                  {feature.available ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Usage & Limits
          </CardTitle>
          <CardDescription>Your current usage and plan limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Monthly Automation Tasks</span>
                <span>
                  156 /{' '}
                  {subscription?.plan === 'free'
                    ? '50'
                    : subscription?.plan === 'pro'
                    ? '1,000'
                    : 'Unlimited'}
                </span>
              </div>
              <Progress value={subscription?.plan === 'free' ? 100 : 15.6} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Active Agents</span>
                <span>
                  7 /{' '}
                  {subscription?.plan === 'free'
                    ? '1'
                    : subscription?.plan === 'pro'
                    ? '5'
                    : 'Unlimited'}
                </span>
              </div>
              <Progress
                value={
                  subscription?.plan === 'free'
                    ? 100
                    : subscription?.plan === 'pro'
                    ? 100
                    : 35
                }
                className="h-2"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Knowledge Base Storage</span>
                <span>
                  2.4GB /{' '}
                  {subscription?.plan === 'free'
                    ? '1GB'
                    : subscription?.plan === 'pro'
                    ? '10GB'
                    : subscription?.plan === 'enterprise'
                    ? '100GB'
                    : 'Unlimited'}
                </span>
              </div>
              <Progress value={subscription?.plan === 'free' ? 100 : 24} className="h-2" />
            </div>
          </div>

          {subscription?.plan === 'free' && (
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <h5 className="font-medium text-yellow-800 dark:text-yellow-200">
                  Upgrade for More Automation
                </h5>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                You're on the free plan. Upgrade to unlock unlimited automation tasks, more agents,
                and advanced features.
              </p>
              <Button size="sm" onClick={onNavigateSubscription}>
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cross-Profession Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-500" />
            Cross-Profession Usage
          </CardTitle>
          <CardDescription>
            How you're using universal automation across different areas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { profession: 'Legal Work', usage: 85, color: 'bg-blue-500' },
              { profession: 'Business Operations', usage: 70, color: 'bg-green-500' },
              { profession: 'Client Communications', usage: 60, color: 'bg-purple-500' },
              { profession: 'Document Management', usage: 45, color: 'bg-orange-500' },
            ].map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-2">
                  <span>{item.profession}</span>
                  <span className="font-medium">{item.usage}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${item.usage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
