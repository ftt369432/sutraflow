/**
 * Universal Image Generation Capability
 * Handles image creation using various AI services (DALL-E, Midjourney, Stable Diffusion)
 * Works with ANY profession or use case
 */

import { AICapability, CapabilityResult } from './types';

export interface ImageGenerationIntent {
  isImageGeneration: boolean;
  style: 'realistic' | 'artistic' | 'cartoon' | 'sketch' | 'professional' | 'technical';
  purpose: 'document' | 'presentation' | 'marketing' | 'illustration' | 'diagram' | 'logo';
  confidence: number;
  prompt?: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  style?: 'realistic' | 'artistic' | 'cartoon' | 'sketch' | 'professional' | 'technical';
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  count?: number;
  profession?: string;
  context?: {
    documentType?: string;
    businessContext?: string;
  };
}

export interface ImageGenerationResult extends CapabilityResult {
  images?: Array<{
    url: string;
    revisedPrompt?: string;
    size: string;
  }>;
  prompt?: string;
  style?: string;
  suggestions?: string[];
}

/**
 * Universal Image Generation Capability
 * Creates images for any profession or use case
 */
export class ImageGenerationCapability implements AICapability {
  name = 'image-generation';
  description = 'Universal AI image generation for documents, presentations, and professional use';
  version = '1.0.0';
  
  private openAIKey: string;
  private dalleAPI = 'https://api.openai.com/v1/images/generations';

  constructor(openAIKey?: string) {
    this.openAIKey = openAIKey || process.env.OPENAI_API_KEY || '';
  }

  /**
   * Detect if user wants to generate images
   */
  async detectIntent(input: string): Promise<ImageGenerationIntent> {
    const lower = input.toLowerCase();
    
    // Image generation triggers
    const imageKeywords = [
      'create image', 'generate image', 'make picture', 'draw', 'illustrate',
      'create logo', 'design', 'visual', 'picture', 'photo', 'image',
      'dall-e', 'dalle', 'midjourney', 'ai image', 'ai art'
    ];
    
    // Style detection
    const styleKeywords = {
      'realistic': ['realistic', 'photorealistic', 'real photo', 'photography'],
      'artistic': ['artistic', 'art style', 'painting', 'watercolor', 'oil painting'],
      'cartoon': ['cartoon', 'comic', 'animated', 'illustration'],
      'sketch': ['sketch', 'pencil drawing', 'line art', 'wireframe'],
      'professional': ['professional', 'business', 'corporate', 'clean'],
      'technical': ['technical', 'diagram', 'schematic', 'blueprint', 'chart']
    };
    
    // Purpose detection
    const purposeKeywords = {
      'document': ['document', 'report', 'paper', 'legal document'],
      'presentation': ['presentation', 'slide', 'powerpoint', 'keynote'],
      'marketing': ['marketing', 'advertisement', 'promo', 'campaign'],
      'illustration': ['illustration', 'example', 'explain', 'show'],
      'diagram': ['diagram', 'flowchart', 'process', 'workflow'],
      'logo': ['logo', 'brand', 'company logo', 'business logo']
    };
    
    const hasImageIntent = imageKeywords.some(keyword => lower.includes(keyword));
    
    if (!hasImageIntent) {
      return {
        isImageGeneration: false,
        style: 'professional',
        purpose: 'document',
        confidence: 0
      };
    }
    
    // Detect style
    let detectedStyle: ImageGenerationIntent['style'] = 'professional';
    for (const [style, keywords] of Object.entries(styleKeywords)) {
      if (keywords.some(keyword => lower.includes(keyword))) {
        detectedStyle = style as ImageGenerationIntent['style'];
        break;
      }
    }
    
    // Detect purpose
    let detectedPurpose: ImageGenerationIntent['purpose'] = 'document';
    for (const [purpose, keywords] of Object.entries(purposeKeywords)) {
      if (keywords.some(keyword => lower.includes(keyword))) {
        detectedPurpose = purpose as ImageGenerationIntent['purpose'];
        break;
      }
    }
    
    // Extract prompt
    const prompt = this.extractImagePrompt(input);
    
    return {
      isImageGeneration: true,
      style: detectedStyle,
      purpose: detectedPurpose,
      confidence: 0.8,
      prompt
    };
  }

