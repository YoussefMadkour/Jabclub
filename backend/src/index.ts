import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
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
    console.log('🔧 Creating PostgreSQL session store...');
    console.log('🔧 DATABASE_URL:', process.env.DATABASE_URL ? 'present' : 'missing');
    
    sessionStore = new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: 'user_sessions', // Custom table name
      createTableIfMissing: true, // Auto-create session table
      pruneSessionInterval: false, // Disable automatic pruning in serverless
      schemaName: 'public', // Explicitly set schema
    });
    
    // Add error handlers for the session store
    sessionStore.on('connect', () => {
      console.log('✅ PostgreSQL session store connected');
    });
    
    sessionStore.on('error', (error: Error) => {
      console.error('❌ PostgreSQL session store error:', error);
    });
    
    // CRITICAL: Wrap get method BEFORE passing to express-session
    // This ensures express-session uses our wrapped version
    const originalGet = sessionStore.get.bind(sessionStore);
    const wrappedGet = function(sessionId: string, callback: (err: any, session?: any) => void) {
      console.log('🔍 Loading session from PostgreSQL:', {
        sessionId,
        timestamp: new Date().toISOString(),
      });
      originalGet(sessionId, (err, session) => {
        if (err) {
          console.error('❌ Error loading session:', err);
          return callback(err);
        }
        if (session) {
          console.log('✅ Session loaded from PostgreSQL:', {
            sessionId,
            userId: session.userId,
            role: session.role,
            cookie: session.cookie,
          });
        } else {
          console.warn('⚠️ Session not found in PostgreSQL:', sessionId);
        }
        callback(null, session);
      });
    };
    sessionStore.get = wrappedGet;
    
    // Log when sessions are saved
    const originalSet = sessionStore.set.bind(sessionStore);
    sessionStore.set = function(sessionId: string, session: any, callback?: (err?: any) => void) {
      console.log('💾 Saving session to PostgreSQL:', {
        sessionId,
        userId: session.userId,
        role: session.role,
      });
      originalSet(sessionId, session, callback);
    };
    
    // Also wrap destroy and touch methods for completeness
    const originalDestroy = sessionStore.destroy?.bind(sessionStore);
    if (originalDestroy) {
      sessionStore.destroy = function(sessionId: string, callback?: (err?: any) => void) {
        console.log('🗑️ Destroying session:', sessionId);
        originalDestroy(sessionId, callback);
      };
    }
    
    console.log('✅ PostgreSQL session store created successfully');
  } catch (error) {
    console.error('❌ Failed to create PostgreSQL session store:', error);
    // Fallback to MemoryStore if PostgreSQL store fails
    sessionStore = undefined;
  }
}

// Add middleware to parse cookies BEFORE session middleware
// This ensures cookies are available for express-session to read
app.use((req, res, next) => {
  // Log incoming cookies for debugging
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const sessionCookie = cookieHeader.split(';').find(c => c.trim().startsWith('jabclub.sid='));
    if (sessionCookie) {
      const rawCookieValue = sessionCookie.split('=')[1]?.trim();
      // express-session signs cookies as s:<sessionId>.<signature>
      // If cookie starts with 's:', it's signed
      const isSigned = rawCookieValue?.startsWith('s:');
      const sessionId = isSigned ? rawCookieValue.split('.')[0]?.substring(2) : rawCookieValue;
      console.log('🍪 Cookie found in request:', {
        cookieHeader: cookieHeader.substring(0, 100) + '...',
        sessionCookie: sessionCookie,
        rawValue: rawCookieValue,
        isSigned: isSigned,
        sessionId: sessionId,
        url: req.url,
        method: req.method,
      });
    }
  }
  next();
});

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

// Add middleware to log session info and fix session loading - MUST be after session middleware
app.use((req, res, next) => {
  // Log session info on every request (always log in production for debugging)
  const cookieHeader = req.headers.cookie;
  const sessionCookie = cookieHeader?.split(';').find(c => c.trim().startsWith('jabclub.sid='));
  const rawCookieValue = sessionCookie?.split('=')[1]?.trim();
  
  // Parse signed cookie: express-session uses format s:<sessionId>.<signature>
  const isSigned = rawCookieValue?.startsWith('s:');
  const sessionCookieValue = isSigned ? rawCookieValue?.split('.')[0]?.substring(2) : rawCookieValue;
  
  // Check if session store is actually being used
  const storeType = req.sessionStore?.constructor?.name || 'unknown';
  
  console.log('📋 Request session info:', {
    sessionID: req.sessionID,
    cookieSessionID: sessionCookieValue,
    sessionIDsMatch: req.sessionID === sessionCookieValue,
    hasSession: !!req.session,
    userId: req.session?.userId,
    role: req.session?.role,
    cookieHeader: cookieHeader ? 'present' : 'missing',
    sessionCookie: sessionCookie ? sessionCookie.substring(0, 50) + '...' : 'not found',
    isSigned: isSigned,
    url: req.url,
    method: req.method,
    sessionKeys: req.session ? Object.keys(req.session) : [],
    storeType: storeType,
    hasStore: !!req.sessionStore,
  });
  
  next();
});

// Trust Vercel's proxy for secure cookies and correct req.protocol
// This is CRITICAL for cookies to work properly in Vercel
app.set('trust proxy', 1);

// Add middleware to log response headers (for debugging cookie issues)
app.use((req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;
  
  const logHeaders = () => {
    const setCookie = res.getHeader('Set-Cookie');
    if (setCookie && req.url.includes('/auth/')) {
      console.log('🍪 Response Set-Cookie header:', {
        url: req.url,
        method: req.method,
        statusCode: res.statusCode,
        setCookie: Array.isArray(setCookie) ? setCookie : [setCookie]
      });
    }
  };
  
  res.send = function(body) {
    logHeaders();
    return originalSend.call(this, body);
  };
  
  res.json = function(body) {
    logHeaders();
    return originalJson.call(this, body);
  };
  
  next();
});

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
