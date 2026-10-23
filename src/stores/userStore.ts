import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAvatar } from '../lib/utils';
// GEMINI-ONLY MODE: Google user profile service removed
// import { googleUserProfileService } from '../services/google/userProfileService';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// User and subscription types
export type SubscriptionTier = 'free' | 'pro' | 'enterprise' | 'free-business' | 'business' | 'enterprise-business';
export type SubscriptionType = 'individual' | 'business';

export interface UserSubscription {
  plan: SubscriptionTier;
  type: SubscriptionType;
  status: 'active' | 'inactive' | 'trialing' | 'canceled' | 'expired';
  currentPeriodEnd?: string; // ISO date string
  cancelAtPeriodEnd?: boolean;
}

// Add integration types
export interface IntegrationAccount {
  provider: 'google' | 'microsoft' | 'apple';
  email: string;
  connected: boolean;
  connectedAt: string; // ISO date string
  profilePictureUrl?: string;
  displayName?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  
  // Contact Information
  phone?: string;
  businessEmail?: string;
  website?: string;
  linkedIn?: string;
  location?: string;
  timezone?: string;
  emergencyContact?: string;
  preferredCommunication?: string;
  skypeId?: string;
  teamsId?: string;
  slackHandle?: string;
  
  // Business Information
  company?: string;
  role?: string;
  jobTitle?: string;
  industry?: string;
  companySize?: string;
  businessType?: string;
  businessRegistration?: string;
  taxId?: string;
  primaryIndustry?: string;
  secondaryIndustries?: string[];
  clientTypes?: string[];
  serviceAreas?: string[];
  certifications?: string[];
  professionalLicenses?: string[];
  
  // Organization Details
  department?: string;
  team?: string;
  manager?: string;
  officeLocation?: string;
  employeeId?: string;
  
  subscription: UserSubscription | null;
  // Add connected accounts
  integrations?: IntegrationAccount[];
  verified?: boolean;
}

// State interface
interface UserState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  authToken: string | null;
  subscription: UserSubscription | null;
  isLoading: boolean;
  
  // Actions
  initializeFromSupabase: (sessionUser: User, token: string | null) => void;
  setUser: (user: UserProfile | null) => void;
  setAuthToken: (token: string | null) => void;
  setSubscription: (subscription: UserSubscription | null) => void;
  logout: () => void;
  clearUser: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  checkAuth: () => boolean;
  isSubscribed: () => boolean;
  hasProAccess: () => boolean;
  hasEnterpriseAccess: () => boolean;
  // Add new actions for Google integration
  syncWithGoogleProfile: () => Promise<void>;
  hasGoogleIntegration: () => boolean;
  getGoogleIntegration: () => IntegrationAccount | undefined;
  addIntegration: (integration: IntegrationAccount) => void;
  removeIntegration: (provider: string) => void;
}

