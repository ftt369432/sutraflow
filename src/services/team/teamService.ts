import { supabase } from '../supabase/supabaseClient';
import type { Team, TeamMember, Page, Thread, DirectMessage } from '../../types/team';

export class TeamService {
  /**
   * Get teams for a user with their channels/pages loaded
   * FIXED: Now properly loads pages from database
   */
  static async getTeams(userId: string): Promise<Team[]> {
    if (!userId) {
      console.warn('getTeams called without a userId.');
      return [];
    }

    try {
      console.log('TeamService: Fetching teams for user (using REAL DATABASE):', userId);
      
      // FIXED: Added pages to the query to load channels
      const { data: teamMembershipData, error: teamMembershipError } = await supabase
        .from('team_members')
        .select(`
          role,
          teams (
            id,
            name,
            description,
            created_at,
            updated_at,
            owner_id,
            settings,
            pages (
              id,
              name,
              description,
              is_private,
              created_at,
              updated_at,
              created_by
            )
          )
        `)
        .eq('user_id', userId);

      if (teamMembershipError) {
        console.error('Error fetching team memberships:', teamMembershipError);
        if (teamMembershipError.code === '42703') {
          console.log('No teams found, creating default team...');
          const defaultTeam = await this.createDefaultTeam(userId);
          return defaultTeam ? [defaultTeam] : [];
        }
        return [];
      }

      if (!teamMembershipData || teamMembershipData.length === 0) {
        console.log('No team memberships found, creating default team...');
        const defaultTeam = await this.createDefaultTeam(userId);
        return defaultTeam ? [defaultTeam] : [];
      }

      // Deduplicate teams and their pages to handle potential database join logic
      const teamMap = new Map<string, Team>();
      
      teamMembershipData.forEach(membership => {
        const teamData = membership.teams as any;
        if (!teamData || !teamData.id) return;
        
        if (!teamMap.has(teamData.id)) {
          // Initialize team with unique pages
          const pageMap = new Map<string, any>();
          (teamData.pages || []).forEach((p: any) => {
            if (p && p.id && !pageMap.has(p.id)) {
              pageMap.set(p.id, p);
            }
          });

          teamMap.set(teamData.id, {
            id: teamData.id,
            name: teamData.name,
            description: teamData.description || '',
            avatar: undefined,
            created_at: teamData.created_at,
            updated_at: teamData.updated_at,
            members: [], // Members loaded separately elsewhere
            pages: Array.from(pageMap.values()).map((p: any) => ({
              id: p.id,
              name: p.name,
              description: p.description || '',
              isPrivate: p.is_private || false,
              unread: 0,
              isStarred: false,
              hasAI: false,
              threads: [],
              created_at: p.created_at,
              updated_at: p.updated_at
            })),
            threads: [],
            direct_messages: []
          });
        }
      });

      const teams = Array.from(teamMap.values());
      console.log(`TeamService: Successfully parsed ${teams.length} unique teams`);
      
      teams.forEach(team => {
        console.log(`Team "${team.name}" has ${team.pages.length} pages:`, team.pages.map(p => p.name));
      });
      
      return teams;
      
    } catch (error) {
      console.error('TeamService.getTeams error:', error);
      
      try {
        console.log('Error occurred, attempting to create default team...');
        const defaultTeam = await this.createDefaultTeam(userId);
        return defaultTeam ? [defaultTeam] : [];
      } catch (createError) {
        console.error('Failed to create default team:', createError);
        return [];
      }
    }
  }

  /**
   * Create a new team
   */
  static async createTeam(teamData: { name: string; description?: string }, userId?: string): Promise<Team> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    const currentUserId = userId || user?.id;
    if (!currentUserId) {
      throw new Error('User is not authenticated.');
    }

    const teamToInsert = {
      name: teamData.name,
      description: teamData.description || '',
      owner_id: currentUserId,
      settings: {}
    };

    const { data: newTeamData, error: insertTeamError } = await supabase
      .from('teams')
      .insert(teamToInsert)
      .select()
      .single();

    if (insertTeamError) {
      console.error('Error creating team:', insertTeamError);
      throw insertTeamError;
    }

    if (!newTeamData) {
      throw new Error('Failed to create team, no data returned.');
    }

    const { error: insertMemberError } = await supabase
      .from('team_members')
      .insert({
        team_id: newTeamData.id,
        user_id: currentUserId,
        role: 'admin'
      });

