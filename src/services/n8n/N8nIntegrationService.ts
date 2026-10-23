/**
 * 🔗 N8N Integration Bridge - Connects n8n to GenieFlow's Master Agent Registry
 * 
 * This service integrates n8n workflows seamlessly into your existing agent ecosystem.
 * Follows URENO principles by enhancing without disrupting current functionality.
 */

import { N8nWorkflowService, N8nWorkflowAgent, createN8nService } from './N8nWorkflowService';
import { MasterAgentRegistry } from '../MasterAgentRegistry';
import type { WorkflowOrchestrator } from '../WorkflowOrchestrator';

export interface N8nIntegrationConfig {
  n8nBaseUrl?: string;
  n8nApiKey?: string;
  n8nUsername?: string;
  n8nPassword?: string;
  autoStart?: boolean;
  enableWorkflowSync?: boolean;
  workflowCategories?: string[];
}

export interface GenieFlowWorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'data_processing' | 'external_integration' | 'ai_workflow' | 'automation' | 'notification';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedSetupTime: number; // minutes
  n8nTemplate: any; // n8n workflow JSON
  requiredInputs: string[];
  expectedOutputs: string[];
  useCases: string[];
  tags: string[];
}

/**
 * N8N Integration Service - Main Bridge Class
 */
export class N8nIntegrationService {
  private n8nService: N8nWorkflowService;
  private n8nAgent: N8nWorkflowAgent;
  private masterRegistry: MasterAgentRegistry;
  private workflowOrchestrator?: WorkflowOrchestrator;
  private isInitialized: boolean = false;
  private config: N8nIntegrationConfig;

