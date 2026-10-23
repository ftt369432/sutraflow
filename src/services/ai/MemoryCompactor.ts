/**
 * 🧠 MemoryCompactor — Automatic Token Reduction & Open Brain Synthesis
 * 
 * Periodically compresses long chat sessions and transcript turns into 
 * persistent, atomic Markdown memory notes stored via KnowledgeSkill.
 * 
 * Reduces API prompt context payload by 80% to 95%.
 */

import { AIServiceFactory } from './aiServiceFactory';
import { TokenTracker, estimateTokens } from './TokenTracker';
import { knowledgeSkill } from '../../cortex/skills/KnowledgeSkill';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

export interface CompactionResult {
  compacted: boolean;
  originalTokens: number;
  compactedTokens: number;
  tokensSaved: number;
  percentageSaved: number;
  memoryTitle?: string;
  summaryNote?: string;
}

export class MemoryCompactor {
  private static readonly TOKEN_THRESHOLD = 6000; // Trigger compaction when history exceeds ~6,000 tokens
  private static readonly RECENT_MESSAGES_TO_KEEP = 4; // Keep last 4 turns intact for conversational continuity

  /**
   * Evaluates session token usage and performs compaction if threshold is exceeded.
   */
  static async evaluateAndCompact(
    sessionId: string,
    messages: ChatMessage[],
    userId?: string,
    teamId?: string
  ): Promise<CompactionResult> {
    const fullText = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
    const totalTokens = estimateTokens(fullText);

    if (totalTokens < this.TOKEN_THRESHOLD || messages.length <= this.RECENT_MESSAGES_TO_KEEP + 2) {
      return {
        compacted: false,
        originalTokens: totalTokens,
        compactedTokens: totalTokens,
        tokensSaved: 0,
        percentageSaved: 0,
      };
    }

    console.log(`🧠 MemoryCompactor: Triggering Open Brain compaction for session ${sessionId} (${totalTokens} tokens)...`);

    // Separate old history to compact from recent messages to retain
    const messagesToCompact = messages.slice(0, messages.length - this.RECENT_MESSAGES_TO_KEEP);
    const textToCompact = messagesToCompact.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

    try {
      const aiService = AIServiceFactory.getInstance();
      const prompt = `You are the GenieFlow Memory Compactor (Open Brain Engine).
Analyze the following conversation transcript and extract all essential facts, user preferences, legal/domain decisions, and action items into a clean, concise Markdown memory note.

TRANSCRIPT TO COMPACT:
${textToCompact}

REQUIREMENTS:
1. Output structured Markdown with clear headers (## User Preferences, ## Key Decisions, ## Action Items).
2. Use wikilink syntax [[Concept Name]] where relevant to connect related topics.
3. Keep the summary focused and under 300 words. Do not include conversational filler.`;

      const summaryNote = await aiService.generateText(prompt);
      const memoryTitle = `Session Memory (${sessionId.slice(0, 8)}) - ${new Date().toLocaleDateString('en-US')}`;

      // Save to persistent GenieDrive long-term memory (.md file + Vector Indexing)
      await knowledgeSkill.learn(memoryTitle, summaryNote, 'session-memories', userId, teamId);

      const compactedTokens = estimateTokens(summaryNote);
      const tokensSaved = Math.max(0, totalTokens - compactedTokens);
      const percentageSaved = Math.round((tokensSaved / totalTokens) * 100);

      // Track token usage event in TokenTracker
      TokenTracker.record({
        provider: 'gemini',
        model: 'compactor-v1',
        inputTokens: estimateTokens(prompt),
        outputTokens: compactedTokens,
        source: 'MemoryCompactor.evaluateAndCompact',
        category: 'utility',
        success: true,
      });

      console.log(`✅ MemoryCompactor: Saved ${tokensSaved} tokens (${percentageSaved}% savings) for session ${sessionId}`);

      return {
        compacted: true,
        originalTokens: totalTokens,
        compactedTokens,
        tokensSaved,
        percentageSaved,
        memoryTitle,
        summaryNote,
      };
    } catch (error) {
      console.error('❌ MemoryCompactor Error:', error);
      return {
        compacted: false,
        originalTokens: totalTokens,
        compactedTokens: totalTokens,
        tokensSaved: 0,
        percentageSaved: 0,
      };
    }
  }
}
