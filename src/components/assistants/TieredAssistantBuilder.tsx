import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/progress';
import { 
  Brain, 
  MessageSquare, 
  Target, 
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Users,
  TrendingUp,
  Settings,
  Bot,
  Star,
  Crown,
  Zap,
  Shield,
  Layers,
  Send,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { geminiSimplifiedService } from '../../services/gemini-simplified';
import { assistantTrainingService } from '../../services/assistantTrainingService';
import type { AIAssistant } from '../../types/ai';
import { 
  tierManager, 
  TierDefinition, 
  TierProfile, 
  getNextAvailableTier,
  calculateCompletionPercentage 
} from './TierArchitectureSystem';

interface TierQuestion {
  id: string;
  tier: 1 | 2 | 3 | 4 | 5;
  category: string;
  question: string;
  purpose: string;
  followUp?: string[];
  options?: string[];
  multiSelect?: boolean;
}

const TIERED_CONSCIOUSNESS_QUESTIONS: TierQuestion[] = [
  // TIER 1: ULTIMATE CORE IDENTITY
  {
    id: 'core_identity_architect',
    tier: 1,
    category: 'Elite Identity Architecture',
    question: "🏆 **TIER 1 - CORE IDENTITY**: What ultimate elite identity should this assistant embody? Think: 'Elite Strategic Life Architect', 'Master Trading Psychology Genius', 'Ultimate Health Optimization Expert'",
    purpose: "Define the highest-level identity that encompasses expertise, authority, and transformational capability",
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
  },

  // TIER 2: CONSCIOUSNESS SYNTHESIS  
  {
    id: 'consciousness_synthesis',
    tier: 2,
    category: 'Master Consciousness Synthesis',
    question: "🧠 **TIER 2 - CONSCIOUSNESS SYNTHESIS**: Which 3-5 world-class experts should this assistant synthesize? Select the ultimate combination:",
    purpose: "Create a unique consciousness by combining the best thinking patterns from multiple domain masters",
    multiSelect: true,
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
  },

  // TIER 3: ADVANCED COGNITIVE CAPABILITIES
  {
    id: 'advanced_capabilities',
    tier: 3,
    category: 'Superhuman Cognitive Architecture',
    question: "⚡ **TIER 3 - ADVANCED CAPABILITIES**: What superhuman cognitive abilities should this assistant possess? Select the most powerful ones:",
    purpose: "Define advanced thinking capabilities that go beyond basic AI assistance",
    multiSelect: true,
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
  },

  // TIER 4: ELITE COMMUNICATION PROTOCOLS
  {
    id: 'communication_consciousness',
    tier: 4,
    category: 'Elite Communication Architecture',
    question: "💬 **TIER 4 - COMMUNICATION PROTOCOL**: How should this assistant communicate to match your elite operating level?",
    purpose: "Define communication patterns that match high-performance thinking and decision-making",
    options: [
      "🎯 Executive Strategic Partner - Deep wisdom + urgent action bias + 3-level depth",
      "👑 Master-Level Mentor - Challenge assumptions + push beyond comfort zones + elevated thinking",
      "⚡ Tactical Optimizer - Quick wins + strategic context + measurable outcomes",
      "🧭 Philosophical Strategist - Deep insights + practical applications + wisdom synthesis",
      "🏆 Results-Focused Coach - Accountability + momentum + exponential growth tracking"
    ]
  },

  // TIER 5: ULTIMATE OPERATIONAL EXCELLENCE
  {
    id: 'operational_excellence',
    tier: 5,
    category: 'Ultimate Growth Acceleration System',
    question: "🚀 **TIER 5 - OPERATIONAL EXCELLENCE**: How should this assistant create exponential growth rather than linear improvement?",
    purpose: "Define systems that push beyond comfort zones into mastery territory",
    multiSelect: true,
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
];

interface DynamicTieredAssistantBuilderProps {
  assistant: AIAssistant;
  onSystemPromptGenerated: (prompt: string) => void;
  onProfileComplete: (profile: TierProfile) => void;
}

export function TieredAssistantBuilder({ 
  assistant, 
  onSystemPromptGenerated,
  onProfileComplete 
}: DynamicTieredAssistantBuilderProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [profile, setProfile] = useState<TierProfile>({
    completionPercentage: 0,
    completedTiers: []
  });
  const [currentTier, setCurrentTier] = useState<TierDefinition | null>(null);
  const [availableTiers, setAvailableTiers] = useState<TierDefinition[]>([]);
  const [showTierManager, setShowTierManager] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize available tiers and set first tier
  useEffect(() => {
    const tiers = tierManager.getAvailableTiers(profile.completedTiers);
    setAvailableTiers(tiers);
    
    if (!currentTier && tiers.length > 0) {
      setCurrentTier(tiers[0]);
    }
  }, [profile.completedTiers]);

  // Initialize with dynamic welcome message
  useEffect(() => {
    const totalTiers = tierManager.getAllTiers().length;
    const coreTiers = tierManager.getAllTiers().filter(t => t.required).length;
    const extendedTiers = totalTiers - coreTiers;

    setMessages([
      {
        role: 'assistant',
        content: `🧠✨ **Welcome to the Dynamic Tiered Assistant Builder!**

I'm going to help you create an **elite-level AI consciousness** using our expandable tiered architecture. This system grows with your needs!

**🏗️ Available Architecture:**
🏆 **Core Tiers (1-${coreTiers})**: Essential consciousness foundation
⚡ **Extended Tiers (${coreTiers + 1}-${totalTiers})**: Advanced specializations  
🎯 **Custom Tiers**: Your own unique additions

**🔧 Expandable Features:**
- Add custom tiers for your specific needs
- Modify existing questions and options
- Unlock advanced tiers as you progress
- Save and reuse tier templates

Current available tiers: **${availableTiers.length}**

Ready to build your ultimate assistant? Type 'start' to begin with Tier 1, 'manage' to customize tiers, or tell me your specific goals.`,
        timestamp: new Date(),
        metadata: { phase: 'welcome' }
      }
    ]);
  }, [availableTiers.length]);

  const handleSendMessage = async () => {
    if (!currentInput.trim()) return;

    const userMessage = {
      role: 'user',
      content: currentInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentInput('');
    setIsThinking(true);

    await processUserInput(currentInput);
  };

  const processUserInput = async (input: string) => {
    const inputLower = input.toLowerCase();

    try {
      if (inputLower.includes('manage') || inputLower.includes('customize')) {
        setShowTierManager(true);
        addAssistantMessage(`🔧 **Tier Management Panel**

You can now:
- ➕ Add custom tiers for your specific needs
- ✏️ Modify existing tier questions
- 🗑️ Remove custom tiers
- 📋 View all available tiers

Use the tier management panel that's now available, or type 'start' to begin building with the current tier structure.`, 'tier_management');
      } else if (inputLower.includes('start') || inputLower.includes('begin') || inputLower.includes('ready')) {
        await startTierProcess();
      } else if (currentTier) {
        await handleTierResponse(input);
      } else {
        // Analyze goals and suggest approach
        const customResponse = await analyzeGoalsAndSuggestApproach(input);
        addAssistantMessage(customResponse, 'goal_analysis');
      }
    } catch (error) {
      console.error('Error processing input:', error);
      addAssistantMessage("I encountered an error processing your response. Please try again.", 'error');
    } finally {
      setIsThinking(false);
    }
  };

  const startTierProcess = async () => {
    const nextTier = getNextAvailableTier(profile.completedTiers);
    if (nextTier) {
      setCurrentTier(nextTier);
      const tierIcon = getTierIcon(nextTier.tier);
      addAssistantMessage(`${tierIcon} **${nextTier.name.toUpperCase()}**

${nextTier.questions[0]?.question || 'No questions available for this tier.'}

${nextTier.description}`, `tier_${nextTier.tier}_start`);
    } else {
      addAssistantMessage("🎉 All available tiers completed! You can add custom tiers or generate your final assistant.", 'all_complete');
    }
  };

  const handleTierResponse = async (input: string) => {
    if (!currentTier) return;

    // Process the response for current tier
    const tierData = await processTierResponse(currentTier, input);
    
    // Update profile with tier data
    setProfile(prev => {
      const updated = {
        ...prev,
        [`tier_${currentTier.tier}`]: tierData,
        completedTiers: [...prev.completedTiers, currentTier.tier],
        completionPercentage: calculateCompletionPercentage([...prev.completedTiers, currentTier.tier])
      };
      return updated;
    });

    // Move to next tier or complete
    const nextTier = getNextAvailableTier([...profile.completedTiers, currentTier.tier]);
    if (nextTier) {
      setCurrentTier(nextTier);
      const tierIcon = getTierIcon(nextTier.tier);
      addAssistantMessage(`✅ **Tier ${currentTier.tier} Complete!**

${tierIcon} **Moving to ${nextTier.name.toUpperCase()}**

${nextTier.questions[0]?.question || 'No questions available for this tier.'}`, `tier_${nextTier.tier}_start`);
    } else {
      // All tiers complete, generate system prompt
      await generateDynamicSystemPrompt();
    }
  };

  const processTierResponse = async (tier: TierDefinition, input: string): Promise<any> => {
    // Extract responses based on tier questions
    const question = tier.questions[0]; // For now, handle first question
    if (!question) return {};

    if (question.multiSelect && question.options) {
      // Multi-select processing
      const selectedOptions: string[] = [];
      question.options.forEach(option => {
        if (input.toLowerCase().includes(option.toLowerCase().substring(0, 15))) {
          selectedOptions.push(option);
        }
      });
      return { [question.id]: selectedOptions };
    } else if (question.options) {
      // Single select processing
      const selectedOption = question.options.find(option => 
        input.toLowerCase().includes(option.toLowerCase().substring(0, 15))
      );
      return { [question.id]: selectedOption || `Custom: ${input}` };
    } else {
      // Free text response
      return { [question.id]: input };
    }
  };

  const generateDynamicSystemPrompt = async () => {
    addAssistantMessage("🎯 **Generating Your Ultimate Dynamic Assistant...**\n\nAnalyzing your multi-tier architecture and creating the most advanced system prompt...", 'generating');

    try {
      const systemPrompt = tierManager.generateSystemPrompt(profile);
      
      // Use Gemini to enhance the generated prompt
      const enhancementRequest = `Enhance this tiered system prompt into a comprehensive, elite-level AI assistant configuration:

${systemPrompt}

Make it sophisticated, actionable, and designed to operate at the highest levels of performance. Structure it clearly with sections for each tier's contributions.`;

      const enhancedPrompt = await geminiSimplifiedService.getCompletion([{ text: enhancementRequest }]);

      if (enhancedPrompt) {
        onSystemPromptGenerated(enhancedPrompt);
        onProfileComplete(profile);
        
        const completedTierCount = profile.completedTiers.length;
        const allTiers = tierManager.getAllTiers();
        
        addAssistantMessage(`🎉 **YOUR ULTIMATE DYNAMIC ASSISTANT IS READY!**

✅ **Architecture Complete**: ${completedTierCount} tiers configured
✅ **Core Foundation**: ${profile.completedTiers.filter(t => t <= 5).length}/5 core tiers
✅ **Advanced Features**: ${profile.completedTiers.filter(t => t > 5).length} extended tiers
✅ **Dynamic Capabilities**: Fully expandable architecture

Your assistant now has:
${allTiers.filter(tier => profile.completedTiers.includes(tier.tier))
  .map(tier => `• ${tier.icon} **${tier.name}**`).join('\n')}

The enhanced system prompt has been applied. Your assistant is ready for elite-level interactions!

**🔧 Future Expansion:**
- Add more custom tiers anytime
- Modify existing configurations  
- Unlock new capabilities as they're developed

Ready to chat with your new ultimate assistant! 🚀`, 'completion');
      }
    } catch (error) {
      console.error('Error generating system prompt:', error);
      addAssistantMessage("I encountered an error generating the system prompt. Please try again.", 'error');
    }
  };

  const analyzeGoalsAndSuggestApproach = async (goals: string) => {
    try {
      const availableTierCount = availableTiers.length;
      const analysisRequest = `The user wants to create an AI assistant and said: "${goals}"

Based on their goals, suggest the best approach using our ${availableTierCount}-tier expandable system. Explain how they can customize tiers for their specific needs and mention they can add custom tiers.

Keep it encouraging and actionable.`;

      const analysis = await geminiSimplifiedService.getCompletion([{ text: analysisRequest }]);
      return analysis || `Based on your goals, our expandable ${availableTierCount}-tier system will be perfect. You can customize existing tiers or add your own! Ready to start?`;
    } catch (error) {
      return `I understand your goals. Our expandable tier architecture can be customized exactly for your needs. Ready to start building?`;
    }
  };

  const addAssistantMessage = (content: string, type: string) => {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content,
      timestamp: new Date(),
      metadata: { type, currentTier: currentTier?.tier }
    }]);
  };

  const getTierIcon = (tier: number) => {
    const tierDef = tierManager.getTierByNumber(tier);
    return tierDef?.icon || '⚡';
  };

  const addCustomTier = () => {
    const newTier = tierManager.addCustomTier({
      id: `custom_tier_${Date.now()}`,
      name: 'Custom Tier',
      description: 'A custom tier for specific needs',
      icon: '🎯',
      color: 'gray',
      required: false,
      questions: []
    });
    
    setAvailableTiers(tierManager.getAvailableTiers(profile.completedTiers));
    addAssistantMessage(`✅ Added new custom tier: **${newTier.name}** (Tier ${newTier.tier})`, 'tier_added');
  };

  return (
    <div className="space-y-4">
      {/* Dynamic Progress Header */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              {currentTier ? getTierIcon(currentTier.tier) : <Sparkles className="w-5 h-5 text-indigo-500" />}
              Dynamic Tiered Assistant Builder
              {currentTier && (
                <Badge variant="outline" className="text-xs">
                  Tier {currentTier.tier}: {currentTier.name}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {profile.completionPercentage}% Complete
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTierManager(!showTierManager)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Progress value={profile.completionPercentage} className="w-full" />
            <div className="flex justify-between text-xs text-gray-600">
              <span>Completed: {profile.completedTiers.length} tiers</span>
              <span>Available: {availableTiers.length} tiers</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tier Management Panel */}
      {showTierManager && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Tier Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={addCustomTier} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Custom Tier
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {tierManager.getAllTiers().map(tier => (
                  <div key={tier.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <span>{tier.icon}</span>
                      <span className="text-sm font-medium">Tier {tier.tier}: {tier.name}</span>
                      {tier.required && <Badge variant="outline" className="text-xs">Required</Badge>}
                      {profile.completedTiers.includes(tier.tier) && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    </div>
                    {tier.tier > 8 && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => tierManager.removeCustomTier(tier.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Messages */}
      <Card>
        <CardContent className="p-4">
          <div className="h-96 overflow-y-auto space-y-4 mb-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </div>
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="animate-spin">🧠</div>
                    Processing tier response...
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
            <Input
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder={currentTier ? `Respond to Tier ${currentTier.tier}...` : "Type your response..."}
              disabled={isThinking}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={isThinking || !currentInput.trim()}
              className="px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Current Tier Info */}
      {currentTier && (
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <strong>Active Tier:</strong> {currentTier.icon} {currentTier.name} - {currentTier.description}
              {currentTier.dependencies && (
                <div className="mt-1">
                  <strong>Dependencies:</strong> Tiers {currentTier.dependencies.join(', ')} must be completed
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
