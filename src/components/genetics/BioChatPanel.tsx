import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, ChevronDown, Dna, Bot, User, Loader2, Sparkles } from 'lucide-react';
import type { GeneInfo } from '../../services/bio/MyGeneService';
import type { VariantInfo } from '../../services/bio/MyVariantService';
import { geminiSimplifiedService } from '../../services/gemini-simplified';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { getAIService } from '../../services/ai/aiService';
import { BioChatService } from '../../services/bio/BioChatService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
}

interface BioChatPanelProps {
  geneData: GeneInfo | null;
  variantData: VariantInfo[];
  attachedFolderIds: string[];
  attachedFileIds?: string[];
  savedGenes?: string[];
  isOpen: boolean;
  onClose: () => void;
}

type AIModel = 'gemini' | 'claude' | 'groq';

const MODEL_OPTIONS: { id: AIModel; label: string; description: string }[] = [
  { id: 'gemini', label: 'Gemini 2.0 Flash', description: 'Google · Multi-modal' },
  { id: 'claude', label: 'Claude 3.5 Sonnet', description: 'Anthropic · Precise' },
  { id: 'groq', label: 'Llama 3.3 70B', description: 'Groq · Ultra-fast' },
];

export const BioChatPanel: React.FC<BioChatPanelProps> = ({ 
  geneData, 
  variantData, 
  attachedFolderIds, 
  attachedFileIds = [],
  savedGenes = [],
  isOpen,
  onClose
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>('gemini');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const documents = useKnowledgeBaseStore(state => state.documents);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // LOAD PERSISTENT HISTORY
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await BioChatService.getHistory();
        if (history.length > 0) {
          setMessages(history.map(m => ({
            ...m,
            timestamp: new Date(m.timestamp)
          })));
        }
      } catch (err) {
        console.error('[BioChatPanel] Failed to load message history:', err);
      }
    };
    
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const buildSystemPrompt = async (): Promise<string> => {
    let context = `You are GenieBio AI, an advanced bio-engineering research assistant integrated into the GenieFlow platform. You specialize in genetics, molecular biology, CRISPR therapeutics, protein structure analysis, and drug repurposing.\n\n`;

    if (geneData) {
      context += `## Currently Loaded Gene Data\n`;
      context += `- **Symbol**: ${geneData.symbol}\n`;
      context += `- **Name**: ${geneData.name}\n`;
      context += `- **Type**: ${geneData.type_of_gene}\n`;
      context += `- **Location**: ${geneData.map_location || 'Unknown'}\n`;
      context += `- **NCBI ID**: ${geneData._id}\n`;
      if (geneData.summary) context += `- **Summary**: ${geneData.summary}\n`;
      context += `\n`;
    }

    if (variantData.length > 0) {
      context += `## Known Variants (${variantData.length} total) for Active Gene\n`;
      variantData.slice(0, 5).forEach(v => {
        context += `- ${v._id}: ${v.clinvar?.clinical_significance || 'Unknown significance'}\n`;
      });
      if (variantData.length > 5) context += `- ...and ${variantData.length - 5} more\n`;
      context += `\n`;
    }

    if (savedGenes.length > 0) {
      context += `## Interaction Analysis Swarm Mode 🧬\n`;
      context += `The user is investigating multi-gene interactions. The following genes have been saved to the current Sovereign BioLab session context:\n`;
      savedGenes.forEach(g => {
        context += `- ${g}\n`;
      });
      context += `\nYour primary objective is to cross-reference these specific genes against the pinned research context and your training data to find direct interaction mechanisms, secondary effects, and potential multi-target therapeutic candidates. Rule out contraindications.\n\n`;
    }

    const hasFolders = attachedFolderIds.length > 0;
    const hasFiles = attachedFileIds.length > 0;
    
    if (hasFolders || hasFiles) {
      // 1. First try to find them in the local Zustand store cache
      const storeLinkedDocs = documents.filter(doc => 
        (doc.folderId && attachedFolderIds.includes(doc.folderId)) || 
        attachedFileIds.includes(doc.id)
      );
      
      const missingFileIds = attachedFileIds.filter(id => !storeLinkedDocs.some(d => d.id === id));
      
      // 2. Fallback: Fetch missing files directly from AI Drive if the store hasn't synced them yet
      let fallbackDocs: any[] = [];
      if (missingFileIds.length > 0) {
         try {
           const { aiDriveService } = await import('../../services/drive/aiDriveService');
           for (const id of missingFileIds) {
             try {
               // Use getFileContent for more robust text retrieval (handles OCR and small text files)
               const content = await aiDriveService.getFileContent(id);
               const driveFile = await aiDriveService.getFile(id);
               if (content) {
                 fallbackDocs.push({
                   title: driveFile.name,
                   content: content
                 });
               }
             } catch (e) {
               console.warn(`[BioChatPanel] Failed to fetch missing pinned file ${id}:`, e);
             }
           }
         } catch (e) {
           console.error('[BioChatPanel] Error importing aiDriveService for fallback fetch', e);
         }
      }
      
      const allLinkedDocs = [...storeLinkedDocs, ...fallbackDocs];
      
      if (allLinkedDocs.length > 0) {
        context += `\n## PINNED RESEARCH CONTEXT (CRITICAL)\n`;
        context += `The following scientific data has been pinned to the session. Prioritize this information for your analysis:\n\n`;
        allLinkedDocs.slice(0, 10).forEach(doc => {
          const excerpt = doc.content ? doc.content.substring(0, 3000) : 'No content available';
          context += `### DOCUMENT: ${doc.title || 'Untitled'}\n${excerpt}\n----\n\n`;
        });
      }
    }

    context += `\nRespond with scientific accuracy. Use markdown formatting. Reference the loaded data when relevant. If the user asks about something outside the loaded context, still answer using your training knowledge but note the distinction.`;

    return context;
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    // PERSIST USER MESSAGE
    BioChatService.saveMessage({
      role: 'user',
      content: trimmed,
      model: selectedModel
    });

    const assistantId = `assistant-${Date.now()}`;
    const placeholderMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      model: selectedModel,
    };
    setMessages(prev => [...prev, placeholderMessage]);

    try {
      const systemPrompt = await buildSystemPrompt();
      const conversationHistory = messages
        .filter(m => m.role !== 'system')
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

      const fullPrompt = `${conversationHistory}\nUser: ${trimmed}\nAssistant:`;

      let responseText = '';
      const aiService = await getAIService();

      if (selectedModel === 'gemini') {
        responseText = await geminiSimplifiedService.getCompletionStreaming(
          [{ text: `${systemPrompt}\n\n${fullPrompt}` }],
          {
            temperature: 0.7,
            maxTokens: 4096,
            onUpdate: (text) => {
              setMessages(prev =>
                prev.map(m => m.id === assistantId ? { ...m, content: text } : m)
              );
            },
          }
        );
      } else {
        // Claude / Groq / Fallback
        responseText = await aiService.generateText(fullPrompt, {
          provider: selectedModel === 'claude' ? 'anthropic' : 'google',
          systemPrompt: systemPrompt,
          temperature: 0.7,
        });
      }

      setMessages(prev =>
        prev.map(m => m.id === assistantId ? { ...m, content: responseText } : m)
      );

      // PERSIST ASSISTANT MESSAGE
      BioChatService.saveMessage({
        role: 'assistant',
        content: responseText,
        model: selectedModel
      });
    } catch (error) {
      console.error('[BioChatPanel] Error:', error);
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: `⚠️ Error connecting to ${selectedModel === 'gemini' ? 'Gemini' : 'Groq'} API. Please check your API key configuration.` }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Panel moved to Z-index 100 to ensure it's above sidebars and other overlays */}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 right-16 z-[100] w-[480px] h-[600px] bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Dna size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">GenieBio AI</h3>
                  <p className="text-[10px] text-emerald-100 opacity-80 flex items-center gap-1.5 flex-wrap">
                    {geneData ? <span>Context: {geneData.symbol} ({variantData.length} variants)</span> : <span>No gene focused</span>}
                    {(attachedFolderIds.length > 0 || attachedFileIds.length > 0) && <span>· {attachedFolderIds.length + attachedFileIds.length} pinned item(s)</span>}
                    {savedGenes.length > 0 && <span className="bg-emerald-800/80 px-1 py-0.5 rounded border border-emerald-500/50">· {savedGenes.length} genes tracking</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Model Picker */}
                <div className="relative">
                  <button
                    onClick={() => setShowModelPicker(!showModelPicker)}
                    className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                  >
                    <Sparkles size={10} />
                    {selectedModel === 'gemini' ? 'Gemini' : selectedModel === 'claude' ? 'Claude' : 'Groq'}
                  </button>
                  <AnimatePresence>
                    {showModelPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute top-8 right-0 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden z-50 w-52"
                      >
                        {MODEL_OPTIONS.map(model => (
                          <button
                            key={model.id}
                            onClick={() => { setSelectedModel(model.id); setShowModelPicker(false); }}
                            className={`w-full text-left px-3 py-2.5 flex flex-col hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors ${
                              selectedModel === model.id
                                ? 'bg-emerald-50 dark:bg-emerald-900/30'
                                : ''
                            }`}
                          >
                            <span className={`text-xs font-medium ${selectedModel === model.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-gray-200'}`}>
                              {model.label}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-gray-500">{model.description}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-white/20 rounded-md transition-colors"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-auto p-4 space-y-4 bg-slate-50 dark:bg-gray-950">
              {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center h-full pt-16">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4 border border-emerald-200 dark:border-emerald-800">
                    <Bot size={28} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-gray-200 mb-1">GenieBio Research Assistant</h4>
                  <p className="text-xs text-slate-500 dark:text-gray-400 max-w-[280px] mb-6">
                    Ask questions about genes, variants, therapies, or your linked research documents.
                  </p>
                  <div className="flex flex-col gap-2 w-full max-w-[300px]">
                    {[
                      geneData ? `What therapies exist for ${geneData.symbol} mutations?` : 'Search for a gene first to get context-aware answers',
                      'Explain the p.Gly608Gly mutation and its clinical significance',
                      'What CRISPR strategies could target this variant?',
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => { if (geneData || i > 0) { setInput(suggestion); } }}
                        className="text-left text-xs bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-lg px-3 py-2.5 text-slate-600 dark:text-gray-400 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-slate-800 dark:text-gray-200 rounded-tl-sm shadow-sm'
                  }`}>
                    {msg.content || (
                      <div className="flex items-center gap-2 text-emerald-500">
                        <Loader2 size={14} className="animate-spin" />
                        <span className="text-xs">Thinking...</span>
                      </div>
                    )}
                    {msg.model && msg.role === 'assistant' && msg.content && (
                      <div className="mt-1.5 text-[10px] opacity-40 flex items-center gap-1">
                        <Sparkles size={8} />
                        {msg.model === 'gemini' ? 'Gemini 2.0 Flash' : msg.model === 'claude' ? 'Claude 3.5 Sonnet' : 'Llama 3.3 via Groq'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about genes, variants, therapies..."
                  rows={1}
                  className="flex-1 resize-none bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-gray-200 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all max-h-24"
                  style={{ minHeight: '40px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isStreaming}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 dark:disabled:bg-gray-700 rounded-xl text-white transition-colors disabled:cursor-not-allowed"
                >
                  {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
