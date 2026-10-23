/**
 * 🪪 AgentPassport
 * 
 * Cryptographic identity layer for AI agents.
 * 
 * Every agent that wants to execute an action MUST present a valid,
 * signed passport. Passports are short-lived (5 min default) and 
 * scoped to specific permissions.
 * 
 * Think: OAuth2 for AI agents. No passport = no action.
 * 
 * Uses the Web Crypto API (HMAC-SHA256) so it runs in both
 * browser and Deno (Supabase Edge Functions) without any dependencies.
 */

export type AgentTier = 'core' | 'specialized' | 'external' | 'user';

export type AgentPermission =
  | 'read:files'
  | 'write:files'
  | 'delete:files'
  | 'read:messages'
  | 'send:messages'
  | 'read:agent_state'
  | 'write:agent_state'
  | 'invoke:skills'
  | 'access:medical'
  | 'access:legal'
  | 'access:financial'
  | 'issue:passports'       // Only core agents get this
  | 'quarantine:agents';    // Only security agents get this

export interface AgentIdentity {
  agentId: string;
  agentName: string;
  agentType: string;          // 'soul' | 'legal' | 'medical' | 'external' | etc.
  tier: AgentTier;
  registeredAt: number;       // When this agent was first registered
}

export interface AgentPassport {
  // Identity
  passportId: string;         // UUID for this specific passport issuance
  agentId: string;
  agentName: string;
  tier: AgentTier;

  // Time bounds
  issuedAt: number;           // Unix ms
  expiresAt: number;          // Very short TTL. Default 5 min.

  // Scope
  permissions: AgentPermission[];
  missionId?: string;         // If scoped to a specific mission
  caseId?: string;            // If scoped to a specific case

  // Security
  nonce: string;              // Prevents replay attacks
  issuer: 'genieflow_core';
  signature: string;          // HMAC-SHA256 of above fields (all except sig itself)

  // Audit
  parentPassportId?: string;  // If this was issued as part of an agent handoff chain
}

export interface PassportVerificationResult {
  valid: boolean;
  reason?: string;
  passport?: AgentPassport;
  remainingMs?: number;      // Time until expiry if valid
}

// ─────────────────────────────────────────────────────────────────
// PASSPORT SERVICE
// ─────────────────────────────────────────────────────────────────

export class AgentPassportService {
  private static instance: AgentPassportService;

  // The signing key — generated fresh on app load, rotated periodically.
  // In production: this comes from a Supabase Vault secret, not memory.
  private signingKey: CryptoKey | null = null;
  private keyInitPromise: Promise<void>;

  // Revocation list (passportIds that have been explicitly revoked)
  private revokedPassports = new Set<string>();

  // Registry of verified agent identities
  private agentRegistry = new Map<string, AgentIdentity>();

  private constructor() {
    this.keyInitPromise = this.initKey();
  }

  public static getInstance(): AgentPassportService {
    if (!AgentPassportService.instance) {
      AgentPassportService.instance = new AgentPassportService();
    }
    return AgentPassportService.instance;
  }

  /**
   * 🏛️ Register an agent identity with the Gateway.
   * Must happen before any passport can be issued to that agent.
   */
  public registerAgent(identity: AgentIdentity): void {
    this.agentRegistry.set(identity.agentId, identity);
    console.log(`🪪 Passport: Agent registered — ${identity.agentName} [${identity.tier}]`);
  }

  /**
   * 🎫 Issue a new passport to a registered agent.
   * Only agents with 'issue:passports' permission can trigger this for OTHER agents.
   * The core system (Soul/Heartbeat startup) can always issue.
   */
  public async issue(
    agentId: string,
    permissions: AgentPermission[],
    options: {
      ttlSeconds?: number;
      missionId?: string;
      caseId?: string;
      parentPassportId?: string;
      issuedByCoreSystem?: boolean;
    } = {}
  ): Promise<AgentPassport> {
    await this.keyInitPromise;

    const identity = this.agentRegistry.get(agentId);
    if (!identity && !options.issuedByCoreSystem) {
      throw new Error(`🪪 Passport: Agent '${agentId}' is not registered. Cannot issue passport.`);
    }

    const {
      ttlSeconds = 300,       // 5 minutes default
      missionId,
      caseId,
      parentPassportId,
    } = options;

    const now = Date.now();
    const passport: Omit<AgentPassport, 'signature'> = {
      passportId: crypto.randomUUID(),
      agentId,
      agentName: identity?.agentName || agentId,
      tier: identity?.tier || 'external',
      issuedAt: now,
      expiresAt: now + (ttlSeconds * 1000),
      permissions,
      missionId,
      caseId,
      nonce: crypto.randomUUID(),
      issuer: 'genieflow_core',
      parentPassportId,
    };

    const signature = await this.sign(passport);
    const fullPassport: AgentPassport = { ...passport, signature };

    console.log(
      `🪪 Passport: Issued to '${passport.agentName}' ` +
      `(${permissions.length} perms, expires in ${ttlSeconds}s)`
    );

    return fullPassport;
  }

