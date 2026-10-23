// 🛰️ SkillBridge: Uses native browser WebSocket and Crypto

/**
 * 🛰️ SkillBridge
 * The "Nervous System" of the Agentic OS.
 * 
 * Priority order:
 * 1. 🌍 Electron IPC (Earth) — instant, full OS access
 * 2. 🔌 WebSocket Gateway (OpenClaw) — if running
 * 3. 🔌 Local MCP Server (Port 8000) — if running
 * 4. ☁️ Cloud (Supabase) — always available
 */
export class SkillBridge {
    private ws: WebSocket | null = null;
    private url: string = import.meta.env.VITE_GATEWAY_URL || 'ws://127.0.0.1:19001';
    private pending = new Map<string, { resolve: (val: any) => void, reject: (err: any) => void }>();
    private reconnectTimeout: any = null;
    private _ready: Promise<void>;
    private _resolveReady: (() => void) | null = null;
    private _isAuthenticated: boolean = false;
    private _connectionFailed: boolean = false;
    private _isElectron: boolean = false;

    // 🧠 Smart reconnection — exponential backoff
    private _reconnectAttempt: number = 0;
    private readonly MAX_RECONNECT_ATTEMPTS = 5;
    private readonly BACKOFF_DELAYS = [5000, 10000, 30000, 60000, 60000]; // 5s, 10s, 30s, 60s, 60s
    private _enabled: boolean = import.meta.env.VITE_ENABLE_GATEWAY === 'true';

    constructor() {
        this._ready = new Promise((resolve) => {
            this._resolveReady = resolve;
        });

        // 🌍 Detect Electron — if present, we have Earth powers (no WebSocket needed)
        this._isElectron = !!(window as any).electronBridge?.isElectron;

        if (this._isElectron) {
            console.log('🌍 SkillBridge: Running in Electron — Earth layer active. IPC bridge ready.');
            this._isAuthenticated = true;
            this._resolveReady?.();
            return; // No WebSocket needed!
        }

        if (!this._enabled) {
            console.log('🔌 SkillBridge: Disabled via VITE_ENABLE_GATEWAY=false — skipping connection.');
            this._connectionFailed = true;
            return;
        }
        this.connect();
    }

    public async whenReady(): Promise<void> {
        return this._ready;
    }

    /**
     * 🔄 Manually reconnect (e.g. after starting the Gateway)
     */
    public reconnect(): void {
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        this._reconnectAttempt = 0;
        this._connectionFailed = false;
        this._enabled = true;
        this._ready = new Promise((resolve) => {
            this._resolveReady = resolve;
        });
        console.log('🔌 SkillBridge: Manual reconnect requested.');
        this.connect();
    }

    /**
     * 🔍 Check if the Gateway is connected and authenticated.
     * Allows other systems to check before attempting calls.
     */
    public isConnected(): boolean {
        return this._isAuthenticated && this.ws?.readyState === WebSocket.OPEN;
    }

    public isOffline(): boolean {
        if (this._isElectron) return false; // Electron is always "online"
        return !this._enabled || this._connectionFailed;
    }

    /**
     * 🌍 Check if running in Electron (Earth layer available)
     */
    public hasEarth(): boolean {
        return this._isElectron;
    }

    /**
     * Executes a system command via the bridge (Direct Earth IPC in Electron)
     */
    public async execCommand(command: string, cwd?: string): Promise<any> {
        if (this._isElectron) {
            const bridge = (window as any).electronBridge;
            if (bridge?.shell?.exec) {
                return await bridge.shell.exec({ command, cwd });
            }
        }
        return this.nodeInvoke('main', 'system.exec', { command, cwd });
    }

    /**
     * Initializes a new skill scaffold using the Skill Factory.
     */
    public async createSkillScaffold(name: string) {
        const initScript = 'cortex\\skills\\skill-creator\\scripts\\init_skill.py';
        const targetPath = 'cortex\\skills\\custom';

        return this.execCommand(`python "${initScript}" ${name} --path "${targetPath}" --resources scripts,references`);
    }

