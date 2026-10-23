// 🚀 Streamlined Agent Creation System
// Clean, efficient patterns for rapid assistant deployment

export interface AgentBlueprint {
  name: string;
  type: string;
  description: string;
  capabilities: string[];
  systemPromptTemplate: string;
  metadata?: {
    tier?: 'base' | 'premium' | 'enterprise';
    category?: string;
    specializations?: string[];
    priceMonthly?: number;
    quickStartPrompts?: string[];
  };
}

// 🎯 AGENT CREATION PATTERNS
export const agentBlueprints: Record<string, AgentBlueprint> = {
  
  // 🎨 CREATIVE AGENTS
  'content-creator': {
    name: 'Content Creator Pro',
    type: 'creative',
    description: 'Complete content creation suite for all platforms',
    capabilities: [
      'content_creation', 'platform_optimization', 'trend_analysis',
      'image_generation', 'voice_audio_creation', 'batch_content_creation',
      'viral_content_strategy', 'monetization_optimization'
    ],
    systemPromptTemplate: `You are a Content Creator Pro, specialized in {NICHE} content for {PLATFORMS}. Your mission: Create viral, engaging content that converts. Always include platform optimization, trending elements, and monetization angles.`,
    metadata: {
      tier: 'premium',
      category: 'creator',
      specializations: ['viral_content', 'multi_platform', 'monetization'],
      priceMonthly: 19.99,
      quickStartPrompts: [
        'Create viral post about [topic]',
        'Plan my weekly content calendar',
        'Generate batch content for [niche]',
        'Optimize for [platform] algorithm'
      ]
    }
  },

  // 💼 BUSINESS AGENTS  
  'business-strategist': {
    name: 'Business Strategy AI',
    type: 'business',
    description: 'Strategic business planning and growth optimization',
    capabilities: [
      'business_analysis', 'market_research', 'competitor_analysis',
      'growth_strategy', 'monetization_planning', 'partnership_development',
      'financial_planning', 'scaling_strategies'
    ],
    systemPromptTemplate: `You are a Business Strategy AI focused on {BUSINESS_TYPE} in {INDUSTRY}. Provide data-driven insights, actionable strategies, and growth-focused recommendations. Always consider scalability and ROI.`,
    metadata: {
      tier: 'premium',
      category: 'business',
      specializations: ['growth_hacking', 'market_analysis', 'strategic_planning'],
      priceMonthly: 39.99,
      quickStartPrompts: [
        'Analyze my business model',
        'Create growth strategy for [timeframe]',
        'Research competitor landscape',
        'Optimize revenue streams'
      ]
    }
  },

  // 🏥 PROFESSIONAL SPECIALISTS
  'legal-expert': {
    name: 'Legal Eagle Pro',
    type: 'legal',
    description: 'Comprehensive legal guidance and compliance assistance',
    capabilities: [
      'legal_analysis', 'contract_review', 'compliance_checking',
      'legal_research', 'document_drafting', 'risk_assessment',
      'intellectual_property', 'business_law'
    ],
    systemPromptTemplate: `You are Legal Eagle Pro, specializing in {LEGAL_AREA}. Provide accurate legal guidance, risk assessments, and compliance advice. Always include disclaimers and recommend professional consultation for complex matters.`,
    metadata: {
      tier: 'premium',
      category: 'professional',
      specializations: ['contract_law', 'business_compliance', 'ip_protection'],
      priceMonthly: 49.99,
      quickStartPrompts: [
        'Review this contract',
        'Check compliance for [activity]',
        'Draft [document type]',
        'Assess legal risks'
      ]
    }
  },

  'medical-advisor': {
    name: 'Medical Insight AI',
    type: 'medical',
    description: 'Medical information and health content verification',
    capabilities: [
      'medical_research', 'health_content_verification', 'symptom_information',
      'medical_terminology', 'wellness_planning', 'health_trend_analysis',
      'content_fact_checking', 'medical_writing'
    ],
    systemPromptTemplate: `You are Medical Insight AI, focused on {MEDICAL_SPECIALTY}. Provide accurate medical information, verify health content, and assist with medical communication. Always include appropriate medical disclaimers.`,
    metadata: {
      tier: 'premium', 
      category: 'professional',
      specializations: ['content_verification', 'medical_writing', 'health_education'],
      priceMonthly: 44.99,
      quickStartPrompts: [
        'Verify health claims in content',
        'Explain medical condition',
        'Create health education content',
        'Review wellness program'
      ]
    }
  },

  // 🎯 SPECIALIZED AGENTS
  'productivity-coach': {
    name: 'Productivity Master',
    type: 'coaching',
    description: 'Personal productivity and efficiency optimization',
    capabilities: [
      'productivity_planning', 'habit_formation', 'time_management',
      'goal_setting', 'workflow_optimization', 'motivation_coaching',
      'efficiency_analysis', 'performance_tracking'
    ],
    systemPromptTemplate: `You are Productivity Master, helping optimize {PRODUCTIVITY_AREA}. Create actionable plans, build sustainable habits, and maximize efficiency. Focus on practical, measurable improvements.`,
    metadata: {
      tier: 'base',
      category: 'coaching',
      specializations: ['time_management', 'habit_building', 'goal_achievement'],
      priceMonthly: 0,
      quickStartPrompts: [
        'Optimize my daily routine',
        'Create productivity system',
        'Build habit for [goal]',
        'Improve time management'
      ]
    }
  },

  // 🛒 E-COMMERCE AGENTS
  'ecommerce-optimizer': {
    name: 'E-commerce Growth AI',
    type: 'ecommerce',
    description: 'Complete e-commerce optimization and growth',
    capabilities: [
      'product_optimization', 'listing_enhancement', 'conversion_optimization',
      'customer_analysis', 'pricing_strategy', 'inventory_management',
      'marketing_automation', 'review_management'
    ],
    systemPromptTemplate: `You are E-commerce Growth AI, optimizing {ECOMMERCE_PLATFORM} for {PRODUCT_TYPE}. Focus on conversions, customer satisfaction, and sustainable growth. Provide data-driven recommendations.`,
    metadata: {
      tier: 'premium',
      category: 'ecommerce',
      specializations: ['amazon_optimization', 'conversion_rates', 'customer_retention'],
      priceMonthly: 29.99,
      quickStartPrompts: [
        'Optimize product listings',
        'Improve conversion rates',
        'Analyze customer feedback',
        'Create pricing strategy'
      ]
    }
  }
};

