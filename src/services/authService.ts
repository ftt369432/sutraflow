// Authentication fixes for GenieFlowAI
// This file provides solutions to authentication and RLS policy issues

import { supabase } from '../lib/supabaseClient';
import { AIAssistant } from '../types/ai';

/**
 * Checks if the current user is authenticated
 * @returns Authentication status object
 */
export const checkAuthStatus = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Auth check error:', error);
    return { isAuthenticated: false, error };
  }
  
  if (!session) {
    console.warn('No active session found');
    return { isAuthenticated: false };
  }
  
  console.log('Authentication status: Authenticated as', session.user.id);
  return { isAuthenticated: true, user: session.user };
};

/**
 * Gets the current authenticated user
 * @returns User object or null if not authenticated
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  return user;
};

/**
 * Creates an assistant with proper authentication and created_by field
 * @param assistant Assistant data to create
 * @returns Created assistant
 */
export const createAssistantWithAuth = async (
  assistant: Omit<AIAssistant, 'id' | 'createdAt' | 'updatedAt'>
): Promise<AIAssistant> => {
  // Get current user
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('You must be logged in to create an assistant');
  }
  
  // Make sure created_by is set to the authenticated user's ID
  // Only include fields that exist in the database schema
  const assistantWithUser = {
    name: assistant.name,
    description: assistant.description,
    system_prompt: assistant.system_prompt,
    user_id: user.id,
    created_by: user.id,
    is_active: assistant.isActive !== undefined ? assistant.isActive : true,
    model: 'gpt-3.5-turbo',
    tools: [],
    file_ids: [],
    metadata: {}
  };
  
  const { data, error } = await supabase
    .from('assistants')
    .insert([assistantWithUser])
    .select()
    .single();
  
  if (error) throw new Error(error.message);
  return data as AIAssistant;
};

/**
 * This function can be used to debug authentication issues
 * Add this to a component to see authentication status
 */
export const debugAuthentication = async () => {
  console.group('Authentication Debug Info');
  
  // Check session
  const { data: { session } } = await supabase.auth.getSession();
  console.log('Session exists:', !!session);
  
  // Check user
  const { data: { user } } = await supabase.auth.getUser();
  console.log('User exists:', !!user);
  
  if (user) {
    console.log('User ID:', user.id);
    console.log('User Email:', user.email);
  }
  
  // Check token
  if (session) {
    console.log('Access Token exists:', !!session.access_token);
    // Only show first few characters for security
    if (session.access_token) {
      console.log('Token preview:', `${session.access_token.substring(0, 10)}...`);
    }
  }
  
  console.groupEnd();
};
