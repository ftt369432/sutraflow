import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { AlertCircle, RefreshCw, Mail, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/Alert';

interface GoogleReAuthButtonProps {
  onSuccess?: () => void;
  showWarning?: boolean;
  className?: string;
}

export const GoogleReAuthButton: React.FC<GoogleReAuthButtonProps> = ({
  onSuccess,
  showWarning = true,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReAuth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Initiating Google re-authentication...');
      
      // Get current URL for redirect
      const currentUrl = window.location.origin;
      const redirectUrl = `${currentUrl}/auth/callback`;
      
      console.log('🔄 Redirect URL:', redirectUrl);

      // Sign in with Google OAuth to get fresh provider token
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          scopes: [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
          ].join(' '),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent', // Force consent to ensure fresh tokens
            include_granted_scopes: 'true'
          }
        }
      });

      if (error) {
        throw error;
      }

      console.log('✅ OAuth flow initiated successfully');
      
      // The user will be redirected to Google OAuth
      // After successful auth, they'll be redirected back to our callback
      
    } catch (err: any) {
      console.error('❌ Re-authentication failed:', err);
      setError(err.message || 'Failed to initiate re-authentication');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {showWarning && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="space-y-2">
              <p className="font-medium">Gmail/Calendar Authentication Required</p>
              <p className="text-sm">
                Your Google provider token has expired. Re-authenticate to restore access to:
              </p>
              <ul className="text-sm space-y-1 mt-2">
                <li className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  Gmail email reading and auto-tagging
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Calendar integration and reminders
                </li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleReAuth}
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isLoading ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Redirecting to Google...
          </>
        ) : (
          <>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Re-authenticate with Google
          </>
        )}
      </Button>
      
      <p className="text-xs text-gray-500 text-center">
        You'll be redirected to Google to grant permissions, then returned to the app.
      </p>
    </div>
  );
};
