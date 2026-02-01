# Google Services & Email Notifications Setup Guide

This guide covers all Google APIs/services you need to enable and how to activate email notifications for JabClub.

## Google APIs & Services to Enable

### 1. Google Identity API (for OAuth Authentication)

**Required for:** Google OAuth login functionality

**Steps to Enable:**

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create or Select a Project**
   - Click "Select a project" → "New Project" (or select existing)
   - Name: "JabClub" (or your preferred name)
   - Click "Create"

3. **Enable Google Identity API**
   - Go to "APIs & Services" → "Library"
   - Search for **"Google Identity"** or **"Google Identity Services API"**
   - Click on it and click **"Enable"**
   - ⚠️ **Note:** The old "Google+ API" is deprecated - use "Google Identity" instead

4. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose **"External"** (unless you have Google Workspace)
   - Click "Create"
   - Fill in required fields:
     - **App name**: JabClub
     - **User support email**: Your email
     - **Developer contact information**: Your email
   - Click "Save and Continue"
   - **Scopes**: Add `email` and `profile` (should be there by default)
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
   - **Copy the Client ID and Client Secret** (save these securely!)

6. **Add Environment Variables**
   
   **Backend (.env or Vercel Environment Variables):**
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

---

## Email Notifications Setup

### Option 1: Using Gmail (Recommended for Development)

**No Google API needed** - Uses SMTP directly with Gmail App Passwords.

**Steps:**

1. **Enable 2-Factor Authentication** (Required)
   - Go to: https://myaccount.google.com/security
   - Click on "2-Step Verification"
   - Follow the setup process (you'll need your phone)

2. **Generate an App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select **"Mail"** as the app
   - Select **"Other (Custom name)"** as the device
   - Enter a name like "JabClub App"
   - Click "Generate"
   - **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)
   - ⚠️ **Important:** Remove spaces when using it

3. **Configure Environment Variables**
   
   Add to your backend `.env` file:
   ```bash
   # Email/SMTP Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com          # Your Gmail address
   SMTP_PASSWORD=abcdefghijklmnop           # The 16-character app password (no spaces)
   ```

### Option 2: Using Production SMTP Services (Recommended for Production)

For production, consider using dedicated email services for better deliverability:

#### SendGrid
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

#### Mailgun
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailgun-username
SMTP_PASSWORD=your-mailgun-password
```

#### AWS SES
```bash
SMTP_HOST=email-smtp.region.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
```

#### Resend
```bash
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASSWORD=your-resend-api-key
```

---

## Summary: What to Enable

### Google Cloud Console:
✅ **Google Identity API** (for OAuth login)

### Gmail Account (if using Gmail for email):
✅ **2-Factor Authentication** (required)
✅ **App Password** (for SMTP authentication)

### No Additional APIs Needed:
- Email notifications use SMTP (not a Google API)
- Gmail SMTP is free and doesn't require enabling any APIs
- Just need 2FA + App Password for Gmail

---

## Testing

### Test Google OAuth:
1. Start your backend server
2. Go to login/signup page
3. Click "Continue with Google"
4. Sign in with Google
5. Should redirect to dashboard

### Test Email Notifications:
1. Ensure SMTP environment variables are set
2. Trigger a notification (signup, booking, etc.)
3. Check server logs for email sending status
4. Verify email is received in inbox

---

## Troubleshooting

### Google OAuth Issues:
- **"redirect_uri_mismatch"**: Ensure redirect URI in Google Console exactly matches your `GOOGLE_CALLBACK_URL`
- **"invalid_client"**: Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- **"access_denied"**: Check OAuth consent screen configuration

### Email Not Sending:
- Verify SMTP credentials are correct
- For Gmail: Ensure 2FA is enabled and using App Password (not regular password)
- Check SMTP port and security settings match your provider
- Check server logs for specific error messages
- Restart server after changing environment variables

---

## Security Notes

1. **Never commit** credentials to version control
2. **Use environment variables** for all sensitive data
3. **Restrict authorized origins** in Google Console to your actual domains
4. **Use HTTPS** in production (required for OAuth)
5. **Rotate App Passwords** periodically for security

---

## Quick Checklist

- [ ] Google Cloud Project created
- [ ] Google Identity API enabled
- [ ] OAuth Consent Screen configured
- [ ] OAuth 2.0 Credentials created
- [ ] `GOOGLE_CLIENT_ID` set in environment
- [ ] `GOOGLE_CLIENT_SECRET` set in environment
- [ ] `GOOGLE_CALLBACK_URL` set in environment
- [ ] Gmail 2FA enabled (if using Gmail)
- [ ] Gmail App Password generated (if using Gmail)
- [ ] SMTP environment variables configured
- [ ] Server restarted after configuration changes
- [ ] Tested Google OAuth login
- [ ] Tested email notifications
