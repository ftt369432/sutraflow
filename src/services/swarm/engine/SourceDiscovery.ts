/**
 * SourceDiscovery.ts
 *
 * Discovers subject dossiers (client, patient, project, property),
 * matching master templates, and recent precedent work samples.
 * Domain-agnostic by default.
 */

import { sovereignFs } from '../../fs/sovereignFsBridge';
import { getAgentConfig } from './config';
import { DomainContext, IntakeResult, SourceFile, SourceManifest, TraceFn, nowMs } from './types';

export class SourceDiscovery {
  private static instance: SourceDiscovery;

  private constructor() {}

  public static getInstance(): SourceDiscovery {
    if (!SourceDiscovery.instance) {
      SourceDiscovery.instance = new SourceDiscovery();
    }
    return SourceDiscovery.instance;
  }

  /**
   * Parses practitioner input into structured intake requirements
   */
  public parseIntake(
    objective: string,
    evidenceText: string = '',
    profile?: DomainContext
  ): IntakeResult {
    const combined = `${objective} ${evidenceText}`;
    const lower = combined.toLowerCase();

    // Default domain context if not provided
    const domainContext: DomainContext = profile || {
      title: 'Professional Grounded Practice',
      practitionerTitle: 'Lead Practitioner / Specialist',
      organization: 'Professional Enterprise Practice',
      governingStandards: ['Standard Professional Practice & Statutory Guidelines'],
      systemPrompt: 'You are an elite research, evaluation, and drafting engine.'
    };

    // Extract Subject Entity (Person, Patient, Project, Property, Case)
    const STOP_ENTITIES = new Set([
      'penalties', 'penalty', 'costs', 'cost', 'sanctions', 'sanction', 'relief', 'benefits',
      'ttd', 'pd', 'lien', 'liens', 'qme', 'pqme', 'ame', 'brief', 'trial', 'petition',
      'motion', 'dor', 'appeal', 'support', 'records', 'record', 'review', 'audit',
      'plan', 'plans', 'permit', 'permits', 'correction', 'corrections', 'submittal',
      'the attorney', 'attorney', 'doctor', 'architect', 'broker', 'client', 'patient',
      'date', 'today', 'unpaid', 'paid', 'injury', 'court', 'board', 'wcab'
    ]);

    const isValidEntity = (cand: string): boolean => {
      if (!cand) return false;
      const trimmed = cand.trim().replace(/^[,:\-\s]+|[,:\-\s]+$/g, '');
      if (trimmed.length < 2) return false;
      const l = trimmed.toLowerCase();
      if (STOP_ENTITIES.has(l)) return false;
      const words = l.split(/\s+/);
      if (words.every(w => STOP_ENTITIES.has(w))) return false;
      if (l.startsWith('penalties') || l.startsWith('petition') || l.startsWith('unpaid')) return false;
      return true;
    };

    const cleanEntity = (cand: string): string => {
      const trimmed = cand.trim().replace(/^[,:\-\s]+|[,:\-\s]+$/g, '');
      return trimmed
        .split(/\s+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    };

    let subjectEntity = '';

    // 1. Explicit prefixes: "client: X", "patient: X", "project: X", "matter of X", "re: X"
    const prefixMatch = objective.match(/(?:re:|matter\s+of|subject|patient|client|project|property|applicant)[\s:\-]+([a-zA-Z0-9'\-]+(?:\s+[a-zA-Z0-9'\-]+){0,3}?)(?=[,;:.\n]|\s+\b(?:file|draft|prepare|petition|brief|under|using|for)\b|$)/i);
    if (prefixMatch && isValidEntity(prefixMatch[1])) {
      subjectEntity = cleanEntity(prefixMatch[1]);
    }

    // 2. "for <name>[,:]" or "for <name> <action>"
    if (!subjectEntity) {
      const forMatches = Array.from(objective.matchAll(/(?:^|\s)for\s+([a-zA-Z0-9'\-]+(?:\s+[a-zA-Z0-9'\-]+){0,3}?)(?=[,;:.\n]|\s+\b(?:file|draft|prepare|generate|write|create|submit|petition|motion|brief|memo|application|appeal|under|pursuant|using|like|against|regarding|in)\b|$)/gi));
      for (const m of forMatches) {
        if (m[1] && isValidEntity(m[1])) {
          subjectEntity = cleanEntity(m[1]);
          break;
        }
      }
    }

