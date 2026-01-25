# JabClub - Boxing Gym Booking System 🥊

A full-stack web application for managing boxing gym bookings, member packages, class schedules, and payments. Built with Next.js, Express.js, TypeScript, and PostgreSQL.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Email Notifications](#email-notifications)
- [Deployment](#deployment)
  - [GitHub Setup](#github-setup)
  - [Vercel Deployment](#vercel-deployment)
- [Available Scripts](#available-scripts)
- [License](#license)

## ✨ Features

- **User Authentication**: Role-based access (Members, Coaches, Admins)
- **Session Package Management**: Purchase packages with payment screenshot upload
- **Class Booking System**: Book classes with credit management
- **Family Booking**: Book classes for children
- **Booking Cancellation**: Cancel bookings with automatic credit refund
- **Credit Expiry Tracking**: Automated expiry warnings and reminders
- **Coach Portal**: Mark attendance and manage class rosters
- **Admin Panel**: Payment approval, schedule management, and reporting
- **Automated Schedule Generation**: Recurring classes with default schedules
- **Email Notifications**: Automated email notifications for key events
- **Responsive Design**: Mobile and desktop optimized

## 🔒 Security Features

- **Rate Limiting**: Protection against brute force and abuse
  - **Auth endpoints** (login/signup): 5 requests per 15 minutes
  - **General API**: 100 requests per 15 minutes
  - **Current user check**: 30 requests per minute
  - Returns HTTP 429 with clear error messages when limits exceeded
- **Session-based Authentication**: Secure PostgreSQL-backed sessions
- **Password Hashing**: Bcrypt with salt rounds
- **Secure Cookies**: `httpOnly`, `secure`, `sameSite` flags enabled
- **CORS Protection**: Restricted to allowed origins
- **Input Validation**: Express validator for all user inputs
- **SQL Injection Protection**: Prisma ORM with parameterized queries

## 🛠 Tech Stack

### Frontend
- **Next.js 15+** (React 18+) - App Router
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **React Query** (@tanstack/react-query) - Server state management
- **Axios** - HTTP client
- **date-fns** - Date manipulation

### Backend
- **Node.js** with **Express.js**
- **TypeScript**
- **Prisma ORM** - Database management
- **PostgreSQL** - Database
- **Express Session** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File uploads
- **Nodemailer** - Email notifications
- **node-cron** - Scheduled jobs

## 📁 Project Structure

```
jabclub/
├── frontend/              # Next.js frontend application
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Library configurations
│   └── utils/           # Utility functions
│
└── backend/             # Express.js backend API
    ├── src/
    │   ├── routes/      # API route definitions
    │   ├── controllers/ # Request handlers
    │   ├── services/    # Business logic
    │   ├── middleware/  # Express middleware
    │   ├── config/      # Configuration files
    │   └── utils/       # Utility functions
    └── prisma/          # Database schema and migrations
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials and secrets
```

4. Set up database:
```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed initial data (optional)
npm run prisma:seed
```

5. Start development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

**Test Credentials:**
- Admin: `admin@jabclub.com` / `admin123`
- Coach: `coach@jabclub.com` / `coach123`
- Member: `member@jabclub.com` / `member123`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your backend API URL
```

4. Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🔐 Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/jabclub?schema=public"

# JWT & Session
JWT_SECRET="your-secret-key-min-32-chars"
JWT_EXPIRES_IN="24h"
SESSION_SECRET="your-session-secret-very-long-and-random"

# Server
PORT=5000
NODE_ENV="development"

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=5242880

# CORS
FRONTEND_URL="http://localhost:3000"

# Email (SMTP) - Using Gmail
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"          # Your regular Gmail address
SMTP_PASSWORD="your-app-password"        # Gmail App Password (16 chars, no spaces)
# Note: You need to enable 2FA and generate an App Password at:
# https://myaccount.google.com/apppasswords
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
```

## 📧 Email Notifications

The application sends automated email notifications for:

1. **Member Signup** - Welcome email when a new member signs up
2. **Package Purchase Approval** - Confirmation when admin approves a payment
3. **Package Purchase Receipt** - Receipt email sent when payment is approved
4. **Class Booking Confirmation** - Confirmation when a member books a class
5. **Package Expiry Warning** - Warning sent 7 days before package expiry (daily at 9 AM)
6. **Package Renewal Reminder** - Reminder sent 3 days before package expiry (daily at 10 AM)

See [NOTIFICATION_SETUP.md](./NOTIFICATION_SETUP.md) for detailed email configuration and flow documentation.

## 🚢 Deployment

### GitHub Setup

1. **Initialize Git Repository** (if not already initialized):
```bash
git init
```

2. **Create a GitHub Repository**:
   - Go to [GitHub](https://github.com/new)
   - Create a new repository named `jabclub` (or your preferred name)
   - **Do NOT** initialize with README, .gitignore, or license (we already have these)

3. **Add Remote and Push**:
```bash
# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/jabclub.git

# Stage all files
git add .

# Commit changes
git commit -m "Initial commit: JabClub booking system"

# Push to GitHub
git branch -M main
git push -u origin main
```

4. **Recommended Repository Settings**:
   - **Name**: `jabclub` or `jabclub-booking-system`
   - **Description**: `Full-stack boxing gym booking system with member management, class scheduling, and payment processing`
   - **Visibility**: Private (recommended) or Public
   - **Topics**: `nextjs`, `express`, `typescript`, `postgresql`, `prisma`, `booking-system`, `gym-management`

### Vercel Deployment

#### Prerequisites
- GitHub repository set up (see above)
- Vercel account ([sign up here](https://vercel.com/signup))

#### Frontend Deployment

1. **Import Project**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Select the `jabclub` repository

2. **Configure Project**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

3. **Environment Variables**:
   Add the following environment variables in Vercel:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-api.com/api
   ```
   Replace `https://your-backend-api.com/api` with your backend API URL.

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete
   - Your frontend will be live at `https://your-project.vercel.app`

#### Backend Deployment on Vercel

**Yes, you can deploy your Express.js backend on Vercel!** The configuration files are already set up.

1. **Import Backend Project**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Select the `jabclub` repository

2. **Configure Backend Project**:
   - **Framework Preset**: Other (or Express.js if available)
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build` (or leave empty, Vercel will auto-detect)
   - **Output Directory**: Leave empty (not needed for Express)
   - **Install Command**: `npm install` (default)

3. **Environment Variables**:
   Add all backend environment variables in Vercel (see Backend Environment Variables section below)

4. **Important Notes for Vercel Backend**:
   - File uploads: Vercel has a 4.5MB limit for serverless functions. For larger files, consider using Vercel Blob Storage or an external service like Cloudinary
   - Cron jobs: Use [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) instead of node-cron for scheduled tasks
   - Sessions: Consider using a database-backed session store (like Redis) for production
   - Database: Use a managed PostgreSQL service (Vercel Postgres, Supabase, or Railway)

5. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete
   - Your backend will be live at `https://your-backend-project.vercel.app`

**Note**: The backend is configured in `backend/vercel.json` and `backend/api/index.ts` to work with Vercel's serverless functions.

#### Alternative Backend Deployment Options

If you prefer a traditional server environment:

1. **Railway** (Recommended for Express.js):
   - Go to [Railway](https://railway.app)
   - Connect your GitHub repository
   - Select the `backend` directory
   - Add environment variables
   - Deploy

3. **Render**:
   - Go to [Render](https://render.com)
   - Create a new Web Service
   - Connect your GitHub repository
   - Set root directory to `backend`
   - Add environment variables
   - Deploy

4. **Heroku**:
   - Go to [Heroku](https://heroku.com)
   - Create a new app
   - Connect GitHub repository
   - Set buildpack to Node.js
   - Add environment variables
   - Deploy

#### Backend Environment Variables for Production

When deploying the backend, ensure these environment variables are set:

```env
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-production-jwt-secret"
SESSION_SECRET="your-production-session-secret"
PORT=5000
NODE_ENV="production"
FRONTEND_URL="https://your-frontend.vercel.app"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"          # Your regular Gmail address
SMTP_PASSWORD="your-app-password"         # Gmail App Password (16 chars, no spaces)
# Note: Enable 2FA and generate App Password at: https://myaccount.google.com/apppasswords
```

#### Database Setup for Production

For production, use a managed PostgreSQL service:

1. **Vercel Postgres** (if using Vercel):
   - Add Postgres database in Vercel dashboard
   - Use the connection string as `DATABASE_URL`

2. **Supabase** (Recommended):
   - Go to [Supabase](https://supabase.com)
   - Create a new project
   - Get the connection string from Settings → Database
   - Use as `DATABASE_URL`

3. **Railway Postgres**:
   - Add Postgres service in Railway
   - Use the connection string as `DATABASE_URL`

4. **Run Migrations**:
```bash
# In your backend deployment
npx prisma migrate deploy
npx prisma generate
```

#### Post-Deployment Checklist

- [ ] Backend API is accessible
- [ ] Frontend can connect to backend API
- [ ] Database migrations are applied
- [ ] Environment variables are set correctly
- [ ] Email notifications are configured
- [ ] File uploads directory has proper permissions
- [ ] CORS is configured correctly
- [ ] SSL/HTTPS is enabled

## 📜 Available Scripts

### Backend

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed database with initial data
- `npm run prisma:studio` - Open Prisma Studio (GUI for database)
- `npm run setup` - Initial setup: seeds database and generates current month's schedule
- `npm run schedule:generate` - Generate class schedule for a specific month
- `npm run schedule:next-month` - Generate class schedule for next month

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run linter
- `npm run format` - Format code

## 📚 Additional Documentation

- [NOTIFICATION_SETUP.md](./NOTIFICATION_SETUP.md) - Email notification setup and flow documentation
- [backend/DATABASE_SETUP.md](./backend/DATABASE_SETUP.md) - Database setup guide
- [backend/QUICK_START_DB.md](./backend/QUICK_START_DB.md) - Quick database start guide
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Detailed project structure

## 📝 License

ISC

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For support, email support@jabclub.com or open an issue on GitHub.

---

**Built with ❤️ for boxing gyms**
