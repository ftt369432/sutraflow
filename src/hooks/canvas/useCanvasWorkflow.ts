/**
 * useCanvasWorkflow - Canvas Workflow Management Hook
 * 
 * Manages complex workflows within the canvas system, including
 * multi-step processes, automation, and workflow state tracking.
 */

import { useState, useCallback, useEffect } from 'react';
import { WorkflowState } from './types';
import { useCanvas } from './useCanvas';
import { useCanvasAgent } from './useCanvasAgent';
import { toast } from 'sonner';

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  type: 'manual' | 'automated' | 'agent';
  agentSpecialization?: string;
  estimatedTime?: number;
  dependencies?: string[];
  isOptional?: boolean;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  documentType?: string;
}

const PREDEFINED_WORKFLOWS: Workflow[] = [
  {
    id: 'legal-contract-creation',
    name: 'Legal Contract Creation',
    description: 'Complete workflow for creating a legal contract',
    documentType: 'legal_contract',
    steps: [
      {
        id: 'research',
        name: 'Legal Research',
        description: 'Research relevant laws and precedents',
        type: 'agent',
        agentSpecialization: 'research',
        estimatedTime: 15,
      },
      {
        id: 'draft',
        name: 'Draft Contract',
        description: 'Create initial contract draft',
        type: 'agent',
        agentSpecialization: 'writing',
        estimatedTime: 30,
        dependencies: ['research'],
      },
      {
        id: 'review',
        name: 'Legal Review',
        description: 'Review contract for legal compliance',
        type: 'agent',
        agentSpecialization: 'legal_review',
        estimatedTime: 20,
        dependencies: ['draft'],
      },
      {
        id: 'format',
        name: 'Format Document',
        description: 'Apply proper formatting and structure',
        type: 'agent',
        agentSpecialization: 'formatting',
        estimatedTime: 10,
        dependencies: ['review'],
      },
      {
        id: 'final-review',
        name: 'Final Review',
        description: 'Manual review and approval',
        type: 'manual',
        estimatedTime: 15,
        dependencies: ['format'],
      },
    ],
  },
  {
    id: 'business-plan-development',
    name: 'Business Plan Development',
    description: 'Comprehensive business plan creation workflow',
    documentType: 'business_plan',
    steps: [
      {
        id: 'market-research',
        name: 'Market Research',
        description: 'Conduct market analysis and research',
        type: 'agent',
        agentSpecialization: 'research',
        estimatedTime: 45,
      },
      {
        id: 'financial-analysis',
        name: 'Financial Analysis',
        description: 'Create financial projections and analysis',
        type: 'agent',
        agentSpecialization: 'financial_analysis',
        estimatedTime: 30,
      },
      {
        id: 'content-creation',
        name: 'Content Creation',
        description: 'Write business plan content',
        type: 'agent',
        agentSpecialization: 'writing',
        estimatedTime: 60,
        dependencies: ['market-research', 'financial-analysis'],
      },
      {
        id: 'formatting',
        name: 'Document Formatting',
        description: 'Format and structure the business plan',
        type: 'agent',
        agentSpecialization: 'formatting',
        estimatedTime: 15,
        dependencies: ['content-creation'],
      },
    ],
  },
];

