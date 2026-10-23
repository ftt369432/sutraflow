import React, { useState, useEffect } from 'react';
import {
    Activity, 
    FileText, 
    X, 
    ShieldCheck,
    Brain,
    Plus,
    Maximize2,
    Minimize2,
    Zap,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useHQStore } from '../store/hqStore';
import { useAssistantStore } from '../store/assistantStore';
import { useAgentFlowStore } from '../store/agentFlowStore';
import { cn } from '../lib/utils';
import HQCommandFooter from './HQCommandFooter';
import { SovereignVisualizer } from '../components/canvas/SovereignVisualizer';
import { getOrchestrationManifest } from '../services/agents/OrchestrationManifest';
import { DocumentViewer } from '../components/knowledge/DocumentViewer';
import { useKnowledgeBaseStore } from '../store/knowledgeBaseStore';
import { useAttachedDriveStore } from '../store/attachedDriveStore';
import { AIServiceFactory } from '../services/ai/aiServiceFactory';
import { useAuth } from '../contexts/AuthContext';
import { AIAgentOrchestrator } from '../services/agents/AIAgentOrchestrator';
import { MissionView } from '../components/hq/MissionView';
import { HQSidebar } from '../components/hq/HQSidebar';
import { fileHandlingService } from '../services/FileHandlingService';
import { AIDocument } from '../types/ai';
import { useNavigate } from 'react-router-dom';
import { useAddonStore } from '../store/addonStore';
import { missionPersistence } from '../services/MissionPersistenceService';
import { sovereignAgentOrchestrator, AgentStepProgress } from '../services/ai/SovereignAgentOrchestrator';
import { nebiusTokenFactory } from '../services/ai/NebiusTokenFactoryService';
import type { TraceStep } from '../components/hq/ExecutionTraceCard';
import { BRAND_CONFIG } from '../config/brand';
import { sovereignFs } from '../services/fs/sovereignFsBridge';
import { unwrapModelDeliverable } from '../utils/deliverableUnwrapper';

