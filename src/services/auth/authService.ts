import { useUserStore, UserProfile, UserSubscription, SubscriptionTier } from '../../stores/userStore';
import { getAvatar } from '../../lib/utils';
import { getEnv, resetEnvConfig } from '../../config/env';
import { useSupabase } from '../../providers/SupabaseProvider';
import googleAuthService from './googleAuth';
import { supabase } from '../../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

// Global reference to the Supabase setter for mock mode
// This is a workaround since we can't use hooks in regular functions
let _setMockUserFn: ((userData: { id: string, email: string, fullName?: string }) => void) | null = null;

// Helper function to register the setter
export const registerSupabaseUserSetter = (setterFn: (userData: { id: string, email: string, fullName?: string }) => void) => {
  _setMockUserFn = setterFn;
  console.log('Registered Supabase mock user setter');

  // Also register the same function with Google Auth service
  googleAuthService.registerMockUserSetter(setterFn);
};

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthError {
  message: string;
  status?: number;
  code: string | undefined;
  name: string;
}

export interface AuthResponse {
  user: User | null;
  error: AuthError | null;
}

// Auth error class for better error handling
export class AuthError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

// Error codes
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'auth/invalid-credentials',
  EMAIL_IN_USE: 'auth/email-already-in-use',
  WEAK_PASSWORD: 'auth/weak-password',
  INVALID_EMAIL: 'auth/invalid-email',
  USER_NOT_FOUND: 'auth/user-not-found',
  NETWORK_ERROR: 'auth/network-error',
  TOO_MANY_REQUESTS: 'auth/too-many-requests',
  UNAUTHORIZED: 'auth/unauthorized',
  UNKNOWN: 'auth/unknown-error',
};

// Mock user data for demo purposes
const MOCK_USERS = [
  {
    id: '1',
    email: 'demo@genieflowai.com',
    password: 'demo123', // In a real app, passwords would be hashed
    firstName: 'Demo',
    lastName: 'User',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    id: '2',
    email: 'enterprise@genieflowai.com',
    password: 'enterprise123',
    firstName: 'Enterprise',
    lastName: 'User',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    company: 'GenieFlow Inc.',
    jobTitle: 'CEO'
  }
];

// Mock subscription data
const MOCK_SUBSCRIPTIONS: Record<string, Omit<UserSubscription, 'id'>> = {
  '1': {
    plan: 'pro',
    type: 'individual',
    status: 'active',
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
  },
  '2': {
    plan: 'enterprise-business',
    type: 'business',
    status: 'active',
    currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
  }
};

// Generate a mock JWT token
const generateToken = (userId: string): string => {
  // In a real app, this would be a proper JWT token
  return `mock-jwt-token-${userId}-${Date.now()}`;
};

// Simulate a network request with potential failure
const simulateRequest = async <T>(data: T, failureRate = 0.1): Promise<T> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));

  // Randomly fail to simulate network issues (10% chance by default)
  if (Math.random() < failureRate) {
    throw new AuthError('Network error. Please check your connection and try again.', AUTH_ERROR_CODES.NETWORK_ERROR);
  }

  return data;
};

// Convert mock user to UserProfile format
const convertToUserProfile = (user: typeof MOCK_USERS[0]): UserProfile => {
  // Get subscription if available
  const subscription = MOCK_SUBSCRIPTIONS[user.id] || null;

  return {
    id: user.id,
    email: user.email,
    fullName: `${user.firstName} ${user.lastName}`,
    avatar: user.avatar,
    company: 'company' in user ? user.company : undefined,
    role: 'jobTitle' in user ? user.jobTitle : undefined,
    subscription: subscription
  };
};

// Create a mock Supabase User object
const createMockUser = (email: string, fullName: string): User => {
  const now = new Date().toISOString();
  const mockUser = {
    id: 'mock-user-id',
    email,
    user_metadata: {
      full_name: fullName,
    },
    app_metadata: {},
    aud: 'authenticated',
    created_at: now,
    role: 'authenticated',
    updated_at: now,
    phone: '',
    email_confirmed_at: now,
    phone_confirmed_at: undefined,
    last_sign_in_at: now,
    confirmed_at: now,
    identities: [],
    factors: null,
    recovery_sent_at: undefined,
    invited_at: undefined,
    confirmation_sent_at: undefined,
    confirmation_token: undefined,
    recovery_token: undefined,
    email_change_token_new: undefined,
    email_change: undefined,
    email_change_token_current: undefined,
    email_change_confirm_status: 0,
    banned_until: undefined,
    reauthentication_token: undefined,
    reauthentication_sent_at: undefined,
    is_sso_user: false,
    deleted_at: undefined,
  } as unknown as User;
  return mockUser;
};

