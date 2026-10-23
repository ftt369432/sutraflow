/**
 * AI Drive Document Bridge
 * 
 * Connects the MultiCanvasController document creation system
 * with the AI Drive tabbed document editor interface.
 * 
 * This bridge enables seamless document flow from chat-generated 
 * documents to the unified AI Drive editing experience.
 */

import { AIDriveService } from '../drive/aiDriveService';
import { MultiCanvasController, CanvasDocument } from '../../controllers/MultiCanvasController';
import { useDocumentTabs } from '../../hooks/useDocumentTabs';

export interface DocumentCreationRequest {
  documents: CanvasDocument[];
  userId: string;
  folderId?: string | null;
  autoOpen?: boolean;
  source: 'chat' | 'manual' | 'template';
}

export interface DocumentCreationResult {
  success: boolean;
  createdFiles: Array<{
    id: string;
    name: string;
    canvasDocumentId: string;
  }>;
  errors: Array<{
    canvasDocumentId: string;
    error: string;
  }>;
}

export class AIDriveDocumentBridge {
  constructor(
    private aiDriveService: AIDriveService,
    private documentTabs?: ReturnType<typeof useDocumentTabs>
  ) {}

  /**
   * Creates AI Drive files from canvas documents and optionally opens them in tabs
   */
  async createDocumentsFromCanvas(request: DocumentCreationRequest): Promise<DocumentCreationResult> {
    const result: DocumentCreationResult = {
      success: false,
      createdFiles: [],
      errors: []
    };

    try {
      for (const canvasDoc of request.documents) {
        try {
          // Generate appropriate filename
          const filename = this.generateFilename(canvasDoc);
          
          // Create the file content
          const fileContent = this.formatDocumentContent(canvasDoc);
          
          // Create file blob
          const blob = new Blob([fileContent], { type: 'text/plain' });
          const file = new File([blob], filename, { type: 'text/plain' });

          // Upload to AI Drive
          const uploadedFile = await this.aiDriveService.uploadFile(
            request.userId,
            file,
            request.folderId || null
          );

          result.createdFiles.push({
            id: uploadedFile.id,
            name: uploadedFile.name,
            canvasDocumentId: canvasDoc.id
          });

          // Auto-open in document tabs if requested and available
          if (request.autoOpen && this.documentTabs) {
            await this.documentTabs.openDocument(uploadedFile);
          }

        } catch (error) {
          result.errors.push({
            canvasDocumentId: canvasDoc.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      result.success = result.errors.length === 0;
      return result;

    } catch (error) {
      result.success = false;
      result.errors.push({
        canvasDocumentId: 'general',
        error: error instanceof Error ? error.message : 'Failed to create documents'
      });
      return result;
    }
  }

  /**
   * Generates appropriate filenames for canvas documents
   */
  private generateFilename(canvasDoc: CanvasDocument): string {
    // Clean up the title for use as filename
    let filename = canvasDoc.title
      .replace(/[^a-zA-Z0-9\s\-\_]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50); // Limit length

    // Add timestamp if title is empty or too short
    if (filename.length < 5) {
      filename = `document_${Date.now()}`;
    }

    // Add appropriate extension based on content type
    const extension = this.getFileExtension(canvasDoc.contentType);
    
    return `${filename}${extension}`;
  }

  /**
   * Formats canvas document content for file storage
   */
  private formatDocumentContent(canvasDoc: CanvasDocument): string {
    const header = `# ${canvasDoc.title}\n\n`;
    
    let metadata = `**Created:** ${canvasDoc.lastModified.toLocaleString()}\n` +
                   `**Type:** ${canvasDoc.contentType}\n` +
                   `**AI Assisted:** ${canvasDoc.metadata.aiAssisted ? 'Yes' : 'No'}\n`;
    
    if (canvasDoc.metadata.clientInfo?.name) {
      metadata += `**Client:** ${canvasDoc.metadata.clientInfo.name}\n`;
    }
    
    if (canvasDoc.metadata.caseInfo) {
      metadata += `**Case:** ${canvasDoc.metadata.caseInfo}\n`;
    }
    
    const separator = '\n---\n\n';
    
    return header + metadata + separator + canvasDoc.content;
  }

  /**
   * Gets appropriate file extension based on content type
   */
  private getFileExtension(contentType: string): string {
    switch (contentType.toLowerCase()) {
      case 'petition':
      case 'motion':
      case 'brief':
      case 'contract':
      case 'legal':
        return '.legal.txt';
      case 'business':
      case 'memo':
      case 'report':
        return '.doc.txt';
      case 'letter':
      case 'correspondence':
        return '.letter.txt';
      case 'medical':
        return '.med.txt';
      case 'plan':
      case 'strategy':
        return '.plan.txt';
      default:
        return '.txt';
    }
  }

  /**
   * Sets the document tabs instance for auto-opening documents
   */
  setDocumentTabs(documentTabs: ReturnType<typeof useDocumentTabs>) {
    this.documentTabs = documentTabs;
  }

  /**
   * Creates a single document directly in AI Drive and optionally opens it
   */
  async createSingleDocument(
    userId: string,
    title: string,
    content: string,
    contentType: string,
    folderId?: string | null,
    autoOpen: boolean = false
  ): Promise<{ success: boolean; file?: any; error?: string }> {
    try {
      const canvasDoc: CanvasDocument = {
        id: `single_${Date.now()}`,
        title,
        content,
        contentType,
        isActive: true,
        lastModified: new Date(),
        metadata: {
          processedThrough: 'manual',
          aiAssisted: false
        }
      };

      const result = await this.createDocumentsFromCanvas({
        documents: [canvasDoc],
        userId,
        folderId,
        autoOpen,
        source: 'manual'
      });

      if (result.success && result.createdFiles.length > 0) {
        return { success: true, file: result.createdFiles[0] };
      } else {
        return { 
          success: false, 
          error: result.errors[0]?.error || 'Failed to create document'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

/**
 * Factory function to create the bridge with current services
 */
export function createAIDriveDocumentBridge(
  aiDriveService: AIDriveService,
  documentTabs?: ReturnType<typeof useDocumentTabs>
): AIDriveDocumentBridge {
  return new AIDriveDocumentBridge(aiDriveService, documentTabs);
}
