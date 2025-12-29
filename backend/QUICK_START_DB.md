# Quick Start - Database Setup

## TL;DR

```bash
cd backend

# Option 1: Automated setup (recommended)
./scripts/setup-db.sh

# Option 2: Manual setup
createdb jabclub
npm run prisma:generate
npm run prisma:migrate
```

## What You Get

✅ Complete database schema with 10 tables  
✅ Performance indexes  
✅ Test users (admin, coach, member)  
✅ Sample locations and class types  
✅ 4 session packages ready to use  

## Test Credentials

```
Admin:  admin@jabclub.com  / admin123
Coach:  coach@jabclub.com  / coach123
Member: member@jabclub.com / member123
```

## View Your Data

```bash
npm run prisma:studio
```

Opens at http://localhost:5555

## Common Commands

```bash
# Generate Prisma Client (after schema changes)
npm run prisma:generate

# Create and apply migration
npm run prisma:migrate

# Re-seed database
npm run prisma:seed

# Reset database (⚠️ destroys all data)
npx prisma migrate reset
```

## Need Help?

- Full setup guide: `DATABASE_SETUP.md`
- Schema documentation: `prisma/README.md`
- Migration details: `MIGRATION_SUMMARY.md`

## Troubleshooting

**PostgreSQL not running?**
```bash
# macOS
brew services start postgresql@14

# Linux
sudo systemctl start postgresql
```

**Database connection error?**
- Check your `.env` file has correct `DATABASE_URL`
- Verify PostgreSQL is running: `pg_isready`
- Ensure database exists: `psql -l | grep jabclub`
