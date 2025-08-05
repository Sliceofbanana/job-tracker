"use client";

import { JobEntry } from '../types';

// Google Calendar API configuration
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/calendar';

// Google Calendar integration class
export class GoogleCalendarIntegration {
  private gapi: typeof window.gapi | null = null;
  private isInitialized = false;
  private isSignedIn = false;
  private initializationPromise: Promise<void> | null = null;
  private initializationError: Error | null = null;

  constructor() {
    // Don't initialize in constructor - do it lazily when needed
  }

  // Ensure Google API is initialized before any operation
  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized && this.gapi) {
      return;
    }

    if (this.initializationError) {
      throw this.initializationError;
    }

    if (!this.initializationPromise) {
      this.initializationPromise = this.initializeGapi();
    }

    await this.initializationPromise;
  }

  // Initialize Google API
  private async initializeGapi(): Promise<void> {
    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        throw new Error('Google Calendar API can only be used in browser environment');
      }

      // Check environment variables
      if (!process.env.NEXT_PUBLIC_GOOGLE_API_KEY || !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        console.error('Missing environment variables:');
        console.error('NEXT_PUBLIC_GOOGLE_API_KEY:', !!process.env.NEXT_PUBLIC_GOOGLE_API_KEY);
        console.error('NEXT_PUBLIC_GOOGLE_CLIENT_ID:', !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
        throw new Error('Google Calendar API configuration missing. Please check your environment variables.');
      }

      console.log('🔧 Initializing Google Calendar API...');
      console.log('Current origin:', window.location.origin);
      console.log('Client ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

      // Load Google API script
      if (!window.gapi) {
        console.log('📜 Loading Google API script...');
        await this.loadGapiScript();
      }

      // Wait for gapi to be ready with proper error handling
      await new Promise<void>((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 20; // Increased attempts
        
        const checkGapi = (): void => {
          attempts++;
          console.log(`🔄 Checking Google API availability (attempt ${attempts}/${maxAttempts})`);
          
          if (window.gapi && window.gapi.load) {
            try {
              // Try the newer callback approach first, fallback to simple approach
              const loadCallback = (): void => {
                console.log('✅ Google API client modules loaded');
                resolve();
              };
              const errorCallback = (): void => {
                console.error('❌ Failed to load Google API client modules');
                reject(new Error('Failed to load Google API client modules'));
              };
              
              // Use function overload that accepts callback and onerror
              const gapiLoad = window.gapi.load as (api: string, callback: () => void, onerror?: () => void) => void;
              gapiLoad('client:auth2', loadCallback, errorCallback);
            } catch {
              // Fallback to simple approach
              console.log('🔄 Using fallback Google API loading method');
              window.gapi.load('client:auth2', () => resolve());
            }
          } else if (attempts < maxAttempts) {
            setTimeout(checkGapi, 300);
          } else {
            console.error('❌ Google API not available after timeout');
            console.log('Possible causes:');
            console.log('- Content Security Policy blocking Google APIs');
            console.log('- Network connectivity issues');
            console.log('- Browser privacy settings blocking third-party scripts');
            reject(new Error('Google API not available after timeout. Please check your internet connection and Content Security Policy.'));
          }
        };
        
        checkGapi();
      });

      console.log('🚀 Initializing Google API client...');

      // Initialize the client
      await window.gapi.client.init({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
      });

      this.gapi = window.gapi;
      this.isInitialized = true;
      
      // Check auth status safely
      try {
        const authInstance = this.gapi.auth2.getAuthInstance();
        if (authInstance) {
          this.isSignedIn = authInstance.isSignedIn.get();
          console.log('🔐 Current auth status:', this.isSignedIn ? 'Signed in' : 'Not signed in');
        } else {
          console.warn('⚠️ Auth instance not available');
          this.isSignedIn = false;
        }
      } catch (authError) {
        console.warn('Auth instance not ready:', authError);
        this.isSignedIn = false;
      }
      
      console.log('✅ Google Calendar API initialized successfully');
    } catch (error) {
      this.initializationError = error instanceof Error ? error : new Error('Unknown initialization error');
      
      // Enhanced error logging for debugging
      console.error('❌ Google Calendar API initialization failed:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Content Security Policy')) {
          console.error('🚨 CSP Issue: Content Security Policy is blocking Google APIs');
          console.log('Solutions:');
          console.log('1. Check next.config.ts CSP settings');
          console.log('2. Ensure Google API domains are allowed');
        } else if (error.message.includes('origin')) {
          console.error('🚨 Origin Issue: Current origin not authorized');
          console.log('Current origin:', window.location.origin);
          console.log('Solutions:');
          console.log('1. Add this origin to Google Cloud Console > Credentials > Authorized JavaScript origins');
          console.log('2. For localhost: http://localhost:3001');
        } else if (error.message.includes('idpiframe_initialization_failed')) {
          console.error('🚨 OAuth Issue: Google OAuth iframe failed to initialize');
          console.log('Solutions:');
          console.log('1. Check OAuth consent screen configuration');
          console.log('2. Verify app is published or you are a test user');
          console.log('3. Check authorized domains in OAuth consent screen');
        }
      }
      
      throw this.initializationError;
    }
  }

  // Load Google API script dynamically
  private loadGapiScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google API script'));
      document.head.appendChild(script);
    });
  }

  // Sign in to Google Calendar
  async signIn(): Promise<boolean> {
    try {
      // Ensure API is initialized before attempting sign in
      await this.ensureInitialized();
      
      if (!this.gapi) {
        throw new Error('Google API not available after initialization');
      }

      const authInstance = this.gapi.auth2.getAuthInstance();
      if (!authInstance) {
        throw new Error('Google Auth instance not available');
      }

      await authInstance.signIn();
      this.isSignedIn = true;
      return true;
    } catch (error) {
      console.error('Error signing in to Google Calendar:', error);
      
      // Re-throw with more specific error for UI
      if (error instanceof Error) {
        throw new Error(`Google Calendar sign-in failed: ${error.message}`);
      }
      throw new Error('Google Calendar sign-in failed with unknown error');
    }
  }

  // Sign out from Google Calendar
  async signOut(): Promise<void> {
    try {
      await this.ensureInitialized();
      
      if (!this.gapi) return;

      const authInstance = this.gapi.auth2.getAuthInstance();
      if (authInstance) {
        await authInstance.signOut();
        this.isSignedIn = false;
      }
    } catch (error) {
      console.error('Error signing out from Google Calendar:', error);
    }
  }

  // Check if user is signed in
  isUserSignedIn(): boolean {
    return this.isSignedIn && this.isInitialized && this.gapi !== null;
  }

  // Create calendar event for job application
  async createJobEvent(job: JobEntry, eventType: 'application' | 'interview' | 'followup'): Promise<string | null> {
    try {
      await this.ensureInitialized();
      
      if (!this.isUserSignedIn() || !this.gapi) {
        throw new Error('User not signed in to Google Calendar');
      }

      const event = this.buildCalendarEvent(job, eventType);
      if (!event) return null;

      const response = await this.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });

      console.log('Calendar event created:', response.result.htmlLink);
      return response.result.id || null;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return null;
    }
  }

  // Update calendar event
  async updateJobEvent(eventId: string, job: JobEntry, eventType: 'application' | 'interview' | 'followup'): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      if (!this.isUserSignedIn() || !this.gapi) return false;

      const event = this.buildCalendarEvent(job, eventType);
      if (!event) return false;

      await this.gapi.client.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event
      });

      console.log('Calendar event updated');
      return true;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      return false;
    }
  }

  // Delete calendar event
  async deleteJobEvent(eventId: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      if (!this.isUserSignedIn() || !this.gapi) return false;

      await this.gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      });

      console.log('Calendar event deleted');
      return true;
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      return false;
    }
  }

  // Build calendar event object following Google Calendar API v3 specification
  private buildCalendarEvent(job: JobEntry, eventType: 'application' | 'interview' | 'followup') {
    let title: string;
    let description: string;
    let startDateTime: string;
    let colorId: string;
    let location: string | undefined;

    switch (eventType) {
      case 'application':
        if (!job.applicationDate) return null;
        title = `📝 Applied: ${job.company} - ${job.role}`;
        description = this.buildApplicationDescription(job);
        startDateTime = new Date(job.applicationDate).toISOString();
        colorId = '1'; // Blue - per API docs: color IDs reference colors definition
        break;

      case 'interview':
        if (!job.interviewDate) return null;
        title = `📅 Interview: ${job.company} - ${job.role}`;
        description = this.buildInterviewDescription(job);
        startDateTime = new Date(job.interviewDate).toISOString();
        colorId = '5'; // Yellow
        location = job.location || (job.isRemote ? 'Remote Interview' : undefined);
        break;

      case 'followup':
        if (!job.followUpDate) return null;
        title = `📞 Follow-up: ${job.company} - ${job.role}`;
        description = this.buildFollowUpDescription(job);
        startDateTime = new Date(job.followUpDate).toISOString();
        colorId = '10'; // Green
        break;

      default:
        return null;
    }

    // Calculate end time (1 hour for interviews, 30 minutes for others)
    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(endDateTime.getHours() + (eventType === 'interview' ? 1 : 0.5));

    // Build event object according to API specification
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const calendarEvent: {
      summary: string;
      description: string;
      start: { dateTime: string; timeZone: string };
      end: { dateTime: string; timeZone: string };
      colorId: string;
      reminders: {
        useDefault: boolean;
        overrides: Array<{ method: string; minutes: number }>;
      };
      extendedProperties: {
        private: Record<string, string>;
      };
      transparency: string;
      visibility: string;
      eventType: string;
      location?: string;
      source?: { title: string; url: string };
    } = {
      summary: title,
      description: description,
      start: {
        dateTime: startDateTime,
        timeZone: timeZone
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: timeZone
      },
      colorId: colorId,
      // Enhanced reminders per API specification
      reminders: {
        useDefault: false,
        overrides: [
          { 
            method: 'email', 
            minutes: eventType === 'interview' ? 60 : 1440 // 1 hour for interviews, 1 day for others
          },
          { 
            method: 'popup', 
            minutes: eventType === 'interview' ? 15 : 60 
          }
        ]
      },
      // Add extended properties for better tracking (per API docs)
      extendedProperties: {
        private: {
          'source': 'job-tracker-app',
          'jobId': job.id || '',
          'eventType': eventType,
          'company': job.company,
          'role': job.role
        }
      },
      // Transparency setting per API docs
      transparency: eventType === 'interview' ? 'opaque' : 'transparent', // Block time for interviews only
      // Visibility setting
      visibility: 'private', // Keep job-related events private
      // Event type (must be 'default' for custom events per API docs)
      eventType: 'default'
    };

    // Add location if available
    if (location) {
      calendarEvent.location = location;
    }

    // Add source information for better tracking
    if (job.link) {
      calendarEvent.source = {
        title: `Job Posting - ${job.company}`,
        url: job.link
      };
    }

    return calendarEvent;
  }

  // Build application event description
  private buildApplicationDescription(job: JobEntry): string {
    let description = `Job Application Details:\n\n`;
    description += `Company: ${job.company}\n`;
    description += `Role: ${job.role}\n`;
    description += `Status: ${job.status}\n`;
    
    if (job.location) description += `Location: ${job.location}\n`;
    if (job.salary) description += `Salary: ${job.salary}\n`;
    if (job.link) description += `Job Link: ${job.link}\n`;
    if (job.notes) description += `\nNotes:\n${job.notes}\n`;
    
    description += `\n🎯 Tracker: Job Application Tracker`;
    return description;
  }

  // Build interview event description
  private buildInterviewDescription(job: JobEntry): string {
    let description = `Interview Details:\n\n`;
    description += `Company: ${job.company}\n`;
    description += `Role: ${job.role}\n`;
    description += `Type: Interview\n`;
    
    if (job.location) description += `Location: ${job.location}\n`;
    if (job.isRemote) description += `Format: Remote\n`;
    if (job.companyResearch) description += `\nCompany Research:\n${job.companyResearch}\n`;
    if (job.notes) description += `\nNotes:\n${job.notes}\n`;
    
    description += `\n💡 Preparation Tips:\n`;
    description += `- Review job description and requirements\n`;
    description += `- Prepare STAR method examples\n`;
    description += `- Research company culture and values\n`;
    description += `- Prepare thoughtful questions to ask\n`;
    
    description += `\n🎯 Tracker: Job Application Tracker`;
    return description;
  }

  // Build follow-up event description
  private buildFollowUpDescription(job: JobEntry): string {
    let description = `Follow-up Reminder:\n\n`;
    description += `Company: ${job.company}\n`;
    description += `Role: ${job.role}\n`;
    description += `Current Status: ${job.status}\n`;
    
    if (job.notes) description += `\nNotes:\n${job.notes}\n`;
    
    description += `\n📞 Follow-up Actions:\n`;
    description += `- Send polite follow-up email\n`;
    description += `- Reiterate interest in the position\n`;
    description += `- Ask for updates on timeline\n`;
    description += `- Provide any additional information if needed\n`;
    
    description += `\n🎯 Tracker: Job Application Tracker`;
    return description;
  }

  // Get upcoming events from calendar (improved with better filtering)
  async getUpcomingEvents(maxResults: number = 50): Promise<Array<{ summary: string; start?: { dateTime?: string; date?: string } }>> {
    try {
      await this.ensureInitialized();
      
      if (!this.isUserSignedIn() || !this.gapi) return [];

      // Use text search to find our events (most reliable approach)
      const response = await this.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: (new Date()).toISOString(),
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime',
        q: 'Job Application Tracker' // Search for events created by our app
      });

      // Filter and type-safe return
      return (response.result.items || [])
        .filter(item => item.summary) // Only return events with summary
        .map(item => ({
          summary: item.summary!,
          start: item.start
        }));
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
  }

  // Get all events matching our job tracker pattern
  async getJobTrackerEvents(): Promise<Array<{ id: string; summary: string; description?: string }>> {
    try {
      await this.ensureInitialized();
      
      if (!this.isUserSignedIn() || !this.gapi) return [];

      // Search for events with our job tracker signature
      const response = await this.gapi.client.calendar.events.list({
        calendarId: 'primary',
        maxResults: 100,
        singleEvents: true,
        q: '🎯 Tracker: Job Application Tracker' // Search by our signature
      });

      return (response.result.items || [])
        .filter(item => item.summary && item.id)
        .map(item => ({
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

  // Diagnostic method to troubleshoot connection issues
  async runDiagnostics(): Promise<{
    environment: 'browser' | 'server';
    envVars: { apiKey: boolean; clientId: boolean };
    currentOrigin?: string;
    gapiLoaded: boolean;
    apiInitialized: boolean;
    authAvailable: boolean;
    userSignedIn: boolean;
    errors: string[];
  }> {
    const diagnostics = {
      environment: (typeof window === 'undefined') ? 'server' as const : 'browser' as const,
      envVars: {
        apiKey: !!process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
        clientId: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      },
      currentOrigin: typeof window !== 'undefined' ? window.location.origin : undefined,
      gapiLoaded: typeof window !== 'undefined' && !!window.gapi,
      apiInitialized: this.isInitialized,
      authAvailable: false,
      userSignedIn: this.isSignedIn,
      errors: [] as string[]
    };

    // Check auth availability
    if (this.gapi) {
      try {
        const authInstance = this.gapi.auth2.getAuthInstance();
        diagnostics.authAvailable = !!authInstance;
      } catch (error) {
        diagnostics.errors.push(`Auth instance error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }

    if (this.initializationError) {
      diagnostics.errors.push(`Initialization error: ${this.initializationError.message}`);
    }

    return diagnostics;
  }
}

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
  const results: {
    applicationEventId?: string;
    interviewEventId?: string;
    followUpEventId?: string;
    error?: string;
  } = {};

  try {
    // Create events sequentially to avoid rate limiting
    if (job.applicationDate) {
      const eventId = await calendar.createJobEvent(job, 'application');
      if (eventId) results.applicationEventId = eventId;
    }

    if (job.interviewDate) {
      const eventId = await calendar.createJobEvent(job, 'interview');
      if (eventId) results.interviewEventId = eventId;
    }

    if (job.followUpDate) {
      const eventId = await calendar.createJobEvent(job, 'followup');
      if (eventId) results.followUpEventId = eventId;
    }
  } catch (error) {
    results.error = error instanceof Error ? error.message : 'Unknown error occurred';
  }

  return results;
};

// Sync multiple jobs to calendar efficiently
export const syncMultipleJobsToCalendar = async (jobs: JobEntry[]): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> => {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  // Process jobs in batches to respect API rate limits
  const batchSize = 5;
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    
    await Promise.allSettled(
      batch.map(async (job) => {
        try {
          await syncJobToCalendar(job);
          success++;
        } catch (error) {
          failed++;
          errors.push(`${job.company} - ${job.role}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      })
    );

    // Small delay between batches to be respectful to the API
    if (i + batchSize < jobs.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return { success, failed, errors };
};

export const removeJobFromCalendar = async (eventIds: string[]): Promise<{ success: boolean; error?: string }> => {
  const calendar = getGoogleCalendar();
  
  try {
    let allDeleted = true;

    for (const eventId of eventIds) {
      if (eventId) {
        const deleted = await calendar.deleteJobEvent(eventId);
        if (!deleted) allDeleted = false;
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