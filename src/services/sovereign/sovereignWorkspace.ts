/**
 * 🌐 UNIVERSAL SOVEREIGN WORKSPACE RESOLVER
 * 
 * Provides 100% User-Independent and Location-Independent path resolution.
 * Automatically adapts across Windows, macOS, Linux, Electron Desktop, and Web.
 * Never hardcodes usernames (e.g. Ftt, TINACO) or static drive letters.
 */

import { sovereignFs } from '../fs/sovereignFsBridge';

export interface StorageNodeStatus {
  name: string;
  path: string;
  verified: boolean;
}

class SovereignWorkspaceResolver {
  private static instance: SovereignWorkspaceResolver;
  private cachedRoot: string | null = null;

  public static getInstance(): SovereignWorkspaceResolver {
    if (!SovereignWorkspaceResolver.instance) {
      SovereignWorkspaceResolver.instance = new SovereignWorkspaceResolver();
    }
    return SovereignWorkspaceResolver.instance;
  }

  /**
   * 🔍 Dynamically discovers the active sovereign workspace root.
   */
  public async getWorkspaceRoot(): Promise<string> {
    if (this.cachedRoot) return this.cachedRoot;

    // 1. Check environment variable override
    const envRoot = import.meta.env.VITE_WORKSPACE_ROOT || import.meta.env.VITE_SOVEREIGN_ROOT;
    if (envRoot && typeof envRoot === 'string' && envRoot.trim()) {
      this.cachedRoot = envRoot.trim();
      return this.cachedRoot;
    }

    // 2. Check localStorage user preference
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('sovereign_workspace_root');
        if (stored && stored.trim()) {
          const check = await sovereignFs.listFiles({ path: stored.trim() });
          if (check.success) {
            this.cachedRoot = stored.trim();
            return this.cachedRoot;
          }
        }
      } catch (_e) {}
    }

    // 3. Dynamic candidate probing (cross-platform, zero user-name dependencies)
    const candidates: string[] = [
      'AI_GENERATED_DOCS',
      '.genieflowai.brain',
      './AI_GENERATED_DOCS',
      '.\\.genieflowai.brain'
    ];

    // Include any drives previously linked by the user
    if (typeof window !== 'undefined') {
      try {
        const linked = JSON.parse(localStorage.getItem('genieflow_linked_drives') || '[]');
        if (Array.isArray(linked)) {
          for (const d of linked) {
            if (typeof d === 'string' && d.trim()) {
              candidates.push(d.trim());
            }
          }
        }
      } catch (_e) {}
    }

    for (const candidate of candidates) {
      try {
        const res = await sovereignFs.listFiles({ path: candidate });
        if (res.success) {
          this.cachedRoot = candidate;
          if (typeof window !== 'undefined') {
            try { localStorage.setItem('sovereign_workspace_root', candidate); } catch (_e) {}
          }
          return candidate;
        }
      } catch (_e) {}
    }

    // 4. Safe universal fallback (relative to execution)
    const fallback = 'AI_GENERATED_DOCS';
    this.cachedRoot = fallback;
    return fallback;
  }

  /**
   * 📁 Sets and persists a user-selected workspace root
   */
  public setWorkspaceRoot(newRoot: string): void {
    if (!newRoot || !newRoot.trim()) return;
    this.cachedRoot = newRoot.trim();
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('sovereign_workspace_root', this.cachedRoot);
      } catch (_e) {}
    }
  }

  /**
   * 📁 Resolves the directory for AI-generated documents and deliverables.
   */
  public async getGeneratedDocsDir(subfolder?: string): Promise<string> {
    const root = await this.getWorkspaceRoot();
    const isWindows = root.includes('\\') || /^[A-Za-z]:/.test(root);
    const sep = isWindows ? '\\' : '/';

    const base = root.endsWith('AI_GENERATED_DOCS')
      ? root
      : `${root}${sep}AI_GENERATED_DOCS`;

    return subfolder ? `${base}${sep}${subfolder.replace(/[^a-zA-Z0-9_-]/g, '_')}` : base;
  }

  /**
   * 📋 Resolves the directory for SOP specifications.
   */
  public async getSopDir(subfolder?: string): Promise<string> {
    const root = await this.getWorkspaceRoot();
    const isWindows = root.includes('\\') || /^[A-Za-z]:/.test(root);
    const sep = isWindows ? '\\' : '/';

    const base = `${root}${sep}SOP`;
    return subfolder ? `${base}${sep}${subfolder.replace(/[^a-zA-Z0-9_-]/g, '_')}` : base;
  }

  /**
   * 🚀 Resolves the directory for Sovereign Missions.
   */
  public async getMissionsDir(missionId?: string): Promise<string> {
    const root = await this.getWorkspaceRoot();
    const isWindows = root.includes('\\') || /^[A-Za-z]:/.test(root);
    const sep = isWindows ? '\\' : '/';

    const base = `${root}${sep}missions`;
    return missionId ? `${base}${sep}${missionId.replace(/[^a-zA-Z0-9_-]/g, '_')}` : base;
  }

  /**
   * 📄 Resolves a file path inside the active workspace.
   */
  public async resolvePath(...segments: string[]): Promise<string> {
    const root = await this.getWorkspaceRoot();
    const isWindows = root.includes('\\') || /^[A-Za-z]:/.test(root);
    const sep = isWindows ? '\\' : '/';

    const cleanSegments = segments.map(s => s.replace(/^[\\/]+|[\\/]+$/g, ''));
    return [root, ...cleanSegments].join(sep);
  }

  /**
   * 🏗️ Initializes standard business workspace topology (clients, dashboards, templates, workflows)
   * in the active workspace and any verified connected nodes.
   */
  public async ensureWorkspaceTopology(targetEntity: string): Promise<{
    primaryPath: string;
    verifiedNodes: StorageNodeStatus[];
  }> {
    const safeEntity = targetEntity.replace(/[^a-zA-Z0-9_-]/g, '_').toUpperCase();
    const primaryRoot = await this.getWorkspaceRoot();
    const isWindows = primaryRoot.includes('\\') || /^[A-Za-z]:/.test(primaryRoot);
    const sep = isWindows ? '\\' : '/';

    const subfolders = ['clients', 'dashboards', 'templates', 'workflows'];
    const primaryPath = `${primaryRoot}${sep}${safeEntity}`;

    const verifiedNodes: StorageNodeStatus[] = [];

    // 1. Create in primary workspace
    try {
      await sovereignFs.mkdir({ path: primaryPath });
      for (const sub of subfolders) {
        await sovereignFs.mkdir({ path: `${primaryPath}${sep}${sub}` });
      }
      verifiedNodes.push({ name: 'Active Sovereign Workspace', path: primaryPath, verified: true });
    } catch (_e) {}

    // 2. Discover and create in any attached external drives (if present and mounted)
    if (typeof window !== 'undefined') {
      try {
        const linked = JSON.parse(localStorage.getItem('genieflow_linked_drives') || '[]');
        if (Array.isArray(linked)) {
          for (const drive of linked) {
            if (typeof drive === 'string' && drive.trim() && drive.trim() !== primaryRoot) {
              const nodeDrive = drive.trim();
              const nodePath = `${nodeDrive}${sep}${safeEntity}`;
              try {
                const res = await sovereignFs.mkdir({ path: nodePath });
                if (res?.success) {
                  for (const sub of subfolders) {
                    await sovereignFs.mkdir({ path: `${nodePath}${sep}${sub}` });
                  }
                  verifiedNodes.push({ name: `Attached Drive (${nodeDrive})`, path: nodePath, verified: true });
                }
              } catch (_e) {}
            }
          }
        }
      } catch (_e) {}
    }

    return { primaryPath, verifiedNodes };
  }

  /**
   * 🔄 Reset cache when user switches workspace
   */
  public resetCache(): void {
    this.cachedRoot = null;
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem('sovereign_workspace_root'); } catch (_e) {}
    }
  }
}

export const sovereignWorkspace = SovereignWorkspaceResolver.getInstance();
