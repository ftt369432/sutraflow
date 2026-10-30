// Fix Supabase Authentication in your app
// Update your supabaseClient.ts or similar file

import React, { useState } from 'react';
import { getSupabaseClient } from './supabase';

// Use the singleton Supabase client to prevent conflicts
export const supabase = getSupabaseClient();

// 3. Add this helper function to check authentication status
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

// 4. Create a wrapper for the assistantService.ts functions
export const createAssistantWithAuth = async (assistant: any) => {
  const { isAuthenticated } = await checkAuthStatus();
  if (!isAuthenticated) {
    throw new Error('You must be logged in to create an assistant');
  }
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('No authenticated user found');
  }
  
  // Make sure created_by is set to the authenticated user's ID
  const assistantWithUser = {
    ...assistant,
    created_by: user.id
  };
  
  const { data, error } = await supabase
    .from('assistants')
    .insert([assistantWithUser])
    .select('*');
  
  if (error) throw new Error(error.message);
  return data;
};

// 5. Add this to a component where you can test authentication
export const AuthenticationDebugger = () => {
  const [authStatus, setAuthStatus] = useState<any>(null);
  
  const checkAuth = async () => {
    const status = await checkAuthStatus();
    setAuthStatus(status);
    console.log('Auth status:', status);
  };
  
  // Show auth token for debugging
  const showToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log('Auth token:', session.access_token);
    } else {
      console.log('No active session found');
    }
  };
  
  return (
    <div>
      <h2>Authentication Debugger</h2>
      <button onClick={checkAuth}>Check Auth Status</button>
      <button onClick={showToken}>Show Auth Token</button>
      <pre>{JSON.stringify(authStatus, null, 2)}</pre>
    </div>
  );
};
