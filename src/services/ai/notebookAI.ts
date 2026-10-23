import { Notebook, NotebookAIResponse, NotebookBlock } from '../../types/notebook';
import { AIMessage } from '../../types/legal';
import { generateLegalResponse } from './legalAssistant';

export async function generateNotebookResponse(
  notebook: Notebook,
  userMessage: string,
  context?: {
    currentSection?: string;
    currentBlock?: string;
  }
): Promise<NotebookAIResponse> {
  // Prepare the context for the AI
  const messages: AIMessage[] = [
    {
      id: 'system-1',
      role: 'system',
      content: `You are an AI assistant helping with a notebook titled "${notebook.title}". 
      The notebook contains ${notebook.sections.length} sections and is about: ${notebook.description}.
      You can help with:
      1. Writing and editing content
      2. Suggesting tasks and calendar events
      3. Finding related content
      4. Summarizing and analyzing content
      5. Answering questions about the notebook
      
      Current context: ${context?.currentSection ? `Section: ${context.currentSection}` : ''}
      ${context?.currentBlock ? `Block: ${context.currentBlock}` : ''}`,
      timestamp: new Date(),
      metadata: { domain: 'legal' }
    },
    {
      id: 'user-1',
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
      metadata: { domain: 'legal' }
    }
  ];

  // Get AI response
  const response = await generateLegalResponse(messages);

  // Parse the response to extract structured data
  const aiResponse: NotebookAIResponse = {
    content: response,
    metadata: {
      suggestedTasks: extractTasks(response),
      suggestedCalendarEvents: extractCalendarEvents(response),
      relatedContent: extractRelatedContent(response)
    }
  };

  return aiResponse;
}

export async function analyzeNotebook(notebook: Notebook): Promise<Notebook> {
  // Build content from all sections and blocks for analysis
  const notebookContent = notebook.sections
    .map(section => {
      const sectionContent = section.blocks
        .map(block => block.content)
        .join('\n\n');
      return `## ${section.title}\n${sectionContent}`;
    })
    .join('\n\n');

  // Prepare the context for analysis
  const messages: AIMessage[] = [
    {
      id: 'system-1',
      role: 'system',
      content: `Analyze this notebook and provide:
      1. A concise summary (3-5 sentences)
      2. 5-10 key topics and themes as short phrases
      3. Suggested actions (tasks, calendar events, or AI assistance needed)
      
      Format your response in JSON with the following structure:
      {
        "summary": "concise summary here",
        "keyTopics": ["topic1", "topic2", "topic3", ...],
        "suggestedActions": [
          {
            "type": "task|calendar|ai",
            "description": "action description",
            "priority": "low|medium|high"
          },
          ...
        ]
      }
      
      Notebook title: ${notebook.title}
      Description: ${notebook.description}
      Content:
      ${notebookContent}`,
      timestamp: new Date(),
      metadata: { domain: 'legal' }
    }
  ];

  // Get AI analysis
  const response = await generateLegalResponse(messages);

  // Parse the JSON response
  try {
    const jsonStart = response.indexOf('{');
    const jsonEnd = response.lastIndexOf('}') + 1;
    const jsonString = response.substring(jsonStart, jsonEnd);
    const analysisData = JSON.parse(jsonString);

    // Update notebook with AI analysis
    return {
      ...notebook,
      aiContext: {
        summary: analysisData.summary || extractSummary(response),
        keyTopics: analysisData.keyTopics || extractTopics(response),
        relatedNotebooks: [], // We'll implement notebook-to-notebook relations in a separate step
        suggestedActions: analysisData.suggestedActions || extractSuggestedActions(response)
      }
    };
  } catch (error) {
    console.error("Failed to parse AI analysis as JSON, falling back to text extraction", error);
    
    // Fall back to text extraction methods
    return {
      ...notebook,
      aiContext: {
        summary: extractSummary(response),
        keyTopics: extractTopics(response),
        relatedNotebooks: [],
        suggestedActions: extractSuggestedActions(response)
      }
    };
  }
}

