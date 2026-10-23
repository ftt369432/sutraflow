import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from '@google/generative-ai';
import { getEnv } from '../config/env';
import { EmailMessage, EmailAnalysis, EmailAnalysisMeetingDetails } from './email/types';
import type { Workflow, WorkflowStep } from '../store/workflowStore';

export class GeminiSimplifiedService {
  private client: GoogleGenerativeAI;
  private defaultModel = 'gemini-3.8-flash';
  private maxRetries = 1; // 🧠 Fail faster to allow provider rotation
  private initialDelayMs = 500;

  constructor() {
    try {
      const env = getEnv();
      const apiKey = env.geminiApiKey;

      if (!apiKey || apiKey === "your_gemini_key_here" || (apiKey && apiKey.length < 20)) {
        console.warn('[GeminiSimplifiedService] Constructor: INVALID or PLACEHOLDER API Key detected.');
      }

      this.client = apiKey ? new GoogleGenerativeAI(apiKey) : (null as any);
      // Read active model preference; auto-migrate legacy retired models to gemini-3.8-flash
      let storedModel = typeof window !== 'undefined' ? localStorage.getItem('genieflow_gemini_model') : null;
      if (storedModel === 'gemini-2.0-flash' || storedModel === 'gemini-1.5-flash' || (storedModel && !storedModel.startsWith('gemini-'))) {
        storedModel = 'gemini-3.8-flash';
        if (typeof window !== 'undefined') {
          localStorage.setItem('genieflow_gemini_model', 'gemini-3.8-flash');
        }
      }
      const envModel = env.aiModel || '';
      const chosenModel = storedModel || (envModel.includes('gemini') ? envModel : '') || 'gemini-3.8-flash';
      this.defaultModel = chosenModel;
      console.log(`[GeminiSimplifiedService] Default model set to: ${this.defaultModel}`);
    } catch (error) {
      console.error('[GeminiSimplifiedService] Error initializing GeminiSimplifiedService:', error);
      // Don't re-throw, handle at call time
    }
  }

  private async exponentialBackoffRetry<T>(
    fn: () => Promise<T>,
    retries = this.maxRetries,
    delayMs = this.initialDelayMs
  ): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const isRetryable =
        (error instanceof GoogleGenerativeAIFetchError && (error.status === 429 || error.status === 503 || error.status === 500)) ||
        (error instanceof Error && (
          error.message.includes('429') ||
          error.message.includes('503') ||
          error.message.includes('high demand') ||
          error.message.includes('Service Unavailable') ||
          error.message.includes('Quota exceeded')
        ));

