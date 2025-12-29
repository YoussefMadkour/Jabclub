# Database Setup Guide

## Prerequisites

- PostgreSQL 14+ installed and running
- Node.js 18+ installed

## Setup Steps

### 1. Start PostgreSQL

Make sure PostgreSQL is running on your system:

**macOS (Homebrew):**
```bash
brew services start postgresql@14
```

**Linux:**
```bash
sudo systemctl start postgresql
```

**Windows:**
Start PostgreSQL from Services or pgAdmin

### 2. Create Database

Connect to PostgreSQL and create the database:

```bash
psql -U postgres
```

Then run:
```sql
CREATE DATABASE jabclub;
\q
```

### 3. Configure Environment Variables

Update the `backend/.env` file with your database credentials:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/jabclub?schema=public"
```

Replace `username` and `password` with your PostgreSQL credentials.

### 4. Run Migrations

Generate Prisma Client and run migrations:

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

This will:
- Create all database tables
- Set up indexes
- Run the seed script automatically

### 5. Verify Setup

Check that tables were created:

```bash
npm run prisma:studio
```

This opens Prisma Studio in your browser where you can view the database.

## Seed Data

The migration automatically seeds the database with:

### Test Users
- **Admin**: admin@jabclub.com / admin123
- **Coach**: coach@jabclub.com / coach123
- **Member**: member@jabclub.com / member123

### Locations
- Downtown Studio (capacity: 20)
- Westside Gym (capacity: 15)
- Eastside Arena (capacity: 25)

### Class Types
- Beginner Boxing (60 min)
- Advanced Boxing (90 min)
- Cardio Boxing (45 min)
- Kids Boxing (45 min)

### Session Packages
- Starter Pack: 5 sessions, $50, 30 days
- Regular Pack: 10 sessions, $90, 60 days
- Premium Pack: 20 sessions, $160, 90 days
- Unlimited Monthly: 30 sessions, $200, 30 days

## Manual Seed (if needed)

If you need to re-seed the database:

```bash
npm run prisma:seed
```

## Troubleshooting

### Connection Issues

If you get "Can't reach database server" error:
1. Verify PostgreSQL is running: `pg_isready`
2. Check your DATABASE_URL in .env
3. Ensure the database exists: `psql -U postgres -l`

### Migration Issues

To reset the database (⚠️ destroys all data):
```bash
npm run prisma:migrate -- reset
```

### Permission Issues

If you get permission errors:
```sql
GRANT ALL PRIVILEGES ON DATABASE jabclub TO your_username;
```

## Production Deployment

For Hostinger deployment:

1. Create PostgreSQL database in Hostinger control panel
2. Update DATABASE_URL with Hostinger credentials
3. Run migrations:
   ```bash
   npm run prisma:migrate -- deploy
   ```
4. Run seed:
   ```bash
   npm run prisma:seed
   ```
