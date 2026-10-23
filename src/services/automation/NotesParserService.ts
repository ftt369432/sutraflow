/**
 * 🤖 Autonomous Notes Parser Service
 * 
 * Analyzes user notes input and extracts actionable tasks for multi-agent orchestration.
 * Integrates with existing SwarmOrchestrator and Canvas system.
 */

import { v4 as uuidv4 } from 'uuid';

export interface ParsedTask {
  id: string;
  title: string;
  description: string;
  type: 'canvas' | 'email' | 'calendar' | 'research' | 'document' | 'analysis';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDuration: number; // in minutes
  requiredAgents: string[];
  metadata: {
    keywords: string[];
    context: string;
    originalText: string;
  };
  canvasConfig?: {
    documentType: string;
    contentType: string;
    templateHints: string[];
  };
  emailConfig?: {
    recipients: string[];
    subject: string;
    urgency: string;
  };
  calendarConfig?: {
    dateTime?: string;
    duration?: number;
    attendees?: string[];
    location?: string;
  };
}

export interface NotesParsingResult {
  success: boolean;
  totalTasks: number;
  tasks: ParsedTask[];
  suggestedSwarms: SwarmSuggestion[];
  executionPlan: ExecutionStep[];
  estimatedTotalTime: number;
  error?: string;
}

export interface SwarmSuggestion {
  id: string;
  name: string;
  description: string;
  taskIds: string[];
  agentTypes: string[];
  parallelizable: boolean;
}

export interface ExecutionStep {
  id: string;
  title: string;
  tasks: string[];
  dependsOn: string[];
  canRunInParallel: boolean;
  estimatedTime: number;
}

export class NotesParserService {
  private static instance: NotesParserService;

  static getInstance(): NotesParserService {
    if (!NotesParserService.instance) {
      NotesParserService.instance = new NotesParserService();
    }
    return NotesParserService.instance;
  }

  /**
   * 🎯 Main entry point - Parse notes and extract actionable tasks
   */
  async parseNotes(notesInput: string): Promise<NotesParsingResult> {
    try {
      console.log('🔍 NOTES PARSER: Starting analysis of user notes...');
      
      // Validate input
      if (!notesInput?.trim()) {
        return {
          success: false,
          totalTasks: 0,
          tasks: [],
          suggestedSwarms: [],
          executionPlan: [],
          estimatedTotalTime: 0,
          error: 'No notes provided to parse'
        };
      }

      // Step 1: Extract tasks using NLP patterns
      const extractedTasks = await this.extractTasksFromText(notesInput);
      
      // Step 2: Classify and enhance tasks
      const classifiedTasks = await this.classifyTasks(extractedTasks);
      
      // Step 3: Generate swarm suggestions
      const swarmSuggestions = this.generateSwarmSuggestions(classifiedTasks);
      
      // Step 4: Create execution plan
      const executionPlan = this.createExecutionPlan(classifiedTasks, swarmSuggestions);
      
      // Step 5: Calculate total time estimate
      const estimatedTotalTime = classifiedTasks.reduce((total, task) => total + task.estimatedDuration, 0);

      const result: NotesParsingResult = {
        success: true,
        totalTasks: classifiedTasks.length,
        tasks: classifiedTasks,
        suggestedSwarms: swarmSuggestions,
        executionPlan,
        estimatedTotalTime
      };

      console.log('✅ NOTES PARSER: Analysis complete', {
        tasksFound: result.totalTasks,
        swarmsGenerated: result.suggestedSwarms.length,
        estimatedTime: `${Math.round(estimatedTotalTime / 60)}h ${estimatedTotalTime % 60}m`
      });

      return result;

    } catch (error) {
      console.error('❌ NOTES PARSER: Failed to parse notes:', error);
      return {
        success: false,
        totalTasks: 0,
        tasks: [],
        suggestedSwarms: [],
        executionPlan: [],
        estimatedTotalTime: 0,
        error: error instanceof Error ? error.message : 'Unknown parsing error'
      };
    }
  }

