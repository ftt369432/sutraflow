import { v4 as uuidv4 } from 'uuid';
import { BaseAgent, AgentAction, AgentActionResult } from './BaseAgent';
import { AgentConfig, AgentType, AgentCapability } from '../../types/agent';
import { ActionResult } from '../../types/actions';
import { CalendarService } from '../CalendarService';
import { EventType } from '../../types/calendar';
import { AIService } from '../ai/baseAIService';
import { TaskService } from '../TaskService';
import { GeminiService } from '../gemini';

/**
 * 🤖 Universal Calendar Agent - Conversational Calendar Management
 * 
 * Based on GenieFlowAI's Universal Conversational Agent Architecture:
 * - "Just Talk to Build": Natural language scheduling and management
 * - Universal & Granular: Works for ANY profession (legal, medical, business, etc.)
 * - Conversational Everything: Voice/chat interface for all operations
 * 
 * Core Philosophy: Users should be able to say things like:
 * - "Schedule a client meeting for tomorrow at 2 PM"
 * - "Process my emails and create calendar events"
 * - "Build me a scheduling workflow for court dates"
 * - "Show me conflicts and suggest alternatives"
 */
export class CalendarAgent extends BaseAgent {
  private calendarService: CalendarService;
  private conversationalCommands: Map<string, Function> = new Map();

  constructor(config?: Partial<AgentConfig>, aiService?: AIService) {
    const defaultCapabilities: AgentCapability[] = [
      'scheduling',
      'calendar-management'
    ];

    super({
      id: config?.id || `universal-calendar-agent-${uuidv4()}`,
      name: config?.name || '🤖 Universal Calendar Agent',
      description: config?.description || 'Conversational calendar management for any profession. Just tell me what you need!',
      capabilities: config?.capabilities || defaultCapabilities,
      type: AgentType.CALENDAR,
      version: config?.version || '2.0',
      created: config?.created || new Date(),
      lastModified: config?.lastModified || new Date(),
      status: config?.status || 'active',
      preferences: config?.preferences || {
        conversationalMode: true,
        proactiveReminders: true,
        conflictDetection: true,
        crossProfessionSupport: true
      }
    });

    const resolvedAIService = aiService || this.ai;
    const taskService = new TaskService(resolvedAIService as any);
    this.calendarService = new CalendarService(taskService, resolvedAIService as any);

    // Initialize conversational command mapping
    this.initializeConversationalCommands();
  }

  /**
   * 🗣️ Initialize conversational command patterns
   */
  private initializeConversationalCommands(): void {
    this.conversationalCommands = new Map([
      // Scheduling patterns
      ['schedule', this.handleScheduleCommand.bind(this)],
      ['book', this.handleScheduleCommand.bind(this)],
      ['create meeting', this.handleScheduleCommand.bind(this)],
      ['set up', this.handleScheduleCommand.bind(this)],

      // Analysis patterns  
      ['analyze emails', this.handleEmailAnalysisCommand.bind(this)],
      ['process emails', this.handleEmailAnalysisCommand.bind(this)],
      ['check for meetings', this.handleEmailAnalysisCommand.bind(this)],

      // Management patterns
      ['show conflicts', this.detectConflicts.bind(this)],
      ['find alternatives', this.suggestMeetingTimes.bind(this)],
      ['summarize calendar', this.summarizeCalendar.bind(this)],

      // Workflow patterns
      ['build workflow', this.buildCalendarWorkflow.bind(this)],
      ['create automation', this.createCalendarAutomation.bind(this)]
    ]);
  }

  /**
   * 🎯 Process natural language input (main conversational interface)
   */
  public async processConversationalInput(input: string, context?: any): Promise<any> {
    console.log(`🤖 Universal Calendar Agent: Processing "${input}"`);

    const normalizedInput = input.toLowerCase().trim();

    // Find matching command pattern
    for (const [pattern, handler] of this.conversationalCommands) {
      if (normalizedInput.includes(pattern)) {
        console.log(`🎯 Matched pattern: "${pattern}"`);
        return await handler(input, context);
      }
    }

    // If no exact pattern match, use AI to interpret the request
    return await this.handleAIInterpretedCommand(input, context);
  }

  /**
   * 📅 Handle schedule-related commands
   */
  private async handleScheduleCommand(input: string, context?: any): Promise<any> {
    const scheduleDetails = await this.extractScheduleDetails(input);

    return {
      success: true,
      action: 'schedule_event',
      message: `🎯 I'll schedule "${scheduleDetails.title}" for ${scheduleDetails.when}`,
      details: scheduleDetails,
      nextSteps: [
        'Checking calendar availability',
        'Creating calendar event',
        'Sending invitations if needed'
      ]
    };
  }

