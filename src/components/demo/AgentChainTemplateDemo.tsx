import React, { useState } from 'react';
import { TemplatedGoogleReAuth } from '../auth/TemplatedGoogleReAuth';
import { processChainTemplate, ProcessStep } from '../../services/agents/ProcessChainTemplate';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Settings, Zap, Calendar, Mail, Clock, Copy } from 'lucide-react';

export const AgentChainTemplateDemo: React.FC = () => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('basic_auth');
  const [showEditor, setShowEditor] = useState(false);

  // Define different workflow templates
  const workflowTemplates = {
    'basic_auth': {
      name: 'Basic Authentication',
      description: 'Simple Google OAuth flow with minimal steps',
      color: 'bg-blue-100 text-blue-800',
      steps: ['check_auth_status', 'initiate_oauth', 'store_provider_token']
    },
    'enhanced_auth': {
      name: 'Enhanced Authentication',
      description: 'Full authentication with validation and notifications',
      color: 'bg-green-100 text-green-800',
      steps: [
        'log_auth_attempt',
        'check_auth_status', 
        'backup_old_token',
        'refresh_token',
        'initiate_oauth', 
        'validate_scopes', 
        'store_provider_token',
        'send_success_notification',
        'update_user_preferences'
      ]
    },
    'legal_workflow': {
      name: 'Legal Practice Workflow',
      description: 'Authentication + auto-reminder setup for legal events',
      color: 'bg-purple-100 text-purple-800',
      steps: [
        'check_auth_status',
        'initiate_oauth',
        'validate_scopes',
        'store_provider_token',
        'create_reminder_workflow',
        'create_calendar_event',
        'send_success_notification'
      ]
    },
    'emergency_reauth': {
      name: 'Emergency Re-authentication',
      description: 'Fast re-auth for critical system access',
      color: 'bg-red-100 text-red-800',
      steps: ['initiate_oauth', 'validate_scopes', 'store_provider_token']
    }
  };

  const initializeWorkflow = (workflowId: string) => {
    const template = workflowTemplates[workflowId as keyof typeof workflowTemplates];
    if (!template) return;

    // Create custom chain for this workflow
    const chainId = `workflow_${workflowId}`;
    
    try {
      processChainTemplate.createChain(chainId, template.steps);
      console.log(`✅ Created workflow chain: ${chainId} with ${template.steps.length} steps`);
    } catch (error) {
      console.warn(`⚠️ Chain ${chainId} may already exist, using existing chain`);
    }
    
    setSelectedWorkflow(workflowId);
  };

  const cloneWorkflow = (sourceWorkflowId: string) => {
    const timestamp = Date.now();
    const newWorkflowId = `${sourceWorkflowId}_clone_${timestamp}`;
    const sourceChainId = `workflow_${sourceWorkflowId}`;
    const newChainId = `workflow_${newWorkflowId}`;
    
    try {
      processChainTemplate.cloneChain(sourceChainId, newChainId);
      console.log(`📋 Cloned workflow: ${sourceChainId} → ${newChainId}`);
    } catch (error) {
      console.error('Failed to clone workflow:', error);
    }
  };

  const exportWorkflow = (workflowId: string) => {
    const chainId = `workflow_${workflowId}`;
    try {
      const exported = processChainTemplate.exportChain(chainId);
      const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${workflowId}_chain.json`;
      a.click();
      console.log(`📥 Exported workflow: ${workflowId}`);
    } catch (error) {
      console.error('Failed to export workflow:', error);
    }
  };

  const addCustomReminderSteps = () => {
    // Register custom reminder workflow steps
    const reminderSteps: ProcessStep[] = [
      {
        id: 'create_reminder_workflow',
        name: 'Create Reminder Workflow',
        description: 'Set up multi-stage reminder system for legal events',
        type: 'reminder',
        priority: 10,
        isAsync: true,
        parameters: {
          template: 'deposition_intensive',
          eventTitle: 'Legal Event',
          eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
        }
      },
      {
        id: 'schedule_reminder',
        name: 'Schedule Individual Reminder',
        description: 'Schedule a specific reminder in the system',
        type: 'reminder',
        priority: 11,
        isAsync: true,
        dependencies: ['create_reminder_workflow']
      },
      {
        id: 'send_notification',
        name: 'Send Notification',
        description: 'Send notification via specified channel',
        type: 'notification',
        priority: 12,
        isAsync: true,
        parameters: {
          type: 'popup',
          urgency: 'info'
        }
      },
      {
        id: 'create_calendar_event',
        name: 'Create Calendar Event',
        description: 'Create calendar event with reminder integration',
        type: 'calendar',
        priority: 9,
        isAsync: true,
        dependencies: ['store_provider_token']
      }
    ];

    reminderSteps.forEach(step => {
      processChainTemplate.registerStep(step);
    });

    console.log('📅 Registered custom reminder workflow steps');
  };

  // Initialize reminder steps on component mount
  React.useEffect(() => {
    addCustomReminderSteps();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Granular Agent Chain Templates</h1>
        <p className="text-gray-600">
          Dynamically configure and execute modular process workflows
        </p>
      </div>

      {/* Workflow Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Available Workflow Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(workflowTemplates).map(([id, template]) => (
              <div
                key={id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedWorkflow === id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => initializeWorkflow(id)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{template.name}</h3>
                      <Badge className={template.color}>
                        {template.steps.length} steps
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{template.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {template.steps.slice(0, 3).map(step => (
                        <Badge key={step} variant="outline" className="text-xs">
                          {step.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                      {template.steps.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.steps.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        cloneWorkflow(id);
                      }}
                      title="Clone workflow"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        exportWorkflow(id);
                      }}
                      title="Export workflow"
                    >
                      📥
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chain Configuration Toggle */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant={showEditor ? "default" : "outline"}
          onClick={() => setShowEditor(!showEditor)}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          {showEditor ? 'Hide' : 'Show'} Chain Editor
        </Button>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Zap className="h-4 w-4" />
          Active: {workflowTemplates[selectedWorkflow as keyof typeof workflowTemplates]?.name}
        </div>
      </div>

      {/* Templated Authentication Component */}
      <Card>
        <CardHeader>
          <CardTitle>Live Workflow Execution</CardTitle>
        </CardHeader>
        <CardContent>
          <TemplatedGoogleReAuth
            customChainId={`workflow_${selectedWorkflow}`}
            showChainEditor={showEditor}
            onSuccess={() => {
              console.log('🎉 Workflow completed successfully!');
            }}
          />
        </CardContent>
      </Card>

      {/* Workflow Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Dynamic Configuration</h3>
                <p className="text-sm text-gray-600">Add/remove steps in real-time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">Retry Logic</h3>
                <p className="text-sm text-gray-600">Automatic retries with backoff</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium">Conditional Flow</h3>
                <p className="text-sm text-gray-600">Smart branching based on conditions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Implementation Benefits */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800">Implementation Benefits</CardTitle>
        </CardHeader>
        <CardContent className="text-green-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Authentication Templates
              </h4>
              <ul className="text-sm space-y-1 pl-6">
                <li>• Modular OAuth flow components</li>
                <li>• Custom retry and timeout policies</li>
                <li>• Automatic token validation</li>
                <li>• Failure recovery mechanisms</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Reminder Workflows
              </h4>
              <ul className="text-sm space-y-1 pl-6">
                <li>• Template-based reminder creation</li>
                <li>• Multi-channel notifications</li>
                <li>• Dependency-aware scheduling</li>
                <li>• Workflow customization</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
