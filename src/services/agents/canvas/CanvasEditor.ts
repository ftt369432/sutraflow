// Canvas Document Editor Service
// Provides incremental editing, version control, and content modification capabilities

export interface CanvasEdit {
  id: string;
  timestamp: Date;
  type: 'add' | 'modify' | 'delete' | 'replace';
  section: string;
  oldContent?: string;
  newContent: string;
  userPrompt: string;
}

export interface CanvasDocument {
  id: string;
  content: string;
  edits: CanvasEdit[];
  currentEditIndex: number;
  createdAt: Date;
  lastModified: Date;
}

export class CanvasEditor {
  private static instance: CanvasEditor;
  private documents: Map<string, CanvasDocument> = new Map();

  public static getInstance(): CanvasEditor {
    if (!CanvasEditor.instance) {
      CanvasEditor.instance = new CanvasEditor();
    }
    return CanvasEditor.instance;
  }

  /**
   * 📝 Initialize a new canvas document
   */
  public initializeDocument(documentId: string, initialContent: string): CanvasDocument {
    console.log(`📝 CANVAS EDITOR: Initializing document ${documentId}`);
    
    const document: CanvasDocument = {
      id: documentId,
      content: initialContent,
      edits: [],
      currentEditIndex: -1,
      createdAt: new Date(),
      lastModified: new Date()
    };

    this.documents.set(documentId, document);
    return document;
  }

  /**
   * ➕ Add content to the document
   */
  public async addContent(documentId: string, userPrompt: string, section?: string): Promise<string> {
    console.log(`➕ CANVAS EDITOR: Adding content to ${documentId}`);
    console.log(`📝 User request: ${userPrompt}`);

    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    try {
      // Use AI to generate additional content
      const { AIService } = await import('../../ai/aiService');
      const aiService = await AIService.getInstance();

      const additionPrompt = `
You are helping to enhance an existing document. Here is the current document:

CURRENT DOCUMENT:
${document.content}

USER REQUEST: ${userPrompt}

TASK: Generate ONLY the additional content that should be added to this document. 
DO NOT regenerate the entire document, just provide the new content that addresses the user's request.

Requirements:
- Generate only new content to be added
- Maintain the same professional tone and formatting
- Integrate seamlessly with existing content
- Use proper markdown formatting
- Be specific and actionable

Additional content:`;

      const newContent = await aiService.generateText(additionPrompt);
      
      // Create edit record
      const edit: CanvasEdit = {
        id: `edit_${Date.now()}`,
        timestamp: new Date(),
        type: 'add',
        section: section || 'main',
        newContent: newContent,
        userPrompt: userPrompt
      };

      // Apply the edit
      document.content = document.content + '\n\n' + newContent;
      document.edits.push(edit);
      document.currentEditIndex = document.edits.length - 1;
      document.lastModified = new Date();

      console.log(`✅ CANVAS EDITOR: Content added successfully`);
      return document.content;

    } catch (error) {
      console.error('❌ CANVAS EDITOR: Error adding content:', error);
      throw error;
    }
  }

  /**
   * ✏️ Modify existing content
   */
  public async modifyContent(documentId: string, userPrompt: string, sectionToModify?: string): Promise<string> {
    console.log(`✏️ CANVAS EDITOR: Modifying content in ${documentId}`);

    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    try {
      const { AIService } = await import('../../ai/aiService');
      const aiService = await AIService.getInstance();

      const modificationPrompt = `
You are helping to modify an existing document. Here is the current document:

CURRENT DOCUMENT:
${document.content}

USER REQUEST: ${userPrompt}

TASK: Provide the complete modified document that incorporates the user's requested changes.
- Keep all existing content that doesn't need to change
- Apply the specific modifications requested
- Maintain professional tone and formatting
- Use proper markdown formatting

Modified document:`;

      const modifiedContent = await aiService.generateText(modificationPrompt);
      
      // Create edit record
      const edit: CanvasEdit = {
        id: `edit_${Date.now()}`,
        timestamp: new Date(),
        type: 'modify',
        section: sectionToModify || 'main',
        oldContent: document.content,
        newContent: modifiedContent,
        userPrompt: userPrompt
      };

      // Apply the edit
      document.content = modifiedContent;
      document.edits.push(edit);
      document.currentEditIndex = document.edits.length - 1;
      document.lastModified = new Date();

      console.log(`✅ CANVAS EDITOR: Content modified successfully`);
      return document.content;

    } catch (error) {
      console.error('❌ CANVAS EDITOR: Error modifying content:', error);
      throw error;
    }
  }

  /**
   * ⬅️ Undo last edit (go back)
   */
  public undoEdit(documentId: string): string {
    console.log(`⬅️ CANVAS EDITOR: Undoing edit in ${documentId}`);

    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    if (document.currentEditIndex <= 0) {
      console.log('⚠️ No more edits to undo');
      return document.content;
    }

    // Go back to previous edit
    document.currentEditIndex--;
    
    if (document.currentEditIndex === -1) {
      // Back to original document
      const originalEdit = document.edits[0];
      document.content = originalEdit.oldContent || document.content;
    } else {
      // Apply previous edit
      const previousEdit = document.edits[document.currentEditIndex];
      document.content = previousEdit.newContent;
    }

    document.lastModified = new Date();
    console.log(`✅ CANVAS EDITOR: Undo successful, now at edit ${document.currentEditIndex}`);
    return document.content;
  }

  /**
   * ➡️ Redo edit (go forward)
   */
  public redoEdit(documentId: string): string {
    console.log(`➡️ CANVAS EDITOR: Redoing edit in ${documentId}`);

    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    if (document.currentEditIndex >= document.edits.length - 1) {
      console.log('⚠️ No more edits to redo');
      return document.content;
    }

    // Go forward to next edit
    document.currentEditIndex++;
    const nextEdit = document.edits[document.currentEditIndex];
    document.content = nextEdit.newContent;

    document.lastModified = new Date();
    console.log(`✅ CANVAS EDITOR: Redo successful, now at edit ${document.currentEditIndex}`);
    return document.content;
  }

  /**
   * 📄 Get current document content
   */
  public getDocument(documentId: string): CanvasDocument | null {
    return this.documents.get(documentId) || null;
  }

  /**
   * 📊 Get edit history
   */
  public getEditHistory(documentId: string): CanvasEdit[] {
    const document = this.documents.get(documentId);
    return document ? document.edits : [];
  }

  /**
   * 🔄 Get current position in edit history
   */
  public getEditPosition(documentId: string): { current: number; total: number } {
    const document = this.documents.get(documentId);
    if (!document) {
      return { current: 0, total: 0 };
    }
    return {
      current: document.currentEditIndex + 1,
      total: document.edits.length
    };
  }
}

export default CanvasEditor;
