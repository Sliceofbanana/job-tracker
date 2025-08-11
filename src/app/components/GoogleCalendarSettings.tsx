"use client";

import { useState, useEffect, useCallback } from 'react';
import { getGoogleCalendar } from '../utils/googleCalendar';

interface GoogleCalendarSettingsProps {
  className?: string;
  onConnectionChange?: (isConnected: boolean) => void;
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
}

interface ErrorWithCode {
  error?: string;
  message?: string;
}

export default function GoogleCalendarSettings({ className = "", onConnectionChange }: GoogleCalendarSettingsProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [servicesAvailable, setServicesAvailable] = useState<boolean | null>(null);

  const calendar = getGoogleCalendar();

  const loadUpcomingEvents = useCallback(async () => {
    try {
      const events = await calendar.getJobTrackerEvents();
      setUpcomingEvents(events);
    } catch (err) {
      console.error('Error loading events:', err);
      setUpcomingEvents([]);
    }
  }, [calendar]);

  const checkConnectionStatus = useCallback(() => {
    const connected = calendar.isUserSignedIn();
    setIsConnected(connected);
    onConnectionChange?.(connected);

    const available = calendar.isGoogleServicesAvailable();
    setServicesAvailable(available);

    if (connected) {
      loadUpcomingEvents();
    }
  }, [calendar, onConnectionChange, loadUpcomingEvents]);

  // Try auto sign-in if not connected
  const autoConnect = useCallback(async () => {
    if (!calendar.isGoogleServicesAvailable()) {
      setServicesAvailable(false);
      setError(calendar.getServiceAvailabilityMessage());
      return;
    }

    if (!calendar.isUserSignedIn()) {
      try {
        setIsLoading(true);
        const success = await calendar.signIn();
        if (success) {
          setIsConnected(true);
          onConnectionChange?.(true);
          await loadUpcomingEvents();
        } else {
          setError('Failed to connect to Google Calendar automatically.');
        }
      } catch (err) {
        const e = err as ErrorWithCode;
        console.error('Calendar auto-connect error:', err);
        setError(e.message || 'Error connecting to Google Calendar.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsConnected(true);
      await loadUpcomingEvents();
    }
  }, [calendar, loadUpcomingEvents, onConnectionChange]);

  useEffect(() => {
    checkConnectionStatus();
    autoConnect();
  }, [checkConnectionStatus, autoConnect]);

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
            <p className="text-sm text-white/70">Job interviews sync automatically</p>
          </div>
        </div>
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-400/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {servicesAvailable === false && !error && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-500/20 border border-yellow-400/30 text-yellow-300 text-sm">
          ⚠️ Google Calendar services are currently unavailable. Automatic sync disabled.
        </div>
      )}

      {isConnected ? (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-green-500/20 border border-green-400/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-400">✅</span>
              <span className="font-semibold text-green-300">Connected to Google Calendar</span>
            </div>
            <p className="text-sm text-white/80">
              Job interviews are synced automatically.
            </p>
          </div>

          {upcomingEvents.length > 0 && (
            <div className="p-4 rounded-lg bg-white/5">
              <h4 className="font-semibold text-white mb-3">Recent Job-Related Events:</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {upcomingEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="text-sm text-white/70">
                    <span className="truncate">{event.summary}</span>
                    {event.description && (
                      <p className="text-xs text-white/50 mt-1 truncate">{event.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={loadUpcomingEvents}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600/50 hover:bg-blue-600/70 text-white text-sm"
            >
              🔄 Refresh
            </button>
            <button
              onClick={handleDisconnect}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg bg-red-600/50 hover:bg-red-600/70 text-white text-sm"
            >
              {isLoading ? 'Disconnecting...' : '🔌 Disconnect'}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-white/60 text-sm">
          Attempting to connect to Google Calendar…
        </p>
      )}
    </div>
  );
}