  // Built-in GenieFlow workflow templates - Comprehensive Production-Ready Collection
  private workflowTemplates: GenieFlowWorkflowTemplate[] = [
    // === DATA PROCESSING & AI WORKFLOWS ===
    {
      id: 'gf-knowledge-sync',
      name: 'Knowledge Base Auto-Sync',
      description: 'Automatically sync documents from multiple sources to your knowledge base with AI-powered categorization',
      category: 'data_processing',
      difficulty: 'intermediate',
      estimatedSetupTime: 15,
      n8nTemplate: this.getKnowledgeBaseSyncTemplate(),
      requiredInputs: ['source_apis', 'sync_schedule', 'ai_categorization_rules'],
      expectedOutputs: ['processed_documents', 'embedding_status', 'category_assignments'],
      useCases: ['Document management', 'Knowledge base maintenance', 'Content aggregation', 'AI-powered organization'],
      tags: ['knowledge-base', 'automation', 'sync', 'ai-categorization']
    },
    {
      id: 'gf-ai-agent-chain',
      name: 'Multi-Step AI Agent Chain',
      description: 'Chain multiple AI agents for complex reasoning tasks with fallback strategies',
      category: 'ai_workflow',
      difficulty: 'advanced',
      estimatedSetupTime: 25,
      n8nTemplate: this.getAIAgentChainTemplate(),
      requiredInputs: ['initial_query', 'agent_sequence', 'context_data', 'fallback_rules'],
      expectedOutputs: ['final_response', 'reasoning_chain', 'confidence_scores', 'execution_path'],
      useCases: ['Complex analysis', 'Multi-step reasoning', 'Research automation', 'Decision support'],
      tags: ['ai-agents', 'reasoning', 'automation', 'decision-support']
    },
    {
      id: 'gf-data-pipeline',
      name: 'Advanced Data Processing Pipeline',
      description: 'ETL pipeline with real-time monitoring, data quality checks, and automated alerts',
      category: 'data_processing',
      difficulty: 'advanced',
      estimatedSetupTime: 30,
      n8nTemplate: this.getDataPipelineTemplate(),
      requiredInputs: ['data_sources', 'transformation_rules', 'output_format', 'quality_thresholds'],
      expectedOutputs: ['processed_data', 'quality_metrics', 'error_report', 'performance_stats'],
      useCases: ['Data transformation', 'Quality assurance', 'Batch processing', 'Real-time analytics'],
      tags: ['data-processing', 'etl', 'analytics', 'monitoring']
    },

    // === BUSINESS AUTOMATION WORKFLOWS ===
    {
      id: 'gf-lead-generation',
      name: 'AI-Powered Lead Generation Engine',
      description: 'Automated lead discovery, qualification, and nurturing with AI-driven personalization',
      category: 'automation',
      difficulty: 'intermediate',
      estimatedSetupTime: 20,
      n8nTemplate: this.getLeadGenerationTemplate(),
      requiredInputs: ['target_criteria', 'data_sources', 'qualification_rules', 'contact_templates'],
      expectedOutputs: ['qualified_leads', 'contact_attempts', 'engagement_metrics', 'crm_updates'],
      useCases: ['Sales automation', 'Lead qualification', 'Prospecting', 'CRM integration'],
      tags: ['sales', 'lead-generation', 'ai-personalization', 'crm']
    },
    {
      id: 'gf-customer-onboarding',
      name: 'Intelligent Customer Onboarding',
      description: 'Comprehensive onboarding flow with personalized experiences and progress tracking',
      category: 'automation',
      difficulty: 'intermediate',
      estimatedSetupTime: 25,
      n8nTemplate: this.getCustomerOnboardingTemplate(),
      requiredInputs: ['customer_data', 'onboarding_checklist', 'communication_preferences'],
      expectedOutputs: ['onboarding_progress', 'completion_status', 'satisfaction_scores', 'support_tickets'],
      useCases: ['Customer success', 'User activation', 'Retention', 'Support automation'],
      tags: ['customer-success', 'onboarding', 'automation', 'personalization']
    },
    {
      id: 'gf-content-factory',
      name: 'AI Content Production Factory',
      description: 'End-to-end content creation with AI research, writing, editing, and multi-channel publishing',
      category: 'automation',
      difficulty: 'advanced',
      estimatedSetupTime: 35,
      n8nTemplate: this.getContentFactoryTemplate(),
      requiredInputs: ['content_brief', 'target_audience', 'brand_guidelines', 'publishing_schedule'],
      expectedOutputs: ['content_pieces', 'seo_optimization', 'engagement_predictions', 'publishing_queue'],
      useCases: ['Content marketing', 'SEO optimization', 'Social media', 'Brand consistency'],
      tags: ['content-creation', 'ai-writing', 'seo', 'multi-channel']
    },

    // === INTEGRATION & COMMUNICATION WORKFLOWS ===
    {
      id: 'gf-external-api-hub',
      name: 'Universal API Integration Hub',
      description: 'Unified interface for 500+ external services with intelligent routing and error handling',
      category: 'external_integration',
      difficulty: 'beginner',
      estimatedSetupTime: 10,
      n8nTemplate: this.getExternalAPITemplate(),
      requiredInputs: ['api_endpoints', 'authentication_tokens', 'routing_rules'],
      expectedOutputs: ['processed_responses', 'error_logs', 'performance_metrics', 'api_health'],
      useCases: ['API orchestration', 'Data aggregation', 'Service integration', 'Microservices'],
      tags: ['apis', 'integration', 'external-services', 'orchestration']
    },
    {
      id: 'gf-smart-notifications',
      name: 'Omnichannel Notification Engine',
      description: 'AI-driven notification system with channel optimization and engagement tracking',
      category: 'notification',
      difficulty: 'intermediate',
      estimatedSetupTime: 20,
      n8nTemplate: this.getSmartNotificationTemplate(),
      requiredInputs: ['notification_data', 'user_preferences', 'urgency_rules', 'channel_configs'],
      expectedOutputs: ['notification_sent', 'delivery_status', 'user_response', 'optimization_insights'],
      useCases: ['Smart alerts', 'Priority routing', 'Multi-channel notifications', 'Engagement optimization'],
      tags: ['notifications', 'smart-routing', 'communication', 'omnichannel']
    },
    {
      id: 'gf-email-automation',
      name: 'Advanced Email Marketing Suite',
      description: 'Sophisticated email campaigns with AI personalization, A/B testing, and analytics',
      category: 'automation',
      difficulty: 'intermediate',
      estimatedSetupTime: 18,
      n8nTemplate: this.getEmailAutomationTemplate(),
      requiredInputs: ['email_lists', 'campaign_template', 'personalization_data', 'ab_test_config'],
      expectedOutputs: ['campaign_results', 'engagement_metrics', 'ab_test_winner', 'lead_scoring'],
      useCases: ['Email marketing', 'Lead nurturing', 'Customer retention', 'Conversion optimization'],
      tags: ['email-marketing', 'personalization', 'ab-testing', 'analytics']
    },

    // === SPECIALIZED WORKFLOWS ===
    {
      id: 'gf-social-media-manager',
      name: 'AI Social Media Manager',
      description: 'Automated social media management with content creation, scheduling, and engagement tracking',
      category: 'automation',
      difficulty: 'intermediate',
      estimatedSetupTime: 22,
      n8nTemplate: this.getSocialMediaTemplate(),
      requiredInputs: ['social_accounts', 'content_strategy', 'posting_schedule', 'engagement_rules'],
      expectedOutputs: ['posted_content', 'engagement_metrics', 'audience_insights', 'trending_topics'],
      useCases: ['Social media marketing', 'Brand management', 'Community engagement', 'Trend analysis'],
      tags: ['social-media', 'automation', 'engagement', 'analytics']
    },
    {
      id: 'gf-document-processor',
      name: 'Intelligent Document Processor',
      description: 'AI-powered document analysis, extraction, and workflow routing with compliance tracking',
      category: 'data_processing',
      difficulty: 'advanced',
      estimatedSetupTime: 28,
      n8nTemplate: this.getDocumentProcessorTemplate(),
      requiredInputs: ['document_sources', 'extraction_rules', 'classification_model', 'routing_logic'],
      expectedOutputs: ['extracted_data', 'document_classification', 'workflow_routing', 'compliance_status'],
      useCases: ['Document automation', 'Data extraction', 'Compliance monitoring', 'Workflow routing'],
      tags: ['document-processing', 'ai-extraction', 'compliance', 'automation']
    },
    {
      id: 'gf-financial-analytics',
      name: 'Real-Time Financial Analytics',
      description: 'Comprehensive financial data analysis with predictive modeling and alert systems',
      category: 'data_processing',
      difficulty: 'advanced',
      estimatedSetupTime: 40,
      n8nTemplate: this.getFinancialAnalyticsTemplate(),
      requiredInputs: ['financial_data', 'analysis_models', 'alert_thresholds', 'reporting_config'],
      expectedOutputs: ['financial_insights', 'predictive_models', 'risk_assessments', 'automated_reports'],
      useCases: ['Financial planning', 'Risk management', 'Investment analysis', 'Regulatory reporting'],
      tags: ['finance', 'analytics', 'prediction', 'risk-management']
    },
    {
      id: 'gf-customer-support',
      name: 'AI Customer Support Orchestrator',
      description: 'Intelligent ticket routing, automated responses, and escalation management with satisfaction tracking',
      category: 'automation',
      difficulty: 'intermediate',
      estimatedSetupTime: 24,
      n8nTemplate: this.getCustomerSupportTemplate(),
      requiredInputs: ['support_channels', 'knowledge_base', 'routing_rules', 'escalation_criteria'],
      expectedOutputs: ['ticket_resolution', 'response_times', 'satisfaction_scores', 'knowledge_gaps'],
      useCases: ['Customer support', 'Ticket management', 'Knowledge base optimization', 'Quality assurance'],
      tags: ['customer-support', 'ai-routing', 'automation', 'satisfaction']
    },
    {
      id: 'gf-inventory-optimization',
      name: 'Smart Inventory Management',
      description: 'AI-driven inventory optimization with demand forecasting and automated reordering',
      category: 'automation',
      difficulty: 'advanced',
      estimatedSetupTime: 32,
      n8nTemplate: this.getInventoryOptimizationTemplate(),
      requiredInputs: ['inventory_data', 'sales_history', 'supplier_info', 'demand_patterns'],
      expectedOutputs: ['inventory_levels', 'reorder_recommendations', 'demand_forecasts', 'cost_optimization'],
      useCases: ['Inventory management', 'Supply chain optimization', 'Demand forecasting', 'Cost reduction'],
      tags: ['inventory', 'optimization', 'forecasting', 'supply-chain']
    },
    {
      id: 'gf-hr-automation',
      name: 'Complete HR Automation Suite',
      description: 'End-to-end HR processes from recruitment to performance management with AI insights',
      category: 'automation',
      difficulty: 'advanced',
      estimatedSetupTime: 45,
      n8nTemplate: this.getHRAutomationTemplate(),
      requiredInputs: ['hr_systems', 'job_requirements', 'performance_criteria', 'compliance_rules'],
      expectedOutputs: ['candidate_rankings', 'onboarding_progress', 'performance_insights', 'compliance_reports'],
      useCases: ['Recruitment', 'Onboarding', 'Performance management', 'Compliance tracking'],
      tags: ['hr-automation', 'recruitment', 'performance', 'compliance']
    }
  ];

