// Temporary Direct Groq Service - bypasses CORS issues
export class DirectGroqService {
  private apiKey: string;
  private baseUrl: string = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_GROQ_API_KEY || '';
  }

  async generateText(prompt: string, options: any = {}): Promise<string> {
    try {
      console.log('🚀 DirectGroqService: Generating text directly via Groq API');
      
      // Note: This will likely fail due to CORS, but worth trying
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: options.model || 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: options.systemPrompt || "You are a helpful AI assistant."
            },
            {
              role: 'user', 
              content: prompt
            }
          ],
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 1000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No choices returned from Groq API');
      }

      const message = data.choices[0].message.content;
      console.log('✅ DirectGroqService: Response received');
      return message;
    } catch (error) {
      console.error('❌ DirectGroqService: Error generating text:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const directGroqService = new DirectGroqService();