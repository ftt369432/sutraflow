import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    Zap, 
    BookOpen, 
    MessageSquare, 
    Layout, 
    Settings, 
    ArrowRight,
    Command,
    X,
    Bot,
    FileText,
    Brain,
    Cpu,
    Scale,
    HardDrive,
    Palette,
    Shield,
    Calculator,
    Mail,
    Calendar,
    Users,
    FolderKanban
} from 'lucide-react';
import { useQuickActions, CommandCategory } from '../../hooks/useQuickActions';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAssistantStore } from '../../store/assistantStore';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { useActiveContext } from '../../hooks/useActiveContext';
import { useTheme } from '../../contexts/ThemeContext';
import { switchAIProvider, AIProvider } from '../../services/ai/aiServiceFactory';
import { universalPlaybookService } from '../../services/playbook/UniversalPlaybookService';

interface ActionItem {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    shortcut?: string;
    category: CommandCategory;
    keywords?: string[];
    onSelect: () => void;
}

export const CommandPalette: React.FC = () => {
    const { 
        isPaletteOpen, 
        setPaletteOpen, 
        searchTerm, 
        setSearchTerm, 
        activeCategory, 
        setActiveCategory,
        recordActionExecution
    } = useQuickActions();

    const [selectedIndex, setSelectedIndex] = useState(0);
    const { assistants } = useAssistantStore();
    const { documents } = useKnowledgeBaseStore();
    const { activeDocument, activePersona, setActivePersona, setActiveModel } = useActiveContext();
    const { setSkin, skins } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const inputRef = useRef<HTMLInputElement>(null);

    // Global shortcut Ctrl+K or Cmd+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setPaletteOpen(!isPaletteOpen);
            }
            if (e.key === 'Escape' && isPaletteOpen) {
                setPaletteOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPaletteOpen, setPaletteOpen]);

    // Auto-focus input when opened
    useEffect(() => {
        if (isPaletteOpen) {
            inputRef.current?.focus();
            setSelectedIndex(0);
        }
    }, [isPaletteOpen]);

    // Prefix-based dynamic category switching
    const effectiveQuery = useMemo(() => {
        const trimmed = searchTerm.trim();
        if (trimmed.startsWith('>')) {
            if (activeCategory !== 'commands') setActiveCategory('commands');
            return trimmed.slice(1).trim();
        }
        if (trimmed.startsWith('/')) {
            if (activeCategory !== 'legal') setActiveCategory('legal');
            return trimmed.slice(1).trim();
        }
        if (trimmed.startsWith('@')) {
            if (activeCategory !== 'assistants') setActiveCategory('assistants');
            return trimmed.slice(1).trim();
        }
        if (trimmed.startsWith('#')) {
            if (activeCategory !== 'files') setActiveCategory('files');
            return trimmed.slice(1).trim();
        }
        if (trimmed.startsWith('!') || trimmed.startsWith('$')) {
            if (activeCategory !== 'models') setActiveCategory('models');
            return trimmed.slice(1).trim();
        }
        return trimmed;
    }, [searchTerm, activeCategory, setActiveCategory]);

    const handleAction = (item: ActionItem) => {
        recordActionExecution(item.id);
        item.onSelect();
        setPaletteOpen(false);
        setSearchTerm('');
        setActiveCategory('all');
    };

    // Master Action Library
    const baseActions: ActionItem[] = useMemo(() => {
        const list: ActionItem[] = [
            // ⚖️ LEGAL & STATUTORY TOOLS (/)
            {
                id: 'legal-rate-pd',
                title: 'Calculate PDRS 2005 Rating',
                description: 'AMA Guides 5th Ed. WPI to PD conversion & CVC formula',
                icon: <Calculator className="h-4 w-4 text-cyan-400" />,
                shortcut: '/rate',
                category: 'legal',
                keywords: ['pd', 'wpi', 'pdrs', 'rating', 'disability', 'ama'],
                onSelect: () => navigate('/ai-assistant?prompt=/rating Calculate permanent disability rating for active medical report.')
            },
            {
                id: 'legal-penalty-5814',
                title: 'Draft LC § 5814 Penalty Petition',
                description: '25% statutory penalty petition up to $10,000 for unreasonable delay',
                icon: <Scale className="h-4 w-4 text-cyan-400" />,
                shortcut: '/5814',
                category: 'legal',
                keywords: ['penalty', '5814', 'delay', 'petition', 'benefits'],
                onSelect: () => navigate('/ai-assistant?prompt=/petition Draft a 28-line Petition for Penalties under Labor Code § 5814.')
            },
            {
                id: 'legal-interest-4622',
                title: 'Audit LC § 4622 Medical-Legal Interest',
                description: 'Calculate 10% penalty + 7% per annum statutory interest on medical-legal billings',
                icon: <Calculator className="h-4 w-4 text-cyan-400" />,
                shortcut: '/4622',
                category: 'legal',
                keywords: ['lien', 'interest', '4622', 'medical-legal', 'billing', 'audit'],
                onSelect: () => navigate('/ai-assistant?prompt=/audit Calculate LC § 4622 10% penalty and 7% interest on delayed medical-legal bills.')
            },
            {
                id: 'legal-qme-replacement',
                title: 'Request Replacement QME Panel',
                description: 'Labor Code § 4062.2 / Navarro v. City of Montebello specialty panel petition',
                icon: <Scale className="h-4 w-4 text-cyan-400" />,
                shortcut: '/qme',
                category: 'legal',
                keywords: ['qme', 'panel', 'navarro', 'replacement', 'specialty', '4062.2'],
                onSelect: () => navigate('/ai-assistant?prompt=/petition Draft Petition for Replacement QME Panel under Labor Code § 4062.2 and Navarro.')
            },
            {
                id: 'legal-persona-applicant',
                title: 'Set Persona: Applicant Attorney',
                description: 'Activate Applicant Attorney 28-line conformed legal captions',
                icon: <Shield className="h-4 w-4 text-blue-400" />,
                category: 'legal',
                keywords: ['persona', 'applicant', 'attorney', 'pleading'],
                onSelect: () => setActivePersona('applicant_attorney')
            },
            {
                id: 'legal-persona-lien',
                title: 'Set Persona: Lien Claimant',
                description: 'Activate Medland Medical / Spectrum / RMS Medical Group billing enforcement',
                icon: <Shield className="h-4 w-4 text-emerald-400" />,
                category: 'legal',
                keywords: ['persona', 'lien', 'claimant', 'medland', 'spectrum'],
                onSelect: () => setActivePersona('lien_claimant')
            },

            // ⚡ AI INFERENCE & MODEL SWITCHING
            {
                id: 'model-rtx-4090',
                title: 'Switch to Local RTX 4090 GPU (qwen2.5:7b)',
                description: '100% private, sovereign zero-PHI inference via local Ollama / vLLM daemon',
                icon: <Cpu className="h-4 w-4 text-cyan-400" />,
                shortcut: '!gpu',
                category: 'models',
                keywords: ['ollama', 'qwen', 'local', 'rtx4090', 'private', 'gpu'],
                onSelect: () => {
                    switchAIProvider('private');
                    setActiveModel('local-gpu-qwen');
                }
            },
            {
                id: 'model-gemini-flash',
                title: 'Switch to Google Gemini 2.0 Flash',
                description: 'Ultra-fast multimodal reasoning and high-throughput document processing',
                icon: <Zap className="h-4 w-4 text-blue-400" />,
                shortcut: '!gemini',
                category: 'models',
                keywords: ['gemini', 'google', 'cloud', 'flash'],
                onSelect: () => {
                    switchAIProvider('gemini');
                    setActiveModel('gemini-2.0-flash');
                }
            },
            {
                id: 'model-claude-sonnet',
                title: 'Switch to Anthropic Claude 3.5 Sonnet',
                description: 'Deep legal brief reasoning, complex synthesis and statutory analysis',
                icon: <Brain className="h-4 w-4 text-amber-400" />,
                shortcut: '!claude',
                category: 'models',
                keywords: ['claude', 'anthropic', 'sonnet', 'brief'],
                onSelect: () => {
                    switchAIProvider('claude');
                    setActiveModel('claude-3.5-sonnet');
                }
            },
            {
                id: 'model-groq-llama',
                title: 'Switch to Groq Llama 3.3 70B',
                description: 'Near-instantaneous token generation for drafting and quick questions',
                icon: <Cpu className="h-4 w-4 text-orange-400" />,
                shortcut: '!groq',
                category: 'models',
                keywords: ['groq', 'llama', 'fast', 'speed'],
                onSelect: () => {
                    switchAIProvider('groq');
                    setActiveModel('groq-llama-3.3-70b');
                }
            },

            // > NAVIGATION & CORE HUBS
            {
                id: 'nav-sovereign-workspace',
                title: 'Sovereign Workspace (Drafting & Chat)',
                description: 'Split-pane 28-line legal document canvas, GenieDrive, and sovereign assistant',
                icon: <MessageSquare className="h-4 w-4 text-cyan-400" />,
                shortcut: '>ws',
                category: 'commands',
                keywords: ['workspace', 'chat', 'canvas', 'draft', 'viewer'],
                onSelect: () => navigate('/ai-assistant')
            },
            {
                id: 'nav-agent-hq',
                title: 'Autonomous Agent HQ',
                description: 'Mission control, background agents, and OODAR multi-agent swarms',
                icon: <Zap className="h-4 w-4 text-amber-400" />,
                shortcut: '>hq',
                category: 'commands',
                keywords: ['hq', 'missions', 'swarm', 'autonomous'],
                onSelect: () => navigate('/hq')
            },
            {
                id: 'nav-email',
                title: 'Email Command Center',
                description: 'IMAP & Google unified inbox with AI legal categorization & task extraction',
                icon: <Mail className="h-4 w-4 text-blue-400" />,
                shortcut: '>mail',
                category: 'commands',
                keywords: ['email', 'gmail', 'imap', 'inbox', 'messages'],
                onSelect: () => navigate('/email')
            },
            {
                id: 'nav-geniedrive',
                title: 'GenieDrive Multi-Drive Browser',
                description: 'Lazy-loaded local file system explorer for G:\\, E:\\, and C:\\ drives',
                icon: <HardDrive className="h-4 w-4 text-emerald-400" />,
                shortcut: '>drive',
                category: 'commands',
                keywords: ['drive', 'files', 'explorer', 'tree', 'folders'],
                onSelect: () => navigate('/genie-drive')
            },
            {
                id: 'nav-calendar',
                title: 'Calendar & Court Deadlines',
                description: 'WCAB statutory hearings, PQME appointment windows, and bulk schedule',
                icon: <Calendar className="h-4 w-4 text-purple-400" />,
                shortcut: '>cal',
                category: 'commands',
                keywords: ['calendar', 'events', 'hearings', 'deadlines', 'dates'],
                onSelect: () => navigate('/calendar')
            },
            {
                id: 'nav-teams',
                title: 'Coworking Teams & Presence',
                description: 'Real-time collaborative channels, threads, and active peer presence',
                icon: <Users className="h-4 w-4 text-cyan-400" />,
                shortcut: '>teams',
                category: 'commands',
                keywords: ['teams', 'cowork', 'collaborate', 'chat', 'members'],
                onSelect: () => navigate('/teams')
            },
            {
                id: 'nav-kb',
                title: 'Knowledge Base & Citations',
                description: 'Vector-indexed case files, WCAB en banc authorities, and precedents',
                icon: <BookOpen className="h-4 w-4 text-blue-400" />,
                shortcut: '>kb',
                category: 'commands',
                keywords: ['knowledge', 'kb', 'precedents', 'library', 'rag'],
                onSelect: () => navigate('/knowledge')
            },
            {
                id: 'nav-assistant-store',
                title: 'Assistant Store & Gpack Registry',
                description: 'Monetizable legal agent bundles, specialized skills, and marketplace',
                icon: <FolderKanban className="h-4 w-4 text-amber-400" />,
                shortcut: '>store',
                category: 'commands',
                keywords: ['store', 'marketplace', 'gpack', 'assistants'],
                onSelect: () => navigate('/assistant-store')
            },
            {
                id: 'nav-settings',
                title: 'System Preferences & Settings',
                description: 'API keys, local GPU daemon config, notification gates, and identity',
                icon: <Settings className="h-4 w-4 text-slate-400" />,
                shortcut: '>set',
                category: 'commands',
                keywords: ['settings', 'config', 'profile', 'api'],
                onSelect: () => navigate('/settings')
            },

            // 🎨 THEME & SKIN SWITCHING
            ...skins.map(s => ({
                id: `skin-${s.id}`,
                title: `Apply Skin: ${s.name}`,
                description: s.description || `Switch interface skin to ${s.name}`,
                icon: <Palette className="h-4 w-4 text-cyan-400" />,
                category: 'skins' as CommandCategory,
                keywords: ['skin', 'theme', 'appearance', s.name.toLowerCase()],
                onSelect: () => setSkin(s.id)
            })),

            // # DRIVES & FILES
            {
                id: 'drive-g',
                title: 'Inspect Google Drive (G:\\My Drive)',
                description: 'Open GenieDrive tree focused on shared cloud client evidence',
                icon: <HardDrive className="h-4 w-4 text-emerald-400" />,
                shortcut: '#g',
                category: 'files',
                keywords: ['g:', 'google drive', 'client files'],
                onSelect: () => navigate('/genie-drive?root=G:\\My Drive')
            },
            {
                id: 'drive-e',
                title: 'Inspect Server & Master Precedents (E:\\)',
                description: 'Mount master legal precedent archive and local model store',
                icon: <HardDrive className="h-4 w-4 text-cyan-400" />,
                shortcut: '#e',
                category: 'files',
                keywords: ['e:', 'server', 'master', 'precedents'],
                onSelect: () => navigate('/genie-drive?root=E:\\')
            },
            {
                id: 'drive-c',
                title: 'Inspect Local Workspace (C:\\)',
                description: 'Explore local application artifacts and workspace code',
                icon: <HardDrive className="h-4 w-4 text-slate-400" />,
                shortcut: '#c',
                category: 'files',
                keywords: ['c:', 'local', 'workspace'],
                onSelect: () => navigate('/genie-drive?root=C:\\')
            }
        ];

        // Context-aware dynamic action: summarize active document
        if (activeDocument) {
            list.unshift({
                id: 'action-summarize-active',
                title: `Analyze Active File: "${activeDocument.name}"`,
                description: `Extract key legal facts, statutory issues, and recommendations from ${activeDocument.name}`,
                icon: <Brain className="h-4 w-4 text-cyan-400" />,
                shortcut: 'A',
                category: 'legal',
                keywords: ['active', 'summarize', 'analyze', activeDocument.name.toLowerCase()],
                onSelect: () => navigate(`/ai-assistant?prompt=Analyze the active document "${activeDocument.name}" and provide a comprehensive legal evaluation.`)
            });
        }

        return list;
    }, [activeDocument, skins, navigate, setActivePersona, setActiveModel, setSkin]);

    // Add assistants from store (@)
    const assistantActions: ActionItem[] = useMemo(() => {
        return assistants.map(a => ({
            id: `assistant-${a.id}`,
            title: `Chat with ${a.name}`,
            description: a.description || a.type || 'Specialized Autonomous Agent',
            icon: <Bot className="h-4 w-4 text-cyan-400" />,
            shortcut: `@${a.name.toLowerCase().replace(/\s+/g, '')}`,
            category: 'assistants',
            keywords: ['assistant', 'agent', a.name.toLowerCase(), a.type?.toLowerCase() || ''],
            onSelect: () => navigate(`/ai-assistant?assistant=${a.id}`)
        }));
    }, [assistants, navigate]);

    // Filter items based on effective query and active category
    const filteredItems = useMemo(() => {
        const combined = [...baseActions, ...assistantActions];
        const query = effectiveQuery.toLowerCase();

        return combined.filter(item => {
            // Category filter
            if (activeCategory !== 'all' && item.category !== activeCategory) {
                return false;
            }

            if (!query) return true;

            // Search matching
            const matchTitle = item.title.toLowerCase().includes(query);
            const matchDesc = item.description.toLowerCase().includes(query);
            const matchShortcut = item.shortcut?.toLowerCase().includes(query);
            const matchKeywords = item.keywords?.some(k => k.toLowerCase().includes(query));

            return matchTitle || matchDesc || matchShortcut || matchKeywords;
        });
    }, [baseActions, assistantActions, effectiveQuery, activeCategory]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % (filteredItems.length || 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredItems[selectedIndex]) {
                handleAction(filteredItems[selectedIndex]);
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            // Cycle category chips
            const categories: CommandCategory[] = ['all', 'commands', 'legal', 'models', 'assistants', 'skins', 'files'];
            const nextIdx = (categories.indexOf(activeCategory) + 1) % categories.length;
            setActiveCategory(categories[nextIdx]);
        }
    };

    return (
        <AnimatePresence>
            {isPaletteOpen && (
                <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[12vh] p-4">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setPaletteOpen(false)}
                        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
                    />

                    {/* Palette HUD Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -16 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="relative w-full max-w-2xl bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl shadow-cyan-950/30 overflow-hidden flex flex-col max-h-[75vh]"
                        onKeyDown={handleKeyDown}
                    >
                        {/* Search Input Area */}
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800/80 bg-slate-900/60">
                            <Search className="h-5 w-5 text-cyan-400 shrink-0" />
                            <input 
                                ref={inputRef}
                                type="text" 
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setSelectedIndex(0);
                                }}
                                placeholder="Type a command, statute, or prefix (> nav, / legal, @ agent, # drive, ! model)..."
                                className="flex-1 bg-transparent border-none outline-none text-base font-medium text-slate-100 placeholder:text-slate-500"
                            />
                            {searchTerm && (
                                <button 
                                    onClick={() => {
                                        setSearchTerm('');
                                        inputRef.current?.focus();
                                    }}
                                    className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-200"
                                >
                                    <X size={14} />
                                </button>
                            )}
                            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400">
                                <Command size={11} />
                                <span>K</span>
                            </div>
                        </div>

                        {/* Category Filter Chips */}
                        <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-950/40 border-b border-slate-800/60 overflow-x-auto no-scrollbar text-xs">
                            {[
                                { id: 'all', label: 'All' },
                                { id: 'commands', label: '> Navigation' },
                                { 
                                    id: 'legal', 
                                    label: (() => {
                                        const p = universalPlaybookService.getActivePlaybook();
                                        return p ? `/${p.domain.charAt(0).toUpperCase() + p.domain.slice(1)} Tools` : '/ Domain Tools';
                                    })()
                                },
                                { id: 'models', label: '⚡ Models' },
                                { id: 'assistants', label: '@ Assistants' },
                                { id: 'skins', label: '🎨 Skins' },
                                { id: 'files', label: '# Drives' }
                            ].map(cat => {
                                const isActive = activeCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => {
                                            setActiveCategory(cat.id as CommandCategory);
                                            setSelectedIndex(0);
                                            inputRef.current?.focus();
                                        }}
                                        className={cn(
                                            "px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap text-[11px]",
                                            isActive
                                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                                        )}
                                    >
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Results List */}
                        <div className="flex-1 overflow-y-auto py-2 px-2 custom-scrollbar">
                            {filteredItems.length === 0 ? (
                                <div className="py-14 text-center text-slate-400">
                                    <Search className="h-8 w-8 text-slate-600 mx-auto mb-3 opacity-40" />
                                    <p className="text-sm font-semibold text-slate-300">No matching commands or tools</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Try prefixing with <span className="font-mono text-cyan-400">/</span> for statutes or <span className="font-mono text-cyan-400">&gt;</span> for navigation
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {filteredItems.map((item, idx) => {
                                        const isSelected = selectedIndex === idx;
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => handleAction(item)}
                                                onMouseEnter={() => setSelectedIndex(idx)}
                                                className={cn(
                                                    "group flex items-center gap-3.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 border",
                                                    isSelected
                                                        ? "bg-slate-800/90 border-cyan-500/40 shadow-sm shadow-cyan-950/20 text-slate-100"
                                                        : "border-transparent text-slate-300 hover:bg-slate-800/40"
                                                )}
                                            >
                                                <div className={cn(
                                                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors border",
                                                    isSelected 
                                                        ? "bg-cyan-950/60 border-cyan-500/40 text-cyan-300" 
                                                        : "bg-slate-800/80 border-slate-700/60 text-slate-400"
                                                )}>
                                                    {item.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-semibold truncate text-slate-200 group-hover:text-white">
                                                            {item.title}
                                                        </span>
                                                        {item.shortcut && (
                                                            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
                                                                {item.shortcut}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                                        {item.description}
                                                    </p>
                                                </div>
                                                <ArrowRight className={cn(
                                                    "h-3.5 w-3.5 text-cyan-400 shrink-0 transition-all",
                                                    isSelected ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"
                                                )} />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer Status Bar */}
                        <div className="px-4 py-2.5 bg-slate-950/70 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                    <kbd className="bg-slate-800 border border-slate-700 px-1 py-0.5 rounded text-slate-300">↑↓</kbd>
                                    <span>Navigate</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="bg-slate-800 border border-slate-700 px-1 py-0.5 rounded text-slate-300">Enter</kbd>
                                    <span>Execute</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="bg-slate-800 border border-slate-700 px-1 py-0.5 rounded text-slate-300">Tab</kbd>
                                    <span>Category</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="bg-slate-800 border border-slate-700 px-1 py-0.5 rounded text-slate-300">Esc</kbd>
                                    <span>Close</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-cyan-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                <span>Sovereign OS Active</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
