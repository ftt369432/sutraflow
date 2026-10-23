/**
 * 🎙️ UNIVERSAL VOICE → TOOL BRIDGE
 *
 * Sprint 2: Replaces the rigid regex command parser in VoiceController with a
 * real LLM intent classifier. Any voice transcript is sent to the AI which
 * returns a structured { tool, params } dispatch object.
 *
 * Result: Every tool in ToolRegistry becomes voice-accessible without writing
 * new regex patterns. Just speak naturally, and GenieFlow routes it.
 *
 * Flow:
 *   Mic → Web Speech API transcript
 *   → UniversalVoiceToolBridge.classify(transcript)
 *   → { tool: "schedule_event", params: { title: "WCAB Hearing", ... } }
 *   → ToolRegistry.executeTool(tool, params)
 *   → Speak result back to user
 */

import { AIServiceFactory } from '../ai/aiServiceFactory';
import { agenticToolRegistry } from '../agents/ToolRegistry';

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────

export interface VoiceDispatch {
  tool: string;
  params: Record<string, any>;
  intent: string;
  confidence: number;
  rawTranscript: string;
}

export interface VoiceBridgeResult {
  success: boolean;
  dispatch?: VoiceDispatch;
  toolResult?: any;
  spokenResponse: string;
  error?: string;
}

// ──────────────────────────────────────────────────────────
// UniversalVoiceToolBridge
// ──────────────────────────────────────────────────────────

export class UniversalVoiceToolBridge {
  private static instance: UniversalVoiceToolBridge;

  private constructor() {}

  static getInstance(): UniversalVoiceToolBridge {
    if (!UniversalVoiceToolBridge.instance) {
      UniversalVoiceToolBridge.instance = new UniversalVoiceToolBridge();
    }
    return UniversalVoiceToolBridge.instance;
  }

  /**
   * 🧠 Classify a voice transcript using LLM and dispatch to ToolRegistry.
   *
   * @param transcript - The raw voice transcript text
   * @param contextHints - Optional app context (current page, open document, etc.)
   */
  async processTranscript(
    transcript: string,
    contextHints?: Record<string, any>
  ): Promise<VoiceBridgeResult> {
    console.log('🎙️ UniversalVoiceToolBridge: Processing transcript:', transcript);

    try {
      // Step 1: Classify with LLM
      const dispatch = await this.classifyWithLLM(transcript, contextHints);
      if (!dispatch) {
        return {
          success: false,
          spokenResponse: "I didn't understand that. Could you rephrase?",
          error: 'LLM returned no valid dispatch'
        };
      }

      console.log('🎯 Dispatching to tool:', dispatch.tool, dispatch.params);

      // Step 2: Execute tool
      const toolResult = await agenticToolRegistry.executeTool(dispatch.tool, dispatch.params);

      // Step 3: Generate spoken response
      const spokenResponse = await this.generateSpokenResponse(transcript, dispatch, toolResult);

      return {
        success: toolResult.success,
        dispatch,
        toolResult,
        spokenResponse
      };

    } catch (err) {
      console.error('❌ UniversalVoiceToolBridge error:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      return {
        success: false,
        spokenResponse: `I encountered an error: ${message}. Please try again.`,
        error: message
      };
    }
  }

