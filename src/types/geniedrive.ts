/**
 * GenieDrive Types
 * 
 * Types for the GenieDrive file storage and management system.
 */

import { User as _User } from '@supabase/supabase-js';

export type GenieDriveItemType = 
  | 'folder'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'pdf'
  | 'image'
  | 'video'
  | 'audio'
  | 'archive'
  | 'code'
  | 'unknown';

export type GenieDriveViewMode = 
  | 'grid'
  | 'list'
  | 'compact';

export interface GenieDriveItemPermission {
  canView: string[];     // User IDs who can view
  canEdit: string[];     // User IDs who can edit
  canDelete: string[];   // User IDs who can delete
  isPublic: boolean;     // Whether the item is publicly accessible
  password?: string;     // Optional password for protected sharing
}

export interface GenieDriveItemMetadata {
  creator: string;             // User ID of creator
  createdAt: string;           // ISO date string
  lastModifiedBy: string;      // User ID of last modifier
  lastModifiedAt: string;      // ISO date string 
  size: number;                // Size in bytes
  mimeType: string;            // MIME type
  starred: boolean;            // Whether the item is starred
  tags: string[];              // List of tags
  description?: string;        // Optional description
  thumbnail?: string;          // Optional thumbnail URL
  sourceUrl?: string;          // Optional source URL
  isTemplate?: boolean;        // Whether the item is a template
  customProperties?: Record<string, unknown>; // Custom metadata
}

export interface GenieDriveItem {
  id: string;
  name: string;
  type: GenieDriveItemType;
  parentId: string | null;     // Parent folder ID, null for root items
  path: string[];              // Array of parent folder names
  permissions: GenieDriveItemPermission;
  metadata: GenieDriveItemMetadata;
  content?: string | ArrayBuffer; // Item content or reference
  previewUrl?: string;         // URL for previews
  downloadUrl?: string;        // URL for downloads
  webViewUrl?: string;         // URL for web view
  aiAnalysis?: GenieDriveAIAnalysis; // AI analysis of the item
}

export interface GenieDriveFolder extends GenieDriveItem {
  type: 'folder';
  childrenCount: number;       // Number of immediate children
}

export interface GenieDriveFile extends GenieDriveItem {
  type: Exclude<GenieDriveItemType, 'folder'>;
  extension: string;           // File extension
  version: number;             // File version
  versionHistory?: GenieDriveVersionHistory[];
}

export interface GenieDriveVersionHistory {
  id: string;
  versionNumber: number;
  createdBy: string;
  createdAt: string;
  size: number;
  downloadUrl: string;
  comment?: string;
}

export interface GenieDriveAIAnalysis {
  summary?: string;
  keyPoints?: string[];
  entities?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  topics?: string[];
  extractedData?: Record<string, unknown>;
  suggestedActions?: string[];
  similarDocuments?: string[];  // IDs of similar documents
  generatedAt: string;          // When the analysis was generated
}

export interface GenieDriveSortOptions {
  field: 'name' | 'size' | 'type' | 'createdAt' | 'lastModifiedAt';
  direction: 'asc' | 'desc';
}

export interface GenieDriveFilter {
  types?: GenieDriveItemType[];
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  createdBy?: string[];
  starred?: boolean;
  sharedWithMe?: boolean;
  search?: string;
}

export interface GenieDriveViewState {
  currentFolderId: string | null;
  path: string[];
  sortOptions: GenieDriveSortOptions;
  filter: GenieDriveFilter;
  viewMode: GenieDriveViewMode;
  selectedItems: string[];
}

export interface GenieDriveStorage {
  totalSpace: number;
  usedSpace: number;
  remainingSpace: number;
}

export interface GenieDriveShareSettings {
  accessType: 'private' | 'anyoneWithLink' | 'public';
  allowDownloads: boolean;
  allowComments: boolean;
  allowCopying: boolean;
  expiryDate?: string;
  password?: string;
  sharedWith: Array<{
    email: string;
    userId?: string;
    permission: 'view' | 'edit' | 'comment';
  }>;
}

// Service interfaces
export interface GenieDriveService {
  initialize: () => Promise<void>;
  getItems: (folderId: string | null, filter?: GenieDriveFilter) => Promise<GenieDriveItem[]>;
  createFolder: (name: string, parentId: string | null) => Promise<GenieDriveFolder>;
  uploadFile: (file: File, parentId: string | null) => Promise<GenieDriveFile>;
  deleteItem: (itemId: string) => Promise<boolean>;
  moveItem: (itemId: string, newParentId: string | null) => Promise<GenieDriveItem>;
  copyItem: (itemId: string, newParentId: string | null) => Promise<GenieDriveItem>;
  renameItem: (itemId: string, newName: string) => Promise<GenieDriveItem>;
  getItemContent: (itemId: string) => Promise<string | ArrayBuffer | null>;
  updateItemContent: (itemId: string, content: string | ArrayBuffer) => Promise<GenieDriveFile>;
  getStorage: () => Promise<GenieDriveStorage>;
  shareItem: (itemId: string, settings: GenieDriveShareSettings) => Promise<string>; // Returns share URL
  getAIAnalysis: (itemId: string) => Promise<GenieDriveAIAnalysis>;
  generateAIAnalysis: (itemId: string) => Promise<GenieDriveAIAnalysis>;
}