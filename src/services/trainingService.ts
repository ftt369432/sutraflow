import axios from 'axios';

interface TrainingResponse {
  success: boolean;
  message: string;
  // Add other expected properties from the response
}

export const trainAgent = async (agentId: string, trainingData: any): Promise<TrainingResponse> => {
    // Logic to send training data to the AI provider or store it for future training
    // This will now interact with our Netlify function netlify/functions/train.ts
    const response = await axios.post<TrainingResponse>('/api/train', {
        agentId,
        trainingData,
    });
    return response.data;
};
