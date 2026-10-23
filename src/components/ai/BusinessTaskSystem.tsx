import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ScrollArea } from '../ui/ScrollArea';
import { useAI } from '../../contexts/AIContext';
import { 
  Bot, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Brain,
  Target,
  TrendingUp,
  FileText,
  Database,
  Mail,
  Calculator,
  Calendar,
  Users
} from 'lucide-react';

interface BusinessTask {
  id: string;
  title: string;
  description: string;
  category: 'analysis' | 'communication' | 'data' | 'planning' | 'automation';
  status: 'learning' | 'ready' | 'improving';
  confidence: number;
  learned_from: string[];
  last_used: string;
  success_rate: number;
}

interface TaskSystemProps {
  assistantId?: string;
}

export function BusinessTaskSystem({ assistantId }: TaskSystemProps) {
  const [tasks, setTasks] = useState<BusinessTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<BusinessTask | null>(null);
  const [isLearning, setIsLearning] = useState(false);
  const { sendMessage } = useAI();

  useEffect(() => {
    // Load saved tasks
    const savedTasks = localStorage.getItem(`business_tasks_${assistantId || 'default'}`);
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      // Initialize with common business tasks
      const initialTasks: BusinessTask[] = [
        {
          id: 'email_analysis',
          title: 'Email Analysis & Response',
          description: 'Analyze incoming emails and draft appropriate responses',
          category: 'communication',
          status: 'learning',
          confidence: 0.3,
          learned_from: [],
          last_used: '',
          success_rate: 0
        },
        {
          id: 'data_report',
          title: 'Data Report Generation',
          description: 'Generate reports from data analysis and insights',
          category: 'analysis',
          status: 'learning',
          confidence: 0.2,
          learned_from: [],
          last_used: '',
          success_rate: 0
        },
        {
          id: 'meeting_scheduling',
          title: 'Meeting Coordination',
          description: 'Schedule meetings and coordinate with multiple participants',
          category: 'planning',
          status: 'learning',
          confidence: 0.1,
          learned_from: [],
          last_used: '',
          success_rate: 0
        },
        {
          id: 'expense_tracking',
          title: 'Expense Analysis',
          description: 'Track and analyze business expenses and budgets',
          category: 'data',
          status: 'learning',
          confidence: 0.15,
          learned_from: [],
          last_used: '',
          success_rate: 0
        },
        {
          id: 'customer_outreach',
          title: 'Customer Outreach',
          description: 'Draft personalized customer communications and follow-ups',
          category: 'communication',
          status: 'learning',
          confidence: 0.25,
          learned_from: [],
          last_used: '',
          success_rate: 0
        }
      ];
      setTasks(initialTasks);
      saveTasks(initialTasks);
    }
  }, [assistantId]);

  const saveTasks = (tasksToSave: BusinessTask[]) => {
    localStorage.setItem(`business_tasks_${assistantId || 'default'}`, JSON.stringify(tasksToSave));
  };

  const learnFromExample = async (task: BusinessTask, example: string, result: string) => {
    setIsLearning(true);
    
    try {
      // Simulate learning process
      const updatedTask = {
        ...task,
        confidence: Math.min(1, task.confidence + 0.1),
        learned_from: [...task.learned_from, `${example} → ${result}`],
        status: task.confidence > 0.7 ? 'ready' : 'learning',
        last_used: new Date().toISOString()
      } as BusinessTask;

      const updatedTasks = tasks.map(t => t.id === task.id ? updatedTask : t);
      setTasks(updatedTasks);
      saveTasks(updatedTasks);
      
      // Use AI to actually learn the pattern
      const learningPrompt = `
Task: ${task.title}
Description: ${task.description}
Example Input: ${example}
Expected Output: ${result}

Learn this pattern for future similar tasks. Update your understanding of how to handle ${task.category} tasks.
`;
      
      await sendMessage([{ text: learningPrompt }], 'task');
      
    } finally {
      setIsLearning(false);
    }
  };

  const executeTask = async (task: BusinessTask, input: string) => {
    if (task.confidence < 0.3) {
      return "I need more training examples for this task. Please provide some examples first.";
    }

    const executionPrompt = `
Execute this business task:

Task: ${task.title}
Description: ${task.description}
Category: ${task.category}
Confidence Level: ${(task.confidence * 100).toFixed(0)}%

Previous successful examples:
${task.learned_from.slice(-3).join('\n')}

Current input: ${input}

Please execute this task based on your training.
`;

    try {
      const response = await sendMessage([{ text: executionPrompt }], 'task');
      
      // Update task usage and success rate
      const updatedTask = {
        ...task,
        last_used: new Date().toISOString(),
        success_rate: Math.min(1, task.success_rate + 0.05)
      };

      const updatedTasks = tasks.map(t => t.id === task.id ? updatedTask : t);
      setTasks(updatedTasks);
      saveTasks(updatedTasks);
      
      return response;
    } catch (error) {
      console.error('Task execution error:', error);
      return "Failed to execute task. Please try again.";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'analysis': return <TrendingUp className="w-4 h-4" />;
      case 'communication': return <Mail className="w-4 h-4" />;
      case 'data': return <Database className="w-4 h-4" />;
      case 'planning': return <Calendar className="w-4 h-4" />;
      case 'automation': return <Bot className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string, confidence: number) => {
    if (status === 'ready' || confidence > 0.7) return 'text-green-600';
    if (confidence > 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (status: string, confidence: number) => {
    if (status === 'ready' || confidence > 0.7) return <CheckCircle className="w-4 h-4" />;
    if (confidence > 0.4) return <Clock className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Task Library */}
      <div className="lg:col-span-2">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-primary_color" />
          <h3 className="text-lg font-semibold">Business Task Library</h3>
          <Badge variant="outline" className="ml-auto">
            {tasks.filter(t => t.confidence > 0.7).length} / {tasks.length} Ready
          </Badge>
        </div>

        <div className="grid gap-3">
          {tasks.map((task) => (
            <Card 
              key={task.id} 
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedTask?.id === task.id ? 'ring-2 ring-primary_color bg-primary_color/5' : ''
              }`}
              onClick={() => setSelectedTask(task)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-primary_color mt-1">
                    {getCategoryIcon(task.category)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{task.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    
                    <div className="flex items-center gap-4 mt-3">
                      <div className={`flex items-center gap-1 text-sm ${getStatusColor(task.status, task.confidence)}`}>
                        {getStatusIcon(task.status, task.confidence)}
                        <span className="capitalize">{task.status}</span>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">{(task.confidence * 100).toFixed(0)}%</span> confident
                      </div>
                      
                      {task.learned_from.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          📚 {task.learned_from.length} examples
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Badge variant="secondary" className="capitalize">
                  {task.category}
                </Badge>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary_color h-2 rounded-full transition-all duration-300"
                    style={{ width: `${task.confidence * 100}%` }}
                  ></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Task Details & Execution */}
      <div className="space-y-4">
        {selectedTask ? (
          <>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-primary_color" />
                <h4 className="font-semibold">{selectedTask.title}</h4>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                {selectedTask.description}
              </p>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Confidence:</span>
                  <span className="font-medium">{(selectedTask.confidence * 100).toFixed(0)}%</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Examples:</span>
                  <span className="font-medium">{selectedTask.learned_from.length}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Success Rate:</span>
                  <span className="font-medium">{(selectedTask.success_rate * 100).toFixed(0)}%</span>
                </div>
              </div>

              {selectedTask.confidence > 0.7 && (
                <Button className="w-full mt-4" size="sm">
                  Execute Task
                </Button>
              )}
              
              {selectedTask.confidence <= 0.7 && (
                <Button 
                  variant="outline" 
                  className="w-full mt-4" 
                  size="sm"
                  onClick={() => {
                    // Open training interface
                  }}
                >
                  Need More Training
                </Button>
              )}
            </Card>

            {/* Recent Learning */}
            {selectedTask.learned_from.length > 0 && (
              <Card className="p-4">
                <h5 className="font-medium mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Recent Learning
                </h5>
                <ScrollArea className="max-h-48">
                  <div className="space-y-2">
                    {selectedTask.learned_from.slice(-5).map((example, index) => (
                      <div key={index} className="text-xs p-2 bg-muted rounded border-l-2 border-primary_color">
                        {example.length > 100 ? example.substring(0, 100) + '...' : example}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            )}
          </>
        ) : (
          <Card className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h4 className="font-medium mb-2">Select a Task</h4>
            <p className="text-sm text-muted-foreground">
              Choose a business task to view details and execute or train it
            </p>
          </Card>
        )}

        {/* Quick Stats */}
        <Card className="p-4">
          <h5 className="font-medium mb-3">Learning Progress</h5>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <div className="text-2xl font-bold text-primary_color">
                {tasks.filter(t => t.confidence > 0.7).length}
              </div>
              <div className="text-xs text-muted-foreground">Ready Tasks</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {tasks.filter(t => t.confidence > 0.3 && t.confidence <= 0.7).length}
              </div>
              <div className="text-xs text-muted-foreground">Learning</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
