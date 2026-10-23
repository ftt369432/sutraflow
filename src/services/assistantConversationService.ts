import { GoogleGenerativeAI } from '@google/generative-ai';
import { getEnv } from '../config/env';
import { useNotifications } from '../hooks/useNotifications';

// Types
interface InterviewQuestion {
  question: string;
  skillLevel: string;
  category: string;
}

interface ImageGenerationOptions {
  prompt: string;
  style?: string;
  size?: string;
  quality?: 'standard' | 'hd';
  negativePrompt?: string;
}

interface InterviewWizardOptions {
  jobTitle: string;
  experienceLevel: string;
  skillsRequired: string[];
  questionCount?: number;
  difficultyLevel?: 'easy' | 'medium' | 'hard' | 'mixed';
}

class AssistantConversationService {
  private client: GoogleGenerativeAI;
  private defaultModel = 'gemini-2.0-pro';
  private imageModel = 'gemini-1.5-pro-vision';

  constructor() {
    try {
      const env = getEnv();
      const apiKey = env.geminiApiKey;
      
      if (!apiKey) {
        console.error('Gemini API key not found');
        throw new Error('Gemini API key is required');
      }
      
      this.client = new GoogleGenerativeAI(apiKey);
      const finalEnv = getEnv();
      this.defaultModel = finalEnv.aiModel || this.defaultModel;
      console.log('AssistantConversationService initialized with model:', this.defaultModel);
    } catch (error) {
      console.error('Error initializing AssistantConversationService:', error);
      throw error;
    }
  }

  /**
   * Analyze user input to generate assistant configuration suggestions
   */
  async analyzeUserInput(input: string): Promise<any> {
    try {
      const model = this.client.getGenerativeModel({ model: this.defaultModel });
      
      const prompt = `
        Analyze this user input and suggest the best assistant configuration:
        "${input}"
        
        Return a JSON object with:
        - mode: suggested mode for the assistant (professional, creative, technical, or focused)
        - model: suggested AI model (gemini-2.0-pro or gemini-2.0-flash)
        - temperature: suggested temperature (0.0-1.0)
        - systemPrompt: a tailored system prompt based on the user's needs
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('Error parsing AI response as JSON:', e);
        return {
          mode: 'professional',
          model: 'gemini-2.0-flash', 
          temperature: 0.7,
          systemPrompt: 'You are a helpful professional assistant.'
        };
      }
    } catch (error) {
      console.error('Error analyzing user input:', error);
      throw error;
    }
  }

  /**
   * Generate an image based on the provided prompt
   */
  async generateImage(options: ImageGenerationOptions): Promise<string> {
    try {
      const model = this.client.getGenerativeModel({ model: this.imageModel });
      
      let fullPrompt = options.prompt;
      
      // Add style if provided
      if (options.style) {
        fullPrompt += `, Style: ${options.style}`;
      }
      
      // Add negative prompt if provided
      if (options.negativePrompt) {
        fullPrompt += `. Negative prompt: ${options.negativePrompt}`;
      }
      
      const generationConfig = {
        temperature: 0.8,
        topK: 32,
        topP: 1,
        maxOutputTokens: 2048,
      };
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig,
      });
      
      const response = await result.response;
      
      // Check for image in the response
      const imageParts = response.candidates[0].content.parts.filter(
        part => part.inlineData && part.inlineData.mimeType.startsWith('image/')
      );
      
      if (imageParts.length === 0) {
        throw new Error('No image was generated');
      }
      
      // Return the image as a data URL
      const imageData = imageParts[0].inlineData.data;
      const mimeType = imageParts[0].inlineData.mimeType;
      return `data:${mimeType};base64,${imageData}`;
      
    } catch (error) {
      console.error('Error generating image:', error);
      throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate interview questions based on job requirements
   */
  async generateInterviewQuestions(options: InterviewWizardOptions): Promise<InterviewQuestion[]> {
    try {
      const model = this.client.getGenerativeModel({ model: this.defaultModel });
      
      const questionCount = options.questionCount || 5;
      const difficultyLevel = options.difficultyLevel || 'mixed';
      
      const prompt = `
        Create a set of ${questionCount} technical interview questions for a ${options.jobTitle} position.
        Experience level: ${options.experienceLevel}
        Required skills: ${options.skillsRequired.join(', ')}
        Difficulty level: ${difficultyLevel}
        
        For each question, provide:
        1. The question text
        2. The skill category it tests (one of the required skills)
        3. The skill level (junior, intermediate, senior)
        
        Format the response as a JSON array of objects with properties: question, category, skillLevel
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('Error parsing interview questions response as JSON:', e);
        return [];
      }
    } catch (error) {
      console.error('Error generating interview questions:', error);
      throw error;
    }
  }

  /**
   * Evaluate an interview answer based on the question and expected knowledge level
   */
  async evaluateInterviewAnswer(question: string, answer: string, jobLevel: string): Promise<any> {
    try {
      const model = this.client.getGenerativeModel({ model: this.defaultModel });
      
      const prompt = `
        Evaluate this interview answer for a ${jobLevel} position:
        
        Question: ${question}
        
        Answer: ${answer}
        
        Provide evaluation as JSON with:
        - score: 1-10 rating
        - strengths: array of strong points in the answer
        - weaknesses: array of weak points or missing information
        - suggestions: specific suggestions for improvement
        - overallFeedback: summary evaluation in 2-3 sentences
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('Error parsing evaluation response as JSON:', e);
        return {
          score: 5,
          strengths: [],
          weaknesses: ["Couldn't properly evaluate the answer"],
          suggestions: ["Provide more specific details in your answer"],
          overallFeedback: "Unable to provide detailed feedback on this answer."
        };
      }
    } catch (error) {
      console.error('Error evaluating interview answer:', error);
      throw error;
    }
  }
}

export const assistantConversationService = new AssistantConversationService();