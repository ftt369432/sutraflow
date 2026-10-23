import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useWorkflowStore } from './workflowStore';
import { useAgentStore } from './agentStore';

export interface Trigger {
  id: string;
  name: string;
  type: 'event' | 'schedule' | 'webhook' | 'api' | 'database';
  description: string;
  enabled: boolean;
  config: Record<string, unknown>;
  conditions?: TriggerCondition[];
  workflowIds: string[];
}

export interface TriggerCondition {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'exists';
  value: string;
}

export interface TriggerEvent {
  id: string;
  triggerId: string;
  timestamp: Date;
  data: Record<string, unknown>;
  processed: boolean;
  workflowRunIds: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface Schedule {
  id: string;
  workflowId: string;
  name: string;
  description: string;
  type: 'once' | 'recurring';
  startDate: Date;
  endDate?: Date;
  time?: string;
  recurrence?: {
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
  };
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  conditions: TriggerCondition[];
  actions: AutomationAction[];
  enabled: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
}

export interface AutomationAction {
  id: string;
  type: 'runWorkflow' | 'callApi' | 'sendNotification' | 'updateData' | 'executeScript';
  config: Record<string, unknown>;
}

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  triggers: string[];
  workflow: {
    name: string;
    description: string;
    steps: Array<{
      name: string;
      description: string;
      actionType: string;
      input: string;
      agentType?: string;
    }>;
  };
  createdAt: Date;
  popularity: number;
}

interface AutomationState {
  triggers: Trigger[];
  events: TriggerEvent[];
  schedules: Schedule[];
  rules: AutomationRule[];
  templates: AutomationTemplate[];
  isProcessing: boolean;
  error: string | null;
  
  // Trigger management
  addTrigger: (trigger: Omit<Trigger, 'id'>) => string;
  updateTrigger: (id: string, updates: Partial<Trigger>) => void;
  deleteTrigger: (id: string) => void;
  enableTrigger: (id: string) => void;
  disableTrigger: (id: string) => void;
  
  // Event handling
  processEvent: (event: Omit<TriggerEvent, 'id' | 'timestamp' | 'processed' | 'workflowRunIds' | 'status'>) => Promise<string>;
  markEventProcessed: (id: string, status: 'completed' | 'failed', error?: string) => void;
  
  // Schedule management
  addSchedule: (schedule: Omit<Schedule, 'id' | 'nextRun'>) => string;
  updateSchedule: (id: string, updates: Partial<Schedule>) => void;
  deleteSchedule: (id: string) => void;
  calculateNextRun: (scheduleId: string) => Date | undefined;
  
