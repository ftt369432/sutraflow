import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Separator } from '../ui/Separator';
import googleAuthService from '../../services/auth/googleAuth';
import { GoogleAPIClient } from '../../services/google/GoogleAPIClient';
import { CalendarAccounts } from '../calendar/CalendarAccounts';
import { Calendar as CalendarType, calendarService } from '../../services/calendar/calendarService';

export function CalendarSettings() {
  const [calendars, setCalendars] = useState<CalendarType[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const googleClient = GoogleAPIClient.getInstance();

  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      try {
        // Initialize google auth service
        await googleAuthService.initialize();
        
        // Check if the user is signed in
        const signedIn = googleAuthService.isSignedIn();
        setIsConnected(signedIn);
        
        if (signedIn) {
          // Get user info using GoogleAPIClient
          const userInfo = await googleClient.request<{email: string, name: string}>({
            path: 'https://www.googleapis.com/oauth2/v2/userinfo',
            method: 'GET'
          });
          
          setUserEmail(userInfo.email);
          
          // Load calendars
          const calendarList = await calendarService.getCalendars();
          setCalendars(calendarList);
        }
      } catch (error) {
        console.error('Error checking calendar auth status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);

  const toggleCalendarEnabled = (calendarId: string, enabled: boolean) => {
    calendarService.updateCalendarEnabled(calendarId, enabled);
    setCalendars(prevCalendars => 
      prevCalendars.map(calendar => 
        calendar.id === calendarId 
          ? { ...calendar, enabled } 
          : calendar
      )
    );
  };
  
  const handleGoogleSignOut = async () => {
    try {
      await googleAuthService.signOut();
      setIsConnected(false);
      setUserEmail(null);
      setCalendars([]);
    } catch (error) {
      console.error('Failed to sign out from Google:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Calendar Settings</h2>
        <p className="text-muted-foreground">
          Manage your calendar integrations and preferences.
        </p>
      </div>
      
      <Tabs defaultValue="accounts">
        <TabsList className="mb-4">
          <TabsTrigger value="accounts">Calendar Accounts</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        
        <TabsContent value="accounts" className="space-y-4">
          <CalendarAccounts />
        </TabsContent>
        
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendar Display</CardTitle>
              <CardDescription>Configure how your calendar events appear.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Week starts on Monday</p>
                  <p className="text-sm text-muted-foreground">Display Monday as the first day of the week.</p>
                </div>
                <Switch />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">24-hour time</p>
                  <p className="text-sm text-muted-foreground">Use 24-hour format instead of AM/PM.</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show declined events</p>
                  <p className="text-sm text-muted-foreground">Display events you've declined.</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Configure how you receive event notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email notifications</p>
                  <p className="text-sm text-muted-foreground">Receive email notifications for upcoming events.</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Browser notifications</p>
                  <p className="text-sm text-muted-foreground">Receive browser notifications for upcoming events.</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Default reminder time</p>
                  <p className="text-sm text-muted-foreground">Set default reminder time for new events.</p>
                </div>
                <select className="p-2 border rounded bg-background">
                  <option>10 minutes before</option>
                  <option>15 minutes before</option>
                  <option>30 minutes before</option>
                  <option>1 hour before</option>
                  <option>1 day before</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 