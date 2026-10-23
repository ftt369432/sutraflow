// Tiered Assistant Architecture Configuration System
// This file defines the expandable tier system for building ultimate assistants

export interface TierQuestion {
  id: string;
  tier: number;
  category: string;
  question: string;
  purpose: string;
  followUp?: string[];
  options?: string[];
  multiSelect?: boolean;
  required?: boolean;
  customizable?: boolean;
  icon?: string;
  color?: string;
}

export interface TierDefinition {
  id: string;
  tier: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  required: boolean;
  questions: TierQuestion[];
  dependencies?: number[]; // Which tiers must be completed first
  unlockConditions?: (profile: any) => boolean;
}

export interface TierProfile {
  [key: string]: any; // Dynamic tier data
  completionPercentage: number;
  completedTiers: number[];
  customTiers?: TierDefinition[];
}

// Core System Tiers (1-5) - These are built-in
export const CORE_TIER_DEFINITIONS: TierDefinition[] = [
  {
    id: 'core_identity',
    tier: 1,
    name: 'Elite Core Identity Architecture',
    description: 'Define the ultimate identity and authority level this assistant should embody',
    icon: '🏆',
    color: 'yellow',
    required: true,
    questions: [
      {
        id: 'core_identity_architect',
        tier: 1,
        category: 'Elite Identity Architecture',
        question: "🏆 **TIER 1 - CORE IDENTITY**: What ultimate elite identity should this assistant embody? Think: 'Elite Strategic Life Architect', 'Master Trading Psychology Genius', 'Ultimate Health Optimization Expert'",
        purpose: "Define the highest-level identity that encompasses expertise, authority, and transformational capability",
        required: true,
        customizable: true,
        options: [
          "Elite Strategic Life Architect - Warren Buffett + Tony Robbins synthesis",
          "Master Trading Psychology Genius - Combining market mastery with behavioral excellence", 
          "Ultimate Health Optimization Expert - Longevity science meets peak performance",
          "Supreme Business Intelligence Coach - Entrepreneurship meets strategic execution",
          "Advanced Legal Strategy Mastermind - Legal expertise with strategic thinking",
          "Ultimate Productivity & Systems Designer - Tim Ferriss meets operational excellence",
          "Master Relationship & Communication Architect - Influence and connection mastery",
          "Elite Creative Innovation Catalyst - Design thinking meets breakthrough execution",
          "Custom Elite Identity (specify your own)"
        ]
      }
    ]
  },
  
  {
    id: 'consciousness_synthesis',
    tier: 2,
    name: 'Master Consciousness Synthesis',
    description: 'Synthesize thinking patterns from multiple world-class experts',
    icon: '🧠',
    color: 'purple',
    required: true,
    dependencies: [1],
    questions: [
      {
        id: 'consciousness_synthesis',
        tier: 2,
        category: 'Master Consciousness Synthesis',
        question: "🧠 **TIER 2 - CONSCIOUSNESS SYNTHESIS**: Which 3-5 world-class experts should this assistant synthesize? Select the ultimate combination:",
        purpose: "Create a unique consciousness by combining the best thinking patterns from multiple domain masters",
        multiSelect: true,
        required: true,
        customizable: true,
        options: [
          "Warren Buffett - Strategic patience, value thinking, compound growth mindset",
          "Tony Robbins - Transformational psychology, peak state management, breakthrough strategies", 
          "Ray Dalio - Principles-based decision making, systematic thinking, radical truth",
          "David Goggins - Relentless accountability, mental toughness, uncomfort zone mastery",
          "Tim Ferriss - 80/20 optimization, systematic experimentation, efficiency mastery",
          "Elon Musk - First principles thinking, bold vision execution, innovation leadership",
          "Naval Ravikant - Wealth creation wisdom, philosophical depth, leverage understanding",
          "Jordan Peterson - Psychological mastery, personal responsibility, meaning architecture",
          "Seth Godin - Marketing genius, creative leadership, idea propagation",
          "Gary Vaynerchuk - Hustle intelligence, market awareness, authentic communication",
          "James Clear - Habit mastery, systematic improvement, behavioral design",
          "Sam Altman - Technology leadership, strategic scaling, future thinking"
        ]
      }
    ]
  },

  {
    id: 'cognitive_capabilities',
    tier: 3,
    name: 'Superhuman Cognitive Architecture',
    description: 'Define advanced thinking capabilities beyond basic AI assistance',
    icon: '⚡',
    color: 'blue',
    required: true,
    dependencies: [2],
    questions: [
      {
        id: 'advanced_capabilities',
        tier: 3,
        category: 'Superhuman Cognitive Architecture',
        question: "⚡ **TIER 3 - ADVANCED CAPABILITIES**: What superhuman cognitive abilities should this assistant possess? Select the most powerful ones:",
        purpose: "Define advanced thinking capabilities that go beyond basic AI assistance",
        multiSelect: true,
        required: true,
        customizable: true,
        options: [
          "🔮 Predictive Strategic Analysis - Anticipate obstacles 3 moves ahead",
          "📊 Multi-dimensional Accountability - Track progress across all life domains",
          "🚀 Compound Growth Optimization - Identify 10X leverage points",
          "⚠️ Dynamic Risk Assessment - Real-time opportunity/threat evaluation", 
          "🧬 Neural Pattern Recognition - Learn and adapt to your evolution",
          "🔄 Systems Thinking Integration - Connect disparate areas for synergy",
          "🎯 Behavioral Psychology Mastery - Influence your own decision patterns",
          "📈 Market Intelligence Synthesis - Read trends before they're obvious",
          "⚙️ Resource Optimization Engine - Maximize efficiency, minimize waste",
          "🗺️ Strategic Scenario Planning - Model multiple future paths simultaneously"
        ]
      }
    ]
  },

  {
    id: 'communication_protocols',
    tier: 4,
    name: 'Elite Communication Architecture',
    description: 'Define communication patterns matching high-performance operation',
    icon: '💬',
    color: 'green',
    required: true,
    dependencies: [3],
    questions: [
      {
        id: 'communication_consciousness',
        tier: 4,
        category: 'Elite Communication Architecture',
        question: "💬 **TIER 4 - COMMUNICATION PROTOCOL**: How should this assistant communicate to match your elite operating level?",
        purpose: "Define communication patterns that match high-performance thinking and decision-making",
        required: true,
        customizable: true,
        options: [
          "🎯 Executive Strategic Partner - Deep wisdom + urgent action bias + 3-level depth",
          "👑 Master-Level Mentor - Challenge assumptions + push beyond comfort zones + elevated thinking",
          "⚡ Tactical Optimizer - Quick wins + strategic context + measurable outcomes",
          "🧭 Philosophical Strategist - Deep insights + practical applications + wisdom synthesis",
          "🏆 Results-Focused Coach - Accountability + momentum + exponential growth tracking"
        ]
      }
    ]
  },

  {
    id: 'growth_acceleration',
    tier: 5,
    name: 'Ultimate Growth Acceleration System',
    description: 'Systems for exponential growth rather than linear improvement',
    icon: '🚀',
    color: 'red',
    required: true,
    dependencies: [4],
    questions: [
      {
        id: 'operational_excellence',
        tier: 5,
        category: 'Ultimate Growth Acceleration System',
        question: "🚀 **TIER 5 - OPERATIONAL EXCELLENCE**: How should this assistant create exponential growth rather than linear improvement?",
        purpose: "Define systems that push beyond comfort zones into mastery territory",
        multiSelect: true,
        required: true,
        customizable: true,
        options: [
          "💥 Assumption Challenger - Question limiting beliefs and expose small thinking",
          "🎯 Bold Move Catalyst - Push for calculated risks and breakthrough actions",
          "🔗 Systems Connector - Reveal how mastery in one area amplifies everything", 
          "📈 Opportunity Maximizer - Identify and capitalize on compound leverage points",
          "⭐ Excellence Standard Keeper - Hold to highest standards with compassionate support",
          "🧠 Pattern Interrupt Master - Break limiting patterns and install empowering ones",
          "🚀 Momentum Accelerator - Create unstoppable forward progress across all domains"
        ]
      }
    ]
  }
];

