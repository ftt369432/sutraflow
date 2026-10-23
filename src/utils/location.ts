/**
 * Location utilities for the voice assistant
 * Provides functionality to get user's location context
 */

import { LocationContext } from '../types/voice';

// Task context interfaces
export interface TaskContext {
  currentTask?: {
    id: string;
    name: string;
    priority: number;
    deadline?: Date;
    status: string;
    teamMembers?: string[];
  };
  recentTasks?: Array<{
    id: string;
    name: string;
    completedAt: Date;
  }>;
  upcomingTasks?: Array<{
    id: string;
    name: string;
    deadline: Date;
    priority: number;
  }>;
  focusMode?: boolean;
  taskSource?: 'calendar' | 'task_manager' | 'email' | 'meeting' | 'manual';
}

// Combined context for richer awareness
export interface EnhancedLocationContext extends LocationContext {
  taskContext?: TaskContext;
  deviceActivity?: {
    activeApps?: string[];
    meetingStatus?: 'in_meeting' | 'preparing' | 'post_meeting' | 'none';
    screenTime?: number; // minutes
    focusScore?: number; // 0-100
    interruptions?: number;
  };
  timeContext?: {
    localTime: Date;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    isWorkHours: boolean;
    isWeekend: boolean;
    timezone: string;
  };
}

// Task assistance interfaces
export interface TaskAssistance {
  detectedTask?: {
    id: string;
    name: string;
    description: string;
    confidence: number;
    detectedAt: Date;
    source: 'voice' | 'calendar' | 'email' | 'manual' | 'inference';
  };
  clarifyingQuestions?: Array<{
    id: string;
    question: string;
    purpose: 'clarification' | 'information_gathering' | 'confirmation' | 'preference';
    priority: number;
    answer?: string;
  }>;
  proposedSolutions?: Array<{
    id: string;
    name: string;
    description: string;
    approach: string;
    estimatedTime?: number; // in minutes
    status: 'proposed' | 'accepted' | 'rejected' | 'in_progress' | 'completed';
  }>;
}

// Swarm coordination interfaces
export interface SwarmCoordination {
  swarmId?: string;
  orchestratorAssistant?: {
    id: string;
    name: string;
    specialty: string;
  };
  activeAssistants?: Array<{
    id: string;
    name: string;
    role: string;
    status: 'assigned' | 'working' | 'completed' | 'failed';
    taskComponent?: string;
  }>;
  coordinationPlan?: {
    components: string[];
    assignmentStrategy: 'parallel' | 'sequential' | 'hybrid';
    expectedDuration: number; // minutes
  };
  progressStatus?: number; // 0-100%
  summaryReport?: string;
}

// Complete context with task assistance and swarm coordination
export interface CompleteContext extends EnhancedLocationContext {
  taskAssistance?: TaskAssistance;
  swarmCoordination?: SwarmCoordination;
  personalityMode?: 'analytical' | 'creative' | 'executive' | 'supportive';
  voiceTrigger?: VoiceTrigger;
}

// Voice trigger settings for assistant activation
export interface VoiceTrigger {
  enabled: boolean;
  primaryTrigger: string;
  alternativeTriggers?: string[];
  sensitivity: number; // 0-100, higher means more sensitive detection
  requireConfirmation: boolean;
  lastDetectedAt?: Date;
  customResponseToTrigger?: string;
  assistantId: string; // ID of the specific assistant this trigger activates
  assistantType: string; // Type of assistant (e.g., 'general', 'research', 'creative', etc.)
  assistantName?: string; // Display name for the assistant
  icon?: string; // Icon identifier for the assistant
  triggerColor?: string; // Color theme for the assistant (for UI highlighting)
  activationSound?: string; // Sound to play when assistant is activated
  isFavorite?: boolean; // Whether this assistant is marked as a favorite
  createdAt?: Date; // When this trigger was first created
  updatedAt?: Date; // When this trigger was last updated
  usageCount?: number; // How many times this assistant has been triggered
}

/**
 * Get the user's current location if available
 * @returns {Promise<LocationContext|null>} Location context object or null if unavailable
 */
