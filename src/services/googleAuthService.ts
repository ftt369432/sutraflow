/**
 * Google Auth Service
 * 
 * A wrapper around the GoogleAuthService class that exports the
 * getInstance method as getGoogleAuthInstance for easier imports.
 */

import googleAuthService, { GoogleAuthService } from './auth/googleAuth';

/**
 * Get the Google Auth instance
 * 
 * @returns The GoogleAuthService singleton instance
 */
export const getGoogleAuthInstance = (): GoogleAuthService => {
  return GoogleAuthService.getInstance();
};

// Re-export the default instance
export default googleAuthService;

// Re-export the types
export type { GoogleAuthConfig } from './auth/googleAuth';