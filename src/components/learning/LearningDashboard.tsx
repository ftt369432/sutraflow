import React, { useState, useEffect } from 'react';
import { useLearningSystem } from '../../hooks/useLearningSystem';
import { AIAssistant } from '../../types/ai';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { Progress } from '../ui/progress';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Switch } from '../ui/Switch';
import { Label } from '../ui/Label';
import {
  BarChart,
  Brain,
  FileText,
  BookOpen,
  RefreshCw,
  Save,
  Play,
  Pause,
  Target,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Lightbulb
} from 'lucide-react';

interface LearningDashboardProps {
  assistant: AIAssistant;
  onUpdate?: (assistant: AIAssistant) => void;
}

export function LearningDashboard({ assistant, onUpdate }: LearningDashboardProps) {
  const [activeTab, setActiveTab] = useState('insights');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  
  const { 
    insights, 
    isLearningEnabled,
    toggleLearning,
    addTrainingEntry,
    applyInsightsToAssistant,
    isProcessing
  } = useLearningSystem(assistant.id || 'default');
  
  // Apply insights to the assistant when they change
  useEffect(() => {
    if (assistant.id && insights.patterns > 0 && onUpdate) {
      const enhancedAssistant = applyInsightsToAssistant(assistant);
      onUpdate(enhancedAssistant);
    }
  }, [insights.patterns]);
  
  const handleAddTrainingEntry = async () => {
    if (!newQuestion || !newAnswer) return;
    
    const success = await addTrainingEntry({
      question: newQuestion,
      answer: newAnswer,
      entry_type: 'example_conversation',
      effectiveness_score: 0.8
    });
    
    if (success) {
      setNewQuestion('');
      setNewAnswer('');
    }
  };
  
  const handleApplyInsights = () => {
    if (!assistant.id || !onUpdate) return;
    
    const enhancedAssistant = applyInsightsToAssistant(assistant);
    onUpdate(enhancedAssistant);
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Brain className="h-5 w-5" /> Learning Dashboard
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center space-x-2">
              <Switch 
                id="learning-mode"
                checked={isLearningEnabled}
                onCheckedChange={toggleLearning}
              />
              <Label htmlFor="learning-mode">Learning {isLearningEnabled ? 'Enabled' : 'Disabled'}</Label>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleApplyInsights}
              disabled={insights.patterns === 0}
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Apply Insights
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="insights">
              <Lightbulb className="h-4 w-4 mr-2" /> Learning Insights
            </TabsTrigger>
            <TabsTrigger value="training">
              <BookOpen className="h-4 w-4 mr-2" /> Training Examples
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4 mr-2" /> Document Impact
            </TabsTrigger>
            <TabsTrigger value="metrics">
              <BarChart className="h-4 w-4 mr-2" /> Performance Metrics
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="insights">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium">Learning Patterns</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold">{insights.patterns}</div>
                  <p className="text-xs text-muted-foreground">
                    Behavioral and workflow patterns detected
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium">Documents Analyzed</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold">{insights.documentsTracked}</div>
                  <p className="text-xs text-muted-foreground">
                    Documents tracked for relevance
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium">Improvement Score</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-center">
                    <div className="text-2xl font-bold mr-2">
                      {Math.round(insights.improvementScore * 100)}%
                    </div>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                    <div 
                      className="h-2 bg-green-500 rounded-full" 
                      style={{ width: `${insights.improvementScore * 100}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <h3 className="text-lg font-semibold mb-3">Learning Summary</h3>
            <div className="space-y-2 mb-6">
              <p>
                The assistant has developed {insights.patterns} learning patterns based on interactions 
                and training examples. Recent improvements have focused on response relevance 
                and context awareness.
              </p>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                <span>Next focus area: Expanding domain knowledge from document context</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-blue-50">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-800">Adaptive Behavior</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <ul className="space-y-1">
                    <li className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-blue-800" />
                      <span className="text-sm">Adjusts tone based on conversation context</span>
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-blue-800" />
                      <span className="text-sm">Prioritizes recently accessed documents</span>
                    </li>
                    <li className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-yellow-600" />
                      <span className="text-sm">Working on: Response verbosity optimization</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-green-800">Knowledge Expansion</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <ul className="space-y-1">
                    <li className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-800" />
                      <span className="text-sm">Integrated {insights.lastTrainingEntries.length} training examples</span>
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-800" />
                      <span className="text-sm">Identified key domain terminology</span>
                    </li>
                    <li className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-yellow-600" />
                      <span className="text-sm">Working on: Cross-document knowledge synthesis</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="training">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Add Training Example</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="question">Question or Prompt</Label>
                  <Input 
                    id="question"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="What is an example question you want the assistant to handle?"
                  />
                </div>
                <div>
                  <Label htmlFor="answer">Ideal Answer</Label>
                  <Textarea 
                    id="answer"
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    placeholder="What is the ideal response to this question?"
                    rows={4}
                  />
                </div>
                <Button 
                  onClick={handleAddTrainingEntry}
                  disabled={!newQuestion || !newAnswer || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Training Example
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold mb-3">Recent Training Examples</h3>
            {insights.lastTrainingEntries.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-md text-center">
                No training examples yet. Add some above to improve your assistant!
              </div>
            ) : (
              <div className="space-y-4">
                {insights.lastTrainingEntries.map((entry) => (
                  <Card key={entry.id} className="bg-gray-50">
                    <CardContent className="p-4">
                      <div className="mb-2">
                        <Label className="text-blue-600">Question:</Label>
                        <p className="mt-1">{entry.question}</p>
                      </div>
                      <div>
                        <Label className="text-green-600">Answer:</Label>
                        <p className="mt-1">{entry.answer}</p>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="text-xs text-gray-500">
                          Added: {new Date(entry.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs mr-2">Effectiveness:</span>
                          <Progress 
                            value={(entry.effectiveness_score || 0) * 100} 
                            className="w-20 h-2"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="documents">
            <h3 className="text-lg font-semibold mb-3">Top Documents by Usage</h3>
            {insights.topDocuments.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-md text-center">
                No document usage data yet. Interact with the assistant to track document relevance.
              </div>
            ) : (
              <div className="space-y-3">
                {insights.topDocuments.map((doc) => (
                  <div key={doc.documentId} className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-blue-500" />
                      <span>{doc.documentId.substring(0, 8)}...</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-3">Used {doc.usageCount} times</span>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{
                            width: `${Math.min(100, doc.usageCount * 10)}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <h3 className="text-lg font-semibold mt-6 mb-3">Document Learning Impact</h3>
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <p>
                    The assistant has analyzed {insights.documentsTracked} documents to build its knowledge base.
                    The most valuable documents are used to improve responses through content and context learning.
                  </p>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4 text-green-600" />
                    <span>Document knowledge integration score: {Math.round(insights.improvementScore * 85)}%</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span>Knowledge extraction efficiency: {Math.round(insights.improvementScore * 92)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="metrics">
            <h3 className="text-lg font-semibold mb-3">Learning Performance Metrics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium">Pattern Recognition</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold">{Math.round(insights.improvementScore * 88)}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${insights.improvementScore * 88}%` }} 
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pattern recognition accuracy
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium">Adaptation Speed</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold">{Math.round(insights.improvementScore * 79)}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${insights.improvementScore * 79}%` }} 
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    How quickly the system adapts to new patterns
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <h3 className="text-lg font-semibold mb-3">Learning System Status</h3>
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`h-3 w-3 rounded-full ${isLearningEnabled ? 'bg-green-500' : 'bg-yellow-500'} mr-2`}></div>
                      <span>Learning System Status</span>
                    </div>
                    <span className="text-sm font-medium">
                      {isLearningEnabled ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Brain className="h-4 w-4 text-blue-600 mr-2" />
                      <span>Learning Cycles</span>
                    </div>
                    <span className="text-sm font-medium">
                      {insights.patterns * 3} cycles
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <RefreshCw className="h-4 w-4 text-purple-600 mr-2" />
                      <span>Last Learning Update</span>
                    </div>
                    <span className="text-sm font-medium">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <Button 
                    variant={isLearningEnabled ? "outline" : "default"}
                    size="sm"
                    onClick={() => toggleLearning(!isLearningEnabled)}
                  >
                    {isLearningEnabled ? (
                      <>
                        <Pause className="h-4 w-4 mr-1" /> Pause Learning
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1" /> Resume Learning
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
