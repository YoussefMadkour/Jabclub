import { Router } from 'express';
import { signup, login, logout, getCurrentUser } from '../controllers/authController';
import { signupValidation, loginValidation } from '../middleware/validators';

const router = Router();

// POST /api/auth/signup - Register new user
router.post('/signup', signupValidation, signup);

// POST /api/auth/login - Login user
router.post('/login', loginValidation, login);

// POST /api/auth/logout - Logout user
router.post('/logout', logout);

// GET /api/auth/me - Get current user
router.get('/me', getCurrentUser);

export default router;
