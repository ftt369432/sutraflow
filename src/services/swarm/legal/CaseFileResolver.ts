/**
 * 🔍 CaseFileResolver
 * 
 * Autonomously resolves and ingests real client files and templates from:
 * 1. 🌍 Electron Native OS (E:\clients, E:\.genieflowai.brain\CLIENTS, G:\My Drive)
 * 2. 📁 SutraDrive Store (Attached local/cloud drive nodes)
 * 3. 🧠 KnowledgeBase Store (Vector/document repository)
 * 
 * Prevents mock-data fallback when real client matters exist on disk.
 */

import { sovereignFs } from '../../fs/sovereignFsBridge';

export interface ResolvedCaseRecord {
  found: boolean;
  clientName: string;
  filePath?: string;
  content?: string;
  source: 'electron_fs' | 'attached_drive' | 'knowledge_base' | 'none';
  metadata?: {
    applicant?: string;
    defendant?: string;
    adjNumber?: string;
    injuryDate?: string;
    evaluatorName?: string;
    evaluatorSpecialty?: string;
    specificDisputeSummary?: string;
  };
}


export class CaseFileResolver {
  private static instance: CaseFileResolver;

  public static getInstance(): CaseFileResolver {
    if (!CaseFileResolver.instance) {
      CaseFileResolver.instance = new CaseFileResolver();
    }
    return CaseFileResolver.instance;
  }

