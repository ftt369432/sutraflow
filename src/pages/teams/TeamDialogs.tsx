import React, { useState } from 'react';
import { 
  Sparkles, Edit3, Loader2, Hash, Smile, AlertTriangle, Trash2, FolderOpen
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Textarea } from '../../components/ui/Textarea';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle 
} from '../../components/ui/Dialog';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger 
} from '../../components/ui/DropdownMenu';
import { GenieDriveTree } from '../../components/geniedrive/GenieDriveTree';

interface TeamDialogsProps {
  // Create Team
  createTeamDialogOpen: boolean;
  setCreateTeamDialogOpen: (open: boolean) => void;
  onCreateTeam: (name: string, description: string, identityMode: 'real_name' | 'shield', shieldName?: string) => void;
  
  // Edit Team
  editTeamDialogOpen: boolean;
  setEditTeamDialogOpen: (open: boolean) => void;
  editingTeam: { id: string; name: string; description: string } | null;
  setEditingTeam: (team: { id: string; name: string; description: string } | null) => void;
  handleEditTeam: () => void;
  
  // Create Channel
  createChannelDialogOpen: boolean;
  setCreateChannelDialogOpen: (open: boolean) => void;
  onCreateChannel: (data: { name: string; description: string; isPrivate: boolean }) => void;
  
  // Edit Channel
  editChannelDialogOpen: boolean;
  setEditChannelDialogOpen: (open: boolean) => void;
  editingChannel: { id: string; name: string; description: string; isPrivate: boolean } | null;
  setEditingChannel: (channel: { id: string; name: string; description: string; isPrivate: boolean } | null) => void;
  handleEditChannel: () => void;
  
  // Delete Confirmation
  deleteConfirmOpen: boolean;
  setDeleteConfirmOpen: (open: boolean) => void;
  deleteTarget: { type: 'team' | 'channel'; id: string; name: string } | null;
  onDeleteConfirm: () => void;
  
  // Genie Drive
  showGenieDrive: boolean;
  setShowGenieDrive: (show: boolean) => void;
  onGenieDriveSelect: (file: any) => void;
  
  isProcessing: boolean;
}

