import React from 'react';
import { Mic, ArrowRight, Activity, Paperclip } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { RichPlusMenu } from '../components/chat/RichPlusMenu';
import { ChatModelSelector } from '../components/chat/ChatModelSelector';
import { HQWorkflowStatus } from '../components/hq/HQWorkflowStatus';
import { HQAttachmentStatus } from '../components/hq/HQAttachmentStatus';
import { AIAssistant } from '../types/ai';

interface HQCommandFooterProps {
  hqChatInput: string;
  setHqChatInput: (val: string) => void;
  activeMission: any;
  activeMissionId: string | null;
  handleSendHqMessage: (customMessage?: string) => void;
  isRecording: boolean;
  setIsRecording: (val: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUploadClick: () => void;
  pinItem: (missionId: string, item: any) => void;
  unpinItem: (missionId: string, itemId: string) => void;
  setActiveViewportFile: (id: string | null) => void;
  isSending?: boolean;
  activeAssistant?: AIAssistant;
}

const HQCommandFooter: React.FC<HQCommandFooterProps> = ({
  hqChatInput,
  setHqChatInput,
  activeMission,
  activeMissionId,
  handleSendHqMessage,
  isRecording,
  setIsRecording,
  fileInputRef,
  handleFileChange,
  handleUploadClick,
  pinItem,
  unpinItem,
  setActiveViewportFile,
  isSending,
  activeAssistant
}) => {
  const quickActions = activeAssistant?.quickActions || [];

  const renderIcon = (iconName?: string) => {
    if (!iconName) return <LucideIcons.Zap className="h-3.5 w-3.5 text-blue-500" />;
    
    // Convert kebab-case (e.g. file-text) to PascalCase (e.g. FileText)
    const formattedName = iconName
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');

    const IconComponent = (LucideIcons as any)[formattedName] || (LucideIcons as any)[iconName];
    if (IconComponent) {
      return <IconComponent className="h-3.5 w-3.5" />;
    }
    return <LucideIcons.Zap className="h-3.5 w-3.5 text-blue-500" />;
  };

  return (
    <footer className="px-8 py-4 border-t border-slate-100 dark:border-white/[0.03] shrink-0 bg-white dark:bg-[#0a0a0f] shadow-[0_-1px_3px_rgba(0,0,0,0.02)] transition-colors duration-500">
      <div className="max-w-4xl mx-auto">
        <div
          className="relative group animate-in slide-in-from-bottom-4 duration-500"
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('ring-4', 'ring-blue-500/5', 'scale-[1.01]');
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('ring-4', 'ring-blue-500/5', 'scale-[1.01]');
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('ring-4', 'ring-blue-500/5', 'scale-[1.01]');
            const data = e.dataTransfer.getData('text/plain');
            if (!data) return;

            // 1. Try parsing JSON payload from tree drag
            try {
              const parsed = JSON.parse(data);
              if (parsed.id) {
                if (activeMissionId) {
                  pinItem(activeMissionId, { 
                    id: parsed.path || parsed.id, 
                    type: (parsed.isFolder || parsed.type === 'AIDriveFolder') ? 'folder' : 'file', 
                    name: parsed.name || (parsed.path || parsed.id).split(/[\\/]/).pop() 
                  });
                }
                return;
              }
            } catch {}

            // 2. Safe parsing for legacy or custom prefixed strings without splitting on Windows drive colons (e.g. E:\)
            if (data.startsWith('[AIDriveFile]:')) {
              const raw = data.substring('[AIDriveFile]:'.length);
              const lastColon = raw.lastIndexOf(':');
              const fileId = lastColon > -1 ? raw.substring(0, lastColon) : raw;
              const fileName = lastColon > -1 ? raw.substring(lastColon + 1) : (fileId.split(/[\\/]/).pop() || fileId);
              if (activeMissionId) pinItem(activeMissionId, { id: fileId, type: 'file', name: fileName });
            }
          }}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />

          {/* Controls Row ABOVE Chatbox */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <RichPlusMenu 
                onUploadClick={handleUploadClick} 
                triggerClassName="h-8 w-8 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 dark:hover:border-blue-500/30 transition-all shadow-sm" 
            />

            <ChatModelSelector />

            {activeMission && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/[0.05] rounded-xl transition-colors">
                <div className="flex items-center gap-1 opacity-50">
                  <Activity className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:inline">Workflow</span>
                </div>
                <HQWorkflowStatus
                  tasks={Object.values(activeMission.manifestState?.tasks || {})}
                  onTaskClick={(id) => setActiveViewportFile(id)}
                />
              </div>
            )}

            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/[0.05] rounded-xl transition-colors">
              <div className="flex items-center gap-1 opacity-50">
                <Paperclip className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:inline">Pinned</span>
              </div>
              <HQAttachmentStatus
                items={(activeMission?.pinnedItems || [])}
                onUnpin={(id) => unpinItem(activeMission!.id, id)}
                onItemClick={(id) => setActiveViewportFile(id)}
              />
            </div>
          </div>

          {/* 🌟 Quick Actions Dynamic Row */}
          {quickActions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-2 animate-in fade-in duration-300">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleSendHqMessage(action.prompt)}
                  disabled={isSending}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-50/85 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.04] text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-xl transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]",
                    "hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white hover:border-blue-600 dark:hover:border-blue-600 hover:shadow-md hover:shadow-blue-500/10",
                    isSending && "opacity-50 cursor-not-allowed pointer-events-none"
                  )}
                >
                  {renderIcon(action.icon)}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          )}

          <div className="relative">
            <textarea
              value={hqChatInput}
              onChange={(e) => setHqChatInput(e.target.value)}
              disabled={isSending}
              placeholder={isSending ? "Analyzing parameters and initializing agents..." : (activeMission ? `Give instructions to ${activeMission.leadAgent || 'the Assistant'} for "${activeMission.goal || 'Mission'}"...` : "Select a mission or agent to begin commands...")}
              className={cn(
                "w-full h-20 px-6 py-5 bg-white dark:bg-[#12121a] rounded-[2rem] border border-slate-200 dark:border-white/[0.05] text-sm focus:ring-4 focus:ring-blue-500/10 transition-all outline-none resize-none font-medium placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-xl dark:shadow-none",
                isSending && "opacity-50 cursor-wait bg-slate-50 dark:bg-slate-900/50"
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendHqMessage();
                }
              }}
            />

            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={cn(
                  "h-12 w-12 flex items-center justify-center rounded-[1.25rem] transition-all",
                  isRecording ? "bg-red-500 text-white animate-pulse" : "text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Mic className="h-5 w-5" />
              </button>
              <Button
                size="icon"
                onClick={() => handleSendHqMessage()}
                className={cn(
                    "h-12 w-12 text-white hover:opacity-90 rounded-[1.25rem] shadow-lg transition-all disabled:opacity-50",
                    "bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800"
                )}
                disabled={!hqChatInput.trim() || isSending}
              >
                {isSending ? (
                  <Activity className="h-6 w-6 animate-spin" />
                ) : (
                  <ArrowRight className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default HQCommandFooter;
