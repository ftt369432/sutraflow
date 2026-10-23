/**
 * Python Bridge Service
 * 
 * Manages communication with the local GenieFlowOS Python MCP server.
 * Enables execution of Python tools (Multimedia, DB Access, System Ops) from the Web App.
 */

export interface ToolExecutionResult<T = any> {
    status: 'success' | 'error';
    result: T;
}

export class PythonBridgeService {
    private baseUrl = 'http://localhost:8765';

    /**
     * Checks if the Python server is reachable
     */
    async checkHealth(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/mcp/status`);
            return response.ok;
        } catch (error) {
            console.warn('Python Bridge offline:', error);
            return false;
        }
    }

    /**
     * Executes a tool on the Python server
     */
    async executeTool<T = any>(toolName: string, args: Record<string, any>): Promise<ToolExecutionResult<T>> {
        try {
            const response = await fetch(`${this.baseUrl}/mcp/execute_tool`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: toolName,
                    args: args
                }),
            });

            if (!response.ok) {
                throw new Error(`Bridge Error: ${response.statusText}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error(`Failed to execute tool ${toolName}:`, error);
            return {
                status: 'error',
                result: {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown bridge error'
                } as any
            };
        }
    }
}

// Singleton instance
export const pythonBridgeService = new PythonBridgeService();
