// Groq AI Service - Simple implementation for easy switching
import { getEnv } from '../../config/env';

export class GroqService {
  private apiKey: string;
  private baseUrl: string = `${(typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || ''}/functions/v1/generate-text`;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || ((typeof import.meta !== 'undefined' && import.meta.env?.VITE_GROQ_API_KEY) || '');
  }

  async generateText(prompt: string, options: any = {}): Promise<string> {
    const env = getEnv();
    const primaryKey = this.apiKey || env.groqApiKey;
    const secondaryKey = env.groqApiKey2;

    const attemptRequest = async (key: string, isSecondary: boolean = false) => {
      if (!key) throw new Error(`${isSecondary ? 'Secondary' : 'Primary'} API key is missing`);
      console.log(`🚀 GroqService: Generating text [${isSecondary ? 'SECONDARY' : 'PRIMARY'}] (Key: ${key.substring(0, 4)}...${key.substring(key.length - 4)})`);
      
      try {
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            prompt,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 1000,
            system_prompt: options.systemPrompt || "You are a helpful AI assistant.",
            model: options.model || (options.image && !env.models.vision.includes('gemini') ? env.models.vision : env.models.chat),
            apiKey: key,
            image: options.image,
            inline: options.inline
          })
        });

        if (response.ok) {
          const data = await response.json();
          return data.generatedText || data.text || '';
        }
        
        console.warn(`⚠️ GroqService: Edge Function returned ${response.status}. Attempting direct Groq API call...`);
      } catch (err) {
        console.warn('⚠️ GroqService: Edge Function unreachable. Attempting direct Groq API call...', err);
      }

      // 🚀 DIRECT FALLBACK
      const directResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: options.model || 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: options.systemPrompt || 'You are a helpful AI assistant.' },
            { role: 'user', content: prompt }
          ],
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 1000
        })
      });

      if (!directResponse.ok) {
        const errorText = await directResponse.text();
        throw new Error(`Direct Groq API error: ${directResponse.status} - ${errorText}`);
      }

      const directData = await directResponse.json();
      return directData.choices?.[0]?.message?.content || '';
    };

    try {
      if (!primaryKey) console.warn('⚠️ GroqService: Primary key missing, will attempt fallback if secondary available');
      return await attemptRequest(primaryKey, false);
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      const isRetryable = errMsg.includes('429') || errMsg.includes('rate_limit') || errMsg.includes('Limit reached') || errMsg.includes('500'); // Including 500 as Edge Function often wraps rate limits in 500

      if (secondaryKey && isRetryable) {
        console.warn(`🔄 GroqService: Primary key failed (${errMsg.substring(0, 50)}...). Rotating to SECONDARY key...`);
        try {
          return await attemptRequest(secondaryKey, true);
        } catch (secondaryError) {
          console.error('❌ GroqService: Secondary key also failed:', secondaryError);
          throw secondaryError;
        }
      }
      console.error('❌ GroqService: Error generating text:', error);
      throw error;
    }
  }

  async generateTextStream(prompt: string, options: any = {}): Promise<AsyncIterable<string>> {
    // For now, fallback to regular generation
    // TODO: Implement streaming in edge function
    const result = await this.generateText(prompt, options);
    return (async function* () {
      yield result;
    })();
  }
}

export const groqService = new GroqService();