export async function getUserLocation(): Promise<LocationContext | null> {
  // Check if geolocation is available
  if (!navigator.geolocation) {
    console.warn('Geolocation is not supported by this browser');
    return null;
  }

  try {
    // Request current position
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 60000 // 1 minute
      });
    });

    // Create location context object
    const locationContext: LocationContext = {
      locationType: 'gps',
      coordinates: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      },
      lastUpdated: new Date()
    };

    // If available, try to enhance with reverse geocoding
    try {
      const enhancedLocation = await enhanceWithReverseGeocoding(locationContext);
      return enhancedLocation;
    } catch (error) {
      // Return basic location if geocoding fails
      console.warn('Failed to enhance location with geocoding:', error);
      return locationContext;
    }
  } catch (error) {
    console.warn('Error getting user location:', error);
    return null;
  }
}

/**
 * Enhance location with reverse geocoding
 * @param {LocationContext} locationContext - Basic location with coordinates
 * @returns {Promise<LocationContext>} - Enhanced location with address etc.
 */
async function enhanceWithReverseGeocoding(locationContext: LocationContext): Promise<LocationContext> {
  if (!locationContext.coordinates) {
    return locationContext;
  }

  // This would normally use a geocoding service API
  // For this demo, we'll simulate a response
  
  // Simulate an API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // For demo purposes, generate fictional address based on coordinates
  // In a real application, this would call a geocoding service API
  const { latitude, longitude } = locationContext.coordinates;
  
  // Create some location variety based on coordinates
  const isWorkArea = latitude > 0 && longitude > 0;
  const isHome = latitude < 0 && longitude < 0;
  const isCoffeeShop = latitude > 0 && longitude < 0;
  const isOutdoors = latitude < 0 && longitude > 0;
  
  // Enhance the location context
  const enhanced: LocationContext = {
    ...locationContext,
    locationType: isWorkArea ? 'work' : 
                  isHome ? 'home' : 
                  isCoffeeShop ? 'coffee_shop' : 
                  isOutdoors ? 'outdoors' : 'unknown'
  };
  
  // Add fictional address data
  if (isWorkArea) {
    enhanced.address = '123 Business Center';
    enhanced.building = 'Office Tower';
    enhanced.room = 'Conference Room A';
  } else if (isHome) {
    enhanced.address = '456 Residential Lane';
    enhanced.building = 'Home';
    enhanced.room = 'Living Room';
  } else if (isCoffeeShop) {
    enhanced.address = '789 Main Street';
    enhanced.building = 'Corner Coffee';
  } else if (isOutdoors) {
    enhanced.address = 'Central Park';
  }
  
  return enhanced;
}

/**
 * Get location type from device context
 * Uses various signals to determine where the user likely is
 */
export async function inferLocationFromContext(): Promise<string | null> {
  const hour = new Date().getHours();
  const day = new Date().getDay(); // 0 is Sunday, 6 is Saturday
  
  // Check if connected to a known WiFi
  const isKnownWifi = await checkKnownWifiNetworks();
  
  // Time-based location inference
  if (isKnownWifi === 'work') {
    return 'work';
  } else if (isKnownWifi === 'home') {
    return 'home';
  }
  
  // Basic time-based inference as fallback
  if (day >= 1 && day <= 5) { // Weekday
    if (hour >= 9 && hour < 17) {
      return 'work';
    }
  }
  
  if (hour >= 21 || hour < 7) {
    return 'home';
  }
  
  return null; // Cannot determine
}

/**
 * Simulate checking known WiFi networks
 * In a real app, this might use NetworkInformation API or similar
 */
async function checkKnownWifiNetworks(): Promise<string | null> {
  // This is a placeholder that would normally use actual device APIs
  // to determine if the device is connected to a known network
  
  // For demo purposes, return null (unknown)
  return null;
}

/**
 * Get the user's current location with enhanced context for task awareness
 * @returns {Promise<EnhancedLocationContext|null>} Enhanced location context object or null if unavailable
 */
export async function getEnhancedUserContext(): Promise<EnhancedLocationContext | null> {
  try {
    // Get basic location
    const baseLocation = await getUserLocation();
    if (!baseLocation) return null;
    
    // Create enhanced context
    const enhancedContext: EnhancedLocationContext = {
      ...baseLocation,
      
      // Add time context
      timeContext: getTimeContext(),
      
      // Get current task information
      taskContext: await getCurrentTaskContext(),
      
      // Get device activity information
      deviceActivity: await getDeviceActivityContext()
    };
    
    return enhancedContext;
  } catch (error) {
    console.warn('Error getting enhanced user context:', error);
    return null;
  }
}

/**
 * Get current time context
 */
