/**
 * AgentRunner.ts
 *
 * Sovereign Agent Runner for SutraFlow / GenieFlow.
 * Industry-agnostic by default: executes across law, medicine, architecture, real estate, accounting, etc.
 *
 * Full pipeline:
 * 1. Intake & Domain Context Resolution
 * 2. Dynamic Source Discovery (Subject files, templates, precedent samples)
 * 3. Chunked Evidence Extraction & Fact Ledger Compilation (map-reduce loop)
 * 4. Dual Authority Grounding (Knowledge Vault + Live Tavily Search & Extract)
 * 5. Section-by-Section Synthesis with QuoteGuard Verification
 * 6. Audit & Open Items Ledger Compilation
 */

import { zeroPhiShield } from '../legal/ZeroPhiShield';
import { legalAuditSwarmAgent } from '../legal/LegalAuditSwarmAgent';
import { sourceDiscovery } from './SourceDiscovery';
import { chunkedReader } from './ChunkedReader';
import { authorityRetriever } from './AuthorityRetriever';
import { sectionDrafter } from './SectionDrafter';
import { AgentExecutionParams, AgentExecutionResult, TraceEvent, TraceFn, nowMs } from './types';

export class AgentRunner {
  private static instance: AgentRunner;

  private constructor() {}

  public static getInstance(): AgentRunner {
    if (!AgentRunner.instance) {
      AgentRunner.instance = new AgentRunner();
    }
    return AgentRunner.instance;
  }

  /**
   * Executes the full grounded agent workflow for any professional discipline.
   */
  public async runAgent(
    params: AgentExecutionParams
  ): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    const { objective, evidenceText, domainProfile, onProgress, onPartial, onThoughtEvent } = params;

    // Single run-level Zero-PHI / Zero-PII cryptographic vault
    const { vault: sharedVault } = zeroPhiShield.scrub('');

    // Trace emitter feeding both onProgress and onThoughtEvent
    const traceFn: TraceFn = (event: TraceEvent) => {
      onProgress?.(event.title, event.detail);
      onThoughtEvent?.({
        type: 'thought',
        role: event.phase.toLowerCase(),
        message: `${event.title}: ${event.detail}`,
        payload: event,
        timestamp: Date.now()
      });
    };

    // ==========================================
    // STAGE 1: INTAKE & DOMAIN RESOLUTION
    // ==========================================
    traceFn({
      phase: 'Intake',
      title: 'Initializing Agent Engine',
      detail: `Analyzing objective: "${objective.slice(0, 100)}..."`,
      status: 'running',
      engine: 'deterministic'
    });

    const intake = sourceDiscovery.parseIntake(objective, evidenceText, domainProfile);

    // ==========================================
    // STAGE 2: DYNAMIC SOURCE DISCOVERY
    // ==========================================
    const manifest = await sourceDiscovery.discoverSources(intake, traceFn);

    // ==========================================
    // STAGE 3: CHUNKED READING & FACT HARVESTING
    // ==========================================
    const ledger = await chunkedReader.readAndHarvestFacts(
      manifest.subjectFiles,
      sharedVault,
      traceFn
    );

    // Resolve subject entity prioritizing dossier folder structure or intake entity
    if ((!ledger.subjectEntity || ledger.subjectEntity.length < 2) && intake.subjectEntity) {
      ledger.subjectEntity = intake.subjectEntity;
    }
    if (manifest.subjectFolder) {
      const folderName = manifest.subjectFolder.split(/[\\\/]/).pop() || '';
      if (folderName.includes(',')) {
        const [last, first] = folderName.split(',').map(s => s.trim());
        if (first && last && (!ledger.subjectEntity || ledger.subjectEntity.toLowerCase() === last.toLowerCase())) {
          ledger.subjectEntity = `${first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()} ${last.charAt(0).toUpperCase() + last.slice(1).toLowerCase()}`;
        }
      }
    }
    if (!ledger.identifier && manifest.subjectFiles.length > 0) {
      const idMatch = manifest.subjectFiles.map(f => f.name).join(' ').match(/\b(ADJ\d{6,8}|MRN\d{5,9}|APN\s*[\d\-]+)\b/i);
      if (idMatch) ledger.identifier = idMatch[1].toUpperCase();
    }

    // ==========================================
    // STAGE 4: DUAL AUTHORITY GROUNDING (VAULT + TAVILY)
    // ==========================================
    const authorities = await authorityRetriever.retrieveAuthorities(
      intake,
      ledger.facts.map(f => f.fact),
      traceFn
    );

    // ==========================================
    // STAGE 5: SECTION-BY-SECTION SYNTHESIS (QUOTEGUARD ENFORCED)
    // ==========================================
    const drafted = await sectionDrafter.draftDocument(
      intake,
      manifest,
      ledger,
      authorities,
      sharedVault,
      onPartial,
      traceFn
    );

    // ==========================================
    // STAGE 6: PROFESSIONAL AUDIT & LINTING
    // ==========================================
    traceFn({
      phase: 'Audit',
      title: 'Executing Standards Audit & Linting',
      detail: 'Verifying rule adherence, QuoteGuard compliance, and structural integrity...',
      status: 'running',
      engine: 'deterministic'
    });

    const rawAudit = legalAuditSwarmAgent.auditDeliverable(drafted.fullDocument);

    traceFn({
      phase: 'Audit',
      title: 'Audit Complete',
      detail: `Final Quality Score: ${rawAudit.score}/100 (${rawAudit.status}). Verified citations: ${rawAudit.verifiedCitations.length}.`,
      status: rawAudit.score >= 80 ? 'done' : 'warn',
      engine: 'deterministic'
    });

    // ==========================================
    // FINAL PACKAGE ASSEMBLY
    // ==========================================
    const executionTimeMs = Date.now() - startTime;

    let finalDeliverable = drafted.fullDocument;
    if (drafted.openItems.length > 0) {
      const openItemsMd = `\n\n---\n### ⚠️ PRACTITIONER ACTION ITEMS / OPEN ITEMS\n` +
        drafted.openItems.map((item, idx) => `${idx + 1}. **${item.item}**: ${item.why}`).join('\n') +
        `\n\n*Note: This deliverable was deterministically generated without fabricating missing source records.*`;
      finalDeliverable += openItemsMd;
    }

    return {
      deliverable: finalDeliverable,
      auditReport: {
        score: rawAudit.score,
        status: rawAudit.status,
        summary: rawAudit.summary,
        findings: rawAudit.findings.map(f => ({
          id: f.id,
          category: f.category,
          title: f.title,
          status: f.status,
          detail: f.detail
        })),
        verifiedAuthorities: rawAudit.verifiedAuthorities,
        lineCount: rawAudit.lineCount
      },
      findings: {
        subjectEntity: ledger.subjectEntity || intake.subjectEntity || 'Subject Entity',
        identifier: ledger.identifier,
        deliverableType: intake.deliverableType,
        applicableAuthorities: authorities.map(a => ({
          id: a.id,
          cite: a.cite,
          quote: a.tier !== 'secondary' ? a.text : null,
          holding: a.text.slice(0, 200)
        })),
        evidentiaryIssues: drafted.openItems.map(o => `${o.item}: ${o.why}`),
        resolvedSource: manifest.subjectFiles.length > 0 ? manifest.subjectFiles[0].name : undefined,
        rawFindings: JSON.stringify(ledger.facts, null, 2)
      },
      executionTimeMs,
      domainUsed: intake.domainContext.title
    };
  }
}

export const agentRunner = AgentRunner.getInstance();
