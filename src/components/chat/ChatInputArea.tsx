import React from 'react';
import { BookOpen, Mic, Send, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { RichPlusMenu } from '@/components/chat/RichPlusMenu';
import { useUserStore } from '@/stores/userStore';
import { toast } from 'sonner';
import { ChatModelSelector } from '@/components/chat/ChatModelSelector';

export interface ChatInputAreaProps {
  renderPinnedFiles: () => React.ReactNode;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUploadFile: () => void;
  showMentionList: boolean;
  filteredMentions: any[];
  mentionListIndex: number;
  setMentionListIndex: (index: number) => void;
  handleSelectMention: (doc: any) => void;
  chatInputRef: React.RefObject<HTMLTextAreaElement>;
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  handleSendMessage: () => void;
  uploadedFilesCount: number;
  runInBackground: boolean;
  setRunInBackground: (val: boolean) => void;
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  renderPinnedFiles,
  fileInputRef,
  handleFileInputChange,
  handleUploadFile,
  showMentionList,
  filteredMentions,
  mentionListIndex,
  setMentionListIndex,
  handleSelectMention,
  chatInputRef,
  input,
  handleInputChange,
  handleKeyDown,
  isLoading,
  isRecording,
  setIsRecording,
  handleSendMessage,
  uploadedFilesCount,
  runInBackground,
  setRunInBackground
}) => {
  const hasProAccess = useUserStore(state => state.hasProAccess);
  const isPro = hasProAccess();

  return (
    <div className="flex-shrink-0 border-t border-border/20 p-4 md:p-6 z-10">
      <div className="max-w-4xl mx-auto">
        {/* Model Selector and Pinned Files Bar */}
        <div className="flex items-center justify-between px-1 mb-2">
          <div className="flex items-center gap-2">
            <ChatModelSelector />
          </div>
          <div className="flex items-center gap-2">
            {renderPinnedFiles()}
          </div>
        </div>
        <div className="flex gap-3 items-end">
          {/* Unified Rich Plus Menu */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            className="hidden"
            multiple
          />
          <RichPlusMenu
            onUploadClick={handleUploadFile}
            triggerClassName="h-12 w-12 rounded-2xl bg-muted/30 hover:bg-muted shrink-0 shadow-sm border border-border/10"
          />

          {/* Main Input Area */}
          <div className="flex-1 relative group">
            {/* Mention List UI */}
            {showMentionList && filteredMentions.length > 0 && (
              <div className="absolute bottom-full left-0 mb-2 w-72 bg-background/95 backdrop-blur-xl border border-border/40 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
                <div className="p-2 border-b border-border/20 bg-muted/30">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2">Knowledge Mentions</span>
                </div>
                <div className="max-h-60 overflow-y-auto p-1">
                  {filteredMentions.map((doc, index) => (
                    <button
                      key={doc.id}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200",
                        index === mentionListIndex ? "bg-primary text-primary-foreground shadow-lg scale-[1.02]" : "hover:bg-muted"
                      )}
                      onClick={() => handleSelectMention(doc)}
                      onMouseEnter={() => setMentionListIndex(index)}
                    >
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                        index === mentionListIndex ? "bg-white/20" : "bg-primary/10 text-primary"
                      )}>
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold truncate">{doc.title}</span>
                        <span className={cn(
                          "text-[10px] truncate",
                          index === mentionListIndex ? "text-white/70" : "text-muted-foreground"
                        )}>{doc.metadata?.documentType || 'Document'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Textarea
              ref={chatInputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className="enhanced-input min-h-[60px] max-h-48 rounded-2xl py-4 pl-4 pr-36 shadow-inner bg-muted/20 border-border/20 focus-visible:ring-primary/20 transition-all duration-200"
              disabled={isLoading}
              name="chat-input"
            />

            {/* Inside-Input Actions (Mic & Send) */}
            <div className="absolute right-2 bottom-2 flex items-center gap-1.5 p-0.5 rounded-xl bg-background/50 backdrop-blur-sm shadow-sm border border-border/10">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9 rounded-xl transition-all duration-300",
                  isRecording ? "bg-red-500/10 text-red-500 animate-pulse ring-2 ring-red-500/20" : "hover:bg-muted"
                )}
                onClick={() => setIsRecording(!isRecording)}
                title={isRecording ? "Stop Recording" : "Start Voice Recording"}
              >
                <Mic className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9 rounded-xl transition-all duration-300",
                  runInBackground ? "bg-purple-600/10 text-purple-400 ring-2 ring-purple-500/20" : "text-muted-foreground hover:bg-muted"
                )}
                onClick={() => {
                  if (!isPro) {
                    toast.info('Cloud Background Execution is a premium feature.', {
                      description: 'Upgrade to a Pro or Enterprise plan to unlock.'
                    });
                    return;
                  }
                  setRunInBackground(!runInBackground);
                }}
                title={runInBackground ? "Disable Run in Background" : "Enable Run in Background: Runs this agent task on the cloud"}
              >
                <Cloud className="h-4 w-4" />
              </Button>

              <Button
                onClick={handleSendMessage}
                disabled={isLoading || (!input.trim() && uploadedFilesCount === 0)}
                className="h-9 px-4 rounded-xl bg-primary text-primary-foreground shadow-lg hover:shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 group/send"
              >
                <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Send</span>
                <Send className="h-3.5 w-3.5 group-hover/send:translate-x-0.5 group-hover/send:-translate-y-0.5 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
