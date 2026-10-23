import React, { useState } from 'react';
import {
  Scale,
  FileText,
  Search,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Users,
  Calendar,
  Settings,
  Brain,
  Target,
  TrendingUp,
  Clock,
  Zap,
  Shield,
  Database,
  Workflow
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAssistantStore } from '../../store/assistantStore';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { useTaskStore } from '../../store/taskStore';

interface LegalCapability {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'training' | 'available';
  proficiency: number; // 0-100
  taskTypes: string[];
  trainable: boolean;
  examples: string[];
}

const legalCapabilities: LegalCapability[] = [
  {
    id: 'legal_research',
    name: 'Legal Research',
    description: 'Comprehensive legal research across databases, case law, and statutes',
    icon: <Search className="h-5 w-5" />,
    status: 'active',
    proficiency: 85,
    taskTypes: ['Research Request', 'Case Law Search', 'Statute Analysis'],
    trainable: true,
    examples: [
      'Find all cases related to breach of contract in NY state court',
      'Research employment discrimination precedents',
      'Analyze regulatory changes in healthcare law'
    ]
  },
  {
    id: 'document_analysis',
    name: 'Document Analysis',
    description: 'AI-powered analysis of legal documents for key terms, risks, and obligations',
    icon: <FileText className="h-5 w-5" />,
    status: 'active',
    proficiency: 90,
    taskTypes: ['Contract Review', 'Due Diligence', 'Document Summarization'],
    trainable: true,
    examples: [
      'Analyze lease agreement for tenant obligations',
      'Review merger documents for regulatory risks',
      'Extract key terms from employment contracts'
    ]
  },
  {
    id: 'contract_review',
    name: 'Contract Review',
    description: 'Detailed contract examination with risk assessment and recommendations',
    icon: <Shield className="h-5 w-5" />,
    status: 'active',
    proficiency: 88,
    taskTypes: ['Contract Analysis', 'Risk Assessment', 'Compliance Review'],
    trainable: true,
    examples: [
      'Review SaaS agreement for data privacy clauses',
      'Analyze partnership agreement terms',
      'Check contract compliance with state regulations'
    ]
  },
  {
    id: 'case_law_search',
    name: 'Case Law Search',
    description: 'Advanced search and analysis of judicial decisions and precedents',
    icon: <BookOpen className="h-5 w-5" />,
    status: 'active',
    proficiency: 82,
    taskTypes: ['Precedent Research', 'Citation Analysis', 'Legal Trends'],
    trainable: true,
    examples: [
      'Find Supreme Court decisions on constitutional issues',
      'Analyze circuit split on intellectual property',
      'Research state court trends in personal injury'
    ]
  },
  {
    id: 'legal_writing',
    name: 'Legal Writing',
    description: 'Drafting and editing legal documents, briefs, and memoranda',
    icon: <Scale className="h-5 w-5" />,
    status: 'active',
    proficiency: 75,
    taskTypes: ['Brief Drafting', 'Motion Writing', 'Legal Memo'],
    trainable: true,
    examples: [
      'Draft motion to dismiss for summary judgment',
      'Prepare client advisory memo on new regulations',
      'Write appellate brief on constitutional grounds'
    ]
  },
  {
    id: 'compliance_check',
    name: 'Compliance Verification',
    description: 'Regulatory compliance analysis and verification across jurisdictions',
    icon: <CheckCircle className="h-5 w-5" />,
    status: 'active',
    proficiency: 80,
    taskTypes: ['Compliance Audit', 'Regulatory Analysis', 'Policy Review'],
    trainable: true,
    examples: [
      'Verify GDPR compliance for data processing',
      'Check SEC filing requirements',
      'Analyze environmental regulation compliance'
    ]
  },
  {
    id: 'litigation_support',
    name: 'Litigation Support',
    description: 'E-discovery, document production, and trial preparation assistance',
    icon: <Users className="h-5 w-5" />,
    status: 'available',
    proficiency: 0,
    taskTypes: ['E-Discovery', 'Document Production', 'Trial Prep'],
    trainable: true,
    examples: [
      'Organize discovery documents by relevance',
      'Prepare witness examination outlines',
      'Analyze opposing counsel arguments'
    ]
  },
  {
    id: 'client_communication',
    name: 'Client Communication',
    description: 'Draft client updates, status reports, and legal explanations',
    icon: <Calendar className="h-5 w-5" />,
    status: 'available',
    proficiency: 0,
    taskTypes: ['Client Updates', 'Status Reports', 'Legal Explanations'],
    trainable: true,
    examples: [
      'Draft client status update on case progress',
      'Explain complex legal concepts in plain language',
      'Prepare case timeline for client meeting'
    ]
  }
];

