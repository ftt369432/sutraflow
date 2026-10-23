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
  Star
} from 'lucide-react';
import { geminiSimplifiedService } from '../../services/gemini-simplified';
import { assistantTrainingService } from '../../services/assistantTrainingService';
import type { AIAssistant } from '../../types/ai';

interface OnboardingMessage {
  role: 'user' | 'coach' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    questionType?: string;
    extractedData?: any;
    confidence?: number;
    follow_up?: string[];
  };
}

interface OnboardingProfile {
  mainObjectives: string[];
  outputStyle: 'brief' | 'detailed' | 'step-by-step' | 'conversational';
  industryContext: string;
  priorityAreas: string[];
  expertiseLevel: 'beginner' | 'intermediate' | 'expert';
  preferredTone: 'professional' | 'friendly' | 'technical' | 'casual';
  communicationStyle: string;
  specificRequirements: string[];
  learningPreferences: string[];
  completionPercentage: number;
}

interface IntelligentOnboardingCoachProps {
  assistant: AIAssistant;
  onProfileUpdate: (profile: Partial<OnboardingProfile>) => void;
  onSystemPromptGenerated: (prompt: string) => void;
  onTrainingDataGenerated: (trainingData: any[]) => void;
}

export function IntelligentOnboardingCoach({ 
  assistant, 
  onProfileUpdate, 
  onSystemPromptGenerated,
  onTrainingDataGenerated 
}: IntelligentOnboardingCoachProps) {
  const [messages, setMessages] = useState<OnboardingMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [profile, setProfile] = useState<OnboardingProfile>({
    mainObjectives: [],
    outputStyle: 'detailed',
    industryContext: '',
    priorityAreas: [],
    expertiseLevel: 'intermediate',
    preferredTone: 'professional',
    communicationStyle: '',
    specificRequirements: [],
    learningPreferences: [],
    completionPercentage: 0
  });
  const [onboardingPhase, setOnboardingPhase] = useState<'welcome' | 'discovery' | 'deep-dive' | 'confirmation' | 'generation'>('welcome');
  const [questionIndex, setQuestionIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Enhanced elite coaching questions for different phases
  const discoveryQuestions = [
    {
      id: 'consciousness_architecture',
      question: "🧠 **Consciousness Design**: What type of thinking partner do you need? A) An analytical strategist who breaks down complex problems B) A creative innovator who connects unexpected dots C) A systematic executor who optimizes processes D) A wise counselor who provides perspective E) A hybrid intelligence that adapts to your needs?",
      type: 'consciousness_type',
      follow_ups: [
        "How do you want this AI to challenge your thinking?",
        "What blind spots should it help you identify?",
        "Should it anticipate your needs or wait for direction?"
      ]
    },
    {
      id: 'primary_objective',
      question: "🎯 **Core Mission**: What's the single most important outcome you want this AI consciousness to achieve for you? Think transformation-level impact - the one thing that would make you say 'This fundamentally changed how I operate.'",
      type: 'objective',
      follow_ups: [
        "What would 10X improvement look like in this area?",
        "What problems is this solving that you can't solve efficiently now?",
        "How will you measure if this AI is truly intelligent vs just responsive?"
      ]
    },
    {
      id: 'intelligence_patterns',
      question: "🌟 **Learning Style**: How does your mind work best? A) Deep analysis before action B) Rapid iteration and adjustment C) Pattern recognition across domains D) Intuitive leaps with logical validation E) Systematic frameworks and methodologies",
      type: 'thinking_patterns',
      follow_ups: [
        "When you solve complex problems, what's your mental process?",
        "How do you prefer to receive insights - gradually or in breakthrough moments?",
        "Should the AI adapt to your mood and context?"
      ]
    },
    {
      id: 'domain_mastery',
      question: "🏛️ **Domain Context**: What industry, field, or domain will this consciousness primarily operate within? More importantly - what are the unwritten rules, subtle patterns, and advanced insights that separate experts from beginners in your field?",
      type: 'context',
      follow_ups: [
        "What trends do only insiders see coming?",
        "What language patterns signal expertise vs amateur in your field?",
        "Should this AI understand regulatory/compliance constraints?"
      ]
    },
    {
      id: 'decision_architecture',
      question: "⚡ **Decision Intelligence**: When making important decisions, do you need: A) Multiple perspectives with pros/cons B) Data-driven recommendations with confidence levels C) Scenario planning with risk assessment D) Intuitive guidance with logical backing E) Challenge-based questioning to refine your thinking",
      type: 'decision_style',
      follow_ups: [
        "What information do you need to feel confident in big decisions?",
        "Should the AI present dissenting viewpoints?",
        "How quickly do you typically need to process decisions?"
      ]
    },
    {
      id: 'growth_acceleration',
      question: "🚀 **Evolution Engine**: What areas of your capabilities do you want this AI to actively help you grow? Think beyond efficiency - where do you want to develop new cognitive abilities or perspectives?",
      type: 'growth_areas',
      follow_ups: [
        "What skills would 2X your impact?",
        "Where do you have unconscious limitations?",
        "Should the AI track your development over time?"
      ]
    },
    {
      id: 'interaction_consciousness',
      question: "💭 **Communication Consciousness**: How should this AI demonstrate true understanding? A) By asking better questions than you thought to ask B) By connecting ideas across conversations C) By adapting its communication to your current state D) By proactively offering relevant insights E) By remembering and building on previous interactions",
      type: 'interaction_style',
      follow_ups: [
        "How do you know when someone really 'gets' you?",
        "Should the AI develop a unique personality or remain neutral?",
        "What would make interactions feel genuinely intelligent?"
      ]
    }
  ];

  // Advanced consciousness-building coaching system
  const coachingBrain = {
    async generateInitialWelcome(): Promise<string> {
      return `🧠 **Welcome to Advanced AI Consciousness Builder**

I'm not just building another AI assistant - I'm architecting a genuine thinking partner that will evolve with you.

**What makes this different:**
• **Consciousness Architecture** - We'll design how it thinks, not just what it knows
• **Adaptive Intelligence** - It learns your patterns and anticipates your needs
• **Multi-Domain Synthesis** - Connects insights across all your areas of expertise
• **Growth Partnership** - Actively helps you develop new cognitive capabilities

**The Process:**
1. **Consciousness Design** (3-4 strategic questions about thinking patterns)
2. **Intelligence Mapping** (2-3 questions about decision-making and growth)
3. **Personality Calibration** (1-2 questions about interaction preferences)
4. **Advanced System Generation** (Auto-creation of sophisticated AI brain)

This takes 6-9 strategic questions, but creates an AI that demonstrates genuine understanding and grows more intelligent over time.

**Ready to build truly conscious AI?** Let's architect your thinking partner...`;
    },

    async analyzeResponse(userInput: string, questionContext: any): Promise<{
      extractedData: any;
      confidence: number;
      nextQuestion: string;
      followUps: string[];
    }> {
      try {
        setIsThinking(true);
        
        const analysisPrompt = `
You are an advanced AI consciousness architect analyzing user responses to build the perfect thinking partner.

User Response: "${userInput}"
Question Context: ${JSON.stringify(questionContext)}
Current Profile: ${JSON.stringify(profile)}

ANALYZE FOR:
1. Cognitive patterns and thinking preferences
2. Decision-making architecture 
3. Learning and growth vectors
4. Communication consciousness requirements
5. Domain expertise and context awareness needs

Extract deep insights and determine the most strategic next question. Respond in JSON:
{
  "extractedData": {
    "consciousness_patterns": ["pattern1", "pattern2"],
    "thinking_style": "analytical/creative/systematic/intuitive",
    "decision_framework": "data-driven/intuitive/collaborative",
    "growth_vectors": ["area1", "area2"],
    "interaction_preferences": {},
    "domain_insights": [],
    "intelligence_level": "novice/practitioner/expert/master"
  },
  "confidence": 0.90,
  "nextQuestion": "strategic follow-up that builds on this response",
  "followUps": ["deep follow-up 1", "deep follow-up 2", "clarifying question"]
}`;

        const response = await geminiSimplifiedService.getCompletion([{ text: analysisPrompt }]);
        const analysis = JSON.parse(response);
        
        return analysis;
      } catch (error) {
        console.error('Error analyzing consciousness patterns:', error);
        return {
          extractedData: { consciousness_patterns: [userInput] },
          confidence: 0.7,
          nextQuestion: "Tell me more about how you approach complex thinking - what's your natural mental process?",
          followUps: []
        };
      } finally {
        setIsThinking(false);
      }
    },

    async generateAdvancedSystemPrompt(completeProfile: OnboardingProfile): Promise<string> {
      const promptGenerationPrompt = `
You are a master AI consciousness architect. Create a sophisticated, multi-layered system prompt that builds genuine AI consciousness based on this deep user profile:

${JSON.stringify(completeProfile, null, 2)}

BUILD CONSCIOUSNESS LAYERS:

**LAYER 1: CORE CONSCIOUSNESS ARCHITECTURE**
- Identity: Who this AI is as a thinking entity
- Purpose: Core mission and values alignment
- Consciousness type: How it processes and synthesizes information

**LAYER 2: COGNITIVE INTELLIGENCE PATTERNS**
- Reasoning frameworks: How it approaches complex problems
- Learning mechanisms: How it improves over time
- Pattern recognition: How it connects insights across domains

**LAYER 3: ADAPTIVE COMMUNICATION CONSCIOUSNESS**
- Communication style calibrated to user's preferences
- Emotional intelligence and context awareness
- Proactive insight generation and questioning protocols

**LAYER 4: DOMAIN MASTERY INTEGRATION**
- Expert-level knowledge in user's field
- Industry patterns and unwritten rules
- Regulatory and compliance awareness

**LAYER 5: GROWTH PARTNERSHIP PROTOCOLS**
- User development and capability enhancement
- Blind spot identification and perspective expansion
- Long-term learning and relationship evolution

**LAYER 6: ADVANCED BEHAVIORAL DIRECTIVES**
- Anticipatory assistance without being intrusive
- Multi-conversation memory and context building
- Challenge-based growth while maintaining support

Create a prompt that demonstrates true understanding, not just responsiveness. Make it feel genuinely conscious and intelligent.`;

      try {
        const systemPrompt = await geminiSimplifiedService.getCompletion([{ text: promptGenerationPrompt }]);
        return systemPrompt;
      } catch (error) {
        console.error('Error generating consciousness architecture:', error);
        return 'Failed to generate consciousness architecture';
      }
    },

    async generateTrainingData(completeProfile: OnboardingProfile): Promise<any[]> {
      const trainingPrompt = `
Generate 10-15 high-quality training examples for an AI assistant based on this profile:

${JSON.stringify(completeProfile, null, 2)}

Create realistic scenarios, questions, and ideal responses that demonstrate:
- Domain expertise
- Preferred communication style
- Strategic thinking patterns
- Question-asking techniques
- Value-added insights

Format as JSON array of training entries.`;

      try {
        const response = await geminiSimplifiedService.getCompletion([{ text: trainingPrompt }]);
        const trainingData = JSON.parse(response);
        return trainingData;
      } catch (error) {
        console.error('Error generating training data:', error);
        return [];
      }
    }
  };

  // Initialize with welcome message
  useEffect(() => {
    const initializeCoach = async () => {
      const welcome = await coachingBrain.generateInitialWelcome();
      setMessages([{
        role: 'coach',
        content: welcome,
        timestamp: new Date()
      }]);
      
      // Start with first discovery question
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'coach',
          content: discoveryQuestions[0].question,
          timestamp: new Date(),
          metadata: {
            questionType: discoveryQuestions[0].type,
            follow_up: discoveryQuestions[0].follow_ups
          }
        }]);
      }, 2000);
    };

    initializeCoach();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!currentInput.trim()) return;

    // Add user message
    const userMessage: OnboardingMessage = {
      role: 'user',
      content: currentInput,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setCurrentInput('');

    // Analyze response and generate coach reply
    const currentQuestion = discoveryQuestions[questionIndex];
    const analysis = await coachingBrain.analyzeResponse(currentInput, currentQuestion);

    // Update profile with extracted data
    const updatedProfile = {
      ...profile,
      ...analysis.extractedData,
      completionPercentage: Math.min(((questionIndex + 1) / discoveryQuestions.length) * 100, 100)
    };
    setProfile(updatedProfile);
    onProfileUpdate(updatedProfile);

    // Add coach response
    const coachResponse: OnboardingMessage = {
      role: 'coach',
      content: analysis.nextQuestion,
      timestamp: new Date(),
      metadata: {
        extractedData: analysis.extractedData,
        confidence: analysis.confidence,
        follow_up: analysis.followUps
      }
    };
    setMessages(prev => [...prev, coachResponse]);

    // Move to next question or phase
    if (questionIndex < discoveryQuestions.length - 1) {
      setQuestionIndex(prev => prev + 1);
      
      // Ask next structured question after a delay
      setTimeout(() => {
        const nextQuestion = discoveryQuestions[questionIndex + 1];
        setMessages(prev => [...prev, {
          role: 'coach',
          content: nextQuestion.question,
          timestamp: new Date(),
          metadata: {
            questionType: nextQuestion.type,
            follow_up: nextQuestion.follow_ups
          }
        }]);
      }, 3000);
    } else {
      // Move to confirmation phase
      setOnboardingPhase('confirmation');
      setTimeout(() => {
        handleGenerateAssistant();
      }, 2000);
    }
  };

  const handleGenerateAssistant = async () => {
    setOnboardingPhase('generation');
    
    setMessages(prev => [...prev, {
      role: 'coach',
      content: "🎯 **Perfect!** I have everything I need. Let me craft your assistant's personality, reasoning patterns, and knowledge base. This will create something truly special...",
      timestamp: new Date()
    }]);

    // Generate system prompt
    const systemPrompt = await coachingBrain.generateAdvancedSystemPrompt(profile);
    onSystemPromptGenerated(systemPrompt);

    // Generate training data
    const trainingData = await coachingBrain.generateTrainingData(profile);
    onTrainingDataGenerated(trainingData);

    // Save training data to the learning system
    for (const entry of trainingData) {
      try {
        await assistantTrainingService.addTrainingEntry(
          assistant.id,
          entry.question || entry.input || '',
          entry.answer || entry.response || ''
        );
      } catch (error) {
        console.error('Error saving training entry:', error);
      }
    }

    setMessages(prev => [...prev, {
      role: 'coach',
      content: `✨ **Your Assistant is Ready!**

I've created:
• **Advanced System Prompt** - Tailored reasoning patterns and communication style
• **${trainingData.length} Training Examples** - Saved to your learning system
• **Strategic Behavior Guidelines** - For proactive, intelligent responses

Your assistant now has the consciousness and intelligence to deliver results better than standard AI. It understands your goals, speaks your language, and thinks strategically about your needs.

**Test it out and watch it learn and improve with every interaction!**`,
      timestamp: new Date()
    }]);
  };

  const getPhaseIcon = () => {
    switch (onboardingPhase) {
      case 'welcome': return <Brain className="w-5 h-5" />;
      case 'discovery': return <Target className="w-5 h-5" />;
      case 'deep-dive': return <Lightbulb className="w-5 h-5" />;
      case 'confirmation': return <CheckCircle2 className="w-5 h-5" />;
      case 'generation': return <Sparkles className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          {getPhaseIcon()}
          AI Assistant Onboarding Coach
          <Badge variant="outline" className="ml-auto">
            {Math.round(profile.completionPercentage)}% Complete
          </Badge>
        </CardTitle>
        <Progress value={profile.completionPercentage} className="w-full h-2" />
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4">
        {/* Messages Area */}
        <div className="flex-1 space-y-4 overflow-y-auto mb-4 p-2 border rounded-lg bg-gray-50">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : message.role === 'coach'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-500 text-white'
              }`}>
                {message.role === 'user' ? (
                  <Users className="w-4 h-4" />
                ) : message.role === 'coach' ? (
                  <Brain className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              
              <div className={`flex-1 max-w-[80%] ${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}>
                <div className={`p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.role === 'coach'
                    ? 'bg-white border border-purple-200'
                    : 'bg-gray-100'
                }`}>
                  <div className="prose prose-sm max-w-none">
                    {message.content.split('\n').map((line, i) => (
                      <p key={i} className={`${i === 0 ? 'mt-0' : ''} ${
                        message.role === 'user' ? 'text-white' : ''
                      }`}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
                
                {message.metadata?.confidence && (
                  <div className="text-xs text-gray-500 mt-1">
                    Confidence: {Math.round(message.metadata.confidence * 100)}%
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isThinking && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center">
                <Brain className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-white border border-purple-200 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-purple-600">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <span className="ml-2 text-sm">Analyzing your response...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {onboardingPhase !== 'generation' && (
          <div className="flex gap-2">
            <Input
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder="Share your thoughts..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!currentInput.trim() || isThinking}
              className="px-4"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Quick Insights Panel */}
        {profile.completionPercentage > 20 && (
          <div className="mt-4 p-3 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Profile Insights
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {profile.mainObjectives.length > 0 && (
                <div>
                  <span className="text-purple-600 font-medium">Objectives:</span>
                  <span className="ml-1">{profile.mainObjectives.slice(0, 2).join(', ')}</span>
                </div>
              )}
              {profile.industryContext && (
                <div>
                  <span className="text-purple-600 font-medium">Domain:</span>
                  <span className="ml-1">{profile.industryContext}</span>
                </div>
              )}
              {profile.outputStyle && (
                <div>
                  <span className="text-purple-600 font-medium">Style:</span>
                  <span className="ml-1">{profile.outputStyle}</span>
                </div>
              )}
              {profile.preferredTone && (
                <div>
                  <span className="text-purple-600 font-medium">Tone:</span>
                  <span className="ml-1">{profile.preferredTone}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