  constructor(config: N8nIntegrationConfig = {}) {
    this.config = {
      n8nBaseUrl: 'http://localhost:5678',
      autoStart: true,
      enableWorkflowSync: true,
      workflowCategories: ['genieflow', 'automation', 'ai'],
      ...config
    };

    // Initialize n8n service
    this.n8nService = createN8nService({
      baseUrl: this.config.n8nBaseUrl,
      apiKey: this.config.n8nApiKey,
      username: this.config.n8nUsername,
      password: this.config.n8nPassword
    });

    // Create n8n agent
    this.n8nAgent = new N8nWorkflowAgent(this.n8nService);
  }

  /**
   * Initialize the integration service
   */
  async initialize(masterRegistry: MasterAgentRegistry, workflowOrchestrator?: WorkflowOrchestrator): Promise<boolean> {
    try {
      console.log('🚀 Initializing N8N Integration Service...');

      this.masterRegistry = masterRegistry;
      this.workflowOrchestrator = workflowOrchestrator;

      // Initialize n8n service
      const n8nConnected = await this.n8nService.initialize();
      
      if (!n8nConnected) {
        console.warn('⚠️ N8N service not available, running in offline mode');
        if (!this.config.autoStart) {
          return false;
        }
        // Continue initialization for offline mode
      }

      // Register n8n agent in master registry
      await this.registerN8nAgent();

      // Sync workflows if enabled
      if (this.config.enableWorkflowSync && n8nConnected) {
        await this.syncWorkflowTemplates();
      }

      this.isInitialized = true;
      console.log('✅ N8N Integration Service initialized successfully');
      
      return true;
    } catch (error) {
      console.error('❌ N8N Integration initialization failed:', error);
      return false;
    }
  }

  /**
   * Register n8n agent in the master registry
   */
  private async registerN8nAgent(): Promise<void> {
    // Note: N8N agent registration is handled by MasterAgentRegistry during initialization
    // This method is kept for reference but registration happens automatically
    console.log('✅ N8N agent registration handled by Master Agent Registry');
  }

  /**
   * Sync GenieFlow workflow templates to n8n
   */
  private async syncWorkflowTemplates(): Promise<void> {
    console.log('🔄 Syncing workflow templates to N8N...');

    for (const template of this.workflowTemplates) {
      try {
        // Check if workflow already exists
        const existingWorkflows = await this.n8nService.getWorkflows();
        const exists = existingWorkflows.find(w => w.name === template.name);

        if (!exists) {
          // Create new workflow from template
          await this.n8nService.createWorkflow({
            name: template.name,
            description: template.description,
            nodes: template.n8nTemplate.nodes,
            connections: template.n8nTemplate.connections,
            active: false, // Templates start inactive
            tags: [...template.tags, 'genieflow-template'],
            settings: {
              saveExecutions: true,
              saveExecutionsOnError: true,
              saveExecutionsOnSuccess: false,
              saveManualExecutions: true
            }
          });

          console.log(`✨ Created workflow template: ${template.name}`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to sync template ${template.name}:`, error);
      }
    }

    console.log('✅ Workflow template sync completed');
  }

  /**
   * Execute GenieFlow workflow through n8n
   */
  async executeGenieFlowWorkflow(templateId: string, input: any): Promise<any> {
    const template = this.workflowTemplates.find(t => t.id === templateId);
    
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    if (!this.n8nService.isServiceConnected()) {
      throw new Error('N8N service not available');
    }

    // Find corresponding n8n workflow
    const workflows = await this.n8nService.getWorkflows();
    const n8nWorkflow = workflows.find(w => w.name === template.name);
    
    if (!n8nWorkflow) {
      throw new Error(`N8N workflow for template ${templateId} not found`);
    }

    // Execute workflow
    const execution = await this.n8nService.executeWorkflow({
      workflowId: n8nWorkflow.id,
      data: input,
      mode: 'manual'
    });

    return execution;
  }

  /**
   * Get available workflow templates
   */
  getWorkflowTemplates(): GenieFlowWorkflowTemplate[] {
    return [...this.workflowTemplates];
  }

  /**
   * Get workflow template by category
   */
  getTemplatesByCategory(category: string): GenieFlowWorkflowTemplate[] {
    return this.workflowTemplates.filter(t => t.category === category);
  }

  /**
   * Check if n8n service is available
   */
  isN8nAvailable(): boolean {
    return this.n8nService.isServiceConnected();
  }

  /**
   * Get service status
   */
  getServiceStatus(): {
    initialized: boolean;
    n8nConnected: boolean;
    templatesAvailable: number;
    activeWorkflows: number;
  } {
    return {
      initialized: this.isInitialized,
      n8nConnected: this.n8nService.isServiceConnected(),
      templatesAvailable: this.workflowTemplates.length,
      activeWorkflows: 0 // Would be fetched from n8n in real implementation
    };
  }

  /**
   * Add custom workflow template
   */
  addWorkflowTemplate(template: GenieFlowWorkflowTemplate): void {
    this.workflowTemplates.push(template);
    console.log(`📝 Added custom workflow template: ${template.name}`);
  }

  // Template generators (simplified for demonstration)
  private getKnowledgeBaseSyncTemplate(): any {
    return {
      nodes: [
        {
          id: 'trigger',
          name: 'Schedule Trigger',
          type: 'n8n-nodes-base.scheduleTrigger',
          position: [250, 300],
          parameters: { rule: { interval: [{ field: 'hours', value: 6 }] } }
        },
        {
          id: 'webhook',
          name: 'GenieFlow API',
          type: 'n8n-nodes-base.httpRequest',
          position: [450, 300],
          parameters: { 
            url: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/knowledge-base/sync`,
            method: 'POST'
          }
        }
      ],
      connections: { trigger: { main: [[{ node: 'webhook', type: 'main', index: 0 }]] } }
    };
  }

