import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  BookOpen,
  Lightbulb,
  Target,
  MessageSquare,
  Upload,
  Download,
  Save,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Clock,
  FileText,
  Zap,
  Settings,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Send,
  Loader2,
  Book,
  GraduationCap,
  Activity
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Textarea } from '../ui/Textarea';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Switch } from '../ui/Switch';
import { Progress } from '../ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { useAssistantStore } from '../../store/assistantStore';
import { AIService } from '../../services/ai/aiService';
import type { AIAssistant } from '../../types/ai';

interface TrainingEntry {
  id: string;
  type: 'correction' | 'reinforcement' | 'new_knowledge' | 'example' | 'feedback';
  content: string;
  expectedResponse?: string;
  actualResponse?: string;
  feedback: 'positive' | 'negative' | 'neutral';
  category: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high';
  source: 'conversation' | 'manual' | 'document' | 'correction';
  status: 'pending' | 'applied' | 'reviewing';
}

interface TrainingSession {
  id: string;
  name: string;
  description: string;
  mode: 'interactive' | 'batch' | 'continuous' | 'validation';
  startTime: Date;
  endTime?: Date;
  entries: TrainingEntry[];
  performance: {
    accuracy: number;
    confidence: number;
    improvement: number;
  };
}

interface AdvancedTrainingPanelProps {
  selectedAssistant?: AIAssistant | null;
  conversationContext?: {
    uploadedFiles: Array<{
      name: string;
      content: string;
      type: string;
      uploadedAt: Date;
    }>;
    analysisResults: Array<{
      fileId: string;
      analysis: string;
      timestamp: Date;
    }>;
  };
  chatMessages?: any[];
  onSaveKnowledge?: (content: string, metadata: any) => void;
}