function getTimeContext() {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Determine time of day
  let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  if (hour >= 5 && hour < 12) {
    timeOfDay = 'morning';
  } else if (hour >= 12 && hour < 17) {
    timeOfDay = 'afternoon';
  } else if (hour >= 17 && hour < 21) {
    timeOfDay = 'evening';
  } else {
    timeOfDay = 'night';
  }
  
  return {
    localTime: now,
    timeOfDay,
    isWorkHours: hour >= 9 && hour < 17 && dayOfWeek >= 1 && dayOfWeek <= 5,
    isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
}

/**
 * Get current task context from various sources
 * In a real implementation, this would connect to task APIs, calendar, etc.
 */
async function getCurrentTaskContext(): Promise<TaskContext> {
  // Placeholder implementation - in reality would query task systems
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // For demo, create a sample task context based on time
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    // Mock task context based on typical work schedule
    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Weekday
      if (hour >= 9 && hour < 10) {
        return {
          currentTask: {
            id: 'morning-planning',
            name: 'Morning Planning Session',
            priority: 2,
            status: 'in_progress',
            teamMembers: ['Alex', 'Jordan']
          },
          focusMode: true,
          taskSource: 'calendar'
        };
      } else if (hour >= 10 && hour < 12) {
        return {
          currentTask: {
            id: 'focused-work',
            name: 'Deep Work Session',
            priority: 1,
            status: 'in_progress'
          },
          focusMode: true,
          taskSource: 'task_manager',
          upcomingTasks: [
            {
              id: 'team-meeting',
              name: 'Weekly Team Sync',
              deadline: new Date(new Date().setHours(13, 0, 0, 0)),
              priority: 1
            }
          ]
        };
      } else if (hour >= 13 && hour < 14) {
        return {
          currentTask: {
            id: 'team-meeting',
            name: 'Weekly Team Sync',
            priority: 1,
            status: 'in_progress',
            teamMembers: ['Alex', 'Jordan', 'Taylor', 'Morgan']
          },
          focusMode: false,
          taskSource: 'meeting'
        };
      }
    }
    
    // Default return for other times
    return {
      focusMode: false,
      upcomingTasks: [
        {
          id: 'next-task',
          name: 'Next Scheduled Task',
          deadline: new Date(new Date().setHours(new Date().getHours() + 2, 0, 0, 0)),
          priority: 3
        }
      ]
    };
  } catch (error) {
    console.warn('Error getting task context:', error);
    return {}; // Return empty context on error
  }
}

/**
 * Get information about current device activity
 */
async function getDeviceActivityContext() {
  // This would connect to OS APIs in a real implementation
  try {
    // Simulate device stats
    return {
      activeApps: ['browser', 'email', 'calendar'],
      meetingStatus: Math.random() > 0.7 ? 'in_meeting' as const : 'none' as const,
      screenTime: Math.floor(Math.random() * 120),
      focusScore: Math.floor(Math.random() * 100),
      interruptions: Math.floor(Math.random() * 10)
    };
  } catch (error) {
    console.warn('Error getting device activity:', error);
    return {};
  }
}

/**
 * Get a complete context with task assistance and swarm coordination capabilities
 * @returns {Promise<CompleteContext|null>} Complete context object or null if unavailable
 */
export async function getCompleteUserContext(): Promise<CompleteContext | null> {
  try {
    // Get enhanced location context first
    const enhancedContext = await getEnhancedUserContext();
    if (!enhancedContext) return null;
    
    // Add task assistance and swarm coordination
    const completeContext: CompleteContext = {
      ...enhancedContext,
      taskAssistance: await getTaskAssistanceContext(enhancedContext),
      swarmCoordination: await getSwarmCoordinationContext(enhancedContext),
      personalityMode: determinePersonalityMode(enhancedContext)
    };
    
    return completeContext;
  } catch (error) {
    console.warn('Error getting complete user context:', error);
    return null;
  }
}

/**
 * Detect task from context and generate task assistance information
 * @param {EnhancedLocationContext} context - The enhanced context
 * @returns {Promise<TaskAssistance>} Task assistance context
 */
