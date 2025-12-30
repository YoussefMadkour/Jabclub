import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import session from 'express-session';
import { PrismaClient } from '@prisma/client';
import { initializeExpiryScheduler } from './services/expiryService';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true, // Prevent XSS attacks
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3001' // Allow the frontend running on port 3001
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads (only in non-serverless environments)
// Vercel sets VERCEL=1 in all environments
const isServerless = !!process.env.VERCEL || 
                     !!process.env.VERCEL_ENV || 
                     process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;

if (!isServerless) {
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  console.log('Serving uploads from:', path.resolve(uploadDir));

  // Create a custom middleware to handle uploads with proper headers
  app.use('/uploads', (req, res, next) => {
    // Set CORS headers for both possible frontend ports
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3001'
    ];
    const origin = req.headers.origin;
    
    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    // Continue to static middleware
    express.static(path.resolve(uploadDir))(req, res, next);
  });
} else {
  // In serverless, files are stored in /tmp and are ephemeral
  // For production, consider using cloud storage (S3, Vercel Blob, etc.)
  console.log('Serverless environment detected - static file serving disabled');
  app.use('/uploads', (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'File serving not available in serverless environment. Files are stored temporarily in /tmp.'
      }
    });
  });
}

// Root endpoint - API info
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'JabClub API is running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      docs: 'See API documentation for available endpoints'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'JabClub API is running' });
});

// Import routes
import authRoutes from './routes/authRoutes';
import memberRoutes from './routes/memberRoutes';
import adminRoutes from './routes/adminRoutes';
import classRoutes from './routes/classRoutes';
import coachRoutes from './routes/coachRoutes';

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'JabClub API v1.0' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Member routes
app.use('/api/members', memberRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Class routes
app.use('/api/classes', classRoutes);

// Coach routes
app.use('/api/coach', coachRoutes);

// Import error handling middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// 404 handler for undefined routes (must be after all other routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Initialize expiry scheduler
initializeExpiryScheduler();

// Initialize schedule generation - runs daily to ensure classes are always 2 months ahead
import { generateClassesFromSchedules } from './services/scheduleService';
import cron from 'node-cron';

// Generate classes on server startup
generateClassesFromSchedules(2).catch(err => {
  console.error('Error generating initial classes:', err);
});

// Run daily at 2 AM to generate classes for the next 2 months
// This ensures classes are always available and automatically generated each month
cron.schedule('0 2 * * *', async () => {
  console.log('Running daily schedule generation...');
  try {
    await generateClassesFromSchedules(2);
    console.log('✅ Daily schedule generation completed');
  } catch (error) {
    console.error('❌ Error in daily schedule generation:', error);
  }
});

// Start server only if not running on Vercel (Vercel handles serverless functions)
if (process.env.VERCEL !== '1') {
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
  console.log(`📅 Schedule generation: Automatic (daily at 2 AM)`);
});
}

export default app;
