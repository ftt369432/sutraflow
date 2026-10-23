import React, { useState, useEffect } from 'react';
import { googleTokenManager } from '../services/GoogleTokenManager';
import { errorRecoverySystem } from '../services/ErrorRecoverySystem';

interface GoogleAuthStatusProps {
  className?: string;
  showDetails?: boolean;
  onAuthChange?: (isAuthenticated: boolean) => void;
}

export const GoogleAuthStatus: React.FC<GoogleAuthStatusProps> = ({
  className = '',
  showDetails = false,
  onAuthChange
}) => {
  const [tokenInfo, setTokenInfo] = useState<{
    hasToken: boolean;
    isValid: boolean;
    expiresIn?: number;
  }>({ hasToken: false, isValid: false });
  const [isLoading, setIsLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const checkTokenStatus = async () => {
    try {
      const info = googleTokenManager.getTokenInfo();
      setTokenInfo(info);
      setLastCheck(new Date());
      
      // 🔄 SILENT AUTO-REFRESH: Attempt to refresh invalid tokens automatically
      if (info.hasToken && !info.isValid) {
        console.log('🔄 [GoogleAuthStatus] Token invalid, attempting silent refresh...');
        try {
          const refreshedToken = await googleTokenManager.refreshToken();
          if (refreshedToken) {
            const updatedInfo = googleTokenManager.getTokenInfo();
            setTokenInfo(updatedInfo);
            console.log('✅ [GoogleAuthStatus] Token silently refreshed');
            
            if (onAuthChange) {
              onAuthChange(updatedInfo.hasToken && updatedInfo.isValid);
            }
            return;
          }
        } catch (refreshError) {
          console.log('⚠️ [GoogleAuthStatus] Silent refresh failed, but continuing normally');
        }
      }
      
      if (onAuthChange) {
        onAuthChange(info.hasToken && info.isValid);
      }
    } catch (error) {
      console.error('[GoogleAuthStatus] Error checking token status:', error);
    }
  };

  useEffect(() => {
    checkTokenStatus();
    
    // Check token status every 30 seconds
    const interval = setInterval(checkTokenStatus, 30000);
    
    return () => clearInterval(interval);
  }, [onAuthChange]);

  const handleReAuthenticate = async () => {
    setIsLoading(true);
    try {
      console.log('[GoogleAuthStatus] Starting re-authentication process');
      await googleTokenManager.forceReAuthentication();
    } catch (error) {
      console.error('[GoogleAuthStatus] Re-authentication failed:', error);
      errorRecoverySystem.captureAuthError(
        'Manual Google re-authentication failed',
        { error: error instanceof Error ? error.message : String(error) }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshToken = async () => {
    setIsLoading(true);
    try {
      console.log('[GoogleAuthStatus] Refreshing token');
      const token = await googleTokenManager.refreshToken();
      if (token) {
        await checkTokenStatus();
        console.log('[GoogleAuthStatus] Token refreshed successfully');
      } else {
        console.warn('[GoogleAuthStatus] Token refresh returned null');
      }
    } catch (error) {
      console.error('[GoogleAuthStatus] Token refresh failed:', error);
      errorRecoverySystem.captureAuthError(
        'Manual Google token refresh failed',
        { error: error instanceof Error ? error.message : String(error) }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!tokenInfo.hasToken) return 'text-blue-600 bg-blue-50 border-blue-200'; // Blue instead of red
    if (!tokenInfo.isValid) return 'text-blue-600 bg-blue-50 border-blue-200'; // Blue instead of orange
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getStatusText = () => {
    if (!tokenInfo.hasToken) return 'Ready to Connect'; // Less prominent than error message
    if (!tokenInfo.isValid) return 'Reconnecting...'; // Show as process instead of error
    return 'Connected';
  };

  const getStatusIcon = () => {
    if (!tokenInfo.hasToken) return '🔌'; // Connection icon instead of error
    if (!tokenInfo.isValid) return '🔄'; // Refresh icon instead of warning
    return '✅';
  };

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return 'Expired';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return '<1m';
    }
  };

  return (
    <div className={`google-auth-status ${className}`}>
      <div className={`
        flex items-center space-x-3 px-4 py-3 rounded-lg border
        ${getStatusColor()}
      `}>
        <span className="text-lg">{getStatusIcon()}</span>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium">Gmail Connection</span>
            <span className="text-sm">({getStatusText()})</span>
          </div>
          
          {showDetails && (
            <div className="text-xs mt-1 space-y-1">
              {tokenInfo.hasToken && tokenInfo.expiresIn !== undefined && (
                <div>
                  Expires in: {formatTimeRemaining(tokenInfo.expiresIn)}
                </div>
              )}
              <div className="text-gray-500">
                Last checked: {lastCheck.toLocaleTimeString()}
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          {tokenInfo.hasToken && !tokenInfo.isValid && (
            <button
              onClick={handleRefreshToken}
              disabled={isLoading}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          )}
          
          <button
            onClick={handleReAuthenticate}
            disabled={isLoading}
            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
          >
            {isLoading ? 'Connecting...' : 'Connect Gmail'}
          </button>
        </div>
      </div>

      {showDetails && !tokenInfo.isValid && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <div className="font-medium text-yellow-800 mb-1">
            ⚠️ Gmail Access Required
          </div>
          <div className="text-yellow-700">
            Your Gmail connection has expired. Click "Connect Gmail" to re-authenticate 
            and restore email functionality. This will redirect you to Google's authorization page.
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleAuthStatus;
