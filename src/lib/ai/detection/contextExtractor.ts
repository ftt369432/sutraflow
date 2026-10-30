/**
 * ContextExtractor - Extracts full context for AI processing
 * Part of Layer 1: Detection
 */

import type { Team, Page, Thread, TeamMember } from '../../../types/team';

export interface MessageContext {
  channelId: string;
  channelName: string;
  channelType: 'public' | 'private' | 'dm';
  recentMessages: Thread[];
  participants: TeamMember[];
  currentTeam?: Team;
  currentPage?: Page;
  pinnedDriveFiles?: any[];
}

export class ContextExtractor {
  /**
   * Extract full context for AI processing
   */
  static async extract(
    team: Team | null,
    page: Page | null,
    recentMessages: Thread[],
    pinnedDriveFiles: any[] = []
  ): Promise<MessageContext> {
    console.log('📦 [ContextExtractor] Extracting context for channel:', page?.name);
    
    if (!page || !team) {
      console.warn('⚠️ [ContextExtractor] No page or team provided');
      return {
        channelId: '',
        channelName: 'Unknown',
        channelType: 'public',
        recentMessages: [],
        participants: [],
        pinnedDriveFiles: []
      };
    }
    
    // Get channel type
    const channelType = page.isPrivate ? 'private' : 'public';
    
    // Get recent messages (last 50)
    const recentMessageSlice = recentMessages.slice(-50);
    
    // Extract unique participants from messages
    const participantIds = new Set(recentMessageSlice.map(msg => msg.user_id));
    const participants = team.members.filter(member => 
      participantIds.has(member.id)
    );
    
    console.log('✅ [ContextExtractor] Context extracted:', {
      channelName: page.name,
      channelType,
      messageCount: recentMessageSlice.length,
      participantCount: participants.length,
      pinnedFilesCount: pinnedDriveFiles.length
    });
    
    return {
      channelId: page.id,
      channelName: page.name,
      channelType,
      recentMessages: recentMessageSlice,
      participants,
      currentTeam: team,
      currentPage: page,
      pinnedDriveFiles
    };
  }
  
  /**
   * Get conversation summary for AI context
   */
  static getConversationSummary(messages: Thread[], maxMessages: number = 20): string {
    const recentMessages = messages.slice(-maxMessages);
    
    return recentMessages
      .map(msg => {
        const userName = msg.user_profile?.full_name || msg.user_profile?.display_name || 'User';
        return `${userName}: ${msg.content}`;
      })
      .join('\n');
  }
  
  /**
   * Extract mentioned users from message
   */
  static extractMentions(message: string): string[] {
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(message)) !== null) {
      const username = match[1];
      if (username.toLowerCase() !== 'ai' && username.toLowerCase() !== 'assistant') {
        mentions.push(username);
      }
    }
    
    return mentions;
  }
}