  // Rule management
  addRule: (rule: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt' | 'triggerCount'>) => string;
  updateRule: (id: string, updates: Partial<AutomationRule>) => void;
  deleteRule: (id: string) => void;
  
  // Template management
  addTemplate: (template: Omit<AutomationTemplate, 'id' | 'createdAt' | 'popularity'>) => string;
  updateTemplate: (id: string, updates: Partial<AutomationTemplate>) => void;
  deleteTemplate: (id: string) => void;
  
  // Automation execution
  executeRule: (ruleId: string, context?: Record<string, unknown>) => Promise<boolean>;
  executeTemplateWorkflow: (templateId: string, input?: unknown) => Promise<string>;
}

// Sample data
const sampleTriggers: Trigger[] = [
  {
    id: 'trigger-email',
    name: 'Email Received',
    type: 'event',
    description: 'Triggers when a new email is received',
    enabled: true,
    config: {
      accounts: ['main'],
      includeAttachments: true
    },
    conditions: [
      {
        id: 'condition-1',
        field: 'subject',
        operator: 'contains',
        value: 'important'
      }
    ],
    workflowIds: []
  },
  {
    id: 'trigger-file',
    name: 'New File Upload',
    type: 'event',
    description: 'Triggers when a new file is uploaded',
    enabled: true,
    config: {
      folders: ['documents', 'images'],
      fileTypes: ['pdf', 'docx', 'jpg', 'png']
    },
    workflowIds: []
  }
];

const sampleTemplates: AutomationTemplate[] = [
  {
    id: 'template-email-processing',
    name: 'Email Classification',
    description: 'Automatically categorize incoming emails and create appropriate tasks',
    category: 'Communication',
    triggers: ['email-received'],
    workflow: {
      name: 'Email Classification',
      description: 'AI-powered email categorization',
      steps: [
        {
          name: 'Analyze Email',
          description: 'Extract key information from email',
          actionType: 'analyze-content',
          input: '{{email.content}}',
          agentType: 'language-processing'
        },
        {
          name: 'Classify Email',
          description: 'Categorize the email based on content',
          actionType: 'classify',
          input: '{{steps.1.output}}',
          agentType: 'classification'
        },
        {
          name: 'Create Task',
          description: 'Create a task based on email category',
          actionType: 'create-task',
          input: '{{"title": "Follow up: " + email.subject, "description": email.content, "category": steps.2.output.category}}',
          agentType: 'task-management'
        }
      ]
    },
    createdAt: new Date(),
    popularity: 42
  },
  {
    id: 'template-meeting-notes',
    name: 'Meeting Notes Processor',
    description: 'Automatically transcribe, summarize, and distribute meeting notes',
    category: 'Productivity',
    triggers: ['calendar-event'],
    workflow: {
      name: 'Meeting Notes Processor',
      description: 'Process and distribute meeting notes',
      steps: [
        {
          name: 'Transcribe Recording',
          description: 'Convert audio to text',
          actionType: 'transcribe',
          input: '{{meeting.recordingUrl}}',
          agentType: 'audio-processing'
        },
        {
          name: 'Summarize Content',
          description: 'Create concise summary',
          actionType: 'summarize',
          input: '{{steps.1.output}}',
          agentType: 'language-processing'
        },
        {
          name: 'Extract Action Items',
          description: 'Identify action items from transcript',
          actionType: 'extract-actions',
          input: '{{steps.1.output}}',
          agentType: 'task-extraction'
        },
        {
          name: 'Create Report',
          description: 'Format into report',
          actionType: 'create-document',
          input: '{{"title": meeting.title, "summary": steps.2.output, "actionItems": steps.3.output}}',
          agentType: 'document-creation'
        },
        {
          name: 'Distribute Notes',
          description: 'Send to participants',
          actionType: 'send-email',
          input: '{{"to": meeting.participants, "subject": "Notes: " + meeting.title, "attachment": steps.4.output}}',
          agentType: 'communication'
        }
      ]
    },
    createdAt: new Date(),
    popularity: 38
  }
];

export const useAutomationStore = create<AutomationState>()(
  persist(
    (set, get) => ({
      triggers: sampleTriggers,
      events: [],
      schedules: [],
      rules: [],
      templates: sampleTemplates,
      isProcessing: false,
      error: null,
      
      addTrigger: (trigger) => {
        const id = crypto.randomUUID();
        set((state) => ({
          triggers: [...state.triggers, { ...trigger, id, workflowIds: [] }]
        }));
        return id;
      },
      
      updateTrigger: (id, updates) => {
        set((state) => ({
          triggers: state.triggers.map(trigger => 
            trigger.id === id ? { ...trigger, ...updates } : trigger
          )
        }));
      },
      
      deleteTrigger: (id) => {
        set((state) => ({
          triggers: state.triggers.filter(trigger => trigger.id !== id)
        }));
      },
      
      enableTrigger: (id) => {
        set((state) => ({
          triggers: state.triggers.map(trigger => 
            trigger.id === id ? { ...trigger, enabled: true } : trigger
          )
        }));
      },
      
      disableTrigger: (id) => {
        set((state) => ({
          triggers: state.triggers.map(trigger => 
            trigger.id === id ? { ...trigger, enabled: false } : trigger
          )
        }));
      },
      
      processEvent: async (eventData) => {
        set({ isProcessing: true, error: null });
        
        try {
          const id = crypto.randomUUID();
          const event: TriggerEvent = {
            id,
            triggerId: eventData.triggerId,
            timestamp: new Date(),
            data: eventData.data,
            processed: false,
            workflowRunIds: [],
            status: 'pending'
          };
          
          set((state) => ({
            events: [...state.events, event]
          }));
          
          // Find trigger
          const trigger = get().triggers.find(t => t.id === eventData.triggerId);
          if (!trigger || !trigger.enabled) {
            get().markEventProcessed(id, 'failed', 'Trigger not found or disabled');
            return id;
          }
          
          // Check conditions if they exist
          if (trigger.conditions && trigger.conditions.length > 0) {
            const allConditionsMet = trigger.conditions.every(condition => {
              const fieldValue = eventData.data[condition.field];
              if (fieldValue === undefined) return false;
              
              switch (condition.operator) {
                case 'equals': return fieldValue === condition.value;
                case 'contains': return String(fieldValue).includes(condition.value);
                case 'startsWith': return String(fieldValue).startsWith(condition.value);
                case 'endsWith': return String(fieldValue).endsWith(condition.value);
                case 'greaterThan': return Number(fieldValue) > Number(condition.value);
                case 'lessThan': return Number(fieldValue) < Number(condition.value);
                case 'exists': return fieldValue !== undefined && fieldValue !== null;
                default: return false;
              }
            });
            
            if (!allConditionsMet) {
              get().markEventProcessed(id, 'completed');
              return id;
            }
          }
          
          // Process workflows linked to this trigger
          set((state) => ({
            events: state.events.map(e => 
              e.id === id ? { ...e, status: 'processing' } : e
            )
          }));
          
          const workflowStore = useWorkflowStore.getState();
          const workflowRunIds: string[] = [];
          
          for (const workflowId of trigger.workflowIds) {
            try {
              const runId = await workflowStore.runWorkflow(workflowId, {
                trigger: {
                  id: trigger.id,
                  name: trigger.name,
                  type: trigger.type
                },
                event: {
                  id,
                  timestamp: event.timestamp,
                  data: eventData.data
                }
              });
              
              workflowRunIds.push(runId);
            } catch (error) {
              console.error(`Failed to run workflow ${workflowId}:`, error);
            }
          }
          
          set((state) => ({
            events: state.events.map(e => 
              e.id === id ? { ...e, workflowRunIds, status: 'completed', processed: true } : e
            )
          }));
          
          return id;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error processing event';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isProcessing: false });
        }
      },
      
      markEventProcessed: (id, status, error) => {
        set((state) => ({
          events: state.events.map(event => 
            event.id === id ? { 
              ...event, 
              processed: true, 
              status,
              error
            } : event
          )
        }));
      },
      
      addSchedule: (schedule) => {
        const id = crypto.randomUUID();
        const nextRun = calculateNextRunTime(schedule);
        
        set((state) => ({
          schedules: [...state.schedules, { ...schedule, id, nextRun }]
        }));
        
        return id;
      },
      
      updateSchedule: (id, updates) => {
        set((state) => {
          const schedules = state.schedules.map(schedule => {
            if (schedule.id !== id) return schedule;
            
            const updatedSchedule = { ...schedule, ...updates };
            return {
              ...updatedSchedule,
              nextRun: calculateNextRunTime(updatedSchedule)
            };
          });
          
          return { schedules };
        });
      },
      
      deleteSchedule: (id) => {
        set((state) => ({
          schedules: state.schedules.filter(schedule => schedule.id !== id)
        }));
      },
      
      calculateNextRun: (scheduleId) => {
        const schedule = get().schedules.find(s => s.id === scheduleId);
        if (!schedule) return undefined;
        
        return calculateNextRunTime(schedule);
      },
      
      addRule: (rule) => {
        const id = crypto.randomUUID();
        set((state) => ({
          rules: [...state.rules, { 
            ...rule, 
            id, 
            createdAt: new Date(), 
            updatedAt: new Date(),
            triggerCount: 0
          }]
        }));
        return id;
      },
      
      updateRule: (id, updates) => {
        set((state) => ({
          rules: state.rules.map(rule => 
            rule.id === id ? { 
              ...rule, 
              ...updates, 
              updatedAt: new Date() 
            } : rule
          )
        }));
      },
      
      deleteRule: (id) => {
        set((state) => ({
          rules: state.rules.filter(rule => rule.id !== id)
        }));
      },
      
      addTemplate: (template) => {
        const id = crypto.randomUUID();
        set((state) => ({
          templates: [...state.templates, { 
            ...template, 
            id, 
            createdAt: new Date(),
            popularity: 0
          }]
        }));
        return id;
      },
      
      updateTemplate: (id, updates) => {
        set((state) => ({
          templates: state.templates.map(template => 
            template.id === id ? { ...template, ...updates } : template
          )
        }));
      },
      
      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter(template => template.id !== id)
        }));
      },
      
