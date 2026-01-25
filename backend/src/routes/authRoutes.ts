import { Router } from 'express';
import passport from 'passport';
import { signup, login, logout, getCurrentUser, googleAuthCallback } from '../controllers/authController';
import { signupValidation, loginValidation } from '../middleware/validators';
import { authRateLimiter, currentUserRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// POST /api/auth/signup - Register new user
// Rate limited to prevent spam registrations
router.post('/signup', authRateLimiter, signupValidation, signup);

// POST /api/auth/login - Login user
// Rate limited to prevent brute force attacks
router.post('/login', authRateLimiter, loginValidation, login);

// POST /api/auth/logout - Logout user
router.post('/logout', logout);

// GET /api/auth/me - Get current user
// Rate limited but more lenient as it's called frequently
router.get('/me', currentUserRateLimiter, getCurrentUser);

// Google OAuth routes
// GET /api/auth/google - Initiate Google OAuth
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'OAUTH_NOT_CONFIGURED',
        message: 'Google OAuth is not configured. Please contact support.'
      }
    });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// GET /api/auth/google/callback - Google OAuth callback
router.get('/google/callback', 
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.redirect('/login?error=oauth_not_configured');
    }
    passport.authenticate('google', { failureRedirect: '/login?error=google_auth_failed' })(req, res, next);
  },
  googleAuthCallback
);

export default router;
