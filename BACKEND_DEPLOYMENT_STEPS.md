# Backend Deployment Steps - Quick Guide

## Environment Variables to Add in Vercel

Copy these into Vercel Dashboard → Your Backend Project → Settings → Environment Variables:

```env
# Database (REPLACE WITH YOUR ACTUAL DATABASE URL)
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public

# JWT & Session Secrets (Already generated - use these)
JWT_SECRET=406d9a247dbdf8c3b01fdc6c134d3c8b67c633fc90fc36dfca388ede2da24c54
JWT_EXPIRES_IN=24h
SESSION_SECRET=2a18ee1b1de5df9fb2979feacd1627eb2197a7205fc10ceb6c73b12a8fd10aad04a6c6ce684d3d8003ba0975efc869d36fdc5a3b7039f0d3bea4def085799fa6

# Server Configuration
PORT=5000
NODE_ENV=production

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# CORS - Frontend URL (Update after frontend domain is set up)
FRONTEND_URL=https://app.jabclubegy.com

# Email (SMTP) - UPDATE WITH YOUR GMAIL CREDENTIALS
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
```

## Important Notes:

1. **DATABASE_URL**: Replace with your actual database connection string from Vercel Postgres or Supabase
2. **SMTP_USER**: Your Gmail address
3. **SMTP_PASSWORD**: Your Gmail App Password (16 characters, no spaces)
   - Generate at: https://myaccount.google.com/apppasswords
4. **FRONTEND_URL**: Update this after you set up the custom domain `app.jabclubegy.com`

## After Deployment:

1. **Run Database Migrations**:
   - Go to your backend project in Vercel
   - Go to Settings → Build & Development Settings
   - Add Build Command: `npx prisma generate && npx prisma migrate deploy`
   - Or use Vercel CLI locally:
     ```bash
     vercel env pull .env.production.local
     npx prisma migrate deploy
     ```

2. **Test Backend**:
   - Visit: `https://your-backend-url.vercel.app/health`
   - Should return: `{"status":"ok","message":"JabClub API is running"}`

3. **Update Frontend Environment Variable**:
   - Go to Frontend Project → Settings → Environment Variables
   - Update `NEXT_PUBLIC_API_URL` to your backend URL
   - Redeploy frontend