  /**
   * 🧠 LLM Intent Classifier
   *
   * Sends the transcript to the AI and gets back a structured dispatch JSON.
   */
  private async classifyWithLLM(
    transcript: string,
    contextHints?: Record<string, any>
  ): Promise<VoiceDispatch | null> {
    const availableTools = [
      { name: 'search_knowledge_base', description: 'Search the knowledge base / documents / files', exampleParams: '{"query": "workers comp petition template"}' },
      { name: 'create_task', description: 'Create a new task or to-do item', exampleParams: '{"title": "Follow up with client", "priority": "high", "dueDate": "2026-06-25"}' },
      { name: 'schedule_event', description: 'Schedule a calendar event or meeting', exampleParams: '{"title": "WCAB Hearing", "startTime": "2026-06-25T14:00:00", "attendees": []}' },
      { name: 'get_calendar', description: 'View calendar events for today, this week, or a date range', exampleParams: '{"period": "today"}' },
      { name: 'read_emails', description: 'Read emails from inbox or specific folder', exampleParams: '{"folder": "INBOX", "maxResults": 10}' },
      { name: 'analyze_email', description: 'Analyze an email for action items, meetings, or deadlines', exampleParams: '{"analysisType": "actionable_items"}' },
      { name: 'auto_calendar', description: 'Automatically extract events from email content and create calendar entries', exampleParams: '{}' },
      { name: 'create_canvas_document', description: 'Create a new document in the canvas workspace', exampleParams: '{"title": "Draft Petition", "content": "..."}' },
      { name: 'create_folder', description: 'Create a new folder in AI Drive', exampleParams: '{"name": "WCAB Cases 2026"}' },
      { name: 'search_web', description: 'Search the web for real-time information', exampleParams: '{"query": "California Labor Code 5402"}' },
      { name: 'navigate_browser', description: 'Open the browser and navigate to a URL', exampleParams: '{"url": "https://www.wcab.ca.gov"}' },
      { name: 'open_panel', description: 'Open a specific UI panel (canvas, email, calendar, chat)', exampleParams: '{"panel": "email"}' },
      { name: 'fetch_market_intelligence', description: 'Get stock market data and analysis for a ticker', exampleParams: '{"symbol": "NVDA"}' },
      { name: 'search_legal_codes', description: 'Search California Labor Code and legal regulations', exampleParams: '{"query": "Labor Code 5402 workers comp"}' },
      { name: 'medcare_list_cases', description: 'List all cases from the Medcare law system', exampleParams: '{}' }
    ];

    const toolList = availableTools.map(t =>
      `- ${t.name}: ${t.description}\n  Example params: ${t.exampleParams}`
    ).join('\n');

    const classifierPrompt = `You are the GenieFlow Voice Command Classifier. Your job is to convert a natural language voice transcript into a structured tool dispatch command.

Voice Transcript: "${transcript}"
Current App Context: ${JSON.stringify(contextHints || {})}

Available Tools:
${toolList}

Instructions:
- Analyze the transcript and pick the BEST matching tool
- Extract relevant parameters from the transcript
- If the user mentions a time like "tomorrow at 2pm", convert it to ISO format based on current time ${new Date().toISOString()}
- If the transcript is ambiguous, pick the most likely tool with best-guess params
- If no tool matches (e.g. the user is just chatting), set tool to "open_panel" with panel "chat"

Respond ONLY with a valid JSON object (no markdown, no explanation):
{
  "tool": "<tool_name>",
  "params": { <key-value pairs matching the tool's parameters> },
  "intent": "<brief description of what the user wants>",
  "confidence": <0.0-1.0>
}`;

    try {
      const ai = AIServiceFactory.getUtilityService();
      const raw = await ai.generateText(classifierPrompt, {
        _trackerSource: 'UniversalVoiceToolBridge.classify',
        _trackerCategory: 'voice'
      });

      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (!parsed.tool || typeof parsed.tool !== 'string') {
        throw new Error('Invalid classification response — missing tool field');
      }

      return {
        tool: parsed.tool,
        params: parsed.params || {},
        intent: parsed.intent || transcript,
        confidence: parsed.confidence || 0.75,
        rawTranscript: transcript
      };
    } catch (err) {
      console.error('❌ LLM classification failed:', err);
      return null;
    }
  }

  /**
   * 🔊 Generate a natural spoken response for the result
   */
  private async generateSpokenResponse(
    originalRequest: string,
    dispatch: VoiceDispatch,
    toolResult: any
  ): Promise<string> {
    if (!toolResult.success) {
      return `I tried to ${dispatch.intent} but encountered an issue: ${toolResult.error || 'unknown error'}. Please check and try again.`;
    }

    // Generate context-aware response based on tool
    const resultSummary = toolResult.data
      ? (typeof toolResult.data === 'string'
          ? toolResult.data.substring(0, 200)
          : JSON.stringify(toolResult.data).substring(0, 200))
      : 'Done';

    const responsePrompt = `Generate a brief, conversational spoken response (1-2 sentences) for this voice assistant result.

User asked: "${originalRequest}"
Tool used: ${dispatch.tool}
Intent: ${dispatch.intent}
Result summary: ${resultSummary}

Be concise, friendly, and confirm what was done. No markdown. Plain speech only.`;

    try {
      const ai = AIServiceFactory.getUtilityService();
      const response = await ai.generateText(responsePrompt, {
        _trackerSource: 'UniversalVoiceToolBridge.speak',
        _trackerCategory: 'voice'
      });
      return response.trim();
    } catch {
      // Fallback simple responses
      const fallbacks: Record<string, string> = {
        schedule_event: 'Got it, your event has been scheduled.',
        create_task: 'Task created successfully.',
        read_emails: 'Here are your emails.',
        search_knowledge_base: 'I found some results in your knowledge base.',
        create_canvas_document: 'Document created in your canvas.',
        get_calendar: 'Here are your upcoming events.',
        auto_calendar: 'I processed your emails and updated your calendar.'
      };
      return fallbacks[dispatch.tool] || `Done. ${dispatch.intent} completed successfully.`;
    }
  }

  /**
   * 🎤 Quick classify-only (no execution) — useful for previewing what will happen
   */
  async classify(transcript: string): Promise<VoiceDispatch | null> {
    return this.classifyWithLLM(transcript);
  }
}

// Singleton export
export const universalVoiceToolBridge = UniversalVoiceToolBridge.getInstance();

// Expose globally for testing
if (typeof window !== 'undefined') {
  (window as any).universalVoiceToolBridge = universalVoiceToolBridge;
}
