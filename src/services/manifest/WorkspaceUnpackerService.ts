import { aiDriveService } from '../drive/aiDriveService';
import { supabase } from '../../lib/supabaseClient';
import { ManifestParserService, ParsedManifest } from './ManifestParserService';
import { AssistantFactoryService } from './AssistantFactoryService';

export interface UnpackLog {
  success: boolean;
  log: string[];
  parsedManifest?: ParsedManifest;
}

export class WorkspaceUnpackerService {
  /**
   * Unpacks a local Antigravity workspace structure and syncs it with the cloud DB (AI Drive).
   */
  static async unpackLocalWorkspace(rootPath: string): Promise<UnpackLog> {
    const logs: string[] = [];
    logs.push(`🚀 Starting unpacker for workspace at: ${rootPath}`);

    const bridge = (window as any).electronBridge;
    if (!bridge) {
      const errMsg = '❌ Error: Electron filesystem bridge is not available. Please run in GenieFlow App context.';
      logs.push(errMsg);
      return { success: false, log: logs };
    }

    try {
      // 1. Read MASTER_MANIFEST.md
      const manifestPath = `${rootPath}/MASTER_MANIFEST.md`.replace(/\\/g, '/');
      logs.push(`📖 Reading MASTER_MANIFEST.md from: ${manifestPath}`);
      
      const readRes = await bridge.fs.readFile({ path: manifestPath });
      if (!readRes.success || !readRes.content) {
        throw new Error(`Failed to read MASTER_MANIFEST.md: ${readRes.error || 'File not found'}`);
      }

      // Decode content if it was returned as base64 (or plain text)
      let manifestContent = readRes.content;
      if (readRes.content.startsWith('data:') || !readRes.content.includes('#')) {
        try {
          // If base64 encoded, decode it
          const base64Data = readRes.content.split(',')[1] || readRes.content;
          manifestContent = atob(base64Data);
        } catch (e) {
          logs.push(`⚠️ Warning: Failed base64 decode check on manifest content. Using raw string.`);
        }
      }

      // 2. Parse the manifest
      const parsedManifest = ManifestParserService.parse(manifestContent);
      logs.push(`✅ Parsed manifest. Found ${parsedManifest.cardinalRules.length} Cardinal Rules and ${parsedManifest.files.length} defined files.`);

      // Sync MASTER_MANIFEST.md itself to cloud root
      await this.syncFileToCloud('MASTER_MANIFEST.md', manifestContent, null, logs);

      // 3. Recreate directory structures and sync files
      // We will track created folders to map local paths to cloud parent folder IDs
      const folderMap = new Map<string, string>(); // key: local relative path, value: cloud folderId

      for (const fileRef of parsedManifest.files) {
        const localFilePath = `${rootPath}/${fileRef.relativePath}`.replace(/\\/g, '/');
        logs.push(`Syncing file: ${fileRef.relativePath}`);

        // Read local file content
        const fileRead = await bridge.fs.readFile({ path: localFilePath });
        if (!fileRead.success || !fileRead.content) {
          logs.push(`⚠️ Skip: Could not read file ${localFilePath} (${fileRead.error || 'Empty content'})`);
          continue;
        }

        let fileContent = fileRead.content;
        // Check if base64 encoded and decode
        if (!fileContent.includes('\n') && fileContent.length > 50) {
          try {
            fileContent = atob(fileContent);
          } catch (e) {}
        }

        // Get or create parent folders path in cloud
        const pathSegments = fileRef.relativePath.split('/');
        const fileName = pathSegments.pop() || '';
        
        let parentFolderId: string | null = null;
        let currentPathAcc = '';

        for (const segment of pathSegments) {
          currentPathAcc = currentPathAcc ? `${currentPathAcc}/${segment}` : segment;
          if (folderMap.has(currentPathAcc)) {
            parentFolderId = folderMap.get(currentPathAcc) || null;
          } else {
            // Find or create folder in cloud
            const createdId = await this.findOrCreateCloudFolder(segment, parentFolderId, logs);
            folderMap.set(currentPathAcc, createdId);
            parentFolderId = createdId;
          }
        }

        // Sync the file content to cloud
        await this.syncFileToCloud(fileName, fileContent, parentFolderId, logs);
      }

      // 4. Enhance all active assistants with Cardinal Rules
      logs.push(`🤖 Scanning active assistants to inject Cardinal Rules...`);
      const { data: assistants, error: assistantError } = await supabase
        .from('assistants')
        .select('id, name')
        .eq('is_active', true);

      if (assistantError) {
        logs.push(`⚠️ Warning: Could not retrieve assistants for rule injection: ${assistantError.message}`);
      } else if (assistants) {
        for (const assistant of assistants) {
          const enhanced = await AssistantFactoryService.enhanceAssistant(assistant.id, parsedManifest);
          if (enhanced) {
            logs.push(`✨ Enhanced assistant "${assistant.name}" with Cardinal Rules & Templates list.`);
          } else {
            logs.push(`❌ Failed to enhance assistant "${assistant.name}".`);
          }
        }
      }

      logs.push(`🎉 Unpacking and cloud synchronization completed successfully!`);
      return { success: true, log: logs, parsedManifest };

    } catch (error: any) {
      const errMsg = `❌ Error during unpacker run: ${error.message || error}`;
      logs.push(errMsg);
      console.error(error);
      return { success: false, log: logs };
    }
  }

  /**
   * Helper to find or create a folder in the cloud AI Drive
   */
  private static async findOrCreateCloudFolder(
    name: string,
    parentId: string | null,
    logs: string[]
  ): Promise<string> {
    try {
      const files = await aiDriveService.listFiles(parentId);
      const existingFolder = files.find(f => f.is_folder && f.name === name);
      if (existingFolder) {
        return existingFolder.id;
      }
      
      logs.push(`📁 Creating cloud folder: "${name}" (parent: ${parentId || 'root'})`);
      const newFolder = await aiDriveService.createFolder(name, parentId);
      return newFolder.id;
    } catch (e: any) {
      logs.push(`⚠️ Error creating cloud folder "${name}": ${e.message || e}`);
      throw e;
    }
  }

  /**
   * Helper to sync a file's content to the cloud AI Drive
   */
  private static async syncFileToCloud(
    name: string,
    content: string,
    folderId: string | null,
    logs: string[]
  ): Promise<void> {
    try {
      const files = await aiDriveService.listFiles(folderId);
      const existingFile = files.find(f => !f.is_folder && f.name === name);

      if (existingFile) {
        logs.push(`📝 Updating existing cloud document: "${name}"`);
        await aiDriveService.updateCanvasDocument(existingFile.id, content, name, 'document');
      } else {
        logs.push(`📤 Creating new cloud document: "${name}"`);
        await aiDriveService.saveCanvasDocument(name, content, 'document', folderId);
      }
    } catch (e: any) {
      logs.push(`⚠️ Error syncing file "${name}" to cloud: ${e.message || e}`);
    }
  }
}
