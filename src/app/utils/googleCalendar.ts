"use client";

import { JobEntry } from '../types';

// Google API type definitions
interface GoogleAuth {
  isSignedIn: {
    get(): boolean;
  };
  currentUser: {
    get(): GoogleUser;
  };
  signIn(options?: { prompt?: string; ux_mode?: string }): Promise<GoogleUser>;
  signOut(): Promise<void>;
}

interface GoogleUser {
  isSignedIn(): boolean;
  getAuthResponse(): {
    access_token: string;
    expires_in: number;
  };
}

interface GoogleApiClient {
  init(config: {
    apiKey: string;
    clientId: string;
    discoveryDocs: string[];
    scope: string;
  }): Promise<void>;
  calendar: {
    events: {
      list(params: {
        calendarId: string;
        timeMin?: string;
        timeMax?: string;
        showDeleted?: boolean;
        singleEvents?: boolean;
        maxResults?: number;
        orderBy?: string;
        q?: string;
      }): Promise<{ result: { items?: GoogleCalendarEvent[] } }>;
      insert(params: {
        calendarId: string;
        resource: CalendarEvent;
      }): Promise<{ result: { id?: string; htmlLink?: string } }>;
      update(params: {
        calendarId: string;
        eventId: string;
        resource: CalendarEvent;
      }): Promise<void>;
      delete(params: {
        calendarId: string;
        eventId: string;
      }): Promise<void>;
    };
  };
}

interface GoogleCalendarEvent {
  id?: string;
  summary?: string;
  description?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  htmlLink?: string;
}

// Google API client interface
interface GapiClient {
  load: (apis: string, callback: () => void) => void;
  client: GoogleApiClient;
  auth2: {
    getAuthInstance(): GoogleAuth;
  };
}

// Calendar event interface - Fixed to match Google Calendar API
interface CalendarEvent {
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  reminders: {
    useDefault: boolean;
    overrides: Array<{
      method: string;
      minutes: number;
    }>;
  };
}

// Google Calendar Integration Class
export class GoogleCalendarIntegration {
  private readonly clientId = '371415396058-m01mutscge7tgu9jot50cidm4qij40oe.apps.googleusercontent.com';
  private readonly apiKey = 'AIzaSyC7rrJKo4bTayTgCGLsL_gOyZaZCnqL89c';
  private readonly scope = 'https://www.googleapis.com/auth/calendar';
  private readonly discoveryDocs = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
  
  private gapi: GapiClient | null = null;
  private isInitialized = false;
  private isInitializing = false;
  private initializationPromise: Promise<void> | null = null;
  private initializationError: Error | null = null;
  private accessToken: string | null = null;

  constructor() {
    // Initialize when instantiated
    this.initialize();
  }

  // Initialize Google API - Now uses popup instead of iframe
  private async initialize(): Promise<void> {
    if (this.isInitialized || this.isInitializing) {
      if (this.initializationPromise) {
        return this.initializationPromise;
      }
      return;
    }

    this.isInitializing = true;
    this.initializationError = null;

    this.initializationPromise = new Promise(async (resolve, reject) => {
      try {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
          throw new Error('Google Calendar integration requires browser environment');
        }

        // Load Google API script if not already loaded
        if (!(window as typeof window & { gapi?: GapiClient }).gapi) {
          await this.loadGoogleApiScript();
        }

        // Wait for gapi to be ready
        await new Promise<void>((gapiResolve) => {
          (window as typeof window & { gapi: GapiClient }).gapi.load('client:auth2', gapiResolve);
        });

        // Initialize the client
        await (window as typeof window & { gapi: GapiClient }).gapi.client.init({
          apiKey: this.apiKey,
          clientId: this.clientId,
          discoveryDocs: this.discoveryDocs,
          scope: this.scope
        });

        this.gapi = (window as typeof window & { gapi: GapiClient }).gapi;
        this.isInitialized = true;
        this.isInitializing = false;

        // Check if user is already signed in
        if (this.gapi) {
          const authInstance = this.gapi.auth2.getAuthInstance();
          if (authInstance && authInstance.isSignedIn && authInstance.isSignedIn.get()) {
            this.updateAccessToken();
          }
        }

        console.log('Google Calendar API initialized successfully');
        resolve();
      } catch (error) {
        this.isInitializing = false;
        this.initializationError = error instanceof Error ? error : new Error('Unknown initialization error');
        console.error('Failed to initialize Google Calendar API:', error);
        reject(this.initializationError);
      }
    });

