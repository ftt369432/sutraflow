/**
 * TokenRefreshStatus Component
 * 
 * Displays the current status of token refresh operations
 * Useful for debugging and monitoring token health
 */

import React from 'react';
import { Shield, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { useTokenRefresh } from '../../hooks/useTokenRefresh';

interface TokenRefreshStatusProps {
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

export const TokenRefreshStatus: React.FC<TokenRefreshStatusProps> = ({
  showDetails = false,
  compact = false,
  className = ''
}) => {
  const tokenRefresh = useTokenRefresh();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'refreshed':
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'refreshed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Shield className="h-4 w-4 text-gray-600" />
        <div className="flex space-x-1">
          <Badge variant="outline" className={getStatusColor(tokenRefresh.supabaseTokenStatus)}>
            Auth {getStatusIcon(tokenRefresh.supabaseTokenStatus)}
          </Badge>
          <Badge variant="outline" className={getStatusColor(tokenRefresh.googleTokenStatus)}>
            Google {getStatusIcon(tokenRefresh.googleTokenStatus)}
          </Badge>
        </div>
        {tokenRefresh.isRefreshing && (
          <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
        )}
      </div>
    );
  }

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-sm font-medium">
          <Shield className="h-4 w-4 mr-2" />
          Token Status
          {tokenRefresh.isRefreshing && (
            <RefreshCw className="h-4 w-4 ml-2 text-blue-600 animate-spin" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Supabase Token Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Supabase Auth:</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon(tokenRefresh.supabaseTokenStatus)}
            <Badge variant="outline" className={getStatusColor(tokenRefresh.supabaseTokenStatus)}>
              {tokenRefresh.supabaseTokenStatus}
            </Badge>
          </div>
        </div>

        {/* Google Token Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Google OAuth:</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon(tokenRefresh.googleTokenStatus)}
            <Badge variant="outline" className={getStatusColor(tokenRefresh.googleTokenStatus)}>
              {tokenRefresh.googleTokenStatus}
            </Badge>
          </div>
        </div>

        {/* Refresh Stats */}
        {showDetails && (
          <>
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Refresh Count:</span>
                <span>{tokenRefresh.refreshCount}</span>
              </div>
              {tokenRefresh.lastRefresh && (
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Last Refresh:</span>
                  <span>{tokenRefresh.lastRefresh.toLocaleTimeString()}</span>
                </div>
              )}
            </div>

            {/* Manual Refresh Button */}
            <Button
              onClick={tokenRefresh.refreshAllTokens}
              disabled={tokenRefresh.isRefreshing}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {tokenRefresh.isRefreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Tokens
                </>
              )}
            </Button>

            {/* Error Display */}
            {tokenRefresh.errors.length > 0 && (
              <div className="border-t pt-3">
                <div className="text-xs font-medium text-red-600 mb-2">Recent Errors:</div>
                <div className="space-y-1">
                  {tokenRefresh.errors.slice(-3).map((error, index) => (
                    <div key={index} className="text-xs text-red-500 bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
