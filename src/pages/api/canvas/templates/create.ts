import { templateStorageService } from '../../../../services/templates/TemplateStorageService';

/**
 * 🚀 CREATE TEMPLATE API
 * Saves user-created or extracted templates to AI Drive
 */
export default async function handler(req: any, res: any) {
  console.log('🚀 TEMPLATE CREATE API called:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      name, 
      description, 
      content, 
      documentType, 
      industry, 
      source = 'manual',
      userId, 
      assistantId 
    } = req.body;

    // Validate required fields
    if (!name || !content || !documentType || !userId || !assistantId) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, content, documentType, userId, assistantId' 
      });
    }

    console.log('💾 SAVING TEMPLATE:', name, 'for', documentType);

    // Save template using our template storage service
    const templateId = await templateStorageService.saveTemplateToAIDrive(
      {
        name,
        description: description || `Template for ${documentType}`,
        content,
        source: source as 'extracted' | 'ai_generated' | 'imported' | 'manual',
        documentType,
        industry
      },
      userId,
      assistantId
    );

    console.log('✅ TEMPLATE SAVED with ID:', templateId);

    res.status(201).json({
      success: true,
      templateId,
      message: 'Template created successfully'
    });

  } catch (error) {
    console.error('❌ ERROR creating template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
