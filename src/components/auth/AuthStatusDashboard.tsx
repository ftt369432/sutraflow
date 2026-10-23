import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { RefreshCw, CheckCircle, AlertCircle, Mail, Calendar } from 'lucide-react';
import { useSupabase } from '../../providers/SupabaseProvider';
import { GoogleReAuthButton } from './GoogleReAuthButton';

export const AuthStatusDashboard: React.FC = () => {
  const { session, user } = useSupabase();
  const [gmailStatus, setGmailStatus] = useState<'checking' | 'working' | 'failed' | 'no-token'>('checking');
  const [calendarStatus, setCalendarStatus] = useState<'checking' | 'working' | 'failed' | 'no-token'>('checking');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    checkServices();
  }, [session]);

  const checkServices = async () => {
    if (!session) {
      setGmailStatus('no-token');
      setCalendarStatus('no-token');
      return;
    }

    const token = session.provider_token || session.access_token;
    if (!token) {
      setGmailStatus('no-token');
      setCalendarStatus('no-token');
      return;
    }

    // Test Gmail API
    try {
      const gmailResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setGmailStatus(gmailResponse.ok ? 'working' : 'failed');
    } catch {
      setGmailStatus('failed');
    }

    // Test Calendar API
    try {
      const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setCalendarStatus(calendarResponse.ok ? 'working' : 'failed');
    } catch {
      setCalendarStatus('failed');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setGmailStatus('checking');
    setCalendarStatus('checking');
    await checkServices();
    setIsRefreshing(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checking':
        return <Badge variant="outline" className="bg-gray-50">Checking...</Badge>;
      case 'working':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Working</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'no-token':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">No Token</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const needsReAuth = !session?.provider_token || gmailStatus === 'failed' || calendarStatus === 'failed';

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Google Services Status</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Authentication Status */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Authentication</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span>User:</span>
              <span className="font-medium">{user?.email || 'Not logged in'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Session:</span>
              <Badge variant={session ? 'default' : 'destructive'}>
                {session ? 'Active' : 'None'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Provider Token:</span>
              <Badge variant={session?.provider_token ? 'default' : 'destructive'}>
                {session?.provider_token ? 'Available' : 'Missing'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Access Token:</span>
              <Badge variant={session?.access_token ? 'default' : 'destructive'}>
                {session?.access_token ? 'Available' : 'Missing'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Service Status */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Service Access</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>Gmail API</span>
              </div>
              {getStatusBadge(gmailStatus)}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Calendar API</span>
              </div>
              {getStatusBadge(calendarStatus)}
            </div>
          </div>
        </div>

        {/* Re-authentication if needed */}
        {needsReAuth && (
          <div className="pt-4 border-t">
            <GoogleReAuthButton
              showWarning={false}
              onSuccess={() => {
                console.log('Re-authentication successful');
                setTimeout(() => checkServices(), 1000);
              }}
            />
          </div>
        )}

        {/* Success message */}
        {session?.provider_token && gmailStatus === 'working' && calendarStatus === 'working' && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800">
              All Google services are working correctly!
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
