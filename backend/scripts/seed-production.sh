#!/bin/bash

# Production Database Seeding Script
# This script seeds initial data in production environment

set -e  # Exit on error

echo "=========================================="
echo "JabClub Production Database Seeding"
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
read -p "⚠️  This will seed data in the production database. Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Seeding cancelled."
    exit 0
fi

echo ""
echo "🌱 Seeding database..."
npx ts-node prisma/seed.ts

echo ""
echo "✅ Seeding completed successfully!"
echo ""
echo "📝 Default admin credentials:"
echo "   Email: admin@jabclub.com"
echo "   Password: Admin123!"
echo ""
echo "⚠️  IMPORTANT: Change the admin password immediately after first login!"
