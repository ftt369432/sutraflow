// 🚀 Quick Agent Creation Component
// One-click agent deployment interface

'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAIStore } from '@/stores/useAIStore';
import { StreamlinedAgentCreator, agentBlueprints, quickCreateTemplates } from '@/services/StreamlinedAgentCreator';
import { Zap, Sparkles, Rocket, Crown, Star, Plus, ArrowRight } from 'lucide-react';

interface QuickCreateCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  tier: 'base' | 'premium' | 'enterprise';
  price?: number;
  onClick: () => void;
  popular?: boolean;
}

const QuickCreateCard: React.FC<QuickCreateCardProps> = ({
  title, description, icon, tier, price, onClick, popular
}) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    className={`relative p-6 rounded-xl cursor-pointer transition-all duration-300 ${
      tier === 'premium' ? 'bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-purple-500/30' :
      tier === 'enterprise' ? 'bg-gradient-to-br from-gold-900/20 to-yellow-900/20 border border-gold-500/30' :
      'bg-gray-800/50 border border-gray-600/30'
    } hover:border-purple-400/50 group`}
    onClick={onClick}
  >
    {popular && (
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
          <Star className="w-3 h-3" />
          Popular
        </div>
      </div>
    )}
    
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
        {icon}
      </div>
      {tier === 'premium' && (
        <Crown className="w-5 h-5 text-purple-400" />
      )}
    </div>
    
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p className="text-gray-400 text-sm mb-4 leading-relaxed">{description}</p>
    
    <div className="flex items-center justify-between">
      <div className="text-xs">
        {tier === 'base' ? (
          <span className="text-green-400 font-semibold">FREE</span>
        ) : (
          <span className="text-purple-400 font-semibold">${price}/mo</span>
        )}
      </div>
      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" />
    </div>
  </motion.div>
);

const QuickAgentCreator: React.FC = () => {
  const { addAssistant } = useAIStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customizing, setCustomizing] = useState<string | null>(null);
  const [customData, setCustomData] = useState({
    niche: '',
    platforms: [] as string[],
    industry: '',
    specialization: ''
  });

  const createAgent = async (templateKey: string, customizations?: any) => {
    try {
      let newAgent;
      
      if (templateKey in quickCreateTemplates) {
        newAgent = (quickCreateTemplates as any)[templateKey]();
      } else {
        newAgent = StreamlinedAgentCreator.createFromBlueprint(templateKey, customizations);
      }
      
      await addAssistant(newAgent);
      
      // Show success notification
      console.log('Agent created successfully!', newAgent);
      
      // Reset customization state
      setCustomizing(null);
      setCustomData({ niche: '', platforms: [], industry: '', specialization: '' });
      
    } catch (error) {
      console.error('Failed to create agent:', error);
    }
  };

  const quickTemplates = [
    {
      key: 'tiktok-creator',
      title: 'TikTok Creator',
      description: 'Viral TikTok content creation and growth optimization',
      icon: <Zap className="w-5 h-5 text-purple-400" />,
      tier: 'premium' as const,
      price: 19.99,
      popular: true
    },
    {
      key: 'instagram-influencer',
      title: 'Instagram Influencer',
      description: 'Instagram content strategy and aesthetic optimization',
      icon: <Sparkles className="w-5 h-5 text-pink-400" />,
      tier: 'premium' as const,
      price: 19.99
    },
    {
      key: 'youtube-educator',
      title: 'YouTube Educator',
      description: 'Educational content creation and channel growth',
      icon: <Rocket className="w-5 h-5 text-red-400" />,
      tier: 'premium' as const,
      price: 19.99
    },
    {
      key: 'multi-platform-creator',
      title: 'Multi-Platform Creator',
      description: 'Cross-platform content strategy and management',
      icon: <Star className="w-5 h-5 text-gold-400" />,
      tier: 'premium' as const,
      price: 29.99,
      popular: true
    },
    {
      key: 'startup-advisor',
      title: 'Startup Advisor',
      description: 'Business strategy and growth optimization',
      icon: <Rocket className="w-5 h-5 text-blue-400" />,
      tier: 'premium' as const,
      price: 39.99
    },
    {
      key: 'productivity-coach',
      title: 'Productivity Coach',
      description: 'Personal productivity and efficiency optimization',
      icon: <Zap className="w-5 h-5 text-green-400" />,
      tier: 'base' as const,
      price: 0
    }
  ];

  const customBlueprints = Object.entries(agentBlueprints).map(([key, blueprint]) => ({
    key,
    title: blueprint.name,
    description: blueprint.description,
    tier: blueprint.metadata?.tier || 'base',
    price: blueprint.metadata?.priceMonthly || 0,
    icon: <Plus className="w-5 h-5 text-purple-400" />
  }));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2">
          Quick Agent Creation
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Deploy powerful AI assistants in seconds with our streamlined creation system
        </p>
      </motion.div>

      {/* Quick Templates */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-400" />
          Quick Deploy Templates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickTemplates.map((template) => (
            <QuickCreateCard
              key={template.key}
              title={template.title}
              description={template.description}
              icon={template.icon}
              tier={template.tier}
              price={template.price}
              popular={template.popular}
              onClick={() => createAgent(template.key)}
            />
          ))}
        </div>
      </div>

      {/* Custom Blueprints */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-gold-400" />
          Custom Blueprints
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customBlueprints.map((blueprint) => (
            <QuickCreateCard
              key={blueprint.key}
              title={blueprint.title}
              description={blueprint.description}
              icon={blueprint.icon}
              tier={blueprint.tier}
              price={blueprint.price}
              onClick={() => setCustomizing(blueprint.key)}
            />
          ))}
        </div>
      </div>

      {/* Customization Modal */}
      {customizing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setCustomizing(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-white mb-4">
              Customize {agentBlueprints[customizing]?.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Niche/Specialization
                </label>
                <input
                  type="text"
                  value={customData.niche}
                  onChange={(e) => setCustomData({ ...customData, niche: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  placeholder="e.g., fitness, cooking, tech reviews"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Platforms
                </label>
                <input
                  type="text"
                  value={customData.platforms.join(', ')}
                  onChange={(e) => setCustomData({ 
                    ...customData, 
                    platforms: e.target.value.split(',').map(p => p.trim()).filter(Boolean)
                  })}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  placeholder="e.g., tiktok, instagram, youtube"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  value={customData.industry}
                  onChange={(e) => setCustomData({ ...customData, industry: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  placeholder="e.g., healthcare, finance, education"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setCustomizing(null)}
                className="flex-1 py-2 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => createAgent(customizing, customData)}
                className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all"
              >
                Create Agent
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default QuickAgentCreator;