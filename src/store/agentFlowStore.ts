import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ReviewPolicy = 'always_proceed' | 'agent_decides' | 'request_review';
export type TerminalPolicy = 'always_proceed' | 'request_review';
export type WorkflowMode = 'autonomous' | 'supervised' | 'human_in_the_loop';

interface AgentFlowState {
    secureMode: boolean;
    reviewPolicy: ReviewPolicy;
    terminalPolicy: TerminalPolicy;
    workflowMode: WorkflowMode;

    // Actions
    setSecureMode: (enabled: boolean) => void;
    setReviewPolicy: (policy: ReviewPolicy) => void;
    setTerminalPolicy: (policy: TerminalPolicy) => void;
    setWorkflowMode: (mode: WorkflowMode) => void;
}

export const useAgentFlowStore = create<AgentFlowState>()(
    persist(
        (set) => ({
            secureMode: false,
            reviewPolicy: 'agent_decides',
            terminalPolicy: 'request_review',
            workflowMode: 'supervised',

            setSecureMode: (enabled) => set({ secureMode: enabled }),
            setReviewPolicy: (policy) => set({ reviewPolicy: policy }),
            setTerminalPolicy: (policy) => set({ terminalPolicy: policy }),
            setWorkflowMode: (mode) => set({ workflowMode: mode }),
        }),
        {
            name: 'genieflow-agent-flow-storage',
        }
    )
);
