import React from 'react';
import { Paperclip, Mic, MicOff, Send, X, FileText, HardDrive, Upload, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

interface WorkbenchPromptInputProps {
  chatInput: string;
  setChatInput: (val: string) => void;
  onSubmit: () => void;
  isProcessing: boolean;
  // Voice Dictation
  isListening: boolean;
  toggleListening: () => void;
  // File Attachment
  attachedFileName: string;
  onClearAttachment: () => void;
  showAttachMenu: boolean;
  setShowAttachMenu: (show: boolean | ((prev: boolean) => boolean)) => void;
  onTriggerFileUpload: () => void;
  onOpenGenieDrive: () => void;
  onLoadDemoCase?: () => void;
  pinnedFiles?: Array<{ id: string; name: string; size?: number }>;
  onUnpinFile?: (id: string) => void;
  onClearAllPinned?: () => void;
}

export const WorkbenchPromptInput: React.FC<WorkbenchPromptInputProps> = ({
  chatInput,
  setChatInput,
  onSubmit,
  isProcessing,
  isListening,
  toggleListening,
  attachedFileName,
  onClearAttachment,
  showAttachMenu,
  setShowAttachMenu,
  onTriggerFileUpload,
  onOpenGenieDrive,
  onLoadDemoCase,
  pinnedFiles,
  onUnpinFile,
  onClearAllPinned
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (chatInput.trim() || attachedFileName || (pinnedFiles && pinnedFiles.length > 0)) {
        onSubmit();
      }
    }
  };

  // Filter out system files like desktop.ini
  const cleanPinnedFiles = (pinnedFiles || []).filter((p) => {
    const lower = (p.name || '').toLowerCase().trim();
    return (
      lower !== 'desktop.ini' &&
      lower !== 'thumbs.db' &&
      lower !== '.ds_store' &&
      !lower.startsWith('~$') &&
      !lower.startsWith('._')
    );
  });

  return (
    <div className="shrink-0 z-20 p-2 px-3 border-t border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
      {/* Attached & Pinned Files Bar (Compact, Single-Line, Never Overflows Screen) */}
      {(attachedFileName || cleanPinnedFiles.length > 0) && (
        <div className="mb-2 flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs">
          <div className="flex items-center gap-2 min-w-0 overflow-hidden">
            {attachedFileName && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 text-[11px] shrink-0">
                <FileText className="w-3 h-3 text-blue-500" />
                <span className="font-semibold truncate max-w-[160px]">{attachedFileName}</span>
                <button
                  onClick={onClearAttachment}
                  className="hover:text-blue-900 dark:hover:text-white"
                  title="Detach File"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {cleanPinnedFiles.length === 1 && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-[11px] truncate">
                <span>📌</span>
                <span className="font-semibold truncate max-w-[200px]">{cleanPinnedFiles[0].name}</span>
                {onUnpinFile && (
                  <button
                    onClick={() => onUnpinFile(cleanPinnedFiles[0].id)}
                    className="hover:text-amber-900 dark:hover:text-white"
                    title="Unpin"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {cleanPinnedFiles.length > 1 && (
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 text-[11px] truncate">
                <span className="shrink-0">📌</span>
                <span className="font-semibold">
                  {cleanPinnedFiles.length} files in active context
                </span>
                <span className="text-slate-400 text-[10px] hidden sm:inline truncate">
                  (Auto-loaded into reasoning cortex)
                </span>
              </div>
            )}
          </div>

          {cleanPinnedFiles.length > 0 && onClearAllPinned && (
            <button
              onClick={onClearAllPinned}
              className="shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 transition cursor-pointer"
              title="Unpin all files from context"
            >
              Clear All Pinned ({cleanPinnedFiles.length})
            </button>
          )}
        </div>
      )}

      {/* Input Box Container (Streamlined & Compact Top-Down) */}
      <div className="relative flex flex-col rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs focus-within:border-slate-400 dark:focus-within:border-slate-500 focus-within:ring-1 focus-within:ring-slate-400/40 transition">
        <textarea
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question, request a brief or outline, or paste raw notes... (Enter to send, Shift+Enter for newline)"
          rows={2}
          className="w-full resize-y min-h-[60px] sm:min-h-[72px] max-h-[260px] p-2.5 px-3 bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none leading-relaxed overflow-y-auto"
        />

        {/* Action Controls Bar */}
        <div className="flex items-center justify-between px-2 py-1 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/40 dark:bg-slate-900/30 rounded-b-xl">
          {/* Left Actions: Attach, Voice */}
          <div className="flex items-center gap-1 relative">
            {/* Attachment Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAttachMenu((prev) => !prev)}
                className="p-1 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition cursor-pointer"
                title="Attach Document or Record"
              >
                <Paperclip className="w-3.5 h-3.5" />
              </button>

              {showAttachMenu && (
                <div className="absolute left-0 bottom-full mb-2 w-52 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachMenu(false);
                      onTriggerFileUpload();
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                    <span>Upload from Computer...</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachMenu(false);
                      onOpenGenieDrive();
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <HardDrive className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                    <span>Pick from SutraDrive...</span>
                  </button>
                  {onLoadDemoCase && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAttachMenu(false);
                        onLoadDemoCase();
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer font-medium border-t border-slate-100 dark:border-slate-800"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Load Hackathon Demo Case</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Voice Dictation */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-1 rounded-md transition cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700'
              }`}
              title={isListening ? 'Stop Voice Recording' : 'Start Voice Dictation'}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            {/* Quick Demo Case Pill */}
            {onLoadDemoCase && !attachedFileName && (
              <button
                type="button"
                onClick={onLoadDemoCase}
                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-500/20 transition flex items-center gap-1 cursor-pointer"
                title="Load Synthetic De-Identified Demo Case (Zero-PHI)"
              >
                <Sparkles className="w-3 h-3 text-violet-500" />
                <span className="hidden sm:inline">Demo Case</span>
              </button>
            )}
          </div>

          {/* Right Action: Send Button (Exact Sutra OS Shimmery Silver Button) */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 hidden sm:inline">Ctrl + Enter</span>
            <button
              type="button"
              disabled={isProcessing || (!chatInput.trim() && !attachedFileName)}
              onClick={onSubmit}
              className="h-7 px-3.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 sutra-silver-create shimmer-button-energy disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>{isProcessing ? 'Thinking...' : 'Send'}</span>
              <Send className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
