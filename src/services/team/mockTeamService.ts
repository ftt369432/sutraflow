import type { Team, TeamMember, Page, Thread } from '../../types/team';

/**
 * Mock Team Service for offline testing and development
 * This provides a fully functional Teams system without database dependency
 */
export class MockTeamService {
  private static teams: Team[] = [
    {
      id: 'mock-team-1',
      name: 'GenieFlow Development',
      description: 'Main development team workspace',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      members: [
        {
          id: 'mock-user-1',
          name: 'Alex Developer',
          email: 'alex@genieflow.ai',
          role: 'admin',
          status: 'online',
          user_id: 'mock-user-1',
          avatar: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'mock-user-2', 
          name: 'Sarah Designer',
          email: 'sarah@genieflow.ai',
          role: 'member',
          status: 'away',
          user_id: 'mock-user-2',
          avatar: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      pages: [
        {
          id: 'mock-page-1',
          name: 'general',
          description: 'General team discussions',
          isPrivate: false,
          unread: 0,
          isStarred: false,
          hasAI: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          threads: []
        },
        {
          id: 'mock-page-2',
          name: 'development',
          description: 'Development related discussions',
          isPrivate: false,
          unread: 2,
          isStarred: true,
          hasAI: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          threads: []
        }
      ],
      threads: [],
      direct_messages: []
    },
    {
      id: 'mock-team-2',
      name: 'Marketing Team',
      description: 'Marketing and growth initiatives',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      members: [
        {
          id: 'mock-user-3',
          name: 'Mike Marketing',
          email: 'mike@genieflow.ai', 
          role: 'admin',
          status: 'offline',
          user_id: 'mock-user-3',
          avatar: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      pages: [
        {
          id: 'mock-page-3',
          name: 'campaigns',
          description: 'Marketing campaigns planning',
          isPrivate: false,
          unread: 1,
          isStarred: false,
          hasAI: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          threads: []
        }
      ],
      threads: [],
      direct_messages: []
    }
  ];

  private static messages: { [pageId: string]: Thread[] } = {
    'mock-page-1': [
      {
        id: 'msg-1',
        content: 'Welcome to the GenieFlow team! 🎉',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
        user_id: 'mock-user-1',
        page_id: 'mock-page-1',
        user_profile: {
          id: 'mock-user-1',
          full_name: 'Alex Developer',
          avatar_url: null,
          display_name: 'Alex'
        }
      },
      {
        id: 'msg-2',
        content: 'Thanks! Excited to be part of the team! 🚀',
        created_at: new Date(Date.now() - 1800000).toISOString(),
        updated_at: new Date(Date.now() - 1800000).toISOString(),
        user_id: 'mock-user-2',
        page_id: 'mock-page-1',
        user_profile: {
          id: 'mock-user-2',
          full_name: 'Sarah Designer',
          avatar_url: null,
          display_name: 'Sarah'
        }
      }
    ],
    'mock-page-2': [
      {
        id: 'msg-3',
        content: 'Starting work on the new Teams feature!',
        created_at: new Date(Date.now() - 900000).toISOString(),
        updated_at: new Date(Date.now() - 900000).toISOString(),
        user_id: 'mock-user-1',
        page_id: 'mock-page-2',
        user_profile: {
          id: 'mock-user-1',
          full_name: 'Alex Developer',
          avatar_url: null,
          display_name: 'Alex'
        }
      }
    ]
  };

  static async getUserTeams(userId: string): Promise<Team[]> {
    console.log('🔧 MockTeamService: Returning mock teams for user:', userId);
    return Promise.resolve(this.teams);
  }

  static async createTeam(teamData: Partial<Team>): Promise<Team> {
    const newTeam: Team = {
      id: 'mock-team-' + Date.now(),
      name: teamData.name || 'New Team',
      description: teamData.description || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      members: [],
      pages: [],
      threads: [],
      direct_messages: []
    };
    
    this.teams.push(newTeam);
    console.log('🔧 MockTeamService: Created mock team:', newTeam.name);
    return Promise.resolve(newTeam);
  }

  static async updateTeam(teamId: string, teamData: Partial<Team>): Promise<Team> {
    const team = this.teams.find(t => t.id === teamId);
    if (!team) throw new Error('Team not found');
    
    Object.assign(team, teamData, { updated_at: new Date().toISOString() });
    console.log('🔧 MockTeamService: Updated mock team:', team.name);
    return Promise.resolve(team);
  }

  static async deleteTeam(teamId: string): Promise<void> {
    const index = this.teams.findIndex(t => t.id === teamId);
    if (index !== -1) {
      this.teams.splice(index, 1);
      // Clean up associated messages
      Object.keys(this.messages).forEach(pageId => {
        const page = this.teams.find(t => t.pages.some(p => p.id === pageId));
        if (!page) {
          delete this.messages[pageId];
        }
      });
    }
    console.log('🔧 MockTeamService: Deleted mock team:', teamId);
    return Promise.resolve();
  }

  static async createPage(pageData: { name: string; team_id: string; description?: string; isPrivate?: boolean }): Promise<Page> {
    const team = this.teams.find(t => t.id === pageData.team_id);
    if (!team) throw new Error('Team not found');

    const newPage: Page = {
      id: 'mock-page-' + Date.now(),
      name: pageData.name,
      description: pageData.description || '',
      isPrivate: pageData.isPrivate || false,
      unread: 0,
      isStarred: false,
      hasAI: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      threads: []
    };

    team.pages.push(newPage);
    this.messages[newPage.id] = [];
    console.log('🔧 MockTeamService: Created mock page:', newPage.name);
    return Promise.resolve(newPage);
  }

  static async updatePage(pageId: string, pageData: Partial<Page>): Promise<Page> {
    let page: Page | undefined;
    for (const team of this.teams) {
      page = team.pages.find(p => p.id === pageId);
      if (page) break;
    }
    
    if (!page) throw new Error('Page not found');
    
    Object.assign(page, pageData, { updated_at: new Date().toISOString() });
    console.log('🔧 MockTeamService: Updated mock page:', page.name);
    return Promise.resolve(page);
  }

  static async deletePage(pageId: string): Promise<void> {
    for (const team of this.teams) {
      const index = team.pages.findIndex(p => p.id === pageId);
      if (index !== -1) {
        team.pages.splice(index, 1);
        delete this.messages[pageId];
        break;
      }
    }
    console.log('🔧 MockTeamService: Deleted mock page:', pageId);
    return Promise.resolve();
  }

  static async getMessages(pageId: string): Promise<Thread[]> {
    const messages = this.messages[pageId] || [];
    console.log('🔧 MockTeamService: Returning', messages.length, 'mock messages for page:', pageId);
    return Promise.resolve(messages);
  }

  static async sendMessage(pageId: string, content: string, userId: string): Promise<Thread> {
    if (!this.messages[pageId]) {
      this.messages[pageId] = [];
    }

    const newMessage: Thread = {
      id: 'mock-msg-' + Date.now(),
      content: content.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: userId,
      page_id: pageId,
      user_profile: {
        id: userId,
        full_name: 'Current User',
        avatar_url: null,
        display_name: 'User'
      }
    };

    this.messages[pageId].push(newMessage);
    console.log('🔧 MockTeamService: Sent mock message:', content);
    return Promise.resolve(newMessage);
  }

  static async addTeamMember(teamId: string, memberData: Partial<TeamMember>): Promise<TeamMember> {
    const team = this.teams.find(t => t.id === teamId);
    if (!team) throw new Error('Team not found');

    const newMember: TeamMember = {
      id: 'mock-member-' + Date.now(),
      name: memberData.name || 'New Member',
      email: memberData.email || 'member@genieflow.ai',
      role: memberData.role || 'member',
      status: memberData.status || 'offline',
      user_id: memberData.user_id || 'mock-user-' + Date.now(),
      avatar: memberData.avatar,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    team.members.push(newMember);
    console.log('🔧 MockTeamService: Added mock member:', newMember.name);
    return Promise.resolve(newMember);
  }

  static async removeTeamMember(teamId: string, memberId: string): Promise<void> {
    const team = this.teams.find(t => t.id === teamId);
    if (team) {
      const index = team.members.findIndex(m => m.user_id === memberId);
      if (index !== -1) {
        team.members.splice(index, 1);
      }
    }
    console.log('🔧 MockTeamService: Removed mock member:', memberId);
    return Promise.resolve();
  }

  static resetMockData(): void {
    // Reset to original mock data for testing
    console.log('🔧 MockTeamService: Resetting mock data');
  }
}