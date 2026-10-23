import { SupabaseClient } from '@supabase/supabase-js';
import { AIDriveActivityService } from './AIDriveActivityService';
import { Annotation } from '../../components/geniedrive/GenieDrivePDFAnnotationLayer';

export class AIDriveAnnotationService {
  private supabase: SupabaseClient;
  private activityService: AIDriveActivityService;

  constructor(supabaseClient: SupabaseClient, activityService: AIDriveActivityService) {
    this.supabase = supabaseClient;
    this.activityService = activityService;
  }

  /**
   * 🖋️ SAVE ANNOTATIONS: Persists annotations for a file.
   * Hardened: Always use authenticated user's ID.
   */
  async saveAnnotations(fileId: string, annotations: Annotation[]): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // 1. Delete existing annotations for this file (simplest way to sync)
    // In a production app, we'd do a smart merge, but for now, overwrite is safer for sync.
    const { error: deleteError } = await this.supabase
      .from('ai_drive_annotations')
      .delete()
      .eq('file_id', fileId);

    if (deleteError) throw deleteError;

    // 2. Insert new annotations
    if (annotations.length === 0) return;

    const dataToInsert = annotations.map(anno => ({
      file_id: fileId,
      user_id: user.id,
      page_number: anno.page,
      annotation_type: anno.type,
      data: anno, // Full JSON object
      created_at: anno.timestamp
    }));

    const { error: insertError } = await this.supabase
      .from('ai_drive_annotations')
      .insert(dataToInsert);

    if (insertError) throw insertError;

    // Log ANNOTATE
    this.activityService.logAction(fileId, 'ANNOTATE', { count: annotations.length });
  }

  /**
   * 📑 LOAD ANNOTATIONS: Fetches all collaborative annotations for a file.
   */
  async getAnnotations(fileId: string): Promise<Annotation[]> {
    const { data, error } = await this.supabase
      .from('ai_drive_annotations')
      .select('data')
      .eq('file_id', fileId);

    if (error) throw error;
    
    // Extract the annotation object from each row
    return (data || []).map(row => row.data as Annotation);
  }
}
