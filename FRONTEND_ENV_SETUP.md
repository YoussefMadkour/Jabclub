# Frontend Environment Variables Setup

## 🔴 Current Issue

The frontend is trying to use `https://app.jabclubegy.com/` as the API URL, but it should be `https://api.jabclubegy.com/api`.

## ✅ Fix: Update Frontend Environment Variable in Vercel

### Step 1: Go to Frontend Project in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find and click on your **frontend project** (likely named `jabclub` or `jabclub-frontend`)

### Step 2: Add/Update Environment Variable

1. Click **Settings** → **Environment Variables**
2. Look for `NEXT_PUBLIC_API_URL`
   - If it exists: Click **Edit** and update the value
   - If it doesn't exist: Click **Add New**

### Step 3: Set the Correct Value

**Key**: `NEXT_PUBLIC_API_URL`

**Value**: `https://api.jabclubegy.com/api`

**Important**: 
- ✅ Must include `/api` at the end
- ✅ Must use `https://` (not `http://`)
- ✅ Must point to `api.jabclubegy.com` (not `app.jabclubegy.com`)

### Step 4: Select Environments

Select all environments:
- ✅ Production
- ✅ Preview  
- ✅ Development

### Step 5: Save and Redeploy

1. Click **Save**
2. Go to **Deployments** tab
3. Click **"Redeploy"** on the latest deployment
4. Wait for deployment to complete (~2-3 minutes)

## ✅ Verify It's Working

After redeployment, check the browser console:

1. Open your frontend app: `https://app.jabclubegy.com`
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for these logs:
   ```
   🔗 API Base URL: https://api.jabclubegy.com/api
   🔗 NEXT_PUBLIC_API_URL env: https://api.jabclubegy.com/api
   ```

If you see the correct URL, the fix worked!

## 🧪 Test API Connection

Try logging in or signing up. The API calls should now work:
- ✅ `GET /api/auth/me` should return user data (or 401 if not logged in)
- ✅ `POST /api/auth/signup` should create a new user
- ✅ `POST /api/auth/login` should authenticate the user

## 📋 Quick Reference

**Frontend Project Environment Variables:**

| Key | Value | Notes |
|-----|-------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.jabclubegy.com/api` | Backend API URL |

**Backend Project Environment Variables:**

| Key | Value | Notes |
|-----|-------|-------|
| `FRONTEND_URL` | `https://app.jabclubegy.com` | Frontend URL (for CORS) |

## 🚨 Common Mistakes

❌ **Wrong**: `NEXT_PUBLIC_API_URL=https://app.jabclubegy.com/`
✅ **Correct**: `NEXT_PUBLIC_API_URL=https://api.jabclubegy.com/api`

❌ **Wrong**: `NEXT_PUBLIC_API_URL=https://api.jabclubegy.com` (missing `/api`)
✅ **Correct**: `NEXT_PUBLIC_API_URL=https://api.jabclubegy.com/api`

❌ **Wrong**: `NEXT_PUBLIC_API_URL=http://api.jabclubegy.com/api` (not HTTPS)
✅ **Correct**: `NEXT_PUBLIC_API_URL=https://api.jabclubegy.com/api`

## 🔍 Troubleshooting

### Still seeing wrong URL in console?

1. **Hard refresh** the browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Clear browser cache**
3. **Check Vercel deployment logs** to ensure the variable was set correctly
4. **Verify** the variable is set for the correct environment (Production)

### API calls still failing?

1. Check backend is deployed and running: `https://api.jabclubegy.com/health`
2. Verify CORS is configured correctly in backend
3. Check browser Network tab for actual request URLs
4. Verify backend routes exist: `/api/auth/me`, `/api/auth/signup`, etc.

