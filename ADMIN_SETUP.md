# Admin Setup Guide

## How to Set Up Admin Access for Your Job Tracker

### Step 1: Update Admin Email List

1. Open `src/app/utils/adminAuth.ts`
2. Replace the placeholder emails with your actual admin emails:

```typescript
const ADMIN_EMAILS = [
  'your-actual-email@gmail.com',     // Replace with your email
  'other-admin@company.com',         // Add more admin emails as needed
];
```

### Step 2: Update Firestore Security Rules

1. Open `firestore.rules`
2. Replace the placeholder emails in the security rules:

```javascript
// Replace these lines:
request.auth.token.email in ['your-admin-email@example.com', 'another-admin@example.com'];

// With your actual admin emails:
request.auth.token.email in ['your-actual-email@gmail.com', 'other-admin@company.com'];
```

### Step 3: Deploy Security Rules

Run this command to deploy your updated security rules:

```bash
firebase deploy --only firestore:rules
```

### Step 4: Test Admin Access

1. Sign in with an admin email - you should see the "⚙️ Admin" tab
2. Sign in with a non-admin email - the admin tab should be hidden
3. Try accessing feedback in the admin panel

## Alternative Admin Setup Methods

### Option 1: Environment Variables (More Secure)

Instead of hardcoding emails, use environment variables:

1. Add to your `.env.local`:
```
NEXT_PUBLIC_ADMIN_EMAILS=email1@domain.com,email2@domain.com
```

2. Update `adminAuth.ts`:
```typescript
const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
```

### Option 2: Firestore Admin Collection

Create an `admins` collection in Firestore:

1. Create a document in Firestore: `admins/config`
2. Add field: `emails: ['admin1@domain.com', 'admin2@domain.com']`
3. Update your code to fetch admin emails from Firestore

### Option 3: Firebase Custom Claims (Most Secure)

Use Firebase Admin SDK to set custom claims:

```javascript
// Server-side code
admin.auth().setCustomUserClaims(uid, { admin: true });
```

Then check in security rules:
```javascript
request.auth.token.admin == true
```

## Current Security Features

✅ **Admin Email Whitelist**: Only specified emails can access admin features
✅ **UI Protection**: Admin tab only visible to admins
✅ **Component Protection**: Admin components check permissions
✅ **Database Security**: Firestore rules restrict feedback access
✅ **Double Layer**: Both frontend and backend validation

## Important Notes

- Update both the TypeScript file AND Firestore rules with the same emails
- Deploy security rules after changes
- Test with both admin and non-admin accounts
- Consider using environment variables for production
- Always deploy rules to Firebase when updated

## Troubleshooting

**Admin tab not showing?**
- Check if your email is in the ADMIN_EMAILS array
- Ensure you're signed in with the correct email
- Check browser console for any errors

**Can't access feedback?**
- Verify Firestore rules are deployed
- Check if your email matches exactly (case-sensitive)
- Ensure you have internet connection for Firestore

**Getting permission denied?**
- Double-check that email in adminAuth.ts matches firestore.rules
- Redeploy Firestore rules after changes
- Sign out and sign back in to refresh tokens
