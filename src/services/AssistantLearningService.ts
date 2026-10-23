import { AIServiceFactory } from './ai/aiServiceFactory';
import { supabase } from '../lib/supabase';

/**
 * Sanitize AI response before JSON parsing
 * Strips markdown code fences (```json ... ```) that AI often wraps responses in
 */
function sanitizeJSONResponse(response: string): string {
  if (!response) return '{}';

  let cleaned = response.trim();

  // Remove markdown code fences
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }

  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }

  return cleaned.trim();
}

/**
 * 🛡️ Quality Gate for Local RTX 4090 Dataset Collection & Adaptation
 * Rejects error traces, 401s, offline fallback banners, and degraded text
 * to prevent contaminating the training corpus.
 */
export function isQualityTrainingInteraction(userInput: string, assistantResponse: string): boolean {
  if (!userInput || !assistantResponse) return false;
  if (userInput.trim().length < 8) return false;
  if (assistantResponse.trim().length < 40) return false;

  const badPatterns = [
    /\[Sovereign Offline Engine Active\]/i,
    /\[RTX 4090 Standby\]/i,
    /GoogleGenerativeAIFetchError/i,
    /invalid authentication credentials/i,
    /ACCESS_TOKEN_TYPE_UNSUPPORTED/i,
    /net::ERR_CONNECTION_REFUSED/i,
    /Failed to load resource/i,
    /Local GPU daemon not reachable/i,
    /Local GPU inference daemon not detected/i,
    /Error generating response/i,
    /Execution failed/i,
    /Request had invalid/i,
    /status of 401/i,
    /status of 403/i,
    /status of 500/i,
    /ECONNREFUSED/i,
    /I can't assist you with/i,
    /I cannot assist with/i,
    /I am unable to assist/i,
    /As an AI language model/i,
    /❌/
  ];

  for (const pattern of badPatterns) {
    if (pattern.test(assistantResponse) || pattern.test(userInput)) {
      return false;
    }
  }

  return true;
}

export interface LearningPattern {
  id: string;
  input_pattern: string;
  expected_output: string;
  context: string;
  confidence: number;
  usage_count: number;
  success_rate: number;
  learned_at: string;
  last_used: string;
  feedback_scores: number[];
}

export interface AssistantKnowledge {
  id: string;
  assistant_id: string;
  domain: string;
  patterns: LearningPattern[];
  preferences: Record<string, any>;
  conversation_style: {
    tone: string;
    formality: string;
    response_length: string;
    expertise_level: string;
  };
  created_at: string;
  updated_at: string;
}

export class AssistantLearningService {
  private static instance: AssistantLearningService;
  private knowledgeStore: Map<string, AssistantKnowledge> = new Map();
  // 🔢 Rate-limit: track message count per assistant, only learn every N messages
  private _msgCounters: Map<string, number> = new Map();

  private get learningInterval(): number {
    try {
      const v = localStorage.getItem('genieflow_learning_every_n');
      return v ? Math.max(1, parseInt(v)) : 5; // default: every 5 messages
    } catch { return 5; }
  }

  static getInstance(): AssistantLearningService {
    if (!AssistantLearningService.instance) {
      AssistantLearningService.instance = new AssistantLearningService();
    }
    return AssistantLearningService.instance;
  }

  constructor() {
    this.loadKnowledgeFromStorage();
  }

  private loadKnowledgeFromStorage(): void {
    try {
      // Load from localStorage first (fast)
      const stored = localStorage.getItem('assistant_knowledge');
      if (stored) {
        const knowledgeArray = JSON.parse(stored);
        knowledgeArray.forEach((knowledge: AssistantKnowledge) => {
          this.knowledgeStore.set(knowledge.assistant_id, knowledge);
        });
      }
      // Then sync from database (async)
      this.syncFromDatabase();
    } catch (error) {
      console.error('Failed to load assistant knowledge:', error);
    }
  }

