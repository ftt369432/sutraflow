import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Activity, Dna, Database, Cpu, Zap, AlertTriangle, Layers, GitBranch, Shield, BookOpen, ChevronLeft, Bot, Save, Loader2, ExternalLink, X, Target } from 'lucide-react';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { MyGeneService, GeneInfo } from '../../services/bio/MyGeneService';
import { MyVariantService, VariantInfo } from '../../services/bio/MyVariantService';
import { ClinicalTrialsService, ClinicalTrial } from '../../services/bio/ClinicalTrialsService';
import { useNotifications } from '../../contexts/NotificationContext';
import { ResearchSynthesizer } from './ResearchSynthesizer';
import { MoleculeGenerator } from './MoleculeGenerator';
import { ProteinViewer } from './ProteinViewer';
import { BioChatPanel } from './BioChatPanel';
import { InteractionLab } from './InteractionLab';
import { GenieDriveTree } from '../geniedrive/GenieDriveTree';
import { ResearchFileViewer } from './ResearchFileViewer';
import { useNexusStore } from '../../store/nexusStore';
import { useAuth } from '../../contexts/AuthContext';
import { getAIService } from '../../services/ai/aiService';
import { aiDriveService, AIDriveFile } from '../../services/drive/aiDriveService';
import { cn } from '../../lib/utils';


