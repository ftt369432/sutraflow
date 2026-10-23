import { supabase } from '../lib/supabase';

export interface ErrorInfo {
  id: string;
  type: 'auth' | 'storage' | 'api' | 'quota' | 'network' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
  attempts: number;
  maxAttempts: number;
}

export interface RecoveryAction {
  id: string;
  type: 'refresh_token' | 'clear_storage' | 'reload_page' | 'logout' | 'retry' | 'fallback';
  description: string;
  execute: () => Promise<boolean>;
  conditions?: (error: ErrorInfo) => boolean;
}

class ErrorRecoverySystem {
  private errors: Map<string, ErrorInfo> = new Map();
  private recoveryActions: Map<string, RecoveryAction> = new Map();
  private isRecovering = false;
  private listeners: Array<(error: ErrorInfo) => void> = [];

  constructor() {
    this.initializeDefaultRecoveryActions();
    this.setupGlobalErrorHandlers();
  }

  private initializeDefaultRecoveryActions() {
    // Google Auth Token Refresh
    this.registerRecoveryAction({
      id: 'refresh_google_token',
      type: 'refresh_token',
      description: 'Refresh Google authentication token',
      execute: async () => {
        try {
          console.log('🔄 [Recovery] Attempting to refresh Google token...');
          const { googleTokenManager } = await import('./GoogleTokenManager');
          const freshToken = await googleTokenManager.refreshToken();
          
          if (freshToken) {
            console.log('✅ [Recovery] Google token refreshed successfully');
            return true;
          } else {
            console.warn('⚠️ [Recovery] Google token refresh returned null, may need re-authentication');
            return false;
          }
        } catch (error) {
          console.error('[Recovery] Token refresh error:', error);
          return false;
        }
      },
      conditions: (error) => error.type === 'auth' && error.message.includes('401')
    });

    // Google Re-authentication
    this.registerRecoveryAction({
      id: 'google_reauth',
      type: 'refresh_token',
      description: 'Initiate Google OAuth re-authentication',
      execute: async () => {
        try {
          console.log('🔐 [Recovery] Initiating Google re-authentication...');
          const { googleTokenManager } = await import('./GoogleTokenManager');
          await googleTokenManager.forceReAuthentication();
          console.log('✅ [Recovery] Google re-authentication initiated');
          return true;
        } catch (error) {
          console.error('[Recovery] Google re-authentication error:', error);
          return false;
        }
      },
      conditions: (error) => {
        // Don't trigger Google auth in email-only mode (when VITE_USE_MOCK=false)
        const useMock = import.meta.env.VITE_USE_MOCK;
        if (useMock === 'false' || useMock === false) {
          console.log('🚫 [Recovery] Skipping Google auth - using email-only mode');
          return false;
        }
        
        return error.type === 'auth' && 
        (error.message.includes('provider token not available') || 
         error.message.includes('Google token') ||
         error.attempts >= 2);
      }
    });

    // Clear Storage Quota
    this.registerRecoveryAction({
      id: 'clear_storage_quota',
      type: 'clear_storage',
      description: 'Clear localStorage to free up quota',
      execute: async () => {
        try {
          console.log('🧹 [Recovery] Clearing localStorage for quota recovery...');
          
          // Clear non-essential items first
          const nonEssentialKeys = [
            'redux-devtools',
            'react-dev-tools',
            'temp-data',
            'ui-state',
            'cache'
          ];
          
          nonEssentialKeys.forEach(key => {
            try {
              localStorage.removeItem(key);
            } catch (error) {
              // Ignore errors
            }
          });
          
          // Clear old knowledge base data
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('knowledge-base') && key.includes('backup')) {
              try {
                localStorage.removeItem(key);
              } catch (error) {
                // Ignore errors
              }
            }
          }
          
          console.log('✅ [Recovery] Storage cleared successfully');
          return true;
        } catch (error) {
          console.error('[Recovery] Storage clear error:', error);
          return false;
        }
      },
      conditions: (error) => error.type === 'quota' || error.message.includes('QuotaExceededError')
    });

    // API Retry with Backoff
    this.registerRecoveryAction({
      id: 'api_retry_backoff',
      type: 'retry',
      description: 'Retry API request with exponential backoff',
      execute: async () => {
        try {
          console.log('⏳ [Recovery] Implementing retry with backoff...');
          // This is handled by the calling code, we just signal to retry
          return true;
        } catch (error) {
          console.error('[Recovery] Retry setup error:', error);
          return false;
        }
      },
      conditions: (error) => error.type === 'api' && error.attempts < 3
    });

    // Force Logout for Auth Issues
    this.registerRecoveryAction({
      id: 'force_logout',
      type: 'logout',
      description: 'Force logout to clear auth state',
      execute: async () => {
        try {
          console.log('🚪 [Recovery] Forcing logout for auth recovery...');
          await supabase.auth.signOut();
          window.location.href = '/login';
          return true;
        } catch (error) {
          console.error('[Recovery] Logout error:', error);
          return false;
        }
      },
      conditions: (error) => error.type === 'auth' && error.attempts >= 3
    });

    // Page Reload for Critical Errors
    this.registerRecoveryAction({
      id: 'reload_page',
      type: 'reload_page',
      description: 'Reload page to reset application state',
      execute: async () => {
        try {
          console.log('🔄 [Recovery] Reloading page for critical error recovery...');
          window.location.reload();
          return true;
        } catch (error) {
          console.error('[Recovery] Page reload error:', error);
          return false;
        }
      },
      conditions: (error) => error.severity === 'critical' && error.attempts >= 2
    });
  }

  private setupGlobalErrorHandlers() {
    // Handle uncaught promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        type: 'unknown',
        severity: 'medium',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        context: { event: 'unhandledrejection' }
      });
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureError({
        type: 'unknown',
        severity: 'medium',
        message: event.message,
        stack: event.error?.stack,
        context: { 
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });
  }

  registerRecoveryAction(action: RecoveryAction) {
    this.recoveryActions.set(action.id, action);
    console.log(`[Recovery] Registered action: ${action.id}`);
  }

  captureError(errorData: Partial<ErrorInfo>): string {
    const error: ErrorInfo = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: errorData.type || 'unknown',
      severity: errorData.severity || 'medium',
      message: errorData.message || 'Unknown error',
      stack: errorData.stack,
      context: errorData.context,
      timestamp: new Date(),
      resolved: false,
      attempts: 0,
      maxAttempts: 3,
      ...errorData
    };

    this.errors.set(error.id, error);
    console.error(`[Recovery] Captured error [${error.id}]:`, error);

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(error);
      } catch (err) {
        console.error('[Recovery] Listener error:', err);
      }
    });

    // Attempt automatic recovery
    this.attemptRecovery(error.id);

    return error.id;
  }

  async attemptRecovery(errorId: string): Promise<boolean> {
    if (this.isRecovering) {
      console.log('[Recovery] Already attempting recovery, skipping...');
      return false;
    }

    const error = this.errors.get(errorId);
    if (!error) {
      console.warn(`[Recovery] Error ${errorId} not found`);
      return false;
    }

    if (error.attempts >= error.maxAttempts) {
      console.warn(`[Recovery] Max attempts reached for error ${errorId}`);
      return false;
    }

    this.isRecovering = true;
    error.attempts++;

    try {
      console.log(`[Recovery] Attempting recovery for error ${errorId} (attempt ${error.attempts})`);

      // Find applicable recovery actions
      const applicableActions = Array.from(this.recoveryActions.values())
        .filter(action => !action.conditions || action.conditions(error))
        .sort((a, b) => {
          // Prioritize by action type
          const priority = {
            'refresh_token': 1,
            'clear_storage': 2,
            'retry': 3,
            'fallback': 4,
            'logout': 5,
            'reload_page': 6
          };
          return (priority[a.type] || 99) - (priority[b.type] || 99);
        });

      if (applicableActions.length === 0) {
        console.warn(`[Recovery] No applicable recovery actions for error ${errorId}`);
        return false;
      }

      // Execute recovery actions sequentially
      for (const action of applicableActions) {
        console.log(`[Recovery] Executing action: ${action.description}`);
        
        try {
          const success = await action.execute();
          if (success) {
            console.log(`✅ [Recovery] Action ${action.id} succeeded`);
            error.resolved = true;
            return true;
          } else {
            console.warn(`❌ [Recovery] Action ${action.id} failed`);
          }
        } catch (actionError) {
          console.error(`💥 [Recovery] Action ${action.id} threw error:`, actionError);
        }

        // Add delay between actions
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.warn(`[Recovery] All recovery actions failed for error ${errorId}`);
      return false;

    } catch (recoveryError) {
      console.error(`[Recovery] Recovery process failed for error ${errorId}:`, recoveryError);
      return false;
    } finally {
      this.isRecovering = false;
    }
  }

  getErrors(): ErrorInfo[] {
    return Array.from(this.errors.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getUnresolvedErrors(): ErrorInfo[] {
    return this.getErrors().filter(error => !error.resolved);
  }

  markResolved(errorId: string): void {
    const error = this.errors.get(errorId);
    if (error) {
      error.resolved = true;
      console.log(`[Recovery] Marked error ${errorId} as resolved`);
    }
  }

  clearOldErrors(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = new Date(Date.now() - maxAge);
    for (const [id, error] of this.errors.entries()) {
      if (error.timestamp < cutoff && error.resolved) {
        this.errors.delete(id);
      }
    }
  }

  onError(listener: (error: ErrorInfo) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Convenience methods for specific error types
  captureAuthError(message: string, context?: Record<string, any>): string {
    return this.captureError({
      type: 'auth',
      severity: 'high',
      message,
      context
    });
  }

  captureStorageError(message: string, context?: Record<string, any>): string {
    return this.captureError({
      type: 'storage',
      severity: 'medium',
      message,
      context
    });
  }

  captureQuotaError(message: string, context?: Record<string, any>): string {
    return this.captureError({
      type: 'quota',
      severity: 'high',
      message,
      context
    });
  }

  captureAPIError(message: string, context?: Record<string, any>): string {
    return this.captureError({
      type: 'api',
      severity: 'medium',
      message,
      context
    });
  }
}

// Export singleton instance
export const errorRecoverySystem = new ErrorRecoverySystem();

// Convenience export for React components
export const useErrorRecovery = () => {
  return {
    captureError: errorRecoverySystem.captureError.bind(errorRecoverySystem),
    captureAuthError: errorRecoverySystem.captureAuthError.bind(errorRecoverySystem),
    captureStorageError: errorRecoverySystem.captureStorageError.bind(errorRecoverySystem),
    captureQuotaError: errorRecoverySystem.captureQuotaError.bind(errorRecoverySystem),
    captureAPIError: errorRecoverySystem.captureAPIError.bind(errorRecoverySystem),
    getUnresolvedErrors: errorRecoverySystem.getUnresolvedErrors.bind(errorRecoverySystem),
    onError: errorRecoverySystem.onError.bind(errorRecoverySystem)
  };
};
