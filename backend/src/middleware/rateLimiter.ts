import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication endpoints (login, signup)
 * Prevents brute force attacks
 * 
 * Limits: 5 requests per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login/signup attempts. Please try again in 15 minutes.'
    }
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for successful requests (only count failed attempts)
  skipSuccessfulRequests: false,
  // Don't count requests that result in 4xx or 5xx errors
  skipFailedRequests: false,
});

/**
 * Rate limiter for general API endpoints
 * More lenient than auth limiter
 * 
 * Limits: 100 requests per 15 minutes per IP
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for password reset endpoints
 * Very strict to prevent abuse
 * 
 * Limits: 3 requests per hour per IP
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per hour
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many password reset attempts. Please try again in an hour.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for current user endpoint (/me)
 * Very lenient as this is called frequently
 * 
 * Limits: 30 requests per minute per IP
 */
export const currentUserRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please slow down.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});
