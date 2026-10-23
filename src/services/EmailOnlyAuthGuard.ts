/**
 * Email-Only Authentication Guard
 * Prevents Google authentication attempts when using email-only mode
 */

class EmailOnlyAuthGuard {
  private static isEmailOnlyMode(): boolean {
    const useMock = import.meta.env.VITE_USE_MOCK;
    return useMock === 'false' || useMock === false;
  }

  static preventGoogleAuth(): boolean {
    if (this.isEmailOnlyMode()) {
      console.log('🚫 [EmailOnlyAuthGuard] Google authentication disabled - using email-only mode');
      return true;
    }
    return false;
  }

  static wrapGoogleTokenManager() {
    if (this.isEmailOnlyMode()) {
      // Return a dummy token manager that does nothing
      return {
        getValidToken: () => {
          console.log('🚫 [EmailOnlyAuthGuard] Google token disabled in email-only mode');
          return Promise.resolve(null);
        },
        refreshToken: () => {
          console.log('🚫 [EmailOnlyAuthGuard] Google refresh disabled in email-only mode');
          return Promise.resolve(null);
        },
        forceReAuthentication: () => {
          console.log('🚫 [EmailOnlyAuthGuard] Google re-auth disabled in email-only mode');
          return Promise.resolve(null);
        },
        initiateReAuthentication: () => {
          console.log('🚫 [EmailOnlyAuthGuard] Google re-auth disabled in email-only mode');
          return Promise.resolve(null);
        },
        getTokenInfo: () => {
          return { isValid: false, expiresAt: null };
        }
      };
    }
    
    // In mock/development mode, import the real GoogleTokenManager
    return import('../services/GoogleTokenManager').then(module => module.googleTokenManager);
  }
}

export default EmailOnlyAuthGuard;