    // 3. Leading name before colon or dash: "Kato: file a petition..." or "Kato - file a petition..."
    if (!subjectEntity) {
      const leadMatch = objective.match(/^([a-zA-Z0-9'\-]+(?:\s+[a-zA-Z0-9'\-]+){0,2})\s*[:\-]\s+/i);
      if (leadMatch && isValidEntity(leadMatch[1])) {
        subjectEntity = cleanEntity(leadMatch[1]);
      }
    }

    // 4. Look for capitalized token pairs (e.g. Phillip Kato, John Smith)
    if (!subjectEntity) {
      const words = objective.split(/\s+/);
      for (let i = 0; i < words.length - 1; i++) {
        if (/^[A-Z][a-z]{2,}$/.test(words[i]) && /^[A-Z][a-z]{2,}$/.test(words[i + 1])) {
          const pair = `${words[i]} ${words[i + 1]}`;
          if (!/Court Appeal|Workers Comp|Supreme Court|Building Code|General Hospital|Labor Code|District Court|Appeals Board/i.test(pair)) {
            subjectEntity = pair;
            break;
          }
        }
      }
    }

    // Determine deliverable type & search keywords
    let deliverableType = 'Professional Technical Deliverable';
    let keywords: string[] = ['deliverable'];

    if (/penalt/i.test(lower)) {
      deliverableType = 'Petition for Penalties';
      keywords = ['penalt'];
    } else if (/pqme|panel|qme/i.test(lower)) {
      deliverableType = /addition/i.test(lower) ? 'Petition for Additional Panel QME' : 'Petition for Replacement Panel QME';
      keywords = ['pqme', 'qme', 'panel'];
    } else if (/cost/i.test(lower)) {
      deliverableType = 'Petition for Costs';
      keywords = ['cost'];
    } else if (/trial\s*brief/i.test(lower)) {
      deliverableType = 'Trial Brief';
      keywords = ['trial', 'brief'];
    } else if (/plan[\s\-]?check|correction|submittal|architect/i.test(lower)) {
      deliverableType = 'Plan-Check Correction Response Package';
      keywords = ['correction', 'plan', 'submittal'];
    } else if (/prior[\s\-]?auth|appeal|treatment\s*necessity/i.test(lower)) {
      deliverableType = 'Prior Authorization Medical Necessity Appeal';
      keywords = ['appeal', 'auth', 'necessity'];
    } else if (/cma|disclosure|inspection\s*audit|repair\s*request/i.test(lower)) {
      deliverableType = 'Property Disclosure & Inspection Audit';
      keywords = ['inspection', 'disclosure', 'repair'];
    } else if (/audit|accounting|billing|reconciliation/i.test(lower)) {
      deliverableType = 'Forensic Billing & Audit Report';
      keywords = ['audit', 'billing', 'ledger'];
    }

    // Extract template hints (e.g. "v5", "aia", "soap", "ureno")
    const templateHints: string[] = [];
    const vMatch = lower.match(/\bv(\d+)\b/);
    if (vMatch) templateHints.push(`v${vMatch[1]}`);
    if (/aia/i.test(lower)) templateHints.push('aia');
    if (/soap/i.test(lower)) templateHints.push('soap');
    if (/ureno/i.test(lower)) templateHints.push('ureno');

    return {
      subjectEntity,
      deliverableType,
      keywords,
      templateHints,
      instructions: objective,
      domainContext
    };
  }

  /**
   * Resolves subject dossier files, matching master template, and recent style samples.
   */
  public async discoverSources(
    intake: IntakeResult,
    onTrace?: TraceFn
  ): Promise<SourceManifest> {
    const config = getAgentConfig();
    const manifest: SourceManifest = {
      subjectFiles: [],
      samples: [],
      notes: []
    };

    const t0 = nowMs();
    onTrace?.({
      phase: 'Discovery',
      title: 'Searching Subject Dossiers & Precedents',
      detail: `Scanning workspace for "${intake.subjectEntity || 'Unspecified'}" and deliverable "${intake.deliverableType}"...`,
      status: 'running',
      engine: 'filesystem'
    });

    // 1. Locate Subject Folder & Files across record roots (Clients, Projects, Patients, Properties)
    if (intake.subjectEntity) {
      const nameParts = intake.subjectEntity.toLowerCase().split(/\s+/).filter(Boolean);
      for (const root of config.recordRoots) {
        const searchRes = await sovereignFs.findFiles({
          root,
          q: nameParts[0],
          dirs: true,
          depth: 3,
          limit: 50
        });

        if (searchRes.success && searchRes.files?.length) {
          const matchedFiles = searchRes.files.filter(f => {
            const low = f.path.toLowerCase();
            return nameParts.every(part => low.includes(part));
          });

          if (matchedFiles.length > 0) {
            const dirMatch = matchedFiles.find(f => f.isDirectory);
            if (dirMatch) {
              manifest.subjectFolder = dirMatch.path;
            } else {
              manifest.subjectFolder = matchedFiles[0].path.substring(0, matchedFiles[0].path.lastIndexOf('\\'));
            }

            const directFiles = matchedFiles
              .filter(f => !f.isDirectory && (
                f.name.endsWith('.md') ||
                f.name.endsWith('.txt') ||
                f.name.endsWith('.json') ||
                f.name.endsWith('.csv')
              ))
              .map(f => ({
                name: f.name,
                path: f.path,
                size: f.size,
                lastModified: f.lastModified,
                role: 'subject' as const
              }));

            // If we found a subject folder and direct files are few, enumerate inside the folder
            if (manifest.subjectFolder && directFiles.length <= 1) {
              const folderSearch = await sovereignFs.findFiles({
                root: manifest.subjectFolder,
                depth: 2,
                limit: 50
              });
              if (folderSearch.success && folderSearch.files?.length) {
                for (const sf of folderSearch.files) {
                  if (!sf.isDirectory && (
                    sf.name.endsWith('.md') ||
                    sf.name.endsWith('.txt') ||
                    sf.name.endsWith('.json') ||
                    sf.name.endsWith('.csv')
                  )) {
                    if (!directFiles.some(df => df.path === sf.path)) {
                      directFiles.push({
                        name: sf.name,
                        path: sf.path,
                        size: sf.size,
                        lastModified: sf.lastModified,
                        role: 'subject' as const
                      });
                    }
                  }
                }
              }
            }

            // Prioritize markdown and text case records over code or raw data
            directFiles.sort((a, b) => {
              const extA = a.name.slice(a.name.lastIndexOf('.')).toLowerCase();
              const extB = b.name.slice(b.name.lastIndexOf('.')).toLowerCase();
              if ((extA === '.md' || extA === '.txt') && extB !== '.md' && extB !== '.txt') return -1;
              if ((extB === '.md' || extB === '.txt') && extA !== '.md' && extA !== '.txt') return 1;
              return 0;
            });

            manifest.subjectFiles = directFiles;
            break;
          }
        }
      }
    }

    // 2. Locate Best Matching Master Template
    let bestTemplate: SourceFile | undefined;
    for (const tRoot of config.templateRoots) {
      const tSearch = await sovereignFs.findFiles({
        root: tRoot,
        ext: '.md',
        depth: 3,
        limit: 50
      });

      if (tSearch.success && tSearch.files?.length) {
        const scored = tSearch.files
          .filter(f => !f.isDirectory)
          .map(f => {
            const low = f.name.toLowerCase();
            let score = 0;
            for (const kw of intake.keywords) {
              if (low.includes(kw)) score += 10;
            }
            for (const hint of intake.templateHints) {
              if (low.includes(hint)) score += 25;
            }
            if (low.includes('template') || low.includes('master')) score += 5;
            return {
              name: f.name,
              path: f.path,
              size: f.size,
              lastModified: f.lastModified,
              role: 'template' as const,
              score
            };
          })
          .sort((a, b) => (b.score || 0) - (a.score || 0));

        if (scored.length > 0 && (scored[0].score || 0) > 0) {
          bestTemplate = scored[0];
          break;
        }
      }
    }
    manifest.template = bestTemplate;

    // 3. Locate 1-3 Most Recent Work Samples of the same deliverable type
    for (const rRoot of config.recordRoots) {
      const sampleSearch = await sovereignFs.findFiles({
        root: rRoot,
        q: intake.keywords[0] || 'report',
        ext: '.md',
        depth: 3,
        limit: 50
      });

      if (sampleSearch.success && sampleSearch.files?.length) {
        const currentFolder = manifest.subjectFolder?.toLowerCase() || '';
        const recentSamples = sampleSearch.files
          .filter(f => !f.isDirectory && (!currentFolder || !f.path.toLowerCase().includes(currentFolder)))
          .sort((a, b) => new Date(b.lastModified || 0).getTime() - new Date(a.lastModified || 0).getTime())
          .slice(0, 3)
          .map(f => ({
            name: f.name,
            path: f.path,
            size: f.size,
            lastModified: f.lastModified,
            role: 'sample' as const
          }));

        manifest.samples = recentSamples;
        break;
      }
    }

    const elapsed = Math.round(nowMs() - t0);
    const summary = `Found ${manifest.subjectFiles.length} subject files, template: ${manifest.template?.name || 'Standard conforming'}, and ${manifest.samples.length} recent precedent samples in ${elapsed}ms.`;
    manifest.notes.push(summary);

    onTrace?.({
      phase: 'Discovery',
      title: 'Sources & Precedent Samples Resolved',
      detail: summary,
      status: 'done',
      engine: 'filesystem',
      ms: elapsed
    });

    return manifest;
  }
}

export const sourceDiscovery = SourceDiscovery.getInstance();
