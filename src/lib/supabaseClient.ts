// This file now re-exports the Supabase client from the main supabase.ts setup
// to ensure a single instance is used throughout the application.
import { supabase } from './supabase'; // Assuming supabase.ts is in the same directory

export { supabase };
