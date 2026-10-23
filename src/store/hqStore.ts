import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OrchestrationState } from '../services/agents/OrchestrationManifest';

export interface MissionMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    agentName?: string;
    metadata?: any; // e.g. { trace: TraceStep[], traceStatus: 'running'|'complete'|'error' }
}

export interface Mission {
    id: string;
    title: string;
    goal: string;
    status: 'active' | 'completed' | 'paused' | 'failed' | 'running' | 'idle';
    lastMessage?: string;
    progress: number;
    createdAt: string;
    updatedAt: string;
    manifestState: OrchestrationState; // Persistent state for this mission
    tags: string[];
    pinnedItems: { id: string; type: 'file' | 'folder'; name: string }[]; // Unified pinned items
    unreadNotifications: number;
    needsInput: boolean;
    workspace?: string; // e.g., 'genieflowai', 'law-workspace'
    assistantId?: string; // Linked Assistant from assistantStore
    agentType?: 'legal' | 'finance' | 'research' | 'code' | 'general';
    leadAgent?: string; // Name of the lead agent, e.g., "Legal Eagle"
    history: MissionMessage[]; // Chat history for this mission
}

interface HQState {
    missions: Mission[];
    activeMissionId: string | null;
    workspaces: string[]; // List of workspace folder names
    isLoading: boolean;
    error: string | null;

    // Actions
    addMission: (mission: Omit<Mission, 'id' | 'createdAt' | 'updatedAt' | 'pinnedItems' | 'history'>) => string;
    updateMission: (id: string, updates: Partial<Mission>) => void;
    deleteMission: (id: string) => void;
    setActiveMission: (id: string | null) => void;
    addWorkspace: (name: string) => void;
    deleteWorkspace: (name: string) => void;
    syncMissionWithManifest: (id: string, state: OrchestrationState) => void;
    markMissionAsNeedsInput: (id: string, needsInput: boolean) => void;
    pinItem: (missionId: string, item: { id: string; type: 'file' | 'folder'; name: string }) => void;
    unpinItem: (missionId: string, itemId: string) => void;
    addMissionMessage: (missionId: string, message: Omit<MissionMessage, 'id' | 'timestamp'>) => string;
    updateMissionMessage: (missionId: string, messageId: string, patch: Partial<MissionMessage>) => void;
}

export const useHQStore = create<HQState>()(
    persist(
        (set) => ({
            missions: [],
            activeMissionId: null,
            workspaces: ['General', 'Legal', 'Research'], // Default workspaces
            isLoading: false,
            error: null,

            addMission: (mission) => {
                const id = `MISSION-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
                const now = new Date().toISOString();
                const newMission: Mission = {
                    ...mission,
                    id,
                    createdAt: now,
                    updatedAt: now,
                    pinnedItems: [],
                    unreadNotifications: 0,
                    needsInput: false,
                    workspace: mission.workspace || 'General',
                    history: []
                };
                set((state) => ({
                    missions: [newMission, ...state.missions],
                    activeMissionId: id
                }));
                return id;
            },

            markMissionAsNeedsInput: (id, needsInput) => {
                set((state) => ({
                    missions: state.missions.map((m) =>
                        m.id === id ? { ...m, needsInput, updatedAt: new Date().toISOString() } : m
                    ),
                }));
            },

            updateMission: (id, updates) => {
                set((state) => ({
                    missions: state.missions.map((m) =>
                        m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
                    ),
                }));
            },

            deleteMission: (id) => {
                set((state) => {
                    const newMissions = state.missions.filter((m) => m.id !== id);
                    const newActiveId = state.activeMissionId === id
                        ? (newMissions.length > 0 ? newMissions[0].id : null)
                        : state.activeMissionId;
                    return {
                        missions: newMissions,
                        activeMissionId: newActiveId
                    };
                });
            },

            setActiveMission: (id) => {
                set({ activeMissionId: id });
            },

            addWorkspace: (name) => {
                set((state) => ({
                    workspaces: state.workspaces.includes(name)
                        ? state.workspaces
                        : [...state.workspaces, name]
                }));
            },

            deleteWorkspace: (name) => {
                if (name === 'General') return; // Protect default
                set((state) => ({
                    workspaces: state.workspaces.filter(ws => ws !== name)
                    // Note: In a real app, we might want to clean up missions too
                }));
            },

            syncMissionWithManifest: (id, manifestState) => {
                set((state) => ({
                    missions: state.missions.map((m) =>
                        m.id === id ? {
                            ...m,
                            manifestState,
                            status: manifestState.currentTaskId ? 'running' : m.status,
                            goal: manifestState.plan?.goal || manifestState.lastAction || m.goal,
                            lastMessage: manifestState.lastAction,
                            progress: manifestState.plan?.progress || m.progress,
                            unreadNotifications: (manifestState.agentQuestions || []).filter(q => !q.read).length,
                            needsInput: (manifestState.agentQuestions || []).some(q => !q.read),
                            updatedAt: new Date().toISOString()
                        } : m
                    ),
                }));
            },

            pinItem: (missionId, item) => {
                set((state) => ({
                    missions: state.missions.map((m) =>
                        m.id === missionId ? {
                            ...m,
                            pinnedItems: [...m.pinnedItems.filter(i => i.id !== item.id), item],
                            updatedAt: new Date().toISOString()
                        } : m
                    )
                }));
            },

            unpinItem: (missionId, itemId) => {
                set((state) => ({
                    missions: state.missions.map((m) =>
                        m.id === missionId ? {
                            ...m,
                            pinnedItems: m.pinnedItems.filter(i => i.id !== itemId),
                            updatedAt: new Date().toISOString()
                        } : m
                    )
                }));
            },

            addMissionMessage: (missionId, message) => {
                const msgId = `MSG-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
                set((state) => ({
                    missions: state.missions.map((m) =>
                        m.id === missionId ? {
                            ...m,
                            history: [...(m.history || []), {
                                ...message,
                                id: msgId,
                                timestamp: new Date().toISOString()
                            }],
                            updatedAt: new Date().toISOString(),
                            lastMessage: message.content
                        } : m
                    )
                }));
                return msgId;
            },

            updateMissionMessage: (missionId, messageId, patch) => {
                set((state) => ({
                    missions: state.missions.map((m) =>
                        m.id === missionId ? {
                            ...m,
                            history: (m.history || []).map((h) =>
                                h.id === messageId ? { ...h, ...patch } : h
                            ),
                            updatedAt: new Date().toISOString()
                        } : m
                    )
                }));
            },
        }),
        {
            name: 'genieflow-hq-storage',
            version: 1,
            migrate: (persistedState: any, version: number) => {
                if (version === 0) {
                    // Migration from version 0 to 1
                    if (persistedState && persistedState.missions) {
                        persistedState.missions = persistedState.missions.map((m: any) => ({
                            ...m,
                            pinnedItems: m.pinnedItems || []
                        }));
                    }
                }
                return persistedState as HQState;
            }
        }
    )
);
