import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { getAIService } from '../ai/aiService';
import { AIDriveFileService } from './AIDriveFileService';
import { AIDriveIntelligenceService } from './AIDriveIntelligenceService';
import { AIDriveAnnotationService } from './AIDriveAnnotationService';
import { AIDriveActivityService } from './AIDriveActivityService';

/**
 * 📄 AIDRIVE FILE INTERFACE: Unified shape for file/folder records.
 */
export interface AIDriveFile {
  id: string;
  user_id: string;
  parent_id?: string | null;
  folder_path?: string | null;
  name: string;
  is_folder: boolean;
  mime_type?: string | null;
  size?: number | null;
  storage_path?: string | null;
  bucket_id?: string;
  is_trashed: boolean;
  trashed_at?: string | null;
  created_at: string;
  updated_at: string;
  content_preview?: string | null;
  last_viewed_at?: string | null;
  is_starred?: boolean;
  ai_summary?: string | null;
  ai_topics?: string[] | null;
  ai_entities?: string[] | null;
  ai_metadata?: Record<string, any>;
  ai_enabled?: boolean;
  ai_last_processed?: string | null;
  shared_with?: string[];
  subscription_tier?: 'free' | 'personal' | 'work' | 'enterprise';
  ocr_processed?: boolean;
  ocr_text?: string | null;
  ai_confidence?: number;
  path?: string;
  type?: string;
  children?: AIDriveFile[];
  file?: File;
  content?: string;
  tags?: string[];
}

export interface FileSearchOptions {
  query?: string;
  parent_id?: string | null;
  include_trashed?: boolean;
  is_starred?: boolean;
  mime_types?: string[];
  sort_by?: 'name' | 'created_at' | 'updated_at' | 'size';
  sort_direction?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  team_id?: string;
}

export interface FileSummaryOptions {
  maxLength?: number;
  includeKeyPoints?: boolean;
  includeTopic?: boolean;
  includeEntities?: boolean;
  force_process?: boolean;
}

/**
 * 🚀 AIDRIVE SERVICE (FACADE)
 * Modularized and Hardened for security.
 * Delegates work to specialized services while maintaining backward compatibility.
 */
export class AIDriveService {
  private supabase: SupabaseClient;
  public fileService: AIDriveFileService;
  public intelligenceService: AIDriveIntelligenceService;
  public annotationService: AIDriveAnnotationService;
  public activityService: AIDriveActivityService;
  private aiService: any = null;

  constructor(supabaseClient: SupabaseClient) {
    if (!supabaseClient) {
      throw new Error("Supabase client is required to initialize AIDriveService.");
    }
    this.supabase = supabaseClient;
    this.activityService = new AIDriveActivityService(supabaseClient);
    this.fileService = new AIDriveFileService(supabaseClient, this.activityService);
    this.annotationService = new AIDriveAnnotationService(supabaseClient, this.activityService);
    // Intelligence service needs AIService which is loaded async
    this.intelligenceService = new AIDriveIntelligenceService(supabaseClient, null, this.activityService);
  }

  private async ensureAIService() {
    if (!this.aiService) {
      this.aiService = await getAIService();
      // Update the intelligence service with the loaded AI instance
      this.intelligenceService = new AIDriveIntelligenceService(this.supabase, this.aiService, this.activityService);
    }
  }

  // --- DELEGATED FILE METHODS ---

  async listFiles(parentId: string | null = null, options: Partial<FileSearchOptions> = {}): Promise<AIDriveFile[]> {
    return this.fileService.listFiles(parentId, options);
  }

  async getFile(fileId: string): Promise<AIDriveFile> {
    return this.fileService.getFile(fileId);
  }

  async createFolder(name: string, parentId: string | null = null, options?: { teamId?: string }): Promise<AIDriveFile> {
    return this.fileService.createFolder(name, parentId, options);
  }

  async uploadFile(file: File, folderId: string | null, options?: { teamId?: string }): Promise<AIDriveFile> {
    return this.fileService.uploadFile(file, folderId, options);
  }

  async deleteFile(fileId: string): Promise<void> {
    return this.fileService.deleteFile(fileId);
  }

  async moveFile(fileId: string, targetFolderId: string | null): Promise<AIDriveFile> {
    return this.fileService.moveFile(fileId, targetFolderId);
  }

  async bulkMoveFiles(fileIds: string[], targetFolderId: string | null) {
    return this.fileService.bulkMoveFiles(fileIds, targetFolderId);
  }

  async duplicateFile(fileId: string) {
    return this.fileService.duplicateFile(fileId);
  }

  async trashFile(fileId: string, isTrashed: boolean) {
    return this.fileService.trashFile(fileId, isTrashed);
  }

  async updateFileContent(fileId: string, content: string) {
    return this.fileService.updateFileContent(fileId, content);
  }

  async downloadFile(fileId: string): Promise<string> {
    return this.fileService.downloadFile(fileId);
  }

  async bulkDeleteFiles(fileIds: string[]) {
    return this.fileService.bulkDeleteFiles(fileIds);
  }

  async starFile(fileId: string, isStarred: boolean): Promise<AIDriveFile> {
    const { data: { user } } = await this.supabase.auth.getUser();
    const { data, error } = await this.supabase
      .from('ai_drive_files')
      .update({ is_starred: isStarred, updated_at: new Date().toISOString() })
      .eq('id', fileId)
      .eq('user_id', user?.id)
      .select()
      .single();
    if (error) throw error;
    this.activityService.logAction(fileId, 'UPDATE');
    return data;
  }

  // --- DELEGATED INTELLIGENCE METHODS ---

  async generateFileSummary(fileId: string, options?: FileSummaryOptions): Promise<string> {
    await this.ensureAIService();
    return this.intelligenceService.generateFileSummary(fileId, options);
  }

  async searchFiles(query: string): Promise<AIDriveFile[]> {
    await this.ensureAIService();
    return this.intelligenceService.searchFiles(query);
  }

  // --- ANNOTATION METHODS ---

  async saveAnnotations(fileId: string, annotations: any[]): Promise<void> {
    return this.annotationService.saveAnnotations(fileId, annotations);
  }

  async getAnnotations(fileId: string): Promise<any[]> {
    return this.annotationService.getAnnotations(fileId);
  }

  // --- ACTIVITY & AUDIT METHODS ---

  async getActivityLog(fileId: string): Promise<any[]> {
    return this.activityService.getActivityForFile(fileId);
  }

  // --- CANVAS METHODS ---

  async saveCanvasDocument(title: string, content: string, type: string, folderId: string | null = null) {
    return this.fileService.saveCanvasDocument(title, content, type, folderId);
  }

  async updateCanvasDocument(fileId: string, content: string, title?: string, type?: string) {
    return this.fileService.updateCanvasDocument(fileId, content, title, type);
  }

  async loadCanvasDocument(fileId: string) {
    return this.fileService.loadCanvasDocument(fileId);
  }

  async getFileContent(fileId: string): Promise<string> {
    return this.fileService.getFileContent(fileId);
  }
}

// Export singleton instance
export const aiDriveService = new AIDriveService(supabase);