    return this.initializationPromise;
  }

  // Load Google API script dynamically
  private loadGoogleApiScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as typeof window & { gapi?: GapiClient }).gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google API script'));
      document.head.appendChild(script);
    });
  }

  // Ensure initialization is complete before proceeding
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      if (this.initializationPromise) {
        await this.initializationPromise;
      } else {
        await this.initialize();
      }
    }

    if (this.initializationError) {
      throw this.initializationError;
    }

    if (!this.gapi) {
      throw new Error('Google API not available');
    }
  }

  // Update access token from current auth state
  private updateAccessToken(): void {
    if (!this.gapi) return;

    const authInstance = this.gapi.auth2.getAuthInstance();
    if (authInstance && authInstance.isSignedIn && authInstance.isSignedIn.get()) {
      const currentUser = authInstance.currentUser.get();
      const authResponse = currentUser.getAuthResponse();
      this.accessToken = authResponse.access_token;
    } else {
      this.accessToken = null;
    }
  }

  // Sign in user with popup (no iframe)
  async signIn(): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      if (!this.gapi) {
        throw new Error('Google API not initialized');
      }

      const authInstance = this.gapi.auth2.getAuthInstance();
      if (!authInstance) {
        throw new Error('Auth instance not available');
      }

      // Check if already signed in
      if (authInstance.isSignedIn.get()) {
        this.updateAccessToken();
        return true;
      }

      // Sign in with popup (explicitly avoid iframe)
      await authInstance.signIn({
        prompt: 'select_account',
        ux_mode: 'popup' // Force popup mode
      });

      this.updateAccessToken();
      return this.isUserSignedIn();
    } catch (error) {
      console.error('Sign-in failed:', error);
      return false;
    }
  }

  // Sign out user
  async signOut(): Promise<void> {
    try {
      await this.ensureInitialized();
      
      if (!this.gapi) return;

      const authInstance = this.gapi.auth2.getAuthInstance();
      if (authInstance && authInstance.isSignedIn.get()) {
        await authInstance.signOut();
      }
      
      this.accessToken = null;
    } catch (error) {
      console.error('Sign-out failed:', error);
    }
  }

  // Check if user is signed in
  isUserSignedIn(): boolean {
    if (!this.gapi) return false;

    const authInstance = this.gapi.auth2.getAuthInstance();
    return authInstance && authInstance.isSignedIn ? authInstance.isSignedIn.get() : false;
  }

  // Create calendar event for job
  async createJobEvent(job: JobEntry, eventType: 'application' | 'interview' | 'followup'): Promise<string | null> {
    try {
      await this.ensureInitialized();
      
      if (!this.isUserSignedIn() || !this.gapi) {
        throw new Error('User not signed in to Google Calendar');
      }

      // Ensure we have a fresh access token
      this.updateAccessToken();
      if (!this.accessToken) {
        throw new Error('No valid access token available');
      }

      const event = this.buildCalendarEvent(job, eventType);
      if (!event) {
        return null;
      }

      const response = await this.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });

      const eventId = response.result.id;
      if (eventId) {
        console.log(`Created ${eventType} event for ${job.role} at ${job.company}: ${response.result.htmlLink}`);
      }

      return eventId || null;
    } catch (error) {
      console.error(`Error creating ${eventType} event:`, error);
      return null;
    }
  }

  // Update calendar event
  async updateJobEvent(eventId: string, job: JobEntry, eventType: 'application' | 'interview' | 'followup'): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      if (!this.isUserSignedIn() || !this.gapi) {
        throw new Error('User not signed in to Google Calendar');
      }

      // Ensure we have a fresh access token
      this.updateAccessToken();
      if (!this.accessToken) {
        throw new Error('No valid access token available');
      }

      const event = this.buildCalendarEvent(job, eventType);
      if (!event) {
        return false;
      }

      await this.gapi.client.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event
      });

      console.log(`Updated ${eventType} event for ${job.role} at ${job.company}`);
      return true;
    } catch (error) {
      console.error(`Error updating ${eventType} event:`, error);
      return false;
    }
  }

  // Delete calendar event
  async deleteJobEvent(eventId: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      if (!this.isUserSignedIn() || !this.gapi) {
        throw new Error('User not signed in to Google Calendar');
      }

      // Ensure we have a fresh access token
      this.updateAccessToken();
      if (!this.accessToken) {
        throw new Error('No valid access token available');
      }

      await this.gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      });

      console.log(`Deleted calendar event: ${eventId}`);
      return true;
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      return false;
    }
  }

  // Build calendar event from job data
  private buildCalendarEvent(job: JobEntry, eventType: 'application' | 'interview' | 'followup'): CalendarEvent | null {
    const now = new Date();
    let startTime: Date;
    let summary: string;
    let description: string;

    switch (eventType) {
      case 'application':
        // Fixed: Handle applicationDate as string
        if (job.applicationDate) {
          startTime = new Date(job.applicationDate);
        } else {
          startTime = now;
        }
        summary = `📄 Applied: ${job.role} at ${job.company}`;
        description = `Job Application submitted for ${job.role} position at ${job.company}`;
        break;

      case 'interview':
        if (!job.interviewDate) return null;
        startTime = new Date(job.interviewDate);
        summary = `💼 Interview: ${job.role} at ${job.company}`;
        description = `Job Interview for ${job.role} position at ${job.company}`;
        break;

      case 'followup':
        if (!job.followUpDate) return null;
        startTime = new Date(job.followUpDate);
        summary = `📞 Follow-up: ${job.role} at ${job.company}`;
        description = `Follow-up for ${job.role} position at ${job.company}`;
        break;

      default:
        return null;
    }

    // Set end time (1 hour later for interviews, 30 minutes for others)
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + (eventType === 'interview' ? 60 : 30));

    const event: CalendarEvent = {
      summary,
      description: `${description}\n\n📍 Location: ${job.location || 'Not specified'}\n💰 Salary: ${job.salary ? formatSalary(typeof job.salary === 'string' ? Number(job.salary) : job.salary, 'USD') : 'Not specified'}\n🔗 Link: ${job.link || 'Not provided'}`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: eventType === 'interview' ? 1440 : 60 }, // 24h for interviews, 1h for others
          { method: 'popup', minutes: eventType === 'interview' ? 60 : 15 }    // 1h for interviews, 15min for others
        ]
      }
    };

    return event;
  }

  // Get user's calendar events
  async getJobTrackerEvents(): Promise<Array<{ id: string; summary: string; description?: string }>> {
    try {
      await this.ensureInitialized();
      
      if (!this.isUserSignedIn() || !this.gapi) {
        throw new Error('User not signed in to Google Calendar');
      }

      // Ensure we have a fresh access token
      this.updateAccessToken();
      if (!this.accessToken) {
        throw new Error('No valid access token available');
      }

      const timeMin = new Date();
      timeMin.setDate(timeMin.getDate() - 30); // Last 30 days

      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + 90); // Next 90 days

      const calendarResponse = await this.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 100,
        orderBy: 'startTime',
        q: 'Applied OR Interview OR Follow-up' // Search for job-related events
      });

      return (calendarResponse.result.items || [])
        .filter((item: GoogleCalendarEvent) => item.summary && item.id)
        .map((item: GoogleCalendarEvent) => ({
          id: item.id!,
          summary: item.summary!,
          description: item.description
        }));
    } catch (error) {
      console.error('Error fetching job tracker events:', error);
      return [];
    }
  }

  // Check if the API can be initialized (useful for UI state)
  async canInitialize(): Promise<boolean> {
    try {
      await this.ensureInitialized();
      return true;
    } catch {
      return false;
    }
  }

  // Get initialization error if any
  getInitializationError(): Error | null {
    return this.initializationError;
  }
}

