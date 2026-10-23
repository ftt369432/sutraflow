import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Crown, Zap, Bot, Users, Globe, MessageSquare, Phone, Calendar, Mail, Database, Activity, Target, TrendingUp, ArrowUpRight, Shield, X, AlertCircle, CheckCircle, Layers } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/Dialog';
import { useUserStore } from '../stores/userStore';
import { individualPlans, businessPlans, Plan } from '../services/payment/plans';
import { createSubscription } from '../services/payment/stripeService';
import { toast } from 'sonner';

function PlanManagementPage() {
  const navigate = useNavigate();
  const { user, subscription } = useUserStore();
  const [selectedPlanType, setSelectedPlanType] = useState<'individual' | 'business'>('individual');
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('plans');

  const plans = selectedPlanType === 'individual' ? individualPlans : businessPlans;

  const handleSubscribe = async (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    setIsLoading(true);
    try {
      const priceId = isYearly && plan.stripePriceIdYearly 
        ? plan.stripePriceIdYearly 
        : plan.stripePriceId;
      
      await createSubscription({
        priceId,
        successUrl: window.location.origin + '/profile?success=true',
        cancelUrl: window.location.origin + '/plan-management?canceled=true'
      });
      
      toast.success('Redirecting to payment...');
    } catch (error) {
      console.error('Error subscribing to plan:', error);
      toast.error('Failed to start subscription process');
    } finally {
      setIsLoading(false);
    }
  };

  const getPrice = (plan: Plan) => {
    if (plan.price === 0) return 'Free';
    
    if (isYearly) {
      const yearlyPrice = plan.price * 12;
      const discount = plan.discountPercentage || 0;
      const discountedPrice = Math.round((yearlyPrice * (100 - discount)) / 100);
      return `$${discountedPrice / 12}/mo`;
    }
    
    return `$${plan.price}/mo`;
  };

  const getCurrentPlanName = () => {
    if (!subscription) return 'Free Plan';
    
    const planMap: { [key: string]: string } = {
      'free': 'Free Plan',
      'pro': 'Professional Plan',
      'enterprise': 'Enterprise Plan',
      'free-business': 'Free Business Plan',
      'business': 'Business Plan',
      'enterprise-business': 'Enterprise Business Plan',
    };
    
    return planMap[subscription.plan] || subscription.plan;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Profile
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Universal Automation Platform</h1>
                <p className="text-gray-600">Choose the perfect plan for your automation needs</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Crown className="h-3 w-3" />
                Current: {getCurrentPlanName()}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
            <TabsTrigger value="features">Feature Comparison</TabsTrigger>
            <TabsTrigger value="usage">Current Usage</TabsTrigger>
          </TabsList>

          <TabsContent value="plans">
            <div className="space-y-8">
              {/* Plan Type Toggle */}
              <div className="flex justify-center">
                <div className="inline-flex rounded-lg p-1 bg-gray-100">
                  <button
                    className={`px-6 py-3 rounded-md font-medium transition-all ${
                      selectedPlanType === 'individual' 
                        ? 'bg-white shadow-sm text-blue-600' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => setSelectedPlanType('individual')}
                  >
                    <Users className="h-4 w-4 mr-2 inline" />
                    Individual Plans
                  </button>
                  <button
                    className={`px-6 py-3 rounded-md font-medium transition-all ${
                      selectedPlanType === 'business' 
                        ? 'bg-white shadow-sm text-blue-600' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => setSelectedPlanType('business')}
                  >
                    <Globe className="h-4 w-4 mr-2 inline" />
                    Business Plans
                  </button>
                </div>
              </div>

              {/* Billing Period Toggle */}
              <div className="flex justify-center">
                <div className="flex items-center gap-4 p-1 bg-gray-100 rounded-lg">
                  <span className={`px-3 py-2 ${!isYearly ? 'font-semibold text-blue-600' : 'text-gray-600'}`}>
                    Monthly
                  </span>
                  <div
                    onClick={() => setIsYearly(!isYearly)}
                    className="relative inline-flex h-6 w-12 items-center rounded-full cursor-pointer bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isYearly ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </div>
                  <span className={`px-3 py-2 ${isYearly ? 'font-semibold text-blue-600' : 'text-gray-600'}`}>
                    Yearly
                    <Badge className="ml-2 bg-green-100 text-green-800 text-xs">Save 20%</Badge>
                  </span>
                </div>
              </div>

              {/* Plan Cards */}
              <div className="grid lg:grid-cols-3 gap-8">
                {plans.map((plan) => (
                  <Card 
                    key={plan.id}
                    className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                      plan.mostPopular 
                        ? 'border-2 border-blue-500 shadow-lg transform scale-105' 
                        : 'border border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {plan.mostPopular && (
                      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center py-2 text-sm font-semibold">
                        🚀 Most Popular Choice
                      </div>
                    )}
                    
                    <CardHeader className={`pb-4 ${plan.mostPopular ? 'pt-12' : 'pt-6'}`}>
                      <div className="flex items-center gap-3 mb-2">
                        {plan.id === 'free' && <Zap className="h-6 w-6 text-green-500" />}
                        {plan.id === 'pro' && <Bot className="h-6 w-6 text-blue-500" />}
                        {plan.id === 'enterprise' && <Layers className="h-6 w-6 text-purple-500" />}
                        {plan.id === 'nexus' && <Crown className="h-6 w-6 text-yellow-500" />}
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                      </div>
                      <CardDescription className="text-sm">{plan.description}</CardDescription>
                      
                      <div className="mt-4">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold">{getPrice(plan)}</span>
                          {plan.price > 0 && (
                            <span className="text-gray-500">
                              {isYearly ? '/mo billed annually' : '/month'}
                            </span>
                          )}
                        </div>
                        {isYearly && plan.price > 0 && (
                          <p className="text-sm text-green-600 mt-1">
                            Save ${(plan.price * 12 * 0.2).toFixed(0)} per year
                          </p>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Key Features */}
                      <div className="space-y-3">
                        {plan.features.slice(0, 8).map((feature, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </div>
                        ))}
                        
                        {plan.features.length > 8 && (
                          <div className="text-sm text-gray-500 italic">
                            +{plan.features.length - 8} more features...
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t">
                        <Button
                          className={`w-full ${
                            plan.mostPopular 
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700' 
                              : ''
                          }`}
                          onClick={() => handleSubscribe(plan.id)}
                          disabled={isLoading || (subscription?.plan === plan.id)}
                        >
                          {isLoading ? (
                            'Processing...'
                          ) : subscription?.plan === plan.id ? (
                            'Current Plan'
                          ) : plan.price === 0 ? (
                            'Get Started Free'
                          ) : (
                            `Upgrade to ${plan.name}`
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Enterprise Contact */}
              <div className="mt-12 text-center">
                <Card className="max-w-2xl mx-auto bg-gradient-to-r from-gray-50 to-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <Crown className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Need a Custom Solution?</h3>
                    <p className="text-gray-600 mb-4">
                      Contact our enterprise team for custom automation solutions, dedicated support, 
                      and volume pricing for large organizations.
                    </p>
                    <Button variant="outline" onClick={() => window.open('mailto:enterprise@genieflowai.com')}>
                      Contact Enterprise Sales
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="features">
            <div className="space-y-8">
              {/* Feature Comparison Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Universal Automation Platform Features</CardTitle>
                  <CardDescription>
                    Compare features across all subscription tiers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Feature Category</th>
                          <th className="text-center py-3 px-4">Free</th>
                          <th className="text-center py-3 px-4">Professional</th>
                          <th className="text-center py-3 px-4">Enterprise</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {[
                          {
                            category: 'Platform Integrations',
                            free: '0',
                            pro: '3 platforms',
                            enterprise: '15+ platforms'
                          },
                          {
                            category: 'Automation Tasks (Monthly)',
                            free: '50',
                            pro: '1,000',
                            enterprise: 'Unlimited'
                          },
                          {
                            category: 'Active Agents',
                            free: '1',
                            pro: '5',
                            enterprise: '25+'
                          },
                          {
                            category: 'Knowledge Base Storage',
                            free: '1GB',
                            pro: '10GB',
                            enterprise: '100GB+'
                          },
                          {
                            category: 'Google Workspace',
                            free: '❌',
                            pro: '✅',
                            enterprise: '✅ Advanced'
                          },
                          {
                            category: 'Notion Integration',
                            free: '❌',
                            pro: '✅',
                            enterprise: '✅ Advanced'
                          },
                          {
                            category: 'Slack Automation',
                            free: '❌',
                            pro: '✅',
                            enterprise: '✅ Advanced'
                          },
                          {
                            category: 'Salesforce CRM',
                            free: '❌',
                            pro: '❌',
                            enterprise: '✅'
                          },
                          {
                            category: 'Microsoft 365',
                            free: '❌',
                            pro: '❌',
                            enterprise: '✅'
                          },
                          {
                            category: 'Professional Services (Clio, Epic)',
                            free: '❌',
                            pro: '❌',
                            enterprise: '✅'
                          },
                          {
                            category: 'Email Automation',
                            free: '❌',
                            pro: '✅',
                            enterprise: '✅ Advanced'
                          },
                          {
                            category: 'Calendar Management',
                            free: '❌',
                            pro: '✅',
                            enterprise: '✅ Advanced'
                          },
                          {
                            category: 'Document Processing',
                            free: 'Basic',
                            pro: '✅',
                            enterprise: '✅ Advanced'
                          },
                          {
                            category: 'Voice Commands',
                            free: '❌',
                            pro: '❌',
                            enterprise: '✅'
                          },
                          {
                            category: 'Workflow Automation',
                            free: '❌',
                            pro: 'Basic',
                            enterprise: '✅ Advanced'
                          },
                          {
                            category: 'Cross-Platform Sync',
                            free: '❌',
                            pro: 'Limited',
                            enterprise: '✅ Real-time'
                          },
                          {
                            category: 'Enterprise Security',
                            free: '❌',
                            pro: 'Basic',
                            enterprise: '✅ SOC2/HIPAA'
                          },
                          {
                            category: 'Conversational Building',
                            free: '❌',
                            pro: '❌',
                            enterprise: '✅'
                          },
                          {
                            category: 'API Access',
                            free: 'Limited',
                            pro: 'Full',
                            enterprise: 'Full + Webhooks'
                          },
                          {
                            category: 'Support Level',
                            free: 'Community',
                            pro: 'Email',
                            enterprise: 'Priority + Phone'
                          }
                        ].map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{row.category}</td>
                            <td className="py-3 px-4 text-center">{row.free}</td>
                            <td className="py-3 px-4 text-center">{row.pro}</td>
                            <td className="py-3 px-4 text-center">{row.enterprise}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Cross-Profession Capabilities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-green-500" />
                    Cross-Profession Automation
                  </CardTitle>
                  <CardDescription>
                    Build automation for any profession through natural conversation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      {
                        profession: 'Legal Practice',
                        icon: <Shield className="h-6 w-6 text-blue-500" />,
                        capabilities: ['Case management', 'Document review', 'Client communication', 'Compliance tracking']
                      },
                      {
                        profession: 'Healthcare',
                        icon: <Activity className="h-6 w-6 text-red-500" />,
                        capabilities: ['Patient scheduling', 'Records management', 'Follow-up automation', 'Billing support']
                      },
                      {
                        profession: 'Business Consulting',
                        icon: <TrendingUp className="h-6 w-6 text-green-500" />,
                        capabilities: ['Client onboarding', 'Report generation', 'Meeting scheduling', 'Project tracking']
                      },
                      {
                        profession: 'Real Estate',
                        icon: <Target className="h-6 w-6 text-purple-500" />,
                        capabilities: ['Lead management', 'Property tracking', 'Client communications', 'Market analysis']
                      },
                      {
                        profession: 'Education',
                        icon: <Users className="h-6 w-6 text-orange-500" />,
                        capabilities: ['Student management', 'Assignment tracking', 'Parent communication', 'Grading automation']
                      },
                      {
                        profession: 'Finance',
                        icon: <Database className="h-6 w-6 text-indigo-500" />,
                        capabilities: ['Client reporting', 'Data analysis', 'Compliance monitoring', 'Communication automation']
                      }
                    ].map((item, index) => (
                      <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                          {item.icon}
                          <h4 className="font-semibold">{item.profession}</h4>
                        </div>
                        <ul className="space-y-1">
                          {item.capabilities.map((capability, capIndex) => (
                            <li key={capIndex} className="text-sm text-gray-600 flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {capability}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="usage">
            <div className="grid gap-6">
              {/* Current Plan Status */}
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-6 w-6 text-purple-600" />
                    Current Plan Usage
                  </CardTitle>
                  <CardDescription>
                    Monitor your current plan limits and usage statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-4">Plan Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Current Plan:</span>
                          <Badge className="bg-blue-100 text-blue-800">
                            {getCurrentPlanName()}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <Badge className="bg-green-100 text-green-800">
                            {subscription?.status || 'Active'}
                          </Badge>
                        </div>
                        {subscription?.currentPeriodEnd && (
                          <div className="flex justify-between">
                            <span>Next Billing:</span>
                            <span className="font-medium">
                              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-4">Quick Actions</h4>
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          className="w-full justify-start" 
                          onClick={() => setActiveTab('plans')}
                        >
                          <ArrowUpRight className="h-4 w-4 mr-2" />
                          Upgrade Plan
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start" 
                          onClick={() => navigate('/automation')}
                        >
                          <Bot className="h-4 w-4 mr-2" />
                          View Dashboard
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Usage Statistics */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-green-500" />
                      Resource Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Automation Tasks</span>
                        <span>156 / {subscription?.plan === 'free' ? '50' : subscription?.plan === 'pro' ? '1,000' : 'Unlimited'}</span>
                      </div>
                      <Progress value={subscription?.plan === 'free' ? 100 : 15.6} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Active Agents</span>
                        <span>3 / {subscription?.plan === 'free' ? '1' : subscription?.plan === 'pro' ? '5' : '25'}</span>
                      </div>
                      <Progress value={subscription?.plan === 'free' ? 100 : 60} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Storage Used</span>
                        <span>2.4GB / {subscription?.plan === 'free' ? '1GB' : subscription?.plan === 'pro' ? '10GB' : '100GB'}</span>
                      </div>
                      <Progress value={subscription?.plan === 'free' ? 100 : 24} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700">94.7%</div>
                      <p className="text-sm text-gray-600">Success Rate</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-700">16.2h</div>
                      <p className="text-sm text-gray-600">Time Saved Daily</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-700">2,847</div>
                      <p className="text-sm text-gray-600">Tasks This Month</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default PlanManagementPage; 