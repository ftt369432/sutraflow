import React from 'react';
import { 
  Lock, Hash, Phone, Video, Pin, Users, FolderOpen, MoreVertical, Settings, 
  Bell, Trash2, MessageSquare, Loader2, Upload, FileText, X, Share2, Plus, 
  CheckSquare
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ScrollArea } from '../../components/ui/ScrollArea';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/Avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/Tooltip';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from '../../components/ui/DropdownMenu';
import { AIChannelParticipant } from '../../features/teams/components/AIChannelParticipant';
import { GenieDriveTree } from '../../components/geniedrive/GenieDriveTree';
import { TasksPage } from '../../components/tasks/TasksPage';
import { Team, Page, Message, Thread } from '../../types/team';

interface ChannelViewProps {
  activeTeam: Team | null;
  activePage: Page;
  activePageMessages: Message[];
  loadingMessages: boolean;
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  postMessage: (pageId: string, content: string, parentId?: string) => Promise<void>;
  pinnedDriveFiles: any[];
  setPinnedDriveFiles: React.Dispatch<React.SetStateAction<any[]>>;
  activeTab: 'chat' | 'files' | 'tasks';
  setActiveTab: (tab: 'chat' | 'files' | 'tasks') => void;
  showGenieDrive: boolean;
  setShowGenieDrive: (show: boolean) => void;
  activeThreadPost: Thread | null;
  setActiveThreadPost: (post: Thread | null) => void;
  threadReplyMessage: string;
  setThreadReplyMessage: (msg: string) => void;
  handleSendThreadReply: (e: React.FormEvent) => void;
  isTyping: boolean;
  isProcessing: boolean;
  localReactions: Record<string, Record<string, number>>;
  toggleReaction: (messageId: string, emoji: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onEditChannel: () => void;
  onDeleteChannel: () => void;
  onGenieDriveSelect: (file: any) => void;
  isDriveProcessing: boolean;
  driveFileInputRef: React.RefObject<HTMLInputElement>;
  onUploadToDrive: (files: FileList | null) => void;
  onCreateFolder: () => void;
  onStartCall?: (video: boolean) => void;
}

export const ChannelView: React.FC<ChannelViewProps> = ({
  activeTeam,
  activePage,
  activePageMessages,
  loadingMessages,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  postMessage,
  pinnedDriveFiles,
  setPinnedDriveFiles,
  activeTab,
  setActiveTab,
  showGenieDrive,
  setShowGenieDrive,
  activeThreadPost,
  setActiveThreadPost,
  threadReplyMessage,
  setThreadReplyMessage,
  handleSendThreadReply,
  isTyping,
  isProcessing,
  localReactions,
  toggleReaction,
  messagesEndRef,
  onEditChannel,
  onDeleteChannel,
  onGenieDriveSelect,
  isDriveProcessing,
  driveFileInputRef,
  onUploadToDrive,
  onCreateFolder,
  onStartCall
}) => {
  const getInitials = (name?: string) => {
    if (!name || typeof name !== 'string') return 'U';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    return parts.map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };
  
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const topLevelMessages = activePageMessages.filter(m => !m.parent_message_id);
  const threadReplies = activeThreadPost ? activePageMessages.filter(m => m.parent_message_id === activeThreadPost.id) : [];

  return (
    <TooltipProvider>
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Chat Header */}
        <div className="h-14 px-6 flex items-center justify-between border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${
              activePage.isPrivate ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'
            }`}>
              {activePage.isPrivate ? <Lock className="h-3.5 w-3.5 text-amber-600" /> : <Hash className="h-3.5 w-3.5 text-blue-600" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-800">{activePage.name}</h2>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-slate-200 text-slate-400 font-medium">
                  {activePage.isPrivate ? 'Private' : 'Public'}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  {activeTeam?.members?.filter(m => m.status === 'online').length || 0} online
                </span>
                <span className="text-[10px] text-slate-400">{activeTeam?.members?.length || 0} members</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {[
              { icon: Phone, tip: 'Voice call', onClick: () => onStartCall?.(false) },
              { icon: Video, tip: 'Video call', onClick: () => onStartCall?.(true) },
              { icon: Pin, tip: 'Pinned', onClick: undefined },
              { icon: Users, tip: 'Members', onClick: undefined },
            ].map(({ icon: Icon, tip, onClick }) => (
              <Tooltip key={tip}>
                <TooltipTrigger asChild>
                  <button 
                    onClick={onClick}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{tip}</TooltipContent>
              </Tooltip>
            ))}
            
            {/* Genie Drive Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => {
                    setShowGenieDrive(!showGenieDrive);
                    if (!showGenieDrive) setActiveThreadPost(null);
                  }}
                  className={`p-2 rounded-lg transition-all ${showGenieDrive ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                >
                  <FolderOpen className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Genie Drive</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-slate-200">
                <DropdownMenuItem className="text-xs" onClick={onEditChannel}>
                  <Settings className="h-3.5 w-3.5 mr-2" />Channel settings
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs"><Bell className="h-3.5 w-3.5 mr-2" />Notifications</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-red-600" onClick={onDeleteChannel}>
                  <Trash2 className="h-3.5 w-3.5 mr-2" />Delete channel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tabs Integration */}
        <div className="bg-slate-50/50 border-b border-slate-100 px-6 pt-2 shrink-0">
          <div className="flex gap-6 -mb-px">
            <button 
              onClick={() => setActiveTab('chat')} 
              className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-all ${activeTab === 'chat' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              <MessageSquare className="h-4 w-4" /> Message Board
            </button>
            <button 
              onClick={() => setActiveTab('files')} 
              className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-all ${activeTab === 'files' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              <FolderOpen className="h-4 w-4" /> Files & Docs
            </button>
            <button 
              onClick={() => setActiveTab('tasks')} 
              className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-all ${activeTab === 'tasks' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              <CheckSquare className="h-4 w-4" /> Project Tasks
            </button>
          </div>
        </div>

        {/* TABS CONTENT */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Messages Area */}
            <div 
              className={`flex-1 overflow-hidden relative ${isDragging ? 'ring-2 ring-blue-400 ring-inset bg-blue-50/30' : ''}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              {isDragging && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-blue-50/80 backdrop-blur-sm pointer-events-none">
                  <div className="text-center space-y-2">
                    <Upload className="h-10 w-10 text-blue-500 mx-auto" />
                    <p className="text-sm font-bold text-blue-600">Drop files to attach</p>
                  </div>
                </div>
              )}
              <ScrollArea className="h-full">
                <div className="px-6 py-4 space-y-3">
                  <AIChannelParticipant team={activeTeam} page={activePage} messages={activePageMessages} postMessage={postMessage} pinnedDriveFiles={pinnedDriveFiles} />

                  {pinnedDriveFiles.length > 0 && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 flex flex-col gap-2 shadow-sm mb-4">
                        <div className="flex items-center gap-1.5">
                          <Pin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          <span className="text-xs font-bold text-blue-700">Pinned Channel Knowledge</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {pinnedDriveFiles.map(file => (
                            <div key={file.id} className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-white border border-blue-200 rounded-md text-[11px] shadow-sm group">
                               <FileText className="h-3 w-3 text-blue-400" />
                               <span className="text-blue-700 font-medium truncate max-w-[150px]">{file.name}</span>
                               <button type="button" onClick={() => setPinnedDriveFiles(prev => prev.filter(f => f.id !== file.id))} className="p-0.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1 bg-slate-50 hover:bg-red-50 rounded">
                                 <X className="h-3 w-3" />
                               </button>
                            </div>
                          ))}
                        </div>
                    </div>
                  )}

                  {loadingMessages ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-xs font-medium">Loading messages...</span>
                      </div>
                    </div>
                  ) : topLevelMessages.length > 0 ? (
                    topLevelMessages.map((message) => {
                      const replyCount = activePageMessages.filter(m => m.parent_message_id === message.id).length;
                      return (
                      <div key={message.id} className="group flex items-start gap-3 px-3 py-2.5 rounded-2xl hover:bg-slate-50/80 transition-all duration-200">
                        <Avatar className="w-8 h-8 mt-0.5 shrink-0">
                          <AvatarImage src={message.user_profile?.avatar_url} />
                          <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-slate-300 to-slate-400 text-white">
                            {getInitials(message.user_profile?.full_name || message.user_profile?.display_name || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-xs font-bold text-slate-800">
                              {message.user_profile?.full_name || message.user_profile?.display_name || 'Team Member'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">{formatMessageTime(message.created_at)}</span>
                          </div>
                          <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {(message.content || '').split('\n').map((line: string, li: number) => {
                              const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
                              if (imgMatch) {
                                return (
                                  <img
                                    key={li}
                                    src={imgMatch[2]}
                                    alt={imgMatch[1]}
                                    className="max-h-52 max-w-xs rounded-xl border border-slate-200 shadow-sm my-1 cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => window.open(imgMatch[2], '_blank')}
                                  />
                                );
                              }
                              const lines = (message.content || '').split('\n');
                              return <span key={li}>{line}{li < lines.length - 1 ? '\n' : ''}</span>;
                            })}
                          </div>
                          
                          {/* Reactions & Actions */}
                          <div className="flex items-center justify-between mt-1.5">
                            <div className="flex items-center gap-1">
                              {['👍', '❤️'].map(emoji => {
                                const count = localReactions[message.id]?.[emoji] || (emoji === '👍' ? 2 : 1);
                                const isReacted = localReactions[message.id]?.[emoji] > 0;
                                return (
                                  <button 
                                    key={emoji}
                                    onClick={() => toggleReaction(message.id, emoji)}
                                    className={`h-6 px-2 text-[10px] font-medium rounded-md border transition-all ${isReacted ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'}`}
                                  >
                                    {emoji} {count}
                                  </button>
                                );
                              })}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-all">
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent side="top" align="start" className="w-56 p-2 rounded-xl shadow-xl border-slate-200">
                                  <div className="grid grid-cols-6 gap-1">
                                    {['😀', '😂', '🚀', '🔥', '✅', '❤️', '👍', '🙌', '👀', '✨', '💡', '🎉'].map(emoji => (
                                      <button
                                        key={emoji}
                                        onClick={() => toggleReaction(message.id, emoji)}
                                        className="h-8 w-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-colors text-lg"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => { setActiveThreadPost(message); setShowGenieDrive(false); }} className="h-6 px-2 text-[10px] font-medium text-slate-500 hover:bg-slate-100 rounded-md transition-all flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" /> {replyCount > 0 ? `${replyCount} Replies` : 'Reply'}
                              </button>
                              <button className="h-6 px-2 text-[10px] font-medium text-slate-500 hover:bg-slate-100 rounded-md transition-all flex items-center gap-1">
                                <Share2 className="h-3 w-3" /> Share
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )})
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-4">
                        <MessageSquare className="h-7 w-7 text-slate-300" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-600 mb-1">No messages yet</h3>
                      <p className="text-xs text-slate-400">Be the first to send a message in #{activePage.name}</p>
                    </div>
                  )}

                  {isTyping && (
                    <div className="flex items-center gap-2 px-3 py-2 text-slate-400">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:75ms]" />
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                      </div>
                      <span className="text-[10px] font-medium">Someone is typing...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>

            {/* Genie Drive Side Panel */}
            {showGenieDrive && (
              <div className="w-64 border-l border-slate-100 bg-slate-50/50 flex flex-col shrink-0 animate-in slide-in-from-right duration-300">
                <div className="h-10 px-3 flex items-center justify-between border-b border-slate-100 shrink-0">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Genie Drive</span>
                  <button onClick={() => setShowGenieDrive(false)} className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <GenieDriveTree onFileSelect={onGenieDriveSelect} className="h-full" />
                </div>
              </div>
            )}

            {/* Thread Side Panel */}
            {activeThreadPost && (!showGenieDrive) && (
              <div className="w-80 border-l border-slate-100 bg-white flex flex-col shrink-0 animate-in slide-in-from-right duration-300 shadow-sm z-10 relative">
                <div className="h-14 px-4 flex items-center justify-between border-b border-slate-100 shrink-0 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">Thread</span>
                    <Badge variant="secondary" className="text-[10px] bg-white shadow-sm text-slate-500 border-slate-200">{threadReplies.length}</Badge>
                  </div>
                  <button onClick={() => setActiveThreadPost(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <ScrollArea className="flex-1">
                  <div className="px-4 py-4 space-y-4">
                    {/* Parent Message */}
                    <div className="pb-4 border-b border-slate-100">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarImage src={activeThreadPost.user_profile?.avatar_url} />
                          <AvatarFallback className="text-[10px] font-bold bg-slate-800 text-white">
                            {getInitials(activeThreadPost.user_profile?.full_name || activeThreadPost.user_profile?.display_name || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-xs font-bold text-slate-800">
                              {activeThreadPost.user_profile?.full_name || activeThreadPost.user_profile?.display_name || 'Team Member'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">{formatMessageTime(activeThreadPost.created_at)}</span>
                          </div>
                          <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{activeThreadPost.content}</div>
                        </div>
                      </div>
                    </div>

                    {/* Replies */}
                    <div className="space-y-4 pt-2">
                      {threadReplies.map(reply => (
                        <div key={reply.id} className="flex items-start gap-3">
                          <Avatar className="w-6 h-6 shrink-0 mt-0.5">
                            <AvatarImage src={reply.user_profile?.avatar_url} />
                            <AvatarFallback className="text-[8px] font-bold bg-slate-300 text-slate-700">
                              {getInitials(reply.user_profile?.full_name || reply.user_profile?.display_name || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 mb-0.5">
                              <span className="text-[11px] font-bold text-slate-800">
                                {reply.user_profile?.full_name || reply.user_profile?.display_name || 'Team Member'}
                              </span>
                              <span className="text-[9px] text-slate-400">{formatMessageTime(reply.created_at)}</span>
                            </div>
                            <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{reply.content}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollArea>

                {/* Thread Reply Input */}
                <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                  <form onSubmit={handleSendThreadReply}>
                    <div className="flex flex-col gap-2">
                      <div className="flex-1 relative">
                        <input 
                          value={threadReplyMessage} 
                          onChange={e => setThreadReplyMessage(e.target.value)} 
                          placeholder="Reply..." 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500/20" 
                        />
                      </div>
                      <div className="flex justify-between items-center">
                         <div className="text-[9px] text-slate-400">Reply to thread</div>
                         <Button type="submit" disabled={!threadReplyMessage.trim() || isProcessing || isTyping} size="sm" className="h-8 bg-slate-800 hover:bg-slate-900 text-white rounded-lg px-3">
                           {isTyping ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Reply'}
                         </Button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'files' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-white border-t border-slate-100">
            {/* Workspace Drive Header */}
            <div className="h-12 px-6 flex items-center justify-between border-b border-slate-50 bg-slate-50/30 shrink-0">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{activeTeam?.name} Joint Assets</span>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => driveFileInputRef.current?.click()} 
                  variant="ghost" 
                  size="sm" 
                  disabled={isDriveProcessing}
                  className="h-8 text-[11px] font-bold text-slate-600 hover:text-blue-600 hover:bg-white"
                >
                  {isDriveProcessing ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Upload className="h-3 w-3 mr-1.5" />}
                  Upload to Team
                </Button>
                <Button 
                  onClick={onCreateFolder}
                  variant="ghost" 
                  size="sm" 
                  disabled={isDriveProcessing}
                  className="h-8 text-[11px] font-bold text-slate-600 hover:text-blue-600 hover:bg-white"
                >
                  <Plus className="h-3 w-3 mr-1.5" />
                  New Folder
                </Button>
                <input 
                  type="file" 
                  ref={driveFileInputRef} 
                  className="hidden" 
                  multiple 
                  onChange={(e) => onUploadToDrive(e.target.files)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <GenieDriveTree 
                teamId={activeTeam?.id}
                teamName={activeTeam?.name}
                onPin={(file) => {
                  setPinnedDriveFiles((prev: any[]) => {
                    if (!prev.find(f => f.id === file.id)) {
                      return [...prev, file];
                    }
                    return prev;
                  });
                }}
              />
            </div>
          </div>
        )}
        
        {activeTab === 'tasks' && (
          <div className="flex-1 overflow-y-auto bg-slate-50/30 relative border-t border-slate-100">
            <div className="absolute inset-0">
              <TasksPage />
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};