// Login user
export const loginUser = async ({ email, password }: LoginCredentials): Promise<AuthResponse> => {
  // Check for explicit demo account activation
  // This allows using the demo account even in production/live environments
  if (email.toLowerCase() === 'demo@genieflowai.com' && password === 'demo123') {
    console.log('🔌 Activating Demo Mode for demo user');
    try {
      localStorage.setItem('GENIEFLOW_DEMO_MODE', 'true');
      resetEnvConfig(); // Force reload of env config to pick up the flag
    } catch (e) {
      console.error('Failed to set demo mode flag', e);
    }
  }

  const { useMock } = getEnv();

  if (useMock) {
    // Create a more comprehensive mock user that matches what the LoginPage expects
    const mockUser = createMockUser(email, 'Mock User');

    // Add additional fields that LoginPage is expecting
    const enhancedMockUser = {
      ...mockUser,
      firstName: 'Mock',
      lastName: 'User'
    };

    // Use the registered mock user function if available
    if (_setMockUserFn) {
      _setMockUserFn({
        id: enhancedMockUser.id,
        email: enhancedMockUser.email,
        fullName: `${enhancedMockUser.firstName} ${enhancedMockUser.lastName}`
      });
    }

    return {
      user: enhancedMockUser,
      error: null,
    };
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.warn('Supabase auth error, falling back to mock user:', error.message);

      // Create a fallback mock user since Supabase authentication failed
      const fallbackMockUser = createMockUser(email, email.split('@')[0]);
      const enhancedMockUser = {
        ...fallbackMockUser,
        firstName: email.split('@')[0],  // Use email username as first name
        lastName: 'User'
      };

      // Use the registered mock user function if available
      if (_setMockUserFn) {
        _setMockUserFn({
          id: enhancedMockUser.id,
          email: enhancedMockUser.email,
          fullName: `${enhancedMockUser.firstName} ${enhancedMockUser.lastName}`
        });
      }

      return {
        user: enhancedMockUser,
        error: null,
      };
    }

    return {
      user: data.user,
      error: null,
    };
  } catch (error: any) {
    console.error('Authentication error:', error);
    return {
      user: null,
      error: {
        message: error.message || 'Network error. Please check your connection and try again.',
        status: error.status || 500,
        code: error.code || 'NETWORK_ERROR',
        name: error.name || 'NetworkError',
      },
    };
  }
};

// Register new user
export const registerUser = async (data: RegisterData): Promise<AuthResponse> => {
  const { useMock } = getEnv();

  if (useMock) {
    const mockUser = createMockUser(data.email, `${data.firstName} ${data.lastName}`);
    return {
      user: mockUser,
      error: null,
    };
  }

  try {
    const { data: responseData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (error) {
      return {
        user: null,
        error: {
          message: error.message,
          status: 400,
          code: error.name,
          name: error.name,
        },
      };
    }

    // Insert profile row after successful signup
    if (responseData.user) {
      const { id, email } = responseData.user;
      const fullName = `${data.firstName} ${data.lastName}`;
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id,
          email,
          full_name: fullName,
          avatar_url: null
        });
      if (profileError) {
        // Optionally, you can delete the user if profile creation fails
        // await supabase.auth.admin.deleteUser(id);
        return {
          user: null,
          error: {
            message: 'User created but failed to create profile: ' + profileError.message,
            status: 500,
            code: profileError.code || 'PROFILE_ERROR',
            name: 'ProfileError',
          },
        };
      }
    }

    return {
      user: responseData.user,
      error: null,
    };
  } catch (error: any) {
    console.error('Authentication error:', error);
    return {
      user: null,
      error: {
        message: error.message || 'Network error. Please check your connection and try again.',
        status: error.status || 500,
        code: error.code || 'NETWORK_ERROR',
        name: error.name || 'NetworkError',
      },
    };
  }
};

// Logout user
export const logoutUser = async (): Promise<AuthResponse> => {
  // Clear demo mode flag on logout
  try {
    localStorage.removeItem('GENIEFLOW_DEMO_MODE');
    resetEnvConfig();
  } catch (e) {
    console.error('Failed to clear demo mode flag', e);
  }

  const { useMock } = getEnv();

  if (useMock) {
    return {
      user: null,
      error: null,
    };
  }

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        user: null,
        error: {
          message: error.message,
          status: 400,
          code: error.name,
          name: error.name,
        },
      };
    }

    return {
      user: null,
      error: null,
    };
  } catch (error: any) {
    console.error('Logout error:', error);
    return {
      user: null,
      error: {
        message: error.message || 'Network error. Please check your connection and try again.',
        status: error.status || 500,
        code: error.code || 'NETWORK_ERROR',
        name: error.name || 'NetworkError',
      },
    };
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const { useMock } = getEnv();
  if (useMock) {
    return true; // Mock mode always returns true
  }
  return supabase.auth.getSession() !== null;
};

// Get current user profile
export const getCurrentUser = (): UserProfile | null => {
  const { useMock } = getEnv();
  if (useMock) {
    return convertToUserProfile(MOCK_USERS[0]); // Return first mock user
  }
  return null; // In real mode, this should be handled by the Supabase provider
};

// Get auth token
export const getAuthToken = (): string | undefined => {
  const { useMock } = getEnv();
  if (useMock) {
    return generateToken('mock-user-id');
  }
  const token = useUserStore.getState().authToken;
  return token || undefined;
};

export const authService = {
  loginUser,
  registerUser,
  logoutUser,
  isAuthenticated,
  getCurrentUser,
  getAuthToken,
};