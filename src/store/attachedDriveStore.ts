import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AttachedFileNode, AttachedDrive, PinnedFile, AttachedDriveState } from './attachedDriveTypes';
import {
  traverseDirectoryHandle,
  buildTreeFromFileList,
  buildTreeFromElectronFs,
  countFilesInNodes,
  defaultGeneratedDocsDrive,
  getLiveGeneratedDocsDrive,
  getPreconfiguredDriveItems,
  getMimeType
} from './attachedDriveDefaults';
import { sovereignFs } from '../services/fs/sovereignFsBridge';

export * from './attachedDriveTypes';

export const useAttachedDriveStore = create<AttachedDriveState>()(
  persist(
    (set, get) => ({
      drives: [defaultGeneratedDocsDrive],
      pinnedFiles: [],
      selectedFileId: null,
      isAttaching: false,

      attachDriveFromHandle: async (dirHandle: any) => {
        set({ isAttaching: true });
        try {
          const driveId = `drive_${Date.now()}`;
          const items = await traverseDirectoryHandle(dirHandle, '', driveId);
          const fileCount = countFilesInNodes(items);

          const newDrive: AttachedDrive = {
            id: driveId,
            name: dirHandle.name,
            type: 'local',
            handle: dirHandle,
            items,
            isExpanded: true,
            fileCount,
            attachedAt: new Date().toISOString()
          };

          set((state) => ({
            drives: [newDrive, ...state.drives.filter(d => d.name !== dirHandle.name)],
            isAttaching: false
          }));

          return newDrive;
        } catch (error) {
          set({ isAttaching: false });
          throw error;
        }
      },

      attachDriveFromFolderPath: async (folderPath: string) => {
        set({ isAttaching: true });
        try {
          const driveId = `drive_${Date.now()}`;
          const normalized = /^[a-zA-Z]:$/.test(folderPath) ? `${folderPath}\\` : folderPath;
          const cleanPath = normalized.replace(/\\/g, '/');
          
          let folderName = cleanPath.split('/').filter(Boolean).pop() || normalized;
          if (/^[a-zA-Z]:\/?$/.test(cleanPath)) {
            folderName = `Drive (${normalized.substring(0, 2).toUpperCase()})`;
          } else if (cleanPath.toLowerCase().endsWith('my drive') || cleanPath.toLowerCase().includes('google drive') || cleanPath.toLowerCase() === 'g:/my drive') {
            folderName = `Google Drive (${normalized.substring(0, 2).toUpperCase()})`;
          }

          console.log(`[GenieDrive] Attaching folder: ${normalized} as "${folderName}"`);
          const items = await buildTreeFromElectronFs(normalized, driveId);
          const fileCount = countFilesInNodes(items);

          const newDrive: AttachedDrive = {
            id: driveId,
            name: folderName,
            type: 'local',
            rootPath: normalized,
            items,
            isExpanded: true,
            fileCount,
            attachedAt: new Date().toISOString()
          };

          set((state) => ({
            drives: [newDrive, ...state.drives.filter(d => d.rootPath !== normalized && d.name !== folderName)],
            isAttaching: false
          }));

          return newDrive;
        } catch (err) {
          console.error('[GenieDrive] attachDriveFromFolderPath failed:', err);
          throw err;
        } finally {
          set({ isAttaching: false });
        }
      },

      attachDriveFromFiles: (name: string, files: FileList | File[], type: AttachedDrive['type'] = 'local', rootPath?: string) => {
        set({ isAttaching: true });
        const driveId = `drive_${Date.now()}`;
        const fileArr = Array.from(files);
        const items = buildTreeFromFileList(fileArr, driveId);
        const fileCount = countFilesInNodes(items);

        const newDrive: AttachedDrive = {
          id: driveId,
          name,
          type,
          rootPath,
          items,
          isExpanded: true,
          fileCount,
          attachedAt: new Date().toISOString()
        };

        set((state) => ({
          drives: [newDrive, ...state.drives.filter(d => d.id !== driveId)],
          isAttaching: false
        }));

        return newDrive;
      },

      attachPreconfiguredDrive: async (type) => {
        set({ isAttaching: true });
        try {
          const driveId = `drive_${type}_${Date.now()}`;

          const candidatePaths: Record<string, Array<{ path: string; name: string }>> = {
            travel: [
              { path: 'E:\\', name: 'Travel Drive (E:\\)' }
            ],
            gdrive: [
              { path: 'G:\\My Drive', name: 'Google Drive (G:\\My Drive)' },
              { path: 'G:\\', name: 'Google Drive (G:\\)' }
            ]
          };

          const candidates = candidatePaths[type] || [];
          if (candidates.length > 0) {
            for (const target of candidates) {
              try {
                const testRes = await sovereignFs.listFiles({ path: target.path });
                if (testRes?.success && Array.isArray(testRes.files) && testRes.files.length > 0) {
                  const items = await buildTreeFromElectronFs(target.path, driveId, 0, 1);
                  const fileCount = countFilesInNodes(items);
                  const driveType: AttachedDrive['type'] = type === 'ai_docs' ? 'generated' : (type as AttachedDrive['type']);
                  const newDrive: AttachedDrive = {
                    id: driveId,
                    name: target.name,
                    type: driveType,
                    rootPath: target.path,
                    items,
                    isExpanded: true,
                    fileCount: fileCount || testRes.files.length,
                    attachedAt: new Date().toISOString()
                  };
                  set((state) => ({
                    drives: [newDrive, ...state.drives.filter(d => d.name !== target.name && d.rootPath !== target.path)],
                    isAttaching: false
                  }));
                  return newDrive;
                }
              } catch (err) {
                console.warn(`Could not read candidate path ${target.path}:`, err);
              }
            }
          }

          const { name, items } = getPreconfiguredDriveItems(type as 'travel' | 'gdrive', driveId);
          const fileCount = countFilesInNodes(items);

          const fallbackType: AttachedDrive['type'] = type === 'ai_docs' ? 'generated' : (type as AttachedDrive['type']);
          const newDrive: AttachedDrive = {
            id: driveId,
            name,
            type: fallbackType,
            items,
            isExpanded: true,
            fileCount,
            attachedAt: new Date().toISOString()
          };

          set((state) => ({
            drives: [newDrive, ...state.drives.filter(d => d.name !== name)],
            isAttaching: false
          }));

          return newDrive;
        } finally {
          set({ isAttaching: false });
        }
      },

      loadFolderChildren: async (folderNode: AttachedFileNode): Promise<AttachedFileNode[]> => {
        if (folderNode.isLoaded && folderNode.children && folderNode.children.length > 0) {
          return folderNode.children;
        }

        if (!folderNode.path) {
          return folderNode.children || [];
        }

        try {
          const res = await sovereignFs.listFiles({ path: folderNode.path });
          if (!res?.success || !Array.isArray(res.files)) {
            return [];
          }

          const children: AttachedFileNode[] = [];
          const seenIds = new Set<string>();
          for (let i = 0; i < res.files.length; i++) {
            const file = res.files[i];
            const baseName = file.name || '';
            if (
              !baseName ||
              baseName === 'node_modules' ||
              baseName === '.git' ||
              baseName === '$RECYCLE.BIN' ||
              baseName === 'System Volume Information' ||
              baseName.startsWith('~$')
            ) {
              continue;
            }
            let id = `${folderNode.driveId}_${(file.path || baseName).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
            if (seenIds.has(id)) {
              id = `${id}_${i}`;
            }
            seenIds.add(id);
            if (file.isDirectory) {
              children.push({
                id,
                name: baseName,
                isFolder: true,
                path: file.path,
                children: [],
                isLoaded: false,
                driveId: folderNode.driveId
              });
            } else {
              children.push({
                id,
                name: baseName,
                isFolder: false,
                path: file.path,
                size: file.size,
                extension: baseName.split('.').pop() || '',
                mimeType: getMimeType(baseName),
                driveId: folderNode.driveId,
                lastModified: file.lastModified
              });
            }
          }

          children.sort((a, b) => {
            if (a.isFolder === b.isFolder) return a.name.localeCompare(b.name);
            return a.isFolder ? -1 : 1;
          });

          const updateNodeInList = (nodes: AttachedFileNode[]): AttachedFileNode[] => {
            return nodes.map(n => {
              if (n.id === folderNode.id) {
                return {
                  ...n,
                  children,
                  isLoaded: true
                };
              }
              if (n.isFolder && n.children && n.children.length > 0) {
                return {
                  ...n,
                  children: updateNodeInList(n.children)
                };
              }
              return n;
            });
          };

          set(state => ({
            drives: state.drives.map(d => {
              if (d.id === folderNode.driveId) {
                const updatedItems = updateNodeInList(d.items);
                return {
                  ...d,
                  items: updatedItems,
                  fileCount: countFilesInNodes(updatedItems)
                };
              }
              return d;
            })
          }));

          return children;
        } catch (err) {
          console.error(`Failed to load children for ${folderNode.path}:`, err);
          return [];
        }
      },

      detachDrive: (driveId: string) => {
        set((state) => ({
          drives: state.drives.filter(d => d.id !== driveId),
          pinnedFiles: state.pinnedFiles.filter(f => f.driveId !== driveId)
        }));
      },

      toggleDriveExpanded: (driveId: string) => {
        set((state) => ({
          drives: state.drives.map(d =>
            d.id === driveId ? { ...d, isExpanded: !d.isExpanded } : d
          )
        }));
      },

      setSelectedFileId: async (fileId: string | null) => {
        set({ selectedFileId: fileId });
        if (!fileId) return;

        const { drives, readFileContent } = get();
        const findNode = (nodes: AttachedFileNode[]): AttachedFileNode | undefined => {
          for (const n of nodes) {
            if (n.id === fileId) return n;
            if (n.children) {
              const found = findNode(n.children);
              if (found) return found;
            }
          }
          return undefined;
        };

        for (const drive of drives) {
          const node = findNode(drive.items);
          if (node && !node.isFolder) {
            let content = node.content || '';
            if (!content) {
              try { content = await readFileContent(node); } catch (_e) {}
            }
            if (content && content.length > 50) {
              try {
                const { CaseStateHarvester } = await import('@/services/legal/CaseStateHarvester');
                const harvested = CaseStateHarvester.getInstance().harvestFromText(content, node.name);
                if (harvested && harvested.applicantName !== 'Active Client Matter') {
                  CaseStateHarvester.getInstance().setActiveCase(harvested);
                }
              } catch (_e) {}
            }
            break;
          }
        }
      },

      togglePinFile: async (file: AttachedFileNode) => {
        const lowerName = (file.name || '').toLowerCase().trim();
        if (
          lowerName === 'desktop.ini' ||
          lowerName === 'thumbs.db' ||
          lowerName === '.ds_store' ||
          lowerName.startsWith('~$') ||
          lowerName.startsWith('._')
        ) {
          return;
        }

        const { pinnedFiles, readFileContent } = get();
        const exists = pinnedFiles.find(f => f.id === file.id || (file.path && f.path === file.path));

        if (exists) {
          set({ pinnedFiles: pinnedFiles.filter(f => f.id !== file.id && (!file.path || f.path !== file.path)) });
        } else {
          let content = file.content || '';
          if (!content) {
            try {
              content = await readFileContent(file);
            } catch (_e) {}
          }

          if (content && content.length > 50) {
            try {
              const { CaseStateHarvester } = await import('@/services/legal/CaseStateHarvester');
              const harvested = CaseStateHarvester.getInstance().harvestFromText(content, file.name);
              if (harvested && harvested.applicantName !== 'Active Client Matter') {
                CaseStateHarvester.getInstance().setActiveCase(harvested);
              }
            } catch (_e) {}
          }

          const newPinned: PinnedFile = {
            id: file.id,
            name: file.name,
            path: file.path,
            content,
            driveId: file.driveId,
            mimeType: file.mimeType,
            file: file.file
          };

          set({ pinnedFiles: [...pinnedFiles, newPinned] });
        }
      },

      togglePinFolder: async (folderNode: AttachedFileNode): Promise<number> => {
        const { pinnedFiles, loadFolderChildren, readFileContent } = get();

        const collectFiles = async (node: AttachedFileNode): Promise<AttachedFileNode[]> => {
          let results: AttachedFileNode[] = [];
          let children = node.children;
          if (!children || children.length === 0 || !node.isLoaded) {
            try {
              children = await loadFolderChildren(node);
            } catch (_e) {
              children = node.children || [];
            }
          }
          if (Array.isArray(children)) {
            for (const child of children) {
              if (child.isFolder) {
                if (results.length < 25) {
                  const subFiles = await collectFiles(child);
                  results = results.concat(subFiles);
                }
              } else {
                results.push(child);
                if (results.length >= 25) break;
              }
            }
          }
          return results;
        };

        const folderFiles = (await collectFiles(folderNode)).slice(0, 25);
        if (folderFiles.length === 0) return 0;

        const folderFileIds = new Set(folderFiles.map(f => f.id));
        const allAlreadyPinned = folderFiles.every(f => pinnedFiles.some(p => p.id === f.id));

        if (allAlreadyPinned) {
          set({ pinnedFiles: pinnedFiles.filter(p => !folderFileIds.has(p.id)) });
          return -folderFiles.length;
        } else {
          const toAdd: PinnedFile[] = [];
          for (const file of folderFiles) {
            const lowerName = (file.name || '').toLowerCase().trim();
            if (
              lowerName === 'desktop.ini' ||
              lowerName === 'thumbs.db' ||
              lowerName === '.ds_store' ||
              lowerName.startsWith('~$') ||
              lowerName.startsWith('._')
            ) {
              continue;
            }
            if (!pinnedFiles.some(p => p.id === file.id || (file.path && p.path === file.path))) {
              let content = file.content || '';
              if (!content) {
                try { content = await readFileContent(file); } catch (_e) {}
              }
              toAdd.push({
                id: file.id,
                name: file.name,
                path: file.path,
                content,
                driveId: file.driveId,
                mimeType: file.mimeType,
                file: file.file
              });
            }
          }
          set({ pinnedFiles: [...pinnedFiles, ...toAdd] });
          return toAdd.length;
        }
      },

      unpinFile: (fileId: string) => {
        set((state) => ({
          pinnedFiles: state.pinnedFiles.filter(f => f.id !== fileId)
        }));
      },

      clearPinnedFiles: () => {
        set({ pinnedFiles: [] });
      },

      readFileContent: async (file: AttachedFileNode): Promise<string> => {
        if (file.content) return file.content;

        if (file.handle && typeof file.handle.getFile === 'function') {
          try {
            const f = await file.handle.getFile();
            const text = await f.text();
            file.content = text;
            return text;
          } catch (e) {
            console.error('Error reading from FileSystemFileHandle:', e);
          }
        }

        if (file.file && typeof file.file.text === 'function') {
          try {
            const text = await file.file.text();
            file.content = text;
            return text;
          } catch (e) {
            console.error('Error reading from File object:', e);
          }
        }

        if (file.path) {
          try {
            const res = await sovereignFs.readFile({ path: file.path });
            if (res?.success && res.content !== undefined) {
              file.content = res.content;
              return res.content;
            }
          } catch (e) {
            console.error('Error reading via sovereignFs:', e);
          }
        }

        return `[Preview: ${file.name} (${file.path})]`;
      },

      refreshGeneratedDocs: async () => {
        try {
          const liveDrive = await getLiveGeneratedDocsDrive();
          set(state => ({
            drives: state.drives.some(d => d.id === 'drive_ai_generated')
              ? state.drives.map(d => d.id === 'drive_ai_generated' ? liveDrive : d)
              : [liveDrive, ...state.drives]
          }));
        } catch (err) {
          console.warn('[GenieDrive] refreshGeneratedDocs failed:', err);
        }
      },

      addGeneratedDocument: (title: string, content: string, path?: string) => {
        const id = `gen_${Date.now()}`;
        const fileName = title.endsWith('.md') ? title : `${title}.md`;
        const filePath = path || `AI_GENERATED_DOCS/${fileName}`;

        const newDocNode: AttachedFileNode = {
          id,
          name: fileName,
          isFolder: false,
          path: filePath,
          size: content.length,
          extension: 'md',
          mimeType: 'text/markdown',
          driveId: 'drive_ai_generated',
          lastModified: new Date().toISOString(),
          content
        };

        set((state) => {
          const genDrive = state.drives.find(d => d.id === 'drive_ai_generated') || defaultGeneratedDocsDrive;
          const updatedItems = [newDocNode, ...genDrive.items.filter(i => i.name !== fileName)];
          const updatedGenDrive = {
            ...genDrive,
            items: updatedItems,
            fileCount: updatedItems.length
          };

          return {
            drives: [updatedGenDrive, ...state.drives.filter(d => d.id !== 'drive_ai_generated')],
            selectedFileId: id
          };
        });
      },

      autoMountSovereignDrives: async () => {
        const state = get();
        // Step 0: Ensure local AI_GENERATED_DOCS tree is fresh from disk
        try {
          await state.refreshGeneratedDocs();
        } catch {}

        // If a drive was erroneously mounted to only .GENIEFLOW_MASTER, purge it so full Google Drive root mounts
        const hasMasterOnly = state.drives.some(d =>
          d.rootPath?.includes('.GENIEFLOW_MASTER') && d.name.includes('Google Drive')
        );
        if (hasMasterOnly) {
          console.log('[GenieDrive] Upgrading subfolder mount (.GENIEFLOW_MASTER) to full Google Drive root...');
          set(s => ({
            drives: s.drives.filter(d => !(d.rootPath?.includes('.GENIEFLOW_MASTER') && d.name.includes('Google Drive')))
          }));
        }

        const currentState = get();
        const hasFullGDrive = currentState.drives.some(d =>
          (d.rootPath === 'G:\\My Drive' || d.rootPath === 'G:\\') && (d.items?.length || 0) > 0
        );
        const hasTravelDrive = currentState.drives.some(d =>
          d.rootPath === 'E:\\' && (d.items?.length || 0) > 0
        );

        // 1. Mount Google Drive root if not already mounted
        if (!hasFullGDrive) {
          const gdriveCandidates = ['G:\\My Drive', 'G:\\'];
          for (const p of gdriveCandidates) {
            try {
              const res = await sovereignFs.listFiles({ path: p });
              if (res?.success && Array.isArray(res.files) && res.files.length > 0) {
                console.log(`🚀 [GenieDrive] Auto-mounting sovereign master Google Drive from: ${p}`);
                await currentState.attachDriveFromFolderPath(p);
                try {
                  const currentLinked = JSON.parse(localStorage.getItem('genieflow_linked_drives') || '[]');
                  if (!currentLinked.includes(p)) {
                    localStorage.setItem('genieflow_linked_drives', JSON.stringify([...currentLinked, p]));
                  }
                } catch {}
                break;
              }
            } catch {}
          }
        }

        // 2. Mount Travel Drive E:\ if not already mounted
        if (!hasTravelDrive) {
          try {
            const res = await sovereignFs.listFiles({ path: 'E:\\' });
            if (res?.success && Array.isArray(res.files) && res.files.length > 0) {
              console.log(`🚀 [GenieDrive] Auto-mounting sovereign Travel Drive (E:\\)...`);
              await currentState.attachDriveFromFolderPath('E:\\');
              try {
                const currentLinked = JSON.parse(localStorage.getItem('genieflow_linked_drives') || '[]');
                if (!currentLinked.includes('E:\\')) {
                  localStorage.setItem('genieflow_linked_drives', JSON.stringify([...currentLinked, 'E:\\']));
                }
              } catch {}
            }
          } catch {}
        }

        // 3. Browser / Web environment fallback
        try {
          const linkedRaw = localStorage.getItem('genieflow_linked_drives');
          const linked = linkedRaw ? JSON.parse(linkedRaw) : ['gdrive'];
          if (!hasFullGDrive && (linked.includes('gdrive') || linked.some((p: string) => p.includes('G:') || p.includes('Google')))) {
            console.log(`🚀 [GenieDrive] Auto-mounting previously linked Google Drive (G:\\My Drive)...`);
            await currentState.attachPreconfiguredDrive('gdrive');
            localStorage.setItem('genieflow_linked_drives', JSON.stringify(Array.from(new Set([...linked, 'gdrive']))));
          }
          if (!hasTravelDrive && (linked.includes('travel') || linked.some((p: string) => p.includes('E:') || p.includes('Travel')))) {
            console.log(`🚀 [GenieDrive] Auto-mounting previously linked Travel Drive (E:\\)...`);
            await currentState.attachPreconfiguredDrive('travel');
          }
        } catch (err) {
          console.warn('[GenieDrive] Web auto-mount fallback encountered:', err);
        }
      }
    }),
    {
      name: 'genieflow-attached-drives',
      partialize: (state) => ({
        pinnedFiles: (state.pinnedFiles || []).slice(-20).map(p => ({
          id: p.id,
          name: p.name,
          path: p.path,
          driveId: p.driveId,
          mimeType: p.mimeType
        }))
      })
    }
  )
);