  private getAIAgentChainTemplate(): any {
    return {
      nodes: [
        {
          id: 'trigger',
          name: 'Manual Trigger',
          type: 'n8n-nodes-base.manualTrigger',
          position: [250, 300],
          parameters: {}
        },
        {
          id: 'agent1',
          name: 'Analysis Agent',
          type: 'n8n-nodes-base.httpRequest',
          position: [450, 200],
          parameters: { 
            url: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/agents/analyze`,
            method: 'POST'
          }
        },
        {
          id: 'agent2',
          name: 'Processing Agent',
          type: 'n8n-nodes-base.httpRequest',
          position: [650, 300],
          parameters: { 
            url: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/agents/process`,
            method: 'POST'
          }
        }
      ],
      connections: { 
        trigger: { main: [[{ node: 'agent1', type: 'main', index: 0 }]] },
        agent1: { main: [[{ node: 'agent2', type: 'main', index: 0 }]] }
      }
    };
  }

  private getExternalAPITemplate(): any {
    return {
      nodes: [
        {
          id: 'webhook',
          name: 'Webhook Trigger',
          type: 'n8n-nodes-base.webhook',
          position: [250, 300],
          parameters: { path: 'genieflow-api-hub' }
        },
        {
          id: 'router',
          name: 'API Router',
          type: 'n8n-nodes-base.switch',
          position: [450, 300],
          parameters: { 
            conditions: { 
              string: [{ value1: '={{$json["service"]}}', operation: 'equal' }] 
            } 
          }
        }
      ],
      connections: { webhook: { main: [[{ node: 'router', type: 'main', index: 0 }]] } }
    };
  }

  private getSmartNotificationTemplate(): any {
    return {
      nodes: [
        {
          id: 'trigger',
          name: 'Notification Trigger',
          type: 'n8n-nodes-base.webhook',
          position: [250, 300],
          parameters: { path: 'smart-notification' }
        },
        {
          id: 'analyzer',
          name: 'Content Analyzer',
          type: 'n8n-nodes-base.httpRequest',
          position: [450, 300],
          parameters: { 
            url: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/ai/analyze-content`,
            method: 'POST'
          }
        }
      ],
      connections: { trigger: { main: [[{ node: 'analyzer', type: 'main', index: 0 }]] } }
    };
  }

  private getDataPipelineTemplate(): any {
    return {
      nodes: [
        {
          id: 'source',
          name: 'Data Source',
          type: 'n8n-nodes-base.httpRequest',
          position: [250, 300],
          parameters: { method: 'GET' }
        },
        {
          id: 'transform',
          name: 'Transform Data',
          type: 'n8n-nodes-base.code',
          position: [450, 300],
          parameters: { 
            jsCode: `// Transform data logic here\nreturn items.map(item => ({ ...item.json, processed: true }));`
          }
        }
      ],
      connections: { source: { main: [[{ node: 'transform', type: 'main', index: 0 }]] } }
    };
  }

  // === NEW COMPREHENSIVE TEMPLATE GENERATORS ===

  private getLeadGenerationTemplate(): any {
    return {
      name: 'AI Lead Generation Engine',
      nodes: [
        {
          id: 'webhook',
          name: 'Lead Generation Trigger',
          type: 'n8n-nodes-base.webhook',
          position: [240, 300],
          parameters: { httpMethod: 'POST', path: 'lead-generation' }
        },
        {
          id: 'linkedin_scraper',
          name: 'LinkedIn Prospect Search',
          type: 'n8n-nodes-base.httpRequest',
          position: [440, 200],
          parameters: {
            method: 'GET',
            url: 'https://api.linkedin.com/v2/people-search',
            authentication: 'oAuth2Api'
          }
        },
        {
          id: 'ai_qualification',
          name: 'AI Lead Qualification',
          type: 'n8n-nodes-base.openAi',
          position: [640, 200],
          parameters: {
            model: 'gpt-4',
            prompt: 'Analyze this lead profile and score qualification (1-10): {{$json.profile}}'
          }
        },
        {
          id: 'email_personalization',
          name: 'Personalized Outreach',
          type: 'n8n-nodes-base.openAi',
          position: [440, 400],
          parameters: {
            model: 'gpt-4',
            prompt: 'Create personalized outreach email for: {{$json.lead_data}}'
          }
        },
        {
          id: 'crm_sync',
          name: 'CRM Integration',
          type: 'n8n-nodes-base.salesforce',
          position: [840, 300],
          parameters: { operation: 'create', resource: 'lead' }
        }
      ],
      connections: {
        webhook: { main: [[{ node: 'linkedin_scraper' }, { node: 'email_personalization' }]] },
        linkedin_scraper: { main: [[{ node: 'ai_qualification' }]] },
        ai_qualification: { main: [[{ node: 'crm_sync' }]] },
        email_personalization: { main: [[{ node: 'crm_sync' }]] }
      }
    };
  }