// Create the store
export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      authToken: null,
      subscription: null,
      isLoading: false,
      
      initializeFromSupabase: (sessionUser, token) => {
        if (!sessionUser) {
          set({ user: null, isAuthenticated: false, authToken: null });
          return;
        }

        const rawAvatar = 
          sessionUser.user_metadata?.picture ||
          sessionUser.user_metadata?.avatar_url ||
          sessionUser.user_metadata?.avatar ||
          (sessionUser as any).identities?.[0]?.identity_data?.picture ||
          (sessionUser as any).identities?.[0]?.identity_data?.avatar_url ||
          localStorage.getItem('genieflow_user_avatar') ||
          undefined;

        const profile: UserProfile = {
          id: sessionUser.id,
          email: sessionUser.email || '',
          fullName: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.fullName || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'User',
          avatar: rawAvatar || getAvatar(sessionUser.email || ''),
          subscription: { // This might need to be fetched separately later
            plan: 'pro',
            type: 'individual',
            status: 'active',
          },
        };
        
        set({
          user: profile,
          isAuthenticated: true,
          authToken: token,
          isLoading: false,
          subscription: profile.subscription
        });
      },
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setAuthToken: (token) => set({ authToken: token }),
      
      setSubscription: (subscription) => set({ subscription }),
      
      logout: () => {
        set({
          user: null,
          authToken: null,
          isAuthenticated: false,
          subscription: null
        });
      },
      
      clearUser: () => {
        console.warn('Clearing user state completely');
        set({
          user: null,
          authToken: null,
          isAuthenticated: false,
          subscription: null,
          isLoading: false
        });
      },
      
      updateProfile: async (profileUpdate: Partial<UserProfile>) => {
        const { user } = get();
        if (!user) {
          throw new Error("User not authenticated");
        }
        
        set({ isLoading: true });
        try {
          // Only send data that needs to be updated.
          const { data, error } = await supabase.auth.updateUser({
            data: { 
              fullName: profileUpdate.fullName,
            }
          });

          if (error) {
            throw error;
          }

          if (data.user) {
            // Re-create the user profile from the definitive source: the returned user object
            const updatedProfile: UserProfile = {
              id: data.user.id,
              email: data.user.email || '',
              fullName: data.user.user_metadata?.full_name || data.user.user_metadata?.fullName || data.user.user_metadata?.name || '',
              avatar: data.user.user_metadata?.picture || data.user.user_metadata?.avatar_url || user.avatar,
              subscription: user.subscription, // Keep existing subscription info
              integrations: user.integrations, // Keep existing integrations
            };
            set({ user: updatedProfile, isLoading: false, isAuthenticated: true });
          } else {
            // If no user object is returned, only update what we sent
            const updatedUser = { ...user, ...profileUpdate };
            set({ user: updatedUser, isLoading: false });
          }
        } catch (error) {
          console.error("Error updating user profile:", error);
          set({ isLoading: false });
          throw error;
        }
      },
      
      checkAuth: () => {
        const { authToken } = get();
        return !!authToken;
      },
      
      isSubscribed: () => {
        const { subscription } = get();
        return !!subscription && subscription.status === 'active' && subscription.plan !== 'free' && subscription.plan !== 'free-business';
      },
      
      hasProAccess: () => {
        const { subscription } = get();
        return !!subscription && 
          subscription.status === 'active' && 
          ['pro', 'enterprise', 'business', 'enterprise-business'].includes(subscription.plan);
      },
      
      hasEnterpriseAccess: () => {
        const { subscription } = get();
        return !!subscription && 
          subscription.status === 'active' && 
          ['enterprise', 'enterprise-business'].includes(subscription.plan);
      },

      // New methods for Google integration - DISABLED FOR GEMINI-ONLY MODE
      syncWithGoogleProfile: async () => {
        try {
          set({ isLoading: true });
          const { user } = get();
          
          if (!user) {
            throw new Error('User not logged in');
          }

          // GEMINI-ONLY MODE: Google integrations disabled
          console.log('🤖 Gemini-only mode: Google integrations not available');
          set({ isLoading: false });
          return;
        } catch (error) {
          console.error('Google integration disabled in Gemini-only mode:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      hasGoogleIntegration: () => {
        const { user } = get();
        if (!user || !user.integrations) return false;
        
        return user.integrations.some(
          (integration) => integration.provider === 'google' && integration.connected
        );
      },

      getGoogleIntegration: () => {
        const { user } = get();
        if (!user || !user.integrations) return undefined;
        
        return user.integrations.find(
          (integration) => integration.provider === 'google' && integration.connected
        );
      },

      addIntegration: (integration) => {
        const { user } = get();
        if (!user) return;

        const existingIntegrations = user.integrations || [];
        const updatedIntegrations = [
          ...existingIntegrations.filter(
            (i) => !(i.provider === integration.provider && i.email === integration.email)
          ),
          integration
        ];

        set({
          user: {
            ...user,
            integrations: updatedIntegrations
          }
        });
      },

      removeIntegration: (provider) => {
        const { user } = get();
        if (!user || !user.integrations) return;

        const updatedIntegrations = user.integrations.filter(
          (integration) => integration.provider !== provider
        );

        set({
          user: {
            ...user,
            integrations: updatedIntegrations
          }
        });
      }
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        user: state.user,
        authToken: state.authToken,
        subscription: state.subscription
      })
    }
  )
);