export const GeneticsHubPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [geneData, setGeneData] = useState<GeneInfo | null>(null);
  const [variantData, setVariantData] = useState<VariantInfo[]>([]);
  const [clinicalTrials, setClinicalTrials] = useState<ClinicalTrial[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'variants' | 'structural' | 'clinical' | 'autonomous' | 'interaction'>('overview');
  const [attachedFolderIds, setAttachedFolderIds] = useState<string[]>([]);
  const [attachedFileIds, setAttachedFileIds] = useState<string[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<AIDriveFile | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [targetFile, setTargetFile] = useState<AIDriveFile | null>(null);

  // HQ-Style Sidebar State
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'nexus' | 'drive'>('drive');

  // Saved genes tracker
  const [savedGenes, setSavedGenes] = useState<string[]>([]);
  
  const loadDocuments = useKnowledgeBaseStore(state => state.loadDocuments);
  const initialized = useKnowledgeBaseStore(state => state.initialized);
  
  const { records, objectTypes, createRecord, updateRecord } = useNexusStore();
  const biolabRecords = records.filter(r => objectTypes.find(t => t.id === r.objectTypeId)?.industryId === 'biolab');
  
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // Initialize store on mount if not ready
  React.useEffect(() => {
    if (!initialized) {
      loadDocuments().catch(err => {
        console.error('[GeneticsHub] Failed to load Genie Drive context:', err);
      });
    }
  }, [initialized, loadDocuments]);

  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const query = (overrideQuery || searchQuery).trim();
    if (!query) return;

    if (overrideQuery) setSearchQuery(overrideQuery);
    setIsSearching(true);
    
    // Check for multiple genes (comma separated)
    const symbols = query.includes(',') 
      ? query.split(',').map(s => s.trim()).filter(Boolean)
      : [query];

    try {
      if (symbols.length > 1) {
        // BATCH SEARCH MODE
        addNotification({ 
          type: 'info', 
          title: 'Batch Search', 
          message: `Locating ${symbols.length} genomic targets...` 
        });
        
        const results = await Promise.allSettled(symbols.map(s => MyGeneService.searchGenes(s)));
        const foundGenes: GeneInfo[] = [];
        
        results.forEach((res, _i) => {
          if (res.status === 'fulfilled' && res.value && res.value.length > 0) {
            foundGenes.push(res.value[0]);
          }
        });

        if (foundGenes.length > 0) {
          // Add all found genes to session
          const newSymbols = foundGenes.map(g => `${g.symbol} — ${g.name}`);
          setSavedGenes(prev => {
            const unique = [...new Set([...prev, ...newSymbols])];
            return unique;
          });
          
          addNotification({ 
            type: 'success', 
            title: 'Batch Session Initialized', 
            message: `Added ${foundGenes.length} genes to the Interaction Lab.` 
          });
          
          // Switch to Interaction tab to show the list
          setActiveTab('interaction');
          
          // Also set the first one as active in the overview
          setGeneData(foundGenes[0]);
          const variants = await MyVariantService.searchVariants(foundGenes[0].symbol);
          setVariantData(variants);

          const trials = await ClinicalTrialsService.searchTrials(foundGenes[0].symbol);
          setClinicalTrials(trials);
        } else {
          addNotification({ type: 'warning', title: 'Batch Not Found', message: 'None of the provided symbols matched our genomic databases.' });
        }
      } else {
        // SINGLE SEARCH MODE
        const genes = await MyGeneService.searchGenes(symbols[0]);
        if (genes && genes.length > 0) {
          setGeneData(genes[0]);
          addNotification({ type: 'success', title: 'Gene Found', message: `Found data for ${genes[0].symbol}` });
          
          const variants = await MyVariantService.searchVariants(genes[0].symbol);
          setVariantData(variants);

          const trials = await ClinicalTrialsService.searchTrials(genes[0].symbol);
          setClinicalTrials(trials);
        } else {
          setGeneData(null);
          addNotification({ type: 'warning', title: 'Not Found', message: 'No gene found matching that query.' });
        }
      }
    } catch (error) {
      console.error('GeneticsHub search error:', error);
      addNotification({ type: 'error', title: 'API Error', message: 'Failed to connect to biological databases.' });
    } finally {
      setIsSearching(false);
    }
  };

  // No auto-load — user initiates search manually

  const handleSaveToBioLab = async () => {
    if (!geneData) return;
    // Check if gene already saved
    if (savedGenes.includes(geneData.symbol)) {
      addNotification({ type: 'warning', title: 'Already Saved', message: `${geneData.symbol} is already in your BioLab session.` });
      return;
    }

    try {
      // Find the Genetic Sample object type
      const sampleType = objectTypes.find(t => t.name === 'Genetic Sample' && t.industryId === 'biolab');
      if (!sampleType) {
        addNotification({ type: 'error', title: 'BioLab Not Installed', message: 'Please load the BioLab core in Nexus Studio first.' });
        return;
      }

      const recordData: Record<string, any> = {
        label: `Research Session ${new Date().toLocaleDateString()}`,
        genes: [`${geneData.symbol} — ${geneData.name}`],
        source: 'Patient Tissue',
        analysis_status: 'Sequenced'
      };

      // Check if we already have an active session record today to append to, instead of creating a new one every time
      const today = new Date().toLocaleDateString();
      const existingSession = biolabRecords.find(r => r.data.label === `Research Session ${today}`);

      if (existingSession) {
         // Append to existing array
         const currentGenes = Array.isArray(existingSession.data.genes) ? existingSession.data.genes : [];
         await updateRecord(existingSession.id, {
           data: {
             ...existingSession.data,
             genes: [...currentGenes, `${geneData.symbol} — ${geneData.name}`]
           }
         });
         setSavedGenes(prev => [...prev, geneData.symbol]);
         addNotification({ type: 'success', title: 'Saved to BioLab', message: `${geneData.symbol} added to your active BioLab session.` });
         return;
      }

      await createRecord({
        objectTypeId: sampleType.id,
        data: recordData,
        status: 'Active',
        isDeleted: false
      });

      setSavedGenes(prev => [...prev, geneData.symbol]);
      addNotification({ type: 'success', title: 'Saved to BioLab', message: `${geneData.symbol} saved to your Nexus BioLab.` });
    } catch (err) {
      console.error('Failed to save to BioLab:', err);
      addNotification({ type: 'error', title: 'Save Failed', message: 'Could not save gene data to Nexus BioLab.' });
    }
  };

  const handleLoadSession = (record: any) => {
    if (Array.isArray(record.data.genes)) {
      const symbols = record.data.genes.map((g: string) => g.split(' — ')[0]);
      setSavedGenes(symbols);
      setActiveTab('interaction');
      addNotification({ type: 'info', title: 'Session Loaded', message: `Loaded ${symbols.length} genes into Interaction Lab.` });
    }
  };

  const handleGenerateReport = async () => {
    if (!geneData || !user) return;
    
    addNotification({ type: 'info', title: 'Synthesizing Report', message: `Generating autonomous research report for ${geneData.symbol}...` });
    
    try {
      const aiService = await getAIService();
      
      // Build a comprehensive prompt with strict formatting rules
      const prompt = `
        ## PROFESSIONAL BIO-GENOMICS RESEARCH DIRECTIVE
        
        Generate a professional, structured Bio-Genetics Research Report for the gene: **${geneData.symbol}** (${geneData.name}).
        
        ### GENOMIC METADATA:
        - **Gene Symbol**: ${geneData.symbol}
        - **Official Name**: ${geneData.name}
        - **Location**: ${geneData.map_location}
        - **Variant Population**: ${variantData.length} records analyzed
        - **Summary**: ${geneData.summary || 'Summary data currently being indexed.'}
        
        ### MANDATORY REPORT SECTIONS:
        1. **Executive Summary**: High-level therapeutic overview.
        2. **Genomic Context**: Biological function and pathway analysis.
        3. **Pathogenic Risk Analysis**: Clinical significance and variant interpretation.
        4. **Therapeutic Implications**: Precision medicine opportunities and CRISPR/RNAi potential.
        
        ### STRICT FORMATTING INSTRUCTIONS:
        - **NO CHATTY INTRODUCTIONS**: Start immediately with the report Title (H1).
        - **NO INTERNAL TAGS**: Do NOT include <think>, <final>, or JSON blocks. Output ONLY raw Markdown.
        - **PROFESSIONAL TONE**: Use expert medical/biological nomenclature.
        - **STYLING**: Use clean Github-flavored Markdown with bold headers and clear lists.
      `;
      
      let reportContent = await aiService.generateText(prompt, { provider: 'google' });

      // POST-PROCESSING CLEANUP: Strip raw AI artifacts if they leak through
      reportContent = reportContent
        .replace(/<think>[\s\S]*?<\/think>/gi, '') // Remove thinking blocks
        .replace(/<final>[\s\S]*?<\/final>/gi, (match) => {
           // If it's a JSON string inside final, try to prettify it or just keep the text
           return match.replace(/<\/?final>/gi, '');
        })
        .replace(/<investigate>[\s\S]*?<\/investigate>/gi, '') // Remove investigation blocks
        .trim();
      
      setIsGeneratingReport(true);
      
      let uploadedFile: AIDriveFile;
      
      if (targetFile) {
        addNotification({ type: 'info', title: 'Appending Research', message: `Updating established Master Log: ${targetFile.name}...` });
        uploadedFile = await aiDriveService.appendToFileContent(targetFile.id, reportContent);
      } else {
        const reportName = `${geneData.symbol}_Research_Report_${new Date().toISOString().split('T')[0]}.md`;
        uploadedFile = await aiDriveService.uploadFile(user.id, new File([reportContent], reportName, { type: 'text/markdown' }), null);
        
        // Auto-pin new reports
        setAttachedFileIds(prev => [...prev, uploadedFile.id]);
      }
      
      // Auto-open the viewer
      setSelectedFile(uploadedFile);

      addNotification({ 
        type: 'success', 
        title: targetFile ? 'Research Appended' : 'Report Generated', 
        message: targetFile 
          ? `Consolidated findings updated in your Master Log.`
          : `Research for ${geneData.symbol} is ready in your AI Drive.` 
      });
      
      // Open chat automatically to discuss the report
      setIsChatOpen(true);
      
    } catch (error) {
      console.error('Report generation error:', error);
      addNotification({ type: 'error', title: 'Report Failed', message: 'Could not autonomously synthesize or update the research report.' });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">

      {/* ============================================ */}
      {/* HQ-STYLE COLLAPSIBLE SIDEBAR                */}
      {/* ============================================ */}
      <div className={cn(
        "flex border-r border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-950 transition-all duration-300 shrink-0 h-full overflow-hidden",
        isSidebarMinimized ? "w-[52px]" : "w-[280px]"
      )}>
        {/* Slim Icon Strip */}
        <div className="w-[52px] flex flex-col items-center py-3 border-r border-slate-100 dark:border-gray-800/50 bg-white/50 dark:bg-gray-950/50 h-full shrink-0">
          <div className="h-8 flex items-center justify-center mb-6">
            <div 
              className="h-7 w-7 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg cursor-pointer hover:scale-110 transition-transform active:scale-95"
              onClick={() => setIsSidebarMinimized(!isSidebarMinimized)}
            >
              <Dna className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center gap-2">
            <button 
              onClick={() => { setSidebarTab('drive'); setIsSidebarMinimized(false); }}
              className={cn(
                "p-2 rounded-lg transition-all relative group",
                (sidebarTab === 'drive' && !isSidebarMinimized) 
                  ? "bg-white dark:bg-gray-800 text-emerald-600 shadow-sm border border-slate-200 dark:border-gray-700" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <BookOpen className="h-4 w-4" />
              <div className="absolute left-full ml-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded bg-gray-800 text-white text-[10px] whitespace-nowrap pointer-events-none">AI Drive</div>
            </button>

            <button 
              onClick={() => { setSidebarTab('nexus'); setIsSidebarMinimized(false); }}
              className={cn(
                "p-2 rounded-lg transition-all relative group",
                (sidebarTab === 'nexus' && !isSidebarMinimized) 
                  ? "bg-white dark:bg-gray-800 text-indigo-600 shadow-sm border border-slate-200 dark:border-gray-700" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Database className="h-4 w-4" />
              <div className="absolute left-full ml-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded bg-gray-800 text-white text-[10px] whitespace-nowrap pointer-events-none">BioLab Records</div>
            </button>
          </div>

          <div className="mt-auto flex flex-col items-center gap-2 pb-3">
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={cn(
                "p-2 rounded-lg transition-all relative group",
                isChatOpen 
                  ? "bg-emerald-500 text-white shadow-lg" 
                  : "text-slate-400 hover:text-emerald-500"
              )}
            >
              <Bot className="h-4 w-4" />
              <div className="absolute left-full ml-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded bg-gray-800 text-white text-[10px] whitespace-nowrap pointer-events-none">AI Chat</div>
            </button>
          </div>
        </div>

        {/* Expanded Panel */}
        {!isSidebarMinimized && (
          <div className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-gray-950">
            <div className="h-12 px-3 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-950 sticky top-0 z-20">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {sidebarTab === 'drive' ? 'AI Drive / Context' : 'BioLab Records'}
              </h2>
              {sidebarTab === 'drive' && (attachedFileIds.length + attachedFolderIds.length) > 0 && (
                <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  {attachedFileIds.length + attachedFolderIds.length} PINNED
                </span>
              )}
              <button onClick={() => setIsSidebarMinimized(true)} className="p-1 text-slate-400 hover:text-slate-600">
                <ChevronLeft size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* DRIVE TAB */}
              {sidebarTab === 'drive' && (
                <div className="p-2">
                  <div className="px-2 pb-2 mb-2 border-b border-slate-100 dark:border-gray-800">
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Pin files, folders, audio, and research papers to fuel the AI.
                    </p>
                  </div>
                  <GenieDriveTree 
                    onFileSelect={(file) => {
                      setSelectedFile(file);
                      // If the file is markdown, offer to set as target
                      if (file.name.endsWith('.md')) {
                        setTargetFile(file);
                        addNotification({ 
                          type: 'info', 
                          title: 'Target Set', 
                          message: `New research will be appended to: ${file.name}` 
                        });
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
                    selectedFileId={selectedFile?.id || ""}
                    className="text-xs"
                  />
                </div>
              )}

              {/* NEXUS BIOLAB RECORDS TAB */}
              {sidebarTab === 'nexus' && (
                <div className="p-3 space-y-3">
                  <div className="px-1 pb-2 border-b border-slate-100 dark:border-gray-800">
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Saved gene samples from your research. These are stored permanently in your Nexus BioLab database.
                    </p>
                  </div>
                  {biolabRecords.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Database size={32} className="mx-auto mb-3 opacity-20" />
                      <p className="text-xs font-medium">No BioLab records yet</p>
                      <p className="text-[10px] mt-1">Search a gene and click "Save to BioLab"</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {biolabRecords.map(record => (
                        <div key={record.id} className="p-2.5 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl">
                          <div className="text-xs font-bold text-slate-700 dark:text-gray-300 truncate">{record.data.label || 'Untitled Sample'}</div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {Array.isArray(record.data.genes) && record.data.genes.map((val: string, i: number) => (
                              <span key={i} className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md font-bold border border-indigo-100 mb-1">
                                {String(val).split(' — ')[0]}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <div className="text-[9px] text-slate-400">{record.data.analysis_status || 'Pending'}</div>
                            <button 
                              onClick={() => handleLoadSession(record)}
                              className="text-[9px] text-indigo-600 hover:text-indigo-500 font-bold flex items-center gap-1"
                            >
                              Load Session <ChevronLeft size={10} className="rotate-180" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Saved Genes This Session */}
                  {savedGenes.length > 0 && (
                    <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-xl">
                      <h4 className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-2">This Session</h4>
                      <div className="flex flex-wrap gap-1">
                        {savedGenes.map(g => (
                          <span key={g} className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">{g}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* MAIN CONTENT AREA                           */}
      {/* ============================================ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col p-6 pb-0 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
              <Dna className="text-emerald-600 dark:text-emerald-400" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">GenieBio <span className="text-slate-400 dark:text-gray-500 font-normal">| Autonomous Nexus</span></h1>
              <p className="text-sm text-slate-500 dark:text-gray-400">Biological Research & In Silico Engineering</p>
            </div>
          </div>

          <div className="relative flex-1 max-w-2xl group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search human genes, variants, or phenotypes (e.g. LMNA, BRCA1)..."
              className="w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-full py-3.5 pl-11 pr-14 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium shadow-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              onClick={handleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-1.5 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-800/50 transition-colors"
            >
              <Search size={16} />
            </button>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 tracking-wide uppercase">Databases Connected</span>
          </div>

          {(attachedFileIds.length + attachedFolderIds.length) > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-full">
              <BookOpen size={12} className="text-blue-500" />
              <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 tracking-wide uppercase">{attachedFileIds.length + attachedFolderIds.length} Pinned</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {geneData && (
              <Button 
                variant="outline" 
                onClick={handleSaveToBioLab}
                className="border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 h-10 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
              >
                <Save size={14} className="mr-2" />
                Save to BioLab
              </Button>
            )}

            <Button 
              onClick={() => setIsChatOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 px-5 h-10 rounded-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <Activity size={16} className="animate-pulse" />
              Ask AI Agent
            </Button>
          </div>
        </div>

        {/* Bio-Command Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-gray-800 pb-px mt-4">
          {[
            { id: 'overview', icon: Database, label: 'Gene Overview' },
            { id: 'variants', icon: Activity, label: 'Variant Explorer' },
            { id: 'structural', icon: Layers, label: '3D Structure' },
            { id: 'clinical', icon: BookOpen, label: 'Clinical Research' },
            { id: 'autonomous', icon: Cpu, label: 'Autonomous Pipeline' },
            { id: 'interaction', icon: GitBranch, label: 'Interaction Lab', hidden: savedGenes.length === 0 },
          ].map(tab => {
            if (tab.hidden) return null;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200'
                }`}
              >
                <Icon size={16} className={activeTab === tab.id ? 'text-emerald-500' : ''} />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="bio-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col"
            >
              {isSearching ? (
                 <div className="flex-1 flex items-center justify-center">
                   <div className="flex flex-col items-center gap-4">
                     <div className="w-16 h-16 border-4 border-slate-200 dark:border-gray-800 border-t-emerald-500 rounded-full animate-spin"></div>
                     <p className="text-slate-500 dark:text-gray-400 font-medium">Querying Bio-Informatics Networks...</p>
                   </div>
                 </div>
              ) : !geneData ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full">
                  <div className="mb-8 text-center pt-8">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-800 shadow-inner">
                      <Zap className="text-emerald-600 dark:text-emerald-400" size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-3 tracking-tight">Welcome to GenieBio Nexus</h2>
                    <p className="text-slate-500 dark:text-gray-400 max-w-xl mx-auto text-sm">
                      Your autonomous bio-engineering workbench. Search for genes, visualize 3D protein structures, or launch AI-driven research workflows.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-4">
                    <Card className="bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700/50 transition-all cursor-pointer group shadow-sm hover:shadow-md" onClick={() => handleSearch(undefined, 'LMNA')}>
                       <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                         <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-xl group-hover:scale-110 transition-transform"><Search size={24} /></div>
                         <h3 className="font-bold text-slate-800 dark:text-gray-200">Quick Search</h3>
                         <p className="text-xs text-slate-500 dark:text-gray-400">Instantly fetch ClinVar variants, pathways, and AlphaFold structures for any gene. Try LMNA.</p>
                       </CardContent>
                    </Card>
                    <Card className="bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700/50 transition-all cursor-pointer group shadow-sm hover:shadow-md" onClick={() => { setSidebarTab('drive'); setIsSidebarMinimized(false); }}>
                       <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                         <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-500 rounded-xl group-hover:scale-110 transition-transform"><BookOpen size={24} /></div>
                         <h3 className="font-bold text-slate-800 dark:text-gray-200">Link Knowledge</h3>
                         <p className="text-xs text-slate-500 dark:text-gray-400">Pin specific PDFs, research papers, or folders from Genie Drive to set RAG context for the AI.</p>
                       </CardContent>
                    </Card>
                    <Card className="bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700/50 transition-all cursor-pointer group shadow-sm hover:shadow-md" onClick={() => setActiveTab('autonomous')}>
                       <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                         <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-500 rounded-xl group-hover:scale-110 transition-transform"><Cpu size={24} /></div>
                         <h3 className="font-bold text-slate-800 dark:text-gray-200">Auto-Pipelines</h3>
                         <p className="text-xs text-slate-500 dark:text-gray-400">Deploy agents to cross-reference phenotypes against connected cloud labs.</p>
                       </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <>
                  {/* GENE OVERVIEW TAB */}
                  {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                      <div className="lg:col-span-2 flex flex-col gap-6">
                        <Card className="bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800 shadow-sm">
                          <CardHeader className="pb-2 border-b border-slate-100 dark:border-gray-800">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-3xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
                                {geneData.symbol}
                                <span className="text-sm px-2 py-1 bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300 rounded-md font-mono border border-slate-200 dark:border-gray-700">
                                  {geneData.type_of_gene}
                                </span>
                              </CardTitle>
                              <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-2">
                                  {targetFile && (
                                    <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg text-[10px] text-indigo-600 dark:text-indigo-400 font-bold animate-in fade-in slide-in-from-right-2">
                                      <Target size={12} className="animate-pulse" />
                                      Target: {targetFile.name}
                                      <button 
                                        onClick={() => setTargetFile(null)}
                                        className="ml-1 hover:text-rose-500 transition-colors"
                                      >
                                        <X size={10} />
                                      </button>
                                    </div>
                                  )}
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={handleGenerateReport}
                                    disabled={isGeneratingReport}
                                    className={cn(
                                      "border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 dark:hover:bg-emerald-900/20 disabled:opacity-50",
                                      targetFile && "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
                                    )}
                                  >
                                    {isGeneratingReport ? (
                                      <>
                                        <Loader2 size={16} className="mr-2 animate-spin" />
                                        Generating...
                                      </>
                                    ) : (
                                      <>
                                        {targetFile ? <Save size={16} className="mr-2" /> : <GitBranch size={16} className="mr-2" />}
                                        {targetFile ? 'Update Master Log' : 'Generate Report'}
                                      </>
                                    )}
                                  </Button>
                                </div>
                                {!targetFile && attachedFileIds.length > 0 && (
                                  <p className="text-[9px] text-slate-400 italic">Tip: Select a pinned file in the sidebar to use as a Target Log.</p>
                                )}
                              </div>
                            </div>
                            <p className="text-slate-500 dark:text-gray-400 text-lg mt-1">{geneData.name}</p>
                          </CardHeader>
                          <CardContent className="text-slate-700 dark:text-gray-300 leading-relaxed text-sm">
                            {geneData.summary ? (
                              <p>{geneData.summary}</p>
                            ) : (
                              <p className="italic text-slate-500 dark:text-gray-500">No summary available from MyGene.info.</p>
                            )}
                          </CardContent>
                        </Card>

                        <Card className="bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800 shadow-sm">
                          <CardHeader className="pb-2 border-b border-slate-100 dark:border-gray-800">
                            <CardTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-gray-100">
                              <Database className="text-emerald-500" size={18} />
                              Genomic Identity
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-slate-50 dark:bg-gray-950 p-3 rounded-lg border border-slate-100 dark:border-gray-800">
                              <span className="text-xs text-slate-500 dark:text-gray-500 block mb-1">NCBI ID</span>
                              <span className="font-mono text-slate-800 dark:text-emerald-400 font-semibold">{geneData._id}</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-gray-950 p-3 rounded-lg border border-slate-100 dark:border-gray-800">
                              <span className="text-xs text-slate-500 dark:text-gray-500 block mb-1">Symbol</span>
                              <span className="font-mono text-slate-800 dark:text-white font-semibold">{geneData.symbol}</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-gray-950 p-3 rounded-lg border border-slate-100 dark:border-gray-800 col-span-2">
                              <span className="text-xs text-slate-500 dark:text-gray-500 block mb-1">Location</span>
                              <span className="text-slate-800 dark:text-white font-medium">{geneData.map_location} (Chromosome {geneData.genomic_pos?.chr})</span>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800 shadow-sm flex-1 min-h-[300px]">
                          <CardHeader className="pb-2 border-b border-slate-100 dark:border-gray-800">
                            <CardTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-gray-100">
                              <Zap className="text-yellow-500" size={18} />
                              AI Literature Synthesis
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4 pb-4 h-full relative overflow-hidden">
                             <ResearchSynthesizer geneSymbol={geneData.symbol} folderIds={attachedFolderIds} />
                          </CardContent>
                        </Card>
                      </div>

                      <div className="flex flex-col gap-6">
                        <Card className="bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800 shadow-sm h-full">
                          <CardHeader className="pb-2 border-b border-slate-100 dark:border-gray-800">
                            <CardTitle className="text-sm text-slate-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
                              <Shield size={16} />
                              Pathogenic Risk
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="flex flex-col items-center justify-center pt-8 pb-12">
                            <div className="w-32 h-32 rounded-full border-4 border-emerald-500 flex items-center justify-center relative shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                              <div className="absolute inset-0 rounded-full border border-emerald-400 animate-ping opacity-20"></div>
                              <div className="text-center">
                                <div className="text-4xl font-bold text-slate-900 dark:text-white">{variantData.length}</div>
                                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 uppercase tracking-widest">Variants</div>
                              </div>
                            </div>
                            <p className="text-center text-xs text-slate-500 dark:text-gray-500 mt-6 max-w-[200px]">
                              Total identified variants flagged across ClinVar and dbSNP databases.
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {/* AUTONOMOUS PIPELINE TAB */}
                  {activeTab === 'autonomous' && (
                    <div className="h-full flex flex-col gap-6 flex-1">
                      <div className="bg-rose-50 dark:bg-red-950/20 border border-rose-200 dark:border-red-900 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                        <AlertTriangle className="text-rose-500 dark:text-red-500 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                          <h4 className="text-rose-800 dark:text-red-400 font-bold text-sm">Autonomous Bio-Engineering Node</h4>
                          <p className="text-rose-600 dark:text-red-500/80 text-xs mt-1">Hardware integration requires verified IAM credentials.</p>
                        </div>
                      </div>

                      <Card className="flex-1 bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800 overflow-hidden shadow-sm">
                        <CardContent className="p-0 flex h-full">
                          <div className="w-64 border-r border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-950/50 p-6 flex flex-col gap-6">
                            <div>
                              <h3 className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase tracking-wider mb-4">Systems Status</h3>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm px-3 py-2 bg-slate-100 dark:bg-gray-900 rounded-md border border-slate-200 dark:border-gray-800">
                                  <span className="text-slate-700 dark:text-gray-300">AlphaFold 3 Sim</span>
                                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online</span>
                                </div>
                                <div className="flex items-center justify-between text-sm px-3 py-2 bg-slate-100 dark:bg-gray-900 rounded-md border border-slate-200 dark:border-gray-800">
                                  <span className="text-slate-700 dark:text-gray-300">CRISPOR Guide Gen</span>
                                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online</span>
                                </div>
                                <div className="flex items-center justify-between text-sm px-3 py-2 bg-slate-100 dark:bg-gray-900 rounded-md border border-slate-200 dark:border-gray-800 opacity-50">
                                  <span className="text-slate-700 dark:text-gray-300">Cloud Lab API</span>
                                  <span className="text-slate-500 dark:text-gray-500">Offline</span>
                                </div>
                                <div className="flex items-center justify-between text-sm px-3 py-2 bg-slate-100 dark:bg-gray-900 rounded-md border border-slate-200 dark:border-gray-800 opacity-50">
                                  <span className="text-slate-700 dark:text-gray-300">Local Opentrons</span>
                                  <span className="text-slate-500 dark:text-gray-500">Disconnected</span>
                                </div>
                              </div>
                            </div>
                            <Button className="mt-auto bg-slate-800 hover:bg-slate-700 text-slate-100 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 border border-slate-700 dark:border-gray-700">
                              Configure APIs
                            </Button>
                          </div>

                          <div className="flex-1 p-8 flex flex-col bg-slate-50 dark:bg-gray-950/50">
                             <MoleculeGenerator />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* STRUCTURAL TAB */}
                  {activeTab === 'structural' && (
                    <div className="h-full flex flex-col gap-6 flex-1">
                      <div className="flex-1 min-h-[500px]">
                        <ProteinViewer pdbId="1IFR" />
                      </div>
                    </div>
                  )}

                   {activeTab === 'variants' && (
                    <div className="h-full flex items-center justify-center border border-dashed border-slate-300 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900/20 text-slate-500 dark:text-gray-500 shadow-sm flex-1">
                       <p>Module loading... Advanced visualization packages required.</p>
                    </div>
                  )}

                   {/* CLINICAL RESEARCH TAB */}
                  {activeTab === 'clinical' && (
                    <div className="space-y-6 flex-1 overflow-auto">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                            <BookOpen className="text-emerald-500" />
                            Clinical Intelligence
                            <span className="text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full">{clinicalTrials.length} TRIALS FOUND</span>
                          </h2>
                          <p className="text-sm text-slate-500 mt-1">Direct synchronization with clinicaltrials.gov for {geneData?.symbol}.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 pb-12">
                        {clinicalTrials.length === 0 ? (
                          <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-gray-800 rounded-3xl text-slate-400 bg-slate-50/50 dark:bg-gray-900/50">
                             <Activity className="mb-4 opacity-20" size={48} />
                             <p>No active clinical trials detected for this locus.</p>
                          </div>
                        ) : (
                          clinicalTrials.map((trial) => (
                            <Card key={trial.nctId} className="border-slate-200 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-900 transition-all shadow-sm">
                              <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50 dark:bg-gray-950/50 rounded-t-2xl">
                                <div className="overflow-hidden">
                                  <CardTitle className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 truncate">{trial.briefTitle}</CardTitle>
                                  <div className="flex gap-2 mt-1">
                                    <span className="text-[10px] bg-slate-200 dark:bg-gray-800 text-slate-600 dark:text-gray-400 px-2 py-0.5 rounded-full font-bold">{trial.nctId}</span>
                                    <span className={cn(
                                      "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                                      trial.status?.toLowerCase().includes('recruiting') ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-gray-800 dark:text-gray-400"
                                    )}>
                                      {trial.status}
                                    </span>
                                  </div>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="shrink-0 border-slate-200 dark:border-gray-700" 
                                  onClick={() => window.open(`https://clinicaltrials.gov/study/${trial.nctId}`, '_blank')}
                                >
                                  <ExternalLink size={14} />
                                </Button>
                              </CardHeader>
                              <CardContent className="pt-4">
                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">Phase</span>
                                      <p className="text-xs font-semibold text-slate-600 dark:text-gray-300">{trial.phase?.join(', ') || 'N/A'}</p>
                                    </div>
                                    <div className="md:col-span-2 space-y-1">
                                      <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">Primary Intervention</span>
                                      <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 truncate" title={trial.interventions?.join(', ')}>
                                        {trial.interventions?.join(', ') || 'N/A'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">Conditions Studied</span>
                                    <div className="flex flex-wrap gap-1">
                                      {trial.conditions?.slice(0, 5).map((cond, i) => (
                                        <span key={`${trial.nctId}-cond-${i}`} className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-[10px] border border-blue-100 dark:border-blue-800">
                                          {cond}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* INTERACTION LAB TAB */}
                  {activeTab === 'interaction' && (
                    <InteractionLab 
                      savedGenes={savedGenes} 
                      onRemoveGene={(s) => setSavedGenes(prev => prev.filter(g => g !== s))}
                      onViewGene={(s) => {
                        handleSearch(undefined, s);
                        setActiveTab('overview');
                      }}
                      onReportGenerated={(file) => setSelectedFile(file)}
                    />
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Research File Viewer Overlay */}
      <AnimatePresence>
        {selectedFile && (
          <ResearchFileViewer 
            file={selectedFile} 
            onClose={() => setSelectedFile(null)} 
            onPin={(file) => {
              if (attachedFileIds.includes(file.id)) {
                setAttachedFileIds(prev => prev.filter(id => id !== file.id));
              } else {
                setAttachedFileIds(prev => [...prev, file.id]);
              }
            }}
            isPinned={attachedFileIds.includes(selectedFile.id)}
          />
        )}
      </AnimatePresence>

      {/* Integrated AI Chat Panel */}
      <BioChatPanel 
        geneData={geneData} 
        variantData={variantData} 
        attachedFolderIds={attachedFolderIds} 
        attachedFileIds={attachedFileIds} 
        savedGenes={savedGenes}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
    </div>
  );
};
