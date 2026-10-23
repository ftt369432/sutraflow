import React, { useState, useEffect } from 'react';
import { GoogleReAuthButton } from './GoogleReAuthButton';
import { useSupabase } from '../../providers/SupabaseProvider';
import { GoogleAPIClient } from '../../services/google/GoogleAPIClient';

interface GoogleAuthStatusProps {
  onAuthRestored?: () => void;
  className?: string;
}

export const GoogleAuthStatus: React.FC<GoogleAuthStatusProps> = ({
  onAuthRestored,
  className = ''
}) => {
  const { session, user } = useSupabase();
  const [needsReAuth, setNeedsReAuth] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkGoogleAuthStatus();
  }, [session, user]);

  const checkGoogleAuthStatus = async () => {
    if (!session || !user) {
      setIsChecking(false);
      return;
    }

    try {
      setIsChecking(true);

      // Check if we have a Google provider token
      const hasProviderToken = !!session.provider_token;
      
      if (!hasProviderToken) {
        console.log('❌ No Google provider token found in session');
        setNeedsReAuth(true);
        setIsChecking(false);
        return;
      }

      // Test if the token actually works by making a simple Gmail API call
      const googleClient = GoogleAPIClient.getInstance();
      
      try {
        // Try to get user profile - this is a lightweight test
        const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
          headers: {
            'Authorization': `Bearer ${session.provider_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 401) {
          console.log('❌ Google provider token is invalid or expired');
          setNeedsReAuth(true);
        } else if (response.ok) {
          console.log('✅ Google authentication is working');
          setNeedsReAuth(false);
        } else {
          console.log('⚠️ Unexpected response from Gmail API:', response.status);
          setNeedsReAuth(true);
        }
      } catch (error) {
        console.log('❌ Error testing Google authentication:', error);
        setNeedsReAuth(true);
      }
      
    } catch (error) {
      console.error('Error checking Google auth status:', error);
      setNeedsReAuth(true);
    } finally {
      setIsChecking(false);
    }
  };

  const handleAuthSuccess = () => {
    setNeedsReAuth(false);
    if (onAuthRestored) {
      onAuthRestored();
    }
  };

  // Don't show anything if we're still checking or if user isn't logged in
  if (isChecking || !user) {
    return null;
  }

  // Only show re-auth button if authentication is needed
  if (!needsReAuth) {
    return null;
  }

  return (
    <div className={`p-4 border border-yellow-200 rounded-lg bg-yellow-50 ${className}`}>
      <GoogleReAuthButton 
        onSuccess={handleAuthSuccess}
        showWarning={true}
        className="max-w-md mx-auto"
      />
    </div>
  );
};
