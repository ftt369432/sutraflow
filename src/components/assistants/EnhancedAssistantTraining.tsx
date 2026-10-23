import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import {
  Brain,
  BookOpen,
  MessageSquare,
  Target,
  TrendingUp,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Zap,
  BarChart3,
  Settings,
  Upload,
  Download,
  Save,
  X,
  Plus,
  Edit,
  Trash2,
  Clock,
  User,
  Bot
} from 'lucide-react';
import { AIAssistant } from '../../types/ai';

interface TrainingSession {
  id: string;
  type: 'interactive' | 'batch' | 'validation' | 'conversation';
  name: string;
  status: 'active' | 'paused' | 'completed' | 'failed';
  progress: number;
  accuracy: number;
  startTime: Date;
  estimatedCompletion?: Date;
  entries: number;
  errors: number;
}

interface TrainingEntry {
  id: string;
  type: 'knowledge' | 'correction' | 'example' | 'feedback';
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  confidence: number;
  timestamp: Date;
  validated: boolean;
  category: string;
}

interface ConversationTraining {
  id: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    quality?: 'good' | 'needs_improvement' | 'excellent';
    feedback?: string;
  }>;
  extractedInsights: string[];
  improvementAreas: string[];
}

interface Props {
  assistant: AIAssistant;
  onUpdate?: (updates: Partial<AIAssistant>) => void;
}

