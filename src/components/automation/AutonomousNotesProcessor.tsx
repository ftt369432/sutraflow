/**
 * 🤖 Autonomous Notes Processing Component
 * 
 * Integrates with AutomationPage to provide autonomous notes parsing
 * and multi-agent Canvas orchestration capabilities.
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { 
  FileText, 
  Zap, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users,
  Brain,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Settings
} from 'lucide-react';
import { notesParserService, ParsedTask, NotesParsingResult } from '../../services/automation/NotesParserService';
import { multiAgentCanvasOrchestrator, CanvasOrchestrationRequest, CanvasOrchestrationResult } from '../../services/automation/MultiAgentCanvasOrchestrator';
import { v4 as uuidv4 } from 'uuid';

interface AutonomousNotesProcessorProps {
  onTasksGenerated?: (tasks: ParsedTask[]) => void;
  onOrchestrationComplete?: (result: CanvasOrchestrationResult) => void;
}

interface ProcessingState {
  stage: 'idle' | 'parsing' | 'planning' | 'executing' | 'complete' | 'error';
  progress: number;
  currentStep: string;
  estimatedTimeRemaining?: number;
}

export function AutonomousNotesProcessor({ 
  onTasksGenerated, 
  onOrchestrationComplete 
}: AutonomousNotesProcessorProps) {
  const [notesInput, setNotesInput] = useState('');
  const [parsingResult, setParsingResult] = useState<NotesParsingResult | null>(null);
  const [orchestrationResult, setOrchestrationResult] = useState<CanvasOrchestrationResult | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    stage: 'idle',
    progress: 0,
    currentStep: 'Ready to process notes'
  });
  const [executionMode, setExecutionMode] = useState<'sequential' | 'parallel' | 'optimal'>('optimal');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  /**
   * 🚀 Main processing function - Parse notes and orchestrate tasks
   */
  const processNotes = useCallback(async () => {
    if (!notesInput.trim()) return;

    setProcessingState({
      stage: 'parsing',
      progress: 10,
      currentStep: 'Analyzing notes and extracting tasks...'
    });

    try {
      // Step 1: Parse notes
      const result = await notesParserService.parseNotes(notesInput);
      setParsingResult(result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to parse notes');
      }

      setProcessingState({
        stage: 'planning',
        progress: 30,
        currentStep: `Found ${result.totalTasks} tasks, creating execution plan...`
      });

      // Auto-select all tasks by default
      setSelectedTasks(new Set(result.tasks.map(t => t.id)));

      // Notify parent component
      onTasksGenerated?.(result.tasks);

      setProcessingState({
        stage: 'idle',
        progress: 100,
        currentStep: `Ready to execute ${result.totalTasks} tasks`
      });

    } catch (error) {
      console.error('Failed to process notes:', error);
      setProcessingState({
        stage: 'error',
        progress: 0,
        currentStep: error instanceof Error ? error.message : 'Processing failed'
      });
    }
  }, [notesInput, onTasksGenerated]);

  /**
   * 🎯 Execute selected tasks with multi-agent orchestration
   */
  const executeTasks = useCallback(async () => {
    if (!parsingResult || selectedTasks.size === 0) return;

    const tasksToExecute = parsingResult.tasks.filter(task => selectedTasks.has(task.id));

    setProcessingState({
      stage: 'executing',
      progress: 0,
      currentStep: 'Initializing multi-agent orchestration...'
    });

    try {
      const orchestrationRequest: CanvasOrchestrationRequest = {
        id: uuidv4(),
        tasks: tasksToExecute,
        executionMode,
        prioritizeByUrgency: true,
        notifyOnCompletion: true,
        userId: 'current-user' // Would come from auth context
      };

      // Set up progress monitoring
      multiAgentCanvasOrchestrator.onProgress(orchestrationRequest.id, (progress: any) => {
        setProcessingState(prev => ({
          ...prev,
          progress: Math.min(90, prev.progress + 10),
          currentStep: `Creating Canvas documents... (${progress.completed}/${progress.total})`
        }));
      });

      setProcessingState({
        stage: 'executing',
        progress: 20,
        currentStep: 'Coordinating agents and creating swarm...'
      });

      // Execute orchestration
      const result = await multiAgentCanvasOrchestrator.orchestrateCanvasTasks(orchestrationRequest);
      setOrchestrationResult(result);

      if (result.success) {
        setProcessingState({
          stage: 'complete',
          progress: 100,
          currentStep: `Successfully created ${result.canvasesCreated} Canvas documents`
        });
      } else {
        throw new Error(result.error || 'Orchestration failed');
      }

      // Notify parent component
      onOrchestrationComplete?.(result);

    } catch (error) {
      console.error('Failed to execute tasks:', error);
      setProcessingState({
        stage: 'error',
        progress: 0,
        currentStep: error instanceof Error ? error.message : 'Execution failed'
      });
    }
  }, [parsingResult, selectedTasks, executionMode, onOrchestrationComplete]);

  /**
   * 🔄 Reset processor state
   */
  const resetProcessor = useCallback(() => {
    setNotesInput('');
    setParsingResult(null);
    setOrchestrationResult(null);
    setSelectedTasks(new Set());
    setProcessingState({
      stage: 'idle',
      progress: 0,
      currentStep: 'Ready to process notes'
    });
  }, []);

  /**
   * 🎛️ Toggle task selection
   */
  const toggleTaskSelection = useCallback((taskId: string) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }, []);

  /**
   * 🎨 Get priority color
   */
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'canvas': return <FileText className="h-4 w-4" />;
      case 'email': return <FileText className="h-4 w-4" />;
      case 'calendar': return <Clock className="h-4 w-4" />;
      case 'research': return <Eye className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">🤖 Autonomous Notes Processor</h2>
          <p className="text-muted-foreground">
            Drop in your notes and watch AI agents create multiple Canvas documents autonomously
          </p>
        </div>
        {processingState.stage !== 'idle' && (
          <Button variant="outline" onClick={resetProcessor}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        )}
      </div>

      {/* Notes Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Notes Input
          </CardTitle>
          <CardDescription>
            Paste your notes, meeting transcripts, or task lists. AI will extract actionable tasks automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Example: 
- Create a petition for John Doe's workers compensation case
- Send follow-up email to attorney about deadline
- Schedule meeting with client next week
- Research similar cases for precedent
- Draft motion for summary judgment"
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            rows={8}
            className="min-h-[200px]"
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Execution Mode:</span>
              <select 
                value={executionMode} 
                onChange={(e) => setExecutionMode(e.target.value as any)}
                className="px-3 py-1 border rounded-md text-sm"
                title="Select execution mode for autonomous processing"
                aria-label="Execution mode selection"
              >
                <option value="optimal">Optimal (Recommended)</option>
                <option value="parallel">Parallel (Fast)</option>
                <option value="sequential">Sequential (Safe)</option>
              </select>
            </div>
            
            <Button 
              onClick={processNotes}
              disabled={!notesInput.trim() || processingState.stage === 'parsing'}
            >
              <Zap className="h-4 w-4 mr-2" />
              {processingState.stage === 'parsing' ? 'Processing...' : 'Analyze Notes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Processing Status */}
      {processingState.stage !== 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {processingState.stage === 'complete' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : processingState.stage === 'error' ? (
                <AlertCircle className="h-5 w-5 text-red-600" />
              ) : (
                <Brain className="h-5 w-5 animate-pulse text-blue-600" />
              )}
              Processing Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{processingState.currentStep}</span>
                <span>{Math.round(processingState.progress)}%</span>
              </div>
              <Progress value={processingState.progress} className="w-full" />
            </div>
            
            {processingState.estimatedTimeRemaining && (
              <p className="text-sm text-muted-foreground">
                Estimated time remaining: {Math.round(processingState.estimatedTimeRemaining / 60)} minutes
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Parsed Tasks */}
      {parsingResult && parsingResult.success && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Extracted Tasks ({parsingResult.totalTasks})
              </span>
              {processingState.stage !== 'executing' && processingState.stage !== 'complete' && (
                <Button 
                  onClick={executeTasks}
                  disabled={selectedTasks.size === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Execute Selected ({selectedTasks.size})
                </Button>
              )}
            </CardTitle>
            <CardDescription>
              Select tasks to execute with autonomous multi-agent orchestration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {parsingResult.tasks.map((task) => (
                <div 
                  key={task.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedTasks.has(task.id) 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleTaskSelection(task.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(task.type)}
                        <h4 className="font-medium">{task.title}</h4>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <Badge variant="outline">
                          {task.type}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {task.estimatedDuration} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {task.requiredAgents.length} agents
                        </span>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={selectedTasks.has(task.id)}
                        onChange={() => toggleTaskSelection(task.id)}
                        className="h-4 w-4"
                        title={`Select task: ${task.title}`}
                        aria-label={`Select task: ${task.title}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Execution Results */}
      {orchestrationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {orchestrationResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Execution Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {orchestrationResult.canvasesCreated}
                </div>
                <div className="text-sm text-muted-foreground">Canvas Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(orchestrationResult.executionTime / 1000)}s
                </div>
                <div className="text-sm text-muted-foreground">Execution Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {orchestrationResult.createdCanvases.filter(c => c.status === 'created').length}
                </div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Created Canvas Documents:</h4>
              {orchestrationResult.createdCanvases.map((canvas) => (
                <div 
                  key={canvas.taskId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{canvas.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {canvas.documentType} • {canvas.agentsAssigned.length} agents
                      </div>
                    </div>
                  </div>
                  <Badge 
                    className={
                      canvas.status === 'created' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }
                  >
                    {canvas.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
