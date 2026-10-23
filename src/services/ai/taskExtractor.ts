import { supabase } from '../../lib/supabaseClient';

export interface ExtractedTask {
  title: string;
  description?: string;
  assignedTo?: string;
}

/**
 * Scan chat message for task-like patterns (e.g. "I will do X", "Can you handle Y?").
 */
export function extractTasksFromText(text: string): ExtractedTask[] {
  const tasks: ExtractedTask[] = [];

  // Common patterns indicating an action item:
  // 1. "I will [action]" or "I'll [action]"
  // 2. "Can you [action]" or "Please [action]"
  // 3. "TODO: [action]" or "Need to [action]"
  const patterns = [
    {
      regex: /(?:i\s*will|i'll)\s+([^.,?!;]+)/gi,
      defaultAssignee: 'self'
    },
    {
      regex: /(?:can\s+you|please|could\s+you|need\s+you\s+to)\s+([^.,?!;]+)/gi,
      defaultAssignee: 'other'
    },
    {
      regex: /(?:todo:|need\s+to)\s+([^.,?!;]+)/gi,
      defaultAssignee: undefined
    }
  ];

  for (const pattern of patterns) {
    let match;
    // Reset regex lastIndex
    pattern.regex.lastIndex = 0;
    while ((match = pattern.regex.exec(text)) !== null) {
      const action = match[1]?.trim();
      if (action && action.length > 5 && action.split(/\s+/).length >= 2) {
        // Format action title to start with capital letter
        const cleanAction = action.charAt(0).toUpperCase() + action.slice(1);
        
        // Skip common conversation filler matches to keep tasks meaningful
        const skipWords = ['just', 'go', 'be', 'do', 'think', 'see', 'want', 'tell', 'know', 'say', 'try'];
        const firstWord = cleanAction.split(/\s+/)[0]?.toLowerCase();
        if (skipWords.includes(firstWord) && cleanAction.split(/\s+/).length <= 2) {
          continue;
        }

        // Avoid adding duplicate tasks from the same extraction pass
        if (!tasks.some(t => t.title.toLowerCase() === cleanAction.toLowerCase())) {
          tasks.push({
            title: cleanAction,
            description: `Auto-extracted from chat: "${text.trim()}"`,
            assignedTo: pattern.defaultAssignee
          });
        }
      }
    }
  }

  return tasks;
}

/**
 * Silently saves extracted tasks to the database under the user's account.
 */
export async function silentlyCreateTask(task: ExtractedTask, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('master_tasks')
      .insert({
        title: task.title,
        description: task.description || '',
        user_id: userId,
        status: 'queued',
        source: 'user_created',
        priority: 2,
        context: {
          extracted_at: new Date().toISOString(),
          assigned_to_suggestion: task.assignedTo
        }
      });

    if (error) {
      console.error('TaskExtractor: Failed to save extracted task:', error);
      return false;
    }

    console.log('TaskExtractor: Silently saved task:', task.title);
    return true;
  } catch (err) {
    console.error('TaskExtractor: Unexpected error saving task:', err);
    return false;
  }
}
