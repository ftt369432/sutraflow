import { create } from 'zustand';

export interface SkillLog {
    id: string;
    skillId: string;
    status: 'running' | 'completed' | 'failed';
    message: string;
    timestamp: number;
    details?: any;
}

interface SkillState {
    activeSkills: Set<string>;
    logs: SkillLog[];
    startSkill: (skillId: string, message: string) => string;
    completeSkill: (logId: string, message: string, details?: any) => void;
    failSkill: (logId: string, message: string, error?: any) => void;
    clearLogs: () => void;
}

export const useSkillStore = create<SkillState>((set) => ({
    activeSkills: new Set(),
    logs: [],

    startSkill: (skillId, message) => {
        const id = `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        set((state) => ({
            activeSkills: new Set(state.activeSkills).add(skillId),
            logs: [
                { id, skillId, status: 'running', message, timestamp: Date.now() },
                ...state.logs
            ]
        }));
        return id;
    },

    completeSkill: (logId, message, details) => {
        set((state) => {
            const log = state.logs.find(l => l.id === logId);
            if (!log) return state;

            const newActiveSkills = new Set(state.activeSkills);
            newActiveSkills.delete(log.skillId);

            return {
                activeSkills: newActiveSkills,
                logs: state.logs.map(l =>
                    l.id === logId
                        ? { ...l, status: 'completed' as const, message, details, timestamp: Date.now() }
                        : l
                )
            };
        });
    },

    failSkill: (logId, message, error) => {
        set((state) => {
            const log = state.logs.find(l => l.id === logId);
            if (!log) return state;

            const newActiveSkills = new Set(state.activeSkills);
            newActiveSkills.delete(log.skillId);

            return {
                activeSkills: newActiveSkills,
                logs: state.logs.map(l =>
                    l.id === logId
                        ? { ...l, status: 'failed' as const, message, details: error, timestamp: Date.now() }
                        : l
                )
            };
        });
    },

    clearLogs: () => set({ logs: [] })
}));
