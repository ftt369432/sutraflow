import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, RefreshCw } from 'lucide-react';
import { googleTokenManager } from '../services/GoogleTokenManager';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface GoogleAuthNotificationProps {
  onDismiss?: () => void;
  className?: string;
}

export const GoogleAuthNotification: React.FC<GoogleAuthNotificationProps> = ({
  onDismiss,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<{
    hasToken: boolean;
    isValid: boolean;
    expiresIn?: number;
  }>({ hasToken: false, isValid: false });

  useEffect(() => {
    const checkTokenStatus = async () => {
      const info = googleTokenManager.getTokenInfo();
      setTokenInfo(info);
      
      // 🔄 SILENT AUTO-REFRESH: Automatically refresh tokens instead of showing notifications
      if (!info.hasToken || !info.isValid) {
        console.log('🔄 Gmail token needs refresh, attempting silent refresh...');
        
        try {
          // Attempt silent token refresh
          const refreshedToken = await googleTokenManager.refreshToken();
          if (refreshedToken) {
            // Recheck status after refresh
            const updatedInfo = googleTokenManager.getTokenInfo();
            setTokenInfo(updatedInfo);
            console.log('✅ Gmail token silently refreshed successfully');
            
            // Only show notification if silent refresh also failed
            setIsVisible(!updatedInfo.hasToken || !updatedInfo.isValid);
          } else {
            // Silent refresh failed, but don't show persistent notification
            // Only show for critical failures that need user action
            setIsVisible(false);
            console.log('⚠️ Silent Gmail refresh failed, but notification suppressed');
          }
        } catch (error) {
          console.error('❌ Silent Gmail refresh error:', error);
          // Only show notification for critical errors that definitely need user action
          setIsVisible(false);
        }
      } else {
        // Token is valid, hide any existing notifications
        setIsVisible(false);
      }
    };

    // Initial check
    checkTokenStatus();

    // Check every 60 seconds with auto-refresh
    const interval = setInterval(checkTokenStatus, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleReAuthenticate = async () => {
    setIsLoading(true);
    try {
      await googleTokenManager.forceReAuthentication();
    } catch (error) {
      console.error('[GoogleAuthNotification] Re-authentication failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshToken = async () => {
    setIsLoading(true);
    try {
      const token = await googleTokenManager.refreshToken();
      if (token) {
        // Recheck status after refresh
        const info = googleTokenManager.getTokenInfo();
        setTokenInfo(info);
        if (info.hasToken && info.isValid) {
          setIsVisible(false);
        }
      }
    } catch (error) {
      console.error('[GoogleAuthNotification] Token refresh failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!isVisible) {
    return null;
  }

  const getNotificationContent = () => {
    if (!tokenInfo.hasToken) {
      return {
        title: 'Gmail Connection Required',
        message: 'Connect your Gmail account to access email features.',
        action: 'Connect Gmail',
        handler: handleReAuthenticate,
        severity: 'high'
      };
    } else if (!tokenInfo.isValid) {
      return {
        title: 'Gmail Connection Expired',
        message: 'Your Gmail connection has expired. Refresh or reconnect to continue.',
        action: 'Refresh Connection',
        handler: handleRefreshToken,
        severity: 'medium'
      };
    } else {
      return null;
    }
  };

  const content = getNotificationContent();
  if (!content) return null;

  return (
    <Card className={`
      fixed top-4 right-4 z-50 w-96 shadow-lg border-l-4
      ${content.severity === 'high' 
        ? 'border-l-red-500 bg-red-50 border-red-200' 
        : 'border-l-orange-500 bg-orange-50 border-orange-200'
      }
      ${className}
    `}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={`
              mt-0.5 p-1 rounded-full
              ${content.severity === 'high' 
                ? 'bg-red-100 text-red-600' 
                : 'bg-orange-100 text-orange-600'
              }
            `}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            
            <div className="flex-1">
              <h3 className={`
                font-semibold text-sm
                ${content.severity === 'high' ? 'text-red-800' : 'text-orange-800'}
              `}>
                {content.title}
              </h3>
              <p className={`
                text-sm mt-1
                ${content.severity === 'high' ? 'text-red-700' : 'text-orange-700'}
              `}>
                {content.message}
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className={`
              p-1 rounded hover:bg-opacity-50
              ${content.severity === 'high' 
                ? 'text-red-500 hover:bg-red-200' 
                : 'text-orange-500 hover:bg-orange-200'
              }
            `}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 flex space-x-2">
          <Button
            onClick={content.handler}
            disabled={isLoading}
            size="sm"
            className={`
              ${content.severity === 'high'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
              }
            `}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                Processing...
              </>
            ) : (
              content.action
            )}
          </Button>

          {tokenInfo.hasToken && !tokenInfo.isValid && (
            <Button
              onClick={handleReAuthenticate}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              Reconnect Instead
            </Button>
          )}
        </div>

        {tokenInfo.expiresIn !== undefined && tokenInfo.expiresIn > 0 && (
          <div className="mt-2 text-xs text-gray-600">
            Current connection expires in: {Math.floor(tokenInfo.expiresIn / 60)} minutes
          </div>
        )}
      </div>
    </Card>
  );
};

export default GoogleAuthNotification;