// Format salary for calendar events
const formatSalary = (salary: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(salary);
};

// Singleton instance
let calendarInstance: GoogleCalendarIntegration | null = null;

export const getGoogleCalendar = (): GoogleCalendarIntegration => {
  if (!calendarInstance) {
    calendarInstance = new GoogleCalendarIntegration();
  }
  return calendarInstance;
};

// Utility functions for easy integration
export const syncJobToCalendar = async (job: JobEntry): Promise<{
  applicationEventId?: string;
  interviewEventId?: string;
  followUpEventId?: string;
  error?: string;
}> => {
  const calendar = getGoogleCalendar();
  const events: { [key: string]: string } = {};
  
  try {
    // Create application event
    const applicationEventId = await calendar.createJobEvent(job, 'application');
    if (applicationEventId) {
      events.applicationEventId = applicationEventId;
    }

    // Create interview event if date exists
    if (job.interviewDate) {
      const interviewEventId = await calendar.createJobEvent(job, 'interview');
      if (interviewEventId) {
        events.interviewEventId = interviewEventId;
      }
    }

    // Create follow-up event if date exists
    if (job.followUpDate) {
      const followUpEventId = await calendar.createJobEvent(job, 'followup');
      if (followUpEventId) {
        events.followUpEventId = followUpEventId;
      }
    }

    return events;
  } catch (error) {
    return { 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

export const removeJobFromCalendar = async (eventIds: string[]): Promise<{ success: boolean; error?: string }> => {
  const calendar = getGoogleCalendar();
  
  try {
    let allDeleted = true;

    for (const eventId of eventIds) {
      if (eventId) {
        try {
          await calendar.deleteJobEvent(eventId);
        } catch (error) {
          console.error(`Failed to delete event ${eventId}:`, error);
          allDeleted = false;
        }
      }
    }

    return { success: allDeleted };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

// Export default calendar instance for easy access
export default getGoogleCalendar();
