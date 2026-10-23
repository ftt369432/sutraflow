/**
 * 🛠️ TOOL REGISTRY - Agentic AI Tool Execution System
 * 
 * Centralized registry of all tools the AI can autonomously execute.
 * Implements the "Hands" of the agentic loop - AI thinks, then uses these tools.
 * 
 * Pattern: Tool = Function that AI can call with parameters
 */

import { supabase } from '../../lib/supabaseClient';
import { CalendarAgent } from './CalendarAgent';
import { EmailAgent } from './EmailAgent';
import { v4 as uuidv4 } from 'uuid';
import { PubMedService } from '../bio/PubMedService';
import { TherapySimulationService } from '../bio/TherapySimulationService';
import { skillStack } from '../GpackService';

// 🎯 Tool execution result
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

// 🎯 Tool definition
export interface Tool {
  name: string;
  description: string;
  category: 'knowledge' | 'creation' | 'modification' | 'system' | 'research';
  parameters: Record<string, { type: string; description: string; required: boolean }>;
  execute: (...args: any[]) => Promise<ToolResult>;
}

/**
 * 🧠 AGENTIC TOOL REGISTRY
 * 
 * All tools available for autonomous AI execution.
 * AI analyzes user request → Selects appropriate tools → Executes autonomously
 */
export class AgenticToolRegistry {
  private static instance: AgenticToolRegistry;
  private tools: Map<string, Tool> = new Map();

  private constructor() {
    this.registerAllTools();
  }

  static getInstance(): AgenticToolRegistry {
    if (!AgenticToolRegistry.instance) {
      AgenticToolRegistry.instance = new AgenticToolRegistry();
    }
    return AgenticToolRegistry.instance;
  }

