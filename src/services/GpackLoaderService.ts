import { LoadedSkill, GpackManifest, GpackTool, skillStack } from './GpackService';

export class GpackLoaderService {
  /**
   * Unpacks a .gpack archive and registers it in the local workspace.
   * If running in Electron, it will write the tool scripts and knowledge files
   * to the local user_tools directory so they can be executed by the Python bridge.
   */
  static async unpackAndRegister(
    file: File | Blob,
    manifest: GpackManifest,
    toolRegistry: GpackTool[]
  ): Promise<{ success: boolean; filesExtracted: number; error?: string }> {
    try {
      console.log(`🤖 GpackLoaderService: Unpacking skill "${manifest.name}"...`);
      const bridge = (window as any).electronBridge;
      if (!bridge) {
        console.warn('⚠️ GpackLoaderService: Not running in Electron. Staging to disk skipped.');
        return { success: true, filesExtracted: 0 };
      }

      // 1. Get all entries from the ZIP file
      const zipEntries = await this.extractAllFilesFromZip(file);
      let filesExtracted = 0;

      // 2. Write files to the local user_tools folder
      for (const entry of zipEntries) {
        // We extract python scripts, compiled bytecode, knowledge files, and json configs
        const isTargetFile = entry.name.endsWith('.py') ||
                             entry.name.endsWith('.pyc') ||
                             entry.name.endsWith('.gkb') ||
                             entry.name.endsWith('.json');

        if (!isTargetFile) continue;

        // Flatten subdirectories or place inside the user_tools structure
        const fileName = entry.name.split('/').pop();
        if (!fileName || fileName === '__init__.py') continue;

        // Prefix with the slug to prevent namespace collision in user_tools
        const targetFilename = `${manifest.slug}_${fileName}`;
        const targetPath = `genieflowos-mcp/user_tools/${targetFilename}`;

        console.log(`📝 GpackLoaderService: Extracting ${entry.name} -> ${targetPath}`);
        
        // Write the file content (which we convert to base64) to disk
        const base64Content = this.arrayBufferToBase64(entry.content);
        const writeRes = await bridge.fs.writeFile({
          path: targetPath,
          content: base64Content,
          encoding: 'base64'
        });

        if (!writeRes.success) {
          throw new Error(`Failed to write file ${targetPath}: ${writeRes.error}`);
        }

        filesExtracted++;
      }

      console.log(`✅ GpackLoaderService: Successfully unpacked ${filesExtracted} files for "${manifest.name}"`);
      return { success: true, filesExtracted };

    } catch (err: any) {
      console.error('❌ GpackLoaderService: Unpacking failed:', err);
      return { success: false, filesExtracted: 0, error: err.message };
    }
  }

  /**
   * Helper to convert ArrayBuffer to base64 string
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Extract all files from a ZIP archive
   */
  private static async extractAllFilesFromZip(file: File | Blob): Promise<Array<{ name: string; content: ArrayBuffer }>> {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const results: Array<{ name: string; content: ArrayBuffer }> = [];

    // Find End of Central Directory record (signature: 0x06054b50)
    let eocdOffset = bytes.length - 22;
    while (eocdOffset >= 0) {
      if (bytes[eocdOffset] === 0x50 && bytes[eocdOffset + 1] === 0x4b &&
          bytes[eocdOffset + 2] === 0x05 && bytes[eocdOffset + 3] === 0x06) break;
      eocdOffset--;
    }
    if (eocdOffset < 0) throw new Error('Invalid ZIP file');

    const view = new DataView(buffer);
    const cdOffset = view.getUint32(eocdOffset + 16, true);
    const cdSize = view.getUint32(eocdOffset + 12, true);

    // Walk Central Directory entries
    let pos = cdOffset;
    while (pos < cdOffset + cdSize) {
      const sig = view.getUint32(pos, true);
      if (sig !== 0x02014b50) break;

      const compMethod = view.getUint16(pos + 10, true);
      const compSize = view.getUint32(pos + 20, true);
      const uncompSize = view.getUint32(pos + 24, true);
      const nameLen = view.getUint16(pos + 28, true);
      const extraLen = view.getUint16(pos + 30, true);
      const commentLen = view.getUint16(pos + 32, true);
      const localOffset = view.getUint32(pos + 42, true);
      const entryName = new TextDecoder().decode(bytes.slice(pos + 46, pos + 46 + nameLen));

      pos += 46 + nameLen + extraLen + commentLen;

      // Found entry — read local file header
      const localExtraLen = view.getUint16(localOffset + 28, true);
      const dataStart = localOffset + 30 + nameLen + localExtraLen;
      const compData = bytes.slice(dataStart, dataStart + compSize);

      let rawData: Uint8Array;
      if (compMethod === 0) {
        rawData = compData;
      } else if (compMethod === 8) {
        const ds = new DecompressionStream('deflate-raw');
        const writer = ds.writable.getWriter();
        writer.write(compData);
        writer.close();
        const chunks: Uint8Array[] = [];
        const reader = ds.readable.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        const total = chunks.reduce((s, c) => s + c.length, 0);
        rawData = new Uint8Array(total);
        let offset = 0;
        for (const chunk of chunks) { rawData.set(chunk, offset); offset += chunk.length; }
      } else {
        continue; // skip unsupported compression
      }

      results.push({
        name: entryName,
        content: rawData.buffer
      });
    }

    return results;
  }
}
