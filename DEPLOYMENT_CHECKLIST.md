# JabClub Deployment Checklist

Complete deployment checklist for `jabclubegy.com` with custom subdomains.

## Domain Setup
- **Frontend**: `app.jabclubegy.com`
- **Backend**: `api.jabclubegy.com`
- **Main Domain**: `jabclubegy.com` (can redirect to app subdomain)

---

## ✅ Pre-Deployment Checklist

### 1. Database Setup
- [ ] Choose database provider:
  - [ ] **Vercel Postgres** (easiest with Vercel)
  - [ ] **Supabase** (recommended - better free tier)
  - [ ] **Railway Postgres** (simple setup)
  - [ ] **Neon** (serverless option)
- [ ] Create database instance
- [ ] Copy connection string
- [ ] Update `DATABASE_URL` in backend `.env.production`
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Generate Prisma client: `npx prisma generate`

**📖 See:** `DATABASE_DEPLOYMENT.md` for detailed instructions

### 2. Environment Variables Setup

#### Backend Environment Variables (Vercel)
Add these in Vercel Dashboard → Backend Project → Settings → Environment Variables:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=406d9a247dbdf8c3b01fdc6c134d3c8b67c633fc90fc36dfca388ede2da24c54
JWT_EXPIRES_IN=24h
SESSION_SECRET=2a18ee1b1de5df9fb2979feacd1627eb2197a7205fc10ceb6c73b12a8fd10aad04a6c6ce684d3d8003ba0975efc869d36fdc5a3b7039f0d3bea4def085799fa6
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://app.jabclubegy.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
```

#### Frontend Environment Variables (Vercel)
Add these in Vercel Dashboard → Frontend Project → Settings → Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://api.jabclubegy.com/api
```

**📝 Note:** Update `SMTP_USER` and `SMTP_PASSWORD` with your Gmail credentials.

---

## ✅ Deployment Steps

### Step 1: Deploy Backend to Vercel

1. [ ] Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. [ ] Click **Add New Project**
3. [ ] Import `YoussefMadkour/Jabclub` repository
4. [ ] Configure:
   - **Root Directory**: `backend`
   - **Framework Preset**: Other
   - **Build Command**: Leave empty (or `npm run build`)
   - **Output Directory**: Leave empty
5. [ ] Add all backend environment variables (see above)
6. [ ] Click **Deploy**
7. [ ] Wait for deployment to complete
8. [ ] Note the deployment URL (e.g., `jabclub-backend.vercel.app`)

### Step 2: Deploy Frontend to Vercel

1. [ ] Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. [ ] Click **Add New Project**
3. [ ] Import `YoussefMadkour/Jabclub` repository
4. [ ] Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
5. [ ] Add frontend environment variable:
   - `NEXT_PUBLIC_API_URL=https://api.jabclubegy.com/api` (update after domain setup)
6. [ ] Click **Deploy**
7. [ ] Wait for deployment to complete
8. [ ] Note the deployment URL (e.g., `jabclub-frontend.vercel.app`)

### Step 3: Set Up Custom Domains

1. [ ] **Frontend Domain** (`app.jabclubegy.com`):
   - Go to Frontend Project → Settings → Domains
   - Add `app.jabclubegy.com`
   - Copy the CNAME value shown

2. [ ] **Backend Domain** (`api.jabclubegy.com`):
   - Go to Backend Project → Settings → Domains
   - Add `api.jabclubegy.com`
   - Copy the CNAME value shown

3. [ ] **Configure DNS** (in your domain registrar):
   - Add CNAME record: `app` → `[vercel-cname-value]`
   - Add CNAME record: `api` → `[vercel-cname-value]`
   - Wait for DNS propagation (5 min - 48 hours)

4. [ ] **Verify domains** in Vercel:
   - Check domain status shows "Valid Configuration"
   - SSL certificates will be automatically issued

**📖 See:** `VERCEL_DOMAIN_SETUP.md` for detailed instructions

### Step 4: Update Environment Variables After Domain Setup

1. [ ] **Backend**: Update `FRONTEND_URL` to `https://app.jabclubegy.com`
2. [ ] **Frontend**: Update `NEXT_PUBLIC_API_URL` to `https://api.jabclubegy.com/api`
3. [ ] **Redeploy both projects** after updating environment variables

---

## ✅ Post-Deployment Verification

### Backend Verification
- [ ] Visit `https://api.jabclubegy.com/health`
  - Should return: `{"status":"ok","message":"JabClub API is running"}`
- [ ] Visit `https://api.jabclubegy.com/api`
  - Should return: `{"message":"JabClub API v1.0"}`
- [ ] Check Vercel logs for any errors

### Frontend Verification
- [ ] Visit `https://app.jabclubegy.com`
  - Should load the Next.js application
- [ ] Check browser console for errors
- [ ] Test login functionality
- [ ] Verify API calls go to `api.jabclubegy.com`

### Database Verification
- [ ] Run: `npx prisma studio` (locally with DATABASE_URL set)
- [ ] Verify tables are created
- [ ] Check migrations are applied: `npx prisma migrate status`

### Email Verification
- [ ] Test signup flow - should receive welcome email
- [ ] Test package approval - should receive receipt email
- [ ] Check SMTP logs in Vercel

---

## ✅ Security Checklist

- [ ] All secrets are in environment variables (not in code)
- [ ] `.env` files are in `.gitignore` (already done)
- [ ] SSL certificates are active (automatic with Vercel)
- [ ] CORS is configured correctly (`FRONTEND_URL` set)
- [ ] Database connection uses SSL
- [ ] Gmail App Password is set (not regular password)
- [ ] Admin password changed from default (if seeded)

---

## ✅ Monitoring & Maintenance

### Set Up Monitoring
- [ ] Enable Vercel Analytics (optional)
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor database usage
- [ ] Set up uptime monitoring

### Regular Tasks
- [ ] Monitor Vercel deployment logs
- [ ] Check database storage usage
- [ ] Review error logs weekly
- [ ] Update dependencies monthly
- [ ] Backup database regularly (if not automatic)

---

## 🆘 Troubleshooting

### Common Issues

**Domain not resolving:**
- Check DNS records are correct
- Wait for DNS propagation
- Verify in Vercel dashboard

**CORS errors:**
- Verify `FRONTEND_URL` in backend env vars
- Check backend CORS configuration
- Redeploy backend after changes

**Database connection errors:**
- Verify `DATABASE_URL` is correct
- Check database is accessible
- Verify SSL is enabled

**Email not sending:**
- Check Gmail App Password is correct
- Verify SMTP settings
- Check Vercel logs for errors

**Build failures:**
- Check Vercel build logs
- Verify all dependencies are in `package.json`
- Check TypeScript errors

---

## 📚 Reference Documents

- `DATABASE_DEPLOYMENT.md` - Database setup guide
- `VERCEL_DOMAIN_SETUP.md` - Custom domain configuration
- `NOTIFICATION_SETUP.md` - Email configuration
- `README.md` - General project documentation

---

## 🎉 You're Done!

Once all checkboxes are complete:
- ✅ Frontend: `https://app.jabclubegy.com`
- ✅ Backend: `https://api.jabclubegy.com`
- ✅ Database: Connected and migrated
- ✅ Email: Configured and tested
- ✅ SSL: Active on all domains

Your JabClub application is live! 🥊


