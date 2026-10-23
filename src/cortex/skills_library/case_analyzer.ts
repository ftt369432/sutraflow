import { ToolRegistry } from '../tools/ToolRegistry';

/**
 * 🔍 CASE ANALYZER SKILL
 * Analytical capability for synthesizing case facts and identifying risks.
 */
export const case_analyzer_skill = {
  id: 'case_analyzer',
  name: 'Multi-Module Case Analyzer',
  description: 'Synthesizes tasks, emails, and drive files to provide a 360-degree case view.',
  
  async execute(params: { caseId: string }) {
    console.log('🔍 Analyzing Case:', params.caseId);
    
    // 1. Fetch related data in parallel
    const [tasks, files] = await Promise.all([
      ToolRegistry.invokeTool('list_tasks', { caseId: params.caseId }),
      ToolRegistry.invokeTool('search_knowledge', { query: `case_id:${params.caseId}` })
    ]);

    // 2. Synthesize findings
    const riskScore = tasks.filter((t: any) => t.status === 'overdue').length > 2 ? 'HIGH' : 'LOW';

    return {
      status: 'success',
      findings: {
        taskCount: tasks.length,
        fileCount: files.length,
        riskLevel: riskScore
      },
      summary: `Found ${tasks.length} tasks and ${files.length} related documents. Risk level estimated as ${riskScore}.`
    };
  }
};
