import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface ResearchResult {
  response: string;
  error?: string;
}

export async function performDeepResearch(content: string): Promise<ResearchResult> {
  if (!genAI) {
    return {
      response: 'Gemini API key not configured. Research feature is disabled.',
      error: 'API key not available'
    };
  }

  try {
    const researchPrompt = `
      You are a comprehensive research assistant. Analyze the following content and provide a detailed research report.
      
      Content to analyze:
      ${content}

      Provide a structured report that includes:
      - Key findings and main points
      - Definitions and background information
      - Relevant laws, regulations, or medical research
      - Case studies and real-world applications
      - Conflicting viewpoints and debates
      - Emerging trends and future implications
      - Citations from valid sources
      
      Format the response in markdown for better readability.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(researchPrompt);
    const response = await result.response;
    
    return {
      response: response.text() || '',
    };
  } catch (error) {
    console.error('Research error:', error);
    return {
      response: 'Error performing research. Please check your API key and try again.',
      error: 'Error processing research request'
    };
  }
}