export function AdvancedTrainingPanel({
  selectedAssistant,
  conversationContext,
  chatMessages = [],
  onSaveKnowledge
}: AdvancedTrainingPanelProps) {
  const [trainingMode, setTrainingMode] = useState<'interactive' | 'batch' | 'continuous' | 'validation'>('interactive');
  const [isTraining, setIsTraining] = useState(false);
  const [trainingEntries, setTrainingEntries] = useState<TrainingEntry[]>([]);
  const [currentSession, setCurrentSession] = useState<TrainingSession | null>(null);
  const [newEntry, setNewEntry] = useState({
    content: '',
    expectedResponse: '',
    category: 'general',
    priority: 'medium' as 'low' | 'medium' | 'high',
    type: 'new_knowledge' as TrainingEntry['type']
  });
  const [autoSave, setAutoSave] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [validationMode, setValidationMode] = useState(false);
  const [trainingStats, setTrainingStats] = useState({
    totalEntries: 0,
    appliedEntries: 0,
    accuracy: 0,
    lastTraining: null as Date | null,
    categories: {} as Record<string, number>
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTrainingData();
  }, [selectedAssistant]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [trainingEntries]);

  const loadTrainingData = async () => {
    if (!selectedAssistant) return;
    
    try {
      // Load existing training data for this assistant
      const data = localStorage.getItem(`training_${selectedAssistant.id}`);
      if (data) {
        const parsed = JSON.parse(data);
        setTrainingEntries(parsed.entries || []);
        setTrainingStats(parsed.stats || trainingStats);
      }
    } catch (error) {
      console.error('Failed to load training data:', error);
    }
  };

  const saveTrainingData = async () => {
    if (!selectedAssistant) return;

    try {
      const data = {
        entries: trainingEntries,
        stats: trainingStats,
        lastSaved: new Date()
      };
      localStorage.setItem(`training_${selectedAssistant.id}`, JSON.stringify(data));
      
      if (onSaveKnowledge) {
        onSaveKnowledge(JSON.stringify(data), {
          type: 'training_data',
          assistantId: selectedAssistant.id,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to save training data:', error);
    }
  };

  const startTrainingSession = () => {
    const session: TrainingSession = {
      id: `session_${Date.now()}`,
      name: `Training Session ${new Date().toLocaleString()}`,
      description: `${trainingMode} training for ${selectedAssistant?.name || 'Assistant'}`,
      mode: trainingMode,
      startTime: new Date(),
      entries: [],
      performance: {
        accuracy: 0,
        confidence: 0,
        improvement: 0
      }
    };
    
    setCurrentSession(session);
    setIsTraining(true);
  };

  const endTrainingSession = () => {
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        endTime: new Date(),
        entries: trainingEntries.filter(e => 
          e.timestamp >= currentSession.startTime
        )
      };
      setCurrentSession(updatedSession);
    }
    setIsTraining(false);
    if (autoSave) {
      saveTrainingData();
    }
  };

  const addTrainingEntry = async () => {
    if (!newEntry.content.trim()) return;

    const entry: TrainingEntry = {
      id: `entry_${Date.now()}`,
      ...newEntry,
      feedback: 'neutral',
      timestamp: new Date(),
      source: 'manual',
      status: 'pending'
    };

    setTrainingEntries(prev => [...prev, entry]);
    
    // Update stats
    setTrainingStats(prev => ({
      ...prev,
      totalEntries: prev.totalEntries + 1,
      categories: {
        ...prev.categories,
        [entry.category]: (prev.categories[entry.category] || 0) + 1
      }
    }));

    // Clear form
    setNewEntry({
      content: '',
      expectedResponse: '',
      category: 'general',
      priority: 'medium',
      type: 'new_knowledge'
    });

    if (autoSave) {
      await saveTrainingData();
    }
  };

  const processConversationForTraining = () => {
    const newEntries: TrainingEntry[] = [];
    
    // Extract training opportunities from conversation
    chatMessages.forEach((message, index) => {
      if (message.role === 'assistant' && index > 0) {
        const userMessage = chatMessages[index - 1];
        if (userMessage.role === 'user') {
          const entry: TrainingEntry = {
            id: `conv_${message.id}`,
            type: 'example',
            content: userMessage.content,
            expectedResponse: message.content,
            feedback: 'neutral',
            category: 'conversation',
            timestamp: message.timestamp,
            priority: 'medium',
            source: 'conversation',
            status: 'pending'
          };
          newEntries.push(entry);
        }
      }
    });

    setTrainingEntries(prev => [...prev, ...newEntries]);
    setTrainingStats(prev => ({
      ...prev,
      totalEntries: prev.totalEntries + newEntries.length
    }));
  };

  const validateTraining = async (entry: TrainingEntry) => {
    if (!selectedAssistant) return;

    try {
      setValidationMode(true);
      
      // Test the entry against the assistant
      const aiServiceInstance = await AIService.getInstance();
      const response = await aiServiceInstance.generateText(entry.content, {
        context: selectedAssistant.system_prompt
      });

      // Compare with expected response (simplified)
      const similarity = calculateSimilarity(response, entry.expectedResponse || '');
      
      // Update entry status
      const updatedEntry = {
        ...entry,
        actualResponse: response,
        status: similarity > 0.7 ? 'applied' : 'reviewing' as TrainingEntry['status'],
        feedback: similarity > 0.7 ? 'positive' : 'neutral' as 'positive' | 'negative' | 'neutral'
      };

      setTrainingEntries(prev => 
        prev.map(e => e.id === entry.id ? updatedEntry : e)
      );

    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setValidationMode(false);
    }
  };

  const calculateSimilarity = (text1: string, text2: string): number => {
    // Simple similarity calculation (in real implementation, use more sophisticated method)
    const words1 = text1.toLowerCase().split(' ');
    const words2 = text2.toLowerCase().split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  };

  const deleteEntry = (entryId: string) => {
    setTrainingEntries(prev => prev.filter(e => e.id !== entryId));
    setTrainingStats(prev => ({
      ...prev,
      totalEntries: prev.totalEntries - 1
    }));
  };

  if (!selectedAssistant) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Assistant Selected</h3>
          <p className="text-sm text-gray-500">
            Select an assistant to begin advanced training
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <GraduationCap className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Advanced Training
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Training {selectedAssistant.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant={isTraining ? 'default' : 'secondary'}>
              {isTraining ? '🎓 Training' : '⏸️ Paused'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={isTraining ? endTrainingSession : startTrainingSession}
            >
              {isTraining ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Training Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
            <div className="font-semibold text-blue-600">{trainingStats.totalEntries}</div>
            <div className="text-blue-500">Entries</div>
          </div>
          <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
            <div className="font-semibold text-green-600">{trainingStats.appliedEntries}</div>
            <div className="text-green-500">Applied</div>
          </div>
          <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
            <div className="font-semibold text-purple-600">{Math.round(trainingStats.accuracy)}%</div>
            <div className="text-purple-500">Accuracy</div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="create" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start mb-2 mx-4 mt-2">
          <TabsTrigger value="create" className="text-xs">Create</TabsTrigger>
          <TabsTrigger value="entries" className="text-xs">Entries</TabsTrigger>
          <TabsTrigger value="sessions" className="text-xs">Sessions</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
        </TabsList>

        {/* Create Training Entry */}
        <TabsContent value="create" className="flex-1 overflow-y-auto p-4 space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Training Mode</Label>
                <Select value={trainingMode} onValueChange={(value) => setTrainingMode(value as typeof trainingMode)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interactive">Interactive</SelectItem>
                    <SelectItem value="batch">Batch</SelectItem>
                    <SelectItem value="continuous">Continuous</SelectItem>
                    <SelectItem value="validation">Validation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select value={newEntry.type} onValueChange={(value) => 
                    setNewEntry(prev => ({ ...prev, type: value as TrainingEntry['type'] }))
                  }>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new_knowledge">New Knowledge</SelectItem>
                      <SelectItem value="correction">Correction</SelectItem>
                      <SelectItem value="reinforcement">Reinforcement</SelectItem>
                      <SelectItem value="example">Example</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Priority</Label>
                  <Select value={newEntry.priority} onValueChange={(value) => 
                    setNewEntry(prev => ({ ...prev, priority: value as 'low' | 'medium' | 'high' }))
                  }>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs">Category</Label>
                <Input
                  value={newEntry.category}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., general, technical, customer-service"
                  className="h-8"
                />
              </div>

              <div>
                <Label className="text-xs">Training Content</Label>
                <Textarea
                  value={newEntry.content}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter the question, scenario, or knowledge to teach..."
                  className="min-h-[80px] resize-none"
                />
              </div>

              {(newEntry.type === 'example' || newEntry.type === 'correction') && (
                <div>
                  <Label className="text-xs">Expected Response</Label>
                  <Textarea
                    value={newEntry.expectedResponse}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, expectedResponse: e.target.value }))}
                    placeholder="Enter the expected or correct response..."
                    className="min-h-[60px] resize-none"
                  />
                </div>
              )}

              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={processConversationForTraining}
                  disabled={chatMessages.length === 0}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Extract from Conversation
                </Button>
                
                <Button onClick={addTrainingEntry} disabled={!newEntry.content.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-4">
            <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => {}}>
                <Upload className="h-4 w-4 mr-1" />
                Import Training
              </Button>
              <Button variant="outline" size="sm" onClick={() => {}}>
                <Download className="h-4 w-4 mr-1" />
                Export Training
              </Button>
              <Button variant="outline" size="sm" onClick={() => {}}>
                <Brain className="h-4 w-4 mr-1" />
                Auto-Generate
              </Button>
              <Button variant="outline" size="sm" onClick={saveTrainingData}>
                <Save className="h-4 w-4 mr-1" />
                Save All
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Training Entries */}
        <TabsContent value="entries" className="flex-1 overflow-y-auto p-4">
          {trainingEntries.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No training entries yet</p>
              <p className="text-xs text-gray-400 mt-1">Start adding training data to improve your assistant</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trainingEntries.map((entry) => (
                <Card key={entry.id} className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant={entry.status === 'applied' ? 'default' : 'secondary'} className="text-xs">
                        {entry.type}
                      </Badge>
                      <Badge variant={entry.priority === 'high' ? 'destructive' : entry.priority === 'medium' ? 'default' : 'secondary'} className="text-xs">
                        {entry.priority}
                      </Badge>
                      <span className="text-xs text-gray-500">{entry.category}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => validateTraining(entry)}>
                        {validationMode ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteEntry(entry.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {entry.content}
                  </div>
                  
                  {entry.expectedResponse && (
                    <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      <strong>Expected:</strong> {entry.expectedResponse}
                    </div>
                  )}
                  
                  {entry.actualResponse && (
                    <div className="text-xs text-gray-500 bg-blue-50 dark:bg-blue-900/20 p-2 rounded mt-1">
                      <strong>Actual:</strong> {entry.actualResponse}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                    <span>{entry.timestamp.toLocaleString()}</span>
                    <div className="flex items-center space-x-2">
                      {entry.feedback === 'positive' && <ThumbsUp className="h-3 w-3 text-green-500" />}
                      {entry.feedback === 'negative' && <ThumbsDown className="h-3 w-3 text-red-500" />}
                      <Badge variant={entry.status === 'applied' ? 'default' : 'secondary'} className="text-xs">
                        {entry.status}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Training Sessions */}
        <TabsContent value="sessions" className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {currentSession && (
              <Card className="p-4 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">Current Session</h4>
                  <Badge variant="default">{currentSession.mode}</Badge>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">{currentSession.name}</p>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  Started: {currentSession.startTime.toLocaleString()}
                </div>
                <div className="mt-2">
                  <Progress value={75} className="h-2" />
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Training Progress: 75%
                  </div>
                </div>
              </Card>
            )}
            
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>Session history will appear here</p>
            </div>
          </div>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="flex-1 overflow-y-auto p-4">
          <Card className="p-4">
            <h4 className="font-medium mb-4">Training Settings</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Auto-save Training Data</Label>
                  <p className="text-xs text-gray-500">Automatically save training entries</p>
                </div>
                <Switch checked={autoSave} onCheckedChange={setAutoSave} />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Show Advanced Options</Label>
                  <p className="text-xs text-gray-500">Display advanced training features</p>
                </div>
                <Switch checked={showAdvanced} onCheckedChange={setShowAdvanced} />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Validation Mode</Label>
                  <p className="text-xs text-gray-500">Test training entries automatically</p>
                </div>
                <Switch checked={validationMode} onCheckedChange={setValidationMode} />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div ref={messagesEndRef} />
    </div>
  );
} 