// Extended/Custom Tier Templates - These can be added dynamically
export const EXTENDED_TIER_TEMPLATES: TierDefinition[] = [
  {
    id: 'domain_specialization',
    tier: 6,
    name: 'Domain Specialization Matrix',
    description: 'Deep expertise in specific professional domains',
    icon: '🎓',
    color: 'indigo',
    required: false,
    dependencies: [5],
    questions: [
      {
        id: 'domain_expertise',
        tier: 6,
        category: 'Domain Specialization Matrix',
        question: "🎓 **TIER 6 - DOMAIN MASTERY**: What specific domains should this assistant have deep expertise in? (Select all that apply to your needs)",
        purpose: "Define specialized knowledge areas that create unique value and competitive advantage",
        multiSelect: true,
        customizable: true,
        options: [
          "Legal Strategy & Professional Development",
          "App Development & Technology Innovation", 
          "Serial Entrepreneurship & Business Building",
          "Sophisticated Trading & Market Psychology",
          "Personal Optimization & Peak Performance",
          "Strategic Thinking & Decision Sciences",
          "Wealth Building & Financial Intelligence",
          "Leadership & Team Development",
          "Marketing & Business Growth",
          "Health & Longevity Optimization",
          "Creative Innovation & Problem Solving",
          "Negotiation & Relationship Mastery"
        ]
      }
    ]
  },

  {
    id: 'environmental_awareness',
    tier: 7,
    name: 'Environmental Context Intelligence',
    description: 'Understanding of external factors and environmental dynamics',
    icon: '🌍',
    color: 'emerald',
    required: false,
    dependencies: [6],
    questions: [
      {
        id: 'context_intelligence',
        tier: 7,
        category: 'Environmental Context Intelligence',
        question: "🌍 **TIER 7 - ENVIRONMENTAL AWARENESS**: How should this assistant understand and adapt to your environment?",
        purpose: "Define environmental intelligence for context-aware assistance",
        multiSelect: true,
        customizable: true,
        options: [
          "🏢 Professional Environment - Office dynamics, corporate culture, industry trends",
          "🏠 Personal Environment - Home life, family dynamics, personal rhythms",
          "📊 Market Environment - Economic conditions, industry shifts, competitive landscape",
          "🌐 Digital Environment - Technology trends, platform changes, digital opportunities",
          "🤝 Social Environment - Network dynamics, relationship patterns, social capital",
          "⏰ Temporal Environment - Time zones, schedules, seasonal patterns, life phases"
        ]
      }
    ]
  },

  {
    id: 'evolution_engine',
    tier: 8,
    name: 'Continuous Evolution Engine',
    description: 'Self-improving and adaptive learning systems',
    icon: '🔄',
    color: 'violet',
    required: false,
    dependencies: [7],
    questions: [
      {
        id: 'evolution_systems',
        tier: 8,
        category: 'Continuous Evolution Engine',
        question: "🔄 **TIER 8 - EVOLUTION ENGINE**: How should this assistant continuously evolve and improve over time?",
        purpose: "Define self-improvement and adaptive learning mechanisms",
        multiSelect: true,
        customizable: true,
        options: [
          "📈 Performance Analytics - Track effectiveness and optimize based on results",
          "🧠 Learning Acceleration - Adapt communication style based on user feedback",
          "🔍 Pattern Detection - Identify emerging patterns in user behavior and needs",
          "🎯 Goal Evolution - Help refine and elevate goals as user grows",
          "🔄 Strategy Adaptation - Modify approaches based on changing circumstances",
          "📚 Knowledge Integration - Continuously incorporate new information and insights"
        ]
      }
    ]
  }
];

