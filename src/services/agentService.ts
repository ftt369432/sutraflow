import { GoogleGenerativeAI } from '@google/generative-ai';
import { AgentAction, AgentResponse } from '../types/agent';
import { getMockAgentResponse } from './mockAgentService';

// Create Gemini client
const genAI = import.meta.env.VITE_GEMINI_API_KEY ? 
  new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY) : null;

// Get AI guidance for an agent
export async function getAIGuidance(
  context: string,
  userQuery: string,
  options = { temperature: 0.7, maxTokens: 1024 }
): Promise<AgentResponse> {
  // If Gemini API key is missing, use mock response
  if (!genAI) {
    console.log('Using mock agent service (no Gemini API key)');
    return getMockAgentResponse(userQuery);
  }

  try {
    const prompt = `
    Context information:
    ${context}
    
    As an AI assistant agent, provide guidance for the following user request:
    ${userQuery}
    
    Respond with:
    1. A helpful, informative response
    2. Suggested actions the user might want to take
    3. Any followup questions to clarify their request
    `;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract suggested actions (simplified parsing)
    const suggestedActions = extractSuggestedActions(text);
    
    return {
      response: text,
      suggestedActions,
      success: true
    };
  } catch (error) {
    console.error('Error getting AI guidance:', error);
    return {
      response: 'Sorry, I encountered an error while processing your request.',
      suggestedActions: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Helper function to extract suggested actions
function extractSuggestedActions(text: string): AgentAction[] {
  // Simple extraction based on bullet points or numbered lists
  const actionMatches = text.match(/[-*] (.*?)(?=\n[-*]|\n\n|$)|(^\d+\.\s+)(.*?)(?=\n\d+\.|\n\n|$)/gm);
  
  if (!actionMatches) return [];
  
  return actionMatches
    .slice(0, 3) // Limit to 3 actions
    .map(actionText => {
      const cleanedText = actionText.replace(/^[-*\d.\s]+/, '').trim();
      return {
        label: cleanedText,
        actionType: 'suggestion',
        payload: cleanedText
      };
    });
}