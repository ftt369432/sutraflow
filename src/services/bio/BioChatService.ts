import { supabase } from '../supabase/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export interface BioChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  model?: string;
}

export class BioChatService {
  private static BIO_PAGE_KEY = 'genie-bio-chat-page-id';

  /**
   * 🔍 GET OR CREATE BIO PAGE: Ensures the user has a dedicated hidden page for Bio Chat history.
   */
  private static async getOrCreateBioPage(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // 1. Check if we already have it in session storage to avoid DB calls
    const cachedId = sessionStorage.getItem(this.BIO_PAGE_KEY);
    if (cachedId) return cachedId;

    // 2. Check DB for a page named 'GenieBio Context' created by this user
    const { data: existingPage, error } = await supabase
      .from('pages')
      .select('id')
      .eq('name', 'GenieBio Context')
      .eq('created_by', user.id)
      .limit(1)
      .single();

    if (!error && existingPage) {
      sessionStorage.setItem(this.BIO_PAGE_KEY, existingPage.id);
      return existingPage.id;
    }

    // 3. Find a default team to attach the page to (or create a private one)
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (!teamMember) {
        // Fallback: This user has no teams? Very unlikely in current architecture but handled.
        throw new Error('No team found to attach Bio Chat history.');
    }

    // 4. Create the hidden context page
    const { data: newPage, error: createError } = await supabase
      .from('pages')
      .insert({
        team_id: teamMember.team_id,
        name: 'GenieBio Context',
        description: 'Autonomous persistent memory for Bio-Genetics research.',
        is_private: true,
        created_by: user.id
      })
      .select()
      .single();

    if (createError) throw createError;

    sessionStorage.setItem(this.BIO_PAGE_KEY, newPage.id);
    return newPage.id;
  }

  /**
   * 📥 FETCH HISTORY: Retrieves all previous Bio Chat messages for this user.
   */
  static async getHistory(): Promise<BioChatMessage[]> {
    try {
      const pageId = await this.getOrCreateBioPage();
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('page_id', pageId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(msg => ({
        id: msg.id,
        role: msg.is_ai ? 'assistant' : 'user',
        content: msg.content,
        timestamp: msg.created_at,
        model: msg.metadata?.model
      }));
    } catch (err) {
      console.error('[BioChatService] Failed to load history:', err);
      return [];
    }
  }

  /**
   * 📤 SAVE MESSAGE: Persists a single message to the database.
   */
  static async saveMessage(message: Omit<BioChatMessage, 'id' | 'timestamp'>): Promise<void> {
    try {
      const pageId = await this.getOrCreateBioPage();
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('messages')
        .insert({
          page_id: pageId,
          user_id: user?.id,
          content: message.content,
          is_ai: message.role === 'assistant',
          metadata: { model: message.model }
        });

      if (error) throw error;
    } catch (err) {
      console.error('[BioChatService] Failed to save message:', err);
    }
  }

  /**
   * 🗑️ CLEAR HISTORY: Removes all messages from the Bio Chat.
   */
  static async clearHistory(): Promise<void> {
    try {
      const pageId = await this.getOrCreateBioPage();
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('page_id', pageId);

      if (error) throw error;
    } catch (err) {
      console.error('[BioChatService] Failed to clear history:', err);
    }
  }
}
