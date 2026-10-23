export interface AttachedFileNode {
  id: string;
  name: string;
  isFolder: boolean;
  path: string;
  size?: number;
  extension?: string;
  children?: AttachedFileNode[];
  handle?: any; // FileSystemFileHandle or FileSystemDirectoryHandle
  file?: File;
  content?: string;
  mimeType?: string;
  driveId: string;
  lastModified?: string;
  isLoaded?: boolean;
}

export interface AttachedDrive {
  id: string;
  name: string;
  type: 'local' | 'travel' | 'gdrive' | 'generated' | 'cloud';
  rootPath?: string;
  handle?: any;
  items: AttachedFileNode[];
  isExpanded: boolean;
  fileCount: number;
  attachedAt: string;
}

export interface PinnedFile {
  id: string;
  name: string;
  path: string;
  content?: string;
  driveId: string;
  mimeType?: string;
  file?: File;
}

export interface AttachedDriveState {
  drives: AttachedDrive[];
  pinnedFiles: PinnedFile[];
  selectedFileId: string | null;
  isAttaching: boolean;

  // Actions
  attachDriveFromHandle: (handle: any) => Promise<AttachedDrive>;
  attachDriveFromFolderPath: (folderPath: string) => Promise<AttachedDrive | null>;
  attachDriveFromFiles: (name: string, files: FileList | File[], type?: AttachedDrive['type'], rootPath?: string) => AttachedDrive;
  attachPreconfiguredDrive: (type: 'travel' | 'gdrive' | 'ai_docs') => Promise<AttachedDrive | null>;
  loadFolderChildren: (folderNode: AttachedFileNode) => Promise<AttachedFileNode[]>;
  detachDrive: (driveId: string) => void;
  toggleDriveExpanded: (driveId: string) => void;
  setSelectedFileId: (fileId: string | null) => void;
  togglePinFile: (file: AttachedFileNode) => Promise<void>;
  togglePinFolder: (folderNode: AttachedFileNode) => Promise<number>;
  unpinFile: (fileId: string) => void;
  clearPinnedFiles: () => void;
  readFileContent: (file: AttachedFileNode) => Promise<string>;
  addGeneratedDocument: (title: string, content: string, path?: string) => void;
  autoMountSovereignDrives: () => Promise<void>;
  refreshGeneratedDocs: () => Promise<void>;
}
