/**
 * 🏥👨‍⚖️💼 Professional Agent Marketplace
 * 
 * Revolutionary marketplace for domain-specific AI agents
 * Doctors, Attorneys, Financial Advisors, Consultants, and more
 * 
 * $5.3B Market Potential - Professional Services Agentification
 */

import { supabase } from '../lib/supabase';
import { EventEmitter } from 'events';

interface ProfessionalAgent {
  id: string;
  name: string;
  profession: ProfessionType;
  specialty: string[];
  description: string;
  shortDescription: string;
  createdBy: string;
  certifications: Certification[];
  pricing: AgentPricing;
  performance: AgentPerformance;
  availability: AgentAvailability;
  knowledgeBase: KnowledgeBase;
  templates: AgentTemplate[];
  reviews: AgentReview[];
  status: 'pending' | 'approved' | 'featured' | 'suspended';
  tier: 'basic' | 'professional' | 'expert' | 'premium';
  featured: boolean;
  tags: string[];
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

interface Certification {
  id: string;
  name: string;
  authority: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
}

interface AgentPricing {
  model: 'free' | 'consultation' | 'subscription' | 'per_use' | 'custom';
  consultationRate?: number; // Per hour
  subscriptionPrice?: number; // Per month
  perUsePrice?: number; // Per interaction
  currency: string;
  freeTierLimits?: {
    consultationsPerMonth: number;
    documentsPerMonth: number;
    basicFeatures: boolean;
  };
}

interface AgentPerformance {
  totalInteractions: number;
  successRate: number;
  averageResponseTime: number;
  customerSatisfaction: number;
  expertiseScore: number;
  certificationScore: number;
  popularityScore: number;
}

interface AgentAvailability {
  timeZones: string[];
  businessHours: {
    [day: string]: { start: string; end: string; available: boolean };
  };
  responseTimeGuarantee: number; // minutes
  emergencyAvailable: boolean;
  maxConcurrentSessions: number;
}

interface KnowledgeBase {
  specializedDocuments: number;
  caseLawDatabase?: boolean; // For legal agents
  medicalJournals?: boolean; // For medical agents
  financialData?: boolean; // For financial agents
  industryReports?: boolean;
  customKnowledge: string[];
  lastUpdated: Date;
}

interface AgentTemplate {
  id: string;
  name: string;
  type: 'consultation' | 'document' | 'analysis' | 'report';
  description: string;
  templateContent: string;
  category: string;
  estimatedTime: number;
  complexity: 'simple' | 'intermediate' | 'complex';
}

interface AgentReview {
  id: string;
  userId: string;
  rating: number;
  title: string;
  content: string;
  verified: boolean;
  helpful: number;
  createdAt: Date;
}

type ProfessionType = 
  | 'medical_doctor' 
  | 'attorney' 
  | 'financial_advisor' 
  | 'accountant' 
  | 'consultant' 
  | 'therapist' 
  | 'real_estate' 
  | 'insurance' 
  | 'architect' 
  | 'engineer' 
  | 'educator' 
  | 'researcher'
  | 'other';

interface MarketplaceFilter {
  profession?: ProfessionType[];
  specialty?: string[];
  pricing?: ('free' | 'consultation' | 'subscription' | 'per_use')[];
  certification?: boolean;
  availability?: 'now' | 'today' | 'this_week';
  location?: string;
  language?: string[];
  rating?: number;
  tier?: ('basic' | 'professional' | 'expert' | 'premium')[];
}

interface AgentPurchase {
  id: string;
  userId: string;
  agentId: string;
  type: 'consultation' | 'subscription' | 'document' | 'custom';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  sessionDetails?: any;
  createdAt: Date;
}

export class ProfessionalAgentMarketplace extends EventEmitter {
  private isInitialized = false;

  constructor() {
    super();
    this.initialize();
  }

  /**
   * Initialize the marketplace
   */
  private async initialize() {
    console.log('🏥 Professional Agent Marketplace: Initializing...');
    
    try {
      this.isInitialized = true;
      console.log('🏥 Professional Agent Marketplace: Initialized successfully');
      
    } catch (error) {
      console.error('🏥 Professional Agent Marketplace: Initialization failed:', error);
    }
  }

  /**
   * Browse professional agents with filters
   */
  async browseAgents(filters: MarketplaceFilter = {}, limit: number = 20, offset: number = 0): Promise<ProfessionalAgent[]> {
    let query = supabase
      .from('professional_agents')
      .select(`
        *,
        certifications:agent_certifications(*),
        reviews:agent_reviews(rating, content, verified, created_at),
        creator:users(name, avatar_url)
      `)
      .eq('status', 'approved')
      .order('performance->popularityScore', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (filters.profession?.length) {
      query = query.in('profession', filters.profession);
    }

    if (filters.specialty?.length) {
      query = query.overlaps('specialty', filters.specialty);
    }

    if (filters.tier?.length) {
      query = query.in('tier', filters.tier);
    }

    if (filters.certification) {
      query = query.gt('certifications->0->verified', false);
    }

    if (filters.rating) {
      query = query.gte('performance->customerSatisfaction', filters.rating);
    }

    const { data: agents, error } = await query;

    if (error) throw error;

    return agents?.map(agent => this.formatAgent(agent)) || [];
  }

  /**
   * Get featured professional agents
   */
  async getFeaturedAgents(profession?: ProfessionType): Promise<ProfessionalAgent[]> {
    let query = supabase
      .from('professional_agents')
      .select(`
        *,
        certifications:agent_certifications(*),
        reviews:agent_reviews(rating, content, verified, created_at),
        creator:users(name, avatar_url)
      `)
      .eq('featured', true)
      .eq('status', 'approved')
      .order('performance->popularityScore', { ascending: false })
      .limit(10);

    if (profession) {
      query = query.eq('profession', profession);
    }

    const { data: agents, error } = await query;

    if (error) throw error;

    return agents?.map(agent => this.formatAgent(agent)) || [];
  }

  /**
   * Get agent by ID with full details
   */
  async getAgent(agentId: string): Promise<ProfessionalAgent | null> {
    const { data: agent, error } = await supabase
      .from('professional_agents')
      .select(`
        *,
        certifications:agent_certifications(*),
        reviews:agent_reviews(*),
        templates:agent_templates(*),
        creator:users(name, avatar_url, email)
      `)
      .eq('id', agentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.formatAgent(agent);
  }

  /**
   * Create a new professional agent listing
   */
  async createProfessionalAgent(agentData: Partial<ProfessionalAgent>): Promise<ProfessionalAgent> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const agent = {
      id: crypto.randomUUID(),
      name: agentData.name,
      profession: agentData.profession,
      specialty: agentData.specialty || [],
      description: agentData.description,
      short_description: agentData.shortDescription,
      created_by: user.id,
      pricing: agentData.pricing,
      availability: agentData.availability || this.getDefaultAvailability(),
      knowledge_base: agentData.knowledgeBase || {},
      performance: {
        totalInteractions: 0,
        successRate: 0,
        averageResponseTime: 0,
        customerSatisfaction: 0,
        expertiseScore: 0,
        certificationScore: 0,
        popularityScore: 0
      },
      status: 'pending',
      tier: agentData.tier || 'basic',
      featured: false,
      tags: agentData.tags || [],
      metadata: agentData.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: createdAgent, error } = await supabase
      .from('professional_agents')
      .insert(agent)
      .select()
      .single();

    if (error) throw error;

    console.log('🏥 Professional agent created:', createdAgent.name);
    this.emit('agent_created', createdAgent);

    return this.formatAgent(createdAgent);
  }

  /**
   * Submit agent for certification
   */
  async submitCertification(agentId: string, certification: Omit<Certification, 'id' | 'verified' | 'verifiedBy' | 'verifiedAt'>): Promise<Certification> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const certificationData = {
      id: crypto.randomUUID(),
      agent_id: agentId,
      name: certification.name,
      authority: certification.authority,
      issue_date: certification.issueDate.toISOString(),
      expiry_date: certification.expiryDate?.toISOString(),
      credential_id: certification.credentialId,
      verified: false,
      submitted_by: user.id,
      created_at: new Date().toISOString()
    };

    const { data: cert, error } = await supabase
      .from('agent_certifications')
      .insert(certificationData)
      .select()
      .single();

    if (error) throw error;

    console.log('🏥 Certification submitted for verification:', cert.name);
    this.emit('certification_submitted', cert);

    return this.formatCertification(cert);
  }

  /**
   * Purchase agent consultation
   */
  async purchaseConsultation(
    agentId: string, 
    type: 'consultation' | 'document' | 'subscription',
    duration?: number,
    requirements?: string
  ): Promise<AgentPurchase> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get agent pricing
    const agent = await this.getAgent(agentId);
    if (!agent) throw new Error('Agent not found');

    let amount = 0;
    switch (type) {
      case 'consultation':
        amount = (agent.pricing.consultationRate || 0) * (duration || 1);
        break;
      case 'subscription':
        amount = agent.pricing.subscriptionPrice || 0;
        break;
      case 'document':
        amount = agent.pricing.perUsePrice || 0;
        break;
    }

    const purchase = {
      id: crypto.randomUUID(),
      user_id: user.id,
      agent_id: agentId,
      type,
      amount,
      currency: agent.pricing.currency,
      status: 'pending',
      session_details: {
        duration,
        requirements,
        scheduledAt: type === 'consultation' ? new Date().toISOString() : null
      },
      created_at: new Date().toISOString()
    };

    const { data: purchaseRecord, error } = await supabase
      .from('agent_purchases')
      .insert(purchase)
      .select()
      .single();

    if (error) throw error;

    // Update agent performance
    await this.updateAgentPerformance(agentId, { totalInteractions: 1 });

    console.log('🏥 Agent consultation purchased:', type);
    this.emit('consultation_purchased', purchaseRecord);

    return this.formatPurchase(purchaseRecord);
  }

  /**
   * Submit agent review
   */
  async submitReview(agentId: string, rating: number, title: string, content: string): Promise<AgentReview> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if user has purchased this agent
    const { data: purchases } = await supabase
      .from('agent_purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('agent_id', agentId)
      .eq('status', 'completed');

    const verified = purchases && purchases.length > 0;

    const review = {
      id: crypto.randomUUID(),
      agent_id: agentId,
      user_id: user.id,
      rating,
      title,
      content,
      verified,
      helpful: 0,
      created_at: new Date().toISOString()
    };

    const { data: reviewRecord, error } = await supabase
      .from('agent_reviews')
      .insert(review)
      .select()
      .single();

    if (error) throw error;

    // Update agent performance
    await this.updateAgentRating(agentId);

    console.log('🏥 Agent review submitted:', rating);
    this.emit('review_submitted', reviewRecord);

    return this.formatReview(reviewRecord);
  }

  /**
   * Get marketplace statistics
   */
  async getMarketplaceStats() {
    const { data: stats, error } = await supabase
      .rpc('get_marketplace_stats');

    if (error) throw error;

    return {
      totalAgents: stats?.total_agents || 0,
      totalProfessions: stats?.total_professions || 0,
      totalConsultations: stats?.total_consultations || 0,
      averageRating: stats?.average_rating || 0,
      totalRevenue: stats?.total_revenue || 0,
      topProfessions: stats?.top_professions || [],
      growthMetrics: {
        agentsThisMonth: stats?.agents_this_month || 0,
        consultationsThisMonth: stats?.consultations_this_month || 0,
        revenueThisMonth: stats?.revenue_this_month || 0
      }
    };
  }

