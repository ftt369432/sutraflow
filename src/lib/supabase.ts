import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    if (supabaseUrl && supabaseAnonKey) {
      client = createClient(supabaseUrl, supabaseAnonKey);
    } else {
      // Air-Gapped Local Fallback: Intercept fetch to return clean empty datasets locally
      // Prevents unresolvable DNS lookup errors (net::ERR_NAME_NOT_RESOLVED) in offline mode
      const localMockFetch: typeof fetch = async () => {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      };

      // Dummy socket to prevent ERR_CONNECTION_REFUSED when localhost:54321 is not running
      class DummySocket {
        onopen: any = null;
        onclose: any = null;
        onerror: any = null;
        onmessage: any = null;
        readyState = 3; // CLOSED
        close() {}
        send() {}
      }

      client = createClient('http://localhost:54321', 'sovereign-local-key', {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { fetch: localMockFetch },
        realtime: {
          transport: DummySocket as any,
          params: { eventsPerSecond: 0 }
        }
      });
    }
  }
  return client;
}

export const supabase = getSupabaseClient();
