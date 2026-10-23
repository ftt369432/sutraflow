/**
 * 🧠 Adaptive Learning Service
 * 
 * Universal learning system that makes the AI progressively smarter from:
 * - Document uploads and content analysis
 * - User interactions and feedback patterns  
 * - Conversation preferences and styles
 * - Canvas creation and editing patterns
 * - Success metrics and optimization data
 * 
 * Following prompt guidelines: Beautiful, production-ready, centralized architecture
 */

import { v4 as uuidv4 } from 'uuid';

// 📊 Core Learning Data Types
export interface LearningPattern {
  id: string;
  type: 'document' | 'interaction' | 'preference' | 'canvas' | 'workflow';
  pattern: string;
  frequency: number;
  successRate: number;
  confidence: number;
  lastSeen: Date;
  context: {
    userId: string;
    domain: string;
    documentType?: string;
    interactionType?: string;
  };
  metadata: Record<string, any>;
}

export interface UserLearningProfile {
  userId: string;
  preferences: {
    responseStyle: 'concise' | 'detailed' | 'technical' | 'conversational';
    preferredLength: 'short' | 'medium' | 'long' | 'comprehensive';
    technicalLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
    domainExpertise: string[];
    formatPreferences: {
      useMarkdown: boolean;
      includeSections: boolean;
      preferBulletPoints: boolean;
      includeExamples: boolean;
    };
  };
  interactionPatterns: {
    commonQuestionTypes: string[];
    preferredTimeOfDay: string[];
    sessionDuration: number;
    documentTypes: string[];
  };
  learningMetrics: {
    documentsProcessed: number;
    interactionsRecorded: number;
    feedbackGiven: number;
    averageSessionTime: number;
    lastActivity: Date;
  };
  adaptationHistory: Array<{
    date: Date;
    change: string;
    reason: string;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
}

export interface DocumentLearningData {
  documentId: string;
  documentType: string;
  contentPatterns: string[];
  userInteractions: Array<{
    action: 'read' | 'edit' | 'copy' | 'share' | 'delete';
    timestamp: Date;
    context: string;
  }>;
  successMetrics: {
    completionRate: number;
    editFrequency: number;
    shareRate: number;
    userSatisfaction: number;
  };
  extractedKnowledge: {
    keyTerms: string[];
    concepts: string[];
    relationships: Array<{ from: string; to: string; type: string }>;
    domain: string;
  };
}

export interface InteractionLearningData {
  interactionId: string;
  userInput: string;
  aiResponse: string;
  feedback: 'like' | 'dislike' | 'neutral' | null;
  effectiveness: number; // 0-100
  context: {
    conversationLength: number;
    documentContext: boolean;
    canvasActive: boolean;
    timeOfDay: string;
    sessionDuration: number;
  };
  adaptations: Array<{
    aspect: string;
    before: string;
    after: string;
    reason: string;
  }>;
}

/**
 * 🎯 Adaptive Learning Service - Main Class
 */
export class AdaptiveLearningService {
  private learningStore = new Map<string, LearningPattern>();
  private userProfiles = new Map<string, UserLearningProfile>();
  private documentLearning = new Map<string, DocumentLearningData>();
  private interactionHistory = new Map<string, InteractionLearningData>();
  
  private initialized = false;
  private readonly STORAGE_KEY = 'adaptive_learning_data';
  private readonly PROFILE_KEY = 'user_learning_profiles';

  constructor() {
    this.initializeFromStorage();
  }

  /**
   * 🚀 Initialize learning system
   */
  private async initializeFromStorage() {
    try {
      // Load existing learning data
      const savedData = localStorage.getItem(this.STORAGE_KEY);
      const savedProfiles = localStorage.getItem(this.PROFILE_KEY);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        parsedData.forEach((item: any) => {
          this.learningStore.set(item.id, {
            ...item,
            lastSeen: new Date(item.lastSeen)
          });
        });
      }
      
      if (savedProfiles) {
        const parsedProfiles = JSON.parse(savedProfiles);
        parsedProfiles.forEach((profile: any) => {
          this.userProfiles.set(profile.userId, {
            ...profile,
            learningMetrics: {
              ...profile.learningMetrics,
              lastActivity: new Date(profile.learningMetrics.lastActivity)
            }
          });
        });
      }
      
      this.initialized = true;
      console.log('🧠 Adaptive Learning Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize learning service:', error);
      this.initialized = true; // Continue with empty state
    }
  }

