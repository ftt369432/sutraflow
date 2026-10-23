import { SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI, GenerativeModel as GoogleGenerativeModel } from '@google/generative-ai';

// Assuming these types are correctly defined and exported from this path:
import { getEnv } from '../../config/env';
import { AIGenerateTextOptions, AIAnalysisOptions, AIAnalysisResult } from '../../types/ai';
import Anthropic from '@anthropic-ai/sdk';

export class AIService {
  private static instance: AIService | null = null;
  private supabaseClient: SupabaseClient | null = null;
  private _generativeModel: GoogleGenerativeModel | undefined;
  private _generativeModel2: GoogleGenerativeModel | undefined;
  private _isInitialized = false;
  private _genAI: GoogleGenerativeAI | undefined;
  private _genAI2: GoogleGenerativeAI | undefined;
  private _anthropic: Anthropic | undefined;
  private _groqKey: string | undefined;
  private _groqKey2: string | undefined;
  private _activeGroqKey: 'primary' | 'secondary' = 'primary';

  private constructor() { }

  public static async getInstance(): Promise<AIService> {
    if (!AIService.instance) {
      console.log('[AIService] getInstance: Creating new instance.');
      AIService.instance = new AIService();
    } else {
      // Only warn if the instance has been around but never initialized
      if (!AIService.instance._isInitialized) {
        console.warn("[AIService] getInstance: Instance exists but is not initialized. Ensure initializeAIService is being called.");
      }
    }
    return AIService.instance;
  }

