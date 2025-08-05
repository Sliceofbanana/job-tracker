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

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeGapi();
    }
  }

  // Initialize Google API
  private async initializeGapi() {
    try {
      // Skip initialization if API key or client ID is missing
      if (!process.env.NEXT_PUBLIC_GOOGLE_API_KEY || !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        console.warn('Google Calendar API configuration missing - skipping initialization');
        return;
      }

      // Load Google API script
      if (!window.gapi) {
        await this.loadGapiScript();
      }

      // Wait for gapi to be ready with timeout
      await new Promise<void>((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 10;
        
        const checkGapi = () => {
          attempts++;
          if (window.gapi && window.gapi.load) {
            window.gapi.load('client:auth2', () => resolve());
          } else if (attempts < maxAttempts) {
            setTimeout(checkGapi, 500);
          } else {
            reject(new Error('Google API not available after timeout'));
          }
        };
        
        checkGapi();
      });

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
        this.isSignedIn = authInstance ? authInstance.isSignedIn.get() : false;
      } catch (authError) {
        console.warn('Auth instance not ready:', authError);
        this.isSignedIn = false;
      }
      
      console.log('Google Calendar API initialized successfully');
    } catch (error) {
      console.warn('Google Calendar API initialization failed (this is optional):', error);
      
      // More specific error logging for debugging
      if (error instanceof Error) {
        if (error.message.includes('Content Security Policy')) {
          console.warn('CSP blocking Google APIs. Check your Content Security Policy settings.');
        } else if (error.message.includes('origin')) {
          console.warn('Origin not authorized. Check your Google Cloud Console authorized origins.');
        }
      }
      
      // Don't throw - Google Calendar is optional functionality
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
    if (!this.isInitialized || !this.gapi) {
      console.error('Google API not initialized');
      return false;
    }

    try {
      const authInstance = this.gapi.auth2.getAuthInstance();
      await authInstance.signIn();
      this.isSignedIn = true;
      return true;
    } catch (error) {
      console.error('Error signing in to Google Calendar:', error);
      return false;
    }
  }

  // Sign out from Google Calendar
  async signOut(): Promise<void> {
    if (!this.isInitialized || !this.gapi) return;

    try {
      const authInstance = this.gapi.auth2.getAuthInstance();
      await authInstance.signOut();
      this.isSignedIn = false;
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
    if (!this.isUserSignedIn() || !this.gapi) {
      console.warn('User not signed in to Google Calendar');
      return null;
    }

    try {
      const event = this.buildCalendarEvent(job, eventType);
      if (!event) return null;

      const response = await this.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });

      console.log('Calendar event created:', response.result.htmlLink);
      return response.result.id;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return null;
    }
  }

  // Update calendar event
  async updateJobEvent(eventId: string, job: JobEntry, eventType: 'application' | 'interview' | 'followup'): Promise<boolean> {
    if (!this.isUserSignedIn() || !this.gapi) return false;

    try {
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
    if (!this.isUserSignedIn() || !this.gapi) return false;

    try {
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

  // Build calendar event object
  private buildCalendarEvent(job: JobEntry, eventType: 'application' | 'interview' | 'followup') {
    let title: string;
    let description: string;
    let startDateTime: string;
    let color: string;

    switch (eventType) {
      case 'application':
        if (!job.applicationDate) return null;
        title = `📝 Applied: ${job.company} - ${job.role}`;
        description = this.buildApplicationDescription(job);
        startDateTime = new Date(job.applicationDate).toISOString();
        color = '1'; // Blue
        break;

      case 'interview':
        if (!job.interviewDate) return null;
        title = `📅 Interview: ${job.company} - ${job.role}`;
        description = this.buildInterviewDescription(job);
        startDateTime = new Date(job.interviewDate).toISOString();
        color = '5'; // Yellow
        break;

      case 'followup':
        if (!job.followUpDate) return null;
        title = `📞 Follow-up: ${job.company} - ${job.role}`;
        description = this.buildFollowUpDescription(job);
        startDateTime = new Date(job.followUpDate).toISOString();
        color = '10'; // Green
        break;

      default:
        return null;
    }

    // Calculate end time (1 hour for interviews, 30 minutes for others)
    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(endDateTime.getHours() + (eventType === 'interview' ? 1 : 0.5));

    return {
      summary: title,
      description: description,
      start: {
        dateTime: startDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      colorId: color,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: eventType === 'interview' ? 60 : 1440 }, // 1 hour for interviews, 1 day for others
          { method: 'popup', minutes: eventType === 'interview' ? 15 : 60 }
        ]
      }
    };
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

  // Get upcoming events from calendar
  async getUpcomingEvents(maxResults: number = 50): Promise<Array<{ summary: string; start?: { dateTime?: string; date?: string } }>> {
    if (!this.isUserSignedIn() || !this.gapi) return [];

    try {
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
}> => {
  const calendar = getGoogleCalendar();
  const results: {
    applicationEventId?: string;
    interviewEventId?: string;
    followUpEventId?: string;
  } = {};

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

  return results;
};

export const removeJobFromCalendar = async (eventIds: string[]): Promise<boolean> => {
  const calendar = getGoogleCalendar();
  let allDeleted = true;

  for (const eventId of eventIds) {
    if (eventId) {
      const deleted = await calendar.deleteJobEvent(eventId);
      if (!deleted) allDeleted = false;
    }
  }

  return allDeleted;
};