  /**
   * 📋 Register all available tools
   */
  private registerAllTools() {
    // KNOWLEDGE & RESEARCH TOOLS
    this.registerTool({
      name: 'search_knowledge_base',
      description: 'Search knowledge base for templates, legal research, prior work, and relevant documents',
      category: 'knowledge',
      parameters: {
        query: { type: 'string', description: 'Search query (e.g., "wrongful termination demand letter")', required: true },
        limit: { type: 'number', description: 'Maximum results to return', required: false }
      },
      execute: this.searchKnowledgeBase.bind(this)
    });

    this.registerTool({
      name: 'find_template',
      description: 'Find document template by type and optional jurisdiction',
      category: 'knowledge',
      parameters: {
        docType: { type: 'string', description: 'Document type (e.g., "demand_letter", "petition", "contract")', required: true },
        jurisdiction: { type: 'string', description: 'Legal jurisdiction (e.g., "california", "federal")', required: false }
      },
      execute: this.findTemplate.bind(this)
    });

    this.registerTool({
      name: 'search_legal_codes',
      description: 'Query legal code databases for citations and regulations',
      category: 'research',
      parameters: {
        query: { type: 'string', description: 'Legal search query', required: true },
        jurisdiction: { type: 'string', description: 'Jurisdiction (e.g., "california", "federal")', required: false }
      },
      execute: this.searchLegalCodes.bind(this)
    });

    this.registerTool({
      name: 'get_historical_context',
      description: 'Find similar prior work and successful patterns',
      category: 'knowledge',
      parameters: {
        taskType: { type: 'string', description: 'Type of task (e.g., "wrongful_termination", "contract_review")', required: true },
        userId: { type: 'string', description: 'User ID for personalized history', required: true }
      },
      execute: this.getHistoricalContext.bind(this)
    });

    // 🏛️ SOVEREIGN WORKSPACE & LOCAL DRIVE TOOLS
    this.registerTool({
      name: 'search_workspace_files',
      description: 'Search attached drives and local workspace for conformed case law, briefs, templates, and files',
      category: 'knowledge',
      parameters: {
        query: { type: 'string', description: 'Search term or keywords (e.g. "Granado apportionment", "Bland", "MPN forfeiture")', required: true },
        limit: { type: 'number', description: 'Maximum results to return', required: false }
      },
      execute: this.searchWorkspaceFiles.bind(this)
    });

    this.registerTool({
      name: 'read_workspace_document',
      description: 'Read the full verbatim text of any workspace file or conformed brief by path or file name',
      category: 'knowledge',
      parameters: {
        path: { type: 'string', description: 'File path or exact file name to read', required: true }
      },
      execute: this.readWorkspaceDocument.bind(this)
    });

    this.registerTool({
      name: 'search_clause_bank',
      description: 'Search the conformed CLAUSE_BANK for pre-approved appellate arguments and statutory quotes',
      category: 'knowledge',
      parameters: {
        query: { type: 'string', description: 'Legal concept or case name (e.g. "medical apportionment", "notice pleading", "bland")', required: true },
        limit: { type: 'number', description: 'Maximum clauses to return', required: false }
      },
      execute: this.searchClauseBank.bind(this)
    });

    // CREATION & MODIFICATION TOOLS
    this.registerTool({
      name: 'create_canvas_document',
      description: 'Create a new canvas document with title and content',
      category: 'creation',
      parameters: {
        title: { type: 'string', description: 'Document title', required: true },
        content: { type: 'string', description: 'Document content (complete, production-ready)', required: true },
        metadata: { type: 'object', description: 'Additional metadata (type, tags, etc.)', required: false }
      },
      execute: this.createCanvasDocument.bind(this)
    });

    this.registerTool({
      name: 'generate_from_template',
      description: 'Generate document from template with variable substitution',
      category: 'creation',
      parameters: {
        templateId: { type: 'string', description: 'Template ID from knowledge base', required: true },
        variables: { type: 'object', description: 'Variables to inject into template', required: true }
      },
      execute: this.generateFromTemplate.bind(this)
    });

    this.registerTool({
      name: 'validate_document',
      description: 'Validate document completeness and quality',
      category: 'system',
      parameters: {
        content: { type: 'string', description: 'Document content to validate', required: true },
        docType: { type: 'string', description: 'Expected document type for validation rules', required: true }
      },
      execute: this.validateDocument.bind(this)
    });

    // TASK CREATION TOOL - Creates real tasks in Supabase
    this.registerTool({
      name: 'create_task',
      description: 'Create a new task with title, description, and optional due date',
      category: 'creation',
      parameters: {
        title: { type: 'string', description: 'Task title', required: true },
        description: { type: 'string', description: 'Task description', required: false },
        dueDate: { type: 'string', description: 'Due date (ISO format)', required: false },
        priority: { type: 'string', description: 'Priority: low, medium, high, urgent', required: false }
      },
      execute: this.createTask.bind(this)
    });

    this.registerTool({
      name: 'fetch_market_intelligence',
      description: 'Fetch real-time market data, technical indicators, and sentiment for a ticker',
      category: 'research',
      parameters: {
        symbol: { type: 'string', description: 'Ticker symbol (e.g., NVDA, BTC)', required: true },
        timeframe: { type: 'string', description: 'Timeframe: 1m, 5m, 1h, 1d', required: false }
      },
      execute: this.fetchMarketIntelligence.bind(this)
    });

    // 🧬 BIO-INTELLIGENCE TOOLS
    this.registerTool({
      name: 'research_therapeutics',
      description: 'Perform real-time literature review for medical treatments, cures, and gene therapies using PubMed.',
      category: 'research',
      parameters: {
        query: { type: 'string', description: 'Search query (e.g. "LMNA CRISPR cure")', required: true }
      },
      execute: async (params) => {
        const results = await PubMedService.performLiteratureReview(params.query);
        return { 
          success: true, 
          data: results, 
          metadata: { type: 'literature_review' } 
        };
      }
    });

    this.registerTool({
      name: 'run_cure_simulation',
      description: 'Run a predictive molecular simulation for a specific gene mutation and therapy modality.',
      category: 'research',
      parameters: {
        gene: { type: 'string', description: 'Gene symbol', required: true },
        mutation: { type: 'string', description: 'Mutation details', required: true },
        therapy: { type: 'string', description: 'Type: CRISPR, ASO, SmallMolecule, GeneTherapy', required: true }
      },
      execute: async (params) => {
        const result = await TherapySimulationService.runSimulation(params.gene, params.mutation, params.therapy as any);
        return { 
          success: true, 
          data: result, 
          metadata: { type: 'simulation_lab' } 
        };
      }
    });

    // 💰 FINANCE HUB TOOLS
    this.registerTool({
      name: 'get_finance_hub_data',
      description: 'Access data from the Elite Finance/Central Finance Hub, including budget recommendations and insights.',
      category: 'research',
      parameters: {
        data_type: { type: 'string', description: 'Type: budget, insights, market, portfolio', required: true },
        params: { type: 'object', description: 'Optional parameters', required: false }
      },
      execute: this.getFinanceHubData.bind(this)
    });

    this.registerTool({
      name: 'fetch_market_data',
      description: 'Alias for fetch_market_intelligence used by Trading Agent',
      category: 'research',
      parameters: {
        ticker: { type: 'string', description: 'Ticker symbol', required: true },
        args: { type: 'object', description: 'Additional arguments', required: false }
      },
      execute: async (params) => this.fetchMarketIntelligence({ 
        symbol: params.ticker, 
        timeframe: params.args?.timeframe 
      })
    });

    // ==================== AGENTIC TOOLS (Calendar/Email/Canvas) ====================

    // 📅 Schedule Event - Uses CalendarAgent
    this.registerTool({
      name: 'schedule_event',
      description: 'Schedule a new calendar event with title, time, and optional attendees',
      category: 'creation',
      parameters: {
        title: { type: 'string', description: 'Event title', required: true },
        startTime: { type: 'string', description: 'Start time (ISO format or natural language)', required: true },
        endTime: { type: 'string', description: 'End time (ISO format)', required: false },
        attendees: { type: 'array', description: 'List of attendee emails', required: false },
        description: { type: 'string', description: 'Event description', required: false }
      },
      execute: this.scheduleEvent.bind(this)
    });

    // 📅 Get Calendar - View calendar events
    this.registerTool({
      name: 'get_calendar',
      description: 'Get calendar events for a time period (today, this week, specific date range)',
      category: 'knowledge',
      parameters: {
        startDate: { type: 'string', description: 'Start date (ISO format or "today")', required: false },
        endDate: { type: 'string', description: 'End date (ISO format)', required: false },
        period: { type: 'string', description: 'Period: today, this_week, this_month', required: false }
      },
      execute: this.getCalendar.bind(this)
    });

    // 📧 Read Emails - Uses EmailAgent
    this.registerTool({
      name: 'read_emails',
      description: 'Read emails from inbox or specified folder with optional filtering',
      category: 'knowledge',
      parameters: {
        folder: { type: 'string', description: 'Folder: INBOX, SENT, DRAFT, etc.', required: false },
        query: { type: 'string', description: 'Search query to filter emails', required: false },
        maxResults: { type: 'number', description: 'Maximum emails to return', required: false }
      },
      execute: this.readEmails.bind(this)
    });

    // 🤖 Auto Calendar - Create events from email content
    this.registerTool({
      name: 'auto_calendar',
      description: 'Automatically extract events from email content and create calendar entries',
      category: 'creation',
      parameters: {
        emailId: { type: 'string', description: 'Email ID to process', required: false },
        emailContent: { type: 'string', description: 'Raw email content to analyze', required: false }
      },
      execute: this.autoCalendar.bind(this)
    });

    // 📝 Update Canvas - Surgical document edits
    this.registerTool({
      name: 'update_canvas',
      description: 'Apply surgical edit to a canvas document (find and replace, insert, delete)',
      category: 'modification',
      parameters: {
        canvasId: { type: 'string', description: 'Canvas document ID', required: true },
        operation: { type: 'string', description: 'Operation: replace, insert, delete', required: true },
        target: { type: 'string', description: 'Text to find or line number', required: true },
        replacement: { type: 'string', description: 'Replacement text (for replace/insert)', required: false }
      },
      execute: this.updateCanvas.bind(this)
    });

    // 📊 Analyze Email - Industry-specific processing
    this.registerTool({
      name: 'analyze_email',
      description: 'Analyze email for actionable items, meetings, deadlines, or industry-specific processing',
      category: 'research',
      parameters: {
        emailId: { type: 'string', description: 'Email ID to analyze', required: false },
        emailContent: { type: 'string', description: 'Email content to analyze', required: false },
        analysisType: { type: 'string', description: 'Type: actionable_items, meetings, deadlines, sentiment', required: false }
      },
      execute: this.analyzeEmail.bind(this)
    });

    // 🖥️ UI CONTROL - The "Hands" of the agent
    this.registerTool({
      name: 'open_panel',
      description: 'Open a specific UI panel (canvas, browser, email, ai-drive)',
      category: 'system',
      parameters: {
        panel: { type: 'string', description: 'Panel name: canvas, browser, email, ai-drive, chat', required: true }
      },
      execute: this.openPanel.bind(this)
    });

    // ==================== WORKSPACE MANAGEMENT TOOLS (Antigravity-style) ====================

    // 📁 Create Folder - Autonomous folder creation in AI Drive
    this.registerTool({
      name: 'create_folder',
      description: 'Create a new folder in AI Drive for organizing documents',
      category: 'creation',
      parameters: {
        name: { type: 'string', description: 'Folder name', required: true },
        parentPath: { type: 'string', description: 'Parent folder path or ID (null for root)', required: false },
        description: { type: 'string', description: 'Folder description/purpose', required: false }
      },
      execute: this.createFolder.bind(this)
    });

    // 📦 Move Document - Autonomous document organization
    this.registerTool({
      name: 'move_document',
      description: 'Move a document to a different folder in AI Drive',
      category: 'modification',
      parameters: {
        documentId: { type: 'string', description: 'Document ID to move', required: true },
        targetFolderId: { type: 'string', description: 'Target folder ID', required: true }
      },
      execute: this.moveDocument.bind(this)
    });

    // 🗑️ Delete Artifact - Clean up documents and folders
    this.registerTool({
      name: 'delete_artifact',
      description: 'Delete a document or folder from AI Drive or Knowledge Base',
      category: 'modification',
      parameters: {
        artifactId: { type: 'string', description: 'ID of the document or folder to delete', required: true },
        type: { type: 'string', description: 'Type: document, folder, or artifact', required: true }
      },
      execute: this.deleteArtifact.bind(this)
    });

    // 🌐 Web Search - The "Eyes" of the agent
    this.registerTool({
      name: 'search_web',
      description: 'Search the web for real-time information (Simulated for Demo)',
      category: 'research',
      parameters: {
        query: { type: 'string', description: 'Search query', required: true },
        type: { type: 'string', description: 'Type: general, news, academic', required: false }
      },
      execute: this.searchWeb.bind(this)
    });

    // 🌍 Navigate Browser - Open browser panel and navigate to a URL
    this.registerTool({
      name: 'navigate_browser',
      description: 'Open the integrated browser panel and navigate to a specific URL. The user will see the page rendered in the browser panel.',
      category: 'system',
      parameters: {
        url: { type: 'string', description: 'Full URL to navigate to (e.g., "https://www.google.com/search?q=workers+comp")', required: true },
        compatibilityMode: { type: 'boolean', description: 'Use CORS proxy for sites that block iframes (default: true)', required: false }
      },
      execute: this.navigateBrowser.bind(this)
    });

    // 📖 Fetch Webpage - Fetch and read a webpage's text content
    this.registerTool({
      name: 'fetch_webpage',
      description: 'Fetch a webpage via CORS proxy and return its text content. Use this to READ a webpage so you can analyze, summarize, or extract information from it.',
      category: 'research',
      parameters: {
        url: { type: 'string', description: 'URL to fetch content from', required: true },
        maxLength: { type: 'number', description: 'Maximum characters to return (default: 5000)', required: false }
      },
      execute: this.fetchWebpage.bind(this)
    });

    // ==================== CORTEX BRIDGE (Local Earth Layer) ====================

    // 🛰️ Invoke Cortex Skill - Bridges to Earth IPC or local SkillBridge
    this.registerTool({
      name: 'invoke_cortex_skill',
      description: 'Invoke a local Cortex skill via Earth IPC or SkillBridge',
      category: 'system',
      parameters: {
        skillId: { type: 'string', description: 'Skill/node ID to invoke (e.g., "main")', required: true },
        command: { type: 'string', description: 'Command to execute on the skill', required: true },
        args: { type: 'object', description: 'Arguments to pass to the skill', required: false }
      },
      execute: this.invokeCortexSkill.bind(this)
    });

    // ==================== 🐍 PYTHON MCP TOOLS (The "Hands") ====================

    // 🕵️ GENIE CRAWLER
    this.registerTool({
      name: 'run_universal_crawler',
      description: 'Trigger the Python file system crawler to map Doctors and Cases',
      category: 'system',
      parameters: {
        rootPath: { type: 'string', description: 'Optional root path to scan', required: false }
      },
      execute: async (params) => {
        const { McpExecutor } = await import('../mcp/McpExecutor');
        return McpExecutor.execute('genie_crawler', params);
      }
    });

    // 🩺 VERBATIM ENGINE
    this.registerTool({
      name: 'generate_verbatim_document',
      description: 'Generate a legal/medical document using the Python Fact-Swapping Engine',
      category: 'creation',
      parameters: {
        templateId: { type: 'string', description: 'ID of the verbatim template', required: true },
        profileData: { type: 'object', description: 'Applicant profile data for swapping', required: true }
      },
      execute: async (params) => {
        const { McpExecutor } = await import('../mcp/McpExecutor');
        return McpExecutor.execute('verbatim_engine', params);
      }
    });

    // ⚖️ MEDCARE SYSTEM TOOLS (Legal Domain)
    this.registerTool({
      name: 'medcare_list_cases',
      description: 'Retrieve all cases from the Medcare Elite Law backend.',
      category: 'knowledge',
      parameters: {
        showDeleted: { type: 'boolean', description: 'Whether to include archived/deleted cases', required: false }
      },
      execute: async (params) => {
        const { McpExecutor } = await import('../mcp/McpExecutor');
        return McpExecutor.execute('list_cases', params, 'law');
      }
    });

    this.registerTool({
      name: 'medcare_get_case',
      description: 'Get deep details for a Medcare case, including all linked documents.',
      category: 'knowledge',
      parameters: {
        id: { type: 'string', description: 'The unique Medcare Case ID', required: true }
      },
      execute: async (params) => {
        const { McpExecutor } = await import('../mcp/McpExecutor');
        return McpExecutor.execute('get_case_details', params, 'law');
      }
    });

    this.registerTool({
      name: 'medcare_legal_search',
      description: 'Search professional legal documents and internal Medcare knowledge base.',
      category: 'research',
      parameters: {
        query: { type: 'string', description: 'The legal search query', required: true }
      },
      execute: async (params) => {
        const { McpExecutor } = await import('../mcp/McpExecutor');
        return McpExecutor.execute('search_legal_docs', params, 'law');
      }
    });

    console.log('🛠️ ToolRegistry: Registered', this.tools.size, 'tools');

  }

