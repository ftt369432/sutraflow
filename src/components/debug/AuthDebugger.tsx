import React, { useEffect, useState } from 'react';
import { debugAuthentication } from '../../services/authService';
import { supabase } from '../../lib/supabaseClient';

/**
 * A component to debug authentication status
 * Add this to your app temporarily to troubleshoot auth issues
 */
const AuthDebugger: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<any>(null);
  
  const checkAuth = async () => {
    // Get session info
    const { data: { session } } = await supabase.auth.getSession();
    // Get user info
    const { data: { user } } = await supabase.auth.getUser();
    
    setAuthStatus({
      hasSession: !!session,
      hasUser: !!user,
      userId: user?.id,
      email: user?.email,
      hasAccessToken: !!session?.access_token,
    });
    
    // Log more detailed info to console
    debugAuthentication();
  };
  
  useEffect(() => {
    checkAuth();
  }, []);
  
  // Quick login function for testing
  const testLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: prompt('Enter test email') || '',
      password: prompt('Enter password') || '',
    });
    
    if (error) {
      console.error('Login error:', error);
      alert(`Login failed: ${error.message}`);
    } else {
      checkAuth();
    }
  };
  
  return (
    <div className="auth-debugger" style={{ padding: '20px', margin: '20px', border: '1px solid #ccc' }}>
      <h3>Authentication Debugger</h3>
      <div>
        <button onClick={checkAuth} style={{ marginRight: '10px' }}>
          Refresh Auth Status
        </button>
        <button onClick={testLogin}>
          Test Login
        </button>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h4>Auth Status:</h4>
        {authStatus ? (
          <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
            <div>Has Session: {authStatus.hasSession ? '✅' : '❌'}</div>
            <div>Has User: {authStatus.hasUser ? '✅' : '❌'}</div>
            <div>User ID: {authStatus.userId || 'Not logged in'}</div>
            <div>Email: {authStatus.email || 'Not available'}</div>
            <div>Has Access Token: {authStatus.hasAccessToken ? '✅' : '❌'}</div>
          </div>
        ) : (
          <div>Checking authentication status...</div>
        )}
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h4>Troubleshooting Tips:</h4>
        <ul>
          <li>Make sure you're logged in before creating assistants</li>
          <li>Check browser console for more detailed auth information</li>
          <li>Ensure your RLS policies match the user ID format in auth.uid()</li>
        </ul>
      </div>
    </div>
  );
};

export default AuthDebugger;
