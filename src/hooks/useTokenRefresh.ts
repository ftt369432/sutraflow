/**
 * useTokenRefresh Hook
 * 
 * Handles automatic token refresh on page load/reload for all authentication systems:
 * - Supabase session tokens
 * - Google OAuth tokens (Gmail/Calendar)
 * - Provider tokens from third-party services
 */

import { useEffect, useCallback, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { googleTokenManager } from '../services/GoogleTokenManager';
import { supabase } from '../lib/supabase';
import { errorRecoverySystem } from '../services/ErrorRecoverySystem';

interface TokenRefreshState {
  isRefreshing: boolean;
  lastRefresh: Date | null;
  refreshCount: number;
  errors: string[];
  supabaseTokenStatus: 'valid' | 'refreshed' | 'error' | 'unknown';
  googleTokenStatus: 'valid' | 'refreshed' | 'error' | 'unknown';
}

export function useTokenRefresh() {
  const { user, session } = useAuth();
  const [state, setState] = useState<TokenRefreshState>({
    isRefreshing: false,
    lastRefresh: null,
    refreshCount: 0,
    errors: [],
    supabaseTokenStatus: 'unknown',
    googleTokenStatus: 'unknown'
  });

  // Refresh Supabase session token
  const refreshSupabaseToken = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔄 [TokenRefresh] Refreshing Supabase session token');
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ [TokenRefresh] Supabase token refresh failed:', error);
        setState(prev => ({ 
          ...prev, 
          supabaseTokenStatus: 'error',
          errors: [...prev.errors, `Supabase: ${error.message}`]
        }));
        return false;
      }
      
      if (data.session) {
        console.log('✅ [TokenRefresh] Supabase token refreshed successfully');
        setState(prev => ({ ...prev, supabaseTokenStatus: 'refreshed' }));
        return true;
      } else {
        console.warn('⚠️ [TokenRefresh] Supabase refresh returned no session');
        setState(prev => ({ ...prev, supabaseTokenStatus: 'error' }));
        return false;
      }
    } catch (error) {
      console.error('❌ [TokenRefresh] Supabase refresh error:', error);
      setState(prev => ({ 
        ...prev, 
        supabaseTokenStatus: 'error',
        errors: [...prev.errors, `Supabase: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }));
      return false;
    }
  }, []);

  // Refresh Google OAuth token
  const refreshGoogleToken = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔄 [TokenRefresh] Refreshing Google OAuth token');
      
      const token = await googleTokenManager.refreshToken();
      
      if (token) {
        console.log('✅ [TokenRefresh] Google token refreshed successfully');
        setState(prev => ({ ...prev, googleTokenStatus: 'refreshed' }));
        return true;
      } else {
        console.warn('⚠️ [TokenRefresh] Google token refresh returned null');
        setState(prev => ({ 
          ...prev, 
          googleTokenStatus: 'error',
          errors: [...prev.errors, 'Google: Token refresh returned null']
        }));
        return false;
      }
    } catch (error) {
      console.error('❌ [TokenRefresh] Google token refresh error:', error);
      setState(prev => ({ 
        ...prev, 
        googleTokenStatus: 'error',
        errors: [...prev.errors, `Google: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }));
      return false;
    }
  }, []);

  // Validate existing tokens without refreshing
  const validateTokens = useCallback(async (): Promise<void> => {
    console.log('🔍 [TokenRefresh] Validating existing tokens');
    
    // Check Supabase session
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession && currentSession.expires_at && currentSession.expires_at > Date.now() / 1000) {
        setState(prev => ({ ...prev, supabaseTokenStatus: 'valid' }));
        console.log('✅ [TokenRefresh] Supabase token is valid');
      } else {
        setState(prev => ({ ...prev, supabaseTokenStatus: 'error' }));
        console.warn('⚠️ [TokenRefresh] Supabase token expired or missing');
      }
    } catch (error) {
      setState(prev => ({ ...prev, supabaseTokenStatus: 'error' }));
      console.error('❌ [TokenRefresh] Error checking Supabase token:', error);
    }

    // Check Google token
    try {
      const tokenInfo = googleTokenManager.getTokenInfo();
      if (tokenInfo.hasToken && tokenInfo.isValid) {
        setState(prev => ({ ...prev, googleTokenStatus: 'valid' }));
        console.log('✅ [TokenRefresh] Google token is valid');
      } else {
        setState(prev => ({ ...prev, googleTokenStatus: 'error' }));
        console.warn('⚠️ [TokenRefresh] Google token expired or missing');
      }
    } catch (error) {
      setState(prev => ({ ...prev, googleTokenStatus: 'error' }));
      console.error('❌ [TokenRefresh] Error checking Google token:', error);
    }
  }, []);

  // Main refresh function that handles all tokens
  const refreshAllTokens = useCallback(async (): Promise<void> => {
    if (state.isRefreshing) {
      console.log('🔄 [TokenRefresh] Already refreshing, skipping...');
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isRefreshing: true, 
      errors: [],
      supabaseTokenStatus: 'unknown',
      googleTokenStatus: 'unknown'
    }));

    console.log('🚀 [TokenRefresh] Starting comprehensive token refresh');

    try {
      // First validate existing tokens
      await validateTokens();

      const refreshPromises: Promise<boolean>[] = [];

      // Only refresh tokens that need it
      if (state.supabaseTokenStatus !== 'valid') {
        refreshPromises.push(refreshSupabaseToken());
      }

      if (state.googleTokenStatus !== 'valid') {
        refreshPromises.push(refreshGoogleToken());
      }

      // Wait for all refresh operations
      const results = await Promise.allSettled(refreshPromises);
      const successCount = results.filter(result => 
        result.status === 'fulfilled' && result.value === true
      ).length;

      setState(prev => ({ 
        ...prev, 
        refreshCount: prev.refreshCount + 1,
        lastRefresh: new Date()
      }));

      console.log(`✅ [TokenRefresh] Completed: ${successCount}/${results.length} tokens refreshed successfully`);

      // Log to error recovery system for monitoring
      if (successCount < results.length) {
        errorRecoverySystem.captureAuthError(
          'Token refresh partially failed',
          { 
            successCount, 
            totalCount: results.length,
            errors: state.errors 
          }
        );
      }

    } catch (error) {
      console.error('❌ [TokenRefresh] Critical error during token refresh:', error);
      setState(prev => ({ 
        ...prev, 
        errors: [...prev.errors, `Critical: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }));
      
      errorRecoverySystem.captureAuthError(
        'Token refresh system failed',
        { error: error instanceof Error ? error.message : String(error) }
      );
    } finally {
      setState(prev => ({ ...prev, isRefreshing: false }));
    }
  }, [state.isRefreshing, state.supabaseTokenStatus, state.googleTokenStatus, validateTokens, refreshSupabaseToken, refreshGoogleToken]);

  // Manual refresh trigger
  const manualRefresh = useCallback(async (): Promise<void> => {
    console.log('🔧 [TokenRefresh] Manual refresh triggered');
    await refreshAllTokens();
  }, [refreshAllTokens]);

  // Auto-refresh on page load/reload
  useEffect(() => {
    // Only refresh if we have a user (logged in)
    if (user && session) {
      console.log('📱 [TokenRefresh] Page loaded with authenticated user, initiating token refresh');
      
      // Delay slightly to allow other auth systems to initialize
      const timer = setTimeout(() => {
        refreshAllTokens();
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      console.log('📱 [TokenRefresh] No authenticated user, skipping token refresh');
    }
  }, []); // Only run once on mount

  // Periodic refresh (every 30 minutes)
  useEffect(() => {
    if (!user) return;

    // console.log('⏰ [TokenRefresh] Setting up periodic token refresh (30 minutes)');
    
    const interval = setInterval(() => {
      console.log('⏰ [TokenRefresh] Periodic refresh triggered');
      refreshAllTokens();
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [user, refreshAllTokens]);

  // Refresh when returning to app (visibility change) - with debounce to prevent flickering
  useEffect(() => {
    if (!user) return;

    let timeoutId: NodeJS.Timeout;
    let lastValidation = 0;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const now = Date.now();
        // Only validate if more than 5 seconds since last validation
        if (now - lastValidation < 5000) {
          console.log('👁️ [TokenRefresh] Skipping validation (too soon after last check)');
          return;
        }
        
        // Debounce to prevent multiple rapid calls
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          console.log('👁️ [TokenRefresh] App became visible, checking tokens');
          lastValidation = Date.now();
          validateTokens();
        }, 300); // 300ms debounce
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, validateTokens]);

  return {
    ...state,
    refreshAllTokens: manualRefresh,
    validateTokens
  };
}
