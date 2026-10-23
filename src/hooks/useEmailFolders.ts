import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { EmailFolder } from '../types';

export function useEmailFolders() {
  const [folders, setFolders] = useState<EmailFolder[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({
    inbox: 0,
    sent: 0,
    archive: 0,
    trash: 0
  });

  const createFolder = useCallback((name: string) => {
    const newFolder: EmailFolder = {
      id: uuidv4(),
      name,
      type: 'custom',
      count: 0
    };
    setFolders(current => [...current, newFolder]);
    return newFolder;
  }, []);

  const updateFolderCount = useCallback((folderId: string, count: number) => {
    if (folderId in unreadCounts) {
      setUnreadCounts(current => ({ ...current, [folderId]: count }));
    } else {
      setFolders(current =>
        current.map(folder =>
          folder.id === folderId ? { ...folder, count } : folder
        )
      );
    }
  }, [unreadCounts]);

  return {
    folders,
    unreadCounts,
    createFolder,
    updateFolderCount
  };
}