  /**
   * Extracts possible client names from a user prompt or objective
   */
  public extractCandidateClientName(prompt: string): string | null {
    if (!prompt) return null;

    // Pattern 1: Explicit markers like "for [Name]", "matter of [Name]", "client [Name]"
    const markerMatch = prompt.match(/(?:for|matter of|re:|regarding|client|claimant|applicant)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    if (markerMatch && markerMatch[1]) {
      const candidate = markerMatch[1].trim();
      const lower = candidate.toLowerCase();
      // Filter out keywords that aren't client names
      const stopWords = ['replacement', 'additional', 'penalties', 'penality', 'sanctions', 'qme', 'pqme', 'ame', 'brief', 'dor', 'lien', 'msc'];
      if (!stopWords.includes(lower)) {
        return candidate;
      }
    }

    // Pattern 2: Known client names in common practice
    const knownNames = [
      'John Ureno', 'Frank Ureno', 'Ureno', 
      'Celina Castrejon', 'Castrejon', 
      'Jessie Rafols', 'Rafols', 
      'Secondo Bustos', 'Bustos', 
      'Castillo'
    ];
    for (const name of knownNames) {
      if (new RegExp(`\\b${name}\\b`, 'i').test(prompt)) {
        return name;
      }
    }

    // Pattern 3: All-caps or Capitalized pairs like "URENO, JOHN" or "John Ureno"
    const capitalizedMatch = prompt.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+))\b/);
    if (capitalizedMatch && capitalizedMatch[1]) {
      const cand = capitalizedMatch[1].trim();
      const lower = cand.toLowerCase();
      if (!['labor code', 'panel qme', 'workers comp', 'state of', 'legal brief', 'petition for'].includes(lower)) {
        return cand;
      }
    }

    return null;
  }

  /**
   * Resolves the case record across available environments (Electron -> SutraDrive -> Cloud KB)
   */
  public async resolveCaseRecord(promptOrObjective: string): Promise<ResolvedCaseRecord> {
    const candidateName = this.extractCandidateClientName(promptOrObjective);
    if (!candidateName) {
      return { found: false, clientName: '', source: 'none' };
    }

    console.log(`[CaseFileResolver] Attempting autonomous discovery for client: "${candidateName}"...`);
    const searchTerms = candidateName.toLowerCase().split(/\s+/).filter(t => t.length > 2);

    // 1. Check Sovereign File System (Web API / Electron native bridge)
    const searchRoots = [
      'G:\\My Drive\\.GENIEFLOW_MASTER\\CLIENTS',
      'E:\\.genieflowai.brain\\CLIENTS',
      'E:\\clients',
      'G:\\My Drive\\.GENIEFLOW_MASTER\\00_TEMPLATES',
      'E:\\.genieflowai.brain\\00_TEMPLATES',
      'E:\\.genieflowai.brain\\05_WORK_COMP_LINK\\00_LEGAL_TEMPLATES',
      'G:\\My Drive'
    ];

    for (const root of searchRoots) {
      try {
        const listRes = await sovereignFs.listFiles({ path: root });
        if (listRes?.success && Array.isArray(listRes.files)) {
          for (const item of listRes.files) {
            const itemNameLower = item.name.toLowerCase();
            const isMatch = searchTerms.some(term => itemNameLower.includes(term));
            if (isMatch) {
              // If it's a directory, look inside it
              if (item.isDirectory) {
                try {
                  const subList = await sovereignFs.listFiles({ path: item.path });
                  if (subList?.success && Array.isArray(subList.files)) {
                    for (const subItem of subList.files) {
                      if (subItem.name.endsWith('.md') || subItem.name.endsWith('.txt')) {
                        const readRes = await sovereignFs.readFile({ path: subItem.path });
                        if (readRes?.success && readRes.content) {
                          console.log(`[CaseFileResolver] Found native client file at: ${subItem.path}`);
                          return {
                            found: true,
                            clientName: candidateName,
                            filePath: subItem.path,
                            content: readRes.content,
                            source: 'electron_fs',
                            metadata: this.parseMetadataFromContent(readRes.content, candidateName)
                          };
                        }
                      }
                    }
                  }
                } catch {}
              } else if (item.name.endsWith('.md') || item.name.endsWith('.txt')) {
                const readRes = await sovereignFs.readFile({ path: item.path });
                if (readRes?.success && readRes.content) {
                  console.log(`[CaseFileResolver] Found native client file at: ${item.path}`);
                  return {
                    found: true,
                    clientName: candidateName,
                    filePath: item.path,
                    content: readRes.content,
                    source: 'electron_fs',
                    metadata: this.parseMetadataFromContent(readRes.content, candidateName)
                  };
                }
              }
            }
          }
        }
      } catch {}
    }

    // 2. Check Attached Drive Store (Mounted via UI / SutraDrive)
    try {
      const { useAttachedDriveStore } = await import('../../../store/attachedDriveStore');
      const store = useAttachedDriveStore.getState();
      const drives = store.drives || [];

      const searchNodes = (nodes: any[]): any => {
        if (!Array.isArray(nodes)) return null;
        for (const node of nodes) {
          const nameLower = (node.name || '').toLowerCase();
          const match = searchTerms.some(t => nameLower.includes(t));
          if (match && !node.isDirectory) return node;
          if (node.children) {
            const foundChild = searchNodes(node.children);
            if (foundChild) return foundChild;
          }
        }
        return null;
      };

      for (const drive of drives) {
        const matchedNode = searchNodes(drive.items);
        if (matchedNode) {
          const content = await store.readFileContent(matchedNode);
          if (content && !content.startsWith('[Preview:')) {
            console.log(`[CaseFileResolver] Found client file in SutraDrive: ${matchedNode.name}`);
            return {
              found: true,
              clientName: candidateName,
              filePath: matchedNode.path || matchedNode.name,
              content,
              source: 'attached_drive',
              metadata: this.parseMetadataFromContent(content, candidateName)
            };
          }
        }
      }
    } catch {}

    // 3. Check Knowledge Base Store (Cloud / Local KB)
    try {
      const { useKnowledgeBaseStore } = await import('../../../store/knowledgeBaseStore');
      const kbStore = useKnowledgeBaseStore.getState();
      const docs = kbStore.documents || [];
      for (const doc of docs) {
        const titleLower = (doc.title || '').toLowerCase();
        if (searchTerms.some(t => titleLower.includes(t))) {
          console.log(`[CaseFileResolver] Found client file in Knowledge Base: ${doc.title}`);
          return {
            found: true,
            clientName: candidateName,
            filePath: doc.title,
            content: doc.content,
            source: 'knowledge_base',
            metadata: this.parseMetadataFromContent(doc.content, candidateName)
          };
        }
      }
    } catch {}

    return { found: false, clientName: candidateName, source: 'none' };
  }

  /**
   * Parses factual metadata from discovered case document content
   */
  private parseMetadataFromContent(content: string, fallbackName: string): ResolvedCaseRecord['metadata'] {
    const applicantMatch = content.match(/(?:applicant|claimant|injured worker|case strategy:)[\s:*]+([A-Z][A-Za-z\s,.-]+?)(?:\r?\n|$|;|\(|\/|v\.)/i);
    const directAdj = content.match(/ADJ\d+/i);
    const altAdj = content.match(/(?:case\s*(?:no\.?|#)[\s:]*([A-Z0-9,-]+))/i);
    const injuryDateMatch = content.match(/(?:date of injury|doi)[\s:*]+([A-Za-z0-9\/\s,.-]+?)(?:\r?\n|$|;|\.|\()/i);
    const doctorMatch = content.match(/(?:pqme|qme|evaluator|ptp|doctor|dr\.)[\s:*]+([A-Z][A-Za-z\s,.-]+?(?:m\.?d\.?|d\.?o\.?|d\.?c\.?|ph\.?d\.?))/i);
    const employerMatch = content.match(/(?:employer|special employer|general employer|defendant|carrier)[\s:*]+([A-Za-z0-9\s,.-]+?)(?:\r?\n|$|;|\(|—|\/)/i);

    const adjNumber = directAdj ? directAdj[0].toUpperCase() : (altAdj ? altAdj[1].trim() : undefined);

    return {
      applicant: applicantMatch ? applicantMatch[1].trim() : fallbackName.toUpperCase(),
      defendant: employerMatch ? employerMatch[1].trim() : undefined,
      adjNumber,
      injuryDate: injuryDateMatch ? injuryDateMatch[1].trim() : undefined,
      evaluatorName: doctorMatch ? doctorMatch[1].trim() : undefined
    };
  }
}

export const caseFileResolver = CaseFileResolver.getInstance();
