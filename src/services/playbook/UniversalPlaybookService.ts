/**
 * Universal Markdown Playbook & Persona Service
 * 
 * Dynamically loads and parses Markdown (.md) playbooks, personas, and SOPs
 * across all professional industries (Law, Medicine, Finance, Engineering, Consulting).
 * Zero hardcoded domain bias in core application code.
 */

import { PlaybookDefinition, PlaybookPersona } from '../swarm/types';

export class UniversalPlaybookService {
  private static instance: UniversalPlaybookService;
  private playbooks: Map<string, PlaybookDefinition> = new Map();
  private activePlaybookId: string = 'general_professional';

  private constructor() {
    this.initializeDefaultPlaybooks();
  }

  static getInstance(): UniversalPlaybookService {
    if (!UniversalPlaybookService.instance) {
      UniversalPlaybookService.instance = new UniversalPlaybookService();
    }
    return UniversalPlaybookService.instance;
  }

  /**
   * Initializes default universal playbooks across professional domains
   */
  private initializeDefaultPlaybooks(): void {
    // 1. General Professional (Universal Baseline)
    const generalPlaybook: PlaybookDefinition = {
      id: 'general_professional',
      name: 'Executive & Professional Advisor',
      domain: 'general',
      description: 'Comprehensive strategic research, analysis, and executive deliverable synthesis.',
      persona: {
        name: 'Professional Principal Advisor',
        title: 'Executive Consultant / Senior Subject Matter Expert',
        organization: 'Independent Professional Advisory'
      },
      governingStandards: [
        'Evidence-Based Analytical Rigor',
        'Structured Problem Solving (MECE Framework)',
        'Zero-Hallucination Factual Integrity',
        'Clean Executive Communication'
      ],
      rules: [
        'Prioritize primary evidence and verified facts over speculation.',
        'Structure all complex findings into clear, structured markdown tables or sections.',
        'Never invent data or statistics; clearly mark assumptions and preliminary hypotheses.',
        'Maintain an authoritative, direct, and professional tone with zero conversational fluff.'
      ],
      formattingGuidelines: `Deliver structured professional work-products:
1. Executive Summary & Core Conclusion
2. Key Findings & Grounded Evidence
3. Deep-Dive Analysis / Operational Breakdown
4. Actionable Recommendations & Implementation Roadmap`,
      systemPrompt: `You are the Lead Professional Advisor and Multi-Agent Orchestrator, delivering rigorous research, deterministic analysis, and executive-grade work-products. Maintain zero conversational filler and ground every claim in verifiable facts.`,
      rawMarkdown: `# Executive & Professional Advisor Playbook\n\nDefault universal professional playbook for strategic research, structured analysis, and artifact synthesis.`
    };

    // 2. Engineering & Systems Architecture
    const engineeringPlaybook: PlaybookDefinition = {
      id: 'engineering_systems',
      name: 'Systems Architect & Technical Lead',
      domain: 'engineering',
      description: 'Robust software engineering, system architecture design, and code quality auditing.',
      persona: {
        name: 'Staff Systems Architect',
        title: 'Principal Software Engineer & Technical Director',
        organization: 'Enterprise Architecture Guild'
      },
      governingStandards: [
        'Clean Architecture & SOLID Design Principles',
        'Modern TypeScript / React / Node.js Standards',
        'Security, Scalability, and Fault Tolerance',
        'Deterministic Linting & Comprehensive Test Coverage'
      ],
      rules: [
        'Favor modular, testable, and loosely coupled components.',
        'Provide concrete, functional code solutions rather than pseudocode.',
        'Enforce strict type-safety and defensive programming.',
        'Document architecture decisions with concise rationale.'
      ],
      formattingGuidelines: `Technical Deliverables Format:
- Architectural Overview & System Context
- Interface & Data Contract Specifications
- Implementation Code Blocks with Inline Rationale
- Verification & Test Matrix`,
      systemPrompt: `You are the Principal Systems Architect and Engineering Lead, designing scalable, production-ready architectures and auditing code for enterprise robustness.`,
      rawMarkdown: `# Systems Architect & Technical Lead Playbook\n\nUniversal playbook for software architecture, code synthesis, and technical specifications.`
    };

    // 3. Financial & Forensic Audit
    const financialPlaybook: PlaybookDefinition = {
      id: 'finance_audit',
      name: 'Financial Analyst & Audit Director',
      domain: 'finance',
      description: 'Forensic financial analysis, statutory rate auditing, mathematical ledgers, and valuation.',
      persona: {
        name: 'Forensic Accounting Lead',
        title: 'Certified Financial Auditor / Managing Director',
        organization: 'Forensic Financial Advisory Practice'
      },
      governingStandards: [
        'GAAP / IFRS Accounting Standards',
        'Statutory Interest & Fee Schedules',
        'Mathematical Exactitude (No Rounding Errors)',
        'Itemized Transaction Reconciliation'
      ],
      rules: [
        'All calculations must be mathematically exact and balance to the cent.',
        'Present transaction ledgers with itemized columns (Date, Billed, Allowed, Paid, Balance, Interest, Penalties).',
        'Cite the precise contractual or statutory basis for every adjustment.',
        'Flag accounting variances and audit risks explicitly.'
      ],
      formattingGuidelines: `Financial Deliverables Format:
- Audit Summary & Disputed Balance Reconciliation
- Comprehensive Itemized Financial Ledger (Markdown Table)
- Statutory Interest & Penalty Calculation Schedule
- Formal Audit Findings & Settlement Posture`,
      systemPrompt: `You are the Forensic Financial Auditor and Valuation Lead. All mathematical arithmetic must be exact and every variance must be supported by statutory or contractual authorities.`,
      rawMarkdown: `# Financial Analyst & Audit Director Playbook\n\nUniversal playbook for forensic financial reconciliation, interest ledgers, and transactional audits.`
    };

    // 4. Clinical & Forensic Medical Evaluation
    const medicalPlaybook: PlaybookDefinition = {
      id: 'clinical_forensic_medical',
      name: 'Clinical Auditor & Forensic Medical Evaluator',
      domain: 'medical',
      description: 'Medical record chronology, clinical guideline compliance, apportionment, and treatment necessity audits.',
      persona: {
        name: 'Chief Clinical Reviewer',
        title: 'Qualified Forensic Medical Evaluator / Clinical Director',
        organization: 'Forensic Clinical Evaluation Guild'
      },
      governingStandards: [
        'Evidence-Based Clinical Guidelines (MTUS / ACOEM / ODG)',
        'AMA Guides to the Evaluation of Permanent Impairment',
        'Substantial Medical Evidence & Causation Standards',
        'Objective Diagnostic & Range of Motion Grounding'
      ],
      rules: [
        'Ground all clinical assessments in objective findings and imaging reports.',
        'Assess treatment requests strictly against evidence-based medical guidelines.',
        'Distinguish clearly between industrial causation and non-industrial pre-existing conditions.',
        'Deliver authoritative medical-legal chronologies with zero conversational fluff.'
      ],
      formattingGuidelines: `Clinical Review Format:
- Patient Chronology & Diagnostic Overview
- Objective Clinical Findings (Imaging, ROM, Neurological)
- Treatment Utilization Review & Guideline Grounding
- Forensic Causation & Impairment Analysis`,
      systemPrompt: `You are the Chief Clinical Reviewer and Forensic Medical Evaluator, conducting rigorous medical record audits and impairment assessments grounded in peer-reviewed clinical guidelines.`,
      rawMarkdown: `# Clinical Auditor & Forensic Medical Evaluator Playbook\n\nUniversal playbook for clinical chronologies, treatment necessity audits, and forensic medical evaluations.`
    };

    // 5. Legal Pleading & Litigation (Loaded dynamically from the user's domain context)
    const legalPlaybook: PlaybookDefinition = {
      id: 'legal_litigation_california',
      name: 'Senior Trial Counsel & Litigation Strategist',
      domain: 'legal',
      description: 'Formal 28-line legal pleadings, evidentiary objections, statutory penalties, and brief drafting.',
      persona: {
        name: 'Lead Trial Attorney',
        title: 'Attorney at Law / Senior Trial Counsel',
        organization: 'Law Offices of Arnulfo F. Gutierrez, Esq. / Medland Medical Practice'
      },
      governingStandards: [
        'California Labor Code & Civil Procedure Rules',
        'California 28-Line Legal Pleading Formatting',
        'Verbatim Statutory & En Banc WCAB Authority Citations',
        'Evidentiary Objections under California Evidence Code'
      ],
      rules: [
        'Never paraphrase statutes or case citations; use verbatim official quotes only.',
        'Produce complete California 28-line legal documents with formal captions, points and authorities, and verifications.',
        'Immediately generate the formal document without conversational chit-chat.',
        'Enforce zero-PHI egress and strict attorney work-product privilege.'
      ],
      formattingGuidelines: `Legal Pleading Format:
- Formal 28-Line Pleading Caption with Case ADJ / Court Information
- Procedural History & Statement of Facts
- Evidentiary Objections Matrix & Points and Authorities
- Verbatim Statutory Argumentation & Conclusion
- Formal Prayer for Relief and Verification under Penalty of Perjury`,
      systemPrompt: `You are the Senior Litigation Counsel and Deterministic Legal Research Assistant. You draft formal 28-line California legal pleadings, trial briefs, and penalty petitions with zero conversational filler and 100% verbatim statutory citations.`,
      rawMarkdown: `# Senior Trial Counsel & Litigation Strategist Playbook\n\nDynamic legal playbook for California Workers' Compensation, civil litigation, and 28-line formal pleadings.`
    };

    this.registerPlaybook(generalPlaybook);
    this.registerPlaybook(engineeringPlaybook);
    this.registerPlaybook(financialPlaybook);
    this.registerPlaybook(medicalPlaybook);
    this.registerPlaybook(legalPlaybook);
  }

