export interface _Action {
    id: string;
    type: string;
    input?: unknown;
    output?: unknown;
    timestamp: Date;
    duration: number;
    success: boolean;
}

export interface ActionResult {
    output: unknown;
    duration: number;
    error?: string;
}

export interface ActionMetrics {
    action: string;
    success: boolean;
    duration?: number;
    output?: unknown;
    error?: string;
}