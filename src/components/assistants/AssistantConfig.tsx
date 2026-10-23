import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Label } from '../ui/Label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Switch } from '../ui/Switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Slider } from '../ui/Slider';
import { Progress } from '../ui/progress';
import { 
  Upload, FileText, FolderOpen, Settings, Mic, MicOff, Volume2, VolumeX,
  Brain, Zap, Clock, Calendar, Mail, Phone, MessageSquare, Database,
  Shield, Eye, EyeOff, Trash2, Plus, Download, Share2, RefreshCw,
  AlertCircle, CheckCircle, Users, Target, TrendingUp, Bot, Sparkles,
  Globe, Lock, Unlock, BarChart3, Activity, Timer, Headphones
} from 'lucide-react';
import type { AIAssistant } from '../../types/ai';
import { EnhancedAssistantTraining } from './EnhancedAssistantTraining';
import { TieredAssistantBuilder } from './TieredAssistantBuilder';

interface AssistantConfigProps {
  assistant: AIAssistant;
  onSave: (updates: Partial<AIAssistant>) => void;
}

export function AssistantConfig({ assistant, onSave }: AssistantConfigProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [system_prompt, setSystemPrompt] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  // Knowledge base state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingFiles, setProcessingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Automation settings state
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [emailAutomation, setEmailAutomation] = useState(true);
  const [calendarAutomation, setCalendarAutomation] = useState(true);
  const [taskAutomation, setTaskAutomation] = useState(false);
  const [responseDelay, setResponseDelay] = useState([2]);
  const [confidenceThreshold, setConfidenceThreshold] = useState([85]);
  
  // Voice control state
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceResponseEnabled, setVoiceResponseEnabled] = useState(false);
  const [wakeWord, setWakeWord] = useState('Hey Assistant');
  const [voiceLanguage, setVoiceLanguage] = useState('en-US');
  const [voiceSpeed, setVoiceSpeed] = useState([1]);
  const [voicePitch, setVoicePitch] = useState([1]);
  
  // Privacy & Security state
  const [dataRetention, setDataRetention] = useState('30');
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [shareAnalytics, setShareAnalytics] = useState(false);

  useEffect(() => {
    if (assistant) {
      setName(assistant.name);
      setDescription(assistant.description || '');
      setSystemPrompt(assistant.system_prompt || '');
    }
  }, [assistant]);

  const handleSave = () => {
    const updates: Partial<AIAssistant> = {};
    if (name !== assistant.name) {
      updates.name = name;
    }
    if (description !== (assistant.description || '')) {
      updates.description = description;
    }
    if (system_prompt !== (assistant.system_prompt || '')) {
      updates.system_prompt = system_prompt;
    }

    if (Object.keys(updates).length > 0) {
      onSave(updates);
    }
  };

  // Utility function to resize image before upload
  const resizeImage = (file: File, maxWidth: number = 200, maxHeight: number = 200, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const resizedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(resizedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle avatar upload with resizing
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Please upload an image smaller than 5MB.');
      return;
    }

    setIsUploadingAvatar(true);
    
    try {
      console.log('📷 Resizing avatar image...');
      const resizedImage = await resizeImage(file);
      console.log('✅ Avatar resized, saving...');
      
      await onSave({ avatar: resizedImage });
      console.log('✅ Avatar saved successfully!');
      
      // Clear the input to allow re-uploading the same file
      e.target.value = '';
    } catch (error) {
      console.error('❌ Error uploading avatar:', error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="p-4" data-assistant-id={assistant.id}>
      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Builder
          </TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="prompt">Prompt</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="voice">Voice</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="builder">
          <div className="py-4">
            <TieredAssistantBuilder
              assistant={assistant}
              onSystemPromptGenerated={(prompt) => {
                setSystemPrompt(prompt);
                // Auto-save the generated prompt
                onSave({ system_prompt: prompt });
              }}
              onProfileComplete={(profile) => {
                console.log('Tiered profile completed:', profile);
                // Could save profile data to assistant metadata
              }}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="general">
          <div className="space-y-6 py-4">
            {/* --- GenieFlow Custom: Assistant Avatar Upload/Display --- */}
            <div className="flex items-center gap-4 mb-4 border border-blue-100 rounded-lg p-4 bg-blue-50/40">
              <div className="relative">
                <img
                  src={assistant.avatar || './images/default-avatar.svg'}
                  alt="Assistant Avatar"
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-200 shadow-md"
                  style={{ background: '#e5eaf2' }}
                  onError={(e) => {
                    // Fallback to a simple colored circle with initials if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLDivElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div 
                  className="w-16 h-16 rounded-full border-2 border-blue-200 shadow-md bg-blue-500 text-white font-bold text-lg flex items-center justify-center"
                  style={{ display: 'none' }}
                >
                  {assistant.name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <RefreshCw className="h-4 w-4 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <Label htmlFor="avatar-upload" className="text-sm font-medium">Assistant Avatar</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploadingAvatar}
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                    className="relative"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploadingAvatar ? 'Uploading...' : 'Upload Image'}
                  </Button>
                  {assistant.avatar && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onSave({ avatar: '' })}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <div className="text-xs text-gray-500">
                  <p>Upload a profile image for your assistant (optional)</p>
                  <p>Supported: JPG, PNG • Max size: 5MB • Will be resized to 200x200px</p>
                </div>
              </div>
            </div>
            {/* --- End GenieFlow Custom --- */}
            <div className="space-y-2">
              <Label htmlFor="name">Assistant Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Marketing Guru" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this assistant do?" />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="prompt">
          <div className="space-y-2 py-4">
            <Label htmlFor="system_prompt">System Prompt</Label>
            <Textarea
              id="system_prompt"
              value={system_prompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={16}
              placeholder="Define the assistant's role, personality, and instructions. For example: 'You are a helpful assistant that provides concise answers.'"
            />
          </div>
        </TabsContent>
        <TabsContent value="knowledge">
          <div className="space-y-6 py-4">
            {/* Knowledge Base Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Documents</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {assistant.knowledgeBase?.length || 0}
                      </p>
                    </div>
                    <Database className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Processing</p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-600">Complete</span>
                      </div>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Relevance</p>
                      <p className="text-2xl font-bold text-green-600">94%</p>
                    </div>
                    <Target className="h-8 w-8 text-green-500" />
                  </div>
                  <Progress value={94} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            {/* Upload Zone */}
            <Card 
              className={`border-2 border-dashed transition-colors ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                // Handle file drop
                const files = Array.from(e.dataTransfer.files);
                console.log('Files dropped:', files);
              }}
            >
              <CardContent className="p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Upload Knowledge Documents
                </h3>
                <p className="text-gray-600 mb-4">
                  Drag and drop files here or click to browse
                </p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Browse Files
                  </Button>
                  <Button variant="outline">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Link Folders
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.md"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    console.log('Files selected:', files);
                  }}
                />
              </CardContent>
            </Card>

            {/* Processing Status */}
            {processingFiles && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
                    <div className="flex-1">
                      <p className="font-medium">Processing documents...</p>
                      <Progress value={uploadProgress} className="mt-2" />
                      <p className="text-sm text-gray-600 mt-1">
                        {uploadProgress}% complete
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current Knowledge Base */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Current Knowledge Base
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assistant.knowledgeBase && assistant.knowledgeBase.length > 0 ? (
                  <div className="space-y-2">
                    {assistant.knowledgeBase.map((folder, index) => (
                      <div 
                        key={folder.id || index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FolderOpen className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-medium">{folder.name}</p>
                            <p className="text-sm text-gray-600">
                              {folder.documents?.length || 0} documents
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Active</Badge>
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      No knowledge base configured yet
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Upload documents or link folders to get started
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="automation">
          <div className="space-y-6 py-4">
            {/* Universal Automation Header */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Bot className="h-8 w-8 text-purple-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-purple-900">Universal Agent Automation</h3>
                    <p className="text-purple-700">Build conversational automation for any profession or workflow</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-purple-100 text-purple-800">Conversational Building</Badge>
                  <Badge className="bg-blue-100 text-blue-800">Chain-able Agents</Badge>
                  <Badge className="bg-green-100 text-green-800">Cross-Profession</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Automation Toggle */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="h-6 w-6 text-yellow-500" />
                    <div>
                      <h4 className="font-medium">Master Automation Control</h4>
                      <p className="text-sm text-gray-600">Enable all automation capabilities</p>
                    </div>
                  </div>
                  <Switch 
                    checked={automationEnabled}
                    onCheckedChange={setAutomationEnabled}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Automation Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Communication Automation */}
              <Card className={automationEnabled ? '' : 'opacity-50'}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Mail className="h-5 w-5 text-blue-500" />
                    Communication Automation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Email Processing</span>
                    </div>
                    <Switch 
                      checked={emailAutomation && automationEnabled}
                      onCheckedChange={setEmailAutomation}
                      disabled={!automationEnabled}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Call Management</span>
                    </div>
                    <Switch disabled={!automationEnabled} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Message Routing</span>
                    </div>
                    <Switch disabled={!automationEnabled} />
                  </div>
                </CardContent>
              </Card>

              {/* Schedule & Calendar */}
              <Card className={automationEnabled ? '' : 'opacity-50'}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="h-5 w-5 text-green-500" />
                    Schedule & Calendar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Auto Scheduling</span>
                    </div>
                    <Switch 
                      checked={calendarAutomation && automationEnabled}
                      onCheckedChange={setCalendarAutomation}
                      disabled={!automationEnabled}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Meeting Prep</span>
                    </div>
                    <Switch disabled={!automationEnabled} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Time Blocking</span>
                    </div>
                    <Switch disabled={!automationEnabled} />
                  </div>
                </CardContent>
              </Card>

              {/* Task & Workflow */}
              <Card className={automationEnabled ? '' : 'opacity-50'}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="h-5 w-5 text-orange-500" />
                    Task & Workflow
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Task Creation</span>
                    </div>
                    <Switch 
                      checked={taskAutomation && automationEnabled}
                      onCheckedChange={setTaskAutomation}
                      disabled={!automationEnabled}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Progress Tracking</span>
                    </div>
                    <Switch disabled={!automationEnabled} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Team Coordination</span>
                    </div>
                    <Switch disabled={!automationEnabled} />
                  </div>
                </CardContent>
              </Card>

              {/* Conversational Building */}
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    Conversational Builder
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-purple-700 mb-3">
                    Build automation by talking to your assistant
                  </p>
                  <div className="space-y-2">
                    <div className="text-xs text-purple-600 bg-purple-100 p-2 rounded">
                      "Create an agent that monitors my inbox and schedules follow-ups"
                    </div>
                    <div className="text-xs text-purple-600 bg-purple-100 p-2 rounded">
                      "Build a workflow that processes documents and updates my calendar"
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Start Building
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Automation Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Automation Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-sm font-medium">Response Delay (seconds)</Label>
                  <div className="mt-2 px-3">
                    <Slider
                      value={responseDelay}
                      onValueChange={setResponseDelay}
                      max={10}
                      min={0}
                      step={0.5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Instant</span>
                      <span>{responseDelay[0]}s</span>
                      <span>10s</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Confidence Threshold (%)</Label>
                  <div className="mt-2 px-3">
                    <Slider
                      value={confidenceThreshold}
                      onValueChange={setConfidenceThreshold}
                      max={100}
                      min={50}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>50%</span>
                      <span>{confidenceThreshold[0]}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Higher values require more certainty before taking automated actions
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="voice">
          <div className="space-y-6 py-4">
            {/* Voice Control Header */}
            <Card className="bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Headphones className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">Voice Control & Natural Language</h3>
                    <p className="text-green-700">Hands-free interaction and conversational command execution</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-green-100 text-green-800">Always Listening</Badge>
                  <Badge className="bg-teal-100 text-teal-800">Natural Commands</Badge>
                  <Badge className="bg-blue-100 text-blue-800">Multi-Language</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Voice Activation */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Mic className="h-6 w-6 text-blue-500" />
                    <div>
                      <h4 className="font-medium">Voice Activation</h4>
                      <p className="text-sm text-gray-600">Enable hands-free voice control</p>
                    </div>
                  </div>
                  <Switch 
                    checked={voiceEnabled}
                    onCheckedChange={setVoiceEnabled}
                  />
                </div>

                {voiceEnabled && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <Label className="text-sm font-medium">Wake Word</Label>
                      <Input
                        value={wakeWord}
                        onChange={(e) => setWakeWord(e.target.value)}
                        placeholder="Hey Assistant"
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        Say this phrase to activate voice commands
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Voice Language</Label>
                      <Select value={voiceLanguage} onValueChange={setVoiceLanguage}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en-US">English (US)</SelectItem>
                          <SelectItem value="en-GB">English (UK)</SelectItem>
                          <SelectItem value="es-ES">Spanish</SelectItem>
                          <SelectItem value="fr-FR">French</SelectItem>
                          <SelectItem value="de-DE">German</SelectItem>
                          <SelectItem value="it-IT">Italian</SelectItem>
                          <SelectItem value="pt-BR">Portuguese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Voice Response */}
            <Card className={voiceEnabled ? '' : 'opacity-50'}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Volume2 className="h-6 w-6 text-green-500" />
                    <div>
                      <h4 className="font-medium">Voice Response</h4>
                      <p className="text-sm text-gray-600">Assistant speaks responses aloud</p>
                    </div>
                  </div>
                  <Switch 
                    checked={voiceResponseEnabled && voiceEnabled}
                    onCheckedChange={setVoiceResponseEnabled}
                    disabled={!voiceEnabled}
                  />
                </div>

                {voiceResponseEnabled && voiceEnabled && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <Label className="text-sm font-medium">Speech Speed</Label>
                      <div className="mt-2 px-3">
                        <Slider
                          value={voiceSpeed}
                          onValueChange={setVoiceSpeed}
                          max={2}
                          min={0.5}
                          step={0.1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0.5x</span>
                          <span>{voiceSpeed[0]}x</span>
                          <span>2x</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Voice Pitch</Label>
                      <div className="mt-2 px-3">
                        <Slider
                          value={voicePitch}
                          onValueChange={setVoicePitch}
                          max={2}
                          min={0.5}
                          step={0.1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Low</span>
                          <span>Normal</span>
                          <span>High</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Natural Language Commands */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Natural Language Commands
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Example voice commands you can use with {assistant.name}:
                </p>
                <div className="space-y-2">
                  <div className="text-sm bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                    <div className="font-medium text-blue-900">"Schedule a meeting with John for tomorrow at 2 PM"</div>
                    <div className="text-blue-700 text-xs mt-1">→ Creates calendar event and sends invitation</div>
                  </div>
                  <div className="text-sm bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                    <div className="font-medium text-green-900">"Process all unread emails and draft responses"</div>
                    <div className="text-green-700 text-xs mt-1">→ Analyzes emails and prepares draft replies</div>
                  </div>
                  <div className="text-sm bg-purple-50 p-3 rounded-lg border-l-4 border-purple-400">
                    <div className="font-medium text-purple-900">"Build me an agent that handles client inquiries"</div>
                    <div className="text-purple-700 text-xs mt-1">→ Creates specialized agent with appropriate capabilities</div>
                  </div>
                  <div className="text-sm bg-orange-50 p-3 rounded-lg border-l-4 border-orange-400">
                    <div className="font-medium text-orange-900">"Show me today's priority tasks and update status"</div>
                    <div className="text-orange-700 text-xs mt-1">→ Displays task list and allows voice status updates</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy & Security for Voice */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Voice Privacy & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Local Processing</span>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">End-to-End Encryption</span>
                  </div>
                  <Switch 
                    checked={encryptionEnabled}
                    onCheckedChange={setEncryptionEnabled}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Auto-Delete Voice Data</span>
                  </div>
                  <Select value={dataRetention} onValueChange={setDataRetention}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Immediately</SelectItem>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            </div>
        </TabsContent>
        <TabsContent value="history">
          <div className="space-y-6 py-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-500" />
                  Version History & Rollbacks
                </CardTitle>
                <p className="text-sm text-gray-500">
                  Every time you modify the assistant's name, description, prompt, or capabilities, a backup snapshot is automatically saved. Revert to a previous snapshot if you don't like the new changes.
                </p>
              </CardHeader>
              <CardContent>
                {assistant.metadata?.snapshots && (assistant.metadata.snapshots as any[]).length > 0 ? (
                  <div className="space-y-4">
                    {(assistant.metadata.snapshots as any[]).map((snapshot) => (
                      <div 
                        key={snapshot.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-200 dark:border-gray-700/50 gap-4"
                      >
                        <div className="flex-1 space-y-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{snapshot.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {new Date(snapshot.timestamp).toLocaleString()}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {snapshot.description || 'No description provided'}
                          </p>
                          <p className="text-xs text-purple-600 dark:text-purple-400 italic">
                            Reason: {snapshot.changeDescription}
                          </p>
                          {snapshot.system_prompt && (
                            <details className="text-xs text-gray-500 mt-2">
                              <summary className="cursor-pointer hover:underline text-blue-500">View System Prompt Snapshot</summary>
                              <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded overflow-x-auto max-h-40 whitespace-pre-wrap">
                                {snapshot.system_prompt}
                              </pre>
                            </details>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={async () => {
                              try {
                                if (window.confirm(`Are you sure you want to revert to the version from ${new Date(snapshot.timestamp).toLocaleString()}?`)) {
                                  const { revertToSnapshot } = useAssistantStore.getState();
                                  await revertToSnapshot(assistant.id, snapshot.id);
                                  alert('Successfully reverted assistant configuration!');
                                  window.location.reload();
                                }
                              } catch (err: any) {
                                alert(`Failed to revert: ${err.message}`);
                              }
                            }}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Revert to This Version
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      No configuration snapshots available yet.
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Snapshots will appear here automatically when you update key settings.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      <div className="flex justify-end mt-4">
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
}