// Helper functions to extract structured data from AI responses
function extractTasks(content: string) {
  const taskRegex = /task:?\s*([^,.\n]+)/gi;
  const todoRegex = /todo:?\s*([^,.\n]+)/gi;
  const actionRegex = /action\s*item:?\s*([^,.\n]+)/gi;
  
  const tasks: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
  }[] = [];
  
  // Collect tasks from different formats
  let match;
  while ((match = taskRegex.exec(content)) !== null) {
    if (match[1].trim()) {
      tasks.push({
        title: match[1].trim(),
        description: '',
        priority: 'medium'
      });
    }
  }
  
  while ((match = todoRegex.exec(content)) !== null) {
    if (match[1].trim()) {
      tasks.push({
        title: match[1].trim(),
        description: '',
        priority: 'medium'
      });
    }
  }
  
  while ((match = actionRegex.exec(content)) !== null) {
    if (match[1].trim()) {
      tasks.push({
        title: match[1].trim(),
        description: '',
        priority: 'medium'
      });
    }
  }
  
  return tasks;
}

function extractCalendarEvents(content: string) {
  const eventRegex = /event:?\s*([^,.\n]+)(?:.*?date:?\s*([^,.\n]+))?/gi;
  const meetingRegex = /meeting:?\s*([^,.\n]+)(?:.*?on:?\s*([^,.\n]+))?/gi;
  
  const events = [];
  
  // Extract events with dates
  let match;
  while ((match = eventRegex.exec(content)) !== null) {
    if (match[1].trim()) {
      const eventDate = match[2] ? new Date(match[2]) : new Date();
      events.push({
        title: match[1].trim(),
        description: '',
        startDate: eventDate,
        endDate: new Date(eventDate.getTime() + 60 * 60 * 1000) // 1 hour later
      });
    }
  }
  
  while ((match = meetingRegex.exec(content)) !== null) {
    if (match[1].trim()) {
      const eventDate = match[2] ? new Date(match[2]) : new Date();
      events.push({
        title: match[1].trim(),
        description: '',
        startDate: eventDate,
        endDate: new Date(eventDate.getTime() + 60 * 60 * 1000) // 1 hour later
      });
    }
  }
  
  return events;
}

function extractRelatedContent(content: string) {
  const relatedRegex = /related(?:\s*to)?:?\s*([^,.\n]+)/gi;
  const seeAlsoRegex = /see\s*also:?\s*([^,.\n]+)/gi;
  
  const relatedItems: {
    type: 'notebook' | 'task' | 'calendar';
    id: string;
    title: string;
    relevance: number;
  }[] = [];
  
  // Extract related content mentions
  let match;
  while ((match = relatedRegex.exec(content)) !== null) {
    if (match[1].trim()) {
      relatedItems.push({
        type: 'notebook',
        id: crypto.randomUUID(), // This would ideally be a real ID
        title: match[1].trim(),
        relevance: 0.8
      });
    }
  }
  
  while ((match = seeAlsoRegex.exec(content)) !== null) {
    if (match[1].trim()) {
      relatedItems.push({
        type: 'notebook',
        id: crypto.randomUUID(), // This would ideally be a real ID
        title: match[1].trim(),
        relevance: 0.7
      });
    }
  }
  
  return relatedItems;
}

