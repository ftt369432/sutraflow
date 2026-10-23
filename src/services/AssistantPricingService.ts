// 💰 Assistant Pricing & Tier Management
// Handles premium subscriptions and add-on pricing

export interface AssistantTier {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  addOnPrice: number; // 30% discount when added to existing premium
  category: 'creator' | 'professional' | 'coaching' | 'business';
  features: string[];
  specializations: string[];
  popular?: boolean;
  limitations?: string[];
}

export interface UserSubscription {
  userId: string;
  primaryAssistant: string | null; // Main premium assistant
  addOnAssistants: string[]; // Additional assistants at discount
  totalMonthlyPrice: number;
  nextBillingDate: Date;
  status: 'free' | 'premium' | 'cancelled';
}

/**
 * 💰 Pricing & Tier Management System
 */
export class AssistantPricingService {
  private static instance: AssistantPricingService;
  
  // TIER DEFINITIONS
  private readonly ASSISTANT_TIERS: Record<string, AssistantTier> = {
    'Creative Muse': {
      id: 'creative-muse',
      name: 'Creative Muse',
      description: 'ALL-IN-ONE Creator Powerhouse: Replace ElevenLabs + ChatGPT + Midjourney',
      basePrice: 19.99,
      addOnPrice: 13.99,
      category: 'creator',
      features: [
        'Viral content generation',
        'Image creation prompts', 
        'Voice script writing',
        'Multi-platform optimization',
        'Trend integration',
        'Batch content creation',
        'Monetization strategies'
      ],
      specializations: ['TikTok', 'Instagram', 'YouTube', 'Amazon'],
      popular: true
    },
    
    'Legal Eagle': {
      id: 'legal-eagle',
      name: 'Legal Eagle',
      description: 'Professional legal research and document drafting assistant',
      basePrice: 49.99,
      addOnPrice: 34.99,
      category: 'professional',
      features: [
        'Contract review & drafting',
        'Legal research & analysis', 
        'Compliance checking',
        'Document templates',
        'Case law search',
        'Risk assessment',
        'Business law guidance'
      ],
      specializations: ['Business Law', 'Contracts', 'Compliance', 'IP Law']
    },
    
    'MediBot': {
      id: 'medibot',
      name: 'MediBot', 
      description: 'Advanced medical research and health content verification',
      basePrice: 44.99,
      addOnPrice: 31.49,
      category: 'professional',
      features: [
        'Medical research access',
        'Health content verification',
        'Clinical data analysis',
        'Medical writing assistance',
        'Drug interaction checking',
        'Literature review',
        'Medical education content'
      ],
      specializations: ['Medical Research', 'Health Content', 'Clinical Data', 'Medical Writing']
    },
    
    'Daily Life Coach': {
      id: 'daily-life-coach',
      name: 'Daily Life Coach',
      description: 'Advanced personal development and productivity optimization',
      basePrice: 24.99,
      addOnPrice: 17.49,
      category: 'coaching',
      features: [
        'Advanced goal planning',
        'Habit tracking & analytics',
        'Productivity optimization',
        'Life balance coaching',
        'Progress monitoring',
        'Personalized strategies',
        'Accountability systems'
      ],
      specializations: ['Productivity', 'Habits', 'Goals', 'Life Balance']
    }
  };

  // FREE TIER LIMITATIONS
  private readonly FREE_TIER_LIMITS = {
    dailyMessages: 20,
    assistants: 1, // Basic Life Coach only
    features: ['basic_chat', 'simple_goal_setting', 'basic_motivation'],
    limitations: [
      'Limited to 20 messages per day',
      'Basic Life Coach assistant only',
      'No advanced features',
      'No voice responses',
      'No file uploads',
      'No premium templates'
    ]
  };

  public static getInstance(): AssistantPricingService {
    if (!AssistantPricingService.instance) {
      AssistantPricingService.instance = new AssistantPricingService();
    }
    return AssistantPricingService.instance;
  }

  /**
   * 🎯 Get Pricing Plans for Display
   */
  public getPricingPlans(): {
    free: any;
    premium: AssistantTier[];
    bundles: any[];
  } {
    return {
      free: {
        name: 'Free Starter',
        price: 0,
        features: this.FREE_TIER_LIMITS.features,
        limitations: this.FREE_TIER_LIMITS.limitations,
        assistants: ['Basic Life Coach'],
        dailyLimit: this.FREE_TIER_LIMITS.dailyMessages
      },
      premium: Object.values(this.ASSISTANT_TIERS),
      bundles: [
        {
          name: 'Creator Pro Bundle',
          assistants: ['Creative Muse', 'Daily Life Coach'],
          originalPrice: 44.98,
          bundlePrice: 34.99,
          savings: 9.99,
          features: 'All creator tools + productivity coaching'
        },
        {
          name: 'Professional Suite',
          assistants: ['Legal Eagle', 'MediBot'],
          originalPrice: 94.98, 
          bundlePrice: 74.99,
          savings: 19.99,
          features: 'Complete professional assistant suite'
        },
        {
          name: 'Ultimate Package',
          assistants: ['Creative Muse', 'Legal Eagle', 'MediBot', 'Daily Life Coach'],
          originalPrice: 139.96,
          bundlePrice: 99.99,
          savings: 39.97,
          features: 'All assistants + premium features',
          popular: true
        }
      ]
    };
  }

