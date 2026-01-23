# Database Deployment Guide for JabClub

## Recommended Database Hosting Options

For production, use a managed PostgreSQL service. Here are the best options:

### 1. **Vercel Postgres** (Recommended if using Vercel) ⭐

**Pros:**
- Integrated with Vercel dashboard
- Easy to set up
- Automatic backups
- Free tier available (256 MB storage)

**Setup Steps:**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your **backend project**
3. Go to **Storage** tab → **Create Database** → **Postgres**
4. Choose a name (e.g., `jabclub-db`)
5. Select region closest to your users
6. Click **Create**
7. Copy the **Connection String** (it will be automatically added as `POSTGRES_URL`)

**Connection String Format:**
```
postgres://default:password@host.vercel-storage.com:5432/verceldb
```

**Update your `.env.production`:**
```env
DATABASE_URL="postgres://default:password@host.vercel-storage.com:5432/verceldb"
```

**Run Migrations:**
```bash
# In Vercel, add a build command or use Vercel CLI:
npx prisma migrate deploy
npx prisma generate
```

---

### 2. **Supabase** (Highly Recommended) ⭐⭐

**Pros:**
- Free tier: 500 MB database, 2 GB bandwidth
- Great developer experience
- Built-in dashboard and SQL editor
- Automatic backups
- Easy to scale

**Setup Steps:**

1. Go to [Supabase](https://supabase.com)
2. Sign up / Log in
3. Click **New Project**
4. Fill in:
   - **Name**: `jabclub-production`
   - **Database Password**: (generate a strong password)
   - **Region**: Choose closest to your users
5. Click **Create new project**
6. Wait for project to be ready (~2 minutes)
7. Go to **Settings** → **Database**
8. Copy the **Connection String** (URI format)

**Connection String Format:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Update your `.env.production`:**
```env
DATABASE_URL="postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres"
```

**Run Migrations:**
```bash
# Using Supabase CLI (recommended)
npx supabase db push

# Or using Prisma directly
npx prisma migrate deploy
npx prisma generate
```

---

### 3. **Railway Postgres**

**Pros:**
- Simple setup
- $5/month for 1 GB storage
- Good performance
- Easy scaling

**Setup Steps:**

1. Go to [Railway](https://railway.app)
2. Sign up / Log in
3. Click **New Project** → **Deploy from GitHub**
4. Select your repository
5. Click **+ New** → **Database** → **Postgres**
6. Railway will automatically create the database
7. Click on the Postgres service
8. Go to **Variables** tab
9. Copy the **DATABASE_URL** value

**Update your `.env.production`:**
```env
DATABASE_URL="postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway"
```

**Run Migrations:**
```bash
# In Railway, add a deploy command:
npx prisma migrate deploy && npx prisma generate
```

---

### 4. **Neon** (Serverless Postgres)

**Pros:**
- Serverless (scales to zero)
- Free tier: 0.5 GB storage
- Fast setup
- Great for serverless deployments

**Setup Steps:**

1. Go to [Neon](https://neon.tech)
2. Sign up / Log in
3. Click **Create Project**
4. Fill in project details
5. Copy the **Connection String**

**Update your `.env.production`:**
```env
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb"
```

---

## Migration Steps (After Database Setup)

### Option 1: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to your project
cd backend
vercel link

# Run migrations
vercel env pull .env.production.local
npx prisma migrate deploy
npx prisma generate
```

### Option 2: Using Prisma Migrate Deploy

```bash
cd backend

# Set DATABASE_URL environment variable
export DATABASE_URL="your-connection-string"

# Deploy migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### Option 3: Using Vercel Build Command

Add to your `backend/package.json`:

```json
{
  "scripts": {
    "vercel-build": "prisma generate && prisma migrate deploy"
  }
}
```

Then in Vercel dashboard, set **Build Command** to: `npm run vercel-build`

---

## Recommended Choice

**For Vercel Deployment:** Use **Vercel Postgres** (easiest integration) or **Supabase** (better free tier, more features)

**For Production:** **Supabase** is recommended due to:
- Better free tier
- More features (auth, storage, real-time)
- Excellent documentation
- Easy to scale

---

## Security Best Practices

1. **Never commit `.env` files** - They're already in `.gitignore`
2. **Use strong passwords** - Generate random passwords for database
3. **Enable SSL** - Most providers enable SSL by default
4. **Use connection pooling** - For serverless functions (Vercel, Supabase handle this)
5. **Regular backups** - Most providers offer automatic backups

---

## Troubleshooting

### Connection Issues

1. **Check firewall rules** - Ensure your IP is whitelisted (if required)
2. **Verify connection string** - Make sure it's correct
3. **Check SSL mode** - Some providers require `?sslmode=require`

### Migration Issues

1. **Reset database** (development only):
   ```bash
   npx prisma migrate reset
   ```

2. **Check migration status**:
   ```bash
   npx prisma migrate status
   ```

3. **View database**:
   ```bash
   npx prisma studio
   ```