async function getTaskAssistanceContext(context: EnhancedLocationContext): Promise<TaskAssistance> {
  // In a real implementation, this would call task detection APIs
  // and analyze conversation history and user activity
  
  // For demo purposes, generate task assistance based on current task
  const taskContext = context.taskContext;
  if (!taskContext || !taskContext.currentTask) {
    return {}; // No active task
  }
  
  try {
    // Create task assistance based on current task
    const taskAssistance: TaskAssistance = {
      detectedTask: {
        id: taskContext.currentTask.id,
        name: taskContext.currentTask.name,
        description: `Task based on ${taskContext.taskSource || 'unknown source'}`,
        confidence: 0.85,
        detectedAt: new Date(),
        source: taskContext.taskSource as 'voice' | 'calendar' | 'email' | 'manual' | 'inference'
      }
    };
    
    // Generate clarifying questions based on the task
    taskAssistance.clarifyingQuestions = generateClarifyingQuestions(taskContext.currentTask);
    
    // Generate proposed solutions
    taskAssistance.proposedSolutions = generateProposedSolutions(taskContext.currentTask);
    
    return taskAssistance;
  } catch (error) {
    console.warn('Error generating task assistance:', error);
    return {};
  }
}

/**
 * Generate clarifying questions based on task
 * @param {TaskContext['currentTask']} task - The current task
 * @returns {TaskAssistance['clarifyingQuestions']} List of clarifying questions
 */
function generateClarifyingQuestions(task: TaskContext['currentTask']): TaskAssistance['clarifyingQuestions'] {
  if (!task) return [];

  // In a real implementation, this would use LLM to generate contextually relevant questions
  // For demo purposes, generate generic questions based on task type
  
  const questions: TaskAssistance['clarifyingQuestions'] = [];
  
  if (task.name.toLowerCase().includes('meeting')) {
    questions.push(
      {
        id: 'meeting-goal',
        question: 'What is the primary goal of this meeting?',
        purpose: 'clarification',
        priority: 1
      },
      {
        id: 'meeting-prep',
        question: 'Would you like me to prepare any specific information for this meeting?',
        purpose: 'information_gathering',
        priority: 2
      }
    );
  } else if (task.name.toLowerCase().includes('planning')) {
    questions.push(
      {
        id: 'planning-timeframe',
        question: 'What timeframe are you planning for?',
        purpose: 'information_gathering',
        priority: 1
      },
      {
        id: 'planning-constraints',
        question: 'Are there any specific constraints or requirements to consider?',
        purpose: 'clarification',
        priority: 2
      }
    );
  } else {
    // Generic questions for any task
    questions.push(
      {
        id: 'deadline-question',
        question: `Is the deadline for "${task.name}" still ${task.deadline?.toLocaleDateString() || 'flexible'}?`,
        purpose: 'confirmation',
        priority: task.priority
      },
      {
        id: 'task-breakdown',
        question: 'Would you like me to break this task down into smaller steps?',
        purpose: 'preference',
        priority: 2
      }
    );
  }
  
  return questions;
}

/**
 * Generate proposed solutions based on task
 * @param {TaskContext['currentTask']} task - The current task
 * @returns {TaskAssistance['proposedSolutions']} List of proposed solutions
 */
function generateProposedSolutions(task: TaskContext['currentTask']): TaskAssistance['proposedSolutions'] {
  if (!task) return [];
  
  // In a real implementation, this would use LLM to generate contextually relevant solutions
  // For demo purposes, generate generic solutions based on task type
  
  const solutions: TaskAssistance['proposedSolutions'] = [];
  
  if (task.name.toLowerCase().includes('meeting')) {
    solutions.push({
      id: 'meeting-notes',
      name: 'Automated Meeting Notes',
      description: 'I can listen to the meeting, take notes, and create a summary of key points and action items.',
      approach: 'Voice recognition + summarization model',
      estimatedTime: 0, // real-time
      status: 'proposed'
    },
    {
      id: 'meeting-followup',
      name: 'Meeting Follow-up Generator',
      description: 'After the meeting, I can generate follow-up emails for all participants with action items.',
      approach: 'Email templating + task extraction',
      estimatedTime: 5,
      status: 'proposed'
    });
  } else if (task.name.toLowerCase().includes('planning')) {
    solutions.push({
      id: 'planning-template',
      name: 'Interactive Planning Template',
      description: 'I can create a structured planning template with prompts for all necessary information.',
      approach: 'Template generation + interactive prompts',
      estimatedTime: 3,
      status: 'proposed'
    });
  } else {
    // Generic solutions for any task
    solutions.push({
      id: 'task-automation',
      name: 'Task Automation',
      description: `I can help automate parts of "${task.name}" to save you time.`,
      approach: 'Assistant swarm coordination with specialized AI tools',
      estimatedTime: 10,
      status: 'proposed'
    });
  }
  
  return solutions;
}

/**
 * Get swarm coordination information for complex tasks
 * @param {EnhancedLocationContext} context - The enhanced context
 * @returns {Promise<SwarmCoordination>} Swarm coordination context
 */
