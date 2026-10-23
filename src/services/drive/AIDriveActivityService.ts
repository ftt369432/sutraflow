import { SupabaseClient } from '@supabase/supabase-js';

export type ActivityAction = 
  | 'VIEW' 
  | 'DOWNLOAD' 
  | 'UPLOAD' 
  | 'UPDATE'
  | 'DELETE' 
  | 'MOVE' 
  | 'AI_PROCESS' 
  | 'ANNOTATE';

/**
 * 🕵️ AIDRIVE ACTIVITY SERVICE
 * Handles persistent audit logging for HIPAA compliance.
 */
export class AIDriveActivityService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * 📝 LOG ACTION: Persists an audit entry to the database.
   * Fire-and-forget is recommended for non-critical logging to maintain performance.
   */
  async logAction(
    fileId: string, 
    action: ActivityAction, 
    metadata: Record<string, any> = {},
    isSystemAction: boolean = false
  ): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return; // Silent skip if unauthenticated

      const logEntry = {
        user_id: user.id,
        file_id: fileId,
        action,
        is_system_action: isSystemAction,
        metadata: {
          ...metadata,
          user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
          platform: typeof window !== 'undefined' ? window.navigator.platform : 'Unknown'
        }
      };

      const { error } = await this.supabase
        .from('ai_drive_activity_logs')
        .insert(logEntry);

      if (error) {
        console.warn('⚠️ [AuditLog] Failed to persist activity log:', error.message);
      }
    } catch (err) {
      console.error('❌ [AuditLog] Service error:', err);
    }
  }

  /**
   * 📜 GET ACTIVITY: Retrieves audit history for a specific file.
   */
  async getActivityForFile(fileId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('ai_drive_activity_logs')
      .select('*, performer:auth.users(email)')
      .eq('file_id', fileId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
