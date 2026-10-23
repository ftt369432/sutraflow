import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useSupabase } from '../providers/SupabaseProvider';

// Define a type for the mock authentication details
export type MockAuthDetails = {
  user: User;
  session: Session;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  setMockAuth: (details: MockAuthDetails) => void; // New function to set mock auth
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { supabase, session: supabaseSession, user: supabaseUser, loading: supabaseLoading, clearSession: clearSupabaseSession } = useSupabase();

  // Use SupabaseProvider's state directly instead of maintaining our own
  const [user, setUser] = useState<User | null>(supabaseUser);
  const [session, setSession] = useState<Session | null>(supabaseSession);
  const [isLoading, setIsLoading] = useState(supabaseLoading);
  const lastSyncedUserId = useRef<string | null>(null);

  // Function to set mock authentication details directly
  const setMockAuth = (details: MockAuthDetails) => {
    console.log('AuthContext: Setting mock auth details:', details);
    setUser(details.user);
    setSession(details.session);
    setIsLoading(false);
  };

  // Sync with SupabaseProvider's state - debounced to prevent rapid-fire updates
  useEffect(() => {
    const userId = supabaseUser?.id || null;

    // We must always sync the loading state
    setIsLoading(supabaseLoading);

    // Skip user sync if we've already synced this exact user
    if (lastSyncedUserId.current === userId && user?.id === userId) {
      return;
    }

    lastSyncedUserId.current = userId;
    setUser(supabaseUser);
    setSession(supabaseSession);

    if (supabaseUser) {
      console.log('AuthContext: Synced with SupabaseProvider - User authenticated:', !!supabaseUser);
    }
  }, [supabaseUser, supabaseSession, supabaseLoading, user?.id]);

  const signOut = async () => {
    try {
      console.log('AuthContext: Signing out');
      // Check if supabase.auth is available before calling signOut on it
      if (supabase && supabase.auth) {
        await supabase.auth.signOut();
      }
      setUser(null);
      setSession(null);
      clearSupabaseSession(); // Use the renamed function

      // Clear localStorage
      try {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('authToken');
        // Clear any Supabase project-specific tokens
        Object.keys(localStorage).forEach(key => {
          if (key.includes('-auth-token')) {
            localStorage.removeItem(key);
          }
        });
        sessionStorage.removeItem('supabase.auth.token');
      } catch (e) {
        console.error('Error clearing local storage:', e);
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut, setMockAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}