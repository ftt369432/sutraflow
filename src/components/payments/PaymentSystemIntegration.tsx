// Payment System Integration - Stripe + Marketplace Revenue Split
// Complete payment processing for professional subscriptions and creator marketplace

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { CreditCard, DollarSign, Users, TrendingUp, Check } from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!);

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  stripePriceId: string;
  popular?: boolean;
  description: string;
}

export interface CreatorRevenue {
  total_revenue: number;
  creator_share: number;
  platform_fee: number;
  pending_payout: number;
  last_payout_date: string;
  subscription_count: number;
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 47,
    interval: 'month',
    stripePriceId: 'price_basic_monthly',
    description: 'Essential voice commands and templates',
    features: [
      '100 voice commands/month',
      'Basic template library',
      'Email support',
      'Single user license'
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 97,
    interval: 'month',
    stripePriceId: 'price_professional_monthly',
    description: 'Full platform access with marketplace',
    popular: true,
    features: [
      'Unlimited voice commands',
      'Complete template library',
      'Creator marketplace access',
      'Priority support',
      'Custom template creation',
      'AI Drive integration'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 197,
    interval: 'month',
    stripePriceId: 'price_premium_monthly',
    description: 'Advanced workflows and team features',
    features: [
      'Everything in Professional',
      'Multi-agent workflows',
      'Custom AI training',
      'API access',
      'White-label options',
      'Team collaboration (up to 5 users)'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 997,
    interval: 'month',
    stripePriceId: 'price_enterprise_monthly',
    description: 'Complete business automation solution',
    features: [
      'Everything in Premium',
      'Unlimited users',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantees',
      'On-premise deployment option',
      'Custom development included'
    ]
  }
];

// Payment Form Component
const PaymentForm: React.FC<{
  plan: SubscriptionPlan;
  onSuccess: (subscription: any) => void;
  onError: (error: string) => void;
}> = ({ plan, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    // Create payment intent when component mounts
    createPaymentIntent();
  }, [plan.id]);

  const createPaymentIntent = async () => {
    try {
      const response = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          price_id: plan.stripePriceId,
          customer_email: user?.email
        })
      });

      const { client_secret } = await response.json();
      setClientSecret(client_secret);
    } catch (error) {
      onError('Failed to initialize payment');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)!,
        billing_details: {
          email: user?.email,
        },
      },
    });

    if (error) {
      onError(error.message || 'Payment failed');
    } else if (paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">{plan.name} Plan</h4>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
          <span className="text-gray-600">/{plan.interval}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Information
          </label>
          <div className="p-3 border border-gray-300 rounded-md bg-white">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!stripe || loading}
          className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              <span>Subscribe to {plan.name}</span>
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Your subscription will auto-renew monthly. Cancel anytime from your account settings.
      </p>
    </form>
  );
};

// Subscription Plans Display
export const SubscriptionPlans: React.FC<{
  onSelectPlan: (plan: SubscriptionPlan) => void;
}> = ({ onSelectPlan }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {SUBSCRIPTION_PLANS.map((plan) => (
        <div
          key={plan.id}
          className={`relative bg-white rounded-lg shadow-sm border-2 transition-all duration-200 hover:shadow-md ${
            plan.popular ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
          }`}
        >
          {plan.popular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                Most Popular
              </span>
            </div>
          )}

          <div className="p-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
            </div>

            <div className="text-center mb-6">
              <div className="flex items-baseline justify-center space-x-2">
                <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                <span className="text-gray-600">/{plan.interval}</span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => onSelectPlan(plan)}
              className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
                plan.popular
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              Choose {plan.name}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Creator Revenue Dashboard
export const CreatorRevenueDashboard: React.FC = () => {
  const { user } = useAuth();
  const [revenue, setRevenue] = useState<CreatorRevenue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRevenueData();
  }, [user]);

  const loadRevenueData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('creator_earnings')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate totals
      const totalRevenue = data?.reduce((sum, earning) => sum + earning.amount, 0) || 0;
      const creatorShare = totalRevenue * 0.7;
      const platformFee = totalRevenue * 0.3;
      const pendingPayout = data?.filter(e => e.payout_status === 'pending')
        .reduce((sum, earning) => sum + (earning.amount * 0.7), 0) || 0;

      setRevenue({
        total_revenue: totalRevenue,
        creator_share: creatorShare,
        platform_fee: platformFee,
        pending_payout: pendingPayout,
        last_payout_date: data?.[0]?.payout_date || '',
        subscription_count: data?.length || 0
      });
    } catch (error) {
      console.error('Error loading revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-32 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Revenue Dashboard</h2>
      
      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${revenue?.total_revenue.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Your Share (70%)</p>
              <p className="text-2xl font-bold text-gray-900">
                ${revenue?.creator_share.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Subscribers</p>
              <p className="text-2xl font-bold text-gray-900">
                {revenue?.subscription_count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Payout</p>
              <p className="text-2xl font-bold text-gray-900">
                ${revenue?.pending_payout.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payout Information */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payout Information</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Payout Schedule:</span>
            <span className="font-medium text-gray-900">Monthly (Net 15)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Next Payout Date:</span>
            <span className="font-medium text-gray-900">
              {new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Minimum Payout:</span>
            <span className="font-medium text-gray-900">$50</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Payment Integration Component
export const PaymentSystemIntegration: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const handlePlanSelection = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = (paymentIntent: any) => {
    alert('🎉 Subscription activated successfully!');
    setShowPaymentForm(false);
    setSelectedPlan(null);
  };

  const handlePaymentError = (error: string) => {
    alert(`❌ Payment failed: ${error}`);
  };

  return (
    <Elements stripe={stripePromise}>
      <div className="max-w-7xl mx-auto p-6">
        {!showPaymentForm ? (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Choose Your Plan
              </h1>
              <p className="text-lg text-gray-600">
                Unlock the power of voice-powered professional automation
              </p>
            </div>
            
            <SubscriptionPlans onSelectPlan={handlePlanSelection} />
            
            <div className="text-center">
              <p className="text-sm text-gray-500">
                All plans include 7-day free trial • Cancel anytime • No setup fees
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            <div className="mb-6">
              <button
                onClick={() => setShowPaymentForm(false)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                ← Back to plans
              </button>
            </div>
            
            {selectedPlan && (
              <PaymentForm
                plan={selectedPlan}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            )}
          </div>
        )}
      </div>
    </Elements>
  );
};

export default PaymentSystemIntegration;