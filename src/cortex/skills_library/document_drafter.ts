import { ToolRegistry } from '../tools/ToolRegistry';

/**
 * 📝 DOCUMENT DRAFTER SKILL
 * Precision capability for generating ready-to-file legal documents.
 */
export const document_drafter_skill = {
  id: 'document_drafter',
  name: 'Document Drafting Engine',
  description: 'Generates petitions, letters, and summaries with professional formatting.',
  
  async execute(params: { type: string; data: any; title: string }) {
    console.log('📝 Drafting Document:', params.title);
    
    // 1. Create the content (In a real app, this would use a template system or LLM call)
    const content = `[DRAFT: ${params.type}]\n\n${JSON.stringify(params.data, null, 2)}`;

    // 2. Save to Drive/Canvas
    const canvasResult = await ToolRegistry.invokeTool('create_canvas', {
      title: params.title,
      content: content,
      metadata: { type: params.type, source: 'document_drafter_skill' }
    });

    return {
      status: 'success',
      canvasId: canvasResult.id,
      url: canvasResult.url,
      message: `Created ${params.type} document: ${params.title}`
    };
  }
};