    if (insertMemberError) {
      console.error('Error adding creator as team member:', insertMemberError);
      throw insertMemberError;
    }

    const teamId = (newTeamData && !Array.isArray(newTeamData) ? newTeamData.id : null) || `team-${Date.now()}`;
    const teamName = (newTeamData && !Array.isArray(newTeamData) ? newTeamData.name : null) || teamData.name || 'Your Workspace';
    const teamDesc = (newTeamData && !Array.isArray(newTeamData) ? newTeamData.description : null) || teamData.description || '';

    return {
      id: teamId,
      name: teamName,
      description: teamDesc,
      avatar: undefined,
      created_at: newTeamData?.created_at || new Date().toISOString(),
      updated_at: newTeamData?.updated_at || new Date().toISOString(),
      members: [],
      pages: [],
      threads: [],
      direct_messages: []
    };
  }

  /**
   * Create a new page/channel
   */
  static async createPage(teamId: string, pageData: { name: string; description?: string; isPrivate?: boolean }): Promise<Page> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      throw new Error('User is not authenticated.');
    }

    const pageToInsert = {
      team_id: teamId,
      name: pageData.name,
      description: pageData.description || null,
      is_private: pageData.isPrivate || false,
      created_by: user.id,
    };

    const { data: newPageData, error: insertPageError } = await supabase
      .from('pages')
      .insert(pageToInsert)
      .select()
      .single();

    if (insertPageError) {
      console.error('Error creating page:', insertPageError);
      throw insertPageError;
    }

    if (!newPageData) {
      throw new Error('Failed to create page, no data returned.');
    }

    if (newPageData.is_private) {
      const { error: insertMemberError } = await supabase
        .from('page_members')
        .insert({
          page_id: newPageData.id,
          user_id: user.id,
          role: 'admin_of_page',
        });

      if (insertMemberError) {
        console.error('Error adding creator to private page members:', insertMemberError);
      }
    }
    
    const pageId = (newPageData && !Array.isArray(newPageData) ? newPageData.id : null) || `page-${Date.now()}`;
    const pageName = (newPageData && !Array.isArray(newPageData) ? newPageData.name : null) || pageData.name || 'general';
    const pageDesc = (newPageData && !Array.isArray(newPageData) ? newPageData.description : null) || pageData.description || '';

    return {
      id: pageId,
      name: pageName,
      description: pageDesc,
      isPrivate: newPageData?.is_private ?? pageData.isPrivate ?? false,
      unread: 0,
      isStarred: false,
      hasAI: false,
      created_at: newPageData?.created_at || new Date().toISOString(),
      updated_at: newPageData?.updated_at || new Date().toISOString()
    };
  }

  /**
   * Get messages for a page
   */
  static async getMessages(pageId: string): Promise<Thread[]> {
    try {
      console.log('TeamService: Fetching messages for page:', pageId);
      
      // First, try to query from messages_with_profiles view to get member profiles
      let messagesData: any[] | null = null;
      let { data: rawMessages, error: messagesError } = await supabase
        .from('messages_with_profiles')
        .select(`
          id,
          content,
          created_at,
          updated_at,
          user_id,
          page_id,
          parent_message_id,
          is_edited,
          is_ai,
          full_name,
          avatar_url,
          shield_name,
          visibility_level
        `)
        .eq('page_id', pageId)
        .order('created_at', { ascending: true })
        .limit(100); // Limit to prevent huge responses
      messagesData = rawMessages;

      if (messagesError) {
        console.warn('Error fetching messages from view, trying fallback table:', messagesError);
        
        // Fallback to basic messages table query
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            created_at,
            updated_at,
            user_id,
            page_id,
            parent_message_id,
            is_edited,
            is_ai
          `)
          .eq('page_id', pageId)
          .order('created_at', { ascending: true })
          .limit(100);

        if (fallbackError) {
          console.error('Fallback query failed:', fallbackError);
          
          // Return mock messages for development/testing
          console.log('Returning mock messages for development...');
          return [
            {
              id: `mock-${pageId}-1`,
              content: '👋 Welcome to this channel! Start chatting to see real messages.',
              created_at: new Date(Date.now() - 60000).toISOString(),
              updated_at: new Date(Date.now() - 60000).toISOString(),
              user_id: 'system',
              page_id: pageId,
              user_profile: {
                id: 'system',
                full_name: 'GenieFlow Bot',
                avatar_url: null,
                display_name: 'GenieFlow Bot'
              }
            },
            {
              id: `mock-${pageId}-2`,
              content: '🔧 This is a development environment. Messages will appear here when you send them.',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              user_id: 'system',
              page_id: pageId,
              user_profile: {
                id: 'system',
                full_name: 'GenieFlow Bot',
                avatar_url: null,
                display_name: 'GenieFlow Bot'
              }
            }
          ];
        }
        messagesData = fallbackData;
      }

      if (!messagesData) {
        console.log('No messages found for page:', pageId);
        return [];
      }

      // Transform the data to Thread format
      return messagesData.map((message: any) => {
        const useShield = message.visibility_level === 'shield' && message.shield_name;
        const displayName = useShield ? message.shield_name : (message.full_name || 'Team Member');
        return {
          id: message.id,
          content: message.content,
          created_at: message.created_at,
          updated_at: message.updated_at,
          user_id: message.user_id,
          page_id: message.page_id,
          parent_message_id: message.parent_message_id,
          user_profile: {
            id: message.user_id,
            full_name: displayName,
            avatar_url: useShield ? undefined : (message.avatar_url || undefined),
            display_name: displayName,
            shield_name: message.shield_name || undefined,
            visibility_level: message.visibility_level || undefined
          }
        };
      });

    } catch (error) {
      console.error('TeamService.getMessages unexpected error:', error);
      
      // Always return something to prevent UI crashes
      return [
        {
          id: `error-${pageId}`,
          content: '⚠️ Unable to load messages. Please refresh or check your connection.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: 'system',
          page_id: pageId,
          user_profile: {
            id: 'system',
            full_name: 'System',
            avatar_url: null,
            display_name: 'System'
          }
        }
      ];
    }
  }

  /**
   * Send a message to a page
   */
  static async sendMessage(pageId: string, content: string, userId: string, parentMessageId?: string | null): Promise<Thread> {
    try {
      console.log('TeamService: Sending message to page:', pageId, 'from user:', userId, 'parent:', parentMessageId);

      if (!content.trim()) {
        throw new Error('Message content cannot be empty');
      }

      const messageToInsert = {
        page_id: pageId,
        user_id: userId,
        content: content.trim(),
        parent_message_id: parentMessageId || null,
        is_ai: false,
        is_edited: false
      };

      // Try to insert the message
      const { data: newMessageData, error: insertMessageError } = await supabase
        .from('messages')
        .insert(messageToInsert)
        .select(`
          id,
          content,
          created_at,
          updated_at,
          user_id,
          page_id,
          parent_message_id,
          is_ai,
          is_edited
        `)
        .single();

      if (insertMessageError) {
        console.error('Error sending message:', insertMessageError);
        
        // For development, return a mock message when database is not available
        if (insertMessageError.code === 'PGRST116' || insertMessageError.code === '42P01') {
          console.log('Messages table not accessible, returning mock message');
          return {
            id: 'mock-' + Date.now(),
            content: content.trim(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: userId,
            page_id: pageId,
            parent_message_id: parentMessageId || null,
            user_profile: {
              id: userId,
              full_name: 'Dev User',
              avatar_url: null,
              display_name: 'User'
            }
          };
        }
        throw new Error(`Failed to send message: ${insertMessageError.message}`);
      }

      return {
        id: newMessageData.id,
        content: newMessageData.content,
        created_at: newMessageData.created_at,
        updated_at: newMessageData.updated_at,
        user_id: newMessageData.user_id,
        page_id: newMessageData.page_id,
        parent_message_id: newMessageData.parent_message_id || null,
        user_profile: {
          id: newMessageData.user_id,
          full_name: 'Team Member',
          avatar_url: null,
          display_name: 'User'
        }
      };
    } catch (error) {
      console.error('TeamService.sendMessage error:', error);
      throw error;
    }
  }

  /**
   * Subscribe to new messages in a page in real-time
   * Returns a function to unsubscribe
   */
  static subscribeToMessages(pageId: string, callback: (payload: any) => void): () => void {
    const hasLiveSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
    if (!hasLiveSupabase) {
      console.log('TeamService: Live Supabase not configured — skipping realtime subscription in offline/air-gapped mode.');
      return () => {};
    }
    console.log('TeamService: Subscribing to messages for page:', pageId);
    let channel: any = null;
    let retryCount = 0;
    let retryTimeout: any = null;
    let isUnsubscribed = false;

    const doSubscribe = () => {
      if (isUnsubscribed) return;

      try {
        channel = supabase.channel(`messages:${pageId}`);
        if (!channel || typeof channel.on !== 'function') {
          console.warn('TeamService: Realtime messages channel not supported or offline mock active');
          return;
        }

        channel
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `page_id=eq.${pageId}`
            },
            (payload: any) => {
              console.log('TeamService: Realtime message received:', payload);
              callback(payload);
            }
          )
          .subscribe((status: string, err: any) => {
            console.log(`TeamService: Messages subscription status for ${pageId}:`, status);
            if (status === 'CHANNEL_ERROR') {
              console.error(`TeamService: Messages subscription error for page ${pageId}:`, err);
              
              if (channel && typeof supabase.removeChannel === 'function') {
                supabase.removeChannel(channel);
              }

              if (retryCount < 3) {
                retryCount++;
                const delay = Math.min(5000, 1000 * Math.pow(2, retryCount));
                console.log(`TeamService: Retrying messages subscription in ${delay}ms (attempt ${retryCount}/3)`);
                retryTimeout = setTimeout(doSubscribe, delay);
              } else {
                console.error(`TeamService: Max messages subscription retries reached for page ${pageId}`);
              }
            } else if (status === 'SUBSCRIBED') {
              retryCount = 0;
            }
          });
      } catch (subErr) {
        console.warn('TeamService: Failed to subscribe to messages (offline/mock mode):', subErr);
      }
    };

    doSubscribe();

    return () => {
      isUnsubscribed = true;
      console.log('TeamService: Unsubscribing from messages for page:', pageId);
      if (retryTimeout) clearTimeout(retryTimeout);
      if (channel && typeof supabase.removeChannel === 'function') {
        supabase.removeChannel(channel);
      }
    };
  }

  /**
   * Subscribe to presence events
   * Returns a function to unsubscribe
   */
  static subscribeToPresence(teamId: string, userId: string, presenceStatus: string = 'online', onPresenceSync: (presences: any) => void): () => void {
    const hasLiveSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
    if (!hasLiveSupabase) {
      console.log('TeamService: Live Supabase not configured — skipping realtime subscription in offline/air-gapped mode.');
      return () => {};
    }
    console.log('TeamService: Subscribing to presence for team:', teamId);
    let channel: any = null;
    let retryCount = 0;
    let retryTimeout: any = null;
    let isUnsubscribed = false;

    const doSubscribe = () => {
      if (isUnsubscribed) return;

      try {
        channel = supabase.channel(`presence:${teamId}`);
        if (!channel || typeof channel.on !== 'function') {
          console.warn('TeamService: Realtime presence channel not supported or offline mock active');
          return;
        }

        // Defensively bind presence handlers (handles both chainable and non-chainable channel mocks)
        let currentCh = channel;
        try {
          const res1 = currentCh.on('presence', { event: 'sync' }, () => {
            const presences = typeof channel?.presenceState === 'function' ? channel.presenceState() : {};
            console.log('TeamService: Presence sync:', presences);
            onPresenceSync(presences);
          });
          if (res1 && typeof res1.on === 'function') currentCh = res1;

          const res2 = currentCh.on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
            console.log('TeamService: User joined:', key, newPresences);
          });
          if (res2 && typeof res2.on === 'function') currentCh = res2;

          const res3 = currentCh.on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
            console.log('TeamService: User left:', key, leftPresences);
          });
          if (res3 && typeof res3.on === 'function') currentCh = res3;
        } catch (onErr) {
          console.warn('TeamService: presence event binding caught non-fatal error:', onErr);
        }

        const subTarget = typeof currentCh?.subscribe === 'function' ? currentCh : (typeof channel?.subscribe === 'function' ? channel : null);
        if (subTarget) {
          subTarget.subscribe(async (status: string, err: any) => {
            console.log(`TeamService: Presence subscription status for team ${teamId}:`, status);
            if (status === 'SUBSCRIBED') {
              retryCount = 0;
              try {
                if (channel && typeof channel.track === 'function') {
                  await channel.track({
                    user_id: userId,
                    status: presenceStatus,
                    online_at: new Date().toISOString(),
                  });
                }
              } catch (trackErr) {
                console.error('TeamService: Failed to track presence:', trackErr);
              }
            } else if (status === 'CHANNEL_ERROR') {
              console.error(`TeamService: Presence subscription error for team ${teamId}:`, err);
              
              if (channel && typeof supabase.removeChannel === 'function') {
                supabase.removeChannel(channel);
              }

              if (retryCount < 3) {
                retryCount++;
                const delay = Math.min(5000, 1000 * Math.pow(2, retryCount));
                console.log(`TeamService: Retrying presence subscription in ${delay}ms (attempt ${retryCount}/3)`);
                retryTimeout = setTimeout(doSubscribe, delay);
              } else {
                console.error(`TeamService: Max presence subscription retries reached for team ${teamId}`);
              }
            }
          });
        }
      } catch (subErr) {
        console.warn('TeamService: Failed to subscribe to presence (offline/mock mode):', subErr);
      }
    };

    doSubscribe();

    return () => {
      isUnsubscribed = true;
      console.log('TeamService: Unsubscribing from presence for team:', teamId);
      if (retryTimeout) clearTimeout(retryTimeout);
      if (channel && typeof supabase.removeChannel === 'function') {
        supabase.removeChannel(channel);
      }
    };
  }

  /**
   * Send a direct message
   */
  static async sendDirectMessage(teamId: string, messageData: any): Promise<any> {
    try {
      console.log('TeamService: Sending DM in team:', teamId);
      
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          team_id: teamId,
          content: messageData.content,
          receiver_id: messageData.receiver_id,
          user_id: messageData.user_id || 'system'
        })
        .select()
        .single();

      if (error) {
        console.warn('Error sending DM (table might be missing):', error);
        // Mock fallback
        return {
          id: 'mock-dm-' + Date.now(),
          content: messageData.content || '',
          user_id: messageData.user_id || 'system',
          receiver_id: messageData.receiver_id || 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any;
      }

      return data;
    } catch (err) {
      console.error('sendDirectMessage failed:', err);
      throw err;
    }
  }


  /**
   * Create default team for new users
   */
  static async createDefaultTeam(userId: string): Promise<Team | null> {
    try {
      const defaultTeamData = {
        name: 'Your Workspace',
        description: 'Your default workspace for collaboration',
        avatar_url: undefined
      };

      let newTeam: Team | null = null;
      try {
        newTeam = await this.createTeam(defaultTeamData, userId);
      } catch (teamError) {
        console.warn('createTeam in createDefaultTeam encountered error, constructing local default team:', teamError);
      }

      if (!newTeam) {
        newTeam = {
          id: `team-${Date.now()}`,
          name: 'Your Workspace',
          description: 'Your default workspace for collaboration',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          members: [],
          pages: [],
          threads: [],
          direct_messages: []
        };
      }
      
      // Create a default general channel
      if (!newTeam.pages || newTeam.pages.length === 0) {
        try {
          const generalChannel = await this.createPage(newTeam.id, {
            name: 'general',
            description: 'General discussion channel',
            isPrivate: false
          });
          newTeam.pages = [generalChannel];
        } catch (channelError) {
          console.warn('Failed to create default channel via DB, using local general channel:', channelError);
          newTeam.pages = [{
            id: `page-${Date.now()}`,
            name: 'general',
            description: 'General discussion channel',
            isPrivate: false,
            unread: 0,
            isStarred: false,
            hasAI: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }];
        }
      }

      return newTeam;
    } catch (error) {
      console.error('Error creating default team:', error);
      return {
        id: `team-${Date.now()}`,
        name: 'Your Workspace',
        description: 'Your default workspace for collaboration',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        members: [],
        pages: [{
          id: `page-${Date.now()}`,
          name: 'general',
          description: 'General discussion channel',
          isPrivate: false,
          unread: 0,
          isStarred: false,
          hasAI: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }],
        threads: [],
        direct_messages: []
      };
    }
  }

  // Additional helper methods
  static async updateTeam(teamId: string, teamData: Partial<Team>): Promise<Team> {
    try {
      console.log('TeamService: Updating team:', teamId, teamData);
      
      const { data: updatedTeamData, error: updateTeamError } = await supabase
        .from('teams')
        .update({
          name: teamData.name,
          description: teamData.description
        })
        .eq('id', teamId)
        .select()
        .single();

      if (updateTeamError) {
        console.error('Error updating team:', updateTeamError);
        throw updateTeamError;
      }

      return {
        id: updatedTeamData.id,
        name: updatedTeamData.name,
        description: updatedTeamData.description,
        created_at: updatedTeamData.created_at,
        updated_at: updatedTeamData.updated_at,
        members: [],
        pages: [],
        threads: [],
        direct_messages: []
      };
    } catch (error) {
      console.error('TeamService.updateTeam error:', error);
      throw error;
    }
  }

  static async deleteTeam(teamId: string): Promise<void> {
    try {
      console.log('TeamService: Deleting team:', teamId);
      
      // First, delete all related data
      const { error: pagesError } = await supabase
        .from('pages')
        .delete()
        .eq('team_id', teamId);

      if (pagesError) {
        console.error('Error deleting team pages:', pagesError);
        // Continue with deletion even if pages fail
      }

      const { error: membersError } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId);

      if (membersError) {
        console.error('Error deleting team members:', membersError);
        // Continue with deletion even if members fail
      }

      // Finally, delete the team itself
      const { error: teamError } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (teamError) {
        console.error('Error deleting team:', teamError);
        throw teamError;
      }

      console.log('TeamService: Team deleted successfully:', teamId);
    } catch (error) {
      console.error('TeamService.deleteTeam error:', error);
      throw error;
    }
  }

  static async addTeamMember(teamId: string, memberData: Partial<TeamMember>): Promise<TeamMember> {
    try {
      console.log('TeamService: Adding team member:', teamId, memberData);
      
      const memberToInsert = {
        team_id: teamId,
        user_id: memberData.id,
        role: memberData.role || 'member'
      };

      const { data: newMemberData, error: insertMemberError } = await supabase
        .from('team_members')
        .insert(memberToInsert)
        .select()
        .single();

      if (insertMemberError) {
        console.error('Error adding team member:', insertMemberError);
        throw insertMemberError;
      }

      return {
        id: newMemberData.id,
        name: memberData.name || 'New Member',
        role: newMemberData.role,
        status: memberData.status || 'offline',
        avatar: memberData.avatar || '',
        created_at: newMemberData.created_at,
        updated_at: newMemberData.updated_at
      } as TeamMember;
    } catch (error) {
      console.error('TeamService.addTeamMember error:', error);
      throw error;
    }
  }

  static async removeTeamMember(teamId: string, memberId: string): Promise<void> {
    try {
      console.log('TeamService: Removing team member:', teamId, memberId);
      
      const { error: removeMemberError } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', memberId);

      if (removeMemberError) {
        console.error('Error removing team member:', removeMemberError);
        throw removeMemberError;
      }

      console.log('TeamService: Team member removed successfully');
    } catch (error) {
      console.error('TeamService.removeTeamMember error:', error);
      throw error;
    }
  }

  static async updatePage(pageId: string, pageData: Partial<Page>): Promise<Page> {
    try {
      console.log('TeamService: Updating page:', pageId, pageData);
      
      const { data: updatedPageData, error: updatePageError } = await supabase
        .from('pages')
        .update({
          name: pageData.name,
          description: pageData.description,
          is_private: pageData.isPrivate
        })
        .eq('id', pageId)
        .select()
        .single();

      if (updatePageError) {
        console.error('Error updating page:', updatePageError);
        throw updatePageError;
      }

      return {
        id: updatedPageData.id,
        name: updatedPageData.name,
        description: updatedPageData.description || '',
        isPrivate: updatedPageData.is_private,
        unread: 0,
        isStarred: false,
        hasAI: false,
        created_at: updatedPageData.created_at,
        updated_at: updatedPageData.updated_at
      };
    } catch (error) {
      console.error('TeamService.updatePage error:', error);
      throw error;
    }
  }

  static async deletePage(pageId: string): Promise<void> {
    try {
      console.log('TeamService: Starting deletion of page:', pageId);
      
      // 1. Delete page members first
      const { error: membersError } = await supabase
        .from('page_members')
        .delete()
        .eq('page_id', pageId);

      if (membersError) {
        console.warn('Error cleaning up page_members:', membersError);
      }

      // 2. Delete messages associated with this page
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('page_id', pageId);

      if (messagesError) {
        console.warn('Error clearing page messages:', messagesError);
      }

      // 3. Delete the page itself
      const { error: pageError, count } = await supabase
        .from('pages')
        .delete({ count: 'exact' })
        .eq('id', pageId);

      if (pageError) {
        console.error('Error deleting page record:', pageError);
        throw pageError;
      }

      console.log(`TeamService: Page ${pageId} deleted successfully. Rows affected: ${count}`);
    } catch (err) {
      console.error('TeamService.deletePage failed:', err);
      throw err;
    }
  }
}