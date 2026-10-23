import { templateStorageService } from '../../../../services/templates/TemplateStorageService';

/**
 * 🔍 SEARCH TEMPLATES API
 * Finds best matching templates using intelligent search
 */
export default async function handler(req: any, res: any) {
  console.log('🔍 TEMPLATE SEARCH API called:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      documentType, 
      industry, 
      keywords = [], 
      userId, 
      assistantId,
      limit = 10
    } = req.body;

    // Validate required fields
    if (!documentType || !userId || !assistantId) {
      return res.status(400).json({ 
        error: 'Missing required fields: documentType, userId, assistantId' 
      });
    }

    console.log('🔍 SEARCHING TEMPLATES for:', documentType, 'in', industry);

    // Search for templates using our intelligent matching
    const templateMatches = await templateStorageService.findBestTemplate({
      documentType,
      industry,
      keywords: Array.isArray(keywords) ? keywords : [keywords].filter(Boolean),
      userId,
      assistantId
    });

    // Limit results
    const limitedResults = templateMatches.slice(0, limit);

    console.log('✅ FOUND', limitedResults.length, 'template matches');

    res.status(200).json({
      success: true,
      templates: limitedResults,
      totalFound: templateMatches.length,
      limited: templateMatches.length > limit
    });

  } catch (error) {
    console.error('❌ ERROR searching templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
