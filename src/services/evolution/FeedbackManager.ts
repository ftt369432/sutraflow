import { supabase } from '../../lib/supabaseClient';

export interface UserFeedback {
    id?: string;
    user_id: string; // Snake case to match DB convention
    type: 'suggestion' | 'blind_spot' | 'feature';
    content: string;
    context: Record<string, any>;
    status?: string;
}

export class FeedbackManager {
    static async submitFeedback(feedback: UserFeedback) {
        try {
            const { data, error } = await supabase
                .from('user_feedback')
                .insert([{
                    ...feedback,
                    created_at: new Date().toISOString()
                }]);

            if (error) {
                console.error('Error submitting feedback:', error);
                throw error;
            }
            return data;
        } catch (error) {
            console.error('Failed to submit feedback to Supabase:', error);
            // Fallback: log to console if DB fails
            console.log('📝 Feedback (Local Fallback):', feedback);
            return null;
        }
    }

    /**
     * Captures the current orchestration state to provide context for feedback.
     */
    static captureContext(manifest: any, activeAgent?: string): Record<string, any> {
        return {
            activeAgent,
            taskCount: manifest.tasks?.length || 0,
            recentThoughts: manifest.tasks?.slice(0, 3).map((t: any) => t.thoughts) || [],
            location: window.location.href,
            clientViewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }
}