  /**
   * 📧 Handle email analysis commands
   */
  public async handleEmailAnalysisCommand(input: string, context?: any): Promise<any> {
    const emailsToProcess = context?.emails || [];

    return {
      success: true,
      action: 'analyze_emails',
      message: `🔍 I'll analyze ${emailsToProcess.length} emails for meeting opportunities`,
      processing: true,
      details: {
        emailCount: emailsToProcess.length,
        analysisType: 'meeting_detection'
      }
    };
  }

  /**
   * 📅 Explicit scheduling method called by ToolRegistry
   */
  public async scheduleEvent(params: {
    title: string;
    startTime: Date;
    endTime?: Date;
    attendees?: string[];
    description?: string;
  }): Promise<any> {
    console.log(`🤖 CalendarAgent: Scheduling event "${params.title}"`);
    
    const event = await this.calendarService.createEvent({
      title: params.title,
      description: params.description || '',
      startTime: params.startTime,
      endTime: params.endTime || new Date(params.startTime.getTime() + 60 * 60 * 1000), // Default 1 hour
      type: EventType.MEETING,
      attendees: params.attendees || [],
      metadata: { created_by: 'calendar_agent' },
      created: new Date(),
      lastModified: new Date()
    });

    return event;
  }

  /**
   * 🏗️ Build calendar workflow from conversation
   */
  private async buildCalendarWorkflow(input: string, context?: any): Promise<any> {
    const workflowType = await this.determineWorkflowType(input);

    return {
      success: true,
      action: 'build_workflow',
      message: `🏗️ I'll build a ${workflowType} workflow for you`,
      workflow: {
        type: workflowType,
        steps: await this.generateWorkflowSteps(workflowType),
        triggers: await this.generateWorkflowTriggers(workflowType)
      }
    };
  }

  /**
   * 🤖 Create calendar automation
   */
  private async createCalendarAutomation(input: string, context?: any): Promise<any> {
    return {
      success: true,
      action: 'create_automation',
      message: '🤖 I\'ll create a calendar automation for you',
      automation: {
        name: 'Universal Calendar Automation',
        triggers: ['new_email', 'schedule_request'],
        actions: ['analyze_content', 'create_event', 'send_confirmation']
      }
    };
  }

  /**
   * 🧠 Handle AI-interpreted commands for complex requests
   */
  private async handleAIInterpretedCommand(input: string, context?: any): Promise<any> {
    const prompt = `
You are a Universal Calendar Agent. The user said: "${input}"

Interpret this request and respond with a helpful action plan. Consider:
- What calendar action they want (schedule, analyze, manage, automate)
- What profession they might be in (legal, medical, business, etc.)
- What specific help they need

Respond in JSON format with:
{
  "intent": "schedule|analyze|manage|automate|help",
  "action": "specific_action_name",
  "message": "friendly response to user",
  "steps": ["step1", "step2", "step3"],
  "profession_hints": ["detected profession clues"]
}
`;

    try {
      const aiResponse = await this.getCompletion(prompt, { purpose: 'command_interpretation' });
      const parsed = JSON.parse(aiResponse);

      return {
        success: true,
        interpreted: true,
        ...parsed,
        message: `🤖 ${parsed.message}`
      };
    } catch (error) {
      return {
        success: false,
        message: '🤔 I didn\'t quite understand that. Could you try rephrasing? For example: "Schedule a meeting tomorrow" or "Analyze my emails for calendar events"',
        suggestions: [
          'Schedule a client meeting for next Tuesday',
          'Process my emails and create calendar events',
          'Show me calendar conflicts for this week',
          'Build me a workflow for court date management'
        ]
      };
    }
  }

  /**
   * 🔍 Extract scheduling details from natural language
   */
  private async extractScheduleDetails(input: string): Promise<any> {
    const prompt = `
Extract scheduling details from: "${input}"

Return JSON with:
{
  "title": "meeting title",
  "when": "parsed date/time",
  "duration": "estimated duration",
  "attendees": ["list of people"],
  "location": "meeting location",
  "type": "meeting|call|appointment|court_date|consultation"
}
`;

    try {
      const response = await this.getCompletion(prompt, { purpose: 'schedule_extraction' });
      return JSON.parse(response);
    } catch {
      return {
        title: 'Meeting',
        when: 'needs clarification',
        duration: '1 hour',
        attendees: [],
        location: 'TBD',
        type: 'meeting'
      };
    }
  }

