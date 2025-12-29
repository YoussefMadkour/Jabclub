# Quick Start Guide

## Initial Setup Complete ✅

The project structure has been initialized with:
- ✅ Next.js frontend with TypeScript and TailwindCSS
- ✅ Express backend with TypeScript
- ✅ Prisma ORM configured for PostgreSQL
- ✅ All core dependencies installed
- ✅ Environment variable templates created
- ✅ Project folder structure established

## What's Been Set Up

### Backend (`/backend`)
- Express server with TypeScript
- Prisma ORM configuration
- Environment variable management
- CORS and JSON middleware
- File upload directory structure
- Development server with hot reload (nodemon)

**Installed Dependencies:**
- express, cors, dotenv
- bcrypt, jsonwebtoken
- multer, express-validator
- @prisma/client, prisma

### Frontend (`/frontend`)
- Next.js 14+ with App Router
- TypeScript configuration
- TailwindCSS styling
- React Query for server state
- Axios with interceptors
- date-fns for date handling

**Installed Dependencies:**
- next, react, react-dom
- @tanstack/react-query
- axios, date-fns
- tailwindcss

## Next Steps

### 1. Configure Database

Edit `backend/.env` and update the `DATABASE_URL`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/jabclub?schema=public"
```

### 2. Define Database Schema

The next task will define the Prisma schema in `backend/prisma/schema.prisma` with all required tables:
- users
- children
- session_packages
- member_packages
- payments
- locations
- class_types
- class_instances
- bookings
- credit_transactions

### 3. Run Migrations

After the schema is defined:
```bash
cd backend
npm run prisma:migrate
npm run prisma:generate
```

### 4. Start Development Servers

**Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**Frontend:**
```bash
cd frontend
npm run dev
# App runs on http://localhost:3000
```

## Project Structure

```
jabclub/
├── backend/              # Express API
│   ├── src/
│   │   ├── config/      # Database & env config ✅
│   │   ├── controllers/ # Request handlers (pending)
│   │   ├── middleware/  # Auth & validation (pending)
│   │   ├── routes/      # API routes (pending)
│   │   ├── services/    # Business logic (pending)
│   │   └── utils/       # Helper functions (pending)
│   └── prisma/          # Database schema (pending)
│
└── frontend/            # Next.js App
    ├── app/            # Pages ✅
    ├── components/     # React components (pending)
    ├── hooks/          # Custom hooks (pending)
    ├── lib/            # Axios & React Query ✅
    └── utils/          # Helper functions (pending)
```

## Available Commands

### Root Level
```bash
npm run dev:backend      # Start backend dev server
npm run dev:frontend     # Start frontend dev server
npm run build:backend    # Build backend for production
npm run build:frontend   # Build frontend for production
```

### Backend
```bash
npm run dev              # Development server with hot reload
npm run build            # Compile TypeScript to JavaScript
npm start                # Run production build
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio GUI
```

### Frontend
```bash
npm run dev              # Development server
npm run build            # Production build
npm start                # Run production build
```

## Environment Variables

### Backend (`.env`)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT tokens
- `PORT` - Server port (default: 5000)
- `FRONTEND_URL` - Frontend URL for CORS

### Frontend (`.env.local`)
- `NEXT_PUBLIC_API_URL` - Backend API URL

## Testing the Setup

### Test Backend
```bash
cd backend
npm run dev
# Visit http://localhost:5000/health
# Should return: {"status":"ok","message":"JabClub API is running"}
```

### Test Frontend
```bash
cd frontend
npm run dev
# Visit http://localhost:3000
# Should display Next.js welcome page
```

## What's Next?

Proceed to **Task 2: Set up database schema and migrations** to define the complete database structure for the JabClub booking system.

See `tasks.md` for the full implementation plan.