  /**
   * 📚 Learn from uploaded documents
   */
  async learnFromDocument(
    document: any, 
    userId: string, 
    userContext: any
  ): Promise<void> {
    if (!this.initialized) await this.initializeFromStorage();

    const documentLearning: DocumentLearningData = {
      documentId: document.id || uuidv4(),
      documentType: document.type || 'unknown',
      contentPatterns: await this.extractContentPatterns(document.content || ''),
      userInteractions: [],
      successMetrics: {
        completionRate: 0,
        editFrequency: 0,
        shareRate: 0,
        userSatisfaction: 0
      },
      extractedKnowledge: await this.extractKnowledge(document.content || '')
    };

    this.documentLearning.set(documentLearning.documentId, documentLearning);

    // Update user learning patterns
    const userProfile = this.getUserProfile(userId);
    userProfile.interactionPatterns.documentTypes.push(document.type);
    userProfile.learningMetrics.documentsProcessed++;
    userProfile.learningMetrics.lastActivity = new Date();

    // Create learning patterns
    const patterns = await this.analyzeDocumentPatterns(document, userContext);
    patterns.forEach(pattern => {
      this.addLearningPattern(pattern);
    });

    await this.saveToStorage();
    console.log(`📚 Learned from document: ${document.name || 'Untitled'}`);
  }

  /**
   * 💬 Learn from user interactions
   */
  async learnFromInteraction(
    userInput: string,
    aiResponse: string,
    userId: string,
    context: any,
    feedback?: 'like' | 'dislike'
  ): Promise<void> {
    if (!this.initialized) await this.initializeFromStorage();

    const interactionData: InteractionLearningData = {
      interactionId: uuidv4(),
      userInput,
      aiResponse,
      feedback: feedback || null,
      effectiveness: this.calculateEffectiveness(userInput, aiResponse, feedback),
      context: {
        conversationLength: context.conversationLength || 0,
        documentContext: context.hasDocuments || false,
        canvasActive: context.canvasActive || false,
        timeOfDay: new Date().getHours().toString(),
        sessionDuration: context.sessionDuration || 0
      },
      adaptations: []
    };

    this.interactionHistory.set(interactionData.interactionId, interactionData);

    // Update user profile
    const userProfile = this.getUserProfile(userId);
    userProfile.learningMetrics.interactionsRecorded++;
    if (feedback) {
      userProfile.learningMetrics.feedbackGiven++;
    }

    // Analyze and learn from patterns
    await this.analyzeInteractionPatterns(userInput, aiResponse, userId, context);

    // Update preferences based on successful interactions
    if (this.isSuccessfulInteraction(interactionData)) {
      await this.updateUserPreferences(userId, userInput, aiResponse, context);
    }

    await this.saveToStorage();
    console.log(`💬 Learned from interaction: ${userInput.substring(0, 50)}...`);
  }

  /**
   * 🎨 Learn from Canvas usage patterns
   */
  async learnFromCanvasUsage(
    canvasData: any,
    userId: string,
    action: 'create' | 'edit' | 'share' | 'export'
  ): Promise<void> {
    if (!this.initialized) await this.initializeFromStorage();

    const pattern: LearningPattern = {
      id: uuidv4(),
      type: 'canvas',
      pattern: `canvas_${action}_${canvasData.contentType}`,
      frequency: 1,
      successRate: 100,
      confidence: 0.8,
      lastSeen: new Date(),
      context: {
        userId,
        domain: canvasData.contentType || 'general',
        documentType: canvasData.contentType
      },
      metadata: {
        action,
        contentLength: canvasData.content?.length || 0,
        timeToCreate: canvasData.timeToCreate || 0,
        editCount: canvasData.editCount || 0
      }
    };

    this.addLearningPattern(pattern);

    // Update user profile with Canvas preferences
    const userProfile = this.getUserProfile(userId);
    if (!userProfile.interactionPatterns.documentTypes.includes(canvasData.contentType)) {
      userProfile.interactionPatterns.documentTypes.push(canvasData.contentType);
    }

    await this.saveToStorage();
    console.log(`🎨 Learned from Canvas ${action}: ${canvasData.title || 'Untitled'}`);
  }