function extractSummary(content: string) {
  // Look for summary heading and extract text until next heading
  const summaryHeadingRegex = /summary:?(?:\s*\n+)?([\s\S]*?)(?:\n+\s*##|\n+\s*\d\.|\n+\s*key|$)/i;
  const match = content.match(summaryHeadingRegex);
  
  if (match && match[1].trim()) {
    return match[1].trim();
  }
  
  // If no explicit summary heading, take the first paragraph that's long enough
  const paragraphs = content.split(/\n\s*\n/);
  for (const para of paragraphs) {
    if (para.length > 50 && !para.startsWith('#') && !para.startsWith('-')) {
      return para.trim();
    }
  }
  
  return '';
}

function extractTopics(content: string) {
  // Look for key topics or themes in different formats
  const topicsHeadingRegex = /(?:key\s*topics|themes|key\s*points):?(?:\s*\n+)?(.+(?:\n+.+)*)/i;
  const match = content.match(topicsHeadingRegex);
  
  if (match && match[1]) {
    // Extract bullet points or numbered items
    const bulletRegex = /[-*•]\s*([^,.\n]+)/g;
    const numberedRegex = /\d+\.\s*([^,.\n]+)/g;
    
    const topics = [];
    let bulletMatch;
    
    while ((bulletMatch = bulletRegex.exec(match[1])) !== null) {
      if (bulletMatch[1].trim()) {
        topics.push(bulletMatch[1].trim());
      }
    }
    
    while ((bulletMatch = numberedRegex.exec(match[1])) !== null) {
      if (bulletMatch[1].trim()) {
        topics.push(bulletMatch[1].trim());
      }
    }
    
    if (topics.length > 0) {
      return topics;
    }
    
    // If no bullets found, split by commas or newlines
    return match[1]
      .split(/[,\n]/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }
  
  return [];
}

function extractRelatedNotebooks(content: string) {
  // This would need a database of notebooks to extract real IDs
  // For now, we'll return an empty array
  return [];
}

function extractSuggestedActions(content: string) {
  // Look for suggested actions or recommendations section
  const actionsHeadingRegex = /(?:suggested\s*actions|recommendations|next\s*steps):?(?:\s*\n+)?(.+(?:\n+.+)*)/i;
  const match = content.match(actionsHeadingRegex);
  
  if (match && match[1]) {
    // Extract bullet points or numbered items
    const bulletRegex = /[-*•]\s*([^\n]+)/g;
    const numberedRegex = /\d+\.\s*([^\n]+)/g;
    
    const actions: {
      type: 'task' | 'calendar' | 'ai';
      description: string;
      priority: 'low' | 'medium' | 'high';
    }[] = [];
    
    let actionMatch;
    
    while ((actionMatch = bulletRegex.exec(match[1])) !== null) {
      if (actionMatch[1].trim()) {
        const actionText = actionMatch[1].trim();
        
        // Determine action type based on content
        let type: 'task' | 'calendar' | 'ai' = 'task';
        if (actionText.toLowerCase().includes('meet') || 
            actionText.toLowerCase().includes('schedule') || 
            actionText.toLowerCase().includes('event')) {
          type = 'calendar';
        } else if (actionText.toLowerCase().includes('ai') || 
                   actionText.toLowerCase().includes('generate') || 
                   actionText.toLowerCase().includes('analyze')) {
          type = 'ai';
        }
        
        // Determine priority based on content
        let priority: 'low' | 'medium' | 'high' = 'medium';
        if (actionText.toLowerCase().includes('urgent') || 
            actionText.toLowerCase().includes('critical') || 
            actionText.toLowerCase().includes('important')) {
          priority = 'high';
        } else if (actionText.toLowerCase().includes('consider') || 
                   actionText.toLowerCase().includes('maybe') || 
                   actionText.toLowerCase().includes('optional')) {
          priority = 'low';
        }
        
        actions.push({
          type,
          description: actionText,
          priority
        });
      }
    }
    
    while ((actionMatch = numberedRegex.exec(match[1])) !== null) {
      if (actionMatch[1].trim()) {
        const actionText = actionMatch[1].trim();
        
        // Determine action type and priority as above
        let type: 'task' | 'calendar' | 'ai' = 'task';
        if (actionText.toLowerCase().includes('meet') || 
            actionText.toLowerCase().includes('schedule') || 
            actionText.toLowerCase().includes('event')) {
          type = 'calendar';
        } else if (actionText.toLowerCase().includes('ai') || 
                   actionText.toLowerCase().includes('generate') || 
                   actionText.toLowerCase().includes('analyze')) {
          type = 'ai';
        }
        
        let priority: 'low' | 'medium' | 'high' = 'medium';
        if (actionText.toLowerCase().includes('urgent') || 
            actionText.toLowerCase().includes('critical') || 
            actionText.toLowerCase().includes('important')) {
          priority = 'high';
        } else if (actionText.toLowerCase().includes('consider') || 
                   actionText.toLowerCase().includes('maybe') || 
                   actionText.toLowerCase().includes('optional')) {
          priority = 'low';
        }
        
        actions.push({
          type,
          description: actionText,
          priority
        });
      }
    }
    
    return actions;
  }
  
  return [];
} 