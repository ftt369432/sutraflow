import React, { useState, useEffect } from 'react';
import { useNexusStore } from '../store/nexusStore';
import { NEXUS_TEMPLATES, NexusTemplate } from '../constants/nexusTemplates';
import { NexusGridView } from '../components/nexus/NexusGridView';
import { 
  Plus, 
  Briefcase, 
  Activity, 
  Settings, 
  ChevronRight, 
  ChevronLeft,
  History,
  LayoutDashboard,
  Database,
  ShieldCheck,
  Globe,
  Zap,
  Cpu,
  BookOpen,
  Bot,
  MessageCircle,
  Dna
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GenieDriveTree } from '../components/geniedrive/GenieDriveTree';
import { NexusIntelligencePanel } from '../components/nexus/NexusIntelligencePanel';
import { useKnowledgeBaseStore } from '../store/knowledgeBaseStore';
import { cn } from '../lib/utils';

export const NexusStudioPage: React.FC = () => {
  const { 
    objectTypes, 
    records, 
    initialize, 
    initialized,
    createObjectType, 
    createRecord, 
    deleteRecord,
    loading 
  } = useNexusStore();

  const [selectedIndustry, setSelectedIndustry] = useState<'legal' | 'medical' | 'biolab' | null>(null);
  const [activeTypeId, setActiveTypeId] = useState<string | null>(null);
  const [activeRecord, setActiveRecord] = useState<any | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // HQ-Style Sidebar State
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'objects' | 'knowledge' | 'settings'>('objects');

  // Intelligence Panel State
  const [isIntelligencePanelOpen, setIsIntelligencePanelOpen] = useState(false);

  // Pinning State
  const [attachedFolderIds, setAttachedFolderIds] = useState<string[]>([]);
  const [attachedFileIds, setAttachedFileIds] = useState<string[]>([]);

  const loadDocuments = useKnowledgeBaseStore(state => state.loadDocuments);
  const kbInitialized = useKnowledgeBaseStore(state => state.initialized);
  
  useEffect(() => {
    initialize();
    if (!kbInitialized) loadDocuments();
  }, [kbInitialized]);

  // Set first object type as active by default if industry is selected
  useEffect(() => {
    if (selectedIndustry && !activeTypeId) {
      const type = objectTypes.find(t => t.industryId === selectedIndustry);
      if (type) setActiveTypeId(type.id);
    }
  }, [selectedIndustry, objectTypes, activeTypeId]);

  const handleInstallTemplate = async (template: NexusTemplate) => {
    setIsInitializing(true);
    try {
      for (const type of template.objectTypes) {
        if (!objectTypes.some(t => t.name === type.name && t.industryId === template.industryId)) {
          await createObjectType(type);
        }
      }
      setSelectedIndustry(template.industryId as 'legal' | 'medical');
    } catch (err) {
      console.error('Failed to install template:', err);
    } finally {
      setIsInitializing(false);
    }
  };

  const activeType = objectTypes.find(t => t.id === activeTypeId);
  const activeRecords = records.filter(r => r.objectTypeId === activeTypeId);

  if (loading && !initialized) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">COMMUNICATION LINK ESTABLISHED... SYNCING NEXUS CORES</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#020617] text-slate-900 dark:text-slate-100 overflow-hidden font-inter relative">
      
      {/* ============================================ */}
      {/* HQ-STYLE COLLAPSIBLE SIDEBAR                */}
      {/* ============================================ */}

      {/* Sidebar Toggle Button (HQ-style edge button) */}
      <button
        className={cn(
          "absolute top-1/2 -translate-y-1/2 z-50 h-8 w-4 rounded-r-none border border-l-0 bg-white/80 backdrop-blur shadow-sm hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700 transition-all",
          isSidebarMinimized ? "left-[60px] rounded-r-md" : "left-[320px] rounded-r-md"
        )}
        onClick={() => setIsSidebarMinimized(!isSidebarMinimized)}
      >
        {isSidebarMinimized ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className={cn(
        "flex border-r border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-950 transition-all duration-300 shrink-0 h-full overflow-hidden",
        isSidebarMinimized ? "w-[60px]" : "w-[320px]"
      )}>
        
        {/* Slim Activity Bar (Icon Strip) */}
        <div className="w-[60px] flex flex-col items-center py-4 border-r border-slate-200 dark:border-gray-800 bg-slate-100/30 dark:bg-gray-950/50 h-full shrink-0">
          {/* Logo */}
          <div className="h-10 flex items-center justify-center mb-8">
            <div 
              className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-200 cursor-pointer hover:scale-110 transition-transform active:scale-95"
              onClick={() => setIsSidebarMinimized(!isSidebarMinimized)}
            >
              <Cpu className="h-4 w-4" />
            </div>
          </div>

          {/* Tab Buttons */}
          <div className="flex-1 flex flex-col items-center gap-3">
            <button 
              onClick={() => { setSidebarTab('objects'); setIsSidebarMinimized(false); }}
              className={cn(
                "p-2 rounded-lg transition-all relative group",
                (sidebarTab === 'objects' && !isSidebarMinimized) 
                  ? "bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 shadow-sm border border-slate-200 dark:border-gray-700" 
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-gray-300"
              )}
            >
              <Database className="h-5 w-5" />
              <div className="absolute left-full ml-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded bg-gray-800 text-white text-xs whitespace-nowrap pointer-events-none">
                Nexus Objects
              </div>
            </button>

            <button 
              onClick={() => { setSidebarTab('knowledge'); setIsSidebarMinimized(false); }}
              className={cn(
                "p-2 rounded-lg transition-all relative group",
                (sidebarTab === 'knowledge' && !isSidebarMinimized) 
                  ? "bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 shadow-sm border border-slate-200 dark:border-gray-700" 
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-gray-300"
              )}
            >
              <BookOpen className="h-5 w-5" />
              <div className="absolute left-full ml-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded bg-gray-800 text-white text-xs whitespace-nowrap pointer-events-none">
                AI Drive / Pin Context
              </div>
            </button>
          </div>

          {/* Bottom Icons */}
          <div className="mt-auto flex flex-col items-center gap-3 pb-4">
            <button 
              onClick={() => setIsIntelligencePanelOpen(!isIntelligencePanelOpen)}
              className={cn(
                "p-2 rounded-lg transition-all relative group",
                isIntelligencePanelOpen 
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50" 
                  : "text-slate-400 hover:text-indigo-500"
              )}
            >
              <MessageCircle className="h-5 w-5" />
              <div className="absolute left-full ml-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded bg-gray-800 text-white text-xs whitespace-nowrap pointer-events-none">
                Intelligence Chat
              </div>
            </button>

            <button 
              onClick={() => { setSidebarTab('settings'); setIsSidebarMinimized(false); }}
              className={cn(
                "p-2 rounded-lg transition-all relative group",
                (sidebarTab === 'settings' && !isSidebarMinimized) 
                  ? "bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 shadow-sm border border-slate-200 dark:border-gray-700" 
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-gray-300"
              )}
            >
              <Settings className="h-5 w-5" />
              <div className="absolute left-full ml-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded bg-gray-800 text-white text-xs whitespace-nowrap pointer-events-none">
                Nexus Settings
              </div>
            </button>
          </div>
        </div>

        {/* Expanded Panel (Content based on active tab) */}
        {!isSidebarMinimized && (
          <div className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-gray-950 animate-in slide-in-from-left duration-300">
            {/* Panel Header */}
            <div className="h-14 px-4 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-950 sticky top-0 z-20">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500">
                {sidebarTab === 'objects' ? 'Nexus Objects' : sidebarTab === 'knowledge' ? 'Context Browser' : 'Settings'}
              </h2>
              {sidebarTab === 'knowledge' && (attachedFileIds.length + attachedFolderIds.length) > 0 && (
                <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/50">
                  {attachedFileIds.length + attachedFolderIds.length} ACTIVE
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* ========== OBJECTS TAB ========== */}
              {sidebarTab === 'objects' && (
                <div className="p-4 space-y-8 pb-10">
                  {/* Nexus Studio Branding */}
                  <div className="flex items-center gap-3 bg-slate-50/50 dark:bg-gray-900/30 p-3 rounded-2xl border border-slate-100/50 dark:border-gray-800/50">
                    <div className="p-2 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-500/30">
                      <Cpu size={18} className="text-white" />
                    </div>
                    <div>
                      <h1 className="text-sm font-bold tracking-tight">Nexus Studio</h1>
                      <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest">Sovereign Build System</p>
                    </div>
                  </div>

                  {/* Industry Chooser */}
                  <div>
                    <h3 className="px-1 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-4">Core Industries</h3>
                    <div className="flex flex-col gap-1.5">
                      <button 
                        onClick={() => setSelectedIndustry('legal')}
                        className={cn(
                          "flex items-center justify-between px-3.5 py-3 rounded-xl transition-all text-xs group",
                          selectedIndustry === 'legal' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm font-bold' 
                            : 'hover:bg-slate-50 dark:hover:bg-gray-900/50 text-slate-500 dark:text-gray-400 border border-transparent'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Briefcase size={14} className={cn(selectedIndustry === 'legal' ? "text-emerald-500" : "text-slate-400 group-hover:text-slate-600")} />
                          <span className="truncate max-w-[140px]">Legal Case Management</span>
                        </div>
                        {selectedIndustry === 'legal' && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-glow shadow-emerald-500/50"></div>}
                      </button>
                      <button 
                        onClick={() => setSelectedIndustry('medical')}
                        className={cn(
                          "flex items-center justify-between px-3.5 py-3 rounded-xl transition-all text-xs group",
                          selectedIndustry === 'medical' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm font-bold' 
                            : 'hover:bg-slate-50 dark:hover:bg-gray-900/50 text-slate-500 dark:text-gray-400 border border-transparent'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Activity size={14} className={cn(selectedIndustry === 'medical' ? "text-emerald-500" : "text-slate-400 group-hover:text-slate-600")} />
                          <span className="truncate max-w-[140px]">Medical Operations</span>
                        </div>
                        {selectedIndustry === 'medical' && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-glow shadow-emerald-500/50"></div>}
                      </button>
                      <button 
                        onClick={() => setSelectedIndustry('biolab')}
                        className={cn(
                          "flex items-center justify-between px-3.5 py-3 rounded-xl transition-all text-xs group",
                          selectedIndustry === 'biolab' 
                            ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-sm font-bold' 
                            : 'hover:bg-slate-50 dark:hover:bg-gray-900/50 text-slate-500 dark:text-gray-400 border border-transparent'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Dna size={14} className={cn(selectedIndustry === 'biolab' ? "text-indigo-500" : "text-slate-400 group-hover:text-slate-600")} />
                          <span className="truncate max-w-[140px]">Sovereign BioLab Hub</span>
                        </div>
                        {selectedIndustry === 'biolab' && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shadow-glow shadow-indigo-500/50"></div>}
                      </button>
                    </div>
                  </div>

                  {/* Object List */}
                  {selectedIndustry && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <h3 className="px-1 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-4">Schema Objects</h3>
                      <div className="flex flex-col gap-1">
                        {objectTypes.filter(t => t.industryId === selectedIndustry).map(type => (
                          <button 
                            key={type.id}
                            onClick={() => setActiveTypeId(type.id)}
                            className={cn(
                              "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] transition-all",
                              activeTypeId === type.id 
                                ? 'bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-100 shadow-md border border-slate-200/50 dark:border-gray-800 font-semibold translate-x-1' 
                                : 'text-slate-500 hover:text-slate-800 dark:text-gray-500 dark:hover:text-gray-300'
                            )}
                          >
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              activeTypeId === type.id ? "bg-emerald-500" : "bg-slate-300 dark:bg-gray-700"
                            )} />
                            {type.name}
                            <span className={cn(
                              "ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                              activeTypeId === type.id ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30" : "bg-slate-100 dark:bg-gray-800 text-slate-400"
                            )}>
                              {records.filter(r => r.objectTypeId === type.id).length}
                            </span>
                          </button>
                        ))}
                        <button className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] text-slate-400 hover:text-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10 transition-all group font-medium border border-transparent border-dashed hover:border-emerald-500/20">
                          <Plus size={14} className="opacity-50 group-hover:opacity-100" />
                          Define New Object
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* System Info */}
                  <div className="mt-auto pt-4">
                    <div className="p-3 bg-slate-50 dark:bg-gray-900/50 rounded-xl border border-slate-100 dark:border-gray-800/50 space-y-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={12} className="text-emerald-500" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400">Security: SOVEREIGN</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe size={12} className="text-blue-500" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400">Sync: GLOBAL MESH</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap size={12} className="text-amber-500" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400">AI: EVOLVED</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========== KNOWLEDGE / DRIVE TAB ========== */}
              {sidebarTab === 'knowledge' && (
                <div className="p-2">
                  <div className="px-2 pb-3 mb-2 border-b border-slate-100 dark:border-gray-800">
                    <p className="text-[10px] text-slate-500 dark:text-gray-400 leading-relaxed">
                      Select files and folders from your <strong>Genie Drive</strong> to fuel the Nexus Intelligence. Pinned items become active context for AI analysis.
                    </p>
                  </div>
                  <GenieDriveTree 
                    onFileSelect={(file) => {
                      if (attachedFileIds.includes(file.id)) {
                        setAttachedFileIds(prev => prev.filter(id => id !== file.id));
                      } else {
                        setAttachedFileIds(prev => [...prev, file.id]);
                      }
                    }}
                    onPin={(item) => {
                      const isFolder = !('extension' in item);
                      if (isFolder) {
                        if (attachedFolderIds.includes(item.id)) setAttachedFolderIds(prev => prev.filter(id => id !== item.id));
                        else setAttachedFolderIds(prev => [...prev, item.id]);
                      } else {
                        if (attachedFileIds.includes(item.id)) setAttachedFileIds(prev => prev.filter(id => id !== item.id));
                        else setAttachedFileIds(prev => [...prev, item.id]);
                      }
                    }}
                    selectedFileId=""
                    className="text-xs"
                  />
                </div>
              )}

              {/* ========== SETTINGS TAB ========== */}
              {sidebarTab === 'settings' && (
                <div className="p-4 space-y-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nexus Configuration</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-900 rounded-xl border border-slate-100 dark:border-gray-800">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 dark:text-gray-300">Auto-Populate Fields</span>
                        <span className="text-[10px] text-slate-400 dark:text-gray-500">AI fills missing data from documents</span>
                      </div>
                      <div className="w-8 h-5 bg-emerald-500 rounded-full relative cursor-pointer">
                        <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-900 rounded-xl border border-slate-100 dark:border-gray-800">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 dark:text-gray-300">Anomaly Detection</span>
                        <span className="text-[10px] text-slate-400 dark:text-gray-500">Flag discrepancies automatically</span>
                      </div>
                      <div className="w-8 h-5 bg-emerald-500 rounded-full relative cursor-pointer">
                        <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-900 rounded-xl border border-slate-100 dark:border-gray-800">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 dark:text-gray-300">Workflow Triggers</span>
                        <span className="text-[10px] text-slate-400 dark:text-gray-500">Agentic actions on record changes</span>
                      </div>
                      <div className="w-8 h-5 bg-slate-300 dark:bg-gray-700 rounded-full relative cursor-pointer">
                        <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Bar (like HQ's Resource Monitor area) */}
            <div className="p-3 border-t border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-900/50 flex flex-col gap-1">
              <button 
                onClick={() => setIsIntelligencePanelOpen(!isIntelligencePanelOpen)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-[11px] font-semibold",
                  isIntelligencePanelOpen 
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                    : "text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-800"
                )}
              >
                <Bot className="h-4 w-4" />
                Intelligence Panel
                {isIntelligencePanelOpen && <span className="ml-auto text-[8px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full">LIVE</span>}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* MAIN CONTENT AREA                           */}
      {/* ============================================ */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-[#020617] relative">
        
        {/* Top Navigation Bar */}
        <header className="h-14 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between shrink-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md sticky top-0 z-10 px-6">
          <div className="flex items-center gap-2 text-sm">
            <LayoutDashboard size={14} className="text-slate-400" />
            <span className="text-slate-400">Nexus Studio</span>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="font-bold text-slate-800 dark:text-gray-200 capitalize">{selectedIndustry || 'Select Industry'}</span>
            {activeType && (
              <>
                <ChevronRight size={14} className="text-slate-300" />
                <span className="px-2 py-0.5 bg-slate-200 dark:bg-gray-800 rounded-md text-slate-700 dark:text-gray-300 text-xs font-bold uppercase tracking-widest">{activeType.name}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-gray-200 transition-all text-sm font-bold">
              <History size={16} />
              Revert Changes
            </button>
            <div className="w-px h-4 bg-slate-200 dark:border-gray-800"></div>
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm tracking-widest">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
              OPERATIONAL
            </div>
          </div>
        </header>

        {/* Main Workspace */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col p-6 overflow-hidden min-w-0">
            <AnimatePresence mode="wait">
              {!selectedIndustry ? (
                <motion.div 
                  key="industry-chooser"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="flex-1 flex flex-col items-center justify-center gap-12"
                >
                  <div className="text-center max-w-2xl px-4">
                    <h1 className="text-4xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-500 bg-clip-text text-transparent">Nexus Industry Selection</h1>
                    <p className="text-lg text-slate-500 dark:text-gray-400">Choose your domain core to load industry-specific schemas, visualizers, and agentic workflows.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
                    {Object.values(NEXUS_TEMPLATES).map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleInstallTemplate(template)}
                        disabled={isInitializing}
                        className="group relative flex flex-col bg-white dark:bg-gray-900 rounded-3xl p-8 border border-slate-200 dark:border-gray-800 shadow-2xl shadow-slate-200/50 dark:shadow-none hover:border-emerald-500/50 transition-all hover:scale-[1.02] text-left"
                      >
                        <div className="absolute top-4 right-4 p-2 bg-emerald-500/10 text-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Zap size={20} />
                        </div>
                        <div className={`p-4 rounded-2xl mb-6 text-white bg-gradient-to-br ${
                          template.industryId === 'legal' ? 'from-slate-800 to-indigo-900' : 
                          template.industryId === 'medical' ? 'from-emerald-600 to-teal-500' :
                          'from-indigo-600 to-purple-500'
                        } shadow-lg`}>
                          {template.industryId === 'legal' ? <Briefcase size={32} /> : 
                           template.industryId === 'medical' ? <Activity size={32} /> :
                           <Dna size={32} />}
                        </div>
                        <h2 className="text-2xl font-bold mb-3">{template.name}</h2>
                        <p className="text-slate-500 dark:text-gray-400 mb-8 leading-relaxed">{template.description}</p>
                        
                        <div className="mt-auto flex items-center gap-2">
                           <div className="flex -space-x-2">
                             <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-gray-800 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] font-bold">GRID</div>
                             <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-gray-800 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] font-bold">MAP</div>
                             <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-gray-800 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] font-bold">AI</div>
                           </div>
                           <span className="text-xs font-bold text-slate-400 dark:text-gray-500 ml-2 uppercase tracking-widest">3 Workflows • {template.objectTypes.length} Objects</span>
                        </div>

                        <div className="absolute bottom-6 right-8 text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                          {isInitializing ? 'INITIALIZING...' : 'LOAD CORE'}
                          <ChevronRight size={18} />
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 px-6 py-2 bg-slate-200/50 dark:bg-gray-900/50 rounded-full text-xs font-bold text-slate-400 dark:text-gray-600 tracking-widest uppercase">
                    <Database size={14} />
                    Nexus Mesh Online • Cloud Sync Active
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="nexus-viewer"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex-1 min-h-0"
                >
                  {activeType ? (
                    <NexusGridView 
                      objectType={activeType}
                      records={activeRecords}
                      onAddClick={() => {
                        const recordData: any = {};
                        activeType.schemaDefinition.fields.forEach(f => {
                           recordData[f.name] = f.defaultValue || '';
                        });
                        createRecord({
                            objectTypeId: activeType.id,
                            data: recordData,
                            status: 'Active',
                            isDeleted: false
                        });
                      }}
                      onEditClick={(record) => {
                         alert(`Editing ${record.id}`);
                      }}
                      onDeleteClick={(id) => deleteRecord(id)}
                      onRecordClick={(record) => {
                        setActiveRecord(record);
                      }}
                    />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center h-full gap-4 text-slate-400 border-2 border-dashed border-slate-200 dark:border-gray-800 rounded-3xl">
                      <Database size={48} className="opacity-20" />
                      <p className="font-bold uppercase tracking-widest text-xs">Awaiting Object Selection</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ============================================ */}
          {/* INTELLIGENCE PANEL (RIGHT SIDE)             */}
          {/* ============================================ */}
          <AnimatePresence>
            {isIntelligencePanelOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 400, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="shrink-0 overflow-hidden"
              >
                <NexusIntelligencePanel 
                   objectType={activeType}
                   activeRecord={activeRecord}
                   pinnedFiles={attachedFileIds}
                   pinnedFolders={attachedFolderIds}
                   onUnpinFile={(id) => setAttachedFileIds(prev => prev.filter(f => f !== id))}
                   onUnpinFolder={(id) => setAttachedFolderIds(prev => prev.filter(f => f !== id))}
                   onClose={() => setIsIntelligencePanelOpen(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
};
