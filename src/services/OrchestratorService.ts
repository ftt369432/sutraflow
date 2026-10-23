import { AIAssistant } from '../types/ai';
import { Task } from '../types/task';
import { AIAssistantService } from './AIAssistantService';
import { AIService } from './ai/aiService';

/**
 * The OrchestratorService is responsible for managing the assistant swarm and coordinating tasks.
 * It will delegate tasks to the appropriate assistants and synthesize the results.
 */
export class OrchestratorService {
  private assistants: AIAssistant[];
  private assistantServices: Map<string, AIAssistantService>;
  private aiService: AIService;

  constructor(assistants: AIAssistant[], aiService: AIService) {
    this.assistants = assistants;
    this.assistantServices = new Map();
    this.aiService = aiService;
    this.assistants.forEach(assistant => {
      // Assuming personality is part of the assistant type or can be derived
      const personality = (assistant as any).personality || { name: 'Default' };
      this.assistantServices.set(assistant.id, new AIAssistantService(personality));
    });
  }

  /**
   * Orchestrates a task by breaking it down into subtasks and delegating them to the appropriate assistants.
   * @param task The task to orchestrate.
   * @returns A summary of the results from the assistant swarm.
   */
  public async orchestrateTask(task: Task): Promise<string> {
    // 1. Decompose the task into subtasks
    const subtasks = await this.decomposeTask(task);

    // 2. Delegate subtasks to the appropriate assistants
    const results = await Promise.all(
      subtasks.map(subtask => {
        const assistant = this.selectAssistantForTask(subtask);
        if (assistant) {
          const assistantService = this.assistantServices.get(assistant.id);
          if (assistantService && subtask.description) {
            // This is a simplified call. The actual implementation will need to handle the input and output of the assistant service.
            // For now, we'll just simulate processing the subtask.
            return assistantService.processInput(subtask.description);
          }
        }
        return Promise.resolve({ text: `No assistant found for subtask: ${subtask.description}` });
      })
    );

    // 3. Synthesize the results
    const synthesizedResult = this.synthesizeResults(results.map(r => r.text));

    return synthesizedResult;
  }

  /**
   * Decomposes a task into a series of subtasks.
   * @param task The task to decompose.
   * @returns An array of subtasks.
   */
  private async decomposeTask(task: Task): Promise<Task[]> {
    const prompt = `Decompose the following task into a series of subtasks. Return the subtasks as a JSON array of objects, where each object has the following properties: "id", "description", "status", and "createdAt".

Task: "${task.description}"`;

    try {
      const result = await this.aiService.generateText(prompt);
      const subtasks = JSON.parse(result);
      return subtasks;
    } catch (error) {
      console.error('Error decomposing task:', error);
      // Fallback to the original task if decomposition fails
      return [{ ...task }];
    }
  }

  /**
   * Selects the best assistant for a given task based on its capabilities.
   * @param task The task to select an assistant for.
   * @returns The selected assistant, or null if no suitable assistant is found.
   */
  private selectAssistantForTask(task: Task): AIAssistant | null {
    // This is a placeholder implementation. A real implementation would use a more sophisticated method to select the assistant.
    // For now, we'll just select the first assistant that has a matching capability.
    const requiredCapability = this.getRequiredCapabilityForTask(task);
    return this.assistants.find(a => a.capabilities.includes(requiredCapability)) || null;
  }

  /**
   * Determines the required capability for a given task.
   * This is a placeholder implementation.
   * @param task The task to get the required capability for.
   * @returns The required capability.
   */
  private getRequiredCapabilityForTask(task: Task): string {
    const description = task.description?.toLowerCase() || '';
    if (description.includes('legal')) {
      return 'legal_analysis';
    }
    if (description.includes('medical')) {
      return 'medical_research';
    }
    if (description.includes('creative')) {
        return 'creative_writing';
    }
    return 'general';
  }

  /**
   * Synthesizes the results from the assistant swarm into a single response.
   * @param results The results from the assistant swarm.
   * @returns A synthesized summary of the results.
   */
  private synthesizeResults(results: string[]): string {
    // This is a placeholder implementation. A real implementation would use a more sophisticated method to synthesize the results.
    return results.join('\n\n');
  }
} 