  private getCustomerOnboardingTemplate(): any {
    return {
      name: 'Intelligent Customer Onboarding',
      nodes: [
        {
          id: 'new_customer_trigger',
          name: 'New Customer Webhook',
          type: 'n8n-nodes-base.webhook',
          position: [240, 300],
          parameters: { httpMethod: 'POST', path: 'new-customer' }
        },
        {
          id: 'create_onboarding_plan',
          name: 'Generate Onboarding Plan',
          type: 'n8n-nodes-base.openAi',
          position: [440, 200],
          parameters: {
            model: 'gpt-4',
            prompt: 'Create personalized onboarding checklist for customer: {{$json.customer_data}}'
          }
        },
        {
          id: 'send_welcome_email',
          name: 'Welcome Email Sequence',
          type: 'n8n-nodes-base.gmail',
          position: [440, 400],
          parameters: {
            operation: 'send',
            subject: 'Welcome to GenieFlow - Your Journey Begins!',
            message: '{{$node["create_onboarding_plan"].json.welcome_email}}'
          }
        },
        {
          id: 'schedule_check_ins',
          name: 'Schedule Follow-up Tasks',
          type: 'n8n-nodes-base.todoist',
          position: [640, 300],
          parameters: { operation: 'create', content: 'Customer onboarding check-in' }
        },
        {
          id: 'track_progress',
          name: 'Progress Tracking',
          type: 'n8n-nodes-base.airtable',
          position: [840, 300],
          parameters: { operation: 'create', table: 'onboarding_progress' }
        }
      ],
      connections: {
        new_customer_trigger: { main: [[{ node: 'create_onboarding_plan' }, { node: 'send_welcome_email' }]] },
        create_onboarding_plan: { main: [[{ node: 'schedule_check_ins' }]] },
        send_welcome_email: { main: [[{ node: 'track_progress' }]] },
        schedule_check_ins: { main: [[{ node: 'track_progress' }]] }
      }
    };
  }

  private getContentFactoryTemplate(): any {
    return {
      name: 'AI Content Production Factory',
      nodes: [
        {
          id: 'content_brief_trigger',
          name: 'Content Brief Input',
          type: 'n8n-nodes-base.webhook',
          position: [240, 300],
          parameters: { httpMethod: 'POST', path: 'content-brief' }
        },
        {
          id: 'research_agent',
          name: 'AI Research Agent',
          type: 'n8n-nodes-base.openAi',
          position: [440, 200],
          parameters: {
            model: 'gpt-4',
            prompt: 'Research comprehensive information about: {{$json.topic}}. Include latest trends, statistics, and expert opinions.'
          }
        },
        {
          id: 'content_writer',
          name: 'AI Content Writer',
          type: 'n8n-nodes-base.openAi',
          position: [640, 200],
          parameters: {
            model: 'gpt-4',
            prompt: 'Write engaging content based on research: {{$node["research_agent"].json.research_data}}. Follow brand guidelines: {{$json.brand_guidelines}}'
          }
        },
        {
          id: 'seo_optimizer',
          name: 'SEO Optimization',
          type: 'n8n-nodes-base.openAi',
          position: [840, 200],
          parameters: {
            model: 'gpt-4',
            prompt: 'Optimize content for SEO with target keywords: {{$json.keywords}}. Content: {{$node["content_writer"].json.content}}'
          }
        },
        {
          id: 'social_media_adapter',
          name: 'Social Media Versions',
          type: 'n8n-nodes-base.openAi',
          position: [440, 400],
          parameters: {
            model: 'gpt-4',
            prompt: 'Create social media versions (Twitter, LinkedIn, Facebook) of: {{$node["content_writer"].json.content}}'
          }
        },
        {
          id: 'publish_scheduler',
          name: 'Publishing Scheduler',
          type: 'n8n-nodes-base.wordpress',
          position: [1040, 300],
          parameters: { operation: 'create', status: 'scheduled' }
        }
      ],
      connections: {
        content_brief_trigger: { main: [[{ node: 'research_agent' }]] },
        research_agent: { main: [[{ node: 'content_writer' }]] },
        content_writer: { main: [[{ node: 'seo_optimizer' }, { node: 'social_media_adapter' }]] },
        seo_optimizer: { main: [[{ node: 'publish_scheduler' }]] },
        social_media_adapter: { main: [[{ node: 'publish_scheduler' }]] }
      }
    };
  }

  private getEmailAutomationTemplate(): any {
    return {
      name: 'Advanced Email Marketing Suite',
      nodes: [
        {
          id: 'campaign_trigger',
          name: 'Campaign Launch Trigger',
          type: 'n8n-nodes-base.webhook',
          position: [240, 300],
          parameters: { httpMethod: 'POST', path: 'email-campaign' }
        },
        {
          id: 'segment_audience',
          name: 'Audience Segmentation',
          type: 'n8n-nodes-base.code',
          position: [440, 200],
          parameters: {
            jsCode: `
              // Segment audience based on behavior and preferences
              const segments = items[0].json.email_list.reduce((acc, user) => {
                const segment = user.behavior_score > 70 ? 'high_engagement' : 'low_engagement';
                if (!acc[segment]) acc[segment] = [];
                acc[segment].push(user);
                return acc;
              }, {});
              return [{ json: segments }];
            `
          }
        },
        {
          id: 'personalize_content',
          name: 'AI Personalization',
          type: 'n8n-nodes-base.openAi',
          position: [640, 200],
          parameters: {
            model: 'gpt-4',
            prompt: 'Personalize email content for user segment: {{$json.segment}}. Base template: {{$json.email_template}}'
          }
        },
        {
          id: 'ab_test_setup',
          name: 'A/B Test Configuration',
          type: 'n8n-nodes-base.code',
          position: [440, 400],
          parameters: {
            jsCode: `
              // Split audience for A/B testing
              const users = items[0].json.users;
              const splitPoint = Math.floor(users.length / 2);
              return [
                { json: { variant: 'A', users: users.slice(0, splitPoint) }},
                { json: { variant: 'B', users: users.slice(splitPoint) }}
              ];
            `
          }
        },
        {
          id: 'send_emails',
          name: 'Email Delivery',
          type: 'n8n-nodes-base.emailSend',
          position: [840, 300],
          parameters: {
            subject: '{{$json.personalized_subject}}',
            message: '{{$json.personalized_content}}'
          }
        },
        {
          id: 'track_engagement',
          name: 'Engagement Analytics',
          type: 'n8n-nodes-base.googleAnalytics',
          position: [1040, 300],
          parameters: { operation: 'trackEvent', category: 'email_campaign' }
        }
      ],
      connections: {
        campaign_trigger: { main: [[{ node: 'segment_audience' }, { node: 'ab_test_setup' }]] },
        segment_audience: { main: [[{ node: 'personalize_content' }]] },
        personalize_content: { main: [[{ node: 'send_emails' }]] },
        ab_test_setup: { main: [[{ node: 'send_emails' }]] },
        send_emails: { main: [[{ node: 'track_engagement' }]] }
      }
    };
  }

