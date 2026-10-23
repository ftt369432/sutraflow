import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import { Button } from '../ui/Button';
import { individualPlans, businessPlans, Plan } from '../../services/payment/plans';
import { createSubscription } from '../../services/payment/stripeService';

export function SubscriptionPlans() {
  const [selectedPlanType, setSelectedPlanType] = useState<'individual' | 'business'>('individual');
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, subscription } = useUserStore();

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
        cancelUrl: window.location.origin + '/subscription?canceled=true'
      });
    } catch (error) {
      console.error('Error subscribing to plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate yearly price with discount
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8 text-center">Choose Your Plan</h1>
      
      {/* Plan type toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-md p-1 bg-gray-100">
          <button
            className={`px-4 py-2 rounded-md ${
              selectedPlanType === 'individual' ? 'bg-white shadow' : ''
            }`}
            onClick={() => setSelectedPlanType('individual')}
          >
            Individual
          </button>
          <button
            className={`px-4 py-2 rounded-md ${
              selectedPlanType === 'business' ? 'bg-white shadow' : ''
            }`}
            onClick={() => setSelectedPlanType('business')}
          >
            Business
          </button>
        </div>
      </div>
      
      {/* Billing period toggle */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-3">
          <span className={`${!isYearly ? 'font-bold' : ''}`}>Monthly</span>
          <div
            onClick={() => setIsYearly(!isYearly)}
            className="relative inline-flex h-6 w-11 items-center rounded-full cursor-pointer bg-gray-200"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                isYearly ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </div>
          <span className={`${isYearly ? 'font-bold' : ''}`}>
            Yearly <span className="text-sm text-green-600">(Save 20%)</span>
          </span>
        </div>
      </div>
      
      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={`border rounded-lg p-6 ${
              plan.mostPopular ? 'border-blue-500 shadow-lg relative' : 'border-gray-200'
            }`}
          >
            {plan.mostPopular && (
              <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 bg-blue-500 text-white px-3 py-1 rounded-md text-xs font-bold">
                Most Popular
              </div>
            )}
            <h3 className="text-xl font-bold">{plan.name}</h3>
            <p className="text-gray-600 mb-4">{plan.description}</p>
            <div className="mb-4">
              <span className="text-3xl font-bold">{getPrice(plan)}</span>
              {plan.price > 0 && !isYearly && (
                <span className="text-gray-500 ml-1">per month</span>
              )}
              {plan.price > 0 && isYearly && (
                <span className="text-gray-500 ml-1">billed annually</span>
              )}
            </div>
            
            <div className="space-y-2 mb-6">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            
            <Button
              className="w-full"
              onClick={() => handleSubscribe(plan.id)}
              disabled={isLoading || (subscription?.plan === plan.id)}
            >
              {subscription?.plan === plan.id 
                ? 'Current Plan' 
                : plan.price === 0 
                  ? 'Get Started' 
                  : 'Subscribe Now'}
            </Button>
          </div>
        ))}
      </div>
      
      <div className="text-center mt-12 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Need a custom solution?</h2>
        <p className="mb-4">
          For larger teams or specific requirements, we offer custom enterprise solutions.
          Contact our sales team to learn more.
        </p>
        <Button variant="outline">Contact Sales</Button>
      </div>
    </div>
  );
} 