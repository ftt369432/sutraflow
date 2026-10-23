/**
 * AuthCallback.tsx - Gemini-Only Authentication Callback
 * 
 * Handles authentication callbacks for the Gemini-only system.
 * No Google/Gmail integration - purely Supabase auth.
 * 
 * Following development guidelines:
 * - Beautiful, production-ready design
 * - React hooks for state management
 * - Centralized auth logic
 * - Clean error handling
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

type AuthStatus = 'processing' | 'success' | 'error';

export function AuthCallback() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<AuthStatus>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      console.log('🤖 Gemini-only Auth Callback: Processing authentication');

      // Check URL for errors (support both query params and hash)
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1)); // Remove #

      const error = urlParams.get('error') || hashParams.get('error');
      const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
      const type = urlParams.get('type') || hashParams.get('type');
      const next = urlParams.get('next') || hashParams.get('next');

      if (error) {
        console.error('❌ Auth error:', error, errorDescription);
        setStatus('error');
        setErrorMessage(`Authentication failed: ${errorDescription || error}`);

        setTimeout(() => {
          navigate('/auth/login?error=auth-failed');
        }, 3000);
        return;
      }

      // Handle email/Gmail account linking flow specifically
      if (next && next.includes('link-callback')) {
        const providerToken = hashParams.get('provider_token') || urlParams.get('provider_token');
        const providerRefreshToken = hashParams.get('provider_refresh_token') || urlParams.get('provider_refresh_token');

        if (providerToken) {
          try {
            console.log('🔗 AuthCallback: Linking Gmail account...');
            setStatus('processing');
            setErrorMessage('Linking your Gmail account...');

            const { error: linkError } = await supabase.functions.invoke('link-account', {
              body: { 
                provider_token: providerToken,
                provider_refresh_token: providerRefreshToken 
              },
            });

            if (linkError) {
              throw linkError;
            }

            toast.success('Account linked successfully!');
            setStatus('success');
            setTimeout(() => {
              navigate('/profile', { replace: true });
            }, 1500);
            return;
          } catch (err: any) {
            console.error('❌ Failed to link account:', err);
            setStatus('error');
            setErrorMessage(`Failed to link account: ${err.message}`);
            setTimeout(() => {
              navigate('/profile', { replace: true });
            }, 3000);
            return;
          }
        } else {
          console.error('❌ Could not find provider token to link account.');
          setStatus('error');
          setErrorMessage('Could not find provider token to link account.');
          setTimeout(() => {
            navigate('/profile', { replace: true });
          }, 3000);
          return;
        }
      }

      // Handle password recovery specifically
      if (type === 'recovery') {
        console.log('🔄 Password recovery flow detected');
        navigate('/reset-password');
        return;
      }

      // Wait for auth state to update
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (user) {
          console.log('✅ Gemini-only Auth: User authenticated successfully:', user.email);
          setStatus('success');

          setTimeout(() => {
            // If there's a specific destination, go there
            if (next) {
              navigate(next);
            } else {
              navigate('/dashboard');
            }
          }, 1500);
        } else {
          throw new Error('No user session found after callback');
        }
      } catch (error) {
        console.error('❌ Auth callback failed:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Authentication failed');

        setTimeout(() => {
          navigate('/auth/login?error=callback-failed');
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate, user]);

  const getStatusConfig = () => {
    switch (status) {
      case 'processing':
        return {
          title: 'Authenticating with Gemini AI',
          subtitle: 'Setting up your AI-powered workspace...',
          icon: <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />,
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-600'
        };
      case 'success':
        return {
          title: 'Welcome to Gemini AI!',
          subtitle: 'Redirecting to your dashboard...',
          icon: <CheckCircle className="h-8 w-8 text-green-600" />,
          bgColor: 'bg-green-50',
          textColor: 'text-green-600'
        };
      case 'error':
        return {
          title: 'Authentication Error',
          subtitle: errorMessage,
          icon: <XCircle className="h-8 w-8 text-red-600" />,
          bgColor: 'bg-red-50',
          textColor: 'text-red-600'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-100">
      <div className="max-w-md w-full mx-4">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Status Header */}
          <div className={`${config.bgColor} px-8 py-6 text-center`}>
            <div className="flex justify-center mb-4">
              {config.icon}
            </div>
            <h1 className={`text-xl font-bold ${config.textColor}`}>
              {config.title}
            </h1>
            <p className="text-gray-600 text-sm mt-2">
              {config.subtitle}
            </p>
          </div>

          {/* Content */}
          <div className="px-8 py-6">
            {status === 'processing' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">Verifying credentials...</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-100"></div>
                  <span className="text-sm text-gray-600">Initializing Gemini AI...</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-200"></div>
                  <span className="text-sm text-gray-600">Setting up workspace...</span>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-gray-600">
                  Your Gemini AI workspace is ready!
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <p className="text-gray-600 text-sm">
                  Redirecting back to login...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            🤖 Powered by Gemini AI • Gemini-Only Mode
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthCallback;