async function getSwarmCoordinationContext(context: EnhancedLocationContext): Promise<SwarmCoordination> {
  // In a real implementation, this would connect to swarm orchestration APIs
  // For demo purposes, generate a mock swarm coordination setup
  
  const taskContext = context.taskContext;
  if (!taskContext || !taskContext.currentTask || !isComplexTask(taskContext.currentTask)) {
    return {}; // No swarm needed for simple tasks
  }
  
  try {
    // Simulate an API delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Create a swarm coordination plan based on task
    const swarmId = `swarm-${taskContext.currentTask.id}`;
    
    return {
      swarmId,
      orchestratorAssistant: {
        id: 'main-assistant',
        name: 'GenieFlow Orchestrator',
        specialty: 'Task Coordination'
      },
      activeAssistants: generateSpecializedAssistants(taskContext.currentTask),
      coordinationPlan: {
        components: generateTaskComponents(taskContext.currentTask),
        assignmentStrategy: 'parallel',
        expectedDuration: 15
      },
      progressStatus: Math.random() * 100, // Random progress for demo
    };
  } catch (error) {
    console.warn('Error setting up swarm coordination:', error);
    return {};
  }
}

/**
 * Determine if a task is complex enough to need a swarm
 * @param {TaskContext['currentTask']} task - The current task
 * @returns {boolean} Whether the task needs a swarm
 */
function isComplexTask(task: TaskContext['currentTask']): boolean {
  if (!task) return false;
  
  // For demo purposes, consider tasks with team members or high priority as complex
  return (task.teamMembers && task.teamMembers.length > 1) || task.priority <= 2;
}

/**
 * Generate specialized assistants for a swarm
 * @param {TaskContext['currentTask']} task - The current task
 * @returns {SwarmCoordination['activeAssistants']} List of specialized assistants
 */
function generateSpecializedAssistants(task: TaskContext['currentTask']): SwarmCoordination['activeAssistants'] {
  if (!task) return [];
  
  // Standard assistant roles for most tasks
  const assistants: SwarmCoordination['activeAssistants'] = [
    {
      id: 'research-assistant',
      name: 'Research Specialist',
      role: 'researcher',
      status: 'working',
      taskComponent: 'information-gathering'
    },
    {
      id: 'analysis-assistant',
      name: 'Data Analyst',
      role: 'analyst',
      status: 'working',
      taskComponent: 'data-analysis'
    }
  ];
  
  // Add task-specific assistants
  if (task.name.toLowerCase().includes('meeting')) {
    assistants.push({
      id: 'meeting-assistant',
      name: 'Meeting Facilitator',
      role: 'facilitator',
      status: 'assigned',
      taskComponent: 'meeting-support'
    });
  } else if (task.name.toLowerCase().includes('planning')) {
    assistants.push({
      id: 'planning-assistant',
      name: 'Planning Expert',
      role: 'planner',
      status: 'assigned',
      taskComponent: 'plan-development'
    });
  }
  
  return assistants;
}

/**
 * Generate task components for a swarm to work on
 * @param {TaskContext['currentTask']} task - The current task
 * @returns {string[]} List of task components
 */
function generateTaskComponents(task: TaskContext['currentTask']): string[] {
  if (!task) return [];
  
  // Standard components for most tasks
  const components = ['information-gathering', 'data-analysis', 'recommendation-generation'];
  
  // Add task-specific components
  if (task.name.toLowerCase().includes('meeting')) {
    components.push('meeting-support', 'minutes-preparation', 'action-item-tracking');
  } else if (task.name.toLowerCase().includes('planning')) {
    components.push('plan-development', 'resource-allocation', 'timeline-creation');
  }
  
  return components;
}

/**
 * Determine the appropriate personality mode for the assistant based on context
 * @param {EnhancedLocationContext} context - The enhanced context
 * @returns {CompleteContext['personalityMode']} Appropriate personality mode
 */
function determinePersonalityMode(context: EnhancedLocationContext): CompleteContext['personalityMode'] {
  if (!context.taskContext || !context.taskContext.currentTask) {
    return 'supportive'; // Default when no specific task
  }
  
  const task = context.taskContext.currentTask;
  const taskName = task.name.toLowerCase();
  
  // Determine mode based on task name keywords
  if (taskName.includes('analysis') || taskName.includes('report') || taskName.includes('research')) {
    return 'analytical';
  } else if (taskName.includes('brainstorm') || taskName.includes('design') || taskName.includes('content')) {
    return 'creative';
  } else if (taskName.includes('planning') || taskName.includes('strategy') || taskName.includes('decision')) {
    return 'executive';
  } else {
    return 'supportive'; // Default for administrative and other tasks
  }
}

