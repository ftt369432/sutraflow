import { aiConfig } from '../aiConfig';
import { isTestKey } from '../../lib/utils';
import { Task } from '../../types/task';
import { Event } from '../../types/calendar';
import { /*FollowUpQuestion,*/ ScheduleAnalysisResult, ResponseWithSources, Source } from '../AIService';
import type { Message, AIConfig, AIModel, AIPrompt } from '../../types/ai';
import { EmailMessage, EmailAnalysis } from '../email/types';

export interface AIService {
  // Core functionality
  initialize(config: AIConfig): Promise<void>;
  setModel(model: AIModel): void;
  getModel(): AIModel;
  
  // Message handling
  sendMessage(message: Message): Promise<Message>;
  generateResponse(messages: Message[]): Promise<string>;
  
  // Prompt management
  setPrompt(prompt: AIPrompt): void;
  getPrompt(): AIPrompt | null;
  
  // State management
  clearContext(): void;
  getContext(): Message[];
  
  // Utility methods
  extractVariables(content: string): Record<string, unknown>;
  validateResponse(response: string): boolean;
  
  // Configuration
  getConfig(): AIConfig;
  updateConfig(config: Partial<AIConfig>): void;
  
  getCompletion(prompt: string, options?: {
    maxTokens?: number;
    temperature?: number;
    stopSequences?: string[];
  }): Promise<string>;
  
  getEmbedding(text: string): Promise<number[]>;
  
  enhanceTask(task: Task): Promise<ResponseWithSources<Task>>;
  
  estimateTaskDuration(task: Task): Promise<ResponseWithSources<number>>;
  
  optimizeTaskSchedule(tasks: Task[]): Promise<ResponseWithSources<Task[]>>;
  
  suggestEventTimes(event: Partial<Event>): Promise<ResponseWithSources<Date[]>>;
  
  analyzeScheduleConflicts(events: Event[]): Promise<ResponseWithSources<ScheduleAnalysisResult>>;

  // New source management methods
  getRelevantSources(query: string): Promise<Source[]>;
  getSourcesByType(type: string): Source[];
  getSourcesByConfidence(minConfidence: number): Source[];

  // Method for email analysis to extract calendar event details
  analyzeEmailForCalendarEvent(email: EmailMessage): Promise<EmailAnalysis | null>;
}

export abstract class BaseAIService implements AIService {
  protected config: AIConfig;
  protected model: AIModel;
  protected prompt: AIPrompt | null = null;
  protected context: Message[] = [];
  protected sources: Source[] = [];

  constructor(providerId: string) {
    const providerSettings = aiConfig.getProviderConfig(providerId);
    if (!providerSettings) {
      throw new Error(`No configuration found for provider: ${providerId}`);
    }

    // Assuming providerSettings contains fields compatible with AIConfig, minus 'provider'
    // and that AIModel is a type that can accept a string model ID.
    const modelId = providerSettings.defaultModel;
    if (!modelId) {
        throw new Error(`No default model specified in provider settings for ${providerId}`);
    }

    this.config = {
      ...(providerSettings as any), // Use 'as any' to bypass strict checking if AIProvider and AIConfig mostly overlap
      provider: providerId,
      defaultModel: modelId as unknown as AIModel, // Cast via unknown
    };
    this.model = modelId as unknown as AIModel; // Cast via unknown
  }

  async initialize(config: AIConfig): Promise<void> {
    this.config = config;
    this.model = config.defaultModel;
  }

  setModel(model: AIModel): void {
    this.model = model;
  }

  getModel(): AIModel {
    return this.model;
  }

  abstract sendMessage(message: Message): Promise<Message>;
  abstract generateResponse(messages: Message[]): Promise<string>;
  abstract getCompletion(prompt: string, options?: {
    maxTokens?: number;
    temperature?: number;
    stopSequences?: string[];
  }): Promise<string>;
  abstract getEmbedding(text: string): Promise<number[]>;

  setPrompt(prompt: AIPrompt): void {
    this.prompt = prompt;
  }

  getPrompt(): AIPrompt | null {
    return this.prompt;
  }

  clearContext(): void {
    this.context = [];
    this.sources = [];
  }

  getContext(): Message[] {
    return this.context;
  }

  extractVariables(_content: string): Record<string, unknown> {
    // Default implementation - override in specific services
    return {};
  }

  validateResponse(response: string): boolean {
    // Default implementation - override in specific services
    return response.length > 0;
  }

  getConfig(): AIConfig {
    return this.config;
  }

  updateConfig(config: Partial<AIConfig>): void {
    this.config = { ...this.config, ...config };
  }

  protected getApiKey(providerId: string): string {
    return aiConfig.getApiKey(providerId);
  }

  protected async validateProvider(providerId: string): Promise<void> {
    if (!aiConfig.isEnabled(providerId)) {
      throw new Error(`AI provider ${providerId} is not enabled or configured`);
    }
  }

  protected getProviderConfig(providerId: string) {
    return aiConfig.getProviderConfig(providerId);
  }

  protected validateApiKey(key: string | undefined, expectedPrefix?: string) {
    if (isTestKey(key)) {
      return true;
    }

    if (!key) {
      throw new Error('API key is required');
    }

    if (expectedPrefix && !key.startsWith(expectedPrefix)) {
      throw new Error(`Invalid API key format. Expected prefix: ${expectedPrefix}`);
    }

    return true;
  }

  protected getGeminiKey(): string {
    const key = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (isTestKey(key)) {
      return key;
    }

    try {
      this.validateApiKey(key, 'AIza');
      return key || '';
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        return 'test-gemini-key';
      }
      throw error;
    }
  }

  protected handleError(error: unknown, service: string): never {
    console.error(`${service} API Error:`, error);
    throw error;
  }

  // Default implementations for task-related methods
  async enhanceTask(_task: Task): Promise<ResponseWithSources<Task>> {
    throw new Error('Method not implemented');
  }

  async estimateTaskDuration(_task: Task): Promise<ResponseWithSources<number>> {
    throw new Error('Method not implemented');
  }

  async optimizeTaskSchedule(_tasks: Task[]): Promise<ResponseWithSources<Task[]>> {
    throw new Error('Method not implemented');
  }

  // Default implementations for event-related methods
  async suggestEventTimes(_event: Partial<Event>): Promise<ResponseWithSources<Date[]>> {
    throw new Error('Method not implemented');
  }

  async analyzeScheduleConflicts(_events: Event[]): Promise<ResponseWithSources<ScheduleAnalysisResult>> {
    throw new Error('Method not implemented');
  }

  // Abstract declaration for the new method, to be implemented by concrete services
  abstract analyzeEmailForCalendarEvent(email: EmailMessage): Promise<EmailAnalysis | null>;

  // Source-related methods
  async getRelevantSources(query: string): Promise<Source[]> {
    // Default implementation - override in specific services
    return this.sources.filter(source => 
      source.content.toLowerCase().includes(query.toLowerCase())
    );
  }

  getSourcesByType(type: string): Source[] {
    return this.sources.filter(source => source.type === type);
  }

  getSourcesByConfidence(minConfidence: number): Source[] {
    return this.sources.filter(source => source.confidence >= minConfidence);
  }
} 