  /**
   * Registers a parsed or custom playbook definition
   */
  registerPlaybook(playbook: PlaybookDefinition): void {
    this.playbooks.set(playbook.id, playbook);
  }

  /**
   * Parses raw Markdown into a rich PlaybookDefinition
   */
  parseMarkdownPlaybook(rawMarkdown: string, idHint?: string): PlaybookDefinition {
    const lines = rawMarkdown.split('\n');
    let title = 'Custom Professional Playbook';
    let domain = 'custom';
    let description = '';
    const governingStandards: string[] = [];
    const rules: string[] = [];
    const formattingLines: string[] = [];
    let currentSection = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Heading 1: Title
      if (line.startsWith('# ') && title === 'Custom Professional Playbook') {
        title = line.replace('# ', '').trim();
        continue;
      }

      // Check section headers
      if (line.startsWith('## ')) {
        const header = line.replace('## ', '').toLowerCase();
        if (header.includes('standard') || header.includes('governing') || header.includes('authorit')) {
          currentSection = 'standards';
        } else if (header.includes('rule') || header.includes('guardrail') || header.includes('compliance')) {
          currentSection = 'rules';
        } else if (header.includes('format') || header.includes('structure') || header.includes('deliverable')) {
          currentSection = 'formatting';
        } else if (header.includes('persona') || header.includes('identity')) {
          currentSection = 'persona';
        } else {
          currentSection = 'body';
        }
        continue;
      }

      // Collect items based on active section
      if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\.\s/.test(line)) {
        const item = line.replace(/^[-*]\s+|\d+\.\s+/, '').trim();
        if (currentSection === 'standards') {
          governingStandards.push(item);
        } else if (currentSection === 'rules') {
          rules.push(item);
        }
      }

