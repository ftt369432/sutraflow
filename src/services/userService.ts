import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
  preferences?: Record<string, any>;
}

export const userService = {
  /**
   * Get the current user's profile
   */
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user || !user.user) {
        return null;
      }
      
      return await this.getUserProfile(user.user.id);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  /**
   * Get a user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error || !data) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      return {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        avatarUrl: data.avatar_url,
        role: data.role || 'user',
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        preferences: data.preferences
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  },

  /**
   * Update a user's profile
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      // Convert from camelCase to snake_case for the database
      const dbUpdates: Record<string, any> = {};
      
      if (updates.fullName) dbUpdates.full_name = updates.fullName;
      if (updates.avatarUrl) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.preferences) dbUpdates.preferences = updates.preferences;
      
      // Add updated_at timestamp
      dbUpdates.updated_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', userId)
        .select()
        .single();
      
      if (error || !data) {
        console.error('Error updating user profile:', error);
        return null;
      }
      
      return {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        avatarUrl: data.avatar_url,
        role: data.role || 'user',
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        preferences: data.preferences
      };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
  }
}; 