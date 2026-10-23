/**
 * Task Assistant Utilities
 * Provides functionality to detect tasks, generate questions, propose solutions, 
 * and coordinate with assistant swarms
 */

import { 
  DetectedTask, 
  ClarifyingQuestion, 
  ProposedSolution,
  AssistantSwarm,
  SwarmContribution
} from '../types/voice';
import { CompleteContext } from './location';

/**
 * Detect a task from user voice input or context
 * @param userInput User's voice transcription or text input
 * @param context The complete context of the user
 * @returns Detected task object or null
 */
export async function detectTask(
  userInput: string, 
  _context: CompleteContext
): Promise<DetectedTask | null> {
  try {
    // In a production environment, this would:
    // 1. Use NLU to extract task intent from user input
    // 2. Consider current context to determine if it's a task request
    // 3. Call a backend API to register the detected task
    
    // For demo purposes, use simple keyword detection
    const taskKeywords = ['create', 'make', 'prepare', 'setup', 'organize', 
                          'develop', 'write', 'plan', 'research', 'analyze'];
    
    const containsTaskKeyword = taskKeywords.some(keyword => 
      userInput.toLowerCase().includes(keyword)
    );
    
    if (!containsTaskKeyword) return null;
    
    // Create a task ID based on the input
    const taskId = `task-${Date.now()}`;
    
    // Extract a task name (simplified demo implementation)
    const taskName = extractTaskName(userInput);
    
        // Create the task object
    const task: DetectedTask = {
      id: taskId,
      name: taskName,
      description: userInput,
      priority: determinePriority(userInput, _context),
      confidence: 0.75, // Mock confidence score
      detectedAt: new Date(),
      source: 'voice',
      status: 'detected'
    };

    // In production, would call API to save this task
    console.log('Detected task:', task);

    return task;
  } catch (error) {
    console.error('Error detecting task:', error);
    return null;
  }
}

/**
 * Extract a task name from user input
 * @param {string} userInput - User's voice transcription or text input
 * @returns {string} Extracted task name
 */
function extractTaskName(userInput: string): string {
  // In production, would use NLP to extract task name
  // For demo, use a simple heuristic
  const words = userInput.split(' ');
  const taskKeywordIndex = words.findIndex(word => 
    ['create', 'make', 'prepare', 'setup', 'organize', 
     'develop', 'write', 'plan', 'research', 'analyze'].includes(word.toLowerCase())
  );
  
  if (taskKeywordIndex >= 0 && taskKeywordIndex < words.length - 1) {
    // Take up to 5 words after the task keyword
    return words.slice(taskKeywordIndex + 1, taskKeywordIndex + 6).join(' ');
  }
  
  // Fallback: use first 5 words
  return words.slice(0, 5).join(' ');
}

/**
 * Determine task priority based on input and context
 * @param {string} userInput - User's voice transcription or text input
 * @param {CompleteContext} context - The complete context of the user
 * @returns {number} Priority level (1-5, where 1 is highest)
 */
function determinePriority(userInput: string, context: CompleteContext): number {
  // Check for urgent keywords
  const urgentKeywords = ['urgent', 'immediately', 'asap', 'emergency', 'critical'];
  if (urgentKeywords.some(keyword => userInput.toLowerCase().includes(keyword))) {
    return 1;
  }
  
  // Check for important keywords
  const importantKeywords = ['important', 'priority', 'significant', 'key'];
  if (importantKeywords.some(keyword => userInput.toLowerCase().includes(keyword))) {
    return 2;
  }
  
  // Consider time context
  if (context.timeContext?.isWorkHours) {
    return 3; // Medium priority during work hours
  }
  
  // Default priority
  return 4;
}

/**
 * Generate clarifying questions for a task
 * @param task The detected task
 * @param context The complete context of the user
 * @returns List of clarifying questions
 */
export async function generateClarifyingQuestions(
  task: DetectedTask, 
  _context: CompleteContext
): Promise<ClarifyingQuestion[]> {
  try {
    // In production, this would:
    // 1. Use an LLM to generate contextually relevant questions
    // 2. Consider task type, user history, and current context
    // 3. Call a backend API to register the questions
    
    // For demo purposes, create standard questions based on task name
    const questions: ClarifyingQuestion[] = [];
    
    // Add deadline question
    questions.push({
      id: `question-deadline-${task.id}`,
      taskId: task.id,
      question: `When do you need to complete "${task.name}"?`,
      purpose: 'information_gathering',
      priority: 1,
      askedAt: new Date()
    });
    
    // Add question about task complexity
    questions.push({
      id: `question-complexity-${task.id}`,
      taskId: task.id,
      question: `How complex would you say this task is on a scale of 1-5?`,
      purpose: 'information_gathering',
      priority: 2,
      askedAt: new Date()
    });
    
    // Add contextual questions
    if (task.name.toLowerCase().includes('presentation')) {
      questions.push({
        id: `question-audience-${task.id}`,
        taskId: task.id,
        question: `Who is the audience for this presentation?`,
        purpose: 'clarification',
        priority: 1,
        askedAt: new Date()
      });
    } else if (task.name.toLowerCase().includes('report')) {
      questions.push({
        id: `question-data-${task.id}`,
        taskId: task.id,
        question: `What data sources should I use for this report?`,
        purpose: 'information_gathering',
        priority: 1,
        askedAt: new Date()
      });
    }
    
    // Add standard confirmation question
    questions.push({
      id: `question-confirm-${task.id}`,
      taskId: task.id,
      question: `Would you like me to handle this task for you now?`,
      purpose: 'confirmation',
      priority: 3,
      askedAt: new Date()
    });
    
    // In production, would call API to save these questions
    console.log('Generated questions:', questions);
    
    return questions;
  } catch (error) {
    console.error('Error generating questions:', error);
    return [];
  }
}