  /**
   * 📝 Extract tasks from raw text using pattern matching
   */
  private async extractTasksFromText(text: string): Promise<Partial<ParsedTask>[]> {
    const tasks: Partial<ParsedTask>[] = [];
    
    // Patterns for task detection
    const taskPatterns = [
      // Direct task patterns
      /(?:create|make|build|write|draft|generate)\s+(?:a\s+)?([^.!?]+)/gi,
      /(?:send|email|contact)\s+([^.!?]+)/gi,
      /(?:schedule|book|set up)\s+([^.!?]+)/gi,
      /(?:research|find|investigate|look up)\s+([^.!?]+)/gi,
      /(?:analyze|review|examine)\s+([^.!?]+)/gi,
      
      // Bullet point patterns
      /^[-*•]\s*(.+)$/gm,
      
      // Numbered list patterns
      /^\d+\.?\s*(.+)$/gm,
      
      // Need to patterns
      /(?:need to|should|must|have to)\s+([^.!?]+)/gi,
    ];

    for (const pattern of taskPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const taskText = match[1]?.trim();
        if (taskText && taskText.length > 3) {
          tasks.push({
            id: uuidv4(),
            title: this.extractTitleFromText(taskText),
            description: taskText,
            metadata: {
              keywords: this.extractKeywords(taskText),
              context: this.extractContext(text, match.index),
              originalText: match[0]
            }
          });
        }
      }
    }

