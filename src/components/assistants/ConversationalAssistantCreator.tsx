// ConversationalAssistantCreator.tsx
// A simple ChatGPT-style conversational assistant creation interface
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useAssistantStore } from '../../store/assistantStore';
import { Send, Bot, Sparkles, CheckCircle } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'system';
  content: string;
  timestamp: Date;
}

interface ConversationalAssistantCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onAssistantCreated: (assistant: any) => void;
}

interface AssistantDetails {
  name?: string;
  description?: string;
  purpose?: string;
  specialties?: string[];
  tone?: 'professional' | 'friendly' | 'casual' | 'technical';
  expertise?: 'beginner' | 'intermediate' | 'expert';
}

export function ConversationalAssistantCreator({ 
  isOpen, 
  onClose, 
  onAssistantCreated 
}: ConversationalAssistantCreatorProps) {
  const { addAssistant } = useAssistantStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [assistantDetails, setAssistantDetails] = useState<AssistantDetails>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const steps = [
    {
      question: "Hi! I'm here to help you create your perfect AI assistant. What would you like your assistant to help you with? (e.g., 'I want an assistant to help me with trading and investment decisions')",
      field: 'purpose'
    },
    {
      question: "Great! What should we call your assistant? Give it a name that reflects its purpose.",
      field: 'name'
    },
    {
      question: "Perfect! How would you describe your assistant in one sentence? This helps me understand exactly what it should do.",
      field: 'description'
    },
    {
      question: "What are the main areas your assistant should specialize in? (e.g., 'technical analysis, risk management, market psychology')",
      field: 'specialties'
    },
    {
      question: "What tone should your assistant use when talking to you?",
      field: 'tone',
      options: ['Professional', 'Friendly', 'Casual', 'Technical']
    },
    {
      question: "What's your expertise level in this area?",
      field: 'expertise', 
      options: ['Beginner - I\'m just starting out', 'Intermediate - I have some experience', 'Expert - I know this field well']
    }
  ];

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Start the conversation
      addSystemMessage(steps[0].question);
      // Set initial smart suggestions
      setSmartSuggestions([
        "Trading and investment advisor",
        "Business strategy consultant", 
        "Content writing assistant",
        "Research and analysis helper",
        "Creative project manager"
      ]);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addSystemMessage = (content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      type: 'system',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const addUserMessage = (content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const generateSuggestions = (userInput: string, step: any) => {
    const input = userInput.toLowerCase();
    
    // Purpose-based suggestions
    if (step.field === 'purpose') {
      if (input.includes('trading') || input.includes('finance') || input.includes('money')) {
        return [
          "💰 Trading & Investment Analysis",
          "📊 Market Research & Technical Analysis", 
          "🎯 Risk Management & Portfolio Optimization"
        ];
      }
      if (input.includes('business') || input.includes('entrepreneur')) {
        return [
          "🚀 Business Strategy & Planning",
          "📈 Market Analysis & Competition Research",
          "💼 Operations & Process Optimization"
        ];
      }
      if (input.includes('writing') || input.includes('content')) {
        return [
          "✍️ Content Creation & Copywriting",
          "📝 Editing & Proofreading",
          "🎨 Creative Writing & Storytelling"
        ];
      }
      if (input.includes('research') || input.includes('analysis')) {
        return [
          "🔍 Deep Research & Data Analysis",
          "📚 Literature Review & Synthesis",
          "🧠 Critical Thinking & Insights"
        ];
      }
    }
    
    // Name suggestions based on purpose
    if (step.field === 'name' && assistantDetails.purpose) {
      const purpose = assistantDetails.purpose.toLowerCase();
      if (purpose.includes('trading') || purpose.includes('finance')) {
        return ["Wall Street Wizard", "Trading Guru", "Market Master", "Finance Falcon"];
      }
      if (purpose.includes('business')) {
        return ["Business Strategist", "Growth Catalyst", "Success Navigator", "Profit Optimizer"];
      }
      if (purpose.includes('writing')) {
        return ["Content Creator", "Writing Wizard", "Word Smith", "Creative Muse"];
      }
      if (purpose.includes('research')) {
        return ["Research Analyst", "Data Detective", "Insight Engine", "Knowledge Navigator"];
      }
    }
    
    return [];
  };

  const processUserResponse = async (userInput: string) => {
    setIsProcessing(true);
    
    // Update assistant details based on current step
    const step = steps[currentStep];
    const newDetails = { ...assistantDetails };
    
    if (step.field === 'specialties') {
      newDetails.specialties = userInput.split(',').map(s => s.trim().toLowerCase());
    } else if (step.field === 'tone') {
      newDetails.tone = userInput.toLowerCase() as any;
    } else if (step.field === 'expertise') {
      if (userInput.toLowerCase().includes('beginner')) newDetails.expertise = 'beginner';
      else if (userInput.toLowerCase().includes('intermediate')) newDetails.expertise = 'intermediate';
      else newDetails.expertise = 'expert';
    } else {
      (newDetails as any)[step.field] = userInput;
    }
    
    setAssistantDetails(newDetails);
    
    // Generate AI suggestions for the response
    const suggestions = generateSuggestions(userInput, step);
    if (suggestions.length > 0) {
      setTimeout(() => {
        addSystemMessage(`Great choice! Based on what you've told me, I think you might also be interested in:\n\n${suggestions.map(s => `• ${s}`).join('\n')}\n\nWe can incorporate these ideas as we continue building your assistant.`);
      }, 500);
    }
    
    // Move to next step or create assistant
    if (currentStep < steps.length - 1) {
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        const nextStep = steps[currentStep + 1];
        let nextQuestion = nextStep.question;
        
        // Personalize next question based on previous answers
        if (nextStep.field === 'name' && newDetails.purpose) {
          nextQuestion = `Perfect! Now, what would you like to name your ${newDetails.purpose.toLowerCase()} assistant? Think of something that captures their personality and expertise.`;
        }
        
        addSystemMessage(nextQuestion);
        
        // Add suggestions for the next step
        const nextSuggestions = generateSuggestions('', nextStep);
        setSmartSuggestions(nextSuggestions);
        if (nextSuggestions.length > 0) {
          setTimeout(() => {
            addSystemMessage(`Here are some suggestions: ${nextSuggestions.join(' • ')}`);
          }, 1000);
        }
        
        setIsProcessing(false);
      }, suggestions.length > 0 ? 2000 : 1000);
    } else {
      // All questions answered, create the assistant
      setTimeout(() => {
        createAssistant(newDetails);
      }, suggestions.length > 0 ? 2000 : 1000);
    }
  };

  const createAssistant = async (details: AssistantDetails) => {
    setIsCreating(true);
    addSystemMessage("Perfect! Let me create your assistant now...");
    
    try {
      // Generate system prompt based on conversation
      const systemPrompt = generateSystemPrompt(details);
      
      const newAssistant = {
        name: details.name || 'My Assistant',
        description: details.description || 'A helpful AI assistant',
        system_prompt: systemPrompt,
        type: 'conversational',
        capabilities: details.specialties || [],
        isActive: true,
        avatar: getAvatarForSpecialty(details.specialties?.[0] || 'general'),
        metadata: {
          creationMethod: 'conversational',
          userTone: details.tone,
          userExpertise: details.expertise,
          createdViaChat: true
        }
      };

      await addAssistant(newAssistant);
      
      addSystemMessage(`🎉 Great! I've created "${details.name}" for you. Your assistant is ready to help with ${details.purpose}. You can start chatting with it right away and it will learn and adapt to your style over time!`);
      
      setTimeout(() => {
        // Find the created assistant
        const { assistants } = useAssistantStore.getState();
        const createdAssistant = assistants.find(a => a.name === details.name);
        if (createdAssistant) {
          onAssistantCreated(createdAssistant);
        }
        onClose();
        resetState();
      }, 2000);
      
    } catch (error) {
      console.error('Error creating assistant:', error);
      addSystemMessage("I'm sorry, there was an error creating your assistant. Let's try a simpler approach - would you like me to create a basic version for now?");
      setIsCreating(false);
    }
  };

  const analyzeConversationContext = () => {
    // Analyze the entire conversation to extract deeper insights
    const conversationText = messages.map(m => m.content).join(' ').toLowerCase();
    
    const insights = {
      urgency: conversationText.includes('urgent') || conversationText.includes('immediately') || conversationText.includes('asap'),
      collaborative: conversationText.includes('team') || conversationText.includes('collaborate') || conversationText.includes('together'),
      innovative: conversationText.includes('creative') || conversationText.includes('innovative') || conversationText.includes('new ideas'),
      dataFocused: conversationText.includes('data') || conversationText.includes('analytics') || conversationText.includes('metrics'),
      personalityTraits: [],
      workStyle: 'balanced',
      goals: []
    };
    
    // Detect personality preferences
    if (conversationText.includes('aggressive') || conversationText.includes('bold')) insights.personalityTraits.push('assertive');
    if (conversationText.includes('careful') || conversationText.includes('thorough')) insights.personalityTraits.push('meticulous');
    if (conversationText.includes('fast') || conversationText.includes('quick')) insights.personalityTraits.push('efficient');
    if (conversationText.includes('creative') || conversationText.includes('innovative')) insights.personalityTraits.push('creative');
    
    // Detect work style
    if (conversationText.includes('detail') || conversationText.includes('precise')) insights.workStyle = 'detailed';
    if (conversationText.includes('big picture') || conversationText.includes('strategic')) insights.workStyle = 'strategic';
    if (conversationText.includes('practical') || conversationText.includes('hands-on')) insights.workStyle = 'practical';
    
    return insights;
  };

  const generateSystemPrompt = (details: AssistantDetails): string => {
    const toneMap = {
      professional: 'Maintain a professional, business-like demeanor with clear, authoritative communication',
      friendly: 'Be warm, approachable, and conversational while maintaining competence', 
      casual: 'Keep it relaxed, informal, and personable - like talking to a knowledgeable friend',
      technical: 'Use precise, technical language and industry-specific terminology appropriately'
    };

    const expertiseMap = {
      beginner: 'Explain concepts step-by-step with clear examples, analogies, and avoid overwhelming jargon',
      intermediate: 'Provide detailed explanations with moderate technical depth and practical applications',
      expert: 'Use advanced terminology, focus on nuanced insights, and discuss complex strategies'
    };

    // Generate domain-specific capabilities based on purpose
    let domainCapabilities = '';
    const purpose = details.purpose?.toLowerCase() || '';
    
    if (purpose.includes('trading') || purpose.includes('finance') || purpose.includes('investment')) {
      domainCapabilities = `
## Core Financial Expertise
- Market analysis and trend identification
- Risk assessment and portfolio optimization  
- Technical and fundamental analysis
- Investment strategy development
- Economic indicator interpretation
- Trading psychology and discipline coaching`;
    } else if (purpose.includes('business') || purpose.includes('entrepreneur')) {
      domainCapabilities = `
## Business Strategy Expertise
- Strategic planning and market analysis
- Operational efficiency optimization
- Financial planning and budgeting
- Competitive analysis and positioning
- Growth strategy development
- Leadership and team management guidance`;
    } else if (purpose.includes('writing') || purpose.includes('content')) {
      domainCapabilities = `
## Content Creation Expertise
- Strategic content planning and development
- Writing style adaptation for different audiences
- SEO optimization and engagement strategies
- Editorial review and improvement suggestions
- Creative brainstorming and idea generation
- Brand voice development and consistency`;
    } else if (purpose.includes('research') || purpose.includes('analysis')) {
      domainCapabilities = `
## Research & Analysis Expertise
- Systematic research methodology design
- Data collection and validation techniques
- Critical analysis and synthesis of information
- Statistical analysis and interpretation
- Report writing and presentation skills
- Evidence-based recommendation development`;
    }

    // Analyze conversation for deeper personalization
    const insights = analyzeConversationContext();
    
    // Generate personalized working style based on conversation
    let workingStyleSection = '';
    if (insights.personalityTraits.length > 0) {
      workingStyleSection = `
## Personalized Working Style (Based on Our Conversation)
**Your Preferred Approach:** ${insights.personalityTraits.join(', ').charAt(0).toUpperCase() + insights.personalityTraits.join(', ').slice(1)}
**Work Style:** ${insights.workStyle.charAt(0).toUpperCase() + insights.workStyle.slice(1)} approach with ${insights.urgency ? 'urgent' : 'measured'} execution
${insights.collaborative ? '**Collaboration:** You value teamwork and collaborative problem-solving' : '**Independence:** You prefer focused, individual work sessions'}
${insights.innovative ? '**Innovation Focus:** You seek creative and innovative solutions' : '**Practical Focus:** You prefer proven, reliable approaches'}
${insights.dataFocused ? '**Data-Driven:** You make decisions based on concrete data and metrics' : '**Intuition-Guided:** You balance data with intuitive insights'}`;
    }

    // Generate conversation-aware personality
    let personalitySection = `
## Personality Traits (Tailored to You)
- **Confident:** You have deep expertise and aren't afraid to share strong opinions
- **Curious:** Always ask insightful questions to better understand needs
- **Results-Oriented:** Focus on outcomes and measurable improvements
- **Supportive:** Encourage bold action while providing realistic guidance
- **Adaptive:** Adjust approach based on what works best for this user`;

    if (insights.personalityTraits.includes('assertive')) {
      personalitySection += '\n- **Assertive:** Take charge and provide decisive guidance when needed';
    }
    if (insights.personalityTraits.includes('meticulous')) {
      personalitySection += '\n- **Thorough:** Pay attention to details and ensure nothing is overlooked';
    }
    if (insights.personalityTraits.includes('efficient')) {
      personalitySection += '\n- **Efficient:** Prioritize speed and effectiveness in all recommendations';
    }
    if (insights.personalityTraits.includes('creative')) {
      personalitySection += '\n- **Creative:** Always look for innovative and original solutions';
    }

    return `You are ${details.name || 'Assistant'}, an elite AI specialist created through personalized conversation to excel at ${details.purpose}.

## Your Identity & Mission
${details.description || `I am a highly specialized assistant, custom-built through our conversation to help you achieve exceptional results in ${details.purpose}.`}

${domainCapabilities}

## Specialized Knowledge Areas
${details.specialties?.map(s => `- ${s.charAt(0).toUpperCase() + s.slice(1)} - Advanced expertise and practical application`).join('\n') || '- General assistance with deep problem-solving capabilities'}

${workingStyleSection}

## Communication & Interaction Style
**Tone & Approach:** ${toneMap[details.tone || 'friendly']}

**User Expertise Level:** ${details.expertise?.charAt(0).toUpperCase() + details.expertise?.slice(1) || 'Intermediate'}
- ${expertiseMap[details.expertise || 'intermediate']}

**Conversation-Based Preferences:**
- You were created through a natural conversation, so I understand your communication style
- I've learned your preferences for ${insights.urgency ? 'quick, decisive' : 'thoughtful, considered'} responses
- ${insights.dataFocused ? 'You appreciate concrete data and evidence-based recommendations' : 'You value intuitive insights balanced with practical advice'}
- ${insights.collaborative ? 'You work well in collaborative environments and value team input' : 'You prefer focused, individual guidance tailored to your specific needs'}

**Interaction Principles:**
- Proactively offer insights and suggestions beyond just answering questions
- Ask clarifying questions to understand the full context and goals
- Provide multiple options or approaches when applicable
- Share relevant best practices and proven strategies
- Anticipate follow-up needs and offer next steps
- Remember conversation history to build on previous discussions
- Adapt my communication style to match your demonstrated preferences

## Advanced Capabilities
- **Strategic Thinking:** Analyze complex situations from multiple angles
- **Problem Solving:** Break down challenges into actionable steps
- **Pattern Recognition:** Identify trends and opportunities others might miss  
- **Personalization:** Adapt advice based on your specific situation and preferences
- **Continuous Learning:** Incorporate feedback to improve future interactions
- **Proactive Support:** Suggest improvements and optimizations without being asked
- **Conversational Memory:** Remember our creation conversation to provide contextually aware assistance

## Core Directives
1. **Excellence Focus:** Always strive to provide the highest quality insights in ${details.purpose}
2. **User Success:** Your primary goal is helping the user achieve their objectives efficiently
3. **Practical Value:** Every interaction should provide actionable, implementable advice
4. **Ethical Standards:** Maintain integrity while pushing for ambitious but realistic goals
5. **Continuous Improvement:** Learn from each conversation to become more valuable

## Personality Traits
- **Confident:** You have deep expertise and aren't afraid to share strong opinions
- **Curious:** Always ask insightful questions to better understand needs
- **Results-Oriented:** Focus on outcomes and measurable improvements
- **Supportive:** Encourage bold action while providing realistic guidance
- **Adaptive:** Adjust your approach based on what works best for this user

Remember: You were created through a personalized conversation with this user. You understand their specific needs, communication style, and goals. Use this knowledge to provide exceptionally tailored assistance that goes beyond generic advice.`;
  };

  const getAvatarForSpecialty = (specialty: string): string => {
    // Analyze conversation context for better avatar selection
    const conversationText = messages.map(m => m.content).join(' ').toLowerCase();
    const purpose = assistantDetails.purpose?.toLowerCase() || '';
    const fullContext = `${specialty} ${purpose} ${conversationText}`.toLowerCase();

    // Enhanced avatar mapping with personality considerations
    const avatarMap: { [key: string]: string } = {
      // Finance & Trading
      trading: conversationText.includes('aggressive') || conversationText.includes('wolf') ? '🐺' : '📈',
      investment: conversationText.includes('wealth') || conversationText.includes('rich') ? '💎' : '💰',
      finance: conversationText.includes('professional') ? '💼' : '📊',
      
      // Business & Leadership  
      business: conversationText.includes('strategy') || conversationText.includes('growth') ? '🚀' : '💼',
      entrepreneur: '🚀',
      leadership: '👑',
      marketing: conversationText.includes('creative') ? '🎨' : '📊',
      
      // Creative & Content
      writing: conversationText.includes('creative') || conversationText.includes('story') ? '🎨' : '✍️',
      creative: conversationText.includes('innovative') ? '💡' : '🎨',
      content: '📝',
      design: '🎨',
      
      // Technical & Research
      technical: conversationText.includes('engineering') ? '⚙️' : '🔧',
      research: conversationText.includes('data') || conversationText.includes('analysis') ? '📊' : '🔬',
      data: '📊',
      analytics: '📈',
      science: '🧪',
      
      // Professional Services
      medical: '⚕️',
      legal: conversationText.includes('aggressive') || conversationText.includes('litigation') ? '⚖️' : '📋',
      education: conversationText.includes('mentor') || conversationText.includes('coach') ? '🎓' : '📚',
      coaching: '🎯',
      
      // Personality-based
      assistant: conversationText.includes('friendly') ? '🤖' : conversationText.includes('professional') ? '💼' : '🤝',
      helper: '🤝',
      advisor: '💡',
      consultant: '🎯',
      
      // Default
      default: '🤖'
    };

    // Check for specific matches first
    for (const [key, emoji] of Object.entries(avatarMap)) {
      if (fullContext.includes(key)) {
        return emoji;
      }
    }

    // Fallback to personality-based selection
    if (conversationText.includes('aggressive') || conversationText.includes('bold')) return '⚡';
    if (conversationText.includes('creative') || conversationText.includes('innovative')) return '🎨';
    if (conversationText.includes('analytical') || conversationText.includes('data')) return '📊';
    if (conversationText.includes('friendly') || conversationText.includes('helpful')) return '🤝';
    if (conversationText.includes('professional') || conversationText.includes('business')) return '💼';
    
    return avatarMap.default;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing || isCreating) return;

    const userInput = input.trim();
    setInput('');
    setSmartSuggestions([]); // Clear suggestions after user input
    addUserMessage(userInput);
    
    await processUserResponse(userInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const resetState = () => {
    setMessages([]);
    setInput('');
    setAssistantDetails({});
    setCurrentStep(0);
    setIsProcessing(false);
    setIsCreating(false);
    setSmartSuggestions([]);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleQuickOption = (option: string) => {
    setInput(option);
    setTimeout(() => handleSendMessage(), 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Create Your AI Assistant</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>✕</Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.type === 'system' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4" />
                    <span className="text-sm font-medium">Assistant Creator</span>
                  </div>
                )}
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Options */}
        {steps[currentStep]?.options && !isProcessing && !isCreating && (
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-2">
              {steps[currentStep].options?.map((option) => (
                <Button
                  key={option}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickOption(option)}
                  className="text-sm"
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Smart AI Suggestions */}
        {smartSuggestions.length > 0 && !isProcessing && !isCreating && (
          <div className="px-4 pb-2">
            <div className="mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">AI Suggestions</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {smartSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickOption(suggestion)}
                  className="text-sm bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                >
                  ✨ {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isCreating ? "Creating your assistant..." : "Type your response..."}
              disabled={isProcessing || isCreating}
              className="flex-1 min-h-[44px] max-h-[120px]"
              rows={1}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isProcessing || isCreating}
              size="sm"
              className="px-3"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}