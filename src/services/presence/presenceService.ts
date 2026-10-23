import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../supabase/supabaseClient';

export interface PresenceUser {
  user_id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
  last_seen: string;
  team_id?: string;
  page_id?: string;
}

export interface TypingIndicator {
  user_id: string;
  name: string;
  page_id: string;
  timestamp: string;
}

export class PresenceService {
  private static channels: Map<string, RealtimeChannel> = new Map();
  private static presenceData: Map<string, PresenceUser[]> = new Map();
  private static typingData: Map<string, TypingIndicator[]> = new Map();

  // Subscribe to presence updates for a team
  static subscribeToTeamPresence(
    teamId: string, 
    user: { id: string; name: string; email: string; avatar?: string },
    onPresenceUpdate: (users: PresenceUser[]) => void
  ): () => void {
    const channelName = `team_presence_${teamId}`;
    
    // If already subscribed, unsubscribe first
    if (this.channels.has(channelName)) {
      this.unsubscribeFromPresence(channelName);
    }

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const presenceUsers: PresenceUser[] = Object.values(state)
          .flat()
          .filter((presence: any) => presence && typeof presence === 'object' && presence.user_id)
          .map((presence: any) => presence as PresenceUser);
        
        this.presenceData.set(teamId, presenceUsers);
        onPresenceUpdate(presenceUsers);
        
        console.log('Presence sync:', presenceUsers);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
        const currentPresence = this.presenceData.get(teamId) || [];
        const validNewPresences = (newPresences as any[])
          .filter(presence => presence && typeof presence === 'object' && presence.user_id)
          .map(presence => presence as PresenceUser);
        const updatedPresence = [...currentPresence, ...validNewPresences];
        this.presenceData.set(teamId, updatedPresence);
        onPresenceUpdate(updatedPresence);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
        const currentPresence = this.presenceData.get(teamId) || [];
        const leftUserIds = (leftPresences as any[])
          .filter(presence => presence && typeof presence === 'object' && presence.user_id)
          .map(presence => presence.user_id);
        const updatedPresence = currentPresence.filter(p => !leftUserIds.includes(p.user_id));
        this.presenceData.set(teamId, updatedPresence);
        onPresenceUpdate(updatedPresence);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track presence for this user
          const userPresence: PresenceUser = {
            user_id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            status: 'online',
            last_seen: new Date().toISOString(),
            team_id: teamId
          };

          await channel.track(userPresence);
        }
      });

    this.channels.set(channelName, channel);

    // Return unsubscribe function
    return () => this.unsubscribeFromPresence(channelName);
  }

  // Subscribe to typing indicators for a page
  static subscribeToPageTyping(
    pageId: string,
    user: { id: string; name: string },
    onTypingUpdate: (typingUsers: TypingIndicator[]) => void
  ): () => void {
    const channelName = `page_typing_${pageId}`;
    
    if (this.channels.has(channelName)) {
      this.unsubscribeFromPresence(channelName);
    }

    const channel = supabase.channel(channelName);

    channel
      .on('broadcast', { event: 'typing_start' }, ({ payload }) => {
        const currentTyping = this.typingData.get(pageId) || [];
        const existingIndex = currentTyping.findIndex(t => t.user_id === payload.user_id);
        
        if (existingIndex >= 0) {
          currentTyping[existingIndex] = payload as TypingIndicator;
        } else {
          currentTyping.push(payload as TypingIndicator);
        }
        
        this.typingData.set(pageId, currentTyping);
        onTypingUpdate(currentTyping.filter(t => t.user_id !== user.id));
      })
      .on('broadcast', { event: 'typing_stop' }, ({ payload }) => {
        const currentTyping = this.typingData.get(pageId) || [];
        const updatedTyping = currentTyping.filter(t => t.user_id !== payload.user_id);
        this.typingData.set(pageId, updatedTyping);
        onTypingUpdate(updatedTyping.filter(t => t.user_id !== user.id));
      })
      .subscribe();

    this.channels.set(channelName, channel);

    return () => this.unsubscribeFromPresence(channelName);
  }

  // Send typing indicator
  static async sendTyping(pageId: string, user: { id: string; name: string }, isTyping: boolean) {
    const channelName = `page_typing_${pageId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      const event = isTyping ? 'typing_start' : 'typing_stop';
      const payload: TypingIndicator = {
        user_id: user.id,
        name: user.name,
        page_id: pageId,
        timestamp: new Date().toISOString()
      };

      await channel.send({
        type: 'broadcast',
        event,
        payload
      });
    }
  }

  // Update user status
  static async updateUserStatus(teamId: string, status: 'online' | 'away' | 'offline') {
    const channelName = `team_presence_${teamId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      // Get current presence data from our local store
      const currentPresence = this.presenceData.get(teamId);
      const userPresence = currentPresence?.[0]; // Assuming current user is first
      
      if (userPresence) {
        const updatedPresence: PresenceUser = {
          ...userPresence,
          status,
          last_seen: new Date().toISOString()
        };
        
        await channel.track(updatedPresence);
      }
    }
  }

  // Get current presence for a team
  static getTeamPresence(teamId: string): PresenceUser[] {
    return this.presenceData.get(teamId) || [];
  }

  // Get current typing indicators for a page
  static getPageTyping(pageId: string): TypingIndicator[] {
    return this.typingData.get(pageId) || [];
  }

  // Unsubscribe from a specific channel
  private static unsubscribeFromPresence(channelName: string) {
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
    this.presenceData.clear();
    this.typingData.clear();
  }
}