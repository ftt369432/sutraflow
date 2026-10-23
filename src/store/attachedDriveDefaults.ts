import type { AttachedFileNode, AttachedDrive } from './attachedDriveTypes';
import { sovereignFs } from '../services/fs/sovereignFsBridge';

// Helper to determine mime type from extension
export function getMimeType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.md')) return 'text/markdown';
  if (lower.endsWith('.txt')) return 'text/plain';
  if (lower.endsWith('.json')) return 'application/json';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (lower.endsWith('.html')) return 'text/html';
  return 'text/plain';
}

// Recursively traverse FileSystemDirectoryHandle
export async function traverseDirectoryHandle(dirHandle: any, parentPath: string, driveId: string): Promise<AttachedFileNode[]> {
  const results: AttachedFileNode[] = [];
  try {
    for await (const entry of dirHandle.values()) {
      const entryPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;
      const id = `${driveId}_${entryPath.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

      if (entry.kind === 'directory') {
        const children = await traverseDirectoryHandle(entry, entryPath, driveId);
        results.push({
          id,
          name: entry.name,
          isFolder: true,
          path: entryPath,
          children,
          handle: entry,
          driveId
        });
      } else if (entry.kind === 'file') {
        let size = 0;
        let lastModified = new Date().toISOString();
        try {
          const fileObj = await entry.getFile();
          size = fileObj.size;
          lastModified = new Date(fileObj.lastModified).toISOString();
        } catch (_e) {}

        results.push({
          id,
          name: entry.name,
          isFolder: false,
          path: entryPath,
          size,
          extension: entry.name.split('.').pop() || '',
          mimeType: getMimeType(entry.name),
          handle: entry,
          driveId,
          lastModified
        });
      }
    }
  } catch (err) {
    console.error(`Failed to traverse directory handle ${dirHandle.name}:`, err);
  }

  return results.sort((a, b) => {
    if (a.isFolder === b.isFolder) return a.name.localeCompare(b.name);
    return a.isFolder ? -1 : 1;
  });
}

// Build hierarchical tree from flat FileList (e.g. from webkitdirectory)
export function buildTreeFromFileList(files: File[], driveId: string): AttachedFileNode[] {
  const rootMap = new Map<string, AttachedFileNode>();

  for (const file of files) {
    const relPath = (file as any).webkitRelativePath || file.name;
    const parts = relPath.split('/');
    
    if (parts.length === 1) {
      const id = `${driveId}_${file.name}`;
      rootMap.set(file.name, {
        id,
        name: file.name,
        isFolder: false,
        path: file.name,
        size: file.size,
        extension: file.name.split('.').pop() || '',
        mimeType: file.type || getMimeType(file.name),
        file,
        driveId,
        lastModified: new Date(file.lastModified).toISOString()
      });
      continue;
    }

    let currentPath = '';
    let currentChildren = rootMap;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const nodeId = `${driveId}_${currentPath.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

      if (isLast) {
        currentChildren.set(part, {
          id: nodeId,
          name: part,
          isFolder: false,
          path: currentPath,
          size: file.size,
          extension: part.split('.').pop() || '',
          mimeType: file.type || getMimeType(part),
          file,
          driveId,
          lastModified: new Date(file.lastModified).toISOString()
        });
      } else {
        if (!currentChildren.has(part)) {
          currentChildren.set(part, {
            id: nodeId,
            name: part,
            isFolder: true,
            path: currentPath,
            children: [],
            driveId
          });
        }
        const dirNode = currentChildren.get(part)!;
        if (!dirNode.children) dirNode.children = [];
        let childMap = (dirNode as any)._childMap;
        if (!childMap) {
          childMap = new Map<string, AttachedFileNode>();
          dirNode.children.forEach(c => childMap.set(c.name, c));
          (dirNode as any)._childMap = childMap;
        }
        currentChildren = childMap;
      }
    }
  }

  function mapToArray(map: Map<string, AttachedFileNode>): AttachedFileNode[] {
    const arr: AttachedFileNode[] = [];
    for (const node of map.values()) {
      if (node.isFolder && (node as any)._childMap) {
        node.children = mapToArray((node as any)._childMap);
        delete (node as any)._childMap;
      }
      arr.push(node);
    }
    return arr.sort((a, b) => {
      if (a.isFolder === b.isFolder) return a.name.localeCompare(b.name);
      return a.isFolder ? -1 : 1;
    });
  }

  return mapToArray(rootMap);
}

export function countFilesInNodes(nodes: AttachedFileNode[]): number {
  let count = 0;
  for (const n of nodes) {
    if (n.isFolder && n.children) {
      count += countFilesInNodes(n.children);
    } else {
      count += 1;
    }
  }
  return count;
}

export const defaultGeneratedDocsDrive: AttachedDrive = {
  id: 'drive_ai_generated',
  name: 'AI Generated Documents & Brain',
  type: 'generated',
  rootPath: 'AI_GENERATED_DOCS',
  isExpanded: true,
  fileCount: 7,
  attachedAt: new Date().toISOString(),
  items: [
    {
      id: 'gen_folder_ramirez',
      name: 'RAMIREZ_YOLANDA',
      isFolder: true,
      path: 'AI_GENERATED_DOCS/RAMIREZ_YOLANDA',
      driveId: 'drive_ai_generated',
      isLoaded: true,
      children: [
        {
          id: 'gen_doc_ramirez_request',
          name: 'REQUEST_FOR_APPROVAL_TO_ANSWER_WCJ_REPORT_RAMIREZ_ADJ20377197.md',
          isFolder: false,
          path: 'AI_GENERATED_DOCS/RAMIREZ_YOLANDA/REQUEST_FOR_APPROVAL_TO_ANSWER_WCJ_REPORT_RAMIREZ_ADJ20377197.md',
          size: 8044,
          extension: 'md',
          mimeType: 'text/markdown',
          driveId: 'drive_ai_generated',
          lastModified: new Date().toISOString()
        },
        {
          id: 'gen_doc_ramirez_response',
          name: 'PROPOSED_RESPONSE_TO_WCJ_REPORT_RAMIREZ_ADJ20377197.md',
          isFolder: false,
          path: 'AI_GENERATED_DOCS/RAMIREZ_YOLANDA/PROPOSED_RESPONSE_TO_WCJ_REPORT_RAMIREZ_ADJ20377197.md',
          size: 25241,
          extension: 'md',
          mimeType: 'text/markdown',
          driveId: 'drive_ai_generated',
          lastModified: new Date().toISOString()
        },
        {
          id: 'gen_doc_ramirez_log',
          name: 'PROCESS_AND_AUDIT_LOG_RAMIREZ_ADJ20377197.md',
          isFolder: false,
          path: 'AI_GENERATED_DOCS/RAMIREZ_YOLANDA/PROCESS_AND_AUDIT_LOG_RAMIREZ_ADJ20377197.md',
          size: 12078,
          extension: 'md',
          mimeType: 'text/markdown',
          driveId: 'drive_ai_generated',
          lastModified: new Date().toISOString()
        }
      ]
    },
    {
      id: 'gen_folder_test_cases',
      name: 'TEST_CASES',
      isFolder: true,
      path: 'AI_GENERATED_DOCS/TEST_CASES',
      driveId: 'drive_ai_generated',
      isLoaded: true,
      children: [
        {
          id: 'gen_doc_john_doe',
          name: 'JOHN_DOE_BENCHMARK_MOCK.md',
          isFolder: false,
          path: 'AI_GENERATED_DOCS/TEST_CASES/JOHN_DOE_BENCHMARK_MOCK.md',
          size: 5662,
          extension: 'md',
          mimeType: 'text/markdown',
          driveId: 'drive_ai_generated',
          lastModified: new Date().toISOString()
        }
      ]
    },
    {
      id: 'gen_doc_penalty_tmpl',
      name: 'Master_Penalty_Petition_Template_LC5814.md',
      isFolder: false,
      path: 'AI_GENERATED_DOCS/Master_Penalty_Petition_Template_LC5814.md',
      size: 7043,
      extension: 'md',
      mimeType: 'text/markdown',
      driveId: 'drive_ai_generated',
      lastModified: new Date().toISOString()
    },
    {
      id: 'gen_doc_audit_report',
      name: 'system_audit_and_feature_pruning_report.md',
      isFolder: false,
      path: 'AI_GENERATED_DOCS/system_audit_and_feature_pruning_report.md',
      size: 3655,
      extension: 'md',
      mimeType: 'text/markdown',
      driveId: 'drive_ai_generated',
      lastModified: new Date().toISOString()
    },
    {
      id: 'gen_doc_recon_precedent',
      name: 'Precedent_Brief_Reconsideration_8CCR10964.md',
      isFolder: false,
      path: 'AI_GENERATED_DOCS/Precedent_Brief_Reconsideration_8CCR10964.md',
      size: 5120,
      extension: 'md',
      mimeType: 'text/markdown',
      driveId: 'drive_ai_generated',
      lastModified: new Date().toISOString()
    }
  ]
};

export const getPreconfiguredDriveItems = (type: 'travel' | 'gdrive', driveId: string): { name: string; items: AttachedFileNode[] } => {
  if (type === 'travel') {
    return {
      name: 'Travel Drive (E:\\)',
      items: [
        {
          id: `${driveId}_apex`,
          name: '00 APEX DOCS',
          isFolder: true,
          path: '00 APEX DOCS',
          driveId,
          isLoaded: true,
          children: []
        },
        {
          id: `${driveId}_clients`,
          name: 'clients',
          isFolder: true,
          path: 'clients',
          driveId,
          isLoaded: true,
          children: []
        },
        {
          id: `${driveId}_brain_e`,
          name: '.genieflowai.brain',
          isFolder: true,
          path: 'E:\\.genieflowai.brain',
          driveId,
          isLoaded: true,
          children: [
            {
              id: `${driveId}_manifest_e`,
              name: 'MASTER_MANIFEST.md',
              isFolder: false,
              path: 'E:\\.genieflowai.brain\\MASTER_MANIFEST.md',
              size: 8900,
              extension: 'md',
              mimeType: 'text/markdown',
              driveId
            }
          ]
        },
        {
          id: `${driveId}_cases`,
          name: 'Clients & Cases',
          isFolder: true,
          path: 'E:\\clients',
          driveId,
          isLoaded: true,
          children: []
        }
      ]
    };
  }

  return {
    name: 'Google Drive (G:\\My Drive)',
    items: [
      {
        id: `${driveId}_master`,
        name: '.GENIEFLOW_MASTER',
        isFolder: true,
        path: 'G:\\My Drive\\.GENIEFLOW_MASTER',
        driveId,
        isLoaded: true,
        children: [
          {
            id: `${driveId}_manifest`,
            name: 'MASTER_MANIFEST.md',
            isFolder: false,
            path: 'G:\\My Drive\\.GENIEFLOW_MASTER\\MASTER_MANIFEST.md',
            size: 8900,
            extension: 'md',
            mimeType: 'text/markdown',
            driveId
          },
          {
            id: `${driveId}_templates`,
            name: '00_TEMPLATES',
            isFolder: true,
            path: 'G:\\My Drive\\.GENIEFLOW_MASTER\\00_TEMPLATES',
            driveId,
            children: [
              {
                id: `${driveId}_recon_tmpl`,
                name: 'PETITION_FOR_RECONSIDERATION_STANDARD.md',
                isFolder: false,
                path: 'G:\\My Drive\\.GENIEFLOW_MASTER\\00_TEMPLATES\\PETITION_FOR_RECONSIDERATION_STANDARD.md',
                size: 4500,
                extension: 'md',
                mimeType: 'text/markdown',
                driveId,
                content: `# PETITION FOR RECONSIDERATION (8 CCR § 10964)\n\nConforming California 28-line legal formatting template.`
              }
            ]
          }
        ]
      },
      {
        id: `${driveId}_allen`,
        name: '00 ALLEN',
        isFolder: true,
        path: 'G:\\My Drive\\00 ALLEN',
        driveId,
        isLoaded: true,
        children: [
          {
            id: `${driveId}_ramirez`,
            name: 'RAMIREZ, YOLANDA',
            isFolder: true,
            path: 'G:\\My Drive\\00 ALLEN\\RAMIREZ, YOLANDA',
            driveId,
            isLoaded: true,
            children: [
              {
                id: `${driveId}_ramirez_wcj_rep`,
                name: 'RAMIREZ, YOLANDA - WCJ REPORT AND RECOMMENDATION.docx',
                isFolder: false,
                path: 'G:\\My Drive\\00 ALLEN\\RAMIREZ, YOLANDA\\RAMIREZ, YOLANDA - WCJ REPORT AND RECOMMENDATION.docx',
                size: 15400,
                extension: 'docx',
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                driveId
              },
              {
                id: `${driveId}_ramirez_recon`,
                name: 'RAMIREZ, YOLANDA - PETITION FOR RECONSIDERATION (DISC & COMPLAINT).docx',
                isFolder: false,
                path: 'G:\\My Drive\\00 ALLEN\\RAMIREZ, YOLANDA\\RAMIREZ, YOLANDA - PETITION FOR RECONSIDERATION (DISC & COMPLAINT).docx',
                size: 28400,
                extension: 'docx',
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                driveId
              }
            ]
          }
        ]
      }
    ]
  };
};

// Build hierarchical tree from local filesystem (Electron native bridge or Vite HTTP API, lazy or eager depth)
export async function buildTreeFromElectronFs(rootPath: string, driveId: string, depth = 0, maxDepth = 1): Promise<AttachedFileNode[]> {
  // Ensure Windows drive root has trailing slash (e.g. G: -> G:\)
  const normalizedPath = /^[a-zA-Z]:$/.test(rootPath) ? `${rootPath}\\` : rootPath;

  try {
    const res = await sovereignFs.listFiles({ path: normalizedPath });
    if (!res?.success || !Array.isArray(res.files)) {
      console.warn(`[GenieDrive] listFiles returned empty or error for ${normalizedPath}:`, res?.error);
      return [];
    }

    const results: AttachedFileNode[] = [];
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
      let id = `${driveId}_${(file.path || baseName).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      if (seenIds.has(id)) {
        id = `${id}_${i}`;
      }
      seenIds.add(id);

      if (file.isDirectory) {
        let children: AttachedFileNode[] = [];
        let isLoaded = false;
        // Preload children if within maxDepth
        if (depth < maxDepth) {
          children = await buildTreeFromElectronFs(file.path, driveId, depth + 1, maxDepth);
          isLoaded = true;
        }

        results.push({
          id,
          name: baseName,
          isFolder: true,
          path: file.path,
          children,
          isLoaded,
          driveId
        });
      } else {
        results.push({
          id,
          name: baseName,
          isFolder: false,
          path: file.path,
          size: file.size,
          extension: baseName.split('.').pop() || '',
          mimeType: getMimeType(baseName),
          driveId,
          lastModified: file.lastModified
        });
      }
    }
    return results.sort((a, b) => {
      if (a.isFolder === b.isFolder) return a.name.localeCompare(b.name);
      return a.isFolder ? -1 : 1;
    });
  } catch (err) {
    console.error(`Failed to read path ${rootPath}:`, err);
    return [];
  }
}

// Dynamically scan AI_GENERATED_DOCS directory on disk
export async function getLiveGeneratedDocsDrive(): Promise<AttachedDrive> {
  const items = await buildTreeFromElectronFs('AI_GENERATED_DOCS', 'drive_ai_generated', 0, 2);
  const fileCount = countFilesInNodes(items);
  return {
    id: 'drive_ai_generated',
    name: 'AI Generated Documents & Brain',
    type: 'generated',
    rootPath: 'AI_GENERATED_DOCS',
    isExpanded: true,
    fileCount: fileCount || defaultGeneratedDocsDrive.fileCount,
    attachedAt: new Date().toISOString(),
    items: items.length > 0 ? items : defaultGeneratedDocsDrive.items
  };
}