      if (isRetryable) {
        if (retries > 0) {
          console.warn(
            `Gemini API temporary issue (${error?.status || '503/429/overload'}). Retrying in ${delayMs / 1000}s... (${retries} retries left)`
          );
          let actualDelay = delayMs;
          if (error.message) {
            const match = error.message.match(/"retryDelay":"(\\d+)s"/);
            if (match && match[1]) {
              actualDelay = parseInt(match[1], 10) * 1000;
            }
          }
          await new Promise(resolve => setTimeout(resolve, actualDelay));
          return this.exponentialBackoffRetry(fn, retries - 1, delayMs * 2);
        } else {
          console.error('Gemini API rate limit or capacity retries exhausted.');
          throw error;
        }
      }
      console.error('Gemini API encountered non-retryable error:', error);
      throw error;
    }
  }

  async generateText(prompt: string, options?: { 
    apiKey?: string; 
    temperature?: number; 
    maxTokens?: number;
    model?: string;
    image?: string;
    inline?: boolean;
  }): Promise<string> {
    const rawModel = options?.model || (options?.image ? (getEnv().models.vision.includes('gemini') ? getEnv().models.vision : 'gemini-3.8-flash') : this.defaultModel);
    const primaryModel = (rawModel === 'gemini-2.0-flash' || rawModel === 'gemini-1.5-flash') ? 'gemini-3.8-flash' : rawModel;
    
    // Model fallback chain: prioritize active modern Gemini models
    const candidateModels = [
      primaryModel,
      'gemini-3.8-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash'
    ].filter((m, i, arr) => arr.indexOf(m) === i && !!m);

    let lastError: any = null;

    for (const modelToUse of candidateModels) {
      const apiCall = async () => {
        // If ad-hoc apiKey provided, use it, otherwise use initialized or lazily resolved client
        let client = options?.apiKey ? new GoogleGenerativeAI(options.apiKey) : this.client;
        if (!client) {
          const env = getEnv();
          const key = env.geminiApiKey || (typeof process !== 'undefined' ? (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY) : '');
          if (key && key !== 'your_gemini_key_here') {
            this.client = new GoogleGenerativeAI(key);
            client = this.client;
          }
        }
        if (!client) throw new Error('Gemini API client not initialized');

        const modelInstance = client.getGenerativeModel({
          model: modelToUse,
          generationConfig: {
            temperature: options?.temperature,
            maxOutputTokens: options?.maxTokens,
          }
        });

        // Handle multimodal inputs (images)
        if (options?.image) {
          const parts = [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: options.image
              }
            }
          ];
          const result = await modelInstance.generateContent(parts);
          const response = await result.response;
          return response.text() || '';
        }

        const result = await modelInstance.generateContent(prompt);
        const response = await result.response;
        return response.text() || '';
      };

      try {
        return await this.exponentialBackoffRetry(apiCall);
      } catch (err: any) {
        lastError = err;
        const isTemporaryOrNotFound = (
          err?.status === 503 ||
          err?.status === 404 ||
          err?.status === 429 ||
          (err?.message && (
            err.message.includes('503') ||
            err.message.includes('high demand') ||
            err.message.includes('Service Unavailable') ||
            err.message.includes('not found') ||
            err.message.includes('404')
          ))
        );

        if (isTemporaryOrNotFound && modelToUse !== candidateModels[candidateModels.length - 1]) {
          console.warn(`[GeminiSimplifiedService] Model ${modelToUse} failed (${err.message || 'temporary issue'}). Cascading to fallback model...`);
          continue;
        }
        break;
      }
    }

    throw lastError;
  }

  /**
   * Get a streamed completion from the Gemini API
   * This allows for real-time, chain-of-thought responses
   */
  async getCompletionStreaming(
    parts: Array<{ text: string } | { inlineData: { mimeType: string, data: string } }>,
    options?: {
      temperature?: number;
      maxTokens?: number;
      onUpdate?: (text: string) => void;  // Callback for each chunk
    }
  ): Promise<string> {
    const apiCall = async () => {
      const modelInstance = this.client.getGenerativeModel({
        model: this.defaultModel,
        generationConfig: {
          temperature: options?.temperature,
          maxOutputTokens: options?.maxTokens,
        }
      });

      const result = await modelInstance.generateContentStream(parts);
      let fullText = '';

      // Process each chunk as it comes in
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          fullText += chunkText;
          // Call the update callback if provided
          if (options?.onUpdate) {
            options.onUpdate(fullText);
          }
        }
      }

      return fullText;
    };

    try {
      return await this.exponentialBackoffRetry(apiCall);
    } catch (error) {
      console.error('[GeminiSimplifiedService] Error in getCompletionStreaming:', error);
      throw error;
    }
  }

  async getCompletion(parts: Array<{ text: string } | { inlineData: { mimeType: string, data: string } }>, options?: { temperature?: number; maxTokens?: number }): Promise<string> {
    const apiCall = async () => {
      const modelInstance = this.client.getGenerativeModel({
        model: this.defaultModel,
        generationConfig: {
          temperature: options?.temperature,
          maxOutputTokens: options?.maxTokens,
        }
      });

      const result = await modelInstance.generateContent(parts);
      const response = await result.response;

      // console.log('[GeminiSimplifiedService] Raw API Response Object:', response);
      try {
        // console.log('[GeminiSimplifiedService] Response Candidates JSON:', JSON.stringify(response.candidates, null, 2));
      } catch { // removed _e
        // console.log('[GeminiSimplifiedService] Could not stringify response.candidates:', response.candidates);
      }
      try {
        // console.log('[GeminiSimplifiedService] Response Prompt Feedback JSON:', JSON.stringify(response.promptFeedback, null, 2));
      } catch { // removed _e
        // console.log('[GeminiSimplifiedService] Could not stringify response.promptFeedback:', response.promptFeedback);
      }

      const textResponse = response.text() || '';
      return textResponse;
    };

    try {
      return await this.exponentialBackoffRetry(apiCall);
    } catch (error) {
      console.error('[GeminiSimplifiedService] Error in getCompletion (after retry logic):', error);
      throw error;
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    const apiCall = async () => {
      if (!this.client) throw new Error('Gemini API client not initialized');
      const model = this.client.getGenerativeModel({ model: 'embedding-001' });
      const embedResult = await model.embedContent(text);
      const values = embedResult.embedding.values;
      if (!values) {
        throw new Error('Embedding values are missing in the response');
      }
      return values;
    };

    try {
      return await this.exponentialBackoffRetry(apiCall);
    } catch (error) {
      console.error('Error getting embedding:', error);
      throw error;
    }
  }

  async analyzeEmailForCalendarEvent(email: EmailMessage): Promise<EmailAnalysis> {
    const currentYear = new Date().getFullYear(); // Current year is 2025
    const currentDate = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format

    const prompt = `Analyze the following email content and extract information for a calendar event and general email analysis.

IMPORTANT CONTEXT:
- Current Date: ${currentDate}
- Current Year: ${currentYear}
- When parsing dates, if no year is specified, assume ${currentYear}
- For relative dates like "Thursday, August 7", interpret as August 7, ${currentYear}

Email Subject: "${email.subject}"
Email Body:
\\"""
${email.body}
\\"""
Email Date: "${email.date}" // This is the received date, use for context.

Please determine if this email discusses a new meeting, an update to an existing meeting, or is not related to a calendar event.

If it IS related to a calendar event, extract the following details for the 'meetingDetails' object:
- eventTitle: A concise title for the calendar event (e.g., "MSC for Richard Nombrano", "Hearing for John Doe").
- eventDate: The date of the event in YYYY-MM-DD format. CRITICAL: If the email mentions dates like "Thursday, August 7" or "August 7", interpret as ${currentYear}-08-07. Always use ${currentYear} unless a different year is explicitly stated.
- eventTime: The start time of the event (HH:MM AM/PM format preferred). For times like "13:30" convert to "1:30 PM". If not specified, state "Not Specified".
- endTime: The end time of the event (HH:MM AM/PM format preferred). For times like "14:30" convert to "2:30 PM". If not specified but duration is implied (like "1:30 – 2:30pm"), extract the end time.
- timeZone: The timezone for the event (e.g., "America/Los_Angeles", "PST", "Pacific"). If not specified, assume "America/Los_Angeles" (Pacific Time).
- location: The location of the event. Look for video conference links, court addresses, or meeting rooms. If not specified, state "Not Specified".
- attendees: A list of attendee email addresses, if any.
- description: Extract the full, unsummarized text from the email body that directly pertains to the meeting's agenda, notes, or discussion points. This should be the detailed content for the calendar event description. If no specific notes are present, this can be a brief summary.
- caseNumber: Extract any case number or similar identifier (e.g., ADJ4690879, ADJxxxxxxx, WCxxxx). If not present, leave blank.
- attachments: An array of objects, where each object represents a file attachment from the email that is relevant to this event. Each object should have 'fileName' and 'fileId' (placeholder for now, actual URL will be handled later). Example: [{"fileName": "document.pdf", "fileId": "placeholder_id_123"}]. If no relevant attachments, this should be an empty array or omitted.
- eventType: The type of event. Prioritize specific legal hearing types if mentioned (e.g., "MSC", "Lien Conference", "Status Conference", "Priority Conference", "Trial"). Otherwise, use more general types like "Hearing", "Meeting", "Call", "Deadline". If not clear, use "General Event".
- personInvolved: The primary person or client name involved in the event (e.g., "Richard Nombrano", "Miguel Corpeno", "Jane Smith"). If not clearly identifiable, leave blank.
- judgeName: The name of the judge, if mentioned (e.g., "Judge David Pollak", "Randal Hursh", "Judge Smith"). If not applicable or not mentioned, leave blank.

Also, provide a general analysis of the email with the following top-level keys:
- priority: "high", "medium", or "low".
- category: A relevant category for the email (e.g., "Legal", "Work Update", "Personal").
- sentiment: "positive", "negative", "neutral", or "urgent".
- actionItems: A list of action items from the email.
- summary: A brief summary of the entire email.
- keywords: A list of relevant keywords.
- isCourtDocument: true or false.
- isReplyRequired: true or false.
- suggestedReply: A brief suggested reply if applicable.
- followUpDate: A suggested follow-up date (YYYY-MM-DD) if applicable.
- isMeeting: Set to true if meetingDetails are present and contain at least an eventTitle, eventDate, and eventTime; false otherwise.

Format your entire response as a SINGLE, RAW JSON object. The top-level keys of this object should DIRECTLY correspond to the EmailAnalysis interface fields listed above (e.g., "priority", "category", "summary", "meetingDetails", "isMeeting", etc.).
Do NOT wrap this JSON object within another key (like "emailAnalysis": { ... }).
The calendar event details should be nested under the 'meetingDetails' key *within* this main JSON object.

Example of the expected JSON structure (fields in meetingDetails are optional if not found):
{
  "priority": "high",
  "category": "Legal",
  "summary": "MSC hearing scheduled for Richard Nombrano with Judge David Pollak",
  "actionItems": [{"id": "1", "text": "Attend MSC hearing"}],
  "keywords": ["MSC", "hearing", "Richard Nombrano", "Judge David Pollak", "ADJ4690879"],
  "isCourtDocument": true,
  "isReplyRequired": false,
  "suggestedReply": "",
  "followUpDate": "2025-08-06",
  "meetingDetails": { 
    "eventTitle": "MSC for Richard Nombrano",
    "eventDate": "2025-08-07",
    "eventTime": "1:30 PM",
    "endTime": "2:30 PM",
    "timeZone": "America/Los_Angeles",
    "location": "Video Conference: https://video.courtcall.com/join/7oqngzEHbM",
    "attendees": [],
    "description": "Workers' Compensation Appeals Board Hearing for Richard Nombrano, case number ADJ4690879. Type of hearing: MSC. Judge: David Pollak. This hearing is being held virtually.",
    "caseNumber": "ADJ4690879",
    "attachments": [],
    "eventType": "MSC",
    "personInvolved": "Richard Nombrano",
    "judgeName": "Judge David Pollak"
  },
  "isMeeting": true
}

If the email is NOT about a calendar event, the 'meetingDetails' field should NOT be included in the JSON response (i.e., it should be undefined in the resulting object), and 'isMeeting' should be set to false.
If the email IS about a calendar event, 'isMeeting' must be true, and 'meetingDetails' must be populated with extracted details.

Your response MUST be ONLY the JSON object itself, starting with '{' and ending with '}'. Do not include any explanatory text, markdown formatting (like \\\`\\\`\\\`json ... \\\`\\\`\\\` or \\\`\\\`\\\` ... \\\`\\\`\\\`), or anything else outside of the JSON structure. The response must be directly parsable as JSON.
`;

    let rawAiResponseText = '';
    let jsonToParse: string = '';

    try {
      rawAiResponseText = await this.generateText(prompt);
      jsonToParse = rawAiResponseText.trim();

      if (jsonToParse.startsWith("```json\n") && jsonToParse.endsWith("\n```")) {
        jsonToParse = jsonToParse.substring("```json\n".length, jsonToParse.length - "\n```".length).trim();
      } else if (jsonToParse.startsWith("```") && jsonToParse.endsWith("```")) {
        jsonToParse = jsonToParse.substring(3, jsonToParse.length - 3).trim();
        if (jsonToParse.toLowerCase().startsWith("json\n")) {
          jsonToParse = jsonToParse.substring("json\n".length).trim();
        }
      }
      if (jsonToParse.startsWith("```")) {
        const markdownRegex = /^```(?:json)?\s*([\s\S]*?)\s*```$/;
        const markdownMatch = jsonToParse.match(markdownRegex);
        if (markdownMatch && markdownMatch[1]) {
          jsonToParse = markdownMatch[1].trim();
        }
      }

      let parsedResponse = JSON.parse(jsonToParse);

      const topLevelKeys = Object.keys(parsedResponse);
      if (topLevelKeys.length === 1 && typeof parsedResponse[topLevelKeys[0]] === 'object' && parsedResponse[topLevelKeys[0]] !== null) {
        const nestedObject = parsedResponse[topLevelKeys[0]];
        if ('priority' in nestedObject || 'summary' in nestedObject || 'meetingDetails' in nestedObject || 'isMeeting' in nestedObject) {
          parsedResponse = nestedObject;
        }
      }

      const meetingDetails = parsedResponse.meetingDetails || undefined;
      const isMeeting = !!(meetingDetails && meetingDetails.eventTitle && meetingDetails.eventDate && meetingDetails.eventTime);

      const finalMeetingDetails: EmailAnalysisMeetingDetails | undefined = meetingDetails ? {
        eventTitle: meetingDetails.eventTitle,
        caseNumber: meetingDetails.caseNumber,
        eventType: meetingDetails.eventType,
        eventDate: meetingDetails.eventDate,
        eventTime: meetingDetails.eventTime,
        endTime: meetingDetails.endTime,
        timeZone: meetingDetails.timeZone,
        location: meetingDetails.location,
        attendees: meetingDetails.attendees,
        description: meetingDetails.description,
        personInvolved: meetingDetails.personInvolved,
        judgeName: meetingDetails.judgeName,
      } : undefined;

      const analysisResult: EmailAnalysis = {
        messageId: email.id,
        priority: parsedResponse.priority || 'medium',
        category: parsedResponse.category || 'Uncategorized',
        sentiment: parsedResponse.sentiment || 'neutral',
        actionItems: parsedResponse.actionItems || [],
        summary: parsedResponse.summary || 'No summary provided.',
        keywords: parsedResponse.keywords || [],
        isCourtDocument: parsedResponse.isCourtDocument === undefined ? false : parsedResponse.isCourtDocument,
        isReplyRequired: parsedResponse.isReplyRequired === undefined ? false : parsedResponse.isReplyRequired,
        suggestedReply: parsedResponse.suggestedReply || '',
        followUpDate: parsedResponse.followUpDate || '',
        meetingDetails: finalMeetingDetails,
        rawAiResponse: rawAiResponseText,
        isMeeting: isMeeting,
        calendarEventId: null,
        calendarEventStatus: 'pending_analysis',
        calendarEventError: null,
        error: undefined,
        calendarEventDetails: null,
      };

      return analysisResult;

    } catch (error) {
      console.error('Error analyzing email for calendar event:', error);
      console.error('Raw AI Response that caused error:', JSON.stringify(rawAiResponseText));
      console.error('Processed JSON string that was attempted to parse (jsonToParse in catch):', JSON.stringify(jsonToParse));

      let errorMessage = 'Unknown error during analysis.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

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
        rawAiResponse: rawAiResponseText || 'No response from AI or error before generation.',
        isMeeting: false,
        error: errorMessage,
        calendarEventId: null,
        calendarEventStatus: 'analysis_failed',
        calendarEventError: errorMessage,
        calendarEventDetails: null,
      };
    }
  }

  /**
   * Get completion with visible chain-of-thought process for more detailed, 
   * step-by-step reasoning in responses
   */
  async getCompletionWithThoughtProcess(
    query: string,
    context: string = '',
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<{
    response: string;
    thoughts: string;
  }> {
    const thoughtPrompt = `
For the following query, I want you to:
1. First, think step by step about how to best answer it (labeled as "THINKING")
2. Then provide your final comprehensive answer (labeled as "RESPONSE")

QUERY:
${query}

${context ? `CONTEXT:\n${context}\n` : ''}

Begin your thinking process with "THINKING:" and your final response with "RESPONSE:"
`;

    const response = await this.getCompletion([{ text: thoughtPrompt }], options);

    // Extract thinking and response sections
    const thinkingMatch = response.match(/THINKING:([\s\S]*?)RESPONSE:/);
    const responseMatch = response.match(/RESPONSE:([\s\S]*)/);

    return {
      thoughts: thinkingMatch ? thinkingMatch[1].trim() : '',
      response: responseMatch ? responseMatch[1].trim() : response
    };
  }

  async generateWorkflowFromPrompt(userPrompt: string): Promise<Workflow> {
    const instruction = `Create a JSON workflow for: "${userPrompt}".\nJSON structure: { id, name, description, trigger, steps: [{ id, agentId, actionType, name, description, input, inputType, outputMapping }], created, status }.\nKey details: 
- 'id' and 'steps.id': new UUIDs.
- 'name': concise workflow name.
- 'description': user's prompt or summary.
- 'trigger': 'manual'.
- 'steps.agentId': 'agent-default-id'.
- 'steps.actionType': general type like 'chat', 'summarize'.
- 'steps.input': user's prompt for the first step.
- 'steps.inputType': 'static' for the first step.
- 'created': Valid ISO8601 date string (current date).
- 'status': 'inactive'.\nRespond with ONLY the JSON object.`;

    const jsonResponse = await this.getCompletion([{ text: instruction }], { temperature: 0.3 });

    let parsedWorkflow: Workflow;
    try {
      // Clean up markdown block if present
      let cleanJson = jsonResponse.trim();
      if (cleanJson.startsWith('\`\`\`json')) cleanJson = cleanJson.replace(/^```json\n/, '').replace(/\n```$/, '');
      else if (cleanJson.startsWith('\`\`\`')) cleanJson = cleanJson.replace(/^```\n/, '').replace(/\n```$/, '');
      parsedWorkflow = JSON.parse(cleanJson);
    } catch (e) {
      console.error('GeminiSimplifiedService: Failed to parse workflow JSON:', e, "Raw response was: ", jsonResponse);
      throw new Error('AI failed to return valid JSON for workflow.');
    }

    const newWorkflow: Workflow = {
      id: parsedWorkflow.id || crypto.randomUUID(),
      name: parsedWorkflow.name || `Workflow: ${userPrompt.substring(0, 25)}...`,
      description: parsedWorkflow.description || userPrompt,
      trigger: parsedWorkflow.trigger || 'manual',
      steps: (parsedWorkflow.steps && parsedWorkflow.steps.length > 0) ? parsedWorkflow.steps.map((step: WorkflowStep) => ({
        id: step.id || crypto.randomUUID(),
        agentId: step.agentId || 'agent-default-id',
        actionType: step.actionType || 'chat',
        name: step.name || 'Generated Step',
        description: step.description || 'Generated Step Description',
        input: step.input || userPrompt,
        inputType: step.inputType || 'static',
        outputMapping: step.outputMapping || `step_${crypto.randomUUID().substring(0, 4)}_output`
      })) : [{
        id: crypto.randomUUID(),
        agentId: 'agent-default-id',
        actionType: 'chat',
        name: 'Initial Task',
        description: 'Default first step based on prompt',
        input: userPrompt,
        inputType: 'static',
        outputMapping: 'initialOutput'
      }],
      created: parsedWorkflow.created ? new Date(parsedWorkflow.created) : new Date(),
      status: parsedWorkflow.status || 'inactive',
    };

    return newWorkflow;
  }

  async enhanceText(userPrompt: string): Promise<string> {
    const instruction = `Review and enhance this text to be clearer, more concise, or more professional: "${userPrompt}". Return only the enhanced text.`;
    const enhancedText = await this.getCompletion([{ text: instruction }], { temperature: 0.7 });

    if (!enhancedText || enhancedText.trim() === '') {
      return userPrompt;
    }
    return enhancedText;
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.generateText('test');
      return !!result;
    } catch (error) {
       console.error('Connection test failed:', error);
       return false;
    }
  }
}

export const geminiSimplifiedService = new GeminiSimplifiedService();

export default { geminiSimplifiedService };