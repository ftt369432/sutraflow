/**
 * 🖥️ Display Manager - Multi-Window & Panel Sync Service
 * Uses BroadcastChannel for lightweight, real-time state sync across tabs/windows.
 */

export type DetachablePanel = 'canvas' | 'tasks' | 'collective-brain' | 'sidebar' | 'email' | 'browser' | 'knowledge-base' | 'ai-drive';

export interface WindowState {
    isDetached: boolean;
    panelType?: DetachablePanel;
    windowRef?: Window | null;
}

class DisplayManager {
    private channel: BroadcastChannel;
    private listeners: Set<(state: any) => void> = new Set();

    constructor() {
        this.channel = new BroadcastChannel('genieflow_display_sync');
        this.channel.onmessage = (event) => {
            this.listeners.forEach(listener => listener(event.data));
        };
    }

    /**
     * Detach a panel into a new window
     */
    public detachPanel(panel: DetachablePanel, url?: string) {
        const baseUrl = window.location.origin;
        // Use the new clean route
        const targetUrl = url || `${baseUrl}/detached/${panel}`;

        const width = panel === 'browser' ? 1200 : 800;
        const height = 800;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const win = window.open(
            targetUrl,
            `GenieFlow_${panel}_${Date.now()}`,
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no`
        );

        if (win) {
            console.log(`🖥️ Detached ${panel} into new window: ${targetUrl}`);
            this.syncState({ type: 'PANEL_DETACHED', panel });
            return win;
        }

        console.warn('⚠️ Popup blocked or failed to open window');
        return null;
    }

    /**
     * Sync state across all active windows
     */
    public syncState(data: any) {
        this.channel.postMessage({
            ...data,
            senderId: window.name || 'main',
            timestamp: Date.now()
        });
    }

    /**
     * Subscribe to display changes
     */
    public subscribe(callback: (state: any) => void) {
        this.listeners.add(callback);
        return () => { this.listeners.delete(callback); };
    }

    /**
     * Reattach all panels (close secondary windows)
     */
    public reattachAll() {
        this.syncState({ type: 'REATTACH_ALL' });
    }
}

export const displayManager = new DisplayManager();
