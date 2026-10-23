/**
 * Task Capability - Auto-navigation and task management from AI chat
 * Enables seamless task operations from any AI chat interaction
 */

import { AICapability, CapabilityResult } from './types';

export class TaskCapability implements AICapability {
  name = 'task';
  version = '1.0.0';
  description = 'Manage tasks and auto-navigate to task management pages';

  /**
   * Detect task-related intents in user input
   */
  async detectIntent(input: string, context?: any): Promise<boolean | object> {
    const taskKeywords = [
      // Direct task commands
      'task', 'todo', 'reminder', 'deadline', 'assignment', 'work',
      'complete', 'finish', 'done', 'pending', 'overdue',
      
      // Task actions
      'create task', 'add task', 'new task', 'task list', 'todo list',
      'mark complete', 'mark done', 'check off', 'finish task',
      'delete task', 'remove task', 'update task', 'edit task',
      
      // Task management
      'manage tasks', 'task management', 'task manager', 'productivity',
      'organize', 'prioritize', 'urgent', 'important', 'priority',
      
      // Task navigation
      'open tasks', 'go to tasks', 'show tasks', 'task page',
      'navigate to tasks', 'task app', 'my tasks', 'view tasks',
      
      // Task status
      'progress', 'status', 'tracking', 'follow up', 'check status',
      'what\'s pending', 'what\'s due', 'upcoming tasks'
    ];

    const input_lower = input.toLowerCase();
    
    // Check for direct task keywords
    const hasTaskKeyword = taskKeywords.some(keyword => 
      input_lower.includes(keyword)
    );

    // Check for task patterns
    const taskPatterns = [
      /(?:create|add|new).*(?:task|todo|reminder)/i,
      /(?:complete|finish|done).*(?:task|work|assignment)/i,
      /(?:manage|organize|prioritize).*(?:tasks|work|todos)/i,
      /(?:check|view|see|show).*(?:tasks|todos|list|progress)/i,
      /(?:what.*(?:pending|due|upcoming|overdue))/i,
      /(?:go to|open|show|navigate).*(?:tasks|todo|task manager)/i,
      /(?:mark.*(?:complete|done|finished))/i,
      /(?:remind.*me|set.*reminder)/i
    ];

    const hasTaskPattern = taskPatterns.some(pattern => 
      pattern.test(input)
    );

    // Detect email-to-task scenarios
    const emailTaskPatterns = [
      /create.*task.*from.*email/i,
      /add.*task.*from.*message/i,
      /task.*based.*email/i,
      /follow.*up.*task/i,
      /reminder.*from.*email/i
    ];

    const hasEmailTaskPattern = emailTaskPatterns.some(pattern => 
      pattern.test(input)
    );

    // Detect proactive task suggestions
    const proactivePatterns = [
      /(?:should|need to|have to|must).*(?:do|complete|finish)/i,
      /(?:don't forget|remember to|make sure)/i,
      /(?:due|deadline|urgent|important)/i
    ];

    const hasProactivePattern = proactivePatterns.some(pattern => 
      pattern.test(input)
    );

    const confidence = hasTaskKeyword ? 0.8 : 
                      hasTaskPattern ? 0.7 : 
                      hasEmailTaskPattern ? 0.9 : 
                      hasProactivePattern ? 0.6 : 0;

    if (confidence > 0.5) {
      return {
        confidence,
        intent: hasEmailTaskPattern ? 'email_to_task' : 
                hasTaskPattern ? 'task_action' : 
                hasProactivePattern ? 'proactive_task' : 'task_navigation',
        keywords: taskKeywords.filter(keyword => input_lower.includes(keyword))
      };
    }

    return false;
  }

  /**
   * Execute task-related capabilities
   */
  async execute(input: string, context?: any): Promise<CapabilityResult> {
    try {
      const intent = await this.detectIntent(input, context);
      
      if (!intent || typeof intent === 'boolean') {
        return {
          success: false,
          message: 'No task intent detected',
          data: null
        };
      }

      const intentData = intent as any;
      const action = this.determineTaskAction(input, intentData);

      console.log('✅ Task Capability executing:', action);

      switch (action.type) {
        case 'navigate_tasks':
          return await this.handleTaskNavigation(action, context);
          
        case 'create_task':
          return await this.handleTaskCreation(action, input, context);
          
        case 'view_tasks':
          return await this.handleTaskView(action, context);
          
        case 'manage_tasks':
          return await this.handleTaskManagement(action, context);
          
        case 'email_to_task':
          return await this.handleEmailToTask(action, input, context);
          
        case 'proactive_task':
          return await this.handleProactiveTask(action, input, context);
          
        default:
          return await this.handleGenericTaskAction(action, input, context);
      }
    } catch (error) {
      console.error('❌ Task Capability error:', error);
      return {
        success: false,
        message: `Task operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: null
      };
    }
  }

  /**
   * Determine the specific task action to take
   */
  private determineTaskAction(input: string, intent: any) {
    const input_lower = input.toLowerCase();

    // Navigation patterns
    if (input_lower.includes('open tasks') || 
        input_lower.includes('go to tasks') ||
        input_lower.includes('task page') ||
        input_lower.includes('show tasks') ||
        input_lower.includes('navigate to tasks')) {
      return { type: 'navigate_tasks', reason: 'Direct navigation request' };
    }

    // Task creation patterns
    if (input_lower.includes('create task') ||
        input_lower.includes('add task') ||
        input_lower.includes('new task') ||
        input_lower.includes('set reminder')) {
      return { type: 'create_task', reason: 'Task creation request' };
    }

    // Task viewing patterns
    if (input_lower.includes('view tasks') ||
        input_lower.includes('check tasks') ||
        input_lower.includes('task list') ||
        input_lower.includes('todo list') ||
        input_lower.includes('what\'s pending') ||
        input_lower.includes('what\'s due')) {
      return { type: 'view_tasks', reason: 'Task viewing request' };
    }

    // Task management patterns
    if (input_lower.includes('manage tasks') ||
        input_lower.includes('task management') ||
        input_lower.includes('prioritize') ||
        input_lower.includes('organize')) {
      return { type: 'manage_tasks', reason: 'Task management request' };
    }

    // Email to task patterns
    if (intent.intent === 'email_to_task') {
      return { type: 'email_to_task', reason: 'Email-based task operation' };
    }

    // Proactive task patterns
    if (intent.intent === 'proactive_task') {
      return { type: 'proactive_task', reason: 'Proactive task suggestion' };
    }

    // Default task action
    return { type: 'navigate_tasks', reason: 'Generic task request' };
  }

  /**
   * Handle task navigation
   */
  private async handleTaskNavigation(action: any, context?: any): Promise<CapabilityResult> {
    console.log('✅ Navigating to tasks page...');

    // Trigger auto-navigation to tasks
    const navigationEvent = new CustomEvent('autonomousNavigation', {
      detail: {
        type: 'tasks',
        route: '/tasks',
        reason: 'AI-triggered task navigation',
        timestamp: new Date().toISOString(),
        context: {
          source: 'ai_chat',
          action: action.reason
        }
      }
    });

    // Dispatch the navigation event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(navigationEvent);
    }

    return {
      success: true,
      message: '✅ **Opening Task Manager**\n\nNavigating to your task management view where you can:\n- View all your tasks\n- Create new tasks\n- Mark tasks as complete\n- Organize and prioritize\n- Track progress',
      data: {
        action: 'navigate',
        route: '/tasks',
        navigationTriggered: true
      },
      navigationTriggered: true
    };
  }

  /**
   * Handle task creation
   */
  private async handleTaskCreation(action: any, input: string, context?: any): Promise<CapabilityResult> {
    console.log('✅ Handling task creation...');

    // Extract task details from input
    const taskDetails = this.extractTaskDetails(input);

    // Navigate to tasks with task creation context
    const navigationEvent = new CustomEvent('autonomousNavigation', {
      detail: {
        type: 'tasks',
        route: '/tasks',
        reason: 'AI-triggered task creation',
        timestamp: new Date().toISOString(),
        context: {
          source: 'ai_chat',
          action: 'create_task',
          taskDetails
        }
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(navigationEvent);
    }

    return {
      success: true,
      message: `✅ **Creating New Task**\n\nOpening task manager to create your task:\n${taskDetails.title ? `- **Task**: ${taskDetails.title}` : ''}\n${taskDetails.priority ? `- **Priority**: ${taskDetails.priority}` : ''}\n${taskDetails.dueDate ? `- **Due**: ${taskDetails.dueDate}` : ''}\n\nYou can modify the details once the task manager opens.`,
      data: {
        action: 'create_task',
        route: '/tasks',
        navigationTriggered: true,
        taskDetails
      },
      navigationTriggered: true
    };
  }

  /**
   * Handle task view requests
   */
  private async handleTaskView(action: any, context?: any): Promise<CapabilityResult> {
    return await this.handleTaskNavigation(action, context);
  }

  /**
   * Handle task management
   */
  private async handleTaskManagement(action: any, context?: any): Promise<CapabilityResult> {
    console.log('✅ Opening task management...');

    const navigationEvent = new CustomEvent('autonomousNavigation', {
      detail: {
        type: 'tasks',
        route: '/tasks',
        reason: 'AI-triggered task management',
        timestamp: new Date().toISOString(),
        context: {
          source: 'ai_chat',
          action: 'manage_tasks'
        }
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(navigationEvent);
    }

    return {
      success: true,
      message: '✅ **Task Management**\n\nOpening task manager for comprehensive task management. You can:\n- Organize tasks by priority\n- Set deadlines and reminders\n- Track completion status\n- Create task workflows\n- Analyze productivity',
      data: {
        action: 'manage_tasks',
        route: '/tasks',
        navigationTriggered: true
      },
      navigationTriggered: true
    };
  }

  /**
   * Handle email-to-task operations
   */
  private async handleEmailToTask(action: any, input: string, context?: any): Promise<CapabilityResult> {
    console.log('✅ Creating task from email context...');

    const navigationEvent = new CustomEvent('autonomousNavigation', {
      detail: {
        type: 'tasks',
        route: '/tasks',
        reason: 'AI-triggered email-to-task conversion',
        timestamp: new Date().toISOString(),
        context: {
          source: 'ai_chat',
          action: 'email_to_task',
          emailContext: context?.selectedEmail || null
        }
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(navigationEvent);
    }

    return {
      success: true,
      message: '✅ **Creating Task from Email**\n\nOpening task manager to create a task based on the email context. The system will:\n- Extract relevant details from the email\n- Set appropriate priority and deadline\n- Create follow-up reminders\n- Link back to the original email',
      data: {
        action: 'email_to_task',
        route: '/tasks',
        navigationTriggered: true,
        emailContext: context?.selectedEmail
      },
      navigationTriggered: true
    };
  }

  /**
   * Handle proactive task suggestions
   */
  private async handleProactiveTask(action: any, input: string, context?: any): Promise<CapabilityResult> {
    console.log('✅ Handling proactive task suggestion...');

    const taskDetails = this.extractTaskDetails(input);

    const navigationEvent = new CustomEvent('autonomousNavigation', {
      detail: {
        type: 'tasks',
        route: '/tasks',
        reason: 'AI-triggered proactive task suggestion',
        timestamp: new Date().toISOString(),
        context: {
          source: 'ai_chat',
          action: 'proactive_task',
          taskDetails,
          originalInput: input
        }
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(navigationEvent);
    }

    return {
      success: true,
      message: `✅ **Task Suggestion Detected**\n\nI noticed you mentioned something that might need tracking. Opening task manager to help you:\n- Create a reminder for this item\n- Set appropriate deadlines\n- Track completion\n- Avoid missing important tasks\n\n*Suggested task: "${taskDetails.title || input}"*`,
      data: {
        action: 'proactive_task',
        route: '/tasks',
        navigationTriggered: true,
        taskDetails,
        suggestion: true
      },
      navigationTriggered: true
    };
  }

  /**
   * Handle generic task actions
   */
  private async handleGenericTaskAction(action: any, input: string, context?: any): Promise<CapabilityResult> {
    return await this.handleTaskNavigation(action, context);
  }

  /**
   * Extract task details from user input
   */
  private extractTaskDetails(input: string) {
    const details: any = {};

    // Extract potential task title
    const titlePatterns = [
      /(?:create|add|new)\s+task\s+(?:to\s+)?([^,]+?)(?:\s+(?:for|on|by|with)|$)/i,
      /(?:remind.*me\s+to\s+|need\s+to\s+|have\s+to\s+|must\s+)([^,]+?)(?:\s+(?:for|on|by|with)|$)/i,
      /(?:don't forget to\s+|remember to\s+)([^,]+?)(?:\s+(?:for|on|by|with)|$)/i
    ];

    for (const pattern of titlePatterns) {
      const match = input.match(pattern);
      if (match) {
        details.title = match[1].trim();
        break;
      }
    }

    // If no specific pattern, try to extract the main action
    if (!details.title) {
      // Remove common task prefixes and suffixes
      let cleanInput = input
        .replace(/^(create|add|new|set)\s+(task|todo|reminder)\s*/i, '')
        .replace(/\s+(task|todo|reminder)$/i, '')
        .trim();
      
      if (cleanInput.length > 0 && cleanInput.length < 100) {
        details.title = cleanInput;
      }
    }

    // Extract priority
    if (input.toLowerCase().includes('urgent') || input.toLowerCase().includes('asap')) {
      details.priority = 'urgent';
    } else if (input.toLowerCase().includes('important') || input.toLowerCase().includes('high')) {
      details.priority = 'high';
    } else if (input.toLowerCase().includes('low') || input.toLowerCase().includes('when possible')) {
      details.priority = 'low';
    } else {
      details.priority = 'medium';
    }

    // Extract potential due date
    const dueDatePatterns = [
      /(?:by|due|before)\s+(today|tomorrow|next week|this week)/i,
      /(?:by|due|before)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
      /(?:by|due|before)\s+(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/,
      /(?:by|due|before)\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i
    ];

    for (const pattern of dueDatePatterns) {
      const match = input.match(pattern);
      if (match) {
        details.dueDate = match[1];
        break;
      }
    }

    return details;
  }
}