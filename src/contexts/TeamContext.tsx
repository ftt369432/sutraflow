import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { TeamService } from '../services/team/teamService';
import { DatabaseService } from '../services/database/databaseService';
import { useAuth } from './AuthContext';
import { extractTasksFromText, silentlyCreateTask } from '../services/ai/taskExtractor';

interface TeamContextType {
  teams: Team[];
  activeTeam: Team | null;
  activePage: Page | null;
  activePageMessages: Thread[];
  loading: boolean;
  loadingMessages: boolean;
  error: Error | null;
  setActiveTeam: (team: Team | null) => void;
  setActivePage: (page: Page | null) => void;
  createTeam: (teamData: { name: string; description?: string; avatar_url?: string }) => Promise<Team | null>;
  updateTeam: (teamId: string, teamData: Partial<Team>) => Promise<Team>;
  deleteTeam: (teamId: string) => Promise<void>;
  addTeamMember: (teamId: string, memberData: Partial<TeamMember>) => Promise<TeamMember>;
  removeTeamMember: (teamId: string, memberId: string) => Promise<void>;
  createPage: (teamId: string, pageData: Partial<Omit<Page, 'id' | 'created_at' | 'updated_at' | 'threads' | 'unread' | 'isStarred' | 'hasAI' >> & { name: string }) => Promise<Page>;
  updatePage: (pageId: string, pageData: Partial<Page>) => Promise<Page>;
  deletePage: (pageId: string) => Promise<void>;
  postMessage: (pageId: string, content: string, parentMessageId?: string | null) => Promise<Thread | null>;
  fetchMessages: (pageId: string) => Promise<void>;
  sendDirectMessage: (teamId: string, messageData: Partial<DirectMessage>) => Promise<DirectMessage>;
  refreshTeams: () => Promise<void>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TeamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();

  // Initialize database tables on component mount
  useEffect(() => {
    DatabaseService.initializeTables().catch(console.error);
  }, []);

