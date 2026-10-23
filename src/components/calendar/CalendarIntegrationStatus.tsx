import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { calendarService } from '../../services/calendar/calendarService';
import googleAuthService from '../../services/auth/googleAuth';

interface CalendarIntegrationStatusProps {
  className?: string;
}

interface IntegrationStatus {
  isAuthenticated: boolean;
  hasCalendarAccess: boolean;
  calendars: any[];
  lastSync: Date | null;
  error: string | null;
}

const CalendarIntegrationStatus: React.FC<CalendarIntegrationStatusProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<IntegrationStatus>({
    isAuthenticated: false,
    hasCalendarAccess: false,
    calendars: [],
    lastSync: null,
    error: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkIntegrationStatus = async () => {
    try {
      setIsLoading(true);
      
      // Check authentication
      const isAuth = googleAuthService.isAuthenticated();
      
      if (!isAuth) {
        setStatus({
          isAuthenticated: false,
          hasCalendarAccess: false,
          calendars: [],
          lastSync: null,
          error: 'Not authenticated with Google'
        });
        return;
      }

      // Check calendar access
      try {
        const calendars = await calendarService.fetchCalendars();
        setStatus({
          isAuthenticated: true,
          hasCalendarAccess: true,
          calendars: calendars || [],
          lastSync: new Date(),
          error: null
        });
      } catch (error) {
        console.error('Calendar access error:', error);
        setStatus({
          isAuthenticated: true,
          hasCalendarAccess: false,
          calendars: [],
          lastSync: null,
          error: error instanceof Error ? error.message : 'Calendar access failed'
        });
      }
    } catch (error) {
      console.error('Integration status check error:', error);
      setStatus({
        isAuthenticated: false,
        hasCalendarAccess: false,
        calendars: [],
        lastSync: null,
        error: error instanceof Error ? error.message : 'Status check failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await checkIntegrationStatus();
    setIsRefreshing(false);
  };

  const handleReauth = async () => {
    try {
      setIsRefreshing(true);
      await googleAuthService.signIn();
      await checkIntegrationStatus();
    } catch (error) {
      console.error('Re-authentication failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkIntegrationStatus();
  }, []);

  if (isLoading) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg ${className}`}>
        <div className="flex items-center">
          <RefreshCw className="animate-spin mr-2 text-blue-500 w-4 h-4" />
          <span>Checking calendar integration status...</span>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (!status.isAuthenticated) {
      return <XCircle className="text-red-500 w-5 h-5" />;
    }
    if (!status.hasCalendarAccess) {
      return <AlertTriangle className="text-yellow-500 w-5 h-5" />;
    }
    return <CheckCircle className="text-green-500 w-5 h-5" />;
  };

  const getStatusText = () => {
    if (!status.isAuthenticated) {
      return 'Not authenticated';
    }
    if (!status.hasCalendarAccess) {
      return 'Authentication needed';
    }
    return 'Connected';
  };

  const getStatusColor = () => {
    if (!status.isAuthenticated) {
      return 'bg-red-50 border-red-200';
    }
    if (!status.hasCalendarAccess) {
      return 'bg-yellow-50 border-yellow-200';
    }
    return 'bg-green-50 border-green-200';
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${getStatusColor()} ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          {getStatusIcon()}
          <h3 className="ml-2 font-semibold">Google Calendar Integration</h3>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
          title="Refresh status"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Status:</span>
          <span className={`text-sm font-medium ${
            status.hasCalendarAccess ? 'text-green-600' : 
            status.isAuthenticated ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {getStatusText()}
          </span>
        </div>

        {status.isAuthenticated && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Calendars:</span>
            <span className="text-sm">{status.calendars.length} found</span>
          </div>
        )}

        {status.lastSync && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Last sync:</span>
            <span className="text-sm">{status.lastSync.toLocaleTimeString()}</span>
          </div>
        )}

        {status.error && (
          <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700">
            {status.error}
          </div>
        )}

        {(!status.isAuthenticated || !status.hasCalendarAccess) && (
          <button
            onClick={handleReauth}
            disabled={isRefreshing}
            className="w-full mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
          >
            {isRefreshing ? 'Connecting...' : 'Connect Calendar'}
          </button>
        )}
      </div>
    </div>
  );
};

export { CalendarIntegrationStatus };
export default CalendarIntegrationStatus;