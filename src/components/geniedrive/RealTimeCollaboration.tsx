import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  MessageCircle, 
  Video, 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff,
  Share2,
  Bell,
  BellOff,
  Edit3,
  Eye,
  Brain,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Crown,
  Shield,
  Globe,
  Lock,
  Sparkles,
  Activity,
  TrendingUp,
  Target,
  FileText,
  Image as ImageIcon,
  Film,
  Headphones,
  Gamepad2,
  Coffee,
  Heart
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Switch } from '../ui/Switch';
import { Slider } from '../ui/Slider';
import { Progress } from '../ui/progress';
import { useToast } from '../../hooks/useToast';
import { AIDriveFile } from '../../services/drive/aiDriveService';

interface CollaboratorStatus {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  currentFile?: string;
  currentAction?: string;
  joinedAt: Date;
  role: 'owner' | 'editor' | 'viewer' | 'commenter';
  isAI?: boolean;
  aiCapabilities?: string[];
}

interface AIAssistantSuggestion {
  id: string;
  type: 'edit' | 'comment' | 'organize' | 'security' | 'performance';
  title: string;
  description: string;
  confidence: number;
  affectedFiles: string[];
  estimatedTime: string;
  action: () => void;
}

interface WorkspaceActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  fileName?: string;
  timestamp: Date;
  type: 'file' | 'comment' | 'share' | 'ai_analysis' | 'security';
}

interface RealTimeCollaborationProps {
  currentFile: AIDriveFile | null;
  workspaceId: string;
  userId: string;
  onCollaborationAction: (action: string, data: any) => void;
  className?: string;
}

