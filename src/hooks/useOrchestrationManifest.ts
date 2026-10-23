import { useState, useEffect } from 'react';
import { getOrchestrationManifest, OrchestrationState } from '../services/agents/OrchestrationManifest';
import { useAuth } from '../contexts/AuthContext';

/**
 * 🧠 Hook to subscribe to real-time Orchestration Manifest state
 */
export function useOrchestrationManifest(namespace: string = 'orchestration_manifest') {
    const { user } = useAuth();
    const [state, setState] = useState<OrchestrationState | null>(null);

    useEffect(() => {
        if (!user) return;

        try {
            const manifest = getOrchestrationManifest(user.id, namespace);

            // Initial state
            setState(manifest.getState());

            // Subscribe to changes
            const unsubscribe = manifest.subscribe((newState) => {
                setState(newState);
            });

            return () => unsubscribe();
        } catch (error) {
            console.warn('⚠️ [useOrchestrationManifest] Manifest not ready yet');
        }
    }, [user]);

    return {
        state,
        tasks: state?.tasks ? Object.values(state.tasks) : [],
        canvases: state?.canvases ? Object.values(state.canvases) : [],
        currentTask: state?.currentTaskId ? state.tasks[state.currentTaskId] : null
    };
}