/**
 * Generate solution proposals for a task
 * @param task The detected task
 * @param context The complete context of the user
 * @param questionAnswers Answers to clarifying questions
 * @returns List of proposed solutions
 */
export async function generateSolutionProposals(
  task: DetectedTask,
  _context: CompleteContext,
  _questionAnswers: Record<string, string> = {}
): Promise<ProposedSolution[]> {
  try {
    // In production, this would:
    // 1. Use an LLM to generate contextually relevant solutions
    // 2. Consider task type, user preferences, and clarifying answers
    // 3. Call a backend API to register the solutions
    
    // For demo purposes, create standard solutions based on task name
    const solutions: ProposedSolution[] = [];
    
    // Basic solution for any task
    solutions.push({
      id: `solution-basic-${task.id}`,
      taskId: task.id,
      name: 'AI-Assisted Completion',
      description: `I'll help you complete "${task.name}" step by step with AI guidance.`,
      approach: 'Interactive guidance and assistance',
      status: 'proposed',
      estimatedTimeMinutes: 15
    });
    
    // Full automation solution
    solutions.push({
      id: `solution-auto-${task.id}`,
      taskId: task.id,
      name: 'Full AI Automation',
      description: `I'll completely automate "${task.name}" using my assistant swarm.`,
      approach: 'Swarm of specialized AI assistants working together',
      status: 'proposed',
      estimatedTimeMinutes: 20
    });
    
    // Add task-specific solutions
    if (task.name.toLowerCase().includes('presentation')) {
      solutions.push({
        id: `solution-presentation-${task.id}`,
        taskId: task.id,
        name: 'Presentation Generator',
        description: 'I can generate a complete presentation with slides, speaker notes, and visualizations.',
        approach: 'Content generation + design + data visualization',
        status: 'proposed',
        estimatedTimeMinutes: 10
      });
    } else if (task.name.toLowerCase().includes('report')) {
      solutions.push({
        id: `solution-report-${task.id}`,
        taskId: task.id,
        name: 'Comprehensive Report Builder',
        description: 'I can compile a detailed report with executive summary, data analysis, and recommendations.',
        approach: 'Data analysis + document generation + insights extraction',
        status: 'proposed',
        estimatedTimeMinutes: 12
      });
    } else if (task.name.toLowerCase().includes('meeting')) {
      solutions.push({
        id: `solution-meeting-${task.id}`,
        taskId: task.id,
        name: 'Meeting Preparation Package',
        description: 'I can prepare an agenda, gather relevant materials, and create briefing notes.',
        approach: 'Document analysis + summarization + agenda creation',
        status: 'proposed',
        estimatedTimeMinutes: 8
      });
    }
    
    // In production, would call API to save these solutions
    console.log('Generated solutions:', solutions);
    
    return solutions;
  } catch (error) {
    console.error('Error generating solutions:', error);
    return [];
  }
}

/**
 * Create and start an assistant swarm for a complex task
 * @param task The detected task
 * @param solution The accepted solution
 * @param context The complete context of the user
 * @returns The created assistant swarm or null
 */
export async function createAssistantSwarm(
  task: DetectedTask,
  solution: ProposedSolution,
  _context: CompleteContext
): Promise<AssistantSwarm | null> {
  try {
    // In production, this would:
    // 1. Call backend API to create a swarm for this task
    // 2. Determine optimal assistants based on task and solution
    // 3. Create a coordination plan for the assistants
    
    // For demo purposes, create a mock swarm
    const swarmId = `swarm-${task.id}`;
    const components = generateSwarmComponents(task, solution);
    
    const swarm: AssistantSwarm = {
      id: swarmId,
      taskId: task.id,
      orchestratorAssistantId: 'orchestrator-1',
      startedAt: new Date(),
      status: 'active',
      swarmSize: components.length + 1, // +1 for orchestrator
      coordinationPlan: {
        components: components.map(c => c.name),
        assignmentStrategy: 'parallel',
        expectedDuration: solution.estimatedTimeMinutes || 15
      }
    };
    
    // In production, would call API to create this swarm
    console.log('Created swarm:', swarm);
    
    // Simulate starting the swarm
    initiateSwarmExecution(swarm, components, task, solution);
    
    return swarm;
  } catch (error) {
    console.error('Error creating swarm:', error);
    return null;
  }
}

