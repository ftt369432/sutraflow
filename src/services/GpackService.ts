/**
 * 🎒 GpackService
 * ================
 * The engine behind GenieFlow's stackable MCP skill system.
 * 
 * Like Claude Desktop's MCP tool loading — users stack multiple .gpack skills
 * on top of each other. Each pack registers its tools into the SkillBridge,
 * making them callable by the AI alongside all other installed packs.
 * 
 * Flow:
 *   Creator: package_assistant.py → .gpack → publishToMarketplace()
 *   Buyer:   installFromMarketplace() → unpackToSkillBridge() → tools callable
 *   AI:      skillBridge.nodeInvoke('legal_eagle.genie_brief', {...})
 */

import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { GpackLoaderService } from './GpackLoaderService';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GpackManifest {
  format: 'gpack-v1';
  name: string;
  slug: string;
  description: string;
  category: string;
  version: string;
  pricing_model: 'free' | 'subscription' | 'one_time';
  price_monthly: number;
  price_lifetime: number;
  compiled_at: string;
  tags: string[];
  capabilities: string[];
  templates: string[];
  tool_count: number;
  mcp_entry: string;
  protection: string;
}

export interface GpackTool {
  name: string;
  description: string;
  source_module: string;
  // Prefixed at runtime: e.g. 'legal_eagle.genie_brief'
  qualified_name?: string;
}

export interface LoadedSkill {
  packId: string;
  packName: string;
  slug: string;
  manifest: GpackManifest;
  tools: GpackTool[];
  installedAt: string;
  status: 'active' | 'paused' | 'error';
}

// ─── Skill Stack (in-memory registry, like Claude's tool list) ─────────────

class SkillStack {
  private stacks = new Map<string, LoadedSkill>();

  /** Add/update a pack in the stack */
  register(skill: LoadedSkill) {
    this.stacks.set(skill.slug, skill);
    console.log(`[SkillStack] Registered: ${skill.packName} (${skill.tools.length} tools)`);
    this._persist();
  }

  /** Remove a pack from the stack */
  unregister(slug: string) {
    this.stacks.delete(slug);
    console.log(`[SkillStack] Unregistered: ${slug}`);
    this._persist();
  }

  /** Get all active tools across ALL loaded packs (the stacked tool list) */
  getAllTools(): GpackTool[] {
    const tools: GpackTool[] = [];
    for (const skill of this.stacks.values()) {
      if (skill.status !== 'active') continue;
      for (const tool of skill.tools) {
        tools.push({
          ...tool,
          // Namespaced: 'legal_eagle.genie_brief' — avoids collisions between packs
          qualified_name: `${skill.slug}.${tool.name}`,
        });
      }
    }
    return tools;
  }

  /** Get all loaded skill packs */
  getStack(): LoadedSkill[] {
    return Array.from(this.stacks.values());
  }

  /** Check if a tool exists in any loaded pack */
  resolveToolPack(qualifiedName: string): LoadedSkill | null {
    const [slug] = qualifiedName.split('.');
    return this.stacks.get(slug) || null;
  }

  /** Toggle a pack on/off without uninstalling it */
  togglePack(slug: string, active: boolean) {
    const skill = this.stacks.get(slug);
    if (skill) {
      skill.status = active ? 'active' : 'paused';
      this._persist();
    }
  }

  /** Restore persisted stack from localStorage on startup */
  hydrate() {
    try {
      const saved = localStorage.getItem('genieflow_skill_stack');
      if (saved) {
        const parsed: LoadedSkill[] = JSON.parse(saved);
        parsed.forEach(s => this.stacks.set(s.slug, s));
        console.log(`[SkillStack] Hydrated ${parsed.length} skills from storage`);
      }
    } catch { /* fresh start */ }
  }

  private _persist() {
    try {
      localStorage.setItem('genieflow_skill_stack', JSON.stringify(this.getStack()));
    } catch { /* quota exceeded, ignore */ }
  }
}

// Singleton skill stack — shared across the whole app
export const skillStack = new SkillStack();
skillStack.hydrate(); // Restore on startup

