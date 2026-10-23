import { AIService } from './baseAIService';
import { Task, TaskPriority, TaskStatus } from '../../types/task';
import { Event } from '../../types/calendar';
import { Source } from '../AIService';
import type { Message, AIConfig, AIModel, AIPrompt } from '../../types';
import { EmailMessage, EmailAnalysis } from '../email/types';

export class MockAIService implements AIService {
  private config: AIConfig | null = null;
  private model: AIModel | null = null;
  private prompt: AIPrompt | null = null;
  private context: Message[] = [];
  private sources: Source[] = [];

  async initialize(config: AIConfig): Promise<void> {
    console.log('[MockAIService] initialize called with config:', config);
    this.config = config;
    if (config.defaultModel) {
        this.model = config.defaultModel; 
    }
  }

  setModel(model: AIModel): void {
    console.log('[MockAIService] setModel called with model:', model);
    this.model = model;
  }

  getModel(): AIModel {
    console.log('[MockAIService] getModel called');
    if (!this.model) throw new Error('[MockAIService] Model not set');
    return this.model;
  }

  async sendMessage(message: Message): Promise<Message> {
    console.log('[MockAIService] sendMessage called with message:', message);
    const responseMessage: Message = {
      id: Date.now().toString(),
      content: `Mock response to: ${message.content}`,
      role: 'assistant',
      timestamp: new Date(),
    };
    this.context.push(message, responseMessage);
    return responseMessage;
  }

  async generateResponse(messages: Message[]): Promise<string> {
    console.log('[MockAIService] generateResponse called with messages:', messages);
    return `Mock generated response based on ${messages.length} messages.`;
  }

  setPrompt(prompt: AIPrompt): void {
    console.log('[MockAIService] setPrompt called with prompt:', prompt);
    this.prompt = prompt;
  }

  getPrompt(): AIPrompt | null {
    console.log('[MockAIService] getPrompt called');
    return this.prompt;
  }

  clearContext(): void {
    console.log('[MockAIService] clearContext called');
    this.context = [];
    this.sources = [];
  }

  getContext(): Message[] {
    console.log('[MockAIService] getContext called');
    return this.context;
  }

  extractVariables(content: string): Record<string, unknown> {
    console.log('[MockAIService] extractVariables called with content:', content);
    return { mockVar: 'mockValue' };
  }

  validateResponse(response: string): boolean {
    console.log('[MockAIService] validateResponse called with response:', response);
    return response.length > 0;
  }

  getConfig(): AIConfig {
    console.log('[MockAIService] getConfig called');
    if (!this.config) throw new Error('[MockAIService] Config not set');
    return this.config;
  }

  updateConfig(config: Partial<AIConfig>): void {
    console.log('[MockAIService] updateConfig called with config:', config);
    this.config = { ...this.config!, ...config };
  }

  async getRelevantSources(query: string): Promise<Source[]> {
    console.log('[MockAIService] getRelevantSources called with query:', query);
    return this.sources.filter(s => s.content.includes(query));
  }

  getSourcesByType(type: string): Source[] {
    console.log('[MockAIService] getSourcesByType called with type:', type);
    return this.sources.filter(s => s.type === type);
  }

  getSourcesByConfidence(minConfidence: number): Source[] {
    console.log('[MockAIService] getSourcesByConfidence called with minConfidence:', minConfidence);
    return this.sources.filter(s => s.confidence >= minConfidence);
  }

  async analyzeEmailForCalendarEvent(email: EmailMessage): Promise<EmailAnalysis | null> {
    console.log('[MockAIService] analyzeEmailForCalendarEvent called with email:', email.subject);
    // Mock logic: if email subject contains "meeting", return a mock EmailAnalysis
    if (email.subject?.toLowerCase().includes('meeting')) {
      return {
        summary: `Mock analysis: Email \"${email.subject}\" appears to be about a meeting.`,
        // meetingDetails: { // This property might not exist on EmailAnalysis from ../email/types
        //   title: `Meeting from ${email.subject}`,
        //   startTime: new Date(),
        //   endTime: new Date(Date.now() + 60*60*1000),
        //   location: 'Mock Location'
        // }
      } as EmailAnalysis; // Cast if meetingDetails is not on the imported EmailAnalysis type
    }
    return null;
  }

  async getCompletion(prompt: string, options?: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
  }): Promise<string> {
    return `Mock AI response for: ${prompt}\nModel: ${options?.model || 'default'}\nTemperature: ${options?.temperature || 0.7}`;
  }

  async getEmbedding(_text: string): Promise<number[]> {
    console.log('[MockAIService] getEmbedding called for text (length):', _text.length);
    return Array(768).fill(0).map(() => Math.random());
  }

  async enhanceTask(task: Task): Promise<{ data: Task; sources: any[] }> {
    const enhancedTask = {
      ...task,
      description: task.description + ' (Enhanced by mock AI)',
      tags: ['mock', 'test'],
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.TODO
    };
    return { data: enhancedTask, sources: [] };
  }

  async estimateTaskDuration(task: Task): Promise<{ data: number; sources: any[] }> {
    console.log('Mocking estimateTaskDuration for task:', task.title);
    const duration = Math.floor(Math.random() * 90) + 30;
    return { data: duration, sources: [] };
  }

  async optimizeTaskSchedule(tasks: Task[]): Promise<{ data: Task[]; sources: any[] }> {
    const now = new Date();
    const updatedTasks = tasks.map((task, index) => ({
      ...task,
      startTime: new Date(now.getTime() + index * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + (index + 1) * 60 * 60 * 1000)
    }));
    return { data: updatedTasks, sources: [] };
  }

  async suggestEventTimes(_event: Partial<Event>): Promise<{ data: Date[]; sources: any[] }> {
    const now = new Date();
    const dates = [
      now,
      new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
      new Date(now.getTime() + 48 * 60 * 60 * 1000), // Day after tomorrow
      new Date(now.getTime() + 72 * 60 * 60 * 1000)  // Three days from now
    ];
    return { data: dates, sources: [] };
  }

  async analyzeScheduleConflicts(_events: Event[]): Promise<{ data: { conflicts: string[]; followUpQuestions: { question: string; context: string; difficulty: 'beginner' | 'intermediate' | 'advanced' }[] }; sources: any[] }> {
    const analysisResults = {
      conflicts: ['No conflicts detected in the schedule'],
      followUpQuestions: [
        { question: 'Would you like to find alternative times for conflicting events?', context: 'schedule_conflict', difficulty: 'beginner' as const },
        { question: 'Should I try to reschedule lower priority items?', context: 'priority_conflict', difficulty: 'intermediate' as const }
      ]
    };
    return { data: analysisResults, sources: [] };
  }
}

export const mockAIService = new MockAIService(); 