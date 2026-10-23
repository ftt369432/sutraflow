import React, { useState, useEffect, useCallback } from 'react';
import { emailService } from '../../services/email';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { useEmail } from '../../contexts/EmailContext';
import { useNavigate } from 'react-router-dom';
import { googleApiClient } from '../../services/google/GoogleAPIClient';
import { Alert, AlertDescription } from '../ui/Alert';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export function EmailServiceDirect() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [accountCount, setAccountCount] = useState(0);
  const [connectionStep, setConnectionStep] = useState<'idle' | 'initializing' | 'authenticating' | 'connecting'>('idle');
  const [retryCount, setRetryCount] = useState(0);
  const { accounts, refreshAccounts } = useEmail();
  const navigate = useNavigate();

  useEffect(() => {
    setAccountCount(accounts.length);
  }, [accounts]);

  const resetState = useCallback(() => {
    setStatus('idle');
    setErrorMessage(null);
    setConnectionStep('idle');
    setRetryCount(0);
  }, []);

  const handleConnectGmail = async () => {
    if (status === 'loading') return; // Prevent multiple clicks
    
    setStatus('loading');
    setErrorMessage(null);
    setConnectionStep('initializing');
    
    try {
      // Step 1: Initialize Google API client
      console.log('Initializing Google API client...');
      await googleApiClient.initialize(() => {});
      setConnectionStep('authenticating');
      
      // Step 2: Sign in with Google
      console.log('Signing in with Google...');
      await googleApiClient.signIn();
      
      if (!googleApiClient.isSignedIn()) {
        throw new Error('Failed to sign in with Google. Please try again.');
      }
      
      // Step 3: Get user info and connect account
      setConnectionStep('connecting');
      console.log('Getting user info...');
      const userInfo = await googleApiClient.getUserInfo();
      if (!userInfo || !userInfo.email) {
        throw new Error('Failed to get user email from Google. Please try again.');
      }
      
      // Get accounts to check if this one already exists
      console.log('Checking existing accounts...');
      const existingAccounts = await emailService.getAccounts();
      const accountExists = existingAccounts.some(acc => acc.email === userInfo.email);
      
      if (!accountExists) {
        console.log('Adding new Gmail account...');
        // Add the account to our system
        await emailService.getAccounts(); // This will create the account if it doesn't exist
      }
      
      // Refresh accounts list
      await refreshAccounts();
      
      setStatus('success');
      setConnectionStep('idle');
      setTimeout(() => {
        navigate('/email');
      }, 1500);
    } catch (error) {
      console.error('Failed to connect Gmail:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to connect Google account';
      setErrorMessage(errorMsg);
      setStatus('error');
      setConnectionStep('idle');
      
      // Increment retry count for certain errors
      if (errorMsg.includes('token') || errorMsg.includes('authentication')) {
        setRetryCount(prev => prev + 1);
      }
    }
  };

  const handleRetry = async () => {
    resetState();
    await handleConnectGmail();
  };

  const getConnectionStatusMessage = () => {
    switch (connectionStep) {
      case 'initializing':
        return 'Initializing Google services...';
      case 'authenticating':
        return 'Authenticating with Google...';
      case 'connecting':
        return 'Connecting your Gmail account...';
      default:
        return null;
    }
  };

  const getErrorAction = () => {
    if (errorMessage?.toLowerCase().includes('token') || 
        errorMessage?.toLowerCase().includes('authentication')) {
      return (
        <Button
          onClick={handleRetry}
          variant="outline"
          size="sm"
          className="mt-2"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry Connection
        </Button>
      );
    }
    return null;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Email Service</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Connected Accounts:</span>
          <span>{accountCount}</span>
        </div>
        
        {status === 'error' && errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errorMessage}
              {getErrorAction()}
            </AlertDescription>
          </Alert>
        )}
        
        {status === 'success' && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>Account connected successfully! Redirecting to inbox...</AlertDescription>
          </Alert>
        )}
        
        {status === 'loading' && connectionStep !== 'idle' && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Spinner className="h-4 w-4" />
            <span>{getConnectionStatusMessage()}</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end space-x-3">
        <Button
          onClick={() => navigate('/email')}
          variant="outline"
          disabled={accountCount === 0}
        >
          Open Inbox
        </Button>
        
        <Button 
          onClick={handleConnectGmail}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              {connectionStep === 'idle' ? 'Connecting...' : 'Please wait...'}
            </>
          ) : (
            'Connect Gmail'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 