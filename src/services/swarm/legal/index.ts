/**
 * 🏛️ Legal Swarms (Phase 2) Entrypoint
 * 
 * Exports the Core Legal Swarms:
 * - Swarm 3: LegalResearchSwarmAgent (Fact Harvesting & Zero-PHI RAG Agent)
 * - Swarm 4: LegalDraftingSwarmAgent (California 28-Line Pleading Expert)
 * - Swarm 5: LegalAuditSwarmAgent (Quote Guard & Citation Linting Agent)
 * - Master Swarm Orchestrator: LegalSwarmCoordinator
 * - Zero-PHI Egress Shield: ZeroPhiShield
 */

export * from './ZeroPhiShield';
export * from './LegalResearchSwarmAgent';
export * from './LegalDraftingSwarmAgent';
export * from './LegalAuditSwarmAgent';
export * from './LegalSwarmCoordinator';
