/**
 * Simplified Email Authentication Service
 * Clean implementation focusing only on Supabase email auth
 */

import { supabase } from '../../lib/supabase';
import { getEnv } from '../../config/env';

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role?: string;
  plan?: string;
}

export interface AuthResponse {
  user?: AuthUser;
  error?: string;
  needsConfirmation?: boolean;
}

/**
 * Email Authentication Class
 */
export class EmailAuthService {
  /**
   * Sign up with email and password
   */
  static async signUp(
    email: string, 
    password: string, 
    firstName?: string, 
    lastName?: string
  ): Promise<AuthResponse> {
    try {
      console.log('🔐 EmailAuth: Signing up user with email:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName || '',
            last_name: lastName || '',
            full_name: firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || ''
          }
        }
      });

      if (error) {
        console.error('❌ EmailAuth: Sign up error:', error);
        return { error: error.message };
      }

      if (data.user && !data.user.email_confirmed_at) {
        console.log('📧 EmailAuth: Confirmation email sent');
        return { 
          needsConfirmation: true,
          user: this.transformUser(data.user)
        };
      }

      if (data.user) {
        console.log('✅ EmailAuth: User signed up successfully');
        return { user: this.transformUser(data.user) };
      }

      return { error: 'Unknown error during sign up' };
    } catch (error) {
      console.error('❌ EmailAuth: Sign up exception:', error);
      return { error: 'Failed to create account. Please try again.' };
    }
  }

  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('🔐 EmailAuth: Signing in user with email:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ EmailAuth: Sign in error:', error);
        return { error: error.message };
      }

      if (data.user) {
        console.log('✅ EmailAuth: User signed in successfully');
        return { user: this.transformUser(data.user) };
      }

      return { error: 'Invalid email or password' };
    } catch (error) {
      console.error('❌ EmailAuth: Sign in exception:', error);
      return { error: 'Failed to sign in. Please try again.' };
    }
  }

  /**
   * Send password reset email
   */
  static async resetPassword(email: string): Promise<AuthResponse> {
    try {
      console.log('📧 EmailAuth: Sending password reset email to:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        console.error('❌ EmailAuth: Password reset error:', error);
        return { error: error.message };
      }

      console.log('✅ EmailAuth: Password reset email sent');
      return { needsConfirmation: true };
    } catch (error) {
      console.error('❌ EmailAuth: Password reset exception:', error);
      return { error: 'Failed to send reset email. Please try again.' };
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<void> {
    try {
      console.log('🚪 EmailAuth: Signing out user');
      await supabase.auth.signOut();
      console.log('✅ EmailAuth: User signed out successfully');
    } catch (error) {
      console.error('❌ EmailAuth: Sign out error:', error);
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user ? this.transformUser(user) : null;
    } catch (error) {
      console.error('❌ EmailAuth: Get current user error:', error);
      return null;
    }
  }

  /**
   * Check if user email is confirmed
   */
  static async isEmailConfirmed(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.email_confirmed_at != null;
    } catch (error) {
      console.error('❌ EmailAuth: Email confirmation check error:', error);
      return false;
    }
  }

  /**
   * Resend confirmation email
   */
  static async resendConfirmation(email: string): Promise<AuthResponse> {
    try {
      console.log('📧 EmailAuth: Resending confirmation email to:', email);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) {
        console.error('❌ EmailAuth: Resend confirmation error:', error);
        return { error: error.message };
      }

      console.log('✅ EmailAuth: Confirmation email resent');
      return { needsConfirmation: true };
    } catch (error) {
      console.error('❌ EmailAuth: Resend confirmation exception:', error);
      return { error: 'Failed to resend confirmation. Please try again.' };
    }
  }

  /**
   * Transform Supabase user to AuthUser format
   */
  private static transformUser(supabaseUser: any): AuthUser {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      fullName: supabaseUser.user_metadata?.full_name || 
                `${supabaseUser.user_metadata?.first_name || ''} ${supabaseUser.user_metadata?.last_name || ''}`.trim() || 
                'User',
      firstName: supabaseUser.user_metadata?.first_name,
      lastName: supabaseUser.user_metadata?.last_name,
      avatarUrl: supabaseUser.user_metadata?.avatar_url,
      role: supabaseUser.user_metadata?.role || 'user',
      plan: supabaseUser.user_metadata?.plan || 'free'
    };
  }
}

/**
 * Mock Email Authentication for Development
 */
export class MockEmailAuthService {
  /**
   * Mock sign up - simulates successful registration
   */
  static async signUp(
    email: string, 
    password: string, 
    firstName?: string, 
    lastName?: string
  ): Promise<AuthResponse> {
    console.log('🔧 MockAuth: Simulating sign up for:', email);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate email confirmation requirement
    return {
      needsConfirmation: true,
      user: {
        id: 'mock-' + Date.now(),
        email,
        fullName: firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || 'Test User',
        firstName,
        lastName,
        role: 'user',
        plan: 'free'
      }
    };
  }

  /**
   * Mock sign in - accepts demo credentials or any email/password
   */
  static async signIn(email: string, password: string): Promise<AuthResponse> {
    console.log('🔧 MockAuth: Simulating sign in for:', email);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Demo credentials or any email/password works in mock mode
    if (password.length >= 6) {
      return {
        user: {
          id: 'mock-' + Date.now(),
          email,
          fullName: email === 'demo@genieflow.ai' ? 'Demo User' : 'Test User',
          firstName: email === 'demo@genieflow.ai' ? 'Demo' : 'Test',
          lastName: email === 'demo@genieflow.ai' ? 'User' : 'User',
          role: 'user',
          plan: 'free'
        }
      };
    }

    return { error: 'Password must be at least 6 characters' };
  }

  /**
   * Mock password reset
   */
  static async resetPassword(email: string): Promise<AuthResponse> {
    console.log('🔧 MockAuth: Simulating password reset for:', email);
    await new Promise(resolve => setTimeout(resolve, 500));
    return { needsConfirmation: true };
  }

  /**
   * Mock sign out
   */
  static async signOut(): Promise<void> {
    console.log('🔧 MockAuth: Simulating sign out');
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  /**
   * Mock resend confirmation
   */
  static async resendConfirmation(email: string): Promise<AuthResponse> {
    console.log('🔧 MockAuth: Simulating resend confirmation for:', email);
    await new Promise(resolve => setTimeout(resolve, 500));
    return { needsConfirmation: true };
  }
}

/**
 * Main Email Authentication Interface
 * Automatically switches between real and mock based on environment
 */
export class Auth {
  static get service() {
    const { useMock } = getEnv();
    return useMock ? MockEmailAuthService : EmailAuthService;
  }

  static async signUp(email: string, password: string, firstName?: string, lastName?: string) {
    return this.service.signUp(email, password, firstName, lastName);
  }

  static async signIn(email: string, password: string) {
    return this.service.signIn(email, password);
  }

  static async resetPassword(email: string) {
    return this.service.resetPassword(email);
  }

  static async signOut() {
    return this.service.signOut();
  }

  static async getCurrentUser() {
    if (getEnv().useMock) {
      return null; // Mock mode doesn't persist users
    }
    return EmailAuthService.getCurrentUser();
  }

  static async isEmailConfirmed() {
    if (getEnv().useMock) {
      return true; // Mock mode always considers email confirmed
    }
    return EmailAuthService.isEmailConfirmed();
  }

  static async resendConfirmation(email: string) {
    if (getEnv().useMock) {
      return MockEmailAuthService.resendConfirmation(email);
    }
    return EmailAuthService.resendConfirmation(email);
  }
}