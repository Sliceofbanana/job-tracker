# Google Calendar Integration Setup Guide

This guide will help you set up Google Calendar integration for your Job Application Tracker.

## Overview

The Google Calendar integration allows you to:
- Automatically create calendar events for job applications
- Set up interview reminders with preparation tips
- Schedule follow-up reminders
- View all job-related events in your Google Calendar
- Sync across all your devices

## Prerequisites

1. A Google account
2. Access to Google Cloud Console
3. Basic understanding of OAuth 2.0

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter a project name (e.g., "Job Tracker Calendar")
4. Click "Create"

### 2. Enable Google Calendar API

1. In your project dashboard, click "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"

### 3. Create Credentials

#### API Key
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the API key
4. Click "Restrict Key" and add the following restrictions:
   - **Application restrictions**: HTTP referrers
   - **Website restrictions**: Add your domain (e.g., `https://yourdomain.com/*`)
   - **API restrictions**: Select "Google Calendar API"

#### OAuth 2.0 Client ID
1. Still in "Credentials", click "Create Credentials" → "OAuth client ID"
2. If prompted, configure the OAuth consent screen first:
   - Choose "External" (unless you're in a Google Workspace)
   - Fill in the required fields:
     - App name: "Job Application Tracker"
     - User support email: Your email
     - Developer contact information: Your email
   - Add scopes: `https://www.googleapis.com/auth/calendar`
   - Add test users if in testing mode
3. For OAuth client ID:
   - Application type: "Web application"
   - Name: "Job Tracker Web Client"
   - Authorized JavaScript origins: Add your domain (e.g., `https://yourdomain.com`)
   - Authorized redirect URIs: Add your domain (e.g., `https://yourdomain.com`)
4. Copy the Client ID

### 4. Configure Environment Variables

Add these to your `.env.local` file:

```bash
NEXT_PUBLIC_GOOGLE_API_KEY=your_api_key_here
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_oauth_client_id_here
```

### 5. OAuth Consent Screen Setup

1. Go to "APIs & Services" → "OAuth consent screen"
2. Fill in the required information:
   - **App name**: Job Application Tracker
   - **User support email**: Your email
   - **App logo**: (Optional) Upload your app logo
   - **App domain**: Your website domain
   - **Authorized domains**: Add your domain
   - **Developer contact information**: Your email
3. Add scopes:
   - `https://www.googleapis.com/auth/calendar` - See, edit, share, and permanently delete all calendars
4. Add test users (during development):
   - Add email addresses of users who will test the feature

### 6. Domain Verification (Production)

For production deployment:
1. Go to "APIs & Services" → "Domain verification"
2. Add and verify your domain
3. This is required for OAuth consent screen

## Testing the Integration

1. Start your development server
2. Go to Profile settings in your app
3. Find the "Google Calendar Sync" section
4. Click "Connect Google Calendar"
5. Sign in with your Google account
6. Grant calendar permissions
7. Create a test job application with dates
8. Check your Google Calendar for the events

## Event Types Created

The integration creates three types of events:

### 📝 Application Events
- **When**: When `applicationDate` is set
- **Title**: "📝 Applied: [Company] - [Role]"
- **Color**: Blue
- **Reminder**: 1 day before (email), 1 hour before (popup)

### 📅 Interview Events
- **When**: When `interviewDate` is set
- **Title**: "📅 Interview: [Company] - [Role]"
- **Color**: Yellow
- **Duration**: 1 hour
- **Reminder**: 1 hour before (email), 15 minutes before (popup)
- **Description**: Includes preparation tips and company research

### 📞 Follow-up Events
- **When**: When `followUpDate` is set
- **Title**: "📞 Follow-up: [Company] - [Role]"
- **Color**: Green
- **Duration**: 30 minutes
- **Reminder**: 1 day before (email), 1 hour before (popup)

## Troubleshooting

### Common Issues

1. **"API Key not valid" error**
   - Check API key restrictions
   - Ensure domain is added to authorized referrers
   - Verify Google Calendar API is enabled

2. **OAuth consent issues**
   - Ensure all required fields are filled
   - Add your domain to authorized domains
   - Verify redirect URIs match your domain

3. **Permission denied errors**
   - Check OAuth scopes include calendar access
   - Ensure user granted permissions during sign-in

4. **Events not appearing in calendar**
   - Check if user is signed in to correct Google account
   - Verify calendar permissions were granted
   - Check browser console for JavaScript errors

### Development vs Production

**Development**:
- Use `localhost` in authorized origins/redirects
- OAuth consent screen can be in "Testing" mode
- Test users must be explicitly added

**Production**:
- Use actual domain in all configurations
- OAuth consent screen must be "Published"
- Domain verification required
- Consider Google's verification process for sensitive scopes

## Security Considerations

1. **API Key Protection**:
   - Restrict by HTTP referrers
   - Only enable necessary APIs
   - Regularly rotate keys

2. **OAuth Security**:
   - Use HTTPS in production
   - Validate redirect URIs
   - Implement proper error handling

3. **Scope Minimization**:
   - Only request calendar access scope
   - Don't request broader permissions than needed

## Privacy and Data Handling

- Events are created in the user's personal calendar
- No calendar data is stored on your servers
- Users can disconnect at any time
- Events remain in calendar after disconnection (manual cleanup required)

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify all environment variables are set
3. Test with a fresh incognito window
4. Check Google Cloud Console quota limits
5. Review OAuth consent screen configuration

For additional help, refer to:
- [Google Calendar API Documentation](https://developers.google.com/calendar/api)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console Help](https://cloud.google.com/support)