export const TeamDialogs: React.FC<TeamDialogsProps> = ({
  createTeamDialogOpen, setCreateTeamDialogOpen, onCreateTeam,
  editTeamDialogOpen, setEditTeamDialogOpen, editingTeam, setEditingTeam, handleEditTeam,
  createChannelDialogOpen, setCreateChannelDialogOpen, onCreateChannel,
  editChannelDialogOpen, setEditChannelDialogOpen, editingChannel, setEditingChannel, handleEditChannel,
  deleteConfirmOpen, setDeleteConfirmOpen, deleteTarget, onDeleteConfirm,
  showGenieDrive, setShowGenieDrive, onGenieDriveSelect,
  isProcessing
}) => {
  const [identityMode, setIdentityMode] = useState<'real_name' | 'shield'>('real_name');
  const EMOJI_LIST = ['😀', '🔒', '🚀', '🔥', '✅', '📣', '💡', '📊', '💼', '📅', '🛠️', '✨'];

  return (
    <>
      {/* Create Team */}
      <Dialog open={createTeamDialogOpen} onOpenChange={setCreateTeamDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-slate-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800"><Sparkles className="h-5 w-5 text-blue-500" />Create New Team</DialogTitle>
            <DialogDescription className="text-slate-500">A team is your collaboration hub.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            onCreateTeam(
              fd.get('teamName') as string, 
              fd.get('teamDesc') as string,
              identityMode,
              fd.get('shieldName') as string || undefined
            );
          }}>
            <div className="space-y-3 py-4">
              <div>
                <Label htmlFor="teamName" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Team Name</Label>
                <Input id="teamName" name="teamName" placeholder="e.g. Marketing Team" className="mt-1.5 rounded-xl" autoFocus required />
              </div>
              <div>
                <Label htmlFor="teamDesc" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description (optional)</Label>
                <Input id="teamDesc" name="teamDesc" placeholder="What's this team about?" className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="identityMode" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Join Profile Type</Label>
                <select 
                  id="identityMode" 
                  name="identityMode"
                  value={identityMode}
                  onChange={(e) => setIdentityMode(e.target.value as 'real_name' | 'shield')}
                  className="rounded-xl border border-slate-200 p-2.5 bg-white text-sm w-full mt-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="real_name">Real Name (Public Profile)</option>
                  <option value="shield">Shield Identity (Anonymous Proxy)</option>
                </select>
              </div>
              {identityMode === 'shield' && (
                <div>
                  <Label htmlFor="shieldName" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Shield Name (Proxy Name)</Label>
                  <Input id="shieldName" name="shieldName" placeholder="e.g. Agent Alpha" className="mt-1.5 rounded-xl" required />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateTeamDialogOpen(false)} disabled={isProcessing} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={isProcessing} className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl">
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Team
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Team */}
      <Dialog open={editTeamDialogOpen} onOpenChange={setEditTeamDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-slate-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800"><Edit3 className="h-5 w-5 text-blue-500" />Edit Workspace</DialogTitle>
          </DialogHeader>
          {editingTeam && (
            <div className="space-y-3 py-4">
              <div>
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Name</Label>
                <Input value={editingTeam.name} onChange={(e) => setEditingTeam({...editingTeam, name: e.target.value})} className="mt-1.5 rounded-xl" autoFocus />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</Label>
                <Input value={editingTeam.description} onChange={(e) => setEditingTeam({...editingTeam, description: e.target.value})} className="mt-1.5 rounded-xl" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setEditTeamDialogOpen(false); setEditingTeam(null); }} disabled={isProcessing} className="rounded-xl">Cancel</Button>
            <Button onClick={handleEditTeam} disabled={isProcessing} className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl">
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Channel */}
      <Dialog open={createChannelDialogOpen} onOpenChange={setCreateChannelDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-slate-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800"><Hash className="h-5 w-5 text-blue-500" />Create Channel</DialogTitle>
            <DialogDescription className="text-slate-500">Organize conversations by topic.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            onCreateChannel({
              name: (fd.get('channelName') as string)?.trim(),
              description: (fd.get('channelDescription') as string)?.trim(),
              isPrivate: fd.get('isPrivate') === 'on'
            });
          }}>
            <div className="space-y-3 py-4">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label htmlFor="channelName" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Channel Name</Label>
                  <div className="relative mt-1.5 ">
                    <Input id="channelName" name="channelName" placeholder="e.g. marketing" className="rounded-xl pl-10 h-10" autoFocus required />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Hash className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" type="button" className="h-10 w-10 p-0 rounded-xl bg-slate-50 border-slate-200">
                      <Smile className="h-4 w-4 text-slate-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="center" className="w-56 p-2 rounded-xl shadow-xl border-slate-200 bg-white/95 backdrop-blur-md">
                    <div className="grid grid-cols-6 gap-1">
                      {EMOJI_LIST.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('channelName') as HTMLInputElement;
                            if (input) {
                              input.value = emoji + (input.value ? '-' + input.value : '');
                            }
                          }}
                          className="h-8 w-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-colors text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div>
                <Label htmlFor="channelDescription" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</Label>
                <Textarea id="channelDescription" name="channelDescription" placeholder="What's this channel about?" className="mt-1.5 rounded-xl" rows={2} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isPrivate" name="isPrivate" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <Label htmlFor="isPrivate" className="text-xs text-slate-600">Make private</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateChannelDialogOpen(false)} disabled={isProcessing} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={isProcessing} className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl">
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Channel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Channel */}
      <Dialog open={editChannelDialogOpen} onOpenChange={setEditChannelDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-slate-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800"><Edit3 className="h-5 w-5 text-blue-500" />Edit Channel</DialogTitle>
          </DialogHeader>
          {editingChannel && (
            <div className="space-y-3 py-4">
              <div>
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Name</Label>
                <Input value={editingChannel.name} onChange={(e) => setEditingChannel({...editingChannel, name: e.target.value})} className="mt-1.5 rounded-xl" autoFocus />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</Label>
                <Textarea value={editingChannel.description} onChange={(e) => setEditingChannel({...editingChannel, description: e.target.value})} className="mt-1.5 rounded-xl" rows={2} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={editingChannel.isPrivate} onChange={(e) => setEditingChannel({...editingChannel, isPrivate: e.target.checked})} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <Label className="text-xs text-slate-600">Private channel</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setEditChannelDialogOpen(false); setEditingChannel(null); }} disabled={isProcessing} className="rounded-xl">Cancel</Button>
            <Button onClick={handleEditChannel} disabled={isProcessing} className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl">
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl border-slate-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete {deleteTarget?.type === 'team' ? 'Workspace' : 'Channel'}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Are you sure you want to delete <strong className="text-slate-700">"{deleteTarget?.name}"</strong>? 
              {deleteTarget?.type === 'team' 
                ? ' This will delete all channels and messages within this workspace.' 
                : ' All messages in this channel will be permanently deleted.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => { setDeleteConfirmOpen(false); }} disabled={isProcessing} className="rounded-xl">Cancel</Button>
            <Button 
              onClick={onDeleteConfirm} 
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Genie Drive Dialog */}
      <Dialog open={showGenieDrive} onOpenChange={setShowGenieDrive}>
        <DialogContent className="sm:max-w-xl max-h-[80vh] flex flex-col p-0 rounded-2xl border-slate-200 shadow-2xl overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <FolderOpen className="h-5 w-5 text-blue-500" />
              Select from AI Drive
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Choose a file from your personal drive to share in this workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden min-h-[400px]">
            <GenieDriveTree 
              onFileSelect={onGenieDriveSelect}
              className="px-4"
            />
          </div>
          <DialogFooter className="p-6 pt-2 border-t border-slate-50">
            <Button variant="outline" onClick={() => setShowGenieDrive(false)} className="rounded-xl">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
