import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export const OpenAIService = {
  async sendMessage(content: string, modelId: string) {
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content }],
      model: modelId,
    });

    return completion.choices[0]?.message?.content || 'No response';
  }
} as const; 