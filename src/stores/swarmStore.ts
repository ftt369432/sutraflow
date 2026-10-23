import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { LegalAgentRole, LegalAgentCapability } from '../types/legal'; // Assuming these types are available

// Types based on SwarmPanel.tsx and general needs
export interface SwarmMember {
  id: string; // Can be UUID
  name: string;
  role: string | LegalAgentRole;
  status: 'active' | 'idle' | 'busy' | 'error' | 'pending';
  performance?: number; // Optional, can be calculated or assigned
  tasksCompleted?: number; // Optional
  capabilities?: string[] | LegalAgentCapability[];
  assignedAgentId?: string; // Link to an actual agent
  error?: string | null; // For error state
  lastUpdate?: string; // ISO date string
}

export interface Swarm {
  id: string; // UUID
  name: string;
  description: string;
  members: SwarmMember[];
  status: 'active' | 'paused' | 'inactive' | 'error' | 'creating' | 'completed';
  type: 'general' | 'legal' | string; // Allow for more types
  creatorId?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  // Metrics
  efficiency?: number; // Overall efficiency
  totalTasks?: number;
  completedTasks?: number;
  averageTaskCompletionTime?: number; // in seconds or ms
  // Configuration / Template
  templateId?: string; // ID of the SwarmTemplate used to create this
  defaultInstructions?: string; // Default instructions for the swarm
  // Operational data
  currentPrompt?: string; // If the swarm is actively working on a prompt
  lastError?: string | null;
  executionLog?: string[]; // Simple log for now
}

interface SwarmState {
  swarms: Swarm[];
  currentSwarm: Swarm | null;
  isLoading: boolean;
  error: string | null;
}

