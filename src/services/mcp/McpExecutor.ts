import { skillStack } from '../GpackService';

export class McpExecutor {

    /**
     * Resolve the target endpoint for a tool dynamically based on registered namespaces.
     */
    static resolveEndpoint(toolName: string): string {
        const pack = skillStack.resolveToolPack(toolName);
        if (pack) {
            if (pack.manifest?.mcp_entry?.startsWith('http')) {
                return pack.manifest.mcp_entry;
            }
            const brainUrl = import.meta.env.VITE_BRAIN_URL || 'http://localhost:8765/mcp';
            return `${brainUrl}/execute_tool`;
        }

        // Fallbacks for legacy hardcoded tools
        if (toolName.startsWith('law_') || toolName.includes('brief') || toolName.includes('sanction')) {
            return 'http://localhost:3002/mcp/execute';
        }

        const brainUrl = import.meta.env.VITE_BRAIN_URL || 'http://localhost:8765/mcp';
        return `${brainUrl}/execute_tool`;
    }

    /**
     * Execute a tool on the resolved MCP Server endpoint
     */
    static async execute(qualifiedName: string, params: any): Promise<any> {
        const endpoint = this.resolveEndpoint(qualifiedName);
        
        // Extract the unqualified name to send to the local server (e.g. legal_eagle.genie_brief -> genie_brief)
        const nameParts = qualifiedName.split('.');
        const unqualifiedName = nameParts.length > 1 ? nameParts[1] : qualifiedName;

        try {
            console.log(`🔌 MCP Bridge: Calling ${unqualifiedName} (qualified: ${qualifiedName}) at ${endpoint}...`, params);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: unqualifiedName,
                    arguments: params,
                    args: params // support both structures (arguments vs args)
                })
            });

            if (!response.ok) {
                throw new Error(`MCP Error: ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`🔌 MCP Response:`, result);
            return result.result !== undefined ? result.result : result;

        } catch (error) {
            console.error('❌ MCP Bridge Failed:', error);
            return {
                error: 'MCP_CONNECTION_FAILED',
                message: `Could not connect to Local Python Brain at ${endpoint}. Is the server running?`
            };
        }
    }
}
