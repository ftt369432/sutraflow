import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  Zap, 
  User,
  Bot,
  Settings,
  Play,
  Pause,
  StopCircle,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Target,
  Brain,
  X,
  Plus,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Shield,
  FileText,
  Search,
  Calendar,
  Mail,
  Code
} from 'lucide-react';
import { useAgentStore } from '../../store/agentStore';
import { AgentType, AgentStatus, AutonomyLevel, AgentCapability, ProfessionType } from '../../types/agent';

interface QuickAgentDeploymentProps {
  isVisible: boolean;
  onClose: () => void;
  onAgentDeployed?: (agentId: string) => void;
  context?: {
    documentId?: string;
    taskType?: string;
    urgency?: 'low' | 'medium' | 'high';
  };
}

interface AgentTemplate {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  capabilities: AgentCapability[];
  autonomyLevel: AutonomyLevel;
  profession?: ProfessionType;
  icon: React.ReactNode;
  deploymentTime: string;
  complexity: 'simple' | 'medium' | 'complex';
  tags: string[];
}

const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'legal-research',
    name: 'Legal Research Assistant',
    type: 'research',
    description: 'Specialized in legal research, case law analysis, and citation formatting',
    capabilities: ['legal-research', 'document-analysis', 'natural-language'],
    autonomyLevel: 'supervised',
    profession: ProfessionType.LEGAL,
    icon: <Shield className="w-5 h-5" />,
    deploymentTime: '2-3 minutes',
    complexity: 'complex',
    tags: ['Legal', 'Research', 'Citations']
  },
  {
    id: 'document-writer',
    name: 'Document Writer',
    type: 'document',
    description: 'Creates and edits professional documents with proper formatting',
    capabilities: ['drafting', 'document-analysis', 'natural-language'],
    autonomyLevel: 'semi-autonomous',
    icon: <FileText className="w-5 h-5" />,
    deploymentTime: '1-2 minutes',
    complexity: 'medium',
    tags: ['Writing', 'Formatting', 'Professional']
  },
  {
    id: 'research-analyst',
    name: 'Research Analyst',
    type: 'research',
    description: 'Conducts comprehensive research and data analysis',
    capabilities: ['web-search', 'data-analysis', 'report-generation'],
    autonomyLevel: 'supervised',
    icon: <Search className="w-5 h-5" />,
    deploymentTime: '3-5 minutes',
    complexity: 'complex',
    tags: ['Research', 'Analysis', 'Reports']
  },
  {
    id: 'calendar-manager',
    name: 'Calendar Manager',
    type: 'calendar',
    description: 'Manages schedules, meetings, and calendar coordination',
    capabilities: ['calendar-management', 'scheduling', 'natural-language'],
    autonomyLevel: 'semi-autonomous',
    icon: <Calendar className="w-5 h-5" />,
    deploymentTime: '1 minute',
    complexity: 'simple',
    tags: ['Scheduling', 'Calendar', 'Meetings']
  },
  {
    id: 'email-assistant',
    name: 'Email Assistant',
    type: 'email',
    description: 'Processes emails, drafts responses, and manages communications',
    capabilities: ['email-processing', 'natural-language', 'autonomous-decision-making'],
    autonomyLevel: 'supervised',
    icon: <Mail className="w-5 h-5" />,
    deploymentTime: '1-2 minutes',
    complexity: 'medium',
    tags: ['Email', 'Communication', 'Automation']
  },
  {
    id: 'code-assistant',
    name: 'Code Assistant',
    type: 'development',
    description: 'Helps with code generation, review, and debugging',
    capabilities: ['code-generation', 'code-review', 'debugging'],
    autonomyLevel: 'supervised',
    icon: <Code className="w-5 h-5" />,
    deploymentTime: '2-3 minutes',
    complexity: 'complex',
    tags: ['Development', 'Code', 'Debugging']
  }
];