      executeRule: async (ruleId, context: Record<string, unknown> = {}) => {
        const rule = get().rules.find(r => r.id === ruleId);
        if (!rule || !rule.enabled) return false;
        
        // Check if all conditions are met
        const allConditionsMet = rule.conditions.every(condition => {
          const fieldValue = context[condition.field];
          if (fieldValue === undefined) return false;
          
          switch (condition.operator) {
            case 'equals': return fieldValue === condition.value;
            case 'contains': return String(fieldValue).includes(condition.value);
            case 'startsWith': return String(fieldValue).startsWith(condition.value);
            case 'endsWith': return String(fieldValue).endsWith(condition.value);
            case 'greaterThan': return Number(fieldValue) > Number(condition.value);
            case 'lessThan': return Number(fieldValue) < Number(condition.value);
            case 'exists': return fieldValue !== undefined && fieldValue !== null;
            default: return false;
          }
        });
        
        if (!allConditionsMet) return false;
        
        // Execute all actions
        const workflowStore = useWorkflowStore.getState();
        
        for (const action of rule.actions) {
          try {
            switch (action.type) {
              case 'runWorkflow':
                if (typeof action.config.workflowId === 'string') {
                  await workflowStore.runWorkflow(action.config.workflowId, context);
                } else {
                  console.error(`Error executing action ${action.id}: workflowId is missing or not a string in config`, action.config);
                  return false; // Or throw an error
                }
                break;
              
              // Other action types would be implemented here
              
              default:
                console.warn(`Unsupported action type: ${action.type}`);
            }
          } catch (error) {
            console.error(`Error executing action ${action.id}:`, error);
            return false;
          }
        }
        
        // Update rule statistics
        set((state) => ({
          rules: state.rules.map(r => 
            r.id === ruleId ? { 
              ...r, 
              lastTriggered: new Date(),
              triggerCount: r.triggerCount + 1 
            } : r
          )
        }));
        
        return true;
      },
      