export function LegalAssistantCapabilities() {
  const [selectedCapability, setSelectedCapability] = useState<string | null>(null);
  const [showTrainingOptions, setShowTrainingOptions] = useState(false);
  const { getAssistantById, updateAssistant } = useAssistantStore();
  const { documents } = useKnowledgeBaseStore();
  const { tasks } = useTaskStore();

  const legalAssistant = getAssistantById('legal-assistant');
  const linkedDocuments = documents.filter(doc => 
    legalAssistant?.linkedFolders?.includes(doc.folderId || '')
  );
  const linkedTasks = tasks.filter(task => 
    task.assignedAssistants?.includes('legal-assistant')
  );

  const activeCapabilities = legalCapabilities.filter(cap => cap.status === 'active');
  const trainableCapabilities = legalCapabilities.filter(cap => cap.trainable && cap.status === 'available');

  const handleTrainCapability = async (capabilityId: string) => {
    // In a real implementation, this would start a training process
    console.log(`Starting training for capability: ${capabilityId}`);
    
    // Simulate training by updating the assistant's capabilities
    if (legalAssistant) {
      const capability = legalCapabilities.find(cap => cap.id === capabilityId);
      if (capability) {
        const updatedCapabilities = [...(legalAssistant.capabilities || []), capabilityId];
        updateAssistant('legal-assistant', {
          capabilities: updatedCapabilities,
          systemPrompt: legalAssistant.systemPrompt + ` Enhanced with ${capability.name} capabilities.`
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Scale className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Legal Assistant Capabilities
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage and expand your AI legal assistant's skills
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowTrainingOptions(!showTrainingOptions)}
        >
          <Brain className="h-4 w-4 mr-2" />
          Training Center
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-green-500" />
            <span className="font-medium">Active Skills</span>
          </div>
          <p className="text-2xl font-bold mt-2">{activeCapabilities.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-500" />
            <span className="font-medium">Linked Documents</span>
          </div>
          <p className="text-2xl font-bold mt-2">{linkedDocuments.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-purple-500" />
            <span className="font-medium">Active Tasks</span>
          </div>
          <p className="text-2xl font-bold mt-2">{linkedTasks.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            <span className="font-medium">Avg Proficiency</span>
          </div>
          <p className="text-2xl font-bold mt-2">
            {Math.round(activeCapabilities.reduce((acc, cap) => acc + cap.proficiency, 0) / activeCapabilities.length)}%
          </p>
        </Card>
      </div>

      {/* Active Capabilities */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Active Capabilities</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeCapabilities.map((capability) => (
            <Card 
              key={capability.id} 
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedCapability === capability.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedCapability(
                selectedCapability === capability.id ? null : capability.id
              )}
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  {capability.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {capability.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {capability.description}
                  </p>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Proficiency</span>
                      <span className="font-medium">{capability.proficiency}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${capability.proficiency}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedCapability === capability.id && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-sm text-gray-900 dark:text-white mb-2">
                        Task Types
                      </h5>
                      <div className="flex flex-wrap gap-1">
                        {capability.taskTypes.map((type) => (
                          <span 
                            key={type}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-sm text-gray-900 dark:text-white mb-2">
                        Example Tasks
                      </h5>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {capability.examples.slice(0, 2).map((example, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-gray-400">•</span>
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Training Center */}
      {showTrainingOptions && trainableCapabilities.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Available Training</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trainableCapabilities.map((capability) => (
              <Card key={capability.id} className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                    {capability.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {capability.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {capability.description}
                    </p>
                    <div className="mt-3 flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleTrainCapability(capability.id)}
                      >
                        <Brain className="h-4 w-4 mr-1" />
                        Start Training
                      </Button>
                      <span className="text-xs text-gray-500">
                        {capability.taskTypes.length} task types
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Autonomous Actions Info */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Workflow className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Autonomous Capabilities
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your Legal Assistant can operate autonomously with proper setup:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  📋 Task Automation
                </h4>
                <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Auto-process incoming contracts</li>
                  <li>• Schedule compliance reviews</li>
                  <li>• Generate status reports</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  🔍 Research Workflows
                </h4>
                <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Auto-research triggered by keywords</li>
                  <li>• Continuous case law monitoring</li>
                  <li>• Regulatory change alerts</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  📊 Analysis & Reporting
                </h4>
                <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Automated document analysis</li>
                  <li>• Risk assessment reports</li>
                  <li>• Client communication drafts</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 