  /**
   * Search agents by specialty or keywords
   */
  async searchAgents(query: string, filters: MarketplaceFilter = {}): Promise<ProfessionalAgent[]> {
    const { data: agents, error } = await supabase
      .from('professional_agents')
      .select(`
        *,
        certifications:agent_certifications(*),
        reviews:agent_reviews(rating, content, verified, created_at)
      `)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,specialty.cs.{${query}}`)
      .eq('status', 'approved')
      .order('performance->popularityScore', { ascending: false })
      .limit(20);

    if (error) throw error;

    return agents?.map(agent => this.formatAgent(agent)) || [];
  }

  /**
   * Get recommended agents for user
   */
  async getRecommendedAgents(userId: string): Promise<ProfessionalAgent[]> {
    // AI-powered recommendation logic based on user history and preferences
    const { data: userHistory } = await supabase
      .from('agent_purchases')
      .select('agent_id, professional_agents(profession, specialty)')
      .eq('user_id', userId)
      .limit(10);

    const preferences = this.analyzeUserPreferences(userHistory || []);
    
    return this.browseAgents({
      profession: preferences.preferredProfessions,
      specialty: preferences.preferredSpecialties
    }, 10);
  }

  /**
   * Update agent performance metrics
   */
  private async updateAgentPerformance(agentId: string, metrics: Partial<AgentPerformance>) {
    const { data: agent } = await supabase
      .from('professional_agents')
      .select('performance')
      .eq('id', agentId)
      .single();

    if (!agent) return;

    const updatedPerformance = {
      ...agent.performance,
      ...metrics
    };

    await supabase
      .from('professional_agents')
      .update({ 
        performance: updatedPerformance,
        updated_at: new Date().toISOString()
      })
      .eq('id', agentId);
  }

  /**
   * Update agent rating based on reviews
   */
  private async updateAgentRating(agentId: string) {
    const { data: reviews } = await supabase
      .from('agent_reviews')
      .select('rating, verified')
      .eq('agent_id', agentId);

    if (!reviews || reviews.length === 0) return;

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    const verifiedReviews = reviews.filter(r => r.verified).length;

    await this.updateAgentPerformance(agentId, {
      customerSatisfaction: averageRating
    });
  }

  /**
   * Analyze user preferences for recommendations
   */
  private analyzeUserPreferences(userHistory: any[]): { preferredProfessions: ProfessionType[], preferredSpecialties: string[] } {
    const professionCounts: { [key: string]: number } = {};
    const specialtyCounts: { [key: string]: number } = {};

    userHistory.forEach(purchase => {
      const profession = purchase.professional_agents?.profession;
      const specialties = purchase.professional_agents?.specialty || [];

      if (profession) {
        professionCounts[profession] = (professionCounts[profession] || 0) + 1;
      }

      specialties.forEach((specialty: string) => {
        specialtyCounts[specialty] = (specialtyCounts[specialty] || 0) + 1;
      });
    });

    const preferredProfessions = Object.entries(professionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([profession]) => profession as ProfessionType);

    const preferredSpecialties = Object.entries(specialtyCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([specialty]) => specialty);

    return { preferredProfessions, preferredSpecialties };
  }

  /**
   * Get default availability settings
   */
  private getDefaultAvailability(): AgentAvailability {
    return {
      timeZones: ['UTC'],
      businessHours: {
        monday: { start: '09:00', end: '17:00', available: true },
        tuesday: { start: '09:00', end: '17:00', available: true },
        wednesday: { start: '09:00', end: '17:00', available: true },
        thursday: { start: '09:00', end: '17:00', available: true },
        friday: { start: '09:00', end: '17:00', available: true },
        saturday: { start: '10:00', end: '14:00', available: false },
        sunday: { start: '10:00', end: '14:00', available: false }
      },
      responseTimeGuarantee: 30,
      emergencyAvailable: false,
      maxConcurrentSessions: 3
    };
  }

  /**
   * Format agent data
   */
  private formatAgent(agent: any): ProfessionalAgent {
    return {
      id: agent.id,
      name: agent.name,
      profession: agent.profession,
      specialty: agent.specialty || [],
      description: agent.description,
      shortDescription: agent.short_description,
      createdBy: agent.created_by,
      certifications: agent.certifications?.map((c: any) => this.formatCertification(c)) || [],
      pricing: agent.pricing,
      performance: agent.performance,
      availability: agent.availability,
      knowledgeBase: agent.knowledge_base,
      templates: agent.templates?.map((t: any) => this.formatTemplate(t)) || [],
      reviews: agent.reviews?.map((r: any) => this.formatReview(r)) || [],
      status: agent.status,
      tier: agent.tier,
      featured: agent.featured,
      tags: agent.tags || [],
      metadata: agent.metadata || {},
      createdAt: new Date(agent.created_at),
      updatedAt: new Date(agent.updated_at)
    };
  }

  /**
   * Format certification data
   */
  private formatCertification(cert: any): Certification {
    return {
      id: cert.id,
      name: cert.name,
      authority: cert.authority,
      issueDate: new Date(cert.issue_date),
      expiryDate: cert.expiry_date ? new Date(cert.expiry_date) : undefined,
      credentialId: cert.credential_id,
      verified: cert.verified,
      verifiedBy: cert.verified_by,
      verifiedAt: cert.verified_at ? new Date(cert.verified_at) : undefined
    };
  }

  /**
   * Format template data
   */
  private formatTemplate(template: any): AgentTemplate {
    return {
      id: template.id,
      name: template.name,
      type: template.type,
      description: template.description,
      templateContent: template.template_content,
      category: template.category,
      estimatedTime: template.estimated_time,
      complexity: template.complexity
    };
  }

  /**
   * Format review data
   */
  private formatReview(review: any): AgentReview {
    return {
      id: review.id,
      userId: review.user_id,
      rating: review.rating,
      title: review.title,
      content: review.content,
      verified: review.verified,
      helpful: review.helpful,
      createdAt: new Date(review.created_at)
    };
  }

  /**
   * Format purchase data
   */
  private formatPurchase(purchase: any): AgentPurchase {
    return {
      id: purchase.id,
      userId: purchase.user_id,
      agentId: purchase.agent_id,
      type: purchase.type,
      amount: purchase.amount,
      currency: purchase.currency,
      status: purchase.status,
      sessionDetails: purchase.session_details,
      createdAt: new Date(purchase.created_at)
    };
  }

  /**
   * Cleanup and destroy service
   */
  destroy() {
    this.removeAllListeners();
    console.log('🏥 Professional Agent Marketplace: Service destroyed');
  }
}

// Global instance
export const professionalAgentMarketplace = new ProfessionalAgentMarketplace();

export default ProfessionalAgentMarketplace;