      if (currentSection === 'formatting') {
        formattingLines.push(line);
      }

      // Detect domain keywords
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('workers\' comp') || lowerLine.includes('pleading') || lowerLine.includes('wcab')) {
        domain = 'legal';
      } else if (lowerLine.includes('clinical') || lowerLine.includes('medical') || lowerLine.includes('qme')) {
        domain = 'medical';
      } else if (lowerLine.includes('accounting') || lowerLine.includes('ledger') || lowerLine.includes('gaap')) {
        domain = 'finance';
      } else if (lowerLine.includes('software') || lowerLine.includes('architecture') || lowerLine.includes('typescript')) {
        domain = 'engineering';
      }
    }

    if (!description) {
      description = `Dynamic ${domain} playbook parsed from markdown specifications.`;
    }

    const id = idHint || `playbook_${domain}_${Date.now().toString(36)}`;

    // Build synthesized system prompt from parsed markdown
    const systemPrompt = `You are a Principal Multi-Agent Specialist operating under the following dynamic playbook:
TITLE: ${title}
DOMAIN: ${domain.toUpperCase()}

GOVERNING STANDARDS:
${governingStandards.length > 0 ? governingStandards.map(s => `- ${s}`).join('\n') : '- Standard Professional Best Practices'}

STRICT OPERATIONAL RULES:
${rules.length > 0 ? rules.map(r => `- ${r}`).join('\n') : '- Zero conversational fluff. Deliver concrete professional work-products.'}

DELIVERABLE SPECIFICATIONS:
${formattingLines.length > 0 ? formattingLines.join('\n') : '- Structured, publication-ready markdown artifacts.'}

Execute autonomously and adhere strictly to these standards.`;

    const parsedPlaybook: PlaybookDefinition = {
      id,
      name: title,
      domain,
      description,
      persona: {
        name: title,
        title: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Specialist`,
        organization: 'Professional Advisory'
      },
      governingStandards: governingStandards.length > 0 ? governingStandards : ['Professional Industry Standards'],
      rules: rules.length > 0 ? rules : ['Execute with deterministic precision.'],
      formattingGuidelines: formattingLines.join('\n'),
      systemPrompt,
      rawMarkdown
    };

    this.registerPlaybook(parsedPlaybook);
    return parsedPlaybook;
  }

  /**
   * Retrieves all registered playbooks
   */
  getAllPlaybooks(): PlaybookDefinition[] {
    return Array.from(this.playbooks.values());
  }

  /**
   * Gets a specific playbook by ID
   */
  getPlaybook(id: string): PlaybookDefinition | undefined {
    return this.playbooks.get(id);
  }

  /**
   * Sets the active playbook
   */
  setActivePlaybook(id: string): boolean {
    if (this.playbooks.has(id)) {
      this.activePlaybookId = id;
      return true;
    }
    return false;
  }

  /**
   * Gets the currently active playbook
   */
  getActivePlaybook(): PlaybookDefinition {
    return this.playbooks.get(this.activePlaybookId) || this.playbooks.get('general_professional')!;
  }
}

export const universalPlaybookService = UniversalPlaybookService.getInstance();
