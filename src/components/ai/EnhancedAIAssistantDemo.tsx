import React, { useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/utils';
import { 
  Bot, Send, Plus, MessageSquare, FileText, X, Settings, 
  ThumbsUp, ThumbsDown, Bookmark, Pin, Edit3, RefreshCw,
  Download, Share, Copy, MoreVertical, Mic, Paperclip,
  Brain, Target, TrendingUp
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { TooltipProvider, Tooltip } from '../../components/ui/Tooltip';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Switch } from '../../components/ui/Switch';
import { Label } from '../../components/ui/Label';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel 
} from '../../components/ui/DropdownMenu';
import { MarkdownMessage } from '../../components/ai/MarkdownMessage';
import { useAIAssistant } from '../../hooks/ai';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/Avatar';

/**
 * 🎯 Enhanced AI Assistant Component - Full Featured
 * 
 * This component demonstrates all the ChatGPT-style features:
 * - Advanced conversation management
 * - Message reactions, bookmarks, pins
 * - File handling and drag & drop
 * - Canvas integration (master/slave)
 * - Autonomous learning
 * - Voice commands
 * - Specialized assistants
 */
export function EnhancedAIAssistantDemo() {
  const { theme } = useTheme();
  const { enhanced, canvas } = useAIAssistant();
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [enhanced.chatMessages]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enhanced.input.trim() || enhanced.isProcessing) return;
    
    await enhanced.sendMessage(enhanced.input, enhanced.uploadedFiles);
    enhanced.setInput('');
    
    // Focus back to textarea
    textareaRef.current?.focus();
  };
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    enhanced.handleFileUpload(files);
  };
  
  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  return (
    <TooltipProvider>
      <div className={cn(
        "h-screen flex",
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      )}>
        
        {/* 📱 Left Sidebar - Conversations */}
        <div className={cn(
          "w-80 border-r flex flex-col",
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        )}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Conversations</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={enhanced.handleNewChat}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Learning Status */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-blue-500" />
                <span>Autonomous Learning</span>
              </div>
              <Switch
                checked={enhanced.autonomousLearning}
                onCheckedChange={enhanced.toggleAutonomousLearning}
              />
            </div>
            
            {enhanced.learningInsights > 0 && (
              <Badge variant="secondary" className="mt-2">
                <TrendingUp className="h-3 w-3 mr-1" />
                {enhanced.learningInsights} insights
              </Badge>
            )}
          </div>
          
          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {enhanced.conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  "p-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700",
                  enhanced.currentConversation === conversation.id && "bg-blue-50 dark:bg-blue-900/20"
                )}
                onClick={() => enhanced.selectConversation(conversation.id)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium truncate flex-1">
                    {conversation.title}
                  </h3>
                  {enhanced.pinnedMessages.size > 0 && (
                    <Pin className="h-3 w-3 text-gray-400" />
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {conversation.messages?.[conversation.messages.length - 1]?.content || 'No messages'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(conversation.updatedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
            
            {enhanced.conversations.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No conversations yet</p>
                <p className="text-sm">Start a new chat to begin</p>
              </div>
            )}
          </div>
          
          {/* Bottom Actions */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={enhanced.clearConversations}
              className="w-full"
            >
              Clear All Conversations
            </Button>
          </div>
        </div>
        
        {/* 💬 Main Chat Area */}
        <div className="flex-1 flex flex-col">
          
          {/* Chat Header */}
          <div className={cn(
            "border-b px-6 py-4 flex items-center justify-between",
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          )}>
            <div className="flex items-center gap-3">
              <Bot className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold">AI Assistant</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>🤖 {enhanced.selectedAssistant?.name || 'General Assistant'}</span>
                  <span>•</span>
                  <span>📚 392 documents</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                🎯 Canvas Master/Slave Mode
              </Badge>
              {canvas.showCanvas && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={canvas.toggleCanvas}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Canvas
                </Button>
              )}
            </div>
          </div>
          
          {/* Chat Messages */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-4"
          >
            {enhanced.chatMessages.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Welcome to Enhanced AI Assistant
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Start a conversation with your AI assistant. Legal documents will automatically route to Canvas.
                </p>
                <div className="mt-6 space-y-2">
                  <p className="text-sm text-gray-400">🎯 Canvas slave mode active</p>
                  <p className="text-sm text-gray-400">🧠 Autonomous learning enabled</p>
                </div>
              </div>
            ) : (
              enhanced.chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 group",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/bot-avatar.png" />
                      <AvatarFallback>
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className="flex flex-col max-w-[80%]">
                    <div
                      className={cn(
                        "rounded-lg px-4 py-2 relative",
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : theme === 'dark'
                          ? 'bg-gray-800 text-gray-100'
                          : 'bg-white text-gray-900 border shadow-sm'
                      )}
                    >
                      {message.role === 'assistant' ? (
                        <MarkdownMessage content={message.content} />
                      ) : (
                        <p>{message.content}</p>
                      )}
                      
                      {/* Message indicators */}
                      <div className="flex items-center gap-1 mt-2">
                        {enhanced.bookmarkedMessages.has(message.id) && (
                          <Bookmark className="h-3 w-3 text-yellow-500 fill-current" />
                        )}
                        {enhanced.pinnedMessages.has(message.id) && (
                          <Pin className="h-3 w-3 text-blue-500" />
                        )}
                        {message.edited && (
                          <span className="text-xs text-gray-400">(edited)</span>
                        )}
                        {message.regenerated && (
                          <span className="text-xs text-gray-400">(regenerated)</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Message Actions */}
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip content="Like">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => enhanced.handleMessageReaction(message.id, 
                              enhanced.messageReactions[message.id] === 'like' ? null : 'like'
                            )}
                            className={cn(
                              "h-6 w-6 p-0",
                              enhanced.messageReactions[message.id] === 'like' && "text-green-600"
                            )}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                        </Tooltip>
                        
                        <Tooltip content="Dislike">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => enhanced.handleMessageReaction(message.id, 
                              enhanced.messageReactions[message.id] === 'dislike' ? null : 'dislike'
                            )}
                            className={cn(
                              "h-6 w-6 p-0",
                              enhanced.messageReactions[message.id] === 'dislike' && "text-red-600"
                            )}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </Tooltip>
                        
                        <Tooltip content="Bookmark">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => enhanced.toggleBookmark(message.id)}
                            className={cn(
                              "h-6 w-6 p-0",
                              enhanced.bookmarkedMessages.has(message.id) && "text-yellow-600"
                            )}
                          >
                            <Bookmark className="h-3 w-3" />
                          </Button>
                        </Tooltip>
                        
                        <Tooltip content="Pin">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => enhanced.togglePin(message.id)}
                            className={cn(
                              "h-6 w-6 p-0",
                              enhanced.pinnedMessages.has(message.id) && "text-blue-600"
                            )}
                          >
                            <Pin className="h-3 w-3" />
                          </Button>
                        </Tooltip>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => enhanced.regenerateMessage(message.id)}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Regenerate
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                  
                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/user-avatar.png" />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}
            
            {enhanced.isProcessing && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "rounded-lg px-4 py-2",
                  theme === 'dark' ? 'bg-gray-800' : 'bg-white border shadow-sm'
                )}>
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    </div>
                    <span className="text-sm text-gray-500">Processing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Input Area */}
          <div className={cn(
            "border-t p-6",
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          )}>
            {/* File Upload Area */}
            {enhanced.uploadedFiles.length > 0 && (
              <div className="mb-4 space-y-2">
                <Label>Uploaded Files:</Label>
                <div className="flex flex-wrap gap-2">
                  {enhanced.uploadedFiles.map((file, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {file.name}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => {
                          enhanced.handleFileUpload(
                            enhanced.uploadedFiles.filter((_, i) => i !== index)
                          );
                        }}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="flex gap-4">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={enhanced.input}
                  onChange={(e) => enhanced.setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask your AI assistant anything..."
                  className="min-h-[60px] resize-none pr-20"
                />
                
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Tooltip content="Attach files">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8 w-8 p-0"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </Tooltip>
                  
                  <Tooltip content="Voice input">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                  </Tooltip>
                </div>
              </div>
              
              <Button 
                type="submit" 
                disabled={!enhanced.input.trim() || enhanced.isProcessing}
                className="px-6"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
        
        {/* 🎨 Canvas Panel (Slave Mode) */}
        {canvas.showCanvas && (
          <div className={cn(
            "w-1/2 border-l flex flex-col",
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          )}>
            <div className="border-b p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                <h3 className="font-medium">Canvas (Slave Mode)</h3>
                <Badge variant="outline" className="text-xs">
                  {canvas.selectedContentType}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Canvas Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => canvas.exportCanvas(canvas.activeCanvasId!)}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={canvas.toggleCanvas}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 p-4">
              <Textarea
                value={canvas.canvasContent}
                onChange={(e) => canvas.updateCanvasContent(e.target.value)}
                className="w-full h-full min-h-[400px] font-mono text-sm resize-none"
                placeholder="AI-generated content will appear here..."
              />
              
              {canvas.canvasUpdating && (
                <div className="mt-2 text-xs text-green-600">
                  ✓ Canvas updated
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
