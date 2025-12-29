import { Router } from 'express';
import { getSchedule, getClassAvailability } from '../controllers/classController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All class routes require authentication
router.use(authenticate);

// GET /api/classes/schedule - Get class schedule with filters
router.get('/schedule', getSchedule);

// GET /api/classes/:id/availability - Get class availability
router.get('/:id/availability', getClassAvailability);

export default router;