  // Removed excessive console logging for performance

  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeam, _setActiveTeam] = useState<Team | null>(null);
  const [activePage, _setActivePage] = useState<Page | null>(null);
  const [activePageMessages, setActivePageMessages] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const activeTeamRef = useRef(activeTeam);
  const activePageRef = useRef(activePage);

  useEffect(() => {
    activeTeamRef.current = activeTeam;
  }, [activeTeam]);

  useEffect(() => {
    activePageRef.current = activePage;
  }, [activePage]);

  const setActivePage = useCallback((page: Page | null) => {
    console.log('TeamContext: Public setActivePage called with page:', JSON.stringify(page));
    _setActivePage(page);
    if (!page) {
      setActivePageMessages([]);
    }
  }, []);

  const setActiveTeam = useCallback((team: Team | null) => {
    console.log('TeamContext: Public setActiveTeam called with team:', JSON.stringify(team));
    _setActiveTeam(team);
    if (team && team.pages && team.pages.length > 0) {
      console.log('TeamContext: setActiveTeam - setting active page to first page of new team:', JSON.stringify(team.pages[0]));
      _setActivePage(team.pages[0]);
    } else {
      console.log('TeamContext: setActiveTeam - no pages in new team or team is null, setting active page to null.');
      _setActivePage(null);
    }
  }, []);

  const refreshTeams = useCallback(async () => {
    console.log('[TeamContext] refreshTeams called - user:', user?.id, 'loading:', loading);
    
    if (!user || !user.id) {
      console.log('[TeamContext] No user authenticated, clearing teams state');
      setLoading(false);
      setTeams([]);
      _setActiveTeam(null);
      _setActivePage(null);
      return;
    }
    
    try {
      console.log('[TeamContext] Starting teams fetch for user:', user.id);
      setLoading(true);
      
      // Add timeout to prevent hanging requests - back to 10 seconds since we have a working mock
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000)
      );
      
      console.log('[TeamContext] About to call TeamService.getTeams');
      
      let userTeams: Team[] = [];
      try {
        userTeams = await Promise.race([
          TeamService.getTeams(user.id),
          timeoutPromise
        ]) as Team[];
        
        console.log('[TeamContext] Successfully received teams:', userTeams?.length || 0, 'teams');
        setTeams(userTeams);
      } catch (serviceError) {
        console.error('[TeamContext] TeamService.getTeams failed:', serviceError);
        throw serviceError;
      }

      let newActiveTeam: Team | null = null;
      let newActivePage: Page | null = null;

      const currentPersistedActiveTeam = activeTeamRef.current;
      const currentPersistedActivePage = activePageRef.current;

      if (userTeams.length === 0) {
        newActiveTeam = null;
        newActivePage = null;
      } else {
        const currentActiveTeamStillExists = currentPersistedActiveTeam && userTeams.some(t => t.id === currentPersistedActiveTeam.id);
        
        if (currentActiveTeamStillExists) {
          newActiveTeam = userTeams.find(t => t.id === currentPersistedActiveTeam!.id) || userTeams[0];
        } else {
          newActiveTeam = userTeams[0];
        }

        if (newActiveTeam) {
          const currentActivePageStillExistsInNewActiveTeam = currentPersistedActivePage && newActiveTeam.pages.some(p => p.id === currentPersistedActivePage.id);
          if (currentActivePageStillExistsInNewActiveTeam) {
            newActivePage = newActiveTeam.pages.find(p => p.id === currentPersistedActivePage!.id) || (newActiveTeam.pages.length > 0 ? newActiveTeam.pages[0] : null) ;
          } else if (newActiveTeam.pages.length > 0) {
            newActivePage = newActiveTeam.pages[0];
          }
        }
      }
      
      _setActiveTeam(newActiveTeam);
      _setActivePage(newActivePage);
      setError(null);
    } catch (err) {
      // Silently handle team errors - teams are optional functionality
      // The 500 error is likely due to backend database policy issues
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // TEMPORARY: Enhanced error logging for debugging
      console.error('[TeamContext] Full error details:', err);
      console.error('[TeamContext] Error message:', errorMessage);
      
      // Check for specific database policy errors that indicate backend configuration issues
      if (errorMessage.includes('infinite recursion detected in policy') || 
          errorMessage.includes('42P17')) {
        console.error('[TeamContext] Database policy issue detected - teams functionality disabled:', errorMessage);
        // Don't show error to user since this is a backend configuration issue
        setError(null);
      } else {
        console.error('[TeamContext] Teams API unavailable, continuing without teams:', errorMessage);
        setError(null); // Don't show error to user since teams are optional
      }
      
      setTeams([]);
      _setActiveTeam(null);
      _setActivePage(null);
    } finally {
      setLoading(false);
    }
  }, [user, _setActiveTeam, _setActivePage, setLoading, setTeams, setError]);

  // Use ref to prevent infinite re-renders
  const refreshTeamsRef = useRef(refreshTeams);
  refreshTeamsRef.current = refreshTeams;

  useEffect(() => {
    console.log('[TeamContext] Main useEffect triggered - user:', user?.id, 'authLoading:', authLoading);
    
    if (authLoading) {
      console.log('[TeamContext] Auth still loading, setting loading state');
      setLoading(true);
      return;
    }
    if (user && user.id) {
      console.log('[TeamContext] User authenticated, calling refreshTeams');
      refreshTeamsRef.current();
    } else {
      console.log('[TeamContext] No user, clearing teams state');
      setTeams([]);
      _setActiveTeam(null);
      _setActivePage(null);
      setLoading(false);
    }
  }, [user?.id, authLoading]); // Remove refreshTeams from dependencies

  const fetchMessages = useCallback(async (pageId: string) => {
    if (!pageId) return;
    setLoadingMessages(true);
    try {
      const messages = await TeamService.getMessages(pageId);
      setActivePageMessages(messages);
    } catch (err) {
      console.error('Error fetching messages in context:', err);
      setActivePageMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    let unsubscribeMessages: (() => void) | null = null;
    
    if (activePage && activePage.id) {
      fetchMessages(activePage.id);
      
      unsubscribeMessages = TeamService.subscribeToMessages(activePage.id, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMessage = payload.new;
          const threadMsg: Thread = {
            id: newMessage.id,
            content: newMessage.content,
            created_at: newMessage.created_at,
            updated_at: newMessage.updated_at,
            user_id: newMessage.user_id,
            page_id: newMessage.page_id,
            parent_message_id: newMessage.parent_message_id,
            user_profile: {
              id: newMessage.user_id,
              full_name: 'Team Member',
              avatar_url: undefined,
              display_name: 'User'
            }
          };
          
          setActivePageMessages(prev => {
            if (prev.find(m => m.id === threadMsg.id)) return prev;
            return [...prev, threadMsg];
          });
        }
      });
      
    } else {
      setActivePageMessages([]);
    }
    
    return () => {
      if (unsubscribeMessages) unsubscribeMessages();
    };
  }, [activePage, fetchMessages]);

  useEffect(() => {
    let unsubscribePresence: (() => void) | null = null;
    
    if (activeTeam && activeTeam.id && user && user.id) {
      try {
        unsubscribePresence = TeamService.subscribeToPresence(activeTeam.id, user.id, 'online', (presences) => {
          console.log('TeamContext: Presences synced for team', activeTeam.id, presences);
          const onlineUserIds = new Set<string>();
          Object.values(presences).forEach((presenceTracks: any) => {
            presenceTracks.forEach((track: any) => {
              if (track.user_id) {
                onlineUserIds.add(track.user_id);
              }
            });
          });

          _setActiveTeam(prevActiveTeam => {
            if (!prevActiveTeam) return null;
            const updatedMembers = prevActiveTeam.members.map(member => ({
              ...member,
              status: (onlineUserIds.has(member.id) ? 'online' : 'offline') as any
            }));
            return {
              ...prevActiveTeam,
              members: updatedMembers
            };
          });

          setTeams(prevTeams => prevTeams.map(t => {
            if (t.id === activeTeam.id) {
              const updatedMembers = t.members.map(member => ({
                ...member,
                status: (onlineUserIds.has(member.id) ? 'online' : 'offline') as any
              }));
              return {
                ...t,
                members: updatedMembers
              };
            }
            return t;
          }));
        });
      } catch (presenceErr) {
        console.warn('TeamContext: Gracefully handled presence subscription failure:', presenceErr);
      }
    }
    
    return () => {
      if (unsubscribePresence) unsubscribePresence();
    };
  }, [activeTeam?.id, user?.id]);

  const createTeam = useCallback(async (teamData: { name: string; description?: string; avatar_url?: string }) => {
    if (!user || !user.id) {
      setError(new Error('User must be logged in to create a team.'));
      throw new Error('User must be logged in to create a team.');
    }
    try {
      setLoading(true);
      const newTeam = await TeamService.createTeam(teamData, user.id);
      await refreshTeams();
      return newTeam;
    } catch (err) {
      console.error('TeamContext: createTeam - error:', err);
      setError(err instanceof Error ? err : new Error('Failed to create team'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, refreshTeams]);

  const updateTeam = useCallback(async (teamId: string, teamData: Partial<Team>) => {
    if (!user || !user.id) throw new Error('User must be logged in to update a team.');
    try {
      const updatedTeam = await TeamService.updateTeam(teamId, teamData);
      await refreshTeams();
      return updatedTeam;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update team'));
      throw err;
    }
  }, [user, refreshTeams]);

  const deleteTeam = useCallback(async (teamId: string) => {
    if (!user || !user.id) throw new Error('User must be logged in to delete a team.');
    try {
      setLoading(true);
      await TeamService.deleteTeam(teamId);
      if (activeTeam?.id === teamId) {
        _setActiveTeam(null);
        _setActivePage(null);
      }
      await refreshTeams();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete team'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, activeTeam, refreshTeams]);

  const addTeamMember = useCallback(async (teamId: string, memberData: Partial<TeamMember>) => {
    if (!user || !user.id) throw new Error('User must be logged in to add a member.');
    try {
      const newMember = await TeamService.addTeamMember(teamId, memberData);
      let updatedActiveTeam: Team | null = null;
      setTeams(prev => prev.map(team => {
        if (team.id === teamId) {
          const newTeam = { ...team, members: [...team.members, newMember] };
          if (activeTeam?.id === teamId) {
            updatedActiveTeam = newTeam;
          }
          return newTeam;
        }
        return team;
      }));
      if (updatedActiveTeam) {
        _setActiveTeam(updatedActiveTeam);
      }
      return newMember;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add member'));
      throw err;
    }
  }, [user, activeTeam]);

  const removeTeamMember = useCallback(async (teamId: string, memberId: string) => {
    if (!user || !user.id) throw new Error('User must be logged in to remove a member.');
    try {
      await TeamService.removeTeamMember(teamId, memberId);
      let updatedActiveTeam: Team | null = null;
      setTeams(prev => prev.map(team => {
        if (team.id === teamId) {
          const newTeam = { ...team, members: team.members.filter(m => m.id !== memberId) };
          if (activeTeam?.id === teamId) {
            updatedActiveTeam = newTeam;
          }
          return newTeam;
        }
        return team;
      }));
      if (updatedActiveTeam) {
        _setActiveTeam(updatedActiveTeam);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to remove member'));
      throw err;
    }
  }, [user, activeTeam]);

  const createPage = useCallback(async (teamId: string, pageData: Partial<Omit<Page, 'id' | 'created_at' | 'updated_at' | 'threads' | 'unread' | 'isStarred' | 'hasAI' >> & { name: string }) => {
    if (!user || !user.id) throw new Error('User must be logged in to create a page.');
    try {
      const newPage = await TeamService.createPage(teamId, pageData);
      await refreshTeams();
      return newPage;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create page'));
      throw err;
    }
  }, [user, refreshTeams]);

  const updatePage = useCallback(async (pageId: string, pageData: Partial<Page>) => {
    if (!user || !user.id) throw new Error('User must be logged in to update a page.');
    try {
      const updatedPage = await TeamService.updatePage(pageId, pageData);
      await refreshTeams();
      if (activePage?.id === pageId) {
        _setActivePage(updatedPage);
      }
      return updatedPage;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update page'));
      throw err;
    }
  }, [user, activePage, _setActivePage, refreshTeams]);

  const deletePage = useCallback(async (pageId: string) => {
    if (!user || !user.id) throw new Error('User must be logged in to delete a page.');
    try {
      await TeamService.deletePage(pageId);
      if (activePage?.id === pageId) {
        _setActivePage(null);
      }
      await refreshTeams();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete page'));
      throw err;
    }
  }, [user, activePage, _setActivePage, refreshTeams]);

  const postMessage = useCallback(async (pageId: string, content: string, parentMessageId?: string | null) => {
    if (!user) {
      setError(new Error('User is not authenticated'));
      console.error('TeamContext: postMessage - User is not authenticated.');
      return null;
    }
    const currentUserId = user.id;
    if (!currentUserId) {
      setError(new Error('User ID is missing'));
      console.error('TeamContext: postMessage - User ID is missing.');
      return null;
    }

    try {
      const newMessage = await TeamService.sendMessage(pageId, content, currentUserId, parentMessageId);
      if (newMessage) {
        setActivePageMessages(prevMessages => {
          if (prevMessages.find(m => m.id === newMessage.id)) return prevMessages;
          return [...prevMessages, newMessage];
        });

        // 🤖 Silent AI Auto-Tasking Engine: Scan message and extract tasks in background
        const extracted = extractTasksFromText(content);
        if (extracted.length > 0) {
          console.log(`TaskExtractor: Found ${extracted.length} potential task(s) in message`);
          extracted.forEach(task => {
            silentlyCreateTask(task, currentUserId).catch(err => {
              console.error('TaskExtractor: Silent task creation failed:', err);
            });
          });
        }
      }
      return newMessage;
    } catch (err) {
      console.error('TeamContext: postMessage - error:', err);
      setError(err instanceof Error ? err : new Error('Failed to send message'));
      return null;
    }
  }, [user]);

  const sendDirectMessage = useCallback(async (teamId: string, messageData: Partial<DirectMessage>) => {
    if (!user || !user.id) throw new Error('User must be logged in to send a DM.');
    try {
      const newDm = await TeamService.sendDirectMessage(teamId, messageData);
      if (activeTeam?.id === teamId) {
        _setActiveTeam(prevActiveTeam => prevActiveTeam ? {
          ...prevActiveTeam,
          direct_messages: [...prevActiveTeam.direct_messages, newDm]
        } : null);
      }
      return newDm;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to send direct message'));
      throw err;
    }
  }, [user, activeTeam]);

  return (
    <TeamContext.Provider value={{
      teams,
      activeTeam,
      activePage,
      activePageMessages,
      loading,
      loadingMessages,
      error,
      setActiveTeam,
      setActivePage,
      createTeam,
      updateTeam,
      deleteTeam,
      addTeamMember,
      removeTeamMember,
      createPage,
      updatePage,
      deletePage,
      postMessage,
      fetchMessages,
      sendDirectMessage,
      refreshTeams
    }}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (context === undefined) {
    console.error('useTeam must be used within a TeamProvider. Make sure TeamProvider is properly wrapping your component tree.');
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};