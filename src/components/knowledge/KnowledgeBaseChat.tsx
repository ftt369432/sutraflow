import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Bot,
  User,
  BookOpen,
  Lightbulb,
  Save,
  Search,
  Filter,
  Plus,
  FileText,
  Brain,
  Sparkles,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Download,
  Upload,
  Edit,
  Trash2,
  Settings,
  ChevronDown,
  ChevronUp,
  Tag,
  Clock
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Guardrails, SafetyLevel } from '../../cortex/Guardrails';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { searchDocuments, KnowledgeSearchResult } from '../../services/searchService';
import { MarkdownMessage } from '../ai/MarkdownMessage';
import type { AIDocument, AIAssistant } from '../../types/ai';

interface KnowledgeChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: KnowledgeSearchResult[];
  metadata?: {
    assistantId?: string;
    confidence?: number;
    documentIds?: string[];
    savedToKnowledge?: boolean;
  };
}

interface KnowledgeBaseChatProps {
  selectedAssistant?: AIAssistant | null;
  onSaveKnowledge?: (content: string, metadata: any) => void;
  isCollapsed?: boolean;
  className?: string;
  currentFolderId?: string | null; // Added currentFolderId prop
}

export function KnowledgeBaseChat({ 
  selectedAssistant, 
  onSaveKnowledge,
  isCollapsed = false,
  className = "",
  currentFolderId // Destructure currentFolderId
}: KnowledgeBaseChatProps) {
  const [messages, setMessages] = useState<KnowledgeChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  // const [relevantSources, setRelevantSources] = useState<KnowledgeSearchResult[]>([]); // Commented out: Unused
  const [showSources, setShowSources] = useState(true);
  const [quickSaveText, setQuickSaveText] = useState('');
  const [showQuickSave, setShowQuickSave] = useState(false);
  // const [searchQuery, setSearchQuery] = useState(''); // Commented out: Unused
  // const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]); // Commented out: Unused
  const [chatMode, setChatMode] = useState<'general' | 'training' | 'search'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveStatus, setLastSaveStatus] = useState<'success' | 'error' | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { folders, addDocument } = useKnowledgeBaseStore(); // Removed unused getDocumentsByFolder, documents
  // const { assistants, getAssistantById } = useAssistantStore(); // Commented out: Unused

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Initialize with welcome message
    if (messages.length === 0) {
      const welcomeMessage: KnowledgeChatMessage = {
        id: `msg-${Date.now()}`,
        type: 'system',
        content: selectedAssistant 
          ? `Hello! I'm your ${selectedAssistant.name}. I can help you search your knowledge base, answer questions based on your documents, and learn from our conversations. What would you like to explore?`
          : `Welcome to Knowledge Base Chat! I can help you search documents, answer questions, and manage your knowledge. What would you like to know?`,
        timestamp: new Date(),
        metadata: {
          assistantId: selectedAssistant?.id
        }
      };
      setMessages([welcomeMessage]);
    }
  }, [selectedAssistant]);

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return;

    // 🛡️ SECURITY LAYER: Scan input for prompt injection and data leaks
    const securityDecision = Guardrails.scanInput(input, 'user_message');
    if (securityDecision.level === SafetyLevel.FORBIDDEN) {
      const blockMessage: KnowledgeChatMessage = {
        id: `msg-${Date.now()}`,
        type: 'system',
        content: `⚠️ SECURITY BLOCK: ${securityDecision.reason}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, blockMessage]);
      setInput('');
      return;
    }

    const userMessage: KnowledgeChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      // Search for relevant documents
      const searchResults = await searchDocuments(input, {
        assistantId: selectedAssistant?.id,
        includeContent: true,
        maxResults: 5
      });

      // setRelevantSources(searchResults); // Commented out: Unused

      // Generate AI response based on knowledge base
      const response = await generateKnowledgeResponse(input, searchResults, selectedAssistant);

      const assistantMessage: KnowledgeChatMessage = {
        id: `msg-${Date.now() + 1}`,
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        sources: searchResults,
        metadata: {
          assistantId: selectedAssistant?.id,
          confidence: response.confidence,
          documentIds: searchResults.map(r => r.document.id)
        }
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Auto-suggest quick save if response contains new knowledge
      if (response.shouldSuggestSave) {
        setQuickSaveText(response.content);
        setShowQuickSave(true);
      }

    } catch (error) {
      console.error('Error in knowledge chat:', error);
      const errorMessage: KnowledgeChatMessage = {
        id: `msg-${Date.now() + 1}`,
        type: 'system',
        content: 'I encountered an error while searching the knowledge base. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateKnowledgeResponse = async (
    query: string, 
    sources: KnowledgeSearchResult[], 
    assistant?: AIAssistant | null
  ) => {
    // Simulate AI response generation with knowledge base context
    // console.log('[KnowledgeBaseChat] Generating response. Query:', query, 'Sources:', sources, 'Assistant:', assistant);
    const contextual = sources.length > 0;
    let content = '';
    let confidence = 0;
    let shouldSuggestSave = false;

    if (contextual) {
      const relevantContent = sources
        .map(s => `**${s.document.title}**: ${s.snippet}`)
        .join('\n\n');

      content = `Based on your knowledge base, here's what I found:\n\n${relevantContent}\n\n`;
      
      if (assistant) {
        content += `As your ${assistant.name}, I can help you analyze this information further. `;
        
        // Add assistant-specific insights based on capabilities
        if (assistant.capabilities?.includes('legal_research')) {
          content += 'I can help identify legal precedents, analyze contract terms, or research related case law.';
        } else if (assistant.capabilities?.includes('data_analysis')) {
          content += 'I can help analyze trends, extract insights, or generate reports from this data.';
        } else if (assistant.capabilities?.includes('creative_writing')) {
          content += 'I can help create content, develop ideas, or provide creative perspectives on this information.';
        }
      }

      confidence = Math.min(95, sources.length * 20 + Math.random() * 20);
      shouldSuggestSave = query.toLowerCase().includes('how') || query.toLowerCase().includes('what');
    } else {
      content = `I don't have specific information about "${query}" in your current knowledge base. `;
      
      if (assistant) {
        content += `However, as your ${assistant.name}, I can suggest:\n\n`;
        content += '• Uploading relevant documents to expand the knowledge base\n';
        content += '• Searching with different keywords\n';
        content += '• Creating a new document with this information\n';
      } else {
        content += 'Would you like to add this information to your knowledge base?';
      }
      
      confidence = 10;
      shouldSuggestSave = true;
    }

    return { content, confidence, shouldSuggestSave };
  };

  const handleQuickSave = async () => {
    if (!quickSaveText.trim()) return;

    setIsSaving(true);
    let folderIdToUse = currentFolderId;

    if (!folderIdToUse) {
      const defaultFolderName = "Chat Knowledge";
      let chatFolder = folders.find(f => f.name === defaultFolderName);
      if (!chatFolder) {
        console.log(`[KnowledgeBaseChat] "${defaultFolderName}" folder not found, creating it.`);
        const newFolder = useKnowledgeBaseStore.getState().addFolder({ name: defaultFolderName, parentId: null }); // Corrected: pass folder object
        if (newFolder) {
          chatFolder = newFolder;
          folderIdToUse = newFolder.id;
          console.log(`[KnowledgeBaseChat] Created "${defaultFolderName}" folder with ID: ${folderIdToUse}`);
        } else {
          console.error('[KnowledgeBaseChat] Failed to create default chat folder.');
        }
      } else {
        folderIdToUse = chatFolder.id;
        console.log(`[KnowledgeBaseChat] Using existing "${defaultFolderName}" folder with ID: ${folderIdToUse}`);
      }
    }

    if (!folderIdToUse) {
      console.warn("[KnowledgeBaseChat] handleQuickSave: folderIdToUse is still undefined. Document will be saved without a folderId.");
    }

    try {
      const newDoc: Omit<AIDocument, 'id' | 'embedding'> = {
        title: `Chat Knowledge - ${new Date().toLocaleDateString()}`,
        content: quickSaveText,
        type: 'text' as const,
        folderId: folderIdToUse || undefined, 
        metadata: {
          source: 'knowledge-chat',
          created_by: selectedAssistant?.id || 'user',
          tags: ['chat-generated', 'knowledge-base'],
          category: selectedAssistant?.type || 'general',
          date: new Date()
        }
      };

      console.log('[KnowledgeBaseChat] Attempting to save document with folderId:', folderIdToUse, 'Full doc:', newDoc);
      await addDocument(newDoc); // addDocument returns void, so no assignment to addedDocument
      
      // Assuming success if no error is thrown by addDocument
      console.log('[KnowledgeBaseChat] addDocument called. Assuming success.');
      setLastSaveStatus('success');
      
      setShowQuickSave(false);
      setQuickSaveText('');
      
      if (onSaveKnowledge) {
        onSaveKnowledge(quickSaveText, newDoc.metadata);
      }

      const confirmMessage: KnowledgeChatMessage = {
        id: `msg-${Date.now()}`,
        type: 'system',
        content: `✅ Knowledge saved successfully${folderIdToUse ? ` to folder "${folders.find(f=>f.id === folderIdToUse)?.name || 'Chat Knowledge'}"` : ' (no specific folder)'}!`,
        timestamp: new Date(),
        metadata: { savedToKnowledge: true }
      };
      setMessages(prev => [...prev, confirmMessage]);

    } catch (error) {
      console.error('Error saving knowledge:', error);
      setLastSaveStatus('error');
      const errorMessage: KnowledgeChatMessage = {
        id: `msg-${Date.now()}`,
        type: 'system',
        content: '❌ Failed to save knowledge. Please check console for details.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSaving(false);
      setTimeout(() => setLastSaveStatus(null), 3000);
    }
  };

  const handleTrainingMode = () => {
    setChatMode('training');
    const trainingMessage: KnowledgeChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'system',
      content: `🎓 **Training Mode Activated**\n\nI'm now ready to learn! Share information, ask me to analyze documents, or provide feedback on my responses. Everything we discuss can be saved to improve my knowledge base.`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, trainingMessage]);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isCollapsed) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center">
          <Brain className="h-8 w-8 mx-auto mb-2 text-blue-500" />
          <h3 className="font-medium text-gray-900 dark:text-white">Knowledge Chat</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {messages.length > 1 ? `${messages.length - 1} messages` : 'Ready to chat'}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-800 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Brain className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Knowledge Base Chat
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedAssistant ? `with ${selectedAssistant.name}` : 'General Knowledge'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={chatMode === 'training' ? 'default' : 'secondary'}>
            {chatMode === 'training' ? '🎓 Training' : '💬 Chat'}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTrainingMode}
            disabled={chatMode === 'training'}
          >
            <Lightbulb className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`
                max-w-[80%] rounded-lg p-3 
                ${message.type === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : message.type === 'system'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white'
                }
              `}>
                <div className="flex items-start space-x-2">
                  {message.type !== 'user' && (
                    <div className="mt-1">
                      {message.type === 'system' ? (
                        <Settings className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Bot className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                  )}
                  <div className="flex-1">
                    <MarkdownMessage content={message.content} />
                    <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                      <span>{formatTimestamp(message.timestamp)}</span>
                      {message.metadata?.confidence && (
                        <span>Confidence: {Math.round(message.metadata.confidence)}%</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sources */}
            {message.sources && message.sources.length > 0 && showSources && (
              <div className="ml-8 space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSources(!showSources)}
                  className="text-xs text-gray-500"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  {message.sources.length} source{message.sources.length > 1 ? 's' : ''}
                  {showSources ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                </Button>
                {showSources && (
                  <div className="space-y-1">
                    {message.sources.map((source, index) => (
                      <div key={index} className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded border">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {source.document.title}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 mt-1">
                          {source.snippet}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-gray-500">Score: {Math.round(source.score * 100)}%</span>
                          <Badge variant="outline" className="text-xs">
                            {source.document.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Save suggestion */}
            {message.metadata?.savedToKnowledge && (
              <div className="ml-8">
                <div className="flex items-center space-x-2 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle className="h-3 w-3" />
                  <span>Saved to Knowledge Base</span>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Searching knowledge base...
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Save Panel */}
      {showQuickSave && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-yellow-50 dark:bg-yellow-900/20">
          <div className="flex items-start space-x-3">
            <Lightbulb className="h-5 w-5 text-yellow-600 mt-1" />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Save this knowledge?
              </h4>
              <Textarea
                value={quickSaveText}
                onChange={(e) => setQuickSaveText(e.target.value)}
                placeholder="Edit the content before saving..."
                className="mb-3 text-sm"
                rows={3}
              />
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={handleQuickSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-3 w-3 mr-1" />
                      Save to Knowledge Base
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQuickSave(false)}
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                selectedAssistant 
                  ? `Ask ${selectedAssistant.name} about your knowledge base...`
                  : "Ask about your knowledge base..."
              }
              className="resize-none"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isProcessing}
            className="self-end"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* Quick actions */}
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>{folders.length} documents in knowledge base</span>
            {selectedAssistant && (
              <span>Using {selectedAssistant.name}</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {lastSaveStatus === 'success' && (
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Saved
              </div>
            )}
            {lastSaveStatus === 'error' && (
              <div className="flex items-center text-red-600">
                <AlertCircle className="h-3 w-3 mr-1" />
                Error
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}