/**
 * Get the default voice trigger settings
 * @param {string} assistantId - ID of specific assistant (defaults to a generated ID if not provided)
 * @param {string} assistantType - Type of assistant (defaults to 'general' if not provided)
 * @returns {VoiceTrigger} Default voice trigger configuration
 */
export function getDefaultVoiceTrigger(assistantId?: string, assistantType?: string): VoiceTrigger {
  // Generate default IDs if not provided
  const finalAssistantId = assistantId || `assistant-${Date.now()}`;
  const finalAssistantType = assistantType || 'general';
  
  // Common properties for all assistant types
  const commonProps = {
    enabled: true,
    sensitivity: 75,
    requireConfirmation: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    usageCount: 0,
    isFavorite: false
  };
  
  // Default trigger for the main assistant
  if (finalAssistantType === 'general') {
    return {
      ...commonProps,
      primaryTrigger: 'hey genie',
      alternativeTriggers: ['ok genie', 'hey assistant', 'genie flow'],
      customResponseToTrigger: 'I\'m listening',
      assistantId: finalAssistantId,
      assistantType: finalAssistantType,
      assistantName: 'GenieFlow Assistant',
      icon: 'assistant',
      triggerColor: '#4285F4',
      activationSound: 'chime'
    };
  }
  
  // Assistant type-specific defaults
  switch (finalAssistantType) {
    case 'research':
      return {
        ...commonProps,
        primaryTrigger: 'hey scholar',
        alternativeTriggers: ['research assistant', 'knowledge helper'],
        sensitivity: 80,
        customResponseToTrigger: 'Ready to research for you',
        assistantId: finalAssistantId,
        assistantType: finalAssistantType,
        assistantName: 'Research Scholar',
        icon: 'book',
        triggerColor: '#0F9D58',
        activationSound: 'page-turn'
      };
    case 'creative':
      return {
        ...commonProps,
        primaryTrigger: 'hey muse',
        alternativeTriggers: ['creative assistant', 'inspiration helper'],
        customResponseToTrigger: 'Ready for creative ideas',
        assistantId: finalAssistantId,
        assistantType: finalAssistantType,
        assistantName: 'Creative Muse',
        icon: 'brush',
        triggerColor: '#F4B400',
        activationSound: 'creative-chime'
      };
    case 'task':
      return {
        ...commonProps,
        primaryTrigger: 'hey organizer',
        alternativeTriggers: ['task assistant', 'productivity helper'],
        sensitivity: 85,
        customResponseToTrigger: 'Ready to help with your tasks',
        assistantId: finalAssistantId,
        assistantType: finalAssistantType,
        assistantName: 'Task Organizer',
        icon: 'check-list',
        triggerColor: '#DB4437',
        activationSound: 'task-ping'
      };
    default:
      // Custom assistant with generic defaults but unique ID/type
      return {
        ...commonProps,
        primaryTrigger: `hey ${finalAssistantType}`,
        alternativeTriggers: [`${finalAssistantType} assistant`],
        customResponseToTrigger: `${finalAssistantType} assistant is listening`,
        assistantId: finalAssistantId,
        assistantType: finalAssistantType,
        assistantName: `${finalAssistantType.charAt(0).toUpperCase() + finalAssistantType.slice(1)} Assistant`,
        icon: 'custom-assistant',
        triggerColor: '#9C27B0',
        activationSound: 'standard'
      };
  }
}

/**
 * Save user's custom voice trigger settings
 * @param {VoiceTrigger} voiceTrigger - The voice trigger settings to save
 * @returns {Promise<boolean>} Success status
 */
export async function saveVoiceTriggerSettings(voiceTrigger: VoiceTrigger): Promise<boolean> {
  try {
    // In production, this would save to user preferences in database
    // For demo, we'll save to localStorage
    localStorage.setItem('voice-trigger-settings', JSON.stringify(voiceTrigger));
    return true;
  } catch (error) {
    console.error('Failed to save voice trigger settings:', error);
    return false;
  }
}

/**
 * Load user's custom voice trigger settings
 * @returns {Promise<VoiceTrigger>} The user's voice trigger settings or defaults
 */
