import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgentStore } from '../../store/agentStore';
import { useWorkflowStore } from '../../store/workflowStore';
import { useNotebookStore } from '../../store/notebookStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Switch } from '../ui/Switch';
import { Label } from '../ui/Label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '../ui/Dialog';
import { Alert, AlertDescription } from '../ui/Alert';
import { 
  Wand2, 
  Plus, 
  Trash, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  Play, 
  RotateCw, 
  Sparkles, 
  Settings, 
  Check,
  BookOpen,
  Link,
  Brain
} from 'lucide-react';
import { WorkflowStep } from '../../store/workflowStore';
import { Tabs, TabsList, TabsTrigger } from '../ui/Tabs';

interface ProjectOption {
  id: string;
  name: string;
}

// Define a more structured type for our actions
export interface ActionDefinition {
  id: string; // This will be the actionType used in stores
  name: string; // User-friendly name for UI
  description: string;
  category?: string; // e.g., "Email", "Calendar", "Logic"
  // Define expected inputs for the step editor UI
  inputs?: Array<{ 
    name: string; // e.g., "emailId", "caseNumber", "summary"
    label: string; // e.g., "Email ID", "Case Number", "Event Summary"
    type: 'string' | 'boolean' | 'number' | 'object' | 'json_string'; // Data type
    required?: boolean;
    placeholder?: string; // e.g., "{steps.previousStep.output.emailId}"
    defaultValue?: any;
  }>;
  // Define outputs for mapping to subsequent steps
  outputs?: Array<{ 
    name: string; // e.g., "emailMessage", "calendarEvent", "analysisResult"
    label: string; // e.g., "Fetched Email Data", "Created Calendar Event"
    type: string; // e.g., "EmailMessage", "CalendarEvent", "EmailAnalysis"
  }>;
}

// Manifest of all available granular actions
const ALL_GRANULAR_ACTIONS: ActionDefinition[] = [
  // Email Actions
  {
    id: 'GET_EMAIL_DETAILS',
    name: 'Get Email Details',
    description: 'Fetches the full details of a specific email.',
    category: 'Email',
    inputs: [{ name: 'emailId', label: 'Email ID', type: 'string', required: true, placeholder: 'Enter Email ID or {placeholder}' }],
    outputs: [{ name: 'emailMessage', label: 'Fetched Email', type: 'EmailMessage' }]
  },
  {
    id: 'ANALYZE_EMAIL_FOR_CALENDAR_EVENT',
    name: 'Analyze Email for Calendar Event',
    description: 'Uses AI to analyze an email and extract potential calendar event details.',
    category: 'Email',
    inputs: [{ name: 'emailMessage', label: 'Email Object', type: 'object', required: true, placeholder: '{steps.previousStep.output.emailMessage}' }],
    outputs: [{ name: 'emailAnalysis', label: 'Email Analysis Result', type: 'EmailAnalysis' }]
  },
  // Calendar Actions
  {
    id: 'FIND_CALENDAR_EVENT_BY_CASENUMBER',
    name: 'Find Calendar Event by Case Number',
    description: 'Searches for an existing calendar event using a case number.',
    category: 'Calendar',
    inputs: [{ name: 'caseNumber', label: 'Case Number', type: 'string', required: true, placeholder: '{steps.previousStep.output.caseNumber}' }],
    outputs: [{ name: 'foundEvent', label: 'Found Calendar Event', type: 'CalendarEvent' }]
  },
  {
    id: 'CREATE_CALENDAR_EVENT',
    name: 'Create Calendar Event',
    description: 'Creates a new event in the Google Calendar.',
    category: 'Calendar',
    inputs: [
      { name: 'meetingDetails', label: 'Meeting Details', type: 'object', required: true, placeholder: '{steps.analysisStep.output.meetingDetails}' },
      { name: 'emailSubject', label: 'Email Subject (for context)', type: 'string', required: true },
      { name: 'emailMessageId', label: 'Email Message ID (optional)', type: 'string' },
      { name: 'emailThreadId', label: 'Email Thread ID (optional)', type: 'string' },
    ],
    outputs: [{ name: 'createdEvent', label: 'Created Calendar Event', type: 'CalendarEvent' }]
  },
  {
    id: 'UPDATE_CALENDAR_EVENT',
    name: 'Update Calendar Event',
    description: 'Updates an existing event in the Google Calendar.',
    category: 'Calendar',
    inputs: [
      { name: 'eventId', label: 'Event ID to Update', type: 'string', required: true, placeholder: '{steps.findStep.output.eventId}' },
      { name: 'meetingDetails', label: 'New Meeting Details', type: 'object', required: true },
      { name: 'emailSubject', label: 'Email Subject (for context)', type: 'string', required: true },
      { name: 'emailMessageId', label: 'Email Message ID (optional)', type: 'string' },
      { name: 'emailThreadId', label: 'Email Thread ID (optional)', type: 'string' },
    ],
    outputs: [{ name: 'updatedEvent', label: 'Updated Calendar Event', type: 'CalendarEvent' }]
  },
  // Utility Actions
  {
    id: 'LOG_MESSAGE',
    name: 'Log Message',
    description: 'Logs a message to the console/workflow log (for debugging or info).',
    category: 'Utility',
    inputs: [{ name: 'message', label: 'Message to Log', type: 'string', required: true, placeholder: 'Processing step X for {steps.prev.output.id}' }],
    outputs: [{ name: 'logConfirmation', label: 'Log Confirmation', type: 'object' }]
  },
  // TODO: Add SEND_NOTIFICATION, etc.
];