  /**
   * 🔧 Determine workflow type from user input
   */
  private async determineWorkflowType(input: string): Promise<string> {
    if (input.includes('court') || input.includes('legal')) return 'legal_calendar';
    if (input.includes('patient') || input.includes('medical')) return 'medical_scheduling';
    if (input.includes('client') || input.includes('business')) return 'business_calendar';
    return 'universal_calendar';
  }

  /**
   * 📋 Generate workflow steps based on type
   */
  private async generateWorkflowSteps(workflowType: string): Promise<string[]> {
    const workflows: Record<string, string[]> = {
      legal_calendar: [
        'Monitor emails for court notifications',
        'Extract case numbers and hearing dates',
        'Create calendar events with case details',
        'Set up deadline reminders',
        'Notify relevant team members'
      ],
      medical_scheduling: [
        'Process appointment requests',
        'Check doctor availability',
        'Schedule patient appointments',
        'Send confirmation messages',
        'Set up follow-up reminders'
      ],
      business_calendar: [
        'Analyze meeting requests',
        'Check team availability',
        'Schedule meetings with optimal times',
        'Send calendar invitations',
        'Prepare meeting agendas'
      ],
      universal_calendar: [
        'Monitor communication channels',
        'Detect scheduling opportunities',
        'Create appropriate calendar events',
        'Send notifications and confirmations',
        'Track and optimize scheduling patterns'
      ]
    };

    return workflows[workflowType] || workflows.universal_calendar;
  }

  /**
   * ⚡ Generate workflow triggers
   */
  private async generateWorkflowTriggers(workflowType: string): Promise<string[]> {
    return [
      'New email received',
      'Schedule keyword detected',
      'Meeting request identified',
      'Calendar conflict detected',
      'User voice command'
    ];
  }