  /**
   * 🎯 Apply learned preferences to enhance AI responses
   */
  async enhanceResponseWithLearning(
    baseResponse: string,
    userId: string,
    context: any
  ): Promise<string> {
    if (!this.initialized) await this.initializeFromStorage();

    const userProfile = this.getUserProfile(userId);
    const relevantPatterns = this.getRelevantPatterns(userId, context);

    let enhancedResponse = baseResponse;

    // Apply style preferences
    enhancedResponse = await this.applyStylePreferences(
      enhancedResponse,
      userProfile.preferences
    );

    // Apply learned patterns
    enhancedResponse = await this.applyLearnedPatterns(
      enhancedResponse,
      relevantPatterns
    );

    // Apply domain-specific enhancements
    if (context.domain) {
      enhancedResponse = await this.applyDomainEnhancements(
        enhancedResponse,
        context.domain,
        userProfile
      );
    }

    return enhancedResponse;
  }

  /**
   * 📊 Get learning analytics
   */
  getLearningAnalytics(userId: string): any {
    const userProfile = this.getUserProfile(userId);
    const userPatterns = Array.from(this.learningStore.values())
      .filter(p => p.context.userId === userId);

    return {
      profile: userProfile,
      patterns: {
        total: userPatterns.length,
        byType: this.groupPatternsByType(userPatterns),
        topPatterns: userPatterns
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, 10)
      },
      insights: this.generateLearningInsights(userProfile, userPatterns),
      recommendations: this.generateRecommendations(userProfile, userPatterns)
    };
  }

  /**
   * 🔧 Private Helper Methods
   */
  private getUserProfile(userId: string): UserLearningProfile {
    if (!this.userProfiles.has(userId)) {
      const newProfile: UserLearningProfile = {
        userId,
        preferences: {
          responseStyle: 'detailed',
          preferredLength: 'medium',
          technicalLevel: 'intermediate',
          domainExpertise: [],
          formatPreferences: {
            useMarkdown: true,
            includeSections: true,
            preferBulletPoints: true,
            includeExamples: true
          }
        },
        interactionPatterns: {
          commonQuestionTypes: [],
          preferredTimeOfDay: [],
          sessionDuration: 0,
          documentTypes: []
        },
        learningMetrics: {
          documentsProcessed: 0,
          interactionsRecorded: 0,
          feedbackGiven: 0,
          averageSessionTime: 0,
          lastActivity: new Date()
        },
        adaptationHistory: []
      };
      this.userProfiles.set(userId, newProfile);
    }
    return this.userProfiles.get(userId)!;
  }

  private addLearningPattern(pattern: LearningPattern): void {
    const existingPattern = Array.from(this.learningStore.values())
      .find(p => p.pattern === pattern.pattern && p.context.userId === pattern.context.userId);

    if (existingPattern) {
      existingPattern.frequency++;
      existingPattern.lastSeen = new Date();
      existingPattern.confidence = Math.min(1.0, existingPattern.confidence + 0.1);
    } else {
      this.learningStore.set(pattern.id, pattern);
    }
  }

  private async extractContentPatterns(content: string): Promise<string[]> {
    const patterns: string[] = [];
    
    // Extract common patterns
    const words = content.toLowerCase().split(/\s+/);
    const commonPhrases = this.findCommonPhrases(words);
    patterns.push(...commonPhrases);

    // Extract structural patterns
    if (content.includes('**')) patterns.push('uses_bold_formatting');
    if (content.includes('*   ')) patterns.push('uses_bullet_points');
    if (content.includes('###')) patterns.push('uses_headers');
    if (content.match(/\d+\./)) patterns.push('uses_numbered_lists');

    return patterns;
  }

  private async extractKnowledge(content: string): Promise<any> {
    const words = content.toLowerCase().split(/\s+/);
    const keyTerms = words.filter(word => word.length > 5).slice(0, 20);
    
    return {
      keyTerms,
      concepts: this.extractConcepts(content),
      relationships: [],
      domain: this.inferDomain(content)
    };
  }

  private findCommonPhrases(words: string[]): string[] {
    const phrases: Record<string, number> = {};
    
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      phrases[phrase] = (phrases[phrase] || 0) + 1;
    }
    
    return Object.entries(phrases)
      .filter(([_, count]) => count > 1)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 10)
      .map(([phrase, _]) => phrase);
  }

  private extractConcepts(content: string): string[] {
    // Simple concept extraction - can be enhanced with NLP
    const concepts = content.match(/\*\*([^*]+)\*\*/g)?.map(match => 
      match.replace(/\*\*/g, '').toLowerCase()
    ) || [];
    
    return [...new Set(concepts)].slice(0, 10);
  }

  private inferDomain(content: string): string {
    const legalTerms = ['case', 'court', 'legal', 'contract', 'law', 'attorney'];
    const businessTerms = ['business', 'market', 'strategy', 'plan', 'revenue'];
    const technicalTerms = ['system', 'code', 'api', 'database', 'technical'];
    
    const legalCount = legalTerms.filter(term => content.toLowerCase().includes(term)).length;
    const businessCount = businessTerms.filter(term => content.toLowerCase().includes(term)).length;
    const technicalCount = technicalTerms.filter(term => content.toLowerCase().includes(term)).length;
    
    if (legalCount > businessCount && legalCount > technicalCount) return 'legal';
    if (businessCount > technicalCount) return 'business';
    if (technicalCount > 0) return 'technical';
    
    return 'general';
  }

  private async analyzeDocumentPatterns(document: any, userContext: any): Promise<LearningPattern[]> {
    const patterns: LearningPattern[] = [];
    
    // Document type preference pattern
    patterns.push({
      id: uuidv4(),
      type: 'document',
      pattern: `prefers_${document.type}`,
      frequency: 1,
      successRate: 100,
      confidence: 0.7,
      lastSeen: new Date(),
      context: {
        userId: userContext.userId,
        domain: document.domain || 'general',
        documentType: document.type
      },
      metadata: { source: 'document_upload' }
    });

    return patterns;
  }

  private async analyzeInteractionPatterns(
    userInput: string, 
    aiResponse: string, 
    userId: string, 
    context: any
  ): Promise<void> {
    // Analyze question type
    const questionType = this.categorizeQuestion(userInput);
    const pattern: LearningPattern = {
      id: uuidv4(),
      type: 'interaction',
      pattern: `asks_${questionType}`,
      frequency: 1,
      successRate: 100,
      confidence: 0.6,
      lastSeen: new Date(),
      context: {
        userId,
        domain: context.domain || 'general',
        interactionType: questionType
      },
      metadata: {
        inputLength: userInput.length,
        responseLength: aiResponse.length,
        timeOfDay: new Date().getHours()
      }
    };

    this.addLearningPattern(pattern);
  }

  private categorizeQuestion(input: string): string {
    const input_lower = input.toLowerCase();
    
    if (input_lower.startsWith('how')) return 'how_to';
    if (input_lower.startsWith('what')) return 'definition';
    if (input_lower.startsWith('why')) return 'explanation';
    if (input_lower.startsWith('when')) return 'timing';
    if (input_lower.includes('create') || input_lower.includes('generate')) return 'creation';
    if (input_lower.includes('analyze') || input_lower.includes('review')) return 'analysis';
    
    return 'general';
  }

  private calculateEffectiveness(
    userInput: string, 
    aiResponse: string, 
    feedback?: 'like' | 'dislike'
  ): number {
    let effectiveness = 50; // Base score
    
    // Adjust based on feedback
    if (feedback === 'like') effectiveness += 30;
    if (feedback === 'dislike') effectiveness -= 30;
    
    // Adjust based on response completeness
    if (aiResponse.length > userInput.length * 2) effectiveness += 10;
    if (aiResponse.includes('```')) effectiveness += 5; // Code examples
    if (aiResponse.includes('**')) effectiveness += 5; // Formatting
    
    return Math.max(0, Math.min(100, effectiveness));
  }

  private isSuccessfulInteraction(interaction: InteractionLearningData): boolean {
    return interaction.effectiveness > 70 || interaction.feedback === 'like';
  }

  private async updateUserPreferences(
    userId: string,
    userInput: string,
    aiResponse: string,
    context: any
  ): Promise<void> {
    const userProfile = this.getUserProfile(userId);
    
    // Update response style preference based on successful interactions
    if (aiResponse.length > 1000) {
      if (userProfile.preferences.preferredLength === 'short') {
        userProfile.preferences.preferredLength = 'medium';
        userProfile.adaptationHistory.push({
          date: new Date(),
          change: 'Increased preferred response length',
          reason: 'User engages well with longer responses',
          impact: 'positive'
        });
      }
    }

    // Update technical level based on technical terms in input
    const technicalTerms = ['api', 'database', 'algorithm', 'framework', 'implementation'];
    if (technicalTerms.some(term => userInput.toLowerCase().includes(term))) {
      if (userProfile.preferences.technicalLevel === 'basic') {
        userProfile.preferences.technicalLevel = 'intermediate';
        userProfile.adaptationHistory.push({
          date: new Date(),
          change: 'Increased technical level',
          reason: 'User uses technical terminology',
          impact: 'positive'
        });
      }
    }
  }

  private getRelevantPatterns(userId: string, context: any): LearningPattern[] {
    return Array.from(this.learningStore.values())
      .filter(pattern => 
        pattern.context.userId === userId &&
        pattern.confidence > 0.5 &&
        (context.domain ? pattern.context.domain === context.domain : true)
      )
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  private async applyStylePreferences(
    response: string,
    preferences: UserLearningProfile['preferences']
  ): Promise<string> {
    let enhanced = response;

    // Apply length preferences
    if (preferences.preferredLength === 'concise' && response.length > 500) {
      enhanced = this.summarizeResponse(response);
    }

    // Apply formatting preferences
    if (preferences.formatPreferences.useMarkdown && !response.includes('**')) {
      enhanced = this.addMarkdownFormatting(enhanced);
    }

    return enhanced;
  }

  private async applyLearnedPatterns(
    response: string,
    patterns: LearningPattern[]
  ): Promise<string> {
    let enhanced = response;

    patterns.forEach(pattern => {
      if (pattern.pattern.includes('prefers_bullet_points') && !response.includes('* ')) {
        enhanced = this.convertToBulletPoints(enhanced);
      }
      if (pattern.pattern.includes('asks_how_to') && !response.includes('Step ')) {
        enhanced = this.addStepByStepFormat(enhanced);
      }
    });

    return enhanced;
  }

  private async applyDomainEnhancements(
    response: string,
    domain: string,
    userProfile: UserLearningProfile
  ): Promise<string> {
    let enhanced = response;

    if (domain === 'legal' && userProfile.preferences.technicalLevel === 'expert') {
      enhanced = this.addLegalCitations(enhanced);
    }

    return enhanced;
  }

  private groupPatternsByType(patterns: LearningPattern[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    patterns.forEach(pattern => {
      grouped[pattern.type] = (grouped[pattern.type] || 0) + 1;
    });
    return grouped;
  }

  private generateLearningInsights(
    profile: UserLearningProfile,
    patterns: LearningPattern[]
  ): string[] {
    const insights: string[] = [];

    if (profile.learningMetrics.documentsProcessed > 10) {
      insights.push('🔥 Heavy document user - prefers comprehensive responses');
    }

    if (patterns.filter(p => p.type === 'canvas').length > 5) {
      insights.push('🎨 Canvas power user - benefits from visual document creation');
    }

    const avgEffectiveness = Array.from(this.interactionHistory.values())
      .filter(i => i.context)
      .reduce((sum, i) => sum + i.effectiveness, 0) / 
      this.interactionHistory.size;

    if (avgEffectiveness > 80) {
      insights.push('⭐ Highly satisfied user - current preferences working well');
    }

    return insights;
  }

  private generateRecommendations(
    profile: UserLearningProfile,
    patterns: LearningPattern[]
  ): string[] {
    const recommendations: string[] = [];

    if (profile.preferences.domainExpertise.length === 0) {
      recommendations.push('Consider setting domain expertise for more targeted responses');
    }

    if (patterns.filter(p => p.pattern.includes('canvas')).length > 0) {
      recommendations.push('Try the autonomous Canvas creation feature for complex documents');
    }

    return recommendations;
  }

  // Utility methods for response enhancement
  private summarizeResponse(response: string): string {
    const sentences = response.split('.');
    return sentences.slice(0, Math.ceil(sentences.length / 2)).join('.') + '.';
  }

  private addMarkdownFormatting(response: string): string {
    return response.replace(/([A-Z][^.!?]*:)/g, '**$1**');
  }

  private convertToBulletPoints(response: string): string {
    const lines = response.split('\n');
    return lines.map(line => {
      if (line.trim() && !line.startsWith('*') && !line.startsWith('-')) {
        return `* ${line}`;
      }
      return line;
    }).join('\n');
  }

  private addStepByStepFormat(response: string): string {
    const sentences = response.split('.');
    let step = 1;
    return sentences.map(sentence => {
      if (sentence.trim() && sentence.includes('should') || sentence.includes('need')) {
        return `Step ${step++}: ${sentence.trim()}.`;
      }
      return sentence + '.';
    }).join(' ');
  }

  private addLegalCitations(response: string): string {
    // Placeholder for legal citation enhancement
    return response + '\n\n*Note: Consult relevant legal authorities and case law for specific jurisdiction requirements.*';
  }

  private async saveToStorage(): Promise<void> {
    try {
      const patternsArray = Array.from(this.learningStore.values());
      const profilesArray = Array.from(this.userProfiles.values());
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(patternsArray));
      localStorage.setItem(this.PROFILE_KEY, JSON.stringify(profilesArray));
    } catch (error) {
      console.error('❌ Failed to save learning data:', error);
    }
  }

  /**
   * 🔄 Export learning data for backup/analysis
   */
  exportLearningData(): any {
    return {
      patterns: Array.from(this.learningStore.values()),
      profiles: Array.from(this.userProfiles.values()),
      interactions: Array.from(this.interactionHistory.values()),
      documents: Array.from(this.documentLearning.values()),
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  /**
   * 📥 Import learning data from backup
   */
  importLearningData(data: any): void {
    try {
      if (data.patterns) {
        data.patterns.forEach((pattern: LearningPattern) => {
          this.learningStore.set(pattern.id, pattern);
        });
      }
      
      if (data.profiles) {
        data.profiles.forEach((profile: UserLearningProfile) => {
          this.userProfiles.set(profile.userId, profile);
        });
      }
      
      this.saveToStorage();
      console.log('📥 Learning data imported successfully');
    } catch (error) {
      console.error('❌ Failed to import learning data:', error);
    }
  }

  /**
   * 🧹 Cleanup old learning data
   */
  cleanup(): void {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Remove old patterns with low confidence
    Array.from(this.learningStore.entries()).forEach(([id, pattern]) => {
      if (pattern.lastSeen < thirtyDaysAgo && pattern.confidence < 0.3) {
        this.learningStore.delete(id);
      }
    });
    
    this.saveToStorage();
    console.log('🧹 Learning data cleanup completed');
  }
}

// Export singleton instance
export const adaptiveLearningService = new AdaptiveLearningService();
