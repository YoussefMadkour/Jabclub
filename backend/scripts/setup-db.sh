#!/bin/bash

# JabClub Database Setup Script
# This script helps set up the PostgreSQL database for development

set -e

echo "🥊 JabClub Database Setup"
echo "========================="
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed or not in PATH"
    echo "Please install PostgreSQL 14+ and try again"
    exit 1
fi

echo "✓ PostgreSQL found"

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running"
    echo "Please start PostgreSQL and try again"
    echo ""
    echo "macOS: brew services start postgresql@14"
    echo "Linux: sudo systemctl start postgresql"
    exit 1
fi

echo "✓ PostgreSQL is running"
echo ""

# Prompt for database credentials
read -p "Enter PostgreSQL username [postgres]: " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "Enter PostgreSQL password: " DB_PASSWORD
echo ""

read -p "Enter database name [jabclub]: " DB_NAME
DB_NAME=${DB_NAME:-jabclub}

read -p "Enter database host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Enter database port [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

echo ""
echo "Creating database..."

# Create database
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -h $DB_HOST -p $DB_PORT -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -h $DB_HOST -p $DB_PORT -c "CREATE DATABASE $DB_NAME"

echo "✓ Database '$DB_NAME' ready"
echo ""

# Update .env file
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?schema=public"

if [ -f .env ]; then
    # Backup existing .env
    cp .env .env.backup
    echo "✓ Backed up existing .env to .env.backup"
fi

# Update DATABASE_URL in .env
if grep -q "DATABASE_URL=" .env 2>/dev/null; then
    # Update existing line
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" .env
    else
        sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" .env
    fi
else
    # Add new line
    echo "DATABASE_URL=\"$DATABASE_URL\"" >> .env
fi

echo "✓ Updated .env file"
echo ""

# Run migrations
echo "Running database migrations..."
npm run prisma:generate
npm run prisma:migrate

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Test credentials:"
echo "  Admin: admin@jabclub.com / admin123"
echo "  Coach: coach@jabclub.com / coach123"
echo "  Member: member@jabclub.com / member123"
echo ""
echo "To view the database, run: npm run prisma:studio"
