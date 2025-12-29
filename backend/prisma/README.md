# Prisma Database Schema

This directory contains the Prisma schema, migrations, and seed data for the JabClub booking system.

## Files

- `schema.prisma` - Main Prisma schema defining all models, enums, and relationships
- `seed.ts` - Seed script to populate initial data
- `schema.sql` - SQL documentation of the database structure
- `migrations/` - Directory containing all database migrations (created after first migration)

## Database Models

### Core Models

1. **User** - Members, coaches, and admins
2. **Child** - Child profiles linked to member accounts
3. **SessionPackage** - Package templates (e.g., "10 sessions for $90")
4. **MemberPackage** - Purchased packages with remaining credits
5. **Payment** - Payment records with screenshot uploads
6. **Location** - Gym locations
7. **ClassType** - Types of classes (e.g., "Beginner Boxing")
8. **ClassInstance** - Scheduled class sessions
9. **Booking** - Class reservations
10. **CreditTransaction** - Audit log of all credit changes

### Enums

- `UserRole`: member, coach, admin
- `PaymentStatus`: pending, approved, rejected
- `BookingStatus`: confirmed, cancelled, attended, no_show
- `TransactionType`: purchase, booking, refund, expiry

## Key Relationships

```
User (Member)
  ├── Children (1:many)
  ├── MemberPackages (1:many)
  │   └── Bookings (1:many)
  ├── Payments (1:many)
  └── CreditTransactions (1:many)

ClassInstance
  ├── ClassType (many:1)
  ├── Coach/User (many:1)
  ├── Location (many:1)
  └── Bookings (1:many)

Booking
  ├── User (many:1)
  ├── Child (many:1, optional)
  ├── ClassInstance (many:1)
  ├── MemberPackage (many:1)
  └── CreditTransactions (1:many)
```

## Indexes

Performance indexes are created on:
- `bookings.user_id` - Fast lookup of user's bookings
- `bookings.class_instance_id` - Fast lookup of class attendees
- `class_instances.start_time` - Fast filtering by date/time
- `payments.status` - Fast filtering of pending payments
- `member_packages.user_id` - Fast lookup of user's packages
- `member_packages.expiry_date, is_expired` - Fast expiry checks

## Constraints

### Unique Constraints
- `users.email` - One account per email
- `bookings(class_instance_id, user_id, child_id)` - Prevent duplicate bookings

### Cascade Deletes
- Deleting a user cascades to their children, packages, bookings, and transactions
- Deleting a class instance cascades to its bookings
- Deleting a child cascades to their bookings

## Running Migrations

### Development
```bash
npm run prisma:migrate
```

This will:
1. Create a new migration
2. Apply it to the database
3. Regenerate Prisma Client
4. Run the seed script

### Production
```bash
npx prisma migrate deploy
```

This applies pending migrations without prompting.

## Seeding

The seed script creates:
- 3 test users (admin, coach, member)
- 3 locations
- 4 class types
- 4 session packages

Run manually:
```bash
npm run prisma:seed
```

## Schema Changes

When modifying the schema:

1. Edit `schema.prisma`
2. Run `npm run prisma:migrate` to create a migration
3. Name the migration descriptively (e.g., "add_waitlist_table")
4. Commit both the schema and migration files

## Prisma Studio

View and edit data in a GUI:
```bash
npm run prisma:studio
```

Opens at http://localhost:5555
