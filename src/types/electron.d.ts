/**
 * 🌍 Type declarations for the Electron Bridge
 * 
 * When running inside Electron, `window.electronBridge` is available.
 * When running in a normal browser, it's undefined.
 * SkillBridge uses this to decide: IPC (Earth) or WebSocket/Cloud (Heaven).
 */

interface ElectronFsResult {
  success: boolean;
  error?: string;
  path?: string;
  content?: string;
  files?: Array<{ name: string; isDirectory: boolean; path: string }>;
  stat?: {
    size: number;
    isDirectory: boolean;
    isFile: boolean;
    created: string;
    modified: string;
  };
}

interface ElectronShellResult {
  success: boolean;
  error?: string;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
}

interface ElectronSystemInfo {
  success: boolean;
  platform: string;
  arch: string;
  nodeVersion: string;
  workspaceRoot: string;
  isElectron: boolean;
  heartbeatEnabled: boolean;
}

interface ElectronDialogResult {
  success: boolean;
  paths?: string[];
  path?: string;
}

interface ElectronBridge {
  isElectron: true;

  fs: {
    writeFile: (args: { path: string; content: string; encoding?: string }) => Promise<ElectronFsResult>;
    readFile: (args: { path: string; encoding?: string }) => Promise<ElectronFsResult>;
    listFiles: (args: { path: string }) => Promise<ElectronFsResult>;
    moveFile: (args: { source: string; destination: string }) => Promise<ElectronFsResult>;
    deleteFile: (args: { path: string }) => Promise<ElectronFsResult>;
    mkdir: (args: { path: string }) => Promise<ElectronFsResult>;
    stat: (args: { path: string }) => Promise<ElectronFsResult>;
  };

  shell: {
    exec: (args: { command: string; cwd?: string }) => Promise<ElectronShellResult>;
  };

  system: {
    info: () => Promise<ElectronSystemInfo>;
    openPath: (args: { path: string }) => Promise<{ success: boolean }>;
    openExternal: (args: { url: string }) => Promise<{ success: boolean }>;
    toggleFullscreen: () => Promise<{ success: boolean; isFullscreen: boolean }>;
  };

  dialog: {
    openFile: () => Promise<ElectronDialogResult>;
    openFolder: () => Promise<ElectronDialogResult>;
    saveFile: (args: { defaultPath?: string }) => Promise<ElectronDialogResult>;
  };

  on: (channel: string, callback: (...args: any[]) => void) => void;
  removeListener: (channel: string, callback: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    electronBridge?: ElectronBridge;
  }
}

export {};
