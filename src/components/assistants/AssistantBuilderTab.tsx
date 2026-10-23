import React, { useState } from 'react';
import {
  Brain,
  Zap,
  BookOpen,
  Mic,
  Workflow,
  Package,
  Stethoscope,
  Scale,
  Briefcase,
  Code,
  Calculator,
  Palette,
  Layers,
  Wrench,
  Users,
  Building,
  Globe,
  Bot
} from 'lucide-react';
import { Button } from '../ui/Button';
import { VoiceAgentCreator } from '../voice/VoiceAgentCreator';
import { CreatedAgentWorkflow } from '../../services/VoiceAgentCreationService';

export const LEGO_COMPONENTS = {
  personality: {
    name: 'Personality Core',
    icon: Brain,
    color: 'purple',
    description: 'Defines communication style and behavior',
    options: ['Professional', 'Friendly', 'Technical', 'Creative', 'Authoritative']
  },
  skills: {
    name: 'Skills & Capabilities',
    icon: Zap,
    color: 'blue',
    description: 'What the assistant can do',
    options: ['Research', 'Writing', 'Analysis', 'Communication', 'Planning']
  },
  knowledge: {
    name: 'Knowledge Base',
    icon: BookOpen,
    color: 'green',
    description: 'Information sources and domain expertise',
    options: ['Documents', 'Web Search', 'Industry Data', 'Templates', 'Policies']
  },
  voice: {
    name: 'Voice & Interface',
    icon: Mic,
    color: 'orange',
    description: 'How users interact with the assistant',
    options: ['Text Only', 'Voice Enabled', 'Multi-Modal', 'Quick Actions']
  },
  automation: {
    name: 'Automation Rules',
    icon: Workflow,
    color: 'red',
    description: 'Automated workflows and triggers',
    options: ['Email Processing', 'Document Generation', 'Scheduling', 'Notifications']
  },
  integrations: {
    name: 'System Integrations',
    icon: Package,
    color: 'indigo',
    description: 'External systems and APIs',
    options: ['Calendar', 'Email', 'CRM', 'File Storage', 'Databases']
  }
};

export const PROFESSIONAL_TEMPLATES = {
  medical_doctor: {
    name: 'Medical Doctor',
    icon: Stethoscope,
    color: 'green',
    description: 'Healthcare professionals and medical practices',
    defaultComponents: {
      personality: 'Professional',
      skills: ['Research', 'Analysis', 'Communication'],
      knowledge: ['Medical Literature', 'Patient Guidelines', 'Treatment Protocols'],
      voice: 'Voice Enabled',
      automation: ['Patient Communication', 'Report Generation'],
      integrations: ['Electronic Health Records', 'Calendar']
    }
  },
  work_comp_attorney: {
    name: 'Workers Comp Attorney',
    icon: Scale,
    color: 'blue',
    description: 'Legal professionals specializing in workers compensation',
    defaultComponents: {
      personality: 'Authoritative',
      skills: ['Legal Research', 'Document Analysis', 'Case Planning'],
      knowledge: ['Legal Databases', 'Case Law', 'Regulations'],
      voice: 'Text Only',
      automation: ['Case File Management', 'Client Updates'],
      integrations: ['Legal Databases', 'Document Management']
    }
  },
  business_consultant: {
    name: 'Business Consultant',
    icon: Briefcase,
    color: 'purple',
    description: 'Management and strategy consultants',
    defaultComponents: {
      personality: 'Professional',
      skills: ['Analysis', 'Planning', 'Presentation'],
      knowledge: ['Industry Reports', 'Market Data', 'Best Practices'],
      voice: 'Multi-Modal',
      automation: ['Report Generation', 'Client Presentations'],
      integrations: ['CRM', 'Analytics Tools', 'Project Management']
    }
  },
  software_engineer: {
    name: 'Software Engineer',
    icon: Code,
    color: 'indigo',
    description: 'Software developers and tech professionals',
    defaultComponents: {
      personality: 'Technical',
      skills: ['Code Analysis', 'Documentation', 'Problem Solving'],
      knowledge: ['Technical Documentation', 'Code Repositories', 'API References'],
      voice: 'Text Only',
      automation: ['Code Review', 'Documentation Generation'],
      integrations: ['Version Control', 'Issue Tracking', 'CI/CD']
    }
  },
  financial_advisor: {
    name: 'Financial Advisor',
    icon: Calculator,
    color: 'emerald',
    description: 'Financial planning and investment professionals',
    defaultComponents: {
      personality: 'Professional',
      skills: ['Analysis', 'Planning', 'Research'],
      knowledge: ['Market Data', 'Financial Regulations', 'Investment Products'],
      voice: 'Voice Enabled',
      automation: ['Portfolio Analysis', 'Client Reports'],
      integrations: ['Financial APIs', 'Portfolio Management', 'CRM']
    }
  },
  creative_professional: {
    name: 'Creative Professional',
    icon: Palette,
    color: 'pink',
    description: 'Designers, writers, and creative agencies',
    defaultComponents: {
      personality: 'Creative',
      skills: ['Creative Writing', 'Visual Design', 'Project Management'],
      knowledge: ['Design Trends', 'Brand Guidelines', 'Creative Resources'],
      voice: 'Multi-Modal',
      automation: ['Content Calendar', 'Asset Generation'],
      integrations: ['Design Tools', 'Content Management', 'Social Media']
    }
  }
};