    private connect() {
        if (!this._enabled) {
            console.log('🔌 SkillBridge: Gateway is disabled via environment toggle. skipping connection.');
            return;
        }
        console.log(`🔌 SkillBridge: Connecting to Gateway at ${this.url}...`);
        this.ws = new (window as any).WebSocket(this.url);

        this.ws!.onopen = () => {
            console.log('✅ SkillBridge: Connected to Gateway. Sending Handshake...');
            // 🧠 Reset backoff on successful connection
            this._reconnectAttempt = 0;
            this._connectionFailed = false;

            // Send the required connect handshake with a fixed ID
            const id = 'handshake-req';
            const frame = {
                type: 'req',
                id,
                method: 'connect',
                params: {
                    minProtocol: 3,
                    maxProtocol: 3,
                    client: {
                        id: 'webchat-ui',
                        version: '1.0.0',
                        platform: 'browser',
                        mode: 'webchat', // 🔑 Important for skipping device-identity
                        displayName: 'GenieFlow HQ'
                    },
                    role: 'operator',
                    auth: {
                        token: import.meta.env.VITE_GATEWAY_TOKEN || '123',
                        password: import.meta.env.VITE_GATEWAY_PASSWORD || '123'
                    }
                }
            };

            this.pending.set(id, {
                resolve: () => console.log('✅ SkillBridge: Handshake Resolved'),
                reject: (err) => {
                    console.error('❌ SkillBridge: Handshake Rejected', err);
                    this._isAuthenticated = false;
                }
            });

            this.ws!.send(JSON.stringify(frame));

            // Clear reconnection timeout if any
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = null;
            }
        };

        this.ws!.onmessage = (event) => {
            try {
                const parsed = JSON.parse(event.data.toString());
                if (parsed.type === 'res' && parsed.id) {
                    const pending = this.pending.get(parsed.id);
                    if (pending) {
                        this.pending.delete(parsed.id);
                        if (parsed.ok) {
                            // 🧠 If this was the 'connect' request, we are now ready!
                            if (parsed.id === 'handshake-req') {
                                console.log('✅ SkillBridge: Handshake Successful');
                                this._isAuthenticated = true;
                                this._resolveReady?.();
                            }
                            pending.resolve(parsed.payload);
                        } else {
                            pending.reject(new Error(parsed.error?.message || 'Unknown error'));
                        }
                    }
                }
            } catch (err) {
                console.error('❌ SkillBridge: Message processing failed', err);
            }
        };

        this.ws!.onclose = () => {
            this._isAuthenticated = false;
            // Reset ready promise for next connection
            this._ready = new Promise((resolve) => {
                this._resolveReady = resolve;
            });

            // 🧠 Smart backoff: escalate delay, give up after MAX_RECONNECT_ATTEMPTS
            if (this._reconnectAttempt >= this.MAX_RECONNECT_ATTEMPTS) {
                // Silenced: OpenClaw is decommissioned, no need to spam the user console
                // console.warn(`⏸️ SkillBridge: Gave up after ${this.MAX_RECONNECT_ATTEMPTS} attempts. Gateway offline.`);
                this._connectionFailed = true;
                return;
            }
            const delay = this.BACKOFF_DELAYS[Math.min(this._reconnectAttempt, this.BACKOFF_DELAYS.length - 1)];
            this._reconnectAttempt++;
            // Silenced reconnection warnings for a cleaner production feel
            // console.warn(`⚠️ SkillBridge: Disconnected. Retry ${this._reconnectAttempt}/${this.MAX_RECONNECT_ATTEMPTS} in ${delay / 1000}s...`);
            this.reconnectTimeout = setTimeout(() => this.connect(), delay);
        };

