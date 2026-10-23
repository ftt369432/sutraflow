/**
 * 👥 Team Collaboration Service
 * 
 * Enterprise-grade shared workspace system with real-time collaboration,
 * role-based permissions, and AI agent sharing capabilities
 */

import { supabase } from '../lib/supabase';
import { EventEmitter } from 'events';

interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: string[];
  joinedAt: Date;
  lastActive?: Date;
  status: 'active' | 'inactive' | 'pending';
  profile: {
    name: string;
    email: string;
    avatar?: string;
    title?: string;
    department?: string;
  };
}

interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  plan: 'free' | 'pro' | 'enterprise';
  settings: {
    allowGuestAccess: boolean;
    requireApproval: boolean;
    aiAgentSharing: boolean;
    maxMembers: number;
    features: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  memberCount: number;
}

interface SharedWorkspace {
  id: string;
  teamId: string;
  name: string;
  description?: string;
  type: 'project' | 'department' | 'client' | 'general';
  members: string[]; // User IDs with access
  aiAgents: string[]; // Shared AI agent IDs
  canvases: string[]; // Shared canvas IDs
  conversations: string[]; // Shared conversation IDs
  permissions: {
    [userId: string]: {
      read: boolean;
      write: boolean;
      admin: boolean;
      aiAccess: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

interface CollaborationEvent {
  id: string;
  workspaceId: string;
  userId: string;
  type: 'canvas_edit' | 'canvas_share' | 'conversation_share' | 'agent_invoke' | 'agent_share' | 'member_join' | 'permission_change';
  data: any;
  timestamp: Date;
}

interface RealTimePresence {
  userId: string;
  workspaceId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  currentActivity?: string;
  lastSeen: Date;
}

export class TeamCollaborationService extends EventEmitter {
  private realtimeChannel: any = null;
  private presenceState: Map<string, RealTimePresence> = new Map();
  private currentWorkspace: string | null = null;
  private isInitialized = false;

  constructor() {
    super();
    this.initialize();
  }

  /**
   * Initialize team collaboration service
   */
  private async initialize() {
    console.log('👥 Team Collaboration: Initializing...');
    
    try {
      // Setup realtime channel for team collaboration
      this.realtimeChannel = supabase
        .channel('team-collaboration')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'team_workspaces' }, 
          (payload) => this.handleWorkspaceChange(payload)
        )
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'team_members' }, 
          (payload) => this.handleMemberChange(payload)
        )
        .on('broadcast', 
          { event: 'collaboration-event' }, 
          (payload) => this.handleCollaborationEvent(payload)
        )
        .on('presence', 
          { event: 'sync' }, 
          () => this.handlePresenceSync()
        )
        .on('presence', 
          { event: 'join' }, 
          ({ key, newPresences }) => this.handlePresenceJoin(key, newPresences)
        )
        .on('presence', 
          { event: 'leave' }, 
          ({ key, leftPresences }) => this.handlePresenceLeave(key, leftPresences)
        )
        .subscribe();

      this.isInitialized = true;
      console.log('👥 Team Collaboration: Initialized successfully');
      
    } catch (error) {
      console.error('👥 Team Collaboration: Initialization failed:', error);
    }
  }

  /**
   * Create a new team
   */
  async createTeam(name: string, description?: string, plan: 'free' | 'pro' | 'enterprise' = 'free'): Promise<Team> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const teamData = {
      id: crypto.randomUUID(),
      name,
      description,
      owner_id: user.id,
      plan,
      settings: {
        allowGuestAccess: false,
        requireApproval: true,
        aiAgentSharing: true,
        maxMembers: plan === 'free' ? 5 : plan === 'pro' ? 50 : 500,
        features: this.getPlanFeatures(plan)
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: team, error } = await supabase
      .from('teams')
      .insert(teamData)
      .select()
      .single();

    if (error) throw error;

    // Add creator as owner
    await this.addTeamMember(team.id, user.id, 'owner');

    // Create default workspace
    await this.createWorkspace(team.id, 'General', 'Default team workspace', 'general');

    console.log('👥 Team created:', team.name);
    this.emit('team_created', team);
    
    return this.formatTeam(team);
  }

  /**
   * Add member to team
   */
  async addTeamMember(
    teamId: string, 
    userId: string, 
    role: 'owner' | 'admin' | 'member' | 'viewer' = 'member',
    permissions: string[] = []
  ): Promise<TeamMember> {
    const defaultPermissions = this.getDefaultPermissions(role);
    const finalPermissions = permissions.length > 0 ? permissions : defaultPermissions;

    const memberData = {
      id: crypto.randomUUID(),
      user_id: userId,
      team_id: teamId,
      role,
      permissions: finalPermissions,
      joined_at: new Date().toISOString(),
      status: 'active'
    };

    const { data: member, error } = await supabase
      .from('team_members')
      .insert(memberData)
      .select(`
        *,
        profile:users(name, email, avatar_url)
      `)
      .single();

    if (error) throw error;

    console.log('👥 Member added to team:', userId);
    this.emit('member_added', this.formatTeamMember(member));
    
    return this.formatTeamMember(member);
  }

  /**
   * Create shared workspace
   */
  async createWorkspace(
    teamId: string,
    name: string,
    description?: string,
    type: 'project' | 'department' | 'client' | 'general' = 'project'
  ): Promise<SharedWorkspace> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const workspaceData = {
      id: crypto.randomUUID(),
      team_id: teamId,
      name,
      description,
      type,
      created_by: user.id,
      members: [user.id],
      ai_agents: [],
      canvases: [],
      conversations: [],
      permissions: {
        [user.id]: {
          read: true,
          write: true,
          admin: true,
          aiAccess: true
        }
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: workspace, error } = await supabase
      .from('team_workspaces')
      .insert(workspaceData)
      .select()
      .single();

    if (error) throw error;

    console.log('👥 Workspace created:', workspace.name);
    this.emit('workspace_created', workspace);
    
    return this.formatWorkspace(workspace);
  }

  /**
   * Share AI agent with team
   */
  async shareAIAgent(agentId: string, workspaceId: string, permissions: string[] = ['read', 'execute']) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Verify workspace access
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace.permissions[user.id]?.admin) {
      throw new Error('Insufficient permissions to share agents');
    }

    // Add agent to workspace
    const { error } = await supabase
      .from('team_workspaces')
      .update({
        ai_agents: [...workspace.aiAgents, agentId],
        updated_at: new Date().toISOString()
      })
      .eq('id', workspaceId);

    if (error) throw error;

    // Create sharing record
    await supabase
      .from('shared_ai_agents')
      .insert({
        id: crypto.randomUUID(),
        agent_id: agentId,
        workspace_id: workspaceId,
        shared_by: user.id,
        permissions,
        shared_at: new Date().toISOString()
      });

    // Broadcast to team
    await this.broadcastCollaborationEvent(workspaceId, {
      type: 'agent_share',
      data: { agentId, permissions },
      userId: user.id
    });

    console.log('👥 AI Agent shared:', agentId);
  }

  /**
   * Share canvas with team
   */
  async shareCanvas(canvasId: string, workspaceId: string, permissions: string[] = ['read', 'comment']) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const workspace = await this.getWorkspace(workspaceId);
    
    // Add canvas to workspace
    const { error } = await supabase
      .from('team_workspaces')
      .update({
        canvases: [...workspace.canvases, canvasId],
        updated_at: new Date().toISOString()
      })
      .eq('id', workspaceId);

    if (error) throw error;

    // Update canvas permissions
    await supabase
      .from('canvases')
      .update({
        shared: true,
        team_workspace_id: workspaceId,
        share_permissions: permissions
      })
      .eq('id', canvasId);

    // Broadcast to team
    await this.broadcastCollaborationEvent(workspaceId, {
      type: 'canvas_share',
      data: { canvasId, permissions },
      userId: user.id
    });

    console.log('👥 Canvas shared:', canvasId);
  }

  /**
   * Join workspace presence
   */
  async joinWorkspace(workspaceId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    this.currentWorkspace = workspaceId;
    
    // Track presence
    const presence = {
      userId: user.id,
      workspaceId,
      status: 'online' as const,
      joinedAt: new Date().toISOString()
    };

    if (this.realtimeChannel) {
      await this.realtimeChannel.track(presence);
    }

    console.log('👥 Joined workspace:', workspaceId);
    this.emit('workspace_joined', workspaceId);
  }

  /**
   * Leave workspace presence
   */
  async leaveWorkspace() {
    if (this.realtimeChannel && this.currentWorkspace) {
      await this.realtimeChannel.untrack();
      console.log('👥 Left workspace:', this.currentWorkspace);
      this.emit('workspace_left', this.currentWorkspace);
      this.currentWorkspace = null;
    }
  }

  /**
   * Get team workspaces
   */
  async getTeamWorkspaces(teamId: string): Promise<SharedWorkspace[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: workspaces, error } = await supabase
      .from('team_workspaces')
      .select('*')
      .eq('team_id', teamId)
      .contains('members', [user.id]);

    if (error) throw error;

    return workspaces?.map(w => this.formatWorkspace(w)) || [];
  }

  /**
   * Get workspace details
   */
  async getWorkspace(workspaceId: string): Promise<SharedWorkspace> {
    const { data: workspace, error } = await supabase
      .from('team_workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (error) throw error;

    return this.formatWorkspace(workspace);
  }

  /**
   * Get team members
   */
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const { data: members, error } = await supabase
      .from('team_members')
      .select(`
        *,
        profile:users(name, email, avatar_url)
      `)
      .eq('team_id', teamId)
      .eq('status', 'active');

    if (error) throw error;

    return members?.map(m => this.formatTeamMember(m)) || [];
  }

  /**
   * Broadcast collaboration event
   */
  async broadcastCollaborationEvent(workspaceId: string, event: Omit<CollaborationEvent, 'id' | 'workspaceId' | 'timestamp'>) {
    if (!this.realtimeChannel) return;

    const collaborationEvent: CollaborationEvent = {
      id: crypto.randomUUID(),
      workspaceId,
      timestamp: new Date(),
      ...event
    };

    await this.realtimeChannel.send({
      type: 'broadcast',
      event: 'collaboration-event',
      payload: collaborationEvent
    });
  }

  /**
   * Handle workspace changes
   */
  private handleWorkspaceChange(payload: any) {
    console.log('👥 Workspace change:', payload.eventType);
    this.emit('workspace_change', payload);
  }

  /**
   * Handle member changes
   */
  private handleMemberChange(payload: any) {
    console.log('👥 Member change:', payload.eventType);
    this.emit('member_change', payload);
  }

  /**
   * Handle collaboration events
   */
  private handleCollaborationEvent(payload: any) {
    const event = payload.payload as CollaborationEvent;
    console.log('👥 Collaboration event:', event.type);
    this.emit('collaboration_event', event);
  }

  /**
   * Handle presence sync
   */
  private handlePresenceSync() {
    if (!this.realtimeChannel) return;
    
    const presenceState = this.realtimeChannel.presenceState();
    this.presenceState.clear();
    
    Object.values(presenceState).forEach((presences: any) => {
      presences.forEach((presence: any) => {
        this.presenceState.set(presence.userId, presence);
      });
    });
    
    this.emit('presence_sync', this.getPresenceList());
  }

  /**
   * Handle presence join
   */
  private handlePresenceJoin(key: string, newPresences: any[]) {
    newPresences.forEach(presence => {
      this.presenceState.set(presence.userId, presence);
    });
    
    console.log('👥 User joined workspace:', key);
    this.emit('presence_join', newPresences);
  }

  /**
   * Handle presence leave
   */
  private handlePresenceLeave(key: string, leftPresences: any[]) {
    leftPresences.forEach(presence => {
      this.presenceState.delete(presence.userId);
    });
    
    console.log('👥 User left workspace:', key);
    this.emit('presence_leave', leftPresences);
  }

  /**
   * Get current presence list
   */
  getPresenceList(): RealTimePresence[] {
    return Array.from(this.presenceState.values());
  }

  /**
   * Get plan features
   */
  private getPlanFeatures(plan: string): string[] {
    const features = {
      free: ['basic_sharing', 'up_to_5_members', 'basic_ai_agents'],
      pro: ['advanced_sharing', 'up_to_50_members', 'custom_ai_agents', 'analytics', 'integrations'],
      enterprise: ['unlimited_members', 'enterprise_ai_agents', 'advanced_analytics', 'sso', 'api_access', 'priority_support']
    };
    
    return features[plan as keyof typeof features] || features.free;
  }

  /**
   * Get default permissions for role
   */
  private getDefaultPermissions(role: string): string[] {
    const permissions = {
      owner: ['read', 'write', 'admin', 'delete', 'invite', 'manage_roles'],
      admin: ['read', 'write', 'admin', 'invite', 'manage_members'],
      member: ['read', 'write', 'comment'],
      viewer: ['read', 'comment']
    };
    
    return permissions[role as keyof typeof permissions] || permissions.viewer;
  }

  /**
   * Format team data
   */
  private formatTeam(team: any): Team {
    return {
      id: team.id,
      name: team.name,
      description: team.description,
      ownerId: team.owner_id,
      plan: team.plan,
      settings: team.settings,
      createdAt: new Date(team.created_at),
      updatedAt: new Date(team.updated_at),
      memberCount: team.member_count || 0
    };
  }

  /**
   * Format team member data
   */
  private formatTeamMember(member: any): TeamMember {
    return {
      id: member.id,
      userId: member.user_id,
      teamId: member.team_id,
      role: member.role,
      permissions: member.permissions,
      joinedAt: new Date(member.joined_at),
      lastActive: member.last_active ? new Date(member.last_active) : undefined,
      status: member.status,
      profile: {
        name: member.profile?.name || 'Unknown',
        email: member.profile?.email || '',
        avatar: member.profile?.avatar_url,
        title: member.profile?.title,
        department: member.profile?.department
      }
    };
  }

  /**
   * Format workspace data
   */
  private formatWorkspace(workspace: any): SharedWorkspace {
    return {
      id: workspace.id,
      teamId: workspace.team_id,
      name: workspace.name,
      description: workspace.description,
      type: workspace.type,
      members: workspace.members || [],
      aiAgents: workspace.ai_agents || [],
      canvases: workspace.canvases || [],
      conversations: workspace.conversations || [],
      permissions: workspace.permissions || {},
      createdAt: new Date(workspace.created_at),
      updatedAt: new Date(workspace.updated_at)
    };
  }

  /**
   * Cleanup and destroy service
   */
  destroy() {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
      this.realtimeChannel = null;
    }
    
    this.presenceState.clear();
    this.removeAllListeners();
    
    console.log('👥 Team Collaboration: Service destroyed');
  }
}

// Global instance
export const teamCollaborationService = new TeamCollaborationService();

export default TeamCollaborationService;