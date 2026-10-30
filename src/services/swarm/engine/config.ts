/**
 * config.ts
 *
 * Grounding directories and engine limits.
 * Professional vault and web-grounding defaults.
 */

export interface AgentEngineConfig {
  /** Record roots where subject dossiers (clients, patients, projects, properties) live. */
  recordRoots: string[];
  /** Template roots for standard practitioner documents across disciplines. */
  templateRoots: string[];
  /** Knowledge vault roots (codes, guidelines, standards, reference clauses). */
  vaultRoots: string[];
  /** Primary web domains permitted for verbatim quotes & standards. */
  primaryDomains: string[];
  /** Max characters per chunk for local vs cloud execution. */
  chunkChars: { local: number; cloud: number };
  /** Maximum chunks read per execution pass. */
  maxChunks: number;
  /** Max retries for quote guard compliance. */
  maxSectionRetries: number;
}

const MASTER = 'G:\\My Drive\\.GENIEFLOW_MASTER';

export const DEFAULT_AGENT_CONFIG: AgentEngineConfig = {
  recordRoots: [
    'G:\\My Drive\\00 ALLEN',
    `${MASTER}\\CLIENTS`,
    'E:\\clients',
    'I:\\.genieflowai.brain\\CLIENTS',
    `${MASTER}\\PROJECTS`,
    `${MASTER}\\PATIENTS`,
    `${MASTER}\\PROPERTIES`
  ],
  templateRoots: [
    `${MASTER}\\00_TEMPLATES`,
    'E:\\samples',
    'E:\\00_EAMS_COCKPIT'
  ],
  vaultRoots: [
    `${MASTER}\\00_TEMPLATES\\CLAUSE_BANK`,
    `${MASTER}\\00_TEMPLATES`,
    'E:\\samples'
  ],
  primaryDomains: [
    'leginfo.legislature.ca.gov',
    'dir.ca.gov',
    'courts.ca.gov',
    'upcodes.com',
    'iccsafe.org',
    'cdc.gov',
    'ncbi.nlm.nih.gov',
    'dre.ca.gov',
    'govinfo.gov',
    'law.cornell.edu'
  ],
  chunkChars: { local: 4500, cloud: 12000 },
  maxChunks: 24,
  maxSectionRetries: 2
};

export function getAgentConfig(): AgentEngineConfig {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('genieflow_agent_engine_config');
      if (raw) return { ...DEFAULT_AGENT_CONFIG, ...JSON.parse(raw) };
    }
  } catch (_e) {}
  return DEFAULT_AGENT_CONFIG;
}
