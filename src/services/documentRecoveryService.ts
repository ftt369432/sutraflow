import { supabase } from '../lib/supabase';
import { useKnowledgeBaseStore } from '../store/knowledgeBaseStore';
import { AIDriveService, type AIDriveFile } from './drive/aiDriveService';
import type { AIDocument } from '../types/ai';

export interface RecoveryResult {
  success: boolean;
  recoveredCount: number;
  errors: string[];
  documents: AIDocument[];
}

export class DocumentRecoveryService {
  private aiDriveService: AIDriveService;

  constructor() {
    this.aiDriveService = new AIDriveService(supabase);
  }

  /**
   * Create or get a default recovery folder for a user
   * This ensures all recovered documents have a folderId
   */
  private async createOrGetRecoveryFolder(userId: string): Promise<string> {
    // First check if a "Recovered Documents" folder already exists for this user
    const folders = useKnowledgeBaseStore.getState().folders;
    const existingFolder = folders.find(
      folder => folder.name === 'Recovered Documents' && folder.userId === userId
    );

    if (existingFolder) {
      console.log('🗂️ Using existing recovery folder:', existingFolder.id);
      return existingFolder.id;
    }

    // Create a new recovery folder
    console.log('🗂️ Creating new recovery folder for user:', userId);
    const folderData = {
      name: 'Recovered Documents',
      parentId: null, // Root level
      userId: userId,
      assistantIds: [] // Add required property
    };

    const createdFolder = await useKnowledgeBaseStore.getState().addFolder(folderData);
    if (!createdFolder) {
      throw new Error('Failed to create recovery folder');
    }

    console.log('✅ Created recovery folder:', createdFolder.id);
    return createdFolder.id;
  }