interface SwarmActions {
  fetchSwarms: (userId?: string) => Promise<void>; // TODO: Implement Supabase fetching
  fetchSwarmById: (id: string) => Promise<void>; // TODO: Implement Supabase fetching
  createSwarm: (swarmData: Omit<Swarm, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Swarm | null>; // TODO: Implement Supabase
  updateSwarm: (id: string, updates: Partial<Omit<Swarm, 'id' | 'creatorId' | 'createdAt' | 'updatedAt'>>) => Promise<Swarm | null>; // TODO: Implement Supabase
  deleteSwarm: (id: string) => Promise<boolean>; // TODO: Implement Supabase
  addMemberToSwarm: (swarmId: string, member: SwarmMember) => void;
  updateMemberInSwarm: (swarmId: string, memberId: string, updates: Partial<SwarmMember>) => void;
  removeMemberFromSwarm: (swarmId: string, memberId: string) => void;
  setSwarmStatus: (swarmId: string, status: Swarm['status']) => Promise<void>;
  addLogToSwarm: (swarmId: string, logEntry: string) => void;
  clearError: () => void;
  // Placeholder for more complex operations
  // runSwarm: (swarmId: string, prompt: string) => Promise<void>;
  // pauseSwarm: (swarmId: string) => Promise<void>;
  // resumeSwarm: (swarmId: string) => Promise<void>;
}

const initialSwarmState: SwarmState = {
  swarms: [],
  currentSwarm: null,
  isLoading: false,
  error: null,
};

export const useSwarmStore = create<SwarmState & SwarmActions>()(
  persist(
    (set, get) => ({
      ...initialSwarmState,

      clearError: () => set({ error: null }),

      fetchSwarms: async (userId?: string) => {
        set({ isLoading: true, error: null });
        // TODO: Replace with Supabase call
        console.warn('Fetching swarms from store (mock)', userId);
        // Simulate fetching
        // For now, just ensure it doesn't overwrite persisted state unnecessarily unless empty
        if (get().swarms.length === 0) {
             // Basic mock data if nothing in localStorage, useful for initial setup.
             // In a real scenario, this would be fetched from Supabase.
            const mockSwarms: Swarm[] = [
                {
                    id: 'mock-swarm-1',
                    name: 'Mock Legal Research Swarm',
                    description: 'A mock swarm for initial testing of legal research tasks.',
                    members: [
                        { id: 'member-1', name: 'Lead Researcher', role: 'Legal Researcher', status: 'active', assignedAgentId: 'agent-research-lead' },
                        { id: 'member-2', name: 'Case Analyst', role: 'Case Analyst', status: 'idle', assignedAgentId: 'agent-case-analyst' }
                    ],
                    status: 'active',
                    type: 'legal',
                    creatorId: userId || 'system-mock',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    defaultInstructions: 'Research precedents for contract disputes.',
                    executionLog: ['Swarm initialized.'],
                }
            ];
            set({ swarms:userId ? mockSwarms.filter(s => s.creatorId === userId) : mockSwarms , isLoading: false });
        } else {
            set({isLoading: false}); // Already have swarms from persistence
        }
      },

      fetchSwarmById: async (id: string) => {
        set({ isLoading: true, error: null });
        // TODO: Replace with Supabase call
        const swarm = get().swarms.find(s => s.id === id) || null;
        set({ currentSwarm: swarm, isLoading: false });
        if (!swarm) {
          set({ error: 'Swarm not found' });
        }
      },

      createSwarm: async (swarmData) => {
        set({ isLoading: true, error: null });
        // TODO: Replace with Supabase call
        try {
          const newSwarm: Swarm = {
            ...swarmData,
            id: `swarm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Mock ID
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            members: swarmData.members || [], // Ensure members is initialized
            status: swarmData.status || 'inactive',
            executionLog: ['Swarm created.'],
          };
          set((state) => ({
            swarms: [...state.swarms, newSwarm],
            isLoading: false,
          }));
          return newSwarm;
        } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
          set({ error: errorMessage, isLoading: false });
          return null;
        }
      },

      updateSwarm: async (id, updates) => {
        set({ isLoading: true, error: null });
        // TODO: Replace with Supabase call
        try {
          let updatedSwarm: Swarm | null = null;
          set((state) => ({
            swarms: state.swarms.map(s => {
              if (s.id === id) {
                updatedSwarm = { ...s, ...updates, updatedAt: new Date().toISOString() };
                return updatedSwarm;
              }
              return s;
            }),
            isLoading: false,
          }));
          return updatedSwarm;
        } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
          set({ error: errorMessage, isLoading: false });
          return null;
        }
      },

      deleteSwarm: async (id) => {
        set({ isLoading: true, error: null });
        // TODO: Replace with Supabase call
        try {
          set((state) => ({
            swarms: state.swarms.filter(s => s.id !== id),
            isLoading: false,
          }));
          return true;
        } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
          set({ error: errorMessage, isLoading: false });
          return false;
        }
      },
      
      addMemberToSwarm: (swarmId: string, member: SwarmMember) => {
        set(state => {
            const swarm = state.swarms.find(s => s.id === swarmId);
            if (swarm) {
                const newMember = { ...member, id: `member-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, lastUpdate: new Date().toISOString() };
                const updatedMembers = [...swarm.members, newMember];
                const updatedSwarm = { ...swarm, members: updatedMembers, updatedAt: new Date().toISOString() };
                
                return {
                  swarms: state.swarms.map(s => s.id === swarmId ? updatedSwarm : s),
                  currentSwarm: state.currentSwarm?.id === swarmId ? updatedSwarm : state.currentSwarm,
                  isLoading: false,
                };
            }
            return { isLoading: false }; // Return part of state to satisfy set
        });
      },

      updateMemberInSwarm: (swarmId: string, memberId: string, updates: Partial<SwarmMember>) => {
        set(state => {
            let updatedSwarmInstance: Swarm | null = null;
            const newSwarms = state.swarms.map(s => {
                if (s.id === swarmId) {
                    const memberIndex = s.members.findIndex(m => m.id === memberId);
                    if (memberIndex > -1) {
                        const updatedMembers = [...s.members];
                        updatedMembers[memberIndex] = { ...updatedMembers[memberIndex], ...updates, lastUpdate: new Date().toISOString() };
                        updatedSwarmInstance = { ...s, members: updatedMembers, updatedAt: new Date().toISOString() };
                        return updatedSwarmInstance;
                    }
                }
                return s;
            });
            return {
                swarms: newSwarms,
                currentSwarm: state.currentSwarm?.id === swarmId ? updatedSwarmInstance : state.currentSwarm,
                isLoading: false,
            };
        });
      },

      removeMemberFromSwarm: (swarmId: string, memberId: string) => {
         set(state => {
            let updatedSwarmInstance: Swarm | null = null;
            const newSwarms = state.swarms.map(s => {
                if (s.id === swarmId) {
                    const updatedMembers = s.members.filter(m => m.id !== memberId);
                    if (updatedMembers.length !== s.members.length) {
                         updatedSwarmInstance = { ...s, members: updatedMembers, updatedAt: new Date().toISOString() };
                         return updatedSwarmInstance;
                    }
                }
                return s;
            });
            return {
                swarms: newSwarms,
                currentSwarm: state.currentSwarm?.id === swarmId ? updatedSwarmInstance : state.currentSwarm,
                isLoading: false,
            };
        });
      },

      setSwarmStatus: async (swarmId, status) => {
        get().updateSwarm(swarmId, { status });
      },

      addLogToSwarm: (swarmId: string, logEntry: string) => {
        set(state => {
            let updatedSwarmInstance: Swarm | null = null;
            const newSwarms = state.swarms.map(s => {
                if (s.id === swarmId) {
                    const newLog = `[${new Date().toISOString()}] ${logEntry}`;
                    const executionLog = [...(s.executionLog || []), newLog];
                    // Optional: Keep log size manageable
                    // if (executionLog.length > 100) executionLog.shift(); 
                    updatedSwarmInstance = { ...s, executionLog, updatedAt: new Date().toISOString() };
                    return updatedSwarmInstance;
                }
                return s;
            });
            return {
                swarms: newSwarms,
                currentSwarm: state.currentSwarm?.id === swarmId ? updatedSwarmInstance : state.currentSwarm,
                isLoading: false
            };
        });
      }

    }),
    {
      name: 'swarm-storage', // unique name for localStorage key
      storage: createJSONStorage(() => localStorage), // use localStorage
    }
  )
);

// Example usage (can be removed or kept for reference):
// const { swarms, createSwarm, fetchSwarms } = useSwarmStore.getState();
// fetchSwarms('user123');
// createSwarm({ name: 'My New Swarm', description: 'Test', members: [], type: 'general', creatorId: 'user123' });
