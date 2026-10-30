import OpenAI from 'openai';

const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!openaiApiKey) {
  throw new Error('VITE_OPENAI_API_KEY is not set in environment variables.');
}

const openai = new OpenAI({
  apiKey: openaiApiKey,
  dangerouslyAllowBrowser: true // Ensure this is acceptable for your security model
});

export const getOpenAIResponse = async (prompt: string): Promise<string | null> => {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Consider making this configurable
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant focused on providing clear, accurate, and concise responses.'
        },
        { 
          role: 'user', 
          content: prompt 
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    return completion.choices[0]?.message?.content || null;
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    // It might be better to throw a custom error or return a specific error object
    throw new Error(error.message || 'Failed to get response from OpenAI');
  }
};
