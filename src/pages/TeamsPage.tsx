/**
 * 🚀 GenieFlow Teams — Premium Collaboration Interface v3.5
 * 
 * Re-architected: Decomposed into domain-specific components
 * Location: src/pages/teams/
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTeam } from '../contexts/TeamContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { supabase } from '../lib/supabaseClient';
import { aiDriveService } from '../services/drive/aiDriveService';
import type { Thread } from '../types/team';

// Sub-components
import { TeamSidebar } from './teams/TeamSidebar';
import { ChannelView } from './teams/ChannelView';
import { MessageComposer } from './teams/MessageComposer';
import { TeamDialogs } from './teams/TeamDialogs';
import { TeamsPageSkeleton, ErrorState, EmptyState } from './teams/TeamsUIStates';
import { MeetingRoom } from '../features/teams/components/MeetingRoom';

const TeamsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const {
    teams, activeTeam, setActiveTeam, activePage, setActivePage,
    activePageMessages, postMessage, createPage, updatePage, deletePage,
    createTeam, updateTeam, deleteTeam, 
    loading: loadingTeams, loadingMessages, refreshTeams, error: teamError
  } = useTeam();

  // ── State ──
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'files' | 'tasks'>('chat');
  const [pinnedDriveFiles, setPinnedDriveFiles] = useState<any[]>([]);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const driveFileInputRef = useRef<HTMLInputElement>(null);

  // Dialog states
  const [createTeamDialogOpen, setCreateTeamDialogOpen] = useState(false);
  const [createChannelDialogOpen, setCreateChannelDialogOpen] = useState(false);
  const [editTeamDialogOpen, setEditTeamDialogOpen] = useState(false);
  const [editChannelDialogOpen, setEditChannelDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'team' | 'channel'; id: string; name: string } | null>(null);
  const [editingTeam, setEditingTeam] = useState<{ id: string; name: string; description: string } | null>(null);
  const [editingChannel, setEditingChannel] = useState<{ id: string; name: string; description: string; isPrivate: boolean } | null>(null);
  const [showGenieDrive, setShowGenieDrive] = useState(false);
  
  // File & Attachments
  const [attachments, setAttachments] = useState<{ name: string; type: string; size: number; url?: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isDriveProcessing, setIsDriveProcessing] = useState(false);

  // Thread & Reactions
  const [activeThreadPost, setActiveThreadPost] = useState<Thread | null>(null);
  const [threadReplyMessage, setThreadReplyMessage] = useState('');
  const [localReactions, setLocalReactions] = useState<Record<string, Record<string, number>>>({});

  // Call / Huddles state
  const [activeCall, setActiveCall] = useState<{ roomName: string; isVideo: boolean } | null>(null);

  // ── Auto-scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activePageMessages, activePage]);

  // ── Auto-select first team ──
  useEffect(() => {
    if (!loadingTeams && teams.length > 0 && !activeTeam) {
      setActiveTeam(teams[0]);
    }
  }, [teams, activeTeam, setActiveTeam, loadingTeams]);

  // ── Handlers ──
  const toggleReaction = (messageId: string, emoji: string) => {
    setLocalReactions(prev => {
      const current = prev[messageId] || {};
      const count = current[emoji] || 0;
      return { ...prev, [messageId]: { ...current, [emoji]: count > 0 ? 0 : 1 } };
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && attachments.length === 0) || !activePage || !user) return;
    try {
      setIsTyping(true);
      let messageContent = newMessage.trim();
      if (attachments.length > 0) {
        const attachmentLines = attachments.map(a => 
          a.type?.startsWith('image/') && a.url ? `![${a.name}](${a.url})` : `📎 ${a.name}`
        ).join('\n');
        messageContent += (messageContent ? '\n\n' : '') + attachmentLines;
      }
      await postMessage(activePage.id, messageContent);
      setNewMessage('');
      setAttachments([]);
      messageInputRef.current?.focus();
    } catch (err) {
      toast.error('Failed to send message.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendThreadReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadReplyMessage.trim() || !activePage || !user || !activeThreadPost) return;
    try {
      setIsTyping(true);
      await postMessage(activePage.id, threadReplyMessage.trim(), activeThreadPost.id);
      setThreadReplyMessage('');
    } catch (err) {
      toast.error('Failed to send reply.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleCreateTeamAction = async (
    teamName: string, 
    description: string = '', 
    identityMode: 'real_name' | 'shield' = 'real_name',
    shieldName?: string
  ) => {
    try {
      setIsProcessing(true);
      await createTeam({ name: teamName.trim(), description: description.trim() });
      
      if (user) {
        const profileUpdates = identityMode === 'shield' && shieldName
          ? { shield_name: shieldName, visibility_level: 'shield' }
          : { visibility_level: 'real_name' };
          
        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', user.id);

        if (profileError) {
          console.error('Failed to save shield identity settings to profile:', profileError);
        } else if (identityMode === 'shield') {
          toast.success('Shield identity activated! 🛡️');
        }
      }

      toast.success('Team created successfully! 🎉');
      setCreateTeamDialogOpen(false);
    } catch (err) {
      toast.error('Failed to create team.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditTeamAction = async () => {
    if (!editingTeam) return;
    try {
      setIsProcessing(true);
      await updateTeam(editingTeam.id, { name: editingTeam.name.trim(), description: editingTeam.description.trim() });
      toast.success('Workspace updated! ✏️');
      setEditTeamDialogOpen(false);
      setEditingTeam(null);
      await refreshTeams();
    } catch (err) {
      toast.error('Failed to update workspace.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateChannelAction = async (channelData: { name: string; description: string; isPrivate: boolean }) => {
    if (!activeTeam) return;
    try {
      setIsProcessing(true);
      await createPage(activeTeam.id, channelData);
      toast.success('Channel created! 🚀');
      setCreateChannelDialogOpen(false);
    } catch (err) {
      toast.error('Failed to create channel.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditChannelAction = async () => {
    if (!editingChannel) return;
    try {
      setIsProcessing(true);
      await updatePage(editingChannel.id, {
        name: editingChannel.name.trim(),
        description: editingChannel.description.trim(),
        isPrivate: editingChannel.isPrivate
      });
      toast.success('Channel updated! ✏️');
      setEditChannelDialogOpen(false);
      setEditingChannel(null);
      await refreshTeams();
    } catch (err) {
      toast.error('Failed to update channel.');
    } finally {
      setIsProcessing(false);
    }
  };

  const onDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsProcessing(true);
      if (deleteTarget.type === 'team') await deleteTeam(deleteTarget.id);
      else await deletePage(deleteTarget.id);
      toast.success(`${deleteTarget.type === 'team' ? 'Workspace' : 'Channel'} deleted! 🗑️`);
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(`Failed to delete ${deleteTarget.type}.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    const newAttachments = Array.from(files).map(file => ({
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file)
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
    toast.success(`${files.length} file(s) attached 📎`);
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length === 0) return;
    e.preventDefault();
    for (const file of imageFiles) {
      const ext = file.type.split('/')[1] || 'png';
      const fileName = `paste-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const storagePath = `teams/${user?.id || 'anon'}/${fileName}`;
      try {
        const { error: uploadError } = await supabase.storage.from('ai-drive').upload(storagePath, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('ai-drive').getPublicUrl(storagePath);
        setAttachments(prev => [...prev, { name: fileName, type: file.type, size: file.size, url: urlData?.publicUrl }]);
        toast.success('📋 Screenshot pasted!');
      } catch (err) {
        setAttachments(prev => [...prev, { name: fileName, type: file.type, size: file.size, url: URL.createObjectURL(file) }]);
        toast.success('📋 Image attached (local preview)');
      }
    }
  };

  const handleGenieDriveSelect = (file: any) => {
    setAttachments(prev => [...prev, {
      name: file.name,
      type: file.ai_metadata?.document_type || 'document',
      size: file.size_bytes || 0
    }]);
    toast.success(`📂 ${file.name} attached from Genie Drive`);
    setShowGenieDrive(false);
  };

  const onUploadToDrive = async (files: FileList | null) => {
    if (files && activeTeam) {
      setIsDriveProcessing(true);
      try {
        for (const file of Array.from(files)) {
          await aiDriveService.uploadFile(file, null, { teamId: activeTeam.id });
        }
        toast.success(`${files.length} file(s) uploaded to workspace`);
      } catch (err) {
        toast.error('Upload failed');
      } finally {
        setIsDriveProcessing(false);
      }
    }
  };

  const onCreateFolder = async () => {
    const name = window.prompt("Enter folder name:");
    if (name && activeTeam) {
      try {
        setIsDriveProcessing(true);
        await aiDriveService.createFolder(name, null, { teamId: activeTeam.id });
        toast.success('Folder created in workspace');
      } catch (err) {
        toast.error('Failed to create folder');
      } finally {
        setIsDriveProcessing(false);
      }
    }
  };

  // ── Render Logic ──
  if (loadingTeams) return <TeamsPageSkeleton />;
  if (teamError) return <ErrorState error={teamError} onRetry={refreshTeams} />;

  const sanitizedTeams = (teams || []).map((t, idx) => ({
    ...t,
    id: t?.id || `team-${idx}`,
    name: t?.name || 'Workspace',
    description: t?.description || '',
    pages: (t?.pages || []).map((p, pIdx) => ({
      ...p,
      id: p?.id || `page-${pIdx}`,
      name: p?.name || 'general',
      description: p?.description || '',
      unread: typeof p?.unread === 'number' ? p.unread : 0,
      isPrivate: p?.isPrivate || false
    })),
    members: t?.members || []
  }));

  return (
    <div className="flex h-full w-full overflow-hidden bg-white text-slate-900 font-sans">
      <TeamSidebar 
        teams={sanitizedTeams}
        activeTeam={activeTeam}
        setActiveTeam={setActiveTeam}
        activePage={activePage}
        setActivePage={setActivePage}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        onCreateTeam={() => setCreateTeamDialogOpen(true)}
        onEditTeam={(t) => { setEditingTeam(t); setEditTeamDialogOpen(true); }}
        onDeleteTeam={(t) => { setDeleteTarget(t); setDeleteConfirmOpen(true); }}
        onCreateChannel={() => setCreateChannelDialogOpen(true)}
        onEditChannel={(c) => { setEditingChannel(c); setEditChannelDialogOpen(true); }}
        onDeleteChannel={(t) => { setDeleteTarget(t); setDeleteConfirmOpen(true); }}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {activePage ? (
          <>
            <ChannelView 
              activeTeam={activeTeam}
              activePage={activePage}
              activePageMessages={activePageMessages}
              loadingMessages={loadingMessages}
              isDragging={isDragging}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e.dataTransfer.files); }}
              postMessage={postMessage}
              pinnedDriveFiles={pinnedDriveFiles}
              setPinnedDriveFiles={setPinnedDriveFiles}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              showGenieDrive={showGenieDrive}
              setShowGenieDrive={setShowGenieDrive}
              activeThreadPost={activeThreadPost}
              setActiveThreadPost={setActiveThreadPost}
              threadReplyMessage={threadReplyMessage}
              setThreadReplyMessage={setThreadReplyMessage}
              handleSendThreadReply={handleSendThreadReply}
              isTyping={isTyping}
              isProcessing={isProcessing}
              localReactions={localReactions}
              toggleReaction={toggleReaction}
              messagesEndRef={messagesEndRef}
              onEditChannel={() => { setEditingChannel({ id: activePage.id, name: activePage.name, description: activePage.description || '', isPrivate: activePage.isPrivate || false }); setEditChannelDialogOpen(true); }}
              onDeleteChannel={() => { setDeleteTarget({ type: 'channel', id: activePage.id, name: activePage.name }); setDeleteConfirmOpen(true); }}
              onGenieDriveSelect={handleGenieDriveSelect}
              isDriveProcessing={isDriveProcessing}
              driveFileInputRef={driveFileInputRef}
              onUploadToDrive={onUploadToDrive}
              onCreateFolder={onCreateFolder}
              onStartCall={(video) => setActiveCall({ roomName: activePage.id, isVideo: video })}
            />
            {activeTab === 'chat' && (
              <MessageComposer 
                activePage={activePage}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                attachments={attachments}
                onRemoveAttachment={(i) => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                onSendMessage={handleSendMessage}
                onPaste={handlePaste}
                onFileUpload={handleFileUpload}
                onShowGenieDrive={() => setShowGenieDrive(true)}
                isProcessing={isProcessing}
                isTyping={isTyping}
                loadingMessages={loadingMessages}
                messageInputRef={messageInputRef}
                fileInputRef={fileInputRef}
              />
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            {teams.length === 0 ? (
              <EmptyState onCreateTeam={() => setCreateTeamDialogOpen(true)} />
            ) : (
              <EmptyState onCreateTeam={() => setCreateChannelDialogOpen(true)} />
            )}
          </div>
        )}
      </div>

      <TeamDialogs 
        createTeamDialogOpen={createTeamDialogOpen}
        setCreateTeamDialogOpen={setCreateTeamDialogOpen}
        onCreateTeam={handleCreateTeamAction}
        editTeamDialogOpen={editTeamDialogOpen}
        setEditTeamDialogOpen={setEditTeamDialogOpen}
        editingTeam={editingTeam}
        setEditingTeam={setEditingTeam}
        handleEditTeam={handleEditTeamAction}
        createChannelDialogOpen={createChannelDialogOpen}
        setCreateChannelDialogOpen={setCreateChannelDialogOpen}
        onCreateChannel={handleCreateChannelAction}
        editChannelDialogOpen={editChannelDialogOpen}
        setEditChannelDialogOpen={setEditChannelDialogOpen}
        editingChannel={editingChannel}
        setEditingChannel={setEditingChannel}
        handleEditChannel={handleEditChannelAction}
        deleteConfirmOpen={deleteConfirmOpen}
        setDeleteConfirmOpen={setDeleteConfirmOpen}
        deleteTarget={deleteTarget}
        onDeleteConfirm={onDeleteConfirm}
        showGenieDrive={showGenieDrive}
        setShowGenieDrive={setShowGenieDrive}
        onGenieDriveSelect={handleGenieDriveSelect}
        isProcessing={isProcessing}
      />

      {activeCall && (
        <MeetingRoom
          roomName={activeCall.roomName}
          isVideo={activeCall.isVideo}
          onClose={() => setActiveCall(null)}
        />
      )}
    </div>
  );
};

export default TeamsPage;