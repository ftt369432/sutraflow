import React from 'react';
import { 
  MessageSquare, ChevronRight, ChevronLeft, Search, Plus, 
  MoreVertical, Edit3, Trash2, UserPlus, Shield, Hash, Lock, 
  Bell 
} from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/Avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/Tooltip';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from '../../components/ui/DropdownMenu';
import { Team, Page } from '../../types/team';

interface TeamSidebarProps {
  teams: Team[];
  activeTeam: Team | null;
  setActiveTeam: (team: Team) => void;
  activePage: Page | null;
  setActivePage: (page: Page) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  onCreateTeam: () => void;
  onEditTeam: (team: { id: string; name: string; description: string }) => void;
  onDeleteTeam: (target: { type: 'team' | 'channel'; id: string; name: string }) => void;
  onCreateChannel: () => void;
  onEditChannel: (channel: { id: string; name: string; description: string; isPrivate: boolean }) => void;
  onDeleteChannel: (target: { type: 'team' | 'channel'; id: string; name: string }) => void;
}

export const TeamSidebar: React.FC<TeamSidebarProps> = ({
  teams,
  activeTeam,
  setActiveTeam,
  activePage,
  setActivePage,
  sidebarCollapsed,
  setSidebarCollapsed,
  onCreateTeam,
  onEditTeam,
  onDeleteTeam,
  onCreateChannel,
  onEditChannel,
  onDeleteChannel,
}) => {
  const getInitials = (name?: string) => {
    if (!name || typeof name !== 'string') return 'WS';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'WS';
    return parts.map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'WS';
  };

  return (
    <div className={`flex flex-col border-r border-slate-200 bg-slate-50/80 transition-all duration-300 shrink-0 h-full ${sidebarCollapsed ? 'w-[60px]' : 'w-72'}`}>
      {/* Sidebar Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-slate-100 shrink-0">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-100">
              <MessageSquare className="h-3.5 w-3.5 text-white" />
            </div>
            <h1 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Teams</h1>
          </div>
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-all"
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto">
        {!sidebarCollapsed && (
          <div className="p-3 space-y-5">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search channels, messages..."
                className="pl-9 h-8 text-xs bg-white border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500/20 focus:border-blue-300 shadow-sm placeholder:text-slate-400"
              />
            </div>

            {/* Workspaces */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Workspaces</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={onCreateTeam} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-white transition-all">
                      <Plus className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Create workspace</TooltipContent>
                </Tooltip>
              </div>
              <div className="space-y-0.5">
                {teams.map((team, idx) => {
                  const teamName = team?.name || 'Workspace';
                  const teamId = team?.id || `team-${idx}`;
                  return (
                    <div key={teamId} className="group relative">
                      <button
                        onClick={() => setActiveTeam(team)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all duration-200 ${
                          activeTeam?.id === teamId 
                            ? 'bg-white text-slate-800 shadow-sm border border-slate-200' 
                            : 'text-slate-600 hover:bg-white/60 hover:text-slate-800'
                        }`}
                      >
                        <div className={`h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
                          activeTeam?.id === teamId ? 'bg-blue-600 shadow-md shadow-blue-100' : 'bg-slate-400'
                        }`}>
                          {getInitials(teamName)}
                        </div>
                        <span className="text-xs font-medium truncate">{teamName}</span>
                        {team?.pages && team.pages.length > 0 && (
                          <Badge variant="secondary" className="ml-auto text-[9px] px-1.5 py-0 h-4 bg-slate-100 text-slate-500 border-0">
                            {team.pages.length}
                          </Badge>
                        )}
                      </button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                            <MoreVertical className="h-3 w-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-xl border-slate-200">
                          <DropdownMenuItem className="text-xs" onClick={() => onEditTeam({ id: teamId, name: teamName, description: team?.description || '' })}>
                            <Edit3 className="h-3.5 w-3.5 mr-2" />Edit workspace
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs"><UserPlus className="h-3.5 w-3.5 mr-2" />Invite members</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-xs text-red-600 focus:text-red-600" onClick={() => onDeleteTeam({ type: 'team', id: teamId, name: teamName })}>
                            <Trash2 className="h-3.5 w-3.5 mr-2" />Delete workspace
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Channels */}
            {activeTeam && (
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    <Hash className="h-2.5 w-2.5 inline mr-1" />Channels
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={onCreateChannel} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-white transition-all">
                        <Plus className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Create channel</TooltipContent>
                  </Tooltip>
                </div>
                <div className="space-y-0.5">
                  {activeTeam.pages?.map((page) => (
                    <div key={page.id} className="group relative">
                      <button
                        onClick={() => setActivePage(page)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all duration-200 ${
                          activePage?.id === page.id
                            ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                            : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
                        }`}
                      >
                        {page.isPrivate 
                          ? <Lock className="h-3 w-3 text-amber-500 shrink-0" /> 
                          : <Hash className="h-3 w-3 text-slate-400 shrink-0" />
                        }
                        <span className="text-xs font-medium truncate">{page.name}</span>
                        {page.unread > 0 && (
                          <Badge className="ml-auto text-[9px] px-1.5 py-0 h-4 bg-blue-600 text-white border-0 shadow-sm">
                            {page.unread}
                          </Badge>
                        )}
                      </button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                            <MoreVertical className="h-3 w-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-xl border-slate-200">
                          <DropdownMenuItem className="text-xs" onClick={() => onEditChannel({ id: page.id, name: page.name, description: page.description || '', isPrivate: page.isPrivate || false })}>
                            <Edit3 className="h-3.5 w-3.5 mr-2" />Edit channel
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs"><Bell className="h-3.5 w-3.5 mr-2" />Notifications</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-xs text-red-600 focus:text-red-600" onClick={() => onDeleteChannel({ type: 'channel', id: page.id, name: page.name })}>
                            <Trash2 className="h-3.5 w-3.5 mr-2" />Delete channel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Members */}
            {activeTeam && activeTeam.members && activeTeam.members.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    Members ({activeTeam.members.length})
                  </span>
                </div>
                <div className="space-y-0.5">
                  {activeTeam.members.slice(0, 6).map((member, mIdx) => {
                    const memberName = member?.name || member?.email || 'Member';
                    const memberId = member?.id || `member-${mIdx}`;
                    return (
                      <div key={memberId} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/60 transition-colors">
                        <div className="relative">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={member?.avatar} />
                            <AvatarFallback className="text-[8px] bg-slate-300 text-white font-bold">
                              {getInitials(memberName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-slate-50 ${
                            member?.status === 'online' ? 'bg-emerald-500' :
                            member?.status === 'away' ? 'bg-amber-500' :
                            member?.status === 'busy' ? 'bg-red-500' : 'bg-slate-300'
                          }`} />
                        </div>
                        <span className="text-[11px] text-slate-600 truncate">{memberName}</span>
                        {member?.role === 'admin' && <Shield className="h-2.5 w-2.5 text-blue-500 ml-auto shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
