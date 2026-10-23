import { AIDriveService } from '../services/drive/aiDriveService';
import { useAuth } from '../contexts/AuthContext'; // Assuming useAuth provides user info
import { useSupabase } from '../providers/SupabaseProvider'; // Import useSupabase
import { SupabaseClient } from '@supabase/supabase-js'; // Import SupabaseClient for type safety

// This might need to be adjusted based on how AIDriveService is instantiated and managed
// For example, if it requires API keys or user-specific configurations from context or props.

let aiDriveServiceInstance: AIDriveService | null = null;
// Store the Supabase client instance that the service was initialized with
// to prevent re-initialization if the client hasn't changed.
let initializedSupabaseClient: SupabaseClient | null = null;

export const useAiDriveService = (): AIDriveService | null => {
  const { user } = useAuth(); // Or however user/auth details are obtained
  const { supabase } = useSupabase(); // Get Supabase client

  // Initialize AIDriveService if it hasn't been already,
  // or if the supabase client instance has changed.
  if (supabase && user) {
    if (aiDriveServiceInstance === null || initializedSupabaseClient !== supabase) {
      // Pass the Supabase client to the AIDriveService constructor
      // This assumes AIDriveService constructor will be updated to accept it.
      aiDriveServiceInstance = new AIDriveService(supabase);
      initializedSupabaseClient = supabase;
    }
  } else {
    // If there's no user or no supabase client, the service should not be available.
    aiDriveServiceInstance = null;
    initializedSupabaseClient = null;
  }

  return aiDriveServiceInstance;
};