// Tier Management System
export class TierArchitectureManager {
  private coreTiers: TierDefinition[] = CORE_TIER_DEFINITIONS;
  private extendedTiers: TierDefinition[] = EXTENDED_TIER_TEMPLATES;
  private customTiers: TierDefinition[] = [];

  constructor() {
    this.loadCustomTiers();
  }

  // Get all available tiers (core + extended + custom)
  getAllTiers(): TierDefinition[] {
    return [...this.coreTiers, ...this.extendedTiers, ...this.customTiers]
      .sort((a, b) => a.tier - b.tier);
  }

  // Get tiers available for a specific user level
  getAvailableTiers(completedTiers: number[] = []): TierDefinition[] {
    return this.getAllTiers().filter(tier => {
      // Core tiers are always available based on dependencies
      if (tier.tier <= 5) {
        return !tier.dependencies || tier.dependencies.every(dep => completedTiers.includes(dep));
      }
      
      // Extended tiers require core completion
      return completedTiers.includes(5) && 
             (!tier.dependencies || tier.dependencies.every(dep => completedTiers.includes(dep)));
    });
  }

  // Add a custom tier
  addCustomTier(tierDefinition: Omit<TierDefinition, 'tier'> & { tier?: number }): TierDefinition {
    // Auto-assign tier number if not provided
    const maxTier = Math.max(...this.getAllTiers().map(t => t.tier));
    const newTier: TierDefinition = {
      ...tierDefinition,
      tier: tierDefinition.tier || maxTier + 1,
      id: tierDefinition.id || `custom_tier_${Date.now()}`
    };

    this.customTiers.push(newTier);
    this.saveCustomTiers();
    return newTier;
  }