export const RealTimeCollaboration: React.FC<RealTimeCollaborationProps> = ({
  currentFile,
  workspaceId,
  userId,
  onCollaborationAction,
  className = ''
}) => {
  const { toast } = useToast();
  
  // Collaboration state
  const [collaborators, setCollaborators] = useState<CollaboratorStatus[]>([]);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [aiAssistantEnabled, setAiAssistantEnabled] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [workspaceActivity, setWorkspaceActivity] = useState<WorkspaceActivity[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AIAssistantSuggestion[]>([]);
  
  // Communication state
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // AI collaboration features
  const [aiCollaborationMode, setAiCollaborationMode] = useState<'observer' | 'assistant' | 'co-editor'>('assistant');
  const [aiPersonality, setAiPersonality] = useState<'professional' | 'creative' | 'analytical' | 'friendly'>('professional');
  
  // Initialize collaboration session
  useEffect(() => {
    initializeCollaboration();
    generateMockCollaborators();
    generateAISuggestions();
    generateWorkspaceActivity();
  }, [workspaceId]);

  const initializeCollaboration = async () => {
    try {
      // Initialize real-time collaboration session
      toast({
        title: "Collaboration Session Started",
        description: "Connected to real-time workspace with AI assistance",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Could not establish collaboration session",
        variant: "destructive"
      });
    }
  };

  const generateMockCollaborators = () => {
    const mockCollaborators: CollaboratorStatus[] = [
      {
        id: 'ai-assistant',
        name: 'GenieAI Assistant',
        email: 'ai@genieflow.ai',
        status: 'online',
        currentAction: 'Analyzing workspace for optimization opportunities',
        joinedAt: new Date(),
        role: 'editor',
        isAI: true,
        aiCapabilities: ['document_analysis', 'smart_suggestions', 'real_time_editing', 'security_monitoring']
      },
      {
        id: 'user-1',
        name: 'Sarah Johnson',
        email: 'sarah@company.com',
        status: 'online',
        currentFile: currentFile?.name,
        currentAction: 'Reviewing document',
        joinedAt: new Date(Date.now() - 300000),
        role: 'editor'
      },
      {
        id: 'user-2', 
        name: 'Mike Chen',
        email: 'mike@company.com',
        status: 'away',
        currentAction: 'In meeting',
        joinedAt: new Date(Date.now() - 900000),
        role: 'viewer'
      }
    ];
    setCollaborators(mockCollaborators);
  };

  const generateAISuggestions = () => {
    const suggestions: AIAssistantSuggestion[] = [
      {
        id: 'ai-suggestion-1',
        type: 'organize',
        title: 'Smart File Organization',
        description: 'I can reorganize 12 files based on content similarity and usage patterns',
        confidence: 0.92,
        affectedFiles: ['contract_v1.pdf', 'contract_v2.pdf', 'meeting_notes.docx'],
        estimatedTime: '2 minutes',
        action: () => toast({ title: "AI Organization", description: "Starting intelligent file organization..." })
      },
      {
        id: 'ai-suggestion-2',
        type: 'security',
        title: 'Security Enhancement',
        description: 'Detected potential security issues in shared file permissions',
        confidence: 0.87,
        affectedFiles: ['confidential_data.xlsx'],
        estimatedTime: '30 seconds',
        action: () => toast({ title: "Security Check", description: "Reviewing file permissions..." })
      },
      {
        id: 'ai-suggestion-3',
        type: 'performance',
        title: 'Workspace Optimization',
        description: 'Archive 8 old files to improve workspace performance by 15%',
        confidence: 0.78,
        affectedFiles: ['old_file_1.pdf', 'old_file_2.docx'],
        estimatedTime: '1 minute',
        action: () => toast({ title: "Performance Boost", description: "Optimizing workspace..." })
      }
    ];
    setAiSuggestions(suggestions);
  };

  const generateWorkspaceActivity = () => {
    const activities: WorkspaceActivity[] = [
      {
        id: 'activity-1',
        userId: 'ai-assistant',
        userName: 'GenieAI Assistant',
        action: 'Analyzed document for key insights',
        fileName: currentFile?.name,
        timestamp: new Date(Date.now() - 120000),
        type: 'ai_analysis'
      },
      {
        id: 'activity-2',
        userId: 'user-1',
        userName: 'Sarah Johnson',
        action: 'Added comment',
        fileName: 'project_proposal.docx',
        timestamp: new Date(Date.now() - 180000),
        type: 'comment'
      },
      {
        id: 'activity-3',
        userId: 'user-2',
        userName: 'Mike Chen',
        action: 'Shared file with external team',
        fileName: 'budget_report.xlsx',
        timestamp: new Date(Date.now() - 300000),
        type: 'share'
      }
    ];
    setWorkspaceActivity(activities);
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    
    const newMessage = {
      id: Date.now().toString(),
      userId,
      message: chatMessage,
      timestamp: new Date(),
      type: 'text'
    };
    
    setChatHistory(prev => [...prev, newMessage]);
    setChatMessage('');
    
    // Simulate AI response
    if (aiAssistantEnabled) {
      setTimeout(() => {
        const aiResponse = {
          id: (Date.now() + 1).toString(),
          userId: 'ai-assistant',
          message: `I understand you want to "${chatMessage}". I can help you with that! Would you like me to analyze the current file or suggest related actions?`,
          timestamp: new Date(),
          type: 'ai_response'
        };
        setChatHistory(prev => [...prev, aiResponse]);
      }, 1000);
    }
  };

  const toggleVoiceRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast({
        title: "Voice Recording Started",
        description: "Speak your message or command to AI assistant"
      });
    } else {
      toast({
        title: "Voice Message Sent",
        description: "AI is processing your voice command"
      });
    }
  };

  const getStatusColor = (status: CollaboratorStatus['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getRoleIcon = (role: CollaboratorStatus['role']) => {
    switch (role) {
      case 'owner': return <Crown className="h-3 w-3 text-yellow-600" />;
      case 'editor': return <Edit3 className="h-3 w-3 text-blue-600" />;
      case 'viewer': return <Eye className="h-3 w-3 text-gray-600" />;
      case 'commenter': return <MessageCircle className="h-3 w-3 text-purple-600" />;
      default: return <User className="h-3 w-3 text-gray-600" />;
    }
  };

  const getActivityIcon = (type: WorkspaceActivity['type']) => {
    switch (type) {
      case 'file': return <FileText className="h-4 w-4 text-blue-600" />;
      case 'comment': return <MessageCircle className="h-4 w-4 text-green-600" />;
      case 'share': return <Share2 className="h-4 w-4 text-purple-600" />;
      case 'ai_analysis': return <Brain className="h-4 w-4 text-indigo-600" />;
      case 'security': return <Shield className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSuggestionIcon = (type: AIAssistantSuggestion['type']) => {
    switch (type) {
      case 'edit': return <Edit3 className="h-4 w-4 text-blue-600" />;
      case 'comment': return <MessageCircle className="h-4 w-4 text-green-600" />;
      case 'organize': return <Target className="h-4 w-4 text-purple-600" />;
      case 'security': return <Shield className="h-4 w-4 text-red-600" />;
      case 'performance': return <TrendingUp className="h-4 w-4 text-orange-600" />;
      default: return <Sparkles className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`real-time-collaboration space-y-4 ${className}`}>
      {/* Collaboration Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg text-white">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Live Collaboration</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {collaborators.filter(c => c.status === 'online').length} online • AI Enhanced
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={isVoiceEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
            >
              {isVoiceEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
            <Button
              variant={isVideoEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setIsVideoEnabled(!isVideoEnabled)}
            >
              {isVideoEnabled ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
            </Button>
            <Button
              variant={notifications ? "default" : "outline"}
              size="sm"
              onClick={() => setNotifications(!notifications)}
            >
              {notifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* AI Collaboration Settings */}
        <div className="space-y-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-sm">AI Collaboration Assistant</span>
            </div>
            <Switch
              checked={aiAssistantEnabled}
              onCheckedChange={setAiAssistantEnabled}
            />
          </div>
          
          {aiAssistantEnabled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>AI Mode:</span>
                <select
                  value={aiCollaborationMode}
                  onChange={(e) => setAiCollaborationMode(e.target.value as any)}
                  className="bg-white dark:bg-gray-800 border rounded px-2 py-1 text-xs"
                >
                  <option value="observer">Observer</option>
                  <option value="assistant">Assistant</option>
                  <option value="co-editor">Co-Editor</option>
                </select>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Personality:</span>
                <select
                  value={aiPersonality}
                  onChange={(e) => setAiPersonality(e.target.value as any)}
                  className="bg-white dark:bg-gray-800 border rounded px-2 py-1 text-xs"
                >
                  <option value="professional">Professional</option>
                  <option value="creative">Creative</option>
                  <option value="analytical">Analytical</option>
                  <option value="friendly">Friendly</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Collaboration Tabs */}
      <Tabs defaultValue="team" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="ai-suggestions">AI</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-3">
          <div className="space-y-2">
            {collaborators.map((collaborator) => (
              <div key={collaborator.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    {collaborator.isAI ? (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                        <Brain className="h-4 w-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium">
                        {collaborator.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(collaborator.status)}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm truncate">{collaborator.name}</span>
                    {getRoleIcon(collaborator.role)}
                    {collaborator.isAI && (
                      <Badge variant="secondary" className="text-xs">AI</Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {collaborator.currentAction || 'Idle'}
                  </div>
                  {collaborator.currentFile && (
                    <div className="text-xs text-blue-600 dark:text-blue-400 truncate">
                      Working on: {collaborator.currentFile}
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-gray-500">
                  {formatRelativeTime(collaborator.joinedAt)}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="chat" className="space-y-3">
          <div className="h-64 overflow-y-auto space-y-2 p-2 border rounded-lg bg-gray-50 dark:bg-gray-800">
            {chatHistory.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Start a conversation with your team</p>
              </div>
            ) : (
              chatHistory.map((message) => (
                <div key={message.id} className={`flex ${message.userId === userId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    message.userId === userId 
                      ? 'bg-blue-600 text-white' 
                      : message.userId === 'ai-assistant'
                      ? 'bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100'
                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}>
                    {message.userId !== userId && (
                      <div className="font-medium text-xs mb-1 opacity-75">
                        {message.userId === 'ai-assistant' ? 'GenieAI' : 'Team Member'}
                      </div>
                    )}
                    <div>{message.message}</div>
                    <div className="text-xs opacity-50 mt-1">
                      {formatRelativeTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="flex space-x-2">
            <Input
              placeholder="Type a message or AI command..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="sm"
              onClick={toggleVoiceRecording}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button onClick={handleSendMessage}>Send</Button>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-2">
          {workspaceActivity.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg">
              <div className="mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1">
                <div className="text-sm">
                  <span className="font-medium">{activity.userName}</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">{activity.action}</span>
                  {activity.fileName && (
                    <span className="text-blue-600 dark:text-blue-400 ml-1">
                      {activity.fileName}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatRelativeTime(activity.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="ai-suggestions" className="space-y-3">
          {aiSuggestions.map((suggestion) => (
            <div key={suggestion.id} className="p-3 border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start space-x-2">
                  <div className="mt-0.5">
                    {getSuggestionIcon(suggestion.type)}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{suggestion.title}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {suggestion.description}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {Math.round(suggestion.confidence * 100)}%
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span>{suggestion.affectedFiles.length} files affected</span>
                <span>~{suggestion.estimatedTime}</span>
              </div>
              
              <Progress value={suggestion.confidence * 100} className="h-1 mb-3" />
              
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={suggestion.action}
                >
                  Apply Suggestion
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}; 