// ─── GpackService ─────────────────────────────────────────────────────────

class GpackService {

  // ── CREATOR: Publish a .gpack to the Marketplace ──────────────────────────

  /**
   * Called from CreatorDashboard "Publish to Marketplace" button.
   * Uploads the .gpack file to Supabase Storage, then inserts the listing row.
   */
  async publishToMarketplace(
    gpackFile: File,
    meta: {
      name: string;
      description: string;
      category: string;
      price_monthly: number;
      price_lifetime: number;
      pricing_model: 'free' | 'subscription' | 'one_time';
      tags: string[];
    }
  ): Promise<{ success: boolean; listingId?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Read manifest from the .gpack archive in-browser
      const manifest = await this._readManifestFromFile(gpackFile);
      const toolRegistry = await this._readToolRegistryFromFile(gpackFile);

      // 2. Upload .gpack to Supabase Storage
      const storagePath = `gpack/${user.id}/${manifest.slug}-v${manifest.version}.gpack`;
      const { error: uploadError } = await supabase.storage
        .from('assistant-packs')
        .upload(storagePath, gpackFile, { upsert: true, contentType: 'application/octet-stream' });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('assistant-packs')
        .getPublicUrl(storagePath);
      const gpackUrl = urlData.publicUrl;

      // 3. Ensure creator profile exists
      await supabase.from('creator_profiles').upsert({
        user_id: user.id,
        display_name: user.email?.split('@')[0] || 'Creator',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      // 4. Insert marketplace listing
      const slug = `${manifest.slug}-${Date.now()}`;
      const { data: listing, error: insertError } = await supabase
        .from('assistant_store')
        .insert({
          creator_id: user.id,
          name: meta.name || manifest.name,
          slug,
          description: meta.description || manifest.description,
          category: meta.category || manifest.category,
          price_monthly: meta.price_monthly,
          price_lifetime: meta.price_lifetime,
          pricing_model: meta.pricing_model,
          version: manifest.version,
          tags: meta.tags || manifest.tags,
          gpack_url: gpackUrl,
          is_published: true,
          downloads: 0,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 5. Also save to professional_agents draft for dashboard tracking
      await supabase.from('professional_agents').insert({
        creator_id: user.id,
        store_id: listing.id,
        name: meta.name || manifest.name,
        description: meta.description,
        status: 'approved',
        mcp_tools: toolRegistry,
        compiled_at: manifest.compiled_at,
      });

      toast.success(`"${meta.name}" is now live on the marketplace!`);
      return { success: true, listingId: listing.id };

    } catch (err: any) {
      console.error('[GpackService] Publish failed:', err);
      toast.error(`Publish failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  // ── BUYER: Install a .gpack and stack its tools ────────────────────────────

  /**
   * Called from AssistantStorePage "Install" button.
   * Downloads the .gpack, reads its tool registry, and registers tools
   * into the skillStack so the AI can call them immediately.
   */
  async installFromMarketplace(
    assistantId: string,
    gpackUrl: string,
    packName: string
  ): Promise<{ success: boolean; toolsLoaded: number; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      toast.loading(`Installing ${packName}...`, { id: 'gpack-install' });

      // 1. Fetch the .gpack file
      const response = await fetch(gpackUrl);
      if (!response.ok) throw new Error(`Download failed: ${response.status}`);
      const blob = await response.blob();
      const file = new File([blob], `${assistantId}.gpack`);

      // 2. Read manifest and tool registry from archive
      const manifest = await this._readManifestFromFile(file);
      const toolRegistry = await this._readToolRegistryFromFile(file);

      // 2.5 Unpack local scripts / assets if running in Electron
      try {
        await GpackLoaderService.unpackAndRegister(file, manifest, toolRegistry);
      } catch (unpackErr: any) {
        console.warn('[GpackService] Local filesystem unpacking failed/skipped:', unpackErr);
      }

      // 3. Register into the skill stack
      const skill: LoadedSkill = {
        packId: assistantId,
        packName: manifest.name,
        slug: manifest.slug,
        manifest,
        tools: toolRegistry,
        installedAt: new Date().toISOString(),
        status: 'active',
      };
      skillStack.register(skill);

      // 4. Record installation in DB
      await supabase.from('user_installed_assistants').upsert({
        user_id: user.id,
        assistant_id: assistantId,
        installed_at: new Date().toISOString(),
        gpack_url: gpackUrl,
        pack_slug: manifest.slug,
      }, { onConflict: 'user_id,assistant_id' });

      // 5. Increment download count
      await supabase
        .from('assistant_store')
        .update({ downloads: supabase.rpc('increment', { row_id: assistantId }) })
        .eq('id', assistantId);

      toast.success(`${packName} installed! ${toolRegistry.length} tools now active.`, { id: 'gpack-install' });
      return { success: true, toolsLoaded: toolRegistry.length };

    } catch (err: any) {
      console.error('[GpackService] Install failed:', err);
      toast.error(`Install failed: ${err.message}`, { id: 'gpack-install' });
      return { success: false, toolsLoaded: 0, error: err.message };
    }
  }

  /**
   * Uninstall a pack — removes it from the skill stack.
   */
  async uninstallPack(slug: string): Promise<void> {
    skillStack.unregister(slug);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('user_installed_assistants')
        .delete()
        .eq('user_id', user.id)
        .eq('pack_slug', slug);
    }
    toast.success(`Pack removed from your skill stack.`);
  }

  /**
   * Restore all previously installed packs on app startup.
   * Called once from App.tsx or the workspace init.
   */
  async rehydrateInstalledPacks(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: installed } = await supabase
        .from('user_installed_assistants')
        .select('*, assistant_store(name, gpack_url)')
        .eq('user_id', user.id);

      if (!installed || installed.length === 0) return;

      console.log(`[GpackService] Rehydrating ${installed.length} installed packs...`);

      for (const row of installed) {
        // skillStack already hydrated from localStorage — just verify
        const existing = skillStack.getStack().find(s => s.slug === row.pack_slug);
        if (!existing && row.gpack_url) {
          // Re-download and reload in background
          this.installFromMarketplace(row.assistant_id, row.gpack_url, row.assistant_store?.name || 'Pack')
            .catch(e => console.warn(`[GpackService] Failed to rehydrate ${row.pack_slug}:`, e));
        }
      }
    } catch (err) {
      console.warn('[GpackService] Rehydration skipped:', err);
    }
  }

  // ── Archive Readers (browser-side .gpack parsing) ─────────────────────────

  /**
   * Read manifest.json from a .gpack (zip) file in the browser.
   * Uses JSZip-compatible manual approach since we can't install new deps mid-session.
   */
  private async _readManifestFromFile(file: File): Promise<GpackManifest> {
    // .gpack is a ZIP — parse central directory to find manifest.json
    return this._readJsonFromZip(file, 'manifest.json') as Promise<GpackManifest>;
  }

  private async _readToolRegistryFromFile(file: File): Promise<GpackTool[]> {
    try {
      return await this._readJsonFromZip(file, 'tool_registry.json') as GpackTool[];
    } catch {
      return []; // tool_registry.json is optional (older packs)
    }
  }

  /**
   * Minimal ZIP reader — extracts a named JSON file from a ZIP archive.
   * Works in the browser without external dependencies.
   */
  private async _readJsonFromZip(file: File, targetName: string): Promise<any> {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

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

      if (entryName !== targetName) continue;

      // Found target — read local file header
      const localExtraLen = view.getUint16(localOffset + 28, true);
      const dataStart = localOffset + 30 + nameLen + localExtraLen;
      const compData = bytes.slice(dataStart, dataStart + compSize);

      let rawData: Uint8Array;
      if (compMethod === 0) {
        rawData = compData; // Stored (no compression)
      } else if (compMethod === 8) {
        // Deflate — use DecompressionStream API (available in all modern browsers)
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
        throw new Error(`Unsupported compression method: ${compMethod}`);
      }

      return JSON.parse(new TextDecoder().decode(rawData));
    }

    throw new Error(`${targetName} not found in .gpack archive`);
  }
}

export const gpackService = new GpackService();
