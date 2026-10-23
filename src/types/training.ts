export interface TrainingEntry {
    id: string;
    assistant_id: string;
    question: string; // New field for question part
    answer: string;   // New field for answer part
    created_at: string;
    created_by: string;

    // Legacy fields - kept for backward compatibility
    text_content?: string; // Deprecated - use question/answer instead
    entry_type?: 'example_conversation' | 'knowledge_fact' | 'behavioral_prompt' | 'capability_demo';
    processed_at?: string;
    is_active?: boolean;
    metadata?: Record<string, unknown>;
    version?: number;
    conversation_context?: Record<string, unknown>;
    expected_outcome?: string;
    last_used_at?: string;
    usage_count?: number;
    effectiveness_score?: number;
}

export interface TrainingAnalytics {
    total_entries: number;
    conversation_examples: number;
    knowledge_facts: number;
    behavioral_prompts: number;
    capability_demos: number;
    avg_effectiveness: number;
    total_uses: number;
    last_entry_date: string;
}

export interface EffectivenessMetrics {
    id: string;
    assistant_id: string;
    date: string;
    entry_id: string;
    accuracy: number;
    response_time_ms: number;
    scenario_complexity: number;
    improvement_from_baseline: number;
    // Fields used by TrainingAnalyticsDashboard (overlaps with TrainingEntry)
    effectiveness_score?: number;
    entry_type?: 'example_conversation' | 'knowledge_fact' | 'behavioral_prompt' | 'capability_demo';
    text_content?: string;
    usage_count?: number;
}

export interface UsageTrend {
    id: string;
    date: string;
    assistant_id: string;
    query_count: number;
    success_rate: number;
    avg_response_time_ms: number;
    user_satisfaction: number;
}
