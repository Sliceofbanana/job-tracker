"use client";

import { JobEntry } from '../types';

// Google Identity Services (GIS) type definitions
interface GoogleIdentityServices {
  accounts: {
    oauth2: {
      initTokenClient(config: {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
        error_callback?: (error: Error) => void;
      }): TokenClient;
    };
  };
}

interface TokenClient {
  requestAccessToken(): void;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

interface GoogleApiClient {
  init(config: {
    apiKey: string;
    discoveryDocs: string[];
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
  setToken(token: { access_token: string }): void;
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
  private readonly clientId: string;
  private readonly apiKey: string;
  private readonly scope = 'https://www.googleapis.com/auth/calendar';
  private readonly discoveryDocs = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
  
  private gapi: GapiClient | null = null;
  private tokenClient: TokenClient | null = null;
  private isInitialized = false;
  private isInitializing = false;
  private initializationPromise: Promise<void> | null = null;
  private initializationError: Error | null = null;
  private accessToken: string | null = null;
  private isSignedIn = false;

  constructor() {
    // Get API keys from environment variables
    this.clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';
    
    console.log('Google Calendar API Configuration:');
    console.log('Client ID configured:', !!this.clientId);
    console.log('API Key configured:', !!this.apiKey);
    
    if (!this.clientId || !this.apiKey) {
      console.error('Google Calendar API keys not found in environment variables');
      console.error('Missing Client ID:', !this.clientId);
      console.error('Missing API Key:', !this.apiKey);
      return;
    }
    
    // Only initialize if we're in the browser
    if (typeof window !== 'undefined') {
      console.log('Initializing Google Calendar API...');
      this.initialize();
    }
  }

  // Initialize Google API with new Google Identity Services
  private async initialize(): Promise<void> {
    // Skip initialization if not in browser environment
    if (typeof window === 'undefined') {
      console.log('Skipping Google Calendar initialization - not in browser environment');
      return;
    }

    if (this.isInitialized || this.isInitializing) {
      if (this.initializationPromise) {
        return this.initializationPromise;
      }
      return;
    }

    // Check for API keys
    if (!this.clientId || !this.apiKey) {
      this.initializationError = new Error('Google Calendar API keys not configured');
      return;
    }

    this.isInitializing = true;
    this.initializationError = null;

    this.initializationPromise = new Promise(async (resolve, reject) => {
      try {
        console.log('🔄 Starting Google Calendar API initialization...');
        
        // Load Google API script - this is essential
        if (!(window as typeof window & { gapi?: GapiClient }).gapi) {
          console.log('📥 Loading Google API script...');
          await this.loadGoogleApiScript();
        } else {
          console.log('✅ Google API script already loaded');
        }

        // Load Google Identity Services script - optional, app can work without it
        let gisAvailable = false;
        try {
          if (!(window as typeof window & { google?: GoogleIdentityServices }).google) {
            console.log('📥 Loading Google Identity Services script...');
            await this.loadGoogleIdentityScript();
          } else {
            console.log('✅ Google Identity Services already loaded');
          }
          gisAvailable = !!(window as typeof window & { google?: GoogleIdentityServices }).google?.accounts;
          console.log('Google Identity Services available:', gisAvailable);
        } catch (error) {
          console.warn('⚠️ Google Identity Services unavailable, calendar authentication will be disabled:', error);
          gisAvailable = false;
        }

        // Wait for gapi to be ready (only client, no auth2)
        console.log('🔄 Initializing Google API client...');
        await new Promise<void>((gapiResolve, gapiReject) => {
          try {
            (window as typeof window & { gapi: GapiClient }).gapi.load('client', gapiResolve);
          } catch (error) {
            console.error('❌ Failed to load Google API client:', error);
            gapiReject(error);
          }
        });

        // Initialize the client (no auth config needed)
        console.log('🔄 Initializing Google Calendar API client...');
        await (window as typeof window & { gapi: GapiClient }).gapi.client.init({
          apiKey: this.apiKey,
          discoveryDocs: this.discoveryDocs
        });

        this.gapi = (window as typeof window & { gapi: GapiClient }).gapi;
        console.log('✅ Google API client initialized successfully');

        // Only initialize the OAuth2 token client if Google Identity Services are available
        if (gisAvailable && (window as typeof window & { google?: GoogleIdentityServices }).google?.accounts) {
          try {
            console.log('🔄 Initializing OAuth2 token client...');
            this.tokenClient = (window as typeof window & { google: GoogleIdentityServices }).google.accounts.oauth2.initTokenClient({
              client_id: this.clientId,
              scope: this.scope,
              callback: (response: TokenResponse) => {
                console.log('✅ OAuth token received successfully');
                this.accessToken = response.access_token;
                this.isSignedIn = true;
                // Set the token for API calls
                if (this.gapi) {
                  this.gapi.client.setToken({ access_token: response.access_token });
                }
              },
              error_callback: (error: Error) => {
                console.error('❌ OAuth error:', error);
                this.isSignedIn = false;
                this.accessToken = null;
              }
            });
            console.log('✅ Google Identity Services token client initialized');
          } catch (error) {
            console.warn('⚠️ Failed to initialize Google Identity Services token client:', error);
          }
        } else {
          console.warn('⚠️ Google Identity Services not available - calendar authentication disabled');
        }

        this.isInitialized = true;
        this.isInitializing = false;

        console.log('🎉 Google Calendar API initialized successfully');
        resolve();
      } catch (error) {
        this.isInitializing = false;
        this.initializationError = error instanceof Error ? error : new Error('Unknown initialization error');
        console.error('❌ Failed to initialize Google Calendar API:', error);
        reject(this.initializationError);
      }
    });

    return this.initializationPromise;
  }

  // Load Google API script dynamically
  private loadGoogleApiScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if GAPI script is already loaded
      if (document.querySelector('script[src="https://apis.google.com/js/api.js"]')) {
        console.log('Google API script already loaded');
        resolve();
        return;
      }

      if ((window as any).gapi) {
        console.log('Google API already available');
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      
      // Add timeout
      const timeout = setTimeout(() => {
        script.remove();
        reject(new Error('Google API script loading timed out'));
      }, 15000);
      
      script.onload = () => {
        clearTimeout(timeout);
        console.log('✅ Google API script loaded successfully');
        resolve();
      };
      
      script.onerror = () => {
        clearTimeout(timeout);
        script.remove();
        reject(new Error('Failed to load Google API script. This may be due to network connectivity issues or browser restrictions.'));
      };
      
      document.head.appendChild(script);
    });
  }