const GenieFlowHQPage: React.FC = () => {
    const { hqEnabled } = useAddonStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (hqEnabled === false) {
            navigate('/dashboard');
        }
    }, [hqEnabled, navigate]);

    const {
        missions, activeMissionId, addMission, deleteMission, setActiveMission,
        _workspaces, pinItem, unpinItem,
        addMissionMessage, updateMissionMessage, syncMissionWithManifest
    } = useHQStore() as any;
    const { fetchAssistants, assistants } = useAssistantStore();
    const { secureMode, setSecureMode } = useAgentFlowStore();
    const { documents, loadDocuments } = useKnowledgeBaseStore();

    const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
    const [sidebarTab, setSidebarTab] = useState<'inbox' | 'workspaces' | 'knowledge' | 'settings'>('workspaces');
    const [activeViewportFile, setActiveViewportFile] = useState<string | null>(null);
    const [activeCanvasData, setActiveCanvasData] = useState<any>(null);
    const [viewportTabs, setViewportTabs] = useState<Array<{ id: string; title: string; type?: string; content?: string }>>([]);

    const openViewportTab = React.useCallback((id: string, title?: string, type?: string, content?: string) => {
        if (!id) return;
        const cleanTitle = title || documents.find(d => d.id === id || d.title === id)?.title || id.split(/[\\/]/).pop() || 'Artifact Document';
        setViewportTabs(prev => {
            const exists = prev.some(t => t.id === id);
            if (exists) {
                return prev.map(t => t.id === id ? { ...t, title: cleanTitle, type: type || t.type, content: content !== undefined ? content : t.content } : t);
            }
            return [...prev, { id, title: cleanTitle, type, content }];
        });
        setActiveViewportFile(id);
        if (content !== undefined) {
            setActiveCanvasData({ id, title: cleanTitle, content, type });
        }
    }, [documents]);

    const handleCloseViewportTab = React.useCallback((id: string) => {
        setViewportTabs(prev => {
            const next = prev.filter(t => t.id !== id);
            if (activeViewportFile === id) {
                if (next.length > 0) {
                    const last = next[next.length - 1];
                    setActiveViewportFile(last.id);
                    setActiveCanvasData(last.content ? last : null);
                } else {
                    setActiveViewportFile(null);
                    setActiveCanvasData(null);
                }
            }
            return next;
        });
    }, [activeViewportFile]);
    const [hqChatInput, setHqChatInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [selectedWorkspace, setSelectedWorkspace] = useState('General');
    const [expandedWorkspaces, setExpandedWorkspaces] = useState<string[]>(['General']);
    const [isResourceMonitorOpen, setIsResourceMonitorOpen] = useState(false);

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            console.log(`📁 HQ Upload: Processing ${files.length} files...`);
            for (let i = 0; i < files.length; i++) {
                await fileHandlingService.processFile(files[i]);
            }
            e.target.value = '';
        }
    };

    const { user } = useAuth();
    const hqUser = user || { id: 'current-user' };

    const activeMission = missions.find(m => m.id === activeMissionId);

    // 🔬 SYNC WITH ORCHESTRATION MANIFEST (The Brain-to-Dashboard Bridge)
    useEffect(() => {
        if (!activeMissionId)
            return;

        try {
            // 🎯 MISSION ISOLATION: Each mission gets its own unique brain state
            const namespace = `orchestration_manifest_${activeMissionId}`;
            const manifest = getOrchestrationManifest(hqUser.id, namespace);

            // Subscribe to real-time manifest updates
            const unsubscribe = manifest.subscribe((state: any) => {
                console.log('🧠 HQ: Manifest update detected, syncing mission state...');
                syncMissionWithManifest(activeMissionId, state);
            });

            return () => unsubscribe();
        } catch (error) {
            console.error('❌ HQ: Failed to bridge with Orchestration Manifest:', error);
        }
    }, [activeMissionId, syncMissionWithManifest, hqUser.id]);

    const [attachedFileDoc, setAttachedFileDoc] = useState<AIDocument | null>(null);

    const activeDocument = documents.find(d => 
        d.id === activeViewportFile || 
        d.title === activeViewportFile || 
        d.metadata?.title === activeViewportFile
    );

    // 📂 ATTACHED DRIVE PREVIEW: Read files directly from Drive (E:) or Google Drive
    useEffect(() => {
        if (!activeViewportFile || activeViewportFile.startsWith('msg_') || activeViewportFile.startsWith('deliverable_')) {
            setAttachedFileDoc(null);
            return;
        }

        if (activeDocument || activeCanvasData?.id === activeViewportFile) {
            setAttachedFileDoc(null);
            return;
        }

        try {
            const driveStore = useAttachedDriveStore.getState();
            const findInNodes = (nodes: any[]): any => {
                if (!Array.isArray(nodes)) return null;
                for (const n of nodes) {
                    if (n.id === activeViewportFile || n.path === activeViewportFile || n.name === activeViewportFile) return n;
                    if (n.children) {
                        const found = findInNodes(n.children);
                        if (found) return found;
                    }
                }
                return null;
            };
            let node: any = null;
            if (Array.isArray(driveStore?.drives)) {
                for (const drive of driveStore.drives) {
                    node = findInNodes(drive?.items);
                    if (node) break;
                }
            }

            const cleanName = activeViewportFile.split(/[\\/]/).pop() || activeViewportFile;
            const candidatePaths: string[] = [];
            if (node?.path) candidatePaths.push(node.path);
            if (activeViewportFile.includes('\\') || activeViewportFile.includes('/')) {
                candidatePaths.push(activeViewportFile);
            }

            if (activeMission?.title) {
                const safeTitle = activeMission.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                candidatePaths.push(
                    `C:\\Users\\Ftt\\genieflowai\\missions\\${safeTitle}\\${cleanName}`,
                    `missions/${safeTitle}/${cleanName}`
                );
            }

            candidatePaths.push(
                `C:\\Users\\Ftt\\genieflowai\\${cleanName}`,
                `C:\\Users\\Ftt\\genieflowai\\missions\\${cleanName}`,
                `C:\\Users\\Ftt\\genieflowai\\AI_GENERATED_DOCS\\${cleanName}`,
                `G:\\My Drive\\.GENIEFLOW_MASTER\\${cleanName}`,
                `E:\\${cleanName}`
            );

            (async () => {
                for (const cand of candidatePaths) {
                    try {
                        const res = await sovereignFs.readFile({ path: cand });
                        if (res?.success && res.content !== undefined) {
                            setAttachedFileDoc({
                                id: activeViewportFile,
                                title: cleanName,
                                content: typeof res.content === 'string' ? res.content : JSON.stringify(res.content, null, 2),
                                type: 'document',
                                metadata: {
                                    source: cand,
                                    category: cleanName.endsWith('.md') ? 'markdown' : 'file'
                                }
                            } as AIDocument);
                            return;
                        }
                    } catch (_) {}
                }
                console.warn(`Could not resolve viewport file '${activeViewportFile}' across candidate paths.`);
            })();
        } catch (err) {
            console.error('Error finding or reading viewport file:', err);
        }
    }, [activeViewportFile, activeDocument, activeCanvasData, activeMission]);
    
    // Cast KBDocument or AttachedDrive file to AIDocument for DocumentViewer compatibility
    const aiActiveDocument = activeDocument ? {
        ...activeDocument,
        metadata: {
            ...activeDocument.metadata,
            source: activeDocument.metadata?.source || 'unknown'
        }
    } as AIDocument : attachedFileDoc;

    useEffect(() => {
        fetchAssistants();
    }, [fetchAssistants]);

    // 🔬 LISTEN FOR EXTERNAL CANVAS CREATION EVENTS (Bridge from Agent System)
    useEffect(() => {
        const handleCreateCanvas = async (event: Event) => {
            const customEvent = event as CustomEvent;
            if (customEvent.detail) {
                console.log('📡 HQ UI received canvas creation event:', customEvent.detail);
                const detail = customEvent.detail;

                // 1. Refresh knowledge base to pick up the new file from ai_drive_files
                await loadDocuments();

                // 2. Automatically open the new document in the viewer tab dock (ignore empty echoes of user prompt)
                const isEchoOfUserGoal = activeMission?.goal && detail.content && detail.content.trim() === activeMission.goal.trim();
                if (!isEchoOfUserGoal && detail.id) {
                    const cleanTitle = detail.title || detail.id.split(/[\\/]/).pop() || 'Generated Document';
                    openViewportTab(detail.id, cleanTitle, detail.type, detail.content);
                }
            }
        };

        const handleUpdateCanvas = async (_event: Event) => {
            console.log('📡 HQ UI received canvas update event');
            await loadDocuments();
        };

        window.addEventListener('genieflow:create-canvas', handleCreateCanvas as EventListener);
        window.addEventListener('genieflow:update-canvas', handleUpdateCanvas as EventListener);
        
        return () => {
            window.removeEventListener('genieflow:create-canvas', handleCreateCanvas as EventListener);
            window.removeEventListener('genieflow:update-canvas', handleUpdateCanvas as EventListener);
        };
    }, [loadDocuments]);

    const toggleWorkspaceExpansion = (ws: string) => {
        setExpandedWorkspaces(prev =>
            prev.includes(ws) ? prev.filter(x => x !== ws) : [...prev, ws]
        );
    };

    const handleStartNewMission = (workspaceName?: string, assistantId?: string) => {
        const assistant = assistants.find(a => a.id === assistantId);
        const ws = workspaceName || selectedWorkspace || 'General';

        const id = addMission({
            title: assistant ? `Mission with ${assistant.name} ` : 'New Autonomous Mission',
            goal: 'Initializing...',
            status: 'active',
            progress: 0,
            workspace: ws,
            assistantId: assistant?.id,
            leadAgent: assistant?.name,
            manifestState: {
                manifestVersion: '1.0',
                sessionId: Date.now().toString(),
                userId: hqUser.id,
                currentTaskId: null,
                tasks: {},
                workflowStatus: 'idle',
                activeAgents: [],
                lastUpdated: new Date().toISOString()
            } as any,
            tags: [],
            unreadNotifications: 0,
            needsInput: false
        });

        setActiveMission(id);
        if (!expandedWorkspaces.includes(ws)) {
            setExpandedWorkspaces(prev => [...prev, ws]);
        }
    };

    const handleSendHqMessage = async (customMessage?: string) => {
        const inputToSend = customMessage || hqChatInput;
        if (!inputToSend.trim()) return;

        // 🛡️ SENTINEL SECURITY SCAN (Immediate Feedback)
        if (isSending) return;
        setIsSending(true);

        try {
            const { Guardrails } = await import('../cortex/Guardrails');
            const securityResult: any = await Guardrails.scanInput(inputToSend);
            if (securityResult?.blocked) {
                alert(`⚠️ SECURITY BLOCK: ${securityResult.reason}\n\nYour request has been intercepted for safety.`);
                setIsSending(false);
                return;
            }
        } catch (e) {
            console.warn('🛡️ Sentinel bypassed in UI');
        }

        let missionIdToUse: string | null = activeMissionId;
        if (!missionIdToUse) {
            // If no active mission, start one first
            missionIdToUse = addMission({
                title: 'Quick Command Mission',
                goal: inputToSend,
                status: 'active',
                progress: 0,
                workspace: selectedWorkspace,
                manifestState: {
                    manifestVersion: '1.0',
                    sessionId: Date.now().toString(),
                    userId: hqUser.id,
                    currentTaskId: null,
                    tasks: {},
                    workflowStatus: 'idle',
                    activeAgents: [],
                    lastUpdated: new Date().toISOString()
                } as any,
                tags: [],
                unreadNotifications: 0,
                needsInput: false
            });
            setActiveMission(missionIdToUse);
        }

        if (!customMessage) {
            setHqChatInput('');
        }

        // Add user message to mission view and persist to disk transcript
        addMissionMessage(missionIdToUse, {
            role: 'user',
            content: inputToSend
        });
        missionPersistence.recordStep(missionIdToUse, {
            role: 'user',
            content: inputToSend
        }).catch(err => console.warn('Transcript write warning:', err));

        try {
            // 🧠 Antigravity-Style Local Drive Grounding & Direct Execution
            const lowerInput = inputToSend.toLowerCase();
            let localContext = '';

            const bridge = (window as any).electronBridge;
            if (bridge?.fs?.readFile) {
                // Robust fuzzy check: manifest (including typos like manfiest), assets, brain, tools, precedents, etc.
                const isManifestRequest = /man[a-z]*f[a-z]*st|asset|brain|system.*overview|tool|precedent|vault|brief/i.test(inputToSend);
                if (isManifestRequest) {
                    const candidatePaths = [
                        'G:\\My Drive\\.GENIEFLOW_MASTER\\MASTER_MANIFEST.md',
                        'E:\\.genieflowai.brain\\MASTER_MANIFEST.md',
                        'E:\\MASTER_MANIFEST.md',
                        'C:\\Users\\Ftt\\genieflowai\\MASTER_MANIFEST.md'
                    ];
                    for (const cp of candidatePaths) {
                        try {
                            const res = await bridge.fs.readFile({ path: cp });
                            if (res?.success && res.content) {
                                // Provide rich grounding excerpt up to 45,000 characters
                                const excerpt = res.content.length > 45000 
                                    ? res.content.substring(0, 45000) + '\n\n...[Manifest continues with additional case vaults and briefs]' 
                                    : res.content;
                                localContext += `\n\n[VERIFIED MASTER MANIFEST ATTACHMENT FROM ${cp}]:\n${excerpt}\n`;
                                
                                // If the user asks to find, open, view, or inspect the manifest, pop it directly into the Viewport!
                                if (/find|open|view|show|inspect|locate|manifest|manfiest/i.test(lowerInput)) {
                                    openViewportTab(cp, 'MASTER MANIFEST (Travel Drive)', 'document', res.content);
                                }
                                break;
                            }
                        } catch {}
                    }
                }

                // 📂 Attached Drive Auto-Discovery ("See It All Protocol")
                const trimmed = inputToSend.trim();
                const rawTerms = trimmed
                    .replace(/^(do you see|check|inspect|audit|read|show me|find|where is|open)\s+/i, '')
                    .split(/[\s,]+/)
                    .map((w) => w.replace(/[^a-zA-Z0-9_.-]/g, ''))
                    .filter((w) => w.length >= 4 && !['file', 'pinned', 'record', 'drive', 'master', 'please', 'there', 'what', 'have'].includes(w.toLowerCase()));

                if (rawTerms.length > 0) {
                    const drives = useAttachedDriveStore.getState().drives || [];
                    for (const d of drives) {
                        const scanItems = (nodes: any[]): any => {
                            for (const n of nodes) {
                                if (!n.isFolder && rawTerms.some((term) => n.name.toLowerCase().includes(term.toLowerCase()))) {
                                    return n;
                                }
                                if (n.children) {
                                    const sub = scanItems(n.children);
                                    if (sub) return sub;
                                }
                            }
                            return null;
                        };
                        const matchedNode = d.items ? scanItems(d.items) : null;
                        if (matchedNode && matchedNode.path) {
                            try {
                                const res = await sovereignFs.readFile({ path: matchedNode.path });
                                if (res?.success && res.content) {
                                    localContext += `\n\n[AUTO-DISCOVERED ATTACHED RECORD (${matchedNode.name} - ${matchedNode.path})]:\n${typeof res.content === 'string' ? res.content.slice(0, 32000) : JSON.stringify(res.content).slice(0, 32000)}\n`;
                                    break;
                                }
                            } catch (_) {}
                        }
                    }
                }

                // 🔍 Autonomous Disk Search across attached drives (G:, E:, C:)
                const isSearchRequest = /(search|find|locate|lookup|look for)\s+(file|doc|case|brief|petition|record|template|folder|\b[a-zA-Z0-9_\-\.]{3,}\b)/i.test(inputToSend);
                if (isSearchRequest && bridge?.shell?.exec) {
                    const match = inputToSend.match(/(?:search|find|locate|lookup|look for)\s+(?:for\s+)?(?:file|doc|case|brief|petition|record|template|folder\s+)?['"]?([^'"]+)['"]?/i);
                    const queryTerm = match ? match[1].trim().replace(/['"`$;]/g, '') : '';
                    if (queryTerm && queryTerm.length > 2 && !queryTerm.toLowerCase().includes('drive')) {
                        try {
                            const cmd = `powershell -NoProfile -Command "Get-ChildItem -Path 'G:\\My Drive\\.GENIEFLOW_MASTER', 'G:\\My Drive\\00 ALLEN', 'E:\\.genieflowai.brain' -Filter '*${queryTerm}*' -Recurse -Depth 3 -ErrorAction SilentlyContinue | Select-Object -First 15 FullName"`;
                            const sRes = await bridge.shell.exec({ command: cmd });
                            if (sRes?.success && sRes.stdout) {
                                const foundFiles = sRes.stdout.split(/\r?\n/).map((l: string) => l.trim()).filter((l: string) => l && (l.includes('\\') || l.includes('/')));
                                if (foundFiles.length > 0) {
                                    localContext += `\n\n[VERIFIED DISK SEARCH RESULTS FOR "${queryTerm}"]:\nFound ${foundFiles.length} matching files on attached drives:\n${foundFiles.map((f: string) => `- ${f}`).join('\n')}\n`;
                                }
                            }
                        } catch {}
                    }
                }

                // Ground pinned files from current mission if any
                const currentMission = missions.find((m: any) => m.id === missionIdToUse);
                const pinned = currentMission?.pinnedItems || [];
                for (const item of pinned) {
                    const itemPath = item.id || item.name;
                    if (itemPath && (itemPath.includes('\\') || itemPath.includes('/'))) {
                        try {
                            const pRes = await bridge.fs.readFile({ path: itemPath });
                            if (pRes?.success && pRes.content) {
                                localContext += `\n\n[PINNED FILE: ${item.name || itemPath}]\n${pRes.content.substring(0, 16000)}\n`;
                            }
                        } catch {}
                    }
                }
            }

            // Execute using active AI model (Nebius / RTX 4090 / Gemini)
            const aiFactory = AIServiceFactory.getInstance();
            const systemPrompt = `You are ${BRAND_CONFIG.name} (${BRAND_CONFIG.webName}), operating as a deterministic California Workers' Compensation research, tools, and calculation assistant pair-programming with the practitioner.
You operate with the high standards, thoroughness, and precision of Google Antigravity.
You have direct read visibility into the practitioner's attached sovereign drives (Google Drive Master G:\\My Drive\\.GENIEFLOW_MASTER, Travel Drive E:\\.genieflowai.brain, and Local NVMe Workspace C:\\Users\\Ftt\\genieflowai).
The authoritative Master Manifest and System Architecture is located at G:\\My Drive\\.GENIEFLOW_MASTER\\MASTER_MANIFEST.md (or E:\\.genieflowai.brain\\MASTER_MANIFEST.md).
NEVER ask the user to run bash or dir commands to locate files. You already have access to the verified disk contents provided below.
DIRECT DIRECTIVE: NEVER claim you cannot access Google Drive or local directories. If records are provided below, audit and cite them directly. If the user asks whether a record is pinned or visible, confirm its status and summarize its contents accurately.
When asked about available assets, tools, or the manifest, examine the verified grounding text below and provide a structured, comprehensive, and exhaustive breakdown of all legal engines, compilers, case law vaults, calculators, and runtime launchers.
When asked to create Python scripts, HTML dashboards, calculations, or legal templates:
- Provide production-grade, functional code inside standard code blocks (\`\`\`python, \`\`\`html, \`\`\`markdown, etc.).
- Include a top-line comment specifying the filename (e.g. # filename.py or <!-- dashboard.html -->).
- The Sovereign Mission Persistence Engine automatically parses and writes these artifacts directly to disk under E:\\.genieflowai.brain\\missions\\<missionId>\\artifacts\\.
${localContext ? `\nVERIFIED DISK GROUNDING:\n${localContext}` : ''}`;

            let response: string;
            const hasNebiusKey = !!nebiusTokenFactory.getApiKey();
            const mid = missionIdToUse as string;

            if (hasNebiusKey) {
                // 🧠 Antigravity-style ReAct loop: every thought, tool call and result streams live into one trace card
                const trace: TraceStep[] = [];
                const traceMsgId: string = addMissionMessage(mid, {
                    role: 'assistant',
                    content: '🔍 Execution trace',
                    agentName: 'GenieFlow Sovereign Agent',
                    metadata: { trace: [], traceStatus: 'running' }
                });
                const push = (step: Omit<TraceStep, 'id' | 'at'>, status: 'running' | 'complete' | 'error' = 'running') => {
                    trace.push({ ...step, id: `T${trace.length}`, at: Date.now() });
                    updateMissionMessage(mid, traceMsgId, {
                        metadata: { trace: [...trace], traceStatus: status }
                    });
                };

                response = await sovereignAgentOrchestrator.executeMission(
                    `${localContext ? `VERIFIED DISK GROUNDING:\n${localContext}\n\n` : ''}${inputToSend}`,
                    {
                        maxTurns: 50,
                        onProgress: (p: AgentStepProgress) => {
                            if (p.stage === 'thinking' && p.thought && !p.thought.startsWith('Evaluating objective')) {
                                push({ turn: p.turn, kind: 'thought', text: p.thought });
                            } else if (p.stage === 'tool_call') {
                                push({ turn: p.turn, kind: 'tool_call', toolName: p.toolName, toolArgs: p.toolArgs });
                            } else if (p.stage === 'tool_result') {
                                push({ turn: p.turn, kind: 'tool_result', toolName: p.toolName, toolOutput: p.toolOutput });
                            } else if (p.stage === 'complete') {
                                push({ turn: p.turn, kind: 'final' }, 'complete');
                            } else if (p.stage === 'error') {
                                push({ turn: p.turn, kind: 'error', text: p.thought }, 'error');
                            }
                        }
                    }
                );
                updateMissionMessage(mid, traceMsgId, {
                    metadata: { trace: [...trace], traceStatus: trace.some(t => t.kind === 'error') ? 'error' : 'complete' }
                });
            } else {
                // Fallback (no Nebius key): single-shot generation on the configured provider
                response = await aiFactory.generateText(inputToSend, {
                    system: systemPrompt,
                    category: 'legal',
                    source: 'GenieFlowHQ'
                });
            }

            // Final work product
            addMissionMessage(mid, {
                role: 'assistant',
                content: response,
                agentName: 'GenieFlow Sovereign AI'
            });

            // Persist assistant response and auto-extract code artifacts to disk
            missionPersistence.recordStep(missionIdToUse, {
                role: 'assistant',
                content: response,
                agentName: 'GenieFlow Sovereign AI'
            }).catch(err => console.warn('Transcript write warning:', err));

            // Auto-mount deliverable directly in HQ Viewport
            try {
                const unwrapped = unwrapModelDeliverable(response);
                const docId = `deliverable_${mid}`;
                const title = unwrapped.suggestedFileName || activeMission?.title || 'Deliverable Document';
                openViewportTab(docId, title, 'document', unwrapped.content || response);
            } catch (vpErr) {
                console.warn('Failed to auto-mount deliverable in viewport:', vpErr);
            }

            // Update manifest mission completion state without re-dispatching a duplicate execution swarm
            try {
                const manifest = getOrchestrationManifest(hqUser.id, `orchestration_manifest_${missionIdToUse}`);
                if (!manifest.state.tasks[missionIdToUse]) {
                    manifest.addTask({
                        id: missionIdToUse,
                        title: inputToSend.slice(0, 60),
                        type: 'composite',
                        status: 'in-progress',
                        priority: 1,
                        metadata: { missionId: missionIdToUse }
                    });
                }
                manifest.updateTaskStatus(missionIdToUse, 'completed' as any, { 
                    deliverable: response 
                });
            } catch {}
        } catch (err) {
            console.error('❌ Failed to process command:', err);
            const errMsg = `❌ Execution failed: ${err instanceof Error ? err.message : String(err)}`;
            addMissionMessage(missionIdToUse, {
                role: 'assistant',
                content: errMsg,
                agentName: 'System Orchestrator'
            });
            missionPersistence.recordStep(missionIdToUse, {
                role: 'assistant',
                content: errMsg,
                agentName: 'System Orchestrator'
            }).catch(() => {});
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex h-full w-full bg-slate-50 dark:bg-[#050507] overflow-hidden font-sans text-slate-900 dark:text-slate-100 selection:bg-blue-500/30 transition-colors duration-500">
            {/* HQ Sidebar (Navigation & Orchestration Control) */}
            <HQSidebar 
                isSidebarMinimized={isSidebarMinimized}
                setIsSidebarMinimized={setIsSidebarMinimized}
                sidebarTab={sidebarTab}
                setSidebarTab={setSidebarTab}
                missions={missions}
                activeMissionId={activeMissionId}
                setActiveMission={setActiveMission}
                deleteMission={deleteMission}
                handleStartNewMission={(ws, aid) => handleStartNewMission(ws as any, aid as any)}
                selectedWorkspace={selectedWorkspace}
                setSelectedWorkspace={setSelectedWorkspace}
                expandedWorkspaces={expandedWorkspaces}
                toggleWorkspaceExpansion={toggleWorkspaceExpansion}
                assistants={assistants}
                setActiveViewportFile={setActiveViewportFile}
                pinItem={pinItem}
                secureMode={secureMode}
                setSecureMode={setSecureMode}
                isResourceMonitorOpen={isResourceMonitorOpen}
                setIsResourceMonitorOpen={setIsResourceMonitorOpen}
            />

            {/* Main Application Intelligence Layer */}
            <main className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden bg-white dark:bg-[#0a0a0f] relative transition-colors duration-500">
                {/* 🛰️ SOVEREIGN COMMAND HEADER */}
                <header className="h-16 shrink-0 px-8 flex items-center justify-between border-b border-slate-100 dark:border-white/[0.03] bg-white/80 dark:bg-black/40 backdrop-blur-2xl sticky top-0 z-40 transition-all duration-500">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-blue-900 rounded-xl flex items-center justify-center shadow-2xl shadow-blue-500/20 ring-1 ring-blue-400/30">
                                <Brain className="h-6 w-6 text-white animate-pulse" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0a0a0f] animate-ping" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">Sovereign HQ</h1>
                                <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[9px] font-bold tracking-[0.2em] uppercase py-0 px-2 h-4">Neural-Link Active</Badge>
                                
                                <div className="flex items-center gap-2 px-2 py-0.5 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] rounded-lg ml-2">
                                    <div className={cn("h-2 w-2 rounded-full", secureMode ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-300")} />
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                        {secureMode ? 'Encrypted Pulse' : 'Clear Link'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Activity className="h-2.5 w-2.5 text-blue-500/50" />
                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Logic Stream: STABLE // Sector: Workers Comp</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] rounded-2xl">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleStartNewMission()} 
                                className="h-8 text-[10px] font-bold px-4 gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5 transition-all text-xs"
                            >
                                <Plus className="h-3 w-3" /> New Swarm
                            </Button>
                            <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 mx-1" />
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className={cn(
                                    "h-8 text-[10px] font-bold px-4 transition-all rounded-lg", 
                                    activeViewportFile 
                                        ? "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.3)] ring-1 ring-blue-500/30 font-bold" 
                                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5"
                                )}
                                onClick={() => {
                                    if (activeViewportFile) {
                                        setActiveViewportFile(null);
                                    } else {
                                        if (viewportTabs.length > 0) {
                                            const lastTab = viewportTabs[viewportTabs.length - 1];
                                            setActiveViewportFile(lastTab.id);
                                            if (lastTab.content) setActiveCanvasData(lastTab);
                                        } else {
                                            const lastPinned = activeMission?.pinnedItems?.[activeMission.pinnedItems.length - 1];
                                            if (lastPinned) {
                                                openViewportTab(lastPinned.id, lastPinned.name);
                                            } else {
                                                const lastAssistantMsg = [...(activeMission?.history || [])].reverse().find(m => m.role === 'assistant' && m.content && !m.content.startsWith('⚡'));
                                                if (lastAssistantMsg) {
                                                    const unwrapped = unwrapModelDeliverable(lastAssistantMsg.content);
                                                    const docId = `msg_${lastAssistantMsg.id}`;
                                                    const title = unwrapped.suggestedFileName || activeMission?.title || 'Deliverable Document';
                                                    openViewportTab(docId, title, 'document', unwrapped.content || lastAssistantMsg.content);
                                                }
                                            }
                                        }
                                    }
                                }}
                            >
                                <Maximize2 className="h-3 w-3 mr-2" /> Viewport
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Sovereign Workspace Viewport */}
                <div className="flex-1 min-h-0 relative group/viewport flex flex-col h-full overflow-hidden">
                    {activeMission ? (
                        <MissionView 
                            mission={activeMission} 
                            onTaskClick={(id) => openViewportTab(id)}
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                            <div className="h-24 w-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 border border-slate-100">
                                <Activity className="h-10 w-10 text-slate-200" />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Mission Control Idle</h2>
                            <p className="text-slate-400 max-w-sm font-medium">
                                No active missions detected in this sector. Select a workspace or initialize a new drone swarm to begin.
                            </p>
                            <div className="mt-8 flex items-center gap-3">
                                <Button onClick={() => handleStartNewMission()} className="rounded-2xl gap-2 font-bold px-6 py-6 bg-slate-900 border-none">
                                    <Zap className="h-4 w-4 text-amber-500 fill-amber-500" /> Start Neural Scan
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Floating HUD Elements moved to Header */}
                </div>

                {/* HUD Viewport (Detachable Viewport for focus) */}
                <AnimateViewport 
                    isVisible={!!activeViewportFile} 
                    onClose={() => {
                        setActiveViewportFile(null);
                        setViewportTabs([]);
                    }}
                    title={activeCanvasData?.title || activeDocument?.title || viewportTabs.find(t => t.id === activeViewportFile)?.title || 'Viewport Activity'}
                    tabs={viewportTabs}
                    activeTabId={activeViewportFile}
                    onSelectTab={(id) => {
                        const found = viewportTabs.find(t => t.id === id);
                        setActiveViewportFile(id);
                        if (found?.content) {
                            setActiveCanvasData(found);
                        } else {
                            setActiveCanvasData(null);
                        }
                    }}
                    onCloseTab={handleCloseViewportTab}
                >
                    <div className="flex-1 min-h-0 bg-slate-50 dark:bg-slate-900 overflow-hidden">
                        {(() => {
                            const rawContent = activeCanvasData?.content || activeDocument?.content || attachedFileDoc?.content || '';
                            const unwrapped = unwrapModelDeliverable(rawContent);
                            const cleanContent = unwrapped.content || rawContent;
                            const isMermaid = (txt: string) => {
                                if (!txt) return false;
                                if (txt.includes('```mermaid')) return true;
                                return /^\s*(graph\s+(TD|TB|BT|RL|LR)|flowchart\s+(TD|TB|BT|RL|LR)|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph)\b/m.test(txt);
                            };
                            const isVisual = (activeCanvasData?.type === 'simulation_lab') ||
                                             (activeCanvasData?.type === 'chart') ||
                                             (activeCanvasData?.type === 'diagram') ||
                                             isMermaid(cleanContent);

                            if (isVisual) {
                                return (
                                    <SovereignVisualizer 
                                        key={activeViewportFile || 'none'}
                                        content={cleanContent}
                                        type={activeCanvasData?.type || activeDocument?.type}
                                    />
                                );
                            }

                            const displayDoc: AIDocument | null = (activeCanvasData || cleanContent) ? {
                                id: activeCanvasData?.id || activeViewportFile || 'canvas-artifact',
                                title: activeCanvasData?.title || activeDocument?.title || viewportTabs.find(t => t.id === activeViewportFile)?.title || 'Generated Document',
                                content: cleanContent,
                                type: 'document',
                                metadata: {
                                    source: activeCanvasData?.path || activeDocument?.metadata?.source || 'Sovereign Deliverable',
                                    category: 'markdown'
                                }
                            } : aiActiveDocument;

                            if (displayDoc && displayDoc.content) {
                                return (
                                    <DocumentViewer 
                                        key={displayDoc.id}
                                        document={displayDoc} 
                                        onClose={() => setActiveViewportFile(null)} 
                                        hideHeader={true}
                                    />
                                );
                            }

                            return (
                                <div className="flex flex-col items-center justify-center h-full w-full bg-slate-50 dark:bg-slate-900 p-6 text-center">
                                    <p className="text-slate-500 mb-4 font-medium">Document not found, it may have been deleted or is still loading.</p>
                                    <Button onClick={() => setActiveViewportFile(null)} variant="outline" size="sm">Close Viewport</Button>
                                </div>
                            );
                        })()}
                    </div>
                </AnimateViewport>

                {/* Global Command Hub (Footer) */}
                {(() => {
                    const activeAssistant = assistants.find(a => a.id === activeMission?.assistantId) || 
                                            assistants.find(a => a.name === activeMission?.leadAgent) || 
                                            assistants.find(a => a.id === selectedWorkspace);
                    return (
                        <HQCommandFooter 
                            hqChatInput={hqChatInput}
                            setHqChatInput={setHqChatInput}
                            activeMission={activeMission}
                            activeMissionId={activeMissionId}
                            handleSendHqMessage={handleSendHqMessage}
                            isRecording={isRecording}
                            setIsRecording={setIsRecording}
                            fileInputRef={fileInputRef}
                            handleFileChange={handleFileChange}
                            handleUploadClick={handleUploadClick}
                            pinItem={pinItem}
                            unpinItem={unpinItem}
                            setActiveViewportFile={setActiveViewportFile}
                            isSending={isSending}
                            activeAssistant={activeAssistant}
                        />
                    );
                })()}
            </main>
        </div>
    );
};

/* --- Visual Components --- */

interface AnimateViewportProps {
    isVisible: boolean;
    children: React.ReactNode;
    onClose: () => void;
    title: string;
    tabs?: Array<{ id: string; title: string; type?: string }>;
    activeTabId?: string | null;
    onSelectTab?: (id: string) => void;
    onCloseTab?: (id: string) => void;
}


const AnimateViewport: React.FC<AnimateViewportProps> = ({ 
    isVisible, 
    children, 
    onClose, 
    title,
    tabs = [],
    activeTabId,
    onSelectTab,
    onCloseTab
}) => {
    // Persistent customizable viewport width
    const [viewportWidth, setViewportWidth] = useState<number>(() => {
        try {
            const saved = localStorage.getItem('genieflow_hq_viewport_width');
            return saved ? parseInt(saved, 10) : Math.round(window.innerWidth * 0.5);
        } catch {
            return Math.round(window.innerWidth * 0.5);
        }
    });

    const [isMaximized, setIsMaximized] = useState<boolean>(false);
    const [isResizing, setIsResizing] = useState<boolean>(false);

    const startResizing = React.useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    useEffect(() => {
        if (!isResizing) return;
        const handleMouseMove = (e: MouseEvent) => {
            // Dragging the left edge of right-docked pane: width = window width - mouse X
            const newWidth = Math.max(340, Math.min(window.innerWidth - 300, window.innerWidth - e.clientX));
            setViewportWidth(newWidth);
            setIsMaximized(false);
            try {
                localStorage.setItem('genieflow_hq_viewport_width', newWidth.toString());
            } catch {}
        };
        const handleMouseUp = () => {
            setIsResizing(false);
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    const setPresetWidth = (fraction: number) => {
        const target = Math.round(window.innerWidth * fraction);
        setViewportWidth(target);
        setIsMaximized(fraction === 1);
        try {
            localStorage.setItem('genieflow_hq_viewport_width', target.toString());
        } catch {}
    };

    const toggleMaximize = () => {
        if (isMaximized) {
            setIsMaximized(false);
            const half = Math.round(window.innerWidth * 0.5);
            setViewportWidth(half);
        } else {
            setIsMaximized(true);
        }
    };

    const effectiveWidth = isMaximized ? '100%' : `${viewportWidth}px`;

    return (
        <div 
            style={{ width: isVisible ? effectiveWidth : 0 }}
            className={cn(
                "absolute right-0 top-0 bottom-0 bg-white dark:bg-[#0c0c14] border-l border-slate-200 dark:border-white/10 shadow-[2px_0_40px_rgba(0,0,0,0.15)] z-40",
                isResizing ? "transition-none select-none" : "transition-[width,transform] duration-300 ease-in-out",
                isVisible ? "translate-x-0" : "translate-x-full pointer-events-none"
            )}
        >
            {/* Draggable resize handle on the left edge */}
            {isVisible && !isMaximized && (
                <div
                    onMouseDown={startResizing}
                    className={cn(
                        "absolute top-0 -left-1.5 w-3 h-full cursor-col-resize hover:bg-blue-500/40 z-50 group select-none flex items-center justify-center transition-colors",
                        isResizing && "bg-blue-600/70"
                    )}
                    title="Drag to resize right pane"
                >
                    <div className="w-[3px] h-10 bg-slate-300 dark:bg-slate-600 group-hover:bg-blue-500 rounded-full transition-colors" />
                </div>
            )}

            <div className="flex flex-col h-full bg-white dark:bg-[#0c0c14] overflow-hidden">
                {/* Viewport Header */}
                <div className="h-14 px-4 sm:px-6 flex items-center justify-between border-b border-slate-100 dark:border-white/5 shrink-0 bg-white/80 dark:bg-[#0c0c14]/80 backdrop-blur">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="font-bold text-sm tracking-tight text-slate-800 dark:text-slate-100 truncate">{title}</h3>
                    </div>

                    {/* Width Preset Controls & Maximize / Close */}
                    <div className="flex items-center gap-1 shrink-0">
                        <div className="hidden sm:flex items-center bg-slate-100 dark:bg-white/5 rounded-lg p-0.5 mr-2 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            <button
                                onClick={() => setPresetWidth(0.38)}
                                className={cn("px-2 py-0.5 rounded-md hover:text-slate-900 dark:hover:text-white transition cursor-pointer", !isMaximized && viewportWidth < window.innerWidth * 0.45 && "bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-2xs")}
                                title="Compact view (38%)"
                            >
                                38%
                            </button>
                            <button
                                onClick={() => setPresetWidth(0.5)}
                                className={cn("px-2 py-0.5 rounded-md hover:text-slate-900 dark:hover:text-white transition cursor-pointer", !isMaximized && viewportWidth >= window.innerWidth * 0.45 && viewportWidth <= window.innerWidth * 0.6 && "bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-2xs")}
                                title="Split view (50%)"
                            >
                                50%
                            </button>
                            <button
                                onClick={() => setPresetWidth(0.7)}
                                className={cn("px-2 py-0.5 rounded-md hover:text-slate-900 dark:hover:text-white transition cursor-pointer", !isMaximized && viewportWidth > window.innerWidth * 0.6 && "bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-2xs")}
                                title="Wide view (70%)"
                            >
                                70%
                            </button>
                        </div>

                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={toggleMaximize} 
                            className="rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 h-8 w-8 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            title={isMaximized ? "Restore size" : "Maximize view"}
                        >
                            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </Button>

                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 h-8 w-8">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Multi-Artifact Tab Dock (Antigravity-Grade) */}
                {tabs.length > 1 && (
                    <div className="flex items-center gap-1 px-3 pt-1.5 border-b border-slate-200 dark:border-white/5 bg-slate-100/70 dark:bg-[#08080d] overflow-x-auto custom-scrollbar select-none shrink-0">
                        {tabs.map((tab) => {
                            const isActive = tab.id === activeTabId;
                            return (
                                <div
                                    key={tab.id}
                                    onClick={() => onSelectTab?.(tab.id)}
                                    className={cn(
                                        "group flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-semibold cursor-pointer transition-all border-t-2 shrink-0 max-w-[200px]",
                                        isActive
                                            ? "bg-white dark:bg-[#12121c] text-blue-600 dark:text-blue-400 border-blue-600 shadow-xs"
                                            : "bg-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-transparent hover:bg-slate-200/50 dark:hover:bg-white/[0.03]"
                                    )}
                                    title={tab.title}
                                >
                                    <FileText className={cn("h-3 w-3 shrink-0", isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400")} />
                                    <span className="truncate">{tab.title}</span>
                                    {onCloseTab && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onCloseTab(tab.id);
                                            }}
                                            className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 opacity-60 group-hover:opacity-100 transition-opacity ml-1"
                                            title="Close Artifact Tab"
                                        >
                                            <X className="h-2.5 w-2.5" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {children}
            </div>
        </div>
    );
};

export default GenieFlowHQPage;
