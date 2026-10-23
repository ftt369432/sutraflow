/**
 * 🏪 Agent Marketplace Store - Where Users Discover & Purchase AI Assistants
 * 
 * Public marketplace for specialized professional AI assistants
 * Legal Eagle + Agent Leasing System Integration
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { 
  Search, Filter, Star, Users, Download, ShoppingCart, 
  Scale, Stethoscope, Briefcase, Calculator, Code, Palette,
  Crown, Zap, Eye, ArrowRight, TrendingUp, Shield, Award
} from 'lucide-react';

// 🎯 Professional Categories
const PROFESSIONAL_CATEGORIES = {
  'legal': { 
    name: 'Legal', 
    icon: Scale, 
    color: 'blue',
    description: 'Legal professionals and law firms'
  },
  'medical': { 
    name: 'Healthcare', 
    icon: Stethoscope, 
    color: 'green',
    description: 'Medical doctors and healthcare providers'
  },
  'business': { 
    name: 'Business', 
    icon: Briefcase, 
    color: 'purple',
    description: 'Business consultants and entrepreneurs'
  },
  'finance': { 
    name: 'Finance', 
    icon: Calculator, 
    color: 'emerald',
    description: 'Financial advisors and accountants'
  },
  'tech': { 
    name: 'Technology', 
    icon: Code, 
    color: 'indigo',
    description: 'Software developers and IT professionals'
  },
  'creative': { 
    name: 'Creative', 
    icon: Palette, 
    color: 'pink',
    description: 'Designers, writers, and creative agencies'
  }
};

// 🤖 Featured Assistants (Mock Data)
const FEATURED_ASSISTANTS = [
  {
    id: 'legal_eagle_workcomp',
    name: 'Legal Eagle - California Workers Comp',
    creator: 'Legal Expert Pro',
    profession: 'legal',
    specialty: ['Workers Compensation', 'Personal Injury', 'Disability Claims'],
    description: 'Complete California workers compensation legal assistant with specialized knowledge of state laws, case precedents, and claim procedures.',
    shortDescription: 'California work comp legal expert with 15+ years of case knowledge',
    price: 149.99,
    pricingModel: 'subscription',
    rating: 4.9,
    totalUsers: 342,
    totalSales: 89,
    featured: true,
    verified: true,
    leaseableAgents: [
      { name: 'Legal Research Agent', price: 29.99 },
      { name: 'Case Analysis Agent', price: 39.99 },
      { name: 'Document Drafting Agent', price: 49.99 },
      { name: 'Client Communication Agent', price: 19.99 }
    ],
    templates: 12,
    workflows: 8,
    image: '/api/placeholder/300/200'
  },
  {
    id: 'medical_practice_pro',
    name: 'Medical Practice Pro',
    creator: 'Dr. Sarah Johnson',
    profession: 'medical',
    specialty: ['Primary Care', 'Patient Management', 'Medical Records'],
    description: 'Comprehensive medical practice management with patient communication, diagnosis support, and treatment planning.',
    shortDescription: 'Complete medical practice management solution',
    price: 199.99,
    pricingModel: 'subscription',
    rating: 4.8,
    totalUsers: 156,
    totalSales: 67,
    featured: true,
    verified: true,
    leaseableAgents: [
      { name: 'Patient Communication Agent', price: 34.99 },
      { name: 'Diagnosis Support Agent', price: 59.99 },
      { name: 'Treatment Planning Agent', price: 44.99 }
    ],
    templates: 18,
    workflows: 12,
    image: '/api/placeholder/300/200'
  },
  {
    id: 'business_strategy_suite',
    name: 'Business Strategy Suite',
    creator: 'Strategic Consulting Group',
    profession: 'business',
    specialty: ['Strategy Planning', 'Market Analysis', 'Business Development'],
    description: 'Executive-level business consulting assistant with market analysis, strategic planning, and competitive intelligence.',
    shortDescription: 'Executive business consulting and strategy planning',
    price: 299.99,
    pricingModel: 'subscription',
    rating: 4.7,
    totalUsers: 89,
    totalSales: 45,
    featured: false,
    verified: true,
    leaseableAgents: [
      { name: 'Market Analysis Agent', price: 49.99 },
      { name: 'Strategy Planning Agent', price: 69.99 },
      { name: 'Competitive Intelligence Agent', price: 39.99 }
    ],
    templates: 15,
    workflows: 10,
    image: '/api/placeholder/300/200'
  }
];

interface MarketplaceAssistant {
  id: string;
  name: string;
  creator: string;
  profession: string;
  specialty: string[];
  description: string;
  shortDescription: string;
  price: number;
  pricingModel: string;
  rating: number;
  totalUsers: number;
  totalSales: number;
  featured: boolean;
  verified: boolean;
  leaseableAgents: Array<{ name: string; price: number }>;
  templates: number;
  workflows: number;
  image: string;
}

export const AgentMarketplaceStore: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [assistants, setAssistants] = useState<MarketplaceAssistant[]>(FEATURED_ASSISTANTS);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState('featured');
  const [loading, setLoading] = useState(false);

  // Load assistants
  useEffect(() => {
    loadAssistants();
  }, [selectedCategory, sortBy, searchQuery]);

  const loadAssistants = async () => {
    setLoading(true);
    try {
      // In real app, this would be an API call to supabase
      // For now, using mock data with filters
      let filteredAssistants = [...FEATURED_ASSISTANTS];
      
      // Filter by category
      if (selectedCategory !== 'all') {
        filteredAssistants = filteredAssistants.filter(a => a.profession === selectedCategory);
      }
      
      // Filter by search
      if (searchQuery) {
        filteredAssistants = filteredAssistants.filter(a => 
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.specialty.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      
      // Sort
      switch (sortBy) {
        case 'rating':
          filteredAssistants.sort((a, b) => b.rating - a.rating);
          break;
        case 'price_low':
          filteredAssistants.sort((a, b) => a.price - b.price);
          break;
        case 'price_high':
          filteredAssistants.sort((a, b) => b.price - a.price);
          break;
        case 'popular':
          filteredAssistants.sort((a, b) => b.totalUsers - a.totalUsers);
          break;
        default:
          // Featured first
          filteredAssistants.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      }
      
      setAssistants(filteredAssistants);
    } catch (error) {
      console.error('Error loading assistants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSearchParams({ category, search: searchQuery });
  };

  const handlePurchase = (assistant: MarketplaceAssistant) => {
    // Navigate to purchase flow
    navigate(`/marketplace/purchase/${assistant.id}`);
  };

  const handleLeaseAgent = (assistant: MarketplaceAssistant, agentName: string) => {
    // Navigate to agent leasing flow
    navigate(`/marketplace/lease/${assistant.id}/${encodeURIComponent(agentName)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Assistant Marketplace</h1>
          <p className="text-xl text-gray-600">Discover professional AI assistants created by experts in their field</p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assistants by specialty, profession, or keywords..."
                className="pl-10"
              />
            </div>
            
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="featured">Featured</option>
              <option value="rating">Highest Rated</option>
              <option value="popular">Most Popular</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-8">
          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedCategory === 'all' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => handleCategorySelect('all')}
          >
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                <Filter className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="font-medium text-sm">All Categories</h3>
            </CardContent>
          </Card>
          
          {Object.entries(PROFESSIONAL_CATEGORIES).map(([key, category]) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === key;
            
            return (
              <Card 
                key={key}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  isSelected ? `ring-2 ring-${category.color}-500 bg-${category.color}-50` : ''
                }`}
                onClick={() => handleCategorySelect(key)}
              >
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 mx-auto mb-2 bg-${category.color}-100 rounded-full flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${category.color}-600`} />
                  </div>
                  <h3 className="font-medium text-sm">{category.name}</h3>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Assistants Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {assistants.map((assistant) => {
              const categoryInfo = PROFESSIONAL_CATEGORIES[assistant.profession as keyof typeof PROFESSIONAL_CATEGORIES];
              const Icon = categoryInfo?.icon || Briefcase;
              
              return (
                <Card key={assistant.id} className="hover:shadow-xl transition-all duration-300 overflow-hidden">
                  {/* Featured Badge */}
                  {assistant.featured && (
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 text-center">
                      ⭐ FEATURED ASSISTANT
                    </div>
                  )}
                  
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 bg-${categoryInfo?.color}-100 rounded-lg flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 text-${categoryInfo?.color}-600`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold">{assistant.name}</h3>
                          {assistant.verified && (
                            <Badge variant="default" className="bg-blue-100 text-blue-800">
                              <Shield className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-1">by {assistant.creator}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span>{assistant.rating}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{assistant.totalUsers} users</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Specialties */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {assistant.specialty.slice(0, 3).map(spec => (
                          <Badge key={spec} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                        {assistant.specialty.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{assistant.specialty.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {assistant.shortDescription}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-500">Templates:</span>
                        <span className="ml-1 font-medium">{assistant.templates}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Workflows:</span>
                        <span className="ml-1 font-medium">{assistant.workflows}</span>
                      </div>
                    </div>

                    {/* Leaseable Agents */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Individual Agents:</h4>
                      <div className="space-y-1">
                        {assistant.leaseableAgents.slice(0, 2).map(agent => (
                          <div key={agent.name} className="flex justify-between items-center text-xs">
                            <span className="text-gray-600">{agent.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">${agent.price}/mo</span>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-6 px-2 text-xs"
                                onClick={() => handleLeaseAgent(assistant, agent.name)}
                              >
                                Lease
                              </Button>
                            </div>
                          </div>
                        ))}
                        {assistant.leaseableAgents.length > 2 && (
                          <p className="text-xs text-gray-500">+{assistant.leaseableAgents.length - 2} more agents available</p>
                        )}
                      </div>
                    </div>

                    {/* Pricing & Actions */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            ${assistant.price}
                            <span className="text-sm font-normal text-gray-500">/month</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/marketplace/assistant/${assistant.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handlePurchase(assistant)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Buy Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && assistants.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assistants found</h3>
            <p className="text-gray-600">Try adjusting your search or category filters</p>
          </div>
        )}

        {/* Creator CTA */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Create Your Own AI Assistant</h2>
          <p className="text-lg mb-6">Join thousands of professionals monetizing their expertise</p>
          <Button 
            variant="secondary" 
            size="lg"
            onClick={() => navigate('/creator/dashboard')}
          >
            <Crown className="w-5 h-5 mr-2" />
            Become a Creator
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AgentMarketplaceStore;