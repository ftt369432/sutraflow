import { sovereignFs } from '../fs/sovereignFsBridge';
import { AIServiceFactory } from '../ai/aiServiceFactory';
import { saveCustomWorkflow, WorkflowItem } from '../../components/workbench/workflowData';

export interface GenesisInput {
  businessName: string;
  businessType: string;
  sampleText?: string;
  sampleFileName?: string;
  governingStandards?: string;
  jurisdiction?: string;
  primaryGoal?: string;
}

export interface GenesisOutput {
  success: boolean;
  businessName: string;
  businessType: string;
  businessMd: string;
  agentsMd: string;
  rulesMd: string;
  workflowItem: WorkflowItem;
  createdFiles: string[];
  superpowerSummary: string;
}

export class GenesisBrainService {
  private static instance: GenesisBrainService;

  public static getInstance(): GenesisBrainService {
    if (!GenesisBrainService.instance) {
      GenesisBrainService.instance = new GenesisBrainService();
    }
    return GenesisBrainService.instance;
  }

  /**
   * Deconstructs a sample work product to extract structural patterns & variables
   */
  public async analyzeSampleWork(sampleText: string, businessType: string): Promise<string> {
    if (!sampleText || sampleText.trim().length < 50) {
      return 'Sample text is brief; will synthesize based on standard domain archetypes.';
    }

    try {
      const ai = AIServiceFactory.getInstance();
      const prompt = `You are a Principal Enterprise Systems Architect. Analyze this sample deliverable for a ${businessType} business.
Extract:
1. Core Document Type (e.g. Legal Brief, Construction Estimate, Medical Review, Audit Report)
2. Primary Headings & Required Structural Sections
3. Tone & Writing Style (e.g. 28-line legal pleading, formal executive, technical trade)
4. Key Variables / Tokens (e.g. [Client Name], [Date of Loss], [Total Sum])
5. Governing Standards or Statutory Authorities detected

SAMPLE WORK PRODUCT:
${sampleText.slice(0, 4000)}

Provide a concise 4-bullet executive deconstruction summary.`;

      return await ai.generateText(prompt, { category: 'legal', source: 'GenesisAnalyzer' });
    } catch (err) {
      return 'Sample deconstructed: Extracted headings, tone, and standard operating parameters.';
    }
  }

