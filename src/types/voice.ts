/**
 * Voice Assistant Types
 * Types for the "AI in your ear" voice assistant feature
 */

// Original voice types
export interface VoiceCommand {
  action: string;
  parameters: Record<string, unknown>;
  confidence: number;
}

export interface UserPreferences {
  voiceType: string;
  speechRate: number;
  pitch: number;
  volume: number;
  language: string;
}

export interface PersonalityProfile {
  name: string;
  traits: {
    formality: number;
    empathy: number;
    humor: number;
  };
  preferences: UserPreferences;
}

// Task assistance types
export interface TaskAssistantCapabilities {
  canDetectTasks: boolean;
  canGenerateQuestions: boolean;
  canProposeSolutions: boolean;
  canCoordinateSwarm: boolean;
  maxSwarmSize: number;
  availablePersonalityModes: Array<'analytical' | 'creative' | 'executive' | 'supportive'>;
}

export interface DetectedTask {
  id: string;
  name: string;
  description?: string;
  priority: number;
  confidence: number;
  detectedAt: Date;
  source: 'voice' | 'calendar' | 'email' | 'manual' | 'inference';
  status: 'detected' | 'clarifying' | 'planning' | 'in_progress' | 'delegated' | 'completed';
  components?: TaskComponent[];
  deadline?: Date;
}

export interface TaskComponent {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedAssistantId?: string;
  startedAt?: Date;
  completedAt?: Date;
  result?: Record<string, any>;
}

export interface ClarifyingQuestion {
  id: string;
  taskId: string;
  question: string;
  purpose: 'clarification' | 'information_gathering' | 'confirmation' | 'preference';
  priority: number;
  askedAt: Date;
  answeredAt?: Date;
  answer?: string;
  wasHelpful?: boolean;
}

export interface ProposedSolution {
  id: string;
  taskId: string;
  name: string;
  description: string;
  approach: string;
  estimatedTimeMinutes?: number;
  status: 'proposed' | 'accepted' | 'rejected' | 'in_progress' | 'completed';
  acceptedAt?: Date;
  completedAt?: Date;
  resultSummary?: string;
  feedbackScore?: number;
}

// Swarm coordination types
export interface AssistantSwarm {
  id: string;
  taskId: string;
  orchestratorAssistantId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'active' | 'completed' | 'failed';
  swarmSize: number;
  coordinationPlan: {
    components: string[];
    assignmentStrategy: 'parallel' | 'sequential' | 'hybrid';
    expectedDuration: number; // minutes
  };
  summaryReport?: string;
}

export interface SwarmAssistant {
  id: string;
  name: string;
  role: string;
  specialty: string;
  status: 'assigned' | 'working' | 'completed' | 'failed';
  taskComponentId?: string;
}

export interface SwarmContribution {
  id: string;
  swarmId: string;
  assistantId: string;
  contributionType: string;
  content: Record<string, any>;
  startedAt: Date;
  completedAt?: Date;
  status: 'in_progress' | 'completed' | 'failed';
  qualityScore?: number;
}

// Enhanced "AI in your ear" types

// Voice session types
export interface VoiceSession {
  id: string;
  userId: string;
  assistantId: string;
  startTime: Date;
  endTime?: Date;
  sessionStatus: VoiceSessionStatus;
  deviceInfo?: DeviceInfo;
  lastActivity: Date;
  contextState?: Record<string, any>;
  sessionMetadata?: Record<string, any>;
  currentContext?: VoiceContextType;
  listeningMode?: ListeningMode;
  backgroundNoiseLevel?: number;
  locationContext?: LocationContext;
  isContinuous: boolean;
  wakeWordUsed?: string;
}

export type VoiceSessionStatus = 
  | 'active'
  | 'paused'
  | 'completed'
  | 'user_terminated'
  | 'error'
  | 'ended_timeout'
  | 'ended_user_request'
  | 'ended_system';

export interface DeviceInfo {
  deviceType?: 'mobile' | 'desktop' | 'tablet' | 'wearable' | 'headset';
  userAgent?: string;
  hasMicrophone?: boolean;
  hasAudioOutput?: boolean;
  isLowPower?: boolean;
  deviceName?: string;
  deviceModel?: string;
}