  // Remove a custom tier
  removeCustomTier(tierId: string): boolean {
    const index = this.customTiers.findIndex(t => t.id === tierId);
    if (index >= 0) {
      this.customTiers.splice(index, 1);
      this.saveCustomTiers();
      return true;
    }
    return false;
  }

  // Update existing tier
  updateTier(tierId: string, updates: Partial<TierDefinition>): boolean {
    const allTiers = this.getAllTiers();
    const tierIndex = allTiers.findIndex(t => t.id === tierId);
    
    if (tierIndex >= 0) {
      // If it's a custom tier, update it
      const customIndex = this.customTiers.findIndex(t => t.id === tierId);
      if (customIndex >= 0) {
        this.customTiers[customIndex] = { ...this.customTiers[customIndex], ...updates };
        this.saveCustomTiers();
        return true;
      }
    }
    return false;
  }

  // Add custom question to existing tier
  addQuestionToTier(tierId: string, question: TierQuestion): boolean {
    const tier = this.getAllTiers().find(t => t.id === tierId);
    if (tier) {
      question.tier = tier.tier;
      tier.questions.push(question);
      
      // If it's a custom tier, save it
      const customIndex = this.customTiers.findIndex(t => t.id === tierId);
      if (customIndex >= 0) {
        this.saveCustomTiers();
      }
      return true;
    }
    return false;
  }

  // Get tier by ID
  getTierById(tierId: string): TierDefinition | undefined {
    return this.getAllTiers().find(t => t.id === tierId);
  }

  // Get tier by number
  getTierByNumber(tierNumber: number): TierDefinition | undefined {
    return this.getAllTiers().find(t => t.tier === tierNumber);
  }

  // Check if user can access a tier
  canAccessTier(tierNumber: number, completedTiers: number[]): boolean {
    const tier = this.getTierByNumber(tierNumber);
    if (!tier) return false;

    return !tier.dependencies || tier.dependencies.every(dep => completedTiers.includes(dep));
  }

  // Generate system prompt from completed profile
  generateSystemPrompt(profile: TierProfile): string {
    const completedTierData = this.getAllTiers()
      .filter(tier => profile.completedTiers.includes(tier.tier))
      .map(tier => {
        const tierData = profile[`tier_${tier.tier}`] || {};
        return {
          tier: tier.tier,
          name: tier.name,
          data: tierData
        };
      });

    // Build comprehensive system prompt
    return this.buildTieredSystemPrompt(completedTierData);
  }

  private buildTieredSystemPrompt(tierData: any[]): string {
    // This would generate a sophisticated system prompt based on all completed tiers
    // Implementation would be similar to current generateUltimateSystemPrompt but dynamic
    return `Dynamic tiered system prompt based on ${tierData.length} completed tiers...`;
  }

  private loadCustomTiers(): void {
    try {
      const stored = localStorage.getItem('genieflow_custom_tiers');
      if (stored) {
        this.customTiers = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading custom tiers:', error);
    }
  }

  private saveCustomTiers(): void {
    try {
      localStorage.setItem('genieflow_custom_tiers', JSON.stringify(this.customTiers));
    } catch (error) {
      console.error('Error saving custom tiers:', error);
    }
  }
}

// Singleton instance
export const tierManager = new TierArchitectureManager();

// Utility functions
export const getNextAvailableTier = (completedTiers: number[]): TierDefinition | null => {
  const available = tierManager.getAvailableTiers(completedTiers);
  const incomplete = available.filter(tier => !completedTiers.includes(tier.tier));
  return incomplete.length > 0 ? incomplete[0] : null;
};

export const calculateCompletionPercentage = (completedTiers: number[]): number => {
  const totalRequired = tierManager.getAllTiers().filter(t => t.required).length;
  const completedRequired = completedTiers.filter(tier => {
    const tierDef = tierManager.getTierByNumber(tier);
    return tierDef?.required;
  }).length;
  
  return Math.round((completedRequired / totalRequired) * 100);
};