interface AssistantBuilderTabProps {
  onAddAssistant: (assistant: any) => void;
  onSetView: (view: any) => void;
}

export const AssistantBuilderTab: React.FC<AssistantBuilderTabProps> = ({
  onAddAssistant,
  onSetView
}) => {
  const [builderMode, setBuilderMode] = useState<'template' | 'custom' | 'voice'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [builderComponents, setBuilderComponents] = useState<Record<string, any>>({});
  const [builderPreview, setBuilderPreview] = useState<CreatedAgentWorkflow | null>(null);
  const [assistantVisibility, setAssistantVisibility] = useState<'personal' | 'team' | 'org' | 'public'>('personal');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Layers className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Visual Agent Builder
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Build your personal AI assistant by stacking visual components. Start with a professional template or create from scratch.
        </p>
      </div>

      {/* Mode Selector */}
      <div className="flex justify-center">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <Button
            variant={builderMode === 'template' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBuilderMode('template')}
            className="rounded-md"
          >
            <Package className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <Button
            variant={builderMode === 'custom' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBuilderMode('custom')}
            className="rounded-md"
          >
            <Wrench className="w-4 h-4 mr-2" />
            Custom Build
          </Button>
          <Button
            variant={builderMode === 'voice' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBuilderMode('voice')}
            className="rounded-md"
          >
            <Mic className="w-4 h-4 mr-2" />
            Voice Create
          </Button>
        </div>
      </div>

      {/* Visibility Selector */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <Button
            variant={assistantVisibility === 'personal' ? 'default' : 'ghost'}
            onClick={() => setAssistantVisibility('personal')}
            size="sm"
            title="Only you can see this"
            className="h-8"
          >
            <Users className="w-3 h-3 mr-2" /> Personal
          </Button>
          <Button
            variant={assistantVisibility === 'team' ? 'default' : 'ghost'}
            onClick={() => setAssistantVisibility('team')}
            size="sm"
            title="Share with your team"
            className="h-8"
          >
            <Building className="w-3 h-3 mr-2" /> Team
          </Button>
          <Button
            variant={assistantVisibility === 'public' ? 'default' : 'ghost'}
            onClick={() => setAssistantVisibility('public')}
            size="sm"
            title="Available to everyone"
            className="h-8"
          >
            <Globe className="w-3 h-3 mr-2" /> Public
          </Button>
        </div>
      </div>

      {/* Template Mode */}
      {builderMode === 'template' && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Choose Your Professional Template
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(PROFESSIONAL_TEMPLATES).map(([key, template]) => {
              const Icon = template.icon;
              const isSelected = selectedTemplate === key;

              return (
                <div
                  key={key}
                  onClick={() => {
                    setSelectedTemplate(key);
                    setBuilderComponents(template.defaultComponents);
                  }}
                  className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? `border-blue-500 bg-blue-50 dark:bg-blue-900/20`
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{template.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{template.description}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-4 space-y-2">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Includes:</div>
                      <div className="flex flex-wrap gap-1">
                        {Object.values(template.defaultComponents)
                          .flat()
                          .slice(0, 4)
                          .map((item, index) => (
                            <span key={index} className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs">
                              {item}
                            </span>
                          ))}
                        <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs">+more</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {selectedTemplate && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Template Preview</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(LEGO_COMPONENTS).map(([key, component]) => {
                  const Icon = component.icon;
                  const selectedValues = builderComponents[key] || [];

                  return (
                    <div key={key} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Icon className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-gray-900 dark:text-white text-sm">
                          {component.name}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {component.description}
                      </div>
                      <div className="space-y-1">
                        {Array.isArray(selectedValues) ? (
                          selectedValues.slice(0, 2).map((value, index) => (
                            <div key={index} className="text-xs bg-white dark:bg-gray-600 px-2 py-1 rounded">
                              {value}
                            </div>
                          ))
                        ) : (
                          <div className="text-xs bg-white dark:bg-gray-600 px-2 py-1 rounded">
                            {selectedValues}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-center">
                <Button
                  onClick={() => {
                    const template =
                      PROFESSIONAL_TEMPLATES[selectedTemplate as keyof typeof PROFESSIONAL_TEMPLATES];
                    const newAssistant = {
                      name: template.name + ' Assistant',
                      description: template.description,
                      capabilities: Object.values(builderComponents).flat(),
                      system_prompt: `You are a ${template.name} AI assistant specialized in ${template.description}`,
                      type: 'general' as const,
                      isActive: true,
                      visibility: assistantVisibility
                    };
                    onAddAssistant(newAssistant);
                    onSetView('overview');
                  }}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Bot className="w-5 h-5 mr-2" />
                  Create Assistant
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Custom Build Mode */}
      {builderMode === 'custom' && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Build Your Custom Agent Stack
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Select components to stack together into your custom AI assistant
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Component Library</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(LEGO_COMPONENTS).map(([key, component]) => {
                const Icon = component.icon;

                return (
                  <div
                    key={key}
                    className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors"
                    onClick={() => {
                      setBuilderComponents({
                        ...builderComponents,
                        [key]: component.options[0]
                      });
                    }}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <Icon className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{component.name}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{component.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {Object.keys(builderComponents).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Your Agent Stack</h4>
              <div className="space-y-4">
                {Object.entries(builderComponents).map(([key, value]) => {
                  const component = LEGO_COMPONENTS[key as keyof typeof LEGO_COMPONENTS];
                  const Icon = component.icon;

                  return (
                    <div
                      key={key}
                      className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">{component.name}</div>
                        <select
                          value={Array.isArray(value) ? value[0] || '' : value || ''}
                          onChange={(e) =>
                            setBuilderComponents({
                              ...builderComponents,
                              [key]: e.target.value
                            })
                          }
                          className="mt-1 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-2 py-1"
                        >
                          {component.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newComponents = { ...builderComponents };
                          delete newComponents[key];
                          setBuilderComponents(newComponents);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-center">
                <Button
                  onClick={() => {
                    const newAssistant = {
                      name: 'Custom AI Assistant',
                      description: 'Custom built AI assistant',
                      capabilities: Object.values(builderComponents),
                      system_prompt: `You are a custom AI assistant with the following capabilities: ${Object.values(
                        builderComponents
                      ).join(', ')}`,
                      type: 'general' as const,
                      isActive: true,
                      visibility: assistantVisibility
                    };
                    onAddAssistant(newAssistant);
                    onSetView('overview');
                  }}
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  <Bot className="w-5 h-5 mr-2" />
                  Create Custom Assistant
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Voice Create Mode */}
      {builderMode === 'voice' && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Speak Your Assistant Into Existence
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Describe what you want your AI assistant to do and watch it build visually
            </p>
          </div>

          <VoiceAgentCreator
            onAgentCreated={(workflow: CreatedAgentWorkflow) => {
              const voiceComponents = {
                personality: 'Professional',
                skills: workflow.agents?.map((a) => String(a)) || [],
                knowledge: workflow.industry || 'General',
                voice: 'Voice Enabled',
                automation: ['Voice Processing'],
                integrations: ['Speech Recognition']
              };
              setBuilderComponents(voiceComponents);
              setBuilderPreview(workflow);
            }}
            className="max-w-2xl mx-auto"
          />

          {builderPreview && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                Voice-Created Agent Preview
              </h4>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="font-medium text-gray-900 dark:text-white">Agent Name</div>
                    <div className="text-gray-600 dark:text-gray-400">{builderPreview.name}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium text-gray-900 dark:text-white">Industry</div>
                    <div className="text-gray-600 dark:text-gray-400">{builderPreview.industry}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-medium text-gray-900 dark:text-white">Description</div>
                  <div className="text-gray-600 dark:text-gray-400">{builderPreview.description}</div>
                </div>

                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={() => {
                      onAddAssistant({
                        name: builderPreview.name,
                        description: builderPreview.description,
                        capabilities: builderPreview.agents?.map((a) => String(a)) || [],
                        system_prompt: `You are ${builderPreview.name}, ${builderPreview.description}. You specialize in ${builderPreview.industry}.`,
                        type: 'general' as const,
                        isActive: true,
                        visibility: assistantVisibility
                      });
                      onSetView('overview');
                    }}
                    size="lg"
                    className="bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-700 hover:to-purple-700"
                  >
                    <Mic className="w-5 h-5 mr-2" />
                    Create Voice Assistant
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