export function useCanvasWorkflow(workflowId?: string) {
  const { createDocument } = useCanvas();
  const { createAgent } = useCanvasAgent();
  
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    currentStep: 0,
    totalSteps: 0,
    isProcessing: false,
    canProceed: false,
    errors: [],
    completedSteps: [],
  });

  const [activeAgents, setActiveAgents] = useState<Record<string, string>>({});

  // Get workflow by ID
  const getWorkflow = useCallback((id: string) => {
    return PREDEFINED_WORKFLOWS.find(w => w.id === id) || null;
  }, []);

  // Start workflow
  const startWorkflow = useCallback((id: string, documentId?: string) => {
    const workflow = getWorkflow(id);
    if (!workflow) {
      toast.error('Workflow not found');
      return false;
    }

    setCurrentWorkflow(workflow);
    setWorkflowState({
      currentStep: 0,
      totalSteps: workflow.steps.length,
      isProcessing: false,
      canProceed: true,
      errors: [],
      completedSteps: [],
    });

    // Create document if not provided
    if (!documentId && workflow.documentType) {
      documentId = createDocument(workflow.documentType, `${workflow.name} Document`);
    }

    toast.success(`Started workflow: ${workflow.name}`);
    return true;
  }, [getWorkflow, createDocument]);

  // Execute current step
  const executeCurrentStep = useCallback(async () => {
    if (!currentWorkflow || workflowState.isProcessing) return false;

    const currentStep = currentWorkflow.steps[workflowState.currentStep];
    if (!currentStep) return false;

    setWorkflowState(prev => ({ ...prev, isProcessing: true }));

    try {
      if (currentStep.type === 'agent' && currentStep.agentSpecialization) {
        // Create and assign agent
        const documentId = 'current-document'; // Would get from context
        const agentId = createAgent(documentId, currentStep.agentSpecialization as any);
        
        if (agentId) {
          setActiveAgents(prev => ({ ...prev, [currentStep.id]: agentId }));
          toast.success(`Started ${currentStep.name}`);
        }
      } else if (currentStep.type === 'manual') {
        toast.info(`Manual step: ${currentStep.name}. Please complete manually.`);
      }

      // Simulate step completion for automated steps
      if (currentStep.type === 'automated') {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      return true;
    } catch (error) {
      console.error('Error executing workflow step:', error);
      toast.error(`Failed to execute step: ${currentStep.name}`);
      return false;
    } finally {
      setWorkflowState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [currentWorkflow, workflowState, createAgent]);

  // Complete current step
  const completeCurrentStep = useCallback(() => {
    if (!currentWorkflow) return false;

    const stepIndex = workflowState.currentStep;
    const step = currentWorkflow.steps[stepIndex];
    
    if (!step) return false;

    setWorkflowState(prev => ({
      ...prev,
      completedSteps: [...prev.completedSteps, stepIndex],
      currentStep: Math.min(stepIndex + 1, prev.totalSteps - 1),
      canProceed: stepIndex + 1 < prev.totalSteps,
    }));

    toast.success(`Completed: ${step.name}`);

    // Check if workflow is complete
    if (stepIndex + 1 >= currentWorkflow.steps.length) {
      toast.success(`Workflow completed: ${currentWorkflow.name}`);
    }

    return true;
  }, [currentWorkflow, workflowState]);

  // Skip current step (if optional)
  const skipCurrentStep = useCallback(() => {
    if (!currentWorkflow) return false;

    const step = currentWorkflow.steps[workflowState.currentStep];
    if (!step?.isOptional) {
      toast.error('Cannot skip required step');
      return false;
    }

    setWorkflowState(prev => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, prev.totalSteps - 1),
      canProceed: prev.currentStep + 1 < prev.totalSteps,
    }));

    toast.info(`Skipped: ${step.name}`);
    return true;
  }, [currentWorkflow, workflowState]);

  // Reset workflow
  const resetWorkflow = useCallback(() => {
    setCurrentWorkflow(null);
    setWorkflowState({
      currentStep: 0,
      totalSteps: 0,
      isProcessing: false,
      canProceed: false,
      errors: [],
      completedSteps: [],
    });
    setActiveAgents({});
  }, []);

  // Get workflow progress
  const getProgress = useCallback(() => {
    if (!currentWorkflow) return 0;
    return (workflowState.completedSteps.length / workflowState.totalSteps) * 100;
  }, [currentWorkflow, workflowState]);

  // Get estimated remaining time
  const getEstimatedTime = useCallback(() => {
    if (!currentWorkflow) return 0;
    
    const remainingSteps = currentWorkflow.steps.slice(workflowState.currentStep);
    return remainingSteps.reduce((total, step) => total + (step.estimatedTime || 0), 0);
  }, [currentWorkflow, workflowState]);

  return {
    // Workflow data
    currentWorkflow,
    workflowState,
    activeAgents,
    availableWorkflows: PREDEFINED_WORKFLOWS,
    
    // Actions
    startWorkflow,
    executeCurrentStep,
    completeCurrentStep,
    skipCurrentStep,
    resetWorkflow,
    
    // Utilities
    getWorkflow,
    getProgress,
    getEstimatedTime,
    
    // Computed
    isActive: !!currentWorkflow,
    isComplete: currentWorkflow ? workflowState.completedSteps.length >= workflowState.totalSteps : false,
    currentStep: currentWorkflow?.steps[workflowState.currentStep] || null,
    canSkipCurrent: currentWorkflow?.steps[workflowState.currentStep]?.isOptional || false,
  };
}
