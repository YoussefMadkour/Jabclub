#!/bin/bash

# JabClub Deployment Script
# This script builds and deploys the application

set -e  # Exit on error

echo "=========================================="
echo "JabClub Deployment Script"
echo "=========================================="
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ Error: PM2 is not installed"
    echo "Install PM2: npm install -g pm2"
    exit 1
fi

# Function to check if directory exists
check_directory() {
    if [ ! -d "$1" ]; then
        echo "❌ Error: Directory $1 not found"
        exit 1
    fi
}

# Check required directories
check_directory "backend"
check_directory "frontend"

echo "📦 Step 1: Installing dependencies..."
echo ""

# Backend dependencies
echo "Installing backend dependencies..."
cd backend
npm ci --production=false
cd ..

# Frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm ci --production=false
cd ..

echo ""
echo "🔨 Step 2: Building applications..."
echo ""

# Build backend
echo "Building backend..."
cd backend
npm run build
cd ..

# Build frontend
echo "Building frontend..."
cd frontend
npm run build
cd ..

echo ""
echo "🗄️  Step 3: Running database migrations..."
echo ""
cd backend
npx prisma generate
npx prisma migrate deploy
cd ..

echo ""
echo "🚀 Step 4: Starting/Restarting PM2 processes..."
echo ""

# Stop existing processes if running
pm2 delete ecosystem.config.js 2>/dev/null || true

# Start processes
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Process status:"
pm2 status

echo ""
echo "📝 Useful commands:"
echo "   View logs:        pm2 logs"
echo "   Monitor:          pm2 monit"
echo "   Restart:          pm2 restart ecosystem.config.js"
echo "   Stop:             pm2 stop ecosystem.config.js"
echo "   View status:      pm2 status"
