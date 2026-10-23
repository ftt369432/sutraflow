import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { GoogleAPIClient } from '../../services/google/GoogleAPIClient';
import { useAuth } from '../../contexts/AuthContext';
import { AlertCircle, CheckCircle, RefreshCw, LogOut, Settings } from 'lucide-react';
import { toast } from 'sonner';

export function AuthResetPanel() {
  const { user, signOut } = useAuth();
  const [isResetting, setIsResetting] = useState(false);
  const [googleAuthStatus, setGoogleAuthStatus] = useState<'checking' | 'valid' | 'invalid' | 'error'>('checking');

  const checkGoogleAuthStatus = async () => {
    setGoogleAuthStatus('checking');
    try {
      const googleClient = GoogleAPIClient.getInstance();
      const token = googleClient.getAccessToken();
      
      if (!token) {
        setGoogleAuthStatus('invalid');
        return;
      }

      // Try to make a simple API call to test the token
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setGoogleAuthStatus('valid');
      } else {
        setGoogleAuthStatus('invalid');
      }
    } catch (error) {
      console.error('Error checking Google auth status:', error);
      setGoogleAuthStatus('error');
    }
  };

  const handleResetGoogleAuth = async () => {
    setIsResetting(true);
    try {
      // Clear Google API client state
      const googleClient = GoogleAPIClient.getInstance();
      await googleClient.signOut();
      
      // Clear local storage
      localStorage.removeItem('google_auth_token');
      localStorage.removeItem('google_refresh_token');
      sessionStorage.clear();
      
      // Clear browser's Google auth cookies (best effort)
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      toast.success('Google authentication reset successfully');
      
      // Check status again
      await checkGoogleAuthStatus();
      
    } catch (error) {
      console.error('Error resetting Google auth:', error);
      toast.error('Failed to reset Google authentication');
    } finally {
      setIsResetting(false);
    }
  };

  const handleForceReauth = async () => {
    try {
      // First reset everything
      await handleResetGoogleAuth();
      
      // Then sign out from Supabase
      await signOut();
      
      toast.info('Please sign in again to re-authenticate with Google');
      
      // Redirect to login or refresh page
      window.location.href = '/auth/login';
      
    } catch (error) {
      console.error('Error forcing re-authentication:', error);
      toast.error('Failed to force re-authentication');
    }
  };

  const enableMockMode = () => {
    // Show instructions to enable mock mode
    toast.info('Add VITE_USE_MOCK=true to your .env file and restart the dev server');
  };

  React.useEffect(() => {
    checkGoogleAuthStatus();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'bg-green-100 text-green-800';
      case 'invalid': return 'bg-red-100 text-red-800';
      case 'error': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid': return <CheckCircle className="w-4 h-4" />;
      case 'invalid': 
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <RefreshCw className="w-4 h-4 animate-spin" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Google Authentication Reset
          </CardTitle>
          <CardDescription>
            Reset Google authentication when you get 401 errors or "Invalid Credentials"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          <div>
            <h4 className="font-medium mb-2">Current Status</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Supabase User:</span>
                <Badge variant={user ? 'default' : 'destructive'}>
                  {user ? `${user.email}` : 'Not signed in'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Google Auth:</span>
                <Badge className={getStatusColor(googleAuthStatus)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(googleAuthStatus)}
                    {googleAuthStatus === 'checking' ? 'Checking...' : 
                     googleAuthStatus === 'valid' ? 'Valid' :
                     googleAuthStatus === 'invalid' ? 'Invalid/Expired' : 'Error'}
                  </div>
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={checkGoogleAuthStatus}
              variant="outline"
              className="w-full"
              disabled={googleAuthStatus === 'checking'}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Recheck Google Auth Status
            </Button>

            <Button
              onClick={handleResetGoogleAuth}
              variant="outline"
              className="w-full"
              disabled={isResetting}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isResetting ? 'Resetting...' : 'Reset Google Authentication'}
            </Button>

            <Button
              onClick={handleForceReauth}
              className="w-full btn-genie-primary"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Force Complete Re-Authentication
            </Button>

            <Button
              onClick={enableMockMode}
              variant="outline"
              className="w-full"
            >
              Enable Mock Mode (Bypass Google APIs)
            </Button>
          </div>

          {/* Instructions */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border">
            <h5 className="font-medium text-blue-900 mb-2">Manual Fix Instructions:</h5>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Add <code>VITE_USE_MOCK=true</code> to your <code>.env</code> file</li>
              <li>Restart your development server</li>
              <li>Or click "Force Complete Re-Authentication" above</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 