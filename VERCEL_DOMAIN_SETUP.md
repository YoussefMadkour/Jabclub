# Vercel Custom Domain Setup Guide

This guide will help you set up custom domains for your JabClub application:
- **Frontend**: `app.jabclubegy.com`
- **Backend**: `api.jabclubegy.com`

## Prerequisites

- Domain `jabclubegy.com` registered and accessible
- DNS access to manage DNS records
- Vercel account with both frontend and backend projects deployed

---

## Step 1: Add Domains to Vercel Projects

### Frontend Project (app.jabclubegy.com)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your **frontend project**
3. Go to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter: `app.jabclubegy.com`
6. Click **Add**
7. Vercel will show you DNS records to add (see Step 2)

### Backend Project (api.jabclubegy.com)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your **backend project**
3. Go to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter: `api.jabclubegy.com`
6. Click **Add**
7. Vercel will show you DNS records to add (see Step 2)

---

## Step 2: Configure DNS Records

You need to add DNS records in your domain registrar (where you bought `jabclubegy.com`).

### Option A: Using CNAME Records (Recommended)

Add these CNAME records in your DNS provider:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | `app` | `cname.vercel-dns.com` | Auto |
| CNAME | `api` | `cname.vercel-dns.com` | Auto |

**Note:** Vercel will provide specific CNAME values. Use the exact values shown in the Vercel dashboard.

### Option B: Using A Records (If CNAME not supported)

If your DNS provider doesn't support CNAME for root/subdomains, use A records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `app` | `76.76.21.21` | Auto |
| A | `api` | `76.76.21.21` | Auto |

**Note:** Vercel's IP addresses may change. Check Vercel dashboard for current IPs.

---

## Step 3: DNS Propagation

After adding DNS records:

1. **Wait for propagation** (usually 5 minutes to 48 hours)
2. **Check DNS propagation** using:
   - [whatsmydns.net](https://www.whatsmydns.net)
   - [dnschecker.org](https://dnschecker.org)
3. **Verify in Vercel**: Go to project → Settings → Domains
   - Status should change from "Pending" to "Valid Configuration"

---

## Step 4: Update Environment Variables

After domains are verified, update your environment variables:

### Frontend Environment Variables

In Vercel Dashboard → Frontend Project → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://api.jabclubegy.com/api
```

### Backend Environment Variables

In Vercel Dashboard → Backend Project → Settings → Environment Variables:

```
FRONTEND_URL=https://app.jabclubegy.com
```

**Important:** After updating environment variables, **redeploy** both projects:
- Frontend: Settings → Deployments → Redeploy
- Backend: Settings → Deployments → Redeploy

---

## Step 5: SSL Certificate

Vercel automatically provisions SSL certificates via Let's Encrypt:
- SSL is **automatically enabled** once DNS is configured
- Certificates are **automatically renewed**
- No action needed from you

You can verify SSL in Vercel Dashboard → Settings → Domains → SSL Certificate

---

## Step 6: Verify Setup

### Test Frontend

1. Visit: `https://app.jabclubegy.com`
2. Should load your Next.js application
3. Check browser console for any CORS errors

### Test Backend

1. Visit: `https://api.jabclubegy.com/health`
2. Should return: `{"status":"ok","message":"JabClub API is running"}`
3. Visit: `https://api.jabclubegy.com/api`
4. Should return: `{"message":"JabClub API v1.0"}`

### Test Integration

1. Open `https://app.jabclubegy.com`
2. Try logging in or making an API call
3. Check browser Network tab - API calls should go to `api.jabclubegy.com`

---

## Common DNS Providers Setup

### Cloudflare

1. Log in to Cloudflare
2. Select your domain `jabclubegy.com`
3. Go to **DNS** → **Records**
4. Click **Add record**
5. For each subdomain:
   - **Type**: CNAME
   - **Name**: `app` or `api`
   - **Target**: `cname.vercel-dns.com` (or value from Vercel)
   - **Proxy status**: DNS only (gray cloud) or Proxied (orange cloud)
   - Click **Save**

### Namecheap

1. Log in to Namecheap
2. Go to **Domain List** → Click **Manage** next to `jabclubegy.com`
3. Go to **Advanced DNS** tab
4. Click **Add New Record**
5. For each subdomain:
   - **Type**: CNAME Record
   - **Host**: `app` or `api`
   - **Value**: `cname.vercel-dns.com` (or value from Vercel)
   - **TTL**: Automatic
   - Click **Save**

### GoDaddy

1. Log in to GoDaddy
2. Go to **My Products** → **DNS** next to `jabclubegy.com`
3. Scroll to **Records** section
4. Click **Add**
5. For each subdomain:
   - **Type**: CNAME
   - **Name**: `app` or `api`
   - **Value**: `cname.vercel-dns.com` (or value from Vercel)
   - **TTL**: 600 seconds
   - Click **Save**

### Google Domains

1. Log in to Google Domains
2. Click on `jabclubegy.com`
3. Go to **DNS** tab
4. Scroll to **Custom resource records**
5. For each subdomain:
   - **Name**: `app` or `api`
   - **Type**: CNAME
   - **Data**: `cname.vercel-dns.com` (or value from Vercel)
   - Click **Add**

---

## Troubleshooting

### Domain Not Resolving

1. **Check DNS records** - Verify they're correct
2. **Wait for propagation** - Can take up to 48 hours
3. **Clear DNS cache**:
   ```bash
   # macOS
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   
   # Windows
   ipconfig /flushdns
   
   # Linux
   sudo systemd-resolve --flush-caches
   ```

### SSL Certificate Issues

1. **Wait for DNS propagation** - SSL can't be issued until DNS is correct
2. **Check DNS in Vercel** - Settings → Domains → Check status
3. **Manually trigger SSL** - Vercel → Settings → Domains → SSL → Refresh

### CORS Errors

1. **Verify `FRONTEND_URL`** in backend environment variables
2. **Check backend CORS configuration** - Should allow `https://app.jabclubegy.com`
3. **Redeploy backend** after changing environment variables

### API Not Accessible

1. **Check backend deployment** - Ensure it's deployed successfully
2. **Verify API routes** - Test `/health` endpoint
3. **Check Vercel logs** - Settings → Deployments → View logs

---

## Next Steps

After domains are set up:

1. ✅ Update environment variables (Step 4)
2. ✅ Redeploy both projects
3. ✅ Test frontend and backend
4. ✅ Set up database (see `DATABASE_DEPLOYMENT.md`)
5. ✅ Configure email notifications (see `NOTIFICATION_SETUP.md`)

---

## Summary

Your final setup will be:
- **Frontend**: `https://app.jabclubegy.com` (Vercel)
- **Backend**: `https://api.jabclubegy.com` (Vercel)
- **Database**: Vercel Postgres / Supabase / Railway (see `DATABASE_DEPLOYMENT.md`)
- **Main Domain**: `https://jabclubegy.com` (can redirect to app subdomain)


