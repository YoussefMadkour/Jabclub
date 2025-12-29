# JabClub Project Structure

## Overview
This document describes the complete project structure for the JabClub Booking System.

## Directory Structure

```
jabclub/
├── .kiro/                          # Kiro specs and configuration
│   └── specs/
│       └── jabclub-booking-system/
│           ├── requirements.md     # Feature requirements
│           ├── design.md          # System design
│           └── tasks.md           # Implementation tasks
│
├── backend/                        # Express.js API Server
│   ├── src/
│   │   ├── config/                # Configuration files
│   │   │   ├── database.ts        # Prisma client instance
│   │   │   └── env.ts             # Environment variables config
│   │   ├── controllers/           # Request handlers (to be added)
│   │   ├── middleware/            # Express middleware (to be added)
│   │   ├── routes/                # API route definitions (to be added)
│   │   ├── services/              # Business logic (to be added)
│   │   ├── utils/                 # Utility functions (to be added)
│   │   └── index.ts               # Express app entry point
│   ├── prisma/
│   │   └── schema.prisma          # Database schema (to be defined)
│   ├── .env                       # Environment variables (local)
│   ├── .env.example               # Environment variables template
│   ├── .gitignore                 # Git ignore rules
│   ├── nodemon.json               # Nodemon configuration
│   ├── package.json               # Backend dependencies
│   └── tsconfig.json              # TypeScript configuration
│
├── frontend/                       # Next.js Application
│   ├── app/                       # Next.js app router
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Home page
│   ├── components/                # React components
│   │   └── Providers.tsx          # React Query provider
│   ├── hooks/                     # Custom React hooks (to be added)
│   ├── lib/                       # Library configurations
│   │   ├── axios.ts               # Axios instance with interceptors
│   │   └── queryClient.ts         # React Query client
│   ├── utils/                     # Utility functions (to be added)
│   ├── .env.local                 # Environment variables (local)
│   ├── .env.local.example         # Environment variables template
│   ├── next.config.ts             # Next.js configuration
│   ├── package.json               # Frontend dependencies
│   ├── tailwind.config.ts         # TailwindCSS configuration
│   └── tsconfig.json              # TypeScript configuration
│
├── package.json                    # Root package.json with convenience scripts
├── README.md                       # Project documentation
└── PROJECT_STRUCTURE.md           # This file
```

## Technology Stack

### Backend Dependencies
- **express**: Web framework
- **cors**: CORS middleware
- **dotenv**: Environment variable management
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT authentication
- **multer**: File upload handling
- **express-validator**: Request validation
- **@prisma/client**: Prisma ORM client
- **prisma**: Prisma CLI (dev dependency)
- **typescript**: TypeScript compiler
- **ts-node**: TypeScript execution
- **nodemon**: Development server with hot reload

### Frontend Dependencies
- **next**: Next.js framework
- **react**: React library
- **react-dom**: React DOM
- **typescript**: TypeScript compiler
- **tailwindcss**: Utility-first CSS framework
- **@tanstack/react-query**: Server state management
- **axios**: HTTP client
- **date-fns**: Date manipulation library

## Key Configuration Files

### Backend
- **tsconfig.json**: TypeScript compiler options for Node.js
- **nodemon.json**: Auto-restart configuration for development
- **.env**: Environment variables (not committed to git)
- **prisma/schema.prisma**: Database schema definition

### Frontend
- **tsconfig.json**: TypeScript compiler options for Next.js
- **tailwind.config.ts**: TailwindCSS customization
- **next.config.ts**: Next.js configuration
- **.env.local**: Environment variables (not committed to git)

## Development Workflow

1. **Backend Development**:
   ```bash
   cd backend
   npm run dev  # Starts on port 5000
   ```

2. **Frontend Development**:
   ```bash
   cd frontend
   npm run dev  # Starts on port 3000
   ```

3. **Database Management**:
   ```bash
   cd backend
   npm run prisma:migrate    # Run migrations
   npm run prisma:generate   # Generate Prisma client
   npm run prisma:studio     # Open Prisma Studio
   ```

## Next Steps

The following components need to be implemented in subsequent tasks:

### Backend
- Database schema definition (Prisma)
- Authentication middleware
- Route handlers for all endpoints
- Business logic services
- Error handling middleware
- File upload configuration

### Frontend
- Authentication context and components
- Member dashboard
- Booking interface
- Admin panel
- Coach portal
- Shared UI components
- Custom hooks for API calls

## Environment Variables

### Required Backend Variables
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT signing
- `PORT`: Server port (default: 5000)
- `FRONTEND_URL`: Frontend URL for CORS

### Required Frontend Variables
- `NEXT_PUBLIC_API_URL`: Backend API URL

See `.env.example` files for complete list and descriptions.
