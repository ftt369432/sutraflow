import React, { useState, useEffect, useRef } from 'react';
import { 
  Scale, 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  FolderPlus,
  Folder,
  Plus,
  Search,
  Check
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { caseStateHarvester, CaseState } from '../../services/legal/CaseStateHarvester';
import { switchAIProvider, getCurrentAIProvider, type AIProvider } from '../../services/ai/aiServiceFactory';

interface ExecutiveCommandBarProps {
  className?: string;
  activeDocContent?: string;
  onDraftGenerated?: (content: string, title: string) => void;
  onPostChatMessage?: (message: string, isUser?: boolean) => void;
}

export const ExecutiveCommandBar: React.FC<ExecutiveCommandBarProps> = ({
  className,
  activeDocContent = '',
  onPostChatMessage
}) => {
  const [provider, setProvider] = useState<AIProvider>(() => getCurrentAIProvider());
  const [activeCase, setActiveCase] = useState<CaseState>(() => caseStateHarvester.getActiveCaseState());
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMatterPickerOpen, setIsMatterPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCustomMatterModalOpen, setIsCustomMatterModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newEamsNumber, setNewEamsNumber] = useState('');
  const [newEmployer, setNewEmployer] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to CaseStateHarvester updates
  useEffect(() => {
    const unsubscribe = caseStateHarvester.subscribe((updatedCase) => {
      setActiveCase(updatedCase);
    });
    return unsubscribe;
  }, []);

  // Auto-detect case when activeDocContent changes
  useEffect(() => {
    if (activeDocContent && activeDocContent.length > 100) {
      const isApplicantMentioned = activeDocContent.includes('Applicant') || 
                                   activeDocContent.includes('ADJ') || 
                                   activeDocContent.includes('Injured Worker');
      if (isApplicantMentioned) {
        const harvested = caseStateHarvester.harvestFromText(activeDocContent);
        if (harvested && harvested.applicantName !== 'Active Client Matter') {
          // If the parsed document corresponds to a different client, register and activate it
          if (harvested.id !== activeCase.id && harvested.applicantName !== activeCase.applicantName) {
            caseStateHarvester.setActiveCase(harvested);
          }
        }
      }
    }
  }, [activeDocContent]);

  const handleProviderToggle = (newProvider: AIProvider) => {
    try {
      switchAIProvider(newProvider);
      setProvider(newProvider);
    } catch (err) {
      console.error('Failed to switch AI provider:', err);
    }
  };

  const handleSelectCase = (caseId: string) => {
    const selected = caseStateHarvester.setActiveCase(caseId);
    setActiveCase(selected);
    setIsMatterPickerOpen(false);
    if (onPostChatMessage) {
      onPostChatMessage(`📂 Switched active client matter to: **${selected.applicantName}** (${selected.eamsNumber})`, false);
    }
  };

  const handleCreateCustomMatter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const customCase: CaseState = {
      id: newClientName.replace(/[^A-Za-z0-9]/g, '_').toUpperCase(),
      applicantName: newClientName.trim(),
      eamsNumber: newEamsNumber.trim() || 'ADJ Pending',
      employer: newEmployer.trim() || 'Employer of Record',
      dateOfInjury: 'CT Period',
      injuries: ['Industrial Injury / Work-Related Conditions'],
      applicantCounsel: 'Law Offices of Applicant Counsel, A P.L.C.',
      verifiedDefensesOmissions: ['Statutory notice compliance audit active']
    };

    caseStateHarvester.registerCase(customCase);
    caseStateHarvester.setActiveCase(customCase);
    setIsCustomMatterModalOpen(false);
    setIsMatterPickerOpen(false);
    setNewClientName('');
    setNewEamsNumber('');
    setNewEmployer('');
    if (onPostChatMessage) {
      onPostChatMessage(`✅ Loaded new client matter: **${customCase.applicantName}** (${customCase.eamsNumber})`, false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const harvested = caseStateHarvester.harvestFromText(text, file.name.replace(/\.[^/.]+$/, ''));
        caseStateHarvester.setActiveCase(harvested);
        setIsMatterPickerOpen(false);
        if (onPostChatMessage) {
          onPostChatMessage(`📄 Harvested client file **${file.name}** -> Active matter: **${harvested.applicantName}** (${harvested.eamsNumber})`, false);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleOpenFolder = async () => {
    // 1. Check Electron native folder dialog
    const electronBridge = (window as any).electronBridge;
    if (electronBridge?.dialog?.openFolder && electronBridge?.fs?.listFiles) {
      try {
        const dialogRes = await electronBridge.dialog.openFolder();
        if (dialogRes?.success && dialogRes.paths?.[0]) {
          const folderPath = dialogRes.paths[0];
          const listRes = await electronBridge.fs.listFiles({ path: folderPath });
          const files = listRes.success ? listRes.files || [] : [];
          
          // Read up to 10 readable text/brief files to ground the case
          let aggregatedText = '';
          const textFiles = files.filter((f: any) => !f.isDirectory && /\.(md|txt|json)$/i.test(f.name));
          
          for (const f of textFiles.slice(0, 10)) {
            try {
              const readRes = await electronBridge.fs.readFile({ path: f.path });
              if (readRes.success && readRes.content) {
                aggregatedText += `\n--- File: ${f.name} ---\n${readRes.content}\n`;
              }
            } catch (_err) {}
          }

          const folderName = folderPath.split(/[/\\]/).pop() || 'Client Workspace';
          const harvested = caseStateHarvester.harvestFromText(aggregatedText, folderName);
          harvested.folderPath = folderPath;
          harvested.fileList = files.map((f: any) => f.name);
          
          caseStateHarvester.registerCase(harvested);
          caseStateHarvester.setActiveCase(harvested);
          setIsMatterPickerOpen(false);

          if (onPostChatMessage) {
            onPostChatMessage(
              `📁 **Client Matter Workspace Loaded**\n\n` +
              `* **Folder:** \`${folderPath}\`\n` +
              `* **Active Matter:** **${harvested.applicantName}** (${harvested.eamsNumber})\n` +
              `* **Indexed Documents:** ${files.length} items (${textFiles.length} parsed text briefs)\n\n` +
              `*Legal Eagle is now grounded on this client workspace.*`,
              false
            );
          }
        }
      } catch (err) {
        console.warn('Electron folder picker error:', err);
      }
      return;
    }

    // 2. Web fallback (directory input element) - only invoked synchronously if not in Electron
    folderInputRef.current?.click();
  };

  const handleFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const folderName = fileList[0]?.webkitRelativePath?.split('/')[0] || 'Client Workspace';
    const readableFiles = fileList.filter(f => /\.(md|txt|json)$/i.test(f.name));

    if (readableFiles.length === 0) {
      const customCase: CaseState = {
        id: folderName.replace(/[^A-Za-z0-9]/g, '_').toUpperCase(),
        applicantName: folderName.replace(/[_-]+/g, ' '),
        eamsNumber: 'ADJ Pending',
        employer: 'Employer of Record',
        dateOfInjury: 'CT Period',
        injuries: ['Work-Related Conditions'],
        folderPath: folderName,
        fileList: fileList.map(f => f.name)
      };
      caseStateHarvester.registerCase(customCase);
      caseStateHarvester.setActiveCase(customCase);
      setIsMatterPickerOpen(false);
      if (onPostChatMessage) {
        onPostChatMessage(`📁 **Loaded Client Workspace:** **${folderName}** (${fileList.length} files detected)`, false);
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const harvested = caseStateHarvester.harvestFromText(text || '', folderName);
      harvested.folderPath = folderName;
      harvested.fileList = fileList.map(f => f.name);
      caseStateHarvester.registerCase(harvested);
      caseStateHarvester.setActiveCase(harvested);
      setIsMatterPickerOpen(false);
      if (onPostChatMessage) {
        onPostChatMessage(
          `📁 **Client Matter Workspace Loaded**\n\n` +
          `* **Folder:** **${folderName}** (${fileList.length} files)\n` +
          `* **Active Matter:** **${harvested.applicantName}** (${harvested.eamsNumber})\n\n` +
          `*Legal Eagle is now grounded on this client workspace.*`,
          false
        );
      }
    };
    reader.readAsText(readableFiles[0]);
  };

  const allCases = caseStateHarvester.getAllCases();
  const filteredCases = allCases.filter(c => 
    c.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.eamsNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.employer && c.employer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className={cn(
      "w-full border-b transition-colors relative",
      "bg-white dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100",
      className
    )}>
      {/* 🏛️ Top Header Command Strip */}
      <div className="px-4 py-2 flex items-center justify-between gap-3 flex-wrap bg-slate-50/80 dark:bg-slate-950/40">
        {/* Dynamic Active Matter Badge with Dropdown Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsMatterPickerOpen(!isMatterPickerOpen)}
            className="flex items-center gap-2 p-1 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer group text-left"
            title="Click to switch active client matter or load a client folder"
          >
            <div className="p-1 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 transition-colors">
              <Scale className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex items-center gap-2">
              <span className="font-bold text-xs truncate text-slate-900 dark:text-slate-100">
                {activeCase.applicantName}
              </span>
              {activeCase.id === 'FLUID_WORKSPACE' || activeCase.applicantName === 'Fluid Workspace' ? (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  ⚡ Dynamic Drive Mode
                </span>
              ) : (
                <>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {activeCase.eamsNumber}
                  </span>
                  {activeCase.folderPath ? (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800/40 max-w-[140px] truncate" title={activeCase.folderPath}>
                      <Folder className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate">{activeCase.folderPath.split(/[/\\]/).pop()}</span>
                    </span>
                  ) : (
                    <span className="hidden sm:inline-block text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
                      ● Active Matter
                    </span>
                  )}
                </>
              )}
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
            </div>
          </button>

          {/* 📋 Interactive Client Matter Switcher Dropdown */}
          {isMatterPickerOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-84 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-2 text-xs animate-in fade-in-50 zoom-in-95">
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-700 dark:text-slate-200">Switch Client Matter</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const cleared = caseStateHarvester.clearActiveCase();
                      setActiveCase(cleared);
                      setIsMatterPickerOpen(false);
                      if (onPostChatMessage) {
                        onPostChatMessage("⚡ Switched to **Fluid Workspace** (Unbound Matter). All grounding now driven dynamically by your selected attached drive files.", false);
                      }
                    }}
                    className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5 font-medium cursor-pointer"
                    title="Operate purely on attached drives without a preset client matter"
                  >
                    <Sparkles className="h-3 w-3" /> Fluid Mode
                  </button>
                  <button
                    onClick={handleOpenFolder}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 font-medium cursor-pointer"
                    title="Open existing folder workspace"
                  >
                    <FolderPlus className="h-3 w-3" /> Folder
                  </button>
                  <button
                    onClick={() => setIsCustomMatterModalOpen(true)}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> New
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="p-1.5">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search client, EAMS, employer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-none outline-hidden text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Case List */}
              <div className="max-h-52 overflow-y-auto space-y-1 p-1">
                {filteredCases.map((c) => {
                  const isSelected = c.id === activeCase.id || c.applicantName === activeCase.applicantName;
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelectCase(c.id)}
                      className={cn(
                        "w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between gap-2 transition-colors cursor-pointer",
                        isSelected 
                          ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium flex items-center gap-1.5">
                          <span>{c.applicantName}</span>
                          {c.folderPath && (
                            <Folder className="h-3 w-3 text-blue-500 shrink-0" title={c.folderPath} />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">{c.eamsNumber} • {c.employer || 'Employer'}</div>
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Load Client Workspace Folder or Single File */}
              <div className="p-1.5 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1.5">
                <input 
                  type="file" 
                  ref={folderInputRef} 
                  // @ts-ignore
                  webkitdirectory="" 
                  directory="" 
                  multiple 
                  onChange={handleFolderUpload} 
                  className="hidden" 
                />
                <button
                  onClick={handleOpenFolder}
                  className="w-full py-1.5 px-2 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-center font-medium flex items-center justify-center gap-1.5 transition-colors text-xs border border-blue-200 dark:border-blue-800/60 cursor-pointer shadow-2xs"
                  title="Open a full client case directory or workspace"
                >
                  <FolderPlus className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Open Client Folder / Workspace</span>
                </button>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept=".md,.txt,.json,.pdf" 
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-1.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-center font-medium flex items-center justify-center gap-1.5 transition-colors text-xs cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5 text-slate-500" />
                  <span>Load Single File / Brief</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 🎛️ Right Side Controls: Model Switcher & Details Drawer Toggle */}
        <div className="flex items-center gap-2">
          {/* Model Gateway Switch */}
          <div className="flex items-center gap-0.5 bg-slate-200/60 dark:bg-slate-800/80 p-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-[11px]">
            <button
              onClick={() => handleProviderToggle('private')}
              className={cn(
                "px-2 py-0.5 rounded font-medium transition-all flex items-center gap-1",
                provider === 'private'
                  ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
              title="100% Offline HIPAA Private Home GPU"
            >
              <Cpu className="h-3 w-3" />
              <span className="hidden md:inline">GPU</span>
            </button>
            <button
              onClick={() => handleProviderToggle('gemini')}
              className={cn(
                "px-2 py-0.5 rounded font-medium transition-all flex items-center gap-1",
                provider === 'gemini'
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
              title="Gemini Frontier Cloud Reasoning"
            >
              <Sparkles className="h-3 w-3" />
              <span className="hidden md:inline">Gemini</span>
            </button>
          </div>

          {/* Expand/Collapse Drawer Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isExpanded ? "Collapse Case Details" : "Expand Case Details"}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* ➕ Quick New Matter Modal */}
      {isCustomMatterModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-4 space-y-3 shadow-2xl">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Plus className="h-4 w-4 text-blue-500" /> Load New Client Matter
            </h3>
            <form onSubmit={handleCreateCustomMatter} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1 font-medium">Applicant / Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Torro, Marco Antonio"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1 font-medium">EAMS ADJ Number</label>
                <input
                  type="text"
                  placeholder="e.g. ADJ16948210"
                  value={newEamsNumber}
                  onChange={(e) => setNewEamsNumber(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 outline-hidden font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1 font-medium">Employer</label>
                <input
                  type="text"
                  placeholder="e.g. Master Construction Services"
                  value={newEmployer}
                  onChange={(e) => setNewEmployer(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 outline-hidden"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCustomMatterModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                >
                  Set as Active Matter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📂 Collapsible Case Details & Ground Truth Drawer */}
      {isExpanded && (
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/60 text-xs space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Column 1: Case Summary */}
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Ground Truth</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{activeCase.applicantName}</p>
              <p className="text-slate-500 dark:text-slate-400 truncate">{activeCase.employer}</p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                PTP: <strong className="text-slate-700 dark:text-slate-300">{activeCase.primaryTreatingPhysician || 'Primary Treating Physician'}</strong>
              </div>
            </div>

            {/* Column 2: Medical Evidence Verified */}
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Verified Evidence
              </span>
              <p className="text-slate-700 dark:text-slate-300 font-medium">{activeCase.mriFindings?.[0] || 'Active Clinical / PTP Record'}</p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">EAMS Case: {activeCase.eamsNumber}</p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">{activeCase.verifiedDefensesOmissions?.[0] || 'Continuous prosecution on record'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

