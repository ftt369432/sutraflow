/**
 * Google Authentication Service
 * 
 * Handles the OAuth2 flow with Google, including:
 * - Generating authorization URLs
 * - Handling auth callbacks
 * - Managing tokens
 */

import { getEnv } from '../../config/env';
import { GoogleAPIClient } from "../google/GoogleAPIClient";
import { supabase } from '@/lib/supabase';
import { GOOGLE_SCOPES } from '../../config/google'; // Added import

// Define types for the auth response
interface GoogleAuthResponse {
  user: {
    id: string;
    email: string;
    name?: string;
    picture?: string;
  };
  accessToken: string;
  expiresAt: number;
  refreshToken?: string;
}

// Define types for the user setter function
type UserSetterFunction = (userData: { id: string; email: string; fullName?: string }) => void;

export interface GoogleAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string[];
}

class GoogleAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoogleAuthError';
  }
}

export class GoogleAuthService {
  private static instance: GoogleAuthService;
  private googleClient: GoogleAPIClient;
  private mockUserSetter: UserSetterFunction | null = null;
  private isInitialized = false;
  
  private constructor() {
    this.googleClient = GoogleAPIClient.getInstance();
    this.initialize();
  }

  /**
   * Get the singleton instance of the service
   */
  public static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  /**
   * Initialize the service
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // Initialize Google API client for live services
    await this.googleClient.initialize();
    console.log('GoogleAuthService: Initialized with live Google services');
    
    this.isInitialized = true;
  }

  /**
   * Register a function to set mock users (used in development)
   */
  public registerMockUserSetter(setter: UserSetterFunction): void {
    this.mockUserSetter = setter;
  }

  /**
   * Get the correct callback URL based on environment
   */
  private getCallbackUrl(): string {
    const { authCallbackUrl } = getEnv();
    if (!authCallbackUrl) {
      throw new GoogleAuthError('Auth callback URL not configured');
    }
    return authCallbackUrl;
  }

  /**
   * Sign in with Google
   * In production, this uses Supabase OAuth
   * In development/mock mode, it creates a mock user
   */
  public async signIn(email?: string, forceReauth: boolean = false): Promise<GoogleAuthResponse> {
    const { useMock } = getEnv();
    
    // If in mock mode, use mock data
    if (useMock) {
      if (!this.mockUserSetter) {
        throw new GoogleAuthError('Mock user setter not registered');
      }
      
      const mockUser = {
        id: 'mock-user-id',
        email: email || 'mock@example.com',
        name: 'Mock User',
        picture: 'https://example.com/mock-avatar.png'
      };
      
      this.mockUserSetter({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.name
      });
      
      return {
        user: mockUser,
        accessToken: 'mock-access-token',
        expiresAt: Date.now() + 3600000 // 1 hour from now
      };
    }

    try {
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new GoogleAuthError(`Failed to get session: ${sessionError.message}`);
      }

      // If we already have a session with a provider token and not forcing reauth, use it
      if (session?.provider_token && !forceReauth) {
        return {
          user: {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.full_name,
            picture: session.user.user_metadata?.avatar_url
          },
          accessToken: session.provider_token,
          expiresAt: session.expires_at! * 1000, // Convert to milliseconds
          refreshToken: session.refresh_token
        };
      }

      // Clear any existing OAuth state - let Supabase handle state completely
      localStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_url');
      
      // Don't generate our own state - let Supabase handle it
      console.log('Starting OAuth flow - Supabase will handle state management');

      // If no session or no provider token, initiate OAuth flow
      const callbackUrl = this.getCallbackUrl();
      console.log('🚀 Starting Google OAuth with callback URL:', callbackUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          scopes: GOOGLE_SCOPES.join(' '), // Use imported GOOGLE_SCOPES
          queryParams: {
            access_type: 'offline',
            prompt: 'consent', // Force consent to ensure we get refresh token
            include_granted_scopes: 'true' // Ensure all scopes are included
            // Removed custom state parameter - let Supabase handle it
          },
          skipBrowserRedirect: false // Ensure we redirect properly
        }
      });

      // GOOGLE/GMAIL INTEGRATION DISABLED FOR GEMINI-ONLY MODE
      // /* ...existing code... */
      // Check if we have an authorization code
      const code = urlParams.get('code');
      if (!code) {
        throw new GoogleAuthError('No authorization code received from OAuth provider');
      }

      // Supabase handles state validation automatically, so we don't need to verify it manually
      console.log('OAuth callback received with authorization code');

      // Clean up any stored state from our previous custom implementation
      localStorage.removeItem('oauth_state');

      // Exchange the authorization code for a session
      // This is handled automatically by Supabase when the page loads
      // We just need to wait for the session to be established
      console.log('Waiting for Supabase to establish session...');
      
      // Wait a bit for Supabase to process the OAuth callback
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get the session from Supabase (which should now contain the provider token)
      const { data: { session: callbackSession }, error: callbackError } = await supabase.auth.getSession();
      
      if (callbackError) {
        throw new GoogleAuthError(`Failed to get session after callback: ${callbackError.message}`);
      }

      if (!callbackSession) {
        throw new GoogleAuthError('No session found after OAuth callback');
      }

      console.log('Session established successfully:', {
        userId: callbackSession.user.id,
        email: callbackSession.user.email,
        hasProviderToken: !!callbackSession.provider_token,
        hasAccessToken: !!callbackSession.access_token
      });

      // GEMINI-ONLY MODE: Google API client calls disabled
      if (callbackSession.provider_token) {
        console.log('GoogleAuth: Provider token available (Google API client disabled in Gemini-only mode)');
        // await this.googleClient.setAccessToken(callbackSession.provider_token);
      } else if (callbackSession.access_token) {
        console.log('GoogleAuth: Access token available (Google API client disabled in Gemini-only mode)');
        // await this.googleClient.setAccessToken(callbackSession.access_token);
      } else {
        console.warn('GoogleAuth: No access token available in session');
      }

      console.log('OAuth callback handled successfully');
    } catch (error) {
      console.error('OAuth callback error:', error);
      // Clean up stored state on error
      localStorage.removeItem('oauth_state');
      throw error;
    }
  }
  /**
   * Check if the user is signed in
   */
  public async isSignedIn(): Promise<boolean> {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  }
  
  /**
   * Check if a user is authenticated (synchronous version)
   * 
   * @returns True if user is authenticated, false otherwise
   */
  public isAuthenticated(): boolean {
    const { useMock } = getEnv();
    
    // In mock mode, always return true
    if (useMock) {
      return true;
    }
    
    // For real mode, we'll check localStorage for a token
    // This is a synchronous method, so we can't use supabase.auth.getSession() directly
    try {
      // Check for a stored token in localStorage that would indicate an active session
      return !!localStorage.getItem('supabase.auth.token');
    } catch (error) {
      return false;
    }
  }

  /**
   * Sign out the user
   */
  public async signOut(): Promise<void> {
    const { useMock } = getEnv();
    if (useMock) return;

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new GoogleAuthError(`Failed to sign out: ${error.message}`);
      }
      
      // Clear any stored OAuth state
      localStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_url');
    } catch (error) {
      throw error;
    }
  }
}

// Export the singleton instance
const googleAuthService = GoogleAuthService.getInstance();
export default googleAuthService;