  /**
   * 💰 Calculate Subscription Price
   */
  public calculateSubscriptionPrice(
    primaryAssistant: string,
    addOnAssistants: string[] = []
  ): {
    basePrice: number;
    addOnPrice: number;
    totalPrice: number;
    savings: number;
    breakdown: string[];
  } {
    const primary = this.ASSISTANT_TIERS[primaryAssistant];
    if (!primary) {
      throw new Error(`Assistant ${primaryAssistant} not found`);
    }

    const basePrice = primary.basePrice;
    let addOnPrice = 0;
    let savings = 0;
    const breakdown = [`${primary.name}: $${primary.basePrice}/mo`];

    addOnAssistants.forEach(assistantName => {
      const addon = this.ASSISTANT_TIERS[assistantName];
      if (addon) {
        addOnPrice += addon.addOnPrice;
        savings += (addon.basePrice - addon.addOnPrice);
        breakdown.push(`${addon.name} (Add-on): $${addon.addOnPrice}/mo`);
      }
    });

    return {
      basePrice,
      addOnPrice,
      totalPrice: basePrice + addOnPrice,
      savings,
      breakdown
    };
  }

  /**
   * 🎁 Get Upgrade Offers for Free Users
   */
  public getUpgradeOffers(): {
    primary: AssistantTier;
    popular: AssistantTier[];
    savings: string;
  } {
    const creativeMuse = this.ASSISTANT_TIERS['Creative Muse'];
    const popular = Object.values(this.ASSISTANT_TIERS)
      .filter(tier => tier.popular)
      .slice(0, 3);

    return {
      primary: creativeMuse,
      popular,
      savings: 'Save up to 30% with add-on assistants'
    };
  }

  /**
   * 🔄 Get Add-on Recommendations
   */
  public getAddOnRecommendations(primaryAssistant: string): {
    recommended: AssistantTier[];
    bundles: any[];
  } {
    const recommendations: Record<string, string[]> = {
      'Creative Muse': ['Daily Life Coach', 'Legal Eagle'],
      'Legal Eagle': ['MediBot', 'Daily Life Coach'],
      'MediBot': ['Legal Eagle', 'Daily Life Coach'],
      'Daily Life Coach': ['Creative Muse', 'Legal Eagle']
    };

    const recommendedNames = recommendations[primaryAssistant] || [];
    const recommended = recommendedNames
      .map(name => this.ASSISTANT_TIERS[name])
      .filter(Boolean);

    const bundles = this.getPricingPlans().bundles
      .filter(bundle => bundle.assistants.includes(primaryAssistant));

    return { recommended, bundles };
  }

  /**
   * ✅ Validate Subscription Access
   */
  public validateAccess(
    userSubscription: UserSubscription,
    requestedAssistant: string
  ): {
    allowed: boolean;
    reason?: string;
    upgradeRequired?: boolean;
  } {
    // Free tier access
    if (userSubscription.status === 'free') {
      if (requestedAssistant === 'Life Coach') {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'Premium assistant requires subscription',
        upgradeRequired: true
      };
    }

    // Premium access
    if (userSubscription.primaryAssistant === requestedAssistant) {
      return { allowed: true };
    }

    if (userSubscription.addOnAssistants.includes(requestedAssistant)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'Assistant not included in your subscription',
      upgradeRequired: true
    };
  }

  /**
   * 📊 Get Feature Comparison
   */
  public getFeatureComparison(): {
    free: string[];
    premium: string[];
    enterprise: string[];
  } {
    return {
      free: [
        '20 messages per day',
        'Basic Life Coach',
        'Simple goal setting',
        'Basic motivation'
      ],
      premium: [
        'Unlimited messages',
        'Choose 1 premium assistant',
        'Add more at 30% discount',
        'Advanced features',
        'Voice responses',
        'File uploads',
        'Premium templates'
      ],
      enterprise: [
        'Everything in Premium',
        'All assistants included',
        'Custom assistant creation',
        'Priority support',
        'Team management',
        'Analytics dashboard'
      ]
    };
  }

  /**
   * 🎯 Get Assistant by Category
   */
  public getAssistantsByCategory(category: string): AssistantTier[] {
    return Object.values(this.ASSISTANT_TIERS)
      .filter(tier => tier.category === category);
  }

  /**
   * ⭐ Get Most Popular Assistants
   */
  public getPopularAssistants(): AssistantTier[] {
    return Object.values(this.ASSISTANT_TIERS)
      .filter(tier => tier.popular)
      .sort((a, b) => a.basePrice - b.basePrice);
  }
}

export default AssistantPricingService;