/**
 * Canvas Service
 * 
 * Centralized Canvas workspace operations.
 * Handles document loading, updating, and Canvas state management.
 */

export interface CanvasContent {
  content: string;
  metadata: {
    profession: string;
    jurisdiction?: string;
    caseNumber?: string;
    originalSource: 'ai_chat' | 'template' | 'upload' | 'ai_drive';
  };
}

export interface CanvasState {
  isLoaded: boolean;
  currentContent: string;
  lastUpdate: Date;
  documentId?: string;
}

export class CanvasService {
  private static instance: CanvasService | null = null;
  private canvasState: CanvasState;

  private constructor() {
    this.canvasState = {
      isLoaded: false,
      currentContent: '',
      lastUpdate: new Date()
    };
    
    console.log('🎨 Canvas Service initialized (singleton)');
  }

  public static getInstance(): CanvasService {
    if (!CanvasService.instance) {
      CanvasService.instance = new CanvasService();
    }
    return CanvasService.instance;
  }

  /**
   * Loads content into Canvas workspace
   */
  async loadContent(canvasContent: CanvasContent, existingDocumentId?: string): Promise<boolean> {
    try {
      console.log('🎨 Canvas Service: Loading content', {
        contentLength: canvasContent.content.length,
        profession: canvasContent.metadata.profession,
        source: canvasContent.metadata.originalSource,
        existingDocumentId: existingDocumentId,
        currentDocumentId: this.canvasState.documentId
      });

      // Use existing document ID if provided, otherwise generate new one
      const documentId = existingDocumentId || this.generateCanvasDocumentId();

      // Update Canvas state
      this.canvasState = {
        isLoaded: true,
        currentContent: canvasContent.content,
        lastUpdate: new Date(),
        documentId: documentId
      };

      console.log('🎨 Canvas Service: State updated with documentId:', this.canvasState.documentId);

      // Dispatch event to notify Canvas UI
      const loadEvent = new CustomEvent('canvasContentLoad', {
        detail: {
          content: canvasContent.content,
          metadata: canvasContent.metadata,
          documentId: this.canvasState.documentId
        }
      });

      window.dispatchEvent(loadEvent);

      console.log('✅ Canvas content loaded successfully');
      return true;

    } catch (error) {
      console.error('❌ Failed to load Canvas content:', error);
      return false;
    }
  }

  /**
   * Updates existing Canvas content
   */
  async updateContent(newContent: string, documentId?: string): Promise<boolean> {
    try {
      console.log('🎨 Canvas Service: Updating content', {
        newContentLength: newContent.length,
        previousLength: this.canvasState.currentContent.length,
        documentId: documentId || this.canvasState.documentId
      });

      // Update state
      this.canvasState.currentContent = newContent;
      this.canvasState.lastUpdate = new Date();
      
      // If documentId is provided, update it in state
      if (documentId) {
        this.canvasState.documentId = documentId;
      }

      // Ensure we have a documentId for the event
      const finalDocumentId = this.canvasState.documentId;
      
      if (!finalDocumentId) {
        console.error('❌ Canvas Service: No documentId available for update event');
        return false;
      }

      // Dispatch update event
      const updateEvent = new CustomEvent('canvasContentUpdate', {
        detail: {
          content: newContent,
          documentId: finalDocumentId,
          updateType: 'ai_edit'
        }
      });

      window.dispatchEvent(updateEvent);

      console.log('✅ Canvas content updated successfully with documentId:', finalDocumentId);
      return true;

    } catch (error) {
      console.error('❌ Failed to update Canvas content:', error);
      return false;
    }
  }

  /**
   * Gets current Canvas state
   */
  getCanvasState(): CanvasState {
    return { ...this.canvasState };
  }

  /**
   * Checks if Canvas has content loaded
   */
  hasContent(): boolean {
    return this.canvasState.isLoaded && this.canvasState.currentContent.length > 0;
  }

  /**
   * Gets current content
   */
  getCurrentContent(): string {
    return this.canvasState.currentContent;
  }

  /**
   * Clears Canvas content
   */
  async clearContent(): Promise<void> {
    console.log('🎨 Canvas Service: Clearing content');

    this.canvasState = {
      isLoaded: false,
      currentContent: '',
      lastUpdate: new Date()
    };

    // Dispatch clear event
    const clearEvent = new CustomEvent('canvasContentClear', {
      detail: { reason: 'manual_clear' }
    });

    window.dispatchEvent(clearEvent);

    console.log('✅ Canvas content cleared');
  }

  /**
   * Saves current Canvas content
   */
  async saveContent(): Promise<boolean> {
    try {
      console.log('🎨 Canvas Service: Saving content');

      // In a real implementation, this would save to database
      // For now, we'll just dispatch a save event
      const saveEvent = new CustomEvent('canvasSave', {
        detail: {
          content: this.canvasState.currentContent,
          documentId: this.canvasState.documentId,
          timestamp: new Date()
        }
      });

      window.dispatchEvent(saveEvent);

      console.log('✅ Canvas content saved');
      return true;

    } catch (error) {
      console.error('❌ Failed to save Canvas content:', error);
      return false;
    }
  }

  /**
   * Applies selective edits to specific content sections
   */
  async applySelectiveEdit(
    editType: 'add' | 'modify' | 'replace',
    targetSection: string,
    newContent: string
  ): Promise<boolean> {
    try {
      console.log('🎨 Canvas Service: Applying selective edit', {
        editType,
        targetSection,
        newContentLength: newContent.length
      });

      let updatedContent = this.canvasState.currentContent;

      switch (editType) {
        case 'add':
          updatedContent = this.addContentToSection(updatedContent, targetSection, newContent);
          break;
        case 'modify':
          updatedContent = this.modifySection(updatedContent, targetSection, newContent);
          break;
        case 'replace':
          updatedContent = newContent;
          break;
      }

      return await this.updateContent(updatedContent);

    } catch (error) {
      console.error('❌ Failed to apply selective edit:', error);
      return false;
    }
  }

  /**
   * Private helper methods
   */
  private generateCanvasDocumentId(): string {
    return `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addContentToSection(content: string, section: string, newContent: string): string {
    // Find appropriate insertion point based on section
    if (section.includes('argument') || section.includes('II.')) {
      const argumentsStart = content.indexOf('**II.');
      if (argumentsStart !== -1) {
        const nextSection = content.indexOf('**III.', argumentsStart);
        if (nextSection !== -1) {
          return content.slice(0, nextSection) + '\n\n' + newContent + '\n\n' + content.slice(nextSection);
        }
      }
    }

    // Default: append to end
    return content + '\n\n' + newContent;
  }

  private modifySection(content: string, section: string, newContent: string): string {
    // This would contain logic to modify specific sections
    // For now, simple replacement of section markers
    if (section.includes('name')) {
      const namePattern = /\[.*?NAME.*?\]/g;
      const extractedName = this.extractNameFromContent(newContent);
      if (extractedName) {
        return content.replace(namePattern, extractedName);
      }
    }

    return content;
  }

  private extractNameFromContent(content: string): string {
    const nameMatch = content.match(/(?:name|applicant).*?:.*?([^\n,]+)/i);
    return nameMatch ? nameMatch[1].trim() : '';
  }

  /**
   * Event management for Canvas integration
   */
  public addEventListener(eventType: string, handler: (event: CustomEvent) => void): void {
    window.addEventListener(eventType, handler as EventListener);
  }

  public removeEventListener(eventType: string, handler: (event: CustomEvent) => void): void {
    window.removeEventListener(eventType, handler as EventListener);
  }
}
