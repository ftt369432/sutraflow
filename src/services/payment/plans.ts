// Types for subscription plans
export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  stripePriceId: string;
  stripePriceIdYearly?: string;
  discountPercentage?: number;
  features: string[];
  mostPopular?: boolean;
}

export interface PlanFeature {
  name: string;
  included: boolean;
  limited?: boolean;
  info?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingPeriod: 'monthly' | 'yearly' | 'forever';
  discountPercentage?: number;
  features: PlanFeature[];
  mostPopular?: boolean;
  buttonText: string;
}

// Common features shared across all plans
const commonFeatures = [
  'Access to AI assistant',
  'Email management',
  'Calendar integration'
];

// Convert plan features for component use
export const convertToComponentFeatures = (features: string[]): PlanFeature[] => {
  const result: PlanFeature[] = [];
  
  // Common features are always included
  commonFeatures.forEach(feature => {
    result.push({ name: feature, included: true });
  });
  
  // Process additional features
  features.forEach(feature => {
    if (feature.startsWith('!')) {
      // Features starting with ! are not included
      result.push({ 
        name: feature.substring(1), 
        included: false 
      });
    } else if (feature.includes('(limited)')) {
      // Features with (limited) text
      const baseName = feature.replace('(limited)', '').trim();
      result.push({ 
        name: baseName, 
        included: true,
        limited: true,
        info: 'This feature has usage limitations'
      });
    } else {
      // Regular included features
      result.push({ name: feature, included: true });
    }
  });
  
  return result;
};

// Individual plans
export const individualPlans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Basic features for personal use',
    price: 0,
    stripePriceId: 'price_free',
    features: [
      'Access to AI assistant',
      'Email management (5 per day)',
      'Basic document analysis',
      '5 AI requests per day',
      '!Universal automation',
      '!Voice commands',
      '!GenieDrive access'
    ]
  },
  {
    id: 'pro',
    name: 'Professional',
    description: 'Advanced features for professionals with basic integrations',
    price: 297,
    stripePriceId: 'price_pro_monthly',
    stripePriceIdYearly: 'price_pro_yearly',
    discountPercentage: 20,
    mostPopular: true,
    features: [
      'Access to AI assistant',
      'Unlimited email management',
      'Advanced document analysis',
      'Unlimited AI requests',
      'Universal calendar automation',
      'Style learning system',
      'Basic automation dashboard',
      'Priority support',
      'GenieDrive with 10GB storage',
      'AI-powered file analysis',
      'Basic integrations (3 platforms)',
      'Google Workspace integration',
      'Notion synchronization',
      'Slack notifications',
      '!Voice commands',
      '!Enterprise integrations',
      '!Advanced workflow automation'
    ]
  },
  {
    id: 'enterprise',
    name: 'Business',
    description: 'Complete automation platform with advanced integrations',
    price: 997,
    stripePriceId: 'price_enterprise_monthly',
    stripePriceIdYearly: 'price_enterprise_yearly',
    discountPercentage: 20,
    features: [
      'Everything in Professional',
      'Universal meeting automation',
      'Advanced auto-response system',
      'Task completion automation',
      'Basic voice commands',
      'Temporal scheduling framework',
      'Enhanced automation dashboard',
      'Advanced analytics & audit logs',
      'Custom AI model training',
      'Dedicated account manager',
      'GenieDrive with 100GB storage',
      'Advanced swarm coordination',
      'API access for integrations',
      'Advanced integrations (10 platforms)',
      'Salesforce CRM automation',
      'Microsoft 365 integration',
      'HubSpot marketing automation',
      'Workflow automation between platforms',
      'Real-time data synchronization',
      '!Continuous voice interaction',
      '!Enterprise security compliance',
      '!Professional services integrations'
    ]
  },
  {
    id: 'nexus',
    name: 'Enterprise',
    description: 'Full enterprise platform with voice control and professional integrations',
    price: 2997,
    stripePriceId: 'price_nexus_monthly',
    stripePriceIdYearly: 'price_nexus_yearly',
    discountPercentage: 20,
    features: [
      'Everything in Business',
      'Continuous voice interaction',
      'Wake word detection ("Hey Genie")',
      'Conversational data querying',
      'Predictive intelligence',
      'Ambient awareness',
      'Advanced swarm orchestration',
      'Voice-coordinated automation',
      'Natural language data visualization',
      'Proactive assistance & suggestions',
      'GenieDrive with unlimited storage',
      'White-glove onboarding & training',
      'Custom integration development',
      'All platform integrations (15+ platforms)',
      'Clio Legal practice management',
      'Epic EMR medical records',
      'Enterprise security compliance (SOC2, HIPAA)',
      'Advanced workflow orchestration',
      'Cross-platform data synchronization',
      'Custom API development',
      'Dedicated integration engineer',
      '24/7 enterprise support',
      'On-premise deployment options'
    ]
  }
];

