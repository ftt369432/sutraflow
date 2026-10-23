import { useState } from 'react';
import { useAgentStore } from '../../store/agentStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';
import { Agent, AgentAction } from '../../types/agent';
import { Play, ClipboardCheck, AlertTriangle, CheckCircle, Clock, Send, LucideIcon } from 'lucide-react';

interface AgentActionsProps {
  agent: Agent;
}

// Define a type for the structure of actions, including the icon type
interface AvailableAction {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon; // Type for Lucide icons (or React.FC<LucideProps>)
}

// Helper to get chat input display string
const getChatInputDisplay = (input: unknown): string => {
  if (input && typeof input === 'object' && 'input' in input && typeof (input as Record<string, unknown>).input === 'string') {
    return (input as { input: string }).input;
  }
  if (typeof input === 'string') return input;
  return ''; 
};

// Helper to get chat output display string
const getChatOutputDisplay = (output: unknown): string => {
  if (output && typeof output === 'object' && 'result' in output && typeof (output as Record<string, unknown>).result === 'string') {
    return (output as { result: string }).result;
  }
  if (typeof output === 'string') return output;
  return 'Processing...'; 
};

// Simplified Helper to stringify unknown data for display
const stringifyUnknown = (data: unknown): string => {
  if (typeof data === 'string') return data;
  if (data === null || data === undefined) return '';
  try {
    return JSON.stringify(data, null, 2);
  } catch (e) {
    return String(data);
  }
};

export function AgentActions({ agent }: AgentActionsProps) {
  const { executeAction, actions } = useAgentStore();
  const [actionInput, setActionInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const agentActions: AgentAction[] = actions.filter(action => action.agentId === agent.id);
  const availableActions: AvailableAction[] = generateAvailableActions(agent);

  const handleExecuteAction = async () => {
    if (!selectedAction) return;
    
    setIsExecuting(true);
    try {
      let parsedInput: Record<string, unknown> | string = actionInput;
      if (selectedAction !== 'chat' && (actionInput.trim().startsWith('{') || actionInput.trim().startsWith('['))) {
        try {
          parsedInput = JSON.parse(actionInput) as Record<string, unknown>;
        } catch (_error) {
          // Keep as string if not valid JSON
        }
      }
      const payload = selectedAction === 'chat' ? { input: actionInput } : parsedInput;
      await executeAction(agent.id, selectedAction, payload);
      setActionInput('');
    } catch (error) {
      console.error('Error executing action:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Execute Action</CardTitle>
            <CardDescription>Trigger agent capabilities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Action</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableActions.map((action) => (
                  <Button
                    key={action.id}
                    variant={selectedAction === action.id ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setSelectedAction(action.id)}
                  >
                    <action.icon className="h-4 w-4 mr-2" />
                    {action.name}
                  </Button>
                ))}
              </div>
            </div>

            {selectedAction && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Input</label>
                <Textarea
                  value={actionInput}
                  onChange={(e) => setActionInput(e.target.value)}
                  placeholder={selectedAction === 'chat' ? "Type a message..." : "Enter JSON input for the action or plain text if applicable..."}
                  rows={4}
                />
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleExecuteAction}
              disabled={!selectedAction || isExecuting}
              className="w-full"
            >
              {isExecuting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Executing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Execute Action
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Chat</CardTitle>
            <CardDescription>Direct interaction with agent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 h-48 overflow-y-auto mb-4">
              {agentActions.filter(a => a.type === 'chat').length > 0 ? (
                <div className="space-y-4">
                  {agentActions
                    .filter(a => a.type === 'chat')
                    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
                    .map((action) => {
                      const chatInputDisplay = getChatInputDisplay(action.input);
                      const chatOutputDisplay = action.output ? getChatOutputDisplay(action.output) : null;
                      return (
                        <div key={action.id} className="space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg rounded-tl-none">
                              {chatInputDisplay}
                            </div>
                          </div>
                          {chatOutputDisplay && (
                            <div className="flex items-start gap-2 justify-end">
                              <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg rounded-tr-none">
                                {stringifyUnknown(chatOutputDisplay)}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No chat history yet
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Input 
                placeholder="Type a message..."
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    setSelectedAction('chat');
                    handleExecuteAction();
                  }
                }}
              />
              <Button 
                onClick={() => {
                  setSelectedAction('chat');
                  handleExecuteAction();
                }}
                disabled={isExecuting || !actionInput.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Actions</CardTitle>
          <CardDescription>History of agent actions</CardDescription>
        </CardHeader>
        <CardContent>
          {agentActions.length > 0 ? (
            <div className="space-y-4">
              {[...agentActions]
                .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
                .slice(0, 5)
                .map((action) => {
                  const inputDisplay = stringifyUnknown(action.input);
                  const outputDisplay = action.output ? stringifyUnknown(action.output) : null;
                  return (
                    <div key={action.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(action.status || 'unknown')}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(action.status || 'unknown')}
                              {action.status || 'unknown'}
                            </span>
                          </Badge>
                          <span className="font-medium">{action.type}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(action.startedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="space-y-2 mt-2">
                        {inputDisplay && (
                          <div>
                            <span className="font-medium">Input: </span>
                            <pre className="text-xs text-gray-600 dark:text-gray-300 break-all whitespace-pre-wrap overflow-x-auto">
                              {inputDisplay}
                            </pre>
                          </div>
                        )}
                        {outputDisplay && (
                          <div className="text-sm">
                            <span className="font-medium">Output: </span>
                            <pre className="text-xs text-gray-600 dark:text-gray-300 break-all whitespace-pre-wrap overflow-x-auto">
                              {outputDisplay}
                            </pre>
                          </div>
                        )}
                        {action.error && (
                          <div className="text-sm">
                            <span className="font-medium text-red-500">Error: </span>
                            <span className="text-red-500 break-all whitespace-pre-wrap">
                              {action.error} 
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No actions have been executed yet
            </div>
          )}
        </CardContent>
        {agentActions.length > 5 && (
          <CardFooter>
            <Button variant="outline" className="w-full">
              View All Actions
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

function generateAvailableActions(agent: Agent): AvailableAction[] { // Add return type
  const baseActions: AvailableAction[] = [
    {
      id: 'chat',
      name: 'Chat',
      description: 'Have a conversation with the agent',
      icon: Send
    }
  ];

  const capabilityActions: Record<string, AvailableAction> = {
    'email-processing': {
      id: 'email',
      name: 'Process Email',
      description: 'Process and analyze emails',
      icon: ClipboardCheck
    },
    'document-analysis': {
      id: 'analyze-document',
      name: 'Analyze Document',
      description: 'Extract information from documents',
      icon: ClipboardCheck // Consider a different icon, e.g., FileText
    },
    'task-management': {
      id: 'create-task',
      name: 'Create Task',
      description: 'Create a new task',
      icon: ClipboardCheck // Consider a different icon, e.g., ListChecks
    },
    'code-generation': {
      id: 'generate-code',
      name: 'Generate Code',
      description: 'Generate code based on requirements',
      icon: ClipboardCheck // Consider a different icon, e.g., Code
    },
    'data-analysis': {
      id: 'analyze-data',
      name: 'Analyze Data',
      description: 'Analyze data and generate insights',
      icon: ClipboardCheck // Consider a different icon, e.g., BarChart
    }
  };

  // Add capability-specific actions
  const additionalActions = agent.capabilities
    .filter(cap => capabilityActions[cap])
    .map(cap => capabilityActions[cap]);

  return [...baseActions, ...additionalActions];
} 