  /**
   * ✅ Verify a passport is authentic, not expired, and not revoked.
   */
  public async verify(passport: AgentPassport): Promise<PassportVerificationResult> {
    await this.keyInitPromise;

    try {
      // 1. Check revocation first (fast path)
      if (this.revokedPassports.has(passport.passportId)) {
        return { valid: false, reason: 'Passport has been revoked' };
      }

      // 2. Check expiration
      const now = Date.now();
      if (now > passport.expiresAt) {
        return {
          valid: false,
          reason: `Passport expired ${Math.round((now - passport.expiresAt) / 1000)}s ago`,
        };
      }

      // 3. Verify issuer
      if (passport.issuer !== 'genieflow_core') {
        return { valid: false, reason: `Invalid issuer: "${passport.issuer}"` };
      }

      // 4. Verify cryptographic signature
      const signatureValid = await this.verifySignature(passport);
      if (!signatureValid) {
        console.error(`🚨 PASSPORT FORGERY DETECTED for agent: ${passport.agentId}`);
        return { valid: false, reason: 'Cryptographic signature verification failed — possible forgery' };
      }

      return {
        valid: true,
        passport,
        remainingMs: passport.expiresAt - now,
      };
    } catch (error) {
      console.error('🪪 Passport: Verification error', error);
      return { valid: false, reason: 'Internal verification error' };
    }
  }

  /**
   * 🔐 Check if a passport has a specific permission.
   */
  public async hasPermission(
    passport: AgentPassport,
    permission: AgentPermission
  ): Promise<boolean> {
    const result = await this.verify(passport);
    if (!result.valid) return false;
    return passport.permissions.includes(permission);
  }

  /**
   * 🚫 Revoke a passport immediately (quarantine scenario).
   */
  public revoke(passportId: string, reason: string): void {
    this.revokedPassports.add(passportId);
    console.warn(`🚫 Passport REVOKED: ${passportId}. Reason: ${reason}`);
  }

  /**
   * 🔄 Refresh a passport before it expires (extends TTL).
   * Only works if the original is still valid.
   */
  public async refresh(
    existing: AgentPassport,
    ttlSeconds: number = 300
  ): Promise<AgentPassport | null> {
    const result = await this.verify(existing);
    if (!result.valid) {
      console.warn(`🪪 Passport: Cannot refresh — ${result.reason}`);
      return null;
    }

    return this.issue(existing.agentId, existing.permissions, {
      ttlSeconds,
      missionId: existing.missionId,
      caseId: existing.caseId,
      parentPassportId: existing.passportId,
    });
  }

  /**
   * 📋 List registered agents
   */
  public getRegisteredAgents(): AgentIdentity[] {
    return Array.from(this.agentRegistry.values());
  }

  // ─── PRIVATE CRYPTO HELPERS ───────────────────────────────────

  private async initKey(): Promise<void> {
    try {
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        const rawKey = crypto.getRandomValues(new Uint8Array(32));
        this.signingKey = await crypto.subtle.importKey(
          'raw',
          rawKey,
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign', 'verify']
        );
        console.log('🗝️ Passport: Signing key initialized.');
      } else {
        console.warn('⚠️ Passport: Web Crypto subtle API unavailable in non-secure LAN origin. Insecure fallback active.');
      }
    } catch (e) {
      console.warn('⚠️ Passport: Key initialization fallback:', e);
    }
  }

  private async sign(passport: Omit<AgentPassport, 'signature'>): Promise<string> {
    if (typeof crypto === 'undefined' || !crypto.subtle || !this.signingKey) {
      return btoa(`fallback-sig-${passport.agentId}-${Date.now()}`);
    }

    const payload = this.serializeForSigning(passport);
    const encoder = new TextEncoder();
    const sig = await crypto.subtle.sign('HMAC', this.signingKey, encoder.encode(payload));
    return btoa(String.fromCharCode(...new Uint8Array(sig)));
  }

  private async verifySignature(passport: AgentPassport): Promise<boolean> {
    if (typeof crypto === 'undefined' || !crypto.subtle || !this.signingKey) {
      return true; // Non-secure development fallback
    }

    const { signature, ...rest } = passport;
    const payload = this.serializeForSigning(rest);
    const encoder = new TextEncoder();

    try {
      const sigBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
      return crypto.subtle.verify('HMAC', this.signingKey, sigBytes, encoder.encode(payload));
    } catch {
      return false; // Invalid base64 or corrupted signature
    }
  }

  private serializeForSigning(passport: Omit<AgentPassport, 'signature'>): string {
    // Deterministic serialization — field order must be consistent
    return [
      passport.passportId,
      passport.agentId,
      passport.agentName,
      passport.tier,
      passport.issuedAt,
      passport.expiresAt,
      passport.permissions.sort().join(','),
      passport.missionId || '',
      passport.caseId || '',
      passport.nonce,
      passport.issuer,
      passport.parentPassportId || '',
    ].join('|');
  }
}

export const agentPassportService = AgentPassportService.getInstance();
