import React from 'react';
import { Bot } from 'lucide-react';
import { MessageHistoryList } from '../chat/MessageHistoryList';
import { ChatInputArea } from '../chat/ChatInputArea';
import { cn } from '../../lib/utils';

interface AssistantChatPanelProps {
  messages: any[];
  selectedAssistant: any;
  user: any;
  isLoading: boolean;
  isTyping: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  getUserInitials: () => string;
  showCanvasPanel: boolean;
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
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
  handleSendMessage: (overrideMessage?: string) => void;
  uploadedFilesCount: number;
  handleFiles: (files: FileList) => void;
  setPinnedDriveFiles: (fn: (prev: any[]) => any[]) => void;
  setInput: (value: string | ((prev: string) => string)) => void;
  onOpenDocument?: (doc: { title: string; content: string }) => void;
}

export const AssistantChatPanel: React.FC<AssistantChatPanelProps> = ({
  messages,
  selectedAssistant,
  user,
  isLoading,
  isTyping,
  messagesEndRef,
  getUserInitials,
  showCanvasPanel,
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
  isRecording,
  setIsRecording,
  handleSendMessage,
  uploadedFilesCount,
  handleFiles,
  setPinnedDriveFiles,
  setInput,
  onOpenDocument
}) => {
  return (
    <div className={cn(
      "flex flex-col bg-background h-full w-full",
      showCanvasPanel ? "border-r min-w-0" : ""
    )}>
      {/* Scrollable Messages Area */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-background"
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add('bg-blue-500/5');
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove('bg-blue-500/5');
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('bg-blue-500/5');

          // Handle external OS files
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
            return;
          }

          // Handle internal data (AI Drive, etc.)
          const data = e.dataTransfer.getData('text/plain');
          if (data) {
            try {
              const parsed = JSON.parse(data);
              if (parsed.id) {
                if (parsed.isFolder || parsed.type === 'AIDriveFolder') {
                  import('@/store/attachedDriveStore').then(({ useAttachedDriveStore }) => {
                    const store = useAttachedDriveStore.getState();
                    const findFolder = (nodes: any[]): any => {
                      for (const n of nodes) {
                        if (n.id === parsed.id || n.path === parsed.path) return n;
                        if (n.children) {
                          const f = findFolder(n.children);
                          if (f) return f;
                        }
                      }
                      return null;
                    };
                    let node: any = null;
                    for (const d of store.drives) {
                      node = findFolder(d.items);
                      if (node) break;
                    }
                    if (node) {
                      store.togglePinFolder(node);
                    }
                  });
                }
                const fileId = parsed.path || parsed.id;
                const fileName = parsed.name || fileId.split(/[\\/]/).pop() || fileId;
                setPinnedDriveFiles(prev => {
                  if (prev.find(f => f.id === fileId)) return prev;
                  return [...prev, { id: fileId, name: fileName }];
                });
                return;
              }
            } catch {}

            if (data.startsWith('[AIDriveFile]:')) {
              const raw = data.substring('[AIDriveFile]:'.length);
              const lastColon = raw.lastIndexOf(':');
              const fileId = lastColon > -1 ? raw.substring(0, lastColon) : raw;
              const fileName = lastColon > -1 ? raw.substring(lastColon + 1) : (fileId.split(/[\\/]/).pop() || fileId);
              setPinnedDriveFiles(prev => {
                if (prev.find(f => f.id === fileId)) return prev;
                return [...prev, { id: fileId, name: fileName }];
              });
              return;
            }
            setInput(prev => prev + (prev ? '\n' : '') + `[Imported]: ${data}`);
          }
        }}
      >
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <div className="text-center p-8 max-w-md">
              <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">How can I help you today?</h2>
              <p className="text-muted-foreground">You're chatting with <strong>{selectedAssistant?.name || 'AI Assistant'}</strong></p>
            </div>
          </div>
        )}
        <MessageHistoryList
          messages={messages}
          selectedAssistant={selectedAssistant}
          user={user}
          isLoading={isLoading}
          isTyping={isTyping}
          messagesEndRef={messagesEndRef}
          getUserInitials={getUserInitials}
          onAlternativeSelect={handleSendMessage}
          onOpenDocument={onOpenDocument}
        />
      </div>

      {/* Chat Input */}
      <ChatInputArea
        renderPinnedFiles={renderPinnedFiles}
        fileInputRef={fileInputRef}
        handleFileInputChange={handleFileInputChange}
        handleUploadFile={handleUploadFile}
        showMentionList={showMentionList}
        filteredMentions={filteredMentions}
        mentionListIndex={mentionListIndex}
        setMentionListIndex={setMentionListIndex}
        handleSelectMention={handleSelectMention}
        chatInputRef={chatInputRef}
        input={input}
        handleInputChange={handleInputChange}
        handleKeyDown={handleKeyDown}
        isLoading={isLoading}
        isRecording={isRecording}
        setIsRecording={setIsRecording}
        handleSendMessage={handleSendMessage}
        uploadedFilesCount={uploadedFilesCount}
      />
    </div>
  );
};