  /**
   * Process image generation request
   */
  async process(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    try {
      if (!this.openAIKey) {
        return {
          success: false,
          message: 'OpenAI API key not configured. Please add your API key to use image generation.'
        };
      }

      console.log(`🎨 Generating ${request.style} image for ${request.profession || 'general'} use`);
      
      // Enhance prompt based on profession and context
      const enhancedPrompt = this.enhancePromptForProfession(request);
      
      const images = await this.generateWithDALLE(enhancedPrompt, request);
      
      return {
        success: true,
        images,
        prompt: enhancedPrompt,
        style: request.style,
        suggestions: this.generateSuggestions(request),
        message: 'Images generated successfully'
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Image generation failed: ${error.message}`
      };
    }
  }

  /**
   * Generate images using DALL-E
   */
  private async generateWithDALLE(prompt: string, request: ImageGenerationRequest): Promise<Array<{
    url: string;
    revisedPrompt?: string;
    size: string;
  }>> {
    const size = request.size || '1024x1024';
    const quality = request.quality || 'standard';
    const count = Math.min(request.count || 1, 4); // DALL-E max is 4
    
    const payload = {
      model: 'dall-e-3',
      prompt,
      size,
      quality,
      n: count
    };
    
    const response = await fetch(this.dalleAPI, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openAIKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`DALL-E API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return data.data.map((item: any) => ({
      url: item.url,
      revisedPrompt: item.revised_prompt,
      size
    }));
  }

  /**
   * Enhance prompt based on profession and context
   */
  private enhancePromptForProfession(request: ImageGenerationRequest): string {
    let enhancedPrompt = request.prompt;
    
    // Add profession-specific enhancements
    if (request.profession) {
      const professionEnhancements = {
        'legal': 'professional legal setting, courthouse, law office, formal business attire',
        'medical': 'medical setting, hospital, clinic, healthcare professional, clean and sterile',
        'business': 'corporate office, business meeting, professional attire, modern workplace',
        'real-estate': 'real estate office, property photos, professional realtor, home staging',
        'creative': 'creative studio, artistic workspace, inspiration, colorful and dynamic',
        'academic': 'university, library, research setting, academic environment',
        'technical': 'modern tech office, computer screens, engineering, clean minimal design',
        'financial': 'financial district, bank, investment firm, professional financial setting'
      };
      
      const enhancement = professionEnhancements[request.profession];
      if (enhancement) {
        enhancedPrompt += `, ${enhancement}`;
      }
    }
    
    // Add style-specific enhancements
    const styleEnhancements = {
      'realistic': 'photorealistic, high quality, detailed, professional photography',
      'artistic': 'artistic style, creative interpretation, aesthetically pleasing',
      'cartoon': 'cartoon style, fun and engaging, colorful illustration',
      'sketch': 'pencil sketch, line art, clean lines, minimalist',
      'professional': 'professional, clean, business appropriate, polished',
      'technical': 'technical diagram, clear and precise, informative, schematic style'
    };
    
    const styleEnhancement = styleEnhancements[request.style || 'professional'];
    enhancedPrompt += `, ${styleEnhancement}`;
    
    // Add context-specific enhancements
    if (request.context?.documentType) {
      enhancedPrompt += `, suitable for ${request.context.documentType}`;
    }
    
    return enhancedPrompt;
  }

  /**
   * Extract image prompt from user input
   */
  private extractImagePrompt(input: string): string {
    // Remove trigger words and extract the actual description
    const cleanedInput = input
      .replace(/create image|generate image|make picture|draw|illustrate|create logo|design/gi, '')
      .replace(/dall-e|dalle|midjourney|ai image|ai art/gi, '')
      .replace(/of|for|showing|depicting/gi, '')
      .trim();
    
    return cleanedInput || 'professional business image';
  }

  /**
   * Generate suggestions for follow-up actions
   */
  private generateSuggestions(request: ImageGenerationRequest): string[] {
    const baseSuggestions = [
      'Try different styles (realistic, artistic, cartoon)',
      'Adjust image size for different uses',
      'Generate variations of the same concept'
    ];
    
    // Add profession-specific suggestions
    if (request.profession === 'legal') {
      baseSuggestions.push(
        'Create courthouse or law office imagery',
        'Generate professional legal document illustrations'
      );
    } else if (request.profession === 'medical') {
      baseSuggestions.push(
        'Create medical diagram illustrations',
        'Generate healthcare setting images'
      );
    } else if (request.profession === 'business') {
      baseSuggestions.push(
        'Create business presentation graphics',
        'Generate corporate logo concepts'
      );
    }
    
    return baseSuggestions;
  }

  /**
   * Set OpenAI API key
   */
  setApiKey(apiKey: string): void {
    this.openAIKey = apiKey;
  }

  /**
   * Check if image generation is available
   */
  isAvailable(): boolean {
    return !!this.openAIKey;
  }
}
