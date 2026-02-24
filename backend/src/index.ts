import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import passport from './config/passport';
import prisma from './config/database';
import { initializeExpiryScheduler } from './services/expiryService';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Session store configuration - use PostgreSQL for serverless compatibility
const PgSession = connectPgSimple(session);
const isVercelServerless = !!process.env.VERCEL || !!process.env.VERCEL_ENV;

// Determine cookie domain for cross-subdomain support
// For production: use .jabclubegy.com to allow cookies across app.jabclubegy.com and api.jabclubegy.com
// For local dev: undefined (browser will set it automatically)
const getCookieDomain = (): string | undefined => {
  if (isVercelServerless) {
    // Extract domain from FRONTEND_URL or use default
    const frontendUrl = process.env.FRONTEND_URL || '';
    if (frontendUrl.includes('jabclubegy.com')) {
      return '.jabclubegy.com'; // Leading dot allows subdomain sharing
    }
  }
  return undefined; // Local development - let browser handle it
};

// Create session store with error handling
let sessionStore: connectPgSimple.PGStore | undefined;
if (isVercelServerless) {
  try {
    sessionStore = new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: 'user_sessions',
      createTableIfMissing: true,
      pruneSessionInterval: false, // Disable automatic pruning in serverless
      schemaName: 'public',
    });

    sessionStore.on('error', (error: Error) => {
      console.error('Session store error:', error);
    });
  } catch (error) {
    console.error('❌ Failed to create PostgreSQL session store:', error);
    // Fallback to MemoryStore if PostgreSQL store fails
    sessionStore = undefined;
  }
}


// Session configuration
const sessionConfig: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  name: 'jabclub.sid', // Custom session cookie name (default is 'connect.sid')
  store: sessionStore, // Use PostgreSQL store in serverless, MemoryStore in local dev
  proxy: true, // Trust Vercel's proxy for secure cookies
  cookie: {
    secure: process.env.NODE_ENV === 'production' || !!process.env.VERCEL, // Use secure cookies in production/Vercel
    httpOnly: true, // Prevent XSS attacks
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: isVercelServerless ? 'none' : 'lax', // 'none' required for cross-domain cookies with secure=true
    domain: getCookieDomain(), // Set domain for cross-subdomain cookies
    path: '/', // Cookie available for all paths
  }
};

app.use(session(sessionConfig));

// Initialize Passport.js for OAuth authentication
app.use(passport.initialize());
app.use(passport.session());


// Trust Vercel's proxy for secure cookies and correct req.protocol
// This is CRITICAL for cookies to work properly in Vercel
app.set('trust proxy', 1);


// Middleware - CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3001', // Allow the frontend running on port 3001
  'https://app.jabclubegy.com', // Production frontend
  'https://www.app.jabclubegy.com' // With www prefix
].filter(Boolean); // Remove any undefined values

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow exact matches
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow Vercel preview URLs (e.g., https://jabclub-xxx.vercel.app)
    if (origin.includes('.vercel.app')) {
      console.log('✅ Allowing Vercel preview URL:', origin);
      return callback(null, true);
    }
    
    console.warn(`CORS blocked origin: ${origin}`);
    callback(null, true); // Allow all origins in production for now (can be restricted later)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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

// Health check endpoint (no rate limiting)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'JabClub API is running' });
});

// Import rate limiters
import { generalRateLimiter } from './middleware/rateLimiter';

// Apply global rate limiter to all /api routes
// This prevents abuse while being lenient enough for normal use
// Individual routes can have stricter rate limits
app.use('/api', generalRateLimiter);

// Import routes
import authRoutes from './routes/authRoutes';
import memberRoutes from './routes/memberRoutes';
import adminRoutes from './routes/adminRoutes';
import classRoutes from './routes/classRoutes';
import coachRoutes from './routes/coachRoutes';
import qrRoutes from './routes/qrRoutes';

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'JabClub API v1.0' });
});

// Auth routes (have their own stricter rate limiting)
app.use('/api/auth', authRoutes);

// Member routes
app.use('/api/members', memberRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Class routes
app.use('/api/classes', classRoutes);

// Coach routes
app.use('/api/coach', coachRoutes);

// QR code routes
app.use('/api/qr', qrRoutes);

// Import error handling middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// 404 handler for undefined routes (must be after all other routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Initialize expiry scheduler
initializeExpiryScheduler();

// Initialize schedule generation - runs daily to ensure classes are always 2 months ahead
// Only run in non-serverless environments (Vercel serverless functions have limited time)
// In serverless, this would cause timeouts - use Vercel Cron Jobs instead
if (process.env.VERCEL !== '1' && process.env.VERCEL_ENV !== 'production') {
  // Only run in local development
  const { generateClassesFromSchedules } = require('./services/scheduleService');
  const cron = require('node-cron');
  
  // Generate classes on server startup (non-blocking, fire and forget)
  setImmediate(() => {
    generateClassesFromSchedules(2).catch(err => {
      console.error('Error generating initial classes:', err);
    });
  });

  // Run daily at 2 AM to generate classes for the next 2 months
  cron.schedule('0 2 * * *', async () => {
    console.log('Running daily schedule generation...');
    try {
      await generateClassesFromSchedules(2);
      console.log('✅ Daily schedule generation completed');
    } catch (error) {
      console.error('❌ Error in daily schedule generation:', error);
    }
  });
}

// Start server only if not running on Vercel (Vercel handles serverless functions)
if (process.env.VERCEL !== '1') {
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
  console.log(`📅 Schedule generation: Automatic (daily at 2 AM)`);
});
}

export default app;
