/**
 * 🎨 Beautiful Teams Sidebar - Modern Glassmorphism Design
 * 
 * A stunning sidebar component for team navigation with:
 * - Glassmorphism effects and backdrop blur
 * - Smooth animations and micro-interactions
 * - Responsive design with accessibility features
 * - Beautiful gradients and modern shadows
 * - Production-ready with comprehensive error handling
 * 
 * @version 2.0.0
 * @author GenieFlow AI Team
 */

import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Hash, 
  Lock, 
  UserPlus,
  Users,
  Star,
  StarOff,
  Settings,
  Search,
  Shield,
  User,
  Crown,
  Sparkles,
  Activity,
  Bell,
  BellOff
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { ScrollArea } from '../ui/ScrollArea';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Separator } from '../ui/Separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '../ui/Dialog';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { useTeam } from '../../contexts/TeamContext';
import { useToast } from '../../hooks/useToast';
import type { Page, TeamMember, DirectMessage } from '../../types/team';

/**
 * Get status indicator color for team members
 */
const getStatusColor = (status: TeamMember['status']) => {
  switch (status) {
    case 'online': return 'bg-emerald-500 shadow-emerald-500/30';
    case 'offline': return 'bg-slate-400 shadow-slate-400/30';
    case 'away': return 'bg-amber-500 shadow-amber-500/30';
    case 'busy': return 'bg-red-500 shadow-red-500/30';
    default: return 'bg-slate-400 shadow-slate-400/30';
  }
};

/**
 * Get role icon for team members
 */
const getRoleIcon = (role: TeamMember['role']) => {
  switch (role) {
    case 'admin': 
      return <Crown className="h-3 w-3 text-amber-500" />;
    case 'member': 
      return <User className="h-3 w-3 text-blue-500" />;
    case 'guest': 
      return <User className="h-3 w-3 text-slate-400" />;
    default: 
      return <User className="h-3 w-3 text-slate-500" />;
  }
};

/**
 * Beautiful Sidebar Section Component
 */
interface SidebarSectionProps {
  title: string;
  icon: React.ReactNode;
  count?: number;
  expanded: boolean;
  onToggle: () => void;
  onAdd?: () => void;
  addTooltip?: string;
  children: React.ReactNode;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({
  title,
  icon,
  count,
  expanded,
  onToggle,
  onAdd,
  addTooltip,
  children
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between group px-2 py-1 rounded-lg hover:bg-white/20 dark:hover:bg-white/5 transition-all duration-200">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="flex-1 justify-start h-auto p-0 font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${title} section`}
      >
        <div className="flex items-center space-x-2">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-500" />
          )}
          {icon}
          <span>{title}</span>
          {count !== undefined && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              {count}
            </Badge>
          )}
        </div>
      </Button>
      
      {onAdd && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAdd}
              className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-primary-100 dark:hover:bg-primary-900/20"
              aria-label={addTooltip}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{addTooltip}</TooltipContent>
        </Tooltip>
      )}
    </div>
    
    {expanded && (
      <div className="ml-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
        {children}
      </div>
    )}
  </div>
);

/**
 * Beautiful Channel Item Component
 */
interface ChannelItemProps {
  page: Page;
  isActive: boolean;
  onClick: () => void;
}

const ChannelItem: React.FC<ChannelItemProps> = ({ page, isActive, onClick }) => (
  <Button
    variant={isActive ? "default" : "ghost"}
    size="sm"
    onClick={onClick}
    className={`w-full justify-start h-8 px-3 transition-all duration-200 group ${
      isActive 
        ? 'bg-gradient-to-r from-primary-500 to-blue-600 text-white shadow-lg transform scale-105' 
        : 'hover:bg-white/30 dark:hover:bg-white/5 hover:translate-x-1'
    }`}
    aria-label={`Switch to ${page.name} channel`}
  >
    <div className="flex items-center space-x-2 flex-1 min-w-0">
      {page.isPrivate ? (
        <Lock className={`h-3 w-3 flex-shrink-0 ${isActive ? 'text-orange-200' : 'text-orange-500'}`} />
      ) : (
        <Hash className={`h-3 w-3 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
      )}
      <span className="truncate text-sm font-medium">{page.name}</span>
    </div>
    
