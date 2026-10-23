import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  Mic, 
  MicOff, 
  Sparkles, 
  Search, 
  Zap, 
  FileText, 
  Eye, 
  MessageSquare,
  Wand2,
  TrendingUp,
  Users,
  Clock,
  Target,
  Globe,
  Lightbulb,
  PlayCircle,
  PauseCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';

// Add type declaration for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
import { useToast } from '../../hooks/useToast';
import { AIDriveFile } from '../../services/drive/aiDriveService';

interface SmartSuggestion {
  id: string;
  type: 'action' | 'insight' | 'automation' | 'collaboration';
  title: string;
  description: string;
  confidence: number;
  action?: () => void;
  priority: 'high' | 'medium' | 'low';
}

interface WorkspaceInsight {
  id: string;
  title: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  description: string;
  icon: React.ReactNode;
}

interface GenieDriveSmartInterfaceProps {
  currentFolder: AIDriveFile | null;
  files: AIDriveFile[];
  selectedFiles: AIDriveFile[];
  onFileAction: (action: string, fileId: string) => void;
  onBulkAction: (action: string, fileIds: string[]) => void;
  onAIGenerate: (prompt: string, type: string) => void;
  className?: string;
}

export const GenieDriveSmartInterface: React.FC<GenieDriveSmartInterfaceProps> = ({
  currentFolder,
  files,
  selectedFiles,
  onFileAction,
  onBulkAction,
  onAIGenerate,
  className = ''
}) => {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [voiceCommand, setVoiceCommand] = useState('');
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [workspaceInsights, setWorkspaceInsights] = useState<WorkspaceInsight[]>([]);
  const [activeTab, setActiveTab] = useState('suggestions');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['smart-actions']));
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize voice recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setVoiceCommand(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (voiceCommand.trim()) {
          processVoiceCommand(voiceCommand);
        }
      };
    }
  }, [voiceCommand]);

  // Generate smart suggestions based on current context
  useEffect(() => {
    generateSmartSuggestions();
    generateWorkspaceInsights();
  }, [files, selectedFiles, currentFolder]);

  const toggleVoiceRecognition = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice Recognition Not Supported",
        description: "Your browser doesn't support voice recognition.",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      setVoiceCommand('');
    }
  };

  const processVoiceCommand = async (command: string) => {
    setIsProcessingAI(true);
    try {
      const lowerCommand = command.toLowerCase();
      
      // Smart command processing
      if (lowerCommand.includes('create') && lowerCommand.includes('folder')) {
        const folderName = extractEntityFromCommand(command, 'folder');
        onFileAction('create_folder', folderName || 'New Folder');
        toast({ title: "Created folder", description: `Created "${folderName || 'New Folder'}"` });
      } else if (lowerCommand.includes('search for') || lowerCommand.includes('find')) {
        const searchTerm = extractEntityFromCommand(command, 'search');
        setNaturalLanguageQuery(searchTerm || command);
        await processNaturalLanguageSearch(searchTerm || command);
      } else if (lowerCommand.includes('generate') || lowerCommand.includes('create document')) {
        const documentType = extractDocumentType(command);
        const prompt = extractPromptFromCommand(command);
        onAIGenerate(prompt, documentType);
      } else if (lowerCommand.includes('organize') || lowerCommand.includes('sort')) {
        await organizeWorkspaceIntelligently();
      } else {
        toast({
          title: "Command Processed",
          description: `Processed: "${command}". Check suggestions for actions.`,
        });
      }
    } catch (error) {
      toast({
        title: "Command Failed",
        description: "Failed to process voice command. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingAI(false);
      setVoiceCommand('');
    }
  };

  const processNaturalLanguageSearch = async (query: string) => {
    setIsProcessingAI(true);
    try {
      // AI-powered semantic search
      const searchIntent = await analyzeSearchIntent(query);
      const results = await performSemanticSearch(query, searchIntent);
      
      toast({
        title: "AI Search Complete",
        description: `Found ${results.length} relevant documents`,
      });
      
      // Update suggestions with search results
      const searchSuggestions = results.map((file, index) => ({
        id: `search-result-${index}`,
        type: 'insight' as const,
        title: `${file.name}`,
        description: `${Math.round(file.relevance_score * 100)}% match - ${file.ai_summary || 'No summary available'}`,
        confidence: file.relevance_score,
        priority: file.relevance_score > 0.8 ? 'high' as const : 'medium' as const,
        action: () => onFileAction('open', file.id)
      }));
      
      setSmartSuggestions(prev => [...searchSuggestions, ...prev.filter(s => !s.id.startsWith('search-result'))]);
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "AI search encountered an error. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingAI(false);
    }
  };

  const generateSmartSuggestions = () => {
    const suggestions: SmartSuggestion[] = [];

    // File organization suggestions
    if (files.length > 10) {
      suggestions.push({
        id: 'organize-files',
        type: 'automation',
        title: 'Organize Files Automatically',
        description: `AI can organize ${files.length} files into smart folders by content type and topic`,
        confidence: 0.9,
        priority: 'high',
        action: () => organizeWorkspaceIntelligently()
      });
    }

    // Duplicate detection
    const duplicates = detectPotentialDuplicates(files);
    if (duplicates.length > 0) {
      suggestions.push({
        id: 'merge-duplicates',
        type: 'automation',
        title: 'Merge Duplicate Files',
        description: `Found ${duplicates.length} potential duplicates that could be merged`,
        confidence: 0.8,
        priority: 'medium',
        action: () => mergeDuplicateFiles(duplicates)
      });
    }

    // Content analysis suggestions
    if (selectedFiles.length > 0) {
      suggestions.push({
        id: 'analyze-selected',
        type: 'insight',
        title: 'Analyze Selected Documents',
        description: `Generate comprehensive analysis of ${selectedFiles.length} selected files`,
        confidence: 0.95,
        priority: 'high',
        action: () => analyzeSelectedDocuments()
      });
    }

    // AI document generation suggestions
    if (files.some(f => f.name.includes('contract') || f.name.includes('agreement'))) {
      suggestions.push({
        id: 'generate-contract',
        type: 'action',
        title: 'Generate Similar Contract',
        description: 'Create a new contract based on existing templates in your workspace',
        confidence: 0.85,
        priority: 'medium',
        action: () => onAIGenerate('Generate a contract similar to existing ones', 'contract')
      });
    }

    // Collaboration suggestions
    if (files.length > 5) {
      suggestions.push({
        id: 'create-shared-workspace',
        type: 'collaboration',
        title: 'Create Shared Workspace',
        description: 'Share relevant files with team members based on project context',
        confidence: 0.7,
        priority: 'low',
        action: () => createSharedWorkspace()
      });
    }

    setSmartSuggestions(suggestions);
  };

  const generateWorkspaceInsights = () => {
    const insights: WorkspaceInsight[] = [
      {
        id: 'total-files',
        title: 'Total Files',
        value: files.length.toString(),
        trend: 'up',
        description: 'Files in current workspace',
        icon: <FileText className="h-4 w-4" />
      },
      {
        id: 'ai-processed',
        title: 'AI Processed',
        value: `${files.filter(f => f.ai_summary).length}`,
        trend: 'up',
        description: 'Documents analyzed by AI',
        icon: <Brain className="h-4 w-4" />
      },
      {
        id: 'search-efficiency',
        title: 'Search Ready',
        value: `${Math.round((files.filter(f => f.ai_enabled || f.ai_summary).length / Math.max(files.length, 1)) * 100)}%`,
        trend: 'stable',
        description: 'Files indexed for semantic search',
        icon: <Search className="h-4 w-4" />
      },
      {
        id: 'productivity-score',
        title: 'Productivity',
        value: calculateProductivityScore(),
        trend: 'up',
        description: 'Workspace organization score',
        icon: <TrendingUp className="h-4 w-4" />
      }
    ];

    setWorkspaceInsights(insights);
  };

  // Helper functions
  const extractEntityFromCommand = (command: string, type: string): string | null => {
    const patterns = {
      folder: /create (?:a )?folder (?:called |named )?["']?([^"']+)["']?/i,
      search: /(?:search for|find) ["']?([^"']+)["']?/i
    };
    const match = command.match(patterns[type as keyof typeof patterns]);
    return match ? match[1].trim() : null;
  };

  const extractDocumentType = (command: string): string => {
    if (command.includes('contract')) return 'contract';
    if (command.includes('letter')) return 'letter';
    if (command.includes('memo')) return 'memo';
    if (command.includes('report')) return 'report';
    return 'document';
  };

  const extractPromptFromCommand = (command: string): string => {
    return command.replace(/^(generate|create)\s+/i, '').trim();
  };

  const analyzeSearchIntent = async (query: string): Promise<any> => {
    // Mock AI intent analysis - in real implementation, call AI service
    return {
      intent: 'find_documents',
      entities: [],
      filters: {},
      confidence: 0.9
    };
  };

  const performSemanticSearch = async (query: string, intent: any): Promise<any[]> => {
    // Mock semantic search - integrate with actual vector search service
    return files.filter(f => 
      f.name.toLowerCase().includes(query.toLowerCase()) ||
      f.ai_summary?.toLowerCase().includes(query.toLowerCase())
    ).map(f => ({ ...f, relevance_score: Math.random() * 0.3 + 0.7 }));
  };

  const organizeWorkspaceIntelligently = async () => {
    setIsProcessingAI(true);
    try {
      // AI-powered file organization
      await new Promise(resolve => setTimeout(resolve, 2000)); // Mock processing
      toast({
        title: "Workspace Organized",
        description: "Files have been automatically organized using AI",
      });
    } finally {
      setIsProcessingAI(false);
    }
  };

  const detectPotentialDuplicates = (files: AIDriveFile[]): AIDriveFile[][] => {
    // Simple duplicate detection - in real implementation, use AI similarity
    const duplicates: AIDriveFile[][] = [];
    const seen = new Map<string, AIDriveFile[]>();
    
    files.forEach(file => {
      const baseName = file.name.replace(/\s*\(\d+\)/, '').toLowerCase();
      if (!seen.has(baseName)) {
        seen.set(baseName, []);
      }
      seen.get(baseName)!.push(file);
    });
    
    seen.forEach(group => {
      if (group.length > 1) {
        duplicates.push(group);
      }
    });
    
    return duplicates;
  };

  const mergeDuplicateFiles = (duplicates: AIDriveFile[][]) => {
    toast({
      title: "Merge Duplicates",
      description: `Processing ${duplicates.length} duplicate groups`,
    });
  };

  const analyzeSelectedDocuments = () => {
    toast({
      title: "Analyzing Documents",
      description: `Starting AI analysis of ${selectedFiles.length} documents`,
    });
  };

  const createSharedWorkspace = () => {
    toast({
      title: "Creating Shared Workspace",
      description: "Setting up collaborative workspace with relevant files",
    });
  };

  const calculateProductivityScore = (): string => {
    const organizedFiles = files.filter(f => f.parent_id).length;
    const aiProcessedFiles = files.filter(f => f.ai_summary).length;
    const score = Math.round(((organizedFiles + aiProcessedFiles) / Math.max(files.length * 2, 1)) * 100);
    return `${Math.min(score, 100)}%`;
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'action': return <Zap className="h-4 w-4" />;
      case 'insight': return <Lightbulb className="h-4 w-4" />;
      case 'automation': return <Wand2 className="h-4 w-4" />;
      case 'collaboration': return <Users className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
      case 'medium': return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950';
      case 'low': return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
      default: return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950';
    }
  };

  return (
    <div className={`genie-drive-smart-interface space-y-4 ${className}`}>
      {/* Voice Command Interface */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">AI Assistant</h3>
          </div>
          <Button
            size="sm"
            variant="assistant-primary"
            onClick={toggleVoiceRecognition}
            disabled={isProcessingAI}
            className="flex-1"
          >
            {isListening ? (
              <><MicOff className="h-3 w-3 mr-1" /> Stop</>
            ) : (
              <><Mic className="h-3 w-3 mr-1" /> Voice</>
            )}
          </Button>
        </div>

        {/* Voice Command Display */}
        {(isListening || voiceCommand) && (
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isListening ? 'Listening...' : 'Processing command...'}
              </span>
            </div>
            {voiceCommand && (
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                "{voiceCommand}"
              </div>
            )}
          </div>
        )}

        {/* Natural Language Search */}
        <div className="flex space-x-2">
          <Input
            placeholder="Ask AI anything about your files... (e.g., 'Find all contracts from last month')"
            value={naturalLanguageQuery}
            onChange={(e) => setNaturalLanguageQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && naturalLanguageQuery.trim()) {
                processNaturalLanguageSearch(naturalLanguageQuery);
              }
            }}
            className="flex-1"
          />
          <Button
            size="sm"
            variant="assistant-secondary"
            onClick={() => setNaturalLanguageQuery('')}
            disabled={isProcessingAI}
          >
            <Wand2 className="h-3 w-3" />
          </Button>
        </div>
      </Card>

      {/* Smart Interface Tabs */}
      <Card className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="suggestions">Smart Suggestions</TabsTrigger>
            <TabsTrigger value="insights">Workspace Insights</TabsTrigger>
            <TabsTrigger value="automation">AI Automation</TabsTrigger>
          </TabsList>

          <TabsContent value="suggestions" className="mt-4 space-y-3">
            {smartSuggestions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No suggestions available. Upload files or select items to see AI recommendations.</p>
              </div>
            ) : (
              smartSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${getPriorityColor(suggestion.priority)}`}
                  onClick={suggestion.action}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        {getSuggestionIcon(suggestion.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-sm">{suggestion.title}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(suggestion.confidence * 100)}%
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{suggestion.description}</p>
                      </div>
                    </div>
                    <Badge variant={suggestion.priority === 'high' ? 'destructive' : suggestion.priority === 'medium' ? 'default' : 'secondary'}>
                      {suggestion.priority}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="insights" className="mt-4">
            <div className="grid grid-cols-2 gap-3">
              {workspaceInsights.map((insight) => (
                <div key={insight.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {insight.icon}
                      <span className="text-sm font-medium">{insight.title}</span>
                    </div>
                    <div className={`text-xs ${insight.trend === 'up' ? 'text-green-600' : insight.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                      {insight.trend === 'up' ? '↗' : insight.trend === 'down' ? '↘' : '→'}
                    </div>
                  </div>
                  <div className="text-2xl font-bold mb-1">{insight.value}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{insight.description}</div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="automation" className="mt-4 space-y-3">
            <div className="grid gap-3">
              <Button
                variant="outline"
                className="p-4 h-auto flex items-center justify-start space-x-3"
                onClick={() => onAIGenerate('Create a professional document template', 'template')}
              >
                <FileText className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Generate Document Template</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Create smart templates from existing files</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="p-4 h-auto flex items-center justify-start space-x-3"
                onClick={organizeWorkspaceIntelligently}
                disabled={isProcessingAI}
              >
                <Wand2 className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Auto-Organize Workspace</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Let AI organize your files intelligently</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="p-4 h-auto flex items-center justify-start space-x-3"
                onClick={() => onBulkAction('analyze', selectedFiles.map(f => f.id))}
              >
                <Brain className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Batch AI Analysis</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Analyze multiple documents simultaneously</div>
                </div>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}; 