  // Update the loadGoogleIdentityScript method to handle CSP better
  private loadGoogleIdentityScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        console.log('Google Identity Services script already loaded');
        resolve();
        return;
      }

      // Check if Google Identity Services is already available
      if ((window as any).google?.accounts?.oauth2) {
        console.log('Google Identity Services already available');
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      script.referrerPolicy = 'no-referrer-when-downgrade';
      
      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        script.remove();
        reject(new Error('Google Identity Services script loading timed out. This may be due to network issues or browser restrictions.'));
      }, 15000); // 15 second timeout
    
      script.onload = () => {
        clearTimeout(timeout);
        console.log('✅ Google Identity Services script loaded successfully');
        // Wait a bit for the script to initialize
        setTimeout(() => {
          if ((window as any).google?.accounts?.oauth2) {
            resolve();
          } else {
            reject(new Error('Google Identity Services not available after script load'));
          }
        }, 500);
      };
      
      script.onerror = () => {
        clearTimeout(timeout);
        script.remove();
        // Don't reject immediately - let the app continue without GIS
        console.warn('⚠️ Google Identity Services script failed to load. Calendar authentication will be disabled.');
        resolve(); // Resolve instead of reject to allow app to continue
      };
      
      // Add script to document head
      document.head.appendChild(script);
    });
  }

  // Check if Google services are available (for graceful degradation)
  isGoogleServicesAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    
    return !!(window as typeof window & { google?: GoogleIdentityServices }).google?.accounts;
  }

  // Get a user-friendly message about service availability
  getServiceAvailabilityMessage(): string | null {
    if (typeof window === 'undefined') {
      return 'Google Calendar services are only available in the browser.';
    }
    
    if (!this.isGoogleServicesAvailable()) {
      return 'Google Calendar services are currently unavailable. This may be due to ad blockers, privacy settings, or network restrictions. You can still use the job tracker without calendar integration.';
    }
    
    return null;
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

    if (!this.gapi || !this.tokenClient) {
      throw new Error('Google API not available');
    }
  }

  // Sign in user with new Google Identity Services (for calendar only)
  async signIn(): Promise<boolean> {
    try {
      console.log('🔄 Attempting Google Calendar sign-in...');
      await this.ensureInitialized();
      
      // Check if Google Identity Services are available
      if (!this.isGoogleServicesAvailable()) {
        const message = 'Google Calendar authentication is not available. This may be due to browser restrictions, ad blockers, or network issues. Please check your browser settings and try again.';
        console.error('❌', message);
        throw new Error(message);
      }
      
      if (!this.tokenClient) {
        console.log('🔄 Token client not available, trying to create...');
        // Try to create token client if Google services became available
        if ((window as typeof window & { google?: GoogleIdentityServices }).google?.accounts) {
          try {
            this.tokenClient = (window as typeof window & { google: GoogleIdentityServices }).google.accounts.oauth2.initTokenClient({
              client_id: this.clientId,
              scope: this.scope,
              callback: () => {}, // Will be overridden below
            });
            console.log('✅ Token client created successfully');
          } catch (error) {
            console.error('❌ Failed to create token client:', error);
            throw new Error('Failed to initialize Google authentication. Please refresh the page and try again.');
          }
        } else {
          const message = 'Google authentication services are not available. Please check your internet connection and browser settings.';
          console.error('❌', message);
          throw new Error(message);
        }
      }

      // Check if already signed in
      if (this.isSignedIn && this.accessToken) {
        console.log('✅ Already signed in to Google Calendar');
        return true;
      }

      // Request access token using the new GIS
      console.log('🔄 Requesting access token...');
      return new Promise<boolean>((resolve) => {
        try {
          // Create a new token client for this sign-in attempt
          if ((window as typeof window & { google: GoogleIdentityServices }).google?.accounts) {
            const tempTokenClient = (window as typeof window & { google: GoogleIdentityServices }).google.accounts.oauth2.initTokenClient({
              client_id: this.clientId,
              scope: this.scope,
              callback: (response: TokenResponse) => {
                try {
                  console.log('✅ Authentication successful, processing token...');
                  this.accessToken = response.access_token;
                  this.isSignedIn = true;
                  // Set the token for API calls
                  if (this.gapi) {
                    this.gapi.client.setToken({ access_token: response.access_token });
                  }
                  console.log('🎉 Google Calendar authentication completed successfully');
                  resolve(true);
                } catch (error) {
                  console.error('❌ Error processing authentication response:', error);
                  resolve(false);
                }
              },
              error_callback: (error: Error) => {
                console.error('❌ Calendar OAuth error:', error);
                this.isSignedIn = false;
                this.accessToken = null;
                resolve(false);
              }
            });
            
            console.log('🔄 Triggering authentication popup...');
            tempTokenClient.requestAccessToken();
          } else {
            console.error('❌ Google Identity Services not available for sign-in');
            resolve(false);
          }
        } catch (error) {
          console.error('❌ Error during sign-in process:', error);
          resolve(false);
        }
      });
    } catch (error) {
      console.error('❌ Calendar sign-in failed:', error);
      throw error; // Re-throw so the UI can handle it properly
    }
  }

  // Sign out user
  async signOut(): Promise<void> {
    try {
      // Clear the access token
      this.accessToken = null;
      this.isSignedIn = false;
      
      // Clear the token from the client
      if (this.gapi) {
        this.gapi.client.setToken({ access_token: '' });
      }
      
      console.log('Signed out successfully');
    } catch (error) {
      console.error('Sign-out failed:', error);
    }
  }

  // Check if user is signed in
  isUserSignedIn(): boolean {
    return this.isSignedIn && !!this.accessToken;
  }

  // Create calendar event for job
  async createJobEvent(job: JobEntry, eventType: 'application' | 'interview' | 'followup'): Promise<string | null> {
    try {
      await this.ensureInitialized();
      
      if (!this.isUserSignedIn() || !this.gapi) {
        throw new Error('User not signed in to Google Calendar');
      }

      // Ensure we have a fresh access token
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
  // Only create instance in browser environment
  if (typeof window === 'undefined') {
    // Return a mock instance for SSR
    return {
      isUserSignedIn: () => false,
      signIn: () => Promise.resolve(false),
      signOut: () => Promise.resolve(),
      createJobEvent: () => Promise.resolve(null),
      updateJobEvent: () => Promise.resolve(false),
      deleteJobEvent: () => Promise.resolve(false),
      getJobTrackerEvents: () => Promise.resolve([]),
      canInitialize: () => Promise.resolve(false),
      getInitializationError: () => new Error('Not in browser environment')
    } as any;
  }

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

// Export default calendar instance for easy access (only in browser)
export default typeof window !== 'undefined' ? getGoogleCalendar() : null;
