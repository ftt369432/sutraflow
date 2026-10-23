import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import googleAuthService from '../services/auth/googleAuth';
import { GoogleAPIClient } from '../services/google/GoogleAPIClient';
import { useUserStore, SubscriptionTier, UserProfile, UserSubscription } from '../stores/userStore';
import { useSupabase } from '../providers/SupabaseProvider';
import { Spinner } from '../components/ui/Spinner';
import { getEnv } from '../config/env';
import { supabase } from '../lib/supabase';
import { useAuth, MockAuthDetails } from '../contexts/AuthContext'; // Import useAuth and MockAuthDetails
import { User, Session } from '@supabase/supabase-js'; // Import User and Session for mock objects

export function AuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Initializing authentication...');
  const navigate = useNavigate();
  const location = useLocation();
  const { setMockUser: setSupabaseMockUser } = useSupabase(); // Rename to avoid conflict
  const { setMockAuth } = useAuth(); // Get setMockAuth from AuthContext
  const setUser = useUserStore(state => state.setUser);
  const setAuthToken = useUserStore(state => state.setAuthToken);
  const googleClient = GoogleAPIClient.getInstance();
  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent processing more than once
    if (processedRef.current) {
      return;
    }
    
    async function handleAuthCallback() {
      const { useMock } = getEnv();
      const searchParams = new URLSearchParams(location.search);
      const hashParams = new URLSearchParams(location.hash.replace('#', '?'));
      const code = searchParams.get('code') || hashParams.get('code');
      const authError = searchParams.get('error') || hashParams.get('error');
      
      // Debug logging
      console.log('🔍 AuthCallback Debug Info:');
      console.log('- URL:', window.location.href);
      console.log('- Search params:', Object.fromEntries(searchParams));
      console.log('- Hash params:', Object.fromEntries(hashParams));
      console.log('- Code found:', !!code);
      console.log('- Error found:', !!authError);
      console.log('- useMock:', useMock);
      
      // Mark as processed to prevent duplicate processing
      processedRef.current = true;
      
      if (authError) {
        console.error('Google Auth error:', authError);
        setError(`Google authentication error: ${authError}`);
        return;
      }
      
      if (!code) {
        // Try to process the authentication directly using the existing session
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            console.log('No code found but session exists, attempting to continue...');
            setStatus('Existing authentication session found, continuing...');
            
            // Initialize the Google API client
            await googleClient.initialize();
            
            // Check if we have a provider token
            if (session.provider_token) {
              setStatus('Using existing provider token');
              
              // Get user info from Google
              try {
                const userInfo = await googleClient.getUserInfo();
                
                // Create user profile
                const subscription: UserSubscription = {
                  plan: 'free' as SubscriptionTier,
                  type: 'individual',
                  status: 'active',
                  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                };
                
                const userProfile: UserProfile = {
                  id: userInfo.id || session.user.id,
                  email: userInfo.email || session.user.email || '',
                  fullName: userInfo.name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                  avatar: userInfo.picture || session.user.user_metadata?.avatar_url,
                  subscription
                };
                
                // Set the user in global state
                setUser(userProfile);
                setAuthToken(session.provider_token);
                
                setStatus('Login successful! Redirecting...');
                
                // Navigate to dashboard
                navigate('/dashboard', { replace: true });
                return;
              } catch (userInfoError) {
                console.error('Error getting user info, but continuing with session data', userInfoError);
                
                // Fall back to using session data
                const userProfile: UserProfile = {
                  id: session.user.id,
                  email: session.user.email || '',
                  fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                  avatar: session.user.user_metadata?.avatar_url,
                  subscription: {
                    plan: 'free' as SubscriptionTier,
                    type: 'individual',
                    status: 'active',
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                  }
                };
                
                // Set the user in global state
                setUser(userProfile);
                
                setStatus('Login successful! Redirecting...');
                
                // Navigate to dashboard
                navigate('/dashboard', { replace: true });
                return;
              }
            } else {
              console.warn('No provider token in session');
              setError('Authentication incomplete. Please log in again with Google to access Gmail features.');
              return;
            }
          } else {
            setError('No authentication code found in URL and no active session');
            return;
          }
        } catch (sessionError) {
          console.error('Error getting session', sessionError);
          setError('No authentication code found in URL');
          return;
        }
      }

      try {
        // If in mock mode, create a mock user directly without processing Google auth
        if (useMock) {
          setStatus('Processing in mock mode...');
          console.log('Auth callback processing in mock mode');
          
          const mockUserId = 'mock-user-id';
          const mockUserEmail = 'mock-user@example.com';
          const mockUserFullName = 'Mock User';

          // Create mock user profile for Zustand store
          const subscription: UserSubscription = {
            plan: 'pro' as SubscriptionTier,
            type: 'individual',
            status: 'active',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          };
          
          const userProfile: UserProfile = {
            id: mockUserId,
            email: mockUserEmail,
            fullName: mockUserFullName,
            avatar: 'https://ui-avatars.com/api/?name=Mock+User&background=random',
            subscription
          };
          
          // Set the user in global state
          setUser(userProfile);
          
          // Set in SupabaseProvider's context (primarily for its own state if needed)
          setSupabaseMockUser({
            id: mockUserId,
            email: mockUserEmail,
            fullName: mockUserFullName
          });

          // Construct mock User and Session objects for AuthContext
          const mockAuthUser: User = {
            id: mockUserId,
            aud: 'authenticated',
            role: 'authenticated',
            email: mockUserEmail,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            app_metadata: { provider: 'mock', providers: ['mock'] },
            user_metadata: { full_name: mockUserFullName },
            email_confirmed_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString(),
          };

          const mockAuthSession: Session = {
            access_token: 'mock-authcontext-access-token',
            refresh_token: 'mock-authcontext-refresh-token',
            user: mockAuthUser,
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            token_type: 'bearer',
          };

          // Set mock authentication details in AuthContext
          setMockAuth({ user: mockAuthUser, session: mockAuthSession });
          
          setStatus('Login successful! Redirecting...');
          
          // Navigate to dashboard
          navigate('/dashboard', { replace: true });
          return;
        }
        
        // Real authentication flow
        setStatus('Waiting for authentication session...');
        
        // Wait for Supabase to process the OAuth callback and create a session
        let session = null;
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new Error(`Failed to get session: ${sessionError.message}`);
        }
        
        if (!initialSession) {
          throw new Error('No session available after OAuth callback');
        }
        
        session = initialSession;
        
        // Wait for the provider token to become available
        setStatus('Waiting for provider token...');
        let retryCount = 0;
        const maxRetries = 10;
        while (retryCount < maxRetries) {
          const { data: { session: updatedSession }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            throw new Error(`Failed to get session: ${sessionError.message}`);
          }
          
          if (updatedSession?.provider_token) {
            session = updatedSession;
            break;
          }
          
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          retryCount++;
        }
        
        if (!session?.provider_token) {
          throw new Error('No provider token available in session after waiting');
        }
        
        // Initialize the Google API client with the session token
        setStatus('Initializing Google API client...');
        await googleClient.initialize();
        
        // Get user info from Google
        setStatus('Fetching user information...');
        const userInfo = await googleClient.getUserInfo();
        
        // Create user profile
        const subscription: UserSubscription = {
          plan: 'free' as SubscriptionTier,
          type: 'individual',
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
        
        const userProfile: UserProfile = {
          id: userInfo.id,
          email: userInfo.email,
          fullName: userInfo.name,
          avatar: userInfo.picture,
          subscription
        };
        
        // Set the user in global state
        setUser(userProfile);
        setAuthToken(session.provider_token);
        
        setStatus('Login successful! Redirecting...');
        navigate('/dashboard', { replace: true });
      } catch (e: any) {
        console.error('Auth callback error:', e);
        setError(e instanceof Error ? e.message : 'An unknown error occurred');
      }
    }

    handleAuthCallback();
  }, [location.search, location.hash]); // Added location.hash as dependency

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded max-w-md w-full">
          <h2 className="text-lg font-medium mb-2">Authentication Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/login')}
            className="mt-4 bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded transition"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Spinner className="h-12 w-12 text-primary" />
      <p className="mt-4 text-lg font-medium text-gray-800 dark:text-white">{status}</p>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Please wait while we complete your authentication</p>
    </div>
  );
}