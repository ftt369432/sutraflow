// Product Hunt Launch System - #1 Product of the Day Strategy
// Complete launch materials, hunter network, viral content engine

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Trophy, Target, Rocket, Users, Star, Share2, 
  Calendar, Clock, Zap, Award, TrendingUp, Heart,
  Download, Copy, Eye, MessageCircle, ChevronRight
} from 'lucide-react';

export interface LaunchAsset {
  id: string;
  type: 'screenshot' | 'video' | 'gif' | 'logo' | 'banner';
  title: string;
  description: string;
  file_url?: string;
  thumbnail_url?: string;
  dimensions: string;
  file_size: string;
  viral_score: number; // 1-10 for social media appeal
  usage: 'hero' | 'gallery' | 'social' | 'email' | 'press';
  status: 'draft' | 'review' | 'approved' | 'live';
  created_at: string;
}

export interface HunterContact {
  id: string;
  name: string;
  twitter_handle: string;
  email?: string;
  follower_count: number;
  engagement_rate: number;
  specializes_in: string[];
  relationship_strength: 'cold' | 'warm' | 'hot';
  previous_hunts: string[];
  commitment_status: 'pending' | 'confirmed' | 'declined';
  contact_date?: string;
  notes: string;
}

export interface LaunchStrategy {
  launch_date: string;
  target_votes: number;
  target_comments: number;
  hunter_goal: number;
  social_reach_goal: number;
  press_mentions_goal: number;
  timeline: LaunchMilestone[];
  messaging: {
    headline: string;
    tagline: string;
    value_props: string[];
    viral_hooks: string[];
  };
}

export interface LaunchMilestone {
  id: string;
  title: string;
  description: string;
  due_date: string;
  owner: string;
  status: 'not-started' | 'in-progress' | 'completed';
  dependencies: string[];
}

const LAUNCH_ASSETS: LaunchAsset[] = [
  {
    id: 'hero-demo-video',
    type: 'video',
    title: 'Hero Demo: Voice to $5K Legal Document in 30 Seconds',
    description: 'Primary Product Hunt video showing voice-to-demand letter transformation',
    dimensions: '1920x1080',
    file_size: '15MB',
    viral_score: 10,
    usage: 'hero',
    status: 'approved',
    created_at: '2025-09-22T00:00:00Z'
  },
  {
    id: 'marketplace-screenshot',
    type: 'screenshot',
    title: 'AI Agent Marketplace - GPT-Style Discovery',
    description: 'Professional agent cards with ratings, pricing, and specialties',
    dimensions: '2560x1440',
    file_size: '2.1MB',
    viral_score: 8,
    usage: 'gallery',
    status: 'approved',
    created_at: '2025-09-22T00:00:00Z'
  },
  {
    id: 'voice-canvas-gif',
    type: 'gif',
    title: 'Voice Commands → Canvas Document',
    description: 'Animated GIF showing voice input creating professional document',
    dimensions: '800x600',
    file_size: '4.2MB',
    viral_score: 9,
    usage: 'social',
    status: 'approved',
    created_at: '2025-09-22T00:00:00Z'
  },
  {
    id: 'creator-onboarding-flow',
    type: 'screenshot',
    title: 'Creator Onboarding: Bronze Tier Verification',
    description: 'Professional verification and knowledge base upload process',
    dimensions: '1920x1080',
    file_size: '1.8MB',
    viral_score: 7,
    usage: 'gallery',
    status: 'approved',
    created_at: '2025-09-22T00:00:00Z'
  },
  {
    id: 'revenue-dashboard',
    type: 'screenshot',
    title: 'Creator Revenue Dashboard - 70/30 Split',
    description: 'Earnings tracking, payout history, subscription analytics',
    dimensions: '1920x1080',
    file_size: '1.5MB',
    viral_score: 8,
    usage: 'gallery',
    status: 'approved',
    created_at: '2025-09-22T00:00:00Z'
  }
];

