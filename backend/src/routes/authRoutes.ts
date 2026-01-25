import { Router } from 'express';
import { signup, login, logout, getCurrentUser } from '../controllers/authController';
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

export default router;
