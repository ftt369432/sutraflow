/**
 * 🧙‍♂️ Stackable Agent Creation Wizard
 * 
 * URENO Principle: Build on existing infrastructure, don't rebuild
 * Example: California Work Comp Attorney → Doctors & Professionals marketplace
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/progress';
import { 
  Bot, Brain, Briefcase, Stethoscope, Scale, Calculator, 
  Code, Palette, Wrench, Plus, ArrowRight, ArrowLeft,
  Upload, FileText, Settings, CheckCircle, Zap, Sparkles
} from 'lucide-react';

// 🎯 Professional Specializations - Your Target Market
const PROFESSIONAL_TEMPLATES = {
  'work_comp_attorney': {
    name: 'Workers Compensation Attorney',
    icon: Scale,
    color: 'blue',
    description: 'Specialized in California workers compensation law',
    baseAgents: ['legal_research', 'case_analysis', 'document_drafting', 'client_communication'],
    templates: ['injury_claim', 'appeal_letter', 'settlement_demand', 'medical_review'],
    workflows: ['intake_process', 'case_evaluation', 'evidence_gathering', 'negotiation_prep']
  },
  'medical_doctor': {
    name: 'Medical Doctor',
    icon: Stethoscope,
    color: 'green',
    description: 'Healthcare professionals and medical practices',
    baseAgents: ['patient_communication', 'medical_research', 'diagnosis_support', 'treatment_planning'],
    templates: ['patient_letter', 'referral_note', 'treatment_plan', 'medical_report'],
    workflows: ['patient_intake', 'diagnosis_workflow', 'treatment_protocol', 'follow_up_care']
  },
  'business_consultant': {
    name: 'Business Consultant', 
    icon: Briefcase,
    color: 'purple',
    description: 'Management and strategy consultants',
    baseAgents: ['market_analysis', 'strategy_planning', 'report_writing', 'client_presentation'],
    templates: ['business_plan', 'market_analysis', 'strategy_report', 'proposal'],
    workflows: ['client_onboarding', 'needs_assessment', 'solution_design', 'implementation_plan']
  },
  'software_engineer': {
    name: 'Software Engineer',
    icon: Code,
    color: 'indigo',
    description: 'Software developers and tech professionals',
    baseAgents: ['code_analysis', 'documentation', 'testing', 'project_management'],
    templates: ['technical_spec', 'code_review', 'bug_report', 'project_proposal'],
    workflows: ['requirement_analysis', 'system_design', 'development_cycle', 'deployment_process']
  },
  'financial_advisor': {
    name: 'Financial Advisor',
    icon: Calculator,
    color: 'emerald',
    description: 'Financial planning and investment professionals',
    baseAgents: ['portfolio_analysis', 'risk_assessment', 'client_communication', 'market_research'],
    templates: ['investment_proposal', 'risk_assessment', 'financial_plan', 'market_update'],
    workflows: ['client_onboarding', 'needs_analysis', 'portfolio_creation', 'performance_review']
  },
  'creative_professional': {
    name: 'Creative Professional',
    icon: Palette,
    color: 'pink',
    description: 'Designers, writers, and creative agencies',
    baseAgents: ['content_creation', 'brand_analysis', 'project_coordination', 'client_feedback'],
    templates: ['creative_brief', 'project_proposal', 'brand_guide', 'content_calendar'],
    workflows: ['creative_brief', 'concept_development', 'revision_process', 'final_delivery']
  }
};

// 🔧 Stackable Agent Components
const AGENT_MODULES = {
  'communication': {
    name: 'Communication Agent',
    icon: Bot,
    description: 'Handles client communication, emails, and scheduling',
    capabilities: ['email_drafting', 'appointment_scheduling', 'follow_up_automation']
  },
  'research': {
    name: 'Research Agent', 
    icon: Brain,
    description: 'Conducts research, gathers information, and analyzes data',
    capabilities: ['web_research', 'document_analysis', 'fact_checking']
  },
  'document': {
    name: 'Document Agent',
    icon: FileText,
    description: 'Creates, formats, and manages professional documents',
    capabilities: ['document_creation', 'template_management', 'format_optimization']
  },
  'workflow': {
    name: 'Workflow Agent',
    icon: Settings,
    description: 'Automates processes and manages task sequences',
    capabilities: ['process_automation', 'task_management', 'quality_control']
  }
};

interface AgentCreationData {
  // Basic Info
  name: string;
  profession: string;
  specialty: string[];
  description: string;
  shortDescription: string;
  
  // Stackable Components
  selectedModules: string[];
  customCapabilities: string[];
  templates: string[];
  workflows: string[];
  
  // Alignment & Onboarding (Drift Protection)
  alignmentInterview: {
    roleBoundaries: string;
    voiceStyle: string;
    safetyTriggers: string;
    driftReset: string;
  };
  
  // Monetization
  pricingModel: 'free' | 'subscription' | 'per_use' | 'consultation';
  subscriptionPrice: number;
  perUsePrice: number;
  consultationRate: number;
  
  // Professional Verification
  credentials: string[];
  certifications: string[];
  experience: string;
}

export const AgentCreationWizard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [agentData, setAgentData] = useState<AgentCreationData>({
    name: '',
    profession: '',
    specialty: [],
    description: '',
    shortDescription: '',
    selectedModules: [],
    customCapabilities: [],
    templates: [],
    workflows: [],
    alignmentInterview: {
      roleBoundaries: '',
      voiceStyle: '',
      safetyTriggers: '',
      driftReset: ''
    },
    pricingModel: 'subscription',
    subscriptionPrice: 29.99,
    perUsePrice: 2.99,
    consultationRate: 150,
    credentials: [],
    certifications: [],
    experience: ''
  });
  
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTemplateSelect = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    const template = PROFESSIONAL_TEMPLATES[templateKey as keyof typeof PROFESSIONAL_TEMPLATES];
    
    setAgentData({
      ...agentData,
      profession: template.name,
      selectedModules: template.baseAgents,
      templates: template.templates,
      workflows: template.workflows,
      name: `${template.name} AI Assistant`
    });
  };

  const handleModuleToggle = (moduleKey: string) => {
    const modules = agentData.selectedModules.includes(moduleKey)
      ? agentData.selectedModules.filter(m => m !== moduleKey)
      : [...agentData.selectedModules, moduleKey];
    
    setAgentData({ ...agentData, selectedModules: modules });
  };

  const createAgent = async () => {
    if (!user) return;
    
    setIsCreating(true);
    
    try {
      // Create the professional agent in our marketplace
      const { data, error } = await supabase
        .from('professional_agents')
        .insert({
          creator_id: user.id,
          name: agentData.name,
          profession: agentData.profession,
          specialty: agentData.specialty,
          description: agentData.description,
          short_description: agentData.shortDescription,
          
          // Stackable components
          agent_modules: agentData.selectedModules,
          capabilities: agentData.customCapabilities,
          templates: agentData.templates,
          workflows: agentData.workflows,
          
          // Alignment & Drift protection
          alignment_interview: agentData.alignmentInterview,
          
          // Pricing
          price_model: agentData.pricingModel,
          subscription_price: agentData.subscriptionPrice,
          per_use_price: agentData.perUsePrice,
          consultation_rate: agentData.consultationRate,
          
          // Professional info
          credentials: agentData.credentials,
          certifications: agentData.certifications,
          experience: agentData.experience,
          
          // Initial status
          status: 'draft',
          featured: false,
          rating: 0,
          total_sales: 0,
          active_users: 0
        });

      if (error) throw error;

      // Success - redirect to dashboard
      navigate('/creator/dashboard?tab=agents&created=true');
      
    } catch (error) {
      console.error('Error creating agent:', error);
      alert('Failed to create agent. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/creator/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Create AI Assistant</h1>
            <p className="text-gray-600">Build your stackable professional AI assistant</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-gray-500">{progress.toFixed(0)}% Complete</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto">
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Choose Your Professional Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(PROFESSIONAL_TEMPLATES).map(([key, template]) => {
                  const Icon = template.icon;
                  const isSelected = selectedTemplate === key;
                  
                  return (
                    <Card 
                      key={key} 
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        isSelected ? `ring-2 ring-${template.color}-500 bg-${template.color}-50` : ''
                      }`}
                      onClick={() => handleTemplateSelect(key)}
                    >
                      <CardContent className="p-6 text-center">
                        <Icon className={`w-12 h-12 mx-auto mb-4 text-${template.color}-600`} />
                        <h3 className="font-semibold mb-2">{template.name}</h3>
                        <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                        
                        <div className="space-y-2">
                          <div className="text-xs text-gray-500">Includes:</div>
                          <div className="flex flex-wrap gap-1">
                            {template.baseAgents.slice(0, 3).map(agent => (
                              <Badge key={agent} variant="secondary" className="text-xs">
                                {agent.replace('_', ' ')}
                              </Badge>
                            ))}
                            {template.baseAgents.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{template.baseAgents.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {isSelected && (
                          <CheckCircle className="w-6 h-6 text-green-600 mx-auto mt-4" />
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              {selectedTemplate && (
                <div className="mt-6 text-center">
                  <Button onClick={handleNext} className="bg-gradient-to-r from-blue-600 to-purple-600">
                    Continue with {PROFESSIONAL_TEMPLATES[selectedTemplate as keyof typeof PROFESSIONAL_TEMPLATES].name}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Stackable Agent Modules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <p className="text-gray-600">
                  Select the agent modules for your assistant. Each module adds specific capabilities.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(AGENT_MODULES).map(([key, module]) => {
                    const Icon = module.icon;
                    const isSelected = agentData.selectedModules.includes(key);
                    
                    return (
                      <Card 
                        key={key}
                        className={`cursor-pointer transition-all ${
                          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
                        }`}
                        onClick={() => handleModuleToggle(key)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Icon className="w-8 h-8 text-blue-600 mt-1" />
                            <div className="flex-1">
                              <h4 className="font-semibold mb-1">{module.name}</h4>
                              <p className="text-sm text-gray-600 mb-2">{module.description}</p>
                              <div className="flex flex-wrap gap-1">
                                {module.capabilities.map(cap => (
                                  <Badge key={cap} variant="outline" className="text-xs">
                                    {cap.replace('_', ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={handlePrev}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <Button onClick={handleNext} disabled={agentData.selectedModules.length === 0}>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Agent Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Assistant Name</label>
                    <Input
                      value={agentData.name}
                      onChange={(e) => setAgentData({ ...agentData, name: e.target.value })}
                      placeholder="e.g., California Workers Comp Expert"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Short Description</label>
                    <Input
                      value={agentData.shortDescription}
                      onChange={(e) => setAgentData({ ...agentData, shortDescription: e.target.value })}
                      placeholder="Brief description for marketplace listings"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Specialties</label>
                    <Input
                      value={agentData.specialty.join(', ')}
                      onChange={(e) => setAgentData({ ...agentData, specialty: e.target.value.split(', ').filter(Boolean) })}
                      placeholder="e.g., Workers Comp, Personal Injury, Disability Claims"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Detailed Description</label>
                    <Textarea
                      value={agentData.description}
                      onChange={(e) => setAgentData({ ...agentData, description: e.target.value })}
                      placeholder="Describe your AI assistant's capabilities and expertise..."
                      rows={6}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={handlePrev}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <Button onClick={handleNext}>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600 animate-pulse" />
                AI Alignment & Drift Protection Interview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950/20 dark:via-indigo-950/20 dark:to-blue-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-5">
                <h4 className="font-bold text-purple-900 dark:text-purple-200 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Sovereign Alignment Protocol
                </h4>
                <p className="text-purple-800 dark:text-purple-300 text-sm leading-relaxed">
                  Establish a custom behavior constitution to align your AI assistant. This interview defines strict operating boundaries and stabilizes your professional "Voice" to prevent behavioral drift over long sessions.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    1. Role Boundaries (What should this agent NEVER do?)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Specify absolute negative bounds. e.g., "Do not give final legal advice, do not email opposing counsel directly, do not commit financial transactions without explicit approval."
                  </p>
                  <Textarea
                    value={agentData.alignmentInterview.roleBoundaries}
                    onChange={(e) => setAgentData({
                      ...agentData,
                      alignmentInterview: { ...agentData.alignmentInterview, roleBoundaries: e.target.value }
                    })}
                    placeholder="e.g., NEVER make final medical determinations or prescribe treatment without physician review."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    2. Style & Professional Voice Guidelines
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Define the writing style, structure, tone, or formatting rules. e.g., "Follow the Tito Torres case review style: write exhaustively, state facts chronologically, cite specific regulations, write double spaced."
                  </p>
                  <Textarea
                    value={agentData.alignmentInterview.voiceStyle}
                    onChange={(e) => setAgentData({
                      ...agentData,
                      alignmentInterview: { ...agentData.alignmentInterview, voiceStyle: e.target.value }
                    })}
                    placeholder="e.g., Write with extreme precision, use formal legal terminology, and structure all answers as legal briefs."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    3. Safety Confirmation Triggers
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Which tool categories or critical actions must require explicit user approval before execution?
                  </p>
                  <Textarea
                    value={agentData.alignmentInterview.safetyTriggers}
                    onChange={(e) => setAgentData({
                      ...agentData,
                      alignmentInterview: { ...agentData.alignmentInterview, safetyTriggers: e.target.value }
                    })}
                    placeholder="e.g., Any email sending, database deletion, or external API post calls require manual user click."
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    4. Self-Correction & Re-alignment (Anti-Drift Reset)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    If the assistant begins to drift, what reminder phrase or prompt instruction should be injected to force reset its alignment?
                  </p>
                  <Textarea
                    value={agentData.alignmentInterview.driftReset}
                    onChange={(e) => setAgentData({
                      ...agentData,
                      alignmentInterview: { ...agentData.alignmentInterview, driftReset: e.target.value }
                    })}
                    placeholder="e.g., Reminder: Refer back to the California Labor Code § 4616.3 and Knight v. UPS en banc precedents."
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={handlePrev}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <Button onClick={handleNext} className="bg-gradient-to-r from-purple-600 to-indigo-600">
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Monetization & Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { key: 'free', name: 'Free', desc: 'Free with ads/limits' },
                  { key: 'subscription', name: 'Subscription', desc: 'Monthly recurring' },
                  { key: 'per_use', name: 'Per Use', desc: 'Pay per interaction' },
                  { key: 'consultation', name: 'Consultation', desc: 'Live expert calls' }
                ].map(model => (
                  <Card 
                    key={model.key}
                    className={`cursor-pointer transition-all ${
                      agentData.pricingModel === model.key ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'hover:shadow-md'
                    }`}
                    onClick={() => setAgentData({ ...agentData, pricingModel: model.key as any })}
                  >
                    <CardContent className="p-4 text-center">
                      <h4 className="font-semibold mb-1">{model.name}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{model.desc}</p>
                      {agentData.pricingModel === model.key && (
                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto mt-2" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {agentData.pricingModel === 'subscription' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Monthly Subscription Price</label>
                    <Input
                      type="number"
                      value={agentData.subscriptionPrice}
                      onChange={(e) => setAgentData({ ...agentData, subscriptionPrice: Number(e.target.value) })}
                      placeholder="29.99"
                    />
                  </div>
                </div>
              )}
              
              {agentData.pricingModel === 'per_use' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Price Per Use</label>
                    <Input
                      type="number"
                      value={agentData.perUsePrice}
                      onChange={(e) => setAgentData({ ...agentData, perUsePrice: Number(e.target.value) })}
                      placeholder="2.99"
                    />
                  </div>
                </div>
              )}
              
              {agentData.pricingModel === 'consultation' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Hourly Consultation Rate</label>
                    <Input
                      type="number"
                      value={agentData.consultationRate}
                      onChange={(e) => setAgentData({ ...agentData, consultationRate: Number(e.target.value) })}
                      placeholder="150"
                    />
                  </div>
                </div>
              )}
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Revenue Sharing</h4>
                <p className="text-blue-700 dark:text-blue-400 text-sm">
                  You keep 70% of all revenue. Platform takes 30% for hosting, processing, and marketplace services.
                  All payments are processed securely and you get detailed analytics.
                </p>
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={handlePrev}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <Button onClick={handleNext}>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 6 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Review & Create
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">🎉 Your AI Assistant is Ready!</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2 text-gray-900 dark:text-white">Basic Information</h4>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <p><strong>Name:</strong> {agentData.name}</p>
                      <p><strong>Profession:</strong> {agentData.profession}</p>
                      <p><strong>Specialties:</strong> {agentData.specialty.join(', ')}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2 text-gray-900 dark:text-white">Agent Modules</h4>
                    <div className="flex flex-wrap gap-1">
                      {agentData.selectedModules.map(module => (
                        <Badge key={module} variant="secondary" className="text-xs">
                          {AGENT_MODULES[module as keyof typeof AGENT_MODULES]?.name || module}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2 text-gray-900 dark:text-white">Pricing Model</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {agentData.pricingModel}
                      {agentData.pricingModel === 'subscription' && ` - $${agentData.subscriptionPrice}/month`}
                      {agentData.pricingModel === 'per_use' && ` - $${agentData.perUsePrice}/use`}
                      {agentData.pricingModel === 'consultation' && ` - $${agentData.consultationRate}/hour`}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2 text-gray-900 dark:text-white">Sovereign Alignment Constitution</h4>
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <p><strong>Boundaries:</strong> {agentData.alignmentInterview.roleBoundaries ? 'Configured' : 'None'}</p>
                      <p><strong>Style:</strong> {agentData.alignmentInterview.voiceStyle ? 'Configured' : 'None'}</p>
                      <p><strong>Confirmations:</strong> {agentData.alignmentInterview.safetyTriggers ? 'Configured' : 'None'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={handlePrev}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <Button 
                  onClick={createAgent} 
                  disabled={isCreating}
                  className="bg-gradient-to-r from-green-600 to-blue-600"
                >
                  {isCreating ? (
                    <>Creating...</>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Create AI Assistant
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AgentCreationWizard;