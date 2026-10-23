import { templateStorageService } from '../../../../services/templates/TemplateStorageService';

/**
 * 📋 LIST TEMPLATES API
 * Gets all templates for a user/assistant with filtering options
 */
export default async function handler(req: any, res: any) {
  console.log('📋 LIST TEMPLATES API called:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      userId, 
      assistantId,
      documentType,
      industry,
      limit = 50
    } = req.body;

    // Validate required fields
    if (!userId || !assistantId) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, assistantId' 
      });
    }

    console.log('📋 LISTING TEMPLATES for user:', userId, 'assistant:', assistantId);

    // Get all templates and filter if needed
    const allTemplates = [];
    
    // Search localStorage for user templates
    const userTemplatePrefix = `template_${userId}_${assistantId}_`;
    const globalTemplatePrefix = 'template_global_';
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(userTemplatePrefix) || key.startsWith(globalTemplatePrefix))) {
        try {
          const templateData = localStorage.getItem(key);
          if (templateData) {
            const template = JSON.parse(templateData);
            
            // Apply filters if provided
            let includeTemplate = true;
            
            if (documentType && template.documentType !== documentType) {
              includeTemplate = false;
            }
            
            if (industry && template.industry !== industry) {
              includeTemplate = false;
            }
            
            if (includeTemplate) {
              allTemplates.push({
                id: template.id,
                name: template.name,
                description: template.description,
                documentType: template.documentType,
                industry: template.industry,
                source: template.source,
                createdAt: template.createdAt,
                lastUsed: template.lastUsed,
                usageCount: template.usageCount,
                tags: template.tags || [],
                isGlobal: key.startsWith(globalTemplatePrefix)
              });
            }
          }
        } catch (parseError) {
          console.warn('Failed to parse template:', key, parseError);
        }
      }
    }

    // Sort by most recently used, then by creation date
    allTemplates.sort((a, b) => {
      const aLastUsed = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
      const bLastUsed = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
      
      if (aLastUsed !== bLastUsed) {
        return bLastUsed - aLastUsed; // Most recent first
      }
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Limit results
    const limitedTemplates = allTemplates.slice(0, limit);

    console.log('✅ FOUND', limitedTemplates.length, 'templates');

    res.status(200).json({
      success: true,
      templates: limitedTemplates,
      totalFound: allTemplates.length,
      limited: allTemplates.length > limit,
      filters: {
        documentType: documentType || null,
        industry: industry || null
      }
    });

  } catch (error) {
    console.error('❌ ERROR listing templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
