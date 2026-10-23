// Marketplace MVP Launch - Browse, Discovery, Trial, Purchase System
// GPT-like interface for professional AI agent marketplace

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Search, Filter, Star, Users, Zap, Play, ShoppingCart, 
  Heart, Award, Clock, DollarSign, MessageSquare, Shield
} from 'lucide-react';

export interface ProfessionalAgent {
  id: string;
  creator_id: string;
  name: string;
  profession: string;
  specialty: string[];
  description: string;
  short_description: string;
  avatar_url?: string;
  rating: number;
  review_count: number;
  usage_count: number;
  pricing: {
    monthly: number;
    annual?: number;
    trial_days?: number;
  };
  features: string[];
  demo_available: boolean;
  voice_triggers: string[];
  creator: {
    name: string;
    verified: boolean;
    avatar_url?: string;
  };
  tags: string[];
  status: 'active' | 'draft' | 'suspended';
  created_at: string;
}

export interface MarketplaceFilters {
  profession: string;
  priceRange: [number, number];
  rating: number;
  specialty: string[];
  features: string[];
  sortBy: 'popular' | 'rating' | 'price_low' | 'price_high' | 'newest';
}

const PROFESSIONS = [
  { id: 'all', name: 'All Professions', icon: '🎯' },
  { id: 'legal', name: 'Legal & Compliance', icon: '⚖️' },
  { id: 'medical', name: 'Medical & Healthcare', icon: '🏥' },
  { id: 'business', name: 'Business Consulting', icon: '💼' },
  { id: 'financial', name: 'Financial Services', icon: '💰' },
  { id: 'technical', name: 'Engineering & Technical', icon: '🔧' },
  { id: 'educational', name: 'Education & Training', icon: '📚' },
  { id: 'consulting', name: 'Management Consulting', icon: '📈' },
  { id: 'real_estate', name: 'Real Estate', icon: '🏠' }
];

const FEATURED_AGENTS: ProfessionalAgent[] = [
  {
    id: 'legal-eagle-ca-workcomp',
    creator_id: 'creator-1',
    name: 'Legal Eagle - CA Work Comp Specialist',
    profession: 'legal',
    specialty: ['Workers Compensation', 'California Law', 'Medical Legal'],
    description: 'Expert California Workers Compensation attorney with 15+ years experience. Specializes in medical-legal evaluations, QME reports, and complex injury cases.',
    short_description: 'CA Workers Comp Expert - QME Reports & Legal Analysis',
    rating: 4.9,
    review_count: 127,
    usage_count: 1543,
    pricing: { monthly: 97, annual: 970, trial_days: 7 },
    features: [
      'QME Report Generation',
      'Medical-Legal Analysis',
      'Demand Letter Templates',
      'Case Timeline Creation',
      'Settlement Calculation'
    ],
    demo_available: true,
    voice_triggers: ['draft work comp report', 'create QME evaluation', 'calculate settlement'],
    creator: { name: 'Attorney Sarah Chen', verified: true },
    tags: ['work comp', 'california', 'medical legal', 'QME'],
    status: 'active',
    created_at: '2025-09-01T00:00:00Z'
  },
  {
    id: 'medical-expert-orthopedic',
    creator_id: 'creator-2',
    name: 'Dr. Rodriguez - Orthopedic Surgery Expert',
    profession: 'medical',
    specialty: ['Orthopedic Surgery', 'Sports Medicine', 'Work Injuries'],
    description: 'Board-certified orthopedic surgeon specializing in work-related injuries and sports medicine. Expert in IME and QME evaluations.',
    short_description: 'Orthopedic Surgery Expert - IME & Work Injury Reports',
    rating: 4.8,
    review_count: 89,
    usage_count: 892,
    pricing: { monthly: 147, annual: 1470, trial_days: 7 },
    features: [
      'IME Report Generation',
      'Surgical Assessment',
      'Disability Rating',
      'Treatment Planning',
      'Peer Review Reports'
    ],
    demo_available: true,
    voice_triggers: ['create IME report', 'assess surgical need', 'rate disability'],
    creator: { name: 'Dr. Maria Rodriguez, MD', verified: true },
    tags: ['orthopedic', 'surgery', 'IME', 'work injury'],
    status: 'active',
    created_at: '2025-08-15T00:00:00Z'
  },
  {
    id: 'business-consultant-strategy',
    creator_id: 'creator-3',
    name: 'Strategic Business Advisor Pro',
    profession: 'business',
    specialty: ['Strategy', 'Operations', 'Market Analysis'],
    description: 'MBA consultant with 20+ years experience helping businesses optimize operations and develop growth strategies.',
    short_description: 'Strategic Business Consultant - Operations & Growth',
    rating: 4.7,
    review_count: 156,
    usage_count: 2134,
    pricing: { monthly: 197, annual: 1970, trial_days: 7 },
    features: [
      'Business Plan Creation',
      'Market Analysis Reports',
      'Financial Projections',
      'Operational Assessments',
      'Growth Strategy Development'
    ],
    demo_available: true,
    voice_triggers: ['analyze market opportunity', 'create business plan', 'assess operations'],
    creator: { name: 'Michael Thompson, MBA', verified: true },
    tags: ['strategy', 'consulting', 'business plan', 'operations'],
    status: 'active',
    created_at: '2025-08-01T00:00:00Z'
  }
];