// 🚀 STREAMLINED CREATION FUNCTIONS
export class StreamlinedAgentCreator {
  
  // One-click agent creation from blueprint
  static createFromBlueprint(
    blueprintKey: string, 
    customizations: {
      niche?: string;
      platforms?: string[];
      industry?: string;
      specialization?: string;
    } = {}
  ): Partial<import('../types/ai').AIAssistant> {
    
    const blueprint = agentBlueprints[blueprintKey];
    if (!blueprint) throw new Error(`Blueprint ${blueprintKey} not found`);
    
    // Customize system prompt with user specifics
    let systemPrompt = blueprint.systemPromptTemplate;
    if (customizations.niche) {
      systemPrompt = systemPrompt.replace('{NICHE}', customizations.niche);
    }
    if (customizations.platforms) {
      systemPrompt = systemPrompt.replace('{PLATFORMS}', customizations.platforms.join(', '));
    }
    if (customizations.industry) {
      systemPrompt = systemPrompt.replace('{INDUSTRY}', customizations.industry);
    }
    
    return {
      name: blueprint.name,
      type: blueprint.type as any,
      description: blueprint.description,
      capabilities: blueprint.capabilities,
      system_prompt: systemPrompt,
      metadata: {
        ...blueprint.metadata,
        customizations,
        createdFrom: blueprintKey,
        createdAt: new Date().toISOString()
      },
      isActive: true
    };
  }

  // Quick creator-focused agent
  static createCreatorAgent(niche: string, platforms: string[]): Partial<import('../types/ai').AIAssistant> {
    return this.createFromBlueprint('content-creator', { niche, platforms });
  }

  // Quick business agent  
  static createBusinessAgent(industry: string, businessType: string): Partial<import('../types/ai').AIAssistant> {
    return this.createFromBlueprint('business-strategist', { industry, specialization: businessType });
  }

  // Quick professional agent
  static createProfessionalAgent(type: 'legal' | 'medical', specialization: string): Partial<import('../types/ai').AIAssistant> {
    const blueprintKey = type === 'legal' ? 'legal-expert' : 'medical-advisor';
    return this.createFromBlueprint(blueprintKey, { specialization });
  }
}

// 🎯 TEMPLATE-BASED QUICK CREATION
export const quickCreateTemplates = {
  
  // Social Media Templates
  'tiktok-creator': () => StreamlinedAgentCreator.createCreatorAgent('entertainment', ['tiktok']),
  'instagram-influencer': () => StreamlinedAgentCreator.createCreatorAgent('lifestyle', ['instagram']),
  'youtube-educator': () => StreamlinedAgentCreator.createCreatorAgent('education', ['youtube']),
  'multi-platform-creator': () => StreamlinedAgentCreator.createCreatorAgent('general', ['tiktok', 'instagram', 'youtube']),
  
  // Business Templates  
  'startup-advisor': () => StreamlinedAgentCreator.createBusinessAgent('tech', 'startup'),
  'ecommerce-consultant': () => StreamlinedAgentCreator.createFromBlueprint('ecommerce-optimizer', { industry: 'retail' }),
  'marketing-strategist': () => StreamlinedAgentCreator.createBusinessAgent('marketing', 'digital marketing'),
  
  // Professional Templates
  'content-lawyer': () => StreamlinedAgentCreator.createProfessionalAgent('legal', 'content law'),
  'health-content-advisor': () => StreamlinedAgentCreator.createProfessionalAgent('medical', 'health content'),
  'business-legal-advisor': () => StreamlinedAgentCreator.createProfessionalAgent('legal', 'business law'),
};

// 🔄 AGENT UPGRADE SYSTEM
export const agentUpgrades = {
  
  // Upgrade base to premium
  upgradeToPremium: (agentId: string, addons: string[] = []) => ({
    metadata: {
      tier: 'premium' as const,
      addons,
      upgradeDate: new Date().toISOString()
    },
    capabilities: [
      // Add premium capabilities based on agent type
      'advanced_analytics', 'priority_support', 'custom_integrations'
    ]
  }),

  // Add specific addons
  addPremiumAddon: (addon: 'legal_eagle' | 'medical_advisor' | 'business_strategist') => ({
    [`addon_${addon}`]: true,
    [`addon_${addon}_activated`]: new Date().toISOString()
  })
};

export default StreamlinedAgentCreator;