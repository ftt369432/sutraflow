import React, { createContext, useContext, useEffect, useState } from 'react';
import { SupabaseClient, User, Session } from '@supabase/supabase-js';
import { registerSupabaseUserSetter } from '../services/auth/authService';
// GEMINI-ONLY MODE: Google services removed
// import { GoogleAPIClient } from '../services/google/GoogleAPIClient';
// import { googleTokenManager } from '../services/GoogleTokenManager';
import { errorRecoverySystem } from '../services/ErrorRecoverySystem';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../stores/userStore';

// Supabase context type definition
interface SupabaseContextType {
  supabase: SupabaseClient;
  user: User | null;
  session: Session | null;
  loading: boolean;
  setMockUser: (userData: { id: string; email: string; fullName?: string }) => void; // Reverted to synchronous
  clearSession: () => void;
}

// Create the context
const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

// Provider component
export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Function to set mock user for development - ENHANCED
  const setMockUser = (userData: { id: string; email: string; fullName?: string }): void => {
    console.log('SupabaseProvider: setMockUser called with:', userData);
    const mockUserObject: User = {
      id: userData.id,
      aud: 'authenticated',
      role: 'authenticated',
      email: userData.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      app_metadata: {
        provider: 'mock',
        providers: ['mock'],
      },
      user_metadata: {
        full_name: userData.fullName || 'Test User',
      },
      email_confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
    };

    const mockSessionObject: Session = {
      access_token: `mock-access-token-${Date.now()}`, // Add timestamp to make unique
      refresh_token: `mock-refresh-token-${Date.now()}`,
      user: mockUserObject,
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
    };

    // Store the mock session data in localStorage to persist across page reloads
    try {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: mockSessionObject,
        expiresAt: mockSessionObject.expires_at
      }));
    } catch (e) {
      console.error('Failed to store mock session in localStorage:', e);
    }

    // Update the state
    setUser(mockUserObject);
    setSession(mockSessionObject);
    setLoading(false);

    // Force a React state update cycle for any components that might be waiting
    setTimeout(() => {
      console.log('SupabaseProvider: User and session state updated with mock data');
    }, 0);
  };

  // Function to clear session data
  const clearSession = () => {
    console.log('Clearing Supabase session');
    setUser(null);
    setSession(null);

    // Clear local storage
    try {
      localStorage.removeItem('supabase.auth.token');
      // Clear any Supabase project-specific tokens dynamically
      Object.keys(localStorage).forEach(key => {
        if (key.includes('-auth-token')) {
          localStorage.removeItem(key);
        }
      });
      sessionStorage.removeItem('supabase.auth.token');
    } catch (e) {
      console.error('Error clearing local storage:', e);
    }
  };

  useEffect(() => {
    // Register the mock user setter
    registerSupabaseUserSetter(setMockUser);

    // Force check for existing session on mount 
    const initializeSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('🚀 Live SupabaseProvider: Initial session check:', session, 'Error:', error);

        if (session && session.user) {
          setSession(session);
          setUser(session.user);
          try {
            useUserStore.getState().setUser(session.user);
          } catch (_e) {}

          // Initialize Google API client for live services
          console.log('🚀 Live session initialized:', {
            userEmail: session.user?.email,
            hasAccessToken: !!session.access_token
          });
        } else {
          // Direct localStorage fallback for sovereign offline sessions
          let restored = false;
          try {
            const raw = localStorage.getItem('supabase.auth.token');
            if (raw) {
              const parsed = JSON.parse(raw);
              const fallbackSession = parsed.currentSession || parsed;
              if (fallbackSession?.user) {
                setSession(fallbackSession);
                setUser(fallbackSession.user);
                useUserStore.getState().setUser(fallbackSession.user);
                console.log('🛡️ Sovereign session restored from persistent storage:', fallbackSession.user.email);
                restored = true;
              }
            }
          } catch (_fallbackErr) {}

          if (!restored) {
            console.log('🛡️ Auto-provisioning Sovereign Operator session for local sovereign access');
            setMockUser({
              id: 'sovereign-operator-001',
              email: 'operator@sutraflow.local',
              fullName: 'Sovereign Operator',
            });
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('SupabaseProvider: Error getting initial session, falling back to Sovereign Operator:', error);
        setMockUser({
          id: 'sovereign-operator-001',
          email: 'operator@sutraflow.local',
          fullName: 'Sovereign Operator',
        });
        setLoading(false);
      }
    };

    // Initialize session immediately
    initializeSession();

    // Get initial session
    let lastAuthEventTime = 0;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const now = Date.now();

      // Aggressive debounce: Skip if same event within 1 second
      if (now - lastAuthEventTime < 1000 && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        console.log('SupabaseProvider: Skipping duplicate auth event:', event);
        return;
      }
      lastAuthEventTime = now;

      console.log('SupabaseProvider: Auth state change (from SupabaseProvider):', event, 'Session provider_token available:', !!session?.provider_token);

      if (event === 'SIGNED_OUT') {
        clearSession();
      } else if (event === 'USER_UPDATED' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        // Check if the session and user are different before setting state to avoid infinite loops
        setSession(prevSession => {
          if (JSON.stringify(prevSession) !== JSON.stringify(session)) {
            return session;
          }
          return prevSession;
        });
        setUser(prevUser => {
          if (JSON.stringify(prevUser) !== JSON.stringify(session?.user ?? null)) {
            return session?.user ?? null;
          }
          return prevUser;
        });

        // Initialize Google API client for live services
        console.log('🚀 Live Auth: Session updated', {
          event,
          userEmail: session?.user?.email,
          hasAccessToken: !!session?.access_token
        });
      } else {
        console.log('SupabaseProvider: Unhandled auth event in onAuthStateChange:', event);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SupabaseContext.Provider value={{ supabase, user, session, loading, setMockUser, clearSession }}>
      {children}
    </SupabaseContext.Provider>
  );
};

// Hook to use Supabase context
export const useSupabase = (): SupabaseContextType => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};