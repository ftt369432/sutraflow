/**
 * Token Persistence Service
 * Handles storing and retrieving authentication tokens persistently
 * across browser sessions to prevent repeated sign-ins
 */

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
  email: string;
}

const TOKEN_STORAGE_KEY = 'genieflow_google_tokens';
const SESSION_STORAGE_KEY = 'genieflow_session_active';

export class TokenPersistenceService {
  private static instance: TokenPersistenceService;

  private constructor() {}

  static getInstance(): TokenPersistenceService {
    if (!TokenPersistenceService.instance) {
      TokenPersistenceService.instance = new TokenPersistenceService();
    }
    return TokenPersistenceService.instance;
  }

  /**
   * Store tokens persistently in localStorage
   */
  storeTokens(tokenData: TokenData): void {
    try {
      const encryptedData = btoa(JSON.stringify({
        ...tokenData,
        storedAt: Date.now()
      }));
      localStorage.setItem(TOKEN_STORAGE_KEY, encryptedData);
      sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
      console.log('✅ Tokens stored persistently');
    } catch (error) {
      console.error('❌ Failed to store tokens:', error);
    }
  }

  /**
   * Retrieve stored tokens
   */
  getStoredTokens(): TokenData | null {
    try {
      const encryptedData = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!encryptedData) {
        return null;
      }

      const data = JSON.parse(atob(encryptedData));
      
      // Check if tokens are not expired (with 5 minute buffer)
      const now = Date.now();
      const expiryBuffer = 5 * 60 * 1000; // 5 minutes
      
      if (data.expiresAt * 1000 - expiryBuffer > now) {
        console.log('✅ Retrieved valid stored tokens');
        return data;
      } else {
        console.log('⚠️ Stored tokens expired, clearing');
        this.clearTokens();
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to retrieve stored tokens:', error);
      this.clearTokens();
      return null;
    }
  }

  /**
   * Check if user has an active session
   */
  hasActiveSession(): boolean {
    return sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true' && 
           localStorage.getItem(TOKEN_STORAGE_KEY) !== null;
  }

  /**
   * Clear all stored tokens
   */
  clearTokens(): void {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      console.log('🧹 Cleared stored tokens');
    } catch (error) {
      console.error('❌ Failed to clear tokens:', error);
    }
  }

  /**
   * Update access token while keeping refresh token
   */
  updateAccessToken(newAccessToken: string, expiresAt: number): void {
    const existing = this.getStoredTokens();
    if (existing) {
      this.storeTokens({
        ...existing,
        accessToken: newAccessToken,
        expiresAt
      });
    }
  }
}

export const tokenPersistenceService = TokenPersistenceService.getInstance();
