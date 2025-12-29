#!/bin/bash

# Production Database Migration Script
# This script runs database migrations in production environment

set -e  # Exit on error

echo "=========================================="
echo "JabClub Production Database Migration"
echo "=========================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file from .env.production.example"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Verify DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not set in .env file"
    exit 1
fi

echo "📋 Current environment: $NODE_ENV"
echo "🗄️  Database: $(echo $DATABASE_URL | sed 's/:.*//' | sed 's/.*@//')"
echo ""

# Confirm before proceeding
read -p "⚠️  This will run migrations on the production database. Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Migration cancelled."
    exit 0
fi

echo ""
echo "🔄 Generating Prisma Client..."
npx prisma generate

echo ""
echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo ""
echo "✅ Migration completed successfully!"
echo ""
echo "📊 To view database status, run: npx prisma migrate status"
