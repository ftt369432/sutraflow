import React, { useEffect, useState } from 'react';
import { displayManager } from '../../services/ui/DisplayManager';
import { useAuth } from '../../contexts/AuthContext';
import { 
    Bot, 
    X, 
    Maximize2, 
    RotateCw, 
    Globe, 
    ChevronLeft, 
    ChevronRight, 
    Shield, 
    ShieldOff, 
    Sparkles, 
    FolderOpen, 
    MailOpen, 
    PlayCircle 
} from 'lucide-react';
import UnifiedCanvasSystem from '../canvas/UnifiedCanvasSystem';
import SovereignDocViewer from '../canvas/SovereignDocViewer';
import { GenieDriveTree } from '../geniedrive/GenieDriveTree';
import EmailPage from '../../pages/EmailPage';
import { UnifiedTaskOrchestrator } from '../ai/UnifiedTaskOrchestrator';

interface DoubleScreenLayoutProps {
    panelType: string;
}

export const DoubleScreenLayout: React.FC<DoubleScreenLayoutProps> = ({ panelType }) => {
    const { user } = useAuth();
    
    // Immersive glassmorphic and reactive state initialization from localStorage
    const [panelState, setPanelState] = useState<any>(() => {
        try {
            const saved = localStorage.getItem('genieflow_canvases');
            const currentCanvases = saved ? JSON.parse(saved) : [];
            const activeCanvasId = localStorage.getItem('genieflow_active_canvas') || undefined;
            const canvasViewMode = localStorage.getItem('genieflow_canvas_view_mode') || 'canvas';
            
            const savedBrowserUrl = localStorage.getItem('genieflow_browser_url') || 'https://www.google.com/search?q=GenieFlow+AI';
            const savedBrowserComp = localStorage.getItem('genieflow_browser_compatibility') !== 'false';

            return { 
                currentCanvases, 
                activeCanvasId, 
                canvasViewMode,
                browserUrl: savedBrowserUrl,
                browserCompatibilityMode: savedBrowserComp
            };
        } catch {
            return {
                currentCanvases: [],
                activeCanvasId: undefined,
                canvasViewMode: 'canvas',
                browserUrl: 'https://www.google.com/search?q=GenieFlow+AI',
                browserCompatibilityMode: true
            };
        }
    });

    const [localBrowserUrl, setLocalBrowserUrl] = useState(panelState.browserUrl);

    useEffect(() => {
        // Listen for state updates from the main window
        const unsubscribe = displayManager.subscribe((data) => {
            if (data.type === 'SYNC_STATE' && data.panel === panelType) {
                setPanelState((prev: any) => ({
                    ...prev,
                    ...data.state
                }));
                if (data.state.browserUrl) {
                    setLocalBrowserUrl(data.state.browserUrl);
                }
            }
            if (data.type === 'UPDATE_CANVAS_VIEW_MODE') {
                setPanelState((prev: any) => ({
                    ...prev,
                    canvasViewMode: data.viewMode
                }));
            }
            if (data.type === 'REATTACH_ALL') {
                window.close();
            }
        });

        // Notify main window that we are ready
        displayManager.syncState({ type: 'DETACHED_WINDOW_READY', panel: panelType });

        return unsubscribe;
    }, [panelType]);

    // Immersive title helper
    const getPanelTitle = () => {
        switch (panelType) {
            case 'canvas':
                return panelState.canvasViewMode === 'viewer' ? 'Sovereign Document Viewer' : 'AI Canvas Workspace';
            case 'ai-drive':
                return 'GenieDrive Cloud Explorer';
            case 'email':
                return 'AI Email Automation Hub';
            case 'tasks':
            case 'orchestrator':
                return 'OODAR Swarm Task Orchestrator';
            case 'browser':
                return 'Conscious Co-Pilot Web Browser';
            default:
                return panelType.charAt(0).toUpperCase() + panelType.slice(1);
        }
    };

    return (
        <div className="h-screen w-screen bg-[#0a0a0f] text-slate-100 flex flex-col overflow-hidden font-sans antialiased">
            {/* 🖥️ PREMIUM GLASSMORPHIC DETACHED HEADER */}
            <div className="h-12 bg-slate-950/70 backdrop-blur-xl border-b border-white/[0.05] flex items-center justify-between px-6 flex-shrink-0 select-none drag-region">
                <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 animate-pulse-subtle">
                        <Bot size={15} className="text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest leading-none">
                            GenieFlow Second Screen
                        </span>
                        <span className="text-xs font-semibold text-slate-200 mt-1">
                            {getPanelTitle()}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Synchronized status badge */}
                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[9px] text-emerald-400 font-bold tracking-widest uppercase">Connected</span>
                    </div>

                    <div className="h-4 w-[1px] bg-white/[0.08]" />

                    <button
                        onClick={() => displayManager.syncState({ type: 'REATTACH_PANEL', panel: panelType })}
                        className="p-2 hover:bg-white/[0.05] active:bg-white/[0.1] rounded-xl transition text-slate-400 hover:text-slate-200"
                        title="Reattach to Main Window"
                    >
                        <Maximize2 size={14} />
                    </button>
                    <button
                        onClick={() => window.close()}
                        className="p-2 hover:bg-red-500/20 active:bg-red-500/30 rounded-xl transition text-slate-400 hover:text-red-400"
                        title="Close Window"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* 📺 IMMERSIVE LIVE PANEL CONTENT AREA */}
            <div className="flex-1 overflow-hidden relative bg-[#060609] flex flex-col">
                {/* 🎨 CANVAS / SOVEREIGN VIEWER */}
                {panelType === 'canvas' && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* ⚖️ Premium Glassmorphic Switcher (Canvas ↔ Sovereign Viewer) */}
                        <div className="flex-shrink-0 bg-slate-950/40 border-b border-white/[0.03] p-2 flex items-center justify-between">
                            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-950/60 border border-white/[0.03]">
                                <button
                                    onClick={() => {
                                        setPanelState((prev: any) => ({ ...prev, canvasViewMode: 'canvas' }));
                                        displayManager.syncState({ type: 'UPDATE_CANVAS_VIEW_MODE', viewMode: 'canvas' });
                                    }}
                                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${
                                        panelState.canvasViewMode === 'canvas'
                                            ? 'bg-blue-600/30 text-blue-300 shadow border border-blue-500/20'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                                    }`}
                                >
                                    Canvas
                                </button>
                                <button
                                    onClick={() => {
                                        setPanelState((prev: any) => ({ ...prev, canvasViewMode: 'viewer' }));
                                        displayManager.syncState({ type: 'UPDATE_CANVAS_VIEW_MODE', viewMode: 'viewer' });
                                    }}
                                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${
                                        panelState.canvasViewMode === 'viewer'
                                            ? 'bg-blue-600/30 text-blue-300 shadow border border-blue-500/20'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                                    }`}
                                >
                                    ⚖️ Sovereign Viewer
                                </button>
                            </div>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mr-2 select-none">
                                {panelState.canvasViewMode === 'viewer' ? 'Document Review Mode' : 'AI Canvas Mode'}
                            </span>
                        </div>

                        {panelState.canvasViewMode === 'viewer' ? (
                            <SovereignDocViewer
                                documents={(panelState.currentCanvases || []).map((c: any) => ({
                                    id: c.id,
                                    title: c.title,
                                    content: c.content,
                                    mimeType: 'text/markdown'
                                }))}
                                activeDocumentId={panelState.activeCanvasId}
                                onDocumentSelect={(id) => {
                                    setPanelState((prev: any) => ({ ...prev, activeCanvasId: id }));
                                    displayManager.syncState({ type: 'SELECT_CANVAS', canvasId: id });
                                }}
                                onContentChange={(id, content) => {
                                    setPanelState((prev: any) => {
                                        const updated = (prev.currentCanvases || []).map((c: any) => 
                                            c.id === id ? { ...c, content } : c
                                        );
                                        return { ...prev, currentCanvases: updated };
                                    });
                                    displayManager.syncState({ type: 'UPDATE_CANVAS', canvasId: id, content });
                                }}
                                renderFileTree={() => (
                                    <GenieDriveTree
                                        onFileSelect={(file) => {
                                            console.log('📂 File selected in detached Sovereign Explorer:', file.name);
                                            
                                            // Sync and open the file
                                            displayManager.syncState({ 
                                                type: 'FILE_OPENED', 
                                                file: {
                                                    id: file.id,
                                                    title: file.name,
                                                    content: file.content || '',
                                                    mimeType: file.mime_type || 'application/pdf',
                                                    fileId: file.id
                                                } 
                                            });
                                        }}
                                        className="h-full"
                                    />
                                )}
                            />
                        ) : (
                            <UnifiedCanvasSystem
                                activeCanvasId={panelState.activeCanvasId}
                                onCanvasChange={(id, content) => {
                                    displayManager.syncState({ type: 'UPDATE_CANVAS', canvasId: id, content });
                                }}
                            />
                        )}
                    </div>
                )}

                {/* 📂 REAL LIVE AI DRIVE */}
                {panelType === 'ai-drive' && (
                    <div className="flex-1 flex flex-col overflow-hidden p-6">
                        <div className="mb-4 flex-shrink-0 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FolderOpen className="h-5 w-5 text-blue-400" />
                                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">AI Second Brain Documents</h3>
                            </div>
                            <span className="text-[10px] text-slate-400 bg-white/[0.03] px-2 py-0.5 rounded-full border border-white/[0.05]">
                                Supabase Cloud Storage
                            </span>
                        </div>
                        <div className="flex-1 overflow-hidden bg-slate-950/40 border border-white/[0.03] rounded-2xl p-4">
                            <GenieDriveTree 
                                onFileSelect={(file) => {
                                    console.log('📂 File selected in detached Drive:', file.name);
                                    displayManager.syncState({ 
                                        type: 'FILE_OPENED', 
                                        file: {
                                            id: file.id,
                                            title: file.name,
                                            content: file.content || '',
                                            mimeType: file.mime_type || 'application/pdf',
                                            fileId: file.id
                                        } 
                                    });
                                }} 
                                className="h-full" 
                            />
                        </div>
                    </div>
                )}

                {/* 📧 REAL LIVE EMAIL AUTOMATION HUB */}
                {panelType === 'email' && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="p-4 bg-slate-950/20 border-b border-white/[0.02] flex items-center gap-2 flex-shrink-0">
                            <MailOpen className="h-4 w-4 text-indigo-400" />
                            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Detached Multi-Screen Mailroom</span>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <EmailPage />
                        </div>
                    </div>
                )}

                {/* 🤖 REAL LIVE OODAR AGENT TASK ORCHESTRATOR */}
                {(panelType === 'tasks' || panelType === 'orchestrator') && (
                    <div className="flex-1 flex flex-col overflow-hidden p-6 bg-[#08080c]">
                        <div className="mb-4 flex-shrink-0 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <PlayCircle className="h-5 w-5 text-indigo-400 animate-pulse-subtle" />
                                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">OODAR Loop Executive Swarm</h3>
                            </div>
                            <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 font-bold uppercase tracking-wide">
                                Active Orchestration
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-slate-950/30 border border-white/[0.03] rounded-2xl p-4 min-h-0">
                            <UnifiedTaskOrchestrator 
                                isVisible={true} 
                                onToggle={() => {}} 
                                userId={user?.id}
                            />
                        </div>
                    </div>
                )}

                {/* 🌐 PREMIUM WEB CO-PILOT BROWSER PANEL */}
                {panelType === 'browser' && (
                    <div className="flex-1 flex flex-col bg-white overflow-hidden text-slate-800">
                        {/* Immersive Address Bar Header */}
                        <div className="h-12 border-b bg-slate-50 border-slate-200 flex items-center px-4 gap-3 flex-shrink-0">
                            <div className="flex gap-1.5">
                                <button className="p-1 hover:bg-slate-200 rounded transition text-slate-500">
                                    <ChevronLeft size={16} />
                                </button>
                                <button className="p-1 hover:bg-slate-200 rounded transition text-slate-500">
                                    <ChevronRight size={16} />
                                </button>
                                <button 
                                    onClick={() => setLocalBrowserUrl(prev => prev)} 
                                    className="p-1 hover:bg-slate-200 rounded transition text-slate-500"
                                >
                                    <RotateCw size={14} />
                                </button>
                            </div>

                            {/* Address Input */}
                            <div className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1 text-xs text-slate-600 flex items-center gap-2 overflow-hidden shadow-sm">
                                <Globe size={12} className="text-slate-400" />
                                <input 
                                    type="text"
                                    value={localBrowserUrl}
                                    onChange={(e) => setLocalBrowserUrl(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            let url = localBrowserUrl;
                                            if (!/^https?:\/\//i.test(url)) {
                                                url = 'https://' + url;
                                            }
                                            setLocalBrowserUrl(url);
                                            setPanelState((prev: any) => ({ ...prev, browserUrl: url }));
                                            displayManager.syncState({
                                                type: 'SYNC_STATE',
                                                panel: 'browser',
                                                state: { ...panelState, browserUrl: url }
                                            });
                                        }
                                    }}
                                    className="flex-1 border-none focus:ring-0 focus:outline-none text-xs"
                                />
                            </div>

                            {/* Proxy Shield Toggle */}
                            <button
                                onClick={() => {
                                    const nextComp = !panelState.browserCompatibilityMode;
                                    setPanelState((prev: any) => ({ ...prev, browserCompatibilityMode: nextComp }));
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-bold uppercase transition ${
                                    panelState.browserCompatibilityMode 
                                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' 
                                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                }`}
                                title="Toggle Proxy Mode to bypass Iframe restrictions"
                            >
                                {panelState.browserCompatibilityMode ? <Shield size={12} /> : <ShieldOff size={12} />}
                                {panelState.browserCompatibilityMode ? 'Proxy ON' : 'Proxy OFF'}
                            </button>
                        </div>
                        
                        <iframe 
                            src={(() => {
                                const url = panelState.browserUrl || 'https://www.google.com/search?q=GenieFlow+AI';
                                const useProxy = panelState.browserCompatibilityMode !== false;
                                return useProxy
                                    ? `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
                                    : url;
                            })()}
                            className="flex-1 w-full border-none" 
                            title="Detached Browser" 
                            key={panelState.browserCompatibilityMode !== false ? 'proxied' : 'direct'}
                        />
                    </div>
                )}
            </div>

            {/* ⚡️ CONNECTION FOOTER */}
            <div className="h-6 bg-slate-950/80 border-t border-white/[0.04] flex items-center justify-between px-4 flex-shrink-0 text-[9px] text-slate-500 font-bold uppercase tracking-wider select-none">
                <div className="flex items-center gap-2">
                    <Sparkles size={9} className="text-blue-400" />
                    <span>Real-Time Cloud Synchronization Engine Active</span>
                </div>
                <span>Antigravity Swarm v2.0</span>
            </div>
        </div>
    );
};
