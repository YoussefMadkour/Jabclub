# Database Migration Summary

## Overview

This document summarizes the database schema implementation for the JabClub booking system.

## What Was Created

### 1. Prisma Schema (`prisma/schema.prisma`)

Complete database schema with:
- **10 models** (User, Child, SessionPackage, MemberPackage, Payment, Location, ClassType, ClassInstance, Booking, CreditTransaction)
- **4 enums** (UserRole, PaymentStatus, BookingStatus, TransactionType)
- **6 performance indexes** for optimized queries
- **Proper relationships** with cascade deletes where appropriate
- **Unique constraints** to prevent duplicate data

### 2. Seed Script (`prisma/seed.ts`)

Populates the database with initial data:
- 3 test users (admin, coach, member) with hashed passwords
- 3 gym locations
- 4 class types (Beginner, Advanced, Cardio, Kids)
- 4 session packages (Starter, Regular, Premium, Unlimited)

### 3. Documentation

- `DATABASE_SETUP.md` - Step-by-step setup guide
- `prisma/README.md` - Schema documentation and usage
- `prisma/schema.sql` - SQL reference of the schema
- `MIGRATION_SUMMARY.md` - This file

### 4. Setup Script (`scripts/setup-db.sh`)

Interactive bash script to:
- Check PostgreSQL installation and status
- Create the database
- Update .env with connection string
- Run migrations and seed data

## Database Structure

### Tables Created

1. **users** - Authentication and user profiles
   - Stores members, coaches, and admins
   - Password hashing with bcrypt
   - Role-based access control

2. **children** - Child profiles for family bookings
   - Linked to parent user
   - Cascade delete when parent is deleted

3. **session_packages** - Package templates
   - Defines available packages for purchase
   - Can be activated/deactivated

4. **member_packages** - Purchased packages
   - Tracks remaining credits
   - Expiry date management
   - Links to bookings

5. **payments** - Payment records
   - Screenshot upload path
   - Approval workflow (pending → approved/rejected)
   - Links to reviewing admin

6. **locations** - Gym locations
   - Address and capacity information
   - Can be activated/deactivated

7. **class_types** - Class templates
   - Name, description, duration
   - Used to create class instances

8. **class_instances** - Scheduled classes
   - Specific date/time/location
   - Assigned coach
   - Capacity management

9. **bookings** - Class reservations
   - Links user/child to class instance
   - Status tracking (confirmed, cancelled, attended, no_show)
   - Unique constraint prevents double booking

10. **credit_transactions** - Audit log
    - Records all credit changes
    - Links to bookings for traceability
    - Immutable transaction history

### Indexes for Performance

```sql
-- Fast user booking lookups
CREATE INDEX idx_bookings_user ON bookings(user_id);

-- Fast class roster lookups
CREATE INDEX idx_bookings_class ON bookings(class_instance_id);

-- Fast schedule filtering
CREATE INDEX idx_class_instances_time ON class_instances(start_time);

-- Fast pending payment queries
CREATE INDEX idx_payments_status ON payments(status);

-- Fast user package lookups
CREATE INDEX idx_member_packages_user ON member_packages(user_id);

-- Fast expiry checks
CREATE INDEX idx_member_packages_expiry ON member_packages(expiry_date, is_expired);
```

## Requirements Coverage

This implementation satisfies the following requirements:

- **1.1, 1.2** - User authentication with email/password
- **2.1** - Member dashboard data (credits, bookings)
- **3.1** - Session package purchase
- **4.1** - Payment approval system
- **5.1** - Class schedule browsing
- **6.1** - Class booking with credits
- **8.1** - Children profile management
- **10.1** - Credit expiry tracking
- **13.1** - Admin booking management
- **14.1** - Schedule and location management
- **15.1** - Package management

## How to Use

### First Time Setup

1. **Ensure PostgreSQL is running:**
   ```bash
   # macOS
   brew services start postgresql@14
   
   # Linux
   sudo systemctl start postgresql
   ```

2. **Run the setup script:**
   ```bash
   cd backend
   ./scripts/setup-db.sh
   ```

3. **Or manually:**
   ```bash
   # Create database
   createdb jabclub
   
   # Update .env with your credentials
   # DATABASE_URL="postgresql://user:pass@localhost:5432/jabclub?schema=public"
   
   # Run migrations
   npm run prisma:generate
   npm run prisma:migrate
   ```

### Subsequent Migrations

When the schema changes:

```bash
npm run prisma:migrate
```

This will:
1. Detect schema changes
2. Create a new migration file
3. Apply the migration
4. Regenerate Prisma Client

### Viewing Data

```bash
npm run prisma:studio
```

Opens a web interface at http://localhost:5555

## Test Data

After seeding, you can log in with:

| Role   | Email                  | Password  |
|--------|------------------------|-----------|
| Admin  | admin@jabclub.com      | admin123  |
| Coach  | coach@jabclub.com      | coach123  |
| Member | member@jabclub.com     | member123 |

## Next Steps

With the database schema in place, you can now:

1. ✅ Use Prisma Client in your application code
2. ✅ Implement authentication endpoints
3. ✅ Build booking logic with credit management
4. ✅ Create payment approval workflows
5. ✅ Develop the member dashboard
6. ✅ Build coach and admin portals

## Troubleshooting

### "Can't reach database server"
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in .env
- Ensure database exists: `psql -l`

### "Migration failed"
- Check for syntax errors in schema.prisma
- Ensure no conflicting migrations
- Try: `npx prisma migrate reset` (⚠️ destroys data)

### "Seed failed"
- Check bcrypt is installed: `npm list bcrypt`
- Verify database is empty or has compatible data
- Run manually: `npm run prisma:seed`

## Production Deployment

For Hostinger:

1. Create PostgreSQL database in control panel
2. Update DATABASE_URL with production credentials
3. Deploy migrations:
   ```bash
   npx prisma migrate deploy
   ```
4. Seed production data:
   ```bash
   npm run prisma:seed
   ```

## Schema Diagram

```
┌─────────────┐
│    User     │
│  (member/   │
│   coach/    │
│   admin)    │
└──────┬──────┘
       │
       ├──────────┐
       │          │
       ▼          ▼
┌──────────┐  ┌─────────────┐
│  Child   │  │MemberPackage│
└──────────┘  └──────┬──────┘
       │             │
       │             ▼
       │      ┌──────────────┐
       │      │   Booking    │◄────┐
       │      └──────┬───────┘     │
       │             │              │
       └─────────────┘              │
                                    │
                            ┌───────┴──────┐
                            │ClassInstance │
                            └──────────────┘
```