const QuickAgentDeployment: React.FC<QuickAgentDeploymentProps> = ({
  isVisible,
  onClose,
  onAgentDeployed,
  context
}) => {
  const { 
    agents, 
    createAgent, 
    activateAgent, 
    deactivateAgent,
    isLoading 
  } = useAgentStore();

  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [deploymentStep, setDeploymentStep] = useState<'select' | 'configure' | 'deploy' | 'complete'>('select');
  const [agentConfig, setAgentConfig] = useState({
    name: '',
    autonomyLevel: 'supervised' as AutonomyLevel,
    customCapabilities: [] as AgentCapability[]
  });
  const [deployedAgentId, setDeployedAgentId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'simple' | 'medium' | 'complex'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'idle': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'complex': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTemplates = AGENT_TEMPLATES.filter(template => {
    const matchesFilter = filter === 'all' || template.complexity === filter;
    const matchesSearch = searchTerm === '' || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  const handleTemplateSelect = (template: AgentTemplate) => {
    setSelectedTemplate(template);
    setAgentConfig({
      name: template.name,
      autonomyLevel: template.autonomyLevel,
      customCapabilities: [...template.capabilities]
    });
    setDeploymentStep('configure');
  };

  const handleDeployAgent = useCallback(async () => {
    if (!selectedTemplate) return;

    try {
      setDeploymentStep('deploy');
      
      // Create agent using existing store
      const newAgentConfig = {
        name: agentConfig.name,
        type: selectedTemplate.type,
        description: selectedTemplate.description,
        status: 'active' as AgentStatus,
        autonomyLevel: agentConfig.autonomyLevel,
        capabilities: agentConfig.customCapabilities,
        config: {
          name: agentConfig.name,
          type: selectedTemplate.type,
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
          systemPrompt: `You are a ${selectedTemplate.name}. ${selectedTemplate.description}`,
          capabilities: agentConfig.customCapabilities,
          autonomyLevel: agentConfig.autonomyLevel
        }
      };

      createAgent(newAgentConfig);
      
      // Simulate deployment time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setDeploymentStep('complete');
      onAgentDeployed?.(newAgentConfig.name);
      
    } catch (error) {
      console.error('Failed to deploy agent:', error);
    }
  }, [selectedTemplate, agentConfig, createAgent, onAgentDeployed]);

  const resetDeployment = () => {
    setSelectedTemplate(null);
    setDeploymentStep('select');
    setDeployedAgentId(null);
    setAgentConfig({
      name: '',
      autonomyLevel: 'supervised',
      customCapabilities: []
    });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-3">
            <Zap className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Quick Agent Deployment</h2>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {agents.length} Active
            </Badge>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            {[
              { step: 'select', label: 'Select Agent', icon: Bot },
              { step: 'configure', label: 'Configure', icon: Settings },
              { step: 'deploy', label: 'Deploy', icon: Play },
              { step: 'complete', label: 'Complete', icon: CheckCircle }
            ].map(({ step, label, icon: Icon }, index) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  deploymentStep === step 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : index < ['select', 'configure', 'deploy', 'complete'].indexOf(deploymentStep)
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'border-gray-300 text-gray-500'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  deploymentStep === step ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {label}
                </span>
                {index < 3 && (
                  <ChevronRight className="w-4 h-4 text-gray-400 mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {deploymentStep === 'select' && (
            <div className="space-y-6">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search agent templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex space-x-2">
                  {['all', 'simple', 'medium', 'complex'].map((complexity) => (
                    <Button
                      key={complexity}
                      variant={filter === complexity ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter(complexity as any)}
                      className="capitalize"
                    >
                      {complexity}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Agent Templates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {template.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{template.name}</h3>
                          <Badge variant="secondary" className={getComplexityColor(template.complexity)}>
                            {template.complexity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-1">
                            {template.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs bg-gray-100">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="w-4 h-4 mr-1" />
                            {template.deploymentTime}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {deploymentStep === 'configure' && selectedTemplate && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  {selectedTemplate.icon}
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedTemplate.name}</h3>
                    <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Name
                  </label>
                  <input
                    type="text"
                    value={agentConfig.name}
                    onChange={(e) => setAgentConfig(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter agent name..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Autonomy Level
                  </label>
                  <select
                    value={agentConfig.autonomyLevel}
                    onChange={(e) => setAgentConfig(prev => ({ ...prev, autonomyLevel: e.target.value as AutonomyLevel }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="supervised">Supervised - Requires approval for actions</option>
                    <option value="semi-autonomous">Semi-Autonomous - Can perform low-risk actions</option>
                    <option value="autonomous">Autonomous - Full independence</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capabilities
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedTemplate.capabilities.map((capability) => (
                      <Badge key={capability} variant="secondary" className="bg-green-100 text-green-800">
                        {capability.replace('-', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button variant="outline" onClick={resetDeployment}>
                  Back
                </Button>
                <Button 
                  onClick={handleDeployAgent}
                  disabled={!agentConfig.name.trim()}
                  className="flex-1"
                >
                  Deploy Agent
                </Button>
              </div>
            </div>
          )}

          {deploymentStep === 'deploy' && (
            <div className="flex flex-col items-center justify-center space-y-4 py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <h3 className="text-lg font-semibold text-gray-900">Deploying Agent...</h3>
              <p className="text-sm text-gray-600">Setting up {selectedTemplate?.name}</p>
            </div>
          )}

          {deploymentStep === 'complete' && (
            <div className="flex flex-col items-center justify-center space-y-6 py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Agent Deployed Successfully!
                </h3>
                <p className="text-gray-600">
                  {agentConfig.name} is now active and ready to assist
                </p>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={resetDeployment}>
                  Deploy Another
                </Button>
                <Button onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickAgentDeployment;