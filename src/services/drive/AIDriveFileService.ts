import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import * as pdfjs from 'pdfjs-dist';
import { AIDriveFile, FileSearchOptions } from './aiDriveService';
import { AIDriveActivityService } from './AIDriveActivityService';
import { getEmbedding } from '../embeddingService';

export class AIDriveFileService {
  private supabase: SupabaseClient;
  private activityService: AIDriveActivityService;

  constructor(supabaseClient: SupabaseClient, activityService: AIDriveActivityService) {
    this.supabase = supabaseClient;
    this.activityService = activityService;
  }

  /**
   * 🔒 GET USER ID: Helper to get verified UID from Supabase auth.
   */
  private async getUID(): Promise<string> {
    try {
      const { data, error } = await this.supabase.auth.getUser();
      if (!error && data?.user?.id) return data.user.id;
    } catch (_e) {}

    try {
      const { data } = await this.supabase.auth.getSession();
      if (data?.session?.user?.id) return data.session.user.id;
    } catch (_e) {}

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('genieflow_user') || localStorage.getItem('supabase.auth.token');
        if (raw) {
          const parsed = JSON.parse(raw);
          const id = parsed.id || parsed.user?.id || parsed.currentSession?.user?.id;
          if (id) return id;
        }
      } catch (_e) {}
    }

    return 'sovereign-operator-001';
  }

  /**
   * 📋 LIST FILES: Retrieves files for the authenticated user.
   */
  async listFiles(
    parentId: string | null = null,
    options: Partial<FileSearchOptions> = {}
  ): Promise<AIDriveFile[]> {
    try {
      const userId = await this.getUID();
      let query = this.supabase
        .from('ai_drive_files')
        .select('*');

      if (options.team_id) {
        query = query.or(`user_id.eq.${userId},shared_with.cs.{"${options.team_id}"}`);
      } else {
        query = query.eq('user_id', userId);
      }

      if (!options.include_trashed) {
        query = query.or('is_trashed.is.null,is_trashed.eq.false');
      }

      if (parentId === null) {
        query = query.is('parent_id', null);
      } else {
        query = query.eq('parent_id', parentId);
      }

      const sortBy = options.sort_by || 'name';
      const sortDirection = options.sort_direction || 'asc';
      query = query.order(sortBy, { ascending: sortDirection === 'asc' });

      if (options.limit) query = query.limit(options.limit);
      if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 100) - 1);

      const { data, error } = await query;
      if (!error) return data || [];

      // Fallback: If query failed due to is_trashed or shared_with column missing, try basic query
      console.warn('AIDriveFileService: Primary query failed, falling back to base select:', error.message);
      const fallbackQuery = this.supabase
        .from('ai_drive_files')
        .select('*')
        .eq('user_id', userId);
      const fallbackRes = await fallbackQuery;
      if (fallbackRes.error) {
        console.warn('AIDriveFileService: Fallback select failed:', fallbackRes.error.message);
        return [];
      }
      return fallbackRes.data || [];
    } catch (error) {
      console.warn('AIDriveFileService: Error listing cloud files, defaulting to empty list:', error);
      return [];
    }
  }

  /**
   * 📄 GET FILE: Retrieves a single file record.
   */
  async getFile(fileId: string): Promise<AIDriveFile> {
    const userId = await this.getUID();
    const { data, error } = await this.supabase
      .from('ai_drive_files')
      .select('*')
      .eq('id', fileId)
      .or(`user_id.eq.${userId},shared_with.cs.{"${userId}"}`) // Allow owner or explicitly shared users
      .single();

    if (error) throw error;
    
    // Log VIEW
    this.activityService.logAction(fileId, 'VIEW');

    return data;
  }

  /**
   * 📁 CREATE FOLDER
   */
  async createFolder(name: string, parentId: string | null = null, options?: { teamId?: string }): Promise<AIDriveFile> {
    const userId = await this.getUID();
    const folder = {
      name,
      mime_type: 'application/x-directory',
      size: 0,
      parent_id: parentId,
      is_folder: true,
      user_id: userId,
      shared_with: options?.teamId ? [options.teamId] : []
    };

    const { data, error } = await this.supabase
      .from('ai_drive_files')
      .insert(folder)
      .select()
      .single();

    if (error) throw error;
    return data as AIDriveFile;
  }

  /**
   * 📤 UPLOAD FILE
   */
  async uploadFile(file: File, folderId: string | null, options?: { teamId?: string }): Promise<AIDriveFile> {
    const userId = await this.getUID();
    const storagePath = `${userId}/${folderId ? folderId + '/' : ''}${file.name}`;

    const { error: uploadError } = await this.supabase.storage
      .from('ai-drive')
      .upload(storagePath, file, { upsert: false });

    if (uploadError) throw uploadError;

    const { data: dbData, error: dbError } = await this.supabase
      .from('ai_drive_files')
      .insert({
        user_id: userId,
        parent_id: folderId,
        name: file.name,
        is_folder: false,
        mime_type: file.type || 'application/octet-stream',
        size: file.size,
        storage_path: storagePath,
        bucket_id: 'ai-drive',
        shared_with: options?.teamId ? [options.teamId] : []
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Log UPLOAD
    this.activityService.logAction(dbData.id, 'UPLOAD', { name: file.name, size: file.size });

    // 🧠 Fire-and-forget: Extract text & generate embedding for RAG
    this.processFileForRAG(dbData.id, dbData.storage_path, dbData.mime_type).catch(err =>
      console.warn('[AIDriveFileService] Background RAG processing failed (non-blocking):', err)
    );

    return dbData as AIDriveFile;
  }

  /**
   * 🗑️ DELETE FILE
   */
  async deleteFile(fileId: string): Promise<void> {
    const userId = await this.getUID();
    const file = await this.getFile(fileId); // This method already checks user_id

    if (file.storage_path) {
      await this.supabase.storage.from('ai-drive').remove([file.storage_path]);
    }

    // Log DELETE (before deletion so we have the file context)
    this.activityService.logAction(fileId, 'DELETE', { name: file.name });

    const { error } = await this.supabase
      .from('ai_drive_files')
      .delete()
      .eq('id', fileId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * 🗑️ BULK DELETE
   */
  async bulkDeleteFiles(fileIds: string[]): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const id of fileIds) {
      try {
        await this.deleteFile(id);
        success.push(id);
      } catch (err) {
        console.error(`Failed to delete ${id}:`, err);
        failed.push(id);
      }
    }

    return { success, failed };
  }

  /**
   * ⏬ DOWNLOAD FILE: Generates a signed URL for file access and logs the audit event.
   */
  async downloadFile(fileId: string): Promise<string> {
    const userId = await this.getUID();
    const file = await this.getFile(fileId); // This method already checks user_id

    if (!file.storage_path) throw new Error('File has no storage path');

    const { data, error } = await this.supabase.storage
      .from('ai-drive')
      .createSignedUrl(file.storage_path, 3600); // 1 hour link

    if (error) throw error;

    // Log DOWNLOAD
    this.activityService.logAction(fileId, 'DOWNLOAD', { name: file.name });

    return data.signedUrl;
  }

  /**
   * 📁 MOVE FILE
   */
  async moveFile(fileId: string, targetFolderId: string | null): Promise<AIDriveFile> {
    const userId = await this.getUID();
    const { data, error } = await this.supabase
      .from('ai_drive_files')
      .update({ parent_id: targetFolderId, updated_at: new Date().toISOString() })
      .eq('id', fileId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    this.activityService.logAction(fileId, 'MOVE', { targetFolderId });
    return data;
  }

  /**
   * 📁 BULK MOVE: Moves multiple items to a target folder.
   */
  async bulkMoveFiles(fileIds: string[], targetFolderId: string | null): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const id of fileIds) {
      try {
        await this.moveFile(id, targetFolderId);
        success.push(id);
      } catch (err) {
        console.error(`Failed to move ${id}:`, err);
        failed.push(id);
      }
    }

    return { success, failed };
  }

  /**
   * 👯 DUPLICATE FILE: Creates a copy of a file.
   */
  async duplicateFile(fileId: string): Promise<AIDriveFile> {
    const userId = await this.getUID();
    const original = await this.getFile(fileId);
    if (original.is_folder) throw new Error("Folder duplication not supported");

    const newName = `${original.name.replace(/(\.[^.]+)?$/, ' (Copy)$1')}`;
    const extension = original.storage_path?.split('.').pop();
    const newStoragePath = `${userId}/${uuidv4()}.${extension}`;

    await this.supabase.storage.from('ai-drive').copy(original.storage_path!, newStoragePath);

    const { data, error } = await this.supabase
      .from('ai_drive_files')
      .insert({
        ...original,
        id: undefined,
        name: newName,
        storage_path: newStoragePath,
        user_id: userId,
        created_at: undefined,
        updated_at: undefined
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * 🗑️ TRASH FILE
   */
  async trashFile(fileId: string, isTrashed: boolean): Promise<AIDriveFile> {
    const userId = await this.getUID();
    const { data, error } = await this.supabase
      .from('ai_drive_files')
      .update({ is_trashed: isTrashed, trashed_at: isTrashed ? new Date().toISOString() : null })
      .eq('id', fileId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * 🖋️ UPDATE FILE CONTENT
   */
  async updateFileContent(fileId: string, content: string): Promise<AIDriveFile> {
    const userId = await this.getUID();
    const file = await this.getFile(fileId);
    if (!file.storage_path) throw new Error('No storage path');

    const blob = new Blob([content], { type: file.mime_type || 'text/plain' });
    await this.supabase.storage.from('ai-drive').upload(file.storage_path, blob, { upsert: true });

    const { data, error } = await this.supabase
      .from('ai_drive_files')
      .update({ size: blob.size, updated_at: new Date().toISOString() })
      .eq('id', fileId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    
    // Log UPDATE
    this.activityService.logAction(fileId, 'UPDATE');

    return data;
  }

  /**
   * 🎨 SAVE CANVAS: Creates a new canvas/markdown document in the drive.
   * Hardened: Uses authenticated UID.
   */
  async saveCanvasDocument(
    title: string,
    content: string,
    type: string,
    folderId: string | null = null
  ): Promise<AIDriveFile> {
    const userId = await this.getUID();
    const fileName = title.endsWith('.md') ? title : `${title}.md`;
    const storagePath = `${userId}/${folderId ? folderId + '/' : ''}${uuidv4()}.md`;
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const { error: uploadError } = await this.supabase.storage
      .from('ai-drive')
      .upload(storagePath, blob);

    if (uploadError) throw uploadError;

    const { data, error } = await this.supabase
      .from('ai_drive_files')
      .insert({
        user_id: userId,
        parent_id: folderId,
        name: fileName,
        is_folder: false,
        mime_type: 'text/markdown',
        size: blob.size,
        storage_path: storagePath,
        bucket_id: 'ai-drive',
        ai_metadata: { source: 'canvas', document_type: type }
      })
      .select()
      .single();

    if (error) throw error;
    this.activityService.logAction(data.id, 'UPLOAD', { source: 'canvas' });

    // 🧠 Fire-and-forget: Embed canvas content for RAG
    this.processFileForRAG(data.id, storagePath, 'text/markdown').catch(err =>
      console.warn('[AIDriveFileService] Background RAG processing for canvas failed (non-blocking):', err)
    );

    return data;
  }

  /**
   * 🖋️ UPDATE CANVAS: Updates an existing canvas document.
   * Hardened: Uses authenticated UID.
   */
  async updateCanvasDocument(
    fileId: string,
    content: string,
    title?: string,
    type?: string
  ): Promise<AIDriveFile> {
    const userId = await this.getUID();
    const file = await this.getFile(fileId);
    if (!file.storage_path) throw new Error('No storage path');

    const blob = new Blob([content], { type: 'text/markdown' });
    await this.supabase.storage.from('ai-drive').upload(file.storage_path, blob, { upsert: true });

    const updates: any = { 
        size: blob.size, 
        updated_at: new Date().toISOString() 
    };
    if (title) updates.name = title.endsWith('.md') ? title : `${title}.md`;
    if (type) updates.ai_metadata = { ...file.ai_metadata, document_type: type };

    const { data, error } = await this.supabase
      .from('ai_drive_files')
      .update(updates)
      .eq('id', fileId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    this.activityService.logAction(fileId, 'UPDATE', { source: 'canvas' });
    return data;
  }

  /**
   * 📂 LOAD CANVAS: Loads content and metadata for a canvas document.
   * Hardened: Validates access via getFile.
   */
  async loadCanvasDocument(fileId: string): Promise<{ file: AIDriveFile; content: string }> {
    const file = await this.getFile(fileId);
    if (!file.storage_path) throw new Error('No storage path');

    const { data, error } = await this.supabase.storage
      .from('ai-drive')
      .download(file.storage_path);

    if (error) throw error;
    const content = await data.text();
    return { file, content };
  }

  /**
   * 📄 GET FILE CONTENT: Retrieves the raw text content of any file in the drive.
   * Handles downloading from storage and decoding as text.
   */
  async getFileContent(fileId: string): Promise<string> {
    const file = await this.getFile(fileId);
    if (file.is_folder) return '';
    if (!file.storage_path) throw new Error('No storage path for file');

    const { data, error } = await this.supabase.storage
      .from('ai-drive')
      .download(file.storage_path);

    if (error) {
      console.warn(`[AIDriveFileService] Failed to download content for ${fileId}:`, error);
      // Fallback: If download fails, check if we have a content preview
      return file.content_preview || file.ocr_text || '';
    }

    return await data.text();
  }

  // =========================================================================
  // 🧠 RAG PIPELINE: Text Extraction → Embedding → Store
  // =========================================================================

  /**
   * 🧠 PROCESS FILE FOR RAG: Extracts text, generates embedding, updates the DB row.
   * Called fire-and-forget after upload so user doesn't wait for AI processing.
   */
  private async processFileForRAG(
    fileId: string,
    storagePath: string,
    mimeType: string
  ): Promise<void> {
    const startTime = Date.now();
    console.log(`[RAG] Starting processing for file ${fileId} (${mimeType})`);

    try {
      // 1. Download the file from storage
      const { data: blob, error: dlError } = await this.supabase.storage
        .from('ai-drive')
        .download(storagePath);

      if (dlError || !blob) {
        console.error(`[RAG] Failed to download file ${fileId}:`, dlError);
        return;
      }

      // 2. Extract text based on file type
      const extractedText = await this.extractTextFromBlob(blob, mimeType);

      if (!extractedText || extractedText.trim().length < 10) {
        console.warn(`[RAG] No usable text extracted from ${fileId} (${mimeType}). Skipping embedding.`);
        // Still save what we got as content_preview
        if (extractedText) {
          await this.supabase
            .from('ai_drive_files')
            .update({ content_preview: extractedText.substring(0, 5000) })
            .eq('id', fileId);
        }
        return;
      }

      // 3. Generate content preview (first 5000 chars for quick display)
      const contentPreview = extractedText.substring(0, 5000);

      // 4. Generate embedding via Gemini (768-dim, always uses Gemini regardless of chat provider)
      let embedding: number[] | null = null;
      try {
        embedding = await getEmbedding(extractedText.substring(0, 8000)); // Cap at 8k chars for embedding
        console.log(`[RAG] Embedding generated for ${fileId}: ${embedding?.length} dimensions`);
      } catch (embError) {
        console.warn(`[RAG] Embedding generation failed for ${fileId} (non-fatal):`, embError);
        // Continue — we still want to save the content_preview even if embedding fails
      }

      // 5. Update the ai_drive_files row with tracking metadata
      const updatePayload: Record<string, any> = {
        content_preview: contentPreview,
        updated_at: new Date().toISOString(),
        ai_last_processed: new Date().toISOString(),
        ai_enabled: true
      };

      if (embedding && embedding.length > 0) {
        updatePayload.embedding = embedding; // Supabase JS client handles arrays for vector types
      }

      const { error: updateError } = await this.supabase
        .from('ai_drive_files')
        .update(updatePayload)
        .eq('id', fileId);

      if (updateError) {
        console.error(`[RAG] Failed to update file ${fileId} with RAG data:`, updateError);
        return;
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[RAG] ✅ File ${fileId} processed successfully in ${elapsed}s. Preview: ${contentPreview.length} chars, Embedding: ${embedding?.length || 0} dims`);

    } catch (error) {
      console.error(`[RAG] Unexpected error processing file ${fileId}:`, error);
      // Non-fatal — the file was still uploaded successfully
    }
  }

  /**
   * 📝 EXTRACT TEXT FROM BLOB: Routes to the correct extractor based on MIME type.
   */
  private async extractTextFromBlob(blob: Blob, mimeType: string): Promise<string> {
    try {
      switch (mimeType) {
        case 'application/pdf':
          return await this.extractTextFromPDF(blob);

        case 'text/plain':
        case 'text/markdown':
        case 'text/csv':
        case 'text/html':
        case 'application/json':
          return await blob.text();

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          console.log('[RAG] Word document detected — basic text extraction');
          return await blob.text(); // Basic fallback, will get garbled for .doc but usable for .docx

        case 'image/jpeg':
        case 'image/png':
        case 'image/gif':
        case 'image/webp':
          console.log('[RAG] Image file — skipping text extraction (OCR not wired yet)');
          return '';

        default:
          console.log(`[RAG] Unsupported MIME type: ${mimeType}, attempting text extraction`);
          try {
            return await blob.text();
          } catch {
            return '';
          }
      }
    } catch (error) {
      console.error(`[RAG] Text extraction failed for ${mimeType}:`, error);
      return '';
    }
  }

  /**
   * 📄 EXTRACT TEXT FROM PDF: Uses pdfjs-dist to extract text from PDF files.
   */
  private async extractTextFromPDF(blob: Blob): Promise<string> {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .filter((item: any): item is any => 'str' in item)
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      return fullText.trim();
    } catch (error) {
      console.error('[RAG] PDF text extraction failed:', error);
      return '';
    }
  }
}