  private getSocialMediaTemplate(): any {
    return {
      name: 'AI Social Media Manager',
      nodes: [
        {
          id: 'content_scheduler',
          name: 'Content Schedule Trigger',
          type: 'n8n-nodes-base.scheduleTrigger',
          position: [240, 300],
          parameters: { rule: { interval: [{ field: 'hours', value: 4 }] } }
        },
        {
          id: 'trend_analysis',
          name: 'Trending Topics Analysis',
          type: 'n8n-nodes-base.twitter',
          position: [440, 200],
          parameters: { operation: 'search', searchText: '#trending' }
        },
        {
          id: 'content_generator',
          name: 'AI Content Generator',
          type: 'n8n-nodes-base.openAi',
          position: [640, 200],
          parameters: {
            model: 'gpt-4',
            prompt: 'Create engaging social media post about trending topic: {{$node["trend_analysis"].json.trend}}. Brand voice: professional yet approachable.'
          }
        },
        {
          id: 'image_generator',
          name: 'AI Image Generation',
          type: 'n8n-nodes-base.openAi',
          position: [440, 400],
          parameters: {
            model: 'dall-e-3',
            prompt: 'Create professional social media image for: {{$node["content_generator"].json.content}}'
          }
        },
        {
          id: 'multi_platform_publisher',
          name: 'Multi-Platform Publisher',
          type: 'n8n-nodes-base.code',
          position: [840, 300],
          parameters: {
            jsCode: `
              // Adapt content for different platforms
              const platforms = ['twitter', 'linkedin', 'facebook', 'instagram'];
              const adaptedContent = platforms.map(platform => ({
                platform,
                content: adaptContentForPlatform(items[0].json.content, platform),
                image: items[0].json.image_url
              }));
              return adaptedContent.map(item => ({ json: item }));
            `
          }
        },
        {
          id: 'engagement_monitor',
          name: 'Engagement Monitoring',
          type: 'n8n-nodes-base.webhook',
          position: [1040, 300],
          parameters: { httpMethod: 'POST', path: 'engagement-webhook' }
        }
      ],
      connections: {
        content_scheduler: { main: [[{ node: 'trend_analysis' }]] },
        trend_analysis: { main: [[{ node: 'content_generator' }, { node: 'image_generator' }]] },
        content_generator: { main: [[{ node: 'multi_platform_publisher' }]] },
        image_generator: { main: [[{ node: 'multi_platform_publisher' }]] },
        multi_platform_publisher: { main: [[{ node: 'engagement_monitor' }]] }
      }
    };
  }

  private getDocumentProcessorTemplate(): any {
    return {
      name: 'Intelligent Document Processor',
      nodes: [
        {
          id: 'document_upload',
          name: 'Document Upload Trigger',
          type: 'n8n-nodes-base.webhook',
          position: [240, 300],
          parameters: { httpMethod: 'POST', path: 'document-upload' }
        },
        {
          id: 'ocr_extraction',
          name: 'OCR Text Extraction',
          type: 'n8n-nodes-base.googleCloud',
          position: [440, 200],
          parameters: { service: 'vision', operation: 'detectText' }
        },
        {
          id: 'ai_classification',
          name: 'Document Classification',
          type: 'n8n-nodes-base.openAi',
          position: [640, 200],
          parameters: {
            model: 'gpt-4',
            prompt: 'Classify this document type and extract key information: {{$node["ocr_extraction"].json.text}}'
          }
        },
        {
          id: 'data_extraction',
          name: 'Structured Data Extraction',
          type: 'n8n-nodes-base.code',
          position: [440, 400],
          parameters: {
            jsCode: `
              // Extract structured data based on document type
              const extractors = {
                invoice: extractInvoiceData,
                contract: extractContractData,
                receipt: extractReceiptData
              };
              const docType = items[0].json.document_type;
              const extractor = extractors[docType] || extractGenericData;
              return [{ json: extractor(items[0].json.text) }];
            `
          }
        },
        {
          id: 'workflow_routing',
          name: 'Workflow Routing',
          type: 'n8n-nodes-base.switch',
          position: [840, 300],
          parameters: {
            rules: {
              values: [
                { conditions: [{ leftValue: '{{$json.document_type}}', rightValue: 'invoice', operator: 'equal' }] },
                { conditions: [{ leftValue: '{{$json.document_type}}', rightValue: 'contract', operator: 'equal' }] }
              ]
            }
          }
        },
        {
          id: 'compliance_check',
          name: 'Compliance Validation',
          type: 'n8n-nodes-base.openAi',
          position: [1040, 200],
          parameters: {
            model: 'gpt-4',
            prompt: 'Check document compliance against regulations for: {{$json.document_type}}'
          }
        }
      ],
      connections: {
        document_upload: { main: [[{ node: 'ocr_extraction' }]] },
        ocr_extraction: { main: [[{ node: 'ai_classification' }, { node: 'data_extraction' }]] },
        ai_classification: { main: [[{ node: 'workflow_routing' }]] },
        data_extraction: { main: [[{ node: 'workflow_routing' }]] },
        workflow_routing: { main: [[{ node: 'compliance_check' }]] }
      }
    };
  }