  /**
   * Perform a calendar-related action (implements abstract method from BaseAgent)
   */
  protected async performAction(action: AgentAction): Promise<any> {
    const { type, params } = action;

    switch (type) {
      case 'schedule_event':
        return this.scheduleEvent(params as any);
      case 'reschedule_event':
        return this.rescheduleEvent(params);
      case 'analyze_availability':
        return this.analyzeAvailability(params);
      case 'suggest_meeting_times':
        return this.suggestMeetingTimes(params);
      case 'send_reminders':
        return this.sendReminders(params);
      case 'detect_conflicts':
        return this.detectConflicts(params);
      case 'summarize_calendar':
        return this.summarizeCalendar(params);
      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  }

  /**
   * Reschedule an existing calendar event
   */
  private async rescheduleEvent(params: any): Promise<any> {
    const event = await this.calendarService.updateEvent(params.eventId, {
      startTime: params.newStartTime ? new Date(params.newStartTime) : undefined,
      endTime: params.newEndTime ? new Date(params.newEndTime) : undefined
    });
    return event;
  }

  /**
   * Analyze availability for a given time period
   */
  private async analyzeAvailability(params: any): Promise<any> {
    // Mock implementation
    console.log('Analyzing availability with params:', params);
    return {
      availableSlots: [
        { start: '2023-08-15T09:00:00Z', end: '2023-08-15T10:00:00Z' },
        { start: '2023-08-15T14:00:00Z', end: '2023-08-15T15:00:00Z' },
        { start: '2023-08-16T11:00:00Z', end: '2023-08-16T12:00:00Z' }
      ],
      busyTimes: [
        { start: '2023-08-15T10:30:00Z', end: '2023-08-15T12:00:00Z' },
        { start: '2023-08-16T09:00:00Z', end: '2023-08-16T10:30:00Z' }
      ]
    };
  }

  /**
   * Suggest optimal meeting times based on parameters
   */
  private async suggestMeetingTimes(params: any): Promise<any> {
    // Mock implementation
    console.log('Suggesting meeting times with params:', params);
    return {
      suggestedTimes: [
        { start: '2023-08-15T14:00:00Z', end: '2023-08-15T15:00:00Z', score: 0.9 },
        { start: '2023-08-16T11:00:00Z', end: '2023-08-16T12:00:00Z', score: 0.8 },
        { start: '2023-08-17T10:00:00Z', end: '2023-08-17T11:00:00Z', score: 0.7 }
      ],
      reasoning: 'Based on availability and preferences of all participants'
    };
  }

  /**
   * Send reminders for upcoming events
   */
  private async sendReminders(params: any): Promise<any> {
    // Mock implementation
    console.log('Sending reminders with params:', params);
    return {
      success: true,
      remindersSent: 3,
      events: [
        { id: 'event-123', title: 'Team Meeting', time: '2023-08-15T14:00:00Z' },
        { id: 'event-456', title: 'Client Call', time: '2023-08-16T11:00:00Z' },
        { id: 'event-789', title: 'Project Review', time: '2023-08-17T10:00:00Z' }
      ]
    };
  }

  /**
   * Detect scheduling conflicts
   */
  private async detectConflicts(params: any): Promise<any> {
    // Mock implementation
    console.log('Detecting conflicts with params:', params);
    return {
      conflicts: [
        {
          event1: { id: 'event-123', title: 'Team Meeting', time: '2023-08-15T14:00:00Z' },
          event2: { id: 'event-456', title: 'Client Call', time: '2023-08-15T14:30:00Z' },
          overlapMinutes: 30
        }
      ],
      recommendations: [
        'Reschedule Client Call to 15:30',
        'Shorten Team Meeting to end at 14:30'
      ]
    };
  }

  /**
   * Summarize calendar for a time period
   */
  public async summarizeCalendar(params: any): Promise<any> {
    // Mock implementation
    console.log('Summarizing calendar with params:', params);
    return {
      totalEvents: 12,
      busyDays: ['2023-08-15', '2023-08-18'],
      quietDays: ['2023-08-16', '2023-08-17'],
      categories: {
        meetings: 5,
        calls: 3,
        personal: 2,
        other: 2
      },
      summary: 'Your week is moderately busy with most commitments on Tuesday and Friday.'
    };
  }

  /**
   * Train the calendar agent on sample data
   */
  async train(data: any[]): Promise<void> {
    console.log('Training calendar agent with', data.length, 'samples');
  }

  public async scheduleMeeting(
    participants: string[],
    duration: number,
    preferences?: any
  ): Promise<ActionResult> {
    const startTime = Date.now();

    try {
      // Get available times for all participants
      const availableTimes = await this.findAvailableSlots(participants, duration);

      // Analyze preferences and rank slots
      const rankedSlots = await this.rankTimeSlots(availableTimes, preferences);

      // Get the best slot
      const bestSlot = rankedSlots[0];

      // Schedule the meeting
      const meeting = await this.calendarService.createEvent({
        title: preferences?.title || 'Meeting',
        startTime: bestSlot.start,
        endTime: bestSlot.end,
        attendees: participants,
        description: preferences?.description,
        type: EventType.MEETING,
        created: new Date(),
        lastModified: new Date()
      });

      return {
        output: { meeting, alternativeSlots: rankedSlots.slice(1) },
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        output: null,
        duration: Date.now() - startTime,
        error: this.formatError(error)
      };
    }
  }

  private async findAvailableSlots(
    participants: string[],
    duration: number
  ): Promise<Array<{ start: Date; end: Date }>> {
    const availabilities = await Promise.all(
      participants.map(p => this.calendarService.getAvailability(p))
    );

    return this.findCommonSlots(availabilities, duration);
  }

  private async findCommonSlots(
    availabilities: Array<Array<{ start: Date; end: Date }>>,
    duration: number
  ): Promise<Array<{ start: Date; end: Date }>> {
    // Implement slot finding algorithm
    return Promise.resolve([]);
  }

  private async rankTimeSlots(
    slots: Array<{ start: Date; end: Date }>,
    preferences?: any
  ): Promise<Array<{ start: Date; end: Date; score: number }>> {
    const prompt = `Rank these meeting slots based on the following preferences:\n` +
      `Slots: ${JSON.stringify(slots)}\n` +
      `Preferences: ${JSON.stringify(preferences)}`;

    const rankings = await this.getCompletion(prompt, { purpose: 'time_ranking' });
    return JSON.parse(rankings);
  }

  private async rescheduleMeeting(
    meetingId: string,
    newTime: Date
  ): Promise<ActionResult> {
    const startTime = Date.now();

    try {
      const meeting = await this.calendarService.updateEvent(meetingId, {
        startTime: newTime
      });

      return {
        output: { meeting },
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        output: null,
        duration: Date.now() - startTime,
        error: this.formatError(error)
      };
    }
  }

  private async findSuggestedMeetingTimes(
    participants: string[],
    duration: number,
    preferences?: any
  ): Promise<ActionResult> {
    const startTime = Date.now();

    try {
      const availableSlots = await this.findAvailableSlots(participants, duration);
      const rankedSlots = await this.rankTimeSlots(availableSlots, preferences);

      return {
        output: { suggestedTimes: rankedSlots },
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        output: null,
        duration: Date.now() - startTime,
        error: this.formatError(error)
      };
    }
  }
}