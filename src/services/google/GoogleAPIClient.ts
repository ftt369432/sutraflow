/**
 * Google API Client
 * 
 * Handles Google API authentication and requests for Gmail, Calendar, and other Google services
 * This is the LIVE implementation for production use with real Google APIs
 */

import { getEnv } from '../../config/env';
import { googleTokenManager } from '../GoogleTokenManager';

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface GoogleAPIConfig {
  apiKey: string;
  clientId: string;
  scope: string;
  discoveryDocs: string[];
}

export class GoogleAPIClient {
  private static instance: GoogleAPIClient;
  private gapi: any = null;
  private isInitialized = false;
  private _isSignedIn = false;  // Renamed to avoid conflict
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiryTime: number | null = null;
  private onSignInCallback: ((user: GoogleUser | null) => void) | null = null;

  private constructor() {
    // Singleton constructor
  }

  public static getInstance(): GoogleAPIClient {
    if (!GoogleAPIClient.instance) {
      GoogleAPIClient.instance = new GoogleAPIClient();
    }
    return GoogleAPIClient.instance;
  }

  /**
   * Initialize the Google API client
   */
  public async initialize(onSignInChange?: (user: GoogleUser | null) => void): Promise<void> {
    // Emergency stop check
    if (typeof window !== 'undefined' && localStorage.getItem('DISABLE_GOOGLE_SERVICES_EMERGENCY')) {
      console.log('🚨 Emergency stop: Google services disabled');
      return;
    }

    if (this.isInitialized) {
      return;
    }

    this.onSignInCallback = onSignInChange || null;

    try {
      // Check if we have Supabase provider token available
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession();
      
      if (session?.provider_token) {
        console.log('✅ Using existing Supabase provider token for Google API');
        this.accessToken = session.provider_token;
        this._isSignedIn = true;
        this.isInitialized = true;
        
        if (this.onSignInCallback) {
          // Create user object from session data
          const user: GoogleUser = {
            id: session.user.user_metadata?.sub || session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
            picture: session.user.user_metadata?.picture || session.user.user_metadata?.avatar_url
          };
          this.onSignInCallback(user);
        }
        
        console.log('✅ Google API Client initialized with Supabase token');
        return;
      }

      // Fallback: Try to load Google API if no Supabase token (shouldn't happen in production)
      console.warn('⚠️ No Supabase provider token found, falling back to direct Google API');
      
      // Check if we're in a secure context for Google API
      if (!window.location.protocol.startsWith('https') && window.location.hostname !== 'localhost') {
        console.warn('⚠️ Google API requires HTTPS or localhost');
        this.isInitialized = true;
        return;
      }

      // Load Google API script if not already loaded
      if (!window.gapi) {
        try {
          await this.loadGoogleAPI();
        } catch (error) {
          console.error('❌ Failed to load Google API script:', error);
          this.isInitialized = true; // Mark as initialized to prevent retries
          return;
        }
      }

      this.gapi = window.gapi;

      // Initialize gapi with timeout
      await Promise.race([
        new Promise<void>((resolve, reject) => {
          this.gapi.load('auth2:client', {
            callback: resolve,
            onerror: reject
          });
        }),
        new Promise<void>((_, reject) => 
          setTimeout(() => reject(new Error('Google API load timeout')), 10000)
        )
      ]);

      const config: GoogleAPIConfig = {
        apiKey: getEnv().googleApiKey || '',
        clientId: getEnv().googleClientId || '',
        scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
        discoveryDocs: [
          'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest',
          'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
        ]
      };

      // Validate required config
      if (!config.clientId || !config.apiKey) {
        console.warn('⚠️ Missing Google API credentials - running in offline mode');
        this.isInitialized = true;
        return;
      }

      // Initialize the client with timeout
      await Promise.race([
        this.gapi.client.init({
          apiKey: config.apiKey,
          clientId: config.clientId,
          scope: config.scope,
          discoveryDocs: config.discoveryDocs
        }),
        new Promise<void>((_, reject) => 
          setTimeout(() => reject(new Error('Google client init timeout')), 15000)
        )
      ]);

      // Set up auth instance
      const authInstance = this.gapi.auth2.getAuthInstance();
      if (authInstance) {
        // Listen for sign-in state changes
        authInstance.isSignedIn.listen((signedIn: boolean) => {
          this._isSignedIn = signedIn;
          if (this.onSignInCallback) {
            this.onSignInCallback(signedIn ? this.getCurrentUser() : null);
          }
        });

        // Check if already signed in
        this._isSignedIn = authInstance.isSignedIn.get();
        if (this._isSignedIn) {
          const user = authInstance.currentUser.get();
          const authResponse = user.getAuthResponse();
          this.accessToken = authResponse.access_token;
          this.expiryTime = authResponse.expires_at;
        }
      }

      this.isInitialized = true;
      console.log('✅ Google API Client initialized with direct Google Auth');

    } catch (error) {
      console.error('❌ Failed to initialize Google API Client:', error);
      // Don't throw error - allow app to continue without Google API
      this.isInitialized = true; // Mark as initialized to prevent retries
      console.log('⚠️ Google API Client initialized in fallback mode (no live Google API access)');
    }
  }

