# Vercel Postgres Setup Guide - Step by Step

## Step 1: Create Vercel Postgres Database

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Make sure you're logged in

2. **Navigate to Storage**
   - In the top navigation, click on **"Storage"** tab
   - Or go directly to: https://vercel.com/dashboard/storage

3. **Create Postgres Database**
   - Click the **"Create Database"** button
   - Select **"Postgres"** from the options
   - You might see a popup or modal

4. **Configure Database**
   - **Name**: Enter `jabclub-db` (or any name you prefer)
   - **Region**: Choose the region closest to your users
     - For Egypt/Middle East: Choose `eu-west-1` (Ireland) or `eu-central-1` (Frankfurt)
     - For US: Choose `us-east-1` (Virginia)
   - **Plan**: Select **Hobby** (Free tier - 256 MB storage)
   - Click **"Create"**

5. **Wait for Database Creation**
   - This takes about 1-2 minutes
   - You'll see a loading indicator

6. **Get Connection String**
   - Once created, click on your database (`jabclub-db`)
   - Go to **"Settings"** tab
   - Find **"Connection String"** section
   - You'll see:
     - **POSTGRES_URL** (this is what you need!)
     - **POSTGRES_PRISMA_URL** (for Prisma)
     - **POSTGRES_URL_NON_POOLING** (for migrations)
   
   **Copy the `POSTGRES_URL`** - it looks like:
   ```
   postgres://default:xxxxx@xxxxx.vercel-storage.com:5432/verceldb
   ```

## Step 2: Deploy Backend to Vercel

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard

2. **Create New Project**
   - Click **"Add New..."** button (top right)
   - Select **"Project"**

3. **Import Repository**
   - You'll see a list of your GitHub repositories
   - Find and click on **"Jabclub"** (or `YoussefMadkour/Jabclub`)
   - Click **"Import"**

4. **Configure Project**
   - **Project Name**: `jabclub-backend` (or any name)
   - **Root Directory**: Click **"Edit"** and change to `backend`
   - **Framework Preset**: Select **"Other"** (or leave as auto-detected)
   - **Build Command**: Leave empty (or use `npm run build`)
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install` (default)

5. **Add Environment Variables**
   - Scroll down to **"Environment Variables"** section
   - Click **"Add"** for each variable below:

   **Required Variables:**
   
   | Key | Value | Notes |
   |-----|-------|-------|
   | `DATABASE_URL` | `[Paste your POSTGRES_URL from Step 1]` | The connection string you copied |
   | `JWT_SECRET` | `406d9a247dbdf8c3b01fdc6c134d3c8b67c633fc90fc36dfca388ede2da24c54` | Already generated |
   | `JWT_EXPIRES_IN` | `24h` | Token expiration |
   | `SESSION_SECRET` | `2a18ee1b1de5df9fb2979feacd1627eb2197a7205fc10ceb6c73b12a8fd10aad04a6c6ce684d3d8003ba0975efc869d36fdc5a3b7039f0d3bea4def085799fa6` | Already generated |
   | `PORT` | `5000` | Server port |
   | `NODE_ENV` | `production` | Environment |
   | `FRONTEND_URL` | `https://app.jabclubegy.com` | Frontend URL (update after domain setup) |
   | `UPLOAD_DIR` | `./uploads` | Upload directory |
   | `MAX_FILE_SIZE` | `5242880` | Max file size (5MB) |
   | `SMTP_HOST` | `smtp.gmail.com` | Gmail SMTP |
   | `SMTP_PORT` | `587` | SMTP port |
   | `SMTP_SECURE` | `false` | TLS (not SSL) |
   | `SMTP_USER` | `your-email@gmail.com` | **UPDATE THIS** - Your Gmail |
   | `SMTP_PASSWORD` | `your-app-password` | **UPDATE THIS** - Gmail App Password |

   **Important:**
   - For `SMTP_USER`: Use your actual Gmail address
   - For `SMTP_PASSWORD`: Generate Gmail App Password at https://myaccount.google.com/apppasswords
   - Make sure to select **"Production"** environment for all variables

6. **Deploy**
   - Click **"Deploy"** button (bottom right)
   - Wait for deployment to complete (2-5 minutes)
   - You'll see build logs in real-time

## Step 3: Run Database Migrations

After the backend is deployed, you need to run Prisma migrations to create the database tables.

### Option A: Using Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Link to your project**:
   ```bash
   cd backend
   vercel link
   ```
   - Select your Vercel team
   - Select `jabclub-backend` project
   - Use default settings

4. **Pull environment variables**:
   ```bash
   vercel env pull .env.production.local
   ```

5. **Run migrations**:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

### Option B: Using Vercel Build Command

1. **Go to Vercel Dashboard**
   - Open your `jabclub-backend` project
   - Go to **Settings** → **Build & Development Settings**

2. **Update Build Command**:
   - Find **"Build Command"** field
   - Change to: `npx prisma generate && npx prisma migrate deploy`
   - Click **"Save"**

3. **Redeploy**:
   - Go to **Deployments** tab
   - Click **"Redeploy"** on the latest deployment
   - This will run migrations automatically

## Step 4: Test Backend

1. **Get your backend URL**:
   - In Vercel Dashboard → Your Backend Project
   - You'll see the deployment URL (e.g., `jabclub-backend.vercel.app`)

2. **Test Health Endpoint**:
   - Visit: `https://your-backend-url.vercel.app/health`
   - Should return: `{"status":"ok","message":"JabClub API is running"}`

3. **Test API Endpoint**:
   - Visit: `https://your-backend-url.vercel.app/api`
   - Should return: `{"message":"JabClub API v1.0"}`

## Step 5: Update Frontend Environment Variable

1. **Go to Frontend Project**:
   - Vercel Dashboard → Your Frontend Project
   - Go to **Settings** → **Environment Variables**

2. **Update API URL**:
   - Find `NEXT_PUBLIC_API_URL`
   - Update value to: `https://your-backend-url.vercel.app/api`
   - Or wait until you set up custom domain: `https://api.jabclubegy.com/api`

3. **Redeploy Frontend**:
   - Go to **Deployments** tab
   - Click **"Redeploy"** on latest deployment

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check database is created and active in Vercel Storage
- Ensure SSL is enabled (Vercel Postgres uses SSL by default)

### Migration Issues
- Make sure Prisma is installed: `npm install prisma @prisma/client`
- Check `DATABASE_URL` is accessible
- Try using `POSTGRES_URL_NON_POOLING` for migrations

### Build Failures
- Check Vercel build logs for errors
- Verify all environment variables are set
- Ensure `backend/package.json` has correct dependencies

## Next Steps

After backend is deployed and tested:
1. ✅ Set up custom domains (`app.jabclubegy.com` and `api.jabclubegy.com`)
2. ✅ Configure Gmail App Password for email notifications
3. ✅ Test full application flow (signup, login, booking)


