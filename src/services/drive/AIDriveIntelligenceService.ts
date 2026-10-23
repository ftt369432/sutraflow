import { SupabaseClient } from '@supabase/supabase-js';
import { AIDriveFile, FileSummaryOptions } from './aiDriveService';
import { getEmbedding } from '../embeddingService';
import { WorkflowOrchestrator } from '../WorkflowOrchestrator';
import { AIDriveActivityService } from './AIDriveActivityService';

export class AIDriveIntelligenceService {
  private supabase: SupabaseClient;
  private aiService: any;
  private workflowOrchestrator: WorkflowOrchestrator;
  private activityService: AIDriveActivityService;

  constructor(supabaseClient: SupabaseClient, aiService: any, activityService: AIDriveActivityService) {
    this.supabase = supabaseClient;
    this.aiService = aiService;
    this.activityService = activityService;
    this.workflowOrchestrator = new WorkflowOrchestrator();
  }

  private async getUID(): Promise<string> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    return user.id;
  }

  /**
   * 🧠 GENERATE FILE SUMMARY: Uses LLM to summarize document content.
   */
  async generateFileSummary(fileId: string, options?: FileSummaryOptions): Promise<string> {
    const userId = await this.getUID();
    
    const { data: file, error: fileError } = await this.supabase
      .from('ai_drive_files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', userId)
      .single();

    if (fileError || !file) throw new Error('File not found or access denied');
    if (file.ai_summary && !options?.force_process) return file.ai_summary;

    const { data, error: dlError } = await this.supabase.storage
      .from('ai-drive')
      .download(file.storage_path);

    if (dlError || !data) throw new Error('Could not download content');

    const text = await data.text();
    const prompt = `Summarize this document: ${text.substring(0, 10000)}`;
    const summary = await this.aiService.generateText(prompt);

    await this.supabase
      .from('ai_drive_files')
      .update({ ai_summary: summary, ai_last_processed: new Date().toISOString() })
      .eq('id', fileId);

    // Log AI Process
    this.activityService.logAction(fileId, 'AI_PROCESS', { type: 'summary' }, true);

    return summary;
  }

  /**
   * 🔍 SEARCH FILES: Perform semantic/vector search.
   */
  async searchFiles(query: string): Promise<AIDriveFile[]> {
    const userId = await this.getUID();
    const embedding = await getEmbedding(query);

    const { data, error } = await this.supabase.rpc('search_ai_drive_files', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 20,
      user_id_input: userId
    });

    if (error) throw error;
    return data || [];
  }

  /**
   * 🤖 PROCESS WITH AI: Full metadata extraction pipeline.
   */
  async processFileWithAI(fileId: string, text: string, options: any = {}): Promise<void> {
    const userId = await this.getUID();
    const startTime = Date.now();

    try {
      const { data: fileData, error: fileError } = await this.supabase
        .from('ai_drive_files')
        .select('ai_last_processed, mime_type, user_id')
        .eq('id', fileId)
        .eq('user_id', userId)
        .single();

      if (fileError || !fileData) return;

      const summary = await this.aiService.summarizeText(text, 500);
      const topics = await this.aiService.extractTopics(text, 5);
      
      const ai_metadata = {
        word_count: text.split(/\s+/).length,
        processing_time: (Date.now() - startTime) / 1000,
        processed_at: new Date().toISOString()
      };

      await this.supabase
        .from('ai_drive_files')
        .update({
          ai_summary: summary,
          ai_topics: topics,
          ai_metadata,
          ai_enabled: true,
          ai_last_processed: new Date().toISOString()
        })
        .eq('id', fileId);

      this.workflowOrchestrator.recordAction({
        type: 'document_processed',
        payload: { fileId, summary: !!summary },
        userId,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('AI Processing error:', error);
    }
  }
}