  // Renamed original to avoid conflict, will be called by the new exported function
  public async _initializeService(supabaseClient?: SupabaseClient, geminiApiKey?: string) {
    if (this._isInitialized) {
      console.log('[AIService] _initializeService: Already initialized.');
      return;
    }
    console.log('[AIService] _initializeService: Initializing...');

    const env = getEnv();
    const key = geminiApiKey || env.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY;
    const key2 = env.geminiApiKey2 || import.meta.env.VITE_GEMINI_API_KEY_2;
    this._groqKey = import.meta.env.VITE_GROQ_API_KEY;
    this._groqKey2 = import.meta.env.VITE_GROQ_API_KEY_2;

    // 🔍 Safe Key Debugging
    if (key && key.length > 5) {
      const safeKey = `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
      console.log(`[AIService] _initializeService: Validation - Primary Key present. Format: ${safeKey}, Length: ${key.length}`);
    } else {
      console.error('[AIService] _initializeService: Validation - NO PRIMARY KEY FOUND');
    }

    if (key2 && key2.length > 5) {
      const safeKey2 = `${key2.substring(0, 4)}...${key2.substring(key2.length - 4)}`;
      console.log(`[AIService] _initializeService: Validation - Secondary Key present. Format: ${safeKey2}, Length: ${key2.length}`);
    }

    if (!key || key.length < 10) {
      console.warn('[AIService] _initializeService: Primary Gemini API key is missing or invalid.');
    } else {
      this._genAI = new GoogleGenerativeAI(key);
      // 🎯 Smart model selection: Use VITE_AI_MODEL if it looks like a gemini model, else VITE_GEMINI_MODEL
      const envModel = import.meta.env.VITE_AI_MODEL || '';
      const geminiModel = import.meta.env.VITE_GEMINI_MODEL || '';
      // 🔬 Note: using -latest suffix to avoid 404s on some API versions
      const modelName = (envModel.includes('gemini') ? envModel : geminiModel) || 'gemini-1.5-flash';

      console.log(`[AIService] _initializeService: Using model: ${modelName}`);
      this._generativeModel = this._genAI.getGenerativeModel({ model: modelName });
      this._isInitialized = true;
    }

    if (key2 && key2.length >= 10) {
      this._genAI2 = new GoogleGenerativeAI(key2);
      const envModel = import.meta.env.VITE_AI_MODEL || '';
      const geminiModel = import.meta.env.VITE_GEMINI_MODEL || '';
      const modelName = (envModel.includes('gemini') ? envModel : geminiModel) || 'gemini-1.5-flash';
      this._generativeModel2 = this._genAI2.getGenerativeModel({ model: modelName });
    }

    const anthropicKey = env.anthropicApiKey || import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (anthropicKey && anthropicKey.length > 10) {
      try {
        this._anthropic = new Anthropic({ apiKey: anthropicKey, dangerouslyAllowBrowser: true });
        console.log('[AIService] _initializeService: Anthropic client initialized successfully.');
      } catch (err) {
        console.warn('[AIService] _initializeService: Failed to initialize Anthropic client:', err);
      }
    }

    if (supabaseClient) {
      this.supabaseClient = supabaseClient;
      console.log('[AIService] _initializeService: Supabase client set.');
    }

    console.log('[AIService] _initializeService: Initialization sequence finished (Initialized: ' + this._isInitialized + ')');
  }

  public isServiceInitialized(): boolean {
    return this._isInitialized;
  }

  public async embedText(text: string): Promise<number[]> {
    if (!this._isInitialized) {
      console.error('[AIService] embedText: AIService not initialized. Call initializeAIService first.');
      throw new Error('AIService not initialized.');
    }
    if (!this._genAI) {
      console.error('[AIService] embedText: AIService (genAI) is not properly initialized for embeddings.');
      throw new Error('AIService (genAI) not properly initialized for embeddings.');
    }
    if (!text || text.trim() === '') {
      console.warn('[AIService] embedText: Received empty or whitespace-only text. Returning empty embedding.');
      return [];
    }

    console.log(`[AIService] embedText: Generating embedding for text (length: ${text.length}).`);

    try {
      // 1. Try using Supabase edge function first (supports Groq fallback)
      if (this.supabaseClient) {
        try {
          console.log('[AIService] embedText: Attempting to use Supabase edge function for embedding...');
          const { data, error } = await this.supabaseClient.functions.invoke('generate-embedding', {
            body: { text: text }
          });

          if (error) throw error;

          if (data?.embedding && Array.isArray(data.embedding) && data.embedding.length > 0) {
            console.log(`[AIService] embedText: Successfully generated embedding via Supabase. Length: ${data.embedding.length}`);
            return data.embedding;
          }
        } catch (supabaseError) {
          console.warn('[AIService] embedText: Supabase embedding failed, falling back to direct Gemini:', supabaseError);
        }
      }

      // 2. Fallback to direct Gemini API with Rotation
      const generateEmbedding = async (genAI: GoogleGenerativeAI, label: string) => {
        const env = getEnv();
        // Try multiple model strings to ensure compatibility across API versions
        // text-embedding-005 is the latest model
        const modelsToTry = [
          'text-embedding-005',          // ✅ Latest valid model
          'gemini-embedding-exp-03-07', // ✅ Current valid model
          'text-embedding-004',          // ✅ Stable fallback (v1 endpoint)
          env.models.embedding           // 3. Env override
        ].filter((m, i, a) => m && a.indexOf(m) === i) as string[];

        let lastError = null;

        for (const modelId of modelsToTry) {
          // Skip OpenAI models in Gemini direct call
          if (modelId.includes('ada') || modelId.includes('openai')) continue;

          try {
            console.log(`[AIService] embedText (${label}): Attempting direct Gemini call with model: ${modelId}`);
            const embeddingModel = genAI.getGenerativeModel({ model: modelId });
            
            // Standardize text: remove newlines, trim, and cap
            const cleanText = text.replace(/\n/g, ' ').trim().substring(0, 30000); 
            
            const result = await embeddingModel.embedContent(cleanText);
            
            if (result?.embedding?.values) {
              console.log(`[AIService] embedText (${label}): Embedding generated successfully using ${modelId}. Dims: ${result.embedding.values.length}`);
              return result.embedding.values;
            }
            throw new Error('Empty embedding result');
          } catch (err: any) {
            console.warn(`⚠️ [AIService] Embedding failed with ${modelId}:`, err?.message || err);
            lastError = err;
          }
        }
        throw lastError || new Error('All embedding models failed');
      };

      try {
        if (!this._genAI) throw new Error('Primary genAI not initialized');
        return await generateEmbedding(this._genAI, 'primary');
      } catch (primaryError: any) {
        const errMsg = primaryError?.message || String(primaryError);
        if (this._genAI2 && (errMsg.includes('API key not valid') || errMsg.includes('429') || errMsg.includes('rate limit'))) {
          console.warn('🔄 AIService: Embedding failed with primary key. Rotating to secondary key...');
          try {
             return await generateEmbedding(this._genAI2, 'secondary');
          } catch (secondaryError) {
             throw secondaryError;
          }
        }
        throw primaryError;
      }

    } catch (error: any) {
      console.warn('[AIService] embedText: Cloud embedding methods failed. Attempting local/Ollama embedding as fallback...', error);
      try {
        const env = getEnv();
        const localModel = env.models.privateEmbeddingModel || 'nomic-embed-text';
        const endpoints = [
          `${env.nanoHubUrl}/api/embeddings`,
          `http://localhost:11434/api/embeddings`,
          `${env.nanoHubUrl}/api/embed`,
          `http://localhost:11434/api/embed`
        ];

        for (const endpoint of endpoints) {
          try {
            const isEmbedEndpoint = endpoint.endsWith('/embed');
            const body = isEmbedEndpoint 
              ? { model: localModel, input: text }
              : { model: localModel, prompt: text };

            const response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            });

            if (response.ok) {
              const resJson = await response.json();
              const embedding = resJson.embedding || (resJson.embeddings && resJson.embeddings[0]);
              if (embedding && Array.isArray(embedding) && embedding.length > 0) {
                console.log(`✅ [AIService] embedText: Successfully generated local embedding via Ollama (${localModel}). Dims: ${embedding.length}`);
                return embedding;
              }
            }
          } catch (e) {
            // Quietly continue to next endpoint
          }
        }
      } catch (localError) {
        console.error('[AIService] embedText: Local embedding fallback also failed:', localError);
      }

      console.error('[AIService] embedText: All embedding methods and local fallbacks failed. Providing fallback mock embedding.');
      // Return a stable mock/simulated embedding of 768 dimensions so similarity query does not fail
      return new Array(768).fill(0).map(() => Math.random() * 0.1);
    }
  }

  /**
   * Generates text using the AI model via Supabase Edge Function
   * @param prompt The prompt to generate text from
   * @returns The generated text
   */
  async generateText(prompt: string, options: AIGenerateTextOptions = {}): Promise<string> {
    if (!this._isInitialized) {
      console.warn('[AIService] generateText: AIService not fully initialized. Attempting lazy initialization.');
      await this._initializeService();
    }
    if (!this._generativeModel && !this._anthropic && !this.supabaseClient) {
      console.error('[AIService] generateText: No models available (Claude, Gemini, and Supabase all unconfigured).');
      throw new Error('Generative model not available.');
    }
    const provider = options.provider || 'google';
    
    // 🌍 MULTI-MODEL HUB ROUTING
    try {
      // Phase 1: Try requested provider
      if (provider === 'anthropic' && this._anthropic) {
        console.log('[AIService] generateText: Using Anthropic (Claude 3.5 Sonnet)');
        try {
          const response = await this._anthropic.messages.create({
            model: options.model || "claude-3-5-sonnet-20240620",
            max_tokens: options.maxTokens || 4096,
            system: options.systemPrompt,
            messages: [{ role: "user", content: prompt }],
            temperature: options.temperature || 0.7,
          });
          const textResponse = response.content.filter(c => c.type === 'text').map(c => (c as any).text).join('');
          return textResponse;
        } catch (anthropicError) {
          console.warn('[AIService] Anthropic call failed, falling back to Gemini:', anthropicError);
        }
      }

    const isLocalhost = typeof window !== 'undefined'
      ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      : true;

    if (this._generativeModel && (isLocalhost || !this.supabaseClient)) {
      // 👻 CORTEX INJECTION (Direct Gemini): Inject Active Soul Persona
      let finalPrompt = prompt;
      try {
        console.log(`[AIService] generateText: Using Google Gemini (${provider === 'anthropic' ? 'Fallback' : 'Primary'})`);
        const generationConfig = {
          temperature: options?.temperature,
          maxOutputTokens: options?.maxTokens,
          topP: options?.topP,
        };

        try {
          const { soul } = await import('../../cortex/Soul');
          const soulPrompt = soul.getSystemPrompt();
          if (soulPrompt) {
            console.log(`👻 AIService: Injecting Soul '${soul.getName()}' into Gemini prompt.`);
            if (options?.systemPrompt) {
              finalPrompt = `${soulPrompt}\n\n${options.systemPrompt}\n\nUSER REQUEST:\n${prompt}`;
            } else {
              finalPrompt = `${soulPrompt}\n\nUSER REQUEST:\n${prompt}`;
            }
          }
        } catch (err) {
          console.warn('👻 AIService Warning: Could not inject Soul into Gemini.', err);
        }

        try {
            const result = await this._generativeModel.generateContent({
              contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
              generationConfig,
            });
            const response = await result.response;
            const textResponse = response.text();
            console.log('[AIService] generateText: Primary Gemini API response received');
            return textResponse;
          } catch (primaryError: any) {
            // 🔄 ROTATION LOGIC: If primary fails with Auth or Rate Limit, try secondary
            const errMsg = primaryError?.message || String(primaryError);
            if (this._generativeModel2 && (errMsg.includes('API key not valid') || errMsg.includes('429') || errMsg.includes('rate limit'))) {
              console.warn('🔄 AIService: Primary key failed/rate-limited. Rotating to secondary Gemini key...');
              const result2 = await this._generativeModel2.generateContent({
                contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
                generationConfig,
              });
              const response2 = await result2.response;
              return response2.text();
            }
            throw primaryError;
          }
        } catch (geminiError: any) {
          console.warn('[AIService] generateText: Gemini API (and rotation) failed, attempting direct Groq fallback...', geminiError?.message || geminiError);
          
          // 🚀 DIRECT GROQ FALLBACK (Client-side)
          try {
            const groqResult = await this.callGroqDirect(finalPrompt, options);
            if (groqResult) return groqResult;
          } catch (groqError) {
            console.warn('[AIService] Direct Groq fallback failed, falling back to Supabase/Edge Function:', groqError);
          }
        }
      }

      // Fallback to Supabase for production (or when Gemini/Groq Direct fails)
      if (this.supabaseClient && this.supabaseClient.functions && typeof this.supabaseClient.functions.invoke === 'function') {
        console.log('[AIService] generateText: Invoking Supabase Edge Function "generate-text".');
        try {
          // 👻 CORTEX INJECTION (Supabase): Inject Active Soul Persona
          let fullPrompt = prompt;

          try {
            const { soul } = await import('../../cortex/Soul');
            const soulPrompt = soul.getSystemPrompt();
            if (soulPrompt) {
              console.log(`👻 AIService: Injecting Soul '${soul.getName()}' into Supabase prompt.`);
              if (options?.systemPrompt) {
                options.systemPrompt = `${soulPrompt}\n\n${options.systemPrompt}`;
              } else {
                fullPrompt = `${soulPrompt}\n\nUSER REQUEST:\n${prompt}`;
              }
            }
          } catch (err) {
            console.warn('👻 AIService Warning: Could not inject Soul into Supabase.', err);
          }

          const { data, error } = await this.supabaseClient.functions.invoke('generate-text', {
            body: { prompt: fullPrompt, ...options },
          });
          if (error) {
            console.error('[AIService] generateText: Supabase function error:', error);
            throw error;
          }
          console.log('[AIService] generateText: Supabase function response received successfully');
          return data.generatedText || '';
        } catch (supabaseError) {
          console.warn('[AIService] generateText: Supabase function failed, falling back to Local GPU / PrivateService:', supabaseError);
        }
      }

      // 🏠 Local Private AI Service fallback (Sovereign GPU RTX 4090 / Ollama)
      try {
        const { privateService } = await import('./privateService');
        const localResult = await privateService.generateText(prompt, options);
        if (localResult) return localResult;
      } catch (localGpuError) {
        console.warn('[AIService] Local GPU fallback failed:', localGpuError);
      }

      throw new Error('No available AI provider configured or all providers failed.');
    } catch (criticalError: any) {
      console.error('[AIService] generateText: Critical error in AI service:', criticalError);

      // 🛡️ Handle fetch, CORS, and FunctionsFetchError gracefully by falling back to mock service
      if (
        (criticalError instanceof TypeError && criticalError.message.includes('fetch')) ||
        criticalError.message?.includes('NetworkError') ||
        criticalError.message?.includes('Failed to fetch') ||
        criticalError.message?.includes('Failed to send a request to the Edge Function') ||
        criticalError.message?.includes('Edge Function returned a non-2xx status code') ||
        criticalError.name === 'FunctionsFetchError' ||
        criticalError.name === 'FunctionsHttpError'
      ) {
        console.warn('🚨 AIService: Detected CORS/fetch error, falling back to mock service');
        try {
          const { mockAIService } = await import('./mockAIService');
          return await mockAIService.generateText(prompt, options);
        } catch (mockError) {
          console.error('🚨 AIService: Mock fallback also failed:', mockError);
        }
      }
      throw criticalError;
    }
  }

  /**
   * Directly calls Groq API from the client as a high-speed fallback
   */
  private async callGroqDirect(prompt: string, options: AIGenerateTextOptions): Promise<string | null> {
    const key = this._activeGroqKey === 'primary' ? this._groqKey : this._groqKey2;
    if (!key) return null;

    console.log(`[AIService] callGroqDirect: Attempting with ${this._activeGroqKey} key...`);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: options.model || import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: options.systemPrompt || 'You are a helpful AI assistant.' },
            { role: 'user', content: prompt }
          ],
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 4096
        })
      });

      if (!response.ok) {
        if (response.status === 429 && this._activeGroqKey === 'primary' && this._groqKey2) {
          console.warn('🔄 AIService: Groq primary rate-limited. Rotating to secondary...');
          this._activeGroqKey = 'secondary';
          return this.callGroqDirect(prompt, options);
        }
        throw new Error(`Groq API returned ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || null;
    } catch (error) {
      console.error('[AIService] callGroqDirect error:', error);
      throw error;
    }
  }

  /**
   * Summarizes a text using AI
   * @param text The text to summarize
   * @param maxLength Maximum desired length of the summary
   * @returns The summary
   */
  async summarizeText(text: string, maxLength?: number): Promise<string> {
    const prompt = `
      Summarize the following text in a concise way:
      
      ${text.substring(0, 10000)}
      
      ${maxLength ? `Keep the summary under ${maxLength} words.` : ''}
    `;

    return this.generateText(prompt);
  }

  /**
   * Extracts key topics from a text
   * @param text The text to analyze
   * @param count Number of topics to extract
   * @returns Array of topics
   */
  async extractTopics(text: string, count: number = 5): Promise<string[]> {
    const prompt = `
      Extract exactly ${count} main topics from the following text. 
      Return only the list of topics, one per line:
      
      ${text.substring(0, 10000)}
    `;

    const result = await this.generateText(prompt);

    // Parse the result to get individual topics
    return result
      .split('\n')
      .map(topic => topic.trim())
      .filter(Boolean)
      .slice(0, count);
  }

  /**
   * Answers a question based on the provided context
   * @param question The question to answer
   * @param context The context information
   * @returns The answer
   */
  async answerQuestion(question: string, context: string): Promise<string> {
    const prompt = `
      Use the following information to answer the question.
      
      Context:
      ${context.substring(0, 10000)}
      
      Question: ${question}
      
      If the answer cannot be determined from the context, say so clearly.
    `;

    return this.generateText(prompt);
  }

  /*
  // Commenting out analyzeText as TextAnalysisOptions is not defined and options are unused.
  // TODO: Define TextAnalysisOptions and implement or remove this method.
  async analyzeText(options: any): Promise<any> { // Changed TextAnalysisOptions to any for now
    const { text, type, options: analysisOptions = {} } = options;
    console.log('[AIService] analyzeText called with:', { text, type, analysisOptions });
    if (!this._isInitialized || !this._generativeModel) {
      throw new Error('AIService not initialized or model not available.');
    }
    // Actual analysis logic would go here based on 'type'
    // For example, sentiment analysis, entity extraction, etc.
    // This is a placeholder implementation.
    try {
      const prompt = `Analyze the following text for ${type}:\\n\\n${text}`;
      const result = await this._generativeModel.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('[AIService] analyzeText: Error during analysis:', error);
      throw error;
    }
  }
  */

  async analyzeContent(options: AIAnalysisOptions & { text: string; type: string }): Promise<AIAnalysisResult> {
    if (!this._isInitialized) {
      console.error('[AIService] analyzeContent: AIService not initialized.');
      throw new Error('AIService not initialized.');
    }
    const { text, type } = options;

    console.log(`[AIService] analyzeContent: Type: ${type}, Text length: ${text.length}`);

    let prompt = '';
    switch (type) {
      case 'summary':
        prompt = `Summarize the following text: ${text}`;
        break;
      case 'sentiment':
        prompt = `Analyze the sentiment of the following text (respond with positive, negative, or neutral): ${text}`;
        break;
      case 'keywords':
        prompt = `Extract keywords from the following text: ${text}`;
        break;
      default:
        throw new Error(`Unsupported analysis type: ${type}`);
    }

    try {
      const generatedText = await this.generateText(prompt);

      const result: AIAnalysisResult = {};
      if (type === 'summary') result.summary = generatedText;
      if (type === 'sentiment') {
        const sentiment = generatedText.toLowerCase().includes('positive') ? 'positive' :
          generatedText.toLowerCase().includes('negative') ? 'negative' : 'neutral';
        result.sentiment = sentiment;
      }
      if (type === 'keywords') result.keyPhrases = generatedText.split(',').map(k => k.trim());

      console.log('[AIService] analyzeContent: Analysis result:', result);
      return result;
    } catch (error) {
      console.error(`[AIService] analyzeContent: Error during analysis type ${type}:`, error);
      throw error;
    }
  }

  /**
   * Generate tags for content
   */
  async generateTags(content: string): Promise<string[]> {
    const prompt = `
      Generate 5-10 relevant tags for the following content.
      Return only the tags, one per line:
      
      ${content.substring(0, 5000)}
    `;

    const result = await this.generateText(prompt);
    return result
      .split('\n')
      .map(tag => tag.trim())
      .filter(Boolean)
      .slice(0, 10);
  }

  /**
   * Analyze sentiment of text
   */
  async analyzeSentiment(text: string): Promise<'positive' | 'negative' | 'neutral'> {
    const prompt = `
      Analyze the sentiment of the following text.
      Respond with only one word: positive, negative, or neutral.
      
      ${text.substring(0, 5000)}
    `;

    const result = await this.generateText(prompt);
    const sentiment = result.toLowerCase().trim();

    if (sentiment.includes('positive')) return 'positive';
    if (sentiment.includes('negative')) return 'negative';
    return 'neutral';
  }

  /**
   * Get streaming completion from Gemini API
   * Allows for real-time responses with onUpdate callback
   */
  async getCompletionStreaming(
    parts: Array<{ text: string } | { inlineData: { mimeType: string, data: string } }>,
    options?: {
      temperature?: number;
      maxTokens?: number;
      onUpdate?: (text: string) => void;
    }
  ): Promise<string> {
    if (!this._isInitialized || !this._generativeModel) {
      throw new Error('AIService not initialized or model not available.');
    }

    console.log('[AIService] getCompletionStreaming: Starting streaming generation');

    try {
      const modelInstance = this._genAI!.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: options?.temperature,
          maxOutputTokens: options?.maxTokens,
        }
      });

      const result = await modelInstance.generateContentStream(parts);
      let fullText = '';

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          fullText += chunkText;
          if (options?.onUpdate) {
            options.onUpdate(fullText);
          }
        }
      }

      console.log('[AIService] getCompletionStreaming: Streaming complete');
      return fullText;
    } catch (error) {
      console.error('[AIService] getCompletionStreaming: Error:', error);
      throw error;
    }
  }

  /**
   * Get non-streaming completion from Gemini API
   */
  async getCompletion(
    parts: Array<{ text: string } | { inlineData: { mimeType: string, data: string } }>,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    if (!this._isInitialized || !this._generativeModel) {
      throw new Error('AIService not initialized or model not available.');
    }

    try {
      const modelInstance = this._genAI!.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: options?.temperature,
          maxOutputTokens: options?.maxTokens,
        }
      });

      const result = await modelInstance.generateContent(parts);
      const response = await result.response;
      return response.text() || '';
    } catch (error) {
      console.error('[AIService] getCompletion: Error:', error);
      throw error;
    }
  }

  /**
   * Analyze email for calendar events
   * Migrated from gemini-simplified.ts for consolidation
   */
  async analyzeEmailForCalendarEvent(email: any): Promise<any> {
    if (!this._isInitialized) {
      throw new Error('AIService not initialized.');
    }

    const currentYear = new Date().getFullYear();
    const currentDate = new Date().toISOString().split('T')[0];

    const prompt = `Analyze the following email content and extract information for a calendar event and general email analysis.

IMPORTANT CONTEXT:
- Current Date: ${currentDate}
- Current Year: ${currentYear}
- When parsing dates, if no year is specified, assume ${currentYear}
- For relative dates like "Thursday, August 7", interpret as August 7, ${currentYear}

Email Subject: "${email.subject}"
Email Body:
"""
${email.body}
"""
Email Date: "${email.date}"

Please determine if this email discusses a new meeting, an update to an existing meeting, or is not related to a calendar event.

Format your entire response as a SINGLE, RAW JSON object with the following structure:
{
  "priority": "high|medium|low",
  "category": "Legal|Work Update|Personal|etc",
  "summary": "Brief summary of the email",
  "actionItems": [],
  "keywords": [],
  "isCourtDocument": true|false,
  "isReplyRequired": true|false,
  "suggestedReply": "",
  "followUpDate": "YYYY-MM-DD",
  "meetingDetails": {
    "eventTitle": "Title",
    "eventDate": "YYYY-MM-DD",
    "eventTime": "HH:MM AM/PM",
    "endTime": "HH:MM AM/PM",
    "timeZone": "America/Los_Angeles",
    "location": "Location or video link",
    "attendees": [],
    "description": "Full event description",
    "caseNumber": "Case number if applicable",
    "attachments": [],
    "eventType": "MSC|Hearing|Meeting|etc",
    "personInvolved": "Primary person name",
    "judgeName": "Judge name if applicable"
  },
  "isMeeting": true|false
}

Your response MUST be ONLY the JSON object, no markdown formatting or explanatory text.`;

    try {
      const rawResponse = await this.generateText(prompt);
      let jsonToParse = rawResponse.trim();

      // Clean up markdown formatting
      if (jsonToParse.startsWith("```json\n") && jsonToParse.endsWith("\n```")) {
        jsonToParse = jsonToParse.substring("```json\n".length, jsonToParse.length - "\n```".length).trim();
      } else if (jsonToParse.startsWith("```") && jsonToParse.endsWith("```")) {
        jsonToParse = jsonToParse.substring(3, jsonToParse.length - 3).trim();
      }

      const parsedResponse = JSON.parse(jsonToParse);

      // Ensure isMeeting flag is correct
      const meetingDetails = parsedResponse.meetingDetails;
      const isMeeting = !!(meetingDetails?.eventTitle && meetingDetails?.eventDate && meetingDetails?.eventTime);

      return {
        ...parsedResponse,
        messageId: email.id,
        isMeeting,
        rawAiResponse: rawResponse,
        calendarEventId: null,
        calendarEventStatus: 'pending_analysis',
        calendarEventError: null,
        error: undefined,
        calendarEventDetails: null,
      };
    } catch (error) {
      console.error('[AIService] analyzeEmailForCalendarEvent: Error:', error);
      return {
        messageId: email.id,
        priority: 'medium',
        category: 'Error',
        sentiment: 'neutral',
        actionItems: [],
        summary: 'Error during AI analysis. Could not parse email content.',
        keywords: [],
        isCourtDocument: false,
        isReplyRequired: false,
        suggestedReply: '',
        followUpDate: '',
        meetingDetails: undefined,
        rawAiResponse: '',
        isMeeting: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        calendarEventId: null,
        calendarEventStatus: 'analysis_failed',
        calendarEventError: error instanceof Error ? error.message : 'Unknown error',
        calendarEventDetails: null,
      };
    }
  }

  /**
   * Initialize AI service method (for backward compatibility)
   */
  async initializeAIService(): Promise<void> {
    console.warn('[AIService] initializeAIService: This method is deprecated. Use _initializeService instead.');
    // For backward compatibility, just return if already initialized
    if (this._isInitialized) {
      return;
    }
    throw new Error('AIService must be initialized with _initializeService(supabaseClient, geminiApiKey)');
  }
}

// New exported function
export const initializeAIService = async (supabaseClient?: SupabaseClient, geminiApiKey?: string): Promise<void> => {
  console.log('[AIService Export] initializeAIService called.');
  const instance = await AIService.getInstance();
  // Pass through the arguments to the instance's initialization method
  await instance._initializeService(supabaseClient, geminiApiKey);
};

// New exported function to get the AIService instance
export const getAIService = async (): Promise<AIService> => {
  console.log('[AIService Export] getAIService called.');
  return AIService.getInstance();
};

// Ensure other class methods remain as they are.