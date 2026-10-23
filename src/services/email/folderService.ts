import { v4 as uuidv4 } from 'uuid';

export interface EmailFolder {
  id: string;
  name: string;
  type: 'system' | 'custom';
  count?: number;
  loading?: boolean;
}

// In-memory folder storage
let folders: EmailFolder[] = [
  { id: 'inbox', name: 'Inbox', type: 'system', count: 0 },
  { id: 'sent', name: 'Sent', type: 'system', count: 0 },
  { id: 'drafts', name: 'Drafts', type: 'system', count: 0 },
  { id: 'trash', name: 'Trash', type: 'system', count: 0 }
];

export function getFolders(): EmailFolder[] {
  return folders;
}

export async function createFolder(name: string): Promise<EmailFolder> {
  const newFolder: EmailFolder = {
    id: uuidv4(),
    name,
    type: 'custom',
    count: 0
  };
  folders = [...folders, newFolder];
  return newFolder;
}

export async function deleteFolder(id: string): Promise<void> {
  folders = folders.filter(folder => folder.id !== id || folder.type === 'system');
}

export async function updateFolderCount(id: string, count: number): Promise<void> {
  folders = folders.map(folder =>
    folder.id === id ? { ...folder, count } : folder
  );
}