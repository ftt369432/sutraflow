import { templateStorageService } from '../../../../services/templates/TemplateStorageService';

/**
 * 🎯 EXTRACT TEMPLATE FROM CANVAS API
 * Analyzes Canvas content and creates a smart template
 */
export default async function handler(req: any, res: any) {
  console.log('🎯 EXTRACT TEMPLATE API called:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      canvasContent, 
      suggestedName,
      documentType, 
      industry, 
      userId, 
      assistantId 
    } = req.body;

    // Validate required fields
    if (!canvasContent || !userId || !assistantId) {
      return res.status(400).json({ 
        error: 'Missing required fields: canvasContent, userId, assistantId' 
      });
    }

    console.log('🧠 EXTRACTING TEMPLATE from Canvas content...');

    // Generate template name if not provided
    const templateName = suggestedName || `Template - ${documentType || 'Document'} - ${new Date().toLocaleDateString()}`;
    const description = `Extracted template for ${documentType || 'document'} in ${industry || 'general'} industry`;

    // Extract template using AI analysis
    const templateId = await templateStorageService.extractTemplateFromCanvas(
      canvasContent,
      templateName,
      description,
      userId,
      assistantId
    );

    console.log('✅ TEMPLATE EXTRACTED and SAVED with ID:', templateId);

    res.status(201).json({
      success: true,
      templateId,
      message: 'Template extracted and saved successfully'
    });

  } catch (error) {
    console.error('❌ ERROR extracting template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extract template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