// Business plans
export const businessPlans: Plan[] = [
  {
    id: 'free-business',
    name: 'Free Team',
    description: 'Basic features for small teams',
    price: 0,
    stripePriceId: 'price_free_business',
    features: [
      'Access to AI assistant',
      'Email management (5 per day)',
      'Basic document analysis',
      '5 AI requests per day',
      'Up to 3 team members',
      '!Universal automation',
      '!Voice commands',
      '!GenieDrive access'
    ]
  },
  {
    id: 'business',
    name: 'Business Team',
    description: 'Advanced automation for growing teams with integrations',
    price: 597,
    stripePriceId: 'price_business_monthly',
    stripePriceIdYearly: 'price_business_yearly',
    discountPercentage: 20,
    mostPopular: true,
    features: [
      'Everything in Professional (per user)',
      'Team collaboration',
      'Shared automation workflows',
      'Team-wide universal automation',
      'Collaborative knowledge bases',
      'Team analytics dashboard',
      'Up to 10 team members',
      'GenieDrive with 50GB per user',
      'Team file permissions',
      'Centralized billing & management',
      'Team integrations (5 platforms per user)',
      'Shared Google Workspace access',
      'Team Notion workspaces',
      'Slack team automation',
      'Basic team workflow automation',
      '!Advanced voice features',
      '!Enterprise-level automation',
      '!Professional services integrations'
    ]
  },
  {
    id: 'enterprise-business',
    name: 'Enterprise Team',
    description: 'Complete automation platform for organizations with full integrations',
    price: 1497,
    stripePriceId: 'price_enterprise_business_monthly',
    stripePriceIdYearly: 'price_enterprise_business_yearly',
    discountPercentage: 20,
    features: [
      'Everything in Business (per user)',
      'Unlimited team members',
      'Advanced team coordination',
      'Shared automation workflows',
      'Team-wide voice commands',
      'Centralized automation management',
      'Advanced security & compliance',
      'Custom integration development',
      'GenieDrive with 500GB per user',
      'Enterprise admin controls',
      'Dedicated customer success manager',
      'Custom SLA & support',
      'Full enterprise integrations (15+ platforms)',
      'Team Salesforce automation',
      'Microsoft 365 organization-wide',
      'HubSpot marketing automation',
      'Cross-platform workflow automation',
      'Enterprise security compliance',
      'Team-based professional services integrations',
      '!Full voice interaction',
      '!Predictive intelligence'
    ]
  },
  {
    id: 'nexus-business',
    name: 'Nexus Enterprise',
    description: 'Full voice-controlled AI platform for entire organization',
    price: 4997,
    stripePriceId: 'price_nexus_business_monthly',
    stripePriceIdYearly: 'price_nexus_business_yearly',
    discountPercentage: 20,
    features: [
      'Everything in Enterprise Team (per user)',
      'Organization-wide voice activation',
      'Shared ambient awareness',
      'Team predictive intelligence',
      'Advanced swarm coordination across teams',
      'Custom wake words per department',
      'Executive AI briefings & insights',
      'Advanced data visualization for teams',
      'Unlimited storage per user',
      'White-glove enterprise onboarding',
      'Custom AI model development',
      'Priority feature development',
      'Executive advisory sessions',
      'All professional services integrations',
      'Custom API development per department',
      'Dedicated integration engineering team',
      'SOC2, HIPAA, GDPR compliance',
      'On-premise deployment options',
      '24/7 enterprise support with SLA',
      'Custom voice model training',
      'Industry-specific automation workflows'
    ]
  }
];

// Get plan by ID
export const getPlanById = (planId: string): Plan | undefined => {
  return [...individualPlans, ...businessPlans].find(plan => plan.id === planId);
};

// Get plan by Stripe price ID
export const getPlanByPriceId = (priceId: string): Plan | undefined => {
  return [...individualPlans, ...businessPlans].find(
    plan => plan.stripePriceId === priceId || plan.stripePriceIdYearly === priceId
  );
};

// Calculate yearly price
export const getYearlyPrice = (plan: Plan): number => {
  if (plan.price === 0) return 0;
  const monthlyPrice = plan.price;
  const discount = plan.discountPercentage || 0;
  return Math.round((monthlyPrice * 12 * (100 - discount)) / 100);
};

// Convert a Plan to a SubscriptionPlan for the component
export const toSubscriptionPlan = (
  plan: Plan, 
  isYearly: boolean = false
): SubscriptionPlan => {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    price: isYearly ? getYearlyPrice(plan) / 12 : plan.price,
    billingPeriod: isYearly ? 'yearly' : 'monthly',
    discountPercentage: isYearly ? plan.discountPercentage : undefined,
    features: convertToComponentFeatures(plan.features),
    mostPopular: plan.mostPopular,
    buttonText: plan.price === 0 ? 'Get Started' : 
                plan.id.includes('enterprise') ? 'Contact Sales' : 
                'Subscribe Now'
  };
};