      executeTemplateWorkflow: async (templateId, input = {}) => {
        const template = get().templates.find(t => t.id === templateId);
        if (!template) {
          throw new Error(`Template with ID ${templateId} not found`);
        }
        
        // Create a workflow from the template
        const workflowStore = useWorkflowStore.getState();
        const agentStore = useAgentStore.getState();
        
        // Find appropriate agents for each step
        const steps = await Promise.all(template.workflow.steps.map(async (step) => {
          // Find an agent with the required capability
          const agents = agentStore.agents.filter(agent => 
            agent.type === step.agentType || 
            agent.capabilities.some(cap => cap.toLowerCase() === step.agentType?.toLowerCase())
          );
          
          const agentId = agents.length > 0 ? agents[0].id : '';
          
          return {
            id: crypto.randomUUID(),
            agentId,
            actionType: step.actionType,
            name: step.name,
            description: step.description,
            input: step.input,
            inputType: 'static' as const,
            outputMapping: `step_${crypto.randomUUID().substring(0, 8)}`
          };
        }));
        
        // Create the workflow
        const workflowId = workflowStore.addWorkflow({
          name: template.workflow.name,
          description: template.workflow.description,
          trigger: 'manual',
          steps,
          status: 'active'
        });
        
        // Update template popularity
        set((state) => ({
          templates: state.templates.map(t => 
            t.id === templateId ? { ...t, popularity: t.popularity + 1 } : t
          )
        }));
        
        // Run the workflow with the provided input
        return await workflowStore.runWorkflow(workflowId, input);
      }
    }),
    {
      name: 'automation-storage'
    }
  )
);

// Helper function to calculate next run time for a schedule
function calculateNextRunTime(schedule: Omit<Schedule, 'id' | 'nextRun'> | Schedule): Date | undefined {
  if (!schedule.enabled) return undefined;
  
  const now = new Date();
  
  // For one-time schedules
  if (schedule.type === 'once') {
    const scheduledDate = new Date(schedule.startDate);
    if (schedule.time) {
      const [hours, minutes] = schedule.time.split(':').map(Number);
      scheduledDate.setHours(hours, minutes, 0, 0);
    }
    
    return scheduledDate > now ? scheduledDate : undefined;
  }
  
  // For recurring schedules
  if (schedule.type === 'recurring' && schedule.recurrence) {
    const nextRun = new Date(schedule.startDate);
    
    // Set time if specified
    if (schedule.time) {
      const [hours, minutes] = schedule.time.split(':').map(Number);
      nextRun.setHours(hours, minutes, 0, 0);
    }
    
    // If the start date is in the future, return it
    if (nextRun > now) return nextRun;
    
    // Otherwise, calculate the next occurrence
    const { frequency, interval } = schedule.recurrence;
    
    // Move forward until we find a future date
    while (nextRun <= now) {
      switch (frequency) {
        case 'hourly':
          nextRun.setHours(nextRun.getHours() + interval);
          break;
        case 'daily':
          nextRun.setDate(nextRun.getDate() + interval);
          break;
        case 'weekly':
          nextRun.setDate(nextRun.getDate() + (7 * interval));
          // Check if specific days of week are set
          if (schedule.recurrence.daysOfWeek && schedule.recurrence.daysOfWeek.length > 0) {
            // Find the next valid day of the week
            let found = false;
            for (let i = 0; i < 7; i++) {
              if (schedule.recurrence.daysOfWeek.includes(nextRun.getDay())) {
                found = true;
                break;
              }
              nextRun.setDate(nextRun.getDate() + 1);
            }
            if (!found) return undefined;
          }
          break;
        case 'monthly':
          nextRun.setMonth(nextRun.getMonth() + interval);
          // Set to specific day of month if provided
          if (schedule.recurrence.dayOfMonth) {
            nextRun.setDate(Math.min(
              schedule.recurrence.dayOfMonth,
              new Date(nextRun.getFullYear(), nextRun.getMonth() + 1, 0).getDate()
            ));
          }
          break;
      }
    }
    
    // Check if we've passed the end date
    if (schedule.endDate && nextRun > new Date(schedule.endDate)) {
      return undefined;
    }
    
    return nextRun;
  }
  
  return undefined;
} 