// Sample project data - in a real app, this would come from a project store
const PROJECTS: ProjectOption[] = [
  { id: 'project-1', name: 'Marketing Website' },
  { id: 'project-2', name: 'Mobile App Development' },
  { id: 'project-3', name: 'Customer Portal' }
];

export function AgentWizard() {
  const navigate = useNavigate();
  const { agents } = useAgentStore();
  const { generateWorkflowFromPrompt, enhanceTextWithAI, isLoading: isWorkflowLoading } = useWorkflowStore();
  const { createNotebook } = useNotebookStore();
  
  const [step, setStep] = useState(1);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [/*selectedAgentId, setSelectedAgentId*/] = useState(agents[0]?.id || '');
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [currentEditingStep, setCurrentEditingStep] = useState<WorkflowStep | null>(null);
  const [workflow, setWorkflow] = useState<any>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [createNotebookOpen, setCreateNotebookOpen] = useState(false);
  const [notebookName, setNotebookName] = useState('');
  const [workflowSaved, setWorkflowSaved] = useState(false);
  const [creationMode, setCreationMode] = useState<'workflow' | 'swarm'>('workflow');
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  
  const handleGenerateConfiguration = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      if (creationMode === 'workflow') {
        const generatedWorkflow = await generateWorkflowFromPrompt(prompt);
        setWorkflow(generatedWorkflow);
        setStep(2);
        setNotebookName(generatedWorkflow.name);
      } else if (creationMode === 'swarm') {
        navigate('/legal-swarm', {
          state: {
            initialDescription: prompt,
            initialName: `Swarm based on: "${prompt.substring(0, 30)}..."`
          }
        });
      }
    } catch (error) {
      console.error(`Error generating ${creationMode}:`, error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || isGenerating || isEnhancingPrompt) return;

    setIsEnhancingPrompt(true);
    console.log("Original prompt:", prompt);
    try {
      const enhancedPrompt = await enhanceTextWithAI(prompt);
      setPrompt(enhancedPrompt || prompt);
    } catch (error) {
      console.error("Error enhancing prompt:", error);
      // alert("Failed to enhance prompt. See console for details.");
    } finally {
      setIsEnhancingPrompt(false);
    }
  };
  
  const handleSaveWorkflow = () => {
    if (!workflow) return;
    
    // Update workflow with project connection if selected
    if (selectedProjectId) {
      workflow.projectId = selectedProjectId;
    }
    
    // Save or update workflow in the store
    if (!workflowSaved) {
      // This would typically update the workflow in the store
      setWorkflowSaved(true);
    }
    
    // Show dialog to create associated notebook
    setCreateNotebookOpen(true);
  };
  
  const handleCreateNotebook = () => {
    if (!notebookName.trim()) return;
    
    // Create a new notebook associated with this workflow
    createNotebook(
      notebookName,
      `Documentation for the ${workflow.name} workflow`,
      {
        metadata: {
          projectId: selectedProjectId || undefined,
          icon: 'book',
          color: 'blue'
        }
      }
    );
    
    // Close dialog and navigate
    setCreateNotebookOpen(false);
    
    // Navigate back to agents page
    navigate('/agents');
  };
  
  const handleRunWorkflow = () => {
    if (!workflow) return;
    
    // Show a simple alert in this demo
    alert('Workflow execution started!');
    
    // In a real app, you would call the runWorkflow function
    // and handle state updates, loading indicators, etc.
  };
  
  const handleAddStep = () => {
    if (!workflow) return;
    
    const newStep: WorkflowStep = {
      id: crypto.randomUUID(),
      agentId: /*selectedAgentId, setSelectedAgentId*/'',
      actionType: 'chat',
      name: 'New Step',
      description: 'Describe what this step does',
      input: '',
      inputType: 'static',
      outputMapping: `step${workflow.steps.length + 1}_output`
    };
    
    setWorkflow({
      ...workflow,
      steps: [...workflow.steps, newStep]
    });
  };
  
  const handleDeleteStep = (stepId: string) => {
    if (!workflow) return;
    
    setWorkflow({
      ...workflow,
      steps: workflow.steps.filter((step: WorkflowStep) => step.id !== stepId)
    });
  };
  
  const handleMoveStep = (stepId: string, direction: 'up' | 'down') => {
    if (!workflow) return;
    
    const stepIndex = workflow.steps.findIndex((step: WorkflowStep) => step.id === stepId);
    if (
      (direction === 'up' && stepIndex === 0) || 
      (direction === 'down' && stepIndex === workflow.steps.length - 1)
    ) {
      return;
    }
    
    const newSteps = [...workflow.steps];
    const targetIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1;
    [newSteps[stepIndex], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[stepIndex]];
    
    setWorkflow({
      ...workflow,
      steps: newSteps
    });
  };
  
  const handleEditStep = (step: WorkflowStep) => {
    setCurrentEditingStep(step);
  };
  
  const handleUpdateStep = (updatedStep: WorkflowStep) => {
    if (!workflow) return;
    
    setWorkflow({
      ...workflow,
      steps: workflow.steps.map((step: WorkflowStep) => 
        step.id === updatedStep.id ? updatedStep : step
      )
    });
    setCurrentEditingStep(null);
  };
  
  const getAgentById = (id: string) => {
    return agents.find(agent => agent.id === id);
  };
  
  const getAvailableActions = (agentId: string): ActionDefinition[] => {
    const agent = getAgentById(agentId);
    if (!agent) return [];
    
    let availableActions: ActionDefinition[] = [
      // Every agent gets basic chat and log actions
      { id: 'chat', name: 'Chat with Agent', description: 'Send a message to the agent and get a response.', category: 'Basic', inputs: [{name: 'prompt', label: 'Prompt', type: 'string', required: true}], outputs: [{name: 'response', label: 'Agent Response', type: 'string'}] },
      ...ALL_GRANULAR_ACTIONS.filter(action => action.category === 'Utility'),
    ];

    // Add actions based on agent capabilities
    if (agent.capabilities.includes('email-processing')) {
      availableActions = [...availableActions, ...ALL_GRANULAR_ACTIONS.filter(action => action.category === 'Email')];
    }
    if (agent.capabilities.includes('calendar-management') || agent.capabilities.includes('email-processing')) { 
      availableActions = [...availableActions, ...ALL_GRANULAR_ACTIONS.filter(action => action.category === 'Calendar')];
    }
    if (agent.capabilities.includes('document-analysis')) {
      availableActions.push({ id: 'analyze-document', name: 'Analyze Document', description: 'Extract information from documents', category: 'Document' });
    }
    if (agent.capabilities.includes('task-management')) {
      availableActions.push({ id: 'create-task', name: 'Create Task', description: 'Create a new task', category: 'Task' });
    }

    const uniqueActions = Array.from(new Map(availableActions.map(action => [action.id, action])).values());
    return uniqueActions;
  };
  
  const renderStepEditor = () => {
    if (!currentEditingStep) return null;
    
    const availableActionsForAgent = getAvailableActions(currentEditingStep.agentId);
    const actionDef = ALL_GRANULAR_ACTIONS.find(ad => ad.id === currentEditingStep.actionType);

    // Ensure currentEditingStep.input is an object if actionDef expects structured inputs
    // If it's a string, try to parse it as JSON, otherwise initialize as empty object.
    let currentStepInputValue: Record<string, any> = {};
    if (actionDef && actionDef.inputs && actionDef.inputs.length > 0) {
      if (typeof currentEditingStep.input === 'object' && currentEditingStep.input !== null) {
        currentStepInputValue = currentEditingStep.input;
      } else if (typeof currentEditingStep.input === 'string') {
        try {
          currentStepInputValue = JSON.parse(currentEditingStep.input);
          if (typeof currentStepInputValue !== 'object' || currentStepInputValue === null) {
            currentStepInputValue = {}; // Fallback if parse result is not an object
          }
        } catch (e) {
          // If parsing fails & action expects object, it suggests a mismatch or old data.
          // For a single expected input, we can map the string to it.
          if (actionDef.inputs.length === 1 && (actionDef.inputs[0].type === 'string' || actionDef.inputs[0].type === 'json_string')) {
            currentStepInputValue = { [actionDef.inputs[0].name]: currentEditingStep.input };
          } else {
            currentStepInputValue = {}; 
          }
        }
      } else {
        currentStepInputValue = {}; // Default to empty object if input is undefined/null
      }
    } else {
      // For actions without defined inputs (like old 'chat') or if input is meant to be a simple string.
      // We store it as a string directly.
      if (typeof currentEditingStep.input === 'string') {
        currentStepInputValue = { _legacyInput: currentEditingStep.input }; // Use a special key for legacy string input
      } else if (currentEditingStep.input === null || typeof currentEditingStep.input === 'undefined') {
        currentStepInputValue = { _legacyInput: '' }; 
      } else { // If it's an object but no inputs defined, stringify it for the legacy view
        currentStepInputValue = { _legacyInput: JSON.stringify(currentEditingStep.input, null, 2) };
      }
    }

    const handleStepInputChange = (fieldName: string, value: any) => {
      setCurrentEditingStep(prev => {
        if (!prev) return null;
        const newStructuredInput = { ...(typeof prev.input === 'object' && prev.input !== null ? prev.input : {}), [fieldName]: value };
        // If only one input field is defined and it's not a special _legacyInput, then prev.input itself should be the value.
        // However, workflowStore expects Record<string, any> or string, so we will always make it an object here
        // and handle the string conversion when saving if needed by actionType.
        return { ...prev, input: newStructuredInput };
      });
    };
    
    const handleLegacyInputChange = (value: string) => {
       setCurrentEditingStep(prev => {
        if (!prev) return null;
        // For legacy/simple inputs, we store the string directly in the input field
        // or in the object under _legacyInput if actionDef.inputs is empty
        if (!actionDef || !actionDef.inputs || actionDef.inputs.length === 0) {
            return { ...prev, input: value }; // Store as raw string
        }
        // This case should ideally not be hit if actionDef.inputs exists, 
        // but as a fallback, update the special key.
        return { ...prev, input: { ...currentStepInputValue, _legacyInput: value } }; 
      });
    };

    const onSave = () => {
      if (!currentEditingStep) return;
      const stepToSave = { ...currentEditingStep };

      if ((!actionDef || !actionDef.inputs || actionDef.inputs.length === 0) && typeof stepToSave.input === 'object' && stepToSave.input !== null && ('_legacyInput' in stepToSave.input)) {
        const legacyInput = stepToSave.input._legacyInput;
        if (typeof legacyInput === 'string') {
          stepToSave.input = legacyInput;
        } else if (typeof legacyInput === 'object' && legacyInput !== null) {
          stepToSave.input = legacyInput as Record<string, any>; // Cast to be more specific
        } else if (legacyInput === null) {
          stepToSave.input = '';
        }
        // If legacyInput was undefined or some other type not handled, stepToSave.input remains unchanged from currentStepInputValue logic
      }
      // If actionDef.inputs has only one item and the input type is string/json_string, and current input is an object with one key
      // matching that input, consider unwrapping it for simpler string-based actions.
      // However, keeping it as an object is safer for agentStore which expects Record<string,any> for structured inputs.
      // For now, we will always save it as an object if it was treated as an object.

      handleUpdateStep(stepToSave);
    };
    
    return (
      <Dialog open={true} onOpenChange={() => { onSave(); setCurrentEditingStep(null);}} >
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Step: {currentEditingStep.name}</DialogTitle>
            <DialogDescription>
              {actionDef ? actionDef.description : 'Configure this workflow step.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-grow overflow-y-auto pr-2 space-y-4 py-4"> 
          <div className="space-y-2">
            <Label htmlFor="step-name">Step Name</Label>
            <Input 
              id="step-name" 
              value={currentEditingStep.name}
                onChange={(e) => setCurrentEditingStep(prev => prev ? {...prev, name: e.target.value} : null)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="step-description">Description</Label>
            <Textarea 
              id="step-description" 
              value={currentEditingStep.description}
                onChange={(e) => setCurrentEditingStep(prev => prev ? {...prev, description: e.target.value} : null)}
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="step-agent">Agent</Label>
              <Select
              value={currentEditingStep.agentId}
                onValueChange={(value) => setCurrentEditingStep(prev => prev ? {...prev, agentId: value} : null)}
            >
                <SelectTrigger>
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
              {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                    </SelectItem>
              ))}
                </SelectContent>
              </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="step-action">Action</Label>
              <Select
              value={currentEditingStep.actionType}
                onValueChange={(value) => setCurrentEditingStep(prev => prev ? {...prev, actionType: value, input: {}} : null)} // Reset input when action changes
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  {availableActionsForAgent.map((action) => (
                    <SelectItem key={action.id} value={action.id}>
                      {action.name} ({action.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
          
            {/* Dynamic Input Fields based on ActionDefinition */} 
            {actionDef && actionDef.inputs && actionDef.inputs.length > 0 ? (
              actionDef.inputs.map((inputDef) => (
                <div key={inputDef.name} className="space-y-2">
                  <Label htmlFor={`step-input-${inputDef.name}`}>
                    {inputDef.label}
                    {inputDef.required && <span className="text-destructive">*</span>}
                  </Label>
                  {inputDef.type === 'string' ? (
                    <Input
                      id={`step-input-${inputDef.name}`}
                      value={currentStepInputValue[inputDef.name] || ''}
                      onChange={(e) => handleStepInputChange(inputDef.name, e.target.value)}
                      placeholder={inputDef.placeholder || `Enter ${inputDef.label}`}
                    />
                  ) : inputDef.type === 'json_string' || inputDef.type === 'object' ? (
                    <Textarea
                      id={`step-input-${inputDef.name}`}
                      value={typeof currentStepInputValue[inputDef.name] === 'string' ? currentStepInputValue[inputDef.name] : JSON.stringify(currentStepInputValue[inputDef.name] || inputDef.defaultValue || {}, null, 2)}
                      onChange={(e) => handleStepInputChange(inputDef.name, e.target.value) }
                      placeholder={inputDef.placeholder || `Enter JSON for ${inputDef.label}`}
                      rows={3}
                      className="font-mono text-sm"
                    />
                  ) : inputDef.type === 'boolean' ? (
                    <Switch
                      id={`step-input-${inputDef.name}`}
                      checked={!!currentStepInputValue[inputDef.name]}
                      onCheckedChange={(checked) => handleStepInputChange(inputDef.name, checked)}
                    />
                  ) : (
                     <Input // Fallback for other types like 'number'
                      id={`step-input-${inputDef.name}`}
                      value={currentStepInputValue[inputDef.name] || ''}
                      onChange={(e) => handleStepInputChange(inputDef.name, e.target.value)}
                      placeholder={inputDef.placeholder || `Enter ${inputDef.label}`}
                    />
                  )}
          </div>
              ))
            ) : (
              // Fallback for simple string input or actions without defined inputs (e.g., legacy 'chat')
          <div className="space-y-2">
                <Label htmlFor="step-input-legacy">Input</Label>
            <Textarea 
                  id="step-input-legacy" 
                  value={currentStepInputValue._legacyInput !== undefined ? currentStepInputValue._legacyInput : (typeof currentEditingStep.input === 'string' ? currentEditingStep.input : JSON.stringify(currentEditingStep.input || ''))}
                  onChange={(e) => handleLegacyInputChange(e.target.value)}
              rows={3}
              placeholder={
                currentEditingStep.inputType === 'static' 
                  ? 'Enter static input value' 
                  : currentEditingStep.inputType === 'dynamic' 
                    ? 'Use {input.field} for workflow inputs' 
                    : 'Use {steps.stepName.outputField} to reference previous step outputs'
              }
            />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="step-input-type">Input Type Hint</Label>
              <Select
                value={currentEditingStep.inputType}
                onValueChange={(value) => setCurrentEditingStep(prev => prev ? {...prev, inputType: value as 'static' | 'dynamic' | 'previous'} : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select input type hint" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="static">Static (Fixed value / JSON)</SelectItem>
                  <SelectItem value="dynamic"><span>Dynamic (Runtime value from workflow start, e.g. {'{input.field}'})</span></SelectItem>
                  <SelectItem value="previous"><span>Previous Step Output (e.g. {'{steps.stepName.outputField}'})</span></SelectItem>
                </SelectContent>
              </Select>
               <p className="text-xs text-muted-foreground">
                {'This primarily serves as a hint for how to structure your input placeholders above. Static can be a direct value or a JSON object. Dynamic uses {input.fieldName}. Previous uses {steps.stepId.outputName}.'}
              </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="step-output-mapping">Output Variable Name</Label>
            <Input 
              id="step-output-mapping" 
              value={currentEditingStep.outputMapping}
                onChange={(e) => setCurrentEditingStep(prev => prev ? {...prev, outputMapping: e.target.value} : null)}
                placeholder="e.g., analyzedEmail, createdTask (no spaces/special chars)"
              />
               <p className="text-xs text-muted-foreground">
                This name will be used to reference this step's output in subsequent steps, e.g., {'{steps.' + (currentEditingStep.outputMapping || 'thisStepOutput') + '.someProperty}'}
              </p>
          </div>
          
          {isAdvancedMode && (
              <div className="space-y-2 border-t pt-4 mt-4">
                <Label>Conditional Execution (Advanced)</Label>
                <Select
                value={currentEditingStep.condition?.type || 'always'}
                  onValueChange={(value) => {
                    const type = value as 'always' | 'if' | 'if-else';
                    setCurrentEditingStep(prev => prev ? {
                      ...prev,
                    condition: {
                      type,
                        expression: prev.condition?.expression || ''
                      }
                    } : null);
                  }}
                >
                  <SelectTrigger>
                     <SelectValue placeholder="Select condition type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="always">Always Run</SelectItem>
                    <SelectItem value="if">Conditional (If)</SelectItem>
                    {/* <SelectItem value="if-else">Conditional (If-Else)</SelectItem> */}
                  </SelectContent>
                </Select>
              
              {(currentEditingStep.condition?.type === 'if' || currentEditingStep.condition?.type === 'if-else') && (
                <div className="space-y-2 mt-2">
                    <Label htmlFor="step-condition-expression">Condition Expression</Label>
                  <Textarea 
                      id="step-condition-expression" 
                    value={currentEditingStep.condition?.expression || ''}
                      onChange={(e) => setCurrentEditingStep(prev => prev ? {
                        ...prev,
                      condition: {
                          type: prev.condition?.type || 'if',
                        expression: e.target.value
                      }
                      } : null)}
                      placeholder={`E.g., {steps.previousStep.output.success} === true OR {input.priority} === "high"`}
                    rows={2}
                      className="font-mono text-sm"
                  />
                </div>
              )}
            </div>
          )}
          </div>

          <DialogFooter className="mt-auto pt-4 border-t">
          <Button variant="outline" onClick={() => setCurrentEditingStep(null)}>
            Cancel
          </Button>
            <Button onClick={onSave}>
            <Check className="h-4 w-4 mr-2" />
            Save Step
          </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI Agent Workflow Wizard</h2>
          <p className="text-muted-foreground">
            Create multi-step agent workflows with ease
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch 
              checked={isAdvancedMode}
              onCheckedChange={setIsAdvancedMode}
            />
            <Label>Advanced Mode</Label>
          </div>
          {step > 1 && (
            <>
              <Button variant="outline" onClick={handleSaveWorkflow}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button onClick={handleRunWorkflow}>
                <Play className="h-4 w-4 mr-2" />
                Run Workflow
              </Button>
            </>
          )}
        </div>
      </div>
      
      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wand2 className="h-5 w-5 mr-2 text-purple-500" />
              Step 1: Define Your Workflow
            </CardTitle>
            <CardDescription>
              Describe what you want to automate and we&apos;ll generate a workflow for you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mb-4">
              <Label className="text-sm font-medium">What do you want to create?</Label>
              <Tabs value={creationMode} onValueChange={(value) => setCreationMode(value as 'workflow' | 'swarm')} className="w-full mt-1">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="workflow">Automated Workflow</TabsTrigger>
                  <TabsTrigger value="swarm">AI Agent Swarm</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <CardHeader>
              <CardTitle>Step 1: Describe Your {creationMode === 'workflow' ? 'Workflow' : 'Swarm'} Goal</CardTitle>
              <CardDescription>
                Describe what you want to automate or the complex task for your swarm. 
                The AI will help generate a plan or configuration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={`e.g., Monitor my email for customer inquiries, extract key information, and create a task... \nOr for a swarm: Coordinate a legal research team for case XYZ, including document review, evidence analysis, and report generation...`}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                disabled={isGenerating || isEnhancingPrompt}
              />
              <div className="flex justify-end space-x-2"> 
                <Button 
                  variant="outline" 
                  onClick={handleEnhancePrompt} 
                  disabled={isGenerating || isEnhancingPrompt || !prompt.trim()}
                >
                  {isEnhancingPrompt ? 'Enhancing...' : 'Enhance with AI'}
                  <Brain className="ml-2 h-4 w-4" />
                </Button>
                <Button onClick={handleGenerateConfiguration} disabled={isGenerating || isEnhancingPrompt || !prompt.trim()}>
                  {isGenerating ? 'Generating...' : (creationMode === 'workflow' ? 'Generate Workflow Plan' : 'Configure Swarm')}
                  <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </div>
              {isWorkflowLoading && creationMode === 'workflow' && <p>Generating workflow details...</p>}
            </CardContent>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
                    {workflow?.name}
                  </CardTitle>
                  <CardDescription>
                    {workflow?.description}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="px-2 py-1">
                  {workflow?.status === 'active' ? (
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                      Active
                    </span>
                  ) : workflow?.status === 'running' ? (
                    <span className="flex items-center">
                      <RotateCw className="h-3 w-3 mr-1 animate-spin" />
                      Running
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-gray-300 rounded-full mr-1"></span>
                      Inactive
                    </span>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Trigger</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={workflow?.trigger}
                      onChange={(e) => setWorkflow({
                        ...workflow,
                        trigger: e.target.value
                      })}
                    >
                      <option value="manual">Manual (Run on demand)</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="event">Event-based</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Project (Optional)</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                    >
                      <option value="">None</option>
                      {PROJECTS.map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {workflow?.trigger === 'scheduled' && (
                  <div className="space-y-2">
                    <Label>Schedule</Label>
                    <Input placeholder="Cron expression or frequency" />
                  </div>
                )}
                
                {workflow?.trigger === 'event' && (
                  <div className="space-y-2">
                    <Label>Event</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      defaultValue="email_received"
                    >
                      <option value="email_received">Email Received</option>
                      <option value="document_uploaded">Document Uploaded</option>
                      <option value="task_created">Task Created</option>
                      <option value="form_submitted">Form Submitted</option>
                    </select>
                  </div>
                )}
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm font-medium">Workflow Steps</Label>
                    <Button variant="outline" size="sm" onClick={handleAddStep}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Step
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {workflow?.steps.map((step: WorkflowStep, index: number) => {
                      const agent = getAgentById(step.agentId);
                      return (
                        <Card key={step.id} className="relative">
                          <CardContent className="p-4">
                            <div className="flex gap-3">
                              <div className="flex flex-col items-center mr-2">
                                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                  {index + 1}
                                </div>
                                {index < workflow.steps.length - 1 && (
                                  <div className="w-0.5 h-full bg-gray-200 my-1"></div>
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h3 className="font-medium">{step.name}</h3>
                                    <p className="text-sm text-muted-foreground">{step.description}</p>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => handleMoveStep(step.id, 'up')} disabled={index === 0}>
                                      <ArrowUp className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleMoveStep(step.id, 'down')} disabled={index === workflow.steps.length - 1}>
                                      <ArrowDown className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleEditStep(step)}>
                                      <Settings className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteStep(step.id)}>
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground">Agent:</span>
                                    <div className="flex items-center gap-1">
                                      {agent ? agent.name : 'Unknown Agent'}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground">Action:</span>
                                    <div>
                                      {step.actionType}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground">Input Type:</span>
                                    <div>
                                      {step.inputType}
                                    </div>
                                  </div>
                                </div>
                                
                                {isAdvancedMode && (
                                  <div className="mt-2 text-xs">
                                    <div className="text-muted-foreground">Input: 
                                      <code className="bg-gray-100 px-1 rounded">
                                        {typeof step.input === 'object' ? JSON.stringify(step.input, null, 2) : step.input}
                                      </code>
                                    </div>
                                    <div className="text-muted-foreground">Output as: <code className="bg-gray-100 px-1 rounded">{step.outputMapping}</code></div>
                                    {step.condition && step.condition.type !== 'always' && (
                                      <div className="text-muted-foreground">
                                        Condition: <code className="bg-gray-100 px-1 rounded">
                                          {step.condition.type}: {step.condition.expression}
                                        </code>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    
                    <Button 
                      variant="outline" 
                      className="w-full h-16 border-dashed mt-2" 
                      onClick={handleAddStep}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Step
                    </Button>
                  </div>
                </div>
                
                {selectedProjectId && (
                  <Alert>
                    <AlertDescription className="flex items-center space-x-2">
                      <Link className="h-4 w-4" />
                      <span>This workflow will be associated with the project: {PROJECTS.find(p => p.id === selectedProjectId)?.name}</span>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
          
          {renderStepEditor()}
        </div>
      )}
      
      {/* Create Notebook Dialog */}
      <Dialog open={createNotebookOpen} onOpenChange={setCreateNotebookOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Documentation Notebook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-muted-foreground">
              Would you like to create a notebook to document this workflow? This will help your team understand how this workflow operates.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="notebook-name">Notebook Name</Label>
              <Input
                id="notebook-name"
                value={notebookName}
                onChange={(e) => setNotebookName(e.target.value)}
                placeholder="Enter a name for your notebook"
              />
            </div>
            
            <div className="flex items-start space-x-2">
              <BookOpen className="h-8 w-8 text-blue-500 mt-1" />
              <div>
                <h4 className="font-medium">Documentation Notebook Benefits</h4>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-1">
                  <li>Document your workflow steps</li>
                  <li>Add explanations for team members</li>
                  <li>Include troubleshooting guides</li>
                  <li>Link related resources</li>
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCreateNotebookOpen(false);
              navigate('/agents');
            }}>
              Skip
            </Button>
            <Button onClick={handleCreateNotebook}>
              Create Notebook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 