import React, { useState, useRef, useEffect } from 'react';
import { AIAssistant, Message } from '../../types/ai';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { 
  Send, ArrowLeft, Book, Loader2, Edit, FolderOpen, 
  FileText, Search, Clock, ThumbsUp, ThumbsDown, 
  FolderIcon, Database, BarChart2
} from 'lucide-react';
import { chatWithAssistant } from '../../services/documentChatService';
import { useToast } from '../../hooks/useToast';
import { Badge } from '../ui/Badge';
import { DocumentPreview } from './DocumentPreview';
import { useUserStore } from '../../stores/userStore';

interface AssistantChatProps {
  assistant: AIAssistant;
  onBack?: () => void;
  onEdit?: () => void;
}

export function AssistantChat({ assistant, onBack, onEdit }: AssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sources, setSources] = useState<any[]>([]);
  const [usedKnowledgeBase, setUsedKnowledgeBase] = useState<boolean>(false);
  const [showSources, setShowSources] = useState<boolean>(true);
  const { toast } = useToast();
  const messageEndRef = useRef<HTMLDivElement>(null);
  const { user } = useUserStore();
  
  // Initial message from the assistant
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Hello! I'm ${assistant.name}. ${assistant.description || ''} How can I help you today?`,
        timestamp: new Date()
      }
    ]);
  }, [assistant]);
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Get response from the assistant using the chatWithAssistant service
      const result = await chatWithAssistant(
        assistant.id,
        input,
        messages.filter(m => m.id !== 'welcome') // Filter out welcome message from context
      );
      
      // Add assistant's response to the chat
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.message,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update document sources
      if (result.relevantDocuments && result.relevantDocuments.length > 0) {
        setSources(result.relevantDocuments);
        setUsedKnowledgeBase(true);
        
        // Show a toast when knowledge is used
        toast({
          title: "Knowledge Base Used",
          description: `${result.relevantDocuments.length} documents used to answer your question.`,
          variant: "default",
        });
      } else {
        // Clear sources if none were used
        setSources([]);
        setUsedKnowledgeBase(false);
      }
    } catch (error) {
      console.error('Error getting assistant response:', error);
      
      // Add error message to chat
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error while processing your request.',
          timestamp: new Date()
        }
      ]);
      
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to get a response from the assistant.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get color based on similarity score
  const getSimilarityColor = (similarity: number): string => {
    if (similarity >= 0.8) return '#10B981'; // Green for high similarity
    if (similarity >= 0.6) return '#2563EB'; // Blue for good similarity
    if (similarity >= 0.4) return '#F59E0B'; // Orange for moderate similarity
    return '#EF4444'; // Red for low similarity
  };

  // Helper to get user initials
  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="flex h-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Enhanced Header with Knowledge Base Info */}
        <div className="border-b p-4 flex flex-col">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              {onBack && (
                <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <h2 className="text-xl font-semibold">{assistant.name}</h2>
              {assistant.type && (
                <Badge variant="secondary" className="ml-2">
                  {assistant.type}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
          
          {assistant.description && (
            <p className="text-muted-foreground text-sm mb-2">{assistant.description}</p>
          )}
          
          {/* Knowledge Base Folders Display */}
          {assistant.knowledgeBase && assistant.knowledgeBase.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <Database className="h-3 w-3 mr-1" />
                <span>Knowledge:</span>
              </div>
              {assistant.knowledgeBase.map((folder) => (
                <Badge key={folder.id} variant="outline" className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20">
                  <FolderIcon className="h-3 w-3" />
                  {folder.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {/* --- GenieFlow Custom: User/Assistant Avatar --- */}
              {message.role === 'assistant' ? (
                <img
                  src={assistant.avatar || './images/default-avatar.svg'}
                  alt="Assistant Avatar"
                  className="w-8 h-8 rounded-full mr-2 object-cover bg-gray-200"
                  style={{ background: '#22304A' }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = './images/default-avatar.svg';
                  }}
                />
              ) : (
                user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="User Avatar"
                    className="w-8 h-8 rounded-full mr-2 object-cover bg-gray-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full mr-2 flex items-center justify-center bg-gray-300 text-gray-700 font-bold text-base" style={{ background: '#E5EAF2' }}>
                    {getInitials((user as any)?.user_metadata?.fullName || (user as any)?.user_metadata?.full_name || user?.email || 'U')}
                  </div>
                )
              )}
              {/* --- End GenieFlow Custom --- */}
              <div
                className={`glassy-bubble ${message.role} max-w-[80%] rounded-2xl p-4 shadow-xl backdrop-blur-md border`}
              >
                <div className="whitespace-pre-wrap prose-sm dark:prose-invert">
                  {message.content}
                </div>
                <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                  
                  {/* Only show feedback options for assistant messages that aren't the welcome message */}
                  {message.role === 'assistant' && message.id !== 'welcome' && (
                    <div className="flex items-center gap-2">
                      <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                        <ThumbsUp className="h-3 w-3" />
                      </button>
                      <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                        <ThumbsDown className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Show typing indicator when loading */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Thinking{usedKnowledgeBase ? " using knowledge base" : ""}...</span>
              </div>
            </div>
          )}
          
          {/* Invisible element to scroll to */}
          <div ref={messageEndRef} />
        </div>
        
        {/* Input form */}
        <form onSubmit={handleSubmit} className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${assistant.name} something...`}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
      
      {/* Enhanced Sources panel with toggle */}
      <div className={`border-l transition-all duration-300 ${showSources ? 'w-80' : 'w-10'} relative`}>
        <button 
          onClick={() => setShowSources(!showSources)}
          className="absolute top-4 -left-3 bg-white dark:bg-gray-800 border rounded-full p-1 shadow-sm z-10"
        >
          <Book className={`h-4 w-4 transition-transform ${showSources ? 'rotate-0' : 'rotate-180'}`} />
        </button>
        
        {showSources && (
          <div className="overflow-y-auto p-4 h-full">
            <div className="flex items-center gap-2 mb-4">
              <Book className="h-5 w-5" />
              <h3 className="font-medium">Knowledge Sources</h3>
            </div>
            
            {sources.length > 0 ? (
              <div className="space-y-4">
                {sources.map(({ document, similarity }) => (
                  <Card key={document.id} className="p-3 border-l-4" style={{ borderLeftColor: getSimilarityColor(similarity) }}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        {document.metadata?.title || document.title || 'Untitled'}
                      </h4>
                    </div>
                    
                    <div className="mb-3 bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs border border-gray-100 dark:border-gray-700">
                      <p className="line-clamp-3">
                        {document.content.substring(0, 200)}...
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Relevance:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-medium" style={{ color: getSimilarityColor(similarity) }}>
                            {Math.round(similarity * 100)}%
                          </span>
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full" 
                              style={{ 
                                width: `${Math.round(similarity * 100)}%`,
                                backgroundColor: getSimilarityColor(similarity)
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {document.metadata?.folder && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Folder:</span>
                          <span className="font-medium flex items-center gap-1">
                            <FolderOpen className="h-3 w-3" />
                            {document.metadata.folder}
                          </span>
                        </div>
                      )}
                      
                      {document.metadata?.date && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Date:</span>
                          <span className="font-medium flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(document.metadata.date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : usedKnowledgeBase ? (
              <div className="flex flex-col items-center justify-center h-40 text-center text-gray-500">
                <Search className="h-10 w-10 mb-2 opacity-30" />
                <p>Processing knowledge sources...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center text-gray-500">
                <Database className="h-10 w-10 mb-2 opacity-30" />
                <p>No knowledge sources used for this response.</p>
                <p className="text-xs mt-2">
                  {assistant.knowledgeBase?.length 
                    ? "Your question may not match the available knowledge." 
                    : "This assistant has no knowledge folders linked."}
                </p>
              </div>
            )}
            
            {/* Knowledge Base Stats */}
            {assistant.knowledgeBase && assistant.knowledgeBase.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <BarChart2 className="h-4 w-4" />
                  Knowledge Stats
                </h4>
                <ul className="text-xs space-y-2">
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Folders:</span>
                    <span>{assistant.knowledgeBase.length}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Documents:</span>
                    <span>{assistant.knowledgeBase.reduce((total, folder) => total + (folder.documents?.length || 0), 0)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Sources Used:</span>
                    <span>{sources.length}</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

