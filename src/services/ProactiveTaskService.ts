import { AIService } from './ai/aiService';
import { Task, TaskStatus } from '../types/ai';
import { v4 as uuidv4 } from 'uuid';

/**
 * ProactiveTaskService is responsible for detecting tasks in user input
 * and proactively offering assistance to help users complete their work.
 */
export class ProactiveTaskService {
  private aiService: AIService;

  constructor(aiService: AIService) {
    this.aiService = aiService;
  }

  /**
   * Detects if user input contains a task and extracts task information
   * @param input User's message or input
   * @param context Optional context about the user's current work
   * @returns Task object if a task is detected, null otherwise
   */
  async detectTask(input: string, context?: string): Promise<Task | null> {
    const prompt = `Analyze the following user input to determine if it contains a task or work item that could benefit from AI assistance.

User Input: "${input}"
${context ? `Context: ${context}` : ''}

If this input contains a task, return a JSON object with the following structure:
{
  "isTask": true,
  "description": "Clear description of the task",
  "priority": "low" | "medium" | "high",
  "estimatedDuration": "estimated time to complete",
  "category": "type of task (e.g., research, writing, analysis, planning, etc.)",
  "complexity": "simple" | "moderate" | "complex",
  "suggestedApproach": "brief suggestion on how to approach this task"
}

If this input does NOT contain a task, return:
{
  "isTask": false
}

Examples of tasks:
- "I need to prepare a presentation for tomorrow's meeting"
- "Can you help me analyze this contract?"
- "I have to write a report on market trends"
- "I need to research competitors in our industry"

Examples of non-tasks:
- "How are you today?"
- "What's the weather like?"
- "Tell me a joke"

Return only valid JSON.`;

    try {
      const response = await this.aiService.generateText(prompt);
      const analysis = JSON.parse(response);

      if (analysis.isTask) {
        const task: Task = {
          id: uuidv4(),
          description: analysis.description,
          status: 'todo' as TaskStatus,
          createdAt: new Date(),
          priority: analysis.priority || 'medium',
        };

        // Store additional metadata for proactive assistance
        (task as any).metadata = {
          category: analysis.category,
          complexity: analysis.complexity,
          estimatedDuration: analysis.estimatedDuration,
          suggestedApproach: analysis.suggestedApproach,
          detectedAt: new Date(),
          originalInput: input
        };

        return task;
      }

      return null;
    } catch (error) {
      console.error('Error detecting task:', error);
      return null;
    }
  }

  /**
   * Offers proactive assistance for a detected task
   * @param task The task to offer assistance for
   * @param userPreferences Optional user preferences for assistance style
   * @returns Helpful assistance message
   */
  async offerAssistance(task: Task, userPreferences?: {
    assistanceStyle?: 'brief' | 'detailed' | 'step-by-step';
    preferredApproach?: 'collaborative' | 'autonomous' | 'guided';
  }): Promise<string> {
    const metadata = (task as any).metadata || {};
    const style = userPreferences?.assistanceStyle || 'detailed';
    const approach = userPreferences?.preferredApproach || 'collaborative';

    const prompt = `You are a proactive AI assistant. A user has a task that needs completion. Provide helpful assistance based on the task details and user preferences.

Task Details:
- Description: ${task.description}
- Category: ${metadata.category || 'general'}
- Complexity: ${metadata.complexity || 'moderate'}
- Priority: ${task.priority || 'medium'}
- Estimated Duration: ${metadata.estimatedDuration || 'unknown'}
- Suggested Approach: ${metadata.suggestedApproach || 'none provided'}

User Preferences:
- Assistance Style: ${style}
- Preferred Approach: ${approach}

Based on this information, provide a helpful response that:
1. Acknowledges the task
2. Offers specific, actionable assistance
3. Suggests next steps or resources
4. Asks clarifying questions if needed
5. Matches the user's preferred style and approach

Make your response ${style === 'brief' ? 'concise and to-the-point' : style === 'detailed' ? 'comprehensive and thorough' : 'organized as clear steps'}.

For approach:
- Collaborative: Offer to work together, ask questions, suggest joint problem-solving
- Autonomous: Offer to handle parts of the task independently
- Guided: Provide guidance and let the user take the lead

Response:`;

    try {
      const assistance = await this.aiService.generateText(prompt);
      return assistance;
    } catch (error) {
      console.error('Error generating assistance:', error);
      return `I notice you're working on: "${task.description}". I'd be happy to help! What specific aspect would you like assistance with?`;
    }
  }