  private async syncFromDatabase(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load patterns from user_learning_patterns table
      const { data: patterns, error } = await supabase
        .from('user_learning_patterns')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.warn('Could not sync from database:', error.message);
        return;
      }

      if (patterns && patterns.length > 0) {
        // Merge database patterns with localStorage
        patterns.forEach((dbPattern: any) => {
          const patternData = dbPattern.pattern_data || {};
          const assistantId = patternData.assistant_id || 'default';

          let knowledge = this.knowledgeStore.get(assistantId);
          if (!knowledge) {
            knowledge = this.initializeAssistantKnowledge(assistantId);
          }

          // Merge pattern if newer than local
          const existingPattern = knowledge.patterns.find(
            p => p.input_pattern === patternData.input_pattern
          );

          if (!existingPattern) {
            knowledge.patterns.push({
              id: dbPattern.id,
              input_pattern: patternData.input_pattern || '',
              expected_output: patternData.expected_output || '',
              context: patternData.context || '',
              confidence: dbPattern.confidence_score || 0.5,
              usage_count: patternData.usage_count || 1,
              success_rate: patternData.success_rate || 1.0,
              learned_at: patternData.learned_at || new Date().toISOString(),
              last_used: dbPattern.last_updated || new Date().toISOString(),
              feedback_scores: patternData.feedback_scores || []
            });
          }
        });

        console.log('[AssistantLearningService] Synced', patterns.length, 'patterns from database');
      }
    } catch (error) {
      console.warn('Database sync failed, using localStorage:', error);
    }
  }

  private saveKnowledgeToStorage(): void {
    try {
      const knowledgeArray = Array.from(this.knowledgeStore.values());
      localStorage.setItem('assistant_knowledge', JSON.stringify(knowledgeArray));

      // Also persist to database (async, non-blocking)
      this.persistToDatabase(knowledgeArray);
    } catch (error) {
      console.error('Failed to save assistant knowledge:', error);
    }
  }

  private async persistToDatabase(knowledgeArray: AssistantKnowledge[]): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Persist each pattern to user_learning_patterns table
      for (const knowledge of knowledgeArray) {
        for (const pattern of knowledge.patterns) {
          const patternData = {
            assistant_id: knowledge.assistant_id,
            input_pattern: pattern.input_pattern,
            expected_output: pattern.expected_output,
            context: pattern.context,
            usage_count: pattern.usage_count,
            success_rate: pattern.success_rate,
            learned_at: pattern.learned_at,
            feedback_scores: pattern.feedback_scores,
            conversation_style: knowledge.conversation_style,
            preferences: knowledge.preferences
          };

          await supabase
            .from('user_learning_patterns')
            .upsert({
              user_id: user.id,
              pattern_type: `assistant_${knowledge.assistant_id}`,
              pattern_data: patternData,
              confidence_score: pattern.confidence,
              last_updated: new Date().toISOString()
            }, {
              onConflict: 'user_id,pattern_type'
            });
        }
      }

      console.log('[AssistantLearningService] Persisted to database');
    } catch (error) {
      // Non-critical - localStorage is the backup
      console.warn('Database persist failed:', error);
    }
  }

  getAssistantKnowledge(assistantId: string): AssistantKnowledge | null {
    return this.knowledgeStore.get(assistantId) || null;
  }

  initializeAssistantKnowledge(assistantId: string, domain: string = 'general'): AssistantKnowledge {
    const knowledge: AssistantKnowledge = {
      id: `knowledge_${assistantId}`,
      assistant_id: assistantId,
      domain,
      patterns: [],
      preferences: {},
      conversation_style: {
        tone: 'professional',
        formality: 'balanced',
        response_length: 'medium',
        expertise_level: 'adaptive'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.knowledgeStore.set(assistantId, knowledge);
    this.saveKnowledgeToStorage();
    return knowledge;
  }

  async learnFromInteraction(
    assistantId: string,
    userInput: string,
    assistantResponse: string,
    context: string = '',
    feedback?: 'positive' | 'negative'
  ): Promise<void> {
    // 🛡️ QUALITY GATE: Never train on errors, 401s, fallback stubs, or trivial messages
    if (!isQualityTrainingInteraction(userInput, assistantResponse)) {
      console.log('🛡️ [Learning Quality Gate] Interaction rejected: contains fallback, error, or low-quality output. Protected 4090 dataset from contamination.');
      return;
    }

    // 🔢 RATE-LIMIT: Only run AI analysis every N messages (skip intermediate ones)
    // Always allow explicit positive feedback through
    const count = (this._msgCounters.get(assistantId) || 0) + 1;
    this._msgCounters.set(assistantId, count);
    const interval = this.learningInterval;

    if (feedback !== 'positive' && count % interval !== 0) {
      // console.log(`⛽ [Learning] Skipping analysis (${count}/${interval} messages). Saves ~2k tokens.`);
      return;
    }

    let knowledge = this.getAssistantKnowledge(assistantId);
    if (!knowledge) {
      knowledge = this.initializeAssistantKnowledge(assistantId);
    }

    // 🧠 CONSOLIDATED ANALYSIS: One AI call for both pattern and style
    try {
      const analysis = await this.analyzeInteraction(
        userInput,
        assistantResponse,
        context,
        knowledge
      );

      if (analysis) {
        // 1. Process Pattern
        if (analysis.pattern) {
          const existingPattern = this.findSimilarPattern(knowledge.patterns, analysis.pattern);
          if (existingPattern) {
            existingPattern.usage_count++;
            existingPattern.last_used = new Date().toISOString();
            if (feedback) {
              const score = feedback === 'positive' ? 1 : 0;
              existingPattern.feedback_scores.push(score);
              existingPattern.success_rate = this.calculateSuccessRate(existingPattern.feedback_scores);
              existingPattern.confidence = Math.min(1, existingPattern.confidence + (feedback === 'positive' ? 0.05 : -0.1));
            } else {
              existingPattern.confidence = Math.min(1, existingPattern.confidence + 0.02);
            }
          } else {
            knowledge.patterns.push(analysis.pattern);
          }
        }

        // 2. Process Style Updates
        if (analysis.styleUpdates) {
          Object.assign(knowledge.conversation_style, analysis.styleUpdates);
        }

        knowledge.updated_at = new Date().toISOString();
        this.knowledgeStore.set(assistantId, knowledge);
        this.saveKnowledgeToStorage();
      }
    } catch (err) {
      console.warn('⚠️ [Learning] Consolidated analysis failed:', err);
    }
  }

  /**
   * Consolidates pattern extraction and style analysis into a single AI call
   * Uses the Utility AI Service for cost efficiency
   */
  private async analyzeInteraction(
    userInput: string,
    assistantResponse: string,
    context: string,
    knowledge: AssistantKnowledge
  ): Promise<{ pattern: LearningPattern | null, styleUpdates: any } | null> {
    try {
      const utilityService = AIServiceFactory.getUtilityService();

      const prompt = `
Analyze this conversation interaction for training and style adaptation:

USER INPUT: "${userInput}"
ASSISTANT RESPONSE: "${assistantResponse}"
CONTEXT: "${context || 'General conversation'}"
DOMAIN: "${knowledge.domain}"
CURRENT STYLE: ${JSON.stringify(knowledge.conversation_style)}

TASK:
1. Extract the core intent/pattern of the user input.
2. Suggest updates to the assistant's conversation style if the interaction reveals a user preference.

Respond in strict JSON format:
{
  "pattern": {
    "intent": "brief description",
    "key_context": "important factors",
    "confidence": 0.8
  },
  "styleUpdates": {
    "tone": "formal/casual",
    "formality": "level",
    "response_length": "brief/detailed",
    "expertise_level": "level"
  }
}
`;

      console.log('🧠 [Learning] Analyzing interaction (Consolidated Utility call)...');
      const response = await utilityService.generateText(prompt);

      if (response) {
        const cleaned = sanitizeJSONResponse(response);
        // Guard: Mock/fallback services return plain text, not JSON
        if (!cleaned.startsWith('{')) {
          console.warn('⚠️ [Learning] AI returned non-JSON response, skipping analysis');
          return null;
        }
        let jsonStr = cleaned;
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) jsonStr = match[0];
        const parsed = JSON.parse(jsonStr);

        const pattern: LearningPattern | null = parsed.pattern ? {
          id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          input_pattern: parsed.pattern.intent || userInput.substring(0, 100),
          expected_output: assistantResponse.substring(0, 500),
          context: parsed.pattern.key_context || context,
          confidence: parsed.pattern.confidence || 0.5,
          usage_count: 1,
          success_rate: 1.0,
          learned_at: new Date().toISOString(),
          last_used: new Date().toISOString(),
          feedback_scores: []
        } : null;

        return {
          pattern,
          styleUpdates: parsed.styleUpdates || null
        };
      }
    } catch (error) {
      console.error('❌ [Learning] Utility analysis failed:', error);
      // Fallback: Create basic pattern without AI
      return {
        pattern: {
          id: `pattern_fs_${Date.now()}`,
          input_pattern: userInput.substring(0, 50),
          expected_output: assistantResponse.substring(0, 500),
          context: context || 'fallback',
          confidence: 0.2,
          usage_count: 1,
          success_rate: 1.0,
          learned_at: new Date().toISOString(),
          last_used: new Date().toISOString(),
          feedback_scores: []
        },
        styleUpdates: null
      };
    }
    return null;
  }

  private findSimilarPattern(patterns: LearningPattern[], newPattern: LearningPattern): LearningPattern | null {
    const similarity = (a: string, b: string): number => {
      const wordsA = a.toLowerCase().split(' ');
      const wordsB = b.toLowerCase().split(' ');
      const intersection = wordsA.filter(word => wordsB.includes(word));
      return intersection.length / Math.max(wordsA.length, wordsB.length);
    };

    for (const pattern of patterns) {
      const inputSimilarity = similarity(pattern.input_pattern, newPattern.input_pattern);
      const contextSimilarity = similarity(pattern.context, newPattern.context);

      if (inputSimilarity > 0.7 && contextSimilarity > 0.6) {
        return pattern;
      }
    }

    return null;
  }

  private calculateSuccessRate(feedbackScores: number[]): number {
    if (feedbackScores.length === 0) return 1.0;
    return feedbackScores.reduce((sum, score) => sum + score, 0) / feedbackScores.length;
  }

  async generateContextualResponse(
    assistantId: string,
    userInput: string,
    context: string = ''
  ): Promise<string | null> {
    const knowledge = this.getAssistantKnowledge(assistantId);
    if (!knowledge) return null;

    try {
      const aiService = AIServiceFactory.getInstance();

      // Find relevant patterns
      const relevantPatterns = this.findRelevantPatterns(knowledge.patterns, userInput, context);

      const responsePrompt = `
Generate a response based on this assistant's learned knowledge:

User Input: "${userInput}"
Context: "${context}"

Assistant Knowledge:
- Domain: ${knowledge.domain}
- Conversation Style: ${JSON.stringify(knowledge.conversation_style)}
- Total Patterns Learned: ${knowledge.patterns.length}

Relevant Learned Patterns:
${relevantPatterns.map(p => `
- Pattern: ${p.input_pattern}
- Example Response: ${p.expected_output.substring(0, 200)}...
- Confidence: ${p.confidence}
- Success Rate: ${p.success_rate}
`).join('\n')}

Generate a response that:
1. Follows the learned conversation style
2. Uses insights from relevant patterns
3. Maintains consistency with previous successful interactions
4. Adapts to the current context
`;

      const response = await aiService.generateText(responsePrompt);

      if (response && typeof response === 'string') {
        // Learn from this new interaction
        await this.learnFromInteraction(assistantId, userInput, response, context);
        return response;
      }
    } catch (error) {
      console.error('Failed to generate contextual response:', error);
    }

    return null;
  }

  private findRelevantPatterns(
    patterns: LearningPattern[],
    userInput: string,
    context: string,
    maxPatterns: number = 5
  ): LearningPattern[] {
    const scored = patterns.map(pattern => ({
      pattern,
      score: this.calculateRelevanceScore(pattern, userInput, context)
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, maxPatterns)
      .map(item => item.pattern);
  }

  private calculateRelevanceScore(
    pattern: LearningPattern,
    userInput: string,
    context: string
  ): number {
    const similarity = (a: string, b: string): number => {
      const wordsA = a.toLowerCase().split(' ');
      const wordsB = b.toLowerCase().split(' ');
      const intersection = wordsA.filter(word => wordsB.includes(word));
      return intersection.length / Math.max(wordsA.length, wordsB.length);
    };

    const inputSimilarity = similarity(pattern.input_pattern, userInput);
    const contextSimilarity = similarity(pattern.context, context);
    const confidenceWeight = pattern.confidence;
    const successWeight = pattern.success_rate;

    return (inputSimilarity * 0.4 + contextSimilarity * 0.3 + confidenceWeight * 0.2 + successWeight * 0.1);
  }

  getAssistantStats(assistantId: string): any {
    const knowledge = this.getAssistantKnowledge(assistantId);
    if (!knowledge) return null;

    const totalPatterns = knowledge.patterns.length;
    const highConfidencePatterns = knowledge.patterns.filter(p => p.confidence > 0.7).length;
    const averageSuccessRate = knowledge.patterns.length > 0
      ? knowledge.patterns.reduce((sum, p) => sum + p.success_rate, 0) / knowledge.patterns.length
      : 0;

    return {
      total_patterns: totalPatterns,
      high_confidence_patterns: highConfidencePatterns,
      average_success_rate: averageSuccessRate,
      conversation_style: knowledge.conversation_style,
      domain: knowledge.domain,
      last_updated: knowledge.updated_at
    };
  }

  exportKnowledge(assistantId: string): string | null {
    const knowledge = this.getAssistantKnowledge(assistantId);
    if (!knowledge) return null;

    return JSON.stringify(knowledge, null, 2);
  }

  importKnowledge(assistantId: string, knowledgeJson: string): boolean {
    try {
      const knowledge: AssistantKnowledge = JSON.parse(knowledgeJson);
      knowledge.assistant_id = assistantId; // Ensure correct ID
      knowledge.updated_at = new Date().toISOString();

      this.knowledgeStore.set(assistantId, knowledge);
      this.saveKnowledgeToStorage();
      return true;
    } catch (error) {
      console.error('Failed to import knowledge:', error);
      return false;
    }
  }

  /**
   * 🚀 Export Clean JSONL Fine-Tuning Dataset for NVIDIA RTX 4090
   * Strips all fallbacks, errors, or unverified outputs, producing clean
   * Alpaca/ShareGPT JSONL records ready for Unsloth, LLaMA-Factory, or Axolotl.
   */
  exportRTX4090FineTuningDataset(assistantId?: string): string {
    const records: Array<{ messages: Array<{ role: string; content: string }> }> = [];

    const knowledgeList = assistantId
      ? [this.getAssistantKnowledge(assistantId)].filter(Boolean)
      : Array.from(this.knowledgeStore.values());

    for (const k of knowledgeList) {
      if (!k) continue;
      const systemPrompt = `You are an elite sovereign California Workers' Compensation calculation and legal analysis engine. Assistant Domain: ${k.domain}.`;

      for (const pattern of k.patterns) {
        if (!pattern.input_pattern || !pattern.expected_output) continue;
        if (!isQualityTrainingInteraction(pattern.input_pattern, pattern.expected_output)) {
          continue; // Quality gate excludes corrupted/fallback outputs
        }

        records.push({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: pattern.input_pattern },
            { role: 'assistant', content: pattern.expected_output }
          ]
        });
      }
    }

    return records.map(r => JSON.stringify(r)).join('\n');
  }
}
