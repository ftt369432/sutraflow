import { useEffect, useState } from 'react';
import { GoogleAPIClient } from '../services/google/GoogleAPIClient';
import { Calendar, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime: string };
  end: { dateTime: string };
}

export function GoogleCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const googleService = new GoogleAPIClient();

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const calendarEvents = await googleService.getCalendarEvents('primary', { maxResults: 10 });
      setEvents(calendarEvents.items);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load calendar events');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      await googleService.signIn();
      setIsSignedIn(true);
      await loadEvents();
    } catch (error) {
      setError('Failed to sign in');
    }
  };

  const handleSignOut = async () => {
    try {
      await googleService.signOut();
      setIsSignedIn(false);
      setEvents([]);
    } catch (error) {
      setError('Failed to sign out');
    }
  };

  useEffect(() => {
    const initializeGoogle = async () => {
      try {
        await googleService.initialize();
        const signedIn = await googleService.isSignedIn();
        setIsSignedIn(signedIn);
        if (signedIn) {
          await loadEvents();
        }
      } catch (error) {
        setError('Failed to initialize Google Calendar');
      } finally {
        setIsLoading(false);
      }
    };

    initializeGoogle();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Calendar className="w-12 h-12 text-gray-400" />
        <h2 className="text-xl font-semibold">Connect to Google Calendar</h2>
        <button
          onClick={handleSignIn}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Calendar Events</h2>
        <button
          onClick={handleSignOut}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
        >
          Sign Out
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No upcoming events
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="p-4 border rounded-lg hover:bg-gray-50">
              <h3 className="font-medium">{event.summary}</h3>
              <p className="text-sm text-gray-500">
                {new Date(event.start.dateTime).toLocaleString()} - 
                {new Date(event.end.dateTime).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 