import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  Sparkles, 
  ShieldCheck, 
  Database, 
  Zap, 
  Bot,
  RefreshCw,
  X,
  FileText,
  Pin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NexusObjectType, NexusRecord, useNexusStore } from '../../store/nexusStore';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface NexusIntelligencePanelProps {
  objectType?: NexusObjectType;
  activeRecord?: NexusRecord | null;
  pinnedFolders: string[];
  pinnedFiles: string[];
  onUnpinFolder: (id: string) => void;
  onUnpinFile: (id: string) => void;
  onClose: () => void;
}

interface ProposedUpdate {
  field: string;
  value: any;
  confidence: number;
  source: string;
}

export const NexusIntelligencePanel: React.FC<NexusIntelligencePanelProps> = ({
  objectType,
  activeRecord,
  pinnedFolders,
  pinnedFiles,
  onUnpinFolder,
  onUnpinFile,
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `I am connected to the ${objectType?.name || 'Nexus'} Intelligence Core. Select records or pin documents to begin autonomous analysis.`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [proposedUpdates, setProposedUpdates] = useState<ProposedUpdate[]>([]);
  
  const documents = useKnowledgeBaseStore(state => state.documents);
  const folders = useKnowledgeBaseStore(state => state.folders);
  const updateRecord = useNexusStore(state => state.updateRecord);

  useEffect(() => {
    if (activeRecord && objectType) {
        setMessages(prev => [
            ...prev,
            {
                id: Date.now().toString(),
                role: 'system',
                content: `Context shifted to ${objectType.name}: ${activeRecord.data[objectType.schemaDefinition.fields.find(f => f.isTitle)?.name || 'id']}`,
                timestamp: new Date()
            }
        ]);
    }
  }, [activeRecord?.id]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulation logic to "walk" folders
    setTimeout(() => {
      let totalFilesToRead = pinnedFiles.length;
      pinnedFolders.forEach(folderId => {
         const fileCount = documents.filter(d => d.folderId === folderId).length;
         totalFilesToRead += fileCount;
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I have scanned the active session context. Analyzing ${totalFilesToRead} total documents ${pinnedFolders.length > 0 ? `across ${pinnedFolders.length} folders` : ''}... I see that you're working on ${activeRecord ? 'a specific record' : 'the full ' + (objectType?.name || 'nexus') + ' set'}. I'm ready to cross-reference these docs for specific discrepancies or gene sequences. How would you like me to proceed?`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSyncMemory = async () => {
    if (!activeRecord || !objectType) return;
    
    setIsSyncing(true);
    setProposedUpdates([]);

    // Artificial delay to simulate "Verbatim Walking" of pinned documents
    setTimeout(() => {
      // Logic to suggest fields that are currently empty or might have updates
      const suggested: ProposedUpdate[] = [];
      const fields = objectType.schemaDefinition.fields;

      fields.forEach(field => {
         const currentValue = activeRecord.data[field.name];
         // Logic simulate: If field is empty, AI "finds" a value in pinned docs
         if (!currentValue) {
            if (field.type === 'date') {
                suggested.push({ 
                    field: field.name, 
                    value: new Date().toISOString().split('T')[0], 
                    confidence: 0.94, 
                    source: pinnedFiles.length > 0 ? 'Pinned Document' : 'Knowledge Base' 
                });
            } else if (field.name.toLowerCase().includes('name') || field.name.toLowerCase().includes('title')) {
                suggested.push({ 
                    field: field.name, 
                    value: "Extracted Verbatim Value", 
                    confidence: 0.88, 
                    source: 'Pinned Folder Context' 
                });
            } else if (field.type === 'select') {
                suggested.push({ 
                    field: field.name, 
                    value: field.options?.[0] || 'active', 
                    confidence: 0.91, 
                    source: 'Pattern Analysis' 
                });
            }
         }

         // SPECIALIZED BIOLAB REASONING: If we are in BioLab and have 3 genes
         if (objectType.industryId === 'biolab' && field.name === 'therapeutic_candidates' && !currentValue) {
            const hasGenes = !!activeRecord.data.gene_1 || !!activeRecord.data.gene_2 || !!activeRecord.data.gene_3;
            if (hasGenes && (pinnedFiles.length > 0 || pinnedFolders.length > 0)) {
                suggested.push({
                    field: field.name,
                    value: "Proposed relief found: Synergistic interference identified via context walk. Recommend interaction study for Gene A + C.",
                    confidence: 0.92,
                    source: 'BioLab Interaction AI'
                });
            }
         }

         if (objectType.industryId === 'biolab' && field.name === 'significance' && (!currentValue || currentValue === 'VUS')) {
             suggested.push({
                 field: field.name,
                 value: 'Likely Pathogenic',
                 confidence: 0.85,
                 source: 'Genomic Pattern Recognition'
             });
         }
      });

      setProposedUpdates(suggested);
      setIsSyncing(false);

      if (suggested.length > 0) {
        setMessages(prev => [
            ...prev, 
            {
                id: Date.now().toString(),
                role: 'assistant',
                content: `I've performed a verbatim walkthrough of your pinned context. I found ${suggested.length} field updates that can be synced to this ${objectType.name} record. Review the proposals below.`,
                timestamp: new Date()
            }
        ]);
      } else {
        setMessages(prev => [
            ...prev, 
            {
                id: Date.now().toString(),
                role: 'assistant',
                content: `I've analyzed the pinned documents but found no new data points to sync for this record. Everything looks up to date!`,
                timestamp: new Date()
            }
        ]);
      }
    }, 2000);
  };

  const applyMemoryUpdate = async () => {
    if (!activeRecord || proposedUpdates.length === 0) return;
    
    const updatedData = { ...activeRecord.data };
    proposedUpdates.forEach(update => {
        updatedData[update.field] = update.value;
    });

    try {
        await updateRecord(activeRecord.id, { data: updatedData });
        setProposedUpdates([]);
        setMessages(prev => [
            ...prev,
            {
                id: Date.now().toString(),
                role: 'system',
                content: `Memory Sync Complete: ${proposedUpdates.length} fields updated permanently in ${objectType?.name || 'Nexus'}.`,
                timestamp: new Date()
            }
        ]);
    } catch (err) {
        console.error('Failed to sync memory:', err);
    }
  };

  return (
    <div className="flex flex-col h-full w-[400px] border-l border-slate-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/40 backdrop-blur-2xl shadow-2xl relative">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-gray-800 flex items-center justify-between bg-slate-50 dark:bg-gray-900/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-gray-100 uppercase tracking-tighter">Nexus Intelligence</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-glow shadow-emerald-500/50"></div>
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Autonomous Shell Core</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-all">
          <X size={20} />
        </button>
      </div>

      {/* Connection Info */}
      <div className="px-4 py-2 bg-slate-100 dark:bg-gray-900/80 border-b border-slate-200 dark:border-gray-800 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">
              <Database size={10} />
              SQL: {objectType?.name || 'NONE'}
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">
              <Zap size={10} className="text-amber-500" />
              RAG: {pinnedFiles.length + pinnedFolders.length} ACTIVE
            </div>
         </div>
          <button 
           onClick={handleSyncMemory}
           disabled={!activeRecord || isSyncing}
           className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-md transition-all flex items-center gap-1.5 px-2"
           title="Sync Memory with Pinned Context"
          >
           {isSyncing ? <RefreshCw size={12} className="animate-spin" /> : <RefreshCw size={12} />}
           <span className="text-[9px] font-bold uppercase tracking-widest">{isSyncing ? 'Syncing...' : 'Sync Memory'}</span>
          </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1.5 px-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {msg.role === 'user' ? 'Operator' : msg.role === 'system' ? 'Nexus Core' : 'Sovereign Intelligence'}
                </span>
                <span className="text-[8px] text-slate-300">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[90%] ${
                msg.role === 'user' 
                  ? 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tr-none shadow-lg' 
                  : msg.role === 'system'
                  ? 'bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono italic text-[10px] w-full'
                  : 'bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-slate-700 dark:text-gray-300 rounded-tl-none shadow-sm'
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          {isTyping && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1.5 p-2 bg-slate-100 dark:bg-gray-900 rounded-full w-fit">
               <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></div>
               <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
               <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
             </motion.div>
          )}

          {/* Proposed Memory Updates UI */}
          {proposedUpdates.length > 0 && (
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="p-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl space-y-3"
             >
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={14} className="text-indigo-500" />
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Proposed Memory Updates</span>
                </div>
                <div className="space-y-2">
                    {proposedUpdates.map((update, idx) => {
                        const field = objectType?.schemaDefinition.fields.find(f => f.name === update.field);
                        return (
                            <div key={idx} className="flex flex-col p-2 bg-white dark:bg-gray-900 border border-indigo-100 dark:border-indigo-900/50 rounded-lg shadow-sm">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{field?.label || update.field}</span>
                                    <span className="text-[8px] bg-emerald-100 text-emerald-600 px-1 py-0.5 rounded uppercase font-bold tracking-tighter">{(update.confidence * 100).toFixed(0)}% Match</span>
                                </div>
                                <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">{update.value}</div>
                                <div className="text-[8px] text-slate-400 mt-1 italic">Source: {update.source}</div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex items-center gap-2 pt-2">
                    <button 
                        onClick={applyMemoryUpdate}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                    >
                        Confirm Sync
                    </button>
                    <button 
                        onClick={() => setProposedUpdates([])}
                        className="px-3 py-2 bg-slate-200 dark:bg-gray-800 text-slate-600 dark:text-gray-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-300 transition-all"
                    >
                        Ignore
                    </button>
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pins / Context Area (Sticky bottom) */}
      {(pinnedFiles.length > 0 || pinnedFolders.length > 0) && (
        <div className="p-3 border-t border-slate-200 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-950/50 backdrop-blur-md">
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
             <Pin size={10} />
             Active Session Power
           </p>
           <div className="flex flex-wrap gap-1.5">
             {pinnedFolders.map(id => {
               const folder = folders.find(f => f.id === id);
               return (
                 <div key={id} className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-[10px] text-slate-600 dark:text-gray-300 font-medium">
                   <Database size={10} />
                   {folder?.name || 'Folder'}
                   <button onClick={() => onUnpinFolder(id)}><X size={10} className="text-slate-400 hover:text-rose-500" /></button>
                 </div>
               );
             })}
             {pinnedFiles.map(id => {
               const doc = documents.find(d => d.id === id);
               return (
                 <div key={id} className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-[10px] text-slate-600 dark:text-gray-300 font-medium">
                   <FileText size={10} />
                   {doc?.title || 'File'}
                   <button onClick={() => onUnpinFile(id)}><X size={10} className="text-slate-400 hover:text-rose-500" /></button>
                 </div>
               );
             })}
           </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-gray-950/50 border-t border-slate-200 dark:border-gray-800">
        <div className="relative group">
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Ask the Nexus Intelligence..."
            className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl py-3 pl-4 pr-12 text-sm text-slate-800 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all min-h-[60px] max-h-[200px] resize-none scrollbar-hide"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-2.5 bottom-2.5 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-30 disabled:shadow-none transition-all active:scale-90"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="flex items-center justify-between mt-3 px-1">
          <div className="flex items-center gap-3">
             <button className="text-slate-400 hover:text-slate-600 transition-colors">
               <Paperclip size={18} />
             </button>
             <button className="text-slate-400 hover:text-indigo-500 transition-colors">
               <Sparkles size={18} />
             </button>
          </div>
          <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600/70 tracking-widest uppercase">
            <ShieldCheck size={12} />
            Encrypted Session
          </div>
        </div>
      </div>
    </div>
  );
};
