import React, { useState, useEffect } from 'react';
import { processChainTemplate, ProcessStep } from '../../services/agents/ProcessChainTemplate';
import '../../services/agents/ProcessStepExecutors'; // Import to register executors
import { Button } from '../ui/Button';
import { AlertCircle, RefreshCw, Mail, Calendar, Settings, Plus, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/Alert';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface TemplatedGoogleReAuthProps {
  onSuccess?: () => void;
  showWarning?: boolean;
  showChainEditor?: boolean;
  className?: string;
  customChainId?: string;
}

export const TemplatedGoogleReAuth: React.FC<TemplatedGoogleReAuthProps> = ({
  onSuccess,
  showWarning = true,
  showChainEditor = false,
  className = '',
  customChainId = 'google_auth_flow'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [currentChain, setCurrentChain] = useState<ProcessStep[]>([]);
  const [availableSteps, setAvailableSteps] = useState<ProcessStep[]>([]);

  useEffect(() => {
    initializeChainTemplates();
    loadCurrentChain();
  }, [customChainId]);

  const initializeChainTemplates = () => {
    // Register standard Google Auth process steps
    const authSteps: ProcessStep[] = [
      {
        id: 'check_auth_status',
        name: 'Check Authentication Status',
        description: 'Verify current session and provider token status',
        type: 'auth',
        priority: 1,
        isAsync: true,
        retryCount: 2,
        conditions: []
      },
      {
        id: 'refresh_token',
        name: 'Refresh Access Token',
        description: 'Attempt to refresh the current session token',
        type: 'auth',
        priority: 2,
        isAsync: true,
        retryCount: 1,
        dependencies: ['check_auth_status']
      },
      {
        id: 'initiate_oauth',
        name: 'Initiate OAuth Flow',
        description: 'Start Google OAuth authentication process',
        type: 'auth',
        priority: 3,
        isAsync: true,
        retryCount: 0,
        parameters: {
          forceConsent: true,
          scopes: [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/calendar.events'
          ]
        }
      },
      {
        id: 'validate_scopes',
        name: 'Validate Required Scopes',
        description: 'Ensure all required API scopes are granted',
        type: 'validation',
        priority: 4,
        isAsync: true,
        parameters: {
          requiredScopes: [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/calendar.readonly'
          ]
        }
      },
      {
        id: 'store_provider_token',
        name: 'Store Provider Token',
        description: 'Securely store the Google provider token',
        type: 'auth',
        priority: 5,
        isAsync: true,
        dependencies: ['validate_scopes']
      },
      {
        id: 'send_success_notification',
        name: 'Send Success Notification',
        description: 'Notify user of successful authentication',
        type: 'notification',
        priority: 6,
        isAsync: false,
        parameters: {
          type: 'popup',
          message: 'Google authentication successful!',
          urgency: 'info'
        }
      }
    ];

    // Additional optional steps
    const optionalSteps: ProcessStep[] = [
      {
        id: 'backup_old_token',
        name: 'Backup Previous Token',
        description: 'Create backup of existing token before refresh',
        type: 'auth',
        priority: 1.5,
        isAsync: true
      },
      {
        id: 'log_auth_attempt',
        name: 'Log Authentication Attempt',
        description: 'Record authentication attempt for audit trail',
        type: 'validation',
        priority: 0.5,
        isAsync: false
      },
      {
        id: 'update_user_preferences',
        name: 'Update User Preferences',
        description: 'Update user auth preferences after successful login',
        type: 'custom',
        priority: 7,
        isAsync: true,
        dependencies: ['store_provider_token']
      }
    ];

    // Register all steps
    [...authSteps, ...optionalSteps].forEach(step => {
      processChainTemplate.registerStep(step);
    });

    // Create default chain
    const defaultStepIds = authSteps.map(step => step.id);
    processChainTemplate.createChain(customChainId, defaultStepIds);

    setAvailableSteps([...authSteps, ...optionalSteps]);
  };

  const loadCurrentChain = () => {
    const chain = processChainTemplate.getChain(customChainId);
    setCurrentChain(chain);
  };

  const executeAuthChain = async () => {
    setIsLoading(true);
    setError(null);
    setExecutionResult(null);

    try {
      console.log(`🚀 Executing auth chain: ${customChainId}`);
      
      const result = await processChainTemplate.executeChain(customChainId, {
        userId: 'current_user',
        data: {
          authType: 'google',
          requestedScopes: ['gmail', 'calendar']
        }
      });

      setExecutionResult(result);

      if (result.success) {
        console.log('✅ Auth chain completed successfully');
        onSuccess?.();
      } else {
        setError(result.error || 'Authentication chain failed');
      }
    } catch (err: any) {
      console.error('❌ Auth chain execution failed:', err);
      setError(err.message || 'Failed to execute authentication chain');
    } finally {
      setIsLoading(false);
    }
  };

  const addStepToChain = (stepId: string) => {
    const position = currentChain.length;
    processChainTemplate.insertStepInChain(customChainId, stepId, position);
    loadCurrentChain();
  };

  const removeStepFromChain = (stepId: string) => {
    processChainTemplate.removeStepFromChain(customChainId, stepId);
    loadCurrentChain();
  };

  const getStepStatus = (stepId: string) => {
    if (!executionResult?.metadata) return 'pending';
    
    if (executionResult.metadata.executedSteps.includes(stepId)) return 'completed';
    if (executionResult.metadata.failedSteps.includes(stepId)) return 'failed';
    return 'pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const availableStepsNotInChain = availableSteps.filter(
    step => !currentChain.some(chainStep => chainStep.id === step.id)
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Warning Alert */}
      {showWarning && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="space-y-2">
              <p className="font-medium">Templated Authentication Flow</p>
              <p className="text-sm">
                Using granular agent chain with {currentChain.length} configurable steps
              </p>
              <ul className="text-sm space-y-1 mt-2">
                <li className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  Gmail API access restoration
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Calendar integration and reminder system
                </li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Execution Result */}
      {executionResult && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {executionResult.success ? '✅' : '❌'} Execution Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm">
                <span>Steps Executed: {executionResult.metadata?.executedSteps?.length || 0}</span>
                <span>Failed Steps: {executionResult.metadata?.failedSteps?.length || 0}</span>
                <span>Total Duration: {executionResult.metadata?.startTime ? 
                  Math.round((Date.now() - new Date(executionResult.metadata.startTime).getTime()) / 1000) + 's' : 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Auth Button */}
      <Button
        onClick={executeAuthChain}
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isLoading ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Executing Chain ({currentChain.length} steps)...
          </>
        ) : (
          <>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Execute Templated Auth Chain
          </>
        )}
      </Button>

      {/* Chain Editor */}
      {showChainEditor && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Chain Configuration Editor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Chain Steps */}
            <div>
              <h4 className="font-medium mb-3">Current Chain Steps ({currentChain.length})</h4>
              <div className="space-y-2">
                {currentChain.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{step.name}</span>
                        <Badge className={getStatusColor(getStepStatus(step.id))}>
                          {getStepStatus(step.id)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {step.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStepFromChain(step.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Steps to Add */}
            {availableStepsNotInChain.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Available Steps to Add</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableStepsNotInChain.map((step) => (
                    <div key={step.id} className="flex items-center gap-3 p-2 border border-dashed rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{step.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {step.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">{step.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addStepToChain(step.id)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-gray-500 text-center">
        Powered by Granular Agent Chain Template System
      </p>
    </div>
  );
};
