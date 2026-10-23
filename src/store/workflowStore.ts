import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// import { useAgentStore } from './agentStore'; // Not directly used in this file after changes
import { geminiSimplifiedService as geminiService } from '../services/gemini-simplified'; 

export interface WorkflowStep {
  id: string;
  agentId: string;
  actionType: string;
  name: string;
  description: string;
  input: string | Record<string, unknown>;
  inputType: 'static' | 'dynamic' | 'previous';
  outputMapping: string;
  condition?: {
    type: 'always' | 'if' | 'if-else';
    expression?: string;
  };
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: 'manual' | 'scheduled' | 'event';
  triggerConfig?: {
    schedule?: string;
    event?: string;
  };
  steps: WorkflowStep[];
  created: Date;
  lastRun?: Date;
  status: 'active' | 'inactive' | 'running';
}

export interface StepResult {
  stepId: string;
  output: unknown;
  status: 'completed' | 'failed';
  error?: string;
  startTime: Date;
  endTime: Date;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  stepResults: StepResult[];
  input?: unknown;
  output?: unknown;
  error?: string;
}

interface WorkflowState {
  workflows: Workflow[];
  runs: WorkflowRun[];
  isLoading: boolean;
  error: string | null;
  isEnhancing: boolean;
  enhanceError: string | null;
  
  addWorkflow: (workflow: Omit<Workflow, 'id' | 'created'>) => string;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  runWorkflow: (workflowId: string, input?: unknown) => Promise<string>;
  saveStepResult: (runId: string, result: StepResult) => void;
  completeWorkflowRun: (runId: string, status: 'completed' | 'failed', output?: unknown, error?: string) => void;
  generateWorkflowFromPrompt: (prompt: string) => Promise<Workflow>;
  enhanceTextWithAI: (prompt: string) => Promise<string>;
}

// const geminiService = new GeminiService(); // Instance is now imported

// Sample workflow for testing
const sampleWorkflow: Workflow = {
  id: '1',
  name: 'Email Processing Workflow',
  description: 'Automate processing of incoming emails, summarizing content and creating tasks',
  trigger: 'manual',
  steps: [
    {
      id: '1',
      agentId: '1',
      actionType: 'email',
      name: 'Process Email',
      description: 'Extract key information from email',
      input: '{input.email}',
      inputType: 'dynamic',
      outputMapping: 'processedEmail'
    },
    {
      id: '2',
      agentId: '1',
      actionType: 'create-task',
      name: 'Create Task',
      description: 'Create a task based on email content',
      input: '{steps.processedEmail.action_items}',
      inputType: 'previous',
      outputMapping: 'task'
    }
  ],
  created: new Date(),
  status: 'active'
};

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, _get) => ({
      workflows: [sampleWorkflow],
      runs: [],
      isLoading: false,
      error: null,
      isEnhancing: false,
      enhanceError: null,
      
      addWorkflow: (workflow) => {
        const id = crypto.randomUUID();
        set((state) => ({
          workflows: [...state.workflows, {
            ...workflow,
            id,
            created: new Date()
          }]
        }));
        return id;
      },
      
      updateWorkflow: (id, updates) => {
        set((state) => ({
          workflows: state.workflows.map(workflow => 
            workflow.id === id ? { ...workflow, ...updates } : workflow
          )
        }));
      },
      
      deleteWorkflow: (id) => {
        set((state) => ({
          workflows: state.workflows.filter(workflow => workflow.id !== id)
        }));
      },
      
      runWorkflow: async (_workflowId, _input) => {
        console.warn('runWorkflow not fully implemented in this cleanup pass');
        return crypto.randomUUID();
      },
      
      saveStepResult: (_runId, _result) => {
        console.warn('saveStepResult not fully implemented');
      },
      
      completeWorkflowRun: (_runId, _status, _output, _error) => {
        console.warn('completeWorkflowRun not fully implemented');
      },
      
      generateWorkflowFromPrompt: async (prompt) => {
        set({ isLoading: true, error: null });
        try {
          const generatedWorkflow = await geminiService.generateWorkflowFromPrompt(prompt);
          const workflowToSave = {
            ...generatedWorkflow,
            created: new Date(generatedWorkflow.created)
          };
          set((state) => ({
            workflows: [...state.workflows, workflowToSave],
            isLoading: false
          }));
          return workflowToSave;
        } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
          console.error("Store: Error generating workflow:", errorMessage);
          set({ error: errorMessage, isLoading: false });
          throw e;
        }
      },

      enhanceTextWithAI: async (prompt) => {
        set({ isEnhancing: true, enhanceError: null });
        try {
          const enhancedText = await geminiService.enhanceText(prompt);
          set({ isEnhancing: false });
          return enhancedText;
        } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
          console.error("Store: Error enhancing text:", errorMessage);
          set({ enhanceError: errorMessage, isEnhancing: false });
          throw e;
        }
      }
    }),
    {
      name: 'workflow-storage',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const state = JSON.parse(str).state;
          state.workflows = state.workflows.map((wf: Workflow) => ({
            ...wf,
            created: new Date(wf.created),
            lastRun: wf.lastRun ? new Date(wf.lastRun) : undefined,
          }));
          state.runs = state.runs.map((run: WorkflowRun) => ({
            ...run,
            startTime: new Date(run.startTime),
            endTime: run.endTime ? new Date(run.endTime) : undefined,
            stepResults: run.stepResults.map((sr: StepResult) => ({
                ...sr,
                startTime: new Date(sr.startTime),
                endTime: new Date(sr.endTime),
            }))
          }));
          return { state };
        },
        setItem: (name, newValue) => {
          localStorage.setItem(name, JSON.stringify(newValue));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
); 