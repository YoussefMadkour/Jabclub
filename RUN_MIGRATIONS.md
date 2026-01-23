# How to Run Database Migrations

## ✅ Current Status

**Migrations have NOT been run yet.** You need to run them manually.

## 🚀 Option 1: Using Vercel CLI (Recommended)

This is the safest way to run migrations.

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Navigate to Backend Directory
```bash
cd backend
```

### Step 4: Link to Your Vercel Project
```bash
vercel link
```
- Select your Vercel team
- Select `jabclub-api-backend` (or your backend project name)
- Use default settings

### Step 5: Pull Environment Variables
```bash
vercel env pull .env.production.local
```
This creates a `.env.production.local` file with your production environment variables.

### Step 6: Run Migrations
```bash
npx prisma migrate deploy
```

This will:
- ✅ Apply all pending migrations to your production database
- ✅ Create all tables (users, packages, bookings, payments, etc.)
- ✅ Set up indexes and constraints

### Step 7: Verify Migrations
```bash
npx prisma migrate status
```

You should see:
```
✅ Database schema is up to date!
```

## 🔧 Option 2: Add to Build Command (Not Recommended)

⚠️ **Warning**: This can cause build failures if migrations fail.

1. Go to Vercel Dashboard → Your Backend Project
2. Settings → Build & Development Settings
3. Update Build Command to:
   ```
   prisma generate && prisma migrate deploy && npm run build
   ```
4. Click Save
5. Redeploy

**Note**: This approach is not recommended because:
- Build failures if migrations fail
- Migrations run on every deployment (slow)
- Harder to debug migration issues

## 📋 What Migrations Will Be Applied

Your migrations folder contains:
1. `20251111222827_init` - Initial schema (users, packages, bookings, etc.)
2. `20251213112203_add_member_package_prices` - Member-specific pricing
3. `20251213114053_add_member_status_fields` - Member status fields
4. `20251213114452_add_vat_to_payments` - VAT fields for payments
5. `20251213141653_add_vat_to_location_package_prices` - VAT for location prices
6. `20251213141852_add_vat_to_session_packages` - VAT for session packages
7. `20251213144857_add_class_schedules` - Class schedules

## ✅ After Running Migrations

1. **Test Database Connection**:
   ```bash
   npx prisma studio
   ```
   This opens a visual database browser.

2. **Verify Tables Created**:
   - Users table
   - SessionPackages table
   - MemberPackages table
   - Bookings table
   - Payments table
   - Locations table
   - ClassSchedules table
   - etc.

3. **Test API Endpoints**:
   - `GET /health` - Should work
   - `POST /api/auth/register` - Should create users
   - `GET /api/members/packages` - Should return packages

## 🚨 Troubleshooting

### Error: "Can't reach database server"
- Verify `DATABASE_URL` is correct in Vercel environment variables
- Check database is active in Vercel Storage dashboard
- Ensure SSL is enabled (Vercel Postgres uses SSL by default)

### Error: "Migration already applied"
- This is OK - means migrations were already run
- Check status: `npx prisma migrate status`

### Error: "Connection pool timeout"
- Vercel Postgres has connection limits
- Use `POSTGRES_URL_NON_POOLING` for migrations if available
- Or run migrations during off-peak hours

### Error: "Migration failed"
- Check migration SQL files for syntax errors
- Verify database permissions
- Check Vercel logs for detailed error messages

## 📝 Quick Reference

```bash
# Check migration status
npx prisma migrate status

# Run migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Open database browser
npx prisma studio
```

