/**
 * Sovereign File System Bridge
 * Provides transparent access to the local filesystem:
 * - Uses window.electronBridge.fs if running inside Electron
 * - Falls back to Vite backend API (/api/fs/list, /api/fs/read) if running in browser
 */

export interface SovereignFsEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  lastModified?: string;
}

export interface ListFilesResult {
  success: boolean;
  files?: SovereignFsEntry[];
  error?: string;
}

export interface ReadFileResult {
  success: boolean;
  content?: string;
  error?: string;
}

function getApiUrl(pathWithQuery: string): string {
  if (
    typeof window !== 'undefined' &&
    window.location?.origin &&
    window.location.origin !== 'null' &&
    !window.location.origin.startsWith('file:')
  ) {
    return `${window.location.origin}${pathWithQuery}`;
  }
  return `http://127.0.0.1:3000${pathWithQuery}`;
}

export const sovereignFs = {
  async listFiles({ path }: { path: string }): Promise<ListFilesResult> {
    const electronBridge = typeof window !== 'undefined' ? (window as any).electronBridge : null;
    // Only call Electron fs if it's a native bridge (not our own web polyfill)
    if (
      electronBridge?.fs?.listFiles &&
      !electronBridge.__isSovereignPolyfill &&
      typeof electronBridge.fs.listFiles === 'function' &&
      electronBridge.fs.listFiles !== sovereignFs.listFiles
    ) {
      try {
        const res = await electronBridge.fs.listFiles({ path });
        if (res?.success) return res;
        // In native Electron, return result directly rather than falling back to an unmounted web port
        if (electronBridge.isElectron) {
          return res || { success: false, error: 'Path not found', files: [] };
        }
      } catch (err) {
        console.warn('[sovereignFs] Electron listFiles failed:', err);
        if (electronBridge.isElectron) {
          return { success: false, error: String(err), files: [] };
        }
      }
    }

    try {
      const res = await fetch(getApiUrl(`/api/fs/list?path=${encodeURIComponent(path)}`));
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        return data;
      }
    } catch (err: any) {
      console.warn('[sovereignFs] Web listFiles failed:', err);
    }

    return { success: false, error: 'Could not access file system', files: [] };
  },

  async readFile({ path }: { path: string }): Promise<ReadFileResult> {
    const electronBridge = typeof window !== 'undefined' ? (window as any).electronBridge : null;
    // Only call Electron fs if it's a native bridge (not our own web polyfill)
    if (
      electronBridge?.fs?.readFile &&
      !electronBridge.__isSovereignPolyfill &&
      typeof electronBridge.fs.readFile === 'function' &&
      electronBridge.fs.readFile !== sovereignFs.readFile
    ) {
      try {
        const res = await electronBridge.fs.readFile({ path });
        if (res?.success && res.content !== undefined) return res;
        if (electronBridge.isElectron) {
          return res || { success: false, error: 'Could not read file' };
        }
      } catch (err) {
        console.warn('[sovereignFs] Electron readFile failed:', err);
        if (electronBridge.isElectron) {
          return { success: false, error: String(err) };
        }
      }
    }

    try {
      const res = await fetch(getApiUrl(`/api/fs/read?path=${encodeURIComponent(path)}`));
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        return data;
      }
    } catch (err: any) {
      console.warn('[sovereignFs] Web readFile failed:', err);
    }

    return { success: false, error: 'Could not read file' };
  },

  /**
   * Read-only recursive search. Matches file names containing `q` (all tokens, or any token when `any`).
   */
  async findFiles(opts: {
    root: string;
    q?: string;
    ext?: string;
    any?: boolean;
    dirs?: boolean;
    depth?: number;
    limit?: number;
  }): Promise<ListFilesResult> {
    try {
      const p = new URLSearchParams({ root: opts.root });
      if (opts.q) p.set('q', opts.q);
      if (opts.ext) p.set('ext', opts.ext);
      if (opts.any) p.set('any', '1');
      if (opts.dirs) p.set('dirs', '1');
      if (opts.depth) p.set('depth', String(opts.depth));
      if (opts.limit) p.set('limit', String(opts.limit));
      const res = await fetch(getApiUrl(`/api/fs/find?${p.toString()}`));
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data?.success) return data;
      }
    } catch (err) {
      console.warn('[sovereignFs] findFiles failed:', err);
    }
    return { success: false, error: 'find unavailable', files: [] };
  },

  async mkdir({ path }: { path: string }): Promise<{ success: boolean; error?: string }> {
    const electronBridge = typeof window !== 'undefined' ? (window as any).electronBridge : null;
    if (
      electronBridge?.fs?.mkdir &&
      !electronBridge.__isSovereignPolyfill &&
      typeof electronBridge.fs.mkdir === 'function' &&
      electronBridge.fs.mkdir !== sovereignFs.mkdir
    ) {
      try {
        const res = await electronBridge.fs.mkdir({ path });
        if (res?.success) return res;
        if (electronBridge.isElectron) {
          return res || { success: false, error: 'Could not create directory' };
        }
      } catch (err) {
        console.warn('[sovereignFs] Electron mkdir failed:', err);
        if (electronBridge.isElectron) {
          return { success: false, error: String(err) };
        }
      }
    }

    try {
      const res = await fetch(getApiUrl('/api/fs/mkdir'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        return data;
      }
    } catch (err: any) {
      console.warn('[sovereignFs] Web mkdir failed:', err);
    }
    return { success: false, error: 'Could not create directory' };
  },

  async writeFile({ path, content }: { path: string; content: string }): Promise<{ success: boolean; error?: string }> {
    const electronBridge = typeof window !== 'undefined' ? (window as any).electronBridge : null;
    if (
      electronBridge?.fs?.writeFile &&
      !electronBridge.__isSovereignPolyfill &&
      typeof electronBridge.fs.writeFile === 'function' &&
      electronBridge.fs.writeFile !== sovereignFs.writeFile
    ) {
      try {
        const res = await electronBridge.fs.writeFile({ path, content });
        if (res?.success) return res;
        if (electronBridge.isElectron) {
          return res || { success: false, error: 'Could not write file' };
        }
      } catch (err) {
        console.warn('[sovereignFs] Electron writeFile failed:', err);
        if (electronBridge.isElectron) {
          return { success: false, error: String(err) };
        }
      }
    }

    try {
      const res = await fetch(getApiUrl('/api/fs/write'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, content })
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        return data;
      }
    } catch (err: any) {
      console.warn('[sovereignFs] Web writeFile failed:', err);
    }
    return { success: false, error: 'Could not write file' };
  }
};

// Auto-install polyfill onto window.electronBridge so all components work seamlessly in web mode
if (typeof window !== 'undefined') {
  const win = window as any;
  if (!win.electronBridge) {
    win.electronBridge = {
      __isSovereignPolyfill: true
    };
  }
  if (!win.electronBridge.fs) {
    win.electronBridge.__isSovereignPolyfill = true;
    win.electronBridge.fs = {
      listFiles: sovereignFs.listFiles,
      readFile: sovereignFs.readFile,
      mkdir: sovereignFs.mkdir,
      writeFile: sovereignFs.writeFile
    };
    console.log('⚡ [sovereignFs] Mounted universal browser FS bridge to window.electronBridge.fs');
  }
}