export async function loadVoiceTriggerSettings(): Promise<VoiceTrigger> {
  try {
    // In production, this would load from user preferences in database
    // For demo, we'll load from localStorage
    const savedSettings = localStorage.getItem('voice-trigger-settings');
    if (savedSettings) {
      return JSON.parse(savedSettings) as VoiceTrigger;
    }
    return getDefaultVoiceTrigger();
  } catch (error) {
    console.error('Failed to load voice trigger settings:', error);
    return getDefaultVoiceTrigger();
  }
}

/**
 * Check if transcription contains a trigger word
 * @param {string} transcription - The speech transcription to check
 * @param {VoiceTrigger} voiceTrigger - The voice trigger settings
 * @returns {boolean} Whether a trigger word was detected
 */
export function detectTriggerWord(transcription: string, voiceTrigger: VoiceTrigger): boolean {
  if (!voiceTrigger.enabled) return false;
  
  const normalizedTranscription = transcription.toLowerCase().trim();
  
  // Check primary trigger
  if (normalizedTranscription.includes(voiceTrigger.primaryTrigger.toLowerCase())) {
    return true;
  }
  
  // Check alternative triggers
  if (voiceTrigger.alternativeTriggers && voiceTrigger.alternativeTriggers.length > 0) {
    return voiceTrigger.alternativeTriggers.some(trigger => 
      normalizedTranscription.includes(trigger.toLowerCase())
    );
  }
  
  return false;
}

/**
 * Handle trigger word activation
 * @param {VoiceTrigger} voiceTrigger - The voice trigger settings
 * @returns {Promise<string|null>} Response to trigger or null
 */
export async function handleTriggerActivation(voiceTrigger: VoiceTrigger): Promise<string|null> {
  try {
    // Update last detected time
    const updatedTrigger = {
      ...voiceTrigger,
      lastDetectedAt: new Date()
    };
    
    // Save updated trigger settings
    await saveVoiceTriggerSettings(updatedTrigger);
    
    // Return custom response if available
    return voiceTrigger.customResponseToTrigger || 'How can I help you?';
  } catch (error) {
    console.error('Error handling trigger activation:', error);
    return 'I\'m listening';
  }
}

/**
 * Get all assistant voice triggers
 * @returns {Promise<VoiceTrigger[]>} Array of voice triggers for different assistants
 */
export async function getAllAssistantTriggers(): Promise<VoiceTrigger[]> {
  try {
    // In production, this would load from user preferences in database
    // For demo, we'll load from localStorage
    const savedTriggersJson = localStorage.getItem('assistant-voice-triggers');
    if (savedTriggersJson) {
      return JSON.parse(savedTriggersJson) as VoiceTrigger[];
    }
    
    // If no saved triggers, return default general assistant trigger
    return [getDefaultVoiceTrigger()];
  } catch (error) {
    console.error('Failed to load assistant triggers:', error);
    return [getDefaultVoiceTrigger()];
  }
}

/**
 * Save all assistant voice triggers
 * @param {VoiceTrigger[]} triggers - Array of voice triggers to save
 * @returns {Promise<boolean>} Success status
 */
export async function saveAllAssistantTriggers(triggers: VoiceTrigger[]): Promise<boolean> {
  try {
    // In production, this would save to user preferences in database
    // For demo, we'll save to localStorage
    localStorage.setItem('assistant-voice-triggers', JSON.stringify(triggers));
    return true;
  } catch (error) {
    console.error('Failed to save assistant triggers:', error);
    return false;
  }
}

/**
 * Add a new voice trigger for a specific assistant
 * @param {string} assistantId - ID of the assistant
 * @param {string} assistantType - Type of the assistant
 * @param {Partial<VoiceTrigger>} customSettings - Optional custom settings to override defaults
 * @returns {Promise<boolean>} Success status
 */
export async function addAssistantTrigger(
  assistantId: string,
  assistantType: string,
  customSettings?: Partial<VoiceTrigger>
): Promise<boolean> {
  try {
    // Get existing triggers
    const existingTriggers = await getAllAssistantTriggers();
    
    // Check if trigger for this assistant already exists
    const existingIndex = existingTriggers.findIndex(
      trigger => trigger.assistantId === assistantId
    );
    
    // Create new trigger with defaults and any custom overrides
    const newTrigger = {
      ...getDefaultVoiceTrigger(assistantId, assistantType),
      ...customSettings,
      assistantId, // Ensure these are set even if customSettings doesn't include them
      assistantType
    };
    
    // Either update existing or add new
    if (existingIndex >= 0) {
      existingTriggers[existingIndex] = newTrigger;
    } else {
      existingTriggers.push(newTrigger);
    }
    
    // Save updated triggers
    return await saveAllAssistantTriggers(existingTriggers);
  } catch (error) {
    console.error('Failed to add assistant trigger:', error);
    return false;
  }
}