  private getFinancialAnalyticsTemplate(): any {
    return {
      name: 'Real-Time Financial Analytics',
      nodes: [
        {
          id: 'data_ingestion',
          name: 'Financial Data Ingestion',
          type: 'n8n-nodes-base.scheduleTrigger',
          position: [240, 300],
          parameters: { rule: { interval: [{ field: 'minutes', value: 15 }] } }
        },
        {
          id: 'market_data_api',
          name: 'Market Data Feed',
          type: 'n8n-nodes-base.httpRequest',
          position: [440, 200],
          parameters: {
            method: 'GET',
            url: 'https://api.polygon.io/v2/aggs/ticker/{{$json.symbol}}/range/1/minute/{{$json.from}}/{{$json.to}}',
            authentication: 'headerAuth'
          }
        },
        {
          id: 'risk_calculator',
          name: 'Risk Analysis Engine',
          type: 'n8n-nodes-base.code',
          position: [640, 200],
          parameters: {
            jsCode: `
              // Calculate various risk metrics
              const prices = items[0].json.results;
              const returns = calculateReturns(prices);
              const volatility = calculateVolatility(returns);
              const var95 = calculateVaR(returns, 0.95);
              return [{ json: { volatility, var95, sharpeRatio: calculateSharpe(returns) }}];
            `
          }
        },
        {
          id: 'predictive_model',
          name: 'ML Prediction Model',
          type: 'n8n-nodes-base.openAi',
          position: [440, 400],
          parameters: {
            model: 'gpt-4',
            prompt: 'Analyze financial trends and provide price predictions based on: {{$json.market_data}}'
          }
        },
        {
          id: 'alert_system',
          name: 'Smart Alert System',
          type: 'n8n-nodes-base.code',
          position: [840, 300],
          parameters: {
            jsCode: `
              // Check for alert conditions
              const thresholds = items[0].json.alert_thresholds;
              const currentMetrics = items[0].json.metrics;
              const alerts = [];
              
              if (currentMetrics.volatility > thresholds.volatility_max) {
                alerts.push({ type: 'high_volatility', severity: 'warning' });
              }
              
              return alerts.length ? [{ json: { alerts }}] : [];
            `
          }
        },
        {
          id: 'dashboard_update',
          name: 'Dashboard Updates',
          type: 'n8n-nodes-base.httpRequest',
          position: [1040, 300],
          parameters: {
            method: 'POST',
            url: '{{$json.dashboard_webhook}}',
            body: '{{$json.analytics_data}}'
          }
        }
      ],
      connections: {
        data_ingestion: { main: [[{ node: 'market_data_api' }]] },
        market_data_api: { main: [[{ node: 'risk_calculator' }, { node: 'predictive_model' }]] },
        risk_calculator: { main: [[{ node: 'alert_system' }]] },
        predictive_model: { main: [[{ node: 'alert_system' }]] },
        alert_system: { main: [[{ node: 'dashboard_update' }]] }
      }
    };
  }

  private getCustomerSupportTemplate(): any {
    return {
      name: 'AI Customer Support Orchestrator',
      nodes: [
        {
          id: 'ticket_intake',
          name: 'Support Ticket Intake',
          type: 'n8n-nodes-base.webhook',
          position: [240, 300],
          parameters: { httpMethod: 'POST', path: 'support-ticket' }
        },
        {
          id: 'sentiment_analysis',
          name: 'Sentiment & Urgency Analysis',
          type: 'n8n-nodes-base.openAi',
          position: [440, 200],
          parameters: {
            model: 'gpt-4',
            prompt: 'Analyze customer sentiment and urgency level (1-10) for: {{$json.ticket_content}}'
          }
        },
        {
          id: 'knowledge_base_search',
          name: 'Knowledge Base Search',
          type: 'n8n-nodes-base.pinecone',
          position: [640, 200],
          parameters: {
            operation: 'query',
            query: '{{$json.ticket_summary}}',
            topK: 5
          }
        },
        {
          id: 'auto_response_generator',
          name: 'AI Response Generator',
          type: 'n8n-nodes-base.openAi',
          position: [440, 400],
          parameters: {
            model: 'gpt-4',
            prompt: 'Generate helpful response based on knowledge base results: {{$node["knowledge_base_search"].json.matches}}'
          }
        },
        {
          id: 'routing_decision',
          name: 'Intelligent Routing',
          type: 'n8n-nodes-base.switch',
          position: [840, 300],
          parameters: {
            rules: {
              values: [
                { conditions: [{ leftValue: '{{$json.urgency_score}}', rightValue: '8', operator: 'largerEqual' }] },
                { conditions: [{ leftValue: '{{$json.confidence_score}}', rightValue: '0.9', operator: 'largerEqual' }] }
              ]
            }
          }
        },
        {
          id: 'human_escalation',
          name: 'Human Agent Assignment',
          type: 'n8n-nodes-base.slack',
          position: [1040, 200],
          parameters: {
            operation: 'sendMessage',
            channel: '#support-team',
            text: 'High priority ticket requires human attention: {{$json.ticket_id}}'
          }
        },
        {
          id: 'satisfaction_tracking',
          name: 'Satisfaction Survey',
          type: 'n8n-nodes-base.httpRequest',
          position: [1040, 400],
          parameters: {
            method: 'POST',
            url: '{{$json.survey_webhook}}',
            body: '{{$json.satisfaction_survey}}'
          }
        }
      ],
      connections: {
        ticket_intake: { main: [[{ node: 'sentiment_analysis' }]] },
        sentiment_analysis: { main: [[{ node: 'knowledge_base_search' }, { node: 'auto_response_generator' }]] },
        knowledge_base_search: { main: [[{ node: 'routing_decision' }]] },
        auto_response_generator: { main: [[{ node: 'routing_decision' }]] },
        routing_decision: { 
          main: [
            [{ node: 'human_escalation' }], 
            [{ node: 'satisfaction_tracking' }]
          ] 
        }
      }
    };
  }

