import React from 'react';
import { 
  Paperclip, FolderOpen, Smile, Send, Loader2, X, FileText, AtSign
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/Tooltip';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger 
} from '../../components/ui/DropdownMenu';
import { Page } from '../../types/team';

interface Attachment {
  name: string;
  type: string;
  size: number;
  url?: string;
}

interface MessageComposerProps {
  activePage: Page;
  newMessage: string;
  setNewMessage: (value: string) => void;
  attachments: Attachment[];
  onRemoveAttachment: (index: number) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onFileUpload: (files: FileList | null) => void;
  onShowGenieDrive: () => void;
  isProcessing: boolean;
  isTyping: boolean;
  loadingMessages: boolean;
  messageInputRef: React.RefObject<HTMLInputElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  activePage,
  newMessage,
  setNewMessage,
  attachments,
  onRemoveAttachment,
  onSendMessage,
  onPaste,
  onFileUpload,
  onShowGenieDrive,
  isProcessing,
  isTyping,
  loadingMessages,
  messageInputRef,
  fileInputRef,
}) => {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const EMOJI_LIST = ['😀', '😂', '🚀', '🔥', '✅', '❤️', '👍', '🙌', '👀', '✨', '💡', '🎉'];

  return (
    <div className="border-t border-slate-100 bg-white px-6 py-3 shrink-0">
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((att, i) => (
            <div key={i} className="relative group">
              {att.type?.startsWith('image/') && att.url ? (
                <div className="relative">
                  <img src={att.url} alt={att.name} className="h-16 w-auto rounded-lg border border-slate-200 shadow-sm object-cover" />
                  <button
                    onClick={() => onRemoveAttachment(i)}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                  <FileText className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="truncate max-w-[120px]">{att.name}</span>
                  <span className="text-[9px] text-slate-400">{formatSize(att.size)}</span>
                  <button onClick={() => onRemoveAttachment(i)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={onSendMessage}>
        {/* Formatting toolbar */}
        <div className="flex items-center gap-0.5 mb-2">
          <button type="button" className="h-6 w-7 flex items-center justify-center text-[11px] font-bold text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-all"><strong>B</strong></button>
          <button type="button" className="h-6 w-7 flex items-center justify-center text-[11px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-all"><em>I</em></button>
          <button type="button" className="h-6 w-7 flex items-center justify-center text-[10px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-all font-mono">{'</>'}</button>
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="h-6 w-7 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-all">
                <AtSign className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Mention (@)</TooltipContent>
          </Tooltip>
        </div>
        
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Input
              ref={messageInputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSendMessage(e as any);
                }
              }}
              onPaste={onPaste}
              placeholder={`Message #${activePage.name}...`}
              disabled={isTyping || loadingMessages}
              className="h-10 bg-slate-50 border-slate-200 rounded-xl text-sm pr-24 focus:ring-1 focus:ring-blue-500/20 focus:border-blue-300 placeholder:text-slate-400"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              {/* Upload button */}
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => onFileUpload(e.target.files)} />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/50 transition-all">
                <Paperclip className="h-3.5 w-3.5" />
              </button>
              {/* Genie Drive quick attach */}
              <button type="button" onClick={onShowGenieDrive} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/50 transition-all">
                <FolderOpen className="h-3.5 w-3.5" />
              </button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/50 transition-all">
                    <Smile className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="end" className="w-56 p-2 rounded-xl shadow-xl border-slate-200">
                  <div className="grid grid-cols-6 gap-1">
                    {EMOJI_LIST.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setNewMessage(newMessage + emoji);
                          messageInputRef.current?.focus();
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
          </div>
          <Button
            type="submit"
            disabled={isProcessing || isTyping || loadingMessages || (!newMessage.trim() && attachments.length === 0)}
            className="h-10 bg-slate-800 hover:bg-slate-900 text-white rounded-xl px-4 shadow-sm hover:shadow-md transition-all disabled:opacity-40"
          >
            {isProcessing || isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
};
