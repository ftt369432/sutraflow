import { Agent } from '../types/agents';
import { agentService } from './agentService';

interface TrainingExample {
  input: string;
  expectedOutput: string;
  type: string;
}

class AgentTrainingService {
  private trainingData: Map<string, TrainingExample[]> = new Map();

  async trainAgent(agent: Agent, examples: TrainingExample[]) {
    const results = [];
    let successCount = 0;

    for (const example of examples) {
      try {
        const result = await agentService.performAction(agent, {
          id: crypto.randomUUID(),
          agentId: agent.id,
          type: example.type,
          status: 'pending',
          input: example.input,
          startedAt: new Date()
        });

        const success = this.evaluateResult(result, example.expectedOutput);
        if (success) successCount++;

        results.push({
          success,
          input: example.input,
          expectedOutput: example.expectedOutput,
          actualOutput: result
        });
      } catch (error) {
        console.error('Training error:', error);
      }
    }

    return {
      accuracy: successCount / examples.length,
      results
    };
  }

  private evaluateResult(actual: any, expected: string): boolean {
    // Implement more sophisticated evaluation logic
    return actual.toLowerCase().includes(expected.toLowerCase());
  }

  addTrainingExample(agentType: string, example: TrainingExample) {
    const examples = this.trainingData.get(agentType) || [];
    examples.push(example);
    this.trainingData.set(agentType, examples);
  }

  getTrainingExamples(agentType: string): TrainingExample[] {
    return this.trainingData.get(agentType) || [];
  }
}

export const agentTraining = new AgentTrainingService(); 