  /**
   * 🔧 Register a single tool
   */
  private registerTool(tool: Tool) {
    this.tools.set(tool.name, tool);
  }

  /**
   * 🎯 Get tool by name
   */
  getTool(name: string): Tool | undefined {
    const coreTool = this.tools.get(name);
    if (coreTool) return coreTool;

    // Search in skillStack
    const gpackTools = skillStack.getAllTools();
    const gt = gpackTools.find(t => t.qualified_name === name || t.name === name);
    if (gt) {
      return {
        name: gt.qualified_name || gt.name,
        description: gt.description,
        category: 'creation',
        parameters: {
          params: { type: 'object', description: 'Arguments for the tool', required: false }
        },
        execute: async (params: any) => {
          const { McpExecutor } = await import('../mcp/McpExecutor');
          return McpExecutor.execute(gt.qualified_name || gt.name, params);
        }
      };
    }
    return undefined;
  }

  /**
   * 📋 Get all tools (for AI to choose from)
   */
  getAllTools(): Tool[] {
    const coreTools = Array.from(this.tools.values());
    const gpackTools = skillStack.getAllTools().map(gt => {
      return {
        name: gt.qualified_name || gt.name,
        description: gt.description,
        category: 'creation' as const,
        parameters: {
          params: { type: 'object', description: 'Arguments for the tool', required: false }
        },
        execute: async (params: any) => {
          const { McpExecutor } = await import('../mcp/McpExecutor');
          return McpExecutor.execute(gt.qualified_name || gt.name, params);
        }
      };
    });
    return [...coreTools, ...gpackTools];
  }

  /**
   * 📋 Get tools by category
   */
  getToolsByCategory(category: Tool['category']): Tool[] {
    return this.getAllTools().filter(t => t.category === category);
  }

