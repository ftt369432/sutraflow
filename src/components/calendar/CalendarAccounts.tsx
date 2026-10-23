import React, { useState, useEffect } from 'react';
import { CheckCircle, PlusCircle, MoreHorizontal, Trash2, ExternalLink, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '../ui/DropdownMenu';
import { Badge } from '../ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { ScrollArea } from '../ui/ScrollArea';
import { toast } from 'sonner';
import googleAuthService from '../../services/auth/googleAuth';
import { GoogleAPIClient } from '../../services/google/GoogleAPIClient';
import { GoogleCalendarAuth } from './GoogleCalendarAuth';

// Sample calendar accounts for demonstration when no real accounts are available
const DEMO_ACCOUNTS = [
  { 
    id: '1', 
    email: 'john.doe@gmail.com', 
    provider: 'Google', 
    type: 'primary',
    calendars: [
      { id: 'c1', name: 'Personal', color: '#4285F4', enabled: true },
      { id: 'c2', name: 'Work', color: '#EA4335', enabled: true },
      { id: 'c3', name: 'Family', color: '#34A853', enabled: false },
      { id: 'c4', name: 'US Holidays', color: '#FBBC05', enabled: true },
    ] 
  },
  { 
    id: '2', 
    email: 'john.doe@outlook.com', 
    provider: 'Outlook', 
    type: 'secondary',
    calendars: [
      { id: 'c5', name: 'Default', color: '#0078D4', enabled: true },
      { id: 'c6', name: 'Side Project', color: '#7719AA', enabled: false },
    ] 
  },
];

// Add interface for the calendar object
interface Calendar {
  id: string;
  name: string;
  color: string;
  enabled: boolean;
}

// Add interface for the account object
interface CalendarAccount {
  id: string;
  email: string;
  name?: string;
  provider: string;
  avatar?: string;
  type?: string;
  calendars?: Calendar[];
}

interface CalendarAccountsProps {
  className?: string;
}

export function CalendarAccounts({ className }: CalendarAccountsProps) {
  const [accounts, setAccounts] = useState<CalendarAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const googleClient = GoogleAPIClient.getInstance();

  // Load connected accounts
  useEffect(() => {
    const loadAccounts = async () => {
      setIsLoading(true);
      try {
        if (googleAuthService.isSignedIn()) {
          // Get user info using GoogleAPIClient
          const userInfo = await googleClient.request<{email: string, name: string}>({
            path: 'https://www.googleapis.com/oauth2/v2/userinfo',
            method: 'GET'
          });
          
          if (userInfo && userInfo.email) {
            // Create account object
            const account = {
              id: '1', // Simple ID for single account
              email: userInfo.email,
              name: userInfo.name || userInfo.email.split('@')[0],
              provider: 'google',
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo.email.charAt(0))}&background=random`
            };
            
            setAccounts([account]);
          }
        } else {
          setAccounts([]);
        }
      } catch (error) {
        console.error('Error loading accounts:', error);
        toast.error('Failed to load accounts');
        setAccounts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAccounts();
  }, []);

  const handleCalendarToggle = (calendar: Calendar) => {
    setAccounts(accounts.map(account => {
      return {
        ...account,
        calendars: account.calendars?.map(cal => 
          cal.id === calendar.id ? { ...cal, enabled: !cal.enabled } : cal
        ) || []
      };
    }));
  };

  const handleGoogleAuthSuccess = async () => {
    setIsLoading(true);
    try {
      // Get user info using GoogleAPIClient
      const userInfo = await googleClient.request<{email: string, name: string}>({
        path: 'https://www.googleapis.com/oauth2/v2/userinfo',
        method: 'GET'
      });
      
      if (userInfo && userInfo.email) {
        // Create account object
        const account = {
          id: '1', // Simple ID for single account
          email: userInfo.email,
          name: userInfo.name || userInfo.email.split('@')[0],
          provider: 'google',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo.email.charAt(0))}&background=random`
        };
        
        setAccounts([account]);
        toast.success("Google Calendar connected successfully");
      }
    } catch (error) {
      console.error('Error loading account after authentication:', error);
      toast.error('Failed to connect Google Calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'Google':
        return <svg viewBox="0 0 24 24" className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>;
      case 'Outlook':
        return <svg viewBox="0 0 24 24" className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 7.387v10.478c0 .23-.152.422-.352.452l-8.7 1.603v-13.91l8.7 1.374c.2.033.352.222.352.453v-.001z" fill="#0078D4" />
          <path d="M8.445 7.068v10.215l-.013.003v.015h.013v.675H24V7.068h-15.555zM0 6.42v10.471l8.445 1.678v-13.9L0 6.42z" fill="#0078D4" />
          <path d="M8.445 17.068h-8.445v-10H0V19.9l8.445-2.832v.001z" fill="#0078D4" />
        </svg>;
      default:
        return <Mail className="h-4 w-4 mr-2" />;
    }
  };

  const handleRemoveCalendar = (calendar: CalendarAccount) => {
    const isGoogle = calendar.provider.toLowerCase() === 'google';
    if (isGoogle) {
      // Handle Google calendar disconnection
      try {
        googleAuthService.signOut();
        toast.success("Google Calendar disconnected successfully");
        setAccounts(accounts.filter(a => a.id !== calendar.id));
      } catch (error) {
        console.error('Failed to disconnect Google Calendar:', error);
        toast.error("Failed to disconnect Google Calendar");
      }
    } else {
      // Just remove from the list
      setAccounts(accounts.filter(a => a.id !== calendar.id));
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Calendar Accounts</h3>
      </div>

      {accounts.map(account => (
        <Card key={account.id} className="overflow-hidden">
          <div className="bg-muted p-3 flex justify-between items-center">
            <div className="flex items-center">
              {getProviderIcon(account.provider)}
              <div>
                <div className="font-medium text-sm">{account.email}</div>
                <div className="text-xs text-muted-foreground">{account.provider}</div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in {account.provider}
                </DropdownMenuItem>
                {account.provider === 'Google' && (
                  <DropdownMenuItem className="text-destructive" onClick={() => googleAuthService.signOut().then(() => window.location.reload())}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Disconnect Account
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardContent className="p-3">
            <div className="space-y-2">
              {account.type === 'primary' && (
                <Badge className="mb-2 bg-blue-500">Primary</Badge>
              )}
              
              {account.calendars?.map(calendar => (
                <div key={calendar.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="h-3 w-3 rounded-full mr-2" 
                      style={{ backgroundColor: calendar.color }}
                    />
                    <span className="text-sm">{calendar.name}</span>
                  </div>
                  <Switch 
                    checked={calendar.enabled}
                    onCheckedChange={(checked) => handleCalendarToggle(calendar)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {!isLoading && accounts.length === 0 && (
        <div className="mt-6">
          <GoogleCalendarAuth onSuccess={handleGoogleAuthSuccess} />
        </div>
      )}
    </div>
  );
} 