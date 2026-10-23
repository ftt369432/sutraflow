import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../../providers/SupabaseProvider';
import { supabase } from '../../lib/supabase';
import { GoogleAPIClient } from '../../services/google/GoogleAPIClient';

// GOOGLE/GMAIL INTEGRATION DISABLED FOR GEMINI-ONLY MODE
export function GoogleCallback() {
  const navigate = useNavigate();
  const { setMockUser } = useSupabase();
  const [status, setStatus] = useState<'processing' | 'testing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [details, setDetails] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      console.log('GoogleCallback: Processing OAuth callback');
      
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');
      const code = urlParams.get('code');

      // Check for OAuth errors first
      if (error) {
        console.error('Google OAuth error:', error, errorDescription);
        setStatus('error');
        setErrorMessage(`OAuth error: ${error} - ${errorDescription || 'Authentication failed'}`);
        
        // Redirect to login after a delay
        setTimeout(() => {
          navigate('/auth/login?error=google-auth-failed');
        }, 3000);
        return;
      }

      // Check if we have an authorization code
      if (!code) {
        console.error('No authorization code received');
        setStatus('error');
        setErrorMessage('No authorization code received from Google');
        
        setTimeout(() => {
          navigate('/auth/login?error=no-auth-code');
        }, 3000);
        return;
      }

      try {
        // Supabase automatically processes the OAuth callback when the page loads
        // due to detectSessionInUrl: true in our client config
        // We just need to wait for it to complete and check the session
        console.log('GoogleCallback: Waiting for Supabase to process OAuth callback...');
        
        // Wait for Supabase to process the OAuth callback and establish session
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new Error(`Session error: ${sessionError.message}`);
        }
        
        if (session?.user) {
          console.log('GoogleCallback: User authenticated successfully:', session.user.email);
          console.log('GoogleCallback: Session details:', {
            hasProviderToken: !!session.provider_token,
            hasAccessToken: !!session.access_token,
            provider: session.user.app_metadata?.provider
          });
          
          // Update Google API client with tokens
          const googleClient = GoogleAPIClient.getInstance();
          
          if (session.provider_token) {
            console.log('✅ GoogleCallback: Setting Google provider token');
            await googleClient.setAccessToken(session.provider_token);
            setDetails('Google provider token available - testing Gmail access...');
            setStatus('testing');
            
            // Test Gmail API access
            try {
              const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
                headers: {
                  'Authorization': `Bearer ${session.provider_token}`,
                  'Content-Type': 'application/json'
                }
              });

              if (response.ok) {
                const profile = await response.json();
                console.log('✅ Gmail API test successful:', profile.emailAddress);
                setDetails(`Gmail access verified for ${profile.emailAddress}`);
              } else {
                console.warn('⚠️ Gmail API test failed:', response.status);
                setDetails('Authentication successful but Gmail access limited');
              }
            } catch (err) {
              console.warn('⚠️ Gmail API test error:', err);
              setDetails('Authentication successful - Gmail access testing failed');
            }
          } else if (session.access_token) {
            console.log('⚠️ GoogleCallback: Only Supabase access token available');
            await googleClient.setAccessToken(session.access_token);
            setDetails('Authentication successful but no Google provider token - Gmail features may be limited');
          } else {
            console.warn('⚠️ GoogleCallback: No tokens available in session');
            setDetails('Authentication successful but no access tokens found');
          }
          
          // Set the user in the Supabase context
          setMockUser({
            id: session.user.id,
            email: session.user.email!,
            fullName: session.user.user_metadata?.full_name || 
                     session.user.user_metadata?.name || 
                     'Google User'
          });
          
          setStatus('success');
          console.log('GoogleCallback: Authentication successful, redirecting to dashboard');
          
          // Redirect to dashboard after showing success
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          // If no session, wait a bit longer and try again
          console.log('GoogleCallback: No session found, waiting longer...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const { data: { session: retrySession }, error: retryError } = await supabase.auth.getSession();
          
          if (retryError) {
            throw new Error(`Session error on retry: ${retryError.message}`);
          }
          
          if (retrySession?.user) {
            console.log('GoogleCallback: User authenticated on retry:', retrySession.user.email);
            console.log('GoogleCallback: Retry session details:', {
              hasProviderToken: !!retrySession.provider_token,
              hasAccessToken: !!retrySession.access_token,
              provider: retrySession.user.app_metadata?.provider
            });
            
            // Update Google API client with tokens
            const googleClient = GoogleAPIClient.getInstance();
            
            if (retrySession.provider_token) {
              console.log('✅ GoogleCallback: Setting Google provider token (retry)');
              await googleClient.setAccessToken(retrySession.provider_token);
              setDetails('Authentication successful with Google provider token');
            } else if (retrySession.access_token) {
              console.log('⚠️ GoogleCallback: Only Supabase access token available (retry)');
              await googleClient.setAccessToken(retrySession.access_token);
              setDetails('Authentication successful but limited Gmail access');
            }
            
            setMockUser({
              id: retrySession.user.id,
              email: retrySession.user.email!,
              fullName: retrySession.user.user_metadata?.full_name || 
                       retrySession.user.user_metadata?.name || 
                       'Google User'
            });
            
            setStatus('success');
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
          } else {
            throw new Error('No user session found after OAuth callback processing');
          }
        }
      } catch (error) {
        console.error('Failed to handle Google OAuth callback:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Authentication failed');
        
        setTimeout(() => {
          navigate('/auth/login?error=callback-failed');
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate, setMockUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {status === 'processing' && 'Processing Google Login...'}
            {status === 'testing' && 'Testing Gmail Access...'}
            {status === 'success' && 'Login Successful!'}
            {status === 'error' && 'Login Failed'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {status === 'processing' && 'Please wait while we complete your authentication.'}
            {status === 'testing' && 'Verifying Gmail and Calendar permissions...'}
            {status === 'success' && 'Redirecting to your dashboard...'}
            {status === 'error' && errorMessage}
          </p>
          {details && (
            <p className="mt-2 text-xs text-gray-500">
              {details}
            </p>
          )}
          {(status === 'processing' || status === 'testing') && (
            <div className="mt-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          )}
          {status === 'success' && (
            <div className="mt-4">
              <div className="rounded-full h-12 w-12 bg-green-100 flex items-center justify-center mx-auto">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 