/**
 * Update an existing voice trigger for a specific assistant
 * @param {string} assistantId - ID of the assistant
 * @param {Partial<VoiceTrigger>} updatedSettings - Settings to update
 * @returns {Promise<boolean>} Success status
 */
export async function updateAssistantTrigger(
  assistantId: string,
  updatedSettings: Partial<VoiceTrigger>
): Promise<boolean> {
  try {
    // Get existing triggers
    const existingTriggers = await getAllAssistantTriggers();
    
    // Find trigger for this assistant
    const existingIndex = existingTriggers.findIndex(
      trigger => trigger.assistantId === assistantId
    );
    
    // If not found, return false
    if (existingIndex < 0) {
      console.warn(`No trigger found for assistant ID ${assistantId}`);
      return false;
    }
    
    // Update trigger
    existingTriggers[existingIndex] = {
      ...existingTriggers[existingIndex],
      ...updatedSettings
    };
    
    // Save updated triggers
    return await saveAllAssistantTriggers(existingTriggers);
  } catch (error) {
    console.error('Failed to update assistant trigger:', error);
    return false;
  }
}

/**
 * Remove a voice trigger for a specific assistant
 * @param {string} assistantId - ID of the assistant to remove trigger for
 * @returns {Promise<boolean>} Success status
 */
export async function removeAssistantTrigger(assistantId: string): Promise<boolean> {
  try {
    // Get existing triggers
    const existingTriggers = await getAllAssistantTriggers();
    
    // Filter out the specified assistant
    const updatedTriggers = existingTriggers.filter(
      trigger => trigger.assistantId !== assistantId
    );
    
    // If no changes, return false
    if (updatedTriggers.length === existingTriggers.length) {
      console.warn(`No trigger found for assistant ID ${assistantId}`);
      return false;
    }
    
    // Save updated triggers
    return await saveAllAssistantTriggers(updatedTriggers);
  } catch (error) {
    console.error('Failed to remove assistant trigger:', error);
    return false;
  }
}

/**
 * Find which assistant is being triggered by a transcription
 * @param {string} transcription - The speech transcription to check
 * @returns {Promise<{trigger: VoiceTrigger, matchedPhrase: string} | null>} The matched trigger and phrase or null
 */
export async function findTriggeredAssistant(
  transcription: string
): Promise<{trigger: VoiceTrigger, matchedPhrase: string} | null> {
  try {
    // Get all assistant triggers
    const allTriggers = await getAllAssistantTriggers();
    
    // Filter to only enabled triggers
    const enabledTriggers = allTriggers.filter(trigger => trigger.enabled);
    if (!enabledTriggers.length) return null;
    
    const normalizedTranscription = transcription.toLowerCase().trim();
    
    // Check each trigger
    for (const trigger of enabledTriggers) {
      // Check primary trigger
      if (normalizedTranscription.includes(trigger.primaryTrigger.toLowerCase())) {
        return { 
          trigger, 
          matchedPhrase: trigger.primaryTrigger 
        };
      }
      
      // Check alternative triggers
      if (trigger.alternativeTriggers && trigger.alternativeTriggers.length > 0) {
        for (const alt of trigger.alternativeTriggers) {
          if (normalizedTranscription.includes(alt.toLowerCase())) {
            return { 
              trigger, 
              matchedPhrase: alt 
            };
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding triggered assistant:', error);
    return null;
  }
}

/**
 * Process voice transcription for any assistant triggers
 * @param {string} transcription - The speech transcription to process
 * @returns {Promise<{assistantId: string, assistantType: string, response: string} | null>} Assistant activation info or null
 */
export async function processVoiceTranscription(
  transcription: string
): Promise<{assistantId: string, assistantType: string, response: string} | null> {
  try {
    // Find which assistant is being triggered
    const match = await findTriggeredAssistant(transcription);
    if (!match) return null;
    
    const { trigger } = match;
    
    // Handle the trigger activation
    const response = await handleTriggerActivation(trigger);
    
    if (response) {
      return {
        assistantId: trigger.assistantId || 'default',
        assistantType: trigger.assistantType || 'general',
        response
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error processing voice transcription:', error);
    return null;
  }
}