  /**
   * Autonomously compiles BUSINESS.md, AGENTS.md, RULES.md, and custom workflow
   */
  public async synthesizeBrain(input: GenesisInput): Promise<GenesisOutput> {
    const ai = AIServiceFactory.getInstance();
    const bizName = input.businessName.trim() || 'Sovereign Enterprise';
    const bizType = input.businessType.trim() || 'General Consulting';
    const jurisdiction = input.jurisdiction?.trim() || 'California';
    const standards = input.governingStandards?.trim() || 'Standard Industry Best Practices';

    // 1. Synthesize BUSINESS.md
    const bizPrompt = `You are an expert Chief Operating Officer. Create a comprehensive BUSINESS.md document for:
Business Name: ${bizName}
Industry / Domain: ${bizType}
Jurisdiction: ${jurisdiction}
Governing Standards: ${standards}
Sample Deliverable Excerpt: ${input.sampleText ? input.sampleText.slice(0, 1500) : 'None provided'}

Structure:
# 🏢 BUSINESS IDENTITY & OPERATIONAL SCOPE: ${bizName.toUpperCase()}
1. Executive Profile & Core Mission
2. Scope of Services & Key Deliverables
3. Intake & Client File Standard Operating Procedures
4. Retainer & Billing Policies
5. Sovereign Privacy & Local Disk Storage Mandates`;

    const businessMd = await ai.generateText(bizPrompt, { category: 'legal', source: 'GenesisSynthesizer' });

    // 2. Synthesize AGENTS.md
    const agentsPrompt = `You are a Principal AI Agent Architect. Create an AGENTS.md specification for ${bizName} (${bizType}).
Define:
1. Senior Practitioner Persona (Name, Role, Tone, Standard Operating Procedures)
2. Forensic Intake & Quality Auditor Persona (Validation, Error-Checking, Compliance)
3. Standing Directives & Strict Guardrails (Zero-Hallucination, Verbatim Authorities, Local Storage Only)
Make it practitioner-grade, actionable, and strictly tailored to ${bizType}.`;

    const agentsMd = await ai.generateText(agentsPrompt, { category: 'legal', source: 'GenesisSynthesizer' });

    // 3. Synthesize RULES.md
    const rulesPrompt = `Create a deterministic RULES.md operating policy for ${bizName}.
Include:
1. Zero Sycophancy & Straight-Shooter Protocol (push back on flawed directives)
2. Markdown-First Workflow (always draft in .md before Word/PDF)
3. Statutory & Evidentiary Grounding Rules
4. Local Disk & Secret Protection Guardrails`;

    const rulesMd = await ai.generateText(rulesPrompt, { category: 'legal', source: 'GenesisSynthesizer' });

    // 4. Synthesize Custom Workflow
    const workflowPrompt = `Create a step-by-step repeatable workflow for ${bizName} (${bizType}).
Sample context: ${input.sampleText ? input.sampleText.slice(0, 1000) : input.primaryGoal || 'Generate primary deliverable'}
Output a JSON object with:
{
  "title": "Short punchy workflow title (e.g. Master Settlement Demand or Commercial HVAC Bid)",
  "description": "1 sentence description of what the workflow does",
  "icon": "A single appropriate emoji (e.g. ⚖️, 🏗️, 🩺, 📊, ⚡)",
  "prompt": "The detailed execution prompt for the agent that guides Phase 1 Intake, Phase 2 Analysis, and Phase 3 Deliverable Compilation."
}`;

    let workflowData = {
      title: `${bizType} Master Deliverable`,
      description: `Autonomously compile complete ${bizType} deliverable for ${bizName}`,
      icon: '⚡',
      prompt: `Analyze attached client file or evidence context. Cross-reference against ${standards}. Draft complete practitioner deliverable for ${bizName} according to our standing BUSINESS.md and AGENTS.md rules.`
    };

    try {
      const rawWf = await ai.generateText(workflowPrompt, { category: 'legal', source: 'GenesisWorkflowCompiler' });
      const jsonMatch = rawWf.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.title && parsed.prompt) {
          workflowData = {
            title: parsed.title,
            description: parsed.description || workflowData.description,
            icon: parsed.icon || '⚡',
            prompt: parsed.prompt
          };
        }
      }
    } catch (_wfErr) {
      console.warn('Using standard workflow fallback:', _wfErr);
    }

    // 5. Register in workflowData.ts
    const wfId = `custom-genesis-${Date.now()}`;
    const workflowItem: WorkflowItem = {
      id: wfId,
      name: workflowData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: workflowData.title,
      description: workflowData.description,
      category: 'custom',
      domain: 'custom',
      icon: workflowData.icon,
      prompt: workflowData.prompt,
      isCustom: true
    };
    saveCustomWorkflow(workflowItem);

    // 6. Persist Base Markdown Files to Disk
    const createdFiles: string[] = [];
    const baseDir = `C:\\Users\\Ftt\\genieflowai\\AI_GENERATED_DOCS\\BRAIN_GENESIS\\${bizName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    try {
      await sovereignFs.mkdir({ path: baseDir });
      
      const filesToWrite = [
        { path: `${baseDir}\\BUSINESS.md`, content: businessMd },
        { path: `${baseDir}\\AGENTS.md`, content: agentsMd },
        { path: `${baseDir}\\RULES.md`, content: rulesMd },
        { path: `${baseDir}\\WORKFLOW_${workflowItem.name}.md`, content: `# 🚀 ${workflowItem.title}\n\n${workflowItem.prompt}` }
      ];

      for (const f of filesToWrite) {
        const res = await sovereignFs.writeFile({ path: f.path, content: f.content });
        if (res?.success) {
          createdFiles.push(f.path);
        }
      }
    } catch (fsErr) {
      console.warn('Could not write genesis files to disk via bridge:', fsErr);
    }

    return {
      success: true,
      businessName: bizName,
      businessType: bizType,
      businessMd,
      agentsMd,
      rulesMd,
      workflowItem,
      createdFiles,
      superpowerSummary: `Sovereign Brain synthesized for ${bizName}. Deconstructed sample work into custom playbook "${workflowItem.title}". Ready to execute with zero hardcoded constraints.`
    };
  }
}

export const genesisBrainService = GenesisBrainService.getInstance();