const HUNTER_NETWORK: HunterContact[] = [
  {
    id: 'ryan-hoover',
    name: 'Ryan Hoover',
    twitter_handle: '@rrhoover',
    email: 'ryan@producthunt.com',
    follower_count: 234567,
    engagement_rate: 4.2,
    specializes_in: ['AI Tools', 'Productivity', 'Startups'],
    relationship_strength: 'warm',
    previous_hunts: ['Notion', 'Figma', 'Linear'],
    commitment_status: 'confirmed',
    contact_date: '2025-09-20T00:00:00Z',
    notes: 'Founder of Product Hunt, loves AI productivity tools'
  },
  {
    id: 'kevin-william-david',
    name: 'Kevin William David',
    twitter_handle: '@kwdinc',
    email: 'kevin@kwdinc.com',
    follower_count: 127834,
    engagement_rate: 3.8,
    specializes_in: ['SaaS', 'AI', 'Marketing Tools'],
    relationship_strength: 'hot',
    previous_hunts: ['Jasper AI', 'Copy.ai', 'Writesonic'],
    commitment_status: 'confirmed',
    contact_date: '2025-09-21T00:00:00Z',
    notes: 'AI tool expert, strong network in legal/medical tech'
  },
  {
    id: 'andrew-chen',
    name: 'Andrew Chen',
    twitter_handle: '@andrewchen',
    email: 'andrew@a16z.com',
    follower_count: 178923,
    engagement_rate: 5.1,
    specializes_in: ['Growth', 'B2B SaaS', 'Professional Tools'],
    relationship_strength: 'warm',
    previous_hunts: ['Slack', 'Zoom', 'Calendly'],
    commitment_status: 'pending',
    notes: 'a16z partner, loves B2B productivity innovations'
  },
  {
    id: 'sahil-lavingia',
    name: 'Sahil Lavingia',
    twitter_handle: '@shl',
    email: 'sahil@gumroad.com',
    follower_count: 145672,
    engagement_rate: 4.7,
    specializes_in: ['Creator Economy', 'Marketplaces', 'AI'],
    relationship_strength: 'warm',
    previous_hunts: ['Gumroad', 'Creator tools', 'AI assistants'],
    commitment_status: 'confirmed',
    contact_date: '2025-09-21T00:00:00Z',
    notes: 'Perfect for creator marketplace angle'
  },
  {
    id: 'ben-tossell',
    name: 'Ben Tossell',
    twitter_handle: '@bentossell',
    email: 'ben@makerpad.co',
    follower_count: 89234,
    engagement_rate: 6.2,
    specializes_in: ['No-Code', 'AI Tools', 'Automation'],
    relationship_strength: 'hot',
    previous_hunts: ['Zapier', 'Airtable', 'AI no-code tools'],
    commitment_status: 'confirmed',
    contact_date: '2025-09-22T00:00:00Z',
    notes: 'Loves voice-first automation, high engagement'
  }
];

const LAUNCH_STRATEGY: LaunchStrategy = {
  launch_date: '2025-09-25T00:01:00Z', // Wednesday launch for max visibility
  target_votes: 2500,
  target_comments: 300,
  hunter_goal: 50,
  social_reach_goal: 1000000,
  press_mentions_goal: 25,
  timeline: [
    {
      id: 'asset-finalization',
      title: 'Finalize All Launch Assets',
      description: 'Complete hero video, screenshots, GIFs, and social content',
      due_date: '2025-09-23T18:00:00Z',
      owner: 'Design Team',
      status: 'completed',
      dependencies: []
    },
    {
      id: 'hunter-outreach',
      title: 'Activate Hunter Network',
      description: 'Confirm commitments from 50+ top hunters and influencers',
      due_date: '2025-09-24T12:00:00Z',
      owner: 'Marketing Team',
      status: 'in-progress',
      dependencies: ['asset-finalization']
    },
    {
      id: 'press-kit',
      title: 'Distribute Press Kit',
      description: 'Send to TechCrunch, VentureBeat, AI publications',
      due_date: '2025-09-24T15:00:00Z',
      owner: 'PR Team',
      status: 'not-started',
      dependencies: ['asset-finalization']
    },
    {
      id: 'social-content',
      title: 'Schedule Social Media Blitz',
      description: 'Twitter, LinkedIn threads, demo videos across all channels',
      due_date: '2025-09-24T20:00:00Z',
      owner: 'Social Team',
      status: 'not-started',
      dependencies: ['hunter-outreach']
    },
    {
      id: 'launch-day',
      title: 'Product Hunt Launch',
      description: 'Go live at 12:01 AM PST, coordinate hunter activation',
      due_date: '2025-09-25T00:01:00Z',
      owner: 'Full Team',
      status: 'not-started',
      dependencies: ['hunter-outreach', 'press-kit', 'social-content']
    }
  ],
  messaging: {
    headline: '🚀 GenieFlow AI: Voice Commands → Professional Documents in 30 Seconds',
    tagline: 'The first voice-first AI marketplace for legal and medical professionals',
    value_props: [
      'Generate $5K demand letters with voice commands',
      'Create IME reports in 45 seconds',
      'Professional AI agents by verified experts',
      'Creator marketplace with 70/30 revenue sharing',
      'No typing, no templates - just speak naturally'
    ],
    viral_hooks: [
      'Watch a lawyer create a $5,000 demand letter in 30 seconds using only voice commands',
      'The ChatGPT for legal professionals just launched',
      'This AI turns voice into professional documents instantly',
      'Finally: voice-first productivity for knowledge workers',
      'The future of professional work is voice-activated'
    ]
  }
};

