import OpenAI from 'openai';

// Initialize OpenAI client with environment variable
export const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true // Note: In production, API calls should be made from a backend server
});

// Helper function to generate text using OpenAI
export async function generateText(prompt: string): Promise<string> {
  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    console.warn('OpenAI API key is not configured');
    return 'AI features are not available - API key not configured';
  }

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
    });

    return completion.choices[0].message.content || '';
  } catch (error) {
    console.error('Error generating text:', error);
    return 'An error occurred while generating text';
  }
}

// Helper function to analyze text using OpenAI
export async function analyzeText(text: string): Promise<any> {
  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    return { error: 'OpenAI API key not configured' };
  }

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ 
        role: "user", 
        content: `Analyze the following text and provide insights:\n\n${text}` 
      }],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Error analyzing text:', error);
    return { error: 'Failed to analyze text' };
  }
}