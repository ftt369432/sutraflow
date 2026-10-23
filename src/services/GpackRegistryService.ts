import { supabase } from '../lib/supabase';

export class GpackRegistryService {
  /**
   * Automates the staging and upload of a local compiled .gpack archive to Supabase Storage,
   * then registers it into the assistant_store marketplace table.
   */
  static async uploadAndRegister(
    localGpackPath: string,
    manifest: any,
    toolRegistry: any[],
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

      // 1. Read binary .gpack file as base64 via Electron bridge
      const bridge = (window as any).electronBridge;
      if (!bridge) throw new Error('Electron environment required for packaging staging');

      console.log(`📦 GpackRegistryService: Reading local binary package at ${localGpackPath}`);
      const readRes = await bridge.fs.readFile({ path: localGpackPath, encoding: 'base64' });
      if (!readRes.success || !readRes.content) {
        throw new Error(`Failed to read local package: ${readRes.error}`);
      }

      // Convert base64 to binary ArrayBuffer / Blob
      const binaryString = atob(readRes.content);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const gpackBlob = new Blob([bytes], { type: 'application/octet-stream' });
      const gpackFile = new File([gpackBlob], `${manifest.slug}.gpack`);

      // 2. Upload file to Supabase Storage
      const storagePath = `gpack/${user.id}/${manifest.slug}-v${manifest.version}.gpack`;
      console.log(`☁️ GpackRegistryService: Uploading to Supabase bucket at ${storagePath}`);
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

      // 4. Insert or update marketplace listing
      const slug = `${manifest.slug}-${Date.now()}`;
      console.log(`🛒 GpackRegistryService: Inserting store listing for slug: ${slug}`);
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

      // 5. Save to professional_agents table for dashboard tracking
      await supabase.from('professional_agents').insert({
        creator_id: user.id,
        store_id: listing.id,
        name: meta.name || manifest.name,
        description: meta.description,
        status: 'approved',
        mcp_tools: toolRegistry,
        compiled_at: manifest.compiled_at,
      });

      console.log(`✅ GpackRegistryService: Package published successfully under ID ${listing.id}`);
      return { success: true, listingId: listing.id };

    } catch (err: any) {
      console.error('❌ GpackRegistryService Error:', err);
      return { success: false, error: err.message };
    }
  }
}
