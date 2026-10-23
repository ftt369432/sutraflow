/**
 * Google OAuth Token Manager
 * Handles Google OAuth token acquisition and refresh for Gmail/Calendar access
 */

import { supabase } from '../lib/supabase';
import { errorRecoverySystem } from './ErrorRecoverySystem';
import { tokenPersistenceService } from './auth/TokenPersistenceService';
import { getEnv } from '../config/env';

interface GoogleTokenInfo {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  refresh_token?: string;
}

interface GoogleAuthConfig {
  client_id: string;
  scope: string;
  redirect_uri: string;
}

class GoogleTokenManager {
  private static instance: GoogleTokenManager;
  private currentToken: string | null = null;
  private tokenExpiry: number | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;
  private refreshInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Try to restore token from persistent storage on initialization
    this.restoreTokenFromStorage();
    // Start proactive token refresh monitoring
    this.startProactiveRefresh();
  }

  static getInstance(): GoogleTokenManager {
    if (!GoogleTokenManager.instance) {
      GoogleTokenManager.instance = new GoogleTokenManager();
    }
    return GoogleTokenManager.instance;
  }

  /**
   * Restore token from persistent storage
   */
  private restoreTokenFromStorage(): void {
    const storedTokens = tokenPersistenceService.getStoredTokens();
    if (storedTokens) {
      this.currentToken = storedTokens.accessToken;
      this.tokenExpiry = storedTokens.expiresAt;
      console.log('🔄 [GoogleTokenManager] Restored token from persistent storage');
    }
  }

  /**
   * Get current valid Google access token
   */
  async getValidToken(): Promise<string | null> {
    // Check if we're in mock mode
    const { useMock } = getEnv();
    if (useMock === true) {
      console.log('🚫 [GoogleTokenManager] Disabled in mock mode');
      return null;
    }
    
    try {
      // First try to restore from storage if we don't have a current token
      if (!this.currentToken) {
        this.restoreTokenFromStorage();
      }

      // Check if we have a valid token
      if (this.currentToken && this.isTokenValid()) {
        console.log('[GoogleTokenManager] Using cached valid token');
        return this.currentToken;
      }

      // If we're already refreshing, wait for that to complete
      if (this.isRefreshing && this.refreshPromise) {
        console.log('[GoogleTokenManager] Waiting for ongoing token refresh');
        return await this.refreshPromise;
      }

      // Try to get token from Supabase session first
      console.log('[GoogleTokenManager] Checking Supabase session for fresh token');
      const supabaseToken = await this.getSupabaseProviderToken();
      if (supabaseToken) {
        console.log('[GoogleTokenManager] Found fresh token in Supabase session');
        this.setToken(supabaseToken);
        return supabaseToken;
      }

      // Try to refresh the current session if we have one
      console.log('[GoogleTokenManager] Attempting to refresh session');
      const refreshedToken = await this.refreshToken();
      if (refreshedToken) {
        console.log('[GoogleTokenManager] Successfully refreshed token');
        return refreshedToken;
      }

      // As a last resort, try silent re-authentication
      console.log('[GoogleTokenManager] No valid token found, user may need to re-authenticate');
      
      // Instead of forcing re-auth immediately, return null to let the caller handle it
      // This prevents unwanted redirects during API calls
      return null;

    } catch (error) {
      console.error('[GoogleTokenManager] Error getting valid token:', error);
      errorRecoverySystem.captureAuthError(
        'Failed to get valid Google token',
        { error: error instanceof Error ? error.message : String(error) }
      );
      return null;
    }
  }

  /**
   * Get Google provider token from Supabase session
   */
  private async getSupabaseProviderToken(): Promise<string | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[GoogleTokenManager] Supabase session error:', error);
        return null;
      }

      if (session?.provider_token) {
        console.log('[GoogleTokenManager] Found Google provider token in Supabase session');
        return session.provider_token;
      }

      console.log('[GoogleTokenManager] No provider token in Supabase session');
      return null;
    } catch (error) {
      console.error('[GoogleTokenManager] Error getting Supabase token:', error);
      return null;
    }
  }

  /**
   * Refresh the current token using Supabase
   */
  async refreshToken(): Promise<string | null> {
    if (this.isRefreshing && this.refreshPromise) {
      return await this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<string | null> {
    try {
      console.log('[GoogleTokenManager] Attempting to refresh token');

      // Try to refresh the Supabase session if supported
      if (typeof (supabase.auth as any)?.refreshSession !== 'function') {
        console.warn('[GoogleTokenManager] Supabase auth.refreshSession not available in current environment');
        return null;
      }

      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('[GoogleTokenManager] Failed to refresh Supabase session:', error);
        throw error;
      }

      if (data?.session?.provider_token) {
        console.log('[GoogleTokenManager] Successfully refreshed Google provider token');
        this.setToken(data.session.provider_token);
        return data.session.provider_token;
      }

      console.warn('[GoogleTokenManager] Refreshed session has no provider token');
      return null;

    } catch (error) {
      console.error('[GoogleTokenManager] Token refresh failed:', error);
      errorRecoverySystem.captureAuthError(
        'Google token refresh failed',
        { error: error instanceof Error ? error.message : String(error) }
      );
      return null;
    }
  }

  /**
   * Initiate Google OAuth re-authentication
   */
  async initiateReAuthentication(): Promise<string | null> {
    // Check if we're in mock mode
    const { useMock } = getEnv();
    if (useMock === true) {
      console.log('🚫 [GoogleTokenManager] Re-authentication disabled in mock mode');
      return null;
    }
    
    try {
      console.log('[GoogleTokenManager] Initiating Google OAuth re-authentication');

      // Sign out and re-authenticate with Google to get fresh provider token
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          },
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('[GoogleTokenManager] OAuth initiation failed:', error);
        errorRecoverySystem.captureAuthError(
          'Google OAuth re-authentication failed',
          { error: error.message }
        );
        throw error;
      }

      console.log('[GoogleTokenManager] OAuth re-authentication initiated');
      return null; // Token will be available after redirect

    } catch (error) {
      console.error('[GoogleTokenManager] Re-authentication error:', error);
      return null;
    }
  }

  /**
   * Set the current token with expiry and persist it
   */
  setToken(token: string, expiresIn?: number): void {
    this.currentToken = token;
    const expiresAt = Math.floor(Date.now() / 1000) + (expiresIn || 3600);
    this.tokenExpiry = expiresAt * 1000;

    // Get user info from Supabase session for persistence
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Store tokens persistently
        tokenPersistenceService.storeTokens({
          accessToken: token,
          refreshToken: session.refresh_token || '',
          expiresAt,
          userId: session.user.id,
          email: session.user.email || ''
        });
      }
    });

    console.log('[GoogleTokenManager] Token set and persisted successfully');
  }

  /**
   * Clear the current token and persistent storage
   */
  clearToken(): void {
    this.currentToken = null;
    this.tokenExpiry = null;
    tokenPersistenceService.clearTokens();
    console.log('[GoogleTokenManager] Token cleared from memory and storage');
  }

  /**
   * Check if current token is still valid
   */
  private isTokenValid(): boolean {
    if (!this.currentToken || !this.tokenExpiry) {
      return false;
    }
    
    // Consider token invalid if it expires in the next 5 minutes
    const bufferTime = 5 * 60 * 1000; // 5 minutes
    return Date.now() < (this.tokenExpiry - bufferTime);
  }

  /**
   * Get token info for debugging
   */
  getTokenInfo(): { hasToken: boolean; isValid: boolean; expiresIn?: number } {
    const hasToken = !!this.currentToken;
    const isValid = this.isTokenValid();
    const expiresIn = this.tokenExpiry ? Math.max(0, this.tokenExpiry - Date.now()) : undefined;

    return {
      hasToken,
      isValid,
      expiresIn: expiresIn ? Math.floor(expiresIn / 1000) : undefined
    };
  }

  /**
   * Start proactive token refresh - automatically refresh tokens before they expire
   */
  private startProactiveRefresh(): void {
    // Check every 15 minutes for tokens that need refreshing
    this.refreshInterval = setInterval(async () => {
      if (this.currentToken && this.tokenExpiry) {
        // Refresh if token expires within 15 minutes
        const refreshThreshold = 15 * 60 * 1000; // 15 minutes
        if (Date.now() > (this.tokenExpiry - refreshThreshold)) {
          console.log('🔄 [GoogleTokenManager] Proactively refreshing token before expiry');
          try {
            await this.refreshToken();
          } catch (error) {
            console.error('❌ [GoogleTokenManager] Proactive refresh failed:', error);
          }
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    console.log('✅ [GoogleTokenManager] Proactive token refresh monitoring started');
  }

  /**
   * Stop proactive token refresh monitoring
   */
  private stopProactiveRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log('⏹️ [GoogleTokenManager] Proactive refresh monitoring stopped');
    }
  }

  /**
   * Enhanced token validity check with automatic refresh
   */
  async ensureValidToken(): Promise<string | null> {
    try {
      // If we have a valid token, return it
      if (this.currentToken && this.isTokenValid()) {
        return this.currentToken;
      }

      // If token is close to expiring, refresh it proactively
      if (this.currentToken && this.tokenExpiry) {
        const refreshThreshold = 10 * 60 * 1000; // 10 minutes
        if (Date.now() > (this.tokenExpiry - refreshThreshold)) {
          console.log('🔄 [GoogleTokenManager] Auto-refreshing token approaching expiry');
          const refreshed = await this.refreshToken();
          if (refreshed) {
            return refreshed;
          }
        }
      }

      // Fall back to normal getValidToken logic
      return await this.getValidToken();
    } catch (error) {
      console.error('[GoogleTokenManager] Error ensuring valid token:', error);
      return null;
    }
  }

  /**
   * Force re-authentication if user manually requests it
   */
  async forceReAuthentication(): Promise<void> {
    // Check if we're in mock mode
    const { useMock } = getEnv();
    if (useMock === true) {
      console.log('🚫 [GoogleTokenManager] Force re-authentication disabled in mock mode');
      return;
    }
    
    console.log('[GoogleTokenManager] Force re-authentication requested');
    this.clearToken();
    await this.initiateReAuthentication();
  }

  /**
   * Cleanup method to stop intervals
   */
  destroy(): void {
    this.stopProactiveRefresh();
  }
}

// Export singleton instance
export const googleTokenManager = GoogleTokenManager.getInstance();

// Export hook for React components
export const useGoogleToken = () => {
  return {
    getValidToken: googleTokenManager.getValidToken.bind(googleTokenManager),
    ensureValidToken: googleTokenManager.ensureValidToken.bind(googleTokenManager),
    refreshToken: googleTokenManager.refreshToken.bind(googleTokenManager),
    forceReAuthentication: googleTokenManager.forceReAuthentication.bind(googleTokenManager),
    getTokenInfo: googleTokenManager.getTokenInfo.bind(googleTokenManager),
    clearToken: googleTokenManager.clearToken.bind(googleTokenManager)
  };
};
