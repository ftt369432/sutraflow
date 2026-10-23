import { createContext } from 'react';
import { SupabaseClient, User } from '@supabase/supabase-js';

export interface SupabaseContextType {
  supabase: SupabaseClient;
  user: User | null;
  loading: boolean;
  session: any | null;
  setMockUser?: (user: { id: string; email: string; fullName?: string }) => void;
}

export const SupabaseContext = createContext<SupabaseContextType>({
  supabase: {} as SupabaseClient,
  user: null,
  loading: true,
  session: null
});

// Re-export from the provider, not defining a duplicate context
export { SupabaseContext, useSupabase, SupabaseProvider } from '../providers/SupabaseProvider'; 