/**
 * Generate components for a swarm based on task and solution
 * @param task The detected task
 * @param solution The accepted solution
 * @returns List of swarm components
 */
function generateSwarmComponents(
  task: DetectedTask,
  _solution: ProposedSolution
): Array<{name: string, description: string}> {
  // Basic components for any task
  const components = [
    {
      name: 'information-gathering',
      description: 'Collect relevant data and context'
    },
    {
      name: 'content-generation',
      description: 'Create the primary content'
    },
    {
      name: 'quality-review',
      description: 'Review and improve the output'
    }
  ];
  
  // Add task-specific components
  if (task.name.toLowerCase().includes('presentation')) {
    components.push(
      {
        name: 'slide-design',
        description: 'Create visual slide layouts and graphics'
      },
      {
        name: 'narrative-structure',
        description: 'Develop the story flow and key messages'
      }
    );
  } else if (task.name.toLowerCase().includes('report')) {
    components.push(
      {
        name: 'data-analysis',
        description: 'Analyze data and extract insights'
      },
      {
        name: 'visualization-creation',
        description: 'Create charts and data visualizations'
      }
    );
  } else if (task.name.toLowerCase().includes('meeting')) {
    components.push(
      {
        name: 'agenda-creation',
        description: 'Create structured meeting agenda'
      },
      {
        name: 'participant-briefings',
        description: 'Prepare personalized briefings for participants'
      }
    );
  }
  
  return components;
}

/**
 * Simulate swarm execution (in a real implementation, this would interact with a backend)
 * @param swarm The assistant swarm
 * @param components The swarm components
 * @param task The detected task
 * @param solution The accepted solution
 */
function initiateSwarmExecution(
  _swarm: AssistantSwarm,
  components: Array<{name: string, description: string}>,
  task: DetectedTask,
  _solution: ProposedSolution
): void {
  // In production, this would call backend APIs to start the swarm execution
  // For demo purposes, simulate asynchronous execution
  
  console.log(`Starting swarm execution for task "${task.name}"`);
  
  // Simulate components executing (would be real API calls in production)
  components.forEach((component, index) => {
    // Simulate different completion times
    const executionTime = 1000 + (index * 500);
    
    setTimeout(() => {
      console.log(`Component "${component.name}" completed for task "${task.name}"`);
    }, executionTime);
  });
  
  // Simulate swarm completion
  const totalTime = 1000 + (components.length * 500) + 1000;
  setTimeout(() => {
    console.log(`Swarm execution completed for task "${task.name}"`);
    // In production, would update the swarm status via API
  }, totalTime);
}

/**
 * Generate a comprehensive report from swarm activities
 * @param {AssistantSwarm} swarm - The assistant swarm
 * @param {DetectedTask} task - The detected task
 * @param {Array<SwarmContribution>} contributions - Contributions from swarm assistants
 * @returns {string} Formatted comprehensive report
 */
export function generateComprehensiveReport(
  swarm: AssistantSwarm,
  task: DetectedTask,
  contributions: SwarmContribution[]
): string {
  // In production, this would:
  // 1. Aggregate all contributions from the swarm
  // 2. Use an LLM to synthesize and organize the information
  // 3. Format a comprehensive, coherent report
  
  // For demo purposes, create a structured report template
  const report = `
# Task Completion Report: ${task.name}

## Executive Summary
Task "${task.name}" has been completed using a swarm of ${swarm.swarmSize} specialized AI assistants.
The task was completed in ${swarm.coordinationPlan.expectedDuration} minutes.

## Components Completed
${swarm.coordinationPlan.components.map(component => `- ${component}`).join('\n')}

## Key Outputs
${contributions.map(c => `- ${c.contributionType}: ${summarizeContribution(c)}`).join('\n')}

## Next Steps
1. Review the completed work
2. Provide feedback on the quality of the output
3. Implement any necessary adjustments

## Resources Used
- ${swarm.swarmSize} AI assistants
- Execution time: ${swarm.coordinationPlan.expectedDuration} minutes
- ${contributions.length} distinct contributions
`;

  return report;
}

/**
 * Summarize a swarm contribution (simplified)
 * @param {SwarmContribution} contribution - The contribution to summarize
 * @returns {string} Summary of the contribution
 */
function summarizeContribution(contribution: SwarmContribution): string {
  // In production, this would extract and summarize the key content
  // For demo purposes, return a generic summary
  return `Completed ${contribution.status === 'completed' ? 'successfully' : 'with issues'}`;
}

/**
 * Update a task with new status
 * @param {DetectedTask} task - The task to update
 * @param {'detected'|'clarifying'|'planning'|'in_progress'|'delegated'|'completed'} newStatus - The new status
 * @returns {DetectedTask} Updated task
 */
export function updateTaskStatus(
  task: DetectedTask,
  newStatus: 'detected'|'clarifying'|'planning'|'in_progress'|'delegated'|'completed'
): DetectedTask {
  // In production, this would call a backend API
  // For demo purposes, just update the object
  return {
    ...task,
    status: newStatus
  };
}
