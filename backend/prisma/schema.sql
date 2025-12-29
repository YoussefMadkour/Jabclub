-- JabClub Database Schema
-- This file documents the database structure that will be created by Prisma migrations

-- Enums
CREATE TYPE "UserRole" AS ENUM ('member', 'coach', 'admin');
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE "BookingStatus" AS ENUM ('confirmed', 'cancelled', 'attended', 'no_show');
CREATE TYPE "TransactionType" AS ENUM ('purchase', 'booking', 'refund', 'expiry');

-- Users table
CREATE TABLE "users" (
    "id" SERIAL PRIMARY KEY,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "role" "UserRole" NOT NULL DEFAULT 'member',
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Children profiles
CREATE TABLE "children" (
    "id" SERIAL PRIMARY KEY,
    "parent_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "age" INTEGER NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Session packages (templates)
CREATE TABLE "session_packages" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL,
    "session_count" INTEGER NOT NULL,
    "price" DECIMAL(10, 2) NOT NULL,
    "expiry_days" INTEGER NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Member's purchased packages
CREATE TABLE "member_packages" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "package_id" INTEGER NOT NULL REFERENCES "session_packages"("id"),
    "sessions_remaining" INTEGER NOT NULL,
    "sessions_total" INTEGER NOT NULL,
    "purchase_date" TIMESTAMP NOT NULL,
    "expiry_date" TIMESTAMP NOT NULL,
    "is_expired" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Payments
CREATE TABLE "payments" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "package_id" INTEGER NOT NULL REFERENCES "session_packages"("id"),
    "amount" DECIMAL(10, 2) NOT NULL,
    "screenshot_path" VARCHAR(500) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "rejection_reason" TEXT,
    "reviewed_by" INTEGER REFERENCES "users"("id"),
    "reviewed_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Locations
CREATE TABLE "locations" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL,
    "address" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Class types
CREATE TABLE "class_types" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "duration_minutes" INTEGER NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Class instances (scheduled classes)
CREATE TABLE "class_instances" (
    "id" SERIAL PRIMARY KEY,
    "class_type_id" INTEGER NOT NULL REFERENCES "class_types"("id"),
    "coach_id" INTEGER NOT NULL REFERENCES "users"("id"),
    "location_id" INTEGER NOT NULL REFERENCES "locations"("id"),
    "start_time" TIMESTAMP NOT NULL,
    "end_time" TIMESTAMP NOT NULL,
    "capacity" INTEGER NOT NULL,
    "is_cancelled" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bookings
CREATE TABLE "bookings" (
    "id" SERIAL PRIMARY KEY,
    "class_instance_id" INTEGER NOT NULL REFERENCES "class_instances"("id") ON DELETE CASCADE,
    "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "child_id" INTEGER REFERENCES "children"("id") ON DELETE CASCADE,
    "member_package_id" INTEGER NOT NULL REFERENCES "member_packages"("id"),
    "status" "BookingStatus" NOT NULL DEFAULT 'confirmed',
    "booked_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMP,
    "attendance_marked_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("class_instance_id", "user_id", "child_id")
);

-- Credit transactions log
CREATE TABLE "credit_transactions" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "member_package_id" INTEGER NOT NULL REFERENCES "member_packages"("id"),
    "booking_id" INTEGER REFERENCES "bookings"("id"),
    "transaction_type" "TransactionType" NOT NULL,
    "credits_change" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization
CREATE INDEX "idx_bookings_user" ON "bookings"("user_id");
CREATE INDEX "idx_bookings_class" ON "bookings"("class_instance_id");
CREATE INDEX "idx_class_instances_time" ON "class_instances"("start_time");
CREATE INDEX "idx_payments_status" ON "payments"("status");
CREATE INDEX "idx_member_packages_user" ON "member_packages"("user_id");
CREATE INDEX "idx_member_packages_expiry" ON "member_packages"("expiry_date", "is_expired");
