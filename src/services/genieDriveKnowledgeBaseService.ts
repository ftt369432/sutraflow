import { AIDriveFile, AIDriveService } from './drive/aiDriveService';
import { useKnowledgeBaseStore } from '../store/knowledgeBaseStore';
import { useAssistantStore } from '../store/assistantStore';
import { AIDocument } from '../types/ai';
import { supabase } from '../lib/supabase';

export interface GenieDriveKnowledgeBaseLink {
  id: string;
  genie_drive_file_id: string;
  knowledge_base_document_id: string;
  assistant_id?: string;
  linked_at: string;
  auto_sync: boolean;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
}

export class GenieDriveKnowledgeBaseService {
  private static instance: GenieDriveKnowledgeBaseService;
  
  static getInstance(): GenieDriveKnowledgeBaseService {
    if (!this.instance) {
      this.instance = new GenieDriveKnowledgeBaseService();
    }
    return this.instance;
  }

  /**
   * Link a Genie Drive file to Knowledge Base for AI processing
   * Support for Sovereign Anchoring to external subjects (e.g. Medcare Clients)
   */
  async linkFileToKnowledgeBase(
    genieDriveFile: AIDriveFile,
    options: {
      assistantId?: string,
      autoSync?: boolean,
      externalSubjectId?: string,
      industryNamespace?: string
    } = {}
  ): Promise<{ success: boolean; documentId?: string; error?: string }> {
    const { assistantId, autoSync = true, externalSubjectId, industryNamespace = 'general' } = options;
    
    try {
      // Check if file is already linked
      const existingLink = await this.getFileKnowledgeBaseLink(genieDriveFile.id);
      if (existingLink) {
        return { 
          success: false, 
          error: 'File is already linked to Knowledge Base' 
        };
      }

      // Determine the best available text content for the knowledge base document
      let textContent = '';
      if (genieDriveFile.ocr_text && genieDriveFile.ocr_text.trim() !== '') {
        textContent = genieDriveFile.ocr_text;
      } else if (genieDriveFile.ai_summary && genieDriveFile.ai_summary.trim() !== '') {
        textContent = genieDriveFile.ai_summary;
      }

      if (!textContent) {
        textContent = `File: ${genieDriveFile.name} (content will be extracted during processing)`;
      }

      // Create Knowledge Base document with Sovereign Anchoring
      const knowledgeBaseDoc: Omit<AIDocument, 'id' | 'embedding'> = {
        title: genieDriveFile.name,
        content: textContent,
        type: this.mapFileTypeToDocumentType(genieDriveFile.mime_type || ''),
        folderId: assistantId ? await this.getOrCreateAssistantFolder(assistantId) : undefined,
        metadata: {
          source: 'genie_drive',
          title: genieDriveFile.name,
          author: 'user',
          date: new Date(genieDriveFile.created_at),
          category: this.mapFileTypeToCategory(genieDriveFile.mime_type || ''),
          tags: genieDriveFile.ai_metadata?.auto_tags || [],
          size: genieDriveFile.size || 0,
          // 🚀 SOVEREIGN ANCHORING HEADERS
          external_subject_id: externalSubjectId,
          industry_namespace: industryNamespace,
          genie_drive_file_id: genieDriveFile.id,
          mime_type: genieDriveFile.mime_type || '',
          ai_summary: genieDriveFile.ai_summary || '',
          ai_topics: genieDriveFile.ai_topics || []
        }
      };

      // Add to Knowledge Base store
      // @ts-ignore - temporary type fix
      await useKnowledgeBaseStore.getState().addDocument(knowledgeBaseDoc);
      
      // Get the created document (it will have an ID now)
      const documents = useKnowledgeBaseStore.getState().documents;
      const createdDoc = documents.find(doc => 
        (doc.metadata as any)?.genie_drive_file_id === genieDriveFile.id
      );

      if (!createdDoc) {
        throw new Error('Failed to create Knowledge Base document');
      }

      return { success: true, documentId: createdDoc.id };

    } catch (error) {
      console.error('Error linking file to Knowledge Base:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Unlink a file from Knowledge Base
   */
  async unlinkFileFromKnowledgeBase(genieDriveFileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the existing link by finding the document with this file ID
      const documents = useKnowledgeBaseStore.getState().documents;
      const linkedDoc = documents.find(doc => 
        (doc.metadata as any)?.genie_drive_file_id === genieDriveFileId
      );

      if (!linkedDoc) {
        return { success: false, error: 'File is not linked to Knowledge Base' };
      }

      // Remove from Knowledge Base store
      useKnowledgeBaseStore.getState().removeDocument(linkedDoc.id);

      return { success: true };

    } catch (error) {
      console.error('Error unlinking file from Knowledge Base:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get Knowledge Base link for a file
   */
  async getFileKnowledgeBaseLink(genieDriveFileId: string): Promise<AIDocument | null> {
    try {
      const documents = useKnowledgeBaseStore.getState().documents;
      const linkedDoc = documents.find(doc => 
        (doc.metadata as any)?.genie_drive_file_id === genieDriveFileId
      );

      // @ts-ignore - temporary type fix
      return linkedDoc || null;
    } catch (error) {
      console.error('Error getting file Knowledge Base link:', error);
      return null;
    }
  }

  /**
   * Get all files linked to Knowledge Base for an assistant
   */
  async getAssistantLinkedFiles(assistantId: string): Promise<GenieDriveKnowledgeBaseLink[]> {
    try {
      const { data, error } = await supabase
        .from('genie_drive_knowledge_base_links')
        .select('*')
        .eq('assistant_id', assistantId);

      if (error) {
        console.error('Error fetching assistant linked files:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting assistant linked files:', error);
      return [];
    }
  }

  /**
   * Check if a file is linked to Knowledge Base
   */
  async isFileLinked(genieDriveFileId: string): Promise<boolean> {
    const link = await this.getFileKnowledgeBaseLink(genieDriveFileId);
    return !!link;
  }

  /**
   * Sync file changes to Knowledge Base
   */
  async syncFileChanges(genieDriveFileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const linkedDoc = await this.getFileKnowledgeBaseLink(genieDriveFileId);
      if (!linkedDoc) {
        return { success: false, error: 'File is not linked to Knowledge Base' };
      }

      // Get updated file content
      const aiDriveService = new AIDriveService(supabase);
      const updatedFile = await aiDriveService.getFile(genieDriveFileId);
      
      if (!updatedFile) {
        return { success: false, error: 'File not found' };
      }

      // Update Knowledge Base document
      const updates: Partial<AIDocument> = {
        title: updatedFile.name,
        // Prioritize ocr_text, then ai_summary, then existing content
        content: updatedFile.ocr_text && updatedFile.ocr_text.trim() !== '' 
                 ? updatedFile.ocr_text 
                 : (updatedFile.ai_summary && updatedFile.ai_summary.trim() !== '' 
                    ? updatedFile.ai_summary 
                    : linkedDoc.content),
        metadata: {
          ...linkedDoc.metadata,
          title: updatedFile.name,
          date: new Date(updatedFile.updated_at),
          tags: updatedFile.ai_metadata?.auto_tags || [],
          // Additional metadata updates
          ...{
            ai_summary: updatedFile.ai_summary || '',
            ai_topics: updatedFile.ai_topics || []
          }
        }
      };

      await useKnowledgeBaseStore.getState().updateDocument(linkedDoc.id, updates);

      return { success: true };

    } catch (error) {
      console.error('Error syncing file changes:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Map file MIME type to document type
   */
  private mapFileTypeToDocumentType(mimeType: string): 'text' | 'pdf' | 'image' | 'other' {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('text')) return 'text';
    if (mimeType.includes('image')) return 'image';
    return 'other';
  }

  /**
   * Map file MIME type to category
   */
  private mapFileTypeToCategory(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'documents';
    if (mimeType.includes('text')) return 'documents';
    if (mimeType.includes('word')) return 'documents';
    if (mimeType.includes('image')) return 'images';
    if (mimeType.includes('video')) return 'videos';
    if (mimeType.includes('audio')) return 'audio';
    return 'other';
  }

  /**
   * Get or create folder for assistant in Knowledge Base
   */
  private async getOrCreateAssistantFolder(assistantId: string): Promise<string> {
    const assistant = useAssistantStore.getState().getAssistantById(assistantId);
    if (!assistant) {
      throw new Error('Assistant not found');
    }

    const folders = useKnowledgeBaseStore.getState().folders;
    const existingFolder = folders.find(folder => folder.name === `Assistant: ${assistant.name}`);
    
    if (existingFolder) {
      return existingFolder.id;
    }

    // Create new folder for assistant
    // @ts-ignore - temporary type fix
    useKnowledgeBaseStore.getState().addFolder({
      name: `Assistant: ${assistant.name}`,
      assistantIds: [assistant.id]
    });

    // Get the newly created folder
    const updatedFolders = useKnowledgeBaseStore.getState().folders;
    const newFolder = updatedFolders.find(folder => folder.name === `Assistant: ${assistant.name}`);
    
    if (!newFolder) {
      throw new Error('Failed to create assistant folder');
    }

    return newFolder.id;
  }

  /**
   * Link an entire AI Drive folder and its contents to Knowledge Base
   */
  async linkFolderToKnowledgeBase(
    genieDriveFolder: AIDriveFile,
    options: {
      assistantId?: string,
      autoSync?: boolean,
      recursive?: boolean,
      externalSubjectId?: string,
      industryNamespace?: string
    } = {}
  ): Promise<{ success: boolean; linkedCount: number; errors: string[] }> {
    const { assistantId, autoSync = true, recursive = true, externalSubjectId, industryNamespace } = options;
    
    try {
      if (!genieDriveFolder.is_folder) {
        return { 
          success: false, 
          linkedCount: 0, 
          errors: ['Selected item is not a folder'] 
        };
      }

      const aiDriveService = new AIDriveService(supabase);
      const errors: string[] = [];
      let linkedCount = 0;

      // Get all files in the folder
      const folderContents = await aiDriveService.listFiles(
        genieDriveFolder.user_id, 
        genieDriveFolder.id
      );

      // Create a Knowledge Base folder to organize linked documents
      const kbFolderName = assistantId 
        ? `${genieDriveFolder.name} (${await this.getAssistantName(assistantId)})`
        : genieDriveFolder.name;
      
      const kbFolder = await this.createKnowledgeBaseFolder(kbFolderName, assistantId);

      // Link all files in the folder
      for (const item of folderContents) {
        if (item.is_folder && recursive) {
          // Recursively link subfolders
          const subResult = await this.linkFolderToKnowledgeBase(item, options);
          linkedCount += subResult.linkedCount;
          errors.push(...subResult.errors);
        } else if (!item.is_folder) {
          // Link individual files with anchoring
          try {
            const result = await this.linkFileToKnowledgeBase(item, {
              assistantId,
              autoSync,
              externalSubjectId,
              industryNamespace
            });
            
            if (result.success) {
              linkedCount++;
              // Move the linked document to the folder
              if (result.documentId && kbFolder.id) {
                useKnowledgeBaseStore.getState().moveDocument(result.documentId, kbFolder.id);
              }
            } else {
              errors.push(`${item.name}: ${result.error}`);
            }
          } catch (error) {
            errors.push(`${item.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      return { 
        success: errors.length === 0, 
        linkedCount, 
        errors 
      };

      return { 
        success: errors.length === 0, 
        linkedCount, 
        errors 
      };

    } catch (error) {
      console.error('Error linking folder to Knowledge Base:', error);
      return { 
        success: false, 
        linkedCount: 0, 
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'] 
      };
    }
  }

  /**
   * Create a Knowledge Base folder for organizing linked documents
   */
  private async createKnowledgeBaseFolder(
    folderName: string, 
    assistantId?: string
  ): Promise<{ id: string; name: string }> {
    const parentFolderId = assistantId 
      ? await this.getOrCreateAssistantFolder(assistantId)
      : undefined;

    // @ts-ignore - temporary type fix
    useKnowledgeBaseStore.getState().addFolder({
      name: folderName,
      parentId: parentFolderId,
      assistantIds: []
    });

    const folders = useKnowledgeBaseStore.getState().folders;
    const newFolder = folders.find(folder => folder.name === folderName);
    
    if (!newFolder) {
      throw new Error('Failed to create Knowledge Base folder');
    }

    return { id: newFolder.id, name: newFolder.name };
  }

  /**
   * Get assistant name for folder naming
   */
  private async getAssistantName(assistantId: string): Promise<string> {
    const assistant = useAssistantStore.getState().getAssistantById(assistantId);
    return assistant?.name || 'Unknown Assistant';
  }

  /**
   * Unlink an entire folder and its contents from Knowledge Base
   */
  async unlinkFolderFromKnowledgeBase(
    genieDriveFolderId: string,
    recursive: boolean = true
  ): Promise<{ success: boolean; unlinkedCount: number; errors: string[] }> {
    try {
      const aiDriveService = new AIDriveService(supabase);
      const errors: string[] = [];
      let unlinkedCount = 0;

      // Get folder contents
      const folderContents = await aiDriveService.listFiles('', genieDriveFolderId);

      for (const item of folderContents) {
        if (item.is_folder && recursive) {
          const subResult = await this.unlinkFolderFromKnowledgeBase(item.id, recursive);
          unlinkedCount += subResult.unlinkedCount;
          errors.push(...subResult.errors);
        } else if (!item.is_folder) {
          try {
            const result = await this.unlinkFileFromKnowledgeBase(item.id);
            if (result.success) {
              unlinkedCount++;
            } else {
              errors.push(`${item.name}: ${result.error}`);
            }
          } catch (error) {
            errors.push(`${item.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      return { 
        success: errors.length === 0, 
        unlinkedCount, 
        errors 
      };

    } catch (error) {
      console.error('Error unlinking folder from Knowledge Base:', error);
      return { 
        success: false, 
        unlinkedCount: 0, 
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'] 
      };
    }
  }
}

export const genieDriveKnowledgeBaseService = GenieDriveKnowledgeBaseService.getInstance();