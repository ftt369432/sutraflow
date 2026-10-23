import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../supabase/supabaseClient';
import { Thread } from '../../types/team';

export interface MessageUpdate {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: Thread;
  old?: Thread;
}

export class RealtimeService {
  private static channels: Map<string, RealtimeChannel> = new Map();

  // Subscribe to real-time messages for a page
  static subscribeToPageMessages(
    pageId: string,
    onMessageUpdate: (update: MessageUpdate) => void
  ): () => void {
    const channelName = `page_messages_${pageId}`;
    
    // If already subscribed, unsubscribe first
    if (this.channels.has(channelName)) {
      this.unsubscribeFromChannel(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `page_id=eq.${pageId}`,
        },
        (payload) => {
          console.log('Real-time message update:', payload);
          
          const update: MessageUpdate = {
            type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new ? this.transformMessage(payload.new) : undefined,
            old: payload.old ? this.transformMessage(payload.old) : undefined,
          };

          onMessageUpdate(update);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    // Return unsubscribe function
    return () => this.unsubscribeFromChannel(channelName);
  }

  // Subscribe to real-time team updates
  static subscribeToTeamUpdates(
    teamId: string,
    onTeamUpdate: (update: any) => void
  ): () => void {
    const channelName = `team_updates_${teamId}`;
    
    if (this.channels.has(channelName)) {
      this.unsubscribeFromChannel(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams',
          filter: `id=eq.${teamId}`,
        },
        (payload) => {
          console.log('Real-time team update:', payload);
          onTeamUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pages',
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          console.log('Real-time page update:', payload);
          onTeamUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members',
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          console.log('Real-time team member update:', payload);
          onTeamUpdate(payload);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => this.unsubscribeFromChannel(channelName);
  }

  // Subscribe to all user team changes
  static subscribeToUserTeams(
    userId: string,
    onUserTeamsUpdate: (update: any) => void
  ): () => void {
    const channelName = `user_teams_${userId}`;
    
    if (this.channels.has(channelName)) {
      this.unsubscribeFromChannel(channelName);
    }

    // Subscribe to team_members table where user is a member
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Real-time user teams update:', payload);
          onUserTeamsUpdate(payload);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => this.unsubscribeFromChannel(channelName);
  }

  // Send a real-time notification
  static async sendNotification(channel: string, event: string, payload: any) {
    const realtimeChannel = this.channels.get(channel);
    if (realtimeChannel) {
      await realtimeChannel.send({
        type: 'broadcast',
        event,
        payload,
      });
    }
  }

  // Transform database message to Thread interface
  private static transformMessage(dbMessage: any): Thread {
    return {
      id: dbMessage.id,
      content: dbMessage.content,
      user_id: dbMessage.user_id,
      page_id: dbMessage.page_id,
      created_at: dbMessage.created_at,
      updated_at: dbMessage.updated_at,
      parent_message_id: dbMessage.parent_message_id,
      user_profile: dbMessage.user_profile || {
        id: dbMessage.user_id,
        full_name: 'Unknown User',
        avatar_url: undefined,
        display_name: 'Unknown'
      }
    };
  }

  // Unsubscribe from a specific channel
  private static unsubscribeFromChannel(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  // Clean up all subscriptions
  static cleanup() {
    this.channels.forEach((channel, channelName) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }

  // Get active subscriptions
  static getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }
}