    {page.unread > 0 && (
      <Badge 
        variant="destructive" 
        className={`text-xs px-1.5 py-0.5 ${isActive ? 'bg-white/20 text-white' : 'bg-red-500 text-white'} shadow-lg`}
      >
        {page.unread > 99 ? '99+' : page.unread}
      </Badge>
    )}
    
    {page.isStarred && (
      <Star className={`h-3 w-3 ${isActive ? 'text-yellow-200' : 'text-yellow-500'} fill-current`} />
    )}
  </Button>
);

/**
 * Beautiful Member Item Component
 */
interface MemberItemProps {
  member: TeamMember;
}

const MemberItem: React.FC<MemberItemProps> = ({ member }) => (
  <div className="flex items-center space-x-3 px-2 py-2 rounded-lg hover:bg-white/20 dark:hover:bg-white/5 transition-all duration-200 group cursor-pointer">
    <div className="relative">
      <Avatar className="w-7 h-7">
        <AvatarImage src={member.avatar} />
        <AvatarFallback className="text-xs bg-gradient-to-br from-slate-400 to-slate-600 text-white">
          {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div 
        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 shadow-sm ${getStatusColor(member.status)}`}
        aria-label={`${member.name} is ${member.status}`}
      />
    </div>
    
    <div className="flex-1 min-w-0">
      <div className="flex items-center space-x-1">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
          {member.name}
        </p>
        {getRoleIcon(member.role)}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
        {member.status}
      </p>
    </div>
    
    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
        <Settings className="h-3 w-3" />
      </Button>
    </div>
  </div>
);

/**
 * Main Teams Sidebar Component
 */
export const TeamsSidebar: React.FC = () => {
  const { toast } = useToast();
  const { 
    teams, 
    activeTeam, 
    setActiveTeam,
    activePage,
    setActivePage,
    createPage,
  } = useTeam();

  // Component State
  const [expandedSections, setExpandedSections] = useState({
    workspaces: false,
    pages: true,
    directMessages: false,
    members: true,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [passcodeDialogOpen, setPasscodeDialogOpen] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [currentPrivatePage, setCurrentPrivatePage] = useState<Page | null>(null);
  const [createPageDialogOpen, setCreatePageDialogOpen] = useState(false);
  const [newPageData, setNewPageData] = useState({
    name: '',
    isPrivate: false,
    passcode: '',
    description: ''
  });

  // Handlers
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handlePageClick = async (page: Page) => {
    console.log('TeamsSidebar: handlePageClick for page:', JSON.stringify(page));
    if (page.isPrivate && page.passcode) {
      if (activePage?.id === page.id) {
        console.log('TeamsSidebar: Page already active/unlocked:', page.name);
        setActivePage(page);
        return;
      }
      setCurrentPrivatePage(page);
      setPasscodeDialogOpen(true);
      setPasscodeInput('');
    } else {
      console.log('TeamsSidebar: Navigating to public page:', page.name);
      setActivePage(page);
    }
  };

  const handlePasscodeSubmit = () => {
    if (currentPrivatePage && passcodeInput === currentPrivatePage.passcode) {
      console.log('TeamsSidebar: Access granted to private page:', currentPrivatePage.name);
      setPasscodeDialogOpen(false);
      setActivePage(currentPrivatePage);
      setCurrentPrivatePage(null);
      setPasscodeInput('');
    } else {
      toast.error('Incorrect passcode');
    }
  };

  const handleCreatePage = async () => {
    if (!activeTeam) return;
    try {
      const newPageDetails = {
        name: newPageData.name.toLowerCase().replace(/\\s+/g, '-'),
        isPrivate: newPageData.isPrivate,
        passcode: newPageData.isPrivate ? newPageData.passcode : undefined,
        description: newPageData.description,
      };
      
      await createPage(activeTeam.id, newPageDetails);
      toast.success(`Channel #${newPageDetails.name} created successfully! 🎉`);
      setCreatePageDialogOpen(false);
      setNewPageData({ name: '', isPrivate: false, passcode: '', description: '' });
    } catch (error) {
      console.error('Failed to create page:', error);
      toast.error('Failed to create channel. Please try again.');
    }
  };

  // Filter functions
  const filteredPages = activeTeam?.pages?.filter(page => 
    page.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredMembers = activeTeam?.members?.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <TooltipProvider>
      <Card className="h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 rounded-none shadow-xl">
        {/* Header */}
        <CardHeader className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <Users className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                Teams
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-xs bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800">
              v2.0
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0 h-full">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search teams, channels..."
                  className="pl-10 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 focus:border-primary-500 dark:focus:border-primary-400"
                  aria-label="Search teams and channels"
                />
              </div>

              {/* Active Workspace Display */}
              {activeTeam && (
                <div className="relative">
                  <Card className="bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-primary-200/50 dark:border-primary-800/50 shadow-lg">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10 ring-2 ring-primary-200 dark:ring-primary-800">
                          <AvatarImage src={activeTeam.avatar} />
                          <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-primary-500 to-blue-600 text-white">
                            {activeTeam.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-1 leading-tight">
                            {activeTeam.name}
                          </h3>
                          {activeTeam.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-tight">
                              {activeTeam.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-1">
                              <Hash className="h-3 w-3 text-primary-500" />
                              <span className="text-xs text-slate-600 dark:text-slate-400">
                                {activeTeam.pages?.length || 0} channels
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="h-3 w-3 text-primary-500" />
                              <span className="text-xs text-slate-600 dark:text-slate-400">
                                {activeTeam.members?.length || 0} members
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-8 h-8 p-0 hover:bg-primary-100 dark:hover:bg-primary-900/20"
                        >
                          <Settings className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Team Selection (if multiple teams) */}
              {teams.length > 1 && (
                <SidebarSection
                  title="Switch Workspace"
                  icon={<Sparkles className="h-4 w-4 text-primary-500" />}
                  count={teams.length}
                  expanded={false}
                  onToggle={() => toggleSection('workspaces')}
                  onAdd={() => {}}
                  addTooltip="Create new workspace"
                >
                  <div className="space-y-1">
                    {teams.filter(team => team.id !== activeTeam?.id).map((team) => (
                      <Button
                        key={team.id}
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTeam(team)}
                        className="w-full justify-start h-10 px-3 transition-all duration-200 group hover:bg-white/30 dark:hover:bg-white/5 hover:translate-x-1"
                        aria-label={`Switch to ${team.name} workspace`}
                      >
                        <Avatar className="w-6 h-6 mr-3">
                          <AvatarImage src={team.avatar} />
                          <AvatarFallback className="text-xs bg-gradient-to-br from-primary-400 to-blue-500 text-white">
                            {team.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="truncate font-medium text-slate-900 dark:text-slate-100">{team.name}</p>
                          {team.description && (
                            <p className="text-xs truncate text-slate-500">
                              {team.description}
                            </p>
                          )}
                        </div>
                        {team.pages?.length > 0 && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700"
                          >
                            {team.pages.length}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                </SidebarSection>
              )}

              {/* Channels Section */}
              {activeTeam && (
                <SidebarSection
                  title="Channels"
                  icon={<Hash className="h-4 w-4 text-blue-500" />}
                  count={filteredPages.length}
                  expanded={expandedSections.pages}
                  onToggle={() => toggleSection('pages')}
                  onAdd={() => setCreatePageDialogOpen(true)}
                  addTooltip="Create new channel"
                >
                  <div className="space-y-1">
                    {filteredPages.length > 0 ? (
                      filteredPages.map((page) => (
                        <ChannelItem
                          key={page.id}
                          page={page}
                          isActive={activePage?.id === page.id}
                          onClick={() => handlePageClick(page)}
                        />
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center">
                        {searchTerm ? (
                          <div className="space-y-2">
                            <Hash className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              No channels found for "{searchTerm}"
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full flex items-center justify-center mx-auto">
                              <Hash className="h-6 w-6 text-blue-500" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                No channels yet
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Create your first channel to start collaborating with your team
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => setCreatePageDialogOpen(true)}
                              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Create Channel
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </SidebarSection>
              )}

              {/* Direct Messages Section */}
              {activeTeam && activeTeam.direct_messages && activeTeam.direct_messages.length > 0 && (
                <SidebarSection
                  title="Direct Messages"
                  icon={<Activity className="h-4 w-4 text-slate-500" />}
                  count={activeTeam.direct_messages.length}
                  expanded={expandedSections.directMessages}
                  onToggle={() => toggleSection('directMessages')}
                >
                  <div className="space-y-1">
                    {activeTeam.direct_messages.map((dm) => (
                      <Button
                        key={dm.id}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start h-9 px-3 hover:bg-white/30 dark:hover:bg-white/5 transition-all duration-200"
                      >
                        <div className="relative mr-3">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={dm.avatar} />
                            <AvatarFallback className="text-xs bg-gradient-to-br from-slate-400 to-slate-600 text-white">
                              {dm.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white dark:border-slate-800 ${getStatusColor(dm.status)}`} />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {dm.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {dm.lastMessage}
                          </p>
                        </div>
                        {dm.unread > 0 && (
                          <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                            {dm.unread}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                </SidebarSection>
              )}

              {/* Members Section */}
              {activeTeam && (
                <SidebarSection
                  title="Members"
                  icon={<Users className="h-4 w-4 text-emerald-500" />}
                  count={filteredMembers.length}
                  expanded={expandedSections.members}
                  onToggle={() => toggleSection('members')}
                  onAdd={() => {}}
                  addTooltip="Invite member"
                >
                  <div className="space-y-1">
                    {filteredMembers.length > 0 ? (
                      <>
                        {filteredMembers.slice(0, 10).map((member) => (
                          <MemberItem key={member.id} member={member} />
                        ))}
                        {filteredMembers.length > 10 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full justify-center text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 py-2"
                          >
                            +{filteredMembers.length - 10} more members
                          </Button>
                        )}
                      </>
                    ) : (
                      <div className="px-3 py-4 text-center">
                        {searchTerm ? (
                          <div className="space-y-2">
                            <Users className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              No members found for "{searchTerm}"
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 rounded-full flex items-center justify-center mx-auto">
                              <UserPlus className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Invite team members
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Add colleagues to collaborate and share ideas together
                              </p>
                            </div>
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              Invite Members
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </SidebarSection>
              )}
            </div>
          </ScrollArea>
        </CardContent>

        {/* Private Channel Passcode Dialog */}
        <Dialog open={passcodeDialogOpen} onOpenChange={setPasscodeDialogOpen}>
          <DialogContent className="sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Lock className="h-5 w-5 text-orange-500" />
                <span>Private Channel Access</span>
              </DialogTitle>
              <DialogDescription>
                This channel is private. Enter the passcode to access #{currentPrivatePage?.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="passcode" className="text-sm font-medium">
                  Passcode
                </Label>
                <Input
                  id="passcode"
                  type="password"
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  placeholder="Enter passcode"
                  className="mt-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handlePasscodeSubmit();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setPasscodeDialogOpen(false);
                  setPasscodeInput('');
                  setCurrentPrivatePage(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handlePasscodeSubmit}
                className="bg-gradient-to-r from-primary-500 to-blue-600 hover:from-primary-600 hover:to-blue-700"
              >
                Access Channel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Channel Dialog */}
        <Dialog open={createPageDialogOpen} onOpenChange={setCreatePageDialogOpen}>
          <DialogContent className="sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Hash className="h-5 w-5 text-primary-500" />
                <span>Create Channel</span>
              </DialogTitle>
              <DialogDescription>
                Channels are where your team communicates. They're best when organized around a topic — #marketing, for example.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="channelName" className="text-sm font-medium">
                  Channel Name
                </Label>
                <Input
                  id="channelName"
                  value={newPageData.name}
                  onChange={(e) => setNewPageData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. marketing"
                  className="mt-1"
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="channelDescription" className="text-sm font-medium">
                  Description (optional)
                </Label>
                <Textarea
                  id="channelDescription"
                  value={newPageData.description}
                  onChange={(e) => setNewPageData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What's this channel about?"
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={newPageData.isPrivate}
                  onChange={(e) => setNewPageData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <Label htmlFor="isPrivate" className="text-sm">
                  Make private
                </Label>
              </div>
              {newPageData.isPrivate && (
                <div>
                  <Label htmlFor="passcode" className="text-sm font-medium">
                    Passcode
                  </Label>
                  <Input
                    id="passcode"
                    type="password"
                    value={newPageData.passcode}
                    onChange={(e) => setNewPageData(prev => ({ ...prev, passcode: e.target.value }))}
                    placeholder="Enter passcode for private channel"
                    className="mt-1"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setCreatePageDialogOpen(false);
                  setNewPageData({ name: '', isPrivate: false, passcode: '', description: '' });
                }}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleCreatePage}
                disabled={!newPageData.name.trim()}
                className="bg-gradient-to-r from-primary-500 to-blue-600 hover:from-primary-600 hover:to-blue-700"
              >
                Create Channel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </TooltipProvider>
  );
};