  /**
   * Analyzes task progress and offers ongoing support
   * @param task The task being worked on
   * @param progress Current progress or status update
   * @returns Supportive message with next steps
   */
  async provideProgressSupport(task: Task, progress: string): Promise<string> {
    const prompt = `The user is working on a task and has provided a progress update. Analyze their progress and provide helpful support.

Original Task: ${task.description}
Progress Update: ${progress}
Task Priority: ${task.priority || 'medium'}

Based on this update, provide:
1. Acknowledgment of their progress
2. Assessment of current status
3. Suggestions for next steps
4. Offer specific help if they seem stuck
5. Encouragement and motivation

Keep the response supportive and actionable.`;

    try {
      const support = await this.aiService.generateText(prompt);
      return support;
    } catch (error) {
      console.error('Error providing progress support:', error);
      return `Great progress on "${task.description}"! How can I help you with the next steps?`;
    }
  }

  /**
   * Suggests task breakdowns for complex tasks
   * @param task The task to break down
   * @returns Array of subtasks
   */
  async suggestTaskBreakdown(task: Task): Promise<Task[]> {
    const metadata = (task as any).metadata || {};
    
    if (metadata.complexity === 'simple') {
      return [task]; // Simple tasks don't need breakdown
    }

    const prompt = `Break down the following task into smaller, manageable subtasks.

Task: ${task.description}
Category: ${metadata.category || 'general'}
Complexity: ${metadata.complexity || 'moderate'}
Estimated Duration: ${metadata.estimatedDuration || 'unknown'}

Return a JSON array of subtasks, each with:
{
  "description": "specific subtask description",
  "priority": "low" | "medium" | "high",
  "estimatedDuration": "time estimate",
  "dependencies": ["list of other subtasks this depends on"],
  "category": "subtask category"
}

Make subtasks:
- Specific and actionable
- Logically ordered
- Appropriately sized (30min - 2hrs each)
- Clear in their deliverables

Return only valid JSON array.`;

    try {
      const response = await this.aiService.generateText(prompt);
      const subtaskData = JSON.parse(response);

      return subtaskData.map((data: any, index: number) => ({
        id: uuidv4(),
        description: data.description,
        status: 'todo' as TaskStatus,
        createdAt: new Date(),
        priority: data.priority || 'medium',
        metadata: {
          parentTaskId: task.id,
          category: data.category,
          estimatedDuration: data.estimatedDuration,
          dependencies: data.dependencies || [],
          order: index
        }
      }));
    } catch (error) {
      console.error('Error suggesting task breakdown:', error);
      return [task]; // Return original task if breakdown fails
    }
  }

  /**
   * Detects when a user might be struggling and offers help
   * @param userInput Recent user input
   * @param conversationHistory Recent conversation context
   * @returns Help offer if struggling is detected, null otherwise
   */
  async detectStruggle(userInput: string, conversationHistory: string[]): Promise<string | null> {
    const prompt = `Analyze the user's recent input and conversation to detect if they might be struggling with a task.

Recent Input: "${userInput}"
Recent Conversation: ${conversationHistory.join('\n')}

Look for signs of struggle such as:
- Expressions of confusion or frustration
- Repeated questions about the same topic
- Requests for help or guidance
- Mentions of being stuck or blocked
- Time pressure or deadline stress
- Uncertainty about next steps

If struggling is detected, return a supportive offer to help. If not, return "NO_STRUGGLE".

Response should be:
- Empathetic and supportive
- Specific to their situation
- Offer concrete assistance
- Encouraging tone

Response:`;

    try {
      const response = await this.aiService.generateText(prompt);
      return response.trim() === 'NO_STRUGGLE' ? null : response;
    } catch (error) {
      console.error('Error detecting struggle:', error);
      return null;
    }
  }
} 