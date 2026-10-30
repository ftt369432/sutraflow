import axios from 'axios';
import type { Feedback } from '../types/ai'; // Import Feedback type

// VITE_API_URL might be intended for a broader API gateway, 
// but for feedback, we likely want to hit our Netlify function directly.
// If VITE_API_URL is something like http://localhost:3000, then /api/feedback would be appended.
// For Netlify functions, the path is typically /.netlify/functions/feedback or just /api/feedback if redirects are set up.
const feedbackApiUrl = import.meta.env.VITE_API_BASE_URL || ''; // Use VITE_API_BASE_URL or an empty string if not set

interface FeedbackPayload {
  agentId: string;
  response: Record<string, unknown> | string; // Changed from any
  feedback: Feedback; // Changed from any to Feedback type
}

interface FeedbackResponse {
  success: boolean;
  message: string;
  // Add other expected properties from the response
}

export const saveFeedback = async (agentId: string, responseData: Record<string, unknown> | string, feedbackData: Feedback): Promise<FeedbackResponse> => {
    const payload: FeedbackPayload = {
        agentId,
        response: responseData,
        feedback: feedbackData
    };
    // This will now interact with our Netlify function netlify/functions/feedback.ts
    // Ensure the endpoint path matches your Netlify function route (e.g., /api/feedback)
    const response = await axios.post<FeedbackResponse>(`${feedbackApiUrl}/api/feedback`, payload);
    return response.data;
};