    // Remove duplicates based on similarity
    return this.deduplicateTasks(tasks);
  }

  /**
   * 🏷️ Classify tasks and determine types, priorities, and required agents
   */
  private async classifyTasks(tasks: Partial<ParsedTask>[]): Promise<ParsedTask[]> {
    return tasks.map(task => {
      const fullTask: ParsedTask = {
        ...task,
        id: task.id || uuidv4(),
        title: task.title || 'Untitled Task',
        description: task.description || '',
        type: this.determineTaskType(task.description || ''),
        priority: this.determinePriority(task.description || ''),
        estimatedDuration: this.estimateDuration(task.description || ''),
        requiredAgents: this.determineRequiredAgents(task.description || ''),
        metadata: task.metadata || { keywords: [], context: '', originalText: '' }
      };

      // Add specialized config based on task type
      if (fullTask.type === 'canvas') {
        fullTask.canvasConfig = this.generateCanvasConfig(fullTask.description);
      } else if (fullTask.type === 'email') {
        fullTask.emailConfig = this.generateEmailConfig(fullTask.description);
      } else if (fullTask.type === 'calendar') {
        fullTask.calendarConfig = this.generateCalendarConfig(fullTask.description);
      }

      return fullTask;
    }) as ParsedTask[];
  }

  /**
   * 🤖 Generate swarm suggestions for grouped task execution
   */
  private generateSwarmSuggestions(tasks: ParsedTask[]): SwarmSuggestion[] {
    const suggestions: SwarmSuggestion[] = [];

    // Group tasks by type for parallel execution
    const tasksByType = tasks.reduce((groups, task) => {
      if (!groups[task.type]) groups[task.type] = [];
      groups[task.type].push(task);
      return groups;
    }, {} as Record<string, ParsedTask[]>);

    // Create swarm suggestions for each type
    Object.entries(tasksByType).forEach(([type, typeTasks]) => {
      if (typeTasks.length > 1) {
        suggestions.push({
          id: uuidv4(),
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} Processing Swarm`,
          description: `Handle all ${type} tasks in parallel`,
          taskIds: typeTasks.map(t => t.id),
          agentTypes: [...new Set(typeTasks.flatMap(t => t.requiredAgents))],
          parallelizable: true
        });
      }
    });

    // Create comprehensive swarm for complex workflows
    if (tasks.length > 3) {
      suggestions.push({
        id: uuidv4(),
        name: 'Master Orchestration Swarm',
        description: 'Coordinate all tasks with optimal sequencing',
        taskIds: tasks.map(t => t.id),
        agentTypes: [...new Set(tasks.flatMap(t => t.requiredAgents))],
        parallelizable: false
      });
    }

    return suggestions;
  }

  /**
   * 📋 Create execution plan with dependencies and parallelization
   */
  private createExecutionPlan(tasks: ParsedTask[], swarms: SwarmSuggestion[]): ExecutionStep[] {
    const plan: ExecutionStep[] = [];

    // Step 1: Research and analysis tasks (can run in parallel)
    const researchTasks = tasks.filter(t => t.type === 'research' || t.type === 'analysis');
    if (researchTasks.length > 0) {
      plan.push({
        id: uuidv4(),
        title: 'Research & Analysis Phase',
        tasks: researchTasks.map(t => t.id),
        dependsOn: [],
        canRunInParallel: true,
        estimatedTime: Math.max(...researchTasks.map(t => t.estimatedDuration))
      });
    }

    // Step 2: Content creation (depends on research)
    const contentTasks = tasks.filter(t => t.type === 'canvas' || t.type === 'document');
    if (contentTasks.length > 0) {
      plan.push({
        id: uuidv4(),
        title: 'Content Creation Phase',
        tasks: contentTasks.map(t => t.id),
        dependsOn: plan.map(p => p.id),
        canRunInParallel: true,
        estimatedTime: Math.max(...contentTasks.map(t => t.estimatedDuration))
      });
    }

    // Step 3: Communication tasks (depends on content)
    const commTasks = tasks.filter(t => t.type === 'email' || t.type === 'calendar');
    if (commTasks.length > 0) {
      plan.push({
        id: uuidv4(),
        title: 'Communication Phase',
        tasks: commTasks.map(t => t.id),
        dependsOn: plan.map(p => p.id),
        canRunInParallel: true,
        estimatedTime: Math.max(...commTasks.map(t => t.estimatedDuration))
      });
    }

    return plan;
  }

  // Helper methods for classification
  private determineTaskType(description: string): ParsedTask['type'] {
    const desc = description.toLowerCase();
    
    if (this.matchesPattern(desc, ['create', 'write', 'draft', 'document', 'report', 'petition', 'memo'])) {
      return 'canvas';
    } else if (this.matchesPattern(desc, ['email', 'send', 'contact', 'notify', 'message'])) {
      return 'email';
    } else if (this.matchesPattern(desc, ['schedule', 'meet', 'appointment', 'calendar', 'book'])) {
      return 'calendar';
    } else if (this.matchesPattern(desc, ['research', 'find', 'investigate', 'look up', 'search'])) {
      return 'research';
    } else if (this.matchesPattern(desc, ['analyze', 'review', 'examine', 'evaluate', 'assess'])) {
      return 'analysis';
    }
    
    return 'document'; // Default
  }

  private determinePriority(description: string): ParsedTask['priority'] {
    const desc = description.toLowerCase();
    
    if (this.matchesPattern(desc, ['urgent', 'asap', 'immediately', 'critical', 'emergency'])) {
      return 'urgent';
    } else if (this.matchesPattern(desc, ['important', 'priority', 'deadline', 'soon'])) {
      return 'high';
    } else if (this.matchesPattern(desc, ['eventually', 'sometime', 'when possible', 'low priority'])) {
      return 'low';
    }
    
    return 'medium'; // Default
  }

  private estimateDuration(description: string): number {
    const desc = description.toLowerCase();
    
    // Time-based estimates in minutes
    if (this.matchesPattern(desc, ['quick', 'brief', 'short', 'simple'])) {
      return 15;
    } else if (this.matchesPattern(desc, ['detailed', 'comprehensive', 'thorough', 'complex'])) {
      return 120;
    } else if (this.matchesPattern(desc, ['research', 'analyze', 'review'])) {
      return 60;
    } else if (this.matchesPattern(desc, ['create', 'write', 'draft'])) {
      return 45;
    }
    
    return 30; // Default
  }

  private determineRequiredAgents(description: string): string[] {
    const agents: string[] = [];
    const desc = description.toLowerCase();
    
    if (this.matchesPattern(desc, ['legal', 'court', 'petition', 'law', 'attorney'])) {
      agents.push('legal_agent');
    }
    if (this.matchesPattern(desc, ['email', 'send', 'contact', 'message'])) {
      agents.push('email_agent');
    }
    if (this.matchesPattern(desc, ['calendar', 'schedule', 'meet', 'appointment'])) {
      agents.push('calendar_agent');
    }
    if (this.matchesPattern(desc, ['research', 'find', 'investigate', 'search'])) {
      agents.push('research_agent');
    }
    if (this.matchesPattern(desc, ['create', 'write', 'draft', 'document'])) {
      agents.push('document_agent');
    }
    if (this.matchesPattern(desc, ['analyze', 'review', 'examine', 'data'])) {
      agents.push('analysis_agent');
    }
    
    // Always include coordination agent for multi-step tasks
    if (agents.length > 1) {
      agents.push('coordination_agent');
    }
    
    return agents.length > 0 ? agents : ['general_agent'];
  }

  private generateCanvasConfig(description: string) {
    const desc = description.toLowerCase();
    return {
      documentType: this.matchesPattern(desc, ['petition', 'legal']) ? 'legal_petition' : 'general_document',
      contentType: this.matchesPattern(desc, ['form', 'template']) ? 'form' : 'document',
      templateHints: this.extractKeywords(description)
    };
  }

  private generateEmailConfig(description: string) {
    return {
      recipients: this.extractEmails(description),
      subject: this.extractTitleFromText(description),
      urgency: this.determinePriority(description)
    };
  }

  private generateCalendarConfig(description: string) {
    return {
      dateTime: this.extractDateTime(description),
      duration: this.extractDuration(description),
      attendees: this.extractEmails(description),
      location: this.extractLocation(description)
    };
  }

  // Utility methods
  private matchesPattern(text: string, patterns: string[]): boolean {
    return patterns.some(pattern => text.includes(pattern));
  }

  private extractTitleFromText(text: string): string {
    // Extract first meaningful phrase or sentence
    const cleaned = text.replace(/^(create|make|build|write|draft|generate|send|email|schedule)\s*/i, '');
    const firstSentence = cleaned.split(/[.!?]/)[0];
    return firstSentence.length > 50 ? firstSentence.substring(0, 50) + '...' : firstSentence;
  }

  private extractKeywords(text: string): string[] {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    return text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 5);
  }

  private extractContext(text: string, position: number): string {
    const start = Math.max(0, position - 100);
    const end = Math.min(text.length, position + 100);
    return text.substring(start, end);
  }

  private extractEmails(text: string): string[] {
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    return text.match(emailPattern) || [];
  }

  private extractDateTime(text: string): string | undefined {
    // Simple date/time extraction - can be enhanced with NLP libraries
    const datePattern = /\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/;
    return text.match(datePattern)?.[0];
  }

  private extractDuration(text: string): number | undefined {
    const durationPattern = /\b(\d+)\s*(hours?|hrs?|minutes?|mins?)\b/i;
    const match = text.match(durationPattern);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      return unit.startsWith('h') ? value * 60 : value;
    }
    return undefined;
  }

  private extractLocation(text: string): string | undefined {
    // Simple location extraction - looks for "at", "in", "on" followed by location
    const locationPattern = /\b(?:at|in|on)\s+([^,.!?]+)/i;
    return text.match(locationPattern)?.[1]?.trim();
  }

  private deduplicateTasks(tasks: Partial<ParsedTask>[]): Partial<ParsedTask>[] {
    const unique: Partial<ParsedTask>[] = [];
    const seen = new Set<string>();

    for (const task of tasks) {
      const key = task.title?.toLowerCase() || task.description?.toLowerCase() || '';
      if (!seen.has(key) && key.length > 0) {
        seen.add(key);
        unique.push(task);
      }
    }

    return unique;
  }
}

// Export singleton instance
export const notesParserService = NotesParserService.getInstance();