export const EnhancedAssistantTraining: React.FC<Props> = ({ assistant, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'entries' | 'conversations' | 'analytics'>('sessions');
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [trainingEntries, setTrainingEntries] = useState<TrainingEntry[]>([]);
  const [conversations, setConversations] = useState<ConversationTraining[]>([]);
  const [newEntry, setNewEntry] = useState<Partial<TrainingEntry>>({});
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  // Initialize mock data
  useEffect(() => {
    // Mock training sessions
    setTrainingSessions([
      {
        id: '1',
        type: 'interactive',
        name: 'Legal Knowledge Enhancement',
        status: 'active',
        progress: 67,
        accuracy: 88.5,
        startTime: new Date(Date.now() - 3600000),
        estimatedCompletion: new Date(Date.now() + 1800000),
        entries: 45,
        errors: 3
      },
      {
        id: '2',
        type: 'batch',
        name: 'Case Law Analysis Training',
        status: 'completed',
        progress: 100,
        accuracy: 94.2,
        startTime: new Date(Date.now() - 86400000),
        entries: 120,
        errors: 7
      },
      {
        id: '3',
        type: 'validation',
        name: 'Response Quality Check',
        status: 'paused',
        progress: 23,
        accuracy: 91.8,
        startTime: new Date(Date.now() - 7200000),
        entries: 18,
        errors: 1
      }
    ]);

    // Mock training entries
    setTrainingEntries([
      {
        id: '1',
        type: 'knowledge',
        input: 'What is the statute of limitations for personal injury in California?',
        expectedOutput: 'In California, the statute of limitations for personal injury claims is generally two years from the date of injury under California Code of Civil Procedure Section 335.1.',
        actualOutput: 'California has a 2-year statute of limitations for personal injury cases.',
        confidence: 0.92,
        timestamp: new Date(Date.now() - 3600000),
        validated: true,
        category: 'Legal Knowledge'
      },
      {
        id: '2',
        type: 'correction',
        input: 'Explain contract breach remedies',
        expectedOutput: 'Contract breach remedies include compensatory damages, consequential damages, punitive damages (in rare cases), specific performance, and restitution.',
        actualOutput: 'When a contract is breached, remedies include damages and specific performance.',
        confidence: 0.74,
        timestamp: new Date(Date.now() - 1800000),
        validated: false,
        category: 'Contract Law'
      }
    ]);

    // Mock conversations
    setConversations([
      {
        id: '1',
        messages: [
          {
            role: 'user',
            content: 'I need help with a landlord-tenant dispute. My landlord is trying to evict me without proper notice.',
            timestamp: new Date(Date.now() - 7200000)
          },
          {
            role: 'assistant',
            content: 'I can help you understand landlord-tenant law. In most jurisdictions, landlords must provide proper written notice before beginning eviction proceedings. The notice period varies by state and reason for eviction. Can you tell me what state you\'re in and what reason your landlord gave for the eviction?',
            timestamp: new Date(Date.now() - 7180000),
            quality: 'good'
          }
        ],
        extractedInsights: [
          'User needs immediate legal guidance',
          'Question involves landlord-tenant law',
          'Proper jurisdiction identification needed'
        ],
        improvementAreas: [
          'Could provide more specific state law information',
          'Should mention tenant rights organizations'
        ]
      }
    ]);
  }, []);

  const handleCreateSession = (type: TrainingSession['type']) => {
    const newSession: TrainingSession = {
      id: Date.now().toString(),
      type,
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Training`,
      status: 'active',
      progress: 0,
      accuracy: 0,
      startTime: new Date(),
      entries: 0,
      errors: 0
    };
    setTrainingSessions(prev => [newSession, ...prev]);
    setSelectedSession(newSession.id);
  };

  const handleToggleSession = (sessionId: string) => {
    setTrainingSessions(prev => prev.map(session => 
      session.id === sessionId
        ? { ...session, status: session.status === 'active' ? 'paused' : 'active' }
        : session
    ));
  };

  const handleAddTrainingEntry = () => {
    if (!newEntry.input || !newEntry.expectedOutput) return;
    
    const entry: TrainingEntry = {
      id: Date.now().toString(),
      type: newEntry.type || 'knowledge',
      input: newEntry.input,
      expectedOutput: newEntry.expectedOutput,
      confidence: 0,
      timestamp: new Date(),
      validated: false,
      category: newEntry.category || 'General'
    };
    
    setTrainingEntries(prev => [entry, ...prev]);
    setNewEntry({});
    setShowNewEntryForm(false);
  };

  const renderSessionsTab = () => (
    <div className="space-y-6">
      {/* Session Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Training Sessions</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCreateSession('interactive')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Interactive
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCreateSession('batch')}
          >
            <Upload className="w-4 h-4 mr-2" />
            Batch
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCreateSession('validation')}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Validation
          </Button>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="grid gap-4">
        {trainingSessions.map((session) => (
          <div
            key={session.id}
            className={`p-4 rounded-lg border ${
              selectedSession === session.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            } cursor-pointer`}
            onClick={() => setSelectedSession(session.id)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  session.status === 'active' ? 'bg-green-500 animate-pulse' :
                  session.status === 'paused' ? 'bg-yellow-500' :
                  session.status === 'completed' ? 'bg-blue-500' : 'bg-red-500'
                }`} />
                <h4 className="font-medium text-gray-900 dark:text-white">{session.name}</h4>
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full capitalize">
                  {session.type}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleSession(session.id);
                  }}
                >
                  {session.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Progress</p>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${session.progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {session.progress}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Accuracy</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{session.accuracy}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Entries</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{session.entries}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Errors</p>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">{session.errors}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Started {session.startTime.toLocaleString()}</span>
              {session.estimatedCompletion && session.status === 'active' && (
                <span>Est. completion {session.estimatedCompletion.toLocaleString()}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEntriesTab = () => (
    <div className="space-y-6">
      {/* Entry Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Training Entries</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewEntryForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Entry
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* New Entry Form */}
      {showNewEntryForm && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  value={newEntry.type || 'knowledge'}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, type: e.target.value as TrainingEntry['type'] }))}
                >
                  <option value="knowledge">Knowledge</option>
                  <option value="correction">Correction</option>
                  <option value="example">Example</option>
                  <option value="feedback">Feedback</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  placeholder="e.g., Legal Knowledge, Contract Law"
                  value={newEntry.category || ''}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, category: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Input/Question
              </label>
              <textarea
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                rows={3}
                placeholder="Enter the input or question..."
                value={newEntry.input || ''}
                onChange={(e) => setNewEntry(prev => ({ ...prev, input: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expected Output/Answer
              </label>
              <textarea
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                rows={4}
                placeholder="Enter the expected output or correct answer..."
                value={newEntry.expectedOutput || ''}
                onChange={(e) => setNewEntry(prev => ({ ...prev, expectedOutput: e.target.value }))}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewEntryForm(false);
                  setNewEntry({});
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddTrainingEntry}>
                <Save className="w-4 h-4 mr-2" />
                Save Entry
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Training Entries List */}
      <div className="space-y-3">
        {trainingEntries.map((entry) => (
          <div
            key={entry.id}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  entry.type === 'knowledge' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  entry.type === 'correction' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                  entry.type === 'example' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                }`}>
                  {entry.type}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{entry.category}</span>
                {entry.validated && <CheckCircle className="w-4 h-4 text-green-500" />}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {(entry.confidence * 100).toFixed(1)}%
                </span>
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Input:</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{entry.input}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Output:</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{entry.expectedOutput}</p>
              </div>
              
              {entry.actualOutput && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Actual Output:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{entry.actualOutput}</p>
                </div>
              )}
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {entry.timestamp.toLocaleString()}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Test
                </Button>
                <Button variant="outline" size="sm">
                  Validate
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderConversationsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Conversation Analysis</h3>
      
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="space-y-4">
            {conversation.messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    <span className="text-sm opacity-75">
                      {message.role === 'user' ? 'User' : assistant.name}
                    </span>
                    {message.quality && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        message.quality === 'excellent' ? 'bg-green-100 text-green-800' :
                        message.quality === 'good' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {message.quality}
                      </span>
                    )}
                  </div>
                  <p className="text-sm">{message.content}</p>
                  {message.feedback && (
                    <p className="text-xs mt-2 opacity-75">{message.feedback}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Extracted Insights</h4>
              <ul className="space-y-1">
                {conversation.extractedInsights.map((insight, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Improvement Areas</h4>
              <ul className="space-y-1">
                {conversation.improvementAreas.map((area, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <AlertCircle className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Training Analytics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Sessions</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{trainingSessions.length}</p>
            </div>
            <Brain className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 dark:text-green-400 text-sm font-medium">Avg Accuracy</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {(trainingSessions.reduce((acc, s) => acc + s.accuracy, 0) / trainingSessions.length).toFixed(1)}%
              </p>
            </div>
            <Target className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Training Entries</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{trainingEntries.length}</p>
            </div>
            <BookOpen className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">Active Sessions</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {trainingSessions.filter(s => s.status === 'active').length}
              </p>
            </div>
            <Zap className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>
      
      {/* Progress Chart Placeholder */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Training Progress Over Time</h4>
        <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">Training analytics chart coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-3">
        {[
          { id: 'sessions', label: 'Sessions', icon: Brain },
          { id: 'entries', label: 'Entries', icon: BookOpen },
          { id: 'conversations', label: 'Conversations', icon: MessageSquare },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md mr-2 transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'sessions' && renderSessionsTab()}
        {activeTab === 'entries' && renderEntriesTab()}
        {activeTab === 'conversations' && renderConversationsTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </div>
    </div>
  );
}; 