import { useState } from 'react';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, make API calls through your backend
});

export function useOpenAI() {
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (message: string) => {
    setIsLoading(true);
    try {
      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: message }],
        model: 'gpt-3.5-turbo',
      });

      return completion.choices[0].message.content || '';
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { sendMessage, isLoading };
} 