// Agent Card Component
const AgentCard: React.FC<{
  agent: ProfessionalAgent;
  onTrial: (agent: ProfessionalAgent) => void;
  onPurchase: (agent: ProfessionalAgent) => void;
  onDemo: (agent: ProfessionalAgent) => void;
}> = ({ agent, onTrial, onPurchase, onDemo }) => {
  const [isFavorited, setIsFavorited] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              {agent.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{agent.name}</h3>
              <p className="text-sm text-gray-600">{agent.short_description}</p>
            </div>
          </div>
          <button
            onClick={() => setIsFavorited(!isFavorited)}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current text-red-500' : ''}`} />
          </button>
        </div>

        {/* Creator Info */}
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
          <span className="text-sm text-gray-600">{agent.creator.name}</span>
          {agent.creator.verified && (
            <Shield className="w-4 h-4 text-blue-500" />
          )}
        </div>

        {/* Rating and Stats */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium text-gray-900">{agent.rating}</span>
            <span className="text-sm text-gray-500">({agent.review_count})</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">{agent.usage_count.toLocaleString()} uses</span>
          </div>
        </div>

        {/* Specialties */}
        <div className="flex flex-wrap gap-2 mb-4">
          {agent.specialty.slice(0, 3).map((spec) => (
            <span
              key={spec}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
            >
              {spec}
            </span>
          ))}
          {agent.specialty.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
              +{agent.specialty.length - 3} more
            </span>
          )}
        </div>

        {/* Features */}
        <div className="space-y-1 mb-4">
          {agent.features.slice(0, 3).map((feature) => (
            <div key={feature} className="flex items-center space-x-2">
              <Zap className="w-3 h-3 text-green-500" />
              <span className="text-sm text-gray-600">{feature}</span>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="mb-4">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-gray-900">${agent.pricing.monthly}</span>
            <span className="text-gray-600">/month</span>
          </div>
          {agent.pricing.trial_days && (
            <p className="text-sm text-green-600">{agent.pricing.trial_days}-day free trial</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 gap-2">
          {agent.demo_available && (
            <button
              onClick={() => onDemo(agent)}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Watch Demo</span>
            </button>
          )}
          
          {agent.pricing.trial_days && (
            <button
              onClick={() => onTrial(agent)}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Clock className="w-4 h-4" />
              <span>Start Free Trial</span>
            </button>
          )}
          
          <button
            onClick={() => onPurchase(agent)}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Subscribe Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Marketplace Homepage Component
export const MarketplaceMVP: React.FC = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState<ProfessionalAgent[]>(FEATURED_AGENTS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<MarketplaceFilters>({
    profession: 'all',
    priceRange: [0, 500],
    rating: 0,
    specialty: [],
    features: [],
    sortBy: 'popular'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Filter and search agents
  const filteredAgents = useMemo(() => {
    let filtered = agents;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(agent =>
        agent.name.toLowerCase().includes(query) ||
        agent.description.toLowerCase().includes(query) ||
        agent.specialty.some(s => s.toLowerCase().includes(query)) ||
        agent.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    // Profession filter
    if (filters.profession !== 'all') {
      filtered = filtered.filter(agent => agent.profession === filters.profession);
    }

    // Price range filter
    filtered = filtered.filter(agent => 
      agent.pricing.monthly >= filters.priceRange[0] && 
      agent.pricing.monthly <= filters.priceRange[1]
    );

    // Rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(agent => agent.rating >= filters.rating);
    }

    // Sort
    switch (filters.sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.usage_count - a.usage_count);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'price_low':
        filtered.sort((a, b) => a.pricing.monthly - b.pricing.monthly);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.pricing.monthly - a.pricing.monthly);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return filtered;
  }, [agents, searchQuery, filters]);

  // Event handlers
  const handleTrial = async (agent: ProfessionalAgent) => {
    if (!user) {
      alert('Please log in to start a trial');
      return;
    }

    try {
      // Create trial subscription
      const { data, error } = await supabase
        .from('agent_subscriptions')
        .insert({
          user_id: user.id,
          agent_id: agent.id,
          subscription_type: 'trial',
          status: 'active',
          trial_end_date: new Date(Date.now() + agent.pricing.trial_days! * 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) throw error;

      alert(`🎉 Trial started! You have ${agent.pricing.trial_days} days of free access to ${agent.name}`);
    } catch (error) {
      console.error('Trial activation failed:', error);
      alert('Failed to start trial. Please try again.');
    }
  };

  const handlePurchase = async (agent: ProfessionalAgent) => {
    if (!user) {
      alert('Please log in to purchase');
      return;
    }

    // Redirect to payment flow
    window.location.href = `/payment?agent=${agent.id}&plan=monthly`;
  };

  const handleDemo = (agent: ProfessionalAgent) => {
    // Open demo modal or redirect to demo page
    alert(`Demo for ${agent.name} - This would show a live demonstration of the agent's capabilities`);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Professional AI Agent Marketplace
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Discover specialized AI agents created by verified professionals. Get expert assistance with voice commands.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search agents, specialties, or expertise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-white border border-gray-300 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </button>

          {/* Sort */}
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({...filters, sortBy: e.target.value as any})}
            className="bg-white border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="newest">Newest</option>
          </select>
        </div>

        {/* Profession Categories */}
        <div className="mt-6">
          <div className="flex flex-wrap gap-2">
            {PROFESSIONS.map((profession) => (
              <button
                key={profession.id}
                onClick={() => setFilters({...filters, profession: profession.id})}
                className={`px-4 py-2 rounded-full border transition-colors ${
                  filters.profession === profession.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{profession.icon}</span>
                {profession.name}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={filters.priceRange[1]}
                    onChange={(e) => setFilters({
                      ...filters, 
                      priceRange: [filters.priceRange[0], parseInt(e.target.value)]
                    })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>${filters.priceRange[0]}</span>
                    <span>${filters.priceRange[1]}/month</span>
                  </div>
                </div>
              </div>

              {/* Minimum Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Rating
                </label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setFilters({...filters, rating})}
                      className={`p-1 ${filters.rating >= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({
                    profession: 'all',
                    priceRange: [0, 500],
                    rating: 0,
                    specialty: [],
                    features: [],
                    sortBy: 'popular'
                  })}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="mb-6">
        <p className="text-gray-600">
          {filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''} found
          {searchQuery && ` for "${searchQuery}"`}
        </p>
      </div>

      {/* Agent Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-96"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onTrial={handleTrial}
              onPurchase={handlePurchase}
              onDemo={handleDemo}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No agents found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search criteria or browse different categories.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilters({
                profession: 'all',
                priceRange: [0, 500],
                rating: 0,
                specialty: [],
                features: [],
                sortBy: 'popular'
              });
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Clear Search
          </button>
        </div>
      )}
    </div>
  );
};

export default MarketplaceMVP;