// Launch Asset Gallery Component
const LaunchAssetGallery: React.FC<{
  assets: LaunchAsset[];
  onPreview: (asset: LaunchAsset) => void;
  onDownload: (asset: LaunchAsset) => void;
}> = ({ assets, onPreview, onDownload }) => {
  const [filter, setFilter] = useState<'all' | 'hero' | 'gallery' | 'social'>('all');

  const filteredAssets = assets.filter(asset => 
    filter === 'all' || asset.usage === filter
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return '🎬';
      case 'screenshot': return '📸';
      case 'gif': return '🎞️';
      case 'logo': return '🎨';
      case 'banner': return '🖼️';
      default: return '📁';
    }
  };

  const getViralColor = (score: number) => {
    if (score >= 9) return 'text-red-600 bg-red-100';
    if (score >= 7) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Launch Assets</h3>
        
        <div className="flex space-x-2">
          {['all', 'hero', 'gallery', 'social'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption as any)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filter === filterOption
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssets.map((asset) => (
          <div key={asset.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            {/* Asset Preview */}
            <div 
              className="aspect-video bg-gray-900 relative cursor-pointer group"
              onClick={() => onPreview(asset)}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-4xl">{getTypeIcon(asset.type)}</div>
              </div>
              <div className="absolute top-2 left-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getViralColor(asset.viral_score)}`}>
                  🔥 {asset.viral_score}/10
                </span>
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Asset Info */}
            <div className="p-4">
              <h4 className="font-semibold text-gray-900 mb-2">{asset.title}</h4>
              <p className="text-sm text-gray-600 mb-3">{asset.description}</p>
              
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span>{asset.dimensions}</span>
                <span>{asset.file_size}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  asset.status === 'approved' ? 'bg-green-100 text-green-800' :
                  asset.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {asset.status}
                </span>

                <div className="flex space-x-2">
                  <button
                    onClick={() => onPreview(asset)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDownload(asset)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Hunter Network Component
const HunterNetwork: React.FC<{
  hunters: HunterContact[];
  onContact: (hunter: HunterContact) => void;
  onBulkContact: (hunters: HunterContact[]) => void;
}> = ({ hunters, onContact, onBulkContact }) => {
  const [selectedHunters, setSelectedHunters] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending' | 'hot'>('all');

  const filteredHunters = hunters.filter(hunter => {
    switch (filter) {
      case 'confirmed': return hunter.commitment_status === 'confirmed';
      case 'pending': return hunter.commitment_status === 'pending';
      case 'hot': return hunter.relationship_strength === 'hot';
      default: return true;
    }
  });

  const toggleSelection = (hunterId: string) => {
    setSelectedHunters(prev => 
      prev.includes(hunterId) 
        ? prev.filter(id => id !== hunterId)
        : [...prev, hunterId]
    );
  };

  const getRelationshipColor = (strength: string) => {
    switch (strength) {
      case 'hot': return 'text-red-600 bg-red-100';
      case 'warm': return 'text-yellow-600 bg-yellow-100';
      case 'cold': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCommitmentColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'declined': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Hunter Network ({hunters.length})
        </h3>
        
        {selectedHunters.length > 0 && (
          <button
            onClick={() => onBulkContact(hunters.filter(h => selectedHunters.includes(h.id)))}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Contact {selectedHunters.length} Hunters</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex space-x-2 mb-6">
        {['all', 'confirmed', 'pending', 'hot'].map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption as any)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filter === filterOption
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
          </button>
        ))}
      </div>

      {/* Hunter List */}
      <div className="space-y-4">
        {filteredHunters.map((hunter) => (
          <div key={hunter.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
            <div className="flex items-start space-x-4">
              <input
                type="checkbox"
                checked={selectedHunters.includes(hunter.id)}
                onChange={() => toggleSelection(hunter.id)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />

              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                {hunter.name.split(' ').map(n => n.charAt(0)).join('')}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{hunter.name}</h4>
                    <p className="text-blue-600">{hunter.twitter_handle}</p>
                    <p className="text-gray-600 text-sm">{hunter.follower_count.toLocaleString()} followers • {hunter.engagement_rate}% engagement</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRelationshipColor(hunter.relationship_strength)}`}>
                      {hunter.relationship_strength}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCommitmentColor(hunter.commitment_status)}`}>
                      {hunter.commitment_status}
                    </span>
                  </div>
                </div>

                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Specializes in:</span> {hunter.specializes_in.join(', ')}
                  </p>
                  {hunter.notes && (
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Notes:</span> {hunter.notes}
                    </p>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Previous hunts: {hunter.previous_hunts.slice(0, 2).join(', ')}
                    {hunter.previous_hunts.length > 2 && ` +${hunter.previous_hunts.length - 2} more`}
                  </div>

                  <button
                    onClick={() => onContact(hunter)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      hunter.commitment_status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {hunter.commitment_status === 'confirmed' ? 'Confirmed ✓' : 'Contact'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Launch Timeline Component
const LaunchTimeline: React.FC<{
  strategy: LaunchStrategy;
  onUpdateMilestone: (milestoneId: string, status: string) => void;
}> = ({ strategy, onUpdateMilestone }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-yellow-500';
      case 'not-started': return 'bg-gray-300';
      default: return 'bg-gray-300';
    }
  };

  const getDaysUntil = (dateString: string) => {
    const targetDate = new Date(dateString);
    const now = new Date();
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Launch Timeline</h3>
        <div className="text-sm text-gray-600">
          Launch Date: {new Date(strategy.launch_date).toLocaleDateString()}
        </div>
      </div>

      <div className="space-y-6">
        {strategy.timeline.map((milestone, index) => {
          const daysUntil = getDaysUntil(milestone.due_date);
          const isOverdue = daysUntil < 0 && milestone.status !== 'completed';

          return (
            <div key={milestone.id} className="relative">
              {/* Timeline Line */}
              {index < strategy.timeline.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
              )}

              <div className="flex items-start space-x-4">
                {/* Status Indicator */}
                <div className={`w-12 h-12 rounded-full ${getStatusColor(milestone.status)} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                  {milestone.status === 'completed' ? '✓' : index + 1}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{milestone.title}</h4>
                      <p className="text-gray-600 mt-1">{milestone.description}</p>
                      <p className="text-sm text-gray-500 mt-2">Owner: {milestone.owner}</p>
                    </div>

                    <div className="text-right">
                      <div className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                        {daysUntil === 0 ? 'Today' : 
                         daysUntil === 1 ? 'Tomorrow' :
                         daysUntil > 0 ? `${daysUntil} days` :
                         `${Math.abs(daysUntil)} days overdue`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(milestone.due_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Status Update */}
                  <div className="mt-3 flex items-center space-x-2">
                    <select
                      value={milestone.status}
                      onChange={(e) => onUpdateMilestone(milestone.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="not-started">Not Started</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>

                    {milestone.dependencies.length > 0 && (
                      <div className="text-xs text-gray-500">
                        Depends on: {milestone.dependencies.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Launch Goals */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-4">Launch Goals</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{strategy.target_votes.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Target Votes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{strategy.target_comments}</div>
            <div className="text-sm text-gray-600">Comments</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{strategy.hunter_goal}</div>
            <div className="text-sm text-gray-600">Hunters</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{(strategy.social_reach_goal / 1000000).toFixed(1)}M</div>
            <div className="text-sm text-gray-600">Social Reach</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Viral Messaging Component
const ViralMessaging: React.FC<{
  messaging: LaunchStrategy['messaging'];
}> = ({ messaging }) => {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Viral Messaging Kit</h3>

      <div className="space-y-6">
        {/* Headline */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">Main Headline</h4>
            <button
              onClick={() => copyToClipboard(messaging.headline, 'headline')}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <Copy className="w-4 h-4" />
              <span>{copiedText === 'headline' ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-lg font-semibold text-gray-900">{messaging.headline}</p>
          </div>
        </div>

        {/* Tagline */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">Tagline</h4>
            <button
              onClick={() => copyToClipboard(messaging.tagline, 'tagline')}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <Copy className="w-4 h-4" />
              <span>{copiedText === 'tagline' ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700">{messaging.tagline}</p>
          </div>
        </div>

        {/* Value Props */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Key Value Propositions</h4>
          <div className="space-y-2">
            {messaging.value_props.map((prop, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <p className="text-gray-700">• {prop}</p>
                <button
                  onClick={() => copyToClipboard(prop, `prop-${index}`)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {copiedText === `prop-${index}` ? 'Copied!' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Viral Hooks */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Viral Social Hooks 🔥</h4>
          <div className="space-y-3">
            {messaging.viral_hooks.map((hook, index) => (
              <div key={index} className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <p className="text-gray-800 font-medium">{hook}</p>
                  <button
                    onClick={() => copyToClipboard(hook, `hook-${index}`)}
                    className="text-sm text-red-600 hover:text-red-800 ml-2"
                  >
                    {copiedText === `hook-${index}` ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social Media Templates */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Social Media Templates</h4>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-gray-800">Twitter Thread Starter</h5>
                <button
                  onClick={() => copyToClipboard(`🧵 THREAD: ${messaging.viral_hooks[0]}\n\nI just discovered something that's going to change how professionals work forever...\n\n1/12 👇`, 'twitter-thread')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {copiedText === 'twitter-thread' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="bg-blue-50 rounded p-3 text-sm">
                <p>🧵 THREAD: {messaging.viral_hooks[0]}</p>
                <p className="mt-2">I just discovered something that's going to change how professionals work forever...</p>
                <p className="mt-1 text-blue-600">1/12 👇</p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-gray-800">LinkedIn Post</h5>
                <button
                  onClick={() => copyToClipboard(`${messaging.viral_hooks[1]}\n\n${messaging.tagline}\n\n✅ ${messaging.value_props.slice(0,3).join('\n✅ ')}\n\nThis is the future of professional productivity. What do you think?\n\n#AI #LegalTech #MedTech #ProductHunt`, 'linkedin-post')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {copiedText === 'linkedin-post' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="bg-blue-50 rounded p-3 text-sm">
                <p>{messaging.viral_hooks[1]}</p>
                <p className="mt-2">{messaging.tagline}</p>
                <p className="mt-2">✅ {messaging.value_props.slice(0,3).join('\n✅ ')}</p>
                <p className="mt-2">This is the future of professional productivity. What do you think?</p>
                <p className="mt-2 text-blue-600">#AI #LegalTech #MedTech #ProductHunt</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Product Hunt Launch Component
export const ProductHuntLaunch: React.FC = () => {
  const [currentView, setCurrentView] = useState<'overview' | 'assets' | 'hunters' | 'timeline' | 'messaging'>('overview');
  const [strategy, setStrategy] = useState<LaunchStrategy>(LAUNCH_STRATEGY);
  const [assets] = useState<LaunchAsset[]>(LAUNCH_ASSETS);
  const [hunters] = useState<HunterContact[]>(HUNTER_NETWORK);

  // Calculate launch readiness score
  const getReadinessScore = () => {
    const completedMilestones = strategy.timeline.filter(m => m.status === 'completed').length;
    const confirmedHunters = hunters.filter(h => h.commitment_status === 'confirmed').length;
    const approvedAssets = assets.filter(a => a.status === 'approved').length;
    
    const milestoneScore = (completedMilestones / strategy.timeline.length) * 40;
    const hunterScore = (confirmedHunters / strategy.hunter_goal) * 30;
    const assetScore = (approvedAssets / assets.length) * 30;
    
    return Math.round(milestoneScore + hunterScore + assetScore);
  };

  const handleAssetPreview = (asset: LaunchAsset) => {
    alert(`Preview: ${asset.title}\n\nThis would open a modal with the asset preview.`);
  };

  const handleAssetDownload = (asset: LaunchAsset) => {
    alert(`Downloading: ${asset.title}\n\nFile would be downloaded to your device.`);
  };

  const handleContactHunter = (hunter: HunterContact) => {
    const message = `Hi ${hunter.name}! 👋\n\nWe're launching GenieFlow AI on Product Hunt this Wednesday - the first voice-first AI marketplace for legal and medical professionals.\n\n🚀 Key highlights:\n• Voice commands → Professional documents in 30 seconds\n• Creator marketplace with verified experts\n• Already tested by 50+ beta users\n\nWould you be interested in hunting us? I'd love to send you early access!\n\nBest,\nSarah`;
    
    if (hunter.email) {
      alert(`Email drafted to ${hunter.name}:\n\n${message}`);
    } else {
      alert(`Twitter DM drafted to ${hunter.twitter_handle}:\n\n${message}`);
    }
  };

  const handleBulkContact = (selectedHunters: HunterContact[]) => {
    alert(`Sending personalized messages to ${selectedHunters.length} hunters:\n\n${selectedHunters.map(h => h.name).join('\n')}`);
  };

  const handleUpdateMilestone = (milestoneId: string, newStatus: string) => {
    setStrategy(prev => ({
      ...prev,
      timeline: prev.timeline.map(milestone =>
        milestone.id === milestoneId
          ? { ...milestone, status: newStatus as any }
          : milestone
      )
    }));
  };

  const readinessScore = getReadinessScore();
  const daysToLaunch = Math.ceil((new Date(strategy.launch_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🏆 Product Hunt Launch Command Center
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Complete launch system targeting #1 Product of the Day with viral content and hunter network
        </p>
      </div>

      {/* Launch Status Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Launch Readiness</p>
              <p className="text-3xl font-bold text-gray-900">{readinessScore}%</p>
            </div>
            <Trophy className={`w-8 h-8 ${readinessScore >= 90 ? 'text-gold-500' : 'text-gray-400'}`} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Days to Launch</p>
              <p className="text-3xl font-bold text-gray-900">{daysToLaunch}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Confirmed Hunters</p>
              <p className="text-3xl font-bold text-gray-900">
                {hunters.filter(h => h.commitment_status === 'confirmed').length}
              </p>
            </div>
            <Users className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Assets Ready</p>
              <p className="text-3xl font-bold text-gray-900">
                {assets.filter(a => a.status === 'approved').length}/{assets.length}
              </p>
            </div>
            <Star className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 rounded-lg p-1 flex space-x-1">
          {[
            { id: 'overview', label: 'Overview', icon: Target },
            { id: 'assets', label: 'Assets', icon: Star },
            { id: 'hunters', label: 'Hunters', icon: Users },
            { id: 'timeline', label: 'Timeline', icon: Clock },
            { id: 'messaging', label: 'Messaging', icon: Share2 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id as any)}
              className={`px-4 py-2 rounded-md transition-colors flex items-center space-x-2 ${
                currentView === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {currentView === 'overview' && (
        <div className="space-y-8">
          {/* Quick Stats */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">🚀 Launch Strategy Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Target Metrics</h3>
                <ul className="space-y-1 text-sm opacity-90">
                  <li>• {strategy.target_votes.toLocaleString()} votes</li>
                  <li>• {strategy.target_comments} comments</li>
                  <li>• {strategy.hunter_goal} hunters activated</li>
                  <li>• {(strategy.social_reach_goal / 1000000).toFixed(1)}M social reach</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Launch Assets</h3>
                <ul className="space-y-1 text-sm opacity-90">
                  <li>• Hero demo video (30 sec)</li>
                  <li>• Marketplace screenshots</li>
                  <li>• Voice→Document GIFs</li>
                  <li>• Social media kit</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Hunter Network</h3>
                <ul className="space-y-1 text-sm opacity-90">
                  <li>• Ryan Hoover (PH Founder)</li>
                  <li>• Kevin William David</li>
                  <li>• Sahil Lavingia</li>
                  <li>• Ben Tossell + 46 more</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Key Components */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <LaunchTimeline 
              strategy={strategy}
              onUpdateMilestone={handleUpdateMilestone}
            />
            <ViralMessaging messaging={strategy.messaging} />
          </div>
        </div>
      )}

      {currentView === 'assets' && (
        <LaunchAssetGallery
          assets={assets}
          onPreview={handleAssetPreview}
          onDownload={handleAssetDownload}
        />
      )}

      {currentView === 'hunters' && (
        <HunterNetwork
          hunters={hunters}
          onContact={handleContactHunter}
          onBulkContact={handleBulkContact}
        />
      )}

      {currentView === 'timeline' && (
        <LaunchTimeline 
          strategy={strategy}
          onUpdateMilestone={handleUpdateMilestone}
        />
      )}

      {currentView === 'messaging' && (
        <ViralMessaging messaging={strategy.messaging} />
      )}

      {/* Launch Action */}
      {readinessScore >= 90 && (
        <div className="fixed bottom-8 right-8">
          <button className="bg-red-600 text-white px-8 py-4 rounded-full shadow-lg hover:bg-red-700 transition-colors flex items-center space-x-3 text-lg font-semibold">
            <Rocket className="w-6 h-6" />
            <span>Launch on Product Hunt!</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductHuntLaunch;