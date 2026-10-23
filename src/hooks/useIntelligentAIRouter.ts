import { useState, useCallback, useRef } from 'react';

// Multi-AI Provider Router - Superior to Sider.ai's basic switching
export interface AIProvider {
  id: string;
  name: string;
  icon: string;
  status: 'active' | 'inactive' | 'loading' | 'error';
  capabilities: string[];
  strength: string[];
  pricing: 'free' | 'premium' | 'enterprise';
  responseTime: number;
  accuracy: number;
  contextWindow: number;
}

export interface AIRequest {
  message: string;
  context?: {
    platform?: string;
    app?: string;
    selectedText?: string;
    pageContent?: string;
    mode?: string;
    userPreferences?: any;
  };
  preferredCapabilities?: string[];
  urgency?: 'low' | 'medium' | 'high';
  complexity?: 'simple' | 'medium' | 'complex';
}

export interface AIResponse {
  content: string;
  provider: string;
  confidence: number;
  processingTime: number;
  suggestedFollowups?: string[];
  metadata?: any;
}

// Available AI Providers (expanded beyond Sider.ai)
const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'gpt-4',
    name: 'GPT-4 Turbo',
    icon: '🧠',
    status: 'active',
    capabilities: ['conversation', 'coding', 'analysis', 'creative', 'reasoning'],
    strength: ['general intelligence', 'coding', 'creative writing'],
    pricing: 'premium',
    responseTime: 2000,
    accuracy: 95,
    contextWindow: 128000
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    icon: '💡',
    status: 'active',
    capabilities: ['reasoning', 'safety', 'research', 'writing', 'analysis'],
    strength: ['complex reasoning', 'safety', 'long-form content'],
    pricing: 'premium',
    responseTime: 2500,
    accuracy: 97,
    contextWindow: 200000
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    icon: '🔷',
    status: 'active',
    capabilities: ['multimodal', 'integration', 'search', 'workspace', 'real-time'],
    strength: ['Google integration', 'multimodal', 'real-time data'],
    pricing: 'free',
    responseTime: 1500,
    accuracy: 92,
    contextWindow: 1000000
  },
  {
    id: 'custom-agents',
    name: 'Your Personal Agents',
    icon: '👥',
    status: 'active',
    capabilities: ['personalized', 'trained', 'domain-expert', 'swarm', 'adaptive'],
    strength: ['personalization', 'domain expertise', 'learning'],
    pricing: 'enterprise',
    responseTime: 1000,
    accuracy: 98,
    contextWindow: 50000
  },
  {
    id: 'swarm-intelligence',
    name: 'AI Swarm Network',
    icon: '🤖',
    status: 'active',
    capabilities: ['parallel-processing', 'multi-perspective', 'complex-tasks', 'coordination'],
    strength: ['complex problem solving', 'parallel processing', 'multi-angle analysis'],
    pricing: 'enterprise',
    responseTime: 3000,
    accuracy: 99,
    contextWindow: 200000
  },
  {
    id: 'perplexity',
    name: 'Perplexity Pro',
    icon: '🔍',
    status: 'active',
    capabilities: ['research', 'real-time', 'citations', 'web-search'],
    strength: ['real-time research', 'fact-checking', 'citations'],
    pricing: 'premium',
    responseTime: 3500,
    accuracy: 94,
    contextWindow: 32000
  }
];

// Intelligent AI Router Hook
export const useIntelligentAIRouter = () => {
  const [providers] = useState<AIProvider[]>(AI_PROVIDERS);
  const [activeProvider, setActiveProvider] = useState<string>('gpt-4');
  const [autoRouting, setAutoRouting] = useState<boolean>(true);
  const [requestHistory] = useState<AIRequest[]>([]);
  const routingLogic = useRef<any>({});

  // Intelligent provider selection based on request analysis
  const selectOptimalProvider = useCallback((request: AIRequest): string => {
    if (!autoRouting) return activeProvider;

    const scores: Record<string, number> = {};

    providers.forEach(provider => {
      let score = 0;

      // Base capability matching
      const capabilityMatch = request.preferredCapabilities?.some(cap => 
        provider.capabilities.includes(cap)
      ) || false;
      if (capabilityMatch) score += 30;

      // Context-based routing
      if (request.context) {
        const { platform, app, mode } = request.context;
        
        // Google Workspace integration
        if ((platform === 'extension' || app?.includes('google')) && provider.id === 'gemini-pro') {
          score += 25;
        }
        
        // Complex reasoning tasks
        if (mode === 'analysis' || request.complexity === 'complex') {
          if (provider.id === 'claude-3-opus') score += 20;
        }
        
        // Personal/trained tasks
        if (mode === 'personalized' || request.message.includes('my') || request.message.includes('I')) {
          if (provider.id === 'custom-agents') score += 30;
        }
        
        // Multi-step complex tasks
        if (request.complexity === 'complex' && request.urgency === 'low') {
          if (provider.id === 'swarm-intelligence') score += 35;
        }
        
        // Real-time research needs
        if (request.message.includes('latest') || request.message.includes('current') || request.message.includes('recent')) {
          if (provider.id === 'perplexity') score += 25;
        }
      }

      // Performance factors
      if (request.urgency === 'high') {
        score += Math.max(0, (3000 - provider.responseTime) / 100);
      }
      
      // Accuracy weighting
      score += provider.accuracy / 10;

      // Cost consideration
      if (provider.pricing === 'free') score += 5;
      if (provider.pricing === 'enterprise' && request.complexity === 'complex') score += 10;

      scores[provider.id] = score;
    });

    // Return provider with highest score
    const optimalProvider = Object.entries(scores).reduce((a, b) => 
      scores[a[0]] > scores[b[0]] ? a : b
    )[0];

    console.log('🤖 AI Router Selection:', {
      request: request.message.substring(0, 50),
      scores,
      selected: optimalProvider
    });

    return optimalProvider;
  }, [providers, activeProvider, autoRouting]);

  // Enhanced message processing with fallback and optimization
  const processMessage = useCallback(async (request: AIRequest): Promise<AIResponse> => {
    const startTime = Date.now();
    
    // Select optimal provider
    const selectedProvider = selectOptimalProvider(request);
    const provider = providers.find(p => p.id === selectedProvider);
    
    if (!provider || provider.status !== 'active') {
      throw new Error(`Provider ${selectedProvider} not available`);
    }

    try {
      // Update provider status
      provider.status = 'loading';
      
      // Route to appropriate service
      let response: AIResponse;
      
      switch (selectedProvider) {
        case 'custom-agents':
          response = await processWithPersonalAgents(request);
          break;
        case 'swarm-intelligence':
          response = await processWithSwarm(request);
          break;
        case 'gemini-pro':
          response = await processWithGemini(request);
          break;
        case 'claude-3-opus':
          response = await processWithClaude(request);
          break;
        case 'perplexity':
          response = await processWithPerplexity(request);
          break;
        default:
          response = await processWithGPT4(request);
      }
      
      provider.status = 'active';
      
      // Add performance metrics
      response.processingTime = Date.now() - startTime;
      response.provider = selectedProvider;
      
      // Learn from interaction for future routing
      updateRoutingLogic(request, response, selectedProvider);
      
      return response;
      
    } catch (error) {
      provider.status = 'error';
      
      // Fallback to backup provider
      console.warn(`Provider ${selectedProvider} failed, falling back...`);
      return await fallbackProcessing(request, selectedProvider);
    }
  }, [selectOptimalProvider, providers]);

  // Personal Agents Processing (Your Unique Feature!)
  const processWithPersonalAgents = async (request: AIRequest): Promise<AIResponse> => {
    // This connects to your personal AI assistants
    const response = await fetch('http://localhost:3003/api/ai/personal-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: request.message,
        context: request.context,
        assistantId: 'auto-select' // Let the system choose best assistant
      })
    });
    
    const data = await response.json();
    
    return {
      content: data.response,
      provider: 'custom-agents',
      confidence: data.confidence || 95,
      processingTime: 0, // Will be set by caller
      suggestedFollowups: data.followups,
      metadata: {
        assistantUsed: data.assistantId,
        knowledgeSourcesUsed: data.sources
      }
    };
  };

  // Swarm Intelligence Processing (Your Revolutionary Feature!)
  const processWithSwarm = async (request: AIRequest): Promise<AIResponse> => {
    const response = await fetch('http://localhost:3003/api/ai/swarm-process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: request.message,
        context: request.context,
        complexity: request.complexity,
        urgency: request.urgency
      })
    });
    
    const data = await response.json();
    
    return {
      content: data.result,
      provider: 'swarm-intelligence',
      confidence: data.confidence || 98,
      processingTime: 0,
      suggestedFollowups: data.followups,
      metadata: {
        agentsInvolved: data.agents,
        parallelProcesses: data.processes,
        coordinationStrategy: data.strategy
      }
    };
  };

  // External AI Providers (with enhanced integration)
  const processWithGPT4 = async (request: AIRequest): Promise<AIResponse> => {
    // Enhanced GPT-4 integration with context awareness
    const enhancedPrompt = enhancePromptWithContext(request);
    
    const response = await fetch('/api/ai/gpt4', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: enhancedPrompt }],
        context: request.context
      })
    });
    
    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      provider: 'gpt-4',
      confidence: 93,
      processingTime: 0,
      suggestedFollowups: generateFollowups(data.choices[0].message.content)
    };
  };

  const processWithClaude = async (request: AIRequest): Promise<AIResponse> => {
    // Similar enhanced integration for Claude
    const response = await fetch('/api/ai/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: enhancePromptWithContext(request),
        context: request.context
      })
    });
    
    const data = await response.json();
    
    return {
      content: data.completion,
      provider: 'claude-3-opus',
      confidence: 96,
      processingTime: 0
    };
  };

  const processWithGemini = async (request: AIRequest): Promise<AIResponse> => {
    // Enhanced Gemini integration with Google Workspace context
    const response = await fetch('/api/ai/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: enhancePromptWithContext(request) }] }],
        context: request.context
      })
    });
    
    const data = await response.json();
    
    return {
      content: data.candidates[0].content.parts[0].text,
      provider: 'gemini-pro',
      confidence: 91,
      processingTime: 0
    };
  };

  const processWithPerplexity = async (request: AIRequest): Promise<AIResponse> => {
    // Real-time research with Perplexity
    const response = await fetch('/api/ai/perplexity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [{ role: 'user', content: request.message }]
      })
    });
    
    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      provider: 'perplexity',
      confidence: 94,
      processingTime: 0,
      metadata: {
        citations: data.citations,
        realTimeData: true
      }
    };
  };

  // Context enhancement for better AI responses
  const enhancePromptWithContext = (request: AIRequest): string => {
    let enhancedPrompt = request.message;
    
    if (request.context) {
      const contextInfo = [];
      
      if (request.context.platform) {
        contextInfo.push(`Platform: ${request.context.platform}`);
      }
      
      if (request.context.app) {
        contextInfo.push(`App: ${request.context.app}`);
      }
      
      if (request.context.selectedText) {
        contextInfo.push(`Selected text: "${request.context.selectedText}"`);
      }
      
      if (request.context.mode) {
        contextInfo.push(`Mode: ${request.context.mode}`);
      }
      
      if (contextInfo.length > 0) {
        enhancedPrompt = `Context: ${contextInfo.join(', ')}

${request.message}`;
      }
    }
    
    return enhancedPrompt;
  };

  // Fallback processing when primary provider fails
  const fallbackProcessing = async (request: AIRequest, failedProvider: string): Promise<AIResponse> => {
    // Find next best provider
    const availableProviders = providers.filter(p => 
      p.id !== failedProvider && p.status === 'active'
    );
    
    if (availableProviders.length === 0) {
      throw new Error('No available AI providers');
    }
    
    // Use GPT-4 as default fallback
    const fallbackProvider = availableProviders.find(p => p.id === 'gpt-4') || availableProviders[0];
    
    console.log(`🔄 Falling back to ${fallbackProvider.name}`);
    
    return await processWithGPT4(request);
  };

  // Learning system for routing optimization
  const updateRoutingLogic = (request: AIRequest, response: AIResponse, provider: string) => {
    // Simple learning - track successful patterns
    const pattern = {
      requestType: detectRequestType(request.message),
      context: request.context?.platform || 'web',
      provider,
      confidence: response.confidence,
      performance: response.processingTime
    };
    
    // Store pattern for future routing decisions
    if (!routingLogic.current[pattern.requestType]) {
      routingLogic.current[pattern.requestType] = [];
    }
    
    routingLogic.current[pattern.requestType].push(pattern);
    
    // Keep only recent patterns (last 100 per type)
    if (routingLogic.current[pattern.requestType].length > 100) {
      routingLogic.current[pattern.requestType] = routingLogic.current[pattern.requestType].slice(-100);
    }
  };

  // Request type detection for learning
  const detectRequestType = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('code') || lowerMessage.includes('programming')) return 'coding';
    if (lowerMessage.includes('write') || lowerMessage.includes('compose')) return 'writing';
    if (lowerMessage.includes('analyze') || lowerMessage.includes('explain')) return 'analysis';
    if (lowerMessage.includes('search') || lowerMessage.includes('find')) return 'research';
    if (lowerMessage.includes('creative') || lowerMessage.includes('idea')) return 'creative';
    
    return 'general';
  };

  // Generate contextual follow-up suggestions
  const generateFollowups = (response: string): string[] => {
    // Simple follow-up generation based on response content
    const followups: string[] = [];
    
    if (response.includes('code')) {
      followups.push('Explain this code step by step');
      followups.push('Optimize this code for performance');
    }
    
    if (response.includes('analysis')) {
      followups.push('Provide more details on this analysis');
      followups.push('What are the implications?');
    }
    
    followups.push('Can you elaborate on this?');
    followups.push('What would you recommend next?');
    
    return followups.slice(0, 3);
  };

  return {
    providers,
    activeProvider,
    setActiveProvider,
    autoRouting,
    setAutoRouting,
    processMessage,
    selectOptimalProvider
  };
};