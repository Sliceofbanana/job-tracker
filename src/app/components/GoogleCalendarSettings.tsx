"use client";

import { useState, useEffect, useCallback } from 'react';
import { getGoogleCalendar } from '../utils/googleCalendar';

interface GoogleCalendarSettingsProps {
  className?: string;
  onConnectionChange?: (isConnected: boolean) => void;
}

interface CalendarEvent {
  summary: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
}

export default function GoogleCalendarSettings({ className = "", onConnectionChange }: GoogleCalendarSettingsProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);

  const calendar = getGoogleCalendar();

  const loadUpcomingEvents = useCallback(async () => {
    try {
      const events = await calendar.getUpcomingEvents(10);
      setUpcomingEvents(events);
    } catch (err) {
      console.error('Error loading events:', err);
    }
  }, [calendar]);

  const checkConnectionStatus = useCallback(() => {
    const connected = calendar.isUserSignedIn();
    setIsConnected(connected);
    onConnectionChange?.(connected);
    
    if (connected) {
      loadUpcomingEvents();
    }
  }, [calendar, onConnectionChange, loadUpcomingEvents]);

  useEffect(() => {
    checkConnectionStatus();
  }, [checkConnectionStatus]);

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await calendar.signIn();
      if (success) {
        setIsConnected(true);
        onConnectionChange?.(true);
        await loadUpcomingEvents();
      } else {
        setError('Failed to connect to Google Calendar. Please try again.');
      }
    } catch (err) {
      console.error('Calendar connection error:', err);
      setError('Error connecting to Google Calendar. Please check your permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await calendar.signOut();
      setIsConnected(false);
      setUpcomingEvents([]);
      onConnectionChange?.(false);
    } catch (err) {
      console.error('Calendar disconnection error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`p-4 sm:p-6 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-md border border-blue-400/30 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📅</span>
          <div>
            <h3 className="text-lg font-bold text-blue-300">Google Calendar Sync</h3>
            <p className="text-sm text-white/70">Sync your job applications with Google Calendar</p>
          </div>
        </div>
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-400/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {!isConnected ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-white/5">
              <h4 className="font-semibold text-white mb-2">Benefits of Google Calendar Sync:</h4>
              <ul className="text-sm text-white/70 space-y-1">
                <li>• Automatic calendar events for applications, interviews, and follow-ups</li>
                <li>• Smart reminders before important dates</li>
                <li>• Sync across all your devices</li>
                <li>• Never miss an interview or follow-up deadline</li>
                <li>• View job events alongside your personal calendar</li>
              </ul>
            </div>
            
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className={`w-full px-4 py-3 rounded-lg font-bold transition-all duration-200 ${
                isLoading
                  ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {isLoading ? 'Connecting...' : '🔗 Connect Google Calendar'}
            </button>
            
            <div className="text-xs text-white/60 text-center">
              <p>We only access your calendar to create and manage job-related events.</p>
              <p>You can disconnect at any time.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-green-500/20 border border-green-400/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-400">✅</span>
                <span className="font-semibold text-green-300">Connected to Google Calendar</span>
              </div>
              <p className="text-sm text-white/80">
                Your job applications will automatically create calendar events with reminders.
              </p>
            </div>

            {upcomingEvents.length > 0 && (
              <div className="p-4 rounded-lg bg-white/5">
                <h4 className="font-semibold text-white mb-3">Recent Job-Related Events:</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {upcomingEvents.slice(0, 5).map((event, index) => (
                    <div key={index} className="text-sm text-white/70 flex justify-between">
                      <span className="truncate flex-1">{event.summary}</span>
                      <span className="text-xs text-white/50 ml-2">
                        {event.start?.dateTime 
                          ? new Date(event.start.dateTime).toLocaleDateString()
                          : event.start?.date 
                            ? new Date(event.start.date).toLocaleDateString()
                            : 'No date'
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={loadUpcomingEvents}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600/50 hover:bg-blue-600/70 text-white transition-colors text-sm"
              >
                🔄 Refresh Events
              </button>
              <button
                onClick={handleDisconnect}
                disabled={isLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600/50 hover:bg-red-600/70 text-white transition-colors text-sm"
              >
                {isLoading ? 'Disconnecting...' : '🔌 Disconnect'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
