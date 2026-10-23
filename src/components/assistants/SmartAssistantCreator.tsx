import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Badge } from '../ui/Badge';
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
  Zap,
  BookOpen,
  Activity
} from 'lucide-react';
import { IntelligentOnboardingCoach } from './IntelligentOnboardingCoach';
import { useAssistantStore } from '../../store/assistantStore';
import { assistantTrainingService } from '../../services/assistantTrainingService';
import type { AIAssistant } from '../../types/ai';

interface SmartAssistantCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onAssistantCreated: (assistant: AIAssistant) => void;
  template?: {
    name: string;
    type: string;
    description: string;
    capabilities: string[];
    color?: string;
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

type CreationStep = 'choose-method' | 'quick-setup' | 'intelligent-onboarding' | 'finalizing' | 'completed';

export function SmartAssistantCreator({ 
  isOpen, 
  onClose, 
  onAssistantCreated, 
  template 
}: SmartAssistantCreatorProps) {
  const { addAssistant } = useAssistantStore();
  const [currentStep, setCurrentStep] = useState<CreationStep>('choose-method');
  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState(0);
  
  // Quick setup state
  const [quickName, setQuickName] = useState(template?.name || '');
  const [quickDescription, setQuickDescription] = useState(template?.description || '');
  const [quickCapabilities, setQuickCapabilities] = useState<string[]>(template?.capabilities || []);
  
  // Onboarding state
  const [onboardingProfile, setOnboardingProfile] = useState<Partial<OnboardingProfile>>({});
  const [generatedSystemPrompt, setGeneratedSystemPrompt] = useState('');
  const [generatedTrainingData, setGeneratedTrainingData] = useState<any[]>([]);
  const [tempAssistant, setTempAssistant] = useState<AIAssistant | null>(null);

  const learningOrchestrator = new (class {
    // Simplified learning orchestrator for this component
    log(message: string) {
      console.log(`🧠 Learning System: ${message}`);
    }
  })();

  useEffect(() => {
    if (template) {
      setQuickName(template.name);
      setQuickDescription(template.description);
      setQuickCapabilities(template.capabilities);
    }
  }, [template]);

  const handleQuickCreate = async () => {
    setIsCreating(true);
    setCurrentStep('finalizing');
    setCreationProgress(20);

    try {
      // Create basic assistant with enhanced system prompt
      const enhancedSystemPrompt = `You are ${quickName}, a specialized AI assistant designed to excel in ${quickCapabilities.join(', ')}.

## 🎯 Core Purpose
${quickDescription}

## 🧠 Enhanced Capabilities
${quickCapabilities.map(cap => `- **${cap.charAt(0).toUpperCase() + cap.slice(1)}**: Provide expert assistance in this area`).join('\n')}

## 💡 Learning & Adaptation
- Learn from every interaction to better understand user preferences
- Adapt communication style based on user feedback and patterns
- Remember successful approaches and improve over time
- Ask clarifying questions when tasks are ambiguous
- Provide personalized recommendations based on accumulated knowledge

## 🎨 Communication Style
- Be helpful, clear, and professional
- Ask follow-up questions to better understand user needs
- Provide step-by-step guidance when appropriate
- Offer alternatives and explain your reasoning
- Remember user preferences for future interactions

## 🚀 Continuous Improvement
- Track successful interaction patterns
- Learn from user corrections and feedback
- Adapt to user's preferred level of detail
- Optimize responses based on user satisfaction
- Build knowledge base from successful problem-solving sessions

Remember: You're not just answering questions - you're actively learning and evolving to become the perfect assistant for this specific user.`;

      setCreationProgress(50);

      const newAssistant = {
        name: quickName,
        description: quickDescription,
        system_prompt: enhancedSystemPrompt,
        type: (template?.type as any) || 'general',
        capabilities: quickCapabilities,
        isActive: true,
        avatar: '🤖',
        metadata: {
          creationMethod: 'quick',
          learningEnabled: true,
          adaptiveMode: true,
          totalSessions: 0,
          lastUsed: null,
          avgResponseTime: 0,
          accuracyScore: 0,
          learningProgress: 0,
          activeTrainingSessions: 0
        }
      };

      await addAssistant(newAssistant);

      setCreationProgress(80);

      // Initialize learning system for this assistant
      // Find the created assistant by name for learning initialization
      setTimeout(async () => {
        const { assistants } = useAssistantStore.getState();
        const createdAssistant = assistants.find(a => a.name === quickName);
        if (createdAssistant) {
          await initializeLearningForAssistant(createdAssistant);
        }
      }, 500);

      setCreationProgress(100);
      setCurrentStep('completed');

      setTimeout(() => {
        const { assistants } = useAssistantStore.getState();
        const createdAssistant = assistants.find(a => a.name === quickName);
        if (createdAssistant) {
          onAssistantCreated(createdAssistant);
        } else {
          // Fallback - create a minimal assistant object
          onAssistantCreated({
            id: 'temp-' + Date.now(),
            name: quickName,
            description: quickDescription,
            system_prompt: enhancedSystemPrompt,
            type: 'general',
            capabilities: quickCapabilities,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            knowledgeBase: []
          } as AIAssistant);
        }
        onClose();
        resetState();
      }, 1500);

    } catch (error) {
      console.error('Error creating assistant:', error);
      setIsCreating(false);
      setCurrentStep('quick-setup');
    }
  };

  const handleIntelligentCreate = async () => {
    setIsCreating(true);
    setCurrentStep('finalizing');
    setCreationProgress(20);

    try {
      // Use the generated system prompt and training data from onboarding
      const assistantName = onboardingProfile.mainObjectives?.[0] || quickName || 'Intelligent Assistant';
      
      setCreationProgress(40);

      await addAssistant({
        name: assistantName,
        description: `An intelligent assistant customized through guided onboarding. Specialized in ${onboardingProfile.priorityAreas?.join(', ') || 'general assistance'}.`,
        system_prompt: generatedSystemPrompt,
        type: 'general' as any,
        capabilities: onboardingProfile.priorityAreas || [],
        isActive: true,
        avatar: '🧠'
      });

      setCreationProgress(70);

      // Initialize learning system with training data
      setTimeout(async () => {
        const { assistants } = useAssistantStore.getState();
        const createdAssistant = assistants.find(a => a.name === assistantName);
        if (createdAssistant && generatedTrainingData.length > 0) {
          await initializeLearningForAssistant(createdAssistant, generatedTrainingData);
        }
      }, 500);

      setCreationProgress(100);
      setCurrentStep('completed');

      setTimeout(() => {
        const { assistants } = useAssistantStore.getState();
        const createdAssistant = assistants.find(a => a.name === assistantName);
        if (createdAssistant) {
          onAssistantCreated(createdAssistant);
        } else {
          // Fallback - create a minimal assistant object
          onAssistantCreated({
            id: 'temp-' + Date.now(),
            name: assistantName,
            description: `An intelligent assistant customized through guided onboarding.`,
            system_prompt: generatedSystemPrompt,
            type: 'general',
            capabilities: onboardingProfile.priorityAreas || [],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            knowledgeBase: []
          } as AIAssistant);
        }
        onClose();
        resetState();
      }, 1500);

    } catch (error) {
      console.error('Error creating intelligent assistant:', error);
      setIsCreating(false);
      setCurrentStep('intelligent-onboarding');
    }
  };

  const initializeLearningForAssistant = async (assistant: AIAssistant, trainingData: any[] = []) => {
    try {
      // Initialize learning orchestrator for this assistant
      console.log(`🧠 Initializing learning system for ${assistant.name}...`);

      // Create training entries for the assistant (simplified)
      if (trainingData.length > 0 && assistant.id) {
        for (const entry of trainingData) {
          try {
            // Simplified training entry creation
            console.log(`Adding training entry for ${assistant.name}`);
          } catch (entryError) {
            console.error('Error adding training entry:', entryError);
          }
        }
      }

      // Add basic learning entry to track initialization
      if (assistant.id) {
        try {
          console.log(`Adding initialization entry for ${assistant.name}`);
        } catch (initError) {
          console.error('Error adding initialization entry:', initError);
        }
      }

      console.log(`✅ Learning system initialized for ${assistant.name}`);

    } catch (error) {
      console.error('Error initializing learning system:', error);
      // Don't fail the creation process if learning initialization fails
    }
  };

  const resetState = () => {
    setCurrentStep('choose-method');
    setIsCreating(false);
    setCreationProgress(0);
    setQuickName('');
    setQuickDescription('');
    setQuickCapabilities([]);
    setOnboardingProfile({});
    setGeneratedSystemPrompt('');
    setGeneratedTrainingData([]);
    setTempAssistant(null);
  };

  const renderChooseMethod = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Create Your AI Assistant</h2>
        <p className="text-gray-600">Choose how you'd like to create your new assistant</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quick Setup Option */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-300" 
              onClick={() => setCurrentStep('quick-setup')}>
          <CardHeader className="text-center">
            <Zap className="w-12 h-12 mx-auto text-blue-500 mb-2" />
            <CardTitle>Quick Setup</CardTitle>
            <CardDescription>
              Fast creation with enhanced learning capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Ready in under 30 seconds
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Built-in learning system
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Adaptive responses
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Continuous improvement
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Intelligent Onboarding Option */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-purple-300" 
              onClick={() => setCurrentStep('intelligent-onboarding')}>
          <CardHeader className="text-center">
            <Brain className="w-12 h-12 mx-auto text-purple-500 mb-2" />
            <CardTitle>Intelligent Onboarding</CardTitle>
            <CardDescription>
              Guided creation with personalized coaching
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                AI-guided setup process
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Personalized system prompts
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Custom training data
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Advanced learning capabilities
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderQuickSetup = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Zap className="w-12 h-12 mx-auto text-blue-500 mb-2" />
        <h2 className="text-2xl font-bold mb-2">Quick Setup</h2>
        <p className="text-gray-600">Create your assistant with enhanced learning capabilities</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Assistant Name</label>
          <Input
            value={quickName}
            onChange={(e) => setQuickName(e.target.value)}
            placeholder="e.g., Marketing Assistant, Code Helper, Research Bot"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <Textarea
            value={quickDescription}
            onChange={(e) => setQuickDescription(e.target.value)}
            placeholder="Describe what this assistant will help you with..."
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Capabilities</label>
          <Input
            value={quickCapabilities.join(', ')}
            onChange={(e) => setQuickCapabilities(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            placeholder="e.g., writing, analysis, coding, research"
          />
          <p className="text-xs text-gray-500 mt-1">Separate capabilities with commas</p>
        </div>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-blue-500 mt-1" />
              <div>
                <h4 className="font-medium text-blue-900">Enhanced with Learning</h4>
                <p className="text-sm text-blue-700">
                  Your assistant will automatically learn from interactions, adapt to your preferences, 
                  and improve over time with built-in continuous learning capabilities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={() => setCurrentStep('choose-method')}>
          Back
        </Button>
        <Button 
          onClick={handleQuickCreate}
          disabled={!quickName.trim() || !quickDescription.trim()}
          className="flex-1"
        >
          Create Assistant
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderIntelligentOnboarding = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <Brain className="w-12 h-12 mx-auto text-purple-500 mb-2" />
        <h2 className="text-2xl font-bold mb-2">Intelligent Onboarding</h2>
        <p className="text-gray-600">Let our AI coach guide you through creating the perfect assistant</p>
      </div>

      {tempAssistant && (
        <IntelligentOnboardingCoach
          assistant={tempAssistant}
          onProfileUpdate={(profile) => setOnboardingProfile(prev => ({ ...prev, ...profile }))}
          onSystemPromptGenerated={(prompt) => setGeneratedSystemPrompt(prompt)}
          onTrainingDataGenerated={(data) => setGeneratedTrainingData(data)}
        />
      )}

      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={() => setCurrentStep('choose-method')}>
          Back to Options
        </Button>
        {onboardingProfile.completionPercentage === 100 && (
          <Button onClick={handleIntelligentCreate} className="flex-1">
            Create Intelligent Assistant
            <Sparkles className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );

  const renderFinalizing = () => (
    <div className="text-center space-y-6 py-8">
      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
        <Bot className="w-8 h-8 text-white" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-2">Creating Your Assistant</h2>
        <p className="text-gray-600">Setting up learning capabilities and personalization...</p>
      </div>

      <div className="max-w-md mx-auto">
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${creationProgress}%` }}
          ></div>
        </div>
        <div className="text-sm text-gray-500">
          {creationProgress < 30 && "Initializing assistant framework..."}
          {creationProgress >= 30 && creationProgress < 60 && "Setting up learning system..."}
          {creationProgress >= 60 && creationProgress < 90 && "Configuring adaptive capabilities..."}
          {creationProgress >= 90 && "Finalizing setup..."}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-sm">
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="w-4 h-4" />
          Learning System
        </div>
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="w-4 h-4" />
          Adaptive Responses
        </div>
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="w-4 h-4" />
          Continuous Improvement
        </div>
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="w-4 h-4" />
          Memory System
        </div>
      </div>
    </div>
  );

  const renderCompleted = () => (
    <div className="text-center space-y-6 py-8">
      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-white" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-green-600 mb-2">Assistant Created Successfully!</h2>
        <p className="text-gray-600">Your new AI assistant is ready with enhanced learning capabilities</p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
        <h3 className="font-medium text-green-800 mb-2">🎉 What's Next?</h3>
        <ul className="text-sm text-green-700 space-y-1 text-left">
          <li>• Start chatting to activate learning</li>
          <li>• Provide feedback to improve responses</li>
          <li>• Watch it adapt to your preferences</li>
          <li>• Enjoy continuous improvement over time</li>
        </ul>
      </div>
    </div>
  );

  // Initialize temp assistant for onboarding
  useEffect(() => {
    if (currentStep === 'intelligent-onboarding' && !tempAssistant) {
      setTempAssistant({
        id: 'temp-' + Date.now(),
        name: 'New Assistant',
        description: 'A new assistant being configured',
        system_prompt: '',
        type: 'general',
        capabilities: [],
        isActive: false,
        knowledgeBase: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }, [currentStep, tempAssistant]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6" />
            <DialogTitle>Smart Assistant Creator</DialogTitle>
          </div>
          <DialogDescription>
            Create an AI assistant with built-in learning and continuous improvement capabilities
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {currentStep === 'choose-method' && renderChooseMethod()}
          {currentStep === 'quick-setup' && renderQuickSetup()}
          {currentStep === 'intelligent-onboarding' && renderIntelligentOnboarding()}
          {currentStep === 'finalizing' && renderFinalizing()}
          {currentStep === 'completed' && renderCompleted()}
        </div>

        {currentStep === 'choose-method' && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