  /**
   * Recover all documents from ai_drive_files table and restore to Knowledge Base
   */
  async recoverAllDocuments(userId: string, options: {
    skipDuplicates?: boolean;
    mergeDuplicates?: boolean;
  } = { skipDuplicates: true }): Promise<RecoveryResult> {
    const result: RecoveryResult = {
      success: false,
      recoveredCount: 0,
      errors: [],
      documents: []
    };

    try {
      console.log('🔍 Starting document recovery for user:', userId);

      // Get all user's files from ai_drive_files table
      const driveFiles = await this.aiDriveService.listFiles(userId, null, {
        include_trashed: false, // Only non-trashed files
        sort_by: 'created_at',
        sort_direction: 'desc'
      });

      console.log(`📁 Found ${driveFiles.length} files in AI Drive storage`);

      if (driveFiles.length === 0) {
        result.success = true;
        result.errors.push('No files found in cloud storage to recover');
        return result;
      }

      // Filter out folders, only recover files
      const fileDocuments = driveFiles.filter(file => !file.is_folder);
      console.log(`📄 Processing ${fileDocuments.length} documents (excluding folders)`);

      const { addDocument, documents: existingDocuments } = useKnowledgeBaseStore.getState();
      const recoveredDocs: AIDocument[] = [];

      // Create a map of existing documents by source and name for duplicate detection
      const existingDocMap = new Map<string, AIDocument>();
      existingDocuments.forEach(doc => {
        const key = `${doc.metadata.source}-${doc.title || doc.metadata.title}`;
        existingDocMap.set(key, doc);
      });

      for (const driveFile of fileDocuments) {
        try {
          // Check for duplicates
          const duplicateKey = `${driveFile.storage_path || driveFile.name}-${driveFile.name}`;
          const existingDoc = existingDocMap.get(duplicateKey);
          
          if (existingDoc && options.skipDuplicates) {
            console.log(`⏭️ Skipped duplicate: ${driveFile.name}`);
            result.errors.push(`Skipped duplicate: ${driveFile.name}`);
            continue;
          }

          // Convert AIDriveFile to AIDocument format
          const document: Omit<AIDocument, 'id' | 'embedding'> = {
            title: driveFile.name,
            content: driveFile.ai_summary || '', // Use ai_summary as content since there's no content_preview
            type: this.mapMimeTypeToDocumentType(driveFile.mime_type),
            folderId: await this.createOrGetRecoveryFolder(userId), // Assign to recovery folder
            userId: userId, // Ensure userId is set
            metadata: {
              source: driveFile.storage_path || driveFile.name,
              title: driveFile.name,
              author: 'user',
              date: new Date(driveFile.created_at),
              category: this.mapMimeTypeToCategory(driveFile.mime_type),
              tags: driveFile.ai_metadata?.auto_tags || [],
              size: driveFile.size_bytes || 0,
              // Add extra metadata as additional properties (they'll be preserved in metadata object)
              ...{
                genie_drive_file_id: driveFile.id,
                mime_type: driveFile.mime_type || '',
                ai_summary: driveFile.ai_summary || '',
                ai_topics: driveFile.ai_topics || [],
                storage_path: driveFile.storage_path,
                bucket_id: driveFile.bucket_id
              }
            }
          };

          if (existingDoc && options.mergeDuplicates) {
            // Update existing document with new metadata
            console.log(`🔄 Merging duplicate: ${driveFile.name}`);
            // Could implement merge logic here if needed
            result.errors.push(`Merged duplicate: ${driveFile.name}`);
            continue;
          }

          // Add to Knowledge Base store
          await addDocument(document);
          
          // Get the created document to add to results
          const documents = useKnowledgeBaseStore.getState().documents;
          const createdDoc = documents.find(doc => 
            doc.metadata.source === (driveFile.storage_path || driveFile.name) &&
            doc.title === driveFile.name
          );

          if (createdDoc) {
            recoveredDocs.push(createdDoc);
            result.recoveredCount++;
            console.log(`✅ Recovered: ${driveFile.name}`);
          } else {
            result.errors.push(`Failed to confirm recovery of ${driveFile.name}`);
          }

        } catch (error) {
          const errorMsg = `Failed to recover ${driveFile.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error('❌', errorMsg);
        }
      }

      result.documents = recoveredDocs;
      result.success = result.recoveredCount > 0;

      console.log(`🎉 Recovery complete: ${result.recoveredCount} documents recovered`);
      if (result.errors.length > 0) {
        console.warn('⚠️ Recovery errors:', result.errors);
      }

      return result;

    } catch (error) {
      const errorMsg = `Recovery service failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMsg);
      console.error('💥 Recovery failed:', error);
      return result;
    }
  }

  /**
   * Get detailed information about what can be recovered
   */
  async getRecoveryPreview(userId: string): Promise<{
    totalFiles: number;
    recoverableFiles: number;
    fileTypes: { [key: string]: number };
    estimatedSize: number;
    existingDuplicates: number;
  }> {
    try {
      const driveFiles = await this.aiDriveService.listFiles(userId, null, {
        include_trashed: false
      });

      const fileDocuments = driveFiles.filter(file => !file.is_folder);
      const fileTypes: { [key: string]: number } = {};
      let totalSize = 0;

      fileDocuments.forEach(file => {
        const category = this.mapMimeTypeToCategory(file.mime_type);
        fileTypes[category] = (fileTypes[category] || 0) + 1;
        totalSize += file.size_bytes || 0;
      });

      // Check for duplicates with existing documents
      const { documents: existingDocuments } = useKnowledgeBaseStore.getState();
      const existingDocMap = new Map<string, boolean>();
      existingDocuments.forEach(doc => {
        const key = `${doc.metadata.source}-${doc.title || doc.metadata.title}`;
        existingDocMap.set(key, true);
      });

      let duplicateCount = 0;
      fileDocuments.forEach(file => {
        const duplicateKey = `${file.storage_path || file.name}-${file.name}`;
        if (existingDocMap.has(duplicateKey)) {
          duplicateCount++;
        }
      });

      return {
        totalFiles: driveFiles.length,
        recoverableFiles: fileDocuments.length,
        fileTypes,
        estimatedSize: totalSize,
        existingDuplicates: duplicateCount
      };

    } catch (error) {
      console.error('Error getting recovery preview:', error);
      return {
        totalFiles: 0,
        recoverableFiles: 0,
        fileTypes: {},
        estimatedSize: 0,
        existingDuplicates: 0
      };
    }
  }

  private mapMimeTypeToDocumentType(mimeType?: string | null): string {
    if (!mimeType) return 'text';
    
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('text')) return 'text';
    
    return 'file';
  }

  private mapMimeTypeToCategory(mimeType?: string | null): string {
    if (!mimeType) return 'Document';
    
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'Document';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'Spreadsheet';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'Presentation';
    if (mimeType.includes('image')) return 'Image';
    if (mimeType.includes('text')) return 'Text';
    
    return 'File';
  }
}

// Export a singleton instance
export const documentRecoveryService = new DocumentRecoveryService();