        this.ws!.onerror = () => {
            // Only log on first attempt if truly necessary, but keep it silent for now
            // console.debug('❌ SkillBridge: Connection Error (Gateway offline)');
            this._connectionFailed = true;
        };
    }

    /**
     * Executes a command via the Gateway with automatic Cloud fallback.
     */
    public async request(method: string, params: any): Promise<any> {
        // 🛡️ Graceful offline: If gateway never connected, we try to fulfill via Cloud/Mock
        const isOffline = this.isOffline();

        if (isOffline && method !== 'connect') {
            console.warn(`🛰️ SkillBridge: Gateway offline. Attempting to fulfill '${method}' via Cloud...`);
            return { success: false, offline: true, retryCloud: true };
        }

        // If not a connect request, wait for authentication to complete
        if (method !== 'connect' && !isOffline) {
            const timeoutMs = 5000;
            const timeout = new Promise<void>((_, reject) =>
                setTimeout(() => reject(new Error('Gateway connection timeout')), timeoutMs)
            );
            try {
                await Promise.race([this.whenReady(), timeout]);
            } catch {
                this._connectionFailed = true;
                return { success: false, offline: true, retryCloud: true };
            }
        }

        return new Promise((resolve, reject) => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                return resolve({ success: false, offline: true, retryCloud: true });
            }

            const id = self.crypto.randomUUID();
            const frame = {
                type: 'req',
                id,
                method,
                params
            };

            this.pending.set(id, { resolve, reject });
            this.ws.send(JSON.stringify(frame));
        });
    }

    /**
     * Specialized: Send an agent message (Core autonomy)
     */
    public async agentRequest(message: string, agentId: string = 'main') {
        return this.request('agent', {
            message,
            agentId,
            idempotencyKey: self.crypto.randomUUID()
        });
    }

    /**
     * Specialized: Browser request (Scraping/LinkedIn)
     */
    public async browserRequest(method: string, path: string, body?: any) {
        return this.request('browser.request', {
            method,
            path,
            body
        });
    }

    /**
     * Specialized: Generic Node Invoke (The 53+ Skills)
     */
    public async nodeInvoke(nodeId: string, command: string, params: any = {}) {
        // 0. 🌍 Try Electron IPC first (Earth layer — instant, full OS access)
        if (this._isElectron) {
            const earthResponse = await this.electronInvoke(command, params);
            if (earthResponse.success) return earthResponse;
            // If Earth can't handle this command, fall through to cloud
        }

        // 1. Try Gateway first if connected
        if (this.isConnected()) {
            const response = await this.request('node.invoke', {
                nodeId,
                command,
                params,
                idempotencyKey: self.crypto.randomUUID()
            });

            if (!response.offline && !response.retryCloud) {
                return response;
            }
        }

        // 2. Try Local MCP fallback for specific tools
        if (command === 'system.exec' || command.startsWith('browser.')) {
            const mcpResponse = await this.mcpInvoke(command, params);
            if (mcpResponse.success) return mcpResponse;
        }

        // 3. Try Elite Law MCP bridge for law.* tools
        if (command.startsWith('law.')) {
            const lawResponse = await this.eliteLawInvoke(command.replace('law.', ''), params);
            if (lawResponse.success) return lawResponse;
        }

        // 4. Fall back to Cloud Drive (Supabase)
        return this.cloudInvoke(command, params);
    }

    /**
     * 🔌 MCP Invoke
     * Connects to the local MCP server on Port 8000 if available.
     */
    private async mcpInvoke(command: string, params: any) {
        try {
            console.log(`🔌 SkillBridge: Attempting MCP Fulfillment for '${command}'...`);
            const response = await fetch('http://localhost:8000/rpc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'execute_tool',
                    params: { name: command, arguments: params },
                    id: self.crypto.randomUUID()
                })
            });

            if (response.ok) {
                const data = await response.json();
                return { success: true, ...data.result };
            }
        } catch (err) {
            // Silently fail if MCP server is not running
        }
        return { success: false, offline: true };
    }

    /**
     * ⚖️ Elite Law MCP Invoke
     * Specialized bridge for Medcare System tools on Port 3002.
     */
    private async eliteLawInvoke(toolName: string, params: any) {
        try {
            console.log(`⚖️ SkillBridge: Routing Elite Law tool '${toolName}'...`);
            const response = await fetch('http://localhost:3002/mcp/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: toolName,
                    arguments: params
                })
            });

            if (response.ok) {
                const data = await response.json();
                return { success: true, ...data.result };
            }
        } catch (err) {
            console.warn('⚖️ SkillBridge: Elite Law MCP (Port 3002) is unreachable.');
        }
        return { success: false, offline: true };
    }

    /**
     * 🌍 Electron Invoke (Earth Layer)
     * Routes commands directly through Electron IPC — no server needed.
     */
    private async electronInvoke(command: string, params: any): Promise<any> {
        const bridge = (window as any).electronBridge;
        if (!bridge) return { success: false, error: 'Electron bridge not available' };

        console.log(`🌍 SkillBridge: Earth-Fulfilling '${command}'...`);

        try {
            // File System commands
            if (command === 'fs.write_file') {
                return await bridge.fs.writeFile({ path: params.path, content: params.content });
            }
            if (command === 'fs.read_file') {
                const res = await bridge.fs.readFile({ path: params.path });
                if (res?.success) return res;
                // Fallback: Check attached drives and pinned files
                try {
                    const { useAttachedDriveStore } = await import('../store/attachedDriveStore');
                    const store = useAttachedDriveStore.getState();
                    const fileName = params.path?.split(/[\\/]/).pop();
                    const findInNodes = (nodes: any[]): any => {
                        if (!nodes) return null;
                        for (const n of nodes) {
                            if (n.name === fileName || n.path === params.path) return n;
                            if (n.children && n.children.length > 0) {
                                const found = findInNodes(n.children);
                                if (found) return found;
                            }
                        }
                        return null;
                    };
                    for (const drive of store.drives) {
                        const match = findInNodes(drive.items);
                        if (match) {
                            const content = await store.readFileContent(match);
                            if (content && !content.startsWith('[Preview:')) {
                                return { success: true, content };
                            }
                        }
                    }
                } catch {}
                return res;
            }
            if (command === 'fs.list_files') {
                return await bridge.fs.listFiles({ path: params.path });
            }
            if (command === 'fs.move_file') {
                return await bridge.fs.moveFile({ source: params.source, destination: params.destination });
            }
            if (command === 'fs.delete_file') {
                return await bridge.fs.deleteFile({ path: params.path });
            }
            if (command === 'fs.mkdir') {
                return await bridge.fs.mkdir({ path: params.path });
            }
            if (command === 'fs.stat') {
                return await bridge.fs.stat({ path: params.path });
            }

            // Shell commands
            if (command === 'system.exec') {
                return await bridge.shell.exec({ command: params.command, cwd: params.cwd });
            }

            // System commands
            if (command === 'system.open') {
                return await bridge.system.openPath({ path: params.path });
            }
            if (command === 'system.openExternal' || command === 'browser.open') {
                return await bridge.system.openExternal({ url: params.url });
            }

            // Command not mapped to Earth — return failure so it falls through to Cloud
            return { success: false, error: `Earth: No handler for '${command}'` };
        } catch (err: any) {
            console.error(`🌍 SkillBridge: Earth error for '${command}':`, err);
            return { success: false, error: err.message };
        }
    }

    /**
     * ☁️ Cloud Invoke
     * Native implementation of skills using Supabase/Browser APIs when Gateway is offline.
     */
    private async cloudInvoke(command: string, params: any) {
        console.log(`☁️ SkillBridge: Cloud-Fulfilling '${command}'...`);

        if (command.startsWith('fs.')) {
            const { useKnowledgeBaseStore } = await import('../store/knowledgeBaseStore');
            const kbStore = useKnowledgeBaseStore.getState();
            const action = command.split('.')[1];

            if (action === 'write_file') {
                await kbStore.addDocument({
                    title: params.path.split(/[\\/]/).pop() || 'untitled.md',
                    content: params.content,
                    type: 'agent_artifact',
                    metadata: { path: params.path, missionSync: true },
                    assistantIds: []
                });
                return { success: true, status: 'synced' };
            }

            if (action === 'read_file') {
                const docTitle = params.path.split(/[\\/]/).pop();
                const doc = kbStore.documents.find(d => d.title === docTitle);
                if (doc) return { success: true, content: doc.content };
                throw new Error(`File not found in Cloud AI Drive: ${params.path}`);
            }

            if (action === 'list_files') {
                return {
                    success: true,
                    files: kbStore.documents.map(d => ({
                        name: d.title,
                        size: d.content.length,
                        mtime: d.updated_at || new Date().toISOString()
                    }))
                };
            }
            // Add other FS fallbacks here
        }

        return { success: false, error: 'Direct cloud fulfillment not yet mapped for this command.' };
    }

    /**
     * Specialized: Get All Skills Status
     */
    public async getSkills() {
        return this.request('skills.status', {});
    }
}

export const skillBridge = new SkillBridge();