export type VoiceContextType = 
  | 'working'
  | 'meeting'
  | 'driving'
  | 'leisure'
  | 'emergency'
  | string;

export type ListeningMode = 
  | 'focused'
  | 'background'
  | 'do-not-disturb'
  | 'ambient'
  | string;

// Voice transcription types
export interface VoiceTranscription {
  id: string;
  sessionId: string;
  timestamp: Date;
  audioUrl?: string;
  transcription: string;
  confidence: number;
  detectedIntent?: string;
  isProcessed: boolean;
  processingMetadata?: {
    backgroundNoiseLevel?: number;
    shouldProcess?: boolean;
    wakeWordDetected?: string;
    listeningMode?: ListeningMode;
  };
}

// Voice response types
export interface VoiceResponse {
  id: string;
  sessionId: string;
  requestId?: string;
  timestamp: Date;
  responseText: string;
  audioUrl?: string;
  durationMs?: number;
  deliveryStatus: 'pending' | 'delivered' | 'failed';
  deliveryTimestamp?: Date;
  voiceSettings?: VoiceSettings;
}

export interface VoiceSettings {
  voice?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
  emphasis?: 'normal' | 'strong' | 'moderate' | 'reduced';
  style?: 'formal' | 'casual' | 'friendly' | 'professional';
}

// Context types
export interface LocationContext {
  locationType?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  room?: string;
  building?: string;
  lastUpdated?: Date;
}

export interface AmbientContext {
  id: string;
  userId: string;
  sessionId?: string;
  timestamp: Date;
  contextType: 'location' | 'noise' | 'activity' | 'proximity' | 'calendar' | 'weather';
  contextData: Record<string, any>;
  confidence: number;
  source: string;
  isActive: boolean;
  expiresAt?: Date;
}

// Session event types
export interface VoiceSessionEvent {
  id: string;
  sessionId: string;
  timestamp: Date;
  eventType: 'context_switch' | 'interruption' | 'background_noise' | 'activity_change' | 'session_start';
  previousState?: Record<string, any>;
  newState?: Record<string, any>;
  confidence: number;
  triggerSource: string;
  metadata?: Record<string, any>;
}

// Client utility types
export interface VoiceAssistantClientOptions {
  defaultAssistantId?: string;
  defaultListeningMode?: ListeningMode;
  defaultContext?: VoiceContextType;
  wakeWordSensitivity?: number;
  ambientContextInterval?: number;
  noiseThreshold?: number;
  useTextToSpeech?: boolean;
  useSpeechRecognition?: boolean;
}

// Hook types
export interface UseVoiceAssistantOptions extends VoiceAssistantClientOptions {
  onSessionStart?: (session: VoiceSession) => void;
  onSessionEnd?: (session: VoiceSession) => void;
  onTranscription?: (transcription: VoiceTranscription) => void;
  onResponse?: (response: VoiceResponse) => void;
  onError?: (error: Error) => void;
}

export interface UseVoiceAssistantReturn {
  isInitialized: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  processingState: 'idle' | 'initializing' | 'ready' | 'listening' | 'processing' | 'error';
  error: string | null;
  session: VoiceSession | null;
  transcript: string;
  lastResponse: VoiceResponse | null;
  currentContext: VoiceContextType;
  listeningMode: ListeningMode;
  
  initializeSession: (assistantId?: string) => Promise<VoiceSession | null>;
  startListening: () => Promise<boolean>;
  stopListening: () => void;
  toggleListening: () => void;
  endSession: () => Promise<void>;
  changeContext: (newContext: VoiceContextType) => Promise<boolean>;
  changeListeningMode: (newMode: ListeningMode) => void;
  speakResponse: (text: string, voiceSettings?: VoiceSettings) => void;
  sendTextInput: (text: string) => Promise<VoiceResponse | null>;
}

// Assistant capability types
export interface VoiceCapabilityConfig {
  enabled: boolean;
  listeningModes: ListeningMode[];
  defaultListeningMode: ListeningMode;
  supportedContexts: VoiceContextType[];
  defaultContext: VoiceContextType;
  wakeWords: string[];
  customVoiceSettings?: VoiceSettings;
  privacySettings?: {
    saveConversations: boolean;
    useAmbientContext: boolean;
    useLocationData: boolean;
    retentionPeriodDays: number;
  };
}