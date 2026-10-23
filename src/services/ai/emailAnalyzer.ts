import type { EmailMessage } from '../../types';
import { openai } from '../../config/openai';

export interface EmailAnalysis {
  category: 'task' | 'follow-up' | 'important' | 'other';
  suggestedResponse?: string;
  extractedTasks?: {
    title: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: Date;
  }[];
}

export async function analyzeEmail(email: EmailMessage): Promise<EmailAnalysis> {
  try {
    const prompt = `Analyze the following email and provide a structured response:

Subject: ${email.subject}
From: ${email.from}
Content: ${email.body}

Please categorize this email, suggest a response if needed, and extract any tasks.
Respond in the following JSON format:
{
  "category": "task|follow-up|important|other",
  "suggestedResponse": "response text if needed",
  "extractedTasks": [
    {
      "title": "task title",
      "priority": "low|medium|high",
      "dueDate": "ISO date string or null"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');

    // Transform the response into our EmailAnalysis format
    const analysis: EmailAnalysis = {
      category: response.category || 'other',
      suggestedResponse: response.suggestedResponse,
      extractedTasks: response.extractedTasks?.map((task: { title: string; priority: 'low' | 'medium' | 'high'; dueDate?: string | Date }) => ({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined
      }))
    };

    return analysis;
  } catch (error) {
    console.error('Error analyzing email:', error);
    // Fallback to basic analysis if AI fails
    return {
      category: 'other',
      extractedTasks: []
    };
  }
}