import { ToolRegistry } from '../tools/ToolRegistry';

/**
 * ⚖️ LEGAL RESEARCH SKILL
 * Expert capability for searching medical-legal knowledge bases and precedents.
 */
export const legal_research_skill = {
  id: 'legal_research',
  name: 'Legal Research Expert',
  description: 'Deep search across legal documents, medical guidelines (ACOEM/MTUS), and case law.',
  
  async execute(params: { query: string; caseId?: string }) {
    console.log('⚖️ Executing Legal Research:', params.query);
    
    // 1. Search Knowledge Base
    const results = await ToolRegistry.invokeTool('search_knowledge', { 
      query: params.query,
      limit: 5
    });

    // 2. Search Web for latest precedents if needed
    const webResults = await ToolRegistry.invokeTool('search_web', {
      query: `California workers comp case law ${params.query}`
    });

    return {
      status: 'success',
      knowledgeResults: results,
      webResults: webResults,
      summary: `Found ${results.length || 0} internal precedents and ${webResults.length || 0} external sources.`
    };
  }
};