  /**
   * Load the Google API script
   */
  private loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google API script'));
      document.head.appendChild(script);
    });
  }

  /**
   * Sign in with Google
   */
  public async signIn(): Promise<GoogleUser> {
    if (!this.isInitialized) {
      throw new Error('Google API Client not initialized');
    }

    try {
      const authInstance = this.gapi.auth2.getAuthInstance();
      const user = await authInstance.signIn();
      
      const authResponse = user.getAuthResponse();
      this.accessToken = authResponse.access_token;
      this.refreshToken = authResponse.refresh_token;
      this.expiryTime = authResponse.expires_at;
      this._isSignedIn = true;

      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        throw new Error('Failed to get user information after sign in');
      }

      console.log('✅ Google sign in successful:', currentUser.email);
      return currentUser;

    } catch (error) {
      console.error('❌ Google sign in failed:', error);
      throw new Error(`Google sign in failed: ${error}`);
    }
  }

  /**
   * Sign out from Google
   */
  public async signOut(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      const authInstance = this.gapi.auth2.getAuthInstance();
      await authInstance.signOut();
      
      this.accessToken = null;
      this.refreshToken = null;
      this.expiryTime = null;
      this._isSignedIn = false;

      console.log('✅ Google sign out successful');

    } catch (error) {
      console.error('❌ Google sign out failed:', error);
      throw new Error(`Google sign out failed: ${error}`);
    }
  }

  /**
   * Get current user information
   */
  public getCurrentUser(): GoogleUser | null {
    if (!this.isInitialized || !this._isSignedIn) {
      return null;
    }

    try {
      const authInstance = this.gapi.auth2.getAuthInstance();
      const user = authInstance.currentUser.get();
      const profile = user.getBasicProfile();

      return {
        id: profile.getId(),
        email: profile.getEmail(),
        name: profile.getName(),
        picture: profile.getImageUrl()
      };
    } catch (error) {
      console.error('❌ Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Check if user is signed in
   */
  public isUserSignedIn(): boolean {
    return this._isSignedIn;
  }

  /**
   * Method for isSignedIn (compatibility with old GoogleAPI interface)
   */
  public isSignedIn(): boolean {
    return this._isSignedIn;
  }

  /**
   * Get current access token
   */
  public getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Set access token (for external auth flows like Supabase)
   */
  public async setAccessToken(token: string): Promise<void> {
    this.accessToken = token;
    this._isSignedIn = true;
    console.log('✅ Access token set externally');
  }

  /**
   * Refresh access token if needed
   */
  public async refreshAccessToken(): Promise<string> {
    try {
      // First try to get a fresh token from Supabase (but don't loop)
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession();
      
      if (session?.provider_token && session.provider_token !== this.accessToken) {
        this.accessToken = session.provider_token;
        this.expiryTime = session.expires_at ? session.expires_at * 1000 : null; // Convert to milliseconds
        console.log('✅ Refreshed token from Supabase session');
        return this.accessToken;
      }

      // If we already have the same token, don't refresh again
      if (this.accessToken) {
        console.log('🔄 Using existing token (no refresh needed)');
        return this.accessToken;
      }

      // Fallback to direct Google API refresh (if available)
      if (!this.isInitialized || !this._isSignedIn) {
        throw new Error('Not signed in');
      }

      if (this.gapi) {
        const authInstance = this.gapi.auth2.getAuthInstance();
        const user = authInstance.currentUser.get();
        const authResponse = await user.reloadAuthResponse();
        
        this.accessToken = authResponse.access_token;
        this.expiryTime = authResponse.expires_at;
        console.log('✅ Refreshed token from Google API');
        return this.accessToken;
      }

      throw new Error('No refresh method available');

    } catch (error) {
      console.error('❌ Failed to refresh access token:', error);
      // Don't throw - just return existing token to prevent loops
      if (this.accessToken) {
        console.log('🔄 Using existing token despite refresh failure');
        return this.accessToken;
      }
      throw new Error(`Token refresh failed: ${error}`);
    }
  }

  /**
   * Make authenticated request to Google API (legacy interface)
   */
  public async request<T = any>(options: {
    url: string;
    method: string;
    data?: any;
  }): Promise<{ data: T }> {
    const response = await this.makeAuthenticatedRequest(options.url, {
      method: options.method,
      body: options.data ? JSON.stringify(options.data) : undefined
    });
    
    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }
    
    const data = await response.json();
    return { data };
  }

  /**
   * Make authenticated request to Google API
   */
  public async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    // Use enhanced token manager to ensure we have a valid token
    try {
      const token = await googleTokenManager.ensureValidToken();
      if (token) {
        this.accessToken = token;
        this._isSignedIn = true;
        // console.log('✅ Using enhanced token manager for authenticated request'); // Reduced logging
      } else {
        console.warn('⚠️ No valid token available from enhanced token manager');
      }
    } catch (error) {
      console.warn('⚠️ Enhanced token manager failed, falling back:', error);
      
      // Fallback to existing Supabase session check
      try {
        const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession();
        if (session?.provider_token) {
          this.accessToken = session.provider_token;
          this._isSignedIn = true;
          console.log('✅ Retrieved fresh provider token from Supabase');
        }
      } catch (fallbackError) {
        console.warn('⚠️ Could not get fresh token from Supabase:', fallbackError);
      }
    }

    if (!this.accessToken) {
      console.warn('⚠️ No access token available - falling back to offline mode');
      // Instead of throwing an error, return a mock response for offline functionality
      throw new Error('No access token available - please sign in to Google');
    }

    // Only refresh if token is REALLY expired (not proactively)
    const isExpired = this.expiryTime && Date.now() >= this.expiryTime;
    
    if (isExpired) {
      console.log('🔄 Token expired, attempting refresh...');
      try {
        await this.refreshAccessToken();
      } catch (error) {
        console.warn('⚠️ Token refresh failed, continuing with current token:', error);
        // Continue with existing token instead of failing
      }
    }

    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    // Don't retry on 401 to prevent infinite loops
    if (response.status === 401) {
      console.warn('⚠️ Google API request unauthorized - not retrying to prevent loops');
    }

    return response;
  }

  /**
   * Get Gmail profile
   */
  public async getGmailProfile(): Promise<any> {
    const response = await this.makeAuthenticatedRequest(
      'https://gmail.googleapis.com/gmail/v1/users/me/profile'
    );
    
    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status}`);
    }
    
    return response.json();
  }

  /**
   * Get Gmail messages
   */
  public async getGmailMessages(options: {
    q?: string;
    maxResults?: number;
    pageToken?: string;
    labelIds?: string[];
  } = {}): Promise<any> {
    const params = new URLSearchParams();
    
    if (options.q) params.append('q', options.q);
    if (options.maxResults) params.append('maxResults', options.maxResults.toString());
    if (options.pageToken) params.append('pageToken', options.pageToken);
    if (options.labelIds) {
      options.labelIds.forEach(labelId => params.append('labelIds', labelId));
    }

    const response = await this.makeAuthenticatedRequest(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`
    );
    
    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status}`);
    }
    
    return response.json();
  }

  /**
   * Get specific Gmail message
   */
  public async getGmailMessage(messageId: string): Promise<any> {
    const response = await this.makeAuthenticatedRequest(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`
    );
    
    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status}`);
    }
    
    return response.json();
  }

  /**
   * Get Calendar events
   */
  public async getCalendarEvents(calendarId: string = 'primary', options: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    pageToken?: string;
  } = {}): Promise<any> {
    const params = new URLSearchParams();
    
    if (options.timeMin) params.append('timeMin', options.timeMin);
    if (options.timeMax) params.append('timeMax', options.timeMax);
    if (options.maxResults) params.append('maxResults', options.maxResults.toString());
    if (options.pageToken) params.append('pageToken', options.pageToken);

    const response = await this.makeAuthenticatedRequest(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`
    );
    
    if (!response.ok) {
      throw new Error(`Calendar API error: ${response.status}`);
    }
    
    return response.json();
  }

  /**
   * Create Calendar event
   */
  public async createCalendarEvent(calendarId: string = 'primary', event: any): Promise<any> {
    const response = await this.makeAuthenticatedRequest(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        body: JSON.stringify(event)
      }
    );
    
    if (!response.ok) {
      throw new Error(`Calendar API error: ${response.status}`);
    }
    
    return response.json();
  }

  /**
   * List Calendar lists
   */
  public async getCalendarList(): Promise<any> {
    const response = await this.makeAuthenticatedRequest(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList'
    );
    
    if (!response.ok) {
      throw new Error(`Calendar API error: ${response.status}`);
    }
    
    return response.json();
  }
}

// Export singleton instance
export const googleApiClient = GoogleAPIClient.getInstance();

// Legacy export for compatibility
export { GoogleAPIClient as default };