  /**
   * ⚡ Execute a tool by name
   */
  async executeTool(name: string, params: Record<string, any>): Promise<ToolResult> {
    const tool = this.getTool(name);
    if (!tool) {
      return { success: false, error: `Tool '${name}' not found` };
    }

    try {
      console.log(`🛠️ Executing tool: ${name}`, params);
      const result = await tool.execute(params);
      console.log(`✅ Tool '${name}' executed:`, result.success ? 'SUCCESS' : 'FAILED');
      return result;
    } catch (error) {
      console.error(`❌ Tool '${name}' error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ==================== TOOL IMPLEMENTATIONS ====================

  /**
   * 🔍 Search Knowledge Base
   */
  /**
   * 🔍 Search Knowledge Base (with Sovereign Workspace Fallback)
   */
  private async searchKnowledgeBase(params: { query: string; limit?: number }): Promise<ToolResult> {
    try {
      const queryStr = `%${params.query}%`;
      const { data, error } = await supabase
        .from('kb_documents')
        .select('*')
        .or(`content.ilike.${queryStr},title.ilike.${queryStr}`)
        .limit(params.limit || 10);

      if (!error && data && data.length > 0) {
        return {
          success: true,
          data: data,
          confidence: 0.9,
          metadata: { resultsCount: data.length, query: params.query }
        };
      }
    } catch {
      // Fall through to sovereign workspace search
    }

    // Sovereign fallback: search local attached drives and workspace
    return this.searchWorkspaceFiles(params);
  }

  /**
   * 📂 Search Workspace Files & Mounted Drives
   */
  private async searchWorkspaceFiles(params: { query: string; limit?: number }): Promise<ToolResult> {
    try {
      const { useAttachedDriveStore } = await import('../../store/attachedDriveStore');
      const driveStore = useAttachedDriveStore.getState();
      const drives = driveStore.drives || [];
      const limit = params.limit || 5;

      const rawQuery = (params.query || '').toLowerCase();
      const tokens = rawQuery.split(/[\s,_\-./]+/).filter(t => t.length > 2);

      const scoredNodes: Array<{ node: any; score: number; driveName: string }> = [];

      const searchNodes = (nodes: any[], driveName: string) => {
        if (!nodes) return;
        for (const n of nodes) {
          if (!n.isFolder) {
            const nLower = (n.name || '').toLowerCase();
            const pLower = (n.path || '').toLowerCase();
            let score = 0;
            if (rawQuery && (nLower.includes(rawQuery) || pLower.includes(rawQuery))) {
              score += 10;
            }
            for (const token of tokens) {
              if (nLower.includes(token)) score += 3;
              else if (pLower.includes(token)) score += 1;
            }
            if (score > 0) {
              scoredNodes.push({ node: n, score, driveName });
            }
          }
          if (n.children && n.children.length > 0) searchNodes(n.children, driveName);
        }
      };

      for (const d of drives) {
        searchNodes(d.items, d.name);
      }

      scoredNodes.sort((a, b) => b.score - a.score);
      const topMatches = scoredNodes.slice(0, limit);

      const results = await Promise.all(
        topMatches.map(async ({ node, driveName, score }) => {
          let snippet = '';
          try {
            const content = await driveStore.readFileContent(node);
            if (content && !content.startsWith('[Preview:')) {
              snippet = content.slice(0, 3000);
            }
          } catch {}
          return {
            name: node.name,
            path: node.path,
            drive: driveName,
            score,
            snippet
          };
        })
      );

      return {
        success: results.length > 0,
        data: results,
        confidence: results.length > 0 ? 0.95 : 0.2,
        metadata: { query: params.query, count: results.length }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Workspace file search failed'
      };
    }
  }

  /**
   * 📄 Read Workspace Document (Verbatim conformed text)
   */
  private async readWorkspaceDocument(params: { path: string }): Promise<ToolResult> {
    try {
      const bridge = (window as any).electronBridge;
      if (bridge?.fs?.readFile) {
        const res = await bridge.fs.readFile({ path: params.path });
        if (res && res.success && typeof res.content === 'string') {
          return {
            success: true,
            data: { path: params.path, content: res.content },
            metadata: { length: res.content.length }
          };
        }
      }

      // Check attachedDriveStore
      const { useAttachedDriveStore } = await import('../../store/attachedDriveStore');
      const driveStore = useAttachedDriveStore.getState();
      let matchedNode: any = null;
      const searchForNode = (nodes: any[]) => {
        if (!nodes || matchedNode) return;
        for (const n of nodes) {
          if (n.path === params.path || n.name === params.path || n.name === params.path.split(/[\\/]/).pop()) {
            matchedNode = n;
            return;
          }
          if (n.children) searchForNode(n.children);
        }
      };
      for (const d of driveStore.drives) searchForNode(d.items);

      if (matchedNode) {
        const content = await driveStore.readFileContent(matchedNode);
        return {
          success: true,
          data: { path: matchedNode.path || params.path, content },
          metadata: { length: content?.length || 0 }
        };
      }

      return { success: false, error: `Document not found at path: ${params.path}` };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read workspace document'
      };
    }
  }

  /**
   * 🏛️ Search Clause Bank (Pre-approved legal authorities & holdings)
   */
  private async searchClauseBank(params: { query: string; limit?: number }): Promise<ToolResult> {
    return this.searchWorkspaceFiles({
      query: `CLAUSE_BANK ${params.query}`,
      limit: params.limit || 5
    });
  }

  /**
   * 📋 Find Template
   */
  private async findTemplate(params: { docType: string; jurisdiction?: string }): Promise<ToolResult> {
    try {
      let query = supabase
        .from('document_templates')
        .select('*')
        .eq('document_type', params.docType);

      if (params.jurisdiction) {
        query = query.ilike('jurisdiction', params.jurisdiction);
      }

      const { data, error } = await query.limit(1);

      if (error) throw error;

      return {
        success: data && data.length > 0,
        data: data?.[0],
        confidence: data && data.length > 0 ? 0.95 : 0.2,
        metadata: { docType: params.docType, jurisdiction: params.jurisdiction }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Template search failed'
      };
    }
  }

  /**
   * ⚖️ Search Legal Codes (KB integration)
   */
  private async searchLegalCodes(params: { query: string; jurisdiction?: string }): Promise<ToolResult> {
    try {
      // Search KB for legal code documents
      const queryStr = `%${params.query}%`;
      let query = supabase
        .from('kb_documents')
        .select('*')
        .or(`content.ilike.${queryStr},title.ilike.${queryStr}`)
        .contains('tags', ['legal_code', 'statute', 'regulation']);

      if (params.jurisdiction) {
        query = query.contains('tags', [params.jurisdiction.toLowerCase()]);
      }

      const { data, error } = await query.limit(5);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        confidence: data && data.length > 0 ? 0.85 : 0.4,
        metadata: { query: params.query, jurisdiction: params.jurisdiction, resultsCount: data?.length || 0 }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Legal code search failed'
      };
    }
  }

  /**
   * 📚 Get Historical Context
   */
  private async getHistoricalContext(params: { taskType: string; userId: string }): Promise<ToolResult> {
    try {
      // Search for similar tasks in orchestration history
      const { data, error } = await supabase
        .from('orchestration_manifests')
        .select('*')
        .eq('user_id', params.userId)
        .contains('metadata', { taskType: params.taskType })
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        confidence: data && data.length > 0 ? 0.8 : 0.5,
        metadata: { taskType: params.taskType, historicalCount: data?.length || 0 }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Historical search failed'
      };
    }
  }

  /**
   * 🎨 Create Canvas Document - REAL EXECUTION
   * Inserts canvas into Supabase canvases table
   */
  private async createCanvasDocument(params: { title: string; content: string; metadata?: any }): Promise<ToolResult> {
    try {
      // 🎯 MANDATORY: Sanitize content before it reaches the Canvas
      // Strip all AI reasoning tags - Canvas is for WORK PRODUCT ONLY
      let sanitizedContent = (params.content || '')
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/<final>|<\/final>/gi, '')
        .trim();

      // If nothing meaningful remains after stripping, return early
      if (!sanitizedContent) {
        return { success: false, error: 'No work product content after sanitization' };
      }

      // Guard against echoing the user's raw prompt as a canvas deliverable
      if (params.title && sanitizedContent === params.title && sanitizedContent.length < 250) {
        return { success: false, error: 'Prompt echo suppressed from canvas' };
      }

      // Get authenticated user or sovereign fallback
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id || 'sovereign-user';

      // Infer canvas type from content
      const canvasType = this.inferCanvasType(sanitizedContent);
      // FAILED TEST FIX: Use proper UUID for database compatibility
      const canvasId = uuidv4();


      // 🧠 PROFESSIONAL NAMING HEURISTIC
      let finalTitle = params.title || 'Untitled Document';
      if (finalTitle === 'Untitled Document' || finalTitle.includes('Date.now()')) {
        try {
          const { getOrchestrationManifest } = await import('./OrchestrationManifest');
          const manifest = getOrchestrationManifest(user.id);
          const goal = manifest.getPlan()?.goal;
          if (goal) {
            // Heuristic: If we have a goal like "Draft Penalty Petition", use it as a base
            finalTitle = goal.length > 50 ? goal.substring(0, 47) + '...' : goal;
            console.log(`🎨 ToolRegistry: Generated professional title from goal: ${finalTitle}`);
          }
        } catch (e) {
          // Fallback to default
        }
      }

      // 🔄 DISPATCH EVENT TO UI: Let the frontend handle the state update
      // This bridges the gap between the detached Agent system and the React UI
      const event = new CustomEvent('genieflow:create-canvas', {
        detail: {
          id: canvasId,
          title: finalTitle,
          content: sanitizedContent,
          type: canvasType,
          metadata: params.metadata || {},
          user_id: currentUserId
        }
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(event);
        console.log('📡 Dispatched genieflow:create-canvas event:', canvasId);

        try {
          const rawV2 = localStorage.getItem('genieflow_canvas_state_v2');
          let canvasesList: any[] = [];
          if (rawV2) {
            try {
              const parsed = JSON.parse(rawV2);
              if (Array.isArray(parsed.canvases)) canvasesList = parsed.canvases;
            } catch (_) {}
          }
          canvasesList = canvasesList.filter((c: any) => c.id !== canvasId);
          canvasesList.unshift({
            id: canvasId,
            title: finalTitle,
            type: canvasType,
            content: sanitizedContent,
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            metadata: params.metadata || {}
          });
          localStorage.setItem('genieflow_canvas_state_v2', JSON.stringify({
            canvases: canvasesList,
            activeCanvasId: canvasId,
            timestamp: new Date().toISOString(),
            version: '2.1'
          }));
          localStorage.setItem('genieflow_active_canvas', canvasId);
        } catch (lsErr) {
          console.warn('⚠️ Could not update localStorage canvas state:', lsErr);
        }
      } else {
        console.warn('⚠️ Window not defined - cannot dispatch canvas event');
      }

      // 💾 PERSISTENCE: Save to database so other tools (move, list) can find it
      // Using upsert to be safe, though ID is random
      const { error: dbError } = await supabase
        .from('ai_drive_files')
        .insert({
          id: canvasId,
          user_id: currentUserId,
          name: finalTitle,
          is_folder: false,
          parent_id: null, // Root by default
          mime_type: 'text/markdown', // Required field
          size: sanitizedContent.length, // Correct column name is 'size'
          content_preview: sanitizedContent, // Save full content for HQ viewer
          metadata: {
            type: canvasType,
            ...params.metadata
          }
        });

      if (dbError) {
        console.warn('⚠️ Failed to persist canvas to ai_drive_files:', dbError.message);
        // We continue because the UI event might have succeeded
      } else {
        console.log('✅ Persisted canvas to ai_drive_files:', canvasId);
      }

      // Also register in manifest for orchestration tracking
      // We import it dynamically to avoid circular dependencies if any
      try {
        const { getOrchestrationManifest } = await import('./OrchestrationManifest');
        const manifest = getOrchestrationManifest(currentUserId);
        manifest.registerCanvas({
          id: canvasId,
          title: finalTitle,
          type: canvasType,
          contentLength: sanitizedContent.length
        });

      } catch (e) {
        console.warn('⚠️ Failed to register in manifest (non-critical):', e);
      }

      // 📂 Write to local disk in AI_GENERATED_DOCS for file system visibility
      let localDiskPath = '';
      try {
        const { skillBridge } = await import('../../cortex/SkillBridge');
        const cleanName = finalTitle
          .replace(/[\r\n\t]+/g, ' ')
          .replace(/^[,\s;.-]+|[,\s;.-]+$/g, '')
          .replace(/[/\\?%*:|"<>]/g, '-')
          .trim() || 'Generated_Legal_Document';
        const targetPath = `AI_GENERATED_DOCS/${cleanName}.md`;
        await skillBridge.nodeInvoke('main', 'fs.write_file', {
          path: targetPath,
          content: sanitizedContent
        });
        localDiskPath = targetPath;
        console.log('💾 Written local document to:', targetPath);
      } catch (_diskErr) {
        // Fallback for browser-only mode
      }

      return {
        success: true,
        data: { id: canvasId, title: finalTitle, localPath: localDiskPath },
        confidence: 1.0,
        metadata: { action: 'canvas_created', canvasId: canvasId, title: finalTitle, localPath: localDiskPath }
      };
    } catch (error) {
      console.error('❌ Canvas creation tool error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Canvas creation failed'
      };
    }
  }

  /**
   * Infer canvas type from content keywords
   */
  private inferCanvasType(content: string): string {
    const lower = content.toLowerCase();
    if (lower.includes('petition') || lower.includes('plaintiff') || lower.includes('court')) return 'legal';
    if (lower.includes('patient') || lower.includes('diagnosis') || lower.includes('medical')) return 'medical';
    if (lower.includes('contract') || lower.includes('agreement') || lower.includes('proposal')) return 'business';
    if (lower.includes('function') || lower.includes('code') || lower.includes('api')) return 'technical';
    return 'general';
  }

  /**
   * ✅ Create Task - REAL EXECUTION
   * Inserts task into Supabase tasks table
   */
  private async createTask(params: { title: string; description?: string; dueDate?: string; priority?: string }): Promise<ToolResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated - cannot create task' };
      }

      // 🧠 PROFESSIONAL NAMING HEURISTIC for Tasks
      let finalTitle = params.title;
      if (!finalTitle || finalTitle.toLowerCase().includes('task')) {
        try {
          const { getOrchestrationManifest } = await import('./OrchestrationManifest');
          const manifest = getOrchestrationManifest(user.id);
          const goal = manifest.getPlan()?.goal;
          if (goal && (!finalTitle || finalTitle.length < 10)) {
            finalTitle = `${finalTitle || 'Task'} for ${goal.substring(0, 30)}...`;
          }
        } catch (e) { }
      }

      // Map priority string or number to integer (1-5)
      const priorityMap: Record<string, number> = {
        'low': 1,
        'medium': 2,
        'high': 3,
        'urgent': 4,
        'critical': 5
      };

      let priorityValue = 2; // Default to medium

      if (typeof params.priority === 'number') {
        priorityValue = params.priority;
      } else if (typeof params.priority === 'string') {
        priorityValue = priorityMap[params.priority.toLowerCase()] || 2;
      }

      const taskData = {
        title: params.title,
        description: params.description || '',
        // due_date: params.dueDate || null, // Column does not exist in master_tasks
        priority: priorityValue,
        status: 'queued', // Use 'queued' as default to match schema
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        context: {
          dueDate: params.dueDate,
          created_by: 'agentic_tool'
        }
      };

      // INSERT INTO SUPABASE - This is the REAL execution
      const { data, error } = await supabase
        .from('master_tasks')
        .insert(taskData)
        .select()
        .single();

      if (error) {
        console.error('❌ Task creation failed:', error);
        throw error;
      }

      console.log('✅ Task ACTUALLY created in Supabase:', data.id);

      return {
        success: true,
        data: data,
        confidence: 1.0,
        metadata: { action: 'task_created', taskId: data.id, title: data.title }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Task creation failed'
      };
    }
  }

  /**
   * 📝 Generate from Template
   */
  private async generateFromTemplate(params: { templateId: string; variables: Record<string, any> }): Promise<ToolResult> {
    try {
      // Fetch template
      const { data: template, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('id', params.templateId)
        .single();

      if (error) throw error;
      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      // Simple variable substitution
      let content = template.content;
      for (const [key, value] of Object.entries(params.variables)) {
        const regex = new RegExp(`\\[${key}\\]|\\{\\{${key}\\}\\}`, 'gi');
        content = content.replace(regex, String(value));
      }

      return {
        success: true,
        data: { content, template },
        confidence: 0.95,
        metadata: { templateId: params.templateId, variablesApplied: Object.keys(params.variables).length }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Template generation failed'
      };
    }
  }

  /**
   * ✅ Validate Document
   */
  private async validateDocument(params: { content: string; docType: string }): Promise<ToolResult> {
    const validationRules = {
      demand_letter: ['introduction', 'facts', 'demand', 'deadline'],
      petition: ['caption', 'introduction', 'statement of facts', 'claims', 'prayer', 'verification'],
      contract: ['parties', 'recitals', 'terms', 'signatures'],
      settlement_agreement: ['parties', 'recitals', 'terms', 'release', 'signatures']
    };

    const requiredSections = validationRules[params.docType as keyof typeof validationRules] || [];
    const missingSections = requiredSections.filter(section =>
      !new RegExp(section, 'i').test(params.content)
    );

    const isValid = missingSections.length === 0;
    const confidence = isValid ? 1.0 : Math.max(0.3, 1 - (missingSections.length / requiredSections.length));

    return {
      success: true,
      data: {
        isValid,
        missingSections,
        completeness: `${Math.round(confidence * 100)}%`
      },
      confidence,
      metadata: { docType: params.docType, sectionsChecked: requiredSections.length }
    };
  }

  // ==================== AGENTIC TOOL IMPLEMENTATIONS ====================

  /**
   * 📅 Schedule Event - Uses CalendarAgent
   */
  private async scheduleEvent(params: {
    title: string;
    startTime: string;
    endTime?: string;
    attendees?: string[];
    description?: string
  }): Promise<ToolResult> {
    try {
      const calendarAgent = new CalendarAgent();

      const result = await calendarAgent.scheduleEvent({
        title: params.title,
        startTime: new Date(params.startTime),
        endTime: params.endTime ? new Date(params.endTime) : undefined,
        attendees: params.attendees,
        description: params.description
      });

      return {
        success: true,
        data: result,
        confidence: 0.9,
        metadata: { tool: 'schedule_event', title: params.title }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to schedule event'
      };
    }
  }

  /**
   * 📅 Get Calendar - View calendar events
   */
  private async getCalendar(params: {
    startDate?: string;
    endDate?: string;
    period?: string
  }): Promise<ToolResult> {
    try {
      const calendarAgent = new CalendarAgent();

      // Handle period shortcuts
      let start = params.startDate ? new Date(params.startDate) : new Date();
      let end = params.endDate ? new Date(params.endDate) : new Date();

      if (params.period === 'today') {
        start = new Date();
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setHours(23, 59, 59, 999);
      } else if (params.period === 'this_week') {
        start = new Date();
        start.setDate(start.getDate() - start.getDay());
        end = new Date(start);
        end.setDate(end.getDate() + 7);
      } else if (params.period === 'this_month') {
        start = new Date();
        start.setDate(1);
        end = new Date(start);
        end.setMonth(end.getMonth() + 1);
      }

      const result = await calendarAgent.summarizeCalendar({
        startDate: start,
        endDate: end
      });

      return {
        success: true,
        data: result,
        confidence: 0.9,
        metadata: { tool: 'get_calendar', period: params.period || 'custom' }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get calendar'
      };
    }
  }

  /**
   * 📧 Read Emails - Uses EmailAgent
   */
  private async readEmails(params: {
    folder?: string;
    query?: string;
    maxResults?: number
  }): Promise<ToolResult> {
    try {
      const emailAgent = new EmailAgent();

      const result = await emailAgent.getMessages({
        folderId: params.folder || 'INBOX',
        query: params.query,
        maxResults: params.maxResults || 20
      });

      return {
        success: true,
        data: result,
        confidence: 0.9,
        metadata: {
          tool: 'read_emails',
          folder: params.folder || 'INBOX',
          count: result?.messages?.length || 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read emails'
      };
    }
  }

  /**
   * 🤖 Auto Calendar - Create events from email content
   */
  private async autoCalendar(params: {
    emailId?: string;
    emailContent?: string
  }): Promise<ToolResult> {
    try {
      // Get email content if ID provided
      let content = params.emailContent;
      if (params.emailId && !content) {
        const emailAgent = new EmailAgent();
        const email = await emailAgent.getMessage(params.emailId);
        content = email?.body || email?.snippet || '';
      }

      if (!content) {
        return { success: false, error: 'No email content provided' };
      }

      // Use CalendarAgent to extract and create events
      const calendarAgent = new CalendarAgent();
      const result = await calendarAgent.handleEmailAnalysisCommand(content, {});

      return {
        success: true,
        data: result,
        confidence: 0.85,
        metadata: { tool: 'auto_calendar', source: params.emailId ? 'email_id' : 'content' }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to auto-create calendar'
      };
    }
  }

  /**
   * 🖥️ Open UI Panel
   */
  private async openPanel(params: { panel: string }): Promise<ToolResult> {
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('genieflow:open-panel', {
          detail: { panel: params.panel }
        }));
        return {
          success: true,
          data: { panel: params.panel, status: 'opened' },
          confidence: 1.0,
          metadata: { action: 'ui_control', panel: params.panel }
        };
      }
      return { success: false, error: 'Window not defined (server-side?)' };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * 🌐 Web Search (AI-Augmented Cloud Fallback)
   */
  private async searchWeb(params: { query: string; type?: string }): Promise<ToolResult> {
    console.log(`🌐 SEARCHING WEB (Cloud AI Mode): "${params.query}"`);

    try {
      const { AIServiceFactory } = await import('../ai/aiServiceFactory');
      const ai = AIServiceFactory.getInstance();

      const prompt = `You are a SearchIntelligenceAgent. Since the local web-scrapers are offline, use your internal knowledge (up to early 2026) to simulate a high-fidelity web search result for: "${params.query}".
      
      Provide 3-5 realistic search results with titles, snippets, and hypothetical URLs. Focus on accuracy and professional relevance.
      
      Respond in JSON format: { "results": [{ "title": "...", "snippet": "...", "url": "..." }] }`;

      const response = await ai.generateText(prompt);
      const data = JSON.parse(response.replace(/```json|```/g, '').trim());

      return {
        success: true,
        data: { ...data, source: 'ai_simulated_search' },
        confidence: 0.9,
        metadata: { query: params.query, mode: 'cloud_fallback' }
      };
    } catch (error) {
      // Deep Fallback: Static results if AI fails
      return {
        success: true,
        data: {
          results: [{ title: `Results for ${params.query}`, snippet: `Information about ${params.query} is being processed.`, url: '#' }],
          source: 'static_fallback'
        },
        confidence: 0.5
      };
    }
  }

  /**
   * 🌍 Navigate Browser - Open browser panel and navigate to URL
   * Dispatches event to the UI to open the panel and load the page
   */
  private async navigateBrowser(params: { url: string; compatibilityMode?: boolean }): Promise<ToolResult> {
    try {
      let url = params.url;
      // Auto-prefix https if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }

      const useCompat = params.compatibilityMode !== false; // default true

      if (typeof window !== 'undefined') {
        // First open the browser panel
        window.dispatchEvent(new CustomEvent('genieflow:open-panel', {
          detail: { panel: 'browser' }
        }));

        // Then navigate to the URL
        window.dispatchEvent(new CustomEvent('genieflow:navigate-browser', {
          detail: { url, compatibilityMode: useCompat }
        }));

        console.log(`🌍 ToolRegistry: Navigating browser to ${url} (compat: ${useCompat})`);

        return {
          success: true,
          data: { url, compatibilityMode: useCompat, status: 'navigated' },
          confidence: 1.0,
          metadata: { action: 'browser_navigate', url }
        };
      }
      return { success: false, error: 'Window not defined (server-side?)' };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * 📖 Fetch Webpage - Fetch real page content via CORS proxy
   * Returns clean text that the AI can read, analyze, and summarize
   */
  private async fetchWebpage(params: { url: string; maxLength?: number }): Promise<ToolResult> {
    const maxLen = params.maxLength || 5000;
    let url = params.url;

    // Auto-prefix https if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    console.log(`📖 FETCHING WEBPAGE: ${url}`);

    // Try multiple proxy services in order of reliability
    const proxyUrls = [
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    ];

    let html = '';
    let proxyUsed = '';
    let lastError = '';

    for (const proxyUrl of proxyUrls) {
      try {
        console.log(`📖 Trying proxy: ${proxyUrl.split('?')[0]}`);
        const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });

        if (!response.ok) {
          lastError = `HTTP ${response.status}`;
          continue;
        }

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          // allorigins /get returns JSON
          const json = await response.json();
          html = json.contents || '';
        } else {
          html = await response.text();
        }

        proxyUsed = proxyUrl.split('?')[0];
        break;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        console.warn(`⚠️ Proxy failed: ${lastError}`);
      }
    }

    if (!html) {
      return {
        success: false,
        error: `All proxies failed. Last error: ${lastError}`
      };
    }

    try {
      // Strip HTML tags to get clean text
      const cleanText = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[\s\S]*?<\/nav>/gi, '')
        .replace(/<header[\s\S]*?<\/header>/gi, '')
        .replace(/<footer[\s\S]*?<\/footer>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#\d+;/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Extract title from HTML
      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : url;

      const truncatedText = cleanText.length > maxLen
        ? cleanText.substring(0, maxLen) + `\n\n[... truncated at ${maxLen} chars, full page has ${cleanText.length} chars]`
        : cleanText;

      return {
        success: true,
        data: {
          title,
          url,
          content: truncatedText,
          contentLength: cleanText.length,
          truncated: cleanText.length > maxLen
        },
        confidence: 0.95,
        metadata: { url, contentLength: cleanText.length, source: 'cors_proxy', proxy: proxyUsed }
      };
    } catch (error) {
      console.error('❌ Webpage parse failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse webpage'
      };
    }
  }

  /**
   * 💰 Get Finance Hub Data (Bridge to MCP)
   */
  private async getFinanceHubData(params: { data_type: string; params?: any }): Promise<ToolResult> {
    try {
      const { pythonBridgeService } = await import('../bridge/PythonBridgeService');
      const response = await pythonBridgeService.executeTool('get_finance_hub_data', params);
      
      if (response.status === 'success' && response.result.success) {
        return {
          success: true,
          data: response.result.data || response.result,
          confidence: 0.9,
          metadata: { ...response.result.metadata, source: 'MCP Finance Hub' }
        };
      } else {
        throw new Error(response.result?.error || 'Failed to fetch hub data');
      }
    } catch (error) {
      console.error('❌ Finance Hub tool failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Finance Hub bridge failed'
      };
    }
  }

  /**
   * 📊 Fetch Market Intelligence (Bridge to MCP)
   */
  private async fetchMarketIntelligence(params: { symbol: string; timeframe?: string }): Promise<ToolResult> {
    try {
      // Attempt to fetch from hub first
      const hubResult = await this.getFinanceHubData({ 
        data_type: 'market', 
        params: { symbol: params.symbol, timeframe: params.timeframe } 
      });
      
      if (hubResult.success) return hubResult;

      // Fallback to internal simulation (Legacy cloud mode)
      const symbol = params.symbol.toUpperCase();
      const { AIServiceFactory } = await import('../ai/aiServiceFactory');
      const ai = AIServiceFactory.getInstance();
      const prompt = `You are a MarketIntelligenceAgent. The local Polygon API is severed. Use your knowledge of market patterns and latest 2026 trends to simulate a high-fidelity technical analysis for ticker: ${symbol}.
      
      Provide:
      1. Price estimate and recent volatility.
      2. Technical indicators (RSI, Moving Averages).
      3. A "Sovereign Recommendation" based on the analysis.
      
      Respond in JSON format: { "price": "...", "analysis": "...", "recommendation": "..." }`;

      const response = await ai.generateText(prompt);
      const data = JSON.parse(response.replace(/```json|```/g, '').trim());

      return {
        success: true,
        data: { ...data, symbol, mode: 'cloud_ai_simulation' },
        confidence: 0.85,
        metadata: { symbol, timeframe: params.timeframe || '1d' }
      };
    } catch (error) {
      return { success: false, error: 'Market intelligence failed.' };
    }
  }

  /**
   * 📝 Update Canvas - Surgical document edits
   */
  private async updateCanvas(params: {
    canvasId: string;
    operation: string;
    target: string;
    replacement?: string
  }): Promise<ToolResult> {
    try {
      // Fetch current canvas
      const { data: canvas, error: fetchError } = await supabase
        .from('canvas_documents')
        .select('*')
        .eq('id', params.canvasId)
        .single();

      if (fetchError || !canvas) {
        return { success: false, error: 'Canvas not found' };
      }

      let newContent = canvas.content;

      switch (params.operation) {
        case 'replace':
          newContent = newContent.replace(params.target, params.replacement || '');
          break;
        case 'insert':
          // Insert at target line number or after target text
          if (/^\d+$/.test(params.target)) {
            const lines = newContent.split('\n');
            lines.splice(parseInt(params.target), 0, params.replacement || '');
            newContent = lines.join('\n');
          } else {
            newContent = newContent.replace(params.target, params.target + (params.replacement || ''));
          }
          break;
        case 'delete':
          newContent = newContent.replace(params.target, '');
          break;
        default:
          return { success: false, error: 'Invalid operation. Use: replace, insert, or delete' };
      }

      // Update canvas
      const { error: updateError } = await supabase
        .from('canvas_documents')
        .update({ content: newContent, updated_at: new Date().toISOString() })
        .eq('id', params.canvasId);

      if (updateError) throw updateError;
      
      // 🔄 DISPATCH EVENT TO UI: Live Refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('genieflow:update-canvas', {
          detail: { canvasId: params.canvasId }
        }));
        console.log('📡 Dispatched genieflow:update-canvas event:', params.canvasId);
      }

      return {
        success: true,
        data: { canvasId: params.canvasId, operation: params.operation },
        confidence: 0.95,
        metadata: { tool: 'update_canvas', operation: params.operation }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update canvas'
      };
    }
  }

  /**
   * 📊 Analyze Email - Industry-specific processing
   */
  private async analyzeEmail(params: {
    emailId?: string;
    emailContent?: string;
    analysisType?: string
  }): Promise<ToolResult> {
    try {
      // Get email content if ID provided
      let content = params.emailContent;
      if (params.emailId && !content) {
        const emailAgent = new EmailAgent();
        const email = await emailAgent.getMessage(params.emailId);
        content = email?.body || email?.snippet || '';
      }

      if (!content) {
        return { success: false, error: 'No email content provided' };
      }

      // Analyze based on type
      const analysisType = params.analysisType || 'actionable_items';

      // Use CalendarAgent for meeting detection
      if (analysisType === 'meetings') {
        const calendarAgent = new CalendarAgent();
        const result = await calendarAgent.handleEmailAnalysisCommand(content, {});
        return {
          success: true,
          data: result,
          confidence: 0.85,
          metadata: { tool: 'analyze_email', type: 'meetings' }
        };
      }

      // Basic analysis for other types
      const analysis = {
        type: analysisType,
        content_length: content.length,
        has_dates: /\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}/.test(content),
        has_times: /\d{1,2}:\d{2}/.test(content),
        has_urls: /https?:\/\//.test(content),
        urgency_indicators: /urgent|asap|immediately|deadline/i.test(content)
      };

      return {
        success: true,
        data: analysis,
        confidence: 0.8,
        metadata: { tool: 'analyze_email', type: analysisType }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze email'
      };
    }
  }

  // ==================== WORKSPACE MANAGEMENT IMPLEMENTATIONS ====================

  /**
   * 📁 Create Folder - Autonomous folder creation in AI Drive
   */
  private async createFolder(params: {
    name: string;
    parentPath?: string;
    description?: string;
  }): Promise<ToolResult> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Create folder in AI Drive
      const { data, error } = await supabase
        .from('ai_drive_files')
        .insert({
          user_id: user.id,
          name: params.name,
          is_folder: true,
          parent_id: params.parentPath || null,
          mime_type: 'application/x-directory',
          size: 0,
          metadata: {
            description: params.description || `Folder created by AI agent`,
            created_by: 'agentic_tool',
            created_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`📁 Created folder: ${params.name}`);

      return {
        success: true,
        data: {
          folderId: data.id,
          folderName: params.name,
          parentPath: params.parentPath || 'root'
        },
        confidence: 0.98,
        metadata: { tool: 'create_folder', action: 'created' }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create folder'
      };
    }
  }

  /**
   * 📦 Move Document - Autonomous document organization
   */
  private async moveDocument(params: {
    documentId: string;
    targetFolderId: string;
  }): Promise<ToolResult> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Verify document exists and belongs to user
      const { data: doc, error: fetchError } = await supabase
        .from('ai_drive_files')
        .select('*')
        .eq('id', params.documentId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !doc) {
        return { success: false, error: 'Document not found or access denied' };
      }

      // Verify target folder exists
      const { data: folder, error: folderError } = await supabase
        .from('ai_drive_files')
        .select('*')
        .eq('id', params.targetFolderId)
        .eq('is_folder', true)
        .single();

      if (folderError || !folder) {
        return { success: false, error: 'Target folder not found' };
      }

      // Move document
      const { error: updateError } = await supabase
        .from('ai_drive_files')
        .update({
          parent_id: params.targetFolderId,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.documentId);

      if (updateError) throw updateError;

      console.log(`📦 Moved document ${doc.name} to folder ${folder.name}`);

      return {
        success: true,
        data: {
          documentId: params.documentId,
          documentName: doc.name,
          targetFolderId: params.targetFolderId,
          targetFolderName: folder.name
        },
        confidence: 0.95,
        metadata: { tool: 'move_document', action: 'moved' }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to move document'
      };
    }
  }

  /**
   * 📋 List Workspace - Get workspace overview
   */
  private async listWorkspace(params: {
    folderId?: string;
    includeDetails?: boolean;
  }): Promise<ToolResult> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Build query - always select all fields for type safety
      let query = supabase
        .from('ai_drive_files')
        .select('*')
        .eq('user_id', user.id)
        .or('is_trashed.is.null,is_trashed.eq.false');

      // Filter by parent folder
      if (params.folderId) {
        query = query.eq('parent_id', params.folderId);
      } else {
        query = query.is('parent_id', null);
      }

      // Order folders first, then by name
      query = query.order('is_folder', { ascending: false }).order('name');

      const { data, error } = await query;

      if (error) throw error;

      // Format response
      const folders = data?.filter(f => f.is_folder) || [];
      const files = data?.filter(f => !f.is_folder) || [];

      console.log(`📋 Listed workspace: ${folders.length} folders, ${files.length} files`);

      return {
        success: true,
        data: {
          currentFolder: params.folderId || 'root',
          folders: folders.map(f => ({ id: f.id, name: f.name })),
          files: files.map(f => ({
            id: f.id,
            name: f.name,
            type: f.mime_type,
            updated: f.updated_at
          })),
          totalItems: data?.length || 0
        },
        confidence: 0.99,
        metadata: { tool: 'list_workspace', folderId: params.folderId || 'root' }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list workspace'
      };
    }
  }

  // ==================== CORTEX BRIDGE IMPLEMENTATION ====================

  /**
   * 🛰️ Invoke Cortex Skill - Bridges to OpenClaw Gateway
   * Graceful degradation: returns offline result if Gateway isn't running.
   */
  private async invokeCortexSkill(params: {
    skillId: string;
    command: string;
    args?: Record<string, any>;
  }): Promise<ToolResult> {
    try {
      // Lazy import to avoid circular dependencies
      const { skillBridge } = await import('../../cortex/SkillBridge');

      // Check if Earth IPC or gateway is available
      if (!skillBridge.isConnected() && !skillBridge.hasEarth()) {
        console.log('🛰️ Cortex Bridge offline — skill invocation skipped (cloud tools still available)');
        return {
          success: false,
          error: 'Cortex bridge is offline. Earth IPC or local server required.',
          metadata: { offline: true, skillId: params.skillId, command: params.command }
        };
      }

      // Execute via SkillBridge
      const result = await skillBridge.nodeInvoke(
        params.skillId,
        params.command,
        params.args || {}
      );

      return {
        success: true,
        data: result,
        confidence: 0.85,
        metadata: { tool: 'invoke_cortex_skill', skillId: params.skillId, command: params.command }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Cortex skill invocation failed'
      };
    }
  }

  /**
   * 🗑️ Delete Artifact - REAL EXECUTION
   */
  private async deleteArtifact(params: { artifactId: string; type: 'document' | 'folder' | 'artifact' }): Promise<ToolResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'User not authenticated' };

      let table = 'ai_drive_files';
      if (params.type === 'artifact') table = 'kb_documents';

      const { error: dbError } = await supabase
        .from(table)
        .delete()
        .eq('id', params.artifactId);

      if (dbError) throw dbError;

      // Also clean up from manifest
      try {
        const { getOrchestrationManifest } = await import('./OrchestrationManifest');
        const manifest = getOrchestrationManifest(user.id);
        manifest.deleteArtifact(params.artifactId, params.type === 'folder' ? 'canvas' : (params.type as any));
      } catch (e) {
        console.warn('⚠️ Artifact deletion manifest sync failed:', e);
      }

      return {
        success: true,
        data: { id: params.artifactId, deleted: true },
        metadata: { action: 'artifact_deleted', id: params.artifactId }
      };
    } catch (error) {
      console.error('❌ Artifact deletion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Deletion failed'
      };
    }
  }
}

// Export singleton instance
export const agenticToolRegistry = AgenticToolRegistry.getInstance();

// Expose globally for testing (Rule 5: Mandatory Execution Test)
if (typeof window !== 'undefined') {
  (window as any).agenticToolRegistry = agenticToolRegistry;
}
