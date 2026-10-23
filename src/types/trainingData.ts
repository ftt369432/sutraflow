export interface TrainingData {
    agentId: string;
    input: string;
    expectedOutput: string;
    feedback: string; // User feedback on the response
    timestamp: Date;
} 