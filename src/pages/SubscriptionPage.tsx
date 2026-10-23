import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building, User, Mail, Zap, ShieldCheck, Users, LifeBuoy, LineChart } from 'lucide-react';
import { createSubscription, getCurrentSubscription } from '../services/payment/stripeService';
import { useUserStore } from '../stores/userStore';
import { SubscriptionPlans } from '../components/subscription/SubscriptionPlans';
import { Button } from '../components/ui/Button';
import { individualPlans, businessPlans, Plan } from '../services/payment/plans';

export function SubscriptionPage() {
  const { user } = useUserStore();
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch current subscription details when the component mounts
    const fetchSubscription = async () => {
      try {
        setIsLoading(true);
        const subscriptionData = await getCurrentSubscription();
        setCurrentSubscription(subscriptionData);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Select the perfect plan to unlock the full potential of GenieFlow AI and streamline your workflow
          </p>
        </header>

        {/* Subscription Plans Component */}
        <SubscriptionPlans />

        {/* Enterprise Section */}
        <div className="mt-20 border border-gray-200 dark:border-gray-800 rounded-xl p-6 md:p-8 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-4">Need a Custom Enterprise Solution?</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We offer tailored solutions for organizations with specific requirements. Get in touch with our sales team to discuss your needs.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-8">
                <div className="flex items-start">
                  <div className="mt-1 mr-3 flex-shrink-0">
                    <ShieldCheck className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">Advanced Security</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Enhanced data protection and compliance</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mt-1 mr-3 flex-shrink-0">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">Team Management</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Complete control over user access and roles</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mt-1 mr-3 flex-shrink-0">
                    <LifeBuoy className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">Dedicated Support</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Priority access to technical expertise</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mt-1 mr-3 flex-shrink-0">
                    <LineChart className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">Advanced Analytics</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Detailed insights into usage patterns</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-auto flex flex-col items-center">
              <Button size="lg" className="mb-3 w-full md:w-auto">
                Contact Sales
              </Button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Or email us at{' '}
                <a href="mailto:enterprise@genieflowai.com" className="text-blue-500 hover:underline">
                  enterprise@genieflowai.com
                </a>
              </span>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          
          <div className="grid gap-6 max-w-3xl mx-auto">
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">Can I switch plans later?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes, you can upgrade or downgrade your plan at any time. Changes to your subscription will be applied immediately, with prorated charges for the remainder of your billing cycle.
              </p>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">Is there a free trial?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                All paid plans include a 7-day free trial. You won't be charged until the trial period ends, and you can cancel anytime before then.
              </p>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We accept all major credit cards, including Visa, Mastercard, and American Express. For Enterprise plans, we also offer invoicing options.
              </p>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">How does the billing work?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                For monthly plans, you'll be billed every month on the date you signed up. For annual plans, you'll be billed once per year. You can view your billing history and upcoming payments in your account settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}