  private getInventoryOptimizationTemplate(): any {
    return {
      name: 'Smart Inventory Management',
      nodes: [
        {
          id: 'inventory_sync',
          name: 'Inventory Data Sync',
          type: 'n8n-nodes-base.scheduleTrigger',
          position: [240, 300],
          parameters: { rule: { interval: [{ field: 'hours', value: 2 }] } }
        },
        {
          id: 'sales_data_fetch',
          name: 'Sales History Analysis',
          type: 'n8n-nodes-base.postgres',
          position: [440, 200],
          parameters: {
            operation: 'select',
            query: 'SELECT * FROM sales_data WHERE date >= NOW() - INTERVAL \'90 days\''
          }
        },
        {
          id: 'demand_forecasting',
          name: 'AI Demand Forecasting',
          type: 'n8n-nodes-base.openAi',
          position: [640, 200],
          parameters: {
            model: 'gpt-4',
            prompt: 'Analyze sales patterns and forecast demand for next 30 days: {{$node["sales_data_fetch"].json}}'
          }
        },
        {
          id: 'stock_level_optimizer',
          name: 'Stock Level Optimization',
          type: 'n8n-nodes-base.code',
          position: [440, 400],
          parameters: {
            jsCode: `
              // Calculate optimal stock levels using EOQ formula
              const items = items[0].json.inventory_items;
              const optimizedLevels = items.map(item => {
                const demandRate = item.average_demand;
                const orderingCost = item.ordering_cost;
                const holdingCost = item.holding_cost;
                const eoq = Math.sqrt((2 * demandRate * orderingCost) / holdingCost);
                return { ...item, optimal_stock_level: eoq, reorder_point: demandRate * item.lead_time };
              });
              return [{ json: { optimized_inventory: optimizedLevels }}];
            `
          }
        },
        {
          id: 'supplier_integration',
          name: 'Supplier API Integration',
          type: 'n8n-nodes-base.httpRequest',
          position: [840, 300],
          parameters: {
            method: 'POST',
            url: '{{$json.supplier_api_endpoint}}',
            body: '{{$json.reorder_requests}}'
          }
        },
        {
          id: 'cost_analysis',
          name: 'Cost Optimization Analysis',
          type: 'n8n-nodes-base.code',
          position: [1040, 200],
          parameters: {
            jsCode: `
              // Calculate cost savings and ROI
              const current = items[0].json.current_costs;
              const optimized = items[0].json.optimized_costs;
              const savings = current.total - optimized.total;
              const roi = (savings / current.total) * 100;
              return [{ json: { cost_savings: savings, roi_percentage: roi }}];
            `
          }
        }
      ],
      connections: {
        inventory_sync: { main: [[{ node: 'sales_data_fetch' }]] },
        sales_data_fetch: { main: [[{ node: 'demand_forecasting' }, { node: 'stock_level_optimizer' }]] },
        demand_forecasting: { main: [[{ node: 'supplier_integration' }]] },
        stock_level_optimizer: { main: [[{ node: 'supplier_integration' }]] },
        supplier_integration: { main: [[{ node: 'cost_analysis' }]] }
      }
    };
  }

  private getHRAutomationTemplate(): any {
    return {
      name: 'Complete HR Automation Suite',
      nodes: [
        {
          id: 'hr_trigger',
          name: 'HR Process Trigger',
          type: 'n8n-nodes-base.webhook',
          position: [240, 300],
          parameters: { httpMethod: 'POST', path: 'hr-process' }
        },
        {
          id: 'resume_screening',
          name: 'AI Resume Screening',
          type: 'n8n-nodes-base.openAi',
          position: [440, 150],
          parameters: {
            model: 'gpt-4',
            prompt: 'Screen resume against job requirements and score candidate (1-100): Job: {{$json.job_description}} Resume: {{$json.resume_text}}'
          }
        },
        {
          id: 'interview_scheduler',
          name: 'Interview Scheduling',
          type: 'n8n-nodes-base.googleCalendar',
          position: [640, 150],
          parameters: {
            operation: 'create',
            summary: 'Interview with {{$json.candidate_name}}',
            attendees: '{{$json.interviewer_emails}}'
          }
        },
        {
          id: 'onboarding_automation',
          name: 'Onboarding Process',
          type: 'n8n-nodes-base.code',
          position: [440, 300],
          parameters: {
            jsCode: `
              // Generate comprehensive onboarding checklist
              const newHire = items[0].json.employee_data;
              const onboardingTasks = [
                { task: 'IT setup', department: 'IT', priority: 'high' },
                { task: 'HR documentation', department: 'HR', priority: 'high' },
                { task: 'Office tour', department: 'Admin', priority: 'medium' },
                { task: 'Team introductions', department: newHire.department, priority: 'high' }
              ];
              return [{ json: { onboarding_checklist: onboardingTasks }}];
            `
          }
        },
        {
          id: 'performance_tracking',
          name: 'Performance Management',
          type: 'n8n-nodes-base.airtable',
          position: [640, 450],
          parameters: {
            operation: 'create',
            table: 'performance_reviews',
            fields: {
              employee_id: '{{$json.employee_id}}',
              review_period: '{{$json.review_period}}',
              goals: '{{$json.performance_goals}}'
            }
          }
        },
        {
          id: 'compliance_monitoring',
          name: 'Compliance Tracking',
          type: 'n8n-nodes-base.code',
          position: [840, 300],
          parameters: {
            jsCode: `
              // Monitor compliance requirements
              const employee = items[0].json.employee;
              const complianceChecks = [
                { requirement: 'Background check', status: employee.background_check_complete },
                { requirement: 'Training completion', status: employee.training_complete },
                { requirement: 'Document verification', status: employee.documents_verified }
              ];
              const overallCompliance = complianceChecks.every(check => check.status);
              return [{ json: { compliance_status: overallCompliance, checks: complianceChecks }}];
            `
          }
        },
        {
          id: 'analytics_dashboard',
          name: 'HR Analytics Dashboard',
          type: 'n8n-nodes-base.httpRequest',
          position: [1040, 300],
          parameters: {
            method: 'POST',
            url: '{{$json.analytics_webhook}}',
            body: JSON.stringify({
              employee_data: '{{$json.employee_metrics}}',
              performance_data: '{{$json.performance_metrics}}',
              compliance_data: '{{$json.compliance_status}}'
            })
          }
        }
      ],
      connections: {
        hr_trigger: { 
          main: [
            [{ node: 'resume_screening' }, { node: 'onboarding_automation' }, { node: 'performance_tracking' }]
          ] 
        },
        resume_screening: { main: [[{ node: 'interview_scheduler' }]] },
        interview_scheduler: { main: [[{ node: 'compliance_monitoring' }]] },
        onboarding_automation: { main: [[{ node: 'compliance_monitoring' }]] },
        performance_tracking: { main: [[{ node: 'compliance_monitoring' }]] },
        compliance_monitoring: { main: [[{ node: 'analytics_dashboard' }]] }
      }
    };
  }
}

// Factory function
export function createN8nIntegration(config?: N8nIntegrationConfig): N8nIntegrationService {
  return new N8nIntegrationService(config);
}

// Export singleton instance
export const n8nIntegrationService = createN8nIntegration();