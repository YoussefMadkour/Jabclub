# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for JabClub.

## Prerequisites

- Google Cloud Platform account
- Access to Google Cloud Console

## Step 1: Create Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project** (or select existing)
   - Click "Select a project" → "New Project"
   - Name: "JabClub" (or your preferred name)
   - Click "Create"

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" or "Google Identity"
   - Click on it and click "Enable"

4. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" (unless you have Google Workspace)
   - Click "Create"
   - Fill in the required fields:
     - **App name**: JabClub
     - **User support email**: Your email
     - **Developer contact information**: Your email
   - Click "Save and Continue"
   - Add scopes: `email`, `profile` (should be there by default)
   - Click "Save and Continue"
   - Add test users (optional for development)
   - Click "Save and Continue"

5. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: "JabClub Web Client"
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     https://app.jabclubegy.com
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:5000/api/auth/google/callback
     https://api.jabclubegy.com/api/auth/google/callback
     ```
   - Click "Create"
   - **Copy the Client ID and Client Secret** (you'll need these)

## Step 2: Configure Environment Variables

### Backend (.env or Vercel Environment Variables)

Add these to your backend environment variables:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://api.jabclubegy.com/api/auth/google/callback
```

**For local development:**
```bash
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

**For production (Vercel):**
- Add these in Vercel Dashboard → Your Project → Settings → Environment Variables
- Make sure to set them for "Production" environment

### Frontend (.env.local)

No changes needed - the frontend uses `NEXT_PUBLIC_API_URL` which is already configured.

## Step 3: Run Database Migration

Run the migration to add Google OAuth support to your database:

```bash
cd backend
npx prisma migrate deploy
```

Or for local development:
```bash
npx prisma migrate dev
```

## Step 4: Test Google OAuth

1. **Start your backend server** (if testing locally)
2. **Start your frontend** (if testing locally)
3. **Go to login/signup page**
4. **Click "Continue with Google"**
5. **Sign in with Google**
6. **You should be redirected to dashboard**

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure the redirect URI in Google Console **exactly matches** your `GOOGLE_CALLBACK_URL`
- Check for trailing slashes, http vs https, etc.

### Error: "invalid_client"
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Make sure they're from the same OAuth client

### Error: "access_denied"
- User cancelled the OAuth flow
- Check OAuth consent screen configuration

### Session not persisting after Google login
- Check that cookies are being set (check browser DevTools)
- Verify `FRONTEND_URL` is set correctly in backend
- Check CORS configuration allows your frontend domain

## Security Notes

1. **Never commit** `GOOGLE_CLIENT_SECRET` to version control
2. **Use environment variables** for all OAuth credentials
3. **Restrict authorized origins** in Google Console to your actual domains
4. **Use HTTPS** in production (required for OAuth)

## How It Works

1. User clicks "Continue with Google" button
2. Frontend redirects to `/api/auth/google`
3. Backend redirects to Google OAuth consent screen
4. User authorizes the app
5. Google redirects back to `/api/auth/google/callback`
6. Backend:
   - Receives user profile from Google
   - Creates user account if new (or links Google ID if existing)
   - Creates session
   - Redirects to frontend dashboard

## Linking Existing Accounts

If a user signs up with email/password first, then tries Google OAuth with the same email:
- The system will **link** the Google ID to the existing account
- User can then use either method to log in

If a user signs up with Google first, then tries email/password:
- They'll get an error: "This account was created with Google. Please sign in with Google."
- They must use Google OAuth to log in
